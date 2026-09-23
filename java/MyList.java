public class MyList {
    private double[] data = new double[1];
    private int size = 0;

    public void add(double v) {
        if (size == data.length) resize();
        data[size++] = v;
    }

    public void add(int pos, double v) {
        if (pos < 0 || pos > size)
            throw new IndexOutOfBoundsException("Invalid index: " + pos);
        if (size == data.length) resize();
        for (int i = size; i > pos; i--) data[i] = data[i - 1];
        data[pos] = v;
        size++;
    }

    public double get(int idx) {
        if (idx < 0 || idx >= size)
            throw new IndexOutOfBoundsException("Invalid index: " + idx);
        return data[idx];
    }

    public double remove(int idx) {
        if (idx < 0 || idx >= size)
            throw new IndexOutOfBoundsException("Invalid index: " + idx);
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
        if (size == 0) return "[]";
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < size; i++) {
            sb.append(data[i]);
            if (i < size - 1) sb.append(", ");
        }
        sb.append("]");
        return sb.toString();
    }

    private void resize() {
        double[] temp = new double[data.length * 2];
        for (int i = 0; i < data.length; i++) temp[i] = data[i];
        data = temp;
    }
}
