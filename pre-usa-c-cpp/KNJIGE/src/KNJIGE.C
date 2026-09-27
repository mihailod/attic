
// MODEL JE SMALL (64+64) //

#include <stdio.h>
#include <conio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

#define MAXSLOGOVA 5000 // maksimalni broj knjiga u bazi
			// moze i vise...jedno vreme sam drzao 9999 a onda
			// su poceli da se nekad javljaju bagovi posle
			// sorta.Uvodjenjem provere malloca utvrdio sam
			// da nekad nema memorije za sort.Sa 5000 ne bi
			// trebalo da bude problema...

FILE *baza         ; // fajl (baza) gde su svi podaci

char  sort  [   1] ; // po kom polju se trenutno sortira
char  buffer[1200] ; // bafer za rad sa jednim slogom baze
char  str   [ 300] ; // polje iz sloga u kome se vrsi pretraga

int   slog         ; // trenutni slog koji ce prikazi() procesirati
int   s[MAXSLOGOVA]; // glavni niz koji ukazuje na poredak obrade
		     // na pocetku to je obrada po redosledu unosenja
int   t[MAXSLOGOVA]; // niz dobijen pretragom
int   pok          ; // pokazuje gde smo u glavnom nizu s[]
int   zadnji       ; // zadnji slog pri datom kriterijumu
int   prvi         ; // prvi slog pri datom kriterijumu
int   imaih        ; // koliko ukupno knjiga ima u bazi
int   searchmode   ; // da li trenutno radim sa podskupom baze
int   nadjeno      ; // koliki podskup je trazi() nasao

struct
 {
  char rec[5]; // struktura za sortiranje (uzima u obzir prva 4 chars)
  int  broj;
 } *temp;

struct
 {
  char original1 [68];
  char original2 [68];
  char autor     [68];
  char godinaor  [ 5];
  char nagrade1  [68];
  char nagrade2  [68]; // struktura sa kojom se radi
  char prevod    [65]; // ona je prilagodjena direktnoj
  char prevodilac[65]; // upotrebi za ispis
  char izdavac   [65];
  char mesto     [65];
  char godinaip  [ 5];
  char izdanje   [20];
  char tiraz     [ 7];
  char biblioteka[65];
  char isbn      [40];
  char beleska1  [68];
  char beleska2  [68];
  char beleska3  [68];
  char beleska4  [68];
 } p;

int getkey(void) // vodi racuna i o extended tasterima
{
 int c=0;

 if(kbhit())
  {
   c=getch();
   if(!c) c=1000+getch();
  }
 return c;
} // getkey

int uzmibroj(FILE *fajl)
{
 int c;
 int broj=0;

 c=getc(fajl);
 do
  {
   broj*=10;
   broj+=c-'0';
  }
 while((c=getc(fajl))!='\n');
 return broj;
}

void init(void) // na pocetku je obrada po redosledu unosenja
{
 int i,c;

 clrscr();
 searchmode=0;
 _setcursortype(_NOCURSOR);
 sort[1]='\0';
 sort[0]='-' ;
 pok=1;
 baza=fopen("baza.knj","r");
 if(baza==NULL)
  {
   baza=fopen("c:\\language\\c\\bc31\\dsources\\knjige\\baza.knj","r");
   if(baza==NULL)
    {
     fprintf(stderr,"\n\n\n FATALNA GRESKA : ne mogu da otvorim fajl baze!");
     fprintf(stderr,    "\n                  izlazim... exit code = 1\n\n");
     exit(1);
    }
  }
 rewind(baza);
 i=1;
 while((c=getc(baza))!=EOF)
  {
   if(c=='\@')
    {
     c=uzmibroj(baza);
     s[i++]=c;
    }
  }
 --i;
 zadnji=s[i];
 prvi=s[1];
 slog=prvi;
 imaih=i; // pamtimo koliko slogova ima u bazi
} // init

void kraj(void)
{
 if(fclose(baza))
  {
   fprintf(stderr,"\n\n\n FATALNA GRESKA : ne mogu da zatvorim fajl baze!");
   fprintf(stderr,    "\n                  izlazim... exit code = 2\n\n");
   exit(2);
  }
 clrscr();
 printf("\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n0 OK, 0:1 ");
 getch();
 _setcursortype(_NORMALCURSOR);
} // kraj

