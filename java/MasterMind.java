import java.util.Arrays;
import java.util.Random;
import java.util.Scanner;

public class MasterMind {

    static void main(String[] args) {
        Scanner scan = new Scanner(System.in);
        int[][] map = new int[11][6];

        int round = 0;
        boolean win = false;
        int[] secret = createSecret();

        while (!win && round < 10) {
            int[] guess = readUserInput(scan);
            int[] pins  = evaluate(guess, secret);

            // Runde in Map speichern
            for (int i = 0; i < 4; i++) map[round][i] = guess[i];
            map[round][4] = pins[0];
            map[round][5] = pins[1];

            // Secret in letzter Zeile aufdecken (Gewinn oder letzte Runde)
            if (Arrays.equals(guess, secret) || round == 9) {
                for (int i = 0; i < secret.length; i++) map[10][i] = secret[i];
            }

            print(map, round, guess, secret);

            if (Arrays.equals(guess, secret)) win = true;
            round++;
        }

        System.out.println(win ? "Gewonnen !!" : "Verloren :(\n" + TROLL);
    } // mainEnte


    // 1. Pins berechnen
    static int[] evaluate(int[] guess, int[] secret) {
        int[] guessCopy  = Arrays.copyOf(guess, guess.length);
        int[] secretCopy = Arrays.copyOf(secret, secret.length);
        int black = 0, white = 0;

        // Schwarze Pins: richtige Zahl, richtige Position
        for (int i = 0; i < guess.length; i++) {
            if (guessCopy[i] == secretCopy[i]) {
                black++;
                guessCopy[i]  = 0;
                secretCopy[i] = 0;
            }
        }

        // Weiße Pins: richtige Zahl, falsche Position
        for (int i = 0; i < guess.length; i++) {
            if (guessCopy[i] == 0) continue;
            for (int j = 0; j < guess.length; j++) {
                if (guessCopy[i] == secretCopy[j]) {
                    white++;
                    guessCopy[i]  = 7;
                    secretCopy[j] = 0;
                    break;
                }
            }
        }

        return new int[]{black, white};
    }


    // 2. Zufälliges Secret erstellen
    static int[] createSecret() {
        Random randy = new Random();
        int[] secret = new int[4];
        for (int i = 0; i < secret.length; i++) {
            secret[i] = randy.nextInt(6) + 1;
        }
        return secret;
    }


    // 3. Eingabe lesen und validieren
    static int[] readUserInput(Scanner scan) {
        String userInput;
        while (true) {
            System.out.println("Gib 4 Zahlen (1-6) ein.");
            userInput = scan.next();
            if (userInput.matches("[1-6]{4}")) break;
            System.out.println("Ungültige Eingabe – nur Zahlen zwischen 1 und 6.");
        }
        int[] guess = new int[4];
        for (int i = 0; i < guess.length; i++) {
            guess[i] = userInput.charAt(i) - '0';
        }
        System.out.println();
        return guess;
    }


    // 4. Board ausgeben
    static void print(int[][] map, int round, int[] guess, int[] secret) {
        boolean won  = Arrays.equals(guess, secret);
        boolean lost = round == 9 && !won;

        for (int i = 0; i < map.length; i++) {
            System.out.println("+---+---+---+---+------+");

            // Pin-Anzeige bauen
            StringBuilder pins = new StringBuilder();
            for (int j = 0; j < map[i][4]; j++) pins.append("#");
            for (int j = 0; j < map[i][5]; j++) pins.append("+");

            // Status-Override nur für aktuelle Runde
            String pinsStr;
            if (i == round && won)  pinsStr = color(3) + "WON!" + RESET;
            else if (i == round && lost) pinsStr = color(1) + "LOSE" + RESET;
            else pinsStr = pins.toString();

            // Secret-Zeile (letzte Reihe)
            String g1, g2, g3, g4;
            if (i == map.length - 1 && !won && !lost) {
                g1 = g2 = g3 = g4 = CYAN + "X" + RESET;
            } else {
                g1 = color(map[i][0]) + (map[i][0] == 0 ? " " : map[i][0]) + RESET;
                g2 = color(map[i][1]) + (map[i][1] == 0 ? " " : map[i][1]) + RESET;
                g3 = color(map[i][2]) + (map[i][2] == 0 ? " " : map[i][2]) + RESET;
                g4 = color(map[i][3]) + (map[i][3] == 0 ? " " : map[i][3]) + RESET;
            }

            System.out.printf("| %s | %s | %s | %s | %-4s |%n", g1, g2, g3, g4, pinsStr);
        }
        System.out.println("+---+---+---+---+------+");
    }


