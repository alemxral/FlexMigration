// utils.js

// Track DataTables instances for each table
const dataTableInstances = {};

function resetTable(tableId) {
    const table = document.getElementById(tableId);
    if (!table) {
        console.error(`Table element with ID "${tableId}" not found.`);
        return;
    }

    const thead = table.querySelector("thead");
    const tbody = table.querySelector("tbody");

    // Destroy existing DataTables instance if it exists
    if ($.fn.DataTable.isDataTable(`#${tableId}`)) {
        $(`#${tableId}`).DataTable().clear().destroy();
    }

    // Clear previous content
    thead.innerHTML = "";
    tbody.innerHTML = "";
}

export function renderTable(data, headers, tableId) {
    resetTable(tableId); 
    const table = document.getElementById(tableId);
    if (!table) {
        console.error(`Table element with ID "${tableId}" not found.`);
        return;
    }

    const thead = table.querySelector("thead");
    const tbody = table.querySelector("tbody");

    // Destroy existing DataTables instance if it exists
    if (dataTableInstances[tableId]) {
        dataTableInstances[tableId].clear(); // Clear the data from the table
        dataTableInstances[tableId].destroy(true); // Fully destroy the instance
        dataTableInstances[tableId] = null; // Reset the reference
    }
      // Destroy existing DataTables instance if it exists
      if ($.fn.DataTable.isDataTable(`#${tableId}`)) {
        $(`#${tableId}`).DataTable().clear().destroy(); // Clear and destroy the existing DataTable
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

    // Reinitialize DataTables for the specific table
    dataTableInstances[tableId] = $(`#${tableId}`).DataTable({
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

// Function to create and display notifications
export function createNotification(message) {
    const notificationPanel = document.getElementById("notificationPanel");
    if (!notificationPanel) {
        console.warn("Notification panel not found.");
        return;
    }
    const notification = document.createElement("div");
    notification.className = "notification";
    notification.textContent = message;
    notificationPanel.appendChild(notification);
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Helper function to create a dropdown
export function createDropdown(options) {
    const select = document.createElement('select');
    options.forEach((optionText) => {
        const option = document.createElement('option');
        option.value = optionText;
        option.textContent = optionText;
        select.appendChild(option);
    });
    return select;
}

// Helper function to create a searchable dropdown
export function createSearchableDropdown(options) {
    const container = document.createElement('div');
    container.className = 'searchable-dropdown';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Search...';
    container.appendChild(input);

    const ul = document.createElement('ul');
    container.appendChild(ul);

    input.addEventListener('input', () => {
        const searchTerm = input.value.toLowerCase();
        ul.style.display = 'block';
        ul.innerHTML = '';

        options
            .filter((option) => typeof option === 'string' && option.toLowerCase().includes(searchTerm))
            .forEach((option) => {
                const li = document.createElement('li');
                li.textContent = option;
                li.addEventListener('click', () => {
                    input.value = option;
                    ul.style.display = 'none';
                });
                ul.appendChild(li);
            });
    });

    return container;
}

    // Helper function to create a dropdown with a default empty option
  export function createDropdownWithEmpty(options, placeholder = '-- Select Header --') {
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