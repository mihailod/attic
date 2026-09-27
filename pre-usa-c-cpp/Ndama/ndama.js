// NDAMA — JavaScript port of NDAMA.CPP (Mihailo Despotovic, April / May 1997)
// Term project for "Applications of Artificial Intelligence" (professor dr. Vladimir Srdanović):
// the n queens problem, place n queens on an n × n board so that no two attack each other, solved by
// recursion and backtracking, and every solution shown in turn on the DOS text screen.
//
// The program runs here as it did, on an emulated 80×25 text screen with its Serbian menus; the page
// adds an English translation of the screen, a chessboard of the solution shown, and a step-by-step
// view of the backtracking itself.

const LIMIT = 15;   // maksimalna dimenzija problema

// postavi(): put a queen in column nn so that it isn't attacked by the queens already in columns
// 0 … nn-1, trying the rows top to bottom. A generator that yields at each solution, where the
// original called stampaj(); the arrays are the program's globals.
function* postavi(s, n, nn) {
    for (let i = 0; i < n; i++) {                                           // glavna petlja po vrstama
        if (!s.vrsta[i] && !s.dia_poz[i + nn] && !s.dia_neg[nn - i + n - 1]) {   // da li je vrsta napadana?
            if (nn < n - 1) {                                                // da li smo stigli do zadnje dame?
                s.polje[nn] = i;
                s.vrsta[i] = 1;
                s.dia_poz[nn + i] = 1;
                s.dia_neg[nn - i + (n - 1)] = 1;
                yield* postavi(s, n, nn + 1);
                s.vrsta[i] = 0;
                s.dia_poz[nn + i] = 0;
                s.dia_neg[nn - i + (n - 1)] = 0;                               // backtracking
            } else {
                s.polje[nn] = i;                                             // stigli smo do zadnje,
                yield;                                                       // odstampaj resenje
                return;
            }
        }
    }
}
const newState = () => ({
    polje: new Array(LIMIT).fill(0),
    vrsta: new Array(LIMIT).fill(0),
    dia_poz: new Array(2 * LIMIT - 1).fill(0),
    dia_neg: new Array(2 * LIMIT - 1).fill(0),
});

