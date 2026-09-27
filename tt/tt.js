// TeekoTeacher — JavaScript port of the tt.TTStarter applet (Mihailo Despotovic, 2003)
//
// Developed for the CAPS4 Conference paper "TeekoTeacher: A Tool for Learning Good Teeko Strategies",
// The Fourth International Conference on Human-System Learning, Glasgow, Scotland, UK, 2003.
//
// You play both sides. During the opening (the first 8 moves, when pieces are placed) a heuristic
// suggests a field; after that the suggestion comes from a database of positions from played games
// (ttdb.js, generated from ttdb.txt by make-db.mjs), picking the move whose resulting position
// won the most games for the side to move.

const VERSION = "1.0 (June 8th 2003)";
const FLASH_DELAY = 400;

const SIZE = 5;
const EMPTY = 0;
const X = 1; // plays first
const O = 2;

// game states
const KEEP_PLAYING = 0;
const WON = 1; // the side that just moved won
const DRAW = 2;

const other = piece => piece === X ? O : X;
const pieceName = piece => piece === X ? "X" : piece === O ? "O" : "";

// The board is 25 fields, row by row: field = row * 5 + column.
// Fields are named like the original: column letter A-E, then row number 1-5.
const field = (row, col) => row * SIZE + col;
const fieldName = f => String.fromCharCode(65 + f % SIZE) + (Math.floor(f / SIZE) + 1);

// ---- Four in a row, column, diagonal or square ----

const WIN_LINES = [];
for (let r = 0; r < SIZE; r++)
    for (let offset = 0; offset < 2; offset++) {
        WIN_LINES.push([0, 1, 2, 3].map(k => field(r, offset + k))); // rows
        WIN_LINES.push([0, 1, 2, 3].map(k => field(offset + k, r))); // columns
    }
for (const [r, c, dr, dc] of [
    [0, 0, 1, 1], [1, 1, 1, 1], [0, 4, 1, -1], [1, 3, 1, -1], // on the main diagonals
    [0, 1, 1, 1], [1, 0, 1, 1], [0, 3, 1, -1], [1, 4, 1, -1], // the "small" diagonals
]) WIN_LINES.push([0, 1, 2, 3].map(k => field(r + k * dr, c + k * dc)));
for (let r = 0; r < SIZE - 1; r++)
    for (let c = 0; c < SIZE - 1; c++)
        WIN_LINES.push([field(r, c), field(r + 1, c), field(r, c + 1), field(r + 1, c + 1)]); // squares

function hasFour(board, piece) {
    return WIN_LINES.some(line => line.every(f => board[f] === piece));
}

// ---- Moves ----

function canMoveHere(from, to) {
    const dr = Math.abs(Math.floor(from / SIZE) - Math.floor(to / SIZE));
    const dc = Math.abs(from % SIZE - to % SIZE);
    return (dr || dc) && dr <= 1 && dc <= 1;
}

// All positions reachable by moving one of the piece's men to an empty adjacent field,
// in the same order as the original (it breaks ties between equally good advices)
function getAllSuccessors(board, piece) {
    const successors = [];
    for (let from = 0; from < SIZE * SIZE; from++) {
        if (board[from] !== piece) continue;
        const r = Math.floor(from / SIZE), c = from % SIZE;
        for (const [dr, dc] of [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]]) {
            const nr = r + dr, nc = c + dc;
            if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE) continue;
            const to = field(nr, nc);
            if (board[to] !== EMPTY) continue;
            const next = board.slice();
            next[from] = EMPTY;
            next[to] = piece;
            successors.push({ board: next, from, to });
        }
    }
    return successors;
}

// ---- The database ----

// Each record: 25 fields ('0' empty, '1' X, '2' O), then games won by the first player (X)
// and by the second (O), 4 characters each. The same position appears many times; merge them.
function parseDatabase(text) {
    const positions = new Map(); // board key -> { index, wonFirst, wonSecond }
    let total = 0;
    for (let i = 0; i + 33 <= text.length; i += 33) {
        const key = text.slice(i, i + 25);
        const wonFirst = Number(text.slice(i + 25, i + 29).trim() || 0);
        const wonSecond = Number(text.slice(i + 29, i + 33).trim() || 0);
        total++;
        const known = positions.get(key);
        if (known) {
            known.wonFirst += wonFirst;
            known.wonSecond += wonSecond;
        } else {
            positions.set(key, { index: positions.size, wonFirst, wonSecond });
        }
    }
    return { positions, total };
}

