import babel from 'rollup-plugin-babel'
import commonjs from 'rollup-plugin-commonjs'
import filesize from 'rollup-plugin-filesize'
import resolve from 'rollup-plugin-node-resolve'
import uglify from 'rollup-plugin-uglify'

const externalModules = ['axios']
const input = 'lib/apisauce.js'
const name = 'apisauce'

function isImportExternal(importStr) {
  let external = false

  // Check for each of the external modules defined above
  externalModules.forEach(externalModule => {
    if (importStr.indexOf(externalModule) >= 0) external = true
  })

  return external
}

function getBabelOptions() {
  return { babelrc: false, plugins: [] }
}

export default [
  {
    input,
    output: {
      exports: 'named',
      file: `dist/${name}.js`,
      format: 'cjs',
    },
    plugins: [babel(getBabelOptions()), uglify(), filesize()],
    external: isImportExternal,
  },
  {
    input,
    output: {
      exports: 'named',
      file: `dist/umd/${name}.js`,
      format: 'umd',
      globals: {
        axios: 'axios',
      },
      name,
    },
    plugins: [babel(getBabelOptions()), resolve(), commonjs(), uglify(), filesize()],
    external: externalModules,
  },
]
