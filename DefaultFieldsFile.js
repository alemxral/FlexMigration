// ==============================
// Default Fields
// ==============================

import { createDropdown, createSearchableDropdown } from "./utils.js";

// DefaultFieldsFile Class
export class DefaultFieldsFile {
    constructor() {
        this.data = {}; // Stores headers and their corresponding values
        this.headers = []; // Stores Excel headers
    }

    // Load data from an uploaded Excel file
    async loadFromFile(file, parseExcelFile) {
        try {
            const parsedData = await parseExcelFile(file);
            this.data = parsedData; // Store the parsed data
            this.headers = Object.keys(parsedData); // Extract headers
            console.log("DEBUG: Excel data loaded successfully:", this.data);
            console.log("DEBUG: Headers extracted:", this.headers);
            return this.data;
        } catch (error) {
            console.error("DEBUG: Error parsing Excel file:", error);
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
            console.log("DEBUG: Default Fields data saved successfully:", result);
            return result;
        } catch (error) {
            console.error("DEBUG: Error saving Default Fields data:", error);
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
            this.headers = Object.keys(this.data); // Extract headers
            console.log("DEBUG: Default Fields data loaded from server:", this.data);
            console.log("DEBUG: Headers extracted:", this.headers);
            return this.data;
        } catch (error) {
            console.error("DEBUG: Error loading Default Fields data:", error);
            throw new Error("Error loading Default Fields data. Please try again.");
        }
    }

    // Update Values Dropdown Based on Header 1 Selection or Search Input
    updateValuesDropdown(row) {
        const header1Dropdown = row.querySelector('td:nth-child(1) select');
        const valuesCell = row.querySelector('td:nth-child(2) .searchable-dropdown');
        const selectedHeader = header1Dropdown.value;

        let values = [];
        if (selectedHeader && this.data[selectedHeader]) {
            values = this.data[selectedHeader];
        }

        // Filter values based on search input
        const searchInput = valuesCell.querySelector('input');
        if (searchInput) {
            const searchTerm = searchInput.value.toLowerCase();
            values = values.filter((value) => value.toLowerCase().includes(searchTerm));
        }

        this.populateSearchableDropdown(valuesCell, values);
    }

    // Update Filter Values Dropdown Based on Filter Header Selection or Search Input
    updateFilterValuesDropdown(row) {
        const filterHeaderDropdown = row.querySelector('td:nth-child(3) select');
        const filterValuesCell = row.querySelector('td:nth-child(4) .searchable-dropdown');
        const selectedHeader = filterHeaderDropdown.value;

        let values = [];
        if (selectedHeader && this.data[selectedHeader]) {
            values = this.data[selectedHeader];
        }

        // Filter values based on search input
        const searchInput = filterValuesCell.querySelector('input');
        if (searchInput) {
            const searchTerm = searchInput.value.toLowerCase();
            values = values.filter((value) => value.toLowerCase().includes(searchTerm));
        }

        this.populateSearchableDropdown(filterValuesCell, values);
    }

    // Populate a Searchable Dropdown with Options
    populateSearchableDropdown(dropdownContainer, options) {
        const input = dropdownContainer.querySelector('input');
        const ul = dropdownContainer.querySelector('ul');

        if (!input || !ul) {
            console.error("DEBUG: Invalid dropdown container structure.");
            return;
        }

        // Clear previous options
        ul.innerHTML = '';

        // Validate options
        if (!Array.isArray(options)) {
            console.error("DEBUG: Invalid options provided for searchable dropdown.");
            return;
        }

        // Add new options
        options.forEach((option) => {
            const li = document.createElement('li');
            li.textContent = option;
            li.addEventListener('click', () => {
                input.value = option;
                ul.style.display = 'none';
            });
            ul.appendChild(li);
        });

        // Reset input value
        input.value = '';
    }

    // Helper function to create a dropdown with a default empty option
    createDropdownWithEmpty(options, placeholder = '-- Select Header --') {
        const select = document.createElement('select');
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = placeholder;
        select.appendChild(emptyOption);

        options.forEach((optionText) => {
            const option = document.createElement('option');
            option.value = optionText;
            option.textContent = optionText;
            select.appendChild(option);
        });

        return select;
    }

