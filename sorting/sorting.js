// Sorting Algorithms Visualized — JavaScript port of the sorting.SortFrame applet (Mihailo Despotovic, January 2003)
// Each sort is a generator over the array: it yields "inner" or "outer" where the original slept
// in its inner or outer loop (or "any" where it slept for either delay setting), so the page can
// animate it step by step. Everything sorts largest first, which draws as a line rising to the right.

const DELAY = 15; // milliseconds per animation step

function swap(a, i, j) {
    const t = a[i];
    a[i] = a[j];
    a[j] = t;
}

function bits(i, position, howMany) {
    return (i >> position) & ((1 << howMany) - 1);
}

// Random permutation of 0..N-1 (Fisher–Yates)
function shuffle(a, N) {
    for (let i = 0; i < N; i++) a[i] = i;
    for (let i = N - 1; i > 0; i--) swap(a, i, Math.floor(Math.random() * (i + 1)));
}

// ---- Sorts ----

function* dist(a, N) {
    const counter = new Array(N).fill(0);
    for (let i = 0; i < N; i++) counter[N - 1 - a[i]] = a[i];
    for (let i = 0; i < N; i++) {
        a[i] = counter[i];
        yield "any";
    }
}

function* selection(a, N) {
    for (let i = 0; i < N - 1; i++) {
        let maxElem = i;
        for (let j = i + 1; j < N; j++) {
            yield "inner";
            if (a[j] > a[maxElem]) maxElem = j;
        }
        swap(a, maxElem, i);
        yield "outer";
    }
}

function* insertion(a, N) {
    for (let i = 1; i < N; i++) {
        yield "outer";
        const v = a[i];
        let j = i;
        while (j > 0 && a[j - 1] < v) {
            a[j] = a[j - 1];
            j--;
            yield "inner";
        }
        a[j] = v;
    }
}

function* bubble(a, N) {
    for (let i = 0; i < N; i++) {
        yield "outer";
        for (let j = N - 1; j > i; j--) {
            if (a[j - 1] < a[j]) {
                swap(a, j - 1, j);
                yield "inner";
            }
        }
    }
}

function* shell(a, N) {
    let h = 1;
    while (h <= N) h = 3 * h + 1;
    while (h > 1) {
        h = Math.floor(h / 3);
        for (let i = h; i < N; i++) {
            yield "outer";
            const v = a[i];
            let j = i;
            while (j >= h && a[j - h] < v) {
                a[j] = a[j - h];
                j -= h;
                yield "inner";
            }
            a[j] = v;
        }
    }
}

function* quick(a, N) {
    yield* quicksort(a, 0, N - 1);
}

function* quicksort(a, left, right) {
    if (right > left) {
        const p = yield* partition(a, left, right);
        yield* quicksort(a, left, p - 1);
        yield* quicksort(a, p + 1, right);
    }
}

function* partition(a, start, end) {
    let left = start - 1;
    let right = end;
    const p = a[end];
    while (true) {
        while (p < a[++left]) { if (left === end) break; }
        while (p > a[--right]) { if (right === start) break; }
        if (left >= right) break;
        swap(a, left, right);
        yield "any";
    }
    swap(a, left, end);
    return left;
}

function* radixExchange(a, N) {
    yield* radixExchangeDo(a, 0, N - 1, 9); // 2^9 = 512 > 500 (maximum N)
}

function* radixExchangeDo(a, left, right, b) {
    if (right > left && b >= 0) {
        let i = left;
        let j = right;
        while (true) {
            while (bits(a[i], b, 1) === 1 && i < j) i++;
            while (bits(a[j], b, 1) === 0 && i < j) j--;
            swap(a, i, j);
            yield "inner";
            if (j === i) break;
        }
        if (bits(a[right], b, 1) === 1) j++;
        yield "outer";
        yield* radixExchangeDo(a, left, j - 1, b - 1);
        yield* radixExchangeDo(a, j, right, b - 1);
    }
}

