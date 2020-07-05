"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("../common/util");
const mitmproxy_interceptor_1 = require("./mitmproxy_interceptor");
const bleak_results_1 = require("./bleak_results");
const growth_graph_1 = require("./growth_graph");
const stack_frame_converter_1 = require("./stack_frame_converter");
const path_to_string_1 = require("./path_to_string");
class OperationState {
    constructor(chromeDriver, progressBar, config) {
        this.chromeDriver = chromeDriver;
        this.progressBar = progressBar;
        this.config = config;
        this.results = null;
    }
}
exports.OperationState = OperationState;
const NEVER = Math.pow(2, 30);
class Operation {
    constructor(_timeout = NEVER) {
        this._timeout = _timeout;
    }
    // Returns the size of the operations graph beginning with this node.
    // Default is 1 (no dependent operations)
    size() { return 1; }
    // Returns 'true' if the operation is fulfilled and can be skipped.
    // Defaults to unskippable.
    skip(opSt) { return false; }
    // Runs the operation. Promise is resolved/rejected when completed.
    async run(opSt) {
        opSt.progressBar.updateDescription(this.description);
        if (this.skip(opSt)) {
            const size = this.size();
            for (let i = 0; i < size; i++) {
                opSt.progressBar.nextOperation();
            }
            return;
        }
        if (this._timeout === NEVER) {
            await this._run(opSt);
            opSt.progressBar.nextOperation();
            return;
        }
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                const e = new Error(`Operation timed out.`);
                this.cancel(e);
                reject(e);
            }, this._timeout);
            this._run(opSt).then(() => {
                clearTimeout(timer);
                opSt.progressBar.nextOperation();
                resolve();
            }).catch((e) => {
                clearTimeout(timer);
                reject(e);
            });
        });
    }
    // Called when a running operation is canceled. Operation should exit gracefully.
    cancel(e) { }
}
class NavigateOperation extends Operation {
    constructor(timeout, _url) {
        super(timeout);
        this._url = _url;
    }
    get description() {
        return `Navigating to ${this._url}`;
    }
    _run(opSt) {
        return opSt.chromeDriver.navigateTo(this._url);
    }
}
class CheckOperation extends Operation {
    constructor(timeout, _stepType, _id) {
        super(timeout);
        this._stepType = _stepType;
        this._id = _id;
        this._cancelled = false;
    }
    get description() {
        return `Waiting for ${this._stepType}[${this._id}].check() === true`;
    }
    cancel(e) {
        this._cancelled = true;
    }
    async _run(opSt) {
        // Wait until either the operation is canceled (timeout) or the check succeeds.
        while (!this._cancelled) {
            const success = await opSt.chromeDriver.runCode(`typeof(BLeakConfig) !== "undefined" && BLeakConfig.${this._stepType}[${this._id}].check()`);
            if (success) {
                return;
            }
            await util_1.wait(100);
        }
    }
}
class NextOperation extends Operation {
    constructor(timeout, _stepType, _id) {
        super(timeout);
        this._stepType = _stepType;
        this._id = _id;
    }
    get description() {
        return `Advancing to next state ${this._stepType}[${this._id}].next()`;
    }
    async _run(opSt) {
        return opSt.chromeDriver.runCode(`BLeakConfig.${this._stepType}[${this._id}].next()`);
    }
}
class DelayOperation extends Operation {
    constructor(_delay) {
        super();
        this._delay = _delay;
    }
    get description() {
        return `Waiting ${this._delay} ms before proceeding`;
    }
    _run() {
        return util_1.wait(this._delay);
    }
}
class TakeHeapSnapshotOperation extends Operation {
    constructor(timeout, _snapshotCb) {
        super(timeout);
        this._snapshotCb = _snapshotCb;
    }
    get description() {
        return `Taking a heap snapshot`;
    }
    async _run(opSt) {
        const sn = opSt.chromeDriver.takeHeapSnapshot();
        return this._snapshotCb(sn);
    }
}
class ConfigureProxyOperation extends Operation {
    constructor(_config) {
        super();
        this._config = _config;
    }
    get description() {
        return `Configuring the proxy`;
    }
    async _run(opSt) {
        this._config.log = opSt.progressBar;
        opSt.chromeDriver.mitmProxy.cb = mitmproxy_interceptor_1.default(this._config);
    }
}
function countOperations(sumSoFar, next) {
    return sumSoFar + next.size();
}
class CompositeOperation extends Operation {
    constructor() {
        super(...arguments);
        this.children = [];
        this._canceledError = null;
    }
    size() {
        return this.children.reduce(countOperations, 1);
    }
    cancel(e) {
        this._canceledError = e;
    }
    async _run(opSt) {
        let promise = Promise.resolve();
        let i = 0;
        const self = this;
        function runNext() {
            if (self._canceledError) {
                throw self._canceledError;
            }
            if (i < self.children.length) {
                return self.children[i++].run(opSt);
            }
        }
        for (let i = 0; i < this.children.length; i++) {
            promise = promise.then(runNext);
        }
        return promise;
    }
}
class StepOperation extends CompositeOperation {
    constructor(config, stepType, id) {
        super();
        this.children.push(new CheckOperation(config.timeout, stepType, id));
        if (config.postCheckSleep) {
            this.children.push(new DelayOperation(config.postCheckSleep));
        }
        this.children.push(new NextOperation(config.timeout, stepType, id));
        if (config.postNextSleep) {
            this.children.push(new DelayOperation(config.postNextSleep));
        }
    }
    get description() { return ''; }
}
class InstrumentGrowingPathsOperation extends Operation {
    get description() {
        return `Instrumenting growing objects`;
    }
    _run(opSt) {
        return opSt.chromeDriver.runCode(`window.$$$INSTRUMENT_PATHS$$$(${JSON.stringify(growth_graph_1.toPathTree(opSt.results.leaks))})`);
    }
}
class StepSeriesOperation extends CompositeOperation {
    constructor(config, stepType) {
        super();
        const steps = config[stepType];
        for (let i = 0; i < steps.length; i++) {
            this.children.push(new StepOperation(config, stepType, i));
        }
    }
    get description() { return ''; }
}
class ProgramRunOperation extends CompositeOperation {
    constructor(config, runLogin, iterations, takeInitialSnapshot, snapshotCb) {
        super();
        this.children.push(new NavigateOperation(config.timeout, config.url));
        if (runLogin && config.login.length > 0) {
            this.children.push(new StepSeriesOperation(config, 'login'), new DelayOperation(config.postLoginSleep), new NavigateOperation(config.timeout, config.url));
        }
        if (config.setup.length > 0) {
            this.children.push(new StepSeriesOperation(config, 'setup'));
        }
        if (takeInitialSnapshot && snapshotCb) {
            this.children.push(
            // Make sure we're at step 0 before taking the snapshot.
            new CheckOperation(config.timeout, 'loop', 0));
            if (config.postCheckSleep) {
                this.children.push(new DelayOperation(config.postCheckSleep));
            }
            this.children.push(new TakeHeapSnapshotOperation(config.timeout, snapshotCb));
        }
        for (let i = 0; i < iterations; i++) {
            this.children.push(new StepSeriesOperation(config, 'loop'), 
            // Make sure we're at step 0 before taking the snapshot.
            new CheckOperation(config.timeout, 'loop', 0));
            if (config.postCheckSleep) {
                this.children.push(new DelayOperation(config.postCheckSleep));
            }
            if (snapshotCb) {
                this.children.push(new TakeHeapSnapshotOperation(config.timeout, snapshotCb));
            }
        }
    }
    get description() { return 'Running through the program'; }
}
class FindLeaks extends CompositeOperation {
    constructor(config, _snapshotCb) {
        super();
        this._snapshotCb = _snapshotCb;
        this._growthTracker = new growth_graph_1.HeapGrowthTracker();
        this._heapSnapshotSizeStats = [];
        this.children.push(new ConfigureProxyOperation({
            log: null,
            rewrite: false,
            fixes: config.fixedLeaks,
            disableAllRewrites: false,
            fixRewriteFunction: config.rewrite,
            config: config.getBrowserInjection()
        }), new ProgramRunOperation(config, true, config.iterations, false, async (sn) => {
            this._snapshotCb(sn);
            await this._growthTracker.addSnapshot(sn);
            this._heapSnapshotSizeStats.push(this._growthTracker.getGraph().calculateSize());
        }));
    }
    get description() { return 'Locating leaks'; }
    skip(opSt) {
        return !!opSt.results;
    }
    async _run(opSt) {
        await super._run(opSt);
        opSt.results = new bleak_results_1.default(this._growthTracker.findLeakPaths(), undefined, undefined, this._heapSnapshotSizeStats);
    }
}
class GetGrowthStacksOperation extends Operation {
    constructor(timeout) {
        super(timeout);
    }
    get description() { return 'Retrieving stack traces'; }
    async _run(opSt) {
        const traces = await opSt.chromeDriver.runCode(`window.$$$GET_STACK_TRACES$$$()`);
        const growthStacks = stack_frame_converter_1.default.ConvertGrowthStacks(opSt.chromeDriver.mitmProxy, opSt.config.url, opSt.results, traces);
        opSt.results.leaks.forEach((lr) => {
            const index = lr.id;
            const stacks = growthStacks[index] || [];
            stacks.forEach((s) => {
                lr.addStackTrace(s);
            });
        });
    }
}
class DiagnoseLeaks extends CompositeOperation {
    constructor(config, isLoggedIn) {
        super();
        this.children.push(new ConfigureProxyOperation({
            log: null,
            rewrite: true,
            fixes: config.fixedLeaks,
            config: config.getBrowserInjection(),
            fixRewriteFunction: config.rewrite
        }), 
        // Warmup
        new ProgramRunOperation(config, !isLoggedIn, 1, false), new InstrumentGrowingPathsOperation(config.timeout), new StepSeriesOperation(config, 'loop'), new StepSeriesOperation(config, 'loop'), new GetGrowthStacksOperation(config.timeout));
    }
    get description() { return 'Diagnosing leaks'; }
    skip(opSt) {
        return opSt.results.leaks.length === 0;
    }
    async _run(opSt) {
        await super._run(opSt);
        opSt.results = opSt.results.compact();
    }
}
/**
 * A specific BLeak configuration used during ranking metric evaluation.
 * Since metrics may share specific configurations, this contains a boolean
 * indicating which metrics this configuration applies to.
 */
