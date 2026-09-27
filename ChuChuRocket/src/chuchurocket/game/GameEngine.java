package chuchurocket.game;

import java.awt.*;
import java.util.*;
import javax.swing.*;

import chuchurocket.util.*;

/**
 * <p>Title: ChuChu Rocket</p>
 * <p>Description: A java port of a well known SEGA's game for Dreamcast</p>
 * <p>Copyright: Copyright (c) 2003 Mihailo Despotovic (game idea (c)SEGA)</p>
 * <p>Company: </p>
 * @author Mihailo Despotovic
 * @version 1.0
 */

public class GameEngine
{
  public static boolean moving = false;

  private BoardPanel bp = null;
  private Board b = null;
  private static ArrayList mice = null;
  private static ArrayList cats = null;
  private static Graphics g = null;

  private ListIterator li = null;
  private ListIterator li2 = null;
  private int pointer = -1;
  private boolean noMice = false;
  private Sprite sprite = null;
  private Sprite sprite2 = null;

  private static int speedMouse = Constants.SPEED_MOUSE;
  private static int speedCat = Constants.SPEED_CAT;

  public void setBoardPanel(BoardPanel boardPanel)
  {
    this.bp = boardPanel;
    this.b = boardPanel.getBoard();
    mice = new ArrayList();
    cats = new ArrayList();
    for(int j=0; j<Constants.GAME_FIELD_HEIGHT; j++)
    {
      int y = j*Constants.CELL_SIZE + Constants.WALL_WIDTH2;
      for(int i=0; i<Constants.GAME_FIELD_WIDTH; i++)
      {
        int x = i*Constants.CELL_SIZE + Constants.WALL_WIDTH2;
        BoardElement be = b.board[j][i];
        if(be.content == Constants.STATE_MOUSE)
          mice.add(new Sprite(Constants.STATE_MOUSE, x, y, be.orientation, Constants.SPEED_MOUSE));
        else if(be.content == Constants.STATE_CAT)
          cats.add(new Sprite(Constants.STATE_CAT, x, y, be.orientation, Constants.SPEED_CAT));
      }
    }
    Sprite.b = b;
  }

  public void start()
  {
    if(!moving)
    {
      speedMouse = Constants.SPEED_MOUSE;
      speedCat = Constants.SPEED_CAT;
      updateSpeed();
      moving = true;
      startMoving();
      bp.repaint();
    }
  }

  public void dash()
  {
    speedMouse = Constants.SPEED_MOUSE * Constants.SPEED_MULTIPLIER;
    speedCat = Constants.SPEED_CAT * Constants.SPEED_MULTIPLIER;
    updateSpeed();
    if(!moving)
    {
      moving = true;
      startMoving();
      bp.repaint();
    }
  }

  public void reset()
  {
    moving = false;
    stopMoving();
    bp.repaint();
  }

  private void updateSpeed()
  {
    li = mice.listIterator();
    while(li.hasNext())
    {
      sprite = (Sprite)li.next();
      if(sprite != null)
        sprite.speed = speedMouse;
    }
    li = cats.listIterator();
    while(li.hasNext())
    {
      sprite = (Sprite)li.next();
      if(sprite != null)
        sprite.speed = speedCat;
    }
  }

  private void startMoving()
  {
    Thread t = new Thread()
    {
      public void run()
      {
        int counter = 0;
        while(true) // the main game loop
        {
          counter++;
          if(!moving)
            break;
          if(counter == 4) // paint every 4th frame
          {
            bp.repaint();
            counter = 0;
          }
          moveSprites();
          Thread.currentThread().yield();
          try { Thread.sleep(Constants.TIME_DELAY4); }
          catch(InterruptedException ie) { ; }
        }
      }
    };
    t.start();
  }

