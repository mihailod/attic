#include<stdio.h>

FILE *dat1,*dat2;


void usage(void)
 {
  printf("\n.HTM -> .TXT converter by Mihailo Despotovic, 07.Feb.1997.\n");
  printf("Usage : htm2txt dat1 dat2\n");
 }


int main(int argc,char **argv)
 {
  char c;
  int ind=0;


  if(argc!=3) { usage(); return(1); }

  if((dat1=fopen(argv[1],"r"))==NULL)
   {
    fprintf(stderr,"\nSource file does not exists...\n");
    return 1;
   }

  if((dat2=fopen(argv[2],"w"))==NULL)
   {
    fprintf(stderr,"\nCould not open destination file...\n");
    return 1;
   }

  for(;;)
   {
    c=fgetc(dat1);
    if(c==EOF) break;

    if(c=='<') { ind=1; continue; }

    if(c=='>') { ind=0; continue; }

    if(ind==1) continue;

    fputc(c,dat2);

   }

  fcloseall();

  printf("\nDone !\n");
  return 0;
 }