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
const https = require("https");
const url = require('url');
const SerialPort = require("serialport").SerialPort;
const fs = require('fs');
const os = require('os');

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
        requestQueue.pop();
        return;
      }
    } else if (request.method === 'OPTIONS') {
      // handle preflight
      console.log('preflight header', request.headers);
      response.setHeader("Access-Control-Allow-Origin", "*");
      response.setHeader("Access-Control-Allow-Methods", "GET, PUT");
      response.setHeader("Access-Control-Allow-Headers", "Content-Type");
      response.writeHead(200);
      response.end();
      requestQueue.pop();
      return;
    } else {
      response.setHeader("Access-Control-Allow-Origin", "*");
      response.writeHead(405, {'Content-Type': 'text/plain'});
      response.write('405 Method Not Allowed\n');
      response.end();
      requestQueue.pop();
      return;
    }

    if (requestQueue[0].slaveAddr === undefined || requestQueue[0].registerAddr === undefined) {
      response.setHeader("Access-Control-Allow-Origin", "*");
      response.writeHead(404, {'Content-Type': 'text/plain'});
      response.write('404 Not Found\n');
      response.end();
      requestQueue.pop();
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

////////////////////////////////////////////////////////////////////////////////
let post_mcs_cloud = (channelId, channelValue) => {
  let data = {
    "datapoints": [
      {"dataChnId": channelId, "values": {"value": channelValue}}
    ]
  };

  let options = {
    host: "api.mediatek.com",
    port: 443,
    path: "/mcs/v2/devices/DgnnBIRM/datapoints",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "deviceKey": "pL00OZpxxGZkH0Tw"
    }
  };

  let req = https.request(options, (res) => {
    // console.log('STATUS: ' + res.statusCode);
    // console.log('HEADERS: ' + JSON.stringify(res.headers));
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
      console.log('BODY: ' + chunk);
    });
  });

  req.on('error', (e) => {
    console.log('problem with request: ' + e.message);
  });

  req.write(JSON.stringify(data));
  req.end();
}

////////////////////////////////////////////////////////////////////////////////
// report ip address
let interfaces = os.networkInterfaces();
let ip_addr = "";
for (let k in interfaces) {
  for (let k2 in interfaces[k]) {
    let address = interfaces[k][k2];
    if (address.family === 'IPv4' && !address.internal && address.address !== "192.168.100.1") {
      ip_addr = address.address;
      break;
    }
  }
}
console.log('********************************');
console.log('ip address: ' + ip_addr);
console.log('********************************');
post_mcs_cloud("ac_ip", ip_addr);
