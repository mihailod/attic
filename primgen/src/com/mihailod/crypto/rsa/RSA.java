package com.mihailod.crypto.rsa;

import java.math.BigInteger;
import static java.math.BigInteger.*;
import java.util.StringTokenizer;

/**
 * Created by mihailod, 01.06.2008., 17.16.02
 */
public class RSA {

    private static final BigInteger BI_256 = new BigInteger("256");
    private static final byte PAD_MARKER = (byte)63;

    private RSAData rsa = null;

    public RSA(final RSAData rsa) throws RSAException {
        RSAData.throwIfBad(rsa);
        this.rsa = rsa;
    }

    /**
     * c = m^e mod n
     * @param m plaintext bytes
     * @return encrypted bytes
     */
    public byte[] encrypt(final byte[] m) {
        final byte[] pm = pad(m);
        final StringBuilder sb = new StringBuilder();
        for(int i=0; i<pm.length; i+=rsa.numBytesInBlock) {
            BigInteger block = ZERO;
            for(int j=0; j<rsa.numBytesInBlock; j++) {
                // contruct a big number from the digits
                block = block.multiply(BI_256).add(new BigInteger(String.valueOf(pm[i+j])));
            }
            final BigInteger encryption = block.modPow(RSAData.e, rsa.n);
            sb.append(encryption.toString()).append("\n");
        }
        return sb.toString().getBytes();
    }

    /**
     * m = c^d mod n
     * @param c encrypted bytes
     * @return plaintext bytes
     * @throws RSAException if anything bad happens 
     */
    public byte[] decrypt(final byte[] c) throws RSAException {
        final StringBuilder sb = new StringBuilder();
        final StringTokenizer st = new StringTokenizer(new String(c), "\n");
        final char[] chars = new char[rsa.numBytesInBlock];
        BigInteger big;
        BigInteger dandr[];
        while(st.hasMoreTokens()) {
            final String token = st.nextToken();
            big = (new BigInteger(token)).modPow(rsa.d, rsa.n);
            for(int i=0; i<rsa.numBytesInBlock; i++) {
                // deduct the digits from a big number (they will be backwards!)
                dandr = big.divideAndRemainder(BI_256);
                big = dandr[0];
                chars[(rsa.numBytesInBlock - 1) - i] = (char)(dandr[1].intValue());
            }
            sb.append(chars);
        }
        return unpad(sb.toString().getBytes());
    }

    /**
     * Pad the bytes with the padding marker and the appropriate number of zeros.
     * @param m unpadded message
     * @return padded message
     */
    private byte[] pad(final byte[] m) {
        final int missing = rsa.numBytesInBlock - (m.length % rsa.numBytesInBlock);
        final byte[] pm = new byte[m.length + missing];
        System.arraycopy(m, 0, pm, 0, m.length);
        pm[m.length] = PAD_MARKER;
        // this loop is necessary in Java since the bytes in the array are already initialized to 0
        for(int i=m.length+1; i<pm.length; i++) {
            pm[i] = (byte)0;
        }
        return pm;
    }

    /**
     * Unpad the bytes.
     * @param pm padded bytes
     * @return unpadded bytes
     * @throws RSAException if the padding bute not 0 or pad marker not found.
     */
    private static byte[] unpad(final byte[] pm) throws RSAException {
        // need to discover the last byte with value 128
        int i;
        for(i=pm.length-1; i>0; i--) {
            final byte b = pm[i];
            if(b == 0) {
                /* keep going */
            } else if(b == PAD_MARKER) {
                break;
            } else {
                throw new RSAException("Pading byte not 0!");
            }
        }
        if(i == 0) {
            throw new RSAException("Pad marker not found in the message!");
        }
        // at this point, i marks the last valid byte before the padding
        final byte[] m = new byte[i];
        System.arraycopy(pm, 0, m, 0, m.length);
        return m;
    }
}
