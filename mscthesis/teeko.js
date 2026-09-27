"use strict";

// teeko.c and the sixteen files it includes, ported line for line. The console, the files and the clock come
// through `io`, so the same code runs in the page and, to be compared with the original C, in Node.
//
// Where the C reads or writes past the end of the board, the page does what it would do if the variables lay in
// memory in the order defs.c declares them: X, then Xsearch, Xheur and Xlearn. So the board and those three are one
// array here, `mem`, and X is its first 25 cells.

// Microsoft C's rand(), which the original teeko.exe used
function msvcRandom() {
    let seed = 1;
    return {
        srand(s) { seed = s >>> 0; },
        rand() { seed = (Math.imul(seed, 214013) + 2531011) >>> 0; return (seed >>> 16) & 0x7fff; },
    };
}

// The directory the program runs in: files by name, without case as on Windows, each a string of bytes. A file
// that is open can't be deleted, as on Windows.
class Directory {
    constructor(entries) {
        this.files = new Map();
        for (const [name, data] of entries || []) this.put(name, data);
        this.open = new Map();
        this.onchange = null;
    }
    key(name) { return name.toLowerCase(); }
    has(name) { return this.files.has(this.key(name)); }
    entry(name) { return this.files.get(this.key(name)); }
    put(name, data) {
        const old = this.entry(name);
        const bytes = new Uint8Array(Math.max(64, data.length));
        for (let i = 0; i < data.length; i++) bytes[i] = data.charCodeAt(i) & 255;
        this.files.set(this.key(name), { name: old ? old.name : name, bytes, length: data.length });
        this.changed();
    }
    text(name) {
        const f = this.entry(name);
        if (!f) return null;
        let s = "";
        for (let i = 0; i < f.length; i += 8192) s += String.fromCharCode.apply(null, f.bytes.subarray(i, Math.min(f.length, i + 8192)));
        return s;
    }
    remove(name) {
        if (!this.has(name) || this.open.get(this.key(name))) return -1;
        this.files.delete(this.key(name));
        this.changed();
        return 0;
    }
    list() { return [...this.files.values()].map(f => ({ name: f.name, length: f.length })).sort((a, b) => a.name.localeCompare(b.name)); }
    changed() { if (this.onchange) this.onchange(); }
}

class Exit { constructor(code) { this.code = code; } }
// the program has gone into a loop it can't leave; `cells` are the four fields it keeps trying
class Hang { constructor(cells) { this.cells = cells; } }

