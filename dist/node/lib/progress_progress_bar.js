"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ProgressBar = require("progress");
/**
 * A ProgressBar, using the 'progress' npm package.
 */
class ProgressProgressBar {
    constructor(_debug) {
        this._debug = _debug;
        this._bar = null;
    }
    nextOperation() {
        this._bar.tick();
    }
    finish() {
        if (this._bar) {
            this._bar.update(1);
        }
    }
    abort() {
        if (this._bar) {
            this._bar.update(1);
        }
    }
    updateDescription(desc) {
        if (this._bar) {
            this._bar.render({
                msg: desc
            });
        }
    }
    setOperationCount(count) {
        this._bar = new ProgressBar('[:bar] :percent [:current/:total] :elapseds (ETA :etas) :msg', {
            complete: '=',
            incomplete: ' ',
            width: 20,
            total: count
        });
    }
    debug(data) {
        if (this._debug) {
            if (this._bar) {
                this._bar.interrupt(`[DEBUG] ${data}`);
            }
            else {
                console.debug(data);
            }
        }
    }
    log(data) {
        if (this._bar) {
            this._bar.interrupt(data);
        }
        else {
            console.log(data);
        }
    }
    error(data) {
        if (this._bar) {
            // TODO: Red.
            this._bar.interrupt(data);
        }
        else {
            console.error(data);
        }
    }
}
exports.default = ProgressProgressBar;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvZ3Jlc3NfcHJvZ3Jlc3NfYmFyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2xpYi9wcm9ncmVzc19wcm9ncmVzc19iYXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQSx3Q0FBd0M7QUFFeEM7O0dBRUc7QUFDSDtJQUVFLFlBQTZCLE1BQWU7UUFBZixXQUFNLEdBQU4sTUFBTSxDQUFTO1FBRHBDLFNBQUksR0FBZ0IsSUFBSSxDQUFDO0lBQ2MsQ0FBQztJQUV6QyxhQUFhO1FBQ2xCLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDbkIsQ0FBQztJQUNNLE1BQU07UUFDWCxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNkLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3RCLENBQUM7SUFDSCxDQUFDO0lBQ00sS0FBSztRQUNWLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ2QsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdEIsQ0FBQztJQUNILENBQUM7SUFDTSxpQkFBaUIsQ0FBQyxJQUFZO1FBQ25DLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ2QsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7Z0JBQ2YsR0FBRyxFQUFFLElBQUk7YUFDVixDQUFDLENBQUM7UUFDTCxDQUFDO0lBQ0gsQ0FBQztJQUNNLGlCQUFpQixDQUFDLEtBQWE7UUFDcEMsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLFdBQVcsQ0FBQyw4REFBOEQsRUFBRTtZQUMxRixRQUFRLEVBQUUsR0FBRztZQUNiLFVBQVUsRUFBRSxHQUFHO1lBQ2YsS0FBSyxFQUFFLEVBQUU7WUFDVCxLQUFLLEVBQUUsS0FBSztTQUNiLENBQUMsQ0FBQztJQUNMLENBQUM7SUFDTSxLQUFLLENBQUMsSUFBWTtRQUN2QixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUNoQixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDZCxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxXQUFXLElBQUksRUFBRSxDQUFDLENBQUM7WUFDekMsQ0FBQztZQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNOLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDdEIsQ0FBQztRQUNILENBQUM7SUFDSCxDQUFDO0lBQ00sR0FBRyxDQUFDLElBQVk7UUFDckIsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDZCxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM1QixDQUFDO1FBQUMsSUFBSSxDQUFDLENBQUM7WUFDTixPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3BCLENBQUM7SUFDSCxDQUFDO0lBQ00sS0FBSyxDQUFDLElBQVk7UUFDdkIsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDZCxhQUFhO1lBQ2IsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDNUIsQ0FBQztRQUFDLElBQUksQ0FBQyxDQUFDO1lBQ04sT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN0QixDQUFDO0lBQ0gsQ0FBQztDQUNGO0FBeERELHNDQXdEQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7SVByb2dyZXNzQmFyfSBmcm9tICcuLi9jb21tb24vaW50ZXJmYWNlcyc7XG5pbXBvcnQgKiBhcyBQcm9ncmVzc0JhciBmcm9tICdwcm9ncmVzcyc7XG5cbi8qKlxuICogQSBQcm9ncmVzc0JhciwgdXNpbmcgdGhlICdwcm9ncmVzcycgbnBtIHBhY2thZ2UuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFByb2dyZXNzUHJvZ3Jlc3NCYXIgaW1wbGVtZW50cyBJUHJvZ3Jlc3NCYXIge1xuICBwcml2YXRlIF9iYXI6IFByb2dyZXNzQmFyID0gbnVsbDtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBfZGVidWc6IGJvb2xlYW4pIHt9XG5cbiAgcHVibGljIG5leHRPcGVyYXRpb24oKTogdm9pZCB7XG4gICAgdGhpcy5fYmFyLnRpY2soKTtcbiAgfVxuICBwdWJsaWMgZmluaXNoKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9iYXIpIHtcbiAgICAgIHRoaXMuX2Jhci51cGRhdGUoMSk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBhYm9ydCgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fYmFyKSB7XG4gICAgICB0aGlzLl9iYXIudXBkYXRlKDEpO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgdXBkYXRlRGVzY3JpcHRpb24oZGVzYzogc3RyaW5nKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX2Jhcikge1xuICAgICAgdGhpcy5fYmFyLnJlbmRlcih7XG4gICAgICAgIG1zZzogZGVzY1xuICAgICAgfSk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBzZXRPcGVyYXRpb25Db3VudChjb3VudDogbnVtYmVyKTogdm9pZCB7XG4gICAgdGhpcy5fYmFyID0gbmV3IFByb2dyZXNzQmFyKCdbOmJhcl0gOnBlcmNlbnQgWzpjdXJyZW50Lzp0b3RhbF0gOmVsYXBzZWRzIChFVEEgOmV0YXMpIDptc2cnLCB7XG4gICAgICBjb21wbGV0ZTogJz0nLFxuICAgICAgaW5jb21wbGV0ZTogJyAnLFxuICAgICAgd2lkdGg6IDIwLFxuICAgICAgdG90YWw6IGNvdW50XG4gICAgfSk7XG4gIH1cbiAgcHVibGljIGRlYnVnKGRhdGE6IHN0cmluZyk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9kZWJ1Zykge1xuICAgICAgaWYgKHRoaXMuX2Jhcikge1xuICAgICAgICB0aGlzLl9iYXIuaW50ZXJydXB0KGBbREVCVUddICR7ZGF0YX1gKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoZGF0YSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHB1YmxpYyBsb2coZGF0YTogc3RyaW5nKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX2Jhcikge1xuICAgICAgdGhpcy5fYmFyLmludGVycnVwdChkYXRhKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc29sZS5sb2coZGF0YSk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBlcnJvcihkYXRhOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fYmFyKSB7XG4gICAgICAvLyBUT0RPOiBSZWQuXG4gICAgICB0aGlzLl9iYXIuaW50ZXJydXB0KGRhdGEpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zb2xlLmVycm9yKGRhdGEpO1xuICAgIH1cbiAgfVxufVxuIl19