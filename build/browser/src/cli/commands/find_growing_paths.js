import * as tslib_1 from "tslib";
import { HeapGrowthTracker } from '../../lib/growth_graph';
import pathToString from '../../lib/path_to_string';
import { createReadStream } from 'fs';
import * as readline from 'readline';
import { SnapshotNodeTypeToString, SnapshotEdgeTypeToString } from '../../common/interfaces';
import { time } from '../../common/util';
import HeapSnapshotParser from '../../lib/heap_snapshot_parser';
import { createGunzip } from 'zlib';
function getHeapSnapshotParser(file) {
    var parser = new HeapSnapshotParser();
    var stream = createReadStream(file).pipe(createGunzip());
    stream.on('data', function (d) {
        parser.addSnapshotChunk(d.toString());
    });
    return parser;
}
function main(files) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        function pad(str, len) {
            var str2 = str.replace(/\n/g, ' ').slice(0, len);
            for (var i = str.length; i < len; i++) {
                str2 += " ";
            }
            return str2;
        }
        function column(strs, lens) {
            var out = "";
            for (var i = 0; i < strs.length; i++) {
                out += pad(strs[i], lens[i]) + " ";
            }
            return out;
        }
        function runRound(filter) {
            console.log("Current Node: " + node.name + " [" + SnapshotNodeTypeToString(node.type) + "]");
            console.log("[..] Previous node, [h] " + (hide ? "unhide system properties" : "hide system properties") + ", [f (string)] Filter, [q] Quit");
            var choices = [];
            var sizes = [0, 0, 0, 0, 0];
            var i = -1;
            for (var it_1 = node.children; it_1.hasNext(); it_1.next()) {
                i++;
                var child = it_1.item();
                var to = child.to;
                // Skip some types of children.
                if (hide) {
                    switch (to.type) {
                        //case SnapshotNodeType.Code:
                        case 10 /* ConsString */:
                        case 7 /* HeapNumber */:
                        case 0 /* Hidden */:
                        case 6 /* RegExp */:
                        case 11 /* SlicedString */:
                        case 2 /* String */:
                            continue;
                    }
                }
                if (!filter || ("" + child.indexOrName).toLowerCase().indexOf(filter) !== -1) {
                    var choice = ["[" + i + "]", "" + child.indexOrName, "=[" + SnapshotEdgeTypeToString(child.snapshotType) + "]=>", to.name, "[" + SnapshotNodeTypeToString(to.type) + "]" + (t.isGrowing(to.nodeIndex) ? "*" : ""), "[Count: " + to.numProperties() + "]", "[Non-leak-reachable? " + t._nonLeakVisits.get(to.nodeIndex) + ", Leak visits: " + t._leakRefs[to.nodeIndex] + ", NI: " + to.nodeIndex + "]"];
                    choices.push(choice);
                    for (var j = 0; j < choice.length; j++) {
                        if (choice[j].length > sizes[j]) {
                            sizes[j] = choice[j].length;
                            if (sizes[j] > MAX_COL_SIZE) {
                                sizes[j] = MAX_COL_SIZE;
                            }
                        }
                    }
                }
            }
            for (var _i = 0, choices_1 = choices; _i < choices_1.length; _i++) {
                var choice = choices_1[_i];
                console.log(column(choice, sizes));
            }
            rl.question("? ", function (a) {
                var a2 = a.trim().toLowerCase();
                var filter = undefined;
                switch (a2[0]) {
                    case '.':
                        if (a2[1] === '.') {
                            path.pop();
                        }
                        break;
                    case 'q':
                        rl.close();
                        process.exit();
                        break;
                    case 'h':
                        hide = !hide;
                        break;
                    case 'f': {
                        filter = a2.slice(2).trim();
                        break;
                    }
                    case 's': {
                        var latest = path[path.length - 1];
                        latest.nodeIndex = parseInt(a2.slice(2).trim(), 10);
                        path = [heap.getRoot(), latest];
                        break;
                    }
                    default:
                        var choice = parseInt(a2, 10);
                        var child = node.getChild(choice);
                        if (!child) {
                            console.log("Invalid choice: " + choice + ".");
                        }
                        else {
                            path.push(child.to);
                        }
                        break;
                }
                if (path.length === 0) {
                    path.push(heap.getRoot());
                }
                node = path[path.length - 1];
                runRound(filter);
            });
        }
        var t, _i, files_1, file, growth, rl, heap, node, path, hide, MAX_COL_SIZE;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    t = new HeapGrowthTracker();
                    _i = 0, files_1 = files;
                    _a.label = 1;
                case 1:
                    if (!(_i < files_1.length)) return [3 /*break*/, 4];
                    file = files_1[_i];
                    console.log("Processing " + file + "...");
                    return [4 /*yield*/, t.addSnapshot(getHeapSnapshotParser(file))];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    growth = time('Get Growing Objects', console, function () { return t.findLeakPaths(); });
                    console.log("Found " + growth.length + " growing paths.");
                    console.log("");
                    console.log("Report");
                    console.log("======");
                    console.log("");
                    growth.sort(function (a, b) { return b.scores.leakShare - a.scores.leakShare; }).forEach(function (obj) {
                        console.log("* LeakShare: " + obj.scores.leakShare + ", Retained Size: " + obj.scores.retainedSize + ", Transitive Closure Size: " + obj.scores.transitiveClosureSize);
                        obj.paths.slice(0, 5).forEach(function (p, i) {
                            console.log("   * " + pathToString(p));
                        });
                        if (obj.paths.length > 5) {
                            console.log("   * (" + (obj.paths.length - 5) + " more...)");
                        }
                    });
                    console.log("Exploring the heap!");
                    rl = readline.createInterface({
                        input: process.stdin,
                        output: process.stdout
                    });
                    heap = t.getGraph();
                    node = heap.getRoot();
                    path = [node];
                    hide = true;
                    MAX_COL_SIZE = 25;
                    runRound();
                    return [2 /*return*/];
            }
        });
    });
}
var FindGrowingPaths = {
    command: 'find-growing-paths [snapshots...]',
    describe: 'Locates growing paths in a set of heap snapshots on disk. Useful for debugging BLeak.',
    handler: function (args) {
        if (args.snapshots.length === 0) {
            console.log("No heap snapshots specified; nothing to do.");
            return;
        }
        main(args.snapshots);
    },
    builder: function (argv) {
        return argv.positional('snapshots', {
            describe: 'Paths to heap snapshots (Gzipped) on disk, and in-order',
            type: 'string'
        });
    }
};
export default FindGrowingPaths;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmluZF9ncm93aW5nX3BhdGhzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL2NsaS9jb21tYW5kcy9maW5kX2dyb3dpbmdfcGF0aHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQ3pELE9BQU8sWUFBWSxNQUFNLDBCQUEwQixDQUFDO0FBQ3BELE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLElBQUksQ0FBQztBQUNwQyxPQUFPLEtBQUssUUFBUSxNQUFNLFVBQVUsQ0FBQztBQUNyQyxPQUFPLEVBQUMsd0JBQXdCLEVBQUUsd0JBQXdCLEVBQW1CLE1BQU0seUJBQXlCLENBQUM7QUFDN0csT0FBTyxFQUFDLElBQUksRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ3ZDLE9BQU8sa0JBQWtCLE1BQU0sZ0NBQWdDLENBQUM7QUFDaEUsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUdsQywrQkFBK0IsSUFBWTtJQUN6QyxJQUFNLE1BQU0sR0FBRyxJQUFJLGtCQUFrQixFQUFFLENBQUM7SUFDeEMsSUFBTSxNQUFNLEdBQUcsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUM7SUFDM0QsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsVUFBUyxDQUFDO1FBQzFCLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztJQUN4QyxDQUFDLENBQUMsQ0FBQztJQUNILE1BQU0sQ0FBQyxNQUFNLENBQUM7QUFDaEIsQ0FBQztBQUVELGNBQW9CLEtBQWU7O1FBaUNqQyxhQUFhLEdBQVcsRUFBRSxHQUFXO1lBQ25DLElBQUksSUFBSSxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEtBQUss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QyxJQUFJLEdBQUcsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDO29CQUNwQixJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUN0QixJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDZCxJQUFJLEdBQUcsSUFBSSxDQUFDO29CQUNWLFlBQVksR0FBRyxFQUFFLENBQUM7b0JBa0d4QixRQUFRLEVBQUUsQ0FBQzs7Ozs7Q0FDWjtBQU1ELElBQU0sZ0JBQWdCLEdBQWtCO0lBQ3RDLE9BQU8sRUFBRSxtQ0FBbUM7SUFDNUMsUUFBUSxFQUFFLHVGQUF1RjtJQUNqRyxPQUFPLEVBQUUsVUFBQyxJQUF3QjtRQUNoQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hDLE9BQU8sQ0FBQyxHQUFHLENBQUMsNkNBQTZDLENBQUMsQ0FBQztZQUMzRCxNQUFNLENBQUM7UUFDVCxDQUFDO1FBQ0QsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUN2QixDQUFDO0lBQ0QsT0FBTyxFQUFFLFVBQUMsSUFBSTtRQUNaLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFdBQVcsRUFBRTtZQUNsQyxRQUFRLEVBQUUseURBQXlEO1lBQ25FLElBQUksRUFBRSxRQUFRO1NBQ2YsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGLENBQUM7QUFFRixlQUFlLGdCQUFnQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtIZWFwR3Jvd3RoVHJhY2tlcn0gZnJvbSAnLi4vLi4vbGliL2dyb3d0aF9ncmFwaCc7XG5pbXBvcnQgcGF0aFRvU3RyaW5nIGZyb20gJy4uLy4uL2xpYi9wYXRoX3RvX3N0cmluZyc7XG5pbXBvcnQge2NyZWF0ZVJlYWRTdHJlYW19IGZyb20gJ2ZzJztcbmltcG9ydCAqIGFzIHJlYWRsaW5lIGZyb20gJ3JlYWRsaW5lJztcbmltcG9ydCB7U25hcHNob3ROb2RlVHlwZVRvU3RyaW5nLCBTbmFwc2hvdEVkZ2VUeXBlVG9TdHJpbmcsIFNuYXBzaG90Tm9kZVR5cGV9IGZyb20gJy4uLy4uL2NvbW1vbi9pbnRlcmZhY2VzJztcbmltcG9ydCB7dGltZX0gZnJvbSAnLi4vLi4vY29tbW9uL3V0aWwnO1xuaW1wb3J0IEhlYXBTbmFwc2hvdFBhcnNlciBmcm9tICcuLi8uLi9saWIvaGVhcF9zbmFwc2hvdF9wYXJzZXInO1xuaW1wb3J0IHtjcmVhdGVHdW56aXB9IGZyb20gJ3psaWInO1xuaW1wb3J0IHtDb21tYW5kTW9kdWxlfSBmcm9tICd5YXJncyc7XG5cbmZ1bmN0aW9uIGdldEhlYXBTbmFwc2hvdFBhcnNlcihmaWxlOiBzdHJpbmcpOiBIZWFwU25hcHNob3RQYXJzZXIge1xuICBjb25zdCBwYXJzZXIgPSBuZXcgSGVhcFNuYXBzaG90UGFyc2VyKCk7XG4gIGNvbnN0IHN0cmVhbSA9IGNyZWF0ZVJlYWRTdHJlYW0oZmlsZSkucGlwZShjcmVhdGVHdW56aXAoKSk7XG4gIHN0cmVhbS5vbignZGF0YScsIGZ1bmN0aW9uKGQpIHtcbiAgICBwYXJzZXIuYWRkU25hcHNob3RDaHVuayhkLnRvU3RyaW5nKCkpO1xuICB9KTtcbiAgcmV0dXJuIHBhcnNlcjtcbn1cblxuYXN5bmMgZnVuY3Rpb24gbWFpbihmaWxlczogc3RyaW5nW10pIHtcbiAgY29uc3QgdCA9IG5ldyBIZWFwR3Jvd3RoVHJhY2tlcigpO1xuICBmb3IgKGNvbnN0IGZpbGUgb2YgZmlsZXMpIHtcbiAgICBjb25zb2xlLmxvZyhgUHJvY2Vzc2luZyAke2ZpbGV9Li4uYCk7XG4gICAgYXdhaXQgdC5hZGRTbmFwc2hvdChnZXRIZWFwU25hcHNob3RQYXJzZXIoZmlsZSkpO1xuICB9XG5cbiAgY29uc3QgZ3Jvd3RoID0gdGltZSgnR2V0IEdyb3dpbmcgT2JqZWN0cycsIGNvbnNvbGUsICgpID0+IHQuZmluZExlYWtQYXRocygpKTtcbiAgY29uc29sZS5sb2coYEZvdW5kICR7Z3Jvd3RoLmxlbmd0aH0gZ3Jvd2luZyBwYXRocy5gKTtcbiAgY29uc29sZS5sb2coYGApO1xuICBjb25zb2xlLmxvZyhgUmVwb3J0YCk7XG4gIGNvbnNvbGUubG9nKGA9PT09PT1gKTtcbiAgY29uc29sZS5sb2coYGApO1xuICBncm93dGguc29ydCgoYSwgYikgPT4gYi5zY29yZXMubGVha1NoYXJlIC0gYS5zY29yZXMubGVha1NoYXJlKS5mb3JFYWNoKChvYmopID0+IHtcbiAgICBjb25zb2xlLmxvZyhgKiBMZWFrU2hhcmU6ICR7b2JqLnNjb3Jlcy5sZWFrU2hhcmV9LCBSZXRhaW5lZCBTaXplOiAke29iai5zY29yZXMucmV0YWluZWRTaXplfSwgVHJhbnNpdGl2ZSBDbG9zdXJlIFNpemU6ICR7b2JqLnNjb3Jlcy50cmFuc2l0aXZlQ2xvc3VyZVNpemV9YCk7XG4gICAgb2JqLnBhdGhzLnNsaWNlKDAsIDUpLmZvckVhY2goKHAsIGkpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKGAgICAqICR7cGF0aFRvU3RyaW5nKHApfWApO1xuICAgIH0pO1xuICAgIGlmIChvYmoucGF0aHMubGVuZ3RoID4gNSkge1xuICAgICAgY29uc29sZS5sb2coYCAgICogKCR7b2JqLnBhdGhzLmxlbmd0aCAtIDV9IG1vcmUuLi4pYCk7XG4gICAgfVxuICB9KTtcblxuICBjb25zb2xlLmxvZyhgRXhwbG9yaW5nIHRoZSBoZWFwIWApO1xuICBjb25zdCBybCA9IHJlYWRsaW5lLmNyZWF0ZUludGVyZmFjZSh7XG4gICAgaW5wdXQ6IHByb2Nlc3Muc3RkaW4sXG4gICAgb3V0cHV0OiBwcm9jZXNzLnN0ZG91dFxuICB9KTtcbiAgbGV0IGhlYXAgPSB0LmdldEdyYXBoKCk7XG4gIGxldCBub2RlID0gaGVhcC5nZXRSb290KCk7XG4gIGxldCBwYXRoID0gW25vZGVdO1xuICBsZXQgaGlkZSA9IHRydWU7XG4gIGNvbnN0IE1BWF9DT0xfU0laRSA9IDI1O1xuICBmdW5jdGlvbiBwYWQoc3RyOiBzdHJpbmcsIGxlbjogbnVtYmVyKTogc3RyaW5nIHtcbiAgICBsZXQgc3RyMiA9IHN0ci5yZXBsYWNlKC9cXG4vZywgJyAnKS5zbGljZSgwLCBsZW4pO1xuICAgIGZvciAobGV0IGkgPSBzdHIubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIHN0cjIgKz0gXCIgXCI7XG4gICAgfVxuICAgIHJldHVybiBzdHIyO1xuICB9XG4gIGZ1bmN0aW9uIGNvbHVtbihzdHJzOiBzdHJpbmdbXSwgbGVuczogbnVtYmVyW10pOiBzdHJpbmcge1xuICAgIGxldCBvdXQgPSBcIlwiO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc3Rycy5sZW5ndGg7IGkrKykge1xuICAgICAgb3V0ICs9IHBhZChzdHJzW2ldLCBsZW5zW2ldKSArIFwiIFwiO1xuICAgIH1cbiAgICByZXR1cm4gb3V0O1xuICB9XG4gIGZ1bmN0aW9uIHJ1blJvdW5kKGZpbHRlcj86IHN0cmluZykge1xuICAgIGNvbnNvbGUubG9nKGBDdXJyZW50IE5vZGU6ICR7bm9kZS5uYW1lfSBbJHtTbmFwc2hvdE5vZGVUeXBlVG9TdHJpbmcobm9kZS50eXBlKX1dYCk7XG4gICAgY29uc29sZS5sb2coYFsuLl0gUHJldmlvdXMgbm9kZSwgW2hdICR7aGlkZSA/IFwidW5oaWRlIHN5c3RlbSBwcm9wZXJ0aWVzXCIgOiBcImhpZGUgc3lzdGVtIHByb3BlcnRpZXNcIn0sIFtmIChzdHJpbmcpXSBGaWx0ZXIsIFtxXSBRdWl0YCk7XG4gICAgbGV0IGNob2ljZXM6IHN0cmluZ1tdW10gPSBbXTtcbiAgICBsZXQgc2l6ZXM6IG51bWJlcltdID0gWzAsIDAsIDAsIDAsIDBdO1xuICAgIGxldCBpID0gLTE7XG4gICAgZm9yIChjb25zdCBpdCA9IG5vZGUuY2hpbGRyZW47IGl0Lmhhc05leHQoKTsgaXQubmV4dCgpKSB7XG4gICAgICBpKys7XG4gICAgICBjb25zdCBjaGlsZCA9IGl0Lml0ZW0oKTtcbiAgICAgIGNvbnN0IHRvID0gY2hpbGQudG87XG4gICAgICAvLyBTa2lwIHNvbWUgdHlwZXMgb2YgY2hpbGRyZW4uXG4gICAgICBpZiAoaGlkZSkge1xuICAgICAgICBzd2l0Y2ggKHRvLnR5cGUpIHtcbiAgICAgICAgICAvL2Nhc2UgU25hcHNob3ROb2RlVHlwZS5Db2RlOlxuICAgICAgICAgIGNhc2UgU25hcHNob3ROb2RlVHlwZS5Db25zU3RyaW5nOlxuICAgICAgICAgIGNhc2UgU25hcHNob3ROb2RlVHlwZS5IZWFwTnVtYmVyOlxuICAgICAgICAgIGNhc2UgU25hcHNob3ROb2RlVHlwZS5IaWRkZW46XG4gICAgICAgICAgY2FzZSBTbmFwc2hvdE5vZGVUeXBlLlJlZ0V4cDpcbiAgICAgICAgICBjYXNlIFNuYXBzaG90Tm9kZVR5cGUuU2xpY2VkU3RyaW5nOlxuICAgICAgICAgIGNhc2UgU25hcHNob3ROb2RlVHlwZS5TdHJpbmc6XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKCFmaWx0ZXIgfHwgYCR7Y2hpbGQuaW5kZXhPck5hbWV9YC50b0xvd2VyQ2FzZSgpLmluZGV4T2YoZmlsdGVyKSAhPT0gLTEpIHtcbiAgICAgICAgbGV0IGNob2ljZSA9IFtgWyR7aX1dYCwgYCR7Y2hpbGQuaW5kZXhPck5hbWV9YCwgYD1bJHtTbmFwc2hvdEVkZ2VUeXBlVG9TdHJpbmcoY2hpbGQuc25hcHNob3RUeXBlKX1dPT5gLCB0by5uYW1lLCBgWyR7U25hcHNob3ROb2RlVHlwZVRvU3RyaW5nKHRvLnR5cGUpfV0ke3QuaXNHcm93aW5nKHRvLm5vZGVJbmRleCkgPyBcIipcIiA6IFwiXCJ9YCwgYFtDb3VudDogJHt0by5udW1Qcm9wZXJ0aWVzKCl9XWAsIGBbTm9uLWxlYWstcmVhY2hhYmxlPyAke3QuX25vbkxlYWtWaXNpdHMuZ2V0KHRvLm5vZGVJbmRleCl9LCBMZWFrIHZpc2l0czogJHt0Ll9sZWFrUmVmc1t0by5ub2RlSW5kZXhdfSwgTkk6ICR7dG8ubm9kZUluZGV4fV1gXTtcbiAgICAgICAgY2hvaWNlcy5wdXNoKGNob2ljZSk7XG4gICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgY2hvaWNlLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgaWYgKGNob2ljZVtqXS5sZW5ndGggPiBzaXplc1tqXSkge1xuICAgICAgICAgICAgc2l6ZXNbal0gPSBjaG9pY2Vbal0ubGVuZ3RoO1xuICAgICAgICAgICAgaWYgKHNpemVzW2pdID4gTUFYX0NPTF9TSVpFKSB7XG4gICAgICAgICAgICAgIHNpemVzW2pdID0gTUFYX0NPTF9TSVpFO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBmb3IgKGNvbnN0IGNob2ljZSBvZiBjaG9pY2VzKSB7XG4gICAgICBjb25zb2xlLmxvZyhjb2x1bW4oY2hvaWNlLCBzaXplcykpO1xuICAgIH1cblxuICAgIHJsLnF1ZXN0aW9uKFwiPyBcIiwgKGEpID0+IHtcbiAgICAgIGNvbnN0IGEyID0gYS50cmltKCkudG9Mb3dlckNhc2UoKTtcbiAgICAgIGxldCBmaWx0ZXI6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgICAgIHN3aXRjaCAoYTJbMF0pIHtcbiAgICAgICAgY2FzZSAnLic6XG4gICAgICAgICAgaWYgKGEyWzFdID09PSAnLicpIHtcbiAgICAgICAgICAgIHBhdGgucG9wKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdxJzpcbiAgICAgICAgICBybC5jbG9zZSgpO1xuICAgICAgICAgIHByb2Nlc3MuZXhpdCgpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdoJzpcbiAgICAgICAgICBoaWRlID0gIWhpZGU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2YnOiB7XG4gICAgICAgICAgZmlsdGVyID0gYTIuc2xpY2UoMikudHJpbSgpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgJ3MnOiB7XG4gICAgICAgICAgY29uc3QgbGF0ZXN0ID0gcGF0aFtwYXRoLmxlbmd0aCAtIDFdO1xuICAgICAgICAgIGxhdGVzdC5ub2RlSW5kZXggPSA8YW55PiBwYXJzZUludChhMi5zbGljZSgyKS50cmltKCksIDEwKTtcbiAgICAgICAgICBwYXRoID0gW2hlYXAuZ2V0Um9vdCgpLCBsYXRlc3RdO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgY29uc3QgY2hvaWNlID0gcGFyc2VJbnQoYTIsIDEwKTtcbiAgICAgICAgICBjb25zdCBjaGlsZCA9IG5vZGUuZ2V0Q2hpbGQoY2hvaWNlKTtcbiAgICAgICAgICBpZiAoIWNoaWxkKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgSW52YWxpZCBjaG9pY2U6ICR7Y2hvaWNlfS5gKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGF0aC5wdXNoKGNoaWxkLnRvKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBpZiAocGF0aC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcGF0aC5wdXNoKGhlYXAuZ2V0Um9vdCgpKTtcbiAgICAgIH1cbiAgICAgIG5vZGUgPSBwYXRoW3BhdGgubGVuZ3RoIC0gMV07XG4gICAgICBydW5Sb3VuZChmaWx0ZXIpO1xuICAgIH0pO1xuICB9XG4gIHJ1blJvdW5kKCk7XG59XG5cbmludGVyZmFjZSBDb21tYW5kTGluZU9wdGlvbnMge1xuICBzbmFwc2hvdHM6IHN0cmluZ1tdO1xufVxuXG5jb25zdCBGaW5kR3Jvd2luZ1BhdGhzOiBDb21tYW5kTW9kdWxlID0ge1xuICBjb21tYW5kOiAnZmluZC1ncm93aW5nLXBhdGhzIFtzbmFwc2hvdHMuLi5dJyxcbiAgZGVzY3JpYmU6ICdMb2NhdGVzIGdyb3dpbmcgcGF0aHMgaW4gYSBzZXQgb2YgaGVhcCBzbmFwc2hvdHMgb24gZGlzay4gVXNlZnVsIGZvciBkZWJ1Z2dpbmcgQkxlYWsuJyxcbiAgaGFuZGxlcjogKGFyZ3M6IENvbW1hbmRMaW5lT3B0aW9ucykgPT4ge1xuICAgIGlmIChhcmdzLnNuYXBzaG90cy5sZW5ndGggPT09IDApIHtcbiAgICAgIGNvbnNvbGUubG9nKGBObyBoZWFwIHNuYXBzaG90cyBzcGVjaWZpZWQ7IG5vdGhpbmcgdG8gZG8uYCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIG1haW4oYXJncy5zbmFwc2hvdHMpO1xuICB9LFxuICBidWlsZGVyOiAoYXJndikgPT4ge1xuICAgIHJldHVybiBhcmd2LnBvc2l0aW9uYWwoJ3NuYXBzaG90cycsIHtcbiAgICAgIGRlc2NyaWJlOiAnUGF0aHMgdG8gaGVhcCBzbmFwc2hvdHMgKEd6aXBwZWQpIG9uIGRpc2ssIGFuZCBpbi1vcmRlcicsXG4gICAgICB0eXBlOiAnc3RyaW5nJ1xuICAgIH0pO1xuICB9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBGaW5kR3Jvd2luZ1BhdGhzO1xuXG4iXX0=