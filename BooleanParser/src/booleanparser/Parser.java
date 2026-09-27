package booleanparser;

/*
 * @author Mihailo Despotovic
 * @since 01/09/2003
 * @version 1.0
 *
 * E -> F { OR F }
 * F -> P { AND P }
 * P -> ( E ) | NOT E | #1# | #2# | ...
 */

public class Parser {

  private String s = "#0# AND ( #2# OR NOT #3# ) OR NOT #5# AND #6# AND NOT #7#";

  private Node root = new Node();

  public static void main(String[] a)
  {
    Parser p = new Parser();
    System.out.println(p.s);
    p.translate();
    //p.matchE(p.root);
    //p.dump(p.root, 0);
  }

  private void matchE(Node n)
  {
    n.l = new Node();
    matchF(n.l);
    while(true)
    {
      if(nextToken().equals("OR"))
      {
        matchOR();
        n.content = "or";

        n.r = new Node();
        matchF(n.r);
      }
      else return;
    }
  }

  private void matchF(Node n)
  {
    n.l = new Node();
    matchP(n.l);
    while(true)
    {
      if(nextToken().equals("AND"))
      {
        matchAND();
        n.content = "and";

        n.r = new Node();
        matchP(n.r);
      }
      else return;
    }
  }

  private void matchP(Node n)
  {
    if(nextToken().equals("("))
    {
      matchLP();
      matchE(n);
      matchRP();
    }
    else if(nextToken().equals("NOT"))
    {
      matchNOT();
      matchE(n);
    }
    else
    {
      matchNumber(n);
    }
  }

  private void matchAND()
  {
    s = s.substring("AND ".length(), s.length());
  }

  private void matchOR()
  {
    s = s.substring("OR ".length(), s.length());
  }

  private void matchNOT()
  {
    s = s.substring("NOT ".length(), s.length());
  }

  private void matchLP()
  {
    s = s.substring("( ".length(), s.length());
  }

  private void matchRP()
  {
    if(s.length() == 1) s = "";
    else s = s.substring(") ".length(), s.length());
  }

  private void matchNumber(Node n)
  {
    s = s.substring(1, s.length());
    int end = s.indexOf("#");
    String num = s.substring(0, end);
    System.out.println("LEAF: " + num);
    //n.content = num;
    //dump(root, 0);
    if(s.length() > 2) s = s.substring(end + 2, s.length());
  }

  private String nextToken()
  {
    int space = s.indexOf(" ");
    if(space < 0) return s;
    String token = s.substring(0, space);
    System.out.println("Next token: |" + token + "|");
    return token;
  }

  private void dump(Node n, int depth)
  {
    if(n == null) return;
    dump(n.l, depth + 1);
    for(int i=0; i<depth; i++) System.out.print(" ");
    System.out.println( n.content);
    dump(n.r, depth + 1);
  }


  private void translate()
  {
    String res = "";

    while(true)
    {
      String nt = nextToken();

      if(nt.startsWith("#") && nt.endsWith("#"))
      {
        nt = nt.substring(1, nt.length() -1);
        res += (nt + " ");
        matchNumber(null);
      }
      else if(nt.equals("OR"))
      {
        stack.push(" or");
        matchOR();
      }
      else if(nt.equals("AND"))
      {
        stack.push(" and");
        matchAND();
      }
      else if(nt.equals("("))
      {
        matchLP();
      }
      else if(nt.equals(")"))
      {
        res += (String)stack.pop();
        matchRP();
      }
      else if(nt.equals("NOT"))
      {
        stack.push(" not");
        matchNOT();
      }
      else break;
    }

    while(!stack.isEmpty())
    {
      res += ((String)stack.pop());
    }

    System.out.println("RESULT:");
    System.out.println(res);
  }

  private static java.util.Stack stack = new java.util.Stack();

}


class Node
{
  public Node() { content = "n/a"; }

  String content = null;
  Node l = null;
  Node r = null;
}
