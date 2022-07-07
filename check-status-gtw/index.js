module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    var Client = require('azure-iothub').Client;
    var Message = require('azure-iot-common').Message;

    var connectionString = 'HostName=bionova-iot-hub-azure.azure-devices.net;SharedAccessKeyName=service;SharedAccessKey=Vy1adq2cCoBeqhxg1VyP9vnPF7yF0g7TMIeUESfWIps=';
    var serviceClient = Client.fromConnectionString(connectionString);

    const deviceId = (req.query.deviceid || (req.body && req.body.deviceid));
    const msgId = (req.query.id || (req.body && req.body.id));
    var result = 'failed';

    function printResultFor(op) {
        return function printResult(err, res) {
            if (err){
                console.log(op + ' error: ' + err.toString());
                result = err.toString();
            }
            if (res){
                console.log(op + ' status: ' + res.constructor.name);
                result = res.constructor.name;
            }
        };
    }

    function receiveFeedback(err, receiver){
        receiver.on('message', function (msg) {
            console.log('Feedback message:')
            console.log(msg.getData().toString('utf-8'));
            result = msg.getData().toString('utf-8');
        });
    }

    serviceClient.open(function (err) {
        if (err) {
            console.error('Could not connect: ' + err.message);
            // return err.message;
            result = err.message;
        } else {
            console.log('Service client connected');
            serviceClient.getFeedbackReceiver(receiveFeedback);
            var message = new Message(JSON.stringify({
                deviceid: deviceId,
            }));
            message.ack = 'full';
            message.messageId = msgId;
            console.log('Sending message: ' + message.getData());
            serviceClient.send(deviceId, message, printResultFor('send'));
            // return 'success';
        }
    });

    const responseMessage = deviceId + " " + msgId
        ? result
        : "Pass a params in the query string or in the request body for a personalized response.";

    context.res = {
        // status: 200, /* Defaults to 200 */
        body: responseMessage
    };
}