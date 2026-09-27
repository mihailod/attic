package chuchurocket.editor;

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

public class EditorFrame extends JFrame implements ActionListener
{
  private JMenuItem restart = new JMenuItem("New");
  private JMenuItem save = new JMenuItem("Save Level");
  private JMenuItem load = new JMenuItem("Load Level");
  private JMenuItem quit = new JMenuItem("Quit Editor");
  private JMenuItem help = new JMenuItem("Instructions");
  private JMenuItem about = new JMenuItem("About");

  private JButton mouse = new JButton("Mouse");
  private JButton cat = new JButton("Cat");
  private JButton hole = new JButton("Hole");
  private JButton rocket = new JButton("Cheese");
  private JButton wall = new JButton("Wall");
  private JButton arrow = new JButton("Arrow");

  private JButton up = new JButton("^");
  private JButton down = new JButton("V");
  private JButton left = new JButton("<");
  private JButton right = new JButton(">");

  private JTextField name = new JTextField("New Level", 10);

  public int state = Constants.STATE_MOUSE;
  public int orientation = Constants.ORIENTATION_UP;

  private BoardPanel ep = null;
  private ArrowsPanel ap = null;
  private Board board = new Board();

  private JFileChooser jfc = new JFileChooser();

  public EditorFrame()
  {
    super("ChuChu Cheese Level Editor");
    Container cp = this.getContentPane();
    cp.setLayout(new BorderLayout());

    JMenuBar menuBar = new JMenuBar();

    JMenu helpMenu = new JMenu("Help");
    helpMenu.add(help);
    helpMenu.addSeparator();
    helpMenu.add(about);
    help.addActionListener(this);
    about.addActionListener(this);

    JMenu menu = new JMenu("File");
    menuBar.add(menu);
    menuBar.add(helpMenu);
    menu.add(restart);
    menu.addSeparator();
    menu.add(save);
    menu.add(load);
    menu.addSeparator();
    menu.add(quit);
    this.setJMenuBar(menuBar);
    restart.addActionListener(this);
    save.addActionListener(this);
    load.addActionListener(this);
    quit.addActionListener(this);

    JPanel south = new JPanel(new BorderLayout());
    ap = new ArrowsPanel(this, null);
    south.add(ap, BorderLayout.EAST);
    cp.add(south, BorderLayout.SOUTH);

    JPanel actions = new JPanel(new GridLayout(0, 1, 5, 5));
    JLabel nameLabel = new JLabel("Level Name", JLabel.LEFT);
    nameLabel.setForeground(Color.black);
    actions.add(nameLabel);
    actions.add(name);
    actions.add(new JPanel());
    actions.add(wall);
    actions.add(new JPanel());
    JPanel p = new JPanel(new GridLayout(1, 2, 5, 5));
    p.add(mouse); p.add(cat);
    actions.add(p);
    actions.add(new JPanel());
    p = new JPanel(new GridLayout(1, 2, 5, 5));
    p.add(rocket); p.add(hole);
    actions.add(p);
    actions.add(new JPanel());
    actions.add(arrow);
    mouse.addActionListener(this);
    cat.addActionListener(this);
    hole.addActionListener(this);
    rocket.addActionListener(this);
    wall.addActionListener(this);
    arrow.addActionListener(this);

    JPanel orientations = new JPanel(new GridLayout(3, 3, 4, 4));
    orientations.add(new JPanel());
    orientations.add(up);
    orientations.add(new JPanel());
    orientations.add(left);
    orientations.add(new JPanel());
    orientations.add(right);
    orientations.add(new JPanel());
    orientations.add(down);
    orientations.add(new JPanel());
    up.addActionListener(this);
    left.addActionListener(this);
    right.addActionListener(this);
    down.addActionListener(this);

    JPanel west = new JPanel(new BorderLayout());
    west.add(actions, BorderLayout.NORTH);
    west.add(orientations, BorderLayout.SOUTH);
    JPanel west1 = new JPanel(new GridBagLayout());
    GridBagConstraints gbc = new GridBagConstraints();
    gbc.insets = new Insets(8, 8, 8, 8);
    gbc.fill = gbc.BOTH;
    gbc.weightx = 1.0; gbc.weighty = 1.0;
    west1.add(west, gbc);
    cp.add(west1, BorderLayout.WEST);

    ep = new BoardPanel(board, this, null);
    cp.add(ep, BorderLayout.CENTER);

    this.addWindowListener(new WindowAdapter(){
      public void windowClosing(WindowEvent we) { quit(); }
    });

    resetButtons();
    setButtons();
    this.setResizable(false);
    pack();
    Constants.center(this);
    show();
  }

