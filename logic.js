// logic.js

// Import the initialized instances
import { inputFrame, outputFrame, mapping, activeVlookups } from "./instances.js";

// Import shared functions from utils.js
import { renderTable, createNotification } from "./utils.js";



console.log("InputFrame and OutputFrame loaded successfully!");

// Track whether the mapping table has been initialized
let isMappingInitialized = false;

let isInputTableLoaded = false;
let isOutputTableLoaded = false;

// Function to check if both tables are loaded and render the mapping table
function checkAndRenderMappingTable() {
    if (isInputTableLoaded && isOutputTableLoaded) {
        renderMappingTable();
    }
}

// Update the load functions to set flags and trigger mapping table rendering
async function loadAndRenderInputTable() {
    try {
        const response = await fetch("/api/load-inputframe");
        if (!response.ok) {
            throw new Error(`Failed to load InputFrame.json: ${response.status}`);
        }
        const inputData = await response.json();

        inputFrame.headers = inputData.headers || [];
        inputFrame.data = inputData.data || [];

        renderTable(inputFrame.data, inputFrame.headers, 'excelTable');

        isInputTableLoaded = true;
        checkAndRenderMappingTable();

        console.log("Input table rendered successfully with data from InputFrame.json");
    } catch (error) {
        console.error("Error loading InputFrame.json:", error.message);
        createNotification("No InputFrame found. Please upload one.");
    }
}

async function loadAndRenderOutputTable() {
    try {
        const response = await fetch("/api/load-outputframe");
        if (!response.ok) {
            throw new Error(`Failed to load OutputFrame.json: ${response.status}`);
        }
        const outputData = await response.json();

        outputFrame.headers = outputData.headers || [];
        outputFrame.data = outputData.data || [];

        renderTable(outputFrame.data, outputFrame.headers, 'outputExcelTable');

        isOutputTableLoaded = true;
        checkAndRenderMappingTable();

        console.log("Output table rendered successfully with data from OutputFrame.json");
    } catch (error) {
        console.error("Error loading OutputFrame.json:", error.message);
        createNotification("No OutputFrame found. Please upload one.");
    }
}


document.addEventListener('DOMContentLoaded', async () => {
    // Load and render the input table
    loadAndRenderInputTable();

    // Load and render the output table
    loadAndRenderOutputTable();
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

    // Check if headers are available
    if (inputHeaders.length === 0 || outputHeaders.length === 0) {
        console.warn("Cannot render mapping table: Missing headers from InputFrame or OutputFrame.");
        createNotification("Cannot render mapping table: Missing headers.");
        return;
    }

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
        inputSelect.appendChild(createEmptyOption('-- Select Input Header --'));
        inputHeaders.forEach((header) => {
            const option = document.createElement('option');
            option.value = header;
            option.textContent = header;
            inputSelect.appendChild(option);
        });
        inputSelect.value = '';
        inputCell.appendChild(inputSelect);

        // Create the Output Header column
        const outputCell = document.createElement('td');
        const outputSelect = document.createElement('select');
        outputSelect.className = 'header-select';
        outputSelect.appendChild(createEmptyOption('-- Select Output Header --'));
        outputHeaders.forEach((header) => {
            const option = document.createElement('option');
            option.value = header;
            option.textContent = header;
            outputSelect.appendChild(option);
        });
        outputSelect.value = '';
        outputCell.appendChild(outputSelect);

        // Append cells to the row
        row.appendChild(inputCell);
        row.appendChild(outputCell);

        // Append row to the table body
        tableBody.appendChild(row);
    }

    console.log("Mapping table rendered successfully.");
}

// Helper function to create an empty option for dropdowns
function createEmptyOption(text) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = text;
    return option;
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



// Handle file upload for the Output section
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
    } catch (error) {
        console.error("Error processing file:", error);
        createNotification("Error loading file. Please try again.");
    }
});

