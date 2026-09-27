"use strict";

// The Arian Web Shop prototype, recreated as it looked on an iPhone 5 with iOS 7: its screens as the storyboard lays
// them out, 320 × 568 points, and its logic from the Objective-C.

const screen = document.getElementById("screen");
const W = 320, H = 568, NAV = 64, TAB = 49;
const DESCRIPTION = "Our state of the art machines handle all materials in all formats.\n\nFor screen printing, we employ four 5-colour machines printing single unit formats on materials of up to 330 x 200 cm.";
const ABOUT = "Arian WebShop App 1.0\n\n© arian Gesellschaft m.b.H\nWünschendorf 160\n8200 Gleisdorf, Austria\n+ 43(0)3112-3171-0\noffice@arian.com\nwww.arian.com\n\niOS programming by MiRteh d.o.o.\nmihailod@me.com";
const ADDRESS = "8200 Gleisdorf\nWünschendorf 160\nAustria";
const fixedOn = () => document.getElementById("fixed")?.checked;

// the app delegate: logged in or not, and the cart
const app = { loggedIn: false, cart: [] };

// ---------------------------------------------------------------------------------------------------------
// A little UIKit, iOS 7 style

function el(tag, cls, css, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (css) Object.assign(e.style, css);
    if (text !== undefined) e.textContent = text;
    return e;
}
const at = (x, y, w, h) => ({ left: x + "px", top: y + "px", width: w + "px", height: h + "px" });

function label(parent, text, x, y, w, h, { size = 17, align = "left", color, weight, cls } = {}) {
    const e = el("div", "label " + (cls || ""), { ...at(x, y, w, h), fontSize: size + "px", textAlign: align, lineHeight: h + "px", color, fontWeight: weight }, text);
    parent.append(e);
    return e;
}
function button(parent, text, x, y, w, h, onTap, { size = 15 } = {}) {
    const e = el("button", "uibutton", { ...at(x, y, w, h), fontSize: size + "px" }, text);
    e.addEventListener("click", () => { if (!e.disabled) onTap(); });
    parent.append(e);
    return e;
}
function field(parent, x, y, w, h, { value = "", placeholder = "", secure = false, readonly = false } = {}) {
    const e = el("input", "uifield", at(x, y, w, h));
    e.value = value; e.placeholder = placeholder;
    if (secure) e.type = "password";
    if (readonly) e.readOnly = true;
    e.spellcheck = false; e.autocomplete = "off";
    parent.append(e);
    return e;
}
function textView(parent, text, x, y, w, h, { size = 14, align = "left" } = {}) {
    const e = el("div", "textview", { ...at(x, y, w, h), fontSize: size + "px", textAlign: align }, text);
    parent.append(e);
    return e;
}
function image(parent, src, x, y, w, h, mode = "fill") {
    const e = el("img", "uiimage " + mode, at(x, y, w, h));
    e.src = src; e.alt = "";
    parent.append(e);
    return e;
}
function spinner(parent, x, y) {
    const e = el("div", "spinner", at(x, y, 20, 20));
    e.hidden = true;
    parent.append(e);
    return e;
}
function segmented(parent, x, y, w, h, items, selected, onChange) {
    const e = el("div", "segmented", at(x, y, w, h));
    const btns = items.map((t, i) => {
        const b = el("button", "", null, t);
        b.addEventListener("click", () => { set(i); onChange(i); });
        e.append(b);
        return b;
    });
    const set = i => { e.value = i; btns.forEach((b, k) => b.classList.toggle("on", k === i)); };
    set(selected);
    e.set = set;
    parent.append(e);
    return e;
}
function stepper(parent, x, y, { min, max, value }, onChange) {
    const e = el("div", "stepper", at(x, y, 94, 29));
    const minus = el("button", "", null, "−"), plus = el("button", "", null, "+");
    e.append(minus, plus);
    const set = v => { e.value = v; minus.disabled = v <= min; plus.disabled = v >= max; };
    minus.addEventListener("click", () => { if (e.value > min) { set(e.value - 1); onChange(e.value); } });
    plus.addEventListener("click", () => { if (e.value < max) { set(e.value + 1); onChange(e.value); } });
    set(value);
    e.set = set;
    parent.append(e);
    return e;
}
// the picker wheel: rows of 32 points around the selection, which snaps
function picker(parent, x, y, w, h, rows, selected, onChange) {
    const e = el("div", "picker", at(x, y, w, h));
    const list = el("div", "picker-list");
    const ROW = 32, padTop = (h - ROW) / 2;
    list.style.paddingTop = list.style.paddingBottom = padTop + "px";
    rows.forEach((t, i) => {
        const r = el("div", "picker-row", { height: ROW + "px", lineHeight: ROW + "px" }, t);
        r.addEventListener("click", () => select(i, true));
        list.append(r);
    });
    e.append(list, el("div", "picker-band", { top: padTop + "px", height: ROW + "px" }));
    let current = selected, timer = null;
    const style = () => {
        const c = list.scrollTop / ROW;
        [...list.children].forEach((r, i) => {
            const d = Math.min(3, Math.abs(i - c));
            r.style.transform = `scale(${1 - d * 0.1})`;
            r.style.opacity = String(Math.max(0.15, 1 - d * 0.35));
        });
    };
    function select(i, animate) {
        list.scrollTo({ top: i * ROW, behavior: animate ? "smooth" : "auto" });
        if (i !== current) { current = i; e.value = i; onChange(i); }
    }
    list.addEventListener("scroll", () => {
        style();
        clearTimeout(timer);
        timer = setTimeout(() => select(Math.max(0, Math.min(rows.length - 1, Math.round(list.scrollTop / ROW))), true), 120);
    });
    e.value = selected;
    parent.append(e);
    requestAnimationFrame(() => { list.scrollTop = selected * ROW; style(); });
    e.set = i => { current = i; e.value = i; list.scrollTop = i * ROW; style(); };
    return e;
}

