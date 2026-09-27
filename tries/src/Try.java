/**
 * Created by mihailod, 03.06.2008., 09.27.56
 */
public class Try {
    public static void main(final String[] args) {
        double p = 0.01;
        double cutoff = 0.8;

        double res = 0;
        int i = 0;
        while(res <  cutoff) {
            res += p * Math.pow((1 - p), i);
            System.out.println("After " + (i+1) + " tries, p = " + res);
            i++;
        }
    }
}
