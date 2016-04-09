import test from 'ava'
import apisauce from '../lib/apisauce'

test('has a a create function', (t) => {
  t.ok(apisauce.create)
  t.ok(apisauce.create())
})
