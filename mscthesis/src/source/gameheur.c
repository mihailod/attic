/* gameheur.c - game heuristics */

/*
  int play(int, int, int, int, int, int, int, int, int) - tries to play,
                                                          1:DID 0:DIDN'T
  int canplay(int, int, int, int, int, int, int, int, int) - just checks,
                                                             1:CAN 0:CAN'T
  int patternfor4(int, int, int, int, int, int, int, int, int) - checks for
                                                                 pattern
                                                                 1:YES 0:NO
  int make4(int) - tries to make 4 in a row 1:OK 0:DIDN'T
  int avoid4(int, int) - tries to avoid 4 in a row
  int makedouble3(int, int) - tries to make 3 in a row with two ways for 4
  int makenondefendable3(int, int) - tries to make non-defendable 3
  int avoiddouble3(int, int) - tries to avoid 3 in a row with two ways for 4
  int avoidnondefendable3(int, int) - tries to avoid nondefendable 3 in a row
  void playrandom(int) - plays completely random move
*/

int play(int a, int b, int t, int x1, int y1, int x2, int y2, int x3, int y3)
 {
  int i, j;

  /* maybe it should be enhanced with : if this piece belongs to some
     pattern then not move it! */

  if(X[a][b]!=0) return 0;

  for(i=-1; i<=1; i++)
   for(j=-1; j<=1; j++)
    {
     if(i==0 && j==0) continue;
     if(a+i<0 || a+i>4 || b+j<0 || b+j>4) continue;
     
     if(x1>0)
      if(a+i==x1 && b+j==y1) continue;

     if(x2>0)
      if(a+i==x2 && b+j==y2) continue;

     if(x3>0)
      if(a+i==x3 && b+j==y3) continue;

     if(X[a+i][b+j]==t)
      {
       X[a+i][b+j]=0;
       X[a][b]=t;
       return 1;
      }
    }

  return 0;
 } /* play */

int canplay(int a,int b,int t,int x1,int y1,int x2,int y2,int x3,int y3)
 {
  int i,j;

  if(X[a][b]==t) return 1;

  for(i=-1; i<=1; i++)
   for(j=-1; j<=1; j++)
    {
     if(i==0 && j==0) continue;
     if(a+i<0 || a+i>4 || b+j<0 || b+j>4) continue;
     
     if(x1>0)
      if(a+i==x1 && b+j==y1) continue;

     if(x2>0)
      if(a+i==x2 && b+j==y2) continue;

     if(x3>0)
      if(a+i==x3 && b+j==y3) continue;

     if(X[a+i][b+j]==t)
      return 1;
    }
  return 0;
 } /* canplay */

int patternfor4(int t,int x1,int y1,int x2,int y2,int x3,int y3,int x4,int y4)
 {
  if(X[x1][y1]==t && X[x2][y2]==t && X[x3][y3]==t && X[x4][y4]==0)
   return 1;   
  else
   return 0;
 } /* patternfor4 */

int patternfor3(int t,int x1,int y1,int x2,int y2,int x3,int y3)
 {
  if(X[x1][y1]==t && X[x2][y2]==t && X[x3][y3]==0)
   return 1;
  else
   return 0;
 } /* patternfor3 */

