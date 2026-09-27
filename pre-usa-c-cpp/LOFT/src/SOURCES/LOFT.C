#include <dos.h>
#include <graphics.h>
#include <time.h>
#include <stdio.h>
#include <conio.h>
#include <alloc.h>

#include "hyper.c"

void pritisak(int timer);
void trougao(int y);
void sop(int timer);
void brisi(void);
void tus(void);
void tusiraj(int timer);
void kraj(void);
void experiment(void);
void nacrtaj(void);
int  uradi(int timer);
void menu(void);
void pomoc(void);
void protok(int timer);
void protok2(int timer);
void odbroj(int timer);
void brojac(int timer);
void teci(int timer,int sta);
void teci2(int timer,int sta);
void funkcije(int timer);
void opis(void);
void mis(void);

void *buffer;
int kasnjenje=1000;         /* izbazdariti... */
int snaga[301];
float gorivo[301];
float kosuljica[301];
float nosioc[301];
float s[301];
float p[301];

unsigned int patterns[4] = { 0xfff0, 0xff0f, 0xf0ff, 0x0fff };

float q(int i,int x1,int x2,int y1,int y2)
{
 float temp;

 temp=y1+((i-x1)*(y2-y1))/(x2-x1);
 return temp;
}

void init(void)
{
 int i;

 for(i=0;i<=300;i++)
  {
   if(i<=64) snaga[i]=-0.051*i+50;
   else if(i>64 && i<=106) snaga[i]=-0.966*i+108.39;
   else if(i>106) snaga[i]=-0.03*i+9.12;

   if         (i< 11) { gorivo[i]=q(i,  0, 10, 728, 990); kosuljica[i]=q(i,  0, 10,319,331); nosioc[i]=q(i,  0, 10,293,292); }
   if(i> 10 && i< 21) { gorivo[i]=q(i, 10, 20, 990,1058); kosuljica[i]=q(i, 10, 20,331,336); nosioc[i]=q(i, 10, 20,292,294); }
   if(i> 20 && i< 31) { gorivo[i]=q(i, 20, 31,1058,1071); kosuljica[i]=q(i, 20, 31,336,338); nosioc[i]=q(i, 20, 31,294,294); }
   if(i> 30 && i< 42) { gorivo[i]=q(i, 31, 41,1071,1067); kosuljica[i]=q(i, 31, 41,338,338); nosioc[i]=q(i, 31, 41,294,295); }
   if(i> 41 && i< 52) { gorivo[i]=q(i, 41, 51,1067,1062); kosuljica[i]=q(i, 41, 51,338,338); nosioc[i]=q(i, 41, 51,295,295); }
   if(i> 51 && i< 62) { gorivo[i]=q(i, 51, 61,1062,1055); kosuljica[i]=q(i, 51, 61,338,338); nosioc[i]=q(i, 51, 61,295,296); }
   if(i> 61 && i< 73) { gorivo[i]=q(i, 61, 72,1055,1007); kosuljica[i]=q(i, 61, 72,338,337); nosioc[i]=q(i, 61, 72,296,297); }
   if(i> 72 && i< 83) { gorivo[i]=q(i, 72, 82,1007, 882); kosuljica[i]=q(i, 72, 82,337,331); nosioc[i]=q(i, 72, 82,297,299); }
   if(i> 82 && i< 93) { gorivo[i]=q(i, 82, 92, 882, 734); kosuljica[i]=q(i, 82, 92,331,325); nosioc[i]=q(i, 82, 92,299,300); }
   if(i> 92 && i<103) { gorivo[i]=q(i, 92,102, 734, 581); kosuljica[i]=q(i, 92,102,325,317); nosioc[i]=q(i, 92,102,300,302); }
   if(i>102 && i<113) { gorivo[i]=q(i,102,112, 581, 452); kosuljica[i]=q(i,102,112,317,312); nosioc[i]=q(i,102,112,302,303); }
   if(i>112 && i<123) { gorivo[i]=q(i,112,122, 452, 410); kosuljica[i]=q(i,112,122,312,312); nosioc[i]=q(i,112,122,303,306); }
   if(i>122 && i<134) { gorivo[i]=q(i,122,133, 410, 397); kosuljica[i]=q(i,122,133,312,314); nosioc[i]=q(i,122,133,306,309); }
   if(i>133 && i<144) { gorivo[i]=q(i,133,143, 397, 392); kosuljica[i]=q(i,133,143,314,316); nosioc[i]=q(i,133,143,309,312); }
   if(i>143 && i<154) { gorivo[i]=q(i,143,153, 392, 390); kosuljica[i]=q(i,143,153,316,319); nosioc[i]=q(i,143,153,312,315); }
   if(i>153 && i<164) { gorivo[i]=q(i,153,163, 390, 388); kosuljica[i]=q(i,153,163,319,322); nosioc[i]=q(i,153,163,315,318); }
   if(i>163 && i<174) { gorivo[i]=q(i,163,173, 388, 384);  }
   if(i>173 && i<184) { gorivo[i]=q(i,173,183, 384, 380);  }
   if(i>183 && i<195) { gorivo[i]=q(i,183,194, 380, 375);  }
   if(i>194 && i<205) { gorivo[i]=q(i,194,204, 375, 370);  }
   if(i>204 && i<215) { gorivo[i]=q(i,204,214, 370, 365);  }
   if(i>214 && i<225) { gorivo[i]=q(i,214,224, 365, 361);  }
   if(i>224 && i<235) { gorivo[i]=q(i,224,234, 361, 356);  }
   if(i>234 && i<246) { gorivo[i]=q(i,234,245, 356, 351);  }
   if(i>245 && i<256) { gorivo[i]=q(i,245,255, 351, 346);  }
   if(i>255 && i<266) { gorivo[i]=q(i,255,265, 346, 341);  }
   if(i>265 && i<276) { gorivo[i]=q(i,265,275, 341, 336);  }
   if(i>275 && i<287) { gorivo[i]=q(i,275,286, 336, 331);  }
   if(i>286 && i<301) { gorivo[i]=q(i,286,296, 331, 326);  }

   if(i> 164 && i<=234) nosioc[i]=318;
   if(i> 235 && i<=300) nosioc[i]=319;

   if(i>=162 && i< 194) kosuljica[i]=322;
   if(i>=194 && i< 245) kosuljica[i]=321;
   if(i>=245 && i< 286) kosuljica[i]=320;
   if(i> 286 && i<=300) kosuljica[i]=319;
  }

 s[0]=115;
 p[0]=15.00;
 for(i=1;i<=96;i++)    { s[i]=s[i-1]-0.417; p[i]=p[i-1]+0.024;   }
 for(i=97;i<=107;i++)  { s[i]=s[i-1]+0.500; p[i]=p[i-1]-0.100;   }
 for(i=108;i<=300;i++) { s[i]=s[i-1]      ; p[i]=p[i-1]-0.00416; }

}

