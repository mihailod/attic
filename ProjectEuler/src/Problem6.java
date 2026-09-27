/**
 * Created by mihailod, Mar 9, 2009, 9:26:49 PM
 *
 * Find the difference between the sum of the squares
 * of the first one hundred natural numbers and the square of the sum.
 */
public class Problem6 {
    public static void main(final String[] args) {
        int sum = 0;
        int sumOfSquares = 0;
        for (int i=1; i<=100; i++) {
            sum += i;
            sumOfSquares += i * i;
        }
        System.out.println("sum = " + sum);
        long squareOfSum = sum * sum;
        System.out.println("squareOfSum = " + squareOfSum);
        System.out.println("sumOfSquares = " + sumOfSquares);
        long diff = squareOfSum - sumOfSquares;
        System.out.println("diff = " + diff);
    }
}
