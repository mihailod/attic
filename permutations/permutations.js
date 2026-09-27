// Permutations by Insertion — JavaScript port of Permutations.java (Mihailo Despotovic, May 2009)
// Every ordering of the letters of a word, by recursion: find the permutations of all but the last
// letter, then insert the last letter into every position of each of them. A word of n letters has
// n! permutations. With repeated letters some of them are the same, which the original counted too;
// the page can also show only the different ones.

const MAX_LETTERS = 8;       // 8! = 40,320; 10 letters would be 3,628,800
const MAX_STEP_ROWS = 120;   // the step-by-step view shows levels up to this many permutations

function allPerms(a) {
    const v = [];
    if (a.length <= 1) {
        v.push(a);
    } else {
        const allButLastChar = a.substring(0, a.length - 1);
        const lastChar = a.substring(a.length - 1);
        for (const curr of allPerms(allButLastChar)) {
            for (let j = 0; j < a.length; j++) v.push(generateSimplePerm(curr, lastChar, j));
        }
    }
    return v;
}

// s with c inserted at position
function generateSimplePerm(s, c, position) {
    return s.substring(0, position) + c + s.substring(position);
}

const factorial = n => (n <= 1 ? 1 : n * factorial(n - 1));

if (typeof module !== "undefined") module.exports = { allPerms, generateSimplePerm, factorial };

// ---- UI ----

if (typeof document !== "undefined") {
    const $ = id => document.getElementById(id);
    const letters = s => [...s];   // so letters like é count once

    // a permutation with the letter inserted at `position` highlighted
    function highlighted(p, position) {
        const span = document.createElement("span");
        span.className = "perm";
        const chars = letters(p);
        chars.forEach((ch, k) => {
            if (k === position) {
                const b = document.createElement("b");
                b.textContent = ch;
                span.append(b);
            } else span.append(ch);
        });
        return span;
    }

    function show() {
        const input = $("word").value.replace(/\s+/g, "");
        const chars = letters(input);
        if (chars.length > MAX_LETTERS) {
            $("summary").textContent = `Up to ${MAX_LETTERS} letters, please: ${chars.length} letters would have ${factorial(chars.length).toLocaleString("en-US")} permutations.`;
            $("steps").replaceChildren();
            $("list").textContent = "";
            return;
        }
        // work on an array of letters, so the recursion also handles letters made of two code units
        const perms = allPerms(chars.map((c, k) => String.fromCharCode(0xe000 + k)).join(""))
            .map(p => [...p].map(c => chars[c.charCodeAt(0) - 0xe000]).join(""));
        const distinct = [...new Set(perms)];
        const n = chars.length;

        let summary = n === 0 ? "Type a word." : `${n} letter${n === 1 ? "" : "s"}: ${n}! = ${factorial(n).toLocaleString("en-US")} permutation${factorial(n) === 1 ? "" : "s"}`;
        if (n > 0 && distinct.length < perms.length) {
            const repeats = [...new Set(chars.filter(c => chars.indexOf(c) !== chars.lastIndexOf(c)))];
            summary += `, but only ${distinct.length.toLocaleString("en-US")} different ones, because ${repeats.join(", ")} repeat${repeats.length === 1 ? "s" : ""}`;
        }
        $("summary").textContent = n === 0 ? summary : summary + ".";
        $("distinct-row").hidden = distinct.length === perms.length;

        // step by step: each level inserts the next letter into every gap of the previous level's words
        const steps = $("steps");
        steps.replaceChildren();
        let level = n ? [chars[0]] : [];
        if (n) {
            const first = document.createElement("div");
            first.className = "level";
            first.innerHTML = `<div class="level-head">Start with <b></b></div>`;
            first.querySelector("b").textContent = chars[0];
            steps.append(first);
        }
        for (let k = 1; k < n; k++) {
            const next = [];
            const div = document.createElement("div");
            div.className = "level";
            const head = document.createElement("div");
            head.className = "level-head";
            const count = level.length * (k + 1);
            head.innerHTML = `Insert <b></b> into each of the ${level.length.toLocaleString("en-US")} word${level.length === 1 ? "" : "s"}, at each of ${k + 1} positions: ${count.toLocaleString("en-US")} words`;
            head.querySelector("b").textContent = chars[k];
            div.append(head);
            const tooMany = count > MAX_STEP_ROWS;
            for (const word of level) {
                const row = document.createElement("div");
                row.className = "row";
                if (!tooMany) {
                    const from = document.createElement("span");
                    from.className = "from";
                    from.textContent = word;
                    row.append(from, " → ");
                }
                const w = letters(word);
                for (let j = 0; j <= w.length; j++) {
                    const p = [...w.slice(0, j), chars[k], ...w.slice(j)].join("");
                    next.push(p);
                    if (!tooMany) row.append(highlighted(p, j), " ");
                }
                if (!tooMany) div.append(row);
            }
            if (tooMany) {
                const note = document.createElement("div");
                note.className = "row more";
                note.textContent = "(too many to show here; the full list is below)";
                div.append(note);
            }
            steps.append(div);
            level = next;
        }

        // the list, in the original's order
        const list = $("distinct").checked ? distinct : perms;
        $("list-head").textContent = `String '${input}', number of permutations: ${list.length.toLocaleString("en-US")}`
            + ($("distinct").checked && distinct.length < perms.length ? " (different ones only)" : "");
        $("list").textContent = list.join(" ");
    }

    $("word").addEventListener("input", show);
    $("distinct").addEventListener("change", show);
    for (const b of document.querySelectorAll("[data-word]")) {
        b.addEventListener("click", () => { $("word").value = b.dataset.word; show(); });
    }
    show();
}
