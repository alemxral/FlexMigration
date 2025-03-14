import InputFrame from "./InputFrame.js";
import OutputFrame from "./OutputFrame.js";

// Initialize the InputFrame and OutputFrame instances
const inputFrame = new InputFrame();
const outputFrame = new OutputFrame();

console.log("InputFrame and OutputFrame loaded successfully!");

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

// Handle file upload and display in the table for the Options section
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

// Function to render the table
function renderTable(data, headers, tableId) {
    const table = document.getElementById(tableId);
    if (!table) {
        console.error(`Table element with ID "${tableId}" not found.`);
        return;
    }

    const thead = table.querySelector("thead");
    const tbody = table.querySelector("tbody");

    // Destroy existing DataTables instance if it exists
    if (dataTableInstance) {
        dataTableInstance.clear(); // Clear the data from the table
        dataTableInstance.destroy(true); // Fully destroy the instance
        dataTableInstance = null; // Reset the reference
    }

    // Clear previous content
    thead.innerHTML = "";
    tbody.innerHTML = "";

    // Create table header
    const headerRow = document.createElement("tr");
    headers.forEach(header => {
        const th = document.createElement("th");
        th.textContent = header;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    // Create table body
    data.forEach(row => {
        const tr = document.createElement("tr");
        headers.forEach(header => {
            const td = document.createElement("td");
            td.textContent = row[header] || ""; // Handle undefined or null values
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });

    // Reinitialize DataTables
    dataTableInstance = $(`#${tableId}`).DataTable({
        dom: '<"dt-buttons"Bf><"clear">lirtp',
        paging: true,
        autoWidth: true,
        buttons: [
            {
                extend: 'csv', // Include CSV export instead of Excel
                text: 'Export to CSV'
            }
        ]
    });
}

// Save Button - Adds a loading spinner effect for Input section
document.getElementById('fileSave')?.addEventListener('click', function () {
    const fileSave = document.getElementById('fileSave');
    if (!fileSave) return;

    fileSave.innerHTML = '<span class="loader"></span> Saving...';
    setTimeout(() => {
        fileSave.innerHTML = "Save";

        // Save the current data back to an Excel file
        inputFrame.saveToFile("input_output.xlsx");

        // Show notification
        createNotification("File saved successfully!");
    }, 1500);
});

// Save Button - Adds a loading spinner effect for Options section
document.getElementById('outputFileSave')?.addEventListener('click', function () {
    const outputFileSave = document.getElementById('outputFileSave');
    if (!outputFileSave) return;

    outputFileSave.innerHTML = '<span class="loader"></span> Saving...';
    setTimeout(() => {
        outputFileSave.innerHTML = "Save";

        // Save the current data back to an Excel file
        outputFrame.saveToFile("output_file.xlsx");

        // Show notification
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

// Discard Button - Clears table content for Options section
document.getElementById('outputFileDiscard')?.addEventListener('click', function () {
    const table = document.getElementById('outputExcelTable');
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

// Notification Panel Logic
document.addEventListener("DOMContentLoaded", function () {
    const notificationPanel = document.getElementById("notificationPanel");

    // Function to create and display notifications
    window.createNotification = function (message) {
        if (!notificationPanel) {
            console.warn("Notification panel not found.");
            return;
        }

        const notification = document.createElement("div");
        notification.className = "notification";
        notification.textContent = message;

        // Append notification to the panel
        notificationPanel.appendChild(notification);

        // Automatically remove the notification after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    };
});