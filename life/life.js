// Conway's Game of Life — JavaScript port of mihailo.life.LifeApplet (Feb 15, 2011)

const THRESHOLD = 0.925; // cell is seeded alive when Math.random() > THRESHOLD

const W = 500; // map width
const H = 350; // map height
const M = 2;   // pixel size multiplier

const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
canvas.width = W;
canvas.height = H;
canvas.style.width = W * M + "px";
canvas.style.height = H * M + "px";

const image = ctx.createImageData(W, H);
const pixels = new Uint32Array(image.data.buffer);
const BLACK = 0xff000000; // little-endian ABGR
const WHITE = 0xffffffff;

let a = new Uint8Array(W * H); // current generation, indexed [y * W + x]
let b = new Uint8Array(W * H); // next generation scratch buffer

let running = false;

const seedButton = document.getElementById("seed");
const startButton = document.getElementById("start");
const nextButton = document.getElementById("next");
const stopButton = document.getElementById("stop");

function seed() {
    for (let i = 0; i < W * H; i++) {
        a[i] = Math.random() > THRESHOLD ? 1 : 0;
    }
}

function calculateNextGeneration() {
    for (let y = 0; y < H; y++) {
        const py = (y === 0 ? H - 1 : y - 1) * W;
        const cy = y * W;
        const ny = (y === H - 1 ? 0 : y + 1) * W;
        for (let x = 0; x < W; x++) {
            const px = x === 0 ? W - 1 : x - 1;
            const nx = x === W - 1 ? 0 : x + 1;
            const count =
                a[py + px] + a[py + x] + a[py + nx] +
                a[cy + px] +             a[cy + nx] +
                a[ny + px] + a[ny + x] + a[ny + nx];
            // alive: survives with 2 or 3 neighbours (<2 starving, >3 overpopulation)
            // dead: becomes alive with exactly 3 neighbours (reproduction)
            b[cy + x] = count === 3 || (count === 2 && a[cy + x] === 1) ? 1 : 0;
        }
    }
    [a, b] = [b, a];
}

function draw() {
    for (let i = 0; i < W * H; i++) {
        pixels[i] = a[i] ? BLACK : WHITE;
    }
    ctx.putImageData(image, 0, 0);
}

function updateButtons() {
    startButton.disabled = running;
    nextButton.disabled = running;
    stopButton.disabled = !running;
    seedButton.disabled = running;
    draw();
}

function loop() {
    if (!running) return;
    calculateNextGeneration();
    draw();
    requestAnimationFrame(loop);
}

seedButton.addEventListener("click", () => { seed(); updateButtons(); });
nextButton.addEventListener("click", () => { calculateNextGeneration(); updateButtons(); });
startButton.addEventListener("click", () => {
    running = true;
    updateButtons();
    requestAnimationFrame(loop);
});
stopButton.addEventListener("click", () => { running = false; updateButtons(); });

seed();
updateButtons();
