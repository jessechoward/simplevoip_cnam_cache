const provider = require('../models/provider-opencnam');
const logger = require('../utils/logger');

const defaultResponse =
{
	name: 'UNKNOWN',
	number: null,
	price: 0,
	uri: null
};

exports.cnamLookup = (req, res, next) =>
{
	// check if we have a cached result to send
	if (req.cachedResult)
	{
		return next();
	}

	// if not, do the lookup
	provider.lookup(req.DID, (error, result) =>
	{
		if (error || !result)
		{
			logger.error('Error in cnamLookup',
				{file: __filename, cnam_error: error, cnam_result: result});
			// even though we errored we still need to send a positive response
			req.result = Object.assign({}, defaultResponse, {number: req.DID});
		}
		else
		{
			req.result = result;
		}

		// allow us to cache the result before sending the response
		return next();
	});
};
