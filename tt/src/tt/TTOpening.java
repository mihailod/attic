package tt;

import java.util.*;

public class TTOpening
{
  private static Random r = new Random(System.currentTimeMillis());

  public static TTBoard getMove(int piece, TTBoard b, int moveCounter)
  {
    if(piece == TTEngine.O)
      piece = TTEngine.X;
    else
      piece = TTEngine.O;

    TTBoard temp = new TTBoard(b);
    switch(moveCounter)
    {
      case 0 : { move1(temp); break; }
      case 1 : { move2(temp); break; }
      case 2 : { move3(temp, piece); break; }
      case 3 : { move4(temp, piece); break; }
      case 4 : { move5(temp, piece); break; }
      case 5 : { move6(temp, piece); break; }
      case 6 : { move7(temp, piece); break; }
      case 7 : { move7(temp, piece); break; }
      case 8 : { move7(temp, piece); break; }
    }
    return temp;
  }

  private static void move1(TTBoard b)
  {
    playInTheMiddle(b);
  }

  private static void move2(TTBoard b)
  {
    if(b.board[2][2] == TTEngine.EMPTY)
      playInTheMiddle(b);
    else
      playInACorner(b);
  }

  private static void move3(TTBoard b, int piece)
  {
    if(b.board[2][2] == TTEngine.EMPTY)
      playInTheMiddle(b);
    else
      makeDangerous2(b, piece);
  }

  private static void move4(TTBoard b, int piece)
  {
    if(!avoidDangerous3(b, piece))
      move3(b, piece);
  }

  private static void move5(TTBoard b, int piece)
  {
    if(!make3(b, piece))
      move4(b, piece);
  }

  private static void move6(TTBoard b, int piece)
  {
    if(!avoid4(b, piece))
      move5(b, piece);
  }

  private static void move7(TTBoard b, int piece)
  {
    if(!make4(b, piece))
      move6(b, piece);
  }

  private static void playInTheMiddle(TTBoard b)
  {
    b.newX = 2;
    b.newY = 2;
  }

  private static void makeDangerous2(TTBoard b, int piece)
  {
    if(b.board[2][2] == piece) // middle field is mine, OK to play "corner"
    {
      playInACorner(b);
    }
    else
    {
      if( ((b.board[1][1] == piece || b.board[3][3] == piece) &&
          (b.board[1][3] == TTEngine.EMPTY || b.board[3][1] == TTEngine.EMPTY))
          ||
          ((b.board[1][3] == piece || b.board[3][1] == piece) &&
          (b.board[1][1] == TTEngine.EMPTY || b.board[3][3] == TTEngine.EMPTY)) )
        playInACross(b);
      else
        playInACorner(b);
    }
  }

  private static boolean avoidDangerous3(TTBoard b, int piece)
  {
    for(int i=0; i<=4; i++) // horizontal
    {
      if(b.board[i][1]==piece && b.board[i][2]==piece && b.board[i][3]==0) { tryToPlay(b, i, 3); return true; }
      if(b.board[i][2]==piece && b.board[i][3]==piece && b.board[i][1]==0) { tryToPlay(b, i, 1); return true; }
      if(b.board[i][1]==piece && b.board[i][3]==piece && b.board[i][2]==0) { tryToPlay(b, i, 2); return true; }
    }

    for(int j=0; j<=4; j++) // vertical
    {
      if(b.board[1][j]==piece && b.board[2][j]==piece && b.board[3][j]==0) { tryToPlay(b, 3, j); return true; }
      if(b.board[2][j]==piece && b.board[3][j]==piece && b.board[1][j]==0) { tryToPlay(b, 1, j); return true; }
      if(b.board[1][j]==piece && b.board[3][j]==piece && b.board[2][j]==0) { tryToPlay(b, 2, j); return true; }
    }

    // diagonal
    if(b.board[1][1]==piece && b.board[2][2]==piece && b.board[3][3]==0) { tryToPlay(b, 3, 3); return true; }
    if(b.board[2][2]==piece && b.board[3][3]==piece && b.board[1][1]==0) { tryToPlay(b, 1, 1); return true; }
    if(b.board[1][3]==piece && b.board[2][2]==piece && b.board[3][1]==0) { tryToPlay(b, 3, 1); return true; }
    if(b.board[3][1]==piece && b.board[2][2]==piece && b.board[1][3]==0) { tryToPlay(b, 1, 3); return true; }

    return false;
  }

