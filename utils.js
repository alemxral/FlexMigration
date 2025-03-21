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
