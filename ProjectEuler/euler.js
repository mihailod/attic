// Project Euler Solutions — JavaScript port of my Project Euler solutions in Java
// (Mihailo Despotovic, March 2009). Each original file held one or more problems, with the one
// being worked on in main() and earlier ones renamed to main1(), main7() or commented out.
// Here every problem gets its own function, and runs in a Web Worker so the page stays responsive.
//
// Bugs fixed from the original:
//  - #2: the loop stopped as soon as the larger of each pair of terms passed four million, which
//    dropped the last even term, 3,524,578: it printed 1,089,154 instead of 4,613,732.
//  - #25: only every other term was checked; it got the right term number by luck, but printed
//    the term after it.
//  - #3: the prime test skipped every divisor below one million, so it called every number
//    below 10^12 prime and printed all divisors, and the loop ran up to 600,851,475,143.
//    Now factors are divided out as they are found, which also ends the loop.
//  - #9: a started at 0, so 0² + 500² = 500² was printed as a first answer, abc = 0, and the
//    real answer was printed twice, as a, b and as b, a.
//  - #12: a perfect square's square root was counted as two divisors.
//  - #48 and #97 printed the whole number instead of its last ten digits, and #97 used
//    28433 × 2^7830458 instead of 28433 × 2^7830457 + 1.
//  - #50: the sum of consecutive primes wasn't kept below one million, overflowed an int,
//    and the prime reported was the last one found rather than the longest; it also only
//    tried the first 10 starting primes.
// Unfinished in the original and completed here: #11 (the grid was read in but not searched)
// and #41 (the pandigital test allowed 0 instead of requiring the digits 1 to n).

