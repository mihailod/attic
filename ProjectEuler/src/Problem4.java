/**
 * Created by mihailod, Mar 9, 2009, 10:49:56 PM
 *
 * Find the largest palindrome made from the product of two 3-digit numbers.
 *
 * Problem 36:
 * Find the sum of all numbers less than one million,
 * which are palindromic in base 10 and base 2.
 */
public class Problem4 {

    public static void main(final String[] args) {
        int sum = 0;
        for(int i=1; i<1000000; i++) {
            String base10 = String.valueOf(i);
            String base2 = Integer.toString(i, 2);
            if (isPalindrome(base10) && isPalindrome(base2)) {
                sum += i;
            }
        }
        System.out.println("sum = " + sum);
    }

    public static void main1(final String[] args) {
        int max = 0;
        for(int i=100; i<1000; i++) {
            for(int j=100; j<1000; j++) {
                int prod = i * j;
                if(isPalindrome(String.valueOf(prod)) && prod > max) {
                    max = prod;
                }
            }
        }
        System.out.println("max = " + max);
    }

    public static boolean isPalindrome(String s) {
        for(int i=0; i<s.length() / 2; i++) {
            if(s.charAt(i) != s.charAt(s.length() - 1 - i)) {
                return false;
            }
        }
        System.out.println("palindrome s = " + s);
        return true;
    }
}
