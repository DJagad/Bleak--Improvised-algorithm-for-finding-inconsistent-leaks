"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const bleak_1 = require("../../lib/bleak");
const chrome_driver_1 = require("../../lib/chrome_driver");
const text_reporter_1 = require("../../lib/text_reporter");
const zlib_1 = require("zlib");
const progress_progress_bar_1 = require("../../lib/progress_progress_bar");
const mitmproxy_interceptor_1 = require("../../lib/mitmproxy_interceptor");
const bleak_results_1 = require("../../lib/bleak_results");
const Run = {
    command: "run",
    describe: `Runs BLeak to locate, rank, and diagnose memory leaks in a web application.`,
    handler: (args) => {
        let width, height;
        {
            const chromeSize = /^([0-9]+)x([0-9]+)$/.exec(args.chromeSize);
            if (!chromeSize) {
                throw new Error(`Invalid chromeSize: ${args.chromeSize}`);
            }
            width = parseInt(chromeSize[1], 10);
            height = parseInt(chromeSize[2], 10);
        }
        if (!fs_1.existsSync(args.out)) {
            fs_1.mkdirSync(args.out);
        }
        if (args.snapshot) {
            if (!fs_1.existsSync(path_1.join(args.out, 'snapshots'))) {
                fs_1.mkdirSync(path_1.join(args.out, 'snapshots'));
            }
            fs_1.mkdirSync(path_1.join(args.out, 'snapshots', 'leak_detection'));
        }
        const SCREENSHOTS_DIR = path_1.join(args.out, 'screenshots');
        if (args['take-screenshots'] !== -1) {
            if (!fs_1.existsSync(SCREENSHOTS_DIR)) {
                fs_1.mkdirSync(SCREENSHOTS_DIR);
            }
        }
        const progressBar = new progress_progress_bar_1.default(args.debug);
        // Add stack traces to Node warnings.
        // https://stackoverflow.com/a/38482688
        process.on('warning', (e) => progressBar.error(e.stack));
        async function main() {
            const configFileSource = fs_1.readFileSync(args.config).toString();
            const bleakResultsOutput = path_1.join(args.out, 'bleak_results.json');
            let bleakResults;
            if (fs_1.existsSync(bleakResultsOutput)) {
                console.log(`Resuming using data from ${bleakResultsOutput}`);
                try {
                    bleakResults = bleak_results_1.default.FromJSON(JSON.parse(fs_1.readFileSync(bleakResultsOutput).toString()));
                }
                catch (e) {
                    throw new Error(`File at ${bleakResultsOutput} exists, but is not a valid BLeak results file: ${e}`);
                }
            }
            fs_1.writeFileSync(path_1.join(args.out, 'config.js'), configFileSource);
            let chromeDriver = await chrome_driver_1.default.Launch(progressBar, args.headless, width, height, ['/eval', mitmproxy_interceptor_1.DEFAULT_AGENT_URL, mitmproxy_interceptor_1.DEFAULT_BABEL_POLYFILL_URL, mitmproxy_interceptor_1.DEFAULT_AGENT_TRANSFORM_URL], !args.debug);
            let screenshotTimer = null;
            if (args['take-screenshots'] > -1) {
                screenshotTimer = setInterval(async function () {
                    const time = Date.now();
                    progressBar.debug(`Taking screenshot...`);
                    const ss = await chromeDriver.takeScreenshot();
                    const ssFilename = path_1.join(SCREENSHOTS_DIR, `screenshot_${time}.png`);
                    progressBar.debug(`Writing ${ssFilename}...`);
                    fs_1.writeFileSync(ssFilename, ss);
                }, args['take-screenshots'] * 1000);
            }
            let shuttingDown = false;
            async function shutDown() {
                if (shuttingDown) {
                    return;
                }
                shuttingDown = true;
                if (screenshotTimer) {
                    clearInterval(screenshotTimer);
                }
                await chromeDriver.shutdown();
                // All sockets/subprocesses/resources *should* be closed, so we can just exit.
                process.exit(0);
            }
            // Shut down gracefully on CTRL+C.
            process.on('SIGINT', async function () {
                console.log(`CTRL+C received.`);
                shutDown();
            });
            let i = 0;
            bleak_1.default.FindLeaks(configFileSource, progressBar, chromeDriver, (sn) => {
                if (args.snapshot) {
                    const str = fs_1.createWriteStream(path_1.join(args.out, 'snapshots', 'leak_detection', `snapshot_${i}.heapsnapshot.gz`));
                    i++;
                    const gz = zlib_1.createGzip();
                    gz.pipe(str);
                    sn.onSnapshotChunk = function (chunk, end) {
                        gz.write(chunk);
                        if (end) {
                            gz.end();
                        }
                    };
                }
                return Promise.resolve();
            }, bleakResults).then((results) => {
                fs_1.writeFileSync(bleakResultsOutput, JSON.stringify(results));
                const resultsLog = text_reporter_1.default(results);
                fs_1.writeFileSync(path_1.join(args.out, 'bleak_report.log'), resultsLog);
                console.log(`Results can be found in ${args.out}`);
                return shutDown();
            }).catch((e) => {
                progressBar.error(`${e}`);
                return shutDown();
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
            describe: `Run Chrome in headless mode (no GUI) (currently buggy due to Chrome bugs)`
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
exports.default = Run;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVuLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL2NsaS9jb21tYW5kcy9ydW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSwyQkFBeUY7QUFDekYsK0JBQTBCO0FBQzFCLDJDQUFvQztBQUNwQywyREFBbUQ7QUFDbkQsMkRBQW1EO0FBQ25ELCtCQUFnQztBQUNoQywyRUFBa0U7QUFFbEUsMkVBQTJIO0FBQzNILDJEQUFtRDtBQVluRCxNQUFNLEdBQUcsR0FBa0I7SUFDekIsT0FBTyxFQUFFLEtBQUs7SUFDZCxRQUFRLEVBQUUsNkVBQTZFO0lBQ3ZGLE9BQU8sRUFBRSxDQUFDLElBQXFCLEVBQUUsRUFBRTtRQUNqQyxJQUFJLEtBQWEsRUFBRSxNQUFjLENBQUM7UUFDbEMsQ0FBQztZQUNDLE1BQU0sVUFBVSxHQUFHLHFCQUFxQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDL0QsRUFBRSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO2dCQUNoQixNQUFNLElBQUksS0FBSyxDQUFDLHVCQUF1QixJQUFJLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQztZQUM1RCxDQUFDO1lBQ0QsS0FBSyxHQUFHLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDcEMsTUFBTSxHQUFHLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDdkMsQ0FBQztRQUNELEVBQUUsQ0FBQyxDQUFDLENBQUMsZUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDMUIsY0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN0QixDQUFDO1FBQ0QsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDbEIsRUFBRSxDQUFD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QUNwQixDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFRCxJQUFJLEVBQUUsQ0FBQztJQUNULENBQUM7SUFDRCxPQUFPLEVBQUU7UUFDUCxHQUFHLEVBQUU7WUFDSCxJQUFJLEVBQUUsUUFBUTtZQUNkLE1BQU0sRUFBRSxJQUFJO1lBQ1osUUFBUSxFQUFFLDhDQUE4QztTQUN6RDtRQUNELE1BQU0sRUFBRTtZQUNOLElBQUksRUFBRSxRQUFRO1lBQ2QsTUFBTSxFQUFFLElBQUk7WUFDWixRQUFRLEVBQUUsc0NBQXNDO1NBQ2pEO1FBQ0QsUUFBUSxFQUFFO1lBQ1IsSUFBSSxFQUFFLFNBQVM7WUFDZixPQUFPLEVBQUUsS0FBSztZQUNkLFFBQVEsRUFBRSx3Q0FBd0M7U0FDbkQ7UUFDRCxRQUFRLEVBQUU7WUFDUixJQUFJLEVBQUUsU0FBUztZQUNmLE9BQU8sRUFBRSxLQUFLO1lBQ2QsUUFBUSxFQUFFLDJFQUEyRTtTQUN0RjtRQUNELEtBQUssRUFBRTtZQUNMLElBQUksRUFBRSxTQUFTO1lBQ2YsT0FBTyxFQUFFLEtBQUs7WUFDZCxRQUFRLEVBQUUsK0NBQStDO1NBQzFEO1FBQ0Qsa0JBQWtCLEVBQUU7WUFDbEIsSUFBSSxFQUFFLFFBQVE7WUFDZCxPQUFPLEVBQUUsQ0FBQyxDQUFDO1lBQ1gsUUFBUSxFQUFFLGtHQUFrRztTQUM3RztRQUNELFVBQVUsRUFBRTtZQUNWLElBQUksRUFBRSxRQUFRO1lBQ2QsT0FBTyxFQUFFLFdBQVc7WUFDcEIsUUFBUSxFQUFFLGlEQUFpRDtTQUM1RDtLQUNGO0NBQ0YsQ0FBQztBQUVGLGtCQUFlLEdBQUcsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7cmVhZEZpbGVTeW5jLCBta2RpclN5bmMsIGV4aXN0c1N5bmMsIGNyZWF0ZVdyaXRlU3RyZWFtLCB3cml0ZUZpbGVTeW5jfSBmcm9tICdmcyc7XG5pbXBvcnQge2pvaW59IGZyb20gJ3BhdGgnO1xuaW1wb3J0IEJMZWFrIGZyb20gJy4uLy4uL2xpYi9ibGVhayc7XG5pbXBvcnQgQ2hyb21lRHJpdmVyIGZyb20gJy4uLy4uL2xpYi9jaHJvbWVfZHJpdmVyJztcbmltcG9ydCBUZXh0UmVwb3J0ZXIgZnJvbSAnLi4vLi4vbGliL3RleHRfcmVwb3J0ZXInO1xuaW1wb3J0IHtjcmVhdGVHemlwfSBmcm9tICd6bGliJztcbmltcG9ydCBQcm9ncmVzc1Byb2dyZXNzQmFyIGZyb20gJy4uLy4uL2xpYi9wcm9ncmVzc19wcm9ncmVzc19iYXInO1xuaW1wb3J0IHtDb21tYW5kTW9kdWxlfSBmcm9tICd5YXJncyc7XG5pbXBvcnQge0RFRkFVTFRfQUdFTlRfVVJMLCBERUZBVUxUX0JBQkVMX1BPTFlGSUxMX1VSTCwgREVGQVVMVF9BR0VOVF9UUkFOU0ZPUk1fVVJMfSBmcm9tICcuLi8uLi9saWIvbWl0bXByb3h5X2ludGVyY2VwdG9yJztcbmltcG9ydCBCTGVha1Jlc3VsdHMgZnJvbSAnLi4vLi4vbGliL2JsZWFrX3Jlc3VsdHMnO1xuXG5pbnRlcmZhY2UgQ29tbWFuZExpbmVBcmdzIHtcbiAgb3V0OiBzdHJpbmc7XG4gIGNvbmZpZzogc3RyaW5nO1xuICBzbmFwc2hvdDogYm9vbGVhbjtcbiAgaGVhZGxlc3M6IGJvb2xlYW47XG4gIGRlYnVnOiBib29sZWFuO1xuICAndGFrZS1zY3JlZW5zaG90cyc6IG51bWJlcjtcbiAgY2hyb21lU2l6ZTogc3RyaW5nO1xufVxuXG5jb25zdCBSdW46IENvbW1hbmRNb2R1bGUgPSB7XG4gIGNvbW1hbmQ6IFwicnVuXCIsXG4gIGRlc2NyaWJlOiBgUnVucyBCTGVhayB0byBsb2NhdGUsIHJhbmssIGFuZCBkaWFnbm9zZSBtZW1vcnkgbGVha3MgaW4gYSB3ZWIgYXBwbGljYXRpb24uYCxcbiAgaGFuZGxlcjogKGFyZ3M6IENvbW1hbmRMaW5lQXJncykgPT4ge1xuICAgIGxldCB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlcjtcbiAgICB7XG4gICAgICBjb25zdCBjaHJvbWVTaXplID0gL14oWzAtOV0rKXgoWzAtOV0rKSQvLmV4ZWMoYXJncy5jaHJvbWVTaXplKTtcbiAgICAgIGlmICghY2hyb21lU2l6ZSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgY2hyb21lU2l6ZTogJHthcmdzLmNocm9tZVNpemV9YCk7XG4gICAgICB9XG4gICAgICB3aWR0aCA9IHBhcnNlSW50KGNocm9tZVNpemVbMV0sIDEwKTtcbiAgICAgIGhlaWdodCA9IHBhcnNlSW50KGNocm9tZVNpemVbMl0sIDEwKTtcbiAgICB9XG4gICAgaWYgKCFleGlzdHNTeW5jKGFyZ3Mub3V0KSkge1xuICAgICAgbWtkaXJTeW5jKGFyZ3Mub3V0KTtcbiAgICB9XG4gICAgaWYgKGFyZ3Muc25hcHNob3QpIHtcbiAgICAgIGlmICghZXhpc3RzU3luYyhqb2luKGFyZ3Mub3V0LCAnc25hcHNob3RzJykpKSB7XG4gICAgICAgIG1rZGlyU3luYyhqb2luKGFyZ3Mub3V0LCAnc25hcHNob3RzJykpO1xuICAgICAgfVxuICAgICAgbWtkaXJTeW5jKGpvaW4oYXJncy5vdXQsICdzbmFwc2hvdHMnLCAnbGVha19kZXRlY3Rpb24nKSk7XG4gICAgfVxuICAgIGNvbnN0IFNDUkVFTlNIT1RTX0RJUiA9IGpvaW4oYXJncy5vdXQsICdzY3JlZW5zaG90cycpO1xuICAgIGlmIChhcmdzWyd0YWtlLXNjcmVlbnNob3RzJ10gIT09IC0xKSB7XG4gICAgICBpZiAoIWV4aXN0c1N5bmMoU0NSRUVOU0hPVFNfRElSKSkge1xuICAgICAgICBta2RpclN5bmMoU0NSRUVOU0hPVFNfRElSKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBwcm9ncmVzc0JhciA9IG5ldyBQcm9ncmVzc1Byb2dyZXNzQmFyKGFyZ3MuZGVidWcpO1xuICAgIC8vIEFkZCBzdGFjayB0cmFjZXMgdG8gTm9kZSB3YXJuaW5ncy5cbiAgICAvLyBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMzg0ODI2ODhcbiAgICBwcm9jZXNzLm9uKCd3YXJuaW5nJywgKGU6IEVycm9yKSA9PiBwcm9ncmVzc0Jhci5lcnJvcihlLnN0YWNrKSk7XG5cbiAgICBhc3luYyBmdW5jdGlvbiBtYWluKCkge1xuICAgICAgY29uc3QgY29uZmlnRmlsZVNvdXJjZSA9IHJlYWRGaWxlU3luYyhhcmdzLmNvbmZpZykudG9TdHJpbmcoKTtcbiAgICAgIGNvbnN0IGJsZWFrUmVzdWx0c091dHB1dCA9IGpvaW4oYXJncy5vdXQsICdibGVha19yZXN1bHRzLmpzb24nKTtcbiAgICAgIGxldCBibGVha1Jlc3VsdHM6IEJMZWFrUmVzdWx0cyB8IG51bGw7XG4gICAgICBpZiAoZXhpc3RzU3luYyhibGVha1Jlc3VsdHNPdXRwdXQpKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBSZXN1bWluZyB1c2luZyBkYXRhIGZyb20gJHtibGVha1Jlc3VsdHNPdXRwdXR9YCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgYmxlYWtSZXN1bHRzID0gQkxlYWtSZXN1bHRzLkZyb21KU09OKEpTT04ucGFyc2UocmVhZEZpbGVTeW5jKGJsZWFrUmVzdWx0c091dHB1dCkudG9TdHJpbmcoKSkpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBGaWxlIGF0ICR7YmxlYWtSZXN1bHRzT3V0cHV0fSBleGlzdHMsIGJ1dCBpcyBub3QgYSB2YWxpZCBCTGVhayByZXN1bHRzIGZpbGU6ICR7ZX1gKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgd3JpdGVGaWxlU3luYyhqb2luKGFyZ3Mub3V0LCAnY29uZmlnLmpzJyksIGNvbmZpZ0ZpbGVTb3VyY2UpO1xuICAgICAgbGV0IGNocm9tZURyaXZlciA9IGF3YWl0IENocm9tZURyaXZlci5MYXVuY2gocHJvZ3Jlc3NCYXIsIGFyZ3MuaGVhZGxlc3MsIHdpZHRoLCBoZWlnaHQsIFsnL2V2YWwnLCBERUZBVUxUX0FHRU5UX1VSTCwgREVGQVVMVF9CQUJFTF9QT0xZRklMTF9VUkwsIERFRkFVTFRfQUdFTlRfVFJBTlNGT1JNX1VSTF0sICFhcmdzLmRlYnVnKTtcblxuICAgICAgbGV0IHNjcmVlbnNob3RUaW1lcjogTm9kZUpTLlRpbWVyIHwgbnVsbCA9IG51bGw7XG4gICAgICBpZiAoYXJnc1sndGFrZS1zY3JlZW5zaG90cyddID4gLTEpIHtcbiAgICAgICAgc2NyZWVuc2hvdFRpbWVyID0gc2V0SW50ZXJ2YWwoYXN5bmMgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgY29uc3QgdGltZSA9IERhdGUubm93KCk7XG4gICAgICAgICAgcHJvZ3Jlc3NCYXIuZGVidWcoYFRha2luZyBzY3JlZW5zaG90Li4uYCk7XG4gICAgICAgICAgY29uc3Qgc3MgPSBhd2FpdCBjaHJvbWVEcml2ZXIudGFrZVNjcmVlbnNob3QoKTtcbiAgICAgICAgICBjb25zdCBzc0ZpbGVuYW1lID0gam9pbihTQ1JFRU5TSE9UU19ESVIsIGBzY3JlZW5zaG90XyR7dGltZX0ucG5nYCk7XG4gICAgICAgICAgcHJvZ3Jlc3NCYXIuZGVidWcoYFdyaXRpbmcgJHtzc0ZpbGVuYW1lfS4uLmApO1xuICAgICAgICAgIHdyaXRlRmlsZVN5bmMoc3NGaWxlbmFtZSwgc3MpO1xuICAgICAgICB9LCBhcmdzWyd0YWtlLXNjcmVlbnNob3RzJ10gKiAxMDAwKTtcbiAgICAgIH1cblxuICAgICAgbGV0IHNodXR0aW5nRG93biA9IGZhbHNlO1xuICAgICAgYXN5bmMgZnVuY3Rpb24gc2h1dERvd24oKSB7XG4gICAgICAgIGlmIChzaHV0dGluZ0Rvd24pIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgc2h1dHRpbmdEb3duID0gdHJ1ZTtcbiAgICAgICAgaWYgKHNjcmVlbnNob3RUaW1lcikge1xuICAgICAgICAgIGNsZWFySW50ZXJ2YWwoc2NyZWVuc2hvdFRpbWVyKTtcbiAgICAgICAgfVxuICAgICAgICBhd2FpdCBjaHJvbWVEcml2ZXIuc2h1dGRvd24oKTtcbiAgICAgICAgLy8gQWxsIHNvY2tldHMvc3VicHJvY2Vzc2VzL3Jlc291cmNlcyAqc2hvdWxkKiBiZSBjbG9zZWQsIHNvIHdlIGNhbiBqdXN0IGV4aXQuXG4gICAgICAgIHByb2Nlc3MuZXhpdCgwKTtcbiAgICAgIH1cbiAgICAgIC8vIFNodXQgZG93biBncmFjZWZ1bGx5IG9uIENUUkwrQy5cbiAgICAgIHByb2Nlc3Mub24oJ1NJR0lOVCcsIGFzeW5jIGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zb2xlLmxvZyhgQ1RSTCtDIHJlY2VpdmVkLmApO1xuICAgICAgICBzaHV0RG93bigpO1xuICAgICAgfSk7XG4gICAgICBsZXQgaSA9IDA7XG4gICAgICBCTGVhay5GaW5kTGVha3MoY29uZmlnRmlsZVNvdXJjZSwgcHJvZ3Jlc3NCYXIsIGNocm9tZURyaXZlciwgKHNuKSA9PiB7XG4gICAgICAgIGlmIChhcmdzLnNuYXBzaG90KSB7XG4gICAgICAgICAgY29uc3Qgc3RyID0gY3JlYXRlV3JpdGVTdHJlYW0oam9pbihhcmdzLm91dCwgJ3NuYXBzaG90cycsICdsZWFrX2RldGVjdGlvbicsIGBzbmFwc2hvdF8ke2l9LmhlYXBzbmFwc2hvdC5nemApKTtcbiAgICAgICAgICBpKys7XG4gICAgICAgICAgY29uc3QgZ3ogPSBjcmVhdGVHemlwKCk7XG4gICAgICAgICAgZ3oucGlwZShzdHIpO1xuICAgICAgICAgIHNuLm9uU25hcHNob3RDaHVuayA9IGZ1bmN0aW9uKGNodW5rLCBlbmQpIHtcbiAgICAgICAgICAgIGd6LndyaXRlKGNodW5rKTtcbiAgICAgICAgICAgIGlmIChlbmQpIHtcbiAgICAgICAgICAgICAgZ3ouZW5kKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICB9LCBibGVha1Jlc3VsdHMpLnRoZW4oKHJlc3VsdHMpID0+IHtcbiAgICAgICAgd3JpdGVGaWxlU3luYyhibGVha1Jlc3VsdHNPdXRwdXQsIEpTT04uc3RyaW5naWZ5KHJlc3VsdHMpKTtcbiAgICAgICAgY29uc3QgcmVzdWx0c0xvZyA9IFRleHRSZXBvcnRlcihyZXN1bHRzKTtcbiAgICAgICAgd3JpdGVGaWxlU3luYyhqb2luKGFyZ3Mub3V0LCAnYmxlYWtfcmVwb3J0LmxvZycpLCByZXN1bHRzTG9nKTtcbiAgICAgICAgY29uc29sZS5sb2coYFJlc3VsdHMgY2FuIGJlIGZvdW5kIGluICR7YXJncy5vdXR9YCk7XG4gICAgICAgIHJldHVybiBzaHV0RG93bigpO1xuICAgICAgfSkuY2F0Y2goKGUpID0+IHtcbiAgICAgICAgcHJvZ3Jlc3NCYXIuZXJyb3IoYCR7ZX1gKTtcbiAgICAgICAgcmV0dXJuIHNodXREb3duKCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBtYWluKCk7XG4gIH0sXG4gIGJ1aWxkZXI6IHtcbiAgICBvdXQ6IHtcbiAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgZGVtYW5kOiB0cnVlLFxuICAgICAgZGVzY3JpYmU6ICdEaXJlY3RvcnkgdG8gb3V0cHV0IGxlYWtzIGFuZCBzb3VyY2UgY29kZSB0bydcbiAgICB9LFxuICAgIGNvbmZpZzoge1xuICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICBkZW1hbmQ6IHRydWUsXG4gICAgICBkZXNjcmliZTogJ0NvbmZpZ3VyYXRpb24gZmlsZSB0byB1c2Ugd2l0aCBCTGVhaydcbiAgICB9LFxuICAgIHNuYXBzaG90OiB7XG4gICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICAgIGRlc2NyaWJlOiAnU2F2ZSBoZWFwIHNuYXBzaG90cyBpbnRvIG91dHB1dCBmb2xkZXInXG4gICAgfSxcbiAgICBoZWFkbGVzczoge1xuICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgZGVmYXVsdDogZmFsc2UsXG4gICAgICBkZXNjcmliZTogYFJ1biBDaHJvbWUgaW4gaGVhZGxlc3MgbW9kZSAobm8gR1VJKSAoY3VycmVudGx5IGJ1Z2d5IGR1ZSB0byBDaHJvbWUgYnVncylgXG4gICAgfSxcbiAgICBkZWJ1Zzoge1xuICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgZGVmYXVsdDogZmFsc2UsXG4gICAgICBkZXNjcmliZTogJ1ByaW50IGRlYnVnIGluZm9ybWF0aW9uIHRvIGNvbnNvbGUgZHVyaW5nIHJ1bidcbiAgICB9LFxuICAgICd0YWtlLXNjcmVlbnNob3RzJzoge1xuICAgICAgdHlwZTogJ251bWJlcicsXG4gICAgICBkZWZhdWx0OiAtMSxcbiAgICAgIGRlc2NyaWJlOiAnVGFrZSBwZXJpb2RpYyBzY3JlZW5zaG90cyBldmVyeSBuIHNlY29uZHMuIFVzZWZ1bCBmb3IgZGVidWdnaW5nIGh1bmcgaGVhZGxlc3MgcnVucy4gLTEgZGlzYWJsZXMuJ1xuICAgIH0sXG4gICAgY2hyb21lU2l6ZToge1xuICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICBkZWZhdWx0OiAnMTkyMHgxMDgwJyxcbiAgICAgIGRlc2NyaWJlOiAnU3BlY2lmaWVzIHRoZSBzaXplIG9mIHRoZSBDaHJvbWUgYnJvd3NlciB3aW5kb3cnXG4gICAgfVxuICB9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBSdW47XG4iXX0=