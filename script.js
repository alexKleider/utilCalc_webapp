
"use strict";

var SG = {       // Object containing script globals.
errorReport: "",
errorReportDefault: "",
dataFileName: undefined,
dataFileNameDefault: "Unassigned.",
fileContent: undefined,
fileContentDefault: "JSON data expected; not retrieved as yet.",
resultsContent: undefined,
resultsContentDefault: "Results unavailable.",
jsonData: undefined,

summerDays: 0,
winterDays: 0,

tier1: 0,
tier2: 0,
tier3: 0,
//
// Unused- here solely to provide last comma free entry.
dummyNoCommaItem: undefined
};               // End of script globals.

const galInCuFt = 0.0278;
const tier1price = 0.18212;
const tier2price = 0.25444;
const tier3price = 0.37442;
const summerBase = 7.0;  //| 'Basic' (E6/E1)
const winterBase = 8.5;  //| usage in kWh/day.

const winterMonths = [11, 12, 1, 2, 3, 4];

const monthLengths = {2: 28, 1: 31, // Additional code
                     4: 30, 3: 31,  // accounts for
                     6: 30, 5: 31,  // length of February
                     9: 30, 7: 31,  // i.e. the leap yr
                    11: 30, 8: 31,  // algorithm:
                           12: 31}; // daysInFebruary().

const ids = [   "prevDate", "curDate", "summer", "winter",
    "gasPrice", "gasPrev",  "gasCur",  "cuftUsed", "galUsed",
                "kwhPrev",  "kwhCur",  "tier1", "tier2", "tier3",
            "gasCost",  "kwhCost", "totalCost", "paid", "owing"];

function Date(dateString){
    // Constructor function.
    // Assumes dateString to be in YYYY-MM-DD format.
    var dateArray = dateString.split("-");
    this.yr = Number(dateArray[0]);
    this.mo = Number(dateArray[1]);
    this.day = Number(dateArray[2]);
}

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

function daysafter(date){
// Returns days remaining in the month.
// Date comes in as a string YYYY-MM-DD.
    var d = new Date(date);
    if (d.mo == 2){return daysInFebruary(d.yr) - d.day}
    return monthLengths[d.mo] - d.day;
}

function daysupto(date){
//Returns number of days in the month up to and including date.
// Date comes in as a string YYYY-MM-DD.
    var d = new Date(date);
    return d.day;
}

function baseUsage(month, days){
//Returns base usage earned by given # of days in given month.
//Both params come in as numbers.
//By side effect: keeps track of summer and winter days.
    if (month in winterMonths){
        SG.winterDays += days;
        return winterBase * days;
    }else{
        SG.summerDays += days;
        return summerBase * days;
    }
}

function getBaseUsage(date1, date2){
//Returns usage earned by the interval.
//If date2 is before or the same as date1: warning printed
//to console.log and returns undefined.
    var d1 = new Date(date1);
    var d2 = new Date(date2);
    if ((d1.yr<d2.yr)
    || ((d1.yr==d2.yr) && (d1.mo<d2.mo))
    || ((d1.yr==d2.yr) && (d1.mo==d2.mo) && (d1.day<d2.day))){
        if ((d2.yr == d1.yr) && (d2.mo == d1.mo)){
            return baseUsage(d.mo, d2.day - d1.day);
        }  // Same month so we're done!
        // Not the same month so first get base usage for the
        // first month and the last month:
        var ret = 0;
        var m1Days = daysafter(date1)
        var m2Days = daysupto(date2)
        ret += baseUsage(date1.mo, m1Days)
                + baseUsage(date2.mo, m2Days);
        // Now there remains only to add the intervening days:
        var month = d1.mo +1;
        var year = d1.yr;
        if (month == 13){
            month = 1;
            year = year + 1;
        }
        while((d2.yr>=year) && (d2.mo > month)){
            var monthLength;
            if (month == 2){
                monthLength = daysInFebruary(year);
            }else{
                monthLength = monthLengths[month];
            }
            ret += baseUsage(month, monthLength);
            month += 1
            if (month == 13){
                month = 1;
                year += 1;
            }
        }
        return ret;
    }
    console.log("Current date is before previous date!");
}

function getPgeCost(kwhUsed, base){
//Returns the cost of the kwhUsed.
//Requires the base usage for its calculations.
//Provides closure around the tier pricing.
    SG.tier1 = 0;
    SG.tier2 = 0;
    SG.tier3 = 0;
    if (kwhUsed > 2 * base){
        SG.tier3 = kwhUsed - 2 * base;
        SG.tier2 = base;
        SG.tier1 = base;
    } else if (kwhUsed > base){
        SG.tier2 = kwhUsed - base;
        SG.tier1 = base;
    } else { // kwh <= base;
        SG.tier1 = kwhUsed;
    }
    return SG.tier3 * tier3price +
            SG.tier2 * tier2price +
            SG.tier1 * tier1price;
}