void kraj(void)
{
 restorecrtmode();
 closegraph();
}

void main(void)
{

 int driver,mode;

 driver=DETECT;

 initgraph(&driver,&mode,"");   /* potrebni: EGAVGA.BGI i TRIP.CHR */
 setgraphmode(VGAHI);

 init();
 menu();
 kraj();
}

void menu(void)
{
 int c,l=1;

 do
 {
  if(l)
   {
    cleardevice();
    setcolor(BLACK);
    setfillstyle(1,WHITE);
    bar(0,0,getmaxx(),getmaxy());

    setlinestyle(SOLID_LINE,0,NORM_WIDTH);

    rectangle(1,1,638,478);

    setlinestyle(SOLID_LINE,0,NORM_WIDTH);
    settextstyle(TRIPLEX_FONT,HORIZ_DIR,7);
    outtextxy(30,0,"LOFT Eksperiment");

    settextstyle(TRIPLEX_FONT,HORIZ_DIR,4);
    outtextxy(160,70,"'Loss Of Fluid Test'");

    settextstyle(TRIPLEX_FONT,HORIZ_DIR,5);
    outtextxy(230,135,"1 Pomoc");
    outtextxy(230,175,"2 Opis");
    outtextxy(230,215,"3 Start");
    outtextxy(230,270,"0 Kraj");

    settextstyle(TRIPLEX_FONT,HORIZ_DIR,1);
    outtextxy(50,350," Idaho National Engeenering Laboratory, USA, April 1982.");
    outtextxy(26,400,"    Implementacija: A.Cirilovic (Masinski fakultet, Beograd)");
    outtextxy(38,420,"   M.Despotovic, V.Pejovic (Matematicki fakultet, Beograd)");
    outtextxy(280,450,"Mart 1995.");
   }

  c=getch();
  switch (c)
   {
    case '1': pomoc();
	      l=1;
	      break;
    case '2': opis();
	      l=1;
	      break;
    case '3': experiment();
	      l=1;
	      break;
    default:  l=0;
   }
  }
  while(c!='0');
  return;
 }

void pomoc(void)
{
 int y;
 char *string[16];
 cleardevice();
 setfillstyle(1,WHITE);
 bar(0,0,getmaxx(),getmaxy());
 setcolor(BLACK);


 string[0]= "\0";
 string[1]= "U meniju izaberite opciju pritiskom na odgovarajuci taster.\0";
 string[2]= "Za vreme odvijanja simulacije,na raspolaganju su Vam sle-\0";
 string[3]= "dece komande :\0";
 string[4]= "            BILO KOJI TASTER  pocetak eksperimenta\0";
 string[5]= "            KURSOR LEVO      usporavanje\0";
 string[6]= "            KURSOR DESNO    ubrzavanje\0";
 string[7]= "            SPACE             pauza\0";
 string[8]= "            ENTER             ponovni pocetak\0";
 string[9]= "            ESC                meni (prekid)\0";
 string[10]="Po zavrsetku, pritisak na bilo koji taster vraca Vas u meni.\0";
 string[11]="Na pocetku (i u toku pauze) eksperimenta,  mozete se in-\0";
 string[12]="formisati o objektima na ekranu  pozicioniranjem strelice\0";
 string[13]="misa i upotrebom LEVOG tastera.  Za  zavrsetak  pregleda,\0";
 string[14]="kliknite na 'KRAJ PREGLEDA'.  Opis eksperimenta je uradjen\0";
 string[15]="u hipertekstu cija je upotreba opisana na sledecoj strani.\0";

 rectangle(1,1,638,478);
 settextstyle(TRIPLEX_FONT,HORIZ_DIR,3);
 outtextxy(120,30,"UPUTSTVO ZA KORISCENJE PROGRAMA");
 rectangle(89,28,570,58);

 settextstyle(TRIPLEX_FONT,HORIZ_DIR,2);

 for(y=1;y<=15;y++)
  {
   outtextxy(10,50+y*24,string[y]);
  }

 settextstyle(TRIPLEX_FONT,HORIZ_DIR,3);
 outtextxy(160,440,"bilo koji taster za nastavak...");
 setlinestyle(DOTTED_LINE,0,NORM_WIDTH);
 rectangle(140,442,500,468);
 setlinestyle(SOLID_LINE,0,NORM_WIDTH);

 getch();

 cleardevice();
 setfillstyle(1,WHITE);
 bar(0,0,getmaxx(),getmaxy());
 rectangle(1,1,638,478);
 settextstyle(TRIPLEX_FONT,HORIZ_DIR,2);
 string[ 1]=" Hipertekst omogucava inteligentije pregledanje teksta.\0";
 string[ 2]=" Istaknute reci uvek oznacavaju slozeniji pojam.\0";
 string[ 3]=" Na raspolaganju su Vam sledece komande :\0";
 string[ 4]="\0";
 string[ 5]="   KURSORSKI TASTERI  pomeranje po tekstu\0";
 string[ 6]="   TAB                  pomera kursor za 8 mesta udesno\0";
 string[ 7]="   HOME                pomera kursor na pocetak reda\0";
 string[ 8]="   END                  pomera kursor na kraj reda\0";
 string[ 9]="   PgUp i PgDn         stranica gore/dole\0";
 string[10]="   ENTER               objasnjenje oznacenog pojma\0";
 string[11]="   DEL                  prethodni 'nivo' teksta\0";
 string[12]="   ESC                  povratak u meni\0";

 for(y=1;y<=12;y++)
 {
  outtextxy(10,40+y*24,string[y]);
 }

 settextstyle(TRIPLEX_FONT,HORIZ_DIR,3);
 outtextxy(160,440," bilo koji taster za meni...");
 setlinestyle(DOTTED_LINE,0,NORM_WIDTH);
 rectangle(140,442,500,468);
 setlinestyle(SOLID_LINE,0,NORM_WIDTH);

 getch();
}

