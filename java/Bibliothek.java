import java.util.HashMap;
import java.util.HashSet;
import java.util.Scanner;

public class Bibliothek {
    public static HashMap<String, HashSet<String>> bib = new HashMap<>();
    public static HashMap<String, String> quotes = new HashMap<>();
    public static Scanner scan = new Scanner(System.in);

    static void main(String[] args) {

        preloadAuthors();
        preloadQuotes();
        String choice = "";

        while (!choice.equals("0")) {
            System.out.println("\n--- BIBLIOTHEK MENU ---\n1 = Autoren auflisten\n2 = Bibliografie ansehen\n3 = Zitat aus Titel anzeigen\n4 =  Autor zu Titel finden \n5 = Autor + Bücher hinzufügen\n0 = Exit\n>> ");
            choice = scan.next();
            switch (choice) {
                case "1" -> listAutors();
                case "2" -> wrote();
                case "3" -> quote();
                case "4" -> searchAutor();
                case "5" -> addStuff();
                case "0" -> System.out.println("bye");
                default -> System.out.println("Ungültig.");
            }
        }
    }
//mainEnte!


    // 1.
    private static void listAutors() {
        System.out.println(String.join("\n", bib.keySet()));
    }

    // 2 .
    private static void wrote() {
        System.out.println("Die Bibliografie von welchem Autor willst du dir ansehen?");
        String xxx = scan.next().toUpperCase();
        if (xxx.equals("0")) {
            System.out.println("Dann nicht.. ");
        } else {
            System.out.println(String.join("\n", bib.get(xxx)));
        }
    }
    // 3.
    private static void quote() {
        System.out.println("In welches Buch willst du reinschaun?");
        scan.nextLine();
        String title = scan.nextLine();
        if (!quotes.containsKey(title)) {
            System.out.println("Kein Zitat für diesen Titel gefunden.");
            return;
        }
        System.out.println(quotes.get(title));
    }
    // 4.
    private static void searchAutor() {
        System.out.println("Welchen Titel suchst du?");
        scan.nextLine();
        String title = scan.nextLine();
        for (String author : bib.keySet()) {
            if (bib.get(author).contains(title)) {
                System.out.println("Autor: " + author);
                return;
            }
        }
        System.out.println("Kein Autor für diesen Titel gefunden.");
    }

    // 5. // Fix zu (autor , titel)
    private static void addStuff() {
        String xxx = "";
        scan.nextLine(); // Rest nach vorherigem scan.next() entfernen
        while (!xxx.equals("0")) {
            System.out.println("Autor eingeben (0 = Ende):");
            xxx = scan.nextLine();

            String authorKey = xxx.toUpperCase();
            bib.putIfAbsent(authorKey, new HashSet<>());

            while (0 != 1 - 1 + 1) {
                System.out.println("Titel eingeben für \"" + xxx + "\" (0 = fertig mit diesem Autor):");
                xxx = scan.nextLine();
                if (xxx.equals("0")) break;

                if (!bib.get(authorKey).contains(xxx)) {
                    bib.get(authorKey).add(xxx);
                    System.out.println("Titel hinzugefügt: " + xxx);
                } else {
                    System.out.println("Titel existiert bereits: " + xxx);
                }
            }
        }
    }


