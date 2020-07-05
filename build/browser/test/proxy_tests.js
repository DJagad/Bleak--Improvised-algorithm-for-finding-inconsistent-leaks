import * as tslib_1 from "tslib";
import createHTTPServer from './util/http_server';
import { equal as assertEqual } from 'assert';
import { gzipSync, gunzipSync } from 'zlib';
import { default as MITMProxy, nopInterceptor } from 'mitmproxy';
var HTTP_PORT = 8888;
// 'Files' present in the test HTTP server
var FILES = {
    '/test.html': {
        mimeType: 'text/html',
        data: Buffer.from('<!DOCTYPE html><html><head><title>My Web Page</title></head></html>', 'utf8')
    },
    '/test.js': {
        mimeType: 'text/javascript',
        data: Buffer.from('window.SHENANIGANS = true;', 'utf8')
    },
    '/test.js.gz': {
        mimeType: 'text/javascript',
        data: gzipSync(Buffer.from('window.SHENANIGANS = true;', 'utf8')),
        headers: {
            'content-encoding': 'gzip'
        }
    },
    '/test.jpg': {
        mimeType: 'image/jpeg',
        data: Buffer.alloc(1025, 0)
    },
    '/huge.html': {
        mimeType: 'text/html',
        // 10MB file filled w/ a's.
        data: Buffer.alloc(1024 * 1024 * 10, 97)
    },
    '/huge.jpg': {
        mimeType: 'image/jpeg',
        data: Buffer.alloc(1024 * 1024 * 10, 0)
    },
    '/': {
        mimeType: 'text/html',
        data: Buffer.from('<!DOCTYPE html><html><title>Not Found</title></html>', 'utf8')
    }
};
describe('Proxy', function () {
    this.timeout(30000);
    var proxy;
    var httpServer;
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, createHTTPServer(FILES, HTTP_PORT)];
                    case 1:
                        httpServer = _a.sent();
                        return [4 /*yield*/, MITMProxy.Create(undefined, [], true)];
                    case 2:
                        proxy = _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    });
    function requestFile(path, expected) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var response;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, proxy.proxyGet("http://localhost:" + HTTP_PORT + path)];
                    case 1:
                        response = _a.sent();
                        if (!response.body.equals(expected)) {
                            console.log(response.body.length + " actual, " + expected.length + " expected");
                            console.log(response.body[10] + ", " + expected[10]);
                        }
                        assertEqual(response.body.equals(expected), true);
                        return [2 /*return*/];
                }
            });
        });
    }
    it("Properly proxies text files", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var promises;
            return tslib_1.__generator(this, function (_a) {
                proxy.cb = nopInterceptor;
                promises = ['/test.html', '/test.js'].map(function (filename) {
                    return requestFile(filename, FILES[filename].data);
                });
                promises.push(requestFile('/test.jpg', FILES['/test.jpg'].data));
                return [2 /*return*/, Promise.all(promises)];
            });
        });
    });
    it("Properly handles compressed data", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        proxy.cb = nopInterceptor;
                        return [4 /*yield*/, requestFile('/test.js.gz', gunzipSync(FILES['/test.js.gz'].data))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    });
    it("Properly rewrites text files", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            function transform(m) {
                var mimeType = m.response.getHeader('content-type').toLowerCase();
                if (mimeType === "text/html" || mimeType === "text/javascript") {
                    m.setResponseBody(MAGIC_STRING);
                }
            }
            var MAGIC_STRING, promises;
            return tslib_1.__generator(this, function (_a) {
                MAGIC_STRING = Buffer.from("HELLO THERE", 'utf8');
                proxy.cb = transform;
                promises = ['/test.html', '/test.js'].map(function (filename) {
                    return requestFile(filename, MAGIC_STRING);
                });
                promises.push(requestFile('/test.jpg', FILES['/test.jpg'].data));
                return [2 /*return*/, Promise.all(promises)];
            });
        });
    });
    it("Properly proxies huge binary files", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                proxy.cb = nopInterceptor;
                return [2 /*return*/, requestFile('/huge.jpg', FILES['/huge.jpg'].data)];
            });
        });
    });
    it("Properly proxies huge text files", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var raw, expected;
            return tslib_1.__generator(this, function (_a) {
                raw = FILES['/huge.html'].data;
                expected = Buffer.alloc(raw.length, 98);
                proxy.cb = function (f) {
                    f.setResponseBody(Buffer.from(f.responseBody.toString().replace(/a/g, 'b'), 'utf8'));
                };
                return [2 /*return*/, requestFile('/huge.html', expected)];
            });
        });
    });
    after(function (done) {
        // Shutdown both HTTP server and proxy.
        httpServer.close(function (e) {
            if (e) {
                done(e);
            }
            else {
                proxy.shutdown().then(done).catch(done);
            }
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJveHlfdGVzdHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi90ZXN0L3Byb3h5X3Rlc3RzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFDQSxPQUFPLGdCQUFnQixNQUFNLG9CQUFvQixDQUFDO0FBQ2xELE9BQU8sRUFBQyxLQUFLLElBQUksV0FBVyxFQUFDLE1BQU0sUUFBUSxDQUFDO0FBQzVDLE9BQU8sRUFBQyxRQUFRLEVBQUUsVUFBVSxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQzFDLE9BQU8sRUFBQyxPQUFPLElBQUksU0FBUyxFQUEwQixjQUFjLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFFdkYsSUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDO0FBUXZCLDBDQUEwQztBQUMxQyxJQUFNLEtBQUssR0FBK0I7SUFDeEMsWUFBWSxFQUFFO1FBQ1osUUFBUSxFQUFFLFdBQVc7UUFDckIsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMscUVBQXFFLEVBQUUsTUFBTSxDQUFDO0tBQ2pHO0lBQ0QsVUFBVSxFQUFFO1FBQ1YsUUFBUSxFQUFFLGlCQUFpQjtRQUMzQixJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyw0QkFBNEIsRUFBRSxNQUFNLENBQUM7S0FDeEQ7SUFDRCxhQUFhLEVBQUU7UUFDYixRQUFRLEVBQUUsaUJBQWlCO1FBQzNCLElBQUksRUFBRSxRQUFRLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyw0QkFBNEIsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUNqRSxPQUFPLEVBQUU7WUFDUCxrQkFBa0IsRUFBRSxNQUFNO1NBQzNCO0tBQ0Y7SUFDRCxXQUFXLEVBQUU7UUFDWCxRQUFRLEVBQUUsWUFBWTtRQUN0QixJQUFJLEVBQUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO0tBQzVCO0lBQ0QsWUFBWSxFQUFFO1FBQ1osUUFBUSxFQUFFLFdBQVc7UUFDckIsMkJBQTJCO1FBQzNCLElBQUksRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksR0FBQyxJQUFJLEdBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQztLQUNyQztJQUNELFdBQVcsRUFBRTtRQUNYLFFBQVEsRUFBRSxZQUFZO1FBQ3RCLElBQUksRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksR0FBQyxJQUFJLEdBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztLQUNwQztJQUNELEdBQUcsRUFBRTtRQUNILFFBQVEsRUFBRSxXQUFXO1FBQ3JCLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLHNEQUFzRCxFQUFFLE1BQU0sQ0FBQztLQUNsRjtDQUNGLENBQUM7QUFFRixRQUFRLENBQUMsT0FBTyxFQUFFO0lBQ2hCLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDcEIsSUFBSSxLQUFnQixDQUFDO0lBQ3JCLElBQUksVUFBc0IsQ0FBQztJQUMzQixNQUFNLENBQUM7Ozs7NEJBQ1EscUJBQU0sZ0JBQWdCLENBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxFQUFBOzt3QkFBckQsVUFBVSxHQUFHLFNBQXdDLENBQUM7d0JBQzlDLHFCQUFNLFNBQVMsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsRUFBQTs7d0JBQW5ELEtBQUssR0FBRyxTQUEyQyxDQUFDOzs7OztLQUNyRCxDQUFDLENBQUM7SUFFSCxxQkFBMkIsSUFBWSxFQUFFLFFBQWdCOzs7Ozs0QkFDdEMscUJBQU0sS0FBSyxDQUFDLFFBQVEsQ0FBQyxzQkFBb0IsU0FBUyxHQUFHLElBQU0sQ0FBQyxFQUFBOzt3QkFBdkUsUUFBUSxHQUFHLFNBQTREO3dCQUM3RSxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQzs0QkFDcEMsT0FBTyxDQUFDLEdBQUcsQ0FBSSxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0saUJBQVksUUFBUSxDQUFDLE1BQU0sY0FBVyxDQUFDLENBQUM7NEJBQzNFLE9BQU8sQ0FBQyxHQUFHLENBQUksUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsVUFBSyxRQUFRLENBQUMsRUFBRSxDQUFHLENBQUMsQ0FBQzt3QkFDdkQsQ0FBQzt3QkFDRCxXQUFXLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7Ozs7O0tBQ25EO0lBRUQsRUFBRSxDQUFDLDZCQUE2QixFQUFFOzs7O2dCQUNoQyxLQUFLLENBQUMsRUFBRSxHQUFHLGNBQWMsQ0FBQztnQkFDcEIsUUFBUSxHQUFHLENBQUMsWUFBWSxFQUFFLFVBQVUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFDLFFBQVE7b0JBQ3ZELE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDckQsQ0FBQyxDQUFDLENBQUM7Z0JBQ0gsUUFBUSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUNqRSxzQkFBTyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFDOzs7S0FDOUIsQ0FBQyxDQUFDO0lBRUgsRUFBRSxDQUFDLGtDQUFrQyxFQUFFOzs7Ozt3QkFDckMsS0FBSyxDQUFDLEVBQUUsR0FBRyxjQUFjLENBQUM7d0JBQzFCLHFCQUFNLFdBQVcsQ0FBQyxhQUFhLEVBQUUsVUFBVSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFBOzt3QkFBdkUsU0FBdUUsQ0FBQzs7Ozs7S0FDekUsQ0FBQyxDQUFDO0lBRUgsRUFBRSxDQUFDLDhCQUE4QixFQUFFOztZQUVqQyxtQkFBbUIsQ0FBeUI7Z0JBQzFDLElBQU0sUUFBUSxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUNwRSxFQUFFLENBQUMsQ0FBQyxRQUFRLEtBQUssV0FBVyxJQUFJLFFBQVEsS0FBSyxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7b0JBQy9ELENBQUMsQ0FBQyxlQUFlLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQ2xDLENBQUM7WUFDSCxDQUFDOzs7Z0JBTkssWUFBWSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQU94RCxLQUFLLENBQUMsRUFBRSxHQUFHLFNBQVMsQ0FBQztnQkFDZixRQUFRLEdBQUcsQ0FBQyxZQUFZLEVBQUUsVUFBVSxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQUMsUUFBUTtvQkFDdkQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLEVBQUUsWUFBWSxDQUFDLENBQUM7Z0JBQzdDLENBQUMsQ0FBQyxDQUFDO2dCQUNILFFBQVEsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFdBQVcsRUFBRSxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDakUsc0JBQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBQzs7O0tBQzlCLENBQUMsQ0FBQztJQUVILEVBQUUsQ0FBQyxvQ0FBb0MsRUFBRTs7O2dCQUN2QyxLQUFLLENBQUMsRUFBRSxHQUFHLGNBQWMsQ0FBQztnQkFDMUIsc0JBQU8sV0FBVyxDQUFDLFdBQVcsRUFBRSxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUM7OztLQUMxRCxDQUFDLENBQUM7SUFFSCxFQUFFLENBQUMsa0NBQWtDLEVBQUU7Ozs7Z0JBQy9CLEdBQUcsR0FBRyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUMvQixRQUFRLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUM5QyxLQUFLLENBQUMsRUFBRSxHQUFHLFVBQUMsQ0FBeUI7b0JBQ25DLENBQUMsQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQztnQkFDdkYsQ0FBQyxDQUFDO2dCQUNGLHNCQUFPLFdBQVcsQ0FBQyxZQUFZLEVBQUUsUUFBUSxDQUFDLEVBQUM7OztLQUM1QyxDQUFDLENBQUM7SUFFSCxLQUFLLENBQUMsVUFBUyxJQUFJO1FBQ2pCLHVDQUF1QztRQUN2QyxVQUFVLENBQUMsS0FBSyxDQUFDLFVBQUMsQ0FBTTtZQUN0QixFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNOLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNWLENBQUM7WUFBQyxJQUFJLENBQUMsQ0FBQztnQkFDTixLQUFLLENBQUMsUUFBUSxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMxQyxDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtTZXJ2ZXIgYXMgSFRUUFNlcnZlcn0gZnJvbSAnaHR0cCc7XG5pbXBvcnQgY3JlYXRlSFRUUFNlcnZlciBmcm9tICcuL3V0aWwvaHR0cF9zZXJ2ZXInO1xuaW1wb3J0IHtlcXVhbCBhcyBhc3NlcnRFcXVhbH0gZnJvbSAnYXNzZXJ0JztcbmltcG9ydCB7Z3ppcFN5bmMsIGd1bnppcFN5bmN9IGZyb20gJ3psaWInO1xuaW1wb3J0IHtkZWZhdWx0IGFzIE1JVE1Qcm94eSwgSW50ZXJjZXB0ZWRIVFRQTWVzc2FnZSwgbm9wSW50ZXJjZXB0b3J9IGZyb20gJ21pdG1wcm94eSc7XG5cbmNvbnN0IEhUVFBfUE9SVCA9IDg4ODg7XG5cbmludGVyZmFjZSBUZXN0RmlsZSB7XG4gIG1pbWVUeXBlOiBzdHJpbmc7XG4gIGRhdGE6IEJ1ZmZlcjtcbiAgaGVhZGVycz86IHtbbmFtZTogc3RyaW5nXTogc3RyaW5nfVxufVxuXG4vLyAnRmlsZXMnIHByZXNlbnQgaW4gdGhlIHRlc3QgSFRUUCBzZXJ2ZXJcbmNvbnN0IEZJTEVTOiB7W25hbWU6IHN0cmluZ106IFRlc3RGaWxlfSA9IHtcbiAgJy90ZXN0Lmh0bWwnOiB7XG4gICAgbWltZVR5cGU6ICd0ZXh0L2h0bWwnLFxuICAgIGRhdGE6IEJ1ZmZlci5mcm9tKCc8IURPQ1RZUEUgaHRtbD48aHRtbD48aGVhZD48dGl0bGU+TXkgV2ViIFBhZ2U8L3RpdGxlPjwvaGVhZD48L2h0bWw+JywgJ3V0ZjgnKVxuICB9LFxuICAnL3Rlc3QuanMnOiB7XG4gICAgbWltZVR5cGU6ICd0ZXh0L2phdmFzY3JpcHQnLFxuICAgIGRhdGE6IEJ1ZmZlci5mcm9tKCd3aW5kb3cuU0hFTkFOSUdBTlMgPSB0cnVlOycsICd1dGY4JylcbiAgfSxcbiAgJy90ZXN0LmpzLmd6Jzoge1xuICAgIG1pbWVUeXBlOiAndGV4dC9qYXZhc2NyaXB0JyxcbiAgICBkYXRhOiBnemlwU3luYyhCdWZmZXIuZnJvbSgnd2luZG93LlNIRU5BTklHQU5TID0gdHJ1ZTsnLCAndXRmOCcpKSxcbiAgICBoZWFkZXJzOiB7XG4gICAgICAnY29udGVudC1lbmNvZGluZyc6ICdnemlwJ1xuICAgIH1cbiAgfSxcbiAgJy90ZXN0LmpwZyc6IHtcbiAgICBtaW1lVHlwZTogJ2ltYWdlL2pwZWcnLFxuICAgIGRhdGE6IEJ1ZmZlci5hbGxvYygxMDI1LCAwKVxuICB9LFxuICAnL2h1Z2UuaHRtbCc6IHtcbiAgICBtaW1lVHlwZTogJ3RleHQvaHRtbCcsXG4gICAgLy8gMTBNQiBmaWxlIGZpbGxlZCB3LyBhJ3MuXG4gICAgZGF0YTogQnVmZmVyLmFsbG9jKDEwMjQqMTAyNCoxMCwgOTcpXG4gIH0sXG4gICcvaHVnZS5qcGcnOiB7XG4gICAgbWltZVR5cGU6ICdpbWFnZS9qcGVnJyxcbiAgICBkYXRhOiBCdWZmZXIuYWxsb2MoMTAyNCoxMDI0KjEwLCAwKVxuICB9LFxuICAnLyc6IHtcbiAgICBtaW1lVHlwZTogJ3RleHQvaHRtbCcsXG4gICAgZGF0YTogQnVmZmVyLmZyb20oJzwhRE9DVFlQRSBodG1sPjxodG1sPjx0aXRsZT5Ob3QgRm91bmQ8L3RpdGxlPjwvaHRtbD4nLCAndXRmOCcpXG4gIH1cbn07XG5cbmRlc2NyaWJlKCdQcm94eScsIGZ1bmN0aW9uKCkge1xuICB0aGlzLnRpbWVvdXQoMzAwMDApO1xuICBsZXQgcHJveHk6IE1JVE1Qcm94eTtcbiAgbGV0IGh0dHBTZXJ2ZXI6IEhUVFBTZXJ2ZXI7XG4gIGJlZm9yZShhc3luYyBmdW5jdGlvbigpIHtcbiAgICBodHRwU2VydmVyID0gYXdhaXQgY3JlYXRlSFRUUFNlcnZlcihGSUxFUywgSFRUUF9QT1JUKTtcbiAgICBwcm94eSA9IGF3YWl0IE1JVE1Qcm94eS5DcmVhdGUodW5kZWZpbmVkLCBbXSwgdHJ1ZSk7XG4gIH0pO1xuXG4gIGFzeW5jIGZ1bmN0aW9uIHJlcXVlc3RGaWxlKHBhdGg6IHN0cmluZywgZXhwZWN0ZWQ6IEJ1ZmZlcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgcHJveHkucHJveHlHZXQoYGh0dHA6Ly9sb2NhbGhvc3Q6JHtIVFRQX1BPUlR9JHtwYXRofWApO1xuICAgIGlmICghcmVzcG9uc2UuYm9keS5lcXVhbHMoZXhwZWN0ZWQpKSB7XG4gICAgICBjb25zb2xlLmxvZyhgJHtyZXNwb25zZS5ib2R5Lmxlbmd0aH0gYWN0dWFsLCAke2V4cGVjdGVkLmxlbmd0aH0gZXhwZWN0ZWRgKTtcbiAgICAgIGNvbnNvbGUubG9nKGAke3Jlc3BvbnNlLmJvZHlbMTBdfSwgJHtleHBlY3RlZFsxMF19YCk7XG4gICAgfVxuICAgIGFzc2VydEVxdWFsKHJlc3BvbnNlLmJvZHkuZXF1YWxzKGV4cGVjdGVkKSwgdHJ1ZSk7XG4gIH1cblxuICBpdChcIlByb3Blcmx5IHByb3hpZXMgdGV4dCBmaWxlc1wiLCBhc3luYyBmdW5jdGlvbigpIHtcbiAgICBwcm94eS5jYiA9IG5vcEludGVyY2VwdG9yO1xuICAgIGNvbnN0IHByb21pc2VzID0gWycvdGVzdC5odG1sJywgJy90ZXN0LmpzJ10ubWFwKChmaWxlbmFtZSkgPT4ge1xuICAgICAgcmV0dXJuIHJlcXVlc3RGaWxlKGZpbGVuYW1lLCBGSUxFU1tmaWxlbmFtZV0uZGF0YSk7XG4gICAgfSk7XG4gICAgcHJvbWlzZXMucHVzaChyZXF1ZXN0RmlsZSgnL3Rlc3QuanBnJywgRklMRVNbJy90ZXN0LmpwZyddLmRhdGEpKTtcbiAgICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbWlzZXMpO1xuICB9KTtcblxuICBpdChcIlByb3Blcmx5IGhhbmRsZXMgY29tcHJlc3NlZCBkYXRhXCIsIGFzeW5jIGZ1bmN0aW9uKCkge1xuICAgIHByb3h5LmNiID0gbm9wSW50ZXJjZXB0b3I7XG4gICAgYXdhaXQgcmVxdWVzdEZpbGUoJy90ZXN0LmpzLmd6JywgZ3VuemlwU3luYyhGSUxFU1snL3Rlc3QuanMuZ3onXS5kYXRhKSk7XG4gIH0pO1xuXG4gIGl0KFwiUHJvcGVybHkgcmV3cml0ZXMgdGV4dCBmaWxlc1wiLCBhc3luYyBmdW5jdGlvbigpIHtcbiAgICBjb25zdCBNQUdJQ19TVFJJTkcgPSBCdWZmZXIuZnJvbShcIkhFTExPIFRIRVJFXCIsICd1dGY4Jyk7XG4gICAgZnVuY3Rpb24gdHJhbnNmb3JtKG06IEludGVyY2VwdGVkSFRUUE1lc3NhZ2UpOiB2b2lkIHtcbiAgICAgIGNvbnN0IG1pbWVUeXBlID0gbS5yZXNwb25zZS5nZXRIZWFkZXIoJ2NvbnRlbnQtdHlwZScpLnRvTG93ZXJDYXNlKCk7XG4gICAgICBpZiAobWltZVR5cGUgPT09IFwidGV4dC9odG1sXCIgfHwgbWltZVR5cGUgPT09IFwidGV4dC9qYXZhc2NyaXB0XCIpIHtcbiAgICAgICAgbS5zZXRSZXNwb25zZUJvZHkoTUFHSUNfU1RSSU5HKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcHJveHkuY2IgPSB0cmFuc2Zvcm07XG4gICAgY29uc3QgcHJvbWlzZXMgPSBbJy90ZXN0Lmh0bWwnLCAnL3Rlc3QuanMnXS5tYXAoKGZpbGVuYW1lKSA9PiB7XG4gICAgICByZXR1cm4gcmVxdWVzdEZpbGUoZmlsZW5hbWUsIE1BR0lDX1NUUklORyk7XG4gICAgfSk7XG4gICAgcHJvbWlzZXMucHVzaChyZXF1ZXN0RmlsZSgnL3Rlc3QuanBnJywgRklMRVNbJy90ZXN0LmpwZyddLmRhdGEpKTtcbiAgICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbWlzZXMpO1xuICB9KTtcblxuICBpdChcIlByb3Blcmx5IHByb3hpZXMgaHVnZSBiaW5hcnkgZmlsZXNcIiwgYXN5bmMgZnVuY3Rpb24oKSB7XG4gICAgcHJveHkuY2IgPSBub3BJbnRlcmNlcHRvcjtcbiAgICByZXR1cm4gcmVxdWVzdEZpbGUoJy9odWdlLmpwZycsIEZJTEVTWycvaHVnZS5qcGcnXS5kYXRhKTtcbiAgfSk7XG5cbiAgaXQoXCJQcm9wZXJseSBwcm94aWVzIGh1Z2UgdGV4dCBmaWxlc1wiLCBhc3luYyBmdW5jdGlvbigpIHtcbiAgICBjb25zdCByYXcgPSBGSUxFU1snL2h1Z2UuaHRtbCddLmRhdGE7XG4gICAgY29uc3QgZXhwZWN0ZWQgPSBCdWZmZXIuYWxsb2MocmF3Lmxlbmd0aCwgOTgpO1xuICAgIHByb3h5LmNiID0gKGY6IEludGVyY2VwdGVkSFRUUE1lc3NhZ2UpOiB2b2lkID0+IHtcbiAgICAgIGYuc2V0UmVzcG9uc2VCb2R5KEJ1ZmZlci5mcm9tKGYucmVzcG9uc2VCb2R5LnRvU3RyaW5nKCkucmVwbGFjZSgvYS9nLCAnYicpLCAndXRmOCcpKTtcbiAgICB9O1xuICAgIHJldHVybiByZXF1ZXN0RmlsZSgnL2h1Z2UuaHRtbCcsIGV4cGVjdGVkKTtcbiAgfSk7XG5cbiAgYWZ0ZXIoZnVuY3Rpb24oZG9uZSkge1xuICAgIC8vIFNodXRkb3duIGJvdGggSFRUUCBzZXJ2ZXIgYW5kIHByb3h5LlxuICAgIGh0dHBTZXJ2ZXIuY2xvc2UoKGU6IGFueSkgPT4ge1xuICAgICAgaWYgKGUpIHtcbiAgICAgICAgZG9uZShlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHByb3h5LnNodXRkb3duKCkudGhlbihkb25lKS5jYXRjaChkb25lKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSk7XG59KTsiXX0=