module.exports = async function (context, eventHubMessages) {
    try {
        const axios = require('axios');
        const device = eventHubMessages.deviceId;
        const data = eventHubMessages;

        // send data to api biotraz
        const url = process.env["URL_API"];
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + process.env["TOKEN_API"]
        };

        try {
            const response = await axios.post(url, {
                device,
                data
            }, { headers });
        } catch (error) {
            context.log('send failed!', error)
        }
        context.log('send completed successfully!');
    } catch (error) {
        context.log('send failed!', error);
    }
};