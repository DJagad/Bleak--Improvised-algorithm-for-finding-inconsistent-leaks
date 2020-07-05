import * as tslib_1 from "tslib";
import * as React from 'react';
import { scaleLinear as d3ScaleLinear, line as d3Line, select as d3Select, axisBottom, axisLeft, mean, deviation, max, min, zip as d3Zip, range as d3Range } from 'd3';
var BYTES_PER_MB = 1024 * 1024;
function getLine(name, sss) {
    var rv = { name: name, value: [], se: [] };
    var numDataPoints = sss[0].length;
    var _loop_1 = function (i) {
        var values = sss.map(function (ss) { return ss[i].totalSize / BYTES_PER_MB; });
        rv.value.push(mean(values));
        if (values.length > 1) {
            rv.se.push(deviation(values) / Math.sqrt(values.length));
        }
    };
    for (var i = 0; i < numDataPoints; i++) {
        _loop_1(i);
    }
    if (rv.se.length === 0) {
        rv.se = undefined;
    }
    return rv;
}
function countNonNull(count, a) {
    if (Array.isArray(a)) {
        var aCount = a.reduce(countNonNull, 0);
        if (aCount !== a.length) {
            return count;
        }
        else {
            return count + 1;
        }
    }
    if (a) {
        return count + 1;
    }
    else {
        return count;
    }
}
function distillResults(results) {
    if (!isRankingEvaluationComplete(results)) {
        return [{
                name: 'No Leaks Fixed',
                value: results.heapStats.map(function (hs) { return hs.totalSize / BYTES_PER_MB; })
            }];
    }
    var numLeaks = results.rankingEvaluation.leakShare.length;
    var zeroLeaksFixed = results.rankingEvaluation.leakShare[0];
    var allLeaksFixed = results.rankingEvaluation.leakShare[numLeaks - 1];
    // Make sure all of the data is there!
    if (!zeroLeaksFixed || !allLeaksFixed || zeroLeaksFixed.reduce(countNonNull, 0) < zeroLeaksFixed.length || allLeaksFixed.reduce(countNonNull, 0) < allLeaksFixed.length) {
        throw new Error();
    }
    // Calculate into a line.
    return [getLine('No Leaks Fixed', zeroLeaksFixed), getLine('All Leaks Fixed', allLeaksFixed)];
}
export function isRankingEvaluationComplete(results) {
    var numLeaks = results.rankingEvaluation.leakShare.length;
    try {
        var zeroLeaksFixed = results.rankingEvaluation.leakShare[0];
        var allLeaksFixed = results.rankingEvaluation.leakShare[numLeaks - 1];
        // Make sure all of the data is there!
        if (!zeroLeaksFixed || !allLeaksFixed || zeroLeaksFixed.reduce(countNonNull, 0) < zeroLeaksFixed.length || allLeaksFixed.reduce(countNonNull, 0) < allLeaksFixed.length) {
            return false;
        }
        return true;
    }
    catch (e) {
        return false;
    }
}
export function averageGrowth(data) {
    // HS => Growth
    var growthData = data.map(function (d, i) { return d.slice(1).map(function (d, j) { return (d.totalSize - data[i][j].totalSize) / BYTES_PER_MB; }); });
    // Growth => Avg Growth
    var avgGrowths = [];
    var iterations = data[0].length;
    var _loop_2 = function (i) {
        avgGrowths.push(mean(growthData.map(function (d) { return d[i]; })));
    };
    for (var i = 0; i < iterations; i++) {
        _loop_2(i);
    }
    var se = deviation(avgGrowths.slice(5)) / Math.sqrt(avgGrowths.length - 5);
    var meanData = mean(avgGrowths.slice(5));
    if (isNaN(se)) {
        return {
            mean: meanData
        };
    }
    return {
        mean: meanData,
        se: se
    };
}
export function averageGrowthReduction(avgGrowthNoFixed, allFixed) {
    var avgGrowthAllFixed = averageGrowth(allFixed);
    var growthReduction = avgGrowthNoFixed.mean - avgGrowthAllFixed.mean;
    var percent = 100 * (growthReduction / avgGrowthNoFixed.mean);
    if (avgGrowthNoFixed.se !== undefined) {
        var growthReductionSe = Math.sqrt(Math.pow(avgGrowthAllFixed.se, 2) + Math.pow(avgGrowthNoFixed.se, 2));
        var percentSe = 100 * Math.abs((avgGrowthNoFixed.mean - avgGrowthAllFixed.mean) / avgGrowthNoFixed.mean) * Math.sqrt(Math.pow(growthReductionSe / growthReduction, 2) + Math.pow(avgGrowthNoFixed.se / avgGrowthNoFixed.mean, 2));
        return {
            mean: growthReduction,
            se: growthReductionSe,
            percent: percent,
            percentSe: percentSe
        };
    }
    else {
        return {
            mean: growthReduction,
            percent: percent
        };
    }
}
// TODO: Support toggling different size stats, not just totalSize.
var HeapGrowthGraph = /** @class */ (function (_super) {
    tslib_1.__extends(HeapGrowthGraph, _super);
    function HeapGrowthGraph() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this._resizeListener = _this._updateGraph.bind(_this);
        return _this;
    }
    HeapGrowthGraph.prototype.componentWillMount = function () {
        if (this._hasHeapStats()) {
            if (isRankingEvaluationComplete(this.props.bleakResults)) {
                var rankingEval = this.props.bleakResults.rankingEvaluation;
                // Check if zero point is same or different across rankings.
                // Hack for legacy airbnb data, which has different data for the "no
                // fixes" run across the three metrics (which we leverage to give us
                // tighter error bars on that number / repro the numbers in the paper).
                //
                // On all data produced by BLeak moving forward, the data for the "no fixes"
                // run is the same / shared across metrics -- so we just use the data reported
                // for one metric as the base case.
                var zeroPointData = rankingEval.leakShare[0];
                if (zeroPointData[0][0].totalSize !== rankingEval.retainedSize[0][0][0].totalSize) {
                    // Different data across metrics, so can use.
                    zeroPointData = [].concat(rankingEval.leakShare[0], rankingEval.retainedSize[0], rankingEval.transitiveClosureSize[0]);
                }
                var zeroMean = averageGrowth(zeroPointData);
                var growthReduction = averageGrowthReduction(zeroMean, rankingEval.leakShare[rankingEval.leakShare.length - 1]);
                this.setState({
                    averageGrowth: zeroMean.mean,
                    averageGrowthSe: zeroMean.se,
                    growthReduction: growthReduction.mean,
                    growthReductionSe: growthReduction.se,
                    growthReductionPercent: growthReduction.percent,
                    growthReductionPercentSe: growthReduction.percentSe
                });
            }
            else {
                var mean_1 = averageGrowth([this.props.bleakResults.heapStats]);
                this.setState({
                    averageGrowth: mean_1.mean,
                    averageGrowthSe: mean_1.se
                });
            }
        }
    };
    HeapGrowthGraph.prototype.componentDidMount = function () {
        this._updateGraph();
        window.addEventListener('resize', this._resizeListener);
    };
    HeapGrowthGraph.prototype.componentDidUpdate = function () {
        this._updateGraph();
    };
    HeapGrowthGraph.prototype.componentWillUnmount = function () {
        window.removeEventListener('resize', this._resizeListener);
    };
    HeapGrowthGraph.prototype._updateGraph = function () {
        if (!this._hasHeapStats()) {
            return;
        }
        var d3div = this.refs['d3_div'];
        if (d3div.childNodes && d3div.childNodes.length > 0) {
            var nodes = [];
            for (var i = 0; i < d3div.childNodes.length; i++) {
                nodes.push(d3div.childNodes[i]);
            }
            nodes.forEach(function (n) { return d3div.removeChild(n); });
        }
        var svg = d3Select(d3div).append("svg");
        var svgStyle = getComputedStyle(svg.node());
        var margins = { left: 65, right: 20, top: 10, bottom: 35 };
        var svgHeight = parseFloat(svgStyle.height);
        var svgWidth = parseFloat(svgStyle.width);
        var radius = 3;
        var tickSize = 6;
        var lines = distillResults(this.props.bleakResults);
        var maxHeapSize = 1.02 * max(lines.map(function (l) { return max(l.value.map(function (v, i) { return v + (l.se ? (1.96 * l.se[i]) : 0); })); }));
        var minHeapSize = 0.98 * min(lines.map(function (l) { return min(l.value.map(function (v, i) { return v - (l.se ? (1.96 * l.se[i]) : 0); })); }));
        var plotWidth = svgWidth - margins.left - margins.right;
        var plotHeight = svgHeight - margins.top - margins.bottom;
        var x = d3ScaleLinear()
            .range([0, plotWidth])
            .domain([0, lines[0].value.length - 1]);
        var y = d3ScaleLinear().range([plotHeight, 0])
            .domain([minHeapSize, maxHeapSize]);
        var valueline = d3Line()
            .x(function (d) { return x(d[0]); })
            .y(function (d) { return y(d[1]); });
        var data = lines.map(function (l) {
            return d3Zip(d3Range(0, l.value.length), l.value, l.se ? l.se : d3Range(0, l.value.length));
        });
        var g = svg.append("g").attr('transform', "translate(" + margins.left + ", " + margins.top + ")");
        var plots = g.selectAll("g.plot")
            .data(data)
            .enter()
            .append('g')
            .attr('class', function (d, i) { return "plot plot_" + i; });
        var hasError = !!lines[0].se;
        var self = this;
        function drawPointsAndErrorBars(d, i) {
            // Prevent overlapping points / bars
            var move = i * 5;
            var g = d3Select(this)
                .selectAll('circle')
                .data(d)
                .enter()
                .append('g')
                .attr('class', 'data-point')
                .attr('data-placement', 'left')
                .attr('title', function (d) { return lines[i].name + " Iteration " + d[0] + ": " + self._presentStat(d[1], 'MB', hasError ? d[2] : undefined); })
                .each(function (_, __, g) {
                for (var i_1 = 0; i_1 < g.length; i_1++) {
                    $(g[i_1]).tooltip();
                }
            });
            g.append('circle')
                .attr('r', radius)
                .attr('cx', function (d) { return x(d[0]) + move; })
                .attr('cy', function (d) { return y(d[1]); });
            if (hasError) {
                // Straight line
                g.append("line")
                    .attr("class", "error-line")
                    .attr("x1", function (d) {
                    return x(d[0]) + move;
                })
                    .attr("y1", function (d) {
                    return y(d[1] + (1.96 * d[2]));
                })
                    .attr("x2", function (d) {
                    return x(d[0]) + move;
                })
                    .attr("y2", function (d) {
                    return y(d[1] - (1.96 * d[2]));
                });
                // Top cap
                g.append("line")
                    .attr("class", "error-cap")
                    .attr("x1", function (d) {
                    return x(d[0]) - 4 + move;
                })
                    .attr("y1", function (d) {
                    return y(d[1] + (1.96 * d[2]));
                })
                    .attr("x2", function (d) {
                    return x(d[0]) + 4 + move;
                })
                    .attr("y2", function (d) {
                    return y(d[1] + (1.96 * d[2]));
                });
                // Bottom cap
                g.append("line")
                    .attr("class", "error-cap")
                    .attr("x1", function (d) {
                    return x(d[0]) - 4 + move;
                })
                    .attr("y1", function (d) {
                    return y(d[1] - (1.96 * d[2]));
                })
                    .attr("x2", function (d) {
                    return x(d[0]) + 4 + move;
                })
                    .attr("y2", function (d) {
                    return y(d[1] - (1.96 * d[2]));
                });
            }
        }
        plots.append('path')
            .attr("class", 'line')
            .attr("d", valueline);
        plots.each(drawPointsAndErrorBars);
        // Add the X Axis
        g.append("g")
            .attr('class', 'xaxis')
            .attr("transform", "translate(0," + plotHeight + ")")
            .call(axisBottom(x).tickSizeOuter(tickSize).tickFormat(function (n) {
            var val = typeof (n) === 'number' ? n : n.valueOf();
            if (Math.floor(val) !== val) {
                // Drop the tick mark.
                return undefined;
            }
            return n;
        }));
        // Add the Y Axis
        g.append("g")
            .attr('class', 'yaxis')
            .call(axisLeft(y).tickSizeOuter(tickSize).tickFormat(function (n) { return n + " MB"; }));
        // Add X axis title
        g.append('text')
            .attr('class', 'xtitle')
            .attr('x', plotWidth >> 1)
            .attr('y', 32) // Approximate height of x axis
            .attr('transform', "translate(0, " + plotHeight + ")")
            .style('text-anchor', 'middle')
            .text('Round Trips Completed');
        // Add Y axis title
        g.append('text')
            .attr('class', 'ytitle')
            .attr('x', -1 * (plotHeight >> 1)) // x and y are flipped because of rotation
            .attr('y', -58) // Approximate width of y-axis
            .attr('transform', 'rotate(-90)')
            .style('text-anchor', 'middle')
            .style('alignment-baseline', 'central')
            .text('Live Heap Size');
        if (lines.length > 1) {
            // Put up a legend
            var legend = g.append('g')
                .attr('class', 'legend')
                .attr('transform', "translate(15, 15)");
            var rect = legend.append('rect');
            var legendItems = legend.append('g')
                .attr('class', 'legend-items');
            var liWithData = legendItems.selectAll('text')
                .data(lines)
                .enter();
            liWithData.append('text')
                .attr('x', '1.3em')
                .attr('y', function (l, i) { return i + "em"; })
                .text(function (l) { return l.name; });
            liWithData.append('line')
                .attr('class', function (_, i) { return "plot_" + i; })
                .attr('x1', 0)
                .attr('y1', function (d, i) { return i - 0.3 + "em"; })
                .attr('x2', "1em")
                .attr('y2', function (d, i) { return i - 0.3 + "em"; });
            // x, y, height, width
            var bbox = legendItems.node().getBBox();
            rect.attr('x', bbox.x - 5)
                .attr('y', bbox.y - 5)
                .attr('height', bbox.height + 10)
                .attr('width', bbox.width + 10);
        }
    };
    HeapGrowthGraph.prototype._hasHeapStats = function () {
        return !!this.props.bleakResults.heapStats && this.props.bleakResults.heapStats.length > 0;
    };
    HeapGrowthGraph.prototype._presentStat = function (stat, metric, se) {
        return "" + stat.toFixed(2) + metric + (se ? ", 95% CI [" + (stat - (1.96 * se)).toFixed(2) + ", " + (stat + (1.96 * se)).toFixed(2) + "]" : '');
    };
    HeapGrowthGraph.prototype.render = function () {
        // TODO: Growth reduction.
        return React.createElement("div", null,
            this._hasHeapStats() && this.state.averageGrowth ?
                React.createElement("div", { key: "heap_stats" },
                    React.createElement("b", null, "Average Growth:"),
                    " ",
                    this._presentStat(this.state.averageGrowth, 'MB / round trip', this.state.averageGrowthSe),
                    " ",
                    React.createElement("br", null),
                    this.state.growthReduction ? React.createElement("span", null,
                        React.createElement("b", null, "Growth Reduction:"),
                        " ",
                        this._presentStat(this.state.growthReductionPercent, '%', this.state.growthReductionPercentSe),
                        " (",
                        this._presentStat(this.state.growthReduction, 'MB / round trip', this.state.growthReductionSe),
                        ")",
                        React.createElement("br", null)) : '',
                    "(The above stats ignore the impact of first 5 heap snapshots, which are typically noisy due to application startup + JavaScript engine warmup)")
                : '',
            React.createElement("div", { ref: "d3_div", className: "heap-growth-graph" },
                React.createElement("div", { className: this._hasHeapStats() ? 'hidden' : '' }, "Results file does not contain any heap growth information. Please re-run in the newest version of BLeak.")));
    };
    return HeapGrowthGraph;
}(React.Component));
export default HeapGrowthGraph;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGVhcF9ncm93dGhfZ3JhcGguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvdmlld2VyL2NvbXBvbmVudHMvaGVhcF9ncm93dGhfZ3JhcGgudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLEtBQUssS0FBSyxNQUFNLE9BQU8sQ0FBQztBQUUvQixPQUFPLEVBQUMsV0FBVyxJQUFJLGFBQWEsRUFBRSxJQUFJLElBQUksTUFBTSxFQUFFLE1BQU0sSUFBSSxRQUFRLEVBQ2hFLFVBQVUsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsSUFBSSxLQUFLLEVBQUUsS0FBSyxJQUFJLE9BQU8sRUFBQyxNQUFNLElBQUksQ0FBQztBQWFuRyxJQUFNLFlBQVksR0FBRyxJQUFJLEdBQUcsSUFBSSxDQUFDO0FBQ2pDLGlCQUFpQixJQUFZLEVBQUUsR0FBNEI7SUFDekQsSUFBTSxFQUFFLEdBQVMsRUFBRSxJQUFJLE1BQUEsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztJQUM3QyxJQUFNLGFBQWEsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDOzRCQUMzQixDQUFDO1FBQ1IsSUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxVQUFDLEVBQUUsSUFBSyxPQUFBLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLEdBQUcsWUFBWSxFQUE5QixDQUE4QixDQUFDLENBQUM7UUFDL0QsRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDNUIsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3RCLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FB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QyxtQkFBbUI7Z0JBQzdDLDZCQUFLLFNBQVMsRUFBRSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRSwrR0FFOUMsQ0FDRixDQUNGLENBQUM7SUFDVCxDQUFDO0lBQ0gsc0JBQUM7QUFBRCxDQUFDLEFBOVJELENBQTZDLEtBQUssQ0FBQyxTQUFTLEdBOFIzRCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBCTGVha1Jlc3VsdHMgZnJvbSAnLi4vLi4vbGliL2JsZWFrX3Jlc3VsdHMnO1xuaW1wb3J0IHtzY2FsZUxpbmVhciBhcyBkM1NjYWxlTGluZWFyLCBsaW5lIGFzIGQzTGluZSwgc2VsZWN0IGFzIGQzU2VsZWN0LFxuICAgICAgICBheGlzQm90dG9tLCBheGlzTGVmdCwgbWVhbiwgZGV2aWF0aW9uLCBtYXgsIG1pbiwgemlwIGFzIGQzWmlwLCByYW5nZSBhcyBkM1JhbmdlfSBmcm9tICdkMyc7XG5pbXBvcnQge1NuYXBzaG90U2l6ZVN1bW1hcnl9IGZyb20gJy4uLy4uL2NvbW1vbi9pbnRlcmZhY2VzJztcblxuaW50ZXJmYWNlIEhlYXBHcm93dGhHcmFwaFByb3BzIHtcbiAgYmxlYWtSZXN1bHRzOiBCTGVha1Jlc3VsdHM7XG59XG5cbmludGVyZmFjZSBMaW5lIHtcbiAgbmFtZTogc3RyaW5nO1xuICB2YWx1ZTogbnVtYmVyW107XG4gIHNlPzogbnVtYmVyW107XG59XG5cbmNvbnN0IEJZVEVTX1BFUl9NQiA9IDEwMjQgKiAxMDI0O1xuZnVuY3Rpb24gZ2V0TGluZShuYW1lOiBzdHJpbmcsIHNzczogU25hcHNob3RTaXplU3VtbWFyeVtdW10pOiBMaW5lIHtcbiAgY29uc3QgcnY6IExpbmUgPSB7IG5hbWUsIHZhbHVlOiBbXSwgc2U6IFtdIH07XG4gIGNvbnN0IG51bURhdGFQb2ludHMgPSBzc3NbMF0ubGVuZ3RoO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IG51bURhdGFQb2ludHM7IGkrKykge1xuICAgIGNvbnN0IHZhbHVlcyA9IHNzcy5tYXAoKHNzKSA9PiBzc1tpXS50b3RhbFNpemUgLyBCWVRFU19QRVJfTUIpO1xuICAgIHJ2LnZhbHVlLnB1c2gobWVhbih2YWx1ZXMpKTtcbiAgICBpZiAodmFsdWVzLmxlbmd0aCA+IDEpIHtcbiAgICAgIHJ2LnNlLnB1c2goZGV2aWF0aW9uKHZhbHVlcykgLyBNYXRoLnNxcnQodmFsdWVzLmxlbmd0aCkpO1xuICAgIH1cbiAgfVxuICBpZiAocnYuc2UubGVuZ3RoID09PSAwKSB7XG4gICAgcnYuc2UgPSB1bmRlZmluZWQ7XG4gIH1cbiAgcmV0dXJuIHJ2O1xufVxuXG5mdW5jdGlvbiBjb3VudE5vbk51bGw8VD4oY291bnQ6IG51bWJlciwgYTogVFtdIHwgVCk6IG51bWJlciB7XG4gIGlmIChBcnJheS5pc0FycmF5KGEpKSB7XG4gICAgY29uc3QgYUNvdW50ID0gYS5yZWR1Y2UoY291bnROb25OdWxsLCAwKTtcbiAgICBpZiAoYUNvdW50ICE9PSBhLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIGNvdW50O1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gY291bnQgKyAxO1xuICAgIH1cbiAgfVxuICBpZiAoYSkge1xuICAgIHJldHVybiBjb3VudCArIDE7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGNvdW50O1xuICB9XG59XG5cbmZ1bmN0aW9uIGRpc3RpbGxSZXN1bHRzKHJlc3VsdHM6IEJMZWFrUmVzdWx0cyk6IExpbmVbXSB7XG4gIGlmICghaXNSYW5raW5nRXZhbHVhdGlvbkNvbXBsZXRlKHJlc3VsdHMpKSB7XG4gICAgcmV0dXJuIFt7XG4gICAgICBuYW1lOiAnTm8gTGVha3MgRml4ZWQnLFxuICAgICAgdmFsdWU6IHJlc3VsdHMuaGVhcFN0YXRzLm1hcCgoaHMpID0+IGhzLnRvdGFsU2l6ZSAvIEJZVEVTX1BFUl9NQilcbiAgICB9XTtcbiAgfVxuICBjb25zdCBudW1MZWFrcyA9IHJlc3VsdHMucmFua2luZ0V2YWx1YXRpb24ubGVha1NoYXJlLmxlbmd0aDtcbiAgY29uc3QgemVyb0xlYWtzRml4ZWQgPSByZXN1bHRzLnJhbmtpbmdFdmFsdWF0aW9uLmxlYWtTaGFyZVswXTtcbiAgY29uc3QgYWxsTGVha3NGaXhlZCA9IHJlc3VsdHMucmFua2luZ0V2YWx1YXRpb24ubGVha1NoYXJlW251bUxlYWtzIC0gMV07XG4gIC8vIE1ha2Ugc3VyZSBhbGwgb2YgdGhlIGRhdGEgaXMgdGhlcmUhXG4gIGlmICghemVyb0xlYWtzRml4ZWQgfHwgIWFsbExlYWtzRml4ZWQgfHwgemVyb0xlYWtzRml4ZWQucmVkdWNlKGNvdW50Tm9uTnVsbCwgMCkgPCB6ZXJvTGVha3NGaXhlZC5sZW5ndGggfHwgYWxsTGVha3NGaXhlZC5yZWR1Y2UoY291bnROb25OdWxsLCAwKSA8IGFsbExlYWtzRml4ZWQubGVuZ3RoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCk7XG4gIH1cbiAgLy8gQ2FsY3VsYXRlIGludG8gYSBsaW5lLlxuICByZXR1cm4gW2dldExpbmUoJ05vIExlYWtzIEZpeGVkJywgemVyb0xlYWtzRml4ZWQpLCBnZXRMaW5lKCdBbGwgTGVha3MgRml4ZWQnLCBhbGxMZWFrc0ZpeGVkKV07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1JhbmtpbmdFdmFsdWF0aW9uQ29tcGxldGUocmVzdWx0czogQkxlYWtSZXN1bHRzKTogYm9vbGVhbiB7XG4gIGNvbnN0IG51bUxlYWtzID0gcmVzdWx0cy5yYW5raW5nRXZhbHVhdGlvbi5sZWFrU2hhcmUubGVuZ3RoO1xuICB0cnkge1xuICAgIGNvbnN0IHplcm9MZWFrc0ZpeGVkID0gcmVzdWx0cy5yYW5raW5nRXZhbHVhdGlvbi5sZWFrU2hhcmVbMF07XG4gICAgY29uc3QgYWxsTGVha3NGaXhlZCA9IHJlc3VsdHMucmFua2luZ0V2YWx1YXRpb24ubGVha1NoYXJlW251bUxlYWtzIC0gMV07XG4gICAgLy8gTWFrZSBzdXJlIGFsbCBvZiB0aGUgZGF0YSBpcyB0aGVyZSFcbiAgICBpZiAoIXplcm9MZWFrc0ZpeGVkIHx8ICFhbGxMZWFrc0ZpeGVkIHx8IHplcm9MZWFrc0ZpeGVkLnJlZHVjZShjb3VudE5vbk51bGwsIDApIDwgemVyb0xlYWtzRml4ZWQubGVuZ3RoIHx8IGFsbExlYWtzRml4ZWQucmVkdWNlKGNvdW50Tm9uTnVsbCwgMCkgPCBhbGxMZWFrc0ZpeGVkLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG5pbnRlcmZhY2UgSGVhcEdyb3d0aEdyYXBoU3RhdGUge1xuICBhdmVyYWdlR3Jvd3RoOiBudW1iZXI7XG4gIGF2ZXJhZ2VHcm93dGhTZT86IG51bWJlcjtcbiAgZ3Jvd3RoUmVkdWN0aW9uOiBudW1iZXI7XG4gIGdyb3d0aFJlZHVjdGlvblNlPzogbnVtYmVyO1xuICBncm93dGhSZWR1Y3Rpb25QZXJjZW50OiBudW1iZXI7XG4gIGdyb3d0aFJlZHVjdGlvblBlcmNlbnRTZT86IG51bWJlcjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGF2ZXJhZ2VHcm93dGgoZGF0YTogU25hcHNob3RTaXplU3VtbWFyeVtdW10pOiB7IG1lYW46IG51bWJlciwgc2U/OiBudW1iZXIgfSB7XG4gIC8vIEhTID0+IEdyb3d0aFxuICBjb25zdCBncm93dGhEYXRhID0gZGF0YS5tYXAoKGQsIGkpID0+IGQuc2xpY2UoMSkubWFwKChkLCBqKSA9PiAoZC50b3RhbFNpemUgLSBkYXRhW2ldW2pdLnRvdGFsU2l6ZSkgLyBCWVRFU19QRVJfTUIpKTtcbiAgLy8gR3Jvd3RoID0+IEF2ZyBHcm93dGhcbiAgbGV0IGF2Z0dyb3d0aHM6IG51bWJlcltdID0gW107XG4gIGNvbnN0IGl0ZXJhdGlvbnMgPSBkYXRhWzBdLmxlbmd0aDtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBpdGVyYXRpb25zOyBpKyspIHtcbiAgICBhdmdHcm93dGhzLnB1c2gobWVhbihncm93dGhEYXRhLm1hcCgoZCkgPT4gZFtpXSkpKTtcbiAgfVxuICBjb25zdCBzZSA9IGRldmlhdGlvbihhdmdHcm93dGhzLnNsaWNlKDUpKSAvIE1hdGguc3FydChhdmdHcm93dGhzLmxlbmd0aCAtIDUpO1xuICBjb25zdCBtZWFuRGF0YSA9IG1lYW4oYXZnR3Jvd3Rocy5zbGljZSg1KSk7XG4gIGlmIChpc05hTihzZSkpIHtcbiAgICByZXR1cm4ge1xuICAgICAgbWVhbjogbWVhbkRhdGFcbiAgICB9O1xuICB9XG4gIHJldHVybiB7XG4gICAgbWVhbjogbWVhbkRhdGEsXG4gICAgc2VcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGF2ZXJhZ2VHcm93dGhSZWR1Y3Rpb24oYXZnR3Jvd3RoTm9GaXhlZDogeyBtZWFuOiBudW1iZXIsIHNlPzogbnVtYmVyfSwgYWxsRml4ZWQ6IFNuYXBzaG90U2l6ZVN1bW1hcnlbXVtdKTogeyBtZWFuOiBudW1iZXIsIHNlPzogbnVtYmVyLCBwZXJjZW50OiBudW1iZXIsIHBlcmNlbnRTZT86IG51bWJlciB9IHtcbiAgY29uc3QgYXZnR3Jvd3RoQWxsRml4ZWQgPSBhdmVyYWdlR3Jvd3RoKGFsbEZpeGVkKTtcbiAgY29uc3QgZ3Jvd3RoUmVkdWN0aW9uID0gYXZnR3Jvd3RoTm9GaXhlZC5tZWFuIC0gYXZnR3Jvd3RoQWxsRml4ZWQubWVhbjtcbiAgY29uc3QgcGVyY2VudCA9IDEwMCAqIChncm93dGhSZWR1Y3Rpb24gLyBhdmdHcm93dGhOb0ZpeGVkLm1lYW4pO1xuICBpZiAoYXZnR3Jvd3RoTm9GaXhlZC5zZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgY29uc3QgZ3Jvd3RoUmVkdWN0aW9uU2UgPSBNYXRoLnNxcnQoTWF0aC5wb3coYXZnR3Jvd3RoQWxsRml4ZWQuc2UsIDIpICsgTWF0aC5wb3coYXZnR3Jvd3RoTm9GaXhlZC5zZSwgMikpO1xuICAgIGNvbnN0IHBlcmNlbnRTZSA9IDEwMCAqIE1hdGguYWJzKChhdmdHcm93dGhOb0ZpeGVkLm1lYW4gLSBhdmdHcm93dGhBbGxGaXhlZC5tZWFuKSAvIGF2Z0dyb3d0aE5vRml4ZWQubWVhbikgKiBNYXRoLnNxcnQoTWF0aC5wb3coZ3Jvd3RoUmVkdWN0aW9uU2UgLyBncm93dGhSZWR1Y3Rpb24sIDIpICsgTWF0aC5wb3coYXZnR3Jvd3RoTm9GaXhlZC5zZSAvIGF2Z0dyb3d0aE5vRml4ZWQubWVhbiwgMikpO1xuICAgIHJldHVybiB7XG4gICAgICBtZWFuOiBncm93dGhSZWR1Y3Rpb24sXG4gICAgICBzZTogZ3Jvd3RoUmVkdWN0aW9uU2UsXG4gICAgICBwZXJjZW50LFxuICAgICAgcGVyY2VudFNlXG4gICAgfTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4ge1xuICAgICAgbWVhbjogZ3Jvd3RoUmVkdWN0aW9uLFxuICAgICAgcGVyY2VudFxuICAgIH07XG4gIH1cbn1cblxuLy8gVE9ETzogU3VwcG9ydCB0b2dnbGluZyBkaWZmZXJlbnQgc2l6ZSBzdGF0cywgbm90IGp1c3QgdG90YWxTaXplLlxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgSGVhcEdyb3d0aEdyYXBoIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50PEhlYXBHcm93dGhHcmFwaFByb3BzLCBIZWFwR3Jvd3RoR3JhcGhTdGF0ZT4ge1xuICBwcml2YXRlIF9yZXNpemVMaXN0ZW5lciA9IHRoaXMuX3VwZGF0ZUdyYXBoLmJpbmQodGhpcyk7XG5cbiAgcHVibGljIGNvbXBvbmVudFdpbGxNb3VudCgpIHtcbiAgICBpZiAodGhpcy5faGFzSGVhcFN0YXRzKCkpIHtcbiAgICAgIGlmIChpc1JhbmtpbmdFdmFsdWF0aW9uQ29tcGxldGUodGhpcy5wcm9wcy5ibGVha1Jlc3VsdHMpKSB7XG4gICAgICAgIGNvbnN0IHJhbmtpbmdFdmFsID0gdGhpcy5wcm9wcy5ibGVha1Jlc3VsdHMucmFua2luZ0V2YWx1YXRpb247XG4gICAgICAgIC8vIENoZWNrIGlmIHplcm8gcG9pbnQgaXMgc2FtZSBvciBkaWZmZXJlbnQgYWNyb3NzIHJhbmtpbmdzLlxuICAgICAgICAvLyBIYWNrIGZvciBsZWdhY3kgYWlyYm5iIGRhdGEsIHdoaWNoIGhhcyBkaWZmZXJlbnQgZGF0YSBmb3IgdGhlIFwibm9cbiAgICAgICAgLy8gZml4ZXNcIiBydW4gYWNyb3NzIHRoZSB0aHJlZSBtZXRyaWNzICh3aGljaCB3ZSBsZXZlcmFnZSB0byBnaXZlIHVzXG4gICAgICAgIC8vIHRpZ2h0ZXIgZXJyb3IgYmFycyBvbiB0aGF0IG51bWJlciAvIHJlcHJvIHRoZSBudW1iZXJzIGluIHRoZSBwYXBlcikuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIE9uIGFsbCBkYXRhIHByb2R1Y2VkIGJ5IEJMZWFrIG1vdmluZyBmb3J3YXJkLCB0aGUgZGF0YSBmb3IgdGhlIFwibm8gZml4ZXNcIlxuICAgICAgICAvLyBydW4gaXMgdGhlIHNhbWUgLyBzaGFyZWQgYWNyb3NzIG1ldHJpY3MgLS0gc28gd2UganVzdCB1c2UgdGhlIGRhdGEgcmVwb3J0ZWRcbiAgICAgICAgLy8gZm9yIG9uZSBtZXRyaWMgYXMgdGhlIGJhc2UgY2FzZS5cbiAgICAgICAgbGV0IHplcm9Qb2ludERhdGEgPSByYW5raW5nRXZhbC5sZWFrU2hhcmVbMF07XG4gICAgICAgIGlmICh6ZXJvUG9pbnREYXRhWzBdWzBdLnRvdGFsU2l6ZSAhPT0gcmFua2luZ0V2YWwucmV0YWluZWRTaXplWzBdWzBdWzBdLnRvdGFsU2l6ZSkge1xuICAgICAgICAgIC8vIERpZmZlcmVudCBkYXRhIGFjcm9zcyBtZXRyaWNzLCBzbyBjYW4gdXNlLlxuICAgICAgICAgIHplcm9Qb2ludERhdGEgPSBbXS5jb25jYXQocmFua2luZ0V2YWwubGVha1NoYXJlWzBdLCByYW5raW5nRXZhbC5yZXRhaW5lZFNpemVbMF0sIHJhbmtpbmdFdmFsLnRyYW5zaXRpdmVDbG9zdXJlU2l6ZVswXSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgemVyb01lYW4gPSBhdmVyYWdlR3Jvd3RoKHplcm9Qb2ludERhdGEpO1xuICAgICAgICBjb25zdCBncm93dGhSZWR1Y3Rpb24gPSBhdmVyYWdlR3Jvd3RoUmVkdWN0aW9uKHplcm9NZWFuLCByYW5raW5nRXZhbC5sZWFrU2hhcmVbcmFua2luZ0V2YWwubGVha1NoYXJlLmxlbmd0aCAtIDFdKTtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgYXZlcmFnZUdyb3d0aDogemVyb01lYW4ubWVhbixcbiAgICAgICAgICBhdmVyYWdlR3Jvd3RoU2U6IHplcm9NZWFuLnNlLFxuICAgICAgICAgIGdyb3d0aFJlZHVjdGlvbjogZ3Jvd3RoUmVkdWN0aW9uLm1lYW4sXG4gICAgICAgICAgZ3Jvd3RoUmVkdWN0aW9uU2U6IGdyb3d0aFJlZHVjdGlvbi5zZSxcbiAgICAgICAgICBncm93dGhSZWR1Y3Rpb25QZXJjZW50OiBncm93dGhSZWR1Y3Rpb24ucGVyY2VudCxcbiAgICAgICAgICBncm93dGhSZWR1Y3Rpb25QZXJjZW50U2U6IGdyb3d0aFJlZHVjdGlvbi5wZXJjZW50U2VcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBtZWFuID0gYXZlcmFnZUdyb3d0aChbdGhpcy5wcm9wcy5ibGVha1Jlc3VsdHMuaGVhcFN0YXRzXSk7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgIGF2ZXJhZ2VHcm93dGg6IG1lYW4ubWVhbixcbiAgICAgICAgICBhdmVyYWdlR3Jvd3RoU2U6IG1lYW4uc2VcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHVibGljIGNvbXBvbmVudERpZE1vdW50KCkge1xuICAgIHRoaXMuX3VwZGF0ZUdyYXBoKCk7XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIHRoaXMuX3Jlc2l6ZUxpc3RlbmVyKTtcbiAgfVxuXG4gIHB1YmxpYyBjb21wb25lbnREaWRVcGRhdGUoKSB7XG4gICAgdGhpcy5fdXBkYXRlR3JhcGgoKTtcbiAgfVxuXG4gIHB1YmxpYyBjb21wb25lbnRXaWxsVW5tb3VudCgpIHtcbiAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigncmVzaXplJywgdGhpcy5fcmVzaXplTGlzdGVuZXIpO1xuICB9XG5cbiAgcHJpdmF0ZSBfdXBkYXRlR3JhcGgoKSB7XG4gICAgaWYgKCF0aGlzLl9oYXNIZWFwU3RhdHMoKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBkM2RpdiA9IHRoaXMucmVmc1snZDNfZGl2J10gYXMgSFRNTERpdkVsZW1lbnQ7XG4gICAgaWYgKGQzZGl2LmNoaWxkTm9kZXMgJiYgZDNkaXYuY2hpbGROb2Rlcy5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCBub2RlczogTm9kZVtdID0gW107XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGQzZGl2LmNoaWxkTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbm9kZXMucHVzaChkM2Rpdi5jaGlsZE5vZGVzW2ldKTtcbiAgICAgIH1cbiAgICAgIG5vZGVzLmZvckVhY2goKG4pID0+IGQzZGl2LnJlbW92ZUNoaWxkKG4pKTtcbiAgICB9XG5cbiAgICBjb25zdCBzdmcgPSBkM1NlbGVjdChkM2RpdikuYXBwZW5kPFNWR0VsZW1lbnQ+KFwic3ZnXCIpO1xuICAgIGNvbnN0IHN2Z1N0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShzdmcubm9kZSgpKTtcbiAgICBjb25zdCBtYXJnaW5zID0ge2xlZnQ6IDY1LCByaWdodDogMjAsIHRvcDogMTAsIGJvdHRvbTogMzV9O1xuICAgIGNvbnN0IHN2Z0hlaWdodCA9IHBhcnNlRmxvYXQoc3ZnU3R5bGUuaGVpZ2h0KTtcbiAgICBjb25zdCBzdmdXaWR0aCA9IHBhcnNlRmxvYXQoc3ZnU3R5bGUud2lkdGgpO1xuICAgIGNvbnN0IHJhZGl1cyA9IDM7XG4gICAgY29uc3QgdGlja1NpemUgPSA2O1xuICAgIGNvbnN0IGxpbmVzID0gZGlzdGlsbFJlc3VsdHModGhpcy5wcm9wcy5ibGVha1Jlc3VsdHMpO1xuXG5cbiAgICBjb25zdCBtYXhIZWFwU2l6ZSA9IDEuMDIgKiBtYXgobGluZXMubWFwKChsKSA9PiBtYXgobC52YWx1ZS5tYXAoKHYsIGkpID0+IHYgKyAobC5zZSA/ICgxLjk2ICogbC5zZVtpXSkgOiAwKSkpKSk7XG4gICAgY29uc3QgbWluSGVhcFNpemUgPSAwLjk4ICogbWluKGxpbmVzLm1hcCgobCkgPT4gbWluKGwudmFsdWUubWFwKCh2LCBpKSA9PiB2IC0gKGwuc2UgPyAoMS45NiAqIGwuc2VbaV0pIDogMCkpKSkpO1xuXG4gICAgY29uc3QgcGxvdFdpZHRoID0gc3ZnV2lkdGggLSBtYXJnaW5zLmxlZnQgLSBtYXJnaW5zLnJpZ2h0O1xuICAgIGNvbnN0IHBsb3RIZWlnaHQgPSBzdmdIZWlnaHQgLSBtYXJnaW5zLnRvcCAtIG1hcmdpbnMuYm90dG9tO1xuXG4gICAgY29uc3QgeCA9IGQzU2NhbGVMaW5lYXIoKVxuICAgICAgLnJhbmdlKFswLCBwbG90V2lkdGhdKVxuICAgICAgLmRvbWFpbihbMCwgbGluZXNbMF0udmFsdWUubGVuZ3RoIC0gMV0pO1xuICAgIGNvbnN0IHkgPSBkM1NjYWxlTGluZWFyKCkucmFuZ2UoW3Bsb3RIZWlnaHQsIDBdKVxuICAgICAgLmRvbWFpbihbbWluSGVhcFNpemUsIG1heEhlYXBTaXplXSk7XG5cbiAgICBjb25zdCB2YWx1ZWxpbmUgPSBkM0xpbmU8W251bWJlciwgbnVtYmVyLCBudW1iZXJdPigpXG4gICAgICAueChmdW5jdGlvbihkKSB7IHJldHVybiB4KGRbMF0pOyB9KVxuICAgICAgLnkoZnVuY3Rpb24oZCkgeyByZXR1cm4geShkWzFdKTsgfSk7XG5cbiAgICBjb25zdCBkYXRhID0gbGluZXMubWFwKChsKTogW251bWJlciwgbnVtYmVyLCBudW1iZXJdW10gPT5cbiAgICAgIGQzWmlwKGQzUmFuZ2UoMCwgbC52YWx1ZS5sZW5ndGgpLCBsLnZhbHVlLCBsLnNlID8gbC5zZSA6IGQzUmFuZ2UoMCwgbC52YWx1ZS5sZW5ndGgpKSBhcyBbbnVtYmVyLCBudW1iZXIsIG51bWJlcl1bXVxuICAgICk7XG5cbiAgICBjb25zdCBnID0gc3ZnLmFwcGVuZChcImdcIikuYXR0cigndHJhbnNmb3JtJywgYHRyYW5zbGF0ZSgke21hcmdpbnMubGVmdH0sICR7bWFyZ2lucy50b3B9KWApO1xuXG4gICAgY29uc3QgcGxvdHMgPSBnLnNlbGVjdEFsbChcImcucGxvdFwiKVxuICAgICAgLmRhdGEoZGF0YSlcbiAgICAgIC5lbnRlcigpXG4gICAgICAuYXBwZW5kKCdnJylcbiAgICAgIC5hdHRyKCdjbGFzcycsIChkLCBpKSA9PiBgcGxvdCBwbG90XyR7aX1gKTtcblxuICAgIGNvbnN0IGhhc0Vycm9yID0gISFsaW5lc1swXS5zZTtcbiAgICBjb25zdCBzZWxmID0gdGhpcztcbiAgICBmdW5jdGlvbiBkcmF3UG9pbnRzQW5kRXJyb3JCYXJzKHRoaXM6IEVsZW1lbnQsIGQ6IFtudW1iZXIsIG51bWJlciwgbnVtYmVyXVtdLCBpOiBudW1iZXIpOiB2b2lkIHtcbiAgICAgIC8vIFByZXZlbnQgb3ZlcmxhcHBpbmcgcG9pbnRzIC8gYmFyc1xuICAgICAgY29uc3QgbW92ZSA9IGkgKiA1O1xuICAgICAgY29uc3QgZyA9IGQzU2VsZWN0KHRoaXMpXG4gICAgICAgIC5zZWxlY3RBbGwoJ2NpcmNsZScpXG4gICAgICAgIC5kYXRhKGQpXG4gICAgICAgIC5lbnRlcigpXG4gICAgICAgIC5hcHBlbmQoJ2cnKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAnZGF0YS1wb2ludCcpXG4gICAgICAgIC5hdHRyKCdkYXRhLXBsYWNlbWVudCcsICdsZWZ0JylcbiAgICAgICAgLmF0dHIoJ3RpdGxlJywgKGQpID0+IGAke2xpbmVzW2ldLm5hbWV9IEl0ZXJhdGlvbiAke2RbMF19OiAke3NlbGYuX3ByZXNlbnRTdGF0KGRbMV0sICdNQicsIGhhc0Vycm9yID8gZFsyXSA6IHVuZGVmaW5lZCl9YClcbiAgICAgICAgLmVhY2goKF8sIF9fLCBnKSA9PiB7XG4gICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBnLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAkKGdbaV0pLnRvb2x0aXAoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICBnLmFwcGVuZCgnY2lyY2xlJylcbiAgICAgICAgLmF0dHIoJ3InLCByYWRpdXMpXG4gICAgICAgIC5hdHRyKCdjeCcsIChkKSA9PiB4KGRbMF0pICsgbW92ZSlcbiAgICAgICAgLmF0dHIoJ2N5JywgKGQpID0+IHkoZFsxXSkpO1xuXG4gICAgICBpZiAoaGFzRXJyb3IpIHtcbiAgICAgICAgLy8gU3RyYWlnaHQgbGluZVxuICAgICAgICBnLmFwcGVuZChcImxpbmVcIilcbiAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwiZXJyb3ItbGluZVwiKVxuICAgICAgICAgIC5hdHRyKFwieDFcIiwgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgcmV0dXJuIHgoZFswXSkgKyBtb3ZlO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmF0dHIoXCJ5MVwiLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICByZXR1cm4geShkWzFdICsgKDEuOTYgKiBkWzJdKSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuYXR0cihcIngyXCIsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgIHJldHVybiB4KGRbMF0pICsgbW92ZTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5hdHRyKFwieTJcIiwgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgcmV0dXJuIHkoZFsxXSAtICgxLjk2ICogZFsyXSkpO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgIC8vIFRvcCBjYXBcbiAgICAgICAgZy5hcHBlbmQoXCJsaW5lXCIpXG4gICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImVycm9yLWNhcFwiKVxuICAgICAgICAgIC5hdHRyKFwieDFcIiwgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgcmV0dXJuIHgoZFswXSkgLSA0ICsgbW92ZTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5hdHRyKFwieTFcIiwgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgcmV0dXJuIHkoZFsxXSArICgxLjk2ICogZFsyXSkpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmF0dHIoXCJ4MlwiLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICByZXR1cm4geChkWzBdKSArIDQgKyBtb3ZlO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmF0dHIoXCJ5MlwiLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICByZXR1cm4geShkWzFdICsgKDEuOTYgKiBkWzJdKSk7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gQm90dG9tIGNhcFxuICAgICAgICBnLmFwcGVuZChcImxpbmVcIilcbiAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwiZXJyb3ItY2FwXCIpXG4gICAgICAgICAgLmF0dHIoXCJ4MVwiLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICByZXR1cm4geChkWzBdKSAtIDQgKyBtb3ZlO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmF0dHIoXCJ5MVwiLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICByZXR1cm4geShkWzFdIC0gKDEuOTYgKiBkWzJdKSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuYXR0cihcIngyXCIsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgIHJldHVybiB4KGRbMF0pICsgNCArIG1vdmU7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuYXR0cihcInkyXCIsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgIHJldHVybiB5KGRbMV0gLSAoMS45NiAqIGRbMl0pKTtcbiAgICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBwbG90cy5hcHBlbmQoJ3BhdGgnKVxuICAgICAgLmF0dHIoXCJjbGFzc1wiLCAnbGluZScpXG4gICAgICAuYXR0cihcImRcIiwgdmFsdWVsaW5lKTtcblxuICAgIHBsb3RzLmVhY2goZHJhd1BvaW50c0FuZEVycm9yQmFycyk7XG5cblxuICAgIC8vIEFkZCB0aGUgWCBBeGlzXG4gICAgZy5hcHBlbmQoXCJnXCIpXG4gICAgICAuYXR0cignY2xhc3MnLCAneGF4aXMnKVxuICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgYHRyYW5zbGF0ZSgwLCR7cGxvdEhlaWdodH0pYClcbiAgICAgIC5jYWxsKGF4aXNCb3R0b20oeCkudGlja1NpemVPdXRlcih0aWNrU2l6ZSkudGlja0Zvcm1hdCgobikgPT4ge1xuICAgICAgICBsZXQgdmFsID0gdHlwZW9mKG4pID09PSAnbnVtYmVyJyA/IG4gOiBuLnZhbHVlT2YoKTtcbiAgICAgICAgaWYgKE1hdGguZmxvb3IodmFsKSAhPT0gdmFsKSB7XG4gICAgICAgICAgLy8gRHJvcCB0aGUgdGljayBtYXJrLlxuICAgICAgICAgIHJldHVybiB1bmRlZmluZWQgYXMgYW55O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuO1xuICAgICAgfSkpO1xuXG4gICAgLy8gQWRkIHRoZSBZIEF4aXNcbiAgICBnLmFwcGVuZChcImdcIilcbiAgICAgIC5hdHRyKCdjbGFzcycsICd5YXhpcycpXG4gICAgICAuY2FsbChheGlzTGVmdCh5KS50aWNrU2l6ZU91dGVyKHRpY2tTaXplKS50aWNrRm9ybWF0KChuKSA9PiBgJHtufSBNQmApKTtcblxuICAgIC8vIEFkZCBYIGF4aXMgdGl0bGVcbiAgICBnLmFwcGVuZCgndGV4dCcpXG4gICAgICAuYXR0cignY2xhc3MnLCAneHRpdGxlJylcbiAgICAgIC5hdHRyKCd4JywgcGxvdFdpZHRoID4+IDEpXG4gICAgICAuYXR0cigneScsIDMyKSAvLyBBcHByb3hpbWF0ZSBoZWlnaHQgb2YgeCBheGlzXG4gICAgICAuYXR0cigndHJhbnNmb3JtJywgYHRyYW5zbGF0ZSgwLCAke3Bsb3RIZWlnaHR9KWApXG4gICAgICAuc3R5bGUoJ3RleHQtYW5jaG9yJywgJ21pZGRsZScpXG4gICAgICAudGV4dCgnUm91bmQgVHJpcHMgQ29tcGxldGVkJyk7XG5cbiAgICAvLyBBZGQgWSBheGlzIHRpdGxlXG4gICAgZy5hcHBlbmQoJ3RleHQnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3l0aXRsZScpXG4gICAgICAuYXR0cigneCcsIC0xICogKHBsb3RIZWlnaHQgPj4gMSkpIC8vIHggYW5kIHkgYXJlIGZsaXBwZWQgYmVjYXVzZSBvZiByb3RhdGlvblxuICAgICAgLmF0dHIoJ3knLCAtNTgpIC8vIEFwcHJveGltYXRlIHdpZHRoIG9mIHktYXhpc1xuICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsICdyb3RhdGUoLTkwKScpXG4gICAgICAuc3R5bGUoJ3RleHQtYW5jaG9yJywgJ21pZGRsZScpXG4gICAgICAuc3R5bGUoJ2FsaWdubWVudC1iYXNlbGluZScsICdjZW50cmFsJylcbiAgICAgIC50ZXh0KCdMaXZlIEhlYXAgU2l6ZScpO1xuXG5cbiAgICBpZiAobGluZXMubGVuZ3RoID4gMSkge1xuICAgICAgLy8gUHV0IHVwIGEgbGVnZW5kXG4gICAgICBjb25zdCBsZWdlbmQgPSBnLmFwcGVuZCgnZycpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICdsZWdlbmQnKVxuICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgYHRyYW5zbGF0ZSgxNSwgMTUpYCk7XG5cbiAgICAgIGNvbnN0IHJlY3QgPSBsZWdlbmQuYXBwZW5kKCdyZWN0Jyk7XG5cbiAgICAgIGNvbnN0IGxlZ2VuZEl0ZW1zID0gbGVnZW5kLmFwcGVuZDxTVkdHRWxlbWVudD4oJ2cnKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAnbGVnZW5kLWl0ZW1zJyk7XG5cbiAgICAgIGNvbnN0IGxpV2l0aERhdGEgPSBsZWdlbmRJdGVtcy5zZWxlY3RBbGwoJ3RleHQnKVxuICAgICAgICAuZGF0YShsaW5lcylcbiAgICAgICAgLmVudGVyKCk7XG5cbiAgICAgIGxpV2l0aERhdGEuYXBwZW5kKCd0ZXh0JylcbiAgICAgICAgLmF0dHIoJ3gnLCAnMS4zZW0nKVxuICAgICAgICAuYXR0cigneScsIChsLCBpKSA9PiBgJHtpfWVtYClcbiAgICAgICAgLnRleHQoKGwpID0+IGwubmFtZSk7XG5cbiAgICAgIGxpV2l0aERhdGEuYXBwZW5kKCdsaW5lJylcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgKF8sIGkpID0+IGBwbG90XyR7aX1gKVxuICAgICAgICAuYXR0cigneDEnLCAwKVxuICAgICAgICAuYXR0cigneTEnLCAoZCwgaSkgPT4gYCR7aSAtIDAuM31lbWApXG4gICAgICAgIC5hdHRyKCd4MicsIGAxZW1gKVxuICAgICAgICAuYXR0cigneTInLCAoZCwgaSkgPT4gYCR7aSAtIDAuM31lbWApO1xuXG4gICAgICAvLyB4LCB5LCBoZWlnaHQsIHdpZHRoXG4gICAgICBjb25zdCBiYm94ID0gbGVnZW5kSXRlbXMubm9kZSgpLmdldEJCb3goKTtcbiAgICAgIHJlY3QuYXR0cigneCcsIGJib3gueCAtIDUpXG4gICAgICAgIC5hdHRyKCd5JywgYmJveC55IC0gNSlcbiAgICAgICAgLmF0dHIoJ2hlaWdodCcsIGJib3guaGVpZ2h0ICsgMTApXG4gICAgICAgIC5hdHRyKCd3aWR0aCcsIGJib3gud2lkdGggKyAxMCk7XG5cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9oYXNIZWFwU3RhdHMoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuICEhdGhpcy5wcm9wcy5ibGVha1Jlc3VsdHMuaGVhcFN0YXRzICYmIHRoaXMucHJvcHMuYmxlYWtSZXN1bHRzLmhlYXBTdGF0cy5sZW5ndGggPiAwO1xuICB9XG5cbiAgcHJpdmF0ZSBfcHJlc2VudFN0YXQoc3RhdDogbnVtYmVyLCBtZXRyaWM6IHN0cmluZywgc2U/OiBudW1iZXIpIHtcbiAgICByZXR1cm4gYCR7c3RhdC50b0ZpeGVkKDIpfSR7bWV0cmljfSR7c2UgPyBgLCA5NSUgQ0kgWyR7KHN0YXQgLSAoMS45NiAqIHNlKSkudG9GaXhlZCgyKX0sICR7KHN0YXQgKyAoMS45NiAqIHNlKSkudG9GaXhlZCgyKX1dYCA6ICcnfWBcbiAgfVxuXG4gIHB1YmxpYyByZW5kZXIoKSB7XG4gICAgLy8gVE9ETzogR3Jvd3RoIHJlZHVjdGlvbi5cbiAgICByZXR1cm4gPGRpdj5cbiAgICAgIHt0aGlzLl9oYXNIZWFwU3RhdHMoKSAmJiB0aGlzLnN0YXRlLmF2ZXJhZ2VHcm93dGggP1xuICAgICAgICA8ZGl2IGtleT1cImhlYXBfc3RhdHNcIj5cbiAgICAgICAgICA8Yj5BdmVyYWdlIEdyb3d0aDo8L2I+IHt0aGlzLl9wcmVzZW50U3RhdCh0aGlzLnN0YXRlLmF2ZXJhZ2VHcm93dGgsICdNQiAvIHJvdW5kIHRyaXAnLCB0aGlzLnN0YXRlLmF2ZXJhZ2VHcm93dGhTZSl9IDxiciAvPlxuICAgICAgICAgIHt0aGlzLnN0YXRlLmdyb3d0aFJlZHVjdGlvbiA/IDxzcGFuPjxiPkdyb3d0aCBSZWR1Y3Rpb246PC9iPiB7dGhpcy5fcHJlc2VudFN0YXQodGhpcy5zdGF0ZS5ncm93dGhSZWR1Y3Rpb25QZXJjZW50LCAnJScsIHRoaXMuc3RhdGUuZ3Jvd3RoUmVkdWN0aW9uUGVyY2VudFNlKX0gKHt0aGlzLl9wcmVzZW50U3RhdCh0aGlzLnN0YXRlLmdyb3d0aFJlZHVjdGlvbiwgJ01CIC8gcm91bmQgdHJpcCcsIHRoaXMuc3RhdGUuZ3Jvd3RoUmVkdWN0aW9uU2UpfSk8YnIgLz48L3NwYW4+IDogJyd9XG4gICAgICAgICAgKFRoZSBhYm92ZSBzdGF0cyBpZ25vcmUgdGhlIGltcGFjdCBvZiBmaXJzdCA1IGhlYXAgc25hcHNob3RzLCB3aGljaCBhcmUgdHlwaWNhbGx5IG5vaXN5IGR1ZSB0byBhcHBsaWNhdGlvbiBzdGFydHVwICsgSmF2YVNjcmlwdCBlbmdpbmUgd2FybXVwKVxuICAgICAgICA8L2Rpdj5cbiAgICAgIDogJyd9XG4gICAgICA8ZGl2IHJlZj1cImQzX2RpdlwiIGNsYXNzTmFtZT1cImhlYXAtZ3Jvd3RoLWdyYXBoXCI+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPXt0aGlzLl9oYXNIZWFwU3RhdHMoKSA/ICdoaWRkZW4nIDogJyd9PlxuICAgICAgICAgIFJlc3VsdHMgZmlsZSBkb2VzIG5vdCBjb250YWluIGFueSBoZWFwIGdyb3d0aCBpbmZvcm1hdGlvbi4gUGxlYXNlIHJlLXJ1biBpbiB0aGUgbmV3ZXN0IHZlcnNpb24gb2YgQkxlYWsuXG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+O1xuICB9XG59XG4iXX0=