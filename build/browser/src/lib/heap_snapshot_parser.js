var SNAPSHOT_PROP_NAME = "{\"snapshot\":";
function onSnapshotChunk() {
}
/**
 * Streaming parser for heap snapshots.
 *
 * Here's how the snapshot is streamed from Chrome (newlines included!):
 *
 * {"snapshot":{"meta":{"node_fields":["type","name","id","self_size","edge_count","trace_node_id"],"node_types":[["hidden","array","string","object","code","closure","regexp","number","native","synthetic","concatenated string","sliced string"],"string","number","number","number","number","number"],"edge_fields":["type","name_or_index","to_node"],"edge_types":[["context","element","property","internal","hidden","shortcut","weak"],"string_or_number","node"],"trace_function_info_fields":["function_id","name","script_name","script_id","line","column"],"trace_node_fields":["id","function_info_index","count","size","children"],"sample_fields":["timestamp_us","last_assigned_id"]},"node_count":931835,"edge_count":4713209,"trace_function_count":0},
 * "nodes":[9,1,1,0,6,0
 * ,9,2,3,0,17,0
 * [etc]
 * ],
 * "edges":[1,1,6
 * ,1,1,22824
 * [etc]
 * ],
 * "trace_function_infos":[],
 * "trace_tree":[],
 * "samples":[],
 * "strings":["<dummy>",
 * "[string value, which may have newlines! \ is escape character]",
 * "98272"]}
 *
 * The parser assumes the snapshot is in this format, and that the first chunk contains the entire "snapshot" property.
 */
