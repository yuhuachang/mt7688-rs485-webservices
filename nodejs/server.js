//
// RS485 Modbus RTU Control for Taiwan Hitachi Air Conditioner
// RESTful web services server.
// 
// To enable ECMAScript 2015 features, use the following command to run:
//   node --harmony app.js
//
// Author: Yu-Hua Chang
//
"use strict";
process.title = 'node-app';

// Settings
const HTTP_PORT = 8080;

// Import libraries
const http = require('http');
const url = require('url');
const path = require('path');
const SerialPort = require("serialport").SerialPort;
const fs = require('fs');

////////////////////////////////////////////////////////////////////////////////
// open serial port to MCU
const serial = new SerialPort("/dev/ttyS0", {
  baudrate: 57600
});

serial.on('error', (err) => {
  console.log('SerialPort Error: ', err.message);
})

////////////////////////////////////////////////////////////////////////////////
// http server to server the static pages
const server = http.createServer((request, response) => {

  // retrieve request header, method, url, and body.
  let headers = request.headers;
  let method = request.method;
  let url = request.url;
  let body = [];
  request.on('error', function(err) {
    console.error(err);
  }).on('data', function(chunk) {
    body.push(chunk);
  }).on('end', function() {
    body = Buffer.concat(body).toString();

    // prepare the information we need.
    let slave_addr = undefined;
    let function_code = undefined;
    let register_addr = undefined;
    let register_value = undefined;

    // retrieve slave address and target register address from url
    let req = request.url.split('/');
    if (req.length == 3) {
      slave_addr = parseInt(req[1], 16);
      register_addr = parseInt(req[2], 16);
    }

    // determine function by request method.
    if (request.method === 'GET') {

      // read holding register
      function_code = 0x03;

    } else if (request.method === 'PUT') {

      // write single register
      function_code = 0x06;

      // if method is PUT, read register value from request body.
      let json = JSON.parse(body);
      register_value = json.value;
    }

    if (slave_addr !== undefined && function_code !== undefined && register_addr !== undefined) {
      // service RESTful web services.

      // prepare the binary data to be sent to MCU.
      let buffer = new Buffer(4);
      buffer[0] = slave_addr;
      buffer[1] = function_code;
      buffer[2] = register_addr;
      buffer[3] = register_value === undefined ? 0x00 : register_value;

      console.log('slave_addr: 0x%s function_code: 0x%s register_addr: 0x%s register_value: 0x%s',
          buffer[0].toString(16), buffer[1].toString(16), buffer[2].toString(16), buffer[3].toString(16));

      // remember if MCU has responsed already.
      let hasResponsed = false;

      // send to MCU
      serial.write(buffer, (err) => {
        if (err) {
          return console.log('Error on write: ', err.message);
        }
        console.log('packet sent.');
      });

      // process the response from MCU
      serial.on('data', (data) => {

        // collect response value as ascii string.
        // if reading register success, the return value will be an integer (as ascii string)
        // and is empty string if it failed.
        // if writeing register success, the return value will be zero (as ascii string)
        // and any non-zero value if failed.
        let value = '';
        for (let i = 0; i < data.length; i++) {
          if (data[i] >= '0'.charCodeAt(0) && data[i] <= '9'.charCodeAt(0)) {
            value += String.fromCharCode(data[i]);
          }
        }

        // return the first response only since MCU may return more than once.
        if (!hasResponsed) {
          console.log('data received:', value);
          response.writeHead(200, {'Content-Type': 'application/json'});
          response.write('{ "value": ' + value + ' }');
          response.end();
          hasResponsed = true;
        }
      });
    } else {

      // Get path name on the server's file system.
      let filename = path.join(process.cwd(), '/index.html');

      fs.exists(filename, (exists) => {
        if (exists) {
          // server static web content for quick test
          response.writeHead(200, 'text/html');
          let fileStream = fs.createReadStream(filename);
          fileStream.pipe(response);
        } else {
          // no resource found and no static web content
          response.writeHead(404, {'Content-Type': 'text/plain'});
          response.write('404 Not Found\n');
          response.end();
        }
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
  server.listen(HTTP_PORT, function(){
    console.log("%s HTTP Server listening on %s", new Date(), HTTP_PORT);
  });
});