  private static boolean make3(TTBoard b, int piece)
  {
    // horizontal
    if(b.board[1][1]==piece && b.board[1][2]==piece && b.board[1][3]==0) {tryToPlay(b, 1, 3); return true;}
    if(b.board[1][2]==piece && b.board[1][3]==piece && b.board[1][1]==0) {tryToPlay(b, 1, 1); return true;}
    if(b.board[1][1]==piece && b.board[1][3]==piece && b.board[1][2]==0) {tryToPlay(b, 1, 2); return true;}

    if(b.board[2][1]==piece && b.board[2][2]==piece && b.board[2][3]==0) {tryToPlay(b, 2, 3); return true;}
    if(b.board[2][2]==piece && b.board[2][3]==piece && b.board[2][1]==0) {tryToPlay(b, 2, 1); return true;}
    if(b.board[2][3]==piece && b.board[2][1]==piece && b.board[2][2]==0) {tryToPlay(b, 1, 2); return true;}

    if(b.board[3][1]==piece && b.board[3][2]==piece && b.board[3][3]==0) {tryToPlay(b, 3, 3); return true;}
    if(b.board[3][2]==piece && b.board[3][3]==piece && b.board[3][1]==0) {tryToPlay(b, 3, 1); return true;}
    if(b.board[3][1]==piece && b.board[3][3]==piece && b.board[3][2]==0) {tryToPlay(b, 3, 2); return true;}

    // vertical
    if(b.board[1][1]==piece && b.board[2][1]==piece && b.board[3][1]==0) {tryToPlay(b, 3, 1); return true;}
    if(b.board[2][1]==piece && b.board[3][1]==piece && b.board[1][1]==0) {tryToPlay(b, 1, 1); return true;}
    if(b.board[1][1]==piece && b.board[3][1]==piece && b.board[2][1]==0) {tryToPlay(b, 2, 1); return true;}

    if(b.board[1][2]==piece && b.board[2][2]==piece && b.board[3][2]==0) {tryToPlay(b, 3, 2); return true;}
    if(b.board[1][2]==piece && b.board[3][2]==piece && b.board[2][2]==0) {tryToPlay(b, 2, 2); return true;}
    if(b.board[2][2]==piece && b.board[3][2]==piece && b.board[1][2]==0) {tryToPlay(b, 1, 2); return true;}

    if(b.board[1][3]==piece && b.board[2][3]==piece && b.board[3][3]==0) {tryToPlay(b, 3, 3); return true;}
    if(b.board[1][3]==piece && b.board[3][3]==piece && b.board[2][3]==0) {tryToPlay(b, 2, 3); return true;}
    if(b.board[2][3]==piece && b.board[3][3]==piece && b.board[1][3]==0) {tryToPlay(b, 1, 3); return true;}

    // diagonal
    if(b.board[1][1]==piece && b.board[2][2]==piece && b.board[3][3]==0) {tryToPlay(b, 3, 3); return true;}
    if(b.board[2][2]==piece && b.board[3][3]==piece && b.board[1][1]==0) {tryToPlay(b, 1, 1); return true;}
    if(b.board[1][3]==piece && b.board[2][2]==piece && b.board[3][1]==0) {tryToPlay(b, 3, 1); return true;}
    if(b.board[3][1]==piece && b.board[2][2]==piece && b.board[1][3]==0) {tryToPlay(b, 1, 3); return true;}

    // square ?!

    return false;
  }

