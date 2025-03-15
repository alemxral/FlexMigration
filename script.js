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

export function refreshAndActivateTab(sectionId) {
    // Store the tab identifier in sessionStorage
    sessionStorage.setItem('activeSection', sectionId);

    // Reload the page
    window.location.reload();
}

document.addEventListener('DOMContentLoaded', async () => {
    // Retrieve the active section identifier from sessionStorage
    const activeSectionId = sessionStorage.getItem('activeSection');

    if (activeSectionId) {
        // Activate the stored section
        activateSection(activeSectionId);

        // Clear the stored section identifier after activation
        sessionStorage.removeItem('activeSection');
    } else {
        // Default to activating the 'input' section
        activateSection('input');
    }

    // Special handling for the 'vlookup' section
    if (activeSectionId === 'vlookup') {
        try {
            // Ensure the VLOOKUP section is initialized
            if (!isVlookupInitialized) {
                await loadVlookupsFromServer(); // Load VLOOKUPs from the server
                populateVlookupDropdown(); // Populate the dropdown with OutputFrame headers
                isVlookupInitialized = true; // Mark the VLOOKUP section as initialized
            }

            // Update the active VLOOKUPs list
            updateActiveVlookupsList();
        } catch (error) {
            console.error("Error initializing VLOOKUP section:", error);
            createNotification("Error loading headers for VLOOKUP.");
        }
    }
});




// Add click event listeners to navigation items
navItems.forEach(navItem => {
    navItem.addEventListener('click', () => {
        const sectionId = navItem.getAttribute('data-section');
        activateSection(sectionId);
    });
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

