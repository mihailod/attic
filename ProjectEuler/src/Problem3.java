import java.math.BigInteger;

/**
 * Created by mihailod, Mar 9, 2009, 9:32:48 PM
 *
 * What is the largest prime factor of the number 600851475143 ?
 */
public class Problem3 {
    public static void main(final String[] args) {
        for (long i = 3; i < 600851475143l; i++) {
            if ((600851475143l % i == 0) && PrimeTest.isPrimeNaive(new BigInteger("" + i))) {
                System.out.println(" *** factor i = " + i);
            }
        }
    }
}
