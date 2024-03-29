import pathToString from './path_to_string';
/**
 * Converts a LeakRoot into a subsection of the report.
 * @param l
 * @param metric
 * @param rank
 */
function leakToString(results, l, metric, rank) {
    var paths = l.paths.map(pathToString);
    return "## LeakRoot Ranked " + rank + " [Score: " + l.scores[metric] + "]\n\n### GC Paths\n\n* " + paths.join('\n* ') + "\n\n### Stack Traces Responsible\n\n" + l.stacks.map(function (stack, i) {
        return "\n" + stack.filter(function (v, i) { return i < 10; }).map(function (f, j) {
            var frame = results.stackFrames[f];
            return "        [" + j + "] " + frame[3] + " " + frame[0] + ":" + frame[1] + ":" + frame[2];
        }).join("\n") + (stack.length > 10 ? "\n        (" + (stack.length - 10) + " more...)" : "") + "\n";
    }).join("\n") + "\n";
}
/**
 * Converts a specific sequence of LeakRoots into a section of the report.
 * @param results
 * @param leaksInOrder
 * @param metric
 */
function leaksToString(results, leaksInOrder, metric) {
    return leaksInOrder.map(function (l, i) { return leakToString(results, l, metric, i + 1); }).join("\n");
}
/**
 * Given a set of BLeak results, prints a human-readable text report.
 * @param results
 */
