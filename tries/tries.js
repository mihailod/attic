// Odds of Success over Repeated Tries — JavaScript port of Try.java (Mihailo Despotovic, June 2008)
// If each try succeeds with probability p, how many tries until the chance of
// at least one success reaches the cutoff? Adds up p * (1 - p)^i, the chance
// that the first success comes on try i + 1, until the total reaches the cutoff.

const MAX_TRIES = 100000; // stop there: with a tiny p, or a cutoff of 100%, it could run forever

const $ = id => document.getElementById(id);

function calculate() {
    const p = Number($("p").value) / 100;
    const cutoff = Number($("cutoff").value) / 100;

    if (!(p > 0 && p <= 1)) return show("The chance per try must be more than 0% and at most 100%.", []);
    if (!(cutoff > 0 && cutoff <= 1)) return show("The target must be more than 0% and at most 100%.", []);

    const lines = [];
    let res = 0;
    let i = 0;
    while (res < cutoff && i < MAX_TRIES) {
        res += p * Math.pow(1 - p, i);
        lines.push("After " + (i + 1) + " tries, p = " + res);
        i++;
    }

    // 2 decimals, or more when rounding would make a chance still below the target look like it reached it
    const percent = x => {
        let decimals = 2;
        while (decimals < 15 && x < cutoff && Number((100 * x).toFixed(decimals)) >= 100 * cutoff) decimals++;
        return (100 * x).toFixed(decimals).replace(/\.?0+$/, "") + "%";
    };
    const summary = res >= cutoff
        ? `${i} ${i === 1 ? "try" : "tries"} to reach ${percent(cutoff)} (the chance is then ${percent(res)}).`
        : `Still below ${percent(cutoff)} after ${MAX_TRIES.toLocaleString("en-US")} tries (the chance is ${percent(res)}), so I stopped.`;
    show(summary, lines);
}

function show(summary, lines) {
    $("summary").textContent = summary;
    $("output").textContent = lines.join("\n");
    $("output").hidden = lines.length === 0;
}

$("form").addEventListener("submit", e => {
    e.preventDefault();
    calculate();
});

calculate();
