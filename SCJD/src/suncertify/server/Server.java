package suncertify.server;

import java.net.*;
import java.io.*;
import java.rmi.*;
import java.rmi.registry.*;

/**
 * RMI Server.
 * 
 * @author Mihailo Despotovic
 * @version 1.2
 */
public class Server
{
	// debug
	private static final boolean DEBUG = false;
	
	private static final String DEFAULTS = "defaults";
	
	// default server parameters
	private static final String DEFAULT_SERVER_URL = "localhost";
	private static final String DEFAULT_SERVER_NAME = "fbnServer";
	private static final int DEFAULT_SERVER_PORT = 1099;
	private static final String DEFAULT_RMI_CODEBASE = "http://localhost/rmi/";
	
	// limit for port number
	private static final int MAX_PORT_NUMBER = 1024;

	/**
	 * Main method.
	 * Starts the server uding either default parameters or
	 * parameters supplied by command line.
	 * 
	 * @param String args[]
	 */
	public static void main(String args[])
	{
		System.out.println("Welcome to Fly by Night RMI Server");
		
		String temp = argumentsParsed(args);
		if(temp != null && !temp.equals(DEFAULTS))
		{
			System.out.print("ERROR: ");
			System.out.println(temp);
			usage();
			System.exit(0);
		}
		
		String serverName = null;
		String serverUrl = null;
		int serverPort = -1;
		String codebase = null;
		if(temp == null)
		{
			serverName = args[0];
			serverUrl = args[1];
			serverPort = Integer.parseInt(args[2]);
			codebase = args[3];
		}
		else
		{
			System.out.println("Using defaults:");
			printDefaults();
			serverName = DEFAULT_SERVER_NAME;
			serverUrl = DEFAULT_SERVER_URL;
			serverPort = DEFAULT_SERVER_PORT;
			codebase = DEFAULT_RMI_CODEBASE;
		}
		
		if(DEBUG)
			System.out.println
					  ("Creating registry for port " + serverPort + "...");
		else System.out.print(".");
		
		try
		{
			java.rmi.registry.LocateRegistry.createRegistry(serverPort);
		}
		catch(RemoteException rex)
		{
			System.out.println("Exception caught: " + rex.toString());
			rex.printStackTrace();
		}
		if(DEBUG) System.out.println("Registry created.");
		else System.out.print(".");
		
		if(DEBUG) System.out.println("Setting java.rmi.server.codebase...");
		else System.out.print(".");
		System.setProperty("java.rmi.server.codebase", codebase);
		if(DEBUG) System.out.println("java.rmi.server.codebase set.");		
		else System.out.print(".");
		
		if(DEBUG) System.out.println
			("Creating and installing security manager...");
		else System.out.print(".");
		
		if(System.getSecurityManager() == null)
		{
			System.setSecurityManager(new RMISecurityManager());
		}
		
		if(DEBUG) System.out.println
			("Security manager created and installed.");
		else System.out.print(".");
		
		try
		{
			if(DEBUG) System.out.println ("Creating server...");
			else System.out.print(".");
			
			RemoteDataRmiImplementation databaseServer =
						new RemoteDataRmiImplementation();
			
			if(DEBUG) System.out.println ("Server created.");
			else System.out.print(".");
			
			if(DEBUG) System.out.println
				("Binding RMI service to " + serverName + "...");
			else System.out.print(".");
			
			Naming.rebind(serverName, databaseServer);
			
			if(DEBUG) System.out.println
				("Binded RMI service to " + serverName + ".");
			else System.out.println(".");
			
			System.out.println("Server " + serverName + 
				" is ready and listening on port " + serverPort + ".");
		}
		catch(Exception ex)
		{
			System.out.println("Exception caught: " + ex.toString());
			ex.printStackTrace();
		}
	}
	
	/**
	 * Parses command line arguements.
	 * 
	 * @param String[] args
	 * 
	 * @return String
	 */
	private static String argumentsParsed(String[] args)
	{
		if(args.length == 0) return DEFAULTS;
		
		if(args.length != 4) return "Number of arguments is wrong";
		
		String serverName = args[0];
		String url = args[1];
		String port = args[2];
		String base = args[3];		
		
		// parse port
		int temp = -1;
		try
		{
			temp = Integer.parseInt(port);
			if(temp < 0) throw new NumberFormatException();
		}
		catch(NumberFormatException nfe)
		{
			return "Invalid port number: " + port;
		}
		if(temp <= MAX_PORT_NUMBER)
		{
			return "Please, use port number greater than " + MAX_PORT_NUMBER;
		}
		
		// parse codebase url
		try
		{
			URL u = new URL(base);
		}
		catch(MalformedURLException mx)
		{
			return "Invalid codebase URL: " + base;
		}
		
		return null;
	}
	
	/**
	 * Prints the usage.
	 */
	private static void usage()
	{
		System.out.println("usage: " + 
			"Server [<serverName> <DNS name> <port>" +
						   " <java.rmi.server.codebase>]");
		System.out.println("If invoked with no arguments, defaults are " +
						   "going to be used:");
		printDefaults();
	}
	
	/**
	 * Prints the defaults.
	 */
	private static void printDefaults()
	{
		System.out.println(" Server Name: " + DEFAULT_SERVER_NAME);
		System.out.println(" Server URL: " + DEFAULT_SERVER_URL);
		System.out.println(" Server Port: " + DEFAULT_SERVER_PORT);
		System.out.println(" RMI Codebase: " + DEFAULT_RMI_CODEBASE);
	}
}
