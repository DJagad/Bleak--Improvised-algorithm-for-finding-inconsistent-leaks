"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = require("assert");
const transformations_1 = require("../src/lib/transformations");
const mitmproxy_interceptor_1 = require("../src/lib/mitmproxy_interceptor");
const fs_1 = require("fs");
const AGENT_SOURCE = fs_1.readFileSync(require.resolve('../src/lib/bleak_agent'), "utf8");
/**
 * An XMLHttpRequest mock, passed to the BLeak agent so it can support programs with eval.
 * Mirrors the behavior of the proxy when the /eval URL is requested.
 */
class XHRShim {
    constructor() {
        this.responseText = null;
    }
    open() { }
    setRequestHeader() { }
    send(data) {
        const d = JSON.parse(data);
        this.responseText = transformations_1.exposeClosureState(`eval-${Math.random()}.js`, d.source, mitmproxy_interceptor_1.DEFAULT_AGENT_URL, mitmproxy_interceptor_1.DEFAULT_BABEL_POLYFILL_URL, d.scope);
    }
}
describe('Transformations', function () {
    describe('injectIntoHead', function () {
        const headTagTypes = [
            [`<head>`, `</head>`, 'is in lowercase'],
            [`<HEAD>`, `</HEAD>`, 'is in uppercase'],
            [`<heAd>`, `</heAd>`, 'is in a mix of lower and uppercase'],
            [``, ``, 'is missing']
        ];
        const rawInjection = `<script>hello</script>`;
        const injection = transformations_1.parseHTML(rawInjection);
        headTagTypes.forEach((headTag) => {
            it(`should work when the head tag ${headTag[2]}`, function () {
                const source = `<!DOCTYPE html><html>${headTag[0]}${headTag[1]}</html>`;
                const output = `<!DOCTYPE html><html>${headTag[0]}${rawInjection}${headTag[1]}</html>`;
                assert_1.equal(transformations_1.injectIntoHead("test.html", source, injection), output);
            });
        });
    });
    describe(`Inline JavaScript`, function () {
        it(`should rewrite inline JavaScript`, function () {
            const source = `<html><head><script type="text/javascript">
      function foo() {

      }
      </script></head></html>`;
            const expected = `<html><head><script type="text/javascript">NO</script></head></html>`;
            assert_1.equal(transformations_1.injectIntoHead("test.html", source, [], () => "NO"), expected);
        });
    });
    describe('exposeClosureState', function () {
        function instrumentModule(source) {
            const newSource = transformations_1.exposeClosureState("main.js", `(function(exports) { ${source} })(exports);`);
            // Super basic CommonJS shim.
            const exp = {};
            new Function('exports', 'XMLHttpRequest', AGENT_SOURCE + "\n" + newSource)(exp, XHRShim);
            return exp;
        }
        it('works with function declarations', function () {
            const module = instrumentModule(`
        var a = 'hello';
        var b = 'hello';
        function decl(){ if (false) { decl(); } return a; }
        exports.decl = decl;
      `);
            assert_1.equal(module.decl.__scope__['a'], 'hello');
            assert_1.equal(module.decl.__scope__['decl'], module.decl);
            // b isn't closed over.
            assert_1.equal(module.decl.__scope__['b'], undefined);
            module.decl.__scope__['a'] = 'no';
            assert_1.equal(module.decl.__scope__['a'], 'no');
            const arr = [1, 2, 3];
            module.decl.__scope__['a'] = arr;
            assert_1.equal(module.decl(), arr);
        });
        it('works with function expressions', function () {
            const module = instrumentModule(`
        var a = 'hello';
        exports.decl = function(){ if (exports) {} return a; };
      `);
            assert_1.equal(module.decl.__scope__['a'], 'hello');
            assert_1.equal(module.decl.__scope__['exports'].decl, module.decl);
        });
        it(`works with named function expressions`, function () {
            const module = instrumentModule(`
        var a = 'hello';
        exports.decl = function decl2(){ return a; };
      `);
            assert_1.equal(module.decl.__scope__['a'], 'hello');
        });
        it(`works with multiple functions in the same block and multiple variables`, function () {
            const module = instrumentModule(`
        var a='hello';
        var b=3;
        exports.decl=function(){ return a + b; };
        exports.decl2=function(){ return a + b; };
      `);
            assert_1.equal(module.decl.__scope__['a'], 'hello');
            assert_1.equal(module.decl2.__scope__['a'], 'hello');
            assert_1.equal(module.decl.__scope__['b'], 3);
            assert_1.equal(module.decl.__scope__['b'], 3);
        });
        it(`works with nested functions`, function () {
            const module = instrumentModule(`
        var a = 'hello';
        function decl(){ return a; }
        function notDecl(){
          var decl = function decl(){};
          return decl;
        }
        exports.decl = decl;
        exports.notDecl = notDecl;
      `);
            assert_1.equal(module.decl.__scope__['a'], 'hello');
            assert_1.equal(module.notDecl.__scope__['a'], 'hello');
            assert_1.equal(module.notDecl().__scope__['a'], 'hello');
        });
        it(`works with nested function declarations`, function () {
            const module = instrumentModule(`
        var a = 'hello';
        function decl(){ return a; }
        function notDecl(){
          function decl(){}
          return decl;
        }
        exports.decl = decl;
        exports.notDecl = notDecl;
      `);
            assert_1.equal(module.decl.__scope__['a'], 'hello');
            assert_1.equal(module.notDecl.__scope__['a'], 'hello');
            assert_1.equal(module.notDecl().__scope__['a'], 'hello');
        });
        it(`works with functions in a list`, function () {
            const module = instrumentModule(`
        var a = 'hello';
        exports.obj = {
          decl: function() { return a; },
          decl2: function() {
            return 3
          }
        };
      `);
            assert_1.equal(module.obj.decl.__scope__['a'], 'hello');
            assert_1.equal(module.obj.decl2.__scope__['a'], 'hello');
        });
        it(`works with initializer lists in for loops`, function () {
            const module = instrumentModule(`
        exports.obj = {
          decl: function(a, b) {
            for (var i = 0, j = 0; i < b.length; i++) {
              j++;
              a += j;
            }
            return a;
          }
        };
      `);
            assert_1.equal(module.obj.decl(0, [0, 1, 2]), 6);
        });
        it(`works with initializers in for of loops`, function () {
            const module = instrumentModule(`
        exports.obj = {
          decl: function(a, b) {
            for (var prop of b) {
              if (b.hasOwnProperty(prop)) {
                a += parseInt(prop, 10);
              }
            }
            // Make sure prop doesn't escape.
            return function() {
              return [prop, a];
            };
          }
        };
      `);
            assert_1.equal(module.obj.decl(0, [0, 1, 2])()[1], 3);
        });
        it(`works with initializers in for in loops`, function () {
            const module = instrumentModule(`
        exports.b = [0,1,2];
        exports.obj = {
          decl: function(a) {
            for (var prop in exports.b) a += prop;
            prop = "hello";
            // Make sure prop escapes.
            return function() {
              return prop;
            };
          }
        };
      `);
            assert_1.equal(module.obj.decl("")(), "hello");
        });
        it(`works with catch clauses`, function () {
            const module = instrumentModule(`
        var err, e;
        exports.obj = {
          decl: function() {
            try { throw new Error("Hello"); } catch (e) { err = e; }
          }
        };
      `);
            module.obj.decl();
            assert_1.equal(module.obj.decl.__scope__['err'].message, "Hello");
        });
        it(`works with object literals`, function () {
            const module = instrumentModule(`
        var e = 5;
        exports.obj = {
          decl: function() {
            return { e: e };
          }
        };
      `);
            assert_1.equal(module.obj.decl().e, 5);
        });
        it(`works with computed properties`, function () {
            const module = instrumentModule(`
        var e = 0;
        exports.obj = {
          decl: function() {
            return arguments[e];
          }
        };
      `);
            assert_1.equal(module.obj.decl(100), 100);
        });
        it(`works with named function expressions`, function () {
            const module = instrumentModule(`
        var e = 0;
        exports.obj = {
          decl: function() {
            return function e(i) {
              return i === 0 ? 5 : e(i - 1);
            };
          }
        };
      `);
            assert_1.equal(module.obj.decl()(3), 5);
        });
        it(`does not change value of this`, function () {
            const module = instrumentModule(`
        var e = function() { return this; };
        exports.obj = {
          decl: function() {
            return e();
          }
        };
      `);
            assert_1.equal(module.obj.decl(), global);
        });
        it(`keeps strict mode declaration`, function () {
            const module = instrumentModule(`
        var e = function() { "use strict"; return this; };
        exports.obj = {
          decl: function() {
            return e();
          }
        };
      `);
            assert_1.equal(module.obj.decl(), undefined);
        });
        it(`updates arguments`, function () {
            const module = instrumentModule(`
        exports.obj = {
          decl: function(e) {
            e = 4;
            return arguments[0];
          }
        };
      `);
            assert_1.equal(module.obj.decl(100), 4);
        });
        it(`works on functions illegally defined in blocks`, function () {
            const module = instrumentModule(`
        exports.obj = {
          decl: function() {
            if (1) {
              function Z() {
                var a = 4;
                return function() { return a; };
              }
              return Z;
            }
          }
        };
      `);
            assert_1.equal(module.obj.decl()()(), 4);
        });
        it(`works on functions illegally defined in switch cases`, function () {
            const module = instrumentModule(`
        exports.obj = {
          decl: function(s) {
            switch (s) {
              case 1:
                function Z() {
                  var a = 4;
                  return function() { return a; };
                }
                return Z;
            }
          }
        };
      `);
            assert_1.equal(module.obj.decl(1)()(), 4);
        });
        it(`works on function expressions with names`, function () {
            const module = instrumentModule(`
        exports.obj = function s() {
          s = 4;
          return s;
        };
      `);
            assert_1.equal(module.obj(), module.obj);
        });
        it(`makes proxy objects equal to original objects`, function () {
            const module = instrumentModule(`
        global.a = {};
        exports.obj = function () {
          return a;
        };
        exports.cmp = function(b) {
          return a === b;
        };
      `);
            const a = module.obj();
            global.$$$INSTRUMENT_PATHS$$$([{
                    id: 1,
                    isGrowing: true,
                    indexOrName: "a",
                    type: 1 /* PROPERTY */,
                    children: []
                }]);
            assert_1.notEqual(module.obj(), a, `Proxy for global variable 'a' is properly installed`);
            assert_1.equal(module.cmp(a), true, `a === Proxy(a)`);
            assert_1.equal(module.cmp(module.obj()), true, `Proxy(a) === Proxy(a)`);
        });
        it(`works with null array entry`, function () {
            const module = instrumentModule(`exports.obj = [,1,2];`);
            assert_1.equal(module.obj[0], null);
        });
        it(`works with computed properties`, function () {
            const module = instrumentModule(`
        var a = "hello";
        var obj = { hello: 3 };
        exports.fcn = function() {
          return obj[a];
        };`);
            assert_1.equal(module.fcn(), 3);
            assert_1.equal(module.fcn.__scope__.a, "hello");
        });
        it(`works with arguments that do not escape`, function () {
            const module = instrumentModule(`
        exports.fcn = function(a) {
          return a
        };`);
            assert_1.equal(module.fcn(3), 3);
        });
        it(`works with arguments that escape`, function () {
            const module = instrumentModule(`
        exports.fcn = function(a) {
          return function() { return a; };
        };`);
            assert_1.equal(module.fcn(3)(), 3);
        });
        it(`moves all heap objects when eval is used`, function () {
            const module = instrumentModule(`
        var secret = 3;
        exports.fcn = function(a) {
          return eval(a);
        };`);
            assert_1.equal(module.fcn("secret"), 3);
            assert_1.equal(module.fcn.__scope__.secret, 3);
            assert_1.equal(module.fcn("a"), "a");
        });
        it(`appropriately overwrites variables when eval is used`, function () {
            const module = instrumentModule(`
        global.secret = 3;
        exports.fcn = function(a) {
          return eval(a);
        };`);
            assert_1.equal(module.fcn.__scope__.secret, 3);
            assert_1.equal(global.secret, 3);
            global.secret = 4;
            assert_1.equal(module.fcn.__scope__.secret, 4);
            module.fcn("secret = 6");
            assert_1.equal(module.fcn.__scope__.secret, 6);
            assert_1.equal(global.secret, 6);
        });
        it(`works with with()`, function () {
            const module = instrumentModule(`
        var l = 3;
        var o = { l: 5 };
        exports.fcn = function() {
          with(o) {
            return l;
          }
        };
        exports.assign = function(v) {
          with(o) { l = v; return l; }
        };`);
            assert_1.equal(module.fcn(), 5);
            assert_1.equal(module.assign(7), 7);
            assert_1.equal(module.fcn(), 7);
        });
        // instrument a global variable and get stack traces
        // with() with undefined / null / zeroish values.
        // growing paths: set up such that it has two separate custom setters!
        // growing window?
        // cycle of growing objects??
        // getters/setters
        // template literal
        // arrow functions, with `this` as the leaking object. arrow has only ref.
        // multiple object patterns that reference each other, e.g.:
        // var {a, b, c} = foo, {d=a} = bar;
        // a leak in a getter, e.g. { get foo() { var a;  return function() { } }}
        // or actually more like { get foo() { bar[random] = 3; }}
        // ==> Shows up as `get foo`!! Instrument both `foo` and `get foo`.
    });
    // NEED A SWITCH CASE VERSION where it's not within a block!!!
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNmb3JtYXRpb25fdGVzdHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi90ZXN0L3RyYW5zZm9ybWF0aW9uX3Rlc3RzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsbUNBQXdFO0FBQ3hFLGdFQUF5RjtBQUN6Riw0RUFBK0Y7QUFDL0YsMkJBQWdDO0FBRWhDLE1BQU0sWUFBWSxHQUFHLGlCQUFZLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyx3QkFBd0IsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBRXJGOzs7R0FHRztBQUNIO0lBQUE7UUFDUyxpQkFBWSxHQUFXLElBQUksQ0FBQztJQU9yQyxDQUFDO0lBTlEsSUFBSSxLQUFJLENBQUM7SUFDVCxnQkFBZ0IsS0FBSSxDQUFDO0lBQ3JCLElBQUksQ0FBQyxJQUFZO1FBQ3RCLE1BQU0sQ0FBQyxHQUFzQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzlELElBQUksQ0FBQyxZQUFZLEdBQUcsb0NBQWtCLENBQUMsUUFBUSxJQUFJLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUMsTUFBTSxFQUFFLHlDQUFpQixFQUFFLGtEQUEwQixFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUN2SSxDQUFDO0NBQ0Y7QUFFRCxRQUFRLENBQUMsaUJBQWlCLEVBQUU7SUFDMUIsUUFBUSxDQUFDLGdCQUFnQixFQUFFO1FBQ3pCLE1BQU0sWUFBWSxHQUFHO1lBQ25CLENBQUMsUUFBUSxFQUFFLFNBQVMsRUFBRSxpQkFBaUIsQ0FBQztZQUN4QyxDQUFDLFFBQVEsRUFBRSxTQUFTLEVBQUUsaUJBQWlCLENBQUM7WUFDeEMsQ0FBQyxRQUFRLEVBQUUsU0FBUyxFQUFFLG9DQUFvQyxDQUFDO1lBQzNELENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxZQUFZLENBQUM7U0FDdkIsQ0FBQztRQUNGLE1BQU0sWUFBWSxHQUFHLHdCQUF3QixDQUFD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QUN0QixNQUFNLE1BQU0sR0FBRyxnQkFBZ0IsQ0FBNEM7Ozs7Ozs7Ozs7V0FVdEUsQ0FBQyxDQUFDO1lBQ1AsY0FBVyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM3QixjQUFXLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNqQyxjQUFXLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQy9CLENBQUMsQ0FBQyxDQUFDO1FBRUgsb0RBQW9EO1FBQ3BELGlEQUFpRDtRQUVqRCxzRUFBc0U7UUFFdEUsa0JBQWtCO1FBRWxCLDZCQUE2QjtRQUU3QixrQkFBa0I7UUFFbEIsbUJBQW1CO1FBRW5CLDBFQUEwRTtRQUMxRSw0REFBNEQ7UUFDNUQsb0NBQW9DO1FBRXBDLDBFQUEwRTtRQUMxRSwwREFBMEQ7UUFDMUQsbUVBQW1FO0lBQ3JFLENBQUMsQ0FBQyxDQUFDO0lBQ0gsOERBQThEO0FBQ2hFLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtlcXVhbCBhcyBhc3NlcnRFcXVhbCwgbm90RXF1YWwgYXMgYXNzZXJ0Tm90RXF1YWx9IGZyb20gJ2Fzc2VydCc7XG5pbXBvcnQge2V4cG9zZUNsb3N1cmVTdGF0ZSwgaW5qZWN0SW50b0hlYWQsIHBhcnNlSFRNTH0gZnJvbSAnLi4vc3JjL2xpYi90cmFuc2Zvcm1hdGlvbnMnO1xuaW1wb3J0IHtERUZBVUxUX0FHRU5UX1VSTCwgREVGQVVMVF9CQUJFTF9QT0xZRklMTF9VUkx9IGZyb20gJy4uL3NyYy9saWIvbWl0bXByb3h5X2ludGVyY2VwdG9yJztcbmltcG9ydCB7cmVhZEZpbGVTeW5jfSBmcm9tICdmcyc7XG5cbmNvbnN0IEFHRU5UX1NPVVJDRSA9IHJlYWRGaWxlU3luYyhyZXF1aXJlLnJlc29sdmUoJy4uL3NyYy9saWIvYmxlYWtfYWdlbnQnKSwgXCJ1dGY4XCIpO1xuXG4vKipcbiAqIEFuIFhNTEh0dHBSZXF1ZXN0IG1vY2ssIHBhc3NlZCB0byB0aGUgQkxlYWsgYWdlbnQgc28gaXQgY2FuIHN1cHBvcnQgcHJvZ3JhbXMgd2l0aCBldmFsLlxuICogTWlycm9ycyB0aGUgYmVoYXZpb3Igb2YgdGhlIHByb3h5IHdoZW4gdGhlIC9ldmFsIFVSTCBpcyByZXF1ZXN0ZWQuXG4gKi9cbmNsYXNzIFhIUlNoaW0ge1xuICBwdWJsaWMgcmVzcG9uc2VUZXh0OiBzdHJpbmcgPSBudWxsO1xuICBwdWJsaWMgb3BlbigpIHt9XG4gIHB1YmxpYyBzZXRSZXF1ZXN0SGVhZGVyKCkge31cbiAgcHVibGljIHNlbmQoZGF0YTogc3RyaW5nKSB7XG4gICAgY29uc3QgZDogeyBzY29wZTogc3RyaW5nLCBzb3VyY2U6IHN0cmluZyB9ID0gSlNPTi5wYXJzZShkYXRhKTtcbiAgICB0aGlzLnJlc3BvbnNlVGV4dCA9IGV4cG9zZUNsb3N1cmVTdGF0ZShgZXZhbC0ke01hdGgucmFuZG9tKCl9LmpzYCwgZC5zb3VyY2UsIERFRkFVTFRfQUdFTlRfVVJMLCBERUZBVUxUX0JBQkVMX1BPTFlGSUxMX1VSTCwgZC5zY29wZSk7XG4gIH1cbn1cblxuZGVzY3JpYmUoJ1RyYW5zZm9ybWF0aW9ucycsIGZ1bmN0aW9uKCkge1xuICBkZXNjcmliZSgnaW5qZWN0SW50b0hlYWQnLCBmdW5jdGlvbigpIHtcbiAgICBjb25zdCBoZWFkVGFnVHlwZXMgPSBbXG4gICAgICBbYDxoZWFkPmAsIGA8L2hlYWQ+YCwgJ2lzIGluIGxvd2VyY2FzZSddLFxuICAgICAgW2A8SEVBRD5gLCBgPC9IRUFEPmAsICdpcyBpbiB1cHBlcmNhc2UnXSxcbiAgICAgIFtgPGhlQWQ+YCwgYDwvaGVBZD5gLCAnaXMgaW4gYSBtaXggb2YgbG93ZXIgYW5kIHVwcGVyY2FzZSddLFxuICAgICAgW2BgLCBgYCwgJ2lzIG1pc3NpbmcnXVxuICAgIF07XG4gICAgY29uc3QgcmF3SW5qZWN0aW9uID0gYDxzY3JpcHQ+aGVsbG88L3NjcmlwdD5gO1xuICAgIGNvbnN0IGluamVjdGlvbiA9IHBhcnNlSFRNTChyYXdJbmplY3Rpb24pO1xuICAgIGhlYWRUYWdUeXBlcy5mb3JFYWNoKChoZWFkVGFnKSA9PiB7XG4gICAgICBpdChgc2hvdWxkIHdvcmsgd2hlbiB0aGUgaGVhZCB0YWcgJHtoZWFkVGFnWzJdfWAsIGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zdCBzb3VyY2UgPSBgPCFET0NUWVBFIGh0bWw+PGh0bWw+JHtoZWFkVGFnWzBdfSR7aGVhZFRhZ1sxXX08L2h0bWw+YDtcbiAgICAgICAgY29uc3Qgb3V0cHV0ID0gYDwhRE9DVFlQRSBodG1sPjxodG1sPiR7aGVhZFRhZ1swXX0ke3Jhd0luamVjdGlvbn0ke2hlYWRUYWdbMV19PC9odG1sPmA7XG4gICAgICAgIGFzc2VydEVxdWFsKGluamVjdEludG9IZWFkKFwidGVzdC5odG1sXCIsIHNvdXJjZSwgaW5qZWN0aW9uKSwgb3V0cHV0KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZShgSW5saW5lIEphdmFTY3JpcHRgLCBmdW5jdGlvbigpIHtcbiAgICBpdChgc2hvdWxkIHJld3JpdGUgaW5saW5lIEphdmFTY3JpcHRgLCBmdW5jdGlvbigpIHtcbiAgICAgIGNvbnN0IHNvdXJjZSA9IGA8aHRtbD48aGVhZD48c2NyaXB0IHR5cGU9XCJ0ZXh0L2phdmFzY3JpcHRcIj5cbiAgICAgIGZ1bmN0aW9uIGZvbygpIHtcblxuICAgICAgfVxuICAgICAgPC9zY3JpcHQ+PC9oZWFkPjwvaHRtbD5gO1xuICAgICAgY29uc3QgZXhwZWN0ZWQgPSBgPGh0bWw+PGhlYWQ+PHNjcmlwdCB0eXBlPVwidGV4dC9qYXZhc2NyaXB0XCI+Tk88L3NjcmlwdD48L2hlYWQ+PC9odG1sPmA7XG4gICAgICBhc3NlcnRFcXVhbChpbmplY3RJbnRvSGVhZChcInRlc3QuaHRtbFwiLCBzb3VyY2UsIFtdLCAoKSA9PiBcIk5PXCIpLCBleHBlY3RlZCk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdleHBvc2VDbG9zdXJlU3RhdGUnLCBmdW5jdGlvbigpIHtcbiAgICBmdW5jdGlvbiBpbnN0cnVtZW50TW9kdWxlPFQ+KHNvdXJjZTogc3RyaW5nKTogVCB7XG4gICAgICBjb25zdCBuZXdTb3VyY2UgPSBleHBvc2VDbG9zdXJlU3RhdGUoXCJtYWluLmpzXCIsIGAoZnVuY3Rpb24oZXhwb3J0cykgeyAke3NvdXJjZX0gfSkoZXhwb3J0cyk7YCk7XG4gICAgICAvLyBTdXBlciBiYXNpYyBDb21tb25KUyBzaGltLlxuICAgICAgY29uc3QgZXhwOiBhbnkgPSB7fTtcbiAgICAgIG5ldyBGdW5jdGlvbignZXhwb3J0cycsICdYTUxIdHRwUmVxdWVzdCcsIEFHRU5UX1NPVVJDRSArIFwiXFxuXCIgKyBuZXdTb3VyY2UpKGV4cCwgWEhSU2hpbSk7XG4gICAgICByZXR1cm4gZXhwO1xuICAgIH1cblxuICAgIGl0KCd3b3JrcyB3aXRoIGZ1bmN0aW9uIGRlY2xhcmF0aW9ucycsIGZ1bmN0aW9uKCkge1xuICAgICAgY29uc3QgbW9kdWxlID0gaW5zdHJ1bWVudE1vZHVsZTx7ZGVjbDogRnVuY3Rpb259PihgXG4gICAgICAgIHZhciBhID0gJ2hlbGxvJztcbiAgICAgICAgdmFyIGIgPSAnaGVsbG8nO1xuICAgICAgICBmdW5jdGlvbiBkZWNsKCl7IGlmIChmYWxzZSkgeyBkZWNsKCk7IH0gcmV0dXJuIGE7IH1cbiAgICAgICAgZXhwb3J0cy5kZWNsID0gZGVjbDtcbiAgICAgIGApO1xuICAgICAgYXNzZXJ0RXF1YWwobW9kdWxlLmRlY2wuX19zY29wZV9fWydhJ10sICdoZWxsbycpO1xuICAgICAgYXNzZXJ0RXF1YWwobW9kdWxlLmRlY2wuX19zY29wZV9fWydkZWNsJ10sIG1vZHVsZS5kZWNsKTtcbiAgICAgIC8vIGIgaXNuJ3QgY2xvc2VkIG92ZXIuXG4gICAgICBhc3NlcnRFcXVhbChtb2R1bGUuZGVjbC5fX3Njb3BlX19bJ2InXSwgdW5kZWZpbmVkKTtcbiAgICAgIG1vZHVsZS5kZWNsLl9fc2NvcGVfX1snYSddID0gJ25vJztcbiAgICAgIGFzc2VydEVxdWFsKG1vZHVsZS5kZWNsLl9fc2NvcGVfX1snYSddLCAnbm8nKTtcbiAgICAgIGNvbnN0IGFyciA9IFsxLDIsM107XG4gICAgICBtb2R1bGUuZGVjbC5fX3Njb3BlX19bJ2EnXSA9IGFycjtcbiAgICAgIGFzc2VydEVxdWFsKG1vZHVsZS5kZWNsKCksIGFycik7XG4gICAgfSk7XG5cbiAgICBpdCgnd29ya3Mgd2l0aCBmdW5jdGlvbiBleHByZXNzaW9ucycsIGZ1bmN0aW9uKCkge1xuICAgICAgY29uc3QgbW9kdWxlID0gaW5zdHJ1bWVudE1vZHVsZTx7ZGVjbDogRnVuY3Rpb259PihgXG4gICAgICAgIHZhciBhID0gJ2hlbGxvJztcbiAgICAgICAgZXhwb3J0cy5kZWNsID0gZnVuY3Rpb24oKXsgaWYgKGV4cG9ydHMpIHt9IHJldHVybiBhOyB9O1xuICAgICAgYCk7XG4gICAgICBhc3NlcnRFcXVhbChtb2R1bGUuZGVjbC5fX3Njb3BlX19bJ2EnXSwgJ2hlbGxvJyk7XG4gICAgICBhc3NlcnRFcXVhbChtb2R1bGUuZGVjbC5fX3Njb3BlX19bJ2V4cG9ydHMnXS5kZWNsLCBtb2R1bGUuZGVjbCk7XG4gICAgfSk7XG5cbiAgICBpdChgd29ya3Mgd2l0aCBuYW1lZCBmdW5jdGlvbiBleHByZXNzaW9uc2AsIGZ1bmN0aW9uKCkge1xuICAgICAgY29uc3QgbW9kdWxlID0gaW5zdHJ1bWVudE1vZHVsZTx7ZGVjbDogRnVuY3Rpb259PihgXG4gICAgICAgIHZhciBhID0gJ2hlbGxvJztcbiAgICAgICAgZXhwb3J0cy5kZWNsID0gZnVuY3Rpb24gZGVjbDIoKXsgcmV0dXJuIGE7IH07XG4gICAgICBgKTtcbiAgICAgIGFzc2VydEVxdWFsKG1vZHVsZS5kZWNsLl9fc2NvcGVfX1snYSddLCAnaGVsbG8nKTtcbiAgICB9KTtcblxuICAgIGl0KGB3b3JrcyB3aXRoIG11bHRpcGxlIGZ1bmN0aW9ucyBpbiB0aGUgc2FtZSBibG9jayBhbmQgbXVsdGlwbGUgdmFyaWFibGVzYCwgZnVuY3Rpb24oKSB7XG4gICAgICBjb25zdCBtb2R1bGUgPSBpbnN0cnVtZW50TW9kdWxlPHtkZWNsOiBGdW5jdGlvbiwgZGVjbDI6IEZ1bmN0aW9ufT4oYFxuICAgICAgICB2YXIgYT0naGVsbG8nO1xuICAgICAgICB2YXIgYj0zO1xuICAgICAgICBleHBvcnRzLmRlY2w9ZnVuY3Rpb24oKXsgcmV0dXJuIGEgKyBiOyB9O1xuICAgICAgICBleHBvcnRzLmRlY2wyPWZ1bmN0aW9uKCl7IHJldHVybiBhICsgYjsgfTtcbiAgICAgIGApO1xuICAgICAgYXNzZXJ0RXF1YWwobW9kdWxlLmRlY2wuX19zY29wZV9fWydhJ10sICdoZWxsbycpO1xuICAgICAgYXNzZXJ0RXF1YWwobW9kdWxlLmRlY2wyLl9fc2NvcGVfX1snYSddLCAnaGVsbG8nKTtcbiAgICAgIGFzc2VydEVxdWFsKG1vZHVsZS5kZWNsLl9fc2NvcGVfX1snYiddLCAzKTtcbiAgICAgIGFzc2VydEVxdWFsKG1vZHVsZS5kZWNsLl9fc2NvcGVfX1snYiddLCAzKTtcbiAgICB9KTtcblxuICAgIGl0KGB3b3JrcyB3aXRoIG5lc3RlZCBmdW5jdGlvbnNgLCBmdW5jdGlvbigpIHtcbiAgICAgIGNvbnN0IG1vZHVsZSA9IGluc3RydW1lbnRNb2R1bGU8e2RlY2w6IEZ1bmN0aW9uLCBub3REZWNsOiBGdW5jdGlvbn0+KGBcbiAgICAgICAgdmFyIGEgPSAnaGVsbG8nO1xuICAgICAgICBmdW5jdGlvbiBkZWNsKCl7IHJldHVybiBhOyB9XG4gICAgICAgIGZ1bmN0aW9uIG5vdERlY2woKXtcbiAgICAgICAgICB2YXIgZGVjbCA9IGZ1bmN0aW9uIGRlY2woKXt9O1xuICAgICAgICAgIHJldHVybiBkZWNsO1xuICAgICAgICB9XG4gICAgICAgIGV4cG9ydHMuZGVjbCA9IGRlY2w7XG4gICAgICAgIGV4cG9ydHMubm90RGVjbCA9IG5vdERlY2w7XG4gICAgICBgKTtcbiAgICAgIGFzc2VydEVxdWFsKG1vZHVsZS5kZWNsLl9fc2NvcGVfX1snYSddLCAnaGVsbG8nKTtcbiAgICAgIGFzc2VydEVxdWFsKG1vZHVsZS5ub3REZWNsLl9fc2NvcGVfX1snYSddLCAnaGVsbG8nKTtcbiAgICAgIGFzc2VydEVxdWFsKG1vZHVsZS5ub3REZWNsKCkuX19zY29wZV9fWydhJ10sICdoZWxsbycpO1xuICAgIH0pO1xuXG4gICAgaXQoYHdvcmtzIHdpdGggbmVzdGVkIGZ1bmN0aW9uIGRlY2xhcmF0aW9uc2AsIGZ1bmN0aW9uKCkge1xuICAgICAgY29uc3QgbW9kdWxlID0gaW5zdHJ1bWVudE1vZHVsZTx7ZGVjbDogRnVuY3Rpb24sIG5vdERlY2w6IEZ1bmN0aW9ufT4oYFxuICAgICAgICB2YXIgYSA9ICdoZWxsbyc7XG4gICAgICAgIGZ1bmN0aW9uIGRlY2woKXsgcmV0dXJuIGE7IH1cbiAgICAgICAgZnVuY3Rpb24gbm90RGVjbCgpe1xuICAgICAgICAgIGZ1bmN0aW9uIGRlY2woKXt9XG4gICAgICAgICAgcmV0dXJuIGRlY2w7XG4gICAgICAgIH1cbiAgICAgICAgZXhwb3J0cy5kZWNsID0gZGVjbDtcbiAgICAgICAgZXhwb3J0cy5ub3REZWNsID0gbm90RGVjbDtcbiAgICAgIGApXG4gICAgICBhc3NlcnRFcXVhbChtb2R1bGUuZGVjbC5fX3Njb3BlX19bJ2EnXSwgJ2hlbGxvJyk7XG4gICAgICBhc3NlcnRFcXVhbChtb2R1bGUubm90RGVjbC5fX3Njb3BlX19bJ2EnXSwgJ2hlbGxvJyk7XG4gICAgICBhc3NlcnRFcXVhbChtb2R1bGUubm90RGVjbCgpLl9fc2NvcGVfX1snYSddLCAnaGVsbG8nKTtcbiAgICB9KTtcblxuICAgIGl0KGB3b3JrcyB3aXRoIGZ1bmN0aW9ucyBpbiBhIGxpc3RgLCBmdW5jdGlvbigpIHtcbiAgICAgIGNvbnN0IG1vZHVsZSA9IGluc3RydW1lbnRNb2R1bGU8e29iajoge2RlY2w6IEZ1bmN0aW9uLCBkZWNsMjogRnVuY3Rpb259fT4oYFxuICAgICAgICB2YXIgYSA9ICdoZWxsbyc7XG4gICAgICAgIGV4cG9ydHMub2JqID0ge1xuICAgICAgICAgIGRlY2w6IGZ1bmN0aW9uKCkgeyByZXR1cm4gYTsgfSxcbiAgICAgICAgICBkZWNsMjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gM1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgIGApO1xuICAgICAgYXNzZXJ0RXF1YWwobW9kdWxlLm9iai5kZWNsLl9fc2NvcGVfX1snYSddLCAnaGVsbG8nKTtcbiAgICAgIGFzc2VydEVxdWFsKG1vZHVsZS5vYmouZGVjbDIuX19zY29wZV9fWydhJ10sICdoZWxsbycpO1xuICAgIH0pO1xuXG4gICAgaXQoYHdvcmtzIHdpdGggaW5pdGlhbGl6ZXIgbGlzdHMgaW4gZm9yIGxvb3BzYCwgZnVuY3Rpb24oKSB7XG4gICAgICBjb25zdCBtb2R1bGUgPSBpbnN0cnVtZW50TW9kdWxlPHtvYmo6IHtkZWNsOiBGdW5jdGlvbn19PihgXG4gICAgICAgIGV4cG9ydHMub2JqID0ge1xuICAgICAgICAgIGRlY2w6IGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBqID0gMDsgaSA8IGIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgaisrO1xuICAgICAgICAgICAgICBhICs9IGo7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gYTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICBgKTtcbiAgICAgIGFzc2VydEVxdWFsKG1vZHVsZS5vYmouZGVjbCgwLCBbMCwxLDJdKSwgNik7XG4gICAgfSk7XG5cbiAgICBpdChgd29ya3Mgd2l0aCBpbml0aWFsaXplcnMgaW4gZm9yIG9mIGxvb3BzYCwgZnVuY3Rpb24oKSB7XG4gICAgICBjb25zdCBtb2R1bGUgPSBpbnN0cnVtZW50TW9kdWxlPHtvYmo6IHtkZWNsOiBGdW5jdGlvbn19PihgXG4gICAgICAgIGV4cG9ydHMub2JqID0ge1xuICAgICAgICAgIGRlY2w6IGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgICAgIGZvciAodmFyIHByb3Agb2YgYikge1xuICAgICAgICAgICAgICBpZiAoYi5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xuICAgICAgICAgICAgICAgIGEgKz0gcGFyc2VJbnQocHJvcCwgMTApO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBNYWtlIHN1cmUgcHJvcCBkb2Vzbid0IGVzY2FwZS5cbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFtwcm9wLCBhXTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgYCk7XG4gICAgICBhc3NlcnRFcXVhbChtb2R1bGUub2JqLmRlY2woMCwgWzAsMSwyXSkoKVsxXSwgMyk7XG4gICAgfSk7XG5cbiAgICBpdChgd29ya3Mgd2l0aCBpbml0aWFsaXplcnMgaW4gZm9yIGluIGxvb3BzYCwgZnVuY3Rpb24oKSB7XG4gICAgICBjb25zdCBtb2R1bGUgPSBpbnN0cnVtZW50TW9kdWxlPHtvYmo6IHtkZWNsOiBGdW5jdGlvbn19PihgXG4gICAgICAgIGV4cG9ydHMuYiA9IFswLDEsMl07XG4gICAgICAgIGV4cG9ydHMub2JqID0ge1xuICAgICAgICAgIGRlY2w6IGZ1bmN0aW9uKGEpIHtcbiAgICAgICAgICAgIGZvciAodmFyIHByb3AgaW4gZXhwb3J0cy5iKSBhICs9IHByb3A7XG4gICAgICAgICAgICBwcm9wID0gXCJoZWxsb1wiO1xuICAgICAgICAgICAgLy8gTWFrZSBzdXJlIHByb3AgZXNjYXBlcy5cbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHByb3A7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgIGApO1xuICAgICAgYXNzZXJ0RXF1YWwobW9kdWxlLm9iai5kZWNsKFwiXCIpKCksIFwiaGVsbG9cIik7XG4gICAgfSk7XG5cbiAgICBpdChgd29ya3Mgd2l0aCBjYXRjaCBjbGF1c2VzYCwgZnVuY3Rpb24oKSB7XG4gICAgICBjb25zdCBtb2R1bGUgPSBpbnN0cnVtZW50TW9kdWxlPHtvYmo6IHtkZWNsOiBGdW5jdGlvbn19PihgXG4gICAgICAgIHZhciBlcnIsIGU7XG4gICAgICAgIGV4cG9ydHMub2JqID0ge1xuICAgICAgICAgIGRlY2w6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdHJ5IHsgdGhyb3cgbmV3IEVycm9yKFwiSGVsbG9cIik7IH0gY2F0Y2ggKGUpIHsgZXJyID0gZTsgfVxuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgIGApO1xuICAgICAgbW9kdWxlLm9iai5kZWNsKCk7XG4gICAgICBhc3NlcnRFcXVhbChtb2R1bGUub2JqLmRlY2wuX19zY29wZV9fWydlcnInXS5tZXNzYWdlLCBcIkhlbGxvXCIpO1xuICAgIH0pO1xuXG4gICAgaXQoYHdvcmtzIHdpdGggb2JqZWN0IGxpdGVyYWxzYCwgZnVuY3Rpb24oKSB7XG4gICAgICBjb25zdCBtb2R1bGUgPSBpbnN0cnVtZW50TW9kdWxlPHtvYmo6IHtkZWNsOiBGdW5jdGlvbn19PihgXG4gICAgICAgIHZhciBlID0gNTtcbiAgICAgICAgZXhwb3J0cy5vYmogPSB7XG4gICAgICAgICAgZGVjbDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4geyBlOiBlIH07XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgYCk7XG4gICAgICBhc3NlcnRFcXVhbChtb2R1bGUub2JqLmRlY2woKS5lLCA1KTtcbiAgICB9KTtcblxuICAgIGl0KGB3b3JrcyB3aXRoIGNvbXB1dGVkIHByb3BlcnRpZXNgLCBmdW5jdGlvbigpIHtcbiAgICAgIGNvbnN0IG1vZHVsZSA9IGluc3RydW1lbnRNb2R1bGU8e29iajoge2RlY2w6IEZ1bmN0aW9ufX0+KGBcbiAgICAgICAgdmFyIGUgPSAwO1xuICAgICAgICBleHBvcnRzLm9iaiA9IHtcbiAgICAgICAgICBkZWNsOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBhcmd1bWVudHNbZV07XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgYCk7XG4gICAgICBhc3NlcnRFcXVhbChtb2R1bGUub2JqLmRlY2woMTAwKSwgMTAwKTtcbiAgICB9KTtcblxuICAgIGl0KGB3b3JrcyB3aXRoIG5hbWVkIGZ1bmN0aW9uIGV4cHJlc3Npb25zYCwgZnVuY3Rpb24oKSB7XG4gICAgICBjb25zdCBtb2R1bGUgPSBpbnN0cnVtZW50TW9kdWxlPHtvYmo6IHtkZWNsOiBGdW5jdGlvbn19PihgXG4gICAgICAgIHZhciBlID0gMDtcbiAgICAgICAgZXhwb3J0cy5vYmogPSB7XG4gICAgICAgICAgZGVjbDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gZShpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBpID09PSAwID8gNSA6IGUoaSAtIDEpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICBgKTtcbiAgICAgIGFzc2VydEVxdWFsKG1vZHVsZS5vYmouZGVjbCgpKDMpLCA1KTtcbiAgICB9KTtcblxuICAgIGl0KGBkb2VzIG5vdCBjaGFuZ2UgdmFsdWUgb2YgdGhpc2AsIGZ1bmN0aW9uKCkge1xuICAgICAgY29uc3QgbW9kdWxlID0gaW5zdHJ1bWVudE1vZHVsZTx7b2JqOiB7ZGVjbDogRnVuY3Rpb259fT4oYFxuICAgICAgICB2YXIgZSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpczsgfTtcbiAgICAgICAgZXhwb3J0cy5vYmogPSB7XG4gICAgICAgICAgZGVjbDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gZSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgIGApO1xuICAgICAgYXNzZXJ0RXF1YWwobW9kdWxlLm9iai5kZWNsKCksIGdsb2JhbCk7XG4gICAgfSk7XG5cbiAgICBpdChga2VlcHMgc3RyaWN0IG1vZGUgZGVjbGFyYXRpb25gLCBmdW5jdGlvbigpIHtcbiAgICAgIGNvbnN0IG1vZHVsZSA9IGluc3RydW1lbnRNb2R1bGU8e29iajoge2RlY2w6IEZ1bmN0aW9ufX0+KGBcbiAgICAgICAgdmFyIGUgPSBmdW5jdGlvbigpIHsgXCJ1c2Ugc3RyaWN0XCI7IHJldHVybiB0aGlzOyB9O1xuICAgICAgICBleHBvcnRzLm9iaiA9IHtcbiAgICAgICAgICBkZWNsOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBlKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgYCk7XG4gICAgICBhc3NlcnRFcXVhbChtb2R1bGUub2JqLmRlY2woKSwgdW5kZWZpbmVkKTtcbiAgICB9KTtcblxuICAgIGl0KGB1cGRhdGVzIGFyZ3VtZW50c2AsIGZ1bmN0aW9uKCkge1xuICAgICAgY29uc3QgbW9kdWxlID0gaW5zdHJ1bWVudE1vZHVsZTx7b2JqOiB7ZGVjbDogRnVuY3Rpb259fT4oYFxuICAgICAgICBleHBvcnRzLm9iaiA9IHtcbiAgICAgICAgICBkZWNsOiBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICBlID0gNDtcbiAgICAgICAgICAgIHJldHVybiBhcmd1bWVudHNbMF07XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgYCk7XG4gICAgICBhc3NlcnRFcXVhbChtb2R1bGUub2JqLmRlY2woMTAwKSwgNCk7XG4gICAgfSk7XG5cbiAgICBpdChgd29ya3Mgb24gZnVuY3Rpb25zIGlsbGVnYWxseSBkZWZpbmVkIGluIGJsb2Nrc2AsIGZ1bmN0aW9uKCkge1xuICAgICAgY29uc3QgbW9kdWxlID0gaW5zdHJ1bWVudE1vZHVsZTx7b2JqOiB7ZGVjbDogRnVuY3Rpb259fT4oYFxuICAgICAgICBleHBvcnRzLm9iaiA9IHtcbiAgICAgICAgICBkZWNsOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmICgxKSB7XG4gICAgICAgICAgICAgIGZ1bmN0aW9uIFooKSB7XG4gICAgICAgICAgICAgICAgdmFyIGEgPSA0O1xuICAgICAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbigpIHsgcmV0dXJuIGE7IH07XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuIFo7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgYCk7XG4gICAgICBhc3NlcnRFcXVhbChtb2R1bGUub2JqLmRlY2woKSgpKCksIDQpO1xuICAgIH0pO1xuXG4gICAgaXQoYHdvcmtzIG9uIGZ1bmN0aW9ucyBpbGxlZ2FsbHkgZGVmaW5lZCBpbiBzd2l0Y2ggY2FzZXNgLCBmdW5jdGlvbigpIHtcbiAgICAgIGNvbnN0IG1vZHVsZSA9IGluc3RydW1lbnRNb2R1bGU8e29iajoge2RlY2w6IEZ1bmN0aW9ufX0+KGBcbiAgICAgICAgZXhwb3J0cy5vYmogPSB7XG4gICAgICAgICAgZGVjbDogZnVuY3Rpb24ocykge1xuICAgICAgICAgICAgc3dpdGNoIChzKSB7XG4gICAgICAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBaKCkge1xuICAgICAgICAgICAgICAgICAgdmFyIGEgPSA0O1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkgeyByZXR1cm4gYTsgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIFo7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgYCk7XG4gICAgICBhc3NlcnRFcXVhbChtb2R1bGUub2JqLmRlY2woMSkoKSgpLCA0KTtcbiAgICB9KTtcblxuICAgIGl0KGB3b3JrcyBvbiBmdW5jdGlvbiBleHByZXNzaW9ucyB3aXRoIG5hbWVzYCwgZnVuY3Rpb24oKSB7XG4gICAgICBjb25zdCBtb2R1bGUgPSBpbnN0cnVtZW50TW9kdWxlPHtvYmo6IEZ1bmN0aW9ufT4oYFxuICAgICAgICBleHBvcnRzLm9iaiA9IGZ1bmN0aW9uIHMoKSB7XG4gICAgICAgICAgcyA9IDQ7XG4gICAgICAgICAgcmV0dXJuIHM7XG4gICAgICAgIH07XG4gICAgICBgKTtcbiAgICAgIGFzc2VydEVxdWFsKG1vZHVsZS5vYmooKSwgbW9kdWxlLm9iaik7XG4gICAgfSk7XG5cbiAgICBpdChgbWFrZXMgcHJveHkgb2JqZWN0cyBlcXVhbCB0byBvcmlnaW5hbCBvYmplY3RzYCwgZnVuY3Rpb24oKSB7XG4gICAgICBjb25zdCBtb2R1bGUgPSBpbnN0cnVtZW50TW9kdWxlPHtvYmo6IEZ1bmN0aW9uLCBjbXA6IChhOiBhbnkpID0+IGJvb2xlYW59PihgXG4gICAgICAgIGdsb2JhbC5hID0ge307XG4gICAgICAgIGV4cG9ydHMub2JqID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHJldHVybiBhO1xuICAgICAgICB9O1xuICAgICAgICBleHBvcnRzLmNtcCA9IGZ1bmN0aW9uKGIpIHtcbiAgICAgICAgICByZXR1cm4gYSA9PT0gYjtcbiAgICAgICAgfTtcbiAgICAgIGApO1xuICAgICAgY29uc3QgYSA9IG1vZHVsZS5vYmooKTtcbiAgICAgICg8V2luZG93PiA8YW55PiBnbG9iYWwpLiQkJElOU1RSVU1FTlRfUEFUSFMkJCQoW3tcbiAgICAgICAgaWQ6IDEsXG4gICAgICAgIGlzR3Jvd2luZzogdHJ1ZSxcbiAgICAgICAgaW5kZXhPck5hbWU6IFwiYVwiLFxuICAgICAgICB0eXBlOiBQYXRoU2VnbWVudFR5cGUuUFJPUEVSVFksXG4gICAgICAgIGNoaWxkcmVuOiBbXVxuICAgICAgfV0pO1xuICAgICAgYXNzZXJ0Tm90RXF1YWwobW9kdWxlLm9iaigpLCBhLCBgUHJveHkgZm9yIGdsb2JhbCB2YXJpYWJsZSAnYScgaXMgcHJvcGVybHkgaW5zdGFsbGVkYCk7XG4gICAgICBhc3NlcnRFcXVhbChtb2R1bGUuY21wKGEpLCB0cnVlLCBgYSA9PT0gUHJveHkoYSlgKTtcbiAgICAgIGFzc2VydEVxdWFsKG1vZHVsZS5jbXAobW9kdWxlLm9iaigpKSwgdHJ1ZSwgYFByb3h5KGEpID09PSBQcm94eShhKWApO1xuICAgIH0pO1xuXG4gICAgaXQoYHdvcmtzIHdpdGggbnVsbCBhcnJheSBlbnRyeWAsIGZ1bmN0aW9uKCkge1xuICAgICAgY29uc3QgbW9kdWxlID0gaW5zdHJ1bWVudE1vZHVsZTx7b2JqOiAobnVtYmVyIHwgbnVsbClbXX0+KGBleHBvcnRzLm9iaiA9IFssMSwyXTtgKTtcbiAgICAgIGFzc2VydEVxdWFsKG1vZHVsZS5vYmpbMF0sIG51bGwpO1xuICAgIH0pO1xuXG4gICAgaXQoYHdvcmtzIHdpdGggY29tcHV0ZWQgcHJvcGVydGllc2AsIGZ1bmN0aW9uKCkge1xuICAgICAgY29uc3QgbW9kdWxlID0gaW5zdHJ1bWVudE1vZHVsZTx7ZmNuOiAoKSA9PiBudW1iZXJ9PihgXG4gICAgICAgIHZhciBhID0gXCJoZWxsb1wiO1xuICAgICAgICB2YXIgb2JqID0geyBoZWxsbzogMyB9O1xuICAgICAgICBleHBvcnRzLmZjbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiBvYmpbYV07XG4gICAgICAgIH07YCk7XG5cbiAgICAgICAgYXNzZXJ0RXF1YWwobW9kdWxlLmZjbigpLCAzKTtcbiAgICAgICAgYXNzZXJ0RXF1YWwobW9kdWxlLmZjbi5fX3Njb3BlX18uYSwgXCJoZWxsb1wiKTtcbiAgICB9KTtcblxuICAgIGl0KGB3b3JrcyB3aXRoIGFyZ3VtZW50cyB0aGF0IGRvIG5vdCBlc2NhcGVgLCBmdW5jdGlvbigpIHtcbiAgICAgIGNvbnN0IG1vZHVsZSA9IGluc3RydW1lbnRNb2R1bGU8e2ZjbjogKGE6IG51bWJlcikgPT4gbnVtYmVyfT4oYFxuICAgICAgICBleHBvcnRzLmZjbiA9IGZ1bmN0aW9uKGEpIHtcbiAgICAgICAgICByZXR1cm4gYVxuICAgICAgICB9O2ApO1xuICAgICAgYXNzZXJ0RXF1YWwobW9kdWxlLmZjbigzKSwgMyk7XG4gICAgfSk7XG5cbiAgICBpdChgd29ya3Mgd2l0aCBhcmd1bWVudHMgdGhhdCBlc2NhcGVgLCBmdW5jdGlvbigpIHtcbiAgICAgIGNvbnN0IG1vZHVsZSA9IGluc3RydW1lbnRNb2R1bGU8e2ZjbjogKGE6IG51bWJlcikgPT4gKCkgPT4gbnVtYmVyfT4oYFxuICAgICAgICBleHBvcnRzLmZjbiA9IGZ1bmN0aW9uKGEpIHtcbiAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7IHJldHVybiBhOyB9O1xuICAgICAgICB9O2ApO1xuICAgICAgYXNzZXJ0RXF1YWwobW9kdWxlLmZjbigzKSgpLCAzKTtcbiAgICB9KTtcblxuICAgIGl0KGBtb3ZlcyBhbGwgaGVhcCBvYmplY3RzIHdoZW4gZXZhbCBpcyB1c2VkYCwgZnVuY3Rpb24oKSB7XG4gICAgICBjb25zdCBtb2R1bGUgPSBpbnN0cnVtZW50TW9kdWxlPHtmY246IChhOiBzdHJpbmcpID0+IGFueX0+KGBcbiAgICAgICAgdmFyIHNlY3JldCA9IDM7XG4gICAgICAgIGV4cG9ydHMuZmNuID0gZnVuY3Rpb24oYSkge1xuICAgICAgICAgIHJldHVybiBldmFsKGEpO1xuICAgICAgICB9O2ApO1xuICAgICAgYXNzZXJ0RXF1YWwobW9kdWxlLmZjbihcInNlY3JldFwiKSwgMyk7XG4gICAgICBhc3NlcnRFcXVhbChtb2R1bGUuZmNuLl9fc2NvcGVfXy5zZWNyZXQsIDMpO1xuICAgICAgYXNzZXJ0RXF1YWwobW9kdWxlLmZjbihcImFcIiksIFwiYVwiKTtcbiAgICB9KTtcblxuICAgIGl0KGBhcHByb3ByaWF0ZWx5IG92ZXJ3cml0ZXMgdmFyaWFibGVzIHdoZW4gZXZhbCBpcyB1c2VkYCwgZnVuY3Rpb24oKSB7XG4gICAgICBjb25zdCBtb2R1bGUgPSBpbnN0cnVtZW50TW9kdWxlPHtmY246IChhOiBzdHJpbmcpID0+IGFueX0+KGBcbiAgICAgICAgZ2xvYmFsLnNlY3JldCA9IDM7XG4gICAgICAgIGV4cG9ydHMuZmNuID0gZnVuY3Rpb24oYSkge1xuICAgICAgICAgIHJldHVybiBldmFsKGEpO1xuICAgICAgICB9O2ApO1xuICAgICAgYXNzZXJ0RXF1YWwobW9kdWxlLmZjbi5fX3Njb3BlX18uc2VjcmV0LCAzKTtcbiAgICAgIGFzc2VydEVxdWFsKCg8YW55PiBnbG9iYWwpLnNlY3JldCwgMyk7XG4gICAgICAoPGFueT4gZ2xvYmFsKS5zZWNyZXQgPSA0O1xuICAgICAgYXNzZXJ0RXF1YWwobW9kdWxlLmZjbi5fX3Njb3BlX18uc2VjcmV0LCA0KTtcbiAgICAgIG1vZHVsZS5mY24oXCJzZWNyZXQgPSA2XCIpO1xuICAgICAgYXNzZXJ0RXF1YWwobW9kdWxlLmZjbi5fX3Njb3BlX18uc2VjcmV0LCA2KTtcbiAgICAgIGFzc2VydEVxdWFsKCg8YW55PiBnbG9iYWwpLnNlY3JldCwgNik7XG4gICAgfSk7XG5cbiAgICBpdChgd29ya3Mgd2l0aCB3aXRoKClgLCBmdW5jdGlvbigpIHtcbiAgICAgIGNvbnN0IG1vZHVsZSA9IGluc3RydW1lbnRNb2R1bGU8e2ZjbjogKCkgPT4gYW55LCBhc3NpZ246ICh2OiBhbnkpID0+IGFueX0+KGBcbiAgICAgICAgdmFyIGwgPSAzO1xuICAgICAgICB2YXIgbyA9IHsgbDogNSB9O1xuICAgICAgICBleHBvcnRzLmZjbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHdpdGgobykge1xuICAgICAgICAgICAgcmV0dXJuIGw7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBleHBvcnRzLmFzc2lnbiA9IGZ1bmN0aW9uKHYpIHtcbiAgICAgICAgICB3aXRoKG8pIHsgbCA9IHY7IHJldHVybiBsOyB9XG4gICAgICAgIH07YCk7XG4gICAgICBhc3NlcnRFcXVhbChtb2R1bGUuZmNuKCksIDUpO1xuICAgICAgYXNzZXJ0RXF1YWwobW9kdWxlLmFzc2lnbig3KSwgNyk7XG4gICAgICBhc3NlcnRFcXVhbChtb2R1bGUuZmNuKCksIDcpO1xuICAgIH0pO1xuXG4gICAgLy8gaW5zdHJ1bWVudCBhIGdsb2JhbCB2YXJpYWJsZSBhbmQgZ2V0IHN0YWNrIHRyYWNlc1xuICAgIC8vIHdpdGgoKSB3aXRoIHVuZGVmaW5lZCAvIG51bGwgLyB6ZXJvaXNoIHZhbHVlcy5cblxuICAgIC8vIGdyb3dpbmcgcGF0aHM6IHNldCB1cCBzdWNoIHRoYXQgaXQgaGFzIHR3byBzZXBhcmF0ZSBjdXN0b20gc2V0dGVycyFcblxuICAgIC8vIGdyb3dpbmcgd2luZG93P1xuXG4gICAgLy8gY3ljbGUgb2YgZ3Jvd2luZyBvYmplY3RzPz9cblxuICAgIC8vIGdldHRlcnMvc2V0dGVyc1xuXG4gICAgLy8gdGVtcGxhdGUgbGl0ZXJhbFxuXG4gICAgLy8gYXJyb3cgZnVuY3Rpb25zLCB3aXRoIGB0aGlzYCBhcyB0aGUgbGVha2luZyBvYmplY3QuIGFycm93IGhhcyBvbmx5IHJlZi5cbiAgICAvLyBtdWx0aXBsZSBvYmplY3QgcGF0dGVybnMgdGhhdCByZWZlcmVuY2UgZWFjaCBvdGhlciwgZS5nLjpcbiAgICAvLyB2YXIge2EsIGIsIGN9ID0gZm9vLCB7ZD1hfSA9IGJhcjtcblxuICAgIC8vIGEgbGVhayBpbiBhIGdldHRlciwgZS5nLiB7IGdldCBmb28oKSB7IHZhciBhOyAgcmV0dXJuIGZ1bmN0aW9uKCkgeyB9IH19XG4gICAgLy8gb3IgYWN0dWFsbHkgbW9yZSBsaWtlIHsgZ2V0IGZvbygpIHsgYmFyW3JhbmRvbV0gPSAzOyB9fVxuICAgIC8vID09PiBTaG93cyB1cCBhcyBgZ2V0IGZvb2AhISBJbnN0cnVtZW50IGJvdGggYGZvb2AgYW5kIGBnZXQgZm9vYC5cbiAgfSk7XG4gIC8vIE5FRUQgQSBTV0lUQ0ggQ0FTRSBWRVJTSU9OIHdoZXJlIGl0J3Mgbm90IHdpdGhpbiBhIGJsb2NrISEhXG59KTsiXX0=