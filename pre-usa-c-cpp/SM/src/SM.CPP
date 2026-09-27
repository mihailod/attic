// Za predmet : "Statisticke metode u vestackoj inteligenciji"
// Uradio     : Mihailo Despotovic, Februar 1997.

#include<stdio.h>
#include<stdlib.h>
#include<conio.h>
#include<time.h>
#include<math.h>
#include<dos.h>

#define MAXN      1000 // moze i vise, potrebno zbog statickog niza
#define MAXKOLIKO  100 // moze i vise, cisto zbog estetskih razloga


float p;                // verovatnoca pojavljivanja cifre 1
int n,koliko,uneto=0;   // neke pomocne promenljive
unsigned int niz[MAXN]; // niz koji se dobija itercaijama od niz[1]


void generisi(int i) // od i-tog pravi (i+1)-vi vektor : niz[i]->niz[i+1]
 {
  int stari[16],novi[16],j; // pomocni nizovi koji cuvaju bitove
  unsigned int temp=niz[i];

  niz[i+1]=0;
  for(j=0;j<=15;j++) // pretvori niz[i] u niz bitova
   {
    temp<<=j;
    temp>>=15;
    if(temp==1) stari[j]=1;
     else stari[j]=0;
    temp=niz[i];
   }

  for(int k=0;k<=15;k++) printf("%d",stari[k]); // ispisi ga na ekran
  if(!(i%4)) printf("\n");
   else printf(" ");

  if((stari[15]==0)&&(stari[1]==0)) novi[0]=0; // izracunaj nultu komponentu
   else novi[0]=1;

  if((stari[14]==0)&&(stari[0]==0)) novi[7]=0; // izracunaj 15tu komponentu
   else novi[7]=1;

  for(j=1;j<=14;j++) // racunaj sve ostale komponente
   {
    if((stari[j-1]==0)&&(stari[j+1]==0)) novi[j]=0;
     else novi[j]=1;
   }

  for(j=0;j<=15;j++) // pretvori niz bitova u broj (to je sledeca iteracija)
   {
    if(novi[j]==1)
     niz[i+1]|=((unsigned int)(pow(2,15-j)));
   }
 } // generisi

void ispisi(void) // ispisuje clanove niza
 {
  int j;
  unsigned int temp=niz[n];

  for(j=0;j<=15;j++) // pretvori broj u niz bitova i ispisi ga u tom obliku
   {
    temp<<=j;
    temp>>=15;
    printf("%d",temp);
    temp=niz[n];
   }

  printf("\n\nKonacni broj u n-toj iteraciji je : %u",niz[n]);
 } // ispisi

void postavi(int mesto) // postavlja cifru 1 u bitskom zapisu na zahtevano mesto
 {
  unsigned int temp=16384; // binarno 1000000000000000

  temp >>= mesto;
  niz[1]|=temp;
 } // postavi

void init(void) // inicijalizacija promenljivih itd...
 {
  int i;
  float granica;

  for(i=0;i<=MAXN;i++) niz[i]=0;

  randomize();     // postavi seed ugradjenog random generatora
  granica=p*10000; // pretvori p u "granicnik" (zbog preciznosti)

  niz[1]=0;

  for(i=0;i<=15;i++) // kreiraj pocetnu iteraciju (niz[1])
   { if(random(10000)<granica) postavi(i); }

  clrscr();
  printf("Init vraca : %d\n\n",niz[1]); // ispisi je na ekran

 } // init

void greska(void) // rutina za obradu greske
 {
  printf("\n\nGRESKA!!!\007");
  printf("\n\nBilo koji taster za glavni meni...");
  getch();
  return;
 } // greska

void menu(void) // rutina za ispis menija
 {
  clrscr();
  _setcursortype(_NOCURSOR);
  printf("\n\n\tRad iz predmeta \"Statisticke metode u vestackoj inteligenciji\"\n");
  printf("\t컴컴컴컴컴컴컴컴컴컴컴컴컴컴컴컴컴컴컴컴컴컴컴컴컴컴컴컴컴컴컴");
  printf("\n\n\n\n\n\t\t\t   [ U ]  Unos podataka\n");
  printf("\t\t\t   [ O ]  Obrada podataka\n\n");
  printf("\t\t\t   [ P ]  Postavka zadatka\n\n\n");
  printf("\t\t\t   [ESC]  Kraj\n");
  printf("\n\n\n\n\n\n\n\t\t       Mihailo Despotovic, Februar 1997.");
 } // menu

