// frontend.js

import { renderTable, createNotification } from "./utils.js";

// Import the initialized instances
// Import the initialized instances
import { 
    inputFrame, 
    outputFrame, 
    mapping, 
    activeVlookups, 
    Vlookup as VlookupClass, // Rename the Vlookup class to avoid conflicts
    vlookupManager // Use the renamed instance from instances.js
} from "./instances.js";
// Track the DataTables instance globally for both sections
let dataTableInstance = null;

// Get all navigation items and section wrappers
const navItems = document.querySelectorAll('.nav-item');
const sectionWrappers = document.querySelectorAll('.section-wrapper');

// Function to activate a section wrapper
function activateSection(sectionId) {
    // Remove 'active' class from all navigation items
    navItems.forEach(navItem => navItem.classList.remove('active'));
    // Hide all section wrappers
    sectionWrappers.forEach(wrapper => wrapper.classList.remove('active'));
    // Activate the selected navigation item
    const activeNavItem = document.querySelector(`.nav-item[data-section="${sectionId}"]`);
    if (activeNavItem) {
        activeNavItem.classList.add('active');
    }
    // Show the corresponding section wrapper
    const activeWrapper = document.getElementById(`${sectionId}-wrapper`);
    if (activeWrapper) {
        activeWrapper.classList.add('active');
    }
}

// Add click event listeners to navigation items
navItems.forEach(navItem => {
    navItem.addEventListener('click', () => {
        const sectionId = navItem.getAttribute('data-section');
        activateSection(sectionId);
    });
});

// Initialize with the first section as active
document.addEventListener('DOMContentLoaded', () => {
    activateSection('input'); // Default active section
});

document.getElementById('fileSave')?.addEventListener('click', async () => {
    console.log("Current state of InputFrame:", {
        headers: inputFrame.headers,
        data: inputFrame.data,
    });

    if (inputFrame.data.length === 0) {
        console.warn("No data to save. Please load a file first.");
        return;
    }

    try {
        await inputFrame.saveToServer("/api/save-data-InputFrame");
        createNotification("File saved to server successfully!");
    } catch (error) {
        console.error("Error saving to server:", error.message);
        // createNotification("Error saving file to server.");
    }
});


// Save Button - Adds a loading spinner effect for Input section
document.getElementById('fileSave')?.addEventListener('click', function () {
    const fileSave = document.getElementById('fileSave');
    if (!fileSave) return;

    fileSave.innerHTML = '<span class="loader"></span> Saving...';

    setTimeout(() => {
        fileSave.innerHTML = "Save";

        // Save the processed data as a JSON file
        // inputFrame.saveToJsonFile("InputFrame.json");

        // Show notification
        // createNotification("File saved successfully!");
    }, 1500);
});

// Discard Button - Clears table content for Input section
document.getElementById('fileDiscard')?.addEventListener('click', function () {
    const table = document.getElementById('excelTable');
    if (!table) return;
    const thead = table.querySelector("thead");
    const tbody = table.querySelector("tbody");

    // Clear both the header and body of the table
    thead.innerHTML = "";
    tbody.innerHTML = "";

    // Destroy existing DataTables instance if it exists
    if (dataTableInstance) {
        dataTableInstance.clear(); // Clear the data from the table
        dataTableInstance.destroy(true); // Fully destroy the instance
        dataTableInstance = null; // Reset the reference
    }

    // Show notification
    createNotification("File discarded.");
    // Refresh the page after a short delay
    setTimeout(() => {
        window.location.reload(); // Reload the page
    }, 1000); // Delay of 1 second before refreshing
});

// Save Button - Adds a loading spinner effect for Output section
document.getElementById('outputFileSave')?.addEventListener('click', async function () {
    const outputFileSave = document.getElementById('outputFileSave');
    if (!outputFileSave) return;

    // Show loading spinner
    outputFileSave.innerHTML = '<span class="loader"></span> Saving...';

    try {
        // Save the current data to the server
        await outputFrame.saveToServer("api/save-data-OutputFrame");

        // Update the button text and show success notification
        outputFileSave.innerHTML = "Save";
        createNotification("File saved to server successfully!");
    } catch (error) {
        // Handle errors and show an error notification
        console.error("Error saving file to server:", error.message);
        outputFileSave.innerHTML = "Save";
        // createNotification("Error saving file to server. Please try again.");
    }
});

document.getElementById('fileDiscard')?.addEventListener('click', function () {
    const table = document.getElementById('excelTable');
    if (!table) return;

    const thead = table.querySelector("thead");
    const tbody = table.querySelector("tbody");

    // Clear both the header and body of the table
    thead.innerHTML = "";
    tbody.innerHTML = "";

    // Destroy existing DataTables instance if it exists
    if (dataTableInstances['excelTable']) {
        dataTableInstances['excelTable'].clear(); // Clear the data from the table
        dataTableInstances['excelTable'].destroy(true); // Fully destroy the instance
        dataTableInstances['excelTable'] = null; // Reset the reference
    }

    // Show notification
    createNotification("File discarded.");
});

document.getElementById('addVlookupButtonImport')?.addEventListener('click', async () => {
    const dropdown = document.getElementById('vlookupHeaderDropdown');
    const selectedHeader = dropdown.value;

    if (!selectedHeader) {
        createNotification("Please select an OutputFrame header.");
        return;
    }

    // Trigger file input dialog
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.xlsx,.xls';

    fileInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            // Parse the uploaded Excel file
            const reader = new FileReader();

            reader.onload = async (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: "array" });
                    const sheetName = workbook.SheetNames[0];
                    const sheet = workbook.Sheets[sheetName];

                    // Convert the sheet to JSON
                    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

                    // Extract headers and data
                    const headers = jsonData[0];
                    const rows = jsonData.slice(1).map(row => {
                        const rowData = {};
                        headers.forEach((header, index) => {
                            rowData[header] = row[index];
                        });
                        return rowData;
                    });

                    // Save the JSON data in the VlookupManager
                    vlookupManager.addVlookup(selectedHeader, { headers, rows });

                    createNotification(`Excel file imported and saved for header: ${selectedHeader}`);
                } catch (error) {
                    console.error("Error processing Excel file:", error);
                    createNotification("Error importing Excel file. Please try again.");
                }
            };

            reader.onerror = () => {
                console.error("Error reading file.");
                createNotification("Error reading file.");
            };

            reader.readAsArrayBuffer(file);
        } catch (error) {
            console.error("Error uploading file:", error);
            createNotification("Error uploading file. Please try again.");
        }
    });

    fileInput.click(); // Open file selection dialog
});