package tt;

import java.awt.*;
import java.awt.event.*;

/**
 * Encapsulates a trivial message box.
 */
public class MessageBox extends Frame implements ActionListener
{
  private Button b = new Button("  OK  ");
  private TTFrame tf = null;
  private boolean restart = false;

  public MessageBox(String title, String message, TTFrame tf, boolean restart, boolean textAreaDisplay)
  {
    super(title);
    this.tf = tf;
    this.restart = restart;

    this.setLayout(new BorderLayout());
    Panel p = new Panel(new BorderLayout());
    if(!textAreaDisplay)
    {
      p.add(new Label(message, Label.CENTER), BorderLayout.CENTER);
      this.setResizable(false);
    }
    else
    {
      TextArea ta = new TextArea(message, 20, 60, TextArea.SCROLLBARS_VERTICAL_ONLY);
      ta.setEditable(false);
      ta.setBackground(Color.white);
      p.add(ta);
      this.setResizable(true);
    }

    Panel bWrap = new Panel(new FlowLayout(FlowLayout.CENTER));
    bWrap.add(b);
    b.addActionListener(this);

    add(p, BorderLayout.CENTER);
    add(bWrap, BorderLayout.SOUTH);

    // closing of the frame
    this.addWindowListener(new WindowAdapter()
    {
      public void windowClosing(WindowEvent we)
      {
        MessageBox.this.dispose();
      }
    });

    pack();

    int w = Toolkit.getDefaultToolkit().getScreenSize().width;
    int h = Toolkit.getDefaultToolkit().getScreenSize().height;
    int x = (int)(w - getPreferredSize().width) / 2;
    int y = (int)(h - getPreferredSize().height) / 2;
    this.setBounds(x, y, (int)getPreferredSize().width, (int)getPreferredSize().height);

    show();
  }

  public void actionPerformed(ActionEvent ae)
  {
    dispose();
    if(restart && tf != null)
      tf.restart();
  }
}