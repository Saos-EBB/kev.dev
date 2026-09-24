import java.util.ArrayList;
import java.util.Random;
import java.util.Scanner;

public class ZahlenRatenV2 {

    //absolutes hass beispiel  - bitte kein zahlenratenV3 !
    public static void main(String[] args) {
        Random randy = new Random();
        Scanner scan = new Scanner(System.in);

        ArrayList<Integer> history = new ArrayList<>();
        ArrayList<Integer> possibleNumbers = new ArrayList<>();
        for (int i = 0; i <= 100; i++) {
            possibleNumbers.add(i);
        }

        int lastIn = 0, dice;
        boolean coin;

        System.out.println("Yo, \nRoboter gegen Fleisch, wer wird gewinnen ? ");
        dice = randy.nextInt(101);
        System.out.println("Zahl generiert!");
        coin = randy.nextBoolean();
        System.out.println(coin ? "Robo beginnt!" : "Mensch beginnt!");

        boolean found = false;

        while (!found) {
            if (coin) { // ROBO
                if (possibleNumbers.isEmpty()) {
                    System.out.println("Fehler: Der Roboter hat keine Zahlen mehr zum Raten!");
                    break;
                }
                //goldene mitte
                int min = possibleNumbers.get(0);
                int max = possibleNumbers.get(possibleNumbers.size() - 1);
                int idealMid = (min + max) / 2;
                int robotip = -1; // Markierung für Fehler
                // find next middle
                for(int p : possibleNumbers) {
                    if (p >= idealMid) {
                        robotip = p;
                        break;
                    }
                }
                // Fallback
                if (robotip == -1) {
                    robotip = possibleNumbers.get(possibleNumbers.size() - 1);
                }
                lastIn = robotip;
                System.out.println("Robo rät: " + FG_YELLOW + lastIn + RESET);
                coin = false;

            } else {
                // fleisch
                System.out.print("Dein Tipp: ");
                lastIn = scan.nextInt();
                coin = true;
            }
            history.add(lastIn);
            int gap = (lastIn > dice) ? (lastIn - dice) : (dice - lastIn);
            int minRadius = 0;
            int maxRadius = 100;
            //Feedback
            if (gap == 0) {
                System.out.println(FG_GREEN + (coin ? "HUMAN WON!" : FG_RED +"ROBOT WON, HUMANITY DESTROYED! ") + RESET);
                found = true;
                break;
            } else if (gap <= 3) {
                System.out.println("Fast da / 1-3 Felder entfernt.");
                minRadius = 1;
                maxRadius = 3;
            } else if (gap <= 10) {
                System.out.println("Relativ Nahe / 4-10 Felder entfernt.");
                minRadius = 4;
                maxRadius = 10;
            } else if (gap <= 20) {
                System.out.println("Nicht ganz so weit weg / 11-20 Felder entfernt.");
                minRadius = 11;
                maxRadius = 20;
            } else {
                System.out.println("Weit weg / >20 Felder entfernt.");
                minRadius = 21;
                maxRadius = 100;
            }

            // 1. entfernen: ZU NAH
            if (minRadius > 0) {
                int lowerRemoveA = lastIn - (minRadius - 1);  // wenn minAlloed x dann alles unter x weg
                int upperRemoveA = lastIn + (minRadius - 1);
                // no out of bound
                if (lowerRemoveA < 0) {
                    lowerRemoveA = 0;
                }
                if (upperRemoveA > 100) {
                    upperRemoveA = 100;
                }
                removeRange(possibleNumbers, lowerRemoveA, upperRemoveA);
            }

            // 2. entfernen: ZU WEIT WEG
            int upperRemoveB = lastIn - (maxRadius + 1);
            if (upperRemoveB >= 0) {
                removeRange(possibleNumbers, 0, upperRemoveB);
            }
            int lowerRemoveB = lastIn + (maxRadius + 1);
            if (lowerRemoveB <= 100) {
                removeRange(possibleNumbers, lowerRemoveB, 100);
            }


            print(possibleNumbers);
            System.out.println("Bisherige Versuche: " + FG_YELLOW + history + RESET);
        }
    }
    // lower, upper aus Liste entf.
    static void removeRange(ArrayList<Integer> al, int lower, int upper) {
        for (int i = lower; i <= upper; i++) {
            al.remove(Integer.valueOf(i));
        }
    }
    // print
    static void print(ArrayList<Integer> al) {
        for (int i = 0; i <= 100; i++) {
            if (al.contains(i)) {
                System.out.print(".");
            } else {
                System.out.print("*");
            }
        }
        System.out.println("\n");
    }
    public static final String RESET = "\u001B[0m";
    public static final String FG_RED = "\u001B[31m";
    public static final String FG_GREEN = "\u001B[32m";
    public static final String FG_YELLOW = "\u001B[33m";
    public static final String Robo = FG_RED + """
:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
::::::::::::::::::::::::::::::::::::::::::::::::::::::....:::::::::::::::::::::::::::::::
:::::::::::::::::::::::::::::::::::::::::::::::::.:+*=+**++**=.....::::::::::::::::::::::
:::::::::::::::::::::::::::::::::::::::::::::::.++=*-.:----::+=*=.:-=:.::::::::::::::::::
:::::::::::::::::::::::::::::::::::::..:=+%@@+@@#+%*-.::==-==-.***=.=-::.::::::::::::::::
:::::::::::::::::::::::::::::::::.-#@@#*@@+#%=%#+@@#*@@@%+.====.**==.-===.:::::::::::::::
::::::::::::::::::::::::::::::.-%@@@@@@#*@@@@+@@@@%*@@@@@@+-:::::***+.====.::::::::::::::
::::::::::::::::::::::::::.::+*=.-@@@@@%*@@@@+@@@@##@@@@@@=-===--****:--:-:::::::::::::::
::::::::::::::::::::::::.+***-+*-:@@@@@%+@@@@+@@@@#%@@@@@#.====-=****--===:::::::::::::::
::::::::::::::::::::::.-=****+==.-@@@@@%+@@@@+@@@@#%@@@@@:-=:--:=+***:-===.::::::::::::::
::::::::::::::::::::::-**=::-====.#@@@@%+@@@@+@@@@#%@@@@@#..==-=**+==:===::.:::::::::::::
:::::::::::::::::::::.+.:===-====.#@@@@%+@@@@+@@@@#%@@@@@@@#-:..=**+.=:--:=::::::::::::::
:::::::::::::::::::::.:=====--:--=#@@@@%+@@@@+@@@@#%@@@@*#@@@@@+=...:===:===.::::::::::::
::::::::::::::::::::.=--==-.%@@%%#*@@@@%+@@@@+@@@@##@@@@%#%%@@@+@##%:.::-:=-:::::::::::::
:::::::::::::::::::.===-.-%=@%=*=%@@@@@+%@@@@+@@@@@=%@@@@%-*+#@+@%+@@.-===-.:::::::::::::
::::::::::::::::::.===-.+#@=%%-=@@@@@=#@@@@#+*-@@@@@@-@@@@@+-#@+@%=@@-.==::::::::::::::::
::::::::::::::::::.---.%*%@+%@@@@@@%=@@@@@%-****@@@@@@*#@@@@@@@+@%=@@@-.==-::::::::::::::
::::::::::::::::::.==.*@*%@+%@@@@@@%%@@@@@%-***+@@@@@@@*@@@@@@@+@@=@@@@:--:::::::::::::::
::::::::::::::::::.==.%%+@@-@@@@@@@%%@@@@@@*+*-%@@@@@@@*@@@@@@@+@@#%@@@:-.:::::::::::::::
::::::::::::::::::.=-.=#@@%-@@@@@@@%%@@@@@@@@=@@@@@@@@@*@@@@@@@*#@@%#=*::::::::::::::::::
:::::::::::::::::::.-.%@@%+@@@@@@@@%*@@@@@@@@=@@@@@@@@#*@@@@@@@@+%%@%%%.:::::::::::::::::
:::::::::::::::::::::-.%%+@@#----#@%*#+=*%@@@=@@@@#=+###@@@@@@@@@*%%-#:::::::::::::::::::
::::::::::::::::::.:=::*@*#-......-.+*==*%-@@=@@+%+=+%@%=:+=...#@+@%#@:::::::::::::::::::
::::::::::::::::.-==-:=:-:--::.........-#+#@@=@@+##@*:--*%%#=...-*@%%@:::::::::::::::::::
:::::::::::::::.=-===-.-=====-=--........+#%*:+%+#*...:##:-=-%:..-@#@@-::::-:::::::::::::
:::::::::::-:::--:==-:==--==-:::++=::....+#-@=@=+#+...#%+---%#+..=@*%%*::::-:-:-:::::::::
::::::::::::-:===-=::-=--=::=*+==**=-*=.:%-#+.:%+#-:.:.###%%:*::-@%-#@%::::-:::::::::::::
::::::::::-::.-==-=.-:=--:++=*+=++*==+:+*=#*:..+@#+*:...:+*+:.:*%##+%@#::::::::::::::::::
::::::::::--::-==---=-=::**+==+=:*=::#%**%%:....%%+@@*:....-#@%%#-%*#%*-:::--:-::::::::::
::::::::::-:::-:::.-===:++++*+.*%%@@%=*%#=*.....=+##+=#@@%#%#*=#%@@#=*:::--::---:::::::::
::::::::::::::.-==:--:.=++***:%#+%#++#=%@%...:...#@@*%+*%%==@@#=:...:::::::::::::::::::::
:::::::::::::::.:--.=--***+=.-:-+=@@@-@@@@@@@=%@@@@@@=%@@#+*:----.:::::::::::::::::::::::
:::::::::::::::::::...+****-::*+-@@@%#@@@+@@@+%@@#%@@@+@@@+*%:-%-.:::::::::::::::::::::::
:::::::::::::::::::::.****+.-:#*+%@@*%@@@+@@@+%@@##@@@+@@@-%%:=-:::::::::::::::::::::::::
:::::::::::::::::::::.+-===.:-*++@@@#%@@@#@@@+%@@%%@@@*@@%-#@::::::::::::::::::::::::::::
:::::::::::::::::::::.+***=.:::%*#==-%@@@@@@@+%@@@@@@@-*+=+@::.::::::::::::::::::::::::::
:::::::::::::::::::::.=***+.=.:#+##*%*+*++#*+%+*#++*%=@=%=*%:.:::::::::::::::::::::::::::
::::::::::::::::::::::.+***--:..-+*%#*#@**@@@:#@@%=@@-@=%--:.:-.:::::::::::::::::::::::::
:::::::::::::::::::::::.+**+-:::::-::-*@#-@@@-%@@#*@@--::-:::-:::::::::::::::::::::::::::
:::::::::::::::::::::::.:.:=:-::-:=:---:-:---.---:---=-:-:-:--.::::::::::::::::::::::::::
:::::::::::::::::::::::.:.:::..:-:=:-##:---==.-==:-:+%-:--:::::::::::::::::::::::::::::::
::::::::::::::::::::::::.-.::.::.::::%+===:=====--==:@-::::.:::::::::::::::::::::::::::::
:::::::::::::::::::::::::.-.:.::.:.-=::==:--====-:==::=-.:.::-:::::::::::::::::::::::::::
::::::::::::::::::::::::::.::.:.::::.:--=.:=*%#-:-:=-:.:::.::=:::::::::::::::::::::::::::
::::::::::::::::::::::::::::.::.::::::...:=-@@@==:...::::.-:.-:::::::::::::::::::::::::::
::::::::::::::::::::::::::::::..::-:.....::......:::::::::::-.:::::::::::::::::::::::::::
:::::::::::::::::::::::::::::::-:::.:::::::::::::::::::::::.-::::::::::::::::::::::::::::
::::::::::::::::::::::::::::::::-::-.::::::::::::::::::::::-:::::::::Roboter ::::::::::::
:::::::::::::::::::::::::::::::::-::...::::::::::::::.::::-:::::::::::::::WON ! ::::::
::::::::::::::::::::::::::::::::::-:::::.::::::::::.:::::-:::::::::::::::::::::::::::::::
:::::::::::::::::::::::::::::::::::::::::::-::::-:::::.-:::::::::::::Human :::::::::
:::::::::::::::::::::::::::::::::::::::::::::::::::::-:::::::::::::::::::Destroyed!::::::
::::::::::::::::::::::::::::::::::::::::::-:...::-:::::::::::::::::::::::::::::::::::::::
""" + RESET;

}