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

## Final Results

### MT7688 Control Box
![mt7688-control-box](https://yuhuachang.github.io/repo/mt7688-rs485-webservices/mt7688-control-box.jpeg)

### RS485 Wiring
![rs485-controller-wiring](https://yuhuachang.github.io/repo/mt7688-rs485-webservices/rs485-controller-wiring.jpeg)

### Finish
![mt7688-rs485-system-setup](https://yuhuachang.github.io/repo/mt7688-rs485-webservices/mt7688-rs485-system-setup.jpeg)

### Control Cable
![rs485-control-cable](https://yuhuachang.github.io/repo/mt7688-rs485-webservices/rs485-control-cable.jpeg)

## Reference, Example, and Source:
1) https://github.com/4-20ma/ModbusMaster
2) https://github.com/openopen114/Arduino_Modbus_viaRS485/blob/master/ArduinoCode/ModbusMaster_viaRS485/ModbusMaster_viaRS485.ino

## Authors
Yu-Hua Chang

## License
MIT
