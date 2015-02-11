var createRouter = require("..");
var expect = require("chai").expect;
var http = require("./http");

describe("router", function() {
  it("can get", function() {
    var router = createRouter();

    router.get("/path/:name/:id", function(req) {
      return {
        body: {
          route: "one",
          params: req.params
        }
      };
    });

    http.get("/path/1/2?c=3").then(function(response) {
      return expect(response).to.eql({
        route: "one",
        params: {
          name: "1",
          id: "2",
          c: "3"
        }
      });
    });
  });

  it("can post", function() {
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

    http.post("/one/1/2?c=3", { data: "blah" }).then(function(response) {
      return expect(response).to.eql({
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
