/* searching.c - minimax searching (depth is 2) */

/*
  Description of search files - level1 and level2.
  (both temporary files, see explanation in update.c)

  Level1.

  The same format as file game.m (see update.c).
  File name is level1.s

  Level2.

  The same format as level1, except there is hard coded marker 'X'
  to define the end of the expanding of one position from the
  level2 file.
  File name is level2.s
*/

/*
  void makeallmoves(position_t, int, int, int) - makes all possible moves with
                                                 one piece and records them in
                                                 a given file (appends them)
  void develop1(position_t, int) - develops all possible moves from a position
                                   to a next level (level 1)
  void develop12(position_t, int) - developing from level 1 to level 2
  void develop2(int) - makes level2 file from X
  void decide(int, int) - finds minimax position
  void search(position_t, int, int) - main search entry (wrapper)
*/

void makeallmoves(position_t p, int a, int b, int t, FILE *s)
 {
  int i, j;
  position_t ptmp;

  copyposition(p, ptmp);

  for(i=-1; i<=1; i++)
   for(j=-1; j<=1; j++)
    {
     if(i==0 && j==0) continue;
     if(a+i<0 || a+i>4 || b+j<0 || b+j>4) continue;
     if(ptmp[a+i][b+j]!=0) continue;

     ptmp[a+i][b+j]=t;
     ptmp[a][b]=0;
     saveposition(ptmp, s);
     copyposition(p, ptmp);
    }
 } /* makeallmoves */

void develop1(position_t p, int t)
 {
  int i, j;

  openlevel1_write();

  for(i=0; i<=4; i++)
   for(j=0; j<=4; j++)
    {
     if(p[i][j]==t)
      makeallmoves(p, i, j, t, l1);
    }

  closelevel1();
 } /* develop1 */

void develop12(position_t p, int t)
 {
  int i, j;

  for(i=0; i<=4; i++)
   for(j=0; j<=4; j++)
    {
     if(p[i][j]==t)
      makeallmoves(p, i, j, t, l2);
    }
 } /* develop12 */

void develop2(int e)
 {
  int ret;
  position_t ptmp;

  openlevel1_read();
  openlevel2_write();

  for(;;)
   {
    ret=loadposition(ptmp, l1);
    if(ret==1) break;
    
    develop12(ptmp, e);

    putmarkerl2();
   }

  closelevel2();
  closelevel1();
 } /* develop2 */

void decide(int t, int e)
 {
  int i, j, k, ret, min, max, evals[31], tmpevals[31];
  position_t ptmp;

  openlevel2_read();

  k=0;
  for(;;)
   {
    ret=loadposition(ptmp, l2);

    if(thinking) printf(".");
    
    if(ret==1) break; /* end of file, k is the number of positions */

    i=0;
    for(;;)
     {
      if(ret==0)
       {
        tmpevals[i++]=eval(ptmp,t,e);
        ret=loadposition(ptmp, l2);
       }

      if(ret==2) /* marker 'X' has been found */
       {
        /* find mins */
        min=tmpevals[0];
        for(j=1;j<=i-1;j++) if(min>tmpevals[j]) min=tmpevals[j];
        evals[k++]=min;
        break;
       }
     }
   }

  closelevel2();

  /* find max(min_0, min_2, ..., min_k-1) */
  max=evals[0];
  for(i=1; i<=k-1; i++) if(max<evals[i]) max=evals[i];

  /* find which one has the maxmin value */
  openlevel1_read();

  for(i=0; i<=k-1; i++)
   {
    if(loadposition(ptmp, l1)==1) /* EOF cannot occur here */
     error("Unknown error during searching (loadposition failed).");; 
    
    if(eval(ptmp, t, e)==max) break;
   }

  rewind(l1);
  for(j=0;j<i-1;j++)
   if(loadposition(ptmp, l1)==1) /* EOF cannot occur here */
    error("Unknown error during searching (loadposition failed).");

  copyposition(ptmp, Xsearch);

  closelevel1();
 } /* decide */

void search(position_t ptmp, int t, int e)
 {
   develop1(ptmp, t);
   develop2(e);
   decide(t,e); 
 } /* search */

