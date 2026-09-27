/**
 * Created by mihailod, Mar 9, 2009, 8:57:51 PM
 *
 * Find the sum of all the multiples of 3 or 5 below 1000.
 *
 */
public class Problem1 {
    public static void main(final String[] args) {
        long sum = 0;
        for (int i=3; i<1000; i++) {
            if (i % 3 == 0 || i % 5 == 0) {
                sum += i;
            }
        }
        System.out.println("sum = " + sum);
    }
}
