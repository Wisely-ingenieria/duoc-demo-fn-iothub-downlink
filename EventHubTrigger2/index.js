module.exports = async function (context, eventHubMessages) {
    var pg = require('pg');
    
    const config = {
                        host: process.env["HOST_DB"],
                        user: process.env["USER_DB"],
                        password: process.env["PASS_DB"],
                        database: process.env["NAME_DB"],
                        port: process.env["PORT_DB"],
                        ssl: true
    };
    
    
    var client = new pg.Client(config);
    const query = 'insert into iotdata(deviceid, data) values(' + '\'' + eventHubMessages.deviceId + '\'' + ',\'' + JSON.stringify(eventHubMessages) + '\');';
    
    await client.connect();
    await client.query(query);
    await client.end();

    // context.log('insert completed successfully!');
};