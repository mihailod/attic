package chuchurocket.util;

import java.applet.*;
import java.awt.*;
import java.awt.image.*;
import java.awt.geom.*;
import java.awt.font.*;
import java.io.*;
import java.net.*;
import javax.swing.*;

/**
 * <p>Title: ChuChu Rocket</p>
 * <p>Description: A java port of a well known SEGA's game for Dreamcast</p>
 * <p>Copyright: Copyright (c) 2003 Mihailo Despotovic (game idea (c)SEGA)</p>
 * <p>Company: </p>
 * @author Mihailo Despotovic
 * @version 1.0
 */

public class Constants
{
  public static final String FILE_MARKER = "ChuChu Cheese Level File";

  public static final int GAME_FIELD_WIDTH = 12;
  public static final int GAME_FIELD_HEIGHT = 9;

  public static final int STATE_NOTHING = 0;
  public static final int STATE_MOUSE = 1;
  public static final int STATE_CAT = 2;
  public static final int STATE_HOLE = 3;
  public static final int STATE_ROCKET = 4;
  public static final int STATE_WALL = 5;
  public static final int STATE_ARROW = 6;

  public static final int ORIENTATION_NONE = 0;
  public static final int ORIENTATION_LEFT = 1;
  public static final int ORIENTATION_RIGHT = 2;
  public static final int ORIENTATION_UP = 3;
  public static final int ORIENTATION_DOWN = 4;

  public static final Color BUTTON_COLOR_SELECTED = Color.green;
  public static final Color BUTTON_COLOR_NORMAL = Color.lightGray;

