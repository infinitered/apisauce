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
* Supported in Node and the browser(s).


# Usage

```js
import apisauce from 'apisauce'

const api = apisauce.create({
  baseURL: 'https://api.github.com',
  timeout: 10000,
  headers: {'Accept': 'application/vnd.github.v3+json'}
})

api.get('/repos/skellock/apisauce/commits').then(console.log)
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
```

Which problem is chosen will be picked by walking down the list.

# Feedback

Bugs?  Comments?  Features?  Bitcoins?  PRs and Issues happily welcomed!

# Release Notes

### 0.1.0 - April 10th, 2016

* Initial Release

### TODO

[ ] Detect network failures on iOS and Android.
[ ] Pass through axios options like timeout & headers per request
[ ] Provide callbacks at the api level
[ ] Expose the progress upload event
