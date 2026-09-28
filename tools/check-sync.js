#!/usr/bin/env node
// Checks that index.html and README.md say the same: the title, the intro, and every year, entry and milestone, with the same
// title, link, month and description. The README's links go to the site (https://mihailod.github.io/attic/...), the
// index's are relative; that difference is expected. So are three parts only the README has, being about the
// repository: the "HTML version of this page" line, "Running them" and "Credits".
//
//   node tools/check-sync.js            checks the files on disk
//   node tools/check-sync.js --staged   checks what is staged for the next commit (the pre-commit hook uses this)

const fs = require("fs"), path = require("path"), { execFileSync } = require("child_process");
const ROOT = path.join(__dirname, "..");
const SITE = "https://mihailod.github.io/attic/";
const README_ONLY = [/^(Clean )?HTML version of this page:/];
const README_ONLY_SECTIONS = ["Running them", "Credits"];

const staged = process.argv.includes("--staged");
const read = f => staged ? execFileSync("git", ["show", ":" + f], { cwd: ROOT, encoding: "utf8" }) : fs.readFileSync(path.join(ROOT, f), "utf8");

// the index's HTML, written the way the README writes it
const md = s => s
    .replace(/<a href="([^"]+)">([\s\S]+?)<\/a>/g, "[$2]($1)")
    .replace(/<\/?i>/g, "*").replace(/<\/?b>/g, "**")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&")
    .replace(/\s+/g, " ").trim();
const relative = s => s.split(SITE).join("");

function fromIndex(html) {
    const title = md(/<h1>([\s\S]*?)<\/h1>/.exec(html)[1]);
    const head = html.slice(html.indexOf("</h1>"), html.indexOf("<h2>"));
    const intro = [];
    for (const m of head.matchAll(/<p class="intro">([\s\S]*?)<\/p>|<blockquote>([\s\S]*?)<\/blockquote>/g)) {
        if (m[1] !== undefined) intro.push(md(m[1]));
        else {
            const q = /<p>([\s\S]*?)<\/p>/.exec(m[2])[1], who = /<footer>([\s\S]*?)<\/footer>/.exec(m[2])[1];
            intro.push(`> ${md(q)} > ${md(who)}`);
        }
    }
    const entries = [];
    for (const m of html.matchAll(/<h2>(\d{4})<\/h2>|<div class="title"><a href="([^"]+)">([\s\S]+?)<\/a><span class="date">([^<]+)<\/span><\/div>\s*<p>([\s\S]*?)<\/p>|<li class="milestone">\s*<div class="title"><span class="what">([\s\S]*?)<\/span><span class="date">([^<]+)<\/span><\/div>/g))
        entries.push(m[1] ? { year: m[1] } : m[6] !== undefined ? { milestone: md(m[6]), month: m[7].trim() }
            : { link: m[2], title: md(m[3]), month: m[4].trim(), text: md(m[5]) });
    return { title, intro, entries };
}

function fromReadme(text) {
    text = relative(text.replace(/\r/g, ""));
    const title = /^# (.*)$/m.exec(text)[1].trim();
    const head = text.slice(text.indexOf("\n", text.indexOf("# ")), text.search(/^## /m));
    const intro = head.split(/\n\s*\n/).map(b => b.trim()).filter(b => b && !README_ONLY.some(re => re.test(b)))
        .map(b => b.startsWith(">") ? b.split("\n").map(l => l.replace(/^>\s?/, "").trim()).filter(Boolean).map(l => "> " + l).join(" ") : b.replace(/\s+/g, " "));
    const entries = [], sections = [];
    for (const m of text.matchAll(/^## (.+)$|^- \*\*\[(.+?)\]\(([^)]+)\)\*\* · \*\*([^*]+)\*\* *\n {2}(.*)$|^- ★ \*(.+)\* · \*\*([^*]+)\*\*$/gm)) {
        if (m[1] !== undefined) { if (/^\d{4}$/.test(m[1])) entries.push({ year: m[1] }); else sections.push(m[1].trim()); }
        else if (m[6] !== undefined) entries.push({ milestone: m[6].trim(), month: m[7].trim() });
        else entries.push({ link: m[3], title: m[2], month: m[4].trim(), text: m[5].trim() });
    }
    return { title, intro, entries, sections };
}

const I = fromIndex(read("index.html")), R = fromReadme(read("README.md"));
const problems = [];
const name = e => e ? (e.year ? `the year ${e.year}` : e.milestone ? `the milestone “${e.milestone}”` : `“${e.title}”`) : "nothing";

if (I.title !== R.title) problems.push(`The title differs:\n  index:  ${I.title}\n  README: ${R.title}`);
for (let k = 0; k < Math.max(I.intro.length, R.intro.length); k++)
    if (I.intro[k] !== R.intro[k]) problems.push(`Intro paragraph ${k + 1} differs:\n  index:  ${I.intro[k] ?? "(missing)"}\n  README: ${R.intro[k] ?? "(missing)"}`);

// entries, matched up by link, so an entry missing from one side doesn't shift all the others
// a milestone has no link of its own: it is known by its date and year
const key = e => e.year ? "Y" + e.year : e.milestone ? "M" + e.month + "@" + e.at : e.link;
for (const list of [I.entries, R.entries]) { let y; for (const e of list) { if (e.year) y = e.year; else e.at = y; } }
const inR = new Map(R.entries.map((e, k) => [key(e), k])), inI = new Map(I.entries.map((e, k) => [key(e), k]));
for (const e of I.entries) if (!inR.has(key(e))) problems.push(`${name(e)} (${e.link ?? (e.milestone ? e.month + " " + e.at : "heading")}) is in the index but not in the README`);
for (const e of R.entries) if (!inI.has(key(e))) problems.push(`${name(e)} (${e.link ?? (e.milestone ? e.month + " " + e.at : "heading")}) is in the README but not in the index`);
for (const e of I.entries) {
    const r = R.entries[inR.get(key(e))];
    if (!r || e.year) continue;
    for (const f of e.milestone ? ["milestone"] : ["title", "month", "text"])
        if (e[f] !== r[f]) problems.push(`${name(e)}: the ${f === "text" ? "description" : f} differs:\n  index:  ${e[f]}\n  README: ${r[f]}`);
}
const order = list => list.filter(e => inI.has(key(e)) && inR.has(key(e))).map(key).join("\n");
if (!problems.length && order(I.entries) !== order(R.entries)) problems.push("The entries are the same, but in a different order (or under a different year).");
for (const s of R.sections) if (!README_ONLY_SECTIONS.includes(s)) problems.push(`The README has a section “${s}” that the index doesn't`);

const n = I.entries.filter(e => !e.year && !e.milestone).length, nm = I.entries.filter(e => e.milestone).length;
if (problems.length) {
    console.error(`index.html and README.md are out of sync${staged ? " (in what is staged)" : ""}:\n\n` + problems.join("\n\n"));
    process.exit(1);
}
console.log(`index.html and README.md are in sync: the title, ${I.intro.length} intro paragraphs, and ${n} entries and ${nm} milestones.`);