const PROBLEMS = [
    { n: 1, title: "Multiples of 3 or 5", file: "Problem1.java",
      text: "Find the sum of all the multiples of 3 or 5 below 1000." },
    { n: 2, title: "Even Fibonacci numbers", file: "Problem2.java",
      text: "By considering the terms in the Fibonacci sequence whose values do not exceed four million, find the sum of the even-valued terms.",
      note: "Fixed: the original lost the last even term and printed 1,089,154." },
    { n: 3, title: "Largest prime factor", file: "Problem3.java",
      text: "What is the largest prime factor of the number 600851475143?",
      note: "Fixed: the original's prime test passed every number below 10^12, and its loop would have run to 600,851,475,143." },
    { n: 4, title: "Largest palindrome product", file: "Problem4.java",
      text: "Find the largest palindrome made from the product of two 3-digit numbers." },
    { n: 5, title: "Smallest multiple", file: "Problem5.java",
      text: "What is the smallest number divisible by each of the numbers 1 to 20?" },
    { n: 6, title: "Sum square difference", file: "Problem6.java",
      text: "Find the difference between the sum of the squares of the first one hundred natural numbers and the square of the sum." },
    { n: 7, title: "10001st prime", file: "Problem7.java",
      text: "What is the 10,001st prime number?" },
    { n: 8, title: "Largest product in a series", file: "Problem8.java",
      text: "Find the greatest product of five consecutive digits in the 1000-digit number.",
      note: "In 2009 the problem asked for five digits; it now asks for thirteen." },
    { n: 9, title: "Special Pythagorean triplet", file: "Problem9.java",
      text: "There exists exactly one Pythagorean triplet for which a + b + c = 1000. Find the product abc.",
      note: "Fixed: the original also printed 0, from 0² + 500² = 500²." },
    { n: 10, title: "Summation of primes", file: "Problem7.java",
      text: "Find the sum of all the primes below two million." },
    { n: 11, title: "Largest product in a grid", file: "Problem14.java",
      text: "What is the greatest product of four adjacent numbers in any direction (up, down, left, right, or diagonally) in the 20 × 20 grid?",
      note: "Unfinished in the original: the grid was read in but not searched." },
    { n: 12, title: "Highly divisible triangular number", file: "Problem12.java",
      text: "What is the value of the first triangle number to have over five hundred divisors?" },
    { n: 13, title: "Large sum", file: "Problem13.java",
      text: "Work out the first ten digits of the sum of one hundred 50-digit numbers." },
    { n: 14, title: "Longest Collatz sequence", file: "Problem14real.java",
      text: "Which starting number under one million produces the longest chain, where n → n/2 for even n and n → 3n + 1 for odd n?" },
    { n: 16, title: "Power digit sum", file: "Problem7.java",
      text: "What is the sum of the digits of the number 2^1000?" },
    { n: 20, title: "Factorial digit sum", file: "Problem20.java",
      text: "Find the sum of the digits in the number 100!" },
    { n: 22, title: "Names scores", file: "Problem22.java",
      text: "Sort 5,000+ first names alphabetically; a name’s score is its position times the sum of its letters (A = 1, B = 2, …). What is the total of all the name scores?" },
    { n: 25, title: "1000-digit Fibonacci number", file: "Problem2.java",
      text: "What is the index of the first term in the Fibonacci sequence to contain 1000 digits?",
      note: "Fixed: the original checked only every other term and printed the wrong one." },
    { n: 35, title: "Circular primes", file: "Problem35.java",
      text: "The number 197 is called a circular prime because all rotations of its digits, 197, 971 and 719, are prime. How many circular primes are there below one million?" },
    { n: 36, title: "Double-base palindromes", file: "Problem4.java",
      text: "Find the sum of all numbers less than one million which are palindromic in base 10 and base 2." },
    { n: 41, title: "Pandigital prime", file: "Problem7.java",
      text: "An n-digit number is pandigital if it uses all the digits 1 to n exactly once. What is the largest n-digit pandigital prime?",
      note: "Unfinished in the original, which tested for the digits 0 to n − 1." },
    { n: 44, title: "Pentagon numbers", file: "Problem44.java",
      text: "Find the pair of pentagonal numbers Pj and Pk, Pn = n(3n − 1)/2, whose sum and difference are both pentagonal and whose difference D is smallest. What is D?" },
    { n: 45, title: "Triangular, pentagonal, and hexagonal", file: "Problem45.java",
      text: "T285 = P165 = H143 = 40755. Find the next triangle number that is also pentagonal and hexagonal." },
    { n: 48, title: "Self powers", file: "Problem48.java",
      text: "Find the last ten digits of 1^1 + 2^2 + 3^3 + … + 1000^1000.",
      note: "Fixed: the original printed the whole 3,001-digit sum." },
    { n: 49, title: "Prime permutations", file: "Problem49.java",
      text: "1487, 4817, 8147 are primes, permutations of each other, and 3330 apart. Find the other such 4-digit sequence." },
    { n: 50, title: "Consecutive prime sum", file: "Problem50.java",
      text: "Which prime, below one million, can be written as the sum of the most consecutive primes?",
      note: "Fixed: the original didn’t stop at one million, overflowed, and only tried 10 starting primes." },
    { n: 56, title: "Powerful digit sum", file: "Problem56.java",
      text: "Considering numbers of the form a^b, where a, b < 100, what is the maximum digital sum?" },
    { n: 97, title: "Large non-Mersenne prime", file: "Problem48.java",
      text: "Find the last ten digits of the prime 28433 × 2^7830457 + 1.",
      note: "Fixed: the original used the wrong exponent, left out the + 1, and printed the whole 2,357,207-digit number. Now only the last ten digits are computed." },
];

