package tt;

import java.awt.*;
import java.awt.event.*;
import java.io.*;

/**
 * Frame to encapsulate the GUI for the game
 */
public class TTFrame extends Frame implements ActionListener, ItemListener
{
  // GUI appearance
  private static final String BOARD_FONT = "monospaced";
  private static final int BOARD_FONT_SIZE = 60;

  // GUI variables
  private TextArea status = null;
  private Button restartButton = new Button("Restart Game");
  private Button clearLogButton = new Button("Clear Log");
  private Checkbox playsFirstCB = new Checkbox("Computer Plays First");
  private Checkbox logCB = new Checkbox("Show Log", true);
  private Panel statusPanelWrap = null;
  public Button buttons[][] = null;
  private MenuItem instructionsMenuItem = new MenuItem("Instructions");
  private MenuItem aboutMenuItem = new MenuItem("About TeekoTeacher");
  private MenuItem databaseMenuItem = new MenuItem("Database Info");
  private CheckboxGroup cbg = new CheckboxGroup();
  public Checkbox adviseO = new Checkbox("Player 'O'", cbg, false);
  public Checkbox adviseX = new Checkbox("Player 'X'", cbg, false);
  public Checkbox adviseBoth = new Checkbox("Both", cbg, true);

  // internal variables
  private TTEngine engine = null;
  private boolean firstTime = true;
  private int field = -1; // the current clicked field
  private int prevField = -1; // the precvious clicked field

  /**
   * The constructor
   */
  public TTFrame()
  {
    super();
    TTBoard.f = this;
    engine = new TTEngine(this);
    initGUI();
    log("Welcome to TeekoTeacher");
    restart();
  }

