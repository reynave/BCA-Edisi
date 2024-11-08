
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const { SerialPort, ReadlineParser } = require('serialport');

const app = express();
const PORT = process.env.PORT2; 
const { addLogs, respLogs } = require('./model/logs');
const utils = require('./model/utils');
const dummyCC = process.env.DUMMYCC;

let echoTestBCA = process.env.ECHOTESTBCA;

let STX = "\x02";
let ETX = "\x03";

// const serialPort = new SerialPort({
//     path: 'com3',
//     baudRate: 9600,
//     autoOpen: false,
// }, (err) => console.log(err));



const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

app.use(bodyParser.json());
// Middleware untuk mengizinkan CORS
app.use(cors());
app.get('/', (req, res) => { 
    const response = {
        req: req.query,
        message: 'Echo response',
        timestamp: new Date().toISOString()
    };
    res.status(200).json(response); 
});

app.get('/checkCom', async (req, res) => {
    try {
        const ports = await SerialPort.list(); // Tunggu hingga port tersedia
        console.log('Available Ports:');
        ports.forEach(port => {
            console.log(`${port.path} - ${port.manufacturer || 'Unknown Manufacturer'}`);
        });

        const response = {
            success: true,
            message: 'Com Ok 1',
            ports: ports // Tambahkan daftar port ke respons
        };
        //   addLogs(JSON.stringify(response));
        res.status(200).json(response); // Kirim respons OK dengan data port

    } catch (err) {
        console.error('Error listing ports:', err);
        const errorResponse = {
            success: false,
            message: 'Failed to list COM ports',
            error: err.message
        };
        addLogs(JSON.stringify(errorResponse));
        res.status(500).json(errorResponse); // Kirim respons error
    }
});

app.get('/echoTest', async (req, res) => {
    let responseSent = false; // Flag untuk mencegah pengiriman respons ganda

    const comPort = req.query.port; // Ambil port dari query parameter

    if (!comPort) {
        return res.status(400).json({
            success: false,
            message: 'COM port is required. Please provide ?port=COM6 or equivalent.',
        });
    }


    let port;
    port = new SerialPort({
        path: comPort, // Path dinamis dari query params
        baudRate: 9600,
        autoOpen: false,
    });

    // Membaca data respons dari perangkat
    let receivedData = '';
    let resp = '';
    // Baca data secara manual tanpa ReadlineParser
    port.on('data', (chunk) => {
        receivedData += chunk.toString();  // Konversi buffer ke string
        console.log('Received chunk:', chunk.toString());
        resp = chunk.toString();

        const sendBack = {
            resp: resp,
            strToArray: utils.strToArray(resp, 3),
        };
        console.log(sendBack);

        // Jika seluruh pesan diterima (gunakan kondisi sesuai kebutuhan)
        if (sendBack.strToArray.OfflineFlag == 'Y') {
            console.log('Full message received:', receivedData.trim());
            receivedData = '';  // Reset buffer

            port.write('\x06', function (err) {
                if (err) throw err;
                console.log("done, send ACK");
            });

            responseSent = true;
            res.status(200).json({  
                success: true,
                message: 'Echo Test success',
                resp: utils.strToArray(resp, 3),
            });

            port.close((err) => {
                if (err) console.error('Failed to close port:', err.message);
                else console.log('Port closed.');
            });
        }
    });


    // Pastikan port terbuka sebelum mengirim dan menerima data
    port.open((err) => {
        if (err) {
            console.error('Failed to open port:', err.message);
            return res.status(500).json({ success: false, message: 'Failed to open port', error: err.message });
        }
        console.log('Port opened.');
        port.write(echoTestBCA, (err) => {
            if (err) {
                console.error('Failed to send data:', err.message);
                port.close(); // Pastikan port ditutup saat gagal
                responseSent = true;
                return res.status(500).json({
                    success: false,
                    message: 'Failed to send data',
                    error: err.message
                });
            }
            console.log(`Data sent: ${echoTestBCA}`);
        });
    });



    setTimeout(() => {
        console.log(responseSent);
        if (!responseSent) {
            responseSent = true; // Tanda
            res.status(500).json({
                success: false,
                message: 'Timeout: No response from device',
            });

            // Tutup port jika timeout terjadi
            port.close((err) => {
                if (err) console.error('Failed to close port:', err.message);
                else console.log('Port closed after timeout.');
            });
        }
    }, 10 * 1000);



});

