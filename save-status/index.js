module.exports = async function (context, req) {
    var pg = require('pg');
    
    const config = {
                        host: process.env["HOST_DB"],
                        user: process.env["USER_DB"],
                        password: process.env["PASS_DB"],
                        database: process.env["NAME_DB"],
                        port: process.env["PORT_DB"],
                        ssl: true
    };

    const msgId = (req.query.id || (req.body && req.body.id));
    const result = (req.query.result || (req.body && req.body.result));
    const status = (req.query.status || (req.body && req.body.status));

    const client = new pg.Client(config);
    const updated_at = new Date().toISOString();
    const query = 'update response_functions set status = ' + '\'' + status + '\'' + ', msg = ' + '\'' + result + '\'' +', updated_at = ' + '\'' + updated_at + '\'' + ' where id = ' + '\'' + msgId + '\'';

    // console.log(query);
    
    await client.connect();
    await client.query(query);
    await client.end();

    context.res = {
        status: 200,
        body: "insert completed successfully!"
    };
};