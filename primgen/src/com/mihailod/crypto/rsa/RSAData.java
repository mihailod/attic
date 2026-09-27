package com.mihailod.crypto.rsa;

import java.math.BigInteger;

/**
 * Created by mihailod, 01.06.2008., 17.06.13
 */
public class RSAData {

    private static final int MIN_KEY_BITS = 8; // the minimum key size

    public int keyBits = 512; // how many bits in the key

    public static final BigInteger e = new BigInteger("65537"); // exponent, deafult to Fermat's prime 2^16 + 1

    public BigInteger n; // public key
    public BigInteger d; // private key

    public String getPublicKey() {
        return n.toString();
    }

    public void setPublicKey(final String s) {
        n = new BigInteger(s);
    }

    public String getPrivateKey() {
        return d.toString();
    }

    public void setPrivateKey(final String s) {
        d = new BigInteger(s);
    }

    public int numBytesInBlock = keyBits / 8;

    public String toString() {
        final StringBuilder sb = new StringBuilder();
        sb.append("Exponent: ").append(e).append("\n");
        sb.append("Public key:\n").append(n).append("\n");
        sb.append("Private key:\n").append(d).append("\n");
        return sb.toString();
    }

    public static void throwIfBad(final RSAData rsa) throws RSAException {
        if(rsa == null) {
            throw new RSAException("RSAData not inited!");
        }
        if(rsa.keyBits % 8 != 0) {
            throw new RSAException("keyBits must multiply 8");
        }
        if(rsa.keyBits < MIN_KEY_BITS) {
            throw new RSAException("keyBits cannot be less than " + MIN_KEY_BITS +"!");
        }
    }
}
