package ttt;

import java.awt.*;
import java.awt.event.*;

/**
 * Encapsulates a trivial message box.
 */
public class MessageBox extends Frame implements ActionListener
{
  private static final int W = 200;
  private static final int H = 150;

  Button b = new Button("OK");
  tttFrame tf = null;

  public MessageBox(String title, String message, tttFrame tf)
  {
    super(title);
    this.tf = tf;

    int w = Toolkit.getDefaultToolkit().getScreenSize().width;
    int h = Toolkit.getDefaultToolkit().getScreenSize().height;
    int x = (w - W) / 2;
    int y = (h - H) / 2;
    setBounds(x, y, W, H);

    setResizable(false);
    setLayout(new BorderLayout());
    Panel p = new Panel(new FlowLayout(FlowLayout.CENTER));
    p.add(new Label(message), BorderLayout.CENTER);

    Panel bWrap = new Panel(new FlowLayout(FlowLayout.CENTER));
    bWrap.add(b);
    b.addActionListener(this);

    add(p, BorderLayout.CENTER);
    add(bWrap, BorderLayout.SOUTH);

    // closing of the frame
    this.addWindowListener(
     new WindowAdapter()
     {
       public void windowClosing(WindowEvent we)
       {
         MessageBox.this.dispose();
       }
     }
    );

    show();
  }

  public void actionPerformed(ActionEvent ae)
  {
    dispose();
    tf.restart();
  }
}