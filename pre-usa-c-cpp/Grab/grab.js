// GRAB — JavaScript port of GRAB.CPP (Mihailo Despotovic, March 1996)
// A DOS utility that saves the EGA/VGA graphics screen to a file and loads it back. In the 16-color
// modes, video memory is four bit planes, one bit of each pixel's color in each; the program asks the
// BIOS for the current mode (int 10h, function 0Fh), then copies the four planes, one after the other,
// from segment A000h to the file, choosing each plane with the Graphics Controller's Read Map Select
// register (port 3CEh, index 4). Loading does the reverse, choosing the plane to write with the
// Sequencer's Map Mask register (port 3C4h, index 2). The file is just the four planes, nothing else.
//
// Here the VGA card is simulated: four planes of 64 KB, the current mode, and the two registers.
// One bug: after loading, the program "restored" the Map Mask to 16 instead of 15. Only its four
// low bits choose planes, so 16 enables none, and until something set it again, writing to the
// screen changed nothing. The simulation keeps that, and the fixed version restores 15.

const MODES = {
    0x12: { name: "12h", width: 640, height: 480, size: 38400 },   // VGA640480
    0x10: { name: "10h", width: 640, height: 350, size: 28000 },   // EGAVGA640350
    0x0e: { name: "Eh", width: 640, height: 200, size: 16000 },    // EGAVGA640200
    0x0d: { name: "Dh", width: 320, height: 200, size: 8000 },     // EGAVGA320200
};
const TEXT_MODE = 0x03;

class VGA {
    constructor() {
        this.planes = [0, 1, 2, 3].map(() => new Uint8Array(65536));
        this.mode = 0x12;
        this.readMap = 0;      // Graphics Controller, index 4: Read Map Select
        this.mapMask = 0x0f;   // Sequencer, index 2: Map Mask
        this.gcIndex = 0; this.seqIndex = 0;
    }
    setMode(mode) {            // int 10h, AH=0: set the mode, which clears the screen and resets the registers
        this.mode = mode;
        for (const p of this.planes) p.fill(0);
        this.readMap = 0; this.mapMask = 0x0f;
    }
    outp(port, value) {
        if (port === 0x3ce) this.gcIndex = value;
        else if (port === 0x3cf && this.gcIndex === 4) this.readMap = value & 3;
        else if (port === 0x3c4) this.seqIndex = value;
        else if (port === 0x3c5 && this.seqIndex === 2) this.mapMask = value;
    }
    // movedata() from video memory: the plane chosen by Read Map Select
    read(offset, n) { return this.planes[this.readMap].slice(offset, offset + n); }
    // movedata() to video memory: every plane enabled in the Map Mask (only its four low bits count)
    write(offset, bytes) {
        for (let k = 0; k < 4; k++) if (this.mapMask & (1 << k)) this.planes[k].set(bytes, offset);
    }
    // a pixel, as a drawing program would put it (all four planes at once)
    pixel(x, y) {
        const m = MODES[this.mode]; if (!m) return 0;
        const byte = y * (m.width / 8) + (x >> 3), bit = 0x80 >> (x & 7);
        let c = 0;
        for (let k = 0; k < 4; k++) if (this.planes[k][byte] & bit) c |= 1 << k;
        return c;
    }
    setPixel(x, y, c) {
        x = Math.round(x); y = Math.round(y);
        const m = MODES[this.mode]; if (!m || x < 0 || y < 0 || x >= m.width || y >= m.height) return;
        const byte = y * (m.width / 8) + (x >> 3), bit = 0x80 >> (x & 7);
        for (let k = 0; k < 4; k++) {
            if (!(this.mapMask & (1 << k))) continue;   // the Map Mask decides which planes a write reaches
            if (c & (1 << k)) this.planes[k][byte] |= bit; else this.planes[k][byte] &= ~bit;
        }
    }
}

// EGA_VGA_setup(): the size of one bit plane in the current mode, or 0 if the mode isn't supported
const EGA_VGA_setup = vga => (MODES[vga.mode] ? MODES[vga.mode].size : 0);

// Save_EGA_VGA(): the four planes, one after the other; 0 if the mode isn't supported
function Save_EGA_VGA(vga, file) {
    const size = EGA_VGA_setup(vga);
    if (size === 0) return 0;
    for (let i = 0; i <= 3; i++) {
        vga.outp(0x3ce, 4);
        vga.outp(0x3cf, i);                 // prosetaj se po bit plane-ovima 0,1,2,3
        file.write(vga.read(0, size));      // kopiraj bit plane u buffer, upisi ga na disk
    }
    vga.outp(0x3ce, 4);
    vga.outp(0x3cf, 0);
    return size;
}

