/* update.c - improving global memory file by examining of recent game */

/*
  Description of the global and local memory files.

  Global memory file.

  File = A*
  A = PWL
  P = X*25
  X = 0|1|2
  W = D*WIDTH
  L = D*WIDTH
  D = space|0|1|2|3|4|5|6|7|8|9

  Example: 0120002010021002100000100  23 120
  means that the position 01200
                          02010
                          02100
                          21000
                          00100 occured 23 times when 1 (X) won
                                and 120 times when 1 (X) lost

  File name is memory.m .

  Local memory file.

  Same, except there are no numbers. File is just bunch of chunks
  with lenght 25 representing positions have been played in the
  just finished game (which has not finished as a draw).

  File name is game.m (this is temporary file, it will be removed
                       after the exit from the program)
*/

/*
  void addposition(position_t, int) - adds an unknown position with values
                                      1 or 0 for won / lost (int argument)
  void adjustposition(position_t, int) - increases value for known position
                                         (int argument tells which one)
  void remember(position_t) - remembers position (wrapper for add/adjust)
  void doupdate(void) - does update
  void updatememory(void) - main entry into the learning process
*/

void addposition(position_t ptmp, int w)
 {
  gotoendofmemory();
  saveposition(ptmp, m);
  
  if(thinking) printf ("Add ");

  if(w<0) /* O has won here, add and set its number (skip, then update) */ 
   {
    putspaces();
    putnumber(1, m);
   }
  else /* X has won here, add and set his number (update, then skip) */
   {
    putnumber(1, m);
    putspaces();
   }
 } /* addposition */

void adjustposition(position_t ptmp, int w)
 {
  int i;
  int currentlearned; /* bits compatibility problem - WIDTH is now 4 for
                         16bit compatibility. if it was 5 it could handle
                         number > 32767 in 32bit OS but it would be
                         importable to 16bit environments */

  if(thinking) printf("Adjust ");

  findposition(ptmp);

  if(w<0) skip(m); /* O won, skip X's number */

  for(i=0; i<=WIDTH-1; i++) learnednumber[i]=' '; /* clear number */
  getnumber(m);

  currentlearned=atoi(learnednumber); /* get current number */
  currentlearned++; /* increment it */

  getback(m); /* go back in file! */
  putnumber(currentlearned, m); /* now, put the new, incremented, number */

 } /* adjustposition */

void remember(position_t ptmp)
 {
  int ret, w, found;
  position_t current, icurrent, memorized;

  if(n%2) w=-1;
   else w=1; /* who has won */

  copyposition(ptmp, current);
  invertposition(ptmp, icurrent);

  found=0;

  for(;;)
   {
    ret=loadposition(memorized, m);
    if(ret==1) { found=0; break; }

    if(comparepositions(memorized, current))
     {
      found=1;
      adjustposition(memorized, w); /* found X's win, update it */
      break;
     }

    if(comparepositions(memorized, icurrent))
     {
      found=1;
      adjustposition(memorized, -w); /* found O's win, update it */
      break;
     }

    skip(m); /* skips won info (WIDTH digits) in memory.m */
    skip(m); /* skips lost info (WIDTH digits) in memory.m */
   }

  if(found) return;

  addposition(ptmp, w); /* did not find position, add it */
 } /* remember */

void doupdate(void)
 {
  int ret;
  position_t ptmp;
  opengamememory_read();

  for(;;)
   {
    ret=loadposition(ptmp, g);
    if(ret==1) break;
    
    openmemory_readwrite(); /* tried to encapsulate open and close into
                               remember, but strange bug occured...
                               not sure if it is MSVC bug or what... */
    remember(ptmp);
    closememory();
   }

  closegamememory();
 } /* doupdate */

void updatememory(void)
 {
  if(!learning || n<9) return; /* because actually the 5th move is
                                  the first recorded one */

  if(repeat==0)
   {
    if(thinking) printf("Updating memory...\n");
    doupdate();
    if(thinking) printf("\n"); /* after Add... Adjust... */
   }
  else
   {
    if(autol1==1)
     {
      p=1; /* force opening of player 1's memory file */
      doupdate();
     }

    if(autol2==1)
     {
      p=-1; /* force opening of player 2's memory */
      doupdate();
     }
   }
 } /* updatememory */

