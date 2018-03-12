const gulp = require('gulp');
const mocha = require('gulp-mocha');
const lint = require('gulp-eslint');
const yarn = require('gulp-yarn');
const zip = require('gulp-zip');
const del = require('del');
const semver = require('semver');
const package = require('./package.json');
const fs = require('fs-extra');

const paths =
{
	package: ['./package.json'],
	src: 'src/**/*.js',
	srcConfig: 'config/*.json',
	srcDist: ['src/**/*.js', 'config/**/*.json'],
	test: ['test/**/*.js'],
	dist: 'build/dist',
	tmp: 'build/tmp',
	logs: 'build/log'
};

gulp.task('mocha', function ()
{
	const mocha_options =
	{
		reporter: 'xunit',
		reporterOptions: {reportFilename: 'build/log/unit-tests.xml'},
		exit: true,
		bail: true
	};

	return gulp.src(paths.test, {read: false})
		.pipe(mocha(mocha_options))
		.on('error', console.error);
});

gulp.task('lint', function ()
{
	fs.mkdirpSync('./build/log');
	const log_stream = fs.createWriteStream('build/log/lint.json', {flags: 'w'});

	return gulp.src(['src/**/*.js', '!node_modules/**'])
		.pipe(lint())
		.pipe(lint.format('json', log_stream))
		.pipe(lint.failAfterError());
});

gulp.task('copy:src', function ()
{
	return gulp.src(['src/**/*.js'], {base: '.'})
		.pipe(gulp.dest('build/tmp'));
});

gulp.task('copy:config', function ()
{
	return gulp.src(['config/*.json'], {base: '.'})
		.pipe(gulp.dest('build/tmp'));
});

gulp.task('copy', gulp.parallel('copy:src', 'copy:config'));

gulp.task('yarn', function ()
{
	return gulp.src(paths.package)
		.pipe(gulp.dest('build/tmp'))
		.pipe(yarn({production: true}));
});

gulp.task('test', gulp.series('lint', 'mocha'));

gulp.task('build', gulp.series('test', 'copy', 'yarn', function ()
{
	return gulp.src(['build/tmp/**/*'])
		.pipe(zip('build.zip'))
		.pipe(gulp.dest('build/dist'));
}));

gulp.task('default', gulp.parallel('test'));

