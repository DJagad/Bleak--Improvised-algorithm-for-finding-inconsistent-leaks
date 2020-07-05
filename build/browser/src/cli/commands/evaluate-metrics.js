import * as tslib_1 from "tslib";
import BLeak from '../../lib/bleak';
import ChromeDriver from '../../lib/chrome_driver';
import ProgressProgressBar from '../../lib/progress_progress_bar';
import { readFileSync, writeFileSync } from 'fs';
import BLeakResults from '../../lib/bleak_results';
import { DEFAULT_AGENT_URL, DEFAULT_BABEL_POLYFILL_URL, DEFAULT_AGENT_TRANSFORM_URL } from '../../lib/mitmproxy_interceptor';
var EvaluateMetrics = {
    command: 'evaluate-metrics',
    describe: 'Evaluates the performance of different leak ranking metrics.',
    builder: {
        config: {
            type: 'string',
            demand: true,
            describe: 'Path to a BLeak configuration file. Must contain a fixMap property.'
        },
        results: {
            type: 'string',
            demand: true,
            describe: 'Path to a bleak_results.json from a completed run.'
        },
        debug: {
            type: 'boolean',
            default: false,
            describe: 'If set, print debug information to console.'
        },
        headless: {
            type: 'boolean',
            default: false,
            describe: 'Run in Chrome Headless (currently buggy)'
        },
        chromeSize: {
            type: 'string',
            default: '1920x1080',
            describe: 'Specifies the size of the Chrome browser window'
        },
        'resume-after-failure': {
            type: 'boolean',
            default: false,
            describe: 'If a failure occurs, automatically resume the process until it completes'
        }
    },
    handler: function handler(args) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            function shutDown() {
                return tslib_1.__awaiter(this, void 0, void 0, function () {
                    return tslib_1.__generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                if (shuttingDown) {
                                    return [2 /*return*/];
                                }
                                shuttingDown = true;
                                return [4 /*yield*/, chromeDriver.shutdown()];
                            case 1:
                                _a.sent();
                                // All sockets/subprocesses/resources *should* be closed, so we can just exit.
                                process.exit(0);
                                return [2 /*return*/];
                        }
                    });
                });
            }
            var width, height, chromeSize, progressBar, chromeDriver, configFileSource, results, shuttingDown;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        {
                            chromeSize = /^([0-9]+)x([0-9]+)$/.exec(args.chromeSize);
                            if (!chromeSize) {
                                throw new Error("Invalid chromeSize: " + args.chromeSize);
                            }
                            width = parseInt(chromeSize[1], 10);
                            height = parseInt(chromeSize[2], 10);
                        }
                        progressBar = new ProgressProgressBar(args.debug);
                        return [4 /*yield*/, ChromeDriver.Launch(progressBar, args.headless, width, height, [DEFAULT_AGENT_URL, DEFAULT_BABEL_POLYFILL_URL, DEFAULT_AGENT_TRANSFORM_URL], !args.debug)];
                    case 1:
                        chromeDriver = _a.sent();
                        configFileSource = readFileSync(args.config).toString();
                        results = BLeakResults.FromJSON(JSON.parse(readFileSync(args.results, 'utf8')));
                        shuttingDown = false;
                        // Shut down gracefully on CTRL+C.
                        process.on('SIGINT', function sigintHandler() {
                            return tslib_1.__awaiter(this, void 0, void 0, function () {
                                return tslib_1.__generator(this, function (_a) {
                                    progressBar.log("CTRL+C received.");
                                    // Fix memory leak when resume-after-failure is active.
                                    process.removeListener('SIGINT', sigintHandler);
                                    shutDown();
                                    return [2 /*return*/];
                                });
                            });
                        });
                        BLeak.EvaluateRankingMetrics(configFileSource, progressBar, chromeDriver, results, function (results) {
                            writeFileSync(args.results, Buffer.from(JSON.stringify(results), 'utf8'));
                        }).then(shutDown).catch(function (e) {
                            progressBar.error("" + e);
                            if (args['resume-after-failure']) {
                                progressBar.log("Resuming...");
                                shuttingDown = true;
                                chromeDriver.shutdown().then(function () {
                                    handler(args);
                                }).catch(function () {
                                    handler(args);
                                });
                            }
                            else {
                                progressBar.error("" + e);
                                shutDown();
                            }
                        });
                        return [2 /*return*/];
                }
            });
        });
    }
};
export default EvaluateMetrics;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZhbHVhdGUtbWV0cmljcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9jbGkvY29tbWFuZHMvZXZhbHVhdGUtbWV0cmljcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQ0EsT0FBTyxLQUFLLE1BQU0saUJBQWlCLENBQUM7QUFDcEMsT0FBTyxZQUFZLE1BQU0seUJBQXlCLENBQUM7QUFDbkQsT0FBTyxtQkFBbUIsTUFBTSxpQ0FBaUMsQ0FBQztBQUNsRSxPQUFPLEVBQUMsWUFBWSxFQUFFLGFBQWEsRUFBQyxNQUFNLElBQUksQ0FBQztBQUMvQyxPQUFPLFlBQVksTUFBTSx5QkFBeUIsQ0FBQztBQUNuRCxPQUFPLEVBQUMsaUJBQWlCLEVBQUUsMEJBQTBCLEVBQUUsMkJBQTJCLEVBQUMsTUFBTSxpQ0FBaUMsQ0FBQztBQVczSCxJQUFNLGVBQWUsR0FBa0I7SUFDckMsT0FBTyxFQUFFLGtCQUFrQjtJQUMzQixRQUFRLEVBQUUsOERBQThEO0lBQ3hFLE9BQU8sRUFBRTtRQUNQLE1BQU0sRUFBRTtZQUNOLElBQUksRUFBRSxRQUFRO1lBQ2QsTUFBTSxFQUFFLElBQUk7WUFDWixRQUFRLEVBQUUscUVBQXFFO1NBQ2hGO1FBQ0QsT0FBTyxFQUFFO1lBQ1AsSUFBSSxFQUFFLFFBQVE7WUFDZCxNQUFNLEVBQUUsSUFBSTtZQUNaLFFBQVEsRUFBRSxvREFBb0Q7U0FDL0Q7UUFDRCxLQUFLLEVBQUU7WUFDTCxJQUFJLEVBQUUsU0FBUztZQUNmLE9BQU8sRUFBRSxLQUFLO1lBQ2QsUUFBUSxFQUFFLDZDQUE2QztTQUN4RDtRQUNELFFBQVEsRUFBRTtZQUNSLElBQUksRUFBRSxTQUFTO1lBQ2YsT0FBTyxFQUFFLEtBQUs7WUFDZCxRQUFRLEVBQUUsMENBQTBDO1NBQ3JEO1FBQ0QsVUFBVSxFQUFFO1lBQ1YsSUFBSSxFQUFFLFFBQVE7WUFDZCxPQUFPLEVBQUUsV0FBVztZQUNwQixRQUFRLEVBQUUsaURBQWlEO1NBQzVE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USxFQUFFLENBQUMsSUFBSSxDQUFDO29DQUMzQixPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7Z0NBQ2hCLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztvQ0FDUCxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7Z0NBQ2hCLENBQUMsQ0FBQyxDQUFDOzRCQUNMLENBQUM7NEJBQUMsSUFBSSxDQUFDLENBQUM7Z0NBQ04sV0FBVyxDQUFDLEtBQUssQ0FBQyxLQUFHLENBQUcsQ0FBQyxDQUFDO2dDQUMxQixRQUFRLEVBQUUsQ0FBQzs0QkFDYixDQUFDO3dCQUNILENBQUMsQ0FBQyxDQUFDOzs7OztLQUNKO0NBQ0YsQ0FBQztBQUVGLGVBQWUsZUFBZSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtDb21tYW5kTW9kdWxlfSBmcm9tICd5YXJncyc7XG5pbXBvcnQgQkxlYWsgZnJvbSAnLi4vLi4vbGliL2JsZWFrJztcbmltcG9ydCBDaHJvbWVEcml2ZXIgZnJvbSAnLi4vLi4vbGliL2Nocm9tZV9kcml2ZXInO1xuaW1wb3J0IFByb2dyZXNzUHJvZ3Jlc3NCYXIgZnJvbSAnLi4vLi4vbGliL3Byb2dyZXNzX3Byb2dyZXNzX2Jhcic7XG5pbXBvcnQge3JlYWRGaWxlU3luYywgd3JpdGVGaWxlU3luY30gZnJvbSAnZnMnO1xuaW1wb3J0IEJMZWFrUmVzdWx0cyBmcm9tICcuLi8uLi9saWIvYmxlYWtfcmVzdWx0cyc7XG5pbXBvcnQge0RFRkFVTFRfQUdFTlRfVVJMLCBERUZBVUxUX0JBQkVMX1BPTFlGSUxMX1VSTCwgREVGQVVMVF9BR0VOVF9UUkFOU0ZPUk1fVVJMfSBmcm9tICcuLi8uLi9saWIvbWl0bXByb3h5X2ludGVyY2VwdG9yJztcblxuaW50ZXJmYWNlIENvbW1hbmRMaW5lQXJncyB7XG4gIGNvbmZpZzogc3RyaW5nO1xuICByZXN1bHRzOiBzdHJpbmc7XG4gIGRlYnVnOiBib29sZWFuO1xuICBoZWFkbGVzczogYm9vbGVhbjtcbiAgY2hyb21lU2l6ZTogc3RyaW5nO1xuICAncmVzdW1lLWFmdGVyLWZhaWx1cmUnOiBib29sZWFuO1xufVxuXG5jb25zdCBFdmFsdWF0ZU1ldHJpY3M6IENvbW1hbmRNb2R1bGUgPSB7XG4gIGNvbW1hbmQ6ICdldmFsdWF0ZS1tZXRyaWNzJyxcbiAgZGVzY3JpYmU6ICdFdmFsdWF0ZXMgdGhlIHBlcmZvcm1hbmNlIG9mIGRpZmZlcmVudCBsZWFrIHJhbmtpbmcgbWV0cmljcy4nLFxuICBidWlsZGVyOiB7XG4gICAgY29uZmlnOiB7XG4gICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgIGRlbWFuZDogdHJ1ZSxcbiAgICAgIGRlc2NyaWJlOiAnUGF0aCB0byBhIEJMZWFrIGNvbmZpZ3VyYXRpb24gZmlsZS4gTXVzdCBjb250YWluIGEgZml4TWFwIHByb3BlcnR5LidcbiAgICB9LFxuICAgIHJlc3VsdHM6IHtcbiAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgZGVtYW5kOiB0cnVlLFxuICAgICAgZGVzY3JpYmU6ICdQYXRoIHRvIGEgYmxlYWtfcmVzdWx0cy5qc29uIGZyb20gYSBjb21wbGV0ZWQgcnVuLidcbiAgICB9LFxuICAgIGRlYnVnOiB7XG4gICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICAgIGRlc2NyaWJlOiAnSWYgc2V0LCBwcmludCBkZWJ1ZyBpbmZvcm1hdGlvbiB0byBjb25zb2xlLidcbiAgICB9LFxuICAgIGhlYWRsZXNzOiB7XG4gICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICAgIGRlc2NyaWJlOiAnUnVuIGluIENocm9tZSBIZWFkbGVzcyAoY3VycmVudGx5IGJ1Z2d5KSdcbiAgICB9LFxuICAgIGNocm9tZVNpemU6IHtcbiAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgZGVmYXVsdDogJzE5MjB4MTA4MCcsXG4gICAgICBkZXNjcmliZTogJ1NwZWNpZmllcyB0aGUgc2l6ZSBvZiB0aGUgQ2hyb21lIGJyb3dzZXIgd2luZG93J1xuICAgIH0sXG4gICAgJ3Jlc3VtZS1hZnRlci1mYWlsdXJlJzoge1xuICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgZGVmYXVsdDogZmFsc2UsXG4gICAgICBkZXNjcmliZTogJ0lmIGEgZmFpbHVyZSBvY2N1cnMsIGF1dG9tYXRpY2FsbHkgcmVzdW1lIHRoZSBwcm9jZXNzIHVudGlsIGl0IGNvbXBsZXRlcydcbiAgICB9XG4gIH0sXG4gIGhhbmRsZXI6IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZXIoYXJnczogQ29tbWFuZExpbmVBcmdzKSB7XG4gICAgbGV0IHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyO1xuICAgIHtcbiAgICAgIGNvbnN0IGNocm9tZVNpemUgPSAvXihbMC05XSspeChbMC05XSspJC8uZXhlYyhhcmdzLmNocm9tZVNpemUpO1xuICAgICAgaWYgKCFjaHJvbWVTaXplKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBjaHJvbWVTaXplOiAke2FyZ3MuY2hyb21lU2l6ZX1gKTtcbiAgICAgIH1cbiAgICAgIHdpZHRoID0gcGFyc2VJbnQoY2hyb21lU2l6ZVsxXSwgMTApO1xuICAgICAgaGVpZ2h0ID0gcGFyc2VJbnQoY2hyb21lU2l6ZVsyXSwgMTApO1xuICAgIH1cbiAgICBjb25zdCBwcm9ncmVzc0JhciA9IG5ldyBQcm9ncmVzc1Byb2dyZXNzQmFyKGFyZ3MuZGVidWcpO1xuICAgIGNvbnN0IGNocm9tZURyaXZlciA9IGF3YWl0IENocm9tZURyaXZlci5MYXVuY2gocHJvZ3Jlc3NCYXIsIGFyZ3MuaGVhZGxlc3MsIHdpZHRoLCBoZWlnaHQsIFtERUZBVUxUX0FHRU5UX1VSTCwgREVGQVVMVF9CQUJFTF9QT0xZRklMTF9VUkwsIERFRkFVTFRfQUdFTlRfVFJBTlNGT1JNX1VSTF0sICFhcmdzLmRlYnVnKTtcbiAgICBjb25zdCBjb25maWdGaWxlU291cmNlID0gcmVhZEZpbGVTeW5jKGFyZ3MuY29uZmlnKS50b1N0cmluZygpO1xuICAgIGNvbnN0IHJlc3VsdHMgPSBCTGVha1Jlc3VsdHMuRnJvbUpTT04oSlNPTi5wYXJzZShyZWFkRmlsZVN5bmMoYXJncy5yZXN1bHRzLCAndXRmOCcpKSk7XG5cbiAgICBsZXQgc2h1dHRpbmdEb3duID0gZmFsc2U7XG4gICAgYXN5bmMgZnVuY3Rpb24gc2h1dERvd24oKSB7XG4gICAgICBpZiAoc2h1dHRpbmdEb3duKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHNodXR0aW5nRG93biA9IHRydWU7XG4gICAgICBhd2FpdCBjaHJvbWVEcml2ZXIuc2h1dGRvd24oKTtcbiAgICAgIC8vIEFsbCBzb2NrZXRzL3N1YnByb2Nlc3Nlcy9yZXNvdXJjZXMgKnNob3VsZCogYmUgY2xvc2VkLCBzbyB3ZSBjYW4ganVzdCBleGl0LlxuICAgICAgcHJvY2Vzcy5leGl0KDApO1xuICAgIH1cbiAgICAvLyBTaHV0IGRvd24gZ3JhY2VmdWxseSBvbiBDVFJMK0MuXG4gICAgcHJvY2Vzcy5vbignU0lHSU5UJywgYXN5bmMgZnVuY3Rpb24gc2lnaW50SGFuZGxlcigpIHtcbiAgICAgIHByb2dyZXNzQmFyLmxvZyhgQ1RSTCtDIHJlY2VpdmVkLmApO1xuICAgICAgLy8gRml4IG1lbW9yeSBsZWFrIHdoZW4gcmVzdW1lLWFmdGVyLWZhaWx1cmUgaXMgYWN0aXZlLlxuICAgICAgcHJvY2Vzcy5yZW1vdmVMaXN0ZW5lcignU0lHSU5UJywgc2lnaW50SGFuZGxlcik7XG4gICAgICBzaHV0RG93bigpO1xuICAgIH0pO1xuXG4gICAgQkxlYWsuRXZhbHVhdGVSYW5raW5nTWV0cmljcyhjb25maWdGaWxlU291cmNlLCBwcm9ncmVzc0JhciwgY2hyb21lRHJpdmVyLCByZXN1bHRzLCAocmVzdWx0cykgPT4ge1xuICAgICAgd3JpdGVGaWxlU3luYyhhcmdzLnJlc3VsdHMsIEJ1ZmZlci5mcm9tKEpTT04uc3RyaW5naWZ5KHJlc3VsdHMpLCAndXRmOCcpKTtcbiAgICB9KS50aGVuKHNodXREb3duKS5jYXRjaCgoZSkgPT4ge1xuICAgICAgcHJvZ3Jlc3NCYXIuZXJyb3IoYCR7ZX1gKTtcbiAgICAgIGlmIChhcmdzWydyZXN1bWUtYWZ0ZXItZmFpbHVyZSddKSB7XG4gICAgICAgIHByb2dyZXNzQmFyLmxvZyhgUmVzdW1pbmcuLi5gKTtcbiAgICAgICAgc2h1dHRpbmdEb3duID0gdHJ1ZTtcbiAgICAgICAgY2hyb21lRHJpdmVyLnNodXRkb3duKCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgaGFuZGxlcihhcmdzKTtcbiAgICAgICAgfSkuY2F0Y2goKCkgPT4ge1xuICAgICAgICAgIGhhbmRsZXIoYXJncyk7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcHJvZ3Jlc3NCYXIuZXJyb3IoYCR7ZX1gKTtcbiAgICAgICAgc2h1dERvd24oKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufTtcblxuZXhwb3J0IGRlZmF1bHQgRXZhbHVhdGVNZXRyaWNzO1xuIl19