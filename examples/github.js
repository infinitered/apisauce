import apisauce from '../lib/apisauce'
import R from 'ramda'
import RS from 'ramdasauce'

const REPO = 'skellock/apisauce'

const api = apisauce.create({
  baseURL: 'https://api.github.com',
  headers: {
    'Accept': 'application/vnd.github.v3+json'
  }
})

api
  .get(`/repos/${REPO}/commits`)
  .then(RS.dotPath('data.0.commit.message'))
  .then(R.concat('Latest Commit: '))
  .then(console.log)

api
  .get('/rate_limit')
  .then(RS.dotPath('data.rate.remaining'))
  .then(console.log)

api
  .post('/something/bad')
  .then(R.props(['ok', 'status', 'problem']))
  .then(console.log)
