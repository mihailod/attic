import java.util.ArrayList;

/**
 * Created by mihailod, Mar 11, 2009, 9:14:18 AM
 *
 * The number, 197, is called a circular prime because all rotations
 *  of the digits: 197, 971, and 719, are themselves prime.

There are thirteen such primes below 100: 2, 3, 5, 7, 11, 13, 17, 31, 37, 71, 73, 79, and 97.

How many circular primes are there below one million?
 */
public class Problem35 {
    public static void main(final String[] args) {
        int counter = 0;
        for (int i = 0; i< PrimeNumbers.PRIMES64.length; i++) {
            long p = PrimeNumbers.PRIMES64[i];
            if (isCircular(p)) {
                System.out.println("p = " + p);
                counter++;
            }
        }
        System.out.println("counter = " + counter);
    }

    private static boolean isPrime(long p) {
        for (int i = 0; i< PrimeNumbers.PRIMES64.length; i++) {
            if (p == PrimeNumbers.PRIMES64[i]) {
                return true;
            }
        }
        return false;
    }

    private static boolean isCircular(long p) {
        String s = String.valueOf(p);
        // 1234 -> 2341 3412 4123
        for (int i=1; i<s.length(); i++) {
            String firstPart = s.substring(0, i);
            String secondPart = s.substring(i, s.length());
            String rot = secondPart + firstPart;
            long pp = Long.valueOf(rot);
            if (!isPrime(pp)) {
                return false;
            }
        }
        return true;
    }
}
