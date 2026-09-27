// Fly by Night Airline Booking — JavaScript port of my Sun Certified Java Developer assignment
// (Mihailo Despotovic, 2000-2001). The original had three programs: a database server reached over
// Java RMI, a Swing client for searching flights and booking seats, and a converter from the legacy
// ASCII flight list to the binary database format. The point of the assignment was the record
// locking that lets many clients book seats on one database at the same time.
//
// A browser can't run an RMI server, so this page puts two clients side by side on one shared
// database, the way two clients shared the server's single Data object. The database engine reads
// and writes Sun's original binary "db" file (db-data.js), byte for byte, from an array in memory.
//
// Bugs fixed from the original:
//  1. The server could freeze: its one shared remote object had synchronized lock() and unlock(),
//     so a client waiting for a locked record kept every other client, including the lock's owner,
//     out of unlock(). Here waiting for a lock is asynchronous and blocks nobody else.
//  2. The client locked the flight's row number in its table instead of its record number, so two
//     clients looking at different search results didn't keep each other out of the same record.
//  3. The "enough seats?" check ran before the lock and wasn't repeated after it, so two clients
//     booking the last seats at once drove the count below zero. Now the record is reread and
//     checked after the lock.
//  4. find() compared the stored fields with their padding bytes left on, so a search for a value
//     shorter than its field (e.g. Carrier='SpeedyAir') never matched anything.
//  5. lock() and unlock() accepted record 0, which doesn't exist (records are numbered from 1),
//     and unlocking the whole database when it wasn't locked crashed.

// ---- DatabaseException, FieldInfo, DataInfo (Sun's supporting classes) ----

class DatabaseException extends Error {
    toString() { return "suncertify.db.DatabaseException: " + this.message; }
}

class FieldInfo {
    constructor(name, length) { this.name = name; this.length = length; }
    getName() { return this.name; }
    getLength() { return this.length; }
}

class DataInfo {
    constructor(recordNumber, fields, values) {
        this.recordNumber = recordNumber;
        this.fields = fields;
        this.values = values;
    }
    getRecordNumber() { return this.recordNumber; }
    getValues() { return this.values; }
}

// ---- Fields: the Fly by Night schema ----

const FIELDS = [
    ["FlightNumber", 5], ["OriginAirport", 3], ["DestinationAirport", 3], ["Carrier", 30],
    ["Price", 5], ["Day", 3], ["Time", 5], ["Duration", 6], ["AvailableSeats", 3],
];
const Fields = {
    getFieldInfo: () => FIELDS.map(([name, length]) => new FieldInfo(name, length)),
    getFieldNames: () => FIELDS.map(([name]) => name),
};

// Java's String.trim(): strips everything up to and including space, so also the NUL padding
const javaTrim = s => s.replace(/^[\x00-\x20]+|[\x00-\x20]+$/g, "");

// ---- A growable byte array with the RandomAccessFile calls that Data uses ----

class ByteFile {
    constructor(bytes = new Uint8Array(0)) {
        this.buf = new Uint8Array(Math.max(64, bytes.length));
        this.buf.set(bytes);
        this.len = bytes.length;
        this.pos = 0;
    }
    length() { return this.len; }
    getFilePointer() { return this.pos; }
    seek(pos) { this.pos = pos; }
    bytes() { return this.buf.slice(0, this.len); }

    read(buffer) {
        const n = Math.max(0, Math.min(buffer.length, this.len - this.pos));
        buffer.set(this.buf.subarray(this.pos, this.pos + n));
        this.pos += n;
        return n;
    }
    write(bytes) {
        if (typeof bytes === "number") bytes = [bytes];
        const end = this.pos + bytes.length;
        if (end > this.buf.length) {
            const bigger = new Uint8Array(Math.max(end, this.buf.length * 2));
            bigger.set(this.buf);
            this.buf = bigger;
        }
        this.buf.set(bytes, this.pos);
        this.pos = end;
        this.len = Math.max(this.len, end);
    }
    readInt() {
        if (this.pos + 4 > this.len) throw new Error("java.io.EOFException");
        const v = new DataView(this.buf.buffer).getInt32(this.pos);
        this.pos += 4;
        return v;
    }
    writeInt(v) {
        const b = new Uint8Array(4);
        new DataView(b.buffer).setInt32(0, v);
        this.write(b);
    }
    // field names are plain ASCII, where Java's modified UTF-8 is the same as ASCII
    readUTF() {
        if (this.pos + 2 > this.len) throw new Error("java.io.EOFException");
        const n = (this.buf[this.pos] << 8) | this.buf[this.pos + 1];
        this.pos += 2;
        const b = new Uint8Array(n);
        this.read(b);
        return bytesToString(b);
    }
    writeUTF(s) {
        const b = stringToBytes(s);
        this.write([b.length >> 8, b.length & 0xff]);
        this.write(b);
    }
}

