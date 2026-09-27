/*
   MATEMATICKI FAKULTET BEOGRAD

	- Seminarski rad -

   TEMA     : Varijacione metode

   PREDMET  : Numericke metode
   SIFRA    : NM

   PROFESOR : Desa Radunovic

   URADIO   : Mihailo Despotovic MR9031
*/

#include <math.h>
#include <graphics.h>

#include "c:\other\pmf\nm\menu.c"
#include "c:\other\pmf\nm\evall.c"
#include "c:\other\pmf\nm\diff\dif_mat.c"

#define STEPEN 4
#define EPSILON 0.1

char        nevalja[]="Sintaksna greska u izrazu!";
char        *metod[]={ "\n Resenje metodom Galerkina : ",
		       "\n Resenje metodom kolokacije : ",
		       "\n Resenje metodom najmanjih kvadrata : " };
char        p[40],q[40],r[40],f[40],fkc[200],fkc1[1000],fkc2[2000],jednac[120];
char        lfkci[2000],niska[STEPEN*140],tacres[60];
char        temp[5000];
char        tx[30];
char        src[5000],tgt[5000]; // globalne vars za uprosti

int         n,metoda,n2,t,metrika,tac=0;

long double a,b,c,d,matr[STEPEN][STEPEN-1],res[STEPEN-1];
long double koef1,koef2;
long double pol[STEPEN+1],odstoj[STEPEN-1];

meni_strukt meni1={ 8,0,16,11,
			  BLACK,RED,WHITE,GREEN,BLACK,
			  0,1,
			  {
			    "\1J\1 ................... Unos/Promena JEDNACINE",
			    "\1B\1 ............... Unos/Promena BAZE PROSTORA",
			    "\1S\1 ............. Unos/Promena STEPENA RESENJA",
			    "\1T\1 .............. Unos/Promena TACNOG RESENJA",
			    "\2\1F1\1 ........................ Metoda GALERKINA",
			    "\1F2\1 ....................... Metoda KOLOKACIJE",
			    "\1F3\1 ............... Metoda NAJMANJIH KVADRATA",
			    "\2\1END\1 .............................. I z l a z"
			  },
			  { 'J','B','S','T',256*59,256*60,256*61,256*79 }
			};

void iscupaj(int prvi,int zadnji) // cupa iz s-a deo od prvi do zadnji
 {
  int i,j,duz;

  duz=strlen(src);
  prvi--;
  zadnji++;
  for(i=0;i<=prvi;i++) tgt[i]=src[i];
  for(j=zadnji;j<=duz;j++) tgt[i++]=src[j];
  tgt[duz-(zadnji-prvi)+1]='\0';
  strcpy(src,tgt);
 } // iscupaj

void ubaci(char sta,int gde) // insertuje char sta na mesto gde
{
 int i,duz;

 duz=strlen(src);
 for(i=0;i<gde;i++) tgt[i]=src[i];
 tgt[gde]=sta;
 for(i=gde+1;i<=duz+1;i++) tgt[i]=src[i-1];
 strcpy(src,tgt);
} // ubaci

int skinil0(void) // vrati 0 ako string nije menjan
 {
  int i=-1,j=0,duz,prvi,zadnji;

  duz=strlen(src);
  for(;;)
   {
    i++;
    if(i==duz-1) return 0;
    if(src[i]=='0')
     {
      if(src[i+1]=='*')
       {
	prvi=i;
	break;
       }                        // preslikavanje je:
     }                          // 0*(anything) --> (0)
   }
  ++i;
  for(;;)
   {
    ++i;
    if(i>=duz) return 0;
    switch(src[i])
     {
      case '(' : j++;break;
      case ')' : j--;break;
      default  :     break;
     }
    if(j==0)
     {
      zadnji=i;
      iscupaj(prvi,zadnji);
      ubaci(')',prvi);
      ubaci('0',prvi);
      ubaci('(',prvi);
      return 1;
     }
   }
 } // skinil0