void experiment(void)
{
 int timer;
labexp:
 do
  {
   timer=1;
   kasnjenje=1000;
   setlinestyle(SOLID_LINE,0,NORM_WIDTH);
   nacrtaj();
   sop(timer);
   pritisak(0);
   protok(0);
   mis();

   if(getch()==27) return;

   while(timer<=300)
    {
     switch(uradi(timer++))
      {
       case 0: return;
       case 1: goto labexp;
      }
     delay(kasnjenje);
    }
  }
 while(getch()==13);
}

int getkey(void)
{
 int c=0;

 if (kbhit())
  {
   c=getch();
   if (!c) c=1000+getch();
  }
 return c;
}

int uradi(int timer)
{
 int c,ch;

 rewind(stdin);

 if(kbhit())
 {
   c=getkey();
   rewind(stdin);
   switch(c)
   {
    case 32  : {
		do
		 {
		  mis();
		  rewind(stdin);
		  ch=getch();
		  if(ch==27) return(0);
		   else if(ch==32) break;
		  }
		 while(1);
		 break;
	       }
    case 1077: {
		rewind(stdin);
		if(kasnjenje>150) kasnjenje-=150;
		break;
	       }
    case 1075: {
		rewind(stdin);
		kasnjenje+=150;
		break;
	       }
    case 13  : {
		rewind(stdin);
		return(1);
	       }
    case 27  : {
		return(0);
	       }
   }
 }

 if(timer==1)
 {
  int c,i;

  c=getcolor();
  settextstyle(DEFAULT_FONT,HORIZ_DIR,1);
  for(i=0;i<=4;i++)
  {
   setcolor(WHITE);
   outtextxy(396,133,"STOP");
   delay(200);
   setcolor(RED);
   outtextxy(396,133,"STOP");
   delay(200);
   setcolor(BLACK);
   settextstyle(DEFAULT_FONT,HORIZ_DIR,1);
   outtextxy(390,63,"Pumpa prestaje sa radom");
   outtextxy(390,73,"i eksperiment pocinje...");
  }
  setcolor(c);
 }

 if(timer==6) brisi();

 if(timer==16)
 {
  setcolor(BLACK);
  settextstyle(DEFAULT_FONT,HORIZ_DIR,1);
  outtextxy(390,63,"Povecava se temperatura vode");
  outtextxy(390,73,"u primarnom cirkulacionom");
  outtextxy(390,83,"krugu,raste pritisak u SOP-u.");
 }

 if(timer==22) brisi();

 if(timer==31)
 {
  setcolor(BLACK);
  settextstyle(DEFAULT_FONT,HORIZ_DIR,1);
  outtextxy(390,63,"Aktivira se sistem");
  outtextxy(390,73,"rashladnih tuseva.");
  setlinestyle(SOLID_LINE,0,NORM_WIDTH);
 }

 if(timer>31) protok2(timer);
 if(timer>31) tusiraj(timer);

 if(timer==36) brisi();

 if(timer==61)
 {
  setcolor(BLACK);
  settextstyle(DEFAULT_FONT,HORIZ_DIR,1);
  outtextxy(390,63,"Reaktor polako gubi toplotni");
  outtextxy(390,73,"ponor i snaga mu rapidno");
  outtextxy(390,83,"opada (INHERENTNA SIGURNOST).");
 }

 if(timer==66) brisi();

 if(timer==79)
 {
  int i;

  setcolor(BLACK);
  settextstyle(DEFAULT_FONT,HORIZ_DIR,1);
  outtextxy(390,63,"Otvaraju se otpusni");
  outtextxy(390,73,"rasteretni ventili.");
  for(i=0;i<=4;i++)
  {
   setcolor(WHITE);
   outtextxy(159,94,"START");
   delay(200);
   setcolor(RED);
   outtextxy(159,94,"START");
   delay(200);
  }
 }

 if(timer==84) brisi();

 if(timer==97)
 {
  int i;

  setcolor(BLACK);
  settextstyle(DEFAULT_FONT,HORIZ_DIR,1);
  outtextxy(390,63,"Otvaraju se sigurnosni");
  outtextxy(390,73,"rasteretni ventili.");
  for(i=0;i<=4;i++)
  {
   setcolor(WHITE);
   outtextxy(152,44,"START");
   delay(200);
   setcolor(RED);
   outtextxy(152,44,"START");
   delay(200);
  }
 }

 if(timer==102) brisi();

 if(timer==108)
 {
  int i;

  setcolor(BLACK);
  settextstyle(DEFAULT_FONT,HORIZ_DIR,1);
  outtextxy(390,63,"Zatvaraju se sigurnosni");
  outtextxy(390,73,"rasteretni ventili.");
  setcolor(WHITE);
  outtextxy(152,44,"START");
  for(i=0;i<=4;i++)
  {
   setcolor(BLACK);
   outtextxy(152,44,"STOP");
   delay(200);
   setcolor(WHITE);
   outtextxy(152,44,"STOP");
   delay(200);
  }
 }

 if(timer==113) brisi();

 if(timer==121)
 {
  int i;

  setcolor(BLACK);
  settextstyle(DEFAULT_FONT,HORIZ_DIR,1);
  outtextxy(390,63,"Otpusni rasteretni ventili");
  outtextxy(390,73,"svojim ciklicnim radom obe-");
  outtextxy(390,83,"zbedjuju siguran oporavak...");
  for(i=0;i<=4;i++)
  {
   setcolor(WHITE);
   outtextxy(202,94,"CIKLICNO");
   delay(200);
   setcolor(GREEN);
   outtextxy(202,94,"CIKLICNO");
   delay(200);
  }
 }

 if(timer==126) brisi();

 sop(timer);
 pritisak(timer);
 protok(timer);
 funkcije(timer);
 odbroj(timer);

 return(2);
}

void brisi(void)
{
 int i;

 setcolor(YELLOW);
 setlinestyle(SOLID_LINE,0,NORM_WIDTH);
 for(i=63;i<=94;i++)
 {
  line(390,i,629,i);
 }
}