app.get('/echoTest2', async (req, res) => {
    let responseSent = false; // Flag untuk mencegah pengiriman respons ganda

    const comPort = req.query.port; // Ambil port dari query parameter

   // const ver = req.query.ver;
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

    if (!comPort) {
        return res.status(400).json({
            success: false,
            message: 'COM port is required. Please provide ?port=COM6 or equivalent.',
        });
    }


    let port;
    port = new SerialPort({
        path: comPort, // Path dinamis dari query params
        baudRate: 9600,
        autoOpen: false,
    });

    // Membaca data respons dari perangkat
    let receivedData = '';
    let resp = '';
    // Baca data secara manual tanpa ReadlineParser
    port.on('data', (chunk) => {
        receivedData += chunk.toString();  // Konversi buffer ke string
        console.log('Received chunk:', chunk.toString());
        resp = chunk.toString();

        const sendBack = {
            resp: resp,
            strToArray: utils.strToArray(resp, 3),
        };
        console.log(sendBack);

        // Jika seluruh pesan diterima (gunakan kondisi sesuai kebutuhan)
        if (sendBack.strToArray.OfflineFlag == 'Y') {
            console.log('Full message received:', receivedData.trim());
            receivedData = '';  // Reset buffer

            port.write('\x06', function (err) {
                if (err) throw err;
                console.log("done, send ACK");
            });

            responseSent = true;
            res.status(200).json({  
                success: true,
                message: 'Echo Test success',
                resp: utils.strToArray(resp, 3),
                req : req.query,
            });

            port.close((err) => {
                if (err) console.error('Failed to close port:', err.message);
                else console.log('Port closed.');
            });
        }
    });


    // Pastikan port terbuka sebelum mengirim dan menerima data
    port.open((err) => {
        if (err) {
            console.error('Failed to open port:', err.message);
            return res.status(500).json({ success: false, message: 'Failed to open port', error: err.message });
        }
        console.log('Port opened.');
        port.write(echoTestBCA, (err) => {
            if (err) {
                console.error('Failed to send data:', err.message);
                port.close(); // Pastikan port ditutup saat gagal
                responseSent = true;
                return res.status(500).json({
                    success: false,
                    message: 'Failed to send data',
                    error: err.message
                });
            }
            console.log(`Data sent: ${echoTestBCA}`);
        });
    });



    setTimeout(() => {
        console.log(responseSent);
        if (!responseSent) {
            responseSent = true; // Tanda
            res.status(500).json({
                success: false,
                message: 'Timeout: No response from device',
            });

            // Tutup port jika timeout terjadi
            port.close((err) => {
                if (err) console.error('Failed to close port:', err.message);
                else console.log('Port closed after timeout.');
            });
        }
    }, 10 * 1000);



});

app.get('/readData', async (req, res) => {

    let port;
    port = new SerialPort({
        path: 'COM8', // Path dinamis dari query params
        baudRate: 9600,
        autoOpen: false,
    });
    let i = 0;
    port.open(function (res) {
        if (res) {
            console.log(res.name, res.message);
        } else {
            console.log('com3 Open');
        }
        let read = "";
        refreshIntervalId = setInterval(function () {
            i++;
            let resp = port.read()?.toString('hex') || '';
            console.log(i, resp);
            if (resp) {
                port.write('\x06', function (err) {
                    if (err) throw err;
                });

                const sendBack = {
                    i: i,
                    hex: resp,
                    ascii: respString,
                    respCode: respString.slice(53, 55),
                }
                console.log(i, sendBack, "Port write done");
                sendToEcr['socket'].emit("emiter", sendBack);


                if (sendBack.RespCode == '00') {
                    clearInterval(refreshIntervalId);
                    port.close();
                    console.log("Com Close!");
                }

                if (sendBack.RespCode == 'P3') {
                    clearInterval(refreshIntervalId);
                    port.close();
                    console.log("User press Cancel on EDC, Com Close!");
                }
            }
            if (i > 500) {
                clearInterval(refreshIntervalId);
                port.close();
            }

        }, 250);

    });


});

