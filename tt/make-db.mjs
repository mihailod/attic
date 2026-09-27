// Builds ttdb.js from ttdb.txt, so tt.html can load the database with a plain <script> tag
// (which also works when the page is opened straight from disk).
//
// Usage: node make-db.mjs

import { readFileSync, writeFileSync } from "node:fs";

const text = readFileSync("ttdb.txt", "latin1");
if (text.length % 33 !== 0 || !/^([012]{25}[ 0-9]{8})*$/.test(text)) {
    console.log("ttdb.txt doesn't look like a TeekoTeacher database (33-character records)");
    process.exit(1);
}
writeFileSync("ttdb.js",
    "// Generated from ttdb.txt by make-db.mjs — do not edit\n" +
    "const TTDB = \"" + text + "\";\n");
console.log(`Wrote ttdb.js: ${text.length / 33} positions`);
