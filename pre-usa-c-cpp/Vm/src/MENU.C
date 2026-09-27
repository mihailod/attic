#include <stdio.h>
#include <conio.h>
#include <string.h>
#include <stdlib.h>
#include <ctype.h>

#define MAX_STAVKI 10
#define CUR_UP   256*72
#define CUR_DOWN 256*80
#define ENTER    13
#define ESC      27

typedef struct {
                 int  broj_stavki; /* Broj stavki u meniju */
                 int  poc_stavka;  /* Redni broj pocetne stavke pocev od 0 */
                 int  xpos,ypos;   /* Pozicija gornjeg levog ugla menija */
                 int  pred_farba1,pred_farba2,
                      poz_farba,ozn_farba,okvir_farba;
                                   /* Kolori za meni */
                 int  esc_efekt;   /* Ako je razlicit od 0 pritiskom na ESC
                                      se napusta meni i vraca -1 */
                 int  enter_efekt; /* Ako je 0 opcija se bira samo pritiskom
                                      na odgovarajuci taster */
                 char *stavke[MAX_STAVKI];
                 unsigned int taster[MAX_STAVKI];
                 /* Kodovi tastature u obliku 0+256*<kod tastera>
                    ili ASCII vrednost karaktera (ne koristiti mala slova)
                    za izbor opcija direktno */
               } meni_strukt;
static struct text_info pt;

static void stampanje(meni_strukt *meni,char *s,int mx)
{
  int swap,br=0;
  char ch;

  textcolor(meni->pred_farba1);
  swap=1;
  putch(' ');
  while ((ch=*(s++))!=0)
  switch (ch)
  {
    case '\1':  textcolor(((swap=!swap)!=0) ? meni->pred_farba1 : meni->pred_farba2);
                break;
    case '\2':  break;
    default:    putch(ch);
                br++;
  } /* switch */
  while (br++<=mx) putch(' ');
} /* stampanje */

static void kraj(void)
{
  window(pt.winleft,pt.wintop,pt.winright,pt.winbottom);
  textattr(pt.attribute);
  gotoxy(pt.curx,pt.cury);
} /* kraj */

