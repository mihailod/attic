package com.mirteh.davoru;

import javax.swing.*;
import java.awt.*;
import java.awt.event.*;
import java.io.*;
import java.util.Date;

/**
 * Created by mihailod, 11/15/13, 4:33 PM
 */
public class Trader {

    private static final String name = "Davor's Trader";
    private static final String version = "1.0";
    private static final String copyright = "\u00A9MiRteh 2013 mihailod@me.com";
    private static final String title = name + " " + version + " " + copyright;

    private static final Font font = new Font("monospaced", Font.BOLD, 18);

    private static final JButton load = new JButton("Read Data File");
    private static final JButton process = new JButton("Process Data");

    private static final JButton clearData = new JButton("Clear Data");
    private static final JButton clearProg = new JButton("Clear Program");
    private static final JButton clear = new JButton("Clear All");


    private static final String srcInitText = "";
    private static final String dstInitText = "";
    private static final JTextArea src = new JTextArea(srcInitText);
    private static final JTextArea dst = new JTextArea(dstInitText);

    private static final JTextArea debugArea = new JTextArea("");

    public static void main(String[] args) {
        d(title);
        d("Appication starting...");
        final JFrame f = new JFrame(title);
        f.addWindowListener(new WindowAdapter() {
            public void windowClosing(java.awt.event.WindowEvent windowEvent) {
                d("Close application");
                final int result = JOptionPane.showConfirmDialog(f, "Close the application?", "Close",
                        JOptionPane.YES_NO_OPTION, JOptionPane.QUESTION_MESSAGE);
                if (result == JOptionPane.YES_OPTION) {
                    System.exit(0);
                } else {
                    d("Close application cancelled");
                    f.setDefaultCloseOperation(WindowConstants.DO_NOTHING_ON_CLOSE);
                }
            }
        });
        centerFrame(f);

        final Container c = f.getContentPane();
        c.setLayout(new BorderLayout());

        final JPanel north = new JPanel();
        c.add(north, BorderLayout.NORTH);
        north.setLayout(new FlowLayout(FlowLayout.LEADING));

        load.addActionListener(new ActionListener() {
            public void actionPerformed(ActionEvent actionEvent) {
                d("Load Data File");
                final JFileChooser fc = new JFileChooser();
                int returnVal = fc.showOpenDialog(f);
                if (returnVal == JFileChooser.APPROVE_OPTION) {
                    final File file = fc.getSelectedFile();
                    d("Opening file: " + file.getAbsolutePath());
                    openFile(file);
                } else {
                    d("Open file cancelled");
                }
            }
        });
        north.add(load);

        process.addActionListener(new ActionListener() {
            public void actionPerformed(ActionEvent actionEvent) {
                d("Process Data File");
                final String text = dst.getText().trim();
                process(text);
            }
        });
        north.add(process);

        north.add(new JPanel()); north.add(new JPanel()); north.add(new JPanel()); north.add(new JPanel());

        clearData.addActionListener(new ActionListener() {
            public void actionPerformed(ActionEvent e) { src.setText(""); }
        });
        north.add(clearData);
        clearProg.addActionListener(new ActionListener() {
            public void actionPerformed(ActionEvent e) { dst.setText(""); }
        });
        north.add(clearProg);
        clear.addActionListener(new ActionListener() {
            public void actionPerformed(ActionEvent e) { src.setText(""); dst.setText(""); debugArea.setText(""); }
        });
        north.add(clear);

        final JPanel center = new JPanel();
        c.add(center, BorderLayout.CENTER);
        center.setLayout(new GridLayout(1, 2));

        src.setFont(font);
        src.setBorder(BorderFactory.createLineBorder(Color.black));
        final JScrollPane spSrc = new JScrollPane(src);
        spSrc.setVerticalScrollBarPolicy(ScrollPaneConstants.VERTICAL_SCROLLBAR_ALWAYS);
        final JPanel p1 = new JPanel();
        p1.setLayout(new BorderLayout());
        p1.add(spSrc, BorderLayout.CENTER);
        final JLabel data = new JLabel("\t\tData");
        data.setFont(font);
        p1.add(data, BorderLayout.NORTH);
        center.add(p1);

        dst.setFont(font);
        dst.setBorder(BorderFactory.createLineBorder(Color.black));
        final JScrollPane spDst = new JScrollPane(dst);
        spDst.setVerticalScrollBarPolicy(ScrollPaneConstants.VERTICAL_SCROLLBAR_ALWAYS);
        dst.setBackground(new Color(204, 229, 255));
        final JPanel p2 = new JPanel();
        p2.setLayout(new BorderLayout());
        p2.add(spDst, BorderLayout.CENTER);
        final JLabel prog = new JLabel("\t\tProgram");
        prog.setFont(font);
        p2.add(prog, BorderLayout.NORTH);
        center.add(p2);

        debugArea.setRows(7);
        debugArea.setFont(new Font("monospaced", Font.PLAIN, 12));
        debugArea.setBackground(new Color(210, 210, 210));
        debugArea.setEditable(false);
        final JScrollPane sp3 = new JScrollPane(debugArea);
        sp3.setVerticalScrollBarPolicy(ScrollPaneConstants.VERTICAL_SCROLLBAR_ALWAYS);
        c.add(sp3, BorderLayout.SOUTH);

        f.setVisible(true);

        d("Application started");
    }

