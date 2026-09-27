package chuchurocket.util;

import java.applet.*;
import java.awt.*;
import java.io.*;
import java.net.*;

/**
 * <p>Title: ChuChu Rocket</p>
 * <p>Description: A java port of a well known SEGA's game for Dreamcast</p>
 * <p>Copyright: Copyright (c) 2003 Mihailo Despotovic (game idea (c)SEGA)</p>
 * <p>Company: </p>
 * @author Mihailo Despotovic
 * @version 1.0
 */

public class Media
{
  public static Image IMAGE_CHEESE = null;
  public static Image IMAGE_BOARD = null;
  public static Image IMAGE_SKULL = null;

  public static AudioClip SOUND_MOUSE_IN_CHEESE = null;
  public static AudioClip SOUND_MOUSE_IN_HOLE = null;

  public static AudioClip SOUND_CAT_IN_HOLE = null;
  public static AudioClip SOUND_CAT_IN_MOUSE = null;
  public static AudioClip SOUND_CAT_IN_CHEESE = null;

  public static AudioClip SOUND_LEVEL_UP = null;
  public static AudioClip SOUND_LEVEL_END = null;

  public static void loadMedia()// load all images and wait until they are OK to avoid stupid asynchronous load...
  {
    try
    {
      SOUND_MOUSE_IN_CHEESE = Applet.newAudioClip
        (new URL("file:\\d:\\mihailo\\javaprojects\\chuchurocket\\res\\mouseincheese.wav"));
      SOUND_MOUSE_IN_HOLE = Applet.newAudioClip
        (new URL("file:\\d:\\mihailo\\javaprojects\\chuchurocket\\res\\mouseinhole.wav"));

      SOUND_CAT_IN_HOLE = Applet.newAudioClip
        (new URL("file:\\d:\\mihailo\\javaprojects\\chuchurocket\\res\\catinhole.wav"));
      SOUND_CAT_IN_MOUSE = Applet.newAudioClip
        (new URL("file:\\d:\\mihailo\\javaprojects\\chuchurocket\\res\\catinmouse.wav"));
      SOUND_CAT_IN_CHEESE = Applet.newAudioClip
        (new URL("file:\\d:\\mihailo\\javaprojects\\chuchurocket\\res\\catincheese.wav"));

      SOUND_LEVEL_UP = Applet.newAudioClip
        (new URL("file:\\d:\\mihailo\\javaprojects\\chuchurocket\\res\\levelup.wav"));
      //SOUND_LEVEL_END = Applet.newAudioClip
      //  (new URL("file:\\d:\\mihailo\\javaprojects\\chuchurocket\\res\\levelend.wav"));
    }
    catch(Exception e) { e.printStackTrace(); }

    IMAGE_CHEESE = Toolkit.getDefaultToolkit().getImage("d:\\mihailo\\javaprojects\\chuchurocket\\res\\cheese.gif").
                   getScaledInstance(Constants.CELL_SIZE - 2*Constants.CELL_INSET, Constants.CELL_SIZE - 2*Constants.CELL_INSET, Image.SCALE_DEFAULT);
    IMAGE_BOARD = Toolkit.getDefaultToolkit().getImage("d:\\mihailo\\javaprojects\\chuchurocket\\res\\board.gif").
                   getScaledInstance(Constants.GAME_FIELD_WIDTH*Constants.CELL_SIZE,
                   Constants.GAME_FIELD_HEIGHT*Constants.CELL_SIZE, Image.SCALE_DEFAULT);
    IMAGE_SKULL = Toolkit.getDefaultToolkit().getImage("d:\\mihailo\\javaprojects\\chuchurocket\\res\\skull.gif").
                   getScaledInstance(Constants.CELL_SIZE - 2*Constants.CELL_INSET, Constants.CELL_SIZE - 2*Constants.CELL_INSET, Image.SCALE_DEFAULT);
    while(IMAGE_CHEESE.getWidth(null) < 0 || IMAGE_BOARD.getWidth(null) < 0 ||
          IMAGE_SKULL.getWidth(null) < 0 ) // wait until they are OK
    {
      try { Thread.sleep(200); }
      catch(InterruptedException ie) { ; }
    }
  }
}