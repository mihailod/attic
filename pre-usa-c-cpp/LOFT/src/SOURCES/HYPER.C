/*********************************************************/
/* Uradio student Vuksan Pejovic MR90131 PMF, marta 1995 */
/*********************************************************/
static int           sirina,dubina;
static int           left,up,right,down;
static int           xco,yco,cyco,find_lin;
static int           xcol,ycol;
static struct        text_info txtinfo;
static unsigned char *podaci,*text;
static int           br_lin;        /* Broj linija trenutno u prozoru */
static size_t        brgore,brdole; /* Pokazuju na pocetak prve linije u prozoru */
				    /* i pocetak prve linije ispod prozora. */
static size_t        cur_lin,cur_pos,st_light,end_light;
static int           light,brtxt;
static size_t        dughyp,duzina;
static struct data   {
		       size_t        lang;
		       unsigned char *poc;
	             } *niz;
static struct stek {
		     int         brtxt,xco,yco,cyco,br_lin;
		     size_t      brgore,brdole,cur_lin,cur_pos;
                     unsigned char *prev_win;
		     struct stek *prev;
		   } *SP,*pom;
FILE *fp;

static int printchar(unsigned char ch,int xco,int yco,int sirina)
{                        /* Koordinate su apsolutne!                  */
  unsigned char niz[2];  /* Napisano zbog stampanja char-a u desnom   */
			 /* uglu tekst-prozora bez prelaza u novi red.*/
  if (xco!=sirina) { putch(ch); return 1; }
  gettextinfo(&txtinfo);
  niz[0]=ch;
  niz[1]=txtinfo.attribute;
  xco=txtinfo.winright;
  yco+=txtinfo.wintop-1;
  return puttext(xco,yco,xco,yco,niz);
} /* printchar */

static void okvir(void)
{
  int i;

  window(left,up,right,down);
  gotoxy(1,1);
  putch(201);
  for (i=left+1;i<right;i++) putch(205);
  putch(187);
  gotoxy(1,down-up+1);
  putch(200);
  for (i=left+1;i<right;i++) putch(205);
  printchar(188,1,down-up+1,1);
  for (i=2;i<=down-up;i++)
  {
    gotoxy(1,i);
    putch(186);
    gotoxy(right-left+1,i);
    putch(186);
  }
} /* okvir */

void clr_to_eol(int xco,int yco,int sirina)
{  /* Zbog toga sto DOS-ov clreol() bagira */
  int i;

  for (i=xco;i<=sirina;i++) printchar(' ',i,yco,sirina);
} /* clr_to_eol */

static size_t printscreen(size_t br)
{
  unsigned char c;
  int xcor,ycor,i;

  for (i=1;i<=dubina;i++) printchar(' ',sirina,i,sirina);
  gotoxy(xcor=1,ycor=1);
  while ((c=text[br++])!=0)
  {
    switch (c)
    {
      case 10:  ycor++;
                if (ycor<=dubina) putch(10);
                break;
      case 13:  clr_to_eol(xcor,ycor,sirina);
                xcor=1;
                putch(13);
                break;
      case'\\': if (text[br]=='\\')
                {
                  printchar('\\',xcor++,ycor,sirina);
                  br++;
		  break;
                }
                textcolor(YELLOW);
                for (br+=2;text[br]!='\\';br++)
                    printchar(text[br],xcor++,ycor,sirina);
		br++;
                textcolor(BLACK);
                break;
      default:  printchar(c,xcor++,ycor,sirina);
    } /* switch */
    if (ycor>dubina) break;
  } /* while ((c=text[br++])!=0) */
  if (text[br-1]==0) br--;
  if ((br_lin=ycor-1)<dubina) clr_to_eol(xcor,ycor,sirina);
  for (c=dubina;c>ycor;c--) clr_to_eol(1,c,sirina);
  return br;
} /* printscreen */

