"use strict";

// EVALL.C, Vuksan Pejović's expression evaluator, ported line by line: it turns an infix expression into Polish
// form once, then evaluates that for any x. Each number in the expression is replaced by one character, its
// index + 1, so a character code below 32 means "the constant number code - 1". With `fixed` on, two of its bugs
// are fixed: a - b - c and a / b / c group to the left, and there is room for more than 31 numbers.

function createEvaluator() {
    const MAXPOL = 256;
    let konst = [];
    let br_konst = 0;
    let poljskaforma = [];
    let br_el = 0;
    let tmp_br = 0;
    let fixed = false;

    const lista_bin = [
        { ime: "+", asoc: 1, f: (x, y) => x + y },
        { ime: "-", asoc: 1, f: (x, y) => x - y },
        { ime: "*", asoc: 1, f: (x, y) => x * y },
        { ime: "/", asoc: 1, f: (x, y) => x / y },
        { ime: "^", asoc: -1, f: (x, y) => Math.pow(x, y) },
    ];
    const lista_un = [
        { ime: "-", f: x => -x },
        { ime: "+", f: x => x },
    ];
    const list_func = [
        ["sin", Math.sin], ["cos", Math.cos], ["tg", Math.tan], ["exp", Math.exp], ["ln", Math.log], ["log", Math.log10],
        ["asin", Math.asin], ["acos", Math.acos], ["atg", Math.atan], ["sinh", Math.sinh], ["cosh", Math.cosh],
        ["tgh", Math.tanh], ["abs", Math.abs], ["sqrt", Math.sqrt],
    ];

    class Overflow extends Error {}

    // the text being parsed, and the character codes that stand for constants
    let S = "";
    const at = i => i < S.length ? S[i] : "\0";
    const isConst = ch => fixed ? ch.charCodeAt(0) >= 0xE000 : ch.charCodeAt(0) < 32;
    const constIndex = ch => fixed ? ch.charCodeAt(0) - 0xE000 : ch.charCodeAt(0) - 1;

    function nadjenbinop(off, n, out) {
        let nadjeno = 0;
        for (let j = 0; j < lista_bin.length && !nadjeno; j++) {
            let u_zagradi = 0;
            const ime = lista_bin[j].ime, d = ime.length;
            // fixed: the last of + and - (and of * and /) at the top level, so they group to the left
            const scan = [];
            for (let i = 0; i < n; i++) scan.push(i);
            if (fixed && lista_bin[j].asoc === 1) {
                let found = -1;
                for (let i = 0; i < n; i++) {
                    const ch = at(off + i);
                    if (ch === "(") u_zagradi++;
                    if (ch === ")") u_zagradi--;
                    if (!u_zagradi && n > i + d && S.startsWith(ime, off + i) && i !== 0 && !isOp(at(off + i - 1))) found = i;
                }
                if (found >= 0) { nadjeno = 1; out.poz = found; out.br = j; }
                continue;
            }
            for (let i = 0; i < n && !nadjeno; i++) {
                const ch = at(off + i);
                if (ch === "(") u_zagradi++;
                if (ch === ")") u_zagradi--;
                if (!u_zagradi && n > i + d && S.startsWith(ime, off + i)) {
                    if (lista_bin[j].asoc === -1 && nadjenbinop(off + i + 1, n - i - 1, out) && out.br === j) {
                        if (fixed) out.poz += i + 1;      // fixed: the position was relative to the rest of the text
                        return 1;
                    } else if (i !== 0) {
                        nadjeno = 1;
                        out.poz = i;
                        out.br = j;
                    }
                }
            }
        }
        return nadjeno;
    }
    const isOp = ch => ch === "+" || ch === "-" || ch === "*" || ch === "/" || ch === "^";

    function nadjenunop(off, n, out) {
        for (let i = 0; i < lista_un.length; i++) {
            const d = lista_un[i].ime.length;
            if (n > d && S.startsWith(lista_un[i].ime, off)) { out.br = i; return 1; }
        }
        return 0;
    }

    function nadjenafunc(off, n, out) {
        for (let i = 0; i < list_func.length; i++) {
            const d = list_func[i][0].length;
            if (n > d && S.startsWith(list_func[i][0], off) && at(off + d) === "(") { out.br = i; return 1; }
        }
        return 0;
    }

    function push(arg) {
        if (br_el < MAXPOL - 1) poljskaforma[br_el++] = arg;
        else throw new Overflow("Prekoracenje duzine poljske forme");
    }

    function pop() { return tmp_br > 0 ? poljskaforma[--tmp_br] : -1; }

    function uzagradi(off, n) {
        if (at(off) === "(" && at(off + n - 1) === ")") return !infix2polish(off + 1, n - 2);
        return 0;
    }

    function infix2polish(off, n) {
        const out = { poz: 0, br: 0 };
        if (n > 0) {
            if (nadjenbinop(off, n, out)) {
                const poz = out.poz, brop = out.br;
                const dop = lista_bin[brop].ime.length;
                if (infix2polish(off + poz + dop, n - poz - dop) !== 0) return 1;
                if (infix2polish(off, poz) !== 0) return 1;
                push(brop);
                return 0;
            } else if (nadjenunop(off, n, out)) {
                const brop = out.br, dop = lista_un[brop].ime.length;
                if (infix2polish(off + dop, n - dop) !== 0) return 1;
                push(brop + 50);
                return 0;
            } else if (nadjenafunc(off, n, out)) {
                const brop = out.br, dop = list_func[brop][0].length;
                if (infix2polish(off + dop, n - dop)) return 1;
                push(brop + 100);
                return 0;
            } else if (uzagradi(off, n)) return 0;
            else if (at(off) === "x" && n === 1) { push(200); return 0; }
            else if (n === 1 && isConst(at(off))) { push(fixed ? 1000 + constIndex(at(off)) : at(off).charCodeAt(0) + 149); return 0; }
            else return 1;
        }
        return 1;
    }

    const isdigit = ch => ch >= "0" && ch <= "9";

    // str2polish: 1 on a syntax error
    function str2polish(infix, fix) {
        fixed = !!fix;
        br_el = 0;
        br_konst = 0;
        konst = [];
        // no white space, and no capitals
        let c = "";
        for (const ch of infix) {
            const code = ch.charCodeAt(0);
            if (code < 128 && !(ch === " " || (code >= 9 && code <= 13))) c += (ch >= "A" && ch <= "Z") ? ch.toLowerCase() : ch;
        }
        // each number becomes one character, its index + 1
        let t = "", i = 0;
        while (i < c.length) {
            if (isdigit(c[i])) {
                let k = c.charCodeAt(i) - 48;
                while (isdigit(c[++i] ?? "")) k = k * 10.0 + c.charCodeAt(i) - 48;
                const exponent = () => {
                    i++;
                    let sgn;
                    if (c[i] === "-") { sgn = -1; i++; }
                    else if (c[i] === "+") { sgn = 1; i++; }
                    else if (!isdigit(c[i] ?? "")) return false;
                    else sgn = 1;
                    if (!isdigit(c[i] ?? "")) return false;
                    let e = c.charCodeAt(i) - 48;
                    while (isdigit(c[++i] ?? "")) e = e * 10.0 + c.charCodeAt(i) - 48;
                    k *= Math.pow(10.0, sgn * e);
                    return true;
                };
                if (c[i] === ".") {
                    let d = 0.1;
                    while (isdigit(c[++i] ?? "")) { k = k + d * (c.charCodeAt(i) - 48); d = d / 10.0; }
                    if (c[i] === "e" && !exponent()) return 1;
                } else if (c[i] === "e" && !exponent()) return 1;
                if (!fixed && br_konst >= 50) throw new Overflow("konst");
                t += String.fromCharCode(fixed ? 0xE000 + br_konst : br_konst + 1);
                konst[br_konst++] = k;
            } else t += c[i++];
        }
        S = t;
        return infix2polish(0, S.length) ? 1 : 0;
    }

    function val(x) {
        const c = pop();
        if (c !== -1) {
            if (c < 50) {
                const levi = val(x); if (levi === null) return null;
                const desni = val(x); if (desni === null) return null;
                return lista_bin[c].f(levi, desni);
            }
            if (c < 100) { const d = val(x); if (d === null) return null; return lista_un[c - 50].f(d); }
            if (c < 150) { const d = val(x); if (d === null) return null; return list_func[c - 100][1](d); }
            if (c < 200) return konst[c - 150];
            if (c === 200) return x;
            if (c >= 1000) return konst[c - 1000];
        }
        return null;
    }

    function evalx(x) {
        tmp_br = br_el;
        const v = val(x);
        return v === null ? -1 : v;
    }

    return { str2polish, eval: evalx, Overflow };
}

if (typeof module !== "undefined") module.exports = { createEvaluator };
