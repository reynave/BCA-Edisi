function msgToBinArr(msg){ 
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

function binToArry(msg){ 
     let array = [];
      msg.split("").forEach(n => { 
          array.push(parseInt(n)); 
      });   
     return array;

}

function hex2bin(hex){ 
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
    return s.substr(s.length-size);
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
  

const utils  = {
    msgToBinArr,
    binToArry,
    hex2bin,
    textToHex,
    pad,
    decimalToBinary,
    xorOperation,
    binaryArrayToHex
};

module.exports = utils;