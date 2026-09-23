package src.Persistierung;

import java.io.BufferedReader;
import java.io.FileReader;
import java.util.HashMap;
import java.util.Map;

public class PokemonData {
    private Map<Integer, Pokemon> byIdx = new HashMap<>();
    private Map<String, Pokemon> byName = new HashMap<>();
    private Map<Integer, Attack> byIdxAtk = new HashMap<>();

    // add
    public void addPokemon(String xxx) {
        Pokemon x = Pokemon.read(xxx);
        String[] xx = xxx.split(";");
        byIdx.put(Integer.parseInt(xx[0]), x);  //id
        byName.put(xx[1], x);                   //name
    }

    public void addAttack(String xxx) {
        Attack x = Attack.read(xxx);
        String[] xx = xxx.split(";");
        byIdxAtk.put(Integer.parseInt(xx[0]), x);
    }

    //Daten einlesen
    public void readRawPke(String fileName) throws Exception {
        BufferedReader br = new BufferedReader(new FileReader(fileName));
        while (br.ready()) {
            Pokemon xx = Pokemon.read(br.readLine());
            byIdx.put(xx.getId(), xx);
            byName.put(xx.getName(), xx);
        }
        br.close();
    }

    public void readRawAtk(String fileName) throws Exception {
        BufferedReader br = new BufferedReader(new FileReader(fileName));
        while (br.ready()) {
            Attack xx = Attack.read(br.readLine());
            byIdxAtk.put(xx.getId(), xx);
        }
        br.close();
    }




    // getter
    public String get(int idx) {
        return byIdx.get(idx).toString();
    }

    public Pokemon getObj(int idx) {
        return byIdx.get(idx);
    }

    public String get(String name) {
        return byName.get(name).toString();
    }

    public Pokemon getObj(String name) {
        return byName.get(name);
    }

    public String getAtk(int idx) {
        return byIdxAtk.get(idx).toString();
    }

    public Attack getAtkObj(int idx) {
        return byIdxAtk.get(idx);
    }

    public int sizePke() {
        return byIdx.size();
    }

    public int sizeAtk() {
        return byIdxAtk.size();
    }

    public String toString(int idx) {
        return byIdx.get(idx).toString();
    }

    public String toString(String name) {
        return byName.get(name).toString();
    }


}//Quack!






