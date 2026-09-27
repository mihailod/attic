/* defs.c - global definitions and variables */

/* common */
int pausing=1; /* pause mode for autoplay indicator */
int thinking=1; /* shows how is program thinking */
int learning=1; /* learning ON/OFF */
int heurplaying=1; /* heuristics ON/OFF */
int searchplaying=1; /* searching ON/OFF */
int n; /* current move number */
int p0; /* who has played first (-1 or 1, 0 denotes autoplay mode) */
int p; /* who is playing the current move */

/* batch mode specific */
int repeat; /* how many games to play in the batch mode */
int autoh1, autos1, autol1; /* heuristics, searching, learning for */
int autoh2, autos2, autol2; /* player 1 and 2 in batch mode*/
char *memp2; /* name of the memory file for player 2 in batch mode */

/* learning specific */
char learnednumber[WIDTH]; /* representation of number for learning */

/* position representation specific */
typedef int position_t[5][5]; /* definition of the position */
position_t X; /* current position */
position_t Xsearch; /* position recommended by searching */
position_t Xheur; /* position recommended by heuristics */
position_t Xlearn; /* position recommended by learning process */

/* draw detection specific */
position_t recentpositions[DRAW*4]; /* array used for draw detection */

/* files that program use */
FILE *l1; /* file for storing develed positions for search - level 1 */
FILE *l2; /* file for storing developed positions for search - level 2 */
FILE *g; /* file for recording positions of the current game (local memory) */
FILE *m; /* global memory of the program */
FILE *st; /* file for keeping statistical data */

