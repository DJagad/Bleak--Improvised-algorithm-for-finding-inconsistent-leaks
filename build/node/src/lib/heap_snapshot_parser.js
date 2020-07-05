"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SNAPSHOT_PROP_NAME = `{"snapshot":`;
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
class HeapSnapshotParser {
    constructor() {
        this._state = 1 /* SNAPSHOT_LINE */;
        this._error = null;
        this._activeProperty = null;
        this._pendingEvents = [];
        this._pendingReads = [];
        this._buffer = "";
        this._onSnapshotChunk = onSnapshotChunk;
    }
    static FromString(data) {
        const rv = new HeapSnapshotParser();
        rv.addSnapshotChunk(data);
        return rv;
    }
    set onSnapshotChunk(v) {
        this._onSnapshotChunk = v;
    }
    /**
     * Adds another snapshot chunk to parse.
     * @param chunk
     */
    addSnapshotChunk(chunk) {
        this._buffer += chunk;
        this._parse();
        this._onSnapshotChunk(chunk, this._state === 5 /* END */);
    }
    _parse() {
        const chunk = this._buffer;
        const chunkLen = chunk.length;
        let chunkPosition = 0;
        outerLoop: while (!this.hasErrored() && chunkPosition < chunkLen) {
            switch (this._state) {
                case 1 /* SNAPSHOT_LINE */: {
                    // Expecting: {"snapshot":{[object here]},\n
                    const beginString = chunk.slice(chunkPosition, chunkPosition + SNAPSHOT_PROP_NAME.length);
                    if (beginString !== SNAPSHOT_PROP_NAME) {
                        this._raiseError(new Error(`Unable to find "snapshot" property in first chunk.`));
                        break outerLoop;
                    }
                    chunkPosition += SNAPSHOT_PROP_NAME.length;
                    let startIndex = chunkPosition;
                    let endingIndex = -1;
                    for (; chunkPosition < chunkLen; chunkPosition++) {
                        if (chunk[chunkPosition] === "\n") {
                            // - 1 to cut off the comma
                            endingIndex = chunkPosition - 1;
                            chunkPosition++;
                            break;
                        }
                    }
                    if (endingIndex === -1) {
                        this._raiseError(new Error(`Unable to find whole "snapshot" object in first snapshot chunk.`));
                        break outerLoop;
                    }
                    try {
                        const snapshot = JSON.parse(chunk.slice(startIndex, endingIndex));
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
                    const start = chunkPosition;
                    for (; chunkPosition < chunk.length && chunk[chunkPosition] !== "["; chunkPosition++) {
                        // Wait.
                    }
                    if (chunkPosition >= chunk.length) {
                        this._raiseError(new Error(`Unable to locate the beginning of a property.`));
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
                    const start = chunkPosition;
                    let lastNewline = start;
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
                    const arrayEnded = chunkPosition !== chunkLen;
                    // [start, end) is either:
                    // - "" if the array is zero-length,
                    // - "9,3,4,5\n,1,2,3[etc]" if this is the start of the array,
                    // - ",1,2,3,4" if this is the middle of the array
                    // It does not contain the "]" character.
                    const end = arrayEnded ? chunkPosition : lastNewline;
                    if (start !== end) {
                        const beginningComma = chunk[start] === ",";
                        const numberChunk = chunk.slice(beginningComma ? start + 1 : start, end);
                        const numbers = JSON.parse(`[${numberChunk}]`);
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
                                this._raiseError(new Error(`Unrecognized end-of-array character: ${chunk[chunkPosition]}`));
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
                    const start = chunkPosition;
                    let escaped = false;
                    let lastStringEnding = start;
                    let isInString = false;
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
                    const arrayEnded = chunkPosition !== chunkLen;
                    // [start, end) is either:
                    // - "" if the array is zero-length,
                    // - "9,3,4,5\n,1,2,3[etc]" if this is the start of the array,
                    // - ",1,2,3,4" if this is the middle of the array
                    // It does not contain the "]" character.
                    const end = arrayEnded ? chunkPosition : lastStringEnding + 1;
                    if (start !== end) {
                        const beginningComma = chunk[start] === ",";
                        const stringChunk = chunk.slice(beginningComma ? start + 1 : start, end);
                        const strings = JSON.parse(`[${stringChunk}]`);
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
                                this._raiseError(new Error(`Unrecognized end-of-array character: ${chunk[chunkPosition]}`));
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
                        this._raiseError(new Error(`Unexpected end of snapshot: ${chunk[chunkPosition]}`));
                        break outerLoop;
                    }
                    chunkPosition++;
                    this._pendingEvents.push(null);
                    break outerLoop;
                case 0 /* ERROR */:
                    break outerLoop;
                default:
                    this._raiseError(new Error(`Invalid state: ${this._state}`));
                    break outerLoop;
            }
        }
        if (chunkPosition < chunkLen && this._state !== 4 /* STRING_ARRAY */ && this._state !== 3 /* NUMBER_ARRAY */ && !this.hasErrored()) {
            this._raiseError(new Error(`Parsing error: Did not consume whole chunk!`));
        }
        if (chunkPosition < chunkLen) {
            this._buffer = chunk.slice(chunkPosition);
        }
        else {
            this._buffer = "";
        }
        this._processPendingPromises();
    }
    _processPendingPromises() {
        const hasErrored = this.hasErrored();
        while (!hasErrored && this._pendingReads.length > 0 && this._pendingEvents.length > 0) {
            this._pendingReads.shift().resolve(this._pendingEvents.shift());
        }
        if (hasErrored) {
            for (const promise of this._pendingReads) {
                promise.reject(this._error);
            }
            this._pendingReads = [];
        }
        else if (this._pendingEvents.length === 0 && this._state === 5 /* END */) {
            for (const promise of this._pendingReads) {
                promise.resolve(null);
            }
            this._pendingReads = [];
        }
    }
    _raiseError(e) {
        this._error = e;
        this._state = 0 /* ERROR */;
        this._processPendingPromises();
    }
    hasErrored() {
        return this._state === 0 /* ERROR */;
    }
    read() {
        if (this._pendingEvents.length > 0) {
            return Promise.resolve(this._pendingEvents.shift());
        }
        else {
            return new Promise((resolve, reject) => {
                this._pendingReads.push({ resolve, reject });
            });
        }
    }
}
exports.default = HeapSnapshotParser;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGVhcF9zbmFwc2hvdF9wYXJzZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvbGliL2hlYXBfc25hcHNob3RfcGFyc2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBeUNBLE1BQU0sa0JBQWtCLEdBQUcsY0FBYyxDQUFDO0FBRTFDO0FBRUEsQ0FBQztBQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBc0JHO0FBQ0g7SUFBQTtRQU9VLFdBQU0seUJBQTBDO1FBQ2hELFdBQU0sR0FBVSxJQUFJLENBQUM7UUFDckIsb0JBQWUsR0FBVyxJQUFJLENBQUM7UUFDL0IsbUJBQWMsR0FBa0IsRUFBRSxDQUFDO1FBQ25DLGtCQUFhLEdBQXdFLEVBQUUsQ0FBQztRQUN4RixZQUFPLEdBQVcsRUFBRSxDQUFDO1FBRXJCLHFCQUFnQixHQUEwQyxlQUFlLENBQUM7SUE0UnBGLENBQUM7SUF6U1EsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFZO1FBQ25DLE1BQU0sRUFBRSxHQUFHLElBQUksa0JBQWtCLEVBQUUsQ0FBQztRQUNwQyxFQUFFLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDMUIsTUFBTSxDQUFDLEVBQUUsQ0FBQztJQUNaLENBQUM7SUFVRCxJQUFXLGVBQWUsQ0FBQyxDQUF3QztRQUNqRSxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDO0lBQzVCLENBQUM7SUFFRDs7O09BR0c7SUFDSSxnQkFBZ0IsQ0FBQyxLQUFhO1FBQ25DLElBQUksQ0FBQyxPQUFPLElBQUksS0FBSyxDQUFDO1FBQ3RCLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNkLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLE1BQU0sZ0JBQW9CLENBQUMsQ0FBQztJQUNoRSxDQUFDO0lBRU8sTUFBTTtRQUNaLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7UUFDM0IsTUFBTSxR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QUFvQixDQUFDLENBQUMsQ0FBQztZQUMvRSxHQUFHLENBQUMsQ0FBQyxNQUFNLE9BQU8sSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztnQkFDekMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN4QixDQUFDO1lBQ0QsSUFBSSxDQUFDLGFBQWEsR0FBRyxFQUFFLENBQUM7UUFDMUIsQ0FBQztJQUNILENBQUM7SUFFTyxXQUFXLENBQUMsQ0FBUTtRQUMxQixJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztRQUNoQixJQUFJLENBQUMsTUFBTSxnQkFBb0IsQ0FBQztRQUNoQyxJQUFJLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztJQUNqQyxDQUFDO0lBRU0sVUFBVTtRQUNmLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxrQkFBc0IsQ0FBQztJQUMzQyxDQUFDO0lBRU0sSUFBSTtRQUNULEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbkMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBQ3RELENBQUM7UUFBQyxJQUFJLENBQUMsQ0FBQztZQUNOLE1BQU0sQ0FBQyxJQUFJLE9BQU8sQ0FBYyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtnQkFDbEQsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsRUFBQyxPQUFPLEVBQUUsTUFBTSxFQUFDLENBQUMsQ0FBQztZQUM3QyxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7SUFDSCxDQUFDO0NBQ0Y7QUExU0QscUNBMFNDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtIZWFwU25hcHNob3RDb250ZW50c30gZnJvbSAnLi4vY29tbW9uL2ludGVyZmFjZXMnO1xuXG5jb25zdCBlbnVtIFBhcnNlclN0YXRlIHtcbiAgLy8gVGhlIHBhcnNlciBoYXMgZW5jb3VudGVyZWQgYW4gZXJyb3IgYW5kIGNhbiBubyBsb25nZXIgcHJvY2VlZC5cbiAgRVJST1IgPSAwLFxuICAvLyBTcGVjaWFsIG1vZGUgZm9yIHRoZSBzbmFwc2hvdCBsaW5lLlxuICBTTkFQU0hPVF9MSU5FLFxuICAvLyBXYWl0aW5nIGZvciB0aGUgYmVnaW5uaW5nIG9mIGFuIGFycmF5IHByb3BlcnR5LCBlLmcuIFwiZmllbGRcIjpbXG4gIEFSUkFZX1BST1BFUlRZX0JFR0lOLFxuICAvLyBXYWl0aW5nIGZvciBtb3JlIG51bWJlcnMgaW4gYW4gYXJyYXkgcHJvcGVydHksIG9yIHRoZSBlbmQgb2YgdGhlIGFycmF5IHByb3BlcnR5LlxuICBOVU1CRVJfQVJSQVksXG4gIC8vIFdhaXRpbmcgZm9yIG1vcmUgc3RyaW5ncyBpbiBhbiBhcnJheSBwcm9wZXJ0eS5cbiAgU1RSSU5HX0FSUkFZLFxuICAvLyBXYWl0aW5nIGZvciBlbmQgb2Ygc25hcHNob3QuXG4gIEVORFxufVxuXG5leHBvcnQgY29uc3QgZW51bSBEYXRhVHlwZXMge1xuICBTTkFQU0hPVCA9IDEsXG4gIE5PREVTID0gMixcbiAgRURHRVMgPSAzLFxuICBTVFJJTkdTID0gNFxufVxuXG50eXBlIFBhcnNlckV2ZW50ID0gU25hcHNob3RFdmVudCB8IE51bWJlcnNFdmVudCB8IFN0cmluZ3NFdmVudDtcblxuaW50ZXJmYWNlIFNuYXBzaG90RXZlbnQge1xuICB0eXBlOiBEYXRhVHlwZXMuU05BUFNIT1Q7XG4gIGRhdGE6IEhlYXBTbmFwc2hvdENvbnRlbnRzO1xufVxuXG5pbnRlcmZhY2UgTnVtYmVyc0V2ZW50IHtcbiAgdHlwZTogRGF0YVR5cGVzLk5PREVTIHwgRGF0YVR5cGVzLkVER0VTO1xuICBkYXRhOiBudW1iZXJbXTtcbn1cblxuaW50ZXJmYWNlIFN0cmluZ3NFdmVudCB7XG4gIHR5cGU6IERhdGFUeXBlcy5TVFJJTkdTO1xuICBkYXRhOiBzdHJpbmdbXTtcbn1cblxuY29uc3QgU05BUFNIT1RfUFJPUF9OQU1FID0gYHtcInNuYXBzaG90XCI6YDtcblxuZnVuY3Rpb24gb25TbmFwc2hvdENodW5rKCkge1xuXG59XG5cbi8qKlxuICogU3RyZWFtaW5nIHBhcnNlciBmb3IgaGVhcCBzbmFwc2hvdHMuXG4gKlxuICogSGVyZSdzIGhvdyB0aGUgc25hcHNob3QgaXMgc3RyZWFtZWQgZnJvbSBDaHJvbWUgKG5ld2xpbmVzIGluY2x1ZGVkISk6XG4gKlxuICoge1wic25hcHNob3RcIjp7XCJtZXRhXCI6e1wibm9kZV9maWVsZHNcIjpbXCJ0eXBlXCIsXCJuYW1lXCIsXCJpZFwiLFwic2VsZl9zaXplXCIsXCJlZGdlX2NvdW50XCIsXCJ0cmFjZV9ub2RlX2lkXCJdLFwibm9kZV90eXBlc1wiOltbXCJoaWRkZW5cIixcImFycmF5XCIsXCJzdHJpbmdcIixcIm9iamVjdFwiLFwiY29kZVwiLFwiY2xvc3VyZVwiLFwicmVnZXhwXCIsXCJudW1iZXJcIixcIm5hdGl2ZVwiLFwic3ludGhldGljXCIsXCJjb25jYXRlbmF0ZWQgc3RyaW5nXCIsXCJzbGljZWQgc3RyaW5nXCJdLFwic3RyaW5nXCIsXCJudW1iZXJcIixcIm51bWJlclwiLFwibnVtYmVyXCIsXCJudW1iZXJcIixcIm51bWJlclwiXSxcImVkZ2VfZmllbGRzXCI6W1widHlwZVwiLFwibmFtZV9vcl9pbmRleFwiLFwidG9fbm9kZVwiXSxcImVkZ2VfdHlwZXNcIjpbW1wiY29udGV4dFwiLFwiZWxlbWVudFwiLFwicHJvcGVydHlcIixcImludGVybmFsXCIsXCJoaWRkZW5cIixcInNob3J0Y3V0XCIsXCJ3ZWFrXCJdLFwic3RyaW5nX29yX251bWJlclwiLFwibm9kZVwiXSxcInRyYWNlX2Z1bmN0aW9uX2luZm9fZmllbGRzXCI6W1wiZnVuY3Rpb25faWRcIixcIm5hbWVcIixcInNjcmlwdF9uYW1lXCIsXCJzY3JpcHRfaWRcIixcImxpbmVcIixcImNvbHVtblwiXSxcInRyYWNlX25vZGVfZmllbGRzXCI6W1wiaWRcIixcImZ1bmN0aW9uX2luZm9faW5kZXhcIixcImNvdW50XCIsXCJzaXplXCIsXCJjaGlsZHJlblwiXSxcInNhbXBsZV9maWVsZHNcIjpbXCJ0aW1lc3RhbXBfdXNcIixcImxhc3RfYXNzaWduZWRfaWRcIl19LFwibm9kZV9jb3VudFwiOjkzMTgzNSxcImVkZ2VfY291bnRcIjo0NzEzMjA5LFwidHJhY2VfZnVuY3Rpb25fY291bnRcIjowfSxcbiAqIFwibm9kZXNcIjpbOSwxLDEsMCw2LDBcbiAqICw5LDIsMywwLDE3LDBcbiAqIFtldGNdXG4gKiBdLFxuICogXCJlZGdlc1wiOlsxLDEsNlxuICogLDEsMSwyMjgyNFxuICogW2V0Y11cbiAqIF0sXG4gKiBcInRyYWNlX2Z1bmN0aW9uX2luZm9zXCI6W10sXG4gKiBcInRyYWNlX3RyZWVcIjpbXSxcbiAqIFwic2FtcGxlc1wiOltdLFxuICogXCJzdHJpbmdzXCI6W1wiPGR1bW15PlwiLFxuICogXCJbc3RyaW5nIHZhbHVlLCB3aGljaCBtYXkgaGF2ZSBuZXdsaW5lcyEgXFwgaXMgZXNjYXBlIGNoYXJhY3Rlcl1cIixcbiAqIFwiOTgyNzJcIl19XG4gKlxuICogVGhlIHBhcnNlciBhc3N1bWVzIHRoZSBzbmFwc2hvdCBpcyBpbiB0aGlzIGZvcm1hdCwgYW5kIHRoYXQgdGhlIGZpcnN0IGNodW5rIGNvbnRhaW5zIHRoZSBlbnRpcmUgXCJzbmFwc2hvdFwiIHByb3BlcnR5LlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBIZWFwU25hcHNob3RQYXJzZXIge1xuICBwdWJsaWMgc3RhdGljIEZyb21TdHJpbmcoZGF0YTogc3RyaW5nKTogSGVhcFNuYXBzaG90UGFyc2VyIHtcbiAgICBjb25zdCBydiA9IG5ldyBIZWFwU25hcHNob3RQYXJzZXIoKTtcbiAgICBydi5hZGRTbmFwc2hvdENodW5rKGRhdGEpO1xuICAgIHJldHVybiBydjtcbiAgfVxuXG4gIHByaXZhdGUgX3N0YXRlOiBQYXJzZXJTdGF0ZSA9IFBhcnNlclN0YXRlLlNOQVBTSE9UX0xJTkU7XG4gIHByaXZhdGUgX2Vycm9yOiBFcnJvciA9IG51bGw7XG4gIHByaXZhdGUgX2FjdGl2ZVByb3BlcnR5OiBzdHJpbmcgPSBudWxsO1xuICBwcml2YXRlIF9wZW5kaW5nRXZlbnRzOiBQYXJzZXJFdmVudFtdID0gW107XG4gIHByaXZhdGUgX3BlbmRpbmdSZWFkczogeyByZXNvbHZlOiAoZTogUGFyc2VyRXZlbnQpID0+IHZvaWQsIHJlamVjdDogKGU6IEVycm9yKSA9PiB2b2lkIH1bXSA9IFtdO1xuICBwcml2YXRlIF9idWZmZXI6IHN0cmluZyA9IFwiXCI7XG5cbiAgcHJpdmF0ZSBfb25TbmFwc2hvdENodW5rOiAoY2h1bms6IHN0cmluZywgZW5kOiBib29sZWFuKSA9PiB2b2lkID0gb25TbmFwc2hvdENodW5rO1xuICBwdWJsaWMgc2V0IG9uU25hcHNob3RDaHVuayh2OiAoY2h1bms6IHN0cmluZywgZW5kOiBib29sZWFuKSA9PiB2b2lkKSB7XG4gICAgdGhpcy5fb25TbmFwc2hvdENodW5rID0gdjtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGFub3RoZXIgc25hcHNob3QgY2h1bmsgdG8gcGFyc2UuXG4gICAqIEBwYXJhbSBjaHVua1xuICAgKi9cbiAgcHVibGljIGFkZFNuYXBzaG90Q2h1bmsoY2h1bms6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMuX2J1ZmZlciArPSBjaHVuaztcbiAgICB0aGlzLl9wYXJzZSgpO1xuICAgIHRoaXMuX29uU25hcHNob3RDaHVuayhjaHVuaywgdGhpcy5fc3RhdGUgPT09IFBhcnNlclN0YXRlLkVORCk7XG4gIH1cblxuICBwcml2YXRlIF9wYXJzZSgpOiB2b2lkIHtcbiAgICBjb25zdCBjaHVuayA9IHRoaXMuX2J1ZmZlcjtcbiAgICBjb25zdCBjaHVua0xlbiA9IGNodW5rLmxlbmd0aDtcbiAgICBsZXQgY2h1bmtQb3NpdGlvbiA9IDA7XG5cbiAgICBvdXRlckxvb3A6XG4gICAgd2hpbGUgKCF0aGlzLmhhc0Vycm9yZWQoKSAmJiBjaHVua1Bvc2l0aW9uIDwgY2h1bmtMZW4pIHtcbiAgICAgIHN3aXRjaCAodGhpcy5fc3RhdGUpIHtcbiAgICAgICAgY2FzZSBQYXJzZXJTdGF0ZS5TTkFQU0hPVF9MSU5FOiB7XG4gICAgICAgICAgLy8gRXhwZWN0aW5nOiB7XCJzbmFwc2hvdFwiOntbb2JqZWN0IGhlcmVdfSxcXG5cbiAgICAgICAgICBjb25zdCBiZWdpblN0cmluZyA9IGNodW5rLnNsaWNlKGNodW5rUG9zaXRpb24sIGNodW5rUG9zaXRpb24gKyBTTkFQU0hPVF9QUk9QX05BTUUubGVuZ3RoKTtcbiAgICAgICAgICBpZiAoYmVnaW5TdHJpbmcgIT09IFNOQVBTSE9UX1BST1BfTkFNRSkge1xuICAgICAgICAgICAgdGhpcy5fcmFpc2VFcnJvcihuZXcgRXJyb3IoYFVuYWJsZSB0byBmaW5kIFwic25hcHNob3RcIiBwcm9wZXJ0eSBpbiBmaXJzdCBjaHVuay5gKSk7XG4gICAgICAgICAgICBicmVhayBvdXRlckxvb3A7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNodW5rUG9zaXRpb24gKz0gU05BUFNIT1RfUFJPUF9OQU1FLmxlbmd0aDtcblxuICAgICAgICAgIGxldCBzdGFydEluZGV4ID0gY2h1bmtQb3NpdGlvbjtcbiAgICAgICAgICBsZXQgZW5kaW5nSW5kZXggPSAtMTtcbiAgICAgICAgICBmb3IgKDsgY2h1bmtQb3NpdGlvbiA8IGNodW5rTGVuOyBjaHVua1Bvc2l0aW9uKyspIHtcbiAgICAgICAgICAgIGlmIChjaHVua1tjaHVua1Bvc2l0aW9uXSA9PT0gXCJcXG5cIikge1xuICAgICAgICAgICAgICAvLyAtIDEgdG8gY3V0IG9mZiB0aGUgY29tbWFcbiAgICAgICAgICAgICAgZW5kaW5nSW5kZXggPSBjaHVua1Bvc2l0aW9uIC0gMTtcbiAgICAgICAgICAgICAgY2h1bmtQb3NpdGlvbisrO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGVuZGluZ0luZGV4ID09PSAtMSkge1xuICAgICAgICAgICAgdGhpcy5fcmFpc2VFcnJvcihuZXcgRXJyb3IoYFVuYWJsZSB0byBmaW5kIHdob2xlIFwic25hcHNob3RcIiBvYmplY3QgaW4gZmlyc3Qgc25hcHNob3QgY2h1bmsuYCkpO1xuICAgICAgICAgICAgYnJlYWsgb3V0ZXJMb29wO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBzbmFwc2hvdDogSGVhcFNuYXBzaG90Q29udGVudHMgPSBKU09OLnBhcnNlKGNodW5rLnNsaWNlKHN0YXJ0SW5kZXgsIGVuZGluZ0luZGV4KSk7XG4gICAgICAgICAgICB0aGlzLl9wZW5kaW5nRXZlbnRzLnB1c2goe1xuICAgICAgICAgICAgICB0eXBlOiBEYXRhVHlwZXMuU05BUFNIT1QsXG4gICAgICAgICAgICAgIGRhdGE6IHNuYXBzaG90XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMuX3N0YXRlID0gUGFyc2VyU3RhdGUuQVJSQVlfUFJPUEVSVFlfQkVHSU47XG4gICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgdGhpcy5fcmFpc2VFcnJvcihlKTtcbiAgICAgICAgICAgIGJyZWFrIG91dGVyTG9vcDtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBQYXJzZXJTdGF0ZS5BUlJBWV9QUk9QRVJUWV9CRUdJTjoge1xuICAgICAgICAgIGNvbnN0IHN0YXJ0ID0gY2h1bmtQb3NpdGlvbjtcbiAgICAgICAgICBmb3IgKDsgY2h1bmtQb3NpdGlvbiA8IGNodW5rLmxlbmd0aCAmJiBjaHVua1tjaHVua1Bvc2l0aW9uXSAhPT0gXCJbXCI7IGNodW5rUG9zaXRpb24rKykge1xuICAgICAgICAgICAgLy8gV2FpdC5cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoY2h1bmtQb3NpdGlvbiA+PSBjaHVuay5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRoaXMuX3JhaXNlRXJyb3IobmV3IEVycm9yKGBVbmFibGUgdG8gbG9jYXRlIHRoZSBiZWdpbm5pbmcgb2YgYSBwcm9wZXJ0eS5gKSk7XG4gICAgICAgICAgICBicmVhayBvdXRlckxvb3A7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIFNraXAgb3ZlciBcIltcIi5cbiAgICAgICAgICBjaHVua1Bvc2l0aW9uKys7XG5cbiAgICAgICAgICAvLyBbc3RhcnQsIGNodW5rUG9zaXRpb24pIHNob3VsZCBiZSBzdHJpbmcgYFwicHJvcG5hbWVcIjpbYFxuICAgICAgICAgIHRoaXMuX2FjdGl2ZVByb3BlcnR5ID0gY2h1bmsuc2xpY2Uoc3RhcnQgKyAxLCBjaHVua1Bvc2l0aW9uIC0gMyk7XG5cbiAgICAgICAgICBpZiAodGhpcy5fYWN0aXZlUHJvcGVydHkgPT09IFwic3RyaW5nc1wiKSB7XG4gICAgICAgICAgICB0aGlzLl9zdGF0ZSA9IFBhcnNlclN0YXRlLlNUUklOR19BUlJBWTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fc3RhdGUgPSBQYXJzZXJTdGF0ZS5OVU1CRVJfQVJSQVk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgUGFyc2VyU3RhdGUuTlVNQkVSX0FSUkFZOiB7XG4gICAgICAgICAgY29uc3Qgc3RhcnQgPSBjaHVua1Bvc2l0aW9uO1xuICAgICAgICAgIGxldCBsYXN0TmV3bGluZSA9IHN0YXJ0O1xuICAgICAgICAgIG51bWJlckZvckxvb3A6XG4gICAgICAgICAgZm9yICg7IGNodW5rUG9zaXRpb24gPCBjaHVua0xlbjsgY2h1bmtQb3NpdGlvbisrKSB7XG4gICAgICAgICAgICBzd2l0Y2ggKGNodW5rW2NodW5rUG9zaXRpb25dKSB7XG4gICAgICAgICAgICAgIGNhc2UgXCJdXCI6XG4gICAgICAgICAgICAgICAgLy8gRW5kIG9mIGFycmF5LlxuICAgICAgICAgICAgICAgIGJyZWFrIG51bWJlckZvckxvb3A7XG4gICAgICAgICAgICAgIGNhc2UgXCJcXG5cIjpcbiAgICAgICAgICAgICAgICBsYXN0TmV3bGluZSA9IGNodW5rUG9zaXRpb247XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IGFycmF5RW5kZWQgPSBjaHVua1Bvc2l0aW9uICE9PSBjaHVua0xlbjtcbiAgICAgICAgICAvLyBbc3RhcnQsIGVuZCkgaXMgZWl0aGVyOlxuICAgICAgICAgIC8vIC0gXCJcIiBpZiB0aGUgYXJyYXkgaXMgemVyby1sZW5ndGgsXG4gICAgICAgICAgLy8gLSBcIjksMyw0LDVcXG4sMSwyLDNbZXRjXVwiIGlmIHRoaXMgaXMgdGhlIHN0YXJ0IG9mIHRoZSBhcnJheSxcbiAgICAgICAgICAvLyAtIFwiLDEsMiwzLDRcIiBpZiB0aGlzIGlzIHRoZSBtaWRkbGUgb2YgdGhlIGFycmF5XG4gICAgICAgICAgLy8gSXQgZG9lcyBub3QgY29udGFpbiB0aGUgXCJdXCIgY2hhcmFjdGVyLlxuICAgICAgICAgIGNvbnN0IGVuZCA9IGFycmF5RW5kZWQgPyBjaHVua1Bvc2l0aW9uIDogbGFzdE5ld2xpbmU7XG4gICAgICAgICAgaWYgKHN0YXJ0ICE9PSBlbmQpIHtcbiAgICAgICAgICAgIGNvbnN0IGJlZ2lubmluZ0NvbW1hID0gY2h1bmtbc3RhcnRdID09PSBcIixcIjtcbiAgICAgICAgICAgIGNvbnN0IG51bWJlckNodW5rID0gY2h1bmsuc2xpY2UoYmVnaW5uaW5nQ29tbWEgPyBzdGFydCArIDEgOiBzdGFydCwgZW5kKTtcbiAgICAgICAgICAgIGNvbnN0IG51bWJlcnM6IG51bWJlcltdID0gSlNPTi5wYXJzZShgWyR7bnVtYmVyQ2h1bmt9XWApO1xuICAgICAgICAgICAgc3dpdGNoICh0aGlzLl9hY3RpdmVQcm9wZXJ0eSkge1xuICAgICAgICAgICAgICBjYXNlIFwibm9kZXNcIjpcbiAgICAgICAgICAgICAgICB0aGlzLl9wZW5kaW5nRXZlbnRzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgdHlwZTogRGF0YVR5cGVzLk5PREVTLFxuICAgICAgICAgICAgICAgICAgZGF0YTogbnVtYmVyc1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICBjYXNlIFwiZWRnZXNcIjpcbiAgICAgICAgICAgICAgICB0aGlzLl9wZW5kaW5nRXZlbnRzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgdHlwZTogRGF0YVR5cGVzLkVER0VTLFxuICAgICAgICAgICAgICAgICAgZGF0YTogbnVtYmVyc1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChhcnJheUVuZGVkKSB7XG4gICAgICAgICAgICAvLyBTa2lwIFwiXVwiLlxuICAgICAgICAgICAgY2h1bmtQb3NpdGlvbisrO1xuICAgICAgICAgICAgc3dpdGNoIChjaHVua1tjaHVua1Bvc2l0aW9uXSkge1xuICAgICAgICAgICAgICBjYXNlIFwiLFwiOlxuICAgICAgICAgICAgICAgIHRoaXMuX3N0YXRlID0gUGFyc2VyU3RhdGUuQVJSQVlfUFJPUEVSVFlfQkVHSU47XG4gICAgICAgICAgICAgICAgLy8gU2tpcCAsIGFuZCBcXG5cbiAgICAgICAgICAgICAgICBjaHVua1Bvc2l0aW9uICs9IDI7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgXCJ9XCI6XG4gICAgICAgICAgICAgICAgdGhpcy5fc3RhdGUgPSBQYXJzZXJTdGF0ZS5FTkQ7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgdGhpcy5fcmFpc2VFcnJvcihuZXcgRXJyb3IoYFVucmVjb2duaXplZCBlbmQtb2YtYXJyYXkgY2hhcmFjdGVyOiAke2NodW5rW2NodW5rUG9zaXRpb25dfWApKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBTa2lwIFxcblxuICAgICAgICAgICAgY2h1bmtQb3NpdGlvbiA9IGxhc3ROZXdsaW5lICsgMTtcbiAgICAgICAgICAgIGJyZWFrIG91dGVyTG9vcDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBQYXJzZXJTdGF0ZS5TVFJJTkdfQVJSQVk6IHtcbiAgICAgICAgICBjb25zdCBzdGFydCA9IGNodW5rUG9zaXRpb247XG4gICAgICAgICAgbGV0IGVzY2FwZWQgPSBmYWxzZTtcbiAgICAgICAgICBsZXQgbGFzdFN0cmluZ0VuZGluZyA9IHN0YXJ0O1xuICAgICAgICAgIGxldCBpc0luU3RyaW5nID0gZmFsc2U7XG4gICAgICAgICAgLy8gTG9vayBmb3IgdW5lc2NhcGVkIFwiXVwiLCB3aGljaCBlbmRzIHRoZSBhcnJheS5cbiAgICAgICAgICBzdHJpbmdXaGlsZTpcbiAgICAgICAgICB3aGlsZSAoY2h1bmtQb3NpdGlvbiA8IGNodW5rTGVuKSB7XG4gICAgICAgICAgICBzd2l0Y2ggKGNodW5rW2NodW5rUG9zaXRpb25dKSB7XG4gICAgICAgICAgICAgIGNhc2UgJ1wiJzpcbiAgICAgICAgICAgICAgICBpZiAoIWVzY2FwZWQpIHtcbiAgICAgICAgICAgICAgICAgIGlzSW5TdHJpbmcgPSAhaXNJblN0cmluZztcbiAgICAgICAgICAgICAgICAgIGlmICghaXNJblN0cmluZykge1xuICAgICAgICAgICAgICAgICAgICBsYXN0U3RyaW5nRW5kaW5nID0gY2h1bmtQb3NpdGlvbjtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZXNjYXBlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICBjYXNlICddJzpcbiAgICAgICAgICAgICAgICBpZiAoIWlzSW5TdHJpbmcpIHtcbiAgICAgICAgICAgICAgICAgIGJyZWFrIHN0cmluZ1doaWxlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlc2NhcGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgJ1xcXFwnOlxuICAgICAgICAgICAgICAgIC8vIEZsaXAsIGZvciBzZXF1ZW5jZXMgb2YgXCJcXFwiIChlLmcuIGFuIGFjdHVhbCBcXCBjaGFyYWN0ZXIpXG4gICAgICAgICAgICAgICAgZXNjYXBlZCA9ICFlc2NhcGVkO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIGVzY2FwZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNodW5rUG9zaXRpb24rKztcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgYXJyYXlFbmRlZCA9IGNodW5rUG9zaXRpb24gIT09IGNodW5rTGVuO1xuICAgICAgICAgIC8vIFtzdGFydCwgZW5kKSBpcyBlaXRoZXI6XG4gICAgICAgICAgLy8gLSBcIlwiIGlmIHRoZSBhcnJheSBpcyB6ZXJvLWxlbmd0aCxcbiAgICAgICAgICAvLyAtIFwiOSwzLDQsNVxcbiwxLDIsM1tldGNdXCIgaWYgdGhpcyBpcyB0aGUgc3RhcnQgb2YgdGhlIGFycmF5LFxuICAgICAgICAgIC8vIC0gXCIsMSwyLDMsNFwiIGlmIHRoaXMgaXMgdGhlIG1pZGRsZSBvZiB0aGUgYXJyYXlcbiAgICAgICAgICAvLyBJdCBkb2VzIG5vdCBjb250YWluIHRoZSBcIl1cIiBjaGFyYWN0ZXIuXG4gICAgICAgICAgY29uc3QgZW5kID0gYXJyYXlFbmRlZCA/IGNodW5rUG9zaXRpb24gOiBsYXN0U3RyaW5nRW5kaW5nICsgMTtcbiAgICAgICAgICBpZiAoc3RhcnQgIT09IGVuZCkge1xuICAgICAgICAgICAgY29uc3QgYmVnaW5uaW5nQ29tbWEgPSBjaHVua1tzdGFydF0gPT09IFwiLFwiO1xuICAgICAgICAgICAgY29uc3Qgc3RyaW5nQ2h1bmsgPSBjaHVuay5zbGljZShiZWdpbm5pbmdDb21tYSA/IHN0YXJ0ICsgMSA6IHN0YXJ0LCBlbmQpO1xuICAgICAgICAgICAgY29uc3Qgc3RyaW5nczogc3RyaW5nW10gPSBKU09OLnBhcnNlKGBbJHtzdHJpbmdDaHVua31dYCk7XG4gICAgICAgICAgICB0aGlzLl9wZW5kaW5nRXZlbnRzLnB1c2goe1xuICAgICAgICAgICAgICB0eXBlOiBEYXRhVHlwZXMuU1RSSU5HUyxcbiAgICAgICAgICAgICAgZGF0YTogc3RyaW5nc1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChhcnJheUVuZGVkKSB7XG4gICAgICAgICAgICAvLyBTa2lwIFwiXVwiLlxuICAgICAgICAgICAgY2h1bmtQb3NpdGlvbisrO1xuICAgICAgICAgICAgc3dpdGNoIChjaHVua1tjaHVua1Bvc2l0aW9uXSkge1xuICAgICAgICAgICAgICBjYXNlIFwiLFwiOlxuICAgICAgICAgICAgICAgIHRoaXMuX3N0YXRlID0gUGFyc2VyU3RhdGUuQVJSQVlfUFJPUEVSVFlfQkVHSU47XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgXCJ9XCI6XG4gICAgICAgICAgICAgICAgdGhpcy5fc3RhdGUgPSBQYXJzZXJTdGF0ZS5FTkQ7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgdGhpcy5fcmFpc2VFcnJvcihuZXcgRXJyb3IoYFVucmVjb2duaXplZCBlbmQtb2YtYXJyYXkgY2hhcmFjdGVyOiAke2NodW5rW2NodW5rUG9zaXRpb25dfWApKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2h1bmtQb3NpdGlvbiA9IGxhc3RTdHJpbmdFbmRpbmcgKyAxO1xuICAgICAgICAgICAgYnJlYWsgb3V0ZXJMb29wO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFBhcnNlclN0YXRlLkVORDpcbiAgICAgICAgICBpZiAoY2h1bmtbY2h1bmtQb3NpdGlvbl0gIT09ICd9Jykge1xuICAgICAgICAgICAgdGhpcy5fcmFpc2VFcnJvcihuZXcgRXJyb3IoYFVuZXhwZWN0ZWQgZW5kIG9mIHNuYXBzaG90OiAke2NodW5rW2NodW5rUG9zaXRpb25dfWApKTtcbiAgICAgICAgICAgIGJyZWFrIG91dGVyTG9vcDtcbiAgICAgICAgICB9XG4gICAgICAgICAgY2h1bmtQb3NpdGlvbisrO1xuICAgICAgICAgIHRoaXMuX3BlbmRpbmdFdmVudHMucHVzaChudWxsKTtcbiAgICAgICAgICBicmVhayBvdXRlckxvb3A7XG4gICAgICAgIGNhc2UgUGFyc2VyU3RhdGUuRVJST1I6XG4gICAgICAgICAgYnJlYWsgb3V0ZXJMb29wO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHRoaXMuX3JhaXNlRXJyb3IobmV3IEVycm9yKGBJbnZhbGlkIHN0YXRlOiAke3RoaXMuX3N0YXRlfWApKTtcbiAgICAgICAgICBicmVhayBvdXRlckxvb3A7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGNodW5rUG9zaXRpb24gPCBjaHVua0xlbiAmJiB0aGlzLl9zdGF0ZSAhPT0gUGFyc2VyU3RhdGUuU1RSSU5HX0FSUkFZICYmIHRoaXMuX3N0YXRlICE9PSBQYXJzZXJTdGF0ZS5OVU1CRVJfQVJSQVkgJiYgIXRoaXMuaGFzRXJyb3JlZCgpKSB7XG4gICAgICB0aGlzLl9yYWlzZUVycm9yKG5ldyBFcnJvcihgUGFyc2luZyBlcnJvcjogRGlkIG5vdCBjb25zdW1lIHdob2xlIGNodW5rIWApKTtcbiAgICB9XG5cbiAgICBpZiAoY2h1bmtQb3NpdGlvbiA8IGNodW5rTGVuKSB7XG4gICAgICB0aGlzLl9idWZmZXIgPSBjaHVuay5zbGljZShjaHVua1Bvc2l0aW9uKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fYnVmZmVyID0gXCJcIjtcbiAgICB9XG5cbiAgICB0aGlzLl9wcm9jZXNzUGVuZGluZ1Byb21pc2VzKCk7XG4gIH1cblxuICBwcml2YXRlIF9wcm9jZXNzUGVuZGluZ1Byb21pc2VzKCk6IHZvaWQge1xuICAgIGNvbnN0IGhhc0Vycm9yZWQgPSB0aGlzLmhhc0Vycm9yZWQoKTtcbiAgICB3aGlsZSAoIWhhc0Vycm9yZWQgJiYgdGhpcy5fcGVuZGluZ1JlYWRzLmxlbmd0aCA+IDAgJiYgdGhpcy5fcGVuZGluZ0V2ZW50cy5sZW5ndGggPiAwKSB7XG4gICAgICB0aGlzLl9wZW5kaW5nUmVhZHMuc2hpZnQoKS5yZXNvbHZlKHRoaXMuX3BlbmRpbmdFdmVudHMuc2hpZnQoKSk7XG4gICAgfVxuXG4gICAgaWYgKGhhc0Vycm9yZWQpIHtcbiAgICAgIGZvciAoY29uc3QgcHJvbWlzZSBvZiB0aGlzLl9wZW5kaW5nUmVhZHMpIHtcbiAgICAgICAgcHJvbWlzZS5yZWplY3QodGhpcy5fZXJyb3IpO1xuICAgICAgfVxuICAgICAgdGhpcy5fcGVuZGluZ1JlYWRzID0gW107XG4gICAgfSBlbHNlIGlmICh0aGlzLl9wZW5kaW5nRXZlbnRzLmxlbmd0aCA9PT0gMCAmJiB0aGlzLl9zdGF0ZSA9PT0gUGFyc2VyU3RhdGUuRU5EKSB7XG4gICAgICBmb3IgKGNvbnN0IHByb21pc2Ugb2YgdGhpcy5fcGVuZGluZ1JlYWRzKSB7XG4gICAgICAgIHByb21pc2UucmVzb2x2ZShudWxsKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX3BlbmRpbmdSZWFkcyA9IFtdO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX3JhaXNlRXJyb3IoZTogRXJyb3IpOiB2b2lkIHtcbiAgICB0aGlzLl9lcnJvciA9IGU7XG4gICAgdGhpcy5fc3RhdGUgPSBQYXJzZXJTdGF0ZS5FUlJPUjtcbiAgICB0aGlzLl9wcm9jZXNzUGVuZGluZ1Byb21pc2VzKCk7XG4gIH1cblxuICBwdWJsaWMgaGFzRXJyb3JlZCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fc3RhdGUgPT09IFBhcnNlclN0YXRlLkVSUk9SO1xuICB9XG5cbiAgcHVibGljIHJlYWQoKTogUHJvbWlzZTxQYXJzZXJFdmVudD4ge1xuICAgIGlmICh0aGlzLl9wZW5kaW5nRXZlbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcy5fcGVuZGluZ0V2ZW50cy5zaGlmdCgpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPFBhcnNlckV2ZW50PigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMuX3BlbmRpbmdSZWFkcy5wdXNoKHtyZXNvbHZlLCByZWplY3R9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxufSJdfQ==