import java.math.BigInteger;
import java.util.ArrayList;

/**
 * Created by mihailod, Mar 11, 2009, 9:14:03 PM
 *
 * The prime 41, can be written as the sum of six consecutive primes:

41 = 2 + 3 + 5 + 7 + 11 + 13
This is the longest sum of consecutive primes that adds to a prime below one-hundred.

The longest sum of consecutive primes below one-thousand
 that adds to a prime, contains 21 terms, and is equal to 953.

Which prime, below one-million, can be written as the sum of the most consecutive primes?
 */
public class Problem50 {

    private static int ppp = 0;
    private static int localmax = 0;

    private static int findlongestsumstartingwith(int pointer) {
        localmax = 0;
        ArrayList<Integer> al = new ArrayList<Integer>();
        int sum = PrimeNumbers.PRIMES64[pointer];
        al.add(sum);
        int num = 1;
        int counter = pointer + 1;
        while (true) {
            if(counter >  PrimeNumbers.PRIMES64.length - 2) {
                return localmax;
            }
            sum += PrimeNumbers.PRIMES64[counter];
            al.add(PrimeNumbers.PRIMES64[counter]);
            num++;
            BigInteger bi = BigInteger.valueOf(sum);
            if(bi.isProbablePrime(5)) {
                ppp = sum;
                localmax = num;
                //System.out.println("al = " + al);
                //System.out.println("ppp = " + ppp);
                //System.out.println("num = " + num);
                //return num;
            }
            counter++;
        }
    }

    public static void main(final String[] args) {
        int longest = 0;
        for (int i=0; i<10/*PrimeNumbers.PRIMES64.length*/; i++) {
            if (i % 50000 == 0) {
                System.out.println("i = " + i);
            }
            int candidate = findlongestsumstartingwith(i);
            System.out.println("candidate = " + candidate);
            if (candidate > longest) {
                longest = candidate;
            }
        }
        System.out.println("longest = " + longest);
        System.out.println("ppp = " + ppp);
    }

}
