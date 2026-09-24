public class Address {
    private String zipCode;
    private String city;
    private String street;
    private String houseNumber;

        public Address(String zipCode, String city, String street, String houseNumber) {
            // .trim() für saubere Daten !!
            setZipCode(zipCode);
            setCity(city);
            setStreet(street);
            setHouseNumber(houseNumber);
        }

    // Getter
    public String getZipCode() {
        return zipCode;
    }

    public String getCity() {
        return city;
    }

    public String getStreet() {
        return street;
    }

    public String getHouseNumber() {
        return houseNumber;
    }

    // Setter mit schutz
    public void setZipCode(String zipCode) {
        if (zipCode != null) {
            this.zipCode = zipCode.trim();
        } else {
            this.zipCode = "";
        }
    }

    public void setCity(String xxx) {
        if (xxx != null) {
            this.city = xxx.trim();
        } else {
            this.city = "";
        }
    }

    public void setStreet(String xxx) {
        if (xxx != null) {
            this.street = xxx.trim();
        } else {
            this.street = "";
        }
    }

    public void setHouseNumber(String xxx) {
        if (xxx != null) {
            this.houseNumber = xxx.trim();
        } else {
            this.houseNumber = "";
        }
    }

    @Override
    public String toString() {
        return street + " " + houseNumber + ", " + zipCode + " " + city;
    }
}