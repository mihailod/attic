// INTRO — JavaScript port of INTRO.CPP (Mihailo Despotovic, March 16–19, 1996)
// First the 16 colors of the EGA/VGA palette, each with a sample of text in it; then, at every key
// press, a star flashes at a random spot of the 640×480 screen: its rays grow out in white, light
// gray and dark gray, it holds for a moment, and shrinks away. Esc ends it.
//
// The screen is a 640×480 grid of palette colors, drawn with the same lines the original drew
// through Borland's BGI graphics library; the star's settings are the variables at the top of
// zvezda(), which the comments invited changing, so the page lets you change them.

const W = 640, H = 480;
const BLACK = 0, LIGHTGRAY = 7, DARKGRAY = 8, WHITE = 15;
const EGA = ["#000000", "#0000aa", "#00aa00", "#00aaaa", "#aa0000", "#aa00aa", "#aa5500", "#aaaaaa",
             "#555555", "#5555ff", "#55ff55", "#55ffff", "#ff5555", "#ff55ff", "#ffff55", "#ffffff"];

// the screen: one palette index per pixel
class Screen {
    constructor() { this.px = new Uint8Array(W * H); this.color = WHITE; this.fill = WHITE; }
    setcolor(c) { this.color = c; }
    putpixel(x, y, c) { if (x >= 0 && x < W && y >= 0 && y < H) this.px[y * W + x] = c; }
    getpixel(x, y) { return x >= 0 && x < W && y >= 0 && y < H ? this.px[y * W + x] : 0; }
    clear() { this.px.fill(BLACK); }
    // BGI's line(): coordinates are ints, so C truncated the float expressions passed to it
    line(x1, y1, x2, y2) {
        x1 = Math.trunc(x1); y1 = Math.trunc(y1); x2 = Math.trunc(x2); y2 = Math.trunc(y2);
        let dx = Math.abs(x2 - x1), dy = -Math.abs(y2 - y1);
        const sx = x1 < x2 ? 1 : -1, sy = y1 < y2 ? 1 : -1;
        let err = dx + dy;
        for (;;) {
            this.putpixel(x1, y1, this.color);
            if (x1 === x2 && y1 === y2) break;
            const e2 = 2 * err;
            if (e2 >= dy) { err += dy; x1 += sx; }
            if (e2 <= dx) { err += dx; y1 += sy; }
        }
    }
    circle(xc, yc, r) {
        if (r <= 0) { this.putpixel(xc, yc, this.color); return; }
        let x = r, y = 0, err = 1 - r;
        while (x >= y) {
            for (const [a, b] of [[x, y], [y, x], [-y, x], [-x, y], [-x, -y], [-y, -x], [y, -x], [x, -y]]) this.putpixel(xc + a, yc + b, this.color);
            y++;
            if (err < 0) err += 2 * y + 1;
            else { x--; err += 2 * (y - x) + 1; }
        }
    }
    // BGI's floodfill: fills the area around (x, y) up to pixels of the border color
    floodfill(x, y, border) {
        if (this.getpixel(x, y) === border) return;
        const stack = [[x, y]], seen = new Uint8Array(W * H);
        while (stack.length) {
            const [px, py] = stack.pop();
            if (px < 0 || px >= W || py < 0 || py >= H) continue;
            const k = py * W + px;
            if (seen[k] || this.px[k] === border) continue;
            seen[k] = 1;
            this.px[k] = this.fill;
            stack.push([px + 1, py], [px - 1, py], [px, py + 1], [px, py - 1]);
        }
    }
    bar(x1, y1, x2, y2) {
        for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) this.putpixel(x, y, this.fill);
    }
    outtextxy(x, y, s) {
        for (const ch of s) {
            const g = FONT[ch];
            if (g) g.forEach((row, r) => { for (let c = 0; c < 8; c++) if (row[c] === "X") this.putpixel(x + c, y + r, this.color); });
            x += 8;
        }
    }
}

