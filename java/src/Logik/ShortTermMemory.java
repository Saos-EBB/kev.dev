package src.Logik;

import  src.Persistierung.*;

import static src.Persistierung.Effect.NONE;

public class ShortTermMemory {
    String userName = "default";
    private Effect userStatus = NONE;
    private Effect npcStatus = NONE;
    private Pokemon userPokemon;
    private Pokemon npcPokemon;
    private Attack[] userAttacks;
    private Attack[] npcAttacks;


    // USER NAME
    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    // Pokemon
    public void setupUser(Pokemon p, Attack[] a) {
        this.userPokemon = p;
        this.userAttacks = a;
    }

    public void setupNpc(Pokemon p, Attack[] a) {
        this.npcPokemon = p;
        this.npcAttacks = a;
    }

    public Pokemon getNpcPokemon() {
        return npcPokemon;
    }

    public Pokemon getUserPokemon() {
        return userPokemon;
    }

    // Attacken

    public Attack[] getNpcAttacks() {
        return npcAttacks;
    }

    public Attack[] getUserAttacks() {
        return userAttacks;
    }

    // Status

    public void setUserStatus(Effect userStatus) {
        this.userStatus = userStatus;
    }

    public void setNpcStatus(Effect npcStatus) {
        this.npcStatus = npcStatus;
    }

    public Effect getUserStatus() {
        return userStatus;
    }

    public Effect getNpcStatus() {
        return npcStatus;
    }


    // clear
    public void clear() {
        userPokemon = null;
        userAttacks = null;
        npcPokemon = null;
        npcAttacks = null;
    }
}