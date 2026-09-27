// Linked Lists and Binary Search Trees — JavaScript port of list.c (July 2005) and tree.c (January 2011)
// by Mihailo Despotovic.
//
// Every function of the C originals is here, step by step, as a generator that yields after each
// statement worth seeing, so the page can animate it. Memory is modeled the way C sees it: nodes
// are allocated and freed explicitly, a node nothing points to that was never freed is leaked, a freed
// node may still be read (use after free), and reading through NULL crashes the program. Each part
// runs either as I wrote it or fixed; the bugs, all in memory handling, are:
//  - list.c deleteTail frees temp->next->next, which is always NULL, instead of temp->next: the last
//    element is never freed;
//  - list.c deleteElement never sets prev before the loop, and has no return when the name isn't found;
//  - list.c deleteAll frees every element but the first, and reads each one after freeing it;
//  - list.c addToEnd, deleteHead, deleteTail and reverseListRecursively crash on an empty list;
//  - tree.c insertValue creates a node at every level it passes, and uses only the last one.
// With the fixes the C programs print exactly the same output as before, and free all their memory.

class Crash extends Error {
    constructor(message, kind = "crash") { super(message); this.kind = kind; }   // kind: "crash" or "undefined"
}

const frame = (msg, ptr = {}, extra = {}) => ({ msg, ptr, ...extra });

// ---- list.c ----

class ListSim {
    constructor(fixed = false) {
        this.fixed = fixed;
        this.head = null;       // `list` in main
        this.heap = [];         // every element ever allocated
        this.out = "";          // what printf printed
        this.freeLog = [];      // what free() was called with, for testing against the C program
        this.nextId = 1;
    }
    createElement(name) {
        const n = { id: this.nextId++, name, next: null, freed: false };
        this.heap.push(n);
        return n;
    }
    free(n) {
        this.freeLog.push(n ? n.name : "NULL");
        if (n) n.freed = true;
    }
    // reading n->next, as C would: NULL crashes, a freed element still holds its old value
    *next(n, expr) {
        const v = expr.split("->")[0];
        if (n === null) throw new Crash(`${expr} with ${v} = NULL: reading through a NULL pointer crashes the program (segmentation fault).`);
        if (n.freed) yield frame(`${expr} reads “${n.name}”, which was already freed (use after free). Its memory usually still holds the old value, so this goes on by luck.`, { [v]: n }, { warn: true });
        return n.next;
    }

    // add element to the start of the list
    *addToStart(element) {
        const list = this.head;
        element.next = list;
        yield frame("element->next = list", { element, list });
        this.head = element;
        yield frame("return element: it is the new head", {});
    }

    // add element to the end of the list
    *addToEnd(element) {
        const list = this.head;
        if (this.fixed && list === null) {
            this.head = element;
            yield frame("The list is empty, so the element is the whole list.", { element });
            return;
        }
        let temp = list;
        yield frame("temp = list", { temp, element });
        while ((yield* this.next(temp, "temp->next")) !== null) {
            temp = temp.next;
            yield frame("temp = temp->next", { temp, element });
        }
        temp.next = element;
        yield frame("temp->next = element", { temp, element });
    }

    // delete head of the list
    *deleteHead() {
        const list = this.head;
        if (this.fixed && list === null) { yield frame("The list is empty: nothing to delete."); return; }
        const newList = yield* this.next(list, "list->next");
        yield frame("newList = list->next", { list, newList });
        this.free(list);
        yield frame("free(list)", { newList });
        this.head = newList;
        yield frame("return newList", {});
    }

    // delete tail of the list
    *deleteTail() {
        const list = this.head;
        if (this.fixed && list === null) { yield frame("The list is empty: nothing to delete."); return; }
        let temp = list;
        yield frame("temp = list", { temp });
        // list has only one element
        if ((yield* this.next(temp, "temp->next")) === null) {
            this.free(list);
            this.head = null;
            yield frame("Only one element: free(list), and the list is empty.", {});
            return;
        }
        // list has more than one element
        while ((yield* this.next(temp.next, "temp->next->next")) !== null) {
            temp = temp.next;
            yield frame("temp = temp->next", { temp });
        }
        if (this.fixed) {
            this.free(temp.next);
            yield frame("free(temp->next): the last element", { temp });
        } else {
            this.free(null);
            yield frame(`free(temp->next->next) frees NULL, which does nothing: the loop just ended because temp->next->next is NULL. The last element, “${temp.next.name}”, is never freed.`, { temp }, { warn: true });
        }
        temp.next = null;
        yield frame("temp->next = NULL", { temp });
    }

