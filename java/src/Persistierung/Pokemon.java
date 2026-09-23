package src.Persistierung;

public class Pokemon {
    private int id;
    private String name, type1, type2;
    private int total, hp, attack, defense, spAtk, spDef, speed;
    private int hpMax;

    // Konstruktor
    public Pokemon(int id, String name, String type1, String type2, int total, int hp, int attack, int defense, int spAtk, int spDef, int speed) {
        this.id = id;
        this.name = name;
        this.type1 = type1;
        this.type2 = type2;
        this.total = total;
        this.hp = hp;
        this.attack = attack;
        this.defense = defense;
        this.spAtk = spAtk;
        this.spDef = spDef;
        this.speed = speed;
        this.hpMax = hp;
    }

    //Obj aus csv (comma seperated values)
    public static Pokemon read(String csvLine) {
        String[] p = csvLine.split(";");
        return new Pokemon(
                Integer.parseInt(p[0].trim()), // ID
                p[1].trim(),                   // Name
                p[2].trim(),                   // Type 1
                p[3].trim(),                   // Type 2
                Integer.parseInt(p[4].trim()), // Total Stats
                Integer.parseInt(p[5].trim()), // HP
                Integer.parseInt(p[6].trim()), // Attack
                Integer.parseInt(p[7].trim()), // Defense
                Integer.parseInt(p[8].trim()), // Sp. Atk
                Integer.parseInt(p[9].trim()), // Sp.Def
                Integer.parseInt(p[10].trim()) // Speed
        );
    }

    // heal
    public void heal(Pokemon x) {
        this.hp = hpMax;
    }

    // Getter
    public int getId() {
        return id;
    }

    public int getAtk() {
        return attack;
    }

    public int getDef() {
        return defense;
    }

    public int getSpAtk() {
        return spAtk;
    }

    public int getSpDef() {
        return spDef;
    }

    public int getHp() {
        return hp;
    }

    public int getHpMax() {
        return hpMax;
    }

    public void setHp(int hp) {
        this.hp = hp;
    }

    public int getSpeed() {
        return speed;
    }

    public String getName() {
        return name;
    }

    public String getType1() {
        return type1;
    }

    public String getType2() {
        return type2;
    }

    @Override
    public String toString() {
        //   return id + "|" + name + "|" + type1 +(type2.equals("null") ? "" :  ("/" + type2));
        return id + " | " + name + " | " + type1 + " | " + type2 + " | " + total + " | " + hp + " | " + attack + " | " + defense + " | " + spAtk + " | " + spDef + " | " + speed;

    }


}//Quack!




