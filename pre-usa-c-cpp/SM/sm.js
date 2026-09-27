// SM — JavaScript port of SM.CPP (Mihailo Despotovic, February 1997)
// For the course "Statistical Methods in Artificial Intelligence": a "random number generator".
// A 16-bit vector starts with each bit set to 1 with probability p, then is iterated n times by the
// rule A(i) = A(i-1) OR A(i+1), around a ring, and the final vector, read as a 16-bit number, is the
// "random" number. The rule turns every bit on whose neighbors aren't both off, so the vector fills
// up with 1s within a few steps: for almost any p and n the number is the same.
//
// Borland C's unsigned int had 16 bits, and the program relies on it (temp <<= j; temp >>= 15 picks
// bit 15-j), so the numbers here are kept to 16 bits. The program runs on an emulated DOS text
// screen, in Serbian, with the English translation beside it. Fixes, which can be switched off:
//  - the new last bit was computed into novi[7] (which the loop then overwrites) instead of novi[15],
//    so novi[15] was never set and held whatever was on the stack; that garbage was almost surely not
//    exactly 1, so bit 0 of every new vector was 0, and the "random" number was nearly always 65534;
//  - the starting vector could never have its top bit set: postavi() started from 16384, whose
//    comment says binary 1000000000000000 (that is 32768);
//  - init() cleared niz[0 … 1000] in an array of 1000, and n = 1000 was accepted, which wrote past
//    the end of the array; n = 0 was accepted too, though the requirement says 0 < n < 1000;
//  - "Ne postoje podaci !" (there is no data) was printed and immediately cleared by the menu.

const MAXN = 1000;       // moze i vise, potrebno zbog statickog niza
const MAXKOLIKO = 100;   // moze i vise, cisto zbog estetskih razloga

// generisi(): from vector i make vector i+1; returns the bits of vector i (stari) for printing
function generisi(niz, i, fixed) {
    const stari = [], novi = new Array(16).fill(null);
    for (let j = 0; j <= 15; j++) stari[j] = ((niz[i] << j) & 0xffff) >> 15;   // 16-bit unsigned int
    novi[0] = stari[15] === 0 && stari[1] === 0 ? 0 : 1;          // izracunaj nultu komponentu
    const last = stari[14] === 0 && stari[0] === 0 ? 0 : 1;        // izracunaj 15tu komponentu
    if (fixed) novi[15] = last; else novi[7] = last;               // 1997: novi[7], and novi[15] is garbage
    for (let j = 1; j <= 14; j++) novi[j] = stari[j - 1] === 0 && stari[j + 1] === 0 ? 0 : 1;
    let v = 0;
    for (let j = 0; j <= 15; j++) if (novi[j] === 1) v |= 1 << (15 - j);
    niz[i + 1] = v;
    return stari;
}
const bits = v => { let s = ""; for (let j = 0; j <= 15; j++) s += ((v << j) & 0xffff) >> 15; return s; };

// init(): the starting vector niz[1], each of its bits 1 with probability p
function startVector(p, rnd, fixed) {
    const granica = Math.fround(Math.fround(p) * 10000);   // pretvori p u "granicnik"
    let v = 0;
    for (let i = 0; i <= 15; i++) {
        if (rnd(10000) < granica) v |= (fixed ? 32768 : 16384) >> i;   // postavi(i)
    }
    return v;
}

// one "random" number, as obrada() made it, without the printing
function randomNumber(p, n, rnd, fixed) {
    const niz = [0, startVector(p, rnd, fixed)];
    for (let i = 1; i <= n - 1; i++) generisi(niz, i, fixed);
    return { number: niz[n] ?? 0, vectors: niz.slice(1, n + 1) };
}

