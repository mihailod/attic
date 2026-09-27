/**
 * Created by mihailod, Jun 11, 2007, 8:50:56 PM
 */
public class Adder implements Runnable {

    private int start;
    private int end;
    public double localSum = 0;

    public Adder(int start, int end) {
        this.start = start;
        this.end = end;
    }

    public void run() {
        for(int i=start; i<end; i++) {
            localSum += ParallelSum.A[i];
        }
    }
}
