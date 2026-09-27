/* 0003 pocetak dif_mat.c     */
/* #include "standard.h"      */
/* #include "string_d.c"      */
/* #include "sredi.c          */
/* 99% */

 #include "c:\other\pmf\nm\diff\uvod_mat.c"
 #include "c:\other\pmf\nm\diff\string_d.c"
int dif_binar ( char  aa [ ] , char  da [ ]  )
 {
  char cf, r [ 150 ] , l [ 150 ] , kal [ 2 ];
  int zg , i , j ;

  for ( i = 0 ; i < boper ; i++ )
   {
    if( fan[i].a != 2 ) continue ;
    for( cf = fan [ i ] . s [ 0 ] , zg = 0 , j =( strlen ( aa ) - 1 ) ; j!=0 ; j--)
     {
      if ( aa [ j ] == '(' ) zg++; if ( aa [ j ] == ')' ) zg--;
      if( ( cf == aa [ j ] )  &&  ( zg == 0) )
       {
        strleft  ( l , aa , j - 1 ) ;
        strright ( r , aa , j + 1 ) ;
        for( da[ 0 ] = '\0' , kal [ 1 ] = '\0' , j = 0; j < strlen( fan[i] . i ); j++)
         {
           switch ( kal [ 0 ]  = fan [ i ] . i [ j ] )
            {
             case( 'l' ): if ( ( fan [ i ] . i [ j - 1 ] == '(' )
                           &&  ( fan [ i ] . i [ j + 1 ] == ')' ) ) strcat ( da , l );
			   else   strcat ( da , kal ) ;
              break;
             case( 'd' ): if ( ( fan [ i ] . i [ j - 1 ] == '(' )
                           &&  ( fan [ i ] . i [ j + 1 ] == ')' ) ) strcat ( da , r );
			   else strcat ( da , kal ) ;
              break;
             default    : strcat ( da , kal ) ;
         }  }
        return 1;
   } }                            }
  return 0;
 }

int dif_kompozicija ( char  aa [ ] , char  da [ ]  )
 {
  char nf [ 10 ] , pod [ 100 ] ,
       kal [ 2 ] , l [ 100 ] , r [ 100 ];
  int zg;
  unsigned int i,j, duzaa ;

  for( j = 0 ;  ( j < 9 )  &&  aa [ j ] != '(' ; j ++ )
   nf [ j ] = aa [ j ] ;
  nf [ j ] = '\0' ;
  for( i = dnofan ;  strcmp ( nf , fan [ i ] . s) !=0 && ( i>(dnofan-bfan) ); i--);
  if ( i == ( dnofan-bfan ) )  return 0;
  duzaa = strlen ( aa ) ;
  if( ( aa [ j ] != '(' )  ||  ( aa [ duzaa - 1 ] != ')' ) ) return 0;
  strmid ( pod , aa , j + 1 , duzaa - 2 ) ;
  switch( fan [ i ] . a )
   {
    case ( 1 ) :
     for( da [ 0 ] = '\0' , kal [ 1 ] = '\0',j=0 ; j<strlen ( fan [ i ] . i ) ; j++)
      {
       kal [ 0 ] = fan [ i ] . i [ j ] ;
       if(
             ( fan [ i ] . i [ j     ] == 'f' )
          && ( fan [ i ] . i [ j - 1 ] == '(' )
          && ( fan [ i ] . i [ j + 1 ] == ')' )
         )   strfcat( da , da , pod ) ;   else  strfcat ( da , da , kal ) ;
      } break;
    case(2):
     for( zg = 0 , j = 0 ; j < strlen ( pod ) ; j ++ )
      {
       if ( pod [ j ] == '(' ) zg++ ;  if ( pod [ j ] == ')' ) zg-- ;
       if(  ( ',' == pod [ j ] )  &&  ( zg == 0 )  )
        {
         strleft ( l , pod , j - 1 ) ;  strright ( r , pod , j + 1 );
         for( da [ 0 ] = '\0', kal [ 1 ] = '\0', j = 0; j < strlen ( fan [ i ] . i ) ; j ++)
          {
           switch( kal [ 0 ] = fan [ i ] . i   [ j ] )
            {
             case( 'l' ) : if (   ( fan [ i ] . i [ j - 1 ] == '(' )
                               && ( fan [ i ] . i [ j + 1 ] == ')' )
                              ) strcat ( da , l ) ;
                           else    strcat ( da , kal ) ;
              break;
             case( 'd' ) : if (   ( fan [ i ] . i [ j - 1 ] == '(' )
                               && ( fan [ i ] . i [ j + 1 ] == ')' )
                             ) strcat(da,r);
                           else    strcat ( da , kal ) ;
              break;
             default    :  strcat ( da , kal ) ;
   }  } } } }

  return 1;

 }

