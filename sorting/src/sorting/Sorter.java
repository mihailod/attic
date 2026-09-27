package sorting;

import java.awt.Canvas;

public class Sorter extends Canvas
{
 private static final int DELAY = 15;

 private static int temp = 0;
 private static Canvas c = null;
 private static boolean INNER = false;
 private static boolean OUTER = true;

 public static void setInnerDelay() { INNER = true; OUTER = false; }
 public static void setOuterDelay() { INNER = false; OUTER = true; }
 public static void setNoDelay() { INNER = false; OUTER = false; }

 public static void shuffle(int[] array, int N)
 {
   for(int i=0; i<N; i++)
   {
     int val = 0;
     while(true)
     {
       val = (int)(N * Math.random());
       if(!alreadyThere(array, val, i))
       {
         array[i] = val;
         break;
       }
     }
   }

   for(int i=0; i<array.length; i++)
   {
     if(array[i] == N-1)
     {
       array[i] = array[0];
       array[0] = N-1;
       break;
     }
   }
 }

 private static boolean alreadyThere(int[] array, int num, int bound)
 {
   for(int i=0; i<bound; i++) if(array[i] == num) return true;
   return false;
 }

 public static void dist(int[] array, int N, Canvas c) throws InterruptedException
 {
   int[] counter = new int[N];
   for(int i=0; i<N; i++) counter[N-1- array[i]] = array[i];
   for(int i=0; i<N; i++)
   {
     array[i] = counter[i];
     if(INNER || OUTER) { Thread.sleep(DELAY); c.repaint(); }
   }
   c.repaint();
 }

 public static void selection(int[] array, int N, Canvas c) throws InterruptedException
 {
   int maxElem = 0;
   for(int i=0; i<N-1; i++)
   {
     maxElem = i;
     for(int j=i+1; j<N; j++)
     {
       if(INNER) { Thread.sleep(DELAY); c.repaint(); }
       if(array[j] > array[maxElem]) maxElem = j;
     }
     temp = array[maxElem];
     array[maxElem] = array[i];
     array[i] = temp;
     if(OUTER) { Thread.sleep(DELAY); c.repaint(); }
   }
   c.repaint();
 }

 public static void bubble(int[] array, int N, Canvas c) throws InterruptedException
 {
   for(int i=0; i<N; i++)
   {
     if(OUTER) { Thread.sleep(DELAY); c.repaint(); }
     for(int j=N-1; j>i; j--)
     {
       if(array[j-1] < array[j])
       {
         temp = array[j-1];
         array[j-1] = array[j];
         array[j] = temp;
         if(INNER) { Thread.sleep(DELAY); c.repaint(); }
       }
     }
   }
   c.repaint();
 }

 public static void insertion(int[] array, int N, Canvas c) throws InterruptedException
 {
   int v, j = 0;
   for(int i=1; i<N; i++)
   {
     if(OUTER) { Thread.sleep(DELAY); c.repaint(); }
     v = array[i];
     j = i;
     while(j > 0 && array[j-1] < v)
     {
       array[j] = array[j-1];
       j--;
       if(INNER) { Thread.sleep(DELAY); c.repaint(); }
     }
     array[j] = v;
   }
   c.repaint();
 }

 /**
  * Fix the bug
  */
 public static void shell(int[] array, int N, Canvas c) throws InterruptedException
 {
   int j = 0, h = 1, v = 0;

   while(true)
   {
     h = 3*h + 1;
     if(h>N) break;
   }

   do
   {
     h = h / 3;
     for(int i=h; i<N; i++)
     {
       if(OUTER) { Thread.sleep(DELAY); c.repaint(); }
       v = array[i];
       j = i;
       while(j >= h && array[j-h] < v)
       {
         array[j] = array[j-h];
         j = j - h;
         if(j <= h) break;
         if(INNER) { Thread.sleep(DELAY); c.repaint(); }
       }
       array[j] = v;
     }
   }
   while(h != 0);
   c.repaint();
 }

 public static void quick(int[] array, int N, Canvas c) throws InterruptedException
 {
   Sorter.c = c;
   quicksort(array, 0, N-1);
   c.repaint();
 }

 private static void quicksort(int[] array, int left, int right) throws InterruptedException
 {
   if(right > left)
   {
     int p = partition(array, left, right);
     quicksort(array, left, p-1);
     quicksort(array, p+1, right);
   }
 }

