// WAV.h : main header file for the WAV application
//

#if !defined(AFX_WAV_H__E6DBF1F5_E8E9_11D1_B964_0020A90CA2A4__INCLUDED_)
#define AFX_WAV_H__E6DBF1F5_E8E9_11D1_B964_0020A90CA2A4__INCLUDED_

#if _MSC_VER >= 1000
#pragma once
#endif // _MSC_VER >= 1000

#ifndef __AFXWIN_H__
	#error include 'stdafx.h' before including this file for PCH
#endif

#include "resource.h"       // main symbols

/////////////////////////////////////////////////////////////////////////////
// CWAVApp:
// See WAV.cpp for the implementation of this class
//


class CWAVApp : public CWinApp
{
public:
	CWAVApp();

	int ind;
// Overrides
	// ClassWizard generated virtual function overrides
	//{{AFX_VIRTUAL(CWAVApp)
	public:
	virtual BOOL InitInstance();
	//}}AFX_VIRTUAL

// Implementation

	//{{AFX_MSG(CWAVApp)
	afx_msg void OnAppAbout();
		// NOTE - the ClassWizard will add and remove member functions here.
		//    DO NOT EDIT what you see in these blocks of generated code !
	//}}AFX_MSG
	DECLARE_MESSAGE_MAP()
};


/////////////////////////////////////////////////////////////////////////////

//{{AFX_INSERT_LOCATION}}
// Microsoft Developer Studio will insert additional declarations immediately before the previous line.

#endif // !defined(AFX_WAV_H__E6DBF1F5_E8E9_11D1_B964_0020A90CA2A4__INCLUDED_)
