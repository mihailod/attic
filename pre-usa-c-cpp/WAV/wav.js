'use strict';

const IMAGES = {
    open: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAPCAIAAABm5AhFAAAAfElEQVR42p2Syw0AIQhEZ4yFUZql0Rl7MEFX0SXLgXDgMfyoqkiYiPSg59ck49V7zKTaUqXemzl1+1ITETMDCBjJnfHkfTYCBtB593OdsmFr9uSHHdWmPof3yetJjWRrx2WWUO3OtBbN9smo6oplmPi5Lpjf7c9zhStJ2QP5YT42MQmHIQAAAABJRU5ErkJggg==',
    go: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAPCAIAAABm5AhFAAAAYUlEQVR42r1SQQ7AIAyyxof16Txth2aE2DXbNBsXI7QqVAPQ3qO3JSy2jVjcXdnp5aqG1MnixFSnKrdWHa9FqgZz7e023r1IKuuPbqPvz8adE8/ZUGWwltsAcACVZ/v1Kx+MHT/fq8eDDQAAAABJRU5ErkJggg==',
    help: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAPCAIAAABm5AhFAAAAaUlEQVR42rWRXQ7AIAiDW+PBOHpvtj25EAb+LFnDk1oon5SETGYWTvzLVnkuwFdo1CoPAI7Cy9lRiC4YR6NFyHT4wibpGeUDeyqsSIYlt0hWSx7YUv1g82zCVd9BT7NjJB9Dpjln/zbRDS/9NaF04uMVAAAAAElFTkSuQmCC',
    about: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAPCAIAAABm5AhFAAAAa0lEQVR42rWRSw4AIQhDW+PBODo304VmQgj4S6ZhpTwplaqKSCLiTmxnyZjWYMs9VDIGADkL8GRFotE9jJHzoY3JcPgGU9VvlDVsU2GWpFvyKMlsyQss1A+YzcZd1ZPoSbmO5NFk6HP1bwt1UkZBIuZl8VEAAAAASUVORK5CYII=',
    icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAArElEQVR42u1WwQqFMAxryvv/X46nQRGcmQvMJ+tpF5c0STtBkrGwMhbXJvBtAgACwBoCAEIZsG9aoHb/PgWU0CjdPyIwC1xrZLtnBScZJK1kZAUcb9IT4vYQjjbyUzpyvdj1vnbOq5l156Di1HM65Ry1iGTkHUiVq+2JWXUqZqofnPNwJjKyfuUQ9qRrgIoaPXLp8HQmK7lq/rsWONN/d9f+Kd0E/peAa1K2BQf9qWE80713mgAAAABJRU5ErkJggg==',
    small: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAoElEQVR42o2RUQ7EIAhEh4R7rz359EMRpGCWxGAK84qMAINoY6T8Db0JyckWkRakldiEFidoVIAfgMe69x+/E1ivxbMUGJyZBNcBPB8n9fslAEzcAhwiixIeDMBGJv1+NPgTEiA1l4ATolFYL61zY4IEzKaFeZIbVV3j4EzCbeulruvLTN2bL3XdywqNbRR1/Ut4YyZj0ay/n6CzLm++q78WQX50T9mnNwAAAABJRU5ErkJggg==',
};

// ---------------------------------------------------------------------------
// The program: CWAVDoc, and CWAVView's OnFileOpen, OnGo and OnDraw.
//
// As written, data[] is followed in memory by two bytes of padding and then by
// `end`, so data[100] and data[101] land in the padding and data[102] to data[105]
// are the bytes of `end`. Past them is the rest of the heap. `mem` models all of it,
// filled at first with 0xCD, as the debug heap filled new memory.
// ---------------------------------------------------------------------------

const DATA = 100;
const END_AT = 102;               // offset of `end` from data[0]
const RUNAWAY = 100000;           // more lines than this and the drawing never ends