static void print_line(int yco,size_t br)
{
  unsigned char ch;
  int           xco;

  gotoxy(xco=1,yco);
  for (;(ch=text[br])!=13;br++)
      if (ch!='\\') printchar(ch,xco++,yco,sirina);
      else if (text[br+1]=='\\')
      {
        printchar(ch,xco++,yco,sirina);
        br++;
      }
      else
      {
        textcolor(YELLOW);
        for (br+=3;text[br]!='\\';br++)
            printchar(text[br],xco++,yco,sirina);
        textcolor(BLACK);
      }
} /* print_line */

static size_t lines_back(int n,size_t br)
{
  int i;

  i=0;
  if (br>1) br-=2;
  while (br && (i<n)) if (text[br--]==10) i++;
  if (br || (i==n)) br+=2;
  else i++;
  find_lin=i;
  return br;
} /* lines_back */

static size_t lines_forth(int n,size_t br)
{
  int i;

  i=0;
  while (text[br] && (i<n)) if (text[br++]==10) i++;
  find_lin=i;
  return br;
} /* lines_forth */

static void poruke(int i)
{
  window(left+1,down-1,left+sirina,down-1);
  textbackground(LIGHTGREEN);
  textcolor(BLACK);
  switch (i)
  {
    case 1:  clrscr();
	     break;
    default: gotoxy(3,1);
	     cprintf("%2d:%-4d ",xco,cyco);
	     if ((SP->prev!=NULL)&&(sirina>29)) cprintf(" DEL Prethodni nivo");
  } /* switch */
  textbackground(WHITE);
  window(left+1,up+1,left+sirina,down-2);
  gotoxy(xco,yco);
} /* poruke */

static int get_len(void)
{
  int i,k,m;
  unsigned char ch;

  for (i=m=0,k=1;(ch=text[cur_lin+i])!=13;i++,k++)
  {
    if (ch=='\\')
       if (text[cur_lin+i+1]=='\\') i++;
       else
       {
         if (m==0) i+=2;
         k--;
         m=!m;
       }
  }
  return (k>sirina) ? sirina : k;
} /* get_len */

static int lighted(void)
{
  int i,k,m;

  unsigned char ch;
  m=0;
  for (i=0,k=xco;i<k;i++)
  {
    ch=text[cur_lin+i];
    if (ch==13) return 0;
    if (ch=='\\')
       if (text[cur_lin+i+1]=='\\') { i++; k++; }
          else
	  {
	    if (m==0) k+=2;
	    k++;
	    m=!m;
	  }
  }
  cur_pos=cur_lin+i-1;
  return m;
} /* lighted */

static void setlight(void)
{
  int xcol2;

  textcolor(YELLOW);
  if (lighted())
  {   /* Osvetljena je rec na kojoj se nalazi kursor */
    size_t i;
    switch (light)
    {
      case 1: if ((st_light<=cur_pos) && (cur_pos<=end_light)) break;
              gotoxy(xcol,ycol);
              for (i=st_light,xcol2=xcol;text[i]!='\\';i++)
                  printchar(text[i],xcol2++,ycol,sirina);
      case 0: st_light=cur_pos;
              while (text[st_light]!='\\') st_light--;
	      st_light+=3;
              xcol=xco-(cur_pos-st_light);
	      ycol=yco;
	      gotoxy(xcol,ycol);
	      textbackground(RED);
              for (i=st_light,xcol2=xcol;text[i]!='\\';i++)
                  printchar(text[i],xcol2++,ycol,sirina);
	      end_light=i-1;
	      light=1;
	      gotoxy(xco,yco);
    } /* switch */
  }
  else if (light)
  {
    size_t i;
    gotoxy(xcol,ycol);
    for (i=st_light,xcol2=xcol;text[i]!='\\';i++)
        printchar(text[i],xcol2++,ycol,sirina);
    gotoxy(xco,yco);
    light=0;
  }
  textcolor(BLACK);
  textbackground(WHITE);
} /* setlight */

