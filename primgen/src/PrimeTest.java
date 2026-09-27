import com.mihailod.crypto.rsa.Util;

import java.math.BigInteger;

/**
 * Created by mihailod, 24.05.2008., 11.20.02
 */
public class PrimeTest {

    private static BigInteger ZERO = BigInteger.ZERO;
    private static BigInteger ONE = BigInteger.ONE;
    private static BigInteger TWO = ONE.add(ONE);
    private static BigInteger SIX = TWO.add(TWO).add(TWO);
    private static BigInteger MILLION = new BigInteger("1000000");

    public static boolean isPrimeNaive(final BigInteger n) {
        long start = System.currentTimeMillis();

        for(final BigInteger p : PrimeNumbers.PRIMES) {
            final BigInteger dr[] = n.divideAndRemainder(p);
            if(dr[1].compareTo(ZERO) == 0 && n.compareTo(p) != 0) {
                Util.p("\n" + n + " is not prime!");
                Util.p("divide it by precomputed " + p + " and you get " + dr[0] + " and remainder " + dr[1]);
                return false;
            }
        }
        Util.p("Sanity check took " + Util.msToReadableTime(System.currentTimeMillis() - start));

        start = System.currentTimeMillis();

        float percentPrev = 0;
        float percent;

        long msPrev = start;
        long ms;

        final BigInteger sqrt = TWO.pow(n.bitLength() / 2);
        BigInteger feedbackGranularity = MILLION; // try this first, increase if too small

        BigInteger firstToTest = new BigInteger((PrimeNumbers.PRIMES[PrimeNumbers.PRIMES.length - 1].add(TWO)).toString());
        BigInteger k = firstToTest.divide(SIX);

        for(;;) {

            if(k.compareTo(sqrt) > 0) {
                break;
            }

            final BigInteger prev = k.subtract(ONE);
            final BigInteger next = prev.add(TWO);

            BigInteger[] dr = n.divideAndRemainder(prev);
            if(dr[1].compareTo(ZERO) == 0) {
                Util.p("\n" + n + " is not prime!");
                Util.p("divide it by " + prev + " and you get " + dr[0] + " and remainder " + dr[1]);
                return false;
            }
            dr = n.divideAndRemainder(next);
            if(dr[1].compareTo(ZERO) == 0) {
                Util.p("\n" + n + " is not prime!");
                Util.p("divide it by " + prev + " and you get " + dr[0] + " and remainder " + dr[1]);
                return false;
            }

            k = k.add(SIX);

            if(k.divideAndRemainder(feedbackGranularity)[1].intValue() < SIX.intValue()) {
                percent = k.floatValue() * 100 / sqrt.floatValue();
                ms = System.currentTimeMillis();
                final double msDiff = System.currentTimeMillis() - msPrev;

                // let's estimate time remaining
                final double percentDiff = percent - percentPrev;
                final boolean estimateOK;
                if(percentDiff < 0.1) {
                    estimateOK = false;
                    feedbackGranularity = feedbackGranularity.multiply(TWO);
                } else {
                    estimateOK = true;
                }

                if(estimateOK) {
                    final double msForPercent = msDiff / percentDiff;
                    final double estimateTotal = msForPercent * 100;
                    final double estimateRemaininig = estimateTotal - msForPercent * percent;
                    Util.p(((int)(percent * 100)) / 100f + "% done, " + Util.msToReadableTime((long)estimateRemaininig) + " to go...");
                } else {
                    Util.p(percent + "% done, ETA unavailable yet...");
                }

                msPrev = ms;
                percentPrev = percent;
            }
        }
        Util.p("\n" + n + " is prime!");
        ms = System.currentTimeMillis() - start;
        Util.p(n.bitLength() + " bits, running time " + Util.msToReadableTime(ms));
        return true;
    }
}
