"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const formatter_1 = require("./../formatter");
const source_file_1 = require("./source_file");
/**
 * Queriable object that stores source files and source maps.
 */
class SourceFileManager {
    constructor() {
        this._sourceFiles = Object.create(null);
    }
    /**
     * Constructs a SourceFileManager object from BLeakResults. Eagerly
     * formats the source files, and invokes the progress callback after
     * each finishes.
     * @param results
     * @param progress
     */
    static async FromBLeakResults(results, progress) {
        return new Promise(async (resolve, reject) => {
            const sfm = new SourceFileManager();
            const sourceFiles = Object.keys(results.sourceFiles);
            let completed = 0;
            let total = sourceFiles.length;
            function completedCallback(url, source, formattedSource, mapping) {
                completed++;
                sfm.addSourceFile(url, source, formattedSource, mapping);
                progress(completed, total);
                if (completed === total) {
                    resolve(sfm);
                }
            }
            // Assumption: We're on a ~2 core machine, so let's work it a bit
            // w/ two parallel format requests.
            const workers = await Promise.all([formatter_1.default.Create(), formatter_1.default.Create()]);
            for (let i = 0; i < sourceFiles.length; i++) {
                const sourceFile = sourceFiles[i];
                const fileContents = results.sourceFiles[sourceFile];
                workers[i % 2].format(fileContents.source, fileContents.mimeType, completedCallback.bind(null, sourceFile), reject);
            }
            if (total === 0) {
                // No source files.
                resolve(sfm);
            }
        });
    }
    addSourceFile(url, source, formattedSource, mapping) {
        this._sourceFiles[url] = new source_file_1.default(url, source, formattedSource, mapping);
    }
    getSourceFiles() {
        return Object.keys(this._sourceFiles).map((k) => this._sourceFiles[k]);
    }
    getSourceFile(url) {
        return this._sourceFiles[url];
    }
}
exports.default = SourceFileManager;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic291cmNlX2ZpbGVfbWFuYWdlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy92aWV3ZXIvbW9kZWwvc291cmNlX2ZpbGVfbWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUNBLDhDQUErRTtBQUMvRSwrQ0FBdUM7QUFFdkM7O0dBRUc7QUFDSDtJQUFBO1FBcUNVLGlCQUFZLEdBQWdDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7SUFhMUUsQ0FBQztJQWpEQzs7Ozs7O09BTUc7SUFDSSxNQUFNLENBQUMsS0FBSyxDQUFDLGdCQUFnQixDQUFDLE9BQXFCLEVBQUUsUUFBb0Q7UUFDOUcsTUFBTSxDQUFDLElBQUksT0FBTyxDQUFvQixLQUFLLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1lBQzlELE1BQU0sR0FBRyxHQUFHLElBQUksaUJBQWlCLEVBQUUsQ0FBQztZQUNwQyxNQUFNLFdBQVcsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUNyRCxJQUFJLFNBQVMsR0FBRyxDQUFDLENBQUM7WUFDbEIsSUFBSSxLQUFLLEdBQUcsV0FBVyxDQUFDLE1BQU0sQ0FBQztZQUMvQiwyQkFBMkIsR0FBVyxFQUFFLE1BQWMsRUFBRSxlQUF1QixFQUFFLE9BQStCO2dCQUM5RyxTQUFTLEVBQUUsQ0FBQztnQkFDWixHQUFHLENBQUMsYUFBYSxDQUFDLEdBQUcsRUFBRSxNQUFNLEVBQUUsZUFBZSxFQUFFLE9BQU8sQ0FBQyxDQUFDO2dCQUN6RCxRQUFRLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUMzQixFQUFFLENBQUMsQ0FBQyxTQUFTLEtBQUssS0FBSyxDQUFDLENBQUMsQ0FBQztvQkFDeEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNmLENBQUM7WUFDSCxDQUFDO1lBQ0QsaUVBQWlFO1lBQ2pFLG1DQUFtQztZQUNuQyxNQUFNLE9BQU8sR0FBRyxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxtQkFBWSxDQUFDLE1BQU0sRUFBRSxFQUFFLG1CQUFZLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xGLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsV0FBVyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUM1QyxNQUFNLFVBQVUsR0FBRyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2xDLE1BQU0sWUFBWSxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQ3JELE9BQU8sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsWUFBWSxDQUFDLFFBQVEsRUFBRSxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ3RILENBQUM7WUFDRCxFQUFFLENBQUMsQ0FBQyxLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDaEIsbUJBQW1CO2dCQUNuQixPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDZixDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBSU0sYUFBYSxDQUFDLEdBQVcsRUFBRSxNQUFjLEVBQUUsZUFBdUIsRUFBRSxPQUErQjtRQUN4RyxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUkscUJBQVUsQ0FBQyxHQUFHLEVBQUUsTUFBTSxFQUFFLGVBQWUsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUNqRixDQUFDO0lBRU0sY0FBYztRQUNuQixNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDekUsQ0FBQztJQUVNLGFBQWEsQ0FBQyxHQUFXO1FBQzlCLE1BQU0sQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2hDLENBQUM7Q0FDRjtBQWxERCxvQ0FrREMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgQkxlYWtSZXN1bHRzIGZyb20gJy4uLy4uL2xpYi9ibGVha19yZXN1bHRzJztcbmltcG9ydCB7ZGVmYXVsdCBhcyBGb3JtYXRXb3JrZXIsIEZvcm1hdHRlclNvdXJjZU1hcHBpbmd9IGZyb20gJy4vLi4vZm9ybWF0dGVyJztcbmltcG9ydCBTb3VyY2VGaWxlIGZyb20gJy4vc291cmNlX2ZpbGUnO1xuXG4vKipcbiAqIFF1ZXJpYWJsZSBvYmplY3QgdGhhdCBzdG9yZXMgc291cmNlIGZpbGVzIGFuZCBzb3VyY2UgbWFwcy5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU291cmNlRmlsZU1hbmFnZXIge1xuICAvKipcbiAgICogQ29uc3RydWN0cyBhIFNvdXJjZUZpbGVNYW5hZ2VyIG9iamVjdCBmcm9tIEJMZWFrUmVzdWx0cy4gRWFnZXJseVxuICAgKiBmb3JtYXRzIHRoZSBzb3VyY2UgZmlsZXMsIGFuZCBpbnZva2VzIHRoZSBwcm9ncmVzcyBjYWxsYmFjayBhZnRlclxuICAgKiBlYWNoIGZpbmlzaGVzLlxuICAgKiBAcGFyYW0gcmVzdWx0c1xuICAgKiBAcGFyYW0gcHJvZ3Jlc3NcbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgYXN5bmMgRnJvbUJMZWFrUmVzdWx0cyhyZXN1bHRzOiBCTGVha1Jlc3VsdHMsIHByb2dyZXNzOiAoY29tcGxldGVkOiBudW1iZXIsIHRvdGFsOiBudW1iZXIpID0+IHZvaWQpOiBQcm9taXNlPFNvdXJjZUZpbGVNYW5hZ2VyPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPFNvdXJjZUZpbGVNYW5hZ2VyPihhc3luYyAocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBjb25zdCBzZm0gPSBuZXcgU291cmNlRmlsZU1hbmFnZXIoKTtcbiAgICAgIGNvbnN0IHNvdXJjZUZpbGVzID0gT2JqZWN0LmtleXMocmVzdWx0cy5zb3VyY2VGaWxlcyk7XG4gICAgICBsZXQgY29tcGxldGVkID0gMDtcbiAgICAgIGxldCB0b3RhbCA9IHNvdXJjZUZpbGVzLmxlbmd0aDtcbiAgICAgIGZ1bmN0aW9uIGNvbXBsZXRlZENhbGxiYWNrKHVybDogc3RyaW5nLCBzb3VyY2U6IHN0cmluZywgZm9ybWF0dGVkU291cmNlOiBzdHJpbmcsIG1hcHBpbmc6IEZvcm1hdHRlclNvdXJjZU1hcHBpbmcpIHtcbiAgICAgICAgY29tcGxldGVkKys7XG4gICAgICAgIHNmbS5hZGRTb3VyY2VGaWxlKHVybCwgc291cmNlLCBmb3JtYXR0ZWRTb3VyY2UsIG1hcHBpbmcpO1xuICAgICAgICBwcm9ncmVzcyhjb21wbGV0ZWQsIHRvdGFsKTtcbiAgICAgICAgaWYgKGNvbXBsZXRlZCA9PT0gdG90YWwpIHtcbiAgICAgICAgICByZXNvbHZlKHNmbSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vIEFzc3VtcHRpb246IFdlJ3JlIG9uIGEgfjIgY29yZSBtYWNoaW5lLCBzbyBsZXQncyB3b3JrIGl0IGEgYml0XG4gICAgICAvLyB3LyB0d28gcGFyYWxsZWwgZm9ybWF0IHJlcXVlc3RzLlxuICAgICAgY29uc3Qgd29ya2VycyA9IGF3YWl0IFByb21pc2UuYWxsKFtGb3JtYXRXb3JrZXIuQ3JlYXRlKCksIEZvcm1hdFdvcmtlci5DcmVhdGUoKV0pO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzb3VyY2VGaWxlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBzb3VyY2VGaWxlID0gc291cmNlRmlsZXNbaV07XG4gICAgICAgIGNvbnN0IGZpbGVDb250ZW50cyA9IHJlc3VsdHMuc291cmNlRmlsZXNbc291cmNlRmlsZV07XG4gICAgICAgIHdvcmtlcnNbaSAlIDJdLmZvcm1hdChmaWxlQ29udGVudHMuc291cmNlLCBmaWxlQ29udGVudHMubWltZVR5cGUsIGNvbXBsZXRlZENhbGxiYWNrLmJpbmQobnVsbCwgc291cmNlRmlsZSksIHJlamVjdCk7XG4gICAgICB9XG4gICAgICBpZiAodG90YWwgPT09IDApIHtcbiAgICAgICAgLy8gTm8gc291cmNlIGZpbGVzLlxuICAgICAgICByZXNvbHZlKHNmbSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIF9zb3VyY2VGaWxlczoge1t1cmw6IHN0cmluZ106IFNvdXJjZUZpbGV9ID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcblxuICBwdWJsaWMgYWRkU291cmNlRmlsZSh1cmw6IHN0cmluZywgc291cmNlOiBzdHJpbmcsIGZvcm1hdHRlZFNvdXJjZTogc3RyaW5nLCBtYXBwaW5nOiBGb3JtYXR0ZXJTb3VyY2VNYXBwaW5nKTogdm9pZCB7XG4gICAgdGhpcy5fc291cmNlRmlsZXNbdXJsXSA9IG5ldyBTb3VyY2VGaWxlKHVybCwgc291cmNlLCBmb3JtYXR0ZWRTb3VyY2UsIG1hcHBpbmcpO1xuICB9XG5cbiAgcHVibGljIGdldFNvdXJjZUZpbGVzKCk6IFNvdXJjZUZpbGVbXSB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMuX3NvdXJjZUZpbGVzKS5tYXAoKGspID0+IHRoaXMuX3NvdXJjZUZpbGVzW2tdKTtcbiAgfVxuXG4gIHB1YmxpYyBnZXRTb3VyY2VGaWxlKHVybDogc3RyaW5nKTogU291cmNlRmlsZSB7XG4gICAgcmV0dXJuIHRoaXMuX3NvdXJjZUZpbGVzW3VybF07XG4gIH1cbn1cbiJdfQ==