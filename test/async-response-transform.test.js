import { create } from '../lib/apisauce'
import createServer from './_server'
import getFreePort from './_getFreePort'

const MOCK = { a: { b: [1, 2, 3] } }
let port
let server = null
beforeAll(async () => {
  port = await getFreePort()
  server = await createServer(port, MOCK)
})

afterAll(() => {
  server.close()
})

test('attaches a async response transform', () => {
  const api = create({ baseURL: `http://localhost:${port}` })

  console.log(api.asyncResponseTransforms)
  expect(api.addAsyncResponseTransform).toBeTruthy()
  expect(api.asyncResponseTransforms).toBeTruthy()
  expect(api.asyncResponseTransforms.length).toBe(0)
  api.addAsyncResponseTransform(data => data)
  expect(api.asyncResponseTransforms.length).toBe(1)
})

test('alters the response', async () => {
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
  expect(count).toBe(0)
  const response = await x.get('/number/201')
  expect(response.status).toBe(201)
  expect(count).toBe(1)
  expect(response.data.a).toEqual('hi')
})

test('swap out data on response', async () => {
  const x = create({ baseURL: `http://localhost:${port}` })
  let count = 0
  x.addAsyncResponseTransform(response => {
    return new Promise((resolve, reject) => {
      setImmediate(_ => {
        count++
        response.status = 222
        response.data = { a: response.data.a.b.reverse() }
        resolve(response)
      })
    })
  })
  const response = await x.get('/number/201')
  expect(response.status).toBe(222)
  expect(count).toBe(1)
  expect(response.data.a).toEqual([3, 2, 1])
})
