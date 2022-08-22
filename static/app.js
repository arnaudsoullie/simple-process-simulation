// Constants definition
const INTERVAL = 1000 //ms
const URL = "http://localhost:5000/update"
const FILLING_UNIT = 100
const PUMP_UNIT = 50
const MIXING_TANK_CAPACITY = 2100
const DESTINATION_TANK_CAPACITY = 1000
const MIXING_UNIT = 1
const AGITATOR_MAX_RPM = 1400
const AGITATOR_REQUIRED_RPM = 1100
const AGITATOR_REQUIRED_TIMER = 20
const PUMP_REQUIRED_RPM = 1100
const PUMP_MAX_RPM = 3000


// 
let feedback = document.getElementById("feedback")
let resetBtn = document.getElementById("resetBtn")
let AgitatorMotor = document.getElementById("AgitatorMotor")
let InletValve1 = document.getElementById("InletValve1")
let InletValve2 = document.getElementById("InletValve2")
let InletValve3 = document.getElementById("InletValve3")
let OutletValve1 = document.getElementById("OutletValve1")
let Pump = document.getElementById("Pump")
let MixingTankLevel = document.getElementById("MixingTankLevel")
let DestinationTankLevel = document.getElementById("DestinationTankLevel")
let AgitatorRPM = document.getElementById("AgitatorRPM")
let PumpRPM = document.getElementById("PumpRPM")
let Agitator_gif = document.getElementById("Agitator_gif")


// Start values
let pv ={
    "x0" : 0,   // Mixing tank level
    "x1" : 0,   // Destination tank level
    "x2" : 0,   // Agitator real RPM
    "x3" : 0    // Pump real RPM
}
let agitator_timer = 0
let agitated = false

// On reset we set the value to the start values
resetBtn.addEventListener("click", (e)=>{
    pv.x0 = 0
    pv.x1 = 0
    pv.x2 = 0
    pv.x3 = 0
    agitator_timer = 0
    agitated = false
})

var body = JSON.stringify(pv)
//console.log(body)

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


// Debug graphique
/* InletValve1.innerText = "V1"
InletValve2.innerText = "V2"
InletValve3.innerText = "V3"
OutletValve1.innerText = "O1"
AgitatorMotor.innerText = "M1"
Pump.innerText = "P"
MixingTankLevel.innerText = "900 L"
DestinationTankLevel.innerText = "400 L"
AgitatorRPM.innerText = "100 RPM"
PumpRPM.innerText = "80 RPM" */