int skinid0(void) // vrati 0 ako string nije menjan
 {
  int i,j=0,duz,prvi,zadnji;

  duz=strlen(src);
  i=duz+1;
  for(;;)
   {
    i--;
    if(i==1) return 0;
    if(src[i]=='0')
     {                          // preslikavanje:
      if(src[i-1]=='*')         // (anything)*0 --> (0)
       {
	if(src[i-2]==')')
	 {
	  zadnji=i;
	  break;
	 }
       }
     }
   }
  --i;
  for(;;)
   {
    --i;
    if(i<=0) return 0;
    switch(src[i])
     {
      case ')' : j++;break;
      case '(' : j--;break;
      default  :     break;
     }
    if(j==0)
     {
      prvi=i;
      iscupaj(prvi,zadnji);
      ubaci(prvi,')');
      ubaci(prvi,'0');
      ubaci(prvi,'(');
      return 1;
     }
    }
 } // skinid0

int skinil1(void) // vrati 0 ako string nije menjan
 {
  int i=-1,duz;

  duz=strlen(src);
  for(;;)
   {
    i++;
    if(i==duz-1) return 0;      // preslikavanje:
    if(src[i]=='1')             // 1*(anything) --> (anything)
     {
      if(src[i+1]=='*')
       {
	iscupaj(i,i+1);
	return 1;
       }
     }
   }
 } // skinil1

int skinid1(void)
 {
  int i,duz;

  duz=strlen(src);
  i=duz+1;
  for(;;)                      // preslikavanje:
   {                           // (anything)*1 --> (anything)
    i--;
    if(i==1) return 0;
    if(src[i]=='1')
     {
      if(src[i-1]=='*')
       {
	iscupaj(i-1,i);
	return 1;
       }
     }
   }
 } // skinid1

int skinizagrade(void) // vrati 0 ako string nije menjan
 {
  int duz,i=-1;
  char temp;

  duz=strlen(src);
  for(;;)
  {
   i++;
   if(i==duz-2) return 0;
   if(src[i]=='(')
    {
     switch(src[i+1])
      {
       case '0':
       case '1':           // preslikavanje je:
       case '2':           // (nesto_iz_switch) --> nesto_iz_switch
       case '3':           // cime se za 1 smanjuje dubina zagrada
       case '4':           // kod ovakvih prostih podizraza
       case '5':
       case '6':
       case '7':
       case '8':
       case '9':
       case 'x':
       case 'X':

		 {
		  if(src[i+2]==')')
		   {                    // (A) --> A
		    temp=src[i+1];      // AE{0,1,2,3,4,5,6,7,8,9,X,x}
		    iscupaj(i,i+2);
		    strcpy(src,tgt);
		    ubaci(temp,i);
		    strcpy(src,tgt);
		    return 1;
		   }
		  break;
		 }
       default : break;
      }
    }
  }
 } // skinizagrade

void uprosti(void)  // radi sa globalnim char src[],char tgt[] !!!
 {
  int ind;

  do
   {
    ind=0;
    ind=skinizagrade();
    ind+=skinil0();
    ind+=skinid0();
    ind+=skinil1();
    ind+=skinid1();
   }
  while(ind!=0);
 } // uprosti

void clrsc(void)
{
 textbackground(WHITE);
 textcolor(BLACK);
 clrscr();
 textbackground(WHITE);
 textcolor(RED);
 printf("\n");
 cprintf("--------------------- V A R I J A C I O N E    M E T O D E ---------------------");
 printf("\n");
}

void unosn(void)
{
  do
  {
    printf("\n Stepen polinoma za resenje (2 <= n <= %d) : ",STEPEN);
    scanf("%d",&n);
    if ((n<2) || (STEPEN<n)) printf(" Pogresno n\n");
  } while ((n<2) || (STEPEN<n));
} // unosn

void init(void)
{
 sprintf(p,"-2.718282");
 sprintf(q,"0");
 sprintf(r,"1");
 sprintf(f,"0");
 sprintf(tx,"1");
 a=0;
 b=1;
 c=1;
 d=1;
 koef2=(c-d)/(b-a);
 koef1=-c-koef2*a;
 n=2;
}

