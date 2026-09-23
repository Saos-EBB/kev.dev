package src.Logik;

import src.Persistierung.*;
import src.UI.*;

import java.util.Random;

import static src.Persistierung.Effect.*;

public class BattleLogic {

    public void battle(ShortTermMemory mem) {
        DmgCalc calc = new DmgCalc();
        Pokemon u = mem.getUserPokemon();
        Pokemon n = mem.getNpcPokemon();
        Random r = new Random();
        Menu m = new Menu();

        int round = 1;
        while (u.getHp() > 0 && n.getHp() > 0) {
            Art.printRound(round++);
            System.out.println(Art.MINT + "\nChoose:\n1) " + mem.getUserAttacks()[0] + "\n2) " + mem.getUserAttacks()[1] + Art.RESET);
            int choice = m.inputToIntOnetoTwo() - 1;

            Attack uAtk = mem.getUserAttacks()[choice];
            Attack nAtk = mem.getNpcAttacks()[r.nextInt(2)];

            //fight + flinch skip
            if (SpeedCheck(u, n)) {
                turn(u, uAtk, n, mem, calc, true);
                if (n.getHp() > 0) {
                    if (mem.getNpcStatus() != Effect.FLINCH) {
                        turn(n, nAtk, u, mem, calc, false);
                    } else {
                        System.out.println(Art.ORANGE + n.getName() + " flinched.." + Art.RESET);
                    }
                }
                if (n.getHp() < 0) {
                    System.out.println(Art.ORANGE + n.getName() + " fainted.." + Art.RESET);
                    break;
                }
            } else {
                turn(n, nAtk, u, mem, calc, false);
                if (u.getHp() > 0) {
                    if (mem.getUserStatus() != Effect.FLINCH) {
                        turn(u, uAtk, n, mem, calc, true);
                    } else {
                        System.out.println(Art.MINT + u.getName() + " flinched.." + Art.RESET);

                    }
                }
                if (u.getHp() < 0) {
                    System.out.println(Art.MINT + u.getName() + " fainted.." + Art.RESET);
                    break;
                }
            }

            //ende
            applyEnd(u, n, mem, calc);
        }
        System.out.println(n.getHp() > 0 ? Art.ORANGE + "You lost!" + Art.RESET : Art.MINT + "You won!" + Art.RESET);
    }

    // fight
    private void turn(Pokemon att, Attack atk, Pokemon def, ShortTermMemory mem, DmgCalc calc, boolean isU) {
        Random r = new Random();
        Effect s = isU ? (Effect) mem.getUserStatus() : (Effect) mem.getNpcStatus();
        // 1. status check / does it break ?
        switch (s) {
            case FREEZE -> {
                if (r.nextInt(100) < 20) {
                    System.out.println(att.getName() + " thawed!");
                    if (isU) mem.setUserStatus(NONE);
                    else mem.setNpcStatus(NONE);
                    s = NONE;
                } else {
                    System.out.println(att.getName() + " is frozen!");
                    return;
                }
            }
            case PARALYZE -> {
                if (r.nextInt(100) < 25) {
                    System.out.println(att.getName() + " is paralyzed!");
                    return;
                }
            }
            case SLEEP -> {
                if (r.nextInt(100) < 50) {
                    System.out.println(att.getName() + " is awoken!");
                    if (isU) mem.setUserStatus(NONE);
                    else mem.setNpcStatus(NONE);
                    s = NONE;
                } else {
                    System.out.println(att.getName() + " is sleeping. ZzzZZZzzZ");
                    return;
                }
            }
            case CONFUSION -> {
                if (r.nextInt(100) < 30) {
                    System.out.println(att.getName() + " has broke confusion!");
                    if (isU) mem.setUserStatus(NONE);
                    else mem.setNpcStatus(NONE);
                    s = NONE;
                } else {
                    System.out.println(att.getName() + " is Confused.");

                }
            }


        }

        // 2. Atk hit ?
        if (r.nextInt(100) >= atk.getAccuracy()) {
            System.out.println(att.getName() + " missed!");
            return;
        }


        // 3. Attackieren
        Effect e = Effect.parseEffect(atk.getEffectDescription());
        int y = executeAtk(att, atk, def, calc);

        if (s == CONFUSION && r.nextInt(100) < 50) {
            y = executeSelf(att, atk, calc);
            att.setHp(att.getHp() - y);
            System.out.println("  " + att.getName() + " → hits itself | " + y + " DMG | HP: " + att.getHp() + "/" + att.getHpMax());            return;
        }

        // 4. check if multi - crit
        if (e == Effect.CRIT && r.nextInt(100) < 33) {
            y *= 2;
            System.out.println("Crit!");
        }
        if (e == Effect.MULTI_HIT && r.nextInt(100) < 75) {
            int hits = r.nextInt(2, 5);
            y *= hits;
            System.out.println((hits + " hits!"));
        }

        // 5. schaden geben
        def.setHp(def.getHp() - y);
        System.out.println("  " + att.getName() + " → " + atk.getName() + " → " + def.getName() + " | " + y + " DMG | HP: " + def.getHp() + "/" + def.getHpMax());



        // 6. Status hit ? wenn ja in temp saven
        if (StatusHit(e)) {
            if (e == Effect.BURN || e == Effect.PARALYZE || e == Effect.FREEZE || e == Effect.POISON || e == Effect.SLEEP || e == Effect.CONFUSION || e == Effect.FLINCH ) {
                if (isU && mem.getNpcStatus() == NONE) {
                    mem.setNpcStatus(e);
                } else if (!isU && mem.getUserStatus() == NONE) {
                    mem.setUserStatus(e);
                }
            }
        }
    }

