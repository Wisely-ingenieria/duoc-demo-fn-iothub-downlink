module.exports = async function (context, req) {
    const Client = require('azure-iothub').Client;
    const Message = require('azure-iot-common').Message;

    const connectionString = process.env["IOTHUB_CONNECTION_STRING"];
    const serviceClient = Client.fromConnectionString(connectionString);

    const deviceId = (req.query.deviceid || (req.body && req.body.deviceid));
    const msgId = (req.query.id || (req.body && req.body.id));
    let result = 'success';
    let status = true;

    function printResultFor(op) {
        return function printResult(err, res) {
            if (err){
                // console.log('error print : '+err);
                result = err.toString();
                status = false;
                saveResult();
            }
            if (res){
               // console.log('print ok');
               // console.log(res);
                result = res.constructor.name;
            }
        };
    }

    function receiveFeedback(err, receiver){
        if (err) {
            result = err.toString();
            status = false;
            // console.log('error: '+result);
            saveResult();
        } else {
            receiver.on('message', function (msg) {
                result = msg.getData().toString('utf-8');
            //    console.log('message: '+result);
                status = true;
                saveResult();
            })
        }
    }
    
    serviceClient.open(function (err) {
        if (err) {
          //  console.log('error open: '+err.message);
            result = err.message;
            status = false;
        } else {
            serviceClient.getFeedbackReceiver(receiveFeedback);
            let message = new Message(JSON.stringify({
                deviceid: deviceId,
            }));
            message.ack = 'full';
            message.messageId = msgId;
         //   console.log('open: '+message);
            serviceClient.send(deviceId, message, printResultFor('send'));
        }
    });

    function saveResult() {
       // console.log("saveResult");
        try {
            const request = require('axios');
            const url = process.env["SAVE_STATUS_URL"];
            const data = {
                id: msgId,
                result: result,
                status: status
            };
            request.post(url, data,{
                headers: {
                    'Content-Type': 'application/json',
                    'x-functions-key': process.env["FUNCTION_KEY_SAVE_STATUS"]
            }}).then(function (response) {
            //    console.log(response.data);
            }).catch(function (error) {
             //   console.log(error);
            });
        } catch (error) {
            // console.log(error);
        }
    };

    const responseMessage = deviceId + " " + msgId
        ? result
        : "Pass a params in the query string or in the request body for a personalized response.";

    context.res = {
        body: responseMessage
    };
}