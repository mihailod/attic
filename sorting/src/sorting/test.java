package sorting;

import java.io.*;

public class test
{
  public static void main (String[] args)
  {
    int age = 0;
    System.out.print ("Enter your age: " );
    int chr = -1;
    String read = "";
    while(true)
    {
      try { chr = System.in.read(); }
      catch(IOException ioe) { ioe.printStackTrace(); }
      if(chr == 13) break; // wait for ENTER
      read += (char)chr;
    }
    try { age = Integer.parseInt(read); }
    catch(NumberFormatException nfe) { System.out.println("Bad age! Try again..."); return; }
    System.out.println ("Next year you will be " + (age+1));
  }
}