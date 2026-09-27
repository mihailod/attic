package tt;

import java.awt.*;

public class FieldFlasherThread extends Thread
{
  private boolean flash = true;
  private Button oldButton = null;
  private Button newButton = null;

  private boolean adviseX = true;
  private boolean adviseO = true;
  int moveCounter = 0;

  /**
   * Flashes one (in opening) two fields ("from" and "to") (in the game)
   */
  public FieldFlasherThread(Button oldButton, Button newButton, int moveCounter,
                            boolean adviseX, boolean adviseO)
  {
    this.newButton = newButton;
    this.oldButton = oldButton;
    this.moveCounter = moveCounter;
    this.adviseX = adviseX;
    this.adviseO = adviseO;
  }

  public void run()
  {
    while(flash)
    {
      if(xIsOnTheMove() && adviseX ||
         !xIsOnTheMove() && adviseO)
      {
        setAdvisingX(adviseX);
        setAdvisingO(adviseO);

        if(newButton != null)
          newButton.setBackground(Color.white);
        if(oldButton != null)
          oldButton.setBackground(Color.yellow);

        try { Thread.sleep(TTStarter.FLASH_DELAY); }
        catch(InterruptedException ie) { ; }

        if(!flash)
        {
          reset();
          return;
        }

        setAdvisingX(adviseX);
        setAdvisingO(adviseO);

        if(xIsOnTheMove() && adviseX ||
         !xIsOnTheMove() && adviseO)
        {
          if(newButton != null)
            newButton.setBackground(Color.yellow);
          if(oldButton != null)
            oldButton.setBackground(Color.white);

          try { Thread.sleep(TTStarter.FLASH_DELAY); }
          catch(InterruptedException ie){ ; }

          setAdvisingX(adviseX);
          setAdvisingO(adviseO);
        }
      }
    }

    if(newButton != null)
      newButton.setBackground(Color.white);
    if(oldButton != null)
      oldButton.setBackground(Color.white);
  }

  private void reset()
  {
    if(newButton != null)
      newButton.setBackground(Color.white);
    if(oldButton != null)
      oldButton.setBackground(Color.white);
  }

  public void stopFlashing()
  {
    flash = false;
    try
    {
      interrupt();
    }
    catch(Throwable t)
    {
      System.out.println("You can ignore this:");
      t.printStackTrace();
    }
  }

  public void setAdvisingX(boolean b)
  {
    if(!xIsOnTheMove())
      reset();
    adviseX = b;
  }

  public void setAdvisingO(boolean b)
  {
    if(xIsOnTheMove())
      reset();
    adviseO = b;
  }

  private boolean xIsOnTheMove()
  {
    return moveCounter % 2 != 0;
  }
}