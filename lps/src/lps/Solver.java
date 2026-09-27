package lps;

import java.applet.*;
import java.awt.*;
import java.awt.event.*;
import java.io.*;
import java.util.*;

/**
 * Title: LPS
 * Description: Letters Puzzle Solver
 * Copyright: Copyright (c) 2003 Mihailo Despotovic
 * @author Mihailo Despotovic
 * @version 1.0
 */
public class Solver extends Applet
{
  public static String alphabet = "abcdefghijklmnopqrstuvwxyz";

  public static final int ROMAN_LETTERS = 26;
  private static final int TICK = 1000;
  private static final String TICK_CHAR = ".";
  private static final String DB_FILENAME = "words.idx";

  private static StringBuffer sb = new StringBuffer();
  private static String letters = null;

  private static TextArea ta = new TextArea("", 40, 60, TextArea.SCROLLBARS_VERTICAL_ONLY);
  private static TextField tf = new TextField("DSTPYGNEUEIA", 25);
  private static Button b = new Button("Solve");

  public void init()
  {
    final Frame f = new Frame("Letter Puzzle Solver V1.0 by Mihailo Despotovic");

    f.addWindowListener(new WindowAdapter()
    {
      public void windowClosing(WindowEvent we)
      {
        f.dispose();
      }
    });

    f.setLayout(new BorderLayout());
    Panel north = new Panel(new FlowLayout(FlowLayout.LEFT));
    north.add(new Label("Puzzle:"));
    north.add(tf);
    north.add(b);
    b.addActionListener(new ActionListener()
    {
      public void actionPerformed(ActionEvent ae)
      {
        main(new String[] { tf.getText() });
      }
    });
    f.add(north, BorderLayout.NORTH);

    f.add(ta, BorderLayout.CENTER);
    ta.setEditable(false);
    ta.setBackground(Color.white);

    f.setBounds(50, 20, 200,200);
    f.pack();
    f.show();
  }

  public static void main(String args[])
  {
    if(args.length != 1)
      usage();
    letters = keepLettersOnly(args[0].toLowerCase());
    try
    {
      solve();
    }
    catch(Exception e)
    {
      log("FATAL ERROR!!!");
      e.printStackTrace();
      usage();
    }
  }

  private static void solve() throws Exception
  {
    if(ta == null)
    {
      log("");
      log("Welcome to Letter Puzzle Solver, V1.0");
      log("");
    }
    else
      ta.setText("");
    log("Matching pattern: " + letters + "\n");
    BufferedReader br = getBufferedReader(DB_FILENAME);
    String line = null;
    String localIndex = index(letters);
    Vector words = new Vector();
    int count = 0;
    while(true)
    {
      line = br.readLine();
      if(line == null)
        break;
      count++;
      if(count % TICK == 0)
        l(TICK_CHAR);
      int indexStart = line.indexOf("\t") + 1;
      String word = line.substring(0, indexStart-1);
      String index = line.substring(indexStart, line.length());
      if(similarIndex(index, localIndex))
        words.addElement(word);
    }
    br.close();

    words = removeDuplicates(words);

    log("\n\n[" + count + " words processed]\n");
    for(int i=7; i<13; i++)
    {
      log("Size " + i + " words:");
      int specific = 0;
      for(int j=0; j<words.size(); j++)
      {
        String temp = (String)words.elementAt(j);
        if(temp.length() == i)
        {
          l(temp + " ");
          specific++;
        }
      }
      if(specific == 0)
        log("Sorry, no match with " + i + " letters found.\n");
      else
        log("\nTotal of " + specific + " word(s) of size " + i + " found.\n");
    }

    log("Thank you for using Letter Puzzle Solver");
    log("Please, do not use results of this program for humiliation purposes.");
    log("");
    log("Program by Mihailo Despotovic, October 2003.");
    log("http://home.earthlink.net/~mihailod - mihailod@hotmail.com");
  }

  private static void usage()
  {
    log("Usage: Solver <letters>");
    System.exit(-1);
  }

  private static boolean similarIndex(String index, String localIndex)
  {
    int numberOfEquals = 0;
    for(int i=0; i<ROMAN_LETTERS; i++)
    {
      if(index.charAt(i) == '0' && localIndex.charAt(i) == '0')
        continue;
      else if(index.charAt(i) == localIndex.charAt(i))
        numberOfEquals++;
      else if(index.charAt(i) - '0' > 0 && localIndex.charAt(i) - '0' == 0)
        return false;
      else if(index.charAt(i) - '0' == 0 && localIndex.charAt(i) - '0' > 0)
        continue;
      else if(index.charAt(i) - '0' < localIndex.charAt(i) - '0')
        numberOfEquals++;
      else if(index.charAt(i) - '0' > localIndex.charAt(i) - '0')
        return false;
    }

    return numberOfEquals > 6;
  }

  public static String index(String word)
  {
    try
    {
      int[] index = new int[Solver.ROMAN_LETTERS];
      for(int i=0; i<word.length(); i++)
      {
        String currentLetter = "" + word.charAt(i);
        int position = alphabet.indexOf(currentLetter);
        index[position]++;
      }
      sb.setLength(0);
      for(int i=0; i<index.length; i++)
        sb.append(String.valueOf(index[i]));
      return sb.toString();
    }
    catch(Exception e)
    {
      Solver.log("Rejecting word: " + word);
      return null;
    }
  }


// utility methods

  private static Vector removeDuplicates(Vector v)
  {
    Vector res = new Vector();
    for(int i=0; i<v.size(); i++)
      if(!res.contains(v.elementAt(i)))
         res.addElement(v.elementAt(i));
    return res;
  }

  /**
   * Utility method to get a reader for a file depending on the file's location (filesystem or JAR)
   * @param name the file's name
   */
  private static final BufferedReader getBufferedReader(String name)
  {
    BufferedReader br = null;
    try
    {
      br = new BufferedReader(new FileReader(name)); // file system?
    }
    catch(Exception e) // not in the file system, try the JAR
    {
      InputStream in = Solver.class.getResourceAsStream("/" + name); // JAR?
      br = new BufferedReader(new InputStreamReader(in));
    }
    return br;
  }

  private static String keepLettersOnly(String s)
  {
    StringBuffer res = new StringBuffer();
    for(int i=0; i<s.length(); i++)
    {
      char c = s.charAt(i);
      if(Character.isLetter(c))
        res.append(String.valueOf(c));
    }
    if(tf != null)
      tf.setText(res.toString());
    return res.toString();
  }

  public static void log(String s)
  {
    if(ta != null && ta.isShowing())
    {
      ta.append(s + "\n");
      try { ta.setCaretPosition(ta.getText().length()); }
      catch(Exception e) { ; }
    }
    else
      System.out.println(s);
  }

  public static void l(String s)
  {
    if(ta != null && ta.isShowing())
    {
      ta.append(s);
      try { ta.setCaretPosition(ta.getText().length()); }
      catch(Exception e) { ; }
    }
    else
      System.out.print(s);
  }
}