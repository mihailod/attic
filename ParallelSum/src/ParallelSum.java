/**
 * Created by mihailod, Jun 11, 2007, 8:42:00 PM
 */
public class ParallelSum {
    private static final int N = 1000000000;
    public static double[] A = new double[N];

    public static void main(String[] args) {
        init();
        long start = System.currentTimeMillis();
        double sum = 0;
        for(int i=0; i<N; i++) {
            sum += A[i];
        }
        long time = System.currentTimeMillis() - start;
        System.out.println("SERIAL sum = " + sum + " in " + time + "ms");
        System.out.println("--------------------------");

        start = System.currentTimeMillis();
        final Adder a1 = new Adder(0, N/2);
        final Adder a2 = new Adder(N/2, N);
        final Thread t1 = new Thread(a1);
        final Thread t2 = new Thread(a2);
        t1.start();
        t2.start();
        try {
            t1.join();
            t2.join();
        } catch(InterruptedException ie) {
            ie.printStackTrace();
        }
        time = System.currentTimeMillis() - start;
        System.out.println("PARALLEL sum = " + sum + " in " + time + "ms");
    }

    private static void init() {
        for(int i=0; i<N; i++) {
            A[i] = 1;
        }
    }
}
