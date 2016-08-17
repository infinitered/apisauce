import test from 'ava'
import {create} from '../lib/apisauce'
import createServer from '../support/server'
import getFreePort from '../support/getFreePort'

let port
let server = null
test.before(async t => {
  port = await getFreePort()
  server = createServer(port)
})

test.after('cleanup', (t) => {
  server.close()
})

test('supports all verbs', (t) => {
  const x = create({ baseURL: `http://localhost:${port}` })
  t.truthy(x.get)
  t.truthy(x.post)
  t.truthy(x.patch)
  t.truthy(x.put)
  t.truthy(x.head)
  t.truthy(x.delete)
})

test('can make a get', (t) => {
  const x = create({ baseURL: `http://localhost:${port}` })
  return x.get('/ok').then((response) => {
    t.truthy(response.ok)
    t.is(response.config.method, 'get')
  })
})

test('can make a post', (t) => {
  const x = create({ baseURL: `http://localhost:${port}` })
  return x.post('/ok').then((response) => {
    t.truthy(response.ok)
    t.is(response.config.method, 'post')
  })
})

test('can make a patch', (t) => {
  const x = create({ baseURL: `http://localhost:${port}` })
  return x.patch('/ok').then((response) => {
    t.truthy(response.ok)
    t.is(response.config.method, 'patch')
  })
})

test('can make a put', (t) => {
  const x = create({ baseURL: `http://localhost:${port}` })
  return x.put('/ok').then((response) => {
    t.truthy(response.ok)
    t.is(response.config.method, 'put')
  })
})

test('can make a delete', (t) => {
  const x = create({ baseURL: `http://localhost:${port}` })
  return x.delete('/ok').then((response) => {
    t.truthy(response.ok)
    t.is(response.config.method, 'delete')
  })
})

test('can make a head', (t) => {
  const x = create({ baseURL: `http://localhost:${port}` })
  return x.head('/ok').then((response) => {
    t.truthy(response.ok)
    t.is(response.config.method, 'head')
  })
})
