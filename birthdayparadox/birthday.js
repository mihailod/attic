// The Birthday Paradox — JavaScript port of BP.java (Mihailo Despotovic, September 2005)
// In a room of n people, what is the chance that at least two share a birthday? The chance that all
// n birthdays differ is 365/365 · 364/365 · … · (365 − n + 1)/365, and the answer is 1 minus that.
// It passes 50% at just 23 people. Leap years are ignored, as in the original.
// The page adds a chart, and a room filled with random birthdays to try it out.

const DAYS = 365;
const MAX_PEOPLE = 89; // the original's table went from 0 to 89 people

function probability(people) {
    let p = 1;
    for (let i = 0; i < people; i++) p *= (DAYS - i) / DAYS;
    return 1 - p;
}

const $ = id => document.getElementById(id);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const SVG_NS = "http://www.w3.org/2000/svg";

let people = 23;
let rooms = 0, roomsWithMatch = 0;

const percent = (p, digits = 1) => {
    const v = 100 * p;
    if (v > 0 && v < 0.1) return "less than 0.1%";
    if (v < 100 && v > 99.99) return "more than 99.99%";
    return (v >= 99.9 && v < 100 ? v.toFixed(2) : v.toFixed(digits)) + "%";
};

function setPeople(n) {
    people = Math.max(1, Math.min(MAX_PEOPLE, Math.round(n) || 1));
    $("people").value = people;
    $("people-range").value = people;
    $("answer").textContent = `With ${people} ${people === 1 ? "person" : "people"}, the chance that at least two share a birthday is ${percent(probability(people))}.`;
    drawChart();
    resetTally();
}

// ---- the chart ----

const CW = 640, CH = 260, L = 44, R = 12, T = 12, B = 32;
const cx = n => L + (n / MAX_PEOPLE) * (CW - L - R);
const cy = p => T + (1 - p) * (CH - T - B);

function el(parent, name, attrs, text) {
    const e = document.createElementNS(SVG_NS, name);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    if (text !== undefined) e.textContent = text;
    parent.append(e);
    return e;
}

function drawChart() {
    const svg = $("chart");
    svg.replaceChildren();
    for (const p of [0, 0.25, 0.5, 0.75, 1]) {
        el(svg, "line", { x1: L, x2: CW - R, y1: cy(p), y2: cy(p), class: "grid" });
        el(svg, "text", { x: L - 6, y: cy(p) + 4, class: "ylabel" }, 100 * p + "%");
    }
    for (let n = 0; n <= MAX_PEOPLE; n += 10) {
        el(svg, "text", { x: cx(n), y: CH - B + 16, class: "xlabel" }, n);
    }
    el(svg, "text", { x: (L + CW - R) / 2, y: CH - 2, class: "xlabel" }, "people in the room");

    // famous points
    for (const [n, label] of [[23, "23 people: 50.7%"], [57, "57 people: 99.0%"]]) {
        el(svg, "line", { x1: cx(n), x2: cx(n), y1: cy(0), y2: cy(probability(n)), class: "mark" });
        el(svg, "text", { x: cx(n) + 5, y: cy(probability(n)) + 16, class: "marklabel" }, label);
    }

    let d = "";
    for (let n = 0; n <= MAX_PEOPLE; n++) d += (n ? "L" : "M") + cx(n).toFixed(1) + "," + cy(probability(n)).toFixed(1);
    el(svg, "path", { d, class: "curve" });

    el(svg, "circle", { cx: cx(people), cy: cy(probability(people)), r: 6, class: "current" });
}

// click or drag on the chart to pick the number of people
function chartPick(e) {
    const r = $("chart").getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * CW;
    setPeople(((x - L) / (CW - L - R)) * MAX_PEOPLE);
}
let chartDragging = false;
$("chart").addEventListener("pointerdown", e => { chartDragging = true; $("chart").setPointerCapture(e.pointerId); chartPick(e); });
$("chart").addEventListener("pointermove", e => { if (chartDragging) chartPick(e); });
$("chart").addEventListener("pointerup", () => { chartDragging = false; });

// ---- a room of random birthdays ----

const dayOfYear = (month, day) => MONTH_DAYS.slice(0, month).reduce((a, b) => a + b, 0) + day;

function randomRoom(n) {
    const counts = new Array(DAYS).fill(0);
    for (let i = 0; i < n; i++) counts[Math.floor(Math.random() * DAYS)]++;
    return counts;
}

function fillRoom() {
    const counts = randomRoom(people);
    const shared = [];
    const cal = $("calendar");
    cal.replaceChildren();
    MONTH_DAYS.forEach((days, m) => {
        const row = document.createElement("div");
        row.className = "month";
        const name = document.createElement("span");
        name.className = "month-name";
        name.textContent = MONTHS[m];
        row.append(name);
        for (let d = 0; d < days; d++) {
            const c = counts[dayOfYear(m, d)];
            const cell = document.createElement("span");
            cell.className = "day" + (c === 1 ? " one" : c > 1 ? " shared" : "");
            cell.title = `${MONTH_NAMES[m]} ${d + 1}` + (c ? `: ${c} ${c === 1 ? "person" : "people"}` : "");
            if (c > 1) {
                cell.textContent = c;
                shared.push(`${MONTH_NAMES[m]} ${d + 1}` + (c > 2 ? ` (${c} people)` : ""));
            }
            row.append(cell);
        }
        cal.append(row);
    });
    $("room-result").textContent = shared.length
        ? `Shared birthday${shared.length > 1 ? "s" : ""}: ${shared.join(", ")}.`
        : "No two people share a birthday this time.";
    $("room-result").className = shared.length ? "match" : "";
    tally(1, shared.length ? 1 : 0);
}

function fillManyRooms(count) {
    let matches = 0;
    for (let r = 0; r < count; r++) if (randomRoom(people).some(c => c > 1)) matches++;
    tally(count, matches);
}

function tally(count, matches) {
    rooms += count;
    roomsWithMatch += matches;
    $("tally").textContent = `Rooms of ${people} filled so far: ${rooms.toLocaleString("en-US")}, with a shared birthday in `
        + `${roomsWithMatch.toLocaleString("en-US")} (${percent(roomsWithMatch / rooms)}). The formula says ${percent(probability(people))}.`;
}

function resetTally() {
    rooms = 0;
    roomsWithMatch = 0;
    $("tally").textContent = "";
    $("calendar").replaceChildren();
    $("room-result").textContent = "";
}

// ---- the original table ----

function fillTable() {
    const rows = [];
    for (let n = 0; n <= MAX_PEOPLE; n++) rows.push(`${String(n).padStart(2)} --- ${percent(probability(n), 2)}`);
    $("table").textContent = "People --- Probability\n" + rows.join("\n");
}

$("people").addEventListener("input", () => setPeople(Number($("people").value)));
$("people-range").addEventListener("input", () => setPeople(Number($("people-range").value)));
$("fill").addEventListener("click", fillRoom);
$("fill-many").addEventListener("click", () => fillManyRooms(1000));
fillTable();
setPeople(23);
