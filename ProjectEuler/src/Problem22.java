import java.util.ArrayList;
import java.util.StringTokenizer;
import java.util.Collections;
import java.io.BufferedReader;
import java.io.FileReader;

/**
 * Created by mihailod, Mar 11, 2009, 7:52:25 PM
 *
 * For example, when the list is sorted into alphabetical order,
 * COLIN, which is worth 3 + 15 + 12 + 9 + 14 = 53,
 * is the 938th name in the list.
 * So, COLIN would obtain a score of 938 * 53 = 49714.
 *
 * What is the total of all the name scores in the file?
 */
public class Problem22 {
    public static void main(final String[] args) {
    }

    private static ArrayList<String> a = new ArrayList<String>();

    static {
        try {
            BufferedReader br = new BufferedReader(new FileReader("22.txt"));
            String line = br.readLine();
            StringTokenizer st = new StringTokenizer(line, ",");
            while(st.hasMoreTokens()) {
                String token = st.nextToken();
                token = token.substring(1, token.length() - 1);
                a.add(token);
            }
            Collections.sort(a);
            long total = 0;
            for (int i=0; i<a.size(); i++) {
                int position = i + 1;
                String s = a.get(i);
                int worth = 0;
                for (int j=0; j<s.length(); j++) {
                    worth += s.charAt(j) - 'A' + 1;
                }
                worth *= position;
                total += worth;
            }
            System.out.println("total = " + total);

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
