import * as tslib_1 from "tslib";
import * as React from 'react';
import BLeakResults from '../../lib/bleak_results';
import { default as HeapGrowthGraph, isRankingEvaluationComplete } from './heap_growth_graph';
import LeakRootsAndStackTraces from './leak_roots_and_stack_traces';
import SourceCodeViewer from './source_code_view';
import SourceFileManager from '../model/source_file_manager';
import Location from '../model/location';
import StackTraceManager from '../model/stack_trace_manager';
import GrowthReductionTable from './growth_reduction_table';
import GrowthReductionGraph from './growth_reduction_graph';
var App = /** @class */ (function (_super) {
    tslib_1.__extends(App, _super);
    function App(p, c) {
        var _this = _super.call(this, p, c) || this;
        _this.state = {
            state: 0 /* WAIT_FOR_FILE */,
            bleakResults: null,
            stackTraces: null,
            sourceFileManager: null,
            errorMessage: null,
            progress: -1,
            progressMessage: null,
            selectedLocation: null
        };
        return _this;
    }
    App.prototype._onFileSelect = function () {
        var _this = this;
        var input = this.refs['file_select'];
        var files = input.files;
        if (files.length > 0) {
            this.setState({
                state: 1 /* PROCESSING_FILE */,
                progress: 10,
                progressMessage: "Reading in file...",
                errorMessage: null
            });
            var file = files[0];
            var reader = new FileReader();
            reader.onload = function (e) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                var _this = this;
                var bleakResults, sourceFileManager, sourceFiles, stackTraces, e_1;
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            bleakResults = BLeakResults.FromJSON(JSON.parse(e.target.result));
                            return [4 /*yield*/, SourceFileManager.FromBLeakResults(bleakResults, function (completed, total) {
                                    var percent = 10 + (completed / total) * 90;
                                    _this.setState({
                                        progress: percent,
                                        progressMessage: completed + " of " + total + " source files formatted..."
                                    });
                                })];
                        case 1:
                            sourceFileManager = _a.sent();
                            sourceFiles = sourceFileManager.getSourceFiles();
                            stackTraces = StackTraceManager.FromBLeakResults(sourceFileManager, bleakResults);
                            this.setState({
                                state: 2 /* DISPLAYING_FILE */,
                                bleakResults: bleakResults,
                                sourceFileManager: sourceFileManager,
                                stackTraces: stackTraces,
                                selectedLocation: new Location(sourceFiles[0], 1, 1, true)
                            });
                            return [3 /*break*/, 3];
                        case 2:
                            e_1 = _a.sent();
                            this.setState({
                                state: 0 /* WAIT_FOR_FILE */,
                                errorMessage: "" + e_1
                            });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); };
            reader.readAsText(file);
        }
        else {
            this.setState({
                state: 0 /* WAIT_FOR_FILE */,
                errorMessage: "Please select a file."
            });
        }
    };
    App.prototype.componentWillUpdate = function (nextProps, nextState) {
        if (this.refs['file_select']) {
            var fileSelect = this.refs['file_select'];
            fileSelect.setCustomValidity(nextState.errorMessage);
        }
    };
    App.prototype.render = function () {
        var _this = this;
        var rankEvalComplete = this.state.state === 2 /* DISPLAYING_FILE */ && isRankingEvaluationComplete(this.state.bleakResults);
        return React.createElement("div", null,
            React.createElement("nav", { className: "navbar navbar-expand-md navbar-dark bg-dark fixed-top" },
                React.createElement("a", { className: "navbar-brand", href: "/" },
                    React.createElement("img", { src: "icon.svg", className: "icon" }),
                    " BLeak Results Viewer")),
            React.createElement("main", { role: "main", className: "container-fluid" },
                this.state.state === 0 /* WAIT_FOR_FILE */ || this.state.state === 1 /* PROCESSING_FILE */ ?
                    React.createElement("div", { className: "jumbotron", key: "bleakUpload" },
                        React.createElement("h1", { className: "display-4" }, "Upload Results File"),
                        React.createElement("p", { className: "lead" }, "Upload bleak_results.json from a BLeak run to view the results."),
                        React.createElement("hr", { className: "my-4" }),
                        React.createElement("form", { className: "needs-validation" + (this.state.errorMessage ? " was-validated" : "") }, this.state.state === 1 /* PROCESSING_FILE */ ?
                            React.createElement("div", { className: "progress", key: "bleakProgress" },
                                React.createElement("div", { className: "progress-bar", role: "progressbar", style: { width: this.state.progress.toFixed(0) + "%" }, "aria-valuenow": this.state.progress, "aria-valuemin": 0, "aria-valuemax": 100 }, this.state.progressMessage)) :
                            React.createElement("div", { key: "bleakUploadForm", className: "form-group" },
                                React.createElement("input", { ref: "file_select", type: "file", className: "form-control form-control-file" + (this.state.errorMessage ? " is-invalid" : ""), id: "bleakResultsUpload", accept: ".json" }),
                                React.createElement("div", { className: "invalid-feedback" }, this.state.errorMessage))),
                        React.createElement("p", { className: "lead" },
                            React.createElement("button", { type: "submit", className: "btn btn-primary", disabled: this.state.state === 1 /* PROCESSING_FILE */, onClick: this._onFileSelect.bind(this) }, "Submit")))
                    : '',
                this.state.state === 2 /* DISPLAYING_FILE */ ? React.createElement("div", { key: "bleakResults" },
                    React.createElement("div", { className: "row" },
                        React.createElement("div", { className: rankEvalComplete ? "col-sm-7" : "col-sm" },
                            React.createElement("h3", null, "Live Heap Size"),
                            React.createElement(HeapGrowthGraph, { key: "heap_growth", bleakResults: this.state.bleakResults })),
                        rankEvalComplete ? React.createElement("div", { key: "rankingEvalTable", className: "col-sm-5" },
                            React.createElement("h3", null, "Growth Reduction for Top Leaks Fixed"),
                            React.createElement(GrowthReductionGraph, { bleakResults: this.state.bleakResults }),
                            React.createElement(GrowthReductionTable, { bleakResults: this.state.bleakResults })) : ''),
                    React.createElement("div", { className: "row" },
                        React.createElement("div", { className: "col-sm-5" },
                            React.createElement("h3", null, "Leak Roots and Stack Traces"),
                            React.createElement(LeakRootsAndStackTraces, { key: "leak_root_list", onStackFrameSelect: function (sf) {
                                    _this.setState({
                                        selectedLocation: sf
                                    });
                                }, bleakResults: this.state.bleakResults, stackTraces: this.state.stackTraces, selectedLocation: this.state.selectedLocation })),
                        React.createElement("div", { className: "col-sm-7" },
                            React.createElement("h3", null, "Source Code"),
                            this.state.sourceFileManager.getSourceFiles().length === 0 ? React.createElement("p", { key: "no_source_files" }, "No source files found in results file.") : React.createElement(SourceCodeViewer, { key: "source_code_viewer", files: this.state.sourceFileManager, stackTraces: this.state.stackTraces, location: this.state.selectedLocation })))) : ''));
    };
    return App;
}(React.Component));
export default App;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL3ZpZXdlci9jb21wb25lbnRzL2FwcC50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sS0FBSyxLQUFLLE1BQU0sT0FBTyxDQUFDO0FBQy9CLE9BQU8sWUFBWSxNQUFNLHlCQUF5QixDQUFDO0FBQ25ELE9BQU8sRUFBQyxPQUFPLElBQUksZUFBZSxFQUFFLDJCQUEyQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDNUYsT0FBTyx1QkFBdUIsTUFBTSwrQkFBK0IsQ0FBQztBQUNwRSxPQUFPLGdCQUFnQixNQUFNLG9CQUFvQixDQUFDO0FBQ2xELE9BQU8saUJBQWlCLE1BQU0sOEJBQThCLENBQUM7QUFDN0QsT0FBTyxRQUFRLE1BQU0sbUJBQW1CLENBQUM7QUFDekMsT0FBTyxpQkFBaUIsTUFBTSw4QkFBOEIsQ0FBQztBQUM3RCxPQUFPLG9CQUFvQixNQUFNLDBCQUEwQixDQUFDO0FBQzVELE9BQU8sb0JBQW9CLE1BQU0sMEJBQTBCLENBQUM7QUFtQjVEO0lBQWlDLCtCQUE2QjtJQUM1RCxhQUFZLENBQUssRUFBRSxDQUFPO1FBQTFCLFlBQ0Usa0JBQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxTQVdaO1FBVkMsS0FBSSxDQUFDLEtBQUssR0FBRztZQUNYLEtBQUssdUJBQXlCO1lBQzlCLFlBQVksRUFBRSxJQUFJO1lBQ2xCLFdBQVcsRUFBRSxJQUFJO1lBQ2pCLGlCQUFpQixFQUFFLElBQUk7WUFDdkIsWUFBWSxFQUFFLElBQUk7WUFDbEIsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUNaLGVBQWUsRUFBRSxJQUFJO1lBQ3JCLGdCQUFnQixFQUFFLElBQUk7U0FDdkIsQ0FBQzs7SUFDSixDQUFDO0lBRU8sMkJBQWEsR0FBckI7UUFBQSxpQkE2Q0M7UUE1Q0MsSUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQXFCLENBQUM7UUFD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ZnJvbSAncmVhY3QnO1xuaW1wb3J0IEJMZWFrUmVzdWx0cyBmcm9tICcuLi8uLi9saWIvYmxlYWtfcmVzdWx0cyc7XG5pbXBvcnQge2RlZmF1bHQgYXMgSGVhcEdyb3d0aEdyYXBoLCBpc1JhbmtpbmdFdmFsdWF0aW9uQ29tcGxldGV9IGZyb20gJy4vaGVhcF9ncm93dGhfZ3JhcGgnO1xuaW1wb3J0IExlYWtSb290c0FuZFN0YWNrVHJhY2VzIGZyb20gJy4vbGVha19yb290c19hbmRfc3RhY2tfdHJhY2VzJztcbmltcG9ydCBTb3VyY2VDb2RlVmlld2VyIGZyb20gJy4vc291cmNlX2NvZGVfdmlldyc7XG5pbXBvcnQgU291cmNlRmlsZU1hbmFnZXIgZnJvbSAnLi4vbW9kZWwvc291cmNlX2ZpbGVfbWFuYWdlcic7XG5pbXBvcnQgTG9jYXRpb24gZnJvbSAnLi4vbW9kZWwvbG9jYXRpb24nO1xuaW1wb3J0IFN0YWNrVHJhY2VNYW5hZ2VyIGZyb20gJy4uL21vZGVsL3N0YWNrX3RyYWNlX21hbmFnZXInO1xuaW1wb3J0IEdyb3d0aFJlZHVjdGlvblRhYmxlIGZyb20gJy4vZ3Jvd3RoX3JlZHVjdGlvbl90YWJsZSc7XG5pbXBvcnQgR3Jvd3RoUmVkdWN0aW9uR3JhcGggZnJvbSAnLi9ncm93dGhfcmVkdWN0aW9uX2dyYXBoJztcblxuY29uc3QgZW51bSBWaWV3U3RhdGUge1xuICBXQUlUX0ZPUl9GSUxFLFxuICBQUk9DRVNTSU5HX0ZJTEUsXG4gIERJU1BMQVlJTkdfRklMRVxufVxuXG5pbnRlcmZhY2UgQXBwU3RhdGUge1xuICBzdGF0ZTogVmlld1N0YXRlO1xuICBibGVha1Jlc3VsdHM6IEJMZWFrUmVzdWx0cyB8IG51bGw7XG4gIHN0YWNrVHJhY2VzOiBTdGFja1RyYWNlTWFuYWdlciB8IG51bGw7XG4gIHNvdXJjZUZpbGVNYW5hZ2VyOiBTb3VyY2VGaWxlTWFuYWdlciB8IG51bGw7XG4gIGVycm9yTWVzc2FnZTogc3RyaW5nIHwgbnVsbDtcbiAgcHJvZ3Jlc3M6IG51bWJlcjtcbiAgcHJvZ3Jlc3NNZXNzYWdlOiBzdHJpbmcgfCBudWxsO1xuICBzZWxlY3RlZExvY2F0aW9uOiBMb2NhdGlvbiB8IG51bGw7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEFwcCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudDx7fSwgQXBwU3RhdGU+IHtcbiAgY29uc3RydWN0b3IocDoge30sIGM/OiBhbnkpIHtcbiAgICBzdXBlcihwLCBjKTtcbiAgICB0aGlzLnN0YXRlID0ge1xuICAgICAgc3RhdGU6IFZpZXdTdGF0ZS5XQUlUX0ZPUl9GSUxFLFxuICAgICAgYmxlYWtSZXN1bHRzOiBudWxsLFxuICAgICAgc3RhY2tUcmFjZXM6IG51bGwsXG4gICAgICBzb3VyY2VGaWxlTWFuYWdlcjogbnVsbCxcbiAgICAgIGVycm9yTWVzc2FnZTogbnVsbCxcbiAgICAgIHByb2dyZXNzOiAtMSxcbiAgICAgIHByb2dyZXNzTWVzc2FnZTogbnVsbCxcbiAgICAgIHNlbGVjdGVkTG9jYXRpb246IG51bGxcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBfb25GaWxlU2VsZWN0KCkge1xuICAgIGNvbnN0IGlucHV0ID0gdGhpcy5yZWZzWydmaWxlX3NlbGVjdCddIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gICAgY29uc3QgZmlsZXMgPSBpbnB1dC5maWxlcztcbiAgICBpZiAoZmlsZXMubGVuZ3RoID4gMCkge1xuICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgIHN0YXRlOiBWaWV3U3RhdGUuUFJPQ0VTU0lOR19GSUxFLFxuICAgICAgICBwcm9ncmVzczogMTAsXG4gICAgICAgIHByb2dyZXNzTWVzc2FnZTogXCJSZWFkaW5nIGluIGZpbGUuLi5cIixcbiAgICAgICAgZXJyb3JNZXNzYWdlOiBudWxsXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGZpbGUgPSBmaWxlc1swXTtcbiAgICAgIGNvbnN0IHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICByZWFkZXIub25sb2FkID0gYXN5bmMgKGUpID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCBibGVha1Jlc3VsdHMgPSBCTGVha1Jlc3VsdHMuRnJvbUpTT04oSlNPTi5wYXJzZSgoZS50YXJnZXQgYXMgRmlsZVJlYWRlcikucmVzdWx0IGFzIHN0cmluZykpO1xuICAgICAgICAgIGNvbnN0IHNvdXJjZUZpbGVNYW5hZ2VyID0gYXdhaXQgU291cmNlRmlsZU1hbmFnZXIuRnJvbUJMZWFrUmVzdWx0cyhibGVha1Jlc3VsdHMsIChjb21wbGV0ZWQsIHRvdGFsKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwZXJjZW50ID0gMTAgKyAoY29tcGxldGVkIC8gdG90YWwpICogOTA7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgcHJvZ3Jlc3M6IHBlcmNlbnQsXG4gICAgICAgICAgICAgIHByb2dyZXNzTWVzc2FnZTogYCR7Y29tcGxldGVkfSBvZiAke3RvdGFsfSBzb3VyY2UgZmlsZXMgZm9ybWF0dGVkLi4uYFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgY29uc3Qgc291cmNlRmlsZXMgPSBzb3VyY2VGaWxlTWFuYWdlci5nZXRTb3VyY2VGaWxlcygpO1xuICAgICAgICAgIGNvbnN0IHN0YWNrVHJhY2VzID0gU3RhY2tUcmFjZU1hbmFnZXIuRnJvbUJMZWFrUmVzdWx0cyhzb3VyY2VGaWxlTWFuYWdlciwgYmxlYWtSZXN1bHRzKTtcbiAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIHN0YXRlOiBWaWV3U3RhdGUuRElTUExBWUlOR19GSUxFLFxuICAgICAgICAgICAgYmxlYWtSZXN1bHRzLFxuICAgICAgICAgICAgc291cmNlRmlsZU1hbmFnZXIsXG4gICAgICAgICAgICBzdGFja1RyYWNlcyxcbiAgICAgICAgICAgIHNlbGVjdGVkTG9jYXRpb246IG5ldyBMb2NhdGlvbihzb3VyY2VGaWxlc1swXSwgMSwgMSwgdHJ1ZSlcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgc3RhdGU6IFZpZXdTdGF0ZS5XQUlUX0ZPUl9GSUxFLFxuICAgICAgICAgICAgZXJyb3JNZXNzYWdlOiBgJHtlfWBcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIHJlYWRlci5yZWFkQXNUZXh0KGZpbGUpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgc3RhdGU6IFZpZXdTdGF0ZS5XQUlUX0ZPUl9GSUxFLFxuICAgICAgICBlcnJvck1lc3NhZ2U6IGBQbGVhc2Ugc2VsZWN0IGEgZmlsZS5gXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgY29tcG9uZW50V2lsbFVwZGF0ZShuZXh0UHJvcHM6IHt9LCBuZXh0U3RhdGU6IEFwcFN0YXRlKTogdm9pZCB7XG4gICAgaWYgKHRoaXMucmVmc1snZmlsZV9zZWxlY3QnXSkge1xuICAgICAgY29uc3QgZmlsZVNlbGVjdCA9IHRoaXMucmVmc1snZmlsZV9zZWxlY3QnXSBhcyBIVE1MSW5wdXRFbGVtZW50O1xuICAgICAgZmlsZVNlbGVjdC5zZXRDdXN0b21WYWxpZGl0eShuZXh0U3RhdGUuZXJyb3JNZXNzYWdlKTtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgcmVuZGVyKCkge1xuICAgIGNvbnN0IHJhbmtFdmFsQ29tcGxldGUgPSB0aGlzLnN0YXRlLnN0YXRlID09PSBWaWV3U3RhdGUuRElTUExBWUlOR19GSUxFICYmIGlzUmFua2luZ0V2YWx1YXRpb25Db21wbGV0ZSh0aGlzLnN0YXRlLmJsZWFrUmVzdWx0cyk7XG4gICAgcmV0dXJuIDxkaXY+XG4gICAgICA8bmF2IGNsYXNzTmFtZT1cIm5hdmJhciBuYXZiYXItZXhwYW5kLW1kIG5hdmJhci1kYXJrIGJnLWRhcmsgZml4ZWQtdG9wXCI+XG4gICAgICAgIDxhIGNsYXNzTmFtZT1cIm5hdmJhci1icmFuZFwiIGhyZWY9XCIvXCI+PGltZyBzcmM9XCJpY29uLnN2Z1wiIGNsYXNzTmFtZT1cImljb25cIiAvPiBCTGVhayBSZXN1bHRzIFZpZXdlcjwvYT5cbiAgICAgIDwvbmF2PlxuXG4gICAgICA8bWFpbiByb2xlPVwibWFpblwiIGNsYXNzTmFtZT1cImNvbnRhaW5lci1mbHVpZFwiPlxuICAgICAgICB7dGhpcy5zdGF0ZS5zdGF0ZSA9PT0gVmlld1N0YXRlLldBSVRfRk9SX0ZJTEUgfHwgdGhpcy5zdGF0ZS5zdGF0ZSA9PT0gVmlld1N0YXRlLlBST0NFU1NJTkdfRklMRSA/XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJqdW1ib3Ryb25cIiBrZXk9XCJibGVha1VwbG9hZFwiPlxuICAgICAgICAgICAgPGgxIGNsYXNzTmFtZT1cImRpc3BsYXktNFwiPlVwbG9hZCBSZXN1bHRzIEZpbGU8L2gxPlxuICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwibGVhZFwiPlVwbG9hZCBibGVha19yZXN1bHRzLmpzb24gZnJvbSBhIEJMZWFrIHJ1biB0byB2aWV3IHRoZSByZXN1bHRzLjwvcD5cbiAgICAgICAgICAgIDxociBjbGFzc05hbWU9XCJteS00XCIgLz5cbiAgICAgICAgICAgIDxmb3JtIGNsYXNzTmFtZT17XCJuZWVkcy12YWxpZGF0aW9uXCIgKyAodGhpcy5zdGF0ZS5lcnJvck1lc3NhZ2UgPyBcIiB3YXMtdmFsaWRhdGVkXCIgOiBcIlwiKX0+XG4gICAgICAgICAgICAgIHt0aGlzLnN0YXRlLnN0YXRlID09PSBWaWV3U3RhdGUuUFJPQ0VTU0lOR19GSUxFID9cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInByb2dyZXNzXCIga2V5PVwiYmxlYWtQcm9ncmVzc1wiPlxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwcm9ncmVzcy1iYXJcIiByb2xlPVwicHJvZ3Jlc3NiYXJcIiBzdHlsZT17e3dpZHRoOiBgJHt0aGlzLnN0YXRlLnByb2dyZXNzLnRvRml4ZWQoMCl9JWAgfX0gYXJpYS12YWx1ZW5vdz17dGhpcy5zdGF0ZS5wcm9ncmVzc30gYXJpYS12YWx1ZW1pbj17MH0gYXJpYS12YWx1ZW1heD17MTAwfT57dGhpcy5zdGF0ZS5wcm9ncmVzc01lc3NhZ2V9PC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+IDpcbiAgICAgICAgICAgICAgICA8ZGl2IGtleT1cImJsZWFrVXBsb2FkRm9ybVwiIGNsYXNzTmFtZT1cImZvcm0tZ3JvdXBcIj5cbiAgICAgICAgICAgICAgICAgIDxpbnB1dCByZWY9XCJmaWxlX3NlbGVjdFwiIHR5cGU9XCJmaWxlXCIgY2xhc3NOYW1lPXtcImZvcm0tY29udHJvbCBmb3JtLWNvbnRyb2wtZmlsZVwiICsgKHRoaXMuc3RhdGUuZXJyb3JNZXNzYWdlID8gXCIgaXMtaW52YWxpZFwiIDogXCJcIil9IGlkPVwiYmxlYWtSZXN1bHRzVXBsb2FkXCIgYWNjZXB0PVwiLmpzb25cIiAvPlxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJpbnZhbGlkLWZlZWRiYWNrXCI+e3RoaXMuc3RhdGUuZXJyb3JNZXNzYWdlfTwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2Pn1cbiAgICAgICAgICAgIDwvZm9ybT5cbiAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cImxlYWRcIj5cbiAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwic3VibWl0XCIgY2xhc3NOYW1lPVwiYnRuIGJ0bi1wcmltYXJ5XCIgZGlzYWJsZWQ9e3RoaXMuc3RhdGUuc3RhdGUgPT09IFZpZXdTdGF0ZS5QUk9DRVNTSU5HX0ZJTEV9IG9uQ2xpY2s9e3RoaXMuX29uRmlsZVNlbGVjdC5iaW5kKHRoaXMpfT5TdWJtaXQ8L2J1dHRvbj5cbiAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgOiAnJ31cbiAgICAgICAge3RoaXMuc3RhdGUuc3RhdGUgPT09IFZpZXdTdGF0ZS5ESVNQTEFZSU5HX0ZJTEUgPyA8ZGl2IGtleT1cImJsZWFrUmVzdWx0c1wiPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicm93XCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17cmFua0V2YWxDb21wbGV0ZSA/IFwiY29sLXNtLTdcIiA6IFwiY29sLXNtXCJ9PlxuICAgICAgICAgICAgICA8aDM+TGl2ZSBIZWFwIFNpemU8L2gzPlxuICAgICAgICAgICAgICA8SGVhcEdyb3d0aEdyYXBoIGtleT1cImhlYXBfZ3Jvd3RoXCIgYmxlYWtSZXN1bHRzPXt0aGlzLnN0YXRlLmJsZWFrUmVzdWx0c30gLz5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAge3JhbmtFdmFsQ29tcGxldGUgPyA8ZGl2IGtleT1cInJhbmtpbmdFdmFsVGFibGVcIiBjbGFzc05hbWU9XCJjb2wtc20tNVwiPlxuICAgICAgICAgICAgICA8aDM+R3Jvd3RoIFJlZHVjdGlvbiBmb3IgVG9wIExlYWtzIEZpeGVkPC9oMz5cbiAgICAgICAgICAgICAgPEdyb3d0aFJlZHVjdGlvbkdyYXBoIGJsZWFrUmVzdWx0cz17dGhpcy5zdGF0ZS5ibGVha1Jlc3VsdHN9IC8+XG4gICAgICAgICAgICAgIDxHcm93dGhSZWR1Y3Rpb25UYWJsZSBibGVha1Jlc3VsdHM9e3RoaXMuc3RhdGUuYmxlYWtSZXN1bHRzfSAvPlxuICAgICAgICAgICAgPC9kaXY+IDogJyd9XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyb3dcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29sLXNtLTVcIj5cbiAgICAgICAgICAgICAgPGgzPkxlYWsgUm9vdHMgYW5kIFN0YWNrIFRyYWNlczwvaDM+XG4gICAgICAgICAgICAgIDxMZWFrUm9vdHNBbmRTdGFja1RyYWNlcyBrZXk9XCJsZWFrX3Jvb3RfbGlzdFwiIG9uU3RhY2tGcmFtZVNlbGVjdD17KHNmKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgICBzZWxlY3RlZExvY2F0aW9uOiBzZlxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9fSBibGVha1Jlc3VsdHM9e3RoaXMuc3RhdGUuYmxlYWtSZXN1bHRzfSBzdGFja1RyYWNlcz17dGhpcy5zdGF0ZS5zdGFja1RyYWNlc30gc2VsZWN0ZWRMb2NhdGlvbj17dGhpcy5zdGF0ZS5zZWxlY3RlZExvY2F0aW9ufSAvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC1zbS03XCI+XG4gICAgICAgICAgICAgIDxoMz5Tb3VyY2UgQ29kZTwvaDM+XG4gICAgICAgICAgICAgIHt0aGlzLnN0YXRlLnNvdXJjZUZpbGVNYW5hZ2VyLmdldFNvdXJjZUZpbGVzKCkubGVuZ3RoID09PSAwID8gPHAga2V5PVwibm9fc291cmNlX2ZpbGVzXCI+Tm8gc291cmNlIGZpbGVzIGZvdW5kIGluIHJlc3VsdHMgZmlsZS48L3A+IDogIDxTb3VyY2VDb2RlVmlld2VyIGtleT1cInNvdXJjZV9jb2RlX3ZpZXdlclwiIGZpbGVzPXt0aGlzLnN0YXRlLnNvdXJjZUZpbGVNYW5hZ2VyfSBzdGFja1RyYWNlcz17dGhpcy5zdGF0ZS5zdGFja1RyYWNlc30gbG9jYXRpb249e3RoaXMuc3RhdGUuc2VsZWN0ZWRMb2NhdGlvbn0gLz4gfVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PiA6ICcnfVxuICAgICAgPC9tYWluPlxuICAgIDwvZGl2PjtcbiAgfVxufVxuIl19