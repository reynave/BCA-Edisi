let data1 = "01000003230000000000000000455633******0191···****00······00015101839620240621115111000005111111111CTHTANK1N                                          00005000000301NNN000000000000            N        -";
let data2 = "01000000000000000000000000                       TO                                                                                                                                                    9";
//                                                                ______100115          
let n= 0;
console.log(data1.length);

const resp = {  
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
 
let buffer = Buffer.from([0x02]);

// Ambil nilai biner dari buffer[0] dan ubah menjadi 8 digit biner
let binaryString = buffer[0].toString(2).padStart(8, '0');

console.log(binaryString); // Output: 00000010

//console.log('resp',resp); 

 