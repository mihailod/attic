package ttt;

public class tttBoard
{
  public int[][] board = new int[3][3]; // the board

  public int rowPlayed = -1;
  public int colPlayed = -1;

  /**
   * Default constructor
   */
  public tttBoard() { ; }

  /**
   * Constructor that takes a board
   */
  public tttBoard(tttBoard currBoard)
  {
    for (int i = 0; i < 3; i++)
      for (int j = 0; j < 3; j++)
      {
        board[i][j] = currBoard.board[i][j];
      }
  }

  /**
   * Exact evaluation function.
   * @return 1 for win, -1 for loss and 0 for draw
   */
  public int getBoardEval(int player)
  {
    if(player == tttEngine.X)
    {
      if(vertical3(tttEngine.X) || horizontal3(tttEngine.X) || diagonal3(tttEngine.X)) return 1;
      else if(vertical3(tttEngine.O) || horizontal3(tttEngine.O) || diagonal3(tttEngine.O)) return -1;
      else return 0;
    }
    else if(player == tttEngine.O)
    {
      if(vertical3(tttEngine.O) || horizontal3(tttEngine.O) || diagonal3(tttEngine.O)) return 1;
      else if(vertical3(tttEngine.X) || horizontal3(tttEngine.X) || diagonal3(tttEngine.X)) return -1;
      else return 0;
    }
    else throw new IllegalArgumentException("what?");
  }

  /**
   * Checks the vertical 3 in a row
   */
  public boolean vertical3(int i)
  {
    if(board[0][0] == i && board[0][1] == i && board[0][2] == i ||
       board[1][0] == i && board[1][1] == i && board[1][2] == i ||
       board[2][0] == i && board[2][1] == i && board[2][2] == i) return true;
    else return false;
  }

  /**
   * Checks the horizontal 3 in a row
   */
  public boolean horizontal3(int i)
  {
    if(board[0][0] == i && board[1][0] == i && board[2][0] == i ||
       board[0][1] == i && board[1][1] == i && board[2][1] == i ||
       board[0][2] == i && board[1][2] == i && board[2][2] == i) return true;
    else return false;
  }

  /**
   * Checks the diagonals for 3 in a row
   */
  public boolean diagonal3(int i)
  {
    if(board[0][0] == i && board[1][1] == i && board[2][2] == i ||
       board[0][2] == i && board[1][1] == i && board[2][0] == i) return true;
    else return false;
  }

  /**
   * Dumps board to log (used for debug)
   */
  public void dumpBoardToLog(tttFrame f)
  {
    for(int i=0; i<3; i++) f.log("" + board[i][0] + "" + board[i][1] + "" + board[i][2]);
  }
}