    // delete a specific element with a given name
    *deleteElement(name) {
        let prev = this.fixed ? null : undefined;   // undefined: never set, garbage
        let curr = this.head;
        yield frame(this.fixed ? "curr = list, prev = NULL" : "curr = list; prev is never given a value, so it holds garbage", { curr });
        while (curr !== null) {
            yield frame(`strcmp(curr->name, "${name}")`, { curr, prev });
            if (curr.name === name) {
                if (prev === undefined) {
                    throw new Crash(`It's the first element, so the loop never set prev, and if(prev == NULL) tests garbage: this may crash, corrupt memory, or by luck work.`, "undefined");
                }
                if (prev === null) {
                    this.head = this.head.next;
                    yield frame("prev == NULL, so this is the head: list = list->next", { curr });
                } else {
                    prev.next = curr.next;
                    yield frame("prev->next = curr->next", { curr, prev });
                }
                this.free(curr);
                yield frame("free(curr)", { prev });
                return;
            }
            prev = curr;
            curr = yield* this.next(curr, "curr->next");
            yield frame("prev = curr, curr = curr->next", { curr, prev });
        }
        if (this.fixed) { yield frame(`“${name}” isn't in the list: it is returned unchanged.`); return; }
        throw new Crash(`“${name}” isn't in the list, and the function ends without a return statement: the caller gets a garbage pointer as the new list.`, "undefined");
    }

    // delete whole list
    *deleteAll() {
        if (this.fixed) {
            let list = this.head;
            while (list !== null) {
                const next = list.next;
                yield frame("next = list->next", { list, next });
                this.free(list);
                yield frame("free(list)", { next });
                list = next;
            }
            this.head = null;
            yield frame("return NULL: the list is empty", {});
            return;
        }
        let temp = this.head, first = true;
        yield frame("temp = list", { temp });
        for (;;) {
            if (temp === null) {
                this.head = null;
                yield frame("temp == NULL: return NULL", {});
                return;
            }
            temp = yield* this.next(temp, "temp->next");
            yield frame(temp === null ? "temp = temp->next, which is NULL" : "temp = temp->next", { temp });
            this.free(temp);
            yield frame(temp === null ? "free(temp) frees NULL, which does nothing" : `free(temp) frees “${temp.name}”; the element before it is never freed`, { temp }, { warn: temp !== null && first });
            first = false;
        }
    }

    // inverse a list recursively
    *reverseListRecursively(list = this.head, calls = [], top = true) {
        calls = [...calls, list ? list.name : "NULL"];
        if (this.fixed && (list === null || list.next === null)) {
            yield frame(list === null ? "The list is empty: nothing to reverse." : "list->next == NULL: this is the last element, the new head", { list }, { calls });
            if (top) this.head = list;
            return list;
        }
        if ((yield* this.next(list, "list->next")) === null) {
            yield frame("list->next == NULL: this is the last element, the new head", { list }, { calls });
            return list;
        }
        yield frame("reverseListRecursively(list->next): reverse the rest first", { list }, { calls });
        const temp = yield* this.reverseListRecursively(list.next, calls, false);
        list.next.next = list;
        yield frame("list->next->next = list: the next element now points back to this one", { list, temp }, { calls });
        list.next = null;
        yield frame("list->next = NULL", { list, temp }, { calls });
        if (top) this.head = temp;
        return temp;
    }

    // inverse a list iteratively
    *reverseListIteratively() {
        let result = null, current = this.head, next;
        yield frame("result = NULL, current = list", { current, result });
        while (current !== null) {
            next = current.next;
            yield frame("next = current->next", { current, result, next });
            current.next = result;
            yield frame("current->next = result", { current, result, next });
            result = current;
            current = next;
            yield frame("result = current, current = next", { current, result, next });
        }
        this.head = result;
        yield frame("return result: the new head", {});
    }

