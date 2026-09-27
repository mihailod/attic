import java.math.BigInteger;

/**
 * Created by mihailod, Mar 10, 2009, 8:42:31 PM
 */
public class Problem12 {
    public static void main(final String[] args) {
        for (int i=1; i<1000000000; i++) {
            if (i % 10000 == 0) {
                System.out.println("i = " + i);
            }
            long num = generateTriangleNum(i);
            //System.out.print("num = " + num);
            int divisors = findDivisors(num);
            //System.out.println(" divisors = " + divisors);
            if (divisors > 500) {
                System.out.println("divisors = " + divisors);
                System.out.println("num = " + num);
                break;
            }
        }
    }

    private static int findDivisors(long n) {
        int divisors = 0;
        double maxdivdouble = Math.sqrt((double)n);
        int maxdivint = (int)maxdivdouble;
        for (int i=1; i<=maxdivint; i++) {
            if (n % i == 0) {
                divisors+=2;
            }
        }
        return divisors;
    }

    private static long generateTriangleNum(int n) {
        long num = 0;
        for (int i=1; i<=n; i++) {
            num += i;
        }
        return num;
    }
}
