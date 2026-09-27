/*
                Mihailo Despotovic

          "Learning in Strategic Games"

                  Master Thesis

         Chapter 6: "A Case Study: Teeko"
            (implementation program)

       Center for Multidisciplinary Studies
       Department of Artificial Intelligence
    University of Belgrade, Belgrade, Yugoslavia

                1997, 1998, 1999.
*/

/* 
  teeko.c - main file for Teeko. (C) Mihailo Despotovic 1997, 1998, 1999.

  To find more, please wisit URL http://members.xoom.com/mihailod
  or write to mihailod@hotmail.com
*/

/*
  #define directives
  #include directives for standard libraries
  # include directives for custom designed modules
  int main(int, *char[]) - exits with EXIT_SUCCESS or EXIT_FAILURE
*/

/* #define directives */
#define WIDTH 4 /* width of learned positions, see update.c and defs.c */
#define MAXEVAL 2000 /* higher than the best eval, see game.c and eval.c */
#define DRAW 4 /* depth of draw detection, see draw.c */

/* standard libraries, time.h is actually included just because setting
   of the seed for the random number generator */
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

/* modules of the program */
#include "defs.c" /* globals */
#include "other.c" /* other usefull functions */
#include "fileio.c" /* file input-output */
#include "position.c" /* functions related to position representation */
#include "eval.c" /* evaluator */
#include "draw.c" /* draw detection */
#include "init.c" /* initialization and obligatory move routines */
#include "stat.c" /* statistics */
#include "screenio.c" /* screen input-output */
#include "update.c" /* updating of the memory (learning, part 1) */
#include "recall.c" /* recalling from the memory (learning, part 2) */
#include "openheur.c" /* heuristics for game opening */
#include "opening.c" /* plays the opening */
#include "searchin.c" /* minimax searching */
#include "gameheur.c" /* heuristics for the game */
#include "game.c" /* plays the whole game */


/* the main entry into the program */
int main(int argc, char *argv[])
 {
  int i;
  int pass=0, ret;
  char input[80];

  repeat=0; /* by default, mode is INTERACTIVE */

  if(parse(argc, argv)==1) usage(); /* parse command line */

  srand((unsigned int)time(NULL)); /* set seed for random numbers
                                      generator */

  creatememory(); /* if it is needed, create a global memory file */
  createstat(); /* if it is needed, create a statistic file */

  if(repeat>0) /* BATCH mode */
   {
    pausing=0;
    thinking=0;

    autointro();

    for(i=0; i<=repeat-1; i++)
     {
      printf("Playing game %d...", i+1);
      pass=0;
      ret=wholegame(pass);
      printf(" [last move was %d]", n);
      switch(ret)
       {
        case -1: defeat(); break;
        case  0: draw(); break;
        case  1: win(); break;
       }
     }
    quitgame();
   }

  /* (else) INTERACTIVE mode */
  for(;;)
   {
    menu();
    (void)fgets(input, 80, stdin);

    switch(input[0])
     {
      case '1':
      case '2':
      case '3':
       {
        switch(input[0])
         {
          case '1': pass=-1; break;
          case '2': pass= 1; break;
          case '3': pass= 0; break;
         }
        ret=wholegame(pass);
        switch(ret)
         {
          case -1: defeat(); break;
          case  0: draw(); break;
          case  1: win(); break;
          case -2: gamebreak(); break;
         }
        break;
       }
      case 'p': switcher(&pausing); break;
      case 'h': switcher(&heurplaying); break;
      case 's': switcher(&searchplaying); break;
      case 'l': switcher(&learning); break;
      case 't': switcher(&thinking); break;
      case '?': statistics(); break;
      case 'r': rules (); break;
      case '/': help(); break;
      case 'q': quitgame(); return 0; /* return avoids MSVC warning */
     }
   }
 } /* main started on November 14th, 1998., Synnyvale, CA, USA */

