import test from 'ava'
import { CancelToken, isCancel, create, CANCEL_ERROR } from '../lib/apisauce'
import createServer from './_server'
import getFreePort from './_getFreePort'

let port
let server = null
test.before(async t => {
  port = await getFreePort()
  server = await createServer(port)
})

test.after('cleanup', t => {
  server.close()
})

test('cancel request', t => {
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
    t.truthy(isCancel(response.originalError))
    t.falsy(response.ok)
    t.is(response.problem, CANCEL_ERROR)
  })
})
