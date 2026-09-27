/* 0005  uvod_mat.c           */
/* #include "standard.h"  */
/* 99%                    */
/*
  void n_depend    ( nzn a )
  void n_independ  ( nzn a )
  void n_vredc     ( double *v, nzn c)
  nzn  n_function  ( double ( *rad ) (), ozn ime[9], ozn dif[50], nzn arnost )
  nzn  n_operation ( double ( *rad ) (), nzn ime, ozn dif [50] )
*/
#ifndef _UVOD_MAT_
 #define _UVOD_MAT_
#include <math.h>
#include <string.h>

double saberi ( double a, double b ) { return   a + b          ; }
double oduzmi ( double a, double b ) { return   a - b          ; }
double mnozi  ( double a, double b ) { return   a * b          ; }
double deli   ( double a, double b ) { return   a / b          ; }
double sqr    ( double a        ) { return   a * a          ; }
double ident  ( double a        ) { return     a            ; }
double neg    ( double a        ) { return    -a            ; }
double fsgn   ( double a        ) { return  a>0.0?1.0:-1.0       ; }
double ceodeo ( double a        ) { return  (double)((int)(a)) ; }

int boper  =  8 ,
    bfan   = 20 ,
    dnofan = 99 ;

struct {
	int      a       ;
	char      s  [9]  ;
	double (*f) ()   ;
	char      i  [50] ;
       } fan[100]={
       {2,"+"     , saberi, "(l)#+(d)#"                          },
       {2,"-"     , oduzmi, "(l)#-(d)#"                          },
       {2,"*"     , mnozi , "((l)#)*(d)+(l)*((d)#)"              },
       {2,"/"     , deli  , "(((l)#)*(d)-(l)*((d)#))/(d)^2"      },
       {2,"%"     , fmod  , "(((l)#)*(d)-(l)*((d)#))%(d)^2"      },
       {2,"^"     , pow   , "(l)^(d)*(((l)#)*log(d)+(l)*((d)#)/(d))"  },
       {1,"+"     , ident , "(f)#"                               },
       {1,"-"     , neg   , "(-(f)#)"                            },
       /* 9 */
       {0,"",NULL,""},
       {0,"",NULL,""},{0,"",NULL,""},{0,"",NULL,""},{0,"",NULL,""},
       {0,"",NULL,""},{0,"",NULL,""},{0,"",NULL,""},{0,"",NULL,""},
       {0,"",NULL,""},{0,"",NULL,""},{0,"",NULL,""},{0,"",NULL,""},
       {0,"",NULL,""},{0,"",NULL,""},{0,"",NULL,""},{0,"",NULL,""},
       {0,"",NULL,""},{0,"",NULL,""},{0,"",NULL,""},{0,"",NULL,""},
       {0,"",NULL,""},{0,"",NULL,""},{0,"",NULL,""},{0,"",NULL,""},
       {0,"",NULL,""},{0,"",NULL,""},{0,"",NULL,""},{0,"",NULL,""},
       {0,"",NULL,""},{0,"",NULL,""},{0,"",NULL,""},{0,"",NULL,""},
       {0,"",NULL,""},{0,"",NULL,""},{0,"",NULL,""},{0,"",NULL,""},
       {0,"",NULL,""},{0,"",NULL,""},{0,"",NULL,""},{0,"",NULL,""},
       {0,"",NULL,""},{0,"",NULL,""},{0,"",NULL,""},{0,"",NULL,""},
       {0,"",NULL,""},{0,"",NULL,""},{0,"",NULL,""},{0,"",NULL,""},
       {0,"",NULL,""},{0,"",NULL,""},{0,"",NULL,""},{0,"",NULL,""},
       {0,"",NULL,""},{0,"",NULL,""},{0,"",NULL,""},{0,"",NULL,""},
       {0,"",NULL,""},{0,"",NULL,""},{0,"",NULL,""},{0,"",NULL,""},
       {0,"",NULL,""},{0,"",NULL,""},{0,"",NULL,""},{0,"",NULL,""},
       {0,"",NULL,""},{0,"",NULL,""},{0,"",NULL,""},{0,"",NULL,""},
       {0,"",NULL,""},{0,"",NULL,""},{0,"",NULL,""},
                              /* 20 */

       {1,"int"   , ceodeo, "0"                                  },
       {2,"atan2" , atan2 , "-(((l)#)*(d)-(l)*((d)#))/(((l)^2+(d)^2)" },
       {1,"sin"   , sin   , "cos(f)*((f)#)"                      },
       {1,"cos"   , cos   , "-sin(f)*((f)#)"                     },
       {1,"tan"   , tan   , "((f)#)/cos(f)^2"                    },
       {1,"exp"   , exp   , "exp(f)*((f)#)"                      },
       {2,"pow"   , pow   , "((l)^(d))*(((d)#)*log(l)+(d)*((l)#)/(l))"},
       {1,"log"   , log   , "((f)#)/(f)"                         },
       {1,"asin"  , asin  , "((f)#)/sqrt(1-(f)^2)"               },
       {1,"acos"  , acos  , "-((f)#)/sqrt(1-(f)^2)"              },
       {1,"atan"  , atan  , "((f)#)/(1+(f)^2)"                   },
       {1,"sinh"  , sinh  , "cosh(f)*((f)#)"                     },
       {1,"cosh"  , cosh  , "sinh(f)*((f)#)"                     },
       {1,"tanh"  , tanh  , "((f)#)/cosh(f)^2"                   },
       {1,"abs"   , fabs  , "sgn(f)*((f)#)"                      },
       {1,"sgn"   , fsgn  , "1.0"                                },
       {1,"sqrt"  , sqrt  , "1/2*((f)#)/sqrt(f)"                 },
       {1,"sqr"   , sqr   , "2*(f)*((f)#)"                       },
       {1,"x"     , ident , "1"                                  },
       {1,"y"     , ident , "y'"                                 }
      };
void n_depend ( int a )
 {
  fan [ dnofan ] . s [ 0 ] = a ;
  fan [ dnofan ] . i [ 0 ] = a ;
 }

void n_independ ( int a )
 {
  fan [ dnofan - 1 ] . s [ 0 ] = a ;

 }
double *mr[255];
void n_vredc ( double *v, int c) {    mr[c-'a']=v;   }

int n_function( double (*rad)() , char ime [9], char dif [50], int arnost )
 {
  if( boper + bfan > dnofan  ) return 0;
  bfan ++ ;
  fan [ dnofan - bfan ] . a = arnost ;
  strcpy( fan [ dnofan - bfan ] . s , ime ) ;
  strcpy( fan [ dnofan - bfan ] . i , dif ) ;
  fan [ dnofan - bfan ] . f =  rad ;
  return 1;

 }
int n_operation( double (*rad)(), int ime, char dif [50], int arnost )
 {
  if( bfan + boper > dnofan ) return 0;
  boper ++ ;
  fan [ boper ] . a       = 2   ;
  fan [ boper ] . s [ 0 ] = ime ;
  fan [ boper ] . s [ 1 ] = '\0' ;
  strcpy ( fan [ boper ] . i , dif ) ;
  fan [ boper ] . f       =  rad     ;
  fan [ boper ] . a       =  arnost  ;

  return 1;
 }
/* kraj uvoda_mat */

#endif