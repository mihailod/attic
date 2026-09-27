import java.io.*;
import java.util.StringTokenizer;
import java.math.BigInteger;

/**
 * Created by mihailod, 24.05.2008., 00.33.16
 */
public class PrimeNumbers {

    private static final int N = 78498;

    public static final int[] PRIMES64 = new int[N];
    public static final BigInteger[] PRIMES = new BigInteger[N];

    public static void init() {
    }

    static {
        final long start = System.currentTimeMillis();
        try {
            final BufferedReader br = new BufferedReader(new InputStreamReader(new FileInputStream("primes.txt")));
            final String line = br.readLine();
            final StringTokenizer st = new StringTokenizer(line, ", ");
            int i=0;
            while(st.hasMoreTokens()) {
                final String token = st.nextToken();
                PRIMES64[i] = Integer.parseInt(token);
                PRIMES[i] = new BigInteger(token);
                i++;
            }
        } catch(Exception e) {
            e.printStackTrace();
        }
        final long ms = System.currentTimeMillis() - start;
        System.out.println(N + " primes initialized in " + ms + "ms");
    }
}
