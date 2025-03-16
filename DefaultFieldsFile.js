// ==============================
// Default Fields
// ==============================

import { createNotification } from "./utils.js";


// ==============================
// DefaultFieldsFile Class
// ==============================

class DefaultFieldsFile {
    constructor() {
        this.data = []; // Stores the matrix of data (rows and columns)
        this.headers = []; // Stores the headers extracted from the data
        this.tableBody = document.getElementById('defaultFieldsTableBody'); // Table body element
        this.init();
    }

    // Initialize the class by loading data and rendering the table
    async init() {
        try {
            // Load data from the server
            await this.loadDefaultFieldsFile('/api/load-data-DefaulFieldsFile');
            await this.loadDefaultFields('/api/load-data-DefaulFields');

            // Extract headers
            this.extractHeaders();

            // Render the table
            this.renderTable();

            // Attach event listeners for filtering
            this.attachEventListeners();
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

            // Populate the table with mappings (if needed)
            this.populateTableWithMappings(mappings);
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

        console.log("Table Rendered Successfully.");
    }

    // Populate the table with mappings (optional)
    populateTableWithMappings(mappings) {
        if (!Array.isArray(mappings)) {
            console.warn("Invalid mappings provided. Expected an array.");
            return;
        }

        mappings.forEach((mapping, index) => {
            const row = this.tableBody.children[index];
            if (!row) return;

            const headerDropdown = row.querySelector('td:nth-child(1) select');
            const searchableDropdownInput = row.querySelector('td:nth-child(2) input');

            if (headerDropdown && searchableDropdownInput) {
                headerDropdown.value = mapping.header1 || '';
                searchableDropdownInput.value = mapping.value || '';
            }
        });
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
        // Handle focusin events to populate the searchable dropdown
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
// Initialize the Application
// ==============================

document.addEventListener('DOMContentLoaded', () => {
    const defaultFieldsFile = new DefaultFieldsFile();
});