void tusiraj(int timer)
{
 if(timer % 2) setcolor(BLUE);
  else setcolor(WHITE);
 setlinestyle(SOLID_LINE,0,NORM_WIDTH);

 tus();
}


void tus(void)
{
  line(125,65,125,70);
  line(126,65,126,70);
  line(123,65,121,70);
  line(122,65,120,70);
  line(128,65,130,70);
  line(129,65,131,70);
}


void nacrtaj(void)
{
 cleardevice();
 setcolor(BLACK);
 setfillstyle(1,WHITE);
 bar(0,0,getmaxx(),getmaxy());

 settextstyle(DEFAULT_FONT,HORIZ_DIR,5);
 outtextxy(440,4,"00:00");

 rectangle(20,340,320,460);
 line(18,420,20,420);
 line(18,380,20,380);
 line(120,460,120,462);
 line(220,460,220,462);
 settextstyle(DEFAULT_FONT,HORIZ_DIR,1);
 outtextxy(20,330,"SNAGA REAKTORA (MW)");
 settextstyle(DEFAULT_FONT,HORIZ_DIR,1);
 outtextxy(10,452,"0");
 outtextxy( 1,417,"20");
 outtextxy( 1,377,"40");
 outtextxy( 1,341,"60");
 outtextxy(103,467,"100s");
 outtextxy(203,467,"200s");
 outtextxy(290,467,"300s");

 rectangle(400,210,630,286);   /* goriva          */
 rectangle(400,300,630,376);   /* kosuljice       */
 rectangle(400,390,630,466);   /* nosioca toplote */

 line(398,229,400,229);
 line(398,248,400,248);
 line(398,267,400,267);

 line(398,319,400,319);
 line(398,338,400,338);
 line(398,357,400,357);

 line(398,409,400,409);
 line(398,428,400,428);
 line(398,447,400,447);

 line(477,466,477,468);
 line(553,466,553,468);

 line(477,376,477,378);
 line(553,376,553,378);

 line(477,286,477,288);
 line(553,286,553,288);

 outtextxy(364,210,"1100");
 outtextxy(364,226," 900");
 outtextxy(364,245," 700");
 outtextxy(364,264," 500");
 outtextxy(372,279,"300");

 outtextxy(372,300,"341");
 outtextxy(372,316,"333");
 outtextxy(372,335,"325");
 outtextxy(372,354,"317");
 outtextxy(372,369,"309");

 outtextxy(372,390,"320");
 outtextxy(372,406,"313");
 outtextxy(372,425,"305");
 outtextxy(372,444,"297");
 outtextxy(372,459,"290");

 outtextxy(400,201,"Temperatura goriva(K)");
 outtextxy(400,291,"Temperatura kosuljice(K)");
 outtextxy(400,381,"Temperatura nosioca toplote(K)");

 outtextxy(463,470,"100s");
 outtextxy(539,470,"200s");
 outtextxy(600,470,"300s");

 rectangle(380,50,630,95);
 setfillstyle(SOLID_FILL,YELLOW);
 floodfill(382,52,BLACK);
 outtextxy(382,52,"DOGADJAJ:");

 line(100,75,100,125);
 line(150,75,150,125);      /* SOP */
 arc(125,75,0,180,25);
 arc(125,125,180,360,25);

 setcolor(BLACK);
 circle(125,286,13);

 rectangle(300,140,360,190);
 setfillstyle(SOLID_FILL,YELLOW);
 floodfill(305,142,BLACK);
 line(300,140,360,190);
 outtextxy(310,175,"GP");

 setcolor(LIGHTGRAY);
 rectangle(327,90,332,139);
 setfillstyle(SOLID_FILL,LIGHTGRAY);
 floodfill(330,100,LIGHTGRAY);
 setcolor(BLACK);
 line(329,88,329,70);
 line(330,88,330,70);
 line(326,74,329,70);
 line(330,70,333,74);
 outtextxy(290,60,"ka turbini");

 setcolor(LIGHTBLUE);
 setfillstyle(1,LIGHTBLUE);
 bar(360,163,400,168);

 setcolor(BLACK);
 circle(413,165,13);

 setcolor(LIGHTBLUE);
 setfillstyle(1,LIGHTBLUE);
 bar(427,163,454,168);

 setcolor(BLACK);
 line(456,165,474,165);
 line(456,166,474,166);
 line(456,165,460,162);
 line(456,166,460,169);
 outtextxy(476,162," od kondenzatora");

 line(420,164,405,164);  line(132,285,117,285);
 line(420,165,404,165);  line(132,286,116,286);
 line(420,166,405,166);  line(132,287,117,287);
 line(406,167,406,163);  line(118,288,118,284);
 line(407,168,407,162);  line(119,289,119,283);

 outtextxy(393,142,"pumpa");
 outtextxy(105,262,"pumpa");

 setcolor(RED);
 setfillstyle(1,RED);
 bar(20,195,60,235);
 setcolor(WHITE);
 settextstyle(DEFAULT_FONT,HORIZ_DIR,2);
 outtextxy(34,208,"R");

 setcolor(BLUE);
 setfillstyle(1,BLUE);
 bar(123,150,128,163);

 setcolor(LIGHTBLUE);
 setfillstyle(SOLID_FILL,LIGHTBLUE);
 line(123,50,123,37);
 line(128,50,128,32);
 line(128,32,82,32);
 line(123,37,87,37);
 line(82,32,82,158);
 line(87,37,87,158);
 line(87,158,82,158);
 line(123,50,128,50);
 floodfill(124,49,LIGHTBLUE);
 rectangle(123,50,128,58);
 floodfill(124,51,LIGHTBLUE);

 rectangle(87,173,82,283);
 floodfill(86,175,LIGHTBLUE);

 settextstyle(DEFAULT_FONT,HORIZ_DIR,1);
 setcolor(BLACK);
 outtextxy(155,120,"SOP");

 setcolor(BLACK);

 rectangle(150,75,163,78);
 setfillstyle(SOLID_FILL,BLACK);
 floodfill(151,76,BLACK);

 line(163,73,163,80);
 line(163,80,170,73);
 line(163,73,170,80);
 line(170,80,170,73);
 rectangle(170,75,180,78);
 floodfill(171,76,BLACK);
 outtextxy(159,84,"RV");

 line(122,59,116,65);
 line(129,59,135,65);

 line(145,60,145,40);
 line(142,57,142,40);
 line(145,40,142,40);
 floodfill(144,41,BLACK);
 line(140,40,147,40);
 line(140,40,143,37);
 line(144,37,147,40);
 line(145,35,148,38);
 line(145,34,148,31);
 line(148,31,148,38);
 putpixel(144,34,BLACK);
 putpixel(145,33,BLACK);
 putpixel(144,32,BLACK);
 putpixel(144,31,BLACK);
 putpixel(145,30,BLACK);
 putpixel(146,29,BLACK);
 putpixel(145,28,BLACK);
 putpixel(144,27,BLACK);
 putpixel(143,26,BLACK);
 putpixel(144,25,BLACK);
 putpixel(145,24,BLACK);
 putpixel(146,23,BLACK);
 putpixel(147,22,BLACK);
 outtextxy(152,34,"SV");
}

