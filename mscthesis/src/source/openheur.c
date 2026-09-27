/* openheur.c - opening heuristics */

/*
  void oplayinthemiddle(int) - 22 field
  void oplayinthecorner(int) - 12 21 23 32 fields
  void oplayinthecross(int) - 11 13 31 33 fields
  void oplayhv(int) - 11||33 => 31 or 13, 31||13 => 11 or 33
  void omake2(int) - makes dangerous two in a row
  int oavoid3(int, int) - avoids dangerous three in a row, 1:OK 0:DIDN'T
  int omake3(int) - tries to make dangerous three, 1:OK 0:DIDN'T
  int oavoid4(int, int) - avoids four, 1:OK 0:DIDN'T
  int omake4(int) - tries to make four, 1:OK 0:DIDN'T
*/

void oplayinthemiddle(int toput)
 {
  X[2][2]=toput;
 } /* oplayinthemiddle */

void oplayinthecorner(int toput)
 {
  int i=0, j=0, ret;

  l:
   ret=rand();
   ret%=4;
   if(ret==0) { i=1; j=3; }
   if(ret==1) { i=1; j=1; }
   if(ret==2) { i=3; j=3; }
   if(ret==3) { i=3; j=1; }

   if(X[i][j]!=0) goto l;
    else X[i][j]=toput;
 } /* oplayinthecorner */

void oplayinthecross(int toput)
 {
  int i=0, j=0, ret;

  l1:
   ret=rand();
   ret%=4;
   if(ret==0) { i=1; j=2; }
   if(ret==1) { i=2; j=1; }
   if(ret==2) { i=2; j=3; }
   if(ret==3) { i=3; j=2; }

   if(X[i][j]!=0) goto l1;
    else X[i][j]=toput;
 } /* oplayinthecross */

void oplayhv(int toput)
 {
  int ret; 
 
  ret=rand();
  ret%=2;
   
  if(X[1][1]==toput || X[3][3]==toput)
   {
    if(ret==0)
     {
      if(X[1][3]==0) { X[1][3]=toput; return; }
      if(X[3][1]==0) { X[3][1]=toput; return; }
     }
    else
     {
      if(X[3][1]==0) { X[3][1]=toput; return; }
      if(X[1][3]==0) { X[1][3]=toput; return; }
     }
   }

  if(X[1][3]==toput || X[3][1]==toput)
   {
    if(ret==0)
     {
      if(X[1][1]==0) { X[1][1]=toput; return; }
      if(X[3][3]==0) { X[3][3]=toput; return; }
     }
    else
     {
      if(X[3][3]==0) { X[3][3]=toput; return; }
      if(X[1][1]==0) { X[1][1]=toput; return; }
     }
   }
 } /* oplayhv */

void omake2(int toput)
 {
  if(X[2][2]==toput) /* middle field is mine, OK to play "corner" */
   {
    oplayinthecorner(toput);
   }
  else /* call from another move */
   {
    if(((X[1][1]==toput || X[3][3]==toput) && (X[1][3]==0 || X[3][1]==0))
    ||((X[1][3]==toput || X[3][1]==toput) && (X[1][1]==0 || X[3][3]==0)))
     oplayhv(toput);
    else
     oplayinthecross(toput);
   }
 } /* omake2 */

int oavoid3(int toput, int e)
 {
  int i, j;
  
  for(i=0; i<=4; i++)  /* horizontal */
   {
    if(X[i][1]==e && X[i][2]==e && X[i][3]==0) { X[i][3]=toput; return 1; }
    if(X[i][2]==e && X[i][3]==e && X[i][1]==0) { X[i][1]=toput; return 1; }
    if(X[i][1]==e && X[i][3]==e && X[i][2]==0) { X[i][2]=toput; return 1; }
   }

  for(j=0; j<=4; j++) /* vertical */
   {
    if(X[1][j]==e && X[2][j]==e && X[3][j]==0) { X[3][j]=toput; return 1; }
    if(X[2][j]==e && X[3][j]==e && X[1][j]==0) { X[1][j]=toput; return 1; }
    if(X[1][j]==e && X[3][j]==e && X[2][j]==0) { X[2][j]=toput; return 1; }
   }

  /* diagonal */
  if(X[1][1]==e && X[2][2]==e && X[3][3]==0) { X[3][3]=toput; return 1; }
  if(X[2][2]==e && X[3][3]==e && X[1][1]==0) { X[1][1]=toput; return 1; }
  if(X[1][3]==e && X[2][2]==e && X[3][1]==0) { X[3][1]=toput; return 1; }
  if(X[3][1]==e && X[2][2]==e && X[1][3]==0) { X[1][3]=toput; return 1; }

  return 0;
 } /* oavoid3 */

