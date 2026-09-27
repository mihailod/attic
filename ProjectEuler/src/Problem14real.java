import java.util.ArrayList;

/**
 * Created by mihailod, Mar 10, 2009, 8:13:43 PM
 */
public class Problem14real {
    public static void main(final String[] args) {
        int max = 0;
        int index = 0;
        for (int i=1; i<=1000000; i++) {
            if (i % 50000 == 0) {
                System.out.println("i = " + i);
            }
            int len = makeSequence(i).size();
            if (len > max) {
                max = len;
                index = i;
            }
        }
        System.out.println("max = " + max);
        System.out.println("index = " + index);
    }

    private static ArrayList makeSequence(long n) {
        ArrayList<Long> al = new ArrayList<Long>();
        while (true) {
            al.add(n);
            if (n == 1) {
                break;
            } else if (n % 2 == 0) {
                n = n/2;
            } else {
                n = 3*n + 1;
            }
        }
        //System.out.println("al = " + al);
        return al;
    }
}
