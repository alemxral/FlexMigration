// frontend.js

import { renderTable, createNotification } from "./utils.js";

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

// Save Button - Adds a loading spinner effect for Input section
document.getElementById('fileSave')?.addEventListener('click', function () {
    const fileSave = document.getElementById('fileSave');
    if (!fileSave) return;
    fileSave.innerHTML = '<span class="loader"></span> Saving...';
    setTimeout(() => {
        fileSave.innerHTML = "Save";
        createNotification("File saved successfully!");
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
document.getElementById('outputFileSave')?.addEventListener('click', function () {
    const outputFileSave = document.getElementById('outputFileSave');
    if (!outputFileSave) return;
    outputFileSave.innerHTML = '<span class="loader"></span> Saving...';
    setTimeout(() => {
        outputFileSave.innerHTML = "Save";
        createNotification("File saved successfully!");
    }, 1500);
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