void komande
(void)
{
 gotoxy(1,25);
 printf("[S]ort po %c   [T]razi [P]rethodni [N]aredni [O]dstampaj [U]putstva   [Esc]-kraj",sort[0]);
} // komande

void prikazi(void) // prikazi slog s[pok]
{
 int c,i,nema,pocetak,kraj,ptr;

 rewind(baza); // vrati se na pocetak
 loop:
      do
       {
	if((c=getc(baza))==EOF)  // ako je kraj,smanji slog
	 {
	  pok--;
	  slog=s[pok];
	  break;
	 }
       }
      while(c!='@');   // nadji slog
      c=uzmibroj(baza);
      if(c!=slog) goto loop;

 fread(buffer,1200,1,baza);  // iskopiraj ga (i malo vise...)

 ptr=0;
 pocetak=2;
 kraj=pocetak+65;
 nema=0;
 for(i=pocetak;i<=kraj;i++)
  {
   if(buffer[i]!='\n') p.original1[ptr++]=buffer[i];
    else
     {
      p.original1[ptr]='\0';
      p.original2[0]='\0';
      nema=1;
      break;
     }
  }

 if(nema==0)
 {
  pocetak+=ptr;
  ptr=0;
  kraj=pocetak+65;
   for(i=pocetak;i<=kraj;i++)
    {
     if(buffer[i]!='\n') p.original2[ptr++]=buffer[i];
      else
       {
	p.original2[ptr]='\0';
	break;
       }
    }
 }

 pocetak+=ptr;
 pocetak+=3;
 ptr=0;
 kraj=pocetak+65;

 for(i=pocetak;i<=kraj;i++)
  {
   if(buffer[i]!='\n') p.autor[ptr++]=buffer[i];
    else
     {
      p.autor[ptr]='\0';
      break;
     }
  }

 pocetak+=ptr;
 pocetak+=3;
 ptr=0;
 kraj=pocetak+3;

 for(i=pocetak;i<=kraj;i++)
  {
   if(buffer[i]!='\n') p.godinaor[ptr++]=buffer[i];
    else
     {
      p.godinaor[ptr]='\0';
      break;
     }
  }

 pocetak+=ptr;
 pocetak+=3;
 ptr=0;
 kraj=pocetak+65;
 nema=0;

 for(i=pocetak;i<=kraj;i++)
  {
   if(buffer[i]!='\n') p.nagrade1[ptr++]=buffer[i];
    else
     {
      p.nagrade1[ptr]='\0';
      p.nagrade2[0]='\0';
      nema=1;
      break;
     }
  }

 if(nema==0)
 {
  pocetak+=ptr;
  ptr=0;
  kraj=pocetak+65;
  for(i=pocetak;i<=kraj;i++)
   {
    if(buffer[i]!='\n') p.nagrade2[ptr++]=buffer[i];
     else
      {
       p.nagrade2[ptr]='\0';
       break;
      }
   }
 }

 pocetak+=ptr;
 pocetak+=3;
 ptr=0;
 kraj=pocetak+62;

 for(i=pocetak;i<=kraj;i++)
  {
   if(buffer[i]!='\n') p.prevod[ptr++]=buffer[i];
   else
    {
     p.prevod[ptr]='\0';
     break;
    }
  }

 pocetak+=ptr;
 pocetak+=3;
 ptr=0;
 kraj=pocetak+62;

 for(i=pocetak;i<=kraj;i++)
  {
   if(buffer[i]!='\n') p.prevodilac[ptr++]=buffer[i];
   else
    {
     p.prevodilac[ptr]='\0';
     break;
    }
  }

 pocetak+=ptr;
 pocetak+=3;
 ptr=0;
 kraj=pocetak+62;

 for(i=pocetak;i<=kraj;i++)
  {
   if(buffer[i]!='\n') p.izdavac[ptr++]=buffer[i];
   else
    {
     p.izdavac[ptr]='\0';
     break;
    }
  }

 pocetak+=ptr;
 pocetak+=3;
 ptr=0;
 kraj=pocetak+62;

 for(i=pocetak;i<=kraj;i++)
  {
   if(buffer[i]!='\n') p.mesto[ptr++]=buffer[i];
   else
    {
     p.mesto[ptr]='\0';
     break;
    }
  }

 pocetak+=ptr;
 pocetak+=3;
 ptr=0;
 kraj=pocetak+3;

 for(i=pocetak;i<=kraj;i++)
  {
   if(buffer[i]!='\n') p.godinaip[ptr++]=buffer[i];
   else
    {
     p.godinaip[ptr]='\0';
     break;
    }
  }

 pocetak+=ptr;
 pocetak+=3;
 ptr=0;
 kraj=pocetak+19;

 for(i=pocetak;i<=kraj;i++)
  {
   if(buffer[i]!='\n') p.izdanje[ptr++]=buffer[i];
   else
    {
     p.izdanje[ptr]='\0';
     break;
    }
  }

 pocetak+=ptr;
 pocetak+=3;
 ptr=0;
 kraj=pocetak+5;

 for(i=pocetak;i<=kraj;i++)
  {
   if(buffer[i]!='\n') p.tiraz[ptr++]=buffer[i];
   else
    {
     p.tiraz[ptr]='\0';
     break;
    }
  }

 pocetak+=ptr;
 pocetak+=3;
 ptr=0;
 kraj=pocetak+62;

 for(i=pocetak;i<=kraj;i++)
  {
   if(buffer[i]!='\n') p.biblioteka[ptr++]=buffer[i];
   else
    {
     p.biblioteka[ptr]='\0';
     break;
    }
  }

 pocetak+=ptr;
 pocetak+=3;
 ptr=0;
 kraj=pocetak+39;

 for(i=pocetak;i<=kraj;i++)
  {
   if(buffer[i]!='\n') p.isbn[ptr++]=buffer[i];
   else
    {
     p.isbn[ptr]='\0';
     break;
    }
  }


 pocetak+=ptr;
 pocetak+=3;
 ptr=0;
 kraj=pocetak+66;
 nema=0;

 for(i=pocetak;i<=kraj;i++)
  {
   if(buffer[i]!='\n') p.beleska1[ptr++]=buffer[i];
   else
    {
     p.beleska1[ptr]='\0';
     p.beleska2[  0]='\0';
     p.beleska3[  0]='\0';
     p.beleska4[  0]='\0';
     nema=1;
     break;
    }
  }

 if(nema==0)
 {
  pocetak+=ptr;
  ptr=0;
  kraj=pocetak+66;

 for(i=pocetak;i<=kraj;i++)
  {
   if(buffer[i]!='\n') p.beleska2[ptr++]=buffer[i];
   else
    {
     p.beleska2[ptr]='\0';
     p.beleska3[  0]='\0';
     p.beleska4[  0]='\0';
     nema=1;
     break;
    }
  }
 }

 if(nema==0)
 {
  pocetak+=ptr;
  ptr=0;
  kraj=pocetak+66;

 for(i=pocetak;i<=kraj;i++)
  {
   if(buffer[i]!='\n') p.beleska3[ptr++]=buffer[i];
   else
    {
     p.beleska3[ptr]='\0';
     p.beleska4[  0]='\0';
     nema=1;
     break;
    }
  }
 }

 if(nema==0)
 {
  pocetak+=ptr;
  ptr=0;
  kraj=pocetak+66;

 for(i=pocetak;i<=kraj;i++)
  {
   if(buffer[i]!='\n') p.beleska4[ptr++]=buffer[i];
   else
    {
     p.beleska4[ptr]='\0';
     break;
    }
  }
 }

 gotoxy(14, 2);printf("%s\n",p.original1);
 gotoxy(14, 3);printf("%s\n",p.original2);
 gotoxy(14, 5);printf("%s\n",p.autor);
 gotoxy(14, 6);printf("%s\n",p.godinaor);
 gotoxy(14, 7);printf("%s\n",p.nagrade1);
 gotoxy(14, 8);printf("%s\n",p.nagrade2);
 gotoxy(16,10);printf("%s\n",p.prevod);
 gotoxy(16,11);printf("%s\n",p.prevodilac);
 gotoxy(16,12);printf("%s\n",p.izdavac);
 gotoxy(16,13);printf("%s\n",p.mesto);
 gotoxy(16,14);printf("%s\n",p.godinaip);
 gotoxy(16,15);printf("%s\n",p.izdanje);
 gotoxy(16,16);printf("%s\n",p.tiraz);
 gotoxy(16,17);printf("%s\n",p.biblioteka);
 gotoxy(16,18);printf("%s\n",p.isbn);
 gotoxy(13,20);printf("%s\n",p.beleska1);
 gotoxy(13,21);printf("%s\n",p.beleska2);
 gotoxy(13,22);printf("%s\n",p.beleska3);
 gotoxy(13,23);printf("%s\n",p.beleska4);
} // prikazi

