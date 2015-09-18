var jquery = require("jquery");

function send(method, url, body) {
  return new Promise(function (fulfil, reject) {
    jquery.ajax({
      url: url,
      type: method,
      contentType: "application/json; charset=UTF-8",
      data: JSON.stringify(body),
      success: function (data, textStatus, jqXHR) {
        fulfil({
          statusCode: jqXHR.status,
          body: data
        });
      },
      error: function (jqXHR, textStatus, error) {
        var error = new Error(method.toUpperCase() + ' ' + url + ' => ' + jqXHR.status);
        error.statusCode = jqXHR.status;
        error.body = jqXHR.responseJSON || jqXHR.responseText;

        reject(error);
      }
    });
  });
}

['get', 'delete'].forEach(function (method) {
  module.exports[method] = function (url) {
    return send(method.toUpperCase(), url);
  };
});

['put', 'post'].forEach(function (method) {
  module.exports[method] = function (url, body) {
    return send(method.toUpperCase(), url, body);
  };
});