int omake3(int toput)
 {
  /* horizontal */
  if(X[1][1]==toput && X[1][2]==toput && X[1][3]==0){X[1][3]=toput; return 1;}
  if(X[1][2]==toput && X[1][3]==toput && X[1][1]==0){X[1][1]=toput; return 1;}
  if(X[1][1]==toput && X[1][3]==toput && X[1][2]==0){X[1][2]=toput; return 1;}

  if(X[2][1]==toput && X[2][2]==toput && X[2][3]==0){X[2][3]=toput; return 1;}
  if(X[2][2]==toput && X[2][3]==toput && X[2][1]==0){X[2][1]=toput; return 1;}
  if(X[2][3]==toput && X[2][1]==toput && X[2][2]==0){X[1][2]=toput; return 1;}

  if(X[3][1]==toput && X[3][2]==toput && X[3][3]==0){X[3][3]=toput; return 1;}
  if(X[3][2]==toput && X[3][3]==toput && X[3][1]==0){X[3][1]=toput; return 1;}
  if(X[3][1]==toput && X[3][3]==toput && X[3][2]==0){X[3][2]=toput; return 1;}

  /* vertical */
  if(X[1][1]==toput && X[2][1]==toput && X[3][1]==0){X[3][1]=toput; return 1;}
  if(X[2][1]==toput && X[3][1]==toput && X[1][1]==0){X[1][1]=toput; return 1;}
  if(X[1][1]==toput && X[3][1]==toput && X[2][1]==0){X[2][1]=toput; return 1;}

  if(X[1][2]==toput && X[2][2]==toput && X[3][2]==0){X[3][2]=toput; return 1;}
  if(X[1][2]==toput && X[3][2]==toput && X[2][2]==0){X[2][2]=toput; return 1;}
  if(X[2][2]==toput && X[3][2]==toput && X[1][2]==0){X[1][2]=toput; return 1;}

  if(X[1][3]==toput && X[2][3]==toput && X[3][3]==0){X[3][3]=toput; return 1;}
  if(X[1][3]==toput && X[3][3]==toput && X[2][3]==0){X[2][3]=toput; return 1;}
  if(X[2][3]==toput && X[3][3]==toput && X[1][3]==0){X[1][3]=toput; return 1;}

  /* diagonal */
  if(X[1][1]==toput && X[2][2]==toput && X[3][3]==0){X[3][3]=toput; return 1;}
  if(X[2][2]==toput && X[3][3]==toput && X[1][1]==0){X[1][1]=toput; return 1;}
  if(X[1][3]==toput && X[2][2]==toput && X[3][1]==0){X[3][1]=toput; return 1;}
  if(X[3][1]==toput && X[2][2]==toput && X[1][3]==0){X[1][3]=toput; return 1;}

  /* square ?! */

  return 0;
 } /* omake3 */

int oavoid4(int toput, int e)
 {
  int i, j; 

  /* horizontal */
  for(i=0; i<=4; i++)
   {
    if(X[i][0]==e && X[i][1]==e && X[i][2]==e && X[i][3]==0)
     { X[i][3]=toput; return 1; }

    if(X[i][2]==e && X[i][3]==e && X[i][4]==e && X[i][1]==0)
     { X[i][1]=toput; return 1; }
   }

  /* vertical */
  for(j=0; j<=4; j++)
   {
    if(X[0][j]==e && X[1][j]==e && X[2][j]==e && X[3][j]==0)
     { X[3][j]=toput; return 1; }

    if(X[2][j]==e && X[3][j]==e && X[4][j]==e && X[1][j]==0)
     { X[1][j]=toput; return 1; }
   }

  /* diagonal */
  if(X[0][1]==e&&X[1][2]==e&&X[2][3]==e&&X[3][4]==0){X[3][4]=toput; return 1;}
  if(X[3][4]==e&&X[1][2]==e&&X[2][3]==e&&X[0][1]==0){X[0][1]=toput; return 1;}

  if(X[0][0]==e&&X[1][1]==e&&X[2][2]==e&&X[3][3]==0){X[3][3]=toput; return 1;}
  if(X[2][2]==e&&X[3][3]==e&&X[4][4]==e&&X[1][1]==0){X[1][1]=toput; return 1;}

  if(X[1][0]==e&&X[2][1]==e&&X[3][2]==e&&X[4][3]==0){X[4][3]=toput; return 1;}
  if(X[2][1]==e&&X[3][2]==e&&X[4][3]==e&&X[1][0]==0){X[1][0]=toput; return 1;}


  if(X[0][3]==e&&X[1][2]==e&&X[2][1]==e&&X[3][0]==0){X[3][0]=toput; return 1;}
  if(X[3][0]==e&&X[1][2]==e&&X[2][1]==e&&X[0][3]==0){X[0][3]=toput; return 1;}

  if(X[0][4]==e&&X[1][3]==e&&X[2][2]==e&&X[3][1]==0){X[3][1]=toput; return 1;}
  if(X[2][2]==e&&X[3][1]==e&&X[4][0]==e&&X[1][3]==0){X[1][3]=toput; return 1;}

  if(X[1][4]==e&&X[2][3]==e&&X[3][2]==e&&X[4][1]==0){X[4][1]=toput; return 1;}
  if(X[2][3]==e&&X[3][2]==e&&X[4][1]==e&&X[1][4]==0){X[1][4]=toput; return 1;}

  /* square */
  for(i=0; i<=3; i++)
   for(j=0; j<=3; j++)
    {
     if(X[i][j]==e && X[i+1][j]==e && X[i][j+1]==e && X[i+1][j+1]==0)
      { X[i+1][j+1]=toput; return 1; }
     if(X[i][j]==e && X[i+1][j]==e && X[i+1][j+1]==e && X[i][j+1]==0)
      { X[i][j+1]=toput; return 1; }
     if(X[i+1][j+1]==e && X[i+1][j]==e && X[i][j+1]==e && X[i][j]==0)
      { X[i][j]=toput; return 1; }
     if(X[i][j]==e && X[i+1][j+1]==e && X[i][j+1]==e && X[i+1][j]==0)
      { X[i+1][j]=toput; return 1; }
    }

  return 0;
 } /* oavoid4 */

