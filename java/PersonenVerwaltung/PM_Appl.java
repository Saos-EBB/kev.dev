import java.util.HashMap;
import java.util.Map;

public class PM_Appl {
    private Map<String, PM> managements = new HashMap<>();

    public boolean add(String name) {
        if (name == null || name.isBlank() || managements.containsKey(name.trim())) return false;
        managements.put(name.trim(), new PM(name.trim()));
        return true;
    }

    public PM get(String name) {
        return (name != null) ? managements.get(name.trim()) : null;
    }

    @Override
    public String toString() {
        return "Verwaltungen: " + managements.keySet();
    }
}