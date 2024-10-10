const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const { SerialPort } = require('serialport'); 


var refreshIntervalId = false;
let user = 0;

const port = new SerialPort({
    path: 'com3',
    baudRate: 9600,
    autoOpen: false,
}, (err) => console.log(err));


app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    user++;
    console.log('a user connected ' + user);
    let date = new Date();
    socket.on("data", (arg) => {
        console.log(arg);

        if (arg['action'] == 'ajax') {
            // Self only (ex ajax)
            if (arg['msg'] == 'bcaEcrCom') {
                clearInterval(refreshIntervalId);
                console.log(arg);
                let hex = Buffer.from(arg['txt']);
                let ascii = hexToAscii(hex);

                // DEBIT CASH 
                let sendToEcr = {
                    ascii: ascii,
                    socket: socket,
                    transType: arg['transType'],
                }
                if (arg['transType'] == '01') {
                    bcaEcrCom(sendToEcr);
                }
                // BCA QRIS
                if (arg['transType'] == '31') {
                    bcaEcrCom(sendToEcr);
                }
            }

            if (arg['msg'] == 'comClose') {
                clearInterval(refreshIntervalId);
                if (refreshIntervalId._idleTimeout > 1) {
                    port.close();
                }
                console.log(refreshIntervalId._idleTimeout);
                const send = {
                    data: "date",
                }
                socket.emit("emiter", send);
                console.log("emiter");
            }

            if (arg['msg'] == 'ercClear') {
                bcaErcClearCom();
            }
 
            // setInterval(function () {
            date = new Date();
            const resp = {
                data: "ERC loop " + date,
                action: 'bca01',
            }
            //   socket.emit("emiter", resp );
            //     io.emit("emiter",{msg2:"ERC loop "+date});
            // }, 1000);

        } else {
            // Broadcase
            console.log("io.emit");
            io.emit("emiter", arg);
        }
 
    });

});

server.listen(3000, () => {
    console.log('listening on *:3000', 0x06);
});


function bcaErcClearCom() {
    let resp = null;
    port.open(function (res) {
        if (res) {
            console.log(res.name, ', opening port: ', res.message);
        } else {
            console.log('com3 Open');
        }
        for (var i = 0; i <= 2; i++) { 
            resp = port.read()?.toString('hex') || '';
            console.log(i, 'ercClear ', resp);
        }
    });
}

function bcaEcrCom(sendToEcr = []) {

    let i = 0;
    port.open(function (res) {
        if (res) {
            console.log(res.name, res.message); 
        } else {
            console.log('com3 Open');
        }

        port.write(sendToEcr['ascii'], function (err) {
            if (err) throw err;
        });

        let read = "";
        refreshIntervalId = setInterval(function () {
            i++;
            let resp = port.read()?.toString('hex') || '';
            console.log(i);
            if (resp) {
                port.write('\x06', function (err) {
                    if (err) throw err;
                });
                let respString = hexToAscii(resp);
                const sendBack = {
                    i: i,
                    hex: resp,
                    ascii: respString,
                    respCode: respString.slice(53, 55),
                    transType: sendToEcr['transType'],
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
}
 
function hexToAscii(str1) {
    var hex = str1.toString();
    var str = '';
    for (var n = 0; n < hex.length; n += 2) {
        str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
    }
    return str;
} 