    // print all elements of the list
    *printList() {
        let temp = this.head, counter = 0;
        while (temp !== null) {
            this.out += `Element ${counter}: ${temp.name}\n`;
            yield frame(`printf("Element %d: %s\\n", ...)`, { temp }, { quiet: true });
            temp = yield* this.next(temp, "temp->next");
            counter++;
        }
        this.out += "\n";
    }

    // elements that were never freed and that nothing in the list points to
    leaked(keep = []) {
        const reachable = new Set(keep);
        for (let n = this.head; n && !reachable.has(n); n = n.next) reachable.add(n);
        return this.heap.filter(n => !n.freed && !reachable.has(n));
    }

    // main() of list.c
    *test() {
        const one = this.createElement("One");
        const two = this.createElement("Two");
        const three = this.createElement("Three");
        const four = this.createElement("Four");
        this.head = this.createElement("Initial element");
        this.doing = "ListElement *list = createElement(\"Initial element\");";
        yield frame("Five elements are created: One, Two, Three, Four, and the list itself, Initial element.", {});
        const step = (doing, gen) => { this.doing = doing; return gen; };
        yield* step("list = addToStart(list, one);", this.addToStart(one));
        yield* step("list = addToStart(list, two);", this.addToStart(two));
        yield* step("list = addToEnd(list, three);", this.addToEnd(three));
        yield* step("list = addToEnd(list, four);", this.addToEnd(four));
        const print = function* (sim, title) {
            sim.out += title + "\n";
            sim.doing = "printList(list);";
            yield* sim.printList();
        };
        yield* print(this, "Initial List:");
        yield* step("list = reverseListRecursively(list);", this.reverseListRecursively());
        yield* print(this, "Reversed Recursively:");
        yield* step("list = reverseListIteratively(list);", this.reverseListIteratively());
        yield* print(this, "Reversed Iteratively:");
        yield* step("list = deleteHead(list);", this.deleteHead());
        yield* print(this, "After delete head:");
        yield* step("list = deleteTail(list);", this.deleteTail());
        yield* print(this, "After delete tail:");
        yield* step("list = deleteElement(list, \"Initial element\");", this.deleteElement("Initial element"));
        yield* print(this, "After delete \"Initial element\":");
        yield* step("list = deleteAll(list);", this.deleteAll());
        yield* print(this, "After delete all:");
        this.doing = "";
    }
}

// ---- tree.c ----

class TreeSim {
    constructor(fixed = false) {
        this.fixed = fixed;
        this.root = null;
        this.leakedNodes = [];   // nodes created by insertValue and never used
        this.out = "";
    }
    createTreeNode(value) { return { value, left: null, right: null }; }
    value(node, expr = "node->value") {
        if (node === null) throw new Crash(`${expr} with ${expr.split("->")[0]} = NULL: reading through a NULL pointer crashes the program (segmentation fault). The comment says both values must be in the tree.`);
        return node.value;
    }

    // print the tree (in order)
    *printTree(tree = this.root) {
        if (tree === null) return;
        yield* this.printTree(tree.left);
        this.out += tree.value + " ";
        yield frame(`printf("%i ", ${tree.value})`, {}, { hl: [tree], quiet: true });
        yield* this.printTree(tree.right);
    }

    // binary search (recursive)
    *findNodeWithValueR(value, tree = this.root, path = []) {
        if (tree === null) {
            this.out += `${value}: not found\n`;
            yield frame(`tree == NULL: ${value} is not in the tree`, {}, { hl: path });
            return;
        }
        path = [...path, tree];
        if (tree.value === value) {
            this.out += `${value}: found\n`;
            yield frame(`${tree.value} == ${value}: found`, {}, { hl: path, found: tree });
            return;
        }
        const left = tree.value >= value;
        yield frame(`${tree.value} ${left ? ">" : "<"} ${value}: search the ${left ? "left" : "right"} subtree`, {}, { hl: path });
        yield* this.findNodeWithValueR(value, left ? tree.left : tree.right, path);
    }

