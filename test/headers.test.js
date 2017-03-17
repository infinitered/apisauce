import test from 'ava'
import { create } from '../lib/apisauce'
import createServer from './_server'
import getFreePort from './_getFreePort'

const MOCK = { a: { b: [1, 2, 3] } }
let port
let server = null
test.before(async t => {
  port = await getFreePort()
  server = createServer(port, MOCK)
})

test.after('cleanup', t => {
  server.close()
})

test('jumps the wire with the right headers', async t => {
  const api = create({
    baseURL: `http://localhost:${port}`,
    headers: { 'X-Testing': 'hello' }
  })
  api.setHeaders({ 'X-Testing': 'foo', steve: 'hey' })
  const response = await api.get('/number/200', { a: 'b' })
  t.is(response.config.headers['X-Testing'], 'foo')
  t.is(response.config.headers['steve'], 'hey')

  // then change one of them
  api.setHeader('steve', 'thx')
  const response2 = await api.get('/number/200', {})
  t.is(response2.config.headers['steve'], 'thx')
})
