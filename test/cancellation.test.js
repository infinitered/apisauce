import { CancelToken, isCancel, create, CANCEL_ERROR } from '../lib/apisauce'
import createServer from './_server'
import getFreePort from './_getFreePort'

let port
let server = null
beforeAll(async () => {
  port = await getFreePort()
  server = await createServer(port)
})

afterAll(() => {
  server.close()
})

test('cancel request', () => {
  const source = CancelToken.source()
  const x = create({
    baseURL: `http://localhost:${port}`,
    cancelToken: source.token,
    timeout: 200,
  })
  setTimeout(() => {
    source.cancel()
  }, 20)

  return x.get('/sleep/150').then(response => {
    expect(isCancel(response.originalError)).toBeTruthy()
    expect(response.ok).toBeFalsy()
    expect(response.problem).toBe(CANCEL_ERROR)
  })
})
