
const fs = require('fs');


function addLogs(postData) {
    let date = new Date();
    let year = date.getFullYear();
    let month = String(date.getMonth() + 1).padStart(2, '0'); // getMonth() returns 0-11, so add 1
    let day = String(date.getDate()).padStart(2, '0');
    let formattedDate = `${year}-${month}-${day}`;
  
    let filePath = './tmp/log_' + formattedDate + '.txt';
    if (fs.existsSync(filePath)) {
        fs.appendFile(filePath, postData + "\n", (err) => {
            if (err) {
                console.error('Gagal menambahkan data ke file:', err);
            }
        });
    } else {
        // File belum ada, buat file baru dan tulis data
        fs.writeFile(filePath, postData + "\n", (err) => {
            if (err) {
                console.error('Gagal menulis data ke file baru:', err);
            }
        });
    }
}

 
module.exports = { addLogs };