// Load_EGA_VGA(): plane by plane back to the screen. fread() into the same buffer each time, so if
// the file is too short, a plane gets what the buffer still held.
function Load_EGA_VGA(vga, file, fixed) {
    const size = EGA_VGA_setup(vga);
    if (size === 0) return 0;
    const buffer = new Uint8Array(size);    // malloc(); what it held first is unknown, here 0s
    for (const mask of [1, 2, 4, 8]) {
        vga.outp(0x3c4, 2);
        vga.outp(0x3c5, mask);
        buffer.set(file.read(size));
        vga.write(0, buffer);
    }
    vga.outp(0x3c4, 2);                     // restauriraj stare vrednosti registara
    vga.outp(0x3c5, fixed ? 15 : 16);
    return size;
}

const USAGE = [
    "Upotreba    : grab  -<l|s> <ime_fajla>",
    "              l - ucitaj sliku i prikazi je na ekranu",
    "              s - snimi sliku",
    "              ime_fajla - fajl u koji se snima slika",
    "Primeri     : grab -s proba (snima ekran u fajl proba)",
    "              grab -l proba (ucitava i prikazuje sliku iz fajla proba)",
    "Napomena    : Format slike je interni i nekompatibilan je sa bilo cim.",
    "Ogranicenja : Podrzani su sledeci EGA/VGA modovi:",
    "              10h(640x350x16), 12h(640x480x16), Dh(320x200x16), Eh(640x200x16).",
    "Autor       : Mihailo Despotovic (015)25-041",
].map(l => l + "\n").join("");
const LOSEIME = "Ne mogu da otvorim fajl sa tim imenom.\nProverite korektnost imena i atribute fajla.\n\n";

// main(): argv as DOS gave it (argv[0] is the program), a disk (a Map of names to bytes), and the card.
// Returns what it printed and the exit code.
function grab(argv, disk, vga, fixed = false) {
    let out = "";
    const printf = s => { out += s; };
    const argc = argv.length;
    const key = name => name.toUpperCase();   // DOS file names don't care about case
    const opt = argc > 1 ? argv[1] : "";
    if (argc !== 3 || opt[0] !== "-" || !"sSlL".includes(opt[1] || "x")) { printf(USAGE); return { out, code: 1 }; }
    if (opt[1] === "s" || opt[1] === "S") {
        const chunks = [];
        const file = { write: b => chunks.push(b) };
        disk.set(key(argv[2]), new Uint8Array(0));   // fopen(..., "wb") creates the file
        const rez = Save_EGA_VGA(vga, file);
        if (rez === 0) {
            printf("Mod nije podrzan.\n\n");
            disk.delete(key(argv[2]));               // remove(argv[2])
            printf(USAGE);
            return { out, code: 1 };
        }
        const bytes = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
        let at = 0; for (const c of chunks) { bytes.set(c, at); at += c.length; }
        disk.set(key(argv[2]), bytes);
        printf("Uradjeno.\n");
        return { out, code: 0 };
    }
    const data = disk.get(key(argv[2]));
    if (!data) { printf(LOSEIME); printf(USAGE); return { out, code: 1 }; }
    let pos = 0;
    const file = { read: n => { const b = data.slice(pos, pos + n); pos += b.length; return b; } };
    const rez = Load_EGA_VGA(vga, file, fixed);
    if (rez === 0) { printf("Mod nije podrzan.\n\n"); printf(USAGE); return { out, code: 1 }; }
    return { out, code: 0 };
}

if (typeof module !== "undefined") module.exports = { VGA, grab, MODES, TEXT_MODE, Save_EGA_VGA, Load_EGA_VGA };

// ---- UI ----

