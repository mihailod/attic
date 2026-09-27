// The notebook: my code from src/pascal.txt and src/budimac.txt, split into cells, unchanged
// (only the exercise numbers moved into the cell labels, and the indentation before them removed).
// "tryit" lines, notes and fixes are new.

const NOTEBOOK = [
    { file: "pascal.txt", date: "December 28, 2011" },
    {
        label: "Pascal's triangle",
        code: `(defun pascal (r c)
 (cond ((= c 0) 1)
       ((= c r) 1)
       (t (+ (pascal (- r 1) (- c 1))
             (pascal (- r 1) c)))))`,
        tryit: `(pascal 4 2)
(mapcar (lambda (c) (pascal 6 c)) '(0 1 2 3 4 5 6))`,
        note: `Only works inside the triangle, for 0 ≤ c ≤ r: <code>(pascal 2 3)</code> never reaches either base case and recurses until the stack runs out. The fix returns 0 outside the triangle.`,
        fix: `(defun pascal (r c)
 (cond ((or (< c 0) (> c r)) 0)
       ((= c 0) 1)
       ((= c r) 1)
       (t (+ (pascal (- r 1) (- c 1))
             (pascal (- r 1) c)))))`,
    },
    {
        label: "Higher-order sum",
        code: `(defun sum (fun a b)
         (if (> a b)
         0
         (+ (funcall fun a) (sum fun (+ a 1) b))))

(defun square (x) (* x x))
(sum #'square 4 6)
(sum #'+ 4 6)`,
        tryit: `(sum (lambda (x) (* x x x)) 1 10)`,
    },
    {
        label: "Even numbers",
        code: `(defun evens (nums)
         (cond ((eq nums nil) nil)
               ((= (rem (car nums) 2) 0) (cons (car nums) (evens (cdr nums))))
               (T (evens (cdr nums)))))`,
        tryit: `(evens '(1 2 3 4 5 6 7 8 9 10))`,
    },
    {
        label: "Same first and last letter",
        code: `(defun firstchar (string) (subseq string 0 1))
(defun lastchar (s) (subseq s (- (length s) 1) (length s)))
(remove-if (lambda (l) (not (equal (firstchar l) (lastchar l)))) '("california" "alaska" "arkanzas"))`,
        tryit: `(lastchar "lisp")`,
    },
    {
        label: "Closures",
        code: `(defun multiplier (n) (lambda (x) (* x n)))
(defun square (n) (funcall (multiplier n) n))

(defun make-adder (num) (lambda (x) (+ x num)))
(defun add3 (x) (funcall (make-adder 3) x))`,
        tryit: `(funcall (multiplier 3) 5)
(square 9)
(add3 4)
(mapcar (make-adder 10) '(1 2 3))`,
    },
    {
        label: "Compose",
        code: `(defun compose (f g x) (funcall f (funcall g x)))
(compose (function sqrt) (function sqrt) 81)
(defun secundo (l) (compose (function car) (function cdr) l))`,
        tryit: `(secundo '(a b c))`,
    },
    {
        label: "Insertion sort",
        code: `(defun insertonce (x l)
      (cond ((eq nil l) (list x))
            ((> (car l) x) (cons x l))
            (T (cons (car l) (insertonce x (cdr l))))))
(defun insertionsort (l)
         (if (eq nil l)
           nil
           (insertonce (car l) (insertionsort (cdr l)))))`,
        tryit: `(insertionsort '(5 2 9 1 5 6))`,
    },

    { file: "budimac.txt", date: "January 22, 2012",
      intro: `The numbered exercises follow a Lisp textbook by <a href="https://plus.cobiss.net/cobiss/cg/cnr_latn/data/cobib/50749959">Budimac et al.</a>; the others follow Henderson's <i>Functional Programming</i> and Abelson and Sussman's <i>Structure and Interpretation of Computer Programs</i>.` },
    { label: "1.1.1", code: `(defun add1 (x) (+ 1 x))`, tryit: `(add1 41)` },
    { label: "1.1.2", code: `(defun odd (n) (eq (mod n '2) '1))`, tryit: `(odd 7)\n(odd 10)` },
    {
        label: "1.1.3",
        code: `(defun lessthan (x y) (and (< x y) (neq x y)))

(defun lazylessthan (x y) (if (<= x y)
                          (if (neq x y) 'T 'F) 'F))`,
        tryit: `(lessthan 1 2)
(lazylessthan 1 2)
(if (lazylessthan 2 1) 'yes 'no)`,
        note: `<code>neq</code> isn't Common Lisp, so both functions fail when they get to it; for numbers, not-equal is <code>/=</code>. And <code>lazylessthan</code> answers <code>'F</code> for false, but in Lisp only <code>NIL</code> is false: <code>F</code> is just a symbol, so <code>if</code> takes it as true.`,
        fix: `(defun lessthan (x y) (and (< x y) (/= x y)))

(defun lazylessthan (x y) (if (<= x y)
                          (if (/= x y) 'T NIL) NIL))`,
    },
    { label: "1.1.4", code: `(defun circle (r) (* 2 r pi))`, tryit: `(circle 1)` },
    {
        label: "1.2.1",
        code: `(defun fact (n) (if (= n 1) 1 (* n (fact (- n 1)))))`,
        tryit: `(fact 5)
(fact 30)
(fact 0)`,
        note: `<code>(fact 0)</code> should be 1, but 0 never reaches the base case n = 1: it counts down past it, −1, −2, …, until the stack runs out.`,
        fix: `(defun fact (n) (if (<= n 1) 1 (* n (fact (- n 1)))))`,
    },
    { label: "4.1.1", code: `(defun twice (fn arg) (funcall fn (funcall fn arg)))`, tryit: `(twice (lambda (x) (* x 10)) 5)` },
    {
        label: "4.1.2",
        code: `(defun add1 (x) (+ x 1))
(defun add2 (x) (twice (function add1) x))`,
        tryit: `(add2 5)`,
    },
    { label: "4.1.2", lead: "or, with lambda:", code: `(defun add2 (num) (twice (function (lambda (x) (+ x 1))) num))`, tryit: `(add2 5)` },
    { label: "4.1.2", lead: "or:", code: `(defun add2 (num) (twice  #'(lambda (x) (+ x 1)) num))`, tryit: `(add2 5)` },
    {
        label: "4.1.3",
        code: `(defun square (x) (* x x))
(defun power4 (x) (twice (function square) x))`,
        tryit: `(power4 3)`,
    },

    { section: "HENDERSON" },
    {
        code: `;;; memoized sum and product

(defun sp (l s p)
    (if (eq l nil)
      (list s p)
      (sp (cdr l) (+ s (car l)) (* p (car l)))))`,
        tryit: `(sp '(1 2 3 4) 0 1)`,
        note: `Not memoized: <code>s</code> and <code>p</code> are accumulators that carry the sum and product so far, which makes every call a tail call. (Memoizing means remembering the answers of earlier calls.)`,
    },
    {
        code: `;;; invert a list

(defun invert (l)
    (if (eq l nil) nil
        (append (invert (cdr l)) (list (car l)))))`,
        tryit: `(invert '(1 2 3 4 5))`,
    },
    {
        code: `;;; memoized invert a list

(defun invertacc (l acc)
    (if (eq l nil) acc
        (invertacc (cdr l) (append (list (car l)) acc))))`,
        tryit: `(invertacc '(1 2 3 4 5) nil)`,
        note: `Again an accumulator rather than memoizing. It is what makes this version fast: <code>invert</code> appends to the end of the list at every step, which takes time proportional to n², while <code>(append (list (car l)) acc)</code> is simply <code>(cons (car l) acc)</code>.`,
    },

    { section: "SUSSMAN" },
    {
        code: `(defun sqrt-iter (guess x)
    (if (good-enough-p guess x)
      guess
      (sqrt-iter (improve guess x) x)))
(defun good-enough-p (guess x)
      (< (abs (- (* guess guess) x)) 0.001))
(defun improve (guess x)
      (/ (+ guess (/ x guess)) 2))`,
        tryit: `(sqrt-iter 1.0 2)
(sqrt-iter 1 2)`,
        note: `Starting from the whole number 1, Common Lisp calculates with exact fractions, so the answer comes out as 577/408.`,
    },
    {
        code: `;; lexical scoping

(defun sqrt-iter (guess x)
    (defun good-enough-p ()
      (< (abs (- (* guess guess) x)) 0.001))
    (defun improve (guess)
      (/ (+ guess (/ x guess)) 2))
    (if (good-enough-p)
      guess
      (sqrt-iter (improve guess) x)))`,
        tryit: `(sqrt-iter 1.0 2)
(improve 1.0 2)`,
        note: `This is how SICP does it in Scheme, but in Common Lisp a <code>defun</code> inside a function still defines a global function. So calling this <code>sqrt-iter</code> replaces the global <code>good-enough-p</code> and <code>improve</code> of the version above, and <code>(improve 1.0 2)</code> no longer works. Common Lisp's local functions are <code>labels</code> (or <code>flet</code>). The fix uses <code>labels</code>; to see it leave the globals alone, Restart Lisp, then run the version above and the fixed one.`,
        fix: `;; lexical scoping

(defun sqrt-iter (guess x)
    (labels ((good-enough-p ()
               (< (abs (- (* guess guess) x)) 0.001))
             (improve (guess)
               (/ (+ guess (/ x guess)) 2)))
      (if (good-enough-p)
        guess
        (sqrt-iter (improve guess) x))))`,
    },
    {
        code: `;; church numerals

; zero is a function applied once
(defvar zero (lambda (f) (lambda (x) x)))

; one is a function applied twice
(defvar one  (lambda (f) (lambda (x) (funcall f x))))

; two is a function applied three times
(defvar two  (lambda (f) (lambda (x) (funcall f (funcall f x) ))))`,
        tryit: `(funcall (funcall zero #'1+) 0)
(funcall (funcall one #'1+) 0)
(funcall (funcall two #'1+) 0)`,
        note: `The comments are off by one: zero applies f no times, one once and two twice, as counting with <code>1+</code> shows. (<code>defvar</code> sets a variable only the first time; after editing these, use <code>defparameter</code> or Restart Lisp.)`,
    },
    {
        code: `; primeality with streams
(defun range (from to)
    (if (> from to)
      '()
      (cons from (range (+ from 1) to))))

(defun prime (n)
      (if (null (remove-if (lambda (x) (not (= (mod n x) 0))) (range 2 (- n 1))))
        T nil))`,
        tryit: `(remove-if-not #'prime (range 0 30))`,
        note: `This counts 0 and 1 as primes, because they have no divisors between 2 and n − 1 either. And it doesn't use streams: SICP's streams are lazy lists, computed only as far as needed, while <code>range</code> builds the whole list first.`,
        fix: `; primeality with streams
(defun range (from to)
    (if (> from to)
      '()
      (cons from (range (+ from 1) to))))

(defun prime (n)
      (if (and (> n 1) (null (remove-if (lambda (x) (not (= (mod n x) 0))) (range 2 (- n 1)))))
        T nil))`,
    },
];

