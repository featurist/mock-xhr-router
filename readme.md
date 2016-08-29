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

## stop

Stops all requests, any pending requests are cancelled. Useful in unit testing teardown.

```js
mockXhrRouter.stop();
```

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
  * `query` - an object containing the parameters taken from the query string
    * *NOTE* versions 1.6 and earlier stored query parameters in the params object
  * `headers` - an object with the request headers. Headers are all normalised to lower case, so `Content-Type` becomes `content-type`.
  * `body` - body. if this was transmitted as JSON then this is parsed into a JS value.
* `response` - an object containing the following fields.
  * `statusCode` - the status code, if omitted then `200`.
  * `headers` - an object with the response headers. Optional.
  * `body` - the body, if a JS object, then it is transmitted as JSON. Optional.

The response can be omitted too, giving a `200 OK`.

If there is an exception, or the handler returns a promise that is rejected, then it will return a 500 and a description of the error in JSON.

## XHR mock adapters

By default mock-xhr-router will use [faux-jax](https://github.com/algolia/faux-jax), but you can use other ones too. There are two shipped with the package:

* `mockXhrRouter.fauxjax` [faux-jax](https://github.com/algolia/faux-jax), the **default**.
* `mockXhrRouter.fakeXhr` [fake-xml-http-request](https://github.com/pretenderjs/FakeXMLHttpRequest)

To use them, set the `.xhr` to the one you want:

```js
var mockXhrRouter = require('mock-xhr-router');
mockXhrRouter.xhr = mockXhrRouter.fakeXhr;
```

To write your own, write an object that contains two methods, `start` and `stop`.

```js
var myXhr = {
  start() {
    // this will be called by mock-xhr-router when starting a new router
  },

  stop() {
    // this will be called by mock-xhr-router when stopping the router
  }
}
```

mock-xhr-router will set a `onrequest` function on that object, and should be called when a XHR request comes in, mock-xhr-router will return a promise with the response in it. The request and response objects are the same as passed to the handlers, minus the params, see above.

```js
myXhr.onrequest(request) -> Promise
```

## logging

You can get [debug](https://github.com/visionmedia/debug) output like this:

```js
window._debug = require('debug');
```

Then in your browser console:

```js
_debug.enable('mock-xhr-router');
```
