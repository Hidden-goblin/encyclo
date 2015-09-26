'use strict';

var gulp          = require('gulp');
// bundle front files which can use the `require` function
var browserify    = require('browserify');
var source        = require('vinyl-source-stream');
// convert sty files into a css file
var stylus        = require('gulp-stylus');
// add browser specific prefix to a css file
// and output a css file
var autoprefixer  = require('gulp-autoprefixer');

gulp.task('css', function () {
  return gulp
    .src('css/index.styl')
    .pipe(stylus())
    .pipe(autoprefixer())
    .pipe(gulp.dest('public'));
});

gulp.task('js', function () {
  // browserify is a plugin that support streams
  // but gulp need vinyl files…
  return browserify('./js/index.js')
    .bundle()
    // …so we need to convert the stream to vinyl files
    // https://www.npmjs.com/package/vinyl-source-stream
    .pipe(source('index.js'))
    .pipe(gulp.dest('public'));
});

gulp.task('build', ['js', 'css']);

gulp.task('watch', function () {
  gulp.watch('css/**/*.styl', ['css']);
  gulp.watch('js/**/*.js', ['js']);
});

gulp.task('dev', ['build', 'watch']);
