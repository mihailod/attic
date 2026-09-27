/**
 * Created by mihailod, 24.05.2008., 13.35.57
 */
public class Util {
    public static String msToReadableTime(final long ms) {
        final long h = ms / (1000*60*60);
        final long m = (ms % (1000*60*60)) / (1000*60);
        final long s = ((ms % (1000*60*60)) % (1000*60)) / 1000;
        if(h == 0 && m == 0 && s == 0) {
            return ms == 0 ? "negligible" : ms + "ms";
        }
        final StringBuilder sb = new StringBuilder();
        sb.append(h > 0 ? h + "h " : " ");
        sb.append(m > 0 ? m + "m " : " ");
        sb.append(s > 0 ? s + "s " : " ");
        return sb.toString();
    }

    public static void p(final String s) {
        System.out.println(s);
    }

    public static String makeSpacePadder(final int len) {
        final StringBuilder sb = new StringBuilder(len);
        for(int i=0; i<len; i++) {
            sb.append(" ");
        }
        return sb.toString();
    }
}
