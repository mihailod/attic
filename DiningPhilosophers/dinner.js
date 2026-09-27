// Dining Philosophers — JavaScript port of Dinner, Philosopher and Fork (Mihailo Despotovic, August 2005)
// Philosophers sit around a table with one fork between each pair of neighbours. Each one thinks,
// gets hungry, picks up both of the forks next to him, eats and puts them down again. If everyone
// picks up his left fork first, they can all end up holding one fork and waiting forever for the
// other: a deadlock. My 2005 solution: odd-numbered philosophers pick up their right fork first,
// so the forks are never all grabbed around the circle in the same direction.
//
// The Java version had a thread per philosopher, with synchronized wait() and notify() on each
// fork. Here each philosopher is an async loop and each fork keeps a queue of waiting philosophers.
// Time runs on a simulated clock, so the dinner can be paused and sped up; the thinking and eating
// times are random up to 5 seconds, as in the original.
//
// Changes from the original: it can also run the naive version, so the deadlock can be seen and is
// detected; the number of philosophers can be changed; and the log's mix-ups are fixed (putting
// down the second fork was logged as "picking up his right fork", and the odd philosophers, whose
// forks were passed in swapped, logged their right fork as the left one).

const $ = id => document.getElementById(id);
const MAX_THINK = 5000;
const MAX_EAT = 5000;

// ---- simulated clock ----

let simTime = 0;          // ms
let speed = 1;
let paused = false;
let timers = [];          // { at, resolve }

function advance(dt) {
    simTime += dt;
    const due = timers.filter(t => t.at <= simTime).sort((a, b) => a.at - b.at);
    timers = timers.filter(t => t.at > simTime);
    for (const t of due) t.resolve();
}

// ---- Fork: free or held; a philosopher who wants it waits until it is put down ----

class Fork {
    constructor(index) {
        this.index = index;
        this.holder = null;
        this.waiters = [];
    }
    async pickUp(philosopher) {
        while (this.holder !== null) await new Promise(resolve => this.waiters.push(resolve));
        this.holder = philosopher;
    }
    putDown() {
        this.holder = null;
        const next = this.waiters.shift(); // notify(): wake one waiting philosopher
        if (next) next();
    }
}

// ---- Philosopher ----

class Philosopher {
    constructor(index, left, right, leftFirst) {
        this.index = index;
        this.name = String(index);
        this.left = left;
        this.right = right;
        // the fork he reaches for first, and second
        [this.first, this.second] = leftFirst ? [left, right] : [right, left];
        this.state = "thinking";
        this.meals = 0;
        this.waited = 0;
    }

    side(fork) { return fork === this.left ? "left" : "right"; }

    nap(ms) {
        return new Promise(resolve => timers.push({ at: simTime + ms, resolve }));
    }

    async run(generation, startHungry = false) {
        // forever...
        while (generation === dinnerGeneration) {
            // think a bit...
            if (!startHungry) {
                this.state = "thinking";
                log(`${this.name} is thinking...`);
                await this.nap(Math.random() * MAX_THINK);
                if (generation !== dinnerGeneration) return;
            }
            startHungry = false;

            // pick up
            this.state = "hungry";
            const hungrySince = simTime;
            log(`${this.name} is picking up his ${this.side(this.first)} fork...`);
            await this.first.pickUp(this);
            log(`${this.name} is picking up his ${this.side(this.second)} fork...`);
            await this.second.pickUp(this);
            this.waited += simTime - hungrySince;

            // eating...
            this.state = "eating";
            this.meals++;
            log(`${this.name} is eating...`);
            await this.nap(Math.random() * MAX_EAT);
            if (generation !== dinnerGeneration) return;

            // put down
            log(`${this.name} is putting down his ${this.side(this.first)} fork...`);
            this.first.putDown();
            log(`${this.name} is putting down his ${this.side(this.second)} fork...`);
            this.second.putDown();
        }
    }
}

// ---- Dinner ----

