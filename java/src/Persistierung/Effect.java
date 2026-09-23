package src.Persistierung;
// ENUM schütz mich vor meinen Fehlern
public enum Effect {
    NONE(0, 0, 0),
    BURN(30, 100, 0.0625),
    FREEZE(20, 100, 0),
    PARALYZE(25, 100, 0),
    MULTI_HIT(75, 0, 0),
    CRIT(33, 0, 0),
    FLINCH(100, 1, 0),
    SLEEP(50,3,0),
    POISON(60,3,0.1250),
    CONFUSION(50,5,0);

    private final int chance;       // Wahrscheinlichkeit (%)
    private final int duration;     // Runden
    private final double damage;    // Schaden

    // Konstruktor
    Effect(int chance, int duration, double damage) {
        this.chance = chance;
        this.duration = duration;
        this.damage = damage;
    }

    // Getter
    public int getChance() {
        return chance;
    }

    public int getDuration() {
        return duration;
    }

    public double getDamage() {
        return damage;
    }

    // parse
    public static Effect parseEffect(String text) {
        text = text.toLowerCase();
        if (text.contains("none")) return NONE;

        if (text.contains("freeze")) return FREEZE;
        if (text.contains("paralyze")) return PARALYZE;
        if (text.contains("sleep")) return SLEEP;
        if (text.contains("flinching")) return FLINCH;

        if (text.contains("2-5")) return MULTI_HIT;
        if (text.contains("crit")) return CRIT;
        if (text.contains("confuse")) return CONFUSION;


        if (text.contains("burn")) return BURN;
        if (text.contains("poison")) return POISON;

        return NONE;
    }



}

