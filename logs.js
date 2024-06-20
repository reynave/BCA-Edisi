const express = require('express');
const app = express();
const fs = require('fs');
const http = require('http');
const server = http.createServer(app); 
let com = false;
const net = require('net');
const env_port = 80;
const env_host = '192.168.1.106'; 
// SETING IP , Function 2, pass 3226

let echoTestBCA = "P17000000000000000000000000                       00000000000000  N00000                                                                              ";
// DOC https://github.com/nodejs/node/issues/2237
const bin  = []; 
let STX = "\x02"; 
let ETX = "\x03";
 
const binArray = [];
let bcaDummyCC  = "4556330000000191   250300000000000000  ";
let bcaCard     = "                       00000000000000  ";
/**
 * DOC BCA Setting LAN https://www.bca.co.id/id/informasi/Edukatips/2021/04/16/08/02/si-biru-mesin-edc-bca-begini-tips-dan-cara-penggunaannya
 * 
 */

//console.log("BCA Land Ver 2.0");

 

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index-bcaLan.html');
   
});

server.listen(3000, () => {
    
    console.log('BCA LAN DEV, listening on *:3000');
    ecrBCA();
});

function ecrBCA(){ 
    client = new net.Socket(); 
    client.connect({ host: env_host, port: env_port }, function () {
        client.write('data');
    }); 

    client.on('data', function(data) {
        console.log('Received: ' + data);
        if (data.includes('reversal please wait')) {
            console.log('Reversal message received. Handling reversal...');
             
        }
        client.destroy();
    });
    
    client.on('close', function() {
        console.log('Connection closed');
    });
}
