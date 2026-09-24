import java.util.ArrayList;
import java.util.List;
import java.time.LocalDate;

    public class PM {

        private List<Person> persons = new ArrayList<>();
        private String name;

        public PM(String name) {
            this.name = (name != null) ? name.trim() : "Unbenannt";
        }

        // Erstellung nur mit Namen
        public void createPerson(String fName, String lName) {
            persons.add(new Person(fName, lName));
        }

        // Erstellung mit Name, Geschlecht, Datum
        public void createPerson(String fName, String lName, Gender gender, LocalDate birthDate) {
            persons.add(new Person(fName, lName, gender, birthDate));
        }

        // Erstellung mit allen Daten
        public void createPerson(String fName, String lName, Gender gender, Address addr, LocalDate birthDate) {
            persons.add(new Person(fName, lName, gender, addr, birthDate));
        }

        // Löschen (Resilienz: null-Check & Case Insensitive)
        public void removePerson(String lName) {
            if (lName != null) {
                String search = lName.trim().toLowerCase();
                persons.removeIf(p -> p.getName().toLowerCase().contains(search));
            }
        }

        @Override
        public String toString() {
            StringBuilder sb = new StringBuilder("Verwaltung: " + name + "\n");
            for (Person p : persons) {
                sb.append(" - ").append(p).append("\n");
            }
            return sb.toString();
        }
    }

