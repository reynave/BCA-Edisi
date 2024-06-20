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
app.post('/debit', (req, res) => {
    const client = new net.Socket();
    const binArray = [];
    const bin = [];
    let version = "\x02";

    let transType = '01';
    // let transAmount = "000000122500";
    let transAmount = req.body['amount'].toString().padStart(10, '0') + '00';
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
    let authCode = "000000";
    let installmentFlag = " ";
    let redeemFlag = " ";
    let DCCFlag = "N";
    let installmentPlan = "000";
    let InstallmentTenor = "00";
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
    //  binArray.push(utils.binToArry(utils.hex2bin(version)));
    binArray.push([0, 0, 0, 0, 0, 0, 1, 0]);

    //binArray.push(binToArry(hex2bin( version )) ); 
    console.log(binArray);
    // TYPE TRANS 
    binArray.push(utils.binToArry(utils.hex2bin(utils.textToHex(transType).slice(0, 2))));
    binArray.push(utils.binToArry(utils.hex2bin(utils.textToHex(transType).slice(-2))));

    utils.msgToBinArr(MessageData);
    utils.msgToBinArr(MessageData).forEach(a => {
        binArray.push(a);
    });


    binArray.push(utils.binToArry(utils.hex2bin("03")));

    //console.log("binArray : ", binArray);


    LRC = utils.binaryArrayToHex(utils.xorOperation(binArray));

    let postData = STX + "\x01" + "\x50" +
        version +
        transType +
        MessageData +
        ETX +
        LRC;
    console.log()
    addLogs(postData);

    const rest = {
        error: false,
        totalLength: totalLength,
        body: req.body,
        postData: postData,
    }
    console.log(summaryLength);
    // client.setTimeout(5000); // Timeout setiap 5 detik

    client.connect({ host: req.body['ip'], port: env_port }, function () {
        console.log('Connected to server');
        console.log('postData');
        client.write(postData);

        res.status(200).send(rest);
    });

    // Definisikan listener `data` untuk menerima respon
    client.on('data', function (data) {
        console.log("Received data from EDC:", data.toString());

        // Kirim ACK (Acknowledge) jika diperlukan
        client.write('\x06');

        // Lakukan penanganan data respon di sini
        console.log(data, data.toString());


        // Jika selesai, Anda bisa menutup koneksi
        client.destroy();

        console.log(`Connection to ${env_host}:${env_port} will be closed.`);
    });


    // Mengirim response HTTP setelah transaksi selesai
    client.on('end', function () {
        console.log('Disconnected from server');
        const rest = {
            error: false,
            note: 'Disconnected from server',
        }
        client.destroy();
        res.status(200).send(rest);
    });

    client.on('error', function (err) {
        console.error('Connection error: ', err.message);
        const rest = {
            error: true,
            note: 'Connection error: ' + err.message,
        }
        client.destroy();
        res.status(500).send(rest);
    });


    client.on('timeout', () => {
        console.error('Connection timeout');
        const rest = {
            error: true,
            note: 'Connection timeout',
        }
        client.destroy(); // Menutup socket jika timeout terjadi
        res.status(500).send(rest);
    });


});

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));


app.get('/logs', async (req, res) => {
    const client = new net.Socket();
    client.connect({ host: env_host, port: env_port }, function () {
        console.log(`BCA 01 - server on  ${env_host}:${env_port}`);
        client.write("P010000001225000000000000004556330000000191   250300000000000000  N00000                                                                              04");

    });
    // Listener untuk menangkap data dari EDC
    client.on('data', function (data) {
        console.log('Received data from EDC:', data.toString());
        client.write('\x06'); // Mengirim ACK kembali ke EDC

        // Misalnya, lakukan pengecekan untuk kondisi transaksi yang diinginkan
        if (data.toString().length > 50) {
            // Jika transaksi disetujui, kirim respons JSON
            const response = {
                success: true,
                message: 'Transaction approved',
                data : data.toString(),
            };
            client.destroy(); // Hentikan koneksi setelah selesai
            res.json(response); // Kirim respons JSON ke client
        }
    });

    // Handler untuk kesalahan koneksi
    client.on('error', function (err) {
        console.error('Connection error:', err.message);
        const response = {
            success: false,
            message: 'Connection error'
        };
        res.status(500).json(response); // Kirim respons error JSON ke client
        client.destroy(); // Hentikan koneksi setelah selesai
    });

    // Handler untuk penutupan koneksi
    client.on('close', function () {
        console.log('Connection closed');
    });

    // Tunggu selama 10 detik untuk respons dari EDC
    await sleep(20000); // 10 detik timeout

    // Jika tidak ada respons dari EDC dalam 10 detik, kirim timeout response
    if (!res.headersSent) {
        const response = {
            success: false,
            message: 'Timeout waiting for response'
        };
        res.status(500).json(response); // Kirim respons timeout JSON ke client
        client.destroy(); // Hentikan koneksi setelah selesai
    }

});


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

