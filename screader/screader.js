// Serbian Cafe Forums Reader — JavaScript port of screader (Mihailo Despotovic, September 2001).
// The original was a Swing app that screen-scraped the forums on www.serbiancafe.com: the list of
// forums, the topics of the basketball forum ("Kosarka") and a single thread, cut out of the site's
// 2001 HTML by searching for known pieces of markup. When offline it read saved copies of the pages.
// The site's 2001 pages are long gone, so this version always runs offline, on sample pages in the
// same 2001 markup (sample-pages.js). The forum list is the real one; the topics, threads and
// usernames are made up.

const MAIN_TITLE = "Serbian Cafe Forums Reader";

const SC_URL = "http://www.serbiancafe.com";
const SC_ROOT = SC_URL + "/diskusije/";
const KOSARKA_POSTFIX = "/diskusije/mesg/55/?1";
const MSG_HEADER = '<a href="/diskusije/mesg';
const MSG_OFFSET = '<a href="'.length;

// ---- Util ----

// replace all occurrences of s1 with s2 in s
function replaceStrings(s, s1, s2) {
    if (s == null || s1 == null || s2 == null || s1 === "") return s;
    return s.split(s1).join(s2);
}

// cleans string for display
function cleanString(s) {
    for (const tag of ["<b>", "<B>", "</b>", "</B>"]) s = replaceStrings(s, tag, "");
    for (const tag of ["<br>", "<BR>", "<Br>", "<bR>"]) s = replaceStrings(s, tag, "\n");
    return s;
}

// returns the first url pointer in the string
function getFirstUrl(s) {
    const start = s.indexOf("<a href=") + "<a href=".length;
    const end = s.indexOf(">");
    let url = s.substring(start, end);
    url = replaceStrings(url, '"', "");
    url = replaceStrings(url, "//", "/");
    return url;
}

// ---- ContentGetter ----
// Like the original's readLine loop, the lines of a page are joined without line breaks,
// which the parsers below rely on.

function getContent(url, pages) {
    const page = pages[url];
    if (page === undefined) return "ERROR: " + url + " is not in the offline sample";
    return page.split(/\r?\n/).join("");
}

// ---- TreeProducer: the forum sections and forums, from the forum list page ----

function produceTree(content) {
    const root = { name: "Serbian Cafe", url: "", children: [] };
    let branch = null;
    content = replaceStrings(content, "<a href=/diskusije", '<a href="/diskusije');

    for (;;) {
        const ahref = content.indexOf(MSG_HEADER);
        const subh = content.indexOf("<b class=subheading>");
        if (ahref < 0) break;

        // main sections that are not hyperlinked
        if (subh > 0 && subh < ahref) {
            const st = subh + "<b class=subheading>".length;
            const end = content.indexOf("</b>");
            branch = { name: cleanString(content.substring(st, end)), url: "", children: [] };
            root.children.push(branch);
            content = content.substring(end + "</b>".length);
            continue;
        }

        const st = content.indexOf(MSG_HEADER);
        const temp = content.substring(st);
        const size = temp.indexOf("</a>");
        let name = temp.substring(0, size);
        const url = SC_URL + getFirstUrl(name);

        if (name.indexOf("<b class=subheading>") >= 0) {
            name = name.substring(name.indexOf("=subheading>") + "=subheading>".length, name.indexOf("</b>"));
            branch = { name: cleanString(name), url, children: [] };
            root.children.push(branch);
        } else {
            name = name.substring(name.indexOf(">") + 1);
            const node = { name: cleanString(name), url, children: [] };
            (branch || root).children.push(node);
        }
        content = content.substring(st + size + 1 + "</X>".length);
    }
    return root;
}

// ---- ContentParser ----

// The topic list of a forum: title, author, number of replies and url of each topic,
// plus a last entry with replies = -1 for the "NEXT 40" link
function parseTopics(all) {
    const topics = [];
    if (all.startsWith("ERROR")) {
        topics.push({ title: all, author: "", replies: 0, url: "" });
        return topics;
    }
    let start, end;
    while (all.indexOf(MSG_HEADER) > 0) {
        const t = { title: "", author: "", replies: 0, url: "" };

        start = all.indexOf(MSG_HEADER) + MSG_OFFSET;
        all = all.substring(start);
        end = all.indexOf(">") - 1;
        t.url = SC_URL + all.substring(0, end);

        start = all.indexOf("/diskusije/mesg/");
        all = all.substring(start);
        start = all.indexOf(">") + 1;
        all = all.substring(start);
        end = all.indexOf("</a>");
        t.title = all.substring(0, end);

        start = all.indexOf("<b>") + "<b>".length;
        end = all.indexOf("</b>");
        t.author = all.substring(start, end);

        // "(12)" after the author, but only if it comes before this topic's <br>
        start = all.indexOf("<font size=-1>") + "<font size=-1>".length + 1;
        end = all.indexOf("</font>") - 1;
        const newLine = all.indexOf("<br");
        t.replies = newLine > 0 && newLine > start && newLine > end ? parseInt(all.substring(start, end), 10) : 0;

        topics.push(t);
    }

    // next?
    if (all.indexOf("NEXT") > 0) {
        start = all.indexOf("<a href");
        end = all.indexOf('">');
        topics.push({ title: "", author: "", replies: -1, url: all.substring(start + MSG_OFFSET, end) });
    }
    return topics;
}

