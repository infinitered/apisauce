import { create } from '../lib/apisauce'
import createServer from './_server'
import getFreePort from './_getFreePort'

let port
let server = null
const MOCK = { a: { b: [1, 2, 3] } }
beforeAll(async () => {
  port = await getFreePort()
  server = await createServer(port, MOCK)
})

afterAll(() => {
  server.close()
})

test('can be used with async/await', async () => {
  const x = create({ baseURL: `http://localhost:${port}` })
  const response = await x.get('/number/200', { a: 'b' })
  expect(response.status).toBe(200)
  expect(response.data).toEqual(MOCK)
})
