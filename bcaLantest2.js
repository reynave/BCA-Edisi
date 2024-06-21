const express = require('express');
const app = express();
const fs = require('fs');
const http = require('http');
const server = http.createServer(app);
let com = false;
const net = require('net');
const port = 9400;
const env_port = 80;
const env_host = '192.168.1.105';
const { addLogs, respLogs } = require('./model/logs');
const utils = require('./model/utils');
const dummyCC = true;

let echoTestBCA = "P17000000000000000000000000                       00000000000000  N00000                                                                              ";


let STX = "\x02";
let ETX = "\x03";

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
client = new net.Socket();
//console.log("BCA Land Ver 2.0");



app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index-bcaLan.html');

});

server.listen(9402, () => {
    console.log('BCA LAN DEV, listening on *:3000');
    ecrBCA();
});

async function ecrBCA() {

    const binArray = [];
    const bin = [];
    let version = "\x02";
    let transType = '01';


    console.log(transType);

    let transAmount = "000000287000";
    let otherAmount = "000000000000";

    let PAN = "4556330000000191   ";
    let expireDate = "2503";




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
    // VER 2
    //binArray.push([0, 0, 0, 0, 0, 0, 1, 0]);
     binArray.push(utils.binToArry(utils.hex2bin("02")));
    console.log(binArray)

    //binArray.push(binToArry(hex2bin( version )) ); 

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
        "\x02" +
        transType +
        MessageData +
        ETX +
        LRC;

    addLogs(postData);

    const rest = {
        error: false,
        totalLength: totalLength,
        postData: postData,
    }
    console.log(summaryLength);

    // client.setTimeout(5000); // Timeout setiap 5 detik
    const client = new net.Socket();
    client.connect({ host: env_host, port: env_port }, function () {
        console.log(`BCA 01 - server on  ${env_host}:${env_port}`);
        client.write(postData);
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
                responseMessage: data.toString(),
                resp: utils.strToArray(data, 3),
            };
            respLogs(data.toString());
            client.destroy(); // Hentikan koneksi setelah selesai
            console.log(response)
        }
    });

    // Handler untuk kesalahan koneksi
    client.on('error', function (err) {
        console.error('Connection error:', err.message);
        const response = {
            success: false,
            message: 'Connection error'
        };
        console.log(response)
        client.destroy(); // Hentikan koneksi setelah selesai
    });

    // Handler untuk penutupan koneksi
    client.on('close', function () {
        console.log('Connection closed');
    });

    // Tunggu selama 10 detik untuk respons dari EDC
    await sleep(60000); // 10 detik timeout

    // Jika tidak ada respons dari EDC dalam 10 detik, kirim timeout response
    if (!res.headersSent) {
        const response = {
            success: false,
            message: 'Timeout waiting for response'
        };
        console.log(response)
        client.destroy(); // Hentikan koneksi setelah selesai
    }
}