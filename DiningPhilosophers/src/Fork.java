
/**
 * @author Mihailo Despotovic
 * @since Aug 24, 2005 4:28:36 PM
 */
public class Fork
{
  private boolean free = true;

  public synchronized void pickUp()
  {
    // spinwait
    while(!free)
    {
      try
      {
        wait();
      }
      catch(InterruptedException ie)
      {
        ie.printStackTrace();
      }
    }

    // execute
    free = false;
  }

  public synchronized void putDown()
  {
    free = true;
    notify();
  }
}
