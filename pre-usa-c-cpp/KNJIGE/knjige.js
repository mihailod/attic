"use strict";

// KNJIGE V1.0 (Mihailo Despotovic, August 1995), a book catalogue for DOS, ported line by line
// from KNJIGE.C. With `fixed` off it keeps the original's behavior, bugs included.

// Everything inside works in CP852 bytes, as DOS did: strings here hold one byte per character.
const CP852 = "ÇüéâäůćçłëŐőîŹÄĆÉĹĺôöĽľŚśÖÜŤťŁ×čáíóúĄąŽžĘę¬źČş«»░▒▓│┤ÁÂĚŞ╣║╗╝Żż┐└┴┬├─┼Ăă╚╔╩╦╠═╬¤đĐĎËďŇÍÎě┘┌█▄ŢŮ▀ÓßÔŃńňŠšŔÚŕŰýÝţ´\u00ad˝˛ˇ˘§÷¸°¨˙űŘř■\u00a0";
const TO_BYTE = new Map([...CP852].map((ch, k) => [ch, String.fromCharCode(128 + k)]));
const toBytes = text => [...text].map(ch => ch.charCodeAt(0) < 128 ? ch : TO_BYTE.get(ch) ?? "?").join("");
const fromBytes = bytes => [...bytes].map(ch => { const c = ch.charCodeAt(0); return c < 128 ? ch : CP852[c - 128]; }).join("");

const MAXSLOGOVA = 5000;
const EOF = -1;
const NL = 10;
const PODVLAKA = toBytes("═".repeat(80));

// The DOS text screen, written to as DOS and the BIOS did: a character in the last column
// moves the cursor to the next line at once, and a new line below the last one scrolls.
class Screen {
    constructor() { this.clrscr(); this.beeps = 0; this.cursor = "normal"; }
    clrscr() { this.cells = Array.from({ length: 25 }, () => new Array(80).fill(" ")); this.x = 0; this.y = 0; }
    gotoxy(x, y) { this.x = x - 1; this.y = y - 1; }
    scroll() { this.cells.shift(); this.cells.push(new Array(80).fill(" ")); }
    put(ch) {
        if (ch === "\n") { if (++this.y > 24) { this.scroll(); this.y = 24; } return; }
        if (ch === "\r") { this.x = 0; return; }
        if (ch === "\x07") { this.beeps++; return; }
        if (ch === "\t") { do this.put(" "); while (this.x % 8); return; }   // DOS expands tabs to every 8th column
        this.cells[this.y][this.x] = ch;
        if (++this.x >= 80) { this.x = 0; if (++this.y > 24) { this.scroll(); this.y = 24; } }
    }
    printf(text) { for (const ch of text) { if (ch === "\n") this.put("\r"); this.put(ch); } }
    text() { return fromBytes(this.cells.map(r => r.join("")).join("\n")); }
}

const pad4 = n => String(n).padStart(4, " ");
const lower = c => c >= 65 && c <= 90 ? c + 32 : c;        // Borland's tolower and toupper: A to Z only
const upper = c => c >= 97 && c <= 122 ? c - 32 : c;
const signed = c => (c << 24) >> 24;                       // char is signed in Borland C
const int16 = n => (n << 16) >> 16;

// The book database, opened as DOS opened a text file. Borland C has 20 streams, five of them
// taken by stdin, stdout, stderr, stdaux and stdprn.
class Disk {
    constructor(bytes) { this.text = bytes.replace(/\r\n/g, "\n"); this.open = 0; }
    fopen() {
        if (this.open >= 15) return null;
        this.open++;
        return { pos: 0, text: this.text };
    }
    fclose() { this.open--; return 0; }
}

const getc = f => f.pos < f.text.length ? f.text.charCodeAt(f.pos++) : EOF;
const rewind = f => { f.pos = 0; };

// The struct p, as one block of memory: printf("%s") of a field that has no '\0' runs on into the next.
const FIELDS = [
    ["original1", 68], ["original2", 68], ["autor", 68], ["godinaor", 5], ["nagrade1", 68], ["nagrade2", 68],
    ["prevod", 65], ["prevodilac", 65], ["izdavac", 65], ["mesto", 65], ["godinaip", 5], ["izdanje", 20],
    ["tiraz", 7], ["biblioteka", 65], ["isbn", 40], ["beleska1", 68], ["beleska2", 68], ["beleska3", 68], ["beleska4", 68],
];

class Hang extends Error { constructor(where) { super("hang in " + where); this.where = where; } }

