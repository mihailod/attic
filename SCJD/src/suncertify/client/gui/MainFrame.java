package suncertify.client.gui;

import java.util.*;
import java.io.*;
import java.awt.*;
import java.awt.event.*;
import javax.swing.*;
import javax.swing.table.*;
import java.rmi.*;
import java.net.*;

import suncertify.db.*;
import suncertify.client.gui.util.*;
import suncertify.client.gui.data.*;
import suncertify.server.*;

/**
 * Fly by Night client application.
 * This class creates GUI and gives user the control over the application.
 * 
 * @author Mihailo Despotovic
 * @version 4.2
 */
public class MainFrame extends JFrame
	implements ActionListener
{	
	// client id (for locking logic)
	private static String CLIENT_ID = null;
	
	// final vars
	private static final String APP_TITLE = "Fly by Night Client Application";
	private static final String RMI_PROTOCOL_NAME = "rmi://";
	private static final int APP_WIDTH = 700;
	private static final int APP_HEIGHT = 500;
	private static final String HELP =
		"Quick hints for using the application\n" + 
		"\n" +
		"1. Connect to the database using File/Connect menu item\n" +
		"2. Use Origin/Destination boxes and Search button to find" + 
				" desired flight(s)\n" +
		"3. Select the desired flight\n" +
		"4. Enter the number of seats\n" +
		"5. Use Book button to book the seats\n" +
		"6. Use File/Disconnect menu item to disconnect from the database";
	
	// debug switch
	private static boolean DEBUG = false;
	
	// look and feel dynamic vector - always read what is available
	private static Vector lookAndFeels = new Vector();
	private static Vector lafMenuItems = new Vector();
	
	// active gui components
	private static JComboBox seatsComboBox = null;
	private static JComboBox fromComboBox = null;
	private static JComboBox toComboBox = null;
	private static ColoredLabel statusLabel = null;
	private static JButton bookButton = null;
	private static JButton searchButton = null;
	private static JRadioButtonMenuItem localMenuItem = null;
	private static JRadioButtonMenuItem remoteMenuItem = null;
	private static JMenuItem disconnectMenuItem = null;
	private static JTable flightsTable = null;
	private static JPanel flightsPanel = null;
	private static JScrollPane flightsScrollPane = null;
	private static ColoredLabel flightsLabel = null;
	
	// remote database vars
	private static String remoteDatabaseUrl = null;
	private static String remoteDatabaseName = null;
	
	// db proxy
	private static DatabaseProxy dbProxy = null;
	
	// remote dialog vars
	private static RemoteDialog remoteDialog = null;
	
	/**
	 * Sets remote dialog for connection to remote RMI server/database.
	 * @param RemoteDialog rd
	 */
	public void setRemoteDialog(RemoteDialog rd) { remoteDialog = rd; }
	
	/**
	 * The constuctor of the <code>MainFrame</code>.
	 * Sets basic thing as action listener, size, position and inits GUI.
	 */
	public MainFrame()
	{
		super();
		if(DEBUG) System.out.println("MainFrame constructor");
		
		// determine client id
		try
		{
			CLIENT_ID =	"" + InetAddress.getLocalHost().hashCode()
				+ System.currentTimeMillis();
		}
		catch(java.net.UnknownHostException uhe)
		{
			CLIENT_ID = "" + System.currentTimeMillis();
		}
		
		// handle close button gracefully
		addWindowListener
		(new WindowAdapter()
			{
				public void windowClosing(WindowEvent we)
				{
					if(DEBUG) System.out.println("Window Exiting (code 0)");
					System.exit(0);
				}
			}
		 );
		
		// set some basic properties
		setResizable(false);
		setTitle(APP_TITLE);
		
		int xPosition =	(int)
			(this.getToolkit().getScreenSize().getWidth() - APP_WIDTH)/2;
		int yPosition =	(int)
			(this.getToolkit().getScreenSize().getHeight() - APP_HEIGHT)/2;
		
		setBounds(xPosition, yPosition, APP_WIDTH, APP_HEIGHT);	
		getContentPane().setLayout(new BorderLayout());
		
		// create dbProxy
		dbProxy = new DatabaseProxy();
		
		// create combo boxes now
		fromComboBox = new JComboBox();
		toComboBox = new JComboBox();
		
		initGui();
		refreshGui();

		setVisible(true);
	}
	
	/**
	 * Called once - when the app starts.
	 */
	private void initGui()
	{
		if(DEBUG) System.out.println("initGui");
		
		populateLookAndFeels();
		initMenu();
		initSearchPanel();
		initStatusPanel();
		initFlightsPanel();
	}
	
	/**
	 * Called whenever GUI models change.
	 */
	private void refreshGui()
	{
		if(DEBUG) System.out.println("refreshGui");
		
		if(dbProxy.getIsConnected())
		{
			seatsComboBox.setSelectedIndex(0);
			disconnectMenuItem.setEnabled(true);
			
			fromComboBox.setEnabled(true);;
			toComboBox.setEnabled(true);
			searchButton.setEnabled(true);
			bookButton.setEnabled(true);
			seatsComboBox.setEnabled(true);
			flightsScrollPane.setVisible(true);
			
			if(flightsTable.getModel().getRowCount() > 0)
			{
				flightsLabel.setText("List of available flights - " +
						"click on the desired flight, enter the " +
						"number of seats and click on Book");
			}
			else
			{
				flightsLabel.setText("No records found. Try changing your " +
									 "search criteria");
			}
			flightsLabel.setForeground(Color.black);
		}
		else
		{
			seatsComboBox.setSelectedIndex(0);
			disconnectMenuItem.setEnabled(false);
			
			fromComboBox.setEnabled(false);
			toComboBox.setEnabled(false);
			seatsComboBox.setEnabled(false);
			statusLabel.setText("Not connected to Database - please, use " +
					"File - Connect menu option");
			statusLabel.setForeground(Color.red);
			searchButton.setEnabled(false);
			bookButton.setEnabled(false);
			flightsScrollPane.setVisible(false);
			
			flightsLabel.setText("Unable to display any flights. " +
								 "Please connect to the database");
			flightsLabel.setForeground(Color.red);
		}
		
		repaint();
	}
	
	/**
	 * Inits searchPanel (comboBoxes, GUI for booking)
	 */
	private void initSearchPanel()
	{
		if(DEBUG) System.out.println("initSearchPanel");
		
		JPanel searchPanelCenter = new JPanel();
		searchPanelCenter.setLayout(new GridLayout(3, 1));
		
		JPanel p1 = new JPanel();
		p1.setLayout(new FlowLayout(FlowLayout.LEFT));
		p1.add(new ColoredLabel("Search Available Flights", Color.black));
		
		JPanel p2 = new JPanel();
		p2.setLayout(new FlowLayout(FlowLayout.LEFT));
		p2.add(new ColoredLabel("Origin Airport", Color.darkGray));
		populateFromTo();
		p2.add(fromComboBox);
		p2.add(new ColoredLabel("Destination Airport", Color.darkGray));
		p2.add(toComboBox);
		searchButton = new JButton("Search");
		searchButton.addActionListener(this);
		searchButton.setToolTipText("Search Flights");
		p2.add(searchButton);		
		
		JPanel p4 = new JPanel();
		p4.setLayout(new FlowLayout(FlowLayout.LEFT));
		p4.add(new ColoredLabel("Number of seats to book", Color.darkGray));
		seatsComboBox = new JComboBox();
		p4.add(seatsComboBox);
		seatsComboBox.addItem("1");
		seatsComboBox.addItem("2");
		seatsComboBox.addItem("3");
		seatsComboBox.addItem("4");
		seatsComboBox.setEditable(true);
		bookButton = new JButton("Book");
		bookButton.addActionListener(this);
		bookButton.setToolTipText("Book Seat(s)");
		p4.add(bookButton);
		
		searchPanelCenter.add(p1);
		searchPanelCenter.add(p2);
		searchPanelCenter.add(p4);
		
		JPanel searchPanelSouth = new JPanel();
		searchPanelSouth.setLayout(new FlowLayout(FlowLayout.LEFT));
		flightsLabel = new ColoredLabel("Please connect to the database",
										Color.red);
		
		searchPanelSouth.add(flightsLabel);
		
		JPanel searchPanel = new JPanel();
		searchPanel.setLayout(new BorderLayout());
		searchPanel.add(searchPanelSouth, BorderLayout.SOUTH);
		searchPanel.add(searchPanelCenter, BorderLayout.CENTER);
		
		getContentPane().add(searchPanel, BorderLayout.NORTH);
	}
	
	/**
	 * Inits status panel (holds messages towards user)
	 */
	private void initStatusPanel()
	{
		if(DEBUG) System.out.println("initStatusPanel");
		
		JPanel statusPanel = new JPanel();
		statusPanel.setLayout(new FlowLayout(FlowLayout.LEFT));
		
		statusLabel = new ColoredLabel("");
		
		statusPanel.add(statusLabel);
		getContentPane().add(statusPanel, BorderLayout.SOUTH);
	}
	
	/**
	 * Inits flights panel (<code>JTable</code> stuff)
	 */
	private void initFlightsPanel()
	{
		if(DEBUG) System.out.println("initFlightsPanel");
		
		populateFlights();
		flightsTable.getSelectionModel().setSelectionMode
			(ListSelectionModel.SINGLE_SELECTION);
		flightsTable.setAutoscrolls(true);
		flightsTable.setAutoResizeMode(flightsTable.AUTO_RESIZE_OFF);
		flightsScrollPane = new JScrollPane(flightsTable);
		getContentPane().add(flightsScrollPane, BorderLayout.CENTER);
	}
	
	/**
	 * Inits the menu. There are options to connect/disconnect to
	 * both local and remote db.
	 */
	private void initMenu()
	{
		if(DEBUG) System.out.println("initMenu");
		
		JMenuBar bar = new JMenuBar();
		
		JMenu fileMenu = new JMenu("File");
		fileMenu.setMnemonic((char)KeyEvent.VK_F);
		JMenu connectMenu = new JMenu("Connect");
		localMenuItem = new JRadioButtonMenuItem("Local Database");
		localMenuItem.setActionCommand("local");
		localMenuItem.setAccelerator
			(KeyStroke.getKeyStroke(KeyEvent.VK_L, InputEvent.CTRL_MASK));
		localMenuItem.addActionListener(this);
		remoteMenuItem = new JRadioButtonMenuItem("Remote Database");
		remoteMenuItem.setActionCommand("remote");
		remoteMenuItem.setAccelerator
			(KeyStroke.getKeyStroke(KeyEvent.VK_R, InputEvent.CTRL_MASK));
		remoteMenuItem.addActionListener(this);
		connectMenu.add(localMenuItem);
		connectMenu.add(remoteMenuItem);
		fileMenu.add(connectMenu);
		disconnectMenuItem = new JMenuItem("Disconnect");
		disconnectMenuItem.setActionCommand("disconnect");
		disconnectMenuItem.setAccelerator
			(KeyStroke.getKeyStroke(KeyEvent.VK_D, InputEvent.CTRL_MASK));
		disconnectMenuItem.addActionListener(this);
		fileMenu.add(disconnectMenuItem);
		fileMenu.addSeparator();
		JMenuItem exitMenuItem = new JMenuItem("Exit");
		exitMenuItem.setMnemonic((char)KeyEvent.VK_X);
		exitMenuItem.setActionCommand("Exit");
		exitMenuItem.addActionListener(this);
		fileMenu.add(exitMenuItem);
		
		JMenu styleMenu = new JMenu("Look&Feel");
		styleMenu.setMnemonic((char)KeyEvent.VK_L);
		LookAndFeel l = UIManager.getLookAndFeel();
		for(int i=0; i<lookAndFeels.size(); i++)
		{
			String name = ((UIManager.LookAndFeelInfo)
							lookAndFeels.elementAt(i)).getName();
			JRadioButtonMenuItem item = new JRadioButtonMenuItem(name);
			item.setActionCommand(name);
			item.setName(name);
			if(l.getName().equals(name)) item.setSelected(true);
			lafMenuItems.addElement(item);
			item.addActionListener(this);
			styleMenu.add(item);
		}
		
		JMenu helpMenu = new JMenu("Help");
		helpMenu.setMnemonic((char)KeyEvent.VK_H);
		JMenuItem helpMenuItem = new JMenuItem("Quick Hints");
		helpMenuItem.setActionCommand("help");
		helpMenuItem.setAccelerator
			(KeyStroke.getKeyStroke(KeyEvent.VK_H, InputEvent.CTRL_MASK));
		helpMenuItem.addActionListener(this);
		helpMenu.add(helpMenuItem);
		helpMenu.addSeparator();
		JMenuItem aboutMenuItem = new JMenuItem("About");
		aboutMenuItem.setAccelerator
			(KeyStroke.getKeyStroke(KeyEvent.VK_A, InputEvent.CTRL_MASK));
		aboutMenuItem.setActionCommand("About");
		aboutMenuItem.addActionListener(this);
		helpMenu.add(aboutMenuItem);
		
		bar.add(fileMenu);
		bar.add(styleMenu);
		bar.add(helpMenu);
		setJMenuBar(bar);
	}
	
	/**
	 * High level method - just calls <code>populateFromTo</code>
	 * and <code>populateFlights</code>
	 */
	private void populateGui()
	{
		if(DEBUG) System.out.println("populateGui");
		
		populateFromTo();
		populateFlights();
	}
	
	/**
	 * Populates from and to HashSets so the comboboxes can use that info.
	 */
	private void populateFromTo()
	{	
		if(DEBUG) System.out.println("populateFromTo");
		
		HashSet from = new HashSet();
		HashSet to = new HashSet();
		
		if(dbProxy.getIsConnected())
		{
			String fromString = null;
			String toString = null;
			
			DataInfo[] dataInfo = null;
			try
			{
				dataInfo = dbProxy.criteriaFind("Day='*'");
			}
			catch(DatabaseException dbe)
			{
				dbe.printStackTrace();
			}
			catch(RemoteException re)
			{
				re.printStackTrace();
			}
			
			for(int i = 0; i < dataInfo.length; i++)
			{
				fromString = dataInfo[i].getValues()[1];
				toString = dataInfo[i].getValues()[2];
					
				// this will implicitelly get rid of duplicates (HashSet)
				from.add(fromString);
				to.add(toString);
			}
		}
		
		DefaultComboBoxModel modelFrom =  
			(DefaultComboBoxModel)fromComboBox.getModel();
		if(modelFrom.getSize() > 0)	modelFrom.removeAllElements();
				
		DefaultComboBoxModel modelTo =
			(DefaultComboBoxModel)toComboBox.getModel();
		if(modelTo.getSize() > 0) modelTo.removeAllElements(); 
		
		// add here all airports so they are going to be the first ones
		modelFrom.addElement("All Airports");
		modelTo.addElement("All Airports");
		
		// now, add the rest
		Iterator i = from.iterator();
		while(i.hasNext())
		{
			modelFrom.addElement(i.next()); 
		}
		
		i = to.iterator();
		while(i.hasNext())
		{
			modelTo.addElement(i.next()); 
		}
	}
	
	/**
	 * Populates flights table
	 */
	private void populateFlights()
	{	
		if(DEBUG) System.out.println("populateFlights");
		
		if(!dbProxy.getIsConnected())
		{
			flightsTable = new JTable();
		}
		else
		{
			try
			{
				TableModel ftModel = new FlightsTableModel(dbProxy,
													   makeCriteria());
			flightsTable.setModel(ftModel);
			}
			catch(RemoteException re)
			{
				re.printStackTrace();
			}
		}
	}
	
	/**
	 * Makes criteria for <code>criteriaFind</code> method so the JTable
	 * is populated with result set rather than with whole db.
	 */
	private String makeCriteria()
	{
		if(DEBUG) System.out.println("makeCriteria");
		
		String from = null;
		String to = null;
		String criteria = null;
		
		from = ((String)fromComboBox.getSelectedItem()).equals("All Airports") ?
			   "*" : (String)fromComboBox.getSelectedItem();
		
		to = ((String)toComboBox.getSelectedItem()).equals("All Airports") ?
			   "*" : (String)toComboBox.getSelectedItem();
		
		criteria = "OriginAirport='" + from + "'," +
				   "DestinationAirport='" + to + "'";

		if(DEBUG) System.out.println("Criteria: " + criteria);
		
		return criteria;
	}
	
	/**
	 * Dynamically populates all look and feels so the menu can
	 * display choices
	 */
	private void populateLookAndFeels()
	{
		UIManager.LookAndFeelInfo laf[] = UIManager.getInstalledLookAndFeels();
		for(int i=0; i<laf.length; i++)
			lookAndFeels.addElement(laf[i]);
	}

	/**
	 * Action listener for this frame itself.
	 */
	public void actionPerformed(ActionEvent ae)
	{	
		String command = ae.getActionCommand();
		
		if(DEBUG) System.out.println("--> actionPerformed: " + command);
		
		if(command.equals("Exit"))
		{
			if(dbProxy.getIsConnected()) dbProxy.disconnect();
			if(DEBUG) System.out.println("Exiting (code 0)");
			System.exit(0);
		}	
		else if(command.equals("About"))
		{
			JOptionPane.showMessageDialog(this,
					"Fly by Night Client Application\n" +
					"(C)2000 Mihailo Despotovic\n" +
					"Sun Java 2 Developer Assignment\n",
					"About Client Application",
					JOptionPane.INFORMATION_MESSAGE);
		}
		else if(command.equals("help"))
		{
			JOptionPane.showMessageDialog(this, HELP, "User Help",
				JOptionPane.INFORMATION_MESSAGE);
										  
		}
		else if(command.equals("Book"))
		{
			setCursor(new Cursor(Cursor.WAIT_CURSOR));
			int selectedRow = flightsTable.getSelectedRow();
			int seats = 0;
			try
			{
				seats = Integer.parseInt(seatsComboBox.getSelectedItem().toString().trim());
				if(seats < 1) throw new NumberFormatException();

				if(DEBUG) System.out.println("Selected row: " + selectedRow);
				if(selectedRow < 0)
				{
					setCursor(new Cursor(Cursor.DEFAULT_CURSOR));
					JOptionPane.showMessageDialog(this,
					"Please select a flight by clicking on it",
					"No flight selected",
					JOptionPane.WARNING_MESSAGE);
				}
				else
				{
					String flightNumber = (String)flightsTable.getModel().
										getValueAt(selectedRow, 0);
					
					DataInfo dataInfo = dbProxy.criteriaFind
						("FlightNumber='" + flightNumber + "'")[0];
					
					int availableSeats =
						Integer.parseInt
							(dataInfo.getValues()
								[FlightsTableModel.SEATS_COLUMN].trim());
					
					if(availableSeats < seats)
					{
						setCursor(new Cursor(Cursor.DEFAULT_CURSOR));
						JOptionPane.showMessageDialog(this,
							"Not enough available seats",
							"No seats", JOptionPane.ERROR_MESSAGE);
					}
					else
					{
						int recordNumber = dataInfo.getRecordNumber();

						int numberOfColumns = dbProxy.getFieldInfo().length;
						
						String[] values = new String
											 [numberOfColumns];
						
						for(int i = 0; i < numberOfColumns - 1; i++)
							values[i] = (String)flightsTable.getModel().
										getValueAt(selectedRow, i);
						
						// 1. lock
						dbProxy.lock(selectedRow, CLIENT_ID);
						
						// 2. refresh
						populateFlights();
						
						// 3. update
						// the last column is number of seats
						values[numberOfColumns - 1] = "" +
							(Integer.parseInt(((String)flightsTable.getModel().
								getValueAt(selectedRow, numberOfColumns - 1))
									.trim()) - seats);
						
						DataInfo newData = new DataInfo(recordNumber,
								dbProxy.getFieldInfo(), values);
						dbProxy.modify(newData);
						
						// 4. unlock
						dbProxy.unlock(selectedRow, CLIENT_ID);
						
						// refresh table model after update
						populateFlights();
						
						// inform user
						String temp = "";
						if(seats > 1) temp = "s"; 
						
						setCursor(new Cursor(Cursor.DEFAULT_CURSOR));
						JOptionPane.showMessageDialog(this,
						seats + " seat" + temp + " booked successfully",
						"OK", JOptionPane.INFORMATION_MESSAGE);
					}
				}
			}
			catch(NumberFormatException nfe)
			{
				setCursor(new Cursor(Cursor.DEFAULT_CURSOR));
				JOptionPane.showMessageDialog(this,
					"Please enter correct number of seats",
					"Invalid number of seats",
					JOptionPane.ERROR_MESSAGE);
			}
			catch(DatabaseException dbe)
			{
				setCursor(new Cursor(Cursor.DEFAULT_CURSOR));
				JOptionPane.showMessageDialog(this,
					dbe.toString(), "DatabaseException",
					JOptionPane.ERROR_MESSAGE);
			}
			catch(RemoteException re)
			{
				setCursor(new Cursor(Cursor.DEFAULT_CURSOR));
				JOptionPane.showMessageDialog(this,
					re.toString(), "RemoteException",
					JOptionPane.ERROR_MESSAGE);			
			}
			catch(IOException iox)
			{
				setCursor(new Cursor(Cursor.DEFAULT_CURSOR));
				JOptionPane.showMessageDialog(this,
					"IOException", iox.toString(),
					JOptionPane.ERROR_MESSAGE);	
			}
			finally
			{
				// reselect the row on table gui
				flightsTable.setRowSelectionInterval
					(selectedRow, selectedRow);
			}
		}
		else if(command.equals("Search"))
		{
			setCursor(new Cursor(Cursor.WAIT_CURSOR));
			populateFlights();
			setCursor(new Cursor(Cursor.DEFAULT_CURSOR));
		}
		else if(command.equals("local"))
		{
			setCursor(new Cursor(Cursor.WAIT_CURSOR));
			dbProxy.disconnect();
			
			JFileChooser fileChooser =
				new JFileChooser("Find your database file");
			fileChooser.showOpenDialog(this);
			
			String fileName = fileChooser.getSelectedFile() == null ?
							  null : fileChooser.getSelectedFile().toString();
			
			if(fileName != null)
			{
				File file = new File(fileName);
				if(!file.exists())
				{
					dbProxy.disconnect();
					setCursor(new Cursor(Cursor.DEFAULT_CURSOR));
					JOptionPane.showMessageDialog(this,
						fileName,  "File doesn't exist", JOptionPane.OK_OPTION);
					localMenuItem.setSelected(false);
				}
				else
				{
					boolean exception = false;
					String eString = null;
					try
					{
						dbProxy.connect(fileName);
						populateGui();
						statusLabel.setText("Connected to Local Database " +
											("(File: " + fileName + ")"));
						statusLabel.setForeground(Color.black);
						localMenuItem.setSelected(true);
						remoteMenuItem.setSelected(false);
					}
					catch(IOException e)
					{
						setCursor(new Cursor(Cursor.DEFAULT_CURSOR));
						JOptionPane.showMessageDialog(this,
							e.toString(), "Can't open database",
							JOptionPane.OK_OPTION);
						localMenuItem.setSelected(false);
						remoteMenuItem.setSelected(false);
					}
				}
			}
			else
			{
				// user canceled file dialog
				localMenuItem.setSelected(false);
			}
		}
		else if(command.equals("remote"))
		{	
			dbProxy.disconnect();
			
			// create remote dialog here
			RemoteDialog rd = new RemoteDialog(this, this);
			
			if(remoteDatabaseUrl != null)
			{
				try
				{
					setCursor(new Cursor(Cursor.WAIT_CURSOR));
					dbProxy.connect(remoteDatabaseUrl, remoteDatabaseName);
					populateGui();
					statusLabel.setText("Connected to Remote Database at " + 
										remoteDatabaseUrl);
					statusLabel.setForeground(Color.black);
					localMenuItem.setSelected(false);
					remoteMenuItem.setSelected(true);
					setCursor(new Cursor(Cursor.DEFAULT_CURSOR));
				}
				catch(RemoteException re)
				{
					setCursor(new Cursor(Cursor.DEFAULT_CURSOR));
					remoteMenuItem.setSelected(false);
					JOptionPane.showMessageDialog(this,
						re.toString(), "Can't access remote Database",
						JOptionPane.OK_OPTION);
				}
				catch(IOException ioe)
				{
					setCursor(new Cursor(Cursor.DEFAULT_CURSOR));
					remoteMenuItem.setSelected(false);
					JOptionPane.showMessageDialog(this,
						ioe.toString(), "Can't access remote Database",
						JOptionPane.OK_OPTION);
				}
				catch(NotBoundException nbe)
				{
					setCursor(new Cursor(Cursor.DEFAULT_CURSOR));
					remoteMenuItem.setSelected(false);
					JOptionPane.showMessageDialog(this,
						nbe.toString(), "Can't access remote Database",
						JOptionPane.OK_OPTION);
				}
			}
		}
		else if(command.equals("disconnect"))
		{
			setCursor(new Cursor(Cursor.WAIT_CURSOR));
			dbProxy.disconnect();
			localMenuItem.setSelected(false);
			remoteMenuItem.setSelected(false);
			setCursor(new Cursor(Cursor.DEFAULT_CURSOR));
		}
		else if(command.equals("Connect"))
		{	
			// parse port
			try
			{
				int port = Integer.parseInt
					(remoteDialog.getPort().trim());
				if(port < 0) throw new NumberFormatException();
				
				remoteDatabaseUrl = RMI_PROTOCOL_NAME +
									remoteDialog.getUrl() + ":" +
									remoteDialog.getPort() + "/" +
									remoteDialog.getServerName();
				
								
				remoteDatabaseName = remoteDialog.getDatabaseName();
				
				if(DEBUG) System.out.println("URL:" + remoteDatabaseUrl);
				remoteDialog.dispose();
				remoteDialog = null;
			}
			catch(NumberFormatException ne)
			{
				remoteMenuItem.setSelected(false);
				JOptionPane.showMessageDialog(this,
					"Please, reenter the port number", "Invalid port",
					JOptionPane.OK_OPTION);
			}
		}
		else if(command.equals("Cancel")) // this is from remoteDialog
		{
			remoteMenuItem.setSelected(false);
			remoteDatabaseUrl = null;
			remoteDialog.dispose();
			remoteDialog = null;
		}
		
		// look and feel loop
		for(int i=0; i<lookAndFeels.size(); i++)
		{
			if(((UIManager.LookAndFeelInfo)lookAndFeels.
				elementAt(i)).getName().equals(command))
			{	
				UIManager.LookAndFeelInfo l =
					(UIManager.LookAndFeelInfo)lookAndFeels.elementAt(i);
				
				try
				{
					UIManager.setLookAndFeel(l.getClassName());
					SwingUtilities.updateComponentTreeUI(this);
					
					for(int j=0; j<lafMenuItems.size(); j++)
					{
						JRadioButtonMenuItem item =
							(JRadioButtonMenuItem)lafMenuItems.elementAt(j);
						
						if(!item.getName().equals(l.getName()))
							item.setSelected(false);
					}
				}
				catch(Exception e)
				{
					e.printStackTrace();
				}
			}
		}
			
		// whatever action has been performed, always refresh GUI
		refreshGui();
	}
}