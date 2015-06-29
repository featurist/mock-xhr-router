var createRouter = require("..");
var expect = require("chai").expect;
var http = require("./http");
var jquery = require('jquery');

describe("router", function() {
  it("can get JSON", function() {
    var router = createRouter();

    router.get("/path/:name/:id", function(req) {
      return {
        body: {
          route: "one",
          params: req.params
        }
      };
    });

    return http.get("/path/1/2?c=3").then(function(response) {
      expect(response.body).to.eql({
        route: "one",
        params: {
          name: "1",
          id: "2",
          c: "3"
        }
      });
    });
  });

  it("can respond with 400", function() {
    var router = createRouter();

    router.get("/path/:name/:id", function(req) {
      return {
        statusCode: 400,
        body: {
          error: 'bad luck!'
        }
      };
    });

    return http.get("/path/1/2?c=3").then(function () {
      throw new Error('expected to fail');
    }, function (errorResponse) {
      expect(errorResponse.statusCode).to.equal(400);
      expect(errorResponse.body).to.eql({error: 'bad luck!'});
    });
  });

  it("can respond with 201", function() {
    var router = createRouter();

    router.get("/path/:name/:id", function(req) {
      return {
        statusCode: 201,
        body: {
          message: 'created!'
        }
      };
    });

    return http.get("/path/1/2?c=3").then(function (response) {
      expect(response.statusCode).to.equal(201);
      expect(response.body).to.eql({message: 'created!'});
    });
  });

  it("can get a string", function() {
    var router = createRouter();

    router.get("/path/:name/:id", function(req) {
      return {
        body: 'a string'
      };
    });

    return http.get("/path/1/2?c=3").then(function(response) {
      expect(response.body).to.equal('a string');
    });
  });

  it("can post JSON", function() {
    var router = createRouter();

    router.post("/one/:name/:id", function(req) {
      return {
        body: {
          route: "one",
          body: req.body,
          params: req.params
        }
      };
    });

    return http.post("/one/1/2?c=3", { data: "blah" }).then(function(response) {
      expect(response.body).to.eql({
        route: "one",
        body: {
          data: "blah"
        },
        params: {
          name: "1",
          id: "2",
          c: "3"
        }
      });
    });
  });
});