  /**
   * Inits the GUI
   */
  private void initGUI()
  {
    setTitle("TeekoTeacher");
    setLayout(new BorderLayout());

    // set up the menu bar and menus
    MenuBar mb = new MenuBar();
    this.setMenuBar(mb);

    Menu fm = new Menu("File");
    fm.add(databaseMenuItem);
    mb.add(fm);

    Menu hm = new Menu("Help");
    hm.add(instructionsMenuItem);
    hm.addSeparator();
    hm.add(aboutMenuItem);
    mb.setHelpMenu(hm);

    databaseMenuItem.addActionListener(this);
    instructionsMenuItem.addActionListener(this);
    aboutMenuItem.addActionListener(this);

    Panel controlPanel = new Panel();
    controlPanel.setLayout(new BorderLayout());

    Panel radios = new Panel(new GridLayout(4, 1));
    radios.add(new Label("Advise:"));
    radios.add(adviseX);
    radios.add(adviseO);
    radios.add(adviseBoth);
    adviseX.addItemListener(this);
    adviseO.addItemListener(this);
    adviseBoth.addItemListener(this);
    Panel radiosWrap = new Panel(new BorderLayout());
    radiosWrap.add(new Panel(), BorderLayout.NORTH);
    radiosWrap.add(new Panel(), BorderLayout.CENTER);
    radiosWrap.add(radios, BorderLayout.SOUTH);

    Panel bp = new Panel(new BorderLayout());
    bp.add(clearLogButton, BorderLayout.NORTH);
    bp.add(new Panel(), BorderLayout.CENTER);
    bp.add(restartButton, BorderLayout.SOUTH);

    controlPanel.add(radiosWrap, BorderLayout.NORTH);
    controlPanel.add(logCB, BorderLayout.CENTER);
    controlPanel.add(bp, BorderLayout.SOUTH);

    Panel controlPanelWrap = new Panel(new BorderLayout());
    controlPanelWrap.add(controlPanel, BorderLayout.CENTER);
    controlPanelWrap.add(new Panel(), BorderLayout.EAST);

    Panel boardPanel = new Panel(new GridLayout(TTBoard.SIZE+1, TTBoard.SIZE+1))
    {
      public Dimension getPreferredSize() { return new Dimension(350, 350); }
    };

    boardPanel.add(new Label());
    for(int i=0; i<TTBoard.SIZE; i++)
    {
      Label l = new Label("" + (i+1));
      boardPanel.add(new Label("" + (char)('A' + i), Label.CENTER));
    }
    buttons = new Button[TTBoard.SIZE][TTBoard.SIZE];
    for(int i=0; i<TTBoard.SIZE; i++)
    {
      boardPanel.add(new Label("" + (i+1), Label.CENTER));
      for(int j=0; j<TTBoard.SIZE; j++)
      {
        Button b = new Button() { public boolean isFocusTraversable() { return false; } };
        int buttonId = i * TTBoard.SIZE + j;
        b.addActionListener(this);
        b.setActionCommand("" + buttonId);
        b.setBackground(Color.white);
        b.setFont(new Font(BOARD_FONT, Font.BOLD, BOARD_FONT_SIZE));
        boardPanel.add(b);
        buttons[i][j] = b;
      }
    }
    Panel boardPanelWrap = new Panel(new BorderLayout());
    boardPanelWrap.add(boardPanel, BorderLayout.CENTER);
    boardPanelWrap.add(new Panel(), BorderLayout.SOUTH);
    boardPanelWrap.add(new Panel(), BorderLayout.WEST);
    boardPanelWrap.add(new Panel(), BorderLayout.NORTH);
    boardPanelWrap.add(new Panel(), BorderLayout.EAST);

    Panel statusPanel = new Panel();
    statusPanel.setLayout(new BorderLayout());
    status = new TextArea(8, 60);
    status.setEditable(false);
    status.setBackground(Color.white);
    statusPanel.add(status, BorderLayout.CENTER);
    statusPanelWrap = new Panel(new BorderLayout());
    statusPanelWrap.add(statusPanel, BorderLayout.CENTER);
    statusPanelWrap.add(new Panel(), BorderLayout.NORTH);
    statusPanelWrap.add(new Panel(), BorderLayout.SOUTH);
    statusPanelWrap.add(new Panel(), BorderLayout.WEST);
    statusPanelWrap.add(new Panel(), BorderLayout.EAST);

    Panel infoPanel = new Panel(new FlowLayout(FlowLayout.CENTER));
    infoPanel.add(new Label("TeekoTeacher"));

    //add(infoPanel, BorderLayout.NORTH);
    add(controlPanelWrap, BorderLayout.EAST);
    add(boardPanelWrap, BorderLayout.CENTER);
    add(statusPanelWrap, BorderLayout.SOUTH);
    refreshLogging();

    // closing of the frame
    this.addWindowListener(new WindowAdapter()
     {
       public void windowClosing(WindowEvent we)
       {
         TTFrame.this.dispose();
       }
     });

    // add listeners
    restartButton.addActionListener(this);
    clearLogButton.addActionListener(this);
    playsFirstCB.addItemListener(this);
    logCB.addItemListener(this);

    pack();

    int w = Toolkit.getDefaultToolkit().getScreenSize().width;
    int h = Toolkit.getDefaultToolkit().getScreenSize().height;
    int x = (w - (int)getPreferredSize().width) / 2;
    int y = (h - (int)getPreferredSize().height) / 2;
    setBounds(x, y, (int)getPreferredSize().width, (int)getPreferredSize().height );

    show();

    if(TTDatabase.boards.size() == 0)
      new MessageBox("No Database!", "The database file (" +
                     TTStarter.DATABASE_FILE_NAME + ") not found or empty.", this, false, false);
  }

  /**
   * Deals with the buttons
   */
  public void actionPerformed(ActionEvent ae)
  {
    Object src = ae.getSource();
    String cmd = ae.getActionCommand();

    if(src == restartButton)
    {
      try { restart(); }
      catch(Throwable t) { new MessageBox("Exception!", t.toString(), this, false, false); }
    }
    else if(src == aboutMenuItem)
      about();
    else if(src == instructionsMenuItem)
      instructions();
    else if(src == databaseMenuItem)
      showDatabaseInfo();
    else if(src == clearLogButton)
      status.setText("");
    else // board fields
    {
      prevField = field;
      field = Integer.parseInt(cmd);
      if(engine.play(field, prevField)) // if the move was legal, the board was updated...
      {
        updateBoard(field);
        if(gameFinished())
        {
          engine.resetBoard();
          return;
        }
      }
    }
  }

  /**
   * Deals with the checkboxes
   */
  public void itemStateChanged(ItemEvent ie)
  {
    Object src = ie.getSource();
    if(src == logCB)
      refreshLogging();
    else if(src == adviseX || src == adviseO || src == adviseBoth)
    {
      boolean ax = adviseBoth.getState() || adviseX.getState();
      boolean ao = adviseBoth.getState() || adviseO.getState();
      engine.t.setAdvisingX(ax);
      engine.t.setAdvisingO(ao);
    }
  }

