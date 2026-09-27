// ChuChu Cheese — JavaScript port of my ChuChu Cheese V1.0 (Mihailo Despotovic, October 2003),
// a Java version of the Puzzle mode of Sega's ChuChu Rocket! for the Dreamcast (game idea © Sega).
// Place the few arrows you are given on the board, then press play. Mice and cats run along the
// board, turning when they hit a wall and following the arrows. Every mouse must reach the cheese;
// a mouse falling into a hole, a cat reaching the cheese or a cat catching a mouse loses the level.
// The level editor makes new levels and saves them in the 2003 text format.
//
// The artwork is mine from 2003: the mice, cats, walls, arrows and buttons are drawn in code,
// the cheese, skull and board are my GIFs, and the six sound effects are my WAVs.
//
// Changes from the original:
//  - It played one hard-coded test level, loaded from a Windows path, with the level number always
//    1; it now plays through all four 2003 level files and any level made in the editor.
//  - Bug fixes in the engine: sprites turned right at a wall without checking that the new way was
//    open, so they could walk through the corner of two walls (the rule is now: turn right; if that
//    is blocked, turn left; if that is blocked too, turn back); arrows took effect as soon as a
//    sprite's edge touched their cell, turning it before it was centred; a mouse or cat counted as
//    in the cheese or a hole at different moments depending on its direction (the original's "todo
//    bugfix"); and a level was declared won in the same step a cat caught a mouse. A cat and a mouse
//    passing each other head-on between two cells now also count as caught.
//  - The "LEVEL 009" style number: 9 and 99 were shown as "09" and "99".
//  - Level 1 couldn't be solved (as far as a long computer search could tell), so the cat in its
//    bottom-left corner is removed; the others are as in 2003. "Show a solution" knows solutions for
//    levels 1 to 3 and searches for one for levels made in the editor.
//  - "Yeah!" and "Ouch!" appear on the board instead of in dialog boxes, and the spot where a level
//    was lost is circled, as a commented-out part of the original meant to do.

// ---- constants, from Constants.java ----

const FILE_MARKER = "ChuChu Cheese Level File";
const W = 12, H = 9;
const NOTHING = 0, MOUSE = 1, CAT = 2, HOLE = 3, CHEESE = 4, WALL = 5, ARROW = 6;
const NONE = 0, LEFT = 1, RIGHT = 2, UP = 3, DOWN = 4;
const CELL = 60;
const CELL2 = CELL / 2;
const INSET = CELL / 30 | 0;               // 2
const WALL_W = CELL / 8 | 0;               // 7
const WALL_W2 = WALL_W / 2 | 0;            // 3
const ARROW_INSET = CELL / 8 | 0;          // 7
const ARROWS_MAX = 4;
const MOUSE_FATNESS = CELL / 2 | 0;        // 30
const MOUSE_EAR = CELL / 3 | 0;            // 20
const MOUSE_EYE = CELL / 12 | 0;           // 5
const CAT_FATNESS = (CELL / 3 | 0) * 2;    // 40
const SPEED_MOUSE = CELL / 10 | 0;         // 6 pixels per step
const SPEED_CAT = SPEED_MOUSE * 4 / 5 | 0; // 4
const SPEED_MULTIPLIER = 4;                // fast forward
const STEPS_PER_SECOND = 64;               // the original slept 10 ms per step, about 15 ms on 2003's Windows

const DX = { [LEFT]: -1, [RIGHT]: 1, [UP]: 0, [DOWN]: 0 };
const DY = { [LEFT]: 0, [RIGHT]: 0, [UP]: -1, [DOWN]: 1 };
// a right turn, as seen by the sprite; the original always turned this way at a wall
const TURN_RIGHT = { [DOWN]: LEFT, [UP]: RIGHT, [LEFT]: UP, [RIGHT]: DOWN };
const TURN_LEFT = { [DOWN]: RIGHT, [UP]: LEFT, [LEFT]: DOWN, [RIGHT]: UP };
const BACK = { [DOWN]: UP, [UP]: DOWN, [LEFT]: RIGHT, [RIGHT]: LEFT };

// ---- levels: the Board and BoardElement formats ----

function emptyLevel(name = "New Level") {
    const cells = [];
    for (let j = 0; j < H; j++) {
        const row = [];
        for (let i = 0; i < W; i++) row.push({ content: NOTHING, orientation: NONE, wallDown: j === H - 1, wallRight: i === W - 1 });
        cells.push(row);
    }
    return { name, cells, arrows: [] };
}