void uputstva(void)
{
 clrscr();
 printf("                   Uputstva za upotrebu programa KNJIGE V1.0                    ");
 printf("                 อออออออออออออออออออออออออออออออออออออออออออออ                  ");
 printf(" Pregled vecine komandi koje su same po sebi jasne uvek je u zadnjem redu.  Tu  ");
 printf(" su jos [Home] i [End] koji prikazuju  prvi i zadnji slog. Aliasi [N] i [P] su  ");
 printf(" [PageUp]  i  [PageDown].  Pretraga je case-unsensitive.  Rezultat pretrage je  ");
 printf(" je podskup slogova. Da biste se vratili na sve slogove na pitanje  Gde ? une-  ");
 printf(" site pogresno polje ili [ENTER], ili na Sta ? pritisnite samo [ENTER].  Alias  ");
 printf(" za [H] je [F1].                                                                ");
 printf("\n");
 printf(" Program  koristi fajl koji se zove baza.knj i nalazi se u istom direktorijumu  ");
 printf(" u kome je i on sam.  Baze se prave tekst editorom.  Slog pocinje sa @ , posle  ");
 printf(" cega sledi jedinstven (interni) broj knjige, a zatim redovi sa informacijama.  ");
 printf(" To se lako moze shvatiti iz trenutne baze.  Svaka informacija reprezentuje se  ");
 printf(" tacno jednim redom teksta iza koga mora slediti \\n (new line).Ogranicenja su:  ");
 printf("\n");
 printf("   ORIGINAL 132, AUTOR 66, GODINAO 4, NAGRADE 132, PREVOD 63, PREVODILAC 63,    ");
 printf("   IZDAVAC 64 , MESTO 63 , GODINAP 4 , IZDANJE 20 , TIRAZ 6 , BIBLIOTEKA 63,    ");
 printf("   ISBN 40 i BELESKA 264.                                                       ");
 printf("\n");
 printf(" Maksimalan broj knjiga je 5000, sort uzima u obzir samo prva cetiri karaktera  ");
 printf(" i sve je string (dakle, paddujte sa nulama tiraz da sve bude ok).    ");
 printf("\n\n");
 printf("      Program je napisan kompletno u C-u (Borland Turbo C++ 3.1 DOS IDE).       ");
 printf("                 Program radjen : 03.Avg.1995. - 06.Avg.1995.			 ");
 printf("                     AUTOR : Mihailo Despotovic 015/25041");
 getch();
 clrscr();
} // uputstva

