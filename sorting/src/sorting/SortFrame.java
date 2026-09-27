package sorting;

import java.awt.*;
import java.awt.event.*;

public class SortFrame extends Frame implements ActionListener, ItemListener
{
  private static final int W = 620;
  private static final int H = 600;

  public static int N = 50; // size of the array
  public static int array[] = new int[500]; // allocate memory

  private static int oldIndex = 0;

  private Choice points = new Choice();

  private CheckboxGroup cbg = new CheckboxGroup();
  private Checkbox dist = new Checkbox("Distribution Count", true, cbg);
  private Checkbox selection = new Checkbox("Selection Sort", false, cbg);
  private Checkbox insertion = new Checkbox("Insertion Sort", false, cbg);
  private Checkbox bubble = new Checkbox("Bubble Sort", false, cbg);
  private Checkbox shell = new Checkbox("Shell Sort", false, cbg);
  private Checkbox quick = new Checkbox("Quick Sort", false, cbg);
  private Checkbox radixExchange = new Checkbox("Radix Exchange Sort", false, cbg);
  private Checkbox radixStraight = new Checkbox("Straight Radix Sort", false, cbg);
  private Checkbox heap = new Checkbox("Heap Sort", false, cbg);
  private Checkbox merge = new Checkbox("Merge Sort", false, cbg);

  private CheckboxGroup cbg2 = new CheckboxGroup();
  private Checkbox noDelay = new Checkbox("No Delay", false, cbg2);
  private Checkbox outerLoop = new Checkbox("Delay Outer Loop", true, cbg2);
  private Checkbox innerLoop = new Checkbox("Delay Inner Loop", false, cbg2);

  private Button start = new Button("Start");
  private Button shuffle = new Button("Shuffle");

  private static SortCanvas c = null;

  Thread t = null;

  public SortFrame()
  {
    super("Sorting Examples");
    int x = (Toolkit.getDefaultToolkit().getScreenSize().width - W) / 2;
    int y = (Toolkit.getDefaultToolkit().getScreenSize().height - H) / 2;
    setBounds(x, y, W, H);
    setLayout(new BorderLayout());

    Panel buttons = new Panel(new FlowLayout(FlowLayout.CENTER));
    buttons.add(start);
    buttons.add(shuffle);
    start.addActionListener(this);
    shuffle.addActionListener(this);

    points = new Choice();
    points.add("50 Numbers");
    points.add("100 Numbers");
    points.add("500 Numbers");
    points.addItemListener(this);

    Panel radios = new Panel(new GridLayout(0, 1));
    radios.add(points);
    radios.add(new Panel());
    radios.add(dist);
    radios.add(selection);
    radios.add(insertion);
    radios.add(bubble);
    radios.add(shell);
    radios.add(quick);
    radios.add(radixExchange);
    //radios.add(radixStraight);
    //radios.add(heap);
    //radios.add(merge);
    radios.add(new Panel());
    radios.add(new Panel());
    radios.add(new Panel());
    radios.add(new Panel());
    radios.add(noDelay);
    radios.add(outerLoop);
    radios.add(innerLoop);
    noDelay.addItemListener(this);
    outerLoop.addItemListener(this);
    innerLoop.addItemListener(this);
    Panel radiosWrap = new Panel(new BorderLayout());
    radiosWrap.add(new Panel(), BorderLayout.WEST);
    radiosWrap.add(new Panel(), BorderLayout.EAST);
    radiosWrap.add(new Panel(), BorderLayout.NORTH);
    radiosWrap.add(radios);

    addWindowListener(
     new WindowAdapter()
     {
       public void windowClosing(WindowEvent we)
       {
         SortFrame.this.dispose();
         System.exit(0);
       }
     }
   );

   c = new SortCanvas();

   add(c, BorderLayout.CENTER);
   add(radiosWrap, BorderLayout.EAST);
   add(buttons, BorderLayout.SOUTH);

   heap.setEnabled(false);

   Sorter.shuffle(array, N);
   pack();
   show();
 }

