package com.mihailod.crypto.math;

import java.math.BigInteger;
import static java.math.BigInteger.*;

/**
 * Created by mihailod, 05.06.2008., 22.39.25
 */
public class MathUtil {

   /**
    * Extended Euclid's algorithm solves a*u + b*v = gcd(a, b).
    * @param a parameter a
    * @param b parameter b
    * @return an array of three numbers: u, v and gcd(a, b)
    */
    public static BigInteger[] extendedEuclid(final BigInteger a, final BigInteger b) {
        if (b.compareTo(ZERO) == 0) {
            final BigInteger result[] = {ONE, ZERO, a};
            return result;
        }

        final BigInteger u = a;
        final BigInteger v = b;
        BigInteger x1, x2, x3, y1, y2, y3;

        if (u.compareTo(v) < 0) {
            x1 = ZERO; x2 = ONE; x3 = v;
            y1 = ONE; y2 = ZERO; y3 = u;
        } else {
            x1 = ONE; x2 = ZERO; x3 = u;
            y1 = ZERO; y2 = ONE; y3 = v;
        }

        while (y3.compareTo(ONE) > 0) {
            final BigInteger q = x3.divide(y3);
            final BigInteger t1 = x1.subtract(q.multiply(y1));
            final BigInteger t2 = x2.subtract(q.multiply(y2));
            final BigInteger t3 = x3.subtract(q.multiply(y3));

            x1 = y1; x2 = y2; x3 = y3;
            y1 = t1; y2 = t2; y3 = t3;
        }
        if (y3.compareTo(ZERO) == 0) {
            final BigInteger result[] = {x1, x2, x3};
            return result;
        } else {
            final BigInteger result[] = {y1, y2, y3};
            return result;
        }
    }
}