// Least significant digit first, m bits per pass; each pass is a stable distribution by that digit
function* radixStraight(a, N) {
    const m = 5;
    const M = 1 << m;
    const w = 10; // a multiple of m, at least the 9 bits of the largest number (499)
    const b = new Array(N);
    for (let pass = 0; pass < w / m; pass++) {
        const count = new Array(M).fill(0);
        for (let i = 0; i < N; i++) count[bits(a[i], pass * m, m)]++;
        const next = new Array(M); // where the next number with each digit goes: larger digits first
        for (let d = M - 1, pos = 0; d >= 0; d--) {
            next[d] = pos;
            pos += count[d];
        }
        for (let i = 0; i < N; i++) b[next[bits(a[i], pass * m, m)]++] = a[i];
        for (let i = 0; i < N; i++) {
            a[i] = b[i];
            yield "inner";
        }
        yield "outer";
    }
}

// Builds a heap with the smallest number on top, then repeatedly moves the top to the end
function* heap(a, N) {
    for (let k = Math.floor(N / 2) - 1; k >= 0; k--) {
        yield* siftDown(a, k, N);
        yield "outer";
    }
    for (let end = N - 1; end > 0; end--) {
        swap(a, 0, end);
        yield* siftDown(a, 0, end);
        yield "outer";
    }
}

function* siftDown(a, k, n) {
    while (2 * k + 1 < n) {
        let j = 2 * k + 1;
        if (j + 1 < n && a[j + 1] < a[j]) j++;
        if (a[k] <= a[j]) break;
        swap(a, k, j);
        k = j;
        yield "inner";
    }
}

// Top-down merge sort through a scratch copy
function* merge(a, N) {
    yield* mergesort(a, new Array(N), 0, N - 1);
}

function* mergesort(a, aux, left, right) {
    if (right <= left) return;
    const middle = Math.floor((left + right) / 2);
    yield* mergesort(a, aux, left, middle);
    yield* mergesort(a, aux, middle + 1, right);
    for (let k = left; k <= right; k++) aux[k] = a[k];
    let i = left, j = middle + 1;
    for (let k = left; k <= right; k++) {
        if (i > middle) a[k] = aux[j++];
        else if (j > right) a[k] = aux[i++];
        else if (aux[j] > aux[i]) a[k] = aux[j++];
        else a[k] = aux[i++];
        yield "inner";
    }
    yield "outer";
}

const SORTS = { dist, selection, insertion, bubble, shell, quick, radixExchange, radixStraight, heap, merge };

// ---- UI ----

const SIZE = 500; // canvas size in CSS pixels

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const dpr = window.devicePixelRatio || 1;
canvas.width = SIZE * dpr;
canvas.height = SIZE * dpr;
ctx.scale(dpr, dpr);

const $ = id => document.getElementById(id);
const startButton = $("start");
const shuffleButton = $("shuffle");
const pointsChoice = $("points");

let N = 50;
const array = new Array(500);
let run = null; // { cancelled } while a sort is running

function draw() {
    const d = Math.floor(SIZE / N);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.strokeStyle = "#000";
    ctx.strokeRect(0.5, 0.5, SIZE - 1, SIZE - 1);
    ctx.fillStyle = "#000";
    for (let i = 0; i < N; i++) ctx.fillRect(d * i, d * array[i], d, d);
}

function delayMode() {
    return document.querySelector("input[name=delay]:checked").value; // "none", "outer" or "inner"
}

function setGUI(enabled) {
    for (const input of document.querySelectorAll("input[name=sort]")) input.disabled = !enabled;
    pointsChoice.disabled = !enabled;
    shuffleButton.disabled = !enabled;
    startButton.textContent = enabled ? "Start" : "Stop";
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function start() {
    const sort = SORTS[document.querySelector("input[name=sort]:checked").value];
    const thisRun = run = { cancelled: false };
    setGUI(false);
    for (const step of sort(array, N)) {
        const mode = delayMode(); // read every step: the delay can be changed while sorting
        if (step === mode || (step === "any" && mode !== "none")) {
            draw();
            await sleep(DELAY);
            if (thisRun.cancelled) break;
        }
    }
    run = null;
    draw();
    setGUI(true);
}

startButton.addEventListener("click", () => {
    if (run) run.cancelled = true; // Stop
    else start();
});

shuffleButton.addEventListener("click", () => {
    shuffle(array, N);
    draw();
});

pointsChoice.addEventListener("change", () => {
    N = Number(pointsChoice.value);
    shuffle(array, N);
    draw();
});

shuffle(array, N);
draw();