int make4(int t)
 {
  int i, j;

  /* horizontal */
  for(i=0; i<=4; i++)
   {
    if(patternfor4(t,i,0,i,1,i,2,i,3))
     if(play(i,3,t,i,2,-1,-1,-1,-1)) return 1;
    if(patternfor4(t,i,2,i,3,i,4,i,1))
     if(play(i,1,t,i,2,-1,-1,-1,-1)) return 1;
    if(patternfor4(t,i,1,i,2,i,3,i,0))
     if(play(i,0,t,i,1,-1,-1,-1,-1)) return 1;
    if(patternfor4(t,i,1,i,2,i,3,i,4))
     if(play(i,4,t,i,3,-1,-1,-1,-1)) return 1;
    if(patternfor4(t,i,0,i,2,i,3,i,1))
     if(play(i,1,t,i,0,i,2,-1,-1)) return 1;
    if(patternfor4(t,i,0,i,1,i,3,i,2))
     if(play(i,2,t,i,1,i,3,-1,-1)) return 1;
    if(patternfor4(t,i,1,i,2,i,4,i,3))
     if(play(i,3,t,i,2,i,4,-1,-1)) return 1;
    if(patternfor4(t,i,1,i,3,i,4,i,2))
     if(play(i,2,t,i,1,i,3,-1,-1)) return 1;
   }

  /* vertical */
  for(j=0; j<=4; j++)
   {
    if(patternfor4(t,0,j,1,j,2,j,3,j))
     if(play(3,j,t,2,j,-1,-1,-1,-1)) return 1;
    if(patternfor4(t,2,j,3,j,4,j,1,j))
     if(play(1,j,t,2,j,-1,-1,-1,-1)) return 1;
    if(patternfor4(t,1,j,2,j,3,j,0,j))
     if(play(0,j,t,1,j,-1,-1,-1,-1)) return 1;
    if(patternfor4(t,1,j,2,j,3,j,4,j))
     if(play(4,j,t,3,j,-1,-1,-1,-1)) return 1;
    if(patternfor4(t,0,j,2,j,3,j,1,j))
     if(play(1,j,t,0,j,2,j,-1,-1)) return 1;
    if(patternfor4(t,0,j,1,j,3,j,2,j))
     if(play(2,j,t,1,j,3,j,-1,-1)) return 1;
    if(patternfor4(t,1,j,2,j,4,j,3,j))
     if(play(3,j,t,2,j,4,j,-1,-1)) return 1;
    if(patternfor4(t,1,j,3,j,4,j,2,j))
     if(play(2,j,t,1,j,3,j,-1,-1)) return 1;
   }

  /* diagonal */
  /* up */ /* left -> right */
  if(patternfor4(t,0,1,1,2,2,3,3,4))
   if(play(3,4,t,2,3,-1,-1,-1,-1)) return 1;
  if(patternfor4(t,1,2,2,3,3,4,0,1))
   if(play(0,1,t,1,2,-1,-1,-1,-1)) return 1;
  if(patternfor4(t,0,1,1,2,3,4,2,3))
   if(play(2,3,t,1,2,3,4,-1,-1)) return 1;
  if(patternfor4(t,0,1,2,3,3,4,1,2))
   if(play(1,2,t,0,1,2,3,-1,-1)) return 1;

  /* down */
  if(patternfor4(t,1,0,2,1,3,2,4,3))
   if(play(4,3,t,3,2,-1,-1,-1,-1)) return 1;
  if(patternfor4(t,2,1,3,2,4,3,1,0))
   if(play(1,0,t,2,1,-1,-1,-1,-1)) return 1;
  if(patternfor4(t,1,0,2,1,4,3,3,4))
   if(play(3,4,t,2,1,4,3,-1,-1)) return 1;
  if(patternfor4(t,1,0,3,4,4,3,2,1))
   if(play(2,1,t,1,0,3,4,-1,-1)) return 1;

  /* main */  
  if(patternfor4(t,0,0,1,1,2,2,3,3))
   if(play(3,3,t,2,2,-1,-1,-1,-1)) return 1;
  if(patternfor4(t,1,1,2,2,3,3,0,0))
   if(play(0,0,t,1,1,-1,-1,-1,-1)) return 1;
  if(patternfor4(t,0,0,2,2,3,3,1,1))
   if(play(1,1,t,0,0,2,2,-1,-1)) return 1;
  if(patternfor4(t,0,0,1,1,3,3,2,2))
   if(play(2,2,t,1,1,3,3,0,0)) return 1;
  if(patternfor4(t,1,1,2,2,3,3,4,4))
   if(play(4,4,t,3,3,-1,-1,-1,-1)) return 1;
  if(patternfor4(t,1,1,2,2,4,4,3,3))
   if(play(3,3,t,2,2,4,4,-1,-1)) return 1;
  if(patternfor4(t,1,1,3,3,4,4,2,2))
   if(play(2,2,t,1,1,3,3,-1,-1)) return 1;
  if(patternfor4(t,2,2,3,3,4,4,1,1))
   if(play(1,1,t,2,2,-1,-1,-1,-1)) return 1;

  /* up */ /* right -> left */
  if(patternfor4(t,0,3,1,2,2,1,3,0))
   if(play(3,0,t,2,1,-1,-1,-1,-1)) return 1;
  if(patternfor4(t,1,2,2,1,3,0,0,3))
   if(play(0,3,t,1,2,-1,-1,-1,-1)) return 1;
  if(patternfor4(t,0,3,1,2,3,0,2,1))
   if(play(2,1,t,1,2,3,0,-1,-1)) return 1;
  if(patternfor4(t,0,3,2,1,3,0,1,2))
   if(play(1,2,t,0,3,2,1,-1,-1)) return 1;

  /* down */
  if(patternfor4(t,1,4,2,3,3,2,4,1))
   if(play(4,1,t,3,2,-1,-1,-1,-1)) return 1;
  if(patternfor4(t,2,3,3,2,4,1,1,4))
   if(play(1,4,t,2,3,-1,-1,-1,-1)) return 1;
  if(patternfor4(t,1,4,2,3,4,1,3,0))
   if(play(3,0,t,2,3,4,1,-1,-1)) return 1;
  if(patternfor4(t,1,4,3,0,4,1,2,3))
   if(play(2,3,t,1,4,3,0,-1,-1)) return 1;

  /* main */  
  if(patternfor4(t,0,4,1,3,2,2,3,1))
   if(play(3,1,t,2,2,-1,-1,-1,-1)) return 1;
  if(patternfor4(t,1,3,2,2,3,1,0,4))
   if(play(0,4,t,1,3,-1,-1,-1,-1)) return 1;
  if(patternfor4(t,0,4,2,2,3,1,1,3))
   if(play(1,3,t,0,4,2,2,-1,-1)) return 1;
  if(patternfor4(t,0,4,1,3,3,1,2,2))
   if(play(2,2,t,1,3,3,1,0,0)) return 1;
  if(patternfor4(t,1,3,2,2,3,1,4,0))
   if(play(4,0,t,3,1,-1,-1,-1,-1)) return 1;
  if(patternfor4(t,1,3,2,2,4,0,3,1))
   if(play(3,1,t,2,2,4,0,-1,-1)) return 1;
  if(patternfor4(t,1,3,3,1,4,0,2,2))
   if(play(2,2,t,1,3,3,1,-1,-1)) return 1;
  if(patternfor4(t,2,2,3,1,4,0,1,3))
   if(play(1,3,t,2,2,-1,-1,-1,-1)) return 1;

  /* square */
  for(i=0; i<=3; i++)
   for(j=0; j<=3; j++)
    {
     if(patternfor4(t,i,j,i,j+1,i+1,j,i+1,j+1))
      if(play(i+1,j+1,t,i,j,i,j+1,i+1,j)) return 1;
     if(patternfor4(t,i,j,i,j+1,i+1,j+1,i+1,j))
      if(play(i+1,j,t,i,j,i,j+1,i+1,j+1)) return 1;
     if(patternfor4(t,i,j,i+1,j,i+1,j+1,i,j+1))
      if(play(i,j+1,t,i,j,i+1,j,i+1,j+1)) return 1;
     if(patternfor4(t,i,j+1,i+1,j,i+1,j+1,i,j))
      if(play(i,j,t,i,j+1,i+1,j,i+1,j+1)) return 1;
    }

  return 0;
 } /* make4 */

