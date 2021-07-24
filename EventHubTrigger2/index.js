module.exports = async function (context, eventHubMessages) {
    var pg = require('pg');
    
    const config = {
                        host: 'pgsql-bionova.postgres.database.azure.com',
                        user: 'WiselyDev@pgsql-bionova',
                        password: 'JYm52DbxCDE3AqE',
                        database: 'postgres',
                        port: 5432,
                        ssl: true
    };
    
    
    var client = new pg.Client(config);
    const query = 'insert into iotdata(deviceid, data) values(' + '\'' + eventHubMessages.deviceId + '\'' + ',\'' + JSON.stringify(eventHubMessages) + '\');';
    
    context.log(query);
    
    await client.connect();
    await client.query(query);
    await client.end();

    context.log('insert completed successfully!');
};