// an 8×8 font in the style of the BGI's default font, for the characters the program writes
const FONT = (() => {
    const glyphs = {
        "0": [" XXXX   ", "XX  XX  ", "XX XXX  ", "XXXXXX  ", "XXX XX  ", "XX  XX  ", " XXXX   ", "        "],
        "1": ["  XX    ", " XXX    ", "  XX    ", "  XX    ", "  XX    ", "  XX    ", "XXXXXX  ", "        "],
        "2": [" XXXX   ", "XX  XX  ", "    XX  ", "  XXX   ", " XX     ", "XX  XX  ", "XXXXXX  ", "        "],
        "3": [" XXXX   ", "XX  XX  ", "    XX  ", "  XXX   ", "    XX  ", "XX  XX  ", " XXXX   ", "        "],
        "4": ["   XXX  ", "  XXXX  ", " XX XX  ", "XX  XX  ", "XXXXXXX ", "    XX  ", "   XXXX ", "        "],
        "5": ["XXXXXX  ", "XX      ", "XXXXX   ", "    XX  ", "    XX  ", "XX  XX  ", " XXXX   ", "        "],
        "6": ["  XXX   ", " XX     ", "XX      ", "XXXXX   ", "XX  XX  ", "XX  XX  ", " XXXX   ", "        "],
        "7": ["XXXXXX  ", "XX  XX  ", "    XX  ", "   XX   ", "  XX    ", "  XX    ", "  XX    ", "        "],
        "8": [" XXXX   ", "XX  XX  ", "XX  XX  ", " XXXX   ", "XX  XX  ", "XX  XX  ", " XXXX   ", "        "],
        "9": [" XXXX   ", "XX  XX  ", "XX  XX  ", " XXXXX  ", "    XX  ", "   XX   ", " XXX    ", "        "],
        ":": ["        ", "  XX    ", "  XX    ", "        ", "        ", "  XX    ", "  XX    ", "        "],
        "P": ["XXXXXX  ", " XX  XX ", " XX  XX ", " XXXXX  ", " XX     ", " XX     ", "XXXX    ", "        "],
        "M": ["XX   XX ", "XXX XXX ", "XXXXXXX ", "XXXXXXX ", "XX X XX ", "XX   XX ", "XX   XX ", "        "],
        "D": ["XXXXX   ", " XX XX  ", " XX  XX ", " XX  XX ", " XX  XX ", " XX XX  ", "XXXXX   ", "        "],
        "r": ["        ", "        ", "XX XXX  ", " XXX XX ", " XX  XX ", " XX     ", "XXXX    ", "        "],
        "i": ["  XX    ", "        ", " XXX    ", "  XX    ", "  XX    ", "  XX    ", " XXXX   ", "        "],
        "m": ["        ", "        ", "XX  XX  ", "XXXXXXX ", "XXXXXXX ", "XX X XX ", "XX   XX ", "        "],
        "e": ["        ", "        ", " XXXX   ", "XX  XX  ", "XXXXXX  ", "XX      ", " XXXX   ", "        "],
        "t": ["   X    ", "  XX    ", " XXXXX  ", "  XX    ", "  XX    ", "  XX X  ", "   XX   ", "        "],
        "k": ["XXX     ", " XX     ", " XX  XX ", " XX XX  ", " XXXX   ", " XX XX  ", "XXX  XX ", "        "],
        "s": ["        ", "        ", " XXXXX  ", "XX      ", " XXXX   ", "    XX  ", "XXXXX   ", "        "],
        "a": ["        ", "        ", " XXXX   ", "    XX  ", " XXXXX  ", "XX  XX  ", " XXX XX ", "        "],
        "h": ["XXX     ", " XX     ", " XX XX  ", " XXX XX ", " XX  XX ", " XX  XX ", "XXX  XX ", "        "],
        "l": [" XXX    ", "  XX    ", "  XX    ", "  XX    ", "  XX    ", "  XX    ", " XXXX   ", "        "],
        "o": ["        ", "        ", " XXXX   ", "XX  XX  ", "XX  XX  ", "XX  XX  ", " XXXX   ", "        "],
        "p": ["        ", "        ", "XX XXX  ", " XX  XX ", " XX  XX ", " XXXXX  ", " XX     ", "XXXX    "],
        "v": ["        ", "        ", "XX  XX  ", "XX  XX  ", "XX  XX  ", " XXXX   ", "  XX    ", "        "],
        "c": ["        ", "        ", " XXXX   ", "XX  XX  ", "XX      ", "XX  XX  ", " XXXX   ", "        "],
        " ": ["        ", "        ", "        ", "        ", "        ", "        ", "        ", "        "],
    };
    return glyphs;
})();

