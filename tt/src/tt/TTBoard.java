package tt;

import java.util.*;

public class TTBoard
{
  public static TTFrame f = null;

  public static final int SIZE = 5;
  public int[][] board = new int[SIZE][SIZE]; // the board

  public TTBoard nextBestPosition = null;
  public int oldX = -1;
  public int oldY = -1;
  public int newX = -1;
  public int newY = -1;

  public int wonFirst = -1;
  public int wonSecond = -1;

  /**
   * Default constructor
   */
  public TTBoard() { ; }

  /**
   * Constructor that takes a board
   */
  public TTBoard(TTBoard currBoard)
  {
    if(currBoard == null)
      return;

    for (int i = 0; i < SIZE; i++)
      for (int j = 0; j < SIZE; j++)
        board[i][j] = currBoard.board[i][j];

    oldX = currBoard.oldX;
    oldY = currBoard.oldY;
    newX = currBoard.newX;
    newY = currBoard.newY;
    nextBestPosition = currBoard.nextBestPosition;
    wonFirst = currBoard.wonFirst;
    wonSecond = currBoard.wonSecond;
  }

  /**
   * Dumps the board to log (used for debug)
   */
  public static void dumpBoard(TTBoard b)
  {
    if(b == null)
    {
      System.out.println("NULL!");
      return;
    }
    for(int i=0; i<SIZE; i++)
      System.out.println("" + b.board[i][0] +
                         "" + b.board[i][1] +
                         "" + b.board[i][2] +
                         "" + b.board[i][3] +
                         "" + b.board[i][4]);
    System.out.println("oldX: " + b.oldX + " oldY: " + b.oldY);
    System.out.println("newX: " + b.newX + " newY: " + b.newY);
  }

  /**
   * Determine if there are four in a row, column, diagonal or square.
   */
  public boolean hasFour(int piece)
  {
    return fourInARow(piece) ||
           fourInAColumn(piece) ||
           fourInADiagonal(piece) ||
           fourInASquare(piece);
  }

  private boolean fourInARow(int piece)
  {
    for(int i=0; i<SIZE; i++)
    {
      for(int offset = 0; offset<2; offset++)
      {
        boolean found = true;
        for(int j=0 + offset; j<4 + offset; j++)
        {
          if(board[i][j] != piece)
          {
            found = false;
            break;
          }
        }
        if(found) return true;
      }
    }
    return false;
  }

  private boolean fourInAColumn(int piece)
  {
    for(int j=0; j<SIZE; j++)
    {
      for(int offset = 0; offset<2; offset++)
      {
        boolean found = true;
        for(int i=0 + offset; i<4 + offset; i++)
        {
          if(board[i][j] != piece)
          {
            found = false;
            break;
          }
        }
        if(found) return true;
      }
    }
    return false;
  }

  private boolean fourInADiagonal(int piece)
  {
    return
      // diagonals on main diagonals
      board[0][0] == piece && board[1][1] == piece && board[2][2] == piece && board[3][3] == piece ||
      board[1][1] == piece && board[2][2] == piece && board[3][3] == piece && board[4][4] == piece ||
      board[0][4] == piece && board[1][3] == piece && board[2][2] == piece && board[3][1] == piece ||
      board[1][3] == piece && board[2][2] == piece && board[3][1] == piece && board[4][0] == piece ||
      // "small" diagonals
      board[0][1] == piece && board[1][2] == piece && board[2][3] == piece && board[3][4] == piece ||
      board[1][0] == piece && board[2][1] == piece && board[3][2] == piece && board[4][3] == piece ||
      board[0][3] == piece && board[1][2] == piece && board[2][1] == piece && board[3][0] == piece ||
      board[1][4] == piece && board[2][3] == piece && board[3][2] == piece && board[4][1] == piece;
  }

  private boolean fourInASquare(int piece)
  {
    for(int i=0; i<SIZE-1; i++)
    {
      for(int j=0; j<SIZE-1; j++)
      {
        if(fourInASpecificSquare(piece, i, j))
           return true;
      }
    }
    return false;
  }

  private boolean fourInASpecificSquare(int piece, int x, int y)
  {
    return board[x][y] == piece && board[x+1][y] == piece &&
           board[x][y+1] == piece && board[x+1][y+1] == piece;
  }

  /**
   * Checks if the whole board is empty
   */
  public boolean isEmpty()
  {
    for(int i=0; i<SIZE; i++)
      for(int j=0; j<SIZE; j++)
        if(board[i][j] != TTEngine.EMPTY)
          return false;
    return true;

  }

  /**
   * Calculate all successors of a given board for a given player
   * @return vector of all successors
   */
  public static Vector getAllSuccessors(TTBoard b, int piece)
  {
    Vector all = new Vector();
    for(int i=0; i<SIZE; i++)
    {
      for(int j=0; j<SIZE; j++)
      {
        if(b.board[i][j] == piece)
        {
          // find all successors that emerge when you move this piece
          Vector allForThisPiece = getAllSuccessorsForOnePiece(b, piece, i, j);
          // add them to the result
          for(int k=0; k<allForThisPiece.size(); k++)
            all.addElement(allForThisPiece.elementAt(k));
        }
      }
    }
    return all;
  }

