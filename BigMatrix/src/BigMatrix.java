/**
 * User: mihailod, Apr 29, 2007, 8:43:32 AM
 */
public class BigMatrix {

    private static boolean parallel = true;
    public static boolean rowMajor = true;

    public static final int N = 6000;
    public static int[][] A = new int[N][N];
    public static int[][] B = new int[N][N];
    public static int[][] C = new int[N][N];

    public static void main(String[] arg) {
        init();
        if(parallel) {
            addParallel();
        } else {
            addSerial();
        }
    }

    private static void addSerial() {
        if(rowMajor) {
            addRowMajor();
        } else {
            addColMajor();
        }
    }

    private static void addParallel() {
        long startTime = System.currentTimeMillis();

        int cpus = Runtime.getRuntime().availableProcessors();
        int load = N / cpus;

        MatrixRowBasedAdder adders[] = new MatrixRowBasedAdder[cpus];
        Thread threads[] = new Thread[cpus];
        int start = 0;
        for(int i=0; i<cpus; i++) {
            adders[i] = new MatrixRowBasedAdder();
            threads[i] = new Thread(adders[i]);
            adders[i].start = start;
            start += load;
            adders[i].end = start;
        }

        for(Thread t : threads) {
            t.start();
        }

        for(Thread t : threads) {
            try {
                t.join(999999999);
                System.out.println("thread " + t + " done");
            } catch(InterruptedException ie) {
                ie.printStackTrace();
            }
        }

        System.out.println("Parallel time: " + (System.currentTimeMillis() - startTime) + "ms");
    }

    private static void addRowMajor() {
        long start = System.currentTimeMillis();
        for(int i=0; i<N; i++) {
            for(int j=0; j<N; j++) {
                C[i][j] = A[i][j] + B[i][j];
            }
        }
        System.out.println("Row major time:" + (System.currentTimeMillis() - start) + "ms");
    }

    private static void addColMajor() {
        long start = System.currentTimeMillis();
        for(int j=0; j<N; j++) {
            if(j % 1000 == 0) {
                //System.out.print(j + " ");
            }
            for(int i=0; i<N; i++) {
                C[i][j] = A[i][j] + B[i][j];
            }
        }
        System.out.println("\nCol major time:" + (System.currentTimeMillis() - start) + "ms");

    }

    private static void init() {
        long start = System.currentTimeMillis();
        for(int i=0; i<N; i++) {
            for(int j=0; j<N; j++) {
                A[i][j] = B[i][j] = i+j;
            }
        }
        System.out.println("Init time (row major):" + (System.currentTimeMillis() - start) + "ms");
    }
}
