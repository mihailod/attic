/* eval.c - position evaluation */

/*
  int four(position_t, int) - is given position is a win 1:WIN 0:NO
  int three(position_t, int) - is there "three-in-a-row" pattern 1:YES 0:NO
  int eval(position_t, int, int) - returns evaluation of the position in
                                   symmetric interval
*/

int four(position_t p, int t) /* 1=victory for t, 0=non victory */
 {
  int i, j, summa;
  position_t ptmp;

  copyposition(p, ptmp);
  translateposition(ptmp, t);

  /* check rows */
  for(i=0; i<=4; i++)
   {
    summa=0;
    for(j=0; j<=4; j++)
     {
      summa+=ptmp[i][j];
     }
    if(summa==4*t && (ptmp[i][0]==0 || ptmp[i][4]==0)) return 1;
   }

  /* check columns */
  for(j=0; j<=4; j++)
   {
    summa=0;
    for(i=0; i<=4; i++)
     {
      summa+=ptmp[i][j];
     }
    if(summa==4*t && (ptmp[0][j]==0 || ptmp[4][j]==0)) return 1;
   }

  /* check diagonals */
  if(ptmp[3][0]==t && ptmp[2][1]==t && ptmp[1][2]==t && ptmp[0][3]==t)return 1;
  if(ptmp[4][1]==t && ptmp[3][2]==t && ptmp[2][3]==t && ptmp[1][4]==t)return 1;
  if(ptmp[4][0]==t && ptmp[3][1]==t && ptmp[2][2]==t && ptmp[1][3]==t)return 1;
  if(ptmp[3][1]==t && ptmp[2][2]==t && ptmp[1][3]==t && ptmp[0][4]==t)return 1;

  if(ptmp[1][0]==t && ptmp[2][1]==t && ptmp[3][2]==t && ptmp[4][3]==t)return 1;
  if(ptmp[0][1]==t && ptmp[1][2]==t && ptmp[2][3]==t && ptmp[3][4]==t)return 1;
  if(ptmp[0][0]==t && ptmp[1][1]==t && ptmp[2][2]==t && ptmp[3][3]==t)return 1;
  if(ptmp[1][1]==t && ptmp[2][2]==t && ptmp[3][3]==t && ptmp[4][4]==t)return 1;

  /* check squares */
  for(i=0; i<=3; i++)
   for(j=0; j<=3; j++)
    {
     if(ptmp[i][j]==t && ptmp[i+1][j]==t &&
        ptmp[i][j+1]==t && ptmp[i+1][j+1]==t)
      return 1;
    }

  /* otherwise, it is a non-winning position */
  return 0;
 } /* four */

int three(position_t p, int t)
 {
  int i, j, summa;
  position_t ptmp;

  /* check if program has a three in a row */
  copyposition(p, ptmp);
  translateposition(ptmp, t);

  /* check rows */
  for(i=0; i<=4; i++)
   {
    summa=0;
    for(j=0; j<=4; j++)
     {
      summa+=ptmp[i][j];
     }
    if(summa==3*t && (ptmp[i][0]==0 && ptmp[i][1]==0 ||
		    ptmp[i][0]==0 && ptmp[i][4]==0 ||
		    ptmp[i][3]==0 && ptmp[i][4]==0)) return 1;
   }

  /* check columns */
  for(j=0; j<=4; j++)
   {
    summa=0;
    for(i=0; i<=4; i++)
     {
      summa+=ptmp[i][j];
     }
    if(summa==3*t && (ptmp[0][j]==0 && ptmp[1][j]==0 ||
		    ptmp[0][j]==0 && ptmp[4][j]==0 ||
		    ptmp[3][j]==0 && ptmp[4][j]==0)) return 1;
   }

  /* check diagonals, but only for potential fours */
  if(ptmp[3][0]==t && ptmp[2][1]==t && ptmp[1][2]==t) return 1;
  if(ptmp[2][1]==t && ptmp[1][2]==t && ptmp[0][3]==t) return 1;

  if(ptmp[4][0]==t && ptmp[3][1]==t && ptmp[2][2]==t) return 1;
  if(ptmp[3][1]==t && ptmp[2][2]==t && ptmp[1][3]==t) return 1;
  if(ptmp[2][2]==t && ptmp[1][3]==t && ptmp[0][4]==t) return 1;

  if(ptmp[4][1]==t && ptmp[3][2]==t && ptmp[2][3]==t) return 1;
  if(ptmp[3][2]==t && ptmp[2][3]==t && ptmp[1][4]==t) return 1;

  if(ptmp[3][4]==t && ptmp[2][3]==t && ptmp[1][2]==t) return 1;
  if(ptmp[2][3]==t && ptmp[1][2]==t && ptmp[0][1]==t) return 1;

  if(ptmp[4][4]==t && ptmp[3][3]==t && ptmp[2][2]==t) return 1;
  if(ptmp[3][3]==t && ptmp[2][2]==t && ptmp[1][1]==t) return 1;
  if(ptmp[2][2]==t && ptmp[1][1]==t && ptmp[0][0]==t) return 1;

  if(ptmp[4][3]==t && ptmp[3][2]==t && ptmp[2][1]==t) return 1;
  if(ptmp[3][2]==t && ptmp[2][1]==t && ptmp[1][0]==t) return 1;

  /* check squares */
  for(i=0; i<=3; i++)
   {
    summa=0;
    for(j=0; j<=3; j++)
     {
      summa=ptmp[i][j] + ptmp[i+1][j] + ptmp[i][j+1] + ptmp[i+1][j+1];
      if(summa==3*t) return 1;
     }
   }

  /* there is no three in a row position */
  return 0;
 } /* three */

int eval(position_t p, int t, int e)
 {
  /* EVAL = evt*TACTIC + evs*STRATEGY
     TACTIC = ta1*hasfour + ta2*hasthree
     STRATEGY = st0*center + st1*circle1 + st2*circle2 */
 
  int i, j, ret;
  int evs=1, evt=1;
  int ta1=1000, ta2=15;
  int st0=6, st1=3, st2=0;

  int tactic, strategy;
  int hasfour=0, hasthree=0;
  int center=0, circle1=0, circle2=0;
  
  /* tactic */
  if(four(p, t)==1) hasfour=1;
  if(four(p, e)==1) hasfour=-1;

  if(three(p, t)) hasthree++;
  if(three(p, e)) hasthree--;

  tactic = ta1*hasfour + ta2*hasthree;

  /* strategy*/
  if(p[2][2]==t) center=1;
   else if(p[2][2]==e) center=-1;

  for(i=1; i<=3; i++)
   for(j=1; j<=3; j++)
    {
     if(i==2 && j==2) continue;

     if(p[i][j]==t) circle1++;
     if(p[i][j]==e) circle1--;
    }

  strategy = st0*center + st1*circle1 + st2*circle2;

  /* eval */
  ret = evt*tactic + evs*strategy;

  return ret;
 } /* eval */

