"use strict";

// LOFT.C, with Vuksan Pejović's hypertext, HYPER.C, ported line for line: a BGI that draws into 640×480 pixels, a
// conio text screen for the hypertext, and the mouse driver, the keyboard and delay() through `io`.

const BLACK = 0, BLUE = 1, GREEN = 2, CYAN = 3, RED = 4, MAGENTA = 5, BROWN = 6, LIGHTGRAY = 7, DARKGRAY = 8,
    LIGHTBLUE = 9, LIGHTGREEN = 10, LIGHTCYAN = 11, LIGHTRED = 12, LIGHTMAGENTA = 13, YELLOW = 14, WHITE = 15;
const DETECT = 0, VGAHI = 2;
const SOLID_LINE = 0, DOTTED_LINE = 1, CENTER_LINE = 2, DASHED_LINE = 3, USERBIT_LINE = 4, NORM_WIDTH = 1;
const SOLID_FILL = 1, DEFAULT_FONT = 0, TRIPLEX_FONT = 1, HORIZ_DIR = 0, COPY_PUT = 0;

const b64 = s => typeof Buffer !== "undefined" ? new Uint8Array(Buffer.from(s, "base64")) : Uint8Array.from(atob(s), c => c.charCodeAt(0));

// ---------------------------------------------------------------------------------------------------------
// The text screen, for conio

class TextScreen {
    constructor() { this.reset(); }
    reset() {
        this.ch = Array.from({ length: 25 }, () => new Array(80).fill(32));
        this.at = Array.from({ length: 25 }, () => new Array(80).fill(0x07));
        this.x = 0; this.y = 0;
        if (this.attr === undefined) { this.attr = 0x07; this.wl = 0; this.wt = 0; this.wr = 79; this.wb = 24; }
    }
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
    clrscr() {
        for (let y = this.wt; y <= this.wb; y++) for (let x = this.wl; x <= this.wr; x++) { this.ch[y][x] = 32; this.at[y][x] = this.attr; }
        this.x = this.wl; this.y = this.wt;
    }
    gotoxy(x, y) {
        if (x < 1 || y < 1 || this.wl + x - 1 > this.wr || this.wt + y - 1 > this.wb) return;
        this.x = this.wl + x - 1; this.y = this.wt + y - 1;
    }
    window(l, t, r, b) { this.wl = l - 1; this.wt = t - 1; this.wr = r - 1; this.wb = b - 1; this.x = this.wl; this.y = this.wt; }
    gettextinfo() { return { winleft: this.wl + 1, wintop: this.wt + 1, winright: this.wr + 1, winbottom: this.wb + 1, attribute: this.attr }; }
    gettext(l, t, r, b) {
        const buf = [];
        for (let y = t - 1; y <= b - 1; y++) for (let x = l - 1; x <= r - 1; x++) buf.push(this.ch[y][x], this.at[y][x]);
        return buf;
    }
    puttext(l, t, r, b, buf) {
        let k = 0;
        for (let y = t - 1; y <= b - 1; y++) for (let x = l - 1; x <= r - 1; x++) { this.ch[y][x] = buf[k++]; this.at[y][x] = buf[k++]; }
    }
    insline() {
        for (let y = this.wb; y > this.y; y--) for (let x = this.wl; x <= this.wr; x++) { this.ch[y][x] = this.ch[y - 1][x]; this.at[y][x] = this.at[y - 1][x]; }
        for (let x = this.wl; x <= this.wr; x++) { this.ch[this.y][x] = 32; this.at[this.y][x] = this.attr; }
    }
    delline() {
        for (let y = this.y; y < this.wb; y++) for (let x = this.wl; x <= this.wr; x++) { this.ch[y][x] = this.ch[y + 1][x]; this.at[y][x] = this.at[y + 1][x]; }
        for (let x = this.wl; x <= this.wr; x++) { this.ch[this.wb][x] = 32; this.at[this.wb][x] = this.attr; }
    }
}

// ---------------------------------------------------------------------------------------------------------
// The BGI, in 640×480 with 16 colors: it draws into `px`, and logs what it is asked to draw, in the words the
// simulated C prints, so the two can be compared

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

// TRIP.CHR: a header, then for each character where its strokes start and how wide it is; each stroke is two bytes,
// x and y in 7 bits with a sign, and two op bits: end, move to, or draw to. y counts up from the baseline.
const TRIPLEX = (() => {
    const b = b64(TRIP_CHR), h = b[b.indexOf(0x1a) + 1] | b[b.indexOf(0x1a) + 2] << 8;
    const n = b[h + 1] | b[h + 2] << 8, first = b[h + 4], strokes = h + (b[h + 5] | b[h + 6] << 8);
    const s8 = v => v << 24 >> 24, s7 = v => (v & 0x7f) << 25 >> 25;
    const font = { cap: s8(b[h + 8]), dec: s8(b[h + 10]), chars: {} };
    for (let k = 0; k < n; k++) {
        const off = b[h + 16 + 2 * k] | b[h + 17 + 2 * k] << 8, width = b[h + 16 + 2 * n + k], ops = [];
        for (let p = strokes + off; ; p += 2) {
            const op = (b[p] >> 7) << 1 | b[p + 1] >> 7;
            if (op === 0) break;
            ops.push([op, s7(b[p]), s7(b[p + 1])]);          // 2: move, 3: draw
        }
        font.chars[first + k] = { width, ops };
    }
    return font;
})();
// the stroke fonts' sizes 1 to 10, as fractions of the font's own size
const MULT = [1, 3, 2, 3, 1, 4, 5, 2, 5, 3, 4], DIVS = [1, 5, 3, 4, 1, 3, 3, 1, 2, 1, 1];
const LINE_PATTERNS = [0xffff, 0xcccc, 0xfc78, 0xf8f8];

class Graphics {
    constructor() { this.px = new Uint8Array(640 * 480); this.log = []; this.texts = []; this.images = []; this.reset(); }
    reset() { this.color = WHITE; this.fstyle = SOLID_FILL; this.fcolor = WHITE; this.lstyle = SOLID_LINE; this.lpat = 0; this.font = DEFAULT_FONT; this.size = 1; }
    set(x, y, c) { if (x >= 0 && x < 640 && y >= 0 && y < 480) this.px[y * 640 + x] = c; }
    get(x, y) { return x >= 0 && x < 640 && y >= 0 && y < 480 ? this.px[y * 640 + x] : -1; }
    initgraph() { this.reset(); this.px.fill(0); this.texts = []; this.log.push("G init"); }
    setgraphmode(m) { this.reset(); this.px.fill(0); this.texts = []; this.log.push(`G mode ${m}`); }
    restorecrtmode() { this.log.push("G restorecrt"); }
    closegraph() { this.log.push("G close"); }
    cleardevice() { this.log.push("G clear"); this.px.fill(0); this.texts = []; }
    setcolor(c) { this.color = c; }
    getcolor() { return this.color; }
    setfillstyle(p, c) { this.fstyle = p; this.fcolor = c; }
    getmaxx() { return 639; }
    getmaxy() { return 479; }
    setlinestyle(s, p, t) { this.lstyle = s; this.lpat = p & 0xffff; }
    settextstyle(f, d, s) { this.font = f; this.size = s; }
    bar(l, t, r, b) {
        this.log.push(`G bar ${l} ${t} ${r} ${b} ${this.fstyle} ${this.fcolor}`);
        const c = this.fstyle === SOLID_FILL ? this.fcolor : BLACK;
        for (let y = Math.min(t, b); y <= Math.max(t, b); y++) for (let x = Math.min(l, r); x <= Math.max(l, r); x++) this.set(x, y, c);
        this.texts = this.texts.filter(e => !(e.x >= l && e.x <= r && e.y >= t && e.y <= b));
    }
    // Bresenham, always from the left, or from the top when steep; the pattern's bit 0 is the first pixel
    raster(x1, y1, x2, y2, pat) {
        if (Math.abs(x2 - x1) >= Math.abs(y2 - y1) ? x1 > x2 : y1 > y2) [x1, y1, x2, y2] = [x2, y2, x1, y1];
        const dx = Math.abs(x2 - x1), dy = -Math.abs(y2 - y1), sx = x1 < x2 ? 1 : -1, sy = y1 < y2 ? 1 : -1;
        let err = dx + dy, x = x1, y = y1;
        for (let k = 0; ; k++) {
            if (pat >> (k & 15) & 1) this.set(x, y, this.color);
            if (x === x2 && y === y2) break;
            const e2 = 2 * err;
            if (e2 >= dy) { err += dy; x += sx; }
            if (e2 <= dx) { err += dx; y += sy; }
        }
    }
    pattern() { return this.lstyle === USERBIT_LINE ? this.lpat : LINE_PATTERNS[this.lstyle]; }
    line(x1, y1, x2, y2) {
        this.log.push(`G line ${x1} ${y1} ${x2} ${y2} ${this.color} ${this.lstyle} ${this.lstyle === USERBIT_LINE ? this.lpat : 0}`);
        this.raster(x1, y1, x2, y2, this.pattern());
        if (y1 === y2) this.texts = this.texts.filter(e => !(e.y === y1 && e.x >= Math.min(x1, x2) && e.x <= Math.max(x1, x2)));
    }
    rectangle(l, t, r, b) {
        this.log.push(`G rect ${l} ${t} ${r} ${b} ${this.color} ${this.lstyle} ${this.lstyle === USERBIT_LINE ? this.lpat : 0}`);
        const p = this.pattern();
        this.raster(l, t, r, t, p); this.raster(r, t, r, b, p); this.raster(l, b, r, b, p); this.raster(l, t, l, b, p);
    }
    // the midpoint circle, one octant mirrored; each point with its angle, counterclockwise from the east, y up
    circlePoints(xc, yc, r) {
        const pts = [];
        let x = 0, y = r, d = 1 - r;
        while (x <= y) {
            for (const [a, b] of [[x, y], [y, x], [-x, y], [-y, x], [x, -y], [y, -x], [-x, -y], [-y, -x]]) pts.push([xc + a, yc - b]);
            if (d < 0) d += 2 * x + 3; else { d += 2 * (x - y) + 5; y--; }
            x++;
        }
        return pts;
    }
    circle(x, y, r) {
        this.log.push(`G circle ${x} ${y} ${r} ${this.color}`);
        for (const [a, b] of this.circlePoints(x, y, r)) this.set(a, b, this.color);
    }
    arc(x, y, st, en, r) {
        this.log.push(`G arc ${x} ${y} ${st} ${en} ${r} ${this.color}`);
        for (const [a, b] of this.circlePoints(x, y, r)) {
            let ang = Math.atan2(y - b, a - x) * 180 / Math.PI;
            if (ang < 0) ang += 360;
            if ((ang >= st && ang <= en) || (ang === 0 && en === 360)) this.set(a, b, this.color);
        }
    }
    // the region around (x, y) that the border color closes, four-connected; a pixel already in the fill color
    // stops it too
    floodfill(x, y, border) {
        this.log.push(`G flood ${x} ${y} ${border} ${this.fstyle} ${this.fcolor}`);
        const c = this.fcolor, stack = [[x, y]];
        while (stack.length) {
            const [a, b] = stack.pop(), v = this.get(a, b);
            if (v < 0 || v === border || v === c) continue;
            this.set(a, b, c);
            stack.push([a + 1, b], [a - 1, b], [a, b + 1], [a, b - 1]);
        }
    }
    putpixel(x, y, c) { this.log.push(`G px ${x} ${y} ${c}`); this.set(x, y, c); }
    outtextxy(x, y, s) {
        this.log.push(`G text ${x} ${y} ${this.color} ${this.font} ${this.size} ${s}`);
        const codes = [...s].map(ch => ch.charCodeAt(0));
        if (this.font === DEFAULT_FONT) {
            const z = this.size;
            codes.forEach((code, k) => {
                const g = FONT8[code] || FONT8[63];
                for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
                    if (!(g[r] & (1 << c))) continue;
                    for (let dy = 0; dy < z; dy++) for (let dx = 0; dx < z; dx++) this.set(x + (k * 8 + c) * z + dx, y + r * z + dy, this.color);
                }
            });
        } else {
            const m = MULT[this.size], d = DIVS[this.size], sc = v => Math.trunc(v * m / d);
            const base = y + sc(TRIPLEX.cap - TRIPLEX.dec);
            let ox = x;
            for (const code of codes) {
                const g = TRIPLEX.chars[code];
                if (!g) continue;
                let px = 0, py = 0;
                for (const [op, a, b] of g.ops) {
                    const nx = ox + sc(a), ny = base - sc(b);
                    if (op === 3) this.raster(px, py, nx, ny, 0xffff);
                    px = nx; py = ny;
                }
                ox += sc(g.width);
            }
        }
        // what the page reads out in English: the text on the screen now
        const same = e => e.x === x && e.y === y;
        if (this.color === WHITE) this.texts = this.texts.filter(e => !(same(e) && e.s === s));
        else { this.texts = this.texts.filter(e => !same(e)); this.texts.push({ x, y, s, image: this.images.length }); }
    }
    getimage(l, t, r, b) {
        this.log.push(`G getimage ${l} ${t} ${r} ${b}`);
        const data = [];
        for (let y = t; y <= b; y++) for (let x = l; x <= r; x++) data.push(this.get(x, y));
        this.images.push(true);
        return { w: r - l + 1, h: b - t + 1, data, depth: this.images.length };
    }
    putimage(x0, y0, img, op) {
        this.log.push(`G putimage ${x0} ${y0} ${op}`);
        let k = 0;
        for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++, k++) if (img.data[k] >= 0) this.set(x0 + x, y0 + y, img.data[k]);
        this.texts = this.texts.filter(e => e.image < img.depth);
        this.images.length = img.depth - 1;
    }
}

