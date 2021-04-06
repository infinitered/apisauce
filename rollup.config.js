import babel from 'rollup-plugin-babel'
import uglify from 'rollup-plugin-uglify'
import filesize from 'rollup-plugin-filesize'

const externalModules = ['ramda', 'axios']
const input = 'lib/apisauce.js';
const name = 'apisauce';

function isImportExternal (importStr) {
  let external = false

  // Check for each of the external modules defined above
  externalModules.forEach(externalModule => {
    if (importStr.indexOf(externalModule) >= 0) external = true
  })

  return external
}

function getPlugins () {
  return [
    babel({ babelrc: false, plugins: ['ramda'] }),
    uglify(),
    filesize()
  ]
}

export default [
  {
    input,
    output: {
      file: `dist/${name}.js`,
      format: 'cjs',
      exports: 'named',
    },
    plugins: getPlugins(),
    external: isImportExternal
  },
  {
    input,
    output: {
      file: `dist/umd/${name}.js`,
      format: 'umd',
      exports: 'named',
      name,
    },
    plugins: getPlugins(),
    external: isImportExternal
  },
]
