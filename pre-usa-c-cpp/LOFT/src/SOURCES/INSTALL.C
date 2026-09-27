#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void poruka(void);

void definst(void)
{
 printf("Instalacija LOFT fajlova u C:\\LOFT ... \n\n");
 mkdir("C:\\LOFT\0");
 system("COPY A:\\EGAVGA.BGI C:\\LOFT \0");
 system("COPY A:\\TRIP.CHR   C:\\LOFT \0");
 system("COPY A:\\LOFT.HYP   C:\\LOFT \0");
 system("COPY A:\\LOFT.EXE   C:\\LOFT \0");
}

void userinst(void)
{
 char *dir="";
 printf("Unesite potpun naziv direktorijuma :\n");
 scanf("%s",dir);
 printf("Instalacija LOFT fajlova u %s \n\n",dir);
 mkdir(dir);
 system(strcat("COPY A:*.* \0",dir));
}

void greska(void)
{
 printf("\n GRESKA PRI INSTALACIJI!!!\n");
 printf("Probajte ponovo...\n");
}

void main(void)
{
 int c;

label:
 printf("\n\n\n");
 printf("          Instalacija programa LOFT\n");
 printf("         ---------------------------\n");
 printf(" 1 ... Instalacija u C:\\LOFT  [default]\n");
 printf(" 2 ... Instalacija u neki drugi direktorijum\n\n");
 printf(" 0 ... Izlaz u DOS\n\n");
 printf("              IZABERITE OPCIJU\n\n");

 while((c=getch()) != '0')
 {
  switch (c)
  {
   case '1' : {
	       definst();
	       poruka();
	       break;
	      }
   case '2' : {
	       userinst();
	       poruka();
	       break;
	      }
  }
 goto label;
 }
 exit(0);
}

void poruka(void)
{
 printf("\n O.K. Program se pokrece kucanjem LOFT u njegovom direktorijumu.\n\n");
}
