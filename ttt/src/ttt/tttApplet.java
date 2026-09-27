/**
 *
 *
 *
 *
 *
 *
 *
 *
 */


package ttt;

import java.applet.*;
import java.awt.*;

/**
 * Tic-Tac-Toe Applet
 *
 * @since 01/11/2003
 * @version 1.0
 *
 */
public class tttApplet extends Applet
{
  public static final String VERSION = "1.0";

  /**
   * This class can be used as a main clas of the application
   */
  public static void main(String[] a)
  {
    new tttFrame();
  }

  /**
   * Also, this class can be used as the entry point to an applet
   */
  public void init()
  {
    new tttFrame();
  }
}