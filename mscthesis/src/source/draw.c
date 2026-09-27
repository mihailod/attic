/* draw.c - draw sequences detection */

/*
  void shift(void) - shifts left recentevals array
  int isdraw(int) - checks recentevals for periodic pattern (i.e. draw)
                    1:YES 0:NO (int is depth in checking for cycle)
                    currently, it can search in depth 2 and 3 and 4 only
*/

void shift(void)
 {
  int i;

  for(i=1; i<=DRAW*4-1; i++)
   copyposition(recentpositions[i], recentpositions[i-1]);

  copyposition(X, recentpositions[DRAW*4-1]);
 } /* shift */

int isdraw(int moves) /* accepts 2, 3 and 4 as arguments only ! */
 {
  int i, start=0, end=0, step=0;

  if(n>100) /* just in case, sometimes it happens with random players */
   {
    printf("100 moves reached! Draw!\n");
    return 1;
   }

  switch(moves)
   {
    case 2 : { start=8; end=11; step=4; break; }
    case 3 : { start=4; end= 9; step=6; break; }
    case 4 : { start=0; end= 7; step=8; break; }
   }

  for(i=start; i<=end; i++)
   { 
    if(comparepositions(recentpositions[i], recentpositions[i+step])==0)
     return 0;
   }

  return 1;
 } /* isdraw */

