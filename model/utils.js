require('dotenv').config();
const { response } = require("express");
const dummyCC = process.env.DUMMYCC;
let STX = "\x02";
let ETX = "\x03";

function msgToBinArr(msg) {
  let array = msg.split("");
  let bin = [];
  let binArray = [];
  array.forEach(n => {
    const temp = [];
    bin.push(hex2bin(textToHex(n)));
    hex2bin(textToHex(n)).split("").forEach(x => {
      temp.push(parseInt(x));
    });
    binArray.push(temp);
  });

  return binArray;
}

function textToHex(text) {
  let hexString = '';
  for (let i = 0; i < text.length; i++) {
    hexString += text.charCodeAt(i).toString(16).padStart(2, '0');
  }
  return hexString;
}

function binToArry(msg) {
  let array = [];
  msg.split("").forEach(n => {
    array.push(parseInt(n));
  });
  return array;

}

function hex2bin(hex) {
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
  return s.substr(s.length - size);
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

function strToArray(data, n) {
  let data1 = data.toString();

  let RespCode = data1.slice(n + 50, n + 50 + 2);
  const response = {
    "  ": "Null",
    "00": "Approve",
    "54": "Decline Expired Card",
    "55": "Decline Incorrect PIN",
    "P2": "Read Card Error",
    "P3": "User press Cancel on EDC",
    "Z3": "EMV Card Decline",
    "CE": "Connection Error/Line Busy",
    "TO": "Connection Timeout",
    "PT": "EDC Problem",
    "aa": "Decline (aa represent two digit alphanumeric value from EDC)",
    "S2": "TRANSAKSI GAGAL,   ULANGI TRANSAKSI  DI EDC",
    "S3": "TXN BLM DIPROSES,  MINTA SCAN QR,  S4 TXN EXPIRED",
  }; 
  const resp = {
    'length': data1.length,
    'TransType': data1.slice(n + 1, n + 3).replace(/ +/g, ""),
    'TransAmount': data1.slice(n + 3, n + 3 + 12).replace(/ +/g, ""),
    'PAN': data1.slice(n + 25, n + 25 + 18).replace(/ +/g, ""),
    'RespCode': data1.slice(n + 50, n + 50 + 2).replace(/ +/g, ""),
    'RRN': data1.slice(n + 52, n + 52 + 12).replace(/ +/g, ""),
    'ApprovalCode': data1.slice(n + 64, n + 64 + 6).replace(/ +/g, ""),
    'DateTime': data1.slice(n + 70, n + 70 + 14).replace(/ +/g, ""),
    'MerchantId': data1.slice(n + 84, n + 84 + 15).replace(/ +/g, ""),
    'TerminalId': data1.slice(n + 99, n + 99 + 8).replace(/ +/g, ""),
    'OfflineFlag': data1.slice(n + 107, n + 107 + 1).replace(/ +/g, ""),
    "response": response[RespCode],
  }
  return resp
}

function ecrData(transType, transAmount, RNN) {
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


  binArray.push(binToArry(hex2bin(pad(totalLength, 4).slice(0, 2))));
  binArray.push(binToArry(hex2bin(pad(totalLength, 4).slice(-2))));
  //  binArray.push(binToArry(hex2bin(version)));
  // VER 2
  binArray.push([0, 0, 0, 0, 0, 0, 1, 0]);

  //binArray.push(binToArry(hex2bin( version )) ); 

  // TYPE TRANS 
  binArray.push(binToArry(hex2bin(textToHex(transType).slice(0, 2))));
  binArray.push(binToArry(hex2bin(textToHex(transType).slice(-2))));

  msgToBinArr(MessageData);
  msgToBinArr(MessageData).forEach(a => {
      binArray.push(a);
  });


  binArray.push(binToArry(hex2bin("03")));

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
  LRC = binaryArrayToHex(xorOperation(binArray));

  let postData = STX + "\x01" + "\x50" +
      version +
      transType +
      MessageData +
      ETX +
      Buffer.from(LRC, 'hex');

  return postData;
}


const utils = {
  msgToBinArr,
  binToArry,
  hex2bin,
  textToHex,
  pad,
  decimalToBinary,
  xorOperation,
  binaryArrayToHex,
  strToArray,
  ecrData
};

module.exports = utils;