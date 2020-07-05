import * as tslib_1 from "tslib";
import Location from './location';
var StackFrame = /** @class */ (function (_super) {
    tslib_1.__extends(StackFrame, _super);
    function StackFrame(file, name, 
    // 1-indexed line
    line, 
    // 1-indexed column
    column) {
        var _this = _super.call(this, file, line, column, true) || this;
        _this.name = name;
        if (!_this.name) {
            _this.name = "(anonymous)";
        }
        return _this;
    }
    return StackFrame;
}(Location));
export default StackFrame;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhY2tfZnJhbWUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvdmlld2VyL21vZGVsL3N0YWNrX2ZyYW1lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLFFBQVEsTUFBTSxZQUFZLENBQUM7QUFHbEM7SUFBd0Msc0NBQVE7SUFDOUMsb0JBQVksSUFBZ0IsRUFDVixJQUFZO0lBQzVCLGlCQUFpQjtJQUNqQixJQUFZO0lBQ1osbUJBQW1CO0lBQ25CLE1BQWM7UUFMaEIsWUFNRSxrQkFBTSxJQUFJLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsU0FJaEM7UUFUaUIsVUFBSSxHQUFKLElBQUksQ0FBUTtRQU01QixFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ2YsS0FBSSxDQUFDLElBQUksR0FBRyxhQUFhLENBQUM7UUFDNUIsQ0FBQzs7SUFDSCxDQUFDO0lBQ0gsaUJBQUM7QUFBRCxDQUFDLEFBWkQsQ0FBd0MsUUFBUSxHQVkvQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBMb2NhdGlvbiBmcm9tICcuL2xvY2F0aW9uJztcbmltcG9ydCBTb3VyY2VGaWxlIGZyb20gJy4vc291cmNlX2ZpbGUnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTdGFja0ZyYW1lIGV4dGVuZHMgTG9jYXRpb24ge1xuICBjb25zdHJ1Y3RvcihmaWxlOiBTb3VyY2VGaWxlLFxuICAgIHB1YmxpYyByZWFkb25seSBuYW1lOiBzdHJpbmcsXG4gICAgLy8gMS1pbmRleGVkIGxpbmVcbiAgICBsaW5lOiBudW1iZXIsXG4gICAgLy8gMS1pbmRleGVkIGNvbHVtblxuICAgIGNvbHVtbjogbnVtYmVyKSB7XG4gICAgc3VwZXIoZmlsZSwgbGluZSwgY29sdW1uLCB0cnVlKTtcbiAgICBpZiAoIXRoaXMubmFtZSkge1xuICAgICAgdGhpcy5uYW1lID0gXCIoYW5vbnltb3VzKVwiO1xuICAgIH1cbiAgfVxufSJdfQ==