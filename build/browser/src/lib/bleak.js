import * as tslib_1 from "tslib";
import BLeakConfig from './bleak_config';
import { FindAndDiagnoseLeaks, EvaluateRankingMetricsOperation, OperationState } from './bleak_operations';
function defaultSnapshotCb() {
    return Promise.resolve();
}
var BLeakDetector = /** @class */ (function () {
    function BLeakDetector(driver, progressBar, configSource, snapshotCb) {
        if (snapshotCb === void 0) { snapshotCb = defaultSnapshotCb; }
        this._driver = driver;
        this._progressBar = progressBar;
        this._config = BLeakConfig.FromSource(configSource);
        this._snapshotCb = snapshotCb;
    }
    /**
     * Find leaks in an application.
     * @param configSource The source code of the configuration file as a CommonJS module.
     * @param progressBar A progress bar, to which BLeak will print information about its progress.
     * @param driver The Chrome driver.
     */
    BLeakDetector.FindLeaks = function (configSource, progressBar, driver, snapshotCb, bleakResults) {
        if (snapshotCb === void 0) { snapshotCb = defaultSnapshotCb; }
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var detector;
            return tslib_1.__generator(this, function (_a) {
                detector = new BLeakDetector(driver, progressBar, configSource, snapshotCb);
                return [2 /*return*/, detector.findAndDiagnoseLeaks(bleakResults)];
            });
        });
    };
    /**
     * Evaluate the effectiveness of leak fixes applied in order using different metrics.
     * Runs the application without any of the fixes, and then with each fix in successive order using
     * different metrics. Mutates the BLeakResults object with the data, and calls a callback
     * periodically to flush it to disk. Intelligently resumes from a partially-completed
     * evaluation run.
     * @param configSource The source code of the configuration file as a CommonJS module.
     * @param progressBar A progress bar, to which BLeak will print information about its progress.
     * @param driver The browser driver.
     * @param results The results file from a BLeak run.
     * @param flushResults Called when the results file should be flushed to disk.
     * @param snapshotCb (Optional) Snapshot callback.
     */
    BLeakDetector.EvaluateRankingMetrics = function (configSource, progressBar, driver, results, flushResults, snapshotCb) {
        if (snapshotCb === void 0) { snapshotCb = defaultSnapshotCb; }
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var detector;
            return tslib_1.__generator(this, function (_a) {
                detector = new BLeakDetector(driver, progressBar, configSource);
                return [2 /*return*/, detector.evaluateRankingMetrics(results, flushResults, snapshotCb)];
            });
        });
    };
    /**
     * Locates memory leaks on the page and diagnoses them. This is the end-to-end
     * BLeak algorithm.
     */
    BLeakDetector.prototype.findAndDiagnoseLeaks = function (bleakResults) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var op, os;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        op = new FindAndDiagnoseLeaks(this._config, this._snapshotCb);
                        this._progressBar.setOperationCount(op.size());
                        os = new OperationState(this._driver, this._progressBar, this._config);
                        if (bleakResults) {
                            os.results = bleakResults;
                        }
                        return [4 /*yield*/, op.run(os)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, os.results];
                }
            });
        });
    };
    /**
     * Given a BLeak results file, collects the information needed to evaluate the effectiveness of various metrics.
     * @param results BLeak results file from a BLeak run.
     * @param flushResults Callback that flushes the results file to disk. Called periodically when new results are added.
     * @param snapshotCb Optional callback that is called whenever a heap snapshot is taken.
     */
    BLeakDetector.prototype.evaluateRankingMetrics = function (results, flushResults, snapshotCb) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var op, os;
            return tslib_1.__generator(this, function (_a) {
                op = new EvaluateRankingMetricsOperation(this._config, results, flushResults, snapshotCb);
                this._progressBar.setOperationCount(op.size());
                os = new OperationState(this._driver, this._progressBar, this._config);
                os.results = results;
                return [2 /*return*/, op.run(os)];
            });
        });
    };
    return BLeakDetector;
}());
export { BLeakDetector };
export default BLeakDetector;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmxlYWsuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvbGliL2JsZWFrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFJQSxPQUFPLFdBQVcsTUFBTSxnQkFBZ0IsQ0FBQztBQUN6QyxPQUFPLEVBQUMsb0JBQW9CLEVBQUUsK0JBQStCLEVBQUUsY0FBYyxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFFekc7SUFDRSxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQzNCLENBQUM7QUFFRDtJQWtDRSx1QkFBb0IsTUFBb0IsRUFBRSxXQUF5QixFQUFFLFlBQW9CLEVBQUUsVUFBeUU7UUFBekUsMkJBQUEsRUFBQSw4QkFBeUU7UUFDbEssSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7UUFDdEIsSUFBSSxDQUFDLFlBQVksR0FBRyxXQUFXLENBQUM7UUFDaEMsSUFBSSxDQUFDLE9BQU8sR0FBRyxXQUFXLENBQUMsVUFBVSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ3BELElBQUksQ0FBQyxXQUFXLEdBQUcsVUFBVSxDQUFDO0lBQ2hDLENBQUM7SUF0Q0Q7Ozs7O09BS0c7SUFDaUIsdUJBQVMsR0FBN0IsVUFBOEIsWUFBb0IsRUFBRSxXQUF5QixFQUFFLE1BQW9CLEVBQUUsVUFBeUUsRUFBRSxZQUEyQjtRQUF0RywyQkFBQSxFQUFBLDhCQUF5RTs7OztnQkFDdEssUUFBUSxHQUFHLElBQUksYUFBYSxDQUFDLE1BQU0sRUFBRSxXQUFXLEVBQUUsWUFBWSxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUNsRixzQkFBTyxRQUFRLENBQUMsb0JBQW9CLENBQUMsWUFBWSxDQUFDLEVBQUM7OztLQUNwRDtJQUVEOzs7Ozs7Ozs7Ozs7T0FZRztJQUNpQixvQ0FBc0IsR0FBMUMsVUFBMkMsWUFBb0IsRUFBRSxXQUF5QixFQUFFLE1BQW9CLEVBQUUsT0FBcUIsRUFBRSxZQUE2QyxFQUFFLFVBQWdJO1FBQWhJLDJCQUFBLEVBQUEsOEJBQWdJOzs7O2dCQUNoVCxRQUFRLEdBQUcsSUFBSSxhQUFhLENBQUMsTUFBTSxFQUFFLFdBQVcsRUFBRSxZQUFZLENBQUMsQ0FBQztnQkFDdEUsc0JBQU8sUUFBUSxDQUFDLHNCQUFzQixDQUFDLE9BQU8sRUFBRSxZQUFZLEVBQUUsVUFBVSxDQUFDLEVBQUM7OztLQUMzRTtJQWFEOzs7T0FHRztJQUNVLDRDQUFvQixHQUFqQyxVQUFrQyxZQUEyQjs7Ozs7O3dCQUNyRCxFQUFFLEdBQUcsSUFBSSxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQzt3QkFDcEUsSUFBSSxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQzt3QkFDekMsRUFBRSxHQUFHLElBQUksY0FBYyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7d0JBQzdFLEVBQUUsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7NEJBQ2pCLEVBQUUsQ0FBQyxPQUFPLEdBQUcsWUFBWSxDQUFDO3dCQUM1QixDQUFDO3dCQUNELHFCQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUE7O3dCQUFoQixTQUFnQixDQUFDO3dCQUNqQixzQkFBTyxFQUFFLENBQUMsT0FBTyxFQUFDOzs7O0tBQ25CO0lBRUQ7Ozs7O09BS0c7SUFDVSw4Q0FBc0IsR0FBbkMsVUFBb0MsT0FBcUIsRUFBRSxZQUE2QyxFQUFFLFVBQTRHOzs7O2dCQUM5TSxFQUFFLEdBQUcsSUFBSSwrQkFBK0IsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxZQUFZLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQ2hHLElBQUksQ0FBQyxZQUFZLENBQUMsaUJBQWlCLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7Z0JBQ3pDLEVBQUUsR0FBRyxJQUFJLGNBQWMsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUM3RSxFQUFFLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztnQkFDckIsc0JBQU8sRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBQzs7O0tBQ25CO0lBQ0gsb0JBQUM7QUFBRCxDQUFDLEFBckVELElBcUVDOztBQUVELGVBQWUsYUFBYSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtJUHJvZ3Jlc3NCYXJ9IGZyb20gJy4uL2NvbW1vbi9pbnRlcmZhY2VzJztcbmltcG9ydCBIZWFwU25hcHNob3RQYXJzZXIgZnJvbSAnLi9oZWFwX3NuYXBzaG90X3BhcnNlcic7XG5pbXBvcnQgQ2hyb21lRHJpdmVyIGZyb20gJy4vY2hyb21lX2RyaXZlcic7XG5pbXBvcnQgQkxlYWtSZXN1bHRzIGZyb20gJy4vYmxlYWtfcmVzdWx0cyc7XG5pbXBvcnQgQkxlYWtDb25maWcgZnJvbSAnLi9ibGVha19jb25maWcnO1xuaW1wb3J0IHtGaW5kQW5kRGlhZ25vc2VMZWFrcywgRXZhbHVhdGVSYW5raW5nTWV0cmljc09wZXJhdGlvbiwgT3BlcmF0aW9uU3RhdGV9IGZyb20gJy4vYmxlYWtfb3BlcmF0aW9ucyc7XG5cbmZ1bmN0aW9uIGRlZmF1bHRTbmFwc2hvdENiKCk6IFByb21pc2U8dm9pZD4ge1xuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG59XG5cbmV4cG9ydCBjbGFzcyBCTGVha0RldGVjdG9yIHtcbiAgLyoqXG4gICAqIEZpbmQgbGVha3MgaW4gYW4gYXBwbGljYXRpb24uXG4gICAqIEBwYXJhbSBjb25maWdTb3VyY2UgVGhlIHNvdXJjZSBjb2RlIG9mIHRoZSBjb25maWd1cmF0aW9uIGZpbGUgYXMgYSBDb21tb25KUyBtb2R1bGUuXG4gICAqIEBwYXJhbSBwcm9ncmVzc0JhciBBIHByb2dyZXNzIGJhciwgdG8gd2hpY2ggQkxlYWsgd2lsbCBwcmludCBpbmZvcm1hdGlvbiBhYm91dCBpdHMgcHJvZ3Jlc3MuXG4gICAqIEBwYXJhbSBkcml2ZXIgVGhlIENocm9tZSBkcml2ZXIuXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIGFzeW5jIEZpbmRMZWFrcyhjb25maWdTb3VyY2U6IHN0cmluZywgcHJvZ3Jlc3NCYXI6IElQcm9ncmVzc0JhciwgZHJpdmVyOiBDaHJvbWVEcml2ZXIsIHNuYXBzaG90Q2I6IChzbjogSGVhcFNuYXBzaG90UGFyc2VyKSA9PiBQcm9taXNlPHZvaWQ+ID0gZGVmYXVsdFNuYXBzaG90Q2IsIGJsZWFrUmVzdWx0cz86IEJMZWFrUmVzdWx0cyk6IFByb21pc2U8QkxlYWtSZXN1bHRzPiB7XG4gICAgY29uc3QgZGV0ZWN0b3IgPSBuZXcgQkxlYWtEZXRlY3Rvcihkcml2ZXIsIHByb2dyZXNzQmFyLCBjb25maWdTb3VyY2UsIHNuYXBzaG90Q2IpO1xuICAgIHJldHVybiBkZXRlY3Rvci5maW5kQW5kRGlhZ25vc2VMZWFrcyhibGVha1Jlc3VsdHMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEV2YWx1YXRlIHRoZSBlZmZlY3RpdmVuZXNzIG9mIGxlYWsgZml4ZXMgYXBwbGllZCBpbiBvcmRlciB1c2luZyBkaWZmZXJlbnQgbWV0cmljcy5cbiAgICogUnVucyB0aGUgYXBwbGljYXRpb24gd2l0aG91dCBhbnkgb2YgdGhlIGZpeGVzLCBhbmQgdGhlbiB3aXRoIGVhY2ggZml4IGluIHN1Y2Nlc3NpdmUgb3JkZXIgdXNpbmdcbiAgICogZGlmZmVyZW50IG1ldHJpY3MuIE11dGF0ZXMgdGhlIEJMZWFrUmVzdWx0cyBvYmplY3Qgd2l0aCB0aGUgZGF0YSwgYW5kIGNhbGxzIGEgY2FsbGJhY2tcbiAgICogcGVyaW9kaWNhbGx5IHRvIGZsdXNoIGl0IHRvIGRpc2suIEludGVsbGlnZW50bHkgcmVzdW1lcyBmcm9tIGEgcGFydGlhbGx5LWNvbXBsZXRlZFxuICAgKiBldmFsdWF0aW9uIHJ1bi5cbiAgICogQHBhcmFtIGNvbmZpZ1NvdXJjZSBUaGUgc291cmNlIGNvZGUgb2YgdGhlIGNvbmZpZ3VyYXRpb24gZmlsZSBhcyBhIENvbW1vbkpTIG1vZHVsZS5cbiAgICogQHBhcmFtIHByb2dyZXNzQmFyIEEgcHJvZ3Jlc3MgYmFyLCB0byB3aGljaCBCTGVhayB3aWxsIHByaW50IGluZm9ybWF0aW9uIGFib3V0IGl0cyBwcm9ncmVzcy5cbiAgICogQHBhcmFtIGRyaXZlciBUaGUgYnJvd3NlciBkcml2ZXIuXG4gICAqIEBwYXJhbSByZXN1bHRzIFRoZSByZXN1bHRzIGZpbGUgZnJvbSBhIEJMZWFrIHJ1bi5cbiAgICogQHBhcmFtIGZsdXNoUmVzdWx0cyBDYWxsZWQgd2hlbiB0aGUgcmVzdWx0cyBmaWxlIHNob3VsZCBiZSBmbHVzaGVkIHRvIGRpc2suXG4gICAqIEBwYXJhbSBzbmFwc2hvdENiIChPcHRpb25hbCkgU25hcHNob3QgY2FsbGJhY2suXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIGFzeW5jIEV2YWx1YXRlUmFua2luZ01ldHJpY3MoY29uZmlnU291cmNlOiBzdHJpbmcsIHByb2dyZXNzQmFyOiBJUHJvZ3Jlc3NCYXIsIGRyaXZlcjogQ2hyb21lRHJpdmVyLCByZXN1bHRzOiBCTGVha1Jlc3VsdHMsIGZsdXNoUmVzdWx0czogKHJlc3VsdHM6IEJMZWFrUmVzdWx0cykgPT4gdm9pZCwgc25hcHNob3RDYjogKHNuOiBIZWFwU25hcHNob3RQYXJzZXIsIG1ldHJpYzogc3RyaW5nLCBsZWFrc0ZpeGVkOiBudW1iZXIsIGl0ZXJhdGlvbjogbnVtYmVyKSA9PiBQcm9taXNlPHZvaWQ+ID0gZGVmYXVsdFNuYXBzaG90Q2IpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBkZXRlY3RvciA9IG5ldyBCTGVha0RldGVjdG9yKGRyaXZlciwgcHJvZ3Jlc3NCYXIsIGNvbmZpZ1NvdXJjZSk7XG4gICAgcmV0dXJuIGRldGVjdG9yLmV2YWx1YXRlUmFua2luZ01ldHJpY3MocmVzdWx0cywgZmx1c2hSZXN1bHRzLCBzbmFwc2hvdENiKTs7XG4gIH1cblxuICBwcml2YXRlIF9kcml2ZXI6IENocm9tZURyaXZlcjtcbiAgcHJpdmF0ZSByZWFkb25seSBfcHJvZ3Jlc3NCYXI6IElQcm9ncmVzc0JhcjtcbiAgcHJpdmF0ZSByZWFkb25seSBfY29uZmlnOiBCTGVha0NvbmZpZztcbiAgcHJpdmF0ZSBfc25hcHNob3RDYjogKHNuOiBIZWFwU25hcHNob3RQYXJzZXIpID0+IFByb21pc2U8dm9pZD47XG4gIHByaXZhdGUgY29uc3RydWN0b3IoZHJpdmVyOiBDaHJvbWVEcml2ZXIsIHByb2dyZXNzQmFyOiBJUHJvZ3Jlc3NCYXIsIGNvbmZpZ1NvdXJjZTogc3RyaW5nLCBzbmFwc2hvdENiOiAoc246IEhlYXBTbmFwc2hvdFBhcnNlcikgPT4gUHJvbWlzZTx2b2lkPiA9IGRlZmF1bHRTbmFwc2hvdENiKSB7XG4gICAgdGhpcy5fZHJpdmVyID0gZHJpdmVyO1xuICAgIHRoaXMuX3Byb2dyZXNzQmFyID0gcHJvZ3Jlc3NCYXI7XG4gICAgdGhpcy5fY29uZmlnID0gQkxlYWtDb25maWcuRnJvbVNvdXJjZShjb25maWdTb3VyY2UpO1xuICAgIHRoaXMuX3NuYXBzaG90Q2IgPSBzbmFwc2hvdENiO1xuICB9XG5cbiAgLyoqXG4gICAqIExvY2F0ZXMgbWVtb3J5IGxlYWtzIG9uIHRoZSBwYWdlIGFuZCBkaWFnbm9zZXMgdGhlbS4gVGhpcyBpcyB0aGUgZW5kLXRvLWVuZFxuICAgKiBCTGVhayBhbGdvcml0aG0uXG4gICAqL1xuICBwdWJsaWMgYXN5bmMgZmluZEFuZERpYWdub3NlTGVha3MoYmxlYWtSZXN1bHRzPzogQkxlYWtSZXN1bHRzKTogUHJvbWlzZTxCTGVha1Jlc3VsdHM+IHtcbiAgICBjb25zdCBvcCA9IG5ldyBGaW5kQW5kRGlhZ25vc2VMZWFrcyh0aGlzLl9jb25maWcsIHRoaXMuX3NuYXBzaG90Q2IpO1xuICAgIHRoaXMuX3Byb2dyZXNzQmFyLnNldE9wZXJhdGlvbkNvdW50KG9wLnNpemUoKSk7XG4gICAgY29uc3Qgb3MgPSBuZXcgT3BlcmF0aW9uU3RhdGUodGhpcy5fZHJpdmVyLCB0aGlzLl9wcm9ncmVzc0JhciwgdGhpcy5fY29uZmlnKTtcbiAgICBpZiAoYmxlYWtSZXN1bHRzKSB7XG4gICAgICBvcy5yZXN1bHRzID0gYmxlYWtSZXN1bHRzO1xuICAgIH1cbiAgICBhd2FpdCBvcC5ydW4ob3MpO1xuICAgIHJldHVybiBvcy5yZXN1bHRzO1xuICB9XG5cbiAgLyoqXG4gICAqIEdpdmVuIGEgQkxlYWsgcmVzdWx0cyBmaWxlLCBjb2xsZWN0cyB0aGUgaW5mb3JtYXRpb24gbmVlZGVkIHRvIGV2YWx1YXRlIHRoZSBlZmZlY3RpdmVuZXNzIG9mIHZhcmlvdXMgbWV0cmljcy5cbiAgICogQHBhcmFtIHJlc3VsdHMgQkxlYWsgcmVzdWx0cyBmaWxlIGZyb20gYSBCTGVhayBydW4uXG4gICAqIEBwYXJhbSBmbHVzaFJlc3VsdHMgQ2FsbGJhY2sgdGhhdCBmbHVzaGVzIHRoZSByZXN1bHRzIGZpbGUgdG8gZGlzay4gQ2FsbGVkIHBlcmlvZGljYWxseSB3aGVuIG5ldyByZXN1bHRzIGFyZSBhZGRlZC5cbiAgICogQHBhcmFtIHNuYXBzaG90Q2IgT3B0aW9uYWwgY2FsbGJhY2sgdGhhdCBpcyBjYWxsZWQgd2hlbmV2ZXIgYSBoZWFwIHNuYXBzaG90IGlzIHRha2VuLlxuICAgKi9cbiAgcHVibGljIGFzeW5jIGV2YWx1YXRlUmFua2luZ01ldHJpY3MocmVzdWx0czogQkxlYWtSZXN1bHRzLCBmbHVzaFJlc3VsdHM6IChyZXN1bHRzOiBCTGVha1Jlc3VsdHMpID0+IHZvaWQsIHNuYXBzaG90Q2I6IChzczogSGVhcFNuYXBzaG90UGFyc2VyLCBtZXRyaWM6IHN0cmluZywgbGVha3NGaXhlZDogbnVtYmVyLCBpdGVyYXRpb246IG51bWJlcikgPT4gUHJvbWlzZTx2b2lkPik6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IG9wID0gbmV3IEV2YWx1YXRlUmFua2luZ01ldHJpY3NPcGVyYXRpb24odGhpcy5fY29uZmlnLCByZXN1bHRzLCBmbHVzaFJlc3VsdHMsIHNuYXBzaG90Q2IpO1xuICAgIHRoaXMuX3Byb2dyZXNzQmFyLnNldE9wZXJhdGlvbkNvdW50KG9wLnNpemUoKSk7XG4gICAgY29uc3Qgb3MgPSBuZXcgT3BlcmF0aW9uU3RhdGUodGhpcy5fZHJpdmVyLCB0aGlzLl9wcm9ncmVzc0JhciwgdGhpcy5fY29uZmlnKTtcbiAgICBvcy5yZXN1bHRzID0gcmVzdWx0cztcbiAgICByZXR1cm4gb3AucnVuKG9zKTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBCTGVha0RldGVjdG9yO1xuIl19