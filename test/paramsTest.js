import test from 'ava'
import { create, NONE } from '../lib/apisauce'
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

test('GET supports params', t => {
  const x = create({ baseURL: `http://localhost:${port}` })
  return x.get('/echo', { q: 'hello' }).then(response => {
    t.is(response.problem, NONE)
    t.deepEqual(response.data, { echo: 'hello' })
  })
})

test('POST supports params', t => {
  const x = create({ baseURL: `http://localhost:${port}` })
  return x.post('/echo', null, { params: { q: 'hello' } }).then(response => {
    t.is(response.problem, NONE)
    t.deepEqual(response.data, { echo: 'hello' })
  })
})

test('PATCH supports params', t => {
  const x = create({ baseURL: `http://localhost:${port}` })
  return x.patch('/echo', null, { params: { q: 'hello' } }).then(response => {
    t.is(response.problem, NONE)
    t.deepEqual(response.data, { echo: 'hello' })
  })
})

test('PUT supports params', t => {
  const x = create({ baseURL: `http://localhost:${port}` })
  return x.put('/echo', null, { params: { q: 'hello' } }).then(response => {
    t.is(response.problem, NONE)
    t.deepEqual(response.data, { echo: 'hello' })
  })
})

test('DELETE supports params', t => {
  const x = create({ baseURL: `http://localhost:${port}` })
  return x.delete('/echo', { q: 'hello' }).then(response => {
    t.is(response.problem, NONE)
    t.deepEqual(response.data, { echo: 'hello' })
  })
})

test('LINK supports params', t => {
  const x = create({ baseURL: `http://localhost:${port}` })
  return x.link('/echo', { q: 'hello' }).then(response => {
    t.is(response.problem, NONE)
    t.deepEqual(response.data, { echo: 'hello' })
  })
})

test('UNLINK supports params', t => {
  const x = create({ baseURL: `http://localhost:${port}` })
  return x.unlink('/echo', { q: 'hello' }).then(response => {
    t.is(response.problem, NONE)
    t.deepEqual(response.data, { echo: 'hello' })
  })
})

test('Empty params are supported', t => {
  const x = create({ baseURL: `http://localhost:${port}` })
  return x.get('/echo', {}).then(response => {
    t.is(response.problem, NONE)
    t.deepEqual(response.data, { echo: '' })
  })
})

test('Null params are supported', t => {
  const x = create({ baseURL: `http://localhost:${port}` })
  return x.get('/echo', null).then(response => {
    t.is(response.problem, NONE)
    t.deepEqual(response.data, { echo: '' })
  })
})

test('Undefined params are supported', t => {
  const x = create({ baseURL: `http://localhost:${port}` })
  return x.get('/echo').then(response => {
    t.is(response.problem, NONE)
    t.deepEqual(response.data, { echo: '' })
  })
})

test('Null parameters should be null', t => {
  const x = create({ baseURL: `http://localhost:${port}` })
  return x.get('/echo', { q: null }).then(response => {
    t.is(response.problem, NONE)
    t.deepEqual(response.data, { echo: '' })
  })
})

test('Empty parameters should be empty', t => {
  const x = create({ baseURL: `http://localhost:${port}` })
  return x.get('/echo', { q: '' }).then(response => {
    t.is(response.problem, NONE)
    t.deepEqual(response.data, { echo: '' })
  })
})