    // binary search (iterative)
    *findNodeWithValueI(value) {
        let node = this.root;
        const path = [];
        while (node !== null) {
            path.push(node);
            if (node.value === value) {
                this.out += `${value}: found\n`;
                yield frame(`${node.value} == ${value}: found`, {}, { hl: path, found: node });
                return;
            }
            const left = node.value >= value;
            yield frame(`${node.value} ${left ? ">" : "<"} ${value}: node = node->${left ? "left" : "right"}`, {}, { hl: path });
            node = left ? node.left : node.right;
        }
        this.out += `${value}: not found\n`;
        yield frame(`node == NULL: ${value} is not in the tree`, {}, { hl: path });
    }

    // find the common ancestor of two values (recursive); the values must exist in the tree
    *findCommonAncestorR(val1, val2, node = this.root, path = []) {
        const v = this.value(node);
        path = [...path, node];
        if (val1 > v && val2 > v) {
            yield frame(`${val1} and ${val2} are both greater than ${v}: go right`, {}, { hl: path });
            yield* this.findCommonAncestorR(val1, val2, node.right, path);
        } else if (val1 < v && val2 < v) {
            yield frame(`${val1} and ${val2} are both less than ${v}: go left`, {}, { hl: path });
            yield* this.findCommonAncestorR(val1, val2, node.left, path);
        } else {
            this.out += `Common ancestor for ${val1} and ${val2} is ${v}.\n`;
            yield frame(`${val1} and ${val2} are on different sides of ${v} (or one of them is ${v}): it is their common ancestor`, {}, { hl: path, found: node });
        }
    }

    // find the common ancestor of two values (iterative); the values must exist in the tree
    *findCommonAncestorI(val1, val2) {
        let node = this.root;
        const path = [];
        for (;;) {
            const v = this.value(node);
            path.push(node);
            if (val1 > v && val2 > v) {
                yield frame(`${val1} and ${val2} are both greater than ${v}: node = node->right`, {}, { hl: path });
                node = node.right;
            } else if (val1 < v && val2 < v) {
                yield frame(`${val1} and ${val2} are both less than ${v}: node = node->left`, {}, { hl: path });
                node = node.left;
            } else {
                this.out += `Common ancestor for ${val1} and ${val2} is ${v}.\n`;
                yield frame(`${val1} and ${val2} are on different sides of ${v} (or one of them is ${v}): it is their common ancestor`, {}, { hl: path, found: node });
                break;
            }
        }
    }

    // insert value into tree
    *insertValue(value, tree = this.root, path = [], top = true) {
        let node = null;
        if (!this.fixed) node = this.createTreeNode(value);
        if (tree === null) {
            if (this.fixed) node = this.createTreeNode(value);
            if (top) this.root = node;
            yield frame(`tree == NULL: the new node ${value} goes here`, {}, { hl: path, fresh: node, top });
            return node;
        }
        path = [...path, tree];
        if (value < tree.value) {
            yield frame(`${value} < ${tree.value}: insert into the left subtree`, {}, { hl: path });
            tree.left = yield* this.insertValue(value, tree.left, path, false);
        } else if (value > tree.value) {
            yield frame(`${value} > ${tree.value}: insert into the right subtree`, {}, { hl: path });
            tree.right = yield* this.insertValue(value, tree.right, path, false);
        } else {
            this.out += `ERROR: duplicate for ${value} found; ignoring.\n`;
            yield frame(`${value} is already in the tree: ignored`, {}, { hl: path, found: tree });
        }
        if (node) {
            this.leakedNodes.push({ value, at: tree.value });
            yield frame(`Back at ${tree.value}: the node for ${value} that createTreeNode made here, before checking whether this is the place for it, is never used or freed.`, {}, { hl: path, warn: true });
        }
        return tree;
    }

    depth(tree = this.root) {
        if (tree === null) return 0;
        return Math.max(this.depth(tree.left), this.depth(tree.right)) + 1;
    }

