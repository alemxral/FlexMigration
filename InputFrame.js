// import * as XLSX from 'xlsx';

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
    
                    console.log("File loaded successfully:", { headers: this.headers, data: this.data });
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
        // XLSX.writeFile(workbook, filename);
    }

    /**
     * Save the current data to the server.
     * @param {string} endpoint - The server endpoint to send the data to.
     * @returns {Promise<void>}
     */
    async saveToServer(endpoint) {
        if (this.data.length === 0) {
            console.warn("No data to save. Please load a file first.");
            return;
        }
    
        try {
            // Prepare the payload (JSON format)
            const payload = {
                headers: this.headers,
                data: this.data,
            };
    
            console.log("Sending payload to server:", payload);
    
            // Send the data to the server
            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });
    
            // Check the response status
            if (!response.ok) {
                throw new Error(`Server responded with status ${response.status}`);
            }
    
            const result = await response.json();
            console.log("File saved to server successfully:", result);
            createNotification("File saved to server successfully!");
        } catch (error) {
            console.error("Error saving file to server:", error.message);
            // createNotification("Error saving file to server.");
        }
    }

    /**
     * Save the current data as a JSON file named "InputFrame.json".
     */
    saveToJsonFile() {
        if (this.data.length === 0) {
            console.warn("No data to save. Please load a file first.");
            return;
        }
    
        try {
            // Prepare the payload (JSON format)
            const payload = {
                headers: this.headers,
                data: this.data,
            };
    
            // Convert the payload to a JSON string
            const jsonString = JSON.stringify(payload, null, 2);
    
            // Create a Blob containing the JSON data
            const blob = new Blob([jsonString], { type: "application/json" });
    
            // Create a link element to trigger the download
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "InputFrame.json";
    
            // Append the link to the body (required for Firefox)
            document.body.appendChild(link);
    
            // Programmatically click the link to trigger the download
            link.click();
    
            // Clean up the link element
            document.body.removeChild(link);
    
            console.log("Data saved as InputFrame.json");
        } catch (error) {
            console.error("Error saving JSON file:", error.message);
        }
    }
}

export default InputFrame;