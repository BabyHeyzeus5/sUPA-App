
/* DATA GATHERING */
function pullFormData() {
    try {

        // get motor data
        const motorToggle = document.getElementById("uploadToggle").checked;
        let motorNum = 0;
        let dataType;
        if (motorToggle) {
            motorNum = parseInt(document.getElementById("motoNum").value);
            const selectedDataType = document.querySelector('input[name="dataSelector"]:checked');
            dataType = selectedDataType.value;

        }

        return [motorToggle, motorNum, dataType];

    } catch (error) {
        console.error("Error in pullFormData:", error);
        window.alert("Error in analysis:" + error.message);
        return null;
    }
}

function parseData(fileContent, columnsToKeep) {
    const lines = fileContent.split(/\r?\n/).filter(line => line.trim() !== '');

    if (!lines.length) return [];

    // Detect separator
    const separator = lines[0].includes(",") ? "," : "\t";

    // Parse headers, remove quotes, trim
    const headers = lines[0].split(separator).map(h => h.replace(/^"|"$/g, "").trim());

    // Map columns to indices
    const indices = columnsToKeep.map(col => {
        const i = headers.indexOf(col.trim());
        if (i === -1) {
            console.warn(`Column "${col}" not found in headers:`, headers);
        }
        return i;
    });

    // Parse each line safely
    const extractedData = lines.slice(1).map(line => {
        const values = line.split(separator).map(v => v.replace(/^"|"$/g, "").trim());
        return indices.map(i => (i >= 0 && i < values.length ? values[i] : null));
    });

    return extractedData;
}






function convertTunnelData(motorNum) {
    console.log("Converting Data");

    const files = document.getElementById("folderInput").files;
    if (!files.length) {
        console.error("No files found");
        return;
    }

    const columnsToKeep = ["ESC signal (µs)", "Thrust (ozf)", "Electrical Power (W)"];

    // Read all files as text
    const filePromises = [...files].map(file => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const data = parseData(reader.result, columnsToKeep);
                resolve({ name: file.name, data });
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
        });
    });

    Promise.all(filePromises)
        .then(results => {
            results.forEach(file => {
                console.log(`File: ${file.name}`);
                console.table(file.data); // nice table format in console
            });
        })
        .catch(error => console.error("Error reading files:", error));
}


function runAnalysis(){
    event.preventDefault(); // stops the form from reloading the page
    const [motorToggle, motorNum, dataType] = pullFormData();

    if (dataType == 'windTunnel'){
        convertTunnelData(motorNum);
    }

}

// Test Data
let nominalVoltage = 14.8;
let pressureinHg = 30.04;
let tempF = 69.6;

//conversions
let tempR = tempF + 459.67; // Rankine
let pressurePSF = pressureinHg * 70.7262;

const R = 1549.349;
const testDensity = pressurePSF / (R * tempR);

console.log("Calculated Density: " + testDensity + " slugs/ft^3");


document.getElementById("inputForm").addEventListener("submit", runAnalysis);
