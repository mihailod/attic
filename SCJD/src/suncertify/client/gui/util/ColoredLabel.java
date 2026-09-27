package suncertify.client.gui.util;

import javax.swing.*;
import java.awt.*;

/**
 * ColoredLabel.
 * Extends <code>JLabel</code> and provides functionallity to
 * specify the foreground color at the constructor.
 * 
 * @author Mihailo Despotovic
 * @version 1.0
 */
public class ColoredLabel extends JLabel
{
	private static final Color DEFAULT_COLOR = Color.black;
	
	/**
	 * This construcotor creates JLabel with custom color.
	 * 
	 * @param String text
	 * @param Color color
	 */
	public ColoredLabel(String text, Color color)
	{
		super(text);
		this.setForeground(color);
	}
	
	/**
	 * This constructor creates JLabel with default color (Black)
	 * 
	 * @param String text
	 */
	public ColoredLabel(String text)
	{
		super(text);
		this.setForeground(DEFAULT_COLOR);
	}
}
