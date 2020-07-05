import * as tslib_1 from "tslib";
import { wait } from '../common/util';
import { default as getInterceptor } from './mitmproxy_interceptor';
import BLeakResults from './bleak_results';
import { HeapGrowthTracker, HeapGraph, toPathTree } from './growth_graph';
import StackFrameConverter from './stack_frame_converter';
import PathToString from './path_to_string';
var OperationState = /** @class */ (function () {
    function OperationState(chromeDriver, progressBar, config) {
        this.chromeDriver = chromeDriver;
        this.progressBar = progressBar;
        this.config = config;
        this.results = null;
    }
    return OperationState;
}());
export { OperationState };
var NEVER = Math.pow(2, 30);
var Operation = /** @class */ (function () {
    function Operation(_timeout) {
        if (_timeout === void 0) { _timeout = NEVER; }
        this._timeout = _timeout;
    }
    // Returns the size of the operations graph beginning with this node.
    // Default is 1 (no dependent operations)
    Operation.prototype.size = function () { return 1; };
    // Returns 'true' if the operation is fulfilled and can be skipped.
    // Defaults to unskippable.
    Operation.prototype.skip = function (opSt) { return false; };
    // Runs the operation. Promise is resolved/rejected when completed.
    Operation.prototype.run = function (opSt) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            var size, i;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        opSt.progressBar.updateDescription(this.description);
                        if (this.skip(opSt)) {
                            size = this.size();
                            for (i = 0; i < size; i++) {
                                opSt.progressBar.nextOperation();
                            }
                            return [2 /*return*/];
                        }
                        if (!(this._timeout === NEVER)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this._run(opSt)];
                    case 1:
                        _a.sent();
                        opSt.progressBar.nextOperation();
                        return [2 /*return*/];
                    case 2: return [2 /*return*/, new Promise(function (resolve, reject) {
                            var timer = setTimeout(function () {
                                var e = new Error("Operation timed out.");
                                _this.cancel(e);
                                reject(e);
                            }, _this._timeout);
                            _this._run(opSt).then(function () {
                                clearTimeout(timer);
                                opSt.progressBar.nextOperation();
                                resolve();
                            }).catch(function (e) {
                                clearTimeout(timer);
                                reject(e);
                            });
                        })];
                }
            });
        });
    };
    // Called when a running operation is canceled. Operation should exit gracefully.
    Operation.prototype.cancel = function (e) { };
    return Operation;
}());
var NavigateOperation = /** @class */ (function (_super) {
    tslib_1.__extends(NavigateOperation, _super);
    function NavigateOperation(timeout, _url) {
        var _this = _super.call(this, timeout) || this;
        _this._url = _url;
        return _this;
    }
    Object.defineProperty(NavigateOperation.prototype, "description", {
        get: function () {
            return "Navigating to " + this._url;
        },
        enumerable: true,
        configurable: true
    });
    NavigateOperation.prototype._run = function (opSt) {
        return opSt.chromeDriver.navigateTo(this._url);
    };
    return NavigateOperation;
}(Operation));
var CheckOperation = /** @class */ (function (_super) {
    tslib_1.__extends(CheckOperation, _super);
    function CheckOperation(timeout, _stepType, _id) {
        var _this = _super.call(this, timeout) || this;
        _this._stepType = _stepType;
        _this._id = _id;
        _this._cancelled = false;
        return _this;
    }
    Object.defineProperty(CheckOperation.prototype, "description", {
        get: function () {
            return "Waiting for " + this._stepType + "[" + this._id + "].check() === true";
        },
        enumerable: true,
        configurable: true
    });
    CheckOperation.prototype.cancel = function (e) {
        this._cancelled = true;
    };
    CheckOperation.prototype._run = function (opSt) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var success;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!this._cancelled) return [3 /*break*/, 3];
                        return [4 /*yield*/, opSt.chromeDriver.runCode("typeof(BLeakConfig) !== \"undefined\" && BLeakConfig." + this._stepType + "[" + this._id + "].check()")];
                    case 1:
                        success = _a.sent();
                        if (success) {
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, wait(100)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 0];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return CheckOperation;
}(Operation));
var NextOperation = /** @class */ (function (_super) {
    tslib_1.__extends(NextOperation, _super);
    function NextOperation(timeout, _stepType, _id) {
        var _this = _super.call(this, timeout) || this;
        _this._stepType = _stepType;
        _this._id = _id;
        return _this;
    }
    Object.defineProperty(NextOperation.prototype, "description", {
        get: function () {
            return "Advancing to next state " + this._stepType + "[" + this._id + "].next()";
        },
        enumerable: true,
        configurable: true
    });
    NextOperation.prototype._run = function (opSt) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                return [2 /*return*/, opSt.chromeDriver.runCode("BLeakConfig." + this._stepType + "[" + this._id + "].next()")];
            });
        });
    };
    return NextOperation;
}(Operation));
var DelayOperation = /** @class */ (function (_super) {
    tslib_1.__extends(DelayOperation, _super);
    function DelayOperation(_delay) {
        var _this = _super.call(this) || this;
        _this._delay = _delay;
        return _this;
    }
    Object.defineProperty(DelayOperation.prototype, "description", {
        get: function () {
            return "Waiting " + this._delay + " ms before proceeding";
        },
        enumerable: true,
        configurable: true
    });
    DelayOperation.prototype._run = function () {
        return wait(this._delay);
    };
    return DelayOperation;
}(Operation));
var TakeHeapSnapshotOperation = /** @class */ (function (_super) {
    tslib_1.__extends(TakeHeapSnapshotOperation, _super);
    function TakeHeapSnapshotOperation(timeout, _snapshotCb) {
        var _this = _super.call(this, timeout) || this;
        _this._snapshotCb = _snapshotCb;
        return _this;
    }
    Object.defineProperty(TakeHeapSnapshotOperation.prototype, "description", {
        get: function () {
            return "Taking a heap snapshot";
        },
        enumerable: true,
        configurable: true
    });
    TakeHeapSnapshotOperation.prototype._run = function (opSt) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var sn;
            return tslib_1.__generator(this, function (_a) {
                sn = opSt.chromeDriver.takeHeapSnapshot();
                return [2 /*return*/, this._snapshotCb(sn)];
            });
        });
    };
    return TakeHeapSnapshotOperation;
}(Operation));
var ConfigureProxyOperation = /** @class */ (function (_super) {
    tslib_1.__extends(ConfigureProxyOperation, _super);
    function ConfigureProxyOperation(_config) {
        var _this = _super.call(this) || this;
        _this._config = _config;
        return _this;
    }
    Object.defineProperty(ConfigureProxyOperation.prototype, "description", {
        get: function () {
            return "Configuring the proxy";
        },
        enumerable: true,
        configurable: true
    });
    ConfigureProxyOperation.prototype._run = function (opSt) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                this._config.log = opSt.progressBar;
                opSt.chromeDriver.mitmProxy.cb = getInterceptor(this._config);
                return [2 /*return*/];
            });
        });
    };
    return ConfigureProxyOperation;
}(Operation));
function countOperations(sumSoFar, next) {
    return sumSoFar + next.size();
}
var CompositeOperation = /** @class */ (function (_super) {
    tslib_1.__extends(CompositeOperation, _super);
    function CompositeOperation() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.children = [];
        _this._canceledError = null;
        return _this;
    }
    CompositeOperation.prototype.size = function () {
        return this.children.reduce(countOperations, 1);
    };
    CompositeOperation.prototype.cancel = function (e) {
        this._canceledError = e;
    };
    CompositeOperation.prototype._run = function (opSt) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            function runNext() {
                if (self._canceledError) {
                    throw self._canceledError;
                }
                if (i < self.children.length) {
                    return self.children[i++].run(opSt);
                }
            }
            var promise, i, self, i_1;
            return tslib_1.__generator(this, function (_a) {
                promise = Promise.resolve();
                i = 0;
                self = this;
                for (i_1 = 0; i_1 < this.children.length; i_1++) {
                    promise = promise.then(runNext);
                }
                return [2 /*return*/, promise];
            });
        });
    };
    return CompositeOperation;
}(Operation));
var StepOperation = /** @class */ (function (_super) {
    tslib_1.__extends(StepOperation, _super);
    function StepOperation(config, stepType, id) {
        var _this = _super.call(this) || this;
        _this.children.push(new CheckOperation(config.timeout, stepType, id));
        if (config.postCheckSleep) {
            _this.children.push(new DelayOperation(config.postCheckSleep));
        }
        _this.children.push(new NextOperation(config.timeout, stepType, id));
        if (config.postNextSleep) {
            _this.children.push(new DelayOperation(config.postNextSleep));
        }
        return _this;
    }
    Object.defineProperty(StepOperation.prototype, "description", {
        get: function () { return ''; },
        enumerable: true,
        configurable: true
    });
    return StepOperation;
}(CompositeOperation));
var InstrumentGrowingPathsOperation = /** @class */ (function (_super) {
    tslib_1.__extends(InstrumentGrowingPathsOperation, _super);
    function InstrumentGrowingPathsOperation() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(InstrumentGrowingPathsOperation.prototype, "description", {
        get: function () {
            return "Instrumenting growing objects";
        },
        enumerable: true,
        configurable: true
    });
    InstrumentGrowingPathsOperation.prototype._run = function (opSt) {
        return opSt.chromeDriver.runCode("window.$$$INSTRUMENT_PATHS$$$(" + JSON.stringify(toPathTree(opSt.results.leaks)) + ")");
    };
    return InstrumentGrowingPathsOperation;
}(Operation));
var StepSeriesOperation = /** @class */ (function (_super) {
    tslib_1.__extends(StepSeriesOperation, _super);
    function StepSeriesOperation(config, stepType) {
        var _this = _super.call(this) || this;
        var steps = config[stepType];
        for (var i = 0; i < steps.length; i++) {
            _this.children.push(new StepOperation(config, stepType, i));
        }
        return _this;
    }
    Object.defineProperty(StepSeriesOperation.prototype, "description", {
        get: function () { return ''; },
        enumerable: true,
        configurable: true
    });
    return StepSeriesOperation;
}(CompositeOperation));
var ProgramRunOperation = /** @class */ (function (_super) {
    tslib_1.__extends(ProgramRunOperation, _super);
    function ProgramRunOperation(config, runLogin, iterations, takeInitialSnapshot, snapshotCb) {
        var _this = _super.call(this) || this;
        _this.children.push(new NavigateOperation(config.timeout, config.url));
        if (runLogin && config.login.length > 0) {
            _this.children.push(new StepSeriesOperation(config, 'login'), new DelayOperation(config.postLoginSleep), new NavigateOperation(config.timeout, config.url));
        }
        if (config.setup.length > 0) {
            _this.children.push(new StepSeriesOperation(config, 'setup'));
        }
        if (takeInitialSnapshot && snapshotCb) {
            _this.children.push(
            // Make sure we're at step 0 before taking the snapshot.
            new CheckOperation(config.timeout, 'loop', 0));
            if (config.postCheckSleep) {
                _this.children.push(new DelayOperation(config.postCheckSleep));
            }
            _this.children.push(new TakeHeapSnapshotOperation(config.timeout, snapshotCb));
        }
        for (var i = 0; i < iterations; i++) {
            _this.children.push(new StepSeriesOperation(config, 'loop'), 
            // Make sure we're at step 0 before taking the snapshot.
            new CheckOperation(config.timeout, 'loop', 0));
            if (config.postCheckSleep) {
                _this.children.push(new DelayOperation(config.postCheckSleep));
            }
            if (snapshotCb) {
                _this.children.push(new TakeHeapSnapshotOperation(config.timeout, snapshotCb));
            }
        }
        return _this;
    }
    Object.defineProperty(ProgramRunOperation.prototype, "description", {
        get: function () { return 'Running through the program'; },
        enumerable: true,
        configurable: true
    });
    return ProgramRunOperation;
}(CompositeOperation));
var FindLeaks = /** @class */ (function (_super) {
    tslib_1.__extends(FindLeaks, _super);
    function FindLeaks(config, _snapshotCb) {
        var _this = _super.call(this) || this;
        _this._snapshotCb = _snapshotCb;
        _this._growthTracker = new HeapGrowthTracker();
        _this._heapSnapshotSizeStats = [];
        _this.children.push(new ConfigureProxyOperation({
            log: null,
            rewrite: false,
            fixes: config.fixedLeaks,
            disableAllRewrites: false,
            fixRewriteFunction: config.rewrite,
            config: config.getBrowserInjection()
        }), new ProgramRunOperation(config, true, config.iterations, false, function (sn) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this._snapshotCb(sn);
                        return [4 /*yield*/, this._growthTracker.addSnapshot(sn)];
                    case 1:
                        _a.sent();
                        this._heapSnapshotSizeStats.push(this._growthTracker.getGraph().calculateSize());
                        return [2 /*return*/];
                }
            });
        }); }));
        return _this;
    }
    Object.defineProperty(FindLeaks.prototype, "description", {
        get: function () { return 'Locating leaks'; },
        enumerable: true,
        configurable: true
    });
    FindLeaks.prototype.skip = function (opSt) {
        return !!opSt.results;
    };
    FindLeaks.prototype._run = function (opSt) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, _super.prototype._run.call(this, opSt)];
                    case 1:
                        _a.sent();
                        opSt.results = new BLeakResults(this._growthTracker.findLeakPaths(), undefined, undefined, this._heapSnapshotSizeStats);
                        return [2 /*return*/];
                }
            });
        });
    };
    return FindLeaks;
}(CompositeOperation));
var GetGrowthStacksOperation = /** @class */ (function (_super) {
    tslib_1.__extends(GetGrowthStacksOperation, _super);
    function GetGrowthStacksOperation(timeout) {
        return _super.call(this, timeout) || this;
    }
    Object.defineProperty(GetGrowthStacksOperation.prototype, "description", {
        get: function () { return 'Retrieving stack traces'; },
        enumerable: true,
        configurable: true
    });
    GetGrowthStacksOperation.prototype._run = function (opSt) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var traces, growthStacks;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, opSt.chromeDriver.runCode("window.$$$GET_STACK_TRACES$$$()")];
                    case 1:
                        traces = _a.sent();
                        growthStacks = StackFrameConverter.ConvertGrowthStacks(opSt.chromeDriver.mitmProxy, opSt.config.url, opSt.results, traces);
                        opSt.results.leaks.forEach(function (lr) {
                            var index = lr.id;
                            var stacks = growthStacks[index] || [];
                            stacks.forEach(function (s) {
                                lr.addStackTrace(s);
                            });
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    return GetGrowthStacksOperation;
}(Operation));
var DiagnoseLeaks = /** @class */ (function (_super) {
    tslib_1.__extends(DiagnoseLeaks, _super);
    function DiagnoseLeaks(config, isLoggedIn) {
        var _this = _super.call(this) || this;
        _this.children.push(new ConfigureProxyOperation({
            log: null,
            rewrite: true,
            fixes: config.fixedLeaks,
            config: config.getBrowserInjection(),
            fixRewriteFunction: config.rewrite
        }), 
        // Warmup
        new ProgramRunOperation(config, !isLoggedIn, 1, false), new InstrumentGrowingPathsOperation(config.timeout), new StepSeriesOperation(config, 'loop'), new StepSeriesOperation(config, 'loop'), new GetGrowthStacksOperation(config.timeout));
        return _this;
    }
    Object.defineProperty(DiagnoseLeaks.prototype, "description", {
        get: function () { return 'Diagnosing leaks'; },
        enumerable: true,
        configurable: true
    });
    DiagnoseLeaks.prototype.skip = function (opSt) {
        return opSt.results.leaks.length === 0;
    };
    DiagnoseLeaks.prototype._run = function (opSt) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, _super.prototype._run.call(this, opSt)];
                    case 1:
                        _a.sent();
                        opSt.results = opSt.results.compact();
                        return [2 /*return*/];
                }
            });
        });
    };
    return DiagnoseLeaks;
}(CompositeOperation));
/**
 * A specific BLeak configuration used during ranking metric evaluation.
 * Since metrics may share specific configurations, this contains a boolean
 * indicating which metrics this configuration applies to.
 */
