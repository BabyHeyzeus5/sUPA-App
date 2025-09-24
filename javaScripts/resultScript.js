// Global Variables
var motorToggle = localStorage.getItem("motorToggle");
let weight;

// Function to pull json data
async function  populateRequirements(requirementSet) {
    try {
        const response = await fetch("requirements.json");
        if (!response.ok) {
            throw new Error("Failed to fetch requirements.json");
        }

        const data= await response.json();

        const yearReqs = data[requirementSet];
        if (!yearReqs) {
            console.warn('No requirements found for ${requirementSet}');
            return;
        }

        const requirements = Object.values(yearReqs).map(values => [values.Threshold, values.Objective]);

        return requirements;


    } catch (error) {
        console.error("Error loading requirements:", error);
    }
}

// Functions to remove classes from the requirement bugs
function removeClasses(req) {
    if (req.classList.contains("notMet")) {
        req.classList.remove("notMet");
    } else if (req.classList.contains("threshold")) {
        req.classList.remove("threshold");
    } else if (req.classList.contains("objective")) {
        req.classList.remove("objective");
    }

}

// Table Download Code
document.getElementById("downloadTable").addEventListener("click", function () {
    const table = document.querySelector("#resultsTable");
    let csvContent = "data:text/csv;charset=utf-8,";
    let fileName = prompt("Enter file name: ", "results_table.csv")
    

    // Get table headers
    let headers = [];
    table.querySelectorAll("thead th").forEach(th => {
        headers.push(th.innerText);
    });
    csvContent += headers.join(",") + "\n";

    // Get table rows
    table.querySelectorAll("tbody tr").forEach(row => {
        let rowData = [];
        row.querySelectorAll("td").forEach(td => {
            rowData.push(td.innerText);
        });
        csvContent += rowData.join(",") + "\n";
    });

    // Create a download link and trigger it
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// Main Code to load data
document.addEventListener("DOMContentLoaded", function () {
    // Set HTML elements to be variables
    const toggleButton = document.getElementById("toggleButton");
    const resultsTable = document.getElementById("resultsTable");
    const altitudeSelect = document.getElementById("altitudeSelect");
    const req1 = document.getElementById("requirement1");
    const req2 = document.getElementById("requirement2");
    const req3 = document.getElementById("requirement3");
    const req4 = document.getElementById("requirement4");
    let chartInstance1 = null;
    let chartInstance2 = null;
    // Log for debug
    console.log(motorToggle);

    toggleButton.addEventListener("click", function () {
        if (resultsTable.classList.contains("hidden")) {
            resultsTable.classList.remove("hidden");
            toggleButton.textContent = "Hide Table";
        } else {
            resultsTable.classList.add("hidden");
            toggleButton.textContent = "Show Table";
        }
    });
    
    function loadResults() {
        // Load the rest
        let maxEndurance;
        let maxEnduranceVelocity;
        let maxEnduranceAltitude;
        let maxCalcVelocity;
        let maxCalcVelocityAltitude;
        let minCalcVelocity;
        let minCalcVelocityAltitude;
        let maxAltitude;
        let results;
        let maxResults;
        console.log("loadResults motorToggle", motorToggle)
        if (motorToggle == "true") {
            console.log("in first")
            results = JSON.parse(localStorage.getItem("analysisResults"));
            maxResults = JSON.parse(localStorage.getItem("maxResults"));
            maxEndurance = maxResults.endurance.maxEndurance;
            maxEnduranceVelocity = maxResults.endurance.maxEnduranceVelocity;
            maxEnduranceAltitude = maxResults.endurance.maxEnduranceAltitude;
            maxEnduranceAmps = maxResults.endurance.maxEnduranceAmps;
            maxCalcVelocity = maxResults.maxSpeed.maxCalcVelocity;
            maxCalcVelocityAltitude = maxResults.maxSpeed.maxCalcVelocityAltitude;
            minCalcVelocity = maxResults.minSpeed.minCalcVelocity;
            minCalcVelocityAltitude = maxResults.minSpeed.minCalcVelocityAltitude;
            maxAltitude = maxResults.maxAltitude;
            weight = maxResults.weight;
        } else if (motorToggle == "false"){
            console.log("in second")
            results = JSON.parse(localStorage.getItem("analysisResultsNoThrust")) || {};
            maxResults = JSON.parse(localStorage.getItem("maxResults")) || {};
            minCalcVelocity = maxResults.minSpeed.minCalcVelocity;
            minCalcVelocityAltitude = maxResults.minSpeed.minCalcVelocityAltitude;
            weight = maxResults.weight;
        }
        console.log(results);

                // Load Requirement Set
        let requirementSet = JSON.parse(localStorage.getItem("requirementSet"));
        document.getElementById("requirementSelected").innerHTML = `Requirement Year Selected: ${requirementSet}`
        console.log(requirementSet);
        populateRequirements(requirementSet).then(requirements => {
            console.log(requirements);
            // update requirements as needed
            if (motorToggle == "true") {
                // requirement 1
                if (requirements[0][1] < maxEndurance ) {
                    req1.classList.add("objective");
                    req1.innerHTML += "Objective";
                } else if (requirements[0][0] < maxEndurance ) {
                    req1.classList.add("threshold");
                    req1.innerHTML += "Threshold";
                } else {
                    req1.classList.add("notMet");
                    req1.innerHTML += "Not Met";
                }
                //requirement 2
                if (requirements[1][1] <= maxAltitude ) {
                    req2.classList.add("objective");
                    req2.innerHTML += "Objective";
                } else if (requirements[1][0] < maxAltitude ) {
                    req2.classList.add("threshold");
                    req2.innerHTML += "Threshold";
                } else {
                    req2.classList.add("notMet");
                    req2.innerHTML += "Not Met";
                }

                //requirement 4
                if (requirements[3][1] < maxCalcVelocity) {
                    req4.classList.add("objective");
                    req4.innerHTML += "Objective"
                } else if (requirements[3][0] < maxCalcVelocity) {
                    req4.classList.add("threshold");
                    req4.innerHTML += "Threshold";
                } else {
                    req4.classList.add("notMet");
                    req4.innerHTML += "Not Met";
                }
                
                // calculate minimum battery capacity needed for objectives
                function calcBatt(time, current) {
                    return (time / 60) * current * 1000;
                }
                batteryThreshold = calcBatt(30, maxEnduranceAmps);
                batteryObjective = calcBatt(45, maxEnduranceAmps);


                document.getElementById("resultLog").innerHTML = `
                Max endurance is ${maxEndurance.toFixed(0)} minutes traveling at ${maxEnduranceVelocity} mph at ${maxEnduranceAltitude.toFixed(0)} ft (msl) pulling ${maxEnduranceAmps.toFixed(2)} amps.<br>
                Battery capacity required for: Threshold: ${batteryThreshold.toFixed(0)}mAh, Objective: ${batteryObjective.toFixed(0)}mAh.<br>
                Max speed is ${maxCalcVelocity} mph at ${maxCalcVelocityAltitude.toFixed(0)} ft (msl).<br>
                Min stall speed is ${minCalcVelocity} mph at ${minCalcVelocityAltitude.toFixed(0)} ft (msl).<br>
                Maximum calculated altitude is ${maxAltitude} ft (msl).`;

            } else {
                req1.innerHTML += ("Not Available");
                req2.innerHTML += ("Not Available");
                req4.innerHTML += ("Not Available");
                
                document.getElementById("resultLog").innerHTML = `
                Max endurance is unavailable.<br>
                Max speed is unavailable.<br>
                Min stall speed is ${minCalcVelocity} mph.<br>
                Maximum calculated altitude is unavailable.`;
            }

            //requirement 3
            if (requirements[2][1] > minCalcVelocity) {
                req3.classList.add("objective");
                req3.innerHTML += "Objective";
            } else if (requirements[2][0] > minCalcVelocity) {
                req3.classList.add("threshold");
                req3.innerHTML += "Threshold";
            } else {
                req3.classList.add("notMet");
                req3.innerHTML += "Not Met";
            }
        
        });

        altitudeSelect.innerHTML = ""; // Clear previous options


        // COPY THIS IF NEEDED FOR THE JSON
        for (let altitude in results) {
            let option = document.createElement("option");
            option.value = altitude;
            option.textContent = altitude + " ft";
            altitudeSelect.appendChild(option);
        }

        if (altitudeSelect.options.length > 0) {
            updateTable();
            drawChart();
        }
    }


    // Updates Table when a new altitude is chosen
    function updateTable() {    
        let results;
        if (motorToggle == "true"){
            results = JSON.parse(localStorage.getItem("analysisResults"));
            altitudeInfo = JSON.parse(localStorage.getItem("altResults"));
        } else {
            results = JSON.parse(localStorage.getItem("analysisResultsNoThrust"));
        }

        const selectedAltitude = altitudeSelect.value;
        const altitudeBar = document.getElementById("altitudeInformation");
        const tableBody = document.querySelector("#resultsTable tbody");
        tableBody.innerHTML = ""; // Clear existing rows
        if (results[selectedAltitude]) {
            for (let velocity in results[selectedAltitude]) {
                let data = results[selectedAltitude][velocity];
                
                if (motorToggle == "true") {
                    //more performance data here
                    altitudeBar.innerHTML = `Maximum climb rate at ${selectedAltitude} ft (msl) is ${altitudeInfo[selectedAltitude].maxROC} ft/m flying at
                     ${altitudeInfo[selectedAltitude].maxROCSpeed} mph at an angle of ${altitudeInfo[selectedAltitude].maxROCAngle} degrees`;
                }


                if (data.AoA > 16 || isNaN(data.throttle) && motorToggle == true) continue;

                let row = document.createElement("tr");

                row.innerHTML = `
                    <td>${velocity}</td>
                    <td>${data.dynamicPressure}</td>
                    <td>${data.coefficientLift}</td>
                    <td>${data.AoA}</td>
                    <td>${data.coefficientDrag}</td>
                    <td>${data.dragOz}</td>
                    <td>${data.thrust}</td>
                    <td>${data.lOverD}</td>
                    <td>${data.endurance}</td>
                    <td>${data.current}</td>
                    <td>${data.throttle}</td>
                `;

                tableBody.appendChild(row);
            }
        }
    }

    function drawChart() {
        let results;
        // Checks if user has used thrust values
        if (motorToggle == "true") {
            results = JSON.parse(localStorage.getItem("analysisResults")) || {};
        } else {
            results = JSON.parse(localStorage.getItem("analysisResultsNoThrust")) || {};
        }
        const selectedAltitude = altitudeSelect.value;
        if (!selectedAltitude || !results[selectedAltitude]) return;

        const airspeed = [];
        const ldRatio = [];
        const cLThreeHalfD = [];
        const thrustAvailable = [];
        const thrustRequired = [];
        const current = [];
        if (motorToggle == "true") {
            // pull data for propulsion information
            const propInfo = JSON.parse(localStorage.getItem("propulsionInfo")) || {};
            const infoBar = document.getElementById("informationBar");

            infoBar.innerHTML = `Motor(s): ${propInfo.motoNum} ${propInfo.motor} | Propellor: ${propInfo.propellor} | Battery: ${propInfo.battery} ${propInfo.batteryCapacity}mAh | Weight: ${weight}lbs`

            for (let velocity in results[selectedAltitude]) {
                // Skip first 10 vel
                if (velocity < 10) continue;
                airspeed.push(parseFloat(velocity));
                ldRatio.push(results[selectedAltitude][velocity].lOverD);
                cLThreeHalfD.push(results[selectedAltitude][velocity].cLThreeHalfD);
                thrustAvailable.push(results[selectedAltitude][velocity].thrust);
                thrustRequired.push(results[selectedAltitude][velocity].dragOz);
                current.push(results[selectedAltitude][velocity].current)
            }
    
            const ctx1 = document.getElementById("ldChart").getContext("2d");
            const ctx2 = document.getElementById("TaTrChart").getContext("2d");
    
            if (chartInstance1) { 
                chartInstance1.destroy(); 
                chartInstance1 = null;
            }// Destroy previous chart instance to prevent duplication
            if (chartInstance2) { 
                chartInstance2.destroy(); 
                chartInstance2 = null;
            }
    
            // Chart 1 L/D vs airspeed
            chartInstance1 = new Chart(ctx1, {
                type: "line",
                data: {
                    labels: airspeed,
                    datasets: [{
                        label: "L/D Ratio",
                        data: ldRatio,
                        borderColor: "blue",
                        borderWidth: 2,
                        fill: false,
                        pointRadius: 5,
                        pointBackgroundColor: "blue"
                    }, 
                    {
                        label: "cL^(3/2)/cD Ratio",
                        data: cLThreeHalfD,
                        borderColor: "green",
                        borderWidth: 2,
                        fill: false,
                        pointRadius: 5,
                        pointBackgroundColor: "green"
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: "Airspeed (mph)"
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: "L/D Ratio"
                            }
                        }
                    }
                }
            });
    
            // Chart 2 Thrust Required vs Airspeed
            chartInstance2 = new Chart(ctx2, {
                type: "line",
                data: {
                    labels: airspeed,
                    datasets: [{
                        label: "Max Thrust Available",
                        data: thrustAvailable,
                        borderColor: "blue",
                        borderWidth: 2,
                        fill: false,
                        pointRadius: 5,
                        pointBackgroundColor: "blue"
                    }, 
                    {
                        label: "Thrust Required",
                        data: thrustRequired,
                        borderColor: "red",
                        borderWidth: 2,
                        fill: false,
                        pointRadius: 5,
                        pointBackgroundColor: "red"
                    },
                    {
                        label: "Current Draw at Thrust Required",
                        data: current, // Assuming you have an array for current values
                        borderColor: "green",
                        borderWidth: 2,
                        fill: false,
                        pointRadius: 5,
                        pointBackgroundColor: "green",
                        yAxisID: "y1" // Assign to the secondary y-axis
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: "Airspeed (mph)"
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: "Thrust (oz)"
                            }
                        },
                        y1: {
                            title: {
                                display: true,
                                text: "Current (A)"
                            },
                            position: "right",
                            grid: {
                                drawOnChartArea: false // Prevents grid lines from overlapping
                            }
                        }   
    
                    }
                }
            });
        } else {
            // No motor data in this section
            for (let velocity in results[selectedAltitude]) {
                // Skip first 10 vel
                if (velocity < 16) continue;
                airspeed.push(parseFloat(velocity));
                ldRatio.push(results[selectedAltitude][velocity].lOverD);
                cLThreeHalfD.push(results[selectedAltitude][velocity].cLThreeHalfD);
                thrustRequired.push(results[selectedAltitude][velocity].dragOz);
            }
    
            const ctx1 = document.getElementById("ldChart").getContext("2d");
            const ctx2 = document.getElementById("TaTrChart").getContext("2d");
    
            if (chartInstance1) { 
                chartInstance1.destroy(); 
                chartInstance1 = null;
            }// Destroy previous chart instance to prevent duplication
            if (chartInstance2) { 
                chartInstance2.destroy(); 
                chartInstance2 = null;
            }
    
            // L/D vs Airspeed
            chartInstance1 = new Chart(ctx1, {
                type: "line",
                data: {
                    labels: airspeed,
                    datasets: [{
                        label: "L/D Ratio",
                        data: ldRatio,
                        borderColor: "blue",
                        borderWidth: 2,
                        fill: false,
                        pointRadius: 5,
                        pointBackgroundColor: "blue"
                    }, 
                    {
                        label: "cL<sup>(3/2)</sup>/cD Ratio",
                        data: cLThreeHalfD,
                        borderColor: "green",
                        borderWidth: 2,
                        fill: false,
                        pointRadius: 5,
                        pointBackgroundColor: "green"
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: "Airspeed (mph)"
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: "L/D Ratio"
                            }
                        }
                    }
                }
            });
    
            // Required Thrust vs Airspeed
            chartInstance2 = new Chart(ctx2, {
                type: "line",
                data: {
                    labels: airspeed,
                    datasets: [{
                        label: "Thrust Required",
                        data: thrustRequired,
                        borderColor: "red",
                        borderWidth: 2,
                        fill: false,
                        pointRadius: 5,
                        pointBackgroundColor: "red"
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: "Airspeed (mph)"
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: "Thrust (oz)"
                            }
                        }
    
                    }
                }
            });
        }
    }

    altitudeSelect.addEventListener("change", function () {
        updateTable();
        drawChart();
    });

    loadResults();
});