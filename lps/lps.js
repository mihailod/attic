// Word Finder for Letter Puzzles — JavaScript port of lps.Solver (Mihailo Despotovic, October 2003)
// Finds dictionary words of 3–12 letters that can be spelled from the puzzle's letters.

const ALPHABET = "abcdefghijklmnopqrstuvwxyz";
const MIN_WORD_LENGTH = 3; // shortest words in words.js
const MAX_WORD_LENGTH = 12; // longest words in words.js

const puzzleInput = document.getElementById("puzzle");
const solveButton = document.getElementById("solve");
const output = document.getElementById("output");

function index(word) {
    const counts = new Array(ALPHABET.length).fill(0);
    for (const c of word) counts[ALPHABET.indexOf(c)]++;
    return counts;
}

// The word fits if it uses no letter more often than the puzzle has it.
function similarIndex(wordIndex, puzzleIndex) {
    for (let i = 0; i < ALPHABET.length; i++) {
        if (wordIndex[i] > puzzleIndex[i]) return false;
    }
    return true;
}

function keepLettersOnly(s) {
    return s.toLowerCase().replace(/[^a-z]/g, "");
}

function solve() {
    const letters = keepLettersOnly(puzzleInput.value);
    puzzleInput.value = letters;

    const puzzleIndex = index(letters);
    const words = WORDS.filter(word => similarIndex(index(word), puzzleIndex));

    const lines = [];
    const log = s => lines.push(s);
    log("Matching pattern: " + letters + "\n");
    log("[" + WORDS.length + " words processed]\n");
    const maxSize = Math.min(letters.length, MAX_WORD_LENGTH);
    if (maxSize < MIN_WORD_LENGTH) {
        log("Sorry, the puzzle needs at least " + MIN_WORD_LENGTH + " letters.\n");
    }
    for (let size = MIN_WORD_LENGTH; size <= maxSize; size++) {
        log("Size " + size + " words:");
        const found = words.filter(word => word.length === size);
        if (found.length === 0) {
            log("Sorry, no match with " + size + " letters found.\n");
        } else {
            log(found.join(" "));
            log("Total of " + found.length + " word(s) of size " + size + " found.\n");
        }
    }
    log("Thank you for using Word Finder for Letter Puzzles");
    log("Please, do not use results of this program for humiliation purposes.");
    log("");
    log("Program by Mihailo Despotovic, October 2003.");

    output.textContent = lines.join("\n");
}

solveButton.addEventListener("click", solve);
puzzleInput.addEventListener("keydown", e => { if (e.key === "Enter") solve(); });
