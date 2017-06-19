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

* low-fat wrapper for the amazing `axios` http client library
* all responses follow the same flow: success and failure alike
* responses have a `problem` property to help guide exception flow
* attach functions that get called each request
* attach functions that change all request or response data
* detects connection issues

# Installing

`npm i apisauce --save`

* Depends on `axios@^0.16.1`.
* Targets ES5.
* Built with ES6.
* Supported in Node and the browser(s).


# Quick Start

```js
// showLastCommitMessageForThisLibrary.js
import {create} from 'apisauce'

// define the api
const api = create({
  baseURL: 'https://api.github.com',
  headers: {'Accept': 'application/vnd.github.v3+json'}
})

// start making calls
api
  .get('/repos/skellock/apisauce/commits')
  .then((response) => response.data[0].commit.message)
  .then(console.log)

// customizing headers per-request
api.post('/users', {name: 'steve'}, {headers: {'x-gigawatts': '1.21'}})

```

See the examples folder for more code.

# Documentation

## Create an API

You create an api by calling `.create()` and passing in a configuration object.

```js
const api = create({baseURL: 'https://api.github.com'})
```

The only required property is `baseURL` and it should be the starting point for
your API.  It can contain a sub-path and a port as well.

```js
const api = create({baseURL: 'https://example.com/api/v3'})
```

HTTP request headers for all requests can be included as well.

```js
const api = create({
  baseURL: '...',
  headers: {
    'X-API-KEY': '123',
    'X-MARKS-THE-SPOT': 'yarrrrr'
  }
})
```

Default timeouts can be applied too:

```js
const api = create({baseURL: '...', timeout: 30000}) // 30 seconds
```

## Calling The API

With your fresh `api`, you can now call it like this:

```js
api.get('/repos/skellock/apisauce/commits')
api.head('/me')
api.delete('/users/69')
api.post('/todos', {note: 'jump around'}, {headers: {'x-ray': 'machine'}})
api.patch('/servers/1', {live: false})
api.put('/servers/1', {live: true})
api.link('/images/my_dog.jpg', {}, {headers: {Link: '<http://example.com/profiles/joe>; rel="tag"'}})
api.unlink('/images/my_dog.jpg', {}, {headers: {Link: '<http://example.com/profiles/joe>; rel="tag"'}})
```

`get`, `head`, `delete`, `link` and `unlink` accept 3 parameters:

* url - the relative path to the API (required)
* params - Object - query string variables (optional)
* axiosConfig - Object - config passed along to the `axios` request (optional)

`post`, `put`, and `patch` accept 3 different parameters:

* url - the relative path to the API (required)
* data - Object - the object jumping the wire
* axiosConfig - Object - config passed along to the `axios` request (optional)

## Responses

The responses are promise-based, so you you'll need to handle things in a
`.then()` function.

The promised is always resolved with a `response` object.

Even if there was a problem with the request!  This is one of the goals of
this library.  It ensures sane calling code without having to handle `.catch`
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
  'Authorization': 'token',
  'X-Even-More': 'hawtness'
})
```

## Adding Monitors

Monitors are functions you can attach to the API which will be called
when any request is made.  You can use it to do things like:

* check for headers and record values
* determine if you need to trigger other parts of your code
* measure performance of API calls
* perform logging

Monitors are run just before the promise is resolved.  You get an
early sneak peak at what will come back.

You cannot change anything, just look.

Here's a sample monitor:
```js
const naviMonitor = (response) => console.log('hey!  listen! ', response)
api.addMonitor(naviMonitor)
```

Any exceptions that you trigger in your monitor will not affect the flow
of the api request.

```js
api.addMonitor(response => this.kaboom())
```

Internally, each monitor callback is surrounded by an oppressive `try/catch`
block.

Remember.  Safety first!

## Adding Transforms

In addition to monitoring, you can change every request or response globally.

This can be useful if you would like to:

* fix an api response
* add/edit/delete query string variables for all requests
* change outbound headers without changing everywhere in your app

Unlike monitors, exceptions are not swallowed.  They will bring down the stack, so careful!


### Response Transforms

For responses, you're provided an object with these properties.

* `data` - the object originally from the server that you might wanna mess with
* `duration` - the number of milliseconds
* `problem` - the problem code (see the bottom for the list)
* `ok` - true or false
* `status` - the HTTP status code
* `headers` - the HTTP response headers
* `config` - the underlying axios config for the request

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

For requests, you are given a `request` object.  Mutate anything in here to change anything about the request.

The object passed in has these properties:

* `data` - the object being passed up to the server
* `method` - the HTTP verb
* `url` - the url we're hitting
* `headers` - the request headers
* `params` - the request params for `get`, `delete`, `head`, `link`, `unlink`

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
const api = create({baseURL: '...'})
const response = await api.get('/slowest/site/on/the/net')
console.log(response.ok) // yay!
```

