const expect = require('chai').expect;
const supertest = require('supertest');
const codes = require('http-response-codes');

const validNumbers =
[
	'+15551234567',
	'15551234567',
	'5551234567'
];

const invalidNumbers =
[
	'+155512345678',
	'155512345678',
	'55512345678',
	'5551234566',
	'555123456'
];

const multiResponse = function (value)
{
	return ['SAMPLE', 'UNKNOWN'].includes(value);
};

describe('Valid number tests', function ()
{
	let app = null;
	let api = null;

	before(function (done)
	{
		this.timeout(5000);
		setTimeout(() =>
		{
			done();
		}, 500);
		delete require.cache[require.resolve('../src/index')];
		app = require('../src/index');
		api = supertest(app);
	});

	after(function (done)
	{
		app.close(done);
	});

	validNumbers.forEach((did) =>
	{
		it('normal lookup should respond with a 200 OK', (done) =>
		{
			api.get(`/${did}`)
				.expect(codes.HTTP_OK)
				.end(function (error, res)
				{
					expect(res.body.name).to.equal('SAMPLE');
					done();
				});
		});

		it('cached lookup should respond with a 200 OK', (done) =>
		{
			api.get(`/cache/${did}`)
				.expect(codes.HTTP_OK)
				.end(function (error, res)
				{
					expect(res.body.name).to.satisfy(multiResponse);
					done();
				});
		});

		it('provider lookup should respond with a 200 OK', (done) =>
		{
			api.get(`/provider/${did}`)
				.expect(codes.HTTP_OK)
				.end(function (error, res)
				{
					expect(res.body.name).to.equal('SAMPLE');
					done();
				});
		});
	});
});

describe('Invalid number tests', function ()
{
	let app = null;
	let api = null;

	before(function (done)
	{
		this.timeout(5000);

		setTimeout(() =>
		{
			done();
		}, 500);
		delete require.cache[require.resolve('../src/index')];
		app = require('../src/index');
		api = supertest(app);
	});

	after(function (done)
	{
		app.close(done);
	});

	invalidNumbers.forEach((did) =>
	{
		it('normal lookup should respond with a 400 BAD REQUEST', (done) =>
		{
			api.get(`/${did}`)
				.expect(codes.HTTP_BAD_REQUEST, done);
		});

		it('cached lookup should respond with a 400 BAD REQUEST', (done) =>
		{
			api.get(`/cache/${did}`)
				.expect(codes.HTTP_BAD_REQUEST, done);
		});

		it('provider lookup should respond with a 400 BAD REQUEST', (done) =>
		{
			api.get(`/provider/${did}`)
				.expect(codes.HTTP_BAD_REQUEST, done);
		});
	});
});

describe('No database connection tests', function ()
{
	let app = null;
	let api = null;

	before(function (done)
	{
		this.timeout(5000);
		setTimeout(() =>
		{
			const db = require('../src/handlers/cache-handler');
			// this is where we manually close the database connections
			db.closeGracefully();

			setTimeout(() =>
			{
				done();
			}, 500);
		}, 500);
		delete require.cache[require.resolve('../src/index')];
		app = require('../src/index');
		api = supertest(app);
	});

	after(function (done)
	{
		app.close(done);
	});

	validNumbers.forEach((did) =>
	{
		it('normal lookup should respond with a 200 OK', (done) =>
		{
			api.get(`/${did}`)
				.expect(codes.HTTP_OK)
				.end(function (error, res)
				{
					expect(res.body.name).to.equal('SAMPLE');
					done();
				});
		});

		it('cached lookup should respond with a 200 OK', (done) =>
		{
			api.get(`/cache/${did}`)
				.expect(codes.HTTP_OK)
				.end(function (error, res)
				{
					expect(res.body.name).to.satisfy(multiResponse);
					done();
				});
		});

		it('provider lookup should respond with a 200 OK', (done) =>
		{
			api.get(`/provider/${did}`)
				.expect(codes.HTTP_OK)
				.end(function (error, res)
				{
					expect(res.body.name).to.equal('SAMPLE');
					done();
				});
		});
	});
});

