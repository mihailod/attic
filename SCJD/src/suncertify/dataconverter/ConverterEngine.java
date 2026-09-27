package suncertify.dataconverter;

import java.io.*;
import java.util.*;

import suncertify.db.*;

/**
 * The engine for converting ASCII file to proprietary db format file.
 * The resulting file is created by <code>Data</code> constructor
 * and all lines have been inserted using <code>Data</code>'s API
 * (method <code>add</code> specifically).
 * 
 * @author Mihailo Despotovic
 * @version 1.1
 */
public class ConverterEngine
{
	private static final String DATA_DELIMITER = "^";
	
	/**
	 * Converts ASCII file to proprietary binary db file.
	 * Calls <code>processLine</code> for each line in ASCII file.
	 * 
	 * @param String asciiFileName
	 * @param String dbFileName
	 * 
	 * @exception IllegalArgumentException
	 */
	public void convert(String asciiFileName, String dbFileName)
		throws IllegalArgumentException
	{
		try
		{
			Data data = new Data(dbFileName);
			FileReader fileReader = new FileReader(asciiFileName);
			LineNumberReader lineNumberReader = new LineNumberReader
															(fileReader);
			
			String line = null;
			System.out.println("Processing ASCII file...");
			while((line = lineNumberReader.readLine()) != null)
			{
				System.out.print("Line " + lineNumberReader.getLineNumber() +
								 ": ");
				processLine(data, line); // can throw IllegalArgumentException
			}
			lineNumberReader.close();
			fileReader.close();
		}
		catch(IOException iox)
		{
			System.out.println("\n\nConverterEngine reported error: " +
							   iox.toString());
		}
	}
	
	/**
	 * Processes one line of the input ASCII file
	 * Reports the progress to the user. If the line cannot be parsed,
	 * gives the output to the user and skips that line.
	 * 
	 * @param Data database
	 * @param String line
	 */
	private void processLine(Data database, String line)
		throws IllegalArgumentException
	{
			String[] data = new String[9];
			StringTokenizer stringTokenizer = new StringTokenizer
												(line, DATA_DELIMITER);
			String nextToken = null;
			
			FieldInfo[] columns = database.getFieldInfo();
			
			boolean skip = false;
			for(int i=0; i<9; i++)
			{
				try
				{
					nextToken = stringTokenizer.nextToken();
					
					if(((FieldInfo)columns[i]).getLength() <
					   nextToken.length())
					{
						System.out.println("Field length overflow: " +
							nextToken.length() +
							" detected, should be less than " +
								((FieldInfo)columns[i]).getLength() +
										   ". Skipped.");
						return;
					}
					
					data[i] = nextToken;
				}
				catch(Exception e)
				{
					System.out.println(" Unparseable. (" + e.toString() +
									   ") Skipped.");
					skip = true;
					break;
				}
			}
			
			if(!skip)
			{
				try
				{
					database.add(data); // can throw IllegalArgumentException
					System.out.println("OK");
				}
				catch(DatabaseException dx)
				{
					System.out.println("ConverterEngine: can't add data to" +
									   " database: " + dx.toString() +
									   ". Skipped.");
				}
			}
	}
}
