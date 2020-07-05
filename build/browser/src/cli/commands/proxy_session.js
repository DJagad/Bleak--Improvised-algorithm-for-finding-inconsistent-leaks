var _this = this;
import * as tslib_1 from "tslib";
import ChromeDriver from '../../lib/chrome_driver';
import getInterceptor from '../../lib/mitmproxy_interceptor';
import { readFileSync } from 'fs';
import BLeakConfig from '../../lib/bleak_config';
import { DEFAULT_AGENT_URL, DEFAULT_BABEL_POLYFILL_URL, DEFAULT_AGENT_TRANSFORM_URL } from '../../lib/mitmproxy_interceptor';
var ProxySession = {
    command: 'proxy-session',
    describe: 'Begins a browsing session through the BLeak proxy. Useful for debugging BLeak proxy issues.',
    builder: {
        config: {
            type: 'string',
            demand: true,
            describe: "Path to a BLeak configuration file"
        },
        diagnose: {
            type: 'boolean',
            default: false,
            describe: "If set to 'true', BLeak rewrites the webpage as it does during diagnoses"
        },
        fix: {
            type: 'number',
            array: true,
            default: [],
            describe: 'Which bug fixes to enable during the session'
        }
    },
    handler: function (args) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var rawConfig, config, url, diagnose, fixes, driver;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    rawConfig = readFileSync(args.config).toString();
                    config = BLeakConfig.FromSource(rawConfig);
                    url = config.url;
                    diagnose = args.diagnose;
                    fixes = args.fix;
                    return [4 /*yield*/, ChromeDriver.Launch(console, false, 1920, 1080, ['/eval', DEFAULT_AGENT_URL, DEFAULT_BABEL_POLYFILL_URL, DEFAULT_AGENT_TRANSFORM_URL])];
                case 1:
                    driver = _a.sent();
                    driver.mitmProxy.cb = getInterceptor({
                        log: console,
                        rewrite: diagnose,
                        fixes: fixes,
                        config: config.getBrowserInjection(),
                        disableAllRewrites: false,
                        fixRewriteFunction: config.rewrite
                    });
                    return [4 /*yield*/, driver.navigateTo(url)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, driver.debugLoop()];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, driver.shutdown()];
                case 4:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); }
};
export default ProxySession;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJveHlfc2Vzc2lvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9jbGkvY29tbWFuZHMvcHJveHlfc2Vzc2lvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxpQkF3REE7O0FBeERBLE9BQU8sWUFBWSxNQUFNLHlCQUF5QixDQUFDO0FBQ25ELE9BQU8sY0FBYyxNQUFNLGlDQUFpQyxDQUFDO0FBQzdELE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxJQUFJLENBQUM7QUFFaEMsT0FBTyxXQUFXLE1BQU0sd0JBQXdCLENBQUM7QUFDakQsT0FBTyxFQUFDLGlCQUFpQixFQUFFLDBCQUEwQixFQUFFLDJCQUEyQixFQUFDLE1BQU0saUNBQWlDLENBQUM7QUFRM0gsSUFBTSxZQUFZLEdBQWtCO0lBQ2xDLE9BQU8sRUFBRSxlQUFlO0lBQ3hCLFFBQVEsRUFBRSw2RkFBNkY7SUFDdkcsT0FBTyxFQUFFO1FBQ1AsTUFBTSxFQUFFO1lBQ04sSUFBSSxFQUFFLFFBQVE7WUFDZCxNQUFNLEVBQUUsSUFBSTtZQUNaLFFBQVEsRUFBRSxvQ0FBb0M7U0FDL0M7UUFDRCxRQUFRLEVBQUU7WUFDUixJQUFJLEVBQUUsU0FBUztZQUNmLE9BQU8sRUFBRSxLQUFLO1lBQ2QsUUFBUSxFQUFFLDBFQUEwRTtTQUNyRjtRQUNELEdBQUcsRUFBRTtZQUNILElBQUksRUFBRSxRQUFRO1lBQ2QsS0FBSyxFQUFFLElBQUk7WUFDWCxPQUFPLEVBQUUsRUFBRTtZQUNYLFFBQVEsRUFBRSw4Q0FBOEM7U0FDekQ7S0FDRjtJQUNELE9BQU8sRUFBRSxVQUFPLElBQXFCOzs7OztvQkFDN0IsU0FBUyxHQUFHLFlBQVksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUM7b0JBQ2pELE1BQU0sR0FBRyxXQUFXLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDO29CQUMzQyxHQUFHLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQztvQkFDakIsUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7b0JBQ3pCLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDO29CQUNSLHFCQUFNLFlBQVksQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUMsT0FBTyxFQUFFLGlCQUFpQixFQUFFLDBCQUEwQixFQUFFLDJCQUEyQixDQUFDLENBQUMsRUFBQTs7b0JBQXJKLE1BQU0sR0FBRyxTQUE0STtvQkFDM0osTUFBTSxDQUFDLFNBQVMsQ0FBQyxFQUFFLEdBQUcsY0FBYyxDQUFDO3dCQUNuQyxHQUFHLEVBQUUsT0FBTzt3QkFDWixPQUFPLEVBQUUsUUFBUTt3QkFDakIsS0FBSyxFQUFFLEtBQUs7d0JBQ1osTUFBTSxFQUFFLE1BQU0sQ0FBQyxtQkFBbUIsRUFBRTt3QkFDcEMsa0JBQWtCLEVBQUUsS0FBSzt3QkFDekIsa0JBQWtCLEVBQUUsTUFBTSxDQUFDLE9BQU87cUJBQ25DLENBQUMsQ0FBQztvQkFDSCxxQkFBTSxNQUFNLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxFQUFBOztvQkFBNUIsU0FBNEIsQ0FBQztvQkFDN0IscUJBQU0sTUFBTSxDQUFDLFNBQVMsRUFBRSxFQUFBOztvQkFBeEIsU0FBd0IsQ0FBQztvQkFDekIscUJBQU0sTUFBTSxDQUFDLFFBQVEsRUFBRSxFQUFBOztvQkFBdkIsU0FBdUIsQ0FBQzs7OztTQUN6QjtDQUNGLENBQUM7QUFFRixlQUFlLFlBQVksQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBDaHJvbWVEcml2ZXIgZnJvbSAnLi4vLi4vbGliL2Nocm9tZV9kcml2ZXInO1xuaW1wb3J0IGdldEludGVyY2VwdG9yIGZyb20gJy4uLy4uL2xpYi9taXRtcHJveHlfaW50ZXJjZXB0b3InO1xuaW1wb3J0IHtyZWFkRmlsZVN5bmN9IGZyb20gJ2ZzJztcbmltcG9ydCB7Q29tbWFuZE1vZHVsZX0gZnJvbSAneWFyZ3MnO1xuaW1wb3J0IEJMZWFrQ29uZmlnIGZyb20gJy4uLy4uL2xpYi9ibGVha19jb25maWcnO1xuaW1wb3J0IHtERUZBVUxUX0FHRU5UX1VSTCwgREVGQVVMVF9CQUJFTF9QT0xZRklMTF9VUkwsIERFRkFVTFRfQUdFTlRfVFJBTlNGT1JNX1VSTH0gZnJvbSAnLi4vLi4vbGliL21pdG1wcm94eV9pbnRlcmNlcHRvcic7XG5cbmludGVyZmFjZSBDb21tYW5kTGluZUFyZ3Mge1xuICBjb25maWc6IHN0cmluZztcbiAgZGlhZ25vc2U6IGJvb2xlYW47XG4gIGZpeDogbnVtYmVyW107XG59XG5cbmNvbnN0IFByb3h5U2Vzc2lvbjogQ29tbWFuZE1vZHVsZSA9IHtcbiAgY29tbWFuZDogJ3Byb3h5LXNlc3Npb24nLFxuICBkZXNjcmliZTogJ0JlZ2lucyBhIGJyb3dzaW5nIHNlc3Npb24gdGhyb3VnaCB0aGUgQkxlYWsgcHJveHkuIFVzZWZ1bCBmb3IgZGVidWdnaW5nIEJMZWFrIHByb3h5IGlzc3Vlcy4nLFxuICBidWlsZGVyOiB7XG4gICAgY29uZmlnOiB7XG4gICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgIGRlbWFuZDogdHJ1ZSxcbiAgICAgIGRlc2NyaWJlOiBgUGF0aCB0byBhIEJMZWFrIGNvbmZpZ3VyYXRpb24gZmlsZWBcbiAgICB9LFxuICAgIGRpYWdub3NlOiB7XG4gICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICAgIGRlc2NyaWJlOiBgSWYgc2V0IHRvICd0cnVlJywgQkxlYWsgcmV3cml0ZXMgdGhlIHdlYnBhZ2UgYXMgaXQgZG9lcyBkdXJpbmcgZGlhZ25vc2VzYFxuICAgIH0sXG4gICAgZml4OiB7XG4gICAgICB0eXBlOiAnbnVtYmVyJyxcbiAgICAgIGFycmF5OiB0cnVlLFxuICAgICAgZGVmYXVsdDogW10sXG4gICAgICBkZXNjcmliZTogJ1doaWNoIGJ1ZyBmaXhlcyB0byBlbmFibGUgZHVyaW5nIHRoZSBzZXNzaW9uJ1xuICAgIH1cbiAgfSxcbiAgaGFuZGxlcjogYXN5bmMgKGFyZ3M6IENvbW1hbmRMaW5lQXJncykgPT4ge1xuICAgIGNvbnN0IHJhd0NvbmZpZyA9IHJlYWRGaWxlU3luYyhhcmdzLmNvbmZpZykudG9TdHJpbmcoKTtcbiAgICBjb25zdCBjb25maWcgPSBCTGVha0NvbmZpZy5Gcm9tU291cmNlKHJhd0NvbmZpZyk7XG4gICAgY29uc3QgdXJsID0gY29uZmlnLnVybDtcbiAgICBjb25zdCBkaWFnbm9zZSA9IGFyZ3MuZGlhZ25vc2U7XG4gICAgY29uc3QgZml4ZXMgPSBhcmdzLmZpeDtcbiAgICBjb25zdCBkcml2ZXIgPSBhd2FpdCBDaHJvbWVEcml2ZXIuTGF1bmNoKGNvbnNvbGUsIGZhbHNlLCAxOTIwLCAxMDgwLCBbJy9ldmFsJywgREVGQVVMVF9BR0VOVF9VUkwsIERFRkFVTFRfQkFCRUxfUE9MWUZJTExfVVJMLCBERUZBVUxUX0FHRU5UX1RSQU5TRk9STV9VUkxdKTtcbiAgICBkcml2ZXIubWl0bVByb3h5LmNiID0gZ2V0SW50ZXJjZXB0b3Ioe1xuICAgICAgbG9nOiBjb25zb2xlLFxuICAgICAgcmV3cml0ZTogZGlhZ25vc2UsXG4gICAgICBmaXhlczogZml4ZXMsXG4gICAgICBjb25maWc6IGNvbmZpZy5nZXRCcm93c2VySW5qZWN0aW9uKCksXG4gICAgICBkaXNhYmxlQWxsUmV3cml0ZXM6IGZhbHNlLFxuICAgICAgZml4UmV3cml0ZUZ1bmN0aW9uOiBjb25maWcucmV3cml0ZVxuICAgIH0pO1xuICAgIGF3YWl0IGRyaXZlci5uYXZpZ2F0ZVRvKHVybCk7XG4gICAgYXdhaXQgZHJpdmVyLmRlYnVnTG9vcCgpO1xuICAgIGF3YWl0IGRyaXZlci5zaHV0ZG93bigpO1xuICB9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBQcm94eVNlc3Npb247XG4iXX0=