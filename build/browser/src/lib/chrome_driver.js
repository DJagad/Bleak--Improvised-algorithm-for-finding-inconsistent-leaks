import * as tslib_1 from "tslib";
import HeapSnapshotParser from '../lib/heap_snapshot_parser';
import { createSession } from 'chrome-debugging-client';
import { HeapProfiler as ChromeHeapProfiler, Network as ChromeNetwork, Console as ChromeConsole, Page as ChromePage, Runtime as ChromeRuntime, DOM as ChromeDOM } from "chrome-debugging-client/dist/protocol/tot";
import { accessSync } from 'fs';
import { join } from 'path';
import * as repl from 'repl';
import { parse as parseJavaScript } from 'esprima';
import * as childProcess from 'child_process';
import MITMProxy from 'mitmproxy';
import { platform } from 'os';
import { wait } from '../common/util';
// HACK: Patch spawn to work around chrome-debugging-client limitation
// https://github.com/krisselden/chrome-debugging-client/issues/10
var originalSpawn = childProcess.spawn;
childProcess.spawn = function (command, args, options) {
    if (args && Array.isArray(args)) {
        var index = args.indexOf("--no-proxy-server");
        if (index !== -1) {
            args.splice(index, 1);
        }
    }
    return originalSpawn.call(this, command, args, options);
};
function exceptionDetailsToString(e) {
    return e.url + ":" + e.lineNumber + ":" + e.columnNumber + " " + e.text + " " + (e.exception ? e.exception.description : "") + "\n" + (e.stackTrace ? e.stackTrace.description : "") + "\n  " + (e.stackTrace ? e.stackTrace.callFrames.filter(function (f) { return f.url !== ""; }).map(function (f) { return "" + (f.functionName ? f.functionName + " at " : "") + f.url + ":" + f.lineNumber + ":" + f.columnNumber; }).join("\n  ") : "") + "\n";
}
/**
 * Spawns a chrome instance with a tmp user data and the debugger open to an ephemeral port
 */
