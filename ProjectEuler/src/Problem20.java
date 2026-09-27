import java.math.BigInteger;

/**
 * Created by mihailod, Mar 9, 2009, 10:05:11 PM
 *
 * Find the sum of the digits in the number 100!
 */
public class Problem20 {
    public static void main(final String[] args) {
        BigInteger fact = BigInteger.ONE;
        for (int i=1; i<=100; i++) {
            fact = fact.multiply(BigInteger.valueOf(i));
        }
        System.out.println("fact = " + fact);
        String factString = fact.toString();
        int sum = 0;
        for (int i=0; i<factString.length(); i++) {
            sum += factString.charAt(i) - '0';
        }
        System.out.println("sum = " + sum);
    }
}
