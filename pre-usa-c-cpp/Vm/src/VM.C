/*
    MATEMATICKI FAKULTET BEOGRAD

	 - Seminarski rad -

    TEMA     : Varijacione metode

    PREDMET  : Numericke metode
    PROFESOR : Desa Radunovic

    URADIO   : Mihailo Despotovic MR9031
*/

#include <math.h>
#include <graphics.h>

#include "c:\other\pmf\nm\menu.c"
#include "c:\other\pmf\nm\evall.c"

#define STEPEN 8
#define EPSILON 0.00001

meni_strukt meni1={ 9,0,17,11,
		    BLACK,RED,WHITE,GREEN,BLACK,
		    0,1,
		    {
		     "\1J\1 ....... Unos/Promena parametara jednacine",
		     "\1M\1 ................. Rad sa malim parametrom",
		     "\1S\1 .................. Promena stepena resenja",
		     "\1T\1 ..... Unos/Promena/Brisanje tacnog resenja",
		     "\2\1F1\1 ........................ Metoda Galerkina",
		     "\1F2\1 ....................... Metoda kolokacije",
		     "\1F3\1 ............... Metoda najmanjih kvadrata",
		     "\2\1P\1 ....................... Load/Save podataka",
		     "\2\1END\1 .............................. I z l a z"
		    },
		    { 'J','M','S','T',256*59,256*60,256*61,'P',256*79 }
		  };

int         n,metoda,n2,t,metrika,tac;

long double a,b,c,d,matr[STEPEN][STEPEN-1],res[STEPEN-1];
long double aa,bb;
long double koef1,koef2;
long double pol[STEPEN+1],odstoj[STEPEN-1];

char        nevalja[]="Sintaksna greska u izrazu!";
char        *metod[]={ "\n Resenje metodom Galerkina : ",
		       "\n Resenje metodom kolokacije : ",
		       "\n Resenje metodom najmanjih kvadrata : " };
char        p[40],q[40],r[40],f[40],fkc[100],fkc1[100],fkc2[100],jednac[120];
char        lfkci[256],niska[STEPEN*14],tacres[60],tacres1[60];
char *temp;


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
   printf("\n STEPEN polinoma za resenje (2 <= n <= %d) : ",STEPEN);
   scanf("%d",&n);
   if ((n<2) || (STEPEN<n)) printf("Pogresno n\n");
  }
 while ((n<2) || (STEPEN<n));
} // unosn

void init(void)
{
 sprintf(p,"1");
 sprintf(q,"2");
 sprintf(r,"3");
 sprintf(f,"0");
 a=0;
 b=1;
 c=0;
 d=1;
 koef2=(c-d)/(b-a);
 koef1=-c-koef2*a;
 n=2;
 strcpy(tacres,"@\0");
}