    //Ende der runde burn/ posion  dmg abziehn und flinch reset.
    private void applyEnd(Pokemon u, Pokemon n, ShortTermMemory mem, DmgCalc calc) {
        // BURN
        if (mem.getUserStatus() == Effect.BURN) {
            u.setHp(u.getHp() - (int) calc.burn(u));
            System.out.println("  🔥 " + u.getName() + " burn | " + (int) calc.burn(u) + " DMG | HP: " + u.getHp() + "/" + u.getHpMax());
        }
        if (mem.getNpcStatus() == Effect.BURN) {
            n.setHp(n.getHp() - (int) calc.burn(n));
            System.out.println("  🔥 " + n.getName() + " burn | " + (int) calc.burn(n) + " DMG | HP: " + n.getHp() + "/" + n.getHpMax());
        }
        // POISON
        if (mem.getUserStatus() == Effect.POISON) {
            u.setHp(u.getHp() - (int) calc.poison(u));
            System.out.println("  ☠ " + u.getName() + " poison | " + (int) calc.poison(u) + " DMG | HP: " + u.getHp() + "/" + u.getHpMax());
        }
        if (mem.getNpcStatus() == Effect.POISON) {
            n.setHp(n.getHp() - (int) calc.poison(n));
            System.out.println("  ☠ " + n.getName() + " poison | " + (int) calc.poison(n) + " DMG | HP: " + n.getHp() + "/" + n.getHpMax());
        }

        if (mem.getUserStatus() == Effect.FLINCH) mem.setUserStatus(NONE);
        if (mem.getNpcStatus() == Effect.FLINCH) mem.setNpcStatus(NONE);
    }

    // schneller?
    public boolean SpeedCheck(Pokemon user, Pokemon npc) {
        return user.getSpeed() >= npc.getSpeed();
    }

    // physisch oder spezial?
    private static int executeAtk(Pokemon att, Attack atk, Pokemon def, DmgCalc calc) {
        return (atk.getKind().equalsIgnoreCase("Special")) ? (int) calc.Special(atk, att, def) : (int) calc.Physical(atk, att, def);
    }

    //physisch odr spezial , selbstverletzn
    private static int executeSelf(Pokemon p, Attack atk, DmgCalc calc) {
        return (atk.getKind().equalsIgnoreCase("Special")) ? (int) calc.SpecialConf(atk, p) : (int) calc.PhysicalConf(atk, p);
    }

    // Trifft status effekt ?
    public boolean StatusHit(Effect e) {
        return new Random().nextInt(100) < e.getChance();
    }


}