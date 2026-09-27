"use strict";

// The Expert Advisor from the bottom of Trader.java, an MQL4 program for MetaTrader 4 (December 2013), ported line
// by line, with a small MetaTrader 4 around it: prices, bars, orders and the Experts log. With `fixed` on, its bugs
// are fixed.

const OP_BUY = 0, OP_SELL = 1, OP_BUYSTOP = 4, OP_SELLSTOP = 5;
const PERIOD_D1 = 1440;

// MQL4 before build 600 (February 2014) turned a double into a string with 4 decimals, and a datetime into its number
const mq = v => typeof v === "number" && !Number.isInteger(v) ? v.toFixed(4) : String(v);
const mqd = v => typeof v === "number" ? v.toFixed(4) : String(v);

const DEFAULT_INPUTS = {
    samplingStartTime: "11:00", samplingEndTime: "13:30",
    tradingStartTime: "13:31", tradingEndTime: "17:00",
    lots: 0.1, pipsEntry: 0.0004, pipsProfit: 0.002, positiveStopSell: 0.0004, negativeStopSell: 0.003, debug: true,
};

function createEA(rt, inputs, fixed) {
    const MAGICMA = 87265234, SLIPPAGE = 3;
    const COLOR_CLOSE = "White", COLOR_OPEN_BUY = "Blue", COLOR_OPEN_SELL = "Red";
    const DUMMY_LO = 99999999, DUMMY_HI = -1;
    const { samplingStartTime, samplingEndTime, tradingStartTime, tradingEndTime, lots, pipsEntry, positiveStopSell, negativeStopSell, debug } = inputs;

    let sampling = false, trading = false;
    let lo = DUMMY_LO, hi = DUMMY_HI;
    let samplingStartTimeDT, samplingEndTimeDT, tradingStartTimeDT, tradingEndTimeDT;
    let day = -1;
    let buyOpened = false, buyClosed = false, sellOpened = false, sellClosed = false;

    const d = s => { if (debug) rt.Print(s); };

    function init() {
        samplingStartTimeDT = rt.StrToTime(samplingStartTime);
        samplingEndTimeDT = rt.StrToTime(samplingEndTime);
        tradingStartTimeDT = rt.StrToTime(tradingStartTime);
        tradingEndTimeDT = rt.StrToTime(tradingEndTime);
        day = rt.TimeDayOfWeek(rt.TimeCurrent());
        return 0;
    }

    function start() {
        if (badInputs()) return 0;
        if (!rt.IsTradeAllowed()) { d("Trade not allowed!"); return 0; }
        determineProgramMode();
        if (sampling) {
            sample();
        } else if (fixed && !trading && (buyOpened || sellOpened)) {
            // fixed: a position still open after the trading hours is still looked after, though no new one is opened
            if (CalculateCurrentOrders(rt.Symbol()) !== 0) { rt.RefreshRates(); checkForClose(); }
        } else if (trading) {
            const numOrders = CalculateCurrentOrders(rt.Symbol());
            if (numOrders > 1 || numOrders < -1) {
                rt.Print("Multiple existing orders detected: " + numOrders + ", bailing out...");
                return 0;
            }
            trade(numOrders);
        }
    }

    function determineProgramMode() {
        const currentTime = rt.TimeCurrent();
        if (currentTime >= samplingStartTimeDT && currentTime <= samplingEndTimeDT) {
            sampling = true; trading = false;
        } else if (currentTime >= tradingStartTimeDT && currentTime <= tradingEndTimeDT) {
            trading = true; sampling = false;
        } else {
            trading = false; sampling = false;
        }

        const dayNow = rt.TimeDayOfWeek(rt.TimeCurrent());
        if (day !== dayNow && !buyOpened && !sellOpened) {
            d("A new day detected!");
            // a new day begins, reset everything
            // this assumes no trading is done around midnight!
            day = dayNow;
            buyOpened = false; buyClosed = false; sellOpened = false; sellClosed = false;
            trading = false; sampling = false;
            lo = DUMMY_LO; hi = DUMMY_HI;

            d("old time: " + samplingStartTimeDT);
            if (fixed) {
                // fixed: today's times, however many days have passed
                samplingStartTimeDT = rt.StrToTime(samplingStartTime);
                samplingEndTimeDT = rt.StrToTime(samplingEndTime);
                tradingStartTimeDT = rt.StrToTime(tradingStartTime);
                tradingEndTimeDT = rt.StrToTime(tradingEndTime);
            } else {
                samplingStartTimeDT += 86400;
                samplingEndTimeDT += 86400;
                tradingStartTimeDT += 86400;
                tradingEndTimeDT += 86400;
            }
            d("new time: " + samplingStartTimeDT);
        }

        if (lo === DUMMY_LO || hi === DUMMY_HI) trading = false;
    }

    function sample() {
        const Bid = rt.Bid();
        if (fixed) {
            // fixed: both ends, and the new values in the log
            if (Bid > hi) { hi = Bid; d("Sampling reached new hi: " + mqd(hi)); }
            if (Bid < lo) { lo = Bid; d("Sampling reached new lo: " + mqd(lo)); }
            return;
        }
        if (Bid > hi) {
            d("Sampling reached new hi: " + mqd(hi));
            hi = Bid;
        } else if (Bid < lo) {
            d("Sampling reached new lo: " + mqd(lo));
            lo = Bid;
        }
    }

    function trade(numOrders) {
        rt.RefreshRates();
        if (numOrders === 0) checkForOpen();
        else checkForClose();
    }

    function checkForOpen() {
        let res;
        if (isOkForBuy()) {
            const exp = rt.CurTime() + 60 * PERIOD_D1;
            res = rt.OrderSend(rt.Symbol(), OP_BUY, lots, rt.Ask(), SLIPPAGE, 0, 0, "", MAGICMA, exp, COLOR_OPEN_BUY);
            if (res === -1) rt.Print("Error buying: " + rt.GetLastError());
            else buyOpened = true;
            return;
        } else if (isOkForSell()) {
            res = rt.OrderSend(rt.Symbol(), OP_SELL, lots, rt.Bid(), SLIPPAGE, 0, 0, "", MAGICMA, 0, COLOR_OPEN_SELL);
            if (res === -1) rt.Print("Error opening sell: " + rt.GetLastError());
            else sellOpened = true;
            return;
        }
    }

    function isOkForSell() {
        const Bid = rt.Bid();
        // as written: anywhere below 4 pips above the low; fixed: 4 pips below it, as the buy is above the high
        const signal = fixed ? lo - Bid > pipsEntry : Bid - lo < pipsEntry;
        if (signal && !buyOpened && !sellClosed) {
            d("selling because bid " + mqd(Bid) + " - lo " + mqd(lo) + " < pips: " + mqd(Bid - lo));
            return true;
        }
        return false;
    }

    function isOkForBuy() {
        return rt.Ask() - hi > pipsEntry && !sellOpened && !buyClosed;
    }

    function checkForClose() {
        let closed;
        const otot = rt.OrdersTotal();
        for (let i = otot - 1; i >= 0; i--) {
            if (rt.OrderSelect(i) === false) break;
            if (rt.OrderMagicNumber() !== MAGICMA || rt.OrderSymbol() !== rt.Symbol()) continue;
            // at this point we found our open order and we need to close it
            if (rt.OrderType() === OP_BUY) {
                if (closeBuy()) {
                    closed = rt.OrderClose(rt.OrderTicket(), rt.OrderLots(), rt.Bid(), SLIPPAGE, COLOR_CLOSE);
                    if (!closed) rt.Print("Error closing buy order " + rt.OrderTicket() + " - " + rt.GetLastError());
                    else { buyOpened = false; buyClosed = true; }
                }
            } else if (rt.OrderType() === OP_SELL) {
                if (closeSell()) {
                    closed = rt.OrderClose(rt.OrderTicket(), rt.OrderLots(), rt.Ask(), SLIPPAGE, COLOR_CLOSE);
                    if (!closed) rt.Print("Error closing sell order " + rt.OrderTicket() + " - " + rt.GetLastError());
                    else { sellOpened = false; sellClosed = true; }
                }
            }
        }
    }

    function closeSell() {
        const positive = rt.Ask() > rt.High(1) + positiveStopSell;
        if (positive) return positive;
        // as written: the stop loss 4 pips away, positiveStopSell; fixed: negativeStopSell, as for the buy
        const negative = rt.OrderOpenPrice() + (fixed ? negativeStopSell : positiveStopSell) <= rt.Ask();
        return negative;
    }

    function closeBuy() {
        const positive = rt.Bid() < rt.Low(1) - positiveStopSell;
        if (positive) return true;
        const negative = rt.OrderOpenPrice() - negativeStopSell >= rt.Bid();
        return negative;
    }

    function CalculateCurrentOrders(symbol) {
        let buys = 0, sells = 0;
        const ot = rt.OrdersTotal();
        for (let i = ot - 1; i >= 0; i--) {
            if (rt.OrderSelect(i) === false) { rt.Print("Select failed!"); break; }
            if (rt.OrderSymbol() === symbol && rt.OrderMagicNumber() === MAGICMA) {
                if (rt.OrderType() === OP_BUY || rt.OrderType() === OP_BUYSTOP) buys++;
                else if (rt.OrderType() === OP_SELL || rt.OrderType() === OP_SELLSTOP) sells++;
            }
        }
        return buys > 0 ? buys : -sells;
    }

    function badInputs() { return false; } // todo

    return { init, start, state: () => ({ sampling, trading, lo, hi, samplingStartTimeDT, tradingStartTimeDT, tradingEndTimeDT, buyOpened, sellOpened }) };
}