void protok2(int timer)
{
 setcolor(WHITE);
 teci2(timer-1,0);
 setcolor(LIGHTBLUE);
 teci2(timer,1);
}

void teci2(int timer,int sta)
{
 int i,j;
 unsigned int p;

 j=3-(timer % 4);

 p=patterns[j];

 for(i=0;i<6;i++)
 {
  setlinestyle(USERBIT_LINE,p,NORM_WIDTH);
  if(sta) setcolor(LIGHTBLUE);
  line(82+i,173,82+i,283);
  line(82+i,37,82+i,158);
  p=patterns[timer % 4];
  setlinestyle(USERBIT_LINE,p,NORM_WIDTH);
  line(82,32+i,128,32+i);
  line(123+i,32,123+i,58);
  p=patterns[j];
  setlinestyle(USERBIT_LINE,p,NORM_WIDTH);
 }
}

void protok(int timer)
{
 setcolor(WHITE);
 teci(timer-1,0);
 setcolor(BLUE);
 teci(timer,1);
}

void teci(int timer,int sta)
{
 int i,j;
 unsigned int p0,p1;

 j=timer % 4;

 switch (j)
  {
   case 0:
          {
           p0=patterns[0];
           p1=patterns[3];
           break;
          }
   case 1:
          {
           p0=patterns[1];
           p1=patterns[2];
           break;
          }
   case 2:
          {
           p0=patterns[2];
	   p1=patterns[1];
           break;
          }
   case 3:
          {
           p0=patterns[3];
	   p1=patterns[0];
           break;
          }
   }


 for(i=0;i<6;i++)
  {
   if(sta) setcolor(BLUE);
   setlinestyle(USERBIT_LINE,p0,NORM_WIDTH);
   line(40,163+i,299,163+i);

   setlinestyle(USERBIT_LINE,p1,NORM_WIDTH);
   line(40+i,169,40+i,194);

   if(sta) setcolor(LIGHTBLUE);
   line(40+i,236,40+i,283);

   setlinestyle(USERBIT_LINE,p1,NORM_WIDTH);
   line(40,284+i,111,284+i);

   line(139,284+i,332,284+i);

   setlinestyle(USERBIT_LINE,p0,NORM_WIDTH);
   line(327+i,283,327+i,191);
  }
}

void odbroj(int timer)
{
 int minuta,desekundi,sekundi;
 int sminuta,sdesekundi,ssekundi;
 char cminuta[1],cdesekundi[1],csekundi[1];
 char csminuta[1],csdesekundi[1],cssekundi[1];

 rewind(stdin);
 settextstyle(DEFAULT_FONT,HORIZ_DIR,5);

 minuta=timer/60;
 sekundi=timer-(timer/60)*60;
 desekundi=sekundi/10;
 sekundi=sekundi-desekundi*10;

 sminuta=(timer-1)/60;
 ssekundi=(timer-1)-((timer-1)/60)*60;
 sdesekundi=ssekundi/10;
 ssekundi=ssekundi-sdesekundi*10;

 cminuta[0]=minuta+'0';
 cdesekundi[0]=desekundi+'0';
 csekundi[0]=sekundi+'0';

 csminuta[0]=sminuta+'0';
 csdesekundi[0]=sdesekundi+'0';
 cssekundi[0]=ssekundi+'0';

 csekundi[1]='\0';
 cminuta[1]='\0';
 cdesekundi[1]='\0';
 cssekundi[1]='\0';
 csdesekundi[1]='\0';
 csminuta[1]='\0';

 if(minuta != sminuta)
  {
   setcolor(WHITE);
   outtextxy(480,4,csminuta);
   setcolor(BLACK);
   outtextxy(480,4,cminuta);
  }

 if(desekundi != sdesekundi)
  {
   setcolor(WHITE);
   outtextxy(560,4,csdesekundi);
   setcolor(BLACK);
   outtextxy(560,4,cdesekundi);
  }

 setcolor(WHITE);
 outtextxy(600,4,cssekundi);
 setcolor(BLACK);
 outtextxy(600,4,csekundi);
}

void funkcije(int timer)
{
 int x,y;

 x=timer+20;
 y=snaga[timer]*2+21;
 putpixel(x,480-y,RED);

 x=timer*0.76+400;
 y=480-(gorivo[timer]*0.095+165);
 putpixel(x,y,BLACK);

 x=timer*0.76+400;
 y=480-((kosuljica[timer]-309)*2.375+104);
 putpixel(x,y,BLACK);

 x=timer*0.76+400;
 y=480-((nosioc[timer]-290)*2.53+14);
 putpixel(x,y,BLACK);
}

void opis(void)
{
 int driver,mode;

 restorecrtmode();
 closegraph();
 hypertext2("loft.hyp");

 driver=DETECT;
 initgraph(&driver,&mode,"");
 setgraphmode(VGAHI);
}

void mouse_reset(int *status,int *n_buttons)
{
 union REGS r;
 r.x.ax=0x00;
 int86(0x33,&r,&r);
 *status=r.x.ax;
 *n_buttons=r.x.bx;
}

void cursor_on(void)
{
 union REGS r;
 r.x.ax=0x01;
 int86(0x33,&r,&r);
}

void cursor_off(void)
{
 union REGS r;
 r.x.ax=0x02;
 int86(0x33,&r,&r);
}

