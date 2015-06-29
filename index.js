var debug = require('debug')('mock-xhr-router');
var fauxjax = require('faux-jax');

function route(r) {
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
  var routeMatch = route(pattern).exec(url);
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
}

["get", "delete", "head", "post", "put", "patch"].forEach(function(method) {
  Router.prototype[method] = function(url, handleRoute) {
    return fauxjax.on('request', function(request) {
      if (request.requestURL.match(route(url)) && request.requestMethod.toLowerCase() === method) {
        debug('request', request);
        var response = handleRoute({
          headers: request.requestHeaders,
          body: JSON.parse(request.requestBody),
          method: request.requestMethod,
          url: request.requestURL,
          params: params(url, request.requestURL)
        }) || {};
        debug('response', response);

        var headers = response.headers || {};
        var body;

        if (response.body && response.body instanceof Object) {
          headers['Content-Type'] = 'application/json; charset=utf-8';
          body = JSON.stringify(response.body);
        } else {
          body = response.body;
        }

        request.respond(response.statusCode || 200, headers, body);
      }
    });
  };
});

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