function parseLevel(text) {
    const lines = text.split(/\r?\n/);
    if (lines[0] !== FILE_MARKER) throw new Error("Not a level file");
    const tokens = (lines[2] || "").split("-").filter(t => t !== "");
    if (tokens.length < W * H) throw new Error("The level file is incomplete");
    const level = emptyLevel(lines[1] || "");
    for (let j = 0; j < H; j++) {
        for (let i = 0; i < W; i++) {
            const [content, orientation, walls = "00"] = tokens[j * W + i].split("|");
            level.cells[j][i] = { content: Number(content), orientation: Number(orientation), wallDown: walls[0] === "1", wallRight: walls[1] === "1" };
        }
    }
    level.arrows = (lines[3] || "").split("|").filter(t => t !== "").map(Number).slice(0, ARROWS_MAX);
    return level;
}

function levelToText(level) {
    let board = "";
    for (const row of level.cells) {
        for (const c of row) board += `${c.content}|${c.orientation}|${c.wallDown ? 1 : 0}${c.wallRight ? 1 : 0}-`;
    }
    return [FILE_MARKER, level.name, board, level.arrows.map(a => a + "|").join("")].join("\n") + "\n";
}

const cloneLevel = level => JSON.parse(JSON.stringify(level));

// ---- the game engine, from GameEngine and Sprite ----
// Sprites are at pixel positions: (x, y) is the top-left corner of the cell-sized square they fill,
// so a sprite is exactly on cell (i, j) when x = i·CELL and y = j·CELL. It decides where to go only
// there: follow an arrow in the cell, then turn if a wall is in the way.

class Game {
    // placed: a Map from "i,j" to the direction of the arrow the player put there
    constructor(level, placed) {
        this.level = level;
        this.placed = placed;
        this.sprites = [];
        for (let j = 0; j < H; j++) {
            for (let i = 0; i < W; i++) {
                const c = level.cells[j][i];
                if (c.content === MOUSE || c.content === CAT) {
                    this.sprites.push({ kind: c.content, x: i * CELL, y: j * CELL, dir: c.orientation || RIGHT, alive: true, moved: false });
                }
            }
        }
        this.multiplier = 1;
        this.over = null;   // null while running, then { won, reason, x, y }
        this.steps = 0;
    }

    blocked(i, j, dir) {
        const cells = this.level.cells;
        switch (dir) {
            case LEFT: return i === 0 || cells[j][i - 1].wallRight;
            case RIGHT: return i === W - 1 || cells[j][i].wallRight;
            case UP: return j === 0 || cells[j - 1][i].wallDown;
            case DOWN: return j === H - 1 || cells[j][i].wallDown;
        }
        return true;
    }

    // on arriving at a cell: obey the arrow, then turn right, left or back if a wall is in the way
    decide(s, i, j) {
        const arrow = this.placed.get(i + "," + j);
        if (arrow) s.dir = arrow;
        if (this.blocked(i, j, s.dir)) {
            if (!this.blocked(i, j, TURN_RIGHT[s.dir])) s.dir = TURN_RIGHT[s.dir];
            else if (!this.blocked(i, j, TURN_LEFT[s.dir])) s.dir = TURN_LEFT[s.dir];
            else if (!this.blocked(i, j, BACK[s.dir])) s.dir = BACK[s.dir];
            else s.stuck = true; // walled in on all four sides
        }
    }

    // move a sprite `dist` pixels, stopping to decide at every cell it arrives at; returns what it
    // arrived in ("cheese", "hole") or null
    advance(s, dist) {
        while (dist > 0 && !s.stuck) {
            const aligned = s.x % CELL === 0 && s.y % CELL === 0;
            if (aligned) {
                const i = s.x / CELL, j = s.y / CELL;
                if (s.moved) {
                    const content = this.level.cells[j][i].content;
                    if (content === CHEESE) return "cheese";
                    if (content === HOLE) return "hole";
                }
                this.decide(s, i, j);
                if (s.stuck) break;
            }
            const offset = DX[s.dir] !== 0 ? ((s.x % CELL) + CELL) % CELL : ((s.y % CELL) + CELL) % CELL;
            const toNext = offset === 0 ? CELL : DX[s.dir] + DY[s.dir] > 0 ? CELL - offset : offset;
            const step = Math.min(dist, toNext);
            s.x += DX[s.dir] * step;
            s.y += DY[s.dir] * step;
            s.moved = true;
            dist -= step;
        }
        // arriving exactly at the end of this step
        if (s.moved && s.x % CELL === 0 && s.y % CELL === 0) {
            const content = this.level.cells[s.y / CELL][s.x / CELL].content;
            if (content === CHEESE) return "cheese";
            if (content === HOLE) return "hole";
        }
        return null;
    }

