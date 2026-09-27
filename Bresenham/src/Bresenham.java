/**
 * Created by mihailod, Feb 15, 2011, 7:04:00 PM
 */
public class Bresenham {


    public static void main(String[] args) {
        final int x0 = 0; //Integer.parseInt(args[0]);
        final int y0 = 0; //Integer.parseInt(args[1]);
        final int x1 = 5; //Integer.parseInt(args[2]);
        final int y1 = 2; //Integer.parseInt(args[3]);
        line(x0, y0, x1, y1);
    }

    private static void line(final int x0, final int y0, final int x1, final int y1) {
        int deltax = x1 - x0;
        int deltay = y1 - y0;
        double error = 0d;
        double deltaErr = (double)deltay / (double)deltax;
        int y = y0;
        for(int x = x0; x <= x1; x++) {
            plot(x,y);
            error = error + deltaErr;
            if (Math.abs(error) >= 0.5) {
                y = y + 1;
                error = error - 1.0;
            }
        }
    }

    private static void plot(final int x, final int y) {
        System.out.print("(" + x + ", " + y + ") ");
    }
}
