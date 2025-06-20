
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const net = require('net');
const app = express();
const port = process.env.PORT;
const env_port = process.env.ENV_PORT;
const { addLogs, respLogs } = require('./model/logs');
const utils = require('./model/utils');
const dummyCC = process.env.DUMMYCC;

let echoTestBCA =  process.env.ECHOTESTBCA;

let STX = "\x02";
let ETX = "\x03";
 
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

app.use(bodyParser.json());
// Middleware untuk mengizinkan CORS
app.use(cors());

app.get('/', (req, res) => { 
    res.sendFile(__dirname + '/index.html');
});


app.post('/payment', async (req, res) => {

    const binArray = [];
    const bin = [];
    let version = "\x02";
    let transType = '01';

    if (req.body['transType'] != undefined) {
        transType = req.body['transType'];
    }
    console.log(transType);
    if( !req.body['amount'] ){
        req.body['amount'] = 0;
    }
    // let transAmount = "000000122500";
    let transAmount = req.body['amount'].toString().padStart(10, '0') + '00'; 
    if(req.body['transType'] =='32'){
        transAmount = "            ";
    } 
    let otherAmount = "000000000000";
    /**
    * BCA REAL CC;
    */
    let PAN = "                   ";
    let expireDate = "    ";

    if (dummyCC == 1) {
        /**
         * BCA Dummy CC;
         */
        PAN = "4556330000000191   ";
        expireDate = "2803";
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
    let reffNumber = req.body['RNN'] ? req.body['RNN'] : "            ";
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
   // console.log("----------------");
    let n = 4;
    let strHex = "02";
    binArray.forEach(el => {

        let bintemp = +el[0].toString() + el[1].toString() + el[2].toString() + el[3].toString() + el[4].toString() + el[5].toString() + el[6].toString() + el[7].toString();

        let decimalValue = parseInt(bintemp, 2);
        let hexValue = decimalValue.toString(16).toUpperCase();

     //   console.log(n + " " + bintemp + " " + hexValue.toString().padStart(2, '0'));
        strHex += hexValue.toString().padStart(2, '0');
        n++;
    });
   // console.log("----------------");
   // console.log(strHex);
    LRC = utils.binaryArrayToHex(utils.xorOperation(binArray));
    
    let postData = STX + "\x01" + "\x50" +
        version +
        transType +
        MessageData +
        ETX +
        Buffer.from(LRC, 'hex');

    let postDataNote = STX + "\x01" + "\x50" +
        version +
        transType +
        MessageData +
        ETX +
        LRC;
    let date = new Date() +" "+ req.body['ip'];
    addLogs("");
    addLogs(date);

    const rest = {
        error: false,
        totalLength: totalLength,
        body: req.body,
        postData: postData,
    }
    //console.log(summaryLength);

    // client.setTimeout(5000); // Timeout setiap 5 detik
    const client = new net.Socket();
    client.connect({ host: req.body['ip'], port: env_port }, function () {
       
        console.log(`BCA server on  ${req.body['ip']}:${env_port} ${date} `  );
        console.log('Request : '+postDataNote);
        console.log('Request HEX : '+strHex+ LRC);  
        addLogs('Request :  '+postDataNote);
        addLogs('Request HEX:  '+ strHex+ LRC);
        
        client.write(postData);
    });
    // Listener untuk menangkap data dari EDC
    client.on('data', function (data) {
        console.log('Response Message EDC:', data.toString());
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
            addLogs('Response : '+data.toString());
            respLogs(data.toString());
            
            client.destroy(); // Hentikan koneksi setelah selesai
            res.json(response); // Kirim respons JSON ke client
        }
    });

    // Handler untuk kesalahan koneksi
    client.on('error', function (err) {
        console.error('Connection error:', err.message);
        const response = {
            resp: {
                RespCode : 'S2',
                response : "Bad request, please try again!",
            },
            success: false,
            message: 'Connection error'
        };
        addLogs("");
        addLogs(date);
        addLogs('Response Error: Bad request, please try again!');

        respLogs('Response Error: Bad request '+req.body['ip']);

        res.json(response); 
       // res.status(500).json(response); // Kirim respons error JSON ke client
        client.destroy();  
       
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
            resp: {
                RespCode : 'S2',
                response : "Bad request, please try again!",
            },
            message: 'Timeout waiting for response'
        };
        addLogs("");
        addLogs(date);
        addLogs('Response Timeout: Bad request, please try again!');
     
        respLogs('Response Error: Bad request '+req.body['ip']);

         res.json(response);  
       // res.status(500).json(response); // Kirim respons timeout JSON ke client
        client.destroy();  
       
    }


});


app.get('/echoTest', async (req, res) => {
    const client = new net.Socket();
    const ip = req.query.ip;
    let date = new Date() +" "+ ip;
    addLogs("");
    addLogs(date);

    client.connect({ host: ip, port: env_port }, function () {
        console.log(`BCA 17 - server on  ${ip}:${env_port}`);
        addLogs("echoTestBCA "+echoTestBCA);  
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
                resp: utils.strToArray(data, 3),
            };
            addLogs(JSON.stringify(response));
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
        addLogs(JSON.stringify(response));
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
        addLogs(JSON.stringify(response));
        res.status(500).json(response); // Kirim respons timeout JSON ke client
        client.destroy(); // Hentikan koneksi setelah selesai
    }

});

app.get('/echoTest2', async (req, res) => {
    const client = new net.Socket();
    const ip = req.query.ip; 
    let echoTest = echoTestBCA;
    if(req.query.ver == '1'){
        echoTest =  process.env.ECHOTESTBCA_V1;
    }
    else if(req.query.ver == '2'){
        echoTest =  process.env.ECHOTESTBCA_V2;
    }
    else if(req.query.ver == '3'){
        echoTest =  process.env.ECHOTESTBCA_V3;
    } 
    else{
        echoTest =  process.env.ECHOTESTBCA;
    }

    let date = new Date() +" "+ ip;
    addLogs("");
    addLogs(date);

    client.connect({ host: ip, port: env_port }, function () {
        console.log(`BCA 17 - server on  ${ip}:${env_port}`);
        addLogs("echoTestBCA "+echoTest);  
        client.write(echoTest);
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
                resp: utils.strToArray(data, 3),
                req : req.query,
            };
            addLogs(JSON.stringify(response));
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
        addLogs(JSON.stringify(response));
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
        addLogs(JSON.stringify(response));
        res.status(500).json(response); // Kirim respons timeout JSON ke client
        client.destroy(); // Hentikan koneksi setelah selesai
    }

});

app.get('/checkServer', async (req, res) => {
    setTimeout(() => {
        const response = {
            message: 'Echo response',
            timestamp: new Date().toISOString()
        };
        res.json(response);
    }, 5000);
});
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
