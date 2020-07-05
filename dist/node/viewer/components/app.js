"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const bleak_results_1 = require("../../lib/bleak_results");
const heap_growth_graph_1 = require("./heap_growth_graph");
const leak_roots_and_stack_traces_1 = require("./leak_roots_and_stack_traces");
const source_code_view_1 = require("./source_code_view");
const source_file_manager_1 = require("../model/source_file_manager");
const location_1 = require("../model/location");
const stack_trace_manager_1 = require("../model/stack_trace_manager");
const growth_reduction_table_1 = require("./growth_reduction_table");
const growth_reduction_graph_1 = require("./growth_reduction_graph");
class App extends React.Component {
    constructor(p, c) {
        super(p, c);
        this.state = {
            state: 0 /* WAIT_FOR_FILE */,
            bleakResults: null,
            stackTraces: null,
            sourceFileManager: null,
            errorMessage: null,
            progress: -1,
            progressMessage: null,
            selectedLocation: null
        };
    }
    _onFileSelect() {
        const input = this.refs['file_select'];
        const files = input.files;
        if (files.length > 0) {
            this.setState({
                state: 1 /* PROCESSING_FILE */,
                progress: 10,
                progressMessage: "Reading in file...",
                errorMessage: null
            });
            const file = files[0];
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const bleakResults = bleak_results_1.default.FromJSON(JSON.parse(e.target.result));
                    const sourceFileManager = await source_file_manager_1.default.FromBLeakResults(bleakResults, (completed, total) => {
                        const percent = 10 + (completed / total) * 90;
                        this.setState({
                            progress: percent,
                            progressMessage: `${completed} of ${total} source files formatted...`
                        });
                    });
                    const sourceFiles = sourceFileManager.getSourceFiles();
                    const stackTraces = stack_trace_manager_1.default.FromBLeakResults(sourceFileManager, bleakResults);
                    this.setState({
                        state: 2 /* DISPLAYING_FILE */,
                        bleakResults,
                        sourceFileManager,
                        stackTraces,
                        selectedLocation: new location_1.default(sourceFiles[0], 1, 1, true)
                    });
                }
                catch (e) {
                    this.setState({
                        state: 0 /* WAIT_FOR_FILE */,
                        errorMessage: `${e}`
                    });
                }
            };
            reader.readAsText(file);
        }
        else {
            this.setState({
                state: 0 /* WAIT_FOR_FILE */,
                errorMessage: `Please select a file.`
            });
        }
    }
    componentWillUpdate(nextProps, nextState) {
        if (this.refs['file_select']) {
            const fileSelect = this.refs['file_select'];
            fileSelect.setCustomValidity(nextState.errorMessage);
        }
    }
    render() {
        const rankEvalComplete = this.state.state === 2 /* DISPLAYING_FILE */ && heap_growth_graph_1.isRankingEvaluationComplete(this.state.bleakResults);
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
                                React.createElement("div", { className: "progress-bar", role: "progressbar", style: { width: `${this.state.progress.toFixed(0)}%` }, "aria-valuenow": this.state.progress, "aria-valuemin": 0, "aria-valuemax": 100 }, this.state.progressMessage)) :
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
                            React.createElement(heap_growth_graph_1.default, { key: "heap_growth", bleakResults: this.state.bleakResults })),
                        rankEvalComplete ? React.createElement("div", { key: "rankingEvalTable", className: "col-sm-5" },
                            React.createElement("h3", null, "Growth Reduction for Top Leaks Fixed"),
                            React.createElement(growth_reduction_graph_1.default, { bleakResults: this.state.bleakResults }),
                            React.createElement(growth_reduction_table_1.default, { bleakResults: this.state.bleakResults })) : ''),
                    React.createElement("div", { className: "row" },
                        React.createElement("div", { className: "col-sm-5" },
                            React.createElement("h3", null, "Leak Roots and Stack Traces"),
                            React.createElement(leak_roots_and_stack_traces_1.default, { key: "leak_root_list", onStackFrameSelect: (sf) => {
                                    this.setState({
                                        selectedLocation: sf
                                    });
                                }, bleakResults: this.state.bleakResults, stackTraces: this.state.stackTraces, selectedLocation: this.state.selectedLocation })),
                        React.createElement("div", { className: "col-sm-7" },
                            React.createElement("h3", null, "Source Code"),
                            this.state.sourceFileManager.getSourceFiles().length === 0 ? React.createElement("p", { key: "no_source_files" }, "No source files found in results file.") : React.createElement(source_code_view_1.default, { key: "source_code_viewer", files: this.state.sourceFileManager, stackTraces: this.state.stackTraces, location: this.state.selectedLocation })))) : ''));
    }
}
exports.default = App;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL3ZpZXdlci9jb21wb25lbnRzL2FwcC50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSwrQkFBK0I7QUFDL0IsMkRBQW1EO0FBQ25ELDJEQUE0RjtBQUM1RiwrRUFBb0U7QUFDcEUseURBQWtEO0FBQ2xELHNFQUE2RDtBQUM3RCxnREFBeUM7QUFDekMsc0VBQTZEO0FBQzdELHFFQUE0RDtBQUM1RCxxRUFBNEQ7QUFtQjVELFNBQXlCLFNBQVEsS0FBSyxDQUFDLFNBQXVCO0lBQzVELFlBQVksQ0FBSyxFQUFFLENBQU87UUFDeEIsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNaLElBQUksQ0FBQyxLQUFLLEdBQUc7WUFDWCxLQUFLLHVCQUF5QjtZQUM5QixZQUFZLEVBQUUsSUFBSTtZQUNsQixXQUFXLEVBQUUsSUFBSTtZQUNqQixpQkFBaUIsRUFBRSxJQUFJO1lBQ3ZCLFlBQVksRUFBRSxJQUFJO1lBQ2xCLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFDWixlQUFlLEVBQUUsSUFBSTtZQUNyQixnQkFBZ0IsRUFBRSxJQUFJO1NBQ3ZCLENBQUM7SUFDSixDQUFDO0lBRU8sYUFBYTtRQUNuQixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBcUIsQ0FBQztRQUMzRCxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDO1FBQzFCLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNyQixJQUFJLENBQUMsUUFBUSxDQUFDO2dCQUNaLEtBQUsseUJBQTJCO2dCQUNoQyxRQUFRLEVBQUUsRUFBRTtnQkFDWixlQUFlLEVBQUUsb0JBQW9CO2dCQUNyQyxZQUFZLEVBQUUsSUFBSTthQUNuQixDQUFDLENBQUM7WUFDSCxNQUFNLElBQUksR0FBRyxLQUFLLENB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QUMsa0JBQWtCLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRTtvQ0FDdkUsSUFBSSxDQUFDLFFBQVEsQ0FBQzt3Q0FDWixnQkFBZ0IsRUFBRSxFQUFFO3FDQUNyQixDQUFDLENBQUM7Z0NBQ0wsQ0FBQyxFQUFFLFlBQVksRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksRUFBRSxXQUFXLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUUsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsR0FBSSxDQUM1SDt3QkFDTiw2QkFBSyxTQUFTLEVBQUMsVUFBVTs0QkFDdkIsOENBQW9COzRCQUNuQixJQUFJLENBQUMsS0FBSyxDQUFDLGlCQUFpQixDQUFDLGNBQWMsRUFBRSxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLDJCQUFHLEdBQUcsRUFBQyxpQkFBaUIsNkNBQTJDLENBQUMsQ0FBQyxDQUFFLG9CQUFDLDBCQUFnQixJQUFDLEdBQUcsRUFBQyxvQkFBb0IsRUFBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxXQUFXLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLEdBQUksQ0FDL1IsQ0FDRixDQUNGLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FDTixDQUNILENBQUM7SUFDVCxDQUFDO0NBQ0Y7QUEvSEQsc0JBK0hDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IEJMZWFrUmVzdWx0cyBmcm9tICcuLi8uLi9saWIvYmxlYWtfcmVzdWx0cyc7XG5pbXBvcnQge2RlZmF1bHQgYXMgSGVhcEdyb3d0aEdyYXBoLCBpc1JhbmtpbmdFdmFsdWF0aW9uQ29tcGxldGV9IGZyb20gJy4vaGVhcF9ncm93dGhfZ3JhcGgnO1xuaW1wb3J0IExlYWtSb290c0FuZFN0YWNrVHJhY2VzIGZyb20gJy4vbGVha19yb290c19hbmRfc3RhY2tfdHJhY2VzJztcbmltcG9ydCBTb3VyY2VDb2RlVmlld2VyIGZyb20gJy4vc291cmNlX2NvZGVfdmlldyc7XG5pbXBvcnQgU291cmNlRmlsZU1hbmFnZXIgZnJvbSAnLi4vbW9kZWwvc291cmNlX2ZpbGVfbWFuYWdlcic7XG5pbXBvcnQgTG9jYXRpb24gZnJvbSAnLi4vbW9kZWwvbG9jYXRpb24nO1xuaW1wb3J0IFN0YWNrVHJhY2VNYW5hZ2VyIGZyb20gJy4uL21vZGVsL3N0YWNrX3RyYWNlX21hbmFnZXInO1xuaW1wb3J0IEdyb3d0aFJlZHVjdGlvblRhYmxlIGZyb20gJy4vZ3Jvd3RoX3JlZHVjdGlvbl90YWJsZSc7XG5pbXBvcnQgR3Jvd3RoUmVkdWN0aW9uR3JhcGggZnJvbSAnLi9ncm93dGhfcmVkdWN0aW9uX2dyYXBoJztcblxuY29uc3QgZW51bSBWaWV3U3RhdGUge1xuICBXQUlUX0ZPUl9GSUxFLFxuICBQUk9DRVNTSU5HX0ZJTEUsXG4gIERJU1BMQVlJTkdfRklMRVxufVxuXG5pbnRlcmZhY2UgQXBwU3RhdGUge1xuICBzdGF0ZTogVmlld1N0YXRlO1xuICBibGVha1Jlc3VsdHM6IEJMZWFrUmVzdWx0cyB8IG51bGw7XG4gIHN0YWNrVHJhY2VzOiBTdGFja1RyYWNlTWFuYWdlciB8IG51bGw7XG4gIHNvdXJjZUZpbGVNYW5hZ2VyOiBTb3VyY2VGaWxlTWFuYWdlciB8IG51bGw7XG4gIGVycm9yTWVzc2FnZTogc3RyaW5nIHwgbnVsbDtcbiAgcHJvZ3Jlc3M6IG51bWJlcjtcbiAgcHJvZ3Jlc3NNZXNzYWdlOiBzdHJpbmcgfCBudWxsO1xuICBzZWxlY3RlZExvY2F0aW9uOiBMb2NhdGlvbiB8IG51bGw7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEFwcCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudDx7fSwgQXBwU3RhdGU+IHtcbiAgY29uc3RydWN0b3IocDoge30sIGM/OiBhbnkpIHtcbiAgICBzdXBlcihwLCBjKTtcbiAgICB0aGlzLnN0YXRlID0ge1xuICAgICAgc3RhdGU6IFZpZXdTdGF0ZS5XQUlUX0ZPUl9GSUxFLFxuICAgICAgYmxlYWtSZXN1bHRzOiBudWxsLFxuICAgICAgc3RhY2tUcmFjZXM6IG51bGwsXG4gICAgICBzb3VyY2VGaWxlTWFuYWdlcjogbnVsbCxcbiAgICAgIGVycm9yTWVzc2FnZTogbnVsbCxcbiAgICAgIHByb2dyZXNzOiAtMSxcbiAgICAgIHByb2dyZXNzTWVzc2FnZTogbnVsbCxcbiAgICAgIHNlbGVjdGVkTG9jYXRpb246IG51bGxcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBfb25GaWxlU2VsZWN0KCkge1xuICAgIGNvbnN0IGlucHV0ID0gdGhpcy5yZWZzWydmaWxlX3NlbGVjdCddIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gICAgY29uc3QgZmlsZXMgPSBpbnB1dC5maWxlcztcbiAgICBpZiAoZmlsZXMubGVuZ3RoID4gMCkge1xuICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgIHN0YXRlOiBWaWV3U3RhdGUuUFJPQ0VTU0lOR19GSUxFLFxuICAgICAgICBwcm9ncmVzczogMTAsXG4gICAgICAgIHByb2dyZXNzTWVzc2FnZTogXCJSZWFkaW5nIGluIGZpbGUuLi5cIixcbiAgICAgICAgZXJyb3JNZXNzYWdlOiBudWxsXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGZpbGUgPSBmaWxlc1swXTtcbiAgICAgIGNvbnN0IHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICByZWFkZXIub25sb2FkID0gYXN5bmMgKGUpID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCBibGVha1Jlc3VsdHMgPSBCTGVha1Jlc3VsdHMuRnJvbUpTT04oSlNPTi5wYXJzZSgoZS50YXJnZXQgYXMgRmlsZVJlYWRlcikucmVzdWx0IGFzIHN0cmluZykpO1xuICAgICAgICAgIGNvbnN0IHNvdXJjZUZpbGVNYW5hZ2VyID0gYXdhaXQgU291cmNlRmlsZU1hbmFnZXIuRnJvbUJMZWFrUmVzdWx0cyhibGVha1Jlc3VsdHMsIChjb21wbGV0ZWQsIHRvdGFsKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwZXJjZW50ID0gMTAgKyAoY29tcGxldGVkIC8gdG90YWwpICogOTA7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgcHJvZ3Jlc3M6IHBlcmNlbnQsXG4gICAgICAgICAgICAgIHByb2dyZXNzTWVzc2FnZTogYCR7Y29tcGxldGVkfSBvZiAke3RvdGFsfSBzb3VyY2UgZmlsZXMgZm9ybWF0dGVkLi4uYFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgY29uc3Qgc291cmNlRmlsZXMgPSBzb3VyY2VGaWxlTWFuYWdlci5nZXRTb3VyY2VGaWxlcygpO1xuICAgICAgICAgIGNvbnN0IHN0YWNrVHJhY2VzID0gU3RhY2tUcmFjZU1hbmFnZXIuRnJvbUJMZWFrUmVzdWx0cyhzb3VyY2VGaWxlTWFuYWdlciwgYmxlYWtSZXN1bHRzKTtcbiAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIHN0YXRlOiBWaWV3U3RhdGUuRElTUExBWUlOR19GSUxFLFxuICAgICAgICAgICAgYmxlYWtSZXN1bHRzLFxuICAgICAgICAgICAgc291cmNlRmlsZU1hbmFnZXIsXG4gICAgICAgICAgICBzdGFja1RyYWNlcyxcbiAgICAgICAgICAgIHNlbGVjdGVkTG9jYXRpb246IG5ldyBMb2NhdGlvbihzb3VyY2VGaWxlc1swXSwgMSwgMSwgdHJ1ZSlcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgc3RhdGU6IFZpZXdTdGF0ZS5XQUlUX0ZPUl9GSUxFLFxuICAgICAgICAgICAgZXJyb3JNZXNzYWdlOiBgJHtlfWBcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIHJlYWRlci5yZWFkQXNUZXh0KGZpbGUpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgc3RhdGU6IFZpZXdTdGF0ZS5XQUlUX0ZPUl9GSUxFLFxuICAgICAgICBlcnJvck1lc3NhZ2U6IGBQbGVhc2Ugc2VsZWN0IGEgZmlsZS5gXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgY29tcG9uZW50V2lsbFVwZGF0ZShuZXh0UHJvcHM6IHt9LCBuZXh0U3RhdGU6IEFwcFN0YXRlKTogdm9pZCB7XG4gICAgaWYgKHRoaXMucmVmc1snZmlsZV9zZWxlY3QnXSkge1xuICAgICAgY29uc3QgZmlsZVNlbGVjdCA9IHRoaXMucmVmc1snZmlsZV9zZWxlY3QnXSBhcyBIVE1MSW5wdXRFbGVtZW50O1xuICAgICAgZmlsZVNlbGVjdC5zZXRDdXN0b21WYWxpZGl0eShuZXh0U3RhdGUuZXJyb3JNZXNzYWdlKTtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgcmVuZGVyKCkge1xuICAgIGNvbnN0IHJhbmtFdmFsQ29tcGxldGUgPSB0aGlzLnN0YXRlLnN0YXRlID09PSBWaWV3U3RhdGUuRElTUExBWUlOR19GSUxFICYmIGlzUmFua2luZ0V2YWx1YXRpb25Db21wbGV0ZSh0aGlzLnN0YXRlLmJsZWFrUmVzdWx0cyk7XG4gICAgcmV0dXJuIDxkaXY+XG4gICAgICA8bmF2IGNsYXNzTmFtZT1cIm5hdmJhciBuYXZiYXItZXhwYW5kLW1kIG5hdmJhci1kYXJrIGJnLWRhcmsgZml4ZWQtdG9wXCI+XG4gICAgICAgIDxhIGNsYXNzTmFtZT1cIm5hdmJhci1icmFuZFwiIGhyZWY9XCIvXCI+PGltZyBzcmM9XCJpY29uLnN2Z1wiIGNsYXNzTmFtZT1cImljb25cIiAvPiBCTGVhayBSZXN1bHRzIFZpZXdlcjwvYT5cbiAgICAgIDwvbmF2PlxuXG4gICAgICA8bWFpbiByb2xlPVwibWFpblwiIGNsYXNzTmFtZT1cImNvbnRhaW5lci1mbHVpZFwiPlxuICAgICAgICB7dGhpcy5zdGF0ZS5zdGF0ZSA9PT0gVmlld1N0YXRlLldBSVRfRk9SX0ZJTEUgfHwgdGhpcy5zdGF0ZS5zdGF0ZSA9PT0gVmlld1N0YXRlLlBST0NFU1NJTkdfRklMRSA/XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJqdW1ib3Ryb25cIiBrZXk9XCJibGVha1VwbG9hZFwiPlxuICAgICAgICAgICAgPGgxIGNsYXNzTmFtZT1cImRpc3BsYXktNFwiPlVwbG9hZCBSZXN1bHRzIEZpbGU8L2gxPlxuICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwibGVhZFwiPlVwbG9hZCBibGVha19yZXN1bHRzLmpzb24gZnJvbSBhIEJMZWFrIHJ1biB0byB2aWV3IHRoZSByZXN1bHRzLjwvcD5cbiAgICAgICAgICAgIDxociBjbGFzc05hbWU9XCJteS00XCIgLz5cbiAgICAgICAgICAgIDxmb3JtIGNsYXNzTmFtZT17XCJuZWVkcy12YWxpZGF0aW9uXCIgKyAodGhpcy5zdGF0ZS5lcnJvck1lc3NhZ2UgPyBcIiB3YXMtdmFsaWRhdGVkXCIgOiBcIlwiKX0+XG4gICAgICAgICAgICAgIHt0aGlzLnN0YXRlLnN0YXRlID09PSBWaWV3U3RhdGUuUFJPQ0VTU0lOR19GSUxFID9cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInByb2dyZXNzXCIga2V5PVwiYmxlYWtQcm9ncmVzc1wiPlxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwcm9ncmVzcy1iYXJcIiByb2xlPVwicHJvZ3Jlc3NiYXJcIiBzdHlsZT17e3dpZHRoOiBgJHt0aGlzLnN0YXRlLnByb2dyZXNzLnRvRml4ZWQoMCl9JWAgfX0gYXJpYS12YWx1ZW5vdz17dGhpcy5zdGF0ZS5wcm9ncmVzc30gYXJpYS12YWx1ZW1pbj17MH0gYXJpYS12YWx1ZW1heD17MTAwfT57dGhpcy5zdGF0ZS5wcm9ncmVzc01lc3NhZ2V9PC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+IDpcbiAgICAgICAgICAgICAgICA8ZGl2IGtleT1cImJsZWFrVXBsb2FkRm9ybVwiIGNsYXNzTmFtZT1cImZvcm0tZ3JvdXBcIj5cbiAgICAgICAgICAgICAgICAgIDxpbnB1dCByZWY9XCJmaWxlX3NlbGVjdFwiIHR5cGU9XCJmaWxlXCIgY2xhc3NOYW1lPXtcImZvcm0tY29udHJvbCBmb3JtLWNvbnRyb2wtZmlsZVwiICsgKHRoaXMuc3RhdGUuZXJyb3JNZXNzYWdlID8gXCIgaXMtaW52YWxpZFwiIDogXCJcIil9IGlkPVwiYmxlYWtSZXN1bHRzVXBsb2FkXCIgYWNjZXB0PVwiLmpzb25cIiAvPlxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJpbnZhbGlkLWZlZWRiYWNrXCI+e3RoaXMuc3RhdGUuZXJyb3JNZXNzYWdlfTwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2Pn1cbiAgICAgICAgICAgIDwvZm9ybT5cbiAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cImxlYWRcIj5cbiAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwic3VibWl0XCIgY2xhc3NOYW1lPVwiYnRuIGJ0bi1wcmltYXJ5XCIgZGlzYWJsZWQ9e3RoaXMuc3RhdGUuc3RhdGUgPT09IFZpZXdTdGF0ZS5QUk9DRVNTSU5HX0ZJTEV9IG9uQ2xpY2s9e3RoaXMuX29uRmlsZVNlbGVjdC5iaW5kKHRoaXMpfT5TdWJtaXQ8L2J1dHRvbj5cbiAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgOiAnJ31cbiAgICAgICAge3RoaXMuc3RhdGUuc3RhdGUgPT09IFZpZXdTdGF0ZS5ESVNQTEFZSU5HX0ZJTEUgPyA8ZGl2IGtleT1cImJsZWFrUmVzdWx0c1wiPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicm93XCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17cmFua0V2YWxDb21wbGV0ZSA/IFwiY29sLXNtLTdcIiA6IFwiY29sLXNtXCJ9PlxuICAgICAgICAgICAgICA8aDM+TGl2ZSBIZWFwIFNpemU8L2gzPlxuICAgICAgICAgICAgICA8SGVhcEdyb3d0aEdyYXBoIGtleT1cImhlYXBfZ3Jvd3RoXCIgYmxlYWtSZXN1bHRzPXt0aGlzLnN0YXRlLmJsZWFrUmVzdWx0c30gLz5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAge3JhbmtFdmFsQ29tcGxldGUgPyA8ZGl2IGtleT1cInJhbmtpbmdFdmFsVGFibGVcIiBjbGFzc05hbWU9XCJjb2wtc20tNVwiPlxuICAgICAgICAgICAgICA8aDM+R3Jvd3RoIFJlZHVjdGlvbiBmb3IgVG9wIExlYWtzIEZpeGVkPC9oMz5cbiAgICAgICAgICAgICAgPEdyb3d0aFJlZHVjdGlvbkdyYXBoIGJsZWFrUmVzdWx0cz17dGhpcy5zdGF0ZS5ibGVha1Jlc3VsdHN9IC8+XG4gICAgICAgICAgICAgIDxHcm93dGhSZWR1Y3Rpb25UYWJsZSBibGVha1Jlc3VsdHM9e3RoaXMuc3RhdGUuYmxlYWtSZXN1bHRzfSAvPlxuICAgICAgICAgICAgPC9kaXY+IDogJyd9XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyb3dcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29sLXNtLTVcIj5cbiAgICAgICAgICAgICAgPGgzPkxlYWsgUm9vdHMgYW5kIFN0YWNrIFRyYWNlczwvaDM+XG4gICAgICAgICAgICAgIDxMZWFrUm9vdHNBbmRTdGFja1RyYWNlcyBrZXk9XCJsZWFrX3Jvb3RfbGlzdFwiIG9uU3RhY2tGcmFtZVNlbGVjdD17KHNmKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgICBzZWxlY3RlZExvY2F0aW9uOiBzZlxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9fSBibGVha1Jlc3VsdHM9e3RoaXMuc3RhdGUuYmxlYWtSZXN1bHRzfSBzdGFja1RyYWNlcz17dGhpcy5zdGF0ZS5zdGFja1RyYWNlc30gc2VsZWN0ZWRMb2NhdGlvbj17dGhpcy5zdGF0ZS5zZWxlY3RlZExvY2F0aW9ufSAvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC1zbS03XCI+XG4gICAgICAgICAgICAgIDxoMz5Tb3VyY2UgQ29kZTwvaDM+XG4gICAgICAgICAgICAgIHt0aGlzLnN0YXRlLnNvdXJjZUZpbGVNYW5hZ2VyLmdldFNvdXJjZUZpbGVzKCkubGVuZ3RoID09PSAwID8gPHAga2V5PVwibm9fc291cmNlX2ZpbGVzXCI+Tm8gc291cmNlIGZpbGVzIGZvdW5kIGluIHJlc3VsdHMgZmlsZS48L3A+IDogIDxTb3VyY2VDb2RlVmlld2VyIGtleT1cInNvdXJjZV9jb2RlX3ZpZXdlclwiIGZpbGVzPXt0aGlzLnN0YXRlLnNvdXJjZUZpbGVNYW5hZ2VyfSBzdGFja1RyYWNlcz17dGhpcy5zdGF0ZS5zdGFja1RyYWNlc30gbG9jYXRpb249e3RoaXMuc3RhdGUuc2VsZWN0ZWRMb2NhdGlvbn0gLz4gfVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PiA6ICcnfVxuICAgICAgPC9tYWluPlxuICAgIDwvZGl2PjtcbiAgfVxufVxuIl19