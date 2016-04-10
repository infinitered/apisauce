import test from 'ava'
import {create, TIMEOUT_ERROR} from '../lib/apisauce'
import createServer from '../support/server'

const PORT = 9198
let server = null
test.before((t) => {
  server = createServer(PORT)
})

test.after('cleanup', (t) => {
  server.close()
})

const validConfig = {
  baseURL: `http://localhost:${PORT}`,
  timeout: 100
}

test('times out', (t) => {
  const x = create(validConfig)
  return x.get('/sleep/150').then((response) => {
    t.notOk(response.ok)
    t.is(response.problem, TIMEOUT_ERROR)
  })
})