void sortiraj(void)
{
 int c,d,e,f,i,tekuci,t,ind,tmp2,d0,d1,d2,d3;
 char tmp1[5];
 temp=malloc(imaih*sizeof(temp));
 if(temp==NULL)
  {
   fprintf(stderr,"\n\n\n FATALNA GRESKA : nemam memorije za sortiranje!");
   fprintf(stderr,    "\n                  izlazim... exit code = 3\n\n");
   if(fclose(baza))
    {
     fprintf(stderr,"\n\n\n FATALNA GRESKA : ne mogu da zatvorim fajl baze!");
     fprintf(stderr,    "\n                  izlazim... exit code = 2\n\n");
     exit(2);
    }
   exit(3);
  }

 tmp1[4]='\0';
 gotoxy(11,25);
 printf("%c",' ');
 gotoxy(11,25);
 _setcursortype(_SOLIDCURSOR);
 c=getch();
 t=0;

 switch(c)
  {
   case '1': sort[0]='1';break;
   case '2': sort[0]='2';break;
   case '3': sort[0]='3';break;
   case '4': sort[0]='4';break;
   case '5': sort[0]='5';break;
   case '6': sort[0]='6';break;
   case '7': sort[0]='7';break;
   case '8': sort[0]='8';break;
   case '9': sort[0]='9';break;
   case 'a':
   case 'A': sort[0]='A';break;
   case 'b':
   case 'B': sort[0]='B';break;
   case 'c':
   case 'C': sort[0]='C';break;
   case 'd':
   case 'D': sort[0]='D';break;
   case 'e':
   case 'E': sort[0]='E';break;
   case  27:
   default : t=1;        break; // los taster ili ESC => ignorisi
  }

 _setcursortype(_NOCURSOR);
 if(t==1) return;

 searchmode=0; // @@@@@@@@@@@ ovo izbaciti kada se ubaci sort+serach
 i=0;
 tekuci=0;
 rewind(baza);

 for(;;)
 {
  c=getc(baza);
  if(c==EOF)
   {
    break;
   }

  if(c=='@')
   {
    tekuci=uzmibroj(baza);
   }

  if(c=='#')
   {
    c=getc(baza);
    if(c==sort[0]) // da li se po njemu sortira ?
     {
      temp[i].broj=tekuci; // da, zapamti ga
      c=getc(baza);
      d=getc(baza);
      e=getc(baza);  // sortira se po prva 4 chara u recordu
      f=getc(baza);

      if(c=='\n')
       {
	temp[i].rec[0]=' ';   // ako ima manje od 4, padduj sa space
	temp[i].rec[1]=' ';
	temp[i].rec[2]=' ';
	temp[i].rec[3]=' ';
	temp[i].rec[4]='\0';
	i++;
       }
      if(c!='\n'&&d=='\n')
       {
	temp[i].rec[0]=c;
	temp[i].rec[1]=' ';
	temp[i].rec[2]=' ';
	temp[i].rec[3]=' ';
	temp[i].rec[4]='\0';
	i++;
       }
      if(c!='\n'&&d!='\n'&&e=='\n')
       {
	temp[i].rec[0]=c;
	temp[i].rec[1]=d;
	temp[i].rec[2]=' ';
	temp[i].rec[3]=' ';
	temp[i].rec[4]='\0';
	i++;
       }
      if(c!='\n'&&d!='\n'&&e!='\n'&&f=='\n')
       {
	temp[i].rec[0]=c;
	temp[i].rec[1]=d;
	temp[i].rec[2]=e;
	temp[i].rec[4]='\0';
	temp[i].rec[3]=' ';
	i++;
       }
      if(c!='\n'&&d!='\n'&&e!='\n'&&f!='\n')
       {
	temp[i].rec[0]=c;
	temp[i].rec[1]=d;
	temp[i].rec[2]=e;
	temp[i].rec[3]=f;
	temp[i].rec[4]='\0';
	i++;
       }
      {  } // poneki slog "upadne" i ovde... bitno je ne dirati i !!
     } // c==sortirampo
   } // c==#
 } // for(;;)

 ind=1;
 while(ind!=0)   // bubblesort ;->
  {
   ind=0;
   for(tekuci=0;tekuci<=i-2;tekuci++)
    {
     d0=temp[tekuci].rec[0]-temp[tekuci+1].rec[0];
     d1=temp[tekuci].rec[1]-temp[tekuci+1].rec[1];
     d2=temp[tekuci].rec[2]-temp[tekuci+1].rec[2];
     d3=temp[tekuci].rec[3]-temp[tekuci+1].rec[3];

     if(d0>0)
      {
       strcpy(tmp1,temp[tekuci].rec);
       tmp2=temp[tekuci].broj;
       strcpy(temp[tekuci].rec,temp[tekuci+1].rec);
       temp[tekuci].broj=temp[tekuci+1].broj;
       strcpy(temp[tekuci+1].rec,tmp1);
       temp[tekuci+1].broj=tmp2;
       ind=1;
      }

     if(d0==0&&d1>0)
      {
       strcpy(tmp1,temp[tekuci].rec);
       tmp2=temp[tekuci].broj;
       strcpy(temp[tekuci].rec,temp[tekuci+1].rec);
       temp[tekuci].broj=temp[tekuci+1].broj;
       strcpy(temp[tekuci+1].rec,tmp1);
       temp[tekuci+1].broj=tmp2;
       ind=1;
      }

     if(d0==0&&d1==0&&d2>0)
      {
       strcpy(tmp1,temp[tekuci].rec);
       tmp2=temp[tekuci].broj;
       strcpy(temp[tekuci].rec,temp[tekuci+1].rec);
       temp[tekuci].broj=temp[tekuci+1].broj;
       strcpy(temp[tekuci+1].rec,tmp1);
       temp[tekuci+1].broj=tmp2;
       ind=1;
      }

     if(d0==0&&d1==0&&d2==0&&d3>0)
      {
       strcpy(tmp1,temp[tekuci].rec);
       tmp2=temp[tekuci].broj;
       strcpy(temp[tekuci].rec,temp[tekuci+1].rec);
       temp[tekuci].broj=temp[tekuci+1].broj;
       strcpy(temp[tekuci+1].rec,tmp1);
       temp[tekuci+1].broj=tmp2;
       ind=1;
      }

    }
  }

 for(tekuci=0;tekuci<=i-1;tekuci++) s[tekuci+1]=temp[tekuci].broj;
 prvi=s[1];
 pok=1;
 zadnji=s[i];
 slog=prvi;
 free(temp);
} // sortiraj