// The solutions, one function per problem. This function is also turned into the Web Worker's
// source code, so it must not use anything from outside itself.
function eulerSolutions(println, names) {
    // PrimeNumbers: the 78,498 primes below one million (the original read them from primes.txt)
    const PRIMES64 = (() => {
        const N = 1000000;
        const composite = new Uint8Array(N);
        const primes = [];
        for (let i = 2; i < N; i++) {
            if (composite[i]) continue;
            primes.push(i);
            for (let j = i * i; j < N; j += i) composite[j] = 1;
        }
        return primes;
    })();

    // stands in for BigInteger.isProbablePrime(), by trial division; exact below 10^12
    const isProbablePrime = n => {
        if (n < 2) return false;
        for (const p of PRIMES64) {
            if (p * p > n) return true;
            if (n % p === 0) return false;
        }
        return true;
    };
    const digitalSum = x => {
        const s = x.toString();
        let sum = 0;
        for (let i = 0; i < s.length; i++) sum += s.charCodeAt(i) - 48;
        return sum;
    };
    const isPalindrome = s => {
        for (let i = 0; i < s.length / 2; i++) {
            if (s[i] !== s[s.length - 1 - i]) return false;
        }
        return true;
    };
    const lastTenDigits = big => (big % 10000000000n).toString().padStart(10, "0");

    const P = {};

    P[1] = () => {
        let sum = 0;
        for (let i = 3; i < 1000; i++) {
            if (i % 3 === 0 || i % 5 === 0) sum += i;
        }
        println("sum = " + sum);
    };

    P[2] = () => {
        let a = 1, b = 1, sum = 0;
        for (;;) {
            if (a > 4000000) break;
            if (a % 2 === 0) sum += a;
            if (b > 4000000) break;
            if (b % 2 === 0) sum += b;
            const oldb = b;
            a = a + b;
            b = a + oldb;
        }
        println("sum = " + sum);
    };

    P[3] = () => {
        let n = 600851475143;
        let largest = 0;
        for (let i = 3; i <= n; i++) {
            if (n % i === 0 && isProbablePrime(i)) {
                println(" *** factor i = " + i);
                largest = i;
                while (n % i === 0) n /= i;
            }
        }
        println("largest = " + largest);
    };

    P[4] = () => {
        let max = 0;
        for (let i = 100; i < 1000; i++) {
            for (let j = 100; j < 1000; j++) {
                const prod = i * j;
                if (isPalindrome(String(prod)) && prod > max) max = prod;
            }
        }
        println("max = " + max);
    };

    P[5] = () => {
        const divisible = num => {
            for (let i = 2; i < 20; i++) if (num % i !== 0) return false;
            return true;
        };
        let num = 20;
        while (!divisible(num)) num += 20;
        println("num = " + num);
    };

    P[6] = () => {
        let sum = 0, sumOfSquares = 0;
        for (let i = 1; i <= 100; i++) {
            sum += i;
            sumOfSquares += i * i;
        }
        println("sum = " + sum);
        const squareOfSum = sum * sum;
        println("squareOfSum = " + squareOfSum);
        println("sumOfSquares = " + sumOfSquares);
        println("diff = " + (squareOfSum - sumOfSquares));
    };

    P[7] = () => println(PRIMES64[10000]);

    P[8] = () => {
        const s = 
            "73167176531330624919225119674426574742355349194934" +
            "96983520312774506326239578318016984801869478851843" +
            "85861560789112949495459501737958331952853208805511" +
            "12540698747158523863050715693290963295227443043557" +
            "66896648950445244523161731856403098711121722383113" +
            "62229893423380308135336276614282806444486645238749" +
            "30358907296290491560440772390713810515859307960866" +
            "70172427121883998797908792274921901699720888093776" +
            "65727333001053367881220235421809751254540594752243" +
            "52584907711670556013604839586446706324415722155397" +
            "53697817977846174064955149290862569321978468622482" +
            "83972241375657056057490261407972968652414535100474" +
            "82166370484403199890008895243450658541227588666881" +
            "16427171479924442928230863465674813919123162824586" +
            "17866458359124566529476545682848912883142607690042" +
            "24219022671055626321111109370544217506941658960408" +
            "07198403850962455444362981230987879927244284909188" +
            "84580156166097919133875499200524063689912560717606" +
            "05886116467109405077541002256983155200055935729725" +
            "71636269561882670428252483600823257530420752963450";
        const findProd = s => (s.charCodeAt(0) - 48) * (s.charCodeAt(1) - 48) * (s.charCodeAt(2) - 48) *
                              (s.charCodeAt(3) - 48) * (s.charCodeAt(4) - 48);
        let maxProd = 0;
        for (let i = 0; i < s.length - 4; i++) {
            const candidateProd = findProd(s.substring(i, i + 5));
            if (candidateProd > maxProd) maxProd = candidateProd;
        }
        println("maxProd = " + maxProd);
    };

    P[9] = () => {
        for (let a = 1; a < 1001; a++) {
            for (let b = a + 1; b < 1001; b++) {
                for (let c = 1; c < 1001; c++) {
                    if (a * a + b * b === c * c && a + b + c === 1000) println("abc = " + a * b * c);
                }
            }
        }
    };

    P[10] = () => {
        let sum = 0;
        for (let i = 2; i < 2000000; i++) {
            if (isProbablePrime(i)) sum += i;
        }
        println("sum = " + sum);
    };

    P[11] = () => {
        const s = 
            "08 02 22 97 38 15 00 40 00 75 04 05 07 78 52 12 50 77 91 08\n" +
            "49 49 99 40 17 81 18 57 60 87 17 40 98 43 69 48 04 56 62 00\n" +
            "81 49 31 73 55 79 14 29 93 71 40 67 53 88 30 03 49 13 36 65\n" +
            "52 70 95 23 04 60 11 42 69 24 68 56 01 32 56 71 37 02 36 91\n" +
            "22 31 16 71 51 67 63 89 41 92 36 54 22 40 40 28 66 33 13 80\n" +
            "24 47 32 60 99 03 45 02 44 75 33 53 78 36 84 20 35 17 12 50\n" +
            "32 98 81 28 64 23 67 10 26 38 40 67 59 54 70 66 18 38 64 70\n" +
            "67 26 20 68 02 62 12 20 95 63 94 39 63 08 40 91 66 49 94 21\n" +
            "24 55 58 05 66 73 99 26 97 17 78 78 96 83 14 88 34 89 63 72\n" +
            "21 36 23 09 75 00 76 44 20 45 35 14 00 61 33 97 34 31 33 95\n" +
            "78 17 53 28 22 75 31 67 15 94 03 80 04 62 16 14 09 53 56 92\n" +
            "16 39 05 42 96 35 31 47 55 58 88 24 00 17 54 24 36 29 85 57\n" +
            "86 56 00 48 35 71 89 07 05 44 44 37 44 60 21 58 51 54 17 58\n" +
            "19 80 81 68 05 94 47 69 28 73 92 13 86 52 17 77 04 89 55 40\n" +
            "04 52 08 83 97 35 99 16 07 97 57 32 16 26 26 79 33 27 98 66\n" +
            "88 36 68 87 57 62 20 72 03 46 33 67 46 55 12 32 63 93 53 69\n" +
            "04 42 16 73 38 25 39 11 24 94 72 18 08 46 29 32 40 62 76 36\n" +
            "20 69 36 41 72 30 23 88 34 62 99 69 82 67 59 85 74 04 36 16\n" +
            "20 73 35 29 78 31 90 01 74 31 49 71 48 86 81 16 23 57 05 54\n" +
            "01 70 54 71 83 51 54 69 16 92 33 48 61 43 52 01 89 19 67 48";
        const a = Array.from({ length: 20 }, () => new Array(20));
        s.split("\n").forEach((line, y) => line.split(" ").forEach((numberString, x) => { a[x][y] = parseInt(numberString, 10); }));
        let max = 0;
        // right, down, down-right and up-right; the other four directions give the same products
        for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
            for (let x = 0; x < 20; x++) {
                for (let y = 0; y < 20; y++) {
                    const x3 = x + 3 * dx, y3 = y + 3 * dy;
                    if (x3 < 0 || x3 > 19 || y3 < 0 || y3 > 19) continue;
                    const prod = a[x][y] * a[x + dx][y + dy] * a[x + 2 * dx][y + 2 * dy] * a[x3][y3];
                    if (prod > max) max = prod;
                }
            }
        }
        println("max = " + max);
    };

    P[12] = () => {
        const findDivisors = n => {
            let divisors = 0;
            const maxdivint = Math.floor(Math.sqrt(n));
            for (let i = 1; i <= maxdivint; i++) {
                if (n % i === 0) divisors += i * i === n ? 1 : 2;
            }
            return divisors;
        };
        const generateTriangleNum = n => {
            let num = 0;
            for (let i = 1; i <= n; i++) num += i;
            return num;
        };
        for (let i = 1; i < 1000000000; i++) {
            const num = generateTriangleNum(i);
            const divisors = findDivisors(num);
            if (divisors > 500) {
                println("divisors = " + divisors);
                println("num = " + num);
                break;
            }
        }
    };

    P[13] = () => {
        const s = 
            "37107287533902102798797998220837590246510135740250\n" +
            "46376937677490009712648124896970078050417018260538\n" +
            "74324986199524741059474233309513058123726617309629\n" +
            "91942213363574161572522430563301811072406154908250\n" +
            "23067588207539346171171980310421047513778063246676\n" +
            "89261670696623633820136378418383684178734361726757\n" +
            "28112879812849979408065481931592621691275889832738\n" +
            "44274228917432520321923589422876796487670272189318\n" +
            "47451445736001306439091167216856844588711603153276\n" +
            "70386486105843025439939619828917593665686757934951\n" +
            "62176457141856560629502157223196586755079324193331\n" +
            "64906352462741904929101432445813822663347944758178\n" +
            "92575867718337217661963751590579239728245598838407\n" +
            "58203565325359399008402633568948830189458628227828\n" +
            "80181199384826282014278194139940567587151170094390\n" +
            "35398664372827112653829987240784473053190104293586\n" +
            "86515506006295864861532075273371959191420517255829\n" +
            "71693888707715466499115593487603532921714970056938\n" +
            "54370070576826684624621495650076471787294438377604\n" +
            "53282654108756828443191190634694037855217779295145\n" +
            "36123272525000296071075082563815656710885258350721\n" +
            "45876576172410976447339110607218265236877223636045\n" +
            "17423706905851860660448207621209813287860733969412\n" +
            "81142660418086830619328460811191061556940512689692\n" +
            "51934325451728388641918047049293215058642563049483\n" +
            "62467221648435076201727918039944693004732956340691\n" +
            "15732444386908125794514089057706229429197107928209\n" +
            "55037687525678773091862540744969844508330393682126\n" +
            "18336384825330154686196124348767681297534375946515\n" +
            "80386287592878490201521685554828717201219257766954\n" +
            "78182833757993103614740356856449095527097864797581\n" +
            "16726320100436897842553539920931837441497806860984\n" +
            "48403098129077791799088218795327364475675590848030\n" +
            "87086987551392711854517078544161852424320693150332\n" +
            "59959406895756536782107074926966537676326235447210\n" +
            "69793950679652694742597709739166693763042633987085\n" +
            "41052684708299085211399427365734116182760315001271\n" +
            "65378607361501080857009149939512557028198746004375\n" +
            "35829035317434717326932123578154982629742552737307\n" +
            "94953759765105305946966067683156574377167401875275\n" +
            "88902802571733229619176668713819931811048770190271\n" +
            "25267680276078003013678680992525463401061632866526\n" +
            "36270218540497705585629946580636237993140746255962\n" +
            "24074486908231174977792365466257246923322810917141\n" +
            "91430288197103288597806669760892938638285025333403\n" +
            "34413065578016127815921815005561868836468420090470\n" +
            "23053081172816430487623791969842487255036638784583\n" +
            "11487696932154902810424020138335124462181441773470\n" +
            "63783299490636259666498587618221225225512486764533\n" +
            "67720186971698544312419572409913959008952310058822\n" +
            "95548255300263520781532296796249481641953868218774\n" +
            "76085327132285723110424803456124867697064507995236\n" +
            "37774242535411291684276865538926205024910326572967\n" +
            "23701913275725675285653248258265463092207058596522\n" +
            "29798860272258331913126375147341994889534765745501\n" +
            "18495701454879288984856827726077713721403798879715\n" +
            "38298203783031473527721580348144513491373226651381\n" +
            "34829543829199918180278916522431027392251122869539\n" +
            "40957953066405232632538044100059654939159879593635\n" +
            "29746152185502371307642255121183693803580388584903\n" +
            "41698116222072977186158236678424689157993532961922\n" +
            "62467957194401269043877107275048102390895523597457\n" +
            "23189706772547915061505504953922979530901129967519\n" +
            "86188088225875314529584099251203829009407770775672\n" +
            "11306739708304724483816533873502340845647058077308\n" +
            "82959174767140363198008187129011875491310547126581\n" +
            "97623331044818386269515456334926366572897563400500\n" +
            "42846280183517070527831839425882145521227251250327\n" +
            "55121603546981200581762165212827652751691296897789\n" +
            "32238195734329339946437501907836945765883352399886\n" +
            "75506164965184775180738168837861091527357929701337\n" +
            "62177842752192623401942399639168044983993173312731\n" +
            "32924185707147349566916674687634660915035914677504\n" +
            "99518671430235219628894890102423325116913619626622\n" +
            "73267460800591547471830798392868535206946944540724\n" +
            "76841822524674417161514036427982273348055556214818\n" +
            "97142617910342598647204516893989422179826088076852\n" +
            "87783646182799346313767754307809363333018982642090\n" +
            "10848802521674670883215120185883543223812876952786\n" +
            "71329612474782464538636993009049310363619763878039\n" +
            "62184073572399794223406235393808339651327408011116\n" +
            "66627891981488087797941876876144230030984490851411\n" +
            "60661826293682836764744779239180335110989069790714\n" +
            "85786944089552990653640447425576083659976645795096\n" +
            "66024396409905389607120198219976047599490197230297\n" +
            "64913982680032973156037120041377903785566085089252\n" +
            "16730939319872750275468906903707539413042652315011\n" +
            "94809377245048795150954100921645863754710598436791\n" +
            "78639167021187492431995700641917969777599028300699\n" +
            "15368713711936614952811305876380278410754449733078\n" +
            "40789923115535562561142322423255033685442488917353\n" +
            "44889911501440648020369068063960672322193204149535\n" +
            "41503128880339536053299340368006977710650566631954\n" +
            "81234880673210146739058568557934581403627822703280\n" +
            "82616570773948327592232845941706525094512325230608\n" +
            "22918802058777319719839450180888072429661980811197\n" +
            "77158542502016545090413245809786882778948721859617\n" +
            "72107838435069186155435662884062257473692284509516\n" +
            "20849603980134001723930671666823555245252804609722\n" +
            "53503534226472524250874054075591789781264330331690";
        let sum = 0n;
        for (const token of s.split("\n")) sum += BigInt(token);
        println("sum = " + sum);
        println("first ten digits = " + sum.toString().substring(0, 10));
    };

    P[14] = () => {
        const makeSequence = n => {
            const al = [];
            for (;;) {
                al.push(n);
                if (n === 1) break;
                n = n % 2 === 0 ? n / 2 : 3 * n + 1;
            }
            return al;
        };
        let max = 0, index = 0;
        for (let i = 1; i <= 1000000; i++) {
            const len = makeSequence(i).length;
            if (len > max) {
                max = len;
                index = i;
            }
        }
        println("max = " + max);
        println("index = " + index);
    };

    P[16] = () => {
        const b = 2n ** 1000n;
        println("b = " + b);
        println("sum = " + digitalSum(b));
    };

    P[20] = () => {
        let fact = 1n;
        for (let i = 1n; i <= 100n; i++) fact *= i;
        println("fact = " + fact);
        println("sum = " + digitalSum(fact));
    };

    P[22] = () => {
        const a = names.slice().sort((x, y) => (x < y ? -1 : x > y ? 1 : 0));
        let total = 0;
        a.forEach((s, i) => {
            let worth = 0;
            for (let j = 0; j < s.length; j++) worth += s.charCodeAt(j) - 64;
            total += worth * (i + 1);
        });
        println("total = " + total);
    };

    P[25] = () => {
        // a and b are terms number termNumber and termNumber + 1
        let termNumber = 1, a = 1n, b = 1n;
        for (;;) {
            if (a.toString().length === 1000) break;
            if (b.toString().length === 1000) {
                a = b;
                termNumber++;
                break;
            }
            const oldb = b;
            a = a + b;
            b = a + oldb;
            termNumber += 2;
        }
        println("a = " + a);
        println("termNumber = " + termNumber);
    };

    P[35] = () => {
        const isPrime = p => {
            for (let i = 0; i < PRIMES64.length; i++) if (p === PRIMES64[i]) return true;
            return false;
        };
        const isCircular = p => {
            const s = String(p);
            // 1234 -> 2341 3412 4123
            for (let i = 1; i < s.length; i++) {
                if (!isPrime(Number(s.substring(i) + s.substring(0, i)))) return false;
            }
            return true;
        };
        let counter = 0;
        for (const p of PRIMES64) {
            if (isCircular(p)) {
                println("p = " + p);
                counter++;
            }
        }
        println("counter = " + counter);
    };

    P[36] = () => {
        let sum = 0;
        for (let i = 1; i < 1000000; i++) {
            if (isPalindrome(String(i)) && isPalindrome(i.toString(2))) {
                println("palindrome " + i + " = " + i.toString(2));
                sum += i;
            }
        }
        println("sum = " + sum);
    };

    P[41] = () => {
        // pandigital: uses each of the digits 1 to n once, where n is the number of digits
        const isPanDigital = l => {
            const s = String(l);
            for (let i = 0; i < s.length; i++) {
                const digit = s.charCodeAt(i) - 48;
                if (digit < 1 || digit > s.length) return false;
                for (let j = i + 1; j < s.length; j++) {
                    if (s.charCodeAt(j) - 48 === digit) return false;
                }
            }
            return true;
        };
        // 8- and 9-digit pandigitals have digit sums 36 and 45, so they are all divisible by 3
        for (let i = 7654321; i > 1; i--) {
            if (i % 2 === 0 || i % 3 === 0 || i % 5 === 0 || i % 7 === 0 || i % 11 === 0 || i % 13 === 0 ||
                i % 17 === 0 || i % 19 === 0 || i % 23 === 0 || i % 29 === 0) continue;
            if (!isPanDigital(i)) continue;
            if (isProbablePrime(i)) {
                println("OLE! bi = " + i);
                break;
            }
        }
    };

    P[44] = () => {
        const N = 5000;
        const pents = new Array(N);
        const ht = new Set();
        for (let i = 0; i < N; i++) {
            const p = (i * (3 * i - 1)) / 2;
            pents[i] = p;
            if (p > 0) ht.add(p);
        }
        for (let i = 1; i < N; i++) {
            const p1 = pents[i];
            for (let j = i; j < N; j++) {
                const p2 = pents[j];
                const sum = p1 + p2;
                const diff = p1 > p2 ? p1 - p2 : p2 - p1;
                if (ht.has(diff) && ht.has(sum)) {
                    println("p1 = " + p1 + " p2 = " + p2);
                    println("diff = " + diff);
                }
            }
        }
    };

    P[45] = () => {
        const N = 100001;
        for (let j = 1; j < N; j++) {
            const p = (j * (3 * j - 1)) / 2;
            for (let k = 1; k < N; k++) {
                const h = k * (2 * k - 1);
                if (h > p) break;
                if (p === h) {
                    println("GOTCHA " + p + " p = " + j + " h = " + k);
                    if (p > 40755) return;
                }
            }
        }
    };

    P[48] = () => {
        let sum = 0n;
        for (let i = 1n; i <= 1000n; i++) sum += i ** i;
        println("last ten digits = " + lastTenDigits(sum));
    };

    P[49] = () => {
        const satisfy = (a, b, c) => {
            if (a === b || b === c || a === c) return false;
            if (a - b !== b - c) return false;
            const sorted = x => String(x).split("").sort().join("");
            return sorted(a) === sorted(b) && sorted(b) === sorted(c);
        };
        const a = PRIMES64.filter(p => String(p).length === 4);
        for (let i = 0; i < a.length - 2; i++) {
            for (let j = i; j < a.length - 1; j++) {
                for (let k = j; k < a.length; k++) {
                    if (satisfy(a[i], a[j], a[k])) println(a[i] + " " + a[j] + " " + a[k]);
                }
            }
        }
    };

    P[50] = () => {
        let longest = 0, ppp = 0;
        // the longest sum of consecutive primes starting at PRIMES64[pointer] that is a prime below one million
        const findLongestSumStartingWith = pointer => {
            let localmax = 0, localppp = 0;
            let sum = PRIMES64[pointer];
            let num = 1;
            for (let counter = pointer + 1; counter < PRIMES64.length; counter++) {
                sum += PRIMES64[counter];
                if (sum >= 1000000) break;
                num++;
                if (isProbablePrime(sum)) {
                    localppp = sum;
                    localmax = num;
                }
            }
            return [localmax, localppp];
        };
        for (let i = 0; i < PRIMES64.length; i++) {
            const [candidate, prime] = findLongestSumStartingWith(i);
            if (candidate > longest) {
                longest = candidate;
                ppp = prime;
            }
        }
        println("longest = " + longest);
        println("ppp = " + ppp);
    };

    P[56] = () => {
        let max = 0;
        for (let i = 1n; i < 101n; i++) {
            for (let j = 1n; j < 101n; j++) {
                const ds = digitalSum(i ** j);
                if (ds > max) max = ds;
            }
        }
        println("max = " + max);
    };

    P[97] = () => {
        // Only the last ten digits are needed, so work modulo 10^10 by squaring and multiplying,
        // instead of building the 2.4-million-digit number (which Safari refuses to make)
        const MOD = 10000000000n;
        let power = 1n, base = 2n;
        for (let e = 7830457; e > 0; e = Math.floor(e / 2)) {
            if (e % 2 === 1) power = power * base % MOD;
            base = base * base % MOD;
        }
        println("last ten digits = " + lastTenDigits(28433n * power + 1n));
    };

    return P;
}

