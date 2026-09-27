import java.util.*;

public class Permutations {
	private static Vector<String> allPerms(final String a)
	{
		final Vector<String> v = new Vector<String>();
		if (a.length() <= 1) {
			v.add(a);
		}
		else {
			final String allButLastChar = a.substring(0, a.length() - 1);
			final String lastChar = a.substring(a.length() - 1, a.length());
			final Vector<String> permsSoFar = allPerms(allButLastChar);
			for (int i=0; i<permsSoFar.size(); i++) {
				final String curr = (String)permsSoFar.elementAt(i);
				for (int j=0; j<a.length(); j++) {
					v.add(generateSimplePerm(curr, lastChar, j));
				}
			}
		}
		return v;
	}
	
	private static String generateSimplePerm(final String s, final String c, final int position) {
		final StringBuffer sb = new StringBuffer();
		for(int i=0; i<position; i++) {
			sb.append(s.charAt(i));
		}
		sb.append(c);
		for(int i=position; i<s.length(); i++) {
			sb.append(s.charAt(i));
		}
		return sb.toString();
	}
	
	public static void main(String[] args) {
		final String s = args.length == 0 ? "ABC" : args[0];
		final Vector<String> v = allPerms(s);
		System.out.print("String '" + s + "', number of permutations: " + v.size() + "\n{ ");
		for (int i=0; i<v.size(); i++) {
			System.out.print(v.elementAt(i) + " ");
		}
		System.out.println("}");
	}
}