class WavDoc {
    constructor(fixed) {
        this.fixed = fixed;
        this.ind = 0;             // is there a selected file
        this.fileselected = '';
        this.mem = new Uint8Array(4096).fill(0xCD);
        if (fixed) {
            this.data = new Uint8Array(DATA);
            this.fixedEnd = 0;
        } else {
            for (let i = 0; i <= DATA; i++) this.mem[i] = 0;   // i <= DATA: one past the end
            // end is never set before the first Go, yet the window redraws when the Open
            // dialog closes. The program didn't crash there, so take it to be 1: nothing drawn.
            this.end = 1;
        }
    }

    get end() {
        if (this.fixed) return this.fixedEnd;
        const m = this.mem;
        return (m[END_AT] | m[END_AT + 1] << 8 | m[END_AT + 2] << 16 | m[END_AT + 3] << 24) >>> 0;
    }

    set end(v) {
        if (this.fixed) { this.fixedEnd = v; return; }
        for (let k = 0; k < 4; k++) this.mem[END_AT + k] = (v >>> (8 * k)) & 255;
    }

    datum(i) { return this.fixed ? this.data[i] : this.mem[i]; }

    // OnFileOpen, after the dialog returned OK.
    open(name) {
        this.ind = 1;
        this.fileselected = name;
    }

    // OnGo. `bytes` is the selected file's contents. Returns the message box to show,
    // if any, and what it read, for the explanation.
    go(bytes) {
        if (this.ind === 0) return { box: 'You must select a file first!' };
        return this.fixed ? this.goFixed(bytes) : this.goAsWritten(bytes);
    }

    goAsWritten(bytes) {
        const len = bytes.length >>> 0;
        const step = len < DATA ? 1 : Math.floor(len / DATA);
        let pos = 0, j = 0, buffer = 0;
        const reads = [];
        for (let i = 0; i < len; i += step) {
            if (pos < len) { buffer = bytes[pos]; reads.push(pos); pos++; }  // file.Read(&buffer, 1)
            else reads.push(-1);                                            // past the end: nothing read
            pos += step;                                                    // file.Seek(step, current)
            this.mem[j++] = buffer;                                         // pDoc->data[j++] = buffer
        }
        this.end = (j - 1) >>> 0;
        return { len, step, reads, j };
    }

    goFixed(bytes) {
        const len = bytes.length;
        const n = Math.min(DATA, len);
        const reads = [];
        for (let k = 0; k < n; k++) {
            const pos = Math.floor(k * len / n);
            this.data[k] = bytes[pos];
            reads.push(pos);
        }
        this.end = n;
        return { len, reads, j: n, box: len === 0 ? 'This file is empty.' : undefined };
    }

    // OnDraw, for a client area of w×h pixels. Returns the pen's moves as
    // [x, y] points, the first one a MoveTo, or a crash.
    draw(w, h) {
        if (this.ind !== 1) return { points: [] };
        return this.fixed ? this.drawFixed(w, h) : this.drawAsWritten(w, h);
    }

    drawAsWritten(w, h) {
        const end = this.end;
        if (end === 0) return { crash: 'divide', end };                    // rect.right / pDoc->end
        let step = Math.floor((w >>> 0) / end);
        if (step === 0) step = 1;
        if (end - 1 > RUNAWAY) return { crash: 'runaway', end, step };
        const points = [[5, Math.floor(h * this.mem[0] / 256)]];
        let x = 0;
        for (let i = 1; i < end; i++) {
            x += step;
            points.push([x, Math.floor(h * this.mem[i] / 256)]);
        }
        return { points, end, step };
    }

    drawFixed(w, h) {
        const n = this.end;
        const points = [];
        for (let k = 0; k < n; k++) {
            const x = n === 1 ? Math.floor(w / 2) : Math.round(k * (w - 1) / (n - 1));
            points.push([x, Math.round((h - 1) - this.data[k] * (h - 1) / 255)]);
        }
        return { points, end: n };
    }
}

if (typeof module !== 'undefined') {
    module.exports = { WavDoc, DATA, RUNAWAY };
}

// ---------------------------------------------------------------------------
// Sample files for the Open dialog.
// ---------------------------------------------------------------------------