export default function TextReporter(results) {
    var leaks = results.leaks;
    if (leaks.length === 0) {
        return "No leaks found.";
    }
    var metrics = [["LeakShare", "leakShare"], ["Retained Size", "retainedSize"], ["Transitive Closure Size", "transitiveClosureSize"]];
    return metrics.map(function (m) {
        return "# LeakRoots Ranked By " + m[0] + "\n" + leaksToString(results, results.leaks.sort(function (a, b) { return b.scores[m[1]] - a.scores[m[1]]; }), m[1]) + "\n\n";
    }).join("\n");
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dF9yZXBvcnRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9saWIvdGV4dF9yZXBvcnRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLFlBQVksTUFBTSxrQkFBa0IsQ0FBQztBQU01Qzs7Ozs7R0FLRztBQUNILHNCQUFzQixPQUFxQixFQUFFLENBQVcsRUFBRSxNQUFrQixFQUFFLElBQVk7SUFDeEYsSUFBTSxLQUFLLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUM7SUFDeEMsTUFBTSxDQUFDLHdCQUFzQixJQUFJLGlCQUFZLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLCtCQUkzRCxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyw0Q0FJcEIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsVUFBQyxLQUFLLEVBQUUsQ0FBQztRQUN0QixNQUFNLENBQUMsT0FDUCxLQUFLLENBQUMsTUFBTSxDQUFDLFVBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSyxPQUFBLENBQUMsR0FBRyxFQUFFLEVBQU4sQ0FBTSxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQUMsQ0FBQyxFQUFFLENBQUM7WUFDeEMsSUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNyQyxNQUFNLENBQUMsY0FBWSxDQUFDLFVBQUssS0FBSyxDQUFDLENBQUMsQ0FBQyxTQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsU0FBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLFNBQUksS0FBSyxDQUFDLENBQUMsQ0FBRyxDQUFDO1FBQzFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBRyxLQUFLLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsaUJBQWMsS0FBSyxDQUFDLE1BQU0sR0FBRyxFQUFFLGVBQVcsQ0FBQyxDQUFDLENBQUMsRUFBRSxRQUNsRixDQUFDO0lBQ0YsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUNaLENBQUM7QUFDRixDQUFDO0FBRUQ7Ozs7O0dBS0c7QUFDSCx1QkFBdUIsT0FBcUIsRUFBRSxZQUF3QixFQUFFLE1BQWtCO0lBQ3hGLE1BQU0sQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLFVBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSyxPQUFBLFlBQVksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQXZDLENBQXVDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDeEYsQ0FBQztBQUVEOzs7R0FHRztBQUNILE1BQU0sQ0FBQyxPQUFPLHVCQUF1QixPQUFxQjtJQUN4RCxJQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDO0lBQzVCLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN2QixNQUFNLENBQUMsaUJBQWlCLENBQUM7SUFDM0IsQ0FBQztJQUNELElBQU0sT0FBTyxHQUEyQixDQUFDLENBQUMsV0FBVyxFQUFFLFdBQVcsQ0FBQyxFQUFFLENBQUMsZUFBZSxFQUFFLGNBQWMsQ0FBQyxFQUFFLENBQUMseUJBQXlCLEVBQUUsdUJBQXVCLENBQUMsQ0FBQyxDQUFDO0lBQzlKLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQUMsQ0FBQztRQUNuQixNQUFNLENBQUMsMkJBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBSyxhQUFhLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFVBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSyxPQUFBLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBL0IsQ0FBK0IsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFNLENBQUM7SUFDN0ksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ2hCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgcGF0aFRvU3RyaW5nIGZyb20gJy4vcGF0aF90b19zdHJpbmcnO1xuaW1wb3J0IEJMZWFrUmVzdWx0cyBmcm9tICcuL2JsZWFrX3Jlc3VsdHMnO1xuaW1wb3J0IExlYWtSb290IGZyb20gJy4vbGVha19yb290JztcblxudHlwZSBNZXRyaWNUeXBlID0gXCJyZXRhaW5lZFNpemVcIiB8IFwibGVha1NoYXJlXCIgfCBcInRyYW5zaXRpdmVDbG9zdXJlU2l6ZVwiO1xuXG4vKipcbiAqIENvbnZlcnRzIGEgTGVha1Jvb3QgaW50byBhIHN1YnNlY3Rpb24gb2YgdGhlIHJlcG9ydC5cbiAqIEBwYXJhbSBsXG4gKiBAcGFyYW0gbWV0cmljXG4gKiBAcGFyYW0gcmFua1xuICovXG5mdW5jdGlvbiBsZWFrVG9TdHJpbmcocmVzdWx0czogQkxlYWtSZXN1bHRzLCBsOiBMZWFrUm9vdCwgbWV0cmljOiBNZXRyaWNUeXBlLCByYW5rOiBudW1iZXIpOiBzdHJpbmcge1xuICBjb25zdCBwYXRocyA9IGwucGF0aHMubWFwKHBhdGhUb1N0cmluZyk7XG4gIHJldHVybiBgIyMgTGVha1Jvb3QgUmFua2VkICR7cmFua30gW1Njb3JlOiAke2wuc2NvcmVzW21ldHJpY119XVxuXG4jIyMgR0MgUGF0aHNcblxuKiAke3BhdGhzLmpvaW4oJ1xcbiogJyl9XG5cbiMjIyBTdGFjayBUcmFjZXMgUmVzcG9uc2libGVcblxuJHtsLnN0YWNrcy5tYXAoKHN0YWNrLCBpKSA9PiB7XG4gIHJldHVybiBgXG4ke3N0YWNrLmZpbHRlcigodiwgaSkgPT4gaSA8IDEwKS5tYXAoKGYsIGopID0+IHtcbiAgY29uc3QgZnJhbWUgPSByZXN1bHRzLnN0YWNrRnJhbWVzW2ZdO1xuICByZXR1cm4gYCAgICAgICAgWyR7an1dICR7ZnJhbWVbM119ICR7ZnJhbWVbMF19OiR7ZnJhbWVbMV19OiR7ZnJhbWVbMl19YDtcbn0pLmpvaW4oXCJcXG5cIil9JHtzdGFjay5sZW5ndGggPiAxMCA/IGBcXG4gICAgICAgICgke3N0YWNrLmxlbmd0aCAtIDEwfSBtb3JlLi4uKWAgOiBgYH1cbmA7XG59KS5qb2luKFwiXFxuXCIpfVxuYDtcbn1cblxuLyoqXG4gKiBDb252ZXJ0cyBhIHNwZWNpZmljIHNlcXVlbmNlIG9mIExlYWtSb290cyBpbnRvIGEgc2VjdGlvbiBvZiB0aGUgcmVwb3J0LlxuICogQHBhcmFtIHJlc3VsdHNcbiAqIEBwYXJhbSBsZWFrc0luT3JkZXJcbiAqIEBwYXJhbSBtZXRyaWNcbiAqL1xuZnVuY3Rpb24gbGVha3NUb1N0cmluZyhyZXN1bHRzOiBCTGVha1Jlc3VsdHMsIGxlYWtzSW5PcmRlcjogTGVha1Jvb3RbXSwgbWV0cmljOiBNZXRyaWNUeXBlKTogc3RyaW5nIHtcbiAgcmV0dXJuIGxlYWtzSW5PcmRlci5tYXAoKGwsIGkpID0+IGxlYWtUb1N0cmluZyhyZXN1bHRzLCBsLCBtZXRyaWMsIGkgKyAxKSkuam9pbihcIlxcblwiKTtcbn1cblxuLyoqXG4gKiBHaXZlbiBhIHNldCBvZiBCTGVhayByZXN1bHRzLCBwcmludHMgYSBodW1hbi1yZWFkYWJsZSB0ZXh0IHJlcG9ydC5cbiAqIEBwYXJhbSByZXN1bHRzXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIFRleHRSZXBvcnRlcihyZXN1bHRzOiBCTGVha1Jlc3VsdHMpOiBzdHJpbmcge1xuICBjb25zdCBsZWFrcyA9IHJlc3VsdHMubGVha3M7XG4gIGlmIChsZWFrcy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gXCJObyBsZWFrcyBmb3VuZC5cIjtcbiAgfVxuICBjb25zdCBtZXRyaWNzOiBbc3RyaW5nLCBNZXRyaWNUeXBlXVtdID0gW1tcIkxlYWtTaGFyZVwiLCBcImxlYWtTaGFyZVwiXSwgW1wiUmV0YWluZWQgU2l6ZVwiLCBcInJldGFpbmVkU2l6ZVwiXSwgW1wiVHJhbnNpdGl2ZSBDbG9zdXJlIFNpemVcIiwgXCJ0cmFuc2l0aXZlQ2xvc3VyZVNpemVcIl1dO1xuICByZXR1cm4gbWV0cmljcy5tYXAoKG0pID0+IHtcbiAgICByZXR1cm4gYCMgTGVha1Jvb3RzIFJhbmtlZCBCeSAke21bMF19XFxuJHtsZWFrc1RvU3RyaW5nKHJlc3VsdHMsIHJlc3VsdHMubGVha3Muc29ydCgoYSwgYikgPT4gYi5zY29yZXNbbVsxXV0gLSBhLnNjb3Jlc1ttWzFdXSksIG1bMV0pfVxcblxcbmA7XG4gIH0pLmpvaW4oXCJcXG5cIik7XG59Il19