void unos(void)
{
  int gr;

  do
  {
    gr=0;
    clrsc();
    printf(" Oblik ulazne jednacine je : p(x)*u\"(x)+q(x)*u'(x)+r(x)*u(x)=f(x)");
    printf("\n\n p(x) : ");  scanf("%39s",p);
    if (str2polish(p)) { printf("%s",nevalja);  gr=1;  getch();  continue; }
    printf(" q(x) : ");  scanf("%39s",q);
    if (str2polish(q)) { printf("%s",nevalja);  gr=1; getch();  continue; }
    printf(" r(x) : ");  scanf("%39s",r);
    if (str2polish(r)) { printf("%s",nevalja);  gr=1;  getch();  continue; }
    printf(" f(x) : ");  scanf("%39s",f);
    if (str2polish(f)) { printf("%s",nevalja);  gr=1;  getch();  continue; }
    printf("\n Granicni uslovi : u(a)=c , u(b)=d, a<b");
    printf("\n Unesite a,b,c i d odvojene razmakom : ");
    scanf("%Lg %Lg %Lg %Lg",&a,&b,&c,&d);
    if (!(a<b)) { printf(" Mora biti a<b !");  gr=1;  getch(); }
  }
  while (gr==1);
  koef2=(c-d)/(b-a);
  koef1=-c-koef2*a;
  unosn();
} // unos

long double integr_smps(unsigned long m,long double (*funkcija)(long double))
{
  long double h,s;  // integrisi (numericki) f na [a,b]
  unsigned long i;  // Simpsonom (radi sa 2m podsegmenata)

  s=(*funkcija)(a)+(*funkcija)(b);
  h=(b-a)/(2*m);
  for (i=1;i<=m  ;i++) s+=4*(*funkcija)(a+(2*i-1)*h);
  for (i=1;i<=m-1;i++) s+=2*(*funkcija)(a+2*i*h);
  return s/3*h;
} // integr_smps

long double integr_num(char *f,long double eps,long double (*funkcija)(long double))
{
  unsigned long m;
  long double s1,s2,r;
  int br_it;

  br_it=0;		  // integrali (numericki)
  m=1;                    // (tacnost eps uz Rungeovu ocenu)
  if (str2polish(f)) { printf("\n Sintaksna greska u funkciji : %s!",f); return 0; }
  s1=integr_smps(m,funkcija);
  do
  {
    m+=m;
    s2=integr_smps(m,funkcija);
    r=(s2-s1)/15;
    s1=s2;
  }
  while ((fabsl(r)>eps) && (++br_it<100));
  return s2+r;
} // integr_num

int resi_sistem(int n)
{                   // matr[X][Y] ==> X kolona, Y vrsta.
  int i,j,k,m;      // Resi sistem linearnih jednacina dimenzije n^2
  long double a,b;  // obicnom Gausovom metodom

  for (i=0;i<n;i++)
  {
    a=matr[i][i];
    if (a==0) {
		for (j=i+1,m=0;j<n && !m;j++) if (matr[i][j]!=0) {
								   m=1;
								   a=matr[i][j];
								 }
		if (!m) return 1;
		   else for (k=0;k<n+1;k++) matr[k][i]+=matr[k][j-1];
	      }
    for (j=i+1;j<n;j++)
    {
      b=matr[i][j];
      for (k=0;k<n+1;k++) matr[k][j]=matr[k][j]*a-matr[k][i]*b;
    }
  }
  for (j=n-1;j>=0;j--)
  {
    a=0;
    for (i=j+1;i<n;i++) a+=matr[i][j]*res[i];
    a=matr[n][j]-a;
    b=matr[j][j];
    if (b==0) if (a==0) return 1;  // Neodredjen je !!!!!
		 else return 2;    // Protivurecan je !!!!!
       else
       {
	 res[j]=a/b;
	 if (fabsl(res[j])<1.0e-10) res[j]=0;
       }
  }
  return 0;
} // resi_sistem

