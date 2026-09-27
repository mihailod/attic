Fly by Night Application README file

------------------------
APPLICATION INSTALLATION
------------------------

1. after unpacking of original .jar file, you will
have the following .jar files:
   doc.jar (user and development documentation)
   server.jar (server source and object code)
   client.jar (client source and object code)
   dataconverter.jar (data converter source and object code)
   original.jar (the original project files)
   
You can either unpack all jar files into the same directory
or you can use separate jars for installation of single modules.
It is important that the structure of the directories must be
preserved because of Java naming conventions.

NOTE: some files are shared among different jars. So, if
you unpack them all, you will overwrite some of them which
is a regular situation.

-----------------
APPLICATION USAGE
-----------------

The application consists of three modules:
1. Database Server
2. Client Application
3. Conversion Tool

In order to run any of these modules, you need:
1. Java 2 SDK properly set up
2. you have to change your working directory to the
   application root directory (the one you unpacked
   distribution .jar file into)

1. Database Server
------------------
Purpose: to provide access to the Fly by night data
to client applications.

Start the module with the following command:
java -Djava.security.policy=server.policy suncertify.server.Server

2. Client application
---------------------
Purpose: to provide easy interface towards database.
Users should use the client application to book seats
on desired flights.

Start the module witht the following command:
java -Djava.security.policy=client.policy suncertify.client.Client

3. Conversion Tool
------------------
Purpose: to convert legacy "Fly by Night" data (ASCII files)
into binary format appropriate for the database engine.

Start the module witht the following command:
java suncertify.dataconverter.Converter <legacy file> <DB file>

---------------------------
APPLICATION FILES STRUCTURE
---------------------------

After you unpack all .jar files, you will have the following
overall directory structure (we omit source files here,
they follow the same structure)

APPLICATION_ROOT
|   client.policy (client policy file)
|   db (legacy database sample)
|   README.TXT (this file)
|   server.policy (server policy file)
|   testascii.txt (ascii database sample)
|
+---javadoc (directory with javadoc project files)
+---userdoc (directory with user documentation)
|
\---suncertify
    +---client
    |   |   Client.class
    |   |
    |   \---gui
    |       |   Client.class (just creates MainFrame)
    |       |   MainFrame.class (all client logic is here)
    |       |   RemoteDialog.class (dialog for gathering of RMI connection info)
    |       |
    |       +---data
    |       |       DatabaseProxy.class (Proxy database access)
    |       |       FlightsTableModel.class (table model for GUI)
    |       |
    |       \---util
    |               ColoredLabel.class (extends label - for GUI)
    |
    +---dataconverter
    |       Converter.class (contains main and some wrapping stuff, calls engine)
    |       ConverterEngine.class (converter engine)
    |
    +---db
    |       Data.class (database)
    |       DatabaseException.class (database exception)
    |       DatabaseLock.class (database lock)
    |       DataInfo.class (database record description)
    |       FieldInfo.class (field record description)
    |       Fields.class (database description)
    |
    \---server
            RemoteDataRmiImplementation.class (RMI implementation)
            RemoteDataRmiImplementation_Stub.class (RMI Stub)
            RemoteDataRmiInterface.class (RMI interface)
            Server.class (the server is here)

---------------------
FURTHER DOCUMENTATION
---------------------

DETAILED DESIGN DOCUMENTATION - look into the directory 'javadoc'

USER DOCUMENTATION - look into the directory 'userdoc'