#include <stdio.h>
#include <string.h>
#include <ctype.h>
#include "string_d.c"
#include "uvod_mat.c"
#include "dif_mat.c"
void usage( char *s )
 {
  printf("\n%s [ -nezavisna  -zavisna ] funkcija",s);
  printf("\nPrimer: IZVOD -x -y y*x");
 }
void main (  int argc, char *argv[]   )
 {
  int position;
  char df[1000];

  switch( argc )
   {
    case(2):
     printf("po definiciji x - nezavisna y - zavisna\n");
     n_depend('y');n_independ('x'); position = 1 ; break;
    case(4):
     position = 3;
     if(argv[1][0]!='-') { usage(argv[0]); return; }
     if(argv[2][0]!='-') { usage(argv[0]); return; }
     n_depend(argv[2][1]);n_independ(argv[1][1]); break;


/* poziva se sa n_depend(char (npr "y")) <== setovanje po cemu se diff.
   a onda: n_independ(char (npr "x")) <== nezavisna promenljiva */


    default: usage(argv[0]); return;
   }

  printf("\nFunkcija %s",argv[position]);
  izvod(argv[position],df);

/*  izvod( char * (f-ja koja se diff.),char * (njen izvod)
    gde df nije u sredjenom obliku  */

  printf("\ndf=%s;\n",df);
 }