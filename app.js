const express = require('express');
const path = require('path');
const { ethers } = require('ethers');
const axios = require('axios');

require('dotenv').config();

const app = express();
app.use(express.json());

const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

let currency = {
        'ETH' : '',
        'USDT' : '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        'USDC' : '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
}

async function check(gatesignerPayload) {
    const apiKey = process.env.HEXAGATE_API_KEY;
    console.log("Payload to Gate Signer: " + JSON.stringify(gatesignerPayload, 0, 3))
    let r;

    try {
        r = await axios.post('https://api.hexagate.com/api/v3/gatesigner/custom_api/34/analyze_tx', gatesignerPayload, {
            headers: {
            'Content-Type': 'application/json',
            'x-hexagate-api-key': apiKey
            }
        });
    } catch (error) {
        if (error.response) {
          // The request was made and the server responded with a status code outside 2xx
          console.error('Error response:', {
            status: error.response.status,
            data: error.response.data,
          });
        } else if (error.request) {
          // The request was made but no response was received
          console.error('No response received:', error.request);
        } else {
          // Something happened in setting up the request
          console.error('Request setup error:', error.message);
        }
      }

      console.log(JSON.stringify(r.data, 0, 3));
      return r;
}

app.post('/gate-signer-check', async(req, res) => {
    let payload = req.body;
    let calldata = '', amount = 0;
    if (payload.currency !== 'ETH') {
        const recipient = payload.to;
        amount = ethers.parseUnits(payload.amount.toString(), 6); // e.g. 100 USDT (6 decimals)
        const abi = [
        "function transfer(address to, uint256 amount)"
        ];
        const iface = new ethers.Interface(abi);
        calldata = iface.encodeFunctionData("transfer", [recipient, amount]);
        console.log(calldata);
    }

    let gatesignerPayload = {
         from : payload.from,
         to :  payload.currency == 'ETH' ? payload.to : currency[payload.currency],
         value : payload.currency == 'ETH' ? payload.amount : '0x',
         data : payload.currency == 'ETH' ? '0x' : calldata,
         chain_id : 1
     }

    const response = await check(gatesignerPayload);
    console.log('Response:', response.data);
    res.json(response.data)
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
