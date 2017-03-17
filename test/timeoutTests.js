import test from 'ava'
import { create, TIMEOUT_ERROR } from '../lib/apisauce'
import createServer from '../support/server'
import getFreePort from '../support/getFreePort'

let port
let server = null
test.before(async t => {
  port = await getFreePort()
  server = createServer(port)
})

test.after('cleanup', t => {
  server.close()
})

test('times out', t => {
  const x = create({ baseURL: `http://localhost:${port}`, timeout: 100 })
  return x.get('/sleep/150').then(response => {
    t.falsy(response.ok)
    t.is(response.problem, TIMEOUT_ERROR)
  })
})
