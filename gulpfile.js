'use strict';

var gulp  = require('gulp');
// this will do necessary require() calls when calling a gulp-NAME plugin
var $     = require('gulp-load-plugins')();

gulp.task('css', function () {
  return gulp
    .src('css/index.styl')
    .pipe($.stylus())
    .pipe($.autoprefixer())
    .pipe(gulp.dest('public'));
});

gulp.task('build', ['css']);

gulp.task('watch', function () {
  gulp.watch('css/**/*.styl', ['css']);
});

gulp.task('dev', ['build', 'watch']);
