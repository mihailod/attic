package chuchurocket.util;

import java.awt.*;
import java.awt.event.*;
import javax.swing.*;
import java.util.*;

import chuchurocket.game.*;
import chuchurocket.editor.*;

/**
 * <p>Title: ChuChu Rocket</p>
 * <p>Description: A java port of a well known SEGA's game for Dreamcast</p>
 * <p>Copyright: Copyright (c) 2003 Mihailo Despotovic (game idea (c)SEGA)</p>
 * <p>Company: </p>
 * @author Mihailo Despotovic
 * @version 1.0
 */

public class ArrowsPanel extends JPanel implements MouseListener
{
  private Vector arrows = new Vector();

  private EditorFrame ef = null;
  private GameFrame gf = null;

  private int selectedArrow = -1;
  public int getSelectedArrow()
  {
    if(selectedArrow > -1 && arrows.size() > selectedArrow)
      return ((Integer)arrows.elementAt(selectedArrow)).intValue();
    else
      return -1;
  }
  public void setLastArrowAsSelected()
  {
    if(arrows.size() > 0)
    {
      selectedArrow = arrows.size() - 1;
      repaint();
    }
  }

  public ArrowsPanel(EditorFrame ef, GameFrame gf)
  {
    this.arrows = arrows;
    this.ef = ef;
    this.gf = gf;
    this.setPreferredSize(new Dimension(Constants.CELL_SIZE * Constants.ARROWS_MAX + 2 * Constants.CELL_INSET,
                                        Constants.CELL_SIZE + 2 * Constants.CELL_INSET));
    this.addMouseListener(this);
  }

  public String toString()
  {
    StringBuffer sb = new StringBuffer();
    for(int i=0; i<arrows.size(); i++)
    {
      sb.append(((Integer)arrows.elementAt(i)).toString());
      sb.append("|");
    }
    return sb.toString();
  }

  public void setContentFromString(String s)
  {
    arrows.removeAllElements();
    StringTokenizer st = new StringTokenizer(s, "|");
    while(st.hasMoreTokens())
      arrows.addElement(new Integer(st.nextToken()));
  }

  public void paint(Graphics g)
  {
    //if(gf.isMoving())
    //  return;

    Graphics2D g2 = (Graphics2D)g;
    g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
    g.setColor(Color.black);
    g.fillRect(0, 0, Constants.ARROWS_MAX * Constants.CELL_SIZE + 8 * Constants.CELL_INSET,
               Constants.CELL_SIZE + 2 * Constants.CELL_INSET);
    for(int i=0; i<Constants.ARROWS_MAX; i++)
    {
      if(arrows.size() > i)
      {
        int orientation = ((Integer)arrows.elementAt(i)).intValue();
        drawArrow(g, Constants.CELL_INSET + i*Constants.CELL_SIZE, Constants.CELL_INSET, orientation);
        if(selectedArrow == i)
        {
          g.setColor(Color.white);
          g.drawRect(Constants.CELL_INSET + i*Constants.CELL_SIZE, Constants.CELL_INSET,
                     Constants.CELL_SIZE, Constants.CELL_SIZE);
        }
      }
      else
      {
        int x = i * Constants.CELL_SIZE + Constants.CELL_INSET + 1;
        int y = Constants.CELL_INSET;
        int x1 = x + Constants.CELL_SIZE - 2*Constants.CELL_INSET;
        int y1 = Constants.CELL_SIZE - 2*Constants.CELL_INSET;
        int size = Constants.CELL_SIZE - 2*Constants.CELL_INSET;

        Paint gradient = new GradientPaint(x, y, Color.blue, x1, y1, Color.black);
        g2.setPaint(gradient);

        g.fillRect(x, y, size, size + 2*Constants.CELL_INSET);
      }
    }
  }