char *uzmifkc(int k,char *fkc) // nadji bazni polinom
{
  char niz[30];

  strcpy(fkc,"(");
  strcat(fkc,tx);
  strcat(fkc,")*(");

  switch (k-2)
  {
    case 0:   break;
    case 1:   strcat(fkc,"x*");break;
    case 2:   strcat(fkc,"x*x*");break;

    default:  sprintf(fkc,"x^%d*(",k-2);
  }
  strcat(fkc,"(x*x");
  if ((a+b)!=0) if (fabsl(a+b)==1) if (-(a+b)>0) strcat(fkc,"+x");
				      else       strcat(fkc,"-x");
		   else { sprintf(niz,"%+Lg*x",-(a+b)); strcat(fkc,niz); }
  if ((a*b)!=0) { sprintf(niz,"%+Lg",a*b); strcat(fkc,niz); }
  strcat(fkc,"))");
  strcpy(src,fkc);
  uprosti();
  strcpy(fkc,src);
  return fkc;
} // uzmifkc

char *uzmifkc1(int k,char *fkc1)  // nadji prvi izvod baznog polinoma
{
  k++;k--;

  fkc1[0]='\0';
  n_depend('y');
  n_independ('x');
  izvod(fkc,src);
  uprosti();
  strcpy(fkc1,src);
  return src;
} // uzmifkc1

char *uzmifkc2(int k,char *fkc2) // nadji drugi izvod baznog polinoma
{
  k++;k--;

  fkc2[0]='\0';
  n_depend('y');
  n_independ('x');
  izvod(fkc1,src);
  uprosti();
  strcpy(fkc2,src);
  return src;
} // uzmifkc2

void galerkin(int n) // Galerkinova metoda
{
  char fij[200],niz[40];
  int  k,j;

  for (j=2;j<=n;j++)
  {
    uzmifkc(j,fij);
    for (k=2;k<=n;k++)
    {
      uzmifkc(k,fkc);uzmifkc1(k,fkc1);uzmifkc2(k,fkc2);
      strcpy(lfkci,"((");
      strcat(lfkci,p);strcat(lfkci,")*(");strcat(lfkci,fkc2);
      strcat(lfkci,")+(");strcat(lfkci,q);strcat(lfkci,")*(");
      strcat(lfkci,fkc1);strcat(lfkci,")+(");strcat(lfkci,r);
      strcat(lfkci,")*(");strcat(lfkci,fkc);strcat(lfkci,"))*");
      strcat(lfkci,fij);

      strcpy(src,lfkci);
      uprosti();
      strcpy(lfkci,src);

      matr[k-2][j-2]=integr_num(lfkci,EPSILON,eval);
    }
    strcpy(lfkci,"(");
    strcat(lfkci,f);
    if (koef2!=0) { sprintf(niz,"%+Lg*(%s)",koef2,q); strcat(lfkci,niz); }
    if (koef1!=0) { sprintf(niz,"%+Lg*(%s)",koef1,r); strcat(lfkci,niz); }
    strcat(lfkci,")*");
    strcat(lfkci,fij);

    strcpy(src,lfkci);
    uprosti();
    strcpy(lfkci,src);

    matr[n-1][j-2]=integr_num(lfkci,EPSILON,eval);
  }
} // galerkin