    private static void centerFrame(final Window f) {
        final Dimension dimension = Toolkit.getDefaultToolkit().getScreenSize();
        final int w = ((int)dimension.getWidth() - 400);
        final int h = ((int)dimension.getHeight() - 300);
        f.setBounds(0, 0, w, h);
        final int x = (int) ((dimension.getWidth() - f.getWidth()) / 2);
        final int y = (int) ((dimension.getHeight() - f.getHeight()) / 2);
        f.setLocation(x, y);
    }

    private static void d(final String s) {
        debugArea.append(new Date(System.currentTimeMillis()) + ": " + s + "\n");
        debugArea.setCaretPosition(debugArea.getText().length());
    }

    private static void error(final String s) {
        JOptionPane.showMessageDialog(null, s, "Error", JOptionPane.ERROR_MESSAGE);

    }

    private static void openFile(final File f) {
        BufferedReader br;
        try {
            br = new BufferedReader(new FileReader(f.getAbsolutePath()));
        } catch (FileNotFoundException fnfe) {
            d(fnfe.toString());
            return;
        }
        String line;
        int count = 0;
        src.setText("");
        try {
            while ((line = br.readLine()) != null) {
                src.append(line);
                src.append("\n");
                count++;
            }
        } catch (IOException iox) {
            d(iox.toString());
        }
        d("Read " + count + " lines");
    }

    private static void process(final String txt) {
        if (txt.length() == 0) {
            d("Nothing to process");
            error("Nothing to do!\nEnter data in the white area\nor load a data file.");
        }
        // todo
    }
}


#property copyright"Mirteh"
        #property link"mihailod@me.com"

// static defines

        #define MAGICMA 87265234
        #define SLIPPAGE 3
        #define COLOR_CLOSE White
        #define COLOR_OPEN_BUY Blue
        #define COLOR_OPEN_SELL Red
        #define DUMMY_LO 99999999
        #define DUMMY_HI-1

// external inputs

        extern string samplingStartTime="11:00";
extern string samplingEndTime="13:30";

extern string tradingStartTime="13:31";
extern string tradingEndTime="17:00";

extern double lots=0.1;

extern double pipsEntry=0.0004;
extern double pipsProfit=0.002;
extern double positiveStopSell=0.0004;
extern double negativeStopSell=0.003;

extern bool debug=true;

// internal global variables

// modes of operation
bool sampling=false;
bool trading=false;

// these two are discovered during sampling
double lo=DUMMY_LO; // initial dummy value
double hi=DUMMY_HI; // initial dummy value

datetime samplingStartTimeDT;
datetime samplingEndTimeDT;
datetime tradingStartTimeDT;
datetime tradingEndTimeDT;

//double previousLow = -1;
int day=-1;

bool buyOpened=false;
bool buyClosed=false;
bool sellOpened=false;
bool sellClosed=false;

