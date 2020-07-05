"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bleak_1 = require("../src/lib/bleak");
const http_server_1 = require("./util/http_server");
const chrome_driver_1 = require("../src/lib/chrome_driver");
const fs_1 = require("fs");
const assert_1 = require("assert");
const nop_progress_bar_1 = require("../src/lib/nop_progress_bar");
const HTTP_PORT = 8875;
const DEBUG = false;
function getHTMLDoc(docStr) {
    return {
        mimeType: 'text/html',
        data: Buffer.from(docStr, 'utf8')
    };
}
function getHTMLConfig(name) {
    return getHTMLDoc(`<!DOCTYPE html><html><head><title>${name}</title></head><body><button id="btn">Click Me</button><script type="text/javascript" src="/${name}.js"></script></body></html>`);
}
// 'Files' present in the test HTTP server
const FILES = {
    '/test.html': getHTMLConfig('test'),
    '/test.js': {
        mimeType: 'text/javascript',
        data: Buffer.from(`var obj = {};
    var i = 0;
    var power = 2;
    document.getElementById('btn').addEventListener('click', function() {
      var top = Math.pow(2, power);
      power++;
      for (var j = 0; j < top; j++) {
        obj[Math.random()] = Math.random();
      }
    });
    `, 'utf8')
    },
    '/closure_test.html': getHTMLConfig('closure_test'),
    '/closure_test.js': {
        mimeType: 'text/javascript',
        data: Buffer.from(`(function() {
      var obj = {};
      var i = 0;
      var power = 2;
      window.objfcn = function() {
        var top = Math.pow(2, power);
        power++;
        for (var j = 0; j < top; j++) {
          obj[Math.random()] = Math.random();
        }
      };
    })();
    document.getElementById('btn').addEventListener('click', function() {
      window.objfcn();
    });`)
    },
    '/closure_test_dom.html': getHTMLConfig('closure_test_dom'),
    '/closure_test_dom.js': {
        mimeType: 'text/javascript',
        data: Buffer.from(`(function() {
      var obj = {};
      var i = 0;
      var power = 2;
      document.getElementById('btn').addEventListener('click', function() {
        var top = Math.pow(2, power);
        power++;
        for (var j = 0; j < top; j++) {
          obj[Math.random()] = Math.random();
        }
      });
    })();
    `, 'utf8')
    },
    '/closure_test_dom_on_property.html': getHTMLConfig('closure_test_dom_on_property'),
    '/closure_test_dom_on_property.js': {
        mimeType: 'text/javascript',
        data: Buffer.from(`(function() {
      var obj = {};
      var i = 0;
      var power = 2;
      document.getElementById('btn').onclick = function() {
        var top = Math.pow(2, power);
        power++;
        for (var j = 0; j < top; j++) {
          obj[Math.random()] = Math.random();
        }
      };
    })();
    `, 'utf8')
    },
    '/closure_test_irrelevant_dom.html': getHTMLDoc(`<!DOCTYPE html><html><head><title>Closure test irrelevant dom</title></head><body><button id="btn2">Don't click me</button><button id="btn">Click Me</button><button id="btn3">Don't click me, either</button><script type="text/javascript" src="/closure_test_irrelevant_dom.js"></script></body></html>`),
    '/closure_test_irrelevant_dom.js': {
        mimeType: 'text/javascript',
        data: Buffer.from(`(function() {
      var obj = {};
      var i = 0;
      var power = 2;
      document.getElementById('btn').addEventListener('click', function() {
        var top = Math.pow(2, power);
        power++;
        for (var j = 0; j < top; j++) {
          obj[Math.random()] = Math.random();
        }
      });
    })();
    `, 'utf8')
    },
    '/closure_test_disconnected_dom.html': getHTMLDoc(`<!DOCTYPE html><html><head><title>Closure test disconnected dom</title></head><body><button id="btn">Click Me</button><script type="text/javascript" src="/closure_test_disconnected_dom.js"></script></body></html>`),
    '/closure_test_disconnected_dom.js': {
        mimeType: 'text/javascript',
        data: Buffer.from(`(function() {
      var obj = {};
      var i = 0;
      var power = 2;
      var btn = document.createElement('button');
      btn.addEventListener('click', function() {
        var top = Math.pow(2, power);
        power++;
        for (var j = 0; j < top; j++) {
          obj[Math.random()] = Math.random();
        }
      });
      window.$$btn = btn;
    })();
    (function() {
      document.getElementById('btn').addEventListener('click', function() {
        window.$$btn.click();
      });
    })();
    `, 'utf8')
    },
    /*'/closure_test_disconnected_dom_collection.html': getHTMLDoc(`<!DOCTYPE html><html><head><title>Closure test disconnected dom collection</title></head><body><button id="btn">Click Me</button><script type="text/javascript" src="/closure_test_disconnected_dom_collection.js"></script></body></html>`),
    '/closure_test_disconnected_dom_collection.js': {
      mimeType: 'text/javascript',
      data: Buffer.from(`(function() {
        var obj = {};
        var i = 0;
        var power = 2;
        document.body.appendChild(document.createElement('button'));
        var buttons = document.getElementsByTagName('button');
        buttons[1].addEventListener('click', function() {
          var top = Math.pow(2, power);
          power++;
          for (var j = 0; j < top; j++) {
            obj[Math.random()] = Math.random();
          }
        });
        document.body.removeChild(buttons[1]);
        window.$$btns = buttons;
      })();
      (function() {
        document.getElementById('btn').addEventListener('click', function() {
          window.$$btns[1].click();
        });
      })();
      `, 'utf8')
    },*/
    '/reassignment_test.html': getHTMLConfig('reassignment_test'),
    '/reassignment_test.js': {
        mimeType: 'text/javascript',
        data: Buffer.from(`
    (function() {
      var obj = [];
      var i = 0;
      var power = 2;
      document.getElementById('btn').addEventListener('click', function() {
        var top = Math.pow(2, power);
        power++;
        for (var j = 0; j < top; j++) {
          obj = obj.concat({ val: Math.random() });
        }
      });
    })();
    `, 'utf8')
    },
    '/multiple_paths_test.html': getHTMLConfig('multiple_paths_test'),
    '/multiple_paths_test.js': {
        mimeType: 'text/javascript',
        data: Buffer.from(`(function() {
      var obj = {};
      var obj2 = obj;
      var i = 0;
      var power = 2;
      document.getElementById('btn').addEventListener('click', function() {
        var top = Math.pow(2, power);
        power++;
        for (var j = 0; j < top; j++) {
          if (obj === obj2) {
            var target = Math.random() > 0.5 ? obj : obj2;
            target[Math.random()] = Math.random();
          }
        }
      });
    })();
    `, 'utf8')
    },
    '/irrelevant_paths_test.html': getHTMLConfig('irrelevant_paths_test'),
    '/irrelevant_paths_test.js': {
        mimeType: 'text/javascript',
        data: Buffer.from(`var obj = {};
    var i = 0;
    var power = 2;
    document.getElementById('btn').addEventListener('click', function() {
      var top = Math.pow(2, power);
      power++;
      for (var j = 0; j < top; j++) {
        obj[Math.random()] = Math.random();
      }
      // Adds more properties, but properly deletes them.
      // Not a leak.
      var second = Math.random();
      obj[second] = second;
      delete obj[second];
    });`, 'utf8')
    },
    '/event_listener_leak.html': getHTMLConfig('event_listener_leak'),
    '/event_listener_leak.js': {
        mimeType: 'text/javascript',
        data: Buffer.from(`
    // Make unique functions so we can register many listeners.
    function getAddListener() {
      return function() {
        document.getElementById('btn').addEventListener('click', getAddListener()); document.getElementById('btn').addEventListener('click', getAddListener()); document.getElementById('btn').addEventListener('click', getAddListener()); document.getElementById('btn').addEventListener('click', getAddListener());
      };
    }
    getAddListener()();`, 'utf8')
    },
    '/event_listener_removal.html': getHTMLConfig('event_listener_removal'),
    '/event_listener_removal.js': {
        mimeType: 'text/javascript',
        data: Buffer.from(`
    // Make unique functions so we can register many listeners.
    function getAddListener() {
      return function() {
        document.getElementById('btn').addEventListener('click', getAddListener()); document.getElementById('btn').addEventListener('click', getAddListener()); document.getElementById('btn').addEventListener('click', getAddListener()); document.getElementById('btn').addEventListener('click', getAddListener());
      };
    }
    getAddListener()();
    // Responsible function
    document.getElementById('btn').addEventListener('click', function() {
      var b = document.getElementById('btn');
      var l = getAddListener();
      b.addEventListener('click', l);
      b.removeEventListener('click', l);
    });`, 'utf8')
    },
    '/dom_growth_test.html': getHTMLConfig('dom_growth_test'),
    '/dom_growth_test.js': {
        mimeType: 'text/javascript',
        data: Buffer.from(`var body = document.getElementsByTagName('body')[0];
    document.getElementById('btn').addEventListener('click', function() {
      body.appendChild(document.createElement('div'));
    });`, 'utf8')
    },
    '/bleak_agent.js': {
        mimeType: 'text/javascript',
        data: fs_1.readFileSync(require.resolve('../src/lib/bleak_agent'))
    }
};
describe('End-to-end Tests', function () {
    // 10 minute timeout.
    this.timeout(600000);
    let httpServer;
    let driver;
    before(async function () {
        httpServer = await http_server_1.default(FILES, HTTP_PORT);
        if (!DEBUG) {
            // Silence debug messages.
            console.debug = () => { };
        }
        driver = await chrome_driver_1.default.Launch(console, true, 1920, 1080);
    });
    function createStandardLeakTest(description, rootFilename, expected_line) {
        it(description, async function () {
            // let i = 0;
            const result = await bleak_1.default.FindLeaks(`
        exports.url = 'http://localhost:${HTTP_PORT}/${rootFilename}.html';
        // Due to throttling (esp. when browser is in background), it may take longer
        // than anticipated for the click we fire to actually run. We want to make
        // sure all snapshots occur after the click processes.
        var startedClickCount = 0;
        var completedClickCount = 0;
        exports.loop = [
          {
            name: 'Click Button',
            check: function() {
              return document.readyState === "complete" && startedClickCount === completedClickCount;
            },
            next: function() {
              startedClickCount++;
              if (completedClickCount === 0) {
                document.getElementById('btn').addEventListener('click', function() {
                  completedClickCount++;
                });
              }
              document.getElementById('btn').click();
            }
          }
        ];
        exports.timeout = 30000;
        exports.iterations = 3;
        exports.postCheckSleep = 100;
      `, new nop_progress_bar_1.default(), driver /*, (ss) => {
              const stream = createWriteStream(`${rootFilename}${i}.heapsnapshot`);
              ss.onSnapshotChunk = function(chunk, end) {
                stream.write(chunk);
                if (end) {
                  stream.end();
                }
              };
              i++;
              return Promise.resolve();
            }*/);
            assert_1.equal(result.leaks.length > 0, true);
            result.leaks.forEach((leak) => {
                const stacks = leak.stacks;
                assert_1.equal(stacks.length > 0, true);
                stacks.forEach((s) => {
                    assert_1.equal(s.length > 0, true);
                    const topFrame = result.stackFrames[s[0]];
                    //console.log(topFrame.toString());
                    assert_1.equal(topFrame[1], expected_line);
                    assert_1.equal(topFrame[0].indexOf(`${rootFilename}.js`) !== -1, true);
                });
            });
        });
    }
    createStandardLeakTest('Catches leaks', 'test', 8);
    createStandardLeakTest('Catches leaks in closures', 'closure_test', 9);
    createStandardLeakTest('Catches leaks in closures on dom', 'closure_test_dom', 9);
    createStandardLeakTest('Catches leaks in closures when event listener is assigned on a property', 'closure_test_dom_on_property', 9);
    createStandardLeakTest('Catches leaks in closures, even with irrelevant DOM objects', 'closure_test_irrelevant_dom', 9);
    createStandardLeakTest('Catches leaks in closures, even with disconnected DOM fragments', 'closure_test_disconnected_dom', 10);
    // Not supported.
    // createStandardLeakTest('Catches leaks in closures, even with disconnected DOM collections', 'closure_test_disconnected_dom_collection', 11);
    createStandardLeakTest('Catches leaks when object is copied and reassigned', 'reassignment_test', 10);
    createStandardLeakTest('Catches leaks when object stored in multiple paths', 'multiple_paths_test', 12);
    createStandardLeakTest('Ignores code that does not grow objects', 'irrelevant_paths_test', 8);
    createStandardLeakTest('Catches event listener leaks', 'event_listener_leak', 5);
    createStandardLeakTest('Ignores responsible event listener removal', 'event_listener_removal', 5);
    createStandardLeakTest('Catches leaks that grow DOM unboundedly', 'dom_growth_test', 3);
    after(function (done) {
        //setTimeout(function() {
        // Shutdown both HTTP server and proxy.
        function finish() {
            httpServer.close((e) => {
                if (e) {
                    done(e);
                }
                else {
                    driver.shutdown().then(() => {
                        done();
                    }).catch(done);
                }
            });
        }
        DEBUG ? setTimeout(finish, 99999999) : finish();
        //}, 99999999);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5kX3RvX2VuZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3Rlc3QvZW5kX3RvX2VuZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUNBLDRDQUFxQztBQUNyQyxvREFBa0Q7QUFDbEQsNERBQW9EO0FBQ3BELDJCQUFnQztBQUNoQyxtQ0FBNEM7QUFDNUMsa0VBQXlEO0FBRXpELE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQztBQUN2QixNQUFNLEtBQUssR0FBRyxLQUFLLENBQUM7QUFPcEIsb0JBQW9CLE1BQWM7SUFDaEMsTUFBTSxDQUFDO1FBQ0wsUUFBUSxFQUFFLFdBQVc7UUFDckIsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQztLQUNsQyxDQUFDO0FBQ0osQ0FBQztBQUVELHVCQUF1QixJQUFZO0lBQ2pDLE1BQU0sQ0FBQyxVQUFVLENBQUMscUNBQXFDLElBQUksK0ZBQStGLElBQUksOEJBQThCLENBQUMsQ0FBQztBQUNoTSxDQUFDO0FBRUQsMENBQTBDO0FBQzFDLE1BQU0sS0FBSyxHQUErQjtJQUN4QyxZQUFZLEVBQUUsYUFBYSxDQUFDLE1BQU0sQ0FBQztJQUNuQyxVQUFVLEVBQUU7UUFDVixRQUFRLEVBQUUsaUJBQWlCO1FBQzNCLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDOzs7Ozs7Ozs7O0tBVWpCLEVBQUUsTUFBTSxDQUFDO0tBQ1g7SUFDRCxvQkFBb0IsRUFBRSxhQUFhLENBQUMsY0FBYyxDQUFDO0lBQ25ELGtCQUFrQixFQUFFO1FBQ2xCLFFBQVEsRUFBRSxpQkFBaUI7UUFDM0IsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUM7Ozs7Ozs7Ozs7Ozs7O1FBY2QsQ0FBQztLQUNOO0lBQ0Qsd0JBQXdCLEVBQUUsYUFBYSxDQUFDLGtCQUFrQixDQUFDO0lBQzNELHNCQUFzQixFQUFFO1FBQ3RCLFFBQVEsRUFBRSxpQkFBaUI7UUFDM0IsSUFBSSxFQUFF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aUJBQWlCLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFFeEYsS0FBSyxDQUFDLFVBQVMsSUFBSTtRQUNqQix5QkFBeUI7UUFDekIsdUNBQXVDO1FBQ3ZDO1lBQ0UsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQU0sRUFBRSxFQUFFO2dCQUMxQixFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNOLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDVixDQUFDO2dCQUFDLElBQUksQ0FBQyxDQUFDO29CQUNOLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFO3dCQUMxQixJQUFJLEVBQUUsQ0FBQztvQkFDVCxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ2pCLENBQUM7WUFDSCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFDRCxLQUFLLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ2hELGVBQWU7SUFDakIsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7U2VydmVyIGFzIEhUVFBTZXJ2ZXJ9IGZyb20gJ2h0dHAnO1xuaW1wb3J0IEJMZWFrIGZyb20gJy4uL3NyYy9saWIvYmxlYWsnO1xuaW1wb3J0IGNyZWF0ZUhUVFBTZXJ2ZXIgZnJvbSAnLi91dGlsL2h0dHBfc2VydmVyJztcbmltcG9ydCBDaHJvbWVEcml2ZXIgZnJvbSAnLi4vc3JjL2xpYi9jaHJvbWVfZHJpdmVyJztcbmltcG9ydCB7cmVhZEZpbGVTeW5jfSBmcm9tICdmcyc7XG5pbXBvcnQge2VxdWFsIGFzIGFzc2VydEVxdWFsfSBmcm9tICdhc3NlcnQnO1xuaW1wb3J0IE5vcFByb2dyZXNzQmFyIGZyb20gJy4uL3NyYy9saWIvbm9wX3Byb2dyZXNzX2Jhcic7XG5cbmNvbnN0IEhUVFBfUE9SVCA9IDg4NzU7XG5jb25zdCBERUJVRyA9IGZhbHNlO1xuXG5pbnRlcmZhY2UgVGVzdEZpbGUge1xuICBtaW1lVHlwZTogc3RyaW5nO1xuICBkYXRhOiBCdWZmZXI7XG59XG5cbmZ1bmN0aW9uIGdldEhUTUxEb2MoZG9jU3RyOiBzdHJpbmcpOiB7IG1pbWVUeXBlOiBzdHJpbmcsIGRhdGE6IEJ1ZmZlciB9IHtcbiAgcmV0dXJuIHtcbiAgICBtaW1lVHlwZTogJ3RleHQvaHRtbCcsXG4gICAgZGF0YTogQnVmZmVyLmZyb20oZG9jU3RyLCAndXRmOCcpXG4gIH07XG59XG5cbmZ1bmN0aW9uIGdldEhUTUxDb25maWcobmFtZTogc3RyaW5nKTogeyBtaW1lVHlwZTogc3RyaW5nLCBkYXRhOiBCdWZmZXIgfSB7XG4gIHJldHVybiBnZXRIVE1MRG9jKGA8IURPQ1RZUEUgaHRtbD48aHRtbD48aGVhZD48dGl0bGU+JHtuYW1lfTwvdGl0bGU+PC9oZWFkPjxib2R5PjxidXR0b24gaWQ9XCJidG5cIj5DbGljayBNZTwvYnV0dG9uPjxzY3JpcHQgdHlwZT1cInRleHQvamF2YXNjcmlwdFwiIHNyYz1cIi8ke25hbWV9LmpzXCI+PC9zY3JpcHQ+PC9ib2R5PjwvaHRtbD5gKTtcbn1cblxuLy8gJ0ZpbGVzJyBwcmVzZW50IGluIHRoZSB0ZXN0IEhUVFAgc2VydmVyXG5jb25zdCBGSUxFUzoge1tuYW1lOiBzdHJpbmddOiBUZXN0RmlsZX0gPSB7XG4gICcvdGVzdC5odG1sJzogZ2V0SFRNTENvbmZpZygndGVzdCcpLFxuICAnL3Rlc3QuanMnOiB7XG4gICAgbWltZVR5cGU6ICd0ZXh0L2phdmFzY3JpcHQnLFxuICAgIGRhdGE6IEJ1ZmZlci5mcm9tKGB2YXIgb2JqID0ge307XG4gICAgdmFyIGkgPSAwO1xuICAgIHZhciBwb3dlciA9IDI7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2J0bicpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgdG9wID0gTWF0aC5wb3coMiwgcG93ZXIpO1xuICAgICAgcG93ZXIrKztcbiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdG9wOyBqKyspIHtcbiAgICAgICAgb2JqW01hdGgucmFuZG9tKCldID0gTWF0aC5yYW5kb20oKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBgLCAndXRmOCcpXG4gIH0sXG4gICcvY2xvc3VyZV90ZXN0Lmh0bWwnOiBnZXRIVE1MQ29uZmlnKCdjbG9zdXJlX3Rlc3QnKSxcbiAgJy9jbG9zdXJlX3Rlc3QuanMnOiB7XG4gICAgbWltZVR5cGU6ICd0ZXh0L2phdmFzY3JpcHQnLFxuICAgIGRhdGE6IEJ1ZmZlci5mcm9tKGAoZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgb2JqID0ge307XG4gICAgICB2YXIgaSA9IDA7XG4gICAgICB2YXIgcG93ZXIgPSAyO1xuICAgICAgd2luZG93Lm9iamZjbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdG9wID0gTWF0aC5wb3coMiwgcG93ZXIpO1xuICAgICAgICBwb3dlcisrO1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHRvcDsgaisrKSB7XG4gICAgICAgICAgb2JqW01hdGgucmFuZG9tKCldID0gTWF0aC5yYW5kb20oKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9KSgpO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdidG4nKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgd2luZG93Lm9iamZjbigpO1xuICAgIH0pO2ApXG4gIH0sXG4gICcvY2xvc3VyZV90ZXN0X2RvbS5odG1sJzogZ2V0SFRNTENvbmZpZygnY2xvc3VyZV90ZXN0X2RvbScpLFxuICAnL2Nsb3N1cmVfdGVzdF9kb20uanMnOiB7XG4gICAgbWltZVR5cGU6ICd0ZXh0L2phdmFzY3JpcHQnLFxuICAgIGRhdGE6IEJ1ZmZlci5mcm9tKGAoZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgb2JqID0ge307XG4gICAgICB2YXIgaSA9IDA7XG4gICAgICB2YXIgcG93ZXIgPSAyO1xuICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2J0bicpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB0b3AgPSBNYXRoLnBvdygyLCBwb3dlcik7XG4gICAgICAgIHBvd2VyKys7XG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdG9wOyBqKyspIHtcbiAgICAgICAgICBvYmpbTWF0aC5yYW5kb20oKV0gPSBNYXRoLnJhbmRvbSgpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KSgpO1xuICAgIGAsICd1dGY4JylcbiAgfSxcbiAgJy9jbG9zdXJlX3Rlc3RfZG9tX29uX3Byb3BlcnR5Lmh0bWwnOiBnZXRIVE1MQ29uZmlnKCdjbG9zdXJlX3Rlc3RfZG9tX29uX3Byb3BlcnR5JyksXG4gICcvY2xvc3VyZV90ZXN0X2RvbV9vbl9wcm9wZXJ0eS5qcyc6IHtcbiAgICBtaW1lVHlwZTogJ3RleHQvamF2YXNjcmlwdCcsXG4gICAgZGF0YTogQnVmZmVyLmZyb20oYChmdW5jdGlvbigpIHtcbiAgICAgIHZhciBvYmogPSB7fTtcbiAgICAgIHZhciBpID0gMDtcbiAgICAgIHZhciBwb3dlciA9IDI7XG4gICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYnRuJykub25jbGljayA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdG9wID0gTWF0aC5wb3coMiwgcG93ZXIpO1xuICAgICAgICBwb3dlcisrO1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHRvcDsgaisrKSB7XG4gICAgICAgICAgb2JqW01hdGgucmFuZG9tKCldID0gTWF0aC5yYW5kb20oKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9KSgpO1xuICAgIGAsICd1dGY4JylcbiAgfSxcbiAgJy9jbG9zdXJlX3Rlc3RfaXJyZWxldmFudF9kb20uaHRtbCc6IGdldEhUTUxEb2MoYDwhRE9DVFlQRSBodG1sPjxodG1sPjxoZWFkPjx0aXRsZT5DbG9zdXJlIHRlc3QgaXJyZWxldmFudCBkb208L3RpdGxlPjwvaGVhZD48Ym9keT48YnV0dG9uIGlkPVwiYnRuMlwiPkRvbid0IGNsaWNrIG1lPC9idXR0b24+PGJ1dHRvbiBpZD1cImJ0blwiPkNsaWNrIE1lPC9idXR0b24+PGJ1dHRvbiBpZD1cImJ0bjNcIj5Eb24ndCBjbGljayBtZSwgZWl0aGVyPC9idXR0b24+PHNjcmlwdCB0eXBlPVwidGV4dC9qYXZhc2NyaXB0XCIgc3JjPVwiL2Nsb3N1cmVfdGVzdF9pcnJlbGV2YW50X2RvbS5qc1wiPjwvc2NyaXB0PjwvYm9keT48L2h0bWw+YCksXG4gICcvY2xvc3VyZV90ZXN0X2lycmVsZXZhbnRfZG9tLmpzJzoge1xuICAgIG1pbWVUeXBlOiAndGV4dC9qYXZhc2NyaXB0JyxcbiAgICBkYXRhOiBCdWZmZXIuZnJvbShgKGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIG9iaiA9IHt9O1xuICAgICAgdmFyIGkgPSAwO1xuICAgICAgdmFyIHBvd2VyID0gMjtcbiAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdidG4nKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdG9wID0gTWF0aC5wb3coMiwgcG93ZXIpO1xuICAgICAgICBwb3dlcisrO1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHRvcDsgaisrKSB7XG4gICAgICAgICAgb2JqW01hdGgucmFuZG9tKCldID0gTWF0aC5yYW5kb20oKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSkoKTtcbiAgICBgLCAndXRmOCcpXG4gIH0sXG4gICcvY2xvc3VyZV90ZXN0X2Rpc2Nvbm5lY3RlZF9kb20uaHRtbCc6IGdldEhUTUxEb2MoYDwhRE9DVFlQRSBodG1sPjxodG1sPjxoZWFkPjx0aXRsZT5DbG9zdXJlIHRlc3QgZGlzY29ubmVjdGVkIGRvbTwvdGl0bGU+PC9oZWFkPjxib2R5PjxidXR0b24gaWQ9XCJidG5cIj5DbGljayBNZTwvYnV0dG9uPjxzY3JpcHQgdHlwZT1cInRleHQvamF2YXNjcmlwdFwiIHNyYz1cIi9jbG9zdXJlX3Rlc3RfZGlzY29ubmVjdGVkX2RvbS5qc1wiPjwvc2NyaXB0PjwvYm9keT48L2h0bWw+YCksXG4gICcvY2xvc3VyZV90ZXN0X2Rpc2Nvbm5lY3RlZF9kb20uanMnOiB7XG4gICAgbWltZVR5cGU6ICd0ZXh0L2phdmFzY3JpcHQnLFxuICAgIGRhdGE6IEJ1ZmZlci5mcm9tKGAoZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgb2JqID0ge307XG4gICAgICB2YXIgaSA9IDA7XG4gICAgICB2YXIgcG93ZXIgPSAyO1xuICAgICAgdmFyIGJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICAgICAgYnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB0b3AgPSBNYXRoLnBvdygyLCBwb3dlcik7XG4gICAgICAgIHBvd2VyKys7XG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdG9wOyBqKyspIHtcbiAgICAgICAgICBvYmpbTWF0aC5yYW5kb20oKV0gPSBNYXRoLnJhbmRvbSgpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHdpbmRvdy4kJGJ0biA9IGJ0bjtcbiAgICB9KSgpO1xuICAgIChmdW5jdGlvbigpIHtcbiAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdidG4nKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgICB3aW5kb3cuJCRidG4uY2xpY2soKTtcbiAgICAgIH0pO1xuICAgIH0pKCk7XG4gICAgYCwgJ3V0ZjgnKVxuICB9LFxuICAvKicvY2xvc3VyZV90ZXN0X2Rpc2Nvbm5lY3RlZF9kb21fY29sbGVjdGlvbi5odG1sJzogZ2V0SFRNTERvYyhgPCFET0NUWVBFIGh0bWw+PGh0bWw+PGhlYWQ+PHRpdGxlPkNsb3N1cmUgdGVzdCBkaXNjb25uZWN0ZWQgZG9tIGNvbGxlY3Rpb248L3RpdGxlPjwvaGVhZD48Ym9keT48YnV0dG9uIGlkPVwiYnRuXCI+Q2xpY2sgTWU8L2J1dHRvbj48c2NyaXB0IHR5cGU9XCJ0ZXh0L2phdmFzY3JpcHRcIiBzcmM9XCIvY2xvc3VyZV90ZXN0X2Rpc2Nvbm5lY3RlZF9kb21fY29sbGVjdGlvbi5qc1wiPjwvc2NyaXB0PjwvYm9keT48L2h0bWw+YCksXG4gICcvY2xvc3VyZV90ZXN0X2Rpc2Nvbm5lY3RlZF9kb21fY29sbGVjdGlvbi5qcyc6IHtcbiAgICBtaW1lVHlwZTogJ3RleHQvamF2YXNjcmlwdCcsXG4gICAgZGF0YTogQnVmZmVyLmZyb20oYChmdW5jdGlvbigpIHtcbiAgICAgIHZhciBvYmogPSB7fTtcbiAgICAgIHZhciBpID0gMDtcbiAgICAgIHZhciBwb3dlciA9IDI7XG4gICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpKTtcbiAgICAgIHZhciBidXR0b25zID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2J1dHRvbicpO1xuICAgICAgYnV0dG9uc1sxXS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdG9wID0gTWF0aC5wb3coMiwgcG93ZXIpO1xuICAgICAgICBwb3dlcisrO1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHRvcDsgaisrKSB7XG4gICAgICAgICAgb2JqW01hdGgucmFuZG9tKCldID0gTWF0aC5yYW5kb20oKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKGJ1dHRvbnNbMV0pO1xuICAgICAgd2luZG93LiQkYnRucyA9IGJ1dHRvbnM7XG4gICAgfSkoKTtcbiAgICAoZnVuY3Rpb24oKSB7XG4gICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYnRuJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgd2luZG93LiQkYnRuc1sxXS5jbGljaygpO1xuICAgICAgfSk7XG4gICAgfSkoKTtcbiAgICBgLCAndXRmOCcpXG4gIH0sKi9cbiAgJy9yZWFzc2lnbm1lbnRfdGVzdC5odG1sJzogZ2V0SFRNTENvbmZpZygncmVhc3NpZ25tZW50X3Rlc3QnKSxcbiAgJy9yZWFzc2lnbm1lbnRfdGVzdC5qcyc6IHtcbiAgICBtaW1lVHlwZTogJ3RleHQvamF2YXNjcmlwdCcsXG4gICAgZGF0YTogQnVmZmVyLmZyb20oYFxuICAgIChmdW5jdGlvbigpIHtcbiAgICAgIHZhciBvYmogPSBbXTtcbiAgICAgIHZhciBpID0gMDtcbiAgICAgIHZhciBwb3dlciA9IDI7XG4gICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYnRuJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHRvcCA9IE1hdGgucG93KDIsIHBvd2VyKTtcbiAgICAgICAgcG93ZXIrKztcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB0b3A7IGorKykge1xuICAgICAgICAgIG9iaiA9IG9iai5jb25jYXQoeyB2YWw6IE1hdGgucmFuZG9tKCkgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pKCk7XG4gICAgYCwgJ3V0ZjgnKVxuICB9LFxuICAnL211bHRpcGxlX3BhdGhzX3Rlc3QuaHRtbCc6IGdldEhUTUxDb25maWcoJ211bHRpcGxlX3BhdGhzX3Rlc3QnKSxcbiAgJy9tdWx0aXBsZV9wYXRoc190ZXN0LmpzJzoge1xuICAgIG1pbWVUeXBlOiAndGV4dC9qYXZhc2NyaXB0JyxcbiAgICBkYXRhOiBCdWZmZXIuZnJvbShgKGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIG9iaiA9IHt9O1xuICAgICAgdmFyIG9iajIgPSBvYmo7XG4gICAgICB2YXIgaSA9IDA7XG4gICAgICB2YXIgcG93ZXIgPSAyO1xuICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2J0bicpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB0b3AgPSBNYXRoLnBvdygyLCBwb3dlcik7XG4gICAgICAgIHBvd2VyKys7XG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdG9wOyBqKyspIHtcbiAgICAgICAgICBpZiAob2JqID09PSBvYmoyKSB7XG4gICAgICAgICAgICB2YXIgdGFyZ2V0ID0gTWF0aC5yYW5kb20oKSA+IDAuNSA/IG9iaiA6IG9iajI7XG4gICAgICAgICAgICB0YXJnZXRbTWF0aC5yYW5kb20oKV0gPSBNYXRoLnJhbmRvbSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSkoKTtcbiAgICBgLCAndXRmOCcpXG4gIH0sXG4gICcvaXJyZWxldmFudF9wYXRoc190ZXN0Lmh0bWwnOiBnZXRIVE1MQ29uZmlnKCdpcnJlbGV2YW50X3BhdGhzX3Rlc3QnKSxcbiAgJy9pcnJlbGV2YW50X3BhdGhzX3Rlc3QuanMnOiB7XG4gICAgbWltZVR5cGU6ICd0ZXh0L2phdmFzY3JpcHQnLFxuICAgIGRhdGE6IEJ1ZmZlci5mcm9tKGB2YXIgb2JqID0ge307XG4gICAgdmFyIGkgPSAwO1xuICAgIHZhciBwb3dlciA9IDI7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2J0bicpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgdG9wID0gTWF0aC5wb3coMiwgcG93ZXIpO1xuICAgICAgcG93ZXIrKztcbiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdG9wOyBqKyspIHtcbiAgICAgICAgb2JqW01hdGgucmFuZG9tKCldID0gTWF0aC5yYW5kb20oKTtcbiAgICAgIH1cbiAgICAgIC8vIEFkZHMgbW9yZSBwcm9wZXJ0aWVzLCBidXQgcHJvcGVybHkgZGVsZXRlcyB0aGVtLlxuICAgICAgLy8gTm90IGEgbGVhay5cbiAgICAgIHZhciBzZWNvbmQgPSBNYXRoLnJhbmRvbSgpO1xuICAgICAgb2JqW3NlY29uZF0gPSBzZWNvbmQ7XG4gICAgICBkZWxldGUgb2JqW3NlY29uZF07XG4gICAgfSk7YCwgJ3V0ZjgnKVxuICB9LFxuICAnL2V2ZW50X2xpc3RlbmVyX2xlYWsuaHRtbCc6IGdldEhUTUxDb25maWcoJ2V2ZW50X2xpc3RlbmVyX2xlYWsnKSxcbiAgJy9ldmVudF9saXN0ZW5lcl9sZWFrLmpzJzoge1xuICAgIG1pbWVUeXBlOiAndGV4dC9qYXZhc2NyaXB0JyxcbiAgICBkYXRhOiBCdWZmZXIuZnJvbShgXG4gICAgLy8gTWFrZSB1bmlxdWUgZnVuY3Rpb25zIHNvIHdlIGNhbiByZWdpc3RlciBtYW55IGxpc3RlbmVycy5cbiAgICBmdW5jdGlvbiBnZXRBZGRMaXN0ZW5lcigpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2J0bicpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZ2V0QWRkTGlzdGVuZXIoKSk7IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdidG4nKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGdldEFkZExpc3RlbmVyKCkpOyBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYnRuJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBnZXRBZGRMaXN0ZW5lcigpKTsgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2J0bicpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZ2V0QWRkTGlzdGVuZXIoKSk7XG4gICAgICB9O1xuICAgIH1cbiAgICBnZXRBZGRMaXN0ZW5lcigpKCk7YCwgJ3V0ZjgnKVxuICB9LFxuICAnL2V2ZW50X2xpc3RlbmVyX3JlbW92YWwuaHRtbCc6IGdldEhUTUxDb25maWcoJ2V2ZW50X2xpc3RlbmVyX3JlbW92YWwnKSxcbiAgJy9ldmVudF9saXN0ZW5lcl9yZW1vdmFsLmpzJzoge1xuICAgIG1pbWVUeXBlOiAndGV4dC9qYXZhc2NyaXB0JyxcbiAgICBkYXRhOiBCdWZmZXIuZnJvbShgXG4gICAgLy8gTWFrZSB1bmlxdWUgZnVuY3Rpb25zIHNvIHdlIGNhbiByZWdpc3RlciBtYW55IGxpc3RlbmVycy5cbiAgICBmdW5jdGlvbiBnZXRBZGRMaXN0ZW5lcigpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2J0bicpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZ2V0QWRkTGlzdGVuZXIoKSk7IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdidG4nKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGdldEFkZExpc3RlbmVyKCkpOyBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYnRuJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBnZXRBZGRMaXN0ZW5lcigpKTsgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2J0bicpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZ2V0QWRkTGlzdGVuZXIoKSk7XG4gICAgICB9O1xuICAgIH1cbiAgICBnZXRBZGRMaXN0ZW5lcigpKCk7XG4gICAgLy8gUmVzcG9uc2libGUgZnVuY3Rpb25cbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYnRuJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBiID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2J0bicpO1xuICAgICAgdmFyIGwgPSBnZXRBZGRMaXN0ZW5lcigpO1xuICAgICAgYi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGwpO1xuICAgICAgYi5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsIGwpO1xuICAgIH0pO2AsICd1dGY4JylcbiAgfSxcbiAgJy9kb21fZ3Jvd3RoX3Rlc3QuaHRtbCc6IGdldEhUTUxDb25maWcoJ2RvbV9ncm93dGhfdGVzdCcpLFxuICAnL2RvbV9ncm93dGhfdGVzdC5qcyc6IHtcbiAgICBtaW1lVHlwZTogJ3RleHQvamF2YXNjcmlwdCcsXG4gICAgZGF0YTogQnVmZmVyLmZyb20oYHZhciBib2R5ID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2JvZHknKVswXTtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYnRuJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgIGJvZHkuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JykpO1xuICAgIH0pO2AsICd1dGY4JylcbiAgfSxcbiAgJy9ibGVha19hZ2VudC5qcyc6IHtcbiAgICBtaW1lVHlwZTogJ3RleHQvamF2YXNjcmlwdCcsXG4gICAgZGF0YTogcmVhZEZpbGVTeW5jKHJlcXVpcmUucmVzb2x2ZSgnLi4vc3JjL2xpYi9ibGVha19hZ2VudCcpKVxuICB9XG59O1xuXG5kZXNjcmliZSgnRW5kLXRvLWVuZCBUZXN0cycsIGZ1bmN0aW9uKCkge1xuICAvLyAxMCBtaW51dGUgdGltZW91dC5cbiAgdGhpcy50aW1lb3V0KDYwMDAwMCk7XG4gIGxldCBodHRwU2VydmVyOiBIVFRQU2VydmVyO1xuICBsZXQgZHJpdmVyOiBDaHJvbWVEcml2ZXI7XG4gIGJlZm9yZShhc3luYyBmdW5jdGlvbigpIHtcbiAgICBodHRwU2VydmVyID0gYXdhaXQgY3JlYXRlSFRUUFNlcnZlcihGSUxFUywgSFRUUF9QT1JUKTtcbiAgICBpZiAoIURFQlVHKSB7XG4gICAgICAvLyBTaWxlbmNlIGRlYnVnIG1lc3NhZ2VzLlxuICAgICAgY29uc29sZS5kZWJ1ZyA9ICgpID0+IHt9O1xuICAgIH1cbiAgICBkcml2ZXIgPSBhd2FpdCBDaHJvbWVEcml2ZXIuTGF1bmNoKGNvbnNvbGUsIHRydWUsIDE5MjAsIDEwODApO1xuICB9KTtcblxuICBmdW5jdGlvbiBjcmVhdGVTdGFuZGFyZExlYWtUZXN0KGRlc2NyaXB0aW9uOiBzdHJpbmcsIHJvb3RGaWxlbmFtZTogc3RyaW5nLCBleHBlY3RlZF9saW5lOiBudW1iZXIpOiB2b2lkIHtcbiAgICBpdChkZXNjcmlwdGlvbiwgYXN5bmMgZnVuY3Rpb24oKSB7XG4gICAgICAvLyBsZXQgaSA9IDA7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBCTGVhay5GaW5kTGVha3MoYFxuICAgICAgICBleHBvcnRzLnVybCA9ICdodHRwOi8vbG9jYWxob3N0OiR7SFRUUF9QT1JUfS8ke3Jvb3RGaWxlbmFtZX0uaHRtbCc7XG4gICAgICAgIC8vIER1ZSB0byB0aHJvdHRsaW5nIChlc3AuIHdoZW4gYnJvd3NlciBpcyBpbiBiYWNrZ3JvdW5kKSwgaXQgbWF5IHRha2UgbG9uZ2VyXG4gICAgICAgIC8vIHRoYW4gYW50aWNpcGF0ZWQgZm9yIHRoZSBjbGljayB3ZSBmaXJlIHRvIGFjdHVhbGx5IHJ1bi4gV2Ugd2FudCB0byBtYWtlXG4gICAgICAgIC8vIHN1cmUgYWxsIHNuYXBzaG90cyBvY2N1ciBhZnRlciB0aGUgY2xpY2sgcHJvY2Vzc2VzLlxuICAgICAgICB2YXIgc3RhcnRlZENsaWNrQ291bnQgPSAwO1xuICAgICAgICB2YXIgY29tcGxldGVkQ2xpY2tDb3VudCA9IDA7XG4gICAgICAgIGV4cG9ydHMubG9vcCA9IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBuYW1lOiAnQ2xpY2sgQnV0dG9uJyxcbiAgICAgICAgICAgIGNoZWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGRvY3VtZW50LnJlYWR5U3RhdGUgPT09IFwiY29tcGxldGVcIiAmJiBzdGFydGVkQ2xpY2tDb3VudCA9PT0gY29tcGxldGVkQ2xpY2tDb3VudDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBuZXh0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgc3RhcnRlZENsaWNrQ291bnQrKztcbiAgICAgICAgICAgICAgaWYgKGNvbXBsZXRlZENsaWNrQ291bnQgPT09IDApIHtcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYnRuJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgIGNvbXBsZXRlZENsaWNrQ291bnQrKztcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYnRuJykuY2xpY2soKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIF07XG4gICAgICAgIGV4cG9ydHMudGltZW91dCA9IDMwMDAwO1xuICAgICAgICBleHBvcnRzLml0ZXJhdGlvbnMgPSAzO1xuICAgICAgICBleHBvcnRzLnBvc3RDaGVja1NsZWVwID0gMTAwO1xuICAgICAgYCwgbmV3IE5vcFByb2dyZXNzQmFyKCksIGRyaXZlci8qLCAoc3MpID0+IHtcbiAgICAgICAgY29uc3Qgc3RyZWFtID0gY3JlYXRlV3JpdGVTdHJlYW0oYCR7cm9vdEZpbGVuYW1lfSR7aX0uaGVhcHNuYXBzaG90YCk7XG4gICAgICAgIHNzLm9uU25hcHNob3RDaHVuayA9IGZ1bmN0aW9uKGNodW5rLCBlbmQpIHtcbiAgICAgICAgICBzdHJlYW0ud3JpdGUoY2h1bmspO1xuICAgICAgICAgIGlmIChlbmQpIHtcbiAgICAgICAgICAgIHN0cmVhbS5lbmQoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGkrKztcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgfSovKTtcbiAgICAgIGFzc2VydEVxdWFsKHJlc3VsdC5sZWFrcy5sZW5ndGggPiAwLCB0cnVlKTtcbiAgICAgIHJlc3VsdC5sZWFrcy5mb3JFYWNoKChsZWFrKSA9PiB7XG4gICAgICAgIGNvbnN0IHN0YWNrcyA9IGxlYWsuc3RhY2tzO1xuICAgICAgICBhc3NlcnRFcXVhbChzdGFja3MubGVuZ3RoID4gMCwgdHJ1ZSk7XG4gICAgICAgIHN0YWNrcy5mb3JFYWNoKChzKSA9PiB7XG4gICAgICAgICAgYXNzZXJ0RXF1YWwocy5sZW5ndGggPiAwLCB0cnVlKTtcbiAgICAgICAgICBjb25zdCB0b3BGcmFtZSA9IHJlc3VsdC5zdGFja0ZyYW1lc1tzWzBdXTtcbiAgICAgICAgICAvL2NvbnNvbGUubG9nKHRvcEZyYW1lLnRvU3RyaW5nKCkpO1xuICAgICAgICAgIGFzc2VydEVxdWFsKHRvcEZyYW1lWzFdLCBleHBlY3RlZF9saW5lKTtcbiAgICAgICAgICBhc3NlcnRFcXVhbCh0b3BGcmFtZVswXS5pbmRleE9mKGAke3Jvb3RGaWxlbmFtZX0uanNgKSAhPT0gLTEsIHRydWUpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgY3JlYXRlU3RhbmRhcmRMZWFrVGVzdCgnQ2F0Y2hlcyBsZWFrcycsICd0ZXN0JywgOCk7XG4gIGNyZWF0ZVN0YW5kYXJkTGVha1Rlc3QoJ0NhdGNoZXMgbGVha3MgaW4gY2xvc3VyZXMnLCAnY2xvc3VyZV90ZXN0JywgOSk7XG4gIGNyZWF0ZVN0YW5kYXJkTGVha1Rlc3QoJ0NhdGNoZXMgbGVha3MgaW4gY2xvc3VyZXMgb24gZG9tJywgJ2Nsb3N1cmVfdGVzdF9kb20nLCA5KTtcbiAgY3JlYXRlU3RhbmRhcmRMZWFrVGVzdCgnQ2F0Y2hlcyBsZWFrcyBpbiBjbG9zdXJlcyB3aGVuIGV2ZW50IGxpc3RlbmVyIGlzIGFzc2lnbmVkIG9uIGEgcHJvcGVydHknLCAnY2xvc3VyZV90ZXN0X2RvbV9vbl9wcm9wZXJ0eScsIDkpO1xuICBjcmVhdGVTdGFuZGFyZExlYWtUZXN0KCdDYXRjaGVzIGxlYWtzIGluIGNsb3N1cmVzLCBldmVuIHdpdGggaXJyZWxldmFudCBET00gb2JqZWN0cycsICdjbG9zdXJlX3Rlc3RfaXJyZWxldmFudF9kb20nLCA5KTtcbiAgY3JlYXRlU3RhbmRhcmRMZWFrVGVzdCgnQ2F0Y2hlcyBsZWFrcyBpbiBjbG9zdXJlcywgZXZlbiB3aXRoIGRpc2Nvbm5lY3RlZCBET00gZnJhZ21lbnRzJywgJ2Nsb3N1cmVfdGVzdF9kaXNjb25uZWN0ZWRfZG9tJywgMTApO1xuICAvLyBOb3Qgc3VwcG9ydGVkLlxuICAvLyBjcmVhdGVTdGFuZGFyZExlYWtUZXN0KCdDYXRjaGVzIGxlYWtzIGluIGNsb3N1cmVzLCBldmVuIHdpdGggZGlzY29ubmVjdGVkIERPTSBjb2xsZWN0aW9ucycsICdjbG9zdXJlX3Rlc3RfZGlzY29ubmVjdGVkX2RvbV9jb2xsZWN0aW9uJywgMTEpO1xuICBjcmVhdGVTdGFuZGFyZExlYWtUZXN0KCdDYXRjaGVzIGxlYWtzIHdoZW4gb2JqZWN0IGlzIGNvcGllZCBhbmQgcmVhc3NpZ25lZCcsICdyZWFzc2lnbm1lbnRfdGVzdCcsIDEwKTtcbiAgY3JlYXRlU3RhbmRhcmRMZWFrVGVzdCgnQ2F0Y2hlcyBsZWFrcyB3aGVuIG9iamVjdCBzdG9yZWQgaW4gbXVsdGlwbGUgcGF0aHMnLCAnbXVsdGlwbGVfcGF0aHNfdGVzdCcsIDEyKTtcbiAgY3JlYXRlU3RhbmRhcmRMZWFrVGVzdCgnSWdub3JlcyBjb2RlIHRoYXQgZG9lcyBub3QgZ3JvdyBvYmplY3RzJywgJ2lycmVsZXZhbnRfcGF0aHNfdGVzdCcsIDgpO1xuICBjcmVhdGVTdGFuZGFyZExlYWtUZXN0KCdDYXRjaGVzIGV2ZW50IGxpc3RlbmVyIGxlYWtzJywgJ2V2ZW50X2xpc3RlbmVyX2xlYWsnLCA1KTtcbiAgY3JlYXRlU3RhbmRhcmRMZWFrVGVzdCgnSWdub3JlcyByZXNwb25zaWJsZSBldmVudCBsaXN0ZW5lciByZW1vdmFsJywgJ2V2ZW50X2xpc3RlbmVyX3JlbW92YWwnLCA1KTtcbiAgY3JlYXRlU3RhbmRhcmRMZWFrVGVzdCgnQ2F0Y2hlcyBsZWFrcyB0aGF0IGdyb3cgRE9NIHVuYm91bmRlZGx5JywgJ2RvbV9ncm93dGhfdGVzdCcsIDMpO1xuXG4gIGFmdGVyKGZ1bmN0aW9uKGRvbmUpIHtcbiAgICAvL3NldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgLy8gU2h1dGRvd24gYm90aCBIVFRQIHNlcnZlciBhbmQgcHJveHkuXG4gICAgZnVuY3Rpb24gZmluaXNoKCkge1xuICAgICAgaHR0cFNlcnZlci5jbG9zZSgoZTogYW55KSA9PiB7XG4gICAgICAgIGlmIChlKSB7XG4gICAgICAgICAgZG9uZShlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkcml2ZXIuc2h1dGRvd24oKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIGRvbmUoKTtcbiAgICAgICAgICB9KS5jYXRjaChkb25lKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICAgIERFQlVHID8gc2V0VGltZW91dChmaW5pc2gsIDk5OTk5OTk5KSA6IGZpbmlzaCgpO1xuICAgIC8vfSwgOTk5OTk5OTkpO1xuICB9KTtcbn0pOyJdfQ==