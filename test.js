
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(cors());


app.post('/payment', async (req, res) => {

    const body = req.body;

    let reffNumber = "            ";
    console.log('req : ', body['RNN']);
    if (body['transType'] == '32') {
        reffNumber = body['RNN'];
    } else {
        reffNumber = "            ";

    }


});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

