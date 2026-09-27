package suncertify.db;

import java.io.*;
import java.util.*;

/**
 * This class provides the basic database services. It uses four
 * other support classes: DataInfo, FieldInfo, Fields and DatabaseException
 *
 * @version 1.1  17-Nov-1997
 */
public class Data{
	// Static lock - ensures that all instances of data class inside server's
	// JVM share the same lock	private static DatabaseLock lock = new DatabaseLock();	
	// wild character for criteria find	private static final String WILD_CHARACTER = "*";	
    private static final byte LIVE_RECORD = 0;
    private static final byte DELETED_RECORD = 1;
    private static final int MAGIC = 0xC0C0BABE;

    private static final String UNEXPECTED =		"Data: Unexpected database access problem";

    private FieldInfo [] description;
    private int headerLen;
    private int recordLen = 1;
    private int recordCount;
    private RandomAccessFile db;
    //final static char sc = 'A'; ---> this is unused var...

    /**
    * This constructor opens an existing database given the name
    * of the disk file containing it.
    *
    * @param String dbname The name of the database file to open.    * 
    * @exception java.io.IOException
    */
    public Data(String dbname) throws IOException	{
        File f = new File(dbname);		
        if (f.exists() && f.canRead() && f.canWrite())		{
            db = new RandomAccessFile(f, "rw");
            headerLen = db.readInt();						if(headerLen > db.length() || headerLen < 0)
				throw new IOException("Data: corrupted database file.\n " +
					"Invalid header length.\n" +
					"(probably not fly by night file):\n" + dbname);			
            int nFields= db.readInt();
            recordCount = db.readInt();
            description = new FieldInfo[nFields];
            for (int i=0; i<nFields; i++)			{
                description[i] = new FieldInfo(db.readUTF(), db.readInt());
                recordLen += description[i].getLength();
            }
            if (db.readInt() != MAGIC)			{
                throw new IOException("Data: corrupted database file.\n" +
					"Magic not found in file " + dbname);
            }
            if (db.getFilePointer() != headerLen)			{
                throw new IOException("Data: corrupted database file.\n" +
					"Header length incorrect in file " + dbname);
            }
        }
		else		{
            throw new IOException("Data: request to open non-existant\n" +				"or inaccessible file: " + dbname);
        }
    }

    /**
    * This constructor creates a new database file, using the name
    * provided for the disk file and using the FieldInfo array to
    * describe the field names and sizes that should be created.
    *
    * @param String dbname The name of the database file to open.
    * @param FieldInfo[] fields The list of fields for the schema of
    *          this database.    * 
    * @exception IOException Thrown if cannot create database file.
    */
    public Data(String dbname, FieldInfo[] fields) throws IOException	{
        File f = new File(dbname);
        if (!f.exists())		{
            db = new RandomAccessFile(f, "rw");
            db.writeInt(0);  // filler for header length
            db.writeInt(fields.length);
            recordCount = 0;
            db.writeInt(recordCount);

            for (int i = 0; i < fields.length; i++)			{				db.writeUTF(fields[i].getName());				db.writeInt(fields[i].getLength());				recordLen += fields[i].getLength();
            }
            description = fields;
            db.writeInt(MAGIC);
            headerLen = (int)db.getFilePointer();
            db.seek(0);
            db.writeInt(headerLen);
        }
		else		{
            throw new IOException("Data: request to create code-existing " +
                                  "file" + dbname);
        }
    }

    /**
    * This method returns a description of the database schema, as an
    * array of FieldInfo objects.
    *
    * @return FieldInfo[] The array of FieldInfo objects that comprise
    *          the schema to this database.
    */
	public synchronized FieldInfo [] getFieldInfo() { return description; }

    /**
    * Gets the number of records stored in the database.
    */
    public synchronized int getRecordCount() { return recordCount; }

    /**
    * Gets a requested record from the database based on record number.
    * @param recNum The number of the record to read (first record is 1).
    * @return DataInfo for the record or null if the record has been marked for
    *    deletion.    * 
    * @exception DatabaseException Thrown if database file cannot be accessed.
    */
    public synchronized DataInfo getRecord(int recNum)		throws DatabaseException	{
        try		{
           if (recNum<1)		   {
              throw new DatabaseException("Record number must be greater than 1");
           }

            seek(recNum);
            
            String records[] = readRecord();
            if (records == null)			{
               return null;
            }

            return new DataInfo(recNum, description, records);
        }
		catch(IOException ex)		{
            throw new DatabaseException(UNEXPECTED);
        }
    }