// The whole program, main() and all. io is the console: clrscr(), printf(text), cursor(on),
// await getch() (a key code), await scanfInt() ({ ok, value }), and solution(draw): with the pause
// off the page may draw only the last solution before it looks at the screen.
function createProgram(io) {
    const s = newState();
    let koliko = 0, uneto = 0, brres = 1, cekaj = 1, cek = "Da";

    async function stampaj(n) {
        const draw = () => {
            io.clrscr();
            let out = `Dimenzija problema : ${koliko}`;
            out += `\n\n\tResenje broj ${number}\n\n`;
            for (let i = 0; i < n; i++) {
                out += "\t";
                for (let j = 0; j < n; j++) out += s.polje[j] === i ? "█ " : ". ";   // dama ili prazno
                out += "\n";
            }
            out += "\n\n\n";
            io.printf(out);
        };
        const number = brres++;
        if (cekaj === 1) {
            draw();
            io.board(s.polje.slice(0, n), n, number);
            await io.getch();                                                // cekaj ako treba
        } else io.solution(draw, s.polje.slice(0, n), n, number);
    }

    async function init(n) {
        let i;
        for (i = 0; i < n; i++) s.vrsta[i] = s.dia_poz[i] = s.dia_neg[i] = 0;
        for (; i < 2 * n - 1; i++) s.dia_poz[i] = s.dia_neg[i] = 0;
        let count = 0, since = Date.now();
        for (const _ of postavi(s, n, 0)) {
            await stampaj(n);
            if (++count % 256 === 0 && Date.now() - since > 25) {   // let the page draw and take keys
                await io.breathe();
                since = Date.now();
            }
            if (io.stopped) return;
        }
    }

    async function obrada(n) {
        if (uneto === 0) {
            io.clrscr();
            io.printf("\x07\n\n\n\tUnesite dimenziju problema!");
            io.printf("\n\n\n\tBilo koji taster za glavni meni...");
            await io.getch();
            return;
        }
        brres = 1;
        if (n === 2 || n === 3) {
            io.clrscr();
            io.printf("\x07\n\n\nNema resenja !");
            io.printf("\n\nBilo koji taster za glavni meni...");
            await io.getch();
            return;
        }
        await init(n);
        io.flush();
        io.printf("\x07Nema vise resenja !");
        await io.getch();
    }

    async function greska() {
        io.printf("\n\nGRESKA!!!\x07");
        io.printf("\n\nBilo koji taster za glavni meni...");
        await io.getch();
    }

    async function postavka() {
        io.clrscr();
        io.printf("\n\t\tPostavka zadatka\n");
        io.printf("\t\t────────────────\n\n");
        io.printf("\tProgram implementira problem n dama na tabli dimenzije n x n.\n\n");
        io.printf("\tUlazni podatak je broj dama (sto je ujedno i dimenzija problema).\n\n");
        io.printf("\tResenja ce biti prikazana jedno po jedno. Prazno polje bice\n");
        io.printf("\tpredstavljeno sa tackom, a dama sa simbolom █.\n\n");
        io.printf("\tProblem se resava rekurzijom, primenom backtracking tehnologije\n");
        io.printf("\tprogramiranja. Napredak backtracking-a se lepo vidi kroz resenja.\n");
        io.printf("\tBacktracking (na ekranu) ide odozgo nadole i sleva udesno.\n\n");
        io.printf("\tVec posle nekoliko dama, broj resenja se naglo uvecava.\n");
        io.printf("\tZbog toga opcija [ P ] preskace cekanje na pregled svakog resenja.\n");
        io.printf("\tOna sluzi za odredjivanje broja resenja i animirano pracenje\n");
        io.printf("\tnapredovanja backtracking-a kod velikog broja dama.");
        io.printf("\n\n\n\n\tBilo koji taster za povratak u glavni meni...");
        await io.getch();
    }

    function menu() {
        io.clrscr();
        io.cursor(false);
        io.printf("\n\n\n");
        io.printf("\n\tSemestralni rad iz predmeta \"Primene vestacke inteligencije\"\n");
        io.printf("\t────────────────────────────────────────────────────────────");
        io.printf("\n\n\n\t\t    [ U ]  Unos dimenzije problema\n");
        io.printf("\t\t    [ R ]  Resavanje problema\n");
        io.printf(`\t\t    [ P ]  Pauza za pregled resenja -> ${cek}\n\n`);
        io.printf("\t\t    [ F ]  Formulacija problema\n\n\n");
        io.printf("\t\t    [ESC]  Izlaz iz programa\n");
        io.printf("\n\n\n\n\n\t            Mihailo Despotovic, April / Maj 1997.");
    }

    async function unos() {
        const starokoliko = koliko;
        io.clrscr();
        io.printf("Unosi se broj dama (a implicitno i dimenzija problema)\n");
        io.printf("──────────────────────────────────────────────────────\n\n");
        io.printf(`Zahtev za broj dama : 1 < dama < ${LIMIT}`);
        io.printf("\n\nUnesite broj dama -> ");
        io.cursor(true);
        const r = await io.scanfInt();
        if (r.ok) koliko = r.value;          // scanf leaves koliko alone when it can't read a number
        if (koliko < 1 || koliko > LIMIT) {
            io.cursor(false);
            koliko = starokoliko;
            await greska();
            return;
        }
        uneto = 1;
        io.cursor(false);
    }

    function cekati() {
        if (cekaj === 1) { cek = "Ne"; cekaj = 0; return; }
        cek = "Da";
        cekaj = 1;
    }

    return async function main() {
        let c = 0;
        menu();
        while (c !== 27) {                   // cekaj na Escape key
            c = await io.getch();
            switch (String.fromCharCode(c)) {
                case "f": case "F": await postavka(); menu(); break;
                case "u": case "U": await unos(); menu(); break;
                case "p": case "P": cekati(); menu(); break;
                case "r": case "R": await obrada(koliko); menu(); break;
            }
            if (io.stopped) return;
        }
        io.cursor(true);
    };
}