int avoid4(int t, int e)
 {
  /* what if multiple choices are available ? random? heuristic?
     for now, let's just play "the first" choice */

  /* anyway, the learning process should override these decisions
     in a long run */

  /* also, sometimes it will not try to prevent
     because of middle if (if it IS threat, it will) */
  
  /* this stands for EVERY move except make4 and makedouble3 */

  int i, j;

  /* horizontal */
  for(i=0; i<=4; i++)
   {
    if(patternfor4(e,i,0,i,1,i,2,i,3))
     if(canplay(i,3,e,i,2,-1,-1,-1,-1))
      if(play(i,3,t,i,2,-1,-1,-1,-1)) return 1;
    if(patternfor4(e,i,2,i,3,i,4,i,1))
     if(canplay(i,1,e,i,2,-1,-1,-1,-1))
      if(play(i,1,t,i,2,-1,-1,-1,-1)) return 1;
    if(patternfor4(e,i,1,i,2,i,3,i,0))
     if(canplay(i,0,e,i,1,-1,-1,-1,-1))
      if(play(i,0,t,i,1,-1,-1,-1,-1)) return 1;
    if(patternfor4(e,i,1,i,2,i,3,i,4))
     if(canplay(i,4,e,i,3,-1,-1,-1,-1))
      if(play(i,4,t,i,3,-1,-1,-1,-1)) return 1;
    if(patternfor4(e,i,0,i,2,i,3,i,1))
     if(canplay(i,1,e,i,0,i,2,-1,-1))
      if(play(i,1,t,i,0,i,2,-1,-1)) return 1;
    if(patternfor4(e,i,0,i,1,i,3,i,2))
     if(canplay(i,2,e,i,1,i,3,-1,-1))
      if(play(i,2,t,i,1,i,3,-1,-1)) return 1;
    if(patternfor4(e,i,1,i,2,i,4,i,3))
     if(canplay(i,3,e,i,2,i,4,-1,-1))
      if(play(i,3,t,i,2,i,4,-1,-1)) return 1;
    if(patternfor4(e,i,1,i,3,i,4,i,2))
     if(canplay(i,2,e,i,1,i,3,-1,-1))
      if(play(i,2,t,i,1,i,3,-1,-1)) return 1;
   }

  /* vertical */
  for(j=0; j<=4; j++)
   {
    if(patternfor4(e,0,j,1,j,2,j,3,j))
     if(canplay(3,j,e,2,j,-1,-1,-1,-1))
      if(play(3,j,t,2,j,-1,-1,-1,-1)) return 1;
    if(patternfor4(e,2,j,3,j,4,j,1,j))
     if(canplay(1,j,e,2,j,-1,-1,-1,-1))
      if(play(1,j,t,2,j,-1,-1,-1,-1)) return 1;
    if(patternfor4(e,1,j,2,j,3,j,0,j))
     if(canplay(0,j,e,1,j,-1,-1,-1,-1))
      if(play(0,j,t,1,j,-1,-1,-1,-1)) return 1;
    if(patternfor4(e,1,j,2,j,3,j,4,j))
     if(canplay(4,j,e,3,j,-1,-1,-1,-1))
      if(play(4,j,t,3,j,-1,-1,-1,-1)) return 1;
    if(patternfor4(e,0,j,2,j,3,j,1,j))
     if(canplay(1,j,e,0,j,2,j,-1,-1))
      if(play(1,j,t,0,j,2,j,-1,-1)) return 1;
    if(patternfor4(e,0,j,1,j,3,j,2,j))
     if(canplay(2,j,e,1,j,3,j,-1,-1))
      if(play(2,j,t,1,j,3,j,-1,-1)) return 1;
    if(patternfor4(e,1,j,2,j,4,j,3,j))
     if(canplay(3,j,e,2,j,4,j,-1,-1))
      if(play(3,j,t,2,j,4,j,-1,-1)) return 1;
    if(patternfor4(e,1,j,3,j,4,j,2,j))
     if(canplay(2,j,e,1,j,3,j,-1,-1))
      if(play(2,j,t,1,j,3,j,-1,-1)) return 1;
   }

  /* diagonal */
  /* up */ /* left -> right */
  if(patternfor4(e,0,1,1,2,2,3,3,4))
   if(canplay(3,4,e,2,3,-1,-1,-1,-1))
    { if(play(3,4,t,2,3,-1,-1,-1,-1)) return 1; }
  if(patternfor4(e,1,2,2,3,3,4,0,1))
   if(canplay(0,1,e,1,2,-1,-1,-1,-1))
    { if(play(0,1,t,1,2,-1,-1,-1,-1)) return 1; }
  if(patternfor4(e,0,1,1,2,3,4,2,3))
   if(canplay(2,3,e,1,2,3,4,-1,-1))
    { if(play(2,3,t,1,2,3,4,-1,-1)) return 1; }
  if(patternfor4(e,0,1,2,3,3,4,1,2))
   if(canplay(1,2,e,0,1,2,3,-1,-1))
    { if(play(1,2,t,0,1,2,3,-1,-1)) return 1; }

  /* down */
  if(patternfor4(e,1,0,2,1,3,2,4,3))
   if(canplay(4,3,e,3,2,-1,-1,-1,-1))
    if(play(4,3,t,3,2,-1,-1,-1,-1)) return 1;
  if(patternfor4(e,2,1,3,2,4,3,1,0))
   if(canplay(1,0,e,2,1,-1,-1,-1,-1))
    if(play(1,0,t,2,1,-1,-1,-1,-1)) return 1;
  if(patternfor4(e,1,0,2,1,4,3,3,4))
   if(canplay(3,4,e,2,1,4,3,-1,-1))
    if(play(3,4,t,2,1,4,3,-1,-1)) return 1;
  if(patternfor4(e,1,0,3,4,4,3,2,1))
   if(canplay(2,1,e,1,0,3,4,-1,-1))
    if(play(2,1,t,1,0,3,4,-1,-1)) return 1;
  
  /* main */  
  if(patternfor4(e,0,0,1,1,2,2,3,3))
   if(canplay(3,3,e,2,2,-1,-1,-1,-1))
    if(play(3,3,t,2,2,-1,-1,-1,-1)) return 1;
  if(patternfor4(e,1,1,2,2,3,3,0,0))
   if(canplay(0,0,e,1,1,-1,-1,-1,-1))
    if(play(0,0,t,1,1,-1,-1,-1,-1)) return 1;
  if(patternfor4(e,0,0,2,2,3,3,1,1))
   if(canplay(1,1,e,0,0,2,2,-1,-1))
    if(play(1,1,t,0,0,2,2,-1,-1)) return 1;
  if(patternfor4(e,0,0,1,1,3,3,2,2))
   if(canplay(2,2,e,1,1,3,3,0,0))
    if(play(2,2,t,1,1,3,3,0,0)) return 1;
  if(patternfor4(e,1,1,2,2,3,3,4,4))
   if(canplay(4,4,e,3,3,-1,-1,-1,-1))
    if(play(4,4,t,3,3,-1,-1,-1,-1)) return 1;
  if(patternfor4(e,1,1,2,2,4,4,3,3))
   if(canplay(3,3,e,2,2,4,4,-1,-1))
    if(play(3,3,t,2,2,4,4,-1,-1)) return 1;
  if(patternfor4(e,1,1,3,3,4,4,2,2))
   if(canplay(2,2,e,1,1,3,3,-1,-1))
    if(play(2,2,t,1,1,3,3,-1,-1)) return 1;
  if(patternfor4(e,2,2,3,3,4,4,1,1))
   if(canplay(1,1,e,2,2,-1,-1,-1,-1))
    if(play(1,1,t,2,2,-1,-1,-1,-1)) return 1;

  /* up */ /* right -> left */
  if(patternfor4(e,0,3,1,2,2,1,3,0))
   if(canplay(3,0,e,2,1,-1,-1,-1,-1))
    if(play(3,0,t,2,1,-1,-1,-1,-1)) return 1;
  if(patternfor4(e,1,2,2,1,3,0,0,3))
   if(canplay(0,3,e,1,2,-1,-1,-1,-1))
    if(play(0,3,t,1,2,-1,-1,-1,-1)) return 1;
  if(patternfor4(e,0,3,1,2,3,0,2,1))
   if(canplay(2,1,e,1,2,3,0,-1,-1))
    if(play(2,1,t,1,2,3,0,-1,-1)) return 1;
  if(patternfor4(e,0,3,2,1,3,0,1,2))
   if(canplay(1,2,e,0,3,2,1,-1,-1))
    if(play(1,2,t,0,3,2,1,-1,-1)) return 1;

  /* down */
  if(patternfor4(e,1,4,2,3,3,2,4,1))
   if(canplay(4,1,e,3,2,-1,-1,-1,-1))
    if(play(4,1,t,3,2,-1,-1,-1,-1)) return 1;
  if(patternfor4(e,2,3,3,2,4,1,1,4))
   if(canplay(1,4,e,2,3,-1,-1,-1,-1))
    if(play(1,4,t,2,3,-1,-1,-1,-1)) return 1;
  if(patternfor4(e,1,4,2,3,4,1,3,0))
   if(canplay(3,0,e,2,3,4,1,-1,-1))
    if(play(3,0,t,2,3,4,1,-1,-1)) return 1;
  if(patternfor4(e,1,4,3,0,4,1,2,3))
   if(canplay(2,3,e,1,4,3,0,-1,-1))
    if(play(2,3,t,1,4,3,0,-1,-1)) return 1;

  /* main */  
  if(patternfor4(e,0,4,1,3,2,2,3,1))
   if(canplay(3,1,e,2,2,-1,-1,-1,-1))
    if(play(3,1,t,2,2,-1,-1,-1,-1)) return 1;
  if(patternfor4(e,1,3,2,2,3,1,0,0))
   if(canplay(0,4,e,1,3,-1,-1,-1,-1))
    if(play(0,4,t,1,3,-1,-1,-1,-1)) return 1;
  if(patternfor4(e,0,4,2,2,3,1,1,3))
   if(canplay(1,3,e,0,4,2,2,-1,-1))
    if(play(1,3,t,0,4,2,2,-1,-1)) return 1;
  if(patternfor4(e,0,4,1,3,3,1,2,2))
   if(canplay(2,2,e,1,3,3,1,0,0))
    if(play(2,2,t,1,3,3,1,0,0)) return 1;
  if(patternfor4(e,1,3,2,2,3,1,4,0))
   if(canplay(4,0,e,3,1,-1,-1,-1,-1))
    if(play(4,0,t,3,1,-1,-1,-1,-1)) return 1;
  if(patternfor4(e,1,3,2,2,4,0,3,1))
   if(canplay(3,1,e,2,2,4,0,-1,-1))
    if(play(3,1,t,2,2,4,0,-1,-1)) return 1;
  if(patternfor4(e,1,3,3,1,4,0,2,2))
   if(canplay(2,2,e,1,3,3,1,-1,-1))
    if(play(2,2,t,1,3,3,1,-1,-1)) return 1;
  if(patternfor4(e,2,2,3,1,4,0,1,3))
   if(canplay(1,3,e,2,2,-1,-1,-1,-1))
    if(play(1,3,t,2,2,-1,-1,-1,-1)) return 1;

  /* square */
  for(i=0; i<=3; i++)
   for(j=0; j<=3; j++)
    {
     if(patternfor4(e,i,j,i,j+1,i+1,j,i+1,j+1))
      if(canplay(i+1,j+1,e,i,j,i,j+1,i+1,j))
       if(play(i+1,j+1,t,i,j,i,j+1,i+1,j)) return 1;
     if(patternfor4(e,i,j,i,j+1,i+1,j+1,i+1,j))
      if(canplay(i+1,j,e,i,j,i,j+1,i+1,j+1))
       if(play(i+1,j,t,i,j,i,j+1,i+1,j+1)) return 1;
     if(patternfor4(e,i,j,i+1,j,i+1,j+1,i,j+1))
      if(canplay(i,j+1,e,i,j,i+1,j,i+1,j+1))
       if(play(i,j+1,t,i,j,i+1,j,i+1,j+1)) return 1;
     if(patternfor4(e,i,j+1,i+1,j,i+1,j+1,i,j))
      if(canplay(i,j,e,i,j+1,i+1,j,i+1,j+1))
       if(play(i,j,t,i,j+1,i+1,j,i+1,j+1)) return 1;
    }

  return 0;
 } /* avoid4 */

