const config = require('config');
const request = require('request');
const logger = require('../utils/logger');

// in order to change the URL or params we just
// have to update the configuration file and
// restart nodejs
const settings = config.get('cnam');

// for any provider provide a 'lookup' method
// that takes a NANP number as the first argument
// and a callback function (error, result) as the second
exports.lookup = (requestId, nanp, callback) =>
{
	// We went through the pain of normalizing the number early on
	// so we don't need all sorts of request logic in the url here
	// also, make sure we add the request-id header so we can keep
	// a full record of the transaction
	request.get(`/${nanp}`,
		Object.assign({}, settings, {headers: {'X-Request-Id': requestId}}),
		(error, response, body) =>
	{
		if (error)
		{
			// return the error and no response body
			logger.error('The request library reported an error',
				{file: __filename, request_error: error});
			return callback(error, null);
		}

		if (response.statusCode >= 400 || !body)
		{
			// return the status code as the error and the response body or error message
			logger.error('Error response from opencnam',
				{file: __filename, opencnam_response: body || ['no body in response']});
			return callback(response.statusCode, body || ['no body in response']);
		}

		// no errors! w00t!
		return callback(null, body);
	});
};
