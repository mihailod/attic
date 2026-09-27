package ttt;

import java.awt.*;
import java.awt.event.*;

/**
 * Frame to encapsulate the GUI for the game
 */
public class tttFrame extends Frame implements ActionListener, ItemListener
{
  // GUI appearance
  private static final int FRAME_W = 520;
  private static final int FRAME_H = 560;
  private static final String BOARD_FONT = "monospaced";
  private static final int BOARD_FONT_SIZE = 60;

  // GUI variables
  private TextArea status = null;
  private Button restartButton = new Button("Restart Game");
  public Checkbox alphaBetaCB = new Checkbox("Alpha-Beta", true);
  private Checkbox playsFirstCB = new Checkbox("Computer Plays First");
  private Checkbox logCB = new Checkbox("Logging", true);
  private Panel statusPanelWrap = null;
  private Button buttons[][] = null;

  // internal variables
  public boolean minimax = false;
  public boolean alphaBeta = false;
  private tttEngine engine = null;

  /**
   * The constructor
   */
  public tttFrame()
  {
    super();
    engine = new tttEngine(this);
    initGUI();
    pack();
    show();
    log("Program started");
    restart();
  }

  /**
   * Inits the GUI
   */
  private void initGUI()
  {
    int w = Toolkit.getDefaultToolkit().getScreenSize().width;
    int h = Toolkit.getDefaultToolkit().getScreenSize().height;
    int x = (w - FRAME_W) / 2;
    int y = (h - FRAME_H) / 2;
    setBounds(x, y, FRAME_W, FRAME_H);
    setTitle("Tic-Tac-Toe by Mihailo Despotovic");

    setLayout(new BorderLayout());

    Panel controlPanel = new Panel();
    controlPanel.setLayout(new GridLayout(0, 1));
    controlPanel.add(new Panel());
    controlPanel.add(alphaBetaCB);
    controlPanel.add(new Panel());
    controlPanel.add(playsFirstCB);
    controlPanel.add(new Panel());
    controlPanel.add(new Panel());
    controlPanel.add(new Panel());
    controlPanel.add(logCB);
    controlPanel.add(new Panel());
    Panel temp = new Panel();
    temp.add(restartButton);
    controlPanel.add(temp);
    controlPanel.add(new Panel());
    Panel controlPanelWrap = new Panel(new BorderLayout());
    controlPanelWrap.add(new Panel(), BorderLayout.WEST);
    controlPanelWrap.add(controlPanel, BorderLayout.CENTER);
    controlPanelWrap.add(new Panel(), BorderLayout.EAST);

    Panel boardPanel = new Panel(new GridLayout(3, 3))
    {
      public Dimension getPreferredSize()
      {
        return new Dimension(350, 350);
      }
    };
    buttons = new Button[3][3];
    for(int i=0; i<3; i++)
    {
      for(int j=0; j<3; j++)
      {
        Button b = new Button();
        int buttonId = i * 3 + j;
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
    statusPanel.add(status, BorderLayout.CENTER);
    statusPanelWrap = new Panel(new BorderLayout());
    statusPanelWrap.add(statusPanel, BorderLayout.CENTER);
    statusPanelWrap.add(new Panel(), BorderLayout.NORTH);
    statusPanelWrap.add(new Panel(), BorderLayout.SOUTH);
    statusPanelWrap.add(new Panel(), BorderLayout.WEST);
    statusPanelWrap.add(new Panel(), BorderLayout.EAST);

    Panel infoPanel = new Panel(new FlowLayout(FlowLayout.CENTER));
    infoPanel.add(new Label("Tic-Tac-Toe V" + tttApplet.VERSION + ". Click on the board buttons to play..."));

    add(infoPanel, BorderLayout.NORTH);
    add(controlPanelWrap, BorderLayout.EAST);
    add(boardPanelWrap, BorderLayout.CENTER);
    add(statusPanelWrap, BorderLayout.SOUTH);
    refreshLogging();

    // closing of the frame
    this.addWindowListener(
     new WindowAdapter()
     {
       public void windowClosing(WindowEvent we)
       {
         tttFrame.this.dispose();
       }
     }
   );

   // add listeners
   restartButton.addActionListener(this);
   alphaBetaCB.addItemListener(this);
   playsFirstCB.addItemListener(this);
   logCB.addItemListener(this);
  }

  /**
   * Deals with the buttons
   */
  public void actionPerformed(ActionEvent ae)
  {
    Object src = ae.getSource();
    String cmd = ae.getActionCommand();

    if(src.equals(restartButton))
    {
      restart();
    }
    else // board fields
    {
      if(engine.play(Integer.parseInt(cmd)))
      {
        updateBoard();
        if(gameFinished()) return;
        log("Computer is playing move " + engine.moveCounter);
        engine.play(); // computer
        updateBoard();
        if(gameFinished()) return;
        if(engine.moveCounter < 10) log("Waiting for user to play move " + engine.moveCounter);
        if(engine.moveCounter > 9)
        {
          log("Board is full");
          restart();
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

    if(src.equals(playsFirstCB))
    {
      engine.computerFirst = playsFirstCB.getState();
      log("Computer plays first: " + (engine.computerFirst ? "yes" : "no"));
      if(engine.moveCounter == 1) restart();
    }
    else if(src.equals(alphaBetaCB))
    {
      alphaBeta = alphaBetaCB.getState();
      log("Alpha-Beta is now " + (alphaBeta ? "on" : "off"));
    }
    else if(src.equals(logCB))
    {
      refreshLogging();
    }
  }

  private void refreshLogging()
  {
    statusPanelWrap.setVisible(logCB.getState());
    pack();
  }

  /**
   * Restarts the game
   */
  protected void restart()
  {
    boolean backupFirst = engine.computerFirst;
    engine = new tttEngine(this);
    engine.computerFirst = backupFirst;
    updateBoard();

    if(engine.computerFirst)
    {
      log("Computer is playing move " + engine.moveCounter);
      engine.play();
      updateBoard();
      log("Waiting for user to play move " + engine.moveCounter);
    }
    else log("Waiting for user to play move " + engine.moveCounter);
  }

  /**
   * Updates the board
   */
  private void updateBoard()
  {
    for(int i=0; i<3; i++)
    {
      for(int j=0; j<3; j++)
      {
        String piece = engine.getPieceGUI(engine.board.board[i][j]);
        buttons[i][j].setForeground(piece.equals("X") ? Color.blue : Color.red);
        buttons[i][j].setLabel(piece);
        buttons[i][j].invalidate();
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
      case tttEngine.COMPUTER_WON :
      {
        displayWin("COMP");
        return true;
      }
      case tttEngine.USER_WON :
      {
        displayWin("USER");
        return true;
      }
      case tttEngine.DRAW :
      {
        displayDraw();
        return true;
      }
      case tttEngine.KEEP_PLAYING :
      {
        return false;
      }
      default :
      {
        // should never happen...
        log("What?");
        return false;
      }
    }
  }

  /**
   * Displays won message
   */
  private void displayWin(String who)
  {
    String msg = who.equals("USER") ? "You" : "Computer";
    msg += " won the game";
    log(msg);
    new MessageBox("The End", msg, this);
  }

  /**
   * Displaus draw message
   */
  private void displayDraw()
  {
    String msg = "No winner";
    log(msg);
    new MessageBox("The End", msg, this);
  }

  /**
   * Appends a string to the status
   * Works only if the logging is ON
   */
  public void log(String s)
  {
    if(logCB.getState())
    {
      status.append(s + ".\n");
      status.setCaretPosition(status.getText().length());
      //System.out.println(s);
    }
  }
}