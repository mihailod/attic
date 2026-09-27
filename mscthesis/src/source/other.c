/* other.c - other functions */

void error(char*); /* call in fileio.c */

/*
  void myitoa(int, char*) - because of compatibility, we use this one
                            which includes maxlearn test (10^WIDTH -1)
  void switcher(int*) - switches 0/1 (used for general ON/OFF switching)
  int parse(int, char**) - parses the command line parameters 
*/

void myitoa(int nn, char *digits)
 {
  int i, digit, maxlearn;

  maxlearn=1;
  for(i=0; i<=WIDTH-1; i++) maxlearn*=10; /* avoid pow and use of math.h */
  maxlearn--;

  if(nn>maxlearn) error("Learned number is too big.");

  for(i=0; i<=WIDTH-1; i++) digits[i]=' ';

  i=WIDTH-1;
  for(;;)
   {
    if(nn==0) return;
    
    digit=nn%10;
    nn=(nn-digit)/10;

    digits[i--]="0123456789"[digit]; /* character arrangement indenpendence */
   }
 } /* myitoa */

void switcher(int *arg)
 {
  if(*arg==1)
   { 
    *arg=0;
    return;
   }

  *arg=1;
 } /* switcher */

int parse(int argc, char *argv[])
 {
  /* parse the number of arguments */
  if(argc==1) return 0; /* start menu mode */
  if(argc!=5) return 1; /* error */

  /* parse the first argument {+|-}s{+|-}h{+|-}l */
  if(argv[1][0]!='-' && argv[1][0]!='+') return 1;
  if(argv[1][2]!='-' && argv[1][2]!='+') return 1;
  if(argv[1][4]!='-' && argv[1][4]!='+') return 1;
  if(argv[1][1]!='h') return 1;
  if(argv[1][3]!='s') return 1;
  if(argv[1][5]!='l') return 1;

  /* parse the second argument {+|-}s{+|-}h{+|-}l */
  if(argv[2][0]!='-' && argv[2][0]!='+') return 1;
  if(argv[2][2]!='-' && argv[2][2]!='+') return 1;
  if(argv[2][4]!='-' && argv[2][4]!='+') return 1;
  if(argv[2][1]!='h') return 1;
  if(argv[2][3]!='s') return 1;
  if(argv[2][5]!='l') return 1;

  /* set the parameters for player 1 */
  if(argv[1][0]=='+') autoh1=1;
   else autoh1=0;
  if(argv[1][2]=='+') autos1=1;
   else autos1=0;
  if(argv[1][4]=='+') autol1=1;
   else autol1=0;

  /* set the parameters for player 2 */
  if(argv[2][0]=='+') autoh2=1;
   else autoh2=0;
  if(argv[2][2]=='+') autos2=1;
   else autos2=0;
  if(argv[2][4]=='+') autol2=1;
   else autol2=0;

  /* parse the third argument (the name of the memory file
     for player 2 */
  memp2=argv[3]; /* file existence will be shecked later, for now
                    just fetch the name */

  /* parse the fourth argument n (the number)
     and assign the corresponding value to the global */
  repeat=atoi(argv[4]);
  if(repeat==0) return 1; /* not a valid number or 0 */

  return 0;
 } /* parse */