int makedouble3(int t, int e)
 {
  int i, j;

  /* horizontal */
  for(i=0; i<=4; i++)
   {
    if(patternfor3(t,i,1,i,2,i,3) &&
       (!canplay(i,0,e,-1,-1,-1,-1,-1,-1)||!canplay(i,4,e,-1,-1,-1,-1,-1,-1)))
     if(play(i,3,t,i,2,-1,-1,-1,-1)) return 1;

    if(patternfor3(t,i,2,i,3,i,1) &&
       (!canplay(i,0,e,-1,-1,-1,-1,-1,-1)||!canplay(i,4,e,-1,-1,-1,-1,-1,-1)))
     if(play(i,1,t,i,2,-1,-1,-1,-1)) return 1;
 
    if(patternfor3(t,i,1,i,3,i,2) &&
       (!canplay(i,0,e,-1,-1,-1,-1,-1,-1)||!canplay(i,4,e,-1,-1,-1,-1,-1,-1)))
     if(play(i,2,t,i,1,i,3,-1,-1)) return 1;
   }

  /* vertical */
  for(j=0; j<=4; j++)
   {
    if(patternfor3(t,1,j,2,j,3,j) &&
       (!canplay(0,j,e,-1,-1,-1,-1,-1,-1)||!canplay(4,j,e,-1,-1,-1,-1,-1,-1)))
     if(play(3,j,t,2,j,-1,-1,-1,-1)) return 1;

    if(patternfor3(t,2,j,3,j,1,j) &&
       (!canplay(0,j,e,-1,-1,-1,-1,-1,-1)||!canplay(4,j,e,-1,-1,-1,-1,-1,-1)))
     if(play(1,j,t,2,j,-1,-1,-1,-1)) return 1;
 
    if(patternfor3(t,1,j,3,j,2,j) &&
       (!canplay(0,j,e,-1,-1,-1,-1,-1,-1)||!canplay(i,4,e,-1,-1,-1,-1,-1,-1)))
     if(play(2,j,t,1,j,3,1,-1,-1)) return 1;
   }

  /* diagonal */ /* main left->right */
   if(patternfor3(t,1,1,2,2,3,3) &&
      (!canplay(0,0,e,-1,-1,-1,-1,-1,-1)||!canplay(4,4,e,-1,-1,-1,-1,-1,-1)))
     if(play(3,3,t,2,2,-1,-1,-1,-1)) return 1;

   if(patternfor3(t,2,2,3,3,1,1) &&
      (!canplay(0,0,e,-1,-1,-1,-1,-1,-1)||!canplay(4,4,e,-1,-1,-1,-1,-1,-1)))
     if(play(1,1,t,2,2,-1,-1,-1,-1)) return 1;

   if(patternfor3(t,1,1,3,3,2,2) &&
      (!canplay(0,0,e,-1,-1,-1,-1,-1,-1)||!canplay(4,4,e,-1,-1,-1,-1,-1,-1)))
     if(play(2,2,t,1,1,3,3,-1,-1)) return 1;

   /* main right->left */
   if(patternfor3(t,1,3,2,2,3,1) &&
      (!canplay(0,4,e,-1,-1,-1,-1,-1,-1)||!canplay(4,0,e,-1,-1,-1,-1,-1,-1)))
     if(play(3,1,t,2,2,-1,-1,-1,-1)) return 1;

   if(patternfor3(t,2,2,3,1,1,3) &&
      (!canplay(0,4,e,-1,-1,-1,-1,-1,-1)||!canplay(4,0,e,-1,-1,-1,-1,-1,-1)))
     if(play(1,3,t,2,2,-1,-1,-1,-1)) return 1;

   if(patternfor3(t,1,3,3,1,2,2) &&
      (!canplay(0,4,e,-1,-1,-1,-1,-1,-1)||!canplay(4,0,e,-1,-1,-1,-1,-1,-1)))
     if(play(2,2,t,1,3,3,1,-1,-1)) return 1;

  return 0;
 } /* makedouble3 */