// ---------------------------------------------------------------------------------------------------------
// A small MetaTrader 4 strategy tester: every tick, in order, with bars of `period` minutes

const pad = n => String(n).padStart(2, "0");
const fmtTime = t => { const d = new Date(t * 1000); return `${d.getUTCFullYear()}.${pad(d.getUTCMonth() + 1)}.${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`; };

function createTester(ticks, { inputs = DEFAULT_INPUTS, fixed = false, period = 15, spread = 0.00012, symbol = "EURUSD", startAt = 0 } = {}) {
    const log = [];
    const orders = [], history = [];
    const bars = [];
    let tick = null, selected = null, ticket = 0;
    const barStart = t => t - t % (period * 60);
    const addTick = tk => {
        const bs = barStart(tk.time);
        const last = bars[bars.length - 1];
        if (!last || last.time !== bs) bars.push({ time: bs, open: tk.bid, high: tk.bid, low: tk.bid, close: tk.bid });
        else { last.high = Math.max(last.high, tk.bid); last.low = Math.min(last.low, tk.bid); last.close = tk.bid; }
    };
    const rt = {
        Symbol: () => symbol,
        Bid: () => tick.bid,
        Ask: () => +(tick.bid + spread).toFixed(5),
        High: i => bars[bars.length - 1 - i]?.high ?? 0,
        Low: i => bars[bars.length - 1 - i]?.low ?? 0,
        TimeCurrent: () => tick.time,
        CurTime: () => tick.time,
        TimeDayOfWeek: t => new Date(t * 1000).getUTCDay(),
        StrToTime: s => { const [h, m] = s.split(":").map(Number); const day = tick.time - tick.time % 86400; return day + h * 3600 + m * 60; },
        IsTradeAllowed: () => true,
        RefreshRates: () => true,
        GetLastError: () => 0,
        Print: s => log.push({ time: tick.time, text: s }),
        OrderSend(sym, type, lots, price, slippage, sl, tp, comment, magic, expiration, color) {
            const o = { ticket: ++ticket, symbol: sym, type, lots, openPrice: price, openTime: tick.time, magic, color };
            orders.push(o);
            log.push({ time: tick.time, text: `open #${o.ticket} ${type === OP_BUY ? "buy" : "sell"} ${lots.toFixed(2)} ${sym} at ${price.toFixed(5)} ok`, system: true });
            return o.ticket;
        },
        OrdersTotal: () => orders.length,
        OrderSelect(i) { selected = orders[i]; return !!selected; },
        OrderMagicNumber: () => selected.magic,
        OrderSymbol: () => selected.symbol,
        OrderType: () => selected.type,
        OrderTicket: () => selected.ticket,
        OrderLots: () => selected.lots,
        OrderOpenPrice: () => selected.openPrice,
        OrderClose(tk, lots, price) {
            const k = orders.findIndex(o => o.ticket === tk);
            if (k < 0) return false;
            const [o] = orders.splice(k, 1);
            const pips = (o.type === OP_BUY ? price - o.openPrice : o.openPrice - price) * 10000;
            history.push({ ...o, closePrice: price, closeTime: tick.time, pips, profit: pips * 10 * o.lots });   // $10 a pip for a lot of EUR/USD
            log.push({ time: tick.time, text: `close #${o.ticket} ${o.type === OP_BUY ? "buy" : "sell"} ${o.lots.toFixed(2)} ${o.symbol} at ${o.openPrice.toFixed(5)} at price ${price.toFixed(5)}`, system: true });
            return true;
        },
    };
    let ea = null, k = 0, finished = false;
    const levels = new Map();
    const tester = {
        log, history, orders, bars, period, levels,
        get ea() { return ea; }, get tick() { return tick; }, get done() { return finished; }, get position() { return k; },
        // runs the next n ticks; at the end, what is still open is closed at the last price, as MT4's tester does
        step(n) {
            for (let m = 0; m < n && k < ticks.length; m++, k++) {
                tick = ticks[k];
                addTick(tick);
                if (tick.time < startAt) continue;       // history before the test starts, for the bars
                if (!ea) { ea = createEA(rt, inputs, fixed); ea.init(); }
                ea.start();
                const st = ea.state();          // the high and low the EA has, for each day, for the chart
                if (st.hi > 0 && st.lo < 90) levels.set(tick.time - tick.time % 86400, { hi: st.hi, lo: st.lo });
            }
            if (k >= ticks.length && !finished) {
                finished = true;
                for (const o of [...orders]) {
                    selected = o;
                    rt.OrderClose(o.ticket, o.lots, o.type === OP_BUY ? tick.bid : rt.Ask());
                    history[history.length - 1].atEnd = true;
                }
            }
            return tester;
        },
    };
    return tester;
}

