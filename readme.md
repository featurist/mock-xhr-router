# mock-xhr-router

```bash
npm install mock-xhr-router
```

Build a mock API to use in your browser tests:

```js
var mockXhrRouter = require('mock-xhr-router');

var router = mockXhrRouter();

var users = {};
var lastUserId = -1;

router.get('/users/:userId', function(request) {
  var user = users[request.params.userId];

  return {
    body: user
  };
});

router.post('/users', function(request) {
  var user = request.body;
  user.id = lastUserId++;

  users[user.id] = user;

  return {
    statusCode: 201,
    headers: {
      location: '/users/' + user.id
    },
    body: user
  };
});
```

Use it with jquery:

```js
var $ = require('jquery');

$.get('/users/1').then(function (user) {
  console.log(user);
});
```

# api

```js
var mockXhrRouter = require('mock-xhr-router');
var router = mockXhrRouter();

router.get(path, handler);
router.delete(path, handler);
router.head(path, handler);
router.post(path, handler);
router.put(path, handler);
router.head(path, handler);
```

* `path` - a path for the resource, usually a root relative path like `/api/users`, but could also be an absolute URL. Can contain parameters, in the form of `:paramName`, e.g. `/users/:userId`.

## handlers

```js
function handler(request) {
  return response;
}
```

```js
function handler(request) {
  return new Promise(function (fulfil) {
    fulfil(response);
  });
}
```

* `request` - an object containing:
  * `method` - the method, one of `GET`, `POST`, etc.
  * `url` - the url of the resource
  * `params` - an object containing the parameters taken from the `path`
  * `headers` - an object with the request headers
  * `body` - body. if this was transmitted as JSON then this is parsed into a JS value.
* `response` - an object containing the following fields.
  * `statusCode` - the status code, if omitted then `200`.
  * `headers` - an object with the response headers. Optional.
  * `body` - the body, if a JS object, then it is transmitted as JSON. Optional.

The response can be omitted too, giving a `200 OK`.

If there is an exception, or the handler returns a promise that is rejected, then it will return a 500 and a description of the error in JSON.

## logging

You can get [debug](https://github.com/visionmedia/debug) output like this:

```js
window._debug = require('debug');
```

Then in your browser console:

```js
_debug.enable('mock-xhr-router');
```
