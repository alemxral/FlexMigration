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
        refreshAndActivateTab("input");
    } catch (error) {
        console.error("Error saving to server:", error.message);
        // createNotification("Error saving file to server.");
        refreshAndActivateTab("input");
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
        
        refreshAndActivateTab("options");
    } catch (error) {
        // Handle errors and show an error notification
        console.error("Error saving file to server:", error.message);
        outputFileSave.innerHTML = "Save";
        refreshAndActivateTab("options");
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

// Modal functionality
document.addEventListener('DOMContentLoaded', () => {
    const addRuleButton = document.getElementById('addRuleButton');
    const addRuleModal = document.getElementById('addRuleModal');
    const closeModalButtons = document.querySelectorAll('.close-modal');
    const addRuleForm = document.getElementById('addRuleForm');
    const userDefinedRulesBody = document.getElementById('userDefinedRulesBody');

    // Open the modal
    addRuleButton.addEventListener('click', () => {
        addRuleModal.style.display = 'flex';
    });

    // Close the modal
    closeModalButtons.forEach(button => {
        button.addEventListener('click', () => {
            addRuleModal.style.display = 'none';
        });
    });

    // Close the modal when clicking outside of it
    window.addEventListener('click', (event) => {
        if (event.target === addRuleModal) {
            addRuleModal.style.display = 'none';
        }
    });

    // Handle form submission
    addRuleForm.addEventListener('submit', (event) => {
        event.preventDefault();

        // Get form data
        const ruleName = document.getElementById('ruleName').value.trim();
        const ruleDescription = document.getElementById('ruleDescription').value.trim();

        // Validate the form
        if (!ruleName || !ruleDescription) {
            alert('Please fill in all fields.');
            return;
        }

        // Create a new row for the table
        const newRow = document.createElement('tr');

        // Rule Name Cell
        const ruleNameCell = document.createElement('td');
        ruleNameCell.textContent = ruleName;
        newRow.appendChild(ruleNameCell);

        // Description Cell
        const descriptionCell = document.createElement('td');
        descriptionCell.textContent = ruleDescription;
        newRow.appendChild(descriptionCell);

        // Action Cell
        const actionCell = document.createElement('td');
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.className = 'delete-rule-button';
        deleteButton.addEventListener('click', () => {
            userDefinedRulesBody.removeChild(newRow);
        });
        actionCell.appendChild(deleteButton);
        newRow.appendChild(actionCell);

        // Append the new row to the table
        userDefinedRulesBody.appendChild(newRow);

        // Clear the form
        addRuleForm.reset();

        // Close the modal
        addRuleModal.style.display = 'none';

        // Optionally, display a success notification
        createNotification(`Rule "${ruleName}" added successfully!`);
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const generateButton = document.getElementById('generateButton');
    const progressContainer = document.getElementById('progressContainer');
    const progressFill = document.getElementById('progressFill');
    const progressStatus = document.getElementById('progressStatus');
    const checklistBox = document.getElementById('checklistBox');
    const sectionChecklist = document.getElementById('sectionChecklist');
    const downloadContainer = document.getElementById('downloadContainer');
    const downloadButton = document.getElementById('downloadButton');

    // Define sections to check
    const sections = [
        { name: "Input", status: "pending" },
        { name: "Mapping", status: "pending" },
        { name: "VLOOKUP", status: "pending" },
        { name: "FlexRules", status: "pending" }
    ];

    // Steps for the progress bar
    const steps = [
        { status: 'Checking data consistency...', progress: 20, sectionIndex: 0 },
        { status: 'Validating mappings...', progress: 40, sectionIndex: 1 },
        { status: 'Processing VLOOKUPs...', progress: 70, sectionIndex: 2 },
        { status: 'Applying FlexRules...', progress: 90, sectionIndex: 3 },
        { status: 'Finalizing export...', progress: 100 }
    ];

    let currentStep = 0;

    // Function to populate the checklist
    function populateChecklist() {
        sectionChecklist.innerHTML = '';
        sections.forEach((section, index) => {
            const listItem = document.createElement('li');
            listItem.className = `status-${section.status}`;
            listItem.innerHTML = `
                <span class="status-icon"></span>
                ${section.name} Section
            `;
            sectionChecklist.appendChild(listItem);
        });
    }

    // Generate Button Click Event
    generateButton.addEventListener('click', () => {
        // Hide the generate button and show the progress container
        generateButton.classList.add('hidden');
        progressContainer.classList.remove('hidden');
        checklistBox.classList.remove('hidden');

        // Populate the checklist
        populateChecklist();

        // Start the progress simulation
        simulateProgress();
    });

    // Simulate Progress Function
    function simulateProgress() {
        if (currentStep < steps.length) {
            const step = steps[currentStep];
            progressStatus.textContent = step.status;
            progressFill.style.width = `${step.progress}%`;

            // Update section status
            if (step.sectionIndex !== undefined) {
                sections[step.sectionIndex].status = "completed";
                populateChecklist(); // Refresh the checklist
            }

            currentStep++;
            setTimeout(simulateProgress, 1500); // Delay between steps
        } else {
            // Process complete, show the download container
            progressContainer.classList.add('hidden');
            downloadContainer.classList.remove('hidden');
        }
    }

    // Download Button Click Event
    downloadButton.addEventListener('click', () => {
        alert('Downloading Excel file...');
        // Replace this with actual file download logic
    });
});