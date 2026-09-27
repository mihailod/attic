import java.math.BigInteger;

/**
 * Created by mihailod, Mar 9, 2009, 10:10:41 PM
 *
 * Find the last ten digits of 1^1 + 2^2 + ... + 1000^1000.
 *
 * 97: 28433 * 2^(7830457+1)

Find the last ten digits of this prime number.
 */
public class Problem48 {
    public static void main(final String[] args) {
        /*BigInteger sum = BigInteger.ZERO;
        for (int i=1; i<=1000; i++) {
            BigInteger addition = (BigInteger.valueOf(i)).pow(i);
            sum = sum.add(addition);
        }
        System.out.println("sum = " + sum);*/

        // 97

        BigInteger a = BigInteger.valueOf(28433);
        BigInteger two = BigInteger.ONE.add(BigInteger.ONE);
        BigInteger power = two.pow(7830457+1);
        BigInteger result = a.multiply(power);
        System.out.println("result = " + result);

    }
}