const boardKey = board => board.join("");
const swapColours = board => board.map(p => p === X ? O : p === O ? X : EMPTY);

// Advice after the opening: of all moves for the side to move, pick the one whose resulting
// position (or the same position with the colours swapped) won the most games in the database.
function adviseFromDatabase(db, board, piece) {
    const successors = getAllSuccessors(board, piece);
    const present = [];
    successors.forEach((s, order) => {
        const plain = db.positions.get(boardKey(s.board));
        if (plain) present.push({ ...s, order, index: plain.index, wonFirst: plain.wonFirst, wonSecond: plain.wonSecond, symmetric: false });
        const sym = db.positions.get(boardKey(swapColours(s.board)));
        if (sym) present.push({ ...s, order, index: sym.index, wonFirst: sym.wonSecond, wonSecond: sym.wonFirst, symmetric: true });
    });
    present.sort((a, b) => a.index - b.index || a.order - b.order); // database order, like the original

    let best = null, maxScore = -Infinity;
    for (const p of present) {
        const score = piece === X ? p.wonFirst - p.wonSecond : p.wonSecond - p.wonFirst;
        if (score > maxScore) {
            maxScore = score;
            best = p;
        }
    }
    return {
        moves: successors.length,
        plainCount: present.filter(p => !p.symmetric).length,
        symmetricCount: present.filter(p => p.symmetric).length,
        best: best && {
            from: best.from,
            to: best.to,
            gamesPlayed: best.wonFirst + best.wonSecond,
            gamesWon: piece === X ? best.wonFirst : best.wonSecond,
        },
    };
}

// ---- Opening heuristic (placing the first 4 pieces each) ----
// Tried in order: make four, block four, make three, block a dangerous three,
// then take the centre, a corner or a cross field.

function adviseOpening(board, piece, moveCounter, random = Math.random) {
    const own = piece, opp = other(piece);
    const b = (r, c) => board[field(r, c)];
    const empty = (r, c) => b(r, c) === EMPTY;
    let move = null;
    const tryToPlay = (r, c) => {
        if (!empty(r, c)) return false;
        move = field(r, c);
        return true;
    };

    const playInTheMiddle = () => tryToPlay(2, 2);
    const CORNERS = [[1, 1], [1, 3], [3, 1], [3, 3]];
    const CROSS = [[1, 2], [2, 3], [3, 2], [2, 1]];
    const playRandomly = (fields, otherwise) => {
        const free = fields.filter(([r, c]) => empty(r, c));
        if (free.length === 0) return otherwise();
        const [r, c] = free[Math.floor(random() * free.length)];
        return tryToPlay(r, c);
    };
    const playInACorner = () => playRandomly(CORNERS, () => playRandomly(CROSS, () => false));
    const playInACross = () => playRandomly(CROSS, () => playRandomly(CORNERS, () => false));

    // a line of 4 with 3 of p's pieces in it and the 4th field empty: play the 4th
    const completeFour = p => {
        for (const line of WIN_LINES) {
            const mine = line.filter(f => board[f] === p).length;
            const gap = line.find(f => board[f] === EMPTY);
            if (mine === 3 && gap !== undefined) {
                move = gap;
                return true;
            }
        }
        return false;
    };

    // two of p's pieces among three fields in a row, with the third one empty: play the third.
    // Making three looks at the inner 3x3; blocking also watches the middle of the edge rows and columns.
    const INNER_THREES = [], DANGEROUS_THREES = [];
    for (let k = 0; k < SIZE; k++) {
        const row = [[k, 1], [k, 2], [k, 3]], col = [[1, k], [2, k], [3, k]];
        DANGEROUS_THREES.push(row, col);
        if (k >= 1 && k <= 3) INNER_THREES.push(row, col);
    }
    for (const diagonal of [[[1, 1], [2, 2], [3, 3]], [[1, 3], [2, 2], [3, 1]]]) {
        INNER_THREES.push(diagonal);
        DANGEROUS_THREES.push(diagonal);
    }
    const completeThree = (p, lines) => {
        for (const line of lines) {
            const mine = line.filter(([r, c]) => b(r, c) === p).length;
            const gap = line.find(([r, c]) => empty(r, c));
            if (mine === 2 && gap) return tryToPlay(...gap);
        }
        return false;
    };

    const makeDangerous2 = () => {
        if (b(2, 2) === own) return playInACorner();
        if (((b(1, 1) === own || b(3, 3) === own) && (empty(1, 3) || empty(3, 1))) ||
            ((b(1, 3) === own || b(3, 1) === own) && (empty(1, 1) || empty(3, 3)))) return playInACross();
        return playInACorner();
    };

    const move3 = () => empty(2, 2) ? playInTheMiddle() : makeDangerous2();
    const move4 = () => completeThree(opp, DANGEROUS_THREES) || move3(); // avoid a dangerous three
    const move5 = () => completeThree(own, INNER_THREES) || move4();     // make three
    const move6 = () => completeFour(opp) || move5();       // avoid four
    const move7 = () => completeFour(own) || move6();       // make four

    switch (moveCounter) {
        case 1: empty(2, 2) ? playInTheMiddle() : playInACorner(); break;
        case 2: move3(); break;
        case 3: move4(); break;
        case 4: move5(); break;
        case 5: move6(); break;
        default: move7(); break;
    }
    return move;
}

