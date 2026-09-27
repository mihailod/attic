// Tic-Tac-Toe with Minimax and Alpha-Beta — JavaScript port of the ttt.tttApplet (Mihailo Despotovic, January 2003)
// The computer searches the whole game tree with negamax, optionally with alpha-beta pruning.

const VERSION = "1.0";

const EMPTY = 0;
const X = 1;
const O = 2;

// game states
const COMPUTER_WON = 0;
const USER_WON = 1;
const DRAW = 2;
const KEEP_PLAYING = 3;

// the board is 9 fields, row by row: field = row * 3 + column
const LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6],            // diagonals
];

const other = player => player === X ? O : X;

function threeInARow(board, player) {
    return LINES.some(line => line.every(field => board[field] === player));
}

// Exact evaluation from the player's point of view: positive for a win, negative for a loss, 0 for a draw.
// A win is worth more the sooner it happens (more empty fields left), so the computer takes a win
// right away instead of a slower one, and puts off a loss as long as it can.
const WIN = 10; // more than any board can score (at most 1 + 8 empty fields)

function getBoardEval(board, player) {
    const score = 1 + board.filter(field => field === EMPTY).length;
    if (threeInARow(board, player)) return score;
    if (threeInARow(board, other(player))) return -score;
    return 0;
}

// All immediate successors of a position (none if someone has already won)
function getAllSuccessors(board, player) {
    if (threeInARow(board, player) || threeInARow(board, other(player))) return [];
    const successors = [];
    for (let field = 0; field < 9; field++) {
        if (board[field] === EMPTY) {
            const next = board.slice();
            next[field] = player;
            next.played = field;
            successors.push(next);
        }
    }
    return successors;
}

// Negamax with alpha-beta pruning: the value of the position for the player to move
function alphaBeta(board, alpha, beta, player, search) {
    search.positions++;
    const successors = getAllSuccessors(board, player);
    if (successors.length === 0) return getBoardEval(board, player);

    let maxValue = alpha;
    for (const successor of successors) {
        // call recursively with inverted values (MAX becomes MIN and MIN becomes MAX)
        const value = -alphaBeta(successor, -beta, -maxValue, other(player), search);
        if (value > maxValue) maxValue = value;
        // pruning: once maxValue reaches the upper bound, the other successors can't matter
        if (maxValue >= beta && search.useAlphaBeta) {
            search.pruned++;
            break;
        }
    }
    return maxValue;
}

class Engine {
    constructor(computerFirst) {
        this.board = new Array(9).fill(EMPTY);
        this.computerFirst = computerFirst;
        this.moveCounter = 1;
        this.gameState = KEEP_PLAYING;
    }

    computerPiece() { return this.computerFirst ? X : O; }
    userPiece()     { return this.computerFirst ? O : X; }

    // User's move: returns true if the move was valid
    play(field) {
        if (this.board[field] !== EMPTY) return false;
        this.board[field] = this.userPiece();
        this.moveCounter++;
        this.updateGameState();
        return true;
    }

    // Computer's move: returns the search statistics, or null when no search was needed
    playComputer(useAlphaBeta) {
        // the very first move is a special one: take the centre
        if (this.moveCounter === 1 || (this.moveCounter === 2 && this.board[4] === EMPTY)) {
            this.board[4] = this.computerPiece();
            this.moveCounter++;
            this.updateGameState();
            return null;
        }

        const search = { useAlphaBeta, positions: 0, pruned: 0 };
        const successors = getAllSuccessors(this.board, this.computerPiece());
        if (successors.length > 0) {
            // play the move whose value for the user is the smallest
            let best = successors[0];
            let min = alphaBeta(best, -WIN, WIN, this.userPiece(), search);
            for (const successor of successors.slice(1)) {
                const value = alphaBeta(successor, -WIN, WIN, this.userPiece(), search);
                if (value < min) {
                    min = value;
                    best = successor;
                }
            }
            this.board[best.played] = this.computerPiece();
            this.moveCounter++;
        }
        this.updateGameState();
        return search;
    }

    updateGameState() {
        if (this.moveCounter < 5) this.gameState = KEEP_PLAYING;
        else if (threeInARow(this.board, this.computerPiece())) this.gameState = COMPUTER_WON;
        else if (threeInARow(this.board, this.userPiece())) this.gameState = USER_WON;
        else if (this.moveCounter < 10) this.gameState = KEEP_PLAYING;
        else this.gameState = DRAW;
    }
}

// ---- UI ----

const $ = id => document.getElementById(id);
const fields = [...document.querySelectorAll("#board button")];
const alphaBetaCB = $("alphabeta");
const playsFirstCB = $("first");
const logCB = $("logging");
const status = $("log");
const endDialog = $("end");

let engine;

function log(s) {
    if (!logCB.checked) return;
    status.value += s + ".\n";
    status.scrollTop = status.scrollHeight;
}

function updateBoard() {
    const over = engine.gameState !== KEEP_PLAYING;
    fields.forEach((button, field) => {
        const piece = engine.board[field];
        button.textContent = piece === X ? "X" : piece === O ? "O" : "";
        button.className = piece === X ? "x" : piece === O ? "o" : "";
        button.disabled = over || piece !== EMPTY;
    });
}

function computerMove() {
    log("Computer is playing move " + engine.moveCounter);
    const search = engine.playComputer(alphaBetaCB.checked);
    if (search) {
        log("Searched " + search.positions + " position(s)");
        if (search.useAlphaBeta) log("Alpha-Beta pruned " + search.pruned + " game tree branch(es)");
    }
    updateBoard();
}

function restart() {
    engine = new Engine(playsFirstCB.checked);
    updateBoard();
    if (engine.computerFirst) computerMove();
    log("Waiting for user to play move " + engine.moveCounter);
}

// Checks if the game is finished, and if so shows the result
function gameFinished() {
    if (engine.gameState === KEEP_PLAYING) return false;
    const msg = engine.gameState === USER_WON ? "You won the game"
              : engine.gameState === COMPUTER_WON ? "Computer won the game"
              : "No winner";
    log(msg);
    $("end-message").textContent = msg;
    endDialog.showModal();
    return true;
}

fields.forEach((button, field) => button.addEventListener("click", () => {
    if (!engine.play(field)) return;
    updateBoard();
    if (gameFinished()) return;
    computerMove();
    if (gameFinished()) return;
    log("Waiting for user to play move " + engine.moveCounter);
}));

$("restart").addEventListener("click", restart);
endDialog.addEventListener("close", restart); // OK, Escape or closing the dialog all start a new game

playsFirstCB.addEventListener("change", () => {
    log("Computer plays first: " + (playsFirstCB.checked ? "yes" : "no"));
    if (engine.moveCounter === 1) restart();
    else log("This takes effect in the next game");
});

alphaBetaCB.addEventListener("change", () => {
    log("Alpha-Beta is now " + (alphaBetaCB.checked ? "on" : "off"));
});

logCB.addEventListener("change", () => {
    status.hidden = !logCB.checked;
});

$("version").textContent = VERSION;
log("Program started");
restart();
