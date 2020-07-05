import * as ProgressBar from 'progress';
/**
 * A ProgressBar, using the 'progress' npm package.
 */
var ProgressProgressBar = /** @class */ (function () {
    function ProgressProgressBar(_debug) {
        this._debug = _debug;
        this._bar = null;
    }
    ProgressProgressBar.prototype.nextOperation = function () {
        this._bar.tick();
    };
    ProgressProgressBar.prototype.finish = function () {
        if (this._bar) {
            this._bar.update(1);
        }
    };
    ProgressProgressBar.prototype.abort = function () {
        if (this._bar) {
            this._bar.update(1);
        }
    };
    ProgressProgressBar.prototype.updateDescription = function (desc) {
        if (this._bar) {
            this._bar.render({
                msg: desc
            });
        }
    };
    ProgressProgressBar.prototype.setOperationCount = function (count) {
        this._bar = new ProgressBar('[:bar] :percent [:current/:total] :elapseds (ETA :etas) :msg', {
            complete: '=',
            incomplete: ' ',
            width: 20,
            total: count
        });
    };
    ProgressProgressBar.prototype.debug = function (data) {
        if (this._debug) {
            if (this._bar) {
                this._bar.interrupt("[DEBUG] " + data);
            }
            else {
                console.debug(data);
            }
        }
    };
    ProgressProgressBar.prototype.log = function (data) {
        if (this._bar) {
            this._bar.interrupt(data);
        }
        else {
            console.log(data);
        }
    };
    ProgressProgressBar.prototype.error = function (data) {
        if (this._bar) {
            // TODO: Red.
            this._bar.interrupt(data);
        }
        else {
            console.error(data);
        }
    };
    return ProgressProgressBar;
}());
export default ProgressProgressBar;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvZ3Jlc3NfcHJvZ3Jlc3NfYmFyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2xpYi9wcm9ncmVzc19wcm9ncmVzc19iYXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxLQUFLLFdBQVcsTUFBTSxVQUFVLENBQUM7QUFFeEM7O0dBRUc7QUFDSDtJQUVFLDZCQUE2QixNQUFlO1FBQWYsV0FBTSxHQUFOLE1BQU0sQ0FBUztRQURwQyxTQUFJLEdBQWdCLElBQUksQ0FBQztJQUNjLENBQUM7SUFFekMsMkNBQWEsR0FBcEI7UUFDRSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO0lBQ25CLENBQUM7SUFDTSxvQ0FBTSxHQUFiO1FBQ0UsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDZCxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN0QixDQUFDO0lBQ0gsQ0FBQztJQUNNLG1DQUFLLEdBQVo7UUFDRSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNkLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3RCLENBQUM7SUFDSCxDQUFDO0lBQ00sK0NBQWlCLEdBQXhCLFVBQXlCLElBQVk7UUFDbkMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDZCxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQztnQkFDZixHQUFHLEVBQUUsSUFBSTthQUNWLENBQUMsQ0FBQztRQUNMLENBQUM7SUFDSCxDQUFDO0lBQ00sK0NBQWlCLEdBQXhCLFVBQXlCLEtBQWE7UUFDcEMsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLFdBQVcsQ0FBQyw4REFBOEQsRUFBRTtZQUMxRixRQUFRLEVBQUUsR0FBRztZQUNiLFVBQVUsRUFBRSxHQUFHO1lBQ2YsS0FBSyxFQUFFLEVBQUU7WUFDVCxLQUFLLEVBQUUsS0FBSztTQUNiLENBQUMsQ0FBQztJQUNMLENBQUM7SUFDTSxtQ0FBSyxHQUFaLFVBQWEsSUFBWTtRQUN2QixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUNoQixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDZCxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFXLElBQU0sQ0FBQyxDQUFDO1lBQ3pDLENBQUM7WUFBQyxJQUFJLENBQUMsQ0FBQztnQkFDTixPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3RCLENBQUM7UUFDSCxDQUFDO0lBQ0gsQ0FBQztJQUNNLGlDQUFHLEdBQVYsVUFBVyxJQUFZO1FBQ3JCLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ2QsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDNUIsQ0FBQztRQUFDLElBQUksQ0FBQyxDQUFDO1lBQ04sT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNwQixDQUFDO0lBQ0gsQ0FBQztJQUNNLG1DQUFLLEdBQVosVUFBYSxJQUFZO1FBQ3ZCLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ2QsYUFBYTtZQUNiLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzVCLENBQUM7UUFBQyxJQUFJLENBQUMsQ0FBQztZQUNOLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDdEIsQ0FBQztJQUNILENBQUM7SUFDSCwwQkFBQztBQUFELENBQUMsQUF4REQsSUF3REMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge0lQcm9ncmVzc0Jhcn0gZnJvbSAnLi4vY29tbW9uL2ludGVyZmFjZXMnO1xuaW1wb3J0ICogYXMgUHJvZ3Jlc3NCYXIgZnJvbSAncHJvZ3Jlc3MnO1xuXG4vKipcbiAqIEEgUHJvZ3Jlc3NCYXIsIHVzaW5nIHRoZSAncHJvZ3Jlc3MnIG5wbSBwYWNrYWdlLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBQcm9ncmVzc1Byb2dyZXNzQmFyIGltcGxlbWVudHMgSVByb2dyZXNzQmFyIHtcbiAgcHJpdmF0ZSBfYmFyOiBQcm9ncmVzc0JhciA9IG51bGw7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgX2RlYnVnOiBib29sZWFuKSB7fVxuXG4gIHB1YmxpYyBuZXh0T3BlcmF0aW9uKCk6IHZvaWQge1xuICAgIHRoaXMuX2Jhci50aWNrKCk7XG4gIH1cbiAgcHVibGljIGZpbmlzaCgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fYmFyKSB7XG4gICAgICB0aGlzLl9iYXIudXBkYXRlKDEpO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgYWJvcnQoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX2Jhcikge1xuICAgICAgdGhpcy5fYmFyLnVwZGF0ZSgxKTtcbiAgICB9XG4gIH1cbiAgcHVibGljIHVwZGF0ZURlc2NyaXB0aW9uKGRlc2M6IHN0cmluZyk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9iYXIpIHtcbiAgICAgIHRoaXMuX2Jhci5yZW5kZXIoe1xuICAgICAgICBtc2c6IGRlc2NcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgc2V0T3BlcmF0aW9uQ291bnQoY291bnQ6IG51bWJlcik6IHZvaWQge1xuICAgIHRoaXMuX2JhciA9IG5ldyBQcm9ncmVzc0JhcignWzpiYXJdIDpwZXJjZW50IFs6Y3VycmVudC86dG90YWxdIDplbGFwc2VkcyAoRVRBIDpldGFzKSA6bXNnJywge1xuICAgICAgY29tcGxldGU6ICc9JyxcbiAgICAgIGluY29tcGxldGU6ICcgJyxcbiAgICAgIHdpZHRoOiAyMCxcbiAgICAgIHRvdGFsOiBjb3VudFxuICAgIH0pO1xuICB9XG4gIHB1YmxpYyBkZWJ1ZyhkYXRhOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fZGVidWcpIHtcbiAgICAgIGlmICh0aGlzLl9iYXIpIHtcbiAgICAgICAgdGhpcy5fYmFyLmludGVycnVwdChgW0RFQlVHXSAke2RhdGF9YCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmRlYnVnKGRhdGEpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBwdWJsaWMgbG9nKGRhdGE6IHN0cmluZyk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9iYXIpIHtcbiAgICAgIHRoaXMuX2Jhci5pbnRlcnJ1cHQoZGF0YSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnNvbGUubG9nKGRhdGEpO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgZXJyb3IoZGF0YTogc3RyaW5nKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX2Jhcikge1xuICAgICAgLy8gVE9ETzogUmVkLlxuICAgICAgdGhpcy5fYmFyLmludGVycnVwdChkYXRhKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc29sZS5lcnJvcihkYXRhKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==