void get_status(int *x,int *y,int *leftb)
{
 union REGS r;
 delay(200);
 r.x.ax=0x03;
 int86(0x33,&r,&r);
 *x=r.x.cx;
 *y=r.x.dx;
 *leftb=r.x.bx & 1;
}

void set_range(int x1,int y1,int x2,int y2)
{
 union REGS r;
 r.x.ax=0x07;
 r.x.cx=x1;
 r.x.dx=x2;
 int86(0x33,&r,&r);
 r.x.ax=0x08;
 r.x.cx=y1;
 r.x.dx=y2;
 int86(0x33,&r,&r);
}

void prozor(int x1,int y1,int x2,int y2)
{
 if((buffer=calloc(1,(size_t)imagesize(x1,y1,x2,y2)+1))==NULL) kraj();
 getimage(x1,y1,x2,y2,buffer);
 setfillstyle(SOLID_FILL,WHITE);
 bar(x1,y1,x2,y2);
 settextstyle(DEFAULT_FONT,HORIZ_DIR,1);
 setcolor(BLACK);
 rectangle(x1,y1,x2,y2);
 rectangle(x1+1,y1+1,x2-1,y2-1);
}

void mis(void)
{
 int i;
 int status,buttons;
 int x,y,lb;

 mouse_reset(&status,&buttons);
 cursor_on();
 setlinestyle(SOLID_LINE,0,NORM_WIDTH);
 setcolor(BLACK);
 rectangle(3,3,120,23);
 settextstyle(DEFAULT_FONT,HORIZ_DIR,1);
 for(i=0;i<=2;i++)
  {
   setcolor(WHITE);
   outtextxy(10,10,"KRAJ PREGLEDA");
   delay(200);
   setcolor(BLACK);
   outtextxy(10,10,"KRAJ PREGLEDA");
   delay(200);
  }

 do
  {
   get_status(&x,&y,&lb);
   if(lb)
   {
    if((x>440) && (y<32))
     {
      set_range(x,y,x,y);
      prozor(105,105,428,210);
      setcolor(RED);
      outtextxy(111,117,"           VREMENSKI BROJAC");
      outtextxy(111,125,"           ----------------");
      setcolor(BLUE);
      outtextxy(111,141,"Vremenski  brojac je na pocetku setovan");
      outtextxy(111,149,"na referentno  nula  vreme. Eksperiment");
      outtextxy(111,157,"se zavrsava na 05:00 (300 s). On ujedno");
      outtextxy(111,165,"i prati  brzinu  odvijanja. Na pocetku,");
      outtextxy(111,173,"ta brzina je realna tj. brojac se pove-");
      outtextxy(111,181,"cava  svake  sekunde.  Brzinu odvijanja");
      outtextxy(111,189,"mozete  menjati sa kursorskim tasterima");
      outtextxy(111,197,"LEVO (sporije) i DESNO (brze).");
      while(lb) get_status(&x,&y,&lb);
      while(!lb) get_status(&x,&y,&lb);
      putimage(105,105,buffer,COPY_PUT);
      free(buffer);
     }

    if((x>380) && (x<630) && (y>50) && (y<95))
     {
      set_range(x,y,x,y);
      prozor(150,200,478,270);
      setcolor(RED);
      outtextxy(156,208,"            PROZOR DOGADJANJA");
      outtextxy(156,216,"            -----------------");
      setcolor(BLUE);
      outtextxy(156,232,"On  Vam omogucava  tekstualno  pracenje");
      outtextxy(156,240,"najznacajnijih promena u toku simulaci-");
      outtextxy(156,248,"je.  Propratni  tekst  svakog dogadjaja");
      outtextxy(156,256,"traje 5 vremenskih jedinica.");
      while(lb) get_status(&x,&y,&lb);
      while(!lb) get_status(&x,&y,&lb);
      putimage(150,200,buffer,COPY_PUT);
      free(buffer);
     }

    if((x>20) && (x<60) && (y>195) && (y<235))
     {
      set_range(x,y,x,y);
      prozor(50,50,378,120);
      setcolor(RED);
      outtextxy(56,58,  "                REAKTOR");
      outtextxy(56,66,  "                -------");
      setcolor(BLUE);
      outtextxy(56,82,  "Ovaj reaktor ima  snagu  od 50MW  (ter-");
      outtextxy(56,90,  "malna snaga) i predstavlja uvecan model");
      outtextxy(56,98,  "komercijalnog  PWR-a  ( Pressure  Water");
      outtextxy(56,106, "Reactor).");
      while(lb) get_status(&x,&y,&lb);
      while(!lb) get_status(&x,&y,&lb);
      putimage(50,50,buffer,COPY_PUT);
      free(buffer);
     }

    if((x>20) && (x<320) && (y>340) && (y<460))
     {
      set_range(x,y,x,y);
      prozor(90,220,418,306);
      setcolor(RED);
      outtextxy(96,228,  "          GRAFIK SNAGE REAKTORA");
      outtextxy(96,236,  "          ---------------------");
      setcolor(BLUE);
      outtextxy(96,252,  "Ovaj  grafik  ce reprezentovati promenu");
      outtextxy(96,260,  "snage reaktora u toku vremena.  Matema-");
      outtextxy(96,268,  "ticki model ove  funkcije su 3 linearne");
      outtextxy(96,276,  "jednacine, dobijene linearnom  aproksi-");
      outtextxy(96,284,  "macijom eksperimentalnih rezultata. Ove");
      outtextxy(96,292,  "jednacine mozete pogledati u opisu.");
      while(lb) get_status(&x,&y,&lb);
      while(!lb) get_status(&x,&y,&lb);
      putimage(90,220,buffer,COPY_PUT);
      free(buffer);
     }

    if((x>400) && (x<630) && (y>210) && (y<286))
     {
      set_range(x,y,x,y);
      prozor(30,200,358,294);
      setcolor(RED);
      outtextxy(36,208,  "       GRAFIK TEMPERATURE GORIVA");
      outtextxy(36,216,  "       -------------------------");
      setcolor(BLUE);
      outtextxy(36,232,  "Ovaj grafik  predstavlja promenu tempe-");
      outtextxy(36,240,  "rature goriva.  Ta funkcija je izrazena");
      outtextxy(36,248,	 "diferencijalnim jednacinama koje mozete");
      outtextxy(36,256,  "pogledati u opisu.  Pocetna temperatura");
      outtextxy(36,264,  "goriva je : Tg = 1001 K (to je ujedno i");
      outtextxy(36,272,  "temperatura goriva kada reaktor  radi u");
      outtextxy(36,280,  "nominalnim uslovima ( Q = 50 MW )).");
      while(lb) get_status(&x,&y,&lb);
      while(!lb) get_status(&x,&y,&lb);
      putimage(30,200,buffer,COPY_PUT);
      free(buffer);
     }

     if((x>400) && (x<630) && (y>300) && (y<376))
      {
       set_range(x,y,x,y);
       prozor(30,250,358,352);
       setcolor(RED);
       outtextxy(36,258, "      GRAFIK TEMPERATURE KOSULJICE");
       outtextxy(36,266, "      ----------------------------");
       setcolor(BLUE);
       outtextxy(36,282, "Ovaj grafik  predstavlja promenu tempe-");
       outtextxy(36,290, "rature kosuljice.  Ta funkcija je izra-");
       outtextxy(36,298, "zena  diferencijalnim  jednacinama koje");
       outtextxy(36,306, "mozete pogledati u opisu.Pocetna tempe-");
       outtextxy(36,314, "ratura kosuljice je :  Tk = 592.3 K (to");
       outtextxy(36,322, "je ujedno i temperatura  kosuljice kada");
       outtextxy(36,330, "reaktor  radi  u  nominalnim   uslovima");
       outtextxy(36,338, "( Q = 50 MW )).");
       while(lb) get_status(&x,&y,&lb);
       while(!lb) get_status(&x,&y,&lb);
       putimage(30,250,buffer,COPY_PUT);
       free(buffer);
      }

     if((x>400) && (x<630) && (y>390) && (y<466))
      {
       set_range(x,y,x,y);
       prozor(30,300,358,418);
       setcolor(RED);
       outtextxy(36,308, "             GRAFIK SREDNJE ");
       outtextxy(36,316, "      TEMPERATURE NOSIOCA TOPLOTE");
       outtextxy(36,324, "      ---------------------------");
       setcolor(BLUE);
       outtextxy(36,340, "Ovaj grafik  predstavlja promenu  sred-");
       outtextxy(36,348, "nje (aritmeticka  sredina  ulazne i iz-");
       outtextxy(36,356, "lazne)  temperature.   Ta  funkcija  je");
       outtextxy(36,364, "izrazena  diferencijalnim   jednacinama");
       outtextxy(36,372, "koje mozete pogledati u opisu.  Pocetna");
       outtextxy(36,380, "srednja temperatura nosioca toplote je:");
       outtextxy(36,388, "Tnt = 566.07  (to je  ujedno  i srednja");
       outtextxy(36,396, "temperatura  kada  reaktor radi u nomi-");
       outtextxy(36,404, "nalnim uslovima ( Q = 50 MW )).");
       while(lb) get_status(&x,&y,&lb);
       while(!lb) get_status(&x,&y,&lb);
       putimage(30,300,buffer,COPY_PUT);
       free(buffer);
      }

     if((x>300) && (x<360) && (y>140) && (y<190))
      {
       set_range(x,y,x,y);
       prozor(20,210,348,304);
       setcolor(RED);
       outtextxy(26,218, "             GENERATOR PARE");
       outtextxy(26,226, "             --------------");
       setcolor(BLUE);
       outtextxy(26,242, "Ovo je u stvari razmenjivac toplote ko-");
       outtextxy(26,250, "ji omogucava  razmenu  toplote  izmedju");
       outtextxy(26,258, "primarnog i sekundarnog  kruga. Na nje-");
       outtextxy(26,266, "govoj  sekundarnoj  strani imamo  dovod");
       outtextxy(26,274, "napojne vode iz kondenzatora (u simula-");
       outtextxy(26,282, "ciji plava cev) i odvod  pare u turbinu");
       outtextxy(26,290, "(siva cev).");
       while(lb) get_status(&x,&y,&lb);
       while(!lb) get_status(&x,&y,&lb);
       putimage(20,210,buffer,COPY_PUT);
       free(buffer);
      }

     if((x>100) && (x<150) && (y>50) && (y<150))
      {
       set_range(x,y,x,y);
       prozor(60,170,388,248);
       setcolor(RED);
       outtextxy(66,178, "  SISTEM ZA ODRZAVANJE PRITISKA (SOP)");
       outtextxy(66,186, "  -----------------------------------");
       setcolor(BLUE);
       outtextxy(66,202, "SOP predstavlja sud sa faznim  prelazom");
       outtextxy(66,210, "koji zahvaljujuci funkcionalnom dejstvu");
       outtextxy(66,218, "svojih  komponenata regulise odrzavanje");
       outtextxy(66,226, "pritiska u primarnom cirkulacionom kru-");
       outtextxy(66,234, "gu.");
       while(lb) get_status(&x,&y,&lb);
       while(!lb) get_status(&x,&y,&lb);
       putimage(60,170,buffer,COPY_PUT);
       free(buffer);
      }

     if((x>400) && (x<426) && (y>152) && (y<178))
      {
       set_range(x,y,x,y);
       prozor(240,200,568,270);
       setcolor(RED);
       outtextxy(246,208,"           PUMPA NAPOJNE VODE");
       outtextxy(246,216,"           ------------------");
       setcolor(BLUE);
       outtextxy(246,232,"Na  pocetku  eksperimenta ova  pumpa je");
       outtextxy(246,240,"ispala iz pogona cime je simuliran pre-");
       outtextxy(246,248,"kid  dotoka  napojne vode  u  generator");
       outtextxy(246,256,"pare.");
       while(lb) get_status(&x,&y,&lb);
       while(lb) get_status(&x,&y,&lb);
       while(!lb) get_status(&x,&y,&lb);
       putimage(240,200,buffer,COPY_PUT);
       free(buffer);
      }

     if((x>112) && (x<138) && (y>273) && (y<299))
      {
       set_range(x,y,x,y);
       prozor(40,220,368,242);
       setcolor(RED);
       outtextxy(46,228, "           CIRKULACIONA PUMPA");
       while(lb) get_status(&x,&y,&lb);
       while(!lb) get_status(&x,&y,&lb);
       putimage(40,220,buffer,COPY_PUT);
       free(buffer);
      }

     if( ( (x>40) && (x<45) && (y>169) && (y<194) ) ||
	 ( (x>49) && (x<299)&& (y>163) && (y<168) ) )
      {
       set_range(x,y,x,y);
       prozor(60,210,388,240);
       setcolor(RED);
       outtextxy(66,218, "              TOPLA GRANA");
       outtextxy(66,226, "     PRIMARNOG CIRKULACIONOG KRUGA");
       while(lb) get_status(&x,&y,&lb);
       while(!lb) get_status(&x,&y,&lb);
       putimage(60,210,buffer,COPY_PUT);
       free(buffer);
      }

     if( ( (x>40) && (x<45) && (y>236) && (y<283) ) ||
	 ( (x>40) && (x<111)&& (y>284) && (y<289) ) ||
	 ( (x>139)&& (x<332)&& (y>284) && (y<289) ) ||
	 ( (x>327)&& (x<332)&& (y>191) && (y<283) ) )
      {
       set_range(x,y,x,y);
       prozor(20,310,348,340);
       setcolor(RED);
       outtextxy(26,318, "              HLADNA GRANA");
       outtextxy(26,326, "     PRIMARNOG CIRKULACIONOG KRUGA");
       while(lb) get_status(&x,&y,&lb);
       while(!lb) get_status(&x,&y,&lb);
       putimage(20,310,buffer,COPY_PUT);
       free(buffer);
      }

     if( ( (x>82) && (x<87) && (y>173)&& (y<283) ) ||
	 ( (x>82) && (x<87) && (y>32) && (y<158) ) ||
	 ( (x>87) && (x<128)&& (y>32) && (y<37)  ) ||
	 ( (x>123)&& (x<128)&& (y>37) && (y<58)  ) )
      {
       set_range(x,y,x,y);
       prozor(120,150,448,220);
       setcolor(RED);
       outtextxy(126,158, "        SISTEM RASHLADNIH TUSEVA");
       outtextxy(126,166, "        ------------------------");
       setcolor(BLUE);
       outtextxy(126,182, "Kroz ovu cev fluid iz hladne grane pri-");
       outtextxy(126,190, "marnog  cirkulacionog  kruga dospeva do");
       outtextxy(126,198, "sistema rashladnih tuseva koji je loci-");
       outtextxy(126,206, "ran u gornjem delu SOP-a.");
       while(lb) get_status(&x,&y,&lb);
       while(!lb) get_status(&x,&y,&lb);
       putimage(120,150,buffer,COPY_PUT);
       free(buffer);
      }

     if( (x>157) && (x<177) && (y>66) && (y<94) )
      {
       set_range(x,y,x,y);
       prozor(50,120,378,190);
       setcolor(RED);
       outtextxy(56,128, "       SISTEM RASTERETNIH VENTILA");
       outtextxy(56,136, "       --------------------------");
       setcolor(BLUE);
       outtextxy(56,152, "Pomocu njega  se ispusta  para iz SOP-a");
       outtextxy(56,160, "u  cilju  smanjivanja  pritiska.  On se");
       outtextxy(56,168, "aktivira kada pritisak u SOP-u dostigne");
       outtextxy(56,176, "vrednost od 16.2 MPa.");
       while(lb) get_status(&x,&y,&lb);
       while(!lb) get_status(&x,&y,&lb);
       putimage(50,120,buffer,COPY_PUT);
       free(buffer);
      }

     if( (x>135) && (x<168) && (y>32) && (y<44) )
      {
       set_range(x,y,x,y);
       prozor(200,50,528,136);
       setcolor(RED);
       outtextxy(206,58, "        SISTEM SIGURNOSNIH VENTILA");
       outtextxy(206,66, "        --------------------------");
       setcolor(BLUE);
       outtextxy(206,82, "Kako sistem rasteretnih ventila ne obe-");
       outtextxy(206,90, "zbedjuje  zeljeno  smanjenje  pritiska,");
       outtextxy(206,98, "dolazi do otvaranja ovih  ventila  kroz");
       outtextxy(206,106,"koje u ovom  slucaju  isticu  zajedno i");
       outtextxy(206,114,"voda i para. Aktivira se kada  pritisak");
       outtextxy(206,122,"u SOP-u dostigne vrednost od 17.3 MPa.");
       while(lb) get_status(&x,&y,&lb);
       while(!lb) get_status(&x,&y,&lb);
       putimage(200,50,buffer,COPY_PUT);
       free(buffer);
      }
    set_range(0,0,getmaxx(),getmaxy());
   }
 }
 while((x<3)||(x>120)||(y<3)||(y>23)||(!lb));

 cursor_off();
 setfillstyle(1,WHITE);
 bar(3,3,120,23);
 setfillstyle(1,BLUE);
}