// Java's new String(bytes) and getBytes() with a single-byte platform charset
const bytesToString = b => String.fromCharCode(...b);
const stringToBytes = s => Uint8Array.from(s, c => c.charCodeAt(0) & 0xff);

// ---- DatabaseLock: record and whole-database locks, one instance shared by all Data objects ----
// Java's wait() and notifyAll() become promises: a waiting client awaits, and every change wakes
// all waiters to check again. JavaScript runs one piece of code at a time, so each check-and-take
// is as atomic as the original synchronized methods.

class DatabaseLock {
    constructor() {
        this.lockedRecords = new Map(); // record -> clientId
        this.locker = null;              // the client who locked the whole database
        this.waiters = [];
        this.onChange = () => {};
    }
    wait() { return new Promise(resolve => this.waiters.push(resolve)); }
    notifyAll() {
        const waiters = this.waiters;
        this.waiters = [];
        for (const resolve of waiters) resolve();
        this.onChange();
    }

    async lockDb(clientId) {
        while ((this.locker !== null && this.locker !== clientId) || this.thereAreForeignLocks(clientId)) {
            await this.wait();
        }
        this.locker = clientId;
        this.notifyAll();
    }

    unlockDb(clientId) {
        if (this.locker !== clientId) {
            this.notifyAll();
            throw new DatabaseException(this.locker === null ? "DB Not Locked!" : "DB Already Locked!");
        }
        this.locker = null;
        this.lockedRecords.clear(); // clear row level locks
        this.notifyAll();
    }

    async lockRow(clientId, row) {
        while ((this.locker !== null && this.locker !== clientId) ||                       // db locked by someone else
               (this.lockedRecords.has(row) && this.lockedRecords.get(row) !== clientId)) { // record locked by someone else
            await this.wait();
        }
        // maybe I already locked whole db? maybe I already locked this record?
        if (this.locker !== clientId && !this.lockedRecords.has(row)) this.lockedRecords.set(row, clientId);
        this.notifyAll();
    }

    unlockRow(clientId, row) {
        // db locked by someone else?
        if (this.locker !== null && this.locker !== clientId) {
            this.notifyAll();
            throw new DatabaseException("DB Already Locked!");
        }
        // db is not locked by me, check row level; ignore an attempt to remove a lock that isn't mine
        if (this.locker === null && this.lockedRecords.get(row) === clientId) this.lockedRecords.delete(row);
        this.notifyAll();
    }

    thereAreForeignLocks(clientId) {
        for (const owner of this.lockedRecords.values()) if (owner !== clientId) return true;
        return false;
    }

    ownerOf(record) { return this.locker ?? this.lockedRecords.get(record) ?? null; }
}

// ---- Data: the database engine ----
// File layout: header length, field count, record count, then each field's name and length,
// then the magic number 0xC0C0BABE. Each record is a flag byte (0 live, 1 deleted) followed by
// the fields, padded with zero bytes to their fixed lengths. Records are numbered from 1.

const WILD_CHARACTER = "*";
const LIVE_RECORD = 0;
const DELETED_RECORD = 1;
const MAGIC = 0xC0C0BABE | 0;
const UNEXPECTED = "Data: Unexpected database access problem";

class Data {
    // Static lock: all instances of Data share the same lock
    static lock = new DatabaseLock();

