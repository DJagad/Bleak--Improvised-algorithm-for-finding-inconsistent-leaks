import * as tslib_1 from "tslib";
import { default as FormatWorker } from './../formatter';
import SourceFile from './source_file';
/**
 * Queriable object that stores source files and source maps.
 */
var SourceFileManager = /** @class */ (function () {
    function SourceFileManager() {
        this._sourceFiles = Object.create(null);
    }
    /**
     * Constructs a SourceFileManager object from BLeakResults. Eagerly
     * formats the source files, and invokes the progress callback after
     * each finishes.
     * @param results
     * @param progress
     */
    SourceFileManager.FromBLeakResults = function (results, progress) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                        function completedCallback(url, source, formattedSource, mapping) {
                            completed++;
                            sfm.addSourceFile(url, source, formattedSource, mapping);
                            progress(completed, total);
                            if (completed === total) {
                                resolve(sfm);
                            }
                        }
                        var sfm, sourceFiles, completed, total, workers, i, sourceFile, fileContents;
                        return tslib_1.__generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    sfm = new SourceFileManager();
                                    sourceFiles = Object.keys(results.sourceFiles);
                                    completed = 0;
                                    total = sourceFiles.length;
                                    return [4 /*yield*/, Promise.all([FormatWorker.Create(), FormatWorker.Create()])];
                                case 1:
                                    workers = _a.sent();
                                    for (i = 0; i < sourceFiles.length; i++) {
                                        sourceFile = sourceFiles[i];
                                        fileContents = results.sourceFiles[sourceFile];
                                        workers[i % 2].format(fileContents.source, fileContents.mimeType, completedCallback.bind(null, sourceFile), reject);
                                    }
                                    if (total === 0) {
                                        // No source files.
                                        resolve(sfm);
                                    }
                                    return [2 /*return*/];
                            }
                        });
                    }); })];
            });
        });
    };
    SourceFileManager.prototype.addSourceFile = function (url, source, formattedSource, mapping) {
        this._sourceFiles[url] = new SourceFile(url, source, formattedSource, mapping);
    };
    SourceFileManager.prototype.getSourceFiles = function () {
        var _this = this;
        return Object.keys(this._sourceFiles).map(function (k) { return _this._sourceFiles[k]; });
    };
    SourceFileManager.prototype.getSourceFile = function (url) {
        return this._sourceFiles[url];
    };
    return SourceFileManager;
}());
export default SourceFileManager;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic291cmNlX2ZpbGVfbWFuYWdlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy92aWV3ZXIvbW9kZWwvc291cmNlX2ZpbGVfbWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQ0EsT0FBTyxFQUFDLE9BQU8sSUFBSSxZQUFZLEVBQXlCLE1BQU0sZ0JBQWdCLENBQUM7QUFDL0UsT0FBTyxVQUFVLE1BQU0sZUFBZSxDQUFDO0FBRXZDOztHQUVHO0FBQ0g7SUFBQTtRQXFDVSxpQkFBWSxHQUFnQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBYTFFLENBQUM7SUFqREM7Ozs7OztPQU1HO0lBQ2lCLGtDQUFnQixHQUFwQyxVQUFxQyxPQUFxQixFQUFFLFFBQW9EOzs7O2dCQUM5RyxzQkFBTyxJQUFJLE9BQU8sQ0FBb0IsVUFBTyxPQUFPLEVBQUUsTUFBTTt3QkFLMUQsMkJBQTJCLEdBQVcsRUFBRSxNQUFjLEVBQUUsZUFBdUIsRUFBRSxPQUErQjs0QkFDOUcsU0FBUyxFQUFFLENBQUM7NEJBQ1osR0FBRyxDQUFDLGFBQWEsQ0FBQyxHQUFHLEVBQUUsTUFBTSxFQUFFLGVBQWUsRUFBRSxPQUFPLENBQUMsQ0FBQzs0QkFDekQsUUFBUSxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQzs0QkFDM0IsRUFBRSxDQUFDLENBQUMsU0FBUyxLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUM7Z0NBQ3hCLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQzs0QkFDZixDQUFDO3dCQUNILENBQUM7Ozs7O29DQVhLLEdBQUcsR0FBRyxJQUFJLGlCQUFpQixFQUFFLENBQUM7b0NBQzlCLFdBQVcsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQztvQ0FDakQsU0FBUyxHQUFHLENBQUMsQ0FBQztvQ0FDZCxLQUFLLEdBQUcsV0FBVyxDQUFDLE1BQU0sQ0FBQztvQ0FXZixxQkFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxFQUFFLFlBQVksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLEVBQUE7O29DQUEzRSxPQUFPLEdBQUcsU0FBaUU7b0NBQ2pGLEdBQUcsQ0FBQyxDQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQzt3Q0FDdEMsVUFBVSxHQUFHLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQzt3Q0FDNUIsWUFBWSxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUM7d0NBQ3JELE9BQU8sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsWUFBWSxDQUFDLFFBQVEsRUFBRSxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO29DQUN0SCxDQUFDO29DQUNELEVBQUUsQ0FBQyxDQUFDLEtBQUssS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO3dDQUNoQixtQkFBbUI7d0NBQ25CLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztvQ0FDZixDQUFDOzs7O3lCQUNGLENBQUMsRUFBQzs7O0tBQ0o7SUFJTSx5Q0FBYSxHQUFwQixVQUFxQixHQUFXLEVBQUUsTUFBYyxFQUFFLGVBQXVCLEVBQUUsT0FBK0I7UUFDeEcsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLFVBQVUsQ0FBQyxHQUFHLEVBQUUsTUFBTSxFQUFFLGVBQWUsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUNqRixDQUFDO0lBRU0sMENBQWMsR0FBckI7UUFBQSxpQkFFQztRQURDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBQyxDQUFDLElBQUssT0FBQSxLQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxFQUFwQixDQUFvQixDQUFDLENBQUM7SUFDekUsQ0FBQztJQUVNLHlDQUFhLEdBQXBCLFVBQXFCLEdBQVc7UUFDOUIsTUFBTSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDaEMsQ0FBQztJQUNILHdCQUFDO0FBQUQsQ0FBQyxBQWxERCxJQWtEQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBCTGVha1Jlc3VsdHMgZnJvbSAnLi4vLi4vbGliL2JsZWFrX3Jlc3VsdHMnO1xuaW1wb3J0IHtkZWZhdWx0IGFzIEZvcm1hdFdvcmtlciwgRm9ybWF0dGVyU291cmNlTWFwcGluZ30gZnJvbSAnLi8uLi9mb3JtYXR0ZXInO1xuaW1wb3J0IFNvdXJjZUZpbGUgZnJvbSAnLi9zb3VyY2VfZmlsZSc7XG5cbi8qKlxuICogUXVlcmlhYmxlIG9iamVjdCB0aGF0IHN0b3JlcyBzb3VyY2UgZmlsZXMgYW5kIHNvdXJjZSBtYXBzLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTb3VyY2VGaWxlTWFuYWdlciB7XG4gIC8qKlxuICAgKiBDb25zdHJ1Y3RzIGEgU291cmNlRmlsZU1hbmFnZXIgb2JqZWN0IGZyb20gQkxlYWtSZXN1bHRzLiBFYWdlcmx5XG4gICAqIGZvcm1hdHMgdGhlIHNvdXJjZSBmaWxlcywgYW5kIGludm9rZXMgdGhlIHByb2dyZXNzIGNhbGxiYWNrIGFmdGVyXG4gICAqIGVhY2ggZmluaXNoZXMuXG4gICAqIEBwYXJhbSByZXN1bHRzXG4gICAqIEBwYXJhbSBwcm9ncmVzc1xuICAgKi9cbiAgcHVibGljIHN0YXRpYyBhc3luYyBGcm9tQkxlYWtSZXN1bHRzKHJlc3VsdHM6IEJMZWFrUmVzdWx0cywgcHJvZ3Jlc3M6IChjb21wbGV0ZWQ6IG51bWJlciwgdG90YWw6IG51bWJlcikgPT4gdm9pZCk6IFByb21pc2U8U291cmNlRmlsZU1hbmFnZXI+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2U8U291cmNlRmlsZU1hbmFnZXI+KGFzeW5jIChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGNvbnN0IHNmbSA9IG5ldyBTb3VyY2VGaWxlTWFuYWdlcigpO1xuICAgICAgY29uc3Qgc291cmNlRmlsZXMgPSBPYmplY3Qua2V5cyhyZXN1bHRzLnNvdXJjZUZpbGVzKTtcbiAgICAgIGxldCBjb21wbGV0ZWQgPSAwO1xuICAgICAgbGV0IHRvdGFsID0gc291cmNlRmlsZXMubGVuZ3RoO1xuICAgICAgZnVuY3Rpb24gY29tcGxldGVkQ2FsbGJhY2sodXJsOiBzdHJpbmcsIHNvdXJjZTogc3RyaW5nLCBmb3JtYXR0ZWRTb3VyY2U6IHN0cmluZywgbWFwcGluZzogRm9ybWF0dGVyU291cmNlTWFwcGluZykge1xuICAgICAgICBjb21wbGV0ZWQrKztcbiAgICAgICAgc2ZtLmFkZFNvdXJjZUZpbGUodXJsLCBzb3VyY2UsIGZvcm1hdHRlZFNvdXJjZSwgbWFwcGluZyk7XG4gICAgICAgIHByb2dyZXNzKGNvbXBsZXRlZCwgdG90YWwpO1xuICAgICAgICBpZiAoY29tcGxldGVkID09PSB0b3RhbCkge1xuICAgICAgICAgIHJlc29sdmUoc2ZtKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy8gQXNzdW1wdGlvbjogV2UncmUgb24gYSB+MiBjb3JlIG1hY2hpbmUsIHNvIGxldCdzIHdvcmsgaXQgYSBiaXRcbiAgICAgIC8vIHcvIHR3byBwYXJhbGxlbCBmb3JtYXQgcmVxdWVzdHMuXG4gICAgICBjb25zdCB3b3JrZXJzID0gYXdhaXQgUHJvbWlzZS5hbGwoW0Zvcm1hdFdvcmtlci5DcmVhdGUoKSwgRm9ybWF0V29ya2VyLkNyZWF0ZSgpXSk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNvdXJjZUZpbGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IHNvdXJjZUZpbGUgPSBzb3VyY2VGaWxlc1tpXTtcbiAgICAgICAgY29uc3QgZmlsZUNvbnRlbnRzID0gcmVzdWx0cy5zb3VyY2VGaWxlc1tzb3VyY2VGaWxlXTtcbiAgICAgICAgd29ya2Vyc1tpICUgMl0uZm9ybWF0KGZpbGVDb250ZW50cy5zb3VyY2UsIGZpbGVDb250ZW50cy5taW1lVHlwZSwgY29tcGxldGVkQ2FsbGJhY2suYmluZChudWxsLCBzb3VyY2VGaWxlKSwgcmVqZWN0KTtcbiAgICAgIH1cbiAgICAgIGlmICh0b3RhbCA9PT0gMCkge1xuICAgICAgICAvLyBObyBzb3VyY2UgZmlsZXMuXG4gICAgICAgIHJlc29sdmUoc2ZtKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgX3NvdXJjZUZpbGVzOiB7W3VybDogc3RyaW5nXTogU291cmNlRmlsZX0gPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG4gIHB1YmxpYyBhZGRTb3VyY2VGaWxlKHVybDogc3RyaW5nLCBzb3VyY2U6IHN0cmluZywgZm9ybWF0dGVkU291cmNlOiBzdHJpbmcsIG1hcHBpbmc6IEZvcm1hdHRlclNvdXJjZU1hcHBpbmcpOiB2b2lkIHtcbiAgICB0aGlzLl9zb3VyY2VGaWxlc1t1cmxdID0gbmV3IFNvdXJjZUZpbGUodXJsLCBzb3VyY2UsIGZvcm1hdHRlZFNvdXJjZSwgbWFwcGluZyk7XG4gIH1cblxuICBwdWJsaWMgZ2V0U291cmNlRmlsZXMoKTogU291cmNlRmlsZVtdIHtcbiAgICByZXR1cm4gT2JqZWN0LmtleXModGhpcy5fc291cmNlRmlsZXMpLm1hcCgoaykgPT4gdGhpcy5fc291cmNlRmlsZXNba10pO1xuICB9XG5cbiAgcHVibGljIGdldFNvdXJjZUZpbGUodXJsOiBzdHJpbmcpOiBTb3VyY2VGaWxlIHtcbiAgICByZXR1cm4gdGhpcy5fc291cmNlRmlsZXNbdXJsXTtcbiAgfVxufVxuIl19