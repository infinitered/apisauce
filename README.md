# Apisauce

The API fresh maker.

[![npm module](https://badge.fury.io/js/apisauce.svg)](https://www.npmjs.org/package/apisauce)

# Features

* start the awesome `axios` library
* ensures promises are always resolved (that's right, i said it)
* generates functions that map to your APIs
* simplifies server responses & error checking
* doesn't trap `axios`'s power if you need it

# Installing

`npm i apisauce --save`

* Depends on `ramdasauce 1.0.0+`
* Depends on `axios 0.9.1+`.
* Targets ES5.
* Built with ES6.

# Fast Track

```js
import {build} from 'apisauce'
import RS from 'ramdasauce'

build.get('/find/:city', {}, ['city'])
const getCity = build.get('/find/:city')
})


const weather = build.api({
  base: 'http://openweathermap.org/data/2.1',
  api: {
    getPortland: build.get('/find/name', {q: 'Portland'}),
    getSanFrancisco: build.get('/find/name', {q: 'San Francisco'}),

    getCity: (city) => build.get('/find/name', {q: city}),
  }
})

weather
  .getCity({q: 'San Francisco'})
  .then(({ok, data, problem}) => {
    if (ok) {

    } else {
      console.log('Figures. ')
    }
    const kelvin =
  })

```

# Usage

```js
import api from 'apisauce'

// --- Build our API  ---
const github = api.build({
  // required base URL to be prepend to every call
  base: 'https://api.github.com',

  // optional timeout (defaults to 0 -- no timeout)
  timeout: 10000,

  // optional headers applied to every request
  headers: {
    'Accept': 'application/vnd.github.v3+json',
    'Authorization': 'token YOUR-OAUTH-TOKEN-HERE'
  },

  // required api definitions. (example usage at the bottom)
  api: {
    // simple example
    feeds: {GET: '/feeds'},

    // alternative HTTP verbs
    mutiny:      {DELETE: '/orgs/infinitered/members/kemiller'},
    justKidding: {PUT:    '/orgs/infinitered/memberships/kemiller'},
    orAmI:       {DELETE: '/orgs/infinitered/members/kemiller'},
    updateUser:  {PATCH:  '/user'},

    mutiny: (victim) => ({DELETE: '/orgs/infinitered/members/kemiller'}),

    // path placeholders
    userRepos:  {
      GET: '/users/:user/repos'
    },

    // multiple path placeholders
    collaborators: {
      GET: '/repos/:owner/:repo/collaborators',
    },

    // default query string parameters
    popularRepos: {
      GET: '/search/repositories',
      params: {sort: 'stars', order: 'desc'}
    }

  }
})

// make a call and log the result
github
  .collaborators('skellock', 'apisauce')
  .then((response) => {
    console.log('ok=', response.ok)            // are we good?
    console.log('problem=', response.problem)  // did we have a problem?
    console.log('data=', response.data)        // show the data if any
    console.log('headers=', response.headers)  // show the response headers
  })

// make a call and check for success
github
  .collaborators('skellock', 'apisauce')
  .then((response) => {
  })
```

# Problem Codes

The `problem` property on responses is filled with the best
guess on where the problem lies.  You can use a switch to
check the problem.  The values are exposed as `CONSTANTS`
hanging on your built API.

```
Constant        VALUE             Status Code   Explanation
----------------------------------------------------------------------------------------
NONE            null              200-299       No problems.
CLIENT_ERROR    'CLIENT_ERROR'    400-499       Any non-specific 400 series error.
SERVER_ERROR    'SERVER_ERROR'    500-599       Any 500 series error.
TIMEOUT_ERROR   'TIMEOUT_ERROR'   ---           Server didn't respond in time.
NETWORK_ERROR   'NETWORK_ERROR'   ---           Couldn't even get to the server!
```

Which problem is chosen will be picked by walking down the list.

# Feedback

Bugs?  Comments?  Features?  Bitcoins?  PRs and Issues happily welcomed!

# Release Notes

### 1.0.0 - April 10th, 2016

* Initial Release