  /**
   * Restarts the game if one is in progress
   */
  protected void restart()
  {
    if(!engine.board.isEmpty())
    {
      if(!firstTime)
        log("Game has been restarted");
    }
    updateBoard(-1);
    firstTime = false;
  }

  /**
   * Updates the board GUI
   */
  private void updateBoard(int field)
  {
    if(field == -1) // restart
    {
      engine.resetBoard();
      for(int i=0; i<TTBoard.SIZE; i++)
        for(int j=0; j<TTBoard.SIZE; j++)
        {
          buttons[i][j].setLabel("");
          buttons[i][j].invalidate();
          engine.board = new TTBoard();
        }
      engine.updateGameState();
    }
    else // user played
    {
      for(int i=0; i<TTBoard.SIZE; i++)
      {
        for(int j=0; j<TTBoard.SIZE; j++)
        {
          String piece = engine.getPieceGUI(engine.board.board[i][j]);
          buttons[i][j].setForeground(piece.equals("X") ? Color.blue : Color.red);
          buttons[i][j].setLabel(piece);
          buttons[i][j].invalidate();
        }
      }
    }
    repaint();
  }

  /**
   * Check if the game is finished.
   * Might restart the game as a side effect.
   */
  private boolean gameFinished()
  {
    switch(engine.getGameState())
    {
      case TTEngine.COMPUTER_WON :
      {
        displayWin("COMP");
        return true;
      }
      case TTEngine.USER_WON :
      {
        displayWin("USER");
        return true;
      }
      case TTEngine.DRAW :
      {
        displayDraw();
        return true;
      }
    }
    return false;
  }

  /**
   * Displays won message
   */
  private void displayWin(String who)
  {
    String msg = who.equals("USER") ?
      "Player '" + engine.getPieceGUI(engine.getUserPiece())  + "'" :
      "Player '" + engine.getPieceGUI(engine.getComputerPiece()) + "'";
    msg += " won the game";
    log(msg);
    new MessageBox("The End", msg, this, true, false);
  }

  /**
   * Displays draw message
   */
  private void displayDraw()
  {
    String msg = "The game has been drawn.";
    log(msg);
    new MessageBox("The End", msg, this, true, false);
  }

  /**
   * Hide/display the logging area
   */
  private void refreshLogging()
  {
    statusPanelWrap.setVisible(logCB.getState());
    pack();
  }

  /**
   * Appends a string to the status
   */
  public void log(String s)
  {
    status.append(s + ".\n");
    status.setCaretPosition(status.getText().length());
  }

  /**
   * Display the about box
   */
  private void about()
  {
    new MessageBox("About TeekoTeacher", "TeekoTeacher, Version " +
                   TTStarter.VERSION +
                   " by Mihailo Despotovic 2003.", this, false, false);
  }

  /**
   * Display the instructions
   */
  private void instructions()
  {
    String s = "";
    BufferedReader br = null;
    try // try loading from the local fule system
    {
      br = new BufferedReader(new FileReader(TTStarter.INSTRUCTIONS_FILE_NAME));
    }
    catch(Exception e)
    {
      try // try loading from applet's JAR as a resource
      {
        InputStream in = TTStarter.class.getResourceAsStream("/" + TTStarter.INSTRUCTIONS_FILE_NAME);
        br = new BufferedReader(new InputStreamReader(in));
      }
      catch(Exception e1)
      {
        e1.printStackTrace();
        log(e1.toString());
        s = "Sorry, could not open the instructions file (" + TTStarter.INSTRUCTIONS_FILE_NAME + ")";
      }
    }
    if(br != null)
    {
      StringBuffer sb = new StringBuffer("");
      String line = null;
      try
      {
        while((line = br.readLine()) != null)
          sb.append(line + "\n");
        s = sb.toString();
        s = s.substring(0, s.length() -1); // chop off the trailing '\n'
      }
      catch(Exception e)
      {
        e.printStackTrace();
        s = "Sorry, could not read the instructions file (" + TTStarter.INSTRUCTIONS_FILE_NAME + ")";
      }
    }
    new MessageBox("TeekoTeacher Instructions", s, this, false, true);
  }

  /**
   * Displays some basic informations about the database used
   */
  private void showDatabaseInfo()
  {
    String s = "The database contains " + TTDatabase.total + " (" + TTDatabase.boards.size() +
               " unique) Teeko positions.";
    new MessageBox("TeekoTeacher Database", s, this, false, false);
  }
}