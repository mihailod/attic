package chuchurocket.util;

import java.awt.*;
import java.awt.event.*;
import javax.swing.*;

/**
 * <p>Title: ChuChu Rocket</p>
 * <p>Description: A java port of a well known SEGA's game for Dreamcast</p>
 * <p>Copyright: Copyright (c) 2003 Mihailo Despotovic (game idea (c)SEGA)</p>
 * <p>Company: </p>
 * @author Mihailo Despotovic
 * @version 1.0
 */

public class CoolButton extends JButton implements MouseListener
{
  private static int xxPlay[] = new int[3];
  private static int yyPlay[] = new int[3];
  private static int xx1FF[] = new int[3];
  private static int yyFF[] = new int[3];
  private static int xx2FF[] = new int[3];

  private static int stopX = 0;
  private static int stopY = 0;
  private static int stopSize = 0;

  private boolean pressed = false;

  public void initStatics(int w, int h)
  {
    int inset = Constants.CELL_INSET;
    int size = w - 2*inset;
    int sizeY = h - 2*inset;

    xxPlay[0] = inset + (int)(size/3f);
    xxPlay[1] = inset + (int)(size/3f*2f);
    xxPlay[2] = xxPlay[0];
    yyPlay[0] = inset + (int)(sizeY/4f);
    yyPlay[1] = inset + (int)(sizeY/2f);
    yyPlay[2] = inset + (int)(sizeY/4f*3f);

    float twoByFive = 2f/5f;

    xx1FF[0] = inset + (int)(size/5f);
    xx1FF[1] = inset + (int)(size*twoByFive);
    xx1FF[2] = xx1FF[0];

    yyFF[0] = inset + (int)(sizeY/4f);
    yyFF[1] = inset + (int)(sizeY/2f);
    yyFF[2] = yyFF[0] + (int)(sizeY/2f);

    xx2FF[0] = xx1FF[0] + (int)(size*twoByFive);
    xx2FF[1] = xx1FF[1] + (int)(size*twoByFive);
    xx2FF[2] = xx1FF[2] + (int)(size*twoByFive);

    xx1FF[0] += Constants.CELL_INSET*2;
    xx1FF[1] += Constants.CELL_INSET*2;
    xx1FF[2] += Constants.CELL_INSET*2;

    stopX = inset + 2*size/4 - size/8;
    stopY = inset + 2*sizeY/4 - size/8;
    stopSize = size/4;

    repaint();
  }

  public CoolButton(String text)
  {
    super(text);
    this.setFocusPainted(false);
    this.addMouseListener(this);
  }

  /*public Dimension gerPreferredSize()
  {
    return new Dimension(Constants.CELL_SIZE, Constants.CELL_SIZE);
  }*/

  public void paint(Graphics g)
  {
    Graphics2D g2 = (Graphics2D)g;
    g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
    g.setColor(Color.black);
    g.fillRect(0, 0, getWidth(), getHeight());

    String text = getText();
    if(!pressed)
      g.setColor(Color.white);
    else
    {
      if("stop".equals(text))
        g.setColor(Color.red);
      else
        g.setColor(Color.green);
    }
    if("play".equals(text))
      g.fillPolygon(xxPlay, yyPlay, 3);
    else if("ff".equals(text))
    {
      g.fillPolygon(xx1FF, yyFF, 3);
      g.fillPolygon(xx2FF, yyFF, 3);
    }
    else if("stop".equals(text))
      g.fillRect(stopX, stopY, stopSize, stopSize);
    else
      g.drawString("?", 20, 20);
  }

  public void mousePressed(MouseEvent me) { pressed = true; }
  public void mouseReleased(MouseEvent me) { pressed = false; }
  public void mouseExited(MouseEvent me) { ; }
  public void mouseEntered(MouseEvent me) { ; }
  public void mouseClicked(MouseEvent me) { ; }
}