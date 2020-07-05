import LeakRoot from './leak_root';
function leakRootToJSON(l) {
    return l.toJSON();
}
function leakRootFromJSON(l) {
    return LeakRoot.FromJSON(l);
}
/**
 * Contains the results from a BLeak run.
 */
var BLeakResults = /** @class */ (function () {
    function BLeakResults(leaks, stackFrames, sourceFiles, heapStats, rankingEvaluation) {
        if (leaks === void 0) { leaks = []; }
        if (stackFrames === void 0) { stackFrames = []; }
        if (sourceFiles === void 0) { sourceFiles = {}; }
        if (heapStats === void 0) { heapStats = []; }
        if (rankingEvaluation === void 0) { rankingEvaluation = { leakShare: [], transitiveClosureSize: [], retainedSize: [] }; }
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
    BLeakResults.FromJSON = function (br) {
        return new BLeakResults(br.leaks.map(leakRootFromJSON), br.stackFrames, br.sourceFiles, br.heapStats, br.rankingEvaluation);
    };
    /**
     * Add the given stack frame to the results, and returns a canonical ID.
     * @param sf
     */
    BLeakResults.prototype.addStackFrame = function (url, line, col, functionName, source) {
        var sf = [url, line, col, functionName, source];
        return this.stackFrames.push(sf) - 1;
    };
    /**
     * Adds a given stack frame expressed as an object to the results, and returns a canonical ID.
     * @param sf
     */
    BLeakResults.prototype.addStackFrameFromObject = function (sf) {
        return this.addStackFrame(sf.fileName, sf.lineNumber, sf.columnNumber, sf.functionName, sf.source);
    };
    /**
     * Adds the given source file to the results.
     * @param url
     * @param source
     */
    BLeakResults.prototype.addSourceFile = function (url, mimeType, source) {
        this.sourceFiles[url] = {
            mimeType: mimeType,
            source: source
        };
    };
    /**
     * Compacts the results into a new BLeakResults object.
     * - Deduplicates stack frames.
     * - Removes any source files for which there are no relevant stack frames.
     */
    BLeakResults.prototype.compact = function () {
        var newSourceFiles = {};
        var oldSourceFiles = this.sourceFiles;
        var newStackFrames = [];
        var newLeaks = [];
        var oldLeaks = this.leaks;
        var sfMap = new Map();
        var oldStackFrames = this.stackFrames;
        function sfKey(sf) {
            return sf.join(";");
        }
        for (var _i = 0, oldStackFrames_1 = oldStackFrames; _i < oldStackFrames_1.length; _i++) {
            var sf = oldStackFrames_1[_i];
            var key = sfKey(sf);
            if (!sfMap.has(key)) {
                var id = newStackFrames.push(sf) - 1;
                sfMap.set(key, { id: id, sf: sf });
                newSourceFiles[sf[0]] = oldSourceFiles[sf[0]];
            }
        }
        function sfLookup(oldSfId) {
            var sf = oldStackFrames[oldSfId];
            return sfMap.get(sfKey(sf)).id;
        }
        // This is kinda terrible, but we use a string representation
        // of stacks to compare them. There shouldn't be many dupes,
        // but sometimes there are after we normalize stack frames
        // (removing references to bleak agent).
        function stackToString(s) {
            return s.join(",");
        }
        for (var _a = 0, oldLeaks_1 = oldLeaks; _a < oldLeaks_1.length; _a++) {
            var leak = oldLeaks_1[_a];
            var oldStacks = leak.stacks;
            var newStacks = [];
            var foundStacks = new Set();
            for (var _b = 0, oldStacks_1 = oldStacks; _b < oldStacks_1.length; _b++) {
                var oldStack = oldStacks_1[_b];
                var newStack = oldStack.map(sfLookup);
                var stackStr = stackToString(newStack);
                // Ignore duplicate stacks.
                if (!foundStacks.has(stackStr)) {
                    foundStacks.add(stackStr);
                    newStacks.push(newStack);
                }
            }
            newLeaks.push(new LeakRoot(leak.id, leak.paths, leak.scores, newStacks));
        }
        return new BLeakResults(newLeaks, newStackFrames, newSourceFiles, this.heapStats);
    };
    /**
     * Convert a stack object into a set of frames.
     * @param st
     */
    BLeakResults.prototype.stackToFrames = function (st) {
        var stackFrames = this.stackFrames;
        function lookup(sfId) {
            return stackFrames[sfId];
        }
        return st.map(lookup);
    };
    /**
     * Serialize into a JSON object.
     */
    BLeakResults.prototype.toJSON = function () {
        return {
            leaks: this.leaks.map(leakRootToJSON),
            stackFrames: this.stackFrames,
            sourceFiles: this.sourceFiles,
            heapStats: this.heapStats,
            rankingEvaluation: this.rankingEvaluation
        };
    };
    return BLeakResults;
}());
export default BLeakResults;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmxlYWtfcmVzdWx0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9saWIvYmxlYWtfcmVzdWx0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxPQUFPLFFBQVEsTUFBTSxhQUFhLENBQUM7QUFHbkMsd0JBQXdCLENBQVc7SUFDakMsTUFBTSxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQUNwQixDQUFDO0FBRUQsMEJBQTBCLENBQVk7SUFDcEMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDOUIsQ0FBQztBQUVEOztHQUVHO0FBQ0g7SUFTRSxzQkFBNkIsS0FBc0IsRUFDakMsV0FBK0IsRUFDL0IsV0FBdUMsRUFDdkMsU0FBcUMsRUFDckMsaUJBQXFHO1FBSjFGLHNCQUFBLEVBQUEsVUFBc0I7UUFDakMsNEJBQUEsRUFBQSxnQkFBK0I7UUFDL0IsNEJBQUEsRUFBQSxnQkFBdUM7UUFDdkMsMEJBQUEsRUFBQSxjQUFxQztRQUNyQyxrQ0FBQSxFQUFBLHNCQUF5QyxTQUFTLEVBQUUsRUFBRSxFQUFFLHFCQUFxQixFQUFFLEVBQUUsRUFBRSxZQUFZLEVBQUUsRUFBRSxFQUFFO1FBSjFGLFVBQUssR0FBTCxLQUFLLENBQWlCO1FBQ2pDLGdCQUFXLEdBQVgsV0FBVyxDQUFvQjtRQUMvQixnQkFBVyxHQUFYLFdBQVcsQ0FBNEI7UUFDdkMsY0FBUyxHQUFULFNBQVMsQ0FBNEI7UUFDckMsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvRjtJQUFHLENBQUM7SUFaM0g7OztPQUdHO0lBQ1cscUJBQVEsR0FBdEIsVUFBdUIsRUFBaUI7UUFDdEMsTUFBTSxDQUFDLElBQUksWUFBWSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsRUFBRSxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQyxTQUFTLEVB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QUFNLENBQUMsQ0FBQztJQUN4QixDQUFDO0lBRUQ7O09BRUc7SUFDSSw2QkFBTSxHQUFiO1FBQ0UsTUFBTSxDQUFDO1lBQ0wsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQztZQUNyQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFdBQVc7WUFDN0IsV0FBVyxFQUFFLElBQUksQ0FBQyxXQUFXO1lBQzdCLFNBQVMsRUFBRSxJQUFJLENBQUMsU0FBUztZQUN6QixpQkFBaUIsRUFBRSxJQUFJLENBQUMsaUJBQWlCO1NBQzFDLENBQUM7SUFDSixDQUFDO0lBQ0gsbUJBQUM7QUFBRCxDQUFDLEFBekhELElBeUhDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtJQkxlYWtSZXN1bHRzLCBJTGVha1Jvb3QsIElTdGFja0ZyYW1lLCBJU3RhY2ssIElTb3VyY2VGaWxlUmVwb3NpdG9yeSwgU25hcHNob3RTaXplU3VtbWFyeSwgUmFua2luZ0V2YWx1YXRpb259IGZyb20gJy4uL2NvbW1vbi9pbnRlcmZhY2VzJztcbmltcG9ydCBMZWFrUm9vdCBmcm9tICcuL2xlYWtfcm9vdCc7XG5pbXBvcnQge1N0YWNrRnJhbWV9IGZyb20gJ2Vycm9yLXN0YWNrLXBhcnNlcic7XG5cbmZ1bmN0aW9uIGxlYWtSb290VG9KU09OKGw6IExlYWtSb290KTogSUxlYWtSb290IHtcbiAgcmV0dXJuIGwudG9KU09OKCk7XG59XG5cbmZ1bmN0aW9uIGxlYWtSb290RnJvbUpTT04obDogSUxlYWtSb290KTogTGVha1Jvb3Qge1xuICByZXR1cm4gTGVha1Jvb3QuRnJvbUpTT04obCk7XG59XG5cbi8qKlxuICogQ29udGFpbnMgdGhlIHJlc3VsdHMgZnJvbSBhIEJMZWFrIHJ1bi5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQkxlYWtSZXN1bHRzIGltcGxlbWVudHMgSUJMZWFrUmVzdWx0cyB7XG4gIC8qKlxuICAgKiBEZXNlcmlhbGl6ZSBmcm9tIGEgSlNPTiBvYmplY3QuXG4gICAqIEBwYXJhbSBiclxuICAgKi9cbiAgcHVibGljIHN0YXRpYyBGcm9tSlNPTihicjogSUJMZWFrUmVzdWx0cyk6IEJMZWFrUmVzdWx0cyB7XG4gICAgcmV0dXJuIG5ldyBCTGVha1Jlc3VsdHMoYnIubGVha3MubWFwKGxlYWtSb290RnJvbUpTT04pLCBici5zdGFja0ZyYW1lcywgYnIuc291cmNlRmlsZXMsIGJyLmhlYXBTdGF0cywgYnIucmFua2luZ0V2YWx1YXRpb24pO1xuICB9XG5cbiAgY29uc3RydWN0b3IgKHB1YmxpYyByZWFkb25seSBsZWFrczogTGVha1Jvb3RbXSA9IFtdLFxuICAgIHB1YmxpYyByZWFkb25seSBzdGFja0ZyYW1lczogSVN0YWNrRnJhbWVbXSA9IFtdLFxuICAgIHB1YmxpYyByZWFkb25seSBzb3VyY2VGaWxlczogSVNvdXJjZUZpbGVSZXBvc2l0b3J5ID0ge30sXG4gICAgcHVibGljIHJlYWRvbmx5IGhlYXBTdGF0czogU25hcHNob3RTaXplU3VtbWFyeVtdID0gW10sXG4gICAgcHVibGljIHJlYWRvbmx5IHJhbmtpbmdFdmFsdWF0aW9uOiBSYW5raW5nRXZhbHVhdGlvbiA9IHsgbGVha1NoYXJlOiBbXSwgdHJhbnNpdGl2ZUNsb3N1cmVTaXplOiBbXSwgcmV0YWluZWRTaXplOiBbXSB9KSB7fVxuXG4gIC8qKlxuICAgKiBBZGQgdGhlIGdpdmVuIHN0YWNrIGZyYW1lIHRvIHRoZSByZXN1bHRzLCBhbmQgcmV0dXJucyBhIGNhbm9uaWNhbCBJRC5cbiAgICogQHBhcmFtIHNmXG4gICAqL1xuICBwdWJsaWMgYWRkU3RhY2tGcmFtZSh1cmw6IHN0cmluZywgbGluZTogbnVtYmVyLCBjb2w6IG51bWJlciwgZnVuY3Rpb25OYW1lOiBzdHJpbmcsIHNvdXJjZTogc3RyaW5nKTogbnVtYmVyIHtcbiAgICBjb25zdCBzZjogSVN0YWNrRnJhbWUgPSBbdXJsLCBsaW5lLCBjb2wsIGZ1bmN0aW9uTmFtZSwgc291cmNlXTtcbiAgICByZXR1cm4gdGhpcy5zdGFja0ZyYW1lcy5wdXNoKHNmKSAtIDE7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBhIGdpdmVuIHN0YWNrIGZyYW1lIGV4cHJlc3NlZCBhcyBhbiBvYmplY3QgdG8gdGhlIHJlc3VsdHMsIGFuZCByZXR1cm5zIGEgY2Fub25pY2FsIElELlxuICAgKiBAcGFyYW0gc2ZcbiAgICovXG4gIHB1YmxpYyBhZGRTdGFja0ZyYW1lRnJvbU9iamVjdChzZjogU3RhY2tGcmFtZSk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuYWRkU3RhY2tGcmFtZShzZi5maWxlTmFtZSwgc2YubGluZU51bWJlciwgc2YuY29sdW1uTnVtYmVyLCBzZi5mdW5jdGlvbk5hbWUsIHNmLnNvdXJjZSk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyB0aGUgZ2l2ZW4gc291cmNlIGZpbGUgdG8gdGhlIHJlc3VsdHMuXG4gICAqIEBwYXJhbSB1cmxcbiAgICogQHBhcmFtIHNvdXJjZVxuICAgKi9cbiAgcHVibGljIGFkZFNvdXJjZUZpbGUodXJsOiBzdHJpbmcsIG1pbWVUeXBlOiBcInRleHQvamF2YXNjcmlwdFwiIHwgXCJ0ZXh0L2h0bWxcIiwgc291cmNlOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLnNvdXJjZUZpbGVzW3VybF0gPSB7XG4gICAgICBtaW1lVHlwZSxcbiAgICAgIHNvdXJjZVxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogQ29tcGFjdHMgdGhlIHJlc3VsdHMgaW50byBhIG5ldyBCTGVha1Jlc3VsdHMgb2JqZWN0LlxuICAgKiAtIERlZHVwbGljYXRlcyBzdGFjayBmcmFtZXMuXG4gICAqIC0gUmVtb3ZlcyBhbnkgc291cmNlIGZpbGVzIGZvciB3aGljaCB0aGVyZSBhcmUgbm8gcmVsZXZhbnQgc3RhY2sgZnJhbWVzLlxuICAgKi9cbiAgcHVibGljIGNvbXBhY3QoKTogQkxlYWtSZXN1bHRzIHtcbiAgICBjb25zdCBuZXdTb3VyY2VGaWxlczogSVNvdXJjZUZpbGVSZXBvc2l0b3J5ID0ge31cbiAgICBjb25zdCBvbGRTb3VyY2VGaWxlcyA9IHRoaXMuc291cmNlRmlsZXM7XG4gICAgY29uc3QgbmV3U3RhY2tGcmFtZXM6IElTdGFja0ZyYW1lW10gPSBbXTtcbiAgICBjb25zdCBuZXdMZWFrczogTGVha1Jvb3RbXSA9IFtdO1xuICAgIGNvbnN0IG9sZExlYWtzID0gdGhpcy5sZWFrcztcbiAgICBjb25zdCBzZk1hcCA9IG5ldyBNYXA8c3RyaW5nLCB7IGlkOiBudW1iZXIsIHNmOiBJU3RhY2tGcmFtZSB9PigpO1xuICAgIGNvbnN0IG9sZFN0YWNrRnJhbWVzID0gdGhpcy5zdGFja0ZyYW1lcztcbiAgICBmdW5jdGlvbiBzZktleShzZjogSVN0YWNrRnJhbWUpOiBzdHJpbmcge1xuICAgICAgcmV0dXJuIHNmLmpvaW4oXCI7XCIpO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IHNmIG9mIG9sZFN0YWNrRnJhbWVzKSB7XG4gICAgICBjb25zdCBrZXkgPSBzZktleShzZik7XG4gICAgICBpZiAoIXNmTWFwLmhhcyhrZXkpKSB7XG4gICAgICAgIGNvbnN0IGlkID0gbmV3U3RhY2tGcmFtZXMucHVzaChzZikgLSAxO1xuICAgICAgICBzZk1hcC5zZXQoa2V5LCB7IGlkLCBzZiB9KTtcbiAgICAgICAgbmV3U291cmNlRmlsZXNbc2ZbMF1dID0gb2xkU291cmNlRmlsZXNbc2ZbMF1dO1xuICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBzZkxvb2t1cChvbGRTZklkOiBudW1iZXIpOiBudW1iZXIge1xuICAgICAgY29uc3Qgc2YgPSBvbGRTdGFja0ZyYW1lc1tvbGRTZklkXTtcbiAgICAgIHJldHVybiBzZk1hcC5nZXQoc2ZLZXkoc2YpKS5pZDtcbiAgICB9XG4gICAgLy8gVGhpcyBpcyBraW5kYSB0ZXJyaWJsZSwgYnV0IHdlIHVzZSBhIHN0cmluZyByZXByZXNlbnRhdGlvblxuICAgIC8vIG9mIHN0YWNrcyB0byBjb21wYXJlIHRoZW0uIFRoZXJlIHNob3VsZG4ndCBiZSBtYW55IGR1cGVzLFxuICAgIC8vIGJ1dCBzb21ldGltZXMgdGhlcmUgYXJlIGFmdGVyIHdlIG5vcm1hbGl6ZSBzdGFjayBmcmFtZXNcbiAgICAvLyAocmVtb3ZpbmcgcmVmZXJlbmNlcyB0byBibGVhayBhZ2VudCkuXG4gICAgZnVuY3Rpb24gc3RhY2tUb1N0cmluZyhzOiBJU3RhY2spOiBzdHJpbmcge1xuICAgICAgcmV0dXJuIHMuam9pbihcIixcIik7XG4gICAgfVxuICAgIGZvciAoY29uc3QgbGVhayBvZiBvbGRMZWFrcykge1xuICAgICAgY29uc3Qgb2xkU3RhY2tzID0gbGVhay5zdGFja3M7XG4gICAgICBjb25zdCBuZXdTdGFja3M6IElTdGFja1tdID0gW107XG4gICAgICBjb25zdCBmb3VuZFN0YWNrcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgICAgZm9yIChjb25zdCBvbGRTdGFjayBvZiBvbGRTdGFja3MpIHtcbiAgICAgICAgY29uc3QgbmV3U3RhY2sgPSBvbGRTdGFjay5tYXAoc2ZMb29rdXApO1xuICAgICAgICBjb25zdCBzdGFja1N0ciA9IHN0YWNrVG9TdHJpbmcobmV3U3RhY2spO1xuICAgICAgICAvLyBJZ25vcmUgZHVwbGljYXRlIHN0YWNrcy5cbiAgICAgICAgaWYgKCFmb3VuZFN0YWNrcy5oYXMoc3RhY2tTdHIpKSB7XG4gICAgICAgICAgZm91bmRTdGFja3MuYWRkKHN0YWNrU3RyKTtcbiAgICAgICAgICBuZXdTdGFja3MucHVzaChuZXdTdGFjayk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIG5ld0xlYWtzLnB1c2gobmV3IExlYWtSb290KGxlYWsuaWQsIGxlYWsucGF0aHMsIGxlYWsuc2NvcmVzLCBuZXdTdGFja3MpKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBCTGVha1Jlc3VsdHMobmV3TGVha3MsIG5ld1N0YWNrRnJhbWVzLCBuZXdTb3VyY2VGaWxlcywgdGhpcy5oZWFwU3RhdHMpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnQgYSBzdGFjayBvYmplY3QgaW50byBhIHNldCBvZiBmcmFtZXMuXG4gICAqIEBwYXJhbSBzdFxuICAgKi9cbiAgcHVibGljIHN0YWNrVG9GcmFtZXMoc3Q6IElTdGFjayk6IElTdGFja0ZyYW1lW10ge1xuICAgIGNvbnN0IHN0YWNrRnJhbWVzID0gdGhpcy5zdGFja0ZyYW1lcztcbiAgICBmdW5jdGlvbiBsb29rdXAoc2ZJZDogbnVtYmVyKTogSVN0YWNrRnJhbWUge1xuICAgICAgcmV0dXJuIHN0YWNrRnJhbWVzW3NmSWRdO1xuICAgIH1cbiAgICByZXR1cm4gc3QubWFwKGxvb2t1cCk7XG4gIH1cblxuICAvKipcbiAgICogU2VyaWFsaXplIGludG8gYSBKU09OIG9iamVjdC5cbiAgICovXG4gIHB1YmxpYyB0b0pTT04oKTogSUJMZWFrUmVzdWx0cyB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGxlYWtzOiB0aGlzLmxlYWtzLm1hcChsZWFrUm9vdFRvSlNPTiksXG4gICAgICBzdGFja0ZyYW1lczogdGhpcy5zdGFja0ZyYW1lcyxcbiAgICAgIHNvdXJjZUZpbGVzOiB0aGlzLnNvdXJjZUZpbGVzLFxuICAgICAgaGVhcFN0YXRzOiB0aGlzLmhlYXBTdGF0cyxcbiAgICAgIHJhbmtpbmdFdmFsdWF0aW9uOiB0aGlzLnJhbmtpbmdFdmFsdWF0aW9uXG4gICAgfTtcbiAgfVxufVxuIl19