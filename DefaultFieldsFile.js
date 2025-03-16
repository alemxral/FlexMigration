// ==============================
// Default Fields
// ==============================

import { createDropdown, createSearchableDropdown,createNotification,createDropdownWithEmpty } from "./utils.js";

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

    async loadFromServer(apiEndpoint) {
        try {
            const response = await fetch(apiEndpoint);
            if (!response.ok) {
                throw new Error(`Failed to load Default Fields data: ${response.status}`);
            }

            const loadedData = await response.json();

            // Validate the structure of the loaded data
            if (!loadedData || typeof loadedData !== 'object') {
                throw new Error("Invalid data structure in loaded JSON.");
            }

            this.data = loadedData;
            this.headers = Object.keys(this.data); // Extract headers
            console.log("Default Fields data loaded from server:", this.data);
            return this.data;
        } catch (error) {
            console.error("Error loading Default Fields data:", error);
            throw new Error("Error loading Default Fields data. Please try again.");
        }
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

    // Populate a Searchable Dropdown with Options
    populateSearchableDropdown(dropdownContainer, options) {
        const input = dropdownContainer.querySelector('input');
        const ul = dropdownContainer.querySelector('ul');

        if (!input || !ul) {
            console.error("Invalid dropdown container structure.");
            return;
        }

        // Clear previous options
        ul.innerHTML = '';

        // Validate options
        if (!Array.isArray(options)) {
            console.error("Invalid options provided for searchable dropdown.");
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

            // Add Event Listeners for Filtering
            header1Dropdown.addEventListener('change', () => this.updateValuesDropdown(row));
            valuesDropdown.querySelector('input').addEventListener('input', () => this.updateValuesDropdown(row));

            tableBody.appendChild(row);
        }

        console.log("DEBUG: Table rows generated successfully.");
    }
}

// ==============================
// Event Listeners
// ==============================

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
        // Step 1: Fetch DefaultFieldsFile.json to load headers and initial data
        const response1 = await fetch('/api/load-data-DefaulFieldsFile');
        if (!response1.ok) {
            throw new Error(`Failed to load Default Fields data: ${response1.status}`);
        }
        const defaultFieldsFileData = await response1.json();
        console.log("Default Fields File Data Loaded:", defaultFieldsFileData);

        // Validate and extract headers using Object.keys
        const headers = Object.keys(defaultFieldsFileData); // Extract headers dynamically
        if (!headers || !Array.isArray(headers) || headers.length === 0) {
            console.error("Error: Headers are missing or invalid in DefaultFieldsFile.json");
            createNotification("Error loading headers. Please check the uploaded file.");
            return;
        }

        // Step 2: Fetch the pairs of values (header1 and value)
        const response2 = await fetch('/api/load-data-DefaulFields');
        if (!response2.ok) {
            throw new Error(`Failed to load Default Fields mappings: ${response2.status}`);
        }
        const defaultFieldsMappingsResponse = await response2.json();

        // Ensure the mappings are an array
        const defaultFieldsMappings = Array.isArray(defaultFieldsMappingsResponse)
            ? defaultFieldsMappingsResponse
            : defaultFieldsMappingsResponse.mappings || [];

        console.log("Default Fields Mappings Loaded:", defaultFieldsMappings);

        // Step 3: Clear previous content
        const tableBody = document.getElementById('defaultFieldsTableBody');
        if (!tableBody) {
            throw new Error("Table body element not found.");
        }
        tableBody.innerHTML = ''; // Clear previous rows

        // Step 4: Populate the table with the loaded data
        defaultFieldsMappings.forEach((mapping, index) => {
            const row = document.createElement('tr');

            // Column 1: Header 1 (Dropdown)
            const header1Cell = document.createElement('td');
            const header1Dropdown = createDropdownWithEmpty(headers); // Use headers extracted from DefaultFieldsFile.json
            header1Dropdown.value = mapping.header1 || ''; // Pre-select the value from the mapping
            header1Cell.appendChild(header1Dropdown);
            row.appendChild(header1Cell);

            // Column 2: Values (Input Field)
            const valuesCell = document.createElement('td');
            const valuesInput = document.createElement('input');
            valuesInput.type = 'text';
            valuesInput.value = mapping.value || ''; // Populate the input field with the corresponding value
            valuesCell.appendChild(valuesInput);
            row.appendChild(valuesCell);

            tableBody.appendChild(row);
        });

        createNotification("Default Fields data loaded successfully!");
    } catch (error) {
        console.error("Error loading Default Fields data:", error);
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


// Save Button - Save Default Fields Mapping to JSON via Server
document.getElementById('saveDefaultFieldsButton')?.addEventListener('click', async () => {
    try {
        const tableRows = document.querySelectorAll('#defaultFieldsTableBody tr');
        const defaultFieldsData = [];

        // Collect data from the table
        tableRows.forEach((row) => {
            const header1 = row.querySelector('td:nth-child(1) select')?.value || '';
            const value = row.querySelector('td:nth-child(2) input')?.value || '';

            defaultFieldsData.push({
                header1,
                value,
            });
        });

        console.log("Default Fields Data to Save:", defaultFieldsData);

        // Send the data to the server
        const response = await fetch('/api/save-data-DefaulFields', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(defaultFieldsData),
        });

        if (!response.ok) {
            throw new Error(`Failed to save Default Fields data: ${response.status}`);
        }

        const result = await response.json();
        console.log("Default Fields data saved successfully:", result);
        createNotification("Default Fields data saved successfully!");
    } catch (error) {
        console.error("Error saving Default Fields data:", error);
        createNotification("Error saving Default Fields data. Please try again.");
    }
});


// ==============================
// Helper Functions
// ==============================

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