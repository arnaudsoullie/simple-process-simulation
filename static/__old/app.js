const INTERVAL = 1000 //ms
const URL = "http://localhost:5000/update"

const roomTemperature = 20
const stillLevelIncrease = 80
const stillLevelDecrease = 1
const stillLevelMax = 2200
const stillTempMaxforFill = 30
const condenserDecrease = 0.3
const condenserIncrease = 1.5
const condenserMax = roomTemperature
const condenserMin = 5
const condenserFitTemperature = 10
const stillTemperatureIncrease = 2.0
const stillTemperaturedecrease = 0.5
const stillTemperatureMax = 100
const stillTemperatureMin = 85
const barrellevelIncrease = 2.0
const barrelMax = 110
const differeceStillCondenser = 80

let stillLevel = document.getElementById("stillLevel")
let stillTemp = document.getElementById("stillTemp")
let condencerTemp = document.getElementById("condenserTemp")
let barrellevel = document.getElementById("barrellevel")
let washCharger = document.getElementById("washCharger")
let stillHeater = document.getElementById("stillHeater")
let waterPump = document.getElementById("waterPump")
let waterPumpLed = document.getElementById("waterPumpLed")
let condenser = document.getElementById("condenser")
let feedback = document.getElementById("feedback")
let resetBtn = document.getElementById("resetBtn")

// Start values
let pv ={
    "x0" : roomTemperature,   //still temperature 
    "x1" : 0,   //still level
    "x2" : roomTemperature,   //condenser temperature
    "x3" : 0    //barrel level
}

// On reset we set the value to the start values
resetBtn.addEventListener("click", (e)=>{
    pv.x0 = roomTemperature
    pv.x1 = 0
    pv.x2 = roomTemperature
    pv.x3 = 0
})

var body = JSON.stringify(pv)
console.log(body)

setInterval(() => {
    fetch( URL, {
            method: "POST",
            mode: "same-origin",
            cache: "no-cache",
            "credentials" : "same-origin",
            headers: {
            'Content-Type': 'application/json'
        },
        body
    })
    .then((response)=>{
        if (response.ok)
            return response.json();
        else
            throw new Error('Error:');
    })
    .then((json)=>{
        updatevalues(json)
    })
    .catch((err)=>{
        //error handling
        console.error(err)
    }) 
}, INTERVAL)

// Here's the "logic" of the process. **Over-simplified** of course.
function updatevalues(values){

    status_message = 'Distillation in progress'
    feedback.style.backgroundColor = "white"
    // y1 is the wash intake valve
    // If y1 is closed (y1 == false), then the level doesn't change
    // If y1 is open (y1 == true), then the level increases until it is full (let's say 10 000 liters)
    // Unless the pot still is too hot
    if(values.y1 === true){
        if(pv.x0 > stillTempMaxforFill) {
            feedback.innerText = 'You shouldn\'t fill a pot still if it is already hot. Start over!'
            feedback.style.backgroundColor = "red"
            throw new Error('Pot Still too hot');
        } 
        else {
            pv.x1 += stillLevelIncrease
        }
    }
    // If the still is overfilled
    if(pv.x1 > stillLevelMax) {
        feedback.innerText = 'Pot still overfilled. Start over!'
        feedback.style.backgroundColor = "red"
        throw new Error('Pot Still overfilled');
    }

    // y2 is the heater
    // if the heater is on (y2 >=1, then the temperature increases proportionaly to the value on the heater (1, 2 or 3) )
    if(values.y2 >= 1){
        pv.x0 += values.y2*stillTemperatureIncrease
    }
    // if the heater is off (y2 == 0), then the temperature slowly decreases until it reaches room temperature
    if(values.y2 < 1){
        pv.x0 -= stillTemperaturedecrease
            if(pv.x0 <= roomTemperature){
                pv.x0 = roomTemperature
            }
    }

    //y3 is the condenser pump
    // If the pump is on (y3 >= 1), then the temperature of the condenser decreases until it reaches the min temperature (condenserMin)
    if(values.y3 >= 1){
        pv.x2 -= values.y3*condenserDecrease
        if(pv.x2 <= condenserMin){
            pv.x2 = condenserMin
        }
    }
    // If the pump is off (y3 == 0), then the condenser slowly increases until it reaches its max temperature (condesnserMax, which should be equal to roomTemperature)
    else{
        pv.x2 += condenserIncrease
        if(pv.x2 >= condenserMax){
            pv.x2 = condenserMax
        }
    }

    // Now, the distillation
    if(pv.x0 >= stillTemperatureMin // The temperature is high enough
        && values.y4 === true  // AND the Valve is open
        && pv.x1 > 0){ //  AND The pot still is not empty
        if(pv.x2 <= condenserFitTemperature) { // AND The condenser temp is low enough
            // THEN the barrel starts to fill
            // AND the pot still level decreases
            pv.x3 += barrellevelIncrease
            pv.x1 -= barrellevelIncrease
        } 
        else { // If the condenser temp is too high then it doesn't condensate, start again
            status_message = 'Error: Condenser temp was not low enough. Start Over!'
            feedback.style.backgroundColor = "red"
            //throw new Error('Condenser too hot');
        }
    }    
    
    if(pv.x3 >= barrelMax){
        status_message = 'Error: barrel overfiled you spilled good Whiskey on the floor :( Start Over!'
        feedback.style.backgroundColor = "red"
        //throw new Error('Pot Still overfilled');
    }

    if(values.connection == 'lost') {
        status_message = 'Connection to the PLC lost'
        feedback.style.backgroundColor = "orange"
    }
    body = JSON.stringify(pv)
    displayValues(values)
}

function displayValues(controllValues){
    // Update the process values displayed
    stillTemp.innerText = pv.x0.toFixed(0) + '°C'
    stillLevel.innerText = pv.x1.toFixed(0) + ' L'
    condencerTemp.innerText = pv.x2.toFixed(0) + '°C'
    barrellevel.innerText = pv.x3.toFixed(0) + ' L'
    feedback.innerText = status_message

    // Update the control values displayed
    // Wash intake
    //console.log(`Wash Intake valve :: ${controllValues.y1}`)
    if(controllValues.y1){
        washCharger.style.backgroundColor = "green"
        washCharger.innerText = 'O'
    }
    else{
        washCharger.style.backgroundColor = "red"
        washCharger.innerText = 'C'
    }
    
    // Heater
    //console.log(`Heater :: ${controllValues.y2}`)
    if(controllValues.y2>0){
        stillHeater.style.backgroundColor = "green"
    }
    else{
        stillHeater.style.backgroundColor = "red"
    }
    stillHeater.innerText = controllValues.y2.toFixed(0)

    // Cooling water pump
    waterPumpLed.innerText = controllValues.y3.toFixed(0)
    if(controllValues.y3 > 0){
        waterPumpLed.style.backgroundColor = "green"
    }
    else{
        waterPumpLed.style.backgroundColor = "red"
    }

    if(controllValues.y4){
        condenser.style.backgroundColor = "green"
        condenser.innerText = 'O'
    }
    else{
        condenser.style.backgroundColor = "red"
        condenser.innerText = 'C'
    }
}
