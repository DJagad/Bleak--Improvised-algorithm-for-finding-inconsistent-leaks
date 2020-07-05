// Portion of the bleak agent that should be transformed to capture scope information.
// TODO: Can add Maps and Sets here.
/**
 * Override bind so that we properly capture __scope__ here.
 */
function aFunction(it) {
    if (typeof it !== 'function') {
        throw TypeError(it + ' is not a function!');
    }
    return it;
}
function isObject(it) {
    return it !== null && (typeof it == 'object' || typeof it == 'function');
}
var _slice = [].slice;
var factories = {};
function construct(F, len, args) {
    if (!(len in factories)) {
        for (var n = [], i = 0; i < len; i++)
            n[i] = 'a[' + i + ']';
        factories[len] = Function('F,a', 'return new F(' + n.join(',') + ')');
    }
    return factories[len](F, args);
}
function invoke(fn, args, that) {
    return fn.apply(that, args);
}
Function.prototype.bind = function bind(that) {
    var partArgs = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        partArgs[_i - 1] = arguments[_i];
    }
    var fn = aFunction(this);
    var bound = function () {
        var restArgs = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            restArgs[_i] = arguments[_i];
        }
        var args = partArgs.concat(restArgs);
        return this instanceof bound ? construct(fn, args.length, args) : invoke(fn, args, that);
    };
    if (isObject(fn.prototype)) {
        bound.prototype = fn.prototype;
    }
    return bound;
};
// We use a script that launches Chrome for us, but disables the Notifications feature
// that some apps depends on. Chrome disables the feature by removing the object, breaking
// these apps.
// So we define a skeleton that says 'denied', which is really what Chrome should be doing...
// Make sure we're running in the main browser thread...
if (typeof (window) !== "undefined") {
    window['Notification'] = {
        permission: 'denied',
        requestPermission: function () { return Promise.resolve('denied'); }
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmxlYWtfYWdlbnRfdHJhbnNmb3JtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2xpYi9ibGVha19hZ2VudF90cmFuc2Zvcm0udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsc0ZBQXNGO0FBQ3RGLG9DQUFvQztBQUVwQzs7R0FFRztBQUNILG1CQUFtQixFQUFZO0lBQzdCLEVBQUUsQ0FBQyxDQUFDLE9BQU8sRUFBRSxLQUFLLFVBQVUsQ0FBQyxDQUFDLENBQUM7UUFDN0IsTUFBTSxTQUFTLENBQUMsRUFBRSxHQUFHLHFCQUFxQixDQUFDLENBQUM7SUFDOUMsQ0FBQztJQUNELE1BQU0sQ0FBQyxFQUFFLENBQUM7QUFDWixDQUFDO0FBRUQsa0JBQWtCLEVBQU87SUFDdkIsTUFBTSxDQUFDLEVBQUUsS0FBSyxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxRQUFRLElBQUksT0FBTyxFQUFFLElBQUksVUFBVSxDQUFDLENBQUM7QUFDM0UsQ0FBQztBQUVELElBQU0sTUFBTSxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUM7QUFDeEIsSUFBTSxTQUFTLEdBQThCLEVBQUUsQ0FBQztBQUVoRCxtQkFBbUIsQ0FBVyxFQUFFLEdBQVcsRUFBRSxJQUFXO0lBQ3RELEVBQUUsQ0FBQSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksU0FBUyxDQUFDLENBQUMsQ0FBQSxDQUFDO1FBQ3RCLEdBQUcsQ0FBQSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFO1lBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDO1FBQzFELFNBQVMsQ0FBQyxHQUFHLENBQUMsR0FBRyxRQUFRLENBQUMsS0FBSyxFQUFFLGVBQWUsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDO0lBQ3hFLENBQUM7SUFDRCxNQUFNLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUNqQyxDQUFDO0FBRUQsZ0JBQWdCLEVBQVksRUFBRSxJQUFXLEVBQUUsSUFBUztJQUNsRCxNQUFNLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDOUIsQ0FBQztBQUVELFFBQVEsQ0FBQyxTQUFTLENBQUMsSUFBSSxHQUFHLGNBQThCLElBQVM7SUFBRSxrQkFBa0I7U0FBbEIsVUFBa0IsRUFBbEIscUJBQWtCLEVBQWxCLElBQWtCO1FBQWxCLGlDQUFrQjs7SUFDbkYsSUFBTSxFQUFFLEdBQVMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2pDLElBQU0sS0FBSyxHQUFHO1FBQW9CLGtCQUFrQjthQUFsQixVQUFrQixFQUFsQixxQkFBa0IsRUFBbEIsSUFBa0I7WUFBbEIsNkJBQWtCOztRQUNsRCxJQUFNLElBQUksR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3ZDLE1BQU0sQ0FBQyxJQUFJLFlBQVksS0FBSyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzNGLENBQUMsQ0FBQztJQUNGLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzNCLEtBQUssQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDLFNBQVMsQ0FBQztJQUNqQyxDQUFDO0lBQ0QsTUFBTSxDQUFDLEtBQUssQ0FBQztBQUNmLENBQUMsQ0FBQztBQUVGLHNGQUFzRjtBQUN0RiwwRkFBMEY7QUFDMUYsY0FBYztBQUNkLDZGQUE2RjtBQUM3Rix3REFBd0Q7QUFDeEQsRUFBRSxDQUFDLENBQUMsT0FBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLFdBQVcsQ0FBQyxDQUFDLENBQUM7SUFDbEMsTUFBYyxDQUFDLGNBQWMsQ0FBQyxHQUFHO1FBQ2hDLFVBQVUsRUFBRSxRQUFRO1FBQ3BCLGlCQUFpQixFQUFFLGNBQWEsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ3BFLENBQUM7QUFDSixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLy8gUG9ydGlvbiBvZiB0aGUgYmxlYWsgYWdlbnQgdGhhdCBzaG91bGQgYmUgdHJhbnNmb3JtZWQgdG8gY2FwdHVyZSBzY29wZSBpbmZvcm1hdGlvbi5cbi8vIFRPRE86IENhbiBhZGQgTWFwcyBhbmQgU2V0cyBoZXJlLlxuXG4vKipcbiAqIE92ZXJyaWRlIGJpbmQgc28gdGhhdCB3ZSBwcm9wZXJseSBjYXB0dXJlIF9fc2NvcGVfXyBoZXJlLlxuICovXG5mdW5jdGlvbiBhRnVuY3Rpb24oaXQ6IEZ1bmN0aW9uKTogRnVuY3Rpb24ge1xuICBpZiAodHlwZW9mIGl0ICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgdGhyb3cgVHlwZUVycm9yKGl0ICsgJyBpcyBub3QgYSBmdW5jdGlvbiEnKTtcbiAgfVxuICByZXR1cm4gaXQ7XG59XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGl0OiBhbnkpOiBpdCBpcyBvYmplY3Qge1xuICByZXR1cm4gaXQgIT09IG51bGwgJiYgKHR5cGVvZiBpdCA9PSAnb2JqZWN0JyB8fCB0eXBlb2YgaXQgPT0gJ2Z1bmN0aW9uJyk7XG59XG5cbmNvbnN0IF9zbGljZSA9IFtdLnNsaWNlO1xuY29uc3QgZmFjdG9yaWVzOiB7W2xlbjogbnVtYmVyXTogRnVuY3Rpb259ID0ge307XG5cbmZ1bmN0aW9uIGNvbnN0cnVjdChGOiBGdW5jdGlvbiwgbGVuOiBudW1iZXIsIGFyZ3M6IGFueVtdKSB7XG4gIGlmKCEobGVuIGluIGZhY3Rvcmllcykpe1xuICAgIGZvcih2YXIgbiA9IFtdLCBpID0gMDsgaSA8IGxlbjsgaSsrKW5baV0gPSAnYVsnICsgaSArICddJztcbiAgICBmYWN0b3JpZXNbbGVuXSA9IEZ1bmN0aW9uKCdGLGEnLCAncmV0dXJuIG5ldyBGKCcgKyBuLmpvaW4oJywnKSArICcpJyk7XG4gIH1cbiAgcmV0dXJuIGZhY3Rvcmllc1tsZW5dKEYsIGFyZ3MpO1xufVxuXG5mdW5jdGlvbiBpbnZva2UoZm46IEZ1bmN0aW9uLCBhcmdzOiBhbnlbXSwgdGhhdDogYW55KXtcbiAgcmV0dXJuIGZuLmFwcGx5KHRoYXQsIGFyZ3MpO1xufVxuXG5GdW5jdGlvbi5wcm90b3R5cGUuYmluZCA9IGZ1bmN0aW9uIGJpbmQodGhpczogRnVuY3Rpb24sIHRoYXQ6IGFueSwgLi4ucGFydEFyZ3M6IGFueVtdKTogRnVuY3Rpb24ge1xuICBjb25zdCBmbiAgICAgICA9IGFGdW5jdGlvbih0aGlzKTtcbiAgY29uc3QgYm91bmQgPSBmdW5jdGlvbih0aGlzOiBhbnksIC4uLnJlc3RBcmdzOiBhbnlbXSl7XG4gICAgY29uc3QgYXJncyA9IHBhcnRBcmdzLmNvbmNhdChyZXN0QXJncyk7XG4gICAgcmV0dXJuIHRoaXMgaW5zdGFuY2VvZiBib3VuZCA/IGNvbnN0cnVjdChmbiwgYXJncy5sZW5ndGgsIGFyZ3MpIDogaW52b2tlKGZuLCBhcmdzLCB0aGF0KTtcbiAgfTtcbiAgaWYgKGlzT2JqZWN0KGZuLnByb3RvdHlwZSkpIHtcbiAgICBib3VuZC5wcm90b3R5cGUgPSBmbi5wcm90b3R5cGU7XG4gIH1cbiAgcmV0dXJuIGJvdW5kO1xufTtcblxuLy8gV2UgdXNlIGEgc2NyaXB0IHRoYXQgbGF1bmNoZXMgQ2hyb21lIGZvciB1cywgYnV0IGRpc2FibGVzIHRoZSBOb3RpZmljYXRpb25zIGZlYXR1cmVcbi8vIHRoYXQgc29tZSBhcHBzIGRlcGVuZHMgb24uIENocm9tZSBkaXNhYmxlcyB0aGUgZmVhdHVyZSBieSByZW1vdmluZyB0aGUgb2JqZWN0LCBicmVha2luZ1xuLy8gdGhlc2UgYXBwcy5cbi8vIFNvIHdlIGRlZmluZSBhIHNrZWxldG9uIHRoYXQgc2F5cyAnZGVuaWVkJywgd2hpY2ggaXMgcmVhbGx5IHdoYXQgQ2hyb21lIHNob3VsZCBiZSBkb2luZy4uLlxuLy8gTWFrZSBzdXJlIHdlJ3JlIHJ1bm5pbmcgaW4gdGhlIG1haW4gYnJvd3NlciB0aHJlYWQuLi5cbmlmICh0eXBlb2Yod2luZG93KSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAod2luZG93IGFzIGFueSlbJ05vdGlmaWNhdGlvbiddID0ge1xuICAgIHBlcm1pc3Npb246ICdkZW5pZWQnLFxuICAgIHJlcXVlc3RQZXJtaXNzaW9uOiBmdW5jdGlvbigpIHsgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgnZGVuaWVkJyk7IH1cbiAgfTtcbn1cbiJdfQ==