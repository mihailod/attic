package suncertify.client.gui.data;

import javax.swing.table.*;
import java.rmi.*;

import suncertify.db.*;
import suncertify.server.*;

/**
 * Provides TableModel for flights table in GUI
 * 
 * @author Mihailo Despotovic
 * @version 1.1
 */
public class FlightsTableModel extends AbstractTableModel
{
	private static DatabaseProxy dbProxy = null;
	private static DataInfo[] resultSet = null;
	
	public static final int SEATS_COLUMN = 8;
	
	/**
	 * Create TableModel by connecting to the appropriate database
	 * and by applying criteria string to obtain result set.
	 * That result set is going to be displayed.
	 * Works with an instance of <code>DatabaseProxy</code> object.
	 * 
	 * @param DatabaseProxy dbp
	 * @param String criteria
	 */
	public FlightsTableModel(DatabaseProxy dbp, String criteria)
		throws RemoteException
	{
		super();
		dbProxy = dbp;
		
		try
		{
			resultSet = dbProxy.criteriaFind(criteria);
		}
		catch(DatabaseException dbe)
		{
			System.out.println("Can't criteriaFind database");
			dbe.printStackTrace();
		}
	}
	
	/**
	 * Returns the number of columns
	 * 
	 * @return int
	 */
	public int getColumnCount()
	{
		try
		{
			return dbProxy.getFieldInfo().length;
		}
		catch(RemoteException re)
		{
			re.printStackTrace();
			return -1;
		}
	}
	
	/**
	 * Returns the number of rows
	 * 
	 * @return int
	 */
	public int getRowCount()
	{	
		if(resultSet == null) return 0;
		else return resultSet.length;
	}
	
	/**
	 * Returns the name of column
	 * 
	 * @param int column
	 * 
	 * @return String
	 */
	public String getColumnName(int column)
	{
		try
		{
			return dbProxy.getFieldInfo()[column].getName();
		}
		catch(RemoteException re)
		{
			re.printStackTrace();
			return "ERROR_COLUMN_NAME";
		}
	}
	
	/**
	 * Returns value at row/column intersection
	 * 
	 * @param int row
	 * @param int column
	 * 
	 * @return Object
	 */
	public Object getValueAt(int row, int column)
	{
		if(resultSet == null)
			return "null resultSet"; // "impossible"
		else
			return resultSet[row].getValues()[column].trim();
	}
}
