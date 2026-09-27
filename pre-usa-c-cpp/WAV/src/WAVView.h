// WAVView.h : interface of the CWAVView class
//
/////////////////////////////////////////////////////////////////////////////

#if !defined(AFX_WAVVIEW_H__E6DBF1FD_E8E9_11D1_B964_0020A90CA2A4__INCLUDED_)
#define AFX_WAVVIEW_H__E6DBF1FD_E8E9_11D1_B964_0020A90CA2A4__INCLUDED_

#if _MSC_VER >= 1000
#pragma once
#endif // _MSC_VER >= 1000

class CWAVView : public CView
{
protected: // create from serialization only
	CWAVView();
	DECLARE_DYNCREATE(CWAVView)

// Attributes
public:
	CWAVDoc* GetDocument();

// Operations
public:

// Overrides
	// ClassWizard generated virtual function overrides
	//{{AFX_VIRTUAL(CWAVView)
	public:
	virtual void OnDraw(CDC* pDC);  // overridden to draw this view
	virtual BOOL PreCreateWindow(CREATESTRUCT& cs);
	protected:
	//}}AFX_VIRTUAL

// Implementation
public:
	virtual ~CWAVView();
#ifdef _DEBUG
	virtual void AssertValid() const;
	virtual void Dump(CDumpContext& dc) const;
#endif

protected:

// Generated message map functions
protected:
	//{{AFX_MSG(CWAVView)
	afx_msg void OnGo();
	afx_msg void OnFileOpen();
	//}}AFX_MSG
	DECLARE_MESSAGE_MAP()
};

#ifndef _DEBUG  // debug version in WAVView.cpp
inline CWAVDoc* CWAVView::GetDocument()
   { return (CWAVDoc*)m_pDocument; }
#endif

/////////////////////////////////////////////////////////////////////////////

//{{AFX_INSERT_LOCATION}}
// Microsoft Developer Studio will insert additional declarations immediately before the previous line.

#endif // !defined(AFX_WAVVIEW_H__E6DBF1FD_E8E9_11D1_B964_0020A90CA2A4__INCLUDED_)