static void freeall(int w)
{
  free(podaci);
  free(niz);
  while (SP!=NULL)
  {
    pom=SP;
    if (w) if (SP->prev_win!=NULL) free(SP->prev_win);
    SP=SP->prev;
    free(pom);
  }
} /* freeall */

void def_win(unsigned int n)
{
  text=niz[n].poc;
  duzina=niz[n].lang;
  left=text[-4];
  up=text[-3];
  right=text[-2];
  down=text[-1];
  sirina=right-left-1;
  dubina=down-up-2;
} /* def_win */

int hypertext2(char *hypdat)
{
  unsigned char ch;
  int i;
  unsigned int n;
  void *prev_win;

  if ((fp=fopen(hypdat,"rb"))==NULL) return 1;
  fseek(fp,-2,SEEK_END);
  dughyp=(size_t)ftell(fp);
  if (!dughyp) return 1;
  n=fgetc(fp);
  n+=256*fgetc(fp);
  fseek(fp,0,SEEK_SET);
  podaci=(unsigned char *)malloc(dughyp);
  if (podaci==NULL) return 2;
  for (brgore=0;brgore<dughyp;brgore++) podaci[brgore]=fgetc(fp);
  if (fclose(fp)==EOF) return 1;
  niz=(struct data *)malloc(n*sizeof(struct data));
  if (niz==NULL) return 2;
  for (i=0,duzina=0;i<n;i++)
  {
    size_t br;
    niz[i].poc=podaci+duzina+4;
    br=0;
    while (podaci[duzina++]) br++;
    niz[i].lang=br-4;
  }
  def_win(0);
  SP=(struct stek *)malloc(sizeof(struct stek));
  if (SP==NULL) { free(podaci); return 2; }
  SP->brtxt=brtxt=0;
  SP->prev=NULL;
  SP->prev_win=NULL;
  xco=yco=cyco=1;
  textcolor(BLACK);
  textbackground(WHITE);
  okvir();
  window(left+1,down-1,right-1,down-1);
  poruke(1);
  poruke(0);
  textbackground(WHITE);
  window(left+1,up+1,right-1,down-2);
  clrscr();
  brgore=cur_lin=0;
  brdole=printscreen(brgore);
  gotoxy(xco,yco);
  do
  {
    setlight();
    ch=getch();
    if (ch==0)
    switch (ch=getch())
    {
      case 72:  if (yco>1)     /* Kursor gore */
		{
		  gotoxy(xco,--yco);
		  cur_lin=lines_back(1,cur_lin);
		  cyco--;
		  poruke(0);
		}
		   else if (brgore)
			{
			  insline();
			  brgore=lines_back(1,brgore);
			  print_line(yco,brgore);
			  if (br_lin<dubina) br_lin++;
			  else brdole=lines_back(1,brdole);
			  cur_lin=lines_back(1,cur_lin);
			  if (light) ycol++;
			  cyco--;
			  poruke(0);
			  gotoxy(xco,yco);
			}
		break;
      case 80:  if ((yco<dubina) && (yco<br_lin)) /* Kursor dole */
		{
		  gotoxy(xco,++yco);
		  cur_lin=lines_forth(1,cur_lin);
		  cyco++;
		  poruke(0);
		}
		   else if ((yco==dubina) && (brdole<duzina))
			{
			  gotoxy(1,1);
			  delline();
			  print_line(yco,brdole);
			  brdole=lines_forth(1,brdole);
			  brgore=lines_forth(1,brgore);
			  cur_lin=lines_forth(1,cur_lin);
			  if (light) ycol--;
			  cyco++;
			  poruke(0);
			  gotoxy(xco,yco);
			}
		break;
      case 75:  if (xco>1)      /* Kursor levo */
		{
		  gotoxy(--xco,yco);
		  poruke(0);
		}
		break;
      case 71:  gotoxy(xco=1,yco); /* Pritisnut je HOME */
                poruke(0);
                break;
      case 79:  gotoxy(xco=get_len(),yco); /* Pritisnut je END */
                poruke(0);
                break;
      case 77:  if (xco<sirina) /* Kursor desno */
		{
		  gotoxy(++xco,yco);
		  poruke(0);
		}
		break;
      case 73:  if (brgore)     /* Page Up */
		{
		  brgore=lines_back(dubina,brgore);
		  cyco-=find_lin;
		  cur_lin=lines_back(find_lin,cur_lin);
		  brdole=printscreen(brgore);
		  if (light) poruke(1);
		  light=0;
		}
		   else { cur_lin=0; cyco=yco=1; }
		poruke(0);
		gotoxy(xco,yco);
		break;
      case 81:  if (brdole>=duzina)     /* Page Down */
		   {
		     cyco+=br_lin-yco;
		     cur_lin=lines_forth(br_lin-yco,cur_lin);
		     gotoxy(xco,yco=br_lin);
		   }
		   else
		   {
		     brgore=brdole;
		     brdole=printscreen(brdole);
		     if (yco<=br_lin)
		     {
		       cyco+=dubina;
		       cur_lin=lines_forth(dubina,cur_lin);
		     }
		     else
		     {
		       cyco+=dubina-yco+br_lin;
		       cur_lin=lines_forth(dubina-yco+br_lin,cur_lin);
		       yco=br_lin;
		     }
		     gotoxy(xco,yco);
		     if (light) poruke(1);
		     light=0;
		   }
		poruke(0);
		break;
      case 83:  if ((pom=SP->prev)==NULL) break; /* Pritisnut je DELETE */
                puttext(left,up,right,down,SP->prev_win);
                free(SP->prev_win);
                def_win(brtxt=pom->brtxt);
		free(SP);
		SP=pom;
		xco=pom->xco;
		yco=pom->yco;
		cyco=pom->cyco;
		br_lin=pom->br_lin;
		brgore=pom->brgore;
                brdole=pom->brdole;
		cur_lin=pom->cur_lin;
		cur_pos=pom->cur_pos;
		light=0;
                window(left+1,up+1,right-1,down-2);
    } /* switch */
       else if ((ch==13) && light)
	    {               /* Pritisnut je ENTER */
	      unsigned int n1;
	      /* st_light-2 pokazuje na dva bajta sa podacima o tekstu.*/
	      pom=(struct stek *)malloc(sizeof(struct stek));
	      if (pom==NULL) { freeall(1); return 2; }
	      n1=(text[st_light-2]&127)+(((unsigned int)text[st_light-1]&127)<<7)-1;
              def_win(n1);
              prev_win=malloc((right-left+1)*(down-up+1)*2);
              if (prev_win==NULL) { freeall(1); return 2; }
	      gettext(left,up,right,down,prev_win);
	      SP->xco=xco;
	      SP->yco=yco;
	      SP->cyco=cyco;
	      SP->br_lin=br_lin;
	      SP->brgore=brgore;
              SP->brdole=brdole;
	      SP->cur_lin=cur_lin;
	      SP->cur_pos=cur_pos;
	      pom->brtxt=brtxt=n1;
              pom->prev_win=prev_win;
	      pom->prev=SP;
	      SP=pom;
	      light=0;
              okvir();
	      poruke(1);
              window(left+1,up+1,right-1,down-2);
	      brdole=printscreen(brgore=cur_lin=0);
	      gotoxy(xco=1,yco=cyco=1);
	      poruke(0);
	    }
            else if (ch==9)
                 {
                   gotoxy(xco=((xco+8)>sirina) ? sirina : xco+8,yco);
                   poruke(0);
                 }
  } while (ch!=27); /* Dok se ne pritisne ESC */
  freeall(1);
  return 0;
} /* hypertext2 */
