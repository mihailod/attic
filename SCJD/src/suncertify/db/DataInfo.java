package suncertify.db;

import java.io.*;

/**
 * This class embodies the description of a record from the database. 
 * It describes a record number, a list of Strings which reflect 
 * the values of the fields in, and a description of each field.
 *
 * @version 1.0  11-Sep-1997
 */
public class DataInfo implements Serializable
{
  /**
   * @serial int recordNumber
   */
  private int recordNumber;
  
  /**
   * @serial String[] values
   */
  private String [] values;
  
  /**
   * @serial FieldInfo[] fields
   */
  private FieldInfo [] fields;
  
  //final static char sc = 'A';

  /**
   * This constructor creates a DataInfo object which has null 
   * Strings for its field values.
   *
   * @param recordNumber - the unique number for this record.
   * @param fields - the array of FieldInfo objects
   *                             which recodesent the names and
   *                             lenghts of the fields in this
   *                             DataInfo object.
   */
  public DataInfo(int recordNumber, FieldInfo [] fields)
  {
    this.recordNumber = recordNumber;
    this.fields = new FieldInfo[fields.length];
    System.arraycopy(fields, 0, this.fields, 0, fields.length);
    this.values = new String[fields.length];
  }

  /**
   * This constructor creates a DataInfo object that contains 
   * Strings for its field values.
   *
   * @param recordNumber - the unique number for this record.
   * @param fields - the array of FieldInfo objects
   *                             which recodesent the names and
   *                             lenghts of the fields in this
   *                             DataInfo object.
   * @param values - The values for the field values.
   */
  public DataInfo(int recordNumber, FieldInfo [] fields, String [] values)
  {
    this(recordNumber, fields);
    System.arraycopy(values, 0, this.values, 0, values.length);
  }

  /**
   * This method returns the record number associated with this 
   * DataInfo.
   *
   * @returns int - the unique record number of this DataInfo
   */
  public synchronized int getRecordNumber() { return recordNumber; }

  /**
   * This method returns an array of Strings, which reflect the 
   * values of the fields in this DataItem.   
   *
   * @returns String[] - String array of all the field values 
   *                     of this DataInfo.
   */
  public synchronized String[] getValues() { return values; }

  /**
   * This method returns an array of FieldInfo objects. These 
   * describe the database schema in terms of the name and 
   * width of each field.   
   *
   * @returns FieldInfo[] - FieldInfo array of all the fields
   *                        of this DataInfo.
   */
  public synchronized FieldInfo[] getFields() { return fields; }

  /**
   * This method constructs and returns a String which describes 
   * this DataInfo object in a form suitable for debug output.
   *
   * @returns String - A textual recodesentation of this DataInfo.
   */
  public synchronized String toString() {
    StringBuffer rv = new StringBuffer(super.toString() +
      "recordNumber = " + recordNumber +
      "\nFields:");
    for (int i = 0; i < fields.length; i++) {
      rv.append("Name = " + fields[i].getName() +
	" value = " + values[i] + "\n");
    }
    return rv.toString();
  }
}