void unos(void)
{
 int gr,taster;
 char niz[80];
 aa=a;bb=b;

lab:
 do
  {
   clrsc();
   printf(" Opsti oblik : p(x)*u\"(x) + q(x)*u'(x) + r(x)*u(x) = f(x)\n");
   printf(" Trenutno    : ");
   sprintf(jednac,"(%s)*u\"(x)+(%s)*u'(x)+(%s)*u(x)=%s\n",p,q,r,f);
   sprintf(niz," Uslovi      : u(%Lg)=%Lg , u(%Lg)=%Lg",a,c,b,d);
   strcat(jednac,niz);
   printf("%s , resenje je polinom stepena %d.\n",jednac,n);
   printf("\n Baza prostora : (x^(k-2))*[(x-a)*(x-b)], k>=2\n");
   printf(  " Tacno resenje : %s\n",tac?tacres:"[nije uneto...poredjenje ce biti ignorisano...]");
   printf("\n");
   printf(" Sta hocete da menjate ? \n\n");
   printf("   U jednacini : [p] [q] [r] [f] ( pogledajte opsti oblik )\n");
   printf("   U uslovima  : [a] [b] [c] [d] ( u(a)=c , u(b)=d , a<b  )\n");
   printf("   K r a j     : [K]\n\n");
   printf(" Pritisnite neki od tastera...\n");

   taster=getch();
   switch(taster)
     {
      case 'p':
      case 'P': do
		 {
		  gr=0;
		  printf("\n p(x) : ");
		  scanf("%39s",p);
		  if(str2polish(p))
		   {
		     printf("%s",nevalja);
		     gr=1;
		     getch();
		     continue;
		   }
		 }
		while(gr==1);
		break;

      case 'q':
      case 'Q': do
		 {
		  gr=0;
		  printf("\n q(x) : ");
		  scanf("%39s",q);
		  if(str2polish(q))
		   {
		     printf("%s",nevalja);
		     gr=1;
		     getch();
		     continue;
		   }
		 }
		while(gr==1);
		break;

      case 'r':
      case 'R': do
		 {
		  gr=0;
		  printf("\n r(x) : ");
		  scanf("%39s",r);
		  if(str2polish(r))
		   {
		     printf("%s",nevalja);
		     gr=1;
		     getch();
		     continue;
		   }
		 }
		while(gr==1);
		break;

      case 'f':
      case 'F': do
		 {
		  gr=0;
		  printf("\n f(x) : ");
		  scanf("%39s",f);
		  if(str2polish(f))
		   {
		     printf("%s",nevalja);
		     gr=1;
		     getch();
		     continue;
		   }
		 }
		while(gr==1);
		break;

      case 'a':
      case 'A': {
		 printf("\n a = ");
		 scanf("%Lg",&aa);
		 break;
		}

      case 'b':
      case 'B': {
		 printf("\n b = ");
		 scanf("%Lg",&bb);
		 break;
		}

      case 'c':
      case 'C': {
		 printf("\n c = ");
		 scanf("%Lg",&c);
		 break;
		}

      case 'd':
      case 'D': {
		 printf("\n d = ");
		 scanf("%Lg",&d);
		 break;
		}

      case 'k':
      case 'K': break;
     }// switch
  }// do
 while(taster!='k'&&taster!='K');

 if (!(aa<bb)) { printf("\n Mora biti a<b !"); getch(); goto lab;}
 a=aa;b=bb;
 koef2=(c-d)/(b-a);
 koef1=-c-koef2*a;
} // unos

void mali(void)
 {
  int gr;

  tac=1;
  strcpy(q,"1\0");
  strcpy(r,"0\0");
  strcpy(f,"0\0");
  a=0;b=1;c=0;d=1;
  printf("\n");
  printf(" Jednacina: au\"+u'=0   Uslovi: u(0)=0,u(1)=1\n");
  printf(" Tacno res: (1-2.718^(-x/a))/(1-2.718^(-1/a))\n\n");
  do
   {
    gr=0;
    printf(" Mali parametar a iznosi : "); scanf("%39s",p);
    if(str2polish(p)) {printf("%s",nevalja);gr=1;getch();continue;}
   }
  while(gr==1);
  strcpy(tacres,"(1-2.718^(-x/(");
  strcat(tacres,p);
  strcat(tacres,")))/(1-2.718^(-1/(");
  strcat(tacres,p);
  strcat(tacres,")))\0");
  koef2=(c-d)/(b-a);
  koef1=-c-koef2*a;
 }// mali

void opcije(void)
 {
  int i,taster;
  char fajl[16],medju[40];
  FILE* dat;

  printf("\n");
  printf(" Pritisnite: [L]oad [S]ave [N]ista ... ?\n\n");
  taster=getch();
  switch (taster)
   {
    case 'n':
    case 'N': return;

    case 'L':
    case 'l': {
	       printf(" LOAD : Ime fajla sa podacima ? ");
	       scanf("%15s",fajl);
	       if((dat=fopen(fajl,"r"))==NULL)
		{
		 printf("\n Nema takvog fajla u tekucem direktorijumu!");
		 getch();
		 return;
		}
	       fgets(p,39,dat);
	       for(i=0;i<=39;i++) {if(p[i]=='\n') {p[i]='\0';break;}}
	       fgets(q,39,dat);
	       for(i=0;i<=39;i++) {if(q[i]=='\n') {q[i]='\0';break;}}
	       fgets(r,39,dat);
	       for(i=0;i<=39;i++) {if(r[i]=='\n') {r[i]='\0';break;}}
	       fgets(f,39,dat);
	       for(i=0;i<=39;i++) {if(f[i]=='\n') {f[i]='\0';break;}}
	       fgets(tacres,59,dat);
	       for(i=0;i<=39;i++) {if(tacres[i]=='\n') {tacres[i]='\0';break;}}
	       if(tacres[0]!='@') tac=1;
		else tac=0;

	       fgets(medju,39,dat);
	       a=_atold(medju);
	       fgets(medju,39,dat);
	       b=_atold(medju);
	       fgets(medju,39,dat);
	       c=_atold(medju);
	       fgets(medju,39,dat);
	       d=_atold(medju);

	       fclose(dat);
	       return;
	      }

    case 's':
    case 'S': {
	       printf(" SAVE : Ime fajla sa podacima ? ");
	       scanf("%15s",fajl);
	       if((dat=fopen(fajl,"w"))==NULL)
		{
		 printf("\n Greska! Ne mogu da ovorim fajl!");
		 getch();
		 return;
		}
	       fputs(p,dat);
	       fputs("\n",dat);
	       fputs(q,dat);
	       fputs("\n",dat);
	       fputs(r,dat);
	       fputs("\n",dat);
	       fputs(f,dat);
	       fputs("\n",dat);
	       fputs(tacres,dat);
	       fputs("\n",dat);
	       sprintf(medju,"%f",(float)a);
	       fputs(medju,dat);
	       fputs("\n",dat);
	       sprintf(medju,"%f",(float)b);
	       fputs(medju,dat);
	       fputs("\n",dat);
	       sprintf(medju,"%f",(float)c);
	       fputs(medju,dat);
	       fputs("\n",dat);
	       sprintf(medju,"%f",(float)d);
	       fputs(medju,dat);
	       fputs("\n",dat);
	       fclose(dat);
	       return;
	      }

    default : return;
   }
 }// opcije

