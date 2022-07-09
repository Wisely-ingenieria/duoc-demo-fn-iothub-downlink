module.exports = async function (context, req) {
    var Client = require('azure-iothub').Client;
    var Message = require('azure-iot-common').Message;

    const connectionString = process.env["IOTHUB_CONNECTION_STRING"];
    var serviceClient = Client.fromConnectionString(connectionString);


    const deviceId = (req.query.deviceid || (req.body && req.body.deviceid));
    const deviceTime = (req.query.time || (req.body && req.body.time));
    const msgId = (req.query.id || (req.body && req.body.id));
    let result = 'success';
    let status = true;

    function printResultFor(op) {
        return function printResult(err, res) {
            if (err){
                result = err.toString();
                status = false;
            }
            if (res){
                result = res.constructor.name;
            }
        };
    }

    function receiveFeedback(err, receiver){
        if (err) {
            result = err.toString();
            status = false;
            saveResult();
        } else {
            receiver.on('message', function (msg) {
                result = msg.getData().toString('utf-8');
                saveResult();
            })
        }
    }

    serviceClient.open(function (err) {
        if (err) {
            result = err.message;
            status = false;
        } else {
            var message = new Message(JSON.stringify({
                time: deviceTime,
            }));
            message.ack = 'full';
            message.messageId = msgId;
            serviceClient.send(deviceId, message, printResultFor('send'));
            serviceClient.getFeedbackReceiver(receiveFeedback);
        }
    });

    function saveResult() {
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
                // console.log(response.data);
            }).catch(function (error) {
                // console.log(error);
            });
        } catch (error) {
            // console.log(error);
        }
    };

    const responseMessage = deviceId + " " + deviceTime + " " + msgId
        ? result
        : "Pass a params in the query string or in the request body for a personalized response.";

    context.res = {
        // status: 200, /* Defaults to 200 */
        body: responseMessage
    };

    

    function printResultFor(op) {
        return function printResult(err, res) {
            if (err){
                // console.log(op + ' error: ' + err.toString());
                result = err.toString();
            }
            if (res){
                // console.log(op + ' status: ' + res.constructor.name);
                result = res.constructor.name;
            }
        };
    }

    function receiveFeedback(err, receiver){
        receiver.on('message', function (msg) {
        // console.log('Feedback message:')
        // console.log(msg.getData().toString('utf-8'));
        result = msg.getData().toString('utf-8');
        });
    }

    
}