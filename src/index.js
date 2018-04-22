require('dotenv').config();
const config = require('config');
const app = require('express')();
const bodyParser = require('body-parser');
const responseTime = require('response-time')();
const requestId = require('express-request-id')();
const logger = require('./utils/logger');

// add the X-Response-Time header to responses
app.use(responseTime);

// add the request-id headers
app.use(requestId);

// parse the request body and params etc.
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

// enable logging middleware
app.use(logger.middleware);

// use the routes we have configured
app.use(require('./routes'));

// start the server listening for new requests
const server = app.listen(config.get('port'), config.get('bind'), () =>
{
	logger.info(`Listening on port: ${server.address().port}`);
});

// export the server
module.exports = server;
