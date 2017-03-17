import babel from 'rollup-plugin-babel'
import uglify from 'rollup-plugin-uglify'
import filesize from 'rollup-plugin-filesize'

export default {
  entry: 'lib/apisauce.js',
  format: 'cjs',
  plugins: [
    babel({
      babelrc: false,
      presets: ['es2015-rollup'],
      plugins: ['fast-async', 'transform-object-rest-spread']
    }),
    uglify(),
    filesize()
  ],
  exports: 'named',
  dest: 'dist/apisauce.js',
  external: ['ramda', 'axios']
}
