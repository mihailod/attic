"use strict";

// VM (Varijacione metode, variational methods), Mihailo Despotovic, September 1995: VM.C with Vuksan Pejović's
// MENU.C, ported line by line. With `fixed` off it keeps the original's behavior, bugs included.

// ---------------------------------------------------------------------------------------------------------
// C's printf, for the conversions the program uses: %d %s %c %g %f, with + and a width

function fmtG(v, plus) {
    let s;
    if (Number.isNaN(v)) s = "nan";
    else if (!Number.isFinite(v)) s = v < 0 ? "-inf" : "inf";
    else if (v === 0) s = (Object.is(v, -0) ? "-" : "") + "0";
    else {
        const P = 6;
        const [mant, ex] = v.toExponential(P - 1).split("e");
        const X = Number(ex);
        if (X < P && X >= -4) {
            s = v.toFixed(P - 1 - X);
            if (s.includes(".")) s = s.replace(/0+$/, "").replace(/\.$/, "");
        } else {
            let m = mant;
            if (m.includes(".")) m = m.replace(/0+$/, "").replace(/\.$/, "");
            s = m + "e" + (X < 0 ? "-" : "+") + String(Math.abs(X)).padStart(2, "0");
        }
    }
    if (plus && !s.startsWith("-")) s = "+" + s;
    return s;
}

function cfmt(format, ...args) {
    let k = 0;
    return format.replace(/%([+ -]*)(\d*)(L?)([dsgfc%])/g, (all, flags, width, L, conv) => {
        if (conv === "%") return "%";
        const v = args[k++];
        let s;
        if (conv === "d") s = (flags.includes("+") && v >= 0 ? "+" : "") + String(Math.trunc(v));
        else if (conv === "s") s = String(v);
        else if (conv === "c") s = typeof v === "number" ? String.fromCharCode(v) : v;
        else if (conv === "g") s = fmtG(v, flags.includes("+"));
        else s = (flags.includes("+") && v >= 0 ? "+" : "") + v.toFixed(6);
        return width ? (flags.includes("-") ? s.padEnd(Number(width)) : s.padStart(Number(width))) : s;
    });
}

// ---------------------------------------------------------------------------------------------------------
// The DOS text screen: conio (the current colors, within a window) and printf through DOS (the BIOS teletype,
// which writes the character and leaves the colors as they were)

const BLACK = 0, BLUE = 1, GREEN = 2, CYAN = 3, RED = 4, MAGENTA = 5, BROWN = 6, LIGHTGRAY = 7, DARKGRAY = 8, WHITE = 15;

class TextScreen {
    constructor() {
        this.ch = Array.from({ length: 25 }, () => new Array(80).fill(32));
        this.at = Array.from({ length: 25 }, () => new Array(80).fill(0x07));
        this.x = 0; this.y = 0; this.attr = 0x07;
        this.wl = 0; this.wt = 0; this.wr = 79; this.wb = 24;
        this.cursor = "normal";
    }
    tscroll() {
        const a = this.at[24][this.x];
        this.ch.shift(); this.at.shift();
        this.ch.push(new Array(80).fill(32)); this.at.push(new Array(80).fill(a));
    }
    tput(c) {
        if (this.gfxOn) return;               // in graphics mode, the page doesn't show DOS's text
        if (c === 10) { if (++this.y > 24) { this.tscroll(); this.y = 24; } return; }
        if (c === 13) { this.x = 0; return; }
        if (c === 7) return;
        if (c === 8) { if (this.x) this.x--; return; }
        this.ch[this.y][this.x] = c;
        if (++this.x >= 80) { this.x = 0; if (++this.y > 24) { this.tscroll(); this.y = 24; } }
    }
    printf(text) { for (const chr of text) { const c = chr.charCodeAt(0) & 255; if (c === 10) this.tput(13); this.tput(c); } }
    wscroll() {
        for (let y = this.wt; y < this.wb; y++) for (let x = this.wl; x <= this.wr; x++) { this.ch[y][x] = this.ch[y + 1][x]; this.at[y][x] = this.at[y + 1][x]; }
        for (let x = this.wl; x <= this.wr; x++) { this.ch[this.wb][x] = 32; this.at[this.wb][x] = this.attr; }
    }
    putch(c) {
        c &= 255;
        if (c === 10) { if (++this.y > this.wb) { this.wscroll(); this.y = this.wb; } return; }
        if (c === 13) { this.x = this.wl; return; }
        if (c === 7) return;
        this.ch[this.y][this.x] = c; this.at[this.y][this.x] = this.attr;
        if (++this.x > this.wr) { this.x = this.wl; if (++this.y > this.wb) { this.wscroll(); this.y = this.wb; } }
    }
    cprintf(text) { for (const chr of text) this.putch(chr.charCodeAt(0)); }
    textbackground(c) { this.attr = (this.attr & 0x8f) | ((c & 7) << 4); }
    textcolor(c) { this.attr = (this.attr & 0x70) | (c & 0x8f); }
    textattr(a) { this.attr = a; }
    clrscr() {
        for (let y = this.wt; y <= this.wb; y++) for (let x = this.wl; x <= this.wr; x++) { this.ch[y][x] = 32; this.at[y][x] = this.attr; }
        this.x = this.wl; this.y = this.wt;
    }
    gotoxy(x, y) {
        if (x < 1 || y < 1 || this.wl + x - 1 > this.wr || this.wt + y - 1 > this.wb) return;
        this.x = this.wl + x - 1; this.y = this.wt + y - 1;
    }
    window(l, t, r, b) { this.wl = l - 1; this.wt = t - 1; this.wr = r - 1; this.wb = b - 1; this.x = this.wl; this.y = this.wt; }
    gettextinfo() {
        return { winleft: this.wl + 1, wintop: this.wt + 1, winright: this.wr + 1, winbottom: this.wb + 1, attribute: this.attr,
            curx: this.x - this.wl + 1, cury: this.y - this.wt + 1 };
    }
    gettext(l, t, r, b) {
        const buf = [];
        for (let y = t - 1; y <= b - 1; y++) for (let x = l - 1; x <= r - 1; x++) buf.push(this.ch[y][x], this.at[y][x]);
        return buf;
    }
    puttext(l, t, r, b, buf) {
        let k = 0;
        for (let y = t - 1; y <= b - 1; y++) for (let x = l - 1; x <= r - 1; x++) { this.ch[y][x] = buf[k++]; this.at[y][x] = buf[k++]; }
    }
}

// ---------------------------------------------------------------------------------------------------------
// The BGI, in 640×480 with 16 colors: it draws into `px` and keeps a log of what it drew

class Graphics {
    constructor() { this.px = new Uint8Array(640 * 480); this.log = []; this.reset(); }
    reset() { this.color = WHITE; this.fill = WHITE; this.dir = 0; this.size = 1; }
    set(x, y, c) { if (x >= 0 && x < 640 && y >= 0 && y < 480) this.px[y * 640 + x] = c; }
    initgraph() { this.reset(); this.px.fill(0); this.log.push("G init"); }
    setgraphmode(m) { this.log.push(`G mode ${m}`); }
    setcolor(c) { this.color = c; }
    bar(l, t, r, b) {
        this.log.push(`G bar ${l} ${t} ${r} ${b} ${this.fill}`);
        if (l > r) [l, r] = [r, l];
        if (t > b) [t, b] = [b, t];
        for (let y = t; y <= b; y++) for (let x = l; x <= r; x++) this.set(x, y, this.fill);
    }
    line(x1, y1, x2, y2) {
        this.log.push(`G line ${x1} ${y1} ${x2} ${y2} ${this.color}`);
        const dx = Math.abs(x2 - x1), dy = -Math.abs(y2 - y1), sx = x1 < x2 ? 1 : -1, sy = y1 < y2 ? 1 : -1;
        let err = dx + dy, x = x1, y = y1;
        for (let guard = 0; guard < 4000; guard++) {
            this.set(x, y, this.color);
            if (x === x2 && y === y2) break;
            const e2 = 2 * err;
            if (e2 >= dy) { err += dy; x += sx; }
            if (e2 <= dx) { err += dx; y += sy; }
        }
    }
    rectangle(l, t, r, b) {
        this.log.push(`G rect ${l} ${t} ${r} ${b} ${this.color}`);
        const log = this.log.length;
        this.line(l, t, r, t); this.line(r, t, r, b); this.line(r, b, l, b); this.line(l, b, l, t);
        this.log.length = log;
    }
    putpixel(x, y, c) { this.log.push(`G px ${x} ${y} ${c}`); this.set(x, y, c); }
    settextstyle(font, dir, size) { this.dir = dir; this.size = size; }
    setfillpattern(pattern, c) { this.fill = c; }
    outtextxy(x, y, s) {
        this.log.push(`G text ${x} ${y} ${this.color} ${this.dir} ${this.size} ${s}`);
        const z = this.size;
        [...s].forEach((ch, k) => {
            const g = FONT8[ch.charCodeAt(0)] || FONT8[63];
            for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
                if (!(g[r] & (1 << c))) continue;
                for (let dy = 0; dy < z; dy++) for (let dx = 0; dx < z; dx++) {
                    if (this.dir === 0) this.set(x + (k * 8 + c) * z + dx, y + r * z + dy, this.color);
                    else this.set(x + r * z + dy, y + (s.length * 8 - 1 - (k * 8 + c)) * z + dx, this.color);   // read upwards
                }
            }
        });
    }
    cleardevice() { this.log.push("G clear"); this.px.fill(0); }
    closegraph() { this.log.push("G close"); }
}