void kolokacija(int n) // Metoda kolokacije
{
  long double tacka[STEPEN-1],h;
  int         k,j;

  if (n==2) tacka[0]=(a+b)/2;
      else
      {
	h=(b-a)/(n-2);
	for (k=2;k<=n;k++) tacka[k-2]=a+(k-2)*h;
      }
  for (k=2;k<=n;k++)
  {
    uzmifkc(k,fkc);uzmifkc1(k,fkc1);uzmifkc2(k,fkc2);
    strcpy(lfkci,"(");
    strcat(lfkci,p);strcat(lfkci,")*(");strcat(lfkci,fkc2);
    strcat(lfkci,")+(");strcat(lfkci,q);strcat(lfkci,")*(");
    strcat(lfkci,fkc1);strcat(lfkci,")+(");strcat(lfkci,r);
    strcat(lfkci,")*(");strcat(lfkci,fkc);strcat(lfkci,")");

    strcpy(src,lfkci);
    uprosti();
    strcpy(lfkci,src);

    str2polish(lfkci);
    for (j=2;j<=n;j++) matr[k-2][j-2]=eval(tacka[j-2]);
  }
  str2polish(f);
  for (j=2;j<=n;j++) matr[n-1][j-2]=eval(tacka[j-2]);
  str2polish(q);
  for (j=2;j<=n;j++) matr[n-1][j-2]+=koef2*eval(tacka[j-2]);
  str2polish(r);
  for (j=2;j<=n;j++) matr[n-1][j-2]+=koef1*eval(tacka[j-2]);
} // kolokacija

void najmkvad(int n) // Metoda najmanjih kvadrata
{
  char lfkcij[2000],nxt[2000],niz[2000];
  int  k,j;

  for (j=2;j<=n;j++)
  {
    if (j>2) strcpy(lfkcij,nxt);
    for (k=2;k<=n;k++)
    {
      uzmifkc(k,fkc);uzmifkc1(k,fkc1);uzmifkc2(k,fkc2);
      strcpy(lfkci,"((");
      strcat(lfkci,p);strcat(lfkci,")*(");strcat(lfkci,fkc2);
      strcat(lfkci,")+(");strcat(lfkci,q);strcat(lfkci,")*(");
      strcat(lfkci,fkc1);strcat(lfkci,")+(");strcat(lfkci,r);
      strcat(lfkci,")*(");strcat(lfkci,fkc);strcat(lfkci,"))");

      if ((k==2) && (j==2)) strcpy(lfkcij,lfkci);
	else if (k==(j+1))  strcpy(nxt,lfkci);

      if(str2polish( lfkci))printf(" BAD lfkci!!!!");
      if(str2polish(lfkcij))printf(" BAD lfkciJ!!!");

      strcat(lfkci,"*");
      strcat(lfkci,lfkcij);

      strcpy(src,lfkci);
      uprosti();
      strcpy(lfkci,src);

      if(str2polish(lfkci))printf(" BAD BIG lfkci !!!");

      matr[k-2][j-2]=integr_num(lfkci,EPSILON,eval);
    }
    strcat(lfkcij,"*(");
    strcat(lfkcij,f);
    if (koef2!=0) { sprintf(niz,"%+Lg*(%s)",koef2,q);strcat(lfkcij,niz); }
    if (koef1!=0) { sprintf(niz,"%+Lg*(%s)",koef1,r);strcat(lfkcij,niz); }
    strcat(lfkcij,")");

    matr[n-1][j-2]=integr_num(lfkcij,EPSILON,eval);
  }
} // najmkvad

void nalaz_polinoma(int n)
{
  int k;

  for (k=0;k<=n;k++) pol[k]=0;
  for (k=2;k<=n;k++)
  {
    pol[k  ]+=res[k-2];
    pol[k-1]-=res[k-2]*(a+b);
    pol[k-2]+=res[k-2]*a*b;
  }
  pol[0]-=koef1;
  pol[1]-=koef2;
} // nalaz_polinoma

long double polinom(int n,long double x)
{
  long double vr;
  int i;

  for (vr=0,i=n;i>0;i--) vr=(vr+pol[i])*x;
  return vr+pol[0];
} // polinom

long double racun(long double x)
{
  return powl(fabsl(polinom(n2,x)-eval(x)),(long double)metrika);
} // racun