  public static final Composite COMPOSITE = AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.9f);

  public static final int CELL_SIZE = 60; // EVERYTHING SHOULD BE RELATIVE TO THIS!!!
  public static final int CELL_SIZE2 = CELL_SIZE/2;
  public static final int CELL_INSET = CELL_SIZE/30;
  public static final Color CELL_ODD_COLOR = Color.pink;
  public static final Color CELL_EVEN_COLOR = Color.yellow;

  public static final int WALL_WIDTH = (int)(CELL_SIZE/8f);
  public static final int WALL_WIDTH2 = WALL_WIDTH/2;
  public static final int WALL_WIDTHD = WALL_WIDTH*2;
  public static final Color WALL_COLOR = Color.red;

  public static final int ARROW_INSET = CELL_SIZE/8;
  public static final Color ARROW_BACKGROUND_COLOR = Color.blue;
  public static final Color ARROW_FOREGROUND_COLOR = Color.white;
  public static final int ARROWS_MAX = 4;

  public static final int MOUSE_FATNESS = CELL_SIZE/2;
  public static final int MOUSE_EAR_SIZE = CELL_SIZE/3;
  public static final int MOUSE_EYE_SIZE = CELL_SIZE/12;
  public static final Color MOUSE_COLOR_BODY = Color.lightGray;
  public static final Color MOUSE_COLOR_EARS = Color.darkGray;
  public static final Color MOUSE_COLOR_TAIL = Color.black;
  public static final Color MOUSE_COLOR_EYES = Color.black;

  public static final Color CAT_COLOR = Color.red;
  public static final int CAT_FATNESS = CELL_SIZE/3*2;

  public static final String EDITOR_ABOUT = "ChuChu Cheese Editor V1.0\nCopyright (c) Mihailo Despotovic 2003.";
  public static final String EDITOR_INSTRUCTIONS =
      "Left-click on buttons and then the boards to insert objects.\n" +
      "Right-click on an object to remove it.\n";

  public static final Font FONT1 = new Font("dialog", Font.PLAIN, CELL_SIZE/2);

  public static final int SPEED_MOUSE = CELL_SIZE/10;
  public static final int SPEED_CAT = (int)(SPEED_MOUSE * 4f/5f);
  public static final int SPEED_MULTIPLIER = 4;

  public static final int TIME_DELAY = 40; // 25fps
  public static final int TIME_DELAY4 = TIME_DELAY/4;

  // some useful methods

  public static void center(JFrame f)
  {
    int h = (int)Toolkit.getDefaultToolkit().getScreenSize().getHeight();
    int w = (int)Toolkit.getDefaultToolkit().getScreenSize().getWidth();
    f.setBounds((int)(w - f.getWidth())/2, (int)(h - f.getHeight())/2,
                (int)f.getWidth(), (int)f.getHeight());
  }

  public static void fillCircle(Graphics g, int x, int y, int r)
  {
    x -= r;
    y -= r;
    int r2 = 2*r;
    g.fillArc(x, y, r2, r2, 0, 360);
  }

  public static void drawCircle(Graphics g, int x, int y, int r)
  {
    x -= r;
    y -= r;
    int r2 = 2*r;
    g.drawArc(x, y, r2, r2, 0, 360);
  }

  public static void load(Board board, ArrowsPanel ap, File file, JFrame host, JTextField name)
  {
    try
    {
      BufferedReader br = new BufferedReader(new FileReader(file));
      String line = br.readLine(); // check the file marker
      if(!line.equals(Constants.FILE_MARKER))
      {
        br.close();
        JOptionPane.showMessageDialog(host, "Not a level file", "Load Level Bad File", JOptionPane.ERROR_MESSAGE);
        return;
      }
      line = br.readLine(); // level name
      name.setText(line);
      line = br.readLine(); // board
      board.setContentFromString(line);
      line = br.readLine(); // arrows
      ap.setContentFromString(line);
      br.close();
    }
    catch(Exception e)
    {
      e.printStackTrace();
      JOptionPane.showMessageDialog(host, e.toString(), "Load Level Error", JOptionPane.ERROR_MESSAGE);
    }
  }

  public static void save(File file, Board board, ArrowsPanel ap, Frame host, JTextField name)
  {
    try
    {
      PrintWriter pw = new PrintWriter(new FileWriter(file));
      pw.println(Constants.FILE_MARKER); // mark the file as a level file
      pw.println(name.getText()); // the name of the level
      pw.println(board.toString()); // the board configuration
      pw.println(ap.toString()); // the arrows configuration
      pw.flush();
      pw.close();
    }
    catch(Exception e)
    {
      e.printStackTrace();
      JOptionPane.showMessageDialog(host, e.toString(), "Save Level Error", JOptionPane.ERROR_MESSAGE);
    }
  }

  private static final float k = 1/100f;
  private static final float kk[] =
  {
     k,k,k,k,k,k,k,k,k,k,
     k,k,k,k,k,k,k,k,k,k,
     k,k,k,k,k,k,k,k,k,k,
     k,k,k,k,k,k,k,k,k,k,
     k,k,k,k,k,k,k,k,k,k,
     k,k,k,k,k,k,k,k,k,k,
     k,k,k,k,k,k,k,k,k,k,
     k,k,k,k,k,k,k,k,k,k,
     k,k,k,k,k,k,k,k,k,k,
     k,k,k,k,k,k,k,k,k,k,
  };
  private static final Kernel KERNEL_BLUR = new Kernel(10, 10, kk);
  private static final ConvolveOp CONVOLVE_OP_BLUR = new ConvolveOp(KERNEL_BLUR);

  public static final void paintBlurredText(Graphics g, String text, int w, int h, Color color)
  {
     FontMetrics fm = g.getFontMetrics(FONT1);
     int xpos = (w - fm.stringWidth(text))/2;
     int ypos = (h - (fm.getAscent() + fm.getDescent()))/2 + fm.getAscent() - fm.getDescent()/2;

     BufferedImage bi = new BufferedImage(w, h, BufferedImage.TYPE_BYTE_GRAY);
     Graphics2D g2 = bi.createGraphics();
     g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
     g2.setColor(Color.black);
     g2.fillRect(0, 0, w, h);

     g2.setPaint(color);
     FontRenderContext frc = g2.getFontRenderContext();
     Shape shape = new TextLayout(text, FONT1, frc).
                   getOutline(AffineTransform.getTranslateInstance(xpos, ypos));
     g2.setColor(color);
     g2.fill(shape);
     g2.dispose();

     bi = CONVOLVE_OP_BLUR.filter(bi, null);

     g2 = bi.createGraphics();
     g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
     g2.setPaint(color);
     frc = g2.getFontRenderContext();
     shape = new TextLayout(text, FONT1, frc).
             getOutline(AffineTransform.getTranslateInstance(xpos, ypos));
     g2.fill(shape);
     g2.dispose();

     g.drawImage(bi, 0, 0, w, h, null);
  }

  public static final String format(int number)
  {
    if(number < 9)
      return "00" + number;
    else if(number < 99)
      return "0" + number;
    else
      return "" + number;
  }

  private static long time = System.currentTimeMillis();
  public static void logTime(String s)
  {
    System.out.println(s + " " + (System.currentTimeMillis() - time));
    time = System.currentTimeMillis();
  }
}