function updatevalues(values){

    if(values.connection == 'lost') {
        feedback.innerText = 'Connection to the PLC lost'
        feedback.style.backgroundColor = "orange"
    }
    else {
        feedback.innerText = 'Process started'
        feedback.style.backgroundColor = "white"
    }

    InletValve1.innerText = values.y0 == true ? "O" : "C";
    InletValve1.style.background = values.y0 == true ? "green" : "red";
    InletValve2.innerText = values.y1 == true ? "O" : "C";
    InletValve2.style.background = values.y1 == true ? "green" : "red";
    OutletValve1.innerText = values.y2 == true ? "O" : "C";
    OutletValve1.style.background = values.y2 == true ? "green" : "red";
    InletValve3.innerText = values.y3 == true ? "O" : "C";
    InletValve3.style.background = values.y3 == true ? "green" : "red";
    AgitatorMotor.innerText = values.y4 == true ? "R" : "S";
    AgitatorMotor.style.background = values.y4 == true ? "green" : "red";
    Pump.innerText = values.y5 == true ? "R" : "S";
    Pump.style.background = values.y5 == true ? "green" : "red";

    /* Reminder about the variables
    "y0": cv_coils.bits[0], # mixing tank inlet valve 1
    "y1": cv_coils.bits[1], # mixing tank inlet valve 2
    "y2": cv_coils.bits[2], # mixing tank outlet valve 
    "y3": cv_coils.bits[3], # storage tank inlet valve
    "y4": cv_coils.bits[4], # mixer start
    "y5": cv_registers.registers[0], # mixer target RPM
    "y6": cv_coils.bits[5], # pump start
    "y7": cv_registers.registers[1], #pump target RPM */
    
    // Mixing tank level
    
    // If at least one of the inlet valves is open and the outlet valve is open, then we failed
    if((values.y0 == true || values.y1 == true) && values.y2 == true) {
        feedback.innerText = 'You cannot fill the tank with the outlet valve open!\r\nStart over'
        feedback.style.backgroundColor = "red"
        return;
    }
    
    // If we fill the two products at the same time we have no way to measure how much of each one we put
    if(values.y0 == true && values.y1 == true && MixingTankLevel > 0) {
        feedback.innerText = 'You cannot fill the two products at the same time!\r\nStart over'
        feedback.style.backgroundColor = "red"
        return;
    }

    // Filling the Mixing tank
    if((values.y0 == true || values.y1 == true) && values.y2 == false) {
        pv.x0+= FILLING_UNIT
    }

    // Overfilling
    if(pv.x0 > MIXING_TANK_CAPACITY) {
        console.log('overfill')
        feedback.innerText = 'Mixing tank overfill!\r\nStart over'
        feedback.style.backgroundColor = "red"
        return;
        //throw new Error('Tank overfilled');
    }

    // Agitator

    // Display the gif is the pump is running (even at 0 RPM to keep it simple)
    if( values.y4 == true) {
        Agitator_gif.style.visibility = "visible"
    }
    else {
        Agitator_gif.style.visibility = "hidden"
    }

    // Speed up ramp for agitator

    if((values.y4 == true) && (values.y5 > pv.x2)) {
        pv.x2+=Math.abs((pv.x2-values.y5)/2)
    }

    // Speed down the pump
    if(values.y4 == false) {
        if (pv.x2 > 0) {
            pv.x2-=Math.abs((pv.x2/2))
        }
        else {
            pv.x2 = 0
        }
    }

    // If we agitate too fast, the mix is ruined
    if(pv.x2 > AGITATOR_MAX_RPM) {
        console.log('agitator too fast')
        feedback.innerText = 'Agitator too fast, mixture ruined!\r\nStart over'
        feedback.style.backgroundColor = "red"
        return;
    }

    // If we mix correctly (all valves closed & the right speed)
    if( (values.y0 == false) && (values.y1 == false) && (values.y2 == false) && (pv.x2>=AGITATOR_REQUIRED_RPM) ) {
        agitator_timer+=1
        if(agitator_timer > AGITATOR_REQUIRED_TIMER) {
            agitated = true
        }
    }
    
    // Destination tank & pump

    // Do not pump if it's not mixed enough
    if((agitated == false) && (values.y2 == true) && (MixingTankLevel >0)) {
        console.log('not mixed enough')
        feedback.innerText = 'The mix was not agitated enough!\r\nStart over'
        feedback.style.backgroundColor = "red"
    }

    // Do not pump if there is no mix or if the outlet valve is closed, or if the inlet valve 3 is closed
    if( ((MixingTankLevel <= 0) || (values.y2 == false)) && (values.y6 == true) ) {
        console.log('Empty pumping')
        feedback.innerText = 'The pump is broken because it was running without liquid!\r\nStart over'
        feedback.style.backgroundColor = "red"
        return;
    }

    // Do not pump if the inlet valve3 is closed
    if( (values.y3 == false) && (values.y6 == true) ) {
        console.log('Pumping to a closed valve')
        feedback.innerText = 'Overpressure because inlet valve 3 is closed!\r\nStart over'
        feedback.style.backgroundColor = "red"
        return;
    }

    // If destination tank is full
    if( (DestinationTankLevel > DESTINATION_TANK_CAPACITY) ) {
        console.log('Destination tank overfill')
        feedback.innerText = 'You overfilled the destination tank!\r\nStart over'
        feedback.style.backgroundColor = "red"
        return;
    }

    // Speed up ramp for pump
    if((values.y6 == true) && (values.y7 > pv.x3)) {
        pv.x3+=Math.abs((pv.x3-values.y7)/2)
    }

    // Speed down the pump
    if(values.y6 == false) {
        if (pv.x3 > 0) {
            pv.x3-=Math.abs((pv.x3/2))
        }
        else {
            pv.x3 = 0
        }
    }

    // Do not pump too fast
    if( (pv.x3 > PUMP_MAX_RPM) ) {
        console.log('Pump overheat')
        feedback.innerText = 'You overheated the pump by going too fast!\r\nStart over'
        feedback.style.backgroundColor = "red"
        return;
    }

    // Fill  the destination tank
    if((values.y6 == true) && (pv.x3 >= PUMP_REQUIRED_RPM) && (pv.x0 >= 0) ) {
        console.log('go go go')
        if( (pv.x0 > 0) && (pv.x1 < DESTINATION_TANK_CAPACITY)) {
            pv.x1+= PUMP_UNIT
            pv.x0-= PUMP_UNIT
        } 
    }


    // Congrats, you did it ;)
    if(pv.x1 == DESTINATION_TANK_CAPACITY && agitated) {
        console.log('success')
        feedback.innerText = 'Congratulations, mixing operation complete'
        feedback.style.backgroundColor = "green"
    }



    body = JSON.stringify(pv)
    displayValues(values)
}

function displayValues(ControlValues){
    // Update control values
    InletValve1.innerText = ControlValues.y0 == true ? "O" : "C";
    InletValve1.style.background = ControlValues.y0 == true ? "green" : "red";
    InletValve2.innerText = ControlValues.y1 == true ? "O" : "C";
    InletValve2.style.background = ControlValues.y1 == true ? "green" : "red";
    OutletValve1.innerText = ControlValues.y2 == true ? "O" : "C";
    OutletValve1.style.background = ControlValues.y2 == true ? "green" : "red";
    InletValve3.innerText = ControlValues.y3 == true ? "O" : "C";
    InletValve3.style.background = ControlValues.y3 == true ? "green" : "red";
    AgitatorMotor.innerText = ControlValues.y4 == true ? "R" : "S";
    AgitatorMotor.style.background = ControlValues.y4 == true ? "green" : "red";
    Pump.innerText = ControlValues.y6 == true ? "R" : "S";
    Pump.style.background = ControlValues.y6 == true ? "green" : "red";

    // Update the process values displayed
    /* Reminder about the variables
        x0: Mixing tank level
        x1: Destination tank level
        x2: Agitator real RPM
        x3: Pump real RPM */
    MixingTankLevel.innerText = pv.x0.toFixed(0) + ' L'
    DestinationTankLevel.innerText = pv.x1.toFixed(0) + ' L'
    AgitatorRPM.innerText = pv.x2.toFixed(0) + ' RPM'
    PumpRPM.innerText = pv.x3.toFixed(0) + ' RPM'
}