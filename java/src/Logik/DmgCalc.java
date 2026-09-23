package src.Logik;

import src.Persistierung.*;


public class DmgCalc {


    public double Physical(Attack power, Pokemon a, Pokemon d) {
        int atk = a.getAtk();
        int def = d.getDef();
        int pow = power.getPower();
        return (pow) * ((double) atk / def) * (1.0 / 15.0);

    }

    public double Special(Attack power, Pokemon a, Pokemon d) {
        int atk = a.getSpAtk();
        int def = d.getSpDef();
        int pow = power.getPower();
        return (pow) * ((double) atk / def) * (1.0 / 10.0);
    }


    public double SpecialConf(Attack power, Pokemon a) {
        int atk = a.getSpAtk();
        int def = a.getSpDef();
        int pow = power.getPower();
        return (pow) * ((double) atk / def) * (1.0 / 10.0);

    }

    public double PhysicalConf(Attack power, Pokemon a) {
        int atk = a.getAtk();
        int def = a.getDef();
        int pow = power.getPower();
        return (pow) * ((double) atk / def) * (1.0 / 10.0);

    }


    public double burn(Pokemon p) {
        double x = p.getHpMax();
        return x / 16;
    }

    public double poison(Pokemon p) {
        double x = p.getHpMax();
        return x / 8;
    }


}
