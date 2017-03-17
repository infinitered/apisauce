import test from 'ava'
import { create } from '../lib/apisauce'
import createServer from './_server'
import getFreePort from './_getFreePort'

let port
let server = null
const MOCK = { a: { b: [1, 2, 3] } }
test.before(async t => {
  port = await getFreePort()
  server = createServer(port, MOCK)
})

test.after.always('cleanup', t => {
  server.close()
})

test('can be used with async/await', async t => {
  const x = create({ baseURL: `http://localhost:${port}` })
  const response = await x.get('/number/200', { a: 'b' })
  t.is(response.status, 200)
  t.deepEqual(response.data, MOCK)
})
