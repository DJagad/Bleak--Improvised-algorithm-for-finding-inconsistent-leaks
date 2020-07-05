"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const heap_growth_graph_1 = require("./heap_growth_graph");
class GrowthReductionTable extends React.Component {
    componentWillMount() {
        const rankEval = this.props.bleakResults.rankingEvaluation;
        const numLeaks = rankEval.leakShare.length;
        const rankings = ['leakShare', 'retainedSize', 'transitiveClosureSize'];
        const qs = [Math.floor(numLeaks * 0.25), Math.floor(numLeaks * 0.5), Math.floor(numLeaks * 0.75)];
        const state = {
            leakShare: null,
            retainedSize: null,
            transitiveClosureSize: null
        };
        // Check if zero point is same or different across rankings.
        // Hack for legacy airbnb data, which has different data for the "no
        // fixes" run across the three metrics (which we leverage to give us
        // tighter error bars on that number / repro the numbers in the paper).
        //
        // On all data produced by BLeak moving forward, the data for the "no fixes"
        // run is the same / shared across metrics -- so we just use the data reported
        // for one metric as the base case.
        let zeroPointData = rankEval.leakShare[0];
        if (zeroPointData[0][0].totalSize !== rankEval.retainedSize[0][0][0].totalSize) {
            // Different data, so can use.
            zeroPointData = [].concat(rankEval.leakShare[0], rankEval.retainedSize[0], rankEval.transitiveClosureSize[0]);
        }
        const zeroPoint = heap_growth_graph_1.averageGrowth(zeroPointData).mean;
        rankings.forEach((ranking) => {
            state[ranking] = qs.map((q) => (zeroPoint - heap_growth_graph_1.averageGrowth(rankEval[ranking][q]).mean) * 1024);
        });
        this.setState(state);
    }
    render() {
        const top = [0, 1, 2].map((i) => Math.max(this.state.leakShare[i], this.state.retainedSize[i], this.state.transitiveClosureSize[i]));
        function withinOnePercent(a, b) {
            // Handle case where a is negative.
            return (a + Math.abs(0.01 * a)) >= b;
        }
        const state = this.state;
        function cell(metric, i) {
            return React.createElement("td", { style: withinOnePercent(state[metric][i], top[i]) ? { fontWeight: 'bold' } : {} },
                state[metric][i].toFixed(2),
                " KB");
        }
        function row(metric, title) {
            return React.createElement("tr", null,
                React.createElement("th", { scope: "row" }, title),
                cell(metric, 0),
                cell(metric, 1),
                cell(metric, 2));
        }
        return React.createElement("div", null,
            React.createElement("table", { className: "table" },
                React.createElement("thead", null,
                    React.createElement("tr", null,
                        React.createElement("th", { scope: "col" }, "Metric"),
                        React.createElement("th", { scope: "col" }, "25%"),
                        React.createElement("th", { scope: "col" }, "50%"),
                        React.createElement("th", { scope: "col" }, "75%"))),
                React.createElement("tbody", null,
                    row('leakShare', 'LeakShare'),
                    row('retainedSize', 'Retained Size'),
                    row('transitiveClosureSize', 'Transitive Closure Size'))),
            React.createElement("p", null,
                React.createElement("b", null, "Bold"),
                " indicates greatest reduction (\u00B11%)."));
    }
}
exports.default = GrowthReductionTable;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3Jvd3RoX3JlZHVjdGlvbl90YWJsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy92aWV3ZXIvY29tcG9uZW50cy9ncm93dGhfcmVkdWN0aW9uX3RhYmxlLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLCtCQUErQjtBQUUvQiwyREFBa0Q7QUFZbEQsMEJBQTBDLFNBQVEsS0FBSyxDQUFDLFNBQStEO0lBQzlHLGtCQUFrQjtRQUN2QixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQztRQUMzRCxNQUFNLFFBQVEsR0FBRyxRQUFRLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQztRQUMzQyxNQUFNLFFBQVEsR0FBK0QsQ0FBQyxXQUFXLEVBQUUsY0FBYyxFQUFFLHVCQUF1QixDQUFDLENBQUE7UUFDbkksTUFBTSxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsR0FBRyxHQUFHLENBQUMsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ2xHLE1BQU0sS0FBSyxHQUE4QjtZQUN2QyxTQUFTLEVBQUUsSUFBSTtZQUNmLFlBQVksRUFBRSxJQUFJO1lBQ2xCLHFCQUFxQixFQUFFLElBQUk7U0FDNUIsQ0FBQztRQUNGLDREQUE0RDtRQUM1RCxvRUFBb0U7UUFDcEUsb0VBQW9FO1FBQ3BFLHVFQUF1RTtRQUN2RSxFQUFFO1FBQ0YsNEVBQTRFO1FBQzVFLDhFQUE4RTtRQUM5RSxtQ0FBbUM7UUFDbkMsSUFBSSxhQUFhLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMxQyxFQUFFLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FB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Q0FBQztvQkFDN0IsR0FBRyxDQUFDLGNBQWMsRUFBRSxlQUFlLENBQUM7b0JBQ3BDLEdBQUcsQ0FBQyx1QkFBdUIsRUFBRSx5QkFBeUIsQ0FBQyxDQUNsRCxDQUNGO1lBQUE7Z0JBQUcsc0NBQVc7NERBQXdDLENBQU0sQ0FBQTtJQUN0RSxDQUFDO0NBQ0Y7QUFsRUQsdUNBa0VDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IEJMZWFrUmVzdWx0cyBmcm9tICcuLi8uLi9saWIvYmxlYWtfcmVzdWx0cyc7XG5pbXBvcnQge2F2ZXJhZ2VHcm93dGh9IGZyb20gJy4vaGVhcF9ncm93dGhfZ3JhcGgnO1xuXG5pbnRlcmZhY2UgR3Jvd3RoUmVkdWN0aW9uVGFibGVQcm9wcyB7XG4gIGJsZWFrUmVzdWx0czogQkxlYWtSZXN1bHRzO1xufVxuXG5pbnRlcmZhY2UgR3Jvd3RoUmVkdWN0aW9uVGFibGVTdGF0ZSB7XG4gIGxlYWtTaGFyZTogbnVtYmVyW107XG4gIHJldGFpbmVkU2l6ZTogbnVtYmVyW107XG4gIHRyYW5zaXRpdmVDbG9zdXJlU2l6ZTogbnVtYmVyW107XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEdyb3d0aFJlZHVjdGlvblRhYmxlIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50PEdyb3d0aFJlZHVjdGlvblRhYmxlUHJvcHMsIEdyb3d0aFJlZHVjdGlvblRhYmxlU3RhdGU+IHtcbiAgcHVibGljIGNvbXBvbmVudFdpbGxNb3VudCgpIHtcbiAgICBjb25zdCByYW5rRXZhbCA9IHRoaXMucHJvcHMuYmxlYWtSZXN1bHRzLnJhbmtpbmdFdmFsdWF0aW9uO1xuICAgIGNvbnN0IG51bUxlYWtzID0gcmFua0V2YWwubGVha1NoYXJlLmxlbmd0aDtcbiAgICBjb25zdCByYW5raW5nczogKCdsZWFrU2hhcmUnIHwgJ3JldGFpbmVkU2l6ZScgfCAndHJhbnNpdGl2ZUNsb3N1cmVTaXplJylbXSA9IFsnbGVha1NoYXJlJywgJ3JldGFpbmVkU2l6ZScsICd0cmFuc2l0aXZlQ2xvc3VyZVNpemUnXVxuICAgIGNvbnN0IHFzID0gW01hdGguZmxvb3IobnVtTGVha3MgKiAwLjI1KSwgTWF0aC5mbG9vcihudW1MZWFrcyAqIDAuNSksIE1hdGguZmxvb3IobnVtTGVha3MgKiAwLjc1KV07XG4gICAgY29uc3Qgc3RhdGU6IEdyb3d0aFJlZHVjdGlvblRhYmxlU3RhdGUgPSB7XG4gICAgICBsZWFrU2hhcmU6IG51bGwsXG4gICAgICByZXRhaW5lZFNpemU6IG51bGwsXG4gICAgICB0cmFuc2l0aXZlQ2xvc3VyZVNpemU6IG51bGxcbiAgICB9O1xuICAgIC8vIENoZWNrIGlmIHplcm8gcG9pbnQgaXMgc2FtZSBvciBkaWZmZXJlbnQgYWNyb3NzIHJhbmtpbmdzLlxuICAgIC8vIEhhY2sgZm9yIGxlZ2FjeSBhaXJibmIgZGF0YSwgd2hpY2ggaGFzIGRpZmZlcmVudCBkYXRhIGZvciB0aGUgXCJub1xuICAgIC8vIGZpeGVzXCIgcnVuIGFjcm9zcyB0aGUgdGhyZWUgbWV0cmljcyAod2hpY2ggd2UgbGV2ZXJhZ2UgdG8gZ2l2ZSB1c1xuICAgIC8vIHRpZ2h0ZXIgZXJyb3IgYmFycyBvbiB0aGF0IG51bWJlciAvIHJlcHJvIHRoZSBudW1iZXJzIGluIHRoZSBwYXBlcikuXG4gICAgLy9cbiAgICAvLyBPbiBhbGwgZGF0YSBwcm9kdWNlZCBieSBCTGVhayBtb3ZpbmcgZm9yd2FyZCwgdGhlIGRhdGEgZm9yIHRoZSBcIm5vIGZpeGVzXCJcbiAgICAvLyBydW4gaXMgdGhlIHNhbWUgLyBzaGFyZWQgYWNyb3NzIG1ldHJpY3MgLS0gc28gd2UganVzdCB1c2UgdGhlIGRhdGEgcmVwb3J0ZWRcbiAgICAvLyBmb3Igb25lIG1ldHJpYyBhcyB0aGUgYmFzZSBjYXNlLlxuICAgIGxldCB6ZXJvUG9pbnREYXRhID0gcmFua0V2YWwubGVha1NoYXJlWzBdO1xuICAgIGlmICh6ZXJvUG9pbnREYXRhWzBdWzBdLnRvdGFsU2l6ZSAhPT0gcmFua0V2YWwucmV0YWluZWRTaXplWzBdWzBdWzBdLnRvdGFsU2l6ZSkge1xuICAgICAgLy8gRGlmZmVyZW50IGRhdGEsIHNvIGNhbiB1c2UuXG4gICAgICB6ZXJvUG9pbnREYXRhID0gW10uY29uY2F0KHJhbmtFdmFsLmxlYWtTaGFyZVswXSwgcmFua0V2YWwucmV0YWluZWRTaXplWzBdLCByYW5rRXZhbC50cmFuc2l0aXZlQ2xvc3VyZVNpemVbMF0pO1xuICAgIH1cbiAgICBjb25zdCB6ZXJvUG9pbnQgPSBhdmVyYWdlR3Jvd3RoKHplcm9Qb2ludERhdGEpLm1lYW47XG4gICAgcmFua2luZ3MuZm9yRWFjaCgocmFua2luZykgPT4ge1xuICAgICAgc3RhdGVbcmFua2luZ10gPSBxcy5tYXAoKHEpID0+ICh6ZXJvUG9pbnQgLSBhdmVyYWdlR3Jvd3RoKHJhbmtFdmFsW3JhbmtpbmddW3FdKS5tZWFuKSAqIDEwMjQpO1xuICAgIH0pO1xuICAgIHRoaXMuc2V0U3RhdGUoc3RhdGUpO1xuICB9XG4gIHB1YmxpYyByZW5kZXIoKSB7XG4gICAgY29uc3QgdG9wID0gWzAsMSwyXS5tYXAoKGkpID0+IE1hdGgubWF4KHRoaXMuc3RhdGUubGVha1NoYXJlW2ldLCB0aGlzLnN0YXRlLnJldGFpbmVkU2l6ZVtpXSwgdGhpcy5zdGF0ZS50cmFuc2l0aXZlQ2xvc3VyZVNpemVbaV0pKTtcbiAgICBmdW5jdGlvbiB3aXRoaW5PbmVQZXJjZW50KGE6IG51bWJlciwgYjogbnVtYmVyKTogYm9vbGVhbiB7XG4gICAgICAvLyBIYW5kbGUgY2FzZSB3aGVyZSBhIGlzIG5lZ2F0aXZlLlxuICAgICAgcmV0dXJuIChhICsgTWF0aC5hYnMoMC4wMSAqIGEpKSA+PSBiO1xuICAgIH1cbiAgICBjb25zdCBzdGF0ZSA9IHRoaXMuc3RhdGU7XG4gICAgZnVuY3Rpb24gY2VsbChtZXRyaWM6ICdsZWFrU2hhcmUnIHwgJ3JldGFpbmVkU2l6ZScgfCAndHJhbnNpdGl2ZUNsb3N1cmVTaXplJywgaTogbnVtYmVyKSB7XG4gICAgICByZXR1cm4gPHRkIHN0eWxlPXsgd2l0aGluT25lUGVyY2VudChzdGF0ZVttZXRyaWNdW2ldLCB0b3BbaV0pID8geyBmb250V2VpZ2h0OiAnYm9sZCcgfSA6IHt9IH0+e3N0YXRlW21ldHJpY11baV0udG9GaXhlZCgyKX0gS0I8L3RkPjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByb3cobWV0cmljOiAnbGVha1NoYXJlJyB8ICdyZXRhaW5lZFNpemUnIHwgJ3RyYW5zaXRpdmVDbG9zdXJlU2l6ZScsIHRpdGxlOiBzdHJpbmcpIHtcbiAgICAgIHJldHVybiA8dHI+XG4gICAgICAgIDx0aCBzY29wZT1cInJvd1wiPnt0aXRsZX08L3RoPlxuICAgICAgICB7Y2VsbChtZXRyaWMsIDApfVxuICAgICAgICB7Y2VsbChtZXRyaWMsIDEpfVxuICAgICAgICB7Y2VsbChtZXRyaWMsIDIpfVxuICAgICAgPC90cj47XG4gICAgfVxuXG4gICAgcmV0dXJuIDxkaXY+PHRhYmxlIGNsYXNzTmFtZT1cInRhYmxlXCI+XG4gICAgICA8dGhlYWQ+XG4gICAgICAgIDx0cj5cbiAgICAgICAgICA8dGggc2NvcGU9XCJjb2xcIj5NZXRyaWM8L3RoPlxuICAgICAgICAgIDx0aCBzY29wZT1cImNvbFwiPjI1JTwvdGg+XG4gICAgICAgICAgPHRoIHNjb3BlPVwiY29sXCI+NTAlPC90aD5cbiAgICAgICAgICA8dGggc2NvcGU9XCJjb2xcIj43NSU8L3RoPlxuICAgICAgICA8L3RyPlxuICAgICAgPC90aGVhZD5cbiAgICAgIDx0Ym9keT5cbiAgICAgICAge3JvdygnbGVha1NoYXJlJywgJ0xlYWtTaGFyZScpfVxuICAgICAgICB7cm93KCdyZXRhaW5lZFNpemUnLCAnUmV0YWluZWQgU2l6ZScpfVxuICAgICAgICB7cm93KCd0cmFuc2l0aXZlQ2xvc3VyZVNpemUnLCAnVHJhbnNpdGl2ZSBDbG9zdXJlIFNpemUnKX1cbiAgICAgIDwvdGJvZHk+XG4gICAgPC90YWJsZT48cD48Yj5Cb2xkPC9iPiBpbmRpY2F0ZXMgZ3JlYXRlc3QgcmVkdWN0aW9uICjCsTElKS48L3A+PC9kaXY+XG4gIH1cbn1cbiJdfQ==