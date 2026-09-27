// WAVDoc.cpp : implementation of the CWAVDoc class
//

#include "stdafx.h"
#include "WAV.h"

#include "WAVDoc.h"


#ifdef _DEBUG
#define new DEBUG_NEW
#undef THIS_FILE
static char THIS_FILE[] = __FILE__;
#endif

/////////////////////////////////////////////////////////////////////////////
// CWAVDoc

IMPLEMENT_DYNCREATE(CWAVDoc, CDocument)

BEGIN_MESSAGE_MAP(CWAVDoc, CDocument)
	//{{AFX_MSG_MAP(CWAVDoc)
		// NOTE - the ClassWizard will add and remove mapping macros here.
		//    DO NOT EDIT what you see in these blocks of generated code!
	//}}AFX_MSG_MAP
END_MESSAGE_MAP()

/////////////////////////////////////////////////////////////////////////////
// CWAVDoc construction/destruction

CWAVDoc::CWAVDoc()
{
	// TODO: add one-time construction code here

	ind=0;	// no selected files when application starts ********

	for(int i=0; i<= DATA; i++)
	{
		data[i]=0;	// init all data to zeros
	}
}

CWAVDoc::~CWAVDoc()
{
}

BOOL CWAVDoc::OnNewDocument()
{
	if (!CDocument::OnNewDocument())
		return FALSE;

	// TODO: add reinitialization code here
	// (SDI documents will reuse this document)

	return TRUE;
}



/////////////////////////////////////////////////////////////////////////////
// CWAVDoc serialization

void CWAVDoc::Serialize(CArchive& ar)
{
	if (ar.IsStoring())
	{
		// TODO: add storing code here
	}
	else
	{
		// TODO: add loading code here
	}
}

/////////////////////////////////////////////////////////////////////////////
// CWAVDoc diagnostics

#ifdef _DEBUG
void CWAVDoc::AssertValid() const
{
	CDocument::AssertValid();
}

void CWAVDoc::Dump(CDumpContext& dc) const
{
	CDocument::Dump(dc);
}
#endif //_DEBUG

/////////////////////////////////////////////////////////////////////////////
// CWAVDoc commands
