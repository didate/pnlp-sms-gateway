const express = require('express');
const config = require('config');
const axios = require('axios');
const querystring = require('querystring');

const app = express();
const port = 3000;


app.get('/', (req, res) => {
    res.send('PNLP GATEWAY')
});

app.post('/send-sms', async (req, res) => {

    const API = req.query.smsapikey;
    const telephone = formatTel(req.query.to);
    let message = req.query.content;
    message = message.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    let response= "Error !";
    if (API === config.get('gateway.apikey')) {
        //await sendSMS(message,telephone);
        response = message; //"Done !"
    }
    res.send(response)
});

app.listen(port, () => {
    console.log(`PNLP GATEWAY STARTED ${port} !`)
});

const getToken = async () => {
    try {
        const data = querystring.stringify({ 'grant_type': 'client_credentials' });
        const token = await axios.post('https://api.orange.com/oauth/v3/token', data, {
            headers: {
                'Authorization': config.get("orange.authorization"),
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
                'Content-Length': Buffer.byteLength("grant_type=client_credentials")
            }
        });
        return token.data;
    } catch (error) {
        console.log(error);
    }
}

const sendSMS = async (content , telephone) => {


    const tokendata = await getToken();
    const type = tokendata.token_type;
    const token = tokendata.access_token;

    const sender = config.get("gateway.senderNumber");
    const request = {
        "outboundSMSMessageRequest": {
            "address": `tel:${telephone}`,
            "senderAddress": `tel:+${sender}`,
            "outboundSMSTextMessage": {
                "message": content
            }
        }
    };
    try {

        const response = await axios.post(`https://api.orange.com/smsmessaging/v1/outbound/tel%3A%2B${sender}/requests`, request, {
            headers: {
                'Authorization': `${type} ${token}`,
                'Content-Type': 'application/json',
            }
        });
        return response;
    } catch (error) {
        console.log(error);
        return null;
    }
}

function formatTel(telephone) {

    if (telephone.length === 12 && telephone.indexOf('224') == 0) telephone = telephone.slice('224'.length);
    if (telephone.length === 13 && telephone.indexOf('0224') == 0) telephone = telephone.slice('0224'.length);
    if (telephone.length === 14 && telephone.indexOf('00224') == 0) telephone = telephone.slice('00224'.length);
    if (telephone.length === 15 && telephone.indexOf('000224') == 0) telephone = telephone.slice('000224'.length);

    telephone = `+224${telephone}`;
    return telephone;
}