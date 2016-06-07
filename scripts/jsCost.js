// Javascript (web interface) version of utility_calc_cost.py
//    file ~/Encrypted/GHRental/Meters/jsCost.js
"use strict";
const galInCuFt = 0.0278;

/*  Data in CSV format:
Date,cu_ft,kwh,current price of propane/gal,paid,comment
2016-03-19,30.1,59466,N/A,N/A,Initial reading
2016-04-16,853.7,59708,$4.079,$181.35,1st reading 
2016-05-23,1691.8,60063,$3.379,$105.21,2nd reading

In JSON notation: */
var dataStr = [
{"date": "2016-03-19","gas": 30.1, "cost": 0,
                        "kwh": 59466, "paid": 0},
{"date": "2016-04-16","gas": 853.7, "cost": 4.079,
                        "kwh": 59708, "paid": 181.35},
{"date": "2016-05-23","gas": 1691.8, "cost": 3.379,
                        "kwh": 60063, "paid": 105.21},
]

//var dataJson = JSON.parse(dataStr)

var gas = {
    prevReading: 853.7,
    curReading: 1691.8,
    cost: 3.379,
    };

function getElectricity(){
    return {
    }
}

var electricityDefaults = {
    prevReading: 59708,
    curReading: 60063,
    date1: {
        yr: 2016,
        mo: 4,
        d: 16,
        },
    date2: {
        yr: 2016,
        mo: 5,
        d: 23,
        },
}

function calculate(){
    var gasResult = document.getElementById('gasResult');
    gasResult.textContent = "New RESULTS";
    disablePreviousReading(false);
}

function doNOTgetJson(){
    document.write("Not executing 'getJson()'.");
}

function getJson(){
  var jsonData, rawJsonElement;
  var resultPage = document.getElementById('results');
  while (true){
    rawJsonElement = document.getElementById('readings');
    try{
    jsonData = JSON.parse(rawJsonElement.textContent);
    resultPage.textContent = rawJsonElement.textContent;
    break
    }catch(e){
        if (e instanceof SyntaxError){
            var newText = 
            "WHAT YOU ENTERED ISN'T VALID JSON!\n Try again.\n"
            + rawJsonElement.textContent;
            rawJsonElement.textContent = newText;
        }
    }
  }
  var output = [];
  jasonData.forEach(function(item){
        output.push(item.date);
        output.push(item.gas);
        output.push(item.cost);
        output.push(item.kwh);
        output.push(item.paid);
        output.push('');
  });
  resultPage.textContent = output;
  disableCalculate(false);
}

function check4Storage(){
    if(typeof(Storage)!=="undefined"){
        console.log("It's OK.");
console.log("End of script.");
    }
    else{
        console.log("Too bad.");
    }
}


var conversionFactor = document.getElementById("conversionFactor");
conversionFactor.textContent = String(galInCuFt) +
                               " Gallons per Cubic Ft";
var prevDate = document.getElementById("prevDate");
var curDate = document.getElementById("curDate");
var kwhPrev = document.getElementById("kwhPrev");
var kwhCur = document.getElementById("kwhCur");
var gasCost = document.getElementById("gasCost");
var gasPrev = document.getElementById("gasPrev");
var gasCur = document.getElementById("gasCur");

check4Storage();

// Rest of file comes from Fa1:


"use strict";
var fileContent = '';
var resultParagraph = document.getElementById("download");
console.log("resultParagraph currently contains:");
console.log(resultParagraph.textContent);

function onChange(event){
    console.log("You've changed files.");
    var file = event.target.files[0];
    var reader = new FileReader();
    reader.onload = function(event){
    fileContent = event.target.result;
    resultParagraph.textContent = fileContent;
    console.log("Returned result is:");
    console.log(fileContent);
    console.log("resultParagraph currently contains:");
    console.log(resultParagraph.textContent);
    }
    reader.readAsText(file);
    disableCalculate(false);
}
/*
function SyntaxError(message){
    this.message = message;
    this.stack = (new Error()).stack;
}
SyntaxError.prototype = Object.create(Error.prototype);
SyntaxError.prototype.name = "SyntaxError";
*/

function processJsonStr(){
    var jsonObj;
    try{jsonObj = $.parseJSON(fileContent);}
    catch(e){
        if (e instanceof SyntaxError){
            resultParagraph.textContent = 
            "Parsing JSON file failed due to a syntax error"
            + /*" on line # " +  e.linenumber + */
            ". Fix/edit/change the file and try again.";
            disableCalculate(true);
            return;
        } else {throw(e); }
    }
    var nItems = jsonObj.length;
    resultParagraph.textContent = "There are "+nItems+" items.";
    var output = ["There are "+nItems+" items.\n"];
    jsonObj.forEach(function(item){
        output.push(item.date);
        output.push(item.gas);
        output.push(item.cost);
        output.push(item.kwh);
        output.push(item.paid);
        output.push('');
    });
    resultParagraph.textContent = output;
    disableMoveBack(false);
}

function moveBack(){
    return;
}

function moveForward(){
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
