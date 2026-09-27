/**
 * User: mihailod, Jun 9, 2007, 4:45:22 PM
 */
public class MatrixRowBasedAdder implements Runnable {

    public int start;
    public int end;

    public void run() {
        System.out.println(Thread.currentThread() + " Start: " + start + " End: " + (end-1));
        for(int i=start; i<end; i++) {
            for(int j=0; j<BigMatrix.N; j++) {
                if(j % 1000 == 0) {
                    //System.out.print(Thread.currentThread().getId());
                    if(j % 80000 == 0) {
                       // System.out.println();
                    }
                }
                if(BigMatrix.rowMajor) {
                    BigMatrix.C[i][j] = BigMatrix.A[i][j] + BigMatrix.B[i][j];
                } else {
                    BigMatrix.C[j][i] = BigMatrix.A[j][i] + BigMatrix.B[j][i];                    
                }
            }
        }
    }
}