 private static int partition(int[] array, int start, int end) throws InterruptedException
 {
   int left = start - 1;
   int right = end;
   int p = array[end];
   while(true)
   {
     while(p < array[++left]) { if(left == end) break; }
     while(p > array[--right]) { if(right == start) break; }

     if(left >= right) break;
     temp = array[left];
     array[left] = array[right];
     array[right] = temp;

     if(INNER || OUTER) { Thread.sleep(DELAY); c.repaint(); }
   }
   temp = array[left];
   array[left] = array[end];
   array[end] = temp;

   return left;
 }

 public static void radixExchange(int[] array, int N, Canvas c) throws InterruptedException
 {
   Sorter.c = c;
   radixExchangeDo(0, N-1, 9, array); // 2^9 = 512 > 500 (maximum N)
   c.repaint();
 }

 private static void radixExchangeDo(int left, int right, int b, int[] array) throws InterruptedException
 {
   int i, j;
   if(right > left && b >= 0)
   {
     i = left;
     j = right;
     while(true)
     {
       while(bits(array[i], b, 1) == 1 && i < j) i++;
       while(bits(array[j], b, 1) == 0 && i < j) j--;
       temp = array[i];
       array[i] = array[j];
       array[j] = temp;
       if(INNER) { Thread.sleep(DELAY); c.repaint(); }
       if(j == i) break;
     }
     if(bits(array[right], b, 1) == 1) j++;
     if(OUTER) { Thread.sleep(DELAY); c.repaint(); }
     radixExchangeDo(left, j-1, b-1, array);
     radixExchangeDo(j, right, b-1, array);
   }
 }

 /**
  *todo: fix the bug
  */
 public static void radixStraight(int[] array, int N, Canvas c) throws InterruptedException
 {
   int[] array2 = new int[array.length];
   System.arraycopy(array, 0, array2, 0, array.length);

   int m = 5;
   int M = 32; // 2^m
   int w = 20; // a multiple of m

   int pass;
   int[] count = new int[N];
   int[] b = new int[N];

   for(pass=0; pass < (w / m) - 1; pass++)
   {
     for(int j=0; j<M-1; j++) count[j] = 0;
     for(int i=0; i<N-1; i++) count[bits(array2[i], pass*m, m)] = count[bits(array2[i], pass*m, m)] + 1;
     for(int j=1; j<M; j++) count[j] = count[j-1] + count[j];
     for(int i=N-1; i>=0; i--)
     {
       b[count[bits(array2[i], pass*m, m)]] = array2[i];
       count[bits(array2[i], pass*m, m)] = count[bits(array2[i], pass*m, m)] - 1;
       if(INNER) { Thread.sleep(DELAY); c.repaint(); }
     }
     for(int i=0; i<N; i++) array2[i] = b[i];

     for(int i=0; i<array.length; i++) array[i] = N - array2[i];

     if(OUTER) { Thread.sleep(DELAY); c.repaint(); }
   }
 }

 private static final int bits(int i, int position, int howMany)
 {
   int mask = (1 << howMany) - 1;
   return (i >> position) & mask;
 }

 public static void merge(int[] array, int N, Canvas c) throws InterruptedException
 {
   Sorter.c = c;
   mergesort(array, 0, N, N);
   c.repaint();
 }

 /**
  * Fix the big bug
  */
 private static void mergesort(int[] array, int left, int right, int total) throws InterruptedException
 {
   if(right <= left) return;

   int middle = (right + left) / 2;
   mergesort(array, left, middle, total);
   mergesort(array, middle + 1, right, total);

   int[] temp = new int[total];
   int i, k, j;
   for(i = middle; i>left; i--)
   {
     temp[i]  = array[i];
     System.out.print(array[i] + ", ");
   }
   for(j = middle+1; j<right; j++)
   {
     temp[right + middle + 1 - j] = array[j];
      System.out.print(array[j] + ", ");
   }
   System.out.println("\n---\n");

   if(OUTER) { Thread.sleep(DELAY); c.repaint(); }

   for(k = left; k<right; k++)
   {
     if(temp[i] < temp[j]) { array[k] = temp[i]; i++; }
     else { array[k] = temp[j]; j--; }

     if(INNER) { Thread.sleep(DELAY); c.repaint(); }

   }
 }

 /*public static void highSchool(int[] array, int N, Canvas c) throws InterruptedException
 {
   for(int i=0; i<N-1; i++)
   {
     for(int j=i; j<N; j++)
     {
       if(array[i] < array[j])
       {
         temp = array[i];
         array[i] = array[j];
         array[j] = temp;
         Thread.sleep(DELAY);
         c.repaint();
       }
     }
   }
 }*/
}