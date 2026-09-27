#include <stdlib.h>
#include <dos.h>
#include <stdio.h>
#include <conio.h>
#include <graphics.h>
#include <string.h>
#include <dos.h>

void init_gr(void) // inicijalizuj grafiku u EGAHI modu
 {
  int driver,mode,gr;

  driver=DETECT;
  initgraph(&driver,&mode,"");
  if ((gr=graphresult())!=grOk)
   {
    printf("\n Greska u grafici! (da li je tu .BGI fajl !?!)");
    printf("\n\n Error Code : %i Bilo koji taster...",gr);
    getch();
    return;
   }
  setgraphmode(VGAHI);
 } // init_gr

void paleta(void)
 {
  char str[40];
  int i;

  for(i=0;i<=15;i++)
   {
    sprintf(str,"%02d\0",i);
    setfillstyle(SOLID_FILL,i);

    setcolor(WHITE);
    outtextxy(20,23+15*i,str);
    bar(40,20+15*i,200,30+15*i);
    setcolor(i);
    outtextxy(220,23+15*i,"Primer teksta : Mihailo Despotovic\0");
   }
  return;
 } // paleta

void zvezda(void)
 {
  int i,xstart,ystart,d0,d1,d2;
  int velicina,fadein,pause,fadeout,r;
  int bzvezde,b1,b2,tip;
  int duz_zvuka,frek;
  float xpom,ypom;

  xstart=320;    // x koordinata zvezde je sredina ekrana (EGAHI mod)
  ystart=240;    // y koordinata zvezde je sredina ekrana (EGAHI mod)
  r=0;           // poluprecnik zvezde (moze i 0)
  xpom=1.0;      // mnozilac za horizontalni poluprecnik eksplozije
  ypom=1.0;      // mnozilac za vertikalni poluprecnik eksplozije
  d0=1;          // mnozilac za bele svetlosne zrake
  d1=3;          // mnozilac za svetlo sive svetlosne zrake
  d2=6;          // mnozilac za sivi svetlosni zrak
  velicina=20;   // koliko puta (broj frame-ova) se uvecava i smanjuje
  fadein=2;      // pauza pri animaciji uvecavanja
  pause=400;     // pauza izmedju vrhunca i smanjivanja
  fadeout=30;    // pauza pri animaciji smanjivanja
  bzvezde=WHITE; // boja zvezde i najsjajnijih zraka
  b1=LIGHTGRAY;  // boja malo tamnijih zraka
  b2=DARKGRAY;   // boja najtamnijih zraka
  tip=3;         // tip zvezde (moze biti 1,2 ili 3)
  duz_zvuka=0.0; // koliko traje zvuk
  frek=8000;     // koje je frekvencije zvuk

  xstart=200+random(220); // x koordinata slucajna - removati za centar
  ystart=100+random(190); // y koordinata slucajna - removati za centar
  setcolor(bzvezde);
  circle(xstart,ystart,r);
  setfillstyle(SOLID_FILL,bzvezde);
  floodfill(xstart,ystart,bzvezde);

  for(i=1;i<=velicina;i++)
   {
    delay(fadein);

    setcolor(bzvezde);
    line(xstart,ystart,xstart-d0*i*xpom,ystart);
    line(xstart,ystart,xstart+d0*i*xpom,ystart);
    line(xstart,ystart,xstart,ystart-d0*i*ypom);
    line(xstart,ystart,xstart,ystart+d0*i*ypom);

    if(tip>1)
     {
      line(xstart,ystart+1,xstart-d0*i*xpom,ystart+1);
      line(xstart,ystart+1,xstart+d0*i*xpom,ystart+1);
      line(xstart+1,ystart,xstart+1,ystart-d0*i*ypom);
      line(xstart+1,ystart,xstart+1,ystart+d0*i*ypom);
     }

    if(tip==3)
     {
      line(xstart,ystart-1,xstart-d0*i*xpom,ystart-1);
      line(xstart,ystart-1,xstart+d0*i*xpom,ystart-1);
      line(xstart-1,ystart,xstart-1,ystart-d0*i*ypom);
      line(xstart-1,ystart,xstart-1,ystart+d0*i*ypom);
     }

    setcolor(b1);
    line(xstart-d0*i*xpom,ystart,xstart-d1*i*xpom,ystart);
    line(xstart+d0*i*xpom,ystart,xstart+d1*i*xpom,ystart);
    line(xstart,ystart-d0*i*ypom,xstart,ystart-d1*i*ypom);
    line(xstart,ystart+d0*i*ypom,xstart,ystart+d1*i*ypom);

    if(tip!=1)
     {
      line(xstart-d0*i*xpom,ystart+1,xstart-d1*i*xpom,ystart+1);
      line(xstart+d0*i*xpom,ystart+1,xstart+d1*i*xpom,ystart+1);
      line(xstart+1,ystart-d0*i*ypom,xstart+1,ystart-d1*i*ypom);
      line(xstart+1,ystart+d0*i*ypom,xstart+1,ystart+d1*i*ypom);
     }

    setcolor(b2);
    line(xstart-d1*i*xpom,ystart,xstart-d2*i*xpom,ystart);
    line(xstart+d1*i*xpom,ystart,xstart+d2*i*xpom,ystart);
    line(xstart,ystart-d1*i*ypom,xstart,ystart-d2*i*ypom);
    line(xstart,ystart+d1*i*ypom,xstart,ystart+d2*i*ypom);
   }

  sound(frek);
  delay(duz_zvuka);
  nosound();
  delay(pause-duz_zvuka);

  for(i=velicina;i>=4;i--)
   {
    delay(fadeout);

    setcolor(bzvezde);
    line(xstart,ystart,xstart-d0*i*xpom,ystart);
    line(xstart,ystart,xstart+d0*i*xpom,ystart);
    line(xstart,ystart,xstart,ystart-d0*i*ypom);
    line(xstart,ystart,xstart,ystart+d0*i*ypom);

    if(tip>1)
     {
      line(xstart,ystart+1,xstart-d0*i*xpom,ystart+1);
      line(xstart,ystart+1,xstart+d0*i*xpom,ystart+1);
      line(xstart+1,ystart,xstart+1,ystart-d0*i*ypom);
      line(xstart+1,ystart,xstart+1,ystart+d0*i*ypom);
     }

    if(tip==3)
     {
      line(xstart,ystart-1,xstart-d0*i*xpom,ystart-1);
      line(xstart,ystart-1,xstart+d0*i*xpom,ystart-1);
      line(xstart-1,ystart,xstart-1,ystart-d0*i*ypom);
      line(xstart-1,ystart,xstart-1,ystart+d0*i*ypom);
     }

      setcolor(b1);
      line(xstart-d0*i*xpom,ystart,xstart-d1*i*xpom,ystart);
      line(xstart+d0*i*xpom,ystart,xstart+d1*i*xpom,ystart);
      line(xstart,ystart-d0*i*ypom,xstart,ystart-d1*i*ypom);
      line(xstart,ystart+d0*i*ypom,xstart,ystart+d1*i*ypom);

    if(tip!=1)
     {
      line(xstart-d0*i*xpom,ystart+1,xstart-d1*i*xpom,ystart+1);
      line(xstart+d0*i*xpom,ystart+1,xstart+d1*i*xpom,ystart+1);
      line(xstart+1,ystart-d0*i*ypom,xstart+1,ystart-d1*i*ypom);
      line(xstart+1,ystart+d0*i*ypom,xstart+1,ystart+d1*i*ypom);
     }

    setcolor(b2);
    line(xstart-d1*i*xpom,ystart,xstart-d2*i*xpom,ystart);
    line(xstart+d1*i*xpom,ystart,xstart+d2*i*xpom,ystart);
    line(xstart,ystart-d1*i*ypom,xstart,ystart-d2*i*ypom);
    line(xstart,ystart+d1*i*ypom,xstart,ystart+d2*i*ypom);

    setcolor(BLACK);
    line(xstart-d1*i*xpom,ystart+1,xstart-d2*(i+1)*xpom,ystart+1);
    line(xstart+d1*i*xpom,ystart+1,xstart+d2*(i+1)*xpom,ystart+1);
    line(xstart+1,ystart-d1*i*ypom,xstart+1,ystart-d2*(i+1)*ypom);
    line(xstart+1,ystart+d1*i*ypom,xstart+1,ystart+d2*(i+1)*ypom);

    line(xstart-d2*i*xpom,ystart,xstart-d2*(i+1)*xpom,ystart);
    line(xstart+d2*i*xpom,ystart,xstart+d2*(i+1)*xpom,ystart);
    line(xstart,ystart-d2*i*ypom,xstart,ystart-d2*(i+1)*ypom);
    line(xstart,ystart+d2*i*ypom,xstart,ystart+d2*(i+1)*ypom);

    line(xstart-d0*i*xpom,ystart-1,xstart-d1*i*xpom,ystart-1);
    line(xstart+d0*i*xpom,ystart-1,xstart+d1*i*xpom,ystart-1);
    line(xstart-1,ystart-d0*i*ypom,xstart-1,ystart-d1*i*ypom);
    line(xstart-1,ystart+d0*i*ypom,xstart-1,ystart+d1*i*ypom);
   }
 } // zvezda


int main(void)
 {
  init_gr();

  paleta();
  getch();

  clearviewport();
  getch();

  do
   {
    zvezda();
    clearviewport();
   }
  while(getch()!=27); // ceka se pritisak na Esc

  restorecrtmode(); // nemoj pokvariti mod iz koga si pozvan
  return 0;
 } // main 16.-19. Mart. 1996.
