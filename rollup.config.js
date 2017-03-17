import babel from 'rollup-plugin-babel'

export default {
  entry: 'lib/apisauce.js',
  format: 'cjs',
  plugins: [
    babel({
      babelrc: false,
      presets: ['es2015-rollup'],
      plugins: ['fast-async', 'transform-object-rest-spread']
    })
  ],
  exports: 'named',
  dest: 'dist/apisauce.js',
  external: ['ramda', 'axios']
}
