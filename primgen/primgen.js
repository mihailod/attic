// Prime Number Generator and RSA Example — JavaScript port of the primgen project (Mihailo Despotovic, May/June 2008):
// PrimeGen / PrimeNumbers / PrimeTest (random primes, checked by trial division) and
// com.mihailod.crypto (a from-scratch RSA: key generation with the extended Euclid, block encryption).
// Uses JavaScript's BigInt for arbitrarily large numbers.

// ---- Primes below one million (replaces primes.txt, which listed all 78,498 of them) ----

const LIMIT = 1000000;

function sieve(limit) {
    const composite = new Uint8Array(limit);
    const primes = [];
    for (let i = 2; i < limit; i++) {
        if (composite[i]) continue;
        primes.push(i);
        for (let j = i * i; j < limit; j += i) composite[j] = 1;
    }
    return primes;
}

const PRIMES = sieve(LIMIT);
const SMALL_PRIMES = PRIMES.slice(0, 2000).map(BigInt); // quick filter for random candidates

// ---- BigInt helpers ----

function bitLength(n) {
    return n === 0n ? 0 : n.toString(2).length;
}

// Largest integer r with r * r <= n (Newton's method, starting above the root)
function isqrt(n) {
    if (n < 2n) return n;
    let x = 1n << BigInt(Math.ceil(bitLength(n) / 2));
    for (;;) {
        const y = (x + n / x) >> 1n;
        if (y >= x) return x;
        x = y;
    }
}

function modPow(base, exp, mod) {
    let result = 1n;
    base %= mod;
    while (exp > 0n) {
        if (exp & 1n) result = result * base % mod;
        base = base * base % mod;
        exp >>= 1n;
    }
    return result;
}

function randomBigInt(bits) {
    const bytes = new Uint8Array(Math.ceil(bits / 8));
    crypto.getRandomValues(bytes);
    let n = 0n;
    for (const b of bytes) n = (n << 8n) | BigInt(b);
    return n & ((1n << BigInt(bits)) - 1n);
}

// Miller-Rabin with random bases: a composite passes one round with probability at most 1/4
function isProbablePrime(n, rounds = 40) {
    if (n < 2n) return false;
    for (const p of SMALL_PRIMES) {
        if (n === p) return true;
        if (n % p === 0n) return false;
    }
    let d = n - 1n, s = 0;
    while ((d & 1n) === 0n) { d >>= 1n; s++; }
    const bits = bitLength(n);
    for (let i = 0; i < rounds; i++) {
        const a = 2n + randomBigInt(bits + 8) % (n - 3n);
        let x = modPow(a, d, n);
        if (x === 1n || x === n - 1n) continue;
        let composite = true;
        for (let r = 1; r < s && composite; r++) {
            x = x * x % n;
            if (x === n - 1n) composite = false;
        }
        if (composite) return false;
    }
    return true;
}

// Like Java's BigInteger.probablePrime: a random prime with exactly this many bits
function probablePrime(bits) {
    if (bits < 2) throw new Error("A prime needs at least 2 bits");
    if (bits === 2) return crypto.getRandomValues(new Uint8Array(1))[0] & 1 ? 3n : 2n;
    for (;;) {
        const candidate = randomBigInt(bits) | (1n << BigInt(bits - 1)) | 1n;
        if (isProbablePrime(candidate)) return candidate;
    }
}

// ---- Trial division (PrimeTest.isPrimeNaive) ----
// First the precomputed primes below one million, then every 6k - 1 and 6k + 1 above that,
// up to the square root. It's a generator: it yields its progress (0..1) now and then so the page
// can show how far along it is. Returns { prime: true } or { prime: false, divisor, quotient }.

function* trialDivision(n) {
    if (n < 2n) return { prime: false, tooSmall: true };
    const root = isqrt(n);
    const small = n <= BigInt(Number.MAX_SAFE_INTEGER);
    const nNum = small ? Number(n) : 0;

    // the precomputed primes
    for (let i = 0; i < PRIMES.length; i++) {
        const p = PRIMES[i];
        if (BigInt(p) > root) return { prime: true };
        if (small ? nNum % p === 0 : n % BigInt(p) === 0n) {
            return { prime: false, divisor: BigInt(p), quotient: n / BigInt(p) };
        }
    }

    // 6k - 1 and 6k + 1 above one million (every prime above 3 has that form)
    const first = Math.floor(LIMIT / 6) + 1; // 6 * 166667 - 1 = 1000001
    const span = Number(root) - 6 * first; // for the progress estimate
    if (small) {
        const r = Number(root);
        for (let k = first; 6 * k - 1 <= r; k++) {
            const a = 6 * k - 1, b = 6 * k + 1;
            if (nNum % a === 0) return { prime: false, divisor: BigInt(a), quotient: n / BigInt(a) };
            if (b <= r && nNum % b === 0) return { prime: false, divisor: BigInt(b), quotient: n / BigInt(b) };
            if (k % 200000 === 0) yield (6 * (k - first)) / span;
        }
    } else {
        for (let k = BigInt(first), i = 0; 6n * k - 1n <= root; k++, i++) {
            const a = 6n * k - 1n, b = 6n * k + 1n;
            if (n % a === 0n) return { prime: false, divisor: a, quotient: n / a };
            if (b <= root && n % b === 0n) return { prime: false, divisor: b, quotient: n / b };
            if (i % 20000 === 0) yield Number(6n * (k - BigInt(first))) / span;
        }
    }
    return { prime: true };
}