void sop(int timer)
{
 int sy,ny;

 setlinestyle(SOLID_LINE,0,NORM_WIDTH);

 sy=s[timer-1];
 ny=s[timer];

 if(timer<=96)
 {
  setcolor(WHITE);
  line(101,sy,149,sy);
  trougao(sy-1);
  setcolor(BLACK);
  line(101,ny,149,ny);
  trougao(ny-1);
  setfillstyle(SOLID_FILL,BLUE);
  floodfill(125,ny+1,BLACK);
 }

 else
  {
   setcolor(WHITE);
   trougao(sy-1);
   trougao(ny-1);
   trougao(sy-2);
   trougao(ny-2);
   line(101,sy,149,sy);
   line(101,ny,149,ny);
   line(101,sy-1,149,sy-1);
   line(101,ny-1,149,ny-1);
   setcolor(BLACK);
   trougao(ny);
  }
}

void trougao(int y)
{
 line(112,y,116,y-4);
 line(112,y,108,y-4);
 line(108,y-4,116,y-4);
}

void pritisak(int timer)
{
 char s[10];

 settextstyle(DEFAULT_FONT,HORIZ_DIR,1);

 sprintf(s,"%f",p[timer]);
 s[5]='\0';

 setcolor(BLUE);
 bar(105,121,145,129);

 setcolor(WHITE);
 outtextxy(105,121,s);
 outtextxy(113,132,"MPa");
}
