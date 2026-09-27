import java.math.BigInteger;

/**
 * Created by mihailod, Mar 10, 2009, 9:08:18 PM
 *
 * Considering natural numbers of the form, a^b,
 * where a, b < 100, what is the maximum digital sum?
 */
public class Problem56 {
    public static void main(final String[] args) {
        int max = 0;
        for (int i=1; i<101; i++) {
            BigInteger a = BigInteger.valueOf(i);
            for (int j=1; j<101; j++) {
                BigInteger exp = a.pow(j);
                int ds = digitalSum(exp);
                if (ds > max) {
                    max = ds;
                }
            }
        }
        System.out.println("max = " + max);
    }

    private static int digitalSum(BigInteger bi) {
        String s = bi.toString();
        int sum = 0;
        for (int i=0; i<s.length(); i++) {
            sum += s.charAt(i) - '0';
        }
        return sum;
    }
}
