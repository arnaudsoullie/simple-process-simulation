# This Python endpoint is in charge of exchanging data between a Modbus PLC and the web simulation

# Let's start with the imports
from atexit import register
from flask import Flask, render_template, request
from pymodbus.client.sync import ModbusTcpClient as ModbusClient
import json

app = Flask(__name__, static_url_path='', template_folder='')

# Configure the PLC
PLC_HOST = '127.0.0.1'
UNIT = 1

# Simulation visual
@app.route('/')
def simulation():
    return render_template("index.html")

# Gather process values and return control values, this request is made every second by the javascript simulation
@app.route('/update', methods = ['POST'])
def update():
    # Read the data
    pv = request.json

    try:
        # Update the Modbus values
        # Put that in a try because it might very well fail
        client = ModbusClient(PLC_HOST, port=502)
        client.connect()

        rr = client.write_register(10, round(pv['x0']), unit=UNIT) # Mixing tank level
        rr = client.write_register(11, round(pv['x1']), unit=UNIT) # Destination tank level
        rr = client.write_register(12, round(pv['x2']), unit=UNIT) # Agitator real RPM
        rr = client.write_register(13, round(pv['x3']), unit=UNIT) # Pump real RPM

        # Read the modbus values
        cv_coils = client.read_coils(0, 8, unit=UNIT)
        cv_registers = client.read_holding_registers(0, 4, unit=UNIT)
       
        # Return the response
        cv = {
        "y0": cv_coils.bits[0], # mixing tank inlet valve 1
        "y1": cv_coils.bits[1], # mixing tank inlet valve 2
        "y2": cv_coils.bits[2], # mixing tank outlet valve 
        "y3": cv_coils.bits[3], # storage tank inlet valve
        "y4": cv_coils.bits[4], # mixer start
        "y5": cv_registers.registers[0], # mixer target RPM
        "y6": cv_coils.bits[5], # pump start
        "y7": cv_registers.registers[1], #pump target RPM
        }

        data = json.dumps(cv)
        print(data)

    except:
        pass
        data = """
        {
            "y0": 0,
            "y1": 0,
            "y2":0,
            "y3":0,
            "y4":0,
            "y5":0,
            "y6":0,
            "y7": 0,
            "connection": "lost"
        }
        """
    
    return data
