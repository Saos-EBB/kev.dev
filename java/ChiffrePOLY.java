import java.util.Scanner;

public class ChiffrePOLY{

    public static void main(String[] args) {

        Scanner scan = new Scanner(System.in);

        System.out.println("Gib mir Text:");
        String text = normalize(scan.nextLine());

        System.out.println("Gib mir Passwort:");
        String pass = normalize(scan.nextLine());

        String encrypted = crypt(text, pass, true);
        System.out.println("Verschlüsselt : " + encrypted);

        String decrypted = crypt(encrypted, pass, false);
        System.out.println("Entschlüsselt : " + decrypted);

    }//mainEnte


    //1. Eingabe bereinigen
    static String normalize(String input) {

        input = input.toUpperCase();

        input = input
                .replace("Ä", "AE")
                .replace("Ö", "OE")
                .replace("Ü", "UE")
                .replace("ß", "SS");

        String clean = "";

        char[] arr = input.toCharArray();

        for (int i = 0; i < arr.length; i++) {


            if (arr[i] >= 'A' && arr[i] <= 'Z') {

                clean += arr[i];                                           // magic stuff
            }
        }

        return clean;
    }


    //2. Verschlüsselung
    static String crypt(String text, String pass, boolean encrypted) {

        String result = "";

        char[] tArr = text.toCharArray();
        char[] pArr = pass.toCharArray();

        int pIndex = 0;

        for (int i = 0; i < tArr.length; i++) {

            char letter = tArr[i];
            int key = pArr[pIndex] - 'A';

            if (!encrypted) {   // Wenn verschlüsselt wollen wir minus und nicht plus !
                key = -key;
            }

            int temp = letter + key;

            // reset if over or under
            if (temp > 'Z') {
                temp -= 26;
            }else if (temp < 'A') {
                temp += 26;
            }

            result = result + (char) temp;

            pIndex++;  // einfach in der schleife zählen !!!

            //rest if out of bound pw
            if (pIndex >= pArr.length) {
                pIndex = 0;
            }
        }

        result = result
                .replace("AE", "Ä")
                .replace("OE", "Ö")
                .replace("UE", "Ü")
                .replace("SS", "ß");



        return result;
    }

}//classEnte