// paleta(): the 16 colors, their numbers, and a sample text in each
function paleta(g) {
    for (let i = 0; i <= 15; i++) {
        const str = String(i).padStart(2, "0");
        g.fill = i;
        g.setcolor(WHITE);
        g.outtextxy(20, 23 + 15 * i, str);
        g.bar(40, 20 + 15 * i, 200, 30 + 15 * i);
        g.setcolor(i);
        g.outtextxy(220, 23 + 15 * i, "Primer teksta : Mihailo Despotovic");
    }
}

// the settings at the top of zvezda(), with the values of 1996
const DEFAULTS = {
    r: 0,           // poluprecnik zvezde (moze i 0)
    xpom: 1.0,      // mnozilac za horizontalni poluprecnik eksplozije
    ypom: 1.0,      // mnozilac za vertikalni poluprecnik eksplozije
    d0: 1,          // mnozilac za bele svetlosne zrake
    d1: 3,          // mnozilac za svetlo sive svetlosne zrake
    d2: 6,          // mnozilac za sivi svetlosni zrak
    velicina: 20,   // koliko puta (broj frame-ova) se uvecava i smanjuje
    fadein: 2,      // pauza pri animaciji uvecavanja
    pause: 400,     // pauza izmedju vrhunca i smanjivanja
    fadeout: 30,    // pauza pri animaciji smanjivanja
    tip: 3,         // tip zvezde (moze biti 1,2 ili 3)
    random: true,   // x i y koordinate slucajne (inace sredina ekrana)
};

