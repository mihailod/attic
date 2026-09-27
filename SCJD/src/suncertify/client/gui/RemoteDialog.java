package suncertify.client.gui;

import javax.swing.*;
import java.awt.*;
import java.awt.event.*;

import suncertify.client.gui.util.*;

/**
 * Collects information about connecting to remote database from user
 * 
 * @author Mihailo Despotovic
 * @version 1.3
 */
public class RemoteDialog extends JDialog
{	
	// dialog properties
	private static final String DIALOG_TITLE = "Find remote server";
	private static final int WIDTH = 350;
	private static final int HEIGHT = 200;
	
	// default values for dialog's textfields
	private static final String DEFAULT_SERVER_URL = "localhost";
	private static final String DEFAULT_SERVER_PORT = "1099";
	private static final String DEFAULT_SERVER_NAME = "fbnServer";
	private static final String DEFAULT_DATABASE_NAME = "db";
	
	// dialog's textfields
	private static JTextField urlTextField = null;
	private static JTextField portTextField = null;
	private static JTextField serverNameField = null;
	private static JTextField databaseNameField = null;
	
	/**
	 * Returns url value entered by user
	 * 
	 * @return String
	 */
	public String getUrl() { return urlTextField.getText(); }
	
	/**
	 * Returns port value entered by user
	 * 
	 * @return String
	 */
	public String getPort() { return portTextField.getText(); }
	
	/**
	 * Returns server name entered by user
	 * 
	 * @return String
	 */
	public String getServerName() { return serverNameField.getText(); }
	
	/**
	 * Returns remote database name entered by user
	 * 
	 * @return String
	 */
	public String getDatabaseName() { return databaseNameField.getText(); }
	
	/**
	 * Constructs <code>RemoteDialog</code>
	 * Positions the dialog onto the screen, sets some basics properties
	 * and action listener and makes it visible to the user.
	 * This dialog is modal.
	 * 
	 * @param MainFrame mainFrame
	 * @param ActionListener al
	 */
	public RemoteDialog(MainFrame mainFrame, ActionListener al)
	{	
		super(mainFrame, DIALOG_TITLE, true);
		
		setSizeAndPosition(mainFrame);
		initGui(al);		
		
		// set remoteDialog of caller to this one
		mainFrame.setRemoteDialog(this);
		
		setVisible(true);
	}	

	/**
	 * Sets size and position of the dialog.
	 * This method will position dialog into the middle of the screen
	 * by using <code>getToolkit</code> metohods. It will also set bounds
	 * to <code>WIDTH</code> and <code>HEIGHT</code> private static variables.
	 * 
	 * @param MainFrame mainFrame
	 */
	private void setSizeAndPosition(MainFrame mainFrame)
	{
		int xPosition =	(int)
			(mainFrame.getToolkit().getScreenSize().getWidth() - WIDTH)/2;
		int yPosition =	(int)
			(mainFrame.getToolkit().getScreenSize().getHeight() - HEIGHT)/2;
		this.setBounds(xPosition, yPosition, WIDTH, HEIGHT);
	}
	
	/**
	 * Inits dialog's GUI and sets up the action listener.
	 * 
	 * @param ActionListener al
	 */
	private void initGui(ActionListener al)
	{
		getContentPane().setLayout(new BorderLayout());
		JPanel cont = new JPanel();
		cont.setLayout(new GridBagLayout());
		
		GridBagConstraints c = new GridBagConstraints();
		
		// input fields
		// remote database file name
		addComponent(cont, new ColoredLabel("Database Name: ", Color.black),
					 0, 0, c.EAST, c);
		databaseNameField = new JTextField(15);
		databaseNameField.setText(DEFAULT_DATABASE_NAME);
		addComponent(cont, databaseNameField, 1, 0, c.WEST, c);
	
		// RMI server name
		addComponent(cont, new ColoredLabel("Server Name: ", Color.black),
					 0, 1, c.EAST, c);
		serverNameField = new JTextField(15);
		serverNameField.setText(DEFAULT_SERVER_NAME);
		addComponent(cont, serverNameField, 1, 1, c.WEST, c);

		// RMI server url
		addComponent(cont, new ColoredLabel("Server URL: ", Color.black),
					 0, 2, c.EAST, c);
		urlTextField = new JTextField(15);
		urlTextField.setText(DEFAULT_SERVER_URL);
		addComponent(cont, urlTextField, 1, 2, c.WEST, c);
		
		// RMI server port
		addComponent(cont, new ColoredLabel("Server Port: ", Color.black),
					 0, 3, c.EAST, c);
		portTextField = new JTextField(5);
		portTextField.setText(DEFAULT_SERVER_PORT);
		addComponent(cont, portTextField, 1, 3, c.WEST, c);
		
		// buttons
		JButton okButton = new JButton("Connect");
		JButton cancelButton = new JButton("Cancel");
		okButton.addActionListener(al);
		cancelButton.addActionListener(al);
		
		JPanel fp = new JPanel();
		fp.setLayout(new FlowLayout(FlowLayout.CENTER));
		fp.add(okButton);
		fp.add(cancelButton);
		
		getContentPane().add(cont, BorderLayout.CENTER);
		getContentPane().add(fp, BorderLayout.SOUTH);
	}
	
	/**
	 * Method for adding component into GridBagLayput-ed container
	 * 
	 * @param Container cont
	 * @param Component comp
	 * @param int x
	 * @param int y
	 * @param int anchor
	 * @param GridBagConstraints c
	 */
	private void addComponent(Container cont, Component comp,
							  int x, int y, int anchor, GridBagConstraints c)
	{
		c.gridx = x;
		c.gridy = y;
		c.anchor = anchor;
		cont.add(comp, c);
	}
	
}
