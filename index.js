var debug = require('debug')('mock-xhr-router');
var fauxjax = require('faux-jax');

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
    hash[vars[n]] = routeMatch[n + 1];
  }

  var queryString = routeMatch[vars.length + 2];

  if (queryString) {
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

  fauxjax.on('request', function (fauxRequest) {
    var route = findFirst(self.routes, function (route) {
      return fauxRequest.requestURL.match(routeRegExp(route.url)) && fauxRequest.requestMethod.toLowerCase() === route.method;
    });

    if (route) {
      var request = {
        headers: fauxRequest.requestHeaders,
        body: fauxRequest.requestBody,
        method: fauxRequest.requestMethod,
        url: fauxRequest.requestURL,
        params: params(route.url, fauxRequest.requestURL)
      };
      buildRequest(request);
      debug('request', request);

      function respond(response) {
        buildResponse(response);
        debug('response', response);

        fauxRequest.respond(
          response.statusCode,
          response.headers,
          serialiseResponseBody(response)
        );
      }

      function respondWithError(error) {
        respond({
          statusCode: 500,
          body: { message: error.message, stack: error.stack }
        });
      }

      var response, haveResponse;
      try {
        response = route.handler(request) || {};
        haveResponse = true;
      } catch (error) {
        respondWithError(error);
      }

      if (haveResponse) {
        if (response && typeof response.then == 'function') {
          response.then(respond, respondWithError);
        } else {
          respond(response);
        }
      }
    } else {
      fauxRequest.respond(
        404,
        {'Content-Type': 'text/plain'},
        'route not found: ' + fauxRequest.requestMethod + ' ' + fauxRequest.requestURL
      );
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

function buildRequest(request) {
  if (isJsonMimeType(request.headers['Content-Type'])) {
    request.body = JSON.parse(request.body);
  }
}

function serialiseResponseBody(response) {
  if (isJsonMimeType(response.headers['Content-Type'])) {
    return JSON.stringify(response.body, null, 2);
  } else {
    return response.body;
  }
}

function buildResponse(response) {
  if (!response.statusCode) {
    response.statusCode = 200;
  }
  if (!response.headers) {
    response.headers = {};
  }

  if (response.body && response.body instanceof Object) {
    response.headers['Content-Type'] = 'application/json; charset=UTF-8';
  }
}

var installed = false;

Router.stop = function () {
  fauxjax.restore();
  installed = false;
};

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
    fauxjax.install();
    installed = true;
  } else {
    fauxjax.restore();
    fauxjax.install();
  }
  return router();
};

module.exports.stop = function () {
  fauxjax.restore();
};
