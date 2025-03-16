// ==============================
// Default Fields
// ==============================

import { createNotification } from "./utils.js";


// ==============================
// DefaultFieldsFile Class
// ==============================

// ==============================
// DefaultFieldsFile Class
// ==============================

class DefaultFieldsFile {
    constructor() {
        this.data = []; // Stores the matrix of data (rows and columns)
        this.headers = []; // Stores the headers extracted from the data
        this.tableBody = document.getElementById('defaultFieldsTableBody'); // Table body element
        this.mappings = []; // Stores the mappings loaded from the server
        this.init();
    }

    // Initialize the class by loading data and rendering the table
    async init() {
        try {
            // Step 1: Load data from the server
            await this.loadDefaultFieldsFile('/api/load-data-DefaulFieldsFile');
            await this.loadDefaultFields('/api/load-data-DefaulFields');

            // Step 2: Extract headers
            this.extractHeaders();

            // Step 3: Render the table
            this.renderTable();

            // Step 4: Attach event listeners for filtering
            this.attachEventListeners();

            // Step 5: Populate table values from loaded data
            this.populateTableWithMappings(this.mappings);

            console.log("Initialization completed successfully.");
        } catch (error) {
            console.error("Error initializing DefaultFieldsFile:", error);
            createNotification("Error loading data. Please try again.");
        }
    }

    // Load DefaultFieldsFile.json from the server
    async loadDefaultFieldsFile(apiEndpoint) {
        try {
            const response = await fetch(apiEndpoint);
            if (!response.ok) {
                throw new Error(`Failed to load DefaultFieldsFile.json: ${response.status}`);
            }
            const rawData = await response.json();

            // Convert JSON data into a matrix (array of arrays)
            this.data = Object.keys(rawData).map((header) => [header, ...rawData[header]]);
            console.log("DefaultFieldsFile Data Loaded:", this.data);
        } catch (error) {
            console.error("Error loading DefaultFieldsFile.json:", error);
            throw new Error("Error loading DefaultFieldsFile.json. Please check the server.");
        }
    }

    // Load DefaultFields.json from the server
    async loadDefaultFields(apiEndpoint) {
        try {
            const response = await fetch(apiEndpoint);
            if (!response.ok) {
                throw new Error(`Failed to load DefaultFields.json: ${response.status}`);
            }
            const mappings = await response.json();
            console.log("DefaultFields Mappings Loaded:", mappings);

            // Store mappings in the class
            this.mappings = mappings;
        } catch (error) {
            console.error("Error loading DefaultFields.json:", error);
            throw new Error("Error loading DefaultFields.json. Please check the server.");
        }
    }

    // Extract headers from the loaded data
    extractHeaders() {
        if (this.data.length === 0) {
            console.warn("No data available to extract headers.");
            return;
        }

        // Extract headers from the first column of the matrix
        this.headers = this.data.map(row => row[0]);
        console.log("Headers Extracted:", this.headers);
    }

    // Render the table with two columns: Header Dropdown and Searchable Dropdown
    renderTable() {
        if (!this.tableBody) {
            console.error("Table body element not found.");
            return;
        }

        // Clear previous content
        this.tableBody.innerHTML = '';

        // Generate rows based on the number of headers
        if (this.headers.length > 0) {
            this.headers.forEach((header) => {
                const row = document.createElement('tr');

                // Column 1: Header Dropdown
                const headerCell = document.createElement('td');
                const headerDropdown = this.createDropdown(this.headers); // Create dropdown with headers
                headerDropdown.value = header; // Pre-select the current header
                headerCell.appendChild(headerDropdown);
                row.appendChild(headerCell);

                // Column 2: Searchable Dropdown
                const valuesCell = document.createElement('td');
                const searchableDropdown = this.createSearchableDropdown(); // Create searchable dropdown
                valuesCell.appendChild(searchableDropdown);
                row.appendChild(valuesCell);

                this.tableBody.appendChild(row);
            });
        } else {
            console.warn("Headers are empty. Generating 20 default rows.");

            // Generate 20 default rows if no headers are available
            for (let i = 0; i < 20; i++) {
                const row = document.createElement('tr');

                // Column 1: Placeholder Header Dropdown
                const headerCell = document.createElement('td');
                const placeholderDropdown = this.createDropdown(['-- No Headers --']);
                headerCell.appendChild(placeholderDropdown);
                row.appendChild(headerCell);

                // Column 2: Placeholder Searchable Dropdown
                const valuesCell = document.createElement('td');
                const placeholderInput = this.createSearchableDropdown();
                valuesCell.appendChild(placeholderInput);
                row.appendChild(valuesCell);

                this.tableBody.appendChild(row);
            }
        }

        console.log("Table Rendered Successfully.");
    }

