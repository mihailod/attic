// Mortgage or Invest? — JavaScript port of im.java (Mihailo Despotovic, May 2008)
// You have savings equal to the price of a house. Either pay cash, or take a mortgage for the
// same amount and invest the savings. With the mortgage, the portfolio grows each year (its gains
// taxed), makes the year's mortgage payments, and gets back the tax saved by deducting the
// mortgage interest. Once the mortgage is paid off, whatever is left in the portfolio is what
// investing gained over paying cash, which leaves nothing.
//
// Changes from the original:
//  - Bug fix: the original paid only the mortgage interest out of the portfolio, never the
//    principal, and then subtracted the total interest a second time at the end. With its
//    assumptions it answered $533; the right answer is $47,404.
//  - The original's hard-coded table of yearly interest for a $100K, 6%, 30-year mortgage is now
//    computed from monthly amortization (it matches the table to the cent), so every
//    assumption can be changed.
//  - The original's $200K income is gone: it cancelled out of the tax saved on the interest.

const $ = id => document.getElementById(id);
const money = (x, cents = false) => (x < 0 && Math.abs(x) >= (cents ? 0.005 : 0.5) ? "−$" : "$")
    + Math.abs(x).toLocaleString("en-US", { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 });

// the interest paid in each year of a mortgage with monthly payments
function yearlyInterest(principal, ratePercent, years) {
    const r = ratePercent / 100 / 12;
    const n = years * 12;
    const payment = r === 0 ? principal / n : principal * r / (1 - Math.pow(1 + r, -n));
    let balance = principal;
    const interest = [];
    for (let y = 0; y < years; y++) {
        let sum = 0;
        for (let m = 0; m < 12; m++) {
            const i = balance * r;
            sum += i;
            balance -= payment - i;
        }
        interest.push(sum);
    }
    return { payment, interest };
}

function calculate() {
    const amount = Number($("amount").value);
    const mortgageRate = Number($("rate").value);
    const years = Number($("years").value);
    const portfolioApr = Number($("apr").value);
    const taxRate = Number($("tax").value);

    if (!(amount > 0)) return error("The amount must be more than 0.");
    if (!(mortgageRate >= 0 && mortgageRate <= 50)) return error("The mortgage rate must be between 0% and 50%.");
    if (!(Number.isInteger(years) && years >= 1 && years <= 50)) return error("The term must be a whole number of years from 1 to 50.");
    if (!(portfolioApr >= -50 && portfolioApr <= 50)) return error("The portfolio return must be between −50% and 50%.");
    if (!(taxRate >= 0 && taxRate < 100)) return error("The tax rate must be at least 0% and below 100%.");

    const taxMultiplier = (100 - taxRate) / 100;
    const { payment, interest } = yearlyInterest(amount, mortgageRate, years);
    const yearlyPayment = payment * 12;

    // for each year compound the profit
    let currentBalance = amount;
    let totalInterest = 0;
    const rows = [];
    for (let i = 0; i < years; i++) {
        const gain = currentBalance * portfolioApr / 100 * taxMultiplier;
        const out = interest[i];
        const interestTaxReturn = out * taxRate / 100;
        currentBalance += gain - yearlyPayment + interestTaxReturn;
        totalInterest += out;
        rows.push([i + 1, gain, out, interestTaxReturn, currentBalance]);
    }

    $("summary").textContent = Math.abs(currentBalance) < 0.5
        ? `It’s a tie: after ${years} years the mortgage is paid off and the portfolio is empty, the same as paying cash.`
        : currentBalance > 0
        ? `Investing wins: after ${years} years the mortgage is paid off and the portfolio still holds ${money(currentBalance)}. Paying cash would leave nothing.`
        : `Paying cash wins: investing falls ${money(-currentBalance)} short of paying off the mortgage.`;
    $("details").textContent = `Mortgage payments ${money(payment, true)} a month (${money(yearlyPayment, true)} a year), `
        + `${money(totalInterest)} in interest over ${years} years. `
        + `After tax, the portfolio earns ${fmt(portfolioApr * taxMultiplier)}% and the mortgage costs ${fmt(mortgageRate * taxMultiplier)}%.`;

    const tbody = $("table").tBodies[0];
    tbody.replaceChildren(...rows.map(r => {
        const tr = document.createElement("tr");
        r.forEach((v, k) => {
            const td = document.createElement("td");
            td.textContent = k === 0 ? v : money(v);
            if (k === 4 && v < 0) td.className = "negative";
            tr.append(td);
        });
        return tr;
    }));
    $("table").hidden = false;
}

const fmt = x => Number(x.toFixed(2)).toString();

function error(text) {
    $("summary").textContent = text;
    $("details").textContent = "";
    $("table").hidden = true;
}

$("form").addEventListener("submit", e => {
    e.preventDefault();
    calculate();
});
calculate();