// the 8×8 font of the BGI's DEFAULT_FONT, which is the PC's own; each row's bit 0 is its leftmost pixel
const FONT8 = (() => {
    const hex = {
        32: "0000000000000000", 33: "183C3C1818001800", 34: "3636000000000000", 35: "36367F367F363600", 36: "0C3E031E301F0C00",
        37: "006333180C666300", 38: "1C361C6E3B336E00", 39: "0606030000000000", 40: "180C0606060C1800", 41: "060C1818180C0600",
        42: "00663CFF3C660000", 43: "000C0C3F0C0C0000", 44: "00000000000C0C06", 45: "0000003F00000000", 46: "00000000000C0C00",
        47: "6030180C06030100", 48: "3E63737B6F673E00", 49: "0C0E0C0C0C0C3F00", 50: "1E33301C06333F00", 51: "1E33301C30331E00",
        52: "383C36337F307800", 53: "3F031F3030331E00", 54: "1C06031F33331E00", 55: "3F3330180C0C0C00", 56: "1E33331E33331E00",
        57: "1E33333E30180E00", 58: "000C0C00000C0C00", 59: "000C0C00000C0C06", 60: "180C0603060C1800", 61: "00003F00003F0000",
        62: "060C1830180C0600", 63: "1E3330180C000C00", 64: "3E637B7B7B031E00", 65: "0C1E33333F333300", 66: "3F66663E66663F00",
        67: "3C66030303663C00", 68: "1F36666666361F00", 69: "7F46161E16467F00", 70: "7F46161E16060F00", 71: "3C66030373667C00",
        72: "3333333F33333300", 73: "1E0C0C0C0C0C1E00", 74: "7830303033331E00", 75: "6766361E36666700", 76: "0F06060646667F00",
        77: "63777F7F6B636300", 78: "63676F7B73636300", 79: "1C36636363361C00", 80: "3F66663E06060F00", 81: "1E3333333B1E3800",
        82: "3F66663E36666700", 83: "1E33070E38331E00", 84: "3F2D0C0C0C0C1E00", 85: "3333333333333F00", 86: "33333333331E0C00",
        87: "6363636B7F776300", 88: "6363361C1C366300", 89: "3333331E0C0C1E00", 90: "7F6331184C667F00", 91: "1E06060606061E00",
        92: "03060C1830604000", 93: "1E18181818181E00", 94: "081C366300000000", 95: "00000000000000FF", 96: "0C0C180000000000",
        97: "00001E303E336E00", 98: "0706063E66663B00", 99: "00001E3303331E00", 100: "3830303E33336E00", 101: "00001E333F031E00",
        102: "1C36060F06060F00", 103: "00006E33333E301F", 104: "0706366E66666700", 105: "0C000E0C0C0C1E00", 106: "300030303033331E",
        107: "070666361E366700", 108: "0E0C0C0C0C0C1E00", 109: "0000337F7F6B6300", 110: "00001F3333333300", 111: "00001E3333331E00",
        112: "00003B66663E060F", 113: "00006E33333E3078", 114: "00003B6E66060F00", 115: "00003E031E301F00", 116: "080C3E0C0C2C1800",
        117: "0000333333336E00", 118: "00003333331E0C00", 119: "0000636B7F7F3600", 120: "000063361C366300", 121: "00003333333E301F",
        122: "00003F190C263F00", 123: "380C0C070C0C3800", 124: "1818180018181800", 125: "070C0C380C0C0700", 126: "6E3B000000000000",
    };
    const f = {};
    for (const [k, h] of Object.entries(hex)) f[k] = Array.from({ length: 8 }, (_, r) => parseInt(h.substr(r * 2, 2), 16));
    return f;
})();

// ---------------------------------------------------------------------------------------------------------
// Borland C's long double had a 64-bit mantissa, JavaScript's numbers 53 bits. Where that decides what the program
// shows, the page adds up in 80 bits exactly: [m, e] is m·2^e, rounded to 64 bits of m, ties to even.

const X80 = {
    of(x) {
        if (x === 0) return [0n, 0];
        const v = new DataView(new ArrayBuffer(8)); v.setFloat64(0, x);
        const bits = v.getBigUint64(0), expo = Number((bits >> 52n) & 0x7ffn);
        let m = bits & ((1n << 52n) - 1n), e;
        if (expo === 0) e = -1074; else { m |= 1n << 52n; e = expo - 1075; }
        return [bits >> 63n ? -m : m, e];
    },
    round([m, e]) {
        if (m === 0n) return [0n, 0];
        const neg = m < 0n;
        let am = neg ? -m : m;
        const len = am.toString(2).length;
        if (len > 64) {
            const sh = BigInt(len - 64), q = am >> sh, rem = am - (q << sh), half = 1n << (sh - 1n);
            am = rem > half || (rem === half && (q & 1n)) ? q + 1n : q;
            e += Number(sh);
        }
        return [neg ? -am : am, e];
    },
    add([m1, e1], [m2, e2]) {
        if (m1 === 0n) return [m2, e2];
        if (m2 === 0n) return [m1, e1];
        const e = Math.min(e1, e2);
        return X80.round([(m1 << BigInt(e1 - e)) + (m2 << BigInt(e2 - e)), e]);
    },
    sub(x, [m, e]) { return X80.add(x, [-m, e]); },
    divInt([m, e], k) {
        const K = 80n, big = m << K, q = big / BigInt(k), r = big - q * BigInt(k);
        return X80.round([q * 2n + (r !== 0n ? (q < 0n ? -1n : 1n) : 0n), e - 81]);
    },
    le([m1, e1], [m2, e2]) {
        const e = Math.min(e1, e2);
        return (m1 << BigInt(e1 - e)) <= (m2 << BigInt(e2 - e));
    },
    num([m, e]) { return Number(m) * 2 ** e; },
};

// ---------------------------------------------------------------------------------------------------------
// The program

const STEPEN = 8;
const EPSILON = 0.00001;
const MAX_M = 1 << 22;          // Simpson's rule with this many pieces takes minutes; past it, the page gives up

class Exit extends Error { constructor(code) { super("exit " + code); this.code = code; } }
class TooLong extends Error {}

