import java.util.Scanner;

public class TaschenRechnerV42Adv {

    public static void main(String[] args) {
        Scanner scan = new Scanner(System.in);
        MyStack stack = new MyStack();

        System.out.println("Weißt du wie ein RPN-Taschenrechner funktioniert? (true/false)");
        boolean know;
        String x = "";

        while (true) {
            x = scan.next();
            if (x.equals("true"))  { know = true;  break; }
            if (x.equals("false")) { know = false; break; }
            System.out.println("Wrong input");
        }

        if (!know) {
            System.out.println("Go and read something about it.");
            return;
        }

        System.out.print("Lets start! Enter a number to begin. (exit = exit)\n-> ");

        while (!x.equals("exit")) {
            x = scan.next();
            if (x.equals("exit")) break;

            if (isDouble(x)) {
                double val = Double.parseDouble(x);
                // BUG FIX: negative numbers are valid in math — removed the block
                stack.push(val);
                print(stack);
                continue;
            }

            int sz = stack.size();
            boolean need2 = x.equals("+") || x.equals("-") || x.equals("*") || x.equals("/")
                         || x.equals("swap") || x.equals("yx");
            boolean need1 = x.equals("sqrt") || x.equals("inv") || x.equals("dup")
                         || x.equals("drop") || x.equals("fact") || x.equals("ln");

            if (need2 && sz < 2) { System.out.println("Need 2 items on stack!\n-> "); continue; }
            if (need1 && sz < 1) { System.out.println("Need 1 item on stack!\n-> ");  continue; }

            switch (x) {
                case "+" -> { double[] ab = pop2(stack); stack.push(ab[1] + ab[0]); }
                case "-" -> { double[] ab = pop2(stack); stack.push(ab[1] - ab[0]); }
                case "*" -> { double[] ab = pop2(stack); stack.push(ab[1] * ab[0]); }
                case "/" -> {
                    double[] ab = pop2(stack);
                    if (ab[0] == 0) {
                        System.out.println("Division by zero!");
                        stack.push(ab[1]);
                        stack.push(ab[0]);
                        break;
                    }
                    stack.push(ab[1] / ab[0]);
                }
                case "swap" -> swap(stack);
                case "sqrt" -> sqrt(stack);
                case "inv"  -> inv(stack);
                case "dup"  -> stack.push(stack.peek());
                case "drop" -> stack.pop();
                case "fact" -> fact(stack);
                case "ln"   -> ln(stack);
                case "yx"   -> yx(stack);
                case "pi"   -> stack.push(Math.PI);
                case "clear"-> stack.clear();
                default     -> System.out.println("Unknown operator: " + x);
            }
            print(stack);
        }

        scan.close();
        System.out.println("Bye!");
    }

    // --- Input validation ---

    public static boolean isDouble(String s) {
        try { Double.parseDouble(s); return true; }
        catch (NumberFormatException e) { return false; }
    }

    // --- Math operations ---

    public static void sqrt(MyStack stack) {
        double x = stack.pop();
        if (x < 0) { System.out.println("Cannot sqrt a negative number!"); stack.push(x); return; }
        stack.push(Math.sqrt(x));
    }

    public static void inv(MyStack stack) {
        double x = stack.pop();
        if (x == 0) { System.out.println("Cannot invert zero!"); stack.push(x); return; }
        stack.push(1.0 / x);
    }

    public static void fact(MyStack stack) {
        double x = stack.pop();
        if (x < 0 || x != (int) x) {
            System.out.println("Factorial requires a non-negative integer!");
            stack.push(x);
            return;
        }
        double result = 1;
        for (int i = 2; i <= (int) x; i++) result *= i;
        stack.push(result);
    }

    public static void ln(MyStack stack) {
        double x = stack.pop();
        if (x <= 0) { System.out.println("ln requires a positive number!"); stack.push(x); return; }
        stack.push(Math.log(x));
    }

    public static void yx(MyStack stack) {
        double x = stack.pop(), y = stack.pop();
        stack.push(Math.pow(y, x));
    }

    public static void swap(MyStack stack) {
        double top = stack.pop(), below = stack.pop();
        stack.push(top);
        stack.push(below);
    }

    // --- Helpers ---

    static double[] pop2(MyStack stack) {
        return new double[]{ stack.pop(), stack.pop() };
    }

    private static void print(MyStack stack) {
        System.out.println("=".repeat(30));
        for (int line = 4; line >= 1; line--) {
            int idx = line - 1;
            if (idx < stack.size()) {
                System.out.printf("%d:%22f%n", line, stack.peek(idx));
            } else {
                System.out.printf("%d:%22s%n", line, "");
            }
        }
        System.out.println("=".repeat(30));
        System.out.print("-> ");
    }
}
