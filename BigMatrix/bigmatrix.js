// CPU Cache Impact: Row vs Column Matrix Addition — JavaScript port of BigMatrix.java and MatrixRowBasedAdder.java
// (Mihailo Despotovic, April–June 2007)
// Adds two big square matrices of integers, C = A + B, three ways:
//  1. row by row, on one core: consecutive additions read consecutive memory;
//  2. column by column, on one core: exactly the same additions, but each step jumps a whole row
//     ahead in memory, so the processor's cache can't help and it is usually several times slower;
//  3. row by row, with the rows split into bands, one per core, all at the same time.
// Each is timed a few times and the fastest kept, and every result is checked.
//
// Changes from the original:
//  - Bug fix: each thread got N / cores rows, rounded down, so when the number of cores didn't
//    divide N the last rows were never added (on a 14-core Mac, 8 of the 6000). The rows are now
//    shared out so that every row is added, and the result is checked.
//  - The original timed one setting per run, chosen by editing two flags; the page times all three,
//    best of several runs.
//  - The matrices are 4000 × 4000 by default: three of the original's 6000 × 6000 take 432 MB, a
//    lot for a browser tab. 6000 can still be chosen.
// Each matrix is stored as one long array, row after row, the way a C array is laid out; Java's
// int[][] is an array of rows, which behaves much the same.

const RUNS = 3;

// The worker's code, started from a blob URL so it also works when the page is opened from disk.
// A worker holds rows [start, end) of A, B and C, each n numbers long.
const WORKER_CODE = `
let A, B, C, n, start, rows;
self.onmessage = e => {
    const m = e.data;
    if (m.type === "init") {
        ({ n, start } = m);
        rows = m.end - m.start;
        A = new Int32Array(rows * n);
        B = new Int32Array(rows * n);
        C = new Int32Array(rows * n);
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < n; j++) A[i * n + j] = B[i * n + j] = start + i + j;
        }
        self.postMessage({ type: "ready" });
    } else if (m.type === "add") {
        C.fill(0);
        const t = performance.now();
        if (m.order === "row") {
            for (let i = 0; i < rows; i++) {
                for (let j = 0; j < n; j++) C[i * n + j] = A[i * n + j] + B[i * n + j];
            }
        } else {
            for (let j = 0; j < n; j++) {
                for (let i = 0; i < rows; i++) C[i * n + j] = A[i * n + j] + B[i * n + j];
            }
        }
        self.postMessage({ type: "done", ms: performance.now() - t });
    } else if (m.type === "check") {
        // every element must be (start + i + j) * 2
        let bad = 0;
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < n; j++) if (C[i * n + j] !== 2 * (start + i + j)) bad++;
        }
        self.postMessage({ type: "checked", bad, rows });
    }
};`;
const workerURL = URL.createObjectURL(new Blob([WORKER_CODE], { type: "text/javascript" }));

const nextMessage = worker => new Promise((resolve, reject) => {
    worker.onmessage = e => resolve(e.data);
    worker.onerror = e => reject(new Error(e.message || "The worker failed (not enough memory?)"));
});

// Split n rows into `count` bands whose sizes differ by at most one, so every row is covered
function bands(n, count) {
    const out = [];
    let start = 0;
    for (let k = 0; k < count; k++) {
        const size = Math.floor(n / count) + (k < n % count ? 1 : 0);
        out.push([start, start + size]);
        start += size;
    }
    return out;
}

// Time C = A + B with the rows split over `count` workers; returns the fastest wall-clock time
async function measure(n, count, order, onRun) {
    const workers = Array.from({ length: count }, () => new Worker(workerURL));
    try {
        await Promise.all(workers.map((w, k) => {
            const ready = nextMessage(w);
            const [start, end] = bands(n, count)[k];
            w.postMessage({ type: "init", n, start, end });
            return ready;
        }));
        let best = Infinity;
        for (let run = 0; run < RUNS; run++) {
            const t = performance.now();
            await Promise.all(workers.map(w => {
                const done = nextMessage(w);
                w.postMessage({ type: "add", order });
                return done;
            }));
            best = Math.min(best, performance.now() - t);
            onRun(run + 1);
        }
        const checks = await Promise.all(workers.map(w => {
            const checked = nextMessage(w);
            w.postMessage({ type: "check" });
            return checked;
        }));
        const bad = checks.reduce((s, c) => s + c.bad, 0);
        const rows = checks.reduce((s, c) => s + c.rows, 0);
        return { ms: best, ok: bad === 0 && rows === n };
    } finally {
        for (const w of workers) w.terminate();
    }
}

