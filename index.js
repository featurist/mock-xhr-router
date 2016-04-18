var debug = require('debug')('mock-xhr-router');
var mock = require('xhr-mock');

function routeRegExp(r) {
  return new RegExp("^" + r.replace(/:[a-z0-0]+/gi, "([^/?]*)") + "(\\?(.*))?$");
}

function params(pattern, url) {
  var re = /:([a-z0-9]+)/gi;
  var m = void 0;
  var vars = [];

  function matches() {
    m = re.exec(pattern);
    if (m) {
      vars.push(m[1]);
      return matches();
    }
  }

  matches();
  var routeMatch = routeRegExp(pattern).exec(url);
  var hash = {};

  for (var n = 0; n < vars.length; ++n) {
    hash[vars[n]] = decodeURIComponent(routeMatch[n + 1]);
  }

  return hash;
};

function query(url){
  var hasQueryString = url.indexOf('?');
  var hash = {};
  if (hasQueryString) {
    var queryString = url.substring(url.indexOf('?')+1);

    queryString.split(/&/).forEach(function(param) {
      var paramNameValue = param.split(/=/);
      var name = paramNameValue[0];
      var value = decodeURIComponent(paramNameValue[1]);
      hash[name] = value;
    });
  }
  return hash;
};

function Router() {
  this.routes = [];

  var self = this;

  mock.mock(function (req, res) {
    var requestVersion = version;

    var route = findFirst(self.routes, function (route) {
      return req.url().match(routeRegExp(route.url)) && req.method().toLowerCase() === route.method;
    });

    if (route) {
      var request = {
        headers: req.headers(),
        body: req.body(),
        method: req.method(),
        url: req.url(),
        params: params(route.url, req.url()),
        query: query(req.url())
      };
      buildRequest(request);

      function respond(response) {
        if (requestVersion == version) {
          buildResponse(response);
          debug(request.method.toUpperCase() + ' ' + request.url + ' => ' + response.statusCode, request, response);

          return res
            .status(response.statusCode)
            .headers(response.headers)
            .body(serialiseResponseBody(response));
        }
      }

      function respondWithError(error) {
        return respond({
          statusCode: 500,
          body: { message: error.message, stack: error.stack }
        });
      }

      var response, haveResponse;
      try {
        response = route.handler(request) || {};
        haveResponse = true;
      } catch (error) {
        return respondWithError(error);
      }

      if (haveResponse) {
        if (response && typeof response.then == 'function') {
          return response.then(respond, respondWithError);
        } else {
          return respond(response);
        }
      }
    } else {
      return res
        .status(404)
        .header('Content-Type', 'text/plain')
        .body('route not found: ' + req.method()+ ' ' + req.url());
    }
  });
}

function findFirst(array, filter) {
  for(var n = 0; n < array.length; n++) {
    var item = array[n];
    if (filter(item)) {
      return item;
    }
  }
}

["get", "delete", "head", "post", "put", "patch"].forEach(function(method) {
  Router.prototype[method] = function(url, handler) {
    this.routes.push({url: url, handler: handler, method: method});
  };
});

function isJsonMimeType(mimeType) {
  return /^application\/json($|\b)/.test(mimeType);
}

function normaliseHeaders(headers) {
  var lowHeaders = {};

  var headerNames = Object.keys(headers);
  for (var n = 0; n < headerNames.length; n++) {
    var name = headerNames[n];
    lowHeaders[name.toLowerCase()] = headers[name];
  }

  return lowHeaders;
}

function buildRequest(request) {
  request.headers = normaliseHeaders(request.headers);
  if (isJsonMimeType(request.headers['content-type'])) {
    request.body = JSON.parse(request.body);
  }
}

function serialiseResponseBody(response) {
  if (isJsonMimeType(response.headers['content-type'])) {
    return JSON.stringify(response.body, null, 2);
  } else {
    var body = response.body;

    return body == undefined? '': body;
  }
}

function buildResponse(response) {
  if (!response.statusCode) {
    response.statusCode = 200;
  }
  if (!response.headers) {
    response.headers = {};
  } else {
    response.headers = normaliseHeaders(response.headers);
  }

  if (response.body && response.body instanceof Object) {
    response.headers['content-type'] = 'application/json; charset=UTF-8';
  }
}

var installed = false;

function teardown() {
  version++;
  mock.teardown();
}

var version = 0;

function install() {
  mock.setup();
}

function stop() {
  if (installed) {
    teardown();
  }
  installed = false;
}

function router() {
  return new Router();
}

function extend(object, extension) {
  Object.keys(extension).forEach(function (key) {
    if (extension[key] !== undefined) {
      object[key] = extension[key];
    }
  });

  return object;
}

module.exports = function(options) {
  if (!installed) {
    install();
    installed = true;
  } else {
    teardown();
    install();
  }
  return router();
};

module.exports.stop = stop;