// zvezda(): one star. A generator that yields the milliseconds of each delay() and sound(),
// so the caller can show the screen and wait.
function* zvezda(g, s, rnd) {
    let xstart = 320, ystart = 240;                  // sredina ekrana
    const { r, xpom, ypom, d0, d1, d2, velicina, fadein, pause, fadeout, tip } = s;
    const bzvezde = WHITE, b1 = LIGHTGRAY, b2 = DARKGRAY;
    const duz_zvuka = 0;                              // the sound lasted 0 ms: silent
    if (s.random) {
        xstart = 200 + rnd(220);
        ystart = 100 + rnd(190);
    }
    g.setcolor(bzvezde);
    g.circle(xstart, ystart, r);
    g.fill = bzvezde;
    g.floodfill(xstart, ystart, bzvezde);
    for (let i = 1; i <= velicina; i++) {
        yield fadein;
        g.setcolor(bzvezde);
        g.line(xstart, ystart, xstart - d0 * i * xpom, ystart);
        g.line(xstart, ystart, xstart + d0 * i * xpom, ystart);
        g.line(xstart, ystart, xstart, ystart - d0 * i * ypom);
        g.line(xstart, ystart, xstart, ystart + d0 * i * ypom);
        if (tip > 1) {
            g.line(xstart, ystart + 1, xstart - d0 * i * xpom, ystart + 1);
            g.line(xstart, ystart + 1, xstart + d0 * i * xpom, ystart + 1);
            g.line(xstart + 1, ystart, xstart + 1, ystart - d0 * i * ypom);
            g.line(xstart + 1, ystart, xstart + 1, ystart + d0 * i * ypom);
        }
        if (tip === 3) {
            g.line(xstart, ystart - 1, xstart - d0 * i * xpom, ystart - 1);
            g.line(xstart, ystart - 1, xstart + d0 * i * xpom, ystart - 1);
            g.line(xstart - 1, ystart, xstart - 1, ystart - d0 * i * ypom);
            g.line(xstart - 1, ystart, xstart - 1, ystart + d0 * i * ypom);
        }
        g.setcolor(b1);
        g.line(xstart - d0 * i * xpom, ystart, xstart - d1 * i * xpom, ystart);
        g.line(xstart + d0 * i * xpom, ystart, xstart + d1 * i * xpom, ystart);
        g.line(xstart, ystart - d0 * i * ypom, xstart, ystart - d1 * i * ypom);
        g.line(xstart, ystart + d0 * i * ypom, xstart, ystart + d1 * i * ypom);
        if (tip !== 1) {
            g.line(xstart - d0 * i * xpom, ystart + 1, xstart - d1 * i * xpom, ystart + 1);
            g.line(xstart + d0 * i * xpom, ystart + 1, xstart + d1 * i * xpom, ystart + 1);
            g.line(xstart + 1, ystart - d0 * i * ypom, xstart + 1, ystart - d1 * i * ypom);
            g.line(xstart + 1, ystart + d0 * i * ypom, xstart + 1, ystart + d1 * i * ypom);
        }
        g.setcolor(b2);
        g.line(xstart - d1 * i * xpom, ystart, xstart - d2 * i * xpom, ystart);
        g.line(xstart + d1 * i * xpom, ystart, xstart + d2 * i * xpom, ystart);
        g.line(xstart, ystart - d1 * i * ypom, xstart, ystart - d2 * i * ypom);
        g.line(xstart, ystart + d1 * i * ypom, xstart, ystart + d2 * i * ypom);
    }
    yield duz_zvuka;                // sound(frek); delay(duz_zvuka); nosound();
    yield pause - duz_zvuka;
    for (let i = velicina; i >= 4; i--) {
        yield fadeout;
        g.setcolor(bzvezde);
        g.line(xstart, ystart, xstart - d0 * i * xpom, ystart);
        g.line(xstart, ystart, xstart + d0 * i * xpom, ystart);
        g.line(xstart, ystart, xstart, ystart - d0 * i * ypom);
        g.line(xstart, ystart, xstart, ystart + d0 * i * ypom);
        if (tip > 1) {
            g.line(xstart, ystart + 1, xstart - d0 * i * xpom, ystart + 1);
            g.line(xstart, ystart + 1, xstart + d0 * i * xpom, ystart + 1);
            g.line(xstart + 1, ystart, xstart + 1, ystart - d0 * i * ypom);
            g.line(xstart + 1, ystart, xstart + 1, ystart + d0 * i * ypom);
        }
        if (tip === 3) {
            g.line(xstart, ystart - 1, xstart - d0 * i * xpom, ystart - 1);
            g.line(xstart, ystart - 1, xstart + d0 * i * xpom, ystart - 1);
            g.line(xstart - 1, ystart, xstart - 1, ystart - d0 * i * ypom);
            g.line(xstart - 1, ystart, xstart - 1, ystart + d0 * i * ypom);
        }
        g.setcolor(b1);
        g.line(xstart - d0 * i * xpom, ystart, xstart - d1 * i * xpom, ystart);
        g.line(xstart + d0 * i * xpom, ystart, xstart + d1 * i * xpom, ystart);
        g.line(xstart, ystart - d0 * i * ypom, xstart, ystart - d1 * i * ypom);
        g.line(xstart, ystart + d0 * i * ypom, xstart, ystart + d1 * i * ypom);
        if (tip !== 1) {
            g.line(xstart - d0 * i * xpom, ystart + 1, xstart - d1 * i * xpom, ystart + 1);
            g.line(xstart + d0 * i * xpom, ystart + 1, xstart + d1 * i * xpom, ystart + 1);
            g.line(xstart + 1, ystart - d0 * i * ypom, xstart + 1, ystart - d1 * i * ypom);
            g.line(xstart + 1, ystart + d0 * i * ypom, xstart + 1, ystart + d1 * i * ypom);
        }
        g.setcolor(b2);
        g.line(xstart - d1 * i * xpom, ystart, xstart - d2 * i * xpom, ystart);
        g.line(xstart + d1 * i * xpom, ystart, xstart + d2 * i * xpom, ystart);
        g.line(xstart, ystart - d1 * i * ypom, xstart, ystart - d2 * i * ypom);
        g.line(xstart, ystart + d1 * i * ypom, xstart, ystart + d2 * i * ypom);
        g.setcolor(BLACK);
        g.line(xstart - d1 * i * xpom, ystart + 1, xstart - d2 * (i + 1) * xpom, ystart + 1);
        g.line(xstart + d1 * i * xpom, ystart + 1, xstart + d2 * (i + 1) * xpom, ystart + 1);
        g.line(xstart + 1, ystart - d1 * i * ypom, xstart + 1, ystart - d2 * (i + 1) * ypom);
        g.line(xstart + 1, ystart + d1 * i * ypom, xstart + 1, ystart + d2 * (i + 1) * ypom);
        g.line(xstart - d2 * i * xpom, ystart, xstart - d2 * (i + 1) * xpom, ystart);
        g.line(xstart + d2 * i * xpom, ystart, xstart + d2 * (i + 1) * xpom, ystart);
        g.line(xstart, ystart - d2 * i * ypom, xstart, ystart - d2 * (i + 1) * ypom);
        g.line(xstart, ystart + d2 * i * ypom, xstart, ystart + d2 * (i + 1) * ypom);
        g.line(xstart - d0 * i * xpom, ystart - 1, xstart - d1 * i * xpom, ystart - 1);
        g.line(xstart + d0 * i * xpom, ystart - 1, xstart + d1 * i * xpom, ystart - 1);
        g.line(xstart - 1, ystart - d0 * i * ypom, xstart - 1, ystart - d1 * i * ypom);
        g.line(xstart - 1, ystart + d0 * i * ypom, xstart - 1, ystart + d1 * i * ypom);
    }
}

