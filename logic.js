// ==============================
// IMPORTS AND GLOBAL VARIABLES
// ==============================

import { 
    inputFrame, 
    outputFrame, 
    mapping, 
    activeVlookups, 
    Vlookup as VlookupClass, // Rename the Vlookup class to avoid conflicts
    vlookupManager,

} from "./instances.js";
import { renderTable, createNotification } from "./utils.js";
import { refreshAndActivateTab } from "./script.js";

console.log("InputFrame and OutputFrame loaded successfully!");

let isMappingInitialized = false;
let isInputTableLoaded = false;
let isOutputTableLoaded = false;
let isVlookupInitialized = false;
let tempUploadedData = null;

// ==============================
// PRELOADER FUNCTIONS
// ==============================

function showPreloader() {
    const preloader = document.getElementById('preloader');
    if (preloader) preloader.style.display = 'block';
}

function hidePreloader() {
    const preloader = document.getElementById('preloader');
    if (preloader) preloader.style.display = 'none';
}

// ==============================
// EVENT LISTENERS
// ==============================

document.addEventListener('DOMContentLoaded', async () => {
    // Handle tab activation based on session storage
    const activeTabId = sessionStorage.getItem('activeTab');
    if (activeTabId) {
        const navItem = document.querySelector(`[data-section="${activeTabId}"]`);
        if (navItem) {
            navItem.classList.add('active');
            navItem.click();
            navItem.scrollIntoView({ behavior: 'smooth' });
            sessionStorage.removeItem('activeTab');
        }
    }

    // Load tables and mappings on page load
    await Promise.all([
        loadAndRenderInputTable(),
        loadAndRenderOutputTable(),
        loadMappingsFromServer()
    ]);
});

document.getElementById('saveMapping')?.addEventListener('click', saveMappings);

document.getElementById('fileInput')?.addEventListener('change', handleFileUploadForInput);

document.getElementById('outputFileInput')?.addEventListener('change', handleFileUploadForOutput);

document.getElementById('addVlookupButtonImport')?.addEventListener('click', triggerExcelFileUpload);

document.getElementById('addVlookupButton')?.addEventListener('click', addVlookupFromUploadedData);

document.querySelectorAll('.nav-item').forEach(navItem => {
    navItem.addEventListener('click', handleNavigationClick);
});

// ==============================
// TABLE LOADING FUNCTIONS
// ==============================

async function loadAndRenderInputTable() {
    showPreloader();
    try {
        const response = await fetch("/api/load-inputframe");
        if (!response.ok) throw new Error(`Failed to load InputFrame.json: ${response.status}`);
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
        hidePreloader();
    }
}

export async function loadAndRenderOutputTable() {
    showPreloader();
    try {
        const response = await fetch("/api/load-outputframe");
        if (!response.ok) throw new Error(`Failed to load OutputFrame.json: ${response.status}`);
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
        hidePreloader();
    }
}

// ==============================
// MAPPING FUNCTIONS
// ==============================

function checkAndRenderMappingTable() {
    if (isInputTableLoaded && isOutputTableLoaded) renderMappingTable();
}

function renderMappingTable() {
    const tableBody = document.getElementById('mappingTableBody');
    if (!tableBody) return console.error("Mapping table body not found.");

    const inputHeaders = inputFrame.headers || [];
    const outputHeaders = outputFrame.headers || [];
    const maxRows = Math.max(inputHeaders.length, outputHeaders.length);

    tableBody.innerHTML = '';
    for (let i = 0; i < maxRows; i++) {
        const row = document.createElement('tr');

        // Input Header Column
        const inputCell = document.createElement('td');
        const inputSelect = document.createElement('select');
        inputSelect.className = 'header-select';
        populateDropdownWithHeaders(inputSelect, inputHeaders);
        inputCell.appendChild(inputSelect);

        // Output Header Column
        const outputCell = document.createElement('td');
        const outputSelect = document.createElement('select');
        outputSelect.className = 'header-select';
        populateDropdownWithHeaders(outputSelect, outputHeaders);
        outputCell.appendChild(outputSelect);

        row.appendChild(inputCell);
        row.appendChild(outputCell);
        tableBody.appendChild(row);
    }
    console.log("Mapping table rendered successfully.");
}

// Function to populate a dropdown with headers
function populateDropdownWithHeaders(selectElement, headers) {
    // Clear previous options
    selectElement.innerHTML = '';

    // Add default empty option
    const defaultOption = createEmptyOption('-- Select Header --');
    selectElement.appendChild(defaultOption);

    // Populate the dropdown with headers
    headers.forEach((header) => {
        const option = document.createElement('option');
        option.value = header;
        option.textContent = header;
        selectElement.appendChild(option);
    });
}

function createEmptyOption(text) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = text;
    return option;
}

