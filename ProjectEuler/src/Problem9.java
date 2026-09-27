/**
 * Created by mihailod, Mar 9, 2009, 11:04:32 PM
 *
 * There exists exactly one Pythagorean triplet for which a + b + c = 1000.
Find the product abc.
 */
public class Problem9 {
    public static void main(final String[] args) {
        for (int a=0; a<1001; a++) {
            for (int b=1; b<1001; b++) {
                for (int c=1; c<1001; c++) {
                    if (a*a + b*b == c*c && a + b + c == 1000) {
                        System.out.println("abc = " + a * b * c);
                    }
                }
            }
        }
    }
}
