import * as tslib_1 from "tslib";
import * as React from 'react';
import { averageGrowth } from './heap_growth_graph';
var GrowthReductionTable = /** @class */ (function (_super) {
    tslib_1.__extends(GrowthReductionTable, _super);
    function GrowthReductionTable() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    GrowthReductionTable.prototype.componentWillMount = function () {
        var rankEval = this.props.bleakResults.rankingEvaluation;
        var numLeaks = rankEval.leakShare.length;
        var rankings = ['leakShare', 'retainedSize', 'transitiveClosureSize'];
        var qs = [Math.floor(numLeaks * 0.25), Math.floor(numLeaks * 0.5), Math.floor(numLeaks * 0.75)];
        var state = {
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
        var zeroPointData = rankEval.leakShare[0];
        if (zeroPointData[0][0].totalSize !== rankEval.retainedSize[0][0][0].totalSize) {
            // Different data, so can use.
            zeroPointData = [].concat(rankEval.leakShare[0], rankEval.retainedSize[0], rankEval.transitiveClosureSize[0]);
        }
        var zeroPoint = averageGrowth(zeroPointData).mean;
        rankings.forEach(function (ranking) {
            state[ranking] = qs.map(function (q) { return (zeroPoint - averageGrowth(rankEval[ranking][q]).mean) * 1024; });
        });
        this.setState(state);
    };
    GrowthReductionTable.prototype.render = function () {
        var _this = this;
        var top = [0, 1, 2].map(function (i) { return Math.max(_this.state.leakShare[i], _this.state.retainedSize[i], _this.state.transitiveClosureSize[i]); });
        function withinOnePercent(a, b) {
            // Handle case where a is negative.
            return (a + Math.abs(0.01 * a)) >= b;
        }
        var state = this.state;
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
    };
    return GrowthReductionTable;
}(React.Component));
export default GrowthReductionTable;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3Jvd3RoX3JlZHVjdGlvbl90YWJsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy92aWV3ZXIvY29tcG9uZW50cy9ncm93dGhfcmVkdWN0aW9uX3RhYmxlLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxLQUFLLEtBQUssTUFBTSxPQUFPLENBQUM7QUFFL0IsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBWWxEO0lBQWtELGdEQUFxRTtJQUF2SDs7SUFrRUEsQ0FBQztJQWpFUSxpREFBa0IsR0FBekI7UUFDRSxJQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQztRQUMzRCxJQUFNLFFBQVEsR0FBRyxRQUFRLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQztRQUMzQyxJQUFNLFFBQVEsR0FBK0QsQ0FBQyxXQUFXLEVBQUUsY0FBYyxFQUFFLHVCQUF1QixDQUFDLENBQUE7UUFDbkksSUFBTSxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsR0FBRyxHQUFHLENBQUMsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ2xHLElBQU0sS0FBSyxHQUE4QjtZQUN2QyxTQUFTLEVBQUUsSUFBSTtZQUNmLFlBQVksRUFBRSxJQUFJO1lBQ2xCLHFCQUFxQixFQUFFLElBQUk7U0FDNUIsQ0FBQztRQUNGLDREQUE0RDtRQUM1RCxvRUFBb0U7UUFDcEUsb0VBQW9FO1FBQ3BFLHVFQUF1RTtRQUN2RSxFQUFFO1FBQ0YsNEVBQTRFO1FBQzVFLDhFQUE4RTtRQUM5RSxtQ0FBbUM7UUFDbkMsSUFBSSxhQUFhLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMx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d0JBQ3hCLDRCQUFJLEtBQUssRUFBQyxLQUFLLFVBQVMsQ0FDckIsQ0FDQztnQkFDUjtvQkFDRyxHQUFHLENBQUMsV0FBVyxFQUFFLFdBQVcsQ0FBQztvQkFDN0IsR0FBRyxDQUFDLGNBQWMsRUFBRSxlQUFlLENBQUM7b0JBQ3BDLEdBQUcsQ0FBQyx1QkFBdUIsRUFBRSx5QkFBeUIsQ0FBQyxDQUNsRCxDQUNGO1lBQUE7Z0JBQUcsc0NBQVc7NERBQXdDLENBQU0sQ0FBQTtJQUN0RSxDQUFDO0lBQ0gsMkJBQUM7QUFBRCxDQUFDLEFBbEVELENBQWtELEtBQUssQ0FBQyxTQUFTLEdBa0VoRSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBCTGVha1Jlc3VsdHMgZnJvbSAnLi4vLi4vbGliL2JsZWFrX3Jlc3VsdHMnO1xuaW1wb3J0IHthdmVyYWdlR3Jvd3RofSBmcm9tICcuL2hlYXBfZ3Jvd3RoX2dyYXBoJztcblxuaW50ZXJmYWNlIEdyb3d0aFJlZHVjdGlvblRhYmxlUHJvcHMge1xuICBibGVha1Jlc3VsdHM6IEJMZWFrUmVzdWx0cztcbn1cblxuaW50ZXJmYWNlIEdyb3d0aFJlZHVjdGlvblRhYmxlU3RhdGUge1xuICBsZWFrU2hhcmU6IG51bWJlcltdO1xuICByZXRhaW5lZFNpemU6IG51bWJlcltdO1xuICB0cmFuc2l0aXZlQ2xvc3VyZVNpemU6IG51bWJlcltdO1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBHcm93dGhSZWR1Y3Rpb25UYWJsZSBleHRlbmRzIFJlYWN0LkNvbXBvbmVudDxHcm93dGhSZWR1Y3Rpb25UYWJsZVByb3BzLCBHcm93dGhSZWR1Y3Rpb25UYWJsZVN0YXRlPiB7XG4gIHB1YmxpYyBjb21wb25lbnRXaWxsTW91bnQoKSB7XG4gICAgY29uc3QgcmFua0V2YWwgPSB0aGlzLnByb3BzLmJsZWFrUmVzdWx0cy5yYW5raW5nRXZhbHVhdGlvbjtcbiAgICBjb25zdCBudW1MZWFrcyA9IHJhbmtFdmFsLmxlYWtTaGFyZS5sZW5ndGg7XG4gICAgY29uc3QgcmFua2luZ3M6ICgnbGVha1NoYXJlJyB8ICdyZXRhaW5lZFNpemUnIHwgJ3RyYW5zaXRpdmVDbG9zdXJlU2l6ZScpW10gPSBbJ2xlYWtTaGFyZScsICdyZXRhaW5lZFNpemUnLCAndHJhbnNpdGl2ZUNsb3N1cmVTaXplJ11cbiAgICBjb25zdCBxcyA9IFtNYXRoLmZsb29yKG51bUxlYWtzICogMC4yNSksIE1hdGguZmxvb3IobnVtTGVha3MgKiAwLjUpLCBNYXRoLmZsb29yKG51bUxlYWtzICogMC43NSldO1xuICAgIGNvbnN0IHN0YXRlOiBHcm93dGhSZWR1Y3Rpb25UYWJsZVN0YXRlID0ge1xuICAgICAgbGVha1NoYXJlOiBudWxsLFxuICAgICAgcmV0YWluZWRTaXplOiBudWxsLFxuICAgICAgdHJhbnNpdGl2ZUNsb3N1cmVTaXplOiBudWxsXG4gICAgfTtcbiAgICAvLyBDaGVjayBpZiB6ZXJvIHBvaW50IGlzIHNhbWUgb3IgZGlmZmVyZW50IGFjcm9zcyByYW5raW5ncy5cbiAgICAvLyBIYWNrIGZvciBsZWdhY3kgYWlyYm5iIGRhdGEsIHdoaWNoIGhhcyBkaWZmZXJlbnQgZGF0YSBmb3IgdGhlIFwibm9cbiAgICAvLyBmaXhlc1wiIHJ1biBhY3Jvc3MgdGhlIHRocmVlIG1ldHJpY3MgKHdoaWNoIHdlIGxldmVyYWdlIHRvIGdpdmUgdXNcbiAgICAvLyB0aWdodGVyIGVycm9yIGJhcnMgb24gdGhhdCBudW1iZXIgLyByZXBybyB0aGUgbnVtYmVycyBpbiB0aGUgcGFwZXIpLlxuICAgIC8vXG4gICAgLy8gT24gYWxsIGRhdGEgcHJvZHVjZWQgYnkgQkxlYWsgbW92aW5nIGZvcndhcmQsIHRoZSBkYXRhIGZvciB0aGUgXCJubyBmaXhlc1wiXG4gICAgLy8gcnVuIGlzIHRoZSBzYW1lIC8gc2hhcmVkIGFjcm9zcyBtZXRyaWNzIC0tIHNvIHdlIGp1c3QgdXNlIHRoZSBkYXRhIHJlcG9ydGVkXG4gICAgLy8gZm9yIG9uZSBtZXRyaWMgYXMgdGhlIGJhc2UgY2FzZS5cbiAgICBsZXQgemVyb1BvaW50RGF0YSA9IHJhbmtFdmFsLmxlYWtTaGFyZVswXTtcbiAgICBpZiAoemVyb1BvaW50RGF0YVswXVswXS50b3RhbFNpemUgIT09IHJhbmtFdmFsLnJldGFpbmVkU2l6ZVswXVswXVswXS50b3RhbFNpemUpIHtcbiAgICAgIC8vIERpZmZlcmVudCBkYXRhLCBzbyBjYW4gdXNlLlxuICAgICAgemVyb1BvaW50RGF0YSA9IFtdLmNvbmNhdChyYW5rRXZhbC5sZWFrU2hhcmVbMF0sIHJhbmtFdmFsLnJldGFpbmVkU2l6ZVswXSwgcmFua0V2YWwudHJhbnNpdGl2ZUNsb3N1cmVTaXplWzBdKTtcbiAgICB9XG4gICAgY29uc3QgemVyb1BvaW50ID0gYXZlcmFnZUdyb3d0aCh6ZXJvUG9pbnREYXRhKS5tZWFuO1xuICAgIHJhbmtpbmdzLmZvckVhY2goKHJhbmtpbmcpID0+IHtcbiAgICAgIHN0YXRlW3JhbmtpbmddID0gcXMubWFwKChxKSA9PiAoemVyb1BvaW50IC0gYXZlcmFnZUdyb3d0aChyYW5rRXZhbFtyYW5raW5nXVtxXSkubWVhbikgKiAxMDI0KTtcbiAgICB9KTtcbiAgICB0aGlzLnNldFN0YXRlKHN0YXRlKTtcbiAgfVxuICBwdWJsaWMgcmVuZGVyKCkge1xuICAgIGNvbnN0IHRvcCA9IFswLDEsMl0ubWFwKChpKSA9PiBNYXRoLm1heCh0aGlzLnN0YXRlLmxlYWtTaGFyZVtpXSwgdGhpcy5zdGF0ZS5yZXRhaW5lZFNpemVbaV0sIHRoaXMuc3RhdGUudHJhbnNpdGl2ZUNsb3N1cmVTaXplW2ldKSk7XG4gICAgZnVuY3Rpb24gd2l0aGluT25lUGVyY2VudChhOiBudW1iZXIsIGI6IG51bWJlcik6IGJvb2xlYW4ge1xuICAgICAgLy8gSGFuZGxlIGNhc2Ugd2hlcmUgYSBpcyBuZWdhdGl2ZS5cbiAgICAgIHJldHVybiAoYSArIE1hdGguYWJzKDAuMDEgKiBhKSkgPj0gYjtcbiAgICB9XG4gICAgY29uc3Qgc3RhdGUgPSB0aGlzLnN0YXRlO1xuICAgIGZ1bmN0aW9uIGNlbGwobWV0cmljOiAnbGVha1NoYXJlJyB8ICdyZXRhaW5lZFNpemUnIHwgJ3RyYW5zaXRpdmVDbG9zdXJlU2l6ZScsIGk6IG51bWJlcikge1xuICAgICAgcmV0dXJuIDx0ZCBzdHlsZT17IHdpdGhpbk9uZVBlcmNlbnQoc3RhdGVbbWV0cmljXVtpXSwgdG9wW2ldKSA/IHsgZm9udFdlaWdodDogJ2JvbGQnIH0gOiB7fSB9PntzdGF0ZVttZXRyaWNdW2ldLnRvRml4ZWQoMil9IEtCPC90ZD47XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcm93KG1ldHJpYzogJ2xlYWtTaGFyZScgfCAncmV0YWluZWRTaXplJyB8ICd0cmFuc2l0aXZlQ2xvc3VyZVNpemUnLCB0aXRsZTogc3RyaW5nKSB7XG4gICAgICByZXR1cm4gPHRyPlxuICAgICAgICA8dGggc2NvcGU9XCJyb3dcIj57dGl0bGV9PC90aD5cbiAgICAgICAge2NlbGwobWV0cmljLCAwKX1cbiAgICAgICAge2NlbGwobWV0cmljLCAxKX1cbiAgICAgICAge2NlbGwobWV0cmljLCAyKX1cbiAgICAgIDwvdHI+O1xuICAgIH1cblxuICAgIHJldHVybiA8ZGl2Pjx0YWJsZSBjbGFzc05hbWU9XCJ0YWJsZVwiPlxuICAgICAgPHRoZWFkPlxuICAgICAgICA8dHI+XG4gICAgICAgICAgPHRoIHNjb3BlPVwiY29sXCI+TWV0cmljPC90aD5cbiAgICAgICAgICA8dGggc2NvcGU9XCJjb2xcIj4yNSU8L3RoPlxuICAgICAgICAgIDx0aCBzY29wZT1cImNvbFwiPjUwJTwvdGg+XG4gICAgICAgICAgPHRoIHNjb3BlPVwiY29sXCI+NzUlPC90aD5cbiAgICAgICAgPC90cj5cbiAgICAgIDwvdGhlYWQ+XG4gICAgICA8dGJvZHk+XG4gICAgICAgIHtyb3coJ2xlYWtTaGFyZScsICdMZWFrU2hhcmUnKX1cbiAgICAgICAge3JvdygncmV0YWluZWRTaXplJywgJ1JldGFpbmVkIFNpemUnKX1cbiAgICAgICAge3JvdygndHJhbnNpdGl2ZUNsb3N1cmVTaXplJywgJ1RyYW5zaXRpdmUgQ2xvc3VyZSBTaXplJyl9XG4gICAgICA8L3Rib2R5PlxuICAgIDwvdGFibGU+PHA+PGI+Qm9sZDwvYj4gaW5kaWNhdGVzIGdyZWF0ZXN0IHJlZHVjdGlvbiAowrExJSkuPC9wPjwvZGl2PlxuICB9XG59XG4iXX0=