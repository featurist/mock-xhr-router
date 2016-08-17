var fakeXhr = require('fake-xml-http-request');

var realXhr = window.XMLHttpRequest;

module.exports = {
  start: function () {
    var self = this;

    fakeXhr.prototype.onSend = function(xhr) {
      Promise.resolve(self.onrequest({
        method: xhr.method,
        url: xhr.url,
        headers: xhr.requestHeaders,
        body: xhr.requestBody
      })).then(function (response) {
        xhr.respond(response.statusCode, response.headers, response.body);
      });
    };
    window.XMLHttpRequest = fakeXhr;
  },

  stop: function () {
    window.XMLHttpRequest = realXhr;
  },
};
