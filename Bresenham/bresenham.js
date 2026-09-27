// Bresenham's Line Algorithm — JavaScript port of Bresenham.java (Mihailo Despotovic, February 2011)
// Which pixels should light up to draw a straight line between two pixels? The 2011 version solves
// the one basic case, lines going right and rising at most 45° (one of the eight octants), on the
// assumption that the other seven are mirror images of it: swap the ends, flip y, or swap x and y,
// draw, and mirror the pixels back. It walks x from one end to the other, keeps the error between
// the true line and the current pixel row as a floating-point number, and steps y whenever the
// error reaches half a pixel.
// The page shows it as written (other directions drawn without mirroring come out wrong), with
// the mirroring added (correct in every direction), and as the integer-only version, Bresenham's
// real trick, which handles all eight directions without mirroring.

// ---- the algorithms: each returns the pixels plotted and the steps, for the table ----

// the 2011 version, as written
function line2011(x0, y0, x1, y1) {
    const pixels = [], steps = [];
    const deltax = x1 - x0;
    const deltay = y1 - y0;
    let error = 0;
    const deltaErr = deltay / deltax;
    let y = y0;
    for (let x = x0; x <= x1; x++) {
        pixels.push([x, y]);
        error = error + deltaErr;
        let stepped = false;
        if (Math.abs(error) >= 0.5) {
            y = y + 1;
            error = error - 1.0;
            stepped = true;
        }
        steps.push({ x, y: pixels[pixels.length - 1][1], note: `error = ${fmt(error + (stepped ? 1 : 0))}` + (stepped ? ` ≥ 0.5 → y + 1, error = ${fmt(error)}` : "") });
    }
    return { pixels, steps };
}

// the 2011 version with the mirroring it assumed: move the line into the basic octant, draw it
// there, and mirror the pixels back
function line2011Mirrored(x0, y0, x1, y1) {
    const steep = Math.abs(y1 - y0) > Math.abs(x1 - x0);
    const swapXY = ([x, y]) => (steep ? [y, x] : [x, y]);
    let [p0, p1] = [swapXY([x0, y0]), swapXY([x1, y1])];
    const reversed = p0[0] > p1[0];
    if (reversed) [p0, p1] = [p1, p0];
    const flipY = p1[1] < p0[1];
    const flip = ([x, y]) => (flipY ? [x, -y] : [x, y]);
    [p0, p1] = [flip(p0), flip(p1)];

    const { pixels, steps } = line2011(p0[0], p0[1], p1[0], p1[1]);
    const back = p => swapXY(flip(p)); // both mirrorings undo themselves
    const outPixels = pixels.map(back);
    const outSteps = steps.map(st => {
        const [x, y] = back([st.x, st.y]);
        return { x, y, note: st.note };
    });
    if (reversed) {
        outPixels.reverse();
        outSteps.reverse();
    }
    const how = [steep && "x and y swapped", reversed && "ends swapped", flipY && "y flipped"].filter(Boolean);
    if (how.length) outSteps.unshift({ x: x0, y: y0, note: `mirrored into the basic direction: ${how.join(", ")}; the errors below are in that mirrored line` });
    return { pixels: outPixels, steps: outSteps };
}

// Bresenham's full algorithm: every direction without mirroring, integer arithmetic only
function lineFixed(x0, y0, x1, y1) {
    const pixels = [], steps = [];
    const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
    const dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
    let err = dx + dy; // error of the next pixel, scaled by 2 · dx · dy so it stays an integer
    let x = x0, y = y0;
    for (;;) {
        pixels.push([x, y]);
        if (x === x1 && y === y1) {
            steps.push({ x, y, note: `err = ${err}, done` });
            break;
        }
        const e2 = 2 * err;
        const moves = [];
        if (e2 >= dy) { err += dy; x += sx; moves.push(sx > 0 ? "x + 1" : "x − 1"); }
        if (e2 <= dx) { err += dx; y += sy; moves.push(sy > 0 ? "y + 1" : "y − 1"); }
        steps.push({ x: pixels[pixels.length - 1][0], y: pixels[pixels.length - 1][1], note: `2·err = ${e2} → ${moves.join(", ")}, err = ${err}` });
    }
    return { pixels, steps };
}

// What is wrong with a set of pixels for the line from (x0, y0) to (x1, y1): it must start at A,
// end at B, have one pixel per step along the longer axis, with each pixel touching the previous one,
// and stay within half a pixel of the true line. At exact ties either pixel is right.
function lineProblems(pixels, x0, y0, x1, y1) {
    if (pixels.length === 0) return ["nothing is plotted: the loop only runs from left to right"];
    const problems = [];
    const dx = x1 - x0, dy = y1 - y0;
    const last = pixels[pixels.length - 1];
    if (last[0] !== x1 || last[1] !== y1) problems.push("the line doesn’t reach B");
    if (pixels.some(([x, y], i) => i > 0 && (Math.abs(x - pixels[i - 1][0]) > 1 || Math.abs(y - pixels[i - 1][1]) > 1))) {
        problems.push("there are gaps");
    }
    const far = pixels.some(([x, y]) => {
        const d = Math.abs(dx) >= Math.abs(dy)
            ? Math.abs(y - (dx === 0 ? y0 : y0 + dy * (x - x0) / dx))
            : Math.abs(x - (x0 + dx * (y - y0) / dy));
        return d > 0.5 + 1e-9;
    });
    if (far) problems.push("it strays from the true line");
    if (problems.length === 0 && pixels.length !== Math.max(Math.abs(dx), Math.abs(dy)) + 1) problems.push("wrong number of pixels");
    return problems;
}

function fmt(v) {
    if (!Number.isFinite(v)) return String(v);
    return Number(v.toFixed(3)).toString();
}