function createProgram(io) {
    const { screen, disk, fixed } = io;
    const printf = t => screen.printf(t);
    const gotoxy = (x, y) => screen.gotoxy(x, y);

    const mem = new Uint8Array(FIELDS.reduce((n, f) => n + f[1], 0));
    const at = {};
    { let o = 0; for (const [name, size] of FIELDS) { at[name] = o; o += size; } }
    const str = name => { let s = "", k = at[name]; while (k < mem.length && mem[k]) s += String.fromCharCode(mem[k++]); return s; };

    let baza = null;
    let sort = "-";
    const buffer = new Uint8Array(1200);
    let strBuf = "";
    let slog = 0;
    const s = new Int32Array(MAXSLOGOVA + 2);
    const t = new Int32Array(MAXSLOGOVA + 2);
    let pok = 0, zadnji = 0, prvi = 0, imaih = 0, searchmode = 0, nadjeno = 0;
    let message = null;               // fixed: PRVI!, ZADNJI! and NEMA!, shown after the frame
    let full = [];                    // fixed: the order of all the books, for search results

    class Exit extends Error { constructor(code) { super("exit " + code); this.code = code; } }

    // getkey: kbhit() and getch(), with 1000 + the scan code for an extended key
    async function getkey() {
        let c = await io.getch();
        if (!c) c = 1000 + await io.getch();
        return c;
    }

    function uzmibroj(fajl) {
        let c, broj = 0;
        c = getc(fajl);
        let guard = 0;
        do {
            broj = int16(broj * 10);
            broj = int16(broj + c - 48);
            if (++guard > 100000) throw new Hang("uzmibroj");   // at the end of the file, this never ends
        } while ((c = getc(fajl)) !== NL);
        return broj;
    }

    function fatal(text, code) {
        printf(text);
        throw new Exit(code);
    }

    function init() {
        screen.clrscr();
        searchmode = 0;
        screen.cursor = "none";
        sort = "-";
        pok = 1;
        if (fixed && baza) disk.fclose(baza);       // fixed: close the old one first
        baza = disk.fopen();
        if (baza === null) {
            fatal("\n\n\n FATALNA GRESKA : ne mogu da otvorim fajl baze!" + "\n                  izlazim... exit code = 1\n\n", 1);
        }
        rewind(baza);
        let i = 1, c;
        while ((c = getc(baza)) !== EOF) {
            if (c === 64) {
                c = uzmibroj(baza);
                s[i++] = c;
            }
        }
        --i;
        zadnji = s[i];
        prvi = s[1];
        slog = prvi;
        imaih = i;
        full = Array.from(s.subarray(1, imaih + 1));
    }

    async function kraj() {
        if (disk.fclose(baza)) fatal("\n\n\n FATALNA GRESKA : ne mogu da zatvorim fajl baze!\n                  izlazim... exit code = 2\n\n", 2);
        screen.clrscr();
        printf("\n".repeat(25) + "0 OK, 0:1 ");
        await io.getch();
        screen.cursor = "normal";
    }

    function komande() {
        gotoxy(1, 25);
        printf(`[S]ort po ${sort}   [T]razi [P]rethodni [N]aredni [O]dstampaj [U]putstva   [Esc]-kraj`);
    }

    // one field of the record in buffer[], as prikazi() copies it: at most to - from + 1 characters
    function copy(name, from, to) {
        let ptr = 0;
        const base = at[name];
        for (let i = from; i <= to; i++) {
            if (buffer[i] !== NL) mem[base + ptr++] = buffer[i];
            else { mem[base + ptr] = 0; return { ptr, nl: true }; }
        }
        return { ptr, nl: false };
    }

    function prikazi() {
        let c;
        rewind(baza);
        let guard = 0;
        for (;;) {
            do {
                if ((c = getc(baza)) === EOF) {
                    pok--;
                    slog = s[pok];
                    // then uzmibroj() reads a number at the end of the file, and never finds its end
                    throw new Hang("prikazi");
                }
            } while (c !== 64);
            c = uzmibroj(baza);
            if (c === slog) break;
            if (++guard > 1e6) throw new Hang("prikazi");
        }

        // fread(buffer, 1200, 1, baza): what is past the end of the file stays as it was
        for (let k = 0; k < 1200 && baza.pos < baza.text.length; k++) buffer[k] = baza.text.charCodeAt(baza.pos++) & 255;

        let r, pocetak = 2;
        r = copy("original1", pocetak, pocetak + 65);
        if (r.nl) mem[at.original2] = 0;
        let ptr = r.ptr;
        if (!r.nl) { pocetak += ptr; r = copy("original2", pocetak, pocetak + 65); ptr = r.ptr; }
        pocetak += ptr + 3; ptr = copy("autor", pocetak, pocetak + 65).ptr;
        pocetak += ptr + 3; ptr = copy("godinaor", pocetak, pocetak + 3).ptr;
        pocetak += ptr + 3; r = copy("nagrade1", pocetak, pocetak + 65); ptr = r.ptr;
        if (r.nl) mem[at.nagrade2] = 0;
        else { pocetak += ptr; ptr = copy("nagrade2", pocetak, pocetak + 65).ptr; }
        pocetak += ptr + 3; ptr = copy("prevod", pocetak, pocetak + 62).ptr;
        pocetak += ptr + 3; ptr = copy("prevodilac", pocetak, pocetak + 62).ptr;
        pocetak += ptr + 3; ptr = copy("izdavac", pocetak, pocetak + 62).ptr;
        pocetak += ptr + 3; ptr = copy("mesto", pocetak, pocetak + 62).ptr;
        pocetak += ptr + 3; ptr = copy("godinaip", pocetak, pocetak + 3).ptr;
        pocetak += ptr + 3; ptr = copy("izdanje", pocetak, pocetak + 19).ptr;
        pocetak += ptr + 3; ptr = copy("tiraz", pocetak, pocetak + 5).ptr;
        pocetak += ptr + 3; ptr = copy("biblioteka", pocetak, pocetak + 62).ptr;
        pocetak += ptr + 3; ptr = copy("isbn", pocetak, pocetak + 39).ptr;
        pocetak += ptr + 3;
        const rest = ["beleska2", "beleska3", "beleska4"];
        r = copy("beleska1", pocetak, pocetak + 66); ptr = r.ptr;
        let nema = r.nl;
        if (nema) for (const f of rest) mem[at[f]] = 0;
        for (let k = 0; k < 3 && !nema; k++) {
            pocetak += ptr;
            r = copy(rest[k], pocetak, pocetak + 66); ptr = r.ptr;
            if (r.nl) { nema = true; for (const f of rest.slice(k + 1)) mem[at[f]] = 0; }
        }

        const show = (x, y, name) => { gotoxy(x, y); printf(str(name) + "\n"); };
        show(14, 2, "original1"); show(14, 3, "original2"); show(14, 5, "autor"); show(14, 6, "godinaor");
        show(14, 7, "nagrade1"); show(14, 8, "nagrade2"); show(16, 10, "prevod"); show(16, 11, "prevodilac");
        show(16, 12, "izdavac"); show(16, 13, "mesto"); show(16, 14, "godinaip"); show(16, 15, "izdanje");
        show(16, 16, "tiraz"); show(16, 17, "biblioteka"); show(16, 18, "isbn"); show(13, 20, "beleska1");
        show(13, 21, "beleska2"); show(13, 22, "beleska3"); show(13, 23, "beleska4");
    }

    async function uputstva() {
        screen.clrscr();
        printf("                   Uputstva za upotrebu programa KNJIGE V1.0                    ");
        printf(toBytes("                 ═════════════════════════════════════════════                  "));
        printf(" Pregled vecine komandi koje su same po sebi jasne uvek je u zadnjem redu.  Tu  ");
        printf(" su jos [Home] i [End] koji prikazuju  prvi i zadnji slog. Aliasi [N] i [P] su  ");
        printf(" [PageUp]  i  [PageDown].  Pretraga je case-unsensitive.  Rezultat pretrage je  ");
        printf(" je podskup slogova. Da biste se vratili na sve slogove na pitanje  Gde ? une-  ");
        printf(" site pogresno polje ili [ENTER], ili na Sta ? pritisnite samo [ENTER].  Alias  ");
        printf(" za [H] je [F1].                                                                ");
        printf("\n");
        printf(" Program  koristi fajl koji se zove baza.knj i nalazi se u istom direktorijumu  ");
        printf(" u kome je i on sam.  Baze se prave tekst editorom.  Slog pocinje sa @ , posle  ");
        printf(" cega sledi jedinstven (interni) broj knjige, a zatim redovi sa informacijama.  ");
        printf(" To se lako moze shvatiti iz trenutne baze.  Svaka informacija reprezentuje se  ");
        printf(" tacno jednim redom teksta iza koga mora slediti \\n (new line).Ogranicenja su:  ");
        printf("\n");
        printf("   ORIGINAL 132, AUTOR 66, GODINAO 4, NAGRADE 132, PREVOD 63, PREVODILAC 63,    ");
        printf("   IZDAVAC 64 , MESTO 63 , GODINAP 4 , IZDANJE 20 , TIRAZ 6 , BIBLIOTEKA 63,    ");
        printf("   ISBN 40 i BELESKA 264.                                                       ");
        printf("\n");
        printf(" Maksimalan broj knjiga je 5000, sort uzima u obzir samo prva cetiri karaktera  ");
        printf(" i sve je string (dakle, paddujte sa nulama tiraz da sve bude ok).    ");
        printf("\n\n");
        printf("      Program je napisan kompletno u C-u (Borland Turbo C++ 3.1 DOS IDE).       ");
        printf("                 Program radjen : 03.Avg.1995. - 06.Avg.1995.\t\t\t ");
        printf("                     AUTOR : Mihailo Despotovic 015/25041");
        await io.getch();
        screen.clrscr();
    }

    // the first four characters of the field, padded with spaces, as the sort reads them
    function sortKey(c, d, e, f) {
        const sp = 32;
        if (c === NL) return [sp, sp, sp, sp];
        if (d === NL) return [c, sp, sp, sp];
        if (e === NL) return [c, d, sp, sp];
        if (f === NL) return [c, d, e, sp];
        return [c, d, e, f];
    }

    async function sortiraj() {
        gotoxy(11, 25);
        printf(" ");
        gotoxy(11, 25);
        screen.cursor = "solid";
        const c0 = await io.getch();
        const k = String.fromCharCode(upper(c0));
        const ok = c0 >= 49 && c0 <= 57 || (c0 >= 65 && c0 <= 69) || (c0 >= 97 && c0 <= 101);
        screen.cursor = "none";
        if (!ok) return;
        sort = k;

        searchmode = 0;
        const temp = [];
        let tekuci = 0;
        rewind(baza);
        for (;;) {
            let c = getc(baza);
            if (c === EOF) break;
            if (c === 64) tekuci = uzmibroj(baza);
            if (c === 35) {
                c = getc(baza);
                if (c === sort.charCodeAt(0)) {
                    let key;
                    if (fixed) {
                        // read up to the end of the line, and no further
                        const k4 = [];
                        while ((c = getc(baza)) !== NL && c !== EOF) if (k4.length < 4) k4.push(signed(c));
                        while (k4.length < 4) k4.push(32);
                        key = k4;
                    } else {
                        // four characters, even past the end of the line: an empty last field takes the next '@' with it
                        key = sortKey(...[getc(baza), getc(baza), getc(baza), getc(baza)].map(signed));
                    }
                    temp.push({ rec: key, broj: tekuci });
                }
            }
        }

        // bubblesort
        const i = temp.length;
        const greater = (a, b) => {
            for (let k = 0; k < 4; k++) { const d = a.rec[k] - b.rec[k]; if (d > 0) return true; if (d < 0) return false; }
            return false;
        };
        let ind = 1;
        while (ind !== 0) {
            ind = 0;
            for (let k = 0; k <= i - 2; k++) {
                if (greater(temp[k], temp[k + 1])) { [temp[k], temp[k + 1]] = [temp[k + 1], temp[k]]; ind = 1; }
            }
        }

        for (let k = 0; k <= i - 1; k++) s[k + 1] = temp[k].broj;
        prvi = s[1];
        pok = 1;
        zadnji = s[i];
        slog = prvi;
        full = Array.from(s.subarray(1, i + 1));
    }

    function uzmistring(fajl) {
        let c, out = "";
        for (;;) {
            c = getc(fajl);
            if (c === NL) break;
            if (c === EOF) throw new Hang("uzmistring");
            out += String.fromCharCode(lower(c));
        }
        strBuf = out;
    }

    const sadrzi = (ko, sta) => {
        for (let i = 0; i < ko.length; i++) {
            let j = i, k = 0;
            for (; k < sta.length && ko[j] === sta[k]; j++, k++);
            if (k > 0 && k === sta.length) return 1;
        }
        return 0;
    };

    async function trazi() {
        gotoxy(1, 25);
        printf(" ".repeat(79));
        gotoxy(1, 25);
        printf(" Gde ? ");
        screen.cursor = "solid";
        let c = await io.getch();
        c = upper(c);
        const gde = c;
        printf(String.fromCharCode(gde) + " ");
        if (!"123456789ABCDE".includes(String.fromCharCode(c))) {
            searchmode = 0;
            init();
            return;
        }
        printf("Sta ? ");
        let sta = await io.gets();
        screen.cursor = "none";
        gotoxy(1, 23);
        printf(" ".repeat(80));
        gotoxy(1, 24);
        printf(PODVLAKA);
        komande();
        if (sta.length === 0) { init(); return; }

        searchmode = 1;
        sta = [...sta].map(ch => String.fromCharCode(lower(ch.charCodeAt(0)))).join("");

        const found = [];
        let i = 1, tekuci = 0;
        rewind(baza);
        for (;;) {
            c = getc(baza);
            if (c === EOF) break;
            if (c === 64) {
                tekuci = uzmibroj(baza);
                if (tekuci !== s[i]) continue;
                else i++;
            }
            if (c === 35) {
                c = getc(baza);
                if (c === gde) {
                    uzmistring(baza);
                    if (sadrzi(strBuf, sta)) found.push(tekuci);
                }
            }
        }

        if (found.length === 0) {
            gotoxy(3, 24);
            printf("NEMA  !");
            printf("\x07");
            if (fixed) message = "NEMA  !";
            searchmode = 0;
            return;
        }

        if (fixed) found.sort((a, b) => full.indexOf(a) - full.indexOf(b));   // keep the sort
        const j = found.length;
        nadjeno = j;
        for (let k = 0; k < j; k++) { t[k] = found[k]; s[k + 1] = t[k]; }
        prvi = s[1];
        pok = 1;
        zadnji = s[j];
        slog = prvi;
    }

    function prethodni() {
        if (s[pok] !== prvi) { pok--; slog = s[pok]; }
        else {
            gotoxy(3, 24);
            printf("PRVI  !");
            printf("\x07");
            if (fixed) message = "PRVI  !";
        }
    }

    function naredni() {
        if (s[pok] !== zadnji) { pok++; slog = s[pok]; }
        else {
            gotoxy(3, 24);
            printf("ZADNJI!");
            printf("\x07");
            if (fixed) message = "ZADNJI!";
        }
    }

    function home() { slog = prvi; pok = 1; }

    function end() {
        slog = zadnji;
        pok = fixed && searchmode ? nadjeno : imaih;
    }

    async function odstampaj() {
        gotoxy(1, 25);
        printf(" ".repeat(79));
        gotoxy(1, 25);
        printf(" [Tekuca knjiga >> stdprn]  Da li je stampac potpuno spreman ? (D/N) ");
        screen.cursor = "solid";
        const c = await io.getch();
        screen.cursor = "none";
        if (c !== 100 && c !== 68) return;

        const f = name => str(name);
        io.print(
            PODVLAKA +
            `  ORIGINAL : ${f("original1")}\n` +
            `             ${f("original2")}\n` +
            PODVLAKA +
            `  AUTOR    : ${f("autor")}\n` +
            `  GODINA   : ${f("godinaor")}\n` +
            `  NAGRADE  : ${f("nagrade1")}\n` +
            `             ${f("nagrade2")}\n` +
            PODVLAKA +
            `  PREVOD     : ${f("prevod")}\n` +
            `  PREVODILAC : ${f("prevodilac")}\n` +
            `  IZDAVAC    : ${f("izdavac")}\n` +
            `  MESTO      : ${f("mesto")}\n` +
            `  GODINA     : ${f("godinaip")}\n` +
            `  IZDANJE    : ${f("izdanje")}\n` +
            `  TIRAZ      : ${f("tiraz")}\n` +
            `  BIBLIOTEKA : ${f("biblioteka")}\n` +
            `  ISBN       : ${f("isbn")}\n` +
            PODVLAKA +
            `  BELESKA : ${f("beleska1")}\n` +
            `            ${f("beleska2")}\n` +
            `            ${f("beleska3")}\n` +
            `            ${f("beleska4")}\n` +
            PODVLAKA +
            "                                                KNJIGE V1.0 by Mihailo Aug.1995." +
            "\f");
    }

    function frame() {
        gotoxy(1, 1);
        const head = "═".repeat(49);
        if (searchmode === 0) printf(toBytes(`${head} Knjiga ${pad4(pok)} ══ Ukupno  ${pad4(imaih)} ══`));
        if (searchmode === 1) printf(toBytes(`${head} Knjiga ${pad4(pok)} ══ Nadjeno ${pad4(nadjeno)} ══`));
        const line = t => t.padEnd(80, " ");
        printf(line("1 ORIGINAL")); printf(line("")); printf(PODVLAKA);
        printf(line("2 AUTOR")); printf(line("3 GODINA")); printf(line("4 NAGRADE")); printf(line("")); printf(PODVLAKA);
        for (const l of ["5 PREVOD", "6 PREVODILAC", "7 IZDAVAC", "8 MESTO", "9 GODINA", "A IZDANJE", "B TIRAZ", "C BIBLIOTEKA", "D ISBN"]) printf(line(l));
        printf(PODVLAKA);
        printf(line("E BELESKA")); printf(line("")); printf(line("")); printf(line(""));
        printf(PODVLAKA);
        komande();
        prikazi();
        if (message) {                // fixed: the warning stays on the screen
            gotoxy(3, 24);
            printf(message);
            message = null;
        }
    }

    return async function main() {
        try {
            init();
            frame();
            let c;
            do {
                c = await getkey();
                switch (c) {
                    case 27: break;
                    case 1071: home(); frame(); break;
                    case 1079: end(); frame(); break;
                    case 1059: case 85: case 117: await uputstva(); frame(); break;
                    case 83: case 115: await sortiraj(); frame(); break;
                    case 84: case 116: await trazi(); frame(); break;
                    case 1081: case 80: case 112: prethodni(); frame(); break;
                    case 1073: case 78: case 110: naredni(); frame(); break;
                    case 79: case 111: await odstampaj(); frame(); break;
                    default: break;
                }
            } while (c !== 27);
            await kraj();
            return 0;
        } catch (e) {
            if (e instanceof Exit) return e.code;
            throw e;
        }
    };
}

