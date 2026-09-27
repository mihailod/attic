"use strict";

// The page: Davor's Trader 1.0, the Swing window, and the Expert Advisor in a small MetaTrader 4 tester.

const $ = id => document.getElementById(id);

// ---------------------------------------------------------------------------------------------------------
// Davor's Trader 1.0, as Trader.java builds it

(() => {
    const win = $("swing"), src = $("src"), dst = $("dst"), debug = $("debugArea");
    // java.util.Date.toString(): Sat Nov 16 16:33:05 CET 2013
    const javaDate = () => {
        const d = new Date();
        const zone = new Intl.DateTimeFormat("en-US", { timeZoneName: "short" }).formatToParts(d).find(p => p.type === "timeZoneName")?.value ?? "";
        const p2 = n => String(n).padStart(2, "0");
        return `${d.toLocaleString("en-US", { weekday: "short" })} ${d.toLocaleString("en-US", { month: "short" })} ${p2(d.getDate())} ` +
            `${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())} ${zone} ${d.getFullYear()}`;
    };
    const d = s => { debug.value += `${javaDate()}: ${s}\n`; debug.scrollTop = debug.scrollHeight; };

    function dialog(title, message, buttons) {
        return new Promise(resolve => {
            const shade = document.createElement("div");
            shade.className = "jshade";
            const box = document.createElement("div");
            box.className = "jdialog";
            box.setAttribute("role", "dialog");
            box.innerHTML = `<div class="jtitle"></div><div class="jbody"><span class="jicon"></span><p></p></div><div class="jbuttons"></div>`;
            box.querySelector(".jtitle").textContent = title;
            box.querySelector("p").textContent = message;
            box.querySelector(".jicon").textContent = buttons.length > 1 ? "?" : "✕";
            box.querySelector(".jicon").classList.add(buttons.length > 1 ? "q" : "e");
            for (const [label, value] of buttons) {
                const b = document.createElement("button");
                b.textContent = label;
                b.addEventListener("click", () => { shade.remove(); resolve(value); });
                box.querySelector(".jbuttons").append(b);
            }
            shade.append(box);
            win.append(shade);
            box.querySelector("button").focus();
        });
    }

    $("load").addEventListener("click", () => { d("Load Data File"); $("file").click(); });
    $("file").addEventListener("change", async e => {
        const f = e.target.files[0];
        e.target.value = "";
        if (!f) { d("Open file cancelled"); return; }
        d("Opening file: " + f.name);
        const lines = (await f.text()).split(/\r\n|\r|\n/);
        if (lines[lines.length - 1] === "") lines.pop();
        src.value = lines.map(l => l + "\n").join("");
        d("Read " + lines.length + " lines");
    });
    $("process").addEventListener("click", async () => {
        d("Process Data File");
        const text = dst.value.trim();
        // process(): it looks at the blue Program area, though its message speaks of the white one; then, a todo
        if (text.length === 0) {
            d("Nothing to process");
            await dialog("Error", "Nothing to do!\nEnter data in the white area\nor load a data file.", [["OK", 0]]);
        }
    });
    $("clearData").addEventListener("click", () => { src.value = ""; });
    $("clearProg").addEventListener("click", () => { dst.value = ""; });
    $("clearAll").addEventListener("click", () => { src.value = ""; dst.value = ""; debug.value = ""; });
    $("close").addEventListener("click", async () => {
        d("Close application");
        const yes = await dialog("Close", "Close the application?", [["Yes", true], ["No", false]]);
        if (yes) { win.hidden = true; $("closed").hidden = false; }
        else d("Close application cancelled");
    });
    $("reopen").addEventListener("click", () => {
        src.value = ""; dst.value = ""; debug.value = "";
        win.hidden = false; $("closed").hidden = true;
        start();
    });
    $("paste-ea").addEventListener("click", () => { dst.value = SOURCE_MQL; dst.scrollTop = 0; });
    function start() {
        d("Davor's Trader 1.0 ©MiRteh 2013 mihailod@me.com");
        d("Appication starting...");
        d("Application started");
    }
    start();
})();

// ---------------------------------------------------------------------------------------------------------
// The Expert Advisor in a small MetaTrader 4 tester

