package screader;

public class Util
{
  // replace all occurences of s1 with s2 in s
  public static String replaceStrings(String s, String s1, String s2)
  {
    if (s == null || s1 == null || s2 == null || s1.equals("")) return s;

    StringBuffer res = new StringBuffer();
    int s1_len = s1.length();

    for (int i = 0; i < s.length(); i++)
    {
      if ((i <= s.length() - s1_len) &&
          (s.substring(i, i + s1_len).equals(s1)))
      {
        res.append(s2);
        i += s1_len - 1;
      }
      else
      {
        res.append(s.charAt(i));
      }
    }
    return res.toString();
  }

  // cleans string for gui display
  public static String cleanString(String s)
  {
    s = replaceStrings(s, "<b>", "");
    s = replaceStrings(s, "<B>", "");
    s = replaceStrings(s, "</b>", "");
    s = replaceStrings(s, "</B>", "");

    s = replaceStrings(s, "<br>", "\n");
    s = replaceStrings(s, "<BR>", "\n");
    s = replaceStrings(s, "<Br>", "\n");
    s = replaceStrings(s, "<bR>", "\n");

    return s;
  }

  // returns the first url pointer in the string
  public static String getFirstUrl(String s)
  {
    int start1 = s.indexOf("<a href=") + "<a href=".length();
    int end1 = s.indexOf(">");
    String url = s.substring(start1, end1);
    url = Util.replaceStrings(url, "\"", "");
    url = Util.replaceStrings(url, "//", "/");
    return url;
  }

  public static String formatText(String s, int cols)
  {
    String temp = "";
    while(true)
    {
      if(s.length() <= cols) break;
      temp += s.substring(0, cols);
      temp += "\n";
      s = s.substring(cols, s.length());
    }
    return temp;
  }
}
