var createRouter = require("..");
var expect = require("chai").expect;
var http = require("./http");
var jquery = require('jquery');
_debug = require('debug');

describe("router", function() {
  it("can get JSON", function() {
    var router = createRouter();

    router.get("/path/:name/:id", function(req) {
      return {
        body: {
          route: "one",
          params: req.params,
          query: req.query
        }
      };
    });

    return http.get("/path/1/2?c=3").then(function(response) {
      expect(response.body).to.eql({
        route: "one",
        params: {
          name: "1",
          id: "2"
        },
        query: {
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

  it('catches exceptions and returns 500', function () {
    var router = createRouter();

    router.get("/", function(req) {
      throw new Error('argh!');
    });

    return http.get("/").then(function () {
      throw new Error('expected to return 500');
    }, function (response) {
      expect(response.statusCode).to.equal(500);
      expect(response.body.message).to.eql('argh!');
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

  it("can get a url with spaces in the params", function(){
    var router = createRouter();
    router.get("/path/:name", function(req){
      return {
        body: req.params.name
      }
    });

    return http.get("/path/with%20space").then(function(response){
      expect(response.body).to.equal('with space');
    });
  });

  it("can post JSON", function() {
    var router = createRouter();

    router.post("/one/:name/:id", function(req) {
      return {
        body: {
          route: "one",
          body: req.body,
          params: req.params,
          query: req.query
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
          id: "2"
        },
        query: {
          c: "3"
        }
      });
    });
  });

  describe('promises', function () {
    it('responds after the promise has resolved', function () {
      var router = createRouter();
      router.get('/', function (req) {
        return new Promise(function (fulfil) {
          setTimeout(function () {
            fulfil({
              body: 'ho'
            });
          }, 100);
        });
      });

      return http.get('/').then(function (response) {
        expect(response.body).to.equal('ho');
      });
    });

    it('responds with 500 if the promise is rejected', function () {
      var router = createRouter();
      router.get('/', function (req) {
        return new Promise(function (fulfil, reject) {
          setTimeout(function () {
            reject(new Error('argh!'));
          }, 100);
        });
      });

      return http.get('/').then(function () {
        throw new Error('expected to throw exception');
      }, function (response) {
        expect(response.statusCode).to.equal(500);
        expect(response.body.message).to.equal('argh!');
      });
    });
  });

  describe('404', function () {
    context('when there are routes', function () {
      beforeEach(function () {
        var router = createRouter();
        router.get('/', function (req) {
          return {
            body: 'hi'
          };
        });
      });

      it('responds with 404 if route not found', function () {
        return http.get('/notfound').then(function () {
          throw new Error('expected to get 404');
        }, function (error) {
          expect(error.statusCode).to.equal(404);
          expect(error.body).to.equal('route not found: GET /notfound');
        });
      });
    });

    context('when there are no routes', function () {
      beforeEach(function () {
        var router = createRouter();
      });

      it('responds with 404 if route not found', function () {
        try {
          return http.get('/notfound').then(function () {
            throw new Error('expected to get 404');
          }, function (error) {
            expect(error.statusCode).to.equal(404);
            expect(error.body).to.equal('route not found: GET /notfound');
          });
        } catch (e) {
        }
      });
    });
  });

  describe('serialisation', function () {
    it("doesn't share objects between server and client", function () {
      var router = createRouter();
      var body = {
        message: 'hi'
      };

      router.get('/', function (req) {
        return {
          body: body
        };
      });

      return http.get('/').then(function (response) {
        expect(response.body.message).to.equal('hi');
        response.body.message = 'bye';
      }).then(function () {
        return http.get('/').then(function (response) {
          expect(response.body.message).to.equal('hi');
        });
      });
    });

    it("doesn't share objects between client to server", function () {
      var router = createRouter();

      var body = {
        message: 'hi'
      };

      router.post('/', function (req) {
        expect(req.body.message).to.equal('hi');
        req.body.message = 'bye';
      });

      return http.post('/', body).then(function (response) {
        expect(body.message).to.equal('hi');
      });
    });
  });

  describe('stop', function () {
    it('can stop all pending requests by creating a new router', function () {
      var router = createRouter();

      var body = {
        message: 'hi'
      };

      router.get('/', function (req) {
        return new Promise(function (fulfil) {
          setTimeout(function () {
            fulfil({
              body: 'hi'
            });
          }, 20);
        });
      });

      var gotResponse = false;

      http.get('/').then(function (response) {
        gotResponse = true;
      });

      return wait(10).then(function () {
        createRouter();

        return wait(40).then(function () {
          expect(gotResponse).to.be.false;
        });
      });
    });

    it('can stop all pending requests by calling stop', function () {
      var router = createRouter();

      var body = {
        message: 'hi'
      };

      router.get('/', function (req) {
        return new Promise(function (fulfil) {
          setTimeout(function () {
            fulfil({
              body: 'hi'
            });
          }, 20);
        });
      });

      var gotResponse = false;

      http.get('/').then(function (response) {
        gotResponse = true;
      });

      return wait(10).then(function () {
        createRouter.stop();

        return wait(40).then(function () {
          expect(gotResponse).to.be.false;
        });
      });
    });
  });
});

function wait(n) {
  return new Promise(function (fulfil) {
    setTimeout(fulfil, n);
  });
}
