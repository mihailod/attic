// WAVDoc.h : interface of the CWAVDoc class
//
/////////////////////////////////////////////////////////////////////////////

#if !defined(AFX_WAVDOC_H__E6DBF1FB_E8E9_11D1_B964_0020A90CA2A4__INCLUDED_)
#define AFX_WAVDOC_H__E6DBF1FB_E8E9_11D1_B964_0020A90CA2A4__INCLUDED_

#if _MSC_VER >= 1000
#pragma once
#endif // _MSC_VER >= 1000

#define DATA 100	// ********

class CWAVDoc : public CDocument
{
protected: // create from serialization only
	CWAVDoc();
	DECLARE_DYNCREATE(CWAVDoc)

// Attributes
public:

	WORD ind;				// check if there is selected file ********
	char fileselected[256];	// path+name for selected file     ********
	BYTE data[DATA];		// data to be displayed			   ********
	DWORD end;

// Operations
public:
	
// Overrides
	// ClassWizard generated virtual function overrides
	//{{AFX_VIRTUAL(CWAVDoc)
	public:
	virtual BOOL OnNewDocument();
	virtual void Serialize(CArchive& ar);
	//}}AFX_VIRTUAL

// Implementation
public:

	
	virtual ~CWAVDoc();
#ifdef _DEBUG
	virtual void AssertValid() const;
	virtual void Dump(CDumpContext& dc) const;
#endif

protected:

// Generated message map functions
protected:
	//{{AFX_MSG(CWAVDoc)
		// NOTE - the ClassWizard will add and remove member functions here.
		//    DO NOT EDIT what you see in these blocks of generated code !
	//}}AFX_MSG
	DECLARE_MESSAGE_MAP()
};

/////////////////////////////////////////////////////////////////////////////

//{{AFX_INSERT_LOCATION}}
// Microsoft Developer Studio will insert additional declarations immediately before the previous line.

#endif // !defined(AFX_WAVDOC_H__E6DBF1FB_E8E9_11D1_B964_0020A90CA2A4__INCLUDED_)
