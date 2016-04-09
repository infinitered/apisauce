const gulp = require('gulp')
const babel = require('gulp-babel')
const rollup = require('gulp-rollup')

gulp.task('build', () => {
  return gulp.src('lib/apisauce.js')
    .pipe(rollup({}))
    .pipe(babel({
      presets: ['es2015', 'stage-2']
    }))
    .pipe(gulp.dest('./dist'))
})
