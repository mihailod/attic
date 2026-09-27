package com.ea.mihailo;

import java.util.*;

/**
 * This is a java programming task. You have 90 minutes to complete it.
 * At the end of the 90 minutes, you are expected to mail back the source
 * code implementing the result.
 *
 * It is not necessary to submit code that tests the api, but it
 * certainly won't hurt.
 *
 * The programming task is to implement the mergeAndSort function.
 * It'd be nice if the result was working java code, but whatever you
 * have at the end of the time limit is fine.
 *
 * This class represents a line segment, which is a begin point and
 * end point on the number line.
 *
 * When solving this problem, assume a real-world situation, as
 * opposed to a school situtation. In other words, you're sitting
 * at your desk, and i come up to you and say "Can you do this for me?".
 * You will then try to get this done as quickly as possible, keeping
 * best practices, reusability, and the availability of "standard" APIs
 * in mind.
 */
public class LineSegment implements Comparable
{
	private int	beginPoint;
	private int	endPoint;

  public LineSegment(int beginPoint, int endPoint)
  {
    this.beginPoint = beginPoint;
    this.endPoint = endPoint;
  }

  /**
   * Override toString for convenient printing.
   * @return string representation
   */
  public String toString()
  {
    StringBuffer sb = new StringBuffer();
    sb.append("[").append(beginPoint).append(", ").append(endPoint).append("]");
    return sb.toString();
  }

  /**
   * Compare elements: beginning first; then end.
   * @param segment
   * @return -1, 0 or 1 (usual comparison motif)
   */
  public int compareTo(Object segment)
  {
    if(!(segment instanceof LineSegment))
      throw new IllegalArgumentException
        ("Bad comparison object, nedd LineSegment got: " + segment.getClass().toString());
    else if(segment == null)
     throw new IllegalArgumentException("Comparison object is null!");
    else
    {
      if(this.beginPoint != ((LineSegment)segment).endPoint)
        return this.beginPoint - ((LineSegment)segment).beginPoint;
      else
        return this.endPoint - ((LineSegment)segment).endPoint;
    }
  }

	/**
	 * This function will sort and merge a Collection of
	 * LineSegment objects. I am referring to java.util.Collection
	 * here, but note that you are free to use some other
	 * type of object if that makes more sense to you (especially
	 * if you aren't familiar with the 1.2 collection api).
	 *
	 * @param c	A Collection of LineSegment objects, unsorted.
	 * The input should NOT be modified.
	 * @return Returns a new Collection of sorted and merged LineSegment
	 * objects. The objects should be sorted by 'beginPt' and then
	 * 'endPt'. Merging means that any part of a line segment
	 * overlaps any other, or the line segments are end-to-end.
	 *
	 * Examples of line segments that merge:
	 *
	 * (1,3),(2,4) ==> (1,4)
	 * (2,3),(3,4) ==> (2,4)
	 *
	 * Be aware that more than two line segments might merge, eg:
	 * (1,3), (2,4), (4,5) ==> (1,5)
	 *
	 * Change this class accordingly to come up with a clean
	 * design (eg, add helper methods/classes).
	 *
	 * So for example, if the input collection has N LineSegment
	 * objects, you could end up with the output containing just
	 * 1 if they all happened to merge. On the other hand, if none
	 * merged, then you'd get back N objects (sorted).
	 */
	public static Collection mergeAndSort( Collection c )
  {
    // check the null argument
    if(c == null)
      return null;

    // convert to a convenient vector
    Vector v = new Vector();
    Iterator iter = c.iterator();
    while(iter.hasNext())
      v.addElement(iter.next());

    // check if there is anything to do
    if(v.size() <= 1)
      return v; // nothing to do

    // sort the collection
    Collections.sort(v);

    // initialize
    int dataCount = 0;
    Vector result = new Vector();

    while(dataCount < v.size() - 1)
    {
      // initialize loop variables
      LineSegment currentSegment = (LineSegment)v.elementAt(dataCount); // the current data segment
      LineSegment nextSegment = (LineSegment)v.elementAt(dataCount + 1); // the next data segment

      // the current result segment
      LineSegment resultSegment = new LineSegment(currentSegment.beginPoint, currentSegment.endPoint);

      // if the next segment is a subsegment of the current result, just skip it
      if(nextSegment.beginPoint <= resultSegment.endPoint &&
         nextSegment.endPoint <= resultSegment.endPoint)
        dataCount++;

      // while the next segment is connected to the result, expand the result
      while(nextSegment.beginPoint <= resultSegment.endPoint && dataCount < v.size() - 1)
      {
        resultSegment.endPoint = nextSegment.endPoint;
        dataCount++;
        if(dataCount == v.size() - 1)
          break; // reached the end of the data
        nextSegment = (LineSegment)v.elementAt(dataCount + 1);
      }

      // at this point we have a result segment; add it
      result.addElement(resultSegment);

      // move on in the data set
      dataCount++;

    }

    return result;
	}
}
