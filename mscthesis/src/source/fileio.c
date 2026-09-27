/* fileio.c - general working with files (wrappers, etc...) */

int comparepositions(position_t, position_t); /* call in position.c */
void statreset(void); /* call in stat.c */

/*
  NOTE:
   because of portability we are using max 6 chars for the file name
   and one char for the extension (all of them are in the same case)
   as those specs have been defined as "most portable file name"
   ("Portability and the C Language", Rex Jaeschke, Hayden Books,
   Indianapolis, Indiana, USA, 1989., page 277.)
*/

/*
  void openlevel1_read(void) - opens for reading file for first level
  void openlevel1_write(void) - opens the file for the first level of moves
  void closelevel1(void) - closes the file for level 1
  void openlevel2_read(void) - opens the file for the second level for reading
  void openlevel2_write(void) - opens the file for the second level of moves
  void closelevel2(void) - closes the file for level 2
  void putmarkerl2(void) - puts the marker for end of developing in level2 file
  void saveposition(position_p, FILE*) - saves the position in the format
                                         0012002...(25 chars)..012@ where 2
                                         stands for -1 and @ is the end of the
                                         sequence
  int loadposition(position_p, FILE*) - loads the position from the file
                                        1:EOF 2:MARKER FOUND
  void opengamememory_read(void) - opens the current game memory for reading
  void opengamememory_write(void) - opens the current game memory for writing
  void closegamememory(void) - closes the current game memory file
  void creatememory(void) - creates a new memory.m memory file
  void openmemory_readwrite(void) - opens main memory file for
                                    reading and writing
  void closememory(void) - closes memory(1).m file
  void skip(void, FILE*) - skips WIDTH chars in file
  void putspaces(void) - puts WIDTH spaces into memory(1).m file
  void getback(void) - gets back WIDTH positions in memory(1).m file
  void getnumber(void, FILE*) - gets number from file
  void putnumber(int, FILE*) - puts number into file
  void findposition(position_t) - finds position in memory(1).m file
  void gotoendofmemory(void) - positions to the end of memory(1).m
  void createstat(void) - creates an empty statistic file stat.m
  void removestat(void) - removes statistic file stat.m
  void openstat_readwrite(void) - opens stat.m for reading and writing
  void closefiles(void) - closes all potentially opened files
  void removefiles(void) - cleans up all temporary files
*/

void openlevel1_read(void)
 {
  if((l1=fopen("level1.s", "r")) == NULL)
   error("Cannot open level1.s for reading.");
 } /* openlevel1_read */

void openlevel1_write(void)
 {
  if((l1=fopen("level1.s", "w")) == NULL)
   error("Cannot open level1.s for writing.");
 } /* openlevel1_write */

void closelevel1(void)
 {
  if(fclose(l1) == EOF)
   error("Cannot close level1.s");
 } /* closelevel1 */

void openlevel2_read(void)
 {
  if((l2=fopen("level2.s", "r")) == NULL)
   error("Cannot open level2.s for reading.");
 } /* openlevel2_write */

void openlevel2_write(void)
 {
  if((l2=fopen("level2.s", "w")) == NULL)
   error("Cannot open level2.s for writing.");
 } /* openlevel2_write */

void closelevel2(void)
 {
  if(fclose(l2) == EOF)
   error("Cannot close level2.s");
 } /* closelevel2 */

void putmarkerl2(void)
 {
  if(fputc('X', l2) == EOF) error("Cannot fputc marker into level2.s");
 } /* putmarkerl2 */

void saveposition(position_t ptmp, FILE *f)
 {
  int i, j;
  char c=0;

  for(i=0; i<=4; i++)
   for(j=0; j<=4; j++)
    {
     switch(ptmp[i][j])
      {
       case -1: c='2'; break;
       case  0: c='0'; break;
       case  1: c='1'; break;
      }
     
     if(fputc(c, f) == EOF)
       error("Cannot fputc.");
    }
 } /* saveposition */

int loadposition(position_t ptmp, FILE *f)
 {
  int i, j, c;
  
  for(i=0; i<=4; i++)
   for(j=0; j<=4; j++)
    {
     c=fgetc(f);
     if(c==EOF) return 1;
     if(c=='X') return 2;

     switch(c)
      {
       case '2' : ptmp[i][j]=-1; break; 
       case '1' : ptmp[i][j]= 1; break;
       case '0' : ptmp[i][j]= 0; break;
      }
    }

  return 0;
 } /* loadposition */

void opengamememory_read(void)
 {
  if((g=fopen("game.m", "r")) == NULL)
   error("Cannot open game.m for reading.");
 } /* opengamememory_read */

