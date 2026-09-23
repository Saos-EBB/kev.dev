package src.Persistierung;

public class Attack {
    private int id;
    private String name, effect, type, kind;
    private int power, accuracy, pp;

    // Konstruktor
    public Attack(int id, String name, String effect, String type, String kind, int power, int accuracy, int pp) {
        this.id = id;
        this.name = name;
        this.effect = effect;
        this.type = type;
        this.kind = kind;
        this.power = power;
        this.accuracy = accuracy;
        this.pp = pp;
    }

    public static Attack read(String csvLine) {
        String[] parts = csvLine.split(";");
        return new Attack(
                Integer.parseInt(parts[0].trim()), // #\ID
                parts[1].trim(),                   // Name
                parts[2].trim(),                   // Effekt
                parts[3].trim(),                   // Type
                parts[4].trim(),                   // Kind
                Integer.parseInt(parts[5].trim()), // Power
                Integer.parseInt(parts[6].trim()), // Accuracy
                Integer.parseInt(parts[7].trim())  // PP
        );
    }

    // Getter
    public String getName() {
        return name;
    }

    public int getAccuracy() {
        return accuracy;
    }

    public int getId() {
        return id;
    }

    public int getPower() {
        return power;
    }
    public String getEffectDescription() {
        return effect;
    }

    public void setPp(int pp) {
        this.pp = pp;
    }

    @Override
    public String toString() {
        return name + " (Power: " + power + ")";
    }

    public String getKind() {
        return kind;
    }
}//Quack!