    // main() of tree.c
    *test() {
        const tree = this.createTreeNode(5);
        tree.left = this.createTreeNode(3);
        tree.right = this.createTreeNode(10);
        tree.left.left = this.createTreeNode(1);
        tree.left.right = this.createTreeNode(4);
        tree.right.left = this.createTreeNode(7);
        tree.right.right = this.createTreeNode(12);
        this.root = tree;
        const step = (doing, gen) => { this.doing = doing; return gen; };
        this.doing = "TreeNode *tree = createTreeNode(5); ...";
        yield frame("The tree is built by hand: 5, then 3 and 10, then 1, 4, 7 and 12.", {});
        this.out += "\n";
        yield* step("printTree(tree);", this.printTree());
        this.out += "\n\n";
        yield* step("findNodeWithValueR(tree, 12);", this.findNodeWithValueR(12));
        yield* step("findNodeWithValueI(tree, 12);", this.findNodeWithValueI(12));
        yield* step("findCommonAncestorR(tree, 4, 12);", this.findCommonAncestorR(4, 12));
        yield* step("findCommonAncestorI(tree, 7, 12);", this.findCommonAncestorI(7, 12));
        this.out += `\nDepth: ${this.depth()}`;
        yield* step("tree = insertValue(tree, 2);", this.insertValue(2));
        this.out += "\nA value 2 inserted\n";
        yield* step("printTree(tree);", this.printTree());
        this.out += `\nDepth: ${this.depth()}\n\n`;
        this.doing = "";
    }
}

if (typeof module !== "undefined") module.exports = { ListSim, TreeSim, Crash };

// ---- UI ----