async function saveMappings() {
    showPreloader();
    try {
        const rows = document.querySelectorAll('#mappingTableBody tr');
        mapping.clearMappings();

        rows.forEach(row => {
            const inputHeader = row.querySelector('td:nth-child(1) select').value;
            const outputHeader = row.querySelector('td:nth-child(2) select').value;
            if (inputHeader && outputHeader) mapping.addMapping(inputHeader, outputHeader);
        });

        const response = await fetch('/api/save-data-Mapping', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mapping.getMappings()),
        });

        if (!response.ok) throw new Error((await response.json()).message || "Error saving mappings.");
        createNotification("Mapping saved successfully!");
    } catch (error) {
        console.error("Error saving mappings:", error);
    } finally {
        hidePreloader();
    }
}

async function loadMappingsFromServer() {
    try {
        const response = await fetch('/api/load-data-Mapping');
        if (!response.ok) {
            throw new Error(`Failed to load mappings: ${response.status}`);
        }

        const jsonArray = await response.json();

        // Convert the array format to the expected object format
        const savedMappings = {};
        jsonArray.forEach(pair => {
            savedMappings[pair.inputHeader] = pair.outputHeader;
        });

        console.log("Mappings loaded from server:", savedMappings);

        // Clear existing mappings and populate with loaded data
        mapping.clearMappings();
        Object.entries(savedMappings).forEach(([inputHeader, outputHeader]) => {
            mapping.addMapping(inputHeader, outputHeader);
        });

        // Render the mapping table with pre-selected options
        renderMappingTableWithSavedMappings(savedMappings);

        createNotification("Mappings loaded successfully.");
    } catch (error) {
        console.error("Error loading mappings:", error);
        createNotification("Error loading mappings. Please try again.");
    }
}

// Function to render the mapping table with saved mappings
function renderMappingTableWithSavedMappings(savedMappings) {
    const tableBody = document.getElementById('mappingTableBody');
    if (!tableBody) {
        console.error("Mapping table body not found.");
        return;
    }

    // Get headers from InputFrame and OutputFrame
    const inputHeaders = inputFrame.headers || [];
    const outputHeaders = outputFrame.headers || [];

    // Determine the maximum number of rows
    const maxRows = Math.max(inputHeaders.length, outputHeaders.length, Object.keys(savedMappings).length);

    // Clear previous content
    tableBody.innerHTML = '';

    // Generate rows for the mapping table
    for (let i = 0; i < maxRows; i++) {
        const row = document.createElement('tr');

        // Create the Input Header column
        const inputCell = document.createElement('td');
        const inputSelect = document.createElement('select');
        inputSelect.className = 'header-select';

        // Populate the Input dropdown
        populateDropdownWithHeaders(inputSelect, inputHeaders);

        // Set the selected option based on saved mappings
        const inputHeader = Object.keys(savedMappings)[i];
        if (inputHeader && inputHeaders.includes(inputHeader)) {
            inputSelect.value = inputHeader;
        } else {
            inputSelect.value = ''; // Default to empty
        }
        inputCell.appendChild(inputSelect);

        // Create the Output Header column
        const outputCell = document.createElement('td');
        const outputSelect = document.createElement('select');
        outputSelect.className = 'header-select';

        // Populate the Output dropdown
        populateDropdownWithHeaders(outputSelect, outputHeaders);

        // Set the selected option based on saved mappings
        const outputHeader = savedMappings[inputHeader];
        if (outputHeader && outputHeaders.includes(outputHeader)) {
            outputSelect.value = outputHeader;
        } else {
            outputSelect.value = ''; // Default to empty
        }
        outputCell.appendChild(outputSelect);

        // Append cells to the row
        row.appendChild(inputCell);
        row.appendChild(outputCell);

        // Append row to the table body
        tableBody.appendChild(row);
    }

    console.log("Mapping table rendered successfully with saved mappings.");
}


// ==============================
// FILE UPLOAD HANDLERS
// ==============================

