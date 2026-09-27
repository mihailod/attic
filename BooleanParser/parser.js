// Boolean Expression Parser — JavaScript port of Parser.java (Mihailo Despotovic, January 2003)
// Boolean expressions over numbered terms, like #0# AND ( #2# OR NOT #3# ), are parsed by recursive
// descent with the grammar from the original:
//     E -> F { OR F }        an expression is terms joined by OR
//     F -> P { AND P }       a term is factors joined by AND, so AND binds tighter than OR
//     P -> ( E ) | NOT P | #1# | #2# | ...
// The page draws the parse tree, turns it into postfix (reverse Polish) notation, and prints the
// truth table.
//
// Changes from the original:
//  - Finished the parser, which never stored the numbers in the tree and overwrote the right branch
//    on every further AND or OR.
//  - Fixed the grammar: it had P -> NOT E, so NOT swallowed the rest of the expression; now NOT
//    applies to the factor right after it.
//  - Fixed translate(), which main() used to make the postfix form with an operator stack. It only
//    popped the stack at ")" and at the end, so it ignored precedence (#1# AND #2# OR #3# became
//    1 2 3 or and) and NOT applied to everything after it; and it ran operators and numbers together
//    (" or3"). Now it pops tighter operators before pushing AND or OR, treats NOT as applying to
//    what follows, pops back to the matching "(" at ")", and separates tokens with spaces. The
//    original is kept too, and its answers are shown in the truth table for comparison.

// ---- tokens ----