int omake4(int toput)
 {
  int i, j;

  /* horizontal */
  for(i=0; i<=4; i++)
   {
    if(X[i][0]==toput && X[i][1]==toput && X[i][2]==toput && X[i][3]==0)
     { X[i][3]=toput; return 1; }

    if(X[i][2]==toput && X[i][3]==toput && X[i][4]==toput && X[i][1]==0)
     { X[i][1]=toput; return 1; }
   }

  /* vertical */
  for(j=0; j<=4; j++)
   {
    if(X[0][j]==toput && X[1][j]==toput && X[2][j]==toput && X[3][j]==0)
     { X[3][j]=toput; return 1; }

    if(X[2][j]==toput && X[3][j]==toput && X[4][j]==toput && X[1][j]==0)
     { X[1][j]=toput; return 1; }
   }

  /* diagonal */
  if(X[0][1]==toput&&X[1][2]==toput&&X[2][3]==toput&&X[3][4]==0)
   {X[3][4]=toput; return 1;}
  if(X[3][4]==toput&&X[1][2]==toput&&X[2][3]==toput&&X[0][1]==0)
   {X[0][1]=toput; return 1;}

  if(X[0][0]==toput&&X[1][1]==toput&&X[2][2]==toput&&X[3][3]==0)
   {X[3][3]=toput; return 1;}
  if(X[2][2]==toput&&X[3][3]==toput&&X[4][4]==toput&&X[1][1]==0)
   {X[1][1]=toput; return 1;}
  if(X[1][1]==toput&&X[2][2]==toput&&X[3][3]==toput)
   {
    if(X[0][0]==0) { X[0][0]=toput; return 1; }
    if(X[4][4]==0) { X[4][4]=toput; return 1; }
   }

  if(X[1][0]==toput&&X[2][1]==toput&&X[3][2]==toput&&X[4][3]==0)
   {X[4][3]=toput; return 1;}
  if(X[2][1]==toput&&X[3][2]==toput&&X[4][3]==toput&&X[1][0]==0)
   {X[1][0]=toput; return 1;}


  if(X[0][3]==toput&&X[1][2]==toput&&X[2][1]==toput&&X[3][0]==0)
   {X[3][0]=toput; return 1;}
  if(X[3][0]==toput&&X[1][2]==toput&&X[2][1]==toput&&X[0][3]==0)
   {X[0][3]=toput; return 1;}

  if(X[0][4]==toput&&X[1][3]==toput&&X[2][2]==toput&&X[3][1]==0)
   {X[3][1]=toput; return 1;}
  if(X[2][2]==toput&&X[3][1]==toput&&X[4][0]==toput&&X[1][3]==0)
   {X[1][3]=toput; return 1;}
  if(X[1][3]==toput&&X[2][2]==toput&&X[3][1]==toput)
   {
    if(X[0][4]==0) { X[0][4]=toput; return 1; }
    if(X[4][0]==0) { X[4][0]=toput; return 1; }
   }

  if(X[1][4]==toput&&X[2][3]==toput&&X[3][2]==toput&&X[4][1]==0)
   {X[4][1]=toput; return 1;}
  if(X[2][3]==toput&&X[3][2]==toput&&X[4][1]==toput&&X[1][4]==0)
   {X[1][4]=toput; return 1;}

  /* square */
  for(i=0; i<=3; i++)
   for(j=0; j<=3; j++)
    {
     if(X[i][j]==toput&&X[i+1][j]==toput&&X[i][j+1]==toput&&X[i+1][j+1]==0)
      { X[i+1][j+1]=toput; return 1; }
     if(X[i][j]==toput&&X[i+1][j]==toput&&X[i+1][j+1]==toput&&X[i][j+1]==0)
      { X[i][j+1]=toput; return 1; }
     if(X[i+1][j+1]==toput&&X[i+1][j]==toput&&X[i][j+1]==toput&&X[i][j]==0)
      { X[i][j]=toput; return 1; }
     if(X[i][j]==toput&&X[i+1][j+1]==toput&&X[i][j+1]==toput&&X[i+1][j]==0)
      { X[i+1][j]=toput; return 1; }
    }
  
  return 0;
 } /* omake4 */

