// Lisp Notebook — my Common Lisp exercises from December 2011 and January 2012 (Mihailo Despotovic),
// made runnable in the browser by a small Common Lisp interpreter written for this page.
//
// The interpreter follows Common Lisp where the exercises depend on it, so they behave (and fail)
// as they would in a real Lisp: functions and variables have separate namespaces (hence funcall and
// #'), defun always defines a global function, whole numbers have no size limit, dividing whole
// numbers gives exact fractions (577/408), floats are single-floats unless written with d0 (pi is a
// double-float), and only NIL is false. It is a subset: no macros, characters, arrays, hash tables,
// structures, keyword arguments or multiple values. It runs in a Web Worker, so a computation that
// never ends can be stopped without freezing the page.

function lispInterpreter() {
    class LispError extends Error {}
    const fail = msg => { throw new LispError(msg); };

    // ---- data ----

    class Sym {
        constructor(name) { this.name = name; this.value = undefined; this.fn = undefined; }
    }
    const symbols = new Map();
    const intern = name => {
        let s = symbols.get(name);
        if (!s) { s = new Sym(name); symbols.set(name, s); }
        return s;
    };
    const NIL = intern("NIL"), T = intern("T");
    NIL.value = NIL; T.value = T;
    const bool = b => (b ? T : NIL);

    class Cons { constructor(car, cdr) { this.car = car; this.cdr = cdr; } }
    const list = (...xs) => fromArray(xs);
    function fromArray(xs, tail = NIL) {
        let l = tail;
        for (let i = xs.length - 1; i >= 0; i--) l = new Cons(xs[i], l);
        return l;
    }
    function toArray(l, what = "LIST") {
        const xs = [];
        while (l instanceof Cons) { xs.push(l.car); l = l.cdr; }
        if (l !== NIL) fail(`The value ${prin1(l)} is not a proper ${what}.`);
        return xs;
    }

    class Ratio { constructor(n, d) { this.n = n; this.d = d; } }
    class LFloat {
        constructor(v, double) { this.v = double ? v : Math.fround(v); this.double = double; }
    }
    class Closure {
        constructor(name, params, body, env) { this.name = name; this.params = params; this.body = body; this.env = env; }
    }
    class Builtin { constructor(name, fn) { this.name = name; this.fn = fn; } }
    const isFunction = f => f instanceof Closure || f instanceof Builtin;

    // ---- numbers: integers (BigInt), exact fractions, single- and double-floats ----

    const isNum = x => typeof x === "bigint" || x instanceof Ratio || x instanceof LFloat;
    const num = x => (isNum(x) ? x : fail(`The value ${prin1(x)} is not a number.`));
    const int = x => (typeof x === "bigint" ? x : fail(`The value ${prin1(x)} is not an integer.`));
    const babs = a => (a < 0n ? -a : a);
    const gcd = (a, b) => { a = babs(a); b = babs(b); while (b) [a, b] = [b, a % b]; return a; };
    function ratio(n, d) {
        if (d === 0n) fail("Division by zero.");
        if (d < 0n) { n = -n; d = -d; }
        const g = gcd(n, d);
        if (g > 1n) { n /= g; d /= g; }
        return d === 1n ? n : new Ratio(n, d);
    }
    const nd = x => (typeof x === "bigint" ? [x, 1n] : [x.n, x.d]);
    const toJs = x => (x instanceof LFloat ? x.v : typeof x === "bigint" ? Number(x) : Number(x.n) / Number(x.d));
    const anyDouble = (a, b) => (a instanceof LFloat && a.double) || (b instanceof LFloat && b.double);
    function arith(op, a, b) {
        num(a); num(b);
        if (a instanceof LFloat || b instanceof LFloat) {
            const x = toJs(a), y = toJs(b);
            if (op === "/" && y === 0) fail("Division by zero.");
            return new LFloat(op === "+" ? x + y : op === "-" ? x - y : op === "*" ? x * y : x / y, anyDouble(a, b));
        }
        if (typeof a === "bigint" && typeof b === "bigint" && op !== "/") {
            return op === "+" ? a + b : op === "-" ? a - b : a * b;
        }
        const [an, ad] = nd(a), [bn, bd] = nd(b);
        if (op === "+") return ratio(an * bd + bn * ad, ad * bd);
        if (op === "-") return ratio(an * bd - bn * ad, ad * bd);
        if (op === "*") return ratio(an * bn, ad * bd);
        return ratio(an * bd, ad * bn);
    }
    function compare(a, b) {
        num(a); num(b);
        if (a instanceof LFloat || b instanceof LFloat) {
            const x = toJs(a), y = toJs(b);
            return x < y ? -1 : x > y ? 1 : 0;
        }
        const [an, ad] = nd(a), [bn, bd] = nd(b);
        const l = an * bd, r = bn * ad;
        return l < r ? -1 : l > r ? 1 : 0;
    }
    const isZero = x => compare(x, 0n) === 0;
    const negative = x => compare(x, 0n) < 0;
    function toFloat(x, double = false) {
        num(x);
        return x instanceof LFloat ? x : new LFloat(toJs(x), double);
    }
    // floor of a / b for integers and floats, as Common Lisp's mod needs
    function modOrRem(a, b, isMod) {
        num(a); num(b);
        if (isZero(b)) fail("Division by zero.");
        if (typeof a === "bigint" && typeof b === "bigint") {
            let r = a % b;   // BigInt % truncates, like rem
            if (isMod && r !== 0n && (r < 0n) !== (b < 0n)) r += b;
            return r;
        }
        if (a instanceof Ratio || b instanceof Ratio) {
            const q = arith("/", a, b);
            const [qn, qd] = nd(q);
            let t = qn / qd;   // truncated
            if (isMod && negative(q) && t * qd !== qn) t -= 1n;
            return arith("-", a, arith("*", b, t));
        }
        const x = toJs(a), y = toJs(b);
        let r = x % y;
        if (isMod && r !== 0 && (r < 0) !== (y < 0)) r += y;
        return new LFloat(r, anyDouble(a, b));
    }

    // floats print as in SBCL: shortest digits that read back the same, 1.4142157, 6.283185307179586d0, 1.0e-4
    function formatFloat(f) {
        const v = f.v;
        if (!isFinite(v)) return v > 0 ? "#.SB-EXT:SINGLE-FLOAT-POSITIVE-INFINITY".replace("SINGLE", f.double ? "DOUBLE" : "SINGLE")
            : Number.isNaN(v) ? "#<NaN>" : "#.SB-EXT:SINGLE-FLOAT-NEGATIVE-INFINITY".replace("SINGLE", f.double ? "DOUBLE" : "SINGLE");
        const suffix = f.double ? "d0" : "";
        if (v === 0) return (Object.is(v, -0) ? "-0.0" : "0.0") + suffix;
        let s;
        if (f.double) s = Math.abs(v).toExponential();
        else {
            for (let p = 0; p <= 8; p++) {
                s = Math.abs(v).toExponential(p);
                if (Math.fround(Number(s)) === Math.abs(v)) break;
            }
        }
        const [mant, e] = s.split("e");
        const digits = mant.replace(".", "").replace(/0+$/, "") || "0";
        const exp = Number(e);
        const sign = v < 0 ? "-" : "";
        if (Math.abs(v) >= 1e-3 && Math.abs(v) < 1e7) {
            let whole, frac;
            if (exp >= 0) {
                whole = digits.slice(0, exp + 1).padEnd(exp + 1, "0");
                frac = digits.slice(exp + 1);
            } else {
                whole = "0";
                frac = "0".repeat(-exp - 1) + digits;
            }
            return sign + whole + "." + (frac || "0") + suffix;
        }
        return sign + digits[0] + "." + (digits.slice(1) || "0") + (f.double ? "d" : "e") + exp;
    }

    // ---- reader ----

    const DELIMITERS = /[\s()'";`,]/;
    function read(src) {
        let i = 0;
        const forms = [];
        function skip() {
            for (;;) {
                while (i < src.length && /\s/.test(src[i])) i++;
                if (src[i] === ";") { while (i < src.length && src[i] !== "\n") i++; continue; }
                if (src.startsWith("#|", i)) {
                    const end = src.indexOf("|#", i + 2);
                    if (end < 0) fail("Unfinished #| comment.");
                    i = end + 2;
                    continue;
                }
                return;
            }
        }
        function readForm() {
            skip();
            if (i >= src.length) fail("Unexpected end of input: a ( is missing its ).");
            const c = src[i];
            if (c === "(") {
                i++;
                const items = [];
                let tail = NIL;
                for (;;) {
                    skip();
                    if (i >= src.length) fail("Unexpected end of input: a ( is missing its ).");
                    if (src[i] === ")") { i++; break; }
                    if (src[i] === "." && (i + 1 >= src.length || DELIMITERS.test(src[i + 1])) && items.length) {
                        i++;
                        tail = readForm();
                        skip();
                        if (src[i] !== ")") fail("Only one thing may follow the dot in (a . b).");
                        i++;
                        break;
                    }
                    items.push(readForm());
                }
                return fromArray(items, tail);
            }
            if (c === ")") fail("Unexpected ): there is one ) too many.");
            if (c === "'") { i++; return list(QUOTE, readForm()); }
            if (src.startsWith("#'", i)) { i += 2; return list(FUNCTION, readForm()); }
            if (c === "`" || c === ",") fail("Backquote isn't supported here.");
            if (c === "#") fail(`${src.slice(i, i + 2)} isn't supported here.`);
            if (c === '"') {
                i++;
                let s = "";
                while (i < src.length && src[i] !== '"') {
                    if (src[i] === "\\") i++;
                    s += src[i++];
                }
                if (i >= src.length) fail('Unfinished string: a " is missing.');
                i++;
                return s;
            }
            let start = i;
            while (i < src.length && !DELIMITERS.test(src[i])) i++;
            return atom(src.slice(start, i));
        }
        for (;;) {
            skip();
            if (i >= src.length) break;
            const start = i;
            const form = readForm();
            forms.push({ form, text: src.slice(start, i) });
        }
        return forms;
    }
    function atom(tok) {
        if (/^[+-]?\d+\.?$/.test(tok)) return BigInt(tok.replace(".", ""));
        if (/^[+-]?\d+\/\d+$/.test(tok)) {
            const [n, d] = tok.split("/");
            return ratio(BigInt(n), BigInt(d));
        }
        const m = /^([+-]?(?:\d+\.\d*|\.\d+|\d+))(?:([eEsSfFdDlL])([+-]?\d+))?$/.exec(tok);
        if (m && (m[1].includes(".") || m[2])) {
            const double = !!m[2] && /[dDlL]/.test(m[2]);
            return new LFloat(Number(m[1] + (m[3] ? "e" + m[3] : "")), double);
        }
        if (tok.includes("|")) fail("|symbols| aren't supported here.");
        return intern(tok.toUpperCase());
    }

    // ---- printer ----

    const MAX_PRINT = 20000;
    function prin1(x, escape = true) {
        let out = "";
        const put = s => {
            out += s;
            if (out.length > MAX_PRINT) throw PRINT_LIMIT;
        };
        function p(x) {
            if (x instanceof Sym) put(x.name);
            else if (typeof x === "bigint") put(x.toString());
            else if (x instanceof Ratio) put(x.n + "/" + x.d);
            else if (x instanceof LFloat) put(formatFloat(x));
            else if (typeof x === "string") put(escape ? '"' + x.replace(/[\\"]/g, "\\$&") + '"' : x);
            else if (x instanceof Cons) {
                if ((x.car === QUOTE || x.car === FUNCTION) && x.cdr instanceof Cons && x.cdr.cdr === NIL) {
                    put(x.car === QUOTE ? "'" : "#'");
                    p(x.cdr.car);
                    return;
                }
                put("(");
                let first = true;
                for (; x instanceof Cons; x = x.cdr) {
                    if (!first) put(" ");
                    p(x.car);
                    first = false;
                }
                if (x !== NIL) { put(" . "); p(x); }
                put(")");
            } else if (x instanceof Closure) {
                put(x.name ? `#<FUNCTION ${x.name.name}>` : `#<FUNCTION (LAMBDA ${prin1(x.params.lambdaList)})>`);
            } else if (x instanceof Builtin) put(`#<FUNCTION ${x.name}>`);
            else put(String(x));
        }
        try { p(x); } catch (e) {
            if (e !== PRINT_LIMIT) throw e;
            out += " …(too long to show)";
        }
        return out;
    }
    const PRINT_LIMIT = {};

    // ---- evaluator ----

    const QUOTE = intern("QUOTE"), FUNCTION = intern("FUNCTION"), LAMBDA = intern("LAMBDA");
    const OPTIONAL = intern("&OPTIONAL"), REST = intern("&REST");

    class Env { constructor(parent, vars, funs) { this.parent = parent; this.vars = vars; this.funs = funs; } }
    class TailCall { constructor(x, env) { this.x = x; this.env = env; } }

    const sym = (x, what = "a variable name") => (x instanceof Sym && x !== NIL && x !== T ? x : fail(`${prin1(x)} can't be used as ${what}.`));

    function lookupVar(s, env) {
        for (let e = env; e; e = e.parent) if (e.vars && e.vars.has(s)) return e.vars.get(s);
        if (s.value !== undefined) return s.value;
        return fail(`The variable ${s.name} is unbound.`);
    }
    function setVar(s, v, env) {
        for (let e = env; e; e = e.parent) if (e.vars && e.vars.has(s)) { e.vars.set(s, v); return v; }
        if (s === NIL || s === T || s.name.startsWith(":")) fail(`${s.name} is a constant and can't be changed.`);
        s.value = v;
        return v;
    }
    function lookupFun(s, env) {
        for (let e = env; e; e = e.parent) if (e.funs && e.funs.has(s)) return e.funs.get(s);
        if (s.fn !== undefined) return s.fn;
        if (SPECIAL.has(s)) fail(`${s.name} is a special operator, not a function.`);
        return fail(`The function ${s.name} is undefined.`);
    }

    function parseParams(lambdaList) {
        const req = [], opt = [];
        let rest = null, mode = "req";
        for (const p of toArray(lambdaList, "parameter list")) {
            if (p === OPTIONAL) { mode = "opt"; continue; }
            if (p === REST) { mode = "rest"; continue; }
            if (mode === "req") req.push(sym(p, "a parameter name"));
            else if (mode === "opt") {
                if (p instanceof Cons) opt.push({ s: sym(p.car, "a parameter name"), def: p.cdr instanceof Cons ? p.cdr.car : NIL });
                else opt.push({ s: sym(p, "a parameter name"), def: NIL });
            } else rest = sym(p, "a parameter name");
        }
        return { req, opt, rest, lambdaList };
    }
    const makeClosure = (name, lambdaList, body, env) => new Closure(name, parseParams(lambdaList), body, env);

    function bind(f, args) {
        const { req, opt, rest } = f.params;
        const n = args.length;
        if (n < req.length || (!rest && n > req.length + opt.length)) {
            const wants = rest ? `at least ${req.length}` : opt.length ? `${req.length} to ${req.length + opt.length}` : `${req.length}`;
            fail(`${f.name ? f.name.name : "The lambda"} was called with ${n} argument${n === 1 ? "" : "s"}, but takes ${wants}.`);
        }
        const vars = new Map();
        const env = new Env(f.env, vars, null);
        let k = 0;
        for (const s of req) vars.set(s, args[k++]);
        for (const { s, def } of opt) vars.set(s, k < n ? args[k++] : evaluate(def, env));
        if (rest) vars.set(rest, fromArray(args.slice(k)));
        return env;
    }

    function apply(f, args) {
        if (f instanceof Builtin) return f.fn(...args);
        if (f instanceof Closure) return runBody(f.body, bind(f, args));
        return fail(`${prin1(f)} is not a function.`);
    }
    function asFunction(f, env) {
        if (isFunction(f)) return f;
        if (f instanceof Sym) return lookupFun(f, null);   // (funcall 'car ...) uses the global function
        return fail(`${prin1(f)} is not a function.`);
    }

    function runBody(body, env) {
        const r = tailBody(body, env);
        return r instanceof TailCall ? evaluate(r.x, r.env) : r;
    }
    function tailBody(body, env) {
        if (body === NIL) return NIL;
        while (body.cdr instanceof Cons) { evaluate(body.car, env); body = body.cdr; }
        return new TailCall(body.car, env);
    }

    let steps = 0;
    function evaluate(x, env) {
        for (;;) {
            if (x instanceof Sym) {
                if (x === NIL || x === T || x.name.startsWith(":")) return x;
                return lookupVar(x, env);
            }
            if (!(x instanceof Cons)) return x;
            steps++;
            const op = x.car;
            let f;
            if (op instanceof Sym) {
                const special = SPECIAL.get(op);
                if (special) {
                    const r = special(x.cdr, env);
                    if (r instanceof TailCall) { x = r.x; env = r.env; continue; }
                    return r;
                }
                f = lookupFun(op, env);
            } else if (op instanceof Cons && op.car === LAMBDA) {
                f = makeClosure(null, op.cdr.car, op.cdr.cdr, env);
            } else fail(`Illegal function call: ${prin1(op)} can't be called.`);
            const args = [];
            for (let a = x.cdr; a instanceof Cons; a = a.cdr) args.push(evaluate(a.car, env));
            if (f instanceof Builtin) return f.fn(...args);
            env = bind(f, args);
            const r = tailBody(f.body, env);
            if (!(r instanceof TailCall)) return r;
            x = r.x; env = r.env;
        }
    }

    const SPECIAL = new Map();
    const special = (name, fn) => SPECIAL.set(intern(name), fn);
    const nth = (l, k) => { for (let i = 0; i < k && l instanceof Cons; i++) l = l.cdr; return l instanceof Cons ? l.car : NIL; };

    special("QUOTE", a => a.car);
    special("FUNCTION", (a, env) => {
        const f = a.car;
        if (f instanceof Cons && f.car === LAMBDA) return makeClosure(null, f.cdr.car, f.cdr.cdr, env);
        return lookupFun(sym(f, "a function name"), env);
    });
    special("LAMBDA", (a, env) => makeClosure(null, a.car, a.cdr, env));
    special("IF", (a, env) => new TailCall(evaluate(a.car, env) !== NIL ? nth(a, 1) : nth(a, 2), env));
    special("COND", (a, env) => {
        for (const clause of toArray(a)) {
            if (!(clause instanceof Cons)) fail(`A cond clause must be a list: ${prin1(clause)}.`);
            const test = evaluate(clause.car, env);
            if (test !== NIL) return clause.cdr === NIL ? test : tailBody(clause.cdr, env);
        }
        return NIL;
    });
    special("AND", (a, env) => {
        if (a === NIL) return T;
        for (; a.cdr instanceof Cons; a = a.cdr) if (evaluate(a.car, env) === NIL) return NIL;
        return new TailCall(a.car, env);
    });
    special("OR", (a, env) => {
        if (a === NIL) return NIL;
        for (; a.cdr instanceof Cons; a = a.cdr) {
            const v = evaluate(a.car, env);
            if (v !== NIL) return v;
        }
        return new TailCall(a.car, env);
    });
    special("WHEN", (a, env) => (evaluate(a.car, env) !== NIL ? tailBody(a.cdr, env) : NIL));
    special("UNLESS", (a, env) => (evaluate(a.car, env) === NIL ? tailBody(a.cdr, env) : NIL));
    special("PROGN", (a, env) => tailBody(a, env));
    function letForm(sequential) {
        return (a, env) => {
            const vars = new Map();
            const inner = new Env(env, vars, null);
            for (const b of toArray(a.car, "binding list")) {
                const s = sym(b instanceof Cons ? b.car : b);
                const init = b instanceof Cons && b.cdr instanceof Cons ? b.cdr.car : NIL;
                vars.set(s, evaluate(init, sequential ? inner : env));
            }
            return tailBody(a.cdr, inner);
        };
    }
    special("LET", letForm(false));
    special("LET*", letForm(true));
    special("SETQ", (a, env) => {
        let v = NIL;
        for (; a instanceof Cons; a = a.cdr.cdr) {
            if (!(a.cdr instanceof Cons)) fail("setq needs a value for every variable.");
            v = setVar(sym(a.car), evaluate(a.cdr.car, env), env);
        }
        return v;
    });
    special("SETF", (a, env) => {
        let v = NIL;
        for (; a instanceof Cons; a = a.cdr.cdr) {
            if (!(a.cdr instanceof Cons)) fail("setf needs a value for every place.");
            const place = a.car;
            if (place instanceof Sym) { v = setVar(sym(place), evaluate(a.cdr.car, env), env); continue; }
            const head = place instanceof Cons ? place.car.name : "";
            if (!["CAR", "CDR", "FIRST", "REST"].includes(head)) fail(`setf of ${prin1(place)} isn't supported here.`);
            const cell = evaluate(nth(place, 1), env);
            if (!(cell instanceof Cons)) fail(`The value ${prin1(cell)} is not a cons.`);
            v = evaluate(a.cdr.car, env);
            if (head === "CAR" || head === "FIRST") cell.car = v; else cell.cdr = v;
        }
        return v;
    });
    // defun always sets the global function, even when evaluated inside another function
    special("DEFUN", (a, env) => {
        const name = sym(a.car, "a function name");
        if (SPECIAL.has(name) || BUILTINS.has(name)) fail(`${name.name} is part of Common Lisp and can't be redefined.`);
        name.fn = makeClosure(name, nth(a, 1), a.cdr.cdr, env);
        return name;
    });
    // defvar sets the variable only if it has no value yet; defparameter always does
    special("DEFVAR", (a, env) => {
        const s = sym(a.car);
        if (s.value === undefined && a.cdr instanceof Cons) s.value = evaluate(a.cdr.car, env);
        return s;
    });
    special("DEFPARAMETER", (a, env) => {
        const s = sym(a.car);
        s.value = evaluate(nth(a, 1), env);
        return s;
    });
    function localFunctions(recursive) {
        return (a, env) => {
            const funs = new Map();
            const inner = new Env(env, null, funs);
            for (const def of toArray(a.car, "function list")) {
                const name = sym(def.car, "a function name");
                funs.set(name, makeClosure(name, nth(def, 1), def.cdr.cdr, recursive ? inner : env));
            }
            return tailBody(a.cdr, inner);
        };
    }
    special("FLET", localFunctions(false));
    special("LABELS", localFunctions(true));
    special("DOLIST", (a, env) => {
        const [v, listForm, result = NIL] = toArray(a.car);
        const vars = new Map();
        const inner = new Env(env, vars, null);
        for (const item of toArray(evaluate(listForm, env))) {
            vars.set(sym(v), item);
            runBody(a.cdr, inner);
        }
        vars.set(sym(v), NIL);
        return evaluate(result, inner);
    });
    special("DOTIMES", (a, env) => {
        const [v, countForm, result = NIL] = toArray(a.car);
        const vars = new Map();
        const inner = new Env(env, vars, null);
        const n = int(evaluate(countForm, env));
        for (let k = 0n; k < n; k++) {
            vars.set(sym(v), k);
            runBody(a.cdr, inner);
        }
        vars.set(sym(v), n);
        return evaluate(result, inner);
    });

    // ---- built-in functions ----

    const BUILTINS = new Map();
    function def(names, fn, min = 0, max = Infinity) {
        for (const name of names.split(" ")) {
            const s = intern(name);
            const b = new Builtin(name, (...args) => {
                if (args.length < min || args.length > max) {
                    const wants = max === Infinity ? `at least ${min}` : min === max ? `${min}` : `${min} to ${max}`;
                    fail(`${name} was called with ${args.length} argument${args.length === 1 ? "" : "s"}, but takes ${wants}.`);
                }
                return fn(...args);
            });
            s.fn = b;
            BUILTINS.set(s, b);
        }
    }
    const car = x => (x === NIL ? NIL : x instanceof Cons ? x.car : fail(`The value ${prin1(x)} is not a list.`));
    const cdr = x => (x === NIL ? NIL : x instanceof Cons ? x.cdr : fail(`The value ${prin1(x)} is not a list.`));
    const eql = (a, b) => a === b
        || (a instanceof Ratio && b instanceof Ratio && a.n === b.n && a.d === b.d)
        || (a instanceof LFloat && b instanceof LFloat && a.double === b.double && a.v === b.v);
    const equal = (a, b) => eql(a, b)
        || (a instanceof Cons && b instanceof Cons && equal(a.car, b.car) && equal(a.cdr, b.cdr));
    const isList = x => x === NIL || x instanceof Cons;
    const call = (f, ...args) => apply(asFunction(f), args);

    def("+", (...xs) => xs.reduce((a, b) => arith("+", a, b), 0n));
    def("*", (...xs) => xs.reduce((a, b) => arith("*", a, b), 1n));
    def("-", (x, ...xs) => (xs.length ? xs.reduce((a, b) => arith("-", a, b), x) : arith("-", 0n, x)), 1);
    def("/", (x, ...xs) => (xs.length ? xs.reduce((a, b) => arith("/", a, b), x) : arith("/", 1n, x)), 1);
    def("1+", x => arith("+", x, 1n), 1, 1);
    def("1-", x => arith("-", x, 1n), 1, 1);
    const chain = test => (...xs) => {
        xs.forEach(num);
        for (let k = 0; k + 1 < xs.length; k++) if (!test(compare(xs[k], xs[k + 1]))) return NIL;
        return T;
    };
    def("=", chain(c => c === 0), 1);
    def("<", chain(c => c < 0), 1);
    def(">", chain(c => c > 0), 1);
    def("<=", chain(c => c <= 0), 1);
    def(">=", chain(c => c >= 0), 1);
    def("/=", (...xs) => {
        xs.forEach(num);
        for (let j = 0; j < xs.length; j++) for (let k = j + 1; k < xs.length; k++) if (compare(xs[j], xs[k]) === 0) return NIL;
        return T;
    }, 1);
    def("MAX", (...xs) => xs.reduce((a, b) => (compare(a, b) >= 0 ? a : b)), 1);
    def("MIN", (...xs) => xs.reduce((a, b) => (compare(a, b) <= 0 ? a : b)), 1);
    def("ABS", x => (negative(x) ? arith("-", 0n, x) : x), 1, 1);
    def("MOD", (a, b) => modOrRem(a, b, true), 2, 2);
    def("REM", (a, b) => modOrRem(a, b, false), 2, 2);
    def("GCD", (...xs) => xs.map(int).reduce(gcd, 0n));
    def("SQRT", x => {
        if (negative(x)) fail("The square root of a negative number is a complex number, which isn't supported here.");
        return new LFloat(Math.sqrt(toJs(x)), x instanceof LFloat && x.double);
    }, 1, 1);
    def("EXPT", (b, e) => {
        num(b); num(e);
        if (typeof e === "bigint" && !(b instanceof LFloat)) {
            const [bn, bd] = nd(b);
            if (e >= 0n) return ratio(bn ** e, bd ** e);
            if (bn === 0n) fail("Division by zero.");
            return ratio(bd ** -e, bn ** -e);
        }
        if (negative(b) && !(typeof e === "bigint")) fail("A negative number to a fractional power is a complex number, which isn't supported here.");
        return new LFloat(Math.pow(toJs(b), toJs(e)), anyDouble(b, e));
    }, 2, 2);
    def("FLOAT", x => toFloat(x), 1, 1);
    const rounding = (name, fn) => def(name, (a, b = 1n) => {
        const q = arith("/", a, b);
        if (q instanceof LFloat) {
            if (!isFinite(q.v)) fail(`${name} of ${prin1(q)} isn't a number.`);
            return BigInt(fn(q.v));
        }
        const [n, d] = nd(q);
        let t = n / d;   // truncated
        if (t * d !== n && name === "FLOOR" && n < 0n) t -= 1n;
        if (t * d !== n && name === "CEILING" && n > 0n) t += 1n;
        return t;
    }, 1, 2);
    rounding("FLOOR", Math.floor);
    rounding("CEILING", Math.ceil);
    rounding("TRUNCATE", Math.trunc);
    def("ZEROP", x => bool(isZero(num(x))), 1, 1);
    def("PLUSP", x => bool(compare(num(x), 0n) > 0), 1, 1);
    def("MINUSP", x => bool(negative(num(x))), 1, 1);
    def("EVENP", x => bool(int(x) % 2n === 0n), 1, 1);
    def("ODDP", x => bool(int(x) % 2n !== 0n), 1, 1);
    def("NUMBERP", x => bool(isNum(x)), 1, 1);
    def("INTEGERP", x => bool(typeof x === "bigint"), 1, 1);
    def("FLOATP", x => bool(x instanceof LFloat), 1, 1);
    def("RATIONALP", x => bool(typeof x === "bigint" || x instanceof Ratio), 1, 1);

    def("CAR FIRST", car, 1, 1);
    def("CDR REST", cdr, 1, 1);
    def("CAAR", x => car(car(x)), 1, 1);
    def("CADR SECOND", x => car(cdr(x)), 1, 1);
    def("CDAR", x => cdr(car(x)), 1, 1);
    def("CDDR", x => cdr(cdr(x)), 1, 1);
    def("CADDR THIRD", x => car(cdr(cdr(x))), 1, 1);
    def("CONS", (a, b) => new Cons(a, b), 2, 2);
    def("LIST", list);
    def("LIST*", (...xs) => fromArray(xs.slice(0, -1), xs[xs.length - 1]), 1);
    def("APPEND", (...ls) => {
        if (!ls.length) return NIL;
        let result = ls[ls.length - 1];
        for (let k = ls.length - 2; k >= 0; k--) result = fromArray(toArray(ls[k]), result);
        return result;
    });
    def("REVERSE", x => (typeof x === "string" ? [...x].reverse().join("") : fromArray(toArray(x).reverse())), 1, 1);
    def("LENGTH", x => BigInt(typeof x === "string" ? x.length : toArray(x).length), 1, 1);
    def("NTH", (k, l) => nth(l, Number(int(k))), 2, 2);
    def("NTHCDR", (k, l) => { for (let i = 0n; i < int(k); i++) l = cdr(l); return l; }, 2, 2);
    def("LAST", l => { if (l === NIL) return NIL; while (l.cdr instanceof Cons) l = l.cdr; return l; }, 1, 1);
    def("NULL NOT", x => bool(x === NIL), 1, 1);
    def("ATOM", x => bool(!(x instanceof Cons)), 1, 1);
    def("CONSP", x => bool(x instanceof Cons), 1, 1);
    def("LISTP", x => bool(isList(x)), 1, 1);
    def("SYMBOLP", x => bool(x instanceof Sym), 1, 1);
    def("STRINGP", x => bool(typeof x === "string"), 1, 1);
    def("FUNCTIONP", x => bool(isFunction(x)), 1, 1);
    def("EQ", (a, b) => bool(a === b), 2, 2);
    def("EQL", (a, b) => bool(eql(a, b)), 2, 2);
    def("EQUAL", (a, b) => bool(equal(a, b) || (typeof a === "string" && a === b)), 2, 2);
    def("MEMBER", (x, l) => { for (; l instanceof Cons; l = l.cdr) if (eql(x, l.car)) return l; return NIL; }, 2, 2);
    def("ASSOC", (x, l) => { for (; l instanceof Cons; l = l.cdr) if (l.car instanceof Cons && eql(x, l.car.car)) return l.car; return NIL; }, 2, 2);
    def("SUBSEQ", (seq, start, end) => {
        const s = Number(int(start));
        if (typeof seq === "string") {
            const e = end === undefined || end === NIL ? seq.length : Number(int(end));
            if (s < 0 || e > seq.length || s > e) fail(`The bounds ${s} and ${e} are bad for a string of length ${seq.length}.`);
            return seq.slice(s, e);
        }
        const xs = toArray(seq);
        const e = end === undefined || end === NIL ? xs.length : Number(int(end));
        if (s < 0 || e > xs.length || s > e) fail(`The bounds ${s} and ${e} are bad for a list of length ${xs.length}.`);
        return fromArray(xs.slice(s, e));
    }, 2, 3);
    def("REMOVE-IF", (f, l) => fromArray(toArray(l).filter(x => call(f, x) === NIL)), 2, 2);
    def("REMOVE-IF-NOT", (f, l) => fromArray(toArray(l).filter(x => call(f, x) !== NIL)), 2, 2);
    def("REMOVE", (y, l) => fromArray(toArray(l).filter(x => !eql(x, y))), 2, 2);
    def("MAPCAR", (f, ...ls) => {
        const arrays = ls.map(l => toArray(l));
        const n = Math.min(...arrays.map(a => a.length));
        const out = [];
        for (let k = 0; k < n; k++) out.push(call(f, ...arrays.map(a => a[k])));
        return fromArray(out);
    }, 2);
    def("REDUCE", (f, l) => {
        const xs = toArray(l);
        if (!xs.length) return call(f);
        return xs.reduce((a, b) => call(f, a, b));
    }, 2, 2);
    def("FUNCALL", (f, ...args) => call(f, ...args), 1);
    def("APPLY", (f, ...args) => call(f, ...args.slice(0, -1), ...toArray(args[args.length - 1])), 2);
    def("IDENTITY", x => x, 1, 1);
    def("FBOUNDP", s => bool(s instanceof Sym && (s.fn !== undefined || SPECIAL.has(s))), 1, 1);
    def("BOUNDP", s => bool(s instanceof Sym && s.value !== undefined), 1, 1);
    const str = x => (typeof x === "string" ? x : fail(`The value ${prin1(x)} is not a string.`));
    def("STRING-UPCASE", x => str(x).toUpperCase(), 1, 1);
    def("STRING-DOWNCASE", x => str(x).toLowerCase(), 1, 1);
    def("STRING=", (a, b) => bool(str(a) === str(b)), 2, 2);
    def("CONCATENATE", (type, ...xs) => {
        if (type === intern("STRING")) return xs.map(str).join("");
        if (type === intern("LIST")) return fromArray(xs.flatMap(x => (typeof x === "string" ? [...x] : toArray(x))));
        return fail("concatenate supports only 'string and 'list here.");
    }, 1);

    let output = "";
    def("PRINT", x => { output += "\n" + prin1(x) + " "; return x; }, 1, 1);
    def("PRIN1", x => { output += prin1(x); return x; }, 1, 1);
    def("PRINC", x => { output += prin1(x, false); return x; }, 1, 1);
    def("TERPRI", () => { output += "\n"; return NIL; }, 0, 0);
    def("FORMAT", (dest, control, ...args) => {
        let k = 0, s = "";
        const next = () => (k < args.length ? args[k++] : fail("format has more directives than arguments."));
        for (let i = 0; i < str(control).length; i++) {
            const c = control[i];
            if (c !== "~") { s += c; continue; }
            const d = control[++i]?.toUpperCase();
            if (d === "A") s += prin1(next(), false);
            else if (d === "S") s += prin1(next());
            else if (d === "D") s += prin1(next());
            else if (d === "%") s += "\n";
            else if (d === "&") { const before = output + s; if (before && !before.endsWith("\n")) s += "\n"; }
            else if (d === "~") s += "~";
            else fail(`The format directive ~${control[i] ?? ""} isn't supported here.`);
        }
        if (dest === NIL) return s;
        output += s;
        return NIL;
    }, 2);

    const PI = intern("PI");
    PI.value = new LFloat(Math.PI, true);

    // ---- running a piece of source text, one top-level form at a time ----

    const DEFINERS = new Set(["DEFUN", "DEFVAR", "DEFPARAMETER", "SETQ", "SETF"].map(intern));
    const isStackOverflow = e => e instanceof RangeError || /recursion|call stack|stack size/i.test(String(e && e.message));

    function run(source) {
        const items = [], defs = [];
        let forms;
        try { forms = read(source); } catch (e) {
            if (!(e instanceof LispError)) throw e;
            return { items: [{ type: "error", form: "", text: e.message }], defs };
        }
        for (const { form, text } of forms) {
            output = "";
            steps = 0;
            let item;
            try {
                item = { type: "value", text: prin1(evaluate(form, null)) };
                if (form instanceof Cons && DEFINERS.has(form.car)) defs.push(text);
            } catch (e) {
                if (e instanceof LispError) item = { type: "error", text: e.message };
                else if (isStackOverflow(e)) item = { type: "error", text: "Control stack exhausted: the recursion went too deep, or never ends." };
                else throw e;
            }
            item.form = text;
            if (output) items.push({ type: "output", form: text, text: output.replace(/^\n/, "") });
            items.push(item);
        }
        return { items, defs };
    }

    return { run };
}

// the Web Worker: evaluates what the page sends it in one Lisp session
function lispWorkerMain(makeInterpreter) {
    const lisp = makeInterpreter();
    onmessage = e => {
        const { id, source } = e.data;
        let result;
        try { result = lisp.run(source); } catch (err) {
            result = { items: [{ type: "error", form: "", text: "Internal error: " + (err && err.message) }], defs: [] };
        }
        postMessage({ id, ...result });
    };
}

if (typeof module !== "undefined") module.exports = { lispInterpreter };

// ---- UI ----

if (typeof document !== "undefined") {
    const $ = id => document.getElementById(id);
    const workerUrl = URL.createObjectURL(new Blob([`(${lispWorkerMain})(${lispInterpreter});`], { type: "text/javascript" }));

    // the Lisp session: requests queue in the worker; Stop throws the worker away and replays the definitions
    let worker = null, nextId = 1, pending = new Map(), definitions = [], busyTimer = null;
    function startWorker() {
        worker = new Worker(workerUrl);
        worker.onmessage = e => {
            const p = pending.get(e.data.id);
            pending.delete(e.data.id);
            if (!p) return;
            if (!p.replay) definitions.push(...e.data.defs);
            p.resolve(e.data);
            updateBusy();
        };
        worker.onerror = e => {
            e.preventDefault();
            for (const p of pending.values()) p.resolve({ items: [{ type: "error", form: "", text: "Internal error: " + e.message }], defs: [] });
            pending.clear();
            updateBusy();
        };
    }
    function send(source, replay = false) {
        const id = nextId++;
        return new Promise(resolve => {
            pending.set(id, { resolve, replay });
            worker.postMessage({ id, source });
            updateBusy();
        });
    }
    function updateBusy() {
        clearTimeout(busyTimer);
        const waiting = [...pending.values()].some(p => !p.replay);
        if (!waiting) { $("busy").hidden = true; return; }
        busyTimer = setTimeout(() => { $("busy").hidden = false; }, 300);
    }
    function stopWorker(message) {
        worker.terminate();
        for (const p of pending.values()) p.resolve({ items: [{ type: "error", form: "", text: message }], defs: [] });
        pending.clear();
        updateBusy();
        startWorker();
    }
    $("stop").addEventListener("click", () => {
        stopWorker("Stopped.");
        if (definitions.length) send(definitions.join("\n"), true);   // bring back what was defined before
    });
    $("restart").addEventListener("click", () => {
        stopWorker("Stopped: Lisp was restarted.");
        definitions = [];
        for (const out of document.querySelectorAll(".out")) { out.replaceChildren(); out.hidden = true; }
    });

    function firstLine(text) {
        const line = text.split("\n")[0];
        return line.length > 60 ? line.slice(0, 57) + " …" : line + (text.includes("\n") ? " …" : "");
    }
    function showResult(out, result) {
        out.replaceChildren();
        for (const item of result.items) {
            const row = document.createElement("div");
            row.className = "item " + item.type;
            if (item.form && item.type !== "output") {
                const f = document.createElement("span");
                f.className = "form";
                f.textContent = firstLine(item.form);
                row.append(f, item.type === "error" ? "  ✗ " : "  ⇒ ");
            }
            const v = document.createElement("span");
            v.className = "val";
            v.textContent = item.text;
            row.append(v);
            out.append(row);
        }
        if (!result.items.length) out.textContent = "(nothing to run)";
        out.hidden = false;
    }

    function autosize(ta) {
        ta.style.height = "auto";
        ta.style.height = ta.scrollHeight + 2 + "px";
    }
    function textarea(cls, value) {
        const ta = document.createElement("textarea");
        ta.className = cls;
        ta.spellcheck = false;
        ta.autocapitalize = "off";
        ta.setAttribute("autocorrect", "off");
        ta.value = value;
        ta.addEventListener("input", () => autosize(ta));
        return ta;
    }

    const runners = [];
    function buildCell(cell) {
        const div = document.createElement("div");
        div.className = "cell";
        if (cell.label || cell.lead) {
            const head = document.createElement("div");
            head.className = "cell-head";
            if (cell.label) {
                const l = document.createElement("span");
                l.className = "label";
                l.textContent = cell.label;
                head.append(l, " ");
            }
            if (cell.lead) head.append(cell.lead);
            div.append(head);
        }
        const code = textarea("code", cell.code);
        const tryRow = document.createElement("div");
        tryRow.className = "try-row";
        const tryLabel = document.createElement("span");
        tryLabel.textContent = "Try:";
        const tryit = textarea("try", cell.tryit || "");
        const run = document.createElement("button");
        run.textContent = "Run";
        tryRow.append(tryLabel, tryit, run);
        const out = document.createElement("div");
        out.className = "out";
        out.hidden = true;
        div.append(code, tryRow, out);

        const go = async () => {
            out.hidden = false;
            out.textContent = "…";
            showResult(out, await send(code.value + "\n" + tryit.value));
        };
        run.addEventListener("click", go);
        for (const ta of [code, tryit]) {
            ta.addEventListener("keydown", e => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); go(); }
            });
        }
        runners.push(go);

        if (cell.note) {
            const note = document.createElement("div");
            note.className = "note";
            const text = document.createElement("span");
            text.innerHTML = cell.note;
            note.append(text);
            if (cell.fix) {
                const b = document.createElement("button");
                let fixed = false;
                b.textContent = "Load the fix";
                b.addEventListener("click", () => {
                    fixed = !fixed;
                    code.value = fixed ? cell.fix : cell.code;
                    b.textContent = fixed ? "Back to the original" : "Load the fix";
                    autosize(code);
                    out.hidden = true;
                });
                note.append(" ", b);
            }
            div.append(note);
        }
        return div;
    }

    const main = $("notebook");
    for (const cell of NOTEBOOK) {
        if (cell.file) {
            const h = document.createElement("h2");
            h.innerHTML = `<code></code> <span class="when"></span>`;
            h.querySelector("code").textContent = cell.file;
            h.querySelector(".when").textContent = cell.date;
            main.append(h);
            if (cell.intro) {
                const p = document.createElement("p");
                p.className = "section-intro";
                p.innerHTML = cell.intro;
                main.append(p);
            }
        } else if (cell.section) {
            const h = document.createElement("h3");
            h.textContent = cell.section;
            main.append(h);
        } else main.append(buildCell(cell));
    }
    for (const [name, text] of Object.entries(ORIGINALS)) {
        const pre = document.createElement("pre");
        pre.className = "original";
        pre.textContent = text;
        const h = document.createElement("h3");
        h.textContent = name;
        $("originals").append(h, pre);
    }

    $("run-all").addEventListener("click", async () => {
        for (const go of runners) await go();
    });

    // your own Lisp
    const replIn = $("repl-in"), replOut = $("repl-out");
    replIn.addEventListener("input", () => autosize(replIn));
    async function runRepl() {
        const source = replIn.value;
        if (!source.trim()) return;
        const result = await send(source);
        const block = document.createElement("div");
        block.className = "repl-block";
        const echo = document.createElement("div");
        echo.className = "echo";
        echo.textContent = source.trim();
        const out = document.createElement("div");
        out.className = "out";
        showResult(out, result);
        block.append(echo, out);
        replOut.append(block);
        replOut.hidden = false;
        replOut.scrollTop = replOut.scrollHeight;
    }
    $("repl-run").addEventListener("click", runRepl);
    replIn.addEventListener("keydown", e => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); runRepl(); }
    });

    startWorker();
    requestAnimationFrame(() => document.querySelectorAll("textarea").forEach(autosize));
}
