import java.util.Scanner;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;

public class Main {
    private static Scanner sc = new Scanner(System.in);
    private static PM_Appl app = new PM_Appl();

    public static void main(String[] args) {
        while (true) {
            System.out.println("\n--- HAUPTMENÜ ---");
            System.out.println("[1] Standort anlegen");
            System.out.println("[2] Person hinzufügen");
            System.out.println("[3] Daten anzeigen");
            System.out.println("[4] Beenden");
            System.out.print("Wahl: ");

            String wahl = sc.nextLine().trim();
            if (wahl.equals("4")) break;

            switch (wahl) {
                case "1" -> addLocation();
                case "2" -> addPerson();
                case "3" -> showData();
                default -> System.out.println("Ungültige Wahl.");
            }
        }
    }



    private static void addLocation() {
        System.out.print("Name des neuen Standorts (oder 'b'): ");
        String name = sc.nextLine();
        if (name.equalsIgnoreCase("b")) return;

        if (app.add(name)) System.out.println("Standort angelegt.");
        else System.out.println("Fehler: Name existiert bereits oder ist leer.");
    }

    private static void addPerson() {
        System.out.print("Ziel-Standort (oder 'b'): ");
        String ziel = sc.nextLine();
        if (ziel.equalsIgnoreCase("b")) return;

        PM target = app.get(ziel);
        if (target == null) {
            System.out.println("Standort nicht gefunden.");
            return;
        }

        // Basisdaten
        System.out.print("Vorname: "); String vn = sc.nextLine();
        System.out.print("Nachname: "); String nn = sc.nextLine();

        // Geschlecht
        System.out.print("Geschlecht (M=MAN, W=WOMAN, O=OTHER): ");
        String gIn = sc.nextLine().toUpperCase();
        Gender gender = switch (gIn) {
            case "M" -> Gender.MAN;
            case "W" -> Gender.WOMAN;
            default -> Gender.OTHER;
        };

        // Adresse
        System.out.print("PLZ: "); String plz = sc.nextLine();
        System.out.print("Stadt: "); String stadt = sc.nextLine();
        System.out.print("Straße: "); String str = sc.nextLine();
        System.out.print("Hausnummer: "); String nr = sc.nextLine();
        Address addr = new Address(plz, stadt, str, nr);

        // Geburtsdatum
        System.out.print("Geburtsdatum (JJJJ-MM-TT): ");
        String dateStr = sc.nextLine();
        LocalDate bDate = null;
        try {
            if (!dateStr.isBlank()) bDate = LocalDate.parse(dateStr);
        } catch (DateTimeParseException e) {
            System.out.println("Falsches Datumsformat. Wird als 'null' gesetzt.");
        }

        target.createPerson(vn, nn, gender, addr, bDate);
        System.out.println("Person erfolgreich hinzugefügt.");
    }

    private static void showData() {
        System.out.println("Verfügbar: " + app);
        System.out.print("Welcher Standort? (oder 'b'): ");
        String ort = sc.nextLine();
        if (ort.equalsIgnoreCase("b")) return;

        PM res = app.get(ort);
        System.out.println(res != null ? res : "Nicht gefunden.");
    }
}