class RankingEvalConfig {
    constructor(fixIds) {
        this.fixIds = fixIds;
        this.leakShare = false;
        this.retainedSize = false;
        this.transitiveClosureSize = false;
    }
    metrics() {
        let rv = [];
        for (let metric of ['leakShare', 'retainedSize', 'transitiveClosureSize']) {
            if (this[metric]) {
                rv.push(metric);
            }
        }
        return rv.join(', ');
    }
}
/**
 * Given a set of leaks, return a unique key.
 * @param set
 */
function leakSetKey(set) {
    // Canonicalize order, then produce string.
    return set.sort(increasingSort).join(',');
}
function increasingSort(a, b) {
    return a - b;
}
class EvaluateRankingMetricProgramRunOperation extends CompositeOperation {
    constructor(config, _rankingEvalConfig, _runNumber, _flushResults, snapshotCb) {
        super();
        this._rankingEvalConfig = _rankingEvalConfig;
        this._runNumber = _runNumber;
        this._flushResults = _flushResults;
        this._buffer = [];
        const buffer = this._buffer;
        async function snapshotReport(sn) {
            const g = await growth_graph_1.HeapGraph.Construct(sn);
            const size = g.calculateSize();
            buffer.push(size);
        }
        this.children.push(new ConfigureProxyOperation({
            log: null,
            rewrite: false,
            fixes: _rankingEvalConfig.fixIds,
            disableAllRewrites: true,
            fixRewriteFunction: config.rewrite,
            config: config.getBrowserInjection()
        }), new ProgramRunOperation(config, false, config.rankingEvaluationIterations, true, (sn) => {
            snapshotCb(sn, this._rankingEvalConfig.metrics(), this._rankingEvalConfig.fixIds.length, this._runNumber);
            return snapshotReport(sn);
        }));
    }
    get description() { return 'Running program in a configuration...'; }
    skip(opSt) {
        const len = this._rankingEvalConfig.fixIds.length;
        for (let metric of ['leakShare', 'retainedSize', 'transitiveClosureSize']) {
            if (this._rankingEvalConfig[metric]) {
                const metricStats = opSt.results.rankingEvaluation[metric];
                if (!metricStats) {
                    return false;
                }
                const configStats = metricStats[len];
                if (!configStats) {
                    return false;
                }
                const runStats = configStats[this._runNumber];
                if (!runStats) {
                    return false;
                }
            }
        }
        return true;
    }
    async _run(opSt) {
        await super._run(opSt);
        // Update results w/ data from run.
        ['leakShare', 'retainedSize', 'transitiveClosureSize'].forEach((metric) => {
            if (!this._rankingEvalConfig[metric]) {
                return;
            }
            const metricResults = opSt.results.rankingEvaluation[metric];
            let configRuns = metricResults[this._rankingEvalConfig.fixIds.length];
            if (!configRuns) {
                configRuns = metricResults[this._rankingEvalConfig.fixIds.length] = [];
            }
            configRuns[this._runNumber] = this._buffer.slice(0);
        });
        this._flushResults(opSt.results);
    }
}
class EvaluateRankingMetricsOperation extends CompositeOperation {
    constructor(config, results, flushResults, snapshotCb) {
        super();
        function getSorter(rankBy) {
            return (a, b) => {
                return results.leaks[b].scores[rankBy] - results.leaks[a].scores[rankBy];
            };
        }
        function fixMapper(leakId) {
            const str = path_to_string_1.default(results.leaks[leakId].paths[0]);
            const fixId = config.fixMap[str];
            if (fixId === undefined || fixId === null) {
                throw new Error(`Unable to find fix ID for ${str}.`);
            }
            return fixId;
        }
        function removeDupes(unique, fixId) {
            if (unique.indexOf(fixId) === -1) {
                unique.push(fixId);
            }
            return unique;
        }
        // Figure out which runs are completed and in the results file,
        const configsToTest = new Map();
        const leaksById = results.leaks.map((l, i) => i);
        // Map from metric => list of fixes to apply, in-order.
        const orders = {
            'leakShare': leaksById.sort(getSorter('leakShare')).map(fixMapper).reduce(removeDupes, []),
            'retainedSize': leaksById.sort(getSorter('retainedSize')).map(fixMapper).reduce(removeDupes, []),
            'transitiveClosureSize': leaksById.sort(getSorter('transitiveClosureSize')).map(fixMapper).reduce(removeDupes, [])
        };
        for (let metric in orders) {
            if (orders.hasOwnProperty(metric)) {
                const metricCast = metric;
                const order = orders[metricCast];
                for (let i = 0; i <= order.length; i++) {
                    // Note: When i=0, this is the empty array -- the base case.
                    const configOrder = order.slice(0, i);
                    const key = leakSetKey(configOrder);
                    let config = configsToTest.get(key);
                    if (!config) {
                        config = new RankingEvalConfig(configOrder);
                        configsToTest.set(key, config);
                    }
                    config[metricCast] = true;
                }
            }
        }
        let configs = [];
        configsToTest.forEach((config) => {
            configs.push(config);
        });
        // Now we can make these run!
        if (config.login) {
            this.children.push(new ConfigureProxyOperation({
                log: null,
                rewrite: false,
                fixes: [],
                disableAllRewrites: true,
                fixRewriteFunction: config.rewrite,
                config: config.getBrowserInjection()
            }), new NavigateOperation(config.timeout, config.url), new StepSeriesOperation(config, 'login'), new DelayOperation(config.postLoginSleep));
        }
        for (const rankingConfig of configs) {
            for (let i = 0; i < config.rankingEvaluationRuns; i++) {
                this.children.push(new EvaluateRankingMetricProgramRunOperation(config, rankingConfig, i, flushResults, snapshotCb));
            }
        }
    }
    get description() { return 'Evaluating ranking metrics'; }
    skip(opSt) {
        if (!opSt.results.leaks || opSt.results.leaks.length < 2) {
            opSt.progressBar.log(`Unable to evaluate ranking metrics: BLeak results file does not contain more than 2 leak roots.`);
            return true;
        }
        return false;
    }
}
exports.EvaluateRankingMetricsOperation = EvaluateRankingMetricsOperation;
class FindAndDiagnoseLeaks extends CompositeOperation {
    constructor(config, snapshotCb) {
        super();
        this.children.push(new FindLeaks(config, snapshotCb), new DiagnoseLeaks(config, true));
    }
    get description() { return "Locating and diagnosing leaks"; }
}
exports.FindAndDiagnoseLeaks = FindAndDiagnoseLeaks;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmxlYWtfb3BlcmF0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9saWIvYmxlYWtfb3BlcmF0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUdBLHlDQUFvQztBQUVwQyxtRUFBcUY7QUFDckYsbURBQTJDO0FBQzNDLGlEQUF3RTtBQUN4RSxtRUFBMEQ7QUFDMUQscURBQTRDO0FBSTVDO0lBRUUsWUFDUyxZQUEwQixFQUMxQixXQUF5QixFQUN6QixNQUFtQjtRQUZuQixpQkFBWSxHQUFaLFlBQVksQ0FBYztRQUMxQixnQkFBVyxHQUFYLFdBQVcsQ0FBYztRQUN6QixXQUFNLEdBQU4sTUFBTSxDQUFhO1FBSnJCLFlBQU8sR0FBaUIsSUFBSSxDQUFDO0lBSUwsQ0FBQztDQUNqQztBQU5ELHdDQU1DO0FBRUQsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFFOUI7SUFDRSxZQUE2QixXQUFtQixLQUFLO1FBQXhCLGFBQVEsR0FBUixRQUFRLENBQWdCO0lBQUcsQ0FBQztJQUd6RCxxRUFBcUU7SUFDckUseUNBQXlDO0lBQ2xDLElBQUksS0FBYSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNuQyxtRUFBbUU7SUFDbkUsMkJBQTJCO0lBQ3BCLElBQUksQ0FBQyxJQUFvQixJQUFhLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBQzVELG1FQUFtRTtJQUM1RCxLQUFLLENBQUMsR0FBRyxDQUFDLElBQW9CO1FBQ25DLElBQUksQ0FBQyxXQUFXLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ3JELEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3BCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZ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SUFBSSxDQUFDO1FBQ2QsQ0FBQztRQUNELE1BQU0sQ0FBQyxLQUFLLENBQUM7SUFDZixDQUFDO0NBQ0Y7QUF0RkQsMEVBc0ZDO0FBRUQsMEJBQWtDLFNBQVEsa0JBQWtCO0lBQzFELFlBQVksTUFBbUIsRUFBRSxVQUFzQjtRQUNyRCxLQUFLLEVBQUUsQ0FBQztRQUNSLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUNoQixJQUFJLFNBQVMsQ0FBQyxNQUFNLEVBQUUsVUFBVSxDQUFDLEVBQ2pDLElBQUksYUFBYSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FDaEMsQ0FBQztJQUNKLENBQUM7SUFDRCxJQUFXLFdBQVcsS0FBSyxNQUFNLENBQUMsK0JBQStCLENBQUMsQ0FBQyxDQUFDO0NBQ3JFO0FBVEQsb0RBU0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgQ2hyb21lRHJpdmVyIGZyb20gJy4vY2hyb21lX2RyaXZlcic7XG5pbXBvcnQge1N0ZXBUeXBlLCBTbmFwc2hvdFNpemVTdW1tYXJ5LCBJUHJvZ3Jlc3NCYXJ9IGZyb20gJy4uL2NvbW1vbi9pbnRlcmZhY2VzJztcbmltcG9ydCBCTGVha0NvbmZpZyBmcm9tICcuL2JsZWFrX2NvbmZpZyc7XG5pbXBvcnQge3dhaXR9IGZyb20gJy4uL2NvbW1vbi91dGlsJztcbmltcG9ydCBIZWFwU25hcHNob3RQYXJzZXIgZnJvbSAnLi9oZWFwX3NuYXBzaG90X3BhcnNlcic7XG5pbXBvcnQge0ludGVyY2VwdG9yQ29uZmlnLCBkZWZhdWx0IGFzIGdldEludGVyY2VwdG9yfSBmcm9tICcuL21pdG1wcm94eV9pbnRlcmNlcHRvcic7XG5pbXBvcnQgQkxlYWtSZXN1bHRzIGZyb20gJy4vYmxlYWtfcmVzdWx0cyc7XG5pbXBvcnQge0hlYXBHcm93dGhUcmFja2VyLCBIZWFwR3JhcGgsIHRvUGF0aFRyZWV9IGZyb20gJy4vZ3Jvd3RoX2dyYXBoJztcbmltcG9ydCBTdGFja0ZyYW1lQ29udmVydGVyIGZyb20gJy4vc3RhY2tfZnJhbWVfY29udmVydGVyJztcbmltcG9ydCBQYXRoVG9TdHJpbmcgZnJvbSAnLi9wYXRoX3RvX3N0cmluZyc7XG5cbnR5cGUgU25hcHNob3RDYiA9IChzbjogSGVhcFNuYXBzaG90UGFyc2VyKSA9PiBQcm9taXNlPHZvaWQ+O1xuXG5leHBvcnQgY2xhc3MgT3BlcmF0aW9uU3RhdGUge1xuICBwdWJsaWMgcmVzdWx0czogQkxlYWtSZXN1bHRzID0gbnVsbDtcbiAgY29uc3RydWN0b3IoXG4gICAgcHVibGljIGNocm9tZURyaXZlcjogQ2hyb21lRHJpdmVyLFxuICAgIHB1YmxpYyBwcm9ncmVzc0JhcjogSVByb2dyZXNzQmFyLFxuICAgIHB1YmxpYyBjb25maWc6IEJMZWFrQ29uZmlnKSB7fVxufVxuXG5jb25zdCBORVZFUiA9IE1hdGgucG93KDIsIDMwKTtcblxuYWJzdHJhY3QgY2xhc3MgT3BlcmF0aW9uIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBfdGltZW91dDogbnVtYmVyID0gTkVWRVIpIHt9XG4gIC8vIERlc2NyaXB0aW9uIG9mIHRoZSB0YXNrIHRoYXQgdGhlIG9wZXJhdGlvbiBpcyBwZXJmb3JtaW5nLlxuICBwdWJsaWMgYWJzdHJhY3QgZGVzY3JpcHRpb246IHN0cmluZztcbiAgLy8gUmV0dXJucyB0aGUgc2l6ZSBvZiB0aGUgb3BlcmF0aW9ucyBncmFwaCBiZWdpbm5pbmcgd2l0aCB0aGlzIG5vZGUuXG4gIC8vIERlZmF1bHQgaXMgMSAobm8gZGVwZW5kZW50IG9wZXJhdGlvbnMpXG4gIHB1YmxpYyBzaXplKCk6IG51bWJlciB7IHJldHVybiAxOyB9XG4gIC8vIFJldHVybnMgJ3RydWUnIGlmIHRoZSBvcGVyYXRpb24gaXMgZnVsZmlsbGVkIGFuZCBjYW4gYmUgc2tpcHBlZC5cbiAgLy8gRGVmYXVsdHMgdG8gdW5za2lwcGFibGUuXG4gIHB1YmxpYyBza2lwKG9wU3Q6IE9wZXJhdGlvblN0YXRlKTogYm9vbGVhbiB7IHJldHVybiBmYWxzZTsgfVxuICAvLyBSdW5zIHRoZSBvcGVyYXRpb24uIFByb21pc2UgaXMgcmVzb2x2ZWQvcmVqZWN0ZWQgd2hlbiBjb21wbGV0ZWQuXG4gIHB1YmxpYyBhc3luYyBydW4ob3BTdDogT3BlcmF0aW9uU3RhdGUpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBvcFN0LnByb2dyZXNzQmFyLnVwZGF0ZURlc2NyaXB0aW9uKHRoaXMuZGVzY3JpcHRpb24pO1xuICAgIGlmICh0aGlzLnNraXAob3BTdCkpIHtcbiAgICAgIGNvbnN0IHNpemUgPSB0aGlzLnNpemUoKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2l6ZTsgaSsrKSB7XG4gICAgICAgIG9wU3QucHJvZ3Jlc3NCYXIubmV4dE9wZXJhdGlvbigpO1xuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAodGhpcy5fdGltZW91dCA9PT0gTkVWRVIpIHtcbiAgICAgIGF3YWl0IHRoaXMuX3J1bihvcFN0KTtcbiAgICAgIG9wU3QucHJvZ3Jlc3NCYXIubmV4dE9wZXJhdGlvbigpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgY29uc3QgdGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgY29uc3QgZSA9IG5ldyBFcnJvcihgT3BlcmF0aW9uIHRpbWVkIG91dC5gKTtcbiAgICAgICAgdGhpcy5jYW5jZWwoZSk7XG4gICAgICAgIHJlamVjdChlKTtcbiAgICAgIH0sIHRoaXMuX3RpbWVvdXQpO1xuICAgICAgdGhpcy5fcnVuKG9wU3QpLnRoZW4oKCkgPT4ge1xuICAgICAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgICAgICBvcFN0LnByb2dyZXNzQmFyLm5leHRPcGVyYXRpb24oKTtcbiAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgfSkuY2F0Y2goKGUpID0+IHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICAgICAgcmVqZWN0KGUpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgLy8gQ2FsbGVkIHdoZW4gYSBydW5uaW5nIG9wZXJhdGlvbiBpcyBjYW5jZWxlZC4gT3BlcmF0aW9uIHNob3VsZCBleGl0IGdyYWNlZnVsbHkuXG4gIHB1YmxpYyBjYW5jZWwoZTogRXJyb3IpIHt9XG5cbiAgLy8gSW50ZXJuYWwgZnVuY3Rpb24gdGhhdCByZWFsbHkgcnVucyB0aGUgb3BlcmF0aW9uLlxuICBwcm90ZWN0ZWQgYWJzdHJhY3QgX3J1bihvcFN0OiBPcGVyYXRpb25TdGF0ZSk6IFByb21pc2U8dm9pZD47XG59XG5cbmNsYXNzIE5hdmlnYXRlT3BlcmF0aW9uIGV4dGVuZHMgT3BlcmF0aW9uIHtcbiAgY29uc3RydWN0b3IodGltZW91dDogbnVtYmVyLFxuICAgICAgcHJpdmF0ZSByZWFkb25seSBfdXJsOiBzdHJpbmcpIHtcbiAgICBzdXBlcih0aW1lb3V0KTtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgZGVzY3JpcHRpb24oKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYE5hdmlnYXRpbmcgdG8gJHt0aGlzLl91cmx9YDtcbiAgfVxuXG4gIHByb3RlY3RlZCBfcnVuKG9wU3Q6IE9wZXJhdGlvblN0YXRlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIG9wU3QuY2hyb21lRHJpdmVyLm5hdmlnYXRlVG8odGhpcy5fdXJsKTtcbiAgfVxufVxuXG5jbGFzcyBDaGVja09wZXJhdGlvbiBleHRlbmRzIE9wZXJhdGlvbiB7XG4gIHByaXZhdGUgX2NhbmNlbGxlZCA9IGZhbHNlO1xuICBjb25zdHJ1Y3Rvcih0aW1lb3V0OiBudW1iZXIsXG4gICAgICBwcml2YXRlIHJlYWRvbmx5IF9zdGVwVHlwZTogU3RlcFR5cGUsXG4gICAgICBwcml2YXRlIHJlYWRvbmx5IF9pZDogbnVtYmVyKSB7XG4gICAgc3VwZXIodGltZW91dCk7XG4gIH1cblxuICBwdWJsaWMgZ2V0IGRlc2NyaXB0aW9uKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGBXYWl0aW5nIGZvciAke3RoaXMuX3N0ZXBUeXBlfVske3RoaXMuX2lkfV0uY2hlY2soKSA9PT0gdHJ1ZWA7XG4gIH1cblxuICBwdWJsaWMgY2FuY2VsKGU6IEVycm9yKSB7XG4gICAgdGhpcy5fY2FuY2VsbGVkID0gdHJ1ZTtcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBfcnVuKG9wU3Q6IE9wZXJhdGlvblN0YXRlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgLy8gV2FpdCB1bnRpbCBlaXRoZXIgdGhlIG9wZXJhdGlvbiBpcyBjYW5jZWxlZCAodGltZW91dCkgb3IgdGhlIGNoZWNrIHN1Y2NlZWRzLlxuICAgIHdoaWxlICghdGhpcy5fY2FuY2VsbGVkKSB7XG4gICAgICBjb25zdCBzdWNjZXNzID0gYXdhaXQgb3BTdC5jaHJvbWVEcml2ZXIucnVuQ29kZTxib29sZWFuPihgdHlwZW9mKEJMZWFrQ29uZmlnKSAhPT0gXCJ1bmRlZmluZWRcIiAmJiBCTGVha0NvbmZpZy4ke3RoaXMuX3N0ZXBUeXBlfVske3RoaXMuX2lkfV0uY2hlY2soKWApO1xuICAgICAgaWYgKHN1Y2Nlc3MpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgYXdhaXQgd2FpdCgxMDApO1xuICAgIH1cbiAgfVxufVxuXG5jbGFzcyBOZXh0T3BlcmF0aW9uIGV4dGVuZHMgT3BlcmF0aW9uIHtcbiAgY29uc3RydWN0b3IodGltZW91dDogbnVtYmVyLFxuICAgICAgcHJpdmF0ZSByZWFkb25seSBfc3RlcFR5cGU6IFN0ZXBUeXBlLFxuICAgICAgcHJpdmF0ZSByZWFkb25seSBfaWQ6IG51bWJlcikge1xuICAgIHN1cGVyKHRpbWVvdXQpO1xuICB9XG5cbiAgcHVibGljIGdldCBkZXNjcmlwdGlvbigpOiBzdHJpbmcge1xuICAgIHJldHVybiBgQWR2YW5jaW5nIHRvIG5leHQgc3RhdGUgJHt0aGlzLl9zdGVwVHlwZX1bJHt0aGlzLl9pZH1dLm5leHQoKWA7XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgX3J1bihvcFN0OiBPcGVyYXRpb25TdGF0ZSk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiBvcFN0LmNocm9tZURyaXZlci5ydW5Db2RlPHZvaWQ+KGBCTGVha0NvbmZpZy4ke3RoaXMuX3N0ZXBUeXBlfVske3RoaXMuX2lkfV0ubmV4dCgpYCk7XG4gIH1cbn1cblxuY2xhc3MgRGVsYXlPcGVyYXRpb24gZXh0ZW5kcyBPcGVyYXRpb24ge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IF9kZWxheTogbnVtYmVyKSB7XG4gICAgc3VwZXIoKTtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgZGVzY3JpcHRpb24oKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYFdhaXRpbmcgJHt0aGlzLl9kZWxheX0gbXMgYmVmb3JlIHByb2NlZWRpbmdgO1xuICB9XG5cbiAgcHVibGljIF9ydW4oKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIHdhaXQodGhpcy5fZGVsYXkpO1xuICB9XG59XG5cbmNsYXNzIFRha2VIZWFwU25hcHNob3RPcGVyYXRpb24gZXh0ZW5kcyBPcGVyYXRpb24ge1xuICBjb25zdHJ1Y3Rvcih0aW1lb3V0OiBudW1iZXIsIHByaXZhdGUgX3NuYXBzaG90Q2I6IFNuYXBzaG90Q2IpIHtcbiAgICBzdXBlcih0aW1lb3V0KTtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgZGVzY3JpcHRpb24oKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYFRha2luZyBhIGhlYXAgc25hcHNob3RgO1xuICB9XG5cbiAgcHVibGljIGFzeW5jIF9ydW4ob3BTdDogT3BlcmF0aW9uU3RhdGUpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBzbiA9IG9wU3QuY2hyb21lRHJpdmVyLnRha2VIZWFwU25hcHNob3QoKTtcbiAgICByZXR1cm4gdGhpcy5fc25hcHNob3RDYihzbik7XG4gIH1cbn1cblxuY2xhc3MgQ29uZmlndXJlUHJveHlPcGVyYXRpb24gZXh0ZW5kcyBPcGVyYXRpb24ge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9jb25maWc6IEludGVyY2VwdG9yQ29uZmlnKSB7XG4gICAgc3VwZXIoKTtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgZGVzY3JpcHRpb24oKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYENvbmZpZ3VyaW5nIHRoZSBwcm94eWA7XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgX3J1bihvcFN0OiBPcGVyYXRpb25TdGF0ZSk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMuX2NvbmZpZy5sb2cgPSBvcFN0LnByb2dyZXNzQmFyO1xuICAgIG9wU3QuY2hyb21lRHJpdmVyLm1pdG1Qcm94eS5jYiA9IGdldEludGVyY2VwdG9yKHRoaXMuX2NvbmZpZyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gY291bnRPcGVyYXRpb25zKHN1bVNvRmFyOiBudW1iZXIsIG5leHQ6IE9wZXJhdGlvbik6IG51bWJlciB7XG4gIHJldHVybiBzdW1Tb0ZhciArIG5leHQuc2l6ZSgpO1xufVxuXG5hYnN0cmFjdCBjbGFzcyBDb21wb3NpdGVPcGVyYXRpb24gZXh0ZW5kcyBPcGVyYXRpb24ge1xuICBwcm90ZWN0ZWQgY2hpbGRyZW46IE9wZXJhdGlvbltdID0gW107XG4gIHByaXZhdGUgX2NhbmNlbGVkRXJyb3I6IEVycm9yID0gbnVsbDtcbiAgcHVibGljIHNpemUoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5jaGlsZHJlbi5yZWR1Y2UoY291bnRPcGVyYXRpb25zLCAxKTtcbiAgfVxuXG4gIHB1YmxpYyBjYW5jZWwoZTogRXJyb3IpOiB2b2lkIHtcbiAgICB0aGlzLl9jYW5jZWxlZEVycm9yID0gZTtcbiAgfVxuXG4gIHByb3RlY3RlZCBhc3luYyBfcnVuKG9wU3Q6IE9wZXJhdGlvblN0YXRlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgbGV0IHByb21pc2UgPSBQcm9taXNlLnJlc29sdmUoKTtcbiAgICBsZXQgaSA9IDA7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXM7XG4gICAgZnVuY3Rpb24gcnVuTmV4dCgpOiBQcm9taXNlPHZvaWQ+IHwgdm9pZCB7XG4gICAgICBpZiAoc2VsZi5fY2FuY2VsZWRFcnJvcikge1xuICAgICAgICB0aHJvdyBzZWxmLl9jYW5jZWxlZEVycm9yO1xuICAgICAgfVxuICAgICAgaWYgKGkgPCBzZWxmLmNoaWxkcmVuLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gc2VsZi5jaGlsZHJlbltpKytdLnJ1bihvcFN0KTtcbiAgICAgIH1cbiAgICB9XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICBwcm9taXNlID0gcHJvbWlzZS50aGVuKHJ1bk5leHQpO1xuICAgIH1cbiAgICByZXR1cm4gcHJvbWlzZTtcbiAgfVxufVxuXG5jbGFzcyBTdGVwT3BlcmF0aW9uIGV4dGVuZHMgQ29tcG9zaXRlT3BlcmF0aW9uIHtcbiAgY29uc3RydWN0b3IoY29uZmlnOiBCTGVha0NvbmZpZywgc3RlcFR5cGU6IFN0ZXBUeXBlLCBpZDogbnVtYmVyKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmNoaWxkcmVuLnB1c2gobmV3IENoZWNrT3BlcmF0aW9uKGNvbmZpZy50aW1lb3V0LCBzdGVwVHlwZSwgaWQpKTtcbiAgICBpZiAoY29uZmlnLnBvc3RDaGVja1NsZWVwKSB7XG4gICAgICB0aGlzLmNoaWxkcmVuLnB1c2gobmV3IERlbGF5T3BlcmF0aW9uKGNvbmZpZy5wb3N0Q2hlY2tTbGVlcCkpO1xuICAgIH1cbiAgICB0aGlzLmNoaWxkcmVuLnB1c2gobmV3IE5leHRPcGVyYXRpb24oY29uZmlnLnRpbWVvdXQsIHN0ZXBUeXBlLCBpZCkpO1xuICAgIGlmIChjb25maWcucG9zdE5leHRTbGVlcCkge1xuICAgICAgdGhpcy5jaGlsZHJlbi5wdXNoKG5ldyBEZWxheU9wZXJhdGlvbihjb25maWcucG9zdE5leHRTbGVlcCkpO1xuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBnZXQgZGVzY3JpcHRpb24oKSB7IHJldHVybiAnJzsgfVxufVxuXG5jbGFzcyBJbnN0cnVtZW50R3Jvd2luZ1BhdGhzT3BlcmF0aW9uIGV4dGVuZHMgT3BlcmF0aW9uIHtcbiAgcHVibGljIGdldCBkZXNjcmlwdGlvbigpIHtcbiAgICByZXR1cm4gYEluc3RydW1lbnRpbmcgZ3Jvd2luZyBvYmplY3RzYDtcbiAgfVxuXG4gIHB1YmxpYyBfcnVuKG9wU3Q6IE9wZXJhdGlvblN0YXRlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIG9wU3QuY2hyb21lRHJpdmVyLnJ1bkNvZGU8dm9pZD4oYHdpbmRvdy4kJCRJTlNUUlVNRU5UX1BBVEhTJCQkKCR7SlNPTi5zdHJpbmdpZnkodG9QYXRoVHJlZShvcFN0LnJlc3VsdHMubGVha3MpKX0pYCk7XG4gIH1cbn1cblxuY2xhc3MgU3RlcFNlcmllc09wZXJhdGlvbiBleHRlbmRzIENvbXBvc2l0ZU9wZXJhdGlvbiB7XG4gIGNvbnN0cnVjdG9yKGNvbmZpZzogQkxlYWtDb25maWcsIHN0ZXBUeXBlOiBTdGVwVHlwZSkge1xuICAgIHN1cGVyKCk7XG4gICAgY29uc3Qgc3RlcHMgPSBjb25maWdbc3RlcFR5cGVdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc3RlcHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRoaXMuY2hpbGRyZW4ucHVzaChcbiAgICAgICAgbmV3IFN0ZXBPcGVyYXRpb24oY29uZmlnLCBzdGVwVHlwZSwgaSkpO1xuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBnZXQgZGVzY3JpcHRpb24oKTogc3RyaW5nIHsgcmV0dXJuICcnOyB9XG59XG5cbmNsYXNzIFByb2dyYW1SdW5PcGVyYXRpb24gZXh0ZW5kcyBDb21wb3NpdGVPcGVyYXRpb24ge1xuICBjb25zdHJ1Y3Rvcihjb25maWc6IEJMZWFrQ29uZmlnLCBydW5Mb2dpbjogYm9vbGVhbiwgaXRlcmF0aW9uczogbnVtYmVyLCB0YWtlSW5pdGlhbFNuYXBzaG90OiBib29sZWFuLCBzbmFwc2hvdENiPzogU25hcHNob3RDYikge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5jaGlsZHJlbi5wdXNoKG5ldyBOYXZpZ2F0ZU9wZXJhdGlvbihjb25maWcudGltZW91dCwgY29uZmlnLnVybCkpO1xuICAgIGlmIChydW5Mb2dpbiAmJiBjb25maWcubG9naW4ubGVuZ3RoID4gMCkge1xuICAgICAgdGhpcy5jaGlsZHJlbi5wdXNoKFxuICAgICAgICBuZXcgU3RlcFNlcmllc09wZXJhdGlvbihjb25maWcsICdsb2dpbicpLFxuICAgICAgICBuZXcgRGVsYXlPcGVyYXRpb24oY29uZmlnLnBvc3RMb2dpblNsZWVwKSxcbiAgICAgICAgbmV3IE5hdmlnYXRlT3BlcmF0aW9uKGNvbmZpZy50aW1lb3V0LCBjb25maWcudXJsKVxuICAgICAgKTtcbiAgICB9XG4gICAgaWYgKGNvbmZpZy5zZXR1cC5sZW5ndGggPiAwKSB7XG4gICAgICB0aGlzLmNoaWxkcmVuLnB1c2goXG4gICAgICAgIG5ldyBTdGVwU2VyaWVzT3BlcmF0aW9uKGNvbmZpZywgJ3NldHVwJylcbiAgICAgICk7XG4gICAgfVxuICAgIGlmICh0YWtlSW5pdGlhbFNuYXBzaG90ICYmIHNuYXBzaG90Q2IpIHtcbiAgICAgIHRoaXMuY2hpbGRyZW4ucHVzaChcbiAgICAgICAgLy8gTWFrZSBzdXJlIHdlJ3JlIGF0IHN0ZXAgMCBiZWZvcmUgdGFraW5nIHRoZSBzbmFwc2hvdC5cbiAgICAgICAgbmV3IENoZWNrT3BlcmF0aW9uKGNvbmZpZy50aW1lb3V0LCAnbG9vcCcsIDApKTtcbiAgICAgIGlmIChjb25maWcucG9zdENoZWNrU2xlZXApIHtcbiAgICAgICAgdGhpcy5jaGlsZHJlbi5wdXNoKG5ldyBEZWxheU9wZXJhdGlvbihjb25maWcucG9zdENoZWNrU2xlZXApKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuY2hpbGRyZW4ucHVzaChuZXcgVGFrZUhlYXBTbmFwc2hvdE9wZXJhdGlvbihjb25maWcudGltZW91dCwgc25hcHNob3RDYikpO1xuICAgIH1cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGl0ZXJhdGlvbnM7IGkrKykge1xuICAgICAgdGhpcy5jaGlsZHJlbi5wdXNoKFxuICAgICAgICBuZXcgU3RlcFNlcmllc09wZXJhdGlvbihjb25maWcsICdsb29wJyksXG4gICAgICAgIC8vIE1ha2Ugc3VyZSB3ZSdyZSBhdCBzdGVwIDAgYmVmb3JlIHRha2luZyB0aGUgc25hcHNob3QuXG4gICAgICAgIG5ldyBDaGVja09wZXJhdGlvbihjb25maWcudGltZW91dCwgJ2xvb3AnLCAwKVxuICAgICAgKTtcbiAgICAgIGlmIChjb25maWcucG9zdENoZWNrU2xlZXApIHtcbiAgICAgICAgdGhpcy5jaGlsZHJlbi5wdXNoKG5ldyBEZWxheU9wZXJhdGlvbihjb25maWcucG9zdENoZWNrU2xlZXApKTtcbiAgICAgIH1cbiAgICAgIGlmIChzbmFwc2hvdENiKSB7XG4gICAgICAgIHRoaXMuY2hpbGRyZW4ucHVzaChcbiAgICAgICAgICBuZXcgVGFrZUhlYXBTbmFwc2hvdE9wZXJhdGlvbihjb25maWcudGltZW91dCwgc25hcHNob3RDYilcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwdWJsaWMgZ2V0IGRlc2NyaXB0aW9uKCkgeyByZXR1cm4gJ1J1bm5pbmcgdGhyb3VnaCB0aGUgcHJvZ3JhbSc7IH1cbn1cblxuY2xhc3MgRmluZExlYWtzIGV4dGVuZHMgQ29tcG9zaXRlT3BlcmF0aW9uIHtcbiAgcHJpdmF0ZSByZWFkb25seSBfZ3Jvd3RoVHJhY2tlciA9IG5ldyBIZWFwR3Jvd3RoVHJhY2tlcigpO1xuICBwcml2YXRlIF9oZWFwU25hcHNob3RTaXplU3RhdHM6IFNuYXBzaG90U2l6ZVN1bW1hcnlbXSA9IFtdO1xuICBjb25zdHJ1Y3Rvcihjb25maWc6IEJMZWFrQ29uZmlnLCBwcml2YXRlIF9zbmFwc2hvdENiOiBTbmFwc2hvdENiKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmNoaWxkcmVuLnB1c2goXG4gICAgICBuZXcgQ29uZmlndXJlUHJveHlPcGVyYXRpb24oe1xuICAgICAgICBsb2c6IG51bGwsXG4gICAgICAgIHJld3JpdGU6IGZhbHNlLFxuICAgICAgICBmaXhlczogY29uZmlnLmZpeGVkTGVha3MsXG4gICAgICAgIGRpc2FibGVBbGxSZXdyaXRlczogZmFsc2UsXG4gICAgICAgIGZpeFJld3JpdGVGdW5jdGlvbjogY29uZmlnLnJld3JpdGUsXG4gICAgICAgIGNvbmZpZzogY29uZmlnLmdldEJyb3dzZXJJbmplY3Rpb24oKVxuICAgICAgfSksXG4gICAgICBuZXcgUHJvZ3JhbVJ1bk9wZXJhdGlvbihjb25maWcsIHRydWUsIGNvbmZpZy5pdGVyYXRpb25zLCBmYWxzZSwgYXN5bmMgKHNuOiBIZWFwU25hcHNob3RQYXJzZXIpID0+IHtcbiAgICAgICAgdGhpcy5fc25hcHNob3RDYihzbik7XG4gICAgICAgIGF3YWl0IHRoaXMuX2dyb3d0aFRyYWNrZXIuYWRkU25hcHNob3Qoc24pO1xuICAgICAgICB0aGlzLl9oZWFwU25hcHNob3RTaXplU3RhdHMucHVzaCh0aGlzLl9ncm93dGhUcmFja2VyLmdldEdyYXBoKCkuY2FsY3VsYXRlU2l6ZSgpKTtcbiAgICAgIH0pXG4gICAgKTtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgZGVzY3JpcHRpb24oKSB7IHJldHVybiAnTG9jYXRpbmcgbGVha3MnOyB9XG5cbiAgcHVibGljIHNraXAob3BTdDogT3BlcmF0aW9uU3RhdGUpOiBib29sZWFuIHtcbiAgICByZXR1cm4gISFvcFN0LnJlc3VsdHM7XG4gIH1cblxuICBwcm90ZWN0ZWQgYXN5bmMgX3J1bihvcFN0OiBPcGVyYXRpb25TdGF0ZSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHN1cGVyLl9ydW4ob3BTdCk7XG4gICAgb3BTdC5yZXN1bHRzID0gbmV3IEJMZWFrUmVzdWx0cyh0aGlzLl9ncm93dGhUcmFja2VyLmZpbmRMZWFrUGF0aHMoKSwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHRoaXMuX2hlYXBTbmFwc2hvdFNpemVTdGF0cyk7XG4gIH1cbn1cblxuY2xhc3MgR2V0R3Jvd3RoU3RhY2tzT3BlcmF0aW9uIGV4dGVuZHMgT3BlcmF0aW9uIHtcbiAgY29uc3RydWN0b3IodGltZW91dDogbnVtYmVyKSB7XG4gICAgc3VwZXIodGltZW91dCk7XG4gIH1cblxuICBwdWJsaWMgZ2V0IGRlc2NyaXB0aW9uKCkgeyByZXR1cm4gJ1JldHJpZXZpbmcgc3RhY2sgdHJhY2VzJzsgfVxuXG4gIHByb3RlY3RlZCBhc3luYyBfcnVuKG9wU3Q6IE9wZXJhdGlvblN0YXRlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgdHJhY2VzID0gYXdhaXQgb3BTdC5jaHJvbWVEcml2ZXIucnVuQ29kZTxHcm93aW5nU3RhY2tUcmFjZXM+KGB3aW5kb3cuJCQkR0VUX1NUQUNLX1RSQUNFUyQkJCgpYCk7XG4gICAgY29uc3QgZ3Jvd3RoU3RhY2tzID0gU3RhY2tGcmFtZUNvbnZlcnRlci5Db252ZXJ0R3Jvd3RoU3RhY2tzKG9wU3QuY2hyb21lRHJpdmVyLm1pdG1Qcm94eSwgb3BTdC5jb25maWcudXJsLCBvcFN0LnJlc3VsdHMsIHRyYWNlcyk7XG4gICAgb3BTdC5yZXN1bHRzLmxlYWtzLmZvckVhY2goKGxyKSA9PiB7XG4gICAgICBjb25zdCBpbmRleCA9IGxyLmlkO1xuICAgICAgY29uc3Qgc3RhY2tzID0gZ3Jvd3RoU3RhY2tzW2luZGV4XSB8fCBbXTtcbiAgICAgIHN0YWNrcy5mb3JFYWNoKChzKSA9PiB7XG4gICAgICAgIGxyLmFkZFN0YWNrVHJhY2Uocyk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxufVxuXG5jbGFzcyBEaWFnbm9zZUxlYWtzIGV4dGVuZHMgQ29tcG9zaXRlT3BlcmF0aW9uIHtcbiAgY29uc3RydWN0b3IoY29uZmlnOiBCTGVha0NvbmZpZywgaXNMb2dnZWRJbjogYm9vbGVhbikge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5jaGlsZHJlbi5wdXNoKFxuICAgICAgbmV3IENvbmZpZ3VyZVByb3h5T3BlcmF0aW9uKHtcbiAgICAgICAgbG9nOiBudWxsLFxuICAgICAgICByZXdyaXRlOiB0cnVlLFxuICAgICAgICBmaXhlczogY29uZmlnLmZpeGVkTGVha3MsXG4gICAgICAgIGNvbmZpZzogY29uZmlnLmdldEJyb3dzZXJJbmplY3Rpb24oKSxcbiAgICAgICAgZml4UmV3cml0ZUZ1bmN0aW9uOiBjb25maWcucmV3cml0ZVxuICAgICAgfSksXG4gICAgICAvLyBXYXJtdXBcbiAgICAgIG5ldyBQcm9ncmFtUnVuT3BlcmF0aW9uKGNvbmZpZywgIWlzTG9nZ2VkSW4sIDEsIGZhbHNlKSxcbiAgICAgIG5ldyBJbnN0cnVtZW50R3Jvd2luZ1BhdGhzT3BlcmF0aW9uKGNvbmZpZy50aW1lb3V0KSxcbiAgICAgIG5ldyBTdGVwU2VyaWVzT3BlcmF0aW9uKGNvbmZpZywgJ2xvb3AnKSxcbiAgICAgIG5ldyBTdGVwU2VyaWVzT3BlcmF0aW9uKGNvbmZpZywgJ2xvb3AnKSxcbiAgICAgIG5ldyBHZXRHcm93dGhTdGFja3NPcGVyYXRpb24oY29uZmlnLnRpbWVvdXQpXG4gICAgKTtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgZGVzY3JpcHRpb24oKSB7IHJldHVybiAnRGlhZ25vc2luZyBsZWFrcyc7IH1cblxuICBwdWJsaWMgc2tpcChvcFN0OiBPcGVyYXRpb25TdGF0ZSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBvcFN0LnJlc3VsdHMubGVha3MubGVuZ3RoID09PSAwO1xuICB9XG5cbiAgcHJvdGVjdGVkIGFzeW5jIF9ydW4ob3BTdDogT3BlcmF0aW9uU3RhdGUpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCBzdXBlci5fcnVuKG9wU3QpO1xuICAgIG9wU3QucmVzdWx0cyA9IG9wU3QucmVzdWx0cy5jb21wYWN0KCk7XG4gIH1cbn1cblxuLyoqXG4gKiBBIHNwZWNpZmljIEJMZWFrIGNvbmZpZ3VyYXRpb24gdXNlZCBkdXJpbmcgcmFua2luZyBtZXRyaWMgZXZhbHVhdGlvbi5cbiAqIFNpbmNlIG1ldHJpY3MgbWF5IHNoYXJlIHNwZWNpZmljIGNvbmZpZ3VyYXRpb25zLCB0aGlzIGNvbnRhaW5zIGEgYm9vbGVhblxuICogaW5kaWNhdGluZyB3aGljaCBtZXRyaWNzIHRoaXMgY29uZmlndXJhdGlvbiBhcHBsaWVzIHRvLlxuICovXG5jbGFzcyBSYW5raW5nRXZhbENvbmZpZyB7XG4gIHB1YmxpYyBsZWFrU2hhcmU6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHVibGljIHJldGFpbmVkU2l6ZTogYm9vbGVhbiA9IGZhbHNlO1xuICBwdWJsaWMgdHJhbnNpdGl2ZUNsb3N1cmVTaXplOiBib29sZWFuID0gZmFsc2U7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyByZWFkb25seSBmaXhJZHM6IG51bWJlcltdKSB7fVxuICBwdWJsaWMgbWV0cmljcygpOiBzdHJpbmcge1xuICAgIGxldCBydjogc3RyaW5nW10gPSBbXTtcbiAgICBmb3IgKGxldCBtZXRyaWMgb2YgWydsZWFrU2hhcmUnLCAncmV0YWluZWRTaXplJywgJ3RyYW5zaXRpdmVDbG9zdXJlU2l6ZSddKSB7XG4gICAgICBpZiAodGhpc1ttZXRyaWMgYXMgJ2xlYWtTaGFyZSddKSB7XG4gICAgICAgIHJ2LnB1c2gobWV0cmljKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJ2LmpvaW4oJywgJyk7XG4gIH1cbn1cblxuLyoqXG4gKiBHaXZlbiBhIHNldCBvZiBsZWFrcywgcmV0dXJuIGEgdW5pcXVlIGtleS5cbiAqIEBwYXJhbSBzZXRcbiAqL1xuZnVuY3Rpb24gbGVha1NldEtleShzZXQ6IG51bWJlcltdKTogc3RyaW5nIHtcbiAgLy8gQ2Fub25pY2FsaXplIG9yZGVyLCB0aGVuIHByb2R1Y2Ugc3RyaW5nLlxuICByZXR1cm4gc2V0LnNvcnQoaW5jcmVhc2luZ1NvcnQpLmpvaW4oJywnKTtcbn1cblxuZnVuY3Rpb24gaW5jcmVhc2luZ1NvcnQoYTogbnVtYmVyLCBiOiBudW1iZXIpOiBudW1iZXIge1xuICByZXR1cm4gYSAtIGI7XG59XG5cbmNsYXNzIEV2YWx1YXRlUmFua2luZ01ldHJpY1Byb2dyYW1SdW5PcGVyYXRpb24gZXh0ZW5kcyBDb21wb3NpdGVPcGVyYXRpb24ge1xuICBwcml2YXRlIF9idWZmZXI6IFNuYXBzaG90U2l6ZVN1bW1hcnlbXSA9IFtdO1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIGNvbmZpZzogQkxlYWtDb25maWcsXG4gICAgICBwcml2YXRlIF9yYW5raW5nRXZhbENvbmZpZzogUmFua2luZ0V2YWxDb25maWcsXG4gICAgICBwcml2YXRlIF9ydW5OdW1iZXI6IG51bWJlcixcbiAgICAgIHByaXZhdGUgX2ZsdXNoUmVzdWx0czogKHJlc3VsdHM6IEJMZWFrUmVzdWx0cykgPT4gdm9pZCxcbiAgICAgIHNuYXBzaG90Q2I/OiAoc3M6IEhlYXBTbmFwc2hvdFBhcnNlciwgbWV0cmljOiBzdHJpbmcsIGxlYWtzRml4ZWQ6IG51bWJlciwgaXRlcmF0aW9uOiBudW1iZXIpID0+IFByb21pc2U8dm9pZD4pIHtcbiAgICBzdXBlcigpO1xuICAgIGNvbnN0IGJ1ZmZlciA9IHRoaXMuX2J1ZmZlcjtcbiAgICBhc3luYyBmdW5jdGlvbiBzbmFwc2hvdFJlcG9ydChzbjogSGVhcFNuYXBzaG90UGFyc2VyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICBjb25zdCBnID0gYXdhaXQgSGVhcEdyYXBoLkNvbnN0cnVjdChzbik7XG4gICAgICBjb25zdCBzaXplID0gZy5jYWxjdWxhdGVTaXplKCk7XG4gICAgICBidWZmZXIucHVzaChzaXplKTtcbiAgICB9XG4gICAgdGhpcy5jaGlsZHJlbi5wdXNoKFxuICAgICAgbmV3IENvbmZpZ3VyZVByb3h5T3BlcmF0aW9uKHtcbiAgICAgICAgbG9nOiBudWxsLFxuICAgICAgICByZXdyaXRlOiBmYWxzZSxcbiAgICAgICAgZml4ZXM6IF9yYW5raW5nRXZhbENvbmZpZy5maXhJZHMsXG4gICAgICAgIGRpc2FibGVBbGxSZXdyaXRlczogdHJ1ZSxcbiAgICAgICAgZml4UmV3cml0ZUZ1bmN0aW9uOiBjb25maWcucmV3cml0ZSxcbiAgICAgICAgY29uZmlnOiBjb25maWcuZ2V0QnJvd3NlckluamVjdGlvbigpXG4gICAgICB9KSxcbiAgICAgIG5ldyBQcm9ncmFtUnVuT3BlcmF0aW9uKGNvbmZpZywgZmFsc2UsIGNvbmZpZy5yYW5raW5nRXZhbHVhdGlvbkl0ZXJhdGlvbnMsIHRydWUsIChzbikgPT4ge1xuICAgICAgICBzbmFwc2hvdENiKHNuLCB0aGlzLl9yYW5raW5nRXZhbENvbmZpZy5tZXRyaWNzKCksIHRoaXMuX3JhbmtpbmdFdmFsQ29uZmlnLmZpeElkcy5sZW5ndGgsIHRoaXMuX3J1bk51bWJlcik7XG4gICAgICAgIHJldHVybiBzbmFwc2hvdFJlcG9ydChzbik7XG4gICAgICB9KVxuICAgICk7XG4gIH1cblxuICBwdWJsaWMgZ2V0IGRlc2NyaXB0aW9uKCkgeyByZXR1cm4gJ1J1bm5pbmcgcHJvZ3JhbSBpbiBhIGNvbmZpZ3VyYXRpb24uLi4nIH1cblxuICBwdWJsaWMgc2tpcChvcFN0OiBPcGVyYXRpb25TdGF0ZSkge1xuICAgIGNvbnN0IGxlbiA9IHRoaXMuX3JhbmtpbmdFdmFsQ29uZmlnLmZpeElkcy5sZW5ndGg7XG4gICAgZm9yIChsZXQgbWV0cmljIG9mIFsnbGVha1NoYXJlJywgJ3JldGFpbmVkU2l6ZScsICd0cmFuc2l0aXZlQ2xvc3VyZVNpemUnXSkge1xuICAgICAgaWYgKHRoaXMuX3JhbmtpbmdFdmFsQ29uZmlnW21ldHJpYyBhcyAnbGVha1NoYXJlJ10pIHtcbiAgICAgICAgY29uc3QgbWV0cmljU3RhdHMgPSBvcFN0LnJlc3VsdHMucmFua2luZ0V2YWx1YXRpb25bbWV0cmljIGFzICdsZWFrU2hhcmUnXTtcbiAgICAgICAgaWYgKCFtZXRyaWNTdGF0cykge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjb25maWdTdGF0cyA9IG1ldHJpY1N0YXRzW2xlbl07XG4gICAgICAgIGlmICghY29uZmlnU3RhdHMpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcnVuU3RhdHMgPSBjb25maWdTdGF0c1t0aGlzLl9ydW5OdW1iZXJdO1xuICAgICAgICBpZiAoIXJ1blN0YXRzKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcHJvdGVjdGVkIGFzeW5jIF9ydW4ob3BTdDogT3BlcmF0aW9uU3RhdGUpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCBzdXBlci5fcnVuKG9wU3QpO1xuICAgIC8vIFVwZGF0ZSByZXN1bHRzIHcvIGRhdGEgZnJvbSBydW4uXG4gICAgWydsZWFrU2hhcmUnLCAncmV0YWluZWRTaXplJywgJ3RyYW5zaXRpdmVDbG9zdXJlU2l6ZSddLmZvckVhY2goKG1ldHJpYzogJ2xlYWtTaGFyZScpID0+IHtcbiAgICAgIGlmICghdGhpcy5fcmFua2luZ0V2YWxDb25maWdbbWV0cmljXSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjb25zdCBtZXRyaWNSZXN1bHRzID0gb3BTdC5yZXN1bHRzLnJhbmtpbmdFdmFsdWF0aW9uW21ldHJpY107XG4gICAgICBsZXQgY29uZmlnUnVucyA9IG1ldHJpY1Jlc3VsdHNbdGhpcy5fcmFua2luZ0V2YWxDb25maWcuZml4SWRzLmxlbmd0aF07XG4gICAgICBpZiAoIWNvbmZpZ1J1bnMpIHtcbiAgICAgICAgY29uZmlnUnVucyA9IG1ldHJpY1Jlc3VsdHNbdGhpcy5fcmFua2luZ0V2YWxDb25maWcuZml4SWRzLmxlbmd0aF0gPSBbXTtcbiAgICAgIH1cbiAgICAgIGNvbmZpZ1J1bnNbdGhpcy5fcnVuTnVtYmVyXSA9IHRoaXMuX2J1ZmZlci5zbGljZSgwKTtcbiAgICB9KTtcbiAgICB0aGlzLl9mbHVzaFJlc3VsdHMob3BTdC5yZXN1bHRzKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRXZhbHVhdGVSYW5raW5nTWV0cmljc09wZXJhdGlvbiBleHRlbmRzIENvbXBvc2l0ZU9wZXJhdGlvbiB7XG4gIGNvbnN0cnVjdG9yKGNvbmZpZzogQkxlYWtDb25maWcsIHJlc3VsdHM6IEJMZWFrUmVzdWx0cywgZmx1c2hSZXN1bHRzOiAocmVzdWx0czogQkxlYWtSZXN1bHRzKSA9PiB2b2lkLCBzbmFwc2hvdENiPzogKHNzOiBIZWFwU25hcHNob3RQYXJzZXIsIG1ldHJpYzogc3RyaW5nLCBsZWFrc0ZpeGVkOiBudW1iZXIsIGl0ZXJhdGlvbjogbnVtYmVyKSA9PiBQcm9taXNlPHZvaWQ+KSB7XG4gICAgc3VwZXIoKTtcbiAgICBmdW5jdGlvbiBnZXRTb3J0ZXIocmFua0J5OiBcInRyYW5zaXRpdmVDbG9zdXJlU2l6ZVwiIHwgXCJsZWFrU2hhcmVcIiB8IFwicmV0YWluZWRTaXplXCIgfCBcIm93bmVkT2JqZWN0c1wiKTogKGE6IG51bWJlciwgYjogbnVtYmVyKSA9PiBudW1iZXIge1xuICAgICAgcmV0dXJuIChhLCBiKSA9PiB7XG4gICAgICAgIHJldHVybiByZXN1bHRzLmxlYWtzW2JdLnNjb3Jlc1tyYW5rQnldIC0gcmVzdWx0cy5sZWFrc1thXS5zY29yZXNbcmFua0J5XTtcbiAgICAgIH07XG4gICAgfVxuICAgIGZ1bmN0aW9uIGZpeE1hcHBlcihsZWFrSWQ6IG51bWJlcik6IG51bWJlciB7XG4gICAgICBjb25zdCBzdHIgPSBQYXRoVG9TdHJpbmcocmVzdWx0cy5sZWFrc1tsZWFrSWRdLnBhdGhzWzBdKTtcbiAgICAgIGNvbnN0IGZpeElkID0gY29uZmlnLmZpeE1hcFtzdHJdO1xuICAgICAgaWYgKGZpeElkID09PSB1bmRlZmluZWQgfHwgZml4SWQgPT09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmFibGUgdG8gZmluZCBmaXggSUQgZm9yICR7c3RyfS5gKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmaXhJZDtcbiAgICB9XG4gICAgZnVuY3Rpb24gcmVtb3ZlRHVwZXModW5pcXVlOiBudW1iZXJbXSwgZml4SWQ6IG51bWJlcik6IG51bWJlcltdIHtcbiAgICAgIGlmICh1bmlxdWUuaW5kZXhPZihmaXhJZCkgPT09IC0xKSB7XG4gICAgICAgIHVuaXF1ZS5wdXNoKGZpeElkKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB1bmlxdWU7XG4gICAgfVxuICAgIC8vIEZpZ3VyZSBvdXQgd2hpY2ggcnVucyBhcmUgY29tcGxldGVkIGFuZCBpbiB0aGUgcmVzdWx0cyBmaWxlLFxuICAgIGNvbnN0IGNvbmZpZ3NUb1Rlc3QgPSBuZXcgTWFwPHN0cmluZywgUmFua2luZ0V2YWxDb25maWc+KCk7XG4gICAgY29uc3QgbGVha3NCeUlkID0gcmVzdWx0cy5sZWFrcy5tYXAoKGwsIGkpID0+IGkpO1xuICAgIC8vIE1hcCBmcm9tIG1ldHJpYyA9PiBsaXN0IG9mIGZpeGVzIHRvIGFwcGx5LCBpbi1vcmRlci5cbiAgICBjb25zdCBvcmRlcnMgPSB7XG4gICAgICAnbGVha1NoYXJlJzogbGVha3NCeUlkLnNvcnQoZ2V0U29ydGVyKCdsZWFrU2hhcmUnKSkubWFwKGZpeE1hcHBlcikucmVkdWNlKHJlbW92ZUR1cGVzLCBbXSksXG4gICAgICAncmV0YWluZWRTaXplJzogbGVha3NCeUlkLnNvcnQoZ2V0U29ydGVyKCdyZXRhaW5lZFNpemUnKSkubWFwKGZpeE1hcHBlcikucmVkdWNlKHJlbW92ZUR1cGVzLCBbXSksXG4gICAgICAndHJhbnNpdGl2ZUNsb3N1cmVTaXplJzogbGVha3NCeUlkLnNvcnQoZ2V0U29ydGVyKCd0cmFuc2l0aXZlQ2xvc3VyZVNpemUnKSkubWFwKGZpeE1hcHBlcikucmVkdWNlKHJlbW92ZUR1cGVzLCBbXSlcbiAgICB9O1xuICAgIGZvciAobGV0IG1ldHJpYyBpbiBvcmRlcnMpIHtcbiAgICAgIGlmIChvcmRlcnMuaGFzT3duUHJvcGVydHkobWV0cmljKSkge1xuICAgICAgICBjb25zdCBtZXRyaWNDYXN0ID0gPCdsZWFrU2hhcmUnIHwgJ3JldGFpbmVkU2l6ZScgfCAndHJhbnNpdGl2ZUNsb3N1cmVTaXplJz4gbWV0cmljO1xuICAgICAgICBjb25zdCBvcmRlciA9IG9yZGVyc1ttZXRyaWNDYXN0XTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPD0gb3JkZXIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAvLyBOb3RlOiBXaGVuIGk9MCwgdGhpcyBpcyB0aGUgZW1wdHkgYXJyYXkgLS0gdGhlIGJhc2UgY2FzZS5cbiAgICAgICAgICBjb25zdCBjb25maWdPcmRlciA9IG9yZGVyLnNsaWNlKDAsIGkpO1xuICAgICAgICAgIGNvbnN0IGtleSA9IGxlYWtTZXRLZXkoY29uZmlnT3JkZXIpO1xuICAgICAgICAgIGxldCBjb25maWcgPSBjb25maWdzVG9UZXN0LmdldChrZXkpO1xuICAgICAgICAgIGlmICghY29uZmlnKSB7XG4gICAgICAgICAgICBjb25maWcgPSBuZXcgUmFua2luZ0V2YWxDb25maWcoY29uZmlnT3JkZXIpO1xuICAgICAgICAgICAgY29uZmlnc1RvVGVzdC5zZXQoa2V5LCBjb25maWcpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25maWdbbWV0cmljQ2FzdF0gPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGxldCBjb25maWdzOiBSYW5raW5nRXZhbENvbmZpZ1tdID0gW107XG4gICAgY29uZmlnc1RvVGVzdC5mb3JFYWNoKChjb25maWcpID0+IHtcbiAgICAgIGNvbmZpZ3MucHVzaChjb25maWcpO1xuICAgIH0pO1xuICAgIC8vIE5vdyB3ZSBjYW4gbWFrZSB0aGVzZSBydW4hXG4gICAgaWYgKGNvbmZpZy5sb2dpbikge1xuICAgICAgdGhpcy5jaGlsZHJlbi5wdXNoKFxuICAgICAgICBuZXcgQ29uZmlndXJlUHJveHlPcGVyYXRpb24oe1xuICAgICAgICAgIGxvZzogbnVsbCxcbiAgICAgICAgICByZXdyaXRlOiBmYWxzZSxcbiAgICAgICAgICBmaXhlczogW10sXG4gICAgICAgICAgZGlzYWJsZUFsbFJld3JpdGVzOiB0cnVlLFxuICAgICAgICAgIGZpeFJld3JpdGVGdW5jdGlvbjogY29uZmlnLnJld3JpdGUsXG4gICAgICAgICAgY29uZmlnOiBjb25maWcuZ2V0QnJvd3NlckluamVjdGlvbigpXG4gICAgICAgIH0pLFxuICAgICAgICBuZXcgTmF2aWdhdGVPcGVyYXRpb24oY29uZmlnLnRpbWVvdXQsIGNvbmZpZy51cmwpLFxuICAgICAgICBuZXcgU3RlcFNlcmllc09wZXJhdGlvbihjb25maWcsICdsb2dpbicpLFxuICAgICAgICBuZXcgRGVsYXlPcGVyYXRpb24oY29uZmlnLnBvc3RMb2dpblNsZWVwKVxuICAgICAgKTtcbiAgICB9XG4gICAgZm9yIChjb25zdCByYW5raW5nQ29uZmlnIG9mIGNvbmZpZ3MpIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29uZmlnLnJhbmtpbmdFdmFsdWF0aW9uUnVuczsgaSsrKSB7XG4gICAgICAgIHRoaXMuY2hpbGRyZW4ucHVzaChcbiAgICAgICAgICBuZXcgRXZhbHVhdGVSYW5raW5nTWV0cmljUHJvZ3JhbVJ1bk9wZXJhdGlvbihcbiAgICAgICAgICAgIGNvbmZpZywgcmFua2luZ0NvbmZpZywgaSwgZmx1c2hSZXN1bHRzLCBzbmFwc2hvdENiKVxuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBnZXQgZGVzY3JpcHRpb24oKSB7IHJldHVybiAnRXZhbHVhdGluZyByYW5raW5nIG1ldHJpY3MnOyB9XG4gIHB1YmxpYyBza2lwKG9wU3Q6IE9wZXJhdGlvblN0YXRlKSB7XG4gICAgaWYgKCFvcFN0LnJlc3VsdHMubGVha3MgfHwgb3BTdC5yZXN1bHRzLmxlYWtzLmxlbmd0aCA8IDIpIHtcbiAgICAgIG9wU3QucHJvZ3Jlc3NCYXIubG9nKGBVbmFibGUgdG8gZXZhbHVhdGUgcmFua2luZyBtZXRyaWNzOiBCTGVhayByZXN1bHRzIGZpbGUgZG9lcyBub3QgY29udGFpbiBtb3JlIHRoYW4gMiBsZWFrIHJvb3RzLmApO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRmluZEFuZERpYWdub3NlTGVha3MgZXh0ZW5kcyBDb21wb3NpdGVPcGVyYXRpb24ge1xuICBjb25zdHJ1Y3Rvcihjb25maWc6IEJMZWFrQ29uZmlnLCBzbmFwc2hvdENiOiBTbmFwc2hvdENiKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmNoaWxkcmVuLnB1c2goXG4gICAgICBuZXcgRmluZExlYWtzKGNvbmZpZywgc25hcHNob3RDYiksXG4gICAgICBuZXcgRGlhZ25vc2VMZWFrcyhjb25maWcsIHRydWUpXG4gICAgKTtcbiAgfVxuICBwdWJsaWMgZ2V0IGRlc2NyaXB0aW9uKCkgeyByZXR1cm4gXCJMb2NhdGluZyBhbmQgZGlhZ25vc2luZyBsZWFrc1wiOyB9XG59XG4iXX0=