// Util.msToReadableTime
function msToReadableTime(ms) {
    ms = Math.round(ms);
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    if (h === 0 && m === 0 && s === 0) return ms === 0 ? "negligible" : ms + "ms";
    return [h > 0 ? h + "h" : "", m > 0 ? m + "m" : "", s > 0 ? s + "s" : ""].filter(Boolean).join(" ");
}

if (typeof module !== "undefined") module.exports = { PROBLEMS, eulerSolutions, msToReadableTime };

// ---- UI ----

if (typeof document !== "undefined") {
    const workerSource = `const eulerSolutions = ${eulerSolutions.toString()};
let P = null;
onmessage = e => {
    const { n, names } = e.data;
    const println = line => postMessage({ line: String(line) });
    if (P === null) P = eulerSolutions(println, names);
    const start = performance.now();
    try {
        P[n]();
    } catch (err) {
        println(String(err));
    }
    postMessage({ done: true, ms: performance.now() - start });
};`;
    const workerUrl = URL.createObjectURL(new Blob([workerSource], { type: "text/javascript" }));
    let worker = null;
    const queue = [];
    let running = null;

    const list = document.getElementById("problems");
    const rows = new Map();
    for (const p of PROBLEMS) {
        const li = document.createElement("li");
        li.innerHTML = `
            <div class="head">
                <button class="run">Run</button>
                <a class="title" href="https://projecteuler.net/problem=${p.n}">Problem ${p.n}: ${p.title}</a>
                <span class="file">${p.file}</span>
            </div>
            <p class="text"></p>
            ${p.note ? `<p class="note"></p>` : ""}
            <pre class="output" hidden></pre>`;
        li.querySelector(".text").textContent = p.text;
        if (p.note) li.querySelector(".note").textContent = p.note;
        li.querySelector(".run").addEventListener("click", () => enqueue(p.n));
        list.append(li);
        rows.set(p.n, li);
    }

    function enqueue(n) {
        if (running === n || queue.includes(n)) return;
        const li = rows.get(n);
        const out = li.querySelector(".output");
        out.hidden = false;
        out.textContent = "Waiting...";
        li.querySelector(".run").disabled = true;
        queue.push(n);
        next();
    }

    function next() {
        if (running !== null || queue.length === 0) return;
        running = queue.shift();
        const li = rows.get(running);
        const out = li.querySelector(".output");
        out.textContent = "Running...";
        if (worker === null) worker = new Worker(workerUrl);
        worker.onmessage = makeHandler(li, out, []);
        worker.postMessage({ n: running, names: NAMES });
    }

    function makeHandler(li, out, lines) {
        return e => {
            if (e.data.line !== undefined) {
                lines.push(e.data.line);
                return;
            }
            // show at most the last 40 lines of output
            const shown = lines.length > 40 ? [`... (${lines.length - 40} more lines)`, ...lines.slice(-40)] : lines;
            out.textContent = shown.join("\n") + `\n\ntime: ${msToReadableTime(e.data.ms)}`;
            li.querySelector(".run").disabled = false;
            running = null;
            next();
        };
    }

    document.getElementById("run-all").addEventListener("click", () => PROBLEMS.forEach(p => enqueue(p.n)));
}
