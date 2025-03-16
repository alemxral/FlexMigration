// Import the required classes
import InputFrame from "./InputFrame.js";
import OutputFrame from "./OutputFrame.js";
import Mapping from "./Mapping.js";
import Vlookup from "./Vlookup.js";
import VlookupManager from "./VlookupManager.js"; // Imported class


// Initialize global instances
const inputFrame = new InputFrame();
const vlookupManager = new VlookupManager(); // Renamed variable to avoid conflict
const outputFrame = new OutputFrame();
const mapping = new Mapping();

let activeVlookups = {};

console.log("Instances initialized successfully!");

// Export the instances for use in other files
export { inputFrame, outputFrame, mapping, activeVlookups, Vlookup, vlookupManager };