    // Farbe je nach Zahl
    static String color(int num) {
        return switch (num) {
            case 1 -> RED;
            case 2 -> YELLOW;
            case 3 -> GREEN;
            case 4 -> BLUE;
            case 5 -> PURPLE;
            case 6 -> CYAN;
            case 7 -> BRIGHT_WHITE;
            default -> RESET;
        };
    }


    // Farb-Konstanten
    static final String RESET        = "\u001B[0m";
    static final String RED          = "\u001B[31m";
    static final String YELLOW       = "\u001B[33m";
    static final String GREEN        = "\u001B[32m";
    static final String BLUE         = "\u001B[34m";
    static final String PURPLE       = "\u001B[35m";
    static final String CYAN         = "\u001B[36m";
    static final String BRIGHT_WHITE = "\u001B[97m";

    static final String TROLL = """
%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%
%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%
%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%
%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%%%%%%%%%%%%%%%%%%%%%%%%%%@@@@@@@@@@@@@@@@@@@@@@@@%
%@@@@@@@@@@@@@@@@@@@@@@#*=-:.............::::::::-------::::....:#@@@@@@@@@@@@@@@@@@@@%
%@@@@@@@@@@@@@@@%+:......:+*****+++++***#%@@@@@@%*++#@@@@@@@@@@@*..+@@@@@@@@@@@@@@@@@@%
%@@@@@@@@@@@@#-..=#%##%%@@@@@@@@@@@@@%#**********#%@@@%**%@@@@@@@@#.:#@@@@@@@@@@@@@@@@%
%@@@@@@@@@%+.:+%@@@@@@@@@@@@@@@@@@@@@@@@@@%####%%%%%%#**%@#*%@@@@@@%=.+@@@@@@@@@@@@@@@%
%@@@@@@@@*:-#@@@@@@@#*#########%@@@@@@@@@@+@@@@@@@%%%#**##*%%%*@@@@@@+.+@@@@@@@@@@@@@@%
%@@@@@@@%--#@@@@@@*#@@@@@@@@@@%@@@@@@@@@@+@@@@@@@@@@@@@@#*##*%@%@@@@@@+.+@@@@@@@@@@@@@%
%@@@@@@@#:=@@@@@@%%@@@@@@@@@@%#@@@@@@@@@@@@@@@%#***##%@@@@%#@%@@@@@@@@@=.+@@@@@@@@@@@@%
%@@@@@@%-:*@@@@@@@@@%####%%@@@@@@@@@@@@@@@%+-.:-:.  ...:=*@@@@@@@@@@@@@%+.=%@@@@@@@@@@%
%@@@@%=.-%@@@@@@@@*:..:.. ..-*%@@@@@@@@@#-.=#@@%+.    .:-::#@@%%@@@@@@@%#=..+%@@@@@@@@%
%@@@*.:#%#*#####%@#=-::::...  .:=*%@@@@@:.*%*-..:-------:::*@@##@@@@@%##***=::*@@@@@@@%
%@@#.=%*###%@@@@@@@@@@@@@@@@*-..=%@@@@@@%=::-*@@@@#:=#@@@@@@@@%*-..:...-*@@%*+:-%@@@@%
%@@*:**@###-....:*@@@@@@@@@@@#:=@@@@@@@@@@@@@@@@@@@%=..:=++-...:*@@@@@@+.-%@%##::#@@@@%
%@@+.*#%#%*#@@@@+.....:@@@@@@+.+@@@@@@@@@@@@@@@@@@@@@@@@%%%@@@@@@%:.#@@@%--%@#%#:=@@@@%
%@@*.**%#@@@@%=*@@@@@@@@@@#:.-#@@@@@@@@@@+--*@*@@@@@@@@@@@@@@@*:.....+@@@*:*@#%@-:%@@@%
%@@#.-*@%*%@@=.-%@@@@@@@*:..*@@@@@@@@@@@@@%#.:@%%##*#%@@@%*-:.-*%@@...:=#+:#%#@#::%@@@%
%@@@+.=#*#@@*. .*@@@%+*##=-.:#@@@@@@*-:..:@%.:@@@@@@%+-:...:#@@@@@-.+@@@#:=@##@-.*@@@@%
%@@@@=.*@@%@=.:..-*@%@@@@@@%=:-+++%@@@@@@%@++%#*=-:.:=+#%+.*@@%+-..:%@@@@#%*##=.+@@@@@%
%@@@@%-:#@@%-..-=...:=*#@@@@@%*+*%@@@@%#++=:....+#%@@@@@*:.-=:.:..=@@@@@@%%#+:-#@@@@@@%
%@@@@@#:*@@%- .#+.#%*. ...:::--::::...:-=+*#%%::@@@@%*+:.  .=#%-.*@@@@@@@@*:.+%@@@@@@@%
%@@@@@#:+@@%- .+:.*@@.:@@@@%+.-#@@@%--%@@@@@@@+.=+-.. .:-:.#@#::%@@@@@@@@*:-#@@@@@@@@@%
%@@@@@#:+@@%-     .--.:+*###+.-####+::*###*=-..  ..:=*@@@+.+=.=@@@@@@@@@+.=@@@@@@@@@@@%
%@@@@@#:+@@%=.       LOSER HAHA            ..:::.+@@@@@@@%-.-#@@@@@@@@@+.=@@@@@@@@@@@@%
%@@@@@#:+@@@=.:. .   .          ........:+#@@@@#.-@@@@@%-.-#@@@@@@@@@@+.=@@@@@@@@@@@@@%
%@@@@@#:+@@@#:--.+=..+-. ......-*#%@@*.*@@@@@@@@+.+@%+..+%@@@@@@@@@@%:.*@@@@@@@@@@@@@@%
%@@@@@#:+@@@@#:.:*@+.+@%.:@@@*.+@@@@@#:*@@@@@@@@#:...-#@@@@@@@@@@@%:.=@@@@@@@@@@@@@@@@%
%@@@@@#.+@@@@@@*:.::..#@=.-@@%--%@@@@*:-@@#*=:...-*%@@@#*#@@#+%@*:.=%@@@@@@@@@@@@@@@@@%
%@@@@@#:*@@@@@@@@@%#*=--:...:....::::..:--=+##%@@@@#*#%@#*#%@#-.:*%@@@@@@@@@@@@@@@@@@@%
%@@@@@*:*@@@@@@%#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%**#%%#*#%%%+-.:+%@@@@@@@@@@@@@@@@@@@@@@%
%@@@@@*:#@@%#@@@%#*#%@@@@@@@@@@@@@@@@@@%###########%%%*=::-*%@@@@@@@@@@@@@@@@@@@@@@@@@%
%@@@@@+:%@@@#*#%@@@@%#%##############**#######%@@%*=::-+#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%
%@@@@@+:*@@@@@@#*#%%%%%%%%%%%########%@@@@@@@%#+:.-+%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%
%@@@@@%-:*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%#+:.-+#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%
%@@@@@@@+.-*@@@@@@@@@@@@@@@@@@@@@%%#+=:...:+%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%
%@@@@@@@@%+:.:+%%@@@@@@@@%%#*=-...::=*%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%
%@@@@@@@@@@@@%*+===------===+#%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%
%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%
%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%
%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%
%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%
%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%
""";

} // classEnte
