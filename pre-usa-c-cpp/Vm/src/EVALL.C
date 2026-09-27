#define MAXPOL 256
static long double konst[50];
static int br_konst=0;
static int poljskaforma[MAXPOL];
static int br_el=0;
static int tmp_br;

typedef long double(*BINFUNC)(long double,long double);
typedef long double(*UNFUNC)(long double);
struct  bin_op
{
	char    ime[8];
	int     asoc;
	BINFUNC bin_f;
} ;
struct  un_op
{
	char    ime[8];
	UNFUNC un_f;
};
struct  func_op
{
	char    ime[8];
	UNFUNC func;
};

int infix2polish(char *,int );

long double plus(long double x,long double y);
long double minus(long double x,long double y);
long double puta(long double x,long double y);
long double deljenje(long double x,long double y);
long double stepen(long double x,long double y);
long double pr_znaka(long double x);
long double plus_znak(long double x);
struct  bin_op lista_bin[]={
	/*        ime,    asocijativnost,  pokazivac na funkciju */
		{ "+",          1,              plus },
		{ "-",          1,              minus},
		{ "*",          1,              puta },
		{ "/",          1,              deljenje},
		{ "^",         -1,              powl },
		{ "",           0,              NULL }
			} ;

struct  un_op   lista_un[]={
		{ "-",          pr_znaka},
		{ "+",          plus_znak},
		{ "",           NULL }
			} ;

struct func_op  list_func[]={
		{ "sin",        sinl },
		{ "cos",        cosl },
		{ "tg",         tanl },
                { "exp",        expl },
		{ "ln",         logl },
		{ "log",        log10l },
		{ "asin",       asinl },
		{ "acos",       acosl },
		{ "atg",        atanl },
		{ "sinh",       sinhl },
		{ "cosh",       coshl },
		{ "tgh",        tanhl },
                { "abs",        fabsl },
                { "sqrt",       sqrtl },
		{ "",           NULL }
		};

long double plus_znak(long double x)
{
  return x;
} /* plus_znak */

long double  pr_znaka(long double x)
{
  return -x;
} /* pr_znaka */

long double plus(long double x,long double y)
{
  return x+y;
} /* plus */

long double minus(long double x,long double y)
{
  return x-y;
} /* minus */

long double puta(long double x,long double y)
{
  return x*y;
} /* puta */

long double deljenje(long double x,long double y)
{
  return x/y;
} /* deljenje */

long double stepen(long double x,long double y)
{
  return powl(x,y);
} /* stepen */

int nadjenbinop(char *infix,int n,int *poz,int *br)
{
  int u_zagradi=0;
  int nadjeno=0;
  int i,j,d;
  char *c;

  c=infix;
  for (j=0;(*(lista_bin [j].ime)!='\0')&&(!nadjeno);j++)
  {
    infix=c;
    u_zagradi=0;
    for (i=0;(i<n)&&(!nadjeno);infix++,i++)
    {
      if (*infix=='(')  u_zagradi++;
      if (*infix==')') u_zagradi--;
      d=strlen (lista_bin [j].ime);
      if ((!u_zagradi)&&(n>i+d)&&(!strncmp(infix,lista_bin[j].ime,d)))
	if ((lista_bin [j].asoc==-1)&&nadjenbinop (infix+1,n-i-1,poz,br)&&(*br==j))
	      return 1;
	   else if (i!=0)
	   {
	     nadjeno=1;
	     *poz=i;
	     *br=j;
	   }
    }
  }
  return nadjeno;
} /* nadjenbinop */

int nadjenunop(char *infix,int n,int *br)
{
  int nadjeno=0;
  int i,d;

  for (i=0;(*(lista_un[i].ime)!='\0')&&(!nadjeno);i++)
  {
    d=strlen (lista_un[i].ime);
    if ((n>d)&&(!strncmp (infix,lista_un[i].ime,d)))
    {
      nadjeno=1;
      *br=i;
    }
  }
  return nadjeno;
} /* nadjenunop */


int nadjenafunc (char *infix,int n,int *br)
{
  int nadjeno=0;
  int i,d;

  for (i=0;(*(list_func[i].ime)!='\0')&&(!nadjeno);i++)
  {
    d=strlen(list_func[i].ime);
    if ((n>d)&&(!strncmp (infix,list_func[i].ime,d))&&(*(infix+d)=='('))
    {
      nadjeno=1;
      *br=i;
    }
  }
  return nadjeno;
}  /* nadjenafunc */

void initpol(void)
{
   tmp_br=br_el;
} /* initpol */

void push(int arg)
{
  if (br_el< MAXPOL-1) poljskaforma[br_el++]=arg;
     else
     {
       printf("\n Prekoracenje duzine poljske forme \n");
       exit(1);
     }
} /* push */

int pop(void)
{
  if (tmp_br>0) return poljskaforma[--tmp_br];
     else return -1;
} /* pop */

