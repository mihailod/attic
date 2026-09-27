package chuchurocket.util;

import java.awt.*;
import java.util.*;

/**
 * <p>Title: ChuChu Rocket</p>
 * <p>Description: A java port of a well known SEGA's game for Dreamcast</p>
 * <p>Copyright: Copyright (c) 2003 Mihailo Despotovic (game idea (c)SEGA)</p>
 * <p>Company: </p>
 * @author Mihailo Despotovic
 * @version 1.0
 */

public class BoardElement
{
  public int content = Constants.STATE_NOTHING;
  public int orientation = Constants.ORIENTATION_NONE;
  public int contentArrow = -1;

  public boolean wallDown = false;
  public boolean wallRight = false;

  private static Composite cBackup = null;

  public BoardElement(int content, int orientation)
  {
    this.content = content;
    this.orientation = orientation;
  }

  public BoardElement(String s)
  {
    StringTokenizer st = new StringTokenizer(s, "|");
    content = Integer.parseInt(st.nextToken());
    orientation = Integer.parseInt(st.nextToken());
    String walls = st.nextToken();
    if(walls.charAt(0) == '1')
      wallDown = true;
    if(walls.charAt(1) == '1')
      wallRight = true;
  }

  public String toString()
  {
    return content + "|" + orientation + "|" +
           (wallDown ? "1" : "0") + (wallRight ? "1" : "0");
  }

  public void draw(Graphics g, int x, int y, boolean hideCatsAndMice)
  {
    // static content
    if(contentArrow > -1)
    {
      ArrowsPanel.drawArrow(g, x, y, contentArrow);
      cBackup = ((Graphics2D)g).getComposite(); // optimize this
      ((Graphics2D)g).setComposite(Constants.COMPOSITE);
    }

    if(content != Constants.STATE_NOTHING)
    {
      switch(content)
      {
        case Constants.STATE_ROCKET :
        {
          g.drawImage(Media.IMAGE_CHEESE, x + Constants.CELL_INSET, y + Constants.CELL_INSET, null);
          break;
        }
        case Constants.STATE_HOLE :
        {
          g.drawImage(Media.IMAGE_SKULL, x + Constants.CELL_INSET, y + Constants.CELL_INSET, null);
          break;
        }
        case Constants.STATE_ARROW : ArrowsPanel.drawArrow(g, x, y, orientation); break;
      }

      if(!hideCatsAndMice)
      {
        if(content == Constants.STATE_MOUSE)
          drawMouse(g, x, y, orientation);
        else if(content == Constants.STATE_CAT)
          drawCat(g, x, y, orientation);
      }
    }

    if(cBackup != null)
      ((Graphics2D)g).setComposite(cBackup);
  }

  public static final void drawMouse(Graphics g, int x, int y, int orientation)
  {
    switch(orientation)
    {
      case Constants.ORIENTATION_UP :
      {
        g.setColor(Constants.MOUSE_COLOR_BODY);
        Constants.fillCircle(g, x + Constants.CELL_SIZE2,
                             y + Constants.CELL_SIZE2,
                             Constants.MOUSE_FATNESS/2);

        g.setColor(Constants.MOUSE_COLOR_TAIL);
        g.fillRect(x + Constants.CELL_SIZE2 - 1,
                   y + Constants.MOUSE_FATNESS + (Constants.CELL_SIZE - Constants.MOUSE_FATNESS)/2 - Constants.CELL_SIZE/6,
                   3, Constants.CELL_SIZE/10);
        g.fillRect(x + Constants.CELL_SIZE2,
                   y + Constants.MOUSE_FATNESS + (Constants.CELL_SIZE - Constants.MOUSE_FATNESS)/2 - Constants.CELL_SIZE/15,
                   1, Constants.CELL_SIZE/6);

        g.setColor(Constants.MOUSE_COLOR_EARS);
        int yEar = y + Constants.CELL_SIZE/3;
        int xEar = x + Constants.CELL_SIZE/3;
        // left ear
        Constants.fillCircle(g, xEar, yEar, Constants.MOUSE_EAR_SIZE/2);
        // right ear
        xEar = x + Constants.CELL_SIZE/3*2;
        Constants.fillCircle(g, xEar, yEar, Constants.MOUSE_EAR_SIZE/2);
        break;
      }
      case Constants.ORIENTATION_DOWN :
      {
        g.setColor(Constants.MOUSE_COLOR_EARS);
        int yEar = y + Constants.CELL_SIZE/3;
        int xEar = x + Constants.CELL_SIZE/3;
        // left ear
        Constants.fillCircle(g, xEar, yEar, Constants.MOUSE_EAR_SIZE/2);
        // right ear
        xEar = x + Constants.CELL_SIZE/3*2;
        Constants.fillCircle(g, xEar, yEar, Constants.MOUSE_EAR_SIZE/2);

        g.setColor(Constants.MOUSE_COLOR_BODY);
        Constants.fillCircle(g, x + Constants.CELL_SIZE2,
                             y + Constants.CELL_SIZE2,
                             Constants.MOUSE_FATNESS/2);

        g.setColor(Constants.MOUSE_COLOR_EYES);
        int yEye = y + Constants.CELL_SIZE/2;
        int xEye = x + Constants.CELL_SIZE/7*3 - 1;
        // left eye
        g.fillOval(xEye, yEye - Constants.MOUSE_EYE_SIZE,
                   Constants.MOUSE_EYE_SIZE,
                   2*Constants.MOUSE_EYE_SIZE);
        // rigth eye
        xEye = x + Constants.CELL_SIZE/7*4;
        g.fillOval(xEye, yEye - Constants.MOUSE_EYE_SIZE,
                   Constants.MOUSE_EYE_SIZE,
                   2*Constants.MOUSE_EYE_SIZE);
        break;
      }
      case Constants.ORIENTATION_LEFT :
      case Constants.ORIENTATION_RIGHT :
      {
        g.setColor(Constants.MOUSE_COLOR_TAIL);
        if(orientation == Constants.ORIENTATION_LEFT)
          g.drawLine(x + Constants.CELL_SIZE2, y + Constants.CELL_SIZE/2,
                     x + Constants.CELL_SIZE2 + (int)(Constants.MOUSE_FATNESS*1.41/3 + 2),
                     y + Constants.CELL_SIZE2 + (int)(Constants.MOUSE_FATNESS*1.41/3 + 2));
        else
          g.drawLine(x + Constants.CELL_SIZE2, y + Constants.CELL_SIZE/2,
                     x + Constants.CELL_SIZE2 - (int)(Constants.MOUSE_FATNESS*1.41/3 + 2),
                     y + (int)(Constants.CELL_SIZE2 + Constants.MOUSE_FATNESS*1.41/3 + 2));

        g.setColor(Constants.MOUSE_COLOR_BODY);
        Constants.fillCircle(g, x + Constants.CELL_SIZE2,
                             y + Constants.CELL_SIZE2, Constants.MOUSE_FATNESS/2);

        g.setColor(Constants.MOUSE_COLOR_EARS);
        int yEar = y + Constants.CELL_SIZE/3;
        int xEar = x + Constants.CELL_SIZE/3;
        // left ear
        if(orientation == Constants.ORIENTATION_RIGHT)
          Constants.fillCircle(g, xEar, yEar, Constants.MOUSE_EAR_SIZE/2);
        // right ear
        else
        {
          xEar = x + Constants.CELL_SIZE/3*2;
          Constants.fillCircle(g, xEar, yEar, Constants.MOUSE_EAR_SIZE/2);
        }

        g.setColor(Constants.MOUSE_COLOR_EYES);
        int yEye = y + Constants.CELL_SIZE2;
        int xEye = x + Constants.CELL_SIZE/7*3 - 1;
        // left eye
        if(orientation == Constants.ORIENTATION_LEFT)
          g.fillOval(xEye, yEye - Constants.MOUSE_EYE_SIZE,
                     Constants.MOUSE_EYE_SIZE, 2*Constants.MOUSE_EYE_SIZE);
        // rigth eye
        else
        {
          xEye = x + Constants.CELL_SIZE/7*4;
          g.fillOval(xEye, yEye - Constants.MOUSE_EYE_SIZE,
                     Constants.MOUSE_EYE_SIZE, 2*Constants.MOUSE_EYE_SIZE);
        }
      }
    }
  }