function makeWav(seconds, rate, f) {
    const n = Math.round(seconds * rate);
    const b = new Uint8Array(44 + n);
    const v = new DataView(b.buffer);
    const s = (o, t) => { for (let i = 0; i < t.length; i++) b[o + i] = t.charCodeAt(i); };
    s(0, 'RIFF'); v.setUint32(4, 36 + n, true); s(8, 'WAVE');
    s(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, rate, true); v.setUint32(28, rate, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true);
    s(36, 'data'); v.setUint32(40, n, true);
    for (let i = 0; i < n; i++) b[44 + i] = Math.max(0, Math.min(255, Math.round(128 + 120 * f(i / rate))));
    return b;
}

function textBytes(t) { return new TextEncoder().encode(t); }

const SAMPLES = [
    { name: 'BELL.WAV', bytes: makeWav(1, 8000, t => Math.exp(-4 * t) * (Math.sin(2 * Math.PI * 440 * t) + 0.5 * Math.sin(2 * Math.PI * 1100 * t)) / 1.5) },
    { name: 'SLOW.WAV', bytes: makeWav(1, 8000, t => 0.8 * Math.sin(2 * Math.PI * 3 * t) * (1 - t) + 0.15 * Math.sin(2 * Math.PI * 17 * t)) },
    { name: 'NOTE.TXT', bytes: textBytes('This application allows you to see a file as a wave. Any file: a sound, a picture or a letter. This one is a short note, exactly 150 bytes long.......') },
    { name: 'ONE.TXT', bytes: textBytes('W') },
    { name: 'EMPTY.TXT', bytes: new Uint8Array(0) },
];

// ---------------------------------------------------------------------------
// The page: a Windows 98 desktop with WAV's window.
// ---------------------------------------------------------------------------