if (typeof module !== "undefined") module.exports = { createProgram, Screen, Disk, Hang, toBytes, fromBytes };

// ---- the page ----

if (typeof document !== "undefined") {
    const $ = id => document.getElementById(id);
    const screen = new Screen();
    let disk = null, dbBytes = toBytes(BAZA), dbName = "BAZA.KNJ";
    let printed = "";

    // the English translation, line by line; the books' own data stays as it is
    const LABELS = [
        ["1 ORIGINAL", "1 ORIGINAL"], ["2 AUTOR", "2 AUTHOR"], ["3 GODINA", "3 YEAR"], ["4 NAGRADE", "4 AWARDS"],
        ["5 PREVOD", "5 TRANSLATION"], ["6 PREVODILAC", "6 TRANSLATOR"], ["7 IZDAVAC", "7 PUBLISHER"], ["8 MESTO", "8 CITY"],
        ["9 GODINA", "9 YEAR"], ["A IZDANJE", "A EDITION"], ["B TIRAZ", "B PRINT RUN"], ["C BIBLIOTEKA", "C SERIES"],
        ["D ISBN", "D ISBN"], ["E BELESKA", "E NOTE"],
    ];
    const T = [
        [/Knjiga (\s*-?\d+) ══ Ukupno  (\s*\d+) ══/, "Book   $1 ══ Total   $2 ══"],
        [/Knjiga (\s*-?\d+) ══ Nadjeno (\s*\d+) ══/, "Book   $1 ══ Found   $2 ══"],
        [/\[S\]ort po (.)   \[T\]razi \[P\]rethodni \[N\]aredni \[O\]dstampaj \[U\]putstva   \[Esc\]-kraj/, "[S]ort by $1   [T] search [P]revious [N]ext [O] print [U] help   [Esc] quit"],
        [/^ Gde \? (.) Sta \? (.*)$/, " Where? $1 What? $2"],
        [/^ Gde \? (.?)/, " Where? $1"],
        [/\[Tekuca knjiga >> stdprn\]  Da li je stampac potpuno spreman \? \(D\/N\)/, "[This book >> stdprn]  Is the printer completely ready? (D = yes / N)"],
        [/PRVI  !/, "FIRST!"], [/ZADNJI!/, "LAST! "], [/NEMA  !/, "NONE! "],
        [/FATALNA GRESKA : ne mogu da otvorim fajl baze!/, "FATAL ERROR: can't open the database file!"],
        [/FATALNA GRESKA : ne mogu da zatvorim fajl baze!/, "FATAL ERROR: can't close the database file!"],
        [/izlazim\.\.\. exit code/, "exiting... exit code"],
        [/Uputstva za upotrebu programa KNJIGE V1\.0/, "How to use the program KNJIGE V1.0"],
        [/Pregled vecine komandi koje su same po sebi jasne uvek je u zadnjem redu\.  Tu/, "Most commands, which explain themselves, are always listed on the last line."],
        [/su jos \[Home\] i \[End\] koji prikazuju  prvi i zadnji slog\. Aliasi \[N\] i \[P\] su/, "There are also [Home] and [End], which show the first and last record. [N] and [P]"],
        [/\[PageUp\]  i  \[PageDown\]\.  Pretraga je case-unsensitive\.  Rezultat pretrage je/, "are also [PageUp] and [PageDown]. The search ignores case. The result of a search"],
        [/je podskup slogova\. Da biste se vratili na sve slogove na pitanje  Gde \? une-/, "is a subset of the records. To go back to all records, answer Where? with"],
        [/site pogresno polje ili \[ENTER\], ili na Sta \? pritisnite samo \[ENTER\]\.  Alias/, "a wrong field or [ENTER], or answer What? with just [ENTER]. [F1] is"],
        [/za \[H\] je \[F1\]\./, "the same as [H]."],
        [/Program  koristi fajl koji se zove baza\.knj i nalazi se u istom direktorijumu/, "The program uses a file called baza.knj, in the same directory"],
        [/u kome je i on sam\.  Baze se prave tekst editorom\.  Slog pocinje sa @ , posle/, "as the program. Databases are made with a text editor. A record starts with @,"],
        [/cega sledi jedinstven \(interni\) broj knjige, a zatim redovi sa informacijama\./, "then the book's unique (internal) number, and then lines of information."],
        [/To se lako moze shvatiti iz trenutne baze\.  Svaka informacija reprezentuje se/, "The current database shows how. Each piece of information is"],
        [/tacno jednim redom teksta iza koga mora slediti \\n \(new line\)\.Ogranicenja su:/, "exactly one line of text, which must end with \\n (new line). The limits are:"],
        [/ORIGINAL 132, AUTOR 66, GODINAO 4, NAGRADE 132, PREVOD 63, PREVODILAC 63,/, "ORIGINAL 132, AUTHOR 66, YEAR 4, AWARDS 132, TRANSLATION 63, TRANSLATOR 63,"],
        [/IZDAVAC 64 , MESTO 63 , GODINAP 4 , IZDANJE 20 , TIRAZ 6 , BIBLIOTEKA 63,/, "PUBLISHER 64, CITY 63, YEAR 4, EDITION 20, PRINT RUN 6, SERIES 63,"],
        [/ISBN 40 i BELESKA 264\./, "ISBN 40 and NOTE 264."],
        [/Maksimalan broj knjiga je 5000, sort uzima u obzir samo prva cetiri karaktera/, "At most 5000 books. The sort looks only at the first four characters,"],
        [/i sve je string \(dakle, paddujte sa nulama tiraz da sve bude ok\)\./, "and everything is a string (so pad the print run with zeros to sort it right)."],
        [/Program je napisan kompletno u C-u \(Borland Turbo C\+\+ 3\.1 DOS IDE\)\./, "The program is written entirely in C (Borland Turbo C++ 3.1 DOS IDE)."],
        [/Program radjen : 03\.Avg\.1995\. - 06\.Avg\.1995\./, "Written: 3 Aug 1995 - 6 Aug 1995."],
        [/AUTOR : Mihailo Despotovic/, "AUTHOR: Mihailo Despotovic"],
    ];
    function translate(line) {
        for (const [sr, en] of LABELS) {
            if (line.startsWith(sr + " ") || line === sr) {
                const rest = line.slice(sr.length);
                const extra = en.length - sr.length;
                const spaces = rest.match(/^ */)[0].length;
                line = en + (extra > 0 ? rest.slice(Math.min(extra, spaces - 1)) : " ".repeat(-extra) + rest);
                return line.trimEnd();
            }
        }
        for (const [re, en] of T) if (re.test(line)) return line.replace(re, en).trimEnd();
        return line.trimEnd();
    }

    function render() {
        const lines = screen.text().split("\n");
        const el = $("screen");
        el.replaceChildren();
        lines.forEach((l, k) => {
            if (screen.cursor !== "none" && k === screen.y) {
                el.append(l.slice(0, screen.x));
                const c = document.createElement("span");
                c.className = "cursor " + screen.cursor;
                c.textContent = l[screen.x] ?? " ";
                el.append(c, l.slice(screen.x + 1));
            } else el.append(l);
            if (k < 24) el.append("\n");
        });
        $("english").textContent = lines.map(translate).join("\n");
        if (screen.beeps) { beep(); screen.beeps = 0; }
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

    // the printer: 80 columns, and a form feed ends the page
    function showPrinter() {
        const pages = printed.split("\f");
        if (pages.at(-1) === "") pages.pop();
        const wrap = page => page.split("\n").flatMap(l => { const out = []; for (let k = 0; k < l.length || k === 0; k += 80) out.push(l.slice(k, k + 80)); return out; }).join("\n");
        const paper = $("paper");
        paper.replaceChildren();
        pages.forEach(p => {
            const sheet = document.createElement("pre");
            sheet.className = "sheet";
            sheet.textContent = wrap(p);
            paper.append(sheet);
        });
        $("printer-empty").hidden = pages.length > 0;
        $("printer-save").disabled = pages.length === 0;
    }

    // keyboard
    const keys = [];
    let wake = null, stopFlag = false;
    const STOP = new Error("stopped");
    const press = (...codes) => { keys.push(...codes); if (wake) { const w = wake; wake = null; w(); } };
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
        screen,
        get disk() { return disk; },
        get fixed() { return $("fixed").checked; },
        getch: nextKey,
        async gets() {
            let line = "";
            for (;;) {
                const k = await nextKey();
                if (k === 13) break;
                if (k === 8) { if (line.length) { line = line.slice(0, -1); screen.x--; screen.cells[screen.y][screen.x] = " "; } continue; }
                if (k === 0) { await nextKey(); continue; }              // an extended key: DOS ignores it here
                if (k < 32 || line.length >= 127) continue;
                line += String.fromCharCode(k);
                screen.put(String.fromCharCode(k));
            }
            screen.printf("\n");
            return line;
        },
        print(bytes) { printed += fromBytes(bytes); showPrinter(); },
    };

    let running = false;
    async function start() {
        stopFlag = true;
        if (wake) { const w = wake; wake = null; w(); }
        while (running) await new Promise(r => setTimeout(r, 10));
        stopFlag = false;
        keys.length = 0;
        running = true;
        $("status").textContent = "";
        screen.clrscr();
        screen.cursor = "normal";
        disk = new Disk(dbBytes);
        let code = null;
        try {
            code = await createProgram(io)();
        } catch (e) {
            if (e instanceof Hang) {
                screen.cursor = "none";
                $("status").textContent = e.where === "prikazi"
                    ? "As written, KNJIGE hangs here, in an endless loop. It looked through the file for a book that isn't there, " +
                      "and at the end of the file, reading a book's number never finds the end of the line. After a search, End goes " +
                      "to the position of the last of all the books instead of the last one found, and Next then steps past the books found. " +
                      "Start again, or tick Fixed."
                    : "As written, KNJIGE hangs here, in an endless loop, reading past the end of the file. Start again, or tick Fixed.";
                render();
            } else if (e !== STOP) throw e;
        }
        running = false;
        if (code !== null && !stopFlag) {
            screen.printf("\nC:\\>");
            screen.cursor = "normal";
            $("status").textContent = `KNJIGE ended with exit code ${code}.`;
            render();
        }
    }

    // keys from the keyboard, as DOS saw them: an extended key is 0 and then its scan code
    const EXTENDED = { Home: 71, End: 79, PageUp: 73, PageDown: 81, F1: 59, ArrowUp: 72, ArrowDown: 80, ArrowLeft: 75, ArrowRight: 77, Insert: 82, Delete: 83 };
    const screenEl = $("screen");
    screenEl.addEventListener("keydown", e => {
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        let codes = null;
        if (e.key in EXTENDED) codes = [0, EXTENDED[e.key]];
        else if (e.key === "Escape") codes = [27];
        else if (e.key === "Enter") codes = [13];
        else if (e.key === "Backspace") codes = [8];
        else if (e.key.length === 1) { const b = toBytes(e.key); if (b !== "?" || e.key === "?") codes = [b.charCodeAt(0)]; }
        if (!codes) return;
        e.preventDefault();
        press(...codes);
    });
    screenEl.addEventListener("click", () => screenEl.focus());
    for (const b of document.querySelectorAll("[data-keys]")) {
        b.addEventListener("click", () => {
            const spec = b.dataset.keys;
            const codes = spec.startsWith("@") ? [0, EXTENDED[spec.slice(1)]]
                : [...spec.replace(/\\n/g, "\r").replace(/\\e/g, "\x1b")].map(ch => ch.charCodeAt(0));
            press(...codes);
            screenEl.focus();
        });
    }
    $("restart").addEventListener("click", () => { start(); screenEl.focus(); });
    $("fixed").addEventListener("change", () => { start(); screenEl.focus(); });

    // the database: your own, or this one to download
    function download(name, text) {
        const bytes = Uint8Array.from(text, ch => ch.charCodeAt(0));
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([bytes]));
        a.download = name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }
    $("db-save").addEventListener("click", () => download(dbName, dbBytes.replace(/\r?\n/g, "\r\n")));
    $("db-load").addEventListener("change", async e => {
        const f = e.target.files[0];
        if (!f) return;
        const buf = new Uint8Array(await f.arrayBuffer());
        let s = "";
        for (const b of buf) s += String.fromCharCode(b);
        dbBytes = s;
        dbName = f.name;
        $("db-name").textContent = f.name;
        e.target.value = "";
        start();
        screenEl.focus();
    });
    $("printer-save").addEventListener("click", () => download("PRN.TXT", toBytes(printed).replace(/\n/g, "\r\n")));
    $("printer-clear").addEventListener("click", () => { printed = ""; showPrinter(); });

    $("source").textContent = SOURCE;
    showPrinter();
    start();
}