async function handleFileUploadForInput(event) {
    const file = event.target.files[0];
    if (!file) return;

    showPreloader();
    try {
        await inputFrame.loadFromFile(file);
        const fileInfo = document.getElementById('fileInfo');
        if (fileInfo) fileInfo.innerHTML = `ðŸ“� <strong>File:</strong> ${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
        inputFrame.displayHeaders();
        renderTable(inputFrame.getData(), inputFrame.headers, 'excelTable');
    } catch (error) {
        console.error("Error processing file:", error);
        createNotification("Error loading file. Please try again.");
    } finally {
        hidePreloader();
    }
}

async function handleFileUploadForOutput(event) {
    const file = event.target.files[0];
    if (!file) return;

    showPreloader();
    try {
        await outputFrame.loadFromFile(file);
        const fileInfo = document.getElementById('outputFileInfo');
        if (fileInfo) fileInfo.innerHTML = `ðŸ“� <strong>File:</strong> ${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
        outputFrame.displayHeaders();
        renderTable(outputFrame.getData(), outputFrame.headers, 'outputExcelTable');
    } catch (error) {
        console.error("Error processing file:", error);
        createNotification("Error loading file. Please try again.");
    } finally {
        hidePreloader();
    }
}

// ==============================
// VLOOKUP FUNCTIONS
// ==============================

function populateVlookupDropdown() {
    const dropdown = document.getElementById('vlookupHeaderDropdown');
    if (!dropdown) return console.error("Dropdown element not found.");

    dropdown.innerHTML = '';
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '-- Select InputFrame Header --';
    dropdown.appendChild(defaultOption);

    const inputHeaders = inputFrame.headers || [];
    if (inputHeaders.length === 0) {
        console.warn("Cannot populate Vlookup dropdown: Missing headers from InputFrame.");
        createNotification("Cannot populate Vlookup dropdown: Missing headers.");
        return;
    }

    inputHeaders.forEach(header => {
        const option = document.createElement('option');
        option.value = header;
        option.textContent = header;
        dropdown.appendChild(option);
    });

    updateActiveVlookupsList();
}

async function saveVlookupsToServer() {
    showPreloader();
    try {
        const vlookups = vlookupManager.getAllVlookups();
        const response = await fetch('/api/load-data-VlookupManager');
        if (!response.ok) throw new Error(`Failed to load VLOOKUP data: ${response.status}`);
        const existingData = await response.json();

        const updatedData = { ...existingData, ...vlookups };
        const saveResponse = await fetch('/api/save-data-VlookupManager', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData),
        });

        if (!saveResponse.ok) throw new Error(`Failed to save VLOOKUP data: ${saveResponse.status}`);
        console.log("VLOOKUP data saved successfully.");
        createNotification("VLOOKUP data saved successfully.");
    } catch (error) {
        console.error("Error saving VLOOKUP data:", error);
        createNotification("Error saving VLOOKUP data. Please try again.");
    } finally {
        hidePreloader();
    }
}

async function triggerExcelFileUpload() {
    const dropdown = document.getElementById('vlookupHeaderDropdown');
    const selectedHeader = dropdown.value;
    if (!selectedHeader) {
        createNotification("Please select an OutputFrame header.");
        return;
    }

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.xlsx,.xls';
    fileInput.addEventListener('change', handleExcelFileUpload);
    fileInput.click();
}

async function handleExcelFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    showPreloader();
    try {
        const uploadedFileNameElement = document.getElementById('uploadedFileName');
        if (uploadedFileNameElement) uploadedFileNameElement.textContent = `Uploaded file: ${file.name}`;

        const reader = new FileReader();
        reader.onload = async e => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: "array" });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

                const headers = jsonData[0];
                const rows = jsonData.slice(1).map(row => {
                    const rowData = {};
                    headers.forEach((header, index) => rowData[header] = row[index]);
                    return rowData;
                });

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
    } finally {
        hidePreloader();
    }
}

async function addVlookupFromUploadedData() {
    const dropdown = document.getElementById('vlookupHeaderDropdown');
    const selectedHeader = dropdown.value;
    if (!selectedHeader) {
        createNotification("Please select an OutputFrame header.");
        return;
    }

    if (!tempUploadedData) {
        createNotification("No Excel file has been uploaded yet.");
        return;
    }

    showPreloader();
    try {
        vlookupManager.addVlookup(selectedHeader, tempUploadedData);
        tempUploadedData = null;
        await saveVlookupsToServer();
        updateActiveVlookupsList();
        createNotification(`Vlookup added for header: ${selectedHeader}`);
    } catch (error) {
        console.error("Error adding Vlookup:", error);
        updateActiveVlookupsList();
        createNotification("Error adding Vlookup. Please try again.");
    } finally {
        hidePreloader();
    }
}

async function updateActiveVlookupsList() {
    const list = document.getElementById('activeVlookupsList');
    if (!list) return;

    showPreloader();
    try {
        const vlookups = await vlookupManager.fetchVlookupsFromServer();
        list.innerHTML = '';

        Object.keys(vlookups).forEach(header => {
            const listItem = document.createElement('li');
            listItem.className = 'vlookup-item';

            const itemText = document.createElement('span');
            itemText.textContent = `Vlookup for ${header}`;
            itemText.style.cursor = 'pointer';
            itemText.addEventListener('click', () => displayVlookupContent(header));

            const deleteIcon = document.createElement('i');
            deleteIcon.className = 'fas fa-trash-alt delete-icon';
            deleteIcon.title = 'Delete VLOOKUP';
            deleteIcon.style.marginLeft = '10px';
            deleteIcon.style.color = 'white';
            deleteIcon.style.cursor = 'pointer';
            deleteIcon.addEventListener('click', e => {
                e.stopPropagation();
                deleteVlookup(header);
            });

            listItem.appendChild(itemText);
            listItem.appendChild(deleteIcon);
            list.appendChild(listItem);
        });
    } catch (error) {
        console.error("Error updating active VLOOKUPs list:", error);
        createNotification("Error loading active VLOOKUPs. Please try again.");
    } finally {
        hidePreloader();
    }
}