app.post('/payment', async (req, res) => {

    const comPort = req.body['port']; // Ambil port dari query parameter

    if (!comPort) {
        return res.status(400).json({
            success: false,
            message: 'COM port is required. Please provide ?port=COM6 or equivalent.',
        });
    }

    let transType = req.body['transType'];
    let transAmount = req.body['amount'].toString().padStart(10, '0') + '00';
    if (req.body['transType'] == '32') {
        transAmount = "            ";
    }
    let postData = utils.ecrData(transType, transAmount, req.body['RNN']);
    console.log('postData : ',postData, transType, transAmount, req.body['RNN']);
 

    let port;
    port = new SerialPort({
        path: comPort, // Path dinamis dari query params
        baudRate: 9600,
        autoOpen: false,
    });

    // Membaca data respons dari perangkat
    let receivedData = '';
    let resp = '';
    // Baca data secara manual tanpa ReadlineParser
    port.on('data', (data) => {
        receivedData += data.toString();  // Konversi buffer ke string
        console.log('Received data :', data.toString());
        responseMessage = data.toString();

        const sendBack = {
            responseMessage: responseMessage,
            resp: utils.strToArray(responseMessage, 3),
        };
        console.log(sendBack);
        
        
        if (sendBack.resp.RespCode != '') {
            console.log('Full message received:', receivedData.trim());
            receivedData = '';  // Reset buffer

            port.write('\x06', function (err) {
                if (err) throw err;
                console.log("done, send ACK");
            });

            responseSent = true;
            clearTimeout(myTimeout);
            res.status(200).json({   
                success: true,
                message: 'Transaction approved',
                responseMessage: data.toString(),
                resp: utils.strToArray(data, 3),

            });

            port.close((err) => {
                if (err) console.error('Failed to close port:', err.message);
                else console.log('Port closed.');
            });
        }
    });


    // Pastikan port terbuka sebelum mengirim dan menerima data
    port.open((err) => {
        if (err) {
            console.error('Failed to open port:', err.message);
            return res.status(500).json({ success: false, message: 'Failed to open port', error: err.message });
        }
        console.log('Port opened.');
        port.write(postData, (err) => {
            if (err) {
                console.error('Failed to send data:', err.message);
                port.close(); // Pastikan port ditutup saat gagal
                responseSent = true;
                return res.status(500).json({
                    success: false,
                    message: 'Failed to send data',
                    error: err.message
                });
            }
            console.log(`Data sent: ${postData}`);
        });
    });



    const myTimeout = setTimeout(() => {
        console.log(responseSent);
        if (!responseSent) {
            responseSent = true; // Tanda
            res.status(500).json({
                success: false,
                message: 'Timeout: No response from device',
            });

            // Tutup port jika timeout terjadi
            port.close((err) => {
                if (err) console.error('Failed to close port:', err.message);
                else console.log('Port closed after timeout.');
            });
        }
    }, 60 * 1000);




});
 

app.get('/testPrint', async (req, res) => {
 
    const response = {
        success: true,
        message: 'testPrint Ok', 
    };
    //   addLogs(JSON.stringify(response));
    res.status(200).json(response); // Kirim respons OK dengan data port 
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
 
 

function ecrData_SAVE(transType, transAmount, RNN) {
    const binArray = [];
    const bin = [];
    let version = "\x02";

    if (transType == '32') {
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
    let reffNumber = RNN ? RNN : "            ";
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

    return postData;
}
