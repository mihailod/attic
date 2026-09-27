// Producers and Consumers — JavaScript port of PC.java (Mihailo Despotovic, December 2015)
// Producer threads add items to a shared buffer and consumer threads take them out; one lock guards
// the count of items. A producer that finds the buffer full waits, and so does a consumer that finds
// it empty, until another thread changes the count and wakes them. The original had 20 producers,
// 10 consumers and a buffer that counts as full at 9, and printed the count after every change,
// with " F " when a producer found it full and " E " when a consumer found it empty.
//
// Java threads become async loops here, and Java's lock, wait() and notify() a small monitor:
// a thread that wants the lock queues for it; wait() gives the lock up and puts the thread in the
// wait set; notify() moves one waiting thread (any one) back to the lock queue, notifyAll() moves
// them all; and whoever gets the lock next is picked at random, as Java doesn't promise an order.
// Time runs on a simulated clock, so it can be paused and sped up.
//
// Two switches break it on purpose, to show why the original is written the way it is:
//  - "if" instead of "while" around wait(): a thread woken up doesn't check the count again, and
//    can add to a full buffer or take from an empty one;
//  - notify() instead of notifyAll(): the one thread woken up can be the wrong kind (a producer
//    waking another producer while the buffer is full), and eventually every thread can be waiting
//    for a wake-up that never comes.

const MAX_SLEEP = 200; // ms, both outside and inside the lock, as in the original

function createSim({ producers = 20, consumers = 10, capacity = 9, useWhile = true, useNotifyAll = true, random = Math.random } = {}) {
    const sim = {
        now: 0, counter: 0, capacity, produced: 0, consumed: 0,
        threads: [], output: [], problem: null, generation: 0,
    };
    let timers = [];
    const sleep = ms => new Promise(resolve => timers.push({ at: sim.now + ms, resolve }));
    const nap = () => Math.floor(random() * MAX_SLEEP);  // new Random().nextInt(200)
    const print = s => {
        sim.output.push(s);
        if (sim.output.length > 4000) sim.output.splice(0, 2000);
    };

    // the monitor: the object `mutex` in the original
    const mon = {
        owner: null, entry: [], waitSet: [],
        acquire(t) {
            if (this.owner === null) {
                this.owner = t;
                return Promise.resolve();
            }
            return new Promise(resolve => this.entry.push({ t, resolve }));
        },
        release() {
            this.owner = null;
            if (this.entry.length) {
                const [next] = this.entry.splice(Math.floor(random() * this.entry.length), 1);
                this.owner = next.t;
                next.resolve();
            }
        },
        // wait(): give up the lock and sleep until notified, then queue for the lock again
        wait(t) {
            const p = new Promise(resolve => this.waitSet.push({ t, resolve }));
            this.release();
            return p;
        },
        wake(entry) {
            entry.t.state = "blocked";
            this.entry.push(entry);
        },
        notify() {
            if (this.waitSet.length) this.wake(this.waitSet.splice(Math.floor(random() * this.waitSet.length), 1)[0]);
        },
        notifyAll() {
            for (const e of this.waitSet.splice(0)) this.wake(e);
        },
    };
    sim.monitor = mon;

    const check = () => {
        if (!sim.problem && (sim.counter > capacity || sim.counter < 0)) {
            sim.problem = sim.counter > capacity
                ? `Overflow: ${sim.counter} items in a buffer that is full at ${capacity}.`
                : `Underflow: ${sim.counter} items, a consumer took from an empty buffer.`;
        }
    };

    // produce() and consume() from the original, with the two switches
    async function run(t, generation) {
        const isProducer = t.kind === "producer";
        const stuck = () => (isProducer ? sim.counter === capacity : sim.counter === 0);
        while (generation === sim.generation) {
            t.state = "sleeping";
            await sleep(nap());
            if (generation !== sim.generation) return;
            t.state = "blocked";
            await mon.acquire(t);
            t.state = "holding";
            if (useWhile) {
                while (stuck()) {
                    print(isProducer ? " F " : " E ");
                    t.state = isProducer ? "full" : "empty";
                    await mon.wait(t);
                    t.state = "holding";
                }
            } else if (stuck()) {
                print(isProducer ? " F " : " E ");
                t.state = isProducer ? "full" : "empty";
                await mon.wait(t);
                t.state = "holding";
            }
            await sleep(nap());
            if (generation !== sim.generation) return;
            if (isProducer) { sim.counter++; sim.produced++; } else { sim.counter--; sim.consumed++; }
            t.items++;
            print(sim.counter + " ");
            check();
            if (useNotifyAll) mon.notifyAll(); else mon.notify();
            mon.release();
        }
    }

    for (let i = 0; i < consumers; i++) sim.threads.push({ kind: "consumer", id: i + 1, state: "sleeping", items: 0 });
    for (let i = 0; i < producers; i++) sim.threads.push({ kind: "producer", id: i + 1, state: "sleeping", items: 0 });
    for (const t of sim.threads) run(t, sim.generation);

    // everyone waiting in the wait set, so nobody will ever call notify again
    sim.deadlocked = () => sim.threads.length > 0 && mon.waitSet.length === sim.threads.length;

    // advance the simulated clock; returns once all threads woken have acted
    sim.advance = async ms => {
        const end = sim.now + ms;
        for (;;) {
            timers.sort((a, b) => a.at - b.at);
            if (!timers.length || timers[0].at > end) break;
            const t = timers.shift();
            sim.now = t.at;
            t.resolve();
            // let the woken thread run until its next await
            for (let k = 0; k < 20; k++) await Promise.resolve();
            if (sim.problem) break;
        }
        if (!sim.problem) sim.now = end;
        if (!sim.problem && sim.deadlocked()) sim.problem = "Deadlock: every thread is waiting to be notified, and none is left to notify them.";
    };
    sim.stop = () => { sim.generation++; timers = []; };
    return sim;
}

