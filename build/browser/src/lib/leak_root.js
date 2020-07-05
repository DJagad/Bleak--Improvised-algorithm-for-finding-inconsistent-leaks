/**
 * Represents a leak root in a BLeak report.
 */
var LeakRoot = /** @class */ (function () {
    function LeakRoot(id, paths, scores, stacks) {
        if (stacks === void 0) { stacks = []; }
        this.id = id;
        this.paths = paths;
        this.scores = scores;
        this.stacks = stacks;
    }
    LeakRoot.FromJSON = function (lr) {
        return new LeakRoot(lr.id, lr.paths, lr.scores, lr.stacks);
    };
    LeakRoot.prototype.addStackTrace = function (st) {
        this.stacks.push(st);
    };
    LeakRoot.prototype.toJSON = function () {
        return {
            id: this.id,
            paths: this.paths,
            scores: this.scores,
            stacks: this.stacks
        };
    };
    return LeakRoot;
}());
export default LeakRoot;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGVha19yb290LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2xpYi9sZWFrX3Jvb3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRUE7O0dBRUc7QUFDSDtJQUtFLGtCQUNrQixFQUFVLEVBQ1YsS0FBYyxFQUNkLE1BQW1CLEVBQ25CLE1BQXFCO1FBQXJCLHVCQUFBLEVBQUEsV0FBcUI7UUFIckIsT0FBRSxHQUFGLEVBQUUsQ0FBUTtRQUNWLFVBQUssR0FBTCxLQUFLLENBQVM7UUFDZCxXQUFNLEdBQU4sTUFBTSxDQUFhO1FBQ25CLFdBQU0sR0FBTixNQUFNLENBQWU7SUFDcEMsQ0FBQztJQVRVLGlCQUFRLEdBQXRCLFVBQXVCLEVBQWE7UUFDbEMsTUFBTSxDQUFDLElBQUksUUFBUSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUM3RCxDQUFDO0lBU00sZ0NBQWEsR0FBcEIsVUFBcUIsRUFBVTtRQUM3QixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUN2QixDQUFDO0lBRU0seUJBQU0sR0FBYjtRQUNFLE1BQU0sQ0FBQztZQUNMLEVBQUUsRUFBRSxJQUFJLENBQUMsRUFBRTtZQUNYLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSztZQUNqQixNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU07WUFDbkIsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNO1NBQ3BCLENBQUM7SUFDSixDQUFDO0lBQ0gsZUFBQztBQUFELENBQUMsQUF4QkQsSUF3QkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge0lMZWFrUm9vdCwgSUxlYWtTY29yZXMsIElTdGFjaywgSVBhdGh9IGZyb20gJy4uL2NvbW1vbi9pbnRlcmZhY2VzJztcblxuLyoqXG4gKiBSZXByZXNlbnRzIGEgbGVhayByb290IGluIGEgQkxlYWsgcmVwb3J0LlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBMZWFrUm9vdCBpbXBsZW1lbnRzIElMZWFrUm9vdCB7XG4gIHB1YmxpYyBzdGF0aWMgRnJvbUpTT04obHI6IElMZWFrUm9vdCk6IExlYWtSb290IHtcbiAgICByZXR1cm4gbmV3IExlYWtSb290KGxyLmlkLCBsci5wYXRocywgbHIuc2NvcmVzLCBsci5zdGFja3MpO1xuICB9XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHVibGljIHJlYWRvbmx5IGlkOiBudW1iZXIsXG4gICAgcHVibGljIHJlYWRvbmx5IHBhdGhzOiBJUGF0aFtdLFxuICAgIHB1YmxpYyByZWFkb25seSBzY29yZXM6IElMZWFrU2NvcmVzLFxuICAgIHB1YmxpYyByZWFkb25seSBzdGFja3M6IElTdGFja1tdID0gW11cbiAgKSB7fVxuXG4gIHB1YmxpYyBhZGRTdGFja1RyYWNlKHN0OiBJU3RhY2spOiB2b2lkIHtcbiAgICB0aGlzLnN0YWNrcy5wdXNoKHN0KTtcbiAgfVxuXG4gIHB1YmxpYyB0b0pTT04oKTogSUxlYWtSb290IHtcbiAgICByZXR1cm4ge1xuICAgICAgaWQ6IHRoaXMuaWQsXG4gICAgICBwYXRoczogdGhpcy5wYXRocyxcbiAgICAgIHNjb3JlczogdGhpcy5zY29yZXMsXG4gICAgICBzdGFja3M6IHRoaXMuc3RhY2tzXG4gICAgfTtcbiAgfVxufSJdfQ==