var HeapSnapshotParser = /** @class */ (function () {
    function HeapSnapshotParser() {
        this._state = 1 /* SNAPSHOT_LINE */;
        this._error = null;
        this._activeProperty = null;
        this._pendingEvents = [];
        this._pendingReads = [];
        this._buffer = "";
        this._onSnapshotChunk = onSnapshotChunk;
    }
    HeapSnapshotParser.FromString = function (data) {
        var rv = new HeapSnapshotParser();
        rv.addSnapshotChunk(data);
        return rv;
    };
    Object.defineProperty(HeapSnapshotParser.prototype, "onSnapshotChunk", {
        set: function (v) {
            this._onSnapshotChunk = v;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Adds another snapshot chunk to parse.
     * @param chunk
     */
    HeapSnapshotParser.prototype.addSnapshotChunk = function (chunk) {
        this._buffer += chunk;
        this._parse();
        this._onSnapshotChunk(chunk, this._state === 5 /* END */);
    };
    HeapSnapshotParser.prototype._parse = function () {
        var chunk = this._buffer;
        var chunkLen = chunk.length;
        var chunkPosition = 0;
        outerLoop: while (!this.hasErrored() && chunkPosition < chunkLen) {
            switch (this._state) {
                case 1 /* SNAPSHOT_LINE */: {
                    // Expecting: {"snapshot":{[object here]},\n
                    var beginString = chunk.slice(chunkPosition, chunkPosition + SNAPSHOT_PROP_NAME.length);
                    if (beginString !== SNAPSHOT_PROP_NAME) {
                        this._raiseError(new Error("Unable to find \"snapshot\" property in first chunk."));
                        break outerLoop;
                    }
                    chunkPosition += SNAPSHOT_PROP_NAME.length;
                    var startIndex = chunkPosition;
                    var endingIndex = -1;
                    for (; chunkPosition < chunkLen; chunkPosition++) {
                        if (chunk[chunkPosition] === "\n") {
                            // - 1 to cut off the comma
                            endingIndex = chunkPosition - 1;
                            chunkPosition++;
                            break;
                        }
                    }
                    if (endingIndex === -1) {
                        this._raiseError(new Error("Unable to find whole \"snapshot\" object in first snapshot chunk."));
                        break outerLoop;
                    }
                    try {
                        var snapshot = JSON.parse(chunk.slice(startIndex, endingIndex));
                        this._pendingEvents.push({
                            type: 1 /* SNAPSHOT */,
                            data: snapshot
                        });
                        this._state = 2 /* ARRAY_PROPERTY_BEGIN */;
                    }
                    catch (e) {
                        this._raiseError(e);
                        break outerLoop;
                    }
                    break;
                }
                case 2 /* ARRAY_PROPERTY_BEGIN */: {
                    var start = chunkPosition;
                    for (; chunkPosition < chunk.length && chunk[chunkPosition] !== "["; chunkPosition++) {
                        // Wait.
                    }
                    if (chunkPosition >= chunk.length) {
                        this._raiseError(new Error("Unable to locate the beginning of a property."));
                        break outerLoop;
                    }
                    // Skip over "[".
                    chunkPosition++;
                    // [start, chunkPosition) should be string `"propname":[`
                    this._activeProperty = chunk.slice(start + 1, chunkPosition - 3);
                    if (this._activeProperty === "strings") {
                        this._state = 4 /* STRING_ARRAY */;
                    }
                    else {
                        this._state = 3 /* NUMBER_ARRAY */;
                    }
                    break;
                }
                case 3 /* NUMBER_ARRAY */: {
                    var start = chunkPosition;
                    var lastNewline = start;
                    numberForLoop: for (; chunkPosition < chunkLen; chunkPosition++) {
                        switch (chunk[chunkPosition]) {
                            case "]":
                                // End of array.
                                break numberForLoop;
                            case "\n":
                                lastNewline = chunkPosition;
                                break;
                        }
                    }
                    var arrayEnded = chunkPosition !== chunkLen;
                    // [start, end) is either:
                    // - "" if the array is zero-length,
                    // - "9,3,4,5\n,1,2,3[etc]" if this is the start of the array,
                    // - ",1,2,3,4" if this is the middle of the array
                    // It does not contain the "]" character.
                    var end = arrayEnded ? chunkPosition : lastNewline;
                    if (start !== end) {
                        var beginningComma = chunk[start] === ",";
                        var numberChunk = chunk.slice(beginningComma ? start + 1 : start, end);
                        var numbers = JSON.parse("[" + numberChunk + "]");
                        switch (this._activeProperty) {
                            case "nodes":
                                this._pendingEvents.push({
                                    type: 2 /* NODES */,
                                    data: numbers
                                });
                                break;
                            case "edges":
                                this._pendingEvents.push({
                                    type: 3 /* EDGES */,
                                    data: numbers
                                });
                                break;
                        }
                    }
                    if (arrayEnded) {
                        // Skip "]".
                        chunkPosition++;
                        switch (chunk[chunkPosition]) {
                            case ",":
                                this._state = 2 /* ARRAY_PROPERTY_BEGIN */;
                                // Skip , and \n
                                chunkPosition += 2;
                                break;
                            case "}":
                                this._state = 5 /* END */;
                                break;
                            default:
                                this._raiseError(new Error("Unrecognized end-of-array character: " + chunk[chunkPosition]));
                                break;
                        }
                        break;
                    }
                    else {
                        // Skip \n
                        chunkPosition = lastNewline + 1;
                        break outerLoop;
                    }
                }
                case 4 /* STRING_ARRAY */: {
                    var start = chunkPosition;
                    var escaped = false;
                    var lastStringEnding = start;
                    var isInString = false;
                    // Look for unescaped "]", which ends the array.
                    stringWhile: while (chunkPosition < chunkLen) {
                        switch (chunk[chunkPosition]) {
                            case '"':
                                if (!escaped) {
                                    isInString = !isInString;
                                    if (!isInString) {
                                        lastStringEnding = chunkPosition;
                                    }
                                }
                                escaped = false;
                                break;
                            case ']':
                                if (!isInString) {
                                    break stringWhile;
                                }
                                escaped = false;
                                break;
                            case '\\':
                                // Flip, for sequences of "\" (e.g. an actual \ character)
                                escaped = !escaped;
                                break;
                            default:
                                escaped = false;
                                break;
                        }
                        chunkPosition++;
                    }
                    var arrayEnded = chunkPosition !== chunkLen;
                    // [start, end) is either:
                    // - "" if the array is zero-length,
                    // - "9,3,4,5\n,1,2,3[etc]" if this is the start of the array,
                    // - ",1,2,3,4" if this is the middle of the array
                    // It does not contain the "]" character.
                    var end = arrayEnded ? chunkPosition : lastStringEnding + 1;
                    if (start !== end) {
                        var beginningComma = chunk[start] === ",";
                        var stringChunk = chunk.slice(beginningComma ? start + 1 : start, end);
                        var strings = JSON.parse("[" + stringChunk + "]");
                        this._pendingEvents.push({
                            type: 4 /* STRINGS */,
                            data: strings
                        });
                    }
                    if (arrayEnded) {
                        // Skip "]".
                        chunkPosition++;
                        switch (chunk[chunkPosition]) {
                            case ",":
                                this._state = 2 /* ARRAY_PROPERTY_BEGIN */;
                                break;
                            case "}":
                                this._state = 5 /* END */;
                                break;
                            default:
                                this._raiseError(new Error("Unrecognized end-of-array character: " + chunk[chunkPosition]));
                                break;
                        }
                    }
                    else {
                        chunkPosition = lastStringEnding + 1;
                        break outerLoop;
                    }
                    break;
                }
                case 5 /* END */:
                    if (chunk[chunkPosition] !== '}') {
                        this._raiseError(new Error("Unexpected end of snapshot: " + chunk[chunkPosition]));
                        break outerLoop;
                    }
                    chunkPosition++;
                    this._pendingEvents.push(null);
                    break outerLoop;
                case 0 /* ERROR */:
                    break outerLoop;
                default:
                    this._raiseError(new Error("Invalid state: " + this._state));
                    break outerLoop;
            }
        }
        if (chunkPosition < chunkLen && this._state !== 4 /* STRING_ARRAY */ && this._state !== 3 /* NUMBER_ARRAY */ && !this.hasErrored()) {
            this._raiseError(new Error("Parsing error: Did not consume whole chunk!"));
        }
        if (chunkPosition < chunkLen) {
            this._buffer = chunk.slice(chunkPosition);
        }
        else {
            this._buffer = "";
        }
        this._processPendingPromises();
    };
    HeapSnapshotParser.prototype._processPendingPromises = function () {
        var hasErrored = this.hasErrored();
        while (!hasErrored && this._pendingReads.length > 0 && this._pendingEvents.length > 0) {
            this._pendingReads.shift().resolve(this._pendingEvents.shift());
        }
        if (hasErrored) {
            for (var _i = 0, _a = this._pendingReads; _i < _a.length; _i++) {
                var promise = _a[_i];
                promise.reject(this._error);
            }
            this._pendingReads = [];
        }
        else if (this._pendingEvents.length === 0 && this._state === 5 /* END */) {
            for (var _b = 0, _c = this._pendingReads; _b < _c.length; _b++) {
                var promise = _c[_b];
                promise.resolve(null);
            }
            this._pendingReads = [];
        }
    };
    HeapSnapshotParser.prototype._raiseError = function (e) {
        this._error = e;
        this._state = 0 /* ERROR */;
        this._processPendingPromises();
    };
    HeapSnapshotParser.prototype.hasErrored = function () {
        return this._state === 0 /* ERROR */;
    };
    HeapSnapshotParser.prototype.read = function () {
        var _this = this;
        if (this._pendingEvents.length > 0) {
            return Promise.resolve(this._pendingEvents.shift());
        }
        else {
            return new Promise(function (resolve, reject) {
                _this._pendingReads.push({ resolve: resolve, reject: reject });
            });
        }
    };
    return HeapSnapshotParser;
}());
export default HeapSnapshotParser;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGVhcF9zbmFwc2hvdF9wYXJzZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvbGliL2hlYXBfc25hcHNob3RfcGFyc2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQXlDQSxJQUFNLGtCQUFrQixHQUFHLGdCQUFjLENBQUM7QUFFMUM7QUFFQSxDQUFDO0FBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FzQkc7QUFDSDtJQUFBO1FBT1UsV0FBTSx5QkFBMEM7UUFDaEQsV0FBTSxHQUFVLElBQUksQ0FBQztRQUNyQixvQkFBZSxHQUFXLElBQUksQ0FBQztRQUMvQixtQkFBYyxHQUFrQixFQUFFLENBQUM7UUFDbkMsa0JBQWEsR0FBd0UsRUFBRSxDQUFDO1FBQ3hGLFlBQU8sR0FBVyxFQUFFLENBQUM7UUFFckIscUJBQWdCLEdBQTBDLGVBQWUsQ0FBQztJQTRScEYsQ0FBQztJQXpTZSw2QkFBVSxHQUF4QixVQUF5QixJQUFZO1FBQ25DLElBQU0sRUFBRSxHQUFHLElBQUksa0JBQWtCLEVBQUUsQ0FBQztRQUNwQyxFQUFFLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDMUIsTUFBTSxDQUFDLEVBQUUsQ0FBQztJQUNaLENBQUM7SUFVRCxzQkFBVywrQ0FBZTthQUExQixVQUEyQixDQUF3QztZQUNqRSxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDO1FBQzVCLENBQUM7OztPQUFBO0lBRUQ7OztPQUdHO0lBQ0ksNkNBQWdCLEdBQXZCLFVBQXdCLEtBQWE7UUFDbkMsSUFBSSxDQUFDLE9BQU8sSUFBSSxLQUFLLENBQUM7UUFDdEIsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ2QsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsTUFBTSxnQkFBb0IsQ0FBQyxDQUFDO0lBQ2hFLENBQUM7SUFFTyxtQ0FBTSxHQUFkO1FBQ0UsSUFBTSxLQUFLLEdBQUcsSUFBSSxD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dCI6WyJpbXBvcnQge0hlYXBTbmFwc2hvdENvbnRlbnRzfSBmcm9tICcuLi9jb21tb24vaW50ZXJmYWNlcyc7XG5cbmNvbnN0IGVudW0gUGFyc2VyU3RhdGUge1xuICAvLyBUaGUgcGFyc2VyIGhhcyBlbmNvdW50ZXJlZCBhbiBlcnJvciBhbmQgY2FuIG5vIGxvbmdlciBwcm9jZWVkLlxuICBFUlJPUiA9IDAsXG4gIC8vIFNwZWNpYWwgbW9kZSBmb3IgdGhlIHNuYXBzaG90IGxpbmUuXG4gIFNOQVBTSE9UX0xJTkUsXG4gIC8vIFdhaXRpbmcgZm9yIHRoZSBiZWdpbm5pbmcgb2YgYW4gYXJyYXkgcHJvcGVydHksIGUuZy4gXCJmaWVsZFwiOltcbiAgQVJSQVlfUFJPUEVSVFlfQkVHSU4sXG4gIC8vIFdhaXRpbmcgZm9yIG1vcmUgbnVtYmVycyBpbiBhbiBhcnJheSBwcm9wZXJ0eSwgb3IgdGhlIGVuZCBvZiB0aGUgYXJyYXkgcHJvcGVydHkuXG4gIE5VTUJFUl9BUlJBWSxcbiAgLy8gV2FpdGluZyBmb3IgbW9yZSBzdHJpbmdzIGluIGFuIGFycmF5IHByb3BlcnR5LlxuICBTVFJJTkdfQVJSQVksXG4gIC8vIFdhaXRpbmcgZm9yIGVuZCBvZiBzbmFwc2hvdC5cbiAgRU5EXG59XG5cbmV4cG9ydCBjb25zdCBlbnVtIERhdGFUeXBlcyB7XG4gIFNOQVBTSE9UID0gMSxcbiAgTk9ERVMgPSAyLFxuICBFREdFUyA9IDMsXG4gIFNUUklOR1MgPSA0XG59XG5cbnR5cGUgUGFyc2VyRXZlbnQgPSBTbmFwc2hvdEV2ZW50IHwgTnVtYmVyc0V2ZW50IHwgU3RyaW5nc0V2ZW50O1xuXG5pbnRlcmZhY2UgU25hcHNob3RFdmVudCB7XG4gIHR5cGU6IERhdGFUeXBlcy5TTkFQU0hPVDtcbiAgZGF0YTogSGVhcFNuYXBzaG90Q29udGVudHM7XG59XG5cbmludGVyZmFjZSBOdW1iZXJzRXZlbnQge1xuICB0eXBlOiBEYXRhVHlwZXMuTk9ERVMgfCBEYXRhVHlwZXMuRURHRVM7XG4gIGRhdGE6IG51bWJlcltdO1xufVxuXG5pbnRlcmZhY2UgU3RyaW5nc0V2ZW50IHtcbiAgdHlwZTogRGF0YVR5cGVzLlNUUklOR1M7XG4gIGRhdGE6IHN0cmluZ1tdO1xufVxuXG5jb25zdCBTTkFQU0hPVF9QUk9QX05BTUUgPSBge1wic25hcHNob3RcIjpgO1xuXG5mdW5jdGlvbiBvblNuYXBzaG90Q2h1bmsoKSB7XG5cbn1cblxuLyoqXG4gKiBTdHJlYW1pbmcgcGFyc2VyIGZvciBoZWFwIHNuYXBzaG90cy5cbiAqXG4gKiBIZXJlJ3MgaG93IHRoZSBzbmFwc2hvdCBpcyBzdHJlYW1lZCBmcm9tIENocm9tZSAobmV3bGluZXMgaW5jbHVkZWQhKTpcbiAqXG4gKiB7XCJzbmFwc2hvdFwiOntcIm1ldGFcIjp7XCJub2RlX2ZpZWxkc1wiOltcInR5cGVcIixcIm5hbWVcIixcImlkXCIsXCJzZWxmX3NpemVcIixcImVkZ2VfY291bnRcIixcInRyYWNlX25vZGVfaWRcIl0sXCJub2RlX3R5cGVzXCI6W1tcImhpZGRlblwiLFwiYXJyYXlcIixcInN0cmluZ1wiLFwib2JqZWN0XCIsXCJjb2RlXCIsXCJjbG9zdXJlXCIsXCJyZWdleHBcIixcIm51bWJlclwiLFwibmF0aXZlXCIsXCJzeW50aGV0aWNcIixcImNvbmNhdGVuYXRlZCBzdHJpbmdcIixcInNsaWNlZCBzdHJpbmdcIl0sXCJzdHJpbmdcIixcIm51bWJlclwiLFwibnVtYmVyXCIsXCJudW1iZXJcIixcIm51bWJlclwiLFwibnVtYmVyXCJdLFwiZWRnZV9maWVsZHNcIjpbXCJ0eXBlXCIsXCJuYW1lX29yX2luZGV4XCIsXCJ0b19ub2RlXCJdLFwiZWRnZV90eXBlc1wiOltbXCJjb250ZXh0XCIsXCJlbGVtZW50XCIsXCJwcm9wZXJ0eVwiLFwiaW50ZXJuYWxcIixcImhpZGRlblwiLFwic2hvcnRjdXRcIixcIndlYWtcIl0sXCJzdHJpbmdfb3JfbnVtYmVyXCIsXCJub2RlXCJdLFwidHJhY2VfZnVuY3Rpb25faW5mb19maWVsZHNcIjpbXCJmdW5jdGlvbl9pZFwiLFwibmFtZVwiLFwic2NyaXB0X25hbWVcIixcInNjcmlwdF9pZFwiLFwibGluZVwiLFwiY29sdW1uXCJdLFwidHJhY2Vfbm9kZV9maWVsZHNcIjpbXCJpZFwiLFwiZnVuY3Rpb25faW5mb19pbmRleFwiLFwiY291bnRcIixcInNpemVcIixcImNoaWxkcmVuXCJdLFwic2FtcGxlX2ZpZWxkc1wiOltcInRpbWVzdGFtcF91c1wiLFwibGFzdF9hc3NpZ25lZF9pZFwiXX0sXCJub2RlX2NvdW50XCI6OTMxODM1LFwiZWRnZV9jb3VudFwiOjQ3MTMyMDksXCJ0cmFjZV9mdW5jdGlvbl9jb3VudFwiOjB9LFxuICogXCJub2Rlc1wiOls5LDEsMSwwLDYsMFxuICogLDksMiwzLDAsMTcsMFxuICogW2V0Y11cbiAqIF0sXG4gKiBcImVkZ2VzXCI6WzEsMSw2XG4gKiAsMSwxLDIyODI0XG4gKiBbZXRjXVxuICogXSxcbiAqIFwidHJhY2VfZnVuY3Rpb25faW5mb3NcIjpbXSxcbiAqIFwidHJhY2VfdHJlZVwiOltdLFxuICogXCJzYW1wbGVzXCI6W10sXG4gKiBcInN0cmluZ3NcIjpbXCI8ZHVtbXk+XCIsXG4gKiBcIltzdHJpbmcgdmFsdWUsIHdoaWNoIG1heSBoYXZlIG5ld2xpbmVzISBcXCBpcyBlc2NhcGUgY2hhcmFjdGVyXVwiLFxuICogXCI5ODI3MlwiXX1cbiAqXG4gKiBUaGUgcGFyc2VyIGFzc3VtZXMgdGhlIHNuYXBzaG90IGlzIGluIHRoaXMgZm9ybWF0LCBhbmQgdGhhdCB0aGUgZmlyc3QgY2h1bmsgY29udGFpbnMgdGhlIGVudGlyZSBcInNuYXBzaG90XCIgcHJvcGVydHkuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEhlYXBTbmFwc2hvdFBhcnNlciB7XG4gIHB1YmxpYyBzdGF0aWMgRnJvbVN0cmluZyhkYXRhOiBzdHJpbmcpOiBIZWFwU25hcHNob3RQYXJzZXIge1xuICAgIGNvbnN0IHJ2ID0gbmV3IEhlYXBTbmFwc2hvdFBhcnNlcigpO1xuICAgIHJ2LmFkZFNuYXBzaG90Q2h1bmsoZGF0YSk7XG4gICAgcmV0dXJuIHJ2O1xuICB9XG5cbiAgcHJpdmF0ZSBfc3RhdGU6IFBhcnNlclN0YXRlID0gUGFyc2VyU3RhdGUuU05BUFNIT1RfTElORTtcbiAgcHJpdmF0ZSBfZXJyb3I6IEVycm9yID0gbnVsbDtcbiAgcHJpdmF0ZSBfYWN0aXZlUHJvcGVydHk6IHN0cmluZyA9IG51bGw7XG4gIHByaXZhdGUgX3BlbmRpbmdFdmVudHM6IFBhcnNlckV2ZW50W10gPSBbXTtcbiAgcHJpdmF0ZSBfcGVuZGluZ1JlYWRzOiB7IHJlc29sdmU6IChlOiBQYXJzZXJFdmVudCkgPT4gdm9pZCwgcmVqZWN0OiAoZTogRXJyb3IpID0+IHZvaWQgfVtdID0gW107XG4gIHByaXZhdGUgX2J1ZmZlcjogc3RyaW5nID0gXCJcIjtcblxuICBwcml2YXRlIF9vblNuYXBzaG90Q2h1bms6IChjaHVuazogc3RyaW5nLCBlbmQ6IGJvb2xlYW4pID0+IHZvaWQgPSBvblNuYXBzaG90Q2h1bms7XG4gIHB1YmxpYyBzZXQgb25TbmFwc2hvdENodW5rKHY6IChjaHVuazogc3RyaW5nLCBlbmQ6IGJvb2xlYW4pID0+IHZvaWQpIHtcbiAgICB0aGlzLl9vblNuYXBzaG90Q2h1bmsgPSB2O1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgYW5vdGhlciBzbmFwc2hvdCBjaHVuayB0byBwYXJzZS5cbiAgICogQHBhcmFtIGNodW5rXG4gICAqL1xuICBwdWJsaWMgYWRkU25hcHNob3RDaHVuayhjaHVuazogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5fYnVmZmVyICs9IGNodW5rO1xuICAgIHRoaXMuX3BhcnNlKCk7XG4gICAgdGhpcy5fb25TbmFwc2hvdENodW5rKGNodW5rLCB0aGlzLl9zdGF0ZSA9PT0gUGFyc2VyU3RhdGUuRU5EKTtcbiAgfVxuXG4gIHByaXZhdGUgX3BhcnNlKCk6IHZvaWQge1xuICAgIGNvbnN0IGNodW5rID0gdGhpcy5fYnVmZmVyO1xuICAgIGNvbnN0IGNodW5rTGVuID0gY2h1bmsubGVuZ3RoO1xuICAgIGxldCBjaHVua1Bvc2l0aW9uID0gMDtcblxuICAgIG91dGVyTG9vcDpcbiAgICB3aGlsZSAoIXRoaXMuaGFzRXJyb3JlZCgpICYmIGNodW5rUG9zaXRpb24gPCBjaHVua0xlbikge1xuICAgICAgc3dpdGNoICh0aGlzLl9zdGF0ZSkge1xuICAgICAgICBjYXNlIFBhcnNlclN0YXRlLlNOQVBTSE9UX0xJTkU6IHtcbiAgICAgICAgICAvLyBFeHBlY3Rpbmc6IHtcInNuYXBzaG90XCI6e1tvYmplY3QgaGVyZV19LFxcblxuICAgICAgICAgIGNvbnN0IGJlZ2luU3RyaW5nID0gY2h1bmsuc2xpY2UoY2h1bmtQb3NpdGlvbiwgY2h1bmtQb3NpdGlvbiArIFNOQVBTSE9UX1BST1BfTkFNRS5sZW5ndGgpO1xuICAgICAgICAgIGlmIChiZWdpblN0cmluZyAhPT0gU05BUFNIT1RfUFJPUF9OQU1FKSB7XG4gICAgICAgICAgICB0aGlzLl9yYWlzZUVycm9yKG5ldyBFcnJvcihgVW5hYmxlIHRvIGZpbmQgXCJzbmFwc2hvdFwiIHByb3BlcnR5IGluIGZpcnN0IGNodW5rLmApKTtcbiAgICAgICAgICAgIGJyZWFrIG91dGVyTG9vcDtcbiAgICAgICAgICB9XG4gICAgICAgICAgY2h1bmtQb3NpdGlvbiArPSBTTkFQU0hPVF9QUk9QX05BTUUubGVuZ3RoO1xuXG4gICAgICAgICAgbGV0IHN0YXJ0SW5kZXggPSBjaHVua1Bvc2l0aW9uO1xuICAgICAgICAgIGxldCBlbmRpbmdJbmRleCA9IC0xO1xuICAgICAgICAgIGZvciAoOyBjaHVua1Bvc2l0aW9uIDwgY2h1bmtMZW47IGNodW5rUG9zaXRpb24rKykge1xuICAgICAgICAgICAgaWYgKGNodW5rW2NodW5rUG9zaXRpb25dID09PSBcIlxcblwiKSB7XG4gICAgICAgICAgICAgIC8vIC0gMSB0byBjdXQgb2ZmIHRoZSBjb21tYVxuICAgICAgICAgICAgICBlbmRpbmdJbmRleCA9IGNodW5rUG9zaXRpb24gLSAxO1xuICAgICAgICAgICAgICBjaHVua1Bvc2l0aW9uKys7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoZW5kaW5nSW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgICB0aGlzLl9yYWlzZUVycm9yKG5ldyBFcnJvcihgVW5hYmxlIHRvIGZpbmQgd2hvbGUgXCJzbmFwc2hvdFwiIG9iamVjdCBpbiBmaXJzdCBzbmFwc2hvdCBjaHVuay5gKSk7XG4gICAgICAgICAgICBicmVhayBvdXRlckxvb3A7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHNuYXBzaG90OiBIZWFwU25hcHNob3RDb250ZW50cyA9IEpTT04ucGFyc2UoY2h1bmsuc2xpY2Uoc3RhcnRJbmRleCwgZW5kaW5nSW5kZXgpKTtcbiAgICAgICAgICAgIHRoaXMuX3BlbmRpbmdFdmVudHMucHVzaCh7XG4gICAgICAgICAgICAgIHR5cGU6IERhdGFUeXBlcy5TTkFQU0hPVCxcbiAgICAgICAgICAgICAgZGF0YTogc25hcHNob3RcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5fc3RhdGUgPSBQYXJzZXJTdGF0ZS5BUlJBWV9QUk9QRVJUWV9CRUdJTjtcbiAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICB0aGlzLl9yYWlzZUVycm9yKGUpO1xuICAgICAgICAgICAgYnJlYWsgb3V0ZXJMb29wO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFBhcnNlclN0YXRlLkFSUkFZX1BST1BFUlRZX0JFR0lOOiB7XG4gICAgICAgICAgY29uc3Qgc3RhcnQgPSBjaHVua1Bvc2l0aW9uO1xuICAgICAgICAgIGZvciAoOyBjaHVua1Bvc2l0aW9uIDwgY2h1bmsubGVuZ3RoICYmIGNodW5rW2NodW5rUG9zaXRpb25dICE9PSBcIltcIjsgY2h1bmtQb3NpdGlvbisrKSB7XG4gICAgICAgICAgICAvLyBXYWl0LlxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChjaHVua1Bvc2l0aW9uID49IGNodW5rLmxlbmd0aCkge1xuICAgICAgICAgICAgdGhpcy5fcmFpc2VFcnJvcihuZXcgRXJyb3IoYFVuYWJsZSB0byBsb2NhdGUgdGhlIGJlZ2lubmluZyBvZiBhIHByb3BlcnR5LmApKTtcbiAgICAgICAgICAgIGJyZWFrIG91dGVyTG9vcDtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gU2tpcCBvdmVyIFwiW1wiLlxuICAgICAgICAgIGNodW5rUG9zaXRpb24rKztcblxuICAgICAgICAgIC8vIFtzdGFydCwgY2h1bmtQb3NpdGlvbikgc2hvdWxkIGJlIHN0cmluZyBgXCJwcm9wbmFtZVwiOltgXG4gICAgICAgICAgdGhpcy5fYWN0aXZlUHJvcGVydHkgPSBjaHVuay5zbGljZShzdGFydCArIDEsIGNodW5rUG9zaXRpb24gLSAzKTtcblxuICAgICAgICAgIGlmICh0aGlzLl9hY3RpdmVQcm9wZXJ0eSA9PT0gXCJzdHJpbmdzXCIpIHtcbiAgICAgICAgICAgIHRoaXMuX3N0YXRlID0gUGFyc2VyU3RhdGUuU1RSSU5HX0FSUkFZO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9zdGF0ZSA9IFBhcnNlclN0YXRlLk5VTUJFUl9BUlJBWTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBQYXJzZXJTdGF0ZS5OVU1CRVJfQVJSQVk6IHtcbiAgICAgICAgICBjb25zdCBzdGFydCA9IGNodW5rUG9zaXRpb247XG4gICAgICAgICAgbGV0IGxhc3ROZXdsaW5lID0gc3RhcnQ7XG4gICAgICAgICAgbnVtYmVyRm9yTG9vcDpcbiAgICAgICAgICBmb3IgKDsgY2h1bmtQb3NpdGlvbiA8IGNodW5rTGVuOyBjaHVua1Bvc2l0aW9uKyspIHtcbiAgICAgICAgICAgIHN3aXRjaCAoY2h1bmtbY2h1bmtQb3NpdGlvbl0pIHtcbiAgICAgICAgICAgICAgY2FzZSBcIl1cIjpcbiAgICAgICAgICAgICAgICAvLyBFbmQgb2YgYXJyYXkuXG4gICAgICAgICAgICAgICAgYnJlYWsgbnVtYmVyRm9yTG9vcDtcbiAgICAgICAgICAgICAgY2FzZSBcIlxcblwiOlxuICAgICAgICAgICAgICAgIGxhc3ROZXdsaW5lID0gY2h1bmtQb3NpdGlvbjtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgYXJyYXlFbmRlZCA9IGNodW5rUG9zaXRpb24gIT09IGNodW5rTGVuO1xuICAgICAgICAgIC8vIFtzdGFydCwgZW5kKSBpcyBlaXRoZXI6XG4gICAgICAgICAgLy8gLSBcIlwiIGlmIHRoZSBhcnJheSBpcyB6ZXJvLWxlbmd0aCxcbiAgICAgICAgICAvLyAtIFwiOSwzLDQsNVxcbiwxLDIsM1tldGNdXCIgaWYgdGhpcyBpcyB0aGUgc3RhcnQgb2YgdGhlIGFycmF5LFxuICAgICAgICAgIC8vIC0gXCIsMSwyLDMsNFwiIGlmIHRoaXMgaXMgdGhlIG1pZGRsZSBvZiB0aGUgYXJyYXlcbiAgICAgICAgICAvLyBJdCBkb2VzIG5vdCBjb250YWluIHRoZSBcIl1cIiBjaGFyYWN0ZXIuXG4gICAgICAgICAgY29uc3QgZW5kID0gYXJyYXlFbmRlZCA/IGNodW5rUG9zaXRpb24gOiBsYXN0TmV3bGluZTtcbiAgICAgICAgICBpZiAoc3RhcnQgIT09IGVuZCkge1xuICAgICAgICAgICAgY29uc3QgYmVnaW5uaW5nQ29tbWEgPSBjaHVua1tzdGFydF0gPT09IFwiLFwiO1xuICAgICAgICAgICAgY29uc3QgbnVtYmVyQ2h1bmsgPSBjaHVuay5zbGljZShiZWdpbm5pbmdDb21tYSA/IHN0YXJ0ICsgMSA6IHN0YXJ0LCBlbmQpO1xuICAgICAgICAgICAgY29uc3QgbnVtYmVyczogbnVtYmVyW10gPSBKU09OLnBhcnNlKGBbJHtudW1iZXJDaHVua31dYCk7XG4gICAgICAgICAgICBzd2l0Y2ggKHRoaXMuX2FjdGl2ZVByb3BlcnR5KSB7XG4gICAgICAgICAgICAgIGNhc2UgXCJub2Rlc1wiOlxuICAgICAgICAgICAgICAgIHRoaXMuX3BlbmRpbmdFdmVudHMucHVzaCh7XG4gICAgICAgICAgICAgICAgICB0eXBlOiBEYXRhVHlwZXMuTk9ERVMsXG4gICAgICAgICAgICAgICAgICBkYXRhOiBudW1iZXJzXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgXCJlZGdlc1wiOlxuICAgICAgICAgICAgICAgIHRoaXMuX3BlbmRpbmdFdmVudHMucHVzaCh7XG4gICAgICAgICAgICAgICAgICB0eXBlOiBEYXRhVHlwZXMuRURHRVMsXG4gICAgICAgICAgICAgICAgICBkYXRhOiBudW1iZXJzXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGFycmF5RW5kZWQpIHtcbiAgICAgICAgICAgIC8vIFNraXAgXCJdXCIuXG4gICAgICAgICAgICBjaHVua1Bvc2l0aW9uKys7XG4gICAgICAgICAgICBzd2l0Y2ggKGNodW5rW2NodW5rUG9zaXRpb25dKSB7XG4gICAgICAgICAgICAgIGNhc2UgXCIsXCI6XG4gICAgICAgICAgICAgICAgdGhpcy5fc3RhdGUgPSBQYXJzZXJTdGF0ZS5BUlJBWV9QUk9QRVJUWV9CRUdJTjtcbiAgICAgICAgICAgICAgICAvLyBTa2lwICwgYW5kIFxcblxuICAgICAgICAgICAgICAgIGNodW5rUG9zaXRpb24gKz0gMjtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSBcIn1cIjpcbiAgICAgICAgICAgICAgICB0aGlzLl9zdGF0ZSA9IFBhcnNlclN0YXRlLkVORDtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICB0aGlzLl9yYWlzZUVycm9yKG5ldyBFcnJvcihgVW5yZWNvZ25pemVkIGVuZC1vZi1hcnJheSBjaGFyYWN0ZXI6ICR7Y2h1bmtbY2h1bmtQb3NpdGlvbl19YCkpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIFNraXAgXFxuXG4gICAgICAgICAgICBjaHVua1Bvc2l0aW9uID0gbGFzdE5ld2xpbmUgKyAxO1xuICAgICAgICAgICAgYnJlYWsgb3V0ZXJMb29wO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjYXNlIFBhcnNlclN0YXRlLlNUUklOR19BUlJBWToge1xuICAgICAgICAgIGNvbnN0IHN0YXJ0ID0gY2h1bmtQb3NpdGlvbjtcbiAgICAgICAgICBsZXQgZXNjYXBlZCA9IGZhbHNlO1xuICAgICAgICAgIGxldCBsYXN0U3RyaW5nRW5kaW5nID0gc3RhcnQ7XG4gICAgICAgICAgbGV0IGlzSW5TdHJpbmcgPSBmYWxzZTtcbiAgICAgICAgICAvLyBMb29rIGZvciB1bmVzY2FwZWQgXCJdXCIsIHdoaWNoIGVuZHMgdGhlIGFycmF5LlxuICAgICAgICAgIHN0cmluZ1doaWxlOlxuICAgICAgICAgIHdoaWxlIChjaHVua1Bvc2l0aW9uIDwgY2h1bmtMZW4pIHtcbiAgICAgICAgICAgIHN3aXRjaCAoY2h1bmtbY2h1bmtQb3NpdGlvbl0pIHtcbiAgICAgICAgICAgICAgY2FzZSAnXCInOlxuICAgICAgICAgICAgICAgIGlmICghZXNjYXBlZCkge1xuICAgICAgICAgICAgICAgICAgaXNJblN0cmluZyA9ICFpc0luU3RyaW5nO1xuICAgICAgICAgICAgICAgICAgaWYgKCFpc0luU3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgIGxhc3RTdHJpbmdFbmRpbmcgPSBjaHVua1Bvc2l0aW9uO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlc2NhcGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgJ10nOlxuICAgICAgICAgICAgICAgIGlmICghaXNJblN0cmluZykge1xuICAgICAgICAgICAgICAgICAgYnJlYWsgc3RyaW5nV2hpbGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVzY2FwZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSAnXFxcXCc6XG4gICAgICAgICAgICAgICAgLy8gRmxpcCwgZm9yIHNlcXVlbmNlcyBvZiBcIlxcXCIgKGUuZy4gYW4gYWN0dWFsIFxcIGNoYXJhY3RlcilcbiAgICAgICAgICAgICAgICBlc2NhcGVkID0gIWVzY2FwZWQ7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgZXNjYXBlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2h1bmtQb3NpdGlvbisrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCBhcnJheUVuZGVkID0gY2h1bmtQb3NpdGlvbiAhPT0gY2h1bmtMZW47XG4gICAgICAgICAgLy8gW3N0YXJ0LCBlbmQpIGlzIGVpdGhlcjpcbiAgICAgICAgICAvLyAtIFwiXCIgaWYgdGhlIGFycmF5IGlzIHplcm8tbGVuZ3RoLFxuICAgICAgICAgIC8vIC0gXCI5LDMsNCw1XFxuLDEsMiwzW2V0Y11cIiBpZiB0aGlzIGlzIHRoZSBzdGFydCBvZiB0aGUgYXJyYXksXG4gICAgICAgICAgLy8gLSBcIiwxLDIsMyw0XCIgaWYgdGhpcyBpcyB0aGUgbWlkZGxlIG9mIHRoZSBhcnJheVxuICAgICAgICAgIC8vIEl0IGRvZXMgbm90IGNvbnRhaW4gdGhlIFwiXVwiIGNoYXJhY3Rlci5cbiAgICAgICAgICBjb25zdCBlbmQgPSBhcnJheUVuZGVkID8gY2h1bmtQb3NpdGlvbiA6IGxhc3RTdHJpbmdFbmRpbmcgKyAxO1xuICAgICAgICAgIGlmIChzdGFydCAhPT0gZW5kKSB7XG4gICAgICAgICAgICBjb25zdCBiZWdpbm5pbmdDb21tYSA9IGNodW5rW3N0YXJ0XSA9PT0gXCIsXCI7XG4gICAgICAgICAgICBjb25zdCBzdHJpbmdDaHVuayA9IGNodW5rLnNsaWNlKGJlZ2lubmluZ0NvbW1hID8gc3RhcnQgKyAxIDogc3RhcnQsIGVuZCk7XG4gICAgICAgICAgICBjb25zdCBzdHJpbmdzOiBzdHJpbmdbXSA9IEpTT04ucGFyc2UoYFske3N0cmluZ0NodW5rfV1gKTtcbiAgICAgICAgICAgIHRoaXMuX3BlbmRpbmdFdmVudHMucHVzaCh7XG4gICAgICAgICAgICAgIHR5cGU6IERhdGFUeXBlcy5TVFJJTkdTLFxuICAgICAgICAgICAgICBkYXRhOiBzdHJpbmdzXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGFycmF5RW5kZWQpIHtcbiAgICAgICAgICAgIC8vIFNraXAgXCJdXCIuXG4gICAgICAgICAgICBjaHVua1Bvc2l0aW9uKys7XG4gICAgICAgICAgICBzd2l0Y2ggKGNodW5rW2NodW5rUG9zaXRpb25dKSB7XG4gICAgICAgICAgICAgIGNhc2UgXCIsXCI6XG4gICAgICAgICAgICAgICAgdGhpcy5fc3RhdGUgPSBQYXJzZXJTdGF0ZS5BUlJBWV9QUk9QRVJUWV9CRUdJTjtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSBcIn1cIjpcbiAgICAgICAgICAgICAgICB0aGlzLl9zdGF0ZSA9IFBhcnNlclN0YXRlLkVORDtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICB0aGlzLl9yYWlzZUVycm9yKG5ldyBFcnJvcihgVW5yZWNvZ25pemVkIGVuZC1vZi1hcnJheSBjaGFyYWN0ZXI6ICR7Y2h1bmtbY2h1bmtQb3NpdGlvbl19YCkpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjaHVua1Bvc2l0aW9uID0gbGFzdFN0cmluZ0VuZGluZyArIDE7XG4gICAgICAgICAgICBicmVhayBvdXRlckxvb3A7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgUGFyc2VyU3RhdGUuRU5EOlxuICAgICAgICAgIGlmIChjaHVua1tjaHVua1Bvc2l0aW9uXSAhPT0gJ30nKSB7XG4gICAgICAgICAgICB0aGlzLl9yYWlzZUVycm9yKG5ldyBFcnJvcihgVW5leHBlY3RlZCBlbmQgb2Ygc25hcHNob3Q6ICR7Y2h1bmtbY2h1bmtQb3NpdGlvbl19YCkpO1xuICAgICAgICAgICAgYnJlYWsgb3V0ZXJMb29wO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjaHVua1Bvc2l0aW9uKys7XG4gICAgICAgICAgdGhpcy5fcGVuZGluZ0V2ZW50cy5wdXNoKG51bGwpO1xuICAgICAgICAgIGJyZWFrIG91dGVyTG9vcDtcbiAgICAgICAgY2FzZSBQYXJzZXJTdGF0ZS5FUlJPUjpcbiAgICAgICAgICBicmVhayBvdXRlckxvb3A7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgdGhpcy5fcmFpc2VFcnJvcihuZXcgRXJyb3IoYEludmFsaWQgc3RhdGU6ICR7dGhpcy5fc3RhdGV9YCkpO1xuICAgICAgICAgIGJyZWFrIG91dGVyTG9vcDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoY2h1bmtQb3NpdGlvbiA8IGNodW5rTGVuICYmIHRoaXMuX3N0YXRlICE9PSBQYXJzZXJTdGF0ZS5TVFJJTkdfQVJSQVkgJiYgdGhpcy5fc3RhdGUgIT09IFBhcnNlclN0YXRlLk5VTUJFUl9BUlJBWSAmJiAhdGhpcy5oYXNFcnJvcmVkKCkpIHtcbiAgICAgIHRoaXMuX3JhaXNlRXJyb3IobmV3IEVycm9yKGBQYXJzaW5nIGVycm9yOiBEaWQgbm90IGNvbnN1bWUgd2hvbGUgY2h1bmshYCkpO1xuICAgIH1cblxuICAgIGlmIChjaHVua1Bvc2l0aW9uIDwgY2h1bmtMZW4pIHtcbiAgICAgIHRoaXMuX2J1ZmZlciA9IGNodW5rLnNsaWNlKGNodW5rUG9zaXRpb24pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9idWZmZXIgPSBcIlwiO1xuICAgIH1cblxuICAgIHRoaXMuX3Byb2Nlc3NQZW5kaW5nUHJvbWlzZXMoKTtcbiAgfVxuXG4gIHByaXZhdGUgX3Byb2Nlc3NQZW5kaW5nUHJvbWlzZXMoKTogdm9pZCB7XG4gICAgY29uc3QgaGFzRXJyb3JlZCA9IHRoaXMuaGFzRXJyb3JlZCgpO1xuICAgIHdoaWxlICghaGFzRXJyb3JlZCAmJiB0aGlzLl9wZW5kaW5nUmVhZHMubGVuZ3RoID4gMCAmJiB0aGlzLl9wZW5kaW5nRXZlbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgIHRoaXMuX3BlbmRpbmdSZWFkcy5zaGlmdCgpLnJlc29sdmUodGhpcy5fcGVuZGluZ0V2ZW50cy5zaGlmdCgpKTtcbiAgICB9XG5cbiAgICBpZiAoaGFzRXJyb3JlZCkge1xuICAgICAgZm9yIChjb25zdCBwcm9taXNlIG9mIHRoaXMuX3BlbmRpbmdSZWFkcykge1xuICAgICAgICBwcm9taXNlLnJlamVjdCh0aGlzLl9lcnJvcik7XG4gICAgICB9XG4gICAgICB0aGlzLl9wZW5kaW5nUmVhZHMgPSBbXTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuX3BlbmRpbmdFdmVudHMubGVuZ3RoID09PSAwICYmIHRoaXMuX3N0YXRlID09PSBQYXJzZXJTdGF0ZS5FTkQpIHtcbiAgICAgIGZvciAoY29uc3QgcHJvbWlzZSBvZiB0aGlzLl9wZW5kaW5nUmVhZHMpIHtcbiAgICAgICAgcHJvbWlzZS5yZXNvbHZlKG51bGwpO1xuICAgICAgfVxuICAgICAgdGhpcy5fcGVuZGluZ1JlYWRzID0gW107XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfcmFpc2VFcnJvcihlOiBFcnJvcik6IHZvaWQge1xuICAgIHRoaXMuX2Vycm9yID0gZTtcbiAgICB0aGlzLl9zdGF0ZSA9IFBhcnNlclN0YXRlLkVSUk9SO1xuICAgIHRoaXMuX3Byb2Nlc3NQZW5kaW5nUHJvbWlzZXMoKTtcbiAgfVxuXG4gIHB1YmxpYyBoYXNFcnJvcmVkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9zdGF0ZSA9PT0gUGFyc2VyU3RhdGUuRVJST1I7XG4gIH1cblxuICBwdWJsaWMgcmVhZCgpOiBQcm9taXNlPFBhcnNlckV2ZW50PiB7XG4gICAgaWYgKHRoaXMuX3BlbmRpbmdFdmVudHMubGVuZ3RoID4gMCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLl9wZW5kaW5nRXZlbnRzLnNoaWZ0KCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2U8UGFyc2VyRXZlbnQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5fcGVuZGluZ1JlYWRzLnB1c2goe3Jlc29sdmUsIHJlamVjdH0pO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG59Il19