  private static boolean avoid4(TTBoard b, int e)
  {
    // horizontal
    for(int i=0; i<=4; i++)
    {
      if(b.board[i][0]==e && b.board[i][1]==e && b.board[i][2]==e && b.board[i][3]==0)
      { tryToPlay(b, i, 3); return true; }

      if(b.board[i][2]==e && b.board[i][3]==e && b.board[i][4]==e && b.board[i][1]==0)
      { tryToPlay(b, i, 1); return true; }
    }

    // vertical
    for(int j=0; j<=4; j++)
    {
      if(b.board[0][j]==e && b.board[1][j]==e && b.board[2][j]==e && b.board[3][j]==0)
      { tryToPlay(b, 3, j); return true; }

      if(b.board[2][j]==e && b.board[3][j]==e && b.board[4][j]==e && b.board[1][j]==0)
      { tryToPlay(b, 1, j); return true; }
    }

    // diagonal
    if(b.board[0][1]==e&&b.board[1][2]==e&&b.board[2][3]==e&&b.board[3][4]==0){tryToPlay(b, 3, 4); return true;}
    if(b.board[3][4]==e&&b.board[1][2]==e&&b.board[2][3]==e&&b.board[0][1]==0){tryToPlay(b, 0, 1); return true;}

    if(b.board[0][0]==e&&b.board[1][1]==e&&b.board[2][2]==e&&b.board[3][3]==0){tryToPlay(b, 3, 3); return true;}
    if(b.board[2][2]==e&&b.board[3][3]==e&&b.board[4][4]==e&&b.board[1][1]==0){tryToPlay(b, 1, 1); return true;}

    if(b.board[1][0]==e&&b.board[2][1]==e&&b.board[3][2]==e&&b.board[4][3]==0){tryToPlay(b, 4, 3); return true;}
    if(b.board[2][1]==e&&b.board[3][2]==e&&b.board[4][3]==e&&b.board[1][0]==0){tryToPlay(b, 1, 0); return true;}


    if(b.board[0][3]==e&&b.board[1][2]==e&&b.board[2][1]==e&&b.board[3][0]==0){tryToPlay(b, 3, 0); return true;}
    if(b.board[3][0]==e&&b.board[1][2]==e&&b.board[2][1]==e&&b.board[0][3]==0){tryToPlay(b, 0, 3); return true;}

    if(b.board[0][4]==e&&b.board[1][3]==e&&b.board[2][2]==e&&b.board[3][1]==0){tryToPlay(b, 3, 1); return true;}
    if(b.board[2][2]==e&&b.board[3][1]==e&&b.board[4][0]==e&&b.board[1][3]==0){tryToPlay(b, 1, 3); return true;}

    if(b.board[1][4]==e&&b.board[2][3]==e&&b.board[3][2]==e&&b.board[4][1]==0){tryToPlay(b, 4, 1); return true;}
    if(b.board[2][3]==e&&b.board[3][2]==e&&b.board[4][1]==e&&b.board[1][4]==0){tryToPlay(b, 1, 4); return true;}

    // square
    for(int i=0; i<=3; i++)
    {
      for(int j=0; j<=3; j++)
      {
        if(b.board[i][j]==e && b.board[i+1][j]==e && b.board[i][j+1]==e && b.board[i+1][j+1]==0)
        { tryToPlay(b, i+1, j+1); return true; }
        if(b.board[i][j]==e && b.board[i+1][j]==e && b.board[i+1][j+1]==e && b.board[i][j+1]==0)
        { tryToPlay(b, i, j+1); return true; }
        if(b.board[i+1][j+1]==e && b.board[i+1][j]==e && b.board[i][j+1]==e && b.board[i][j]==0)
        { tryToPlay(b, i, j); return true; }
        if(b.board[i][j]==e && b.board[i+1][j+1]==e && b.board[i][j+1]==e && b.board[i+1][j]==0)
        { tryToPlay(b, i+1, j); return true; }
      }
    }

    return false;
  }

  private static boolean make4(TTBoard b, int piece)
  {
    // horizontal
    for(int i=0; i<=4; i++)
     {
      if(b.board[i][0]==piece && b.board[i][1]==piece && b.board[i][2]==piece && b.board[i][3]==0)
       { tryToPlay(b, i, 3); return true; }

      if(b.board[i][2]==piece && b.board[i][3]==piece && b.board[i][4]==piece && b.board[i][1]==0)
       { tryToPlay(b, i, 1); return true; }
     }

    // vertical
    for(int j=0; j<=4; j++)
     {
      if(b.board[0][j]==piece && b.board[1][j]==piece && b.board[2][j]==piece && b.board[3][j]==0)
       { tryToPlay(b, 3, j); return true; }

      if(b.board[2][j]==piece && b.board[3][j]==piece && b.board[4][j]==piece && b.board[1][j]==0)
       { tryToPlay(b, 1, j); return true; }
     }

    // diagonal
    if(b.board[0][1]==piece&&b.board[1][2]==piece&&b.board[2][3]==piece&&b.board[3][4]==0)
     {tryToPlay(b, 3, 4); return true;}
    if(b.board[3][4]==piece&&b.board[1][2]==piece&&b.board[2][3]==piece&&b.board[0][1]==0)
     {tryToPlay(b, 0, 1); return true;}

    if(b.board[0][0]==piece&&b.board[1][1]==piece&&b.board[2][2]==piece&&b.board[3][3]==0)
     {tryToPlay(b, 3, 3); return true;}
    if(b.board[2][2]==piece&&b.board[3][3]==piece&&b.board[4][4]==piece&&b.board[1][1]==0)
     {tryToPlay(b, 1, 1); return true;}
    if(b.board[1][1]==piece&&b.board[2][2]==piece&&b.board[3][3]==piece)
     {
      if(b.board[0][0]==0) { tryToPlay(b, 0, 0); return true; }
      if(b.board[4][4]==0) { tryToPlay(b, 4, 4); return true; }
     }

    if(b.board[1][0]==piece&&b.board[2][1]==piece&&b.board[3][2]==piece&&b.board[4][3]==0)
     {tryToPlay(b, 4, 3); return true;}
    if(b.board[2][1]==piece&&b.board[3][2]==piece&&b.board[4][3]==piece&&b.board[1][0]==0)
     {tryToPlay(b, 1, 0); return true;}


    if(b.board[0][3]==piece&&b.board[1][2]==piece&&b.board[2][1]==piece&&b.board[3][0]==0)
     {tryToPlay(b, 3, 0); return true;}
    if(b.board[3][0]==piece&&b.board[1][2]==piece&&b.board[2][1]==piece&&b.board[0][3]==0)
     {tryToPlay(b, 0, 3); return true;}

    if(b.board[0][4]==piece&&b.board[1][3]==piece&&b.board[2][2]==piece&&b.board[3][1]==0)
     {tryToPlay(b, 3, 1); return true;}
    if(b.board[2][2]==piece&&b.board[3][1]==piece&&b.board[4][0]==piece&&b.board[1][3]==0)
     {tryToPlay(b, 1, 3); return true;}
    if(b.board[1][3]==piece&&b.board[2][2]==piece&&b.board[3][1]==piece)
     {
      if(b.board[0][4]==0) { tryToPlay(b, 0, 4); return true; }
      if(b.board[4][0]==0) { tryToPlay(b, 4, 0); return true; }
     }

    if(b.board[1][4]==piece&&b.board[2][3]==piece&&b.board[3][2]==piece&&b.board[4][1]==0)
     {tryToPlay(b, 4, 1); return true;}
    if(b.board[2][3]==piece&&b.board[3][2]==piece&&b.board[4][1]==piece&&b.board[1][4]==0)
     {tryToPlay(b, 1, 4); return true;}

    // square
    for(int i=0; i<=3; i++)
    {
     for(int j=0; j<=3; j++)
      {
       if(b.board[i][j]==piece&&b.board[i+1][j]==piece&&b.board[i][j+1]==piece&&b.board[i+1][j+1]==0)
        { tryToPlay(b, i+1, j+1); return true; }
       if(b.board[i][j]==piece&&b.board[i+1][j]==piece&&b.board[i+1][j+1]==piece&&b.board[i][j+1]==0)
        { tryToPlay(b, i, j+1); return true; }
       if(b.board[i+1][j+1]==piece&&b.board[i+1][j]==piece&&b.board[i][j+1]==piece&&b.board[i][j]==0)
        { tryToPlay(b, i, j); return true; }
       if(b.board[i][j]==piece&&b.board[i+1][j+1]==piece&&b.board[i][j+1]==piece&&b.board[i+1][j]==0)
        { tryToPlay(b, i+1, j); return true; }
      }
    }

    return false;
  }