    // Populate the table with mappings
    populateTableWithMappings(mappings) {
        if (!Array.isArray(mappings)) {
            console.warn("Invalid mappings provided. Expected an array.");
            return;
        }

        // Debugging: Log the mappings to verify their structure
        console.log("Populating Table with Mappings:", mappings);

        // Get all rows in the table body
        let tableRows = document.querySelectorAll('#defaultFieldsTableBody tr');

        // Debugging: Log the number of rows found in the table
        console.log(`Number of rows found in #defaultFieldsTableBody: ${tableRows.length}`);

        // If no rows are found, dynamically generate 20 rows based on headers
        if (tableRows.length === 0) {
            console.warn("No rows found in #defaultFieldsTableBody. Generating 20 rows dynamically.");

            // Ensure headers are available
            if (this.headers.length === 0) {
                console.error("Headers are not available. Cannot generate rows.");
                createNotification("Error: Headers are missing. Please check the data source.");
                return;
            }

            console.log("Available headers:", this.headers);

            // Generate 20 rows dynamically
            const tbody = document.getElementById('defaultFieldsTableBody');
            for (let i = 0; i < 20; i++) {
                const row = document.createElement('tr');

                // Column 1: Header Dropdown
                const headerCell = document.createElement('td');
                const headerDropdown = this.createDropdown(this.headers); // Create dropdown with headers
                headerCell.appendChild(headerDropdown);
                row.appendChild(headerCell);

                // Column 2: Searchable Dropdown
                const valuesCell = document.createElement('td');
                const searchableDropdown = this.createSearchableDropdown(); // Create searchable dropdown
                valuesCell.appendChild(searchableDropdown);
                row.appendChild(valuesCell);

                tbody.appendChild(row);
            }

            // Re-fetch rows after generating them
            tableRows = document.querySelectorAll('#defaultFieldsTableBody tr');
            console.log(`Generated ${tableRows.length} rows dynamically.`);
        }

        // Loop through each row in the table
        tableRows.forEach((row, index) => {
            // Debugging: Log the current row being processed
            console.log(`Processing row ${index + 1}:`, row);

            // Get references to the header dropdown and value input fields
            const headerDropdown = row.querySelector('td:nth-child(1) select');
            const valueInput = row.querySelector('td:nth-child(2) input');

            // Debugging: Log whether the elements were found
            console.log(
                `Row ${index + 1}: Header Dropdown = ${headerDropdown ? "Found" : "Not Found"}, Value Input = ${valueInput ? "Found" : "Not Found"}`
            );

            // Ensure both elements exist
            if (!headerDropdown || !valueInput) {
                console.warn(`Missing elements in table row at index: ${index}`);
                return;
            }

            // Get the selected header from the dropdown
            const selectedHeader = headerDropdown.value;

            // Normalize the selected header for comparison
            const normalizedHeader = selectedHeader.trim().toLowerCase();

            // Debugging: Log the selected header for each row
            console.log(`Processing row ${index + 1}: Selected Header = "${selectedHeader}"`);

            // Find a matching mapping in the mappings array using flexible matching
            const match = mappings.find((item) => {
                const mappingHeader = item.header1.trim().toLowerCase();
                const isPartialMatch = mappingHeader.includes(normalizedHeader) || normalizedHeader.includes(mappingHeader);
                const isValidValue = item.value !== '';

                // Debugging: Log the comparison details for each mapping
                console.log(
                    `Comparing "${normalizedHeader}" with "${mappingHeader}": Partial Match = ${isPartialMatch}, Valid Value = ${isValidValue}`
                );

                return isPartialMatch && isValidValue;
            });

            if (match) {
                // If a match is found, populate the value input field
                console.log(`Match found for header: ${selectedHeader}, value: ${match.value}`);
                valueInput.value = match.value; // Set the value in the second column
            } else {
                // If no match is found, log a warning
                console.warn(`No match found for header: ${selectedHeader}`);
            }
        });

        console.log("Table Values Populated Successfully.");
    }

