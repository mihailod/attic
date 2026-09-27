package screader;

import javax.swing.*;
import javax.swing.border.*;
import java.awt.*;
import java.awt.event.*;
import java.util.*;

public class MainJFrame extends JFrame
  implements ActionListener, MouseListener
{
  private JSplitPane treeAndTopics = null;
  private JSplitPane upAndDown = null;
  private Insets insets2205 = new Insets(2, 2, 0, 5);
  private Border emptyBorder = BorderFactory.createEmptyBorder();
  private ContentParser cp = new ContentParser();
  private JTextArea ta = new JTextArea();
  private JTree jt = null;

  public MainJFrame()
  {
    super();

    this.addWindowListener( new WindowAdapter()
       { public void windowClosing(WindowEvent e) { System.exit(0); } } );
    Container c = this.getContentPane();
    c.setLayout(new BorderLayout());

    JPanel treePanel = new JPanel();
    JPanel topicsPanel = new JPanel();
    JPanel threadPanel = new JPanel();
    threadPanel.setLayout(new BorderLayout());
    threadPanel.add(ta, BorderLayout.CENTER);
    ta.setEditable(false);
    ta.setBackground(Color.yellow);
    ta.setLineWrap(false);
    ta.setDoubleBuffered(true);
    ta.setLineWrap(true);
    ta.setMargin(new Insets(5, 5, 5, 20));

    JScrollPane jsp2 = new JScrollPane(topicsPanel);
    topicsPanel.setLayout(new GridBagLayout());
    GridBagConstraints gbc = new GridBagConstraints();

    JScrollPane jsp3 = new JScrollPane(threadPanel);

    treeAndTopics = new JSplitPane
      (JSplitPane.HORIZONTAL_SPLIT, treePanel, jsp2);
    upAndDown = new JSplitPane
      (JSplitPane.VERTICAL_SPLIT, treeAndTopics, jsp3);

    treeAndTopics.setOneTouchExpandable(true);
    treeAndTopics.setContinuousLayout(true);
    upAndDown.setOneTouchExpandable(true);
    upAndDown.setContinuousLayout(true);

    c.add(upAndDown, BorderLayout.CENTER);

    jt = new JTree(TreeProducer.produceTree());
    jt.addMouseListener(this);
    treePanel.setLayout(new BorderLayout());
    JScrollPane jsp = new JScrollPane(jt);
    treePanel.add(jsp);

    Topic t = null;
    cp.parseTopics(ContentGetter.getContent
    (Constants.SC_URL + Constants.KOSARKA_POSTFIX, ContentGetter.TOPICS));
    if(cp.topics.size() == 0)
    {
      gbc.gridx = 0; gbc.gridy = 0;
      JLabel l = new JLabel("No topics!");
      topicsPanel.add(l, gbc);
      return;
    }
    String rstring = null;
    JButton b = null;
    JPanel ppp = null;
    for(int i=0; i<cp.topics.size(); i++)
    {
      t = (Topic)cp.topics.elementAt(i);
      b = new JButton("" + (i+1));
      b.addActionListener(this);
      if(t.replies <= 0) rstring = "";
      else if(t.replies == 1) rstring = "reply";
      else rstring = "replies";
      JTextField tf = new JTextField(t.title + " -- " + t.author + " " +
        (t.replies == 0 ? "" : "(" + t.replies + " " + rstring + ")"));
      tf.setBorder(emptyBorder);
      tf.setEditable(false);
      if(t.title.startsWith("ERROR"))
      {
        topicsPanel.setLayout(new BorderLayout());
        topicsPanel.add(new JLabel(t.title));
        break;
      }
      else if(t.replies == -1)
      {
        b.setText("Next 40");
        gbc.fill = gbc.NONE;
        gbc.gridx = 1; gbc.gridy = i; gbc.anchor = gbc.WEST;
        topicsPanel.add(b, gbc);
      }
      else
      {
        gbc.gridx = 0; gbc.gridy = i; gbc.anchor = gbc.WEST;
        gbc.fill = gbc.BOTH; gbc.insets = insets2205;
        topicsPanel.add(b, gbc);
        gbc.gridx = 1; gbc.gridy = i; gbc.anchor = gbc.WEST;
        topicsPanel.add(tf, gbc);
      }
    }

    setGuiStuff();
    this.setVisible(true);
  }

  private void setGuiStuff()
  {
    int w = (int)(Toolkit.getDefaultToolkit().getScreenSize().getWidth() * 0.90);
    int h = (int)(Toolkit.getDefaultToolkit().getScreenSize().getHeight() * 0.90);
    int x = (int)((Toolkit.getDefaultToolkit().getScreenSize().getWidth() - w) / 2);
    int y = (int)((Toolkit.getDefaultToolkit().getScreenSize().getHeight() - h) / 2);
    this.setBounds(x, y, w, h);
    this.setTitle(Constants.MAIN_TITLE);

    treeAndTopics.setDividerLocation((int)(0.25 * getWidth()));
    upAndDown.setDividerLocation((int)(0.66 * getHeight()));

    treeAndTopics.setDoubleBuffered(true);
    upAndDown.setDoubleBuffered(true);
  }

  public void actionPerformed(ActionEvent ae)
  {
    if(ae.getSource() instanceof JButton)
    {
      String label = ((JButton)ae.getSource()).getText();
      try
      {
        int n = Integer.parseInt(label) - 1;
        setCursor(new Cursor(Cursor.WAIT_CURSOR));
        String text = cp.parseSingleTopic(ContentGetter.getContent
          (((Topic)cp.topics.elementAt(n)).url, ContentGetter.SINGLE_TOPIC));
        //ta.setText(Util.formatText(text, 80));
        ta.setText(text);
        ta.setCaretPosition(0);
        setCursor(new Cursor(Cursor.DEFAULT_CURSOR));
      }
      catch(NumberFormatException nfe) { }
      if(label.indexOf("ext") > 0)
      {
        System.out.println("call next: " +
          ((Topic)cp.topics.elementAt(cp.topics.size() - 1)).url);
      }
    }
  }

  public void mouseClicked(MouseEvent me)
  {
    String key = null;
    try
    {
      key =  jt.getSelectionPath().getLastPathComponent().toString();
    }
    catch(Exception e) { /* ignore */ }
    if(key != null && key.length() > 0 &&
       TreeProducer.ht.get(key) != null &&
       TreeProducer.ht.get(key).toString().length() > 0)
    {
      System.out.println("CALL: " + TreeProducer.ht.get(key));
    }
  }
  public void mouseExited(MouseEvent me) {}
  public void mouseEntered(MouseEvent me) {}
  public void mouseReleased(MouseEvent me) {}
  public void mousePressed(MouseEvent me) {}
}
