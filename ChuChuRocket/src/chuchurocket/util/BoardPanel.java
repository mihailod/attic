package chuchurocket.util;

import java.awt.*;
import java.awt.image.*;
import java.awt.event.*;
import javax.swing.*;

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

public class BoardPanel extends JPanel implements MouseListener
{
  private Board b = null;
  public Board getBoard() { return b; }
  private EditorFrame ef = null;
  private GameFrame gf = null;
  private static Image buffer = null;
  public static Graphics gr = null;

  private static int w = 0;
  private static int h = 0;

  public BoardPanel(Board b, EditorFrame ef, GameFrame gf)
  {
    super(true);
    this.b = b;
    this.addMouseListener(this);
    this.ef = ef;
    this.gf = gf;
    this.w = Constants.GAME_FIELD_WIDTH * Constants.CELL_SIZE + Constants.WALL_WIDTH;
    this.h = Constants.GAME_FIELD_HEIGHT * Constants.CELL_SIZE + Constants.WALL_WIDTH;
    this.setPreferredSize(new Dimension(w, h));
    this.buffer = new BufferedImage(w, h, BufferedImage.TYPE_INT_RGB);
    this.gr = buffer.getGraphics();
  }

  public void update(Graphics g) { paint(g); }
  public void paint(Graphics g)
  {
    ((Graphics2D)gr).setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
    gr.drawImage(Media.IMAGE_BOARD, Constants.WALL_WIDTH2, Constants.WALL_WIDTH2, null);
    drawStatics(gr);
    if(gf != null && gf.isMoving())
      GameEngine.drawSprites(gr);
    g.drawImage(buffer, 0, 0, w, h, this);
  }

  private final void drawStatics(Graphics g)
  {
    boolean even = false;
    for(int j=0; j<Constants.GAME_FIELD_HEIGHT; j++)
    {
      int y = j*Constants.CELL_SIZE;
      for(int i=0; i<Constants.GAME_FIELD_WIDTH; i++)
      {
        int x = i*Constants.CELL_SIZE;

        //even = (i & 1) == 0;
        //if((j & 1) != 0)
        //  even = !even;
        //Color c = even ? Constants.CELL_EVEN_COLOR : Constants.CELL_ODD_COLOR;
        //Paint gradient = new GradientPaint(x + Constants.WALL_WIDTH2, y + Constants.WALL_WIDTH2,
        //   c, x + Constants.CELL_SIZE, y + Constants.CELL_SIZE, Color.white, true);
        //((Graphics2D)g).setPaint(gradient);
        //((Graphics2D)g).setPaint(gradient);
        //  g.fillRect(x + Constants.WALL_WIDTH2, y + Constants.WALL_WIDTH2,
        //             x + Constants.CELL_SIZE, y + Constants.CELL_SIZE);

        b.board[j][i].draw(g, x + Constants.WALL_WIDTH2, y + Constants.WALL_WIDTH2, gf != null && gf.isMoving());
      }
    }

    for(int j=0; j<Constants.GAME_FIELD_HEIGHT; j++)
    {
      int y = j*Constants.CELL_SIZE + Constants.WALL_WIDTH2;
      for(int i=0; i<Constants.GAME_FIELD_WIDTH; i++)
      {
        int x = i*Constants.CELL_SIZE + Constants.WALL_WIDTH2;
        b.board[j][i].drawWalls(g, x, y);
      }
    }
  }

  public void mouseReleased(MouseEvent me)
  {
    if(gf != null && gf.isMoving())
      return;
    boolean rightButton = me.isPopupTrigger();
    int x = (me.getX() - Constants.WALL_WIDTH2) / Constants.CELL_SIZE;
    int y = (me.getY() - Constants.WALL_WIDTH2) / Constants.CELL_SIZE;

    BoardElement be = b.board[y][x];

    if(ef != null) // editor mode
    {
      if(rightButton) // deleting objects (or walls), one by one for each click
      {
        if(be.content != Constants.STATE_NOTHING)
        {
          be.content = Constants.STATE_NOTHING;
          be.orientation = Constants.ORIENTATION_NONE;
        }
        else
        {
          // "up"
          if(y > 0 && b.board[y-1][x].wallDown)
            b.board[y-1][x].wallDown = false;
          else
          {
            if(be.wallRight)
              be.wallRight = false;
            else
            {
              if(be.wallDown)
                be.wallDown = false;
              else
              {
                // "left"
                if(x > 0 && b.board[y][x-1].wallRight)
                {
                  BoardElement beLeft = b.board[y][x-1];
                    beLeft.wallRight = false;
                }
              }
            }
          }
        }
      }
      else // adding an object (or a wall)
      {
        if(ef.state != Constants.STATE_ARROW) // can't draw arrows in editor here
        {
          if(ef.state == Constants.STATE_WALL)
          {
            if(ef.orientation == Constants.ORIENTATION_DOWN)
              be.wallDown = true;
            else if(ef.orientation == Constants.ORIENTATION_RIGHT)
              be.wallRight = true;
            else if(ef.orientation == Constants.ORIENTATION_LEFT && x > 0) // "left"
            {
              BoardElement beLeft = b.board[y][x-1];
              beLeft.wallRight = true;
            }
            else if(ef.orientation == Constants.ORIENTATION_UP && y > 0) // "up"
            {
              BoardElement beUp = b.board[y-1][x];
              beUp.wallDown = true;
            }
          }
          else
          {
            be.content = ef.state;
            be.orientation = ef.orientation;
          }
        }
      }
    }
    else // game mode, only arrows are allowed
    {
      if(rightButton) // delete arrow
      {
        if(be.contentArrow > -1)
        {
          gf.getArrowsPanel().addArrow(be.contentArrow);
          be.contentArrow = -1;
          gf.getArrowsPanel().setLastArrowAsSelected();
        }
      }
      else // add arrow
      {
        if(gf.getArrowsPanel().getSelectedArrow() >= 0 &&
           be.contentArrow < 0 &&
           be.content != Constants.STATE_HOLE &&
           be.content != Constants.STATE_ROCKET)
        {
          be.contentArrow = gf.getArrowsPanel().getSelectedArrow();
          gf.getArrowsPanel().removeSelectedArrow();
        }
      }
    }
    repaint();
  }

  public void mouseExited(MouseEvent me) { ; }
  public void mouseEntered(MouseEvent me) { ; }
  public void mouseClicked(MouseEvent me) { ; }
  public void mousePressed(MouseEvent me) { ; }

  public void setBoard(Board b)
  {
    this.b = b;
  }
}