if (typeof document !== "undefined") {
    const $ = id => document.getElementById(id);
    const SVGNS = "http://www.w3.org/2000/svg";
    const svgEl = (tag, attrs, text) => {
        const e = document.createElementNS(SVGNS, tag);
        for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
        if (text !== undefined) e.textContent = text;
        return e;
    };
    const fixed = () => $("fixed").checked;
    // messages: `code` between backticks is not used; C expressions are recognized by their shape
    const setMsg = (el, f) => {
        el.className = "msg" + (f.crash ? " crash" : f.warn ? " warn" : "");
        el.textContent = f.crash || f.msg || "";
    };

    // animation: play a generator's frames one by one
    function player(section) {
        let busy = false, resolveStep = null;
        const delay = () => ({ slow: 1400, normal: 650, fast: 200, instant: 0 })[$("speed").value];
        const wait = async f => {
            if ($("step").checked && !f.quiet) {
                section.next.disabled = false;
                await new Promise(r => { resolveStep = r; });
                section.next.disabled = true;
                return;
            }
            const ms = f.quiet ? delay() / 3 : delay();
            if (ms) await new Promise(r => setTimeout(r, ms));
        };
        section.next.addEventListener("click", () => { if (resolveStep) { resolveStep(); resolveStep = null; } });
        return async (makeGen, doing) => {
            if (busy) return;
            busy = true;
            section.buttons.forEach(b => { b.disabled = true; });
            const sim = section.sim();
            sim.doing = doing;
            const gen = makeGen(sim);
            let last = {};
            try {
                for (;;) {
                    const { value, done } = gen.next();
                    if (done) break;
                    last = value;
                    section.render(value);
                    await wait(value);
                }
                section.render({ msg: last.warn ? last.msg : "", warn: last.warn, done: true });
            } catch (e) {
                if (!(e instanceof Crash)) throw e;
                section.render({ crash: (e.kind === "crash" ? "The C program crashes here. " : "Undefined behavior. ") + e.message, done: true });
            }
            sim.doing = "";
            section.renderDoing();
            section.buttons.forEach(b => { b.disabled = false; });
            busy = false;
        };
    }

    // ---- the list ----

    let list = new ListSim(fixed());
    const L = {
        next: $("list-next"),
        buttons: [...document.querySelectorAll("#list-section .ops button")],
        sim: () => { list.fixed = fixed(); return list; },
    };
    const NODE_W = 118, NODE_H = 40, GAP = 42, TOP = 46;
    let order = [];   // layout order, kept during an operation so the arrows can be seen turning around

    function layout() {
        order = [];
        for (let n = list.head; n && !order.includes(n); n = n.next) order.push(n);
    }
    L.render = f => {
        const svg = $("list-svg");
        svg.replaceChildren();
        const keep = Object.values(f.ptr || {}).filter(Boolean);
        // nodes shown: the list order, plus anything else still allocated (held by a local variable, or leaked)
        const inList = new Set();
        for (let n = list.head; n && !inList.has(n); n = n.next) inList.add(n);
        const shown = order.filter(n => !n.freed || keep.includes(n) || !f.done);
        for (const n of list.heap) if (!shown.includes(n) && !n.freed && (inList.has(n) || keep.includes(n))) shown.push(n);
        if (f.done) { layout(); shown.length = 0; shown.push(...order); }
        const leaked = list.leaked(keep).filter(n => !shown.includes(n));
        const pos = new Map();
        shown.forEach((n, k) => pos.set(n, { x: 14 + k * (NODE_W + GAP), y: TOP }));
        leaked.forEach((n, k) => pos.set(n, { x: 14 + k * (NODE_W + GAP), y: TOP + 130 }));
        const width = Math.max(400, 28 + Math.max(shown.length, leaked.length, 1) * (NODE_W + GAP));
        const height = leaked.length ? TOP + 190 : TOP + 110;
        svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
        svg.setAttribute("width", width);
        svg.setAttribute("height", height);
        const defs = svgEl("defs", {});
        svg.append(defs);
        defs.innerHTML = `<marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#333"/></marker>`;
        if (leaked.length) {
            svg.append(svgEl("text", { x: 14, y: TOP + 118, class: "leak-label" }, "Leaked: never freed, and nothing in the list points to them"));
        }
        if (!shown.length && !leaked.length) svg.append(svgEl("text", { x: 14, y: TOP + 24, class: "null" }, "list = NULL (empty)"));
        for (const [n, p] of pos) {
            const g = svgEl("g", { class: "node" + (n.freed ? " freed" : "") + (leaked.includes(n) ? " leaked" : "") });
            g.append(svgEl("rect", { x: p.x, y: p.y, width: NODE_W, height: NODE_H, rx: 4 }));
            g.append(svgEl("line", { x1: p.x + NODE_W - 26, y1: p.y, x2: p.x + NODE_W - 26, y2: p.y + NODE_H }));
            g.append(svgEl("text", { x: p.x + (NODE_W - 26) / 2, y: p.y + 25, "text-anchor": "middle", class: "name" }, n.name));
            if (n.freed) g.append(svgEl("text", { x: p.x + NODE_W / 2, y: p.y + NODE_H + 16, "text-anchor": "middle", class: "tag freed-tag" }, "freed"));
            svg.append(g);
        }
        // arrows: next pointers
        for (const [n, p] of pos) {
            const sx = p.x + NODE_W - 13, sy = p.y + NODE_H / 2;
            if (n.next === null) {
                svg.append(svgEl("text", { x: sx, y: sy + 5, "text-anchor": "middle", class: "null" }, "∅"));
                continue;
            }
            const t = pos.get(n.next);
            if (!t) { svg.append(svgEl("text", { x: sx, y: sy + 5, "text-anchor": "middle", class: "null" }, "?")); continue; }
            let d;
            if (t.y === p.y && t.x > p.x) d = `M${sx},${sy} L${t.x - 1},${t.y + NODE_H / 2}`;
            else {   // backwards, or between rows: curve below
                const ty = t.y + NODE_H, tx = t.x + (NODE_W - 26) / 2;
                const dip = Math.max(sy, ty) + 34 + Math.abs(tx - sx) / 12;
                d = `M${sx},${sy + 8} C${sx},${dip} ${tx},${dip} ${tx},${ty + 1}`;
            }
            svg.append(svgEl("path", { d, class: "arrow" + (n.freed ? " stale" : ""), "marker-end": "url(#arrow)" }));
        }
        // pointer variables above the nodes
        const tags = new Map();
        const addTag = (n, label) => { if (!tags.has(n)) tags.set(n, []); tags.get(n).push(label); };
        if (list.head && pos.has(list.head)) addTag(list.head, "main: list");
        const nulls = [];
        for (const [name, n] of Object.entries(f.ptr || {})) {
            if (n === undefined) nulls.push(`${name} = garbage`);
            else if (n === null) nulls.push(`${name} = NULL`);
            else if (pos.has(n)) addTag(n, name);
        }
        for (const [n, labels] of tags) {
            const p = pos.get(n);
            svg.append(svgEl("text", { x: p.x + 4, y: p.y - 8, class: "tag" }, labels.join(", ") + " ↓"));
        }
        $("list-vars").textContent = [
            f.calls ? "calls: " + f.calls.map(c => `reverse(${c})`).join(" → ") : "",
            nulls.join(", "),
        ].filter(Boolean).join("   ·   ");
        setMsg($("list-msg"), f);
        L.renderDoing();
        $("list-out").textContent = list.out;
        $("list-out").scrollTop = $("list-out").scrollHeight;
    };
    L.renderDoing = () => { $("list-doing").textContent = list.doing || ""; };
    const playList = player(L);

    const nameInput = $("list-name");
    const name = () => nameInput.value.trim() || "Node";
    const op = (id, doing, make) => $(id).addEventListener("click", () => { layout(); playList(make, doing()); });
    op("add-start", () => `list = addToStart(list, createElement("${name()}"));`, s => { const e = s.createElement(name()); return s.addToStart(e); });
    op("add-end", () => `list = addToEnd(list, createElement("${name()}"));`, s => { const e = s.createElement(name()); return s.addToEnd(e); });
    op("delete-element", () => `list = deleteElement(list, "${name()}");`, s => s.deleteElement(name()));
    op("delete-head", () => "list = deleteHead(list);", s => s.deleteHead());
    op("delete-tail", () => "list = deleteTail(list);", s => s.deleteTail());
    op("delete-all", () => "list = deleteAll(list);", s => s.deleteAll());
    op("reverse-r", () => "list = reverseListRecursively(list);", s => s.reverseListRecursively());
    op("reverse-i", () => "list = reverseListIteratively(list);", s => s.reverseListIteratively());
    op("print-list", () => "printList(list);", s => s.printList());
    $("list-test").addEventListener("click", () => {
        list = new ListSim(fixed());
        layout();
        playList(s => s.test(), "");
    });
    $("list-reset").addEventListener("click", () => {
        list = new ListSim(fixed());
        for (const n of ["Two", "One", "Initial element", "Three", "Four"]) {
            const e = list.createElement(n);
            if (list.head === null) list.head = e;
            else { let t = list.head; while (t.next) t = t.next; t.next = e; }
        }
        layout();
        L.render({ done: true });
    });
    $("list-empty").addEventListener("click", () => {
        list = new ListSim(fixed());
        layout();
        L.render({ done: true });
    });
    for (const b of document.querySelectorAll("#list-section .names button")) {
        b.addEventListener("click", () => { nameInput.value = b.textContent; });
    }

    // ---- the tree ----

    let tree = new TreeSim(fixed());
    const T = {
        next: $("tree-next"),
        buttons: [...document.querySelectorAll("#tree-section .ops button")],
        sim: () => { tree.fixed = fixed(); return tree; },
    };
    T.render = f => {
        const svg = $("tree-svg");
        svg.replaceChildren();
        const nodes = [];
        const walk = (n, depth) => {
            if (!n) return;
            walk(n.left, depth + 1);
            nodes.push({ n, depth });
            walk(n.right, depth + 1);
        };
        walk(tree.root, 0);
        const DX = 46, DY = 62, R = 17;
        const pos = new Map();
        nodes.forEach(({ n, depth }, k) => pos.set(n, { x: 30 + k * DX, y: 30 + depth * DY }));
        const maxDepth = Math.max(0, ...nodes.map(x => x.depth));
        const width = Math.max(400, 60 + nodes.length * DX), height = 60 + maxDepth * DY + 10;
        svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
        svg.setAttribute("width", width);
        svg.setAttribute("height", height);
        if (!nodes.length) svg.append(svgEl("text", { x: 14, y: 36, class: "null" }, "tree = NULL (empty)"));
        const hl = new Set(f.hl || []);
        for (const { n } of nodes) {
            for (const c of [n.left, n.right]) {
                if (!c) continue;
                const a = pos.get(n), b = pos.get(c);
                svg.append(svgEl("line", { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: "edge" + (hl.has(n) && hl.has(c) ? " on" : "") }));
            }
        }
        for (const { n } of nodes) {
            const p = pos.get(n);
            const cls = "tnode" + (n === f.found ? " found" : hl.has(n) ? " on" : "") + (n === f.fresh ? " fresh" : "");
            const g = svgEl("g", { class: cls });
            g.append(svgEl("circle", { cx: p.x, cy: p.y, r: R }));
            g.append(svgEl("text", { x: p.x, y: p.y + 5, "text-anchor": "middle" }, n.value));
            svg.append(g);
        }
        const leaks = tree.leakedNodes;
        $("tree-leaks").hidden = !leaks.length;
        $("tree-leaks").textContent = leaks.length
            ? `Leaked: ${leaks.length} node${leaks.length === 1 ? "" : "s"} that insertValue made and never used (` + leaks.map(l => `${l.value}, made at ${l.at}`).join("; ") + ")."
            : "";
        $("tree-depth").textContent = `Depth: ${tree.depth()}`;
        setMsg($("tree-msg"), f);
        T.renderDoing();
        $("tree-out").textContent = tree.out;
        $("tree-out").scrollTop = $("tree-out").scrollHeight;
    };
    T.renderDoing = () => { $("tree-doing").textContent = tree.doing || ""; };
    const playTree = player(T);
    const num = id => {
        const v = Number($(id).value);
        return Number.isInteger(v) ? v : 0;
    };
    const top = (id, doing, make) => $(id).addEventListener("click", () => playTree(make, doing()));
    top("insert", () => `tree = insertValue(tree, ${num("tree-value")});`, s => s.insertValue(num("tree-value")));
    top("find-r", () => `findNodeWithValueR(tree, ${num("tree-value")});`, s => s.findNodeWithValueR(num("tree-value")));
    top("find-i", () => `findNodeWithValueI(tree, ${num("tree-value")});`, s => s.findNodeWithValueI(num("tree-value")));
    top("ancestor-r", () => `findCommonAncestorR(tree, ${num("tree-a")}, ${num("tree-b")});`, s => s.findCommonAncestorR(num("tree-a"), num("tree-b")));
    top("ancestor-i", () => `findCommonAncestorI(tree, ${num("tree-a")}, ${num("tree-b")});`, s => s.findCommonAncestorI(num("tree-a"), num("tree-b")));
    top("print-tree", () => "printTree(tree);", s => (function* () { yield* s.printTree(); s.out += "\n"; })());
    $("tree-test").addEventListener("click", () => {
        tree = new TreeSim(fixed());
        playTree(s => s.test(), "");
    });
    $("tree-random").addEventListener("click", () => {
        tree = new TreeSim(fixed());
        const values = [];
        while (values.length < 12) {
            const v = 1 + Math.floor(Math.random() * 60);
            if (!values.includes(v)) values.push(v);
        }
        tree.fixed = true;   // build it quietly, without leaks
        for (const v of values) { const g = tree.insertValue(v); while (!g.next().done); }
        tree.fixed = fixed();
        T.render({ done: true });
    });
    $("tree-reset").addEventListener("click", () => {
        tree = new TreeSim(fixed());
        const g = tree.test();
        g.next();   // just the tree main() builds by hand, before it inserts 2
        tree = Object.assign(new TreeSim(fixed()), { root: tree.root });
        T.render({ done: true });
    });
    $("tree-empty").addEventListener("click", () => {
        tree = new TreeSim(fixed());
        T.render({ done: true });
    });

    const versionChanged = () => {
        $("version-note").textContent = fixed()
            ? "Fixed: every element and node is freed exactly once, and empty lists are handled."
            : "As I wrote it: the bugs are in memory handling, so the printed output looks right.";
    };
    $("fixed").addEventListener("change", versionChanged);
    $("original").addEventListener("change", versionChanged);

    // the original source
    for (const [file, text] of Object.entries(SOURCES)) {
        const h = document.createElement("h3");
        h.textContent = file;
        const pre = document.createElement("pre");
        pre.className = "source";
        pre.textContent = text;
        $("sources").append(h, pre);
    }

    $("list-reset").click();
    $("tree-reset").click();
}