int menu(meni_strukt *meni)
/* Vraca broj linije ( od 0 do br-1 ), -1 ako je pritisnut ESC
ili -2 ako je doslo do greske (nema dovoljno memorije ili meni ne moze da
stane na ekran na tom mestu */
{
  int           i,j,br,dubina;
  char          **p,*s;
  int           xpos,ypos,xpos2,ypos2,tek_pos;
  int           poz_farba,ozn_farba;
  int           tekuci,esc_efekt;
  unsigned int  *tasteri;
  int           mx,tmp;
  unsigned int  ch;
  void          *pozadina;
  char          niz[4];

  _setcursortype(_NOCURSOR);
  gettextinfo(&pt);
  xpos=meni->xpos;
  ypos=meni->ypos;
  if (meni->enter_efekt) ozn_farba=meni->ozn_farba;
  else ozn_farba=meni->poz_farba;
  br=meni->broj_stavki;
  esc_efekt=meni->esc_efekt;
  p=meni->stavke;
  tasteri=meni->taster;
  tekuci=meni->poc_stavka;
  for (i=mx=0,dubina=br;i<br;i++) /* Nalazi se duzina najduze linije */
  {
    char c;
    tmp=strlen(s=p[i]);
    if ((s[0]=='\2') && i) dubina++;
    while ((c=*(s++))!=0) if ((c=='\1') || (c=='\2')) tmp--;
    if (mx<tmp) mx=tmp;
  }
  if ((xpos2=xpos+mx+3)>80) return -2;  /* Odavde se crta okvir */
  if ((ypos2=ypos+dubina+1)>25) return -2;
  if ((xpos2<79) && (ypos2<25))
  {
    if ((pozadina=malloc((xpos2-xpos+3)*(ypos2-ypos+2)*2))!=NULL)
       gettext(xpos,ypos,xpos2+2,ypos2+1,pozadina);
    else return -2;
  }
  else
  {
    if ((pozadina=malloc((xpos2-xpos+1)*(ypos2-ypos+1)*2))!=NULL)
       gettext(xpos,ypos,xpos2,ypos2,pozadina);
    else return -2;
  }
  textbackground(poz_farba=meni->poz_farba);
  window(1,1,80,25);
  textcolor(meni->okvir_farba); /* Ovde pocinje crtanje okvira menija */
  gotoxy(xpos,ypos);
  putch(218);
  for (i=xpos+1;i<xpos2;i++) putch(196);
  putch(191);
  for (i=ypos+1,tmp=0;i<ypos2;i++,tmp++)
  {
    if ((*(p[tmp])=='\2') && tmp)
    {
      gotoxy(xpos,i++);
      putch(195);
      for (j=xpos+1;j<xpos2;j++) putch(196);
      putch(180);
    }
    gotoxy(xpos,i);
    putch(179);
    gotoxy(xpos2,i);
    putch(179);
  } /* for */
  gotoxy(xpos,ypos2);
  putch(192);
  for (i=xpos+1;i<xpos2;i++) putch(196);
  niz[0]=217;
  niz[1]=(char)meni->okvir_farba+16*(meni->poz_farba % 8);
  puttext(xpos2,ypos2,xpos2,ypos2,niz); /* Ovde se zavrsava crtanje okvira */
  textcolor(meni->pred_farba1); /* Ovde pocinje stampanje redova menija */
  for (i=j=0;i<br;i++,j++)
  {
    if ((*(p[i])=='\2') && i) j++;
    gotoxy(xpos+1,ypos+j+1);
    if (tekuci==i)
    {
      textbackground(ozn_farba);
      stampanje(meni,p[i],mx);
      textbackground(poz_farba);
      tek_pos=j;
    }
    else stampanje(meni,p[i],mx);
  } /* for - zavrseno stampanje redova menija */
  while(1)
  {
    if ((ch=getch())==0) ch=256*getch();
    else ch=(unsigned int)(toupper(ch));
    switch (ch)
    {
      case CUR_UP:    if ((meni->enter_efekt)==0) break;
                      gotoxy(xpos+1,ypos+tek_pos+1);
                      stampanje(meni,p[tekuci],mx);
                      if (tekuci==0) { tekuci=br-1; tek_pos=ypos2-ypos-2; }
                      else if (*(p[tekuci--])=='\2') tek_pos-=2;
                           else tek_pos--;
                      meni->poc_stavka=tekuci;
                      textbackground(ozn_farba);
                      gotoxy(xpos+1,ypos+tek_pos+1);
                      stampanje(meni,p[tekuci],mx);
                      textbackground(poz_farba);
                      break;
      case CUR_DOWN:  if ((meni->enter_efekt)==0) break;
                      gotoxy(xpos+1,ypos+tek_pos+1);
                      stampanje(meni,p[tekuci++],mx);
                      if (tekuci==br) tekuci=tek_pos=0;
                      else if (*(p[tekuci])=='\2' && tekuci) tek_pos+=2;
                           else tek_pos++;
                      meni->poc_stavka=tekuci;
                      textbackground(ozn_farba);
                      gotoxy(xpos+1,ypos+tek_pos+1);
                      stampanje(meni,p[tekuci],mx);
                      textbackground(poz_farba);
                      break;
      case ENTER:     if ((meni->enter_efekt)==0) break;
                      if ((xpos2<79) && (ypos2<25))
                         puttext(xpos,ypos,xpos2+2,ypos2+1,pozadina);
                      else puttext(xpos,ypos,xpos2,ypos2,pozadina);
                      free(pozadina);
                      kraj();
                      return tekuci;
      case ESC:       if (esc_efekt)
                      {
                        if ((xpos2<79) && (ypos2<25))
                           puttext(xpos,ypos,xpos2+2,ypos2+1,pozadina);
                        else puttext(xpos,ypos,xpos2,ypos2,pozadina);
                        free(pozadina);
                        kraj();
                        return -1;
                      }
      default:        for (i=0;i<br;i++)
                      if (ch==tasteri[i])
                      {
                        meni->poc_stavka=i;
                        if ((xpos2<79) && (ypos2<25))
                           puttext(xpos,ypos,xpos2+2,ypos2+1,pozadina);
                        else puttext(xpos,ypos,xpos2,ypos2,pozadina);
                        free(pozadina);
                        kraj();
                        return i;
                      }
                      break;
    } /* switch */
  } /* while(1) */
} /* menu */