int uzagradi(char *infix,int n)
{
  if ((*infix=='(')&&(*(infix+(n-1))==')')) return !infix2polish(infix+1,n-2);
     else return 0;
} /* uzagradi */

int infix2polish(char *infix,int n)
{
  int poz,brop,dop;

  if (n>0)
  {
    if (nadjenbinop(infix,n,&poz,&brop))
    {
      dop=strlen(lista_bin[brop].ime);
      if (infix2polish(infix+poz+dop,n-poz-dop)!=0)  return 1;
      else
      {
	if (infix2polish(infix,poz)!=0)  return 1;
	else
	{
	  push( brop);
	  return 0;
	}
      }
    }
    else if (nadjenunop (infix,n,&brop))
    {
      dop=strlen (lista_un[brop].ime);
      if (infix2polish (infix+dop,n-dop)!=0)  return 1;
      else
      {
	push(brop+50);
	return 0;
      }
    }
    else if (nadjenafunc (infix,n,&brop))
    {
      dop=strlen (list_func[brop].ime);
      if (infix2polish (infix+dop,n-dop))  return 1;
      else
      {
	push(brop+100);
	return 0;
      }
    }
    else if (uzagradi(infix,n)) return 0;
    else if ((*infix=='x')&(n==1))
    {
      push(200);
      return 0;
    }
    else if (( n == 1)&&( *infix < 32))
      {
        push(*infix+149);
        return 0;
      }
    else return 1;
  }
  else  return 1;
} /* infix2polish */

int str2polish(char *infix)
{
  char *c,*tmp;
  int n,sgn;
  long double k,d,e;

  br_el=0;
  br_konst=0;
  n=strlen(infix);
  c=tmp=(char*)malloc((size_t) n);
  while (*infix)
    if ((!isspace(*infix))&&(isascii(*infix)))
       if (isupper(*infix)) *(tmp++)=tolower(*(infix++));
       else *(tmp++)=*(infix++);
    else infix++;
  *tmp='\0';
  infix=tmp=c;
  while(*infix)
     if (isdigit(*infix))
     {
       k=*infix-'0';
       while(isdigit(*++infix)) k=k*10.0+(*infix)-'0';
       if (*infix=='.')
       {
         d=0.1;
	 while (isdigit(*++infix))
	 {
	   k=k+d*(*infix-'0');
	   d=d/10.0;
	 }
	 if (*infix=='e')
	 {
	   infix++;
	   if (*infix == '-')
	   {
	     sgn=-1;
	     infix++;
	   }
	   else if(*infix == '+')
	   {
	     sgn=1;
	     infix++;
	   }
	   else if (!isdigit(*infix))
	   {
	     free(c);
	     return 1;
	   }
	   else sgn=1;
	   if (isdigit(*infix)) e=*infix-'0';
	   else
	   {
	     free(c);
	     return 1;
	   }
	   while (isdigit(*++infix)) e=e*10.0+(*infix)-'0';
	   k*=powl(10.0,sgn*e);
	 }
       }
       else if (*infix=='e')
       {
         infix++;
	 if (*infix == '-')
	 {
	   sgn=-1;
	   infix++;
	 }
	 else if (*infix == '+')
	 {
           sgn=1;
	   infix++;
         }
	 else if (!isdigit(*infix))
	 {
	   free(c);
	   return 1;
	 }
	 else
	 sgn=1;
	 if (isdigit(*infix)) e=*infix-'0';
	    else
            {
	      free(c);
	      return 1;
	    }
	 while (isdigit(*++infix)) e=e*10.0+(*infix)-'0';
	 k*=powl(10.0,sgn*e);
       }
       *(tmp++)=(char)br_konst+1;
       konst[br_konst++] = k;
     }
     else *(tmp++)=*(infix++);
     *tmp='\0';
     if (infix2polish(c,strlen(c)))
     {
       free(c);
       // printf(" syntax error ");
       return 1;
     }
  else
  {
    free(c);
    return 0;
  }
} /* infix2polish */

int val(long double *vr,long double x)
{
  int          c;
  long double  levi,desni;

  if ((c=pop())!=-1)
  {
    if (c<50)
    {
      if (val(&levi,x)) return -1;
      if (val(&desni,x)) return -1;
      *vr=lista_bin[c].bin_f(levi,desni);
      return 0;
    }
    if (c<100)
    {
      if (val(&desni,x)) return -1;
      *vr=lista_un[c-50].un_f(desni);
      return 0;
    }
    if (c<150)
    {
      if (val(&desni,x)) return -1;
      *vr=list_func[c-100].func(desni);
      return 0;
    }
    if (c<200)
    {
      *vr=konst[c-150];
      return 0;
    }
    if (c==200)
    {
      *vr=x;
      return 0;
    }
  }
  return -1;
} /* val */

long double eval(long double x)
{
  long double vr;

  initpol();
  if (val (&vr,x))
  {
    // printf ("\n Pogresna Poljska Forma\n");
    return -1;
  }
     else return vr;
} /* eval */
