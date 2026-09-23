package src.Logik;

import src.Persistierung.*;
import src.UI.Art;
import src.UI.Menu;

import java.util.Arrays;
import java.util.Random;
import java.util.Scanner;

public class GameEngine {

    public void game() throws Exception {

        PokemonData pokedex = new PokemonData();
        BattleLogic b = new BattleLogic();
        Scanner sc = new Scanner(System.in);
        Menu m = new Menu();

        pokedex.readRawPke("Pkmn/src/Persistierung/PokemonRawData");
        pokedex.readRawAtk("Pkmn/src/Persistierung/AttackRawData");

        ShortTermMemory tempMemory = new ShortTermMemory();
        tempMemory.setUserName(m.greeting());

        boolean conti = true;
        while (conti) {
         System.out.print("Choose your Pokemon.\n1. Type in iD.\n2. Type in Name.\n3. Random\n->");

            // User Pokemon auswahl
            int userIdx = m.pokeChoice(m,sc , pokedex);
            // User Attacken zuteilen
            Attack[] uAtks = getRandomAttacks(pokedex);
            tempMemory.setupUser(pokedex.getObj(userIdx), uAtks);
            //System.out.println(  "USER : \n" + pokedex.toString(userIdx) + "\n" + Arrays.toString(uAtks));
            Art.printUserBox(pokedex.getObj(userIdx), uAtks);

            // Npc Poke randy
            int npcIdx = rollIdx(pokedex.sizePke());
            // Npc Atk randy
            Attack[] nAtks = getRandomAttacks(pokedex);
            tempMemory.setupNpc(pokedex.getObj(npcIdx), nAtks);
            //System.out.println( "Npc : \n" + pokedex.toString(npcIdx) + "\n" + Arrays.toString(nAtks));
            Art.printNpcBox(pokedex.getObj(npcIdx) , nAtks);

            b.battle(tempMemory);

            // Reset   (refill hp , clear status , clear pokemon + atk )
            pokedex.getObj(userIdx).heal(pokedex.getObj(userIdx));
            pokedex.getObj(npcIdx).heal(pokedex.getObj(npcIdx));
            tempMemory.setUserStatus(Effect.NONE);
            tempMemory.setNpcStatus(Effect.NONE);
            tempMemory.clear();

            //continue ?
            System.out.println("want to continue ? (true / false)");
            conti = m.inputToBoolean();
        }


    }

    // Methoden
    private static Attack[] getRandomAttacks(PokemonData pokedex) {
        int a1 = rollIdx(pokedex.sizeAtk());
        return new Attack[]{pokedex.getAtkObj(a1), pokedex.getAtkObj(rollIdxExcept(a1, pokedex.sizeAtk()))};
    }

    public static int rollIdx(int end) {
        Random randy = new Random();
        return randy.nextInt(1, end);
    }

    public static int rollIdxExcept(int forbidden, int end) {
        Random r = new Random();
        int x;
        do {
            x = r.nextInt(1, end);
        } while (x == forbidden);
        return x;
    }

    //tester
    private static Attack[] gettingAtk(PokemonData pokedex, Scanner sc) {
        System.out.println("1st: ");
        int x = sc.nextInt();
        System.out.println("2nd: ");
        int y = sc.nextInt();

        return new Attack[]{pokedex.getAtkObj(x), pokedex.getAtkObj(y)};

    }

    private static Attack[] testAtk(PokemonData pokedex) {
        return new Attack[]{pokedex.getAtkObj(7), pokedex.getAtkObj(17)};

    }

}