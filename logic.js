// logic.js

// Import the initialized instances
import { inputFrame, outputFrame, mapping, activeVlookups } from "./instances.js";

// Import shared functions from utils.js
import { renderTable, createNotification } from "./utils.js";



console.log("InputFrame and OutputFrame loaded successfully!");

// Track whether the mapping table has been initialized
let isMappingInitialized = false;


// Function to fetch InputFrame.json from the server and render the table
// Function to fetch InputFrame.json from the server and render the table
async function loadAndRenderTableFromServer() {
    try {
        // Fetch the JSON file from the server
        const response = await fetch("/api/load-inputframe");
        if (!response.ok) {
            throw new Error(`Failed to load InputFrame.json: ${response.status}`);
        }

        // Parse the JSON response
        const jsonData = await response.json();

        // Extract headers and data from the JSON
        const headers = jsonData.headers || [];
        const data = jsonData.data || [];

        // Update the InputFrame instance with the fetched data
        inputFrame.headers = headers;
        inputFrame.data = data;

        // Optionally, update the OutputFrame instance as well (if needed)
        outputFrame.headers = headers; // Assuming the same headers for simplicity
        outputFrame.data = data;

        // Render the table using the parsed data
        renderTable(data, headers, 'excelTable');

        // Render the mapping table
        renderMappingTable();

        console.log("Table rendered successfully with data from InputFrame.json");
    } catch (error) {
        console.error("Error loading InputFrame.json:", error.message);
        createNotification("Error loading InputFrame.json. Please try again.");
    }
}

// Call this function when needed (e.g., on page load or button click)
document.addEventListener('DOMContentLoaded', () => {
    // Example: Load and render the table when the page loads
    loadAndRenderTableFromServer();
});

// Function to render the mapping table
function renderMappingTable() {
    const tableBody = document.getElementById('mappingTableBody');
    if (!tableBody) {
        console.error("Mapping table body not found.");
        return;
    }

    // Get headers from InputFrame and OutputFrame
    const inputHeaders = inputFrame.headers || [];
    const outputHeaders = outputFrame.headers || [];

    // Determine the maximum number of rows
    const maxRows = Math.max(inputHeaders.length, outputHeaders.length);

    // Clear previous content
    tableBody.innerHTML = '';

    // Generate rows for the mapping table
    for (let i = 0; i < maxRows; i++) {
        const row = document.createElement('tr');

        // Create the Input Header column
        const inputCell = document.createElement('td');
        const inputSelect = document.createElement('select');
        inputSelect.className = 'header-select';

        // Add an empty option as the default selection
        const inputEmptyOption = document.createElement('option');
        inputEmptyOption.value = '';
        inputEmptyOption.textContent = '-- Select Input Header --';
        inputSelect.appendChild(inputEmptyOption);

        // Populate the dropdown with InputFrame headers
        inputHeaders.forEach((header) => {
            const option = document.createElement('option');
            option.value = header;
            option.textContent = header;
            inputSelect.appendChild(option);
        });

        // Set the default value to nothing (empty string)
        inputSelect.value = '';
        inputCell.appendChild(inputSelect);

        // Create the Output Header column
        const outputCell = document.createElement('td');
        const outputSelect = document.createElement('select');
        outputSelect.className = 'header-select';

        // Add an empty option as the default selection
        const outputEmptyOption = document.createElement('option');
        outputEmptyOption.value = '';
        outputEmptyOption.textContent = '-- Select Output Header --';
        outputSelect.appendChild(outputEmptyOption);

        // Populate the dropdown with OutputFrame headers
        outputHeaders.forEach((header) => {
            const option = document.createElement('option');
            option.value = header;
            option.textContent = header;
            outputSelect.appendChild(option);
        });

        // Set the default value to nothing (empty string)
        outputSelect.value = '';
        outputCell.appendChild(outputSelect);

        // Append cells to the row
        row.appendChild(inputCell);
        row.appendChild(outputCell);

        // Append row to the table body
        tableBody.appendChild(row);
    }
}

// Save Button - Save mappings
document.getElementById('saveMapping')?.addEventListener('click', () => {
    const rows = document.querySelectorAll('#mappingTableBody tr');
    mapping.clearMappings(); // Clear existing mappings

    rows.forEach((row) => {
        const inputHeader = row.querySelector('td:nth-child(1) select').value;
        const outputHeader = row.querySelector('td:nth-child(2) select').value;
        if (inputHeader && outputHeader) {
            mapping.addMapping(inputHeader, outputHeader);
        }
    });

    console.log("Mappings saved:", mapping.getMappings());
    createNotification("Mapping saved successfully!");
});




// Handle file upload and display in the table for the Input section
document.getElementById('fileInput')?.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
        // Load the file into the InputFrame instance
        await inputFrame.loadFromFile(file);

        // Show file details
        const fileInfo = document.getElementById('fileInfo');
        if (fileInfo) {
            fileInfo.innerHTML = `📄 <strong>File:</strong> ${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
        }

        // Display headers
        inputFrame.displayHeaders();

        // Render the table using the parsed data
        renderTable(inputFrame.getData(), inputFrame.headers, 'excelTable');
    } catch (error) {
        console.error("Error processing file:", error);
        createNotification("Error loading file. Please try again.");
    }
});

// Handle file upload and display in the table for the Output section
document.getElementById('outputFileInput')?.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
        // Load the file into the OutputFrame instance
        await outputFrame.loadFromFile(file);

        // Show file details
        const fileInfo = document.getElementById('outputFileInfo');
        if (fileInfo) {
            fileInfo.innerHTML = `📄 <strong>File:</strong> ${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
        }

        // Display headers
        outputFrame.displayHeaders();

        // Render the table using the parsed data
        renderTable(outputFrame.getData(), outputFrame.headers, 'outputExcelTable');
        renderMappingTable();
    } catch (error) {
        console.error("Error processing file:", error);
        createNotification("Error loading file. Please try again.");
    }
});