long double integr_smps(unsigned long m,long double (*funkcija)(long double))
{
 long double h,s; // integrisi (numericki) f na [a,b]
 unsigned long i; // Simpsonom (ima 2m podsegmenata)

 s=(*funkcija)(a)+(*funkcija)(b);
 h=(b-a)/(2*m);
 for (i=1;i<=m  ;i++) s+=4*(*funkcija)(a+(2*i-1)*h);
 for (i=1;i<=m-1;i++) s+=2*(*funkcija)(a+2*i*h);
 return s/3*h;
} // integr_smps

long double integr_num(char *f,long double eps,long double (*funkcija)(long double))
{
 unsigned long m;     // integraljenje (numericki)
 long double s1,s2,r; // tacnost je eps (Runge)
 int br_it;

 br_it=0;
 m=1;
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
{                      // matr[X][Y] X kolona, Y vrsta.
 int i,j,k,m;          // resi sistem linearnih jednacina dimenzije n^2
 long double a,b;

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
   if (b==0) if (a==0) return 1; // Neodredjen
		  else return 2; // Protivurecan
       else
       {
	res[j]=a/b;
	if (fabsl(res[j])<1.0e-10) res[j]=0;
       }
  }
 return 0;
} // resi_sistem

char *uzmifkc(int k,char *fkc)
{               // Nalazi bazni polinom fi(k)=x^(k-2)*(x*x-(a+b)*x+a*b)
  char niz[30]; // za k>=2 u simbolickom obliku.

  fkc[0]='\0';
  switch (k-2)
  {
    case 0:   break;
    case 1:   strcpy(fkc,"x*");
	      break;
    case 2:   strcpy(fkc,"x*x*");
	      break;
    default:  sprintf(fkc,"x^%d*",k-2);
  } // switch
  strcat(fkc,"(x*x");
  if ((a+b)!=0) if (fabsl(a+b)==1) if (-(a+b)>0) strcat(fkc,"+x");
				      else       strcat(fkc,"-x");
		   else { sprintf(niz,"%+Lg*x",-(a+b)); strcat(fkc,niz); }
  if ((a*b)!=0) { sprintf(niz,"%+Lg",a*b); strcat(fkc,niz); }
  strcat(fkc,")");
  return fkc;
} // uzmifkc

