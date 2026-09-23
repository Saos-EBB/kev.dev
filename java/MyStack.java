public class MyStack {
    private double[] data = new double[1];
    private int size = 0;

    public void push(double x) {
        if (size == data.length) resize();
        data[size++] = x;
    }

    public double pop() {
        if (size == 0) throw new IllegalStateException("Stack empty!");
        return remove(size - 1);
    }

    public double peek() {
        if (size == 0) throw new IllegalStateException("Stack empty!");
        return data[size - 1];
    }

    public double peek(int indexFromTop) {
        if (indexFromTop < 0 || indexFromTop >= size)
            throw new IndexOutOfBoundsException("Invalid index for peek: " + indexFromTop);
        return data[size - 1 - indexFromTop];
    }

    public double remove(int idx) {
        if (idx < 0 || idx >= size) throw new IndexOutOfBoundsException("Invalid index: " + idx);
        double removed = data[idx];
        for (int i = idx; i < size - 1; i++) data[i] = data[i + 1];
        size--;
        return removed;
    }

    public int size() {
        return size;
    }

    public void clear() {
        size = 0;
    }

    @Override
    public String toString() {
        if (size == 0) return "[ ]";
        StringBuilder sb = new StringBuilder("[ ");
        for (int i = 0; i < size; i++) {
            sb.append(data[i]);
            if (i < size - 1) sb.append(", ");
        }
        sb.append(" ]");
        return sb.toString();
    }

    private void resize() {
        double[] temp = new double[data.length * 2];
        for (int i = 0; i < data.length; i++) temp[i] = data[i];
        data = temp;
    }
}