int init(){
        samplingStartTimeDT=StrToTime(samplingStartTime);
samplingEndTimeDT=StrToTime(samplingEndTime);
tradingStartTimeDT=StrToTime(tradingStartTime);
tradingEndTimeDT=StrToTime(tradingEndTime);
day=TimeDayOfWeek(TimeCurrent());
return(0);
}
        int deinit(){return(0);}

        int start(){
        if(badInputs()){
        return(0);
}
        if(!IsTradeAllowed()){
        d("Trade not allowed!");
return(0);
}

        determineProgramMode();
if(sampling){
        //d("Sampling...");
        sample();
}else if(trading){
        //d("Trading...");
        //if (previousLow == -1) {
        //   previousLow = Low;
        //d("Previous bid set for the first time to: " + previousBid);
        //   return (0);
        //}
        int numOrders=CalculateCurrentOrders(Symbol());
if(numOrders>1||numOrders<-1){
        Print("Multiple existing orders detected: "+numOrders+", bailing out...");
return(0);
}
        trade(numOrders);
//previousLow = Low;
}else{
        //d("Nothing");
        }
        }

        void determineProgramMode(){
        datetime currentTime=TimeCurrent();
if(currentTime>=samplingStartTimeDT&&currentTime<=samplingEndTimeDT){


        sampling=true;
trading=false;
}else if(currentTime>=tradingStartTimeDT&&currentTime<=tradingEndTimeDT){
        trading=true;
sampling=false;
}else{
        trading=false;
sampling=false;
}

        int dayNow=TimeDayOfWeek(TimeCurrent());
if(day!=dayNow&&!buyOpened&&!sellOpened){

        d("A new day detected!");

// a new day begins, reset everything
// this assumes no trading is done around midnight!
day=dayNow;
buyOpened=false;
buyClosed=false;
sellOpened=false;
sellClosed=false;
trading=false;
sampling=false;
lo=DUMMY_LO;
hi=DUMMY_HI;

d("old time: "+samplingStartTimeDT);
samplingStartTimeDT+=86400;
d("new time: "+samplingStartTimeDT);
samplingEndTimeDT+=86400;

tradingStartTimeDT+=86400;
tradingEndTimeDT+=86400;
}

        if(lo==DUMMY_LO||hi==DUMMY_HI){
        trading=false;
}
        }

        void sample(){
        if(Bid>hi){
        d("Sampling reached new hi: "+hi);
hi=Bid;
}else if(Bid<lo){
        d("Sampling reached new lo: "+lo);
lo=Bid;
}else{
        //d("No change in hi and low... hi " + hi + " lo " + lo + " bid " + Bid);
        }
        }

        void trade(int numOrders){
        RefreshRates();
if(numOrders==0){
        checkForOpen();
}else{
        checkForClose();
}
        }

        void checkForOpen(){
//d("Check for open");
        int res;
if(isOkForBuy()){
        int exp=CurTime()+60*PERIOD_D1;
res=OrderSend(Symbol(),OP_BUY,lots,Ask,SLIPPAGE,0,0,"",MAGICMA,exp,COLOR_OPEN_BUY);
if(res==-1){
        Print("Error buying: "+GetLastError());
}else{
        buyOpened=true;
}
        return;
}else if(isOkForSell()){
        res=OrderSend(Symbol(),OP_SELL,lots,Bid,SLIPPAGE,0,0,"",MAGICMA,0,COLOR_OPEN_SELL);
if(res==-1){
        Print("Error opening sell: "+GetLastError());
}else{
        sellOpened=true;
}
        return;
}
        }

        bool isOkForSell(){
        if(Bid-lo<pipsEntry&&!buyOpened&&!sellClosed){
        d("selling because bid "+Bid+" - lo "+lo+" < pips: "+(Bid-lo));
return(true);
}else{
        return(false);
}
        }

        bool isOkForBuy(){
        if(Ask-hi>pipsEntry&&!sellOpened&&!buyClosed){
        return(true);
}else{
        return(false);
}
        }

        void checkForClose(){
        bool closed;
int otot=OrdersTotal();
for(int i=otot-1;i>=0;i--){
        if(OrderSelect(i,SELECT_BY_POS,MODE_TRADES)==false)break;
if(OrderMagicNumber()!=MAGICMA||OrderSymbol()!=Symbol())continue;
// at this point we found our open order and we need to close it
if(OrderType()==OP_BUY){
        if(closeBuy()){
        //d("Closing BUY, ticket " + OrderTicket());
        closed=OrderClose(OrderTicket(),OrderLots(),Bid,SLIPPAGE,COLOR_CLOSE);
if(!closed){
        Print("Error closing buy order "+OrderTicket()+" - "+GetLastError());
}else{
        buyOpened=false;
buyClosed=true;
//d("Closed buy order " + OrderTicket());
}
        }else{
        //d("Did not close buy");
        }
        }else if(OrderType()==OP_SELL){
        if(closeSell()){
        //d("Closing SELL, ticket: " + OrderTicket());
        closed=OrderClose(OrderTicket(),OrderLots(),Ask,SLIPPAGE,COLOR_CLOSE);
if(!closed){
        Print("Error closing sell order "+OrderTicket()+" - "+GetLastError());
}else{
        sellOpened=false;
sellClosed=true;
//Print("Closed sell order " + OrderTicket());
}
        }else{
        //d("Did no close sell");
        }
        }else{
        //d("Non-closable order type " + OrderType());
        }
        }
        }

        bool closeSell(){
        bool positive=Ask>High[1]+positiveStopSell;
if(positive){
        return(positive);
}
        bool negative=OrderOpenPrice()+positiveStopSell<=Ask;
return(negative);
}

        bool closeBuy(){
        bool positive=Bid<Low[1]-positiveStopSell;
//double profit = Bid - OrderOpenPrice();
//positive = positive && (profit >= pipsProfit);
if(positive){
        return(true);
}
        bool negative=OrderOpenPrice()-negativeStopSell>=Bid;
return(negative);
}

        int CalculateCurrentOrders(string symbol){
        int buys=0;
int sells=0;
// see all orders selected from trading pool (opened and pending orders)
int ot=OrdersTotal();
for(int i=ot-1;i>=0;i--){
        //d("Checking order " + i);
        // select an order for further processing
        // if the function fails -> break
        if(OrderSelect(i,SELECT_BY_POS,MODE_TRADES)==false){
        Print("Select failed!");
break;
}
        if(OrderSymbol()==Symbol()&&OrderMagicNumber()==MAGICMA){
        if(OrderType()==OP_BUY||OrderType()==OP_BUYSTOP){
        buys++;
}else if(OrderType()==OP_SELL||OrderType()==OP_SELLSTOP){
        sells++;
}
        }
        }
//d("Calculated buys: " + buys + " and sells: " + sells);
        if(buys>0){
        return(buys);
}else{
        return(-sells);
}
        }

        bool badInputs(){
        return(false); // todo
}

        void d(string s){
        if(debug){
        Print(s);
}
        }