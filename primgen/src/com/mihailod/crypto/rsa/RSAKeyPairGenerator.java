package com.mihailod.crypto.rsa;

import java.math.BigInteger;
import static java.math.BigInteger.*;
import java.security.SecureRandom;

import com.mihailod.crypto.math.MathUtil;

/**
 * Created by mihailod, 01.06.2008., 12.06.52
 *
 * test data: p = 47, q = 71, e = 79 => d = 1019
 */
public class RSAKeyPairGenerator {

    public static RSAData generateKeys(final RSAData rsa) {

        // instantiate a random number generator
        final SecureRandom sr = new SecureRandom();
        sr.setSeed(System.currentTimeMillis());

        // calculate the public key
        Util.p("Calculating public key...");

        // obtain p and q and calculate n
        final BigInteger p = BigInteger.probablePrime(rsa.keyBits, sr);
        final BigInteger q = BigInteger.probablePrime(rsa.keyBits, sr);
        final BigInteger n = p.multiply(q);
        rsa.n = n;

        // calculate the private key
        Util.p("Calculating private key...");

        // find d such that e * d = 1 mod (p - 1)(q - 1)
        final BigInteger p1 = p.subtract(ONE);
        final BigInteger q1 = q.subtract(ONE);
        final BigInteger prod = p1.multiply(q1);
        // now need to solve ed = 1 (mod prod) i.e. d is inverse of e (mod prod)
        final BigInteger d = findInverse(RSAData.e, prod);
        rsa.d = d;

        return rsa;
    }

    private static BigInteger findInverse(final BigInteger e, final BigInteger prod) {
        // need to solve e * d = 1 (mod prod)
        // now, the extended Euclid's algorithm solves a * u + b * v = gcd(a, b)
        // which means a = e and b = 0 = prod (mod prod)
        // and gcd(a, b) = 1 since e and prod are relatively prime (since e is prime)
        //   (I think this is the only way the algorithm can know about the value prod, seems to work)
        // so the formula becomes: e * u + prod * b = 1 (mod prod)
        // and we need to invoke the algorithm with e and prod as the inputs a and b
        // and the result will be u, which is the first element of the return array
        final BigInteger[] result = MathUtil.extendedEuclid(e, prod);
        BigInteger d = result[0];
        if(d.compareTo(ZERO) < 0) {
            d = d.add(prod);
        }

        //Util.p("inverse of " + e + " is " + d + " mod " + prod);
        //Util.p("  because " + e + " * " + d + " = " + e.multiply(d));
        //Util.p("  and then " + e.multiply(d) + " - 1 = " + e.multiply(d).subtract(ONE));
        //Util.p("  and then " + e.multiply(d).subtract(ONE) + " / " + prod + " = " + e.multiply(d).subtract(ONE).divide(prod));

        return d;
    }
}
