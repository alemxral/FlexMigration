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

// Convert European to US currency format
function EuToUsCurrencyFormat(input) {
    return input.replace(/[,.]/g, function(x) {
        return x === "," ? "." : ",";
    });
}

document.getElementById('fileInput').addEventListener('change', function(event) {
    let file = event.target.files[0];
    if (!file) return;

    // Show file details
    let fileInfo = document.getElementById('fileInfo');
    fileInfo.innerHTML = `📄 <strong>File:</strong> ${file.name} (${(file.size / 1024).toFixed(2)} KB)`;

    let reader = new FileReader();
    reader.onload = function(e) {
        let data = new Uint8Array(e.target.result);
        let workbook = XLSX.read(data, { type: 'array' });

        let sheetName = workbook.SheetNames[0];
        let sheet = workbook.Sheets[sheetName];
        let jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        let table = document.getElementById('excelTable');
        let thead = table.querySelector("thead");
        let tbody = table.querySelector("tbody");

        thead.innerHTML = "";
        tbody.innerHTML = "";

        // Create table header
        let headerRow = document.createElement("tr");
        jsonData[0].forEach(header => {
            let th = document.createElement("th");
            th.textContent = header;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);

        // Create table body
        jsonData.slice(1).forEach(row => {
            let tr = document.createElement("tr");
            row.forEach(cell => {
                let td = document.createElement("td");
                let formattedValue = typeof cell === "string" ? EuToUsCurrencyFormat(cell) : cell;
                td.textContent = formattedValue;
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });

        // Initialize DataTable
        $('#excelTable').DataTable({
            destroy: true, // Destroy any existing table instance
            dom: '<"dt-buttons"Bf><"clear">lirtp',
            paging: true,
            autoWidth: true,
            buttons: [{
                extend: 'excelHtml5',
                text: 'Export to Excel',
                customize: function(xlsx) {
                    let sheet = xlsx.xl.worksheets['sheet1.xml'];

                    // Format cells (e.g., change styles, highlight specific values)
                    $('row c[r^="E"]', sheet).each(function() {
                        if (parseFloat(EuToUsCurrencyFormat($('is t', this).text())) > 1500) {
                            $(this).attr('s', '17'); // Style formatting
                        }
                    });
                }
            }]
        });
    };

    reader.readAsArrayBuffer(file);
});




document.addEventListener("DOMContentLoaded", function () {
    const tableWrapper = document.getElementById("tableWrapper");
    const fileButtons = document.getElementById("fileButtons");
    const fileSave = document.getElementById("fileSave");
    const fileDiscard = document.getElementById("fileDiscard");
    const notificationPanel = document.getElementById("notificationPanel");

    // Function to show buttons when file is loaded
    function showButtons() {
        fileButtons.style.display = "flex";
    }

    // Simulating file load (replace this with actual file loading logic)
    setTimeout(showButtons, 1000); // Mock delay for loading

    // Save Button - Adds a loading spinner effect
    fileSave.addEventListener("click", function () {
        fileSave.innerHTML = '<span class="loader"></span> Saving...';
        setTimeout(() => {
            fileSave.innerHTML = "Save";

            // Show notification
            createNotification("File saved successfully!");
        }, 1500);
    });

    // Discard Button - Clears table content
    fileDiscard.addEventListener("click", function () {
        document.querySelector("#excelTable tbody").innerHTML = "";

        // Show notification
        createNotification("File discarded.");
    });

    // Function to create and display notifications
    function createNotification(message) {
        const notification = document.createElement("div");
        notification.className = "notification";
        notification.textContent = message;

        // Append notification to the panel
        notificationPanel.appendChild(notification);

        // Automatically remove the notification after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
});