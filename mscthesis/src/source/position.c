/* position.c - working with positions */

/*
  void makeemptyposition(position_t) - sets all elements to 0
  int successor(position_t) - if the position exists in level1 file 1:YES 0:NO
  void invertposition(position_t, position_t) - inverts position
  int comparepositions(position_t, position_t) - 1:EQUAL 0:NON EQUAL
  void copyposition(position_t, position_t) - (source, destination)
  void printposition(position_t, int) - prints position
                                        (takes care who moved first)
  void translateposition(position_t, int) - kills pawns opposite to int argument
*/

void makeemptyposition(position_t p)
 {
  int i, j;

  for(i=0; i<=4; i++)
   for(j=0; j<=4; j++)
    p[i][j]=0;
 } /* makeemptyposition */

int successor(position_t child)
 {
  int ret;
  position_t ptmp;

  openlevel1_read(); /* if the position exists in level1 file, then
                        it is the successor (therefore, level1 file
                        MUST be created even if searching is OFF ! */

  for(;;)
   {
    ret=loadposition(ptmp, l1);
    if(ret==1)
     {
      closelevel1();
      return 0;
     }

    if(comparepositions(child, ptmp))
     {
      closelevel1();
      return 1;
     }
   }
 } /* successor */

void invertposition(position_t s, position_t d)
 {
  int i, j;

  for(i=0; i<=4; i++)
   for(j=0; j<=4; j++)
   {
    switch(s[i][j])
     {
      case  0 : d[i][j]= 0; break;
      case  1 : d[i][j]=-1; break;
      case -1 : d[i][j]= 1; break;
     }
   }
 } /* invertposition */

int comparepositions(position_t p1, position_t p2)
 {
  int i, j;

  for(i=0; i<=4; i++)
   for(j=0; j<=4; j++)
    {
     if(p1[i][j]!=p2[i][j]) return 0; /* difference has been found */
    }

  return 1;
 } /* comparepositions */

void copyposition(position_t ps, position_t pd)
 {
  int i, j;

  for(i=0; i<=4; i++)
   for(j=0; j<=4; j++)
    pd[i][j]=ps[i][j];
 } /* copyposition */

void printposition(position_t p, int whomoves)
 {
  int i, j, out=0;

  printf("\n 01234");
  for(i=0; i<=4; i++)
   {
    printf("\n%d", i);
    for(j=0; j<=4; j++)
     {
      switch(p[i][j])
       {
	       case  0: { out='.'; break; }
	       case  1: { out=((whomoves== 1) ? 'X': 'O'); break; }
	       case -1: { out=((whomoves==-1) ? 'X': 'O'); break; }
       }
      printf("%c", out);
     }
   }
  if((n!=1) || (p0==0) || (n==1 && p0==1)) printf("\n");
 } /* printposition */

void translateposition(position_t p, int preserve)
 {
  int i, j;

  for(i=0; i<=4; i++)
   for(j=0; j<=4; j++)
    if(p[i][j]!=preserve) p[i][j]=0;
 } /* translateposition */

