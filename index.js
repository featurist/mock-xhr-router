var prototype = require('prote');
if (!window.$) {
  window.jQuery = window.$ = require('jquery');
}
require('jquery-mockjax');

$.mockjaxSettings.responseTime = 0;
$.mockjaxSettings.logging = false;

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

var routerPrototype = {};

["get", "delete", "head", "post", "put", "patch"].forEach(function(method) {
  routerPrototype[method] = function(url, fn) {
    return $.mockjax(function(settings) {
      if (settings.url.match(route(url)) && settings.type.toLowerCase() === method) {
        return {
          response: function(settings) {
            var isJson =
              settings.data !== undefined
              && (settings.dataType === "json"
                  || settings.contentType.match(/^application\/json\b/));

            var requestBody =
              isJson
                ? JSON.parse(settings.data)
                : settings.data

            var response = fn({
              headers: settings.headers || [],
              body: requestBody,
              method: settings.type,
              url: settings.url,
              params: params(url, settings.url)
            }) || {};

            this.headers = response.headers || {};
            this.status = response.statusCode || 200;
            return this.responseText = response.body;
          }
        };
      }
    });
  };
});

var router = prototype(routerPrototype);

module.exports = function() {
  $.mockjax.clear();
  return router();
};
