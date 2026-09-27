#include <stdio.h>
#include <conio.h>
#include <DOS.h>
#include <mem.h>
#include <alloc.h>


#define VGA640480    0x12
#define EGAVGA640350 0x10
#define EGAVGA640200 0xE
#define EGAVGA320200 0xD


unsigned int EGA_VGA_setup(void) // detektuj trenutni mod kartice
 {
  union REGS r;

  r.h.ah=0x0F;       // pozovi funkciju 0x0F
  int86(0x10,&r,&r); // interaptom 10h

  switch(r.h.al)     // i ispitaj AL
   {
    case VGA640480    : return 38400;
    case EGAVGA640350 : return 28000; // vrati broj bajtova koji zauzima
    case EGAVGA640200 : return 16000; // jedan bit plane bas u tom modu
    case EGAVGA320200 : return 8000;

    default           : return 0;     // mod nije podrzan
   }
 } // EGA_VGA_setup

unsigned int Save_EGA_VGA(FILE *fp) // 0-los mod; -1-nema memorije
 {
  char *buffer;
  int i;
  unsigned int bit_plane_size;

  bit_plane_size=EGA_VGA_setup();
  if(bit_plane_size==0) return 0; // nesto nevalja

  if((buffer=(char*)malloc(bit_plane_size))==NULL) return -1; // nema memorije


  for(i=0;i<=3;i++)
   {
    outp(0x3CE,4);
    outp(0x3CF,i); // prosetaj se po bit plane-ovima 0,1,2,3

    movedata(0xA000,0x0000,FP_SEG(buffer),FP_OFF(buffer),bit_plane_size);
     // kopiraj bit plane u buffer

    fwrite(buffer,bit_plane_size,1,fp); // upisi ga na disk
   }

  outp(0x3CE,4); // restauriraj vrednosti koje ukazuju na bit plane
  outp(0x3CF,0);

  free(buffer);

  return bit_plane_size; // sve je proslo OK
} // Save_EGA_VGA

unsigned int Load_EGA_VGA(FILE *fp)
 {
  char *buffer;
  unsigned int bit_plane_size;

  if((bit_plane_size=EGA_VGA_setup())==0) return 0; // nije prepoznat mod

  if((buffer=(char*)malloc(bit_plane_size))==NULL) return -1; // nema memorije


  outp(0x3C4,2); // bit plane 1
  outp(0x3C5,1);
  fread(buffer,bit_plane_size,1,fp);
  movedata(FP_SEG(buffer),FP_OFF(buffer),0xA000,0x0000,bit_plane_size);

  outp(0x3C4,2); // bit plane 2
  outp(0x3C5,2);
  fread(buffer,bit_plane_size,1,fp);
  movedata(FP_SEG(buffer),FP_OFF(buffer),0xA000,0x0000,bit_plane_size);

  outp(0x3C4,2); // bit plane 3
  outp(0x3C5,4);
  fread(buffer,bit_plane_size,1,fp);
  movedata(FP_SEG(buffer),FP_OFF(buffer),0xA000,0x0000,bit_plane_size);

  outp(0x3C4,2); // bit plane 4
  outp(0x3C5,8);
  fread(buffer,bit_plane_size,1,fp);
  movedata(FP_SEG(buffer),FP_OFF(buffer),0xA000,0x0000,bit_plane_size);

  outp(0x3C4, 2); // restauriraj stare vrednosti registara
  outp(0x3C5,16);

  free(buffer);

  return bit_plane_size; // sve je proslo OK
}

void usage(void)
 {
  printf("Upotreba    : grab  -<l|s> <ime_fajla>\n");
  printf("              l - ucitaj sliku i prikazi je na ekranu\n");
  printf("              s - snimi sliku\n");
  printf("              ime_fajla - fajl u koji se snima slika\n");
  printf("Primeri     : grab -s proba (snima ekran u fajl proba)\n");
  printf("              grab -l proba (ucitava i prikazuje sliku iz fajla proba)\n");
  printf("Napomena    : Format slike je interni i nekompatibilan je sa bilo cim.\n");
  printf("Ogranicenja : Podrzani su sledeci EGA/VGA modovi:\n");
  printf("              10h(640x350x16), 12h(640x480x16), Dh(320x200x16), Eh(640x200x16).\n");
  printf("Autor       : Mihailo Despotovic (015)25-041\n");
 }

void loseime(void)
 {
  printf("Ne mogu da otvorim fajl sa tim imenom.\n");
  printf("Proverite korektnost imena i atribute fajla.\n\n");
 }


int main(int argc,char *argv[])
 {
  FILE *fp;
  unsigned int rez;

  if((argc!=3) ||
     (argv[1][0]!='-') ||
     ((argv[1][1]!='s')&&(argv[1][1]!='S')&&(argv[1][1]!='l')&&(argv[1][1]!='L')))
       { usage(); return 1; }

  if((argv[1][1]=='s') || (argv[1][1]=='S'))
   {
    fp=fopen(argv[2],"wb");
    if(fp==NULL) { loseime(); usage(); return 1; }
    rez=Save_EGA_VGA(fp);
    switch(rez)
     {
      case  0  : {
		  printf("Mod nije podrzan.\n\n");
		  remove(argv[2]);
		  usage();
		  return 1;
		 }

      case -1  : {
		  printf("Ne mogu da alociram memoriju.\n");
		  remove(argv[2]);
		  return 1;
		 }

      default  : { printf("Uradjeno.\n"); return 0; }
     }
   }

  if((argv[1][1]=='l') || (argv[1][1]=='L'))
   {
    fp=fopen(argv[2],"rb");
    if(fp==NULL) { loseime(); usage(); return 1; }
    rez=Load_EGA_VGA(fp);
    switch(rez)
     {
      case  0  : { printf("Mod nije podrzan.\n\n"); usage(); return 1;}
      case -1  : { printf("Ne mogu da alociram memoriju.\n"); return 1;}
      default  : return 0;
     }
   }

  usage();
  return 1;
 }