// Util.msToReadableTime
function readableTime(ms) {
    const h = Math.floor(ms / 3600000), m = Math.floor(ms % 3600000 / 60000), s = Math.floor(ms % 60000 / 1000);
    if (h === 0 && m === 0 && s === 0) return ms < 1 ? "negligible" : Math.round(ms) + "ms";
    return [h && h + "h", m && m + "m", s && s + "s"].filter(Boolean).join(" ");
}

// ---- RSA (RSAKeyPairGenerator, RSA, MathUtil) ----

const E = 65537n; // exponent, Fermat's prime 2^16 + 1
const PAD_MARKER = 63;

// Extended Euclid's algorithm solves a*u + b*v = gcd(a, b); returns [u, v, gcd(a, b)]
function extendedEuclid(a, b) {
    if (b === 0n) return [1n, 0n, a];
    let x1, x2, x3, y1, y2, y3;
    if (a < b) {
        [x1, x2, x3] = [0n, 1n, b];
        [y1, y2, y3] = [1n, 0n, a];
    } else {
        [x1, x2, x3] = [1n, 0n, a];
        [y1, y2, y3] = [0n, 1n, b];
    }
    while (y3 > 1n) {
        const q = x3 / y3;
        const t = [x1 - q * y1, x2 - q * y2, x3 - q * y3];
        [x1, x2, x3] = [y1, y2, y3];
        [y1, y2, y3] = t;
    }
    return y3 === 0n ? [x1, x2, x3] : [y1, y2, y3];
}

// Two random primes of `bits` bits each; n = p * q, and d is the inverse of e mod (p - 1)(q - 1)
function generateKeys(bits) {
    if (bits % 8 !== 0 || bits < 8) throw new Error("The prime size must be a multiple of 8, at least 8 bits");
    for (;;) {
        const p = probablePrime(bits), q = probablePrime(bits);
        if (p === q) continue;
        const phi = (p - 1n) * (q - 1n);
        const [u, , gcd] = extendedEuclid(E, phi);
        if (gcd !== 1n) continue; // e must have an inverse; try other primes
        const d = u < 0n ? u + phi : u;
        return { n: p * q, e: E, d, blockBytes: bits / 8 };
    }
}

// The message's UTF-8 bytes, then the pad marker, then zeros up to a whole number of blocks
function pad(bytes, blockBytes) {
    const padded = new Uint8Array(bytes.length + blockBytes - bytes.length % blockBytes);
    padded.set(bytes);
    padded[bytes.length] = PAD_MARKER;
    return padded;
}

function unpad(padded) {
    let i = padded.length - 1;
    while (i >= 0 && padded[i] === 0) i--;
    if (i < 0 || padded[i] !== PAD_MARKER) throw new Error("This doesn't decrypt to a padded message: wrong key, or the ciphertext was changed");
    return padded.slice(0, i);
}

// c = m^e mod n, one number per block, one block per line
function encrypt(text, key) {
    const padded = pad(new TextEncoder().encode(text), key.blockBytes);
    const lines = [];
    for (let i = 0; i < padded.length; i += key.blockBytes) {
        let block = 0n;
        for (let j = 0; j < key.blockBytes; j++) block = (block << 8n) | BigInt(padded[i + j]);
        lines.push(modPow(block, key.e, key.n).toString());
    }
    return lines.join("\n");
}

// m = c^d mod n
function decrypt(cipherText, key) {
    const lines = cipherText.split("\n").map(s => s.trim()).filter(Boolean);
    const padded = new Uint8Array(lines.length * key.blockBytes);
    lines.forEach((line, k) => {
        if (!/^\d+$/.test(line)) throw new Error(`Line ${k + 1} of the ciphertext isn't a number`);
        const c = BigInt(line);
        if (c >= key.n) throw new Error(`Line ${k + 1} of the ciphertext is too big for this key`);
        let block = modPow(c, key.d, key.n);
        for (let j = key.blockBytes - 1; j >= 0; j--) {
            padded[k * key.blockBytes + j] = Number(block & 255n);
            block >>= 8n;
        }
        if (block !== 0n) throw new Error("This doesn't decrypt to a padded message: wrong key, or the ciphertext was changed");
    });
    return new TextDecoder().decode(unpad(padded));
}

// ---- UI ----

const $ = id => document.getElementById(id);
const pause = () => new Promise(resolve => setTimeout(resolve, 0)); // let the page repaint