let dinnerGeneration = 0;
let forks = [];
let philosophers = [];
let deadlocked = false;

function startDinner() {
    dinnerGeneration++;
    simTime = 0;
    timers = [];
    deadlocked = false;
    deadlockFrames = 0;
    $("log").textContent = "";
    $("deadlock").hidden = true;

    // the dimension of the problem
    const numForks = Number($("count").value);
    const naive = $("naive").checked;

    // create forks
    forks = Array.from({ length: numForks }, (_, i) => new Fork(i));

    // create philosophers: in my solution, the odd ones pick up the right fork first
    philosophers = forks.map((_, i) => new Philosopher(i, forks[i], forks[(i + 1) % numForks], naive || i % 2 === 0));

    buildTable();
    // let them start
    for (const p of philosophers) p.run(dinnerGeneration);
}

// Everyone gets hungry at once: all the forks go back on the table and every philosopher reaches
// for his first fork at the same moment. The old loops are left waiting on timers and forks that
// no longer exist; each philosopher starts a new one, keeping his meals and waiting time.
function everyoneHungry() {
    if (deadlocked) return;
    dinnerGeneration++;
    timers = [];
    for (const f of forks) {
        f.holder = null;
        f.waiters = [];
    }
    log("Everyone puts the forks down and gets hungry at the same moment.");
    for (const p of philosophers) p.run(dinnerGeneration, true);
}

// deadlock: every fork is held and nobody is eating, so everyone holds one fork and waits for another.
// It must last two frames in a row, in case a philosopher has both forks but hasn't started eating yet.
let deadlockFrames = 0;
function checkDeadlock() {
    if (deadlocked || forks.length === 0) return;
    const stuck = forks.every(f => f.holder !== null) && philosophers.every(p => p.state === "hungry");
    deadlockFrames = stuck ? deadlockFrames + 1 : 0;
    if (deadlockFrames >= 2) {
        deadlocked = true;
        log("DEADLOCK: every philosopher holds one fork and waits for the other.");
        $("deadlock").hidden = false;
    }
}

// ---- log ----

const logLines = [];
function log(text) {
    logLines.push(`${(simTime / 1000).toFixed(1).padStart(6)}s  ${text}`);
    if (logLines.length > 300) logLines.splice(0, logLines.length - 300);
    logDirty = true;
}
let logDirty = false;

// ---- drawing ----

const SVG_NS = "http://www.w3.org/2000/svg";
const C = 200;          // centre of the table
const R_SEAT = 160;     // philosophers
const R_PLATE = 88;     // plates
const R_FORK = 100;     // forks lying on the table
let seatEls = [], plateEls = [], forkEls = [], statEls = [];

const angleOf = i => -Math.PI / 2 + (2 * Math.PI * i) / philosophers.length;
const point = (angle, r) => [C + r * Math.cos(angle), C + r * Math.sin(angle)];

function el(name, attrs, parent) {
    const e = document.createElementNS(SVG_NS, name);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    parent.append(e);
    return e;
}

function buildTable() {
    const svg = $("table");
    svg.replaceChildren();
    el("circle", { cx: C, cy: C, r: 122, class: "tabletop" }, svg);
    const n = philosophers.length;
    const plateR = Math.min(22, 60 / Math.max(n, 3) * 1.6);
    plateEls = philosophers.map((p, i) => {
        const [x, y] = point(angleOf(i), R_PLATE);
        const g = el("g", {}, svg);
        el("circle", { cx: x, cy: y, r: plateR, class: "plate" }, g);
        const food = el("text", { x, y: y + 1, class: "food" }, g);
        food.textContent = "🍝";
        return g;
    });
    forkEls = forks.map(() => {
        const g = el("g", { class: "fork" }, svg);
        el("line", { x1: 0, y1: -16, x2: 0, y2: 16 }, g);
        for (const dx of [-4, 0, 4]) el("line", { x1: dx, y1: -16, x2: dx, y2: -24, class: "tine" }, g);
        el("line", { x1: -4, y1: -16, x2: 4, y2: -16, class: "tine" }, g);
        return g;
    });
    seatEls = philosophers.map((p, i) => {
        const [x, y] = point(angleOf(i), R_SEAT);
        const g = el("g", { class: "seat" }, svg);
        el("circle", { cx: x, cy: y, r: 24 }, g);
        const t = el("text", { x, y: y + 1 }, g);
        t.textContent = p.name;
        return g;
    });

    const stats = $("stats");
    stats.replaceChildren();
    statEls = philosophers.map(p => {
        const tr = document.createElement("tr");
        for (let k = 0; k < 4; k++) tr.append(document.createElement("td"));
        tr.cells[0].textContent = p.name;
        stats.append(tr);
        return tr;
    });
    render();
}