function runTester(ticks, options) { return createTester(ticks, options).step(Infinity); }

// ---------------------------------------------------------------------------------------------------------
// A made-up EUR/USD market: ticks every few seconds on weekdays, calmer at night, and some afternoons with a trend

function makeMarket({ seed = 1, startDay = Date.UTC(2013, 11, 2) / 1000, days = 10, price = 1.3580 } = {}) {
    let s = seed >>> 0 || 1;
    const rnd = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
    const gauss = () => { let u = 0; for (let k = 0; k < 6; k++) u += rnd(); return (u - 3) / Math.SQRT1_2 / 1.414; };
    const ticks = [];
    let day = startDay - 86400 * 3;                   // three days of history before the test, for the bars
    const end = startDay + 86400 * days;
    for (; day < end; day += 86400) {
        const wd = new Date(day * 1000).getUTCDay();
        if (wd === 0 || wd === 6) continue;
        const trend = rnd() < 0.5 ? (rnd() < 0.5 ? 1 : -1) * (0.3 + rnd()) * 0.000004 : 0;
        for (let t = day; t < day + 86400;) {
            const hour = (t - day) / 3600;
            const busy = hour >= 7 && hour < 18 ? 1 : 0.4;
            price += gauss() * 0.00006 * busy + (hour >= 13.5 && hour < 17 ? trend : 0);
            ticks.push({ time: t, bid: +price.toFixed(5) });
            t += 5 + Math.floor(rnd() * (busy === 1 ? 25 : 70));
        }
    }
    return { ticks, startAt: startDay };
}

