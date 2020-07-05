import * as tslib_1 from "tslib";
import * as Benchmark from 'benchmark';
import { gunzipSync } from 'zlib';
import { readFileSync, readdirSync, createWriteStream } from 'fs';
import { join } from 'path';
import { HeapGrowthTracker, HeapGraph } from '../src/lib/growth_graph';
import { exposeClosureState } from '../src/lib/transformations';
import HeapSnapshotParser from '../src/lib/heap_snapshot_parser';
var skipSnapshots = process.argv.indexOf("--skip-snapshots") !== -1;
var loomioSnapshots = [];
var piwikSnapshots = [];
var loomioJs = null;
var piwikJs = null;
var suite = new Benchmark.Suite('BLeak');
var snapshotDir = './benchmarks/snapshots';
var jsDir = './benchmarks/javascript';
var reportFilename = "./benchmarks/benchmark_report_" + new Date().toISOString().replace(/:/g, '_') + ".log";
var benchmarkReport = createWriteStream(reportFilename);
console.log("Writing report to " + reportFilename);
if (skipSnapshots) {
    console.log("Skipping snapshots.");
}
function getSnapshots(prefix) {
    return readdirSync(snapshotDir)
        .filter(function (s) { return s.startsWith(prefix); })
        .map(function (s) { return join(snapshotDir, s); })
        .map(gunzipFile);
}
function getJavascript(file) {
    return gunzipFile(join(jsDir, file));
}
function gunzipFile(file) {
    return gunzipSync(readFileSync(file)).toString("utf8");
}
function getGrowthPaths(snapshots) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var builder, _i, snapshots_1, snapshot;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    builder = new HeapGrowthTracker();
                    _i = 0, snapshots_1 = snapshots;
                    _a.label = 1;
                case 1:
                    if (!(_i < snapshots_1.length)) return [3 /*break*/, 4];
                    snapshot = snapshots_1[_i];
                    return [4 /*yield*/, builder.addSnapshot(HeapSnapshotParser.FromString(snapshot))];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/, builder.findLeakPaths()];
            }
        });
    });
}
function getHeapSize(snapshot) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var graph;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, HeapGraph.Construct(HeapSnapshotParser.FromString(snapshot))];
                case 1:
                    graph = _a.sent();
                    return [2 /*return*/, graph.calculateSize()];
            }
        });
    });
}
if (!skipSnapshots) {
    suite
        .add("Loomio: Growth Paths", {
        fn: function (deferred) {
            getGrowthPaths(loomioSnapshots).then(function () { return deferred.resolve(); });
        },
        onStart: function () {
            loomioSnapshots = getSnapshots("loomio");
        },
        defer: true
    })
        .add("Loomio: Heap Size", {
        fn: function (deferred) {
            Promise.all(loomioSnapshots.map(getHeapSize)).then(function () { return deferred.resolve(); });
        },
        onComplete: function () {
            loomioSnapshots = [];
        },
        defer: true
    })
        .add("Piwik: Growth Paths", {
        fn: function (deferred) {
            getGrowthPaths(piwikSnapshots).then(function () { return deferred.resolve(); });
        },
        onStart: function () {
            piwikSnapshots = getSnapshots("piwik");
        },
        defer: true
    })
        .add("Piwik: Heap Size", {
        fn: function (deferred) {
            Promise.all(piwikSnapshots.map(getHeapSize)).then(function () { return deferred.resolve(); });
        },
        onComplete: function () {
            piwikSnapshots = [];
        },
        defer: true
    });
}
suite.add("Loomio: Expose Closure State", function () {
    exposeClosureState('loomio_vendor.js', loomioJs);
}, {
    onStart: function () {
        loomioJs = getJavascript('loomio_vendor.js.gz');
    },
    onComplete: function () {
        loomioJs = null;
    },
    defer: false
})
    .add("Piwik: Expose Closure State", function () {
    exposeClosureState('piwik_app.js', piwikJs);
}, {
    onStart: function () {
        piwikJs = getJavascript('piwik_app.js.gz');
    },
    onComplete: function () {
        piwikJs = null;
    },
    defer: false
})
    .on('cycle', function (event) {
    var str = String(event.target);
    console.log(str);
    benchmarkReport.write(str + "\n");
})
    .on('complete', function () {
    benchmarkReport.end();
})
    .on('error', function (e) {
    console.log("Received error!");
    console.log(e);
});
suite.run();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmVuY2htYXJrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vYmVuY2htYXJrcy9iZW5jaG1hcmsudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sS0FBSyxTQUFTLE1BQU0sV0FBVyxDQUFDO0FBQ3ZDLE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDaEMsT0FBTyxFQUFDLFlBQVksRUFBRSxXQUFXLEVBQUUsaUJBQWlCLEVBQUMsTUFBTSxJQUFJLENBQUM7QUFDaEUsT0FBTyxFQUFDLElBQUksRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUUxQixPQUFPLEVBQUMsaUJBQWlCLEVBQUUsU0FBUyxFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFDckUsT0FBTyxFQUFDLGtCQUFrQixFQUFDLE1BQU0sNEJBQTRCLENBQUM7QUFDOUQsT0FBTyxrQkFBa0IsTUFBTSxpQ0FBaUMsQ0FBQztBQUVqRSxJQUFNLGFBQWEsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0FBQ3RFLElBQUksZUFBZSxHQUFhLEVBQUUsQ0FBQztBQUNuQyxJQUFJLGNBQWMsR0FBYSxFQUFFLENBQUM7QUFDbEMsSUFBSSxRQUFRLEdBQVcsSUFBSSxDQUFDO0FBQzVCLElBQUksT0FBTyxHQUFXLElBQUksQ0FBQztBQUMzQixJQUFNLEtBQUssR0FBRyxJQUFJLFNBQVMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDM0MsSUFBTSxXQUFXLEdBQUcsd0JBQXdCLENBQUM7QUFDN0MsSUFBTSxLQUFLLEdBQUcseUJBQXlCLENBQUM7QUFDeEMsSUFBTSxjQUFjLEdBQUcsbUNBQWlDLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsU0FBTSxDQUFDO0FBQzFHLElBQU0sZUFBZSxHQUFHLGlCQUFp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QU8sRUFBRSxVQUFTLEtBQVU7SUFDOUIsSUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNqQyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2pCLGVBQWUsQ0FBQyxLQUFLLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxDQUFDO0FBQ3BDLENBQUMsQ0FBQztLQUNELEVBQUUsQ0FBQyxVQUFVLEVBQUU7SUFDZCxlQUFlLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDeEIsQ0FBQyxDQUFDO0tBQ0QsRUFBRSxDQUFDLE9BQU8sRUFBRSxVQUFTLENBQU07SUFDMUIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0lBQy9CLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDakIsQ0FBQyxDQUFDLENBQUM7QUFFTCxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBCZW5jaG1hcmsgZnJvbSAnYmVuY2htYXJrJztcbmltcG9ydCB7Z3VuemlwU3luY30gZnJvbSAnemxpYic7XG5pbXBvcnQge3JlYWRGaWxlU3luYywgcmVhZGRpclN5bmMsIGNyZWF0ZVdyaXRlU3RyZWFtfSBmcm9tICdmcyc7XG5pbXBvcnQge2pvaW59IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHtTbmFwc2hvdFNpemVTdW1tYXJ5fSBmcm9tICcuLi9zcmMvY29tbW9uL2ludGVyZmFjZXMnO1xuaW1wb3J0IHtIZWFwR3Jvd3RoVHJhY2tlciwgSGVhcEdyYXBofSBmcm9tICcuLi9zcmMvbGliL2dyb3d0aF9ncmFwaCc7XG5pbXBvcnQge2V4cG9zZUNsb3N1cmVTdGF0ZX0gZnJvbSAnLi4vc3JjL2xpYi90cmFuc2Zvcm1hdGlvbnMnO1xuaW1wb3J0IEhlYXBTbmFwc2hvdFBhcnNlciBmcm9tICcuLi9zcmMvbGliL2hlYXBfc25hcHNob3RfcGFyc2VyJztcblxuY29uc3Qgc2tpcFNuYXBzaG90cyA9IHByb2Nlc3MuYXJndi5pbmRleE9mKFwiLS1za2lwLXNuYXBzaG90c1wiKSAhPT0gLTE7XG5sZXQgbG9vbWlvU25hcHNob3RzOiBzdHJpbmdbXSA9IFtdO1xubGV0IHBpd2lrU25hcHNob3RzOiBzdHJpbmdbXSA9IFtdO1xubGV0IGxvb21pb0pzOiBzdHJpbmcgPSBudWxsO1xubGV0IHBpd2lrSnM6IHN0cmluZyA9IG51bGw7XG5jb25zdCBzdWl0ZSA9IG5ldyBCZW5jaG1hcmsuU3VpdGUoJ0JMZWFrJyk7XG5jb25zdCBzbmFwc2hvdERpciA9ICcuL2JlbmNobWFya3Mvc25hcHNob3RzJztcbmNvbnN0IGpzRGlyID0gJy4vYmVuY2htYXJrcy9qYXZhc2NyaXB0JztcbmNvbnN0IHJlcG9ydEZpbGVuYW1lID0gYC4vYmVuY2htYXJrcy9iZW5jaG1hcmtfcmVwb3J0XyR7bmV3IERhdGUoKS50b0lTT1N0cmluZygpLnJlcGxhY2UoLzovZywgJ18nKX0ubG9nYDtcbmNvbnN0IGJlbmNobWFya1JlcG9ydCA9IGNyZWF0ZVdyaXRlU3RyZWFtKHJlcG9ydEZpbGVuYW1lKVxuY29uc29sZS5sb2coYFdyaXRpbmcgcmVwb3J0IHRvICR7cmVwb3J0RmlsZW5hbWV9YCk7XG5pZiAoc2tpcFNuYXBzaG90cykge1xuICBjb25zb2xlLmxvZyhcIlNraXBwaW5nIHNuYXBzaG90cy5cIik7XG59XG5cbmZ1bmN0aW9uIGdldFNuYXBzaG90cyhwcmVmaXg6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgcmV0dXJuIHJlYWRkaXJTeW5jKHNuYXBzaG90RGlyKVxuICAgIC5maWx0ZXIoKHMpID0+IHMuc3RhcnRzV2l0aChwcmVmaXgpKVxuICAgIC5tYXAoKHMpID0+IGpvaW4oc25hcHNob3REaXIsIHMpKVxuICAgIC5tYXAoZ3VuemlwRmlsZSk7XG59XG5cbmZ1bmN0aW9uIGdldEphdmFzY3JpcHQoZmlsZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGd1bnppcEZpbGUoam9pbihqc0RpciwgZmlsZSkpO1xufVxuXG5mdW5jdGlvbiBndW56aXBGaWxlKGZpbGU6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBndW56aXBTeW5jKHJlYWRGaWxlU3luYyhmaWxlKSkudG9TdHJpbmcoXCJ1dGY4XCIpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBnZXRHcm93dGhQYXRocyhzbmFwc2hvdHM6IHN0cmluZ1tdKTogUHJvbWlzZTxhbnk+IHtcbiAgY29uc3QgYnVpbGRlciA9IG5ldyBIZWFwR3Jvd3RoVHJhY2tlcigpO1xuICBmb3IgKGNvbnN0IHNuYXBzaG90IG9mIHNuYXBzaG90cykge1xuICAgIGF3YWl0IGJ1aWxkZXIuYWRkU25hcHNob3QoSGVhcFNuYXBzaG90UGFyc2VyLkZyb21TdHJpbmcoc25hcHNob3QpKTtcbiAgfVxuICByZXR1cm4gYnVpbGRlci5maW5kTGVha1BhdGhzKCk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGdldEhlYXBTaXplKHNuYXBzaG90OiBzdHJpbmcpOiBQcm9taXNlPFNuYXBzaG90U2l6ZVN1bW1hcnk+IHtcbiAgY29uc3QgZ3JhcGggPSBhd2FpdCBIZWFwR3JhcGguQ29uc3RydWN0KEhlYXBTbmFwc2hvdFBhcnNlci5Gcm9tU3RyaW5nKHNuYXBzaG90KSk7XG4gIHJldHVybiBncmFwaC5jYWxjdWxhdGVTaXplKCk7XG59XG5cbmludGVyZmFjZSBEZWZlcnJlZCB7XG4gIHJlc29sdmUoKTogdm9pZDtcbn1cblxuaWYgKCFza2lwU25hcHNob3RzKSB7XG4gIHN1aXRlXG4gICAgLmFkZChcIkxvb21pbzogR3Jvd3RoIFBhdGhzXCIsIHtcbiAgICAgIGZuOiBmdW5jdGlvbihkZWZlcnJlZDogRGVmZXJyZWQpIHtcbiAgICAgICAgZ2V0R3Jvd3RoUGF0aHMobG9vbWlvU25hcHNob3RzKS50aGVuKCgpID0+IGRlZmVycmVkLnJlc29sdmUoKSk7XG4gICAgICB9LFxuICAgICAgb25TdGFydDogKCkgPT4ge1xuICAgICAgICBsb29taW9TbmFwc2hvdHMgPSBnZXRTbmFwc2hvdHMoXCJsb29taW9cIik7XG4gICAgICB9LFxuICAgICAgZGVmZXI6IHRydWVcbiAgICB9KVxuICAgIC5hZGQoXCJMb29taW86IEhlYXAgU2l6ZVwiLCB7XG4gICAgICBmbjogZnVuY3Rpb24oZGVmZXJyZWQ6IERlZmVycmVkKSB7XG4gICAgICAgIFByb21pc2UuYWxsKGxvb21pb1NuYXBzaG90cy5tYXAoZ2V0SGVhcFNpemUpKS50aGVuKCgpID0+IGRlZmVycmVkLnJlc29sdmUoKSk7XG4gICAgICB9LFxuICAgICAgb25Db21wbGV0ZTogKCkgPT4ge1xuICAgICAgICBsb29taW9TbmFwc2hvdHMgPSBbXTtcbiAgICAgIH0sXG4gICAgICBkZWZlcjogdHJ1ZVxuICAgIH0pXG4gICAgLmFkZChcIlBpd2lrOiBHcm93dGggUGF0aHNcIiwge1xuICAgICAgZm46IGZ1bmN0aW9uKGRlZmVycmVkOiBEZWZlcnJlZCkge1xuICAgICAgICBnZXRHcm93dGhQYXRocyhwaXdpa1NuYXBzaG90cykudGhlbigoKSA9PiBkZWZlcnJlZC5yZXNvbHZlKCkpO1xuICAgICAgfSxcbiAgICAgIG9uU3RhcnQ6ICgpID0+IHtcbiAgICAgICAgcGl3aWtTbmFwc2hvdHMgPSBnZXRTbmFwc2hvdHMoXCJwaXdpa1wiKTtcbiAgICAgIH0sXG4gICAgICBkZWZlcjogdHJ1ZVxuICAgIH0pXG4gICAgLmFkZChcIlBpd2lrOiBIZWFwIFNpemVcIiwge1xuICAgICAgZm46IGZ1bmN0aW9uKGRlZmVycmVkOiBEZWZlcnJlZCkge1xuICAgICAgICBQcm9taXNlLmFsbChwaXdpa1NuYXBzaG90cy5tYXAoZ2V0SGVhcFNpemUpKS50aGVuKCgpID0+IGRlZmVycmVkLnJlc29sdmUoKSk7XG4gICAgICB9LFxuICAgICAgb25Db21wbGV0ZTogKCkgPT4ge1xuICAgICAgICBwaXdpa1NuYXBzaG90cyA9IFtdO1xuICAgICAgfSxcbiAgICAgIGRlZmVyOiB0cnVlXG4gICAgfSk7XG59XG5zdWl0ZS5hZGQoXCJMb29taW86IEV4cG9zZSBDbG9zdXJlIFN0YXRlXCIsIGZ1bmN0aW9uKCkge1xuICAgIGV4cG9zZUNsb3N1cmVTdGF0ZSgnbG9vbWlvX3ZlbmRvci5qcycsIGxvb21pb0pzKTtcbiAgfSwge1xuICAgIG9uU3RhcnQ6ICgpID0+IHtcbiAgICAgIGxvb21pb0pzID0gZ2V0SmF2YXNjcmlwdCgnbG9vbWlvX3ZlbmRvci5qcy5neicpO1xuICAgIH0sXG4gICAgb25Db21wbGV0ZTogKCkgPT4ge1xuICAgICAgbG9vbWlvSnMgPSBudWxsO1xuICAgIH0sXG4gICAgZGVmZXI6IGZhbHNlXG4gIH0pXG4gIC5hZGQoXCJQaXdpazogRXhwb3NlIENsb3N1cmUgU3RhdGVcIiwgZnVuY3Rpb24oKSB7XG4gICAgZXhwb3NlQ2xvc3VyZVN0YXRlKCdwaXdpa19hcHAuanMnLCBwaXdpa0pzKTtcbiAgfSwge1xuICAgIG9uU3RhcnQ6ICgpID0+IHtcbiAgICAgIHBpd2lrSnMgPSBnZXRKYXZhc2NyaXB0KCdwaXdpa19hcHAuanMuZ3onKTtcbiAgICB9LFxuICAgIG9uQ29tcGxldGU6ICgpID0+IHtcbiAgICAgIHBpd2lrSnMgPSBudWxsO1xuICAgIH0sXG4gICAgZGVmZXI6IGZhbHNlXG4gIH0pXG4gIC8vIGFkZCBsaXN0ZW5lcnNcbiAgLm9uKCdjeWNsZScsIGZ1bmN0aW9uKGV2ZW50OiBhbnkpIHtcbiAgICBjb25zdCBzdHIgPSBTdHJpbmcoZXZlbnQudGFyZ2V0KTtcbiAgICBjb25zb2xlLmxvZyhzdHIpO1xuICAgIGJlbmNobWFya1JlcG9ydC53cml0ZShzdHIgKyBcIlxcblwiKTtcbiAgfSlcbiAgLm9uKCdjb21wbGV0ZScsIGZ1bmN0aW9uKCkge1xuICAgIGJlbmNobWFya1JlcG9ydC5lbmQoKTtcbiAgfSlcbiAgLm9uKCdlcnJvcicsIGZ1bmN0aW9uKGU6IGFueSkge1xuICAgIGNvbnNvbGUubG9nKFwiUmVjZWl2ZWQgZXJyb3IhXCIpO1xuICAgIGNvbnNvbGUubG9nKGUpO1xuICB9KTtcblxuc3VpdGUucnVuKCk7XG4iXX0=