    //bissi Overkill mit büchern und zitaten
    private static void preloadAuthors() {
        HashSet<String> hesse = new HashSet<>();
        hesse.add("Der Steppenwolf");
        hesse.add("Siddhartha");
        hesse.add("Demian");
        hesse.add("Narziss und Goldmund");
        hesse.add("Unterm Rad");
        hesse.add("Das Glasperlenspiel");
        bib.put("HESSE", hesse);

        HashSet<String> nietzsche = new HashSet<>();
        nietzsche.add("Also sprach Zarathustra");
        nietzsche.add("Jenseits von Gut und Böse");
        nietzsche.add("Der Antichrist");
        nietzsche.add("Menschliches, Allzumenschliches");
        nietzsche.add("Die fröhliche Wissenschaft");
        nietzsche.add("Götzen-Dämmerung");
        bib.put("NIETZSCHE", nietzsche);

        HashSet<String> kafka = new HashSet<>();
        kafka.add("Die Verwandlung");
        kafka.add("Der Prozess");
        kafka.add("Das Schloss");
        kafka.add("Amerika");
        kafka.add("Brief an den Vater");
        kafka.add("In der Strafkolonie");
        bib.put("KAFKA", kafka);

        HashSet<String> goethe = new HashSet<>();
        goethe.add("Faust I");
        goethe.add("Faust II");
        goethe.add("Die Leiden des jungen Werther");
        goethe.add("Iphigenie auf Tauris");
        goethe.add("Wilhelm Meisters Lehrjahre");
        goethe.add("Egmont");
        bib.put("GOETHE", goethe);

        HashSet<String> schiller = new HashSet<>();
        schiller.add("Die Räuber");
        schiller.add("Wilhelm Tell");
        schiller.add("Kabale und Liebe");
        schiller.add("Maria Stuart");
        schiller.add("Wallenstein");
        schiller.add("Don Carlos");
        bib.put("SCHILLER", schiller);

        HashSet<String> tolstoi = new HashSet<>();
        tolstoi.add("Krieg und Frieden");
        tolstoi.add("Anna Karenina");
        tolstoi.add("Auferstehung");
        tolstoi.add("Der Tod des Iwan Iljitsch");
        tolstoi.add("Kindheit");
        bib.put("TOLSTOI", tolstoi);

        HashSet<String> dostojewski = new HashSet<>();
        dostojewski.add("Schuld und Sühne");
        dostojewski.add("Der Idiot");
        dostojewski.add("Die Brüder Karamasow");
        dostojewski.add("Der Spieler");
        dostojewski.add("Dämonen");
        bib.put("DOSTOJEWSKI", dostojewski);

        HashSet<String> shakespeare = new HashSet<>();
        shakespeare.add("Hamlet");
        shakespeare.add("Macbeth");
        shakespeare.add("Romeo und Julia");
        shakespeare.add("Othello");
        shakespeare.add("König Lear");
        shakespeare.add("Ein Sommernachtstraum");
        bib.put("SHAKESPEARE", shakespeare);

        HashSet<String> poe = new HashSet<>();
        poe.add("The Raven");
        poe.add("The Tell-Tale Heart");
        poe.add("The Fall of the House of Usher");
        poe.add("The Black Cat");
        poe.add("The Masque of the Red Death");
        poe.add("The Pit and the Pendulum");
        bib.put("POE", poe);

        HashSet<String> orwell = new HashSet<>();
        orwell.add("1984");
        orwell.add("Animal Farm");
        orwell.add("Homage to Catalonia");
        orwell.add("Down and Out in Paris and London");
        orwell.add("The Road to Wigan Pier");
        bib.put("ORWELL", orwell);

        HashSet<String> king = new HashSet<>();
        king.add("The Shining");
        king.add("IT");
        king.add("Carrie");
        king.add("Misery");
        king.add("The Green Mile");
        king.add("Doctor Sleep");
        king.add("Pet Sematary");
        king.add("The Stand");
        king.add("Cujo");
        king.add("Salem's Lot");
        king.add("The Dark Tower I – The Gunslinger");
        king.add("The Dark Tower II – The Drawing of the Three");
        king.add("The Dark Tower III – The Waste Lands");
        king.add("The Dark Tower IV – Wizard and Glass");
        bib.put("STEPHEN KING", king);
    }

