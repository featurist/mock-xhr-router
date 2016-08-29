var fauxjax = require('faux-jax');

var adapter = {
  start: function () {
    fauxjax.on('request', this._onrequest);
    this.addedHandler = true;
    fauxjax.install();
    this.running = true;
  },

  stop: function () {
    fauxjax.restore();
    this.running = false;
  },

  _onrequest: function (request) {
    var onrequest = adapter.onrequest;

    if (onrequest) {
      Promise.resolve(onrequest({
        url: request.requestURL,
        method: request.requestMethod,
        body: request.requestBody,
        headers: request.requestHeaders
      })).then(function (response) {
        request.respond(
          response.statusCode,
          response.headers,
          response.body
        );
      });
    }
  }
};

module.exports = adapter;