    // one step of the game; returns the sounds to play
    step() {
        if (this.over) return [];
        this.steps++;
        const sounds = [];
        const lose = (reason, s, sound) => {
            sounds.push(sound);
            if (!this.over) this.over = { won: false, reason, x: s.x, y: s.y };
        };
        for (const s of this.sprites) {
            if (!s.alive) continue;
            const speed = (s.kind === MOUSE ? SPEED_MOUSE : SPEED_CAT) * this.multiplier;
            const where = this.advance(s, speed);
            if (s.kind === MOUSE) {
                if (where === "cheese") { s.alive = false; sounds.push("mouseincheese"); }
                else if (where === "hole") lose("A mouse fell into a hole.", s, "mouseinhole");
            } else {
                if (where === "cheese") lose("A cat got into the cheese.", s, "catincheese");
                else if (where === "hole") { s.alive = false; sounds.push("catinhole"); }
            }
        }
        // is any mouse caught by a cat?
        if (!this.over) {
            const mice = this.sprites.filter(s => s.alive && s.kind === MOUSE);
            const cats = this.sprites.filter(s => s.alive && s.kind === CAT);
            for (const m of mice) {
                for (const c of cats) {
                    if (Math.abs(m.x - c.x) < CELL2 && Math.abs(m.y - c.y) < CELL2) {
                        lose("A cat caught a mouse.", { x: (m.x + c.x) / 2, y: (m.y + c.y) / 2 }, "catinmouse");
                        break;
                    }
                }
                if (this.over) break;
            }
        }
        if (!this.over && !this.sprites.some(s => s.alive && s.kind === MOUSE)) {
            this.over = { won: true };
            sounds.push("levelup");
        }
        return sounds;
    }
}

// Runs a level with arrows placed until it is won or lost, or maxSteps pass
function simulate(level, placed, maxSteps = 4000) {
    const g = new Game(level, placed);
    while (!g.over && g.steps < maxSteps) g.step();
    return g;
}

// Looks for a way to place the level's arrows that wins it. Arrows only matter on cells a sprite
// passes, so each search step tries the cells visited in the current run; up to `budget` runs.
function solve(level, budget = 20000) {
    let runs = 0;
    const kinds = level.arrows;
    const allowed = (i, j) => ![HOLE, CHEESE].includes(level.cells[j][i].content);
    function visited(placed) {
        const g = new Game(level, placed);
        const cells = new Set();
        while (!g.over && g.steps < 4000) {
            g.step();
            for (const s of g.sprites) if (s.alive) cells.add(Math.round(s.x / CELL) + "," + Math.round(s.y / CELL));
        }
        runs++;
        return { g, cells };
    }
    function search(placed, remaining) {
        if (runs > budget) return null;
        const { g, cells } = visited(placed);
        if (g.over && g.over.won) return new Map(placed);
        if (remaining.length === 0) return null;
        const tried = new Set();
        for (let r = 0; r < remaining.length; r++) {
            const dir = remaining[r];
            if (tried.has(dir)) continue;
            tried.add(dir);
            const rest = remaining.slice(0, r).concat(remaining.slice(r + 1));
            for (const key of cells) {
                if (placed.has(key)) continue;
                const [i, j] = key.split(",").map(Number);
                if (!allowed(i, j)) continue;
                placed.set(key, dir);
                const found = search(placed, rest);
                placed.delete(key);
                if (found) return found;
                if (runs > budget) return null;
            }
        }
        return null;
    }
    const solution = search(new Map(), kinds);
    return { solution, runs, exhausted: runs <= budget };
}

const formatLevelNumber = n => String(n).padStart(3, "0");

if (typeof module !== "undefined") {
    module.exports = { parseLevel, levelToText, emptyLevel, Game, simulate, solve, formatLevelNumber,
        consts: { W, H, CELL, NOTHING, MOUSE, CAT, HOLE, CHEESE, WALL, ARROW, NONE, LEFT, RIGHT, UP, DOWN } };
}

// ---- drawing, from BoardElement, BoardPanel, ArrowsPanel and CoolButton ----

