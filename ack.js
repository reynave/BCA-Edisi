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
client = new net.Socket(); 
//console.log("BCA Land Ver 2.0");

 

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index-bcaLan.html');
   
});

server.listen(3000, () => {
    
    console.log('BCA LAN DEV, listening on *:3000');
    ecrBCA();
});

function ecrBCA(){ 
     client.connect({ host: env_host, port: env_port }, function () {
        console.log(`BCA 01 - server on  ${env_host}:${env_port}`);
     
 
        setTimeout(function () { 
           
            console.log("ACK CLOSE ");
            client.write('\x06');
            client.destroy();
            console.log(`client.destroy() >> ${env_host}:${env_port} `);
         
        }, 2000); 
    }); 
}
 
function msgToBinArr(msg){ 
    let array = msg.split("");
    array.forEach(n => {
       // console.log(decimalToBinary(n));
         const temp = [];
       //  console.log(n, textToHex(n), hex2bin(textToHex(n)) );
         bin.push(hex2bin(textToHex(n)));
         hex2bin(textToHex(n)).split("").forEach(x => {
            temp.push(parseInt(x));
         }); 
         binArray.push(temp);
    }); 
}

function textToHex(text) {
    let hexString = '';
    for (let i = 0; i < text.length; i++) {
      hexString += text.charCodeAt(i).toString(16).padStart(2, '0');
    }
    return hexString;
  }

function binToArry(msg){ 
     let array = [];
      msg.split("").forEach(n => { 
          array.push(parseInt(n)); 
      });   
     return array;

}

function hex2bin(hex){ 
    let binaryString = '';
    for (let i = 0; i < hex.length; i += 2) {
      const hexPair = hex.substr(i, 2);
      const decimal = parseInt(hexPair, 16);
      const binary = decimal.toString(2).padStart(8, '0');
      binaryString += binary;
    }
    return binaryString;
}
function pad(num, size) {
    var s = "000000000" + num;
    return s.substr(s.length-size);
}

function decimalToBinary(num) {
    if (num === 0) {
        return '00000000';
      }
    
      let binary = '';
      while (num > 0) {
        binary = (num % 2) + binary;
        num = Math.floor(num / 2);
      }
    
      // Pastikan hasilnya memiliki panjang tepat 8 digit
      return binary.padStart(8, '0');
}
/*
client.connect({ host: env_host, port: env_port }, function () {
    console.log(`Client  : ERC Connected to server on  ${env_host}:${env_port}`);
    client.write(echoTestBCA);
   
    setTimeout(function () { 
        client.on('data', function (data) {
            console.log("Read ", Math.random(), data);
            client.write('\x06');
            client.destroy();
            console.log(`client.destroy() >> ${env_host}:${env_port} `);
        });
    }, 2000); 
}); 
*/
  
function xorOperation(arrays) {
    // Pastikan array memiliki elemen
    if (arrays.length === 0) return null;
    
    // Inisialisasi hasil dengan array pertama
    let result = arrays[0].slice(); // Copy array pertama
    
    // Loop melalui array lainnya dan lakukan operasi XOR
    for (let i = 1; i < arrays.length; i++) {
      const currentArray = arrays[i];
      // Pastikan panjang array sama
      if (currentArray.length !== result.length) return null;
      
      // Lakukan operasi XOR pada setiap elemen
      for (let j = 0; j < result.length; j++) {
        result[j] = result[j] !== currentArray[j] ? 1 : 0; // XOR
      }
    }
    
    return result;
}

function binaryArrayToHex(binaryArray) {
    // Inisialisasi string heksadesimal
    let hexString = '';
  
    // Loop melalui array biner
    for (let i = 0; i < binaryArray.length; i += 4) {
      // Ambil empat digit biner
      const binaryDigits = binaryArray.slice(i, i + 4).join('');
      // Konversi ke heksadesimal dan tambahkan ke string heksadesimal
      const hexDigit = parseInt(binaryDigits, 2).toString(16).toUpperCase();
      hexString += hexDigit;
    }
  
    return hexString;
  }
  
function comClose() {
    console.log('comClose Request');

    if (com == true) {
        client.destroy();
        console.log("COM END");
        com = false;

    } else {
        console.log("Com Closed");
    }

}

function comTest(sendToEcr) {
    com = true;
    if (com == true) {
        let date = new Date();
        console.log("send : \n\n");

        client.connect({ host: env_host, port: env_port }, function () {
            console.log(`Client  : ERC Connected to server on  ${env_host}:${env_port}`);
            client.write(dataTxtString);
            // client.on('data', function (data) {
            //     client.write('\x06');
            //     date = new Date();
            //     console.log('on Data : ', date);
            
        }); 
        const sendBack = {
            msg: 'Testing Success',
        }
        sendToEcr['socket'].emit("emiter", sendBack);
    } else {
        console.log("Com not connect");
        const sendBack = {
            msg: 'Com not connect',
        }
        sendToEcr['socket'].emit("emiter", sendBack);
    }
}