  public void actionPerformed(ActionEvent ae)
  {
    Object o = ae.getSource();
    if(o == save) save();
    else if(o == load) load();
    else if(o == quit) quit();
    else if(o == help) help();
    else if(o == about) about();
    else if(o == restart) restart();
    else if(o == cat) state = Constants.STATE_CAT;
    else if(o == mouse) state = Constants.STATE_MOUSE;
    else if(o == hole) state = Constants.STATE_HOLE;
    else if(o == rocket) state = Constants.STATE_ROCKET;
    else if(o == wall) state = Constants.STATE_WALL;
    else if(o == arrow) state = Constants.STATE_ARROW;
    else if(o == up) orientation = Constants.ORIENTATION_UP;
    else if(o == down) orientation = Constants.ORIENTATION_DOWN;
    else if(o == left) orientation = Constants.ORIENTATION_LEFT;
    else if(o == right) orientation = Constants.ORIENTATION_RIGHT;
    setButtons();
  }

  private void resetButtons()
  {
    mouse.setBackground(Constants.BUTTON_COLOR_NORMAL);
    cat.setBackground(Constants.BUTTON_COLOR_NORMAL);
    wall.setBackground(Constants.BUTTON_COLOR_NORMAL);
    rocket.setBackground(Constants.BUTTON_COLOR_NORMAL);
    hole.setBackground(Constants.BUTTON_COLOR_NORMAL);
    arrow.setBackground(Constants.BUTTON_COLOR_NORMAL);
    up.setBackground(Constants.BUTTON_COLOR_NORMAL);
    down.setBackground(Constants.BUTTON_COLOR_NORMAL);
    left.setBackground(Constants.BUTTON_COLOR_NORMAL);
    right.setBackground(Constants.BUTTON_COLOR_NORMAL);
  }

  private void setButtons()
  {
    resetButtons();
    switch(state)
    {
      case Constants.STATE_MOUSE : mouse.setBackground(Constants.BUTTON_COLOR_SELECTED); break;
      case Constants.STATE_CAT : cat.setBackground(Constants.BUTTON_COLOR_SELECTED); break;
      case Constants.STATE_HOLE : hole.setBackground(Constants.BUTTON_COLOR_SELECTED); break;
      case Constants.STATE_ROCKET : rocket.setBackground(Constants.BUTTON_COLOR_SELECTED); break;
      case Constants.STATE_WALL : wall.setBackground(Constants.BUTTON_COLOR_SELECTED); break;
      case Constants.STATE_ARROW : arrow.setBackground(Constants.BUTTON_COLOR_SELECTED); break;
    }
    switch(orientation)
    {
      case Constants.ORIENTATION_UP : up.setBackground(Constants.BUTTON_COLOR_SELECTED); break;
      case Constants.ORIENTATION_DOWN : down.setBackground(Constants.BUTTON_COLOR_SELECTED); break;
      case Constants.ORIENTATION_LEFT : left.setBackground(Constants.BUTTON_COLOR_SELECTED); break;
      case Constants.ORIENTATION_RIGHT : right.setBackground(Constants.BUTTON_COLOR_SELECTED); break;
    }
  }

  private void save()
  {
    name.setText(name.getText().trim());
    if(name.getText().length() == 0)
    {
      JOptionPane.showMessageDialog(this, "You must enter the level name.",
                                    "Level Name", JOptionPane.ERROR_MESSAGE);
      return;
    }

    File file = null;
    if(jfc.getSelectedFile() == null)
      jfc.setSelectedFile(new File(name.getText()));
    int res = jfc.showSaveDialog(this);
    if(res != JFileChooser.APPROVE_OPTION)
      return;

    file = jfc.getSelectedFile();
    jfc.setSelectedFile(file);
    Constants.save(file, board, ap, this, name);
  }

  private void load()
  {
    int res = jfc.showOpenDialog(this);
    if(res != JFileChooser.APPROVE_OPTION)
      return;

    File file = jfc.getSelectedFile();
    if(!file.exists())
    {
      JOptionPane.showMessageDialog(this, "The file does not exist.", "Load Level Error", JOptionPane.ERROR_MESSAGE);
      return;
    }
    jfc.setSelectedFile(file);
    Constants.load(board, ap, file, this, name);
    repaint();
  }

  private void restart()
  {
    board = new Board();
    ap.clearArrows();
    ep.setBoard(board);
    repaint();
  }

  private void help()
  {
    JOptionPane.showMessageDialog(this, Constants.EDITOR_INSTRUCTIONS,
                                  "Instructions", JOptionPane.INFORMATION_MESSAGE);
  }

  private void about()
  {
    JOptionPane.showMessageDialog(this, Constants.EDITOR_ABOUT,
                                  "About", JOptionPane.INFORMATION_MESSAGE);
  }

  private void quit()
  {
    dispose();
    System.exit(0);
  }
}