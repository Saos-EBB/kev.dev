import java.util.ArrayList;
import java.util.Random;

public class GameOfLife {

    // Stellschrauben
    static final int    ROWS             = 30;
    static final int    COLS             = 60;
    static final int    MAX_GENERATIONS  = 1000;
    static final double ALIVE_PROBABILITY = 0.09;

    // Farben
    static final String GREEN = "\u001B[32m";
    static final String RESET = "\u001B[0m";


    public static void main(String[] args) {
        ArrayList<boolean[][]> history = new ArrayList<>();
        boolean[][] currentMap = createRandomMap(ROWS, COLS, ALIVE_PROBABILITY);

        int generation;
        for (generation = 0; generation < MAX_GENERATIONS; generation++) {

            history.add(currentMap);
            printMap(currentMap);

            boolean[][] nextMap = nextGen(currentMap);

            int match = isRepeating(history, nextMap);
            if (match != -1) {
                System.out.println("Repeating pattern found — matches generation: " + match);
                break;
            }

            currentMap = nextMap;

            try {
                Thread.sleep(200);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }

        if (generation == MAX_GENERATIONS) {
            System.out.println("No repeating pattern in " + MAX_GENERATIONS + " generations.");
        }
    }


    // 1. Zufällige Startkarte erzeugen
    static boolean[][] createRandomMap(int rows, int cols, double aliveProbability) {
        boolean[][] map = new boolean[rows][cols];
        Random rand = new Random();
        for (int i = 0; i < rows; i++) {
            for (int j = 0; j < cols; j++) {
                map[i][j] = rand.nextDouble() < aliveProbability;
            }
        }
        return map;
    }


    // 2. Karte ausgeben
    static void printMap(boolean[][] map) {
        System.out.println("\n".repeat(40));
        System.out.print("┌");
        for (int i = 0; i < map[0].length; i++) System.out.print("─");
        System.out.println("┐");

        for (boolean[] row : map) {
            System.out.print("│");
            for (boolean cell : row) {
                System.out.print(cell ? GREEN + "█" + RESET : " ");
            }
            System.out.println("│");
        }

        System.out.print("└");
        for (int i = 0; i < map[0].length; i++) System.out.print("─");
        System.out.println("┘");
    }


    // 3. Nächste Generation berechnen
    static boolean[][] nextGen(boolean[][] map) {
        boolean[][] newMap = new boolean[map.length][map[0].length];
        for (int i = 0; i < map.length; i++) {
            for (int j = 0; j < map[0].length; j++) {
                int neighbors = countNeighbors(map, i, j);
                newMap[i][j] = rules(map[i][j], neighbors);
            }
        }
        return newMap;
    }


    // 3a. Nachbarn zählen mit Wrap-around
    static int countNeighbors(boolean[][] map, int x, int y) {
        int count = 0, rows = map.length, cols = map[0].length;
        for (int i = -1; i <= 1; i++) {
            for (int j = -1; j <= 1; j++) {
                if (i == 0 && j == 0) continue;
                // (index + size) % size verhindert out-of-bounds an den Rändern
                int nx = (x + i + rows) % rows;
                int ny = (y + j + cols) % cols;
                if (map[nx][ny]) count++;
            }
        }
        return count;
    }


    // 3b. Conway-Regeln
    static boolean rules(boolean alive, int count) {
        return count == 3 || (alive && count == 2);
    }


    // 4. Zykluserkennung — prüft ob nextMap schon in der History vorkommt
    static int isRepeating(ArrayList<boolean[][]> history, boolean[][] current) {
        for (int gen = 0; gen < history.size(); gen++) {
            boolean[][] oldMap = history.get(gen);
            boolean equal = true;
            for (int i = 0; i < current.length && equal; i++) {
                for (int j = 0; j < current[i].length; j++) {
                    if (current[i][j] != oldMap[i][j]) {
                        equal = false;
                        break;
                    }
                }
            }
            if (equal) return gen;
        }
        return -1;
    }

}