void uzmistring(FILE *fajl)
{
 int c,i=0;

 for(;;)
 {
  c=getc(fajl);
  if(c=='\n') break;
  str[i++]=tolower(c);
 }
 str[i]='\0';
} // uzmistring

int sadrzi(char *ko,char *sta) // Kernighan-Ritchie rules!
{
 int i,j,k;

 for(i=0;ko[i]!='\0';i++)
  {
   for(j=i,k=0;sta[k]!='\0'&&ko[j]==sta[k];j++,k++);
   if(k>0&&sta[k]=='\0') return 1;
  }
 return 0;
} // sadrzi

void trazi(void)
{
 int c,i,gde,tekuci,j,duz;
 char sta[270]; // max zahtev pretrage malo veci od max polja sloga

 gotoxy(1,25);
 printf("                                                                               ");
 gotoxy(1,25);
 printf(" Gde ? ");
 _setcursortype(_SOLIDCURSOR);
 c=getch();
 c=toupper(c);
 gde=c;
 printf("%c ",gde);
 if(c!='1'&&c!='2'&&c!='3'&&c!='4'&&c!='5'&&c!='6'&&c!='7'&&c!='8'&&c!='9'&&c!='A'&&c!='B'&&c!='C'&&c!='D'&&c!='E')
  {
   searchmode=0;
   init();
   return;
  }
 printf("Sta ? ");
 gets(sta);
 _setcursortype(_NOCURSOR);
 gotoxy(1,23);
 printf("                                                                                ");
 gotoxy(1,24);
 printf("ออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออ");
 komande();
 duz=strlen(sta);
 if(duz==0)
  {
   init();
   return;
  }

 searchmode=1;
 for(i=0;i<=duz;i++)
  {
   sta[i]=tolower(sta[i]);
  }

 j=0; // koliko ima slogova koji zadovoljavaju
 i=1; // gde sam u bazi
 tekuci=0; // primary key trenutnog sloga
 rewind(baza);

 for(;;) // trazimo kroz sve do EOF-a
 {
  c=getc(baza);
  if(c==EOF) break;

  if(c=='@')
   {
    tekuci=uzmibroj(baza);
    if(tekuci!=s[i]) continue; // sort je jaci od pretrage
    else i++;
   }

  if(c=='#')
   {
    c=getc(baza);
    if(c==gde) // da li se tu trazi ?
     {
      uzmistring(baza);
      if(sadrzi(str,sta)) t[j++]=tekuci;
     }
   }
 }

 if(j==0) // nema takvog!
  {
   gotoxy(3,24);
   printf("NEMA  !");
   printf("%c",'\a');
   searchmode=0;
   return;
  }

 nadjeno=j; // koliko smo ih nasli da ispunjavaju uslove pretrage
 for(i=0;i<=j-1;i++) s[i+1]=t[i];
 prvi=s[1];
 pok=1;
 zadnji=s[j];
 slog=prvi;
} // trazi