    // opens an existing database, like new Data(dbname)
    constructor(file) {
        this.db = file;
        this.recordLen = 1;
        this.headerLen = file.readInt();
        if (this.headerLen > file.length() || this.headerLen < 0) {
            throw new Error("Data: corrupted database file. Invalid header length (probably not a Fly by Night file)");
        }
        const nFields = file.readInt();
        this.recordCount = file.readInt();
        this.description = [];
        for (let i = 0; i < nFields; i++) {
            this.description.push(new FieldInfo(file.readUTF(), file.readInt()));
            this.recordLen += this.description[i].getLength();
        }
        if (file.readInt() !== MAGIC) throw new Error("Data: corrupted database file. Magic not found");
        if (file.getFilePointer() !== this.headerLen) throw new Error("Data: corrupted database file. Header length incorrect");
    }

    // creates a new, empty database, like new Data(dbname, fields)
    static create(fields) {
        const db = new ByteFile();
        db.writeInt(0); // filler for header length
        db.writeInt(fields.length);
        db.writeInt(0);
        for (const f of fields) {
            db.writeUTF(f.getName());
            db.writeInt(f.getLength());
        }
        db.writeInt(MAGIC);
        const headerLen = db.getFilePointer();
        db.seek(0);
        db.writeInt(headerLen);
        db.seek(0);
        return new Data(db);
    }

    getFieldInfo() { return this.description; }
    getRecordCount() { return this.recordCount; }

    getRecord(recNum) {
        if (recNum < 1) throw new DatabaseException("Record number must be greater than 1");
        this.seek(recNum);
        const record = this.readRecord();
        return record === null ? null : new DataInfo(recNum, this.description, record);
    }

    // All records whose field exactly matches the string (ignoring the field's padding), or null.
    // "*" matches every record.
    find(whichField, toMatch) {
        this.invariant();
        const index = Fields.getFieldNames().indexOf(whichField);
        if (index < 0) throw new Error("Field name " + whichField + " doesn't exist");
        const keys = [];
        if (toMatch === WILD_CHARACTER) {
            for (let r = 1; r <= this.recordCount; r++) keys.push(r);
        } else {
            this.seek(1);
            for (let r = 1; r <= this.recordCount; r++) {
                const values = this.readRecord();
                if (values !== null && javaTrim(values[index]) === toMatch) keys.push(r);
            }
        }
        if (keys.length === 0) return null;
        return keys.map(r => this.getRecord(r)).filter(d => d !== null);
    }

    // Records matching a comma-separated list of field='value' criteria, all of which must match,
    // e.g. "Carrier='SpeedyAir',OriginAirport='SFO'". Returns null if nothing matches.
    criteriaFind(criteria) {
        if (criteria.trim().length === 0) throw new Error("Tried to match empty criteria");
        const fields = [], values = [];
        for (const token of criteria.split(",").filter(t => t !== "")) {
            const position = token.indexOf("=");
            if (position < 0) throw new Error("Specification must be in form 'field'='value'");
            const field = token.substring(0, position);
            if (field.trim().length === 0) throw new Error("Empty field name");
            if (!Fields.getFieldNames().includes(field)) throw new Error("Invalid field name: " + field);
            let value = token.substring(position + 1);
            if (!(value.startsWith("'") && value.endsWith("'"))) throw new Error("Value must be in the form 'value'");
            value = value.substring(1, value.length - 1);
            if (value.trim().length === 0) throw new Error("Empty field value");
            fields.push(field);
            values.push(value);
        }
        // now, search for each criterion, narrowing the result set
        let result = null;
        for (let i = 0; i < fields.length; i++) {
            const found = this.find(fields[i], values[i]);
            if (found === null) { result = []; break; }
            const numbers = found.map(d => d.getRecordNumber());
            result = result === null ? numbers : numbers.filter(n => result.includes(n));
        }
        return result.length === 0 ? null : result.map(r => this.getRecord(r));
    }

    add(newData) {
        this.invariant();
        if (this.find(this.description[0].getName(), newData[0]) !== null) {
            throw new DatabaseException("Attempt to add a duplicate key");
        }
        this.seek(++this.recordCount);
        this.writeRecord(newData);
        this.db.seek(8);
        this.db.writeInt(this.recordCount);
    }

