export default class VlookupManager {
    constructor() {
        this.vlookups = {}; // Store all Vlookups: { header: { fileJson } }
    }

    /**
     * Add a new Vlookup.
     * @param {string} header - The selected OutputFrame header.
     * @param {Object} fileJson - The uploaded Excel file converted to JSON.
     */
    async addVlookup(header, fileJson) {
        if (!header || !fileJson) {
            throw new Error("Header and file JSON are required to add a Vlookup.");
        }
    
        try {
            // Fetch existing VLOOKUPs from the server
            const existingData = await this.fetchVlookupsFromServer();
    
            // Check for duplicates
            if (existingData[header]) {
                console.warn(`Vlookup already exists for header: ${header}`);
                throw new Error(`Vlookup already exists for header: ${header}`);
            }
    
            // Extract headers and rows from the uploaded file
            const { headers, rows } = fileJson;
    
            // Ensure rows are in the correct format
            const cleanedRows = Array.isArray(rows)
                ? rows.map(row => {
                    if (typeof row === "string") {
                        // Parse rows formatted as "key1=value1; key2=value2"
                        const obj = {};
                        row.split(';').forEach(pair => {
                            const [key, value] = pair.split('=').map(part => part.trim());
                            obj[key] = value;
                        });
                        return obj;
                    } else if (typeof row === "object") {
                        // Use rows that are already objects
                        return row;
                    } else {
                        throw new Error("Invalid row format. Rows must be strings or objects.");
                    }
                })
                : [];
    
            // Add the new VLOOKUP to the existing data
            existingData[header] = {
                headers,
                rows: cleanedRows,
            };
    
            // Save the updated data back to the server
            await this.saveVlookupsToServer(existingData);
    
            console.log(`Vlookup added for header: ${header}`);
        } catch (error) {
            console.error("Error adding Vlookup:", error);
            throw error;
        }
    }

    async fetchVlookupsFromServer() {
        try {
            const response = await fetch('/api/load-data-VlookupManager');
            if (!response.ok) {
                throw new Error(`Failed to load VLOOKUP data: ${response.status}`);
            }
            const data = await response.json();
    
            // Extract only the headers and rows for each key
            const cleanData = {};
            Object.keys(data).forEach(key => {
                if (data[key].headers && data[key].rows) {
                    cleanData[key] = {
                        headers: data[key].headers,
                        rows: data[key].rows,
                    };
                }
            });
    
            return cleanData;
        } catch (error) {
            console.error("Error fetching VLOOKUPs from server:", error);
            throw error;
        }
    }
    
    async saveVlookupsToServer(data) {
        try {
            const response = await fetch('/api/save-data-VlookupManager', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
    
            if (!response.ok) {
                throw new Error(`Failed to save VLOOKUP data: ${response.status}`);
            }
    
            console.log("VLOOKUPs saved to server successfully.");
        } catch (error) {
            console.error("Error saving VLOOKUPs to server:", error);
            throw error;
        }
    }


    /**
     * Get the JSON data for a specific Vlookup.
     * @param {string} header - The selected OutputFrame header.
     * @returns {Object|null} - The JSON data for the Vlookup or null if not found.
     */
    getVlookup(header) {
        return this.vlookups[header] || null;
    }

    /**
     * Get all Vlookups.
     * @returns {Object} - All Vlookups stored in the manager.
     */
    getAllVlookups() {
        return this.vlookups;
    }

    /**
     * Remove a Vlookup by its header.
     * @param {string} header - The selected OutputFrame header.
     */
    removeVlookup(header) {
        if (this.vlookups[header]) {
            delete this.vlookups[header];
            console.log(`Vlookup removed for header: ${header}`);
        }
    }
}

