// ==============================
// Utility Functions
// ==============================

import { createNotification } from "./utils.js";

// ==============================
// FlexRulesManager Class
// ==============================

class FlexRulesManager {
    constructor() {
        this.userDefinedRules = []; // Stores user-defined rules
        this.defaultRules = []; // Stores default rules (read-only)
        this.userDefinedTableBody = document.getElementById('userDefinedRulesBody'); // Table body for user-defined rules
        this.defaultRulesTableBody = document.getElementById('defaultRulesBody'); // Table body for default rules
        this.init();
    }

    // Initialize the class by loading data and rendering the tables
    async init() {
        try {
            // Load user-defined rules
            await this.loadRules('/api/load-user-defined-rules', 'userDefinedRules');

            // Load default rules
            await this.loadRules('/api/load-default-rules', 'defaultRules');

            // Render the tables
            this.renderTables();

            console.log("FlexRulesManager initialized successfully.");
        } catch (error) {
            console.error("Error initializing FlexRulesManager:", error);
            createNotification("Error loading rules. Please try again.");
        }
    }

    // Load rules from the server
    async loadRules(apiEndpoint, ruleType) {
        try {
            const response = await fetch(apiEndpoint);
            if (!response.ok) {
                throw new Error(`Failed to load ${ruleType} rules: ${response.status}`);
            }
            const rules = await response.json();
            console.log(`${ruleType.charAt(0).toUpperCase() + ruleType.slice(1)} Rules Loaded:`, rules);

            // Store rules in the appropriate property
            this[ruleType] = rules;
        } catch (error) {
            console.error(`Error loading ${ruleType} rules:`, error);
            throw new Error(`Error loading ${ruleType} rules. Please check the server.`);
        }
    }

    async saveRules(apiEndpoint, rules) {
        try {
            console.debug("Sending request to:", apiEndpoint);
            console.debug("Request payload:", rules);
    
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(rules),
            });
    
            if (!response.ok) {
                throw new Error(`Failed to save rules: ${response.status}`);
            }
    
            const result = await response.json();
            console.log("Rules saved successfully:", result);
            createNotification("Rules saved successfully!");
        } catch (error) {
            console.error("Error saving rules:", error);
            // createNotification("Error saving rules. Please try again.");
        }
    }

    // Render the tables with loaded rules
    renderTables() {
        // Clear previous content
        this.userDefinedTableBody.innerHTML = '';
        this.defaultRulesTableBody.innerHTML = '';

        // Render user-defined rules
        this.userDefinedRules.forEach((rule) => {
            this.addRuleToTable(rule, this.userDefinedTableBody);
        });

        // Render default rules
        this.defaultRules.forEach((rule) => {
            this.addRuleToTable(rule, this.defaultRulesTableBody, true); // Default rules are read-only
        });
    }

    // Add a rule to the specified table
    addRuleToTable(rule, tableBody, isDefault = false) {
        const newRow = document.createElement('tr');

        // Rule Name Cell
        const ruleNameCell = document.createElement('td');
        ruleNameCell.textContent = rule.name || 'Unnamed Rule';
        newRow.appendChild(ruleNameCell);

        // Description Cell
        const descriptionCell = document.createElement('td');
        descriptionCell.textContent = rule.description || 'No description provided';
        newRow.appendChild(descriptionCell);

        // Action Cell
        const actionCell = document.createElement('td');
        if (!isDefault) {
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.className = 'delete-rule-button';
            deleteButton.addEventListener('click', () => {
                this.deleteRule(rule, tableBody);
            });
            actionCell.appendChild(deleteButton);
        } else {
            actionCell.textContent = 'Read-only';
        }
        newRow.appendChild(actionCell);

        // Append the new row to the table
        tableBody.appendChild(newRow);
    }

    // Delete a rule
    deleteRule(rule, tableBody) {
        const index = this.userDefinedRules.findIndex(
            (r) => r.name === rule.name && r.description === rule.description
        );
        if (index !== -1) {
            this.userDefinedRules.splice(index, 1);
            tableBody.removeChild(tableBody.querySelector(`td:contains("${rule.name}")`).parentNode);
            createNotification(`Rule "${rule.name}" deleted successfully.`);

            // Save the updated rules to the server after deletion
            this.saveRules('/api/save-user-defined-rules', this.userDefinedRules)
                .then(() => {
                    console.log("User-defined rules saved to the server after deletion.");
                })
                .catch((error) => {
                    console.error("Error saving user-defined rules:", error);
                    // createNotification("Error saving rules to the server. Please try again.");
                });
        } else {
            console.warn("Rule not found in user-defined rules.");
        }
    }

    // Add a new user-defined rule
    addNewRule(rule) {
        try {
            // Debug: Log the rule being added
            console.debug("Adding new rule:", rule);
    
            // Add the rule to the local array
            this.userDefinedRules.push(rule);
            console.debug("Rule added to local array. Updated rules:", this.userDefinedRules);
    
            // Add the rule to the table
            this.addRuleToTable(rule, this.userDefinedTableBody);
            console.debug("Rule added to the table.");
    
            // Notify the user that the rule was added successfully
            createNotification(`Rule "${rule.name}" added successfully.`);
            console.debug(`Notification created for rule "${rule.name}".`);
    
            // Save the updated rules to the server
            console.debug("Sending updated rules to the server. Rules payload:", this.userDefinedRules);
            this.saveRules('/api/save-user-defined-rules', this.userDefinedRules)
                .then(() => {
                    console.log("User-defined rules saved to the server.");
                    console.debug("Server response: Rules saved successfully.");
                })
                .catch((error) => {
                    console.error("Error saving user-defined rules:", error);
                    console.debug("Server response: Error occurred while saving rules.");
                    // createNotification("Error saving rules to the server. Please try again.");
                });
        } catch (error) {
            console.error("Error adding new rule:", error);
            console.debug("An error occurred while processing the rule:", error);
            // createNotification("Error adding rule. Please try again.");
        }
    }
}