    modify(newData) {
        this.invariant();
        const test = this.find(this.description[0].getName(), newData.getValues()[0]);
        if (test !== null && test[0].getRecordNumber() !== newData.getRecordNumber()) {
            throw new DatabaseException("Attempt to create a duplicate key by modification");
        }
        this.seek(newData.getRecordNumber());
        this.writeRecord(newData.getValues());
    }

    delete(toDelete) {
        this.invariant();
        this.seek(toDelete.getRecordNumber());
        this.db.write(DELETED_RECORD);
    }

    // Lock a record, or the whole database if the record is -1. Waits until the lock is free.
    async lock(record, clientId) {
        if (record === -1) return Data.lock.lockDb(clientId);
        this.checkRecord(record, "Lock");
        return Data.lock.lockRow(clientId, record);
    }

    unlock(record, clientId) {
        if (record === -1) return Data.lock.unlockDb(clientId);
        this.checkRecord(record, "Unlock");
        Data.lock.unlockRow(clientId, record);
    }

    checkRecord(record, what) {
        if (record < 1 || record > this.getRecordCount()) throw new DatabaseException(what + " Error: invalid record " + record);
    }

    readRecord() {
        const buffer = new Uint8Array(this.recordLen);
        this.db.read(buffer);
        if (buffer[0] !== LIVE_RECORD) return null;
        let offset = 1;
        return this.description.map(f => {
            const s = bytesToString(buffer.subarray(offset, offset + f.getLength()));
            offset += f.getLength();
            return s;
        });
    }

    writeRecord(newData) {
        if (newData.length !== this.description.length) {
            throw new Error(`Data: Wrong number of fields in writeRecord() ${newData.length} given, ${this.description.length} required`);
        }
        const buffer = new Uint8Array(this.recordLen);
        buffer[0] = LIVE_RECORD;
        let offset = 1;
        this.description.forEach((f, i) => {
            buffer.set(stringToBytes(newData[i].substring(0, f.getLength())), offset);
            offset += f.getLength();
        });
        this.db.write(buffer);
    }

    seek(recno) { this.db.seek(this.headerLen + this.recordLen * (recno - 1)); }

    invariant() {
        if (this.db.length() !== this.headerLen + this.recordLen * this.recordCount) throw new Error("Data: Internal error");
    }
}

// ---- The data converter: legacy ASCII flights, one per line, fields separated by ^ ----
// Returns the new database and the converter's progress log.

function convert(ascii) {
    const data = Data.create(Fields.getFieldInfo());
    const log = ["Processing ASCII file..."];
    const lines = ascii.split(/\r?\n/);
    if (lines[lines.length - 1] === "") lines.pop(); // readLine() sees no line after the last line break
    lines.forEach((line, i) => {
        let out = "Line " + (i + 1) + ": ";
        // StringTokenizer skips empty tokens, and anything after the 9th is ignored
        const tokens = line.split("^").filter(t => t !== "");
        const columns = data.getFieldInfo();
        for (let k = 0; k < 9; k++) {
            if (k >= tokens.length) {
                log.push(out + " Unparseable. (java.util.NoSuchElementException) Skipped.");
                return;
            }
            if (columns[k].getLength() < tokens[k].length) {
                log.push(out + `Field length overflow: ${tokens[k].length} detected, should be at most ${columns[k].getLength()}. Skipped.`);
                return;
            }
        }
        try {
            data.add(tokens.slice(0, 9));
            log.push(out + "OK");
        } catch (e) {
            if (!(e instanceof DatabaseException)) throw e;
            log.push(out + "ConverterEngine: can't add data to database: " + e.toString() + ". Skipped.");
        }
    });
    return { data, log };
}

function base64ToBytes(s) {
    return Uint8Array.from(atob(s), c => c.charCodeAt(0));
}

if (typeof module !== "undefined") {
    module.exports = { Data, DataInfo, DatabaseLock, DatabaseException, ByteFile, Fields, convert, javaTrim };
}

// ---- UI ----

