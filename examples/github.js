import apisauce from '../lib/apisauce'
import R from 'ramda'

const REPO = 'skellock/apisauce'

const api = apisauce.create({
  baseURL: 'https://api.github.com',
  headers: {
    'Accept': 'application/vnd.github.v3+json'
  }
})

api
  .get(`/repos/${REPO}/commits`)
  .then(R.path(['data', 0, 'commit', 'message']))
  .then(R.concat('Latest Commit: '))
  .then(console.log)
