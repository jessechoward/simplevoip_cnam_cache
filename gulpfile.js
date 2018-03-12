const gulp = require('gulp');
const mocha = require('gulp-mocha');
const lint = require('gulp-eslint');
const yarn = require('gulp-yarn');
const zip = require('gulp-zip');

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
	return gulp.src(paths.test, {read: false})
		.pipe(mocha({reporter: 'list', exit: true}))
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

gulp.task('copy', ['copy:src', 'copy:config']);

gulp.task('yarn', function ()
{
	return gulp.src(paths.package)
		.pipe(gulp.dest('build/tmp'))
		.pipe(yarn({production: true}));
});

gulp.task('build', ['copy', 'yarn'], function ()
{
	console.log('zipping build');
	return gulp.src(['build/tmp/**/*'])
		.pipe(zip('build.zip'))
		.pipe(gulp.dest('build/dist'));
});

gulp.task('default', ['lint', 'mocha'], function ()
{
	return gutil.log('Gulp is running');
});

