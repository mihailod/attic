package mihailo.Simple3DDemo;

import java.awt.*;
import java.awt.event.*;

import static mihailo.Simple3DDemo.SimpleApplet.*;
import static mihailo.Simple3DDemo.Constants.*;
import static mihailo.Simple3DDemo.RotationAppender.*;

/**
 * Created by mihailod, Feb 20, 2011, 6:21:00 PM
 */
public class Listener implements KeyListener {

    private SimpleApplet sa;

    public Listener(final SimpleApplet sa) {
        this.sa = sa;
    }

    public void keyTyped(KeyEvent keyEvent) {}
    public void keyReleased(KeyEvent keyEvent) {}
    public void keyPressed(KeyEvent keyEvent) {
        final int kc = keyEvent.getKeyCode();
        switch (kc) {
            // translation
            case KeyEvent.VK_DOWN  : { if (worldTransform[1][3] <  XY_CLIP) worldTransform[1][3] += TRANSLATION_STEP; break; }
            case KeyEvent.VK_UP    : { if (worldTransform[1][3] > -XY_CLIP) worldTransform[1][3] -= TRANSLATION_STEP; break; }
            case KeyEvent.VK_RIGHT : { if (worldTransform[0][3] <  XY_CLIP) worldTransform[0][3] += TRANSLATION_STEP; break; }
            case KeyEvent.VK_LEFT  : { if (worldTransform[0][3] > -XY_CLIP) worldTransform[0][3] -= TRANSLATION_STEP; break; }

            // zoom
            case KeyEvent.VK_PAGE_UP   : {                                    worldTransform[2][3] -= TRANSLATION_STEP; break; } // zoom away
            case KeyEvent.VK_PAGE_DOWN : { if (worldTransform[2][3] < Z_CLIP) worldTransform[2][3] += TRANSLATION_STEP; break; } // zoom in

            // rotations
            case KeyEvent.VK_O : { appendRotationY(-ROTATION_STEP); break; }
            case KeyEvent.VK_P : { appendRotationY( ROTATION_STEP); break; }
            case KeyEvent.VK_A : { appendRotationX(-ROTATION_STEP); break; }
            case KeyEvent.VK_Q : { appendRotationX( ROTATION_STEP); break; }
            case KeyEvent.VK_W : { appendRotationZ(-ROTATION_STEP); break; }
            case KeyEvent.VK_S : { appendRotationZ( ROTATION_STEP); break; }
        }
        sa.updateStuff();
        sa.repaint();
    }

    public void setupFrame(final Frame f) {
        f.addWindowListener(new WindowListener() {
            public void windowClosing(WindowEvent we) { sa.buffer = null; f.dispose(); }
            public void windowOpened(WindowEvent windowEvent)      { sa.repaint(); }
            public void windowClosed(WindowEvent windowEvent)      { sa.repaint(); }
            public void windowIconified(WindowEvent windowEvent)   { sa.repaint(); }
            public void windowDeiconified(WindowEvent windowEvent) { sa.repaint(); }
            public void windowActivated(WindowEvent windowEvent)   { sa.repaint(); }
            public void windowDeactivated(WindowEvent windowEvent) { sa.repaint(); }
        });
        f.addComponentListener(new ComponentListener() {
            public void componentResized(ComponentEvent componentEvent) { sa.repaint(); }
            public void componentMoved(ComponentEvent componentEvent)   { sa.repaint(); }
            public void componentShown(ComponentEvent componentEvent)   { sa.repaint(); }
            public void componentHidden(ComponentEvent componentEvent)  { sa.repaint(); }
        });
        f.setLayout(new BorderLayout());        
    }
}
