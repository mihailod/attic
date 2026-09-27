import java.math.BigInteger;

/**
 * Created by mihailod, Mar 9, 2009, 9:17:01 PM
 *
 * Each new term in the Fibonacci sequence is generated
 * by adding the previous two terms. By starting with 1 and 2, the first 10 terms will be:
 *
     1, 2, 3, 5, 8, 13, 21, 34, 55, 89, ...

   Find the sum of all the even-valued terms in the sequence
   which do not exceed four million.


 problem 25: What is the first term in the Fibonacci sequence to contain 1000 digits?
 */
public class Problem2 {

    private final static BigInteger TWO = BigInteger.ONE.add(BigInteger.ONE);

    public static void main(final String[] args) {
        int termNumber = 1;
        BigInteger a = BigInteger.ONE;
        BigInteger b = BigInteger.ONE;
        BigInteger sum = BigInteger.ZERO;
        while (true) {

            if(a.toString().length() == 1000) {
                System.out.println("a = " + a);
                System.out.println("termNumber = " + (termNumber - 1));
                break;
            }

            //System.out.print(a + " ");
            //System.out.println(b + " ");

            /*if (b.compareTo(BigInteger.valueOf(4000000)) > 0) {
                System.out.println("sum = " + sum);
                break;
            }
            if (a.mod(TWO).compareTo(BigInteger.ZERO) == 0) {
                sum = sum.add(a);
            }
            if (b.mod(TWO).compareTo(BigInteger.ZERO) == 0) {
                sum = sum.add(b);
            }*/

            BigInteger oldb = b;
            a = a.add(b);
            b = a.add(oldb);
            termNumber +=2;
        }
    }
}
