// Semestralni rad iz predmeta "PRIMENE VESTACKE INTELIGENCIJE"
// Profesor : dr. Vladimir Srdanovic
// Uradio   : Mihailo Despotovic, April / Maj 1997.


#include <stdio.h>
#include <conio.h>


#define LIMIT 15 // maksimalna dimenzija problema


int polje[LIMIT];       // prisutnost dame na polju
int vrsta[LIMIT];       // napadnutost vrste
int dia_poz[2*LIMIT-1]; // napadnutost pozitivne dijagonale
int dia_neg[2*LIMIT-1]; // napadnutost negativne dijagonale
int koliko,uneto=0;     // dimenzija problema i da li je ona uneta ili ne
int brres=1,cekaj=1;    // brojac resenja i indikator grafickog prikaza
char cek[5];            // string za prikaz statusa grafickog prikaza


void stampaj (int n) // stampa resenje
 {
  int i,j;

  clrscr();
  printf("Dimenzija problema : %d",koliko);
  printf("\n\n\tResenje broj %d\n\n",brres++);

  for(i=0;i<n;i++)
   {
    printf("\t");
    for(j=0;j<n;j++)
     if(polje[j]==i) printf("Û "); else printf(". "); // dama ili prazno
    printf("\n");
   }
    printf("\n\n\n");
    if(cekaj==1) getch(); // cekaj ako treba
 } // stampaj

void postavi(int n,int nn) // postavi damu u nn-tu kolonu tako
 {                         // da se ne napada sa vec postavljenim
  int i;                   // damama u 0,...,nn-1-vim kolonama
			   // a sam problem je dimenzije n
  for(i=0;i<n;i++) // glavna petlja po vrstama
   {
    if(!vrsta[i]&& !dia_poz[i+nn] && !dia_neg[nn-i+n-1]) // da li je vrsta
     {                                                   // napadana ?
      if(nn<n-1) // da li smo stigli do zadnje dame ?
       {
	polje[nn]=i;            // ako ne, postavimo damu
	vrsta[i]=1;             // "zaboravi" celu tu vrstu
	dia_poz[nn+i]=1;        // "zaboravi" odgovarajucu pozit. dijagonalu
	dia_neg[nn-i+(n-1)]=1;  // "zaboravi" odgovarajucu negat. dijagonalu
	postavi(n,nn+1);        // rekurzivni poziv sa parametrom kn
	vrsta[i]=0;             // za 1 vecim (izlaz iz rekurzije je nn=n-1)
	dia_poz[nn+i]=0;
	dia_neg[nn-i+(n-1)]=0;  // ova tri zadnja reda su backtracking ( = 0)
       }
      else
       {
	polje[nn]=i;            // stigli smo do zadnje,
	stampaj(n);             // odstampaj resenje
	return;     // ovo nije globalni return ! (u opstem slucaju)
       }            // nego povratak u rekurziji... tek na kraju je gotovo
     }
    }
 } // postavi

void init(int n) // init globalnih varijabli (potrebnih za rekurziju)
 {               // i prvi (tj. nulti) poziv postavi (nulta kolona)
  int i;

  for(i=0;i<n;i++)
   vrsta[i]=dia_poz[i]=dia_neg[i]=0;
  for(;i<2*n-1;i++)
   dia_poz[i]=dia_neg[i]=0;
  postavi(n,0);
 } // init

void obrada(int n) // da li je uneta dimenzija, egzistencija resenja i
 {                 // pocetak rada (ako je sve ok.)
  if(uneto==0)
   {
    clrscr();
    printf("\007\n\n\n\tUnesite dimenziju problema!");
    printf("\n\n\n\tBilo koji taster za glavni meni...");
    getch();
    return;
   }
  brres=1;

  if(n==2 || n==3)
   {
    clrscr();
    printf("\007\n\n\nNema resenja !");
    printf("\n\nBilo koji taster za glavni meni...");
    getch();
    return;
   }

  init(n);
  printf("\007Nema vise resenja !");
  getch();
 } // obrada

