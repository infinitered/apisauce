import babel from 'rollup-plugin-babel'

export default {
  entry: 'lib/apisauce.js',
  format: 'cjs',
  plugins: [
    babel({
      babelrc: false,
      runtimeHelpers: true,
      presets: ['es2015-rollup', 'stage-3'],
      plugins: ['transform-async-to-generator', 'transform-runtime']
    })
  ],
  exports: 'named',
  dest: 'dist/apisauce.js',
  external: [
    'ramda',
    'axios',
    'ramdasauce',
    'p-waterfall',
    'babel-runtime/helpers/extends',
    'babel-runtime/helpers/toConsumableArray',
    'babel-runtime/helpers/asyncToGenerator',
    'babel-runtime/regenerator'
  ]
}
