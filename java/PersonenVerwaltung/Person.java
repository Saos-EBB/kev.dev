import java.time.LocalDate;

public class Person {
    private String firstName;
    private String lastName;
    private Gender gender; // Enum statt String
    private Address address; // Klasse statt String
    private LocalDate birthDate;

    // Konstruktor: Nur Name
    public Person(String firstName, String lastName) {
        this(firstName, lastName, Gender.OTHER, null, null);
    }

    // Konstruktor: Name, Geschlecht, Datum
    public Person(String firstName, String lastName, Gender gender, LocalDate birthDate) {
        this(firstName, lastName, gender, null, birthDate);
    }

    // Hauptkonstruktor (nutzt Setter für Resilienz)
    public Person(String firstName, String lastName, Gender gender, Address address, LocalDate birthDate) {
        setFirstName(firstName);
        setLastName(lastName);
        this.gender = (gender != null) ? gender : Gender.OTHER;
        this.address = address;
        this.birthDate = birthDate;
    }

    public void setFirstName(String firstName) {
        this.firstName = (firstName != null) ? firstName.trim() : "";
    }

    public void setLastName(String lastName) {
        this.lastName = (lastName != null) ? lastName.trim() : "";
    }

    public String getName() {
        return firstName + " " + lastName;
    }

    @Override
    public String toString() {
        return String.format("%-10s | %s | Geb: %s | Adr: %s",
                gender, getName(),
                (birthDate != null ? birthDate : "k.A."),
                (address != null ? address : "k.A."));
    }
}
