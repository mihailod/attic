/* dodatak za rad sa stringovima */
/* #include "alati_tc.c"         */
/* prepraviti neke delove da rade max brzo */
/* 80% */

#ifndef _STRING_EXTEND_
 #define _STRING_EXTEND_
#include <string.h>
void strfcat( char tg[],  char s1[],  char s2[] )
 {
  int i,j;

  for(i=0 ; s1[i]!='\0' ; i++    ) tg[i]=s1[i];
  for(j=0 ; s2[j]!='\0' ; i++,j++) tg[i]=s2[j]; tg[i]='\0';

 }

void strleft( char tg[],char  s[], unsigned int kraj)
 {
  unsigned int i;

  for ( i = 0 ; i <= kraj ; i++ )
   tg [ i ] = s [ i ] ;
  tg [ i ] = '\0';

 }

void strright( char tg[], char  s[], unsigned int poc)
 {
  unsigned int i;

  for ( i = 0 ; s [ poc ] !=0 ; i ++ , poc ++ )
   tg [ i ] = s [ poc ] ;
  tg [ i ] = '\0' ;

 }

void strmid( char tg[],char  s[],char poc , unsigned int kraj)
 {
  unsigned int i;

  for( i = 0 ; poc <= kraj ; i ++ , poc ++ )
   tg [ i ] = s [ poc ] ;
  tg [ i ] = '\0';

 }

void strfin ( char tg[] ,char od[], char sa[] , unsigned int pz)
 {
  unsigned int i,j;

  for(i=0;  i < pz ;           i++ ) tg[i] = od[i];
  for(j=0;  sa[j] != '\0'; j++, i++) tg[i] = sa[j];
  for(pz++; od[pz]!= '\0'; i++,pz++) tg[i] = od[pz];
  tg[i]='\0';

 }

void strin ( char tg[] , char sa[] , unsigned int pz)
{
 int i,j,ls;

 ls=strlen(sa);   i=strlen(tg);
 for(  ; i >=(int)pz      ; i--    ) tg[ i+ls ]=tg[ i ] ;
 for( i=0 , j=pz   ; sa[i]!='\0' ; i++,j++) tg[ j    ]=sa[ i ] ;

}
void strout ( char tg[] , char od[] , unsigned int poc , unsigned int kraj )
{
 unsigned int i;

 for ( i = 0 ; i < poc ; i ++ ) tg [ i ] = od [ i ] ;

 for ( kraj ++ ; od [ kraj ] != '\0' ; kraj ++ , i ++)
  tg [ i ] = od [ kraj ] ;
 tg [ i ] = '\0' ;

}
/* kraj string_d */
#endif