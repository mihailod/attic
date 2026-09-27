package sorting;

import java.applet.*;
import java.awt.*;
import java.awt.image.*;

public class SortCanvas extends Canvas {

  private static Image buffer = null;
  private static Graphics bg = null;

  public Dimension getPreferredSize() { return new Dimension(500, 500); }

  public void paint(Graphics g) { update(g); }

  public void update(Graphics g)
  {
    int pw = getPreferredSize().width;
    int ph = getPreferredSize().height;

    buffer = createImage(pw, ph);
    bg = buffer.getGraphics();

    int dx = (int)(pw / SortFrame.N);
    int dy = (int)(ph / SortFrame.N);

    bg.clearRect(0, 0, pw-1, ph-1);
    bg.drawRect(0, 0, pw-1, ph-1);

    for(int i=0; i<SortFrame.N; i++)
      bg.fillRect(dx*i, dy*SortFrame.array[i], dx, dy);

    g.drawImage(buffer, 0, 0, null);
  }
}