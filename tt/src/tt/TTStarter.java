package tt;

import java.applet.*;
import java.awt.*;

/**
 * TeekoTeacher
 *
 * Developed for the CAPS4 Conference paper:
 *
 * "TeekoTeacher: A Tool for Learning Good Teeko Strategies"
 * The Fourth International Conference on Human-System Learning
 * Glasgow, Scotland, UK, 2003.
 *
 * Copyright (c) 2003. Mihailo Despotovic, Redwood City, CA, USA [ mihailod@hotmail.com ]
 *
 * -------------------------------------------------------------------------------------------
 *
 * Developer's diary:
 *
 * Development started on Saturday, March 15. 2003.
 *
 * BETA 1 released on March 19. 2003.
 * - program is able to parse the database and advise both players
 * - Java 1.1 compliant version released on March 21. 2003.
 *
 * BETA 2 released on March 23. 2003. (TODO)
 * - fixed a nasty bug (position properties were not propagated, the first one was always suggested)
 * - selective advising
 * - draw detection
 * - work with player symmetric positions
 * - cumulative populating of same positions during the database parsing
 * - a little bit more detailed logging info
 *
 * Version 1.0 Released on June 8th 2003.
 * - the version to be shown on the CAPS4 confernece, Glasgow, UK, 2003.
 * - same as BETA 2 but with the security exception issue (while restarting the game) fixed
 */
public class TTStarter extends Applet
{
  public static final String VERSION = "1.0 (June 8th 2003)"; // tehnically, the build date should not go here...

  public static final String INSTRUCTIONS_FILE_NAME = "ttinstr.txt";
  public static final String DATABASE_FILE_NAME = "ttdb.txt";
  public static final int FLASH_DELAY = 400;

  /**
   * This class can be used as the main clas of an application
   */
  public static void main(String[] a)
  {
    initApplication();
  }

  /**
   * Also, this class can be used as the entry point to an applet
   */
  public void init()
  {
    initApplication();
  }

  /**
   * The code that actually starts the application
   */
  private static void initApplication()
  {
    new TTDatabase(DATABASE_FILE_NAME);
    new TTFrame();
  }
}