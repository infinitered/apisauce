import babel from 'rollup-plugin-babel'
import uglify from 'rollup-plugin-uglify'
import filesize from 'rollup-plugin-filesize'

const externalModules = ['ramda', 'axios']

function isImportExternal (importStr) {
  let external = false

  // Check for each of the external modules defined above
  externalModules.forEach(externalModule => {
    if (importStr.indexOf(externalModule) >= 0) external = true
  })

  return external
}

export default {
  entry: 'lib/apisauce.js',
  format: 'cjs',
  plugins: [
    babel({ babelrc: false, plugins: ['ramda'] }),
    uglify(),
    filesize()
  ],
  exports: 'named',
  dest: 'dist/apisauce.js',
  external: isImportExternal
}