if (typeof document !== "undefined") {
    const $ = id => document.getElementById(id);
    const EGA = ["#000000", "#0000aa", "#00aa00", "#00aaaa", "#aa0000", "#aa00aa", "#aa5500", "#aaaaaa",
                 "#555555", "#5555ff", "#55ff55", "#55ffff", "#ff5555", "#ff55ff", "#ffff55", "#ffffff"];
    const RGB = EGA.map(h => [1, 3, 5].map(k => parseInt(h.slice(k, k + 2), 16)));
    const vga = new VGA();
    const disk = new Map();
    let color = 14, brush = 3;

    // the screen, and the four planes
    function render() {
        const m = MODES[vga.mode], c = $("screen"), ctx = c.getContext("2d");
        $("text-mode").hidden = !!m;
        c.hidden = !m;
        if (m) {
            if (c.width !== m.width || c.height !== m.height) { c.width = m.width; c.height = m.height; }
            const img = ctx.createImageData(m.width, m.height), d = img.data;
            for (let y = 0; y < m.height; y++) for (let x = 0; x < m.width; x++) {
                const [r, g, b] = RGB[vga.pixel(x, y)], k = 4 * (y * m.width + x);
                d[k] = r; d[k + 1] = g; d[k + 2] = b; d[k + 3] = 255;
            }
            ctx.putImageData(img, 0, 0);
        }
        for (let k = 0; k < 4; k++) {
            const pc = $("plane" + k), pctx = pc.getContext("2d");
            if (!m) { pc.width = 160; pc.height = 120; pctx.fillStyle = "#eee"; pctx.fillRect(0, 0, 160, 120); continue; }
            if (pc.width !== m.width || pc.height !== m.height) { pc.width = m.width; pc.height = m.height; }
            const img = pctx.createImageData(m.width, m.height), d = img.data, plane = vga.planes[k], bpr = m.width / 8;
            const [r, g, b] = RGB[1 << k];   // plane 0 is blue, 1 green, 2 red, 3 intensity
            for (let y = 0; y < m.height; y++) for (let x = 0; x < m.width; x++) {
                const on = plane[y * bpr + (x >> 3)] & (0x80 >> (x & 7)), q = 4 * (y * m.width + x);
                d[q] = on ? r : 255; d[q + 1] = on ? g : 255; d[q + 2] = on ? b : 255; d[q + 3] = 255;
            }
            pctx.putImageData(img, 0, 0);
        }
        $("mask").textContent = `Map Mask = ${vga.mapMask}` + (vga.mapMask & 0x0f ? "" : " (no plane can be written: drawing does nothing)");
        $("mask").className = vga.mapMask & 0x0f ? "" : "warn";
        renderDisk();
    }

    // a sample picture: color bars, circles and lines, drawn the way a program would
    function sample() {
        const m = MODES[vga.mode]; if (!m) return;
        const W = m.width, H = m.height;
        for (let c = 0; c < 16; c++) {
            const x0 = Math.round(c * W / 16), x1 = Math.round((c + 1) * W / 16);
            for (let y = 0; y < H / 4; y++) for (let x = x0; x < x1; x++) vga.setPixel(x, y, c);
        }
        const circle = (cx, cy, r, col) => { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x * (H / W * 4 / 3) ** 2 + y * y <= r * r) vga.setPixel(Math.round(cx + x), cy + y, col); };
        circle(W * 0.25, H * 0.62, H * 0.22 | 0, 9);
        circle(W * 0.5, H * 0.62, H * 0.22 | 0, 12);
        circle(W * 0.75, H * 0.62, H * 0.22 | 0, 14);
        for (let k = 0; k < W; k++) { vga.setPixel(k, Math.round(H / 4 + k * (H * 0.75 - 1) / W), 15); vga.setPixel(W - 1 - k, Math.round(H / 4 + k * (H * 0.75 - 1) / W), 10); }
    }

    // painting on the screen
    let drawing = false, last = null;
    const at = e => {
        const c = $("screen"), r = c.getBoundingClientRect();
        return [Math.floor((e.clientX - r.left) * c.width / r.width), Math.floor((e.clientY - r.top) * c.height / r.height)];
    };
    const dab = (x, y) => { const m = MODES[vga.mode]; const bx = m.width === 320 ? Math.max(1, brush >> 1) : brush, by = Math.max(1, Math.round(brush * m.height / 480)); for (let j = -by; j <= by; j++) for (let i = -bx; i <= bx; i++) vga.setPixel(x + i, y + j, color); };
    function stroke(e) {
        const [x, y] = at(e);
        if (last) { const steps = Math.max(Math.abs(x - last[0]), Math.abs(y - last[1]), 1); for (let s = 0; s <= steps; s++) dab(Math.round(last[0] + (x - last[0]) * s / steps), Math.round(last[1] + (y - last[1]) * s / steps)); }
        else dab(x, y);
        last = [x, y];
        render();
    }
    $("screen").addEventListener("pointerdown", e => { drawing = true; last = null; $("screen").setPointerCapture(e.pointerId); stroke(e); });
    $("screen").addEventListener("pointermove", e => { if (drawing) stroke(e); });
    $("screen").addEventListener("pointerup", () => { drawing = false; last = null; });

    const swatches = $("colors");
    EGA.forEach((hex, c) => {
        const b = document.createElement("button");
        b.className = "swatch" + (c === color ? " on" : "");
        b.style.background = hex;
        b.title = `Color ${c}`;
        b.addEventListener("click", () => { color = c; for (const s of swatches.children) s.classList.remove("on"); b.classList.add("on"); });
        swatches.append(b);
    });
    $("brush").addEventListener("input", () => { brush = Number($("brush").value); });

    $("mode").addEventListener("change", () => {
        vga.setMode(Number($("mode").value));
        render();
        say(`(The mode is now ${MODES[vga.mode] ? MODES[vga.mode].name : "03h, text"}: the screen is cleared.)`);
    });
    $("sample").addEventListener("click", () => { sample(); render(); });
    $("clear").addEventListener("click", () => { vga.setMode(vga.mode); render(); });

    // the DOS command line
    const TR = [
        [/^Upotreba    : grab  -<l\|s> <ime_fajla>/, "Usage       : grab  -<l|s> <file_name>"],
        [/l - ucitaj sliku i prikazi je na ekranu/, "l - load a picture and show it on the screen"],
        [/s - snimi sliku/, "s - save the picture"],
        [/ime_fajla - fajl u koji se snima slika/, "file_name - the file the picture is saved in"],
        [/^Primeri     : grab -s proba \(snima ekran u fajl proba\)/, "Examples    : grab -s proba (saves the screen in the file proba)"],
        [/grab -l proba \(ucitava i prikazuje sliku iz fajla proba\)/, "grab -l proba (loads and shows the picture from the file proba)"],
        [/^Napomena    : Format slike je interni i nekompatibilan je sa bilo cim\./, "Note        : The picture format is internal, and compatible with nothing."],
        [/^Ogranicenja : Podrzani su sledeci EGA\/VGA modovi:/, "Limits      : These EGA/VGA modes are supported:"],
        [/^Autor       :/, "Author      :"],
        [/^Ne mogu da otvorim fajl sa tim imenom\./, "I can't open a file with that name."],
        [/^Proverite korektnost imena i atribute fajla\./, "Check that the name is right, and the file's attributes."],
        [/^Mod nije podrzan\./, "The mode isn't supported."],
        [/^Ne mogu da alociram memoriju\./, "I can't allocate memory."],
        [/^Uradjeno\./, "Done."],
    ];
    const translate = t => t.split("\n").map(l => { for (const [re, en] of TR) if (re.test(l)) return l.replace(re, en); return l; }).join("\n");
    const con = $("console"), en = $("console-en");
    function say(sr, english = sr) {
        con.textContent += sr + "\n";
        en.textContent += english + "\n";
        con.scrollTop = con.scrollHeight; en.scrollTop = en.scrollHeight;
    }
    function run(line) {
        const argv = line.trim().split(/\s+/).filter(Boolean);
        if (!argv.length) { say("C:\\>"); return; }
        say("C:\\>" + line.trim());
        if (argv[0].toLowerCase() === "dir") { say(dirText(), dirText()); return; }
        if (argv[0].toLowerCase() === "cls") { con.textContent = ""; en.textContent = ""; return; }
        if (!/^grab(\.exe)?$/i.test(argv[0])) { say("Bad command or file name", "Bad command or file name (as DOS said)"); return; }
        const { out } = grab(argv, disk, vga, $("fixed").checked);
        if (out) say(out.replace(/\n$/, ""), translate(out).replace(/\n$/, ""));
        render();
    }
    $("cmd").addEventListener("keydown", e => {
        if (e.key !== "Enter") return;
        run($("cmd").value);
        $("cmd").value = "";
    });
    for (const b of document.querySelectorAll("[data-cmd]")) b.addEventListener("click", () => run(b.dataset.cmd));

    // the disk
    const dirText = () => disk.size ? [...disk].map(([n, b]) => `${n.padEnd(12)} ${String(b.length).padStart(8)}`).join("\n") : "File not found";
    function renderDisk() {
        const ul = $("disk");
        ul.replaceChildren();
        if (!disk.size) { ul.textContent = "(empty)"; return; }
        for (const [name, bytes] of disk) {
            const li = document.createElement("li");
            const a = document.createElement("button");
            a.textContent = "Download";
            a.addEventListener("click", () => {
                const link = document.createElement("a");
                link.href = URL.createObjectURL(new Blob([bytes], { type: "application/octet-stream" }));
                link.download = name;
                link.click();
                setTimeout(() => URL.revokeObjectURL(link.href), 1000);
            });
            li.append(`${name}, ${bytes.length.toLocaleString("en-US")} bytes `, a);
            ul.append(li);
        }
    }
    $("upload").addEventListener("change", async () => {
        for (const f of $("upload").files) {
            const name = f.name.replace(/[^A-Za-z0-9_.-]/g, "").toUpperCase().slice(0, 12) || "FILE";
            disk.set(name, new Uint8Array(await f.arrayBuffer()));
            say(`(${name} copied onto the disk; load it with: grab -l ${name.toLowerCase()})`);
        }
        $("upload").value = "";
        renderDisk();
    });

    $("source").textContent = SOURCE;
    sample();
    render();
    say("C:\\>grab", "C:\\>grab");
    const first = grab(["grab"], disk, vga);
    say(first.out.replace(/\n$/, ""), translate(first.out).replace(/\n$/, ""));
}