// the two files as I left them
const ORIGINALS = {
    "pascal.txt": "(defun pascal (r c)\n (cond ((= c 0) 1)\n       ((= c r) 1)\n       (t (+ (pascal (- r 1) (- c 1))\n             (pascal (- r 1) c)))))\n\n (defun sum (fun a b)\n         (if (> a b)\n         0\n         (+ (funcall fun a) (sum fun (+ a 1) b)))) \n\n(defun square (x) (* x x))\n(sum #'square 4 6)\n(sum #'+ 4 6)\n\n(defun evens (nums)\n         (cond ((eq nums nil) nil)\n               ((= (rem (car nums) 2) 0) (cons (car nums) (evens (cdr nums))))\n               (T (evens (cdr nums))))) \n\n(defun firstchar (string) (subseq string 0 1))\n(defun lastchar (s) (subseq s (- (length s) 1) (length s)))\n(remove-if (lambda (l) (not (equal (firstchar l) (lastchar l)))) '(\"california\" \"alaska\" \"arkanzas\"))\n\n(defun multiplier (n) (lambda (x) (* x n)))\n(defun square (n) (funcall (multiplier n) n))\n\n(defun make-adder (num) (lambda (x) (+ x num)))\n(defun add3 (x) (funcall (make-adder 3) x))\n\n(defun compose (f g x) (funcall f (funcall g x)))\n(compose (function sqrt) (function sqrt) 81)\n(defun secundo (l) (compose (function car) (function cdr) l))\n\n(defun insertonce (x l)\n      (cond ((eq nil l) (list x))\n            ((> (car l) x) (cons x l))\n            (T (cons (car l) (insertonce x (cdr l)))))) \n(defun insertionsort (l)\n         (if (eq nil l)\n           nil\n           (insertonce (car l) (insertionsort (cdr l)))))",
    "budimac.txt": "1.1.1 (defun add1 (x) (+ 1 x))\n\n1.1.2 (defun odd (n) (eq (mod n '2) '1))\n\n1.1.3 (defun lessthan (x y) (and (< x y) (neq x y)))\n\n      (defun lazylessthan (x y) (if (<= x y)\n                                (if (neq x y) 'T 'F) 'F))\n\n1.1.4 (defun circle (r) (* 2 r pi))\n\n1.2.1 (defun fact (n) (if (= n 1) 1 (* n (fact (- n 1)))))\n\n4.1.1 (defun twice (fn arg) (funcall fn (funcall fn arg)))\n\n4.1.2 (defun add1 (x) (+ x 1))\n      (defun add2 (x) (twice (function add1) x))\n\n      or, with lambda:\n      (defun add2 (num) (twice (function (lambda (x) (+ x 1))) num))\n      or:\n      (defun add2 (num) (twice  #'(lambda (x) (+ x 1)) num))\n\n4.1.3 (defun square (x) (* x x))\n      (defun power4 (x) (twice (function square) x))\n\n\nHENDERSON\n\n;;; memoized sum and product\n\n(defun sp (l s p)\n    (if (eq l nil)\n      (list s p)\n      (sp (cdr l) (+ s (car l)) (* p (car l)))))\n\n;;; invert a list\n\n(defun invert (l)\n    (if (eq l nil) nil\n        (append (invert (cdr l)) (list (car l)))))\n\n;;; memoized invert a list\n\n(defun invertacc (l acc)\n    (if (eq l nil) acc\n        (invertacc (cdr l) (append (list (car l)) acc))))\n\n;;; SUSSMAN\n\n(defun sqrt-iter (guess x)\n    (if (good-enough-p guess x)\n      guess\n      (sqrt-iter (improve guess x) x)))\n(defun good-enough-p (guess x)\n      (< (abs (- (* guess guess) x)) 0.001))\n(defun improve (guess x)\n      (/ (+ guess (/ x guess)) 2))\n\n;; lexical scoping\n\n(defun sqrt-iter (guess x)\n    (defun good-enough-p ()\n      (< (abs (- (* guess guess) x)) 0.001))\n    (defun improve (guess)\n      (/ (+ guess (/ x guess)) 2))\n    (if (good-enough-p)\n      guess\n      (sqrt-iter (improve guess) x)))\n\n;; church numerals\n\n; zero is a function applied once\n(defvar zero (lambda (f) (lambda (x) x)))\n\n; one is a function applied twice\n(defvar one  (lambda (f) (lambda (x) (funcall f x))))\n\n; two is a function applied three times\n(defvar two  (lambda (f) (lambda (x) (funcall f (funcall f x) ))))\n\n; primeality with streams\n(defun range (from to)\n    (if (> from to)\n      '()\n      (cons from (range (+ from 1) to))))\n\n(defun prime (n)\n      (if (null (remove-if (lambda (x) (not (= (mod n x) 0))) (range 2 (- n 1))))\n        T nil))"
};
