package suncertify.dataconverter;

import java.io.*;

import suncertify.db.*;

/**
 * Converts ASCII database file to proprietary binary database file.
 * This class really just checks input parameters and transfers the
 * control to the converting engine - <code>ConverterEngine</code>.
 * 
 * @author Mihailo Despotovic
 * @version 1.1
 */
public class Converter
{	
	private static final int NUMBER_OF_ARGUMENTS = 2;
	
	/**
	 * The main method.
	 * Checks validity of input params and either outputs usage or
	 * transfers control to the convertor engine.
	 * 
	 * @param String[] args - ASCII file name and db file name
	 */
	public static void main(String[] args)
	{
		if(args.length != NUMBER_OF_ARGUMENTS)
		{
			// usage
			System.out.println("Welcome to Data Converter Utility.");
			System.out.println("Usage: Converter " +
						   "<ASCII file name> <DB file name>");
		}
		else
		{
			String asciiFileName = args[0];
			String dbFileName = args[1];
			
			if(!createDatabase(dbFileName))
			{
				System.out.println("Invalid arguments. Try again.");
			}
			else
			{
				ConverterEngine ce = new ConverterEngine();
				try
				{	
					ce.convert(asciiFileName, dbFileName);
				}
				catch(Exception e)
				{
					e.printStackTrace();
				}
			}
		}
	}

	/**
	 * Creates link towards database.
	 * <code>true</code> return value means OK, <code>false</code> means
	 * that something went wrong (<code>IOException</code> caught).
	 * Creates new database if it is necessary.
	 * 
	 * @param String dbFileName - the name of db file
	 * 
	 * @return boolean
	 */
	private static boolean createDatabase(String dbFileName)
	{
		try
		{
			File f = new File(dbFileName);
			if(f.exists())
			{
				if(deleteExistingFile(dbFileName))
				{
					f.delete();
					Data data = new Data(dbFileName, Fields.getFieldInfo());
				}
				else
				{
					// nothing
				}
			}
			else
			{
				Data data = new Data(dbFileName, Fields.getFieldInfo());
			}
			
			return true;
		}
		catch(IOException iox)
		{
			System.out.println("ArgumentsParser: Can't check existance of " +
							   dbFileName + " file: " + iox.toString());
			return false;
		}
	}
	
	/**
	 * Handles the situation where db file already exists.
	 * Interacts with user.
	 * Returns <code>true</code> if new database have to be created
	 * and <code>false</code> if user wants to append to the existing one.
	 * 
	 * @param String fileName
	 * 
	 * @return boolean
	 */
	private static boolean deleteExistingFile(String fileName)
		throws IOException
	{
		final int INPUT_BUFFER_LENGTH = 1024;
		
		byte[] inputBuffer = new byte[INPUT_BUFFER_LENGTH];
		
		System.out.println("File " + fileName + " already exists.");
		System.out.print("Append data (y) or " +
						 "make a new file (n - default) ?  > ");
		System.in.read(inputBuffer);
		if(inputBuffer[0] == (byte)'y' || inputBuffer[0] == (byte)'Y')
		{
			System.out.println("Appending...");
			return false;
		}
		else
		{
			System.out.println("Making a new " + fileName + " file...");
			return true;
		}
	}
}
