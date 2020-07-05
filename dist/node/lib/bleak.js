"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bleak_config_1 = require("./bleak_config");
const bleak_operations_1 = require("./bleak_operations");
function defaultSnapshotCb() {
    return Promise.resolve();
}
class BLeakDetector {
    /**
     * Find leaks in an application.
     * @param configSource The source code of the configuration file as a CommonJS module.
     * @param progressBar A progress bar, to which BLeak will print information about its progress.
     * @param driver The Chrome driver.
     */
    static async FindLeaks(configSource, progressBar, driver, snapshotCb = defaultSnapshotCb, bleakResults) {
        const detector = new BLeakDetector(driver, progressBar, configSource, snapshotCb);
        return detector.findAndDiagnoseLeaks(bleakResults);
    }
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
    static async EvaluateRankingMetrics(configSource, progressBar, driver, results, flushResults, snapshotCb = defaultSnapshotCb) {
        const detector = new BLeakDetector(driver, progressBar, configSource);
        return detector.evaluateRankingMetrics(results, flushResults, snapshotCb);
        ;
    }
    constructor(driver, progressBar, configSource, snapshotCb = defaultSnapshotCb) {
        this._driver = driver;
        this._progressBar = progressBar;
        this._config = bleak_config_1.default.FromSource(configSource);
        this._snapshotCb = snapshotCb;
    }
    /**
     * Locates memory leaks on the page and diagnoses them. This is the end-to-end
     * BLeak algorithm.
     */
    async findAndDiagnoseLeaks(bleakResults) {
        const op = new bleak_operations_1.FindAndDiagnoseLeaks(this._config, this._snapshotCb);
        this._progressBar.setOperationCount(op.size());
        const os = new bleak_operations_1.OperationState(this._driver, this._progressBar, this._config);
        if (bleakResults) {
            os.results = bleakResults;
        }
        await op.run(os);
        return os.results;
    }
    /**
     * Given a BLeak results file, collects the information needed to evaluate the effectiveness of various metrics.
     * @param results BLeak results file from a BLeak run.
     * @param flushResults Callback that flushes the results file to disk. Called periodically when new results are added.
     * @param snapshotCb Optional callback that is called whenever a heap snapshot is taken.
     */
    async evaluateRankingMetrics(results, flushResults, snapshotCb) {
        const op = new bleak_operations_1.EvaluateRankingMetricsOperation(this._config, results, flushResults, snapshotCb);
        this._progressBar.setOperationCount(op.size());
        const os = new bleak_operations_1.OperationState(this._driver, this._progressBar, this._config);
        os.results = results;
        return op.run(os);
    }
}
exports.BLeakDetector = BLeakDetector;
exports.default = BLeakDetector;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmxlYWsuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvbGliL2JsZWFrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBSUEsaURBQXlDO0FBQ3pDLHlEQUF5RztBQUV6RztJQUNFLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDM0IsQ0FBQztBQUVEO0lBQ0U7Ozs7O09BS0c7SUFDSSxNQUFNLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxZQUFvQixFQUFFLFdBQXlCLEVBQUUsTUFBb0IsRUFBRSxhQUF3RCxpQkFBaUIsRUFBRSxZQUEyQjtRQUN6TSxNQUFNLFFBQVEsR0FBRyxJQUFJLGFBQWEsQ0FBQyxNQUFNLEVBQUUsV0FBVyxFQUFFLFlBQVksRUFBRSxVQUFVLENBQUMsQ0FBQztRQUNsRixNQUFNLENBQUMsUUFBUSxDQUFDLG9CQUFvQixDQUFDLFlBQVksQ0FBQyxDQUFDO0lBQ3JELENBQUM7SUFFRDs7Ozs7Ozs7Ozs7O09BWUc7SUFDSSxNQUFNLENBQUMsS0FBSyxDQUFDLHNCQUFzQixDQUFDLFlBQW9CLEVBQUUsV0FBeUIsRUFBRSxNQUFvQixFQUFFLE9BQXFCLEVBQUUsWUFBNkMsRUFBRSxhQUErRyxpQkFBaUI7UUFDdFQsTUFBTSxRQUFRLEdBQUcsSUFBSSxhQUFhLENBQUMsTUFBTSxFQUFFLFdBQVcsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUN0RSxNQUFNLENBQUMsUUFBUSxDQUFDLHNCQUFzQixDQUFDLE9BQU8sRUFBRSxZQUFZLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFBQSxDQUFDO0lBQzdFLENBQUM7SUFNRCxZQUFvQixNQUFvQixFQUFFLFdBQXlCLEVBQUUsWUFBb0IsRUFBRSxhQUF3RCxpQkFBaUI7UUFDbEssSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7UUFDdEIsSUFBSSxDQUFDLFlBQVksR0FBRyxXQUFXLENBQUM7UUFDaEMsSUFBSSxDQUFDLE9BQU8sR0FBRyxzQkFBVyxDQUFDLFVBQVUsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUNwRCxJQUFJLENBQUMsV0FBVyxHQUFHLFVBQVUsQ0FBQztJQUNoQyxDQUFDO0lBRUQ7OztPQUdHO0lBQ0ksS0FBSyxDQUFDLG9CQUFvQixDQUFDLFlBQTJCO1FBQzNELE1BQU0sRUFBRSxHQUFHLElBQUksdUNBQW9CLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDcEUsSUFBSSxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUMvQyxNQUFNLEVBQUUsR0FBRyxJQUFJLGlDQUFjLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUM3RSxFQUFFLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO1lBQ2pCLEVBQUUsQ0FBQyxPQUFPLEdBQUcsWUFBWSxDQUFDO1FBQzVCLENBQUM7UUFDRCxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDakIsTUFBTSxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUM7SUFDcEIsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0ksS0FBSyxDQUFDLHNCQUFzQixDQUFDLE9BQXFCLEVBQUUsWUFBNkMsRUFBRSxVQUE0RztRQUNwTixNQUFNLEVBQUUsR0FBRyxJQUFJLGtEQUErQixDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLFlBQVksRUFBRSxVQUFVLENBQUMsQ0FBQztRQUNoRyxJQUFJLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQy9DLE1BQU0sRUFBRSxHQUFHLElBQUksaUNBQWMsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzdFLEVBQUUsQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBQ3JCLE1BQU0sQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ3BCLENBQUM7Q0FDRjtBQXJFRCxzQ0FxRUM7QUFFRCxrQkFBZSxhQUFhLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge0lQcm9ncmVzc0Jhcn0gZnJvbSAnLi4vY29tbW9uL2ludGVyZmFjZXMnO1xuaW1wb3J0IEhlYXBTbmFwc2hvdFBhcnNlciBmcm9tICcuL2hlYXBfc25hcHNob3RfcGFyc2VyJztcbmltcG9ydCBDaHJvbWVEcml2ZXIgZnJvbSAnLi9jaHJvbWVfZHJpdmVyJztcbmltcG9ydCBCTGVha1Jlc3VsdHMgZnJvbSAnLi9ibGVha19yZXN1bHRzJztcbmltcG9ydCBCTGVha0NvbmZpZyBmcm9tICcuL2JsZWFrX2NvbmZpZyc7XG5pbXBvcnQge0ZpbmRBbmREaWFnbm9zZUxlYWtzLCBFdmFsdWF0ZVJhbmtpbmdNZXRyaWNzT3BlcmF0aW9uLCBPcGVyYXRpb25TdGF0ZX0gZnJvbSAnLi9ibGVha19vcGVyYXRpb25zJztcblxuZnVuY3Rpb24gZGVmYXVsdFNuYXBzaG90Q2IoKTogUHJvbWlzZTx2b2lkPiB7XG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbn1cblxuZXhwb3J0IGNsYXNzIEJMZWFrRGV0ZWN0b3Ige1xuICAvKipcbiAgICogRmluZCBsZWFrcyBpbiBhbiBhcHBsaWNhdGlvbi5cbiAgICogQHBhcmFtIGNvbmZpZ1NvdXJjZSBUaGUgc291cmNlIGNvZGUgb2YgdGhlIGNvbmZpZ3VyYXRpb24gZmlsZSBhcyBhIENvbW1vbkpTIG1vZHVsZS5cbiAgICogQHBhcmFtIHByb2dyZXNzQmFyIEEgcHJvZ3Jlc3MgYmFyLCB0byB3aGljaCBCTGVhayB3aWxsIHByaW50IGluZm9ybWF0aW9uIGFib3V0IGl0cyBwcm9ncmVzcy5cbiAgICogQHBhcmFtIGRyaXZlciBUaGUgQ2hyb21lIGRyaXZlci5cbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgYXN5bmMgRmluZExlYWtzKGNvbmZpZ1NvdXJjZTogc3RyaW5nLCBwcm9ncmVzc0JhcjogSVByb2dyZXNzQmFyLCBkcml2ZXI6IENocm9tZURyaXZlciwgc25hcHNob3RDYjogKHNuOiBIZWFwU25hcHNob3RQYXJzZXIpID0+IFByb21pc2U8dm9pZD4gPSBkZWZhdWx0U25hcHNob3RDYiwgYmxlYWtSZXN1bHRzPzogQkxlYWtSZXN1bHRzKTogUHJvbWlzZTxCTGVha1Jlc3VsdHM+IHtcbiAgICBjb25zdCBkZXRlY3RvciA9IG5ldyBCTGVha0RldGVjdG9yKGRyaXZlciwgcHJvZ3Jlc3NCYXIsIGNvbmZpZ1NvdXJjZSwgc25hcHNob3RDYik7XG4gICAgcmV0dXJuIGRldGVjdG9yLmZpbmRBbmREaWFnbm9zZUxlYWtzKGJsZWFrUmVzdWx0cyk7XG4gIH1cblxuICAvKipcbiAgICogRXZhbHVhdGUgdGhlIGVmZmVjdGl2ZW5lc3Mgb2YgbGVhayBmaXhlcyBhcHBsaWVkIGluIG9yZGVyIHVzaW5nIGRpZmZlcmVudCBtZXRyaWNzLlxuICAgKiBSdW5zIHRoZSBhcHBsaWNhdGlvbiB3aXRob3V0IGFueSBvZiB0aGUgZml4ZXMsIGFuZCB0aGVuIHdpdGggZWFjaCBmaXggaW4gc3VjY2Vzc2l2ZSBvcmRlciB1c2luZ1xuICAgKiBkaWZmZXJlbnQgbWV0cmljcy4gTXV0YXRlcyB0aGUgQkxlYWtSZXN1bHRzIG9iamVjdCB3aXRoIHRoZSBkYXRhLCBhbmQgY2FsbHMgYSBjYWxsYmFja1xuICAgKiBwZXJpb2RpY2FsbHkgdG8gZmx1c2ggaXQgdG8gZGlzay4gSW50ZWxsaWdlbnRseSByZXN1bWVzIGZyb20gYSBwYXJ0aWFsbHktY29tcGxldGVkXG4gICAqIGV2YWx1YXRpb24gcnVuLlxuICAgKiBAcGFyYW0gY29uZmlnU291cmNlIFRoZSBzb3VyY2UgY29kZSBvZiB0aGUgY29uZmlndXJhdGlvbiBmaWxlIGFzIGEgQ29tbW9uSlMgbW9kdWxlLlxuICAgKiBAcGFyYW0gcHJvZ3Jlc3NCYXIgQSBwcm9ncmVzcyBiYXIsIHRvIHdoaWNoIEJMZWFrIHdpbGwgcHJpbnQgaW5mb3JtYXRpb24gYWJvdXQgaXRzIHByb2dyZXNzLlxuICAgKiBAcGFyYW0gZHJpdmVyIFRoZSBicm93c2VyIGRyaXZlci5cbiAgICogQHBhcmFtIHJlc3VsdHMgVGhlIHJlc3VsdHMgZmlsZSBmcm9tIGEgQkxlYWsgcnVuLlxuICAgKiBAcGFyYW0gZmx1c2hSZXN1bHRzIENhbGxlZCB3aGVuIHRoZSByZXN1bHRzIGZpbGUgc2hvdWxkIGJlIGZsdXNoZWQgdG8gZGlzay5cbiAgICogQHBhcmFtIHNuYXBzaG90Q2IgKE9wdGlvbmFsKSBTbmFwc2hvdCBjYWxsYmFjay5cbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgYXN5bmMgRXZhbHVhdGVSYW5raW5nTWV0cmljcyhjb25maWdTb3VyY2U6IHN0cmluZywgcHJvZ3Jlc3NCYXI6IElQcm9ncmVzc0JhciwgZHJpdmVyOiBDaHJvbWVEcml2ZXIsIHJlc3VsdHM6IEJMZWFrUmVzdWx0cywgZmx1c2hSZXN1bHRzOiAocmVzdWx0czogQkxlYWtSZXN1bHRzKSA9PiB2b2lkLCBzbmFwc2hvdENiOiAoc246IEhlYXBTbmFwc2hvdFBhcnNlciwgbWV0cmljOiBzdHJpbmcsIGxlYWtzRml4ZWQ6IG51bWJlciwgaXRlcmF0aW9uOiBudW1iZXIpID0+IFByb21pc2U8dm9pZD4gPSBkZWZhdWx0U25hcHNob3RDYik6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGRldGVjdG9yID0gbmV3IEJMZWFrRGV0ZWN0b3IoZHJpdmVyLCBwcm9ncmVzc0JhciwgY29uZmlnU291cmNlKTtcbiAgICByZXR1cm4gZGV0ZWN0b3IuZXZhbHVhdGVSYW5raW5nTWV0cmljcyhyZXN1bHRzLCBmbHVzaFJlc3VsdHMsIHNuYXBzaG90Q2IpOztcbiAgfVxuXG4gIHByaXZhdGUgX2RyaXZlcjogQ2hyb21lRHJpdmVyO1xuICBwcml2YXRlIHJlYWRvbmx5IF9wcm9ncmVzc0JhcjogSVByb2dyZXNzQmFyO1xuICBwcml2YXRlIHJlYWRvbmx5IF9jb25maWc6IEJMZWFrQ29uZmlnO1xuICBwcml2YXRlIF9zbmFwc2hvdENiOiAoc246IEhlYXBTbmFwc2hvdFBhcnNlcikgPT4gUHJvbWlzZTx2b2lkPjtcbiAgcHJpdmF0ZSBjb25zdHJ1Y3Rvcihkcml2ZXI6IENocm9tZURyaXZlciwgcHJvZ3Jlc3NCYXI6IElQcm9ncmVzc0JhciwgY29uZmlnU291cmNlOiBzdHJpbmcsIHNuYXBzaG90Q2I6IChzbjogSGVhcFNuYXBzaG90UGFyc2VyKSA9PiBQcm9taXNlPHZvaWQ+ID0gZGVmYXVsdFNuYXBzaG90Q2IpIHtcbiAgICB0aGlzLl9kcml2ZXIgPSBkcml2ZXI7XG4gICAgdGhpcy5fcHJvZ3Jlc3NCYXIgPSBwcm9ncmVzc0JhcjtcbiAgICB0aGlzLl9jb25maWcgPSBCTGVha0NvbmZpZy5Gcm9tU291cmNlKGNvbmZpZ1NvdXJjZSk7XG4gICAgdGhpcy5fc25hcHNob3RDYiA9IHNuYXBzaG90Q2I7XG4gIH1cblxuICAvKipcbiAgICogTG9jYXRlcyBtZW1vcnkgbGVha3Mgb24gdGhlIHBhZ2UgYW5kIGRpYWdub3NlcyB0aGVtLiBUaGlzIGlzIHRoZSBlbmQtdG8tZW5kXG4gICAqIEJMZWFrIGFsZ29yaXRobS5cbiAgICovXG4gIHB1YmxpYyBhc3luYyBmaW5kQW5kRGlhZ25vc2VMZWFrcyhibGVha1Jlc3VsdHM/OiBCTGVha1Jlc3VsdHMpOiBQcm9taXNlPEJMZWFrUmVzdWx0cz4ge1xuICAgIGNvbnN0IG9wID0gbmV3IEZpbmRBbmREaWFnbm9zZUxlYWtzKHRoaXMuX2NvbmZpZywgdGhpcy5fc25hcHNob3RDYik7XG4gICAgdGhpcy5fcHJvZ3Jlc3NCYXIuc2V0T3BlcmF0aW9uQ291bnQob3Auc2l6ZSgpKTtcbiAgICBjb25zdCBvcyA9IG5ldyBPcGVyYXRpb25TdGF0ZSh0aGlzLl9kcml2ZXIsIHRoaXMuX3Byb2dyZXNzQmFyLCB0aGlzLl9jb25maWcpO1xuICAgIGlmIChibGVha1Jlc3VsdHMpIHtcbiAgICAgIG9zLnJlc3VsdHMgPSBibGVha1Jlc3VsdHM7XG4gICAgfVxuICAgIGF3YWl0IG9wLnJ1bihvcyk7XG4gICAgcmV0dXJuIG9zLnJlc3VsdHM7XG4gIH1cblxuICAvKipcbiAgICogR2l2ZW4gYSBCTGVhayByZXN1bHRzIGZpbGUsIGNvbGxlY3RzIHRoZSBpbmZvcm1hdGlvbiBuZWVkZWQgdG8gZXZhbHVhdGUgdGhlIGVmZmVjdGl2ZW5lc3Mgb2YgdmFyaW91cyBtZXRyaWNzLlxuICAgKiBAcGFyYW0gcmVzdWx0cyBCTGVhayByZXN1bHRzIGZpbGUgZnJvbSBhIEJMZWFrIHJ1bi5cbiAgICogQHBhcmFtIGZsdXNoUmVzdWx0cyBDYWxsYmFjayB0aGF0IGZsdXNoZXMgdGhlIHJlc3VsdHMgZmlsZSB0byBkaXNrLiBDYWxsZWQgcGVyaW9kaWNhbGx5IHdoZW4gbmV3IHJlc3VsdHMgYXJlIGFkZGVkLlxuICAgKiBAcGFyYW0gc25hcHNob3RDYiBPcHRpb25hbCBjYWxsYmFjayB0aGF0IGlzIGNhbGxlZCB3aGVuZXZlciBhIGhlYXAgc25hcHNob3QgaXMgdGFrZW4uXG4gICAqL1xuICBwdWJsaWMgYXN5bmMgZXZhbHVhdGVSYW5raW5nTWV0cmljcyhyZXN1bHRzOiBCTGVha1Jlc3VsdHMsIGZsdXNoUmVzdWx0czogKHJlc3VsdHM6IEJMZWFrUmVzdWx0cykgPT4gdm9pZCwgc25hcHNob3RDYjogKHNzOiBIZWFwU25hcHNob3RQYXJzZXIsIG1ldHJpYzogc3RyaW5nLCBsZWFrc0ZpeGVkOiBudW1iZXIsIGl0ZXJhdGlvbjogbnVtYmVyKSA9PiBQcm9taXNlPHZvaWQ+KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3Qgb3AgPSBuZXcgRXZhbHVhdGVSYW5raW5nTWV0cmljc09wZXJhdGlvbih0aGlzLl9jb25maWcsIHJlc3VsdHMsIGZsdXNoUmVzdWx0cywgc25hcHNob3RDYik7XG4gICAgdGhpcy5fcHJvZ3Jlc3NCYXIuc2V0T3BlcmF0aW9uQ291bnQob3Auc2l6ZSgpKTtcbiAgICBjb25zdCBvcyA9IG5ldyBPcGVyYXRpb25TdGF0ZSh0aGlzLl9kcml2ZXIsIHRoaXMuX3Byb2dyZXNzQmFyLCB0aGlzLl9jb25maWcpO1xuICAgIG9zLnJlc3VsdHMgPSByZXN1bHRzO1xuICAgIHJldHVybiBvcC5ydW4ob3MpO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IEJMZWFrRGV0ZWN0b3I7XG4iXX0=