// ---- The game ----

class Game {
    constructor(db) {
        this.db = db;
        this.board = new Array(SIZE * SIZE).fill(EMPTY);
        this.moveCounter = 1;
        this.state = KEEP_PLAYING;
        this.history = []; // the last 13 positions: if 1 == 5 == 9 == 13 (and so on), it's a draw
        this.pushPosition();
    }

    toMove() { return this.moveCounter % 2 === 1 ? X : O; }
    isOpening() { return this.moveCounter < 9; }

    // Opening: place a piece on an empty field. Returns the move's description, or null if illegal.
    place(to) {
        if (!this.isOpening() || this.board[to] !== EMPTY) return null;
        const piece = this.toMove();
        this.board[to] = piece;
        return this.finishMove(`'${pieceName(piece)}' played on ${fieldName(to)}`);
    }

    // After the opening: move one of your pieces to an empty adjacent field.
    move(from, to) {
        const piece = this.toMove();
        if (this.isOpening() || this.board[from] !== piece || this.board[to] !== EMPTY || !canMoveHere(from, to)) return null;
        this.board[from] = EMPTY;
        this.board[to] = piece;
        return this.finishMove(`'${pieceName(piece)}' played ${fieldName(from)}-${fieldName(to)}`);
    }

    finishMove(description) {
        const mover = this.toMove();
        this.moveCounter++;
        this.pushPosition();
        if (hasFour(this.board, mover)) this.state = WON;
        else if (this.isDraw()) this.state = DRAW;
        return description;
    }

    pushPosition() {
        this.history.push(boardKey(this.board));
        if (this.history.length > 13) this.history.shift();
    }

    // The same pair of moves repeated three times in a row
    isDraw() {
        const h = this.history;
        if (h.length < 13) return false;
        for (let i = 0; i < 5; i++) {
            if (h[i] !== h[i + 4] || h[i + 4] !== h[i + 8]) return false;
        }
        return true;
    }

    // The advice for the side to move: { from, to } (from is null in the opening) plus log lines
    advise() {
        const piece = this.toMove();
        const log = [];
        if (this.isOpening()) {
            const to = adviseOpening(this.board, piece, this.moveCounter);
            if (to === null) return { log: ["Sorry, no advice for this position"] };
            log.push(`Heuristic is suggesting this opening move: ${fieldName(to)}`);
            return { from: null, to, log };
        }
        const a = adviseFromDatabase(this.db, this.board, piece);
        log.push(`${a.moves} possible moves for '${pieceName(piece)}' found from this position`);
        log.push(`${a.plainCount} plain and ${a.symmetricCount} symmetric move(s) found in the database`);
        if (!a.best) {
            log.push("Sorry, no advice for this position");
            return { log };
        }
        const { from, to, gamesWon, gamesPlayed } = a.best;
        const percentage = gamesPlayed ? (100 * gamesWon / gamesPlayed).toFixed(1) : "0.0";
        log.push(`Recommended move: ${fieldName(from)}-${fieldName(to)}`);
        log.push(`The advice was part of a winning strategy in ${gamesWon} of ${gamesPlayed} games (${percentage}%)`);
        return { from, to, log };
    }
}

// ---- UI ----

