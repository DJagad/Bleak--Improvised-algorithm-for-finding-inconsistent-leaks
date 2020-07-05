import * as tslib_1 from "tslib";
import * as React from 'react';
import FileList from './file_list/file_list';
import { default as AceEditor } from 'react-ace';
import pathToString from '../../lib/path_to_string';
import Location from '../model/location';
import { acequire } from 'brace';
import 'brace/mode/javascript';
import 'brace/theme/github';
import 'brace/ext/searchbox';
var Range = acequire('ace/range').Range;
var EditorFileState = /** @class */ (function () {
    function EditorFileState(location, prettyPrinted) {
        this.location = location;
        this.prettyPrinted = prettyPrinted;
    }
    return EditorFileState;
}());
var CharStream = /** @class */ (function () {
    function CharStream() {
        this._source = null;
        this._lineText = null;
        this._startLocation = null;
        this._line = -1;
        this._column = -1;
    }
    CharStream.prototype.init = function (source, location) {
        this._source = source;
        this._startLocation = location;
        this._line = location.lineZeroIndexed;
        this._column = location.columnZeroIndexed;
        this._lineText = source.getLine(this._line);
    };
    CharStream.prototype.EOF = function () {
        return this._line >= this._source.getLength();
    };
    CharStream.prototype.nextChar = function () {
        this._column++;
        if (this._column >= this._lineText.length) {
            this._line++;
            this._column = 0;
            this._lineText = this._source.getLine(this._line);
        }
        return this._lineText[this._column];
    };
    CharStream.prototype.toRange = function () {
        return new Range(this._startLocation.lineZeroIndexed, this._startLocation.column, this._line, this._column + 1);
    };
    return CharStream;
}());
var CHAR_STREAM = new CharStream();
var SourceCodeView = /** @class */ (function (_super) {
    tslib_1.__extends(SourceCodeView, _super);
    function SourceCodeView(props, context) {
        var _this = _super.call(this, props, context) || this;
        _this.state = {
            openFile: _this.props.location.file,
            editorState: new Map(),
            highlightedFrames: _this.props.stackTraces.getFramesForFile(_this.props.location.file)
        };
        // Initialize editorState for all files.
        _this.props.files.getSourceFiles().forEach(function (f) {
            var efs = new EditorFileState(new Location(f, 1, 1, true), false);
            _this.state.editorState.set(f, efs);
            if (f === _this.state.openFile) {
                efs.location = _this.props.location;
            }
        });
        return _this;
    }
    SourceCodeView.prototype.componentDidMount = function () {
        this._updateAceEditor();
        // TODO: On click annotation / marker, select frames in left pane.
        /*const editor: AceAjax.Editor = (this.refs.aceEditor as any).editor;
        editor.on('click', (e) => {
          const pos = e.getDocumentPosition();
          const row = pos.row;
          const col = pos.column;
        });*/
        // guttermousedown
        var editor = this.refs.aceEditor.editor;
        editor.$blockScrolling = Infinity;
        //
    };
    SourceCodeView.prototype.componentDidUpdate = function () {
        this._updateAceEditor();
    };
    SourceCodeView.prototype._updateAceEditor = function () {
        var _this = this;
        var editor = this.refs.aceEditor.editor;
        // Scroll into view
        var editorState = this.state.editorState.get(this.state.openFile);
        var prettyPrint = editorState.prettyPrinted;
        var editorStateLocation = prettyPrint ? editorState.location.getFormattedLocation() : editorState.location.getOriginalLocation();
        // Scroll into center of view. (Column is 1-indexed here, row is 0-indexed)
        editor.renderer.scrollCursorIntoView(editorStateLocation.toAceEditorLocation(), 0.5);
        var session = editor.getSession();
        var frames = this.state.highlightedFrames;
        // Display annotations for file.
        var annotations = frames.map(function (f) {
            var ogLocation = f.getOriginalLocation();
            var location = prettyPrint ? f.getFormattedLocation() : f.getOriginalLocation();
            var leaks = _this.props.stackTraces.getLeaksForLocation(ogLocation);
            return Object.assign({
                type: 'error',
                text: "Contributes to memory leaks:\n" + leaks.map(function (l) { return pathToString(l.paths[0]); }).join(",\n")
            }, location.toAceEditorLocation());
        });
        session.setAnnotations(annotations);
        // Remove old markers.
        var markers = session.getMarkers(false);
        for (var prop in markers) {
            if (markers.hasOwnProperty(prop)) {
                session.removeMarker(markers[prop].id);
            }
        }
        var doc = session.getDocument();
        // Display markers.
        frames.forEach(function (f) {
            var location = prettyPrint ? f.getFormattedLocation() : f.getOriginalLocation();
            var displayed = f.equal(editorState.location);
            var parensDeep = 0;
            var inString = false;
            var stringChar = null;
            var nextEscaped = false;
            var onlyWhitespace = true;
            CHAR_STREAM.init(doc, location);
            // Hacky heuristic to figure out what to highlight.
            outerLoop: while (!CHAR_STREAM.EOF()) {
                var c = CHAR_STREAM.nextChar();
                if (inString) {
                    if (nextEscaped) {
                        nextEscaped = false;
                        continue;
                    }
                    switch (c) {
                        case '\\':
                            nextEscaped = true;
                        default:
                            inString = c === stringChar;
                            break;
                    }
                }
                else if (parensDeep > 0) {
                    switch (c) {
                        case '(':
                            parensDeep++;
                            break;
                        case ')':
                            parensDeep--;
                            break;
                    }
                    if (parensDeep === 0) {
                        // Break outer loop.
                        // We reached the end of a function call.
                        break outerLoop;
                    }
                }
                else {
                    switch (c) {
                        case '"':
                        case "'":
                            onlyWhitespace = false;
                            inString = true;
                            stringChar = c;
                            break;
                        case '(':
                            onlyWhitespace = false;
                            parensDeep = 1;
                            break;
                        case ';':
                        case ',':
                        case ':':
                            onlyWhitespace = false;
                        // FALL-THRU!
                        case '\r':
                        case '\n':
                            // End of statement.
                            if (!onlyWhitespace) {
                                break outerLoop;
                            }
                            break;
                    }
                }
            }
            session.addMarker(CHAR_STREAM.toRange(), displayed ? 'leak_line_selected' : 'leak_line', 'someType', false);
        });
    };
    SourceCodeView.prototype.componentWillReceiveProps = function (props) {
        var loc = props.location;
        this._changeOpenFile(true, loc);
    };
    SourceCodeView.prototype._changeOpenFile = function (fromProps, location) {
        if (!fromProps && location.file === this.state.openFile) {
            return;
        }
        var editor = this.refs.aceEditor.editor;
        var lastRow = editor.getLastVisibleRow();
        var firstRow = editor.getFirstVisibleRow();
        var middle = Math.floor((lastRow - firstRow) / 2) + firstRow + 1;
        var oldFileState = this.state.editorState.get(this.state.openFile);
        oldFileState.location = new Location(this.state.openFile, middle, 1, !oldFileState.prettyPrinted);
        var newFileState = this.state.editorState.get(location.file);
        newFileState.location = location;
        var frames = this.props.stackTraces.getFramesForFile(location.file);
        this.setState({ openFile: location.file, highlightedFrames: frames });
    };
    SourceCodeView.prototype._prettyPrintToggle = function () {
        var fileState = this.state.editorState.get(this.state.openFile);
        fileState.prettyPrinted = !fileState.prettyPrinted;
        this.setState({ editorState: this.state.editorState });
    };
    SourceCodeView.prototype.render = function () {
        var _this = this;
        var sourceFile = this.state.openFile;
        var openFileState = this.state.editorState.get(sourceFile);
        return React.createElement("div", { className: "row" },
            React.createElement("div", { className: "col-lg-3" },
                React.createElement(FileList, { files: this.props.files, editorFile: this.state.openFile, onFileSelected: function (f) {
                        _this._changeOpenFile(false, _this.state.editorState.get(f).location);
                    } })),
            React.createElement("div", { className: "col-lg-9" },
                React.createElement("div", { className: "row" },
                    React.createElement("div", { className: "col-lg-9" },
                        React.createElement("p", null,
                            React.createElement("b", null,
                                this.state.openFile.url,
                                " ",
                                openFileState.prettyPrinted ? '(Pretty Printed)' : ''))),
                    React.createElement("div", { className: "col-lg-3" },
                        React.createElement("button", { type: "button", className: "btn btn-secondary", onClick: this._prettyPrintToggle.bind(this) }, openFileState.prettyPrinted ? 'View Original' : 'Pretty Print'))),
                React.createElement(AceEditor, { ref: "aceEditor", readOnly: true, mode: "javascript", theme: "github", width: "100%", highlightActiveLine: false, setOptions: { highlightGutterLine: false, useWorker: false }, value: openFileState.prettyPrinted ? sourceFile.formattedSource : sourceFile.source })));
    };
    return SourceCodeView;
}(React.Component));
export default SourceCodeView;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic291cmNlX2NvZGVfdmlldy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy92aWV3ZXIvY29tcG9uZW50cy9zb3VyY2VfY29kZV92aWV3LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxLQUFLLEtBQUssTUFBTSxPQUFPLENBQUM7QUFDL0IsT0FBTyxRQUFRLE1BQU0sdUJBQXVCLENBQUM7QUFFN0MsT0FBTyxFQUFDLE9BQU8sSUFBSSxTQUFTLEVBQThCLE1BQU0sV0FBVyxDQUFDO0FBSTVFLE9BQU8sWUFBWSxNQUFNLDBCQUEwQixDQUFDO0FBQ3BELE9BQU8sUUFBUSxNQUFNLG1CQUFtQixDQUFDO0FBQ3pDLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxPQUFPLENBQUM7QUFDL0IsT0FBTyx1QkFBdUIsQ0FBQztBQUMvQixPQUFPLG9CQUFvQixDQUFDO0FBQzVCLE9BQU8scUJBQXFCLENBQUM7QUFDN0IsSUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDLEtBQUssQ0FBQztBQWdCMUM7SUFDRSx5QkFBbUIsUUFBa0IsRUFBUyxhQUFzQjtRQUFqRCxhQUFRLEdBQVIsUUFBUSxDQUFVO1FBQVMsa0JBQWEsR0FBYixhQUFhLENBQVM7SUFBRyxDQUFDO0lBQzFFLHNCQUFDO0FBQUQsQ0FBQyxBQUZELElBRUM7QUFFRDtJQUFBO1FBQ1UsWUFBTyxHQUFxQixJQUFJLENBQUM7UUFDakMsY0FBUyxHQUFXLElBQUksQ0FBQztRQUN6QixtQkFBYyxHQUFhLElBQUksQ0FBQztRQUNoQyxVQUFLLEdBQVcsQ0FBQyxDQUFDLENBQUM7UUFDbkIsWUFBTyxHQUFXLENBQUMsQ0FBQyxDQUFDO0lBMkIvQixDQUFDO0lBekJRLHlCQUFJLEdBQVgsVUFBWSxNQUF3QixFQUFFLFFBQWtCO1FBQ3RELElBQUksQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDO1FBQ3RCLElBQUksQ0FBQyxjQUFjLEdBQUcs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VTt3QkFDdkI7NEJBQUc7Z0NBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsR0FBRzs7Z0NBQUcsYUFBYSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBSyxDQUFJLENBQzNGO29CQUNOLDZCQUFLLFNBQVMsRUFBQyxVQUFVO3dCQUN2QixnQ0FBUSxJQUFJLEVBQUMsUUFBUSxFQUFDLFNBQVMsRUFBQyxtQkFBbUIsRUFBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBRyxhQUFhLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBVyxDQUN2SyxDQUNGO2dCQUNOLG9CQUFDLFNBQVMsSUFDUixHQUFHLEVBQUMsV0FBVyxFQUNmLFFBQVEsRUFBRSxJQUFJLEVBQ2QsSUFBSSxFQUFDLFlBQVksRUFDakIsS0FBSyxFQUFDLFFBQVEsRUFDZCxLQUFLLEVBQUMsTUFBTSxFQUNaLG1CQUFtQixFQUFFLEtBQUssRUFDMUIsVUFBVSxFQUFHLEVBQUUsbUJBQW1CLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsRUFDN0QsS0FBSyxFQUFFLGFBQWEsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEdBQUksQ0FDckYsQ0FDRixDQUFDO0lBQ1QsQ0FBQztJQUNILHFCQUFDO0FBQUQsQ0FBQyxBQTFNRCxDQUE0QyxLQUFLLENBQUMsU0FBUyxHQTBNMUQiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgRmlsZUxpc3QgZnJvbSAnLi9maWxlX2xpc3QvZmlsZV9saXN0JztcbmltcG9ydCBTb3VyY2VGaWxlTWFuYWdlciBmcm9tICcuLi9tb2RlbC9zb3VyY2VfZmlsZV9tYW5hZ2VyJztcbmltcG9ydCB7ZGVmYXVsdCBhcyBBY2VFZGl0b3IsIEFubm90YXRpb24gYXMgQWNlQW5ub3RhdGlvbn0gZnJvbSAncmVhY3QtYWNlJztcbmltcG9ydCBTdGFja1RyYWNlTWFuYWdlciBmcm9tICcuLi9tb2RlbC9zdGFja190cmFjZV9tYW5hZ2VyJztcbmltcG9ydCBTb3VyY2VGaWxlIGZyb20gJy4uL21vZGVsL3NvdXJjZV9maWxlJztcbmltcG9ydCBTdGFja0ZyYW1lIGZyb20gJy4uL21vZGVsL3N0YWNrX2ZyYW1lJztcbmltcG9ydCBwYXRoVG9TdHJpbmcgZnJvbSAnLi4vLi4vbGliL3BhdGhfdG9fc3RyaW5nJztcbmltcG9ydCBMb2NhdGlvbiBmcm9tICcuLi9tb2RlbC9sb2NhdGlvbic7XG5pbXBvcnQge2FjZXF1aXJlfSBmcm9tICdicmFjZSc7XG5pbXBvcnQgJ2JyYWNlL21vZGUvamF2YXNjcmlwdCc7XG5pbXBvcnQgJ2JyYWNlL3RoZW1lL2dpdGh1Yic7XG5pbXBvcnQgJ2JyYWNlL2V4dC9zZWFyY2hib3gnO1xuY29uc3QgUmFuZ2UgPSBhY2VxdWlyZSgnYWNlL3JhbmdlJykuUmFuZ2U7XG5cbmludGVyZmFjZSBTb3VyY2VDb2RlVmlld1Byb3BzIHtcbiAgZmlsZXM6IFNvdXJjZUZpbGVNYW5hZ2VyO1xuICBsb2NhdGlvbjogTG9jYXRpb247XG4gIHN0YWNrVHJhY2VzOiBTdGFja1RyYWNlTWFuYWdlcjtcbn1cblxuaW50ZXJmYWNlIFNvdXJjZUNvZGVWaWV3U3RhdGUge1xuICAvLyBUaGUgY3VycmVudGx5IG9wZW4gZmlsZSBpbiB0aGUgZWRpdG9yLlxuICBvcGVuRmlsZTogU291cmNlRmlsZTtcbiAgZWRpdG9yU3RhdGU6IE1hcDxTb3VyY2VGaWxlLCBFZGl0b3JGaWxlU3RhdGU+O1xuICAvLyBBY3RpdmUgYW5ub3RhdGlvbnNcbiAgaGlnaGxpZ2h0ZWRGcmFtZXM6IFN0YWNrRnJhbWVbXTtcbn1cblxuY2xhc3MgRWRpdG9yRmlsZVN0YXRlIHtcbiAgY29uc3RydWN0b3IocHVibGljIGxvY2F0aW9uOiBMb2NhdGlvbiwgcHVibGljIHByZXR0eVByaW50ZWQ6IGJvb2xlYW4pIHt9XG59XG5cbmNsYXNzIENoYXJTdHJlYW0ge1xuICBwcml2YXRlIF9zb3VyY2U6IEFjZUFqYXguRG9jdW1lbnQgPSBudWxsO1xuICBwcml2YXRlIF9saW5lVGV4dDogc3RyaW5nID0gbnVsbDtcbiAgcHJpdmF0ZSBfc3RhcnRMb2NhdGlvbjogTG9jYXRpb24gPSBudWxsO1xuICBwcml2YXRlIF9saW5lOiBudW1iZXIgPSAtMTtcbiAgcHJpdmF0ZSBfY29sdW1uOiBudW1iZXIgPSAtMTtcblxuICBwdWJsaWMgaW5pdChzb3VyY2U6IEFjZUFqYXguRG9jdW1lbnQsIGxvY2F0aW9uOiBMb2NhdGlvbik6IHZvaWQge1xuICAgIHRoaXMuX3NvdXJjZSA9IHNvdXJjZTtcbiAgICB0aGlzLl9zdGFydExvY2F0aW9uID0gbG9jYXRpb247XG4gICAgdGhpcy5fbGluZSA9IGxvY2F0aW9uLmxpbmVaZXJvSW5kZXhlZDtcbiAgICB0aGlzLl9jb2x1bW4gPSBsb2NhdGlvbi5jb2x1bW5aZXJvSW5kZXhlZDtcbiAgICB0aGlzLl9saW5lVGV4dCA9IHNvdXJjZS5nZXRMaW5lKHRoaXMuX2xpbmUpO1xuICB9XG5cbiAgcHVibGljIEVPRigpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fbGluZSA+PSB0aGlzLl9zb3VyY2UuZ2V0TGVuZ3RoKCk7XG4gIH1cblxuICBwdWJsaWMgbmV4dENoYXIoKTogc3RyaW5nIHtcbiAgICB0aGlzLl9jb2x1bW4rKztcbiAgICBpZiAodGhpcy5fY29sdW1uID49IHRoaXMuX2xpbmVUZXh0Lmxlbmd0aCkge1xuICAgICAgdGhpcy5fbGluZSsrO1xuICAgICAgdGhpcy5fY29sdW1uID0gMDtcbiAgICAgIHRoaXMuX2xpbmVUZXh0ID0gdGhpcy5fc291cmNlLmdldExpbmUodGhpcy5fbGluZSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9saW5lVGV4dFt0aGlzLl9jb2x1bW5dO1xuICB9XG5cbiAgcHVibGljIHRvUmFuZ2UoKTogQWNlQWpheC5SYW5nZSB7XG4gICAgcmV0dXJuIG5ldyBSYW5nZSh0aGlzLl9zdGFydExvY2F0aW9uLmxpbmVaZXJvSW5kZXhlZCwgdGhpcy5fc3RhcnRMb2NhdGlvbi5jb2x1bW4sIHRoaXMuX2xpbmUsIHRoaXMuX2NvbHVtbiArIDEpO1xuICB9XG59XG5cbmNvbnN0IENIQVJfU1RSRUFNID0gbmV3IENoYXJTdHJlYW0oKTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU291cmNlQ29kZVZpZXcgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQ8U291cmNlQ29kZVZpZXdQcm9wcywgU291cmNlQ29kZVZpZXdTdGF0ZT4ge1xuICBjb25zdHJ1Y3Rvcihwcm9wczogU291cmNlQ29kZVZpZXdQcm9wcywgY29udGV4dD86IGFueSkge1xuICAgIHN1cGVyKHByb3BzLCBjb250ZXh0KTtcbiAgICB0aGlzLnN0YXRlID0ge1xuICAgICAgb3BlbkZpbGU6IHRoaXMucHJvcHMubG9jYXRpb24uZmlsZSxcbiAgICAgIGVkaXRvclN0YXRlOiBuZXcgTWFwPFNvdXJjZUZpbGUsIEVkaXRvckZpbGVTdGF0ZT4oKSxcbiAgICAgIGhpZ2hsaWdodGVkRnJhbWVzOiB0aGlzLnByb3BzLnN0YWNrVHJhY2VzLmdldEZyYW1lc0ZvckZpbGUodGhpcy5wcm9wcy5sb2NhdGlvbi5maWxlKVxuICAgIH07XG4gICAgLy8gSW5pdGlhbGl6ZSBlZGl0b3JTdGF0ZSBmb3IgYWxsIGZpbGVzLlxuICAgIHRoaXMucHJvcHMuZmlsZXMuZ2V0U291cmNlRmlsZXMoKS5mb3JFYWNoKChmKSA9PiB7XG4gICAgICBjb25zdCBlZnMgPSBuZXcgRWRpdG9yRmlsZVN0YXRlKG5ldyBMb2NhdGlvbihmLCAxLCAxLCB0cnVlKSwgZmFsc2UpO1xuICAgICAgdGhpcy5zdGF0ZS5lZGl0b3JTdGF0ZS5zZXQoZiwgZWZzKTtcbiAgICAgIGlmIChmID09PSB0aGlzLnN0YXRlLm9wZW5GaWxlKSB7XG4gICAgICAgIGVmcy5sb2NhdGlvbiA9IHRoaXMucHJvcHMubG9jYXRpb247XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBwdWJsaWMgY29tcG9uZW50RGlkTW91bnQoKSB7XG4gICAgdGhpcy5fdXBkYXRlQWNlRWRpdG9yKCk7XG4gICAgLy8gVE9ETzogT24gY2xpY2sgYW5ub3RhdGlvbiAvIG1hcmtlciwgc2VsZWN0IGZyYW1lcyBpbiBsZWZ0IHBhbmUuXG4gICAgLypjb25zdCBlZGl0b3I6IEFjZUFqYXguRWRpdG9yID0gKHRoaXMucmVmcy5hY2VFZGl0b3IgYXMgYW55KS5lZGl0b3I7XG4gICAgZWRpdG9yLm9uKCdjbGljaycsIChlKSA9PiB7XG4gICAgICBjb25zdCBwb3MgPSBlLmdldERvY3VtZW50UG9zaXRpb24oKTtcbiAgICAgIGNvbnN0IHJvdyA9IHBvcy5yb3c7XG4gICAgICBjb25zdCBjb2wgPSBwb3MuY29sdW1uO1xuICAgIH0pOyovXG4gICAgLy8gZ3V0dGVybW91c2Vkb3duXG4gICAgY29uc3QgZWRpdG9yOiBBY2VBamF4LkVkaXRvciA9ICh0aGlzLnJlZnMuYWNlRWRpdG9yIGFzIGFueSkuZWRpdG9yO1xuICAgIGVkaXRvci4kYmxvY2tTY3JvbGxpbmcgPSBJbmZpbml0eTtcbiAgICAvL1xuICB9XG5cbiAgcHVibGljIGNvbXBvbmVudERpZFVwZGF0ZSgpIHtcbiAgICB0aGlzLl91cGRhdGVBY2VFZGl0b3IoKTtcbiAgfVxuXG4gIHByaXZhdGUgX3VwZGF0ZUFjZUVkaXRvcigpIHtcbiAgICBjb25zdCBlZGl0b3I6IEFjZUFqYXguRWRpdG9yID0gKHRoaXMucmVmcy5hY2VFZGl0b3IgYXMgYW55KS5lZGl0b3I7XG5cbiAgICAvLyBTY3JvbGwgaW50byB2aWV3XG4gICAgY29uc3QgZWRpdG9yU3RhdGUgPSB0aGlzLnN0YXRlLmVkaXRvclN0YXRlLmdldCh0aGlzLnN0YXRlLm9wZW5GaWxlKTtcbiAgICBjb25zdCBwcmV0dHlQcmludCA9IGVkaXRvclN0YXRlLnByZXR0eVByaW50ZWQ7XG4gICAgY29uc3QgZWRpdG9yU3RhdGVMb2NhdGlvbiA9IHByZXR0eVByaW50ID8gZWRpdG9yU3RhdGUubG9jYXRpb24uZ2V0Rm9ybWF0dGVkTG9jYXRpb24oKSA6IGVkaXRvclN0YXRlLmxvY2F0aW9uLmdldE9yaWdpbmFsTG9jYXRpb24oKTtcbiAgICAvLyBTY3JvbGwgaW50byBjZW50ZXIgb2Ygdmlldy4gKENvbHVtbiBpcyAxLWluZGV4ZWQgaGVyZSwgcm93IGlzIDAtaW5kZXhlZClcbiAgICAoZWRpdG9yLnJlbmRlcmVyLnNjcm9sbEN1cnNvckludG9WaWV3IGFzIGFueSkoZWRpdG9yU3RhdGVMb2NhdGlvbi50b0FjZUVkaXRvckxvY2F0aW9uKCksIDAuNSk7XG5cbiAgICBjb25zdCBzZXNzaW9uID0gZWRpdG9yLmdldFNlc3Npb24oKTtcbiAgICBjb25zdCBmcmFtZXMgPSB0aGlzLnN0YXRlLmhpZ2hsaWdodGVkRnJhbWVzO1xuXG4gICAgLy8gRGlzcGxheSBhbm5vdGF0aW9ucyBmb3IgZmlsZS5cbiAgICBjb25zdCBhbm5vdGF0aW9ucyA9IGZyYW1lcy5tYXAoKGYpOiBBY2VBbm5vdGF0aW9uID0+IHtcbiAgICAgIGNvbnN0IG9nTG9jYXRpb24gPSBmLmdldE9yaWdpbmFsTG9jYXRpb24oKTtcbiAgICAgIGNvbnN0IGxvY2F0aW9uID0gcHJldHR5UHJpbnQgPyBmLmdldEZvcm1hdHRlZExvY2F0aW9uKCkgOiBmLmdldE9yaWdpbmFsTG9jYXRpb24oKTtcbiAgICAgIGNvbnN0IGxlYWtzID0gdGhpcy5wcm9wcy5zdGFja1RyYWNlcy5nZXRMZWFrc0ZvckxvY2F0aW9uKG9nTG9jYXRpb24pO1xuICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe1xuICAgICAgICB0eXBlOiAnZXJyb3InLFxuICAgICAgICB0ZXh0OiBgQ29udHJpYnV0ZXMgdG8gbWVtb3J5IGxlYWtzOlxcbiR7bGVha3MubWFwKChsKSA9PiBwYXRoVG9TdHJpbmcobC5wYXRoc1swXSkpLmpvaW4oXCIsXFxuXCIpfWBcbiAgICAgIH0sIGxvY2F0aW9uLnRvQWNlRWRpdG9yTG9jYXRpb24oKSk7XG4gICAgfSk7XG4gICAgc2Vzc2lvbi5zZXRBbm5vdGF0aW9ucyhhbm5vdGF0aW9ucyk7XG5cbiAgICAvLyBSZW1vdmUgb2xkIG1hcmtlcnMuXG4gICAgY29uc3QgbWFya2VycyA9IHNlc3Npb24uZ2V0TWFya2VycyhmYWxzZSk7XG4gICAgZm9yIChjb25zdCBwcm9wIGluIG1hcmtlcnMpIHtcbiAgICAgIGlmIChtYXJrZXJzLmhhc093blByb3BlcnR5KHByb3ApKSB7XG4gICAgICAgIHNlc3Npb24ucmVtb3ZlTWFya2VyKG1hcmtlcnNbcHJvcF0uaWQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGRvYyA9IHNlc3Npb24uZ2V0RG9jdW1lbnQoKTtcblxuICAgIC8vIERpc3BsYXkgbWFya2Vycy5cbiAgICBmcmFtZXMuZm9yRWFjaCgoZikgPT4ge1xuICAgICAgY29uc3QgbG9jYXRpb24gPSBwcmV0dHlQcmludCA/IGYuZ2V0Rm9ybWF0dGVkTG9jYXRpb24oKSA6IGYuZ2V0T3JpZ2luYWxMb2NhdGlvbigpO1xuICAgICAgY29uc3QgZGlzcGxheWVkID0gZi5lcXVhbChlZGl0b3JTdGF0ZS5sb2NhdGlvbik7XG4gICAgICBsZXQgcGFyZW5zRGVlcCA9IDA7XG4gICAgICBsZXQgaW5TdHJpbmcgPSBmYWxzZTtcbiAgICAgIGxldCBzdHJpbmdDaGFyOiBzdHJpbmcgPSBudWxsO1xuICAgICAgbGV0IG5leHRFc2NhcGVkID0gZmFsc2U7XG4gICAgICBsZXQgb25seVdoaXRlc3BhY2UgPSB0cnVlO1xuICAgICAgQ0hBUl9TVFJFQU0uaW5pdChkb2MsIGxvY2F0aW9uKTtcblxuICAgICAgLy8gSGFja3kgaGV1cmlzdGljIHRvIGZpZ3VyZSBvdXQgd2hhdCB0byBoaWdobGlnaHQuXG4gICAgICBvdXRlckxvb3A6XG4gICAgICB3aGlsZSAoIUNIQVJfU1RSRUFNLkVPRigpKSB7XG4gICAgICAgIGNvbnN0IGMgPSBDSEFSX1NUUkVBTS5uZXh0Q2hhcigpO1xuICAgICAgICBpZiAoaW5TdHJpbmcpIHtcbiAgICAgICAgICBpZiAobmV4dEVzY2FwZWQpIHtcbiAgICAgICAgICAgIG5leHRFc2NhcGVkID0gZmFsc2U7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgc3dpdGNoIChjKSB7XG4gICAgICAgICAgICBjYXNlICdcXFxcJzpcbiAgICAgICAgICAgICAgbmV4dEVzY2FwZWQgPSB0cnVlO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgaW5TdHJpbmcgPSBjID09PSBzdHJpbmdDaGFyO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAocGFyZW5zRGVlcCA+IDApIHtcbiAgICAgICAgICBzd2l0Y2goYykge1xuICAgICAgICAgICAgY2FzZSAnKCc6XG4gICAgICAgICAgICAgIHBhcmVuc0RlZXArKztcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICcpJzpcbiAgICAgICAgICAgICAgcGFyZW5zRGVlcC0tO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHBhcmVuc0RlZXAgPT09IDApIHtcbiAgICAgICAgICAgIC8vIEJyZWFrIG91dGVyIGxvb3AuXG4gICAgICAgICAgICAvLyBXZSByZWFjaGVkIHRoZSBlbmQgb2YgYSBmdW5jdGlvbiBjYWxsLlxuICAgICAgICAgICAgYnJlYWsgb3V0ZXJMb29wO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzd2l0Y2ggKGMpIHtcbiAgICAgICAgICAgIGNhc2UgJ1wiJzpcbiAgICAgICAgICAgIGNhc2UgXCInXCI6XG4gICAgICAgICAgICAgIG9ubHlXaGl0ZXNwYWNlID0gZmFsc2U7XG4gICAgICAgICAgICAgIGluU3RyaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICAgc3RyaW5nQ2hhciA9IGM7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnKCc6XG4gICAgICAgICAgICAgIG9ubHlXaGl0ZXNwYWNlID0gZmFsc2U7XG4gICAgICAgICAgICAgIHBhcmVuc0RlZXAgPSAxO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJzsnOlxuICAgICAgICAgICAgY2FzZSAnLCc6XG4gICAgICAgICAgICBjYXNlICc6JzpcbiAgICAgICAgICAgICAgb25seVdoaXRlc3BhY2UgPSBmYWxzZTtcbiAgICAgICAgICAgICAgLy8gRkFMTC1USFJVIVxuICAgICAgICAgICAgY2FzZSAnXFxyJzpcbiAgICAgICAgICAgIGNhc2UgJ1xcbic6XG4gICAgICAgICAgICAgIC8vIEVuZCBvZiBzdGF0ZW1lbnQuXG4gICAgICAgICAgICAgIGlmICghb25seVdoaXRlc3BhY2UpIHtcbiAgICAgICAgICAgICAgICBicmVhayBvdXRlckxvb3A7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBzZXNzaW9uLmFkZE1hcmtlcihDSEFSX1NUUkVBTS50b1JhbmdlKCksIGRpc3BsYXllZCA/ICdsZWFrX2xpbmVfc2VsZWN0ZWQnIDogJ2xlYWtfbGluZScsICdzb21lVHlwZScsIGZhbHNlKTtcbiAgICB9KTtcbiAgfVxuXG4gIHB1YmxpYyBjb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzKHByb3BzOiBTb3VyY2VDb2RlVmlld1Byb3BzKSB7XG4gICAgY29uc3QgbG9jID0gcHJvcHMubG9jYXRpb247XG4gICAgdGhpcy5fY2hhbmdlT3BlbkZpbGUodHJ1ZSwgbG9jKTtcbiAgfVxuXG4gIHByaXZhdGUgX2NoYW5nZU9wZW5GaWxlKGZyb21Qcm9wczogYm9vbGVhbiwgbG9jYXRpb246IExvY2F0aW9uKTogdm9pZCB7XG4gICAgaWYgKCFmcm9tUHJvcHMgJiYgbG9jYXRpb24uZmlsZSA9PT0gdGhpcy5zdGF0ZS5vcGVuRmlsZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBlZGl0b3I6IEFjZUFqYXguRWRpdG9yID0gKHRoaXMucmVmcy5hY2VFZGl0b3IgYXMgYW55KS5lZGl0b3I7XG4gICAgY29uc3QgbGFzdFJvdyA9IGVkaXRvci5nZXRMYXN0VmlzaWJsZVJvdygpO1xuICAgIGNvbnN0IGZpcnN0Um93ID0gZWRpdG9yLmdldEZpcnN0VmlzaWJsZVJvdygpO1xuICAgIGNvbnN0IG1pZGRsZSA9IE1hdGguZmxvb3IoKGxhc3RSb3cgLSBmaXJzdFJvdykgLyAyKSArIGZpcnN0Um93ICsgMTtcbiAgICBjb25zdCBvbGRGaWxlU3RhdGUgPSB0aGlzLnN0YXRlLmVkaXRvclN0YXRlLmdldCh0aGlzLnN0YXRlLm9wZW5GaWxlKTtcbiAgICBvbGRGaWxlU3RhdGUubG9jYXRpb24gPSBuZXcgTG9jYXRpb24odGhpcy5zdGF0ZS5vcGVuRmlsZSwgbWlkZGxlLCAxLCAhb2xkRmlsZVN0YXRlLnByZXR0eVByaW50ZWQpO1xuICAgIGNvbnN0IG5ld0ZpbGVTdGF0ZSA9IHRoaXMuc3RhdGUuZWRpdG9yU3RhdGUuZ2V0KGxvY2F0aW9uLmZpbGUpO1xuICAgIG5ld0ZpbGVTdGF0ZS5sb2NhdGlvbiA9IGxvY2F0aW9uO1xuICAgIGNvbnN0IGZyYW1lcyA9IHRoaXMucHJvcHMuc3RhY2tUcmFjZXMuZ2V0RnJhbWVzRm9yRmlsZShsb2NhdGlvbi5maWxlKTtcbiAgICB0aGlzLnNldFN0YXRlKHsgb3BlbkZpbGU6IGxvY2F0aW9uLmZpbGUsIGhpZ2hsaWdodGVkRnJhbWVzOiBmcmFtZXMgfSk7XG4gIH1cblxuICBwcml2YXRlIF9wcmV0dHlQcmludFRvZ2dsZSgpIHtcbiAgICBjb25zdCBmaWxlU3RhdGUgPSB0aGlzLnN0YXRlLmVkaXRvclN0YXRlLmdldCh0aGlzLnN0YXRlLm9wZW5GaWxlKTtcbiAgICBmaWxlU3RhdGUucHJldHR5UHJpbnRlZCA9ICFmaWxlU3RhdGUucHJldHR5UHJpbnRlZDtcbiAgICB0aGlzLnNldFN0YXRlKHsgZWRpdG9yU3RhdGU6IHRoaXMuc3RhdGUuZWRpdG9yU3RhdGUgfSk7XG4gIH1cblxuICBwdWJsaWMgcmVuZGVyKCkge1xuICAgIGNvbnN0IHNvdXJjZUZpbGUgPSB0aGlzLnN0YXRlLm9wZW5GaWxlO1xuICAgIGNvbnN0IG9wZW5GaWxlU3RhdGUgPSB0aGlzLnN0YXRlLmVkaXRvclN0YXRlLmdldChzb3VyY2VGaWxlKTtcblxuICAgIHJldHVybiA8ZGl2IGNsYXNzTmFtZT1cInJvd1wiPlxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2wtbGctM1wiPlxuICAgICAgICA8RmlsZUxpc3QgZmlsZXM9e3RoaXMucHJvcHMuZmlsZXN9IGVkaXRvckZpbGU9e3RoaXMuc3RhdGUub3BlbkZpbGV9IG9uRmlsZVNlbGVjdGVkPXsoZikgPT4ge1xuICAgICAgICAgIHRoaXMuX2NoYW5nZU9wZW5GaWxlKGZhbHNlLCB0aGlzLnN0YXRlLmVkaXRvclN0YXRlLmdldChmKS5sb2NhdGlvbik7XG4gICAgICAgIH19IC8+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29sLWxnLTlcIj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyb3dcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC1sZy05XCI+XG4gICAgICAgICAgICA8cD48Yj57dGhpcy5zdGF0ZS5vcGVuRmlsZS51cmx9IHtvcGVuRmlsZVN0YXRlLnByZXR0eVByaW50ZWQgPyAnKFByZXR0eSBQcmludGVkKScgOiAnJ308L2I+PC9wPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29sLWxnLTNcIj5cbiAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImJ0biBidG4tc2Vjb25kYXJ5XCIgb25DbGljaz17dGhpcy5fcHJldHR5UHJpbnRUb2dnbGUuYmluZCh0aGlzKX0+e29wZW5GaWxlU3RhdGUucHJldHR5UHJpbnRlZCA/ICdWaWV3IE9yaWdpbmFsJyA6ICdQcmV0dHkgUHJpbnQnIH08L2J1dHRvbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxBY2VFZGl0b3JcbiAgICAgICAgICByZWY9XCJhY2VFZGl0b3JcIlxuICAgICAgICAgIHJlYWRPbmx5PXt0cnVlfVxuICAgICAgICAgIG1vZGU9XCJqYXZhc2NyaXB0XCJcbiAgICAgICAgICB0aGVtZT1cImdpdGh1YlwiXG4gICAgICAgICAgd2lkdGg9XCIxMDAlXCJcbiAgICAgICAgICBoaWdobGlnaHRBY3RpdmVMaW5lPXtmYWxzZX1cbiAgICAgICAgICBzZXRPcHRpb25zPXsgeyBoaWdobGlnaHRHdXR0ZXJMaW5lOiBmYWxzZSwgdXNlV29ya2VyOiBmYWxzZSB9IH1cbiAgICAgICAgICB2YWx1ZT17b3BlbkZpbGVTdGF0ZS5wcmV0dHlQcmludGVkID8gc291cmNlRmlsZS5mb3JtYXR0ZWRTb3VyY2UgOiBzb3VyY2VGaWxlLnNvdXJjZX0gLz5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PjtcbiAgfVxufSJdfQ==