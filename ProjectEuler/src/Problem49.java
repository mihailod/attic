import java.util.ArrayList;
import java.util.Arrays;

/**
 * Created by mihailod, Mar 11, 2009, 8:43:35 PM
 *
 * The arithmetic sequence, 1487, 4817, 8147,
 *  in which each of the terms increases by 3330,
 *  is unusual in two ways:
 *  (i) each of the three terms are prime, and,
 *  (ii) each of the 4-digit numbers are permutations of one another.

There are no arithmetic sequences made up of three 1-, 2-, or 3-digit primes,
 exhibiting this property, but there is one other 4-digit increasing sequence.

What 12-digit number do you form by concatenating the three terms in this sequence?
 */
public class Problem49 {
    public static void main(final String[] args) {
    }

    private static boolean satisfy(int a, int b, int c) {
        if (a == b || b == c || a == c) {
            return false;
        }
        if (a - b != b - c) {
            return false;
        }
        String as = String.valueOf(a);
        String bs = String.valueOf(b);
        String cs = String.valueOf(c);
        int aa[] = new int[4];
        int ba[] = new int[4];
        int ca[] = new int[4];
        for (int i=0; i<4; i++) {
            aa[i] = as.charAt(i) - '0';
            ba[i] = bs.charAt(i) - '0';
            ca[i] = cs.charAt(i) - '0';
        }
        Arrays.sort(aa);
        Arrays.sort(ba);
        Arrays.sort(ca);
        for (int i=0; i<4; i++) {
            if (!(aa[i] == ba[i] && ba[i] == ca[i])) {
                return false;
            }
        }
        return true;

    }

    private static ArrayList<Integer> a = new ArrayList<Integer>();

    static {
        for (int i=0; i<PrimeNumbers.PRIMES64.length; i++) {
            int p = PrimeNumbers.PRIMES64[i];
            if (String.valueOf(p).length() == 4) {
                a.add(p);
            }
        }
        //System.out.println("a = " + a);

        for (int i=0; i<a.size() - 2; i++) {
            int p1 = a.get(i);
            for (int j=i; j<a.size() - 1; j++) {
                int p2 = a.get(j);
                for (int k=j; k<a.size(); k++) {
                    int p3 = a.get(k);
                    if(satisfy(p1, p2, p3)) {
                        System.out.print(p1);
                        System.out.print(" " + p2);
                        System.out.println(" " + p3);
                    }
                }
            }
        }
    }
}
