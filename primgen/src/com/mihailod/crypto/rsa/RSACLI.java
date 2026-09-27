package com.mihailod.crypto.rsa;

import java.io.*;

/**
 * Created by mihailod, 07.06.2008., 16.17.12
 *
 * Command Line Interface for the RSA engine
 */
public class RSACLI {
    public static void main(final String[] args) {
        if(args.length != 3) {
            usage();
            return;
        }
        if("g".equals(args[0])) {
            generate(args[1], args[2]);
        } else if("e".equals(args[0])) {
            encrypt(args[1], args[2]);
        } else if("d".equals(args[0])) {
            decrypt(args[1], args[2]);
        } else {
            usage();
        }
    }

    private static void generate(final String privFile, final String pubFile) {
        final RSAData rsaData = RSAKeyPairGenerator.generateKeys(new RSAData());
        PrintWriter privpw = null;
        PrintWriter pubpw = null;
        try {
            privpw = new PrintWriter(new FileWriter(privFile));
            pubpw = new PrintWriter(new FileWriter(pubFile));
            privpw.println(rsaData.getPrivateKey());
            pubpw.println(rsaData.getPublicKey());
        } catch(IOException iox) {
            iox.printStackTrace();
        } finally {
            if(privpw != null) {
                privpw.flush();
                privpw.close();
            }
            if(pubpw != null) {
                pubpw.flush();
                pubpw.close();
            }
        }
    }

    private static void encrypt(final String keyFile, final String plainFile) {
        BufferedReader brkey = null;
        BufferedReader brfile = null;
        try {
            brkey = new BufferedReader(new FileReader(keyFile));
            brfile = new BufferedReader(new FileReader(plainFile));
            final String key = brkey.readLine();
            // todo get the file as byte[]
            final RSAData rsaData = new RSAData();
            rsaData.setPublicKey(key);
            final RSA rsa;
            try {
                rsa = new RSA(rsaData);
            } catch(RSAException rsae) {
                rsae.printStackTrace();
            }
        } catch(IOException iox) {
            iox.printStackTrace();
        } finally {
            if(brkey != null) {
                try {
                    brkey.close();
                } catch(IOException iox) {
                    iox.printStackTrace();
                }
            }
            if(brfile != null) {
                try {
                    brfile.close();
                } catch(IOException iox) {
                    iox.printStackTrace();
                }
            }
        }
    }

    private static void decrypt(final String keyFile, final String encryptedFile) {
        // todo
        Util.p("Not implemented...");
    }

    private static void usage() {
        Util.p("RSACLI -- Command Line Interface for the RSA engine");
        Util.p("by Mihailo Despotovic, May/June 2008");
        Util.p("Usage:");
        Util.p("  rsacli g <privKeyFile> <pubKeyFile>");
        Util.p("  rsacli e <keyFile> <plainFile>");
        Util.p("  rsacli d <keyFile> <encryptedFile>");
    }
}
