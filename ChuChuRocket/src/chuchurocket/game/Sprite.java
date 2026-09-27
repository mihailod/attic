package chuchurocket.game;

import java.awt.*;

import chuchurocket.util.*;

/**
 * <p>Title: ChuChu Rocket</p>
 * <p>Description: A java port of a well known SEGA's game for Dreamcast</p>
 * <p>Copyright: Copyright (c) 2003 Mihailo Despotovic (game idea (c)SEGA)</p>
 * <p>Company: </p>
 * @author Mihailo Despotovic
 * @version 1.0
 */

public class Sprite
{
  private int content = -1;
  public int orientation = -1;
  public int speed = -1;

  private int x = -1;
  private int y = -1;
  private int arrow = -1;

  public int i = 0;
  public int j = 0;

  private int oldI = 0;
  private int oldJ = 0;
  private boolean newCell = false;

  private int posX = -1;
  private int posY = -1;

  private int hotX = x;
  private int hotY = y;

  private boolean wallDown = false;
  private boolean wallRight = false;
  private boolean wallUp = false;
  private boolean wallLeft = false;

  //private int arrow = 0;

  public static Board b = null;

  public Sprite(int content, int x, int y, int orientation, int speed)
  {
    this.content = content;
    this.x = x;
    this.y = y;
    this.orientation = orientation;
    this.speed = speed;
  }

  public final void move()
  {
    calculate();
    switch(orientation)
    {
      case Constants.ORIENTATION_DOWN :
      {
        y += speed;
        if(!newCell)
          return;
        if(wallDown && y > posY)
        {
          y = posY;
          orientation = Constants.ORIENTATION_LEFT;
          x -= speed;
        }
        break;
      }
      case Constants.ORIENTATION_UP :
      {
        y -= speed;
        if(!newCell)
          return;
        if(wallUp && y < posY)
        {
          y = posY;
          orientation = Constants.ORIENTATION_RIGHT;
          x += speed;
        }
        break;
      }
      case Constants.ORIENTATION_LEFT :
      {
        x -= speed;
        if(!newCell)
          return;
        if(wallLeft && x < posX)
        {
          x = posX;
          orientation = Constants.ORIENTATION_UP;
          y -= speed;
        }
        break;
      }
      case Constants.ORIENTATION_RIGHT :
      {
        x += speed;
        if(!newCell)
          return;
        if(wallRight && x > posX)
        {
          x = posX;
          orientation = Constants.ORIENTATION_DOWN;
          y += speed;
        }
        break;
      }
      default : { System.out.println("what?"); }
    }
  }

  public final void draw(Graphics g)
  {
    switch(content)
    {
      case Constants.STATE_MOUSE : BoardElement.drawMouse(g, x, y, orientation); break;
      case Constants.STATE_CAT : BoardElement.drawCat(g, x, y, orientation); break;
    }
  }

  private synchronized final void calculate()
  {
    // compute the cell the sprite is in
    i = x/Constants.CELL_SIZE;
    j = y/Constants.CELL_SIZE;

    // compute the "snap to grid" coordinates
    posX = i*Constants.CELL_SIZE;
    posY = j*Constants.CELL_SIZE;

    // check which walls the sprite is surrounded with
    wallDown = b.board[j][i].wallDown;
    wallRight = b.board[j][i].wallRight;
    wallUp = j == 0 || j > 0 && b.board[j-1][i].wallDown;
    wallLeft = i == 0 || i > 0 && b.board[j][i-1].wallRight;

    // compute the hot spots for direction change by arrows
    hotX = x;
    hotY = y;
    if(orientation == Constants.ORIENTATION_LEFT)
      hotX = x + Constants.CELL_SIZE - Constants.CELL_INSET * 2;
    if(orientation == Constants.ORIENTATION_UP)
      hotY = y + Constants.CELL_SIZE - Constants.CELL_INSET * 2;

    // compute the cell the sprite is in according to hot spots
    int myi = hotX/Constants.CELL_SIZE;
    int myj = hotY/Constants.CELL_SIZE;
    if(myi > Constants.GAME_FIELD_WIDTH - 1)
      myi = Constants.GAME_FIELD_WIDTH - 1;
    if(myj > Constants.GAME_FIELD_HEIGHT - 1)
      myj = Constants.GAME_FIELD_HEIGHT - 1;
    if(myi < 0)
      myi = 0;
    if(myj < 0)
      myj = 0;

    if(oldI != myi)
    {
      newCell = true;
      oldI = myi;
    }
    else if(oldJ != myj)
    {
      newCell = true;
      oldJ = myj;
    }
    else
      newCell = false;

    if(newCell)
    {
      System.out.println("hotX=" + hotX);
      System.out.println("i=" + myi + "j=" + j + " arr " + b.board[myj][myi].contentArrow);
    }

    arrow = b.board[myj][myi].contentArrow;

    // obey the arrow (if there is an arrow)
    if(b.board[myj][myi].contentArrow > 0)
      orientation = b.board[myj][myi].contentArrow;
  }
}