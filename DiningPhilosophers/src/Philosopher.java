
/**
 * @author Mihailo Despotovic
 * @since Aug 24, 2005 4:30:38 PM
 */
public class Philosopher implements Runnable
{
  private String name;
  private Fork left, right;

  public Philosopher(String name, Fork left, Fork right)
  {
    this.name = name;
    this.left = left;
    this.right = right;
  }

  public void run()
  {
    // forever...
    while(true)
    {
      // think a bit...
      System.out.println(name + " is thinking...");
      try
      {
        Thread.sleep((int)(Math.random() * 5000));
      }
      catch(InterruptedException ie)
      {
        ie.printStackTrace();
      }

      // pick up
      System.out.println(name + " is picking up his left fork...");
      left.pickUp();
      System.out.println(name + " is picking up his right fork...");
      right.pickUp();

      // eating...
      System.out.println(name + " is eating...");
      try
      {
        Thread.sleep((int)(Math.random() * 5000));
      }
      catch(InterruptedException ie)
      {
        ie.printStackTrace();
      }

      // put down
      System.out.println(name + " is putting down his left fork...");
      left.putDown();
      System.out.println(name + " is picking up his right fork...");
      right.putDown();
    }
  }
}
