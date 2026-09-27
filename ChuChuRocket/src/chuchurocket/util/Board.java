package chuchurocket.util;

import java.util.*;

/**
 * <p>Title: ChuChu Rocket</p>
 * <p>Description: A java port of a well known SEGA's game for Dreamcast</p>
 * <p>Copyright: Copyright (c) 2003 Mihailo Despotovic (game idea (c)SEGA)</p>
 * <p>Company: </p>
 * @author Mihailo Despotovic
 * @version 1.0
 */

public class Board
{
  public BoardElement[][] board = null;

  public Board()
  {
    board = new BoardElement[Constants.GAME_FIELD_HEIGHT][Constants.GAME_FIELD_WIDTH];
    // all contents are NONE
    for(int j=0; j<Constants.GAME_FIELD_HEIGHT; j++)
      for(int i=0; i<Constants.GAME_FIELD_WIDTH; i++)
        board[j][i] = new BoardElement(Constants.STATE_NOTHING, Constants.ORIENTATION_NONE);

    // create the wall around the board
    for(int i=0; i<Constants.GAME_FIELD_WIDTH; i++)
      board[Constants.GAME_FIELD_HEIGHT-1][i].wallDown = true;
    for(int j=0; j<Constants.GAME_FIELD_HEIGHT; j++)
      board[j][Constants.GAME_FIELD_WIDTH-1].wallRight = true;
  }

  public void setContentFromString(String s)
  {
    StringTokenizer st = new StringTokenizer(s, "-");
    for(int j=0; j<Constants.GAME_FIELD_HEIGHT; j++)
      for(int i=0; i<Constants.GAME_FIELD_WIDTH; i++)
        board[j][i] = new BoardElement(st.nextToken());
  }

  public String toString()
  {
    StringBuffer sb = new StringBuffer();
    for(int j=0; j<Constants.GAME_FIELD_HEIGHT; j++)
      for(int i=0; i<Constants.GAME_FIELD_WIDTH; i++)
      {
        sb.append(board[j][i].toString());
        sb.append("-");
      }
    return sb.toString();
  }
}