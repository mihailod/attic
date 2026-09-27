import java.math.BigInteger;

/**
 * Created by mihailod, Mar 9, 2009, 9:45:57 PM
 *
 * Find the 10001st prime.
 *
 *
 * problem 10: Find the sum of all the primes below two million.
 *
 * problem 16: What is the sum of the digits of the number 2^1000?
 */
public class Problem7 {
    public static void main7(final String[] args) {
        System.out.println(PrimeNumbers.PRIMES[10000]);

    }
// false answer 987654103
    public static void mainpan(final String[] args) {
        long ms = System.currentTimeMillis();
        for (long i=2143; i>1; i--) {
            if (i % 10000000 == 0) {
                System.out.print("i = " + i);
                long took = System.currentTimeMillis() - ms;
                ms = System.currentTimeMillis();
                System.out.println(" took = " + took);
            }

            /**
             * 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97,
             */
            if (i % 2 == 0 || i % 3 == 0 || i % 5 ==0 || i % 7 == 0 || i % 11 == 0 || i % 13 ==0 ||
                    i % 17 == 0 || i % 19 == 0 || i % 23 ==0 || i % 29 == 0) {
                continue;
            }

            if (!isPanDigital(i)) {
                continue;
            }
            /*if (!PrimeTest.isPrimeSuperNaive(i)) {
                continue;
            }*/
            final BigInteger bi = BigInteger.valueOf(i);
            if (bi.isProbablePrime(5)) {
                System.out.println("OLE! bi = " + bi);
                //break;
            }
        }
    }

    private static boolean isPanDigital(final long l) {
        final String s = String.valueOf(l);
        final int len = s.length();
        for (int i=0; i<len; i++) {
            final int digit = s.charAt(i) - '0';
            if(digit > s.length() - 1) {
                return false;
            }
            final int start = i+1;
            for (int j=start; j<len; j++) {
                final int d = s.charAt(j) - '0';
                if(digit == d) {
                    return false;
                }
            }
        }
        return true;
    }

    public static void main10(final String[] args) {
        long sum = 0;
        for(int i=2; i<2000000; i++) {
            if(i % 100000 == 0) {
                System.out.println("i = " + i);
            }
            BigInteger bi = BigInteger.valueOf(i);
            if(bi.isProbablePrime(5)) {
                sum += bi.longValue();
            }
        }
        System.out.println("sum = " + sum);
    }

    public static void main(final String[] args) {
        BigInteger b = BigInteger.ONE.add(BigInteger.ONE);
        b = b.pow(1000);
        System.out.println("b = " + b);
        String s = b.toString();
        int sum = 0;
        for(int i=0; i<s.length(); i++) {
            sum += s.charAt(i) - '0';
        }
        System.out.println("sum = " + sum);
    }
}
