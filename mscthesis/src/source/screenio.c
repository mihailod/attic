/* screenio.c - feedback and info visible on the console */

void updatememory(void); /* call in update.c */

/*
  void menu(void) - prints main menu
  void rules(void) - prints rules of the game
  void help(void) - prints help about playing
  void defeat(void) - feedback to program's defeat
  void win(void) - feedback to program's win
  void draw(void) - feedback to draw
  int offerdraw(void) - offers a draw 0:REFUSED 1:ACCEPTED
  void gamebreak(void) - feedback to break
  void error(char*) - prints and exits with EXIT_FAILURE
  void quitgame(void) - exits with EXIT_SUCCESS
  void autointro(void) - prints informations before entering into batch
  void usage(void) - prints out batch mode usage and exits with EXIT_SUCCESS
*/

void menu(void)
 {
  char *spausing, *sthinking, *slearning, *sheurplaying, *ssearchplaying;

  spausing =(pausing ? "ON" : "OFF");
  sthinking =(thinking ? "VISIBLE" : "INVISIBLE");
  slearning=(learning ? "ON" : "OFF");
  sheurplaying=(heurplaying ? "ON" : "OFF");
  ssearchplaying=(searchplaying ? "ON" : "OFF");

  printf("\nTeeko V1.0 Copyright Mihailo Despotovic 1997, 1998, 1999.\n");
  printf("This program is a part of my M.Sc. thesis ");
  printf("\"Learning in Strategic Games\".\n");
  printf("More info is available on URL http://members.xoom.com/mihailod\n");
  printf("INTERACTIVE MODE (for BATCH MODE, type 'teeko -?' at the prompt)\n");
  printf("[1] Play: you play the first move\n");
  printf("[2] Play: program plays the first move\n");
  printf("[3] Play: autoplay mode (pause is %s)\n", spausing);
  printf("[p] Pause for autoplay mode switcher\n");
  printf("[h] Heuristic is %s\n", sheurplaying);
  printf("[s] Searching is %s\n", ssearchplaying);
  printf("[l] Learning is  %s\n", slearning);
  printf("[t] Thinking is %s\n", sthinking);
  printf("[?] Current statistics\n");
  printf("[r] Rules of the game\n");
  printf("[/] Help\n");
  printf("[q] Quit\n");
  printf("Choose an option, then press ENTER to continue. >");
 } /* menu */

void rules(void)
 {
  char s[80];

  printf("\nRules.\n\n");
  printf("Teeko is played on the 5x5 board. Both opponents have four pawns.\n");
  printf("The goal of the game is to make a four in a row or a square ");
  printf("pattern.\n");
  printf("The game itself consists of two parts. First, pawns are put to\n");
  printf("the board one by one. This is called the opening. ");
  printf("After that,\npawns can be moved around to free surrounding ");
  printf("fields only.\n");
  printf("Move your pawns and try to outdo your opponent!\n\n");
  printf("(See the help for the details about putting and moving pawns\n");
  printf("and other game related commands.)\n\n");
  printf("Press ENTER to return to the main menu. >");
  (void)fgets(s, 80, stdin);
 } /* rules */

void help(void)
 {
  char s[80];
 
  printf("\nHelp (for interactive, menu driven mode).\n\n");
  printf("In the opening sequence, you enter two numbers in format XY .\n");
  printf("Those numbers define where you want to put your pawn.\n");
  printf("In the game, you enter four numbers in format ABCD .\n");
  printf("That means you want to move your pawn from AB to CD .\n\n");
  printf("Once started, the game can be quitted by entering q .\n\n");
  printf("You can choose to see the thinking process during the game.\n");
  printf("If this option is ON, you will be informed about heuristic\n");
  printf("moves (m4 = make four, a4 = avoid four, md3 = make double three,\n");
  printf("mnd3 = make non-defendable three, ad3 = avoid double three,\n");
  printf("and3 = avoid non-defendable three, rnd = random move),\n");
  printf("about progress of minimax searching of the game tree(each dot\n");
  printf("represents expanding of one position at the first level of the\n");
  printf("game tree to the second level) and about learning (each dot\n");
  printf("in recalling process (during the game) represents a found\n");
  printf("successor of the current position in program's memory, and\n");
  printf("in the process of updating the memory (after the game), you\n");
  printf("will be informed about adding a new positions and updating of\n");
  printf("values of the positios that have been already seen).\n");
  printf("You will also be informed about position evaluation values.\n\n");
  printf("Press ENTER to return to the main menu. >");
  (void)fgets(s, 80, stdin);
 } /* help */

void defeat(void)
 {
  char s[80];

  if(p0!=0)
   {
    printf("\nYou have won.\n");
    if(p0==1) statupdate('F', 'L');
     else statupdate('S', 'L');
   }
  else
   {
    if(p==1)
     {
      printf("\nPlayer II (O) has won.\n");
      statupdate('A', 'L');
     }
    else
     {
      printf("\nPlayer I (X) has won.\n");
      statupdate('A', 'W');
     }
   }

  if(repeat==0)
   {
    if(learning) updatememory();
    printf("Press ENTER to return to the main menu. >");
    (void)fgets(s, 80, stdin);
   }
  else
   {
    if(autol1==1 || autol2==1) updatememory();
   }
 } /* defeat */