function Container(jPrev, jCur){
    // This constructor will return an object containing
    // all the properties needed to populate the html page.
    // It is here that, with the helper functions,
    // all the calculating is done.

    SG.summerDays = 0;
    SG.WinterDays = 0;
    var baseUsage = getBaseUsage(jPrev.date, jCur.date);

    this.prevDate = jPrev.date;
    this.curDate = jCur.date;
    this.gasPrev = jPrev.gas;
    this.gasCur = jCur.gas;
    this.gasPrice = jCur.cost;
    this.kwhPrev = jPrev.kwh;
    this.kwhCur = jCur.kwh;
    this.summer = SG.summerDays; // These are calculated in
    this.winter = SG.winterDays; // kwhHelpers.js as running
                              // totals by side effect of
                              // getBaseUsage function.
    var cuft = (Number(this.gasCur) -
                Number(this.gasPrev));
    this.cuftUsed = cuft.toFixed(1);
    var gallons = cuft * Number(galInCuFt);
    this.galUsed = gallons.toFixed(2);
    var costOfGas = gallons *
                    Number(this.gasPrice);
    this.gasCost = costOfGas.toFixed(2);
    var kwhUsed = Number(this.kwhCur) - Number(this.kwhPrev);
    var costOfKwh = getPgeCost(kwhUsed, baseUsage);
    this.tier1 = SG.tier1;
    this.tier2 = SG.tier2;
    this.tier3 = SG.tier3;
    this.kwhCost = costOfKwh.toFixed(2);
    this.COST = costOfGas + costOfKwh;
    console.log("new Container sets COST to " + this.COST);
    this.totalCost = this.COST.toFixed(2);
    this.paid = Number(jCur.paid);
    this.owing = undefined;  // Set when container
                     // is pushed to the containers array
                     // with in processJsonStr().
}

// Tests follow:
//
function TestDaysInFebruary(){
    function TestYear(year){
        console.log (year + ": " + daysInFebruary(year));
    }
    var years = [2016, 2017, 2018, 2019, 2020, 2021]
    years.forEach(TestYear);
}


var data = [
{"date": "2016-03-19","gas": 30.1, "price": 0, "kwh": 59466, "paid": 0},
{"date": "2016-04-16","gas": 853.7, "price": 4.079, "kwh": 59708, "paid": 181.35},
{"date": "2016-05-23","gas": 1691.8, "price": 3.379, "kwh": 60063, "paid": 105.21}
]


// Used to be in separate html.js file:

// Contains the browser dependent code.

var conversionFactor = document.getElementById("conversionFactor");
conversionFactor.textContent = String(galInCuFt) +
                               " Gallons per Cubic Ft";

function onChange(event){
    // Event (triggered by user selecting a file) handler.
    // Assigns content of file to var fileContent.
    // Sets up appropriate values for calculate and move buttons.
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

// Helper functions and globals for calculate():
// vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv

var fileContent = '';  // Assigned by onChanage(event)
        // and used by parseInput with in go2wor().
var jsonObj;
var report = document.getElementById("report");
var containers = [];
var topIndex = 0;       // Keeps track of top and
var currentIndex = 0;   // current index of containers.

function disableCalculate(bool){
    document.getElementById("calculateButton").disabled = bool;
}

function disableMoveBack(bool){
    document.getElementById("moveBackButton").disabled = bool;
}

function disableMoveForward(bool){
    document.getElementById("moveForwardButton").disabled = bool;
}

function displayContainer(container){
    // Updates the result fields of the web page.
    var element;
    //element = document.getElementById("prevDate");
    //element.textContent = container["prevDate"];
    for (var ii = 0; ii < ids.length; ii++){
        element = document.getElementById(ids[ii]);
        element.textContent = container[ids[ii]];
    }
}

function moveBack(){
    if (currentIndex == 0){
        console.log("This shouldn't happen!");
        disableMoveBack(true);
    }else{
        currentIndex -= 1;
        displayContainer(containers[currentIndex]);
        disableMoveForward(false);
        if (currentIndex == 0){
            disableMoveBack(true);
        }
    }
}

function moveForward(){
    if (currentIndex >= topIndex){
        console.log("This shouldn't happen!");
        disableMoveForward(true);
    }else{
        currentIndex += 1;
        displayContainer(containers[currentIndex]);
        disableMoveBack(false);
        if (currentIndex >= topIndex){
            disableMoveForward(true);
        }
    }
}

function parseInput(fileContent){
    // Takes the file content (already read into fileContent)
    // and attempts to parse it into global var jsonObj.
    // Reverts to base state if parsing fails.
    try{jsonObj = JSON.parse(fileContent); }
    catch(e){
        if (e instanceof SyntaxError){
            report.textContent = 
            "Parsing JSON file failed due to a syntax error"
            + /*" on line # " +  e.linenumber + */
            ". Fix/edit/change the file and try again.";
            disableCalculate(true);
            disableMoveBack(true);
            disableMoveForward(true);
            return false;
        } else {throw(e); }
    }
    return true;
}


function calculate(){
    // Assigns values to containers array
    // setting its currentIndex and topIndex values;
    // Displays latest results and adjusts buttons.
    if (parseInput(fileContent)){ //Assume return would => false,
                                    // valid object ==> true.
        SG.summerDays = 0;
        SG.winterDays = 0;
        var curJ, prevJ;
        var runningOwing = 0;
        console.log("runningOwing set to " + runningOwing);
        for (var ii = 0; ii < jsonObj.length; ii++){
            if (ii == 0){
                // Can't make a container out of the first object.
                curJ = jsonObj[ii];
            }else{
            // Ready to add a Container.
                prevJ = curJ
                curJ = jsonObj[ii];
                var newContainer = new Container(prevJ, curJ);
                console.log("newContainer.COST: "
                                        + newContainer.COST);
                console.log("newContainer.paid: "
                                        + newContainer.paid);
                runningOwing += newContainer.COST;
                console.log("After runningOwing += curJ.COST: "
                                            + runningOwing);
                runningOwing -= newContainer.paid;
                console.log("After runningOwing -= curJ.paid: "
                                            + runningOwing);
                newContainer.owing = runningOwing.toFixed(2);
                console.log("Assigning owing: " + runningOwing);
                containers.push(newContainer);
            }
        }
        topIndex = containers.length -1;
        currentIndex = topIndex;
        displayContainer(containers[currentIndex]);
        disableMoveBack(false);
        disableMoveForward(true);
    } // else: simply returns. Json wasn't valid.
}

disableCalculate(false)
disableMoveBack(true);
disableMoveForward(true);