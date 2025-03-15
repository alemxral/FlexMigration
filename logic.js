// Import the initialized instances
import { 
    inputFrame, 
    outputFrame, 
    mapping, 
    activeVlookups, 
    Vlookup as VlookupClass, // Rename the Vlookup class to avoid conflicts
    vlookupManager // Use the renamed instance from instances.js
} from "./instances.js";

// Import shared functions from utils.js
import { renderTable, createNotification } from "./utils.js";
import { refreshAndActivateTab } from "./script.js";

console.log("InputFrame and OutputFrame loaded successfully!");

// Track whether the mapping table has been initialized
let isMappingInitialized = false;
let isInputTableLoaded = false;
let isOutputTableLoaded = false;

// Preloader Functions
function showPreloader() {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        preloader.style.display = 'block';
    }
}

function hidePreloader() {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        preloader.style.display = 'none';
    }
}

// Function to check if both tables are loaded and render the mapping table
function checkAndRenderMappingTable() {
    if (isInputTableLoaded && isOutputTableLoaded) {
        renderMappingTable();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Retrieve the active tab identifier from sessionStorage
    const activeTabId = sessionStorage.getItem('activeTab');

    if (activeTabId) {
        // Find the corresponding nav item and activate it
        const navItem = document.querySelector(`[data-section="${activeTabId}"]`);
        if (navItem) {
            // Add an "active" class to the nav item (or trigger its click event)
            navItem.classList.add('active'); // Adjust this based on your styling
            navItem.click(); // Trigger the click event if needed

            // Optionally scroll to the active tab for better UX
            navItem.scrollIntoView({ behavior: 'smooth' });

            // Clear the stored tab identifier after activation
            sessionStorage.removeItem('activeTab');
        }
    }
});

// Update the load functions to set flags and trigger mapping table rendering
async function loadAndRenderInputTable() {
    showPreloader(); // Show preloader
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
    } finally {
        hidePreloader(); // Hide preloader
    }
}

export async function loadAndRenderOutputTable() {
    showPreloader(); // Show preloader
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
    } finally {
        hidePreloader(); // Hide preloader
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
    showPreloader(); // Show preloader
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
    hidePreloader(); // Hide preloader
});

// Handle file upload and display in the table for the Input section
document.getElementById('fileInput')?.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    showPreloader(); // Show preloader
    try {
        // Load the file into the InputFrame instance
        await inputFrame.loadFromFile(file);

        // Show file details
        const fileInfo = document.getElementById('fileInfo');
        if (fileInfo) {
            fileInfo.innerHTML = `📁 <strong>File:</strong> ${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
        }

        // Display headers
        inputFrame.displayHeaders();

        // Render the table using the parsed data
        renderTable(inputFrame.getData(), inputFrame.headers, 'excelTable');
    } catch (error) {
        console.error("Error processing file:", error);
        createNotification("Error loading file. Please try again.");
    } finally {
        hidePreloader(); // Hide preloader
    }
});

// Handle file upload for the Output section
document.getElementById('outputFileInput')?.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    showPreloader(); // Show preloader
    try {
        // Load the file into the OutputFrame instance
        await outputFrame.loadFromFile(file);

        // Show file details
        const fileInfo = document.getElementById('outputFileInfo');
        if (fileInfo) {
            fileInfo.innerHTML = `📁 <strong>File:</strong> ${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
        }

        // Display headers
        outputFrame.displayHeaders();

        // Render the table using the parsed data
        renderTable(outputFrame.getData(), outputFrame.headers, 'outputExcelTable');
    } catch (error) {
        console.error("Error processing file:", error);
        createNotification("Error loading file. Please try again.");
    } finally {
        hidePreloader(); // Hide preloader
    }
});

// Track whether the Vlookup section has been initialized
let isVlookupInitialized = false;

// Function to populate the dropdown with InputFrame headers
function populateVlookupDropdown() {
    const dropdown = document.getElementById('vlookupHeaderDropdown');
    if (!dropdown) {
        console.error("Dropdown element not found.");
        return;
    }

    // Clear previous options
    dropdown.innerHTML = '';

    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '-- Select InputFrame Header --'; // Updated text for InputFrame
    dropdown.appendChild(defaultOption);

    // Get headers from InputFrame
    const inputHeaders = inputFrame.headers || [];

    // Check if headers are available
    if (inputHeaders.length === 0) {
        console.warn("Cannot populate Vlookup dropdown: Missing headers from InputFrame.");
        createNotification("Cannot populate Vlookup dropdown: Missing headers.");
        return;
    }

    // Populate the dropdown with InputFrame headers
    inputHeaders.forEach((header) => {
        const option = document.createElement('option');
        option.value = header;
        option.textContent = header;
        dropdown.appendChild(option);
    });

    updateActiveVlookupsList();
}