// Borland C computed in 80 bits, JavaScript computes in 64. Of what LOFT shows, that changes one thing: the fuel's
// temperature curve at exactly 400, 600, 800 and 1000 degrees, where 80 bits put the point a pixel higher. So that
// one is computed here in 80 bits: [m, e] is m·2^e, rounded to 64 bits of m, ties to even.
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
    mul([m1, e1], [m2, e2]) { return X80.round([m1 * m2, e1 + e2]); },
    trunc([m, e]) { if (e >= 0) return Number(m << BigInt(e)); const s = BigInt(-e); return Number(m < 0n ? -((-m) >> s) : m >> s); },
};

// ---------------------------------------------------------------------------------------------------------
// The program

function createProgram(io) {
    const g = io.gfx, con = io.con;
    const idiv = (a, b) => Math.trunc(a / b);

    // LOFT.C
    let buffer = null;
    let kasnjenje = 1000;         /* izbazdariti... */
    const snaga = new Array(301).fill(0);
    const gorivo = new Float32Array(301);
    const kosuljica = new Float32Array(301);
    const nosioc = new Float32Array(301);
    const s = new Float32Array(301);
    const p = new Float32Array(301);

    const patterns = [0xfff0, 0xff0f, 0xf0ff, 0x0fff];

    const delay = ms => io.delay(ms);
    const getch = () => io.getch();
    const kbhit = () => io.kbhit();

    function initgraph() { g.initgraph(); io.mode("graphics"); }
    function restorecrtmode() { g.restorecrtmode(); con.reset(); io.mode("text"); }

    function q(i, x1, x2, y1, y2) {
        let temp;

        temp = y1 + idiv((i - x1) * (y2 - y1), x2 - x1);
        return temp;
    }

    function init() {
        let i;

        for (i = 0; i <= 300; i++) {
            if (i <= 64) snaga[i] = Math.trunc(-0.051 * i + 50);
            else if (i > 64 && i <= 106) snaga[i] = Math.trunc(-0.966 * i + 108.39);
            else if (i > 106) snaga[i] = Math.trunc(-0.03 * i + 9.12);

            if (i < 11) { gorivo[i] = q(i, 0, 10, 728, 990); kosuljica[i] = q(i, 0, 10, 319, 331); nosioc[i] = q(i, 0, 10, 293, 292); }
            if (i > 10 && i < 21) { gorivo[i] = q(i, 10, 20, 990, 1058); kosuljica[i] = q(i, 10, 20, 331, 336); nosioc[i] = q(i, 10, 20, 292, 294); }
            if (i > 20 && i < 31) { gorivo[i] = q(i, 20, 31, 1058, 1071); kosuljica[i] = q(i, 20, 31, 336, 338); nosioc[i] = q(i, 20, 31, 294, 294); }
            if (i > 30 && i < 42) { gorivo[i] = q(i, 31, 41, 1071, 1067); kosuljica[i] = q(i, 31, 41, 338, 338); nosioc[i] = q(i, 31, 41, 294, 295); }
            if (i > 41 && i < 52) { gorivo[i] = q(i, 41, 51, 1067, 1062); kosuljica[i] = q(i, 41, 51, 338, 338); nosioc[i] = q(i, 41, 51, 295, 295); }
            if (i > 51 && i < 62) { gorivo[i] = q(i, 51, 61, 1062, 1055); kosuljica[i] = q(i, 51, 61, 338, 338); nosioc[i] = q(i, 51, 61, 295, 296); }
            if (i > 61 && i < 73) { gorivo[i] = q(i, 61, 72, 1055, 1007); kosuljica[i] = q(i, 61, 72, 338, 337); nosioc[i] = q(i, 61, 72, 296, 297); }
            if (i > 72 && i < 83) { gorivo[i] = q(i, 72, 82, 1007, 882); kosuljica[i] = q(i, 72, 82, 337, 331); nosioc[i] = q(i, 72, 82, 297, 299); }
            if (i > 82 && i < 93) { gorivo[i] = q(i, 82, 92, 882, 734); kosuljica[i] = q(i, 82, 92, 331, 325); nosioc[i] = q(i, 82, 92, 299, 300); }
            if (i > 92 && i < 103) { gorivo[i] = q(i, 92, 102, 734, 581); kosuljica[i] = q(i, 92, 102, 325, 317); nosioc[i] = q(i, 92, 102, 300, 302); }
            if (i > 102 && i < 113) { gorivo[i] = q(i, 102, 112, 581, 452); kosuljica[i] = q(i, 102, 112, 317, 312); nosioc[i] = q(i, 102, 112, 302, 303); }
            if (i > 112 && i < 123) { gorivo[i] = q(i, 112, 122, 452, 410); kosuljica[i] = q(i, 112, 122, 312, 312); nosioc[i] = q(i, 112, 122, 303, 306); }
            if (i > 122 && i < 134) { gorivo[i] = q(i, 122, 133, 410, 397); kosuljica[i] = q(i, 122, 133, 312, 314); nosioc[i] = q(i, 122, 133, 306, 309); }
            if (i > 133 && i < 144) { gorivo[i] = q(i, 133, 143, 397, 392); kosuljica[i] = q(i, 133, 143, 314, 316); nosioc[i] = q(i, 133, 143, 309, 312); }
            if (i > 143 && i < 154) { gorivo[i] = q(i, 143, 153, 392, 390); kosuljica[i] = q(i, 143, 153, 316, 319); nosioc[i] = q(i, 143, 153, 312, 315); }
            if (i > 153 && i < 164) { gorivo[i] = q(i, 153, 163, 390, 388); kosuljica[i] = q(i, 153, 163, 319, 322); nosioc[i] = q(i, 153, 163, 315, 318); }
            if (i > 163 && i < 174) { gorivo[i] = q(i, 163, 173, 388, 384); }
            if (i > 173 && i < 184) { gorivo[i] = q(i, 173, 183, 384, 380); }
            if (i > 183 && i < 195) { gorivo[i] = q(i, 183, 194, 380, 375); }
            if (i > 194 && i < 205) { gorivo[i] = q(i, 194, 204, 375, 370); }
            if (i > 204 && i < 215) { gorivo[i] = q(i, 204, 214, 370, 365); }
            if (i > 214 && i < 225) { gorivo[i] = q(i, 214, 224, 365, 361); }
            if (i > 224 && i < 235) { gorivo[i] = q(i, 224, 234, 361, 356); }
            if (i > 234 && i < 246) { gorivo[i] = q(i, 234, 245, 356, 351); }
            if (i > 245 && i < 256) { gorivo[i] = q(i, 245, 255, 351, 346); }
            if (i > 255 && i < 266) { gorivo[i] = q(i, 255, 265, 346, 341); }
            if (i > 265 && i < 276) { gorivo[i] = q(i, 265, 275, 341, 336); }
            if (i > 275 && i < 287) { gorivo[i] = q(i, 275, 286, 336, 331); }
            if (i > 286 && i < 301) { gorivo[i] = q(i, 286, 296, 331, 326); }

            // Fixed: the three seconds no range took in, 164 and 235 for the coolant and 286 for the cladding, stayed
            // at 0 degrees, off the graph
            if (io.fixed) {
                if (i >= 164 && i <= 234) nosioc[i] = 318;
                if (i >= 235 && i <= 300) nosioc[i] = 319;
                if (i >= 286 && i <= 300) kosuljica[i] = 319;
            }
            if (i > 164 && i <= 234) nosioc[i] = 318;
            if (i > 235 && i <= 300) nosioc[i] = 319;

            if (i >= 162 && i < 194) kosuljica[i] = 322;
            if (i >= 194 && i < 245) kosuljica[i] = 321;
            if (i >= 245 && i < 286) kosuljica[i] = 320;
            if (i > 286 && i <= 300) kosuljica[i] = 319;
        }

        s[0] = 115;
        p[0] = 15.00;
        for (i = 1; i <= 96; i++) { s[i] = s[i - 1] - 0.417; p[i] = p[i - 1] + 0.024; }
        for (i = 97; i <= 107; i++) { s[i] = s[i - 1] + 0.500; p[i] = p[i - 1] - 0.100; }
        for (i = 108; i <= 300; i++) { s[i] = s[i - 1]; p[i] = p[i - 1] - 0.00416; }
    }

    function kraj() {
        restorecrtmode();
        g.closegraph();
    }

    async function main() {
        let driver, mode;

        driver = DETECT;

        initgraph();   /* potrebni: EGAVGA.BGI i TRIP.CHR */
        g.setgraphmode(VGAHI);

        init();
        await menu();
        kraj();
    }

    async function menu() {
        let c, l = 1;

        do {
            if (l) {
                g.cleardevice();
                g.setcolor(BLACK);
                g.setfillstyle(1, WHITE);
                g.bar(0, 0, g.getmaxx(), g.getmaxy());

                g.setlinestyle(SOLID_LINE, 0, NORM_WIDTH);

                g.rectangle(1, 1, 638, 478);

                g.setlinestyle(SOLID_LINE, 0, NORM_WIDTH);
                g.settextstyle(TRIPLEX_FONT, HORIZ_DIR, 7);
                g.outtextxy(30, 0, "LOFT Eksperiment");

                g.settextstyle(TRIPLEX_FONT, HORIZ_DIR, 4);
                g.outtextxy(160, 70, "'Loss Of Fluid Test'");

                g.settextstyle(TRIPLEX_FONT, HORIZ_DIR, 5);
                g.outtextxy(230, 135, "1 Pomoc");
                g.outtextxy(230, 175, "2 Opis");
                g.outtextxy(230, 215, "3 Start");
                g.outtextxy(230, 270, "0 Kraj");

                g.settextstyle(TRIPLEX_FONT, HORIZ_DIR, 1);
                g.outtextxy(50, 350, " Idaho National Engeenering Laboratory, USA, April 1982.");
                g.outtextxy(26, 400, "    Implementacija: A.Cirilovic (Masinski fakultet, Beograd)");
                g.outtextxy(38, 420, "   M.Despotovic, V.Pejovic (Matematicki fakultet, Beograd)");
                g.outtextxy(280, 450, "Mart 1995.");
            }

            c = await getch();
            switch (c) {
                case 49: await pomoc();
                    l = 1;
                    break;
                case 50: await opis();
                    l = 1;
                    break;
                case 51: await experiment();
                    l = 1;
                    break;
                default: l = 0;
            }
        }
        while (c !== 48);
        return;
    }

    async function pomoc() {
        let y;
        const string = [];
        g.cleardevice();
        g.setfillstyle(1, WHITE);
        g.bar(0, 0, g.getmaxx(), g.getmaxy());
        g.setcolor(BLACK);

        string[0] = "";
        string[1] = "U meniju izaberite opciju pritiskom na odgovarajuci taster.";
        string[2] = "Za vreme odvijanja simulacije,na raspolaganju su Vam sle-";
        string[3] = "dece komande :";
        string[4] = "            BILO KOJI TASTER  pocetak eksperimenta";
        string[5] = "            KURSOR LEVO      usporavanje";
        string[6] = "            KURSOR DESNO    ubrzavanje";
        string[7] = "            SPACE             pauza";
        string[8] = "            ENTER             ponovni pocetak";
        string[9] = "            ESC                meni (prekid)";
        string[10] = "Po zavrsetku, pritisak na bilo koji taster vraca Vas u meni.";
        string[11] = "Na pocetku (i u toku pauze) eksperimenta,  mozete se in-";
        string[12] = "formisati o objektima na ekranu  pozicioniranjem strelice";
        string[13] = "misa i upotrebom LEVOG tastera.  Za  zavrsetak  pregleda,";
        string[14] = "kliknite na 'KRAJ PREGLEDA'.  Opis eksperimenta je uradjen";
        string[15] = "u hipertekstu cija je upotreba opisana na sledecoj strani.";

        g.rectangle(1, 1, 638, 478);
        g.settextstyle(TRIPLEX_FONT, HORIZ_DIR, 3);
        g.outtextxy(120, 30, "UPUTSTVO ZA KORISCENJE PROGRAMA");
        g.rectangle(89, 28, 570, 58);

        g.settextstyle(TRIPLEX_FONT, HORIZ_DIR, 2);

        for (y = 1; y <= 15; y++) {
            g.outtextxy(10, 50 + y * 24, string[y]);
        }

        g.settextstyle(TRIPLEX_FONT, HORIZ_DIR, 3);
        g.outtextxy(160, 440, "bilo koji taster za nastavak...");
        g.setlinestyle(DOTTED_LINE, 0, NORM_WIDTH);
        g.rectangle(140, 442, 500, 468);
        g.setlinestyle(SOLID_LINE, 0, NORM_WIDTH);

        await getch();

        g.cleardevice();
        g.setfillstyle(1, WHITE);
        g.bar(0, 0, g.getmaxx(), g.getmaxy());
        g.rectangle(1, 1, 638, 478);
        g.settextstyle(TRIPLEX_FONT, HORIZ_DIR, 2);
        string[1] = " Hipertekst omogucava inteligentije pregledanje teksta.";
        string[2] = " Istaknute reci uvek oznacavaju slozeniji pojam.";
        string[3] = " Na raspolaganju su Vam sledece komande :";
        string[4] = "";
        string[5] = "   KURSORSKI TASTERI  pomeranje po tekstu";
        string[6] = "   TAB                  pomera kursor za 8 mesta udesno";
        string[7] = "   HOME                pomera kursor na pocetak reda";
        string[8] = "   END                  pomera kursor na kraj reda";
        string[9] = "   PgUp i PgDn         stranica gore/dole";
        string[10] = "   ENTER               objasnjenje oznacenog pojma";
        string[11] = "   DEL                  prethodni 'nivo' teksta";
        string[12] = "   ESC                  povratak u meni";

        for (y = 1; y <= 12; y++) {
            g.outtextxy(10, 40 + y * 24, string[y]);
        }

        g.settextstyle(TRIPLEX_FONT, HORIZ_DIR, 3);
        g.outtextxy(160, 440, " bilo koji taster za meni...");
        g.setlinestyle(DOTTED_LINE, 0, NORM_WIDTH);
        g.rectangle(140, 442, 500, 468);
        g.setlinestyle(SOLID_LINE, 0, NORM_WIDTH);

        await getch();
    }

    async function experiment() {
        let timer;
        labexp: for (;;) {
            do {
                timer = 1;
                kasnjenje = 1000;
                g.setlinestyle(SOLID_LINE, 0, NORM_WIDTH);
                nacrtaj();
                sop(timer);
                pritisak(0);
                protok(0);
                await mis();

                if (await getch() === 27) return;

                while (timer <= 300) {
                    switch (await uradi(timer++)) {
                        case 0: return;
                        case 1: continue labexp;
                    }
                    await delay(kasnjenje);
                }
            }
            while (await getch() === 13);
            return;
        }
    }

    async function getkey() {
        let c = 0;

        if (kbhit()) {
            c = await getch();
            if (!c) c = 1000 + await getch();
        }
        return c;
    }

    async function uradi(timer) {
        let c, ch;

        if (kbhit()) {
            c = await getkey();
            switch (c) {
                case 32: {
                    do {
                        await mis();
                        ch = await getch();
                        if (ch === 27) return (0);
                        else if (ch === 32) break;
                    }
                    while (1);
                    break;
                }
                case 1077: {
                    if (kasnjenje > 150) kasnjenje -= 150;
                    break;
                }
                case 1075: {
                    kasnjenje += 150;
                    break;
                }
                case 13: {
                    return (1);
                }
                case 27: {
                    return (0);
                }
            }
        }

        if (timer === 1) {
            let c, i;

            c = g.getcolor();
            g.settextstyle(DEFAULT_FONT, HORIZ_DIR, 1);
            for (i = 0; i <= 4; i++) {
                g.setcolor(WHITE);
                g.outtextxy(396, 133, "STOP");
                await delay(200);
                g.setcolor(RED);
                g.outtextxy(396, 133, "STOP");
                await delay(200);
                g.setcolor(BLACK);
                g.settextstyle(DEFAULT_FONT, HORIZ_DIR, 1);
                g.outtextxy(390, 63, "Pumpa prestaje sa radom");
                g.outtextxy(390, 73, "i eksperiment pocinje...");
            }
            g.setcolor(c);
        }

        if (timer === 6) brisi();

        if (timer === 16) {
            g.setcolor(BLACK);
            g.settextstyle(DEFAULT_FONT, HORIZ_DIR, 1);
            g.outtextxy(390, 63, "Povecava se temperatura vode");
            g.outtextxy(390, 73, "u primarnom cirkulacionom");
            g.outtextxy(390, 83, "krugu,raste pritisak u SOP-u.");
        }

        if (timer === 22) brisi();

        if (timer === 31) {
            g.setcolor(BLACK);
            g.settextstyle(DEFAULT_FONT, HORIZ_DIR, 1);
            g.outtextxy(390, 63, "Aktivira se sistem");
            g.outtextxy(390, 73, "rashladnih tuseva.");
            g.setlinestyle(SOLID_LINE, 0, NORM_WIDTH);
        }

        if (timer > 31) protok2(timer);
        if (timer > 31) tusiraj(timer);

        if (timer === 36) brisi();

        if (timer === 61) {
            g.setcolor(BLACK);
            g.settextstyle(DEFAULT_FONT, HORIZ_DIR, 1);
            g.outtextxy(390, 63, "Reaktor polako gubi toplotni");
            g.outtextxy(390, 73, "ponor i snaga mu rapidno");
            g.outtextxy(390, 83, "opada (INHERENTNA SIGURNOST).");
        }

        if (timer === 66) brisi();

        if (timer === 79) {
            let i;

            g.setcolor(BLACK);
            g.settextstyle(DEFAULT_FONT, HORIZ_DIR, 1);
            g.outtextxy(390, 63, "Otvaraju se otpusni");
            g.outtextxy(390, 73, "rasteretni ventili.");
            for (i = 0; i <= 4; i++) {
                g.setcolor(WHITE);
                g.outtextxy(159, 94, "START");
                await delay(200);
                g.setcolor(RED);
                g.outtextxy(159, 94, "START");
                await delay(200);
            }
        }

        if (timer === 84) brisi();

        if (timer === 97) {
            let i;

            g.setcolor(BLACK);
            g.settextstyle(DEFAULT_FONT, HORIZ_DIR, 1);
            g.outtextxy(390, 63, "Otvaraju se sigurnosni");
            g.outtextxy(390, 73, "rasteretni ventili.");
            for (i = 0; i <= 4; i++) {
                g.setcolor(WHITE);
                g.outtextxy(152, 44, "START");
                await delay(200);
                g.setcolor(RED);
                g.outtextxy(152, 44, "START");
                await delay(200);
            }
        }

        if (timer === 102) brisi();

        if (timer === 108) {
            let i;

            g.setcolor(BLACK);
            g.settextstyle(DEFAULT_FONT, HORIZ_DIR, 1);
            g.outtextxy(390, 63, "Zatvaraju se sigurnosni");
            g.outtextxy(390, 73, "rasteretni ventili.");
            g.setcolor(WHITE);
            g.outtextxy(152, 44, "START");
            for (i = 0; i <= 4; i++) {
                g.setcolor(BLACK);
                g.outtextxy(152, 44, "STOP");
                await delay(200);
                g.setcolor(WHITE);
                g.outtextxy(152, 44, "STOP");
                await delay(200);
            }
        }

        if (timer === 113) brisi();

        if (timer === 121) {
            let i;

            g.setcolor(BLACK);
            g.settextstyle(DEFAULT_FONT, HORIZ_DIR, 1);
            g.outtextxy(390, 63, "Otpusni rasteretni ventili");
            g.outtextxy(390, 73, "svojim ciklicnim radom obe-");
            g.outtextxy(390, 83, "zbedjuju siguran oporavak...");
            for (i = 0; i <= 4; i++) {
                g.setcolor(WHITE);
                g.outtextxy(202, 94, "CIKLICNO");
                await delay(200);
                g.setcolor(GREEN);
                g.outtextxy(202, 94, "CIKLICNO");
                await delay(200);
            }
        }

        if (timer === 126) brisi();

        sop(timer);
        pritisak(timer);
        protok(timer);
        funkcije(timer);
        odbroj(timer);

        return (2);
    }

    function brisi() {
        let i;

        g.setcolor(YELLOW);
        g.setlinestyle(SOLID_LINE, 0, NORM_WIDTH);
        for (i = 63; i <= 94; i++) {
            g.line(390, i, 629, i);
        }
    }

    function tusiraj(timer) {
        if (timer % 2) g.setcolor(BLUE);
        else g.setcolor(WHITE);
        g.setlinestyle(SOLID_LINE, 0, NORM_WIDTH);

        tus();
    }

    function tus() {
        g.line(125, 65, 125, 70);
        g.line(126, 65, 126, 70);
        g.line(123, 65, 121, 70);
        g.line(122, 65, 120, 70);
        g.line(128, 65, 130, 70);
        g.line(129, 65, 131, 70);
    }

    // the temperature axes say kelvins, but the curves are in degrees Celsius: the fuel starts at 728, which is Tg(0) =
    // 1001 K less 273. Fixed says C.
    const unit = () => io.fixed ? "(C)" : "(K)";

    function nacrtaj() {
        g.cleardevice();
        g.setcolor(BLACK);
        g.setfillstyle(1, WHITE);
        g.bar(0, 0, g.getmaxx(), g.getmaxy());

        g.settextstyle(DEFAULT_FONT, HORIZ_DIR, 5);
        g.outtextxy(440, 4, "00:00");

        g.rectangle(20, 340, 320, 460);
        g.line(18, 420, 20, 420);
        g.line(18, 380, 20, 380);
        g.line(120, 460, 120, 462);
        g.line(220, 460, 220, 462);
        g.settextstyle(DEFAULT_FONT, HORIZ_DIR, 1);
        g.outtextxy(20, 330, "SNAGA REAKTORA (MW)");
        g.settextstyle(DEFAULT_FONT, HORIZ_DIR, 1);
        g.outtextxy(10, 452, "0");
        g.outtextxy(1, 417, "20");
        g.outtextxy(1, 377, "40");
        g.outtextxy(1, 341, "60");
        g.outtextxy(103, 467, "100s");
        g.outtextxy(203, 467, "200s");
        g.outtextxy(290, 467, "300s");

        g.rectangle(400, 210, 630, 286);   /* goriva          */
        g.rectangle(400, 300, 630, 376);   /* kosuljice       */
        g.rectangle(400, 390, 630, 466);   /* nosioca toplote */

        g.line(398, 229, 400, 229);
        g.line(398, 248, 400, 248);
        g.line(398, 267, 400, 267);

        g.line(398, 319, 400, 319);
        g.line(398, 338, 400, 338);
        g.line(398, 357, 400, 357);

        g.line(398, 409, 400, 409);
        g.line(398, 428, 400, 428);
        g.line(398, 447, 400, 447);

        g.line(477, 466, 477, 468);
        g.line(553, 466, 553, 468);

        g.line(477, 376, 477, 378);
        g.line(553, 376, 553, 378);

        g.line(477, 286, 477, 288);
        g.line(553, 286, 553, 288);

        g.outtextxy(364, 210, "1100");
        g.outtextxy(364, 226, " 900");
        g.outtextxy(364, 245, " 700");
        g.outtextxy(364, 264, " 500");
        g.outtextxy(372, 279, "300");

        g.outtextxy(372, 300, "341");
        g.outtextxy(372, 316, "333");
        g.outtextxy(372, 335, "325");
        g.outtextxy(372, 354, "317");
        g.outtextxy(372, 369, "309");

        g.outtextxy(372, 390, "320");
        g.outtextxy(372, 406, "313");
        g.outtextxy(372, 425, "305");
        g.outtextxy(372, 444, "297");
        g.outtextxy(372, 459, "290");

        g.outtextxy(400, 201, "Temperatura goriva" + unit());
        g.outtextxy(400, 291, "Temperatura kosuljice" + unit());
        g.outtextxy(400, 381, "Temperatura nosioca toplote" + unit());

        g.outtextxy(463, 470, "100s");
        g.outtextxy(539, 470, "200s");
        g.outtextxy(600, 470, "300s");

        g.rectangle(380, 50, 630, 95);
        g.setfillstyle(SOLID_FILL, YELLOW);
        g.floodfill(382, 52, BLACK);
        g.outtextxy(382, 52, "DOGADJAJ:");

        g.line(100, 75, 100, 125);
        g.line(150, 75, 150, 125);      /* SOP */
        g.arc(125, 75, 0, 180, 25);
        g.arc(125, 125, 180, 360, 25);

        g.setcolor(BLACK);
        g.circle(125, 286, 13);

        g.rectangle(300, 140, 360, 190);
        g.setfillstyle(SOLID_FILL, YELLOW);
        g.floodfill(305, 142, BLACK);
        g.line(300, 140, 360, 190);
        g.outtextxy(310, 175, "GP");

        g.setcolor(LIGHTGRAY);
        g.rectangle(327, 90, 332, 139);
        g.setfillstyle(SOLID_FILL, LIGHTGRAY);
        g.floodfill(330, 100, LIGHTGRAY);
        g.setcolor(BLACK);
        g.line(329, 88, 329, 70);
        g.line(330, 88, 330, 70);
        g.line(326, 74, 329, 70);
        g.line(330, 70, 333, 74);
        g.outtextxy(290, 60, "ka turbini");

        g.setcolor(LIGHTBLUE);
        g.setfillstyle(1, LIGHTBLUE);
        g.bar(360, 163, 400, 168);

        g.setcolor(BLACK);
        g.circle(413, 165, 13);

        g.setcolor(LIGHTBLUE);
        g.setfillstyle(1, LIGHTBLUE);
        g.bar(427, 163, 454, 168);

        g.setcolor(BLACK);
        g.line(456, 165, 474, 165);
        g.line(456, 166, 474, 166);
        g.line(456, 165, 460, 162);
        g.line(456, 166, 460, 169);
        g.outtextxy(476, 162, " od kondenzatora");

        g.line(420, 164, 405, 164); g.line(132, 285, 117, 285);
        g.line(420, 165, 404, 165); g.line(132, 286, 116, 286);
        g.line(420, 166, 405, 166); g.line(132, 287, 117, 287);
        g.line(406, 167, 406, 163); g.line(118, 288, 118, 284);
        g.line(407, 168, 407, 162); g.line(119, 289, 119, 283);

        g.outtextxy(393, 142, "pumpa");
        g.outtextxy(105, 262, "pumpa");

        g.setcolor(RED);
        g.setfillstyle(1, RED);
        g.bar(20, 195, 60, 235);
        g.setcolor(WHITE);
        g.settextstyle(DEFAULT_FONT, HORIZ_DIR, 2);
        g.outtextxy(34, 208, "R");

        g.setcolor(BLUE);
        g.setfillstyle(1, BLUE);
        g.bar(123, 150, 128, 163);

        g.setcolor(LIGHTBLUE);
        g.setfillstyle(SOLID_FILL, LIGHTBLUE);
        g.line(123, 50, 123, 37);
        g.line(128, 50, 128, 32);
        g.line(128, 32, 82, 32);
        g.line(123, 37, 87, 37);
        g.line(82, 32, 82, 158);
        g.line(87, 37, 87, 158);
        g.line(87, 158, 82, 158);
        g.line(123, 50, 128, 50);
        g.floodfill(124, 49, LIGHTBLUE);
        g.rectangle(123, 50, 128, 58);
        g.floodfill(124, 51, LIGHTBLUE);

        g.rectangle(87, 173, 82, 283);
        g.floodfill(86, 175, LIGHTBLUE);

        g.settextstyle(DEFAULT_FONT, HORIZ_DIR, 1);
        g.setcolor(BLACK);
        g.outtextxy(155, 120, "SOP");

        g.setcolor(BLACK);

        g.rectangle(150, 75, 163, 78);
        g.setfillstyle(SOLID_FILL, BLACK);
        g.floodfill(151, 76, BLACK);

        g.line(163, 73, 163, 80);
        g.line(163, 80, 170, 73);
        g.line(163, 73, 170, 80);
        g.line(170, 80, 170, 73);
        g.rectangle(170, 75, 180, 78);
        g.floodfill(171, 76, BLACK);
        g.outtextxy(159, 84, "RV");

        g.line(122, 59, 116, 65);
        g.line(129, 59, 135, 65);

        g.line(145, 60, 145, 40);
        g.line(142, 57, 142, 40);
        g.line(145, 40, 142, 40);
        g.floodfill(144, 41, BLACK);
        g.line(140, 40, 147, 40);
        g.line(140, 40, 143, 37);
        g.line(144, 37, 147, 40);
        g.line(145, 35, 148, 38);
        g.line(145, 34, 148, 31);
        g.line(148, 31, 148, 38);
        g.putpixel(144, 34, BLACK);
        g.putpixel(145, 33, BLACK);
        g.putpixel(144, 32, BLACK);
        g.putpixel(144, 31, BLACK);
        g.putpixel(145, 30, BLACK);
        g.putpixel(146, 29, BLACK);
        g.putpixel(145, 28, BLACK);
        g.putpixel(144, 27, BLACK);
        g.putpixel(143, 26, BLACK);
        g.putpixel(144, 25, BLACK);
        g.putpixel(145, 24, BLACK);
        g.putpixel(146, 23, BLACK);
        g.putpixel(147, 22, BLACK);
        g.outtextxy(152, 34, "SV");
    }

    function protok2(timer) {
        g.setcolor(WHITE);
        teci2(timer - 1, 0);
        g.setcolor(LIGHTBLUE);
        teci2(timer, 1);
    }

    function teci2(timer, sta) {
        let i, j;
        let p;

        j = 3 - (timer % 4);

        p = patterns[j];

        for (i = 0; i < 6; i++) {
            g.setlinestyle(USERBIT_LINE, p, NORM_WIDTH);
            if (sta) g.setcolor(LIGHTBLUE);
            g.line(82 + i, 173, 82 + i, 283);
            g.line(82 + i, 37, 82 + i, 158);
            p = patterns[timer % 4];
            g.setlinestyle(USERBIT_LINE, p, NORM_WIDTH);
            g.line(82, 32 + i, 128, 32 + i);
            g.line(123 + i, 32, 123 + i, 58);
            p = patterns[j];
            g.setlinestyle(USERBIT_LINE, p, NORM_WIDTH);
        }
    }

    function protok(timer) {
        g.setcolor(WHITE);
        teci(timer - 1, 0);
        g.setcolor(BLUE);
        teci(timer, 1);
    }

    function teci(timer, sta) {
        let i, j;
        // protok(0) asks for timer -1 here, which no case takes: p0 and p1 are never set, and draw whatever was on
        // the stack. Here, nothing.
        let p0 = 0, p1 = 0;

        j = timer % 4;

        switch (j) {
            case 0:
                {
                    p0 = patterns[0];
                    p1 = patterns[3];
                    break;
                }
            case 1:
                {
                    p0 = patterns[1];
                    p1 = patterns[2];
                    break;
                }
            case 2:
                {
                    p0 = patterns[2];
                    p1 = patterns[1];
                    break;
                }
            case 3:
                {
                    p0 = patterns[3];
                    p1 = patterns[0];
                    break;
                }
        }


        for (i = 0; i < 6; i++) {
            if (sta) g.setcolor(BLUE);
            g.setlinestyle(USERBIT_LINE, p0, NORM_WIDTH);
            g.line(40, 163 + i, 299, 163 + i);

            g.setlinestyle(USERBIT_LINE, p1, NORM_WIDTH);
            g.line(40 + i, 169, 40 + i, 194);

            if (sta) g.setcolor(LIGHTBLUE);
            g.line(40 + i, 236, 40 + i, 283);

            g.setlinestyle(USERBIT_LINE, p1, NORM_WIDTH);
            g.line(40, 284 + i, 111, 284 + i);

            g.line(139, 284 + i, 332, 284 + i);

            g.setlinestyle(USERBIT_LINE, p0, NORM_WIDTH);
            g.line(327 + i, 283, 327 + i, 191);
        }
    }

    function odbroj(timer) {
        let minuta, desekundi, sekundi;
        let sminuta, sdesekundi, ssekundi;
        // char cminuta[1], ... : one character, and then the '\0' is written one past it
        let cminuta, cdesekundi, csekundi;
        let csminuta, csdesekundi, cssekundi;

        g.settextstyle(DEFAULT_FONT, HORIZ_DIR, 5);

        minuta = idiv(timer, 60);
        sekundi = timer - idiv(timer, 60) * 60;
        desekundi = idiv(sekundi, 10);
        sekundi = sekundi - desekundi * 10;

        sminuta = idiv(timer - 1, 60);
        ssekundi = (timer - 1) - idiv(timer - 1, 60) * 60;
        sdesekundi = idiv(ssekundi, 10);
        ssekundi = ssekundi - sdesekundi * 10;

        cminuta = String.fromCharCode(minuta + 48);
        cdesekundi = String.fromCharCode(desekundi + 48);
        csekundi = String.fromCharCode(sekundi + 48);

        csminuta = String.fromCharCode(sminuta + 48);
        csdesekundi = String.fromCharCode(sdesekundi + 48);
        cssekundi = String.fromCharCode(ssekundi + 48);

        if (minuta !== sminuta) {
            g.setcolor(WHITE);
            g.outtextxy(480, 4, csminuta);
            g.setcolor(BLACK);
            g.outtextxy(480, 4, cminuta);
        }

        if (desekundi !== sdesekundi) {
            g.setcolor(WHITE);
            g.outtextxy(560, 4, csdesekundi);
            g.setcolor(BLACK);
            g.outtextxy(560, 4, cdesekundi);
        }

        g.setcolor(WHITE);
        g.outtextxy(600, 4, cssekundi);
        g.setcolor(BLACK);
        g.outtextxy(600, 4, csekundi);
    }

    function funkcije(timer) {
        let x, y;

        x = timer + 20;
        y = snaga[timer] * 2 + 21;
        g.putpixel(x, 480 - y, RED);

        x = Math.trunc(timer * 0.76 + 400);
        y = X80.trunc(X80.add(X80.of(480), X80.mul(X80.of(-1), X80.add(X80.mul(X80.of(gorivo[timer]), X80.of(0.095)), X80.of(165)))));
        g.putpixel(x, y, BLACK);

        x = Math.trunc(timer * 0.76 + 400);
        y = Math.trunc(480 - ((kosuljica[timer] - 309) * 2.375 + 104));
        g.putpixel(x, y, BLACK);

        x = Math.trunc(timer * 0.76 + 400);
        y = Math.trunc(480 - ((nosioc[timer] - 290) * 2.53 + 14));
        g.putpixel(x, y, BLACK);
    }

    async function opis() {
        let driver, mode;

        restorecrtmode();
        g.closegraph();
        await hypertext2("loft.hyp");

        driver = DETECT;
        initgraph();
        g.setgraphmode(VGAHI);
    }

    // the mouse driver, through int 33h
    function mouse_reset() {
        const r = { ax: 0x00 };
        io.int86(0x33, r);
        return { status: r.ax, n_buttons: r.bx };
    }

    function cursor_on() {
        io.int86(0x33, { ax: 0x01 });
    }

    function cursor_off() {
        io.int86(0x33, { ax: 0x02 });
    }

    async function get_status() {
        await delay(200);
        const r = { ax: 0x03 };
        io.int86(0x33, r);
        return { x: r.cx, y: r.dx, leftb: r.bx & 1 };
    }

    function set_range(x1, y1, x2, y2) {
        io.int86(0x33, { ax: 0x07, cx: x1, dx: x2 });
        io.int86(0x33, { ax: 0x08, cx: y1, dx: y2 });
    }

    function prozor(x1, y1, x2, y2) {
        buffer = g.getimage(x1, y1, x2, y2);
        g.setfillstyle(SOLID_FILL, WHITE);
        g.bar(x1, y1, x2, y2);
        g.settextstyle(DEFAULT_FONT, HORIZ_DIR, 1);
        g.setcolor(BLACK);
        g.rectangle(x1, y1, x2, y2);
        g.rectangle(x1 + 1, y1 + 1, x2 - 1, y2 - 1);
    }

    async function mis() {
        let i;
        let x, y, lb;
        const st = async () => ({ x, y, leftb: lb } = await get_status());

        mouse_reset();
        cursor_on();
        g.setlinestyle(SOLID_LINE, 0, NORM_WIDTH);
        g.setcolor(BLACK);
        g.rectangle(3, 3, 120, 23);
        g.settextstyle(DEFAULT_FONT, HORIZ_DIR, 1);
        for (i = 0; i <= 2; i++) {
            g.setcolor(WHITE);
            g.outtextxy(10, 10, "KRAJ PREGLEDA");
            await delay(200);
            g.setcolor(BLACK);
            g.outtextxy(10, 10, "KRAJ PREGLEDA");
            await delay(200);
        }

        // a window of text over the drawing, until the next click
        const popup = async (x1, y1, x2, y2, title, lines, twice) => {
            set_range(x, y, x, y);
            prozor(x1, y1, x2, y2);
            g.setcolor(RED);
            for (const [ty, t] of title) g.outtextxy(x1 + 6, ty, t);
            if (lines.length) g.setcolor(BLUE);
            for (const [ty, t] of lines) g.outtextxy(x1 + 6, ty, t);
            while (lb) await st();
            if (twice) while (lb) await st();
            while (!lb) await st();
            g.putimage(x1, y1, buffer, COPY_PUT);
            buffer = null;
        };

        do {
            await st();
            if (lb) {
                if ((x > 440) && (y < 32))
                    await popup(105, 105, 428, 210, [[117, "           VREMENSKI BROJAC"], [125, "           ----------------"]], [
                        [141, "Vremenski  brojac je na pocetku setovan"],
                        [149, "na referentno  nula  vreme. Eksperiment"],
                        [157, "se zavrsava na 05:00 (300 s). On ujedno"],
                        [165, "i prati  brzinu  odvijanja. Na pocetku,"],
                        [173, "ta brzina je realna tj. brojac se pove-"],
                        [181, "cava  svake  sekunde.  Brzinu odvijanja"],
                        [189, "mozete  menjati sa kursorskim tasterima"],
                        [197, "LEVO (sporije) i DESNO (brze)."]]);

                if ((x > 380) && (x < 630) && (y > 50) && (y < 95))
                    await popup(150, 200, 478, 270, [[208, "            PROZOR DOGADJANJA"], [216, "            -----------------"]], [
                        [232, "On  Vam omogucava  tekstualno  pracenje"],
                        [240, "najznacajnijih promena u toku simulaci-"],
                        [248, "je.  Propratni  tekst  svakog dogadjaja"],
                        [256, "traje 5 vremenskih jedinica."]]);

                if ((x > 20) && (x < 60) && (y > 195) && (y < 235))
                    await popup(50, 50, 378, 120, [[58, "                REAKTOR"], [66, "                -------"]], [
                        [82, "Ovaj reaktor ima  snagu  od 50MW  (ter-"],
                        [90, "malna snaga) i predstavlja uvecan model"],
                        [98, "komercijalnog  PWR-a  ( Pressure  Water"],
                        [106, "Reactor)."]]);

                if ((x > 20) && (x < 320) && (y > 340) && (y < 460))
                    await popup(90, 220, 418, 306, [[228, "          GRAFIK SNAGE REAKTORA"], [236, "          ---------------------"]], [
                        [252, "Ovaj  grafik  ce reprezentovati promenu"],
                        [260, "snage reaktora u toku vremena.  Matema-"],
                        [268, "ticki model ove  funkcije su 3 linearne"],
                        [276, "jednacine, dobijene linearnom  aproksi-"],
                        [284, "macijom eksperimentalnih rezultata. Ove"],
                        [292, "jednacine mozete pogledati u opisu."]]);

                if ((x > 400) && (x < 630) && (y > 210) && (y < 286))
                    await popup(30, 200, 358, 294, [[208, "       GRAFIK TEMPERATURE GORIVA"], [216, "       -------------------------"]], [
                        [232, "Ovaj grafik  predstavlja promenu tempe-"],
                        [240, "rature goriva.  Ta funkcija je izrazena"],
                        [248, "diferencijalnim jednacinama koje mozete"],
                        [256, "pogledati u opisu.  Pocetna temperatura"],
                        [264, "goriva je : Tg = 1001 K (to je ujedno i"],
                        [272, "temperatura goriva kada reaktor  radi u"],
                        [280, "nominalnim uslovima ( Q = 50 MW ))."]]);

                if ((x > 400) && (x < 630) && (y > 300) && (y < 376))
                    await popup(30, 250, 358, 352, [[258, "      GRAFIK TEMPERATURE KOSULJICE"], [266, "      ----------------------------"]], [
                        [282, "Ovaj grafik  predstavlja promenu tempe-"],
                        [290, "rature kosuljice.  Ta funkcija je izra-"],
                        [298, "zena  diferencijalnim  jednacinama koje"],
                        [306, "mozete pogledati u opisu.Pocetna tempe-"],
                        [314, "ratura kosuljice je :  Tk = 592.3 K (to"],
                        [322, "je ujedno i temperatura  kosuljice kada"],
                        [330, "reaktor  radi  u  nominalnim   uslovima"],
                        [338, "( Q = 50 MW ))."]]);

                if ((x > 400) && (x < 630) && (y > 390) && (y < 466))
                    await popup(30, 300, 358, 418, [[308, "             GRAFIK SREDNJE "], [316, "      TEMPERATURE NOSIOCA TOPLOTE"], [324, "      ---------------------------"]], [
                        [340, "Ovaj grafik  predstavlja promenu  sred-"],
                        [348, "nje (aritmeticka  sredina  ulazne i iz-"],
                        [356, "lazne)  temperature.   Ta  funkcija  je"],
                        [364, "izrazena  diferencijalnim   jednacinama"],
                        [372, "koje mozete pogledati u opisu.  Pocetna"],
                        [380, "srednja temperatura nosioca toplote je:"],
                        [388, "Tnt = 566.07  (to je  ujedno  i srednja"],
                        [396, "temperatura  kada  reaktor radi u nomi-"],
                        [404, "nalnim uslovima ( Q = 50 MW ))."]]);

                if ((x > 300) && (x < 360) && (y > 140) && (y < 190))
                    await popup(20, 210, 348, 304, [[218, "             GENERATOR PARE"], [226, "             --------------"]], [
                        [242, "Ovo je u stvari razmenjivac toplote ko-"],
                        [250, "ji omogucava  razmenu  toplote  izmedju"],
                        [258, "primarnog i sekundarnog  kruga. Na nje-"],
                        [266, "govoj  sekundarnoj  strani imamo  dovod"],
                        [274, "napojne vode iz kondenzatora (u simula-"],
                        [282, "ciji plava cev) i odvod  pare u turbinu"],
                        [290, "(siva cev)."]]);

                if ((x > 100) && (x < 150) && (y > 50) && (y < 150))
                    await popup(60, 170, 388, 248, [[178, "  SISTEM ZA ODRZAVANJE PRITISKA (SOP)"], [186, "  -----------------------------------"]], [
                        [202, "SOP predstavlja sud sa faznim  prelazom"],
                        [210, "koji zahvaljujuci funkcionalnom dejstvu"],
                        [218, "svojih  komponenata regulise odrzavanje"],
                        [226, "pritiska u primarnom cirkulacionom kru-"],
                        [234, "gu."]]);

                if ((x > 400) && (x < 426) && (y > 152) && (y < 178))
                    await popup(240, 200, 568, 270, [[208, "           PUMPA NAPOJNE VODE"], [216, "           ------------------"]], [
                        [232, "Na  pocetku  eksperimenta ova  pumpa je"],
                        [240, "ispala iz pogona cime je simuliran pre-"],
                        [248, "kid  dotoka  napojne vode  u  generator"],
                        [256, "pare."]], true);

                if ((x > 112) && (x < 138) && (y > 273) && (y < 299))
                    await popup(40, 220, 368, 242, [[228, "           CIRKULACIONA PUMPA"]], []);

                if (((x > 40) && (x < 45) && (y > 169) && (y < 194)) ||
                    ((x > 49) && (x < 299) && (y > 163) && (y < 168)))
                    await popup(60, 210, 388, 240, [[218, "              TOPLA GRANA"], [226, "     PRIMARNOG CIRKULACIONOG KRUGA"]], []);

                if (((x > 40) && (x < 45) && (y > 236) && (y < 283)) ||
                    ((x > 40) && (x < 111) && (y > 284) && (y < 289)) ||
                    ((x > 139) && (x < 332) && (y > 284) && (y < 289)) ||
                    ((x > 327) && (x < 332) && (y > 191) && (y < 283)))
                    await popup(20, 310, 348, 340, [[318, "              HLADNA GRANA"], [326, "     PRIMARNOG CIRKULACIONOG KRUGA"]], []);

                if (((x > 82) && (x < 87) && (y > 173) && (y < 283)) ||
                    ((x > 82) && (x < 87) && (y > 32) && (y < 158)) ||
                    ((x > 87) && (x < 128) && (y > 32) && (y < 37)) ||
                    ((x > 123) && (x < 128) && (y > 37) && (y < 58)))
                    await popup(120, 150, 448, 220, [[158, "        SISTEM RASHLADNIH TUSEVA"], [166, "        ------------------------"]], [
                        [182, "Kroz ovu cev fluid iz hladne grane pri-"],
                        [190, "marnog  cirkulacionog  kruga dospeva do"],
                        [198, "sistema rashladnih tuseva koji je loci-"],
                        [206, "ran u gornjem delu SOP-a."]]);

                if ((x > 157) && (x < 177) && (y > 66) && (y < 94))
                    await popup(50, 120, 378, 190, [[128, "       SISTEM RASTERETNIH VENTILA"], [136, "       --------------------------"]], [
                        [152, "Pomocu njega  se ispusta  para iz SOP-a"],
                        [160, "u  cilju  smanjivanja  pritiska.  On se"],
                        [168, "aktivira kada pritisak u SOP-u dostigne"],
                        [176, "vrednost od 16.2 MPa."]]);

                if ((x > 135) && (x < 168) && (y > 32) && (y < 44))
                    await popup(200, 50, 528, 136, [[58, "        SISTEM SIGURNOSNIH VENTILA"], [66, "        --------------------------"]], [
                        [82, "Kako sistem rasteretnih ventila ne obe-"],
                        [90, "zbedjuje  zeljeno  smanjenje  pritiska,"],
                        [98, "dolazi do otvaranja ovih  ventila  kroz"],
                        [106, "koje u ovom  slucaju  isticu  zajedno i"],
                        [114, "voda i para. Aktivira se kada  pritisak"],
                        [122, "u SOP-u dostigne vrednost od 17.3 MPa."]]);
                set_range(0, 0, g.getmaxx(), g.getmaxy());
            }
        }
        while ((x < 3) || (x > 120) || (y < 3) || (y > 23) || (!lb));

        cursor_off();
        g.setfillstyle(1, WHITE);
        g.bar(3, 3, 120, 23);
        g.setfillstyle(1, BLUE);
    }

    function sop(timer) {
        let sy, ny;

        g.setlinestyle(SOLID_LINE, 0, NORM_WIDTH);

        sy = Math.trunc(s[timer - 1]);
        ny = Math.trunc(s[timer]);

        if (timer <= 96) {
            g.setcolor(WHITE);
            g.line(101, sy, 149, sy);
            trougao(sy - 1);
            g.setcolor(BLACK);
            g.line(101, ny, 149, ny);
            trougao(ny - 1);
            g.setfillstyle(SOLID_FILL, BLUE);
            g.floodfill(125, ny + 1, BLACK);
        }

        else {
            g.setcolor(WHITE);
            trougao(sy - 1);
            trougao(ny - 1);
            trougao(sy - 2);
            trougao(ny - 2);
            g.line(101, sy, 149, sy);
            g.line(101, ny, 149, ny);
            g.line(101, sy - 1, 149, sy - 1);
            g.line(101, ny - 1, 149, ny - 1);
            g.setcolor(BLACK);
            trougao(ny);
        }
    }

    function trougao(y) {
        g.line(112, y, 116, y - 4);
        g.line(112, y, 108, y - 4);
        g.line(108, y - 4, 116, y - 4);
    }

    function pritisak(timer) {
        let s;

        g.settextstyle(DEFAULT_FONT, HORIZ_DIR, 1);

        s = p[timer].toFixed(6);
        s = s.slice(0, 5);

        g.setcolor(BLUE);
        g.bar(105, 121, 145, 129);

        g.setcolor(WHITE);
        g.outtextxy(105, 121, s);
        g.outtextxy(113, 132, "MPa");
    }

    // HYPER.C, by Vuksan Pejović: the file is the texts one after another, each ended by a 0 and headed by the four
    // corners of its window, and then how many there are. In a text, \ and two bytes and a word and \ is a link: the
    // two bytes are the number of the text it leads to.
    /*********************************************************/
    /* Uradio student Vuksan Pejovic MR90131 PMF, marta 1995 */
    /*********************************************************/
    let sirina = 0, dubina = 0;
    let left = 0, up = 0, right = 0, down = 0;
    let xco = 0, yco = 0, cyco = 0, find_lin = 0;
    let xcol = 0, ycol = 0;
    let podaci, tb;              // text is podaci + tb
    let br_lin = 0;        /* Broj linija trenutno u prozoru */
    let brgore = 0, brdole = 0; /* Pokazuju na pocetak prve linije u prozoru */
    /* i pocetak prve linije ispod prozora. */
    let cur_lin = 0, cur_pos = 0, st_light = 0, end_light = 0;
    let light = 0, brtxt = 0;
    let dughyp, duzina;
    let niz;
    let SP, pom;
    const text = i => podaci[tb + i];

    function printchar(ch, xco, yco, sirina) {
        /* Koordinate su apsolutne!                  */
        /* Napisano zbog stampanja char-a u desnom   */
        /* uglu tekst-prozora bez prelaza u novi red.*/
        if (xco !== sirina) { con.putch(ch); return 1; }
        const txtinfo = con.gettextinfo();
        const niz = [ch, txtinfo.attribute];
        xco = txtinfo.winright;
        yco += txtinfo.wintop - 1;
        con.puttext(xco, yco, xco, yco, niz);
        return 1;
    } /* printchar */

    function okvir() {
        let i;

        con.window(left, up, right, down);
        con.gotoxy(1, 1);
        con.putch(201);
        for (i = left + 1; i < right; i++) con.putch(205);
        con.putch(187);
        con.gotoxy(1, down - up + 1);
        con.putch(200);
        for (i = left + 1; i < right; i++) con.putch(205);
        printchar(188, 1, down - up + 1, 1);
        for (i = 2; i <= down - up; i++) {
            con.gotoxy(1, i);
            con.putch(186);
            con.gotoxy(right - left + 1, i);
            con.putch(186);
        }
    } /* okvir */

    function clr_to_eol(xco, yco, sirina) {  /* Zbog toga sto DOS-ov clreol() bagira */
        let i;

        for (i = xco; i <= sirina; i++) printchar(32, i, yco, sirina);
    } /* clr_to_eol */

    function printscreen(br) {
        let c;
        let xcor, ycor, i;

        for (i = 1; i <= dubina; i++) printchar(32, sirina, i, sirina);
        con.gotoxy(xcor = 1, ycor = 1);
        while ((c = text(br++)) !== 0) {
            switch (c) {
                case 10: ycor++;
                    if (ycor <= dubina) con.putch(10);
                    break;
                case 13: clr_to_eol(xcor, ycor, sirina);
                    xcor = 1;
                    con.putch(13);
                    break;
                case 92: if (text(br) === 92) {
                    printchar(92, xcor++, ycor, sirina);
                    br++;
                    break;
                }
                    con.textcolor(YELLOW);
                    for (br += 2; text(br) !== 92; br++)
                        printchar(text(br), xcor++, ycor, sirina);
                    br++;
                    con.textcolor(BLACK);
                    break;
                default: printchar(c, xcor++, ycor, sirina);
            } /* switch */
            if (ycor > dubina) break;
        } /* while ((c=text[br++])!=0) */
        if (text(br - 1) === 0) br--;
        if ((br_lin = ycor - 1) < dubina) clr_to_eol(xcor, ycor, sirina);
        for (c = dubina; c > ycor; c--) clr_to_eol(1, c, sirina);
        return br;
    } /* printscreen */

    function print_line(yco, br) {
        let ch;
        let xco;

        con.gotoxy(xco = 1, yco);
        for (; (ch = text(br)) !== 13; br++)
            if (ch !== 92) printchar(ch, xco++, yco, sirina);
            else if (text(br + 1) === 92) {
                printchar(ch, xco++, yco, sirina);
                br++;
            }
            else {
                con.textcolor(YELLOW);
                for (br += 3; text(br) !== 92; br++)
                    printchar(text(br), xco++, yco, sirina);
                con.textcolor(BLACK);
            }
    } /* print_line */

    function lines_back(n, br) {
        let i;

        i = 0;
        if (br > 1) br -= 2;
        while (br && (i < n)) if (text(br--) === 10) i++;
        if (br || (i === n)) br += 2;
        else i++;
        find_lin = i;
        return br;
    } /* lines_back */

    function lines_forth(n, br) {
        let i;

        i = 0;
        while (text(br) && (i < n)) if (text(br++) === 10) i++;
        find_lin = i;
        return br;
    } /* lines_forth */

    const d2 = v => String(v).padStart(2), dl4 = v => String(v).padEnd(4);

    function poruke(i) {
        con.window(left + 1, down - 1, left + sirina, down - 1);
        con.textbackground(LIGHTGREEN);
        con.textcolor(BLACK);
        switch (i) {
            case 1: con.clrscr();
                break;
            default: con.gotoxy(3, 1);
                con.cprintf(`${d2(xco)}:${dl4(cyco)} `);
                if ((SP.prev !== null) && (sirina > 29)) con.cprintf(" DEL Prethodni nivo");
        } /* switch */
        con.textbackground(WHITE);
        con.window(left + 1, up + 1, left + sirina, down - 2);
        con.gotoxy(xco, yco);
    } /* poruke */

    function get_len() {
        let i, k, m;
        let ch;

        for (i = m = 0, k = 1; (ch = text(cur_lin + i)) !== 13; i++, k++) {
            if (ch === 92)
                if (text(cur_lin + i + 1) === 92) i++;
                else {
                    if (m === 0) i += 2;
                    k--;
                    m = +!m;
                }
        }
        return (k > sirina) ? sirina : k;
    } /* get_len */

    function lighted() {
        let i, k, m;

        let ch;
        m = 0;
        for (i = 0, k = xco; i < k; i++) {
            ch = text(cur_lin + i);
            if (ch === 13) return 0;
            if (ch === 92)
                if (text(cur_lin + i + 1) === 92) { i++; k++; }
                else {
                    if (m === 0) k += 2;
                    k++;
                    m = +!m;
                }
        }
        cur_pos = cur_lin + i - 1;
        return m;
    } /* lighted */

    function setlight() {
        let xcol2;

        con.textcolor(YELLOW);
        if (lighted()) {   /* Osvetljena je rec na kojoj se nalazi kursor */
            let i;
            switch (light) {
                case 1: if ((st_light <= cur_pos) && (cur_pos <= end_light)) break;
                    con.gotoxy(xcol, ycol);
                    for (i = st_light, xcol2 = xcol; text(i) !== 92; i++)
                        printchar(text(i), xcol2++, ycol, sirina);
                // falls through
                case 0: st_light = cur_pos;
                    while (text(st_light) !== 92) st_light--;
                    st_light += 3;
                    xcol = xco - (cur_pos - st_light);
                    ycol = yco;
                    con.gotoxy(xcol, ycol);
                    con.textbackground(RED);
                    for (i = st_light, xcol2 = xcol; text(i) !== 92; i++)
                        printchar(text(i), xcol2++, ycol, sirina);
                    end_light = i - 1;
                    light = 1;
                    con.gotoxy(xco, yco);
            } /* switch */
        }
        else if (light) {
            let i;
            con.gotoxy(xcol, ycol);
            for (i = st_light, xcol2 = xcol; text(i) !== 92; i++)
                printchar(text(i), xcol2++, ycol, sirina);
            con.gotoxy(xco, yco);
            light = 0;
        }
        con.textcolor(BLACK);
        con.textbackground(WHITE);
    } /* setlight */

    function freeall(w) {
        podaci = null;
        niz = null;
        SP = null;
    } /* freeall */

    function def_win(n) {
        tb = niz[n].poc;
        duzina = niz[n].lang;
        left = text(-4);
        up = text(-3);
        right = text(-2);
        down = text(-1);
        sirina = right - left - 1;
        dubina = down - up - 2;
        io.section?.(n);
    } /* def_win */

    async function hypertext2(hypdat) {
        let ch;
        let i;
        let n;
        let prev_win;

        const file = b64(LOFT_HYP);           // fopen(hypdat,"rb")
        dughyp = file.length - 2;
        if (!dughyp) return 1;
        n = file[dughyp];
        n += 256 * file[dughyp + 1];
        podaci = file.slice(0, dughyp);
        niz = [];
        for (i = 0, duzina = 0; i < n; i++) {
            let br;
            niz[i] = { poc: duzina + 4 };
            br = 0;
            while (podaci[duzina++]) br++;
            niz[i].lang = br - 4;
        }
        def_win(0);
        SP = { brtxt: brtxt = 0, prev: null, prev_win: null };
        xco = yco = cyco = 1;
        // light is static, and kept from the last time: if a word was lit when Esc left the text, the next time the
        // first setlight() unlights it where it was, printing that many characters of the new text there. Fixed
        // starts unlit.
        if (io.fixed) light = 0;
        con.textcolor(BLACK);
        con.textbackground(WHITE);
        okvir();
        con.window(left + 1, down - 1, right - 1, down - 1);
        poruke(1);
        poruke(0);
        con.textbackground(WHITE);
        con.window(left + 1, up + 1, right - 1, down - 2);
        con.clrscr();
        brgore = cur_lin = 0;
        brdole = printscreen(brgore);
        con.gotoxy(xco, yco);
        do {
            setlight();
            ch = await getch() & 255;
            if (ch === 0)
                switch (ch = await getch() & 255) {
                    case 72: if (yco > 1)     /* Kursor gore */ {
                        con.gotoxy(xco, --yco);
                        cur_lin = lines_back(1, cur_lin);
                        cyco--;
                        poruke(0);
                    }
                    else if (brgore) {
                        con.insline();
                        brgore = lines_back(1, brgore);
                        print_line(yco, brgore);
                        if (br_lin < dubina) br_lin++;
                        else brdole = lines_back(1, brdole);
                        cur_lin = lines_back(1, cur_lin);
                        if (light) ycol++;
                        cyco--;
                        poruke(0);
                        con.gotoxy(xco, yco);
                    }
                        break;
                    case 80: if ((yco < dubina) && (yco < br_lin)) /* Kursor dole */ {
                        con.gotoxy(xco, ++yco);
                        cur_lin = lines_forth(1, cur_lin);
                        cyco++;
                        poruke(0);
                    }
                    else if ((yco === dubina) && (brdole < duzina)) {
                        con.gotoxy(1, 1);
                        con.delline();
                        print_line(yco, brdole);
                        brdole = lines_forth(1, brdole);
                        brgore = lines_forth(1, brgore);
                        cur_lin = lines_forth(1, cur_lin);
                        if (light) ycol--;
                        cyco++;
                        poruke(0);
                        con.gotoxy(xco, yco);
                    }
                        break;
                    case 75: if (xco > 1)      /* Kursor levo */ {
                        con.gotoxy(--xco, yco);
                        poruke(0);
                    }
                        break;
                    case 71: con.gotoxy(xco = 1, yco); /* Pritisnut je HOME */
                        poruke(0);
                        break;
                    case 79: con.gotoxy(xco = get_len(), yco); /* Pritisnut je END */
                        poruke(0);
                        break;
                    case 77: if (xco < sirina) /* Kursor desno */ {
                        con.gotoxy(++xco, yco);
                        poruke(0);
                    }
                        break;
                    case 73: if (brgore)     /* Page Up */ {
                        brgore = lines_back(dubina, brgore);
                        cyco -= find_lin;
                        cur_lin = lines_back(find_lin, cur_lin);
                        brdole = printscreen(brgore);
                        if (light) poruke(1);
                        light = 0;
                    }
                    else { cur_lin = 0; cyco = yco = 1; }
                        poruke(0);
                        con.gotoxy(xco, yco);
                        break;
                    case 81: if (brdole >= duzina)     /* Page Down */ {
                        cyco += br_lin - yco;
                        cur_lin = lines_forth(br_lin - yco, cur_lin);
                        con.gotoxy(xco, yco = br_lin);
                    }
                    else {
                        brgore = brdole;
                        brdole = printscreen(brdole);
                        if (yco <= br_lin) {
                            cyco += dubina;
                            cur_lin = lines_forth(dubina, cur_lin);
                        }
                        else {
                            cyco += dubina - yco + br_lin;
                            cur_lin = lines_forth(dubina - yco + br_lin, cur_lin);
                            yco = br_lin;
                        }
                        con.gotoxy(xco, yco);
                        if (light) poruke(1);
                        light = 0;
                    }
                        poruke(0);
                        break;
                    case 83: if ((pom = SP.prev) === null) break; /* Pritisnut je DELETE */
                        con.puttext(left, up, right, down, SP.prev_win);
                        SP.prev_win = null;
                        def_win(brtxt = pom.brtxt);
                        SP = pom;
                        xco = pom.xco;
                        yco = pom.yco;
                        cyco = pom.cyco;
                        br_lin = pom.br_lin;
                        brgore = pom.brgore;
                        brdole = pom.brdole;
                        cur_lin = pom.cur_lin;
                        cur_pos = pom.cur_pos;
                        light = 0;
                        con.window(left + 1, up + 1, right - 1, down - 2);
                } /* switch */
            else if ((ch === 13) && light) {               /* Pritisnut je ENTER */
                let n1;
                /* st_light-2 pokazuje na dva bajta sa podacima o tekstu.*/
                pom = {};
                n1 = (text(st_light - 2) & 127) + ((text(st_light - 1) & 127) << 7) - 1;
                def_win(n1);
                prev_win = con.gettext(left, up, right, down);
                SP.xco = xco;
                SP.yco = yco;
                SP.cyco = cyco;
                SP.br_lin = br_lin;
                SP.brgore = brgore;
                SP.brdole = brdole;
                SP.cur_lin = cur_lin;
                SP.cur_pos = cur_pos;
                pom.brtxt = brtxt = n1;
                pom.prev_win = prev_win;
                pom.prev = SP;
                SP = pom;
                light = 0;
                okvir();
                poruke(1);
                con.window(left + 1, up + 1, right - 1, down - 2);
                brdole = printscreen(brgore = cur_lin = 0);
                con.gotoxy(xco = 1, yco = cyco = 1);
                poruke(0);
            }
            else if (ch === 9) {
                con.gotoxy(xco = ((xco + 8) > sirina) ? sirina : xco + 8, yco);
                poruke(0);
            }
        } while (ch !== 27); /* Dok se ne pritisne ESC */
        freeall(1);
        io.section?.(null);
        return 0;
    } /* hypertext2 */

    return main;
}