// MetaTrader 4 history, exported as CSV of 1-minute bars: date,time,open,high,low,close,volume. Each bar becomes four
// ticks, open, then high and low in the order the bar suggests, then close, as MT4's tester does with little data.
function marketFromCSV(text) {
    const ticks = [];
    for (const line of text.split(/\r?\n/)) {
        const f = line.trim().split(/[,;\t]/);
        if (f.length < 6) continue;
        const [y, mo, d] = f[0].split(/[.\-/]/).map(Number);
        const [h, mi] = f[1].split(":").map(Number);
        if (!y || Number.isNaN(h)) continue;
        const t = Date.UTC(y, mo - 1, d, h, mi) / 1000;
        const [o, hi, lo, c] = f.slice(2, 6).map(Number);
        const order = c >= o ? [o, lo, hi, c] : [o, hi, lo, c];
        order.forEach((p, k) => ticks.push({ time: t + k * 15, bid: p }));
    }
    ticks.sort((a, b) => a.time - b.time);
    const first = ticks.length ? ticks[0].time - ticks[0].time % 86400 : 0;
    return { ticks, startAt: first + 86400 };
}

if (typeof module !== "undefined") module.exports = { createEA, createTester, runTester, makeMarket, marketFromCSV, DEFAULT_INPUTS, fmtTime, OP_BUY, OP_SELL, mq };
