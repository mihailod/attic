package mihailo.Simple3DDemo;

import java.awt.*;
import java.util.ArrayList;

/**
 * Created by mihailod, Feb 19, 2011, 4:16:28 PM
 */
public class Polygon2D implements Comparable {

    public Color color = Color.BLACK;
    public double zorder;

    public ArrayList<Point2D> points;
    public Polygon2D(ArrayList<Point2D> points, Color color) {
        this.points = points;
        this.color = color;
    }

    public int compareTo(Object o) {
        return zorder - ((Polygon2D)o).zorder >= 0 ? 1 : -1;
    }
}
