var fauxjax = require('faux-jax');

var adapter = {
  version: 0,

  start: function () {
    var self = this;

    this.version++;
    fauxjax.on('request', function () { return self._onrequest.apply(self, arguments); });
    this.addedHandler = true;
    fauxjax.install();
    this.running = true;
  },

  stop: function () {
    fauxjax.restore();
    this.running = false;
  },

  _onrequest: function (request) {
    var self = this;
    var requestVersion = this.version;
    var onrequest = adapter.onrequest;

    if (onrequest) {
      Promise.resolve(onrequest({
        url: request.requestURL,
        method: request.requestMethod,
        body: request.requestBody,
        headers: request.requestHeaders
      })).then(function (response) {
        if (requestVersion == self.version && self.running) {
          request.respond(
            response.statusCode,
            response.headers,
            response.body
          );
        } else {
          // we shouldn't respond to a request from a different instance of faux-jax.
        }
      });
    }
  }
};

module.exports = adapter;