function createTeeko(io) {
    const fixed = !!io.fixed;
    const dir = io.dir;
    const WIDTH = 4, MAXEVAL = 2000, DRAW = 4, EOF = -1, EXIT_SUCCESS = 0, EXIT_FAILURE = 1;
    const printf = s => io.write(s);
    const pad = (v, w) => String(v).padStart(w);
    const exit = code => {
        for (const f of handles) if (f.open) fclose(f);
        throw new Exit(code);
    };
    const { rand } = io.random;

    // --- stdio, over the directory
    const handles = new Set();
    function fopen(name, mode) {
        if ((mode === "r" || mode === "r+") && !dir.has(name)) return null;
        if (mode === "w" || !dir.has(name)) dir.put(name, "");
        const f = { name, mode, pos: 0, open: true, file: dir.entry(name) };
        const k = dir.key(name);
        dir.open.set(k, (dir.open.get(k) || 0) + 1);
        handles.add(f);
        return f;
    }
    function fclose(f) {
        if (!f || !f.open) return 0;
        f.open = false;
        handles.delete(f);
        const k = dir.key(f.name);
        dir.open.set(k, dir.open.get(k) - 1);
        dir.changed();
        return 0;
    }
    function fgetc(f) {
        const file = f.file;
        return f.pos < file.length ? file.bytes[f.pos++] : EOF;
    }
    function fputc(c, f) {
        if (f.mode === "r") return EOF;
        const file = f.file;
        if (f.mode === "a+") f.pos = file.length;
        if (f.pos >= file.bytes.length) {
            const bigger = new Uint8Array(file.bytes.length * 2 + 64);
            bigger.set(file.bytes);
            file.bytes = bigger;
        }
        file.bytes[f.pos++] = c & 255;
        if (f.pos > file.length) file.length = f.pos;
        return c & 255;
    }
    function fseek(f, offset, whence) {
        const pos = whence === SEEK_END ? f.file.length + offset : f.pos + offset;
        if (pos < 0) return -1;
        f.pos = pos;
        return 0;
    }
    const SEEK_CUR = 1, SEEK_END = 2;
    function rewind(f) { f.pos = 0; }
    function remove(name) { return dir.remove(name); }
    // fgets(s, 80, stdin); the line comes back as its characters' codes, signed as MSVC's char is, then the 0 that
    // ends it
    async function fgets() {
        const line = await io.fgets(80);
        const s = [];
        for (const ch of line) { const c = ch.charCodeAt(0) & 255; s.push(c > 127 ? c - 256 : c); }
        s.push(0);
        return s;
    }
    const C = ch => ch.charCodeAt(0);

    // --- defs.c
    let pausing = 1, thinking = 1, learning = 1, heurplaying = 1, searchplaying = 1;
    let n = 0, p0 = 0, p = 0;
    let repeat = 0;
    let autoh1 = 0, autos1 = 0, autol1 = 0, autoh2 = 0, autos2 = 0, autol2 = 0;
    let memp2 = "";
    const learnednumber = [32, 32, 32, 32];
    const mem = new Int32Array(100);
    const X = mem.subarray(0, 25), Xsearch = mem.subarray(25, 50), Xheur = mem.subarray(50, 75), Xlearn = mem.subarray(75, 100);
    const recentpositions = Array.from({ length: DRAW * 4 }, () => new Int32Array(25));
    let l1 = null, l2 = null, g = null, m = null, st = null;
    const position = () => new Int32Array(25);

    // atoi() of learnednumber, which has no 0 at its end; what follows it in memory is X[0][0], whose first byte
    // is 0, 1 or 255, none of them a digit, so atoi stops there
    function atoi4() {
        let i = 0, v = 0, neg = false;
        while (i < WIDTH && (learnednumber[i] === 32 || (learnednumber[i] >= 9 && learnednumber[i] <= 13))) i++;
        if (i < WIDTH && (learnednumber[i] === 43 || learnednumber[i] === 45)) neg = learnednumber[i++] === 45;
        while (i < WIDTH && learnednumber[i] >= 48 && learnednumber[i] <= 57) v = v * 10 + learnednumber[i++] - 48;
        return neg ? -v : v;
    }
    function atoi(s) {
        const m = /^[ \t\n\v\f\r]*([+-]?\d+)/.exec(s);
        return m ? parseInt(m[1], 10) | 0 : 0;
    }

    // --- other.c
    function myitoa(nn, digits) {
        let i, digit, maxlearn;
        maxlearn = 1;
        for (i = 0; i <= WIDTH - 1; i++) maxlearn *= 10;
        maxlearn--;
        if (nn > maxlearn) error("Learned number is too big.");
        for (i = 0; i <= WIDTH - 1; i++) digits[i] = 32;
        i = WIDTH - 1;
        for (;;) {
            if (nn === 0) return;
            digit = nn % 10;
            nn = (nn - digit) / 10;
            digits[i--] = 48 + digit;
        }
    }
    function switcher(v) { return v === 1 ? 0 : 1; }
    function parse(argv) {
        const argc = argv.length;
        const a = (k, i) => i < argv[k].length ? argv[k].charCodeAt(i) : 0;
        if (argc === 1) return 0;
        if (argc !== 5) return 1;
        for (const k of [1, 2]) {
            if (a(k, 0) !== C("-") && a(k, 0) !== C("+")) return 1;
            if (a(k, 2) !== C("-") && a(k, 2) !== C("+")) return 1;
            if (a(k, 4) !== C("-") && a(k, 4) !== C("+")) return 1;
            if (a(k, 1) !== C("h")) return 1;
            if (a(k, 3) !== C("s")) return 1;
            if (a(k, 5) !== C("l")) return 1;
        }
        autoh1 = a(1, 0) === C("+") ? 1 : 0;
        autos1 = a(1, 2) === C("+") ? 1 : 0;
        autol1 = a(1, 4) === C("+") ? 1 : 0;
        autoh2 = a(2, 0) === C("+") ? 1 : 0;
        autos2 = a(2, 2) === C("+") ? 1 : 0;
        autol2 = a(2, 4) === C("+") ? 1 : 0;
        memp2 = argv[3];
        repeat = atoi(argv[4]);
        if (repeat === 0) return 1;
        return 0;
    }

    // --- fileio.c
    function openlevel1_read() { if ((l1 = fopen("level1.s", "r")) === null) error("Cannot open level1.s for reading."); }
    function openlevel1_write() { if ((l1 = fopen("level1.s", "w")) === null) error("Cannot open level1.s for writing."); }
    function closelevel1() { if (fclose(l1) === EOF) error("Cannot close level1.s"); }
    function openlevel2_read() { if ((l2 = fopen("level2.s", "r")) === null) error("Cannot open level2.s for reading."); }
    function openlevel2_write() { if ((l2 = fopen("level2.s", "w")) === null) error("Cannot open level2.s for writing."); }
    function closelevel2() { if (fclose(l2) === EOF) error("Cannot close level2.s"); }
    function putmarkerl2() { if (fputc(C("X"), l2) === EOF) error("Cannot fputc marker into level2.s"); }
    function saveposition(ptmp, f) {
        let c = 0;
        for (let k = 0; k < 25; k++) {
            switch (ptmp[k]) {
                case -1: c = C("2"); break;
                case 0: c = C("0"); break;
                case 1: c = C("1"); break;
            }
            if (fputc(c, f) === EOF) error("Cannot fputc.");
        }
    }
    function loadposition(ptmp, f) {
        for (let k = 0; k < 25; k++) {
            const c = fgetc(f);
            if (c === EOF) return 1;
            if (c === C("X")) return 2;
            switch (c) {
                case 50: ptmp[k] = -1; break;
                case 49: ptmp[k] = 1; break;
                case 48: ptmp[k] = 0; break;
            }
        }
        return 0;
    }
    function opengamememory_read() { if ((g = fopen("game.m", "r")) === null) error("Cannot open game.m for reading."); }
    function opengamememory_write() { if ((g = fopen("game.m", "w")) === null) error("Cannot open game.m for writing."); }
    function closegamememory() { if (fclose(g) === EOF) error("Cannot close game.m"); }
    function creatememory() {
        if ((m = fopen("memory.m", "r+")) === null) {
            printf("\nCreating new memory...\n");
            if ((m = fopen("memory.m", "a+")) === null) error("Cannot create memory.m (fopen of memory.m with a+).");
            else printf("New memory file has been successfully created.\n");
            if (fclose(m) === EOF) error("Cannot close just created memory.m .");
        }
        // (when memory.m is there, it stays open, as in the C)
    }
    function openmemory_readwrite() {
        if (repeat > 0 && p === -1) {
            if ((m = fopen(memp2, "r+")) === null) error("Cannot open memory of player 2 for reading and writing.");
            return;
        }
        if ((m = fopen("memory.m", "r+")) === null) error("Cannot open memory.m for reading and writing.");
    }
    function closememory() { if (fclose(m) === EOF) error("Cannot close memory."); }
    function skip(f) { for (let i = 0; i <= WIDTH - 1; i++) if (fgetc(f) === EOF) error("Cannot skip."); }
    function putspaces() { for (let i = 0; i <= WIDTH - 1; i++) if (fputc(32, m) === EOF) error("Cannot fputc space into memory.m ."); }
    function getback(f) { if (fseek(f, -WIDTH, SEEK_CUR) === -1) error("Cannot fseek backwards for getback."); }
    function getnumber(f) {
        for (let i = 0; i <= WIDTH - 1; i++) {
            const c = fgetc(f);
            if (c === EOF) error("Cannot fgetc (getnumber).");
            else learnednumber[i] = c;
        }
    }
    function putnumber(nn, f) {
        const num = [32, 32, 32, 32];
        myitoa(nn, num);
        for (let i = 0; i <= WIDTH - 1; i++) if (fputc(num[i], f) === EOF) error("Cannot fputc (putnumber).");
    }
    function findposition(ptmp) {
        const pcur = position();
        rewind(m);
        for (;;) {
            if (loadposition(pcur, m)) error("Unknown error in fileio - loadposition failed.");
            if (comparepositions(pcur, ptmp)) break;
            skip(m);
            skip(m);
        }
    }
    function gotoendofmemory() { if (fseek(m, 0, SEEK_END) === -1) error("Cannot fseek to end of memory.m ."); }
    function createstat() {
        const toput = 9 * WIDTH - 1;
        if ((st = fopen("stat.m", "r+")) === null) {
            printf("\nCreating new statistic file...\n");
            if ((st = fopen("stat.m", "a+")) === null) error("Cannot create stat.m (fopen of stat.m with a+).");
            else printf("New statistic file has been successfully created.\n");
            for (let i = 0; i <= toput; i++) if (fputc(32, st) === EOF) error("Cannot fputc space into stat.m .");
            if (fclose(st) === EOF) error("Cannot close just created stat.m .");
        }
    }
    function removestat() { remove("stat.m"); }
    function openstat_readwrite() { if ((st = fopen("stat.m", "r+")) === null) error("Cannot open stat.m for reading and writing."); }
    function closestat() { if (fclose(st) === EOF) error("Cannot close stat.m"); }
    function closefiles() {
        if (l1 !== null) fclose(l1);
        if (l2 !== null) fclose(l2);
        if (g !== null) fclose(g);
        if (m !== null) fclose(m);
        if (st !== null) fclose(st);
    }
    function removefiles() {
        remove("level1.s");
        remove("level2.s");
        remove("game.m");
    }

    // --- position.c; a position is 25 cells, row by row, so [i][j] is [i*5+j]
    function makeemptyposition(q) { q.fill(0); }
    function successor(child) {
        const ptmp = position();
        openlevel1_read();
        for (;;) {
            const ret = loadposition(ptmp, l1);
            if (ret === 1) { closelevel1(); return 0; }
            if (comparepositions(child, ptmp)) { closelevel1(); return 1; }
        }
    }
    function invertposition(s, d) {
        for (let k = 0; k < 25; k++) {
            switch (s[k]) {
                case 0: d[k] = 0; break;
                case 1: d[k] = -1; break;
                case -1: d[k] = 1; break;
            }
        }
    }
    function comparepositions(p1, p2) {
        for (let k = 0; k < 25; k++) if (p1[k] !== p2[k]) return 0;
        return 1;
    }
    function copyposition(ps, pd) { for (let k = 0; k < 25; k++) pd[k] = ps[k]; }
    function printposition(q, whomoves) {
        let out = 0;
        let s = "\n 01234";
        for (let i = 0; i <= 4; i++) {
            s += "\n" + i;
            for (let j = 0; j <= 4; j++) {
                switch (q[i * 5 + j]) {
                    case 0: out = "."; break;
                    case 1: out = whomoves === 1 ? "X" : "O"; break;
                    case -1: out = whomoves === -1 ? "X" : "O"; break;
                }
                s += out === 0 ? "\0" : out;
            }
        }
        if (n !== 1 || p0 === 0 || (n === 1 && p0 === 1)) s += "\n";
        printf(s);
    }
    function translateposition(q, preserve) { for (let k = 0; k < 25; k++) if (q[k] !== preserve) q[k] = 0; }

    // --- eval.c
    function four(q, t) {
        let i, j, summa;
        const x = position();
        copyposition(q, x);
        translateposition(x, t);
        const P = (i, j) => x[i * 5 + j];
        for (i = 0; i <= 4; i++) {
            summa = 0;
            for (j = 0; j <= 4; j++) summa += P(i, j);
            if (summa === 4 * t && (P(i, 0) === 0 || P(i, 4) === 0)) return 1;
        }
        for (j = 0; j <= 4; j++) {
            summa = 0;
            for (i = 0; i <= 4; i++) summa += P(i, j);
            if (summa === 4 * t && (P(0, j) === 0 || P(4, j) === 0)) return 1;
        }
        if (P(3, 0) === t && P(2, 1) === t && P(1, 2) === t && P(0, 3) === t) return 1;
        if (P(4, 1) === t && P(3, 2) === t && P(2, 3) === t && P(1, 4) === t) return 1;
        if (P(4, 0) === t && P(3, 1) === t && P(2, 2) === t && P(1, 3) === t) return 1;
        if (P(3, 1) === t && P(2, 2) === t && P(1, 3) === t && P(0, 4) === t) return 1;
        if (P(1, 0) === t && P(2, 1) === t && P(3, 2) === t && P(4, 3) === t) return 1;
        if (P(0, 1) === t && P(1, 2) === t && P(2, 3) === t && P(3, 4) === t) return 1;
        if (P(0, 0) === t && P(1, 1) === t && P(2, 2) === t && P(3, 3) === t) return 1;
        if (P(1, 1) === t && P(2, 2) === t && P(3, 3) === t && P(4, 4) === t) return 1;
        for (i = 0; i <= 3; i++)
            for (j = 0; j <= 3; j++)
                if (P(i, j) === t && P(i + 1, j) === t && P(i, j + 1) === t && P(i + 1, j + 1) === t) return 1;
        return 0;
    }
    function three(q, t) {
        let i, j, summa;
        const x = position();
        copyposition(q, x);
        translateposition(x, t);
        const P = (i, j) => x[i * 5 + j];
        for (i = 0; i <= 4; i++) {
            summa = 0;
            for (j = 0; j <= 4; j++) summa += P(i, j);
            if (summa === 3 * t && (P(i, 0) === 0 && P(i, 1) === 0 || P(i, 0) === 0 && P(i, 4) === 0 || P(i, 3) === 0 && P(i, 4) === 0)) return 1;
        }
        for (j = 0; j <= 4; j++) {
            summa = 0;
            for (i = 0; i <= 4; i++) summa += P(i, j);
            if (summa === 3 * t && (P(0, j) === 0 && P(1, j) === 0 || P(0, j) === 0 && P(4, j) === 0 || P(3, j) === 0 && P(4, j) === 0)) return 1;
        }
        if (P(3, 0) === t && P(2, 1) === t && P(1, 2) === t) return 1;
        if (P(2, 1) === t && P(1, 2) === t && P(0, 3) === t) return 1;
        if (P(4, 0) === t && P(3, 1) === t && P(2, 2) === t) return 1;
        if (P(3, 1) === t && P(2, 2) === t && P(1, 3) === t) return 1;
        if (P(2, 2) === t && P(1, 3) === t && P(0, 4) === t) return 1;
        if (P(4, 1) === t && P(3, 2) === t && P(2, 3) === t) return 1;
        if (P(3, 2) === t && P(2, 3) === t && P(1, 4) === t) return 1;
        if (P(3, 4) === t && P(2, 3) === t && P(1, 2) === t) return 1;
        if (P(2, 3) === t && P(1, 2) === t && P(0, 1) === t) return 1;
        if (P(4, 4) === t && P(3, 3) === t && P(2, 2) === t) return 1;
        if (P(3, 3) === t && P(2, 2) === t && P(1, 1) === t) return 1;
        if (P(2, 2) === t && P(1, 1) === t && P(0, 0) === t) return 1;
        if (P(4, 3) === t && P(3, 2) === t && P(2, 1) === t) return 1;
        if (P(3, 2) === t && P(2, 1) === t && P(1, 0) === t) return 1;
        for (i = 0; i <= 3; i++) {
            summa = 0;
            for (j = 0; j <= 3; j++) {
                summa = P(i, j) + P(i + 1, j) + P(i, j + 1) + P(i + 1, j + 1);
                if (summa === 3 * t) return 1;
            }
        }
        return 0;
    }
    function evaluate(q, t, e) {
        const evs = 1, evt = 1, ta1 = 1000, ta2 = 15, st0 = 6, st1 = 3, st2 = 0;
        let hasfour = 0, hasthree = 0, center = 0, circle1 = 0;
        const circle2 = 0;
        if (four(q, t) === 1) hasfour = 1;
        if (four(q, e) === 1) hasfour = -1;
        if (three(q, t)) hasthree++;
        if (three(q, e)) hasthree--;
        const tactic = ta1 * hasfour + ta2 * hasthree;
        if (q[12] === t) center = 1;
        else if (q[12] === e) center = -1;
        for (let i = 1; i <= 3; i++)
            for (let j = 1; j <= 3; j++) {
                if (i === 2 && j === 2) continue;
                if (q[i * 5 + j] === t) circle1++;
                if (q[i * 5 + j] === e) circle1--;
            }
        const strategy = st0 * center + st1 * circle1 + st2 * circle2;
        return evt * tactic + evs * strategy;
    }

    // --- draw.c
    function shift() {
        for (let i = 1; i <= DRAW * 4 - 1; i++) copyposition(recentpositions[i], recentpositions[i - 1]);
        copyposition(X, recentpositions[DRAW * 4 - 1]);
    }
    function isdraw(moves) {
        let start = 0, end = 0, step = 0;
        if (n > 100) {
            printf("100 moves reached! Draw!\n");
            return 1;
        }
        switch (moves) {
            case 2: start = 8; end = 11; step = 4; break;
            case 3: start = 4; end = 9; step = 6; break;
            case 4: start = 0; end = 7; step = 8; break;
        }
        for (let i = start; i <= end; i++)
            if (comparepositions(recentpositions[i], recentpositions[i + step]) === 0) return 0;
        return 1;
    }

    // --- init.c
    function init(whomoves) {
        n = 1;
        p0 = whomoves;
        p = whomoves === 0 ? 1 : whomoves;
        makeemptyposition(X);
    }
    function nextinit() {
        if (n >= 9) shift();
        n++;
        p *= -1;
    }

    // --- stat.c
    function statreset() { removestat(); createstat(); }
    function statupdate(what, outcome) {
        openstat_readwrite();
        switch (what) {
            case "A": break;
            case "F": skip(st); skip(st); skip(st); break;
            case "S": skip(st); skip(st); skip(st); skip(st); skip(st); skip(st); break;
        }
        switch (outcome) {
            case "W": break;
            case "D": skip(st); break;
            case "L": skip(st); skip(st); break;
        }
        learnednumber.fill(32);
        getnumber(st);
        let currentstat = atoi4();
        currentstat++;
        getback(st);
        putnumber(currentstat, st);
        closestat();
    }
    function statshow() {
        openstat_readwrite();
        const v = [];
        for (let k = 0; k < 9; k++) { getnumber(st); v.push(atoi4()); }
        closestat();
        const [autowon, autodrawn, autolost, progfirstwon, progfirstdrawn, progfirstlost, progsecondwon, progseconddrawn, progsecondlost] = v;
        const autosumma = autowon + autodrawn + autolost;
        const progfirstsumma = progfirstwon + progfirstdrawn + progfirstlost;
        const progsecondsumma = progsecondwon + progseconddrawn + progsecondlost;
        const w = WIDTH;
        // pw = (won*(float)100)/summa: in floats, printed with %6.2f, which Microsoft C rounded half up
        const pct = (a, s) => Math.fround(Math.fround(a * 100) / s).toFixed(2).padStart(6);
        const ratio = (a, b, c, s) =>
            `${pad(a, w)} : ${pad(b, w)} : ${pad(c, w)}` +
            (s !== 0 ? ` (${pct(a, s)}% :${pct(b, s)}% :${pct(c, s)}%)` : " (percentage ratio is not available)");
        printf("\nStatistics.\n\n");
        printf(`Total of games played: ${autosumma + progfirstsumma + progsecondsumma}`);
        printf("\n\n");
        printf(`Autoplayed games: ${autosumma}\n`);
        printf("X:D:O ratio is " + ratio(autowon, autodrawn, autolost, autosumma));
        printf("\n\n");
        printf(`Games program played first: ${progfirstsumma}\n`);
        printf("W:D:L ratio is " + ratio(progfirstwon, progfirstdrawn, progfirstlost, progfirstsumma));
        printf("\n\n");
        printf(`Games program played second: ${fixed ? progsecondsumma : progfirstsumma}\n`);
        printf("W:D:L ratio is " + ratio(progsecondwon, progseconddrawn, progsecondlost, progsecondsumma));
        printf("\n\n");
    }
    async function statmenu() {
        printf("[r] Reset statistics\n\n");
        printf("Press [r] or any key then ENTER... >");
        const s = await fgets();
        if (s[0] === C("r")) statreset();
    }
    async function statistics() { statshow(); await statmenu(); }

    // --- screenio.c
    function menu() {
        const onoff = v => v ? "ON" : "OFF";
        printf("\nTeeko V1.0 Copyright Mihailo Despotovic 1997, 1998, 1999.\n");
        printf("This program is a part of my M.Sc. thesis ");
        printf("\"Learning in Strategic Games\".\n");
        printf("More info is available on URL http://members.xoom.com/mihailod\n");
        printf("INTERACTIVE MODE (for BATCH MODE, type 'teeko -?' at the prompt)\n");
        printf("[1] Play: you play the first move\n");
        printf("[2] Play: program plays the first move\n");
        printf(`[3] Play: autoplay mode (pause is ${onoff(pausing)})\n`);
        printf("[p] Pause for autoplay mode switcher\n");
        printf(`[h] Heuristic is ${onoff(heurplaying)}\n`);
        printf(`[s] Searching is ${onoff(searchplaying)}\n`);
        printf(`[l] Learning is  ${onoff(learning)}\n`);
        printf(`[t] Thinking is ${thinking ? "VISIBLE" : "INVISIBLE"}\n`);
        printf("[?] Current statistics\n");
        printf("[r] Rules of the game\n");
        printf("[/] Help\n");
        printf("[q] Quit\n");
        printf("Choose an option, then press ENTER to continue. >");
    }
    async function rules() {
        printf("\nRules.\n\n");
        printf("Teeko is played on the 5x5 board. Both opponents have four pawns.\n");
        printf("The goal of the game is to make a four in a row or a square ");
        printf("pattern.\n");
        printf("The game itself consists of two parts. First, pawns are put to\n");
        printf("the board one by one. This is called the opening. ");
        printf("After that,\npawns can be moved around to free surrounding ");
        printf("fields only.\n");
        printf("Move your pawns and try to outdo your opponent!\n\n");
        printf("(See the help for the details about putting and moving pawns\n");
        printf("and other game related commands.)\n\n");
        printf("Press ENTER to return to the main menu. >");
        await fgets();
    }
    async function help() {
        printf("\nHelp (for interactive, menu driven mode).\n\n");
        printf("In the opening sequence, you enter two numbers in format XY .\n");
        printf("Those numbers define where you want to put your pawn.\n");
        printf("In the game, you enter four numbers in format ABCD .\n");
        printf("That means you want to move your pawn from AB to CD .\n\n");
        printf("Once started, the game can be quitted by entering q .\n\n");
        printf("You can choose to see the thinking process during the game.\n");
        printf("If this option is ON, you will be informed about heuristic\n");
        printf("moves (m4 = make four, a4 = avoid four, md3 = make double three,\n");
        printf("mnd3 = make non-defendable three, ad3 = avoid double three,\n");
        printf("and3 = avoid non-defendable three, rnd = random move),\n");
        printf("about progress of minimax searching of the game tree(each dot\n");
        printf("represents expanding of one position at the first level of the\n");
        printf("game tree to the second level) and about learning (each dot\n");
        printf("in recalling process (during the game) represents a found\n");
        printf("successor of the current position in program's memory, and\n");
        printf("in the process of updating the memory (after the game), you\n");
        printf("will be informed about adding a new positions and updating of\n");
        printf("values of the positios that have been already seen).\n");
        printf("You will also be informed about position evaluation values.\n\n");
        printf("Press ENTER to return to the main menu. >");
        await fgets();
    }
    async function afterGame() {
        if (repeat === 0) {
            if (learning) updatememory();
            printf("Press ENTER to return to the main menu. >");
            await fgets();
        } else {
            if (autol1 === 1 || autol2 === 1) updatememory();
        }
    }
    async function defeat() {
        if (p0 !== 0) {
            printf("\nYou have won.\n");
            if (p0 === 1) statupdate("F", "L");
            else statupdate("S", "L");
        } else if (p === 1) {
            printf("\nPlayer II (O) has won.\n");
            statupdate("A", "L");
        } else {
            printf("\nPlayer I (X) has won.\n");
            statupdate("A", "W");
        }
        await afterGame();
    }
    async function win() {
        if (p0 !== 0) {
            printf("\nProgram has won.\n");
            if (p0 === 1) statupdate("F", "W");
            else statupdate("S", "W");
        } else if (p === 1) {
            printf("\nPlayer II (O) has won.\n");
            statupdate("A", "L");
        } else {
            printf("\nPlayer I (X) has won.\n");
            statupdate("A", "W");
        }
        await afterGame();
    }
    async function draw() {
        switch (p0) {
            case 0: statupdate("A", "D"); break;
            case -1: statupdate("S", "D"); break;
            case 1: statupdate("F", "D"); break;
        }
        if (repeat === 0) {
            printf("\nThe game has been drawn.\n");
            printf("Memory has not been updated.\n");
            printf("Press ENTER to return to the main menu. >");
            await fgets();
        } else {
            printf("\nThe game has been drawn.\n");
        }
    }
    async function offerdraw() {
        printf("\nWould you consider this one as a draw? [y/n] >");
        const s = await fgets();
        if (s[0] === C("y")) return 1;
        return 0;
    }
    async function gamebreak() {
        if (n < 9) printf("\nThe opening has been interrupted.\n");
        else printf("\nThe game has been interrupted.\n");
        if (n >= 9) printf("Memory has not been updated.\n");
        removefiles();
        printf("Press ENTER to return to the main menu. >");
        await fgets();
    }
    function error(s) {
        printf("\n\n\n\n\nFatal error:\n");
        printf(s);
        printf("\nAttempting to close all files... ");
        closefiles();
        printf("OK\n");
        printf("Attempting to remove all temporary files... ");
        removefiles();
        printf("OK\n");
        printf(`\nAttempting to exit with exit code ${EXIT_FAILURE}.\n`);
        exit(EXIT_FAILURE);
    }
    function quitgame() {
        removefiles();
        exit(EXIT_SUCCESS);
    }
    function autointro() {
        const on = v => v ? " ON" : "OFF";
        printf("\n");
        printf(`Playing ${repeat} games in batch mode.\n`);
        printf("---------------------------------------\n");
        printf("          Heuristics Searching Learning\n");
        printf(`Player 1     ${on(autoh1)}      ${on(autos1)}        ${on(autol1)}\n`);
        printf(`Player 2     ${on(autoh2)}      ${on(autos2)}        ${on(autol2)}\n`);
        printf("---------------------------------------\n");
    }
    function usage() {
        printf("\nTeeko V1.0 Copyright Mihailo Despotovic 1997, 1998, 1999.\n");
        printf("This program is a part of my M.Sc. thesis ");
        printf("\"Learning in Strategic Games\".\n");
        printf("More info is available on URL http://members.xoom.com/mihailod\n");
        printf("BATCH MODE (for INTERACTIVE MODE, type 'teeko' at the prompt)\n");
        printf("Usage:");
        printf(" teeko [{-?}|{{+|-}h{+|-}s{+|-}l {{+|-}h{+|-}s{+|-}l file {n}}]\n");
        printf(" -? prints these help lines.\n");
        printf(" + turns ON the option; - turns OFF the option.\n");
        printf(" Options are: s (searching), h (heuristics) and l (learning).\n");
        printf(" file denotes the file you want player 2 to use as his memory.\n");
        printf(" n denotes the number of games you want the program to play.\n");
        printf(" Example: teeko +h+s-l -h-s+l mem2.m 100\n");
        printf("  (play 100 games, player 1 must not use learning,\n");
        printf("   and player 2 must not use heuristics and searching\n");
        printf("   and must use file 'mem2.m' as his main memory.)\n");
        quitgame();
    }

    // --- update.c
    function addposition(ptmp, w) {
        gotoendofmemory();
        saveposition(ptmp, m);
        if (thinking) printf("Add ");
        if (w < 0) { putspaces(); putnumber(1, m); }
        else { putnumber(1, m); putspaces(); }
    }
    function adjustposition(ptmp, w) {
        if (thinking) printf("Adjust ");
        findposition(ptmp);
        if (w < 0) skip(m);
        learnednumber.fill(32);
        getnumber(m);
        let currentlearned = atoi4();
        currentlearned++;
        getback(m);
        putnumber(currentlearned, m);
    }
    function remember(ptmp) {
        let w = n % 2 ? -1 : 1;
        if (fixed && p0 === -1) w = -w;
        const current = position(), icurrent = position(), memorized = position();
        copyposition(ptmp, current);
        invertposition(ptmp, icurrent);
        let found = 0;
        for (;;) {
            const ret = loadposition(memorized, m);
            if (ret === 1) { found = 0; break; }
            if (comparepositions(memorized, current)) { found = 1; adjustposition(memorized, w); break; }
            if (comparepositions(memorized, icurrent)) { found = 1; adjustposition(memorized, -w); break; }
            skip(m);
            skip(m);
        }
        if (found) return;
        addposition(ptmp, w);
    }
    function doupdate() {
        const ptmp = position();
        opengamememory_read();
        for (;;) {
            const ret = loadposition(ptmp, g);
            if (ret === 1) break;
            openmemory_readwrite();
            remember(ptmp);
            closememory();
        }
        closegamememory();
    }
    function updatememory() {
        if (!learning || n < 9) return;
        if (repeat === 0) {
            if (thinking) printf("Updating memory...\n");
            doupdate();
            if (thinking) printf("\n");
        } else {
            if (autol1 === 1) { p = 1; doupdate(); }
            if (autol2 === 1) { p = -1; doupdate(); }
        }
    }

    // --- recall.c
    function recall(t, e) {
        let i, j, k, ret, won, lost, bestdiff, besteval;
        const diffs = [], bestdiffs = [], positions = [], bestpositions = [];
        const stored = position(), istored = position();
        j = 0;
        openmemory_readwrite();
        for (;;) {
            ret = loadposition(stored, m);
            if (ret === 1) break;
            invertposition(stored, istored);
            if (successor(stored) || successor(istored)) {
                if (thinking) printf(".");
                learnednumber.fill(32);
                getnumber(m);
                won = atoi4();
                learnednumber.fill(32);
                getnumber(m);
                lost = atoi4();
                positions[j] = position();
                if (successor(stored)) {
                    diffs[j] = won - lost;
                    copyposition(stored, positions[j]);
                } else {
                    diffs[j] = lost - won;
                    copyposition(istored, positions[j]);
                }
                if (fixed && t === -1) diffs[j] = -diffs[j];
                j++;
            } else {
                skip(m);
                skip(m);
            }
        }
        closememory();
        if (j === 0) { Xlearn[0] = 9; return; }
        if (j === 1) { copyposition(positions[0], Xlearn); return; }
        bestdiff = diffs[0];
        for (i = 0; i <= j - 1; i++) if (diffs[i] > bestdiff) bestdiff = diffs[i];
        k = 0;
        for (i = 0; i <= j - 1; i++) {
            if (diffs[i] === bestdiff) {
                bestdiffs[k] = diffs[i];
                bestpositions[k] = position();
                copyposition(positions[i], bestpositions[k]);
                k++;
            }
        }
        besteval = evaluate(bestpositions[0], t, e);
        copyposition(bestpositions[0], Xlearn);
        for (i = 1; i <= k - 1; i++) {
            ret = evaluate(bestpositions[i], t, e);
            if (ret > besteval) { besteval = ret; copyposition(bestpositions[i], Xlearn); }
        }
    }

    // --- openheur.c; X[i][j] is X[i*5+j]
    const at = (i, j) => X[i * 5 + j];
    const put = (i, j, v) => { X[i * 5 + j] = v; };
    function oplayinthemiddle(toput) { put(2, 2, toput); }
    // it picks one of the four at random until it finds one empty: if all four are taken, it never stops. Fixed puts
    // the pawn on a random empty field then.
    function oplayincells(toput, cells) {
        let i, j;
        if (cells.every(([a, b]) => at(a, b) !== 0)) {
            if (!fixed) throw new Hang(cells);
            for (;;) {
                const a = rand() % 5, b = rand() % 5;
                if (at(a, b) === 0) { put(a, b, toput); return; }
            }
        }
        for (;;) {
            const ret = rand() % 4;
            [i, j] = cells[ret];
            if (at(i, j) !== 0) continue;
            put(i, j, toput);
            return;
        }
    }
    const oplayinthecorner = toput => oplayincells(toput, [[1, 3], [1, 1], [3, 3], [3, 1]]);
    const oplayinthecross = toput => oplayincells(toput, [[1, 2], [2, 1], [2, 3], [3, 2]]);
    function oplayhv(toput) {
        const ret = rand() % 2;
        if (at(1, 1) === toput || at(3, 3) === toput) {
            if (ret === 0) {
                if (at(1, 3) === 0) { put(1, 3, toput); return; }
                if (at(3, 1) === 0) { put(3, 1, toput); return; }
            } else {
                if (at(3, 1) === 0) { put(3, 1, toput); return; }
                if (at(1, 3) === 0) { put(1, 3, toput); return; }
            }
        }
        if (at(1, 3) === toput || at(3, 1) === toput) {
            if (ret === 0) {
                if (at(1, 1) === 0) { put(1, 1, toput); return; }
                if (at(3, 3) === 0) { put(3, 3, toput); return; }
            } else {
                if (at(3, 3) === 0) { put(3, 3, toput); return; }
                if (at(1, 1) === 0) { put(1, 1, toput); return; }
            }
        }
    }
    function omake2(toput) {
        if (at(2, 2) === toput) oplayinthecorner(toput);
        else if (((at(1, 1) === toput || at(3, 3) === toput) && (at(1, 3) === 0 || at(3, 1) === 0))
            || ((at(1, 3) === toput || at(3, 1) === toput) && (at(1, 1) === 0 || at(3, 3) === 0)))
            oplayhv(toput);
        else oplayinthecross(toput);
    }
    // three cells: if the first two hold `who` and the third is empty, put `toput` in the third
    function fill3(who, toput, cells) {
        for (const [a, b, c] of cells)
            if (at(...a) === who && at(...b) === who && at(...c) === 0) { put(...c, toput); return 1; }
        return 0;
    }
    function oavoid3(toput, e) {
        for (let i = 0; i <= 4; i++)
            if (fill3(e, toput, [[[i, 1], [i, 2], [i, 3]], [[i, 2], [i, 3], [i, 1]], [[i, 1], [i, 3], [i, 2]]])) return 1;
        for (let j = 0; j <= 4; j++)
            if (fill3(e, toput, [[[1, j], [2, j], [3, j]], [[2, j], [3, j], [1, j]], [[1, j], [3, j], [2, j]]])) return 1;
        return fill3(e, toput, [[[1, 1], [2, 2], [3, 3]], [[2, 2], [3, 3], [1, 1]], [[1, 3], [2, 2], [3, 1]], [[3, 1], [2, 2], [1, 3]]]);
    }
    function omake3(toput) {
        const cells = [
            [[1, 1], [1, 2], [1, 3]], [[1, 2], [1, 3], [1, 1]], [[1, 1], [1, 3], [1, 2]],
            [[2, 1], [2, 2], [2, 3]], [[2, 2], [2, 3], [2, 1]],
        ];
        if (fill3(toput, toput, cells)) return 1;
        // if(X[2][3]==toput && X[2][1]==toput && X[2][2]==0){X[1][2]=toput; return 1;}: it puts the pawn on 12,
        // which may be taken, instead of 22
        if (at(2, 3) === toput && at(2, 1) === toput && at(2, 2) === 0) { if (fixed) put(2, 2, toput); else put(1, 2, toput); return 1; }
        return fill3(toput, toput, [
            [[3, 1], [3, 2], [3, 3]], [[3, 2], [3, 3], [3, 1]], [[3, 1], [3, 3], [3, 2]],
            [[1, 1], [2, 1], [3, 1]], [[2, 1], [3, 1], [1, 1]], [[1, 1], [3, 1], [2, 1]],
            [[1, 2], [2, 2], [3, 2]], [[1, 2], [3, 2], [2, 2]], [[2, 2], [3, 2], [1, 2]],
            [[1, 3], [2, 3], [3, 3]], [[1, 3], [3, 3], [2, 3]], [[2, 3], [3, 3], [1, 3]],
            [[1, 1], [2, 2], [3, 3]], [[2, 2], [3, 3], [1, 1]], [[1, 3], [2, 2], [3, 1]], [[3, 1], [2, 2], [1, 3]],
        ]);
    }
    // four cells: if the first three hold `who` and the fourth is empty, put `toput` in the fourth
    function fill4(who, toput, cells) {
        for (const [a, b, c, d] of cells)
            if (at(...a) === who && at(...b) === who && at(...c) === who && at(...d) === 0) { put(...d, toput); return 1; }
        return 0;
    }
    const squareCells = (i, j) => [
        [[i, j], [i + 1, j], [i, j + 1], [i + 1, j + 1]],
        [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]],
        [[i + 1, j + 1], [i + 1, j], [i, j + 1], [i, j]],
        [[i, j], [i + 1, j + 1], [i, j + 1], [i + 1, j]],
    ];
    function oavoid4(toput, e) {
        for (let i = 0; i <= 4; i++)
            if (fill4(e, toput, [[[i, 0], [i, 1], [i, 2], [i, 3]], [[i, 2], [i, 3], [i, 4], [i, 1]]])) return 1;
        for (let j = 0; j <= 4; j++)
            if (fill4(e, toput, [[[0, j], [1, j], [2, j], [3, j]], [[2, j], [3, j], [4, j], [1, j]]])) return 1;
        if (fill4(e, toput, [
            [[0, 1], [1, 2], [2, 3], [3, 4]], [[3, 4], [1, 2], [2, 3], [0, 1]],
            [[0, 0], [1, 1], [2, 2], [3, 3]], [[2, 2], [3, 3], [4, 4], [1, 1]],
            [[1, 0], [2, 1], [3, 2], [4, 3]], [[2, 1], [3, 2], [4, 3], [1, 0]],
            [[0, 3], [1, 2], [2, 1], [3, 0]], [[3, 0], [1, 2], [2, 1], [0, 3]],
            [[0, 4], [1, 3], [2, 2], [3, 1]], [[2, 2], [3, 1], [4, 0], [1, 3]],
            [[1, 4], [2, 3], [3, 2], [4, 1]], [[2, 3], [3, 2], [4, 1], [1, 4]],
        ])) return 1;
        for (let i = 0; i <= 3; i++)
            for (let j = 0; j <= 3; j++)
                if (fill4(e, toput, squareCells(i, j))) return 1;
        return 0;
    }
    function omake4(toput) {
        for (let i = 0; i <= 4; i++)
            if (fill4(toput, toput, [[[i, 0], [i, 1], [i, 2], [i, 3]], [[i, 2], [i, 3], [i, 4], [i, 1]]])) return 1;
        for (let j = 0; j <= 4; j++)
            if (fill4(toput, toput, [[[0, j], [1, j], [2, j], [3, j]], [[2, j], [3, j], [4, j], [1, j]]])) return 1;
        if (fill4(toput, toput, [
            [[0, 1], [1, 2], [2, 3], [3, 4]], [[3, 4], [1, 2], [2, 3], [0, 1]],
            [[0, 0], [1, 1], [2, 2], [3, 3]], [[2, 2], [3, 3], [4, 4], [1, 1]],
        ])) return 1;
        if (at(1, 1) === toput && at(2, 2) === toput && at(3, 3) === toput) {
            if (at(0, 0) === 0) { put(0, 0, toput); return 1; }
            if (at(4, 4) === 0) { put(4, 4, toput); return 1; }
        }
        if (fill4(toput, toput, [
            [[1, 0], [2, 1], [3, 2], [4, 3]], [[2, 1], [3, 2], [4, 3], [1, 0]],
            [[0, 3], [1, 2], [2, 1], [3, 0]], [[3, 0], [1, 2], [2, 1], [0, 3]],
            [[0, 4], [1, 3], [2, 2], [3, 1]], [[2, 2], [3, 1], [4, 0], [1, 3]],
        ])) return 1;
        if (at(1, 3) === toput && at(2, 2) === toput && at(3, 1) === toput) {
            if (at(0, 4) === 0) { put(0, 4, toput); return 1; }
            if (at(4, 0) === 0) { put(4, 0, toput); return 1; }
        }
        if (fill4(toput, toput, [
            [[1, 4], [2, 3], [3, 2], [4, 1]], [[2, 3], [3, 2], [4, 1], [1, 4]],
        ])) return 1;
        for (let i = 0; i <= 3; i++)
            for (let j = 0; j <= 3; j++)
                if (fill4(toput, toput, squareCells(i, j))) return 1;
        return 0;
    }

    // --- opening.c
    async function getopeningmove() {
        const phase = p0 === -1 ? "[Ply]" : "[Reply]";
        for (;;) {
            printf(`\n[Move ${(n + 1) / 2 | 0}] ${phase} Enter your opening move... >`);
            const s = await fgets();
            if (s[0] === C("q")) return 1;
            if (s[0] < 48 || s[0] > 52 || s[1] < 48 || s[1] > 52 || at(s[0] - 48, s[1] - 48) !== 0) continue;
            put(s[0] - 48, s[1] - 48, -1);
            return 0;
        }
    }
    const who = () => p0 !== 0 ? [1, -1] : [p, -p];
    function move1() {
        const [t] = who();
        if (at(2, 2) === 0) oplayinthemiddle(t);
        else if (at(1, 1) === 0 || at(1, 3) === 0 || at(3, 1) === 0 || at(3, 3) === 0) oplayinthecorner(t);
        else oplayinthecross(t);
    }
    function move3() { omake2(who()[0]); }
    function move4() { const [t, e] = who(); if (oavoid3(t, e)) return; move3(); }
    function move5() { if (omake3(who()[0])) return; move4(); }
    function move6() { const [t, e] = who(); if (oavoid4(t, e)) return; move5(); }
    function move7() { if (omake4(who()[0])) return; move6(); }
    function putopeningmove() {
        switch (n) {
            case 1: case 2: move1(); break;
            case 3: move3(); break;
            case 4: move4(); break;
            case 5: move5(); break;
            case 6: move6(); break;
            case 7: case 8: move7(); break;
        }
    }
    async function opening() {
        for (;;) {
            if (n === 9) return 0;
            if (n >= 7) {
                const [t, e] = who();
                if (four(X, t)) return 1;
                if (four(X, e)) return -1;
            }
            if (p0 !== 0) {
                if (repeat === 0 && n === 1) printf("\n");
                if (p === 1) {
                    const phase = p0 === 1 ? "[Ply]" : "[Reply]";
                    if (repeat === 0) printf(`\n[Move ${(n + 1) / 2 | 0}] ${phase} Thinking...\n`);
                    putopeningmove();
                } else if (await getopeningmove()) return -2;
            } else {
                if (repeat === 0 && n === 1) printposition(X, 1);
                if (pausing) {
                    printf("\nPress ENTER for the next move... >");
                    const s = await fgets();
                    if (s[0] === C("q")) return -2;
                }
                const phase = p === 1 ? "[Ply]" : "[Reply]";
                if (repeat === 0) printf(`\n[Move ${(n + 1) / 2 | 0}] ${phase} Thinking...\n`);
                putopeningmove();
            }
            if (repeat === 0) {
                if (p0 === 0) printposition(X, 1);
                else printposition(X, p0);
            }
            nextinit();
        }
    }

    // --- searchin.c
    function makeallmoves(q, a, b, t, s) {
        const ptmp = position();
        copyposition(q, ptmp);
        for (let i = -1; i <= 1; i++)
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;
                if (a + i < 0 || a + i > 4 || b + j < 0 || b + j > 4) continue;
                if (ptmp[(a + i) * 5 + b + j] !== 0) continue;
                ptmp[(a + i) * 5 + b + j] = t;
                ptmp[a * 5 + b] = 0;
                saveposition(ptmp, s);
                copyposition(q, ptmp);
            }
    }
    function develop1(q, t) {
        openlevel1_write();
        for (let i = 0; i <= 4; i++)
            for (let j = 0; j <= 4; j++)
                if (q[i * 5 + j] === t) makeallmoves(q, i, j, t, l1);
        closelevel1();
    }
    function develop12(q, t) {
        for (let i = 0; i <= 4; i++)
            for (let j = 0; j <= 4; j++)
                if (q[i * 5 + j] === t) makeallmoves(q, i, j, t, l2);
    }
    function develop2(e) {
        const ptmp = position();
        openlevel1_read();
        openlevel2_write();
        for (;;) {
            const ret = loadposition(ptmp, l1);
            if (ret === 1) break;
            develop12(ptmp, e);
            putmarkerl2();
        }
        closelevel2();
        closelevel1();
    }
    function decide(t, e) {
        let i, j, k, ret, min, max;
        const evals = [], tmpevals = [];
        const ptmp = position();
        openlevel2_read();
        k = 0;
        for (;;) {
            ret = loadposition(ptmp, l2);
            if (thinking) printf(".");
            if (ret === 1) break;
            i = 0;
            for (;;) {
                if (ret === 0) {
                    tmpevals[i++] = evaluate(ptmp, t, e);
                    ret = loadposition(ptmp, l2);
                }
                if (ret === 2) {
                    min = tmpevals[0];
                    for (j = 1; j <= i - 1; j++) if (min > tmpevals[j]) min = tmpevals[j];
                    evals[k++] = min;
                    break;
                }
            }
        }
        closelevel2();
        max = evals[0];
        for (i = 1; i <= k - 1; i++) if (max < evals[i]) max = evals[i];
        openlevel1_read();
        if (fixed) {
            // the move whose worst reply is the best: the first i with evals[i]==max
            for (i = 0; i <= k - 1; i++) {
                if (loadposition(ptmp, l1) === 1) error("Unknown error during searching (loadposition failed).");
                if (evals[i] === max) break;
            }
        } else {
            // the C looks for a move whose own evaluation is max, then reads back one or two positions short of it
            for (i = 0; i <= k - 1; i++) {
                if (loadposition(ptmp, l1) === 1) error("Unknown error during searching (loadposition failed).");
                if (evaluate(ptmp, t, e) === max) break;
            }
            rewind(l1);
            for (j = 0; j < i - 1; j++)
                if (loadposition(ptmp, l1) === 1) error("Unknown error during searching (loadposition failed).");
        }
        copyposition(ptmp, Xsearch);
        closelevel1();
    }
    function search(ptmp, t, e) {
        develop1(ptmp, t);
        develop2(e);
        decide(t, e);
    }

    // --- gameheur.c; -1 means no cell to leave out, but the C tests x>0, so a cell in row 0 is never left out
    const given = x => fixed ? x >= 0 : x > 0;
    function play(a, b, t, x1, y1, x2, y2, x3, y3) {
        if (at(a, b) !== 0) return 0;
        for (let i = -1; i <= 1; i++)
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;
                if (a + i < 0 || a + i > 4 || b + j < 0 || b + j > 4) continue;
                if (given(x1) && a + i === x1 && b + j === y1) continue;
                if (given(x2) && a + i === x2 && b + j === y2) continue;
                if (given(x3) && a + i === x3 && b + j === y3) continue;
                if (at(a + i, b + j) === t) {
                    put(a + i, b + j, 0);
                    put(a, b, t);
                    return 1;
                }
            }
        return 0;
    }
    function canplay(a, b, t, x1, y1, x2, y2, x3, y3) {
        if (mem[a * 5 + b] === t) return 1;   // a is 5 once, in makedouble3: that reads past the board
        for (let i = -1; i <= 1; i++)
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;
                if (a + i < 0 || a + i > 4 || b + j < 0 || b + j > 4) continue;
                if (given(x1) && a + i === x1 && b + j === y1) continue;
                if (given(x2) && a + i === x2 && b + j === y2) continue;
                if (given(x3) && a + i === x3 && b + j === y3) continue;
                if (at(a + i, b + j) === t) return 1;
            }
        return 0;
    }
    const patternfor4 = (t, x1, y1, x2, y2, x3, y3, x4, y4) => at(x1, y1) === t && at(x2, y2) === t && at(x3, y3) === t && at(x4, y4) === 0 ? 1 : 0;
    const patternfor3 = (t, x1, y1, x2, y2, x3, y3) => at(x1, y1) === t && at(x2, y2) === t && at(x3, y3) === 0 ? 1 : 0;
    const F = (orig, fix) => fixed ? fix : orig;

    // make4's and avoid4's patterns, [the three cells, the empty one, and the cells play() leaves out]; their order is the C's
    function fours() {
        const list = [];
        for (let i = 0; i <= 4; i++) list.push(["row", i]);
        for (let j = 0; j <= 4; j++) list.push(["col", j]);
        return list;
    }
    const rowPatterns = i => [
        [[i, 0, i, 1, i, 2], [i, 3], [i, 2, -1, -1, -1, -1]],
        [[i, 2, i, 3, i, 4], [i, 1], [i, 2, -1, -1, -1, -1]],
        [[i, 1, i, 2, i, 3], [i, 0], [i, 1, -1, -1, -1, -1]],
        [[i, 1, i, 2, i, 3], [i, 4], [i, 3, -1, -1, -1, -1]],
        [[i, 0, i, 2, i, 3], [i, 1], [i, 0, i, 2, -1, -1]],
        [[i, 0, i, 1, i, 3], [i, 2], [i, 1, i, 3, -1, -1]],
        [[i, 1, i, 2, i, 4], [i, 3], [i, 2, i, 4, -1, -1]],
        [[i, 1, i, 3, i, 4], [i, 2], [i, 1, i, 3, -1, -1]],
    ];
    const colPatterns = j => rowPatterns(j).map(([c, d, x]) => [[c[1], c[0], c[3], c[2], c[5], c[4]], [d[1], d[0]],
        [x[1], x[0], x[3], x[2], x[5], x[4]]]);
    const diagonalPatterns = forAvoid => [
        // up, left -> right
        [[0, 1, 1, 2, 2, 3], [3, 4], [2, 3, -1, -1, -1, -1]],
        [[1, 2, 2, 3, 3, 4], [0, 1], [1, 2, -1, -1, -1, -1]],
        [[0, 1, 1, 2, 3, 4], [2, 3], [1, 2, 3, 4, -1, -1]],
        [[0, 1, 2, 3, 3, 4], [1, 2], [0, 1, 2, 3, -1, -1]],
        // down: in the last two, the C has 3,4 for 3,2 once in each
        [[1, 0, 2, 1, 3, 2], [4, 3], [3, 2, -1, -1, -1, -1]],
        [[2, 1, 3, 2, 4, 3], [1, 0], [2, 1, -1, -1, -1, -1]],
        F([[1, 0, 2, 1, 4, 3], [3, 4], [2, 1, 4, 3, -1, -1]], [[1, 0, 2, 1, 4, 3], [3, 2], [2, 1, 4, 3, -1, -1]]),
        F([[1, 0, 3, 4, 4, 3], [2, 1], [1, 0, 3, 4, -1, -1]], [[1, 0, 3, 2, 4, 3], [2, 1], [1, 0, 3, 2, -1, -1]]),
        // main
        [[0, 0, 1, 1, 2, 2], [3, 3], [2, 2, -1, -1, -1, -1]],
        [[1, 1, 2, 2, 3, 3], [0, 0], [1, 1, -1, -1, -1, -1]],
        [[0, 0, 2, 2, 3, 3], [1, 1], [0, 0, 2, 2, -1, -1]],
        [[0, 0, 1, 1, 3, 3], [2, 2], [1, 1, 3, 3, 0, 0]],
        [[1, 1, 2, 2, 3, 3], [4, 4], [3, 3, -1, -1, -1, -1]],
        [[1, 1, 2, 2, 4, 4], [3, 3], [2, 2, 4, 4, -1, -1]],
        [[1, 1, 3, 3, 4, 4], [2, 2], [1, 1, 3, 3, -1, -1]],
        [[2, 2, 3, 3, 4, 4], [1, 1], [2, 2, -1, -1, -1, -1]],
        // up, right -> left
        [[0, 3, 1, 2, 2, 1], [3, 0], [2, 1, -1, -1, -1, -1]],
        [[1, 2, 2, 1, 3, 0], [0, 3], [1, 2, -1, -1, -1, -1]],
        [[0, 3, 1, 2, 3, 0], [2, 1], [1, 2, 3, 0, -1, -1]],
        [[0, 3, 2, 1, 3, 0], [1, 2], [0, 3, 2, 1, -1, -1]],
        // down: the C has 3,0 for 3,2 in the last two
        [[1, 4, 2, 3, 3, 2], [4, 1], [3, 2, -1, -1, -1, -1]],
        [[2, 3, 3, 2, 4, 1], [1, 4], [2, 3, -1, -1, -1, -1]],
        F([[1, 4, 2, 3, 4, 1], [3, 0], [2, 3, 4, 1, -1, -1]], [[1, 4, 2, 3, 4, 1], [3, 2], [2, 3, 4, 1, -1, -1]]),
        F([[1, 4, 3, 0, 4, 1], [2, 3], [1, 4, 3, 0, -1, -1]], [[1, 4, 3, 2, 4, 1], [2, 3], [1, 4, 3, 2, -1, -1]]),
        // main: the fourth leaves out 0,0 for 0,4; avoid4 has 0,0 for 0,4 in its second too
        [[0, 4, 1, 3, 2, 2], [3, 1], [2, 2, -1, -1, -1, -1]],
        forAvoid ? F([[1, 3, 2, 2, 3, 1], [0, 0], [1, 3, -1, -1, -1, -1], [0, 4]], [[1, 3, 2, 2, 3, 1], [0, 4], [1, 3, -1, -1, -1, -1]])
            : [[1, 3, 2, 2, 3, 1], [0, 4], [1, 3, -1, -1, -1, -1]],
        [[0, 4, 2, 2, 3, 1], [1, 3], [0, 4, 2, 2, -1, -1]],
        F([[0, 4, 1, 3, 3, 1], [2, 2], [1, 3, 3, 1, 0, 0]], [[0, 4, 1, 3, 3, 1], [2, 2], [1, 3, 3, 1, 0, 4]]),
        [[1, 3, 2, 2, 3, 1], [4, 0], [3, 1, -1, -1, -1, -1]],
        [[1, 3, 2, 2, 4, 0], [3, 1], [2, 2, 4, 0, -1, -1]],
        [[1, 3, 3, 1, 4, 0], [2, 2], [1, 3, 3, 1, -1, -1]],
        [[2, 2, 3, 1, 4, 0], [1, 3], [2, 2, -1, -1, -1, -1]],
    ];
    const squarePatterns = (i, j) => [
        [[i, j, i, j + 1, i + 1, j], [i + 1, j + 1], [i, j, i, j + 1, i + 1, j]],
        [[i, j, i, j + 1, i + 1, j + 1], [i + 1, j], [i, j, i, j + 1, i + 1, j + 1]],
        [[i, j, i + 1, j, i + 1, j + 1], [i, j + 1], [i, j, i + 1, j, i + 1, j + 1]],
        [[i, j + 1, i + 1, j, i + 1, j + 1], [i, j], [i, j + 1, i + 1, j, i + 1, j + 1]],
    ];
    // one make4 or avoid4 pattern: for make4, t has the three and moves to the fourth; for avoid4, e has them, can get
    // there, and t moves there first. `played` is where play() goes when it isn't the empty cell (avoid4's slip)
    function tryFour(t, e, avoid, [c, d, x, played]) {
        const owner = avoid ? e : t;
        if (!patternfor4(owner, c[0], c[1], c[2], c[3], c[4], c[5], d[0], d[1])) return 0;
        const [pa, pb] = played || d;
        if (avoid && !canplay(pa, pb, e, ...x)) return 0;
        return play(pa, pb, t, ...x);
    }
    function fourHeuristic(t, e, avoid) {
        for (let i = 0; i <= 4; i++) for (const pat of rowPatterns(i)) if (tryFour(t, e, avoid, pat)) return 1;
        for (let j = 0; j <= 4; j++) for (const pat of colPatterns(j)) if (tryFour(t, e, avoid, pat)) return 1;
        for (const pat of diagonalPatterns(avoid)) if (tryFour(t, e, avoid, pat)) return 1;
        for (let i = 0; i <= 3; i++)
            for (let j = 0; j <= 3; j++)
                for (const pat of squarePatterns(i, j)) if (tryFour(t, e, avoid, pat)) return 1;
        return 0;
    }
    const make4 = t => fourHeuristic(t, -t, false);
    const avoid4 = (t, e) => fourHeuristic(t, e, true);

    function makedouble3(t, e) {
        const N = -1;
        const ends = (a, b, c, d) => !canplay(a, b, e, N, N, N, N, N, N) || !canplay(c, d, e, N, N, N, N, N, N);
        let i, j;
        for (i = 0; i <= 4; i++) {
            if (patternfor3(t, i, 1, i, 2, i, 3) && ends(i, 0, i, 4)) if (play(i, 3, t, i, 2, N, N, N, N)) return 1;
            if (patternfor3(t, i, 2, i, 3, i, 1) && ends(i, 0, i, 4)) if (play(i, 1, t, i, 2, N, N, N, N)) return 1;
            if (patternfor3(t, i, 1, i, 3, i, 2) && ends(i, 0, i, 4)) if (play(i, 2, t, i, 1, i, 3, N, N)) return 1;
        }
        // here i is 5; the third vertical pattern asks canplay(i,4) for canplay(4,j), and leaves out 3,1 for 3,j
        for (j = 0; j <= 4; j++) {
            if (patternfor3(t, 1, j, 2, j, 3, j) && ends(0, j, 4, j)) if (play(3, j, t, 2, j, N, N, N, N)) return 1;
            if (patternfor3(t, 2, j, 3, j, 1, j) && ends(0, j, 4, j)) if (play(1, j, t, 2, j, N, N, N, N)) return 1;
            if (patternfor3(t, 1, j, 3, j, 2, j) && (fixed ? ends(0, j, 4, j) : ends(0, j, i, 4)))
                if (fixed ? play(2, j, t, 1, j, 3, j, N, N) : play(2, j, t, 1, j, 3, 1, N, N)) return 1;
        }
        if (patternfor3(t, 1, 1, 2, 2, 3, 3) && ends(0, 0, 4, 4)) if (play(3, 3, t, 2, 2, N, N, N, N)) return 1;
        if (patternfor3(t, 2, 2, 3, 3, 1, 1) && ends(0, 0, 4, 4)) if (play(1, 1, t, 2, 2, N, N, N, N)) return 1;
        if (patternfor3(t, 1, 1, 3, 3, 2, 2) && ends(0, 0, 4, 4)) if (play(2, 2, t, 1, 1, 3, 3, N, N)) return 1;
        if (patternfor3(t, 1, 3, 2, 2, 3, 1) && ends(0, 4, 4, 0)) if (play(3, 1, t, 2, 2, N, N, N, N)) return 1;
        if (patternfor3(t, 2, 2, 3, 1, 1, 3) && ends(0, 4, 4, 0)) if (play(1, 3, t, 2, 2, N, N, N, N)) return 1;
        if (patternfor3(t, 1, 3, 3, 1, 2, 2) && ends(0, 4, 4, 0)) if (play(2, 2, t, 1, 3, 3, 1, N, N)) return 1;
        return 0;
    }

    // makenondefendable3's and avoidnondefendable3's lines: [two cells, the empty one, the cell the opponent must
    // not reach, the cells play() leaves out]
    const threeRows = i => [
        [[i, 0, i, 1], [i, 2], [i, 3], [i, 1, -1, -1]], [[i, 1, i, 2], [i, 0], [i, 3], [i, 1, -1, -1]], [[i, 0, i, 2], [i, 1], [i, 3], [i, 0, i, 2]],
        [[i, 2, i, 3], [i, 4], [i, 1], [i, 3, -1, -1]], [[i, 3, i, 4], [i, 2], [i, 1], [i, 3, -1, -1]], [[i, 2, i, 4], [i, 3], [i, 1], [i, 2, i, 4]],
    ];
    const threeCols = j => threeRows(j).map(([c, d, r, x]) => [[c[1], c[0], c[3], c[2]], [d[1], d[0]], [r[1], r[0]],
        [x[1], x[0], x[3], x[2]]]);
    const threeDiagonals = [
        [[0, 1, 1, 2], [2, 3], [3, 4], [1, 2, -1, -1]], [[1, 2, 2, 3], [0, 1], [3, 4], [1, 2, -1, -1]], [[0, 1, 2, 3], [1, 2], [3, 4], [0, 1, 2, 3]],
        [[1, 2, 2, 3], [3, 4], [0, 1], [2, 3, -1, -1]], [[2, 3, 3, 4], [1, 2], [0, 1], [2, 3, -1, -1]], [[1, 2, 3, 4], [2, 3], [0, 1], [1, 2, 3, 4]],
        [[0, 0, 1, 1], [2, 2], [3, 3], [1, 1, -1, -1]], [[1, 1, 2, 2], [0, 0], [3, 3], [1, 1, -1, -1]], [[0, 0, 2, 2], [1, 1], [3, 3], [0, 0, 2, 2]],
        [[2, 2, 3, 3], [4, 4], [1, 1], [3, 3, -1, -1]], [[3, 3, 4, 4], [2, 2], [1, 1], [3, 3, -1, -1]], [[2, 2, 4, 4], [3, 3], [1, 1], [2, 2, 4, 4]],
        [[1, 0, 2, 1], [3, 2], [4, 3], [2, 1, -1, -1]], [[2, 1, 3, 2], [1, 0], [4, 3], [2, 1, -1, -1]], [[1, 0, 3, 2], [2, 1], [4, 3], [1, 0, 3, 2]],
        [[2, 1, 3, 2], [4, 3], [1, 0], [3, 2, -1, -1]], [[3, 2, 4, 3], [2, 1], [1, 0], [3, 2, -1, -1]], [[2, 1, 4, 3], [3, 2], [1, 0], [2, 1, 4, 3]],
        [[0, 3, 1, 2], [2, 1], [3, 0], [1, 2, -1, -1]], [[1, 2, 2, 1], [0, 3], [3, 0], [1, 2, -1, -1]], [[0, 3, 2, 1], [1, 2], [3, 0], [0, 3, 2, 1]],
        [[1, 2, 2, 1], [3, 0], [0, 3], [2, 1, -1, -1]], [[2, 1, 3, 0], [1, 2], [0, 3], [2, 1, -1, -1]], [[1, 2, 3, 0], [2, 1], [0, 3], [1, 2, 3, 0]],
        [[0, 4, 1, 3], [2, 2], [3, 1], [1, 3, -1, -1]], [[1, 3, 2, 2], [0, 4], [3, 1], [1, 3, -1, -1]], [[0, 4, 2, 2], [1, 3], [3, 1], [0, 4, 2, 2]],
        [[2, 2, 3, 1], [4, 0], [1, 3], [3, 1, -1, -1]], [[3, 1, 4, 0], [2, 2], [1, 3], [3, 1, -1, -1]], [[2, 2, 4, 0], [3, 1], [1, 3], [2, 2, 4, 0]],
        [[1, 4, 2, 3], [3, 2], [4, 1], [2, 3, -1, -1]], [[2, 3, 3, 2], [1, 4], [4, 1], [2, 3, -1, -1]], [[1, 4, 3, 2], [2, 3], [4, 1], [1, 4, 3, 2]],
        [[2, 3, 3, 2], [4, 1], [1, 4], [3, 2, -1, -1]], [[3, 2, 4, 1], [2, 3], [1, 4], [3, 2, -1, -1]], [[2, 3, 4, 1], [3, 2], [1, 4], [2, 3, 4, 1]],
    ];
    // the squares: A=i,j B=i,j+1 C=i+1,j D=i+1,j+1. In the C, the third pattern guards C, which is its own cell, for
    // D, and the fourth asks for C to be both taken and empty, for A and C taken and D empty
    const threeSquares = (i, j) => [
        [[i, j, i, j + 1], [i + 1, j], [i + 1, j + 1], [i, j, i, j + 1], [i + 1, j]],
        [[i, j, i, j + 1], [i + 1, j + 1], [i + 1, j], [i, j, i, j + 1], [i + 1, j + 1]],
        F([[i, j, i + 1, j], [i, j + 1], [i + 1, j], [i, j, i + 1, j], [i, j + 1]], [[i, j, i + 1, j], [i, j + 1], [i + 1, j + 1], [i, j, i + 1, j], [i, j + 1]]),
        F([[i, j, i + 1, j], [i + 1, j], [i, j + 1], [i, j, i + 1, j], [i + 1, j]], [[i, j, i + 1, j], [i + 1, j + 1], [i, j + 1], [i, j, i + 1, j], [i + 1, j + 1]]),
        [[i + 1, j, i + 1, j + 1], [i, j], [i, j + 1], [i + 1, j, i + 1, j + 1], [i, j]],
        [[i + 1, j, i + 1, j + 1], [i, j + 1], [i, j], [i + 1, j, i + 1, j + 1], [i, j + 1]],
        [[i, j + 1, i + 1, j + 1], [i, j], [i + 1, j], [i, j + 1, i + 1, j + 1], [i, j]],
        [[i, j + 1, i + 1, j + 1], [i + 1, j], [i, j], [i, j + 1, i + 1, j + 1], [i + 1, j]],
    ];
    function nondefendable3(t, e, avoid) {
        const N = -1;
        const owner = avoid ? e : t;
        const line = ([c, d, r, x]) => patternfor3(owner, c[0], c[1], c[2], c[3], d[0], d[1])
            && (avoid || !canplay(r[0], r[1], e, N, N, N, N, N, N))
            && play(d[0], d[1], t, ...(avoid ? [N, N, N, N] : x), N, N);
        let i, j;
        for (i = 0; i <= 4; i++) for (const l of threeRows(i)) if (line(l)) return 1;
        for (j = 0; j <= 4; j++) for (const l of threeCols(j)) if (line(l)) return 1;
        for (const l of threeDiagonals) if (line(l)) return 1;
        // for(i=j; i<=3; i++) for(j=1; j<=3; j++): j is 5 here, so this never runs
        for (i = fixed ? 0 : j; i <= 3; i++)
            for (j = fixed ? 0 : 1; j <= 3; j++)
                for (const [c, d, r, x, target] of threeSquares(i, j)) {
                    if (!patternfor3(owner, c[0], c[1], c[2], c[3], d[0], d[1])) continue;
                    if (!avoid && canplay(r[0], r[1], e, N, N, N, N, N, N)) continue;
                    if (play(target[0], target[1], t, ...(avoid ? [N, N, N, N] : x), N, N)) return 1;
                }
        return 0;
    }
    const makenondefendable3 = (t, e) => nondefendable3(t, e, false);
    const avoidnondefendable3 = (t, e) => nondefendable3(t, e, true);
    function avoiddouble3(t, e) {
        const N = -1;
        const lines = [];
        for (let i = 0; i <= 4; i++) lines.push([i, 1, i, 2, i, 3], [i, 2, i, 3, i, 1], [i, 1, i, 3, i, 2]);
        for (let j = 0; j <= 4; j++) lines.push([1, j, 2, j, 3, j], [2, j, 3, j, 1, j], [1, j, 3, j, 2, j]);
        lines.push([1, 1, 2, 2, 3, 3], [2, 2, 3, 3, 1, 1], [1, 1, 3, 3, 2, 2], [1, 3, 2, 2, 3, 1], [2, 2, 3, 1, 1, 3], [1, 3, 3, 1, 2, 2]);
        for (const [a, b, c, d, x, y] of lines)
            if (patternfor3(e, a, b, c, d, x, y)) if (play(x, y, t, N, N, N, N, N, N)) return 1;
        return 0;
    }
    function playrandom(t) {
        for (let tries = 0; ; tries++) {
            if (tries > 1e6) throw new Hang(null);
            const a = rand() % 5;
            const b = rand() % 5;
            if (at(a, b) !== 0) continue;
            if (play(a, b, t, -1, -1, -1, -1, -1, -1) === 0) continue;
            return;
        }
    }

    // --- game.c
    async function getmove() {
        const phase = p0 === -1 ? "[Ply]" : "[Reply]";
        for (;;) {
            printf(`\n[Move ${(n + 1) / 2 | 0}] ${phase} Enter your move... >`);
            const s = await fgets();
            if (s[0] === C("q")) return 1;
            // the C tests s[2]>'4' twice, and never s[3]>'4'; so X[s[2]-'0'][s[3]-'0'] can be past the row, or
            // past the board. It never asks whether the move is to a neighbouring field.
            if (s[0] < 48 || s[0] > 52 || s[1] < 48 || s[1] > 52 || s[2] < 48 || s[2] > 52 || s[3] < 48 || s[2] > 52) continue;
            if (fixed && (s[3] > 52 || Math.abs(s[0] - s[2]) > 1 || Math.abs(s[1] - s[3]) > 1)) continue;
            const from = (s[0] - 48) * 5 + s[1] - 48, to = (s[2] - 48) * 5 + s[3] - 48;
            if (mem[from] !== -1 || mem[to] !== 0) continue;
            mem[from] = 0;
            mem[to] = -1;
            return 0;
        }
    }
    function heurplay() {
        const [t, e] = who();
        const ptmp = position();
        copyposition(X, ptmp);
        if (thinking) printf("\nHeuristics: ");
        const steps = [["m4 ", () => make4(t), 1], ["a4 ", () => avoid4(t, e), 1], ["md3 ", () => makedouble3(t, e), 0],
            ["mnd3 ", () => makenondefendable3(t, e), 0], ["ad3 ", () => avoiddouble3(t, e), 0], ["and3 ", () => avoidnondefendable3(t, e), 0]];
        for (const [name, heuristic, must] of steps) {
            if (thinking) printf(name);
            if (heuristic()) {
                if (thinking) printf("\n");
                copyposition(X, Xheur);
                copyposition(ptmp, X);
                return must;
            }
        }
        if (thinking) printf("rnd \n");
        playrandom(t);
        copyposition(X, Xheur);
        copyposition(ptmp, X);
        return 0;
    }
    function searchplay() {
        const [t, e] = who();
        const ptmp = position();
        copyposition(X, ptmp);
        if (thinking) {
            printf(`Old eval:${evaluate(X, t, e)}  `);
            printf("Searching");
        }
        search(ptmp, t, e);
        if (thinking) printf("\n");
    }
    // ptmp is 0s here: it isn't set before develop1() uses it, and what the C found there can't be known
    function learnplay(t, e) {
        const ptmp = position();
        if (!searchplaying) develop1(fixed ? X : ptmp, t);
        copyposition(X, ptmp);
        if (thinking) printf("Recalling");
        recall(t, e);
        if (thinking) printf("\n");
    }
    function killermove() {
        copyposition(Xheur, X);
        if (thinking) printf("(killer move occured)\n");
    }
    function batchPlayer(t) {
        if (repeat > 0) {
            if (t === 1) { heurplaying = autoh1; searchplaying = autos1; learning = autol1; }
            else if (t === -1) { heurplaying = autoh2; searchplaying = autos2; learning = autol2; }
        }
    }
    function choose() {
        const [t, e] = who();
        let evalsearch, evalheur, evallearn;
        batchPlayer(t);
        if (thinking) printf("Choosing the best move.\n");
        evalheur = heurplaying ? evaluate(Xheur, t, e) : -MAXEVAL;
        evalsearch = searchplaying ? evaluate(Xsearch, t, e) : -MAXEVAL;
        if (learning) evallearn = Xlearn[0] !== 9 ? evaluate(Xlearn, t, e) : -MAXEVAL;
        else evallearn = -MAXEVAL;
        if (thinking) {
            printf("eval(heuristic)=");
            printf(evalheur > -MAXEVAL ? `${evalheur} ` : "N/A ");
            printf("eval(search)=");
            printf(evalsearch > -MAXEVAL ? `${evalsearch} ` : "N/A ");
            printf("eval(learn)=");
            if (learning) printf(evallearn > -MAXEVAL ? `${evallearn}\n` : "Not found\n");
            else printf("N/A\n");
        }
        if (evallearn > -MAXEVAL && evallearn >= evalheur && evallearn >= evalsearch) {
            copyposition(Xlearn, X);
            if (thinking) printf("Playing the learned move.\n");
            return;
        }
        if (evalsearch > -MAXEVAL && evalsearch >= evalheur && evalsearch >= evallearn) {
            copyposition(Xsearch, X);
            if (thinking) printf("Playing the search move.\n");
            return;
        }
        if (evalheur > -MAXEVAL && evalheur >= evallearn && evalheur >= evalsearch) {
            copyposition(Xheur, X);
            if (thinking) printf("Playing the heuristic move.\n");
            return;
        }
        if (thinking) printf("Random move must be used...\n");
        playrandom(t);
        copyposition(X, Xheur);
    }
    function putmove() {
        const [t, e] = who();
        batchPlayer(t);
        if (searchplaying || heurplaying || learning) {
            if (heurplaying) {
                if (heurplay() === 1) { killermove(); return; }
            }
            if (searchplaying) searchplay();
            if (learning) learnplay(t, e);
        } else {
            if (thinking) printf("rnd \n");
            playrandom(t);
            return;
        }
        choose();
    }
    async function game() {
        opengamememory_write();
        for (;;) {
            const [t, e] = who();
            if (four(X, t)) { closegamememory(); return 1; }
            if (four(X, e)) { closegamememory(); return -1; }
            if (n > 9 + 4 * DRAW - 1 && p0 === 0) {
                if (isdraw(2) || isdraw(3) || isdraw(4)) { closegamememory(); return 0; }
            }
            // the C asks isdraw(5), which it doesn't know: it compares a position with itself, and says yes
            if (n > 9 + 4 * DRAW - 1 && p0 !== 0) {
                if (isdraw(2) || isdraw(3) || isdraw(fixed ? 4 : 5)) {
                    if (p === 1) {
                        if (await offerdraw()) { closegamememory(); return 0; }
                    }
                }
            }
            if (p0 !== 0) {
                if (p === 1) {
                    const phase = p0 === 1 ? "[Ply]" : "[Reply]";
                    if (repeat === 0) {
                        printf(`\n[Move ${(n + 1) / 2 | 0}] ${phase} Thinking...\n`);
                        if (!thinking) printf("\n");
                    }
                    putmove();
                } else if (await getmove()) return -2;
            } else {
                if (pausing) {
                    printf("\nPress ENTER for the next move... >");
                    const s = await fgets();
                    if (s[0] === C("q")) { closegamememory(); return -2; }
                }
                const phase = p === 1 ? "[Ply]" : "[Reply]";
                if (repeat === 0) {
                    printf(`\n[Move ${(n + 1) / 2 | 0}] ${phase} Thinking...`);
                    if (!thinking) printf("\n");
                }
                putmove();
            }
            if (repeat === 0) {
                if (p0 === 0) printposition(X, 1);
                else printposition(X, p0);
            }
            if (searchplaying && thinking) printf(`\nNew eval:${evaluate(X, t, e)} `);
            saveposition(X, g);
            nextinit();
        }
    }
    async function wholegame(whomoves) {
        init(whomoves);
        if (p0 === -1) printposition(X, p0);
        const ret = await opening();
        if (ret !== 0) return ret;
        return await game();
    }

    // --- teeko.c
    async function main(argv) {
        let pass = 0, ret;
        repeat = 0;
        if (parse(argv) === 1) usage();
        io.random.srand(io.time());
        creatememory();
        createstat();
        if (repeat > 0) {
            pausing = 0;
            thinking = 0;
            autointro();
            for (let i = 0; i <= repeat - 1; i++) {
                printf(`Playing game ${i + 1}...`);
                pass = 0;
                ret = await wholegame(pass);
                printf(` [last move was ${n}]`);
                switch (ret) {
                    case -1: await defeat(); break;
                    case 0: await draw(); break;
                    case 1: await win(); break;
                }
                if (io.tick) await io.tick(i + 1);
            }
            quitgame();
        }
        for (;;) {
            menu();
            const input = await fgets();
            switch (String.fromCharCode(input[0] & 255)) {
                case "1": case "2": case "3":
                    pass = input[0] === C("1") ? -1 : input[0] === C("2") ? 1 : 0;
                    ret = await wholegame(pass);
                    switch (ret) {
                        case -1: await defeat(); break;
                        case 0: await draw(); break;
                        case 1: await win(); break;
                        case -2: await gamebreak(); break;
                    }
                    break;
                case "p": pausing = switcher(pausing); break;
                case "h": heurplaying = switcher(heurplaying); break;
                case "s": searchplaying = switcher(searchplaying); break;
                case "l": learning = switcher(learning); break;
                case "t": thinking = switcher(thinking); break;
                case "?": await statistics(); break;
                case "r": await rules(); break;
                case "/": await help(); break;
                case "q": quitgame(); return 0;
            }
        }
    }

    async function run(argv) {
        try {
            await main(argv);
            exit(EXIT_SUCCESS);
        } catch (x) {
            if (x instanceof Exit) return x.code;
            if (x instanceof Hang) { for (const f of handles) if (f.open) fclose(f); return x; }
            throw x;
        }
    }

    return {
        run,
        // the process ends (Ctrl+C): its files are closed, and left as they are
        kill() { for (const f of [...handles]) fclose(f); },
        // for testing the heuristics one by one against the C
        heuristics: io.exposeHeuristics ? { mem, make4, avoid4, makedouble3, makenondefendable3, avoiddouble3, avoidnondefendable3,
            oavoid3, omake3, oavoid4, omake4, omake2, move1, four, three, evaluate, setTurn(np0, np, nn) { p0 = np0; p = np; n = nn; } } : undefined,
        get board() { return X; },
        get state() { return { n, p, p0, repeat }; },
    };
}