void prethodni(void)
{
 if(s[pok]!=prvi) { pok--;slog=s[pok]; }
  else
   {
    gotoxy(3,24);
    printf("PRVI  !"); // ako je prvi, opomeni i ne diraj nista
    printf("%c",'\a');
   }
} // prethodni

void naredni(void)
{
 if(s[pok]!=zadnji) { pok++;slog=s[pok]; }
  else
   {
    gotoxy(3,24);
    printf("ZADNJI!"); // ako je zadnji, opomeni i ne diraj nista
    printf("%c",'\a');
   }
}// naredni

void home(void) // premesta se na prvi slog
{
 slog=prvi;
 pok=1;
} // home

void end(void)  // premesta se na zadnji slog
{
 slog=zadnji;
 pok=imaih;
} // end

void odstampaj(void)
{
 int c;
 char *podvlaka="ออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออ";

 gotoxy(1,25);
 printf("                                                                               ");
 gotoxy(1,25);
 printf(" [Tekuca knjiga >> stdprn]  Da li je stampac potpuno spreman ? (D/N) ");
 _setcursortype(_SOLIDCURSOR);
 c=getch();
 _setcursortype(_NOCURSOR);
 if((c!='d')&&(c!='D')) return;

 fprintf(stdprn,podvlaka);
 fprintf(stdprn,"  ORIGINAL : %s\n",p.original1);
 fprintf(stdprn,"             %s\n",p.original2);
 fprintf(stdprn,podvlaka);
 fprintf(stdprn,"  AUTOR    : %s\n",p.autor);
 fprintf(stdprn,"  GODINA   : %s\n",p.godinaor);
 fprintf(stdprn,"  NAGRADE  : %s\n",p.nagrade1);
 fprintf(stdprn,"             %s\n",p.nagrade2);
 fprintf(stdprn,podvlaka);
 fprintf(stdprn,"  PREVOD     : %s\n",p.prevod);
 fprintf(stdprn,"  PREVODILAC : %s\n",p.prevodilac);
 fprintf(stdprn,"  IZDAVAC    : %s\n",p.izdavac);
 fprintf(stdprn,"  MESTO      : %s\n",p.mesto);
 fprintf(stdprn,"  GODINA     : %s\n",p.godinaip);
 fprintf(stdprn,"  IZDANJE    : %s\n",p.izdanje);
 fprintf(stdprn,"  TIRAZ      : %s\n",p.tiraz);
 fprintf(stdprn,"  BIBLIOTEKA : %s\n",p.biblioteka);
 fprintf(stdprn,"  ISBN       : %s\n",p.isbn);
 fprintf(stdprn,podvlaka);
 fprintf(stdprn,"  BELESKA : %s\n",p.beleska1);
 fprintf(stdprn,"            %s\n",p.beleska2);
 fprintf(stdprn,"            %s\n",p.beleska3);
 fprintf(stdprn,"            %s\n",p.beleska4);
 fprintf(stdprn,podvlaka);
 fprintf(stdprn,"                                                KNJIGE V1.0 by Mihailo Aug.1995.");
 fputc(12,stdprn); // ff je pozeljan za InkJet i Laser (thanks to Magda)
} // odstampaj