if (typeof module !== "undefined") module.exports = { line2011, line2011Mirrored, lineFixed, lineProblems };

// ---- UI ----

if (typeof document !== "undefined") {
    const $ = id => document.getElementById(id);
    const COLS = 25, ROWS = 15;
    const canvas = $("grid");
    const ctx = canvas.getContext("2d");
    let a = [0, 0], b = [5, 2];   // the 2011 example
    let dragging = null;
    let cell = 24;

    const PRESETS = {
        example: [[0, 0], [5, 2]],
        shallow: [[1, 2], [23, 10]],
        steep: [[3, 1], [9, 13]],
        down: [[2, 12], [21, 4]],
        backwards: [[21, 3], [3, 10]],
        vertical: [[12, 2], [12, 12]],
    };

    function resize() {
        const width = Math.min(canvas.parentElement.clientWidth, 750);
        cell = Math.floor(width / COLS);
        const dpr = window.devicePixelRatio || 1;
        canvas.style.width = cell * COLS + "px";
        canvas.style.height = cell * ROWS + "px";
        canvas.width = cell * COLS * dpr;
        canvas.height = cell * ROWS * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        draw();
    }

    // grid coordinates have y going up, with (0, 0) in the bottom-left corner
    const toScreen = (x, y) => [x * cell + cell / 2, (ROWS - 1 - y) * cell + cell / 2];

    function draw() {
        const mode = document.querySelector('input[name="mode"]:checked').id;
        const asWritten = mode === "original";
        const { pixels, steps } = { original: line2011, mirrored: line2011Mirrored, fixed: lineFixed }[mode](a[0], a[1], b[0], b[1]);
        const W = cell * COLS, H = cell * ROWS;

        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, W, H);

        // lit pixels
        let offGrid = 0;
        ctx.fillStyle = mode === "fixed" ? "#0645ad" : "#d9731f";
        for (const [x, y] of pixels) {
            if (x < 0 || x >= COLS || y < 0 || y >= ROWS) { offGrid++; continue; }
            const [sx, sy] = toScreen(x, y);
            ctx.fillRect(sx - cell / 2 + 1, sy - cell / 2 + 1, cell - 2, cell - 2);
        }

        // grid lines
        ctx.strokeStyle = "#ddd";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i <= COLS; i++) { ctx.moveTo(i * cell + 0.5, 0); ctx.lineTo(i * cell + 0.5, H); }
        for (let j = 0; j <= ROWS; j++) { ctx.moveTo(0, j * cell + 0.5); ctx.lineTo(W, j * cell + 0.5); }
        ctx.stroke();

        // the true line
        const [ax, ay] = toScreen(...a), [bx, by] = toScreen(...b);
        ctx.strokeStyle = "#c00";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();

        // the endpoints
        for (const [[px, py], label] of [[[ax, ay], "A"], [[bx, by], "B"]]) {
            ctx.fillStyle = "#fff";
            ctx.strokeStyle = "#000";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(px, py, cell * 0.38, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = "#000";
            ctx.font = `600 ${Math.round(cell * 0.45)}px system-ui, sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(label, px, py + 1);
        }

        // what went wrong, for the 2011 version
        const problems = lineProblems(pixels, a[0], a[1], b[0], b[1]);
        if (offGrid) problems.push(`${offGrid} pixel${offGrid > 1 ? "s" : ""} fell off the grid`);
        $("coords").textContent = `A (${a[0]}, ${a[1]})  →  B (${b[0]}, ${b[1]})`;
        const dx = b[0] - a[0], dy = b[1] - a[1];
        const basic = dx >= 0 && dy >= 0 && dy <= dx;
        $("verdict").textContent = problems.length
            ? (asWritten ? "Not the basic direction, so it needs mirroring. Drawn as is: " : "Wrong: ") + problems.join("; ") + "."
            : asWritten ? (basic ? "The basic direction: going right, rising at most 45°." : "")
            : "";
        $("verdict").className = problems.length ? "bad" : "good";
        $("pixels").textContent = pixels.length
            ? pixels.map(([x, y]) => `(${x}, ${y})`).join(" ")
            : "(none)";
        $("steps").textContent = steps.map(s => `(${s.x}, ${s.y})  ${s.note}`).join("\n") || "The loop never runs.";
    }

    function cellAt(e) {
        const r = canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - r.left) / cell);
        const y = ROWS - 1 - Math.floor((e.clientY - r.top) / cell);
        return [Math.max(0, Math.min(COLS - 1, x)), Math.max(0, Math.min(ROWS - 1, y))];
    }

    const dist2 = (p, q) => (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2;

    // press anywhere: the nearer endpoint jumps there and follows the pointer
    canvas.addEventListener("pointerdown", e => {
        const c = cellAt(e);
        dragging = dist2(c, a) <= dist2(c, b) ? "a" : "b";
        canvas.setPointerCapture(e.pointerId);
        move(c);
    });
    canvas.addEventListener("pointermove", e => { if (dragging) move(cellAt(e)); });
    canvas.addEventListener("pointerup", () => { dragging = null; });
    canvas.addEventListener("pointercancel", () => { dragging = null; });

    function move(c) {
        const p = dragging === "a" ? a : b;
        if (p[0] === c[0] && p[1] === c[1]) return;
        if (dragging === "a") a = c; else b = c;
        draw();
    }

    for (const [name, [pa, pb]] of Object.entries(PRESETS)) {
        document.querySelector(`[data-preset="${name}"]`).addEventListener("click", () => {
            a = pa.slice();
            b = pb.slice();
            draw();
        });
    }
    for (const id of ["original", "mirrored", "fixed"]) $(id).addEventListener("change", draw);
    window.addEventListener("resize", resize);
    resize();
}
