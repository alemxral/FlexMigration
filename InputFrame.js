class InputFrame {
    constructor() {
      this.data = []; // To store the parsed Excel data as an array of objects
      this.headers = []; // To store the column headers
    }
  
    /**
     * Load data from an Excel file and parse it into a structured format.
     * @param {File} file - The uploaded Excel file.
     */
    async loadFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
    
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: "array" });
                    const sheetName = workbook.SheetNames[0];
                    const sheet = workbook.Sheets[sheetName];
    
                    // Parse the sheet into JSON format
                    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
                    // Extract headers
                    this.headers = jsonData[0];
    
                    // Filter out empty rows
                    this.data = jsonData.slice(1).filter(row => {
                        return row.some(cell => cell !== null && cell !== ""); // Keep rows with at least one non-empty cell
                    }).map((row) => {
                        const rowData = {};
                        this.headers.forEach((header, index) => {
                            rowData[header] = row[index];
                        });
                        return rowData;
                    });
    
                    resolve("File loaded successfully!");
                } catch (error) {
                    reject("Error loading file: " + error.message);
                }
            };
    
            reader.onerror = () => {
                reject("Error reading file.");
            };
    
            reader.readAsArrayBuffer(file);
        });
    }
  
    /**
     * Display all headers of the loaded data.
     * @returns {string[]} - Array of headers.
     */
    displayHeaders() {
      if (this.headers.length === 0) {
        console.warn("No headers available. Please load a file first.");
        return [];
      }
      console.log("Headers:", this.headers);
      return this.headers;
    }
  
    /**
     * Get the entire dataset as an array of objects.
     * @returns {Object[]} - The dataset.
     */
    getData() {
      return this.data;
    }
  
    /**
     * Perform a lookup operation to find rows matching a specific condition.
     * @param {string} key - The column name to search in.
     * @param {*} value - The value to match.
     * @returns {Object[]} - Matching rows.
     */
    lookup(key, value) {
      if (!this.headers.includes(key)) {
        console.error(`Key "${key}" not found in headers.`);
        return [];
      }
  
      const matches = this.data.filter((row) => row[key] === value);
      return matches;
    }
  
    /**
     * Save the current data back to an Excel file.
     * @param {string} filename - The name of the output file.
     */
    saveToFile(filename = "output.xlsx") {
      if (this.data.length === 0) {
        console.warn("No data to save. Please load a file first.");
        return;
      }
  
      // Convert data back to worksheet format
      const worksheetData = [this.headers, ...this.data.map((row) => this.headers.map((header) => row[header]))];
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  
      // Create a workbook and append the worksheet
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  
      // Export the workbook as an Excel file
      XLSX.writeFile(workbook, filename);
    }
  }
  
  export default InputFrame;