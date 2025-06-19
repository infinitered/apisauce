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

test('has valid data with a 200', async () => {
  const x = create({ baseURL: `http://localhost:${port}` })
  const response = await x.get('/number/200', { a: 'b' })
  expect(response.status).toBe(200)
  expect(response.data).toEqual(MOCK)
})

test('has valid data with a 400s', async () => {
  const x = create({ baseURL: `http://localhost:${port}` })
  const response = await x.get('/number/404')
  expect(response.status).toBe(404)
  expect(response.data).toEqual(MOCK)
})

test('has valid data with a 500s', async () => {
  const x = create({ baseURL: `http://localhost:${port}` })
  const response = await x.get('/number/500')
  expect(response.status).toBe(500)
  expect(response.data).toEqual(MOCK)
})

test('Falsy data is preserved', t => {
  const x = create({ baseURL: `http://localhost:${port}` })
  return x.get('/falsy').then(response => {
    t.is(response.data, false)
  })
})
