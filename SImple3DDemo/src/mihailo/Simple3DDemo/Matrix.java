package mihailo.Simple3DDemo;

/**
 * Created by mihailod, Feb 19, 2011, 11:43:41 AM
 */
public class Matrix {

    public static Point3D multiplyByVector(double matrix [][], final Point3D vector) {
        final Point3D resultVector = new Point3D(0, 0, 0, 0);

        resultVector.x += matrix[0][0] * vector.x;
        resultVector.x += matrix[0][1] * vector.y;
        resultVector.x += matrix[0][2] * vector.z;
        resultVector.x += matrix[0][3] * vector.w;

        resultVector.y += matrix[1][0] * vector.x;
        resultVector.y += matrix[1][1] * vector.y;
        resultVector.y += matrix[1][2] * vector.z;
        resultVector.y += matrix[1][3] * vector.w;

        resultVector.z += matrix[2][0] * vector.x;
        resultVector.z += matrix[2][1] * vector.y;
        resultVector.z += matrix[2][2] * vector.z;
        resultVector.z += matrix[2][3] * vector.w;

        resultVector.w += matrix[3][0] * vector.x;
        resultVector.w += matrix[3][1] * vector.y;
        resultVector.w += matrix[3][2] * vector.z;
        resultVector.w += matrix[3][3] * vector.w;

        return resultVector;
    }

    public static double[][] multiplyByMatrix(double matrix[][], double m[][]) {
        final double resultMatrix[][] = new double[4][4];
        for (int i=0; i<4; i++) {
            for (int j=0; j<4; j++) {
                resultMatrix[i][j] = 0;
                for (int k=0; k<4; k++) {
                    resultMatrix[i][j] += matrix[i][k] * m[k][j];
                }
            }
        }
        return resultMatrix;
    }

    public static Point3D crossProduct(final Point3D v, final Point3D w) {
        final double x = v.y*w.z - v.z*w.y;
        final double y = v.z*w.x - v.x*w.z;
        final double z = v.x*w.y - v.y*w.x;
        return new Point3D(x, y, z, v.w);
    }

    public static double dotProduct(final Point3D v, final Point3D w) {
        return v.x*w.x + v.y*w.y + v.z*w.z;
    }
}
