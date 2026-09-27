package com.mihailod.crypto.rsa;

import java.io.File;
import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;

/**
 * Created by mihailod, 06.06.2008., 23.34.58
 */
public class RSATest {

    public static void main(final String[] args) {
        
        final RSAData rsaData = RSAKeyPairGenerator.generateKeys(new RSAData());
        Util.p(rsaData.toString());
        final RSA rsa;
        try {
            rsa = new RSA(rsaData);
        } catch(RSAException rsae) {
            Util.p("Fatal RSA Exception occurred, terminating.");
            rsae.printStackTrace();
            return;
        }
        final String m;
        try {
            m = args.length == 1 ? getMessageFromFile(args[0]) : "o tempora o mores amiga!";
        } catch(IOException iox) {
            iox.printStackTrace();
            return;
        }
        final String c = new String(rsa.encrypt(m.getBytes()));
        Util.p("Plain text:\n" + m);
        Util.p("Encrypted text:\n" + c);
        final byte[] decm;
        try {
            decm = rsa.decrypt(c.getBytes());
        } catch(RSAException rsae) {
            Util.p("Fatal RSAException occurred, terminating.");
            rsae.printStackTrace();
            return;
        }
        Util.p("Decrypted text:\n" + new String(decm));
    }

    private static String getMessageFromFile(final String fileName) throws IOException {
        final BufferedReader br = new BufferedReader(new FileReader(fileName));
        final StringBuilder sb = new StringBuilder();
        String line;
        while((line = br.readLine()) != null) {
            sb.append(line);
        }
        return sb.toString();
    }
}
