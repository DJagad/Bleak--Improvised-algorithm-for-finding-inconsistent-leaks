/**
 * A progress bar that does... nothing.
 */
var NopProgressBar = /** @class */ (function () {
    function NopProgressBar() {
    }
    NopProgressBar.prototype.nextOperation = function () { };
    NopProgressBar.prototype.finish = function () { };
    NopProgressBar.prototype.abort = function () { };
    NopProgressBar.prototype.updateDescription = function (desc) { };
    NopProgressBar.prototype.setOperationCount = function (count) { };
    NopProgressBar.prototype.debug = function (data) { };
    NopProgressBar.prototype.log = function (data) { };
    NopProgressBar.prototype.error = function (data) { };
    return NopProgressBar;
}());
export default NopProgressBar;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9wX3Byb2dyZXNzX2Jhci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9saWIvbm9wX3Byb2dyZXNzX2Jhci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFFQTs7R0FFRztBQUNIO0lBQUE7SUFTQSxDQUFDO0lBUkMsc0NBQWEsR0FBYixjQUF1QixDQUFDO0lBQ3hCLCtCQUFNLEdBQU4sY0FBZ0IsQ0FBQztJQUNqQiw4QkFBSyxHQUFMLGNBQWUsQ0FBQztJQUNoQiwwQ0FBaUIsR0FBakIsVUFBa0IsSUFBWSxJQUFTLENBQUM7SUFDeEMsMENBQWlCLEdBQWpCLFVBQWtCLEtBQWEsSUFBUyxDQUFDO0lBQ3pDLDhCQUFLLEdBQUwsVUFBTSxJQUFZLElBQVMsQ0FBQztJQUM1Qiw0QkFBRyxHQUFILFVBQUksSUFBWSxJQUFTLENBQUM7SUFDMUIsOEJBQUssR0FBTCxVQUFNLElBQVksSUFBUyxDQUFDO0lBQzlCLHFCQUFDO0FBQUQsQ0FBQyxBQVRELElBU0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge0lQcm9ncmVzc0Jhcn0gZnJvbSAnLi4vY29tbW9uL2ludGVyZmFjZXMnO1xuXG4vKipcbiAqIEEgcHJvZ3Jlc3MgYmFyIHRoYXQgZG9lcy4uLiBub3RoaW5nLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBOb3BQcm9ncmVzc0JhciBpbXBsZW1lbnRzIElQcm9ncmVzc0JhciB7XG4gIG5leHRPcGVyYXRpb24oKTogdm9pZCB7fVxuICBmaW5pc2goKTogdm9pZCB7fVxuICBhYm9ydCgpOiB2b2lkIHt9XG4gIHVwZGF0ZURlc2NyaXB0aW9uKGRlc2M6IHN0cmluZyk6IHZvaWQge31cbiAgc2V0T3BlcmF0aW9uQ291bnQoY291bnQ6IG51bWJlcik6IHZvaWQge31cbiAgZGVidWcoZGF0YTogc3RyaW5nKTogdm9pZCB7fVxuICBsb2coZGF0YTogc3RyaW5nKTogdm9pZCB7fVxuICBlcnJvcihkYXRhOiBzdHJpbmcpOiB2b2lkIHt9XG59Il19