async function saveVlookupsToServer() {
    showPreloader(); // Show preloader
    try {
        // Retrieve all VLOOKUPs from the VlookupManager
        const vlookups = vlookupManager.getAllVlookups();

        // Fetch existing VLOOKUPs from the server (if any)
        const response = await fetch('/api/load-data-VlookupManager');
        if (!response.ok) {
            throw new Error(`Failed to load VLOOKUP data: ${response.status}`);
        }
        const existingData = await response.json();

        // Merge existing data with the current VLOOKUPs
        const updatedData = { ...existingData, ...vlookups };

        // Send the updated data to the server
        const saveResponse = await fetch('/api/save-data-VlookupManager', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedData),
        });
        if (!saveResponse.ok) {
            throw new Error(`Failed to save VLOOKUP data: ${saveResponse.status}`);
        }
        console.log("VLOOKUP data saved successfully.");
        createNotification("VLOOKUP data saved successfully.");
    } catch (error) {
        console.error("Error saving VLOOKUP data:", error);
        createNotification("Error saving VLOOKUP data. Please try again.");
    } finally {
        hidePreloader(); // Hide preloader
    }
}

// Temporary storage for uploaded Excel data
let tempUploadedData = null;

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

        showPreloader(); // Show preloader
        try {
            // Display the uploaded file name
            const uploadedFileNameElement = document.getElementById('uploadedFileName');
            if (uploadedFileNameElement) {
                uploadedFileNameElement.textContent = `Uploaded file: ${file.name}`;
            }

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

                    // Store the parsed data temporarily
                    tempUploadedData = { headers, rows };
                    createNotification(`Excel file imported successfully.`);
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
        } finally {
            hidePreloader(); // Hide preloader
        }
    });

    fileInput.click(); // Open file selection dialog
});

document.getElementById('addVlookupButton')?.addEventListener('click', async () => {
    const dropdown = document.getElementById('vlookupHeaderDropdown');
    const selectedHeader = dropdown.value;
    if (!selectedHeader) {
        createNotification("Please select an OutputFrame header.");
        return;
    }

    // Check if there is temporary uploaded data
    if (!tempUploadedData) {
        createNotification("No Excel file has been uploaded yet.");
        return;
    }

    showPreloader(); // Show preloader
    try {
        // Save the temporary data to the VlookupManager
        vlookupManager.addVlookup(selectedHeader, tempUploadedData);

        // Clear the temporary data
        tempUploadedData = null;

       

        // Optionally save the VLOOKUPs to the server
        await saveVlookupsToServer();
        updateActiveVlookupsList();
        createNotification(`Vlookup added for header: ${selectedHeader}`);
        
    
    } catch (error) {
        console.error("Error adding Vlookup:", error);
        updateActiveVlookupsList();
        createNotification("Error adding Vlookup. Please try again.");
       
        
    } finally {
        hidePreloader(); // Hide preloader
    }
});


async function updateActiveVlookupsList() {
    const list = document.getElementById('activeVlookupsList');
    if (!list) return;

    showPreloader(); // Show preloader

    try {
        // Fetch the latest VLOOKUP data from the server
        const vlookups = await vlookupManager.fetchVlookupsFromServer();

        // Clear previous content
        list.innerHTML = '';

        // Populate the list with the fetched data
        Object.keys(vlookups).forEach((header) => {
            // Create a container for the VLOOKUP item
            const listItem = document.createElement('li');
            listItem.className = 'vlookup-item'; // Optional: Add a class for styling

            // Create the text for the VLOOKUP item
            const itemText = document.createElement('span');
            itemText.textContent = `Vlookup for ${header}`;
            itemText.style.cursor = 'pointer'; // Make the text clickable
            itemText.addEventListener('click', () => {
                displayVlookupContent(header);
            });

            // Create the delete icon/button
            const deleteIcon = document.createElement('i');
            deleteIcon.className = 'fas fa-trash-alt delete-icon'; // Use FontAwesome trash icon
            deleteIcon.title = 'Delete VLOOKUP';
            deleteIcon.style.marginLeft = '10px'; // Add spacing between text and icon
            deleteIcon.style.color = 'white'; // Make the icon red for emphasis
            deleteIcon.style.cursor = 'pointer'; // Change cursor to pointer on hover
            deleteIcon.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent triggering the parent click event
                deleteVlookup(header); // Call the delete function
            });

            // Append the text and delete icon to the list item
            listItem.appendChild(itemText);
            listItem.appendChild(deleteIcon);

            // Append the list item to the list
            list.appendChild(listItem);
        });
        
    } catch (error) {
        console.error("Error updating active VLOOKUPs list:", error);
        createNotification("Error loading active VLOOKUPs. Please try again.");
    } finally {
        hidePreloader(); // Hide preloader after operation completes
    }
}

