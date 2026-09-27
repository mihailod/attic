package ttt;

import java.awt.*;
import java.util.*;

public class tttEngine
{
  // internal statics
  private static final int EMPTY = 0; // empty field
  public static final int X = 1; // "X" piece
  public static final int O = 2; // "O" piece
  private static final int DEPTH = 8; // depth of search tree
  private tttFrame f;

  // game states
  public static final int COMPUTER_WON = 0;
  public static final int USER_WON = 1;
  public static final int DRAW = 2;
  public static final int KEEP_PLAYING = 3;

  // other internal variables
  public tttBoard board = null; // the board
  public boolean computerFirst = false; // whether computer played first or not
  public int moveCounter = 1; // the current move
  public int gameState = -1; // the state of the game

  int pruned = 0; // how many branches did we prune in a move

  /**
   * The constructor
   */
  public tttEngine(tttFrame f)
  {
    board = new tttBoard();
    this.f = f;
  }

  /**
   * Resets the board
   */
  public void resetBoard()
  {
    board = new tttBoard();
    moveCounter = 1;
  }

  /**
   * User's move implementation
   * Updates the game state
   * @return true if the move was valid
   */
  public boolean play(int field)
  {
    int i = field / 3;
    int j = field - 3 * i;
    if(board.board[i][j] == EMPTY)
    {
      board.board[i][j] = getUserPiece();
      moveCounter++;
      updateGameState();
      return true;
    }
    else return false;
  }

  /**
   * Computer's move implementation
   * Updates the game state
   */
  public void play()
  {
    // the very first move is a special one
    if(moveCounter == 1 ||
       moveCounter == 2 && board.board[1][1] == EMPTY)
    {
      board.board[1][1] = getComputerPiece();
      moveCounter++;
      updateGameState();
      return;
    }

    pruned = 0;

    // find all successors to the current position
    Vector v = getAllSuccessors(board, getComputerPiece());
    if(v.size() != 0)
    {
      // find which one of them has the minimum value (these values will be computed by alpha-beta)
      int min = alphaBeta((tttBoard)v.elementAt(0), -1, 1, getUserPiece());
      tttBoard nextBestMinBoard = (tttBoard)v.elementAt(0);
      for(int i=1; i<v.size(); i++)
      {
        int temp = alphaBeta((tttBoard)v.elementAt(i), -1, 1, getUserPiece());
        if(min > temp)
        {
          min = temp;
          nextBestMinBoard = (tttBoard)v.elementAt(i);
        }
      }

      // play there
      board.board[nextBestMinBoard.rowPlayed][nextBestMinBoard.colPlayed] = getComputerPiece();
      moveCounter++;
      if(f.alphaBetaCB.getState()) f.log("Alpha-Beta pruned " + pruned + " game tree branch(es)");
    }
    updateGameState();
  }

  /**
   * Return all immediate successors from a given position
   */
  private Vector getAllSuccessors(tttBoard b, int player)
  {
    if(b.horizontal3(player) || b.vertical3(player) || b.diagonal3(player)) return new Vector();
    int invert = player == O ? X : O;
    if(b.horizontal3(invert) || b.vertical3(invert) || b.diagonal3(invert)) return new Vector();

    Vector v = new Vector();
    for(int i=0; i<3; i++)
    {
      for(int j=0; j<3; j++)
      {
        if(b.board[i][j] == EMPTY)
        {
          tttBoard newBoard = new tttBoard(b);
          newBoard.rowPlayed = i;
          newBoard.colPlayed = j;
          newBoard.board[i][j] = player;
          v.addElement(newBoard);
        }
      }
    }
    return v;
  }

  private int alphaBeta(tttBoard b, int alpha, int beta, int player)
  {
    int maxValue, value;

    // determine all successors of the current position
    Vector successors = getAllSuccessors(b, player);

    // if there are no successors, the alpha-beta value is trivial
    if(successors.size() == 0) return b.getBoardEval(player);

    // trivial max value
    maxValue = alpha;

    // for all successors, call the alphaBeta recursively
    for(int i=0; i<successors.size(); i++)
    {
      // call recursively with inverted values (MAX becomes MIN and MIN becomes MAX)
      value = -alphaBeta((tttBoard)successors.elementAt(i), -beta, -maxValue, player == X ? O : X);

      // if the value found is greater than the current value, use it
      if(value > maxValue) maxValue = value;

      // pruning happens here! (if maxValues is greater than upper bound, no need to search further!)
      if(maxValue >= beta && f.alphaBetaCB.getState())
      {
        pruned++;
        break;
      }
    }

    return maxValue;
  }

  /**
   * Returns the internal representation of computer's piece
   */
  public int getComputerPiece()
  {
    return computerFirst ? X : O;
  }

  /**
   * Returns the internal representation of user's piece
   */
  public int getUserPiece()
  {
    return computerFirst ? O : X;
  }

  /**
   * Returns the representaion of the piece on the board
   */
  public String getPieceGUI(int i)
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
  private void updateGameState()
  {
    if(moveCounter < 5)
    {
      gameState = KEEP_PLAYING;
      return;
    }

    if(board.vertical3(getComputerPiece()) ||
       board.horizontal3(getComputerPiece()) ||
       board.diagonal3(getComputerPiece()))
    {
      gameState = COMPUTER_WON;
      return;
    }

    if(board.vertical3(getUserPiece()) ||
       board.horizontal3(getUserPiece()) ||
       board.diagonal3(getUserPiece()))
    {
      gameState = USER_WON;
      return;
    }

    if(moveCounter < 10) gameState = KEEP_PLAYING;
    else gameState = DRAW;
  }
}