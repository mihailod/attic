// WAVView.cpp : implementation of the CWAVView class
//

#include "stdafx.h"
#include "WAV.h"

#include "WAVDoc.h"
#include "WAVView.h"

#ifdef _DEBUG
#define new DEBUG_NEW
#undef THIS_FILE
static char THIS_FILE[] = __FILE__;
#endif



/////////////////////////////////////////////////////////////////////////////
// CWAVView

IMPLEMENT_DYNCREATE(CWAVView, CView)

BEGIN_MESSAGE_MAP(CWAVView, CView)
	//{{AFX_MSG_MAP(CWAVView)
	ON_COMMAND(ID_GO, OnGo)
	ON_COMMAND(ID_FILE_OPEN, OnFileOpen)
	//}}AFX_MSG_MAP
END_MESSAGE_MAP()

/////////////////////////////////////////////////////////////////////////////
// CWAVView construction/destruction

CWAVView::CWAVView()
{
	// TODO: add construction code here

}

CWAVView::~CWAVView()
{
}

BOOL CWAVView::PreCreateWindow(CREATESTRUCT& cs)
{
	// TODO: Modify the Window class or styles here by modifying
	//  the CREATESTRUCT cs

	return CView::PreCreateWindow(cs);
}

/////////////////////////////////////////////////////////////////////////////
// CWAVView drawing

void CWAVView::OnDraw(CDC* pDC)
{
	CWAVDoc* pDoc = GetDocument();
	ASSERT_VALID(pDoc);

	LONG y;
	LONG step;
	LONG x=0;

	if(pDoc->ind==1)
	
	{
	CRect rect;
	GetClientRect(rect);

	step=rect.right/pDoc->end;
	if(step==0) step=1;

	pDC->MoveTo(5,(rect.bottom*(pDoc->data[0]))/256);


	for(DWORD i=1; i<pDoc->end; i++)
		{
			y=((rect.bottom*(pDoc->data[i]))/256);
			x+=step;
			pDC->LineTo(x,y);
		}
	}
}

/////////////////////////////////////////////////////////////////////////////
// CWAVView diagnostics

#ifdef _DEBUG
void CWAVView::AssertValid() const
{
	CView::AssertValid();
}

void CWAVView::Dump(CDumpContext& dc) const
{
	CView::Dump(dc);
}

CWAVDoc* CWAVView::GetDocument() // non-debug version is inline
{
	ASSERT(m_pDocument->IsKindOf(RUNTIME_CLASS(CWAVDoc)));
	return (CWAVDoc*)m_pDocument;
}
#endif //_DEBUG



/////////////////////////////////////////////////////////////////////////////
// CWAVView message handlers



void CWAVView::OnGo() // *******************
{
	CWAVDoc* pDoc = GetDocument();
	ASSERT_VALID(pDoc);	

	if(pDoc->ind==0)
		{
			MessageBox("You must select a file first!");
		}
	else
	{
	
	CFile file;
	CFileException exception;
	DWORD len;
	char buffer;
	DWORD step;
	LONG j=0;

	if( !file.Open(pDoc->fileselected, CFile::modeRead, &exception))
	{
		MessageBox("Could not open this file!");
	}
	else
	{
	len=file.GetLength();
	if(len<DATA) step=1;
		else step=len/DATA;
		
	for(DWORD i=0; i<len; i+=step)
	{
		file.Read(&buffer,1);
		file.Seek((LONG)step, CFile::current);
		pDoc->data[j++]=buffer;
	}

	pDoc->end=j-1;

	file.Close();
	}
	Invalidate(TRUE);
	}
}

void CWAVView::OnFileOpen() // *******************
{
	CWAVDoc* pDoc = GetDocument();

	CFileDialog dlg(TRUE);
	if(dlg.DoModal() == IDOK)
	{
	//	MessageBox("1");
		
		pDoc->ind=1;

	//	MessageBox("2");
		strcpy(pDoc->fileselected, dlg.GetPathName());

	//	for(int i=0; i<=DATA; i++) pDoc->data[i]=0;
	//	Invalidate(TRUE);
	//		MessageBox(pDoc->fileselected);
	}

}