var RankingEvalConfig = /** @class */ (function () {
    function RankingEvalConfig(fixIds) {
        this.fixIds = fixIds;
        this.leakShare = false;
        this.retainedSize = false;
        this.transitiveClosureSize = false;
    }
    RankingEvalConfig.prototype.metrics = function () {
        var rv = [];
        for (var _i = 0, _a = ['leakShare', 'retainedSize', 'transitiveClosureSize']; _i < _a.length; _i++) {
            var metric = _a[_i];
            if (this[metric]) {
                rv.push(metric);
            }
        }
        return rv.join(', ');
    };
    return RankingEvalConfig;
}());
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
var EvaluateRankingMetricProgramRunOperation = /** @class */ (function (_super) {
    tslib_1.__extends(EvaluateRankingMetricProgramRunOperation, _super);
    function EvaluateRankingMetricProgramRunOperation(config, _rankingEvalConfig, _runNumber, _flushResults, snapshotCb) {
        var _this = _super.call(this) || this;
        _this._rankingEvalConfig = _rankingEvalConfig;
        _this._runNumber = _runNumber;
        _this._flushResults = _flushResults;
        _this._buffer = [];
        var buffer = _this._buffer;
        function snapshotReport(sn) {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                var g, size;
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, HeapGraph.Construct(sn)];
                        case 1:
                            g = _a.sent();
                            size = g.calculateSize();
                            buffer.push(size);
                            return [2 /*return*/];
                    }
                });
            });
        }
        _this.children.push(new ConfigureProxyOperation({
            log: null,
            rewrite: false,
            fixes: _rankingEvalConfig.fixIds,
            disableAllRewrites: true,
            fixRewriteFunction: config.rewrite,
            config: config.getBrowserInjection()
        }), new ProgramRunOperation(config, false, config.rankingEvaluationIterations, true, function (sn) {
            snapshotCb(sn, _this._rankingEvalConfig.metrics(), _this._rankingEvalConfig.fixIds.length, _this._runNumber);
            return snapshotReport(sn);
        }));
        return _this;
    }
    Object.defineProperty(EvaluateRankingMetricProgramRunOperation.prototype, "description", {
        get: function () { return 'Running program in a configuration...'; },
        enumerable: true,
        configurable: true
    });
    EvaluateRankingMetricProgramRunOperation.prototype.skip = function (opSt) {
        var len = this._rankingEvalConfig.fixIds.length;
        for (var _i = 0, _a = ['leakShare', 'retainedSize', 'transitiveClosureSize']; _i < _a.length; _i++) {
            var metric = _a[_i];
            if (this._rankingEvalConfig[metric]) {
                var metricStats = opSt.results.rankingEvaluation[metric];
                if (!metricStats) {
                    return false;
                }
                var configStats = metricStats[len];
                if (!configStats) {
                    return false;
                }
                var runStats = configStats[this._runNumber];
                if (!runStats) {
                    return false;
                }
            }
        }
        return true;
    };
    EvaluateRankingMetricProgramRunOperation.prototype._run = function (opSt) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, _super.prototype._run.call(this, opSt)];
                    case 1:
                        _a.sent();
                        // Update results w/ data from run.
                        ['leakShare', 'retainedSize', 'transitiveClosureSize'].forEach(function (metric) {
                            if (!_this._rankingEvalConfig[metric]) {
                                return;
                            }
                            var metricResults = opSt.results.rankingEvaluation[metric];
                            var configRuns = metricResults[_this._rankingEvalConfig.fixIds.length];
                            if (!configRuns) {
                                configRuns = metricResults[_this._rankingEvalConfig.fixIds.length] = [];
                            }
                            configRuns[_this._runNumber] = _this._buffer.slice(0);
                        });
                        this._flushResults(opSt.results);
                        return [2 /*return*/];
                }
            });
        });
    };
    return EvaluateRankingMetricProgramRunOperation;
}(CompositeOperation));
var EvaluateRankingMetricsOperation = /** @class */ (function (_super) {
    tslib_1.__extends(EvaluateRankingMetricsOperation, _super);
    function EvaluateRankingMetricsOperation(config, results, flushResults, snapshotCb) {
        var _this = _super.call(this) || this;
        function getSorter(rankBy) {
            return function (a, b) {
                return results.leaks[b].scores[rankBy] - results.leaks[a].scores[rankBy];
            };
        }
        function fixMapper(leakId) {
            var str = PathToString(results.leaks[leakId].paths[0]);
            var fixId = config.fixMap[str];
            if (fixId === undefined || fixId === null) {
                throw new Error("Unable to find fix ID for " + str + ".");
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
        var configsToTest = new Map();
        var leaksById = results.leaks.map(function (l, i) { return i; });
        // Map from metric => list of fixes to apply, in-order.
        var orders = {
            'leakShare': leaksById.sort(getSorter('leakShare')).map(fixMapper).reduce(removeDupes, []),
            'retainedSize': leaksById.sort(getSorter('retainedSize')).map(fixMapper).reduce(removeDupes, []),
            'transitiveClosureSize': leaksById.sort(getSorter('transitiveClosureSize')).map(fixMapper).reduce(removeDupes, [])
        };
        for (var metric in orders) {
            if (orders.hasOwnProperty(metric)) {
                var metricCast = metric;
                var order = orders[metricCast];
                for (var i = 0; i <= order.length; i++) {
                    // Note: When i=0, this is the empty array -- the base case.
                    var configOrder = order.slice(0, i);
                    var key = leakSetKey(configOrder);
                    var config_1 = configsToTest.get(key);
                    if (!config_1) {
                        config_1 = new RankingEvalConfig(configOrder);
                        configsToTest.set(key, config_1);
                    }
                    config_1[metricCast] = true;
                }
            }
        }
        var configs = [];
        configsToTest.forEach(function (config) {
            configs.push(config);
        });
        // Now we can make these run!
        if (config.login) {
            _this.children.push(new ConfigureProxyOperation({
                log: null,
                rewrite: false,
                fixes: [],
                disableAllRewrites: true,
                fixRewriteFunction: config.rewrite,
                config: config.getBrowserInjection()
            }), new NavigateOperation(config.timeout, config.url), new StepSeriesOperation(config, 'login'), new DelayOperation(config.postLoginSleep));
        }
        for (var _i = 0, configs_1 = configs; _i < configs_1.length; _i++) {
            var rankingConfig = configs_1[_i];
            for (var i = 0; i < config.rankingEvaluationRuns; i++) {
                _this.children.push(new EvaluateRankingMetricProgramRunOperation(config, rankingConfig, i, flushResults, snapshotCb));
            }
        }
        return _this;
    }
    Object.defineProperty(EvaluateRankingMetricsOperation.prototype, "description", {
        get: function () { return 'Evaluating ranking metrics'; },
        enumerable: true,
        configurable: true
    });
    EvaluateRankingMetricsOperation.prototype.skip = function (opSt) {
        if (!opSt.results.leaks || opSt.results.leaks.length < 2) {
            opSt.progressBar.log("Unable to evaluate ranking metrics: BLeak results file does not contain more than 2 leak roots.");
            return true;
        }
        return false;
    };
    return EvaluateRankingMetricsOperation;
}(CompositeOperation));
export { EvaluateRankingMetricsOperation };
var FindAndDiagnoseLeaks = /** @class */ (function (_super) {
    tslib_1.__extends(FindAndDiagnoseLeaks, _super);
    function FindAndDiagnoseLeaks(config, snapshotCb) {
        var _this = _super.call(this) || this;
        _this.children.push(new FindLeaks(config, snapshotCb), new DiagnoseLeaks(config, true));
        return _this;
    }
    Object.defineProperty(FindAndDiagnoseLeaks.prototype, "description", {
        get: function () { return "Locating and diagnosing leaks"; },
        enumerable: true,
        configurable: true
    });
    return FindAndDiagnoseLeaks;
}(CompositeOperation));
export { FindAndDiagnoseLeaks };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmxlYWtfb3BlcmF0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9saWIvYmxlYWtfb3BlcmF0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBR0EsT0FBTyxFQUFDLElBQUksRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRXBDLE9BQU8sRUFBb0IsT0FBTyxJQUFJLGNBQWMsRUFBQyxNQUFNLHlCQUF5QixDQUFDO0FBQ3JGLE9BQU8sWUFBWSxNQUFNLGlCQUFpQixDQUFDO0FBQzNDLE9BQU8sRUFBQyxpQkFBaUIsRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDeEUsT0FBTyxtQkFBbUIsTUFBTSx5QkFBeUIsQ0FBQztBQUMxRCxPQUFPLFlBQVksTUFBTSxrQkFBa0IsQ0FBQztBQUk1QztJQUVFLHdCQUNTLFlBQTBCLEVBQzFCLFdBQXlCLEVBQ3pCLE1BQW1CO1FBRm5CLGlCQUFZLEdBQVosWUFBWSxDQUFjO1FBQzFCLGdCQUFXLEdBQVgsV0FBVyxDQUFjO1FBQ3pCLFdBQU0sR0FBTixNQUFNLENBQWE7UUFKckIsWUFBTyxHQUFpQixJQUFJLENBQUM7SUFJTCxDQUFDO0lBQ2xDLHFCQUFDO0FBQUQsQ0FBQyxBQU5ELElBTUM7O0FBRUQsSUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFFOUI7SUFDRSxtQkFBNkIsUUFBd0I7UUFBeEIseUJBQUEsRUFBQSxnQkFBd0I7UUFBeEIsYUFBUSxHQUFSLFFBQVEsQ0FBZ0I7SUFBRyxDQUFDO0lBR3pELHFFQUFxRTtJQUNyRSx5Q0FBeUM7SUFDbEMsd0JBQUksR0FBWCxjQUF3QixNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNuQyxtRUFBbUU7SUFDbkUsMkJBQTJCO0lBQ3BCLHdCQUFJLEdBQVgsVUFBWSxJQUFvQixJQUFhLE1BQU0sQ0FBQyxLQUFLLENB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O0lBQ0gsQ0FBQztJQUVELHNCQUFXLHdEQUFXO2FBQXRCLGNBQTJCLE1BQU0sQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDLENBQUM7OztPQUFBO0lBQzFELDhDQUFJLEdBQVgsVUFBWSxJQUFvQjtRQUM5QixFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3pELElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLGlHQUFpRyxDQUFDLENBQUM7WUFDeEgsTUFBTSxDQUFDLElBQUksQ0FBQztRQUNkLENBQUM7UUFDRCxNQUFNLENBQUMsS0FBSyxDQUFDO0lBQ2YsQ0FBQztJQUNILHNDQUFDO0FBQUQsQ0FBQyxBQXRGRCxDQUFxRCxrQkFBa0IsR0FzRnRFOztBQUVEO0lBQTBDLGdEQUFrQjtJQUMxRCw4QkFBWSxNQUFtQixFQUFFLFVBQXNCO1FBQXZELFlBQ0UsaUJBQU8sU0FLUjtRQUpDLEtBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUNoQixJQUFJLFNBQVMsQ0FBQyxNQUFNLEVBQUUsVUFBVSxDQUFDLEVBQ2pDLElBQUksYUFBYSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FDaEMsQ0FBQzs7SUFDSixDQUFDO0lBQ0Qsc0JBQVcsNkNBQVc7YUFBdEIsY0FBMkIsTUFBTSxDQUFDLCtCQUErQixDQUFDLENBQUMsQ0FBQzs7O09BQUE7SUFDdEUsMkJBQUM7QUFBRCxDQUFDLEFBVEQsQ0FBMEMsa0JBQWtCLEdBUzNEIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IENocm9tZURyaXZlciBmcm9tICcuL2Nocm9tZV9kcml2ZXInO1xuaW1wb3J0IHtTdGVwVHlwZSwgU25hcHNob3RTaXplU3VtbWFyeSwgSVByb2dyZXNzQmFyfSBmcm9tICcuLi9jb21tb24vaW50ZXJmYWNlcyc7XG5pbXBvcnQgQkxlYWtDb25maWcgZnJvbSAnLi9ibGVha19jb25maWcnO1xuaW1wb3J0IHt3YWl0fSBmcm9tICcuLi9jb21tb24vdXRpbCc7XG5pbXBvcnQgSGVhcFNuYXBzaG90UGFyc2VyIGZyb20gJy4vaGVhcF9zbmFwc2hvdF9wYXJzZXInO1xuaW1wb3J0IHtJbnRlcmNlcHRvckNvbmZpZywgZGVmYXVsdCBhcyBnZXRJbnRlcmNlcHRvcn0gZnJvbSAnLi9taXRtcHJveHlfaW50ZXJjZXB0b3InO1xuaW1wb3J0IEJMZWFrUmVzdWx0cyBmcm9tICcuL2JsZWFrX3Jlc3VsdHMnO1xuaW1wb3J0IHtIZWFwR3Jvd3RoVHJhY2tlciwgSGVhcEdyYXBoLCB0b1BhdGhUcmVlfSBmcm9tICcuL2dyb3d0aF9ncmFwaCc7XG5pbXBvcnQgU3RhY2tGcmFtZUNvbnZlcnRlciBmcm9tICcuL3N0YWNrX2ZyYW1lX2NvbnZlcnRlcic7XG5pbXBvcnQgUGF0aFRvU3RyaW5nIGZyb20gJy4vcGF0aF90b19zdHJpbmcnO1xuXG50eXBlIFNuYXBzaG90Q2IgPSAoc246IEhlYXBTbmFwc2hvdFBhcnNlcikgPT4gUHJvbWlzZTx2b2lkPjtcblxuZXhwb3J0IGNsYXNzIE9wZXJhdGlvblN0YXRlIHtcbiAgcHVibGljIHJlc3VsdHM6IEJMZWFrUmVzdWx0cyA9IG51bGw7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHB1YmxpYyBjaHJvbWVEcml2ZXI6IENocm9tZURyaXZlcixcbiAgICBwdWJsaWMgcHJvZ3Jlc3NCYXI6IElQcm9ncmVzc0JhcixcbiAgICBwdWJsaWMgY29uZmlnOiBCTGVha0NvbmZpZykge31cbn1cblxuY29uc3QgTkVWRVIgPSBNYXRoLnBvdygyLCAzMCk7XG5cbmFic3RyYWN0IGNsYXNzIE9wZXJhdGlvbiB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgX3RpbWVvdXQ6IG51bWJlciA9IE5FVkVSKSB7fVxuICAvLyBEZXNjcmlwdGlvbiBvZiB0aGUgdGFzayB0aGF0IHRoZSBvcGVyYXRpb24gaXMgcGVyZm9ybWluZy5cbiAgcHVibGljIGFic3RyYWN0IGRlc2NyaXB0aW9uOiBzdHJpbmc7XG4gIC8vIFJldHVybnMgdGhlIHNpemUgb2YgdGhlIG9wZXJhdGlvbnMgZ3JhcGggYmVnaW5uaW5nIHdpdGggdGhpcyBub2RlLlxuICAvLyBEZWZhdWx0IGlzIDEgKG5vIGRlcGVuZGVudCBvcGVyYXRpb25zKVxuICBwdWJsaWMgc2l6ZSgpOiBudW1iZXIgeyByZXR1cm4gMTsgfVxuICAvLyBSZXR1cm5zICd0cnVlJyBpZiB0aGUgb3BlcmF0aW9uIGlzIGZ1bGZpbGxlZCBhbmQgY2FuIGJlIHNraXBwZWQuXG4gIC8vIERlZmF1bHRzIHRvIHVuc2tpcHBhYmxlLlxuICBwdWJsaWMgc2tpcChvcFN0OiBPcGVyYXRpb25TdGF0ZSk6IGJvb2xlYW4geyByZXR1cm4gZmFsc2U7IH1cbiAgLy8gUnVucyB0aGUgb3BlcmF0aW9uLiBQcm9taXNlIGlzIHJlc29sdmVkL3JlamVjdGVkIHdoZW4gY29tcGxldGVkLlxuICBwdWJsaWMgYXN5bmMgcnVuKG9wU3Q6IE9wZXJhdGlvblN0YXRlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgb3BTdC5wcm9ncmVzc0Jhci51cGRhdGVEZXNjcmlwdGlvbih0aGlzLmRlc2NyaXB0aW9uKTtcbiAgICBpZiAodGhpcy5za2lwKG9wU3QpKSB7XG4gICAgICBjb25zdCBzaXplID0gdGhpcy5zaXplKCk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNpemU7IGkrKykge1xuICAgICAgICBvcFN0LnByb2dyZXNzQmFyLm5leHRPcGVyYXRpb24oKTtcbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHRoaXMuX3RpbWVvdXQgPT09IE5FVkVSKSB7XG4gICAgICBhd2FpdCB0aGlzLl9ydW4ob3BTdCk7XG4gICAgICBvcFN0LnByb2dyZXNzQmFyLm5leHRPcGVyYXRpb24oKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGNvbnN0IHRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIGNvbnN0IGUgPSBuZXcgRXJyb3IoYE9wZXJhdGlvbiB0aW1lZCBvdXQuYCk7XG4gICAgICAgIHRoaXMuY2FuY2VsKGUpO1xuICAgICAgICByZWplY3QoZSk7XG4gICAgICB9LCB0aGlzLl90aW1lb3V0KTtcbiAgICAgIHRoaXMuX3J1bihvcFN0KS50aGVuKCgpID0+IHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICAgICAgb3BTdC5wcm9ncmVzc0Jhci5uZXh0T3BlcmF0aW9uKCk7XG4gICAgICAgIHJlc29sdmUoKTtcbiAgICAgIH0pLmNhdGNoKChlKSA9PiB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG4gICAgICAgIHJlamVjdChlKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIC8vIENhbGxlZCB3aGVuIGEgcnVubmluZyBvcGVyYXRpb24gaXMgY2FuY2VsZWQuIE9wZXJhdGlvbiBzaG91bGQgZXhpdCBncmFjZWZ1bGx5LlxuICBwdWJsaWMgY2FuY2VsKGU6IEVycm9yKSB7fVxuXG4gIC8vIEludGVybmFsIGZ1bmN0aW9uIHRoYXQgcmVhbGx5IHJ1bnMgdGhlIG9wZXJhdGlvbi5cbiAgcHJvdGVjdGVkIGFic3RyYWN0IF9ydW4ob3BTdDogT3BlcmF0aW9uU3RhdGUpOiBQcm9taXNlPHZvaWQ+O1xufVxuXG5jbGFzcyBOYXZpZ2F0ZU9wZXJhdGlvbiBleHRlbmRzIE9wZXJhdGlvbiB7XG4gIGNvbnN0cnVjdG9yKHRpbWVvdXQ6IG51bWJlcixcbiAgICAgIHByaXZhdGUgcmVhZG9ubHkgX3VybDogc3RyaW5nKSB7XG4gICAgc3VwZXIodGltZW91dCk7XG4gIH1cblxuICBwdWJsaWMgZ2V0IGRlc2NyaXB0aW9uKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGBOYXZpZ2F0aW5nIHRvICR7dGhpcy5fdXJsfWA7XG4gIH1cblxuICBwcm90ZWN0ZWQgX3J1bihvcFN0OiBPcGVyYXRpb25TdGF0ZSk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiBvcFN0LmNocm9tZURyaXZlci5uYXZpZ2F0ZVRvKHRoaXMuX3VybCk7XG4gIH1cbn1cblxuY2xhc3MgQ2hlY2tPcGVyYXRpb24gZXh0ZW5kcyBPcGVyYXRpb24ge1xuICBwcml2YXRlIF9jYW5jZWxsZWQgPSBmYWxzZTtcbiAgY29uc3RydWN0b3IodGltZW91dDogbnVtYmVyLFxuICAgICAgcHJpdmF0ZSByZWFkb25seSBfc3RlcFR5cGU6IFN0ZXBUeXBlLFxuICAgICAgcHJpdmF0ZSByZWFkb25seSBfaWQ6IG51bWJlcikge1xuICAgIHN1cGVyKHRpbWVvdXQpO1xuICB9XG5cbiAgcHVibGljIGdldCBkZXNjcmlwdGlvbigpOiBzdHJpbmcge1xuICAgIHJldHVybiBgV2FpdGluZyBmb3IgJHt0aGlzLl9zdGVwVHlwZX1bJHt0aGlzLl9pZH1dLmNoZWNrKCkgPT09IHRydWVgO1xuICB9XG5cbiAgcHVibGljIGNhbmNlbChlOiBFcnJvcikge1xuICAgIHRoaXMuX2NhbmNlbGxlZCA9IHRydWU7XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgX3J1bihvcFN0OiBPcGVyYXRpb25TdGF0ZSk6IFByb21pc2U8dm9pZD4ge1xuICAgIC8vIFdhaXQgdW50aWwgZWl0aGVyIHRoZSBvcGVyYXRpb24gaXMgY2FuY2VsZWQgKHRpbWVvdXQpIG9yIHRoZSBjaGVjayBzdWNjZWVkcy5cbiAgICB3aGlsZSAoIXRoaXMuX2NhbmNlbGxlZCkge1xuICAgICAgY29uc3Qgc3VjY2VzcyA9IGF3YWl0IG9wU3QuY2hyb21lRHJpdmVyLnJ1bkNvZGU8Ym9vbGVhbj4oYHR5cGVvZihCTGVha0NvbmZpZykgIT09IFwidW5kZWZpbmVkXCIgJiYgQkxlYWtDb25maWcuJHt0aGlzLl9zdGVwVHlwZX1bJHt0aGlzLl9pZH1dLmNoZWNrKClgKTtcbiAgICAgIGlmIChzdWNjZXNzKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGF3YWl0IHdhaXQoMTAwKTtcbiAgICB9XG4gIH1cbn1cblxuY2xhc3MgTmV4dE9wZXJhdGlvbiBleHRlbmRzIE9wZXJhdGlvbiB7XG4gIGNvbnN0cnVjdG9yKHRpbWVvdXQ6IG51bWJlcixcbiAgICAgIHByaXZhdGUgcmVhZG9ubHkgX3N0ZXBUeXBlOiBTdGVwVHlwZSxcbiAgICAgIHByaXZhdGUgcmVhZG9ubHkgX2lkOiBudW1iZXIpIHtcbiAgICBzdXBlcih0aW1lb3V0KTtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgZGVzY3JpcHRpb24oKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYEFkdmFuY2luZyB0byBuZXh0IHN0YXRlICR7dGhpcy5fc3RlcFR5cGV9WyR7dGhpcy5faWR9XS5uZXh0KClgO1xuICB9XG5cbiAgcHVibGljIGFzeW5jIF9ydW4ob3BTdDogT3BlcmF0aW9uU3RhdGUpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gb3BTdC5jaHJvbWVEcml2ZXIucnVuQ29kZTx2b2lkPihgQkxlYWtDb25maWcuJHt0aGlzLl9zdGVwVHlwZX1bJHt0aGlzLl9pZH1dLm5leHQoKWApO1xuICB9XG59XG5cbmNsYXNzIERlbGF5T3BlcmF0aW9uIGV4dGVuZHMgT3BlcmF0aW9uIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBfZGVsYXk6IG51bWJlcikge1xuICAgIHN1cGVyKCk7XG4gIH1cblxuICBwdWJsaWMgZ2V0IGRlc2NyaXB0aW9uKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGBXYWl0aW5nICR7dGhpcy5fZGVsYXl9IG1zIGJlZm9yZSBwcm9jZWVkaW5nYDtcbiAgfVxuXG4gIHB1YmxpYyBfcnVuKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiB3YWl0KHRoaXMuX2RlbGF5KTtcbiAgfVxufVxuXG5jbGFzcyBUYWtlSGVhcFNuYXBzaG90T3BlcmF0aW9uIGV4dGVuZHMgT3BlcmF0aW9uIHtcbiAgY29uc3RydWN0b3IodGltZW91dDogbnVtYmVyLCBwcml2YXRlIF9zbmFwc2hvdENiOiBTbmFwc2hvdENiKSB7XG4gICAgc3VwZXIodGltZW91dCk7XG4gIH1cblxuICBwdWJsaWMgZ2V0IGRlc2NyaXB0aW9uKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGBUYWtpbmcgYSBoZWFwIHNuYXBzaG90YDtcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBfcnVuKG9wU3Q6IE9wZXJhdGlvblN0YXRlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3Qgc24gPSBvcFN0LmNocm9tZURyaXZlci50YWtlSGVhcFNuYXBzaG90KCk7XG4gICAgcmV0dXJuIHRoaXMuX3NuYXBzaG90Q2Ioc24pO1xuICB9XG59XG5cbmNsYXNzIENvbmZpZ3VyZVByb3h5T3BlcmF0aW9uIGV4dGVuZHMgT3BlcmF0aW9uIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfY29uZmlnOiBJbnRlcmNlcHRvckNvbmZpZykge1xuICAgIHN1cGVyKCk7XG4gIH1cblxuICBwdWJsaWMgZ2V0IGRlc2NyaXB0aW9uKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGBDb25maWd1cmluZyB0aGUgcHJveHlgO1xuICB9XG5cbiAgcHVibGljIGFzeW5jIF9ydW4ob3BTdDogT3BlcmF0aW9uU3RhdGUpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLl9jb25maWcubG9nID0gb3BTdC5wcm9ncmVzc0JhcjtcbiAgICBvcFN0LmNocm9tZURyaXZlci5taXRtUHJveHkuY2IgPSBnZXRJbnRlcmNlcHRvcih0aGlzLl9jb25maWcpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNvdW50T3BlcmF0aW9ucyhzdW1Tb0ZhcjogbnVtYmVyLCBuZXh0OiBPcGVyYXRpb24pOiBudW1iZXIge1xuICByZXR1cm4gc3VtU29GYXIgKyBuZXh0LnNpemUoKTtcbn1cblxuYWJzdHJhY3QgY2xhc3MgQ29tcG9zaXRlT3BlcmF0aW9uIGV4dGVuZHMgT3BlcmF0aW9uIHtcbiAgcHJvdGVjdGVkIGNoaWxkcmVuOiBPcGVyYXRpb25bXSA9IFtdO1xuICBwcml2YXRlIF9jYW5jZWxlZEVycm9yOiBFcnJvciA9IG51bGw7XG4gIHB1YmxpYyBzaXplKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuY2hpbGRyZW4ucmVkdWNlKGNvdW50T3BlcmF0aW9ucywgMSk7XG4gIH1cblxuICBwdWJsaWMgY2FuY2VsKGU6IEVycm9yKTogdm9pZCB7XG4gICAgdGhpcy5fY2FuY2VsZWRFcnJvciA9IGU7XG4gIH1cblxuICBwcm90ZWN0ZWQgYXN5bmMgX3J1bihvcFN0OiBPcGVyYXRpb25TdGF0ZSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGxldCBwcm9taXNlID0gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgbGV0IGkgPSAwO1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuICAgIGZ1bmN0aW9uIHJ1bk5leHQoKTogUHJvbWlzZTx2b2lkPiB8IHZvaWQge1xuICAgICAgaWYgKHNlbGYuX2NhbmNlbGVkRXJyb3IpIHtcbiAgICAgICAgdGhyb3cgc2VsZi5fY2FuY2VsZWRFcnJvcjtcbiAgICAgIH1cbiAgICAgIGlmIChpIDwgc2VsZi5jaGlsZHJlbi5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIHNlbGYuY2hpbGRyZW5baSsrXS5ydW4ob3BTdCk7XG4gICAgICB9XG4gICAgfVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgcHJvbWlzZSA9IHByb21pc2UudGhlbihydW5OZXh0KTtcbiAgICB9XG4gICAgcmV0dXJuIHByb21pc2U7XG4gIH1cbn1cblxuY2xhc3MgU3RlcE9wZXJhdGlvbiBleHRlbmRzIENvbXBvc2l0ZU9wZXJhdGlvbiB7XG4gIGNvbnN0cnVjdG9yKGNvbmZpZzogQkxlYWtDb25maWcsIHN0ZXBUeXBlOiBTdGVwVHlwZSwgaWQ6IG51bWJlcikge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5jaGlsZHJlbi5wdXNoKG5ldyBDaGVja09wZXJhdGlvbihjb25maWcudGltZW91dCwgc3RlcFR5cGUsIGlkKSk7XG4gICAgaWYgKGNvbmZpZy5wb3N0Q2hlY2tTbGVlcCkge1xuICAgICAgdGhpcy5jaGlsZHJlbi5wdXNoKG5ldyBEZWxheU9wZXJhdGlvbihjb25maWcucG9zdENoZWNrU2xlZXApKTtcbiAgICB9XG4gICAgdGhpcy5jaGlsZHJlbi5wdXNoKG5ldyBOZXh0T3BlcmF0aW9uKGNvbmZpZy50aW1lb3V0LCBzdGVwVHlwZSwgaWQpKTtcbiAgICBpZiAoY29uZmlnLnBvc3ROZXh0U2xlZXApIHtcbiAgICAgIHRoaXMuY2hpbGRyZW4ucHVzaChuZXcgRGVsYXlPcGVyYXRpb24oY29uZmlnLnBvc3ROZXh0U2xlZXApKTtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgZ2V0IGRlc2NyaXB0aW9uKCkgeyByZXR1cm4gJyc7IH1cbn1cblxuY2xhc3MgSW5zdHJ1bWVudEdyb3dpbmdQYXRoc09wZXJhdGlvbiBleHRlbmRzIE9wZXJhdGlvbiB7XG4gIHB1YmxpYyBnZXQgZGVzY3JpcHRpb24oKSB7XG4gICAgcmV0dXJuIGBJbnN0cnVtZW50aW5nIGdyb3dpbmcgb2JqZWN0c2A7XG4gIH1cblxuICBwdWJsaWMgX3J1bihvcFN0OiBPcGVyYXRpb25TdGF0ZSk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiBvcFN0LmNocm9tZURyaXZlci5ydW5Db2RlPHZvaWQ+KGB3aW5kb3cuJCQkSU5TVFJVTUVOVF9QQVRIUyQkJCgke0pTT04uc3RyaW5naWZ5KHRvUGF0aFRyZWUob3BTdC5yZXN1bHRzLmxlYWtzKSl9KWApO1xuICB9XG59XG5cbmNsYXNzIFN0ZXBTZXJpZXNPcGVyYXRpb24gZXh0ZW5kcyBDb21wb3NpdGVPcGVyYXRpb24ge1xuICBjb25zdHJ1Y3Rvcihjb25maWc6IEJMZWFrQ29uZmlnLCBzdGVwVHlwZTogU3RlcFR5cGUpIHtcbiAgICBzdXBlcigpO1xuICAgIGNvbnN0IHN0ZXBzID0gY29uZmlnW3N0ZXBUeXBlXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHN0ZXBzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB0aGlzLmNoaWxkcmVuLnB1c2goXG4gICAgICAgIG5ldyBTdGVwT3BlcmF0aW9uKGNvbmZpZywgc3RlcFR5cGUsIGkpKTtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgZ2V0IGRlc2NyaXB0aW9uKCk6IHN0cmluZyB7IHJldHVybiAnJzsgfVxufVxuXG5jbGFzcyBQcm9ncmFtUnVuT3BlcmF0aW9uIGV4dGVuZHMgQ29tcG9zaXRlT3BlcmF0aW9uIHtcbiAgY29uc3RydWN0b3IoY29uZmlnOiBCTGVha0NvbmZpZywgcnVuTG9naW46IGJvb2xlYW4sIGl0ZXJhdGlvbnM6IG51bWJlciwgdGFrZUluaXRpYWxTbmFwc2hvdDogYm9vbGVhbiwgc25hcHNob3RDYj86IFNuYXBzaG90Q2IpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuY2hpbGRyZW4ucHVzaChuZXcgTmF2aWdhdGVPcGVyYXRpb24oY29uZmlnLnRpbWVvdXQsIGNvbmZpZy51cmwpKTtcbiAgICBpZiAocnVuTG9naW4gJiYgY29uZmlnLmxvZ2luLmxlbmd0aCA+IDApIHtcbiAgICAgIHRoaXMuY2hpbGRyZW4ucHVzaChcbiAgICAgICAgbmV3IFN0ZXBTZXJpZXNPcGVyYXRpb24oY29uZmlnLCAnbG9naW4nKSxcbiAgICAgICAgbmV3IERlbGF5T3BlcmF0aW9uKGNvbmZpZy5wb3N0TG9naW5TbGVlcCksXG4gICAgICAgIG5ldyBOYXZpZ2F0ZU9wZXJhdGlvbihjb25maWcudGltZW91dCwgY29uZmlnLnVybClcbiAgICAgICk7XG4gICAgfVxuICAgIGlmIChjb25maWcuc2V0dXAubGVuZ3RoID4gMCkge1xuICAgICAgdGhpcy5jaGlsZHJlbi5wdXNoKFxuICAgICAgICBuZXcgU3RlcFNlcmllc09wZXJhdGlvbihjb25maWcsICdzZXR1cCcpXG4gICAgICApO1xuICAgIH1cbiAgICBpZiAodGFrZUluaXRpYWxTbmFwc2hvdCAmJiBzbmFwc2hvdENiKSB7XG4gICAgICB0aGlzLmNoaWxkcmVuLnB1c2goXG4gICAgICAgIC8vIE1ha2Ugc3VyZSB3ZSdyZSBhdCBzdGVwIDAgYmVmb3JlIHRha2luZyB0aGUgc25hcHNob3QuXG4gICAgICAgIG5ldyBDaGVja09wZXJhdGlvbihjb25maWcudGltZW91dCwgJ2xvb3AnLCAwKSk7XG4gICAgICBpZiAoY29uZmlnLnBvc3RDaGVja1NsZWVwKSB7XG4gICAgICAgIHRoaXMuY2hpbGRyZW4ucHVzaChuZXcgRGVsYXlPcGVyYXRpb24oY29uZmlnLnBvc3RDaGVja1NsZWVwKSk7XG4gICAgICB9XG4gICAgICB0aGlzLmNoaWxkcmVuLnB1c2gobmV3IFRha2VIZWFwU25hcHNob3RPcGVyYXRpb24oY29uZmlnLnRpbWVvdXQsIHNuYXBzaG90Q2IpKTtcbiAgICB9XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpdGVyYXRpb25zOyBpKyspIHtcbiAgICAgIHRoaXMuY2hpbGRyZW4ucHVzaChcbiAgICAgICAgbmV3IFN0ZXBTZXJpZXNPcGVyYXRpb24oY29uZmlnLCAnbG9vcCcpLFxuICAgICAgICAvLyBNYWtlIHN1cmUgd2UncmUgYXQgc3RlcCAwIGJlZm9yZSB0YWtpbmcgdGhlIHNuYXBzaG90LlxuICAgICAgICBuZXcgQ2hlY2tPcGVyYXRpb24oY29uZmlnLnRpbWVvdXQsICdsb29wJywgMClcbiAgICAgICk7XG4gICAgICBpZiAoY29uZmlnLnBvc3RDaGVja1NsZWVwKSB7XG4gICAgICAgIHRoaXMuY2hpbGRyZW4ucHVzaChuZXcgRGVsYXlPcGVyYXRpb24oY29uZmlnLnBvc3RDaGVja1NsZWVwKSk7XG4gICAgICB9XG4gICAgICBpZiAoc25hcHNob3RDYikge1xuICAgICAgICB0aGlzLmNoaWxkcmVuLnB1c2goXG4gICAgICAgICAgbmV3IFRha2VIZWFwU25hcHNob3RPcGVyYXRpb24oY29uZmlnLnRpbWVvdXQsIHNuYXBzaG90Q2IpXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHVibGljIGdldCBkZXNjcmlwdGlvbigpIHsgcmV0dXJuICdSdW5uaW5nIHRocm91Z2ggdGhlIHByb2dyYW0nOyB9XG59XG5cbmNsYXNzIEZpbmRMZWFrcyBleHRlbmRzIENvbXBvc2l0ZU9wZXJhdGlvbiB7XG4gIHByaXZhdGUgcmVhZG9ubHkgX2dyb3d0aFRyYWNrZXIgPSBuZXcgSGVhcEdyb3d0aFRyYWNrZXIoKTtcbiAgcHJpdmF0ZSBfaGVhcFNuYXBzaG90U2l6ZVN0YXRzOiBTbmFwc2hvdFNpemVTdW1tYXJ5W10gPSBbXTtcbiAgY29uc3RydWN0b3IoY29uZmlnOiBCTGVha0NvbmZpZywgcHJpdmF0ZSBfc25hcHNob3RDYjogU25hcHNob3RDYikge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5jaGlsZHJlbi5wdXNoKFxuICAgICAgbmV3IENvbmZpZ3VyZVByb3h5T3BlcmF0aW9uKHtcbiAgICAgICAgbG9nOiBudWxsLFxuICAgICAgICByZXdyaXRlOiBmYWxzZSxcbiAgICAgICAgZml4ZXM6IGNvbmZpZy5maXhlZExlYWtzLFxuICAgICAgICBkaXNhYmxlQWxsUmV3cml0ZXM6IGZhbHNlLFxuICAgICAgICBmaXhSZXdyaXRlRnVuY3Rpb246IGNvbmZpZy5yZXdyaXRlLFxuICAgICAgICBjb25maWc6IGNvbmZpZy5nZXRCcm93c2VySW5qZWN0aW9uKClcbiAgICAgIH0pLFxuICAgICAgbmV3IFByb2dyYW1SdW5PcGVyYXRpb24oY29uZmlnLCB0cnVlLCBjb25maWcuaXRlcmF0aW9ucywgZmFsc2UsIGFzeW5jIChzbjogSGVhcFNuYXBzaG90UGFyc2VyKSA9PiB7XG4gICAgICAgIHRoaXMuX3NuYXBzaG90Q2Ioc24pO1xuICAgICAgICBhd2FpdCB0aGlzLl9ncm93dGhUcmFja2VyLmFkZFNuYXBzaG90KHNuKTtcbiAgICAgICAgdGhpcy5faGVhcFNuYXBzaG90U2l6ZVN0YXRzLnB1c2godGhpcy5fZ3Jvd3RoVHJhY2tlci5nZXRHcmFwaCgpLmNhbGN1bGF0ZVNpemUoKSk7XG4gICAgICB9KVxuICAgICk7XG4gIH1cblxuICBwdWJsaWMgZ2V0IGRlc2NyaXB0aW9uKCkgeyByZXR1cm4gJ0xvY2F0aW5nIGxlYWtzJzsgfVxuXG4gIHB1YmxpYyBza2lwKG9wU3Q6IE9wZXJhdGlvblN0YXRlKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuICEhb3BTdC5yZXN1bHRzO1xuICB9XG5cbiAgcHJvdGVjdGVkIGFzeW5jIF9ydW4ob3BTdDogT3BlcmF0aW9uU3RhdGUpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCBzdXBlci5fcnVuKG9wU3QpO1xuICAgIG9wU3QucmVzdWx0cyA9IG5ldyBCTGVha1Jlc3VsdHModGhpcy5fZ3Jvd3RoVHJhY2tlci5maW5kTGVha1BhdGhzKCksIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB0aGlzLl9oZWFwU25hcHNob3RTaXplU3RhdHMpO1xuICB9XG59XG5cbmNsYXNzIEdldEdyb3d0aFN0YWNrc09wZXJhdGlvbiBleHRlbmRzIE9wZXJhdGlvbiB7XG4gIGNvbnN0cnVjdG9yKHRpbWVvdXQ6IG51bWJlcikge1xuICAgIHN1cGVyKHRpbWVvdXQpO1xuICB9XG5cbiAgcHVibGljIGdldCBkZXNjcmlwdGlvbigpIHsgcmV0dXJuICdSZXRyaWV2aW5nIHN0YWNrIHRyYWNlcyc7IH1cblxuICBwcm90ZWN0ZWQgYXN5bmMgX3J1bihvcFN0OiBPcGVyYXRpb25TdGF0ZSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHRyYWNlcyA9IGF3YWl0IG9wU3QuY2hyb21lRHJpdmVyLnJ1bkNvZGU8R3Jvd2luZ1N0YWNrVHJhY2VzPihgd2luZG93LiQkJEdFVF9TVEFDS19UUkFDRVMkJCQoKWApO1xuICAgIGNvbnN0IGdyb3d0aFN0YWNrcyA9IFN0YWNrRnJhbWVDb252ZXJ0ZXIuQ29udmVydEdyb3d0aFN0YWNrcyhvcFN0LmNocm9tZURyaXZlci5taXRtUHJveHksIG9wU3QuY29uZmlnLnVybCwgb3BTdC5yZXN1bHRzLCB0cmFjZXMpO1xuICAgIG9wU3QucmVzdWx0cy5sZWFrcy5mb3JFYWNoKChscikgPT4ge1xuICAgICAgY29uc3QgaW5kZXggPSBsci5pZDtcbiAgICAgIGNvbnN0IHN0YWNrcyA9IGdyb3d0aFN0YWNrc1tpbmRleF0gfHwgW107XG4gICAgICBzdGFja3MuZm9yRWFjaCgocykgPT4ge1xuICAgICAgICBsci5hZGRTdGFja1RyYWNlKHMpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbn1cblxuY2xhc3MgRGlhZ25vc2VMZWFrcyBleHRlbmRzIENvbXBvc2l0ZU9wZXJhdGlvbiB7XG4gIGNvbnN0cnVjdG9yKGNvbmZpZzogQkxlYWtDb25maWcsIGlzTG9nZ2VkSW46IGJvb2xlYW4pIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuY2hpbGRyZW4ucHVzaChcbiAgICAgIG5ldyBDb25maWd1cmVQcm94eU9wZXJhdGlvbih7XG4gICAgICAgIGxvZzogbnVsbCxcbiAgICAgICAgcmV3cml0ZTogdHJ1ZSxcbiAgICAgICAgZml4ZXM6IGNvbmZpZy5maXhlZExlYWtzLFxuICAgICAgICBjb25maWc6IGNvbmZpZy5nZXRCcm93c2VySW5qZWN0aW9uKCksXG4gICAgICAgIGZpeFJld3JpdGVGdW5jdGlvbjogY29uZmlnLnJld3JpdGVcbiAgICAgIH0pLFxuICAgICAgLy8gV2FybXVwXG4gICAgICBuZXcgUHJvZ3JhbVJ1bk9wZXJhdGlvbihjb25maWcsICFpc0xvZ2dlZEluLCAxLCBmYWxzZSksXG4gICAgICBuZXcgSW5zdHJ1bWVudEdyb3dpbmdQYXRoc09wZXJhdGlvbihjb25maWcudGltZW91dCksXG4gICAgICBuZXcgU3RlcFNlcmllc09wZXJhdGlvbihjb25maWcsICdsb29wJyksXG4gICAgICBuZXcgU3RlcFNlcmllc09wZXJhdGlvbihjb25maWcsICdsb29wJyksXG4gICAgICBuZXcgR2V0R3Jvd3RoU3RhY2tzT3BlcmF0aW9uKGNvbmZpZy50aW1lb3V0KVxuICAgICk7XG4gIH1cblxuICBwdWJsaWMgZ2V0IGRlc2NyaXB0aW9uKCkgeyByZXR1cm4gJ0RpYWdub3NpbmcgbGVha3MnOyB9XG5cbiAgcHVibGljIHNraXAob3BTdDogT3BlcmF0aW9uU3RhdGUpOiBib29sZWFuIHtcbiAgICByZXR1cm4gb3BTdC5yZXN1bHRzLmxlYWtzLmxlbmd0aCA9PT0gMDtcbiAgfVxuXG4gIHByb3RlY3RlZCBhc3luYyBfcnVuKG9wU3Q6IE9wZXJhdGlvblN0YXRlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgc3VwZXIuX3J1bihvcFN0KTtcbiAgICBvcFN0LnJlc3VsdHMgPSBvcFN0LnJlc3VsdHMuY29tcGFjdCgpO1xuICB9XG59XG5cbi8qKlxuICogQSBzcGVjaWZpYyBCTGVhayBjb25maWd1cmF0aW9uIHVzZWQgZHVyaW5nIHJhbmtpbmcgbWV0cmljIGV2YWx1YXRpb24uXG4gKiBTaW5jZSBtZXRyaWNzIG1heSBzaGFyZSBzcGVjaWZpYyBjb25maWd1cmF0aW9ucywgdGhpcyBjb250YWlucyBhIGJvb2xlYW5cbiAqIGluZGljYXRpbmcgd2hpY2ggbWV0cmljcyB0aGlzIGNvbmZpZ3VyYXRpb24gYXBwbGllcyB0by5cbiAqL1xuY2xhc3MgUmFua2luZ0V2YWxDb25maWcge1xuICBwdWJsaWMgbGVha1NoYXJlOiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyByZXRhaW5lZFNpemU6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHVibGljIHRyYW5zaXRpdmVDbG9zdXJlU2l6ZTogYm9vbGVhbiA9IGZhbHNlO1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgcmVhZG9ubHkgZml4SWRzOiBudW1iZXJbXSkge31cbiAgcHVibGljIG1ldHJpY3MoKTogc3RyaW5nIHtcbiAgICBsZXQgcnY6IHN0cmluZ1tdID0gW107XG4gICAgZm9yIChsZXQgbWV0cmljIG9mIFsnbGVha1NoYXJlJywgJ3JldGFpbmVkU2l6ZScsICd0cmFuc2l0aXZlQ2xvc3VyZVNpemUnXSkge1xuICAgICAgaWYgKHRoaXNbbWV0cmljIGFzICdsZWFrU2hhcmUnXSkge1xuICAgICAgICBydi5wdXNoKG1ldHJpYyk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBydi5qb2luKCcsICcpO1xuICB9XG59XG5cbi8qKlxuICogR2l2ZW4gYSBzZXQgb2YgbGVha3MsIHJldHVybiBhIHVuaXF1ZSBrZXkuXG4gKiBAcGFyYW0gc2V0XG4gKi9cbmZ1bmN0aW9uIGxlYWtTZXRLZXkoc2V0OiBudW1iZXJbXSk6IHN0cmluZyB7XG4gIC8vIENhbm9uaWNhbGl6ZSBvcmRlciwgdGhlbiBwcm9kdWNlIHN0cmluZy5cbiAgcmV0dXJuIHNldC5zb3J0KGluY3JlYXNpbmdTb3J0KS5qb2luKCcsJyk7XG59XG5cbmZ1bmN0aW9uIGluY3JlYXNpbmdTb3J0KGE6IG51bWJlciwgYjogbnVtYmVyKTogbnVtYmVyIHtcbiAgcmV0dXJuIGEgLSBiO1xufVxuXG5jbGFzcyBFdmFsdWF0ZVJhbmtpbmdNZXRyaWNQcm9ncmFtUnVuT3BlcmF0aW9uIGV4dGVuZHMgQ29tcG9zaXRlT3BlcmF0aW9uIHtcbiAgcHJpdmF0ZSBfYnVmZmVyOiBTbmFwc2hvdFNpemVTdW1tYXJ5W10gPSBbXTtcbiAgY29uc3RydWN0b3IoXG4gICAgICBjb25maWc6IEJMZWFrQ29uZmlnLFxuICAgICAgcHJpdmF0ZSBfcmFua2luZ0V2YWxDb25maWc6IFJhbmtpbmdFdmFsQ29uZmlnLFxuICAgICAgcHJpdmF0ZSBfcnVuTnVtYmVyOiBudW1iZXIsXG4gICAgICBwcml2YXRlIF9mbHVzaFJlc3VsdHM6IChyZXN1bHRzOiBCTGVha1Jlc3VsdHMpID0+IHZvaWQsXG4gICAgICBzbmFwc2hvdENiPzogKHNzOiBIZWFwU25hcHNob3RQYXJzZXIsIG1ldHJpYzogc3RyaW5nLCBsZWFrc0ZpeGVkOiBudW1iZXIsIGl0ZXJhdGlvbjogbnVtYmVyKSA9PiBQcm9taXNlPHZvaWQ+KSB7XG4gICAgc3VwZXIoKTtcbiAgICBjb25zdCBidWZmZXIgPSB0aGlzLl9idWZmZXI7XG4gICAgYXN5bmMgZnVuY3Rpb24gc25hcHNob3RSZXBvcnQoc246IEhlYXBTbmFwc2hvdFBhcnNlcik6IFByb21pc2U8dm9pZD4ge1xuICAgICAgY29uc3QgZyA9IGF3YWl0IEhlYXBHcmFwaC5Db25zdHJ1Y3Qoc24pO1xuICAgICAgY29uc3Qgc2l6ZSA9IGcuY2FsY3VsYXRlU2l6ZSgpO1xuICAgICAgYnVmZmVyLnB1c2goc2l6ZSk7XG4gICAgfVxuICAgIHRoaXMuY2hpbGRyZW4ucHVzaChcbiAgICAgIG5ldyBDb25maWd1cmVQcm94eU9wZXJhdGlvbih7XG4gICAgICAgIGxvZzogbnVsbCxcbiAgICAgICAgcmV3cml0ZTogZmFsc2UsXG4gICAgICAgIGZpeGVzOiBfcmFua2luZ0V2YWxDb25maWcuZml4SWRzLFxuICAgICAgICBkaXNhYmxlQWxsUmV3cml0ZXM6IHRydWUsXG4gICAgICAgIGZpeFJld3JpdGVGdW5jdGlvbjogY29uZmlnLnJld3JpdGUsXG4gICAgICAgIGNvbmZpZzogY29uZmlnLmdldEJyb3dzZXJJbmplY3Rpb24oKVxuICAgICAgfSksXG4gICAgICBuZXcgUHJvZ3JhbVJ1bk9wZXJhdGlvbihjb25maWcsIGZhbHNlLCBjb25maWcucmFua2luZ0V2YWx1YXRpb25JdGVyYXRpb25zLCB0cnVlLCAoc24pID0+IHtcbiAgICAgICAgc25hcHNob3RDYihzbiwgdGhpcy5fcmFua2luZ0V2YWxDb25maWcubWV0cmljcygpLCB0aGlzLl9yYW5raW5nRXZhbENvbmZpZy5maXhJZHMubGVuZ3RoLCB0aGlzLl9ydW5OdW1iZXIpO1xuICAgICAgICByZXR1cm4gc25hcHNob3RSZXBvcnQoc24pO1xuICAgICAgfSlcbiAgICApO1xuICB9XG5cbiAgcHVibGljIGdldCBkZXNjcmlwdGlvbigpIHsgcmV0dXJuICdSdW5uaW5nIHByb2dyYW0gaW4gYSBjb25maWd1cmF0aW9uLi4uJyB9XG5cbiAgcHVibGljIHNraXAob3BTdDogT3BlcmF0aW9uU3RhdGUpIHtcbiAgICBjb25zdCBsZW4gPSB0aGlzLl9yYW5raW5nRXZhbENvbmZpZy5maXhJZHMubGVuZ3RoO1xuICAgIGZvciAobGV0IG1ldHJpYyBvZiBbJ2xlYWtTaGFyZScsICdyZXRhaW5lZFNpemUnLCAndHJhbnNpdGl2ZUNsb3N1cmVTaXplJ10pIHtcbiAgICAgIGlmICh0aGlzLl9yYW5raW5nRXZhbENvbmZpZ1ttZXRyaWMgYXMgJ2xlYWtTaGFyZSddKSB7XG4gICAgICAgIGNvbnN0IG1ldHJpY1N0YXRzID0gb3BTdC5yZXN1bHRzLnJhbmtpbmdFdmFsdWF0aW9uW21ldHJpYyBhcyAnbGVha1NoYXJlJ107XG4gICAgICAgIGlmICghbWV0cmljU3RhdHMpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY29uZmlnU3RhdHMgPSBtZXRyaWNTdGF0c1tsZW5dO1xuICAgICAgICBpZiAoIWNvbmZpZ1N0YXRzKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJ1blN0YXRzID0gY29uZmlnU3RhdHNbdGhpcy5fcnVuTnVtYmVyXTtcbiAgICAgICAgaWYgKCFydW5TdGF0cykge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHByb3RlY3RlZCBhc3luYyBfcnVuKG9wU3Q6IE9wZXJhdGlvblN0YXRlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgc3VwZXIuX3J1bihvcFN0KTtcbiAgICAvLyBVcGRhdGUgcmVzdWx0cyB3LyBkYXRhIGZyb20gcnVuLlxuICAgIFsnbGVha1NoYXJlJywgJ3JldGFpbmVkU2l6ZScsICd0cmFuc2l0aXZlQ2xvc3VyZVNpemUnXS5mb3JFYWNoKChtZXRyaWM6ICdsZWFrU2hhcmUnKSA9PiB7XG4gICAgICBpZiAoIXRoaXMuX3JhbmtpbmdFdmFsQ29uZmlnW21ldHJpY10pIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgY29uc3QgbWV0cmljUmVzdWx0cyA9IG9wU3QucmVzdWx0cy5yYW5raW5nRXZhbHVhdGlvblttZXRyaWNdO1xuICAgICAgbGV0IGNvbmZpZ1J1bnMgPSBtZXRyaWNSZXN1bHRzW3RoaXMuX3JhbmtpbmdFdmFsQ29uZmlnLmZpeElkcy5sZW5ndGhdO1xuICAgICAgaWYgKCFjb25maWdSdW5zKSB7XG4gICAgICAgIGNvbmZpZ1J1bnMgPSBtZXRyaWNSZXN1bHRzW3RoaXMuX3JhbmtpbmdFdmFsQ29uZmlnLmZpeElkcy5sZW5ndGhdID0gW107XG4gICAgICB9XG4gICAgICBjb25maWdSdW5zW3RoaXMuX3J1bk51bWJlcl0gPSB0aGlzLl9idWZmZXIuc2xpY2UoMCk7XG4gICAgfSk7XG4gICAgdGhpcy5fZmx1c2hSZXN1bHRzKG9wU3QucmVzdWx0cyk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEV2YWx1YXRlUmFua2luZ01ldHJpY3NPcGVyYXRpb24gZXh0ZW5kcyBDb21wb3NpdGVPcGVyYXRpb24ge1xuICBjb25zdHJ1Y3Rvcihjb25maWc6IEJMZWFrQ29uZmlnLCByZXN1bHRzOiBCTGVha1Jlc3VsdHMsIGZsdXNoUmVzdWx0czogKHJlc3VsdHM6IEJMZWFrUmVzdWx0cykgPT4gdm9pZCwgc25hcHNob3RDYj86IChzczogSGVhcFNuYXBzaG90UGFyc2VyLCBtZXRyaWM6IHN0cmluZywgbGVha3NGaXhlZDogbnVtYmVyLCBpdGVyYXRpb246IG51bWJlcikgPT4gUHJvbWlzZTx2b2lkPikge1xuICAgIHN1cGVyKCk7XG4gICAgZnVuY3Rpb24gZ2V0U29ydGVyKHJhbmtCeTogXCJ0cmFuc2l0aXZlQ2xvc3VyZVNpemVcIiB8IFwibGVha1NoYXJlXCIgfCBcInJldGFpbmVkU2l6ZVwiIHwgXCJvd25lZE9iamVjdHNcIik6IChhOiBudW1iZXIsIGI6IG51bWJlcikgPT4gbnVtYmVyIHtcbiAgICAgIHJldHVybiAoYSwgYikgPT4ge1xuICAgICAgICByZXR1cm4gcmVzdWx0cy5sZWFrc1tiXS5zY29yZXNbcmFua0J5XSAtIHJlc3VsdHMubGVha3NbYV0uc2NvcmVzW3JhbmtCeV07XG4gICAgICB9O1xuICAgIH1cbiAgICBmdW5jdGlvbiBmaXhNYXBwZXIobGVha0lkOiBudW1iZXIpOiBudW1iZXIge1xuICAgICAgY29uc3Qgc3RyID0gUGF0aFRvU3RyaW5nKHJlc3VsdHMubGVha3NbbGVha0lkXS5wYXRoc1swXSk7XG4gICAgICBjb25zdCBmaXhJZCA9IGNvbmZpZy5maXhNYXBbc3RyXTtcbiAgICAgIGlmIChmaXhJZCA9PT0gdW5kZWZpbmVkIHx8IGZpeElkID09PSBudWxsKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5hYmxlIHRvIGZpbmQgZml4IElEIGZvciAke3N0cn0uYCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZml4SWQ7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHJlbW92ZUR1cGVzKHVuaXF1ZTogbnVtYmVyW10sIGZpeElkOiBudW1iZXIpOiBudW1iZXJbXSB7XG4gICAgICBpZiAodW5pcXVlLmluZGV4T2YoZml4SWQpID09PSAtMSkge1xuICAgICAgICB1bmlxdWUucHVzaChmaXhJZCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdW5pcXVlO1xuICAgIH1cbiAgICAvLyBGaWd1cmUgb3V0IHdoaWNoIHJ1bnMgYXJlIGNvbXBsZXRlZCBhbmQgaW4gdGhlIHJlc3VsdHMgZmlsZSxcbiAgICBjb25zdCBjb25maWdzVG9UZXN0ID0gbmV3IE1hcDxzdHJpbmcsIFJhbmtpbmdFdmFsQ29uZmlnPigpO1xuICAgIGNvbnN0IGxlYWtzQnlJZCA9IHJlc3VsdHMubGVha3MubWFwKChsLCBpKSA9PiBpKTtcbiAgICAvLyBNYXAgZnJvbSBtZXRyaWMgPT4gbGlzdCBvZiBmaXhlcyB0byBhcHBseSwgaW4tb3JkZXIuXG4gICAgY29uc3Qgb3JkZXJzID0ge1xuICAgICAgJ2xlYWtTaGFyZSc6IGxlYWtzQnlJZC5zb3J0KGdldFNvcnRlcignbGVha1NoYXJlJykpLm1hcChmaXhNYXBwZXIpLnJlZHVjZShyZW1vdmVEdXBlcywgW10pLFxuICAgICAgJ3JldGFpbmVkU2l6ZSc6IGxlYWtzQnlJZC5zb3J0KGdldFNvcnRlcigncmV0YWluZWRTaXplJykpLm1hcChmaXhNYXBwZXIpLnJlZHVjZShyZW1vdmVEdXBlcywgW10pLFxuICAgICAgJ3RyYW5zaXRpdmVDbG9zdXJlU2l6ZSc6IGxlYWtzQnlJZC5zb3J0KGdldFNvcnRlcigndHJhbnNpdGl2ZUNsb3N1cmVTaXplJykpLm1hcChmaXhNYXBwZXIpLnJlZHVjZShyZW1vdmVEdXBlcywgW10pXG4gICAgfTtcbiAgICBmb3IgKGxldCBtZXRyaWMgaW4gb3JkZXJzKSB7XG4gICAgICBpZiAob3JkZXJzLmhhc093blByb3BlcnR5KG1ldHJpYykpIHtcbiAgICAgICAgY29uc3QgbWV0cmljQ2FzdCA9IDwnbGVha1NoYXJlJyB8ICdyZXRhaW5lZFNpemUnIHwgJ3RyYW5zaXRpdmVDbG9zdXJlU2l6ZSc+IG1ldHJpYztcbiAgICAgICAgY29uc3Qgb3JkZXIgPSBvcmRlcnNbbWV0cmljQ2FzdF07XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDw9IG9yZGVyLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgLy8gTm90ZTogV2hlbiBpPTAsIHRoaXMgaXMgdGhlIGVtcHR5IGFycmF5IC0tIHRoZSBiYXNlIGNhc2UuXG4gICAgICAgICAgY29uc3QgY29uZmlnT3JkZXIgPSBvcmRlci5zbGljZSgwLCBpKTtcbiAgICAgICAgICBjb25zdCBrZXkgPSBsZWFrU2V0S2V5KGNvbmZpZ09yZGVyKTtcbiAgICAgICAgICBsZXQgY29uZmlnID0gY29uZmlnc1RvVGVzdC5nZXQoa2V5KTtcbiAgICAgICAgICBpZiAoIWNvbmZpZykge1xuICAgICAgICAgICAgY29uZmlnID0gbmV3IFJhbmtpbmdFdmFsQ29uZmlnKGNvbmZpZ09yZGVyKTtcbiAgICAgICAgICAgIGNvbmZpZ3NUb1Rlc3Quc2V0KGtleSwgY29uZmlnKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uZmlnW21ldHJpY0Nhc3RdID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBsZXQgY29uZmlnczogUmFua2luZ0V2YWxDb25maWdbXSA9IFtdO1xuICAgIGNvbmZpZ3NUb1Rlc3QuZm9yRWFjaCgoY29uZmlnKSA9PiB7XG4gICAgICBjb25maWdzLnB1c2goY29uZmlnKTtcbiAgICB9KTtcbiAgICAvLyBOb3cgd2UgY2FuIG1ha2UgdGhlc2UgcnVuIVxuICAgIGlmIChjb25maWcubG9naW4pIHtcbiAgICAgIHRoaXMuY2hpbGRyZW4ucHVzaChcbiAgICAgICAgbmV3IENvbmZpZ3VyZVByb3h5T3BlcmF0aW9uKHtcbiAgICAgICAgICBsb2c6IG51bGwsXG4gICAgICAgICAgcmV3cml0ZTogZmFsc2UsXG4gICAgICAgICAgZml4ZXM6IFtdLFxuICAgICAgICAgIGRpc2FibGVBbGxSZXdyaXRlczogdHJ1ZSxcbiAgICAgICAgICBmaXhSZXdyaXRlRnVuY3Rpb246IGNvbmZpZy5yZXdyaXRlLFxuICAgICAgICAgIGNvbmZpZzogY29uZmlnLmdldEJyb3dzZXJJbmplY3Rpb24oKVxuICAgICAgICB9KSxcbiAgICAgICAgbmV3IE5hdmlnYXRlT3BlcmF0aW9uKGNvbmZpZy50aW1lb3V0LCBjb25maWcudXJsKSxcbiAgICAgICAgbmV3IFN0ZXBTZXJpZXNPcGVyYXRpb24oY29uZmlnLCAnbG9naW4nKSxcbiAgICAgICAgbmV3IERlbGF5T3BlcmF0aW9uKGNvbmZpZy5wb3N0TG9naW5TbGVlcClcbiAgICAgICk7XG4gICAgfVxuICAgIGZvciAoY29uc3QgcmFua2luZ0NvbmZpZyBvZiBjb25maWdzKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbmZpZy5yYW5raW5nRXZhbHVhdGlvblJ1bnM7IGkrKykge1xuICAgICAgICB0aGlzLmNoaWxkcmVuLnB1c2goXG4gICAgICAgICAgbmV3IEV2YWx1YXRlUmFua2luZ01ldHJpY1Byb2dyYW1SdW5PcGVyYXRpb24oXG4gICAgICAgICAgICBjb25maWcsIHJhbmtpbmdDb25maWcsIGksIGZsdXNoUmVzdWx0cywgc25hcHNob3RDYilcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwdWJsaWMgZ2V0IGRlc2NyaXB0aW9uKCkgeyByZXR1cm4gJ0V2YWx1YXRpbmcgcmFua2luZyBtZXRyaWNzJzsgfVxuICBwdWJsaWMgc2tpcChvcFN0OiBPcGVyYXRpb25TdGF0ZSkge1xuICAgIGlmICghb3BTdC5yZXN1bHRzLmxlYWtzIHx8IG9wU3QucmVzdWx0cy5sZWFrcy5sZW5ndGggPCAyKSB7XG4gICAgICBvcFN0LnByb2dyZXNzQmFyLmxvZyhgVW5hYmxlIHRvIGV2YWx1YXRlIHJhbmtpbmcgbWV0cmljczogQkxlYWsgcmVzdWx0cyBmaWxlIGRvZXMgbm90IGNvbnRhaW4gbW9yZSB0aGFuIDIgbGVhayByb290cy5gKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEZpbmRBbmREaWFnbm9zZUxlYWtzIGV4dGVuZHMgQ29tcG9zaXRlT3BlcmF0aW9uIHtcbiAgY29uc3RydWN0b3IoY29uZmlnOiBCTGVha0NvbmZpZywgc25hcHNob3RDYjogU25hcHNob3RDYikge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5jaGlsZHJlbi5wdXNoKFxuICAgICAgbmV3IEZpbmRMZWFrcyhjb25maWcsIHNuYXBzaG90Q2IpLFxuICAgICAgbmV3IERpYWdub3NlTGVha3MoY29uZmlnLCB0cnVlKVxuICAgICk7XG4gIH1cbiAgcHVibGljIGdldCBkZXNjcmlwdGlvbigpIHsgcmV0dXJuIFwiTG9jYXRpbmcgYW5kIGRpYWdub3NpbmcgbGVha3NcIjsgfVxufVxuIl19