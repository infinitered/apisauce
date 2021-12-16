const apisauce = require('../dist/apisauce.js')

const REPO = 'infinitered/apisauce'

const api = apisauce.create({
  baseURL: 'https://api.github.com',
  headers: {
    Accept: 'application/vnd.github.v3+json',
  },
})

// attach a monitor that fires with each request
api.addMonitor(response => {
  const info = `Calls remaining this hour: ${response.headers['x-ratelimit-remaining']}`
  console.log(info)
})

// show the latest commit message
api.get(`/repos/${REPO}/commits`).then(response => {
  const info = `Latest Commit: ${response.data[0].commit.message}`
  console.log(info)
})

// call a non-existant API to show that the flow is identical!
api.post('/something/bad').then(({ ok, status, problem }) => {
  console.log({ ok, status, problem })
})
