package suncertify.server;

import java.io.*;
import java.rmi.*;

import suncertify.db.*;

/**
 * Remote database interface.
 * This interface has all public methods of <code>Data</code> class.
 * 
 * @author Mihailo Despotovic
 * @version 1.1
 */
public interface RemoteDataRmiInterface
	extends Remote
{	
	/**
	 * Open database.
	 * This method actually opens database binary file
	 * 
	 * @param String databaseFileName - name of the binary database file
	 * 
	 * @exception RemoteException
	 * @exception IOException
	 */
	public void openDatabase(String databaseFileName)
		throws RemoteException, IOException;
	
	/**
	 * getFieldInfo stub
	 * 
	 * @return FieldInfo[]
	 */
	public FieldInfo[] getFieldInfo()
		throws RemoteException;

	/**
	 * getRecordCount stub
	 * 
	 * @return int
	 * 
	 * @exception RemoteException
	 */
    public int getRecordCount()
		throws RemoteException;
	
	/**
	 * getRecord stub
	 * 
	 * @param int recNum - the number of the record
	 * 
	 * @return DataInfo
	 * 
	 * @exception RemoteException
	 * @exception DatabaseException
	 */
    public DataInfo getRecord(int recNum)
		throws RemoteException, DatabaseException;
	
	/**
	 * find stub, version which accepts the column number
	 * 
	 * @param int whichField - where to find
	 * @param String toMatch - what to find
	 * 
	 * @return DataInfo
	 * 
	 * @exception RemoteException
	 * @exception IllegalArgumentException
	 * @exception DatabaseException
	 */
	public DataInfo find(int whichField, String toMatch)		throws RemoteException, IllegalArgumentException, DatabaseException;
	
	/**
	 * find stub, version which accepts the column name
	 * 
	 * @param String whichField - where
	 * @param String toMatch - what
	 * 
	 * @return DataInfo[]
	 * 
	 * @exception RemoteException
	 * @exception DatabaseException
	 * @exception IllegalArgumentException
	 */
    public DataInfo[] find(String whichField, String toMatch)		throws RemoteException, DatabaseException, IllegalArgumentException;
	
	/**
	 * criteriaFind stub
	 * 
	 * @param String criteria
	 * 
	 * @return DataInfo[]
	 * 
	 * @exception RemoteException
	 * @exception IllegalArgumentException
	 * @exception DatabaseException
	 */
	public DataInfo[] criteriaFind(String criteria)
		throws RemoteException, IllegalArgumentException, DatabaseException;
	
	/**
	 * add stub
	 * 
	 * @param String[] newData
	 * 
	 * @exception RemoteException
	 * @exception DatabaseException
	 * @exception IllegalArgumentException
	 */
    public void add(String[] newData)		throws RemoteException, DatabaseException, IllegalArgumentException;
	
	/**
	 * delete stub
	 * 
	 * @param DataInfo toDelete
	 * 
	 * @exception RemoteException
	 * @exception DatabaseException
	 */
    public void delete(DataInfo toDelete)		throws RemoteException, DatabaseException;
	
	/**
	 * close stub
	 * 
	 * @exception RemoteException
	 */
    public void close()
		throws RemoteException;
	
	/**
	 * modify stub
	 * 
	 * @param DataInfo newData
	 * 
	 * @exception RemoteException
	 * @exception DatabaseException
	 * @exception IllegalArgumentException
	 */
    public void modify(DataInfo newData)		throws RemoteException, DatabaseException, IllegalArgumentException;
	
	/**
	 * lock stub
	 * 
	 * @param int record
	 * @param String clientId
	 * 
	 * @exception RemoteException
	 * @exception DatabaseException
	 */
	public void lock(int record, String clientId)
		throws RemoteException, DatabaseException;
	
	/**
	 * unlock stub
	 * 
	 * @param int record
	 * @param String clientId
	 * 
	 * @exception RemoteException
	 * @exception DatabaseException
	 */
	public void unlock(int record, String clientId)
		throws RemoteException, DatabaseException;
}
