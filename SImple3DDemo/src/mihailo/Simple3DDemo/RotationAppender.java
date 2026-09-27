package mihailo.Simple3DDemo;

import static mihailo.Simple3DDemo.SimpleApplet.*;

/**
 * Created by mihailod, Feb 20, 2011, 9:42:01 PM
 */
public class RotationAppender {

    public static void appendRotationX(final double angle) {
        double cos = Math.cos(angle);
        double sin = Math.sin(angle);

        double t10 = cos*worldTransform[1][0] + -sin*worldTransform[2][0];
        double t11 = cos*worldTransform[1][1] + -sin*worldTransform[2][1];
        double t12 = cos*worldTransform[1][2] + -sin*worldTransform[2][2];

        double t20 = sin*worldTransform[1][0] +  cos*worldTransform[2][0];
        double t21 = sin*worldTransform[1][1] +  cos*worldTransform[2][1];
        double t22 = sin*worldTransform[1][2] +  cos*worldTransform[2][2];

        worldTransform[1][0] = t10;
        worldTransform[1][1] = t11;
        worldTransform[1][2] = t12;
        worldTransform[2][0] = t20;
        worldTransform[2][1] = t21;
        worldTransform[2][2] = t22;
    }

    public static void appendRotationY(final double angle) {
        double cos = Math.cos(angle);
        double sin = Math.sin(angle);

        double t00 =  cos*worldTransform[0][0] + sin*worldTransform[2][0];
        double t01 =  cos*worldTransform[0][1] + sin*worldTransform[2][1];
        double t02 =  cos*worldTransform[0][2] + sin*worldTransform[2][2];

        double t20 = -sin*worldTransform[0][0] + cos*worldTransform[2][0];
        double t21 = -sin*worldTransform[0][1] + cos*worldTransform[2][1];
        double t22 = -sin*worldTransform[0][2] + cos*worldTransform[2][2];

        worldTransform[0][0] = t00;
        worldTransform[0][1] = t01;
        worldTransform[0][2] = t02;
        worldTransform[2][0] = t20;
        worldTransform[2][1] = t21;
        worldTransform[2][2] = t22;
    }

    public static void appendRotationZ(final double angle) {
        double cos = Math.cos(angle);
        double sin = Math.sin(angle);

        double t00 = cos*worldTransform[0][0] + -sin*worldTransform[1][0];
        double t01 = cos*worldTransform[0][1] + -sin*worldTransform[1][1];
        double t02 = cos*worldTransform[0][2] + -sin*worldTransform[1][2];

        double t10 = sin*worldTransform[0][0] +  cos*worldTransform[1][0];
        double t11 = sin*worldTransform[0][1] +  cos*worldTransform[1][1];
        double t12 = sin*worldTransform[0][2] +  cos*worldTransform[1][2];

        worldTransform[0][0] = t00;
        worldTransform[0][1] = t01;
        worldTransform[0][2] = t02;
        worldTransform[1][0] = t10;
        worldTransform[1][1] = t11;
        worldTransform[1][2] = t12;
    }
}
