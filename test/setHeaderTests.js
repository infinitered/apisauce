import test from 'ava'
import {create} from '../lib/apisauce'
import createServer from '../support/server'

const validConfig = {
  baseURL: 'http://localhost:9201',
  headers: {'X-Testing': 'hello'}
}

const PORT = 9201
const MOCK = {a: {b: [1, 2, 3]}}
let server = null
test.before((t) => {
  server = createServer(PORT, MOCK)
})

test.after('cleanup', (t) => {
  server.close()
})

test('jumps the wire with the right headers', async t => {
  const api = create(validConfig)
  api.setHeaders({ 'X-Testing': 'foo', steve: 'hey' })
  const response = await api.get('/number/200', {a: 'b'})
  t.is(response.config.headers['X-Testing'], 'foo')
  t.is(response.config.headers['steve'], 'hey')

  // then change one of them
  api.setHeader('steve', 'thx')
  const response2 = await api.get('/number/200', {})
  t.is(response2.config.headers['steve'], 'thx')
})
