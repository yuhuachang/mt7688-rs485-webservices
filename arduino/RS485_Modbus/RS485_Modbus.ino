/*
 * RS485 Modbus RTU Control for Taiwan Hitachi Air Conditioner
 * 
 * Work with RS-485 module for Arduino (MAX485)
 *   http://yourduino.com/sunshop//index.php?l=product_detail&p=323
 *   https://www.taiwaniot.com.tw/shop/module-sensor/%E7%94%A8%E6%88%B6%E4%BB%8B%E9%9D%A2%E8%BC%B8%E5%85%A5%E8%BC%B8%E5%87%BA/ttl-to-rs485rs422-max485-module/
 * 
 * Wiring:
 *   VCC -> 5V (on 7688)
 *   GND -> GND (on 7688)
 *   A ---> RS485 A (RS485 line)
 *   B ---> RS485 B (RS485 line)
 *   DI --> MAX485_TX (on 7688)
 *   DE --> MAX485_DE (on 7688)
 *   RE --> MAX485_RE (on 7688)
 *   RO --> MAX485_RX (on 7688)
 * 
 * Installation:
 * 1. Download the whole project in zip format from https://github.com/4-20ma/ModbusMaster
 * 2. In Arduino, Sketch -> Include Library -> Add .zip library and add that zip file.
 * 
 * Reference Example and Source:
 *   https://github.com/openopen114/Arduino_Modbus_viaRS485/blob/master/ArduinoCode/ModbusMaster_viaRS485/ModbusMaster_viaRS485.ino
 * 
 * Author: Yu-Hua Chang
 */

#include <SoftwareSerial.h>
#include <ModbusMaster.h>

// connection pins
#define MAX485_RX 14
#define MAX485_DE 15
#define MAX485_RE 16
#define MAX485_TX 17

// led to indicate the action
#define LED 13

// number of retry
#define RETRY 20

SoftwareSerial RS485Serial(MAX485_RX, MAX485_TX);
ModbusMaster node;

void preTransmission() {
  digitalWrite(MAX485_DE, HIGH);
  digitalWrite(MAX485_RE, HIGH);
}

void postTransmission() {
  digitalWrite(MAX485_DE, LOW);
  digitalWrite(MAX485_RE, LOW);
}

void setup() {
  pinMode(MAX485_DE, OUTPUT);
  pinMode(MAX485_RE, OUTPUT);
  digitalWrite(MAX485_DE, LOW);
  digitalWrite(MAX485_RE, LOW);

  pinMode(LED, OUTPUT);
  digitalWrite(LED, LOW);

  Serial.begin(9600); // debug serial
  Serial1.begin(57600); // to MPU

  RS485Serial.begin(9600); // to RS485

  // Callbacks allow us to configure the RS485 transceiver correctly
  node.preTransmission(preTransmission);
  node.postTransmission(postTransmission);
}

void loop() {
  // When a request is sent from MPU,
  // it is blocked and waits for the whole action to complete.
  // We see the LED is on, indicating the board is busy.
  if (Serial1.available()) {
    digitalWrite(LED, HIGH);

    // MPU should send request in exactly 4 bytes binary.
    uint8_t buffer[4];
    Serial1.readBytes(buffer, sizeof(buffer) / sizeof(byte));
    uint8_t slave_addr = buffer[0];
    uint8_t function_code = buffer[1];
    uint8_t register_addr = buffer[2];
    uint8_t register_value = buffer[3];

    Serial.print("slave_addr: 0x");
    Serial.print(slave_addr, HEX);
    Serial.print(" function_code: 0x");
    Serial.print(function_code, HEX);
    Serial.print(" register_addr: 0x");
    Serial.print(register_addr, HEX);
    Serial.print(" register_value: 0x");
    Serial.print(register_value, HEX);
    Serial.println("");

    // Connect to slave
    node.begin(slave_addr, RS485Serial);

    // Retry many times until the action is completed successfully.
    for (int retry = 1; retry <= RETRY; retry++) {
      if (function_code == 0x03) {
        Serial.print("read holding registers at register_addr 0x");
        Serial.print(register_addr, HEX);
        Serial.print(" on slave_addr 0x");
        Serial.println(slave_addr, HEX);

        // All of our operations only need to read one byte.
        uint8_t result = node.readHoldingRegisters(register_addr, 1);

        if (result == node.ku8MBSuccess) {
          uint16_t value = node.getResponseBuffer(0);
          Serial.print("response value = ");
          Serial.println(value);

          // Return only 8 bit unsigned integer value
          // because, due to the spec, the return value will never exceed this size.
          Serial1.write(value & 0xFF);
          break;
        } else {
          Serial.print("unsuccessfull read: ");
          Serial.println(result);

          if (retry >= RETRY) {
            // Return 0xFF after all attempts failed.
            Serial1.write(0xFF);
          } else {
            // Wait a while before next attempt.
            delay(100);
          }
        }
      } else if (function_code == 0x06) {
        Serial.print("write single register at addr 0x");
        Serial.print(register_addr, HEX);
        Serial.print(" on slave_addr 0x");
        Serial.print(slave_addr, HEX);
        Serial.print(" to 0x");
        Serial.println(register_value, HEX);

        uint8_t result = node.writeSingleRegister(register_addr, register_value);
        if (result == 0) {
          Serial.println("write success");

          // Return zero means no error.
          Serial1.write(0x00);
          break;
        } else {
          Serial.print("write failed. error code: ");
          Serial.println(result);

          if (retry >= RETRY) {
            // Return error code.
            Serial1.write(result);
          } else {
            // Wait a while before next attempt.
            delay(100);
          }
        }
      }
    }

    // Clear input
    while (Serial1.available()) {
      Serial1.read();
    }

    // Clear output
    Serial.flush();
    Serial1.flush();

    // Completed
    digitalWrite(LED, LOW);
  }
}
