"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chrome_driver_1 = require("../../lib/chrome_driver");
const mitmproxy_interceptor_1 = require("../../lib/mitmproxy_interceptor");
const fs_1 = require("fs");
const bleak_config_1 = require("../../lib/bleak_config");
const mitmproxy_interceptor_2 = require("../../lib/mitmproxy_interceptor");
const ProxySession = {
    command: 'proxy-session',
    describe: 'Begins a browsing session through the BLeak proxy. Useful for debugging BLeak proxy issues.',
    builder: {
        config: {
            type: 'string',
            demand: true,
            describe: `Path to a BLeak configuration file`
        },
        diagnose: {
            type: 'boolean',
            default: false,
            describe: `If set to 'true', BLeak rewrites the webpage as it does during diagnoses`
        },
        fix: {
            type: 'number',
            array: true,
            default: [],
            describe: 'Which bug fixes to enable during the session'
        }
    },
    handler: async (args) => {
        const rawConfig = fs_1.readFileSync(args.config).toString();
        const config = bleak_config_1.default.FromSource(rawConfig);
        const url = config.url;
        const diagnose = args.diagnose;
        const fixes = args.fix;
        const driver = await chrome_driver_1.default.Launch(console, false, 1920, 1080, ['/eval', mitmproxy_interceptor_2.DEFAULT_AGENT_URL, mitmproxy_interceptor_2.DEFAULT_BABEL_POLYFILL_URL, mitmproxy_interceptor_2.DEFAULT_AGENT_TRANSFORM_URL]);
        driver.mitmProxy.cb = mitmproxy_interceptor_1.default({
            log: console,
            rewrite: diagnose,
            fixes: fixes,
            config: config.getBrowserInjection(),
            disableAllRewrites: false,
            fixRewriteFunction: config.rewrite
        });
        await driver.navigateTo(url);
        await driver.debugLoop();
        await driver.shutdown();
    }
};
exports.default = ProxySession;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJveHlfc2Vzc2lvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9jbGkvY29tbWFuZHMvcHJveHlfc2Vzc2lvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDJEQUFtRDtBQUNuRCwyRUFBNkQ7QUFDN0QsMkJBQWdDO0FBRWhDLHlEQUFpRDtBQUNqRCwyRUFBMkg7QUFRM0gsTUFBTSxZQUFZLEdBQWtCO0lBQ2xDLE9BQU8sRUFBRSxlQUFlO0lBQ3hCLFFBQVEsRUFBRSw2RkFBNkY7SUFDdkcsT0FBTyxFQUFFO1FBQ1AsTUFBTSxFQUFFO1lBQ04sSUFBSSxFQUFFLFFBQVE7WUFDZCxNQUFNLEVBQUUsSUFBSTtZQUNaLFFBQVEsRUFBRSxvQ0FBb0M7U0FDL0M7UUFDRCxRQUFRLEVBQUU7WUFDUixJQUFJLEVBQUUsU0FBUztZQUNmLE9BQU8sRUFBRSxLQUFLO1lBQ2QsUUFBUSxFQUFFLDBFQUEwRTtTQUNyRjtRQUNELEdBQUcsRUFBRTtZQUNILElBQUksRUFBRSxRQUFRO1lBQ2QsS0FBSyxFQUFFLElBQUk7WUFDWCxPQUFPLEVBQUUsRUFBRTtZQUNYLFFBQVEsRUFBRSw4Q0FBOEM7U0FDekQ7S0FDRjtJQUNELE9BQU8sRUFBRSxLQUFLLEVBQUUsSUFBcUIsRUFBRSxFQUFFO1FBQ3ZDLE1BQU0sU0FBUyxHQUFHLGlCQUFZLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ3ZELE1BQU0sTUFBTSxHQUFHLHNCQUFXLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ2pELE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUM7UUFDdkIsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQztRQUMvQixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDO1FBQ3ZCLE1BQU0sTUFBTSxHQUFHLE1BQU0sdUJBQVksQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUMsT0FBTyxFQUFFLHlDQUFpQixFQUFFLGtEQUEwQixFQUFFLG1EQUEyQixDQUFDLENBQUMsQ0FBQztRQUM1SixNQUFNLENBQUMsU0FBUyxDQUFDLEVBQUUsR0FBRywrQkFBYyxDQUFDO1lBQ25DLEdBQUcsRUFBRSxPQUFPO1lBQ1osT0FBTyxFQUFFLFFBQVE7WUFDakIsS0FBSyxFQUFFLEtBQUs7WUFDWixNQUFNLEVBQUUsTUFBTSxDQUFDLG1CQUFtQixFQUFFO1lBQ3BDLGtCQUFrQixFQUFFLEtBQUs7WUFDekIsa0JBQWtCLEVBQUUsTUFBTSxDQUFDLE9BQU87U0FDbkMsQ0FBQyxDQUFDO1FBQ0gsTUFBTSxNQUFNLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzdCLE1BQU0sTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQ3pCLE1BQU0sTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQzFCLENBQUM7Q0FDRixDQUFDO0FBRUYsa0JBQWUsWUFBWSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IENocm9tZURyaXZlciBmcm9tICcuLi8uLi9saWIvY2hyb21lX2RyaXZlcic7XG5pbXBvcnQgZ2V0SW50ZXJjZXB0b3IgZnJvbSAnLi4vLi4vbGliL21pdG1wcm94eV9pbnRlcmNlcHRvcic7XG5pbXBvcnQge3JlYWRGaWxlU3luY30gZnJvbSAnZnMnO1xuaW1wb3J0IHtDb21tYW5kTW9kdWxlfSBmcm9tICd5YXJncyc7XG5pbXBvcnQgQkxlYWtDb25maWcgZnJvbSAnLi4vLi4vbGliL2JsZWFrX2NvbmZpZyc7XG5pbXBvcnQge0RFRkFVTFRfQUdFTlRfVVJMLCBERUZBVUxUX0JBQkVMX1BPTFlGSUxMX1VSTCwgREVGQVVMVF9BR0VOVF9UUkFOU0ZPUk1fVVJMfSBmcm9tICcuLi8uLi9saWIvbWl0bXByb3h5X2ludGVyY2VwdG9yJztcblxuaW50ZXJmYWNlIENvbW1hbmRMaW5lQXJncyB7XG4gIGNvbmZpZzogc3RyaW5nO1xuICBkaWFnbm9zZTogYm9vbGVhbjtcbiAgZml4OiBudW1iZXJbXTtcbn1cblxuY29uc3QgUHJveHlTZXNzaW9uOiBDb21tYW5kTW9kdWxlID0ge1xuICBjb21tYW5kOiAncHJveHktc2Vzc2lvbicsXG4gIGRlc2NyaWJlOiAnQmVnaW5zIGEgYnJvd3Npbmcgc2Vzc2lvbiB0aHJvdWdoIHRoZSBCTGVhayBwcm94eS4gVXNlZnVsIGZvciBkZWJ1Z2dpbmcgQkxlYWsgcHJveHkgaXNzdWVzLicsXG4gIGJ1aWxkZXI6IHtcbiAgICBjb25maWc6IHtcbiAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgZGVtYW5kOiB0cnVlLFxuICAgICAgZGVzY3JpYmU6IGBQYXRoIHRvIGEgQkxlYWsgY29uZmlndXJhdGlvbiBmaWxlYFxuICAgIH0sXG4gICAgZGlhZ25vc2U6IHtcbiAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgIGRlZmF1bHQ6IGZhbHNlLFxuICAgICAgZGVzY3JpYmU6IGBJZiBzZXQgdG8gJ3RydWUnLCBCTGVhayByZXdyaXRlcyB0aGUgd2VicGFnZSBhcyBpdCBkb2VzIGR1cmluZyBkaWFnbm9zZXNgXG4gICAgfSxcbiAgICBmaXg6IHtcbiAgICAgIHR5cGU6ICdudW1iZXInLFxuICAgICAgYXJyYXk6IHRydWUsXG4gICAgICBkZWZhdWx0OiBbXSxcbiAgICAgIGRlc2NyaWJlOiAnV2hpY2ggYnVnIGZpeGVzIHRvIGVuYWJsZSBkdXJpbmcgdGhlIHNlc3Npb24nXG4gICAgfVxuICB9LFxuICBoYW5kbGVyOiBhc3luYyAoYXJnczogQ29tbWFuZExpbmVBcmdzKSA9PiB7XG4gICAgY29uc3QgcmF3Q29uZmlnID0gcmVhZEZpbGVTeW5jKGFyZ3MuY29uZmlnKS50b1N0cmluZygpO1xuICAgIGNvbnN0IGNvbmZpZyA9IEJMZWFrQ29uZmlnLkZyb21Tb3VyY2UocmF3Q29uZmlnKTtcbiAgICBjb25zdCB1cmwgPSBjb25maWcudXJsO1xuICAgIGNvbnN0IGRpYWdub3NlID0gYXJncy5kaWFnbm9zZTtcbiAgICBjb25zdCBmaXhlcyA9IGFyZ3MuZml4O1xuICAgIGNvbnN0IGRyaXZlciA9IGF3YWl0IENocm9tZURyaXZlci5MYXVuY2goY29uc29sZSwgZmFsc2UsIDE5MjAsIDEwODAsIFsnL2V2YWwnLCBERUZBVUxUX0FHRU5UX1VSTCwgREVGQVVMVF9CQUJFTF9QT0xZRklMTF9VUkwsIERFRkFVTFRfQUdFTlRfVFJBTlNGT1JNX1VSTF0pO1xuICAgIGRyaXZlci5taXRtUHJveHkuY2IgPSBnZXRJbnRlcmNlcHRvcih7XG4gICAgICBsb2c6IGNvbnNvbGUsXG4gICAgICByZXdyaXRlOiBkaWFnbm9zZSxcbiAgICAgIGZpeGVzOiBmaXhlcyxcbiAgICAgIGNvbmZpZzogY29uZmlnLmdldEJyb3dzZXJJbmplY3Rpb24oKSxcbiAgICAgIGRpc2FibGVBbGxSZXdyaXRlczogZmFsc2UsXG4gICAgICBmaXhSZXdyaXRlRnVuY3Rpb246IGNvbmZpZy5yZXdyaXRlXG4gICAgfSk7XG4gICAgYXdhaXQgZHJpdmVyLm5hdmlnYXRlVG8odXJsKTtcbiAgICBhd2FpdCBkcml2ZXIuZGVidWdMb29wKCk7XG4gICAgYXdhaXQgZHJpdmVyLnNodXRkb3duKCk7XG4gIH1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IFByb3h5U2Vzc2lvbjtcbiJdfQ==