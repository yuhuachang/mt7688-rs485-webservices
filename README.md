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

### Wiring:
   * VCC -> 5V (connect to 7688)
   * GND -> GND (connect to 7688)
   * A ---> RS485 A (RS485 line)
   * B ---> RS485 B (RS485 line)
   * DI --> MAX485_TX (connect to any digital pin on 7688)
   * DE --> MAX485_DE (connect to any digital pin on 7688)
   * RE --> MAX485_RE (connect to any digital pin on 7688)
   * RO --> MAX485_RX (connect to any digital pin on 7688)
 
### To be able to compile the Arduino code, you need:
1) Download the whole project in zip format from [here](https://github.com/4-20ma/ModbusMaster)
2) In Arduino, Sketch -> Include Library -> Add .zip library and add the zip file.

## Reference, Example, and Source:
1) https://github.com/4-20ma/ModbusMaster
2) https://github.com/openopen114/Arduino_Modbus_viaRS485/blob/master/ArduinoCode/ModbusMaster_viaRS485/ModbusMaster_viaRS485.ino

## Authors
Yu-Hua Chang

## License
MIT