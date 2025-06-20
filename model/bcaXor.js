const utils = require('./utils');
const { addLogs, respLogs } = require('./logs');
const dummyCC = process.env.DUMMYCC; 

let STX = "\x02";
let ETX = "\x03";
function bcaXor(body = []) {
    const binArray = [];
    const bin = [];
    let version = "\x02";
    let transType = '01';

    if (body['RNN']) {
        body['reffNumber'] = body['RNN'];
        delete body['RNN'];
    }
    console.log(body);


    if (body['transType'] != undefined) {
        transType = body['transType'];
    }
    console.log(transType);
    if (!body['amount']) {
        body['amount'] = 0;
    }
    // let transAmount = "000000122500";
    let transAmount = body['amount'].toString().padStart(10, '0') + '00';
    if (body['transType'] == '32') {
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
        PAN = "4556330000000191"+"   ";
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
    let reffNumber = body['reffNumber'] ? body['reffNumber'] : "            ";
    let originalDate = "    ";
    let BCAFiller = "                                                  ";

    let LRC = null;

    console.log('reffNumber : ', body['reffNumber']);
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
    let date = new Date() + " " + body['ip'];
    addLogs("");
    addLogs(date);

    

    return {
        postData :postData,
        postDataNote : postDataNote,
    };
}

module.exports = { bcaXor };