async function deleteVlookup(header) {
    try {
        showPreloader(); // Show preloader

        console.log("Sending DELETE request to /api/delete-vlookup with key:", header);

        // Construct the request body
        const requestBody = JSON.stringify({ key: header });

        console.log("Request Body:", requestBody); // Debugging: Log the request body

        // Send a DELETE request with the key in the request body
        const response = await fetch('/api/delete-vlookup', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: requestBody, // Include the key in the request body
        });

        console.log("Response Status:", response.status); // Debugging: Log the response status

        // Parse the response as JSON
        const responseData = await response.json();
        console.log("Response Data:", responseData); // Debugging: Log the full response

        if (!response.ok) {
            throw new Error(responseData.message || "Failed to delete VLOOKUP.");
        }

        // Remove the VLOOKUP locally
        vlookupManager.removeVlookup(header);

        // Update the UI
        updateActiveVlookupsList();

        console.log(`VLOOKUP for header "${header}" deleted successfully.`);
        createNotification(`VLOOKUP for header "${header}" deleted successfully.`);
            // Refresh the page after a short delay
            updateActiveVlookupsList();
       
    } catch (error) {
        console.error("Error deleting VLOOKUP:", error);
        // createNotification("Error deleting VLOOKUP. Please try again.");
        updateActiveVlookupsList();
       
    } finally {
        hidePreloader(); // Hide preloader
    }
}

function displayVlookupContent(header) {
    const tableBody = document.getElementById('vlookupContentBody');
    if (!tableBody) return;

    showPreloader(); // Show preloader

    try {
        // Fetch the latest VLOOKUP data from the server
        vlookupManager.fetchVlookupsFromServer().then((vlookups) => {
            const vlookupData = vlookups[header];

            if (!vlookupData || !vlookupData.rows || vlookupData.rows.length === 0) {
                console.warn(`No VLOOKUP data found for header: ${header}`);
                createNotification(`No VLOOKUP data found for header: ${header}`);
                tableBody.innerHTML = '<tr><td colspan="100" style="text-align: center;">No data available</td></tr>';
                return;
            }

            // Clear previous content
            tableBody.innerHTML = '';

            // Display the VLOOKUP data in the table
            const { headers, rows } = vlookupData;
            console.log("Headers:", headers); // Debugging: Log headers
            console.log("Rows (raw):", rows); // Debugging: Log raw rows

            // Parse rows into objects
            const parsedRows = rows.map(row => {
                if (typeof row === "string") {
                    // Clean the row by removing @{, }, and trailing )
                    const cleanedRow = row.replace(/^@\{|\}$/g, '').trim();
                    const obj = {};
                    // Split the string by semicolon and then by equals sign
                    cleanedRow.split(';').forEach(pair => {
                        const [key, value] = pair.split('=').map(part => part.trim());
                        obj[key] = value;
                    });
                    return obj;
                } else if (typeof row === "object") {
                    // If the row is already an object, use it directly
                    return row;
                } else {
                    throw new Error("Invalid row format. Rows must be strings or objects.");
                }
            });

            console.log("Rows (parsed):", parsedRows); // Debugging: Log parsed rows

            // Filter out rows where all values are empty
            const nonEmptyRows = parsedRows.filter(row => {
                return Object.values(row).some(value => value && value.trim() !== '');
            });

            // Filter out columns (headers) where all corresponding row values are empty
            const nonEmptyHeaders = headers.filter(header => {
                return nonEmptyRows.some(row => row[header] && row[header].trim() !== '');
            });

            console.log("Non-empty headers:", nonEmptyHeaders); // Debugging: Log non-empty headers
            console.log("Non-empty rows:", nonEmptyRows); // Debugging: Log non-empty rows

            // Render the filtered data in the table
            if (nonEmptyHeaders.length === 0 || nonEmptyRows.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="100" style="text-align: center;">No data available</td></tr>';
                return;
            }

            // Create table header
            const headerRow = document.createElement('tr');
            nonEmptyHeaders.forEach(headerText => {
                const th = document.createElement('th');
                th.textContent = headerText;
                headerRow.appendChild(th);
            });
            tableBody.appendChild(headerRow);

            // Render parsed rows in the table
            nonEmptyRows.forEach((row) => {
                const tr = document.createElement('tr');
                nonEmptyHeaders.forEach((headerText) => {
                    const td = document.createElement('td');
                    td.textContent = row[headerText] || ''; // Handle undefined values
                    tr.appendChild(td);
                });
                tableBody.appendChild(tr);
            });

            createNotification(`VLOOKUP content for header "${header}" displayed successfully.`);
        }).catch((error) => {
            console.error("Error fetching VLOOKUP data:", error);
            createNotification("Error loading VLOOKUP content. Please try again.");
        });
    } catch (error) {
        console.error("Error displaying VLOOKUP content:", error);
        createNotification("Error loading VLOOKUP content. Please try again.");
    } finally {
        hidePreloader(); // Hide preloader after operation completes
    }
}