void frame(void)
{
 char *podvlaka="ออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออ";

 gotoxy(1,1);
 if(searchmode==0)
 printf("อออออออออออออออออออออออออออออออออออออออออออออออออ Knjiga %4d ออ Ukupno  %4d ออ",pok,imaih);
 if(searchmode==1)
 printf("อออออออออออออออออออออออออออออออออออออออออออออออออ Knjiga %4d ออ Nadjeno %4d ออ",pok,nadjeno);
 printf("1 ORIGINAL                                                                      ");
 printf("                                                                                ");
 printf(podvlaka);
 printf("2 AUTOR                                                                         ");
 printf("3 GODINA                                                                        ");
 printf("4 NAGRADE                                                                       ");
 printf("                                                                                ");
 printf(podvlaka);
 printf("5 PREVOD                                                                        ");
 printf("6 PREVODILAC                                                                    ");
 printf("7 IZDAVAC                                                                       ");
 printf("8 MESTO                                                                         ");
 printf("9 GODINA                                                                        ");
 printf("A IZDANJE                                                                       ");
 printf("B TIRAZ                                                                         ");
 printf("C BIBLIOTEKA                                                                    ");
 printf("D ISBN                                                                          ");
 printf(podvlaka);
 printf("E BELESKA                                                                       ");
 printf("                                                                                ");
 printf("                                                                                ");
 printf("                                                                                ");
 printf(podvlaka);
 komande();
 prikazi();
} // frame


int main(void)
{
 int c;

 init();
 frame();
 do
  {
   c=getkey();
   switch(c)
    {
     case   27 :                       break; // ESCAPE => kraj

     case 1071 : home();      frame(); break;

     case 1079 : end();       frame(); break;

     case 1059 :
     case   'U':
     case   'u': uputstva();  frame(); break;

     case   'S':
     case   's': sortiraj();  frame(); break;

     case   'T':
     case   't': trazi();     frame(); break;

     case 1081 :
     case   'P':
     case   'p': prethodni(); frame(); break;

     case 1073 :
     case   'N':
     case   'n': naredni();   frame(); break;

     case   'O':
     case   'o': odstampaj(); frame(); break;

     default   :                       break;
    }
  }
 while(c!=27);
 kraj();
 return(0);
} // main [03.Aug.1995. - 06.Aug.1995. by Mihailo Despotovic]