void graph(int n)
{
  int driver,mode;
  int i,maxx,maxy;
  char pattern[8];
  long double pl,mx,mn;
  long double xc,yc,vr,xstep,ystep;

  driver=DETECT;
  initgraph(&driver,&mode,"");
  setgraphmode(VGAHI);
  if (graphresult()!=grOk)
  {
    printf("\n Greska u inicijalizaciji grafike!");
    getch();
    return ;
  }
  setgraphmode(VGAHI);
  setcolor(WHITE);
  bar(0,0,getmaxx(),getmaxy());
  maxx=getmaxx()-5;
  maxy=getmaxy()-5;
  xstep=(b-a)/(maxx-1);
  mx=mn=polinom(n,a);
  for (vr=a+xstep,i=1;i<maxx;vr+=xstep,i++)
  {
    pl=polinom(n,vr);
    if (pl>mx) mx=pl;
       else if (pl<mn) mn=pl;
  }
  if (t) for (vr=a,i=5;i<maxx-5;vr+=xstep,i++) {
					       pl=eval(vr);
					       if (pl>mx) mx=pl;
						  else if (pl<mn) mn=pl;
					     }
  if (fabsl(mx)<1.0e-6) mx=0;
  if (fabsl(mn)<1.0e-6) mn=0;
  setcolor(RED);
  outtextxy(8,maxy-20,niska);

  setcolor(BLACK);
  sprintf(niska," X:[%Lg,%Lg], Y:[%Lg,%Lg], CRVENO-pribl. ZELENO-tacno CRNO-ose",a,b,mn,mx);
  outtextxy(0,maxy-8,niska);
  ystep=(mx-mn)/(maxy-29);
  if (ystep==0) ystep=1;

  if ((a<=0) && (0<=b))
     { setcolor(BLACK);
       xc=maxx*fabsl(a)/(b-a);  line(xc+5,5,xc+5,maxy-30); } // y osa

  if ((mn<=0) && (0<=mx) && (mn<mx))
     { setcolor(BLACK);
       yc=(maxy-24)*fabsl(mx)/(mx-mn);  line(5,yc-5,maxx-1,yc-5); } // x osa

  for (vr=a,i=5;i<maxx;vr+=xstep,i++)
      putpixel(i,(mx-polinom(n,vr))/ystep,RED); // crtanje pribliznog resenja
  if (t)
  {
   str2polish(tacres);
   for (vr=a,i=5;i<maxx;vr+=xstep,i++)
      putpixel(i,(mx-eval(vr))/ystep,GREEN); // crtanje tacnog resenja
  }

  if((strlen(tx)!=1) || (tx[0]!='1')) goto label;


  if (t && (metrika>=0)) // poredi polinom stepena [2,STEPEN] sa tacres
  {
    getch();
    setcolor(WHITE);
    bar(0,0,getmaxx(),getmaxy());
    setcolor(BLACK);
    switch (metoda)
    {
      case 1:  sprintf(niska,"  Greska: Galerkin       Metrika: %d",metrika);
	       break;
      case 2:  sprintf(niska,"  Greska: Kolokacija     Metrika: %d",metrika);
	       break;
      case 3:  sprintf(niska,"  Greska: Najm.kvad.     Metrika: %d",metrika);
    }
    setcolor(BLUE);
    settextstyle(DEFAULT_FONT,HORIZ_DIR,2);
    outtextxy(10,10,niska);
    settextstyle(DEFAULT_FONT,HORIZ_DIR,1);
    setcolor(BLACK);
    line(5,62,150,62);
    line(38,40,38,108);
    rectangle(5,40,150,108);
    setcolor(GREEN);
    sprintf(niska,"Tacno resenje: %s",tacres);
    settextstyle(DEFAULT_FONT,HORIZ_DIR,2);
    outtextxy(10,maxy-42,niska);
    settextstyle(DEFAULT_FONT,HORIZ_DIR,1);
    setcolor(RED);
    sprintf(niska,"%s"," n   GRESKA");
    outtextxy(10,48,niska);
    setcolor(GREEN);
    sprintf(niska,"%s","  D I M E N Z I J A  ( n ) ");
    setcolor(BLACK);
    settextstyle(DEFAULT_FONT,HORIZ_DIR,1);
    outtextxy(290,395,niska);
    sprintf(niska,"%s","R E L A T I V N A   G R E S K A");
    settextstyle(DEFAULT_FONT,VERT_DIR,1);
    outtextxy(145,120,niska);
    settextstyle(DEFAULT_FONT,HORIZ_DIR,1);

    if (metrika>0)
    {
      for (n2=2;n2<=STEPEN;n2++)   //  !!!!!!
      {
	int k;

	switch (metoda)
	{
	  case 1:  galerkin(n2);
		   break;
	  case 2:  kolokacija(n2);
		   break;
	  case 3:  najmkvad(n2);
	}
	k=resi_sistem(n2-1);
	if (!k)
	{
	  nalaz_polinoma(n2);
	  odstoj[n2-2]=powl(integr_num(tacres,EPSILON,racun),1/(long double)metrika);
	}
	   else odstoj[n2-2]=-1;
      }
    }

       else
       {
	 long double pom;

	 for (n2=2;n2<=STEPEN;n2++)     //  !!!!
	 {
	   int k;

	   switch (metoda)
	   {
	     case 1:  galerkin(n2);
		      break;
	     case 2:  kolokacija(n2);
		      break;
	     case 3:  najmkvad(n2);
	   }
	   k=resi_sistem(n2-1);
	   if (!k)
	   {
	     nalaz_polinoma(n2);
	     str2polish(tacres);
	     for (pl=0,vr=a;vr<=b;vr+=xstep)
	     {
	       pom=fabsl(polinom(n2,vr)-eval(vr));
	       if (pom>pl) pl=pom;
	     }
	     odstoj[n2-2]=pl;
	   }
	     else odstoj[n2-2]=-1;
	 }
       }


    for (n2=2;n2<=STEPEN;n2++)
    {
      sprintf(niska,"%2d   %Lg",n2,odstoj[n2-2]);
      outtextxy(10,40+n2*14,niska);
    }


    pl=odstoj[0];
    for (n2=3;n2<=STEPEN;n2++) if (odstoj[n2-2]>pl) pl=odstoj[n2-2];
    xc=((maxx-150)/(STEPEN-1));
    yc=(pl!=0) ? ((maxy-(24+10))/pl) : 1;
    getfillpattern(pattern);



    for (n2=2;n2<=STEPEN;n2++)
    {
      sprintf(niska,"%2d",n2);
      outtextxy(164+(n2-2)*xc,maxy-95,niska);
      setfillpattern(pattern,(n2 % 2) ? RED : RED);
      if (odstoj[n2-2]>0)
	 bar(150+(n2-2)*xc+8, 25+(30+(int)((pl-odstoj[n2-2])*yc))*.8,
	     149+(n2-1)*xc-8, 25+(maxy-34)*.8);
    }

  }

label:

  getch();
  cleardevice();
  closegraph();
} // graph

