/* init.c - first init and things to do after every move */

/*
  void init(int) - init of global variables, sets p0
  void nextinit(void) - increments move counter, switches players
*/

void init(int whomoves)
 {
  n=1; /* set move counter */
  p0=whomoves; /* who has played the first move */
  p=(whomoves==0 ? 1 : whomoves); /* who plays the current move */
  makeemptyposition(X);
 } /* init */

void nextinit(void)
 {
  if(n>=9) shift(); /* record positions for draw detection */

  n++; /* increment move counter */
  p*=(-1); /* set current player */
 } /* nextinit */

