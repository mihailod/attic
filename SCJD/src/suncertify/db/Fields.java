package suncertify.db;

import java.util.*;

/**
 * Database description.
 * We define field names and their lenghts here.
 * 
 * @author Mihailo Despotovic
 * @version 1.0
 */
public class Fields
{	
	// field names
	private static final String FIELD1 = "FlightNumber";
	private static final String FIELD2 = "OriginAirport";
	private static final String FIELD3 = "DestinationAirport";
	private static final String FIELD4 = "Carrier";
	private static final String FIELD5 = "Price";
	private static final String FIELD6 = "Day";
	private static final String FIELD7 = "Time";
	private static final String FIELD8 = "Duration";
	private static final String FIELD9 = "AvailableSeats";
	
	// field lengths
	private static final int FIELD1_LEN =  5;
	private static final int FIELD2_LEN =  3;
	private static final int FIELD3_LEN =  3;
	private static final int FIELD4_LEN = 30;
	private static final int FIELD5_LEN =  5;
	private static final int FIELD6_LEN =  3;
	private static final int FIELD7_LEN =  5;
	private static final int FIELD8_LEN =  6;
	private static final int FIELD9_LEN =  3;
	
	/**
	 * Returns field names and lenghts.
	 * 
	 * @return FieldInfo[]
	 */
	public synchronized static FieldInfo[] getFieldInfo()
	{
		FieldInfo fieldInfo[] = new FieldInfo[9];
		
		fieldInfo[0] = new FieldInfo(FIELD1, FIELD1_LEN);
		fieldInfo[1] = new FieldInfo(FIELD2, FIELD2_LEN);
		fieldInfo[2] = new FieldInfo(FIELD3, FIELD3_LEN);
		fieldInfo[3] = new FieldInfo(FIELD4, FIELD4_LEN);
		fieldInfo[4] = new FieldInfo(FIELD5, FIELD5_LEN);
		fieldInfo[5] = new FieldInfo(FIELD6, FIELD6_LEN);
		fieldInfo[6] = new FieldInfo(FIELD7, FIELD7_LEN);
		fieldInfo[7] = new FieldInfo(FIELD8, FIELD8_LEN);
		fieldInfo[8] = new FieldInfo(FIELD9, FIELD9_LEN);
		
		return fieldInfo;
	}
	
	/**
	 * Returns field names as Vector
	 * 
	 * @return Vector
	 */
	public synchronized static Vector getFieldNamesAsVector()
	{
		Vector v = new Vector();
		v.addElement(FIELD1);
		v.addElement(FIELD2);
		v.addElement(FIELD3);
		v.addElement(FIELD4);
		v.addElement(FIELD5);
		v.addElement(FIELD6);
		v.addElement(FIELD7);
		v.addElement(FIELD8);
		v.addElement(FIELD9);
		
		return v;
	}
}

