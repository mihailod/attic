package chuchurocket.game;

import java.awt.*;
import java.awt.event.*;
import java.io.*;
import javax.swing.*;

import chuchurocket.util.*;

/**
 * <p>Title: ChuChu Rocket</p>
 * <p>Description: A java port of a well known SEGA's game for Dreamcast</p>
 * <p>Copyright: Copyright (c) 2003 Mihailo Despotovic (game idea (c)SEGA)</p>
 * <p>Company: </p>
 * @author Mihailo Despotovic
 * @version 1.0
 */

public class GameFrame extends JFrame implements ActionListener
{
  private GameEngine ge = null;

  private CoolButton start = new CoolButton("play");
  private CoolButton dash = new CoolButton("ff");
  private CoolButton reset = new CoolButton("stop");

  private JLabel levelLabel = new JLabel("", JLabel.CENTER)
  {
    public void paint(Graphics g)
    {
      //if(ge.moving)
      //  return;
      Constants.paintBlurredText(g, "LEVEL " + Constants.format(level),
        getWidth(), getHeight(), Color.white);
    }
  };

  private Board board = new Board();
  private BoardPanel bp = new BoardPanel(board, null, this);
  private ArrowsPanel ap = new ArrowsPanel(null, this);
  public ArrowsPanel getArrowsPanel() { return ap; }

  private int level = 1;

  public GameFrame()
  {
    super("ChuChu Cheese V1.0 By Mihailo Despotovic, October 2003.");
    this.setResizable(false);
    this.addWindowListener(new WindowAdapter() { public void windowClosing(WindowEvent we) { System.exit(0); } });
    Container cp = this.getContentPane();
    cp.setLayout(new BorderLayout());
    cp.add(bp, BorderLayout.CENTER);
    JPanel south = new JPanel(new BorderLayout());
    ge = new GameEngine();

    JPanel levelPanel = new JPanel(new BorderLayout())
    {
      public void paint(Graphics g)
      {
        Graphics2D g2 = (Graphics2D)g;
        g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        super.paint(g);
      }
    };
    levelLabel.setFont(Constants.FONT1);
    levelLabel.setForeground(Color.white);
    levelPanel.setBackground(Color.black);
    levelPanel.add(levelLabel, BorderLayout.CENTER);

    JPanel levelAndArrowsPanel = new JPanel(new BorderLayout());
    levelAndArrowsPanel.add(ap, BorderLayout.CENTER);

    JPanel buttons = new JPanel(new GridLayout(1, 3, 0, 0));
    buttons.setBackground(Color.black);
    buttons.add(start);
    buttons.add(dash);
    buttons.add(reset);
    start.addActionListener(this);
    dash.addActionListener(this);
    reset.addActionListener(this);

    south.add(levelAndArrowsPanel, BorderLayout.WEST);
    south.add(levelPanel, BorderLayout.CENTER);
    south.add(buttons, BorderLayout.EAST);

    cp.add(south, BorderLayout.SOUTH);
    pack();
    start.initStatics(start.getWidth(), start.getHeight());
    Constants.center(this);

    // test level /////////////////
    File file = new File("/4");
    Constants.load(board, ap, file, this, new JTextField());
    ge.setBoardPanel(bp);
    //////////////////////////////

    show();
  }

  public void actionPerformed(ActionEvent ae)
  {
    if(ae.getSource() == start)
      ge.start();
    else if(ae.getSource() == dash)
      ge.dash();
    else if(ae.getSource() == reset)
      ge.reset();
  }

  public boolean isMoving()
  {
    return ge.moving;
  }
}