if (typeof document !== "undefined") {
    const $ = id => document.getElementById(id);
    const SEATS_COLUMN = 8;
    const COLUMNS = ["Flight", "From", "To", "Carrier", "Price", "Day", "Time", "Duration", "Seats"];
    const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
    let database = new Data(new ByteFile(base64ToBytes(ORIGINAL_DB_BASE64)));
    const clients = [];

    const time = () => new Date().toTimeString().slice(0, 8);
    function log(who, text) {
        const line = document.createElement("div");
        line.className = who.replace(/\s/g, "-").toLowerCase();
        line.textContent = `${time()}  ${who}: ${text}`;
        $("log").append(line);
        $("log").scrollTop = $("log").scrollHeight;
    }
    const flightOf = record => javaTrim(database.getRecord(record).getValues()[0]);

    function showLocks() {
        const lock = Data.lock;
        const parts = [];
        if (lock.locker !== null) parts.push(`the whole database: ${lock.locker}`);
        for (const [record, owner] of lock.lockedRecords) parts.push(`record ${record} (${flightOf(record)}): ${owner}`);
        $("locks").textContent = parts.length ? parts.join(", ") : "none";
        for (const c of clients) c.markLocks();
    }
    Data.lock.onChange = showLocks;

    // One client window: search by origin and destination, pick a flight, book seats
    class Client {
        constructor(name, root) {
            this.name = name;
            this.id = name;
            this.root = root;
            this.rows = [];      // the DataInfo of each table row
            this.selected = -1;  // the selected record number
            this.busy = false;
            const q = sel => root.querySelector(sel);
            this.from = q(".from");
            this.to = q(".to");
            this.seats = q(".seats");
            this.book = q(".book");
            this.status = q(".status");
            this.label = q(".flights-label");
            this.tbody = q("tbody");
            q("thead tr").append(...COLUMNS.map((c, i) => {
                const th = document.createElement("th");
                th.textContent = c;
                th.title = FIELDS[i][0];
                return th;
            }));
            q(".search").addEventListener("click", () => this.populateFlights());
            this.book.addEventListener("click", () => this.bookSeats());
            this.tbody.addEventListener("click", e => {
                const tr = e.target.closest("tr");
                if (!tr) return;
                this.selected = Number(tr.dataset.record);
                this.markSelection();
            });
        }

        setStatus(text, kind = "") {
            this.status.textContent = text;
            this.status.className = "status " + kind;
        }

        // the airports that flights leave from and arrive at
        populateFromTo() {
            const all = database.criteriaFind("Day='*'") ?? [];
            for (const [select, column] of [[this.from, 1], [this.to, 2]]) {
                const keep = select.value;
                const airports = [...new Set(all.map(d => javaTrim(d.getValues()[column])))].sort();
                select.replaceChildren(...["All Airports", ...airports].map(a => new Option(a)));
                if (["All Airports", ...airports].includes(keep)) select.value = keep;
            }
        }

        makeCriteria() {
            const pick = select => select.value === "All Airports" ? "*" : select.value;
            return `OriginAirport='${pick(this.from)}',DestinationAirport='${pick(this.to)}'`;
        }

        populateFlights() {
            this.rows = database.criteriaFind(this.makeCriteria()) ?? [];
            this.tbody.replaceChildren(...this.rows.map(d => {
                const tr = document.createElement("tr");
                tr.dataset.record = d.getRecordNumber();
                for (const v of d.getValues()) {
                    const td = document.createElement("td");
                    td.textContent = javaTrim(v);
                    tr.append(td);
                }
                return tr;
            }));
            this.label.textContent = this.rows.length > 0
                ? "List of available flights - click on the desired flight, enter the number of seats and click on Book"
                : "No records found. Try changing your search criteria";
            this.markSelection();
            this.markLocks();
        }

        markSelection() {
            for (const tr of this.tbody.rows) tr.classList.toggle("selected", Number(tr.dataset.record) === this.selected);
        }

        markLocks() {
            for (const tr of this.tbody.rows) {
                const owner = Data.lock.ownerOf(Number(tr.dataset.record));
                tr.classList.toggle("locked-mine", owner === this.id);
                tr.classList.toggle("locked-other", owner !== null && owner !== this.id);
                tr.title = owner === null ? "" : "Locked by " + owner;
            }
        }

        async bookSeats() {
            if (this.busy) return;
            const seats = Number(this.seats.value.trim());
            if (!Number.isInteger(seats) || seats < 1) return this.setStatus("Please enter correct number of seats", "error");
            const row = this.rows.find(d => d.getRecordNumber() === this.selected);
            if (!row) return this.setStatus("Please select a flight by clicking on it", "warning");
            const record = row.getRecordNumber();
            const flight = javaTrim(row.getValues()[0]);
            if (Number(javaTrim(row.getValues()[SEATS_COLUMN])) < seats) return this.setStatus("Not enough available seats", "error");

            this.busy = true;
            this.book.disabled = true;
            try {
                const owner = Data.lock.ownerOf(record);
                if (owner !== null && owner !== this.id) {
                    this.setStatus(`Waiting for ${owner} to unlock ${flight}...`, "waiting");
                    log(this.name, `waits for the lock on record ${record} (${flight})`);
                }
                // 1. lock the flight's record
                await database.lock(record, this.id);
                log(this.name, `locked record ${record} (${flight})`);
                try {
                    // 2. reread it: another client may have booked seats since this table was shown
                    const fresh = database.getRecord(record);
                    const available = Number(javaTrim(fresh.getValues()[SEATS_COLUMN]));
                    if (available < seats) {
                        this.setStatus(`Not enough available seats: ${flight} has only ${plural(available, "seat")} left`, "error");
                        log(this.name, `found only ${plural(available, "seat")} left on ${flight}`);
                    } else {
                        if ($("slow").checked) {
                            this.setStatus(`Booking ${plural(seats, "seat")} on ${flight}, holding its lock...`, "waiting");
                            await sleep(4000);
                        }
                        // 3. update
                        const values = fresh.getValues().slice();
                        values[SEATS_COLUMN] = String(available - seats);
                        database.modify(new DataInfo(record, database.getFieldInfo(), values));
                        log(this.name, `booked ${plural(seats, "seat")} on ${flight}: ${available} → ${available - seats} left`);
                        this.setStatus(`${plural(seats, "seat")} booked successfully`, "ok");
                    }
                } finally {
                    // 4. unlock
                    database.unlock(record, this.id);
                    log(this.name, `unlocked record ${record} (${flight})`);
                }
            } catch (e) {
                this.setStatus(e.toString(), "error");
            } finally {
                this.busy = false;
                this.book.disabled = false;
                // refresh the table after the update
                this.populateFlights();
            }
        }
    }

    // Swap in another database file: lock the whole database first, which waits for bookings in progress
    async function useDatabase(bytes, what) {
        const who = "Converter";
        if (Data.lock.lockedRecords.size > 0) log(who, "waits for the whole database lock");
        await database.lock(-1, who);
        log(who, "locked the whole database");
        database = new Data(new ByteFile(bytes));
        database.unlock(-1, who);
        log(who, `unlocked the whole database, now using ${what}`);
        for (const c of clients) {
            c.selected = -1;
            c.populateFromTo();
            c.populateFlights();
            c.setStatus("");
        }
        showDbInfo();
    }

    function showDbInfo() {
        $("dbinfo").textContent = `${database.db.length().toLocaleString("en-US")} bytes, ${plural(database.getRecordCount(), "flight")}`;
    }

    for (const name of ["Client A", "Client B"]) {
        const root = $("client-template").content.firstElementChild.cloneNode(true);
        root.querySelector("h2").textContent = name;
        root.classList.add(name.replace(/\s/g, "-").toLowerCase());
        $("clients").append(root);
        const c = new Client(name, root);
        c.populateFromTo();
        c.populateFlights();
        clients.push(c);
    }
    showLocks();
    showDbInfo();

    $("reset").addEventListener("click", () => useDatabase(base64ToBytes(ORIGINAL_DB_BASE64), "the original database"));

    // the converter
    let converted = null;
    $("ascii").value = TEST_ASCII;
    $("convert").addEventListener("click", () => {
        const { data, log: lines } = convert($("ascii").value);
        converted = data;
        $("convert-log").textContent = lines.join("\n") + `\n\nNew database: ${data.db.length().toLocaleString("en-US")} bytes, ${plural(data.getRecordCount(), "flight")}.`;
        $("use-converted").disabled = data.getRecordCount() === 0;
    });
    $("use-converted").addEventListener("click", () => {
        if (converted) useDatabase(converted.db.bytes(), "the converted database");
    });
}
