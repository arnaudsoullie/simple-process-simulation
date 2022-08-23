


# Simple Process Simulation
HTML/JS process simulation interacting with a modbus device

This project was created for our workshop on PLC code security at DEFCON 30.
The idea is to be able to "see" a physical process when developping PLC code.

To do so, a HTML/JS webpage simulates and displays the state of the process based on values gathered from a Modbus PLC. This can a real PLC or of software PLC, or even a PLC simulator:
![spp_behind_the_scenes](https://user-images.githubusercontent.com/93718/185954113-295fd31d-68de-4670-9b85-9004ef87d573.png)


A SCADA software can also be added for a more realistic environment. When the PLC is configured adequately, this is how it looks like:

https://user-images.githubusercontent.com/93718/185953966-d821a5ce-f6f0-4802-98bf-158652c5b7b4.mp4

# Requirements
The Python 3 app relies on ``Flask``, ``atexit``, ``pymodbus`` and ``json`` modules

# Usage
Navigate to the project folder and launch ``python3 -m flask run``
Then navigate to http://localhost:5000 with your web browser

# Tweaking the simulation
I tried my best to have code that is simple to read.
If you want to modify information about the PLC (IP address for example) or the coils & registers associated with the values ==> ``app.py``
If you want to modify the simulation itself (changing the speed of the process, adding new errors...) ==> ``static/app.js``

# Contributions
I would welcome any comment or suggestion on how to make it more realistic, while keeping it fairly simple

# Similar work
This is by far not the first attempt at simulating an industrial process :)
You can look at the following alternatives / similar solutions:
 - [FactoryIO](https://factoryio.com/): A commercial 3D process simulation for PLC training
 - [GRFICSv2](https://github.com/Fortiphyd/GRFICSv2): Version 2 of the Graphical Realism Framework for Industrial Control Simulation (GRFICS) by Fortiphyd
 - [Virtuaplant](https://github.com/jseidl/virtuaplant): A simple Python project to simulates processes (now deprecated)







