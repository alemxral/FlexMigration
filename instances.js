// Import the required classes
import InputFrame from "./InputFrame.js";
import OutputFrame from "./OutputFrame.js";
import Mapping from "./Mapping.js";
import Vlookup from "./Vlookup.js";

// Initialize global instances
const inputFrame = new InputFrame();
const outputFrame = new OutputFrame();
const mapping = new Mapping();
let activeVlookups = {};

console.log("Instances initialized successfully!");

// Export the instances for use in other files
export { inputFrame, outputFrame, mapping, activeVlookups };