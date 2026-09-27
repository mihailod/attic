/* opening.c - plays the opening */

/*
  int getopeningmove(void) - human's opening move, 0:OK 1:BREAK
  void move1(void) - plays the first move (ply and reply)
  void move3(void) - plays the second move (ply)
  void move4(void) - plays the second move (reply)
  void move5(void) - plays the third move (ply)
  void move6(void) - plays the third move (reply)
  void move7(void) - plays the fourth move (ply and reply)
  void putopeningmove(void) - computer's opening move
  int opening(void) - opening entry, -1:DEFEAT 0:DRAW 1:WIN -2:BREAK
*/

int getopeningmove(void)
 {
  char s[80];
  char *phase;

  if(p0==-1) phase="[Ply]\0";
   else phase="[Reply]\0";

  l:
   printf("\n[Move %d] %s Enter your opening move... >",(n+1)/2,phase);
   (void)fgets(s, 80, stdin);
   if(s[0]=='q') return 1;
   if(s[0]<'0'||s[0]>'4'||s[1]<'0'||s[1]>'4'||X[s[0]-'0'][s[1]-'0']!=0) goto l;

  X[s[0]-'0'][s[1]-'0']=-1;
  return 0;
 } /* getopeningmove */

void move1(void)
 {
  int t;

  if(p0!=0) t=1;
   else t=p;

  if(X[2][2]==0)
   {
    oplayinthemiddle(t);
   }
  else
   {
    if(X[1][1]==0 || X[1][3]==0 || X[3][1]==0 || X[3][3]==0)
     {
      oplayinthecorner(t);
     }
    else /* call from another move */
     {
      oplayinthecross(t);
     }
   }
 } /* move1 */

void move3(void) /* make "dangerous" two heuristic */
 {
  int t;

  if(p0!=0) t=1;
   else t=p;

  omake2(t);
 } /* move3 */

void move4(void) /* avoid "dangerous three" heuristic */
 {
  int t, e;

  if(p0!=0) { t=1; e=-1; }
   else { t=p; e=-p; }

  if(oavoid3(t, e)) return;
   else move3();
 } /* move4 */

void move5(void)
 {
  int t;

  if(p0!=0) t=1;
   else t=p;

  if(omake3(t)) return;
   else move4();
 } /* move5 */

void move6(void)
 {
  int t, e;

  if(p0!=0) { t=1; e=-1; }
   else { t=p; e=-p; } 

  if(oavoid4(t, e)) return;
   else move5();
 } /* move6 */

void move7(void)
 {
  int t;

  if(p0!=0) t=1;
   else t=p; 

  if(omake4(t)) return;
   else move6();
 } /* move7 */

void putopeningmove(void)
 {
  switch(n)
   {
    case 1:
    case 2: move1(); break;
    case 3: move3(); break;
    case 4: move4(); break;
    case 5: move5(); break;
    case 6: move6(); break;
    case 7:
    case 8: move7(); break;
   }
 } /* putopeningmove */

int opening(void)
 {
  int ret;
  char s[80];
  char *phase;

  for(;;)
   {
    int t, e;
    
    if(n==9) return 0; /* opening sequence is drawn */

    if(n>=7) /* win in opening can occur in 7th or 8th move only */
     {
      if(p0!=0) { t=1; e=-1; }
       else { t=p; e=-p; }

      ret=four(X, t);
      if(ret) return 1; /* t has won the opening */
      ret=four(X, e);
      if(ret) return -1; /* e has won the opening */
     }

    if(p0!=0)
     {
      if(repeat==0)
       {
        if(n==1) printf("\n");
       }

      if(p==1)
       {
        if(p0==1) phase="[Ply]\0";
         else phase="[Reply]\0";

        if(repeat==0)
         {
          printf("\n[Move %d] %s Thinking...\n", (n+1)/2, phase);
         }
        putopeningmove();
       }
      else 
       {
        if(getopeningmove()) return -2;
       }
     }
    else
     {
      if(repeat==0)
       {
        if(n==1) printposition(X, 1);
       }

      if(pausing)
       {
        printf("\nPress ENTER for the next move... >");
        (void)fgets(s, 80, stdin);
        if(s[0]=='q') return -2;
       }

      if(p==1) phase="[Ply]\0";
       else phase="[Reply]\0";

      if(repeat==0)
       {
        printf("\n[Move %d] %s Thinking...\n", (n+1)/2, phase);
       }
      putopeningmove();
 
     }

    if(repeat==0)
     {
      if(p0==0) printposition(X, 1);
       else printposition(X, p0);
     }

    nextinit();
   }
 } /* opening */