    // Create a dropdown with options
    createDropdown(options, placeholder = '-- Select Header --') {
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

    // Create a searchable dropdown
    createSearchableDropdown() {
        const container = document.createElement('div');
        container.className = 'searchable-dropdown';

        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Search...';
        container.appendChild(input);

        const ul = document.createElement('ul');
        container.appendChild(ul);

        return container;
    }

    // Attach event listeners for filtering
    attachEventListeners() {
        this.tableBody.addEventListener('focusin', (event) => {
            const target = event.target;

            // Check if the focused element is a searchable dropdown input
            if (target.tagName === 'INPUT' && target.closest('.searchable-dropdown')) {
                const row = target.closest('tr');
                const header1Dropdown = row.querySelector('td:nth-child(1) select');
                const selectedHeader = header1Dropdown.value;

                if (selectedHeader) {
                    this.populateSearchableDropdown(row, selectedHeader);
                }
            }
        });

        // Prevent clicks inside the dropdown from propagating to the document
        document.addEventListener('click', (event) => {
            const dropdowns = document.querySelectorAll('.searchable-dropdown');

            dropdowns.forEach((dropdown) => {
                const ul = dropdown.querySelector('ul');

                // If the click is inside the dropdown, do nothing
                if (dropdown.contains(event.target)) {
                    return;
                }

                // Otherwise, hide the dropdown
                if (ul.style.display === 'block') {
                    ul.style.display = 'none';
                }
            });
        });
    }

    // Populate the searchable dropdown with filtered options
    populateSearchableDropdown(row, selectedHeader) {
        const searchableDropdown = row.querySelector('.searchable-dropdown');
        const input = searchableDropdown.querySelector('input');
        const ul = searchableDropdown.querySelector('ul');

        if (!input || !ul) {
            console.error("Invalid dropdown container structure.");
            return;
        }

        // Clear previous options
        ul.innerHTML = '';

        // Find the row in the matrix corresponding to the selected header
        const selectedRow = this.data.find(row => row[0] === selectedHeader);
        if (!selectedRow) {
            console.warn(`No data found for header: ${selectedHeader}`);
            return;
        }

        // Get unique values (excluding the header itself)
        const values = [...new Set(selectedRow.slice(1))];

        // Filter values based on search input
        const searchTerm = input.value.toLowerCase();
        values
            .filter(value => String(value).toLowerCase().includes(searchTerm))
            .forEach((value) => {
                const li = document.createElement('li');
                li.textContent = value;

                // Handle option selection
                li.addEventListener('click', () => {
                    input.value = value;
                    ul.style.display = 'none';
                });

                ul.appendChild(li);
            });

        // Show the dropdown
        ul.style.display = 'block';
    }
}



// ==============================
// Utility Functions
// ==============================


// Parse Excel files using SheetJS (XLSX library)
async function parseExcelFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            // Convert JSON array to an object with headers as keys
            const headers = json[0];
            const result = {};
            headers.forEach((header) => {
                result[header] = json.slice(1).map((row) => row[headers.indexOf(header)]);
            });

            resolve(result);
        };
        reader.onerror = (error) => {
            reject(error);
        };
        reader.readAsArrayBuffer(file);
    });
}

// ==============================
// Initialize the Application
// ==============================


// Event Listeners
// ==============================

document.addEventListener('DOMContentLoaded', () => {
    const defaultFieldsFile = new DefaultFieldsFile();

    // Save Button - Save Excel File as JSON to Server
    document.getElementById('saveToJsonButton')?.addEventListener('click', async () => {
        const excelFileUpload = document.getElementById('excelFileUpload');
        const file = excelFileUpload.files[0];

        if (!file) {
            createNotification("Please upload an Excel file.");
            return;
        }

        try {
            const jsonData = await parseExcelFile(file);
            console.log("Parsed Excel Data:", jsonData);

            // Send the JSON data to the server
            await defaultFieldsFile.saveToServer('/api/save-data-DefaulFieldsFile', jsonData);
        } catch (error) {
            console.error("Error parsing or saving Excel file:", error);
            createNotification("Data saved from excelfile");
        }
    });

    // Save Default Fields Button - Save Table State to Server
    document.getElementById('saveDefaultFieldsButton')?.addEventListener('click', async () => {
        try {
            // Collect data from the table
            const tableData = defaultFieldsFile.collectTableData();
            console.log("Table Data to Save:", tableData);

            // Send the table data to the server
            await defaultFieldsFile.saveToServer('/api/save-data-DefaulFields', tableData);
        } catch (error) {
            console.error("Error saving table data:", error);
            createNotification("Saving data...");
        }
    });
});