// every step of the backtracking, for the step-by-step view: the same search, reporting each try
function* steps(n) {
    const s = newState();
    function* go(nn) {
        for (let i = 0; i < n; i++) {
            const free = !s.vrsta[i] && !s.dia_poz[i + nn] && !s.dia_neg[nn - i + n - 1];
            yield { type: free ? "place" : "attacked", col: nn, row: i, polje: s.polje.slice(0, nn) };
            if (!free) continue;
            s.polje[nn] = i;
            if (nn < n - 1) {
                s.vrsta[i] = 1; s.dia_poz[nn + i] = 1; s.dia_neg[nn - i + (n - 1)] = 1;
                yield* go(nn + 1);
                s.vrsta[i] = 0; s.dia_poz[nn + i] = 0; s.dia_neg[nn - i + (n - 1)] = 0;
                yield { type: "remove", col: nn, row: i, polje: s.polje.slice(0, nn) };
            } else {
                yield { type: "solution", col: nn, row: i, polje: s.polje.slice(0, n) };
                return;
            }
        }
    }
    yield* go(0);
}

if (typeof module !== "undefined") module.exports = { createProgram, postavi, newState, steps, LIMIT };

// ---- UI ----

if (typeof document !== "undefined") {
    const $ = id => document.getElementById(id);
    const COLS = 80, ROWS = 25;

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
            o.type = "square"; o.frequency.value = 800;   // the PC speaker's beep
            gain.gain.value = 0.05;
            o.connect(gain).connect(audio.destination);
            o.start(); o.stop(audio.currentTime + 0.15);
        } catch { /* no sound */ }
    }

    let dirty = true;
    function render() {
        if (!dirty) return;
        dirty = false;
        const lines = scr.cells.map(r => r.join(""));
        if (scr.cursorOn) {
            const row = scr.cells[scr.y];
            const before = row.slice(0, scr.x).join(""), at = row[scr.x] ?? " ", after = row.slice(scr.x + 1).join("");
            const el = $("screen");
            el.replaceChildren();
            lines.forEach((l, k) => {
                if (k === scr.y) {
                    el.append(before);
                    const c = document.createElement("span");
                    c.className = "cursor";
                    c.textContent = at;
                    el.append(c, after);
                } else el.append(l);
                if (k < ROWS - 1) el.append("\n");
            });
        } else $("screen").textContent = lines.join("\n");
        $("english").textContent = lines.map(translate).join("\n");
    }
    const tick = () => { if (pending) { pending(); pending = null; } render(); requestAnimationFrame(tick); };

    // the English translation, line by line
    const T = [
        [/Semestralni rad iz predmeta "Primene vestacke inteligencije"/, 'Term project for the course "Applications of Artificial Intelligence"'],
        [/\[ U \]  Unos dimenzije problema/, "[ U ]  Enter the size of the problem"],
        [/\[ R \]  Resavanje problema/, "[ R ]  Solve the problem"],
        [/\[ P \]  Pauza za pregled resenja -> Da/, "[ P ]  Pause to look at each solution -> Yes"],
        [/\[ P \]  Pauza za pregled resenja -> Ne/, "[ P ]  Pause to look at each solution -> No"],
        [/\[ F \]  Formulacija problema/, "[ F ]  The problem"],
        [/\[ESC\]  Izlaz iz programa/, "[ESC]  Exit the program"],
        [/Mihailo Despotovic, April \/ Maj 1997\./, "Mihailo Despotovic, April / May 1997."],
        [/Postavka zadatka/, "The task"],
        [/Program implementira problem n dama na tabli dimenzije n x n\./, "The program solves the n queens problem on an n × n board."],
        [/Ulazni podatak je broj dama \(sto je ujedno i dimenzija problema\)\./, "The input is the number of queens (which is also the size of the problem)."],
        [/Resenja ce biti prikazana jedno po jedno\. Prazno polje bice/, "The solutions are shown one by one. An empty square is"],
        [/predstavljeno sa tackom, a dama sa simbolom █\./, "shown as a dot, and a queen as the symbol █."],
        [/Problem se resava rekurzijom, primenom backtracking tehnologije/, "The problem is solved by recursion, using the backtracking technique"],
        [/programiranja\. Napredak backtracking-a se lepo vidi kroz resenja\./, "of programming. The progress of the backtracking shows nicely in the solutions."],
        [/Backtracking \(na ekranu\) ide odozgo nadole i sleva udesno\./, "The backtracking (on the screen) goes top to bottom and left to right."],
        [/Vec posle nekoliko dama, broj resenja se naglo uvecava\./, "After only a few queens, the number of solutions grows quickly."],
        [/Zbog toga opcija \[ P \] preskace cekanje na pregled svakog resenja\./, "That is why option [ P ] skips waiting to look at each solution."],
        [/Ona sluzi za odredjivanje broja resenja i animirano pracenje/, "It is for counting the solutions and for following, animated,"],
        [/napredovanja backtracking-a kod velikog broja dama\./, "the progress of the backtracking with many queens."],
        [/Bilo koji taster za povratak u glavni meni\.\.\./, "Any key to go back to the main menu..."],
        [/Bilo koji taster za glavni meni\.\.\./, "Any key for the main menu..."],
        [/Unosi se broj dama \(a implicitno i dimenzija problema\)/, "Entering the number of queens (and so the size of the problem)"],
        [/Zahtev za broj dama : 1 < dama < (\d+)/, "Requirement for the number of queens: 1 < queens < $1"],
        [/Unesite broj dama ->/, "Enter the number of queens ->"],
        [/Unesite dimenziju problema!/, "Enter the size of the problem!"],
        [/GRESKA!!!/, "ERROR!!!"],
        [/Nema vise resenja !/, "No more solutions!"],
        [/Nema resenja !/, "There are no solutions!"],
        [/Dimenzija problema : (\d+)/, "Size of the problem: $1"],
        [/Resenje broj (\d+)/, "Solution number $1"],
    ];
    const translate = line => {
        for (const [re, en] of T) if (re.test(line)) return line.replace(re, en).trimEnd();
        return line.trimEnd();
    };

    // the chessboard of the solution on the screen
    function drawBoard(el, polje, n, marks = {}) {
        el.style.setProperty("--n", n);
        el.replaceChildren();
        for (let r = 0; r < n; r++) {
            for (let c = 0; c < n; c++) {
                const d = document.createElement("div");
                d.className = "sq " + ((r + c) % 2 ? "dark" : "light");
                if (polje[c] === r && c < polje.length) d.textContent = "♛";
                if (marks.col === c && marks.row === r) d.classList.add(marks.type);
                el.append(d);
            }
        }
    }

    // keyboard: getch() and scanf() read from here
    const keys = [];
    let wake = null;
    const press = k => { keys.push(k); if (wake) { const w = wake; wake = null; w(); } };
    const STOP = new Error("stopped");
    const nextKey = async () => {
        while (!keys.length) {
            if (stopFlag) throw STOP;
            render();
            await new Promise(r => { wake = r; });
        }
        if (stopFlag) throw STOP;
        return keys.shift();
    };

    let pending = null, stopFlag = false;
    const io = {
        get stopped() { return stopFlag; },
        clrscr() { scr.cells = blank(); scr.x = 0; scr.y = 0; dirty = true; },
        printf(t) { for (const ch of t) put(ch); dirty = true; },
        cursor(on) { scr.cursorOn = on; dirty = true; },
        async getch() { return nextKey(); },
        async scanfInt() {
            let line = "";
            for (;;) {
                const k = await nextKey();
                if (k === 13) {
                    if (line.trim()) break;
                    put("\n");          // scanf("%d") skips empty lines and keeps waiting
                    dirty = true;
                    continue;
                }
                if (k === 8) { if (line.length) { line = line.slice(0, -1); scr.x--; scr.cells[scr.y][scr.x] = " "; dirty = true; } continue; }
                if (k < 32 || k > 126) continue;
                line += String.fromCharCode(k);
                put(String.fromCharCode(k));
                dirty = true;
            }
            put("\n");
            const m = /^\s*([+-]?\d+)/.exec(line);
            return m ? { ok: true, value: parseInt(m[1], 10) } : { ok: false };
        },
        board(polje, n, number) {
            drawBoard($("board"), polje, n);
            $("board-caption").textContent = `Solution ${number.toLocaleString("en-US")}`;
        },
        solution(draw, polje, n, number) {
            pending = () => { draw(); io.board(polje, n, number); };
        },
        flush() { if (pending) { pending(); pending = null; } },
        breathe() { if (pending) { pending(); pending = null; } render(); return new Promise(r => setTimeout(r, 0)); },
    };

    let running = false;
    async function start() {
        stopFlag = true;
        if (wake) { const w = wake; wake = null; w(); }   // wake a getch() that is waiting, so the old run ends
        while (running) await new Promise(r => setTimeout(r, 10));
        stopFlag = false;
        keys.length = 0;
        running = true;
        $("board").replaceChildren();
        $("board-caption").textContent = "";
        try { await createProgram(io)(); } catch (e) { if (e !== STOP) throw e; }
        pending = null;
        running = false;
        if (!stopFlag) {
            // back to DOS
            io.clrscr();
            io.printf("C:\\>ndama\n\nC:\\>");
            scr.cursorOn = true;
            $("restart").textContent = "Run it again";
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
    $("restart").addEventListener("click", () => { $("restart").textContent = "Start again"; start(); screenEl.focus(); });

    // the backtracking, step by step
    let stepGen = null, stepTimer = null, stepCounts = null;
    function stepReset() {
        clearTimeout(stepTimer); stepTimer = null;
        $("step-play").textContent = "Play";
        const n = Number($("step-n").value);
        stepGen = steps(n);
        stepCounts = { tries: 0, solutions: 0, backtracks: 0 };
        drawBoard($("step-board"), [], n);
        $("step-msg").textContent = "Press Step or Play.";
        $("step-counts").textContent = "";
    }
    function stepOnce() {
        const r = stepGen.next();
        if (r.done) { $("step-msg").textContent = `Done: ${stepCounts.solutions} solutions.`; clearTimeout(stepTimer); stepTimer = null; $("step-play").textContent = "Play"; return false; }
        const e = r.value, n = Number($("step-n").value);
        const polje = e.type === "attacked" ? e.polje : e.type === "remove" ? e.polje : e.type === "solution" ? e.polje : [...e.polje, e.row];
        drawBoard($("step-board"), e.type === "remove" ? [...e.polje] : polje, n, { col: e.col, row: e.row, type: e.type });
        const where = `column ${e.col + 1}, row ${e.row + 1}`;
        if (e.type === "attacked") { stepCounts.tries++; $("step-msg").textContent = `${where}: attacked, try the next row`; }
        if (e.type === "place") { stepCounts.tries++; $("step-msg").textContent = `${where}: free, the queen goes here`; }
        if (e.type === "remove") { stepCounts.backtracks++; $("step-msg").textContent = `Back to column ${e.col + 1}: take the queen away and try the next row (backtracking)`; }
        if (e.type === "solution") { stepCounts.solutions++; $("step-msg").textContent = `Solution ${stepCounts.solutions}!`; }
        $("step-counts").textContent = `${stepCounts.tries} squares tried, ${stepCounts.backtracks} backtracks, ${stepCounts.solutions} solutions`;
        return true;
    }
    function stepLoop() {
        const ms = Number($("step-speed").value);
        if (!stepOnce()) return;
        stepTimer = setTimeout(stepLoop, ms);
    }
    $("step-step").addEventListener("click", () => { clearTimeout(stepTimer); stepTimer = null; $("step-play").textContent = "Play"; stepOnce(); });
    $("step-play").addEventListener("click", () => {
        if (stepTimer) { clearTimeout(stepTimer); stepTimer = null; $("step-play").textContent = "Play"; return; }
        $("step-play").textContent = "Pause";
        stepLoop();
    });
    $("step-reset").addEventListener("click", stepReset);
    $("step-n").addEventListener("change", stepReset);

    $("source").textContent = SOURCE;
    stepReset();
    requestAnimationFrame(tick);
    start();
}
