package suncertify.db;

/**
 * Defines DatabaseException
 */
public class DatabaseException extends Exception
{
	/**
	 * This constructor does nothing.
	 * In this case, <code>Exception</code> is going to be used.
	 */
    public DatabaseException()
	{
		// nothing
	}

	/**
	 * This constructor calls <code>Exception</code>'s constructor 
	 * with passed argument message
	 * 
	 * @param String msg
	 */
    public DatabaseException(String message)
	{
        super(message);
    }
}