void unos(void) // rutina za unos parametara p,n i koliko zelimo brojeva
 {
  float starop=p;
  int staron=n;

  clrscr();
  printf("Unose se podaci p i n\n");
  printf("컴컴컴컴컴컴컴컴컴컴�\n\n");
  printf("Zahtev za p : 0 <= p <=1\n");
  printf("Zahtev za n : 0 < n < %d",MAXN);
  printf("\n\nUnesite p -> ");
  _setcursortype(_SOLIDCURSOR);
  scanf("%f",&p);

  if((p>1)||(p<0))
   {
    _setcursortype(_NOCURSOR);
    p=starop;
    greska();
    return;
   }

  printf("Unesite n -> ");
  scanf("%d",&n);

  if((n<0)||(n>MAXN))
   {
    _setcursortype(_NOCURSOR);
    n=staron;
    p=starop;
    greska();
    return;
   }

  printf("\nKoliko slucajnih brojeva zelite (max %d brojeva) ? -> ",MAXKOLIKO);
  scanf("%d",&koliko);

  if((koliko<1)||(koliko>MAXKOLIKO))
   {
    _setcursortype(_NOCURSOR);
    p=starop;
    n=staron;
    greska();
    return;
   }

  uneto=1;
  _setcursortype(_NOCURSOR);
 } // unos

void obrada(void) // glavna rutina u programu
 {
  int i,j;

  if(uneto==0) { printf("\nNe postoje podaci !\007"); return; }

  for(j=1;j<=koliko;j++) // u petlji se generisu vektori...
   {
    init();
    for(i=1;i<=n-1;i++) generisi(i);
    ispisi();

    delay(500);
    printf("\n\nBilo koji taster za sledeci broj...");
    getch();
   }
 } // obrada

void postavka(void) // ispisuje ukratko postavku zadatka
 {
  clrscr();
  printf("\nPostavka zadatka\n");
  printf("컴컴컴컴컴컴컴컴\n\n");
  printf("Program implementira generator slucajnih brojeva.\n\n");
  printf("Ulazni podatak p je verovatnoca  ( dakle : 0<=p<=1 ) i na osnovu njega racuna se");
  printf("verovatnoca q=1-p. Zatim, posmatra se pocetni vektor A(0), ... ,A(15),gde kompo-");
  printf("nente A(i) predstavljaju binarne cifre formirane tako da bude ispunjeno :\n");
  printf("P( Ai=1 ) = p i P( Ai=0 ) = q.\n\n");
  printf("Ulazni podatak n je broj iteracija  koje ce program da izvrsi i na  taj nacin da");
  printf("dobije vektor (A0,...,A15)[n]. Taj vektor se dalje tretira kao 16tobitni binarni");
  printf("broj i vrsi se njegov prevod u \"slucajni\" dekadni broj X (naravno: 0<=X<=32767).");
  printf("Vektor A[i+1] se dobija od vektora A[i] na sledeci nacin : A(i)=A(i-1) OR A(i+1)");
  printf("pri cemu su elementi sa  desne  strane iz prethodne iteracije.  U slucaju prve i");
  printf("zadnje komponente, primenjuje se : A(15)=A(0) OR A(14) i A(0)=A(1) OR A(15).\n");

  printf("\n\n\n\nBilo koji taster za povratak u glavni meni...");
  getch();
 } // obrada


int main(void)
 {
  int c=0;

  menu();
  while(c!=27) // cekaj na Escape key
   {
    c=getch();
    switch(c)
     {
      case 'p':
      case 'P': postavka(); menu();  break;

      case 'u':
      case 'U': unos();     menu();  break;

      case 'o':
      case 'O': obrada();   menu (); break;
     }
    }
  _setcursortype(_NORMALCURSOR);
  return 0;
 } // main, zapocet 01.Feb.1997.