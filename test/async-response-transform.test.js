import test from 'ava'
import { create } from '../lib/apisauce'
import R from 'ramda'
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

test('attaches a async response transform', t => {
  const api = create({ baseURL: `http://localhost:${port}` })

  console.log(api.asyncResponseTransforms)
  t.truthy(api.addAsyncResponseTransform)
  t.truthy(api.asyncResponseTransforms)
  t.is(api.asyncResponseTransforms.length, 0)
  api.addAsyncResponseTransform(R.identity)
  t.is(api.asyncResponseTransforms.length, 1)
})

test('alters the response', t => {
  const x = create({ baseURL: `http://localhost:${port}` })
  let count = 0
  x.addAsyncResponseTransform(({ data }) => {
    return new Promise((resolve, reject) => {
      setImmediate(_ => {
        count++
        data.a = 'hi'
        resolve(data)
      })
    })    
  })
  t.is(count, 0)
  return x.get('/number/201').then(response => {
    t.is(response.status, 201)
    t.is(count, 1)
    t.deepEqual(response.data.a, 'hi')
  })
})

test('swap out data on response', t => {
  const x = create({ baseURL: `http://localhost:${port}` })
  let count = 0
  x.addAsyncResponseTransform(response => {
    return new Promise((resolve, reject) => {
      setImmediate(_ => {
        count++
        response.status = 222
        response.data = { a: R.reverse(response.data.a.b) }
        resolve(response)
      })
    })
  })
  // t.is(count, 0)
  return x.get('/number/201').then(response => {
    t.is(response.status, 222)
    t.is(count, 1)
    t.deepEqual(response.data.a, [3, 2, 1])
  })
})
