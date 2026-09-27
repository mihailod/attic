package mihailo.Simple3DDemo;

import java.awt.*;
import java.util.ArrayList;

/**
 * Created by mihailod, Feb 20, 2011, 12:07:40 PM
 */
public class Constants {

    public static final String S_APPLET_NAME = "Simple 3D Demo V1.0 by Mihailo Despotovic";
    public static final String S_HELP = "Translate: arrows  Rotate: Q A (around x) O P (y) W S (z)  Zoom: PgUp PgDn";

    public static final int X = 50; // screen position
    public static final int Y = 50;
    public static final int W = 1300; // screen width
    public static final int H = 800; // screen height

    public static final int TETRAHEDRON = 0;
    public static final int CUBE = 1;

    public static final double P_RATIO = -2.0;
    public static final double Z_CLIP = -80;
    public static final double XY_CLIP = 20;

    public static final double INITIAL_ROTATION = Math.PI / 30;
    public static final double ROTATION_STEP = Math.PI / 60;
    public static final double TRANSLATION_STEP = 1;

    public static void setupInitialTransformations() {
        SimpleApplet.worldTransform = new double[][] {
            { 1, 0, 0,    0},
            { 0, 1, 0,    0},
            { 0, 0, 1, -140}, // 140 pixels away down the Z axis
            { 1, 0, 0,    1}
        };

        SimpleApplet.viewTransform = new double[][] {
            { 1, 0, 0, 0},
            { 0, 1, 0, 0},
            { 0, 0, 1, 0},
            { 1, 0, 0, 1}
        };
    }

    public static String colorName(final Color c) {
        if (c == Color.BLUE) {
            return "blue";
        } else if (c == Color.YELLOW) {
            return "yellow";
        } else if (c == Color.ORANGE) {
            return "orange";
        } else if (c == Color.MAGENTA) {
            return "magenta";
        } else if (c == Color.RED) {
            return "red";
        } else if (c == Color.GREEN) {
            return "green";
        } else {
            return "???";
        }
    }

    protected static final Point3D SPOTLIGHT_POSITION = new Point3D(-30, 30, 200, 1);
    protected static final Color SPOTLIGHT_COLOR = Color.WHITE;
    protected static Polygon3D SPOTLIGHT_POLYGON = null;
    static {
        final ArrayList<Point3D> points = new ArrayList<Point3D>();
        points.add(new Point3D(SPOTLIGHT_POSITION.x,     SPOTLIGHT_POSITION.y,     SPOTLIGHT_POSITION.z, 1));
        points.add(new Point3D(SPOTLIGHT_POSITION.x + 1, SPOTLIGHT_POSITION.y,     SPOTLIGHT_POSITION.z, 1));
        points.add(new Point3D(SPOTLIGHT_POSITION.x + 1, SPOTLIGHT_POSITION.y + 1, SPOTLIGHT_POSITION.z, 1));
        SPOTLIGHT_POLYGON = new Polygon3D(points, Color.BLACK);
        SPOTLIGHT_POLYGON.dontTransform = true;
        SPOTLIGHT_POLYGON.dontShade = true;
    }

    protected static Polygon3D GROUND = null;
    static {
        final ArrayList<Point3D> points = new ArrayList<Point3D>();
        points.add(new Point3D(  200, 0,   220, 1));
        points.add(new Point3D(  200, 520, 220, 1));
        points.add(new Point3D( -200, 0,   220, 1));
        GROUND = new Polygon3D(points, Color.BLACK);
        GROUND.dontTransform = true;
    }

}
