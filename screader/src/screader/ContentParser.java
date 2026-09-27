package screader;

import java.util.*;

public class ContentParser
{
  public Vector topics = null;

  public void parseTopics(String all)
  {
    topics = new Vector();
    Topic t = null;
    if(all.startsWith("ERROR"))
    {
      t = new Topic();
      t.title = all;
      topics.addElement(t);
      return;
    }
    StringBuffer sb = new StringBuffer();
    int start, end = 0;
    String token = null;
    while(all.indexOf(Constants.MSG_HEADER) > 0)
    {
      t = new Topic();

      start = all.indexOf(Constants.MSG_HEADER) + Constants.MSG_OFFSET;
      all = all.substring(start, all.length());
      end = all.indexOf(">") - 1;
      t.url = all.substring(0, end);
      t.url = Constants.SC_URL + t.url;

      start = all.indexOf("/diskusije/mesg/");
      all = all.substring(start, all.length());
      start = all.indexOf(">") + 1;
      all = all.substring(start, all.length());
      end = all.indexOf("</a>");
      token = all.substring(0, end);
      t.title = token;

      start = all.indexOf("<b>") + "<b>".length();
      end = all.indexOf("</b>");
      token = all.substring(start, end);
      t.author = token;

      start = all.indexOf("<font size=-1>") + "<font size=-1>".length() + 1;
      end = all.indexOf("</font>") - 1;
      int newLine = all.indexOf("<br");
      if(newLine > 0 && newLine > start && newLine > end)
      {
        token = all.substring(start, end);
        t.replies = Integer.parseInt(token);
      }
      else
      {
        t.replies = 0;
      }

      topics.addElement(t);
    }

    // next?
    if(all.indexOf("NEXT") > 0)
    {
      start = all.indexOf("<a href");
      end = all.indexOf("\">");
      t = new Topic();
      t.title = "";
      t.author = "";
      t.replies = -1;
      t.url = all.substring(start + Constants.MSG_OFFSET, end);
      topics.addElement(t);
    }
  }

  public String parseSingleTopic(String all)
  {
    //System.out.println("all=" + all);
    if(all.indexOf("<blockquote>") < 0)
      return "Sorry.  Cannot parse the topic..."; // something is wrong

    StringBuffer resb = new StringBuffer("");
    String temp = "";
    boolean first = true;

    while(all.indexOf("<blockquote>") >= 0)
    {
      int start = all.indexOf("<blockquote>") + "<blockquote>".length();
      if(first) start += "<b><font color=green>".length();
      else start += "<br><b>".length();
      all = all.substring(start, all.length());
      int end = all.indexOf("</blockquote>");
      temp = all.substring(0, end);

      // get rid of email
      if(temp.startsWith("<a href"))
      {
        start = temp.indexOf(">") + 1;
        end = temp.indexOf("</a>");
        temp = temp.substring(start, end) +
               temp.substring(end + "</a>".length(), temp.length());
      }

      start = temp.indexOf("<p>");
      temp = temp.substring(0, start) + "\n" +
             temp.substring(start + "<p>".length(), temp.length());

      if(first) temp = Util.replaceStrings(temp, "</font></b>", "");
      temp = Util.cleanString(temp);

      resb.append(temp);
      resb.append("\n__________________________________________\n\n");

      first = false;
    }

    return resb.toString();
  }
}
