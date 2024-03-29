export function time(n, log, action) {
    var start = Date.now();
    var rv = action();
    var end = Date.now();
    var str = "Time to run " + n + ": " + (end - start) / 1000 + " seconds.";
    log.log(str);
    return rv;
}
export function wait(ms) {
    return new Promise(function (res) {
        setTimeout(res, ms);
    });
}
var OneBitArray = /** @class */ (function () {
    function OneBitArray(length) {
        this._bits = new Uint8Array(Math.ceil(length / 8));
    }
    OneBitArray.prototype.set = function (i, v) {
        var index = i >> 3;
        var offset = i - (index << 3);
        var mask = (1 << offset);
        // Clear bit
        this._bits[index] &= ~mask;
        if (v) {
            // Set bit
            this._bits[index] |= mask;
        }
    };
    OneBitArray.prototype.get = function (i) {
        var index = i >> 3;
        var offset = i - (index << 3);
        return (this._bits[index] & (1 << offset)) !== 0;
    };
    return OneBitArray;
}());
export { OneBitArray };
var TwoBitArray = /** @class */ (function () {
    function TwoBitArray(length) {
        this._bits = new Uint8Array(Math.ceil(length / 4));
    }
    TwoBitArray.prototype.fill = function (v) {
        var vMasked = v & 0x3;
        var vQuad = (vMasked << 6) | (vMasked << 4) | (vMasked << 2) | vMasked;
        this._bits.fill(vQuad);
    };
    TwoBitArray.prototype.set = function (i, v) {
        var index = i >> 2;
        var offset = (i - (index << 2)) << 1;
        var mask = 0x3 << offset;
        // Clear area
        this._bits[index] &= ~mask;
        // Set area
        this._bits[index] |= (v & 0x3) << offset;
    };
    TwoBitArray.prototype.get = function (i) {
        var index = i >> 2;
        var offset = (i - (index << 2)) << 1;
        var mask = 0x3 << offset;
        return (this._bits[index] & mask) >> offset;
    };
    return TwoBitArray;
}());
export { TwoBitArray };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21tb24vdXRpbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFFQSxNQUFNLGVBQWtCLENBQVMsRUFBRSxHQUFRLEVBQUUsTUFBZTtJQUMxRCxJQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7SUFDekIsSUFBTSxFQUFFLEdBQUcsTUFBTSxFQUFFLENBQUM7SUFDcEIsSUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBQ3ZCLElBQU0sR0FBRyxHQUFHLGlCQUFlLENBQUMsVUFBSyxDQUFDLEdBQUcsR0FBRyxLQUFLLENBQUMsR0FBRyxJQUFJLGNBQVcsQ0FBQztJQUNqRSxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2IsTUFBTSxDQUFDLEVBQUUsQ0FBQztBQUNaLENBQUM7QUFFRCxNQUFNLGVBQWUsRUFBVTtJQUM3QixNQUFNLENBQUMsSUFBSSxPQUFPLENBQU8sVUFBQyxHQUFHO1FBQzNCLFVBQVUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDdEIsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBRUQ7SUFFRSxxQkFBWSxNQUFjO1FBQ3hCLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNyRCxDQUFDO0lBRU0seUJBQUcsR0FBVixVQUFXLENBQVMsRUFBRSxDQUFVO1FBQzlCLElBQU0sS0FBSyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDckIsSUFBTSxNQUFNLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ2hDLElBQU0sSUFBSSxHQUFHLENBQUMsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxDQUFDO1FBQzNCLFlBQVk7UUFDWixJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO1FBQzNCLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDTixVQUFVO1lBQ1YsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxJQUFJLENBQUM7UUFDNUIsQ0FBQztJQUNILENBQUM7SUFFTSx5QkFBRyxHQUFWLFVBQVcsQ0FBUztRQUNsQixJQUFNLEtBQUssR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3JCLElBQU0sTUFBTSxHQUFHLENBQUMsR0FBRyxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQztRQUNoQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ25ELENBQUM7SUFDSCxrQkFBQztBQUFELENBQUMsQUF2QkQsSUF1QkM7O0FBRUQ7SUFFRSxxQkFBWSxNQUFjO1FBQ3hCLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNyRCxDQUFDO0lBRU0sMEJBQUksR0FBWCxVQUFZLENBQVM7UUFDbkIsSUFBTSxPQUFPLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQztRQUN4QixJQUFNLEtBQUssR0FBRyxDQUFDLE9BQU8sSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLE9BQU8sSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLE9BQU8sSUFBSSxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUM7UUFDekUsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDekIsQ0FBQztJQUVNLHlCQUFHLEdBQVYsVUFBVyxDQUFTLEVBQUUsQ0FBUztRQUM3QixJQUFNLEtBQUssR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3JCLElBQU0sTUFBTSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3ZDLElBQU0sSUFBSSxHQUFHLEdBQUcsSUFBSSxNQUFNLENBQUM7UUFDM0IsYUFBYTtRQUNiLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7UUFDM0IsV0FBVztRQUNYLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLElBQUksTUFBTSxDQUFDO0lBQzNDLENBQUM7SUFFTSx5QkFBRyxHQUFWLFVBQVcsQ0FBUztRQUNsQixJQUFNLEtBQUssR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3JCLElBQU0sTUFBTSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3ZDLElBQU0sSUFBSSxHQUFHLEdBQUcsSUFBSSxNQUFNLENBQUM7UUFDM0IsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxNQUFNLENBQUM7SUFDOUMsQ0FBQztJQUNILGtCQUFDO0FBQUQsQ0FBQyxBQTVCRCxJQTRCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7TG9nfSBmcm9tICcuL2ludGVyZmFjZXMnO1xuXG5leHBvcnQgZnVuY3Rpb24gdGltZTxUPihuOiBzdHJpbmcsIGxvZzogTG9nLCBhY3Rpb246ICgpID0+IFQpOiBUIHtcbiAgY29uc3Qgc3RhcnQgPSBEYXRlLm5vdygpO1xuICBjb25zdCBydiA9IGFjdGlvbigpO1xuICBjb25zdCBlbmQgPSBEYXRlLm5vdygpO1xuICBjb25zdCBzdHIgPSBgVGltZSB0byBydW4gJHtufTogJHsoZW5kIC0gc3RhcnQpIC8gMTAwMH0gc2Vjb25kcy5gO1xuICBsb2cubG9nKHN0cik7XG4gIHJldHVybiBydjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHdhaXQobXM6IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlcykgPT4ge1xuICAgIHNldFRpbWVvdXQocmVzLCBtcyk7XG4gIH0pO1xufVxuXG5leHBvcnQgY2xhc3MgT25lQml0QXJyYXkge1xuICBwcml2YXRlIF9iaXRzOiBVaW50OEFycmF5O1xuICBjb25zdHJ1Y3RvcihsZW5ndGg6IG51bWJlcikge1xuICAgIHRoaXMuX2JpdHMgPSBuZXcgVWludDhBcnJheShNYXRoLmNlaWwobGVuZ3RoIC8gOCkpO1xuICB9XG5cbiAgcHVibGljIHNldChpOiBudW1iZXIsIHY6IGJvb2xlYW4pIHtcbiAgICBjb25zdCBpbmRleCA9IGkgPj4gMztcbiAgICBjb25zdCBvZmZzZXQgPSBpIC0gKGluZGV4IDw8IDMpO1xuICAgIGNvbnN0IG1hc2sgPSAoMSA8PCBvZmZzZXQpO1xuICAgIC8vIENsZWFyIGJpdFxuICAgIHRoaXMuX2JpdHNbaW5kZXhdICY9IH5tYXNrO1xuICAgIGlmICh2KSB7XG4gICAgICAvLyBTZXQgYml0XG4gICAgICB0aGlzLl9iaXRzW2luZGV4XSB8PSBtYXNrO1xuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBnZXQoaTogbnVtYmVyKTogYm9vbGVhbiB7XG4gICAgY29uc3QgaW5kZXggPSBpID4+IDM7XG4gICAgY29uc3Qgb2Zmc2V0ID0gaSAtIChpbmRleCA8PCAzKTtcbiAgICByZXR1cm4gKHRoaXMuX2JpdHNbaW5kZXhdICYgKDEgPDwgb2Zmc2V0KSkgIT09IDA7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFR3b0JpdEFycmF5IHtcbiAgcHJpdmF0ZSBfYml0czogVWludDhBcnJheTtcbiAgY29uc3RydWN0b3IobGVuZ3RoOiBudW1iZXIpIHtcbiAgICB0aGlzLl9iaXRzID0gbmV3IFVpbnQ4QXJyYXkoTWF0aC5jZWlsKGxlbmd0aCAvIDQpKTtcbiAgfVxuXG4gIHB1YmxpYyBmaWxsKHY6IG51bWJlcik6IHZvaWQge1xuICAgIGNvbnN0IHZNYXNrZWQgPSB2ICYgMHgzO1xuICAgIGNvbnN0IHZRdWFkID0gKHZNYXNrZWQgPDwgNikgfCAodk1hc2tlZCA8PCA0KSB8ICh2TWFza2VkIDw8IDIpIHwgdk1hc2tlZDtcbiAgICB0aGlzLl9iaXRzLmZpbGwodlF1YWQpO1xuICB9XG5cbiAgcHVibGljIHNldChpOiBudW1iZXIsIHY6IG51bWJlcikge1xuICAgIGNvbnN0IGluZGV4ID0gaSA+PiAyO1xuICAgIGNvbnN0IG9mZnNldCA9IChpIC0gKGluZGV4IDw8IDIpKSA8PCAxO1xuICAgIGNvbnN0IG1hc2sgPSAweDMgPDwgb2Zmc2V0O1xuICAgIC8vIENsZWFyIGFyZWFcbiAgICB0aGlzLl9iaXRzW2luZGV4XSAmPSB+bWFzaztcbiAgICAvLyBTZXQgYXJlYVxuICAgIHRoaXMuX2JpdHNbaW5kZXhdIHw9ICh2ICYgMHgzKSA8PCBvZmZzZXQ7XG4gIH1cblxuICBwdWJsaWMgZ2V0KGk6IG51bWJlcik6IG51bWJlciB7XG4gICAgY29uc3QgaW5kZXggPSBpID4+IDI7XG4gICAgY29uc3Qgb2Zmc2V0ID0gKGkgLSAoaW5kZXggPDwgMikpIDw8IDE7XG4gICAgY29uc3QgbWFzayA9IDB4MyA8PCBvZmZzZXQ7XG4gICAgcmV0dXJuICh0aGlzLl9iaXRzW2luZGV4XSAmIG1hc2spID4+IG9mZnNldDtcbiAgfVxufVxuIl19