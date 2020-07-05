#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const rimraf = require("rimraf");
const shouldWatch = process.argv.indexOf("--watch") !== -1;
const buildFolder = path.resolve('build');
const distFolder = path.resolve('dist');
const htmlFolder = path.resolve('html');
if (!fs.existsSync(buildFolder)) {
    console.error("Cannot find build folder! Make sure you run this script from the root folder.");
    process.exit(1);
}
function mkdir(dir) {
    try {
        fs.mkdirSync(dir, 0o755);
    }
    catch (e) {
        if (e.code !== "EEXIST") {
            throw e;
        }
    }
}
async function copyDir(src, dest) {
    mkdir(dest);
    const files = fs.readdirSync(src);
    let promises = [];
    for (const file of files) {
        const from = path.join(src, file);
        const to = path.join(dest, file);
        const current = fs.lstatSync(from);
        if (current.isDirectory()) {
            promises.push(copyDir(from, to));
        }
        else if (current.isSymbolicLink()) {
            const symlink = fs.readlinkSync(from);
            fs.symlinkSync(symlink, to);
        }
        else {
            promises.push(copy(from, to));
        }
    }
    return Promise.all(promises);
}
async function copy(src, dest) {
    return new Promise((resolve, reject) => {
        const oldFile = fs.createReadStream(src);
        const newFile = fs.createWriteStream(dest);
        oldFile.pipe(newFile).on('close', resolve).on('error', reject);
    });
}
async function main() {
    return new Promise((resolve, reject) => {
        rimraf(distFolder, (err) => {
            if (err) {
                console.error(`Error removing existing dist folder:`);
                console.error(err);
                return reject(err);
            }
            mkdir(distFolder);
            const promises = [];
            promises.push(copyDir(path.join(buildFolder, 'node', 'src'), path.join(distFolder, 'node')));
            promises.push(copyDir(htmlFolder, path.join(distFolder, 'viewer')));
            const viewerSrcFolder = path.join(buildFolder, 'browser');
            ['viewer.js', 'viewer.js.map'].forEach((file) => {
                promises.push(copy(path.join(viewerSrcFolder, file), path.join(distFolder, 'viewer', file)));
            });
            promises.push(copy(path.resolve('node_modules', 'd3', 'build', 'd3.min.js'), path.join(distFolder, 'viewer', 'd3.min.js')));
            promises.push(copy(path.resolve('node_modules', 'react-treeview', 'react-treeview.css'), path.join(distFolder, 'viewer', 'react-treeview.css')));
            resolve(Promise.all(promises));
        });
    });
}
const WATCH_GRANULARITY = 2000;
function watch() {
    let lastChangeTimestamp = 0;
    let isBuilding = false;
    let timer = null;
    function resetBuilding() {
        console.log(`[make_dist] Finished!`);
        isBuilding = false;
    }
    function timerFunction(timestamp) {
        if (lastChangeTimestamp !== timestamp || isBuilding) {
            timer = setTimeout(timerFunction, WATCH_GRANULARITY, lastChangeTimestamp);
        }
        else {
            timer = null;
            isBuilding = true;
            console.log(`[make_dist] Change detected! Copying files to dist...`);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFrZV9kaXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc2NyaXB0cy9tYWtlX2Rpc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBSUEseUJBQXlCO0FBQ3pCLDZCQUE2QjtBQUM3QixpQ0FBaUM7QUFFakMsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7QUFDM0QsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUMxQyxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ3hDLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDeEMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNoQyxPQUFPLENBQUMsS0FBSyxDQUFDLCtFQUErRSxDQUFDLENBQUM7SUFDL0YsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNsQixDQUFDO0FBRUQsZUFBZSxHQUFXO0lBQ3pCLElBQUksQ0FBQztRQUNKLEVBQUUsQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQzFCLENBQUM7SUFBQyxLQUFLLENBQUEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ1gsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQ3pCLE1BQU0sQ0FBQyxDQUFDO1FBQ1QsQ0FBQztJQUNGLENBQUM7QUFDRixDQUFDO0FBRUQsS0FBSyxrQkFBa0IsR0FBVyxFQUFFLElBQVk7SUFDL0MsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ1osTUFBTSxLQUFLLEdBQUcs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O0lBQ0QsdUJBQXVCLFNBQWlCO1FBQ3ZDLEVBQUUsQ0FBQyxDQUFDLG1CQUFtQixLQUFLLFNBQVMsSUFBSSxVQUFVLENBQUMsQ0FBQyxDQUFDO1lBQ3JELEtBQUssR0FBRyxVQUFVLENBQUMsYUFBYSxFQUFFLGlCQUFpQixFQUFFLG1CQUFtQixDQUFDLENBQUM7UUFDM0UsQ0FBQztRQUFDLElBQUksQ0FBQyxDQUFDO1lBQ1AsS0FBSyxHQUFHLElBQUksQ0FBQztZQUNiLFVBQVUsR0FBRyxJQUFJLENBQUM7WUFDbEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyx1REFBdUQsQ0FBQyxDQUFBO1lBQ3BFLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDakQsQ0FBQztJQUNGLENBQUM7SUFFRCxFQUFFLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRTtRQUNyQixTQUFTLEVBQUUsSUFBSTtLQUNmLEVBQUU7UUFDRixtQkFBbUIsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDakMsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ1osS0FBSyxHQUFHLFVBQVUsQ0FBQyxhQUFhLEVBQUUsaUJBQWlCLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztRQUMzRSxDQUFDO0lBQ0YsQ0FBQyxDQUFDLENBQUM7SUFDSCxhQUFhLENBQUMsbUJBQW1CLENBQUMsQ0FBQztBQUNwQyxDQUFDO0FBRUQsRUFBRSxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztJQUNqQixLQUFLLEVBQUUsQ0FBQztBQUNULENBQUM7QUFBQyxJQUFJLENBQUMsQ0FBQztJQUNQLElBQUksRUFBRSxDQUFDO0FBQ1IsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIiMhL3Vzci9iaW4vZW52IG5vZGVcbi8qKlxuICogQXNzZW1ibGVzIHRoZSAnZGlzdCcgZm9sZGVyIGZvciBCTGVhay5cbiAqL1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIHJpbXJhZiBmcm9tICdyaW1yYWYnO1xuXG5jb25zdCBzaG91bGRXYXRjaCA9IHByb2Nlc3MuYXJndi5pbmRleE9mKFwiLS13YXRjaFwiKSAhPT0gLTE7XG5jb25zdCBidWlsZEZvbGRlciA9IHBhdGgucmVzb2x2ZSgnYnVpbGQnKTtcbmNvbnN0IGRpc3RGb2xkZXIgPSBwYXRoLnJlc29sdmUoJ2Rpc3QnKTtcbmNvbnN0IGh0bWxGb2xkZXIgPSBwYXRoLnJlc29sdmUoJ2h0bWwnKTtcbmlmICghZnMuZXhpc3RzU3luYyhidWlsZEZvbGRlcikpIHtcbiAgY29uc29sZS5lcnJvcihcIkNhbm5vdCBmaW5kIGJ1aWxkIGZvbGRlciEgTWFrZSBzdXJlIHlvdSBydW4gdGhpcyBzY3JpcHQgZnJvbSB0aGUgcm9vdCBmb2xkZXIuXCIpO1xuICBwcm9jZXNzLmV4aXQoMSk7XG59XG5cbmZ1bmN0aW9uIG1rZGlyKGRpcjogc3RyaW5nKTogdm9pZCB7XG5cdHRyeSB7XG5cdFx0ZnMubWtkaXJTeW5jKGRpciwgMG83NTUpO1xuXHR9IGNhdGNoKGUpIHtcblx0XHRpZiAoZS5jb2RlICE9PSBcIkVFWElTVFwiKSB7XG5cdFx0XHR0aHJvdyBlO1xuXHRcdH1cblx0fVxufVxuXG5hc3luYyBmdW5jdGlvbiBjb3B5RGlyKHNyYzogc3RyaW5nLCBkZXN0OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcblx0bWtkaXIoZGVzdCk7XG5cdGNvbnN0IGZpbGVzID0gZnMucmVhZGRpclN5bmMoc3JjKTtcblx0bGV0IHByb21pc2VzOiBQcm9taXNlPHZvaWQ+W10gPSBbXTtcblx0Zm9yIChjb25zdCBmaWxlIG9mIGZpbGVzKSB7XG4gICAgY29uc3QgZnJvbSA9IHBhdGguam9pbihzcmMsIGZpbGUpO1xuICAgIGNvbnN0IHRvID0gcGF0aC5qb2luKGRlc3QsIGZpbGUpO1xuXHRcdGNvbnN0IGN1cnJlbnQgPSBmcy5sc3RhdFN5bmMoZnJvbSk7XG5cdFx0aWYgKGN1cnJlbnQuaXNEaXJlY3RvcnkoKSkge1xuXHRcdFx0cHJvbWlzZXMucHVzaChjb3B5RGlyKGZyb20sIHRvKSk7XG5cdFx0fSBlbHNlIGlmIChjdXJyZW50LmlzU3ltYm9saWNMaW5rKCkpIHtcblx0XHRcdGNvbnN0IHN5bWxpbmsgPSBmcy5yZWFkbGlua1N5bmMoZnJvbSk7XG5cdFx0XHRmcy5zeW1saW5rU3luYyhzeW1saW5rLCB0byk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHByb21pc2VzLnB1c2goY29weShmcm9tLCB0bykpO1xuXHRcdH1cblx0fVxuXHRyZXR1cm4gUHJvbWlzZS5hbGwocHJvbWlzZXMpIGFzIFByb21pc2U8YW55Pjtcbn1cblxuYXN5bmMgZnVuY3Rpb24gY29weShzcmM6IHN0cmluZywgZGVzdDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG5cdHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cdFx0Y29uc3Qgb2xkRmlsZSA9IGZzLmNyZWF0ZVJlYWRTdHJlYW0oc3JjKTtcblx0XHRjb25zdCBuZXdGaWxlID0gZnMuY3JlYXRlV3JpdGVTdHJlYW0oZGVzdCk7XG5cdFx0b2xkRmlsZS5waXBlKG5ld0ZpbGUpLm9uKCdjbG9zZScsIHJlc29sdmUpLm9uKCdlcnJvcicsIHJlamVjdCk7XG5cdH0pO1xufVxuXG5hc3luYyBmdW5jdGlvbiBtYWluKCk6IFByb21pc2U8dm9pZD4ge1xuXHRyZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXHRcdHJpbXJhZihkaXN0Rm9sZGVyLCAoZXJyKSA9PiB7XG5cdFx0XHRpZiAoZXJyKSB7XG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IoYEVycm9yIHJlbW92aW5nIGV4aXN0aW5nIGRpc3QgZm9sZGVyOmApO1xuXHRcdFx0XHRjb25zb2xlLmVycm9yKGVycik7XG5cdFx0XHRcdHJldHVybiByZWplY3QoZXJyKTtcblx0XHRcdH1cblx0XHRcdG1rZGlyKGRpc3RGb2xkZXIpO1xuXHRcdFx0Y29uc3QgcHJvbWlzZXM6IFByb21pc2U8dm9pZD5bXSA9IFtdO1xuXHRcdFx0cHJvbWlzZXMucHVzaChjb3B5RGlyKHBhdGguam9pbihidWlsZEZvbGRlciwgJ25vZGUnLCAnc3JjJyksIHBhdGguam9pbihkaXN0Rm9sZGVyLCAnbm9kZScpKSk7XG5cdFx0XHRwcm9taXNlcy5wdXNoKGNvcHlEaXIoaHRtbEZvbGRlciwgcGF0aC5qb2luKGRpc3RGb2xkZXIsICd2aWV3ZXInKSkpO1xuXG5cdFx0XHRjb25zdCB2aWV3ZXJTcmNGb2xkZXIgPSBwYXRoLmpvaW4oYnVpbGRGb2xkZXIsICdicm93c2VyJyk7XG5cdFx0XHRbJ3ZpZXdlci5qcycsICd2aWV3ZXIuanMubWFwJ10uZm9yRWFjaCgoZmlsZSkgPT4ge1xuXHRcdFx0XHRwcm9taXNlcy5wdXNoKGNvcHkocGF0aC5qb2luKHZpZXdlclNyY0ZvbGRlciwgZmlsZSksIHBhdGguam9pbihkaXN0Rm9sZGVyLCAndmlld2VyJywgZmlsZSkpKTtcblx0XHRcdH0pO1xuXHRcdFx0cHJvbWlzZXMucHVzaChjb3B5KHBhdGgucmVzb2x2ZSgnbm9kZV9tb2R1bGVzJywgJ2QzJywgJ2J1aWxkJywgJ2QzLm1pbi5qcycpLCBwYXRoLmpvaW4oZGlzdEZvbGRlciwgJ3ZpZXdlcicsICdkMy5taW4uanMnKSkpO1xuXHRcdFx0cHJvbWlzZXMucHVzaChjb3B5KHBhdGgucmVzb2x2ZSgnbm9kZV9tb2R1bGVzJywgJ3JlYWN0LXRyZWV2aWV3JywgJ3JlYWN0LXRyZWV2aWV3LmNzcycpLCBwYXRoLmpvaW4oZGlzdEZvbGRlciwgJ3ZpZXdlcicsICdyZWFjdC10cmVldmlldy5jc3MnKSkpO1xuXG5cdFx0XHRyZXNvbHZlKFByb21pc2UuYWxsKHByb21pc2VzKSBhcyBQcm9taXNlPGFueT4pO1xuXHRcdH0pO1xuXHR9KTtcbn1cblxuY29uc3QgV0FUQ0hfR1JBTlVMQVJJVFkgPSAyMDAwO1xuZnVuY3Rpb24gd2F0Y2goKTogdm9pZCB7XG5cdGxldCBsYXN0Q2hhbmdlVGltZXN0YW1wID0gMDtcblx0bGV0IGlzQnVpbGRpbmcgPSBmYWxzZTtcblx0bGV0IHRpbWVyOiBOb2RlSlMuVGltZXIgPSBudWxsO1xuXHRmdW5jdGlvbiByZXNldEJ1aWxkaW5nKCkge1xuXHRcdGNvbnNvbGUubG9nKGBbbWFrZV9kaXN0XSBGaW5pc2hlZCFgKTtcblx0XHRpc0J1aWxkaW5nID0gZmFsc2U7XG5cdH1cblx0ZnVuY3Rpb24gdGltZXJGdW5jdGlvbih0aW1lc3RhbXA6IG51bWJlcikge1xuXHRcdGlmIChsYXN0Q2hhbmdlVGltZXN0YW1wICE9PSB0aW1lc3RhbXAgfHwgaXNCdWlsZGluZykge1xuXHRcdFx0dGltZXIgPSBzZXRUaW1lb3V0KHRpbWVyRnVuY3Rpb24sIFdBVENIX0dSQU5VTEFSSVRZLCBsYXN0Q2hhbmdlVGltZXN0YW1wKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGltZXIgPSBudWxsO1xuXHRcdFx0aXNCdWlsZGluZyA9IHRydWU7XG5cdFx0XHRjb25zb2xlLmxvZyhgW21ha2VfZGlzdF0gQ2hhbmdlIGRldGVjdGVkISBDb3B5aW5nIGZpbGVzIHRvIGRpc3QuLi5gKVxuXHRcdFx0bWFpbigpLnRoZW4ocmVzZXRCdWlsZGluZykuY2F0Y2gocmVzZXRCdWlsZGluZyk7XG5cdFx0fVxuXHR9XG5cblx0ZnMud2F0Y2goYnVpbGRGb2xkZXIsIHtcblx0XHRyZWN1cnNpdmU6IHRydWVcblx0fSwgZnVuY3Rpb24oKSB7XG5cdFx0bGFzdENoYW5nZVRpbWVzdGFtcCA9IERhdGUubm93KCk7XG5cdFx0aWYgKCF0aW1lcikge1xuXHRcdFx0dGltZXIgPSBzZXRUaW1lb3V0KHRpbWVyRnVuY3Rpb24sIFdBVENIX0dSQU5VTEFSSVRZLCBsYXN0Q2hhbmdlVGltZXN0YW1wKTtcblx0XHR9XG5cdH0pO1xuXHR0aW1lckZ1bmN0aW9uKGxhc3RDaGFuZ2VUaW1lc3RhbXApO1xufVxuXG5pZiAoc2hvdWxkV2F0Y2gpIHtcblx0d2F0Y2goKTtcbn0gZWxzZSB7XG5cdG1haW4oKTtcbn1cbiJdfQ==