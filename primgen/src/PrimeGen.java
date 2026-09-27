import com.mihailod.crypto.rsa.Util;

import java.util.Random;
import java.math.BigInteger;

/**
 * Created by mihailod, 23.05.2008., 23.54.37
 */
public class PrimeGen {

    private static final int NUM = 100;
    private static final int BITS = 12;
    private static final Random r;
    static {
        r = new Random(System.currentTimeMillis());
        PrimeNumbers.init();
    }

    public static void main(final String[] args) {
        //primGen64Bit();
        for(int i=0; i<NUM; i++) {
            new Thread() {
                public void run() {
                    final long start = System.currentTimeMillis();
                    final BigInteger candidate = BigInteger.probablePrime(BITS, r);
                    Util.p("Testing " + candidate);
                    final long ms = System.currentTimeMillis() - start;
                    //p(candidate.toString() + " in " + ms + " ms" + " by " + Thread.currentThread().getId());
                    PrimeTest.isPrimeNaive(candidate);
                }
            }.start();
        }
    }

    // big numbers methods

    private static BigInteger findOneCandidate() {
        for(int i=0; i<5; i++) {
            final BigInteger candidate = new BigInteger(BITS, r);
            System.out.println(candidate);
        }
        return BigInteger.ZERO;
    }

    // 64-bit methods (actually, 63 bits since it's java!)

    private static void primGen64Bit() {
        for(int i=0; i<NUM; i++) {
            final long start = System.currentTimeMillis();
            final long candidate = findOneCandiate64Bit();
            final long ms = System.currentTimeMillis() - start;
            Util.p(candidate + " [" + ms + " ms]");
        }
    }

    private static long findOneCandiate64Bit() {
        for(;;) {
            long candidate = r.nextLong();
            if(candidate < 0) {
                candidate &= 0x7FFFFFFFFFFFFFFFL;
            }
            candidate |= 0x1;
            candidate |= 0x4000000000000000L;
            final int smallDivisor = findSmallDivisor64(candidate);
            if(smallDivisor == 0) {
                return candidate;
            }
        }
    }

    // utility methods

    private static int findSmallDivisor64(final long l) {
        for(final int prime : PrimeNumbers.PRIMES64) {
            if(l % prime == 0) {
                return prime;
            }
        }
        return 0;
    }
}
