import test from 'ava'
import {create, CONNECTION_ERROR} from '../lib/apisauce'
import getFreePort from '../support/getFreePort'

let port
test.before(async t => {
  port = await getFreePort()
})

test('has a response despite no server', (t) => {
  const x = create({ baseURL: `http://localhost:${port}` })
  return x.get('/number/200', {a: 'b'}).then((response) => {
    t.is(response.status, null)
    t.is(response.problem, CONNECTION_ERROR)
  })
})
