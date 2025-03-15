// DefaultFieldsFile.js

export class DefaultFieldsFile {
    constructor() {
        this.data = {}; // Stores headers and their corresponding values
    }

    // Load data from an uploaded Excel file
    async loadFromFile(file, parseExcelFile) {
        try {
            const parsedData = await parseExcelFile(file);
            this.data = parsedData; // Store the parsed data
            console.log("Excel data loaded into DefaultFieldsFile instance:", this.data);
            return this.data;
        } catch (error) {
            console.error("Error parsing Excel file:", error);
            throw new Error("Error uploading Excel file.");
        }
    }

    // Save the current data to the server
    async saveToServer(apiEndpoint) {
        try {
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.data),
            });

            if (!response.ok) {
                throw new Error(`Failed to save Default Fields data: ${response.status}`);
            }

            const result = await response.json();
            console.log("Default Fields data saved successfully:", result);
            return result;
        } catch (error) {
            console.error("Error saving Default Fields data:", error);
            throw new Error("Error saving Default Fields data. Please try again.");
        }
    }

    // Load data from the server
    async loadFromServer(apiEndpoint) {
        try {
            const response = await fetch(apiEndpoint);
            if (!response.ok) {
                throw new Error(`Failed to load Default Fields data: ${response.status}`);
            }

            this.data = await response.json();
            console.log("Default Fields data loaded from server:", this.data);
            return this.data;
        } catch (error) {
            console.error("Error loading Default Fields data:", error);
            throw new Error("Error loading Default Fields data. Please try again.");
        }
    }

    // Generate rows for the table dynamically
    generateTableRows(tableBody, createDropdown, createSearchableDropdown) {
        if (!tableBody) {
            console.error("Table body not found.");
            return;
        }

        // Clear previous content
        tableBody.innerHTML = '';

        // Extract headers and values from the stored data
        const headers = Object.keys(this.data);

        for (let i = 0; i < Math.max(headers.length, 10); i++) {
            const row = document.createElement('tr');

            // Column 1: Header 1
            const header1Cell = document.createElement('td');
            const header1Dropdown = createDropdown(headers);
            header1Cell.appendChild(header1Dropdown);
            row.appendChild(header1Cell);

            // Column 2: Values (Searchable Dropdown)
            const valuesCell = document.createElement('td');
            const valuesDropdown = createSearchableDropdown(this.data[headers[i]] || []);
            valuesCell.appendChild(valuesDropdown);
            row.appendChild(valuesCell);

            // Column 3: Filter Header
            const filterHeaderCell = document.createElement('td');
            const filterHeaderDropdown = createDropdown(headers);
            filterHeaderCell.appendChild(filterHeaderDropdown);
            row.appendChild(filterHeaderCell);

            // Column 4: Filter Values
            const filterValuesCell = document.createElement('td');
            const filterValuesDropdown = createDropdown([]);
            filterValuesCell.appendChild(filterValuesDropdown);
            row.appendChild(filterValuesCell);

            tableBody.appendChild(row);
        }
    }
}