# Problem Codes

The `problem` property on responses is filled with the best
guess on where the problem lies.  You can use a switch to
check the problem.  The values are exposed as `CONSTANTS`
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


# Feedback

Bugs?  Comments?  Features?  PRs and Issues happily welcomed!


# Release Notes

### 0.14.0 - June 19, 2017

* [NEW] Bumps Axios to 0.16.2.
* [FIX] Address issue with React Native 0.45.1 and enumerable key warning.
* [BORING] Staring to migrate source to TypeScript because I want to feel normal again.

### 0.13.0 - May 23, 2017

* [NEW] Typescript typings <3. #104 by @dxiao

### 0.12.0 - April 25, 2017

* [NEW] Bumps Axios to 0.16.1. #110 by @skellock
* [NEW] Adds `deleteHeader()`. #95 by @jkeam
* [FIX] Safely reads status code to support mocking environments. #97 by @ashik94vc
* [SUPPORT] Uses `babel-plugin-ramda` for lighter builds. #93 by @DiscoStarslayer
* [SUPPORT] Bumps all dev dependencies. #99 by @skellock
* [SUPPORT] Reformats codebase with `prettier` and `standard --fix`. #98 by @skellock

### 0.11.0 - March 17, 2017

* [NEW] Optimizes dependencies - #76, #79, #84 by @cloud-walker & @skellock
* [BORING] Code formatting, test renaming, and other maintenance.

### 0.10.0 - February 7, 2017

* [NEW] Adds async request transforms. - #31, #54, #56 by @skibz & @skellock
* [NEW] Adds a way to change the base URL of an API. - #55 by @skellock
* [NEW] Upgrades dependencies including an [odd corner case](https://github.com/skellock/ramdasauce/pull/7). - #52 by @skellock

### 0.9.0 - February 7, 2017

* [NOTE] We don't talk about 0.9.0.

### 0.8.0 - January 15, 2017

* [NEW] Adds cancel token support. - #49 by @romanlv

### 0.7.0 - December 2, 2016

* [NEW] Adds support for reassign data in request transforms - #44 and #42 by @mmahalwy and @skellock 
* [NEW] Upgrades to Axios 0.15.3 - #43 by @skellock

### 0.6.0 - November 2, 2016

* [NEW] Adds new HTTP verbs for LINK and UNLINK [@justim](https://github.com/justim) ([#35](https://github.com/skellock/apisauce/pull/35))
* [NEW] Upgrades to Axios 0.15.2 - [@skellock](https://github.com/skellock)

### 0.5.0 - August 28, 2016

* [NEW] Adds more options to addRequestTransform - [@skellock](https://github.com/skellock) ([#28](https://github.com/skellock/apisauce/pull/28))
* [NOTE] Due to how Axios stores headers and our new mutable transforms, I had to move header storage out of Axios and into Apisauce.  This will only affect you if you're talking to the Axios object directly.  I didn't really predict this coming, so heads up if you're talking to the Axios object currently.  It's better to just ask me to change Apisauce to include the missing features.  By the time we get to 1.0, we actually might not even use Axios anymore!  =)


### 0.4.0 - August 17, 2016

* [NEW] Adds transform support for request and response - [@skellock](https://github.com/skellock) ([#26](https://github.com/skellock/apisauce/pull/26))
* [NEW] Upgraded to axios 0.13 and fixed a few API changes to make it transparent - [@skellock](https://github.com/skellock) ([#24](https://github.com/skellock/apisauce/pull/24))
* [FIX] Exposes the config (request) object when the API call fails [@skellock](https://github.com/skellock) ([#25](https://github.com/skellock/apisauce/pull/25))

### 0.3.0 - July 1st, 2016

* [NEW] setHeader and setHeaders for updating HTTP request headers - [@skellock](https://github.com/skellock)

### 0.2.0 - July 1st, 2016

* [NEW] Bumped all dependencies to the latest version.
* [NEW] Network errors and timeouts are now detected on React Native - [@skellock](https://github.com/skellock)

### 0.1.5 - June 1st, 2016

* [FIX] Fixed up the problematic babel references in package.json - [@gantman](https://github.com/gantman)

### 0.1.4 - May 31st, 2016

* [NEW] Bumped all dependencies to latest version.
* [FIX] Repaired dev dependencies. thx [@gabceb](https://github.com/gabceb)

### 0.1.3 - April 18th, 2016

* [FIX] Forgot to run the `dist` script to repackage.  :(  Failsauce.

### 0.1.2 - April 18th, 2016

* [NEW] Added duration (in milliseconds) to the response.

### 0.1.1 - April 10th, 2016

* [NEW] timeout detection

### 0.1.0 - April 10th, 2016

* Initial Release

### TODO

* [ ] Detect network failures on iOS and Android.
