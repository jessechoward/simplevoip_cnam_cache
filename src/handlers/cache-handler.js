const config = require('config');
const Sequelize = require('sequelize');
const codes = require('http-response-codes');
const moment = require('moment');
const logger = require('../utils/logger');

// connect to the database
// depending on the options in the config (specifically sync.force)
// this can drop the table and re-create it
// or just create it if it doesn't exist.
const sequelize = new Sequelize(
	config.get('database.name'),
	config.get('database.user'),
	config.get('database.password'),
	config.get('database.options'));

// don't start the app if we can't connect
sequelize.authenticate()
	.then(() =>
	{
		logger.info('database is online');
	})
	.catch((error) =>
	{
		logger.error('database unable to connect');
		process.exit(1);
	});

// import the model
const Cache = sequelize.import('../models/mysql-cache.js');

// sync the database to make sure all the correct tables exist
sequelize.sync();

// this will attempt to lookup the result from the cache
// otherwise it will pass handling back to the requestor
// to look elsewhere - i.e. the CNAM provider
exports.cacheLookup = (req, res, next) =>
{
	Cache.findById(req.DID)
		.then((result) =>
		{
			// if no entry was found
			// allow the next handler to try
			if (!result)
			{
				logger.info('cached result not found');
				return next();
			}

			// otherwise, send the result as the response
			// note the 200 ok
			req.cachedResult = JSON.parse(result.result);
			logger.info('using cached result', {cached_result: req.cachedResult});
			return next();
		})
		.catch((error) =>
		{
			if (!error || Object.keys(error).length === 0)
			{
				logger.error('fake error from sequelize', {cached_result: req.cachedResult});
				// return next();
			}
			// we had an error
			// we need a better way to notify someone when this happens!!!
			logger.error('Error reading from database:',
				{file: __filename, sequelize_error: error});
			// let the next handler handle the request
			return next();
		});
};

// this will allow adding a result from the provider to the cache
// It is assumed this is happening after the response has been sent
// and that the result has been added to the request object
exports.cacheResult = (req, res) =>
{
	Cache.findOrCreate({where: {id: req.DID}, defaults: {id: req.DID, result: JSON.stringify(req.result)}})
		.spread((result, created) =>
		{
			logger.info(`Cached lookup ${req.DID}`, {was_created: created});
		})
		.catch((error) =>
		{
			logger.error('Unable to cache result',
				{file: __filename, sequelize_error: error});
		});
};

const defaultExpire = config.has('cache.defaultExpire') ? config.get('cache.defaultExpire') : {units: 'days', value: 1};

// this method should delete expired cached results
exports.expireCachedResults = (req, res) =>
{
	if (!req.params.expire)
	{
		req.params.expire = moment().subtract(defaultExpire.value, defaultExpire.units).toISOString();
	}

	Cache.destroy({where: {createdAt: {[Sequelize.Op.lt]: req.params.expire}}})
		.then((affectedRows) =>
		{
			logger.info('cleanup cache requested', {expire_older_than: req.params.expire, expired_items: affectedRows});
			return res.status(codes.HTTP_OK)
				.json({exiredAt: req.params.expire, affectedRows: affectedRows});
		})
		.catch((error) =>
		{
			logger.error('cleanup cache failed', {sequelize_error: error});
			return res.status(codes.HTTP_OK)
				.json({exiredAt: req.params.expire, affectedRows: 0});
		});
};

exports.closeGracefully = () =>
{
	logger.warn('Database connections are being manually closed!!!!');
	sequelize.close()
		.then(() =>
		{
			logger.warn('Database connections have been manually closed!!!!');
		});
};