if (typeof document !== "undefined") {
    const $ = id => document.getElementById(id);
    const images = {};
    for (const name of ["cheese", "skull", "board"]) {
        images[name] = new Image();
        images[name].src = MEDIA[name];
    }
    let muted = false;
    const play = name => {
        if (muted || !MEDIA[name]) return;
        const a = new Audio(MEDIA[name]);
        a.play().catch(() => {});
    };

    // Java's fillArc/drawArc angles go counterclockwise from 3 o'clock
    function fillCircle(g, x, y, r) {
        g.beginPath();
        g.arc(x, y, r, 0, 2 * Math.PI);
        g.fill();
    }
    function fillOval(g, x, y, w, h) {
        g.beginPath();
        g.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, 2 * Math.PI);
        g.fill();
    }

    function drawArrow(g, x, y, orientation) {
        g.fillStyle = "#0000ff";
        g.fillRect(x + INSET, y + INSET, CELL - 2 * INSET, CELL - 2 * INSET);
        g.fillStyle = "#ffffff";
        let xx, yy, xr, yr, wr, hr;
        if (orientation === UP || orientation === DOWN) {
            xx = [x + CELL / 2, x + ARROW_INSET, x + CELL - ARROW_INSET];
            const tip = orientation === UP ? y + ARROW_INSET : y + CELL - ARROW_INSET;
            const base = orientation === UP ? y + (CELL / 3 | 0) * 2 : y + (CELL / 3 | 0);
            yy = [tip, base, base];
            xr = x + (CELL / 3 | 0); wr = CELL / 3 | 0;
            yr = orientation === UP ? y + CELL / 2 : y + ARROW_INSET;
            hr = CELL / 2 - ARROW_INSET;
        } else {
            yy = [y + CELL / 2, y + ARROW_INSET, y + CELL - ARROW_INSET];
            const tip = orientation === LEFT ? x + ARROW_INSET : x + CELL - ARROW_INSET;
            const base = orientation === LEFT ? x + (CELL / 3 | 0) * 2 : x + (CELL / 3 | 0);
            xx = [tip, base, base];
            yr = y + (CELL / 3 | 0); hr = CELL / 3 | 0;
            xr = orientation === LEFT ? x + CELL / 2 : x + ARROW_INSET;
            wr = CELL / 2 - ARROW_INSET;
        }
        g.beginPath();
        g.moveTo(xx[0], yy[0]); g.lineTo(xx[1], yy[1]); g.lineTo(xx[2], yy[2]);
        g.closePath();
        g.fill();
        g.fillRect(xr, yr, wr, hr);
    }

    function drawMouse(g, x, y, orientation) {
        const earY = y + (CELL / 3 | 0);
        const ears = both => {
            g.fillStyle = "#404040";
            if (both || orientation === RIGHT) fillCircle(g, x + (CELL / 3 | 0), earY, MOUSE_EAR / 2);
            if (both || orientation === LEFT) fillCircle(g, x + (CELL / 3 | 0) * 2, earY, MOUSE_EAR / 2);
        };
        const body = () => { g.fillStyle = "#c0c0c0"; fillCircle(g, x + CELL2, y + CELL2, MOUSE_FATNESS / 2); };
        const eye = ex => { g.fillStyle = "#000"; fillOval(g, ex, y + CELL / 2 - MOUSE_EYE, MOUSE_EYE, 2 * MOUSE_EYE); };
        if (orientation === UP) {
            body();
            g.fillStyle = "#000";
            g.fillRect(x + CELL2 - 1, y + MOUSE_FATNESS + (CELL - MOUSE_FATNESS) / 2 - (CELL / 6 | 0), 3, CELL / 10 | 0);
            g.fillRect(x + CELL2, y + MOUSE_FATNESS + (CELL - MOUSE_FATNESS) / 2 - (CELL / 15 | 0), 1, CELL / 6 | 0);
            ears(true);
        } else if (orientation === DOWN) {
            ears(true);
            body();
            eye(x + (CELL / 7 | 0) * 3 - 1);
            eye(x + (CELL / 7 | 0) * 4);
        } else {
            const d = (MOUSE_FATNESS * 1.41 / 3 + 2) | 0;
            g.strokeStyle = "#000";
            g.lineWidth = 1;
            g.beginPath();
            g.moveTo(x + CELL2 + 0.5, y + CELL / 2 + 0.5);
            g.lineTo(x + CELL2 + (orientation === LEFT ? d : -d) + 0.5, y + CELL2 + d + 0.5);
            g.stroke();
            body();
            ears(false);
            eye(orientation === LEFT ? x + (CELL / 7 | 0) * 3 - 1 : x + (CELL / 7 | 0) * 4);
        }
    }

    function drawCat(g, x, y, orientation) {
        const start = { [RIGHT]: 25, [LEFT]: 200, [UP]: 110, [DOWN]: 290 }[orientation] ?? 0;
        const cx = x + CELL2, cy = y + CELL2, r = CAT_FATNESS / 2;
        g.fillStyle = "#ff0000";
        g.beginPath();
        g.moveTo(cx, cy);
        g.arc(cx, cy, r, -start * Math.PI / 180, -(start + 315) * Math.PI / 180, true);
        g.closePath();
        g.fill();
    }

    function drawHorizontalWall(g, x, y) {
        g.fillRect(x, y - WALL_W2, CELL, WALL_W);
        fillOval(g, x - WALL_W2, y - WALL_W, WALL_W, 2 * WALL_W);
        fillOval(g, x - WALL_W2 + CELL, y - WALL_W, WALL_W, 2 * WALL_W);
    }
    function drawVerticalWall(g, x, y) {
        g.fillRect(x - WALL_W2, y, WALL_W, CELL);
        fillOval(g, x - WALL_W, y - WALL_W2, 2 * WALL_W, WALL_W);
        fillOval(g, x - WALL_W, y - WALL_W2 + CELL, 2 * WALL_W, WALL_W);
    }

    // the board: background, arrows, cheese and holes, then mice and cats (unless the game is
    // running and draws them as sprites), then the walls on top
    function drawBoard(g, level, placed, hideCatsAndMice) {
        g.imageSmoothingEnabled = false;
        g.fillStyle = "#000";
        g.fillRect(0, 0, W * CELL + WALL_W, H * CELL + WALL_W);
        if (images.board.complete) g.drawImage(images.board, WALL_W2, WALL_W2, W * CELL, H * CELL);
        g.imageSmoothingEnabled = true;
        for (let j = 0; j < H; j++) {
            for (let i = 0; i < W; i++) {
                const c = level.cells[j][i];
                const x = i * CELL + WALL_W2, y = j * CELL + WALL_W2;
                const arrow = placed && placed.get(i + "," + j);
                if (arrow) drawArrow(g, x, y, arrow);
                g.globalAlpha = arrow ? 0.9 : 1;
                if (c.content === CHEESE) g.drawImage(images.cheese, x + INSET, y + INSET, CELL - 2 * INSET, CELL - 2 * INSET);
                else if (c.content === HOLE) g.drawImage(images.skull, x + INSET, y + INSET, CELL - 2 * INSET, CELL - 2 * INSET);
                else if (!hideCatsAndMice && c.content === MOUSE) drawMouse(g, x, y, c.orientation);
                else if (!hideCatsAndMice && c.content === CAT) drawCat(g, x, y, c.orientation);
                g.globalAlpha = 1;
            }
        }
        g.fillStyle = "#ff0000";
        for (let j = 0; j < H; j++) {
            for (let i = 0; i < W; i++) {
                const c = level.cells[j][i];
                const x = i * CELL + WALL_W2, y = j * CELL + WALL_W2;
                if (i === 0) drawVerticalWall(g, x, y);
                if (j === 0) drawHorizontalWall(g, x, y);
                if (c.wallDown) drawHorizontalWall(g, x, y + CELL);
                if (c.wallRight) drawVerticalWall(g, x + CELL, y);
            }
        }
    }

    // text glowing on black, like the original's blurred "LEVEL 001"
    function glowText(g, text, cx, cy, size, color) {
        g.save();
        g.font = `${size}px system-ui, sans-serif`;
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.fillStyle = color;
        g.shadowColor = color;
        g.shadowBlur = size / 3;
        g.fillText(text, cx, cy);
        g.shadowBlur = 0;
        g.fillText(text, cx, cy);
        g.restore();
    }

    // the arrow tray: up to four arrows, the selected one outlined in white
    function drawTray(canvas, arrows, selected) {
        const g = canvas.getContext("2d");
        g.fillStyle = "#000";
        g.fillRect(0, 0, canvas.width, canvas.height);
        for (let k = 0; k < ARROWS_MAX; k++) {
            const x = INSET + k * CELL, y = INSET;
            if (k < arrows.length) {
                drawArrow(g, x, y, arrows[k]);
                if (selected === k) {
                    g.strokeStyle = "#fff";
                    g.lineWidth = 2;
                    g.strokeRect(x + 1, y + 1, CELL - 2, CELL - 2);
                }
            } else {
                const size = CELL - 2 * INSET;
                const grad = g.createLinearGradient(x, y, x + size, y + size);
                grad.addColorStop(0, "#0000ff");
                grad.addColorStop(1, "#000000");
                g.fillStyle = grad;
                g.fillRect(x + INSET, y + INSET, size, size);
            }
        }
    }

    // play, fast-forward and stop, white on black, green (or red for stop) while active
    function drawButton(canvas, kind, active) {
        const g = canvas.getContext("2d");
        const w = canvas.width, h = canvas.height;
        g.fillStyle = "#000";
        g.fillRect(0, 0, w, h);
        g.fillStyle = active ? (kind === "stop" ? "#ff0000" : "#00ff00") : "#ffffff";
        const size = w - 2 * INSET, sizeY = h - 2 * INSET;
        const tri = pts => { g.beginPath(); g.moveTo(...pts[0]); g.lineTo(...pts[1]); g.lineTo(...pts[2]); g.closePath(); g.fill(); };
        if (kind === "play") {
            tri([[INSET + size / 3, INSET + sizeY / 4], [INSET + size * 2 / 3, INSET + sizeY / 2], [INSET + size / 3, INSET + sizeY * 3 / 4]]);
        } else if (kind === "ff") {
            const x0 = INSET + size / 5 + 2 * INSET, x1 = INSET + size * 2 / 5 + 2 * INSET, shift = size * 2 / 5 - 2 * INSET;
            const y0 = INSET + sizeY / 4, y1 = INSET + sizeY / 2, y2 = y0 + sizeY / 2;
            tri([[x0, y0], [x1, y1], [x0, y2]]);
            tri([[x0 + shift, y0], [x1 + shift, y1], [x0 + shift, y2]]);
        } else {
            g.fillRect(INSET + size / 2 - size / 8, INSET + sizeY / 2 - size / 8, size / 4, size / 4);
        }
    }

    // ---- the game ----

    const levels = LEVEL_FILES.map(text => ({ source: "2003", level: parseLevel(text) }));
    // solutions found ahead of time by solve(), which takes too long to run on the page for these
    levels[0].solution = [["6,0", LEFT], ["6,8", UP]];                                  // level 1, without its third cat
    levels[1].solution = [];                                                            // level 2 needs no arrows
    levels[2].solution = [["2,2", DOWN], ["0,3", RIGHT], ["4,3", UP], ["2,4", LEFT]];  // level 3
    let current = 0;
    let level = null;
    let placed = new Map();     // arrows the player has put on the board
    let tray = [];              // arrows still in the tray
    let selected = -1;
    let game = null;            // the running game, or null
    let mode = "idle";          // idle, running, over
    let lastTime = 0, pending = 0;

    const boardCanvas = $("board");
    const bg = boardCanvas.getContext("2d");
    boardCanvas.width = W * CELL + WALL_W;
    boardCanvas.height = H * CELL + WALL_W;
    const trayCanvas = $("tray");
    trayCanvas.width = CELL * ARROWS_MAX + 2 * INSET;
    trayCanvas.height = CELL + 2 * INSET;
    const bannerCanvas = $("banner");
    const buttons = { play: $("btn-play"), ff: $("btn-ff"), stop: $("btn-stop") };
    for (const c of [bannerCanvas, ...Object.values(buttons)]) { c.width = c.clientWidth || c.width; }

    function loadLevel(k) {
        current = k;
        level = cloneLevel(levels[k].level);
        placed = new Map();
        tray = level.arrows.slice();
        selected = tray.length ? 0 : -1;
        stop();
        const options = $("level-select");
        options.replaceChildren(...levels.map((l, n) => new Option(l.source === "Your level" ? `Level ${n + 1}: ${l.level.name}` : `Level ${n + 1}`, n)));
        options.value = String(k);
        $("message").textContent = "";
        render();
    }

    function stop() {
        game = null;
        mode = "idle";
        render();
    }

    function start(multiplier) {
        if (mode === "over") stop();
        if (!game) {
            game = new Game(level, placed);
            mode = "running";
            $("message").textContent = "";
            lastTime = performance.now();
            pending = 0;
            requestAnimationFrame(tick);
        }
        game.multiplier = multiplier;
        render();
    }

    function tick(now) {
        if (mode !== "running" || !game) return;
        pending += Math.min(now - lastTime, 100) * STEPS_PER_SECOND / 1000;
        lastTime = now;
        while (pending >= 1 && !game.over) {
            pending -= 1;
            for (const s of game.step()) play(s);
        }
        if (game.over) {
            mode = "over";
            $("message").textContent = game.over.won
                ? (current < levels.length - 1 ? "Yeah! On to the next level." : "Yeah! That was the last level.")
                : "Ouch! " + game.over.reason + " Move the arrows and press play again.";
            $("message").className = game.over.won ? "won" : "lost";
            $("next").disabled = !(game.over.won && current < levels.length - 1);
        }
        render();
        if (mode === "running") requestAnimationFrame(tick);
    }

    function render() {
        const running = mode !== "idle" && game;
        drawBoard(bg, level, placed, running);
        if (running) {
            for (const s of game.sprites) {
                if (!s.alive) continue;
                if (s.kind === MOUSE) drawMouse(bg, s.x + WALL_W2, s.y + WALL_W2, s.dir);
                else drawCat(bg, s.x + WALL_W2, s.y + WALL_W2, s.dir);
            }
        }
        if (mode === "over") {
            const o = game.over;
            if (!o.won) {
                bg.strokeStyle = "#fff";
                bg.lineWidth = 5;
                bg.beginPath();
                bg.arc(o.x + WALL_W2 + CELL2, o.y + WALL_W2 + CELL2, CELL2 + 4, 0, 2 * Math.PI);
                bg.stroke();
            }
            bg.fillStyle = "rgba(0,0,0,0.35)";
            bg.fillRect(0, boardCanvas.height / 2 - 50, boardCanvas.width, 100);
            glowText(bg, o.won ? "Yeah!" : "Ouch!", boardCanvas.width / 2, boardCanvas.height / 2, 64, "#fff");
        }
        drawTray(trayCanvas, tray, mode === "idle" ? selected : -1);
        const bctx = bannerCanvas.getContext("2d");
        bctx.fillStyle = "#000";
        bctx.fillRect(0, 0, bannerCanvas.width, bannerCanvas.height);
        glowText(bctx, "LEVEL " + formatLevelNumber(current + 1), bannerCanvas.width / 2, bannerCanvas.height / 2 + 2, CELL / 2, "#fff");
        drawButton(buttons.play, "play", mode === "running" && game.multiplier === 1);
        drawButton(buttons.ff, "ff", mode === "running" && game.multiplier > 1);
        drawButton(buttons.stop, "stop", false);
        $("prev").disabled = current === 0;
        if (mode !== "over") $("next").disabled = current >= levels.length - 1;
    }

    // clicks on the board: place the selected arrow, or take an arrow back
    function cellAt(canvas, e) {
        const r = canvas.getBoundingClientRect();
        const x = (e.clientX - r.left) * canvas.width / r.width - WALL_W2;
        const y = (e.clientY - r.top) * canvas.height / r.height - WALL_W2;
        return [Math.max(0, Math.min(W - 1, Math.floor(x / CELL))), Math.max(0, Math.min(H - 1, Math.floor(y / CELL)))];
    }

    boardCanvas.addEventListener("contextmenu", e => e.preventDefault());
    boardCanvas.addEventListener("pointerdown", e => {
        if (mode !== "idle") return;
        const [i, j] = cellAt(boardCanvas, e);
        const key = i + "," + j;
        if (placed.has(key)) {
            // take it back into the tray, and select it
            tray.push(placed.get(key));
            placed.delete(key);
            selected = tray.length - 1;
        } else if (e.button !== 2 && selected >= 0 && selected < tray.length && ![HOLE, CHEESE].includes(level.cells[j][i].content)) {
            placed.set(key, tray[selected]);
            tray.splice(selected, 1);
            selected = tray.length ? Math.min(selected, tray.length - 1) : -1;
        }
        render();
    });
    trayCanvas.addEventListener("pointerdown", e => {
        if (mode !== "idle") return;
        const r = trayCanvas.getBoundingClientRect();
        const k = Math.floor((e.clientX - r.left) * trayCanvas.width / r.width / CELL);
        if (k < tray.length) selected = k;
        render();
    });
    buttons.play.addEventListener("click", () => start(1));
    buttons.ff.addEventListener("click", () => start(SPEED_MULTIPLIER));
    buttons.stop.addEventListener("click", () => { stop(); $("message").textContent = ""; });
    $("prev").addEventListener("click", () => loadLevel(current - 1));
    $("next").addEventListener("click", () => loadLevel(current + 1));
    $("level-select").addEventListener("change", () => loadLevel(Number($("level-select").value)));
    $("clear-arrows").addEventListener("click", () => {
        if (mode !== "idle") stop();
        placed = new Map();
        tray = level.arrows.slice();
        selected = tray.length ? 0 : -1;
        render();
    });
    $("solve").addEventListener("click", () => {
        stop();
        const has = kind => level.cells.some(row => row.some(c => c.content === kind));
        if (!has(CHEESE) || !has(MOUSE)) {
            $("message").textContent = !has(MOUSE) ? "This level has no mice." : "This level has no cheese, so it can't be won: it was a test level.";
            $("message").className = "lost";
            return;
        }
        $("message").textContent = "Looking for a solution...";
        $("message").className = "";
        const known = levels[current].solution;
        if (known) {
            placed = new Map(known);
            tray = level.arrows.slice();
            for (const [, dir] of known) tray.splice(tray.indexOf(dir), 1);
            selected = tray.length ? 0 : -1;
            $("message").textContent = known.length ? "Here is a way to place the arrows. Press play." : "This level is won without any arrows. Press play.";
            $("message").className = "won";
            render();
            return;
        }
        setTimeout(() => {
            const { solution, exhausted } = solve(level);
            if (solution) {
                placed = solution;
                tray = [];
                selected = -1;
                $("message").textContent = "Here is a way to place the arrows. Press play.";
                $("message").className = "won";
            } else {
                $("message").textContent = exhausted
                    ? "No placement of these arrows wins this level."
                    : "No solution found in a quick search.";
                $("message").className = "lost";
            }
            render();
        }, 20);
    });
    $("mute").addEventListener("change", () => { muted = $("mute").checked; });

    // ---- the editor, from EditorFrame ----

    let edit = emptyLevel();
    let tool = MOUSE, toolDir = UP, erasing = false;
    const editCanvas = $("editor-board");
    const eg = editCanvas.getContext("2d");
    editCanvas.width = W * CELL + WALL_W;
    editCanvas.height = H * CELL + WALL_W;
    const editTray = $("editor-tray");
    editTray.width = CELL * ARROWS_MAX + 2 * INSET;
    editTray.height = CELL + 2 * INSET;

    function renderEditor() {
        drawBoard(eg, edit, null, false);
        drawTray(editTray, edit.arrows, -1);
        for (const b of document.querySelectorAll("[data-tool]")) b.classList.toggle("selected", !erasing && Number(b.dataset.tool) === tool);
        for (const b of document.querySelectorAll("[data-dir]")) b.classList.toggle("selected", Number(b.dataset.dir) === toolDir);
        $("tool-erase").classList.toggle("selected", erasing);
    }

    editCanvas.addEventListener("contextmenu", e => e.preventDefault());
    editCanvas.addEventListener("pointerdown", e => {
        const [x, y] = cellAt(editCanvas, e);
        const b = edit.cells;
        const be = b[y][x];
        if (erasing || e.button === 2) {
            // remove the object, or one wall per click, in the original's order: above, right, below, left
            if (be.content !== NOTHING) {
                be.content = NOTHING;
                be.orientation = NONE;
            } else if (y > 0 && b[y - 1][x].wallDown) b[y - 1][x].wallDown = false;
            else if (be.wallRight && x < W - 1) be.wallRight = false;
            else if (be.wallDown && y < H - 1) be.wallDown = false;
            else if (x > 0 && b[y][x - 1].wallRight) b[y][x - 1].wallRight = false;
        } else if (tool === WALL) {
            if (toolDir === DOWN) be.wallDown = true;
            else if (toolDir === RIGHT) be.wallRight = true;
            else if (toolDir === LEFT && x > 0) b[y][x - 1].wallRight = true;
            else if (toolDir === UP && y > 0) b[y - 1][x].wallDown = true;
        } else if (tool !== ARROW) {
            be.content = tool;
            be.orientation = tool === MOUSE || tool === CAT ? toolDir : NONE;
        }
        renderEditor();
    });
    editTray.addEventListener("contextmenu", e => e.preventDefault());
    editTray.addEventListener("pointerdown", e => {
        if (erasing || e.button === 2) edit.arrows.pop();
        else if (tool === ARROW && edit.arrows.length < ARROWS_MAX) edit.arrows.push(toolDir);
        renderEditor();
    });
    for (const b of document.querySelectorAll("[data-tool]")) {
        b.addEventListener("click", () => { tool = Number(b.dataset.tool); erasing = false; renderEditor(); });
    }
    for (const b of document.querySelectorAll("[data-dir]")) {
        b.addEventListener("click", () => { toolDir = Number(b.dataset.dir); renderEditor(); });
    }
    $("tool-erase").addEventListener("click", () => { erasing = !erasing; renderEditor(); });
    $("level-name").addEventListener("input", () => { edit.name = $("level-name").value; });
    $("editor-new").addEventListener("click", () => {
        edit = emptyLevel($("level-name").value.trim() || "New Level");
        renderEditor();
    });
    $("editor-save").addEventListener("click", () => {
        edit.name = $("level-name").value.trim();
        if (!edit.name) {
            $("editor-message").textContent = "You must enter the level name.";
            return;
        }
        const blob = new Blob([levelToText(edit)], { type: "text/plain" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = edit.name.replace(/[\\/:*?"<>|]/g, "_") + ".txt";
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        $("editor-message").textContent = "";
    });
    $("editor-load").addEventListener("click", () => $("editor-file").click());
    $("editor-file").addEventListener("change", async () => {
        const file = $("editor-file").files[0];
        if (!file) return;
        try {
            edit = parseLevel(await file.text());
            $("level-name").value = edit.name;
            $("editor-message").textContent = "";
        } catch (e) {
            $("editor-message").textContent = e.message;
        }
        $("editor-file").value = "";
        renderEditor();
    });
    $("editor-open").addEventListener("change", () => {
        const k = Number($("editor-open").value);
        if (k >= 0) {
            edit = cloneLevel(levels[k].level);
            $("level-name").value = edit.name;
        }
        $("editor-open").value = "-1";
        renderEditor();
    });
    $("editor-try").addEventListener("click", () => {
        edit.name = $("level-name").value.trim() || "My level";
        const existing = levels.findIndex(l => l.source === "Your level");
        const entry = { source: "Your level", level: cloneLevel(edit) };
        if (existing >= 0) levels[existing] = entry; else levels.push(entry);
        showTab("play");
        loadLevel(existing >= 0 ? existing : levels.length - 1);
    });

    // ---- tabs ----

    function showTab(name) {
        for (const t of ["play", "editor"]) {
            $(`tab-${t}`).classList.toggle("selected", t === name);
            $(`panel-${t}`).hidden = t !== name;
        }
        if (name === "editor") {
            if (mode === "running") stop();
            $("editor-open").replaceChildren(new Option("Open a level...", "-1"), ...levels.map((l, n) => new Option(l.source === "Your level" ? `Level ${n + 1}: ${l.level.name}` : `Level ${n + 1} (2003)`, n)));
            renderEditor();
        }
    }
    $("tab-play").addEventListener("click", () => showTab("play"));
    $("tab-editor").addEventListener("click", () => showTab("editor"));

    $("level-name").value = edit.name;
    let loaded = 0;
    for (const img of Object.values(images)) img.addEventListener("load", () => { if (++loaded === 3) { render(); renderEditor(); } });
    loadLevel(0);
}
