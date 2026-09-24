import java.util.ArrayList;
import java.util.Random;
import java.util.Scanner;

public class MinesweaperV2 {
    static void main(String[] args) {
        Scanner scan = new Scanner(System.in);
        Random randy = new Random(0);

        ArrayList<String> inputs = new ArrayList<>();

        int[][] map = new int[10][10];
        char[] KoorB = {'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'};
        int checked = 0;
        boolean alive = true;
        String userInput;
        int mines = fillMap(map, KoorB, randy);
        //int mines = fillMapNoPrint(map,randy);
        int radius = 0;
        int green = 100 - mines;


        System.out.print("\n\n\nDu rätst wo  keine Mienen sind, wenn du falsch wählst spreng ich dich : ) \n");

        while (alive) {

            //Map print
            printMap(map, KoorB);

            // magic-scanner 1.0
            userInput = userInput("",scan,inputs);

            // FIX : magic-scanner 1.1
            // userInput = userInputDo("", scan,inputs);

            // koordinaten = wert 0 - 9
            char c1 = userInput.charAt(0);
            int x = c1 - 'A';
            char c2 = userInput.charAt(1);
            int y = c2 - '0';
            //Eingabe Absicherung / Werte in map ändern



            if (map[x][y] == 4) {
                System.out.println("Schon aufgedeckt!");
                continue;
            }
            //Aufdecken bei 3, 5x5
            else if (map[x][y] == 3) {
                radius = 2;

            }
            //Aufdecken bei 2, 3x3
            else if (map[x][y] == 2) {
                radius = 1;

            }//aufdecken 1x1
            else if (map[x][y] == 1) {
                radius = 0;

            }//bombe
            else if (map[x][y] == 0) {                                                                         // Game Over
                System.out.println(BOOOM);
                alive = false;
            }

            //FIX - Code verdopplung entfernen
            for (int i = -radius ; i <= radius; i++) {  // Neue Var für Radius des aufdeckens

                if (x + i >= map.length || x + i < 0) {  // out of bound error vermeiden
                    continue;
                }
                for (int j = -radius ; j <= radius; j++) {
                    if (y + j >= map.length || y + j < 0) {
                        continue;
                    } if (map[x + i][y + j] == 0) {
                        map[x +i][y +j] = 5;
                        mines--;
                    }
                    if (map[x + i][y + j] <= 3 && map[x + i][y + j] > 0  ) {
                        map[x + i][y + j] = 4;
                        checked++;
                    }
                }

            }

            //Laufbedingungen erweitern.
            if (checked == 100 || mines == 0) {
                System.out.println("U WON ! ");
                alive = false;
            }
            float prozent = (float) checked / green * 100;

            System.out.printf("\nDu hast %2d/%2d (%3.2f ", checked, green, prozent);
            System.out.print("%) ");
            System.out.printf("gecheckt.\nNoch %3d Mienen im Game.\n\n", mines);
        }


    }//mainEnte
    //used diese methode garnicht!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    static String userInputDo (String userinput, Scanner scan, ArrayList <String> inputs){
        do {

            userinput = scan.next().toUpperCase();
            if (inputs.contains(userinput)) {
                System.out.println("Already Tried this one ");
            }


        }while (!userinput.matches("[A-J][0-9]" ));

        return userinput;
    }



    static String userInput (String userInput, Scanner scan, ArrayList <String>inputs ){

        while (true) {
            userInput = scan.next().toUpperCase();
            if ( userInput.length() == 2 && userInput.charAt(0) >= 'A' && userInput.charAt(0) <= 'J' && userInput.charAt(1) >= '0' && userInput.charAt(1) <= '9' && !inputs.contains(userInput)) {

                inputs.add(userInput);
                break;
            } else {
                System.out.println("Wrong input bro , mochs bessa ");
            }
        }

        return userInput;

    }


    static void printMap(int[][] map, char[] KoorB) {
        System.out.println("\n   0  1  2  3  4  5  6  7  8  9 ");
        for (int i = 0; i < map.length; i++) {
            System.out.print(KoorB[i] + " ");
            for (int j = 0; j < map[i].length; j++) {

                if (map[i][j] == 4) {
                    System.out.print(FG_BRIGHT_GREEN + "[X]" + RESET);
                } else if ( map[i][j] == 5) {
                    System.out.print(FG_BRIGHT_RED + "[X]" + RESET);
                } else {
                    System.out.print("[ ]");
                }
            }
            System.out.println(" " + KoorB[i]);
        }
        System.out.println("   0  1  2  3  4  5  6  7  8  9 \n       Wo ist keine Mine ? ");
    }


    //fillUp + Minencounter + Possible greenspots + print für testmap
    static int fillMap(int[][] map, char[] KoorB, Random randy) {
        int mines = 0;
        System.out.println("\n   0  1  2  3  4  5  6  7  8  9 ");
        for (int i = 0; i < map.length; i++) {
            System.out.print(KoorB[i] + " ");
            for (int j = 0; j < map.length; j++) {
                map[i][j] = randy.nextInt(4);
                System.out.print("[" + map[i][j] + "]");
                if (map[i][j] == 0) {
                    mines++;
                }
            }
            System.out.println();
        }
        System.out.println("A3 + B5 + C8 ");

        return mines;
    }


    //fillUp + Minencounter + Possible greenspots  NO MAP
    static int fillMapNoPrint(int[][] map, Random randy) {
        int mines = 0;
        for (int i = 0; i < map.length; i++) {
            for (int j = 0; j < map.length; j++) {
                map[i][j] = randy.nextInt(4);
                if (map[i][j] == 0) {
                    mines++;
                }
            }
        }
        return mines;
    }




    public static final String FG_BRIGHT_RED = "\u001B[91m"; // Heller Rotton
    public static final String FG_BRIGHT_GREEN = "\u001B[92m"; // Heller Grünton
    public static final String RESET = "\u001B[0m"; // Setzt alle Farben und Formatierungen zurück
    public static final String BOOOM = FG_BRIGHT_RED + """
            U DIED ... 
            ███████████████████████████
            ███████▀▀▀░░░░░░░▀▀▀███████
            ████▀░░░░░░░░░░░░░░░░░▀████
            ███│░░░░░░░░░░░░░░░░░░░│███
            ██▌│░░░░░░░░░░░░░░░░░░░│▐██
            ██░└┐░░░░░░░░░░░░░░░░░┌┘░██
            ██░░└┐░░░░░░░░░░░░░░░┌┘░░██
            ██░░┌┘▄▄▄▄▄░░░░░▄▄▄▄▄└┐░░██
            ██▌░│██████▌░░░▐██████│░▐██
            ███░│▐███▀▀░░▄░░▀▀███▌│░███
            ██▀─┘░░░░░░░▐█▌░░░░░░░└─▀██
            ██▄░░░▄▄▄▓░░▀█▀░░▓▄▄▄░░░▄██
            ████▄─┘██▌░░░░░░░▐██└─▄████
            █████░░▐█─┬┬┬┬┬┬┬─█▌░░█████
            ████▌░░░▀┬┼┼┼┼┼┼┼┬▀░░░▐████
            █████▄░░░└┴┴┴┴┴┴┴┘░░░▄█████
            ███████▄░░░░░░░░░░░▄███████
            ██████████▄▄▄▄▄▄▄██████████
            ███████████████████████████
            ...WANNA TRY AGAIN ?
            """ + RESET;


}//classEnte
