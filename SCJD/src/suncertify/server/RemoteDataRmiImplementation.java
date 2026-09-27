package suncertify.server;

import java.rmi.*;
import java.rmi.server.*;
import java.io.*;

import suncertify.db.*;

/**
 * Remote database implementation.
 * 
 * @author Mihailo Despotovic
 * @version 1.2
 */
public class RemoteDataRmiImplementation extends UnicastRemoteObject
	implements RemoteDataRmiInterface
{	
	/**
	 * Database access object
	 * 
	 * @serial Data database
	 */
	private Data database = null;
	
	/**
	 * The constructor just calls UnicastRemoteObject's constructor
	 * 
	 * @exception RemoteException
	 */
	public RemoteDataRmiImplementation()
		throws RemoteException
	{
		super();
	}
	
	/**
	 * openDatabase implementation.
	 * Opens database by using the <code>Data</code>'s constructor.
	 * Uses the binary file given as a parameter.
	 * 
	 * @param String databaseFileName
	 * 
	 * @exception RemoteException
	 * @exception IOException
	 */
	public synchronized void openDatabase(String databaseFileName)
		throws RemoteException, IOException
	{
		if(database == null)
		{
			database = new Data(databaseFileName);
		}
	}
	
	/**
	 * getFieldInfo implementation.
	 * 
	 * @return FieldInfo[]
	 */
	public synchronized FieldInfo[] getFieldInfo()
	{
		return database.getFieldInfo();
	}
	
	/**
	 * getRecordCount implementation.
	 * Returns the number of records in database.
	 * 
	 * @return int
	 */
	public synchronized int getRecordCount()
	{
		return database.getRecordCount();
	}
	
	/**
	 * getRecord implementation.
	 * 
	 * @param int recNum
	 * 
	 * @return DataInfo
	 * 
	 * @exception DatabaseException
	 */
    public synchronized DataInfo getRecord(int recNum)
		throws DatabaseException
	{
		return database.getRecord(recNum);
	}
	
	/**
	 * find implementation (version which takes column number)
	 * 
	 * @param int whichField
	 * @param String toMatch
	 * 
	 * @return DataInfo
	 * 
	 * @exception IllegalArgumentException
	 * @exception DatabaseException
	 */
	public synchronized DataInfo find(int whichField, String toMatch)		throws IllegalArgumentException, DatabaseException
	{
		return database.find(whichField, toMatch);
	}
	
	/**
	 * find implementation (version which takes column name)
	 * 
	 * @param String whichField
	 * @param String toMatch
	 * 
	 * @return DataInfo[]
	 * 
	 * @exception DatabaseException
	 * @exception IllegalArguementException
	 */
    public synchronized DataInfo[] find(String whichField, String toMatch)		throws DatabaseException, IllegalArgumentException
	{
		return database.find(whichField, toMatch);		
	}
	
	/**
	 * add implementation
	 * 
	 * @param String[] newData
	 * 
	 * @exception DatabaseException
	 * @exception IllegalArgumentException
	 */
    public synchronized void add(String[] newData)		throws DatabaseException, IllegalArgumentException
	{
		database.add(newData);
	}
	
	/**
	 * delete implementation
	 * 
	 * @param DataInfo toDelete
	 * 
	 * @exception DatabaseException
	 */
    public synchronized void delete(DataInfo toDelete)		throws DatabaseException
	{
		database.delete(toDelete);
	}
	
	/**
	 * close implementation
	 */
    public synchronized void close()
	{
		database.close();
	}
	
	/**
	 * modify implementation
	 * 
	 * @param DataInfo newData
	 */
	public synchronized void modify(DataInfo newData)
		throws DatabaseException
	{	
		database.modify(newData);
	}
	
	/**
	 * criteriaFind implementation
	 * 
	 * @param String criteria
	 * 
	 * @return DataInfo[]
	 * 
	 * @exception DatabaseException
	 */
	public synchronized DataInfo[] criteriaFind(String criteria)
		throws DatabaseException
	{
		return database.criteriaFind(criteria);
	}
	
	/**
	 * lock implementation
	 * 
	 * @param int record
	 * @param String clientId
	 * 
	 * @exception DatabaseException
	 */
	public synchronized void lock(int record, String clientId)
		throws DatabaseException
	{
		database.lock(record, clientId);
	}

	/**
	 * unlock implementation
	 * 
	 * @param int record
	 * @param String clientId
	 * 
	 * @exception DatabaseException
	 */
	public synchronized void unlock(int record, String clientId)
		throws DatabaseException
	{
		database.unlock(record, clientId);
	}
}
