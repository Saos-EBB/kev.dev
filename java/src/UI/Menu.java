package src.UI;

import src.Persistierung.*;

import static src.UI.Art.*;

import java.util.Random;
import java.util.Scanner;


public class Menu {
    Scanner scan = new Scanner(System.in);
    Art c = new Art();

    //greeting , asking for name and returning it
    public String greeting() {
        System.out.println(c.color(6) + intro + RESET);
        System.out.println("Whats your name ?");
        String UserName = inputToString();
        System.out.println("Hello " + UserName + " !  \nDo you know the rules?  (true/false)");
        boolean knowRules = inputToBoolean();
        if (!knowRules) printRules();

        return UserName;
    }


    //menu choice
    public int MenuChoice() {
        int x = inputToIntOnetoThree();
        switch (x) {
            case 1 -> {
                return 1;
            }
            case 2 -> {
                return 2;
            }
            case 3 -> {
                return 3;
            }
        }
        return 0;
    }

    public int pokeChoice(Menu menu, Scanner sc, PokemonData pokedex) {
        switch (menu.MenuChoice()) {
            case 1 -> {
                System.out.print("Type in idx : ");
                return sc.nextInt();
            }
            case 2 -> {
                System.out.print("Type in Name : ");
                String name = sc.next().toLowerCase();
                return Integer.parseInt(pokedex.get(name));
            }
            case 3 -> {
                return rollIdx();
            }

            default -> System.out.print("Invalid Input");


        }
        return 0;
    }

    public static int rollIdx() {
        Random randy = new Random();
        return randy.nextInt(1, 17);
    }

    public int inputToIntOnetoThree() {
        String input;
        do {
            input = scan.next();
            if (!input.matches("[1-3]")) System.out.println("Wrong input.");
        } while (!input.matches("[1-3]"));

        return Integer.parseInt(input);
    }

    public int inputToIntOnetoTwo() {
        String input;
        do {
            input = scan.next();
            if (!input.matches("[1-2]")) System.out.println("Wrong input.");
        } while (!input.matches("[1-2]"));

        return Integer.parseInt(input);
    }

    public String inputToString() {
        while (true) {
            String input = scan.nextLine();

            // Prüft: Zeichenbereich Space bis ü UND Länge 3 bis 30
            if (input.matches("[ -ü]{3,30}")) {
                return input;
            }

            System.out.println("Fehler: Eingabe muss 3-30 Zeichen lang sein (Bereich '!' bis 'ü').");
        }
    }

    public boolean inputToBoolean() {
        while (true) {
            String input = scan.nextLine().trim().toLowerCase();

            if (input.equals("true")) {
                return true;
            }
            if (input.equals("false")) {
                return false;
            }

            System.out.println("Fehler: Nur 'true' oder 'false' erlaubt.");
        }
    }


}
