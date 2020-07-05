#!/usr/bin/env node
import * as tslib_1 from "tslib";
import * as fs from 'fs';
import * as path from 'path';
import * as rimraf from 'rimraf';
var shouldWatch = process.argv.indexOf("--watch") !== -1;
var buildFolder = path.resolve('build');
var distFolder = path.resolve('dist');
var htmlFolder = path.resolve('html');
if (!fs.existsSync(buildFolder)) {
    console.error("Cannot find build folder! Make sure you run this script from the root folder.");
    process.exit(1);
}
function mkdir(dir) {
    try {
        fs.mkdirSync(dir, 493);
    }
    catch (e) {
        if (e.code !== "EEXIST") {
            throw e;
        }
    }
}
function copyDir(src, dest) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var files, promises, _i, files_1, file, from, to, current, symlink;
        return tslib_1.__generator(this, function (_a) {
            mkdir(dest);
            files = fs.readdirSync(src);
            promises = [];
            for (_i = 0, files_1 = files; _i < files_1.length; _i++) {
                file = files_1[_i];
                from = path.join(src, file);
                to = path.join(dest, file);
                current = fs.lstatSync(from);
                if (current.isDirectory()) {
                    promises.push(copyDir(from, to));
                }
                else if (current.isSymbolicLink()) {
                    symlink = fs.readlinkSync(from);
                    fs.symlinkSync(symlink, to);
                }
                else {
                    promises.push(copy(from, to));
                }
            }
            return [2 /*return*/, Promise.all(promises)];
        });
    });
}
function copy(src, dest) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    var oldFile = fs.createReadStream(src);
                    var newFile = fs.createWriteStream(dest);
                    oldFile.pipe(newFile).on('close', resolve).on('error', reject);
                })];
        });
    });
}
function main() {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    rimraf(distFolder, function (err) {
                        if (err) {
                            console.error("Error removing existing dist folder:");
                            console.error(err);
                            return reject(err);
                        }
                        mkdir(distFolder);
                        var promises = [];
                        promises.push(copyDir(path.join(buildFolder, 'node', 'src'), path.join(distFolder, 'node')));
                        promises.push(copyDir(htmlFolder, path.join(distFolder, 'viewer')));
                        var viewerSrcFolder = path.join(buildFolder, 'browser');
                        ['viewer.js', 'viewer.js.map'].forEach(function (file) {
                            promises.push(copy(path.join(viewerSrcFolder, file), path.join(distFolder, 'viewer', file)));
                        });
                        promises.push(copy(path.resolve('node_modules', 'd3', 'build', 'd3.min.js'), path.join(distFolder, 'viewer', 'd3.min.js')));
                        promises.push(copy(path.resolve('node_modules', 'react-treeview', 'react-treeview.css'), path.join(distFolder, 'viewer', 'react-treeview.css')));
                        resolve(Promise.all(promises));
                    });
                })];
        });
    });
}
var WATCH_GRANULARITY = 2000;
function watch() {
    var lastChangeTimestamp = 0;
    var isBuilding = false;
    var timer = null;
    function resetBuilding() {
        console.log("[make_dist] Finished!");
        isBuilding = false;
    }
    function timerFunction(timestamp) {
        if (lastChangeTimestamp !== timestamp || isBuilding) {
            timer = setTimeout(timerFunction, WATCH_GRANULARITY, lastChangeTimestamp);
        }
        else {
            timer = null;
            isBuilding = true;
            console.log("[make_dist] Change detected! Copying files to dist...");
            main().then(resetBuilding).catch(resetBuilding);
        }
    }
    fs.watch(buildFolder, {
        recursive: true
    }, function () {
        lastChangeTimestamp = Date.now();
        if (!timer) {
            timer = setTimeout(timerFunction, WATCH_GRANULARITY, lastChangeTimestamp);
        }
    });
    timerFunction(lastChangeTimestamp);
}
if (shouldWatch) {
    watch();
}
else {
    main();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFrZV9kaXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc2NyaXB0cy9tYWtlX2Rpc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFJQSxPQUFPLEtBQUssRUFBRSxNQUFNLElBQUksQ0FBQztBQUN6QixPQUFPLEtBQUssSUFBSSxNQUFNLE1BQU0sQ0FBQztBQUM3QixPQUFPLEtBQUssTUFBTSxNQUFNLFFBQVEsQ0FBQztBQUVqQyxJQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztBQUMzRCxJQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQzFDLElBQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDeEMsSUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUN4QyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2hDLE9BQU8sQ0FBQyxLQUFLLENBQUMsK0VBQStFLENBQUMsQ0FBQztJQUMvRixPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2xCLENBQUM7QUFFRCxlQUFlLEdBQVc7SUFDekIsSUFBSSxDQUFDO1FBQ0osRUFBRSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsR0FBSyxDQUFDLENBQUM7SUFDMUIsQ0FBQztJQUFDLEtBQUssQ0FBQSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDWCxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDekIsTUFBTSxDQUFDLENBQUM7UUFDVCxDQUFDO0lBQ0YsQ0FBQztBQUNGLENBQUM7QUFFRCxpQkFBdUIsR0FB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Q0FBQztJQUNELHVCQUF1QixTQUFpQjtRQUN2QyxFQUFFLENBQUMsQ0FBQyxtQkFBbUIsS0FBSyxTQUFTLElBQUksVUFBVSxDQUFDLENBQUMsQ0FBQztZQUNyRCxLQUFLLEdBQUcsVUFBVSxDQUFDLGFBQWEsRUFBRSxpQkFBaUIsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO1FBQzNFLENBQUM7UUFBQyxJQUFJLENBQUMsQ0FBQztZQUNQLEtBQUssR0FBRyxJQUFJLENBQUM7WUFDYixVQUFVLEdBQUcsSUFBSSxDQUFDO1lBQ2xCLE9BQU8sQ0FBQyxHQUFHLENBQUMsdURBQXVELENBQUMsQ0FBQTtZQUNwRSxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQ2pELENBQUM7SUFDRixDQUFDO0lBRUQsRUFBRSxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUU7UUFDckIsU0FBUyxFQUFFLElBQUk7S0FDZixFQUFFO1FBQ0YsbUJBQW1CLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQ2pDLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUNaLEtBQUssR0FBRyxVQUFVLENBQUMsYUFBYSxFQUFFLGlCQUFpQixFQUFFLG1CQUFtQixDQUFDLENBQUM7UUFDM0UsQ0FBQztJQUNGLENBQUMsQ0FBQyxDQUFDO0lBQ0gsYUFBYSxDQUFDLG1CQUFtQixDQUFDLENBQUM7QUFDcEMsQ0FBQztBQUVELEVBQUUsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7SUFDakIsS0FBSyxFQUFFLENBQUM7QUFDVCxDQUFDO0FBQUMsSUFBSSxDQUFDLENBQUM7SUFDUCxJQUFJLEVBQUUsQ0FBQztBQUNSLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIjIS91c3IvYmluL2VudiBub2RlXG4vKipcbiAqIEFzc2VtYmxlcyB0aGUgJ2Rpc3QnIGZvbGRlciBmb3IgQkxlYWsuXG4gKi9cbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyByaW1yYWYgZnJvbSAncmltcmFmJztcblxuY29uc3Qgc2hvdWxkV2F0Y2ggPSBwcm9jZXNzLmFyZ3YuaW5kZXhPZihcIi0td2F0Y2hcIikgIT09IC0xO1xuY29uc3QgYnVpbGRGb2xkZXIgPSBwYXRoLnJlc29sdmUoJ2J1aWxkJyk7XG5jb25zdCBkaXN0Rm9sZGVyID0gcGF0aC5yZXNvbHZlKCdkaXN0Jyk7XG5jb25zdCBodG1sRm9sZGVyID0gcGF0aC5yZXNvbHZlKCdodG1sJyk7XG5pZiAoIWZzLmV4aXN0c1N5bmMoYnVpbGRGb2xkZXIpKSB7XG4gIGNvbnNvbGUuZXJyb3IoXCJDYW5ub3QgZmluZCBidWlsZCBmb2xkZXIhIE1ha2Ugc3VyZSB5b3UgcnVuIHRoaXMgc2NyaXB0IGZyb20gdGhlIHJvb3QgZm9sZGVyLlwiKTtcbiAgcHJvY2Vzcy5leGl0KDEpO1xufVxuXG5mdW5jdGlvbiBta2RpcihkaXI6IHN0cmluZyk6IHZvaWQge1xuXHR0cnkge1xuXHRcdGZzLm1rZGlyU3luYyhkaXIsIDBvNzU1KTtcblx0fSBjYXRjaChlKSB7XG5cdFx0aWYgKGUuY29kZSAhPT0gXCJFRVhJU1RcIikge1xuXHRcdFx0dGhyb3cgZTtcblx0XHR9XG5cdH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gY29weURpcihzcmM6IHN0cmluZywgZGVzdDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG5cdG1rZGlyKGRlc3QpO1xuXHRjb25zdCBmaWxlcyA9IGZzLnJlYWRkaXJTeW5jKHNyYyk7XG5cdGxldCBwcm9taXNlczogUHJvbWlzZTx2b2lkPltdID0gW107XG5cdGZvciAoY29uc3QgZmlsZSBvZiBmaWxlcykge1xuICAgIGNvbnN0IGZyb20gPSBwYXRoLmpvaW4oc3JjLCBmaWxlKTtcbiAgICBjb25zdCB0byA9IHBhdGguam9pbihkZXN0LCBmaWxlKTtcblx0XHRjb25zdCBjdXJyZW50ID0gZnMubHN0YXRTeW5jKGZyb20pO1xuXHRcdGlmIChjdXJyZW50LmlzRGlyZWN0b3J5KCkpIHtcblx0XHRcdHByb21pc2VzLnB1c2goY29weURpcihmcm9tLCB0bykpO1xuXHRcdH0gZWxzZSBpZiAoY3VycmVudC5pc1N5bWJvbGljTGluaygpKSB7XG5cdFx0XHRjb25zdCBzeW1saW5rID0gZnMucmVhZGxpbmtTeW5jKGZyb20pO1xuXHRcdFx0ZnMuc3ltbGlua1N5bmMoc3ltbGluaywgdG8pO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRwcm9taXNlcy5wdXNoKGNvcHkoZnJvbSwgdG8pKTtcblx0XHR9XG5cdH1cblx0cmV0dXJuIFByb21pc2UuYWxsKHByb21pc2VzKSBhcyBQcm9taXNlPGFueT47XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNvcHkoc3JjOiBzdHJpbmcsIGRlc3Q6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuXHRyZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXHRcdGNvbnN0IG9sZEZpbGUgPSBmcy5jcmVhdGVSZWFkU3RyZWFtKHNyYyk7XG5cdFx0Y29uc3QgbmV3RmlsZSA9IGZzLmNyZWF0ZVdyaXRlU3RyZWFtKGRlc3QpO1xuXHRcdG9sZEZpbGUucGlwZShuZXdGaWxlKS5vbignY2xvc2UnLCByZXNvbHZlKS5vbignZXJyb3InLCByZWplY3QpO1xuXHR9KTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gbWFpbigpOiBQcm9taXNlPHZvaWQ+IHtcblx0cmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRyaW1yYWYoZGlzdEZvbGRlciwgKGVycikgPT4ge1xuXHRcdFx0aWYgKGVycikge1xuXHRcdFx0XHRjb25zb2xlLmVycm9yKGBFcnJvciByZW1vdmluZyBleGlzdGluZyBkaXN0IGZvbGRlcjpgKTtcblx0XHRcdFx0Y29uc29sZS5lcnJvcihlcnIpO1xuXHRcdFx0XHRyZXR1cm4gcmVqZWN0KGVycik7XG5cdFx0XHR9XG5cdFx0XHRta2RpcihkaXN0Rm9sZGVyKTtcblx0XHRcdGNvbnN0IHByb21pc2VzOiBQcm9taXNlPHZvaWQ+W10gPSBbXTtcblx0XHRcdHByb21pc2VzLnB1c2goY29weURpcihwYXRoLmpvaW4oYnVpbGRGb2xkZXIsICdub2RlJywgJ3NyYycpLCBwYXRoLmpvaW4oZGlzdEZvbGRlciwgJ25vZGUnKSkpO1xuXHRcdFx0cHJvbWlzZXMucHVzaChjb3B5RGlyKGh0bWxGb2xkZXIsIHBhdGguam9pbihkaXN0Rm9sZGVyLCAndmlld2VyJykpKTtcblxuXHRcdFx0Y29uc3Qgdmlld2VyU3JjRm9sZGVyID0gcGF0aC5qb2luKGJ1aWxkRm9sZGVyLCAnYnJvd3NlcicpO1xuXHRcdFx0Wyd2aWV3ZXIuanMnLCAndmlld2VyLmpzLm1hcCddLmZvckVhY2goKGZpbGUpID0+IHtcblx0XHRcdFx0cHJvbWlzZXMucHVzaChjb3B5KHBhdGguam9pbih2aWV3ZXJTcmNGb2xkZXIsIGZpbGUpLCBwYXRoLmpvaW4oZGlzdEZvbGRlciwgJ3ZpZXdlcicsIGZpbGUpKSk7XG5cdFx0XHR9KTtcblx0XHRcdHByb21pc2VzLnB1c2goY29weShwYXRoLnJlc29sdmUoJ25vZGVfbW9kdWxlcycsICdkMycsICdidWlsZCcsICdkMy5taW4uanMnKSwgcGF0aC5qb2luKGRpc3RGb2xkZXIsICd2aWV3ZXInLCAnZDMubWluLmpzJykpKTtcblx0XHRcdHByb21pc2VzLnB1c2goY29weShwYXRoLnJlc29sdmUoJ25vZGVfbW9kdWxlcycsICdyZWFjdC10cmVldmlldycsICdyZWFjdC10cmVldmlldy5jc3MnKSwgcGF0aC5qb2luKGRpc3RGb2xkZXIsICd2aWV3ZXInLCAncmVhY3QtdHJlZXZpZXcuY3NzJykpKTtcblxuXHRcdFx0cmVzb2x2ZShQcm9taXNlLmFsbChwcm9taXNlcykgYXMgUHJvbWlzZTxhbnk+KTtcblx0XHR9KTtcblx0fSk7XG59XG5cbmNvbnN0IFdBVENIX0dSQU5VTEFSSVRZID0gMjAwMDtcbmZ1bmN0aW9uIHdhdGNoKCk6IHZvaWQge1xuXHRsZXQgbGFzdENoYW5nZVRpbWVzdGFtcCA9IDA7XG5cdGxldCBpc0J1aWxkaW5nID0gZmFsc2U7XG5cdGxldCB0aW1lcjogTm9kZUpTLlRpbWVyID0gbnVsbDtcblx0ZnVuY3Rpb24gcmVzZXRCdWlsZGluZygpIHtcblx0XHRjb25zb2xlLmxvZyhgW21ha2VfZGlzdF0gRmluaXNoZWQhYCk7XG5cdFx0aXNCdWlsZGluZyA9IGZhbHNlO1xuXHR9XG5cdGZ1bmN0aW9uIHRpbWVyRnVuY3Rpb24odGltZXN0YW1wOiBudW1iZXIpIHtcblx0XHRpZiAobGFzdENoYW5nZVRpbWVzdGFtcCAhPT0gdGltZXN0YW1wIHx8IGlzQnVpbGRpbmcpIHtcblx0XHRcdHRpbWVyID0gc2V0VGltZW91dCh0aW1lckZ1bmN0aW9uLCBXQVRDSF9HUkFOVUxBUklUWSwgbGFzdENoYW5nZVRpbWVzdGFtcCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRpbWVyID0gbnVsbDtcblx0XHRcdGlzQnVpbGRpbmcgPSB0cnVlO1xuXHRcdFx0Y29uc29sZS5sb2coYFttYWtlX2Rpc3RdIENoYW5nZSBkZXRlY3RlZCEgQ29weWluZyBmaWxlcyB0byBkaXN0Li4uYClcblx0XHRcdG1haW4oKS50aGVuKHJlc2V0QnVpbGRpbmcpLmNhdGNoKHJlc2V0QnVpbGRpbmcpO1xuXHRcdH1cblx0fVxuXG5cdGZzLndhdGNoKGJ1aWxkRm9sZGVyLCB7XG5cdFx0cmVjdXJzaXZlOiB0cnVlXG5cdH0sIGZ1bmN0aW9uKCkge1xuXHRcdGxhc3RDaGFuZ2VUaW1lc3RhbXAgPSBEYXRlLm5vdygpO1xuXHRcdGlmICghdGltZXIpIHtcblx0XHRcdHRpbWVyID0gc2V0VGltZW91dCh0aW1lckZ1bmN0aW9uLCBXQVRDSF9HUkFOVUxBUklUWSwgbGFzdENoYW5nZVRpbWVzdGFtcCk7XG5cdFx0fVxuXHR9KTtcblx0dGltZXJGdW5jdGlvbihsYXN0Q2hhbmdlVGltZXN0YW1wKTtcbn1cblxuaWYgKHNob3VsZFdhdGNoKSB7XG5cdHdhdGNoKCk7XG59IGVsc2Uge1xuXHRtYWluKCk7XG59XG4iXX0=