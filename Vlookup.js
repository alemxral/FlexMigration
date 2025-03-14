class Vlookup {
    constructor(header) {
        this.header = header; // Selected OutputFrame header
        this.data = []; // Array of { outputValue, lookupValue }
    }

    /**
     * Add a new row to the Vlookup data.
     * @param {string} outputValue - The value from the OutputFrame header.
     * @param {string} lookupValue - The corresponding lookup value.
     */
    addRow(outputValue, lookupValue) {
        this.data.push({ outputValue, lookupValue });
    }

    /**
     * Get all rows in the Vlookup data.
     * @returns {Array} - Array of { outputValue, lookupValue } objects.
     */
    getData() {
        return this.data;
    }

    /**
     * Save the Vlookup data to a JSON file.
     * @param {string} fileName - The name of the file to save.
     */
    saveToFile(fileName) {
        const jsonData = JSON.stringify(this.data, null, 2);
        const blob = new Blob([jsonData], { type: "application/json" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        link.click();
    }

    /**
     * Load Vlookup data from a JSON file.
     * @param {File} file - The uploaded JSON file.
     * @returns {Promise<Array>} - Resolves with the loaded data.
     */
    async loadFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const jsonData = JSON.parse(e.target.result);
                    this.data = jsonData;
                    resolve(jsonData);
                } catch (error) {
                    reject("Error parsing JSON file.");
                }
            };
            reader.onerror = () => {
                reject("Error reading file.");
            };
            reader.readAsText(file);
        });
    }
}

export default Vlookup;