// Initialize the Vlookup section when clicked in the navigation menu
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Add click event listeners to navigation items
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(navItem => {
            navItem.addEventListener('click', async () => {
                const sectionId = navItem.getAttribute('data-section');

                // Check if the clicked section is "vlookup"
                if (sectionId === 'vlookup' && !isVlookupInitialized) {
                    showPreloader(); // Show preloader

                    // Load example file into OutputFrame (replace with actual file loading logic)
                    await loadVlookupsFromServer();

                    // Populate the dropdown with OutputFrame headers
                    populateVlookupDropdown();

                    // Mark the Vlookup section as initialized
                    isVlookupInitialized = true;
                }

                // Always update the active Vlookups list when the Vlookup section is activated
                if (sectionId === 'vlookup') {
                    await updateActiveVlookupsList();
                }
            });
        });
    } catch (error) {
        console.error("Error initializing Vlookup section:", error);
        createNotification("Error loading headers for Vlookup.");
    } finally {
        hidePreloader(); // Hide preloader after initialization
    }
});

// Function to load VLOOKUPs from the server
async function loadVlookupsFromServer() {
    try {
        showPreloader(); // Show preloader

        const response = await fetch('/api/load-data-VlookupManager');
        if (!response.ok) {
            throw new Error(`Failed to load VLOOKUP data: ${response.status}`);
        }
        const data = await response.json();

        // Add loaded VLOOKUPs to the vlookupManager
        Object.keys(data).forEach((header) => {
            vlookupManager.addVlookup(header, data[header]);
        });

        console.log("VLOOKUPs loaded from server successfully.");
    } catch (error) {
        console.error("Error loading VLOOKUPs from server:", error);
        createNotification("Error loading VLOOKUPs. Please try again.");
    } finally {
        hidePreloader(); // Hide preloader after operation completes
    }
}

// Function to load OutputFrame headers
async function loadOutputFrameHeaders() {
    try {
        showPreloader(); // Show preloader

        // Option 1: Load from a file upload (if available)
        const fileInput = document.getElementById('outputFileInput');
        if (fileInput && fileInput.files.length > 0) {
            await outputFrame.loadFromFile(fileInput.files[0]);
        } 
        // Option 2: Fetch headers from the server
        else {
            const response = await fetch('/api/load-outputframe');
            if (!response.ok) {
                throw new Error(`Failed to load OutputFrame.json: ${response.status}`);
            }
            const jsonData = await response.json();
            outputFrame.headers = jsonData.headers || [];
            outputFrame.data = jsonData.data || [];
        }

        console.log("OutputFrame headers loaded successfully.");
    } catch (error) {
        console.error("Error loading OutputFrame headers:", error);
        createNotification("Error loading OutputFrame headers.");
    } finally {
        hidePreloader(); // Hide preloader after operation completes
    }
}