const $ = id => document.getElementById(id);
const db = parseDatabase(TTDB);
const status = $("log");
const fields = [];
let game, selected = null, advice = null, flashTimer = null, firstGame = true;

function log(s) {
    status.value += s + ".\n";
    status.scrollTop = status.scrollHeight;
}

// Build the board: column letters on top, row numbers on the left
const boardEl = $("board");
boardEl.append(document.createElement("span"));
for (let c = 0; c < SIZE; c++) {
    const label = document.createElement("span");
    label.className = "label";
    label.textContent = String.fromCharCode(65 + c);
    boardEl.append(label);
}
for (let r = 0; r < SIZE; r++) {
    const label = document.createElement("span");
    label.className = "label";
    label.textContent = r + 1;
    boardEl.append(label);
    for (let c = 0; c < SIZE; c++) {
        const button = document.createElement("button");
        const f = field(r, c);
        button.setAttribute("aria-label", fieldName(f));
        button.addEventListener("click", () => clicked(f));
        boardEl.append(button);
        fields.push(button);
    }
}

function render() {
    fields.forEach((button, f) => {
        const piece = game.board[f];
        button.textContent = pieceName(piece);
        button.classList.toggle("x", piece === X);
        button.classList.toggle("o", piece === O);
        button.classList.toggle("selected", f === selected);
        button.disabled = game.state !== KEEP_PLAYING;
    });
    $("to-move").textContent = game.state === KEEP_PLAYING
        ? `'${pieceName(game.toMove())}' to ${game.isOpening() ? "place a piece" : "move"}`
        : "";
}

function advisingSideToMove() {
    const who = document.querySelector("input[name=advise]:checked").value; // "x", "o" or "both"
    return who === "both" || who === pieceName(game.toMove()).toLowerCase();
}

// Flash the advised field(s): 'from' and 'to' take turns, like the original
function flash() {
    clearInterval(flashTimer);
    for (const button of fields) button.classList.remove("advice");
    if (!advice || advice.to === undefined || game.state !== KEEP_PLAYING) return;
    let phase = false;
    const tick = () => {
        phase = !phase;
        const on = advisingSideToMove();
        if (advice.from !== null) fields[advice.from].classList.toggle("advice", on && phase);
        fields[advice.to].classList.toggle("advice", on && (advice.from === null || !phase));
    };
    tick();
    flashTimer = setInterval(tick, FLASH_DELAY);
}

function afterMove() {
    selected = null;
    if (game.state !== KEEP_PLAYING) {
        advice = null;
        flash();
        render();
        const msg = game.state === WON
            ? `Player '${pieceName(other(game.toMove()))}' won the game`
            : "The game has been drawn";
        log(msg);
        $("end-message").textContent = msg + ".";
        $("end").showModal();
        return;
    }
    advice = game.advise();
    advice.log.forEach(log);
    log(`'${pieceName(game.toMove())}' is on the move..`);
    render();
    flash();
}

function clicked(f) {
    if (game.state !== KEEP_PLAYING) return;
    let played = null;
    if (game.isOpening()) {
        played = game.place(f);
    } else if (game.board[f] === game.toMove()) {
        selected = selected === f ? null : f; // pick up (or put down) a piece
        render();
        return;
    } else if (selected !== null) {
        played = game.move(selected, f);
        if (!played) {
            selected = null;
            render();
        }
    }
    if (played) {
        log(played);
        afterMove();
    }
}

function restart() {
    if (!firstGame && game.state === KEEP_PLAYING && game.moveCounter > 1) log("Game has been restarted");
    firstGame = false;
    game = new Game(db);
    afterMove();
}

$("restart").addEventListener("click", restart);
$("clear-log").addEventListener("click", () => { status.value = ""; });
$("show-log").addEventListener("change", e => { status.hidden = !e.target.checked; });
for (const radio of document.querySelectorAll("input[name=advise]")) radio.addEventListener("change", flash);
$("end").addEventListener("close", restart);

$("about-version").textContent = VERSION;
$("db-info").textContent = `The database contains ${db.total} (${db.positions.size} unique) Teeko positions.`;
for (const [button, dialog] of [["show-db", "db"], ["show-instructions", "instructions"], ["show-about", "about"]]) {
    $(button).addEventListener("click", () => $(dialog).showModal());
}

log("Welcome to TeekoTeacher");
restart();
