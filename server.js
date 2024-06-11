const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const net = require('net');
const app = express();
const port = 3000;
const env_port = 80;
const env_host = '192.168.1.105';
const { addLogs } = require('./model/logs');
const utils = require('./model/utils');
const dummyCC = true;


let echoTestBCA = "P17000000000000000000000000                       00000000000000  N00000                                                                              ";


let STX = "\x02";
let ETX = "\x03";


app.use(bodyParser.json());
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Create - Menambahkan pengguna baru
app.post('/lan', (req, res) => {
    const client = new net.Socket();
    const binArray = [];
    const bin = [];
    let version = "\x02";
    let transType = '01';
    let transAmount = "000000192500";
    let otherAmount = "000000000000";
    /**
    * BCA REAL CC;
    */
    let PAN = "                   ";
    let expireDate = "    ";

    if (dummyCC == true) {
        /**
           * BCA Dummy CC;
           */
        PAN = "4556330000000191   ";
        expireDate = "2503";
    }




    let cancelReason = "00";
    let invoiceNumber = "000000";
    let authCode = "      ";
    let installmentFlag = " ";
    let redeemFlag = " ";
    let DCCFlag = "N";
    let installmentPlan = "   ";
    let InstallmentTenor = "  ";
    let genericData = "            ";
    let reffNumber = "            ";
    let originalDate = "    ";
    let BCAFiller = "                                                  ";

    let LRC = null;


    let MessageData =
        transAmount + otherAmount + PAN + expireDate + cancelReason + invoiceNumber + authCode + installmentFlag +
        redeemFlag + DCCFlag + installmentPlan + InstallmentTenor + genericData + reffNumber + originalDate + BCAFiller;

    const summaryLength = {
        version: [version, version.length],
        transType: [transType, transType.length],
        transAmount: [transAmount, transAmount.length],
        otherAmount: [otherAmount, otherAmount.length],
        PAN: [PAN, PAN.length],
        expireDate: [expireDate, expireDate.length],
        cancelReason: [cancelReason, cancelReason.length],
        invoiceNumber: [invoiceNumber, invoiceNumber.length],
        authCode: [authCode, authCode.length],
        installmentFlag: [installmentFlag, installmentFlag.length],
        redeemFlag: [redeemFlag, redeemFlag.length],
        DCCFlag: [DCCFlag, DCCFlag.length],
        installmentPlan: [installmentPlan, installmentPlan.length],
        InstallmentTenor: [InstallmentTenor, InstallmentTenor.length],
        genericData: [genericData, genericData.length],
        reffNumber: [reffNumber, reffNumber.length],
        originalDate: [originalDate, originalDate.length],
        BCAFiller: [BCAFiller, BCAFiller.length],
    }

    let totalLength = 0;
    for (const [key, value] of Object.entries(summaryLength)) {
        totalLength += value[1]; // Tambahkan panjang array (nilai kedua dalam array)
    }


    binArray.push(utils.binToArry(utils.hex2bin(utils.pad(totalLength, 4).slice(0, 2))));
    binArray.push(utils.binToArry(utils.hex2bin(utils.pad(totalLength, 4).slice(-2))));
    binArray.push(utils.binToArry(utils.hex2bin(version)));

    // TYPE TRANS 
    binArray.push(utils.binToArry(utils.hex2bin(utils.textToHex(transType).slice(0, 2))));
    binArray.push(utils.binToArry(utils.hex2bin(utils.textToHex(transType).slice(-2))));

    utils.msgToBinArr(MessageData);
    utils.msgToBinArr(MessageData).forEach(a => {
        binArray.push(a);
    });


    binArray.push(utils.binToArry(utils.hex2bin("03")));

    console.log("binArray.length", binArray.length);


    LRC = utils.binaryArrayToHex(utils.xorOperation(binArray));

    let postData = STX + "\x01" + "\x50" +
        version +
        transType +
        MessageData +
        ETX +
        LRC;

    addLogs(postData);

    const rest = {
        totalLength: totalLength,
        body: req.body,
        postData: postData,
    }

    client.setTimeout(5000); // Timeout setiap 5 detik
    
    client.connect({ host: env_host, port: env_port }, function () {
        console.log('Connected to server');
        //  client.write(postData);
        // setTimeout(function () { 
        //     client.on('data', function (data) {
        //         console.log("Read ", Math.random(), data);
        //         client.write('\x06');
        //         client.destroy();
        //         console.log(`client.destroy() >> ${env_host}:${env_port} `);
        //     });
        // }, 2000); 
        res.status(200).send('Connected to server');
    });
    client.on('timeout', () => {
        console.error('Connection timeout');
        client.destroy(); // Menutup socket jika timeout terjadi
        res.status(500).send('Connection timeout');
      });
    // Menangani event 'error'
    client.on('error', (err) => {
        console.error('Connection error:', err.message);
        // Menutup socket jika terjadi kesalahan
        client.destroy();
        res.status(500).send('Failed to connect to server');
    });

    // Menangani event 'close'
    client.on('close', (hadError) => {
        if (hadError) {
            console.error('Connection closed due to an error');
        } else {
            console.log('Connection closed');
        }
        res.status(201).send(rest);
    });
   
});


app.get('/lan', (req, res) => {
    console.log(req.query);
    if (req.query) {
        res.send(req.query);
    } else {
        res.status(404).send({ message: 'User not found' });
    }
});


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

