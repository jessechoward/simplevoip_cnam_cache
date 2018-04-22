const config = require('config');
const hostname = require('os').hostname();
const winston = require('winston');

const logger = new winston.Logger(
{
	level: config && config.has('logging.level') ? config.get('logging.level') : 'info',
	transports:
	[
		new winston.transports.Console(
		{
			handleExceptions: true,
			json: true,
			colorize: true,
			timestamp: true,
			silent: process.env.NODE_ENV === 'testing' ? true : false,
			stderrLevels: ['error']
		})
		// add additional transports here like to a stream
		// or cloudwatch etc.
	]
});

logger.rewriters.push((level, msg, meta) =>
{
	return Object.assign({}, meta,
	{
		hostname: hostname,
		appName: process.env.npm_package_name,
		appVersion: process.env.npm_package_version
	});
});

logger.middleware = (req, res, next) =>
{
	res.on('finish', () =>
	{
		logger.info(res.statusMessage,
		{
			type: 'http-request',
			id: req.id,
			sourceIp: req.ip,
			protocol: req.protocol,
			url: req.hostname + req.originalUrl,
			statusCode: res.statusCode,
			responseTime: res && res.getHeaders() ? res.getHeaders()['x-response-time'] : NaN
		});

		next();
	});

	next();
};

module.exports = logger;
