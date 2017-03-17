import apisauce from '../lib/apisauce'
import R from 'ramda'
import RS from 'ramdasauce'

const REPO = 'skellock/apisauce'

const api = apisauce.create({
  baseURL: 'https://api.github.com',
  headers: {
    Accept: 'application/vnd.github.v3+json'
  }
})

// attach a monitor that fires with each request
api.addMonitor(
  R.pipe(
    RS.dotPath('headers.x-ratelimit-remaining'),
    R.concat('Calls remaining this hour: '),
    console.log
  )
)

// show the latest commit message
api
  .get(`/repos/${REPO}/commits`)
  .then(RS.dotPath('data.0.commit.message'))
  .then(R.concat('Latest Commit: '))
  .then(console.log)

// call a non-existant API to show that the flow is identical!
api
  .post('/something/bad')
  .then(R.props(['ok', 'status', 'problem']))
  .then(console.log)