  /**
   * Try to make all possible moves with one piece
   */
  private static Vector getAllSuccessorsForOnePiece(TTBoard b, int piece, int x, int y)
  {
    Vector v = new Vector();

    // there are maximum 8 possible successors from x,y:
    addSingleSuccessor(v, b, piece, x, y, x-1, y-1); // up left
    addSingleSuccessor(v, b, piece, x, y, x,   y-1); // up
    addSingleSuccessor(v, b, piece, x, y, x+1, y-1); // up right

    addSingleSuccessor(v, b, piece, x, y, x-1, y  ); // left
    addSingleSuccessor(v, b, piece, x, y, x+1, y  ); // right

    addSingleSuccessor(v, b, piece, x, y, x-1, y+1); // down left
    addSingleSuccessor(v, b, piece, x, y, x,   y+1); // down
    addSingleSuccessor(v, b, piece, x, y, x+1, y+1); // up right

    return v;
  }

  /**
   * Creates a successor (if possible)
   */
  private static void addSingleSuccessor(Vector v, TTBoard b, int piece, int oldX, int oldY, int newX, int newY)
  {
    if(newX >= 0 && newX < SIZE && newY >= 0 && newY < SIZE && // new position must be valid...
       b.board[newX][newY] == TTEngine.EMPTY) // ...and empty
    {
      TTBoard temp = new TTBoard(b);
      temp.board[oldX][oldY] = TTEngine.EMPTY; // remove the piece from the old position
      temp.board[newX][newY] = piece; // put the piece to the new position
      temp.newX = newX;
      temp.newY = newY;
      temp.oldX = oldX;
      temp.oldY = oldY;
      v.addElement(temp);
    }
  }

  /**
   * Checks if two boards are the same
   */
  public static boolean sameBoards(TTBoard b1, TTBoard b2)
  {
    if(b1 == null || b2 == null) // have to be non-null boards
      return false;
    for(int i=0; i<SIZE; i++)
      for(int j=0; j<SIZE; j++)
        if(b1.board[i][j] != b2.board[i][j])
          return false;
    return true;
  }

  /**
   * Makes a symmetric board (in the terms of the player's pieces)
   */
  private void makeSymmetric()
  {
    for(int i=0; i<SIZE; i++)
      for(int j=0; j<SIZE; j++)
      {
        if(board[i][j] == TTEngine.O)
          board[i][j] = TTEngine.X;
        else if(board[i][j] == TTEngine.X)
          board[i][j] = TTEngine.O;
      }
  }

  /**
   * Calculates the best position succeeding the current one.
   * 1. Finds all successors of the current position.
   * 2. Tries to see which ones match with the database.
   * 3. Uses the highest ranked position among the matched positions.
   */
  public void calculateNextBestPosition(int piece, boolean opening, int moveCounter)
  {
    if(opening) // opening, use heuristic
    {
      nextBestPosition = TTOpening.getMove(piece, this, moveCounter);
      f.log("Heuristic is suggesting this opening move: " +
            (char)('A' + nextBestPosition.newY) + "" + (nextBestPosition.newX+1));
    }
    else // post-opening, use the database
    {
      // find the succesors that are present in the database
      Vector plainSuccessors = getAllSuccessors(this, piece);
      Vector present = new Vector();
      int plainCount = 0;
      int symmetricCount = 0;
      for(int i=0; i<TTDatabase.boards.size(); i++)
      {
        TTBoard dbBoard = (TTBoard)TTDatabase.boards.elementAt(i);

        // check how many plain successors we have in the database
        for(int j=0; j<plainSuccessors.size(); j++)
        {
          TTBoard temp = (TTBoard)plainSuccessors.elementAt(j);
          if(TTBoard.sameBoards(dbBoard, temp))
          {
            addBoard(present, temp, dbBoard, false);
            plainCount++;
          }
          else // maybe the symmetric one is there?
          {
            temp.makeSymmetric();
            if(TTBoard.sameBoards(dbBoard, temp))
            {
              addBoard(present, temp, dbBoard, true);
              symmetricCount++;
            }
          }
        }
      }

      f.log(plainSuccessors.size() + " possible moves for '" +
            TTEngine.getPieceGUI(piece) + "' found from this position");
      f.log(plainCount + " plain and " + symmetricCount + " symmetric move(s) found in the database");

      nextBestPosition = null;

      // calculate the best plain position
      int maxScore = Integer.MIN_VALUE;
      int gamesPlayed = 0;
      int gamesWon = 0;
      for(int i=0; i<present.size(); i++)
      {
        TTBoard temp = (TTBoard)present.elementAt(i);
        int score = piece == TTEngine.X ? temp.wonFirst - temp.wonSecond :
                                          temp.wonSecond - temp.wonFirst;
        if(score > maxScore)
        {
          gamesPlayed = temp.wonFirst + temp.wonSecond;
          gamesWon = piece == TTEngine.X ? temp.wonFirst : temp.wonSecond;
          maxScore = score;
          nextBestPosition = new TTBoard(temp);
        }
      }

      if(nextBestPosition != null)
      {
        float winningPercentage = (100 * gamesWon) / gamesPlayed;
        f.log("Recommended move: " + (char)('A' + nextBestPosition.oldY) + "" + (nextBestPosition.oldX+1) +
              "-" + (char)('A' + nextBestPosition.newY) + "" + (nextBestPosition.newX+1));
        f.log("The advice was part of a winning strategy in " + gamesWon + " of " + gamesPlayed +
              " games (" + winningPercentage + "%)");
      }
    }
  }

  private void addBoard(Vector present, TTBoard temp, TTBoard dbBoard, boolean symmetric)
  {
    TTBoard toAdd = new TTBoard(temp);
    // propagate the values!
    toAdd.wonFirst = symmetric ? dbBoard.wonSecond : dbBoard.wonFirst;
    toAdd.wonSecond = symmetric ?  dbBoard.wonFirst : dbBoard.wonSecond;
    present.addElement(toAdd);
  }
}