int makenondefendable3(int t, int e)
 {
  int i, j;

  /* horizontal */
  for(i=0; i<=4; i++)
   {
    if(patternfor3(t,i,0,i,1,i,2) && !canplay(i,3,e,-1,-1,-1,-1,-1,-1))
     if(play(i,2,t,i,1,-1,-1,-1,-1)) return 1;
    if(patternfor3(t,i,1,i,2,i,0) && !canplay(i,3,e,-1,-1,-1,-1,-1,-1))
     if(play(i,0,t,i,1,-1,-1,-1,-1)) return 1;
    if(patternfor3(t,i,0,i,2,i,1) && !canplay(i,3,e,-1,-1,-1,-1,-1,-1))
     if(play(i,1,t,i,0,i,2,-1,-1)) return 1;

    if(patternfor3(t,i,2,i,3,i,4) && !canplay(i,1,e,-1,-1,-1,-1,-1,-1))
     if(play(i,4,t,i,3,-1,-1,-1,-1)) return 1;
    if(patternfor3(t,i,3,i,4,i,2) && !canplay(i,1,e,-1,-1,-1,-1,-1,-1))
     if(play(i,2,t,i,3,-1,-1,-1,-1)) return 1;
    if(patternfor3(t,i,2,i,4,i,3) && !canplay(i,1,e,-1,-1,-1,-1,-1,-1))
     if(play(i,3,t,i,2,i,4,-1,-1)) return 1;
   }

  /* vertical */
  for(j=0; j<=4; j++)
   {
    if(patternfor3(t,0,j,1,j,2,j) && !canplay(3,j,e,-1,-1,-1,-1,-1,-1))
     if(play(2,j,t,1,j,-1,-1,-1,-1)) return 1;
    if(patternfor3(t,1,j,2,j,0,j) && !canplay(3,j,e,-1,-1,-1,-1,-1,-1))
     if(play(0,j,t,1,j,-1,-1,-1,-1)) return 1;
    if(patternfor3(t,0,j,2,j,1,j) && !canplay(3,j,e,-1,-1,-1,-1,-1,-1))
     if(play(1,j,t,0,j,2,j,-1,-1)) return 1;

    if(patternfor3(t,2,j,3,j,4,j) && !canplay(1,j,e,-1,-1,-1,-1,-1,-1))
     if(play(4,j,t,3,j,-1,-1,-1,-1)) return 1;
    if(patternfor3(t,3,j,4,j,2,j) && !canplay(1,j,e,-1,-1,-1,-1,-1,-1))
     if(play(2,j,t,3,j,-1,-1,-1,-1)) return 1;
    if(patternfor3(t,2,j,4,j,3,j) && !canplay(1,j,e,-1,-1,-1,-1,-1,-1))
     if(play(3,j,t,2,j,4,j,-1,-1)) return 1;
   }

  /* diagonal */ /* left->right */ /* up up */
  if(patternfor3(t,0,1,1,2,2,3) && !canplay(3,4,e,-1,-1,-1,-1,-1,-1))
   if(play(2,3,t,1,2,-1,-1,-1,-1)) return 1;
  if(patternfor3(t,1,2,2,3,0,1) && !canplay(3,4,e,-1,-1,-1,-1,-1,-1))
   if(play(0,1,t,1,2,-1,-1,-1,-1)) return 1;
  if(patternfor3(t,0,1,2,3,1,2) && !canplay(3,4,e,-1,-1,-1,-1,-1,-1))
   if(play(1,2,t,0,1,2,3,-1,-1)) return 1;

  /* up down */
  if(patternfor3(t,1,2,2,3,3,4) && !canplay(0,1,e,-1,-1,-1,-1,-1,-1))
   if(play(3,4,t,2,3,-1,-1,-1,-1)) return 1;
  if(patternfor3(t,2,3,3,4,1,2) && !canplay(0,1,e,-1,-1,-1,-1,-1,-1))
   if(play(1,2,t,2,3,-1,-1,-1,-1)) return 1;
  if(patternfor3(t,1,2,3,4,2,3) && !canplay(0,1,e,-1,-1,-1,-1,-1,-1))
   if(play(2,3,t,1,2,3,4,-1,-1)) return 1;

  /* main up */
  if(patternfor3(t,0,0,1,1,2,2) && !canplay(3,3,e,-1,-1,-1,-1,-1,-1))
   if(play(2,2,t,1,1,-1,-1,-1,-1)) return 1;
  if(patternfor3(t,1,1,2,2,0,0) && !canplay(3,3,e,-1,-1,-1,-1,-1,-1))
   if(play(0,0,t,1,1,-1,-1,-1,-1)) return 1;
  if(patternfor3(t,0,0,2,2,1,1) && !canplay(3,3,e,-1,-1,-1,-1,-1,-1))
   if(play(1,1,t,0,0,2,2,-1,-1)) return 1;

  /* main down */
  if(patternfor3(t,2,2,3,3,4,4) && !canplay(1,1,e,-1,-1,-1,-1,-1,-1))
   if(play(4,4,t,3,3,-1,-1,-1,-1)) return 1;
  if(patternfor3(t,3,3,4,4,2,2) && !canplay(1,1,e,-1,-1,-1,-1,-1,-1))
   if(play(2,2,t,3,3,-1,-1,-1,-1)) return 1;
  if(patternfor3(t,2,2,4,4,3,3) && !canplay(1,1,e,-1,-1,-1,-1,-1,-1))
   if(play(3,3,t,2,2,4,4,-1,-1)) return 1;

  /* down up */
  if(patternfor3(t,1,0,2,1,3,2) && !canplay(4,3,e,-1,-1,-1,-1,-1,-1))
   if(play(3,2,t,2,1,-1,-1,-1,-1)) return 1;
  if(patternfor3(t,2,1,3,2,1,0) && !canplay(4,3,e,-1,-1,-1,-1,-1,-1))
   if(play(1,0,t,2,1,-1,-1,-1,-1)) return 1;
  if(patternfor3(t,1,0,3,2,2,1) && !canplay(4,3,e,-1,-1,-1,-1,-1,-1))
   if(play(2,1,t,1,0,3,2,-1,-1)) return 1;

  /* down down*/
  if(patternfor3(t,2,1,3,2,4,3) && !canplay(1,0,e,-1,-1,-1,-1,-1,-1))
   if(play(4,3,t,3,2,-1,-1,-1,-1)) return 1;
  if(patternfor3(t,3,2,4,3,2,1) && !canplay(1,0,e,-1,-1,-1,-1,-1,-1))
   if(play(2,1,t,3,2,-1,-1,-1,-1)) return 1;
  if(patternfor3(t,2,1,4,3,3,2) && !canplay(1,0,e,-1,-1,-1,-1,-1,-1))
   if(play(3,2,t,2,1,4,3,-1,-1)) return 1;

  /* right->left */ /* up up */
  if(patternfor3(t,0,3,1,2,2,1) && !canplay(3,0,e,-1,-1,-1,-1,-1,-1))
   if(play(2,1,t,1,2,-1,-1,-1,-1)) return 1;
  if(patternfor3(t,1,2,2,1,0,3) && !canplay(3,0,e,-1,-1,-1,-1,-1,-1))
   if(play(0,3,t,1,2,-1,-1,-1,-1)) return 1;
  if(patternfor3(t,0,3,2,1,1,2) && !canplay(3,0,e,-1,-1,-1,-1,-1,-1))
   if(play(1,2,t,0,3,2,1,-1,-1)) return 1;

  /* up down */
  if(patternfor3(t,1,2,2,1,3,0) && !canplay(0,3,e,-1,-1,-1,-1,-1,-1))
   if(play(3,0,t,2,1,-1,-1,-1,-1)) return 1;
  if(patternfor3(t,2,1,3,0,1,2) && !canplay(0,3,e,-1,-1,-1,-1,-1,-1))
   if(play(1,2,t,2,1,-1,-1,-1,-1)) return 1;
  if(patternfor3(t,1,2,3,0,2,1) && !canplay(0,3,e,-1,-1,-1,-1,-1,-1))
   if(play(2,1,t,1,2,3,0,-1,-1)) return 1;

  /* main up */
  if(patternfor3(t,0,4,1,3,2,2) && !canplay(3,1,e,-1,-1,-1,-1,-1,-1))
   if(play(2,2,t,1,3,-1,-1,-1,-1)) return 1;
  if(patternfor3(t,1,3,2,2,0,4) && !canplay(3,1,e,-1,-1,-1,-1,-1,-1))
   if(play(0,4,t,1,3,-1,-1,-1,-1)) return 1;
  if(patternfor3(t,0,4,2,2,1,3) && !canplay(3,1,e,-1,-1,-1,-1,-1,-1))
   if(play(1,3,t,0,4,2,2,-1,-1)) return 1;

  /* main down */
  if(patternfor3(t,2,2,3,1,4,0) && !canplay(1,3,e,-1,-1,-1,-1,-1,-1))
   if(play(4,0,t,3,1,-1,-1,-1,-1)) return 1;
  if(patternfor3(t,3,1,4,0,2,2) && !canplay(1,3,e,-1,-1,-1,-1,-1,-1))
   if(play(2,2,t,3,1,-1,-1,-1,-1)) return 1;
  if(patternfor3(t,2,2,4,0,3,1) && !canplay(1,3,e,-1,-1,-1,-1,-1,-1))
   if(play(3,1,t,2,2,4,0,-1,-1)) return 1;

  /* down up */
  if(patternfor3(t,1,4,2,3,3,2) && !canplay(4,1,e,-1,-1,-1,-1,-1,-1))
   if(play(3,2,t,2,3,-1,-1,-1,-1)) return 1;
  if(patternfor3(t,2,3,3,2,1,4) && !canplay(4,1,e,-1,-1,-1,-1,-1,-1))
   if(play(1,4,t,2,3,-1,-1,-1,-1)) return 1;
  if(patternfor3(t,1,4,3,2,2,3) && !canplay(4,1,e,-1,-1,-1,-1,-1,-1))
   if(play(2,3,t,1,4,3,2,-1,-1)) return 1;

  /* down down*/
  if(patternfor3(t,2,3,3,2,4,1) && !canplay(1,4,e,-1,-1,-1,-1,-1,-1))
   if(play(4,1,t,3,2,-1,-1,-1,-1)) return 1;
  if(patternfor3(t,3,2,4,1,2,3) && !canplay(1,4,e,-1,-1,-1,-1,-1,-1))
   if(play(2,3,t,3,2,-1,-1,-1,-1)) return 1;
  if(patternfor3(t,2,3,4,1,3,2) && !canplay(1,4,e,-1,-1,-1,-1,-1,-1))
   if(play(3,2,t,2,3,4,1,-1,-1)) return 1;

  /* square */
  for(i=j; i<=3; i++)
   for(j=1; j<=3; j++)
    {
     if(patternfor3(t,i,j,i,j+1,i+1,j)&&!canplay(i+1,j+1,e,-1,-1,-1,-1,-1,-1))
      if(play(i+1,j,t,i,j,i,j+1,-1,-1)) return 1;
     if(patternfor3(t,i,j,i,j+1,i+1,j+1)&&!canplay(i+1,j,e,-1,-1,-1,-1,-1,-1))
      if(play(i+1,j+1,t,i,j,i,j+1,-1,-1)) return 1;

     if(patternfor3(t,i,j,i+1,j,i,j+1)&&!canplay(i+1,j,e,-1,-1,-1,-1,-1,-1))
      if(play(i,j+1,t,i,j,i+1,j,-1,-1)) return 1;
     if(patternfor3(t,i,j,i+1,j,i+1,j)&&!canplay(i,j+1,e,-1,-1,-1,-1,-1,-1))
      if(play(i+1,j,t,i,j,i+1,j,-1,-1)) return 1;

     if(patternfor3(t,i+1,j,i+1,j+1,i,j)&&!canplay(i,j+1,e,-1,-1,-1,-1,-1,-1))
      if(play(i,j,t,i+1,j,i+1,j+1,-1,-1)) return 1;
     if(patternfor3(t,i+1,j,i+1,j+1,i,j+1)&&!canplay(i,j,e,-1,-1,-1,-1,-1,-1))
      if(play(i,j+1,t,i+1,j,i+1,j+1,-1,-1)) return 1;

     if(patternfor3(t,i,j+1,i+1,j+1,i,j)&&!canplay(i+1,j,e,-1,-1,-1,-1,-1,-1))
      if(play(i,j,t,i,j+1,i+1,j+1,-1,-1)) return 1;
     if(patternfor3(t,i,j+1,i+1,j+1,i+1,j)&&!canplay(i,j,e,-1,-1,-1,-1,-1,-1))
      if(play(i+1,j,t,i,j+1,i+1,j+1,-1,-1)) return 1;
    }

  return 0;
 } /* makenondefendable3 */

