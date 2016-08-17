import test from 'ava'
import {create} from '../lib/apisauce'
import createServer from '../support/server'
import getFreePort from '../support/getFreePort'

const MOCK = {a: {b: [1, 2, 3]}}
let port
let server = null
test.before(async t => {
  port = await getFreePort()
  server = createServer(port, MOCK)
})

test.after('cleanup', (t) => {
  server.close()
})

test('POST has proper data', (t) => {
  const x = create({ baseURL: `http://localhost:${port}` })
  return x.post('/post', MOCK).then((response) => {
    t.is(response.status, 200)
    t.deepEqual(response.data, {got: MOCK})
  })
})

test('PATCH has proper data', (t) => {
  const x = create({ baseURL: `http://localhost:${port}` })
  return x.patch('/post', MOCK).then((response) => {
    t.is(response.status, 200)
    t.deepEqual(response.data, {got: MOCK})
  })
})

test('PUT has proper data', (t) => {
  const x = create({ baseURL: `http://localhost:${port}` })
  return x.put('/post', MOCK).then((response) => {
    t.is(response.status, 200)
    t.deepEqual(response.data, {got: MOCK})
  })
})
