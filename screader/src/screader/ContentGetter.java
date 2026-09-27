package screader;

import java.io.*;
import java.net.*;

public class ContentGetter
{
  public static final int TREE = 0;
  public static final int TOPICS = 1;
  public static final int SINGLE_TOPIC = 2;

  public static String getContent(String url, int what)
  {
    try
    {
      BufferedReader br = null;
      try
      {
        URL u = new URL(url);
        URLConnection c = u.openConnection();
        InputStreamReader sr = new InputStreamReader(c.getInputStream());
        br = new BufferedReader(sr);
      }
      catch(UnknownHostException uhe)
      {
        String fname = null;
        switch(what)
        {
          case(TOPICS) :
          {
            fname = "c:\\mihailo\\screader\\screader\\kosarkatopics.txt";
            break;
          }
          case(SINGLE_TOPIC) :
          {
            fname = "c:\\mihailo\\screader\\screader\\singletopic.txt";
            break;
          }
          case(TREE) :
          {
            fname = "c:\\mihailo\\screader\\screader\\tree.txt";
            break;
          }
          default : throw new IllegalArgumentException("Unknown type");
        }

        br = new BufferedReader(new FileReader(new File(fname)));
      }

      StringBuffer sb = new StringBuffer("");
      String line = null;
      while((line = br.readLine()) != null) sb.append(line);
      return sb.toString();
    }
    catch(Exception e)
    {
      return "ERROR: " + e.toString();
    }
  }
}
