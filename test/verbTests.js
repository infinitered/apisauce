import test from 'ava'
import lib from '../lib/apisauce'
import createServer from './testServer'

const PORT = 9191
let server = null
test.before((t) => {
  server = createServer(PORT)
})

test.after('cleanup', (t) => {
  server.close()
})

const validConfig = {
  baseURL: `http://localhost:${PORT}`
}

test('supports all verbs', (t) => {
  const x = lib.create(validConfig)
  t.ok(x.get)
  t.ok(x.post)
  t.ok(x.patch)
  t.ok(x.put)
  t.ok(x.head)
  t.ok(x.delete)
})

test('can make a get', (t) => {
  const x = lib.create(validConfig)
  return x.get('/ok').then((response) => {
    t.ok(response.ok)
    t.is(response.config.method, 'get')
  })
})

test('can make a post', (t) => {
  const x = lib.create(validConfig)
  return x.post('/ok').then((response) => {
    t.ok(response.ok)
    t.is(response.config.method, 'post')
  })
})

test('can make a patch', (t) => {
  const x = lib.create(validConfig)
  return x.patch('/ok').then((response) => {
    t.ok(response.ok)
    t.is(response.config.method, 'patch')
  })
})

test('can make a put', (t) => {
  const x = lib.create(validConfig)
  return x.put('/ok').then((response) => {
    t.ok(response.ok)
    t.is(response.config.method, 'put')
  })
})

test('can make a delete', (t) => {
  const x = lib.create(validConfig)
  return x.delete('/ok').then((response) => {
    t.ok(response.ok)
    t.is(response.config.method, 'delete')
  })
})

test('can make a head', (t) => {
  const x = lib.create(validConfig)
  return x.head('/ok').then((response) => {
    t.ok(response.ok)
    t.is(response.config.method, 'head')
  })
})
