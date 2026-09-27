package screader;

import javax.swing.*;
import javax.swing.tree.*;
import java.util.*;

public class TreeProducer
{
  public static Hashtable ht = new Hashtable();

  public static TreeNode produceTree()
  {
    String content = ContentGetter.getContent
    (Constants.SC_ROOT, ContentGetter.TREE);

    DefaultMutableTreeNode root = new DefaultMutableTreeNode("Serbian Cafe");
    DefaultMutableTreeNode branch = null;
    DefaultMutableTreeNode node = null;

    String name = null;
    String url = null;

    int ahref = 0;
    int subh = 0;
    int st = 0;
    int end = 0;
    int size = 0;

    content = Util.replaceStrings
      (content, "<a href=/diskusije", "<a href=\"/diskusije");

    while(true)
    {
      ahref = content.indexOf(Constants.MSG_HEADER);
      subh = content.indexOf("<b class=subheading>");

      if(ahref < 0) break;

      // main topics that are not hyperlinked
      if((subh > 0) && (subh < ahref))
      {
        st = subh + "<b class=subheading>".length();
        end = content.indexOf("</b>");
        name = content.substring(st, end);
        url = "";
        ht.put(name, url);
        branch = new DefaultMutableTreeNode(Util.cleanString(name));
        root.add(branch);
        content = content.substring
          (end + "</b>".length(), content.length());
        continue;
      }

      st = content.indexOf(Constants.MSG_HEADER);
      String temp = content.substring(st, content.length());
      size = temp.indexOf("</a>");
      name = temp.substring(0, size);

      url = Util.getFirstUrl(name);
      url = Constants.SC_URL + url;

      if(name.indexOf("<b class=subheading>") >= 0)
      {
        int start1 = name.indexOf("=subheading>") + "=subheading>".length();
        int end1 = name.indexOf("</b>");
        name = name.substring(start1, end1);
        ht.put(name, url);
        branch = new DefaultMutableTreeNode(Util.cleanString(name));
        root.add(branch);
      }
      else
      {
        int start1 = name.indexOf(">") + 1;
        name = name.substring(start1, name.length());
        node = new DefaultMutableTreeNode(Util.cleanString(name));
        ht.put(name, url);
        if(branch != null) branch.add(node);
        else root.add(node);
      }

      content = content.substring
        (st + size + 1 + "</X>".length(), content.length());
    }

    return root;
  }
}
