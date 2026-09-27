/**
 * Created by mihailod, Mar 9, 2009, 9:08:38 PM
 *
 * What is the smallest number divisible by each of the numbers 1 to 20?
 */
public class Problem5 {
    public static void main(final String[] args) {
        long num = 20;
        while(true) {
            if (divisible(num)) {
                System.out.println("num = " + num);
                break;
            }
            num += 20;
        }
    }

    private static boolean divisible(long num) {
        for (int i=2; i<20; i++) {
            if (num % i != 0) {
                return false;
            }
        }
        return true;
    }
}