(() => {
    const canvas = $("chart"), ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    let market = null, marketName = "";
    let tester = null, other = null, dayShown = null, playing = false, timer = null;
    const inputs = { ...DEFAULT_INPUTS };

    // the EA's extern inputs, editable as in MT4's Inputs tab
    const inputsTable = $("inputs");
    for (const [name, value] of Object.entries(DEFAULT_INPUTS)) {
        if (name === "debug") continue;
        const tr = document.createElement("tr");
        const type = typeof value === "number" ? "double" : "string";
        tr.innerHTML = `<td><code>extern ${type} ${name}</code></td><td><input></td>`;
        const input = tr.querySelector("input");
        input.value = String(value);
        input.setAttribute("aria-label", name);
        input.addEventListener("change", () => {
            if (type === "double") { const v = Number(input.value); if (Number.isFinite(v)) inputs[name] = v; else input.value = inputs[name]; }
            else if (/^\d{1,2}:\d{2}$/.test(input.value.trim())) inputs[name] = input.value.trim();
            else input.value = inputs[name];
            reset();
        });
        inputsTable.append(tr);
    }

    function newMarket() {
        const seed = Number($("seed").value) || 1;
        market = makeMarket({ seed, days: Number($("days").value) });
        marketName = `a made-up market, seed ${seed}`;
        reset();
    }

    function reset() {
        stop();
        const opts = { inputs: { ...inputs }, fixed: $("fixed").checked, period: Number($("period").value), startAt: market.startAt };
        tester = createTester(market.ticks, opts);
        // the same market with the other version, for the comparison
        other = runTester(market.ticks, { ...opts, fixed: !opts.fixed });
        dayShown = null;
        draw();
    }

    function stop() { playing = false; clearTimeout(timer); $("play").textContent = "▶ Run"; }
    function play() {
        if (tester.done) reset();
        playing = true;
        $("play").textContent = "❚❚ Pause";
        const tickRun = () => {
            if (!playing) return;
            tester.step(Number($("speed").value));
            dayShown = null;
            draw();
            if (tester.done) { stop(); return; }
            timer = setTimeout(tickRun, 30);
        };
        tickRun();
    }
    $("play").addEventListener("click", () => playing ? stop() : play());
    $("to-end").addEventListener("click", () => { stop(); tester.step(Infinity); dayShown = null; draw(); });
    $("new-market").addEventListener("click", () => { $("seed").value = String(1 + Math.floor(Math.random() * 99999)); newMarket(); });
    $("seed").addEventListener("change", newMarket);
    $("days").addEventListener("change", newMarket);
    $("period").addEventListener("change", reset);
    $("fixed").addEventListener("change", reset);
    $("csv").addEventListener("change", async e => {
        const f = e.target.files[0];
        e.target.value = "";
        if (!f) return;
        const m = marketFromCSV(await f.text());
        if (m.ticks.length < 100) { $("market-note").textContent = `${f.name} doesn't look like MT4 history: date,time,open,high,low,close,volume.`; return; }
        market = m;
        marketName = f.name;
        reset();
    });

    // the days of the test, and which one the chart shows
    const DAY = 86400;
    const dayOf = t => t - t % DAY;
    function testDays() {
        const s = new Set();
        for (const t of market.ticks) if (t.time >= market.startAt) s.add(dayOf(t.time));
        return [...s].sort((a, b) => a - b);
    }
    $("prev-day").addEventListener("click", () => moveDay(-1));
    $("next-day").addEventListener("click", () => moveDay(1));
    function moveDay(dir) {
        const days = testDays(), cur = currentDay();
        const i = days.indexOf(cur);
        const j = Math.max(0, Math.min(days.length - 1, i + dir));
        dayShown = days[j];
        draw();
    }
    function currentDay() {
        if (dayShown !== null) return dayShown;
        const t = tester.tick ? tester.tick.time : market.startAt;
        return dayOf(Math.max(t, market.startAt));
    }

    const hm = s => { const [h, m] = s.split(":").map(Number); return h * 3600 + m * 60; };
    const weekday = t => new Date(t * 1000).toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
    const money = v => (v < 0 ? "−$" : "$") + Math.abs(v).toFixed(2);

    function draw() {
        const day = currentDay();
        const bars = tester.bars.filter(b => b.time >= day && b.time < day + DAY);
        const periodSec = tester.period * 60;
        const slots = DAY / periodSec;
        const L = 8, R = W - 64, T = 10, B = H - 22;
        const xOf = t => L + (t - day) / DAY * (R - L);
        let lo = Infinity, hi = -Infinity;
        for (const b of bars) { lo = Math.min(lo, b.low); hi = Math.max(hi, b.high); }
        const trades = tester.history.concat(tester.orders.map(o => ({ ...o, open: true })));
        for (const o of trades) {
            if (o.openTime >= day && o.openTime < day + DAY) { lo = Math.min(lo, o.openPrice); hi = Math.max(hi, o.openPrice); }
        }
        if (!Number.isFinite(lo)) { lo = 1.3500; hi = 1.3600; }
        const padY = (hi - lo) * 0.08 + 0.0002;
        lo -= padY; hi += padY;
        const yOf = p => B - (p - lo) / (hi - lo) * (B - T);

        ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
        // the EA's hours
        const shade = (from, to, color, label) => {
            const x1 = xOf(day + hm(from)), x2 = xOf(day + hm(to));
            ctx.fillStyle = color; ctx.fillRect(x1, T, x2 - x1, B - T);
            ctx.fillStyle = "#8a8a8a"; ctx.font = "11px system-ui, sans-serif"; ctx.fillText(label, x1 + 4, T + 12);
        };
        shade(inputs.samplingStartTime, inputs.samplingEndTime, "#1c1c1c", "sampling");
        shade(inputs.tradingStartTime, inputs.tradingEndTime, "#0e1a2c", "trading");
        // the price scale and the hours
        ctx.strokeStyle = "#262626"; ctx.fillStyle = "#bdbdbd"; ctx.font = "11px ui-monospace, monospace"; ctx.lineWidth = 1;
        const stepP = [0.0005, 0.001, 0.002, 0.005].find(s => (hi - lo) / s <= 8) || 0.01;
        for (let p = Math.ceil(lo / stepP) * stepP; p <= hi; p += stepP) {
            const y = Math.round(yOf(p)) + 0.5;
            ctx.beginPath(); ctx.moveTo(L, y); ctx.lineTo(R, y); ctx.stroke();
            ctx.fillText(p.toFixed(4), R + 6, y + 4);
        }
        for (let h = 0; h <= 24; h += 3) {
            const x = Math.round(xOf(day + h * 3600)) + 0.5;
            ctx.beginPath(); ctx.moveTo(x, T); ctx.lineTo(x, B); ctx.stroke();
            if (h < 24) ctx.fillText(`${String(h).padStart(2, "0")}:00`, x + 3, H - 7);
        }
        // the bars, in MT4's colors: green on black
        const bw = Math.max(1, (R - L) / slots * 0.6);
        for (const b of bars) {
            const x = xOf(b.time + periodSec / 2);
            ctx.strokeStyle = "#00ff00";
            ctx.beginPath(); ctx.moveTo(Math.round(x) + 0.5, yOf(b.high)); ctx.lineTo(Math.round(x) + 0.5, yOf(b.low)); ctx.stroke();
            const y1 = yOf(Math.max(b.open, b.close)), y2 = yOf(Math.min(b.open, b.close));
            ctx.fillStyle = b.close >= b.open ? "#000" : "#fff";
            ctx.fillRect(x - bw / 2, y1, bw, Math.max(1, y2 - y1));
            ctx.strokeRect(Math.round(x - bw / 2) + 0.5, Math.round(y1) + 0.5, Math.round(bw), Math.max(1, Math.round(y2 - y1)));
        }
        // the high and the low it found that day
        const st = tester.levels.get(day);
        if (st) {
            ctx.setLineDash([4, 4]);
            for (const [v, label] of [[st.hi, "hi"], [st.lo, "lo"]]) {
                if (v <= 0 || v > 90) continue;
                const y = Math.round(yOf(v)) + 0.5;
                ctx.strokeStyle = "#ffd400";
                ctx.beginPath(); ctx.moveTo(L, y); ctx.lineTo(R, y); ctx.stroke();
                ctx.fillStyle = "#ffd400"; ctx.fillText(label, L + 2, y - 3);
            }
            ctx.setLineDash([]);
        }
        // the orders: blue for a buy, red for a sell, white for a close, as the EA asks
        for (const o of trades) {
            const inDay = t => t >= day && t < day + DAY;
            const color = o.type === OP_BUY ? "#3b6bff" : "#ff3030";
            if (inDay(o.openTime)) arrow(xOf(o.openTime), yOf(o.openPrice), color, o.type === OP_BUY ? 1 : -1);
            if (!o.open && inDay(o.closeTime)) {
                ctx.setLineDash([2, 3]); ctx.strokeStyle = color;
                ctx.beginPath(); ctx.moveTo(xOf(o.openTime), yOf(o.openPrice)); ctx.lineTo(xOf(o.closeTime), yOf(o.closePrice)); ctx.stroke();
                ctx.setLineDash([]);
                arrow(xOf(o.closeTime), yOf(o.closePrice), "#fff", 0);
            }
        }
        const now = tester.tick && dayOf(tester.tick.time) === day ? tester.tick : null;
        if (now) {
            const y = Math.round(yOf(now.bid)) + 0.5;
            ctx.strokeStyle = "#888"; ctx.beginPath(); ctx.moveTo(L, y); ctx.lineTo(R, y); ctx.stroke();
            ctx.fillStyle = "#000"; ctx.fillRect(R + 2, y - 7, 60, 14);
            ctx.fillStyle = "#fff"; ctx.fillText(now.bid.toFixed(5), R + 5, y + 4);
        }

        const dateText = new Date(day * 1000).toISOString().slice(0, 10).replace(/-/g, ".");
        $("chart-day").textContent = `EURUSD,M${tester.period}  ${weekday(day)} ${dateText}` + (now ? `  ${fmtTime(now.time).slice(11)}` : "");
        const st2 = tester.ea?.state();
        $("ea-state").textContent = !st2 ? "The test hasn't started." :
            `The EA: ${st2.sampling ? "sampling" : st2.trading ? "trading" : "waiting"}` +
            `${st2.buyOpened ? ", a buy open" : st2.sellOpened ? ", a sell open" : ""}; its trading hours are set for ` +
            `${weekday(st2.tradingStartTimeDT)} ${fmtTime(st2.tradingStartTimeDT).slice(0, 16)} to ${fmtTime(st2.tradingEndTimeDT).slice(11, 16)}.`;
        showResults();
    }

    function arrow(x, y, color, dir) {
        ctx.fillStyle = color; ctx.strokeStyle = color;
        ctx.beginPath();
        if (dir === 1) { ctx.moveTo(x, y); ctx.lineTo(x - 5, y + 9); ctx.lineTo(x + 5, y + 9); }
        else if (dir === -1) { ctx.moveTo(x, y); ctx.lineTo(x - 5, y - 9); ctx.lineTo(x + 5, y - 9); }
        else { ctx.moveTo(x - 4, y); ctx.lineTo(x + 4, y); ctx.moveTo(x, y - 4); ctx.lineTo(x, y + 4); ctx.lineWidth = 2; ctx.stroke(); ctx.lineWidth = 1; return; }
        ctx.closePath(); ctx.fill();
    }

    function summary(h, days) {
        const pips = h.reduce((s, o) => s + o.pips, 0), profit = h.reduce((s, o) => s + o.profit, 0);
        const traded = new Set(h.map(o => dayOf(o.openTime))).size;
        return `${h.length} trade${h.length === 1 ? "" : "s"} on ${traded} of ${days} days, ${pips >= 0 ? "+" : "−"}${Math.abs(pips).toFixed(1)} pips, ${money(profit)}`;
    }

    function showResults() {
        const days = testDays().length;
        const version = $("fixed").checked ? "Fixed" : "As written";
        $("summary").textContent = `${version}, on ${marketName}: ${tester.done ? "" : "so far, "}${summary(tester.history, days)}` +
            (tester.done ? `. The other version, on the same market: ${summary(other.history, days)}.` : ".");
        const tbody = $("history");
        tbody.replaceChildren();
        const rows = tester.history.concat(tester.orders.map(o => ({ ...o, open: true })));
        for (const o of rows) {
            const tr = document.createElement("tr");
            const cells = [o.ticket, fmtTime(o.openTime).slice(0, 16), o.type === OP_BUY ? "buy" : "sell", o.lots.toFixed(2), o.openPrice.toFixed(5),
                o.open ? "open" : fmtTime(o.closeTime).slice(0, 16) + (o.atEnd ? " (end of test)" : ""), o.open ? "" : o.closePrice.toFixed(5),
                o.open ? "" : o.pips.toFixed(1), o.open ? "" : money(o.profit)];
            for (const c of cells) { const td = document.createElement("td"); td.textContent = c; tr.append(td); }
            tr.addEventListener("click", () => { dayShown = dayOf(o.openTime); draw(); });
            tbody.append(tr);
        }
        if (!rows.length) tbody.innerHTML = `<tr><td colspan="9" class="none">No trades yet.</td></tr>`;
        // the log of the day on the chart
        const logEl = $("journal"), day = currentDay();
        const lines = tester.log.filter(l => l.time >= day && l.time < day + DAY)
            .map(l => `${fmtTime(l.time)}  ${l.system ? "" : "Trader EURUSD,M" + tester.period + ": "}${l.text}`);
        logEl.textContent = lines.join("\n") || "Nothing on this day.";
        logEl.parentElement.scrollTop = logEl.parentElement.scrollHeight;
    }

    for (const b of document.querySelectorAll("[data-tab]")) {
        b.addEventListener("click", () => {
            for (const x of document.querySelectorAll("[data-tab]")) x.setAttribute("aria-selected", String(x === b));
            for (const p of document.querySelectorAll(".tabpanel")) p.hidden = p.id !== b.dataset.tab;
        });
    }

    $("source-java").textContent = SOURCE_JAVA;
    $("source-mql").textContent = SOURCE_MQL;
    newMarket();
})();