// The whole program. io: clrscr(), printf(text), cursor(on), await getch(), await scanLine() (the typed
// line), random(n), await delay(ms), fixed() (whether to run the fixed version), and number(vectors).
function createProgram(io) {
    let p = 0, n = 0, koliko = 0, uneto = 0;
    let niz = new Array(MAXN + 1).fill(0);

    function init() {
        const fixed = io.fixed();
        niz = new Array(MAXN + 1).fill(0);
        niz[1] = startVector(p, io.random, fixed);
        io.clrscr();
        io.printf(`Init vraca : ${niz[1]}\n\n`);     // ispisi je na ekran
    }
    function ispisi() {
        io.printf(bits(niz[n]));
        io.printf(`\n\nKonacni broj u n-toj iteraciji je : ${niz[n]}`);
    }
    async function greska() {
        io.printf("\n\nGRESKA!!!\x07");
        io.printf("\n\nBilo koji taster za glavni meni...");
        await io.getch();
    }
    function menu() {
        io.clrscr();
        io.cursor(false);
        io.printf("\n\n\tRad iz predmeta \"Statisticke metode u vestackoj inteligenciji\"\n");
        io.printf("\t──────────────────────────────────────────────────────────────");
        io.printf("\n\n\n\n\n\t\t\t   [ U ]  Unos podataka\n");
        io.printf("\t\t\t   [ O ]  Obrada podataka\n\n");
        io.printf("\t\t\t   [ P ]  Postavka zadatka\n\n\n");
        io.printf("\t\t\t   [ESC]  Kraj\n");
        io.printf("\n\n\n\n\n\n\n\t\t       Mihailo Despotovic, Februar 1997.");
    }
    // scanf("%f") and scanf("%d"): a value that can't be read leaves the variable as it was
    const scanFloat = async old => {
        const m = /^\s*([+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?)/.exec(await io.scanLine());
        return m ? Math.fround(parseFloat(m[1])) : old;
    };
    const scanInt = async old => {
        const m = /^\s*([+-]?\d+)/.exec(await io.scanLine());
        return m ? parseInt(m[1], 10) : old;
    };
    async function unos() {
        const starop = p, staron = n;
        io.clrscr();
        io.printf("Unose se podaci p i n\n");
        io.printf("─────────────────────\n\n");
        io.printf("Zahtev za p : 0 <= p <=1\n");
        io.printf(`Zahtev za n : 0 < n < ${MAXN}`);
        io.printf("\n\nUnesite p -> ");
        io.cursor(true);
        p = await scanFloat(p);
        if (p > 1 || p < 0) {
            io.cursor(false);
            p = starop;
            await greska();
            return;
        }
        io.printf("Unesite n -> ");
        n = await scanInt(n);
        const badN = io.fixed() ? n < 1 || n >= MAXN : n < 0 || n > MAXN;
        if (badN) {
            io.cursor(false);
            n = staron;
            p = starop;
            await greska();
            return;
        }
        io.printf(`\nKoliko slucajnih brojeva zelite (max ${MAXKOLIKO} brojeva) ? -> `);
        koliko = await scanInt(koliko);
        if (koliko < 1 || koliko > MAXKOLIKO) {
            io.cursor(false);
            p = starop;
            n = staron;
            await greska();
            return;
        }
        uneto = 1;
        io.cursor(false);
    }
    async function obrada() {
        if (uneto === 0) {
            io.printf("\nNe postoje podaci !\x07");
            if (io.fixed()) { io.printf("\n\nBilo koji taster za glavni meni..."); await io.getch(); }
            return;
        }
        for (let j = 1; j <= koliko; j++) {
            const fixed = io.fixed();
            init();
            for (let i = 1; i <= n - 1; i++) {
                const stari = generisi(niz, i, fixed);
                io.printf(stari.join(""));
                io.printf(i % 4 ? " " : "\n");
            }
            ispisi();
            io.number(niz.slice(1, n + 1), niz[n], j);
            await io.delay(500);
            io.printf("\n\nBilo koji taster za sledeci broj...");
            await io.getch();
        }
    }
    async function postavka() {
        io.clrscr();
        io.printf("\nPostavka zadatka\n");
        io.printf("────────────────\n\n");
        io.printf("Program implementira generator slucajnih brojeva.\n\n");
        io.printf("Ulazni podatak p je verovatnoca  ( dakle : 0<=p<=1 ) i na osnovu njega racuna se");
        io.printf("verovatnoca q=1-p. Zatim, posmatra se pocetni vektor A(0), ... ,A(15),gde kompo-");
        io.printf("nente A(i) predstavljaju binarne cifre formirane tako da bude ispunjeno :\n");
        io.printf("P( Ai=1 ) = p i P( Ai=0 ) = q.\n\n");
        io.printf("Ulazni podatak n je broj iteracija  koje ce program da izvrsi i na  taj nacin da");
        io.printf("dobije vektor (A0,...,A15)[n]. Taj vektor se dalje tretira kao 16tobitni binarni");
        io.printf("broj i vrsi se njegov prevod u \"slucajni\" dekadni broj X (naravno: 0<=X<=32767).");
        io.printf("Vektor A[i+1] se dobija od vektora A[i] na sledeci nacin : A(i)=A(i-1) OR A(i+1)");
        io.printf("pri cemu su elementi sa  desne  strane iz prethodne iteracije.  U slucaju prve i");
        io.printf("zadnje komponente, primenjuje se : A(15)=A(0) OR A(14) i A(0)=A(1) OR A(15).\n");
        io.printf("\n\n\n\nBilo koji taster za povratak u glavni meni...");
        await io.getch();
    }
    return async function main() {
        let c = 0;
        menu();
        while (c !== 27) {                       // cekaj na Escape key
            c = await io.getch();
            switch (String.fromCharCode(c)) {
                case "p": case "P": await postavka(); menu(); break;
                case "u": case "U": await unos(); menu(); break;
                case "o": case "O": await obrada(); menu(); break;
            }
        }
        io.cursor(true);
    };
}

if (typeof module !== "undefined") module.exports = { createProgram, generisi, startVector, randomNumber, bits };

// ---- UI ----

if (typeof document !== "undefined") {
    const $ = id => document.getElementById(id);
    const COLS = 80, ROWS = 25;
    const fixedOn = () => $("fixed").checked;

    // the text screen
    const scr = { cells: [], x: 0, y: 0, cursorOn: true };
    const blank = () => Array.from({ length: ROWS }, () => new Array(COLS).fill(" "));
    scr.cells = blank();
    function scroll() { scr.cells.shift(); scr.cells.push(new Array(COLS).fill(" ")); scr.y = ROWS - 1; }
    function put(ch) {
        if (ch === "\n") { scr.x = 0; scr.y++; if (scr.y >= ROWS) scroll(); return; }
        if (ch === "\t") { const to = Math.min(COLS, (Math.floor(scr.x / 8) + 1) * 8); while (scr.x < to) put(" "); return; }
        if (ch === "\x07") { beep(); return; }
        if (scr.x >= COLS) { scr.x = 0; scr.y++; if (scr.y >= ROWS) scroll(); }
        scr.cells[scr.y][scr.x++] = ch;
    }
    let audio = null;
    function beep() {
        if ($("mute").checked) return;
        try {
            audio = audio || new AudioContext();
            const o = audio.createOscillator(), gain = audio.createGain();
            o.type = "square"; o.frequency.value = 800;
            gain.gain.value = 0.05;
            o.connect(gain).connect(audio.destination);
            o.start(); o.stop(audio.currentTime + 0.15);
        } catch { /* no sound */ }
    }
    function render() {
        const lines = scr.cells.map(r => r.join(""));
        const el = $("screen");
        el.replaceChildren();
        lines.forEach((l, k) => {
            if (scr.cursorOn && k === scr.y) {
                const row = scr.cells[k];
                el.append(row.slice(0, scr.x).join(""));
                const c = document.createElement("span");
                c.className = "cursor";
                c.textContent = row[scr.x] ?? " ";
                el.append(c, row.slice(scr.x + 1).join(""));
            } else el.append(l);
            if (k < ROWS - 1) el.append("\n");
        });
        $("english").textContent = lines.map(translate).join("\n");
    }

    // the English translation, line by line
    const T = [
        [/Rad iz predmeta "Statisticke metode u vestackoj inteligenciji"/, 'Project for the course "Statistical Methods in Artificial Intelligence"'],
        [/\[ U \]  Unos podataka/, "[ U ]  Enter the data"],
        [/\[ O \]  Obrada podataka/, "[ O ]  Process the data"],
        [/\[ P \]  Postavka zadatka/, "[ P ]  The task"],
        [/\[ESC\]  Kraj/, "[ESC]  End"],
        [/Mihailo Despotovic, Februar 1997\./, "Mihailo Despotovic, February 1997."],
        [/^Postavka zadatka/, "The task"],
        [/Program implementira generator slucajnih brojeva\./, "The program implements a random number generator."],
        [/Ulazni podatak p je verovatnoca  \( dakle : 0<=p<=1 \) i na osnovu njega racuna se/, "The input p is a probability ( so: 0<=p<=1 ), and from it is computed"],
        [/verovatnoca q=1-p\. Zatim, posmatra se pocetni vektor A\(0\), \.\.\. ,A\(15\),gde kompo-/, "the probability q=1-p. Then take the starting vector A(0), ... ,A(15), whose compo-"],
        [/nente A\(i\) predstavljaju binarne cifre formirane tako da bude ispunjeno :/, "nents A(i) are binary digits, formed so that:"],
        [/P\( Ai=1 \) = p i P\( Ai=0 \) = q\./, "P( Ai=1 ) = p and P( Ai=0 ) = q."],
        [/Ulazni podatak n je broj iteracija  koje ce program da izvrsi i na  taj nacin da/, "The input n is the number of iterations the program runs, and so"],
        [/dobije vektor \(A0,\.\.\.,A15\)\[n\]\. Taj vektor se dalje tretira kao 16tobitni binarni/, "gets the vector (A0,...,A15)[n]. That vector is then treated as a 16-bit binary"],
        [/broj i vrsi se njegov prevod u "slucajni" dekadni broj X \(naravno: 0<=X<=32767\)\./, 'number, and turned into a "random" decimal number X (of course: 0<=X<=32767).'],
        [/Vektor A\[i\+1\] se dobija od vektora A\[i\] na sledeci nacin : A\(i\)=A\(i-1\) OR A\(i\+1\)/, "The vector A[i+1] is made from the vector A[i] like this: A(i)=A(i-1) OR A(i+1)"],
        [/pri cemu su elementi sa  desne  strane iz prethodne iteracije\.  U slucaju prve i/, "where the elements on the right are from the previous iteration. For the first and"],
        [/zadnje komponente, primenjuje se : A\(15\)=A\(0\) OR A\(14\) i A\(0\)=A\(1\) OR A\(15\)\./, "last components: A(15)=A(0) OR A(14) and A(0)=A(1) OR A(15)."],
        [/Bilo koji taster za povratak u glavni meni\.\.\./, "Any key to go back to the main menu..."],
        [/Bilo koji taster za glavni meni\.\.\./, "Any key for the main menu..."],
        [/Bilo koji taster za sledeci broj\.\.\./, "Any key for the next number..."],
        [/Unose se podaci p i n/, "Entering the data p and n"],
        [/Zahtev za p : 0 <= p <=1/, "Requirement for p: 0 <= p <= 1"],
        [/Zahtev za n : 0 < n < (\d+)/, "Requirement for n: 0 < n < $1"],
        [/Unesite p ->/, "Enter p ->"],
        [/Unesite n ->/, "Enter n ->"],
        [/Koliko slucajnih brojeva zelite \(max (\d+) brojeva\) \? ->/, "How many random numbers do you want (max $1 numbers)? ->"],
        [/GRESKA!!!/, "ERROR!!!"],
        [/Ne postoje podaci !/, "There is no data!"],
        [/Init vraca : (\d+)/, "Init returns: $1"],
        [/Konacni broj u n-toj iteraciji je : (\d+)/, "The final number, after n iterations: $1"],
    ];
    const translate = line => {
        for (const [re, en] of T) if (re.test(line)) return line.replace(re, en).trimEnd();
        return line.trimEnd();
    };

    // the vectors of the last number, drawn as rows of cells
    // its colors, light or dark as the system is
    const darkMode = window.matchMedia ? matchMedia("(prefers-color-scheme: dark)") : { matches: false };
    let lastVectors = [];
    if (darkMode.addEventListener) darkMode.addEventListener("change", () => drawVectors(lastVectors));

    function drawVectors(vectors) {
        lastVectors = vectors;
        const dark = darkMode.matches;
        const c = $("vectors"), ctx = c.getContext("2d");
        const shown = vectors.slice(0, 40), cell = 12, gap = 1;
        c.width = 16 * cell + 60;
        c.height = Math.max(1, shown.length) * cell + 4;
        ctx.fillStyle = dark ? "#121212" : "#fff";
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.font = "10px ui-monospace, monospace";
        shown.forEach((v, r) => {
            for (let j = 0; j < 16; j++) {
                ctx.fillStyle = ((v << j) & 0xffff) >> 15 ? (dark ? "#6f9cf0" : "#1d3f86") : (dark ? "#262b36" : "#e3e8f2");
                ctx.fillRect(j * cell, r * cell + 2, cell - gap, cell - gap);
            }
            ctx.fillStyle = dark ? "#aeaeae" : "#555";
            ctx.fillText(String(v), 16 * cell + 6, r * cell + 11);
        });
        $("vectors-caption").textContent = vectors.length > 40 ? `The first 40 of ${vectors.length} vectors.` : "";
    }

    // keyboard
    const keys = [];
    let wake = null, stopFlag = false;
    const STOP = new Error("stopped");
    const press = k => { keys.push(k); if (wake) { const w = wake; wake = null; w(); } };
    const nextKey = async () => {
        while (!keys.length) {
            if (stopFlag) throw STOP;
            render();
            await new Promise(r => { wake = r; });
        }
        if (stopFlag) throw STOP;
        return keys.shift();
    };
    const io = {
        clrscr() { scr.cells = blank(); scr.x = 0; scr.y = 0; },
        printf(t) { for (const ch of t) put(ch); },
        cursor(on) { scr.cursorOn = on; },
        getch: nextKey,
        async scanLine() {
            let line = "";
            for (;;) {
                const k = await nextKey();
                if (k === 13) {
                    put("\n");
                    if (line.trim()) break;
                    continue;                          // scanf skips empty lines and keeps waiting
                }
                if (k === 8) { if (line.length) { line = line.slice(0, -1); scr.x--; scr.cells[scr.y][scr.x] = " "; render(); } continue; }
                if (k < 32 || k > 126) continue;
                line += String.fromCharCode(k);
                put(String.fromCharCode(k));
                render();
            }
            return line;
        },
        random: n => Math.floor(Math.random() * n),
        async delay(ms) { render(); await new Promise(r => setTimeout(r, ms)); if (stopFlag) throw STOP; },
        fixed: fixedOn,
        number(vectors) { drawVectors(vectors); },
    };

    let running = false;
    async function start() {
        stopFlag = true;
        if (wake) { const w = wake; wake = null; w(); }
        while (running) await new Promise(r => setTimeout(r, 10));
        stopFlag = false;
        keys.length = 0;
        running = true;
        try { await createProgram(io)(); } catch (e) { if (e !== STOP) throw e; }
        running = false;
        if (!stopFlag) {
            io.clrscr();
            io.printf("C:\\>sm\n\nC:\\>");
            scr.cursorOn = true;
            render();
        }
    }

    const screenEl = $("screen");
    screenEl.addEventListener("keydown", e => {
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        let k = null;
        if (e.key === "Escape") k = 27;
        else if (e.key === "Enter") k = 13;
        else if (e.key === "Backspace") k = 8;
        else if (e.key.length === 1) k = e.key.charCodeAt(0);
        if (k === null) return;
        e.preventDefault();
        press(k);
    });
    screenEl.addEventListener("click", () => screenEl.focus());
    for (const b of document.querySelectorAll("[data-keys]")) {
        b.addEventListener("click", () => {
            for (const ch of b.dataset.keys.replace(/\\n/g, "\n").replace(/\\e/g, "\x1b")) press(ch === "\n" ? 13 : ch.charCodeAt(0));
            screenEl.focus();
        });
    }
    $("restart").addEventListener("click", () => { start(); screenEl.focus(); });

    // how random is it? many numbers at once
    function stats() {
        const p = Number($("st-p").value), n = Math.max(1, Math.min(999, Math.round(Number($("st-n").value))));
        const count = 10000, rnd = k => Math.floor(Math.random() * k);
        const rows = [];
        for (const fixed of [false, true]) {
            const freq = new Map();
            for (let k = 0; k < count; k++) {
                const x = randomNumber(p, n, rnd, fixed).number;
                freq.set(x, (freq.get(x) || 0) + 1);
            }
            const top = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
                .map(([x, f]) => `${x} (${(100 * f / count).toFixed(1)}%)`).join(", ");
            rows.push(`<tr><th>${fixed ? "Fixed" : "As written"}</th><td>${freq.size.toLocaleString("en-US")}</td><td>${top}</td></tr>`);
        }
        $("st-table").innerHTML = `<tr><th></th><th>Different numbers</th><th>The most common ones</th></tr>` + rows.join("");
        $("st-note").textContent = `${count.toLocaleString("en-US")} numbers each, p = ${p}, n = ${n}. A good generator of 16-bit numbers would give about ${Math.round(65536 * (1 - Math.exp(-count / 65536))).toLocaleString("en-US")} different ones, none of them more than about 0.05% of the time.`;
    }
    $("st-run").addEventListener("click", stats);

    $("source").textContent = SOURCE;
    start();
    stats();
}
