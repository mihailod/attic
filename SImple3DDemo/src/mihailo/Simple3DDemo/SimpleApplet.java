package mihailo.Simple3DDemo;

import java.applet.Applet;
import java.awt.*;
import java.util.ArrayList;
import java.util.Collections;

import static mihailo.Simple3DDemo.Constants.*;
import static mihailo.Simple3DDemo.Shading.*;

/**
 * Created by mihailod, Feb 15, 2011, 7:24:14 PM
 */
public class SimpleApplet extends Applet {

    // features
    protected static boolean hiddenSurfaceRemoval = false;
    protected static boolean fillPolygons = false;
    protected static boolean zorder = false;
    protected static boolean ambientShading = false;
    protected static Color ambientLight = Color.WHITE;
    protected static boolean diffuseShading = false;

    protected Image buffer = null;
    private static Graphics bg = null;

    protected static final Panel p = new Panel();

    protected static double[][] worldTransform;
    protected static double[][] viewTransform;

    protected static ArrayList<Polygon3D> polygons = new ArrayList<Polygon3D>();
    private static ArrayList<Polygon2D> polygonsToDraw = new ArrayList<Polygon2D>();

    protected static int body = TETRAHEDRON;

    protected static double rotationX;
    protected static double rotationY;
    protected static double rotationZ;

    public void init() {
        final Frame f = new Frame(S_APPLET_NAME);
        final Listener l = new Listener(this);
        l.setupFrame(f);
        f.add(p, BorderLayout.CENTER);
        p.addKeyListener(l);

        final Panel p1 = new Panel(new FlowLayout());
        GUI.init(p1, this);
        f.add(p1, BorderLayout.SOUTH);
        
        buffer = createImage(W, H);
        bg = buffer.getGraphics();

        initStuff();

        //final Thread d = new Thread(new Drawer()); d.start();
        f.setBounds(X, Y, W, H);
        f.setVisible(true);
        p.requestFocusInWindow();
    }

    protected void initStuff() {
        polygons.clear();
        setupInitialTransformations();
        rotationX = rotationY = rotationZ = INITIAL_ROTATION;
        setupPolygons();
        updateStuff();
    }

    protected void updateStuff() {
        double[][] t = Matrix.multiplyByMatrix(viewTransform, worldTransform);
        transformAndProjectPolygons(t);
    }

    private void drawStuff(final Graphics g) {
        // clear old image
        g.setColor(Color.WHITE);
        g.fillRect(0, 0, W, H);
        g.setColor(Color.BLACK);
        g.drawString(S_HELP, 10, 20);
        g.drawString(S_HELP, 11, 20);
        drawPolygons(g);
    }

    private void drawPolygons(final Graphics g) {
        final Color originalColor = g.getColor();
        for (Polygon2D polygonToDraw : polygonsToDraw) {
            final int n = polygonToDraw.points.size();
            final int[] x = new int[n];
            final int[] y = new int[n];
            for (int i=0; i<n; i++) {
                x[i] = polygonToDraw.points.get(i).x;
                y[i] = polygonToDraw.points.get(i).y;
            }
            final Polygon p = new Polygon(x, y, n);
            if (fillPolygons) {
                g.setColor(polygonToDraw.color);
                g.fillPolygon(p);
            } else {
                g.drawPolygon(p);
            }
        }
        g.setColor(originalColor);
    }

    /*private class Drawer extends Thread {
        public void run() {
            while (true) {
                updateStuff();
                repaint();
                yield();
            }
        }
    }*/

    public void update(Graphics g) {
        drawStuff(bg);
        if (p.getGraphics() != null) {
            p.getGraphics().drawImage(buffer, 0, 0, null);
        }
    }

    public void paint(Graphics g) {
        update(g);
    }

    private void transformAndProjectPolygons(final double[][] t) {

        polygonsToDraw.clear();

        // for all 3D polygons
        for (Polygon3D p : polygons) {

            final ArrayList<Point3D> transformedPoints = new ArrayList<Point3D>();
            final Polygon2D projectedP = new Polygon2D(new ArrayList<Point2D>(), p.color);

            // for all points in the 3D polygon
            for (Point3D currentPoint : p.points) {

                // transform the 3D point to the view space
                Point3D transformedPoint = currentPoint;
                if (!p.dontTransform) {
                    transformedPoint = Matrix.multiplyByVector(t, currentPoint);
                }
                transformedPoints.add(transformedPoint);

                // project the 3D point to the screen and it becomes a 2D point
                final Point2D projectedPoint = new Point2D();
                projectedPoint.x = Math.round(Math.round(transformedPoint.x / transformedPoint.z * P_RATIO * W/2d + 0.5d + W/2d));
                projectedPoint.y = Math.round(Math.round(transformedPoint.y / transformedPoint.z * P_RATIO * H/2d + 0.5d + H/2d));

                // add that 2D point to the projected polygon's points
                projectedP.points.add(projectedPoint);
            }

            final Polygon3D transformedP = new Polygon3D(transformedPoints, p.color);
            if (p.dontTransform) {
                projectedP.zorder = p.zorder;
            } else {
                projectedP.zorder = transformedP.zorder;
            }

            // add 2D polygon to the list of the polygons to draw
            if (hiddenSurfaceRemoval || p.dontTransform) {
                if (transformedP.isVisible()) {
                    polygonsToDraw.add(projectedP);
                }
            } else {
                polygonsToDraw.add(projectedP);
            }
            //System.out.print(transformedP + " ");

            if (ambientShading && !p.dontShade) {
                projectedP.color = applyAmbientShading(p.color, ambientLight);
            }

            if (diffuseShading && !p.dontShade) {
                projectedP.color = applyDiffuseShading(projectedP.color, SPOTLIGHT_POSITION, SPOTLIGHT_COLOR, transformedP.unitNormal());
            }
        }
        if (zorder) {
            Collections.sort(polygonsToDraw);
        }
        //System.out.println();
    }

    private static void setupPolygons() {
        if (body == TETRAHEDRON) {
            DemoObjects.setupTetrahedron();
        } else if (body == CUBE) {
            DemoObjects.setupCube();
        }
    }
}