if (typeof document !== 'undefined') {
    const $ = id => document.getElementById(id);
    const desktop = $('desktop'), win = $('window'), client = $('client'), canvas = $('canvas');
    const ctx = canvas.getContext('2d');
    const fixedBox = $('fixed'), explain = $('explain'), play = $('play');
    const fmt = n => n.toLocaleString('en-US');

    let doc = new WavDoc(fixedBox.checked);
    let selected = null;          // { name, bytes }
    let lastGo = null;            // what the last Go read, for the explanation
    let crashed = false;
    let audio = null;

    document.querySelectorAll('img[data-img]').forEach(img => { img.src = IMAGES[img.dataset.img]; });
    $('source').textContent = SOURCE;

    // ---- drawing (WM_PAINT) ----

    function paint() {
        const w = client.clientWidth, h = client.clientHeight;
        const dpr = window.devicePixelRatio || 1;
        if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
            canvas.width = Math.round(w * dpr);
            canvas.height = Math.round(h * dpr);
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, w, h);
        if (crashed) return;
        const r = doc.draw(w, h);
        if (r.crash) { crash(r); return; }
        const p = r.points;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        if (p.length === 1 && doc.fixed) {
            ctx.fillStyle = '#000';
            ctx.fillRect(p[0][0] - 1, p[0][1] - 1, 3, 3);
        } else if (p.length > 1) {
            ctx.beginPath();
            ctx.moveTo(p[0][0] + 0.5, p[0][1] + 0.5);
            for (let i = 1; i < p.length; i++) ctx.lineTo(p[i][0] + 0.5, p[i][1] + 0.5);
            ctx.stroke();
        }
        if (r.end !== undefined) updateExplanation(r, w);
    }

    new ResizeObserver(paint).observe(client);

    // ---- the explanation under the window ----

    function list(reads) {
        const shown = reads.slice(0, 4).map(p => p < 0 ? 'past the end' : fmt(p));
        if (reads.length > 5) shown.push('…');
        if (reads.length > 4) shown.push(reads[reads.length - 1] < 0 ? 'past the end' : fmt(reads[reads.length - 1]));
        return shown.join(', ');
    }

    function updateExplanation(r, w) {
        if (!lastGo) {
            explain.textContent = doc.ind ? 'A file is selected: choose Start Drawing (or GO) to read it.' : 'Choose File, Open… to select a file, then Start Drawing.';
            return;
        }
        const g = lastGo;
        const lines = [];
        if (doc.fixed) {
            if (!g.len) lines.push(`${g.name} is empty, so there is nothing to draw.`);
            else {
                const size = g.len === 1 ? '1 byte' : `${fmt(g.len)} bytes`;
                const which = g.len === 1 ? 'it' : g.j === g.len ? 'all of them' : `${fmt(g.j)} of them, spread evenly`;
                lines.push(`${g.name} is ${size}. WAV read ${which}: at ${list(g.reads)}.`);
                lines.push(g.j === 1 ? 'It draws the one point in the middle of the window.'
                    : `It draws all ${fmt(g.j)} across the ${fmt(w)} pixels of the window, larger values higher.`);
            }
        } else {
            const past = g.reads.filter(p => p < 0).length;
            lines.push(`${g.name} is ${g.len === 1 ? '1 byte' : fmt(g.len) + ' bytes'}, so step = ${g.len < DATA ? '1 (the file is shorter than 100)' : `${fmt(g.len)} / 100 = ${fmt(g.step)}`}.`);
            if (g.len) {
                lines.push(`The loop ran ${fmt(g.j)} times, but each time it read a byte and then skipped ${fmt(g.step)}, moving ${fmt(g.step + 1)}: ` +
                    `it read at ${list(g.reads)}.` + (past ? ` ${past === 1 ? 'The last read was' : `The last ${fmt(past)} reads were`} past the end of the file and kept the byte before.` : ''));
            }
            if (g.j > DATA) {
                lines.push(`It stored ${fmt(g.j)} bytes in data[], which holds ${DATA}: ` +
                    (g.j === 101 ? 'data[100] went past its end, into the padding before end.'
                        : g.j === 102 ? 'data[100] and data[101] went past its end, into the padding before end.'
                        : `data[100] to data[${g.j - 1}] went past its end, over end, which was set afterwards` + (g.j > 106 ? ', and on into the heap.' : '.')));
            }
            if (r.points) {
                lines.push(`end = ${fmt(r.end)}, and the drawing stops before data[end], so it shows ${fmt(r.points.length)} point${r.points.length === 1 ? '' : 's'}` +
                    (r.points.length > 1 ? `, ${fmt(r.step)} pixel${r.step === 1 ? '' : 's'} apart (the window is ${fmt(w)} wide).` : '.') +
                    (r.end > 102 ? ' data[102] to data[105] are read back as the bytes of end itself.' : ''));
            }
        }
        explain.textContent = lines.join('\n');
    }

    // ---- commands ----

    function onGo() {
        if (crashed) return;
        if (doc.ind === 0) { messageBox('WAV', 'You must select a file first!'); return; }
        const r = doc.go(selected.bytes);
        lastGo = { ...r, name: selected.name };
        if (r.box) messageBox('WAV', r.box);
        paint();                                  // Invalidate(TRUE)
    }

    function selectFile(name, bytes, repaint = true) {
        selected = { name, bytes };
        doc.open(name);
        play.disabled = !isWav(bytes);
        play.textContent = '▶ Play ' + name;
        if (repaint) paint();                     // the window repaints when the dialog closes
    }

    function isWav(b) {
        const t = String.fromCharCode(...b.slice(0, 12));
        return t.startsWith('RIFF') && t.slice(8) === 'WAVE';
    }

    play.addEventListener('click', () => {
        if (!selected) return;
        if (audio) { audio.pause(); URL.revokeObjectURL(audio.src); }
        audio = new Audio(URL.createObjectURL(new Blob([selected.bytes], { type: 'audio/wav' })));
        audio.play().catch(() => {});
    });

    function restart() {
        crashed = false;
        doc = new WavDoc(fixedBox.checked);
        lastGo = null;
        selected = null;
        play.disabled = true;
        play.textContent = '▶ Play';
        explain.textContent = 'Choose File, Open… to select a file, then Start Drawing.';
        paint();
    }

    fixedBox.addEventListener('change', () => {
        // Start the other version with the same file, and draw it if it was drawn.
        const had = selected, went = lastGo && !crashed;
        closeMenus();
        closeDialog();
        win.hidden = false;
        $('shortcut').hidden = true;
        restart();
        if (had) {
            selectFile(had.name, had.bytes);
            if (went) onGo();
        }
    });

    // ---- dialogs ----

    let dialogClose = null;

    function showDialog(title, body, onClose) {
        closeDialog();
        const box = document.createElement('div');
        box.className = 'dialog';
        box.setAttribute('role', 'dialog');
        box.setAttribute('aria-label', title);
        box.innerHTML = `<div class="titlebar"><span class="title"></span><button class="x" aria-label="Close">×</button></div><div class="dbody"></div>`;
        box.querySelector('.title').textContent = title;
        box.querySelector('.dbody').append(body);
        const shade = document.createElement('div');
        shade.className = 'shade';
        desktop.append(shade, box);
        dialogClose = () => { shade.remove(); box.remove(); dialogClose = null; if (onClose) onClose(); };
        box.querySelector('.x').addEventListener('click', () => dialogClose());
        const first = box.querySelector('.default') || box.querySelector('button:not(.x)');
        if (first) first.focus();
        return box;
    }

    function closeDialog() { if (dialogClose) dialogClose(); }

    function button(text, fn, isDefault) {
        const b = document.createElement('button');
        b.className = 'w98' + (isDefault ? ' default' : '');
        b.textContent = text;
        b.addEventListener('click', fn);
        return b;
    }

    function messageBox(title, text, icon = 'info', onClose) {
        const body = document.createElement('div');
        body.className = 'msg';
        body.innerHTML = `<div class="msgrow"><span class="msgicon ${icon}" aria-hidden="true">${icon === 'stop' ? '✕' : 'i'}</span><p></p></div><div class="buttons"></div>`;
        body.querySelector('p').textContent = text;
        body.querySelector('.buttons').append(button('OK', () => closeDialog(), true));
        showDialog(title, body, onClose);
    }

    function about() {
        const body = document.createElement('div');
        body.className = 'about';
        body.innerHTML = `<img alt="" width="32" height="32"><div><p>Wave Version 1.0</p><p>Copyright (C) 1998 Mihailo Despotovic</p></div>`;
        body.querySelector('img').src = IMAGES.icon;
        body.append(button('OK', () => closeDialog(), true));
        showDialog('About WAV', body);
    }

    function crash(r) {
        crashed = true;
        const why = r.crash === 'divide'
            ? `end is 0, and OnDraw divides the window's width by it.`
            : `end is ${fmt(r.end)}, so OnDraw sets out to draw that many lines from the bytes past data[], reading on until it leaves the memory it owns.`;
        explain.textContent = `As written, WAV crashes here: ${why}` + (r.crash === 'runaway' ? ' It would most likely hang for a moment first.' : '') +
            ' Tick Fixed to see the fixed version.';
        setTimeout(() => messageBox('WAV', 'This program has performed an illegal operation and will be shut down.', 'stop', exitApp), 0);
    }

    // ---- the Open dialog ----

    function openDialog() {
        if (crashed) return;
        const body = document.createElement('div');
        body.className = 'open';
        body.innerHTML = `
            <div class="lookin">Look in: <span class="combo">My Documents</span></div>
            <div class="files" role="listbox" aria-label="Files"></div>
            <label class="fname">File name: <input class="field" spellcheck="false" autocomplete="off"></label>
            <div class="buttons"></div>
            <input type="file" hidden>`;
        const files = body.querySelector('.files'), field = body.querySelector('.field'), picker = body.querySelector('input[type=file]');
        let chosen = null;
        for (const s of SAMPLES) {
            const row = document.createElement('div');
            row.className = 'file';
            row.setAttribute('role', 'option');
            row.tabIndex = 0;
            row.innerHTML = `<span></span><span class="size"></span>`;
            row.firstChild.textContent = s.name;
            row.lastChild.textContent = s.bytes.length === 1 ? '1 byte' : fmt(s.bytes.length) + ' bytes';
            const pick = () => {
                files.querySelectorAll('.file').forEach(f => f.classList.remove('on'));
                row.classList.add('on');
                chosen = s;
                field.value = s.name;
            };
            row.addEventListener('click', pick);
            row.addEventListener('dblclick', () => { pick(); ok(); });
            row.addEventListener('keydown', e => { if (e.key === 'Enter') { pick(); ok(); } else if (e.key === ' ') { e.preventDefault(); pick(); } });
            files.append(row);
        }
        const ok = () => {
            const name = field.value.trim().toUpperCase();
            const s = chosen && chosen.name === name ? chosen : SAMPLES.find(x => x.name === name);
            if (!s) { if (name) picker.click(); return; }
            closeDialog();
            selectFile(s.name, s.bytes);
        };
        field.addEventListener('keydown', e => { if (e.key === 'Enter') ok(); });
        picker.addEventListener('change', async () => {
            const f = picker.files[0];
            if (!f) return;
            const bytes = new Uint8Array(await f.arrayBuffer());
            closeDialog();
            selectFile(f.name, bytes);
        });
        const btns = body.querySelector('.buttons');
        btns.append(button('Open', ok, true), button('Cancel', () => closeDialog()), button('A file of yours…', () => picker.click()));
        showDialog('Open', body);
        files.firstChild.focus();
    }

    // ---- exit and start ----

    function exitApp() {
        closeMenus();
        closeDialog();
        if (audio) audio.pause();
        win.hidden = true;
        $('shortcut').hidden = false;
        $('shortcut').focus();
    }

    $('shortcut').addEventListener('dblclick', startApp);
    $('shortcut').addEventListener('keydown', e => { if (e.key === 'Enter') startApp(); });
    $('shortcut').addEventListener('click', e => { if (e.detail === 0) startApp(); });

    function startApp() {
        $('shortcut').hidden = true;
        win.hidden = false;
        restart();
    }

    // ---- menus, toolbar and keys ----

    const COMMANDS = {
        open: openDialog,
        go: onGo,
        exit: exitApp,
        toolbar: () => {
            const tb = $('toolbar');
            tb.hidden = !tb.hidden;
            $('toolbar-check').textContent = tb.hidden ? '' : '✓';
        },
        help: () => { if (!crashed) messageBox('WAV', 'This application allows\n you to see a file as a wave.'); },
        about: () => { if (!crashed) about(); },
    };

    let openMenu = null;

    function closeMenus() {
        document.querySelectorAll('.menu.open').forEach(m => m.classList.remove('open'));
        document.querySelectorAll('.menubar > .item > button').forEach(b => b.setAttribute('aria-expanded', 'false'));
        openMenu = null;
    }

    document.querySelectorAll('.menubar > .item').forEach(item => {
        const btn = item.querySelector('button'), menu = item.querySelector('.menu');
        const show = () => {
            closeMenus();
            menu.classList.add('open');
            btn.setAttribute('aria-expanded', 'true');
            openMenu = item;
        };
        btn.addEventListener('click', e => { e.stopPropagation(); if (openMenu === item) closeMenus(); else { show(); menu.querySelector('button:not([disabled])').focus(); } });
        btn.addEventListener('mouseenter', () => { if (openMenu && openMenu !== item) show(); });
    });

    document.querySelectorAll('[data-cmd]').forEach(b => b.addEventListener('click', e => {
        e.stopPropagation();
        closeMenus();
        COMMANDS[b.dataset.cmd]();
    }));

    document.addEventListener('click', closeMenus);

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            if (openMenu) closeMenus();
            else if (dialogClose) closeDialog();
            return;
        }
        if (win.hidden || dialogClose) return;
        if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
        const k = e.key.toLowerCase();
        if (k === 'o' || k === 'g') {
            if (!win.contains(document.activeElement) && document.activeElement !== document.body) return;
            e.preventDefault();
            closeMenus();
            COMMANDS[k === 'o' ? 'open' : 'go']();
        }
    });

    restart();
}
