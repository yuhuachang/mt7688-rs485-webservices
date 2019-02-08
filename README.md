# mt7688-rs485-webservices
RS485 Modbus RTU Control for Taiwan Hitachi Air Conditioner on MTK Linkit Smart 7688 Duo

## Getting Started

You need Taiwan Hitachi air conditioners with RS485 signal transmitters.
However, this project should be able to control any Modbus RTU via RS485 with little modification.

### Prerequisites

This build this project, you need:
1) MTK Linkit Smart 7688 Duo
   * https://labs.mediatek.com/en/platform/linkit-smart-7688
2) RS-485 module for Arduino (MAX485)
   * http://yourduino.com/sunshop//index.php?l=product_detail&p=323
   * https://www.taiwaniot.com.tw/shop/module-sensor/%E7%94%A8%E6%88%B6%E4%BB%8B%E9%9D%A2%E8%BC%B8%E5%85%A5%E8%BC%B8%E5%87%BA/ttl-to-rs485rs422-max485-module/
3) RC-RO1XT - Hitachi RS485 Controller

### Wiring:
Name      | MAX485 Pin | 7688 Pin | Desc
--------- | ---------- | -------- | ----
5V        | VCC        | 5V       |
GND       | GND        | GND      |
RS485 A   | A          |          | connect to RS485 bus
RS485 B   | B          |          | connect to RS485 bus
MAX485_TX | DI         | D17      |
MAX485_DE | DE         | D15      |
MAX485_RE | RE         | D16      |
MAX485_RX | RO         | D14      |

### To be able to compile the Arduino code, you need:
1) Download the whole project in zip format from [here](https://github.com/4-20ma/ModbusMaster)
2) In Arduino, Sketch -> Include Library -> Add .zip library and add the zip file.

### Control Modbus on Arduino side.
By using this library in our Arduino side code, we contrl the Modbus devices by SoftwareSerial.

### Communicate Arduino side by serial port.
We talk to the Arduino side by open serial port `/dev/ttyS0`.

The OpenWRT side is basically a web service taking REST call and send the request to Arduino side.

## Final Results

### MT7688 Control Box
![mt7688-control-box](https://yuhuachang.github.io/repo/mt7688-rs485-webservices/mt7688-control-box.jpeg)

### RS485 Wiring
![rs485-controller-wiring](https://yuhuachang.github.io/repo/mt7688-rs485-webservices/rs485-controller-wiring.jpeg)

### Finish
![mt7688-rs485-system-setup](https://yuhuachang.github.io/repo/mt7688-rs485-webservices/mt7688-rs485-system-setup.jpeg)

### Control Cable
![rs485-control-cable](https://yuhuachang.github.io/repo/mt7688-rs485-webservices/rs485-control-cable.jpeg)

## Operation
The basic operation is to control the Modbus devices by web service calls.

The Modbus devices takes four parameters:
1. Slave Address
   - In Modbus protocol topography requires each units on the bus to have a unique id (an integer value).
   - This id is set (by jumper) in the RC-RO1XT, the Hitachi RS485 Controller.
2. Function Code
   - 0x03 -> Read
   - 0x06 -> Write
3. Resgister Address
4. Resgister Value

### Register Chart

Resgister Address | Item | Resgister Value
----------------- | ---- | ---------------
0x00 | Current Temperature  | Celsius (Read Only)
0x20 | Power                | 0: OFF<br>1: ON
0x21 | Operational Mode     | 0: Cooling<br>1: Dehumidify<br>2: Fan Only<br>3: Auto<br>4: Heating
0x22 | Fan Speed            | 5: Auto<br>4: High<br>3: Mid<br>1: Low<br>7: Quiet
0x23 | Target Temperature   | Range 16℃ - 32℃
0x24 | Sleep Mode           | 0: OFF<br>Others: minutes in sleep mode (1~1440)
0x25 | Fuzzy Mode           | 0: OFF<br>1: ON
0x29 | Auto On/Off Timer    | 0: OFF<br>Others: minutes (1~1440)
0x2A | Air Flow Up/Down     | 0: OFF<br>Others: angle
0x2B | Air Flow Left/Right  | 0: OFF<br>Others: angle
0x2D | Remote Control On/Off| 0: Enable<br>1: Disable
0x2E | Beeper On/Off        | 0: Enable<br>1: Disable

### Sample REST Calls
- Read current temperature on unit 2
```
λ curl -X GET http://<ip-address>:8080/2/0x00
{ "value": 24 }
```
- Read current power status on unit 2
```
λ curl -X GET http://<ip-address>:8080/2/0x20
{ "value": 0 }
```
- Turn unit 2 On.
```
λ curl -X PUT -H "Content-Type: application/json" -d "{\"value\": 1}" http://<ip-address>:8080/2/0x20
```

## Reference, Example, and Source:
1) https://github.com/4-20ma/ModbusMaster
2) https://github.com/openopen114/Arduino_Modbus_viaRS485/blob/master/ArduinoCode/ModbusMaster_viaRS485/ModbusMaster_viaRS485.ino

## Authors
Yu-Hua Chang

## License
MIT