if (typeof module !== "undefined") module.exports = { createSim };

// ---- UI ----

if (typeof document !== "undefined") {
    const $ = id => document.getElementById(id);
    let sim = null, speed = 1, paused = false, last = performance.now(), busy = false;

    const settings = () => ({
        producers: Number($("producers").value),
        consumers: Number($("consumers").value),
        capacity: Number($("capacity").value),
        useWhile: !$("use-if").checked,
        useNotifyAll: !$("use-notify").checked,
    });

    function start() {
        if (sim) sim.stop();
        sim = createSim(settings());
        $("problem").hidden = true;
        build();
        render();
    }

    let chips = new Map(), slots = [];
    function build() {
        const make = (kind, container) => {
            container.replaceChildren();
            for (const t of sim.threads.filter(t => t.kind === kind)) {
                const d = document.createElement("div");
                d.className = "chip";
                d.textContent = (kind === "producer" ? "P" : "C") + t.id;
                container.append(d);
                chips.set(t, d);
            }
        };
        chips = new Map();
        make("producer", $("producer-list"));
        make("consumer", $("consumer-list"));
        const buf = $("buffer");
        buf.replaceChildren();
        slots = [];
        for (let k = 0; k < sim.capacity + 2; k++) {   // two extra slots to show an overflow
            const s = document.createElement("div");
            s.className = "slot" + (k >= sim.capacity ? " extra" : "");
            buf.append(s);
            slots.push(s);
        }
    }

    const LABELS = { sleeping: "sleeping", blocked: "waiting for the lock", holding: "holding the lock", full: "wait(): buffer full", empty: "wait(): buffer empty" };

    function render() {
        for (const [t, d] of chips) {
            d.className = "chip " + t.state;
            d.title = `${t.kind === "producer" ? "Producer" : "Consumer"} ${t.id}: ${LABELS[t.state]}, ${t.items} item${t.items === 1 ? "" : "s"} so far`;
        }
        slots.forEach((s, k) => {
            s.classList.toggle("filled", k < sim.counter);
            s.classList.toggle("bad", k < sim.counter && k >= sim.capacity);
        });
        $("count").textContent = sim.counter;
        const owner = sim.monitor.owner;
        $("lock").textContent = owner ? `Lock held by ${owner.kind === "producer" ? "P" : "C"}${owner.id}` : "Lock free";
        const counts = {};
        for (const t of sim.threads) counts[t.state] = (counts[t.state] || 0) + 1;
        $("states").textContent = Object.entries(LABELS).map(([k, label]) => `${label}: ${counts[k] || 0}`).join(" · ");
        const secs = sim.now / 1000;
        $("clock").textContent = secs.toFixed(1) + " s";
        $("rates").textContent = `Produced ${sim.produced}, consumed ${sim.consumed}` + (secs > 1 ? ` (${(sim.produced / secs).toFixed(1)} and ${(sim.consumed / secs).toFixed(1)} per second)` : "");
        const out = $("output");
        const atBottom = out.scrollTop + out.clientHeight >= out.scrollHeight - 4;
        out.textContent = sim.output.slice(-1500).join("");
        if (atBottom) out.scrollTop = out.scrollHeight;
        if (sim.problem && $("problem").hidden) {
            $("problem-text").textContent = sim.problem;
            $("problem").hidden = false;
        }
    }

    async function frame(now) {
        const dt = Math.min(now - last, 100);
        last = now;
        if (!paused && !busy && sim && !sim.problem) {
            busy = true;
            await sim.advance(dt * speed);
            busy = false;
            render();
        }
        requestAnimationFrame(frame);
    }

    for (const id of ["producers", "consumers", "capacity", "use-if", "use-notify"]) $(id).addEventListener("change", start);
    $("restart").addEventListener("click", start);
    $("restart2").addEventListener("click", start);
    $("pause").addEventListener("click", () => {
        paused = !paused;
        $("pause").textContent = paused ? "Resume" : "Pause";
    });
    $("speed").addEventListener("input", () => {
        speed = Number($("speed").value);
        $("speed-label").textContent = speed + "×";
    });
    $("defaults").addEventListener("click", () => {
        $("producers").value = 20; $("consumers").value = 10; $("capacity").value = 9;
        $("use-if").checked = false; $("use-notify").checked = false;
        start();
    });
    $("small").addEventListener("click", () => {
        $("producers").value = 3; $("consumers").value = 3; $("capacity").value = 1;
        start();
    });
    start();
    requestAnimationFrame(frame);
}
