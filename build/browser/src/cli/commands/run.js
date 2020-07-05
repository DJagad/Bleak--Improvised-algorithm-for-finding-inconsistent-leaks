import * as tslib_1 from "tslib";
import { readFileSync, mkdirSync, existsSync, createWriteStream, writeFileSync } from 'fs';
import { join } from 'path';
import BLeak from '../../lib/bleak';
import ChromeDriver from '../../lib/chrome_driver';
import TextReporter from '../../lib/text_reporter';
import { createGzip } from 'zlib';
import ProgressProgressBar from '../../lib/progress_progress_bar';
import { DEFAULT_AGENT_URL, DEFAULT_BABEL_POLYFILL_URL, DEFAULT_AGENT_TRANSFORM_URL } from '../../lib/mitmproxy_interceptor';
import BLeakResults from '../../lib/bleak_results';
var Run = {
    command: "run",
    describe: "Runs BLeak to locate, rank, and diagnose memory leaks in a web application.",
    handler: function (args) {
        var width, height;
        {
            var chromeSize = /^([0-9]+)x([0-9]+)$/.exec(args.chromeSize);
            if (!chromeSize) {
                throw new Error("Invalid chromeSize: " + args.chromeSize);
            }
            width = parseInt(chromeSize[1], 10);
            height = parseInt(chromeSize[2], 10);
        }
        if (!existsSync(args.out)) {
            mkdirSync(args.out);
        }
        if (args.snapshot) {
            if (!existsSync(join(args.out, 'snapshots'))) {
                mkdirSync(join(args.out, 'snapshots'));
            }
            mkdirSync(join(args.out, 'snapshots', 'leak_detection'));
        }
        var SCREENSHOTS_DIR = join(args.out, 'screenshots');
        if (args['take-screenshots'] !== -1) {
            if (!existsSync(SCREENSHOTS_DIR)) {
                mkdirSync(SCREENSHOTS_DIR);
            }
        }
        var progressBar = new ProgressProgressBar(args.debug);
        // Add stack traces to Node warnings.
        // https://stackoverflow.com/a/38482688
        process.on('warning', function (e) { return progressBar.error(e.stack); });
        function main() {
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
                                    if (screenshotTimer) {
                                        clearInterval(screenshotTimer);
                                    }
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
                var configFileSource, bleakResultsOutput, bleakResults, chromeDriver, screenshotTimer, shuttingDown, i;
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            configFileSource = readFileSync(args.config).toString();
                            bleakResultsOutput = join(args.out, 'bleak_results.json');
                            if (existsSync(bleakResultsOutput)) {
                                console.log("Resuming using data from " + bleakResultsOutput);
                                try {
                                    bleakResults = BLeakResults.FromJSON(JSON.parse(readFileSync(bleakResultsOutput).toString()));
                                }
                                catch (e) {
                                    throw new Error("File at " + bleakResultsOutput + " exists, but is not a valid BLeak results file: " + e);
                                }
                            }
                            writeFileSync(join(args.out, 'config.js'), configFileSource);
                            return [4 /*yield*/, ChromeDriver.Launch(progressBar, args.headless, width, height, ['/eval', DEFAULT_AGENT_URL, DEFAULT_BABEL_POLYFILL_URL, DEFAULT_AGENT_TRANSFORM_URL], !args.debug)];
                        case 1:
                            chromeDriver = _a.sent();
                            screenshotTimer = null;
                            if (args['take-screenshots'] > -1) {
                                screenshotTimer = setInterval(function () {
                                    return tslib_1.__awaiter(this, void 0, void 0, function () {
                                        var time, ss, ssFilename;
                                        return tslib_1.__generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0:
                                                    time = Date.now();
                                                    progressBar.debug("Taking screenshot...");
                                                    return [4 /*yield*/, chromeDriver.takeScreenshot()];
                                                case 1:
                                                    ss = _a.sent();
                                                    ssFilename = join(SCREENSHOTS_DIR, "screenshot_" + time + ".png");
                                                    progressBar.debug("Writing " + ssFilename + "...");
                                                    writeFileSync(ssFilename, ss);
                                                    return [2 /*return*/];
                                            }
                                        });
                                    });
                                }, args['take-screenshots'] * 1000);
                            }
                            shuttingDown = false;
                            // Shut down gracefully on CTRL+C.
                            process.on('SIGINT', function () {
                                return tslib_1.__awaiter(this, void 0, void 0, function () {
                                    return tslib_1.__generator(this, function (_a) {
                                        console.log("CTRL+C received.");
                                        shutDown();
                                        return [2 /*return*/];
                                    });
                                });
                            });
                            i = 0;
                            BLeak.FindLeaks(configFileSource, progressBar, chromeDriver, function (sn) {
                                if (args.snapshot) {
                                    var str = createWriteStream(join(args.out, 'snapshots', 'leak_detection', "snapshot_" + i + ".heapsnapshot.gz"));
                                    i++;
                                    var gz_1 = createGzip();
                                    gz_1.pipe(str);
                                    sn.onSnapshotChunk = function (chunk, end) {
                                        gz_1.write(chunk);
                                        if (end) {
                                            gz_1.end();
                                        }
                                    };
                                }
                                return Promise.resolve();
                            }, bleakResults).then(function (results) {
                                writeFileSync(bleakResultsOutput, JSON.stringify(results));
                                var resultsLog = TextReporter(results);
                                writeFileSync(join(args.out, 'bleak_report.log'), resultsLog);
                                console.log("Results can be found in " + args.out);
                                return shutDown();
                            }).catch(function (e) {
                                progressBar.error("" + e);
                                return shutDown();
                            });
                            return [2 /*return*/];
                    }
                });
            });
        }
        main();
    },
    builder: {
        out: {
            type: 'string',
            demand: true,
            describe: 'Directory to output leaks and source code to'
        },
        config: {
            type: 'string',
            demand: true,
            describe: 'Configuration file to use with BLeak'
        },
        snapshot: {
            type: 'boolean',
            default: false,
            describe: 'Save heap snapshots into output folder'
        },
        headless: {
            type: 'boolean',
            default: false,
            describe: "Run Chrome in headless mode (no GUI) (currently buggy due to Chrome bugs)"
        },
        debug: {
            type: 'boolean',
            default: false,
            describe: 'Print debug information to console during run'
        },
        'take-screenshots': {
            type: 'number',
            default: -1,
            describe: 'Take periodic screenshots every n seconds. Useful for debugging hung headless runs. -1 disables.'
        },
        chromeSize: {
            type: 'string',
            default: '1920x1080',
            describe: 'Specifies the size of the Chrome browser window'
        }
    }
};
export default Run;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVuLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL2NsaS9jb21tYW5kcy9ydW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sRUFBQyxZQUFZLEVBQUUsU0FBUyxFQUFFLFVBQVUsRUFBRSxpQkFBaUIsRUFBRSxhQUFhLEVBQUMsTUFBTSxJQUFJLENBQUM7QUFDekYsT0FBTyxFQUFDLElBQUksRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUMxQixPQUFPLEtBQUssTUFBTSxpQkFBaUIsQ0FBQztBQUNwQyxPQUFPLFlBQVksTUFBTSx5QkFBeUIsQ0FBQztBQUNuRCxPQUFPLFlBQVksTUFBTSx5QkFBeUIsQ0FBQztBQUNuRCxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQ2hDLE9BQU8sbUJBQW1CLE1BQU0saUNBQWlDLENBQUM7QUFFbEUsT0FBTyxFQUFDLGlCQUFpQixFQUFFLDBCQUEwQixFQUFFLDJCQUEyQixFQUFDLE1BQU0saUNBQWlDLENBQUM7QUFDM0gsT0FBTyxZQUFZLE1BQU0seUJBQXlCLENBQUM7QUFZbkQsSUFBTSxHQUFHLEdBQWtCO0lBQ3pCLE9BQU8sRUFBRSxLQUFLO0lBQ2QsUUFBUSxFQUFFLDZFQUE2RTtJQUN2RixPQUFPLEVBQUUsVUFBQyxJQUFxQjtRQUM3QixJQUFJLEtBQWEsRUFBRSxNQUFjLENBQUM7UUFDbEMsQ0FBQztZQUNDLElBQU0sVUFBVSxHQUFHLHFCQUFxQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDL0QsRUFBRSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO2dCQUNoQixNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF1QixJQUFJLENBQUMsVUFBWSxDQUFDLENBQUM7WUFDNUQsQ0FBQztZQUNELEtBQUssR0FBRyxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxD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QWUsR0FBRyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtyZWFkRmlsZVN5bmMsIG1rZGlyU3luYywgZXhpc3RzU3luYywgY3JlYXRlV3JpdGVTdHJlYW0sIHdyaXRlRmlsZVN5bmN9IGZyb20gJ2ZzJztcbmltcG9ydCB7am9pbn0gZnJvbSAncGF0aCc7XG5pbXBvcnQgQkxlYWsgZnJvbSAnLi4vLi4vbGliL2JsZWFrJztcbmltcG9ydCBDaHJvbWVEcml2ZXIgZnJvbSAnLi4vLi4vbGliL2Nocm9tZV9kcml2ZXInO1xuaW1wb3J0IFRleHRSZXBvcnRlciBmcm9tICcuLi8uLi9saWIvdGV4dF9yZXBvcnRlcic7XG5pbXBvcnQge2NyZWF0ZUd6aXB9IGZyb20gJ3psaWInO1xuaW1wb3J0IFByb2dyZXNzUHJvZ3Jlc3NCYXIgZnJvbSAnLi4vLi4vbGliL3Byb2dyZXNzX3Byb2dyZXNzX2Jhcic7XG5pbXBvcnQge0NvbW1hbmRNb2R1bGV9IGZyb20gJ3lhcmdzJztcbmltcG9ydCB7REVGQVVMVF9BR0VOVF9VUkwsIERFRkFVTFRfQkFCRUxfUE9MWUZJTExfVVJMLCBERUZBVUxUX0FHRU5UX1RSQU5TRk9STV9VUkx9IGZyb20gJy4uLy4uL2xpYi9taXRtcHJveHlfaW50ZXJjZXB0b3InO1xuaW1wb3J0IEJMZWFrUmVzdWx0cyBmcm9tICcuLi8uLi9saWIvYmxlYWtfcmVzdWx0cyc7XG5cbmludGVyZmFjZSBDb21tYW5kTGluZUFyZ3Mge1xuICBvdXQ6IHN0cmluZztcbiAgY29uZmlnOiBzdHJpbmc7XG4gIHNuYXBzaG90OiBib29sZWFuO1xuICBoZWFkbGVzczogYm9vbGVhbjtcbiAgZGVidWc6IGJvb2xlYW47XG4gICd0YWtlLXNjcmVlbnNob3RzJzogbnVtYmVyO1xuICBjaHJvbWVTaXplOiBzdHJpbmc7XG59XG5cbmNvbnN0IFJ1bjogQ29tbWFuZE1vZHVsZSA9IHtcbiAgY29tbWFuZDogXCJydW5cIixcbiAgZGVzY3JpYmU6IGBSdW5zIEJMZWFrIHRvIGxvY2F0ZSwgcmFuaywgYW5kIGRpYWdub3NlIG1lbW9yeSBsZWFrcyBpbiBhIHdlYiBhcHBsaWNhdGlvbi5gLFxuICBoYW5kbGVyOiAoYXJnczogQ29tbWFuZExpbmVBcmdzKSA9PiB7XG4gICAgbGV0IHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyO1xuICAgIHtcbiAgICAgIGNvbnN0IGNocm9tZVNpemUgPSAvXihbMC05XSspeChbMC05XSspJC8uZXhlYyhhcmdzLmNocm9tZVNpemUpO1xuICAgICAgaWYgKCFjaHJvbWVTaXplKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBjaHJvbWVTaXplOiAke2FyZ3MuY2hyb21lU2l6ZX1gKTtcbiAgICAgIH1cbiAgICAgIHdpZHRoID0gcGFyc2VJbnQoY2hyb21lU2l6ZVsxXSwgMTApO1xuICAgICAgaGVpZ2h0ID0gcGFyc2VJbnQoY2hyb21lU2l6ZVsyXSwgMTApO1xuICAgIH1cbiAgICBpZiAoIWV4aXN0c1N5bmMoYXJncy5vdXQpKSB7XG4gICAgICBta2RpclN5bmMoYXJncy5vdXQpO1xuICAgIH1cbiAgICBpZiAoYXJncy5zbmFwc2hvdCkge1xuICAgICAgaWYgKCFleGlzdHNTeW5jKGpvaW4oYXJncy5vdXQsICdzbmFwc2hvdHMnKSkpIHtcbiAgICAgICAgbWtkaXJTeW5jKGpvaW4oYXJncy5vdXQsICdzbmFwc2hvdHMnKSk7XG4gICAgICB9XG4gICAgICBta2RpclN5bmMoam9pbihhcmdzLm91dCwgJ3NuYXBzaG90cycsICdsZWFrX2RldGVjdGlvbicpKTtcbiAgICB9XG4gICAgY29uc3QgU0NSRUVOU0hPVFNfRElSID0gam9pbihhcmdzLm91dCwgJ3NjcmVlbnNob3RzJyk7XG4gICAgaWYgKGFyZ3NbJ3Rha2Utc2NyZWVuc2hvdHMnXSAhPT0gLTEpIHtcbiAgICAgIGlmICghZXhpc3RzU3luYyhTQ1JFRU5TSE9UU19ESVIpKSB7XG4gICAgICAgIG1rZGlyU3luYyhTQ1JFRU5TSE9UU19ESVIpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IHByb2dyZXNzQmFyID0gbmV3IFByb2dyZXNzUHJvZ3Jlc3NCYXIoYXJncy5kZWJ1Zyk7XG4gICAgLy8gQWRkIHN0YWNrIHRyYWNlcyB0byBOb2RlIHdhcm5pbmdzLlxuICAgIC8vIGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8zODQ4MjY4OFxuICAgIHByb2Nlc3Mub24oJ3dhcm5pbmcnLCAoZTogRXJyb3IpID0+IHByb2dyZXNzQmFyLmVycm9yKGUuc3RhY2spKTtcblxuICAgIGFzeW5jIGZ1bmN0aW9uIG1haW4oKSB7XG4gICAgICBjb25zdCBjb25maWdGaWxlU291cmNlID0gcmVhZEZpbGVTeW5jKGFyZ3MuY29uZmlnKS50b1N0cmluZygpO1xuICAgICAgY29uc3QgYmxlYWtSZXN1bHRzT3V0cHV0ID0gam9pbihhcmdzLm91dCwgJ2JsZWFrX3Jlc3VsdHMuanNvbicpO1xuICAgICAgbGV0IGJsZWFrUmVzdWx0czogQkxlYWtSZXN1bHRzIHwgbnVsbDtcbiAgICAgIGlmIChleGlzdHNTeW5jKGJsZWFrUmVzdWx0c091dHB1dCkpIHtcbiAgICAgICAgY29uc29sZS5sb2coYFJlc3VtaW5nIHVzaW5nIGRhdGEgZnJvbSAke2JsZWFrUmVzdWx0c091dHB1dH1gKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBibGVha1Jlc3VsdHMgPSBCTGVha1Jlc3VsdHMuRnJvbUpTT04oSlNPTi5wYXJzZShyZWFkRmlsZVN5bmMoYmxlYWtSZXN1bHRzT3V0cHV0KS50b1N0cmluZygpKSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEZpbGUgYXQgJHtibGVha1Jlc3VsdHNPdXRwdXR9IGV4aXN0cywgYnV0IGlzIG5vdCBhIHZhbGlkIEJMZWFrIHJlc3VsdHMgZmlsZTogJHtlfWApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB3cml0ZUZpbGVTeW5jKGpvaW4oYXJncy5vdXQsICdjb25maWcuanMnKSwgY29uZmlnRmlsZVNvdXJjZSk7XG4gICAgICBsZXQgY2hyb21lRHJpdmVyID0gYXdhaXQgQ2hyb21lRHJpdmVyLkxhdW5jaChwcm9ncmVzc0JhciwgYXJncy5oZWFkbGVzcywgd2lkdGgsIGhlaWdodCwgWycvZXZhbCcsIERFRkFVTFRfQUdFTlRfVVJMLCBERUZBVUxUX0JBQkVMX1BPTFlGSUxMX1VSTCwgREVGQVVMVF9BR0VOVF9UUkFOU0ZPUk1fVVJMXSwgIWFyZ3MuZGVidWcpO1xuXG4gICAgICBsZXQgc2NyZWVuc2hvdFRpbWVyOiBOb2RlSlMuVGltZXIgfCBudWxsID0gbnVsbDtcbiAgICAgIGlmIChhcmdzWyd0YWtlLXNjcmVlbnNob3RzJ10gPiAtMSkge1xuICAgICAgICBzY3JlZW5zaG90VGltZXIgPSBzZXRJbnRlcnZhbChhc3luYyBmdW5jdGlvbigpIHtcbiAgICAgICAgICBjb25zdCB0aW1lID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICBwcm9ncmVzc0Jhci5kZWJ1ZyhgVGFraW5nIHNjcmVlbnNob3QuLi5gKTtcbiAgICAgICAgICBjb25zdCBzcyA9IGF3YWl0IGNocm9tZURyaXZlci50YWtlU2NyZWVuc2hvdCgpO1xuICAgICAgICAgIGNvbnN0IHNzRmlsZW5hbWUgPSBqb2luKFNDUkVFTlNIT1RTX0RJUiwgYHNjcmVlbnNob3RfJHt0aW1lfS5wbmdgKTtcbiAgICAgICAgICBwcm9ncmVzc0Jhci5kZWJ1ZyhgV3JpdGluZyAke3NzRmlsZW5hbWV9Li4uYCk7XG4gICAgICAgICAgd3JpdGVGaWxlU3luYyhzc0ZpbGVuYW1lLCBzcyk7XG4gICAgICAgIH0sIGFyZ3NbJ3Rha2Utc2NyZWVuc2hvdHMnXSAqIDEwMDApO1xuICAgICAgfVxuXG4gICAgICBsZXQgc2h1dHRpbmdEb3duID0gZmFsc2U7XG4gICAgICBhc3luYyBmdW5jdGlvbiBzaHV0RG93bigpIHtcbiAgICAgICAgaWYgKHNodXR0aW5nRG93bikge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBzaHV0dGluZ0Rvd24gPSB0cnVlO1xuICAgICAgICBpZiAoc2NyZWVuc2hvdFRpbWVyKSB7XG4gICAgICAgICAgY2xlYXJJbnRlcnZhbChzY3JlZW5zaG90VGltZXIpO1xuICAgICAgICB9XG4gICAgICAgIGF3YWl0IGNocm9tZURyaXZlci5zaHV0ZG93bigpO1xuICAgICAgICAvLyBBbGwgc29ja2V0cy9zdWJwcm9jZXNzZXMvcmVzb3VyY2VzICpzaG91bGQqIGJlIGNsb3NlZCwgc28gd2UgY2FuIGp1c3QgZXhpdC5cbiAgICAgICAgcHJvY2Vzcy5leGl0KDApO1xuICAgICAgfVxuICAgICAgLy8gU2h1dCBkb3duIGdyYWNlZnVsbHkgb24gQ1RSTCtDLlxuICAgICAgcHJvY2Vzcy5vbignU0lHSU5UJywgYXN5bmMgZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBDVFJMK0MgcmVjZWl2ZWQuYCk7XG4gICAgICAgIHNodXREb3duKCk7XG4gICAgICB9KTtcbiAgICAgIGxldCBpID0gMDtcbiAgICAgIEJMZWFrLkZpbmRMZWFrcyhjb25maWdGaWxlU291cmNlLCBwcm9ncmVzc0JhciwgY2hyb21lRHJpdmVyLCAoc24pID0+IHtcbiAgICAgICAgaWYgKGFyZ3Muc25hcHNob3QpIHtcbiAgICAgICAgICBjb25zdCBzdHIgPSBjcmVhdGVXcml0ZVN0cmVhbShqb2luKGFyZ3Mub3V0LCAnc25hcHNob3RzJywgJ2xlYWtfZGV0ZWN0aW9uJywgYHNuYXBzaG90XyR7aX0uaGVhcHNuYXBzaG90Lmd6YCkpO1xuICAgICAgICAgIGkrKztcbiAgICAgICAgICBjb25zdCBneiA9IGNyZWF0ZUd6aXAoKTtcbiAgICAgICAgICBnei5waXBlKHN0cik7XG4gICAgICAgICAgc24ub25TbmFwc2hvdENodW5rID0gZnVuY3Rpb24oY2h1bmssIGVuZCkge1xuICAgICAgICAgICAgZ3oud3JpdGUoY2h1bmspO1xuICAgICAgICAgICAgaWYgKGVuZCkge1xuICAgICAgICAgICAgICBnei5lbmQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgIH0sIGJsZWFrUmVzdWx0cykudGhlbigocmVzdWx0cykgPT4ge1xuICAgICAgICB3cml0ZUZpbGVTeW5jKGJsZWFrUmVzdWx0c091dHB1dCwgSlNPTi5zdHJpbmdpZnkocmVzdWx0cykpO1xuICAgICAgICBjb25zdCByZXN1bHRzTG9nID0gVGV4dFJlcG9ydGVyKHJlc3VsdHMpO1xuICAgICAgICB3cml0ZUZpbGVTeW5jKGpvaW4oYXJncy5vdXQsICdibGVha19yZXBvcnQubG9nJyksIHJlc3VsdHNMb2cpO1xuICAgICAgICBjb25zb2xlLmxvZyhgUmVzdWx0cyBjYW4gYmUgZm91bmQgaW4gJHthcmdzLm91dH1gKTtcbiAgICAgICAgcmV0dXJuIHNodXREb3duKCk7XG4gICAgICB9KS5jYXRjaCgoZSkgPT4ge1xuICAgICAgICBwcm9ncmVzc0Jhci5lcnJvcihgJHtlfWApO1xuICAgICAgICByZXR1cm4gc2h1dERvd24oKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIG1haW4oKTtcbiAgfSxcbiAgYnVpbGRlcjoge1xuICAgIG91dDoge1xuICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICBkZW1hbmQ6IHRydWUsXG4gICAgICBkZXNjcmliZTogJ0RpcmVjdG9yeSB0byBvdXRwdXQgbGVha3MgYW5kIHNvdXJjZSBjb2RlIHRvJ1xuICAgIH0sXG4gICAgY29uZmlnOiB7XG4gICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgIGRlbWFuZDogdHJ1ZSxcbiAgICAgIGRlc2NyaWJlOiAnQ29uZmlndXJhdGlvbiBmaWxlIHRvIHVzZSB3aXRoIEJMZWFrJ1xuICAgIH0sXG4gICAgc25hcHNob3Q6IHtcbiAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgIGRlZmF1bHQ6IGZhbHNlLFxuICAgICAgZGVzY3JpYmU6ICdTYXZlIGhlYXAgc25hcHNob3RzIGludG8gb3V0cHV0IGZvbGRlcidcbiAgICB9LFxuICAgIGhlYWRsZXNzOiB7XG4gICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICAgIGRlc2NyaWJlOiBgUnVuIENocm9tZSBpbiBoZWFkbGVzcyBtb2RlIChubyBHVUkpIChjdXJyZW50bHkgYnVnZ3kgZHVlIHRvIENocm9tZSBidWdzKWBcbiAgICB9LFxuICAgIGRlYnVnOiB7XG4gICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICAgIGRlc2NyaWJlOiAnUHJpbnQgZGVidWcgaW5mb3JtYXRpb24gdG8gY29uc29sZSBkdXJpbmcgcnVuJ1xuICAgIH0sXG4gICAgJ3Rha2Utc2NyZWVuc2hvdHMnOiB7XG4gICAgICB0eXBlOiAnbnVtYmVyJyxcbiAgICAgIGRlZmF1bHQ6IC0xLFxuICAgICAgZGVzY3JpYmU6ICdUYWtlIHBlcmlvZGljIHNjcmVlbnNob3RzIGV2ZXJ5IG4gc2Vjb25kcy4gVXNlZnVsIGZvciBkZWJ1Z2dpbmcgaHVuZyBoZWFkbGVzcyBydW5zLiAtMSBkaXNhYmxlcy4nXG4gICAgfSxcbiAgICBjaHJvbWVTaXplOiB7XG4gICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgIGRlZmF1bHQ6ICcxOTIweDEwODAnLFxuICAgICAgZGVzY3JpYmU6ICdTcGVjaWZpZXMgdGhlIHNpemUgb2YgdGhlIENocm9tZSBicm93c2VyIHdpbmRvdydcbiAgICB9XG4gIH1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IFJ1bjtcbiJdfQ==