// ==============================
// Event Listeners
// ==============================

// const flexRulesManager = new FlexRulesManager();

document.addEventListener('DOMContentLoaded', () => {
    // Instantiate FlexRulesManager globally
    window.flexRulesManager = new FlexRulesManager();

    const addRuleButton = document.getElementById('addRuleButton');
    const addRuleModal = document.getElementById('addRuleModal');

    // Open the modal
    addRuleButton.addEventListener('click', () => {
        addRuleModal.style.display = 'flex';
    });

    // Close the modal
    const closeModalButtons = document.querySelectorAll('.close-modal');
    closeModalButtons.forEach((button) => {
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
    const addRuleForm = document.getElementById('addRuleForm');
    addRuleForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent default form submission behavior

        // Get form data using the form's elements
        const ruleNameInput = document.getElementById('ruleName');
        const ruleDescriptionInput = document.getElementById('ruleDescription');

        // Validate the form
        const ruleName = ruleNameInput.value.trim();
        const ruleDescription = ruleDescriptionInput.value.trim();

        if (!ruleName || !ruleDescription) {
            alert('Please fill in all fields.');
            return;
        }

        // Create a new rule object
        const newRule = { name: ruleName, description: ruleDescription };

        try {
            // Add the rule locally and save it to the server
            flexRulesManager.addNewRule(newRule);

            // Clear the form
            ruleNameInput.value = ''; // Clear the input field
            ruleDescriptionInput.value = ''; // Clear the textarea

            // Close the modal
            addRuleModal.style.display = 'none';

            console.log("Rule added successfully:", newRule);
        } catch (error) {
            console.error("Error adding rule:", error);
            createNotification("Error adding rule. Please try again.");
        }
    });

    // Track the "Delete Rule" button using event delegation
    document.addEventListener('click', async (event) => {
        // Check if the clicked element matches a "Delete Rule" button
        if (event.target && event.target.classList.contains('delete-rule-button')) {
            try {
                // Find the row containing the delete button
                const row = event.target.closest('tr');
                if (!row) {
                    console.error("Row not found.");
                    return;
                }

                // Extract the rule name from the row
                const ruleNameCell = row.querySelector('td:nth-child(1)');
                const ruleName = ruleNameCell?.textContent.trim();

                if (!ruleName) {
                    console.error("Rule name not found in the row.");
                    return;
                }

                // Remove the row from the table
                row.remove();

                // Notify the user that the rule was deleted
                createNotification(`Rule "${ruleName}" deleted successfully.`);

                // Update the local array by removing the rule
                flexRulesManager.userDefinedRules = flexRulesManager.userDefinedRules.filter(
                    (rule) => rule.name !== ruleName
                );

                // Send the updated rules to the server
                await flexRulesManager.saveRules('/api/save-user-defined-rules', flexRulesManager.userDefinedRules);

                console.log("Updated rules saved to the server after deletion.");
            } catch (error) {
                console.error("Error deleting rule:", error);
                createNotification("Error deleting rule. Please try again.");
            }
        }
    });
});