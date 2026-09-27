package com.ea.mihailo;

import java.util.*;

/**
 * The Electronic Arts Java programming interview problem.
 *
 * @author Mihailo Despotovic
 * @since Aug 1, 2005 8:10:56 PM
 */
public class MainClass
{
  public static void main(String args[])
  {
    // given tests
    LineSegment ls1 = new LineSegment(1, 3);
    LineSegment ls2 = new LineSegment(2, 4);

    LineSegment ls3 = new LineSegment(2, 3);
    LineSegment ls4 = new LineSegment(3, 4);

    LineSegment ls5 = new LineSegment(1, 3);
    LineSegment ls6 = new LineSegment(2, 4);
    LineSegment ls7 = new LineSegment(4, 5);

    Vector v = new Vector();
    v.add(ls1);
    v.add(ls2);

    Vector v1 = new Vector();
    v1.add(ls3);
    v1.add(ls4);

    Vector v2 = new Vector();
    v2.add(ls5);
    v2.add(ls6);
    v2.add(ls7);

    // additional test: subsegment
    Vector v3 = new Vector();
    v3.add(new LineSegment(1, 4));
    v3.add(new LineSegment(2, 3));

    Vector res = (Vector)LineSegment.mergeAndSort(v);
    dump(res);
    res = (Vector)LineSegment.mergeAndSort(v1);
    dump(res);
    res = (Vector)LineSegment.mergeAndSort(v2);
    dump(res);
    res = (Vector)LineSegment.mergeAndSort(v3);
    dump(res);

    // additional test 2
    Vector v4 = new Vector();
    v4.add(new LineSegment(1, 2));
    v4.add(new LineSegment(4, 6));
    v4.add(new LineSegment(5, 7));
    res = (Vector)LineSegment.mergeAndSort(v4);
    dump(res);

    // test empty vector
    Vector v5 = new Vector();
    res = (Vector)LineSegment.mergeAndSort(v5);
    dump(res);

    // do not fail on null
    Vector v6 = null;
    res = (Vector)LineSegment.mergeAndSort(v6);
    dump(res);

    System.exit(0);
  }

  /**
   * Just dump a given vector of objects.
   * @param v
   */
  private static final void dump(Vector v)
  {
    if(v == null)
    {
      System.out.println("Got null -- nothing to print.");
      return;
    }
    for(int i=0; i<v.size(); i++)
      System.out.print(v.elementAt(i).toString() + " ");
    System.out.println();
  }
}