int dif_tablica ( char aa [ ] , char  da [ ]  )
 {

  if ( strcmp ( aa , fan [ dnofan - 1 ] . s ) == 0 )
   {
    strcpy ( da , "1" ) ;  return 1 ;
   }
  if ( strcmp ( aa , fan [ dnofan     ] . s) == 0 )
   {
    strcpy ( da , fan [ dnofan ] . i ) ;   return 1 ;
   }
  return 0;

 }

int dif_nadji( char  aa [ ] , unsigned int  * poc ,unsigned int  * kraj )
 {
  int i , zg;

  for( i = 0 ; ( i < strlen ( aa ) ) && ( aa [ i ] !='#' ) ; i ++ ) ;
  if ( aa [ i ] != '#' ) return 0;
  *kraj = i - 2  ;
  for( zg = 1 ,  i -= 2 ; ( i >= 0 ) && ( zg != 0 ) ; i -- )
   {
    if ( aa [ i ] == '(' ) zg--; if ( aa [ i ] == ')' ) zg++;
   }
  *poc = i + 2 ;
  return  1 ;
 }

int dif_unar(char  *a , char  *d )
 {
  char pod[255],kal[2];
  unsigned int i,j,du ; //,da
 // int zg;

 // da=strlen(a);
  for ( i = 0 ; i < boper ; i++ )
   if( fan[i].a == 1)
    if ( a[0] == fan[i].s[0] )
     {
      strright(pod,a,1); du=strlen(fan [ i ] . i );
      for( d [ 0 ] = '\0' , kal [ 1 ] = '\0',j=0 ; j < du ; j++)
       {
        kal [ 0 ] = fan [ i ] . i [ j ] ;
        if(
              ( fan [ i ] . i [ j     ] == 'f' )
           && ( fan [ i ] . i [ j - 1 ] == '(' )
           && ( fan [ i ] . i [ j + 1 ] == ')' )
          ) strfcat( d, d, pod ) ;  else  strfcat ( d, d, kal ) ;
       }
      return 1;
     }

  return 0;
 }

int dif_testdif ( char  *a , char  *d )
 {

  if ( dif_binar       ( a , d ) ) return  1 ;
  if ( dif_tablica     ( a , d ) ) return  1 ;
  if ( dif_kompozicija ( a , d ) ) return  1 ;
  if ( dif_unar        ( a , d ) ) return  1 ;

  return  0 ;
 }

void izvod ( char  izr[] , char  dif[] )
 {
  char haa [ 256 ] ,  had [ 256 ] /*, le [ 100 ] , de [ 100 ] */ ;
  unsigned int st,ed;

  strfcat ( dif , "(" , izr ) ; strcat ( dif , ")#" ) ;
  while ( dif_nadji ( dif , & st, & ed ) )
   {
    strmid ( haa , dif , st , ed ) ;
    /*  printf("nasao pod dif %s od *%i* do *%i*\n",haa,st,ed);  */
    ponovi_testiranje:
    if ( dif_testdif  ( haa , had ) )
     {
      strout ( dif , dif , st - 1 , ed + 2 ) ; strin  ( dif , had , st - 1 ) ;
     }
    else
     {
      if ( ( haa [ 0 ] == '(' ) && ( haa [ strlen ( haa ) - 1 ] == ')' ) )
       {
        strmid ( haa , haa , 1 , strlen ( haa ) - 2 ) ;
        goto ponovi_testiranje;
       }
      strout ( dif , dif , st - 1 , ed + 2 ) ; strin  ( dif , "0" , st - 1  ) ;
     }
   /*  printf ( "medju dif %s\n" , dif ) ;*/
   }
 }

/* kraj dif_mata */