    private static void preloadQuotes() {
        // Hesse
        quotes.put("Der Steppenwolf", "„Ich bin nicht von deiner Welt.“");
        quotes.put("Siddhartha", "„Wissen kann man mitteilen, Weisheit nicht.“");
        quotes.put("Demian", "„Der Vogel kämpft sich aus dem Ei.“");
        quotes.put("Narziss und Goldmund", "„Jeder Mensch hat eine Aufgabe.“");
        quotes.put("Unterm Rad", "„Die Welt will dich brechen.“");
        quotes.put("Das Glasperlenspiel", "„Spieler sind Schüler im Reich des Geistes.“");
        // Nietzsche
        quotes.put("Also sprach Zarathustra", "„Werde, der du bist.“");
        quotes.put("Jenseits von Gut und Böse", "„Es gibt keine Fakten, nur Interpretationen.“");
        quotes.put("Der Antichrist", "„Was fällt, das soll man auch noch stoßen.“");
        quotes.put("Menschliches, Allzumenschliches", "„Der Mensch ist etwas, das überwunden werden muss.“");
        quotes.put("Die fröhliche Wissenschaft", "„Gott ist tot.“");
        quotes.put("Götzen-Dämmerung", "„Ohne Musik wäre das Leben ein Irrtum.“");
        // Kafka
        quotes.put("Die Verwandlung", "„Als Gregor Samsa eines Morgens aus unruhigen Träumen erwachte…“");
        quotes.put("Der Prozess", "„Jemand musste Josef K. verleumdet haben…“");
        quotes.put("Das Schloss", "„Es war spät als K. das Dorf erreichte.“");
        quotes.put("Amerika", "„Karl Roßmann staunte über die Größe.“");
        quotes.put("Brief an den Vater", "„Du hast mich eingeschüchtert durch dein bloßes Dasein.“");
        quotes.put("In der Strafkolonie", "„Es ist ein eigentümlicher Apparat.“");
        // Goethe
        quotes.put("Faust I", "„Zwei Seelen wohnen, ach! in meiner Brust.“");
        quotes.put("Faust II", "„Das Ewig-Weibliche zieht uns hinan.“");
        quotes.put("Die Leiden des jungen Werther", "„Die Menschen glauben, einander zu verstehen…“");
        quotes.put("Iphigenie auf Tauris", "„Der Menschen Wohl ist Gottes Wille.“");
        quotes.put("Wilhelm Meisters Lehrjahre", "„Nur der verdient sich Freiheit wie das Leben…“");
        quotes.put("Egmont", "„Freiheit ist das höchste Gut.“");
        // Schiller
        quotes.put("Die Räuber", "„In dem Menschen steckt ein Abgrund.“");
        quotes.put("Wilhelm Tell", "„Durch diese hohle Gasse muss er kommen.“");
        quotes.put("Kabale und Liebe", "„Die Welt ist ein großes Hospital.“");
        quotes.put("Maria Stuart", "„Der Mensch ist frei geschaffen, ist frei.“");
        quotes.put("Wallenstein", "„Nimmer wird sich das Herz dem Herzen irren.“");
        quotes.put("Don Carlos", "„Geben Sie Gedankenfreiheit, Sire!“");
        // Tolstoi
        quotes.put("Krieg und Frieden", "„Der ganze Mensch besteht aus Kopf, Bauch und Herz.“");
        quotes.put("Anna Karenina", "„Alle glücklichen Familien gleichen einander…“");
        quotes.put("Auferstehung", "„Vergebung ist der Weg zur Wahrheit.“");
        quotes.put("Der Tod des Iwan Iljitsch", "„So einfach und natürlich – und doch so schrecklich.“");
        quotes.put("Kindheit", "„Die Kindheit ist die Quelle aller Erinnerungen.“");
        // Dostojewski
        quotes.put("Schuld und Sühne", "„Der Mensch ist unglücklich, weil er nicht weiß, dass er glücklich ist.“");
        quotes.put("Der Idiot", "„Schönheit wird die Welt retten.“");
        quotes.put("Die Brüder Karamasow", "„Jeder ist für alle verantwortlich.“");
        quotes.put("Der Spieler", "„Der Mensch liebt das Risiko mehr als die Sicherheit.“");
        quotes.put("Dämonen", "„Wir sind alle krank am Geist.“");
        // Shakespeare
        quotes.put("Hamlet", "„Sein oder Nichtsein – das ist hier die Frage.“");
        quotes.put("Macbeth", "„Life’s but a walking shadow.“");
        quotes.put("Romeo und Julia", "„O Romeo, Romeo! Warum bist du Romeo?“");
        quotes.put("Othello", "„Ich bin nicht, was ich bin.“");
        quotes.put("König Lear", "„Nichts wird aus nichts.“");
        quotes.put("Ein Sommernachtstraum", "„Der Liebe Augen sehen nicht mit den Augen.“");
        //Orwell
        quotes.put("1984", "„Big Brother is watching you.“");
        quotes.put("Animal Farm", "„All animals are equal, but some animals are more equal than others.“");
        quotes.put("Homage to Catalonia", "„The issue involved was the future of humanity.“");
        quotes.put("Down and Out in Paris and London", "„Poverty frees them from ordinary standards of behaviour.“");
        quotes.put("The Road to Wigan Pier", "„The working class are not revolting because they are hungry.“");


        // Poe
        quotes.put("The Raven", "„Quoth the Raven: Nevermore.“");
        quotes.put("The Tell-Tale Heart", "„I heard all things in the heaven and in the earth.“");
        quotes.put("The Fall of the House of Usher", "„A sense of insufferable gloom pervaded my spirit.“");
        quotes.put("The Black Cat", "„Yet, mad am I not…“");
        quotes.put("The Masque of the Red Death", "„And Darkness and Decay held illimitable dominion…“");
        quotes.put("The Pit and the Pendulum", "„The pit whose horror had been its roof and doom.“");
        // Stephen King
        quotes.put("The Shining", "„All work and no play makes Jack a dull boy.“");
        quotes.put("IT", "„We all float down here.“");
        quotes.put("Carrie", "„They're all gonna laugh at you!“");
        quotes.put("Misery", "„I'm your number one fan.“");
        quotes.put("The Green Mile", "„I'm tired, boss.“");
        quotes.put("Doctor Sleep", "„You can't shine if you don't burn.“");
        quotes.put("Pet Sematary", "„Sometimes dead is better.“");
        quotes.put("The Stand", "„The place where you made your stand never mattered.“");
        quotes.put("Cujo", "„Nothing wrong with a little fear.“");
        quotes.put("Salem's Lot", "„The town knew darkness.“");
        quotes.put("The Dark Tower I – The Gunslinger", "„The man in black fled across the desert…“");
        quotes.put("The Dark Tower II – The Drawing of the Three", "„This is your second chance.“");
        quotes.put("The Dark Tower III – The Waste Lands", "„Go then. There are other worlds than these.“");
        quotes.put("The Dark Tower IV – Wizard and Glass", "„Death, but not for you, gunslinger.“");
    }

}//Quack!
