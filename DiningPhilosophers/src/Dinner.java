
/**
 * @author Mihailo Despotovic
 * @since Aug 24, 2005 4:37:44 PM
 */
public class Dinner
{
  public static void main(String[] args)
  {
    // the dimension of the problem
    int numForks = 5;

    // create forks
    Fork[] forks = new Fork[numForks];
    for(int i=0; i<numForks; i++)
      forks[i] = new Fork();

    // create philosophers and start them
    for(int i=0; i<numForks; i++)
    {
      // decide which forks go to this one
      Fork left = forks[i];
      Fork right = forks[(i+1)%numForks];

      // create him
      Philosopher p;
      if(i % 2 == 0)
        p = new Philosopher("" + i, left, right);
      else
        p = new Philosopher("" + i, right, left);

      // let him start
      new Thread(p).start();
    }
  }
}
