const express = require('express');
const bodyParser = require('body-parser'); 
const net = require('net');
const app = express();
const port = 9400;
const env_port = 80;
const { addLogs, respLogs } = require('./model/logs');
const utils = require('./model/utils');
const dummyCC = true;
 
let echoTestBCA = "P17000000000000000000000000                       00000000000000  N00000                                                                              ";


let STX = "\x02";
let ETX = "\x03";

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

app.use(bodyParser.json());
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

 
app.post('/payment', async (req, res) => {

    const binArray = [];
    const bin = [];
    let version = "\x02"; 
    let transType = '01'; 

    if(req.body['transType'] != undefined){
        transType = req.body['transType']; 
    }
    console.log(transType);

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
   
    addLogs(postData);

    const rest = {
        error: false,
        totalLength: totalLength,
        body: req.body,
        postData: postData,
    }
    console.log(summaryLength);

    // client.setTimeout(5000); // Timeout setiap 5 detik
    const client = new net.Socket();
    client.connect({ host: req.body['ip'], port: env_port }, function () { 
        console.log(`BCA 01 - server on  ${req.body['ip']}:${env_port}`); 
        client.write(postData); 
    });
    // Listener untuk menangkap data dari EDC
    client.on('data', function (data) {
        console.log('Received data from EDC:', data.toString());
        client.write('\x06'); // Mengirim ACK kembali ke EDC

        // Misalnya, lakukan pengecekan untuk kondisi transaksi yang diinginkan
        if (data.toString().length > 50) {
            // Jika transaksi disetujui, kirim respons JSON

            let data1 = data.toString(); 
            let n= 3; 
            const resp = {   
                'length' : data1.length, 
                'TransType':data1.slice(n+1,n+3),
                'TransAmount':data1.slice(n+3,n+3+12),
                'PAN':data1.slice(n+25,n+25+18),
                'RespCode':data1.slice(n+50,n+50+2), 
                'RRN':data1.slice(n+52,n+52+12),
                'ApprovalCode':data1.slice(n+64,n+64+6), 
                'DateTime':data1.slice(n+70,n+70+14),
                'MerchantId':data1.slice(n+84,n+84+15), 
                'TerminalId':data1.slice(n+99,n+99+8), 
                'OfflineFlag':data1.slice(n+107,n+107+1),  
            }
 

            const response = {
                success: true,
                message: 'Transaction approved',
                responseMessage: data.toString(),
                resp : resp
            };
            respLogs(data.toString());
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
    await sleep(60000); // 10 detik timeout

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


app.get('/echoTest', async (req, res) => {
    const client = new net.Socket();
    client.connect({ host: req.body['ip'], port: env_port }, function () {
        console.log(`BCA 17 - server on  ${req.body['ip']}:${env_port}`);
        client.write(echoTestBCA);
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
                message: 'Echo Test success',
                data: data.toString(),
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
    await sleep(60000); // 10 detik timeout

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