main()
{
  int  k,l,ch;
  char niz[50];
  char bb[50];

  init();

  bb[0]='(';
  bb[1]='\0';
  strcat(bb,tx);
  strcat(bb,")*{x^(k-2)*[(x-a)*(x-b)]}\0");
  clrsc();

  do
  {
    clrsc();

    printf     (" Jednacina : ");
    sprintf(jednac,"(%s)*u\"(x)+(%s)*u'(x)+(%s)*u(x)=%s\n",p,q,r,f);
    sprintf(niz," Uslovi    : u(%Lg)=%Lg , u(%Lg)=%Lg",a,c,b,d);
    strcat(jednac,niz);
    printf("%s , a resenje je polinom stepena %d.\n",jednac,n);
    printf("\n Trenutna baza : %s",bb);
    printf(" , k>=2");
    printf("\n Tacno resenje : %s\n",tac?tacres:"[nije uneto...poredjenje ce biti ignorisano...]");

    l=metoda=0;
    while (!metoda && !l)
    {
      ch=menu(&meni1);
      switch (ch)
      {
	case 0  : unos();
		  l=1;
		  break;

	case 1  : do
		   {
		    printf("\n Opsti oblik baze : t(x)*{x^(k-2)*[(x-a)*(x-b)]");
		    printf("\n [Preporucujem *VEOMA* jednostavno t(x) ( konstanta ili eventualno x )");
		    printf("\n zbog ogromnih memorijskih zahteva pri evaluaciji drugog izvoda baze.]");
		    printf("\n Unesite t(x) = ");
		    scanf(" %s",tx);
		    k=str2polish(tx);
		    if(k) printf(" %s",nevalja);
		   } while (k);
		  bb[0]='(';
		  bb[1]='\0';
		  strcat(bb,tx);
		  strcat(bb,")*{x^(k-2)*[(x-a)*(x-b)]}\0");
		  l=1;
		  break;

	case 2  : unosn();
		  l=1;
		  break;

	case 3  : do
		   {
		    printf("\n Tacno resenje je : ");
		    scanf(" %59s",tacres);
		    k=str2polish(tacres);
		    if (k) printf(" %s",nevalja);
		   }
		  while (k);
		  l=1;
		  tac=1;
		  break;

	case 4  : metoda=1;
		  printf("%s",metod[0]);

		  galerkin(n);
		  break;

	case 5  : metoda=2;
		  printf("%s",metod[1]);
		  kolokacija(n);
		  break;

	case 6  : metoda=3;
		  printf("%s",metod[2]);
		  najmkvad(n);
		  break;

	case 7: return 0;
      } // switch
    } // while

    if (l) continue;

    k=resi_sistem(n-1);
    if (k)
    {
      if (k==1) printf("\n Sistem je neodredjen!");
	 else   printf("\n Sistem je protivurecan!");
      getch();  continue;
    }
    sprintf(temp,"\n u(x)=");
    for (k=n;k>=2;k--)
	if (res[k-2]!=0) sprintf(temp,"%+Lg*%s",res[k-2],uzmifkc(k,fkc));
    if (koef2!=0) sprintf(temp,"%+Lg*x",-koef2);
    if (koef1!=0) sprintf(temp,"%+Lg",-koef1);
    nalaz_polinoma(n);
    sprintf(niska,"u(x)=");
    for (k=n;k>=2;k--) if (pol[k]!=0)
		       {
			 sprintf(niz,"%+Lg*x^%d",pol[k],k);
			 strcat(niska,niz);
		       }
    if (pol[1]!=0) { sprintf(niz,"%+Lg*x",pol[1]);  strcat(niska,niz); }
    if (pol[0]!=0) { sprintf(niz,"%+Lg",pol[0]);  strcat(niska,niz); }
    if (strlen(niska)==5)
    { strcat(niska,"0");  if ((koef1==0) && (koef2==0)) putchar('0'); }
	else
    printf("\n %s",niska);
    printf("\n Snimanje rezultata u fajl (D/N) ? ");
    if ((ch=getch())=='D' || ch=='d')
    {
      FILE *dat;
      char datname[127];

      while (1)
      {
	printf("\n Puno ime fajla (ako postoji,dopisace se): ");
	scanf("%127s",datname);
	if ((dat=fopen(datname,"at"))==NULL)
	{
	  printf(" Greska kod imena datoteke!");
	  continue;
	}
	break;
      }
      fprintf(dat," Jednacina je : %s za n=%d%s\n",jednac,n,metod[metoda-1]);
      fprintf(dat,"%s\n\n",niska);
      fclose(dat);
    }
    printf("\n Graficki prikaz (D/N) ? ");
    if ((ch=getch())=='D' || ch=='d')
    {
      t=0;
      printf("\n Poredjenje sa tacnim resenjem (D/N) ? ");
      if (((ch=getch())=='D' || ch=='d') && strlen(tacres))
      {
	t=1;
	printf("\n Metrike su : - d(f,g) = INTEGRAL(a,b,ABS(f-g)^k) ^ (1/k)");
	printf("\n              - d(f,g) = sup(abs(f-g)) na [a,b].\n");
	printf(" (k<0 - ignorisi, k=0 - sup, k>0 konstanta metrike) k = ");
	scanf("%d",&metrika);
      }
      graph(n);
    }
  }
  while (1);
} // main