    // Generate Table Rows
    generateTableRows(tableBody, numRows = 10) {
        console.log("DEBUG: Generating table rows...");

        if (!tableBody) {
            console.error("DEBUG: Table body element is required.");
            return;
        }

        if (this.headers.length === 0) {
            console.warn("DEBUG: No headers available to generate table.");
            return;
        }

        console.log("DEBUG: Clearing previous content...");
        tableBody.innerHTML = ''; // Clear previous content

        for (let i = 0; i < numRows; i++) {
            const row = document.createElement('tr');

            // Column 1: Header 1
            const header1Cell = document.createElement('td');
            const header1Dropdown = this.createDropdownWithEmpty(this.headers);
            header1Cell.appendChild(header1Dropdown);
            row.appendChild(header1Cell);

            // Column 2: Values (Searchable Dropdown)
            const valuesCell = document.createElement('td');
            const valuesDropdown = createSearchableDropdown([]);
            valuesCell.appendChild(valuesDropdown);
            row.appendChild(valuesCell);

            // Column 3: Filter Header
            const filterHeaderCell = document.createElement('td');
            const filterHeaderDropdown = this.createDropdownWithEmpty(this.headers);
            filterHeaderCell.appendChild(filterHeaderDropdown);
            row.appendChild(filterHeaderCell);

            // Column 4: Filter Values (Searchable Dropdown)
            const filterValuesCell = document.createElement('td');
            const filterValuesDropdown = createSearchableDropdown([]);
            filterValuesCell.appendChild(filterValuesDropdown);
            row.appendChild(filterValuesCell);

            // Add Event Listeners for Filtering
            header1Dropdown.addEventListener('change', () => this.updateValuesDropdown(row));
            filterHeaderDropdown.addEventListener('change', () => this.updateFilterValuesDropdown(row));
            valuesDropdown.querySelector('input').addEventListener('input', () => this.updateValuesDropdown(row));
            filterValuesDropdown.querySelector('input').addEventListener('input', () => this.updateFilterValuesDropdown(row));

            tableBody.appendChild(row);
        }

        console.log("DEBUG: Table rows generated successfully.");
    }
}

// Initialize the DefaultFieldsFile instance
const defaultFieldsFile = new DefaultFieldsFile();

// Save Button - Save Default Fields to JSON via Server
document.getElementById('saveToJsonButton')?.addEventListener('click', async () => {
    try {
        await defaultFieldsFile.saveToServer('/api/save-data-DefaulFieldsFile');
        createNotification("Default Fields data saved successfully!");
    } catch (error) {
        console.error("DEBUG: Error saving Default Fields data:", error);
        createNotification("Error saving Default Fields data. Please try again.");
    }
});

// Load Button - Load Default Fields from JSON via Server
document.getElementById('loadFromJsonButton')?.addEventListener('click', async () => {
    try {
        await defaultFieldsFile.loadFromServer('/api/load-data-DefaulFieldsFile');
        const tableBody = document.getElementById('defaultFieldsTableBody');
        if (!tableBody) {
            console.error("DEBUG: Table body element not found.");
            return;
        }
        defaultFieldsFile.generateTableRows(tableBody);
        createNotification("Default Fields data loaded successfully!");
    } catch (error) {
        console.error("DEBUG: Error loading Default Fields data:", error);
        createNotification("Error loading Default Fields data. Please try again.");
    }
});

// Handle File Upload
document.getElementById('excelFileUpload')?.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) {
        console.warn("DEBUG: No file selected.");
        return;
    }

    try {
        console.log("DEBUG: Uploading file...");
        await defaultFieldsFile.loadFromFile(file, parseExcelFile);

        const tableBody = document.getElementById('defaultFieldsTableBody');
        if (!tableBody) {
            console.error("DEBUG: Table body element not found.");
            return;
        }

        console.log("DEBUG: Generating table rows after file upload...");
        defaultFieldsFile.generateTableRows(tableBody);

        createNotification("Excel file uploaded successfully.");
    } catch (error) {
        console.error("DEBUG: Error uploading Excel file:", error);
        createNotification("Error uploading Excel file.");
    }
});

// Helper function to parse Excel files
async function parseExcelFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            const headers = json[0];
            const result = {};
            headers.forEach((header) => {
                result[header] = json.slice(1).map((row) => row[headers.indexOf(header)]);
            });

            console.log("DEBUG: Parsed Excel data:", result);
            resolve(result);
        };
        reader.onerror = (error) => {
            console.error("DEBUG: Error reading Excel file:", error);
            reject(error);
        };
        reader.readAsArrayBuffer(file);
    });
}