int avoiddouble3(int t, int e)
 {
  /* maybe we should check if the d3 to be avoided is a real threat...
     as we check in avoid4 ? not for now... it seems this is OK */
 
  int i, j;

  /* horizontal */
  for(i=0; i<=4; i++)
   {
    if(patternfor3(e,i,1,i,2,i,3))
     if(play(i,3,t,-1,-1,-1,-1,-1,-1)) return 1;

    if(patternfor3(e,i,2,i,3,i,1))
     if(play(i,1,t,-1,-1,-1,-1,-1,-1)) return 1;
 
    if(patternfor3(e,i,1,i,3,i,2))
     if(play(i,2,t,-1,-1,-1,-1,-1,-1)) return 1;
   }    

  /* vertical */
  for(j=0; j<=4; j++)
   {
    if(patternfor3(e,1,j,2,j,3,j))
     if(play(3,j,t,-1,-1,-1,-1,-1,-1)) return 1;

    if(patternfor3(e,2,j,3,j,1,j))
     if(play(1,j,t,-1,-1,-1,-1,-1,-1)) return 1;
 
    if(patternfor3(e,1,j,3,j,2,j))
     if(play(2,j,t,-1,-1,-1,-1,-1,-1)) return 1;
   }

  /* diagonal */ /* main left->right */
   if(patternfor3(e,1,1,2,2,3,3))
    if(play(3,3,t,-1,-1,-1,-1,-1,-1)) return 1;

   if(patternfor3(e,2,2,3,3,1,1))
    if(play(1,1,t,-1,-1,-1,-1,-1,-1)) return 1;

   if(patternfor3(e,1,1,3,3,2,2))
    if(play(2,2,t,-1,-1,-1,-1,-1,-1)) return 1;

   /* main right->left */
   if(patternfor3(e,1,3,2,2,3,1))
    if(play(3,1,t,-1,-1,-1,-1,-1,-1)) return 1;

   if(patternfor3(e,2,2,3,1,1,3))
    if(play(1,3,t,-1,-1,-1,-1,-1,-1)) return 1;

   if(patternfor3(e,1,3,3,1,2,2))
    if(play(2,2,t,-1,-1,-1,-1,-1,-1)) return 1;
  
  return 0;
 } /* avoiddouble3 */

