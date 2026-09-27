package mihailo.Simple3DDemo;

import java.awt.*;
import java.util.ArrayList;

/**
 * Created by mihailod, Feb 20, 2011, 9:30:14 AM
 */
public class DemoObjects {
    public static void setupTetrahedron() {
        ArrayList<Point3D> tetraVertices = new ArrayList<Point3D>();
        tetraVertices.add(new Point3D(-20, -20,   0, 1));
        tetraVertices.add(new Point3D(  0,  30,   0, 1));
        tetraVertices.add(new Point3D( 30, -20,   0, 1));
        tetraVertices.add(new Point3D(  0,   0, -25, 1));

        addTetraPoligon(tetraVertices, 0, 1, 2, Color.ORANGE);
        addTetraPoligon(tetraVertices, 2, 1, 3, Color.MAGENTA);
        addTetraPoligon(tetraVertices, 2, 3, 0, Color.RED);
        addTetraPoligon(tetraVertices, 3, 1, 0, Color.GREEN);
    }

    private static void addTetraPoligon(final ArrayList<Point3D> allTetraVertices, int i, int j, int k, Color c) {
        ArrayList<Point3D> points = new ArrayList<Point3D>();
        points.add(allTetraVertices.get(i));
        points.add(allTetraVertices.get(j));
        points.add(allTetraVertices.get(k));
        Polygon3D tetraPolygon = new Polygon3D(points, c);        
        SimpleApplet.polygons.add(tetraPolygon);
    }

    public static void setupCube() {
        ArrayList<Point3D> cubeVertices = new ArrayList<Point3D>();
        cubeVertices.add(new Point3D( 15,  15,  15, 1));
        cubeVertices.add(new Point3D( 15,  15, -15, 1));
        cubeVertices.add(new Point3D( 15, -15,  15, 1));
        cubeVertices.add(new Point3D( 15, -15, -15, 1));
        cubeVertices.add(new Point3D(-15,  15,  15, 1));
        cubeVertices.add(new Point3D(-15,  15, -15, 1));
        cubeVertices.add(new Point3D(-15, -15,  15, 1));
        cubeVertices.add(new Point3D(-15, -15, -15, 1));

        addCubePoligon(cubeVertices, 1, 3, 2, 0, Color.ORANGE);
        addCubePoligon(cubeVertices, 5, 7, 3, 1, Color.MAGENTA);
        addCubePoligon(cubeVertices, 4, 5, 1, 0, Color.RED);
        addCubePoligon(cubeVertices, 3, 7, 6, 2, Color.GREEN);
        addCubePoligon(cubeVertices, 5, 4, 6, 7, Color.BLUE);
        addCubePoligon(cubeVertices, 0, 2, 6, 4, Color.YELLOW);
    }

    private static void addCubePoligon(final ArrayList<Point3D> allCubeVertices, int i, int j, int k, int l, Color c) {
        ArrayList<Point3D> points = new ArrayList<Point3D>();
        points.add(allCubeVertices.get(i));
        points.add(allCubeVertices.get(j));
        points.add(allCubeVertices.get(k));
        points.add(allCubeVertices.get(l));
        Polygon3D cubePoligon = new Polygon3D(points, c);
        SimpleApplet.polygons.add(cubePoligon);
    }
}