function createProgram(io) {
    const { con, gfx, disk } = io;
    const fixed = () => io.fixed;
    const ev = createEvaluator();
    const str2polish = s => ev.str2polish(s, fixed());
    const evalx = x => ev.eval(x);
    const printf = (f, ...a) => con.printf(cfmt(f, ...a));

    // MENU.C, Vuksan Pejović's menu
    const meni1 = {
        broj_stavki: 9, poc_stavka: 0, xpos: 17, ypos: 11,
        pred_farba1: BLACK, pred_farba2: RED, poz_farba: WHITE, ozn_farba: GREEN, okvir_farba: BLACK,
        esc_efekt: 0, enter_efekt: 1,
        stavke: [
            "\x01J\x01 ....... Unos/Promena parametara jednacine",
            "\x01M\x01 ................. Rad sa malim parametrom",
            "\x01S\x01 .................. Promena stepena resenja",
            "\x01T\x01 ..... Unos/Promena/Brisanje tacnog resenja",
            "\x02\x01F1\x01 ........................ Metoda Galerkina",
            "\x01F2\x01 ....................... Metoda kolokacije",
            "\x01F3\x01 ............... Metoda najmanjih kvadrata",
            "\x02\x01P\x01 ....................... Load/Save podataka",
            "\x02\x01END\x01 .............................. I z l a z",
        ],
        taster: [74, 77, 83, 84, 256 * 59, 256 * 60, 256 * 61, 80, 256 * 79],
    };
    const CUR_UP = 256 * 72, CUR_DOWN = 256 * 80, ENTER = 13, ESC = 27;

    function stampanje(meni, s, mx) {
        let swap = 1, br = 0;
        con.textcolor(meni.pred_farba1);
        con.putch(32);
        for (const chr of s) {
            const ch = chr.charCodeAt(0);
            if (ch === 1) con.textcolor((swap = !swap) ? meni.pred_farba1 : meni.pred_farba2);
            else if (ch === 2) { /* a line above this item */ }
            else { con.putch(ch); br++; }
        }
        while (br++ <= mx) con.putch(32);
    }

    async function menu(meni) {
        io.cursor("none");
        const pt = con.gettextinfo();
        const xpos = meni.xpos, ypos = meni.ypos;
        const ozn_farba = meni.enter_efekt ? meni.ozn_farba : meni.poz_farba;
        const br = meni.broj_stavki, p = meni.stavke;
        let tekuci = meni.poc_stavka;
        let mx = 0, dubina = br;
        for (let i = 0; i < br; i++) {
            const s = p[i];
            let tmp = s.length;
            if (s[0] === "\x02" && i) dubina++;
            for (const c of s) if (c === "\x01" || c === "\x02") tmp--;
            if (mx < tmp) mx = tmp;
        }
        const xpos2 = xpos + mx + 3, ypos2 = ypos + dubina + 1;
        if (xpos2 > 80 || ypos2 > 25) return -2;
        const big = xpos2 < 79 && ypos2 < 25;
        const pozadina = big ? con.gettext(xpos, ypos, xpos2 + 2, ypos2 + 1) : con.gettext(xpos, ypos, xpos2, ypos2);
        const restore = () => {
            if (big) con.puttext(xpos, ypos, xpos2 + 2, ypos2 + 1, pozadina);
            else con.puttext(xpos, ypos, xpos2, ypos2, pozadina);
            con.window(pt.winleft, pt.wintop, pt.winright, pt.winbottom);
            con.textattr(pt.attribute);
            con.gotoxy(pt.curx, pt.cury);
        };
        con.textbackground(meni.poz_farba);
        const poz_farba = meni.poz_farba;
        con.window(1, 1, 80, 25);
        con.textcolor(meni.okvir_farba);
        con.gotoxy(xpos, ypos);
        con.putch(218);
        for (let i = xpos + 1; i < xpos2; i++) con.putch(196);
        con.putch(191);
        for (let i = ypos + 1, tmp = 0; i < ypos2; i++, tmp++) {
            if (p[tmp][0] === "\x02" && tmp) {
                con.gotoxy(xpos, i++);
                con.putch(195);
                for (let j = xpos + 1; j < xpos2; j++) con.putch(196);
                con.putch(180);
            }
            con.gotoxy(xpos, i); con.putch(179);
            con.gotoxy(xpos2, i); con.putch(179);
        }
        con.gotoxy(xpos, ypos2);
        con.putch(192);
        for (let i = xpos + 1; i < xpos2; i++) con.putch(196);
        con.puttext(xpos2, ypos2, xpos2, ypos2, [217, (meni.okvir_farba + 16 * (meni.poz_farba % 8)) & 255]);
        con.textcolor(meni.pred_farba1);
        let tek_pos = 0;
        for (let i = 0, j = 0; i < br; i++, j++) {
            if (p[i][0] === "\x02" && i) j++;
            con.gotoxy(xpos + 1, ypos + j + 1);
            if (tekuci === i) {
                con.textbackground(ozn_farba);
                stampanje(meni, p[i], mx);
                con.textbackground(poz_farba);
                tek_pos = j;
            } else stampanje(meni, p[i], mx);
        }
        for (;;) {
            let ch = await io.getch();
            if (ch === 0) ch = 256 * await io.getch();
            else ch = (ch >= 97 && ch <= 122) ? ch - 32 : ch;
            if (ch === CUR_UP || ch === CUR_DOWN) {
                if (meni.enter_efekt === 0) continue;
                con.gotoxy(xpos + 1, ypos + tek_pos + 1);
                if (ch === CUR_UP) {
                    stampanje(meni, p[tekuci], mx);
                    if (tekuci === 0) { tekuci = br - 1; tek_pos = ypos2 - ypos - 2; }
                    else if (p[tekuci--][0] === "\x02") tek_pos -= 2;
                    else tek_pos--;
                } else {
                    stampanje(meni, p[tekuci++], mx);
                    if (tekuci === br) tekuci = tek_pos = 0;
                    else if (p[tekuci][0] === "\x02" && tekuci) tek_pos += 2;
                    else tek_pos++;
                }
                meni.poc_stavka = tekuci;
                con.textbackground(ozn_farba);
                con.gotoxy(xpos + 1, ypos + tek_pos + 1);
                stampanje(meni, p[tekuci], mx);
                con.textbackground(poz_farba);
                continue;
            }
            if (ch === ENTER) {
                if (meni.enter_efekt === 0) continue;
                restore();
                return tekuci;
            }
            if (ch === ESC && meni.esc_efekt) { restore(); return -1; }
            for (let i = 0; i < br; i++) {
                if (ch === meni.taster[i]) {
                    meni.poc_stavka = i;
                    restore();
                    return i;
                }
            }
        }
    }

    // the program's globals
    let n = 0, metoda = 0, n2 = 0, t = 0, metrika = 0, tac = 0;
    let a = 0, b = 0, c = 0, d = 0, aa = 0, bb = 0, koef1 = 0, koef2 = 0;
    const matr = Array.from({ length: STEPEN }, () => new Array(STEPEN - 1).fill(0));
    const res = new Array(STEPEN - 1).fill(0);
    const pol = new Array(STEPEN + 1).fill(0);
    const odstoj = new Array(STEPEN - 1).fill(0);
    const nevalja = "Sintaksna greska u izrazu!";
    const metod = ["\n Resenje metodom Galerkina : ", "\n Resenje metodom kolokacije : ", "\n Resenje metodom najmanjih kvadrata : "];
    let p = "", q = "", r = "", f = "", fkc = "", fkc1 = "", fkc2 = "", jednac = "", lfkci = "", niska = "", tacres = "", tacres1 = "";

    function clrsc() {
        con.textbackground(WHITE);
        con.textcolor(BLACK);
        con.clrscr();
        con.textbackground(WHITE);
        con.textcolor(RED);
        printf("\n");
        con.cprintf("--------------------- V A R I J A C I O N E    M E T O D E ---------------------");
        printf("\n");
    }

    async function unosn() {
        do {
            printf("\n STEPEN polinoma za resenje (2 <= n <= %d) : ", STEPEN);
            const v = await io.scanf("%d"); if (v.length) n = v[0];
            if (n < 2 || STEPEN < n) printf("Pogresno n\n");
        } while (n < 2 || STEPEN < n);
    }

    function init() {
        p = "1"; q = "2"; r = "3"; f = "0";
        a = 0; b = 1; c = 0; d = 1;
        koef2 = (c - d) / (b - a);
        koef1 = -c - koef2 * a;
        n = 2;
        tacres = "@";
    }

    // reads an expression until it parses
    async function izraz(label) {
        let s;
        for (;;) {
            printf(`\n ${label}(x) : `);
            const v = await io.scanf("%39s");
            if (v.length) s = v[0];
            if (str2polish(s ?? "")) { printf("%s", nevalja); await io.getch(); continue; }
            return s;
        }
    }

    async function unos() {
        aa = a; bb = b;
        for (;;) {
            let taster;
            do {
                clrsc();
                printf(" Opsti oblik : p(x)*u\"(x) + q(x)*u'(x) + r(x)*u(x) = f(x)\n");
                printf(" Trenutno    : ");
                jednac = cfmt("(%s)*u\"(x)+(%s)*u'(x)+(%s)*u(x)=%s\n", p, q, r, f);
                jednac += cfmt(" Uslovi      : u(%Lg)=%Lg , u(%Lg)=%Lg", a, c, b, d);
                printf("%s , resenje je polinom stepena %d.\n", jednac, n);
                printf("\n Baza prostora : (x^(k-2))*[(x-a)*(x-b)], k>=2\n");
                printf(" Tacno resenje : %s\n", tac ? tacres : "[nije uneto...poredjenje ce biti ignorisano...]");
                printf("\n");
                printf(" Sta hocete da menjate ? \n\n");
                printf("   U jednacini : [p] [q] [r] [f] ( pogledajte opsti oblik )\n");
                printf("   U uslovima  : [a] [b] [c] [d] ( u(a)=c , u(b)=d , a<b  )\n");
                printf("   K r a j     : [K]\n\n");
                printf(" Pritisnite neki od tastera...\n");

                taster = await io.getch();
                const up = String.fromCharCode(taster).toUpperCase();
                if (up === "P") p = await izraz("p");
                else if (up === "Q") q = await izraz("q");
                else if (up === "R") r = await izraz("r");
                else if (up === "F") f = await izraz("f");
                else if (up === "A") { printf("\n a = "); const v = await io.scanf("%Lg"); if (v.length) aa = v[0]; }
                else if (up === "B") { printf("\n b = "); const v = await io.scanf("%Lg"); if (v.length) bb = v[0]; }
                else if (up === "C") { printf("\n c = "); const v = await io.scanf("%Lg"); if (v.length) c = v[0]; }
                else if (up === "D") { printf("\n d = "); const v = await io.scanf("%Lg"); if (v.length) d = v[0]; }
            } while (taster !== 107 && taster !== 75);
            if (!(aa < bb)) { printf("\n Mora biti a<b !"); await io.getch(); continue; }
            break;
        }
        a = aa; b = bb;
        koef2 = (c - d) / (b - a);
        koef1 = -c - koef2 * a;
    }

    async function mali() {
        tac = 1;
        q = "1"; r = "0"; f = "0";
        a = 0; b = 1; c = 0; d = 1;
        printf("\n");
        printf(" Jednacina: au\"+u'=0   Uslovi: u(0)=0,u(1)=1\n");
        printf(" Tacno res: (1-2.718^(-x/a))/(1-2.718^(-1/a))\n\n");
        for (;;) {
            printf(" Mali parametar a iznosi : ");
            const v = await io.scanf("%39s"); if (v.length) p = v[0];
            if (str2polish(p)) { printf("%s", nevalja); await io.getch(); continue; }
            break;
        }
        // fixed: e itself, rather than 2.718
        tacres = fixed() ? `(1-exp(-x/(${p})))/(1-exp(-1/(${p})))` : "(1-2.718^(-x/(" + p + ")))/(1-2.718^(-1/(" + p + ")))";
        koef2 = (c - d) / (b - a);
        koef1 = -c - koef2 * a;
    }

    // fgets(s, size, file) and the program's loop that cuts the line at '\n', looking only at its first 40 characters
    function fgetsLine(file, size) {
        if (file.pos >= file.text.length) return null;
        let s = "";
        while (s.length < size - 1 && file.pos < file.text.length) {
            const ch = file.text[file.pos++];
            s += ch;
            if (ch === "\n") break;
        }
        return s;
    }
    const cut40 = s => { const i = s.indexOf("\n"); return i >= 0 && (i <= 39 || fixed()) ? s.slice(0, i) : s; };
    // Borland's _atold: white space, then a number, as far as it goes
    const atold = s => { const m = /^\s*([+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?)/.exec(s ?? ""); return m ? Number(m[1]) : 0; };

    async function opcije() {
        printf("\n");
        printf(" Pritisnite: [L]oad [S]ave [N]ista ... ?\n\n");
        const taster = await io.getch();
        const up = String.fromCharCode(taster).toUpperCase();
        if (up === "L") {
            printf(" LOAD : Ime fajla sa podacima ? ");
            const v = await io.scanf("%15s");
            const fajl = v.length ? v[0] : "";
            const text = disk.read(fajl);
            if (text === null) { printf("\n Nema takvog fajla u tekucem direktorijumu!"); await io.getch(); return; }
            const dat = { text, pos: 0 };
            const next = size => fgetsLine(dat, fixed() ? size + 1 : size);   // fixed: the whole line, up to the buffer's size
            let s;
            if ((s = next(39)) !== null) p = cut40(s);
            if ((s = next(39)) !== null) q = cut40(s);
            if ((s = next(39)) !== null) r = cut40(s);
            if ((s = next(39)) !== null) f = cut40(s);
            if ((s = next(59)) !== null) tacres = cut40(s);
            tac = tacres[0] !== "@" ? 1 : 0;
            let medju;
            medju = next(39); if (medju !== null) a = atold(medju);
            medju = next(39); if (medju !== null) b = atold(medju);
            medju = next(39); if (medju !== null) c = atold(medju);
            medju = next(39); if (medju !== null) d = atold(medju);
            if (fixed()) { koef2 = (c - d) / (b - a); koef1 = -c - koef2 * a; }   // fixed: the new boundary values count
            return;
        }
        if (up === "S") {
            printf(" SAVE : Ime fajla sa podacima ? ");
            const v = await io.scanf("%15s");
            const fajl = v.length ? v[0] : "";
            const num = x => fixed() ? String(x) : Math.fround(x).toFixed(6);
            if (!disk.canWrite(fajl)) { printf("\n Greska! Ne mogu da ovorim fajl!"); await io.getch(); return; }
            disk.write(fajl, [p, q, r, f, tacres, num(a), num(b), num(c), num(d)].map(s => s + "\n").join(""));
        }
    }

    function integr_smps(m, funkcija) {
        let s = funkcija(a) + funkcija(b);
        const h = (b - a) / (2 * m);
        for (let i = 1; i <= m; i++) s += 4 * funkcija(a + (2 * i - 1) * h);
        for (let i = 1; i <= m - 1; i++) s += 2 * funkcija(a + 2 * i * h);
        return s / 3 * h;
    }

    function integr_num(fs, eps, funkcija) {
        let m = 1, br_it = 0, s1, s2, r_;
        if (str2polish(fs)) { printf("\n Sintaksna greska u funkciji : %s!", fs); return 0; }
        s1 = integr_smps(m, funkcija);
        do {
            m += m;
            if (m > MAX_M) throw new TooLong();
            s2 = integr_smps(m, funkcija);
            r_ = (s2 - s1) / 15;
            s1 = s2;
        } while (Math.abs(r_) > eps && ++br_it < 100);
        return s2 + r_;
    }

    function resi_sistem(nn) {
        let i, j, k, m, A, B;
        for (i = 0; i < nn; i++) {
            A = matr[i][i];
            if (A === 0) {
                for (j = i + 1, m = 0; j < nn && !m; j++) if (matr[i][j] !== 0) { m = 1; A = matr[i][j]; }
                if (!m) return 1;
                else for (k = 0; k < nn + 1; k++) matr[k][i] += matr[k][j - 1];
            }
            for (j = i + 1; j < nn; j++) {
                B = matr[i][j];
                for (k = 0; k < nn + 1; k++) matr[k][j] = matr[k][j] * A - matr[k][i] * B;
            }
        }
        for (j = nn - 1; j >= 0; j--) {
            A = 0;
            for (i = j + 1; i < nn; i++) A += matr[i][j] * res[i];
            A = matr[nn][j] - A;
            B = matr[j][j];
            if (B === 0) return A === 0 ? 1 : 2;
            res[j] = A / B;
            if (Math.abs(res[j]) < 1.0e-10) res[j] = 0;
        }
        return 0;
    }

    function uzmifkc(k) {
        let s = "";
        switch (k - 2) {
            case 0: break;
            case 1: s = "x*"; break;
            case 2: s = "x*x*"; break;
            default: s = cfmt("x^%d*", k - 2);
        }
        s += "(x*x";
        if ((a + b) !== 0) {
            if (Math.abs(a + b) === 1) s += -(a + b) > 0 ? "+x" : "-x";
            else s += cfmt("%+Lg*x", -(a + b));
        }
        if ((a * b) !== 0) s += cfmt("%+Lg", a * b);
        return s + ")";
    }

    function xpow(k) { return k === 1 ? "x" : k === 2 ? "x*x" : cfmt("x^%d", k); }
    function term(koef, k, constantAt, powerOf) {
        // one term of a derivative: the coefficient, then the power of x, as uzmifkc1 and uzmifkc2 write it
        let s = "";
        const niz = cfmt("%+Lg", koef);
        if (k === constantAt) return niz;
        if (koef === 1) s += "+";
        else if (koef === -1) s += "-";
        else s += niz + "*";
        return s + xpow(powerOf);
    }

    function uzmifkc1(k) {
        let s;
        switch (k) {
            case 2: s = "(2*x"; break;
            case 3: s = "(3*x*x"; break;
            default: s = cfmt("(%d*x^%d", k, k - 1);
        }
        let koef;
        if ((koef = -(k - 1) * (a + b)) !== 0) s += term(koef, k, 2, k - 2);
        if (((koef = (k - 2) * a * b) !== 0) && k > 2) s += term(koef, k, 3, k - 3);
        return s + ")";
    }

    function uzmifkc2(k) {
        let s;
        switch (k) {
            case 2: return "2";
            case 3: s = "(6*x"; break;
            case 4: s = "(12*x*x"; break;
            default: s = cfmt("(%d*x^%d", k * (k - 1), k - 2);
        }
        let koef;
        if ((koef = -(k - 1) * (k - 2) * (a + b)) !== 0) s += term(koef, k, 3, k - 3);
        if (((koef = (k - 2) * (k - 3) * a * b) !== 0) && k > 3) s += term(koef, k, 4, k - 4);
        return s + ")";
    }

    // L(fi_k) = p*fi_k'' + q*fi_k' + r*fi_k
    const Lfi = k => "(" + p + ")*" + uzmifkc2(k) + "+(" + q + ")*" + uzmifkc1(k) + "+(" + r + ")*" + uzmifkc(k);
    // f - L(w), where w = -koef1 - koef2*x carries the boundary values
    function desno() {
        let s = f;
        if (koef2 !== 0) s += cfmt("%+Lg*(%s)", koef2, q);
        if (koef1 !== 0) s += cfmt("%+Lg*(%s)", koef1, r);
        if (fixed() && koef2 !== 0) s += cfmt("%+Lg*x*(%s)", koef2, r);   // fixed: r(x) times the x in w
        return s;
    }

    function galerkin(nn) {
        for (let j = 2; j <= nn; j++) {
            const fkcij = uzmifkc(j);
            for (let k = 2; k <= nn; k++) {
                lfkci = "(" + Lfi(k) + ")*" + fkcij;
                matr[k - 2][j - 2] = integr_num(lfkci, EPSILON, evalx);
            }
            lfkci = "(" + desno() + ")*" + fkcij;
            matr[nn - 1][j - 2] = integr_num(lfkci, EPSILON, evalx);
        }
    }

    function kolokacija(nn) {
        const tacka = new Array(STEPEN - 1).fill(0);
        if (nn === 2) tacka[0] = (a + b) / 2;
        else {
            const h = (b - a) / (nn - 2);
            for (let k = 2; k <= nn; k++) tacka[k - 2] = a + (k - 2) * h;
        }
        for (let k = 2; k <= nn; k++) {
            lfkci = Lfi(k);
            str2polish(lfkci);
            for (let j = 2; j <= nn; j++) matr[k - 2][j - 2] = evalx(tacka[j - 2]);
        }
        str2polish(f);
        for (let j = 2; j <= nn; j++) matr[nn - 1][j - 2] = evalx(tacka[j - 2]);
        str2polish(q);
        for (let j = 2; j <= nn; j++) matr[nn - 1][j - 2] += koef2 * evalx(tacka[j - 2]);
        str2polish(r);
        for (let j = 2; j <= nn; j++) matr[nn - 1][j - 2] += koef1 * evalx(tacka[j - 2]);
        if (fixed()) for (let j = 2; j <= nn; j++) matr[nn - 1][j - 2] += koef2 * tacka[j - 2] * evalx(tacka[j - 2]);
    }

    function najm_kvad(nn) {
        let lfkcij = "", nxt = "";
        for (let j = 2; j <= nn; j++) {
            if (j > 2) lfkcij = nxt;
            for (let k = 2; k <= nn; k++) {
                lfkci = "(" + Lfi(k) + ")";
                if (k === 2 && j === 2) lfkcij = lfkci;
                else if (k === j + 1) nxt = lfkci;
                lfkci += "*" + lfkcij;
                matr[k - 2][j - 2] = integr_num(lfkci, EPSILON, evalx);
            }
            lfkcij += "*(" + desno() + ")";
            matr[nn - 1][j - 2] = integr_num(lfkcij, EPSILON, evalx);
        }
    }

    function nalaz_polinoma(nn) {
        for (let k = 0; k <= nn; k++) pol[k] = 0;
        for (let k = 2; k <= nn; k++) {
            pol[k] += res[k - 2];
            pol[k - 1] -= res[k - 2] * (a + b);
            pol[k - 2] += res[k - 2] * a * b;
        }
        pol[0] -= koef1;
        pol[1] -= koef2;
    }

    function polinom(nn, x) {
        let vr = 0;
        for (let i = nn; i > 0; i--) vr = (vr + pol[i]) * x;
        return vr + pol[0];
    }

    const racun = x => Math.pow(Math.abs(polinom(n2, x) - evalx(x)), metrika);
    // a long double to an int, saturating as the compiled C does
    const toInt = v => Number.isNaN(v) ? 0 : v >= 2147483647 ? 2147483647 : v <= -2147483648 ? -2147483648 : Math.trunc(v);

    async function graph(nn) {
        gfx.initgraph();
        io.graphics(true);
        gfx.setgraphmode(2);
        gfx.setgraphmode(2);
        gfx.setcolor(WHITE);
        gfx.bar(0, 0, 639, 479);
        const maxx = 639 - 5, maxy = 479 - 5;
        const xstep = (b - a) / (maxx - 1);
        let mx, mn, pl, vr, i;
        mx = mn = polinom(nn, a);
        for (vr = a + xstep, i = 1; i < maxx; vr += xstep, i++) {
            pl = polinom(nn, vr);
            if (pl > mx) mx = pl;
            else if (pl < mn) mn = pl;
        }
        // as written, whatever expression was compiled last; fixed, the exact solution
        if (t && fixed()) str2polish(tacres);
        if (t) for (vr = a, i = 5; i < maxx - 5; vr += xstep, i++) {
            pl = evalx(vr);
            if (pl > mx) mx = pl;
            else if (pl < mn) mn = pl;
        }
        if (Math.abs(mx) < 1.0e-6) mx = 0;
        if (Math.abs(mn) < 1.0e-6) mn = 0;
        gfx.setcolor(RED);
        gfx.outtextxy(8, maxy - 20, niska);
        gfx.setcolor(BLACK);
        niska = cfmt(" X:[%Lg,%Lg], Y:[%Lg,%Lg], CRVENO-pribl. ZELENO-tacno CRNO-ose", a, b, mn, mx);
        gfx.outtextxy(0, maxy - 8, niska);
        let ystep = (mx - mn) / (maxy - 29);
        if (ystep === 0) ystep = 1;
        let xc, yc;
        if (a <= 0 && 0 <= b) { gfx.setcolor(BLACK); xc = maxx * Math.abs(a) / (b - a); gfx.line(toInt(xc + 5), 5, toInt(xc + 5), maxy - 30); }
        if (mn <= 0 && 0 <= mx && mn < mx) { gfx.setcolor(BLACK); yc = (maxy - 24) * Math.abs(mx) / (mx - mn); gfx.line(5, toInt(yc - 5), maxx - 1, toInt(yc - 5)); }
        for (vr = a, i = 5; i < maxx; vr += xstep, i++) gfx.putpixel(i, toInt(10 + .95 * ((mx - polinom(nn, vr)) / ystep)), RED);
        if (t) {
            str2polish(tacres);
            for (vr = a, i = 5; i < maxx; vr += xstep, i++) gfx.putpixel(i, toInt(10 + .95 * ((mx - evalx(vr)) / ystep)), GREEN);
        }
        if (t && metrika >= 0) {
            await io.getch();
            gfx.setcolor(WHITE);
            gfx.bar(0, 0, 639, 479);
            gfx.setcolor(BLACK);
            if (metoda === 1) niska = cfmt("  Greska: Galerkin       Metrika: %d", metrika);
            if (metoda === 2) niska = cfmt("  Greska: Kolokacija     Metrika: %d", metrika);
            if (metoda === 3) niska = cfmt("  Greska: Najm.kvad.     Metrika: %d", metrika);
            gfx.setcolor(BLUE);
            gfx.settextstyle(0, 0, 2);
            gfx.outtextxy(10, 10, niska);
            gfx.settextstyle(0, 0, 1);
            gfx.setcolor(BLACK);
            const method = () => { if (metoda === 1) galerkin(n2); if (metoda === 2) kolokacija(n2); if (metoda === 3) najm_kvad(n2); };
            if (metrika) {
                for (n2 = 2; n2 <= STEPEN; n2++) {
                    method();
                    const k = resi_sistem(n2 - 1);
                    if (!k) {
                        nalaz_polinoma(n2);
                        odstoj[n2 - 2] = Math.pow(integr_num(tacres, EPSILON, racun), 1 / metrika);
                    } else odstoj[n2 - 2] = -1;
                    await io.breathe();
                }
            } else {
                for (n2 = 2; n2 <= STEPEN; n2++) {
                    method();
                    const k = resi_sistem(n2 - 1);
                    if (!k) {
                        nalaz_polinoma(n2);
                        str2polish(tacres);
                        let pom;
                        if (fixed()) {
                            // fixed: every point, b included
                            pl = 0;
                            for (let s = 0; s <= maxx - 1; s++) {
                                vr = s === maxx - 1 ? b : a + (b - a) * s / (maxx - 1);
                                pom = Math.abs(polinom(n2, vr) - evalx(vr));
                                if (pom > pl) pl = pom;
                            }
                        } else {
                            // as written: whether the sum of the steps reaches b depends on the rounding, so in 80 bits
                            const B = X80.of(b), step = X80.divInt(X80.sub(B, X80.of(a)), maxx - 1);
                            let v = X80.of(a);
                            for (pl = 0; X80.le(v, B); v = X80.add(v, step)) {
                                vr = X80.num(v);
                                pom = Math.abs(polinom(n2, vr) - evalx(vr));
                                if (pom > pl) pl = pom;
                            }
                        }
                        odstoj[n2 - 2] = pl;
                    } else odstoj[n2 - 2] = -1;
                    await io.breathe();
                }
            }
            niska = " n   GRESKA";
            gfx.outtextxy(10, 50, niska);
            for (n2 = 2; n2 <= STEPEN; n2++) {
                niska = cfmt("%2d %Lg", n2, odstoj[n2 - 2]);
                gfx.outtextxy(10, 40 + n2 * 14, niska);
            }
            gfx.line(5, 62, 130, 62);
            gfx.line(30, 40, 30, 165);
            gfx.rectangle(5, 40, 130, 165);
            gfx.setcolor(GREEN);
            niska = cfmt("Tacno resenje: %s", tacres);
            gfx.settextstyle(0, 0, 1);
            gfx.outtextxy(10, maxy - 28, niska);
            gfx.settextstyle(0, 0, 1);
            gfx.setcolor(RED);
            for (n2 = 3; n2 <= STEPEN; n2++) if (odstoj[n2 - 2] > 10) odstoj[n2 - 2] = 10;
            if (fixed() && odstoj[0] > 10) odstoj[0] = 10;
            pl = odstoj[0];
            for (n2 = 3; n2 <= STEPEN; n2++) if (odstoj[n2 - 2] > pl) pl = odstoj[n2 - 2];
            xc = Math.trunc((maxx - 150) / (STEPEN - 1));
            yc = (pl !== 0) ? ((maxy - (24 + 10)) / pl) : 1;
            let pomerajy = 0, ips;
            for (n2 = 2; n2 <= STEPEN; n2++) {
                niska = cfmt("%2d", n2);
                gfx.outtextxy(toInt(164 + (n2 - 2) * xc), maxy - 95, niska);
                gfx.setfillpattern(null, RED);
                if (odstoj[n2 - 2] > 0) pomerajy = 30 + toInt((pl - odstoj[n2 - 2]) * yc);
                else if (fixed()) continue;          // fixed: no bar where there is no error to show
                ips = toInt(25 + pomerajy * .8);
                if (ips > 377) { ips -= (ips - 377); ips *= 10; }
                if (ips > 377) { ips -= (ips - 377); }
                gfx.bar(toInt(150 + (n2 - 2) * xc + 8), ips, toInt(149 + (n2 - 1) * xc - 8), toInt(25 + (maxy - 34) * .8));
            }
            niska = "  D I M E N Z I J A  ( n ) ";
            gfx.setcolor(BLACK);
            gfx.settextstyle(0, 0, 1);
            gfx.outtextxy(290, 400, niska);
            niska = "R E L A T I V N A   G R E S K A";
            gfx.settextstyle(0, 1, 1);
            gfx.outtextxy(145, 80, niska);
            gfx.settextstyle(0, 0, 1);
        }
        await io.getch();
        gfx.cleardevice();
        gfx.closegraph();
        io.graphics(false);
    }

    return async function main() {
        try {
            init();
            clrsc();
            for (;;) {
                clrsc();
                printf(" Opsti oblik : p(x)*u\"(x) + q(x)*u'(x) + r(x)*u(x) = f(x)\n");
                printf(" Trenutno    : ");
                jednac = cfmt("(%s)*u\"(x)+(%s)*u'(x)+(%s)*u(x)=%s\n", p, q, r, f);
                jednac += cfmt(" Uslovi      : u(%Lg)=%Lg , u(%Lg)=%Lg", a, c, b, d);
                printf("%s , resenje je polinom stepena %d.\n", jednac, n);
                printf("\n Baza prostora : (x^(k-2))*[(x-a)*(x-b)], k>=2\n");
                printf(" Tacno resenje : %s\n", tac ? tacres : "[nije uneto...poredjenje ce biti ignorisano...]");

                let l = 0;
                metoda = 0;
                while (!metoda && !l) {
                    const ch = await menu(meni1);
                    switch (ch) {
                        case 0: await unos(); l = 1; break;
                        case 1: await mali(); l = 1; break;
                        case 2: await unosn(); l = 1; break;
                        case 3: {
                            printf("\n Tacno resenje (N-nedefinisano Q-staro): ");
                            tacres1 = tacres;
                            const v = await io.scanf(" %59s");
                            if (v.length) tacres1 = v[0];
                            if (tacres1[0] === "q" || tacres1[0] === "Q") { l = 1; break; }
                            if (tacres1[0] === "n" || tacres1[0] === "N") { tac = 0; tacres = "@"; l = 1; break; }
                            if (str2polish(tacres1)) { tac = 0; printf(" %s", nevalja); l = 1; break; }
                            tacres = tacres1; l = 1; tac = 1;
                            break;
                        }
                        case 4: metoda = 1; printf("%s", metod[0]); galerkin(n); break;
                        case 5: metoda = 2; printf("%s", metod[1]); kolokacija(n); break;
                        case 6: metoda = 3; printf("%s", metod[2]); najm_kvad(n); break;
                        case 7: l = 1; await opcije(); break;
                        case 8:
                            con.textbackground(BLACK);
                            con.textcolor(WHITE);
                            io.cursor("normal");
                            con.clrscr();
                            throw new Exit(0);
                    }
                }
                if (l) continue;

                let k = resi_sistem(n - 1);
                if (k) {
                    if (k === 1) printf("\n Sistem je neodredjen!");
                    else printf("\n Sistem je protivurecan!");
                    await io.getch();
                    continue;
                }
                // here the program also wrote u(x) in terms of the basis, through `char *temp`, which points nowhere,
                // and never showed it; the page leaves it out
                nalaz_polinoma(n);
                niska = "u(x)=";
                for (k = n; k >= 2; k--) if (pol[k] !== 0) niska += cfmt("%+Lg*x^%d", pol[k], k);
                if (pol[1] !== 0) niska += cfmt("%+Lg*x", pol[1]);
                if (pol[0] !== 0) niska += cfmt("%+Lg", pol[0]);
                if (niska.length === 5) {
                    niska += "0";
                    if (koef1 === 0 && koef2 === 0) con.printf(fixed() ? "\n u(x)=0" : "0");
                } else printf("\n %s", niska);
                printf("\n Snimanje rezultata u fajl (D/N) ? ");
                let ch = await io.getch();
                if (ch === 68 || ch === 100) {
                    let datname;
                    for (;;) {
                        printf("\n Puno ime fajla (ako postoji,dopisace se): ");
                        const v = await io.scanf("%127s");
                        datname = v.length ? v[0] : "";
                        if (!disk.canWrite(datname)) { printf(" Greska kod imena datoteke!"); continue; }
                        break;
                    }
                    disk.append(datname, cfmt(" Jednacina je : %s za n=%d%s\n", jednac, n, metod[metoda - 1]) + cfmt("%s\n\n", niska));
                }
                printf("\n Graficki prikaz (D/N) ? ");
                ch = await io.getch();
                if (ch === 68 || ch === 100) {
                    t = 0;
                    if (tac === 1) {
                        printf("\n Poredjenje sa tacnim resenjem (D/N) ? ");
                        ch = await io.getch();
                        if ((ch === 68 || ch === 100) && tacres.length) {
                            t = 1;
                            printf("\n Metrike su : - d(f,g) = INTEGRAL(a,b,ABS(f-g)^k) ^ (1/k)");
                            printf("\n              - d(f,g) = sup(abs(f-g)) na [a,b].\n");
                            printf(" (k<0 - ignorisi, k=0 - sup, k>0 konstanta metrike) k = ");
                            const v = await io.scanf("%d");
                            if (v.length) metrika = v[0];
                        }
                    }
                    await graph(n);
                }
            }
        } catch (e) {
            if (e instanceof Exit) return e.code;
            if (e instanceof ev.Overflow) { printf("\n Prekoracenje duzine poljske forme \n"); return 1; }
            throw e;
        }
    };
}

if (typeof module !== "undefined") {
    const { createEvaluator: ce } = require("./evall.js");
    globalThis.createEvaluator = ce;
    module.exports = { createProgram, TextScreen, Graphics, cfmt, fmtG, Exit, TooLong };
}

// ---------------------------------------------------------------------------------------------------------
// The page

if (typeof document !== "undefined") {
    const $ = id => document.getElementById(id);
    const CP437 = "ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ ";
    const PALETTE = ["#000000", "#0000aa", "#00aa00", "#00aaaa", "#aa0000", "#aa00aa", "#aa5500", "#aaaaaa",
        "#555555", "#5555ff", "#55ff55", "#55ffff", "#ff5555", "#ff55ff", "#ffff55", "#ffffff"];
    const glyph = c => c < 32 ? " " : c < 128 ? String.fromCharCode(c) : CP437[c - 128];

    let con = new TextScreen(), gfx = new Graphics();
    let graphicsOn = false, cursorType = "normal";

    // the disk, for Load/Save and the results file
    const disk = new Map();
    const validName = name => name.length > 0 && !/[\\/:*?"<>|]/.test(name);
    const diskApi = {
        read: name => disk.has(name.toUpperCase()) ? disk.get(name.toUpperCase()).text : null,
        write: (name, text) => { disk.set(name.toUpperCase(), { name: name.toUpperCase(), text }); showDisk(); },
        append: (name, text) => { const k = name.toUpperCase(); disk.set(k, { name: k, text: (disk.get(k)?.text ?? "") + text }); showDisk(); },
        canWrite: validName,
    };
    function showDisk() {
        const ul = $("disk");
        ul.replaceChildren();
        if (!disk.size) { const li = document.createElement("li"); li.className = "empty"; li.textContent = "No files yet."; ul.append(li); return; }
        for (const { name, text } of [...disk.values()].sort((x, y) => x.name.localeCompare(y.name))) {
            const li = document.createElement("li");
            const b = document.createElement("button");
            b.textContent = "Download";
            b.addEventListener("click", () => {
                const a = document.createElement("a");
                a.href = URL.createObjectURL(new Blob([text.replace(/\n/g, "\r\n")], { type: "text/plain" }));
                a.download = name;
                a.click();
                setTimeout(() => URL.revokeObjectURL(a.href), 1000);
            });
            li.append(`${name} (${text.length} bytes) `, b);
            ul.append(li);
        }
    }
    $("upload").addEventListener("change", async e => {
        for (const f of e.target.files) {
            const name = f.name.toUpperCase();
            disk.set(name, { name, text: (await f.text()).replace(/\r\n/g, "\n") });
        }
        e.target.value = "";
        showDisk();
    });

    // the English translation of the text screen, line by line
    const T = [
        [/-+ V A R I J A C I O N E {4}M E T O D E -+/, "-------------------- V A R I A T I O N A L   M E T H O D S --------------------"],
        [/Opsti oblik :/, "General form:"], [/Trenutno {4}:/, "Now        :"],
        [/Uslovi {6}:/, "Conditions  :"], [/, resenje je polinom stepena (\d+)\./, ", the solution is a polynomial of degree $1."],
        [/Baza prostora :/, "Basis of the space :"],
        [/Tacno resenje : \[nije uneto\.\.\.poredjenje ce biti ignorisano\.\.\.\]/, "Exact solution : [not entered...the comparison will be skipped...]"],
        [/Tacno resenje :/, "Exact solution :"],
        [/Unos\/Promena parametara jednacine/, "Enter/change the equation"], [/Rad sa malim parametrom/, "Work with a small parameter"],
        [/Promena stepena resenja/, "Change the degree of the solution"], [/Unos\/Promena\/Brisanje tacnog resenja/, "Enter/change/delete the exact solution"],
        [/Metoda Galerkina/, "Galerkin's method"], [/Metoda kolokacije/, "The collocation method"],
        [/Metoda najmanjih kvadrata/, "The least squares method"], [/Load\/Save podataka/, "Load/save the data"], [/I z l a z/, "E x i t"],
        [/STEPEN polinoma za resenje/, "DEGREE of the solution's polynomial"], [/Pogresno n/, "Wrong n"],
        [/Sta hocete da menjate \?/, "What do you want to change?"],
        [/U jednacini : \[p\] \[q\] \[r\] \[f\] \( pogledajte opsti oblik \)/, "In the equation  : [p] [q] [r] [f] ( see the general form )"],
        [/U uslovima {2}: /, "In the conditions: "], [/K r a j {5}: \[K\]/, "E n d            : [K]"],
        [/Pritisnite neki od tastera\.\.\./, "Press one of the keys..."], [/Mora biti a<b !/, "It must be a<b!"],
        [/Sintaksna greska u izrazu!/, "Syntax error in the expression!"],
        [/Sintaksna greska u funkciji : /, "Syntax error in the function: "],
        [/Jednacina: au"\+u'=0 {3}Uslovi: u\(0\)=0,u\(1\)=1/, "Equation: au\"+u'=0   Conditions: u(0)=0,u(1)=1"],
        [/Tacno res:/, "Exact sol:"], [/Mali parametar a iznosi :/, "The small parameter a is:"],
        [/Pritisnite: \[L\]oad \[S\]ave \[N\]ista \.\.\. \?/, "Press: [L]oad [S]ave [N]othing ... ?"],
        [/(LOAD|SAVE) : Ime fajla sa podacima \?/, "$1 : Name of the data file?"],
        [/Nema takvog fajla u tekucem direktorijumu!/, "There is no such file in the current directory!"],
        [/Greska! Ne mogu da ovorim fajl!/, "Error! I can't open the file!"],
        [/Tacno resenje \(N-nedefinisano Q-staro\):/, "Exact solution (N-undefined Q-the old one):"],
        [/Resenje metodom Galerkina :/, "The solution by Galerkin's method:"], [/Resenje metodom kolokacije :/, "The solution by collocation:"],
        [/Resenje metodom najmanjih kvadrata :/, "The solution by least squares:"],
        [/Sistem je neodredjen!/, "The system is indeterminate!"], [/Sistem je protivurecan!/, "The system is inconsistent!"],
        [/Snimanje rezultata u fajl \(D\/N\) \?/, "Save the result to a file (D = yes / N)?"],
        [/Puno ime fajla \(ako postoji,dopisace se\):/, "The file's full name (if it exists, it is added to):"],
        [/Greska kod imena datoteke!/, "Error in the file name!"], [/Graficki prikaz \(D\/N\) \?/, "Draw it (D = yes / N)?"],
        [/Poredjenje sa tacnim resenjem \(D\/N\) \?/, "Compare with the exact solution (D = yes / N)?"],
        [/Metrike su :/, "The metrics are:"], [/ na \[a,b\]\./, " on [a,b]."],
        [/\(k<0 - ignorisi, k=0 - sup, k>0 konstanta metrike\)/, "(k<0 - skip, k=0 - sup, k>0 the metric's constant)"],
        [/Prekoracenje duzine poljske forme/, "The Polish form is too long"],
    ];
    const translate = line => { for (const [re, en] of T) line = line.replace(re, en); return line.trimEnd(); };

    // the English of what the graphics screen says
    const GT = [
        [/ X:\[(.*)\], Y:\[(.*)\], CRVENO-pribl\. ZELENO-tacno CRNO-ose/, "X:[$1], Y:[$2], RED approximate, GREEN exact, BLACK axes"],
        [/Greska: Galerkin +Metrika: (-?\d+)/, "Error: Galerkin, metric k = $1"], [/Greska: Kolokacija +Metrika: (-?\d+)/, "Error: collocation, metric k = $1"],
        [/Greska: Najm\.kvad\. +Metrika: (-?\d+)/, "Error: least squares, metric k = $1"], [/^ n {3}GRESKA$/, "n, and the error"],
        [/^Tacno resenje: (.*)/, "Exact solution: $1"], [/D I M E N Z I J A {2}\( n \)/, "DIMENSION (n)"],
        [/R E L A T I V N A {3}G R E S K A/, "RELATIVE ERROR (written up the side)"], [/^(u\(x\)=.*)/, "The approximate solution $1"],
    ];

    function render() {
        const scr = $("screen"), canvas = $("canvas");
        scr.hidden = graphicsOn;
        canvas.hidden = !graphicsOn;
        if (graphicsOn) {
            const ctx = canvas.getContext("2d"), img = ctx.createImageData(640, 480);
            const rgb = PALETTE.map(h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
            for (let k = 0; k < 640 * 480; k++) { const c = rgb[gfx.px[k]]; img.data.set([c[0], c[1], c[2], 255], k * 4); }
            ctx.putImageData(img, 0, 0);
            // what is on the screen now: the text drawn since it was last cleared
            const from = gfx.log.lastIndexOf(`G bar 0 0 639 479 ${WHITE}`);
            const texts = gfx.log.slice(Math.max(0, from)).filter(l => l.startsWith("G text ")).map(l => l.split(" ").slice(7).join(" "));
            const seen = new Set(), lines = [];
            for (const t of texts) {
                for (const [re, en] of GT) if (re.test(t) && !seen.has(t)) { seen.add(t); lines.push(t.replace(re, en).trim()); }
            }
            $("english").textContent = lines.join("\n") || " ";
            $("english-label").textContent = "What the graphs say, in English";
            return;
        }
        const frag = document.createDocumentFragment();
        for (let y = 0; y < 25; y++) {
            const row = document.createElement("span");
            row.className = "line";
            let run = "", runAttr = -1;
            const flush = () => { if (!run) return; const s = document.createElement("span"); s.style.color = PALETTE[runAttr & 15]; s.style.background = PALETTE[(runAttr >> 4) & 7]; s.textContent = run; row.append(s); run = ""; };
            for (let x = 0; x < 80; x++) {
                const at = con.at[y][x];
                const isCursor = cursorType !== "none" && x === con.x && y === con.y;
                if (at !== runAttr || isCursor) { flush(); runAttr = at; }
                if (isCursor) {
                    const s = document.createElement("span");
                    s.className = "cursor";
                    s.style.color = PALETTE[at & 15]; s.style.background = PALETTE[(at >> 4) & 7];
                    s.textContent = glyph(con.ch[y][x]);
                    row.append(s);
                    runAttr = -1;
                    continue;
                }
                run += glyph(con.ch[y][x]);
            }
            flush();
            frag.append(row);
        }
        scr.replaceChildren(frag);
        $("english").textContent = con.ch.map(r => translate(r.map(glyph).join(""))).join("\n");
        $("english-label").textContent = "In English";
    }

    // the keyboard: an extended key is 0 and then its scan code
    const EXT = { F1: 59, F2: 60, F3: 61, Home: 71, End: 79, ArrowUp: 72, ArrowDown: 80, ArrowLeft: 75, ArrowRight: 77, PageUp: 73, PageDown: 81, Delete: 83, Insert: 82 };
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

    // scanf: DOS reads a line, echoing it, and scanf takes what it needs from it; the rest waits for the next scanf
    let inbuf = "", inpos = 0;
    async function readline() {
        inbuf = ""; inpos = 0;
        const was = cursorType;
        cursorType = "normal";
        for (;;) {
            const c = await nextKey();
            if (c === 13) { con.printf("\n"); inbuf += "\n"; break; }
            if (c === 8) { if (inbuf.length) { inbuf = inbuf.slice(0, -1); con.tput(8); con.tput(32); con.tput(8); } continue; }
            if (c === 0) { await nextKey(); continue; }
            if (c < 32 || c > 126) continue;
            if (inbuf.length < 127) { inbuf += String.fromCharCode(c); con.tput(c); }
        }
        cursorType = was;
    }
    const isws = ch => " \n\t\r\v\f".includes(ch);
    async function skip() { for (;;) { while (inpos < inbuf.length && isws(inbuf[inpos])) inpos++; if (inpos < inbuf.length) return; await readline(); } }

    const io = {
        get con() { return con; }, get gfx() { return gfx; }, disk: diskApi,
        get fixed() { return $("fixed").checked; },
        cursor(tp) { cursorType = tp; },
        graphics(v) { graphicsOn = v; con.gfxOn = v; render(); },
        breathe: () => new Promise(r => setTimeout(r, 0)),
        getch: nextKey,
        async scanf(fmt) {
            const vals = [];
            for (let f = 0; f < fmt.length;) {
                if (isws(fmt[f])) { f++; await skip(); continue; }
                const m = /^%(\d*)(L?)([dsg])/.exec(fmt.slice(f));
                f += m[0].length;
                await skip();
                const rest = inbuf.slice(inpos);
                let mm;
                if (m[3] === "d") mm = /^[+-]?\d+/.exec(rest);
                else if (m[3] === "g") mm = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/.exec(rest);
                else mm = new RegExp(`^\\S{1,${m[1] || 9999}}`).exec(rest);
                if (!mm) break;
                inpos += mm[0].length;
                vals.push(m[3] === "s" ? mm[0] : m[3] === "d" ? parseInt(mm[0], 10) : Number(mm[0]));
            }
            return vals;
        },
    };

    let running = false;
    async function start() {
        stopFlag = true;
        if (wake) { const w = wake; wake = null; w(); }
        while (running) await new Promise(r => setTimeout(r, 10));
        stopFlag = false;
        keys.length = 0;
        inbuf = ""; inpos = 0;
        con = new TextScreen(); gfx = new Graphics();
        graphicsOn = false; cursorType = "normal";
        $("status").textContent = "";
        running = true;
        let code = null;
        try {
            code = await createProgram(io)();
        } catch (e) {
            if (e instanceof TooLong) {
                $("status").textContent = "Here the integral doesn't settle: the program keeps doubling the pieces of Simpson's rule, " +
                    "and past a million of them it would run for hours in DOS, so the page stops. Start again.";
            } else if (e !== STOP) throw e;
        }
        running = false;
        if (code !== null && !stopFlag) {
            graphicsOn = false;
            con.printf("C:\\>");
            cursorType = "normal";
            $("status").textContent = `VM ended with exit code ${code}.`;
        }
        render();
    }

    const screenEl = $("screen"), canvasEl = $("canvas");
    function onKey(e) {
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        let codes = null;
        if (e.key in EXT) codes = [0, EXT[e.key]];
        else if (e.key === "Escape") codes = [27];
        else if (e.key === "Enter") codes = [13];
        else if (e.key === "Backspace") codes = [8];
        else if (e.key.length === 1 && e.key.charCodeAt(0) < 127) codes = [e.key.charCodeAt(0)];
        if (!codes) return;
        e.preventDefault();
        press(...codes);
    }
    for (const el of [screenEl, canvasEl]) {
        el.addEventListener("keydown", onKey);
        el.addEventListener("click", () => el.focus());
    }
    const focus = () => (graphicsOn ? canvasEl : screenEl).focus();
    for (const b of document.querySelectorAll("[data-keys]")) {
        b.addEventListener("click", () => {
            for (const part of b.dataset.keys.split(" ")) {
                if (part.startsWith("@")) press(0, EXT[part.slice(1)]);
                else press(...[...part.replace(/_/g, " ").replace(/\\n/g, "\r")].map(ch => ch.charCodeAt(0)));
            }
            setTimeout(focus, 0);
        });
    }
    $("restart").addEventListener("click", () => { start(); focus(); });
    $("fixed").addEventListener("change", () => { start(); focus(); });

    $("source-vm").textContent = SOURCE_VM;
    $("source-menu").textContent = SOURCE_MENU;
    $("source-evall").textContent = SOURCE_EVALL;
    showDisk();
    start();
}
