package mihailo.life;

import java.applet.Applet;
import java.awt.*;
import java.awt.event.*;

/**
 * Created by mihailod, Feb 15, 2011, 7:24:14 PM
 */
public class LifeApplet extends Applet implements ActionListener {

    private static final boolean PROFILING = false;

    private static final double THRESHOLD = 0.925;

    private static final int W = 500; // map width
    private static final int H = 350; // map height
    private static final int M = 2; // pixel size multiplier

    private static Image buffer = null;
    private static Graphics bg = null;

    private static boolean running = false;

    private final Button seedButton = new Button("Seed");
    private final Button startButton = new Button("Start");
    private final Button nextButton = new Button("Next");
    private final Button stopButton = new Button("Stop");
    private static final Panel p = new Panel();

    private static byte a[][] = new byte[W][H]; // current generation

    // profiling 1500 x 1000 ~ 21ms
    private long average = 0;
    private long count = 0;
    private long time = 0;

    public void init() {
        final Frame f = new Frame("Conway's Game of Life V1.0 by Mihailo Despotovic");
        f.addWindowListener(new WindowListener() {
            public void windowOpened(WindowEvent windowEvent) { repaint(); }
            public void windowClosing(WindowEvent we) { buffer = null; f.dispose(); }
            public void windowClosed(WindowEvent windowEvent) { repaint(); }
            public void windowIconified(WindowEvent windowEvent) { repaint(); }
            public void windowDeiconified(WindowEvent windowEvent) { repaint(); }
            public void windowActivated(WindowEvent windowEvent) { repaint(); }
            public void windowDeactivated(WindowEvent windowEvent) { repaint(); }
        });
        f.addComponentListener(new ComponentListener() {
            public void componentResized(ComponentEvent componentEvent) { repaint(); }
            public void componentMoved(ComponentEvent componentEvent) { repaint(); }
            public void componentShown(ComponentEvent componentEvent) { repaint(); }
            public void componentHidden(ComponentEvent componentEvent) { repaint(); }
        });

        buffer = createImage(W * M, H * M);
        bg = buffer.getGraphics();

        final Panel buttonPanel = new Panel();
        buttonPanel.setLayout(new FlowLayout());
        buttonPanel.add(seedButton);
        buttonPanel.add(startButton);
        buttonPanel.add(nextButton);
        buttonPanel.add(stopButton);
        seedButton.addActionListener(this);
        startButton.addActionListener(this);
        nextButton.addActionListener(this);
        stopButton.addActionListener(this);
        f.setLayout(new BorderLayout());        
        f.add(buttonPanel, BorderLayout.SOUTH);
        f.add(p, BorderLayout.CENTER);
        
        seed();
        final Thread d = new Thread(new Drawer()); d.start();
        f.setBounds(50, 50, W * M, H * M + 60);
        f.setVisible(true);
        updateButtons();
    }

    public void actionPerformed(ActionEvent ae) {
        final String ac = ae.getActionCommand();
        if (ac.equals("Seed")) {
            seed();
        } else if (ac.equals("Start")) {
            running = true;
        } else if (ac.equals("Next")) {
            next();
        } else if (ac.equals("Stop")) {
            running = false;
            if (PROFILING) {
                System.out.println("Average: " + average);
            }
        }
        updateButtons();
    }

    private void updateButtons() {
        startButton.setEnabled(!running);
        nextButton.setEnabled(!running);
        stopButton.setEnabled(running);
        seedButton.setEnabled(!running);
        repaint();
    }

    private void next() {
        calculateNextGeneration();
    }

    public void update(Graphics g) {
        bg.setColor(Color.WHITE);
        bg.fillRect(0, 0, W*M, H*M);
        bg.setColor(Color.BLACK);
        for (int i=0; i<W; i++) {
            for (int j=0; j<H; j++) {
                if (a[i][j] == 1) {
                    bg.fillRect(i*M, j*M, M, M);
                }
            }
        }
        if (p.getGraphics() != null) {
            p.getGraphics().drawImage(buffer, 0, 0, null);
        }
    }

    private void seed() {
        a = new byte[W][H];
        for (int i=0; i<W; i++) {
            for (int j=0; j<H; j++) {
                a[i][j] = Math.random() > THRESHOLD ? (byte)1 : 0;
            }
        }
    }

    private void calculateNextGeneration() {
        final long start = System.currentTimeMillis();
        final byte b[][] = new byte[W][H];
        for (int i=0; i<W; i++) {
            for (int j = 0; j<H; j++) {
                int count = count(i, j);
                if (a[i][j] == 1) { // alive cell
                    if (count != 2 && count != 3) {
                        b[i][j] = 0; // dies (<2 = starving, >3 = overpopulation)
                    } else {
                        b[i][j] = 1; // otherwise, stays alive
                    }
                } else { // dead cell
                    if (count == 3) {
                        b[i][j] = 1; // becomes alive if 3 neighbours (reproduction)
                    } else {
                        b[i][j] = 0; // otherwise, stays dead
                    }
                }
            }
        }
        System.arraycopy(b, 0, a, 0, W);
        count++;
        time+= System.currentTimeMillis() - start;
        average = time / count;
    }

    private int count(final int x, final int y) {
        int px = x - 1; if (px < 0)     px = W - 1;
        int py = y - 1; if (py < 0)     py = H - 1;
        int nx = x + 1; if (nx > W - 1) nx = 0;
        int ny = y + 1; if (ny > H - 1) ny = 0;
        return a[px][py] + a[ x][py] + a[nx][py] +
               a[px][ y] +           + a[nx][ y] +
               a[px][ny] + a[ x][ny] + a[nx][ny];
    }

    private class Drawer extends Thread {
        public void run() {
            while (true) {
                if (running) {
                    calculateNextGeneration();
                    repaint();
                }
                yield();
            }
        }
    }

    public void paint(Graphics g) {
        update(g);
    }
}