// 1. Generate primes (PrimeGen.main: 100 random 12-bit primes, each checked by trial division)
const VERIFY_BITS = 40; // up to here, trial division is instant (the precomputed primes cover the square root)

$("gen-form").addEventListener("submit", async e => {
    e.preventDefault();
    const bits = Math.round(Number($("gen-bits").value));
    const count = Math.round(Number($("gen-count").value));
    const out = $("gen-output");
    if (!(bits >= 2 && bits <= 4096)) { out.textContent = "The size must be 2 to 4096 bits."; return; }
    if (!(count >= 1 && count <= 1000)) { out.textContent = "Generate 1 to 1000 primes at a time."; return; }
    $("gen-button").disabled = true;
    out.textContent = "Generating...";
    await pause();
    const start = performance.now();
    const lines = [];
    for (let i = 0; i < count; i++) {
        const p = probablePrime(bits);
        if (bits <= VERIFY_BITS) {
            const result = trialDivision(p).next().value; // never yields at this size
            lines.push(`${p} ${result.prime ? "is prime (checked by trial division)" : "is NOT prime!"}`);
        } else {
            lines.push(`${p}`);
        }
        if (i % 10 === 9) await pause();
    }
    const note = bits <= VERIFY_BITS ? "" :
        `\n\nAbove ${VERIFY_BITS} bits these are probable primes (Miller-Rabin, like Java's BigInteger.probablePrime);` +
        " trial division would take too long. Paste one into “Test a number” to try anyway.";
    out.textContent = `${count} random ${bits}-bit prime${count === 1 ? "" : "s"} (${readableTime(performance.now() - start)}):\n\n` + lines.join("\n") + note;
    $("gen-button").disabled = false;
});

// 2. Test a number by trial division, with a progress estimate (PrimeTest.isPrimeNaive)
let testRun = null;

$("test-form").addEventListener("submit", async e => {
    e.preventDefault();
    if (testRun) { testRun.cancelled = true; return; } // the button says Stop while testing
    const out = $("test-output");
    const text = $("test-number").value.replace(/[\s,_]/g, "");
    if (!/^\d+$/.test(text)) { out.textContent = "Enter a whole number."; return; }
    const n = BigInt(text);
    const run = testRun = { cancelled: false };
    $("test-button").textContent = "Stop";
    const start = performance.now();
    const steps = trialDivision(n);
    let step, sliceStart = performance.now(), lastShown = 0;
    out.textContent = "Testing...";
    for (;;) {
        step = steps.next();
        if (step.done) break;
        const now = performance.now();
        if (now - lastShown > 250) {
            const fraction = Math.max(step.value, 1e-9);
            const elapsed = now - start;
            out.textContent = `${(100 * fraction).toFixed(2)}% done, ${readableTime(elapsed / fraction - elapsed)} to go...`;
            lastShown = now;
        }
        if (now - sliceStart > 30) { // keep the page responsive
            await pause();
            sliceStart = performance.now();
            if (run.cancelled) break;
        }
    }
    const ms = performance.now() - start;
    if (run.cancelled) out.textContent = "Stopped.";
    else if (step.value.tooSmall) out.textContent = `${n} is not prime (primes start at 2).`;
    else if (step.value.prime) out.textContent = `${n} is prime!\n${bitLength(n)} bits, running time ${readableTime(ms)}`;
    else out.textContent = `${n} is not prime!\nDivide it by ${step.value.divisor} and you get ${step.value.quotient}.\nRunning time ${readableTime(ms)}`;
    testRun = null;
    $("test-button").textContent = "Test";
});

$("test-random").addEventListener("click", () => {
    $("test-number").value = probablePrime(Number($("test-random-bits").value)).toString();
});

// 3. RSA
let key = null;

async function newKeys() {
    $("rsa-generate").disabled = true;
    $("rsa-n").value = $("rsa-d").value = "Generating...";
    await pause();
    const bits = Number($("rsa-bits").value);
    const start = performance.now();
    key = generateKeys(bits);
    $("rsa-e").value = key.e.toString();
    $("rsa-n").value = key.n.toString();
    $("rsa-d").value = key.d.toString();
    $("rsa-info").textContent = `Two ${bits}-bit primes, n has ${bitLength(key.n)} bits, ${key.blockBytes}-byte blocks. Generated in ${readableTime(performance.now() - start)}.`;
    $("rsa-cipher").value = "";
    $("rsa-decrypted").value = "";
    $("rsa-generate").disabled = false;
}

$("rsa-generate").addEventListener("click", newKeys);
$("rsa-encrypt").addEventListener("click", () => {
    if (!key) return;
    $("rsa-cipher").value = encrypt($("rsa-message").value, key);
    $("rsa-decrypted").value = "";
});
$("rsa-decrypt").addEventListener("click", () => {
    if (!key) return;
    try {
        $("rsa-decrypted").value = decrypt($("rsa-cipher").value, key);
    } catch (err) {
        $("rsa-decrypted").value = err.message;
    }
});

newKeys();
