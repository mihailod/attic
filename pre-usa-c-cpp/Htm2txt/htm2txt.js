// HTM2TXT — JavaScript port of HTM2TXT.CPP (Mihailo Despotovic, February 7, 1997)
// Copies a file byte by byte, leaving out everything from a < to the next >, so what remains of an
// HTML page is its text. Like the original, it doesn't decode entities (&amp; stays &amp;) and
// keeps script and style contents, which are text between tags too.
//
// The 1997 program read each byte into a char and compared it with EOF. Borland C's char is signed,
// so the byte 255 (ÿ in Latin-1, a no-break space in DOS code page 852) read as -1, which is EOF,
// and the conversion stopped there. And DOS text-mode files ended at the first Ctrl-Z (byte 26).
// This version reads to the real end, and can also behave exactly like the 1997 one.

const LT = 60, GT = 62, BYTE_255 = 0xff, CTRL_Z = 0x1a;

function htm2txt(bytes, like1997 = false) {
    const out = [];
    let ind = 0;
    for (let i = 0; i < bytes.length; i++) {
        const c = bytes[i];
        if (like1997 && (c === BYTE_255 || c === CTRL_Z)) return { out: Uint8Array.from(out), stoppedAt: i, stopByte: c };
        if (c === LT) { ind = 1; continue; }
        if (c === GT) { ind = 0; continue; }
        if (ind === 1) continue;
        out.push(c);
    }
    return { out: Uint8Array.from(out), stoppedAt: -1 };
}

if (typeof module !== "undefined") module.exports = { htm2txt };

// ---- UI ----

if (typeof document !== "undefined") {
    const $ = id => document.getElementById(id);
    let input = null, inputName = "STRANA.HTM";   // bytes of an opened file, or null when using the text box

    const inputBytes = () => input || new TextEncoder().encode($("html").value);
    function decode(bytes) {
        const enc = $("encoding").value;
        if (enc !== "auto") return new TextDecoder(enc).decode(bytes);
        try { return new TextDecoder("utf-8", { fatal: true }).decode(bytes); }
        catch { return new TextDecoder("windows-1250").decode(bytes); }
    }
    const dosName = name => {
        const base = name.replace(/\.[^.]*$/, "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 8).toUpperCase() || "STRANA";
        return base;
    };

    function convert() {
        const bytes = inputBytes();
        const like1997 = $("like1997").checked;
        const { out, stoppedAt, stopByte } = htm2txt(bytes, like1997);
        $("text").value = decode(out);
        const base = dosName(inputName);
        $("console").textContent = `C:\\>htm2txt ${base}.HTM ${base}.TXT\n\nDone !\n\nC:\\>`;
        $("stats").textContent = `${bytes.length.toLocaleString("en-US")} bytes in, ${out.length.toLocaleString("en-US")} bytes out.`;
        const note = $("stopped");
        if (stoppedAt >= 0) {
            note.hidden = false;
            note.textContent = stopByte === BYTE_255
                ? `The 1997 program stopped at byte ${stoppedAt.toLocaleString("en-US")}, a byte 255, which it mistook for the end of the file.`
                : `The 1997 program stopped at byte ${stoppedAt.toLocaleString("en-US")}, a Ctrl-Z, which ended text files in DOS.`;
        } else {
            note.hidden = true;
            if (!like1997) {
                const k = bytes.indexOf(BYTE_255), z = bytes.indexOf(CTRL_Z);
                const first = [k, z].filter(x => x >= 0).sort((a, b) => a - b)[0];
                if (first !== undefined) {
                    note.hidden = false;
                    note.textContent = `The 1997 program would have stopped at byte ${first.toLocaleString("en-US")} (a ${bytes[first] === BYTE_255 ? "byte 255" : "Ctrl-Z"}); tick the box above to see where.`;
                }
            }
        }
    }

    $("html").addEventListener("input", () => {
        input = null;
        inputName = "STRANA.HTM";
        $("file-name").textContent = "";
        convert();
    });
    $("file").addEventListener("change", async () => {
        const f = $("file").files[0];
        if (!f) return;
        input = new Uint8Array(await f.arrayBuffer());
        inputName = f.name;
        $("file-name").textContent = `${f.name} (${input.length.toLocaleString("en-US")} bytes)`;
        $("html").value = decode(input);
        convert();
    });
    for (const id of ["like1997", "encoding"]) $(id).addEventListener("change", convert);
    $("example").addEventListener("click", () => {
        $("file").value = "";
        $("html").value = EXAMPLE;
        $("html").dispatchEvent(new Event("input"));
    });
    $("save").addEventListener("click", () => {
        const { out } = htm2txt(inputBytes(), $("like1997").checked);
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([out], { type: "text/plain" }));
        a.download = inputName.replace(/\.[^.]*$/, "") + ".txt";
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });
    // drop a file anywhere on the page
    document.addEventListener("dragover", e => e.preventDefault());
    document.addEventListener("drop", e => {
        e.preventDefault();
        if (e.dataTransfer.files.length) {
            const dt = new DataTransfer();
            dt.items.add(e.dataTransfer.files[0]);
            $("file").files = dt.files;
            $("file").dispatchEvent(new Event("change"));
        }
    });

    const EXAMPLE = `<HTML>
<HEAD>
<TITLE>Moja strana</TITLE>
</HEAD>
<BODY BGCOLOR="#FFFFFF" TEXT="#000000">
<CENTER><H1>Dobrodosli na moju stranu!</H1></CENTER>
<P>Ovde cete naci moje <B>programe</B> za DOS,
<A HREF="knjige.htm">spisak knjiga</A> i <I>linkove</I>.</P>
<HR>
<P>Poslednja izmena: 7. februar 1997.</P>
<P>&copy; 1997 &amp; zauvek</P>
</BODY>
</HTML>
`;
    $("html").value = EXAMPLE;
    convert();
}
