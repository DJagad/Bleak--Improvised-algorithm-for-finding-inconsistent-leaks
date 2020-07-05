"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const leak_root_1 = require("./leak_root");
function leakRootToJSON(l) {
    return l.toJSON();
}
function leakRootFromJSON(l) {
    return leak_root_1.default.FromJSON(l);
}
/**
 * Contains the results from a BLeak run.
 */
class BLeakResults {
    constructor(leaks = [], stackFrames = [], sourceFiles = {}, heapStats = [], rankingEvaluation = { leakShare: [], transitiveClosureSize: [], retainedSize: [] }) {
        this.leaks = leaks;
        this.stackFrames = stackFrames;
        this.sourceFiles = sourceFiles;
        this.heapStats = heapStats;
        this.rankingEvaluation = rankingEvaluation;
    }
    /**
     * Deserialize from a JSON object.
     * @param br
     */
    static FromJSON(br) {
        return new BLeakResults(br.leaks.map(leakRootFromJSON), br.stackFrames, br.sourceFiles, br.heapStats, br.rankingEvaluation);
    }
    /**
     * Add the given stack frame to the results, and returns a canonical ID.
     * @param sf
     */
    addStackFrame(url, line, col, functionName, source) {
        const sf = [url, line, col, functionName, source];
        return this.stackFrames.push(sf) - 1;
    }
    /**
     * Adds a given stack frame expressed as an object to the results, and returns a canonical ID.
     * @param sf
     */
    addStackFrameFromObject(sf) {
        return this.addStackFrame(sf.fileName, sf.lineNumber, sf.columnNumber, sf.functionName, sf.source);
    }
    /**
     * Adds the given source file to the results.
     * @param url
     * @param source
     */
    addSourceFile(url, mimeType, source) {
        this.sourceFiles[url] = {
            mimeType,
            source
        };
    }
    /**
     * Compacts the results into a new BLeakResults object.
     * - Deduplicates stack frames.
     * - Removes any source files for which there are no relevant stack frames.
     */
    compact() {
        const newSourceFiles = {};
        const oldSourceFiles = this.sourceFiles;
        const newStackFrames = [];
        const newLeaks = [];
        const oldLeaks = this.leaks;
        const sfMap = new Map();
        const oldStackFrames = this.stackFrames;
        function sfKey(sf) {
            return sf.join(";");
        }
        for (const sf of oldStackFrames) {
            const key = sfKey(sf);
            if (!sfMap.has(key)) {
                const id = newStackFrames.push(sf) - 1;
                sfMap.set(key, { id, sf });
                newSourceFiles[sf[0]] = oldSourceFiles[sf[0]];
            }
        }
        function sfLookup(oldSfId) {
            const sf = oldStackFrames[oldSfId];
            return sfMap.get(sfKey(sf)).id;
        }
        // This is kinda terrible, but we use a string representation
        // of stacks to compare them. There shouldn't be many dupes,
        // but sometimes there are after we normalize stack frames
        // (removing references to bleak agent).
        function stackToString(s) {
            return s.join(",");
        }
        for (const leak of oldLeaks) {
            const oldStacks = leak.stacks;
            const newStacks = [];
            const foundStacks = new Set();
            for (const oldStack of oldStacks) {
                const newStack = oldStack.map(sfLookup);
                const stackStr = stackToString(newStack);
                // Ignore duplicate stacks.
                if (!foundStacks.has(stackStr)) {
                    foundStacks.add(stackStr);
                    newStacks.push(newStack);
                }
            }
            newLeaks.push(new leak_root_1.default(leak.id, leak.paths, leak.scores, newStacks));
        }
        return new BLeakResults(newLeaks, newStackFrames, newSourceFiles, this.heapStats);
    }
    /**
     * Convert a stack object into a set of frames.
     * @param st
     */
    stackToFrames(st) {
        const stackFrames = this.stackFrames;
        function lookup(sfId) {
            return stackFrames[sfId];
        }
        return st.map(lookup);
    }
    /**
     * Serialize into a JSON object.
     */
    toJSON() {
        return {
            leaks: this.leaks.map(leakRootToJSON),
            stackFrames: this.stackFrames,
            sourceFiles: this.sourceFiles,
            heapStats: this.heapStats,
            rankingEvaluation: this.rankingEvaluation
        };
    }
}
exports.default = BLeakResults;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmxlYWtfcmVzdWx0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9saWIvYmxlYWtfcmVzdWx0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUNBLDJDQUFtQztBQUduQyx3QkFBd0IsQ0FBVztJQUNqQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBQ3BCLENBQUM7QUFFRCwwQkFBMEIsQ0FBWTtJQUNwQyxNQUFNLENBQUMsbUJBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDOUIsQ0FBQztBQUVEOztHQUVHO0FBQ0g7SUFTRSxZQUE2QixRQUFvQixFQUFFLEVBQ2pDLGNBQTZCLEVBQUUsRUFDL0IsY0FBcUMsRUFBRSxFQUN2QyxZQUFtQyxFQUFFLEVBQ3JDLG9CQUF1QyxFQUFFLFNBQVMsRUFBRSxFQUFFLEVBQUUscUJBQXFCLEVBQUUsRUFBRSxFQUFFLFlBQVksRUFBRSxFQUFFLEVBQUU7UUFKMUYsVUFBSyxHQUFMLEtBQUssQ0FBaUI7UUFDakMsZ0JBQVcsR0FBWCxXQUFXLENBQW9CO1FBQy9CLGdCQUFXLEdBQVgsV0FBVyxDQUE0QjtRQUN2QyxjQUFTLEdBQVQsU0FBUyxDQUE0QjtRQUNyQyxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9GO0lBQUcsQ0FBQztJQVozSDs7O09BR0c7SUFDSSxNQUFNLENBQUMsUUFBUSxDQUFDLEVBQWlCO1FBQ3RDLE1BQU0sQ0FBQyxJQUFJLFlBQVksQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0lBQzlILENBQUM7SUFRRDs7O09BR0c7SUFDSSxhQUFhLENBQUMsR0FBVyxFQUFFLElBQVksRUFBRSxHQUFXLEVBQUUsWUFBb0IsRUFB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QixFQUFFLElBQUksQ0FBQyxpQkFBaUI7U0FDMUMsQ0FBQztJQUNKLENBQUM7Q0FDRjtBQXpIRCwrQkF5SEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge0lCTGVha1Jlc3VsdHMsIElMZWFrUm9vdCwgSVN0YWNrRnJhbWUsIElTdGFjaywgSVNvdXJjZUZpbGVSZXBvc2l0b3J5LCBTbmFwc2hvdFNpemVTdW1tYXJ5LCBSYW5raW5nRXZhbHVhdGlvbn0gZnJvbSAnLi4vY29tbW9uL2ludGVyZmFjZXMnO1xuaW1wb3J0IExlYWtSb290IGZyb20gJy4vbGVha19yb290JztcbmltcG9ydCB7U3RhY2tGcmFtZX0gZnJvbSAnZXJyb3Itc3RhY2stcGFyc2VyJztcblxuZnVuY3Rpb24gbGVha1Jvb3RUb0pTT04obDogTGVha1Jvb3QpOiBJTGVha1Jvb3Qge1xuICByZXR1cm4gbC50b0pTT04oKTtcbn1cblxuZnVuY3Rpb24gbGVha1Jvb3RGcm9tSlNPTihsOiBJTGVha1Jvb3QpOiBMZWFrUm9vdCB7XG4gIHJldHVybiBMZWFrUm9vdC5Gcm9tSlNPTihsKTtcbn1cblxuLyoqXG4gKiBDb250YWlucyB0aGUgcmVzdWx0cyBmcm9tIGEgQkxlYWsgcnVuLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBCTGVha1Jlc3VsdHMgaW1wbGVtZW50cyBJQkxlYWtSZXN1bHRzIHtcbiAgLyoqXG4gICAqIERlc2VyaWFsaXplIGZyb20gYSBKU09OIG9iamVjdC5cbiAgICogQHBhcmFtIGJyXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIEZyb21KU09OKGJyOiBJQkxlYWtSZXN1bHRzKTogQkxlYWtSZXN1bHRzIHtcbiAgICByZXR1cm4gbmV3IEJMZWFrUmVzdWx0cyhici5sZWFrcy5tYXAobGVha1Jvb3RGcm9tSlNPTiksIGJyLnN0YWNrRnJhbWVzLCBici5zb3VyY2VGaWxlcywgYnIuaGVhcFN0YXRzLCBici5yYW5raW5nRXZhbHVhdGlvbik7XG4gIH1cblxuICBjb25zdHJ1Y3RvciAocHVibGljIHJlYWRvbmx5IGxlYWtzOiBMZWFrUm9vdFtdID0gW10sXG4gICAgcHVibGljIHJlYWRvbmx5IHN0YWNrRnJhbWVzOiBJU3RhY2tGcmFtZVtdID0gW10sXG4gICAgcHVibGljIHJlYWRvbmx5IHNvdXJjZUZpbGVzOiBJU291cmNlRmlsZVJlcG9zaXRvcnkgPSB7fSxcbiAgICBwdWJsaWMgcmVhZG9ubHkgaGVhcFN0YXRzOiBTbmFwc2hvdFNpemVTdW1tYXJ5W10gPSBbXSxcbiAgICBwdWJsaWMgcmVhZG9ubHkgcmFua2luZ0V2YWx1YXRpb246IFJhbmtpbmdFdmFsdWF0aW9uID0geyBsZWFrU2hhcmU6IFtdLCB0cmFuc2l0aXZlQ2xvc3VyZVNpemU6IFtdLCByZXRhaW5lZFNpemU6IFtdIH0pIHt9XG5cbiAgLyoqXG4gICAqIEFkZCB0aGUgZ2l2ZW4gc3RhY2sgZnJhbWUgdG8gdGhlIHJlc3VsdHMsIGFuZCByZXR1cm5zIGEgY2Fub25pY2FsIElELlxuICAgKiBAcGFyYW0gc2ZcbiAgICovXG4gIHB1YmxpYyBhZGRTdGFja0ZyYW1lKHVybDogc3RyaW5nLCBsaW5lOiBudW1iZXIsIGNvbDogbnVtYmVyLCBmdW5jdGlvbk5hbWU6IHN0cmluZywgc291cmNlOiBzdHJpbmcpOiBudW1iZXIge1xuICAgIGNvbnN0IHNmOiBJU3RhY2tGcmFtZSA9IFt1cmwsIGxpbmUsIGNvbCwgZnVuY3Rpb25OYW1lLCBzb3VyY2VdO1xuICAgIHJldHVybiB0aGlzLnN0YWNrRnJhbWVzLnB1c2goc2YpIC0gMTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGEgZ2l2ZW4gc3RhY2sgZnJhbWUgZXhwcmVzc2VkIGFzIGFuIG9iamVjdCB0byB0aGUgcmVzdWx0cywgYW5kIHJldHVybnMgYSBjYW5vbmljYWwgSUQuXG4gICAqIEBwYXJhbSBzZlxuICAgKi9cbiAgcHVibGljIGFkZFN0YWNrRnJhbWVGcm9tT2JqZWN0KHNmOiBTdGFja0ZyYW1lKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5hZGRTdGFja0ZyYW1lKHNmLmZpbGVOYW1lLCBzZi5saW5lTnVtYmVyLCBzZi5jb2x1bW5OdW1iZXIsIHNmLmZ1bmN0aW9uTmFtZSwgc2Yuc291cmNlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIHRoZSBnaXZlbiBzb3VyY2UgZmlsZSB0byB0aGUgcmVzdWx0cy5cbiAgICogQHBhcmFtIHVybFxuICAgKiBAcGFyYW0gc291cmNlXG4gICAqL1xuICBwdWJsaWMgYWRkU291cmNlRmlsZSh1cmw6IHN0cmluZywgbWltZVR5cGU6IFwidGV4dC9qYXZhc2NyaXB0XCIgfCBcInRleHQvaHRtbFwiLCBzb3VyY2U6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMuc291cmNlRmlsZXNbdXJsXSA9IHtcbiAgICAgIG1pbWVUeXBlLFxuICAgICAgc291cmNlXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb21wYWN0cyB0aGUgcmVzdWx0cyBpbnRvIGEgbmV3IEJMZWFrUmVzdWx0cyBvYmplY3QuXG4gICAqIC0gRGVkdXBsaWNhdGVzIHN0YWNrIGZyYW1lcy5cbiAgICogLSBSZW1vdmVzIGFueSBzb3VyY2UgZmlsZXMgZm9yIHdoaWNoIHRoZXJlIGFyZSBubyByZWxldmFudCBzdGFjayBmcmFtZXMuXG4gICAqL1xuICBwdWJsaWMgY29tcGFjdCgpOiBCTGVha1Jlc3VsdHMge1xuICAgIGNvbnN0IG5ld1NvdXJjZUZpbGVzOiBJU291cmNlRmlsZVJlcG9zaXRvcnkgPSB7fVxuICAgIGNvbnN0IG9sZFNvdXJjZUZpbGVzID0gdGhpcy5zb3VyY2VGaWxlcztcbiAgICBjb25zdCBuZXdTdGFja0ZyYW1lczogSVN0YWNrRnJhbWVbXSA9IFtdO1xuICAgIGNvbnN0IG5ld0xlYWtzOiBMZWFrUm9vdFtdID0gW107XG4gICAgY29uc3Qgb2xkTGVha3MgPSB0aGlzLmxlYWtzO1xuICAgIGNvbnN0IHNmTWFwID0gbmV3IE1hcDxzdHJpbmcsIHsgaWQ6IG51bWJlciwgc2Y6IElTdGFja0ZyYW1lIH0+KCk7XG4gICAgY29uc3Qgb2xkU3RhY2tGcmFtZXMgPSB0aGlzLnN0YWNrRnJhbWVzO1xuICAgIGZ1bmN0aW9uIHNmS2V5KHNmOiBJU3RhY2tGcmFtZSk6IHN0cmluZyB7XG4gICAgICByZXR1cm4gc2Yuam9pbihcIjtcIik7XG4gICAgfVxuICAgIGZvciAoY29uc3Qgc2Ygb2Ygb2xkU3RhY2tGcmFtZXMpIHtcbiAgICAgIGNvbnN0IGtleSA9IHNmS2V5KHNmKTtcbiAgICAgIGlmICghc2ZNYXAuaGFzKGtleSkpIHtcbiAgICAgICAgY29uc3QgaWQgPSBuZXdTdGFja0ZyYW1lcy5wdXNoKHNmKSAtIDE7XG4gICAgICAgIHNmTWFwLnNldChrZXksIHsgaWQsIHNmIH0pO1xuICAgICAgICBuZXdTb3VyY2VGaWxlc1tzZlswXV0gPSBvbGRTb3VyY2VGaWxlc1tzZlswXV07XG4gICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIHNmTG9va3VwKG9sZFNmSWQ6IG51bWJlcik6IG51bWJlciB7XG4gICAgICBjb25zdCBzZiA9IG9sZFN0YWNrRnJhbWVzW29sZFNmSWRdO1xuICAgICAgcmV0dXJuIHNmTWFwLmdldChzZktleShzZikpLmlkO1xuICAgIH1cbiAgICAvLyBUaGlzIGlzIGtpbmRhIHRlcnJpYmxlLCBidXQgd2UgdXNlIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uXG4gICAgLy8gb2Ygc3RhY2tzIHRvIGNvbXBhcmUgdGhlbS4gVGhlcmUgc2hvdWxkbid0IGJlIG1hbnkgZHVwZXMsXG4gICAgLy8gYnV0IHNvbWV0aW1lcyB0aGVyZSBhcmUgYWZ0ZXIgd2Ugbm9ybWFsaXplIHN0YWNrIGZyYW1lc1xuICAgIC8vIChyZW1vdmluZyByZWZlcmVuY2VzIHRvIGJsZWFrIGFnZW50KS5cbiAgICBmdW5jdGlvbiBzdGFja1RvU3RyaW5nKHM6IElTdGFjayk6IHN0cmluZyB7XG4gICAgICByZXR1cm4gcy5qb2luKFwiLFwiKTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBsZWFrIG9mIG9sZExlYWtzKSB7XG4gICAgICBjb25zdCBvbGRTdGFja3MgPSBsZWFrLnN0YWNrcztcbiAgICAgIGNvbnN0IG5ld1N0YWNrczogSVN0YWNrW10gPSBbXTtcbiAgICAgIGNvbnN0IGZvdW5kU3RhY2tzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgICBmb3IgKGNvbnN0IG9sZFN0YWNrIG9mIG9sZFN0YWNrcykge1xuICAgICAgICBjb25zdCBuZXdTdGFjayA9IG9sZFN0YWNrLm1hcChzZkxvb2t1cCk7XG4gICAgICAgIGNvbnN0IHN0YWNrU3RyID0gc3RhY2tUb1N0cmluZyhuZXdTdGFjayk7XG4gICAgICAgIC8vIElnbm9yZSBkdXBsaWNhdGUgc3RhY2tzLlxuICAgICAgICBpZiAoIWZvdW5kU3RhY2tzLmhhcyhzdGFja1N0cikpIHtcbiAgICAgICAgICBmb3VuZFN0YWNrcy5hZGQoc3RhY2tTdHIpO1xuICAgICAgICAgIG5ld1N0YWNrcy5wdXNoKG5ld1N0YWNrKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgbmV3TGVha3MucHVzaChuZXcgTGVha1Jvb3QobGVhay5pZCwgbGVhay5wYXRocywgbGVhay5zY29yZXMsIG5ld1N0YWNrcykpO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IEJMZWFrUmVzdWx0cyhuZXdMZWFrcywgbmV3U3RhY2tGcmFtZXMsIG5ld1NvdXJjZUZpbGVzLCB0aGlzLmhlYXBTdGF0cyk7XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydCBhIHN0YWNrIG9iamVjdCBpbnRvIGEgc2V0IG9mIGZyYW1lcy5cbiAgICogQHBhcmFtIHN0XG4gICAqL1xuICBwdWJsaWMgc3RhY2tUb0ZyYW1lcyhzdDogSVN0YWNrKTogSVN0YWNrRnJhbWVbXSB7XG4gICAgY29uc3Qgc3RhY2tGcmFtZXMgPSB0aGlzLnN0YWNrRnJhbWVzO1xuICAgIGZ1bmN0aW9uIGxvb2t1cChzZklkOiBudW1iZXIpOiBJU3RhY2tGcmFtZSB7XG4gICAgICByZXR1cm4gc3RhY2tGcmFtZXNbc2ZJZF07XG4gICAgfVxuICAgIHJldHVybiBzdC5tYXAobG9va3VwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXJpYWxpemUgaW50byBhIEpTT04gb2JqZWN0LlxuICAgKi9cbiAgcHVibGljIHRvSlNPTigpOiBJQkxlYWtSZXN1bHRzIHtcbiAgICByZXR1cm4ge1xuICAgICAgbGVha3M6IHRoaXMubGVha3MubWFwKGxlYWtSb290VG9KU09OKSxcbiAgICAgIHN0YWNrRnJhbWVzOiB0aGlzLnN0YWNrRnJhbWVzLFxuICAgICAgc291cmNlRmlsZXM6IHRoaXMuc291cmNlRmlsZXMsXG4gICAgICBoZWFwU3RhdHM6IHRoaXMuaGVhcFN0YXRzLFxuICAgICAgcmFua2luZ0V2YWx1YXRpb246IHRoaXMucmFua2luZ0V2YWx1YXRpb25cbiAgICB9O1xuICB9XG59XG4iXX0=