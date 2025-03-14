export default class VlookupManager {
    constructor() {
        this.vlookups = {}; // Store all Vlookups: { header: { fileJson } }
    }

    /**
     * Add a new Vlookup.
     * @param {string} header - The selected OutputFrame header.
     * @param {Object} fileJson - The uploaded Excel file converted to JSON.
     */
    addVlookup(header, fileJson) {
        if (!header || !fileJson) {
            throw new Error("Header and file JSON are required to add a Vlookup.");
        }
        this.vlookups[header] = fileJson;
        console.log(`Vlookup added for header: ${header}`);
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