 public void actionPerformed(ActionEvent ae)
 {
   if(ae.getSource() == shuffle) { Sorter.shuffle(array, N); c.repaint(); }
   else if(ae.getSource() == start)
   {
     if(start.getLabel().equals("Stop"))
     {
       new Thread()
       {
         public void run()
         {
           t.interrupt();
           setGUI(true);
         }
       }.start();
       return;
     }

     if(selection.getState())
     {
       t = new Thread() { public void run()
       {
         setGUI(false);
         try { Sorter.selection(array, N, c); }
         catch(InterruptedException ie) { ; }
         setGUI(true);
        }};
       t.start();
     }
     else if(insertion.getState())
     {
       t = new Thread() { public void run()
       {
         setGUI(false);
         try { Sorter.insertion(array, N, c); }
         catch(InterruptedException ie) { ; }
         setGUI(true);
        }};
       t.start();
     }
     else if(bubble.getState())
     {
       t = new Thread() { public void run()
       {
         setGUI(false);
         try { Sorter.bubble(array, N, c); }
         catch(InterruptedException ie) { ; }
         setGUI(true);
       }};
       t.start();
     }
     else if(shell.getState())
     {
       t = new Thread() { public void run()
       {
         setGUI(false);
         try { Sorter.shell(array, N, c); }
         catch(InterruptedException ie) { ; }
         setGUI(true);
       }};
       t.start();
     }
     else if(dist.getState())
     {
       t = new Thread() { public void run()
       {
         setGUI(false);
         try { Sorter.dist(array, N, c); }
         catch(InterruptedException ie) { ; }
         setGUI(true);
       }};
       t.start();
     }
     else if(quick.getState())
     {
       t = new Thread() { public void run()
       {
         setGUI(false);
         try { Sorter.quick(array, N, c); }
         catch(InterruptedException ie) { ; }
         setGUI(true);
       }};
       t.start();
     }
     else if(radixExchange.getState())
     {
       t = new Thread() { public void run()
       {
         setGUI(false);
         try { Sorter.radixExchange(array, N, c); }
         catch(InterruptedException ie) { ; }
         setGUI(true);
       }};
       t.start();
     }
     else if(radixStraight.getState())
     {
       t = new Thread() { public void run()
       {
         setGUI(false);
         try { Sorter.radixStraight(array, N, c); }
         catch(InterruptedException ie) { ; }
         setGUI(true);
       }};
       t.start();
     }
     if(merge.getState())
     {
       t = new Thread() { public void run()
       {
         setGUI(false);
         try { Sorter.merge(array, N, c); }
         catch(InterruptedException ie) { ; }
         setGUI(true);
        }};
       t.start();
     }
   }
 }

 public void itemStateChanged(ItemEvent ie)
 {
   if(ie.getSource() == noDelay) Sorter.setNoDelay();
   else if(ie.getSource() == outerLoop) Sorter.setOuterDelay();
   else if(ie.getSource() == innerLoop) Sorter.setInnerDelay();
   else if(ie.getSource() == points)
   {
     int newIndex = points.getSelectedIndex();
     if(newIndex == oldIndex) return;
     oldIndex = newIndex;
     if(points.getSelectedIndex() == 0) { N = 50; }
     else if(points.getSelectedIndex() == 1) { N = 100; }
     else { N = 500; }
     Sorter.shuffle(array, N);
     c.repaint();
   }
 }

 private void setGUI(boolean enabled)
 {
   dist.setEnabled(enabled);
   points.setEnabled(enabled);
   selection.setEnabled(enabled);
   insertion.setEnabled(enabled);
   bubble.setEnabled(enabled);
   shell.setEnabled(enabled);
   quick.setEnabled(enabled);
   radixExchange.setEnabled(enabled);
   radixStraight.setEnabled(enabled);
   //heap.setEnabled(enabled);
   //merge.setEnabled(enabled);
   shuffle.setEnabled(enabled);
   start.setLabel(enabled ? "Start" : "Stop");
 }
}