char *uzmifkc1(int k,char *fkc) // Nalazi prvi izvod baznog polinoma fi(k)
{                               // za k>=2 u simbolickom obliku.
  char niz[30];
  long double koef;

  switch (k)
  {
    case 2:   strcpy(fkc,"(2*x");
	      break;
    case 3:   strcpy(fkc,"(3*x*x");
	      break;
    default:  sprintf(fkc,"(%d*x^%d",k,k-1);
  }
  if ((koef=-(k-1)*(a+b))!=0)
  {
    sprintf(niz,"%+Lg",koef);
    if (k==2) strcat(fkc,niz);
       else
       {
	 if (koef==1) strcat(fkc,"+");
	    else if (koef==-1) strcat(fkc,"-");
		    else { strcat(fkc,niz);  strcat(fkc,"*"); }
	 switch (k)
	 {
	   case 3:   strcat(fkc,"x");
		     break;
	   case 4:   strcat(fkc,"x*x");
		     break;
	   default:  sprintf(niz,"x^%d",k-2);
		     strcat(fkc,niz);
	 } // switch
     }
  }
  if (((koef=(k-2)*a*b)!=0) && (k>2))
  {
    sprintf(niz,"%+Lg",koef);
    if (k==3) strcat(fkc,niz);
       else
       {
	 if (koef==1) strcat(fkc,"+");
	    else if (koef==-1) strcat(fkc,"-");
		    else { strcat(fkc,niz);  strcat(fkc,"*"); }
	 switch (k)
	 {
	   case 4:   strcat(fkc,"x");
		     break;
	   case 5:   strcat(fkc,"x*x");
		     break;
	   default:  sprintf(niz,"x^%d",k-3);
		     strcat(fkc,niz);
	 }
       }
  }
  strcat(fkc,")");
  return fkc;
} // uzmifkc1

char *uzmifkc2(int k,char *fkc) // Nalazi drugi izvod baznog polinoma fi(k)
{                               // za k>=2 u simbolickom obliku.
  char niz[30];
  long double koef;

  switch (k)
  {
    case 2:   return strcpy(fkc,"2");
    case 3:   strcpy(fkc,"(6*x");
	      break;
    case 4:   strcpy(fkc,"(12*x*x");
	      break;
    default:  sprintf(fkc,"(%d*x^%d",k*(k-1),k-2);
  }
  if ((koef=-(k-1)*(k-2)*(a+b))!=0)
  {
    sprintf(niz,"%+Lg",koef);
    if (k==3) strcat(fkc,niz);
       else
       {
	 if (koef==1) strcat(fkc,"+");
	    else if (koef==-1) strcat(fkc,"-");
		    else { strcat(fkc,niz);  strcat(fkc,"*"); }
			switch (k)
			{
			  case 4:   strcat(fkc,"x");
				    break;
			  case 5:   strcat(fkc,"x*x");
				    break;
			  default:  sprintf(niz,"x^%d",k-3);
				    strcat(fkc,niz);
			}
		 }
  }
  if (((koef=(k-2)*(k-3)*a*b)!=0) && (k>3))
  {
    sprintf(niz,"%+Lg",koef);
    if (k==4) strcat(fkc,niz);
       else
       {
	 if (koef==1) strcat(fkc,"+");
	    else if (koef==-1) strcat(fkc,"-");
		    else { strcat(fkc,niz);  strcat(fkc,"*"); }
	 switch (k)
	 {
	   case 5:   strcat(fkc,"x");
		     break;
	   case 6:   strcat(fkc,"x*x");
		     break;
	   default:  sprintf(niz,"x^%d",k-4);
		     strcat(fkc,niz);
	 }
       }
  }
  strcat(fkc,")");
  return fkc;
} // uzmifkc2

void galerkin(int n) // Galerkinova metoda
{
  char fkcij[140],niz[40];
  int  k,j;

  for (j=2;j<=n;j++)
  {
    uzmifkc(j,fkcij);
    for (k=2;k<=n;k++)
    {
      uzmifkc(k,fkc);uzmifkc1(k,fkc1);uzmifkc2(k,fkc2);strcpy(lfkci,"((");
      strcat(lfkci,p);strcat(lfkci,")*");strcat(lfkci,fkc2);strcat(lfkci,"+(");
      strcat(lfkci,q);strcat(lfkci,")*");strcat(lfkci,fkc1);strcat(lfkci,"+(");
      strcat(lfkci,r);strcat(lfkci,")*");strcat(lfkci,fkc);strcat(lfkci,")*");
      strcat(lfkci,fkcij);
      matr[k-2][j-2]=integr_num(lfkci,EPSILON,eval);
    }
    strcpy(lfkci,"(");
    strcat(lfkci,f);
    if (koef2!=0) { sprintf(niz,"%+Lg*(%s)",koef2,q); strcat(lfkci,niz); }
    if (koef1!=0) { sprintf(niz,"%+Lg*(%s)",koef1,r); strcat(lfkci,niz); }
    strcat(lfkci,")*");
    strcat(lfkci,fkcij);
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
    strcpy(lfkci,"(");strcat(lfkci,p);strcat(lfkci,")*");
    strcat(lfkci,fkc2);strcat(lfkci,"+(");strcat(lfkci,q);
    strcat(lfkci,")*");strcat(lfkci,fkc1);strcat(lfkci,"+(");
    strcat(lfkci,r);strcat(lfkci,")*");strcat(lfkci,fkc);str2polish(lfkci);
    for (j=2;j<=n;j++) matr[k-2][j-2]=eval(tacka[j-2]);
  }
  str2polish(f);
  for (j=2;j<=n;j++) matr[n-1][j-2]=eval(tacka[j-2]);
  str2polish(q);
  for (j=2;j<=n;j++) matr[n-1][j-2]+=koef2*eval(tacka[j-2]);
  str2polish(r);
  for (j=2;j<=n;j++) matr[n-1][j-2]+=koef1*eval(tacka[j-2]);
} // kolokacija