int avoidnondefendable3(int t, int e)
 {
  int i, j;

  /* again, there is no check if it is a real threat */

  /* horizontal */
    for(i=0; i<=4; i++)
   {
    if(patternfor3(e,i,0,i,1,i,2))
     if(play(i,2,t,-1,-1,-1,-1,-1,-1)) return 1;
    if(patternfor3(e,i,1,i,2,i,0))
     if(play(i,0,t,-1,-1,-1,-1,-1,-1)) return 1;
    if(patternfor3(e,i,0,i,2,i,1))
     if(play(i,1,t,-1,-1,-1,-1,-1,-1)) return 1;

    if(patternfor3(e,i,2,i,3,i,4))
     if(play(i,4,t,-1,-1,-1,-1,-1,-1)) return 1;
    if(patternfor3(e,i,3,i,4,i,2))
     if(play(i,2,t,-1,-1,-1,-1,-1,-1)) return 1;
    if(patternfor3(e,i,2,i,4,i,3))
     if(play(i,3,t,-1,-1,-1,-1,-1,-1)) return 1;
   }

  /* vertical */
  for(j=0;j<=4;j++)
   {
    if(patternfor3(e,0,j,1,j,2,j))
     if(play(2,j,t,-1,-1,-1,-1,-1,-1)) return 1;
    if(patternfor3(e,1,j,2,j,0,j))
     if(play(0,j,t,-1,-1,-1,-1,-1,-1)) return 1;
    if(patternfor3(e,0,j,2,j,1,j))
     if(play(1,j,t,-1,-1,-1,-1,-1,-1)) return 1;

    if(patternfor3(e,2,j,3,j,4,j))
     if(play(4,j,t,-1,-1,-1,-1,-1,-1)) return 1;
    if(patternfor3(e,3,j,4,j,2,j))
     if(play(2,j,t,-1,-1,-1,-1,-1,-1)) return 1;
    if(patternfor3(e,2,j,4,j,3,j))
     if(play(3,j,t,-1,-1,-1,-1,-1,-1)) return 1;
   }

  /* diagonal */ /* left->right */ /* up up */
  if(patternfor3(e,0,1,1,2,2,3))
   if(play(2,3,t,-1,-1,-1,-1,-1,-1)) return 1;
  if(patternfor3(e,1,2,2,3,0,1))
   if(play(0,1,t,-1,-1,-1,-1,-1,-1)) return 1;
  if(patternfor3(e,0,1,2,3,1,2))
   if(play(1,2,t,-1,-1,-1,-1,-1,-1)) return 1;

  /* up down */
  if(patternfor3(e,1,2,2,3,3,4))
   if(play(3,4,t,-1,-1,-1,-1,-1,-1)) return 1;
  if(patternfor3(e,2,3,3,4,1,2))
   if(play(1,2,t,-1,-1,-1,-1,-1,-1)) return 1;
  if(patternfor3(e,1,2,3,4,2,3))
   if(play(2,3,t,-1,-1,-1,-1,-1,-1)) return 1;

  /* main up */
  if(patternfor3(e,0,0,1,1,2,2))
   if(play(2,2,t,-1,-1,-1,-1,-1,-1)) return 1;
  if(patternfor3(e,1,1,2,2,0,0))
   if(play(0,0,t,-1,-1,-1,-1,-1,-1)) return 1;
  if(patternfor3(e,0,0,2,2,1,1))
   if(play(1,1,t,-1,-1,-1,-1,-1,-1)) return 1;

  /* main down */
  if(patternfor3(e,2,2,3,3,4,4))
   if(play(4,4,t,-1,-1,-1,-1,-1,-1)) return 1;
  if(patternfor3(e,3,3,4,4,2,2))
   if(play(2,2,t,-1,-1,-1,-1,-1,-1)) return 1;
  if(patternfor3(e,2,2,4,4,3,3))
   if(play(3,3,t,-1,-1,-1,-1,-1,-1)) return 1;

  /* down up */
  if(patternfor3(e,1,0,2,1,3,2))
   if(play(3,2,t,-1,-1,-1,-1,-1,-1)) return 1;
  if(patternfor3(e,2,1,3,2,1,0))
   if(play(1,0,t,-1,-1,-1,-1,-1,-1)) return 1;
  if(patternfor3(e,1,0,3,2,2,1))
   if(play(2,1,t,-1,-1,-1,-1,-1,-1)) return 1;

  /* down down*/
  if(patternfor3(e,2,1,3,2,4,3))
   if(play(4,3,t,-1,-1,-1,-1,-1,-1)) return 1;
  if(patternfor3(e,3,2,4,3,2,1))
   if(play(2,1,t,-1,-1,-1,-1,-1,-1)) return 1;
  if(patternfor3(e,2,1,4,3,3,2))
   if(play(3,2,t,-1,-1,-1,-1,-1,-1)) return 1;

  /* right->left */ /* up up */
  if(patternfor3(e,0,3,1,2,2,1))
   if(play(2,1,t,-1,-1,-1,-1,-1,-1)) return 1;
  if(patternfor3(e,1,2,2,1,0,3))
   if(play(0,3,t,-1,-1,-1,-1,-1,-1)) return 1;
  if(patternfor3(e,0,3,2,1,1,2))
   if(play(1,2,t,-1,-1,-1,-1,-1,-1)) return 1;

  /* up down */
  if(patternfor3(e,1,2,2,1,3,0))
   if(play(3,0,t,-1,-1,-1,-1,-1,-1)) return 1;
  if(patternfor3(e,2,1,3,0,1,2))
   if(play(1,2,t,-1,-1,-1,-1,-1,-1)) return 1;
  if(patternfor3(e,1,2,3,0,2,1))
   if(play(2,1,t,-1,-1,-1,-1,-1,-1)) return 1;

  /* main up */
  if(patternfor3(e,0,4,1,3,2,2))
   if(play(2,2,t,-1,-1,-1,-1,-1,-1)) return 1;
  if(patternfor3(e,1,3,2,2,0,4))
   if(play(0,4,t,-1,-1,-1,-1,-1,-1)) return 1;
  if(patternfor3(e,0,4,2,2,1,3))
   if(play(1,3,t,-1,-1,-1,-1,-1,-1)) return 1;

  /* main down */
  if(patternfor3(e,2,2,3,1,4,0))
   if(play(4,0,t,-1,-1,-1,-1,-1,-1)) return 1;
  if(patternfor3(e,3,1,4,0,2,2))
   if(play(2,2,t,-1,-1,-1,-1,-1,-1)) return 1;
  if(patternfor3(e,2,2,4,0,3,1))
   if(play(3,1,t,-1,-1,-1,-1,-1,-1)) return 1;

  /* down up */
  if(patternfor3(e,1,4,2,3,3,2))
   if(play(3,2,t,-1,-1,-1,-1,-1,-1)) return 1;
  if(patternfor3(e,2,3,3,2,1,4))
   if(play(1,4,t,-1,-1,-1,-1,-1,-1)) return 1;
  if(patternfor3(e,1,4,3,2,2,3))
   if(play(2,3,t,-1,-1,-1,-1,-1,-1)) return 1;

  /* down down*/
  if(patternfor3(e,2,3,3,2,4,1))
   if(play(4,1,t,-1,-1,-1,-1,-1,-1)) return 1;
  if(patternfor3(e,3,2,4,1,2,3))
   if(play(2,3,t,-1,-1,-1,-1,-1,-1)) return 1;
  if(patternfor3(e,2,3,4,1,3,2))
   if(play(3,2,t,-1,-1,-1,-1,-1,-1)) return 1;

  /* square */
  for(i=j; i<=3; i++)
   for(j=1; j<=3; j++)
    {
     if(patternfor3(e,i,j,i,j+1,i+1,j))
      if(play(i+1,j,t,-1,-1,-1,-1,-1,-1)) return 1;
     if(patternfor3(e,i,j,i,j+1,i+1,j+1))
      if(play(i+1,j+1,t,-1,-1,-1,-1,-1,-1)) return 1;

     if(patternfor3(e,i,j,i+1,j,i,j+1))
      if(play(i,j+1,t,-1,-1,-1,-1,-1,-1)) return 1;
     if(patternfor3(e,i,j,i+1,j,i+1,j))
      if(play(i+1,j,t,-1,-1,-1,-1,-1,-1)) return 1;

     if(patternfor3(e,i+1,j,i+1,j+1,i,j))
      if(play(i,j,t,-1,-1,-1,-1,-1,-1)) return 1;
     if(patternfor3(e,i+1,j,i+1,j+1,i,j+1))
      if(play(i,j+1,t,-1,-1,-1,-1,-1,-1)) return 1;

     if(patternfor3(e,i,j+1,i+1,j+1,i,j))
      if(play(i,j,t,-1,-1,-1,-1,-1,-1)) return 1;
     if(patternfor3(e,i,j+1,i+1,j+1,i+1,j))
      if(play(i+1,j,t,-1,-1,-1,-1,-1,-1)) return 1;
    }

  return 0;
 } /* avoidnondefendable3 */

void playrandom(int t)
 {
  int ret, a, b;
  
  l:
   ret=rand();
   a=ret%5;
   ret=rand();
   b=ret%5;

  if(X[a][b]!=0) goto l;
  if(play(a,b,t,-1,-1,-1,-1,-1,-1)==0) goto l;    
 } /* playrandom */

