package mihailo.Simple3DDemo;

import java.awt.*;
import java.awt.event.ItemEvent;
import java.awt.event.ItemListener;

import static mihailo.Simple3DDemo.Constants.SPOTLIGHT_POLYGON;
import static mihailo.Simple3DDemo.SimpleApplet.*;

/**
 * Created by mihailod, Feb 20, 2011, 12:01:34 PM
 */
public class GUI {

    public static void init(final Panel p1, final SimpleApplet sa) {
        final Choice c = new Choice();
        c.add("Terahedron");
        c.add("Cube");
        c.addItemListener(new ItemListener() {
            public void itemStateChanged(ItemEvent itemEvent) {
                body = c.getSelectedIndex();
                sa.initStuff();
                sa.repaint();
                p.requestFocusInWindow();
            }
        });
        p1.add(c);

        final Checkbox cb0 = new Checkbox("Hidden surface removal", false);
        cb0.addItemListener(new ItemListener() {
            public void itemStateChanged(ItemEvent itemEvent) {
                hiddenSurfaceRemoval = cb0.getState();
                sa.updateStuff();
                sa.repaint();
                p.requestFocusInWindow();
            }
        });
        p1.add(cb0);

        final Checkbox cb1 = new Checkbox("Fill polygons", false);
        cb1.addItemListener(new ItemListener() {
            public void itemStateChanged(ItemEvent itemEvent) {
                fillPolygons = cb1.getState();
                sa.updateStuff();
                sa.repaint();
                p.requestFocusInWindow();
            }
        });
        p1.add(cb1);

        final Checkbox cb2 = new Checkbox("z-ordering", false);
        cb2.addItemListener(new ItemListener() {
            public void itemStateChanged(ItemEvent itemEvent) {
                zorder = cb2.getState();
                sa.updateStuff();
                sa.repaint();
                p.requestFocusInWindow();
            }
        });
        p1.add(cb2);

        final Checkbox cb3 = new Checkbox("Ambient shading:", false);
        cb3.addItemListener(new ItemListener() {
            public void itemStateChanged(ItemEvent itemEvent) {
                ambientShading = cb3.getState();
                sa.updateStuff();
                sa.repaint();
                p.requestFocusInWindow();
            }
        });
        p1.add(cb3);

        final Choice cr = new Choice();
        cr.add("r 0%");
        cr.add("r 20%");
        cr.add("r 40%");
        cr.add("r 60%");
        cr.add("r 80%");
        cr.add("r 100%");
        cr.select(5);
        cr.addItemListener(new ItemListener() {
            public void itemStateChanged(ItemEvent itemEvent) {
                ambientLight = new Color(cr.getSelectedIndex() * 51, ambientLight.getGreen(), ambientLight.getBlue());
                sa.updateStuff();
                sa.repaint();
                p.requestFocusInWindow();
            }
        });
        p1.add(cr);

        final Choice cg = new Choice();
        cg.add("g 0%");
        cg.add("g 20%");
        cg.add("g 40%");
        cg.add("g 60%");
        cg.add("g 80%");
        cg.add("g 100%");
        cg.select(5);
        cg.addItemListener(new ItemListener() {
            public void itemStateChanged(ItemEvent itemEvent) {
                ambientLight = new Color(ambientLight.getRed(), cg.getSelectedIndex() * 51, ambientLight.getBlue());
                sa.updateStuff();
                sa.repaint();
                p.requestFocusInWindow();
            }
        });
        p1.add(cg);

        final Choice cb = new Choice();
        cb.add("b 0%");
        cb.add("b 20%");
        cb.add("b 40%");
        cb.add("b 60%");
        cb.add("b 80%");
        cb.add("b 100%");
        cb.select(5);
        cb.addItemListener(new ItemListener() {
            public void itemStateChanged(ItemEvent itemEvent) {
                ambientLight = new Color(ambientLight.getRed(), ambientLight.getGreen(), cg.getSelectedIndex() * 51);
                sa.updateStuff();
                sa.repaint();
                p.requestFocusInWindow();
            }
        });
        p1.add(cb);

        final Checkbox cb4 = new Checkbox("Diffuse shading", false);
        cb4.addItemListener(new ItemListener() {
            public void itemStateChanged(ItemEvent itemEvent) {
                diffuseShading = cb4.getState();

                if (diffuseShading) {
                    cb1.setState(true);
                    fillPolygons = true;
                    polygons.add(SPOTLIGHT_POLYGON);
                } else {
                    polygons.remove(SPOTLIGHT_POLYGON);
                }
                
                sa.updateStuff();
                sa.repaint();
                p.requestFocusInWindow();
            }
        });
        p1.add(cb4);
    }
}