  public static final void drawArrow(Graphics g, int x, int y, int orientation)
  {
    Color backup = g.getColor();

    g.setColor(Constants.ARROW_BACKGROUND_COLOR);
    g.fillRect(x + Constants.CELL_INSET,
               y + Constants.CELL_INSET,
               Constants.CELL_SIZE - 2 * Constants.CELL_INSET,
               Constants.CELL_SIZE - 2 * Constants.CELL_INSET);

    g.setColor(Constants.ARROW_FOREGROUND_COLOR);
    int[] xx = new int[3];
    int[] yy = new int[3];
    int xr = 0;
    int yr = 0;
    int wr = 0;
    int hr = 0;
    switch(orientation)
    {
      case Constants.ORIENTATION_UP :
      case Constants.ORIENTATION_DOWN :
      {
        xx[0] = x + Constants.CELL_SIZE / 2;
        xx[1] = x + Constants.ARROW_INSET;
        xx[2] = x + Constants.CELL_SIZE - Constants.ARROW_INSET;
        yy[0] = orientation == Constants.ORIENTATION_UP ? y + Constants.ARROW_INSET : y  + Constants.CELL_SIZE - Constants.ARROW_INSET;
        yy[1] = orientation == Constants.ORIENTATION_UP ? y + Constants.CELL_SIZE / 3 * 2 : y + Constants.CELL_SIZE / 3;
        yy[2] = yy[1];
        xr = x + Constants.CELL_SIZE / 3;
        wr = Constants.CELL_SIZE / 3;
        yr = orientation == Constants.ORIENTATION_UP ? y + Constants.CELL_SIZE / 2 : y + Constants.ARROW_INSET;
        hr = Constants.CELL_SIZE / 2 - Constants.ARROW_INSET;
        break;
      }
      case Constants.ORIENTATION_LEFT :
      case Constants.ORIENTATION_RIGHT :
      {
        yy[0] = y + Constants.CELL_SIZE / 2;
        yy[1] = y + Constants.ARROW_INSET;
        yy[2] = y + Constants.CELL_SIZE - Constants.ARROW_INSET;
        xx[0] = orientation == Constants.ORIENTATION_LEFT ? x + Constants.ARROW_INSET : x  + Constants.CELL_SIZE - Constants.ARROW_INSET;
        xx[1] = orientation == Constants.ORIENTATION_LEFT ? x + Constants.CELL_SIZE / 3 * 2 : x + Constants.CELL_SIZE / 3;
        xx[2] = xx[1];
        yr = y + Constants.CELL_SIZE / 3;
        hr = Constants.CELL_SIZE / 3;
        xr = orientation == Constants.ORIENTATION_LEFT ? x + Constants.CELL_SIZE / 2 : x + Constants.ARROW_INSET;
        wr = Constants.CELL_SIZE / 2 - Constants.ARROW_INSET;
        break;
      }
    }
    g.fillPolygon(xx, yy, 3);
    g.fillRect(xr, yr, wr, hr);

    g.setColor(backup);
  }

  public void clearArrows() { arrows.removeAllElements(); }

  public void removeSelectedArrow()
  {
    arrows.removeElementAt(selectedArrow);
    selectedArrow = -1;
    repaint();
  }

  public void addArrow(int orientation)
  {
    arrows.addElement(new Integer(orientation));
    selectedArrow = -1;
    repaint();
    this.getParent().repaint();
  }

  public void mouseReleased(MouseEvent me)
  {
    if(gf != null && gf.isMoving())
      return;
    boolean rightButton = me.isPopupTrigger();
    int x = me.getX() / Constants.CELL_SIZE; // x = 0, 1, 2, 3

    if(ef != null) // editor mode
    {
      if(rightButton)
      {
        if(arrows.size() > 0)
          arrows.removeElementAt(arrows.size() - 1);
      }
      else
      {
        if(ef.state == Constants.STATE_ARROW && arrows.size() < Constants.ARROWS_MAX)
        {
          arrows.addElement(new Integer(ef.orientation));
        }
      }
    }
    else // game mode
    {
      if(!rightButton)
      {
        if(arrows.size() > x)
          selectedArrow = x;
      }
    }

    repaint();
    this.getParent().repaint();
  }

  public void mouseExited(MouseEvent me) { ; }
  public void mouseEntered(MouseEvent me) { ; }
  public void mouseClicked(MouseEvent me) { ; }
  public void mousePressed(MouseEvent me) { ; }
}