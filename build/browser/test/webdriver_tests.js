import * as tslib_1 from "tslib";
import createHTTPServer from './util/http_server';
import ChromeDriver from '../src/lib/chrome_driver';
import { equal as assertEqual } from 'assert';
var HTTP_PORT = 8890;
describe("Chrome Driver", function () {
    // 30 second timeout.
    this.timeout(30000);
    var httpServer;
    var chromeDriver;
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, createHTTPServer({
                            "/": {
                                mimeType: "text/html",
                                data: Buffer.from("<!doctype html><html><div id='container'>ContainerText</div></html>", "utf8")
                            }
                        }, HTTP_PORT)];
                    case 1:
                        httpServer = _a.sent();
                        // Silence debug messages.
                        console.debug = function () { };
                        return [4 /*yield*/, ChromeDriver.Launch(console, true, 1920, 1080)];
                    case 2:
                        chromeDriver = _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    });
    it("Successfully loads a webpage", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var str;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, chromeDriver.navigateTo("http://localhost:" + HTTP_PORT + "/")];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, chromeDriver.runCode("document.getElementById('container').innerText")];
                    case 2:
                        str = _a.sent();
                        assertEqual(str, "ContainerText");
                        return [2 /*return*/];
                }
            });
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.all([chromeDriver.shutdown(), httpServer.close])];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2ViZHJpdmVyX3Rlc3RzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vdGVzdC93ZWJkcml2ZXJfdGVzdHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sZ0JBQWdCLE1BQU0sb0JBQW9CLENBQUM7QUFFbEQsT0FBTyxZQUFZLE1BQU0sMEJBQTBCLENBQUM7QUFDcEQsT0FBTyxFQUFDLEtBQUssSUFBSSxXQUFXLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFFNUMsSUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDO0FBRXZCLFFBQVEsQ0FBQyxlQUFlLEVBQUU7SUFDeEIscUJBQXFCO0lBQ3JCLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDcEIsSUFBSSxVQUFzQixDQUFDO0lBQzNCLElBQUksWUFBMEIsQ0FBQztJQUMvQixNQUFNLENBQUM7Ozs7NEJBQ1EscUJBQU0sZ0JBQWdCLENBQUM7NEJBQ2xDLEdBQUcsRUFBRTtnQ0FDSCxRQUFRLEVBQUUsV0FBVztnQ0FDckIsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMscUVBQXFFLEVBQUUsTUFBTSxDQUFDOzZCQUNqRzt5QkFDRixFQUFFLFNBQVMsQ0FBQyxFQUFBOzt3QkFMYixVQUFVLEdBQUcsU0FLQSxDQUFDO3dCQUNkLDBCQUEwQjt3QkFDMUIsT0FBTyxDQUFDLEtBQUssR0FBRyxjQUFPLENBQUMsQ0FBQzt3QkFDVixxQkFBTSxZQUFZLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxFQUFBOzt3QkFBbkUsWUFBWSxHQUFHLFNBQW9ELENBQUM7Ozs7O0tBQ3JFLENBQUMsQ0FBQztJQUVILEVBQUUsQ0FBQyw4QkFBOEIsRUFBRTs7Ozs7NEJBQ2pDLHFCQUFNLFlBQVksQ0FBQyxVQUFVLENBQUMsc0JBQW9CLFNBQVMsTUFBRyxDQUFDLEVBQUE7O3dCQUEvRCxTQUErRCxDQUFDO3dCQUNwRCxxQkFBTSxZQUFZLENBQUMsT0FBTyxDQUFDLGdEQUFnRCxDQUFDLEVBQUE7O3dCQUFsRixHQUFHLEdBQUcsU0FBNEU7d0JBQ3hGLFdBQVcsQ0FBQyxHQUFHLEVBQUUsZUFBZSxDQUFDLENBQUM7Ozs7O0tBQ25DLENBQUMsQ0FBQztJQUVILEtBQUssQ0FBQzs7Ozs0QkFDSixxQkFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxFQUFFLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFBOzt3QkFBOUQsU0FBOEQsQ0FBQzs7Ozs7S0FDaEUsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgY3JlYXRlSFRUUFNlcnZlciBmcm9tICcuL3V0aWwvaHR0cF9zZXJ2ZXInO1xuaW1wb3J0IHtTZXJ2ZXIgYXMgSFRUUFNlcnZlcn0gZnJvbSAnaHR0cCc7XG5pbXBvcnQgQ2hyb21lRHJpdmVyIGZyb20gJy4uL3NyYy9saWIvY2hyb21lX2RyaXZlcic7XG5pbXBvcnQge2VxdWFsIGFzIGFzc2VydEVxdWFsfSBmcm9tICdhc3NlcnQnO1xuXG5jb25zdCBIVFRQX1BPUlQgPSA4ODkwO1xuXG5kZXNjcmliZShcIkNocm9tZSBEcml2ZXJcIiwgZnVuY3Rpb24oKSB7XG4gIC8vIDMwIHNlY29uZCB0aW1lb3V0LlxuICB0aGlzLnRpbWVvdXQoMzAwMDApO1xuICBsZXQgaHR0cFNlcnZlcjogSFRUUFNlcnZlcjtcbiAgbGV0IGNocm9tZURyaXZlcjogQ2hyb21lRHJpdmVyO1xuICBiZWZvcmUoYXN5bmMgZnVuY3Rpb24oKSB7XG4gICAgaHR0cFNlcnZlciA9IGF3YWl0IGNyZWF0ZUhUVFBTZXJ2ZXIoe1xuICAgICAgXCIvXCI6IHtcbiAgICAgICAgbWltZVR5cGU6IFwidGV4dC9odG1sXCIsXG4gICAgICAgIGRhdGE6IEJ1ZmZlci5mcm9tKFwiPCFkb2N0eXBlIGh0bWw+PGh0bWw+PGRpdiBpZD0nY29udGFpbmVyJz5Db250YWluZXJUZXh0PC9kaXY+PC9odG1sPlwiLCBcInV0ZjhcIilcbiAgICAgIH1cbiAgICB9LCBIVFRQX1BPUlQpO1xuICAgIC8vIFNpbGVuY2UgZGVidWcgbWVzc2FnZXMuXG4gICAgY29uc29sZS5kZWJ1ZyA9ICgpID0+IHt9O1xuICAgIGNocm9tZURyaXZlciA9IGF3YWl0IENocm9tZURyaXZlci5MYXVuY2goY29uc29sZSwgdHJ1ZSwgMTkyMCwgMTA4MCk7XG4gIH0pO1xuXG4gIGl0KFwiU3VjY2Vzc2Z1bGx5IGxvYWRzIGEgd2VicGFnZVwiLCBhc3luYyBmdW5jdGlvbigpIHtcbiAgICBhd2FpdCBjaHJvbWVEcml2ZXIubmF2aWdhdGVUbyhgaHR0cDovL2xvY2FsaG9zdDoke0hUVFBfUE9SVH0vYCk7XG4gICAgY29uc3Qgc3RyID0gYXdhaXQgY2hyb21lRHJpdmVyLnJ1bkNvZGUoXCJkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY29udGFpbmVyJykuaW5uZXJUZXh0XCIpO1xuICAgIGFzc2VydEVxdWFsKHN0ciwgXCJDb250YWluZXJUZXh0XCIpO1xuICB9KTtcblxuICBhZnRlcihhc3luYyBmdW5jdGlvbigpIHtcbiAgICBhd2FpdCBQcm9taXNlLmFsbChbY2hyb21lRHJpdmVyLnNodXRkb3duKCksIGh0dHBTZXJ2ZXIuY2xvc2VdKTtcbiAgfSk7XG59KTsiXX0=