if (typeof module !== "undefined") module.exports = { Screen, zvezda, paleta, DEFAULTS, W, H };

// ---- UI ----

if (typeof document !== "undefined") {
    const $ = id => document.getElementById(id);
    const canvas = $("screen"), ctx = canvas.getContext("2d");
    const image = ctx.createImageData(W, H);
    const RGB = EGA.map(h => [1, 3, 5].map(k => parseInt(h.slice(k, k + 2), 16)));
    const g = new Screen();

    function show() {
        const d = image.data;
        for (let k = 0; k < W * H; k++) {
            const [r, gr, b] = RGB[g.px[k]];
            d[4 * k] = r; d[4 * k + 1] = gr; d[4 * k + 2] = b; d[4 * k + 3] = 255;
        }
        ctx.putImageData(image, 0, 0);
    }

    // keys, as getch() saw them: queued while the program is busy
    const keys = [];
    let wake = null;
    const press = k => { keys.push(k); if (wake) { const w = wake; wake = null; w(); } };
    const getch = async () => {
        while (!keys.length) await new Promise(r => { wake = r; });
        return keys.shift();
    };
    const sleep = ms => new Promise(r => setTimeout(r, ms));

    function settings() {
        const s = {};
        for (const [k, v] of Object.entries(DEFAULTS)) {
            const el = $("s-" + k);
            s[k] = typeof v === "boolean" ? el.checked : Number(el.value);
        }
        return s;
    }
    const slow = () => Number($("slow").value);

    let run = 0;
    async function main() {
        const me = ++run;
        keys.length = 0;
        $("dos").hidden = true;
        canvas.hidden = false;
        g.clear();
        paleta(g);
        show();
        setStatus("The palette. Press a key. / Paleta. Pritisnite taster.");
        await getch();
        if (me !== run) return;
        g.clear();                           // clearviewport()
        show();
        setStatus("A blank screen. Press a key for the first star.");
        await getch();
        if (me !== run) return;
        setStatus("Every key makes a star; Esc ends. / Svaki taster pravi zvezdu; Esc je kraj.");
        do {
            const star = zvezda(g, settings(), n => Math.floor(Math.random() * n));
            for (const ms of star) {
                show();
                await sleep(ms * slow());
                if (me !== run) return;
            }
            g.clear();                       // clearviewport()
            show();
            if ($("auto").checked && !keys.length) press("auto");
        } while ((await getch()) !== "Escape" && me === run);
        if (me !== run) return;
        // restorecrtmode(): back to the text screen the program was started from
        canvas.hidden = true;
        $("dos").hidden = false;
        setStatus("");
    }
    const setStatus = t => { $("status").textContent = t; };

    canvas.addEventListener("keydown", e => {
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        e.preventDefault();
        press(e.key === "Escape" ? "Escape" : "key");
    });
    canvas.addEventListener("click", () => { canvas.focus(); press("key"); });
    $("key").addEventListener("click", () => press("key"));
    $("esc").addEventListener("click", () => press("Escape"));
    $("again").addEventListener("click", () => { main(); canvas.focus(); });
    $("defaults").addEventListener("click", () => {
        for (const [k, v] of Object.entries(DEFAULTS)) {
            const el = $("s-" + k);
            if (typeof v === "boolean") el.checked = v; else el.value = v;
        }
    });
    $("auto").addEventListener("change", () => { if ($("auto").checked) press("auto"); });
    $("source").textContent = SOURCE;
    main();
}
