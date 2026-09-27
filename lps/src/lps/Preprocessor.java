package lps;

import java.io.*;

/**
 * <p>Title: LPS</p>
 * <p>Description: Letters Puzzle Solver</p>
 * <p>Copyright: Copyright (c) 2003</p>
 * <p>Company: </p>
 * @author Mihailo Despotovic
 * @version 1.0
 */
public class Preprocessor
{
  private static final int PROGRESS_TICK = 20000;

  private static int min = -1;
  private static int max = -1;
  private static File f = null;

  private static StringBuffer sb = new StringBuffer();

  /**
   * 1st argument: file name
   * 2nd argument: min number of letters
   * 3rd argument: max number of letters
   *
   * Will create fileName.idx file
   */
  public static void main(String args[])
  {
    if(args.length != 3)
      usage();
    String ret = null;
    if((ret = badArgs(args)) != null)
    {
      Solver.log("Bad arguments:");
      Solver.log(ret);
      usage();
    }
    try
    {
      preprocess();
    }
    catch(Exception e)
    {
      Solver.log("FATAL EXCEPTION!!!");
      e.printStackTrace();
      usage();
    }
  }

  private static String badArgs(String args[])
  {
    f = new File(args[0]);
    if(!f.exists())
      return "File doesn't exist!";
    try
    {
      min = Integer.parseInt(args[1]);
      max = Integer.parseInt(args[2]);
      if(min < 1 || max > 12)
        throw new Exception();
    }
    catch(Exception e)
    {
      return "Bad min/max number.";
    }
    return null; // all ok!
  }

  private static void usage()
  {
    Solver.log("Preprocessor will create the .idx file");
    Solver.log("Usage: Preprocessor <inputFile> <minLetters> <maxLetters>");
    Solver.log("File should exist, min>=1, max<=12.");
    System.exit(-1);
  }

  private static void preprocess() throws Exception
  {
    File indexFile = new File(f.getName() + ".idx");
    long totalWords = 0;
    long shorter = 0;
    long longer = 0;
    long badLines = 0;
    BufferedReader br = new BufferedReader(new FileReader(f));
    PrintWriter pw = new PrintWriter(new FileWriter(indexFile));
    String line = null;
    String finalLine = null;
    String currentWord = null;
    String index = null;
    while(true)
    {
      line = br.readLine();
      if(line == null)
        break;

      currentWord = getWord(line);
      if(currentWord == null)
        badLines++;
      else // we have a word
      {
        totalWords++;
        if(totalWords % PROGRESS_TICK == 0)
          Solver.log(totalWords + " processed so far...");

        if(currentWord.length() > max)
          longer++;
        else if(currentWord.length() < min)
          shorter++;
        else // happy path!
        {
          // write word and it's index
          index = Solver.index(currentWord);
          if(index == null)
          {
            badLines++;
            continue;
          }
          finalLine = currentWord + "\t" + index;
          pw.println(finalLine);
          pw.flush();
        }
      }
    }
    br.close();
    pw.flush();
    pw.close();

    Solver.log("Done!");
    Solver.log("Bad lines " + badLines);
    Solver.log("Total words " + totalWords);
    Solver.log("Words shorter than " + min + ": " + shorter);
    Solver.log("Words longer than " + max + ": " + longer);
    Solver.log("Final number of OK words " + (totalWords - (shorter + longer)));
  }

  /**
   * This method is highly data dependant!!!
   * Expects one '<b>word</b>' combination per line
   */
  private static String getWord(String line)
  {
    String s = line.toLowerCase();
    int start = s.indexOf("<b>");
    int end = s.indexOf("</b>");
    if(start < 0 || end < 0)
      return null;
    String ret = s.substring(start + 3, end);
    if(ret.indexOf("'") >= 0 ||
       ret.indexOf("-") >= 0 ||
       ret.indexOf(" ") >= 0 ||
       ret.indexOf("/") >= 0 ||
       ret.indexOf("\"") >= 0 ||
       ret.indexOf(".") >= 0 ||
       ret.indexOf("(") >= 0 ||
       ret.indexOf(")") >= 0)
       return null;
    return ret.trim();
  }
}