
/**
 * @author Mihailo Despotovic
 * @since Sep 18, 2005 3:04:26 PM
 */
public class BP
{
  private static final double DAYS = 365d;

  public static void main(String[] args)
  {
    System.out.println("Probabilities that 2 people in the room will have the same birthday:");
    System.out.println("People --- Probability");
    for(int people=0; people<90; people++)
    {
      double p = 1;
      for(int i=0; i<people; i++)
        p *= (DAYS-i)/DAYS;
      System.out.println(people + " --- " + (1-p));
    }
  }
}
