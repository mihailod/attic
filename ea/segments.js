// Merging Line Segments — JavaScript version of my answer to the Electronic Arts Java interview
// problem (Mihailo Despotovic, August 2005): sort line segments on the number line and merge every
// group that overlaps or touches end to end, e.g. (1,3), (2,4), (4,5) ==> (1,5).
// The input is left unchanged; the result is a new, sorted list.

function mergeAndSort(segments) {
    if (segments == null) return null;
    const sorted = segments.map(s => ({ begin: s.begin, end: s.end }))
        .sort((a, b) => a.begin - b.begin || a.end - b.end);
    const result = [];
    for (const s of sorted) {
        const last = result[result.length - 1];
        if (last && s.begin <= last.end) last.end = Math.max(last.end, s.end); // overlaps or touches
        else result.push(s);
    }
    return result;
}

// "(1,3), (2,4), (4,5)" or "1 3 2 4 4 5" -> segments; a segment written backwards is turned around
function parseSegments(text) {
    const numbers = (text.match(/-?\d+(\.\d+)?/g) || []).map(Number);
    if (numbers.length % 2 !== 0) throw new Error("Every segment needs two numbers, a begin point and an end point.");
    const segments = [];
    for (let i = 0; i < numbers.length; i += 2) {
        segments.push({ begin: Math.min(numbers[i], numbers[i + 1]), end: Math.max(numbers[i], numbers[i + 1]) });
    }
    return segments;
}

const format = segments => segments.map(s => `(${s.begin}, ${s.end})`).join(", ");

// ---- UI ----

const $ = id => document.getElementById(id);
const SVG = "http://www.w3.org/2000/svg";

// The input segments one per row, then the merged result, on a shared number line
function drawNumberLine(input, merged) {
    const svg = $("line");
    svg.replaceChildren();
    if (input.length === 0) { svg.hidden = true; return; }
    svg.hidden = false;

    const W = 640, left = 30, right = W - 30, rowH = 16, gap = 8;
    const lo = Math.min(...input.map(s => s.begin)), hi = Math.max(...input.map(s => s.end));
    const pad = Math.max(1, (hi - lo) * 0.05);
    const x = v => left + (v - (lo - pad)) / ((hi + pad) - (lo - pad)) * (right - left);
    const resultY = 12 + input.length * rowH + gap * 2;
    const axisY = resultY + rowH + 10;
    const H = axisY + 28;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);

    const add = (tag, attrs, text) => {
        const el = document.createElementNS(SVG, tag);
        for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
        if (text !== undefined) el.textContent = text;
        svg.append(el);
        return el;
    };
    const bar = (s, y, cls) => {
        const x1 = x(s.begin), x2 = x(s.end);
        add("line", { x1, y1: y, x2: Math.max(x2, x1 + 0.01), y2: y, class: cls });
        add("circle", { cx: x1, cy: y, r: 3.5, class: cls + "-end" });
        add("circle", { cx: x2, cy: y, r: 3.5, class: cls + "-end" });
    };

    input.forEach((s, i) => bar(s, 12 + i * rowH, "seg"));
    add("text", { x: 4, y: resultY + 4, class: "label" }, "=");
    merged.forEach(s => bar(s, resultY, "merged"));

    // axis with about 10 evenly spaced ticks at round numbers
    add("line", { x1: left, y1: axisY, x2: right, y2: axisY, class: "axis" });
    const span = (hi + pad) - (lo - pad);
    const raw = span / 10, mag = 10 ** Math.floor(Math.log10(raw));
    const step = [1, 2, 5, 10].map(m => m * mag).find(s => s >= raw);
    for (let t = Math.ceil((lo - pad) / step) * step; t <= hi + pad; t += step) {
        const tx = x(t), label = Number(t.toFixed(10));
        add("line", { x1: tx, y1: axisY, x2: tx, y2: axisY + 5, class: "axis" });
        add("text", { x: tx, y: axisY + 18, class: "tick" }, label);
    }
}

function run() {
    const out = $("result");
    try {
        const input = parseSegments($("input").value);
        const merged = mergeAndSort(input);
        out.textContent = input.length === 0 ? "No segments." : format(merged);
        out.classList.remove("error");
        drawNumberLine(input, merged);
    } catch (err) {
        out.textContent = err.message;
        out.classList.add("error");
        drawNumberLine([], []);
    }
}

$("form").addEventListener("submit", e => { e.preventDefault(); run(); });
for (const button of document.querySelectorAll("[data-example]")) {
    button.addEventListener("click", () => {
        $("input").value = button.dataset.example;
        run();
    });
}
run();
