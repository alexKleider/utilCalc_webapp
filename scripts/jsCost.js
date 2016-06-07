// Javascript (web interface) version of utility_calc_cost.py
//    file ~/Encrypted/GHRental/Meters/jsCost.js
"use strict";
const galInCuFt = 0.0278;
const kwhPrice1 = 0.18212;
const kwhPrice2 = 0.25444;
const kwhPrice3 = 0.37442;
const summerBase = 7.0;  //| 'Basic' (E6/E1)
const winterBase = 8.5;  //| usage in kWh/day.

const winterMonths = [11, 12, 1, 2, 3, 4];

function daysInFebruary(year){
    var yr = Number(year);
    if (yr == NaN){
        console.log("Bad input for a year.");
        return;
    }
    if (yr < 2000){
        console.log("Probably an invalid (<2000) year.");
    }
    if (yr % 400 ==0) return 29;
    if (yr % 100 ==0) return 28;
    if (yr % 4 ==0) return 29;
    return 28;
}

var protoInterval = {
    dates: {
        prev: {
        yr: 2016,
        mo: 0,
        d: 0,
        },
        cur: {
        yr: 2016,
        mo: 0,
        d: 0,
        },
    },
    gas: {
        prev: 0,
        cur: 0,
        cost: 0
    },
    kwh: {
        prev: 0,
        cur: 0,
    }
}


function calculate(){
    var gasResult = document.getElementById('gasResult');
    gasResult.textContent = "New RESULTS";
    disablePreviousReading(false);
}

var conversionFactor = document.getElementById("conversionFactor");
conversionFactor.textContent = String(galInCuFt) +
                               " Gallons per Cubic Ft";

var fileContent = '';
var report = document.getElementById("report");

function onChange(event){
    // Assigns fileContent in response to
    // a change in input file assignation.
    console.log("You've changed files.");
    var file = event.target.files[0];
    var reader = new FileReader();
    reader.onload = function(event){
        fileContent = event.target.result;
        report.textContent = fileContent;
    }
    reader.readAsText(file);
    disableCalculate(false);
    disableMoveForward(true);
    disableMoveBack(true);
}

function processJsonStr(){
    // Attempts to convert fileContent into
    // a json object consisting of an array
    // of readings; if successful, each pair 
    // of these readings is made into a 
    // protoInterval type object and an array
    // (length one less than the json)
    // is returned.
    // If unsuccessful, returns no value.
    // Populates the report ("Result of
    // File Choice:") window.
    var jsonObj;
    try{jsonObj = $.parseJSON(fileContent);}
    catch(e){
        if (e instanceof SyntaxError){
            report.textContent = 
            "Parsing JSON file failed due to a syntax error"
            + /*" on line # " +  e.linenumber + */
            ". Fix/edit/change the file and try again.";
            disableCalculate(true);
            disableMoveBack(true);
            disableMoveForward(true);
            return;
        } else {throw(e); }
    }
    var nItems = jsonObj.length;
    report.textContent = "There are "+nItems+" items.";
    var output = ["There are "+nItems+" items.\n"];

    jsonObj.forEach(function(item){
        output.push(item.date);
        output.push(item.gas);
        output.push(item.cost);
        output.push(item.kwh);
        output.push(item.paid);
        output.push('');
    });

    report.textContent = output;
    disableMoveBack(false);
    disableMoveForward(true);
}

function moveBack(){
    disableMoveForward(false);
    return;
}

function moveForward(){
    disableMoveBack(false);
    return;
}

function disableCalculate(bool){
    document.getElementById("calculate").disabled = bool;
}

function disableMoveBack(bool){
    document.getElementById("moveBackButton").disabled = bool;
}

function disableMoveForward(bool){
    document.getElementById("moveForwardButton").disabled = bool;
}

disableCalculate(true)
disableMoveBack(true);
disableMoveForward(true);
