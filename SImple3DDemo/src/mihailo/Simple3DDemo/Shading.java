package mihailo.Simple3DDemo;

import java.awt.*;

/**
 * Created by mihailod, Feb 21, 2011, 7:40:26 PM
 */
public class Shading {

    public static Color applyAmbientShading(final Color originalColor, final Color ambientColor) {

        final int r = (int)Math.round(originalColor.getRed()   * ambientColor.getRed()   / 255d);
        final int g = (int)Math.round(originalColor.getGreen() * ambientColor.getGreen() / 255d);
        final int b = (int)Math.round(originalColor.getBlue()  * ambientColor.getBlue()  / 255d);

        return new Color(r, g, b);
    }

    public static Color applyDiffuseShading(final Color originalColor, final Point3D spotLightPosition, final Color spotLightColor, final Point3D unitNormal) {

        final double diffusion = Matrix.dotProduct(spotLightPosition, unitNormal);
        if (diffusion > 0) {

            int r = originalColor.getRed();
            int g = originalColor.getGreen();
            int b = originalColor.getBlue();

            r += (int)Math.round((spotLightColor.getRed()   / 255d) * diffusion);
            g += (int)Math.round((spotLightColor.getGreen() / 255d) * diffusion);
            b += (int)Math.round((spotLightColor.getBlue()  / 255d) * diffusion);

            if (r > 255) r = 255;
            if (g > 255) g = 255;
            if (b > 255) b = 255;

            return new Color(r, g, b);
        } else {
            return originalColor;
        }
    }
}