// Windows' way of splitting a command line into argv[]: spaces separate, quotes group, \" is a quote
function splitCommandLine(line) {
    const argv = [];
    let i = 0;
    while (i < line.length) {
        while (i < line.length && /\s/.test(line[i])) i++;
        if (i >= line.length) break;
        let arg = "", quoted = false;
        while (i < line.length && (quoted || !/\s/.test(line[i]))) {
            if (line[i] === "\\") {
                let k = i;
                while (line[k] === "\\") k++;
                const slashes = k - i;
                if (line[k] === "\"") { arg += "\\".repeat(slashes >> 1); if (slashes & 1) { arg += "\""; i = k + 1; } else i = k; }
                else { arg += "\\".repeat(slashes); i = k; }
            } else if (line[i] === "\"") {
                if (quoted && line[i + 1] === "\"") { arg += "\""; i += 2; }
                else { quoted = !quoted; i++; }
            } else arg += line[i++];
        }
        argv.push(arg);
    }
    return argv;
}

if (typeof module !== "undefined") module.exports = { createTeeko, Directory, msvcRandom, splitCommandLine, Exit, Hang };

// ---------------------------------------------------------------------------------------------------------
// The page: a console window with a C:\TEEKO> prompt, the board to click, and the directory, kept in the browser

if (typeof document !== "undefined") {
    const $ = id => document.getElementById(id);
    const COLS = 80, KEEP = 4000;
    const STORE = "teeko-directory";

    // --- the directory, and the saved memories as read-only folders
    let stored = {};
    try { stored = JSON.parse(localStorage.getItem(STORE) || "{}"); } catch (e) { stored = {}; }
    const dir = new Directory(Object.entries(stored));
    const saved = new Map(SAVED.map(([name, data, from]) => [name.toLowerCase(), { name, data, from }]));
    let saveTimer = null;
    dir.onchange = () => {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
            const all = {};
            for (const f of dir.list()) all[f.name] = dir.text(f.name);
            try { localStorage.setItem(STORE, JSON.stringify(all)); } catch (e) { /* private window or full: not kept */ }
            showFiles();
        }, 300);
    };
    const readFile = name => saved.has(name.toLowerCase()) ? saved.get(name.toLowerCase()).data : dir.text(name);

    // --- the console window
    const con = { lines: [], cur: "", input: "", waiting: null, running: null, promptShown: false };
    function out(s) {
        for (const ch of s) {
            if (ch === "\n") { con.lines.push(con.cur); con.cur = ""; }
            else if (ch === "\r") continue;
            else {
                con.cur += ch === "\0" ? " " : ch;
                if (con.cur.length === COLS) { con.lines.push(con.cur); con.cur = ""; }
            }
        }
        if (con.lines.length > KEEP) con.lines.splice(0, con.lines.length - KEEP);
        paint();
    }
    let painting = false;
    function paint() {
        if (painting) return;
        painting = true;
        // on the next frame, or soon if frames don't come (a hidden page gets none)
        const once = f => { let done = false; return () => { if (!done) { done = true; f(); } }; };
        const draw = once(() => {
            painting = false;
            const screen = $("screen");
            const atBottom = screen.scrollHeight - screen.scrollTop - screen.clientHeight < 40;
            const typing = con.waiting || !con.running ? con.input : "";
            // the line being typed wraps, as it did
            let last = con.cur + typing, head = [];
            while (last.length >= COLS) { head.push(last.slice(0, COLS)); last = last.slice(COLS); }
            screen.textContent = con.lines.concat(head).join("\n") + (con.lines.length || head.length ? "\n" : "") + last;
            const cursor = document.createElement("span");
            cursor.className = "cursor";
            cursor.textContent = " ";
            if (con.waiting || !con.running) screen.appendChild(cursor);
            if (atBottom || con.stick) { screen.scrollTop = screen.scrollHeight; con.stick = false; }
            showBoard();
        });
        requestAnimationFrame(draw);
        setTimeout(draw, 100);
    }
    function prompt() { out("\nC:\\TEEKO>"); con.stick = true; }

    // --- running teeko.exe
    class Stop {}
    async function runTeeko(line) {
        const argv = splitCommandLine(line);
        argv[0] = "teeko";
        const io = {
            fixed: $("fixed").checked,
            dir,
            random: msvcRandom(),
            time: () => Math.floor(Date.now() / 1000),
            write: out,
            fgets: () => new Promise((resolve, reject) => { con.waiting = { resolve, reject }; paint(); }),
            // after each game in batch mode, a moment for the page, and for Stop
            tick: () => new Promise((resolve, reject) => setTimeout(() => con.stopped ? reject(new Stop()) : resolve(), 0)),
        };
        const prog = createTeeko(io);
        con.running = prog;
        con.stopped = false;
        $("stop").disabled = false;
        setStatus("");
        showFiles();
        let result;
        try { result = await prog.run(argv); }
        catch (x) { if (!(x instanceof Stop)) { setStatus("The page failed: " + x); console.error(x); } else out("^C"); }
        prog.kill();
        if (result instanceof Hang)
            setStatus(result.cells
                ? `teeko.exe is stuck. It puts its pawn on one of the fields ${result.cells.map(([a, b]) => `${a}${b}`).join(", ")}, picking one at random until it finds one free, and all four are taken, so it never stops. Press Stop, or tick Fixed and play again.`
                : "teeko.exe is stuck: it can't find a move. Press Stop.");
        if (result instanceof Hang) { await new Promise(resolve => { con.hung = resolve; }); out("^C"); }
        con.running = null;
        con.waiting = null;
        con.hung = null;
        $("stop").disabled = true;
        prompt();
        showFiles();
    }
    function stop() {
        if (!con.running) return;
        con.stopped = true;
        if (con.hung) con.hung();
        if (con.waiting) { const w = con.waiting; con.waiting = null; w.reject(new Stop()); }
    }
    function setStatus(s) { $("status").textContent = s; }

    // --- the commands of the prompt
    const SIZE = n => n.toLocaleString("en-US");
    async function command(line) {
        const argv = splitCommandLine(line);
        const cmd = (argv[0] || "").toLowerCase();
        if (!cmd) { prompt(); return; }
        if (cmd === "teeko" || cmd === "teeko.exe") { out("\n"); await runTeeko(line); return; }
        if (cmd === "cls") { con.lines = []; con.cur = ""; out("C:\\TEEKO>"); return; }
        if (cmd === "dir") {
            const sub = (argv[1] || "").toLowerCase().replace(/\\$/, "");
            out("\n Directory of C:\\TEEKO" + (sub ? "\\" + argv[1].replace(/\\$/, "") : "") + "\n\n");
            let list;
            if (sub === "memories" || sub === "_teeko") list = [...saved.values()].filter(f => f.name.toLowerCase().startsWith(sub + "\\")).map(f => ({ name: f.name.slice(sub.length + 1), length: f.data.length }));
            else if (sub) { out("File Not Found\n"); prompt(); return; }
            else {
                list = [{ name: "teeko.exe", length: 196652 }].concat(dir.list());
                out(`${"<DIR>".padStart(14)}          memories\n${"<DIR>".padStart(14)}          _teeko\n`);
            }
            for (const f of list) out(`${SIZE(f.length).padStart(14)}          ${f.name}\n`);
            out(`${String(list.length).padStart(16)} File(s)  ${SIZE(list.reduce((s, f) => s + f.length, 0))} bytes\n`);
            prompt();
            return;
        }
        if (cmd === "type") {
            const data = argv[1] ? readFile(argv[1]) : null;
            if (data === null) out("\nThe system cannot find the file specified.\n");
            else out("\n" + data + "\n");
            prompt();
            return;
        }
        if (cmd === "copy") {
            const data = argv[1] ? readFile(argv[1]) : null;
            if (data === null || !argv[2]) out("\nThe system cannot find the file specified.\n");
            else if (/[\\/]/.test(argv[2])) out("\nAccess is denied.\n");
            else { dir.put(argv[2], data); out("\n        1 file(s) copied.\n"); }
            prompt();
            return;
        }
        if (cmd === "del" || cmd === "erase") {
            if (!argv[1] || !dir.has(argv[1])) out("\nCould Not Find C:\\TEEKO\\" + (argv[1] || "") + "\n");
            else dir.remove(argv[1]);
            prompt();
            return;
        }
        if (cmd === "help") {
            out("\nteeko     runs Teeko; teeko -? shows its batch mode\ndir       lists the files (dir memories, dir _teeko: the saved ones)\n" +
                "type      shows a file\ncopy      copies a file, as in copy \"memories\\memory after 10000 games.txt\" memory.m\n" +
                "del       deletes a file\ncls       clears the screen\n");
            prompt();
            return;
        }
        out(`\n'${argv[0]}' is not recognized as an internal or external command,\noperable program or batch file.\n`);
        prompt();
    }

    // --- the keyboard
    function key(k) {
        if (con.running && !con.waiting) return;   // it's thinking; the keys it would buffer are dropped here
        if (k === "Enter") {
            const line = con.input;
            con.input = "";
            if (con.waiting) {
                out(line + "\n");
                const w = con.waiting;
                con.waiting = null;
                w.resolve(line + "\n");
            } else { out(line); command(line); }
            return;
        }
        if (k === "Backspace") con.input = con.input.slice(0, -1);
        else if (k.length === 1 && con.input.length < 300) con.input += k;
        paint();
    }
    $("screen").addEventListener("keydown", e => {
        if (e.ctrlKey && (e.key === "c" || e.key === "C")) { e.preventDefault(); stop(); return; }
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        if (e.key === "Enter" || e.key === "Backspace" || e.key.length === 1) { e.preventDefault(); key(e.key); }
    });
    $("screen").addEventListener("paste", e => {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData("text");
        for (const ch of text.replace(/\r/g, "")) key(ch === "\n" ? "Enter" : ch);
    });
    const focus = () => $("screen").focus({ preventScroll: true });
    document.querySelectorAll("[data-keys]").forEach(b => b.addEventListener("click", () => {
        for (const k of b.dataset.keys.split(" ")) key(k === "Space" ? " " : k);
        focus();
    }));
    $("stop").addEventListener("click", () => { stop(); focus(); });
    document.querySelectorAll("[data-run]").forEach(b => b.addEventListener("click", () => {
        if (con.running) { setStatus("teeko is running: quit it first (q, or Stop)."); return; }
        // batch mode wants player 2's memory to be there; the button makes an empty one if it isn't
        if (/mem2\.m/.test(b.dataset.run) && !dir.has("mem2.m")) dir.put("mem2.m", "");
        con.input = b.dataset.run;
        key("Enter");
        focus();
    }));

    // --- the board: what the program has in X; a click types the field
    function showBoard() {
        const board = $("board");
        const X = con.running ? con.running.board : null;
        const st = con.running ? con.running.state : null;
        const whomoves = st && st.p0 !== 0 ? st.p0 : 1;
        board.querySelectorAll("button").forEach((b, k) => {
            const v = X ? X[k] : 0;
            b.textContent = v === 0 ? "" : v === whomoves ? "X" : "O";
        });
        const last = con.cur;
        const asking = con.waiting && /opening move\.\.\. >$|Enter your move\.\.\. >$/.test(last);
        board.classList.toggle("live", !!asking);
    }
    function boardClick(k) {
        if (!con.waiting) return;
        const cell = `${k / 5 | 0}${k % 5}`;
        if (/opening move\.\.\. >$/.test(con.cur)) { con.input = cell; key("Enter"); }
        else if (/Enter your move\.\.\. >$/.test(con.cur)) {
            if (con.input.length === 2 && /^[0-4]{2}$/.test(con.input)) { con.input += cell; key("Enter"); }
            else { con.input = cell; paint(); }
        } else return;   // a field is typed only where one is asked for
        focus();
    }
    for (let k = 0; k < 25; k++) {
        const b = document.createElement("button");
        b.type = "button";
        b.setAttribute("aria-label", `field ${k / 5 | 0}${k % 5}`);
        b.addEventListener("click", () => boardClick(k));
        $("board").appendChild(b);
    }

    // --- the files
    function showFiles() {
        const list = $("files");
        list.textContent = "";
        const files = dir.list();
        if (!files.length) {
            const li = document.createElement("li");
            li.className = "none";
            li.textContent = "No files yet. teeko makes memory.m and stat.m when it starts.";
            list.appendChild(li);
        }
        for (const f of files) {
            const li = document.createElement("li");
            const name = document.createElement("code");
            name.textContent = f.name;
            li.append(name, ` ${SIZE(f.length)} bytes `);
            const act = (label, fn) => { const b = document.createElement("button"); b.type = "button"; b.textContent = label; b.addEventListener("click", fn); li.append(b, " "); return b; };
            act("View", () => view(f.name, dir.text(f.name)));
            act("Save", () => download(f.name, dir.text(f.name)));
            const del = act("Delete", () => { if (dir.remove(f.name) < 0) setStatus(`${f.name} is open; quit teeko first.`); showFiles(); });
            del.disabled = !!con.running;
            list.appendChild(li);
        }
    }
    function view(name, data) {
        $("view-name").textContent = name;
        // a memory file is positions of 33 characters: 25 fields, then two counts of 4
        const memory = /\.m$|\.txt$/i.test(name) && !/stat/i.test(name) && data.length % 33 === 0;
        let text = data;
        if (memory) {
            const rows = [];
            for (let k = 0; k < data.length; k += 33) rows.push(`${data.slice(k, k + 25)} ${data.slice(k + 25, k + 29)} ${data.slice(k + 29, k + 33)}`);
            text = `${rows.length} positions. Each: the 25 fields, row by row (1 is X, 2 is O, 0 empty), then how many\ngames it was in that X won, and that O won.\n\n` + rows.join("\n");
        } else if (/stat/i.test(name) && data.length === 36) {
            const n = [...Array(9).keys()].map(k => +data.slice(k * 4, k * 4 + 4) || 0);
            text = `Autoplay: X won ${n[0]}, drawn ${n[1]}, O won ${n[2]}\nProgram first: won ${n[3]}, drawn ${n[4]}, lost ${n[5]}\nProgram second: won ${n[6]}, drawn ${n[7]}, lost ${n[8]}\n\n[${data}]`;
        }
        $("view-text").textContent = text;
        $("view").hidden = false;
    }
    function download(name, data) {
        const bytes = Uint8Array.from(data, c => c.charCodeAt(0));
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([bytes], { type: "application/octet-stream" }));
        a.download = name.replace(/^.*\\/, "");
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    }
    $("view-close").addEventListener("click", () => { $("view").hidden = true; });
    const pick = $("saved");
    for (const f of saved.values()) {
        const o = document.createElement("option");
        o.value = f.name;
        o.textContent = `${f.name} (${SIZE(f.data.length)} bytes, ${f.from})`;
        pick.appendChild(o);
    }
    $("saved-view").addEventListener("click", () => view(pick.value, readFile(pick.value)));
    for (const [id, target] of [["saved-memory", "memory.m"], ["saved-mem2", "mem2.m"]])
        $(id).addEventListener("click", () => {
            if (con.running) { setStatus("teeko is running: quit it first (q, or Stop)."); return; }
            const data = readFile(pick.value);
            dir.put(/stat\.m$/i.test(pick.value) ? "stat.m" : target, data);
            setStatus(`Copied ${pick.value} to ${/stat\.m$/i.test(pick.value) ? "stat.m" : target}.`);
            showFiles();
        });
    $("empty").addEventListener("click", () => {
        if (con.running) { setStatus("teeko is running: quit it first (q, or Stop)."); return; }
        if (!confirm("Delete all the files in C:\\TEEKO, and forget everything the program has learned here?")) return;
        for (const f of dir.list()) dir.remove(f.name);
        showFiles();
    });

    // --- the sources
    for (const [name, text] of Object.entries(SOURCES)) {
        const d = document.createElement("details");
        const s = document.createElement("summary");
        s.textContent = name;
        const pre = document.createElement("pre");
        pre.className = "source";
        pre.textContent = text;
        d.append(s, pre);
        $("sources").appendChild(d);
    }

    showFiles();
    out("C:\\TEEKO>");
    $("screen").addEventListener("click", () => focus());
}
