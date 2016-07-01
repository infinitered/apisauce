const gulp = require('gulp')
const babel = require('gulp-babel')
const rollup = require('gulp-rollup')

gulp.task('build', () => {
  return gulp.src('lib/apisauce.js')
    .pipe(rollup({
      entry: './lib/apisauce.js'
    }))
    .pipe(babel({
      presets: ['es2015', 'stage-0']
    }))
    .pipe(gulp.dest('./dist'))
})
