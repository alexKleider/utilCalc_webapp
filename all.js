// Used to be in separate constants.js file:
"use strict";
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
                "gasCost",  "kwhCost", "totalCost" ];

// used to be in separate pure.js file:

// Browser independent code supporting utility calculations.
// See also the browser dependent js file: jsCost.js
// These two files as well as jQuery must be in scripts/.

// Used to be in file: scripts/kwhHelpers.js
//
"use strict";

var summerDays = 0;
var winterDays = 0;

//debugger;

function Date(dateString){
    // Constructor function.
    // Assumes dateString to be in YYYY-MM-DD format.
    console.log("Date constructor being called with '"
                    + dateString + "' which is typeof: "
                    + (typeof dateString));
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
// returns days remaining in the month.
    console.log("daysafter(date) getting " + date);
    var d = new Date(date);
    if (d.mo == 2){return daysInFebruary(d.yr) - d.day}
    return monthLengths[d.mo] - d.day;
}

function daysupto(date){
//Returns number of days in the month up to and including date.
    console.log("daysupto(date) getting " + date);
    var d = new Date(date);
    return d.day;
}

function baseUsage(month, days){
//Returns base usage earned by given # of days in given month.
    if (month in winterMonths){
        winterDays += days;
        return winterBase * days;
    }
    summerDays += days;
    return summer_base * days;
}

function baseUsageAfter(date){
// Returns usage earned in the month by the days after the date.
    console.log("baseUsageAfter(date) getting " + date);
    var d = new Date(date);
    return baseUsage(d.mo, daysafter(date));
}

function baseUsageUpto(date){
//Returns usage earned in the month up to and including the date.
    console.log("baseUsageUpto(date) getting " + date);
    var d = new Date(date);
    return baseUsage(d.mo, daysupto(date));
}

function getBaseUsage(date1, date2){
//Returns usage earned by the interval.
//If date2 is before or the same as date1: warning printed
//to console.log and returns undefined.
    console.log("getBaseUsage(date1, date2) getting "
                    + date1 + " & " + date2);
    var d1 = new Date(date1);
    var d2 = new Date(date2);
    if ((d1.yr<d2.yr)
    || ((d1.yr==d2.yr) && (d1.mo<d2.mo))
    || ((d1.yr==d2.yr) && (d1.mo==d2.mo) && (d1.day<d2.day))){
        if ((d2.yr == d1.yr) && (d2.mo == d1.mo)){
            return baseUsage(d.mo, d2.day - d1.day);
        }
        var ret = baseUsageAfter(date1) + baseUsageUpto(date2);
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
            if (month in winterMonths){
                summerDays += monthLength;
                ret += summerBase * monthLength;
            }else{
                winterDays += monthLength;
                ret += winterBase * monthLength;
            }
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
    if (kwhUsed > 2 * base){
        return((kwhUsed - 2 * base) * tier3price
                        + base * tier2price
                        + base * tier2price)
    }
    if (kwhUsed > base){
        return ((kwhUsed - base) * tier2price
                        + base * tier1price);
    }
    return kwhUsed * tier1price;
}


function Container(jPrev, jCur){
    // This constructor will return an object containing
    // all the properties needed to populate the html page.
    // It is here that, with the helper functions,
    // all the calculating is done.

    var baseUsage = getBaseUsage(jPrev.date, jCur.date);

    this.prevDate = jPrev.date;
    this.curDate = jCur.date;
    this.gasPrev = jPrev.gas;
    this.gasCur = jCur.gas;
    this.gasPrice = jCur.cost;
    this.kwhPrev = jPrev.kwh;
    this.kwhCur = jCur.kwh;
    this.paid = jCur.paid;
    this.summer = summerDays; // These are calculated in
    this.winter = winterDays; // kwhHelpers.js as running
                              // totals by side effect of
                              // getBaseUsage function.
    this.cuftUsed = (Number(this.gasCur) -
                    Number(this.gasPrev));
    var gallons = cuftUsed * Number(galInCuFt);
    this.galUsed = gallons.toFixed(2);
    this.tier1 = 0;
    this.tier2 = 0;
    this.tier3 = 0;
    var costOfGas = Number(this.galUsed) *
                    Number(this.gasPrice);
    this.gasCost = costOfGas.toFixed(2);
    var kwhUsed = Number(this.kwhCur) - Number(this.kwhPrev);
    var costOfKwh = getPgeCost(kwhUsed, baseUsage);
    this.kwhCost = costOfKwh.toFixed(2);
    this.totalCost = (costOfGas + costOfKwh).toFixed(2);
    this.owing =0;  // This will be set when container
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
        console.log(element + ' ' + ids[ii]);
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
        var curJ, prevJ;
        var runningOwing = 0;
        for (var ii = 0; ii < jsonObj.length; ii++){
            if (ii == 0){
                // Can't make a container out of the first object.
                curJ = jsonObj[ii];
            }else{
            // Ready to add a Container.
                prevJ = curJ
                curJ = jsonObj[ii];
                var newContainer = new Container(prevJ, curJ);
                runningOwing += curJ.totalCost
                runningOwing -= curJ.paid;
                newContainer.owing = runningOwing;
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
