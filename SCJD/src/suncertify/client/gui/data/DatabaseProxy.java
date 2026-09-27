package suncertify.client.gui.data;

import java.io.*;
import java.rmi.*;
import java.net.*;

import suncertify.server.*;
import suncertify.db.*;

/**
 * Encapsulates behavior of <code>Data</code> class by handling both
 * local and remote database. The client should just refer to the
 * instance of this class in order to do all database related operations.
 * 
 * Uses Proxy structural pattern.
 * 
 * @author Mihailo Despotovic
 * @version 3.1
 */
public class DatabaseProxy
{
	// connection, database position
	private boolean isConnected = false;
	private boolean isRemoteDatabase = false;
	
	// database info
	private String localDatabaseFileName = null;
	private Data database = null;
	private RemoteDataRmiInterface remoteDatabase = null;
	
	// debug info
	private static final boolean DEBUG = false;
	
	/**
	 * Returns the status of the connection. <code>true</code> means
	 * that connection has been established and <code>false</code> means
	 * that there is no connection yet.
	 * 
	 * @return boolean
	 */
	public boolean getIsConnected()
	{
		return isConnected;
	}
	
	/**
	 * Connect to the local database.
	 * 
	 * @param String localDatabaseFileName
	 * 
	 * @exception IOException
	 */
	public void connect(String localDatabaseFileName)
		throws IOException
	{
		database = new Data(localDatabaseFileName);
		isConnected = true;
		isRemoteDatabase = false;
	}
	
	/**
	 * Connect to the remote database.
	 * 
	 * @param String remoteDatabaseUrl
	 * @param remoteDatabaseName
	 * 
	 * @exception NotBoundException
	 * @exception MalformedURLException
	 * @exception RemoteException
	 * @exception IOException
	 */
	public void connect(String remoteDatabaseUrl,
						String remoteDatabaseName)
		throws NotBoundException, MalformedURLException,
			   RemoteException, IOException
	{	
		if(DEBUG) System.out.println("RMI Connecting to:" + remoteDatabaseUrl);
		remoteDatabase = (RemoteDataRmiInterface)Naming.lookup
			(remoteDatabaseUrl);
				
		remoteDatabase.openDatabase(remoteDatabaseName);
		isConnected = true;
		isRemoteDatabase = true;
	}
	
	/**
	 * Disconnects from the database.
	 * Automatically detects from where to disconnect.
	 */
	public void disconnect()
	{	
		if(isConnected)
		{
			if(!isRemoteDatabase)
			{
				if(database != null)
					database.close();
			}
			else
			{
				if(remoteDatabase != null)
					remoteDatabase = null;
			}
		}
		
		isConnected = false;
		remoteDatabase = null;
		isRemoteDatabase = false;
	}
	
	/**
	 * Proxy stub method for <code>criteriaFind</code> in <code>Data</code>
	 * 
	 * @param String criteria
	 * 
	 * @return DataInfo[]
	 * 
	 * @exception DatabaseException
	 * @exception RemoteException
	 */
	public DataInfo[] criteriaFind(String criteria)
		throws DatabaseException, RemoteException
	{
		if(!isRemoteDatabase)
			return database.criteriaFind(criteria);
		else
			return remoteDatabase.criteriaFind(criteria);						
	}

	/**
	 * Proxy stub method for <code>getFieldInfo</code> in <code>Data</code>
	 * 
	 * @return FieldInfo[]
	 * 
	 * @exception RemoteException
	 */
	public FieldInfo[] getFieldInfo()
		throws RemoteException
	{
		if(!isRemoteDatabase)
			return database.getFieldInfo();
		else
			return remoteDatabase.getFieldInfo();
	}
	
	/**
	 * Proxy stub method for <code>modify</code> in <code>Data</code>
	 * 
	 * @param DataInfo newData
	 * 
	 * @exception RemoteException
	 * @exception DatabaseException
	 * @exception IOException
	 */
	public void modify(DataInfo newData)
		throws RemoteException, DatabaseException, IOException
	{
		int record = newData.getRecordNumber();
		
		if(!isRemoteDatabase)
		{
			if(DEBUG) System.out.println("Local modifying...");
			database.modify(newData);
			if(DEBUG) System.out.println("Local modify OK");
		}
		else
		{
			if(DEBUG) System.out.println("Remote modifying...");
			remoteDatabase.modify(newData);
			if(DEBUG) System.out.println("Remote modify OK");
		}
	}
	
	/**
	 * Locks the record
	 * 
	 * @param int record
	 * @param String clientId
	 */
	public void lock(int record, String clientId)
		throws DatabaseException, RemoteException
	{
		if(!isRemoteDatabase)
		{
			database.lock(record, clientId);
		}
		else
		{
			remoteDatabase.lock(record, clientId);
		}
	}
	
	/**
	 * Unlocks the record
	 * 
	 * @param int record
	 * @param String clientId
	 */
	public void unlock(int record, String clientId)
		throws DatabaseException, RemoteException
	{
		if(!isRemoteDatabase)
		{
			database.unlock(record, clientId);
		}
		else
		{
			remoteDatabase.unlock(record, clientId);
		}
	}				 
}
