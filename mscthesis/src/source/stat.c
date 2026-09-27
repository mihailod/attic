/* stat.c - working with statistics */

/*
  Description of the stat file.

  File keeps the track of the following 9 numbers.
  Each of these numbers is represented with WIDTH digits:

  1. number of autoplayed games won by player one
  2. number of autoplayed games drawn
  3. number of autoplayed games won by player two
  4. number of games program played first and won
  5. number of games program played first and drawn
  6. number of games program played first and lost
  7. number of games program played second and won
  8. number of games program played second and drawn
  9. number of games program played second and lost
  
  File name is stat.m .
  File is taking the space of 9*WIDTH characters.
*/

/*
  void statreset(void) - resets statistical data
  void statupdate(char, char) - updates appropriate info in stat.m file
                                according to retreived arguments:
                                first argument can be A, F or S (autoplay,
                                program first and program second) and the
                                second one can be W, D or L (won, drawn,
                                lost)
  void statshow(void) - shows the current statistics  !!!USES FLOATS!!!
  void statmenu(void) - shows statistic menu
  void statistic(void) - main entry into statistic module
*/

void statreset(void)
 {
  removestat();
  createstat();
 } /* statreset */

void statupdate(char what, char outcome)
 {
  int i, currentstat;

  openstat_readwrite();

  switch(what)
   {
    case 'A': break;
    case 'F': { skip(st); skip(st); skip(st); break; }
    case 'S':
     { 
      skip(st); skip(st); skip(st); skip(st);
      skip(st); skip(st); break;
     }
   }

  switch(outcome)
   {
    case 'W': break;
    case 'D': { skip(st); break; }
    case 'L': { skip(st); skip(st); break; }
   }

  for(i=0; i<=WIDTH-1; i++) learnednumber[i]=' '; /* clear number */
  getnumber(st);

  currentstat=atoi(learnednumber);
  currentstat++;

  getback(st);
  putnumber(currentstat, st);
 
  closestat();
 } /* statupdate */

void statshow(void)
 {
  int autowon, autodrawn, autolost;
  int progfirstwon, progfirstdrawn, progfirstlost;
  int progsecondwon, progseconddrawn, progsecondlost;
  int autosumma, progfirstsumma, progsecondsumma;
  int iofieldwidth; /* for formatted oputput at run time */
  float pw,pd,pl;

  openstat_readwrite();

  getnumber(st);
  autowon=atoi(learnednumber);
  getnumber(st);
  autodrawn=atoi(learnednumber);
  getnumber(st);
  autolost=atoi(learnednumber);
  getnumber(st);
  progfirstwon=atoi(learnednumber);
  getnumber(st);
  progfirstdrawn=atoi(learnednumber);
  getnumber(st);
  progfirstlost=atoi(learnednumber);
  getnumber(st);
  progsecondwon=atoi(learnednumber);
  getnumber(st);
  progseconddrawn=atoi(learnednumber);
  getnumber(st);
  progsecondlost=atoi(learnednumber);

  closestat();

  autosumma=autowon+autodrawn+autolost;
  progfirstsumma=progfirstwon+progfirstdrawn+progfirstlost;
  progsecondsumma=progsecondwon+progseconddrawn+progsecondlost;

  iofieldwidth=WIDTH;

  printf("\nStatistics.\n\n");
  printf("Total of games played: %d",
          autosumma+progfirstsumma+progsecondsumma);
  printf("\n\n");

  printf("Autoplayed games: %d\n", autosumma);
  printf("X:D:O ratio is %*d : %*d : %*d",
          iofieldwidth, autowon,
          iofieldwidth, autodrawn,
          iofieldwidth, autolost);

  if(autosumma!=0)
   {
    pw=(autowon*(float)100)/autosumma;
    pd=(autodrawn*(float)100)/autosumma;
    pl=(autolost*(float)100)/autosumma;

    printf(" (%6.2f%% :%6.2f%% :%6.2f%%)", pw, pd, pl);
   }
  else
   printf(" (percentage ratio is not available)");

  printf("\n\n");

  printf("Games program played first: %d\n", progfirstsumma);
  printf("W:D:L ratio is %*d : %*d : %*d",
          iofieldwidth, progfirstwon,
          iofieldwidth, progfirstdrawn,
          iofieldwidth, progfirstlost);

  if(progfirstsumma!=0)
   {
    pw=(progfirstwon*(float)100)/progfirstsumma;
    pd=(progfirstdrawn*(float)100)/progfirstsumma;
    pl=(progfirstlost*(float)100)/progfirstsumma;

    printf(" (%6.2f%% :%6.2f%% :%6.2f%%)", pw, pd, pl);
   }
  else
   printf(" (percentage ratio is not available)");

  printf("\n\n");

  printf("Games program played second: %d\n", progfirstsumma);
  printf("W:D:L ratio is %*d : %*d : %*d",
          iofieldwidth, progsecondwon,
          iofieldwidth, progseconddrawn,
          iofieldwidth, progsecondlost);

  if(progsecondsumma!=0)
   {
    pw=(progsecondwon*(float)100)/progsecondsumma;
    pd=(progseconddrawn*(float)100)/progsecondsumma;
    pl=(progsecondlost*(float)100)/progsecondsumma;

    printf(" (%6.2f%% :%6.2f%% :%6.2f%%)", pw, pd, pl);
   }
  else
   printf(" (percentage ratio is not available)");

  printf("\n\n");
 } /* statshow */

void statmenu(void)
 {
  char s[80];

  printf("[r] Reset statistics\n\n");
  printf("Press [r] or any key then ENTER... >");
  (void)fgets(s, 80, stdin);
  if(s[0]=='r') statreset();
 } /* statmenu */

void statistics(void)
 {
  statshow();
  statmenu();
 } /* statistics */

