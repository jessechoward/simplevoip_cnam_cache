const gulp = require('gulp');
const mocha = require('gulp-mocha');
const lint = require('gulp-eslint');
const yarn = require('gulp-yarn');
const zip = require('gulp-zip');
// const git = require('gulp-git');
const bump = require('gulp-bump');
const filter = require('gulp-filter');
const tagVersion = require('gulp-tag-version');
// const fs = require('fs-extra');

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
	const mochaOptions =
	{
		reporter: 'spec',
		exit: true,
		bail: true
	};

	return gulp.src(paths.test, {read: false})
		.pipe(mocha(mochaOptions))
		.on('error', console.error);
});

gulp.task('lint', function ()
{
	return gulp.src(['src/**/*.js', '!node_modules/**'])
		.pipe(lint())
		.pipe(lint.format())
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

const increment = function (bumpOptions)
{
	// include any files we need to keep the version consistent in
	return gulp.src(['./package.json'])
		// bump the version in those files
		.pipe(bump(bumpOptions))
		// save the output back to the file system
		.pipe(gulp.dest('./'))
		// read only the package.json file for the version to tag the repo with
		.pipe(filter('package.json'))
		// tag the repo
		.pipe(tagVersion());
};

gulp.task('patch', gulp.series('test'), function ()
{
	return increment({type: 'patch'});
});

gulp.task('minor', gulp.series('test'), function ()
{
	return increment({type: 'minor'});
});

gulp.task('major', gulp.series('test'), function ()
{
	return increment({type: 'major'});
});

gulp.task('prerelease', gulp.series('test'), function ()
{
	return increment({type: 'prerelease', preid: 'alpha'});
});
