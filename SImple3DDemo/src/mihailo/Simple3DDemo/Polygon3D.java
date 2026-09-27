package mihailo.Simple3DDemo;

import java.awt.*;
import java.util.ArrayList;

/**
 * Created by mihailod, Feb 19, 2011, 12:12:49 PM
 */
public class Polygon3D {

    public Color color = Color.BLACK;

    public double zorder;
    private double vp;

    private Point3D unitNormal = null;
    public boolean dontTransform = false;
    public boolean dontShade = false;

    public ArrayList<Point3D> points;
    public Polygon3D(final ArrayList<Point3D> points, final Color color) {

        this.points = points;
        this.color = color;

        double zsum = 0;
        for (Point3D p : points) {
            zsum += p.z;
        }
        zorder = zsum / (double)points.size();

        /*double minz = points.get(0).z;
        for (Point3D p : points) {
            if (minz > p.z) {
                minz = p.z;
            }
        }
        zorder = minz;*/
    }

    private void calculateUnitNormal() {
        if (unitNormal != null) {
            return;
        }
        final Point3D first = points.get(0);
        final Point3D second = points.get(1);
        final Point3D last = points.get(points.size() - 1);

        final double v1 = second.x - first.x;
        final double v2 = second.y - first.y;
        final double v3 = second.z - first.z;

        final double w1 = last.x - first.x;
        final double w2 = last.y - first.y;
        final double w3 = last.z - first.z;

        final Point3D v = new Point3D(v1, v2, v3, first.w);
        final Point3D w = new Point3D(w1, w2, w3, second.w);

        unitNormal = Matrix.crossProduct(v, w);

        final double length = Math.sqrt(unitNormal.x*unitNormal.x + unitNormal.y*unitNormal.y + unitNormal.z*unitNormal.z);

        unitNormal.x /= length;
        unitNormal.y /= length;
        unitNormal.z /= length;
    }

    public Point3D unitNormal() {
        calculateUnitNormal();
        return unitNormal;
    }

    public boolean isVisible() {
        calculateUnitNormal();
        return unitNormal.z > 0;
    }

    public String toString() {
        return Constants.colorName(color) + " " + isVisible() + " (" + vp + ")";
    }
}
