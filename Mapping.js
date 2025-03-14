class Mapping {
    constructor() {
        this.mappings = []; // Array of objects { inputHeader, outputHeader }
    }

    /**
     * Add or update a mapping.
     * @param {string} inputHeader - The header from InputFrame.
     * @param {string} outputHeader - The header from OutputFrame.
     */
    addMapping(inputHeader, outputHeader) {
        const existingIndex = this.mappings.findIndex(
            (mapping) => mapping.inputHeader === inputHeader
        );
        if (existingIndex !== -1) {
            this.mappings[existingIndex].outputHeader = outputHeader; // Update existing mapping
        } else {
            this.mappings.push({ inputHeader, outputHeader }); // Add new mapping
        }
    }

    /**
     * Get all mappings.
     * @returns {Array} - Array of mapping objects.
     */
    getMappings() {
        return this.mappings;
    }

    /**
     * Clear all mappings.
     */
    clearMappings() {
        this.mappings = [];
    }
}

export default Mapping;