// where fork k lies: on the table between its two philosophers, or in the hand of the one holding it
function forkPosition(fork) {
    const n = philosophers.length;
    const k = fork.index;
    // fork k is philosopher k's left fork and philosopher k-1's right fork
    if (fork.holder === null) {
        const a = angleOf(k) - Math.PI / n;
        const [x, y] = point(a, R_FORK);
        return [x, y, (a * 180) / Math.PI + 90];
    }
    const p = fork.holder;
    const offset = Math.min(0.42, Math.PI / n * 0.8) * (fork === p.left ? -1 : 1);
    const a = angleOf(p.index) + offset;
    const [x, y] = point(a, R_PLATE + 22);
    return [x, y, (a * 180) / Math.PI - 90];
}

function render() {
    philosophers.forEach((p, i) => {
        seatEls[i].setAttribute("class", "seat " + p.state);
        plateEls[i].setAttribute("class", p.state === "eating" ? "eating" : "");
        statEls[i].cells[1].textContent = p.state;
        statEls[i].cells[1].className = p.state;
        statEls[i].cells[2].textContent = p.meals;
        statEls[i].cells[3].textContent = (p.waited / 1000).toFixed(1) + "s";
    });
    forks.forEach((f, k) => {
        const [x, y, deg] = forkPosition(f);
        forkEls[k].style.transform = `translate(${x}px, ${y}px) rotate(${deg}deg)`;
        forkEls[k].setAttribute("class", "fork" + (f.holder ? " held" : ""));
    });
    $("clock").textContent = (simTime / 1000).toFixed(1) + "s";
    if (logDirty) {
        const box = $("log");
        const atBottom = box.scrollTop + box.clientHeight >= box.scrollHeight - 4;
        box.textContent = logLines.join("\n");
        if (atBottom) box.scrollTop = box.scrollHeight;
        logDirty = false;
    }
}

// ---- main loop ----

let last = performance.now();
function frame(now) {
    const dt = Math.min(now - last, 100); // don't jump ahead after the tab was hidden
    last = now;
    if (!paused && !deadlocked) advance(dt * speed);
    // let the philosophers who were woken act before drawing
    queueMicrotask(() => {
        checkDeadlock();
        render();
    });
    requestAnimationFrame(frame);
}

// ---- controls ----

$("naive").addEventListener("change", () => { logLines.length = 0; startDinner(); });
$("solution").addEventListener("change", () => { logLines.length = 0; startDinner(); });
$("count").addEventListener("change", () => { logLines.length = 0; startDinner(); });
$("restart").addEventListener("click", () => { logLines.length = 0; startDinner(); });
$("restart2").addEventListener("click", () => { logLines.length = 0; startDinner(); });
$("hungry").addEventListener("click", everyoneHungry);
$("pause").addEventListener("click", () => {
    paused = !paused;
    $("pause").textContent = paused ? "Resume" : "Pause";
});
$("speed").addEventListener("input", () => {
    speed = Number($("speed").value);
    $("speed-label").textContent = speed + "×";
});

startDinner();
requestAnimationFrame(frame);
