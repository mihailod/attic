; CLW file contains information for the MFC ClassWizard

[General Info]
Version=1
LastClass=CWAVView
LastTemplate=CDialog
NewFileInclude1=#include "stdafx.h"
NewFileInclude2=#include "WAV.h"
LastPage=0

ClassCount=5
Class1=CWAVApp
Class2=CWAVDoc
Class3=CWAVView
Class4=CMainFrame

ResourceCount=2
Resource1=IDD_ABOUTBOX
Class5=CAboutDlg
Resource2=IDR_MAINFRAME

[CLS:CWAVApp]
Type=0
HeaderFile=WAV.h
ImplementationFile=WAV.cpp
Filter=N

[CLS:CWAVDoc]
Type=0
HeaderFile=WAVDoc.h
ImplementationFile=WAVDoc.cpp
Filter=N
LastObject=CWAVDoc

[CLS:CWAVView]
Type=0
HeaderFile=WAVView.h
ImplementationFile=WAVView.cpp
Filter=C
BaseClass=CView
VirtualFilter=VWC

[CLS:CMainFrame]
Type=0
HeaderFile=MainFrm.h
ImplementationFile=MainFrm.cpp
Filter=T
LastObject=ID_FILE_OPEN
BaseClass=CFrameWnd
VirtualFilter=fWC



[CLS:CAboutDlg]
Type=0
HeaderFile=WAV.cpp
ImplementationFile=WAV.cpp
Filter=D

[DLG:IDD_ABOUTBOX]
Type=1
Class=CAboutDlg
ControlCount=4
Control1=IDC_STATIC,static,1342177283
Control2=IDC_STATIC,static,1342308480
Control3=IDC_STATIC,static,1342308352
Control4=IDOK,button,1342373889

[MNU:IDR_MAINFRAME]
Type=1
Class=CMainFrame
Command1=ID_FILE_OPEN
Command2=ID_GO
Command3=ID_FILE_MRU_FILE1
Command4=ID_APP_EXIT
Command5=ID_VIEW_TOOLBAR
Command6=ID_HELP_HELP
Command7=ID_APP_ABOUT
CommandCount=7

[ACL:IDR_MAINFRAME]
Type=1
Class=CMainFrame
Command1=ID_GO
Command2=ID_FILE_OPEN
Command3=ID_NEXT_PANE
Command4=ID_PREV_PANE
CommandCount=4

[TB:IDR_MAINFRAME]
Type=1
Class=CMainFrame
Command1=ID_FILE_OPEN
Command2=ID_GO
Command3=ID_HELP_HELP
Command4=ID_APP_ABOUT
CommandCount=4