function spawnChromeBrowser(session, headless, width, height) {
    var additionalChromeArgs = ["--proxy-server=127.0.0.1:8080", "--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-renderer-priority-management"];
    if (headless) {
        // --disable-gpu required for Windows
        additionalChromeArgs.push("--headless", "--disable-gpu");
    }
    var baseOptions = {
        // additionalArguments: ['--headless'],
        windowSize: { width: width, height: height },
        additionalArguments: additionalChromeArgs
    };
    switch (platform()) {
        case 'darwin':
            return session.spawnBrowser("system", baseOptions);
        case 'freebsd':
        case 'linux':
        case 'openbsd': {
            // *nix; need to find the exact path to Chrome / Chromium
            // .trim() removes trailing newline from `which` output.
            var chromePath = childProcess.execSync("which google-chrome").toString().trim();
            if (chromePath === "") {
                // Try Chromium
                chromePath = childProcess.execSync("which chromium").toString().trim();
            }
            if (chromePath === "") {
                return Promise.reject("Unable to find a Google Chrome or Chromium installation.");
            }
            return session.spawnBrowser("exact", Object.assign({
                executablePath: chromePath
            }, baseOptions));
        }
        case 'win32': {
            // Inspired by karma-chrome-launcher
            // https://github.com/karma-runner/karma-chrome-launcher/blob/master/index.js
            var suffix = "\\Google\\Chrome\\Application\\chrome.exe";
            var prefixes = [process.env.LOCALAPPDATA, process.env.PROGRAMFILES, process.env['PROGRAMFILES(X86)']];
            for (var _i = 0, prefixes_1 = prefixes; _i < prefixes_1.length; _i++) {
                var prefix = prefixes_1[_i];
                try {
                    var chromeLocation = join(prefix, suffix);
                    accessSync(chromeLocation);
                    return session.spawnBrowser("exact", Object.assign({
                        executablePath: chromeLocation
                    }, baseOptions));
                }
                catch (e) { }
            }
            return Promise.reject("Unable to find a Chrome installation");
        }
        default:
            // Esoteric options
            return Promise.reject("Unsupported platform: " + platform());
    }
}
var ChromeDriver = /** @class */ (function () {
    function ChromeDriver(log, headless, width, height, interceptPaths, quiet, mitmProxy, process, page, runtime, heapProfiler, console) {
        var _this = this;
        this._loadedFrames = new Set();
        this._shutdown = false;
        this._log = log;
        this._headless = headless;
        this.mitmProxy = mitmProxy;
        this._process = process;
        this._runtime = runtime;
        this._page = page;
        this._heapProfiler = heapProfiler;
        this._console = console;
        this._width = width;
        this._height = height;
        this._interceptPaths = interceptPaths;
        this._quiet = quiet;
        this._console.messageAdded = function (evt) {
            var m = evt.message;
            log.debug("[" + m.level + "] [" + m.source + "] " + m.url + ":" + m.line + ":" + m.column + " " + m.text);
        };
        this._runtime.exceptionThrown = function (evt) {
            var e = evt.exceptionDetails;
            log.error(exceptionDetailsToString(e));
        };
        this._page.frameStoppedLoading = function (e) {
            _this._loadedFrames.add(e.frameId);
        };
    }
    ChromeDriver.Launch = function (log, headless, width, height, interceptPaths, quiet) {
        if (interceptPaths === void 0) { interceptPaths = []; }
        if (quiet === void 0) { quiet = true; }
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var mitmProxy, session, chromeProcess, client, tabs, tab, debugClient, heapProfiler, network, chromeConsole, page, runtime, dom, driver;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, MITMProxy.Create(undefined, interceptPaths, quiet)];
                    case 1:
                        mitmProxy = _a.sent();
                        // Tell mitmProxy to stash data requested through the proxy.
                        mitmProxy.stashEnabled = true;
                        return [4 /*yield*/, new Promise(function (res, rej) { return createSession(res); })];
                    case 2:
                        session = _a.sent();
                        return [4 /*yield*/, spawnChromeBrowser(session, headless, width, height)];
                    case 3:
                        chromeProcess = _a.sent();
                        client = session.createAPIClient("localhost", chromeProcess.remoteDebuggingPort);
                        return [4 /*yield*/, client.listTabs()];
                    case 4:
                        tabs = _a.sent();
                        tab = tabs[0];
                        return [4 /*yield*/, client.activateTab(tab.id)];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, session.openDebuggingProtocol(tab.webSocketDebuggerUrl)];
                    case 6:
                        debugClient = _a.sent();
                        heapProfiler = new ChromeHeapProfiler(debugClient);
                        network = new ChromeNetwork(debugClient);
                        chromeConsole = new ChromeConsole(debugClient);
                        page = new ChromePage(debugClient);
                        runtime = new ChromeRuntime(debugClient);
                        dom = new ChromeDOM(debugClient);
                        return [4 /*yield*/, Promise.all([heapProfiler.enable(), network.enable({}), chromeConsole.enable(), page.enable(), runtime.enable(), dom.enable()])];
                    case 7:
                        _a.sent();
                        // Intercept network requests.
                        // await network.setRequestInterceptionEnabled({ enabled: true });
                        // Disable cache
                        return [4 /*yield*/, network.setCacheDisabled({ cacheDisabled: true })];
                    case 8:
                        // Intercept network requests.
                        // await network.setRequestInterceptionEnabled({ enabled: true });
                        // Disable cache
                        _a.sent();
                        // Disable service workers
                        return [4 /*yield*/, network.setBypassServiceWorker({ bypass: true })];
                    case 9:
                        // Disable service workers
                        _a.sent();
                        driver = new ChromeDriver(log, headless, width, height, interceptPaths, quiet, mitmProxy, chromeProcess, page, runtime, heapProfiler, chromeConsole);
                        return [2 /*return*/, driver];
                }
            });
        });
    };
    ChromeDriver.prototype.takeScreenshot = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var ss;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._page.captureScreenshot({})];
                    case 1:
                        ss = _a.sent();
                        return [2 /*return*/, Buffer.from(ss.data, 'base64')];
                }
            });
        });
    };
    ChromeDriver.prototype.relaunch = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var driver;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.shutdown()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, ChromeDriver.Launch(this._log, this._headless, this._width, this._height, this._interceptPaths, this._quiet)];
                    case 2:
                        driver = _a.sent();
                        driver.mitmProxy.cb = this.mitmProxy.cb;
                        return [2 /*return*/, driver];
                }
            });
        });
    };
    ChromeDriver.prototype.navigateTo = function (url) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var f;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this._loadedFrames.clear();
                        return [4 /*yield*/, this._page.navigate({ url: url })];
                    case 1:
                        f = _a.sent();
                        _a.label = 2;
                    case 2:
                        if (!!this._loadedFrames.has(f.frameId)) return [3 /*break*/, 4];
                        if (this._shutdown) {
                            return [2 /*return*/, Promise.reject("Cannot navigate to URL; Chrome has shut down.")];
                        }
                        return [4 /*yield*/, wait(5)];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 2];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    ChromeDriver.prototype.runCode = function (expression) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var e;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._runtime.evaluate({ expression: expression, returnByValue: true })];
                    case 1:
                        e = _a.sent();
                        this._log.debug(expression + " => " + JSON.stringify(e.result.value));
                        if (e.exceptionDetails) {
                            return [2 /*return*/, Promise.reject(exceptionDetailsToString(e.exceptionDetails))];
                        }
                        return [2 /*return*/, e.result.value];
                }
            });
        });
    };
    ChromeDriver.prototype.takeHeapSnapshot = function () {
        var _this = this;
        var parser = new HeapSnapshotParser();
        // 200 KB chunks
        this._heapProfiler.addHeapSnapshotChunk = function (evt) {
            parser.addSnapshotChunk(evt.chunk);
        };
        // Always take a DOM snapshot before taking a real snapshot.
        this._takeDOMSnapshot().then(function () {
            _this._heapProfiler.takeHeapSnapshot({ reportProgress: false });
        });
        return parser;
    };
    ChromeDriver.prototype._takeDOMSnapshot = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var response;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._runtime.evaluate({
                            expression: "$$$SERIALIZE_DOM$$$()", returnByValue: true
                        })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.result.value];
                }
            });
        });
    };
    ChromeDriver.prototype.debugLoop = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            var evalJavascript;
            return tslib_1.__generator(this, function (_a) {
                evalJavascript = function (cmd, context, filename, callback) {
                    try {
                        parseJavaScript(cmd);
                        _this.runCode(cmd).then(function (result) {
                            callback(null, "" + result);
                        }).catch(callback);
                    }
                    catch (e) {
                        callback(new repl.Recoverable(e));
                    }
                };
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var r = repl.start({ prompt: "> ", eval: evalJavascript });
                        r.on('exit', resolve);
                    })];
            });
        });
    };
    ChromeDriver.prototype.shutdown = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this._shutdown = true;
                        return [4 /*yield*/, Promise.all([this._process.dispose(), this.mitmProxy.shutdown()])];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return ChromeDriver;
}());
export default ChromeDriver;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hyb21lX2RyaXZlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9saWIvY2hyb21lX2RyaXZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxrQkFBa0IsTUFBTSw2QkFBNkIsQ0FBQztBQUM3RCxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFFdEQsT0FBTyxFQUFDLFlBQVksSUFBSSxrQkFBa0IsRUFBRSxPQUFPLElBQUksYUFBYSxFQUFFLE9BQU8sSUFBSSxhQUFhLEVBQUUsSUFBSSxJQUFJLFVBQVUsRUFBRSxPQUFPLElBQUksYUFBYSxFQUFFLEdBQUcsSUFBSSxTQUFTLEVBQUMsTUFBTSwyQ0FBMkMsQ0FBQztBQUNqTixPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sSUFBSSxDQUFDO0FBQzlCLE9BQU8sRUFBQyxJQUFJLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDMUIsT0FBTyxLQUFLLElBQUksTUFBTSxNQUFNLENBQUM7QUFDN0IsT0FBTyxFQUFDLEtBQUssSUFBSSxlQUFlLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFDakQsT0FBTyxLQUFLLFlBQVksTUFBTSxlQUFlLENBQUM7QUFDOUMsT0FBTyxTQUFTLE1BQU0sV0FBVyxDQUFDO0FBQ2xDLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxJQUFJLENBQUM7QUFFNUIsT0FBTyxFQUFDLElBQUksRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRXBDLHNFQUFzRTtBQUN0RSxrRUFBa0U7QUFDbEUsSUFBTSxhQUFhLEdBQUcsWUFBWSxDQUFDLEtBQUssQ0FBQztBQUNsQyxZQUFhLENBQUMsS0FBSyxHQUFHLFVBQVMsT0FBZSxFQUFFLElBQWUsRUFBRSxPQUFtQztJQUN6RyxFQUFFLENBQUMsQ0FBQyxJQUFJLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDaEMsSUFBTSxLQUFLLEdB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QUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFDWCxRQUFRLENBQUMsSUFBVSxJQUFLLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQzNDLENBQUM7Z0JBQ0gsQ0FBQyxDQUFDO2dCQUNGLHNCQUFPLElBQUksT0FBTyxDQUFPLFVBQUMsT0FBTyxFQUFFLE1BQU07d0JBQ3ZDLElBQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxjQUFjLEVBQUUsQ0FBQyxDQUFDO3dCQUM3RCxDQUFDLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztvQkFDeEIsQ0FBQyxDQUFDLEVBQUM7OztLQUNKO0lBQ1ksK0JBQVEsR0FBckI7Ozs7O3dCQUNFLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO3dCQUN0QixxQkFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsRUFBQTs7d0JBQXZFLFNBQXVFLENBQUM7Ozs7O0tBQ3pFO0lBQ0gsbUJBQUM7QUFBRCxDQUFDLEFBcEpELElBb0pDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEhlYXBTbmFwc2hvdFBhcnNlciBmcm9tICcuLi9saWIvaGVhcF9zbmFwc2hvdF9wYXJzZXInO1xuaW1wb3J0IHtjcmVhdGVTZXNzaW9ufSBmcm9tICdjaHJvbWUtZGVidWdnaW5nLWNsaWVudCc7XG5pbXBvcnQge0lTZXNzaW9uIGFzIENocm9tZVNlc3Npb24sIElCcm93c2VyUHJvY2VzcyBhcyBDaHJvbWVQcm9jZXNzfSBmcm9tICdjaHJvbWUtZGVidWdnaW5nLWNsaWVudC9kaXN0L2xpYi90eXBlcyc7XG5pbXBvcnQge0hlYXBQcm9maWxlciBhcyBDaHJvbWVIZWFwUHJvZmlsZXIsIE5ldHdvcmsgYXMgQ2hyb21lTmV0d29yaywgQ29uc29sZSBhcyBDaHJvbWVDb25zb2xlLCBQYWdlIGFzIENocm9tZVBhZ2UsIFJ1bnRpbWUgYXMgQ2hyb21lUnVudGltZSwgRE9NIGFzIENocm9tZURPTX0gZnJvbSBcImNocm9tZS1kZWJ1Z2dpbmctY2xpZW50L2Rpc3QvcHJvdG9jb2wvdG90XCI7XG5pbXBvcnQge2FjY2Vzc1N5bmN9IGZyb20gJ2ZzJztcbmltcG9ydCB7am9pbn0gZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyByZXBsIGZyb20gJ3JlcGwnO1xuaW1wb3J0IHtwYXJzZSBhcyBwYXJzZUphdmFTY3JpcHR9IGZyb20gJ2VzcHJpbWEnO1xuaW1wb3J0ICogYXMgY2hpbGRQcm9jZXNzIGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xuaW1wb3J0IE1JVE1Qcm94eSBmcm9tICdtaXRtcHJveHknO1xuaW1wb3J0IHtwbGF0Zm9ybX0gZnJvbSAnb3MnO1xuaW1wb3J0IHtMb2d9IGZyb20gJy4uL2NvbW1vbi9pbnRlcmZhY2VzJztcbmltcG9ydCB7d2FpdH0gZnJvbSAnLi4vY29tbW9uL3V0aWwnO1xuXG4vLyBIQUNLOiBQYXRjaCBzcGF3biB0byB3b3JrIGFyb3VuZCBjaHJvbWUtZGVidWdnaW5nLWNsaWVudCBsaW1pdGF0aW9uXG4vLyBodHRwczovL2dpdGh1Yi5jb20va3Jpc3NlbGRlbi9jaHJvbWUtZGVidWdnaW5nLWNsaWVudC9pc3N1ZXMvMTBcbmNvbnN0IG9yaWdpbmFsU3Bhd24gPSBjaGlsZFByb2Nlc3Muc3Bhd247XG4oPGFueT4gY2hpbGRQcm9jZXNzKS5zcGF3biA9IGZ1bmN0aW9uKGNvbW1hbmQ6IHN0cmluZywgYXJncz86IHN0cmluZ1tdLCBvcHRpb25zPzogY2hpbGRQcm9jZXNzLlNwYXduT3B0aW9ucyk6IGNoaWxkUHJvY2Vzcy5DaGlsZFByb2Nlc3Mge1xuICBpZiAoYXJncyAmJiBBcnJheS5pc0FycmF5KGFyZ3MpKSB7XG4gICAgY29uc3QgaW5kZXggPSBhcmdzLmluZGV4T2YoXCItLW5vLXByb3h5LXNlcnZlclwiKTtcbiAgICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgICBhcmdzLnNwbGljZShpbmRleCwgMSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBvcmlnaW5hbFNwYXduLmNhbGwodGhpcywgY29tbWFuZCwgYXJncywgb3B0aW9ucyk7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRE9NTm9kZSBleHRlbmRzIENocm9tZURPTS5Ob2RlIHtcbiAgZXZlbnRMaXN0ZW5lckNvdW50czoge1tuYW1lOiBzdHJpbmddOiBudW1iZXJ9O1xufVxuXG5mdW5jdGlvbiBleGNlcHRpb25EZXRhaWxzVG9TdHJpbmcoZTogQ2hyb21lUnVudGltZS5FeGNlcHRpb25EZXRhaWxzKTogc3RyaW5nIHtcbiAgcmV0dXJuIGAke2UudXJsfToke2UubGluZU51bWJlcn06JHtlLmNvbHVtbk51bWJlcn0gJHtlLnRleHR9ICR7ZS5leGNlcHRpb24gPyBlLmV4Y2VwdGlvbi5kZXNjcmlwdGlvbiA6IFwiXCJ9XFxuJHtlLnN0YWNrVHJhY2UgPyBlLnN0YWNrVHJhY2UuZGVzY3JpcHRpb24gOiBcIlwifVxcbiAgJHtlLnN0YWNrVHJhY2UgPyBlLnN0YWNrVHJhY2UuY2FsbEZyYW1lcy5maWx0ZXIoKGYpID0+IGYudXJsICE9PSBcIlwiKS5tYXAoKGYpID0+IGAke2YuZnVuY3Rpb25OYW1lID8gYCR7Zi5mdW5jdGlvbk5hbWV9IGF0IGAgOiBcIlwifSR7Zi51cmx9OiR7Zi5saW5lTnVtYmVyfToke2YuY29sdW1uTnVtYmVyfWApLmpvaW4oXCJcXG4gIFwiKSA6IFwiXCJ9XFxuYDtcbn1cblxuLyoqXG4gKiBTcGF3bnMgYSBjaHJvbWUgaW5zdGFuY2Ugd2l0aCBhIHRtcCB1c2VyIGRhdGEgYW5kIHRoZSBkZWJ1Z2dlciBvcGVuIHRvIGFuIGVwaGVtZXJhbCBwb3J0XG4gKi9cbmZ1bmN0aW9uIHNwYXduQ2hyb21lQnJvd3NlcihzZXNzaW9uOiBDaHJvbWVTZXNzaW9uLCBoZWFkbGVzczogYm9vbGVhbiwgd2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIpOiBQcm9taXNlPENocm9tZVByb2Nlc3M+IHtcbiAgY29uc3QgYWRkaXRpb25hbENocm9tZUFyZ3MgPSBbYC0tcHJveHktc2VydmVyPTEyNy4wLjAuMTo4MDgwYCwgYC0tZGlzYWJsZS1iYWNrZ3JvdW5kLXRpbWVyLXRocm90dGxpbmdgLCBgLS1kaXNhYmxlLXJlbmRlcmVyLWJhY2tncm91bmRpbmdgLCBgLS1kaXNhYmxlLXJlbmRlcmVyLXByaW9yaXR5LW1hbmFnZW1lbnRgXTtcbiAgaWYgKGhlYWRsZXNzKSB7XG4gICAgLy8gLS1kaXNhYmxlLWdwdSByZXF1aXJlZCBmb3IgV2luZG93c1xuICAgIGFkZGl0aW9uYWxDaHJvbWVBcmdzLnB1c2goYC0taGVhZGxlc3NgLCBgLS1kaXNhYmxlLWdwdWApO1xuICB9XG4gIGNvbnN0IGJhc2VPcHRpb25zID0ge1xuICAgIC8vIGFkZGl0aW9uYWxBcmd1bWVudHM6IFsnLS1oZWFkbGVzcyddLFxuICAgIHdpbmRvd1NpemU6IHsgd2lkdGg6IHdpZHRoLCBoZWlnaHQ6IGhlaWdodCB9LFxuICAgIGFkZGl0aW9uYWxBcmd1bWVudHM6IGFkZGl0aW9uYWxDaHJvbWVBcmdzXG4gIH07XG4gIHN3aXRjaCAocGxhdGZvcm0oKSkge1xuICAgIGNhc2UgJ2Rhcndpbic6XG4gICAgICByZXR1cm4gc2Vzc2lvbi5zcGF3bkJyb3dzZXIoXCJzeXN0ZW1cIiwgYmFzZU9wdGlvbnMpO1xuICAgIGNhc2UgJ2ZyZWVic2QnOlxuICAgIGNhc2UgJ2xpbnV4JzpcbiAgICBjYXNlICdvcGVuYnNkJzoge1xuICAgICAgLy8gKm5peDsgbmVlZCB0byBmaW5kIHRoZSBleGFjdCBwYXRoIHRvIENocm9tZSAvIENocm9taXVtXG4gICAgICAvLyAudHJpbSgpIHJlbW92ZXMgdHJhaWxpbmcgbmV3bGluZSBmcm9tIGB3aGljaGAgb3V0cHV0LlxuICAgICAgbGV0IGNocm9tZVBhdGggPSBjaGlsZFByb2Nlc3MuZXhlY1N5bmMoYHdoaWNoIGdvb2dsZS1jaHJvbWVgKS50b1N0cmluZygpLnRyaW0oKTtcbiAgICAgIGlmIChjaHJvbWVQYXRoID09PSBcIlwiKSB7XG4gICAgICAgIC8vIFRyeSBDaHJvbWl1bVxuICAgICAgICBjaHJvbWVQYXRoID0gY2hpbGRQcm9jZXNzLmV4ZWNTeW5jKGB3aGljaCBjaHJvbWl1bWApLnRvU3RyaW5nKCkudHJpbSgpO1xuICAgICAgfVxuICAgICAgaWYgKGNocm9tZVBhdGggPT09IFwiXCIpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGBVbmFibGUgdG8gZmluZCBhIEdvb2dsZSBDaHJvbWUgb3IgQ2hyb21pdW0gaW5zdGFsbGF0aW9uLmApXG4gICAgICB9XG4gICAgICByZXR1cm4gc2Vzc2lvbi5zcGF3bkJyb3dzZXIoXCJleGFjdFwiLCBPYmplY3QuYXNzaWduKHtcbiAgICAgICAgZXhlY3V0YWJsZVBhdGg6IGNocm9tZVBhdGhcbiAgICAgIH0sIGJhc2VPcHRpb25zKSk7XG4gICAgfVxuICAgIGNhc2UgJ3dpbjMyJzoge1xuICAgICAgLy8gSW5zcGlyZWQgYnkga2FybWEtY2hyb21lLWxhdW5jaGVyXG4gICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20va2FybWEtcnVubmVyL2thcm1hLWNocm9tZS1sYXVuY2hlci9ibG9iL21hc3Rlci9pbmRleC5qc1xuICAgICAgY29uc3Qgc3VmZml4ID0gYFxcXFxHb29nbGVcXFxcQ2hyb21lXFxcXEFwcGxpY2F0aW9uXFxcXGNocm9tZS5leGVgO1xuICAgICAgY29uc3QgcHJlZml4ZXMgPSBbcHJvY2Vzcy5lbnYuTE9DQUxBUFBEQVRBLCBwcm9jZXNzLmVudi5QUk9HUkFNRklMRVMsIHByb2Nlc3MuZW52WydQUk9HUkFNRklMRVMoWDg2KSddXTtcbiAgICAgIGZvciAoY29uc3QgcHJlZml4IG9mIHByZWZpeGVzKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgbGV0IGNocm9tZUxvY2F0aW9uID0gam9pbihwcmVmaXgsIHN1ZmZpeCk7XG4gICAgICAgICAgYWNjZXNzU3luYyhjaHJvbWVMb2NhdGlvbik7XG4gICAgICAgICAgcmV0dXJuIHNlc3Npb24uc3Bhd25Ccm93c2VyKFwiZXhhY3RcIiwgT2JqZWN0LmFzc2lnbih7XG4gICAgICAgICAgICBleGVjdXRhYmxlUGF0aDogY2hyb21lTG9jYXRpb25cbiAgICAgICAgICB9LCBiYXNlT3B0aW9ucykpO1xuICAgICAgICB9IGNhdGNoIChlKSB7fVxuICAgICAgfVxuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGBVbmFibGUgdG8gZmluZCBhIENocm9tZSBpbnN0YWxsYXRpb25gKTtcbiAgICB9XG4gICAgZGVmYXVsdDpcbiAgICAgIC8vIEVzb3RlcmljIG9wdGlvbnNcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChgVW5zdXBwb3J0ZWQgcGxhdGZvcm06ICR7cGxhdGZvcm0oKX1gKTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDaHJvbWVEcml2ZXIge1xuICBwdWJsaWMgc3RhdGljIGFzeW5jIExhdW5jaChsb2c6IExvZywgaGVhZGxlc3M6IGJvb2xlYW4sIHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyLCBpbnRlcmNlcHRQYXRoczogc3RyaW5nW10gPSBbXSwgcXVpZXQ6IGJvb2xlYW4gPSB0cnVlKTogUHJvbWlzZTxDaHJvbWVEcml2ZXI+IHtcbiAgICBjb25zdCBtaXRtUHJveHkgPSBhd2FpdCBNSVRNUHJveHkuQ3JlYXRlKHVuZGVmaW5lZCwgaW50ZXJjZXB0UGF0aHMsIHF1aWV0KTtcbiAgICAvLyBUZWxsIG1pdG1Qcm94eSB0byBzdGFzaCBkYXRhIHJlcXVlc3RlZCB0aHJvdWdoIHRoZSBwcm94eS5cbiAgICBtaXRtUHJveHkuc3Rhc2hFbmFibGVkID0gdHJ1ZTtcbiAgICBjb25zdCBzZXNzaW9uID0gYXdhaXQgbmV3IFByb21pc2U8Q2hyb21lU2Vzc2lvbj4oKHJlcywgcmVqKSA9PiBjcmVhdGVTZXNzaW9uKHJlcykpO1xuICAgIGxldCBjaHJvbWVQcm9jZXNzOiBDaHJvbWVQcm9jZXNzID0gYXdhaXQgc3Bhd25DaHJvbWVCcm93c2VyKHNlc3Npb24sIGhlYWRsZXNzLCB3aWR0aCwgaGVpZ2h0KTtcbiAgICAvLyBvcGVuIHRoZSBSRVNUIEFQSSBmb3IgdGFic1xuICAgIGNvbnN0IGNsaWVudCA9IHNlc3Npb24uY3JlYXRlQVBJQ2xpZW50KFwibG9jYWxob3N0XCIsIGNocm9tZVByb2Nlc3MucmVtb3RlRGVidWdnaW5nUG9ydCk7XG4gICAgY29uc3QgdGFicyA9IGF3YWl0IGNsaWVudC5saXN0VGFicygpO1xuICAgIGNvbnN0IHRhYiA9IHRhYnNbMF07XG4gICAgYXdhaXQgY2xpZW50LmFjdGl2YXRlVGFiKHRhYi5pZCk7XG4gICAgLy8gb3BlbiB0aGUgZGVidWdnZXIgcHJvdG9jb2xcbiAgICAvLyBodHRwczovL2Nocm9tZWRldnRvb2xzLmdpdGh1Yi5pby9kZXZ0b29scy1wcm90b2NvbC9cbiAgICBjb25zdCBkZWJ1Z0NsaWVudCA9IGF3YWl0IHNlc3Npb24ub3BlbkRlYnVnZ2luZ1Byb3RvY29sKHRhYi53ZWJTb2NrZXREZWJ1Z2dlclVybCk7XG5cbiAgICBjb25zdCBoZWFwUHJvZmlsZXIgPSBuZXcgQ2hyb21lSGVhcFByb2ZpbGVyKGRlYnVnQ2xpZW50KTtcbiAgICBjb25zdCBuZXR3b3JrID0gbmV3IENocm9tZU5ldHdvcmsoZGVidWdDbGllbnQpO1xuICAgIGNvbnN0IGNocm9tZUNvbnNvbGUgPSBuZXcgQ2hyb21lQ29uc29sZShkZWJ1Z0NsaWVudCk7XG4gICAgY29uc3QgcGFnZSA9IG5ldyBDaHJvbWVQYWdlKGRlYnVnQ2xpZW50KTtcbiAgICBjb25zdCBydW50aW1lID0gbmV3IENocm9tZVJ1bnRpbWUoZGVidWdDbGllbnQpO1xuICAgIGNvbnN0IGRvbSA9IG5ldyBDaHJvbWVET00oZGVidWdDbGllbnQpO1xuICAgIGF3YWl0IFByb21pc2UuYWxsKFtoZWFwUHJvZmlsZXIuZW5hYmxlKCksIG5ldHdvcmsuZW5hYmxlKHt9KSwgIGNocm9tZUNvbnNvbGUuZW5hYmxlKCksIHBhZ2UuZW5hYmxlKCksIHJ1bnRpbWUuZW5hYmxlKCksIGRvbS5lbmFibGUoKV0pO1xuICAgIC8vIEludGVyY2VwdCBuZXR3b3JrIHJlcXVlc3RzLlxuICAgIC8vIGF3YWl0IG5ldHdvcmsuc2V0UmVxdWVzdEludGVyY2VwdGlvbkVuYWJsZWQoeyBlbmFibGVkOiB0cnVlIH0pO1xuICAgIC8vIERpc2FibGUgY2FjaGVcbiAgICBhd2FpdCBuZXR3b3JrLnNldENhY2hlRGlzYWJsZWQoeyBjYWNoZURpc2FibGVkOiB0cnVlIH0pO1xuICAgIC8vIERpc2FibGUgc2VydmljZSB3b3JrZXJzXG4gICAgYXdhaXQgbmV0d29yay5zZXRCeXBhc3NTZXJ2aWNlV29ya2VyKHsgYnlwYXNzOiB0cnVlIH0pO1xuXG4gICAgY29uc3QgZHJpdmVyID0gbmV3IENocm9tZURyaXZlcihsb2csIGhlYWRsZXNzLCB3aWR0aCwgaGVpZ2h0LCBpbnRlcmNlcHRQYXRocywgcXVpZXQsIG1pdG1Qcm94eSwgY2hyb21lUHJvY2VzcywgcGFnZSwgcnVudGltZSwgaGVhcFByb2ZpbGVyLCBjaHJvbWVDb25zb2xlKTtcblxuICAgIHJldHVybiBkcml2ZXI7XG4gIH1cblxuICBwcml2YXRlIF9sb2c6IExvZztcbiAgcHJpdmF0ZSBfaGVhZGxlc3M6IGJvb2xlYW47XG4gIHB1YmxpYyByZWFkb25seSBtaXRtUHJveHk6IE1JVE1Qcm94eTtcbiAgcHJpdmF0ZSBfcHJvY2VzczogQ2hyb21lUHJvY2VzcztcbiAgcHJpdmF0ZSBfcGFnZTogQ2hyb21lUGFnZTtcbiAgcHJpdmF0ZSBfcnVudGltZTogQ2hyb21lUnVudGltZTtcbiAgcHJpdmF0ZSBfaGVhcFByb2ZpbGVyOiBDaHJvbWVIZWFwUHJvZmlsZXI7XG4gIHByaXZhdGUgX2NvbnNvbGU6IENocm9tZUNvbnNvbGU7XG4gIHByaXZhdGUgX2xvYWRlZEZyYW1lcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBwcml2YXRlIF9zaHV0ZG93bjogYm9vbGVhbiA9IGZhbHNlO1xuICBwcml2YXRlIF93aWR0aDogbnVtYmVyO1xuICBwcml2YXRlIF9oZWlnaHQ6IG51bWJlcjtcbiAgcHJpdmF0ZSBfaW50ZXJjZXB0UGF0aHM6IHN0cmluZ1tdO1xuICBwcml2YXRlIF9xdWlldDogYm9vbGVhbjtcblxuICBwcml2YXRlIGNvbnN0cnVjdG9yKGxvZzogTG9nLCBoZWFkbGVzczogYm9vbGVhbiwgd2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIsIGludGVyY2VwdFBhdGhzOiBzdHJpbmdbXSwgcXVpZXQ6IGJvb2xlYW4sIG1pdG1Qcm94eTogTUlUTVByb3h5LCBwcm9jZXNzOiBDaHJvbWVQcm9jZXNzLCBwYWdlOiBDaHJvbWVQYWdlLCBydW50aW1lOiBDaHJvbWVSdW50aW1lLCBoZWFwUHJvZmlsZXI6IENocm9tZUhlYXBQcm9maWxlciwgY29uc29sZTogQ2hyb21lQ29uc29sZSkge1xuICAgIHRoaXMuX2xvZyA9IGxvZztcbiAgICB0aGlzLl9oZWFkbGVzcyA9IGhlYWRsZXNzO1xuICAgIHRoaXMubWl0bVByb3h5ID0gbWl0bVByb3h5O1xuICAgIHRoaXMuX3Byb2Nlc3MgPSBwcm9jZXNzO1xuICAgIHRoaXMuX3J1bnRpbWUgPSBydW50aW1lO1xuICAgIHRoaXMuX3BhZ2UgPSBwYWdlO1xuICAgIHRoaXMuX2hlYXBQcm9maWxlciA9IGhlYXBQcm9maWxlcjtcbiAgICB0aGlzLl9jb25zb2xlID0gY29uc29sZTtcbiAgICB0aGlzLl93aWR0aCA9IHdpZHRoO1xuICAgIHRoaXMuX2hlaWdodCA9IGhlaWdodDtcbiAgICB0aGlzLl9pbnRlcmNlcHRQYXRocyA9IGludGVyY2VwdFBhdGhzO1xuICAgIHRoaXMuX3F1aWV0ID0gcXVpZXQ7XG5cbiAgICB0aGlzLl9jb25zb2xlLm1lc3NhZ2VBZGRlZCA9IChldnQpID0+IHtcbiAgICAgIGNvbnN0IG0gPSBldnQubWVzc2FnZTtcbiAgICAgIGxvZy5kZWJ1ZyhgWyR7bS5sZXZlbH1dIFske20uc291cmNlfV0gJHttLnVybH06JHttLmxpbmV9OiR7bS5jb2x1bW59ICR7bS50ZXh0fWApO1xuICAgIH07XG5cbiAgICB0aGlzLl9ydW50aW1lLmV4Y2VwdGlvblRocm93biA9IChldnQpID0+IHtcbiAgICAgIGNvbnN0IGUgPSBldnQuZXhjZXB0aW9uRGV0YWlscztcbiAgICAgIGxvZy5lcnJvcihleGNlcHRpb25EZXRhaWxzVG9TdHJpbmcoZSkpO1xuICAgIH07XG5cbiAgICB0aGlzLl9wYWdlLmZyYW1lU3RvcHBlZExvYWRpbmcgPSAoZSkgPT4ge1xuICAgICAgdGhpcy5fbG9hZGVkRnJhbWVzLmFkZChlLmZyYW1lSWQpO1xuICAgIH07XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgdGFrZVNjcmVlbnNob3QoKTogUHJvbWlzZTxCdWZmZXI+IHtcbiAgICBjb25zdCBzcyA9IGF3YWl0IHRoaXMuX3BhZ2UuY2FwdHVyZVNjcmVlbnNob3Qoe30pO1xuICAgIHJldHVybiBCdWZmZXIuZnJvbShzcy5kYXRhLCAnYmFzZTY0Jyk7XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgcmVsYXVuY2goKTogUHJvbWlzZTxDaHJvbWVEcml2ZXI+IHtcbiAgICBhd2FpdCB0aGlzLnNodXRkb3duKCk7XG4gICAgY29uc3QgZHJpdmVyID0gYXdhaXQgQ2hyb21lRHJpdmVyLkxhdW5jaCh0aGlzLl9sb2csIHRoaXMuX2hlYWRsZXNzLCB0aGlzLl93aWR0aCwgdGhpcy5faGVpZ2h0LCB0aGlzLl9pbnRlcmNlcHRQYXRocywgdGhpcy5fcXVpZXQpO1xuICAgIGRyaXZlci5taXRtUHJveHkuY2IgPSB0aGlzLm1pdG1Qcm94eS5jYjtcbiAgICByZXR1cm4gZHJpdmVyO1xuICB9XG5cbiAgcHVibGljIGFzeW5jIG5hdmlnYXRlVG8odXJsOiBzdHJpbmcpOiBQcm9taXNlPGFueT4ge1xuICAgIHRoaXMuX2xvYWRlZEZyYW1lcy5jbGVhcigpO1xuICAgIGNvbnN0IGYgPSBhd2FpdCB0aGlzLl9wYWdlLm5hdmlnYXRlKHsgdXJsIH0pO1xuICAgIHdoaWxlICghdGhpcy5fbG9hZGVkRnJhbWVzLmhhcyhmLmZyYW1lSWQpKSB7XG4gICAgICBpZiAodGhpcy5fc2h1dGRvd24pIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGBDYW5ub3QgbmF2aWdhdGUgdG8gVVJMOyBDaHJvbWUgaGFzIHNodXQgZG93bi5gKTtcbiAgICAgIH1cbiAgICAgIGF3YWl0IHdhaXQoNSk7XG4gICAgfVxuICB9XG5cbiAgcHVibGljIGFzeW5jIHJ1bkNvZGU8VD4oZXhwcmVzc2lvbjogc3RyaW5nKTogUHJvbWlzZTxUPiB7XG4gICAgY29uc3QgZSA9IGF3YWl0IHRoaXMuX3J1bnRpbWUuZXZhbHVhdGUoeyBleHByZXNzaW9uLCByZXR1cm5CeVZhbHVlOiB0cnVlIH0pO1xuICAgIHRoaXMuX2xvZy5kZWJ1ZyhgJHtleHByZXNzaW9ufSA9PiAke0pTT04uc3RyaW5naWZ5KGUucmVzdWx0LnZhbHVlKX1gKTtcbiAgICBpZiAoZS5leGNlcHRpb25EZXRhaWxzKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXhjZXB0aW9uRGV0YWlsc1RvU3RyaW5nKGUuZXhjZXB0aW9uRGV0YWlscykpO1xuICAgIH1cbiAgICByZXR1cm4gZS5yZXN1bHQudmFsdWU7XG4gIH1cbiAgcHVibGljIHRha2VIZWFwU25hcHNob3QoKTogSGVhcFNuYXBzaG90UGFyc2VyIHtcbiAgICBjb25zdCBwYXJzZXIgPSBuZXcgSGVhcFNuYXBzaG90UGFyc2VyKCk7XG4gICAgLy8gMjAwIEtCIGNodW5rc1xuICAgIHRoaXMuX2hlYXBQcm9maWxlci5hZGRIZWFwU25hcHNob3RDaHVuayA9IChldnQpID0+IHtcbiAgICAgIHBhcnNlci5hZGRTbmFwc2hvdENodW5rKGV2dC5jaHVuayk7XG4gICAgfTtcbiAgICAvLyBBbHdheXMgdGFrZSBhIERPTSBzbmFwc2hvdCBiZWZvcmUgdGFraW5nIGEgcmVhbCBzbmFwc2hvdC5cbiAgICB0aGlzLl90YWtlRE9NU25hcHNob3QoKS50aGVuKCgpID0+IHtcbiAgICAgIHRoaXMuX2hlYXBQcm9maWxlci50YWtlSGVhcFNuYXBzaG90KHsgcmVwb3J0UHJvZ3Jlc3M6IGZhbHNlIH0pO1xuICAgIH0pO1xuICAgIHJldHVybiBwYXJzZXI7XG4gIH1cbiAgcHJpdmF0ZSBhc3luYyBfdGFrZURPTVNuYXBzaG90KCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5fcnVudGltZS5ldmFsdWF0ZSh7XG4gICAgICBleHByZXNzaW9uOiBcIiQkJFNFUklBTElaRV9ET00kJCQoKVwiLCByZXR1cm5CeVZhbHVlOiB0cnVlXG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3BvbnNlLnJlc3VsdC52YWx1ZTtcbiAgfVxuICBwdWJsaWMgYXN5bmMgZGVidWdMb29wKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGV2YWxKYXZhc2NyaXB0ID0gKGNtZDogc3RyaW5nLCBjb250ZXh0OiBhbnksIGZpbGVuYW1lOiBzdHJpbmcsIGNhbGxiYWNrOiAoZTogYW55LCByZXN1bHQ/OiBzdHJpbmcpID0+IHZvaWQpOiB2b2lkID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHBhcnNlSmF2YVNjcmlwdChjbWQpO1xuICAgICAgICB0aGlzLnJ1bkNvZGUoY21kKS50aGVuKChyZXN1bHQpID0+IHtcbiAgICAgICAgICBjYWxsYmFjayhudWxsLCBgJHtyZXN1bHR9YCk7XG4gICAgICAgIH0pLmNhdGNoKGNhbGxiYWNrKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FsbGJhY2sobmV3ICg8YW55PnJlcGwpLlJlY292ZXJhYmxlKGUpKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBjb25zdCByID0gcmVwbC5zdGFydCh7IHByb21wdDogXCI+IFwiLCBldmFsOiBldmFsSmF2YXNjcmlwdCB9KTtcbiAgICAgIHIub24oJ2V4aXQnLCByZXNvbHZlKTtcbiAgICB9KTtcbiAgfVxuICBwdWJsaWMgYXN5bmMgc2h1dGRvd24oKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5fc2h1dGRvd24gPSB0cnVlO1xuICAgIGF3YWl0IFByb21pc2UuYWxsKFt0aGlzLl9wcm9jZXNzLmRpc3Bvc2UoKSwgdGhpcy5taXRtUHJveHkuc2h1dGRvd24oKV0pO1xuICB9XG59XG4iXX0=