// A whole thread as text: every post's header and text, separated by a line
function parseSingleTopic(all) {
    if (all.indexOf("<blockquote>") < 0) return "Sorry.  Cannot parse the topic...";

    let result = "";
    let first = true;
    while (all.indexOf("<blockquote>") >= 0) {
        let start = all.indexOf("<blockquote>") + "<blockquote>".length;
        start += first ? "<b><font color=green>".length : "<br><b>".length;
        all = all.substring(start);
        let end = all.indexOf("</blockquote>");
        let temp = all.substring(0, end);

        // get rid of email
        if (temp.startsWith("<a href")) {
            start = temp.indexOf(">") + 1;
            end = temp.indexOf("</a>");
            temp = temp.substring(start, end) + temp.substring(end + "</a>".length);
        }

        start = temp.indexOf("<p>");
        temp = temp.substring(0, start) + "\n" + temp.substring(start + "<p>".length);

        if (first) temp = replaceStrings(temp, "</font></b>", "");
        temp = cleanString(temp);

        result += temp + "\n__________________________________________\n\n";
        first = false;
    }
    return result;
}

// ---- UI ----

const $ = id => document.getElementById(id);
const fetchPage = url => getContent(url, SAMPLE_PAGES);
const offline = url => SAMPLE_PAGES[url] === undefined;
let topics = [];
let selectedForum = null;

// Left: the forum tree. Sections open and close; clicking a forum loads its topics
// (the original only printed the forum's address here; it never got that far).
function showTree() {
    const tree = produceTree(fetchPage(SC_ROOT));
    const pane = $("tree");
    pane.replaceChildren();
    const rootLabel = document.createElement("div");
    rootLabel.className = "root";
    rootLabel.textContent = tree.name;
    pane.append(rootLabel);

    const forumButton = node => {
        const b = document.createElement("button");
        b.className = "forum";
        b.textContent = node.name;
        b.dataset.url = node.url;
        b.addEventListener("click", () => showTopics(node));
        return b;
    };
    for (const entry of tree.children) {
        if (entry.children.length === 0) {
            pane.append(forumButton(entry));
            continue;
        }
        const details = document.createElement("details");
        details.open = entry.children.some(c => !offline(c.url));
        const summary = document.createElement("summary");
        summary.textContent = entry.name;
        details.append(summary);
        for (const forum of entry.children) details.append(forumButton(forum));
        pane.append(details);
    }
}

// Right: the topics of a forum, numbered like the original's buttons
function showTopics(forum) {
    selectedForum = forum.url;
    for (const b of document.querySelectorAll("#tree .forum")) b.classList.toggle("selected", b.dataset.url === forum.url);
    $("topics-title").textContent = forum.name;
    const list = $("topics");
    list.replaceChildren();

    if (offline(forum.url)) {
        list.textContent = `The offline example only includes the Kosarka forum (in Sport).`;
        topics = [];
        return;
    }
    topics = parseTopics(fetchPage(forum.url));
    topics.forEach((t, i) => {
        const row = document.createElement("div");
        row.className = "topic";
        const b = document.createElement("button");
        if (t.replies === -1) {
            b.textContent = "Next 40";
            b.addEventListener("click", () => {
                $("thread").textContent = "The offline example only includes the first 40 topics.";
            });
            row.append(b);
        } else {
            b.textContent = i + 1;
            b.addEventListener("click", () => showThread(i));
            const replies = t.replies <= 0 ? "" : ` (${t.replies} ${t.replies === 1 ? "reply" : "replies"})`;
            const label = document.createElement("span");
            label.textContent = `${t.title} -- ${t.author}${replies}`;
            row.append(b, label);
        }
        list.append(row);
    });
}

// Bottom: a whole thread as text
function showThread(i) {
    for (const [k, row] of [...document.querySelectorAll("#topics .topic")].entries()) row.classList.toggle("selected", k === i);
    const t = topics[i];
    $("thread").textContent = offline(t.url)
        ? `“${t.title}”\n\nThe offline example only includes the threads of topics 1 to 4.`
        : parseSingleTopic(fetchPage(t.url));
    $("thread").scrollTop = 0;
}

showTree();
showTopics({ name: "Kosarka", url: SC_URL + KOSARKA_POSTFIX }); // like the original, start in the basketball forum