void opengamememory_write(void)
 {
  if((g=fopen("game.m", "w")) == NULL)
   error("Cannot open game.m for writing.");
 } /* opengamememory_write */

void closegamememory(void)
 {
  if(fclose(g) == EOF)
   error("Cannot close game.m");
 } /* closegamememory */

void creatememory(void)
 {
  if((m=fopen("memory.m", "r+")) == NULL) /* filter */
   {
    printf("\nCreating new memory...\n");
    if((m=fopen("memory.m", "a+")) == NULL)
     error("Cannot create memory.m (fopen of memory.m with a+).");
    else
     printf("New memory file has been successfully created.\n");

    if(fclose(m) == EOF) 
     error("Cannot close just created memory.m .");
   }
 } /* creatememory */

void openmemory_readwrite(void)
 {
  if(repeat>0 && p==-1) /* open memory of player 2 in batch mode */
   {
    if((m=fopen(memp2, "r+")) == NULL)
     error("Cannot open memory of player 2 for reading and writing.");
    return;
   }

  /* open main memory (player 1's memory in batch mode) */
  if((m=fopen("memory.m", "r+")) == NULL)
    error("Cannot open memory.m for reading and writing.");
 } /* openmemory_write */

void closememory(void)
 {
  if(fclose(m) == EOF)
   error("Cannot close memory.");
 } /* closememory */

void skip(FILE *f)
 {
  int i;

  for(i=0; i<=WIDTH-1; i++)
   {
    if(fgetc(f)==EOF)
     error("Cannot skip.");
   }
 } /* skip */

void putspaces(void)
 {
  int i;

  for(i=0; i<=WIDTH-1; i++)
   {
    if(fputc(' ', m)==EOF)
     error("Cannot fputc space into memory.m .");
   }
 } /* putspaces */

void getback(FILE *f)
 {
  if(fseek(f, -WIDTH, SEEK_CUR) == -1)
   error("Cannot fseek backwards for getback.");
 } /* getback */

void getnumber(FILE *f)
 {
  int i, c;
 
  for(i=0; i<=WIDTH-1; i++)
   {
    c=fgetc(f);
    if(c==EOF) error("Cannot fgetc (getnumber).");
     else learnednumber[i]=(char)c;
   }
 } /* getnumber */

void putnumber(int nn, FILE *f)
 {
  int i;
  char num[WIDTH];

  for(i=0; i<=WIDTH-1; i++) num[i]=' ';

  myitoa(nn, num);
  
  for(i=0; i<=WIDTH-1; i++)
   {
    if(fputc(num[i], f)==EOF)
     error("Cannot fputc (putnumber).");
   }
 } /* putnumber */

void findposition(position_t ptmp)
 {
  position_t pcur;

  rewind(m);

  for(;;)
   {
    if(loadposition(pcur, m))
     error("Unknown error in fileio - loadposition failed.");
    if(comparepositions(pcur, ptmp)) break;
    skip(m);
    skip(m);
   }
 } /* findposition */

void gotoendofmemory(void)
 {
  if(fseek(m, 0, SEEK_END) == -1)
   error("Cannot fseek to end of memory.m .");  
 } /* gotoendofmemory */

void createstat(void)
 {
  int i, toput;

  toput=9*WIDTH-1;

  if((st=fopen("stat.m", "r+")) == NULL) /* filter */
   {
    printf("\nCreating new statistic file...\n");
    if((st=fopen("stat.m", "a+")) == NULL)
     error("Cannot create stat.m (fopen of stat.m with a+).");
    else
     printf("New statistic file has been successfully created.\n");

    for(i=0; i<=toput; i++)
     {
      if(fputc(' ', st)==EOF)
       error("Cannot fputc space into stat.m .");
     }

    if(fclose(st) == EOF) 
     error("Cannot close just created stat.m .");
   }
 } /* createstat */

void removestat(void)
 {
  (void)remove("stat.m");
 } /* removestat */

void openstat_readwrite(void)
 {
  if((st=fopen("stat.m", "r+")) == NULL)
   error("Cannot open stat.m for reading and writing.");
 } /* openstat_read */

void closestat(void)
 {
  if(fclose(st) == EOF)
   error("Cannot close stat.m");
 } /* closestat */

void closefiles(void)
 {
  if(l1!=NULL) (void)fclose(l1);
  if(l2!=NULL) (void)fclose(l2);
  if(g!=NULL) (void)fclose(g);
  if(m!=NULL) (void)fclose(m);
  if(st!=NULL) (void)fclose(st);
 } /* closefiles */

void removefiles(void)
 {
  (void)remove("level1.s");
  (void)remove("level2.s");
  (void)remove("game.m");
 } /* removefiles */

