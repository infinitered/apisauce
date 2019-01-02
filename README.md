# Apisauce

```
(Ring ring ring)
< Hello?
> Hi, can I speak to JSON API.
< Speaking.
> Hi, it's me JavaScript.  Look, we need to talk.
< Now is not a good time...
> Wait, I just wanted to say, sorry.
< ...
```

Talking to APIs doesn't have to be awkward anymore.

[![npm module](https://badge.fury.io/js/apisauce.svg)](https://www.npmjs.org/package/apisauce)

# Features

- low-fat wrapper for the amazing `axios` http client library
- all responses follow the same flow: success and failure alike
- responses have a `problem` property to help guide exception flow
- attach functions that get called each request
- attach functions that change all request or response data
- detects connection issues (on React Native)

# Installing

`npm i apisauce --save`

- Depends on `axios@^0.18.0`.
- Targets ES5.
- Built with ES6.
- Supported in Node and the browser(s) and React Native.

# Quick Start

```js
// showLastCommitMessageForThisLibrary.js
import { create } from 'apisauce'

// define the api
const api = create({
  baseURL: 'https://api.github.com',
  headers: { Accept: 'application/vnd.github.v3+json' },
})

// start making calls
api
  .get('/repos/skellock/apisauce/commits')
  .then(response => response.data[0].commit.message)
  .then(console.log)

// customizing headers per-request
api.post('/users', { name: 'steve' }, { headers: { 'x-gigawatts': '1.21' } })
```

See the examples folder for more code.

# Documentation

## Create an API

You create an api by calling `.create()` and passing in a configuration object.

```js
const api = create({ baseURL: 'https://api.github.com' })
```

The only required property is `baseURL` and it should be the starting point for
your API. It can contain a sub-path and a port as well.

```js
const api = create({ baseURL: 'https://example.com/api/v3' })
```

HTTP request headers for all requests can be included as well.

```js
const api = create({
  baseURL: '...',
  headers: {
    'X-API-KEY': '123',
    'X-MARKS-THE-SPOT': 'yarrrrr',
  },
})
```

Default timeouts can be applied too:

```js
const api = create({ baseURL: '...', timeout: 30000 }) // 30 seconds
```

## Calling The API

With your fresh `api`, you can now call it like this:

```js
api.get('/repos/skellock/apisauce/commits')
api.head('/me')
api.delete('/users/69')
api.post('/todos', { note: 'jump around' }, { headers: { 'x-ray': 'machine' } })
api.patch('/servers/1', { live: false })
api.put('/servers/1', { live: true })
api.link('/images/my_dog.jpg', {}, { headers: { Link: '<http://example.com/profiles/joe>; rel="tag"' } })
api.unlink('/images/my_dog.jpg', {}, { headers: { Link: '<http://example.com/profiles/joe>; rel="tag"' } })
```

`get`, `head`, `delete`, `link` and `unlink` accept 3 parameters:

- url - the relative path to the API (required)
- params - Object - query string variables (optional)
- axiosConfig - Object - config passed along to the `axios` request (optional)

`post`, `put`, and `patch` accept 3 different parameters:

- url - the relative path to the API (required)
- data - Object - the object jumping the wire
- axiosConfig - Object - config passed along to the `axios` request (optional)

## Responses

The responses are promise-based, so you'll need to handle things in a
`.then()` function.

The promised is always resolved with a `response` object.

Even if there was a problem with the request! This is one of the goals of
this library. It ensures sane calling code without having to handle `.catch`
and have 2 separate flows.

A response will always have these 2 properties:

```
ok      - Boolean - True is the status code is in the 200's; false otherwise.
problem - String  - One of 6 different values (see below - problem codes)
```

If the request made it to the server and got a response of any kind, response
will also have these properties:

```
data     - Object - this is probably the thing you're after.
status   - Number - the HTTP response code
headers  - Object - the HTTP response headers
config   - Object - the `axios` config object used to make the request
duration - Number - the number of milliseconds it took to run this request
```

Sometimes on different platforms you need access to the original axios error
that was thrown:

```
originalError - Error - the error that axios threw in case you need more info
```

## Changing Base URL

You can change the URL your api is connecting to.

```js
api.setBaseURL('https://some.other.place.com/api/v100')
console.log(`omg i am now at ${api.getBaseURL()}`)
```

## Changing Headers

Once you've created your api, you're able to change HTTP requests by
calling `setHeader` or `setHeaders` on the api. These stay with the api instance, so you can just set ['em and forget 'em](https://gitter.im/infinitered/ignite?at=582e57563f3946057acd2f84).

```js
api.setHeader('Authorization', 'the new token goes here')
api.setHeaders({
  Authorization: 'token',
  'X-Even-More': 'hawtness',
})
```

## Adding Monitors

Monitors are functions you can attach to the API which will be called
when any request is made. You can use it to do things like:

- check for headers and record values
- determine if you need to trigger other parts of your code
- measure performance of API calls
- perform logging

Monitors are run just before the promise is resolved. You get an
early sneak peak at what will come back.

You cannot change anything, just look.

Here's a sample monitor:

```js
const naviMonitor = response => console.log('hey!  listen! ', response)
api.addMonitor(naviMonitor)
```

Any exceptions that you trigger in your monitor will not affect the flow
of the api request.

```js
api.addMonitor(response => this.kaboom())
```

Internally, each monitor callback is surrounded by an oppressive `try/catch`
block.

Remember. Safety first!

## Adding Transforms

In addition to monitoring, you can change every request or response globally.

This can be useful if you would like to:

- fix an api response
- add/edit/delete query string variables for all requests
- change outbound headers without changing everywhere in your app

Unlike monitors, exceptions are not swallowed. They will bring down the stack, so careful!

### Response Transforms

For responses, you're provided an object with these properties.

- `data` - the object originally from the server that you might wanna mess with
- `duration` - the number of milliseconds
- `problem` - the problem code (see the bottom for the list)
- `ok` - true or false
- `status` - the HTTP status code
- `headers` - the HTTP response headers
- `config` - the underlying axios config for the request

Data is the only option changeable.

```js
api.addResponseTransform(response => {
  const badluck = Math.floor(Math.random() * 10) === 0
  if (badluck) {
    // just mutate the data to what you want.
    response.data.doorsOpen = false
    response.data.message = 'I cannot let you do that.'
  }
})
```

### Request Transforms

For requests, you are given a `request` object. Mutate anything in here to change anything about the request.

The object passed in has these properties:

- `data` - the object being passed up to the server
- `method` - the HTTP verb
- `url` - the url we're hitting
- `headers` - the request headers
- `params` - the request params for `get`, `delete`, `head`, `link`, `unlink`

Request transforms can be a function:

```js
api.addRequestTransform(request => {
  request.headers['X-Request-Transform'] = 'Changing Stuff!'
  request.params['page'] = 42
  delete request.params.secure
  request.url = request.url.replace(/\/v1\//, '/v2/')
  if (request.data.password && request.data.password === 'password') {
    request.data.username = `${request.data.username} is secure!`
  }
})
```

And you can also add an async version for use with Promises or `async/await`. When you resolve
your promise, ensure you pass the request along.

```js
api.addAsyncRequestTransform(request => {
  return new Promise(resolve => setTimeout(resolve, 2000))
})
```

```js
api.addAsyncRequestTransform(request => async () => {
  await AsyncStorage.load('something')
})
```

This is great if you need to fetch an API key from storage for example.

Multiple async transforms will be run one at a time in succession, not parallel.

# Using Async/Await

If you're more of a `stage-0` kinda person, you can use it like this:

```js
const api = create({ baseURL: '...' })
const response = await api.get('/slowest/site/on/the/net')
console.log(response.ok) // yay!
```

# Problem Codes

The `problem` property on responses is filled with the best
guess on where the problem lies. You can use a switch to
check the problem. The values are exposed as `CONSTANTS`
hanging on your built API.

```
Constant        VALUE               Status Code   Explanation
----------------------------------------------------------------------------------------
NONE             null               200-299       No problems.
CLIENT_ERROR     'CLIENT_ERROR'     400-499       Any non-specific 400 series error.
SERVER_ERROR     'SERVER_ERROR'     500-599       Any 500 series error.
TIMEOUT_ERROR    'TIMEOUT_ERROR'    ---           Server didn't respond in time.
CONNECTION_ERROR 'CONNECTION_ERROR' ---           Server not available, bad dns.
NETWORK_ERROR    'NETWORK_ERROR'    ---           Network not available.
CANCEL_ERROR     'CANCEL_ERROR'     ---           Request has been cancelled. Only possible if `cancelToken` is provided in config, see axios `Cancellation`.
```

Which problem is chosen will be picked by walking down the list.

# Contributing

Bugs? Comments? Features? PRs and Issues happily welcomed! Make sure to check out our [contributing guide](./github/CONTRIBUTING.md) to get started!
