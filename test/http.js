var jquery = require("jquery");

function send(method, url, body) {
  return jquery.ajax({
    url: url,
    type: method,
    contentType: "application/json; charset=UTF-8",
    data: JSON.stringify(body)
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
