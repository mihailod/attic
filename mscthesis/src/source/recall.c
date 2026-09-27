/* recall.c - recalling the best move from the memory */

/*
  void recall(int, int) - tries to find the best successor from the memory
*/

void recall(int t, int e)
 {
  int i, j, k, ret, won, lost, bestdiff, diffs[32], bestdiffs[32], besteval;
  position_t stored, istored, positions[32], bestpositions[32];

  j=0;
  openmemory_readwrite(); /* assignes to m handle to a memory */
                          /* here goes context switch for player 2's
                          /* memory ! */
  for(;;)
   {
    ret=loadposition(stored, m);
    if(ret==1) break;
    invertposition(stored, istored);

    if(successor(stored) || successor(istored)) /* successor! */
     {
      if(thinking) printf("."); /* give some feedback */

      /* how many times this position lead X to win? */
      for(i=0; i<=WIDTH-1; i++) learnednumber[i]=' '; /* clear number */
      getnumber(m);
      won=atoi(learnednumber);

      /* how many times this position lead O to win? */
      for(i=0; i<=WIDTH-1; i++) learnednumber[i]=' '; /* clear number */
      getnumber(m);
      lost=atoi(learnednumber);
      
      /* determine difference depending of X / O */
      if(successor(stored))
       {
        diffs[j]=won-lost;
        copyposition(stored, positions[j]);
       }
      else
       {
        diffs[j]=lost-won;
        copyposition(istored, positions[j]);
       }
      j++;
     }

    else /* not a successor, skip his data then */
     {
      skip(m);
      skip(m);
     }
   }

  closememory();

  /* j is now the number of the successors in memory */
  if(j==0) { Xlearn[0][0]=9; return; } /* couldn't find any */
  if(j==1) { copyposition(positions[0], Xlearn); return; } /* just one found */

  /* more than one; eval is going to decide */
  /* first, find the max diff */
  bestdiff=diffs[0];
  for(i=0; i<=j-1; i++)
   {
    if(diffs[i]>bestdiff)
     bestdiff=diffs[i];
   }

  /* what if more than one of positions have the same (max) diff ?
     well, then, form an array of positions with that same diff
     and let the evaluator decide between them... */

  /* first, find all of positions with the same (max) diff */
  k=0;
  for(i=0; i<=j-1; i++)
   {
    if(diffs[i]==bestdiff)
     {
      bestdiffs[k]=diffs[i];
      copyposition(positions[i], bestpositions[k]);
      k++;
     }
   }

  /* then, let the eval decide between them */
  besteval=eval(bestpositions[0], t, e);
  copyposition(bestpositions[0], Xlearn);
  for(i=1; i<=k-1; i++)
   {
    ret=eval(bestpositions[i], t, e);
    if(ret>besteval)
     {
      besteval=ret;
      copyposition(bestpositions[i], Xlearn);
     }
   }
 } /* recall */