  private synchronized final void moveSprites()
  {
    // for all mice
    pointer = -1;
    li = mice.listIterator();
    while(li.hasNext())
    {
      sprite = (Sprite)li.next();
      pointer++;

      if(sprite == null)
        continue;

      // move the mouse
      sprite.move();

      // check if it's in the cheese -> remove it!
      if(b.board[sprite.j][sprite.i].content == Constants.STATE_ROCKET)
      {
         // && sprite.orientation == Constants.ORIENTATION_RIGHT || todo bugfix
        //sprite.orientation == Constants.ORIENTATION_DOWN)
        Media.SOUND_MOUSE_IN_CHEESE.play();
        mice.set(pointer, null);
      }
      // check if it's in the hole -> end game!
      else if(b.board[sprite.j][sprite.i].content == Constants.STATE_HOLE)
      {
        Media.SOUND_MOUSE_IN_HOLE.play();
        gameOver(sprite.j, sprite.i);
        return;
      }
    }

    // for all cats
    li = cats.listIterator();
    pointer = -1;
    while(li.hasNext())
    {
      sprite = (Sprite)li.next();
      pointer++;

      if(sprite == null)
        continue;

      // move the cat
      sprite.move();

      // is cat in cheese? -> end game!
      if(b.board[sprite.j][sprite.i].content == Constants.STATE_ROCKET)
      {
        Media.SOUND_CAT_IN_CHEESE.play();
        gameOver(sprite.j, sprite.i);
        return;
      }

      // is cat in hole? -> remove it!
      if(b.board[sprite.j][sprite.i].content == Constants.STATE_HOLE)
      {
        Media.SOUND_CAT_IN_HOLE.play();
        cats.set(pointer, null);
      }
    }

    li = mice.listIterator();
    noMice = true;
    while(li.hasNext())
    {
      sprite = ((Sprite)li.next());
      noMice = noMice && (sprite == null);
    }
    if(noMice)
    {
      levelWon();
      return;
    }

    // is any mouse caught by a cat? -> end game!
    li = mice.listIterator();
    while(li.hasNext())
    {
      sprite = ((Sprite)li.next());
      if(sprite == null)
        continue;

      li2 = cats.listIterator();
      while(li2.hasNext())
      {
        sprite2 = ((Sprite)li2.next());
        if(sprite2 == null)
          continue;

        if(sprite.i == sprite2.i && sprite.j == sprite2.j)
        {
          Media.SOUND_CAT_IN_MOUSE.play();
          gameOver(sprite.j, sprite.i);
          return;
        }
      }
    }
  }

  private void stopMoving()
  {
    setBoardPanel(bp); // recreate sprites at original positions
  }

  public static final void drawSprites(Graphics g)
  {
    Sprite sprite;
    ListIterator li = mice.listIterator();
    while(li.hasNext())
    {
      sprite = ((Sprite)li.next());
      if(sprite != null)
        sprite.draw(g);
    }
    li = cats.listIterator();
    while(li.hasNext())
    {
      sprite = ((Sprite)li.next());
      if(sprite != null)
        sprite.draw(g);
    }
  }

  private void gameOver(int i, int j)
  {
    JOptionPane.showMessageDialog(null, "Ouch!", "Ouch!", JOptionPane.INFORMATION_MESSAGE);
    /*moving = false;
    int x = Constants.CELL_SIZE*i + Constants.CELL_SIZE2;
    int y = Constants.CELL_SIZE*j + Constants.CELL_SIZE2;
    BoardPanel.gr.setColor(Color.white);
    Stroke stroke = ((Graphics2D)BoardPanel.gr).getStroke();
    ((Graphics2D)BoardPanel.gr).setStroke(new BasicStroke(5f));
    Constants.drawCircle(BoardPanel.gr, i, j, Constants.CELL_SIZE2);
    ((Graphics2D)BoardPanel.gr).setStroke(stroke);
    try { Thread.sleep(5000); }
    catch(InterruptedException ie) { ; }*/
    reset();
  }

  private void levelWon()
  {
    Media.SOUND_LEVEL_UP.play();
    JOptionPane.showMessageDialog(null, "Yeah!", "Yeah!", JOptionPane.INFORMATION_MESSAGE);
    reset();
  }
}