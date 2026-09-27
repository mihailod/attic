// Parallel Sum Benchmark — JavaScript port of ParallelSum.java (Mihailo Despotovic, June 2007)
// Adds up a big array of 1s: once with one worker (serial), then split evenly across 2, 4, ...
// workers running at the same time, like the original's two Adder threads.
// Each worker fills its own share of the array first (not timed, like the original's init()),
// then all of them are told to start summing, and the time until the last one finishes is measured.

const RUNS = 3; // time each setup this many times and keep the fastest (the first run is often slower)

// The worker's code, started from a blob URL so it also works when the page is opened from disk
const WORKER_CODE = `
let a = null;
self.onmessage = e => {
    if (e.data.type === "fill") {
        a = new Float64Array(e.data.length);
        a.fill(1);
        self.postMessage({ type: "ready" });
    } else if (e.data.type === "sum") {
        let localSum = 0;
        for (let i = 0; i < a.length; i++) localSum += a[i];
        self.postMessage({ type: "done", localSum });
    }
};`;
const workerURL = URL.createObjectURL(new Blob([WORKER_CODE], { type: "text/javascript" }));

const nextMessage = worker => new Promise((resolve, reject) => {
    worker.onmessage = e => resolve(e.data);
    worker.onerror = e => reject(new Error(e.message || "The worker failed (not enough memory?)"));
});

// Sum `total` 1s with `count` workers; returns the fastest time and the combined sum
async function measure(count, total) {
    const workers = Array.from({ length: count }, () => new Worker(workerURL));
    try {
        const share = Math.floor(total / count);
        await Promise.all(workers.map((w, i) => {
            const ready = nextMessage(w);
            w.postMessage({ type: "fill", length: i === count - 1 ? total - share * (count - 1) : share });
            return ready;
        }));
        let best = Infinity, sum = 0;
        for (let run = 0; run < RUNS; run++) {
            const start = performance.now();
            const results = await Promise.all(workers.map(w => {
                const done = nextMessage(w);
                w.postMessage({ type: "sum" });
                return done;
            }));
            best = Math.min(best, performance.now() - start);
            sum = results.reduce((s, r) => s + r.localSum, 0); // the original printed the serial sum here
        }
        return { ms: best, sum };
    } finally {
        workers.forEach(w => w.terminate()); // free the memory before the next setup
    }
}

// ---- UI ----

const $ = id => document.getElementById(id);
const cores = navigator.hardwareConcurrency || 4;

function workerCounts() {
    const counts = [1];
    for (let n = 2; n < cores; n *= 2) counts.push(n);
    if (cores > 1) counts.push(cores);
    return counts;
}

$("cores").textContent = `This computer reports ${cores} processor core${cores === 1 ? "" : "s"}, so it goes up to ${cores} worker${cores === 1 ? "" : "s"}.`;

$("form").addEventListener("submit", async e => {
    e.preventDefault();
    const total = Number($("size").value) * 1000000;
    const rows = $("results");
    const status = $("status");
    $("run").disabled = true;
    rows.innerHTML = "";
    let serialMs = null;
    try {
        for (const count of workerCounts()) {
            status.textContent = `Running with ${count} worker${count === 1 ? "" : "s"}...`;
            const { ms, sum } = await measure(count, total);
            if (count === 1) serialMs = ms;
            const row = rows.insertRow();
            row.insertCell().textContent = count === 1 ? "1 (serial)" : count;
            row.insertCell().textContent = ms.toFixed(1) + " ms";
            row.insertCell().textContent = (serialMs / ms).toFixed(2) + "×";
            const sumCell = row.insertCell();
            sumCell.textContent = sum.toLocaleString("en-US");
            if (sum !== total) sumCell.className = "wrong";
        }
        status.textContent = `Summed ${total.toLocaleString("en-US")} ones, fastest of ${RUNS} runs each.`;
    } catch (err) {
        status.textContent = `Stopped: ${err.message}. Try a smaller array.`;
    }
    $("run").disabled = false;
});