// ---- UI ----

const $ = id => document.getElementById(id);
const cores = navigator.hardwareConcurrency || 4;

const TESTS = [
    { name: "Row by row, 1 core", order: "row", count: 1 },
    { name: "Column by column, 1 core", order: "column", count: 1 },
    { name: `Row by row, split across ${cores} cores`, order: "row", count: cores },
];

function showMachine() {
    const n = Number($("size").value);
    const mb = (3 * n * n * 4) / 1e6;
    const memory = mb >= 1000 ? `${(mb / 1000).toFixed(1)} GB` : `${Math.round(mb)} MB`;
    $("machine").textContent = `This computer reports ${cores} cores. Three ${n.toLocaleString("en-US")} × ${n.toLocaleString("en-US")} matrices take ${memory}.`;
    const skipped = n - cores * Math.floor(n / cores);
    $("bug").textContent = skipped
        ? `With the 2007 split, ${cores} threads of ${Math.floor(n / cores)} rows each would have left the last ${skipped} row${skipped > 1 ? "s" : ""} unadded here.`
        : `Here ${cores} divides ${n}, so the 2007 split would have happened to cover every row.`;
}

async function runAll() {
    const n = Number($("size").value);
    $("run").disabled = true;
    $("size").disabled = true;
    const tbody = $("results").tBodies[0];
    tbody.replaceChildren();
    $("results").hidden = false;
    $("summary").textContent = "";
    $("note").textContent = "";
    const rows = TESTS.map(test => {
        const tr = tbody.insertRow();
        tr.insertCell().textContent = test.name;
        for (let k = 0; k < 3; k++) tr.insertCell();
        tr.cells[1].textContent = "waiting";
        return tr;
    });
    const times = [];
    try {
        for (let t = 0; t < TESTS.length; t++) {
            const test = TESTS[t];
            const tr = rows[t];
            tr.cells[1].textContent = "setting up...";
            const r = await measure(n, test.count, test.order, run => { tr.cells[1].textContent = `run ${run} of ${RUNS}...`; });
            times.push(r.ms);
            tr.cells[1].textContent = r.ms.toFixed(0) + " ms";
            tr.cells[3].textContent = r.ok ? "✓ correct" : "✗ WRONG";
            tr.cells[3].className = r.ok ? "ok" : "wrong";
            // speed relative to row by row on one core, with a bar
            const ratio = times[0] / r.ms;
            tr.cells[2].innerHTML = `<span class="bar" style="width:${Math.min(100, 30 * ratio)}%"></span> `
                + (t === 0 ? "baseline" : ratio >= 1 ? ratio.toFixed(1) + "× as fast" : (1 / ratio).toFixed(1) + "× slower");
        }
        const speedup = times[0] / times[2];
        $("summary").textContent = `Column by column was ${(times[1] / times[0]).toFixed(1)} times slower than row by row, for the same additions. `
            + `Splitting the rows across ${cores} cores was ${speedup.toFixed(1)} times as fast as one core.`;
        $("note").textContent = speedup < cores / 2
            ? "Why not more? Adding two numbers takes the processor almost no time; nearly all of it goes into moving the matrices "
              + "through memory, and the cores share the same memory, so extra cores help much less than for real calculation."
            : "";
    } catch (e) {
        $("summary").textContent = "Stopped: " + e.message + " Try a smaller size.";
    } finally {
        $("run").disabled = false;
        $("size").disabled = false;
    }
}

$("run").addEventListener("click", runAll);
$("size").addEventListener("change", showMachine);
showMachine();