void greska(void) // rutina za obradu greske
 {
  printf("\n\nGRESKA!!!\007");
  printf("\n\nBilo koji taster za glavni meni...");
  getch();
  return;
 } // greska

void postavka(void) // ukratko ispisuje postavku zadatka
 {
  clrscr();
  printf("\n\t\tPostavka zadatka\n");
  printf("\t\tÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄ\n\n");
  printf("\tProgram implementira problem n dama na tabli dimenzije n x n.\n\n");
  printf("\tUlazni podatak je broj dama (sto je ujedno i dimenzija problema).\n\n");
  printf("\tResenja ce biti prikazana jedno po jedno. Prazno polje bice\n");
  printf("\tpredstavljeno sa tackom, a dama sa simbolom Û.\n\n");
  printf("\tProblem se resava rekurzijom, primenom backtracking tehnologije\n");
  printf("\tprogramiranja. Napredak backtracking-a se lepo vidi kroz resenja.\n");
  printf("\tBacktracking (na ekranu) ide odozgo nadole i sleva udesno.\n\n");
  printf("\tVec posle nekoliko dama, broj resenja se naglo uvecava.\n");
  printf("\tZbog toga opcija [ P ] preskace cekanje na pregled svakog resenja.\n");
  printf("\tOna sluzi za odredjivanje broja resenja i animirano pracenje\n");
  printf("\tnapredovanja backtracking-a kod velikog broja dama.");

  printf("\n\n\n\n\tBilo koji taster za povratak u glavni meni...");
  getch();
 } // postavka

void menu(void) // ispis menija
 {
  clrscr();
  _setcursortype(_NOCURSOR);
  printf("\n\n\n");
  printf("\n\tSemestralni rad iz predmeta \"Primene vestacke inteligencije\"\n");
  printf("\tÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄ");
  printf("\n\n\n\t\t    [ U ]  Unos dimenzije problema\n");
  printf("\t\t    [ R ]  Resavanje problema\n");
  printf("\t\t    [ P ]  Pauza za pregled resenja -> %s\n\n",cek);
  printf("\t\t    [ F ]  Formulacija problema\n\n\n");
  printf("\t\t    [ESC]  Izlaz iz programa\n");
  printf("\n\n\n\n\n\t            Mihailo Despotovic, April / Maj 1997.");
 } // menu

void unos(void) // unos dimenzije problema
 {
  int starokoliko=koliko;

  clrscr();
  printf("Unosi se broj dama (a implicitno i dimenzija problema)\n");
  printf("ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄ\n\n");
  printf("Zahtev za broj dama : 1 < dama < %d",LIMIT);
  printf("\n\nUnesite broj dama -> ");
  _setcursortype(_SOLIDCURSOR);
  scanf("%d",&koliko);

  if((koliko<1)||(koliko>LIMIT))
   {
    _setcursortype(_NOCURSOR);
    koliko=starokoliko;
    greska();
    return;
   }

  uneto=1;
  _setcursortype(_NOCURSOR);
 } // unos

void cekati(void) // da li se ceka na ispis ili ne
 {
  if(cekaj==1)
   {
    cek[0]='N';
    cek[1]='e';
    cekaj=0;
    return;
   }
  cek[0]='D';
  cek[1]='a';
  cekaj=1;
 } // cekati


int main(void) // glavni program
 {
  int c=0;
  cek[0]='D';cek[1]='a';

  menu();
  while(c!=27) // cekaj na Escape key
   {
    c=getch();
    switch(c)
     {
      case 'f':
      case 'F': postavka();       menu();  break;

      case 'u':
      case 'U': unos();           menu();  break;

      case 'p':
      case 'P': cekati();	  menu();  break;

      case 'r':
      case 'R': obrada(koliko);   menu (); break;
     }
    }
  _setcursortype(_NORMALCURSOR);
  return 0;
 } // main