  private static void playInACorner(TTBoard b)
  {
    if(b.board[1][1] != TTEngine.EMPTY &&
       b.board[1][3] != TTEngine.EMPTY &&
       b.board[3][1] != TTEngine.EMPTY &&
       b.board[3][3] != TTEngine.EMPTY)
      playInACross(b);

    while(true)
    {
      if(b.board[1][1] != TTEngine.EMPTY &&
         b.board[1][3] != TTEngine.EMPTY &&
         b.board[3][1] != TTEngine.EMPTY &&
         b.board[3][3] != TTEngine.EMPTY)
      {
        return;
      }

      Thread.yield();
      int i = getNextRandomInt(4);
      switch(i)
      {
        case 0 : { if(tryToPlay(b, 1, 1)) return; }
        case 1 : { if(tryToPlay(b, 1, 3)) return; }
        case 2 : { if(tryToPlay(b, 3, 1)) return; }
        case 3 : { if(tryToPlay(b, 3, 3)) return; }
      }
    }
  }

  private static void playInACross(TTBoard b)
  {
    if(b.board[1][2] != TTEngine.EMPTY &&
       b.board[2][3] != TTEngine.EMPTY &&
       b.board[3][2] != TTEngine.EMPTY &&
       b.board[2][1] != TTEngine.EMPTY)
      playInACorner(b);

    while(true)
    {
      if(b.board[1][2] != TTEngine.EMPTY &&
         b.board[2][3] != TTEngine.EMPTY &&
         b.board[3][2] != TTEngine.EMPTY &&
         b.board[2][1] != TTEngine.EMPTY)
      {
        return;
      }

      Thread.yield();
      int i = getNextRandomInt(4);
      switch(i)
      {
        case 0 : { if(tryToPlay(b, 1, 2)) return; }
        case 1 : { if(tryToPlay(b, 2, 3)) return; }
        case 2 : { if(tryToPlay(b, 3, 2)) return; }
        case 3 : { if(tryToPlay(b, 2, 1)) return; }
      }
    }
  }

  private static boolean tryToPlay(TTBoard b, int x, int y)
  {
    if(b.board[x][y] == TTEngine.EMPTY)
    {
       b.newX = x;
       b.newY = y;
       return true;
    }
    else
      return false;
  }

  private static final int getNextRandomInt(int bound)
  {
    return r.nextInt() % bound;
  }

  /*
  private static void playRandom(TTBoard b)
  {
    while(true)
    {
      int x = r.nextInt(4);
      int y = r.nextInt(4);
      if(tryToPlay(b, x, y))
         return;
    }
  }
  */
}