void win(void)
 {
  char s[80];

  if(p0!=0)
   {
    printf("\nProgram has won.\n");
    if(p0==1) statupdate('F', 'W');
     else statupdate('S', 'W');
   }
  else
   {
    if(p==1)
     {
      printf("\nPlayer II (O) has won.\n");
      statupdate('A', 'L');
     }
    else
     {
      printf("\nPlayer I (X) has won.\n");
      statupdate('A', 'W');
     }
   }

  if(repeat==0)
   {
    if(learning) updatememory();
    printf("Press ENTER to return to the main menu. >");
    (void)fgets(s, 80, stdin);
   }
  else
   {
    if(autol1==1 || autol2==1) updatememory();
   }
 } /* win */

void draw(void)
 {
  char s[80];

  switch(p0)
   {
    case  0: statupdate('A', 'D'); break;
    case -1: statupdate('S', 'D'); break;
    case  1: statupdate('F', 'D'); break;
   }
  
  if(repeat==0)
   {
    printf("\nThe game has been drawn.\n");
    printf("Memory has not been updated.\n");
    printf("Press ENTER to return to the main menu. >");
    (void)fgets(s, 80, stdin);
   }
  else
   {
    printf("\nThe game has been drawn.\n");
   }
 } /* draw */

int offerdraw(void)
 {
  char s[80];

  printf("\nWould you consider this one as a draw? [y/n] >");
  (void)fgets(s, 80, stdin);
  if(s[0]=='y') return 1;
  return 0;
 } /* offerdraw */

void gamebreak(void)
 {
  char s[80];

  if(n<9) printf("\nThe opening has been interrupted.\n");
   else printf("\nThe game has been interrupted.\n");

  if(n>=9) printf("Memory has not been updated.\n");
  removefiles();

  printf("Press ENTER to return to the main menu. >");
  (void)fgets(s, 80, stdin);
 } /* gamebreak */

void error(char *s)
 {
  printf("\n\n\n\n\nFatal error:\n");
  printf(s);
  printf("\nAttempting to close all files... ");
  closefiles();
  printf("OK\n");
  printf("Attempting to remove all temporary files... ");
  removefiles();
  printf("OK\n");
  printf("\nAttempting to exit with exit code %d.\n", EXIT_FAILURE);
  exit(EXIT_FAILURE);
 } /* error */

void quitgame(void)
 {
  removefiles(); 
  exit(EXIT_SUCCESS);
 } /* quitgame */

void autointro(void)
 {
  char *sh1, *ss1, *sl1;
  char *sh2, *ss2, *sl2;

  sh1=(autoh1 ? " ON" : "OFF");
  ss1=(autos1 ? " ON" : "OFF");
  sl1=(autol1 ? " ON" : "OFF");
 
  sh2=(autoh2 ? " ON" : "OFF");
  ss2=(autos2 ? " ON" : "OFF");
  sl2=(autol2 ? " ON" : "OFF");

  printf("\n");
    
  printf("Playing %d games in batch mode.\n", repeat);
  printf("---------------------------------------\n");
  printf("          Heuristics Searching Learning\n");
  printf("Player 1     %s      %s        %s\n", sh1, ss1, sl1);
  printf("Player 2     %s      %s        %s\n", sh2, ss2, sl2);
  printf("---------------------------------------\n");
 } /* autointro */

void usage(void)
 {
  printf("\nTeeko V1.0 Copyright Mihailo Despotovic 1997, 1998, 1999.\n");
  printf("This program is a part of my M.Sc. thesis ");
  printf("\"Learning in Strategic Games\".\n");
  printf("More info is available on URL http://members.xoom.com/mihailod\n");
  printf("BATCH MODE (for INTERACTIVE MODE, type 'teeko' at the prompt)\n");
  printf("Usage:");
  printf(" teeko [{-?}|{{+|-}h{+|-}s{+|-}l {{+|-}h{+|-}s{+|-}l file {n}}]\n");
  printf(" -? prints these help lines.\n");
  printf(" + turns ON the option; - turns OFF the option.\n");
  printf(" Options are: s (searching), h (heuristics) and l (learning).\n");
  printf(" file denotes the file you want player 2 to use as his memory.\n");
  printf(" n denotes the number of games you want the program to play.\n");
  printf(" Example: teeko +h+s-l -h-s+l mem2.m 100\n");
  printf("  (play 100 games, player 1 must not use learning,\n");
  printf("   and player 2 must not use heuristics and searching\n");
  printf("   and must use file 'mem2.m' as his main memory.)\n");
  quitgame();
 } /* usage */

