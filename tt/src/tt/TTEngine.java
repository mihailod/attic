package tt;

import java.awt.*;
import java.util.*;

public class TTEngine
{
  // internal statics
  public static final int EMPTY = 0; // empty field
  public static final int X = 1; // "X" piece
  public static final int O = 2; // "O" piece
  private TTFrame f;

  // game states
  public static final int COMPUTER_WON = 0;
  public static final int USER_WON = 1;
  public static final int DRAW = 2;
  private static final int KEEP_PLAYING = -1;

  // other internal variables
  public TTBoard board = null; // the board
  public boolean computerFirst = false; // whether computer played first or not
  public int moveCounter = 1; // the current move
  public int gameState = KEEP_PLAYING; // the state of the game
  private TTBoard[] history = new TTBoard[13]; // if 1 == 5 == 9 == 13  =>  draw

  FieldFlasherThread t = null;

  /**
   * The constructor
   */
  public TTEngine(TTFrame f)
  {
    board = new TTBoard();
    this.f = f;
  }

  /**
   * Resets the board
   */
  public void resetBoard()
  {
    board = new TTBoard();
    moveCounter = 1;
    this.gameState = KEEP_PLAYING;
    if(t != null)
      t.stopFlashing();
  }

  /**
   * User's move implementation
   * Updates the game state
   * @return true if the move was valid
   */
  public boolean play(int field, int prevField)
  {
    int i = field / TTBoard.SIZE;
    int j = field - TTBoard.SIZE * i;

    int iPrev = prevField / TTBoard.SIZE;
    int jPrev = prevField - TTBoard.SIZE * iPrev;

    if(isOpening())
    {
      if(board.board[i][j] == EMPTY)
      {
        board.board[i][j] = getUserPiece();
        f.log("'" + getPieceGUI(getUserPiece()) + "' played on " + (char)('A' + i) + "" + (j+1));
        moveCounter++;
        updateGameState();
        return true;
      }
      else
        return false;
    }
    else
    {
      if(board.board[iPrev][jPrev] == getUserPiece() && // can move it's own pieces only...
         board.board[i][j] == EMPTY && // ...to unoccupied...
         canMoveHere(iPrev, jPrev, i, j)) // ...AND adjacent fileds
      {
        board.board[iPrev][jPrev] = EMPTY;
        board.board[i][j] = getUserPiece();
        f.log("'" + getPieceGUI(getUserPiece()) + "' played " +
              (char)('A' + jPrev) + "" + (iPrev+1) + "-" +
              (char)('A' + j) + "" + (i+1));
        moveCounter++;
        updateGameState();
        return true;
      }
      else
        return false;
    }
  }

  /**
   * Return all immediate successors from a given position
   */
  private Vector getAllSuccessors(TTBoard b, int player)
  {
    // todo...
    return new Vector();
  }

  /**
   * Returns the internal representation of computer's piece
   */
  public int getComputerPiece()
  {
    //return computerFirst ? X : O;
    return moveCounter % 2 == 0 ? X : O;
  }

  /**
   * Returns the internal representation of user's piece
   */
  public int getUserPiece()
  {
    //return computerFirst ? O : X;
    return moveCounter % 2 == 0 ? O : X;
  }

  /**
   * Returns the representaion of the piece on the board
   */
  public static String getPieceGUI(int i)
  {
    switch(i)
    {
      case X : return "X";
      case O : return "O";
      default : return "";
    }
  }

  /**
   * Getter for the gameState
   */
  public int getGameState()
  {
    return gameState;
  }

  /**
   * Updates the game state
   */
  public void updateGameState()
  {
    pushPosition();

    if(board.hasFour(getComputerPiece()))
    {
      gameState = COMPUTER_WON;
      return;
    }

    if(board.hasFour(getUserPiece()))
    {
      gameState = USER_WON;
      return;
    }

    if(isDraw())
    {
      gameState = DRAW;
      return;
    }

    // calculate the next best position (covers both opening and the real game)
    board.calculateNextBestPosition(getUserPiece(), isOpening(), moveCounter);

    // stop the previous thread (if any)
    if(t != null)
    {
      t.stopFlashing();
      t = null;
    }
    if(board.nextBestPosition != null)
    {
      // create and start a new one (old button is present only if not in opening phase)
      Button newB = f.buttons[board.nextBestPosition.newX][board.nextBestPosition.newY];
      Button oldB = isOpening() ? null : f.buttons[board.nextBestPosition.oldX][board.nextBestPosition.oldY];
      boolean adviseX = f.adviseBoth.getState() || f.adviseX.getState();
      boolean adviseO = f.adviseBoth.getState() || f.adviseO.getState();
      t = new FieldFlasherThread(oldB, newB, moveCounter, adviseX, adviseO);
      t.start();
    }
    else
      f.log("Sorry, no advice for this position");
    f.log("'" + getPieceGUI(getUserPiece()) + "' is on the move..");
  }

  /**
   * Checks if the game is in it's opening phase (first 8 moves) or not
   */
  private boolean isOpening()
  {
    return moveCounter < 9;
  }

  /**
   * Checks if a move is valid
   */
  private boolean canMoveHere(int fromX, int fromY, int toX, int toY)
  {
    int xDiff = Math.abs(fromX - toX);
    int yDiff = Math.abs(fromY - toY);

    if(xDiff == 0 && yDiff == 0) // can't move on the same spot
      return false;

    if(xDiff > 1 || yDiff > 1) // can't move more than 1 field away
      return false;

    return true;
  }

  /**
   * Pushes the current position into the history
   */
  private void pushPosition()
  {
    for(int i=1; i<history.length; i++)
    {
      if(history[i] != null)
      {
        TTBoard temp = new TTBoard(history[i]);
        history[i-1] = temp;
      }
    }
    history[history.length-1] = new TTBoard(board);
  }

  /**
   * Checks if the last 3 moves were repeated ones.  This is a draw.
   */
  private boolean isDraw()
  {
    for(int i=0; i<5; i++)
    {
      if(!TTBoard.sameBoards(history[i], history[i+4]) ||
         !TTBoard.sameBoards(history[i+4], history[i+8]))
        return false;
    }
    return true;
  }

  /*private void dumpHistory()
  {
    for(int i=0; i<history.length; i++)
    {
      System.out.println(i);
      TTBoard.dumpBoard(history[i]);
      System.out.println("===");
    }
  }*/
}