void najm_kvad(int n) // Metoda najmanjih kvadrata
{
  char lfkcij[256],nxt[200],niz[30];
  int  k,j;

  for (j=2;j<=n;j++)
  {
    if (j>2) strcpy(lfkcij,nxt);
    for (k=2;k<=n;k++)
    {
      uzmifkc(k,fkc);uzmifkc1(k,fkc1);uzmifkc2(k,fkc2);strcpy(lfkci,"((");
      strcat(lfkci,p);strcat(lfkci,")*");strcat(lfkci,fkc2);
      strcat(lfkci,"+(");strcat(lfkci,q);strcat(lfkci,")*");
      strcat(lfkci,fkc1);strcat(lfkci,"+(");strcat(lfkci,r);
      strcat(lfkci,")*");strcat(lfkci,fkc);strcat(lfkci,")");

      if ((k==2) && (j==2)) strcpy(lfkcij,lfkci);
	 else if (k==(j+1)) strcpy(nxt,lfkci);

      strcat(lfkci,"*");
      strcat(lfkci,lfkcij);

      matr[k-2][j-2]=integr_num(lfkci,EPSILON,eval);
    }
    strcat(lfkcij,"*(");
    strcat(lfkcij,f);
    if (koef2!=0) { sprintf(niz,"%+Lg*(%s)",koef2,q); strcat(lfkcij,niz); }
    if (koef1!=0) { sprintf(niz,"%+Lg*(%s)",koef1,r); strcat(lfkcij,niz); }
    strcat(lfkcij,")");
    matr[n-1][j-2]=integr_num(lfkcij,EPSILON,eval);
  }
} // najm_kvad

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
  int i,maxx,maxy,pomerajy,ips;
  char pattern[8];
  long double pl,mx,mn;
  long double xc,yc,vr,xstep,ystep;

  driver=DETECT;
  initgraph(&driver,&mode,"");
  setgraphmode(VGAHI);
  if (graphresult()!=grOk)
   {
    printf("\n Greska u inicijalizaciji grafike! (Proverite EGAVGA.BGI fajl!)");
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
      putpixel(i,10+.95*((mx-polinom(n,vr))/ystep),RED); // crtanje pribliznog resenja

  if (t)
  {
   str2polish(tacres);
   for (vr=a,i=5;i<maxx;vr+=xstep,i++)
      putpixel(i,10+.95*((mx-eval(vr))/ystep),GREEN); // crtanje tacnog resenja
  }
  if (t && (metrika>=0)) // Poredi polinome stepena [2,STEPEN] sa tacres
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
    if (metrika)
    {
      for (n2=2;n2<=STEPEN;n2++)
      {
	int k;

	switch (metoda)
	{
	 case 1:  galerkin(n2);
		  break;
	 case 2:  kolokacija(n2);
		  break;
	 case 3:  najm_kvad(n2);
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

	 for (n2=2;n2<=STEPEN;n2++)
	 {
	   int k;

	   switch (metoda)
	   {
	    case 1:  galerkin(n2);
		     break;
	    case 2:  kolokacija(n2);
		     break;
	    case 3:  najm_kvad(n2);
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
    sprintf(niska,"%s"," n   GRESKA");
    outtextxy(10,50,niska);
    for (n2=2;n2<=STEPEN;n2++)
    {
     sprintf(niska,"%2d %Lg",n2,odstoj[n2-2]);
     outtextxy(10,40+n2*14,niska);
    }
    line(5,62,130,62);
    line(30,40,30,165);
    rectangle(5,40,130,165);
    setcolor(GREEN);
    sprintf(niska,"Tacno resenje: %s",tacres);
    settextstyle(DEFAULT_FONT,HORIZ_DIR,1);
    outtextxy(10,maxy-28,niska);
    settextstyle(DEFAULT_FONT,HORIZ_DIR,1);
    setcolor(RED);

    for(n2=3;n2<=STEPEN;n2++)
     {
      if(odstoj[n2-2]>10) odstoj[n2-2]=10; // zbog razmere
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

	 pomerajy=30+(int)((pl-odstoj[n2-2])*yc);
	 ips=25+pomerajy*.8;

	 if(ips>377) { ips-=(ips-377);ips*=10; }
	 if(ips>377) { ips-=(ips-377); }

	 bar(150+(n2-2)*xc+8, ips,
	     149+(n2-1)*xc-8, 25+(maxy-34)*.8);
    }
    sprintf(niska,"%s","  D I M E N Z I J A  ( n ) ");
    setcolor(BLACK);
    settextstyle(DEFAULT_FONT,HORIZ_DIR,1);
    outtextxy(290,400,niska);
    sprintf(niska,"%s","R E L A T I V N A   G R E S K A");
    settextstyle(DEFAULT_FONT,VERT_DIR,1);
    outtextxy(145,80,niska);
    settextstyle(DEFAULT_FONT,HORIZ_DIR,1);
  }
  getch();
  cleardevice();
  closegraph();
} // graph


int main(void)
{
  int  k,l,ch;
  char niz[50];

  init();
  clrsc();

  do
  {

    clrsc();
    printf(" Opsti oblik : p(x)*u\"(x) + q(x)*u'(x) + r(x)*u(x) = f(x)\n");
    printf(" Trenutno    : ");
    sprintf(jednac,"(%s)*u\"(x)+(%s)*u'(x)+(%s)*u(x)=%s\n",p,q,r,f);
    sprintf(niz," Uslovi      : u(%Lg)=%Lg , u(%Lg)=%Lg",a,c,b,d);
    strcat(jednac,niz);
    printf("%s , resenje je polinom stepena %d.\n",jednac,n);
    printf("\n Baza prostora : (x^(k-2))*[(x-a)*(x-b)], k>=2\n");
    printf(  " Tacno resenje : %s\n",tac?tacres:"[nije uneto...poredjenje ce biti ignorisano...]");

    l=metoda=0;
    while (!metoda && !l)
    {
      ch=menu(&meni1);
      switch (ch)
      {
	case 0  : unos();
		  l=1;
		  break;

	case 1  : mali();
		  l=1;
		  break;

	case 2  : unosn();
		  l=1;
		  break;

	case 3  :
		   {
		    printf("\n Tacno resenje (N-nedefinisano Q-staro): ");
		    strcpy(tacres1,tacres);
		    scanf(" %59s",tacres1);
		    if(tacres1[0]=='q'||tacres1[0]=='Q')
		     {
		      l=1;
		      break;
		     }
		    if(tacres1[0]=='n'||tacres1[0]=='N')
		     {
		      tac=0;
		      strcpy(tacres,"@\0");
		      l=1;
		      break;
		     }
		    else
		     {
		      k=str2polish(tacres1);
		      if (k) {tac=0;printf(" %s",nevalja);l=1;break;}
		      else {strcpy(tacres,tacres1);l=1;tac=1;break;}
		     }
		    }

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
		  najm_kvad(n);
		  break;

	case 7  : l=1;
		  opcije();
		  break;

	case 8  : textbackground(BLACK);
		  textcolor(WHITE);
		  _setcursortype(_NORMALCURSOR);
		  clrscr();
		  exit(0);
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
      if(tac==1)
      {
      printf("\n Poredjenje sa tacnim resenjem (D/N) ? ");
      if (((ch=getch())=='D' || ch=='d') && strlen(tacres))
      {
	t=1;
	printf("\n Metrike su : - d(f,g) = INTEGRAL(a,b,ABS(f-g)^k) ^ (1/k)");
	printf("\n              - d(f,g) = sup(abs(f-g)) na [a,b].\n");
	printf(" (k<0 - ignorisi, k=0 - sup, k>0 konstanta metrike) k = ");
	scanf("%d",&metrika);
      }
      }
      graph(n);
    }
  }
  while (1);
} // main