// UIAlertView: a title, a message, and buttons side by side when there are two
function alert(title, message, buttons = ["OK"]) {
    return new Promise(resolve => {
        const shade = el("div", "alert-shade");
        const box = el("div", "alert");
        box.setAttribute("role", "alertdialog");
        if (title) box.append(el("div", "alert-title", null, title));
        if (message) box.append(el("div", "alert-message", null, message));
        const row = el("div", "alert-buttons" + (buttons.length === 2 ? " two" : ""));
        buttons.forEach((b, i) => {
            const btn = el("button", i === buttons.length - 1 && buttons.length === 1 ? "bold" : "", null, b);
            btn.addEventListener("click", () => { shade.remove(); resolve(i); });
            row.append(btn);
        });
        box.append(row);
        shade.append(box);
        screen.append(shade);
        row.querySelector("button").focus();
    });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// a navigation bar, translucent, over the top of the page
function navBar(page, title, back) {
    const bar = el("div", "navbar");
    bar.append(el("div", "nav-title", null, title));
    if (back) {
        // iOS 7 shows the previous page's title, or "Back" when it doesn't fit
        const b = el("button", "nav-back", null, back.title.length > 8 ? "Back" : back.title);
        b.prepend(el("span", "chev", null, "‹"));
        b.addEventListener("click", back.go);
        bar.append(b);
    }
    page.append(bar);
    return bar;
}

// a table view: rows, a height, and what a tap does
function tableView(parent, x, y, w, h, { rows, rowHeight = 44, render, onSelect, separators = true, onDelete }) {
    const t = el("div", "table", at(x, y, w, h));
    rows.forEach((row, i) => {
        const cell = el("div", "cell" + (separators ? " sep" : ""), { height: rowHeight + "px" });
        const content = el("div", "cell-content");
        render(content, row, i);
        content.append(el("span", "disclosure", null, "›"));
        cell.append(content);
        content.addEventListener("click", () => {
            if (cell.classList.contains("swiped")) { cell.classList.remove("swiped"); return; }
            cell.classList.add("selected");
            setTimeout(() => { cell.classList.remove("selected"); onSelect(row, i); }, 120);
        });
        if (onDelete) {
            // swipe to the left for Delete, as in iOS 7
            const del = el("button", "cell-delete", null, "Delete");
            del.addEventListener("click", () => onDelete(row, i));
            cell.append(del);
            let sx = null;
            content.addEventListener("pointerdown", ev => { sx = ev.clientX; });
            content.addEventListener("pointerup", ev => {
                if (sx !== null && sx - ev.clientX > 30) cell.classList.add("swiped");
                else if (sx !== null && ev.clientX - sx > 30) cell.classList.remove("swiped");
                sx = null;
            });
            content.addEventListener("contextmenu", ev => { ev.preventDefault(); cell.classList.toggle("swiped"); });
        }
        t.append(cell);
    });
    parent.append(t);
    return t;
}

// ---------------------------------------------------------------------------------------------------------
// The tabs, each with its stack of pages

const tabs = [
    { name: "Browse", icon: "img/tab-browse.png", stack: [], root: () => browseRoot() },
    { name: "Search", icon: "img/tab-search.png", stack: [], root: () => searchRoot() },
    { name: "Cart", icon: "img/tab-cart.png", stack: [], root: () => cartRoot(), badge: null },
    { name: "Account", icon: "img/tab-account.png", stack: [], root: () => accountPage() },
    { name: "About", icon: "img/tab-about.png", stack: [], root: () => aboutPage() },
];
let current = 0;
const content = el("div", "content");
const tabbar = el("div", "tabbar");
screen.append(content, tabbar);

function renderTabbar() {
    tabbar.replaceChildren();
    tabs.forEach((t, i) => {
        const b = el("button", "tab" + (i === current ? " on" : ""));
        b.setAttribute("aria-label", t.name);
        const icon = el("span", "tab-icon", { maskImage: `url(${t.icon})`, webkitMaskImage: `url(${t.icon})` });
        b.append(icon, el("span", "tab-name", null, t.name));
        if (t.badge) b.append(el("span", "badge", null, t.badge));
        b.addEventListener("click", () => selectTab(i));
        tabbar.append(b);
    });
}
function setBadge(n) { tabs[2].badge = n ? String(n) : null; renderTabbar(); }

function selectTab(i) {
    current = i;
    const t = tabs[i];
    if (!t.stack.length) t.stack.push(t.root());
    show();
    const top = t.stack[t.stack.length - 1];
    top.appear?.();
}
function show(direction) {
    const t = tabs[current];
    const page = t.stack[t.stack.length - 1];
    content.replaceChildren(page.el);
    if (direction) {
        page.el.animate([{ transform: `translateX(${direction > 0 ? W : -W / 3}px)` }, { transform: "none" }], { duration: 280, easing: "ease-out" });
    }
    renderTabbar();
}
function push(page) { tabs[current].stack.push(page); show(1); page.appear?.(); }
function pop() {
    const t = tabs[current];
    if (t.stack.length > 1) t.stack.pop();
    show(-1);
    t.stack[t.stack.length - 1].appear?.();
}
function newPage() { return el("div", "page"); }

// ---------------------------------------------------------------------------------------------------------
// apFirstViewController: the three kinds of product

function browseRoot() {
    const p = newPage();
    const items = [
        ["Printed Products", "Cards, Labels, Flyers...", "img/printedproducts.jpg", products1],
        ["Marketing Ads", "Flags, Posters, Signs...", "img/marketingads.jpg", products2],
        ["Add-Ons", "Bags, Stands, Trays...", "img/addons.jpg", products3],
    ];
    tableView(p, 0, NAV, W, H - NAV - TAB, {
        rows: items, rowHeight: 90, separators: false,
        render: (c, [title, sub, img]) => {
            image(c, img, 15, 1, 120, 88, "cover");
            label(c, title, 150, 22, 150, 24, { size: 18 });
            label(c, sub, 150, 48, 150, 18, { size: 12, color: "#8e8e93" });
        },
        onSelect: ([title, , , list]) => push(productList(title, list)),
    });
    navBar(p, "Arian Products");
    return { el: p };
}

// ap2: the products of one kind
function productList(title, list) {
    const p = newPage();
    tableView(p, 0, NAV, W, H - NAV - TAB, {
        rows: list,
        render: (c, name) => label(c, name, 15, 0, 270, 43, { size: 18 }),
        onSelect: name => push(productDetail(name, null, title)),
    });
    navBar(p, title, { title: "Arian Products", go: pop });
    return { el: p };
}

// ---------------------------------------------------------------------------------------------------------
// apProductDetailViewController: the product, and for the panoramic canvas, its configurator

function productDetail(name, cartItem = null, backTitle = null) {
    const p = newPage();
    const canvas = name === "Panoramic Canvas";
    const update = !!cartItem;
    // the stray label from the storyboard, under the translucent bar
    label(p, "Label", 139, 30, 42, 21);
    const img = image(p, canvas ? "img/canvas.jpg" : "img/product.jpg", 20, 75, 132, 82);
    const formatPic = image(p, "img/inkcans.jpg", 168, 75, 132, 81, "center");
    let format = null, resolution = null;
    if (canvas) {
        format = picker(p, 0, 142, W, 162, panoramicCanvasFormats, update ? cartItem.format : 0, () => refresh());
        label(p, "Minimal Resolution", 20, 340, 146, 21, { align: "right" });
        resolution = label(p, "", 165, 330, 135, 41, { align: "right" });
    } else {
        textView(p, DESCRIPTION, 20, 165, 280, 244);
    }
    label(p, "Quantity", 20, 421, 65, 21);
    const quantity = label(p, "250", 97, 421, 98, 21, { align: "center" });
    let stepperValue = update ? quantities.indexOf(cartItem.quantity) + 1 : 1;
    const step = stepper(p, 206, 417, { min: 1, max: 11, value: stepperValue }, v => { stepperValue = v; refresh(); });
    label(p, "Delivery", 20, 457, 61, 21);
    let delivery = update ? cartItem.delivery : 0;
    segmented(p, 91, 454, 209, 29, ["Standard", "Express", "Priority"], delivery, i => { delivery = i; refresh(); });
    const priceLabel = label(p, "€399.00", 20, 490, 192, 20, { size: 16, color: "#ff0000" });
    const add = button(p, update ? "Update" : "Add to Cart", 219, 485, 81, 30, addToCart);
    const spin = spinner(p, 257, 490);
    navBar(p, name, { title: backTitle ?? "Back", go: pop });

    // what the cart gets: the item as configured now
    let item = update ? cartItem : {};
    function refresh() {
        const f = canvas ? format.value : 0;
        const r = price(f, stepperValue, delivery, fixedOn());
        Object.assign(item, { name, price: r.price, cents: r.cents, image: canvas ? "img/canvas.jpg" : "img/product.jpg", format: f, delivery, discount: r.discountPercent, quantity: r.quantityValue });
        priceLabel.textContent = euro(r.price) + (r.discountPercent ? ` (${r.discountPercent}% off)` : "");
        quantity.textContent = String(r.quantityValue);
        if (canvas) {
            resolution.textContent = panoramicCanvasResolutions[f];
            formatPic.src = `img/pc${f + 1}.png`;
        }
    }
    async function addToCart() {
        if (!app.loggedIn) {
            await alert("Not Logged In", "To start shopping, you must be logged in first. Go to the account screen and log in.");
            return;
        }
        add.disabled = true;
        spin.hidden = false;
        await sleep(250);            // it asked for file:///Users/mihailod/Documents/links.html, a file on my Mac
        if (!update) app.cart.push({ ...item });
        setBadge(app.cart.length);
        spin.hidden = true;
        add.disabled = false;
    }
    refresh();
    return { el: p, appear: () => { refresh(); } };
}

// ---------------------------------------------------------------------------------------------------------
// apSearchViewController

function searchRoot() {
    const p = newPage();
    const bar = el("div", "searchbar", at(0, NAV, W, 44));
    const input = el("input", "search-field");
    input.placeholder = "Search";
    input.type = "search";
    input.setAttribute("aria-label", "Search Arian products");
    bar.append(input);
    p.append(bar);
    let results = [], table = null;
    const refresh = () => {
        results = search(input.value);
        table?.remove();
        table = tableView(p, 0, 108, W, H - 108 - TAB, {
            rows: results,
            render: (c, name) => label(c, name, 15, 0, 270, 43, { size: 18 }),
            onSelect: name => push(productDetail(name, null, "Search")),
        });
    };
    input.addEventListener("input", refresh);
    input.addEventListener("keydown", e => { if (e.key === "Enter") input.blur(); });
    navBar(p, "Search Arian Products");
    return { el: p };
}

// ---------------------------------------------------------------------------------------------------------
// apShoppingCart

function cartRoot() {
    const p = newPage();
    let table = null;
    label(p, "Shopping Cart", 78, 24, 164, 37, { align: "center" });
    const empty = label(p, "Your cart is empty", 91, 138, 139, 21, { align: "center" });
    const emptyCart = button(p, "Empty Cart", 121, 440, 78, 30, async () => {
        if (await alert(null, "Remove all items from the cart?", ["Yes", "No"]) === 0) emptyCartLogic();
    });
    const total = label(p, "Order Total", 10, 480, 85, 21);
    const sum = label(p, "€399.00", 103, 481, 117, 18, { size: 15, color: "#ff0000", align: "center" });
    const placeOrder = button(p, "Place Order", 228, 474, 82, 30, async () => {
        if (!app.loggedIn) {
            await alert("Not Logged In", "To place an order, you must be logged in first. Go to the account screen and log in.");
            return;
        }
        if (await alert(null, "Place order with Arian?", ["Yes", "No"]) !== 0) return;
        placeOrder.disabled = true; emptyCart.disabled = true; spin.hidden = false;
        await sleep(2000);
        spin.hidden = true; placeOrder.disabled = false; emptyCart.disabled = false;
        emptyCartLogic();
        await alert("Thank You", "Your order was processed.\nOrder number: W45589340\nReceipt will be sent to your email.");
    });
    const spin = spinner(p, 249, 450);
    navBar(p, "Shopping Cart");
    function emptyCartLogic() { app.cart.length = 0; refreshView(); }
    function refreshView() {
        const n = app.cart.length;
        empty.hidden = n !== 0;
        for (const e of [total, sum, placeOrder, emptyCart]) e.hidden = n === 0;
        table?.remove();
        table = null;
        if (n) {
            sum.textContent = euro(cartSum(app.cart, fixedOn()));
            table = tableView(p, 0, 65, W, 363, {
                rows: app.cart,
                render: (c, it) => {
                    image(c, it.image, 15, 4, 48, 36, "cover");
                    label(c, euro(it.price), 75, 3, 210, 22, { size: 18 });
                    label(c, `${it.quantity} ${it.name}`, 75, 24, 210, 16, { size: 12, color: "#8e8e93" });
                },
                onSelect: it => push(productDetail(it.name, it, "Shopping Cart")),
                onDelete: (it, i) => { app.cart.splice(i, 1); refreshView(); },
            });
            p.insertBefore(table, p.querySelector(".navbar"));
        }
        setBadge(n);
    }
    refreshView();
    return { el: p, appear: refreshView };
}

// ---------------------------------------------------------------------------------------------------------
// apAccountVC

function accountPage() {
    const p = newPage();
    label(p, "Your Arian Account Settings", 50, 24, 221, 37, { align: "center", weight: 600 });
    label(p, "Username", 20, 76, 79, 21);
    label(p, "Password", 20, 114, 76, 21);
    const user = field(p, 107, 72, 193, 30);
    const pass = field(p, 107, 110, 193, 30, { secure: true });
    user.setAttribute("aria-label", "Username"); pass.setAttribute("aria-label", "Password");
    const login = button(p, "Login", 137, 148, 49, 30, loginAction);
    const spin = spinner(p, 98, 153);
    // shown when logged in
    const shown = [
        label(p, "email", 20, 190, 41, 21), label(p, "Payment", 20, 228, 87, 21),
        label(p, "Billing", 20, 312, 47, 25), label(p, "Shipping", 20, 386, 68, 23),
        field(p, 107, 186, 193, 30, { value: "arianUser@arian.com", readonly: true }),
        field(p, 171, 224, 129, 30, { value: "**** **** **** 3498", readonly: true }),
        field(p, 244, 255, 56, 30, { value: "05/23", readonly: true }),
        textView(p, ADDRESS, 107, 292, 193, 80), textView(p, ADDRESS, 107, 365, 193, 80),
        image(p, "img/visa.png", 107, 215, 56, 47, "contain"),
        image(p, "img/austria.png", 244, 310, 56, 30, "flag"), image(p, "img/austria.png", 244, 383, 56, 30, "flag"),
    ];
    function refreshView() {
        if (!app.loggedIn) { user.value = ""; pass.value = ""; }
        login.textContent = app.loggedIn ? "Logout" : "Login";
        shown.forEach(e => { e.hidden = !app.loggedIn; });
    }
    async function loginAction() {
        if (!user.value.length) { await alert(null, "Please enter the username"); return; }
        if (!pass.value.length) { await alert(null, "Please enter the password"); return; }
        login.disabled = true; spin.hidden = false;
        await sleep(1000);
        app.loggedIn = !app.loggedIn;
        if (!app.loggedIn) { app.cart.length = 0; setBadge(0); }
        refreshView();
        spin.hidden = true; login.disabled = false;
    }
    for (const f of [user, pass]) f.addEventListener("keydown", e => { if (e.key === "Enter") f.blur(); });
    app.loggedIn = false;          // viewDidLoad
    refreshView();
    return { el: p };
}

// ---------------------------------------------------------------------------------------------------------
// About, and the Terms of Service and the Privacy Policy, which curl up from it

function aboutPage() {
    const p = newPage();
    label(p, "About arian WebShop", 56, 24, 209, 37, { align: "center" });
    const tv = textView(p, "", 20, 69, 280, 202, { align: "center" });
    tv.innerHTML = ABOUT.split("\n").map(l => /^\+|@|www\./.test(l) ? `<span class="detected">${l}</span>` : l).join("<br>");
    button(p, "Terms of Service", 20, 279, 139, 30, () => curl(TERMS));
    button(p, "Privacy Policy", 161, 279, 139, 30, () => curl(PRIVACY));
    image(p, "img/arianbuilding.jpg", 0, 317, 320, 203);
    navBar(p, "About");
    function curl(text) {
        const m = el("div", "modal");
        textView(m, text, 0, 76, W, H - 76);
        const back = el("button", "curl", null, "");
        back.setAttribute("aria-label", "Back to About");
        back.addEventListener("click", () => m.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250 }).onfinish = () => m.remove());
        m.append(back);
        screen.append(m);
        m.animate([{ clipPath: "polygon(0 0, 100% 0, 100% 0, 0 0)" }, { clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" }], { duration: 450, easing: "ease-out" });
    }
    return { el: p };
}

// ---------------------------------------------------------------------------------------------------------
// the launch image, then the app

function start() {
    app.loggedIn = false;
    app.cart = [];
    for (const t of tabs) { t.stack = []; t.badge = null; }
    screen.querySelectorAll(".alert-shade, .modal, .launch").forEach(e => e.remove());
    const launch = el("img", "launch");
    launch.src = "img/splash.jpg"; launch.alt = "";
    screen.append(launch);
    selectTab(0);
    setTimeout(() => launch.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300 }).onfinish = () => launch.remove(), 900);
}
document.getElementById("restart").addEventListener("click", start);
document.getElementById("fixed").addEventListener("change", () => {
    // the prices on the screen now, and in the cart, as the other version computes them
    for (const it of app.cart) { const r = price(it.format, quantities.indexOf(it.quantity) + 1, it.delivery, fixedOn()); it.price = r.price; it.cents = r.cents; }
    const t = tabs[current];
    t.stack[t.stack.length - 1]?.appear?.();
});
start();
