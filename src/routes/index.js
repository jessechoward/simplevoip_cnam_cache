const router = require('express').Router();
const codes = require('http-response-codes');
const cache = require('../handlers/cache-handler');
const provider = require('../handlers/cnam-handler');
const logger = require('../utils/logger');

// middleware to validate and normalize the DID in the request
// to a NANP format which is 10 digits and not leading (+)1
// https://en.wikipedia.org/wiki/North_American_Numbering_Plan#Modern_plan
router.param('nanp', (req, res, next, did) =>
{
	// strip the did of all non-numeric characters
	let stripped = did.replace(/[^0-9]/gi, '');
	// strip the leading 1 if it is there
	while (stripped.charAt(0) === '1')
	{
		stripped = stripped.substr(1);
	}

	// match against NANP pattern
	// strip the DID into NPA, NXX, XXXX parts
	const parts = stripped.match(/^([2-9][0-8][0-9])([2-9][0-9]{2})([0-9]{4})$/);

	// parts will be null if it doesn't match the pattern/regex fully
	// or if it is the test number below that doesn't technically match NANP
	if (!parts && stripped !== '5551234567')
	{
		logger.warn('Bad request - not a valid NANP number',
			{file: __filename, original_did: did, stripped: stripped});
		return res.status(codes.HTTP_BAD_REQUEST).send('Invalid NANP number');
	}

	// set the DID in the request
	req.DID = stripped;
	// allow the request to continue
	return next();
	// cache.cacheLookup(req, res, next);
});

// a default response for empty cache only lookups
const defaultResponse =
{
	name: 'UNKNOWN',
	number: null,
	price: 0,
	uri: null
};

// this is the middleware that sends responses to the client
const sendResponse = (req, res, next) =>
{
	// check if we have a cached result to send
	// we will not call next since we don't want
	// to cache an already cached result
	if (req.cachedResult)
	{
		return res.status(codes.HTTP_OK)
			.json(req.cachedResult);
	}

	// we will send the response then call next to allow the result to be cached
	if (req.result)
	{
		res.status(codes.HTTP_OK).json(req.result);
		return next();
	}

	// catch all for not found
	return res.status(codes.HTTP_OK).json(Object.assign({}, defaultResponse, {number: req.DID}));
};

// the main usage
router.route('/:nanp')
	// we checked for a cached result when looking up the :nanp param
	// if it is found, the provider.cnamLookup will return that, otherwise
	// if we get a response from the provider, cache the result
	.get(cache.cacheLookup, provider.cnamLookup, sendResponse, cache.cacheResult);

// specify cache only operations
router.route('/cache/:nanp')
	.get(cache.cacheLookup, sendResponse)
	.delete(cache.deleteEntry);

// specify fresh provider lookups
router.route('/provider/:nanp')
	// we checked for a cached result when looking up the :nanp param
	// if it is found, the provider.cnamLookup will return that, otherwise
	// if we get a response from the provider, cache the result
	.get(provider.cnamLookup, sendResponse);

// todo - add routes for metrics gathering and cache maintenance
router.route('/cleanup')
	.delete(cache.expireCachedResults);

module.exports = router;
