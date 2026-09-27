import java.util.Random;

public class PC {
  private static volatile int counter = 0;
  private static Object mutex = new Object();
  private static final int C_POOL_SIZE = 10;
  private static final int P_POOL_SIZE = 20;

  private static class Consumer extends Thread { public void run() { while (true) { consume(); } } }
  private static class Producer extends Thread { public void run() { while (true) { produce(); } } }

  public static void main(String[] args) {
    final Consumer[] consumers = new Consumer[C_POOL_SIZE];
    for (int i=0; i<C_POOL_SIZE; i++) {
      consumers[i] = new Consumer(); consumers[i].start();
    }
    final Producer[] producers = new Producer[P_POOL_SIZE];
    for (int i=0; i<P_POOL_SIZE; i++) {
      producers[i] = new Producer(); producers[i].start();
    }
  }

  private static void produce() {
    try { Thread.sleep(new Random().nextInt(200)); } catch (InterruptedException ie) { ie.printStackTrace(); }
    synchronized (mutex) {
      while (counter == 9) {
        System.out.print(" F ");
        try { mutex.wait(); } catch (InterruptedException ie) { ie.printStackTrace(); } 
      }
      try { Thread.sleep(new Random().nextInt(200)); } catch (InterruptedException ie) { ie.printStackTrace(); }
      counter++;
      System.out.print(counter + " ");
      mutex.notifyAll();
    }
  }

  private static void consume() {
    try { Thread.sleep(new Random().nextInt(200)); } catch (InterruptedException ie) { ie.printStackTrace(); }
    synchronized (mutex) {
      while (counter == 0) {
        System.out.print(" E ");
        try { mutex.wait(); } catch (InterruptedException ie) { ie.printStackTrace(); }
      }
      try { Thread.sleep(new Random().nextInt(200)); } catch (InterruptedException ie) { ie.printStackTrace(); }
      counter--;
      System.out.print(counter + " ");
      mutex.notifyAll();
    }
  }
}
