"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bleak_1 = require("../../lib/bleak");
const chrome_driver_1 = require("../../lib/chrome_driver");
const progress_progress_bar_1 = require("../../lib/progress_progress_bar");
const fs_1 = require("fs");
const bleak_results_1 = require("../../lib/bleak_results");
const mitmproxy_interceptor_1 = require("../../lib/mitmproxy_interceptor");
const EvaluateMetrics = {
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
    handler: async function handler(args) {
        let width, height;
        {
            const chromeSize = /^([0-9]+)x([0-9]+)$/.exec(args.chromeSize);
            if (!chromeSize) {
                throw new Error(`Invalid chromeSize: ${args.chromeSize}`);
            }
            width = parseInt(chromeSize[1], 10);
            height = parseInt(chromeSize[2], 10);
        }
        const progressBar = new progress_progress_bar_1.default(args.debug);
        const chromeDriver = await chrome_driver_1.default.Launch(progressBar, args.headless, width, height, [mitmproxy_interceptor_1.DEFAULT_AGENT_URL, mitmproxy_interceptor_1.DEFAULT_BABEL_POLYFILL_URL, mitmproxy_interceptor_1.DEFAULT_AGENT_TRANSFORM_URL], !args.debug);
        const configFileSource = fs_1.readFileSync(args.config).toString();
        const results = bleak_results_1.default.FromJSON(JSON.parse(fs_1.readFileSync(args.results, 'utf8')));
        let shuttingDown = false;
        async function shutDown() {
            if (shuttingDown) {
                return;
            }
            shuttingDown = true;
            await chromeDriver.shutdown();
            // All sockets/subprocesses/resources *should* be closed, so we can just exit.
            process.exit(0);
        }
        // Shut down gracefully on CTRL+C.
        process.on('SIGINT', async function sigintHandler() {
            progressBar.log(`CTRL+C received.`);
            // Fix memory leak when resume-after-failure is active.
            process.removeListener('SIGINT', sigintHandler);
            shutDown();
        });
        bleak_1.default.EvaluateRankingMetrics(configFileSource, progressBar, chromeDriver, results, (results) => {
            fs_1.writeFileSync(args.results, Buffer.from(JSON.stringify(results), 'utf8'));
        }).then(shutDown).catch((e) => {
            progressBar.error(`${e}`);
            if (args['resume-after-failure']) {
                progressBar.log(`Resuming...`);
                shuttingDown = true;
                chromeDriver.shutdown().then(() => {
                    handler(args);
                }).catch(() => {
                    handler(args);
                });
            }
            else {
                progressBar.error(`${e}`);
                shutDown();
            }
        });
    }
};
exports.default = EvaluateMetrics;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZhbHVhdGUtbWV0cmljcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9jbGkvY29tbWFuZHMvZXZhbHVhdGUtbWV0cmljcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUNBLDJDQUFvQztBQUNwQywyREFBbUQ7QUFDbkQsMkVBQWtFO0FBQ2xFLDJCQUErQztBQUMvQywyREFBbUQ7QUFDbkQsMkVBQTJIO0FBVzNILE1BQU0sZUFBZSxHQUFrQjtJQUNyQyxPQUFPLEVBQUUsa0JBQWtCO0lBQzNCLFFBQVEsRUFBRSw4REFBOEQ7SUFDeEUsT0FBTyxFQUFFO1FBQ1AsTUFBTSxFQUFFO1lBQ04sSUFBSSxFQUFFLFFBQVE7WUFDZCxNQUFNLEVBQUUsSUFBSTtZQUNaLFFBQVEsRUFBRSxxRUFBcUU7U0FDaEY7UUFDRCxPQUFPLEVBQUU7WUFDUCxJQUFJLEVBQUUsUUFBUTtZQUNkLE1BQU0sRUFBRSxJQUFJO1lBQ1osUUFBUSxFQUFFLG9EQUFvRDtTQUMvRDtRQUNELEtBQUssRUFBRTtZQUNMLElBQUksRUFBRSxTQUFTO1lBQ2YsT0FBTyxFQUFFLEtBQUs7WUFDZCxRQUFRLEVBQUUsNkNBQTZDO1NBQ3hEO1FBQ0QsUUFBUSxFQUFFO1lBQ1IsSUFBSSxFQUFFLFNBQVM7WUFDZixPQUFPLEVBQUUsS0FBSztZQUNkLFFBQVEsRUFBRSwwQ0FBMEM7U0FDckQ7UUFDRCxVQUFVLEVBQUU7WUFDVixJQUFJLEVBQUUsUUFBUTtZQUNkLE9BQU8sRUFBRSxXQUFXO1lBQ3BCLFFBQVEsRUFBRSxpREFBaUQ7U0FDNUQ7UUFDRCxzQkFBc0IsRUFBRTtZQUN0QixJQUFJLEVBQUUsU0FBUztZQUNmLE9BQU8sRUFBRSxLQUFLO1lBQ2QsUUFBUSxFQUFFLDBFQUEwRTtTQUNyRjtLQUNGO0lBQ0QsT0FBTyxFQUFFLEtBQUssa0JBQWtCLElBQXFCO1FBQ25ELElBQUksS0FBYSxFQUFFLE1BQWMsQ0FBQztRQUNsQyxDQUFDO1lBQ0MsTUFB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Q2hCLENBQUMsQ0FBQyxDQUFDO1lBQ0wsQ0FBQztZQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNOLFdBQVcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUMxQixRQUFRLEVBQUUsQ0FBQztZQUNiLENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRixDQUFDO0FBRUYsa0JBQWUsZUFBZSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtDb21tYW5kTW9kdWxlfSBmcm9tICd5YXJncyc7XG5pbXBvcnQgQkxlYWsgZnJvbSAnLi4vLi4vbGliL2JsZWFrJztcbmltcG9ydCBDaHJvbWVEcml2ZXIgZnJvbSAnLi4vLi4vbGliL2Nocm9tZV9kcml2ZXInO1xuaW1wb3J0IFByb2dyZXNzUHJvZ3Jlc3NCYXIgZnJvbSAnLi4vLi4vbGliL3Byb2dyZXNzX3Byb2dyZXNzX2Jhcic7XG5pbXBvcnQge3JlYWRGaWxlU3luYywgd3JpdGVGaWxlU3luY30gZnJvbSAnZnMnO1xuaW1wb3J0IEJMZWFrUmVzdWx0cyBmcm9tICcuLi8uLi9saWIvYmxlYWtfcmVzdWx0cyc7XG5pbXBvcnQge0RFRkFVTFRfQUdFTlRfVVJMLCBERUZBVUxUX0JBQkVMX1BPTFlGSUxMX1VSTCwgREVGQVVMVF9BR0VOVF9UUkFOU0ZPUk1fVVJMfSBmcm9tICcuLi8uLi9saWIvbWl0bXByb3h5X2ludGVyY2VwdG9yJztcblxuaW50ZXJmYWNlIENvbW1hbmRMaW5lQXJncyB7XG4gIGNvbmZpZzogc3RyaW5nO1xuICByZXN1bHRzOiBzdHJpbmc7XG4gIGRlYnVnOiBib29sZWFuO1xuICBoZWFkbGVzczogYm9vbGVhbjtcbiAgY2hyb21lU2l6ZTogc3RyaW5nO1xuICAncmVzdW1lLWFmdGVyLWZhaWx1cmUnOiBib29sZWFuO1xufVxuXG5jb25zdCBFdmFsdWF0ZU1ldHJpY3M6IENvbW1hbmRNb2R1bGUgPSB7XG4gIGNvbW1hbmQ6ICdldmFsdWF0ZS1tZXRyaWNzJyxcbiAgZGVzY3JpYmU6ICdFdmFsdWF0ZXMgdGhlIHBlcmZvcm1hbmNlIG9mIGRpZmZlcmVudCBsZWFrIHJhbmtpbmcgbWV0cmljcy4nLFxuICBidWlsZGVyOiB7XG4gICAgY29uZmlnOiB7XG4gICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgIGRlbWFuZDogdHJ1ZSxcbiAgICAgIGRlc2NyaWJlOiAnUGF0aCB0byBhIEJMZWFrIGNvbmZpZ3VyYXRpb24gZmlsZS4gTXVzdCBjb250YWluIGEgZml4TWFwIHByb3BlcnR5LidcbiAgICB9LFxuICAgIHJlc3VsdHM6IHtcbiAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgZGVtYW5kOiB0cnVlLFxuICAgICAgZGVzY3JpYmU6ICdQYXRoIHRvIGEgYmxlYWtfcmVzdWx0cy5qc29uIGZyb20gYSBjb21wbGV0ZWQgcnVuLidcbiAgICB9LFxuICAgIGRlYnVnOiB7XG4gICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICAgIGRlc2NyaWJlOiAnSWYgc2V0LCBwcmludCBkZWJ1ZyBpbmZvcm1hdGlvbiB0byBjb25zb2xlLidcbiAgICB9LFxuICAgIGhlYWRsZXNzOiB7XG4gICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICAgIGRlc2NyaWJlOiAnUnVuIGluIENocm9tZSBIZWFkbGVzcyAoY3VycmVudGx5IGJ1Z2d5KSdcbiAgICB9LFxuICAgIGNocm9tZVNpemU6IHtcbiAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgZGVmYXVsdDogJzE5MjB4MTA4MCcsXG4gICAgICBkZXNjcmliZTogJ1NwZWNpZmllcyB0aGUgc2l6ZSBvZiB0aGUgQ2hyb21lIGJyb3dzZXIgd2luZG93J1xuICAgIH0sXG4gICAgJ3Jlc3VtZS1hZnRlci1mYWlsdXJlJzoge1xuICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgZGVmYXVsdDogZmFsc2UsXG4gICAgICBkZXNjcmliZTogJ0lmIGEgZmFpbHVyZSBvY2N1cnMsIGF1dG9tYXRpY2FsbHkgcmVzdW1lIHRoZSBwcm9jZXNzIHVudGlsIGl0IGNvbXBsZXRlcydcbiAgICB9XG4gIH0sXG4gIGhhbmRsZXI6IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZXIoYXJnczogQ29tbWFuZExpbmVBcmdzKSB7XG4gICAgbGV0IHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyO1xuICAgIHtcbiAgICAgIGNvbnN0IGNocm9tZVNpemUgPSAvXihbMC05XSspeChbMC05XSspJC8uZXhlYyhhcmdzLmNocm9tZVNpemUpO1xuICAgICAgaWYgKCFjaHJvbWVTaXplKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBjaHJvbWVTaXplOiAke2FyZ3MuY2hyb21lU2l6ZX1gKTtcbiAgICAgIH1cbiAgICAgIHdpZHRoID0gcGFyc2VJbnQoY2hyb21lU2l6ZVsxXSwgMTApO1xuICAgICAgaGVpZ2h0ID0gcGFyc2VJbnQoY2hyb21lU2l6ZVsyXSwgMTApO1xuICAgIH1cbiAgICBjb25zdCBwcm9ncmVzc0JhciA9IG5ldyBQcm9ncmVzc1Byb2dyZXNzQmFyKGFyZ3MuZGVidWcpO1xuICAgIGNvbnN0IGNocm9tZURyaXZlciA9IGF3YWl0IENocm9tZURyaXZlci5MYXVuY2gocHJvZ3Jlc3NCYXIsIGFyZ3MuaGVhZGxlc3MsIHdpZHRoLCBoZWlnaHQsIFtERUZBVUxUX0FHRU5UX1VSTCwgREVGQVVMVF9CQUJFTF9QT0xZRklMTF9VUkwsIERFRkFVTFRfQUdFTlRfVFJBTlNGT1JNX1VSTF0sICFhcmdzLmRlYnVnKTtcbiAgICBjb25zdCBjb25maWdGaWxlU291cmNlID0gcmVhZEZpbGVTeW5jKGFyZ3MuY29uZmlnKS50b1N0cmluZygpO1xuICAgIGNvbnN0IHJlc3VsdHMgPSBCTGVha1Jlc3VsdHMuRnJvbUpTT04oSlNPTi5wYXJzZShyZWFkRmlsZVN5bmMoYXJncy5yZXN1bHRzLCAndXRmOCcpKSk7XG5cbiAgICBsZXQgc2h1dHRpbmdEb3duID0gZmFsc2U7XG4gICAgYXN5bmMgZnVuY3Rpb24gc2h1dERvd24oKSB7XG4gICAgICBpZiAoc2h1dHRpbmdEb3duKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHNodXR0aW5nRG93biA9IHRydWU7XG4gICAgICBhd2FpdCBjaHJvbWVEcml2ZXIuc2h1dGRvd24oKTtcbiAgICAgIC8vIEFsbCBzb2NrZXRzL3N1YnByb2Nlc3Nlcy9yZXNvdXJjZXMgKnNob3VsZCogYmUgY2xvc2VkLCBzbyB3ZSBjYW4ganVzdCBleGl0LlxuICAgICAgcHJvY2Vzcy5leGl0KDApO1xuICAgIH1cbiAgICAvLyBTaHV0IGRvd24gZ3JhY2VmdWxseSBvbiBDVFJMK0MuXG4gICAgcHJvY2Vzcy5vbignU0lHSU5UJywgYXN5bmMgZnVuY3Rpb24gc2lnaW50SGFuZGxlcigpIHtcbiAgICAgIHByb2dyZXNzQmFyLmxvZyhgQ1RSTCtDIHJlY2VpdmVkLmApO1xuICAgICAgLy8gRml4IG1lbW9yeSBsZWFrIHdoZW4gcmVzdW1lLWFmdGVyLWZhaWx1cmUgaXMgYWN0aXZlLlxuICAgICAgcHJvY2Vzcy5yZW1vdmVMaXN0ZW5lcignU0lHSU5UJywgc2lnaW50SGFuZGxlcik7XG4gICAgICBzaHV0RG93bigpO1xuICAgIH0pO1xuXG4gICAgQkxlYWsuRXZhbHVhdGVSYW5raW5nTWV0cmljcyhjb25maWdGaWxlU291cmNlLCBwcm9ncmVzc0JhciwgY2hyb21lRHJpdmVyLCByZXN1bHRzLCAocmVzdWx0cykgPT4ge1xuICAgICAgd3JpdGVGaWxlU3luYyhhcmdzLnJlc3VsdHMsIEJ1ZmZlci5mcm9tKEpTT04uc3RyaW5naWZ5KHJlc3VsdHMpLCAndXRmOCcpKTtcbiAgICB9KS50aGVuKHNodXREb3duKS5jYXRjaCgoZSkgPT4ge1xuICAgICAgcHJvZ3Jlc3NCYXIuZXJyb3IoYCR7ZX1gKTtcbiAgICAgIGlmIChhcmdzWydyZXN1bWUtYWZ0ZXItZmFpbHVyZSddKSB7XG4gICAgICAgIHByb2dyZXNzQmFyLmxvZyhgUmVzdW1pbmcuLi5gKTtcbiAgICAgICAgc2h1dHRpbmdEb3duID0gdHJ1ZTtcbiAgICAgICAgY2hyb21lRHJpdmVyLnNodXRkb3duKCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgaGFuZGxlcihhcmdzKTtcbiAgICAgICAgfSkuY2F0Y2goKCkgPT4ge1xuICAgICAgICAgIGhhbmRsZXIoYXJncyk7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcHJvZ3Jlc3NCYXIuZXJyb3IoYCR7ZX1gKTtcbiAgICAgICAgc2h1dERvd24oKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufTtcblxuZXhwb3J0IGRlZmF1bHQgRXZhbHVhdGVNZXRyaWNzO1xuIl19