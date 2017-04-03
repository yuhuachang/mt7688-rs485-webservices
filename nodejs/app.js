//
// RS485 Modbus RTU Control for Taiwan Hitachi Air Conditioner
// RESTful web services server.
// 
// To enable ECMAScript 2015 features, use the following command to run:
//   node --harmony app.js
//
// Put app.js and index.html file in /root/index.html
//
// Author: Yu-Hua Chang
//
"use strict";
process.title = 'node-app';

////////////////////////////////////////////////////////////////////////////////
// Settings
const HTTP_PORT = 8080;

////////////////////////////////////////////////////////////////////////////////
// Import libraries
const http = require('http');
const url = require('url');
const SerialPort = require("serialport").SerialPort;
const fs = require('fs');

////////////////////////////////////////////////////////////////////////////////
// Request Queue
const requestQueue = [];

////////////////////////////////////////////////////////////////////////////////
// open serial port to MCU
const serial = new SerialPort("/dev/ttyS0", {
  baudrate: 57600
});

////////////////////////////////////////////////////////////////////////////////
// http server to server the static pages
const server = http.createServer((request, response) => {

  if (requestQueue.length > 0) {
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.writeHead(423, {'Content-Type': 'text/plain'});
    response.write('423 Locked\n');
    response.end();
    return;
  }

  // lock
  requestQueue.push({
    'slaveAddr': undefined,
    'functionCode': undefined,
    'registerAddr': undefined,
    'registerValue': undefined,
    'response': response
  });

  let body = [];
  request.on('error', (err) => {
    console.error(err);
  }).on('data', (chunk) => {
    body.push(chunk);
  }).on('end', () => {
    body = Buffer.concat(body).toString();

    // retrieve slave address and target register address from url
    let req = request.url.split('/');
    if (req.length == 3) {
      requestQueue[0].slaveAddr = parseInt(req[1], 16);
      requestQueue[0].registerAddr = parseInt(req[2], 16);
    }

    // determine function by request method.
    if (request.method === 'GET') {
      // read holding register
      requestQueue[0].functionCode = 0x03;
      requestQueue[0].registerValue = 0x00;
    } else if (request.method === 'PUT') {
      // write single register
      requestQueue[0].functionCode = 0x06;
      try {
        let json = JSON.parse(body);
        requestQueue[0].registerValue = json.value;
      } catch (err) {
        console.error(err);
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.writeHead(400, {'Content-Type': 'text/plain'});
        response.write('400 Bad Request\n');
        response.end();
        return;
      }
    } else {
      response.setHeader("Access-Control-Allow-Origin", "*");
      response.writeHead(405, {'Content-Type': 'text/plain'});
      response.write('405 Method Not Allowed\n');
      response.end();
      return;
    }

    if (requestQueue[0].slaveAddr === undefined || requestQueue[0].registerAddr === undefined) {
      response.setHeader("Access-Control-Allow-Origin", "*");
      response.writeHead(404, {'Content-Type': 'text/plain'});
      response.write('404 Not Found\n');
      response.end();
      return;
    } else {

      // prepare the binary data to be sent to MCU.
      let buffer = new Buffer(4);
      buffer[0] = requestQueue[0].slaveAddr;
      buffer[1] = requestQueue[0].functionCode;
      buffer[2] = requestQueue[0].registerAddr;
      buffer[3] = requestQueue[0].registerValue;

      console.log('slaveAddr: 0x%s functionCode: 0x%s registerAddr: 0x%s registerValue: 0x%s',
          buffer[0].toString(16), buffer[1].toString(16), buffer[2].toString(16), buffer[3].toString(16));

      // send to MCU
      serial.write(buffer, (err) => {
        if (err) {
          return console.log('Error on write: ', err.message);
        }
        console.log('packet sent.');
        // now we wait for the response...
      });
    }
  });
});

////////////////////////////////////////////////////////////////////////////////
// run server
serial.on('open', (err) => {
  if (err) {
    console.log('serial port opened has error:', err);
    return;
  }
  console.log('serial port opened.');

  // Listen http port.
  server.listen(HTTP_PORT, () => {
    console.log("%s HTTP Server listening on %s", new Date(), HTTP_PORT);
  });
});

serial.on('error', (err) => {
  console.log('SerialPort Error: ', err.message);
});

// process the response from MCU
serial.on('data', (data) => {

  // the response will be one byte unsigned integer.
  // if reading register success, the return value will be an integer
  // and is 0xFF if it failed.
  // if writeing register success, the return value will be 0x00
  // and any non-zero value if failed.
  requestQueue[0].response.setHeader("Access-Control-Allow-Origin", "*");
  requestQueue[0].response.writeHead(200, {'Content-Type': 'application/json'});
  requestQueue[0].response.write('{ "value": ' + data[0] + ' }');
  requestQueue[0].response.end();

  // unlock
  let req = requestQueue.pop();
  console.log('response to => slaveAddr: 0x%s functionCode: 0x%s registerAddr: 0x%s registerValue: 0x%s => value: %s',
    req.slaveAddr, req.functionCode, req.registerAddr, req.registerValue, data[0]);
});