if (typeof module !== "undefined") module.exports = { createProgram, TextScreen, Graphics, TRIPLEX, X80 };

// ---------------------------------------------------------------------------------------------------------
// The page

if (typeof document !== "undefined") {
    const $ = id => document.getElementById(id);
    const CP437 = "ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ ";
    const PALETTE = ["#000000", "#0000aa", "#00aa00", "#00aaaa", "#aa0000", "#aa00aa", "#aa5500", "#aaaaaa",
        "#555555", "#5555ff", "#55ff55", "#55ffff", "#ff5555", "#ff55ff", "#ffff55", "#ffffff"];
    const RGB = PALETTE.map(h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
    const glyph = c => c < 32 ? " " : c < 128 ? String.fromCharCode(c) : CP437[c - 128];

    let con = new TextScreen(), gfx = new Graphics();
    let graphicsOn = false, section = null, waiting = false;

    // --- what the screen says, in English
    const EN = {
        "LOFT Eksperiment": "The LOFT Experiment",
        "'Loss Of Fluid Test'": "'Loss Of Fluid Test'",
        "1 Pomoc": "1 Help", "2 Opis": "2 Description", "3 Start": "3 Start", "0 Kraj": "0 Quit",
        "Idaho National Engeenering Laboratory, USA, April 1982.": "Idaho National Engineering Laboratory, USA, April 1982.",
        "Implementacija: A.Cirilovic (Masinski fakultet, Beograd)": "Made by: A. Ćirilović (Faculty of Mechanical Engineering, Belgrade)",
        "M.Despotovic, V.Pejovic (Matematicki fakultet, Beograd)": "M. Despotović, V. Pejović (Faculty of Mathematics, Belgrade)",
        "Mart 1995.": "March 1995.",
        "UPUTSTVO ZA KORISCENJE PROGRAMA": "HOW TO USE THE PROGRAM",
        "U meniju izaberite opciju pritiskom na odgovarajuci taster.": "In the menu, choose an option by pressing its key.",
        "Za vreme odvijanja simulacije,na raspolaganju su Vam sle-": "While the simulation runs, you have the follow-",
        "dece komande :": "ing commands:",
        "BILO KOJI TASTER  pocetak eksperimenta": "    ANY KEY         start the experiment",
        "KURSOR LEVO      usporavanje": "    CURSOR LEFT     slower",
        "KURSOR DESNO    ubrzavanje": "    CURSOR RIGHT    faster",
        "SPACE             pauza": "    SPACE           pause",
        "ENTER             ponovni pocetak": "    ENTER           start again",
        "ESC                meni (prekid)": "    ESC             menu (stop)",
        "Po zavrsetku, pritisak na bilo koji taster vraca Vas u meni.": "When it ends, any key takes you back to the menu.",
        "Na pocetku (i u toku pauze) eksperimenta,  mozete se in-": "At the start of the experiment (and while it is paused), you",
        "formisati o objektima na ekranu  pozicioniranjem strelice": "can find out about the things on the screen by pointing",
        "misa i upotrebom LEVOG tastera.  Za  zavrsetak  pregleda,": "the mouse arrow at them and pressing the LEFT button. To",
        "kliknite na 'KRAJ PREGLEDA'.  Opis eksperimenta je uradjen": "end the tour, click on 'KRAJ PREGLEDA' (END OF TOUR). The",
        "u hipertekstu cija je upotreba opisana na sledecoj strani.": "description is in hypertext, explained on the next page.",
        "bilo koji taster za nastavak...": "any key to go on...",
        "Hipertekst omogucava inteligentije pregledanje teksta.": "Hypertext lets you read a text more intelligently.",
        "Istaknute reci uvek oznacavaju slozeniji pojam.": "The highlighted words always mark a more complex term.",
        "Na raspolaganju su Vam sledece komande :": "You have the following commands:",
        "KURSORSKI TASTERI  pomeranje po tekstu": "    CURSOR KEYS     move about the text",
        "TAB                  pomera kursor za 8 mesta udesno": "    TAB             move the cursor 8 places right",
        "HOME                pomera kursor na pocetak reda": "    HOME            move the cursor to the start of the line",
        "END                  pomera kursor na kraj reda": "    END             move the cursor to the end of the line",
        "PgUp i PgDn         stranica gore/dole": "    PgUp and PgDn   a page up/down",
        "ENTER               objasnjenje oznacenog pojma": "    ENTER           explain the highlighted term",
        "DEL                  prethodni 'nivo' teksta": "    DEL             the previous 'level' of the text",
        "ESC                  povratak u meni": "    ESC             back to the menu",
        "bilo koji taster za meni...": "any key for the menu...",
    };
    const LEGEND = [
        ["KRAJ PREGLEDA", "KRAJ PREGLEDA: END OF TOUR, click it to go on"],
        ["DOGADJAJ:", "DOGADJAJ: EVENT"],
        ["SOP", "SOP: the pressurizer (sistem održavanja pritiska, the pressure maintenance system)"],
        ["SV", "SV: the safety valves"], ["RV", "RV: the relief valves"],
        ["R", "R: the reactor"], ["GP", "GP: the steam generator (generator pare)"],
        ["ka turbini", "ka turbini: to the turbine"], [" od kondenzatora", "od kondenzatora: from the condenser"],
        ["pumpa", "pumpa: pump"],
        ["SNAGA REAKTORA (MW)", "SNAGA REAKTORA (MW): REACTOR POWER (MW)"],
        ["Temperatura goriva(K)", "Temperatura goriva: fuel temperature"],
        ["Temperatura kosuljice(K)", "Temperatura košuljice: cladding temperature"],
        ["Temperatura nosioca toplote(K)", "Temperatura nosioca toplote: coolant temperature"],
    ];
    const EVENTS = {
        "Pumpa prestaje sa radom i eksperiment pocinje...": "The pump stops working, and the experiment begins...",
        "Povecava se temperatura vode u primarnom cirkulacionom krugu,raste pritisak u SOP-u.": "The water temperature rises in the primary circulation loop; the pressure in the SOP rises.",
        "Aktivira se sistem rashladnih tuseva.": "The cooling spray system comes on.",
        "Reaktor polako gubi toplotni ponor i snaga mu rapidno opada (INHERENTNA SIGURNOST).": "The reactor slowly loses its heat sink, and its power falls fast (INHERENT SAFETY).",
        "Otvaraju se otpusni rasteretni ventili.": "The pressure relief valves open.",
        "Otvaraju se sigurnosni rasteretni ventili.": "The safety relief valves open.",
        "Zatvaraju se sigurnosni rasteretni ventili.": "The safety relief valves close.",
        "Otpusni rasteretni ventili svojim ciklicnim radom obe- zbedjuju siguran oporavak...": "The pressure relief valves, opening and closing in cycles, bring about a safe recovery...",
    };
    const FLASH = { STOP: "STOP", START: "START", CIKLICNO: "CIKLIČNO: cycling" };
    const POPUPS = {
        "VREMENSKI BROJAC": ["THE TIME COUNTER", "The time counter is set to the reference zero time at the start. The experiment ends at 05:00 (300 s). It also shows how fast the simulation runs. At the start, it runs in real time, i.e. the counter goes up every second. You can change the speed with the cursor keys LEFT (slower) and RIGHT (faster)."],
        "PROZOR DOGADJANJA": ["THE EVENT WINDOW", "It lets you follow the most important changes during the simulation, in text. The text of each event lasts 5 time units."],
        "REAKTOR": ["THE REACTOR", "This reactor has a power of 50 MW (thermal power), and is an enlarged model of a commercial PWR (Pressure Water Reactor)."],
        "GRAFIK SNAGE REAKTORA": ["THE REACTOR POWER GRAPH", "This graph will show how the reactor's power changes over time. The mathematical model of this function is 3 linear equations, found by linear approximation of the experimental results. You can see these equations in the description."],
        "GRAFIK TEMPERATURE GORIVA": ["THE FUEL TEMPERATURE GRAPH", "This graph shows how the fuel temperature changes. That function is expressed by differential equations, which you can see in the description. The initial temperature of the fuel is Tg = 1001 K (which is also the fuel temperature when the reactor runs under nominal conditions (Q = 50 MW))."],
        "GRAFIK TEMPERATURE KOSULJICE": ["THE CLADDING TEMPERATURE GRAPH", "This graph shows how the cladding temperature changes. That function is expressed by differential equations, which you can see in the description. The initial temperature of the cladding is Tk = 592.3 K (which is also the cladding temperature when the reactor runs under nominal conditions (Q = 50 MW))."],
        "GRAFIK SREDNJE": ["THE MEAN COOLANT TEMPERATURE GRAPH", "This graph shows how the mean temperature (the average of the inlet and the outlet temperature) changes. That function is expressed by differential equations, which you can see in the description. The initial mean temperature of the coolant is Tnt = 566.07 (which is also the mean temperature when the reactor runs under nominal conditions (Q = 50 MW))."],
        "GENERATOR PARE": ["THE STEAM GENERATOR", "This is really a heat exchanger, which lets heat pass between the primary and the secondary loop. On its secondary side, feedwater comes in from the condenser (in the simulation, the blue pipe), and steam goes out to the turbine (the grey pipe)."],
        "SISTEM ZA ODRZAVANJE PRITISKA (SOP)": ["THE PRESSURE MAINTENANCE SYSTEM (SOP)", "The SOP is a vessel with a phase change, which, through the working of its components, keeps up the pressure in the primary circulation loop."],
        "PUMPA NAPOJNE VODE": ["THE FEEDWATER PUMP", "At the start of the experiment, this pump went out of service, which simulated the cut-off of feedwater to the steam generator."],
        "CIRKULACIONA PUMPA": ["THE CIRCULATION PUMP", ""],
        "TOPLA GRANA": ["THE HOT LEG OF THE PRIMARY CIRCULATION LOOP", ""],
        "HLADNA GRANA": ["THE COLD LEG OF THE PRIMARY CIRCULATION LOOP", ""],
        "SISTEM RASHLADNIH TUSEVA": ["THE COOLING SPRAY SYSTEM", "Through this pipe, fluid from the cold leg of the primary circulation loop reaches the cooling spray system, which is at the top of the SOP."],
        "SISTEM RASTERETNIH VENTILA": ["THE RELIEF VALVE SYSTEM", "Through it, steam is let out of the SOP, to lower the pressure. It comes on when the pressure in the SOP reaches 16.2 MPa."],
        "SISTEM SIGURNOSNIH VENTILA": ["THE SAFETY VALVE SYSTEM", "As the relief valves don't lower the pressure enough, these valves open, and through them, in this case, both water and steam flow out. It comes on when the pressure in the SOP reaches 17.3 MPa."],
    };
    const HYP_EN = [
        `THE [LOFT] L9-3 EXPERIMENT

   The L9-3 experiment was done on 7 April 1982 at the National Engineering Laboratory, Idaho, USA. The experiment [simulated a loss] of feedwater in an [ATWS] in a commercial [PWR] plant.

   The trial's initial conditions for L9-3 were: 49.1 MW reactor power, 556.7 K inlet temperature, 576.4 K outlet temperature, and 476.6 kg/s primary loop flow. In the first 60 seconds from the start of the experiment, [degraded heat transfer] from the primary to the secondary loop caused a slow rise of the reactor's inlet and outlet temperatures. As the primary fluid expanded, the level and the pressure in the [SOP] rose. Because of that, at about 30 seconds, the cooling spray system came on. After 60 seconds, the secondary water level had fallen so low that the steam generator lost the heat sink that carried the primary energy away. This caused a rapid rise of the reactor's temperatures. As the density of the [moderator] fell, feedback made the reactor's power fall ([INHERENT SAFETY]). The density of the coolant in the primary loop fell too.
   As the pressure in the SOP rose, the [relief] valves opened, which open at a pressure of 16.2 MPa. At 17.3 MPa, the [safety relief] valves opened, and that happened at 96 seconds. At almost the same time as the safety relief valves opened, the SOP filled up with water. By then, the reactor's power had fallen to about 15 MW, and the flow of the relief and the safety valves together was enough to lower the primary pressure. The safety valves closed at 107 seconds, and the relief valves alone were enough to control the pressure, opening in cycles from time to time.
   The last 200 seconds passed with the reactor's power still falling. Temperatures and pressures went back to normal, and no safety problems were recorded. The LOFT plant came through the ATWS test successfully.

THE MATHEMATICAL MODEL

The mathematical model of this simulation is three first-order differential equations. Their results (found by the Runge–Kutta method) are drawn and animated. The equations are:

   Mg · Cpg · dTg(t)/dt = Q(t) − Agk · Kgk · (Tg(t) − Tk(t))
   Mk · Cpk · dTk(t)/dt = Agk · Kgk · (Tg(t) − Tk(t)) − Aknt · Knt · (Tk(t) − Tnt(t))
   Mnt · Cpnt · dTnt(t)/dt = Aknt · Kknt · (Tk(t) − Tnt(t)) − 2 · mnt(t) · Cpnt · (Tnt(t) − Tulnt(t))

With the initial conditions Tg(0) = 1001 K, Tk(0) = 592.3 K, Tnt(0) = 566.07 K, where:

   Mg     the mass of the fuel                   1540.53 kg
   Mk     the mass of the cladding                233.57 kg
   Mnt    the mass of the coolant                 190.5  kg
   Cpg    the specific heat of the fuel           317    J/(kg·K)
   Cpk    the specific heat of the cladding       326    J/(kg·K)
   Cpnt   the specific heat of the coolant       5560.3  J/(kg·K)

In solving these equations, equations found by linear approximation of the measured results for the power, the coolant's inlet temperature and the coolant's flow were used. They are:

   POWER (MW): Q(t) = −0.051·t + 50 for 0 < t ≤ 63.9; −0.966·t + 108.39 for 63.9 < t ≤ 106.1; −0.03·t + 9.12 for 106.1 < t ≤ 300; 0 for t > 300
   COOLANT INLET TEMPERATURE (K): Tulnt(t) = 0.051·t + 556.6 for 0 < t ≤ 67; 0.316·t + 539 for 67 < t ≤ 162; 0.0126·t + 588 for t > 162
   COOLANT FLOW (kg/s): Mnt(t) = 475 − 0.0357·t for 0 < t ≤ 56; 507 − 0.607·t for 56 < t ≤ 112; 456 − 0.145·t for 112 < t ≤ 167; 432 for t > 167`,
        "ATWS: short for the English Anticipated Transient Without Scram.",
        "LOFT: short for the English Loss Of Fluid Test (testing the response to a loss of fluid).",
        "The moderator in this type of reactor is water.",
        "This term means the loss of the heat sink in the steam generator, caused by the cut-off of feedwater. This prevented the normal transfer of heat between the primary and the secondary loop in the steam generator.",
        "This was done simply by switching off the pump that feeds water into the steam generator at the start of the experiment, which stopped the cooling of the primary circulation loop.",
        "PWR: short for the English Pressurize Water Reactor (the name of a type of pressurized water reactor).",
        "SOP (the acronym of Sistem Održavanja Pritiska, the pressure maintenance system) is a vessel with a phase change, which by means of its components lowers or raises the pressure in the primary circulation loop when operation is disturbed. It consists of an [electric heater], a [cooling spray system], [relief] and [safety] valves.",
        "It isn't in the simulation, as it takes part in no phase of the experiment: its role is to heat the water when the pressure falls, which never happens in this simulation.",
        "They open as the pressure in the SOP rises, cool the steam, make it condense, and lower the pressure. They open at a pressure of 155.8 bar, and are fully open at 159.3 bar (data for the Krško nuclear plant, Slovenia – Croatia).",
        "They open as the pressure in the SOP rises, and let steam out into the relief tank. They open at a pressure of 161 bar (data for the Krško plant, Slovenia – Croatia).",
        "They are the last link in the chain of the SOP's safety components. They come on if the relief valves haven't lowered the pressure. They open at a pressure of 171 bar (data for the Krško plant, Slovenia – Croatia).",
        "[PWR] reactors have this property. In short: when the temperature of the coolant rises (in this type of reactor, it is also the moderator), the share of steam in the moderator rises. As steam moderates far less than water, the probability of causing nuclear fission falls (the neutrons aren't thermalized enough). This makes the reactor's power fall, and the reactor slowly shut down.",
    ];

    function english() {
        if (!graphicsOn) {
            if (section === null) return ["", ""];
            return [section ? "The window, in English (Del goes back)" : "The description, in English; the words in brackets are its links",
                HYP_EN[section] ?? ""];
        }
        const texts = gfx.texts, lines = [];
        const popup = texts.filter(e => e.image > 0).map(e => e.s.trim()).filter(s => s && !/^-+$/.test(s));
        const base = texts.filter(e => e.image === 0);
        if (base.some(e => e.s === "DOGADJAJ:")) {
            const ev = base.filter(e => e.x === 390).map(e => e.s).join(" ");
            // what the program waits for now, which the screen doesn't say
            const started = base.some(e => e.x === 600 && e.y === 4), over = base.some(e => e.x === 480 && e.y === 4 && e.s === "5");
            if (mouseShown) lines.push(started
                ? "Paused. Click the parts of the drawing to read about them, and KRAJ PREGLEDA at the top left when you're done; then Space goes on.\n"
                : "Click the parts of the drawing to read about them, and KRAJ PREGLEDA at the top left when you're done; then any key starts the clock.\n");
            else if (waiting) lines.push(over ? "The experiment is over: Enter runs it again, and any other key goes back to the menu.\n"
                : started ? "Space goes on, and Esc goes back to the menu; any other key shows the tour again.\n"
                    : "Press any key to start the clock, or Esc to go back to the menu.\n");
            lines.push("EVENT: " + (ev ? EVENTS[ev] ?? ev : "none now"));
            for (const e of base) if (FLASH[e.s]) lines.push(`${FLASH[e.s]} (by ${e.x < 200 && e.y < 60 ? "the safety valves" : e.x < 250 ? "the relief valves" : "the feedwater pump"})`);
            if (popup.length) { const p = POPUPS[popup[0]]; if (p) lines.push("", p[0], p[1]); }
            lines.push("", "On the drawing:");
            for (const [s, en] of LEGEND) if (base.some(e => e.s.replace(/\(C\)$/, "(K)") === s)) lines.push("  " + en);
            if (io.fixed) lines.push("  (the temperatures are in degrees Celsius)");
            return ["The screen, in English", lines.join("\n")];
        }
        for (const e of texts) { const en = EN[e.s.trim()]; if (en !== undefined) lines.push(en); }
        return ["The screen, in English", lines.join("\n")];
    }

    // --- drawing the screen
    let mouseShown = false, mx = 320, my = 240, rx1 = 0, ry1 = 0, rx2 = 639, ry2 = 479, mdown = false, mpressed = false;
    const clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;
    const ARROW = ["X", "XX", "X.X", "X..X", "X...X", "X....X", "X.....X", "X......X", "X.......X", "X........X", "X.....XXXXX", "X..X..X", "X.X X..X", "XX  X..X", "X    X..X", "     X..X", "      X..X", "      XXX"];
    const render = () => draw();
    function draw() {
        const scr = $("screen"), canvas = $("canvas");
        scr.hidden = graphicsOn;
        canvas.hidden = !graphicsOn;
        const [label, en] = english();
        $("english-label").textContent = label;
        // the English, with the laboratory linked where the menu names it, and the Krško plant where the valves'
        // windows do
        const esc = t => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const link = (url, m) => `<a href="${url}" target="_blank" rel="noopener">${m}</a>`;
        $("english").innerHTML = esc(en)
            .replace(/Idaho National Engineering Laboratory/g, m => link("https://en.wikipedia.org/wiki/Idaho_National_Laboratory", m))
            .replace(/Krško( nuclear)? plant/g, m => link("https://en.wikipedia.org/wiki/Kr%C5%A1ko_Nuclear_Power_Plant", m));
        $("english-box").hidden = !en;
        if (graphicsOn) {
            const ctx = canvas.getContext("2d"), img = ctx.createImageData(640, 480);
            for (let k = 0; k < 640 * 480; k++) { const c = RGB[gfx.px[k]]; img.data[k * 4] = c[0]; img.data[k * 4 + 1] = c[1]; img.data[k * 4 + 2] = c[2]; img.data[k * 4 + 3] = 255; }
            if (mouseShown) {
                const cx = clamp(mx, rx1, rx2), cy = clamp(my, ry1, ry2);
                ARROW.forEach((row, y) => [...row].forEach((ch, x) => {
                    if (ch === " " || cx + x > 639 || cy + y > 479) return;
                    const k = ((cy + y) * 640 + cx + x) * 4, c = ch === "X" ? 0 : 255;
                    img.data[k] = img.data[k + 1] = img.data[k + 2] = c;
                }));
            }
            ctx.putImageData(img, 0, 0);
            canvas.style.cursor = mouseShown ? "none" : "default";
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
                const isCursor = x === con.x && y === con.y;
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
    }

    // --- the keyboard: an extended key is 0 and then its scan code
    const EXT = { Home: 71, End: 79, ArrowUp: 72, ArrowDown: 80, ArrowLeft: 75, ArrowRight: 77, PageUp: 73, PageDown: 81, Delete: 83, Insert: 82 };
    const keys = [];
    let wake = null, stopFlag = false;
    const STOP = new Error("stopped");
    const press = (...codes) => { keys.push(...codes); if (wake) { const w = wake; wake = null; w(); } };
    const sleep = ms => new Promise(r => setTimeout(r, ms));

    const io = {
        get con() { return con; }, get gfx() { return gfx; },
        get fixed() { return $("fixed").checked; },
        mode(m) { graphicsOn = m === "graphics"; render(); },
        section(n) { section = n; },
        async delay(ms) {
            render();
            await sleep(ms);
            if (stopFlag) throw STOP;
        },
        kbhit() { return keys.length > 0; },
        async getch() {
            while (!keys.length) {
                if (stopFlag) throw STOP;
                waiting = true;
                render();
                await new Promise(r => { wake = r; });
                waiting = false;
            }
            if (stopFlag) throw STOP;
            return keys.shift();
        },
        // the mouse driver: a press between two of the program's looks still counts, once
        int86(n, r) {
            switch (r.ax) {
                case 0: rx1 = 0; ry1 = 0; rx2 = 639; ry2 = 479; mouseShown = false; r.ax = 0xffff; r.bx = 2; break;
                case 1: mouseShown = true; break;
                case 2: mouseShown = false; break;
                case 3: r.cx = clamp(mx, rx1, rx2); r.dx = clamp(my, ry1, ry2); r.bx = mdown || mpressed ? 1 : 0; mpressed = false; break;
                case 7: rx1 = r.cx; rx2 = r.dx; break;
                case 8: ry1 = r.cx; ry2 = r.dx; break;
            }
            render();
        },
    };

    let running = false;
    async function start() {
        stopFlag = true;
        if (wake) { const w = wake; wake = null; w(); }
        while (running) await sleep(10);
        stopFlag = false;
        keys.length = 0;
        con = new TextScreen(); gfx = new Graphics();
        graphicsOn = false; section = null; mouseShown = false; mdown = mpressed = false;
        $("status").textContent = "";
        running = true;
        let done = false;
        try {
            await createProgram(io)();
            done = true;
        } catch (e) {
            if (e !== STOP) throw e;
        }
        running = false;
        if (done && !stopFlag) {
            graphicsOn = false;
            con.cprintf("C:\\>");
            $("status").textContent = "LOFT ended. Start again to run it again.";
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
        else if (e.key === "Tab") codes = [9];
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
    const toPixels = e => {
        const r = canvasEl.getBoundingClientRect();
        mx = clamp(Math.floor((e.clientX - r.left) * 640 / r.width), 0, 639);
        my = clamp(Math.floor((e.clientY - r.top) * 480 / r.height), 0, 479);
    };
    canvasEl.addEventListener("pointermove", e => { toPixels(e); if (mouseShown) render(); });
    canvasEl.addEventListener("pointerdown", e => { if (e.button !== 0) return; toPixels(e); if (!mdown) mpressed = true; mdown = true; canvasEl.focus(); render(); });
    window.addEventListener("pointerup", e => { if (e.button === 0) mdown = false; });
    const focus = () => (graphicsOn ? canvasEl : screenEl).focus();
    for (const b of document.querySelectorAll("[data-keys]")) {
        b.addEventListener("click", () => {
            for (const part of b.dataset.keys.split(" ")) {
                if (part.startsWith("@")) press(0, EXT[part.slice(1)]);
                else if (part === "Esc") press(27);
                else if (part === "Enter") press(13);
                else if (part === "Tab") press(9);
                else if (part === "Space") press(32);
                else press(...[...part].map(ch => ch.charCodeAt(0)));
            }
            setTimeout(focus, 0);
        });
    }
    $("restart").addEventListener("click", () => { start(); focus(); });
    $("fixed").addEventListener("change", () => { start(); focus(); });

    $("source-loft").textContent = SOURCE_LOFT;
    $("source-hyper").textContent = SOURCE_HYPER;
    $("source-install").textContent = SOURCE_INSTALL;
    start();
    canvasEl.focus({ preventScroll: true });
}
