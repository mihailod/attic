package tt;

import java.io.*;
import java.util.*;

public class TTDatabase
{
  public static Vector boards = new Vector(); // all positions will be here
  public static int total = 0;

  /**
   * The class that populates and encapsulates the database of positions
   */
  public TTDatabase(String fileName)
  {
    System.out.println("Reading the database...");
    readRawData(fileName);
    total = boards.size();
    System.out.println("Parsed " + total + " positions.");
    System.out.println("Cleaning the database...");
    postprocessData();
  }

  /**
   * Reads the raw data file and populates the database
   */
  private void readRawData(String fileName)
  {
    char[] buffer = new char[4];

    try
    {
      InputStreamReader fr = getReader(fileName);
      while(true)
      {
        TTBoard b = new TTBoard();

        // read the board fields
        for(int i=0; i<25; i++)
        {
          int x = i / TTBoard.SIZE;
          int y = i - x * TTBoard.SIZE;

          int field = fr.read();
          switch(field)
          {
            case  -1 : return; // EOF!
            case '1' : { b.board[x][y] = TTEngine.X; break; }
            case '2' : { b.board[x][y] = TTEngine.O; break; }
            default  : { b.board[x][y] = TTEngine.EMPTY; }
          }
        }

        // read wins and loses of the first player (here, it's 'X') and calculate the score
        fr.read(buffer);
        b.wonFirst = convertToInt(buffer);
        fr.read(buffer);
        b.wonSecond = convertToInt(buffer);

        // add the board
        boards.addElement(b);
      }
    }
    catch(Exception e)
    {
      e.printStackTrace();
    }
  }

  /**
   * Goes trough all positions, finds duplicates and accumulates them
   */
  private void postprocessData()
  {
    for(int i=0; i<boards.size()-1; i++)
    {
      if(i > 0 && i % 500 == 0)
        System.out.println("Added " + i + " unique positions...");

      TTBoard first = (TTBoard)boards.elementAt(i);
      for(int j=i+1; j<boards.size(); j++)
      {
        TTBoard second = (TTBoard)boards.elementAt(j);
        if(TTBoard.sameBoards(first, second))
        {
          first.wonFirst += second.wonFirst;
          first.wonSecond +=second.wonSecond;
          boards.removeElementAt(j);
        }
      }
    }
  }

  // utility methods

  /**
   * Convert an array of chars to integer
   */
  private static final int convertToInt(char[] chars)
  {
    // put leading zeros instead of spaces
    for(int i=0; i<chars.length; i++)
      if(chars[i] == ' ')
        chars[i] = '0';
    // calculate the number
    int res = 0;
    for(int i=0; i<chars.length; i++)
      res += powTen(i) * (chars[chars.length - i - 1] - '0');
    return res;
  }

  /**
   * Quick power of ten (faster than Java's Math.pow which deals with doubles)
   */
  private static final int powTen(int pow)
  {
    int res = 1;
    for(int i=0; i<pow; i++)
      res *= 10;
    return res;
  }

  /**
   * Gets a reader for the database file depending on the file location (filesystem or applet's JAR)
   */
  private static final InputStreamReader getReader(String name)
  {
    InputStreamReader isr = null;
    try
    {
      isr = new FileReader(name); // file system
    }
    catch(Exception e)
    {
      InputStream in = TTStarter.class.getResourceAsStream("/" + name); // applet's JAR
      isr = new InputStreamReader(in);
    }
    return isr;
  }
}