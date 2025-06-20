
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
const { bcaXor } = require('./model/bcaXor');
const dummyCC = process.env.DUMMYCC;

let echoTestBCA = process.env.ECHOTESTBCA;

let STX = "\x02";
let ETX = "\x03";

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
app.use(express.json());
// Middleware untuk mengizinkan CORS
app.use(cors());

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});


app.post('/payment', async (req, res) => {
    let date = new Date();
    const body = req.body;
    if (body['RNN']) {
        body['reffNumber'] = body['RNN'];
        delete body['RNN'];
    }
    console.log(body);

    const rest = bcaXor(body);

    const client = new net.Socket();
    client.connect({ host: body['ip'], port: env_port }, function () {

        console.log(`BCA server on  ${body['ip']}:${env_port} ${date} `);
        console.log('Request : ' + rest.postDataNote);
        //  console.log('Request HEX : '+strHex+ LRC);  
        addLogs('Request :  ' + rest.postDataNote);
        // addLogs('Request HEX:  ' + rest.strHex + LRC);

        client.write(rest.postData);
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
            addLogs('Response : ' + data.toString());
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
                RespCode: 'S2',
                response: "Bad request, please try again!",
            },
            success: false,
            message: 'Connection error'
        };
        addLogs("");
        addLogs(date);
        addLogs('Response Error: Bad request, please try again!');

        respLogs('Response Error: Bad request ' + body['ip']);

        res.json(response);
        // res.status(500).json(response); // Kirim respons error JSON ke client
        client.destroy();

    });

    // Handler untuk penutupan koneksi
    client.on('close', function () {
        console.log('Connection closed');
    });

    // Tunggu selama X detik untuk respons dari EDC
    await sleep(300 * 1000); // 300 detik timeout

    // Jika tidak ada respons dari EDC dalam 10 detik, kirim timeout response
    if (!res.headersSent) {
        const response = {
            success: false,
            resp: {
                RespCode: 'S2',
                response: "Bad request, please try again!",
            },
            message: 'Timeout waiting for response'
        };
        addLogs("");
        addLogs(date);
        addLogs('Response Timeout: Bad request, please try again!');

        respLogs('Response Error: Bad request ' + body['ip']);

        res.json(response);
        // res.status(500).json(response); // Kirim respons timeout JSON ke client
        client.destroy();

    }


});
  
app.get('/echoTest', async (req, res) => {
    const client = new net.Socket();
    const ip = req.query.ip;
    let date = new Date() + " " + ip;
    addLogs("");
    addLogs(date);

    client.connect({ host: ip, port: env_port }, function () {
        console.log(`BCA 17 - server on  ${ip}:${env_port}`);
        addLogs("echoTestBCA " + echoTestBCA);
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

