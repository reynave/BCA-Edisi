const escpos = require('escpos');
const SerialPort = require('escpos-serialport');

// Ganti 'COM3' dengan port serial printer Anda
const device = new SerialPort('COM3', { baudRate: 9600 });

const printer = new escpos.Printer(device);

device.open(() => {
  printer
    .align('LT') // Align kiri
    .text('Halo, ini cetakan ESC/POS')
    .drawLine() // Cetak garis horizontal
    .cut() // Potong kertas
    .close();
});