async function deleteVlookup(header) {
    try {
        showPreloader();
        const requestBody = JSON.stringify({ key: header });
        const response = await fetch('/api/delete-vlookup', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: requestBody,
        });

        if (!response.ok) throw new Error((await response.json()).message || "Failed to delete VLOOKUP.");
        vlookupManager.removeVlookup(header);
        updateActiveVlookupsList();
        createNotification(`VLOOKUP for header "${header}" deleted successfully.`);
    } catch (error) {
        console.error("Error deleting VLOOKUP:", error);
        updateActiveVlookupsList();
    } finally {
        hidePreloader();
    }
}

function displayVlookupContent(header) {
    const tableBody = document.getElementById('vlookupContentBody');
    if (!tableBody) return;

    showPreloader();
    try {
        vlookupManager.fetchVlookupsFromServer().then(vlookups => {
            const vlookupData = vlookups[header];
            if (!vlookupData || !vlookupData.rows || vlookupData.rows.length === 0) {
                console.warn(`No VLOOKUP data found for header: ${header}`);
                createNotification(`No VLOOKUP data found for header: ${header}`);
                tableBody.innerHTML = '<tr><td colspan="100" style="text-align: center;">No data available</td></tr>';
                return;
            }

            tableBody.innerHTML = '';
            const { headers, rows } = vlookupData;

            const parsedRows = rows.map(row => {
                if (typeof row === "string") {
                    const cleanedRow = row.replace(/^@\{|\}$/g, '').trim();
                    const obj = {};
                    cleanedRow.split(';').forEach(pair => {
                        const [key, value] = pair.split('=').map(part => part.trim());
                        obj[key] = value;
                    });
                    return obj;
                } else if (typeof row === "object") {
                    return row;
                } else {
                    throw new Error("Invalid row format. Rows must be strings or objects.");
                }
            });

            const nonEmptyRows = parsedRows.filter(row => Object.values(row).some(value => value && value.trim() !== ''));
            const nonEmptyHeaders = headers.filter(header => nonEmptyRows.some(row => row[header] && row[header].trim() !== ''));

            if (nonEmptyHeaders.length === 0 || nonEmptyRows.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="100" style="text-align: center;">No data available</td></tr>';
                return;
            }

            const headerRow = document.createElement('tr');
            nonEmptyHeaders.forEach(headerText => {
                const th = document.createElement('th');
                th.textContent = headerText;
                headerRow.appendChild(th);
            });
            tableBody.appendChild(headerRow);

            nonEmptyRows.forEach(row => {
                const tr = document.createElement('tr');
                nonEmptyHeaders.forEach(headerText => {
                    const td = document.createElement('td');
                    td.textContent = row[headerText] || '';
                    tr.appendChild(td);
                });
                tableBody.appendChild(tr);
            });

            createNotification(`VLOOKUP content for header "${header}" displayed successfully.`);
        }).catch(error => {
            console.error("Error fetching VLOOKUP data:", error);
            createNotification("Error loading VLOOKUP content. Please try again.");
        });
    } catch (error) {
        console.error("Error displaying VLOOKUP content:", error);
        createNotification("Error loading VLOOKUP content. Please try again.");
    } finally {
        hidePreloader();
    }
}

async function handleNavigationClick() {
    const sectionId = this.getAttribute('data-section');
    if (sectionId === 'vlookup' && !isVlookupInitialized) {
        showPreloader();
        await loadVlookupsFromServer();
        populateVlookupDropdown();
        isVlookupInitialized = true;
    }

    if (sectionId === 'vlookup') await updateActiveVlookupsList();
}

async function loadVlookupsFromServer() {
    showPreloader();
    try {
        const response = await fetch('/api/load-data-VlookupManager');
        if (!response.ok) throw new Error(`Failed to load VLOOKUP data: ${response.status}`);
        const data = await response.json();

        Object.keys(data).forEach(header => {
            vlookupManager.addVlookup(header, data[header]);
        });

        console.log("VLOOKUPs loaded from server successfully.");
    } catch (error) {
        console.error("Error loading VLOOKUPs from server:", error);
        createNotification("Error loading VLOOKUPs. Please try again.");
    } finally {
        hidePreloader();
    }
}