	// codeserve old api	public synchronized DataInfo find(int whichField, String toMatch)		throws IllegalArgumentException, DatabaseException
	{
		if(whichField < 0 || whichField > Fields.getFieldNamesAsVector().size())
			throw new IllegalArgumentException("Field number " + whichField +
				" doesn't exist");
				String fieldName = (String)Fields.getFieldNamesAsVector().elementAt(whichField);		DataInfo dataInfo[] = find(fieldName, toMatch);
		if(dataInfo == null)
		{			return null;		}
		else
		{
			return dataInfo[0];
		}	}
	
    /**
    * This method searches the database for all entries with a field
    * which exactly matches the string supplied. If the required
    * record cannot be found, this method returns null. For this
    * assignment, the key field is the record number field.
    *    * @param whichField The name of the field where to seek for the match
    * @param toMatch The key field value to match upon for
    *           a successful find.
    * @return DataInfo The matching record.    * 
    * @exception DatabaseException
    *	Thrown when database file could not be accessed.    * @exception IllegalArgumentException    *	Thrown when field name doesn't exist
    */
    public synchronized DataInfo[] find(String whichField, String toMatch)		throws DatabaseException, IllegalArgumentException	{	
        invariant();
		
		if(!Fields.getFieldNamesAsVector().contains(whichField))			throw new IllegalArgumentException("Field name " + whichField +					" doesn't exist");
				Vector resultSetOfKeys = new Vector();
		DataInfo[] resultSet = null;		boolean found = false;
		
		if(toMatch.equals(WILD_CHARACTER))		{			found = true;
			for(int i=1; i<=this.recordCount; i++)
				resultSetOfKeys.addElement(new Integer(i));		}
		else		{
			int whichFieldInt = Fields.getFieldNamesAsVector().indexOf(whichField);		
			try			{
	            seek(1);

		        String [] values = null;

				for (int r = 1; r <= recordCount; r++)				{
	                values = readRecord();
	
		            if ((values != null) && (values[whichFieldInt].equals(toMatch)))					{
				        found = true;						resultSetOfKeys.addElement(new Integer(r));
					}
				}			}			catch (IOException e)			{
	            throw new DatabaseException(UNEXPECTED + e);
			}		}
				
		if (found)
		{
			//System.out.println("resultSetOfKeys: " + resultSetOfKeys);				
			resultSet = new DataInfo[resultSetOfKeys.size()];			for(int i = 0; i < resultSetOfKeys.size(); i++)			{
				resultSet[i] = getRecord					(((Integer)resultSetOfKeys.elementAt(i)).intValue());			}		}
				return resultSet;
	}
		/**
	 * This method searches the database for entries matching the criteria
	 * supplied. Criteria take a form of a comma separated list of
	 * <field name>=<'value to match'> specifications. This method searches
	 * for EXACT matches only. Example: "Carrier='SpeedyAir',Origin='SFO'"
	 * If the required  record cannot be found, this method returns null. 
	 * 
	 * @param criteria The list of specifications
	 * 
	 * @exception DatabaseException Thrown when database file could not be
	 *                              accessed.
	 * @exception InvalidArgumentException Thrown when the argument syntax is
	 *									   incorrect
	 */	public synchronized DataInfo[] criteriaFind(String criteria)
		throws IllegalArgumentException, DatabaseException	{		if(criteria.trim().length() == 0)
			throw new IllegalArgumentException
				("Tried to match empty criteria");		
		DataInfo[] resultSet = null;		DataInfo[] dataInfo = null;
				Vector fields = new Vector();		Vector values = new Vector();
		Vector finalResultSet = null;		
		String field = null;
		String value = null;		String nextToken = null;
		int position = -1;				StringTokenizer stringTokenizer = new StringTokenizer(criteria, ",");
				while(stringTokenizer.hasMoreTokens())		{			nextToken = stringTokenizer.nextToken();
			
			position = nextToken.indexOf("=");
			if(position < 0)
				throw new IllegalArgumentException
					("Specification must be in form 'field'='value'");
						// parse field
			field = nextToken.substring(0, position);
			if(field.trim().length() == 0)				throw new IllegalArgumentException("Empty field name");
			
			// validate field name
			if(!Fields.getFieldNamesAsVector().contains(field))
				throw new IllegalArgumentException("Invalid field name: " +
																	field);						// parse value
			value = nextToken.substring(position + 1, nextToken.length());
			
			if(!(value.startsWith("'") && value.endsWith("'")))			{
			   throw new IllegalArgumentException				("Value must be in the form 'value'");					}			else			{
				value = value.substring(1, value.length() - 1);			}
						if(value.trim().length() == 0)				throw new IllegalArgumentException("Empty field value");						fields.addElement(field);			values.addElement(value);		}
				// now, search for each criteria narrowing the result set		for(int i=0; i<fields.size(); i++)		{	
			resultSet = find((String)fields.elementAt(i),							 (String)values.elementAt(i));
			if(resultSet == null)
			{
				finalResultSet = new Vector();				break;
			}
			else
			{				if(finalResultSet == null)				{
					finalResultSet = new Vector();					for(int j=0; j<resultSet.length; j++)
						finalResultSet.addElement
							(new Integer(resultSet[j].getRecordNumber()));				}				else				{					Vector temp = new Vector();
					for(int j=0; j<resultSet.length; j++)
					{						if(finalResultSet.contains							(new Integer(resultSet[j].getRecordNumber())))
						{
							temp.addElement(new Integer(resultSet[j].getRecordNumber()));						}					}
					finalResultSet = temp;				}
			}		}				if(finalResultSet.size() == 0)
		{
			dataInfo = null;		}		else		{
			dataInfo = new DataInfo[finalResultSet.size()];			for(int i = 0; i < dataInfo.length; i++)
			{
				dataInfo[i] = getRecord					(((Integer)finalResultSet.elementAt(i)).intValue());
			}
		}		
		return dataInfo;	}

    /**
    * This method adds a new record to the database. The array of
    * strings must have exactly the same number of elements as the
    * field count of the database schema, otherwise a RuntimeException
    * is issued. The first field, the key, must be unique in the
    * database or a RuntimeException is thrown.
    *
    * @param newData The elements of the record to add.    * 
    * @exception DatabaseException Attempted to add a duplicate key or
    *        database file could not be accessed.    * @exception InvalidArgumentException Propagated from find method
    */
    public synchronized void add(String [] newData)		throws DatabaseException, IllegalArgumentException	{
        invariant();				String fieldName = (String)Fields.getFieldNamesAsVector().elementAt(0);		
        if (find(fieldName, newData[0]) != null)		{
            throw new DatabaseException("Attempt to add a duplicate key");
        }

        try		{
            seek(++recordCount);
            writeRecord(newData);
            db.seek(8);
            db.writeInt(recordCount);
        }
        catch (IOException e)		{
            throw new DatabaseException(UNEXPECTED + e);
        }
    }

    /**
    * This method updates the record specified by the record number
    * field in the DataInfo argument. The fields are all modified
    * to reflect the values in that argument. If the key field
    * specified in the argument matches any record other than the
    * one indicated by the record number of the argument, then a
    * RuntimeException is thrown.
    *
    * @param newData The updated record to modify.    * 
    * @exception DatabaseException Thrown if attempting to add a duplicate
    *       key.
    */
    public synchronized void modify(DataInfo newData)		throws DatabaseException, IllegalArgumentException	{
        invariant();				String fieldName = (String)Fields.getFieldNamesAsVector().elementAt(0);		
        DataInfo[] test = find(fieldName, (newData.getValues())[0]);
        if ((test != null) &&
            (test[0].getRecordNumber()!=newData.getRecordNumber()))
        {
            throw new DatabaseException("Attempt to create a "+
                                        "duplicate key by modification");
        }

        try		{
            seek(newData.getRecordNumber());
            writeRecord(newData.getValues());
        } catch (IOException e)		{
            throw new DatabaseException(UNEXPECTED + e);
        }
    }

    /**
    * This method deletes the record referred to by the record
    * number in the DataInfo argument.
    *
    * @param DataInfo newData The record to delete.    * 
    * @exception DatabaseException Thrown if database cannot be accessed.
    */
    public synchronized void delete(DataInfo toDelete)		throws DatabaseException	{
        invariant();
        try		{
            seek(toDelete.getRecordNumber());
            db.write(DELETED_RECORD);
        } catch (IOException e)		{
            throw new DatabaseException(UNEXPECTED + e);
        }
    }

    /**
    * This method closes the database, flushing any outstanding
    * writes at the same time. Any attempt to access the
    * database after this results in a IOException.
    */
    public synchronized void close()	{
        try		{
            db.close();
        }		catch (IOException e) { /* ignore */ }

        db = null;
    }

    protected synchronized void finalize()	{
        if (db != null)		{			System.out.println("from finalize");
            close();
        }
    }

    /**
    * Reads a record from the current cursor position of the underlying random
    * access file.    * 
    * @return The array of strings that make up a database record.    * 
    * @exception IOException Generated if the RandomAccessFile cannot read from
    *        the database file.
    */
    private synchronized String[] readRecord() throws IOException	{
        int offset = 1;
        String[] rv = null;
        byte[] buffer = new byte[recordLen];		byte[] tempBytes = null;

        db.read(buffer);
        if (buffer[0] == LIVE_RECORD)		{
            rv = new String[description.length];
            for (int i = 0; i < description.length; i++)			{
				// START --- THIS REPLACES DEPRECATED METHOD BELOW				tempBytes = new byte[description[i].getLength()];				System.arraycopy(buffer, offset, tempBytes, 0,								 description[i].getLength());
                rv[i] = new String(tempBytes);
				// END ---				
				// DEPRECATED, replaced 				//rv[i] = new String(buffer, 0, offset, description[i].getLength());
                				offset += description[i].getLength();
            }
        }
        return rv;
    }

    /**
    * Writes a new record to the database using the current location of the
    * underlying random access file.    * 
    * @param newData An array of strings in the database specified order.    * 
    * @exception IOException Generated if the RandomAccessFile cannot write to
    *        the file or the wrong number of fields are specified.
    */
    private synchronized void writeRecord(String[] newData) throws IOException	{
        if (newData.length != description.length)		{
            throw new IOException				("Data: Wrong number of fields in writeRecord() " +
                                  newData.length + " given, " +								  description.length + " required");
        }

        int size, space, toCopy;
        byte[] buffer = new byte[recordLen];
        buffer[0] = LIVE_RECORD;
        int offset = 1;		String tempString = null;		byte[] tempBuffer = null;

        for (int i = 0; i < description.length; i++)		{
            space = description[i].getLength();
            size = newData[i].length();
            toCopy = (size <= space) ? size : space;

			// START --- THIS REPLACES DEPRECATED METHOD BELOW			tempString = newData[i].substring(0, toCopy);
			tempBuffer = tempString.getBytes();			System.arraycopy(tempBuffer, 0, buffer, offset, tempBuffer.length);
			// END ---					// DEPRECATED, replaced 
            //newData[i].getBytes(0, toCopy, buffer, offset);			
            offset += space;
        }

        db.write(buffer);
    }

    /**
    * Moves the current database record pointer to the specified record.    * 
    * @param recno The record number to position the cursor.    * 
    * @exception IOException If the record position is invalid.
    */
    private synchronized void seek(int recno) throws IOException	{
        db.seek(headerLen + (recordLen * (recno - 1)));
    }

    /**
    * Lock the requested record. If the argument is -1, lock the whole
    * database. This method blocks until the lock succeeds. No timeouts
    * are defined for this.    * 
    * @param record The record number to lock.
    * @param clientId - the client's ID    * 
    * @exception DatabaseException If the record position is invalid.
    */
    public synchronized void lock(int record, String clientId)
		throws DatabaseException	{
		if(record == -1) // whole database locking logic		{			lock.lockDb(clientId);		}		else // regular record locking logic
		{			// check if the record number is valid			if(record < 0 || record > getRecordCount())
			{				throw new DatabaseException
					("Lock Error: invalid record " + record);
			}
			else
			{				lock.lockRow(clientId, record);
			}
		}
    }

    /**
    * Unlock the requested record. If the argument is -1, unlock the whole
    * database.    *     * @param int record - number of the record    * @param String clientId - client's ID
    *     * @exception DatabaseException - if the caller does not have lock    * or the record number is invalid
    */
    public synchronized void unlock(int record, String clientId)
		throws DatabaseException	{		if(record == -1)		{			lock.unlockDb(clientId);
		}
		else
		{			// check if the record number is valid			if(record < 0 || record > getRecordCount())
			{				throw new DatabaseException
					("Lock Error: invalid record " + record);			}			else			{
				lock.unlockRow(clientId, record);			}	
		}
    }

    /**
    * Ensures that the database structure is valid.    * 
    * @exception RuntimeException If structure has become corrupted.
    */
    protected final synchronized void invariant()	{
        boolean ok = false;
        try		{
            if (db.length() == headerLen + (recordLen * recordCount))			{
                ok = true;
            }
        } catch (Exception e)		{
            throw new RuntimeException(UNEXPECTED + e);
        }

        if (!ok)		{
            throw new RuntimeException("Data: Internal error");
        }
    }
}
