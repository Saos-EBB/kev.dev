// CheerpJ starts a JVM 17, which only finds `public static void main(String[])`.
// MasterMind's main is package-private, and pkemn's Main.java uses the newer
// top-level `void main()` form (Java 21+), so this class is the entry point
// for the browser. The original sources next to it are untouched.
public class Launcher {
    public static void main(String[] args) throws Exception {
        switch (args[0]) {
            case "gameoflife" -> GameOfLife.main(new String[0]);
            case "mastermind" -> MasterMind.main(new String[0]);
            case "rpn" -> TaschenRechnerV42Adv.main(new String[0]);
            case "pokemon" -> new src.Logik.GameEngine().game();
            default -> System.out.println("Unbekanntes Projekt: " + args[0]);
        }
    }
}