// splits the input into tokens: ( ) AND OR NOT and #n#; words are case-insensitive, spaces optional
function tokenize(text) {
    const tokens = [];
    const re = /\s*(?:(\()|(\))|#\s*(\d+)\s*#|([A-Za-z]+)|(\S))/y;
    let m;
    while (re.lastIndex < text.length && (m = re.exec(text))) {
        const at = m.index + m[0].length - m[0].trimStart().length;
        if (m[1]) tokens.push({ type: "(", at });
        else if (m[2]) tokens.push({ type: ")", at });
        else if (m[3] !== undefined) tokens.push({ type: "term", n: Number(m[3]), at });
        else if (m[4]) {
            const word = m[4].toUpperCase();
            if (!["AND", "OR", "NOT"].includes(word)) throw new SyntaxError(`Unknown word “${m[4]}”: use AND, OR, NOT and terms like #1#`);
            tokens.push({ type: word, at });
        } else throw new SyntaxError(`Unexpected “${m[5]}”: terms are written like #1#`);
        if (/^\s*$/.test(text.slice(re.lastIndex))) break;
    }
    return tokens;
}

// ---- the parser: builds a tree of { op: "or" | "and", l, r }, { op: "not", child } and { term: n } ----

function parse(text) {
    const tokens = tokenize(text);
    if (tokens.length === 0) throw new SyntaxError("Type an expression, like #1# AND ( #2# OR NOT #3# )");
    let pos = 0;
    const next = () => (pos < tokens.length ? tokens[pos].type : "end");
    const describe = () => (pos < tokens.length ? `“${tokens[pos].type === "term" ? "#" + tokens[pos].n + "#" : tokens[pos].type}”` : "the end");

    function matchE() {
        let node = matchF();
        while (next() === "OR") {
            pos++;
            node = { op: "or", l: node, r: matchF() };
        }
        return node;
    }
    function matchF() {
        let node = matchP();
        while (next() === "AND") {
            pos++;
            node = { op: "and", l: node, r: matchP() };
        }
        return node;
    }
    function matchP() {
        if (next() === "(") {
            pos++;
            const node = matchE();
            if (next() !== ")") throw new SyntaxError(`Expected “)” but found ${describe()}`);
            pos++;
            return node;
        }
        if (next() === "NOT") {
            pos++;
            return { op: "not", child: matchP() };
        }
        if (next() === "term") return { term: tokens[pos++].n };
        throw new SyntaxError(`Expected a term like #1#, “(” or NOT, but found ${describe()}`);
    }

    const tree = matchE();
    if (pos < tokens.length) throw new SyntaxError(`Unexpected ${describe()} after a complete expression`);
    return { tree, tokens };
}

function postfix(node) {
    if ("term" in node) return [String(node.term)];
    if (node.op === "not") return [...postfix(node.child), "not"];
    return [...postfix(node.l), ...postfix(node.r), node.op];
}

function evaluate(node, values) {
    if ("term" in node) return values[node.term];
    if (node.op === "not") return !evaluate(node.child, values);
    if (node.op === "and") return evaluate(node.l, values) && evaluate(node.r, values);
    return evaluate(node.l, values) || evaluate(node.r, values);
}

function terms(node, set = new Set()) {
    if ("term" in node) set.add(node.term);
    else if (node.op === "not") terms(node.child, set);
    else { terms(node.l, set); terms(node.r, set); }
    return set;
}

// ---- translate(): the expression, in the original's format of tokens separated by single spaces,
// to postfix with an operator stack ----

const PRECEDENCE = { not: 3, and: 2, or: 1 };

function translate(s) {
    const stack = [];
    const out = [];
    const nextToken = () => {
        const space = s.indexOf(" ");
        return space < 0 ? s : s.substring(0, space);
    };
    const skip = token => { s = s.length === token.length ? "" : s.substring(token.length + 1); };
    // before a binary operator, pop the operators on the stack that bind at least as tightly
    const pushBinary = op => {
        while (stack.length && stack[stack.length - 1] !== "(" && PRECEDENCE[stack[stack.length - 1]] >= PRECEDENCE[op]) {
            out.push(stack.pop());
        }
        stack.push(op);
    };
    for (;;) {
        const nt = nextToken();
        if (nt.startsWith("#") && nt.endsWith("#") && nt.length > 2) {
            out.push(nt.substring(1, nt.length - 1));
            skip(nt);
        } else if (nt === "OR" || nt === "AND") {
            pushBinary(nt.toLowerCase());
            skip(nt);
        } else if (nt === "NOT") {
            // NOT applies to what follows, so it waits on the stack until that is complete
            stack.push("not");
            skip(nt);
        } else if (nt === "(") {
            stack.push("(");
            skip(nt);
        } else if (nt === ")") {
            while (stack.length && stack[stack.length - 1] !== "(") out.push(stack.pop());
            if (stack.length === 0) return { output: out.join(" "), error: "“)” without a matching “(”" };
            stack.pop();
            skip(nt);
        } else break;
    }
    while (stack.length) {
        const op = stack.pop();
        if (op === "(") return { output: out.join(" "), error: "“(” without a matching “)”" };
        out.push(op);
    }
    return { output: out.join(" "), error: null };
}

// ---- the original translate(), as written in 2003 ----

function translate2003(s) {
    const stack = [];
    let res = "";
    const nextToken = () => {
        const space = s.indexOf(" ");
        return space < 0 ? s : s.substring(0, space);
    };
    const matchNumber = () => {
        s = s.substring(1);
        const end = s.indexOf("#");
        if (s.length > 2) s = s.substring(end + 2);
    };
    for (let guard = 0; guard < 10000; guard++) {
        const nt = nextToken();
        if (nt.startsWith("#") && nt.endsWith("#") && nt.length > 1) {
            res += nt.substring(1, nt.length - 1) + " ";
            matchNumber();
        } else if (nt === "OR") {
            stack.push(" or");
            s = s.substring("OR ".length);
        } else if (nt === "AND") {
            stack.push(" and");
            s = s.substring("AND ".length);
        } else if (nt === "(") {
            s = s.substring("( ".length);
        } else if (nt === ")") {
            // Java's Stack.pop() on an empty stack throws
            if (stack.length === 0) return { output: res, error: "EmptyStackException" };
            res += stack.pop();
            s = s.length === 1 ? "" : s.substring(") ".length);
        } else if (nt === "NOT") {
            stack.push(" not");
            s = s.substring("NOT ".length);
        } else break;
    }
    while (stack.length) res += stack.pop();
    return { output: res, error: null };
}

// the original's input format: every token followed by a single space, except the last
const format2003 = tokens => tokens.map(t => (t.type === "term" ? `#${t.n}#` : t.type)).join(" ");

// Evaluates the original's postfix output. Its operators and numbers can run together ("or3"), so
// the tokens are found by pattern rather than by spaces. Returns null if it doesn't evaluate to
// exactly one value.
function evaluatePostfix(text, values) {
    const stack = [];
    for (const t of text.match(/\d+|and|or|not/g) ?? []) {
        if (t === "not") {
            if (stack.length < 1) return null;
            stack.push(!stack.pop());
        } else if (t === "and" || t === "or") {
            if (stack.length < 2) return null;
            const b = stack.pop(), a = stack.pop();
            stack.push(t === "and" ? a && b : a || b);
        } else stack.push(values[Number(t)]);
    }
    return stack.length === 1 ? stack[0] : null;
}

if (typeof module !== "undefined") {
    module.exports = { tokenize, parse, postfix, evaluate, terms, translate, translate2003, format2003, evaluatePostfix };
}

// ---- UI ----

if (typeof document !== "undefined") {
    const $ = id => document.getElementById(id);
    const MAX_TERMS = 10;
    const SVG_NS = "http://www.w3.org/2000/svg";

    function show() {
        const text = $("input").value;
        let parsed;
        try {
            parsed = parse(text);
        } catch (e) {
            if (!(e instanceof SyntaxError)) throw e;
            $("error").textContent = e.message;
            for (const id of ["results"]) $(id).hidden = true;
            return;
        }
        $("error").textContent = "";
        $("results").hidden = false;
        const { tree, tokens } = parsed;

        drawTree(tree);
        $("postfix").textContent = postfix(tree).join(" ");

        const original = format2003(tokens);
        const fixed = translate(original);
        const old = translate2003(original);
        $("original-input").textContent = original;
        $("original-output").textContent = fixed.error ? `${fixed.output}   (error: ${fixed.error})` : fixed.output;
        $("old-output").textContent = old.error ? `${old.output}   (then stops: ${old.error})` : JSON.stringify(old.output);

        // truth table
        const vars = [...terms(tree)].sort((x, y) => x - y);
        const table = $("table");
        table.replaceChildren();
        const head = table.createTHead().insertRow();
        for (const v of vars) head.insertCell().outerHTML = `<th>#${v}#</th>`;
        head.insertCell().outerHTML = "<th>Result</th>";
        head.insertCell().outerHTML = "<th>translate()</th>";
        head.insertCell().outerHTML = "<th>2003 original</th>";
        const body = table.createTBody();
        let wrongFixed = 0, wrongOld = 0;
        const rows = 2 ** Math.min(vars.length, MAX_TERMS);
        const cell = (tr, value, right) => {
            const td = tr.insertCell();
            td.textContent = value === null ? "?" : value ? "T" : "F";
            if (value !== right) td.className = "differs";
            return value !== right;
        };
        for (let m = 0; m < rows; m++) {
            const values = {};
            vars.forEach((v, i) => { values[v] = Boolean((m >> (vars.length - 1 - i)) & 1); });
            const right = evaluate(tree, values);
            const tr = body.insertRow();
            for (const v of vars) tr.insertCell().textContent = values[v] ? "T" : "F";
            tr.insertCell().textContent = right ? "T" : "F";
            if (cell(tr, fixed.error ? null : evaluatePostfix(fixed.output, values), right)) wrongFixed++;
            if (cell(tr, old.error ? null : evaluatePostfix(old.output, values), right)) wrongOld++;
        }
        $("table-note").textContent = vars.length > MAX_TERMS ? `Only the first ${rows} of ${2 ** vars.length} rows are shown.` : "";

        $("verdict").textContent = wrongFixed === 0
            ? `translate() is right on every row.`
            : `translate() is wrong on ${wrongFixed} of ${rows} rows.`;
        $("verdict").className = wrongFixed === 0 ? "good" : "bad";
        const runTogether = /(and|or|not)\d/.test(old.output);
        $("old-verdict").textContent = "As written in 2003, it "
            + (old.error ? `stops with ${old.error}` : wrongOld === 0 ? "happens to be right on every row" : `is wrong on ${wrongOld} of ${rows} rows (highlighted in its column)`)
            + (runTogether ? ", and runs operators and numbers together." : ".");
    }

    // Draws the tree: leaves spread out in order along the bottom, each operator above its children
    function drawTree(tree) {
        const svg = $("tree");
        svg.replaceChildren();
        const nodes = [];
        let leaf = 0;
        function place(node, depth) {
            const item = { node, depth, children: [] };
            if ("term" in node) item.x = leaf++;
            else {
                item.children = node.op === "not" ? [place(node.child, depth + 1)] : [place(node.l, depth + 1), place(node.r, depth + 1)];
                item.x = item.children.reduce((s, c) => s + c.x, 0) / item.children.length;
            }
            nodes.push(item);
            return item;
        }
        const root = place(tree, 0);
        const depth = Math.max(...nodes.map(n => n.depth));
        const DX = 58, DY = 58, PAD = 30;
        const W = Math.max(leaf - 1, 0) * DX + 2 * PAD, H = depth * DY + 2 * PAD;
        svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
        svg.style.width = Math.min(W, 760) + "px";
        const pos = n => [PAD + n.x * DX, PAD + n.depth * DY];
        const el = (name, attrs, text) => {
            const e = document.createElementNS(SVG_NS, name);
            for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
            if (text !== undefined) e.textContent = text;
            svg.append(e);
            return e;
        };
        for (const n of nodes) for (const c of n.children) {
            const [x1, y1] = pos(n), [x2, y2] = pos(c);
            el("line", { x1, y1, x2, y2, class: "edge" });
        }
        for (const n of nodes) {
            const [x, y] = pos(n);
            const isTerm = "term" in n.node;
            el("circle", { cx: x, cy: y, r: 19, class: isTerm ? "term" : "op " + n.node.op });
            el("text", { x, y: y + 1 }, isTerm ? "#" + n.node.term + "#" : n.node.op.toUpperCase());
        }
        return root;
    }

    $("form").addEventListener("submit", e => {
        e.preventDefault();
        show();
    });
    $("input").addEventListener("input", show);
    for (const b of document.querySelectorAll("[data-example]")) {
        b.addEventListener("click", () => {
            $("input").value = b.dataset.example;
            show();
        });
    }
    show();
}