  private static final int CLEFT = 180 - 25 + 45;
  private static final int CUP = 90 - 25 + 45;
  private static final int CDOWN = 270 - 25 + 45;
  private static final int CAT_FATNESS2 = Constants.CAT_FATNESS/2;

  public static final void drawCat(Graphics g, int x, int y, int orientation)
  {
    g.setColor(Constants.CAT_COLOR);
    int startArc = 0;

    if(orientation == Constants.ORIENTATION_RIGHT)
      startArc = 25;
    else if(orientation == Constants.ORIENTATION_LEFT)
      startArc = CLEFT;
    else if(orientation == Constants.ORIENTATION_UP)
      startArc = CUP;
    else if(orientation == Constants.ORIENTATION_DOWN)
      startArc = CDOWN;

    g.fillArc(x + Constants.CELL_SIZE2 - CAT_FATNESS2,
              y + Constants.CELL_SIZE2 - CAT_FATNESS2,
              Constants.CAT_FATNESS, Constants.CAT_FATNESS, startArc, 315);
  }

  public void drawWalls(Graphics g, int x, int y)
  {
    // walls
    g.setColor(Constants.WALL_COLOR);
    // special left wall
    if(x == Constants.WALL_WIDTH2)
      drawVerticalWall(g, x, y);
    // special upper wall
    if(y == Constants.WALL_WIDTH2)
      drawHorizontalWall(g, x, y);
    if(wallDown)
      drawHorizontalWall(g, x, y + Constants.CELL_SIZE);
    if(wallRight)
      drawVerticalWall(g, x + Constants.CELL_SIZE, y);
  }

  private void drawHorizontalWall(Graphics g, int x, int y)
  {
    g.fillRect(x, y - Constants.WALL_WIDTH2, Constants.CELL_SIZE, Constants.WALL_WIDTH);
    g.fillOval(x - Constants.WALL_WIDTH2, y - Constants.WALL_WIDTH,
               Constants.WALL_WIDTH, Constants.WALL_WIDTHD);
    g.fillOval(x - Constants.WALL_WIDTH2 + Constants.CELL_SIZE, y - Constants.WALL_WIDTH,
               Constants.WALL_WIDTH, Constants.WALL_WIDTHD);
  }

  private void drawVerticalWall(Graphics g, int x, int y)
  {
    g.fillRect(x - Constants.WALL_WIDTH2, y, Constants.WALL_WIDTH, Constants.CELL_SIZE);
    g.fillOval(x - Constants.WALL_WIDTH, y - Constants.WALL_WIDTH2,
               Constants.WALL_WIDTHD, Constants.WALL_WIDTH);
    g.fillOval(x - Constants.WALL_WIDTH, y - Constants.WALL_WIDTH2 + Constants.CELL_SIZE,
               Constants.WALL_WIDTHD, Constants.WALL_WIDTH);
  }
}