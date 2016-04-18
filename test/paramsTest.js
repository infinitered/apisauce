import test from 'ava'
import {create, NONE} from '../lib/apisauce'
import createServer from '../support/server'

const PORT = 9194
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

test('GET supports params', (t) => {
  const x = create(validConfig)
  return x.get('/echo', {q: 'hello'}).then((response) => {
    t.is(response.problem, NONE)
    t.deepEqual(response.data, {echo: 'hello'})
  })
})

test('POST supports params', (t) => {
  const x = create(validConfig)
  return x.post('/echo', null, {params: {q: 'hello'}}).then((response) => {
    t.is(response.problem, NONE)
    t.deepEqual(response.data, {echo: 'hello'})
  })
})

test('PATCH supports params', (t) => {
  const x = create(validConfig)
  return x.patch('/echo', null, {params: {q: 'hello'}}).then((response) => {
    t.is(response.problem, NONE)
    t.deepEqual(response.data, {echo: 'hello'})
  })
})

test('PUT supports params', (t) => {
  const x = create(validConfig)
  return x.put('/echo', null, {params: {q: 'hello'}}).then((response) => {
    t.is(response.problem, NONE)
    t.deepEqual(response.data, {echo: 'hello'})
  })
})

test('DELETE supports params', (t) => {
  const x = create(validConfig)
  return x.delete('/echo', {q: 'hello'}).then((response) => {
    t.is(response.problem, NONE)
    t.deepEqual(response.data, {echo: 'hello'})
  })
})

test('Empty params are supported', (t) => {
  const x = create(validConfig)
  return x.get('/echo', {}).then((response) => {
    t.is(response.problem, NONE)
    t.deepEqual(response.data, {echo: ''})
  })
})

test('Null params are supported', (t) => {
  const x = create(validConfig)
  return x.get('/echo', null).then((response) => {
    t.is(response.problem, NONE)
    t.deepEqual(response.data, {echo: ''})
  })
})

test('Undefined params are supported', (t) => {
  const x = create(validConfig)
  return x.get('/echo').then((response) => {
    t.is(response.problem, NONE)
    t.deepEqual(response.data, {echo: ''})
  })
})
