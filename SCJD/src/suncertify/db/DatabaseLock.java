package suncertify.db;

import java.util.*;

/**
 * Locking object with embedded locking engine.
 * Database has just one static instance of this class.
 * 
 * @author Mihailo Despotovic
 * 
 * @version 1.5
 */
public class DatabaseLock
{	// Integer row - String clientId combination
	private Hashtable lockedRecords = new Hashtable();		// placeholder for the id of the client who locked whole db
	private String locker = null;
	
	/**
	 * Tries to lock the whole database.
	 * If succedes, puts client id into <code>locker</code> variable.
	 * If someone else locked whole db, or there are locked records,
	 * waits.
	 * 
	 * @param String clientId
	 */
	public synchronized void lockDb(String clientId)
	{	
		try
		{
			while(locker != null && !locker.equals(clientId)
				  ||
				  thereAreForeignLocks(clientId))
			{
				try
				{
					wait();
				}
				catch(InterruptedException intex)
				{
					// ignore
				}
			}
		
			locker = clientId;
			notifyAll();
		}
		catch(Exception e)
		{
			e.printStackTrace();
			notifyAll();
		}
	}
	
	/**
	 * Unlocks whole database
	 * 
	 * @param String clientId
	 * 
	 * @exception DatabaseException - thrown when database is already locked
	 */
	public synchronized void unlockDb(String clientId)
		throws DatabaseException
	{	
		if(!locker.equals(clientId))
		{
			notifyAll();
			throw new DatabaseException("DB Already Locked!");
		}
		else
		{		
			locker = null;
			lockedRecords.clear(); // clear row level locks
			notifyAll();
		}
	}
	
	public synchronized void lockRow(String clientId, int row)
	{			
		try
		{
			Integer temp = new Integer(row);
			while(
				  (
				   locker != null &&
				   !locker.equals(clientId)) // db is locked by someone else
				  
				  ||
				  
				  (
				   lockedRecords.containsKey(temp) &&
				   !lockedRecords.get(temp).equals(clientId) // record locked
															 // by someone else
				   )
				  )
			{
				try
				{
					wait();
				}
				catch(InterruptedException intex)
				{
					// ignore
				}
			}
		
			// maybe I already locked whole db?
			if(clientId.equals(locker))
			{
				notifyAll();
				return;
			}
		
			// maybe I already locked this record?
			if(lockedRecords.get(temp) ==  null)
			{
				lockedRecords.put(temp, clientId);
			}
			notifyAll();
		}
		catch(Exception e)
		{
			e.printStackTrace();
			notifyAll();
		}
	}
	
	/**
	 * Unlocks one row in database
	 * 
	 * @param String clientId
	 * @param int row
	 * 
	 * @exception DatabaseException - thrown when DB is already locked
	 * by soemeone else
	 */
	public synchronized void unlockRow(String clientId, int row)
		throws DatabaseException
	{	
		// db locked by someone else?
		if(locker != null && !locker.equals(clientId))
		{
			notifyAll();
			throw new DatabaseException("DB Already Locked!");
		}
		
		// db locked by me?
		if(locker != null && locker.equals(clientId))
		{
			notifyAll();
			return;
		}
		
		// db is not locked, check row level...
		Integer temp = new Integer(row);
		if(clientId.equals(lockedRecords.get(temp)))
		{
			// remove lock
			lockedRecords.remove(temp);
			notifyAll();
		}
		else
		{
			// ignore attempt to remove non-existant lock
			// (see requirements documentation)
			notifyAll();
		}
	}
	
	/**
	 * Checks if there are any locked records by other clients.
	 * This method must not been synchronized since it is called
	 * by already synchronized method iniside the same object
	 * 
	 * @param String clientId
	 * 
	 * @return boolean
	 */
	private boolean thereAreForeignLocks(String clientId)
	{
		// but here, we need to synchronize regarding lockedRecords
		// because Iterator is not thread-safe
		synchronized(lockedRecords)
		{
			if(lockedRecords.size() == 0) return false; // no locked records
		
			Collection values = lockedRecords.values();
			Iterator i = values.iterator();
		
			while(i.hasNext())
			{
				if(!(((String)i.next()).equals(clientId)))
					return true;
			}
			
			return false;
		}
	}
}
