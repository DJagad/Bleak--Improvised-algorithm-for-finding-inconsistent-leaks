"no transform";
/**
 * Agent injected into the webpage to surface browser-hidden leaks at the JS level.
 */
(function () {
    // Global variables.
    var IS_WINDOW = typeof (window) !== "undefined";
    var IS_WORKER = typeof (importScripts) !== "undefined";
    var ROOT = (IS_WINDOW ? window : IS_WORKER ? self : global);
    // Avoid installing self twice.
    if (ROOT.$$$INSTRUMENT_PATHS$$$) {
        return;
    }
    ROOT.$$$INSTRUMENT_PATHS$$$ = $$$INSTRUMENT_PATHS$$$;
    ROOT.$$$GET_STACK_TRACES$$$ = $$$GET_STACK_TRACES$$$;
    ROOT.$$$CREATE_SCOPE_OBJECT$$$ = $$$CREATE_SCOPE_OBJECT$$$;
    ROOT.$$$EQ$$$ = $$$EQ$$$;
    ROOT.$$$SEQ$$$ = $$$SEQ$$$;
    ROOT.$$$SHOULDFIX$$$ = $$$SHOULDFIX$$$;
    ROOT.$$$GLOBAL$$$ = ROOT;
    ROOT.$$$REWRITE_EVAL$$$ = $$$REWRITE_EVAL$$$;
    ROOT.$$$FUNCTION_EXPRESSION$$$ = $$$FUNCTION_EXPRESSION$$$;
    ROOT.$$$OBJECT_EXPRESSION$$$ = $$$OBJECT_EXPRESSION$$$;
    ROOT.$$$CREATE_WITH_SCOPE$$$ = $$$CREATE_WITH_SCOPE$$$;
    ROOT.$$$SERIALIZE_DOM$$$ = $$$SERIALIZE_DOM$$$;
    var r = /'/g;
    // Some websites overwrite logToConsole.
    var console = ROOT.console ? ROOT.console : { log: function (str) { } };
    var consoleLog = console.log;
    function logToConsole(s) {
        consoleLog.call(console, s);
    }
    /**
     * Get a stack trace.
     */
    function _getStackTrace() {
        try {
            throw new Error();
        }
        catch (e) {
            return e.stack;
        }
    }
    /**
     * Escapes single quotes in the given string.
     * @param s
     */
    function safeString(s) {
        return s.replace(r, "\\'");
    }
    /**
     * Creates a scope object.
     * @param parentScopeObject The scope object for the enclosing scope.
     * @param movedVariables Scope variables that have been "moved" to this object.
     * @param unmovedVariables Unmoved scope variables that are referenced from this object. Must be specified as getters/setters as this context does not have access to the unmoved variables.
     * @param args The name of the function's arguments.
     * @param argValues The values of the function's arguments.
     */
    function $$$CREATE_SCOPE_OBJECT$$$(parentScopeObject, movedVariables, unmovedVariables, args, argValues) {
        movedVariables.concat(args).forEach(function (varName) {
            unmovedVariables[varName] = {
                value: undefined,
                enumerable: true,
                writable: true,
                configurable: true
            };
        });
        // Initialize arguments.
        args.forEach(function (argName, i) {
            unmovedVariables[argName].value = argValues[i];
        });
        return Object.create(parentScopeObject, unmovedVariables);
    }
    /**
     * Reimplementation of == such that Proxy(A) == A.
     * @param a
     * @param b
     */
    function $$$EQ$$$(a, b) {
        if ($$$SEQ$$$(a, b)) {
            return true;
        }
        else {
            return a == b;
        }
    }
    /**
     * Reimplementation of === such that Proxy(A) === A.
     * @param a
     * @param b
     */
    function $$$SEQ$$$(a, b) {
        if (a === b) {
            return true;
        }
        else if (isProxyable(a) && isProxyable(b)) {
            return (a.hasOwnProperty('$$$PROXY$$$') && a.$$$PROXY$$$ === b) ||
                (b.hasOwnProperty("$$$PROXY$$$") && b.$$$PROXY$$$ === a);
        }
        return false;
    }
    var fixSet = new Set();
    function $$$SHOULDFIX$$$(n, value) {
        if (value !== undefined) {
            if (value) {
                fixSet.add(n);
            }
            else {
                fixSet.delete(n);
            }
        }
        else {
            return fixSet.has(n);
        }
    }
    /**
     * Applies a write to the given scope. Used in `eval()` to avoid storing/transmitting
     * metadata for particular scope objects.
     *
     * Searches the scope chain for the given `key`. If found, it overwrites the value on
     * the relevant scope in the scope chain.
     * @param target
     * @param key
     * @param value
     */
    function applyWrite(target, key, value) {
        if (target === null) {
            return false;
        }
        else if (target.hasOwnProperty(key)) {
            target[key] = value;
            return true;
        }
        else {
            return applyWrite(Object.getPrototypeOf(target), key, value);
        }
    }
    // Sentinel
    var PROP_NOT_FOUND = {};
    /**
     * Goes up the scope chain of the object (which may be a scope or the target
     * of a `with()` statement) to determine if a given key is defined in the object.
     * @param target The scope object or with target.
     * @param key The key we are looking for.
     */
    function withGet(target, key) {
        if (key in target) {
            return target[key];
        }
        else {
            return PROP_NOT_FOUND;
        }
    }
    // Reuseable eval() function. Does not have a polluted scope.
    var EVAL_FCN = new Function('scope', '$$$SRC$$$', 'return eval($$$SRC$$$);');
    // Caches compiled eval statements from server to reduce synchronous XHRs.
    var EVAL_CACHE = new Map();
    var EVAL_CACHE_LIMIT = 100;
    /**
     * Removes the 10 items from EVAL_CACHE that were least recently used.
     */
    function trimEvalCache() {
        var items = [];
        EVAL_CACHE.forEach(function (i) { return items.push(i); });
        items.sort(function (a, b) { return a.ts - b.ts; });
        items.slice(0, 10).forEach(function (i) {
            EVAL_CACHE.delete(i.e);
        });
    }
    /**
     * Sends text passed to `eval` to the server for rewriting,
     * and then evaluates the new string.
     * @param scope The context in which eval was called.
     * @param text The JavaScript code to eval.
     */
    function $$$REWRITE_EVAL$$$(scope, source) {
        var cache = EVAL_CACHE.get(source);
        if (!cache) {
            var xhr = new XMLHttpRequest();
            xhr.open('POST', '/eval', false);
            xhr.setRequestHeader("Content-type", "application/json");
            xhr.send(JSON.stringify({ scope: "scope", source: source }));
            cache = { e: xhr.responseText, ts: 0 };
            EVAL_CACHE.set(source, cache);
            if (EVAL_CACHE.size > EVAL_CACHE_LIMIT) {
                trimEvalCache();
            }
        }
        // Update timestamp
        cache.ts = Date.now();
        return EVAL_FCN(new Proxy(scope, {
            // Appropriately relay writes to first scope with the given variable name.
            // Otherwise, it'll overwrite the property on the outermost scope!
            set: applyWrite
        }), cache.e);
    }
    /**
     * Creates a Scope object for use in a `with()` statement.
     * @param withObj The target of the `with` statement.
     * @param scope The scope of the `with()` statement.
     */
    function $$$CREATE_WITH_SCOPE$$$(withObj, scope) {
        // Add 'withObj' to the scope chain.
        return new Proxy(withObj, {
            get: function (target, key) {
                var v = withGet(target, key);
                if (v === PROP_NOT_FOUND) {
                    var v_1 = withGet(scope, key);
                    if (v_1 === PROP_NOT_FOUND) {
                        throw new ReferenceError(key + " is not defined");
                    }
                    return v_1;
                }
                else {
                    return v;
                }
            },
            set: function (target, key, value) {
                return applyWrite(target, key, value) || applyWrite(scope, key, value);
            }
        });
    }
    /**
     * Assigns the given scope to the given function object.
     */
    function $$$FUNCTION_EXPRESSION$$$(fcn, scope) {
        Object.defineProperty(fcn, '__scope__', {
            get: function () {
                return scope;
            },
            configurable: true
        });
        return fcn;
    }
    /**
     * Assigns the given scope to getter/setter properties.
     * @param obj
     * @param scope
     */
    function $$$OBJECT_EXPRESSION$$$(obj, scope) {
        var props = Object.getOwnPropertyDescriptors(obj);
        for (var _i = 0, props_1 = props; _i < props_1.length; _i++) {
            var prop = props_1[_i];
            if (prop.get) {
                $$$FUNCTION_EXPRESSION$$$(prop.get, scope);
            }
            if (prop.set) {
                $$$FUNCTION_EXPRESSION$$$(prop.set, scope);
            }
        }
        return obj;
    }
    // Used to store child nodes as properties on an object rather than in an array to facilitate
    // leak detection.
    var NODE_PROP_PREFIX = "$$$CHILD$$$";
    /**
     * Converts the node's tree structure into a JavaScript-visible tree structure.
     * TODO: Mutate to include any other Node properties that could be the source of leaks!
     * @param n
     */
    function makeMirrorNode(n) {
        var childNodes = n.childNodes;
        var m = { root: n, childNodes: makeChildNode(childNodes) };
        return m;
    }
    /**
     * Converts the childNodes nodelist into a JS-level object.
     * @param cn
     */
    function makeChildNode(cn) {
        var numChildren = cn.length;
        var rv = { length: numChildren };
        for (var i = 0; i < numChildren; i++) {
            rv["" + NODE_PROP_PREFIX + i] = makeMirrorNode(cn[i]);
        }
        return rv;
    }
    /**
     * Serializes the DOM into a JavaScript-visible tree structure.
     */
    function $$$SERIALIZE_DOM$$$(n) {
        if (n === void 0) { n = document; }
        ROOT.$$$DOM$$$ = makeMirrorNode(document);
    }
    /**
     * Returns whether or not value 'a' could harbor a proxy.
     * @param a
     */
    function isProxyable(a) {
        switch (typeof (a)) {
            case "object":
            case "function":
                return a !== null; // && !(a instanceof Node);
            default:
                return false;
        }
    }
    /**
     * Get the proxy status of the given value.
     * @param a
     */
    function getProxyStatus(a) {
        if (isProxyable(a) && a.hasOwnProperty("$$$PROXY$$$")) {
            if (a.$$$PROXY$$$ === a) {
                return 0 /* IS_PROXY */;
            }
            else {
                return 1 /* HAS_PROXY */;
            }
        }
        return 2 /* NO_PROXY */;
    }
    function getProxyStackTraces(a) {
        return a.$$$STACKTRACES$$$;
    }
    /**
     * If `a` is a proxy, returns the original object.
     * Otherwise, returns `a` itself.
     * @param a
     */
    function unwrapIfProxy(a) {
        switch (getProxyStatus(a)) {
            case 0 /* IS_PROXY */:
                return a.$$$ORIGINAL$$$;
            case 1 /* HAS_PROXY */:
            case 2 /* NO_PROXY */:
                return a;
        }
    }
    /**
     * If `a` has a proxy, returns the proxy. Otherwise, returns `a` itself.
     * @param a
     */
    function wrapIfOriginal(a) {
        switch (getProxyStatus(a)) {
            case 1 /* HAS_PROXY */:
                return a.$$$PROXY$$$;
            case 0 /* IS_PROXY */:
            case 2 /* NO_PROXY */:
                return a;
        }
    }
    /**
     * Adds a stack trace to the given map for the given property.
     * @param map
     * @param property
     */
    function _addStackTrace(map, property, stack) {
        if (stack === void 0) { stack = _getStackTrace(); }
        var set = map.get(property);
        if (!set) {
            set = new Set();
            map.set(property, set);
        }
        set.add(stack);
    }
    /**
     * Removes stack traces for the given map for the given property.
     * @param map
     * @param property
     */
    function _removeStacks(map, property) {
        if (map.has(property)) {
            map.delete(property);
        }
    }
    /**
     * Copy all of the stacks from `from` to `to` within the map.
     * @param map
     * @param from
     * @param to
     */
    function _copyStacks(map, from, to) {
        if (map.has(from)) {
            map.set(to, map.get(from));
        }
    }
    /**
     * Combine the stacks for 'from' with 'to' in 'to'.
     * @param map
     * @param from
     * @param to
     */
    function _combineStacks(map, from, to) {
        if (map.has(from) && map.has(to)) {
            var fromStacks = map.get(from);
            var toStacks_1 = map.get(to);
            fromStacks.forEach(function (s) {
                toStacks_1.add(s);
            });
        }
    }
    /**
     * Initialize a map to contain stack traces for all of the properties of the given object.
     */
    function _initializeMap(obj, map, trace) {
        Object.keys(obj).forEach(function (k) {
            _addStackTrace(map, k, trace);
        });
        return map;
    }
    /**
     * Returns a proxy object for the given object, if applicable. Creates a new object if the object
     * is not already proxied.
     */
    function getProxy(accessStr, obj, stackTrace) {
        if (stackTrace === void 0) { stackTrace = null; }
        if (!isProxyable(obj)) {
            // logToConsole(`[PROXY ERROR]: Cannot create proxy for ${obj} at ${accessStr}.`);
            return obj;
        }
        else if (!obj.hasOwnProperty('$$$PROXY$$$')) {
            var map = new Map();
            if (stackTrace !== null) {
                _initializeMap(obj, map, stackTrace);
            }
            Object.defineProperty(obj, '$$$ORIGINAL$$$', {
                value: obj,
                writable: false,
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(obj, "$$$STACKTRACES$$$", {
                value: map,
                writable: false,
                enumerable: false,
                configurable: false
            });
            //function LOG(s: string) {
            // logToConsole(`${accessStr}: ${s}`);
            //}
            Object.defineProperty(obj, '$$$PROXY$$$', { value: new Proxy(obj, {
                    defineProperty: function (target, property, descriptor) {
                        if (!disableProxies) {
                            // Capture a stack trace.
                            _addStackTrace(getProxyStackTraces(target), property);
                        }
                        // LOG(`defineProperty`);
                        return Reflect.defineProperty(target, property, descriptor);
                    },
                    set: function (target, property, value, receiver) {
                        if (!disableProxies) {
                            // Capture a stack trace.
                            _addStackTrace(getProxyStackTraces(target), property);
                        }
                        // LOG(`set`);
                        return Reflect.set(target, property, value, target);
                    },
                    deleteProperty: function (target, property) {
                        if (!disableProxies) {
                            // Remove stack traces that set this property.
                            _removeStacks(getProxyStackTraces(target), property);
                        }
                        // LOG(`deleteProperty`);
                        return Reflect.deleteProperty(target, property);
                    }
                }), enumerable: false, configurable: true, writable: true });
        }
        return obj.$$$PROXY$$$;
    }
    function updateAssignmentProxy(stackTrace) {
        var root = this.$$root;
        var trees = this.$$trees;
        var rootAccessString = this.$$rootAccessString;
        for (var _i = 0, trees_1 = trees; _i < trees_1.length; _i++) {
            var tree = trees_1[_i];
            instrumentTree(rootAccessString, root, tree, stackTrace);
        }
    }
    function hiddenPropertyName(n) {
        return "_____$" + n;
    }
    function setHiddenValue(thisObj, n, value) {
        var propName = hiddenPropertyName(n);
        if (!thisObj.hasOwnProperty(propName)) {
            Object.defineProperty(thisObj, propName, {
                value: null,
                writable: true
            });
        }
        thisObj[propName] = value;
    }
    function getHiddenValue(thisObj, n) {
        return thisObj[hiddenPropertyName(n)];
    }
    function instrumentPath(rootAccessString, accessString, root, tree, stackTrace) {
        if (stackTrace === void 0) { stackTrace = null; }
        var setProxy;
        //logToConsole(`Instrumenting ${accessString} at ${rootAccessString}`);
        var prop = Object.getOwnPropertyDescriptor(root, tree.indexOrName);
        if (prop && prop.set && Array.isArray(prop.set['$$trees'])) {
            //logToConsole(`It's already instrumented!`);
            setProxy = prop.set;
        }
        else {
            //logToConsole(`New instrumentation.`);
            // let hiddenValue = root[tree.indexOrName];
            var isGrowing_1 = tree.isGrowing;
            var indexOrName_1 = tree.indexOrName;
            setHiddenValue(root, indexOrName_1, root[indexOrName_1]);
            if (isGrowing_1) {
                //logToConsole(`Converting the hidden value into a proxy.`)
                var proxy = getProxy(accessString, getHiddenValue(root, indexOrName_1));
                setHiddenValue(root, indexOrName_1, proxy);
                if (stackTrace !== null && getProxyStatus(proxy) === 0 /* IS_PROXY */) {
                    var map = getProxyStackTraces(proxy);
                    _initializeMap(proxy, map, stackTrace);
                }
            }
            setProxy = function (v) {
                var trace = _getStackTrace();
                setHiddenValue(this, indexOrName_1, isGrowing_1 ? getProxy(accessString, v, trace) : v);
                setProxy.$$update(trace);
                // logToConsole(`${rootAccessString}: Assignment`);
                return true;
            };
            setProxy.$$rootAccessString = rootAccessString;
            setProxy.$$trees = [];
            setProxy.$$update = updateAssignmentProxy;
            setProxy.$$root = root;
            try {
                Object.defineProperty(root, indexOrName_1, {
                    get: function () {
                        return getHiddenValue(this, indexOrName_1);
                    },
                    set: setProxy,
                    configurable: true
                });
            }
            catch (e) {
                logToConsole("Unable to instrument " + rootAccessString + ": " + e);
            }
        }
        if (setProxy.$$trees.indexOf(tree) === -1) {
            setProxy.$$trees.push(tree);
            // Only update inner proxies if:
            // - the tree is new (tree already exists === this path is already updated)
            //   - Prevents infinite loops due to cycles!
            // - there is a stack trace (no stack trace === initial installation)
            //   - Otherwise we are already updating this proxy!
            if (stackTrace) {
                setProxy.$$update(stackTrace);
            }
        }
    }
    // Need:
    // - DOM set proxies
    //   -> Invalidate / refresh when changed
    // - Fast checker of node.
    // Operations can impact:
    // - Current node
    // - Parent node
    // - Child nodes
    // Update target node & all children.
    //
    function instrumentDOMTree(rootAccessString, root, tree, stackTrace) {
        if (stackTrace === void 0) { stackTrace = null; }
        // For now: Simply crawl to the node(s) and instrument regularly from there. Don't try to plant getters/setters.
        // $$DOM - - - - - -> root [regular subtree]
        var obj;
        var accessString = rootAccessString;
        var switchToRegularTree = false;
        switch (tree.indexOrName) {
            case "$$$DOM$$$":
                obj = document;
                accessString = "document";
                break;
            case 'root':
                switchToRegularTree = true;
                obj = root;
                break;
            case 'childNodes':
                obj = root['childNodes'];
                accessString += "['childNodes']";
                break;
            default:
                var modIndex = tree.indexOrName.slice(NODE_PROP_PREFIX.length);
                obj = root[modIndex];
                accessString += "[" + modIndex + "]";
                break;
        }
        if (!obj) {
            return;
        }
        if (obj && !obj.$$$TREE$$$) {
            Object.defineProperties(obj, {
                $$$TREE$$$: {
                    value: null,
                    writable: true,
                    configurable: true
                },
                $$$ACCESS_STRING$$$: {
                    value: null,
                    writable: true,
                    configurable: true
                }
            });
        }
        obj.$$$TREE$$$ = tree;
        obj.$$$ACCESS_STRING$$$ = accessString;
        if (tree.isGrowing) {
            getProxy(accessString, obj, stackTrace);
        }
        // Capture writes of children.
        var children = tree.children;
        if (children) {
            var instrumentFunction = switchToRegularTree ? instrumentTree : instrumentDOMTree;
            var len = children.length;
            for (var i = 0; i < len; i++) {
                var child = children[i];
                instrumentFunction(accessString, obj, child, stackTrace);
            }
        }
    }
    function instrumentTree(rootAccessString, root, tree, stackTrace) {
        if (stackTrace === void 0) { stackTrace = null; }
        var accessString = rootAccessString + ("[" + safeString("" + tree.indexOrName) + "]");
        //logToConsole(`access string: ${accessString}`);
        // Ignore roots that are not proxyable.
        if (!isProxyable(root)) {
            //logToConsole(`Not a proxyable root.`);
            return;
        }
        var obj = root[tree.indexOrName];
        instrumentPath(rootAccessString, accessString, root, tree, stackTrace);
        // Capture writes of children.
        var children = tree.children;
        if (children) {
            var len = children.length;
            for (var i = 0; i < len; i++) {
                var child = children[i];
                instrumentTree(accessString, obj, child, stackTrace);
            }
        }
    }
    // Disables proxy interception.
    var disableProxies = false;
    function isDOMRoot(tree) {
        return tree.indexOrName === "$$$DOM$$$";
    }
    var instrumentedTrees = [];
    function $$$INSTRUMENT_PATHS$$$(trees) {
        for (var _i = 0, trees_2 = trees; _i < trees_2.length; _i++) {
            var tree = trees_2[_i];
            if (isDOMRoot(tree)) {
                instrumentDOMTree("$$$GLOBAL$$$", ROOT.$$$GLOBAL$$$, tree);
            }
            else {
                instrumentTree("$$$GLOBAL$$$", ROOT.$$$GLOBAL$$$, tree);
            }
        }
        instrumentedTrees = instrumentedTrees.concat(trees);
    }
    function getStackTraces(root, path, stacksMap) {
        var obj = root[path.indexOrName];
        if (isProxyable(obj)) {
            if (path.isGrowing && getProxyStatus(obj) === 0 /* IS_PROXY */) {
                var map = getProxyStackTraces(obj);
                var stackTraces_1 = stacksMap[path.id] ? stacksMap[path.id] : new Set();
                map.forEach(function (v, k) {
                    v.forEach(function (s) { return stackTraces_1.add(s); });
                });
                stacksMap[path.id] = stackTraces_1;
            }
            var children = path.children;
            if (children) {
                for (var _i = 0, children_1 = children; _i < children_1.length; _i++) {
                    var child = children_1[_i];
                    getStackTraces(obj, child, stacksMap);
                }
            }
        }
    }
    function getDOMStackTraces(root, path, stacksMap) {
        var obj;
        var switchToRegularTree = false;
        switch (path.indexOrName) {
            case "$$$DOM$$$":
                obj = document;
                break;
            case 'root':
                switchToRegularTree = true;
                obj = root;
                break;
            case 'childNodes':
                obj = root[path.indexOrName];
                break;
            default:
                obj = root[path.indexOrName.slice(NODE_PROP_PREFIX.length)];
                break;
        }
        if (isProxyable(obj) && path.isGrowing) {
            var wrappedObj = wrapIfOriginal(obj);
            if (getProxyStatus(wrappedObj) === 0 /* IS_PROXY */) {
                var map = getProxyStackTraces(wrappedObj);
                var stackTraces_2 = stacksMap[path.id] ? stacksMap[path.id] : new Set();
                map.forEach(function (v, k) {
                    v.forEach(function (s) { return stackTraces_2.add(s); });
                });
                stacksMap[path.id] = stackTraces_2;
            }
        }
        // Capture writes of children.
        var children = path.children;
        var getStackTracesFunction = switchToRegularTree ? getStackTraces : getDOMStackTraces;
        if (children) {
            var len = children.length;
            for (var i = 0; i < len; i++) {
                var child = children[i];
                getStackTracesFunction(obj, child, stacksMap);
            }
        }
    }
    function $$$GET_STACK_TRACES$$$() {
        var stacksMap = {};
        for (var _i = 0, instrumentedTrees_1 = instrumentedTrees; _i < instrumentedTrees_1.length; _i++) {
            var tree = instrumentedTrees_1[_i];
            if (isDOMRoot(tree)) {
                getDOMStackTraces(ROOT.$$$GLOBAL$$$, tree, stacksMap);
            }
            else {
                getStackTraces(ROOT.$$$GLOBAL$$$, tree, stacksMap);
            }
        }
        var jsonableStacksMap = {};
        var _loop_1 = function (stringId) {
            if (stacksMap.hasOwnProperty(stringId)) {
                var id = parseInt(stringId, 10);
                var stacks = stacksMap[id];
                var i_1 = 0;
                var stackArray_1 = new Array(stacks.size);
                stacks.forEach(function (s) {
                    stackArray_1[i_1++] = s;
                });
                jsonableStacksMap[id] = stackArray_1;
            }
        };
        for (var stringId in stacksMap) {
            _loop_1(stringId);
        }
        return jsonableStacksMap;
    }
    if (IS_WINDOW || IS_WORKER) {
        // Disable these in NodeJS.
        /*const documentWrite = Document.prototype.write;
        Document.prototype.write = function(this: Document, str: string): void {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', '/evalHtml', false);
          xhr.send(str);
          return documentWrite.call(this, xhr.responseText);
        };
        Document.prototype.writeln = function(this: Document, str: string): void {
          return this.write(str);
        };*/
        var addEventListener_1 = EventTarget.prototype.addEventListener;
        var removeEventListener_1 = EventTarget.prototype.removeEventListener;
        EventTarget.prototype.addEventListener = function (type, listener, useCapture) {
            if (useCapture === void 0) { useCapture = false; }
            addEventListener_1.apply(unwrapIfProxy(this), arguments);
            if (!this.$$listeners) {
                this.$$listeners = {};
            }
            var listeners = this.$$listeners[type];
            if (!listeners) {
                listeners = this.$$listeners[type] = [];
            }
            for (var _i = 0, listeners_1 = listeners; _i < listeners_1.length; _i++) {
                var listenerInfo = listeners_1[_i];
                if (listenerInfo.listener === listener && (typeof (listenerInfo.useCapture) === 'boolean' ? listenerInfo.useCapture === useCapture : true)) {
                    return;
                }
            }
            listeners.push({
                listener: listener,
                useCapture: useCapture
            });
        };
        EventTarget.prototype.removeEventListener = function (type, listener, useCapture) {
            if (useCapture === void 0) { useCapture = false; }
            removeEventListener_1.apply(unwrapIfProxy(this), arguments);
            if (this.$$listeners) {
                var listeners = this.$$listeners[type];
                if (listeners) {
                    for (var i = 0; i < listeners.length; i++) {
                        var lInfo = listeners[i];
                        if (lInfo.listener === listener && (typeof (lInfo.useCapture) === 'boolean' ? lInfo.useCapture === useCapture : true)) {
                            listeners.splice(i, 1);
                            if (listeners.length === 0) {
                                delete this.$$listeners[type];
                            }
                            return;
                        }
                    }
                }
            }
        };
        // Array modeling
        Array.prototype.push = (function (push) {
            return function () {
                var items = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    items[_i] = arguments[_i];
                }
                try {
                    disableProxies = true;
                    if (getProxyStatus(this) === 0 /* IS_PROXY */) {
                        var map = getProxyStackTraces(this);
                        var trace = _getStackTrace();
                        for (var i = 0; i < items.length; i++) {
                            _addStackTrace(map, "" + (this.length + i), trace);
                        }
                    }
                    return push.apply(this, items);
                }
                finally {
                    disableProxies = false;
                }
            };
        })(Array.prototype.push);
        Array.prototype.unshift = (function (unshift) {
            return function () {
                var items = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    items[_i] = arguments[_i];
                }
                try {
                    disableProxies = true;
                    if (getProxyStatus(this) === 0 /* IS_PROXY */) {
                        var map = getProxyStackTraces(this);
                        var newItemLen = items.length;
                        var trace = _getStackTrace();
                        for (var i = items.length - 1; i >= 0; i--) {
                            _copyStacks(map, "" + i, "" + (i + newItemLen));
                        }
                        for (var i = 0; i < items.length; i++) {
                            _removeStacks(map, "" + i);
                            _addStackTrace(map, "" + i, trace);
                        }
                    }
                    return unshift.apply(this, items);
                }
                finally {
                    disableProxies = false;
                }
            };
        })(Array.prototype.unshift);
        Array.prototype.pop = (function (pop) {
            return function () {
                try {
                    disableProxies = true;
                    if (getProxyStatus(this) === 0 /* IS_PROXY */) {
                        var map = getProxyStackTraces(this);
                        _removeStacks(map, "" + (this.length - 1));
                    }
                    return pop.apply(this);
                }
                finally {
                    disableProxies = false;
                }
            };
        })(Array.prototype.pop);
        Array.prototype.shift = (function (shift) {
            return function () {
                try {
                    disableProxies = true;
                    if (getProxyStatus(this) === 0 /* IS_PROXY */) {
                        var map = getProxyStackTraces(this);
                        _removeStacks(map, "0");
                        for (var i = 1; i < this.length; i++) {
                            _copyStacks(map, "" + i, "" + (i - 1));
                        }
                        _removeStacks(map, "" + (this.length - 1));
                    }
                    return shift.apply(this);
                }
                finally {
                    disableProxies = false;
                }
            };
        })(Array.prototype.shift);
        Array.prototype.splice = (function (splice) {
            return function (start, deleteCount) {
                var items = [];
                for (var _i = 2; _i < arguments.length; _i++) {
                    items[_i - 2] = arguments[_i];
                }
                try {
                    disableProxies = true;
                    if (getProxyStatus(this) === 0 /* IS_PROXY */) {
                        var map = getProxyStackTraces(this);
                        var actualStart = start | 0;
                        if (actualStart === undefined) {
                            return [];
                        }
                        // If greater than the length of the array, actual starting index will be set to the length of the array.
                        if (actualStart > this.length) {
                            actualStart = this.length;
                        }
                        // If negative, will begin that many elements from the end of the array (with origin 1)
                        // and will be set to 0 if absolute value is greater than the length of the array.
                        if (actualStart < 0) {
                            actualStart = this.length + actualStart;
                            if (actualStart < 0) {
                                actualStart = 0;
                            }
                        }
                        var actualDeleteCount = deleteCount | 0;
                        // If deleteCount is omitted, or if its value is larger than array.length - start,
                        //   then all of the elements beginning with start index on through the end of the array will be deleted.
                        if (deleteCount === undefined || actualDeleteCount > this.length - actualStart) {
                            actualDeleteCount = this.length - actualStart;
                        }
                        if (actualDeleteCount < 0) {
                            actualDeleteCount = 0;
                        }
                        for (var i = 0; i < actualDeleteCount; i++) {
                            var index = actualStart + i;
                            _removeStacks(map, "" + index);
                        }
                        // Move existing traces into new locations.
                        var newItemCount = items.length;
                        if (newItemCount > actualDeleteCount) {
                            // Shift *upward*
                            var delta = newItemCount - actualDeleteCount;
                            for (var i = this.length - 1; i >= actualStart + actualDeleteCount; i--) {
                                _copyStacks(map, "" + i, "" + (i + delta));
                            }
                        }
                        else if (newItemCount < actualDeleteCount) {
                            // Shift *downward*
                            var delta = newItemCount - actualDeleteCount;
                            for (var i = actualStart + actualDeleteCount; i < this.length; i++) {
                                _copyStacks(map, "" + i, "" + (i + delta));
                            }
                            // Delete extra traces for removed indexes.
                            for (var i = this.length + delta; i < this.length; i++) {
                                _removeStacks(map, "" + i);
                            }
                        }
                        var trace = _getStackTrace();
                        // Add new traces for new items.
                        for (var i = 0; i < newItemCount; i++) {
                            _removeStacks(map, "" + (actualStart + i));
                            _addStackTrace(map, "" + (actualStart + i), trace);
                        }
                    }
                    return splice.apply(this, arguments);
                }
                finally {
                    disableProxies = false;
                }
            };
        })(Array.prototype.splice);
        // Make indexOf use $$$SEQ$$$
        Array.prototype.indexOf = function (searchElement, fromIndexArg) {
            var fromIndex = fromIndexArg || 0;
            // If the provided index value is a negative number, it is taken as the offset from the end of the array.
            // The array is still searched from front to back.
            if (fromIndex < 0) {
                fromIndex = this.length + fromIndex;
            }
            // If the calculated index is less than 0, then the whole array will be searched.
            if (fromIndex < 0) {
                fromIndex = 0;
            }
            // If the index is greater than or equal to the array's length, -1 is returned, which means the array will not be searched.
            if (fromIndex >= this.length) {
                return -1;
            }
            for (; fromIndex < this.length; fromIndex++) {
                if ($$$SEQ$$$(this[fromIndex], searchElement)) {
                    return fromIndex;
                }
            }
            return -1;
        };
        Array.prototype.lastIndexOf = function (searchElement, fromIndex) {
            if (fromIndex === void 0) { fromIndex = 0; }
            if (this === void 0 || this === null) {
                throw new TypeError();
            }
            var t = Object(this), len = t.length >>> 0;
            if (len === 0) {
                return -1;
            }
            var n = len - 1;
            if (arguments.length > 1) {
                n = Number(arguments[1]);
                if (n != n) {
                    n = 0;
                }
                else if (n != 0 && n != (1 / 0) && n != -(1 / 0)) {
                    n = (n > 0 ? 1 : -1) * Math.floor(Math.abs(n));
                }
            }
            for (var k = n >= 0 ? Math.min(n, len - 1) : len - Math.abs(n); k >= 0; k--) {
                if (k in t && $$$SEQ$$$(t[k], searchElement)) {
                    return k;
                }
            }
            return -1;
        };
        // TODO: Sort, reverse, ...
        // Deterministic Math.random(), so jQuery variable is deterministic.
        // From https://gist.github.com/mathiasbynens/5670917
        Math.random = (function () {
            var seed = 0x2F6E2B1;
            return function () {
                // Robert Jenkins’ 32 bit integer hash function
                seed = ((seed + 0x7ED55D16) + (seed << 12)) & 0xFFFFFFFF;
                seed = ((seed ^ 0xC761C23C) ^ (seed >>> 19)) & 0xFFFFFFFF;
                seed = ((seed + 0x165667B1) + (seed << 5)) & 0xFFFFFFFF;
                seed = ((seed + 0xD3A2646C) ^ (seed << 9)) & 0xFFFFFFFF;
                seed = ((seed + 0xFD7046C5) + (seed << 3)) & 0xFFFFFFFF;
                seed = ((seed ^ 0xB55A4F09) ^ (seed >>> 16)) & 0xFFFFFFFF;
                return (seed & 0xFFFFFFF) / 0x10000000;
            };
        }());
        // Deterministic Date.now(), so YUI variable is deterministic.
        var dateNowCount_1 = 0;
        Date.now = Date.prototype.getTime = function () {
            return 1516992512425 + (dateNowCount_1++);
        };
        // interface Count {get: number; set: number; invoked: number }
        /**
         * [DEBUG] Installs a counter on a particular object property.
         * @param obj
         * @param property
         * @param key
         * @param countMap
         */
        /*function countPropertyAccesses(obj: any, property: string, key: string, countMap: Map<string, Count>): void {
          let count: Count = { get: 0, set: 0, invoked: 0};
          const original = Object.getOwnPropertyDescriptor(obj, property);
          try {
            Object.defineProperty(obj, property, {
              get: function() {
                count.get++;
                const value = original.get ? original.get.apply(this) : original.value;
                if (typeof(value) === "function") {
                  return function(this: any) {
                    count.invoked++;
                    return value.apply(this, arguments);
                  };
                } else {
                  return value;
                }
              },
              set: function(v) {
                count.set++;
                if (original.set) {
                  return original.set.call(this, v);
                } else if (original.writable) {
                  original.value = v;
                }
                // Otherwise: NOP.
              },
              configurable: true
            });
            countMap.set(key, count);
          } catch (e) {
            logToConsole(`Unable to instrument ${key}`);
          }
        }*/
        /**
         * Interposes on a particular API to return proxy objects for objects with proxies and unwrap arguments that are proxies.
         */
        function proxyInterposition(obj, property, key) {
            var original = Object.getOwnPropertyDescriptor(obj, property);
            if (!original.configurable) {
                return;
            }
            try {
                Object.defineProperty(obj, property, {
                    get: function () {
                        var value = original.get ? original.get.apply(unwrapIfProxy(this)) : original.value;
                        if (typeof (value) === "function") {
                            return function () {
                                var args = [];
                                for (var _i = 0; _i < arguments.length; _i++) {
                                    args[_i] = arguments[_i];
                                }
                                return wrapIfOriginal(unwrapIfProxy(value).apply(unwrapIfProxy(this), args.map(unwrapIfProxy)));
                            };
                        }
                        else {
                            return wrapIfOriginal(value);
                        }
                    },
                    set: function (v) {
                        var originalV = unwrapIfProxy(v);
                        if (original.set) {
                            original.set.call(unwrapIfProxy(this), originalV);
                        }
                        else if (original.writable) {
                            original.value = originalV;
                        }
                        // Otherwise: NOP.
                    },
                    // Make interposition nestable
                    configurable: true
                });
            }
            catch (e) {
                logToConsole("Unable to instrument " + key);
            }
        }
        /**
         * Interposition "on[eventname]" properties and store value as an expando
         * property on DOM element so it shows up in the heap snapshot.
         * @param obj
         * @param propName
         */
        function interpositionEventListenerProperty(obj, propName) {
            var desc = Object.getOwnPropertyDescriptor(obj, propName);
            if (desc) {
                delete desc['value'];
                delete desc['writable'];
                var set_1 = desc.set;
                desc.set = function (val) {
                    set_1.call(this, val);
                    this["$$" + propName] = val;
                };
                Object.defineProperty(obj, propName, desc);
            }
        }
        if (IS_WINDOW) {
            [Document.prototype, Element.prototype, MediaQueryList.prototype, FileReader.prototype,
                HTMLBodyElement.prototype, HTMLElement.prototype, HTMLFrameSetElement.prototype,
                ApplicationCache.prototype,
                SVGElement.prototype, XMLHttpRequest.prototype,
                WebSocket.prototype, IDBDatabase.prototype, IDBOpenDBRequest.prototype,
                IDBRequest.prototype, IDBTransaction.prototype, window].forEach(function (obj) {
                Object.keys(obj).filter(function (p) { return p.startsWith("on"); }).forEach(function (p) {
                    interpositionEventListenerProperty(obj, p);
                });
            });
            //const countMap = new Map<string, Count>();
            [[Node.prototype, "Node"], [Element.prototype, "Element"], [HTMLElement.prototype, "HTMLElement"],
                [Document.prototype, "Document"], [HTMLCanvasElement.prototype, "HTMLCanvasElement"],
                [NodeList.prototype, "NodeList"]]
                .forEach(function (v) { return Object.keys(v[0]).forEach(function (k) { return proxyInterposition(v[0], k, v[1] + "." + k); }); });
            // TODO: Remove instrumentation when element moved?
            var $$$REINSTRUMENT$$$ = function () {
                if (this.$$$TREE$$$) {
                    instrumentDOMTree(this.$$$ACCESS_STRING$$$, this, this.$$$TREE$$$, _getStackTrace());
                }
            };
            Object.defineProperty(Node.prototype, '$$$REINSTRUMENT$$$', {
                value: $$$REINSTRUMENT$$$,
                configurable: true
            });
            Object.defineProperty(NodeList.prototype, '$$$REINSTRUMENT$$$', {
                value: $$$REINSTRUMENT$$$,
                configurable: true
            });
            var textContent_1 = Object.getOwnPropertyDescriptor(Node.prototype, 'textContent');
            // textContent: Pass in a string. Replaces all children w/ a single text node.
            Object.defineProperty(Node.prototype, 'textContent', {
                get: textContent_1.get,
                set: function (v) {
                    var rv = textContent_1.set.call(this, v);
                    var cn = this.childNodes;
                    if (getProxyStatus(cn) === 0 /* IS_PROXY */) {
                        var traces = getProxyStackTraces(cn);
                        traces.clear();
                        _initializeMap(cn, traces, _getStackTrace());
                    }
                    this.childNodes.$$$REINSTRUMENT$$$();
                    return rv;
                },
                enumerable: true,
                configurable: true
            });
            var appendChild_1 = Node.prototype.appendChild;
            Node.prototype.appendChild = function (newChild) {
                /**
                 * The Node.appendChild() method adds a node to the end of the list of children of a specified parent node.
                 * If the given child is a reference to an existing node in the document,
                 * appendChild() moves it from its current position to the new position.
                 */
                if (newChild.parentNode !== null) {
                    newChild.parentNode.removeChild(newChild);
                }
                var cn = this.childNodes;
                if (getProxyStatus(cn) === 0 /* IS_PROXY */) {
                    var traces = getProxyStackTraces(cn);
                    _addStackTrace(traces, "" + cn.length);
                }
                var rv = appendChild_1.call(this, newChild);
                cn.$$$REINSTRUMENT$$$();
                return rv;
            };
            var insertBefore_1 = Node.prototype.insertBefore;
            // insertBefore: Takes Nodes. Modifies DOM.
            Node.prototype.insertBefore = function (newChild, refChild) {
                /**
                 * The Node.insertBefore() method inserts the specified node before the reference
                 * node as a child of the current node.
                 *
                 * If referenceNode is null, the newNode is inserted at the end of the list of child nodes.
                 *
                 * Note that referenceNode is not an optional parameter -- you must explicitly pass a Node
                 * or null. Failing to provide it or passing invalid values may behave differently in
                 * different browser versions.
                 */
                var cn = this.childNodes;
                if (getProxyStatus(cn) === 0 /* IS_PROXY */) {
                    if (refChild === null) {
                        // Avoid tracking stack traces for special case.
                        return this.appendChild(newChild);
                    }
                    else {
                        var stacks = getProxyStackTraces(cn);
                        var len = cn.length;
                        var position = -1;
                        for (var i = 0; i < len; i++) {
                            if ($$$SEQ$$$(cn[i], refChild)) {
                                position = i;
                                break;
                            }
                        }
                        if (position === -1) {
                            logToConsole("insertBefore called with invalid node!");
                        }
                        else {
                            for (var i = len - 1; i >= position; i--) {
                                _copyStacks(stacks, "" + i, "" + (i + 1));
                            }
                            _removeStacks(stacks, "" + position);
                            _addStackTrace(stacks, "" + position);
                        }
                    }
                }
                var rv = insertBefore_1.call(this, newChild, refChild);
                cn.$$$REINSTRUMENT$$$();
                return rv;
            };
            var normalize_1 = Node.prototype.normalize;
            function normalizeInternal(n) {
                var children = n.childNodes;
                var len = children.length;
                var stacks = getProxyStackTraces(n.childNodes);
                var prevTextNode = null;
                var prevTextNodeI = -1;
                var toRemove = [];
                for (var i = 0; i < len; i++) {
                    var child = children[i];
                    if (child.nodeType === Node.TEXT_NODE) {
                        if (child.textContent === "") {
                            // Remove empty text nodes.
                            toRemove.push(i);
                        }
                        else if (prevTextNode) {
                            // Merge adjacent text nodes.
                            prevTextNode.textContent += child.textContent;
                            if (stacks) {
                                _combineStacks(stacks, "" + prevTextNodeI, "" + i);
                            }
                            toRemove.push(i);
                        }
                        else {
                            prevTextNode = child;
                            prevTextNodeI = i;
                        }
                    }
                    else {
                        prevTextNode = null;
                        prevTextNodeI = -1;
                    }
                }
                var removeLen = toRemove.length;
                for (var i = removeLen - 1; i >= 0; i--) {
                    n.removeChild(children[toRemove[i]]);
                }
                var len2 = children.length;
                for (var i = 0; i < len2; i++) {
                    normalizeInternal(children[i]);
                }
            }
            Node.prototype.normalize = function () {
                /**
                 * The Node.normalize() method puts the specified node and all of its sub-tree into a
                 * "normalized" form. In a normalized sub-tree, no text nodes in the sub-tree are empty
                 * and there are no adjacent text nodes.
                 */
                if (this.$$$TREE$$$) {
                    normalizeInternal(this);
                    this.$$$REINSTRUMENT$$$();
                }
                else {
                    return normalize_1.call(this);
                }
            };
            var removeChild_1 = Node.prototype.removeChild;
            Node.prototype.removeChild = function (child) {
                var cn = this.childNodes;
                if (getProxyStatus(cn) === 0 /* IS_PROXY */) {
                    var stacks = getProxyStackTraces(cn);
                    var children = this.childNodes;
                    var len = children.length;
                    var i = 0;
                    for (; i < len; i++) {
                        if ($$$SEQ$$$(children[i], child)) {
                            break;
                        }
                    }
                    if (i === len) {
                        logToConsole("Invalid call to removeChild.");
                    }
                    else {
                        for (var j = i + 1; j < len; j++) {
                            _copyStacks(stacks, "" + j, "" + (j - 1));
                        }
                        _removeStacks(stacks, "" + (len - 1));
                    }
                }
                var rv = removeChild_1.call(this, child);
                cn.$$$REINSTRUMENT$$$();
                return rv;
            };
            // replaceChild: Replaces a child.
            var replaceChild_1 = Node.prototype.replaceChild;
            Node.prototype.replaceChild = function (newChild, oldChild) {
                var cn = this.childNodes;
                if (getProxyStatus(cn) === 0 /* IS_PROXY */) {
                    var stacks = getProxyStackTraces(cn);
                    var i = 0;
                    var len = cn.length;
                    for (; i < len; i++) {
                        if ($$$SEQ$$$(cn[i], oldChild)) {
                            break;
                        }
                    }
                    if (i === len) {
                        logToConsole("replaceChild called with invalid child");
                    }
                    else {
                        _addStackTrace(stacks, "" + i);
                    }
                }
                var rv = replaceChild_1.call(this, newChild, oldChild);
                cn.$$$REINSTRUMENT$$$();
                return rv;
            };
            var innerHTML_1 = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
            Object.defineProperty(Element.prototype, 'innerHTML', {
                get: innerHTML_1.get,
                set: function (t) {
                    var rv = innerHTML_1.set.call(this, t);
                    var cn = this.childNodes;
                    if (getProxyStatus(cn) === 0 /* IS_PROXY */) {
                        var stacks = getProxyStackTraces(cn);
                        stacks.clear();
                        _initializeMap(cn, stacks, _getStackTrace());
                    }
                    cn.$$$REINSTRUMENT$$$();
                    return rv;
                },
                configurable: true,
                enumerable: true
            });
            var outerHTML_1 = Object.getOwnPropertyDescriptor(Element.prototype, 'outerHTML');
            Object.defineProperty(Element.prototype, 'outerHTML', {
                get: outerHTML_1.get,
                set: function (v) {
                    var parent = this.parentNode;
                    if (parent) {
                        var parentCn = parent.childNodes;
                        if (getProxyStatus(parentCn) === 0 /* IS_PROXY */) {
                            var len = parentCn.length;
                            var i = 0;
                            for (; i < len; i++) {
                                if (parentCn[i] === this) {
                                    break;
                                }
                            }
                            if (i === len) {
                                logToConsole("Invalid call to outerHTML: Detached node?");
                            }
                            else {
                                var stacks = getProxyStackTraces(parentCn);
                                _removeStacks(stacks, "" + i);
                                _addStackTrace(stacks, "" + i);
                            }
                        }
                    }
                    var rv = outerHTML_1.set.call(this, v);
                    if (parent) {
                        parent.childNodes.$$$REINSTRUMENT$$$();
                    }
                    return rv;
                },
                configurable: true,
                enumerable: true
            });
            function insertAdjacentHelper(e, position) {
                switch (position) {
                    case 'beforebegin':
                    case 'afterend': {
                        if (e.parentNode && getProxyStatus(e.parentNode.childNodes) === 0 /* IS_PROXY */) {
                            var parent_1 = e.parentNode;
                            var siblings = parent_1.childNodes;
                            var numSiblings = siblings.length;
                            var i = 0;
                            for (; i < numSiblings; i++) {
                                if ($$$SEQ$$$(siblings[i], e)) {
                                    break;
                                }
                            }
                            if (i !== numSiblings) {
                                // Does it shift things down before or after this element?
                                var start = position === 'beforebegin' ? i : i + 1;
                                var stacks = getProxyStackTraces(siblings);
                                for (i = numSiblings - 1; i >= start; i--) {
                                    _copyStacks(stacks, "" + i, "" + (i + 1));
                                }
                                _removeStacks(stacks, "" + start);
                                _addStackTrace(stacks, "" + start);
                            }
                        }
                        break;
                    }
                    case 'afterbegin':
                    case 'beforeend': {
                        var cn = e.childNodes;
                        if (getProxyStatus(cn) === 0 /* IS_PROXY */) {
                            var numChildren = cn.length;
                            var stacks = getProxyStackTraces(cn);
                            if (position === 'afterbegin') {
                                for (var i = numChildren - 1; i >= 0; i--) {
                                    _copyStacks(stacks, "" + i, "" + (i + 1));
                                }
                                _removeStacks(stacks, "0");
                                _addStackTrace(stacks, "0");
                            }
                            else {
                                _addStackTrace(stacks, "" + numChildren);
                            }
                        }
                        break;
                    }
                }
            }
            var insertAdjacentElement_1 = Element.prototype.insertAdjacentElement;
            Element.prototype.insertAdjacentElement = function (position, insertedElement) {
                /**
                 * The insertAdjacentElement() method inserts a given element node at a given
                 * position relative to the element it is invoked upon.
                 */
                insertAdjacentHelper(this, position);
                var rv = insertAdjacentElement_1.call(this, position, insertedElement);
                if (position === 'afterbegin' || position === 'beforeend') {
                    this.childNodes.$$$REINSTRUMENT$$$();
                }
                else if (this.parentNode) {
                    this.parentNode.childNodes.$$$REINSTRUMENT$$$();
                }
                return rv;
            };
            var insertAdjacentHTML_1 = Element.prototype.insertAdjacentHTML;
            Element.prototype.insertAdjacentHTML = function (where, html) {
                insertAdjacentHelper(this, where);
                var rv = insertAdjacentHTML_1.call(this, where, html);
                if (where === 'afterbegin' || where === 'beforeend') {
                    this.childNodes.$$$REINSTRUMENT$$$();
                }
                else if (this.parentNode) {
                    this.parentNode.childNodes.$$$REINSTRUMENT$$$();
                }
                return rv;
            };
            var insertAdjacentText_1 = Element.prototype.insertAdjacentText;
            Element.prototype.insertAdjacentText = function (where, text) {
                insertAdjacentHelper(this, where);
                var rv = insertAdjacentText_1.call(this, where, text);
                if (where === 'afterbegin' || where === 'beforeend') {
                    this.childNodes.$$$REINSTRUMENT$$$();
                }
                else if (this.parentNode) {
                    this.parentNode.childNodes.$$$REINSTRUMENT$$$();
                }
                return rv;
            };
            var remove_1 = Element.prototype.remove;
            Element.prototype.remove = function () {
                var parent = this.parentNode;
                if (parent) {
                    parent.removeChild(this);
                }
                else {
                    remove_1.call(this);
                }
            };
            // Element:
            // **SPECIAL**: dataset - modifies properties on DOM object through object!!!!
            // -> throw exception if used.
            // SVGElement:
            // dataset: Throw exception if used
        }
        /*(<any> root)['$$PRINTCOUNTS$$'] = function(): void {
          logToConsole(`API,GetCount,InvokedCount,SetCount`);
          countMap.forEach((v, k) => {
            if (v.get + v.set + v.invoked > 0) {
              logToConsole(`${k},${v.get},${v.invoked},${v.set}`);
            }
          });
        };*/
        // Goal:
        // - Attach unique IDs to all HTML tags in the DOM corresponding to their location post-body-load.
        // - On update: Update IDs.
        // - Insertion to scope modifies all IDs in scope.
        // Possibilities:
        // - Node is only in DOM.
        //   - Instrument DOM location.
        // - Node is only in heap.
        //   - Instrument node object.
        // - Node is in both.
        //   - Instrument both.
        // Regardless:
        // - Need to *unwrap* arguments
        // - Need to *wrap* return values
        // Node:
        // nodeValue: Not important?
        // textContent: Pass it a string. Replaces content.
        // appendChild: Passed a Node. Modifies DOM.
        // insertBefore: Takes Nodes. Modifies DOM.
        // isEqualNode: Takes a Node.
        // isSameNode: Takes a Node.
        // normalize: Removes things from DOM.
        // removeChild: Removes a child.
        // replaceChild: Replaces a child.
        // Element:
        // innerHTML
        // outerHTML
        // insertAdjacentElement
        // insertAdjacentHTML
        // insertAdjacentText
        // remove
        // **SPECIAL**: dataset - modifies properties on DOM object through object!!!!
        // -> throw exception if used.
        // SVGElement:
        // dataset: Throw exception if used
        // On properties:
        // - Document.prototype
        // - Element.prototype
        // - MediaQueryList.prototype
        // - FileReader.prototype
        // - HTMLBodyElement
        // - HTMLElement
        // - HTMLFrameSetElement
        // - AudioTrackList? TextTrack? TextTrackCue? TextTrackList? VideoTrackList?
        // - ApplicationCache
        // - EventSource
        // - SVGAnimationElement
        // - SVGElement
        // - Performance?
        // - Worker?
        // - XMLHttpRequest
        // - XMLHttpRequestEventTarget
        // - WebSocket
        // - IDBDatabase
        // - IDBOpenDBRequest
        // - IDBRequest
        // - IDBTransaction
        // - window.[property] (Special)
    }
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmxlYWtfYWdlbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvbGliL2JsZWFrX2FnZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLGNBQWMsQ0FBQztBQXFFZjs7R0FFRztBQUNILENBQUM7SUFDQyxvQkFBb0I7SUFDcEIsSUFBTSxTQUFTLEdBQUcsT0FBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLFdBQVcsQ0FBQztJQUNqRCxJQUFNLFNBQVMsR0FBRyxPQUFNLENBQUMsYUFBYSxDQUFDLEtBQUssV0FBVyxDQUFDO0lBQ3hELElBQU0sSUFBSSxHQUFZLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUN2RSwrQkFBK0I7SUFDL0IsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLENBQUMsQ0FBQztRQUNoQyxNQUFNLENBQUM7SUFDVCxDQUFDO0lBQ0QsSUFBSSxDQUFDLHNCQUFzQixHQUFHLHNCQUFzQixDQUFDO0lBQ3JELElBQUksQ0FBQyxzQkFBc0IsR0FBRyxzQkFBc0IsQ0FBQztJQUNyRCxJQUFJLENBQUMseUJBQXlCLEdBQUcseUJBQXlCLENBQUM7SUFDM0QsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7SUFDekIsSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7SUFDM0IsSUFBSSxDQUFDLGVBQWUsR0FBRyxlQUFlLENBQUM7SUFDdkMsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUM7SUFDekIsSUFBSSxDQUFDLGtCQUFrQixHQUFHLGtCQUFrQixDQUFDO0lBQzdDLElBQUksQ0FBQyx5QkFBeUIsR0FBRyx5QkFBeUIsQ0FBQztJQUMzRCxJQUFJLENBQUMsdUJBQXVCLEdBQUcsdUJBQXVCLENBQUM7SUFDdkQsSUFBSSxDQUFDLHVCQUF1QixHQUFHLHVCQUF1QixDQUFDO0lBQ3ZELElBQUksQ0FBQyxtQkFBbUIsR0FBRyxtQkFBbUIsQ0FBQztJQUUvQyxJQUFNLENBQUMsR0FBRyxJQUFJLENBQUM7SUFDZix3Q0FBd0M7SUFDeEMsSUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsVUFBQyxHQUFXLElBQU0sQ0FBQyxFQUFFLENBQUM7SUFDM0UsSUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQztJQUMvQixzQkFBc0IsQ0FBUztRQUM3QixVQUFVLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztJQUM5QixDQUFDO0lBRUQ7O09BRUc7SUFDSDtRQUNFLElBQUksQ0FBQztZQUNILE1BQU0sSUFBSSxLQUFLLEVBQUUsQ0FBQztRQUNwQixDQUFDO1FBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNYLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO1FBQ2pCLENBQUM7SUFDSCxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsb0JBQW9CLENBQVM7UUFDM0IsTUFBTSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQzdCLENBQUM7SUFFRDs7Ozs7OztPQU9HO0lBQ0gsbUNBQW1DLGlCQUF3QixFQUFFLGNBQXdCLEVBQUUsZ0JBQXVDLEVBQUUsSUFBYyxFQUFFLFNBQWdCO1FBQzlKLGNBQWMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLFVBQUMsT0FBTztZQUMxQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsR0FBRztnQkFDMUIsS0FBSyxFQUFFLFNBQVM7Z0JBQ2hCLFVBQVUsRUFBRSxJQUFJO2dCQUNoQixRQUFRLEVBQUUsSUFBSTtnQkFDZCxZQUFZLEVBQUUsSUFBSTthQUNuQixDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCx3QkFBd0I7UUFDeEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3RCLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDakQsQ0FBQyxDQUFDLENBQUM7UUFFSCxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO0lBQzVELENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsa0JBQWtCLENBQU0sRUFBRSxDQUFNO1FBQzlCLEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3BCLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDZCxDQUFDO1FBQUMsSUFBSSxDQUFDLENBQUM7WUFDTixNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNoQixDQUFDO0lBQ0gsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxtQkFBbUIsQ0FBTSxFQUFFLENBQU07UUFDL0IsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDWixNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ2QsQ0FBQztRQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM1QyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxXQUFXLEtBQUssQ0FBQyxDQUFDO2dCQUM3RCxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDLFdBQVcsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUM3RCxDQUFDO1FBQ0QsTUFBTSxDQUFDLEtBQUssQ0FBQztJQUNmLENBQUM7SUFFRCxJQUFNLE1BQU0sR0FBRyxJQUFJLEdBQUcsRUFBVSxDQUFDO0lBWWpDLHlCQUF5QixDQUFTLEVBQUUsS0FBZTtRQUNqRCxFQUFFLENBQUMsQ0FBQyxLQUFLLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQztZQUN4QixFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUNWLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDaEIsQ0FBQztZQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNOLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbkIsQ0FBQztRQUNILENBQUM7UUFBQyxJQUFJLENBQUMsQ0FBQztZQUNOLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3ZCLENBQUM7SUFDSCxDQUFDO0lBRUQ7Ozs7Ozs7OztPQVNHO0lBQ0gsb0JBQW9CLE1BQWEsRUFBRSxHQUFXLEVBQUUsS0FBVTtRQUN4RCxFQUFFLENBQUMsQ0FBQyxNQUFNLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNwQixNQUFNLENBQUMsS0FBSyxDQUFDO1FBQ2YsQ0FBQztRQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0QyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsS0FBSyxDQUFDO1lBQ3BCLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDZCxDQUFDO1FBQUMsSUFBSSxDQUFDLENBQUM7WUFDTixNQUFNLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLEVBQUUsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQy9ELENBQUM7SUFDSCxDQUFDO0lBRUQsV0FBVztJQUNYLElBQU0sY0FBYyxHQUFHLEVBQUUsQ0FBQztJQUUxQjs7Ozs7T0FLRztJQUNILGlCQUFpQixNQUFXLEVBQUUsR0FBVztRQUN2QyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksTUFBTSxDQUFDLENBQUMsQ0FBQztZQUNsQixNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3JCLENBQUM7UUFBQyxJQUFJLENBQUMsQ0FBQztZQUNOLE1BQU0sQ0FBQyxjQUFjLENBQUM7UUFDeEIsQ0FBQztJQUNILENBQUM7SUFFRCw2REFBNkQ7SUFDN0QsSUFBTSxRQUFRLEdBQUcsSUFBSSxRQUFRLENBQUMsT0FBTyxFQUFFLFdBQVcsRUFBRSx5QkFBeUIsQ0FBQyxDQUFDO0lBQy9FLDBFQUEwRTtJQUMxRSxJQUFNLFVBQVUsR0FBRyxJQUFJLEdBQUcsRUFBcUMsQ0FBQztJQUNoRSxJQUFNLGdCQUFnQixHQUFHLEdBQUcsQ0FBQztJQUU3Qjs7T0FFRztJQUNIO1FBQ0UsSUFBTSxLQUFLLEdBQThCLEVBQUUsQ0FBQztRQUM1QyxVQUFVLENBQUMsT0FBTyxDQUFDLFVBQUMsQ0FBQyxJQUFLLE9BQUEsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBYixDQUFhLENBQUMsQ0FBQztRQUN6QyxLQUFLLENBQUMsSUFBSSxDQUFDLFVBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSyxPQUFBLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBWCxDQUFXLENBQUMsQ0FBQztRQUNsQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsVUFBQyxDQUFDO1lBQzNCLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3pCLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsNEJBQTRCLEtBQVUsRUFBRSxNQUFjO1FBQ3BELElBQUksS0FBSyxHQUFHLFVBQVUsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDbkMsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ1gsSUFBTSxHQUFHLEdBQUcsSUFBSSxjQUFjLEVBQUUsQ0FBQztZQUNqQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDakMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLGNBQWMsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1lBQ3pELEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsTUFBTSxRQUFBLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDckQsS0FBSyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxZQUFZLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDO1lBQ3ZDLFVBQVUsQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzlCLEVBQUUsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxJQUFJLEdBQUcsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO2dCQUN2QyxhQUFhLEVBQUUsQ0FBQztZQUNsQixDQUFDO1FBQ0gsQ0FBQztRQUNELG1CQUFtQjtRQUNuQixLQUFLLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUN0QixNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksS0FBSyxDQUFDLEtBQUssRUFBRTtZQUMvQiwwRUFBMEU7WUFDMUUsa0VBQWtFO1lBQ2xFLEdBQUcsRUFBRSxVQUFVO1NBQ2hCLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDZixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILGlDQUFpQyxPQUFlLEVBQUUsS0FBWTtRQUM1RCxvQ0FBb0M7UUFDcEMsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLE9BQU8sRUFBRTtZQUN4QixHQUFHLEVBQUUsVUFBUyxNQUFNLEVBQUUsR0FBVztnQkFDL0IsSUFBTSxDQUFDLEdBQUcsT0FBTyxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQztnQkFDL0IsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLGNBQWMsQ0FBQyxDQUFDLENBQUM7b0JBQ3pCLElBQU0sR0FBQyxHQUFHLE9BQU8sQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7b0JBQzlCLEVBQUUsQ0FBQyxDQUFDLEdBQUMsS0FBSyxjQUFjLENBQUMsQ0FBQyxDQUFDO3dCQUN6QixNQUFNLElBQUksY0FBYyxDQUFJLEdBQUcsb0JBQWlCLENBQUMsQ0FBQztvQkFDcEQsQ0FBQztvQkFDRCxNQUFNLENBQUMsR0FBQyxDQUFDO2dCQUNYLENBQUM7Z0JBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ04sTUFBTSxDQUFDLENBQUMsQ0FBQztnQkFDWCxDQUFDO1lBQ0gsQ0FBQztZQUNELEdBQUcsRUFBRSxVQUFTLE1BQU0sRUFBRSxHQUFXLEVBQUUsS0FBSztnQkFDdEMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLEtBQUssQ0FBQyxJQUFJLFVBQVUsQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3pFLENBQUM7U0FDRixDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQ7O09BRUc7SUFDSCxtQ0FBbUMsR0FBYSxFQUFFLEtBQVk7UUFDNUQsTUFBTSxDQUFDLGNBQWMsQ0FBQyxHQUFHLEVBQUUsV0FBVyxFQUFFO1lBQ3RDLEdBQUcsRUFBRTtnQkFDSCxNQUFNLENBQUMsS0FBSyxDQUFDO1lBQ2YsQ0FBQztZQUNELFlBQVksRUFBRSxJQUFJO1NBQ25CLENBQUMsQ0FBQztRQUNILE1BQU0sQ0FBQyxHQUFHLENBQUM7SUFDYixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILGlDQUFpQyxHQUFXLEVBQUUsS0FBWTtRQUN4RCxJQUFNLEtBQUssR0FBRyxNQUFNLENBQUMseUJBQXlCLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDcEQsR0FBRyxDQUFDLENBQWUsVUFBSyxFQUFMLGVBQUssRUFBTCxtQkFBSyxFQUFMLElBQUs7WUFBbkIsSUFBTSxJQUFJLGNBQUE7WUFDYixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDYix5QkFBeUIsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzdDLENBQUM7WUFDRCxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDYix5QkFBeUIsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzdDLENBQUM7U0FDRjtRQUNELE1BQU0sQ0FBQyxHQUFHLENBQUM7SUFDYixDQUFDO0lBSUQsNkZBQTZGO0lBQzdGLGtCQUFrQjtJQUNsQixJQUFNLGdCQUFnQixHQUFHLGFBQWEsQ0FBQztJQUN2Qzs7OztPQUlHO0lBQ0gsd0JBQXdCLENBQU87UUFDN0IsSUFBTSxVQUFVLEdBQUcsQ0FBQyxDQUFDLFVBQVUsQ0FBQztRQUNoQyxJQUFNLENBQUMsR0FBZSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsVUFBVSxFQUFFLGFBQWEsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO1FBQ3pFLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDWCxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsdUJBQXVCLEVBQVk7UUFDakMsSUFBTSxXQUFXLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQztRQUM5QixJQUFJLEVBQUUsR0FBZSxFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQUUsQ0FBQztRQUM3QyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFdBQVcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ3JDLEVBQUUsQ0FBQyxLQUFHLGdCQUFnQixHQUFHLENBQUcsQ0FBQyxHQUFHLGNBQWMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN4RCxDQUFDO1FBQ0QsTUFBTSxDQUFDLEVBQUUsQ0FBQztJQUNaLENBQUM7SUFFRDs7T0FFRztJQUNILDZCQUE2QixDQUFrQjtRQUFsQixrQkFBQSxFQUFBLFlBQWtCO1FBQzdDLElBQUksQ0FBQyxTQUFTLEdBQUcsY0FBYyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQzVDLENBQUM7SUFFRDs7O09BR0c7SUFDSCxxQkFBcUIsQ0FBTTtRQUN6QixNQUFNLENBQUMsQ0FBQyxPQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2xCLEtBQUssUUFBUSxDQUFDO1lBQ2QsS0FBSyxVQUFVO2dCQUNiLE1BQU0sQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUMsMkJBQTJCO1lBQ2hEO2dCQUNFLE1BQU0sQ0FBQyxLQUFLLENBQUM7UUFDakIsQ0FBQztJQUNILENBQUM7SUFlRDs7O09BR0c7SUFDSCx3QkFBd0IsQ0FBTTtRQUM1QixFQUFFLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLGNBQWMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdEQsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN4QixNQUFNLGtCQUFzQjtZQUM5QixDQUFDO1lBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ04sTUFBTSxtQkFBdUI7WUFDL0IsQ0FBQztRQUNILENBQUM7UUFDRCxNQUFNLGtCQUFzQjtJQUM5QixDQUFDO0lBRUQsNkJBQTZCLENBQU07UUFDakMsTUFBTSxDQUFDLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQztJQUM3QixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILHVCQUF1QixDQUFNO1FBQzNCLE1BQU0sQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDMUI7Z0JBQ0UsTUFBTSxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUM7WUFDMUIsdUJBQTJCO1lBQzNCO2dCQUNFLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDYixDQUFDO0lBQ0gsQ0FBQztJQUVEOzs7T0FHRztJQUNILHdCQUF3QixDQUFNO1FBQzVCLE1BQU0sQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDMUI7Z0JBQ0UsTUFBTSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUM7WUFDdkIsc0JBQTBCO1lBQzFCO2dCQUNFLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDYixDQUFDO0lBQ0gsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCx3QkFBd0IsR0FBNEIsRUFBRSxRQUFrQyxFQUFFLEtBQXdCO1FBQXhCLHNCQUFBLEVBQUEsUUFBUSxjQUFjLEVBQUU7UUFDaEgsSUFBSSxHQUFHLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUM1QixFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDVCxHQUFHLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQztZQUN4QixHQUFHLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUN6QixDQUFDO1FBQ0QsR0FBRyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNqQixDQUFDO0lBQ0Q7Ozs7T0FJRztJQUNILHVCQUF1QixHQUE0QixFQUFFLFFBQWtDO1FBQ3JGLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3RCLEdBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDdkIsQ0FBQztJQUNILENBQUM7SUFDRDs7Ozs7T0FLRztJQUNILHFCQUFxQixHQUE0QixFQUFFLElBQThCLEVBQUUsRUFBNEI7UUFDN0csRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbEIsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQzdCLENBQUM7SUFDSCxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCx3QkFBd0IsR0FBNEIsRUFBRSxJQUE4QixFQUFFLEVBQTRCO1FBQ2hILEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDakMsSUFBTSxVQUFVLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNqQyxJQUFNLFVBQVEsR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzdCLFVBQVUsQ0FBQyxPQUFPLENBQUMsVUFBQyxDQUFDO2dCQUNuQixVQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2xCLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztJQUNILENBQUM7SUFFRDs7T0FFRztJQUNILHdCQUF3QixHQUFRLEVBQUUsR0FBNEIsRUFBRSxLQUFhO1FBQzNFLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLFVBQUMsQ0FBQztZQUN6QixjQUFjLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNoQyxDQUFDLENBQUMsQ0FBQztRQUNILE1BQU0sQ0FBQyxHQUFHLENBQUM7SUFDYixDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsa0JBQWtCLFNBQWlCLEVBQUUsR0FBUSxFQUFFLFVBQXlCO1FBQXpCLDJCQUFBLEVBQUEsaUJBQXlCO1FBQ3RFLEVBQUUsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0QixrRkFBa0Y7WUFDbEYsTUFBTSxDQUFDLEdBQUcsQ0FBQztRQUNiLENBQUM7UUFBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM5QyxJQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsRUFBeUMsQ0FBQztZQUM3RCxFQUFFLENBQUMsQ0FBQyxVQUFVLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDeEIsY0FBYyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDdkMsQ0FBQztZQUNELE1BQU0sQ0FBQyxjQUFjLENBQUMsR0FBRyxFQUFFLGdCQUFnQixFQUFFO2dCQUMzQyxLQUFLLEVBQUUsR0FBRztnQkFDVixRQUFRLEVBQUUsS0FBSztnQkFDZixVQUFVLEVBQUUsS0FBSztnQkFDakIsWUFBWSxFQUFFLElBQUk7YUFDbkIsQ0FBQyxDQUFDO1lBQ0gsTUFBTSxDQUFDLGNBQWMsQ0FBQyxHQUFHLEVBQUUsbUJBQW1CLEVBQUU7Z0JBQzlDLEtBQUssRUFBRSxHQUFHO2dCQUNWLFFBQVEsRUFBRSxLQUFLO2dCQUNmLFVBQVUsRUFBRSxLQUFLO2dCQUNqQixZQUFZLEVBQUUsS0FBSzthQUNwQixDQUFDLENBQUM7WUFDSCwyQkFBMkI7WUFDekIsc0NBQXNDO1lBQ3hDLEdBQUc7WUFDSCxNQUFNLENBQUMsY0FBYyxDQUFDLEdBQUcsRUFBRSxhQUFhLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxLQUFLLENBQUMsR0FBRyxFQUFFO29CQUNoRSxjQUFjLEVBQUUsVUFBUyxNQUFNLEVBQUUsUUFBUSxFQUFFLFVBQVU7d0JBQ25ELEVBQUUsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQzs0QkFDcEIseUJBQXlCOzRCQUN6QixjQUFjLENBQUMsbUJBQW1CLENBQUMsTUFBTSxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUM7d0JBQ3hELENBQUM7d0JBQ0QseUJBQXlCO3dCQUN6QixNQUFNLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLFVBQVUsQ0FBQyxDQUFDO29CQUM5RCxDQUFDO29CQUNELEdBQUcsRUFBRSxVQUFTLE1BQU0sRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLFFBQVE7d0JBQzdDLEVBQUUsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQzs0QkFDcEIseUJBQXlCOzRCQUN6QixjQUFjLENBQUMsbUJBQW1CLENBQUMsTUFBTSxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUM7d0JBQ3hELENBQUM7d0JBQ0QsY0FBYzt3QkFDZCxNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztvQkFDdEQsQ0FBQztvQkFDRCxjQUFjLEVBQUUsVUFBUyxNQUFNLEVBQUUsUUFBUTt3QkFDdkMsRUFBRSxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDOzRCQUNwQiw4Q0FBOEM7NEJBQzlDLGFBQWEsQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQzt3QkFDdkQsQ0FBQzt3QkFDRCx5QkFBeUI7d0JBQ3pCLE1BQU0sQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQztvQkFDbEQsQ0FBQztpQkFDRixDQUFDLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQy9ELENBQUM7UUFDRCxNQUFNLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQztJQUN6QixDQUFDO0lBVUQsK0JBQXNELFVBQWtCO1FBQ3RFLElBQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDekIsSUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUMzQixJQUFNLGdCQUFnQixHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQztRQUNqRCxHQUFHLENBQUMsQ0FBZSxVQUFLLEVBQUwsZUFBSyxFQUFMLG1CQUFLLEVBQUwsSUFBSztZQUFuQixJQUFNLElBQUksY0FBQTtZQUNiLGNBQWMsQ0FBQyxnQkFBZ0IsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1NBQzFEO0lBQ0gsQ0FBQztJQUVELDRCQUE0QixDQUFrQjtRQUM1QyxNQUFNLENBQUMsV0FBUyxDQUFHLENBQUM7SUFDdEIsQ0FBQztJQUVELHdCQUF3QixPQUFZLEVBQUUsQ0FBa0IsRUFBRSxLQUFVO1FBQ2xFLElBQU0sUUFBUSxHQUFHLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3ZDLEVBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdEMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsUUFBUSxFQUFFO2dCQUN2QyxLQUFLLEVBQUUsSUFBSTtnQkFDWCxRQUFRLEVBQUUsSUFBSTthQUNmLENBQUMsQ0FBQztRQUNMLENBQUM7UUFDRCxPQUFPLENBQUMsUUFBUSxDQUFDLEdBQUcsS0FBSyxDQUFDO0lBQzVCLENBQUM7SUFFRCx3QkFBd0IsT0FBWSxFQUFFLENBQWtCO1FBQ3RELE1BQU0sQ0FBQyxPQUFPLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN4QyxDQUFDO0lBRUQsd0JBQXdCLGdCQUF3QixFQUFFLFlBQW9CLEVBQUUsSUFBUyxFQUFFLElBQWUsRUFBRSxVQUF5QjtRQUF6QiwyQkFBQSxFQUFBLGlCQUF5QjtRQUMzSCxJQUFJLFFBQXlCLENBQUM7UUFDOUIsdUVBQXVFO1FBQ3ZFLElBQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ3JFLEVBQUUsQ0FBQyxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsR0FBRyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQVEsSUFBSSxDQUFDLEdBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNuRSw2Q0FBNkM7WUFDN0MsUUFBUSxHQUFTLElBQUksQ0FBQyxHQUFHLENBQUM7UUFDNUIsQ0FBQztRQUFDLElBQUksQ0FBQyxDQUFDO1lBQ04sdUNBQXVDO1lBQ3ZDLDRDQUE0QztZQUM1QyxJQUFNLFdBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDO1lBQ2pDLElBQU0sYUFBVyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUM7WUFDckMsY0FBYyxDQUFDLElBQUksRUFBRSxhQUFXLEVBQUUsSUFBSSxDQUFDLGFBQVcsQ0FBQyxDQUFDLENBQUM7WUFDckQsRUFBRSxDQUFDLENBQUMsV0FBUyxDQUFDLENBQUMsQ0FBQztnQkFDZCwyREFBMkQ7Z0JBQzNELElBQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxZQUFZLEVBQUUsY0FBYyxDQUFDLElBQUksRUFBRSxhQUFXLENBQUMsQ0FBQyxDQUFDO2dCQUN4RSxjQUFjLENBQUMsSUFBSSxFQUFFLGFBQVcsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDekMsRUFBRSxDQUFDLENBQUMsVUFBVSxLQUFLLElBQUksSUFBSSxjQUFjLENBQUMsS0FBSyxDQUFDLHFCQUF5QixDQUFDLENBQUMsQ0FBQztvQkFDMUUsSUFBTSxHQUFHLEdBQTRCLG1CQUFtQixDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUNoRSxjQUFjLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDekMsQ0FBQztZQUNILENBQUM7WUFDRCxRQUFRLEdBQVMsVUFBb0IsQ0FBTTtnQkFDekMsSUFBTSxLQUFLLEdBQUcsY0FBYyxFQUFFLENBQUM7Z0JBQy9CLGNBQWMsQ0FBQyxJQUFJLEVBQUUsYUFBVyxFQUFFLFdBQVMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLFlBQVksRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNwRixRQUFRLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUN6QixtREFBbUQ7Z0JBQ25ELE1BQU0sQ0FBQyxJQUFJLENBQUM7WUFDZCxDQUFDLENBQUM7WUFDRixRQUFRLENBQUMsa0JBQWtCLEdBQUcsZ0JBQWdCLENBQUM7WUFDL0MsUUFBUSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7WUFDdEIsUUFBUSxDQUFDLFFBQVEsR0FBRyxxQkFBcUIsQ0FBQztZQUMxQyxRQUFRLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQztZQUV2QixJQUFJLENBQUM7Z0JBQ0gsTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsYUFBVyxFQUFFO29CQUN2QyxHQUFHLEVBQUU7d0JBQ0gsTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsYUFBVyxDQUFDLENBQUM7b0JBQzNDLENBQUM7b0JBQ0QsR0FBRyxFQUFFLFFBQVE7b0JBQ2IsWUFBWSxFQUFFLElBQUk7aUJBQ25CLENBQUMsQ0FBQztZQUNMLENBQUM7WUFBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNYLFlBQVksQ0FBQywwQkFBd0IsZ0JBQWdCLFVBQUssQ0FBRyxDQUFDLENBQUM7WUFDakUsQ0FBQztRQUNILENBQUM7UUFFRCxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDMUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDNUIsZ0NBQWdDO1lBQ2hDLDJFQUEyRTtZQUMzRSw2Q0FBNkM7WUFDN0MscUVBQXFFO1lBQ3JFLG9EQUFvRDtZQUNwRCxFQUFFLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO2dCQUNmLFFBQVEsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDaEMsQ0FBQztRQUNILENBQUM7SUFDSCxDQUFDO0lBRUQsUUFBUTtJQUNSLG9CQUFvQjtJQUNwQix5Q0FBeUM7SUFDekMsMEJBQTBCO0lBRTFCLHlCQUF5QjtJQUN6QixpQkFBaUI7SUFDakIsZ0JBQWdCO0lBQ2hCLGdCQUFnQjtJQUNoQixxQ0FBcUM7SUFDckMsRUFBRTtJQUVGLDJCQUEyQixnQkFBd0IsRUFBRSxJQUFTLEVBQUUsSUFBZSxFQUFFLFVBQXlCO1FBQXpCLDJCQUFBLEVBQUEsaUJBQXlCO1FBQ3hHLGdIQUFnSDtRQUNoSCw0Q0FBNEM7UUFDNUMsSUFBSSxHQUFRLENBQUM7UUFDYixJQUFJLFlBQVksR0FBRyxnQkFBZ0IsQ0FBQztRQUNwQyxJQUFJLG1CQUFtQixHQUFHLEtBQUssQ0FBQztRQUNoQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztZQUN6QixLQUFLLFdBQVc7Z0JBQ2QsR0FBRyxHQUFHLFFBQVEsQ0FBQztnQkFDZixZQUFZLEdBQUcsVUFBVSxDQUFDO2dCQUMxQixLQUFLLENBQUM7WUFDUixLQUFLLE1BQU07Z0JBQ1QsbUJBQW1CLEdBQUcsSUFBSSxDQUFDO2dCQUMzQixHQUFHLEdBQUcsSUFBSSxDQUFDO2dCQUNYLEtBQUssQ0FBQztZQUNSLEtBQUssWUFBWTtnQkFDZixHQUFHLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUN6QixZQUFZLElBQUksZ0JBQWdCLENBQUM7Z0JBQ2pDLEtBQUssQ0FBQztZQUNSO2dCQUNFLElBQU0sUUFBUSxHQUFhLElBQUksQ0FBQyxXQUFZLENBQUMsS0FBSyxDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUM1RSxHQUFHLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUNyQixZQUFZLElBQUksTUFBSSxRQUFRLE1BQUcsQ0FBQztnQkFDaEMsS0FBSyxDQUFDO1FBQ1YsQ0FBQztRQUVELEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUNULE1BQU0sQ0FBQztRQUNULENBQUM7UUFFRCxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztZQUMzQixNQUFNLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxFQUFFO2dCQUMzQixVQUFVLEVBQUU7b0JBQ1YsS0FBSyxFQUFFLElBQUk7b0JBQ1gsUUFBUSxFQUFFLElBQUk7b0JBQ2QsWUFBWSxFQUFFLElBQUk7aUJBQ25CO2dCQUNELG1CQUFtQixFQUFFO29CQUNuQixLQUFLLEVBQUUsSUFBSTtvQkFDWCxRQUFRLEVBQUUsSUFBSTtvQkFDZCxZQUFZLEVBQUUsSUFBSTtpQkFDbkI7YUFDRixDQUFDLENBQUM7UUFDTCxDQUFDO1FBQ0QsR0FBRyxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7UUFDdEIsR0FBRyxDQUFDLG1CQUFtQixHQUFHLFlBQVksQ0FBQztRQUN2QyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztZQUNuQixRQUFRLENBQUMsWUFBWSxFQUFFLEdBQUcsRUFBRSxVQUFVLENBQUMsQ0FBQztRQUMxQyxDQUFDO1FBRUQsOEJBQThCO1FBQzlCLElBQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7UUFDL0IsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUNiLElBQU0sa0JBQWtCLEdBQUcsbUJBQW1CLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsaUJBQWlCLENBQUM7WUFDcEYsSUFBTSxHQUFHLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQztZQUM1QixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUM3QixJQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzFCLGtCQUFrQixDQUFDLFlBQVksRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQzNELENBQUM7UUFDSCxDQUFDO0lBQ0gsQ0FBQztJQUVELHdCQUF3QixnQkFBd0IsRUFBRSxJQUFTLEVBQUUsSUFBZSxFQUFFLFVBQXlCO1FBQXpCLDJCQUFBLEVBQUEsaUJBQXlCO1FBQ3JHLElBQU0sWUFBWSxHQUFHLGdCQUFnQixJQUFHLE1BQUksVUFBVSxDQUFDLEtBQUcsSUFBSSxDQUFDLFdBQWEsQ0FBQyxNQUFHLENBQUEsQ0FBQztRQUNqRixpREFBaUQ7UUFDakQsdUNBQXVDO1FBQ3ZDLEVBQUUsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN2Qix3Q0FBd0M7WUFDeEMsTUFBTSxDQUFDO1FBQ1QsQ0FBQztRQUNELElBQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDbkMsY0FBYyxDQUFDLGdCQUFnQixFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBRXZFLDhCQUE4QjtRQUM5QixJQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO1FBQy9CLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDYixJQUFNLEdBQUcsR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDO1lBQzVCLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQzdCLElBQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDMUIsY0FBYyxDQUFDLFlBQVksRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQ3ZELENBQUM7UUFDSCxDQUFDO0lBQ0gsQ0FBQztJQUVELCtCQUErQjtJQUMvQixJQUFJLGNBQWMsR0FBRyxLQUFLLENBQUM7SUFFM0IsbUJBQW1CLElBQWU7UUFDaEMsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLEtBQUssV0FBVyxDQUFDO0lBQzFDLENBQUM7SUFFRCxJQUFJLGlCQUFpQixHQUFlLEVBQUUsQ0FBQztJQUN2QyxnQ0FBZ0MsS0FBaUI7UUFDL0MsR0FBRyxDQUFDLENBQWUsVUFBSyxFQUFMLGVBQUssRUFBTCxtQkFBSyxFQUFMLElBQUs7WUFBbkIsSUFBTSxJQUFJLGNBQUE7WUFDYixFQUFFLENBQUMsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNwQixpQkFBaUIsQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsQ0FBQztZQUM3RCxDQUFDO1lBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ04sY0FBYyxDQUFDLGNBQWMsRUFBRSxJQUFJLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzFELENBQUM7U0FDRjtRQUNELGlCQUFpQixHQUFHLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUN0RCxDQUFDO0lBRUQsd0JBQXdCLElBQVMsRUFBRSxJQUFlLEVBQUUsU0FBc0M7UUFDeEYsSUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUNuQyxFQUFFLENBQUMsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3JCLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLElBQUksY0FBYyxDQUFDLEdBQUcsQ0FBQyxxQkFBeUIsQ0FBQyxDQUFDLENBQUM7Z0JBQ25FLElBQU0sR0FBRyxHQUFHLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNyQyxJQUFNLGFBQVcsR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUcsRUFBVSxDQUFDO2dCQUNoRixHQUFHLENBQUMsT0FBTyxDQUFDLFVBQUMsQ0FBQyxFQUFFLENBQUM7b0JBQ2YsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFDLENBQUMsSUFBSyxPQUFBLGFBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQWxCLENBQWtCLENBQUMsQ0FBQztnQkFDdkMsQ0FBQyxDQUFDLENBQUM7Z0JBQ0gsU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsR0FBRyxhQUFXLENBQUM7WUFDbkMsQ0FBQztZQUVELElBQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDL0IsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztnQkFDYixHQUFHLENBQUMsQ0FBZ0IsVUFBUSxFQUFSLHFCQUFRLEVBQVIsc0JBQVEsRUFBUixJQUFRO29CQUF2QixJQUFNLEtBQUssaUJBQUE7b0JBQ2QsY0FBYyxDQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7aUJBQ3ZDO1lBQ0gsQ0FBQztRQUNILENBQUM7SUFDSCxDQUFDO0lBRUQsMkJBQTJCLElBQVMsRUFBRSxJQUFlLEVBQUUsU0FBc0M7UUFDM0YsSUFBSSxHQUFRLENBQUM7UUFDYixJQUFJLG1CQUFtQixHQUFHLEtBQUssQ0FBQztRQUNoQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztZQUN6QixLQUFLLFdBQVc7Z0JBQ2QsR0FBRyxHQUFHLFFBQVEsQ0FBQztnQkFDZixLQUFLLENBQUM7WUFDUixLQUFLLE1BQU07Z0JBQ1QsbUJBQW1CLEdBQUcsSUFBSSxDQUFDO2dCQUMzQixHQUFHLEdBQUcsSUFBSSxDQUFDO2dCQUNYLEtBQUssQ0FBQztZQUNSLEtBQUssWUFBWTtnQkFDZixHQUFHLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztnQkFDN0IsS0FBSyxDQUFDO1lBQ1I7Z0JBQ0UsR0FBRyxHQUFHLElBQUksQ0FBVyxJQUFJLENBQUMsV0FBWSxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dCQUN2RSxLQUFLLENBQUM7UUFDVixDQUFDO1FBRUQsRUFBRSxDQUFDLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1lBQ3ZDLElBQU0sVUFBVSxHQUFHLGNBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN2QyxFQUFFLENBQUMsQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLHFCQUF5QixDQUFDLENBQUMsQ0FBQztnQkFDeEQsSUFBTSxHQUFHLEdBQUcsbUJBQW1CLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQzVDLElBQU0sYUFBVyxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksR0FBRyxFQUFVLENBQUM7Z0JBQ2hGLEdBQUcsQ0FBQyxPQUFPLENBQUMsVUFBQyxDQUFDLEVBQUUsQ0FBQztvQkFDZixDQUFDLENBQUMsT0FBTyxDQUFDLFVBQUMsQ0FBQyxJQUFLLE9BQUEsYUFBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBbEIsQ0FBa0IsQ0FBQyxDQUFDO2dCQUN2QyxDQUFDLENBQUMsQ0FBQztnQkFDSCxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLGFBQVcsQ0FBQztZQUNuQyxDQUFDO1FBQ0gsQ0FBQztRQUVELDhCQUE4QjtRQUM5QixJQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO1FBQy9CLElBQU0sc0JBQXNCLEdBQUcsbUJBQW1CLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsaUJBQWlCLENBQUM7UUFDeEYsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUNiLElBQU0sR0FBRyxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUM7WUFDNUIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDN0IsSUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUMxQixzQkFBc0IsQ0FBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ2hELENBQUM7UUFDSCxDQUFDO0lBQ0gsQ0FBQztJQUVEO1FBQ0UsSUFBTSxTQUFTLEdBQWdDLEVBQUUsQ0FBQztRQUNsRCxHQUFHLENBQUMsQ0FBZSxVQUFpQixFQUFqQix1Q0FBaUIsRUFBakIsK0JBQWlCLEVBQWpCLElBQWlCO1lBQS9CLElBQU0sSUFBSSwwQkFBQTtZQUNiLEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3BCLGlCQUFpQixDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3hELENBQUM7WUFBQyxJQUFJLENBQUMsQ0FBQztnQkFDTixjQUFjLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDckQsQ0FBQztTQUNGO1FBQ0QsSUFBTSxpQkFBaUIsR0FBdUIsRUFBRSxDQUFDO2dDQUN0QyxRQUFRO1lBQ2pCLEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN2QyxJQUFNLEVBQUUsR0FBRyxRQUFRLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUNsQyxJQUFNLE1BQU0sR0FBRyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQzdCLElBQUksR0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDVixJQUFNLFlBQVUsR0FBRyxJQUFJLEtBQUssQ0FBUyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ2xELE1BQU0sQ0FBQyxPQUFPLENBQUMsVUFBQyxDQUFDO29CQUNmLFlBQVUsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDdEIsQ0FBQyxDQUFDLENBQUE7Z0JBQ0YsaUJBQWlCLENBQUMsRUFBRSxDQUFDLEdBQUcsWUFBVSxDQUFDO1lBQ3JDLENBQUM7UUFDSCxDQUFDO1FBWEQsR0FBRyxDQUFDLENBQUMsSUFBTSxRQUFRLElBQUksU0FBUyxDQUFDO29CQUF0QixRQUFRO1NBV2xCO1FBQ0QsTUFBTSxDQUFDLGlCQUFpQixDQUFDO0lBQzNCLENBQUM7SUFFRCxFQUFFLENBQUMsQ0FBQyxTQUFTLElBQUksU0FBUyxDQUFDLENBQUMsQ0FBQztRQUMzQiwyQkFBMkI7UUFFM0I7Ozs7Ozs7OztZQVNJO1FBRUosSUFBTSxrQkFBZ0IsR0FBRyxXQUFXLENBQUMsU0FBUyxDQUFDLGdCQUFnQixDQUFDO1FBQ2hFLElBQU0scUJBQW1CLEdBQUcsV0FBVyxDQUFDLFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQztRQUN0RSxXQUFXLENBQUMsU0FBUyxDQUFDLGdCQUFnQixHQUFHLFVBQTRCLElBQVksRUFBRSxRQUE0QyxFQUFFLFVBQTJCO1lBQTNCLDJCQUFBLEVBQUEsa0JBQTJCO1lBQzFKLGtCQUFnQixDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDdkQsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztnQkFDdEIsSUFBSSxDQUFDLFdBQVcsR0FBRyxFQUFFLENBQUM7WUFDeEIsQ0FBQztZQUNELElBQUksU0FBUyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDdkMsRUFBRSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO2dCQUNmLFNBQVMsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUMxQyxDQUFDO1lBQ0QsR0FBRyxDQUFDLENBQXVCLFVBQVMsRUFBVCx1QkFBUyxFQUFULHVCQUFTLEVBQVQsSUFBUztnQkFBL0IsSUFBTSxZQUFZLGtCQUFBO2dCQUNyQixFQUFFLENBQUMsQ0FBQyxZQUFZLENBQUMsUUFBUSxLQUFLLFFBQVEsSUFBSSxDQUFDLE9BQU0sQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsVUFBVSxLQUFLLFVBQVUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUMxSSxNQUFNLENBQUM7Z0JBQ1QsQ0FBQzthQUNGO1lBQ0QsU0FBUyxDQUFDLElBQUksQ0FBQztnQkFDYixRQUFRLEVBQUUsUUFBUTtnQkFDbEIsVUFBVSxFQUFFLFVBQVU7YUFDdkIsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDO1FBRUYsV0FBVyxDQUFDLFNBQVMsQ0FBQyxtQkFBbUIsR0FBRyxVQUE0QixJQUFZLEVBQUUsUUFBNEMsRUFBRSxVQUFvQztZQUFwQywyQkFBQSxFQUFBLGtCQUFvQztZQUN0SyxxQkFBbUIsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQzFELEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO2dCQUNyQixJQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUN6QyxFQUFFLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO29CQUNkLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO3dCQUMxQyxJQUFNLEtBQUssR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQzNCLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxRQUFRLEtBQUssUUFBUSxJQUFJLENBQUMsT0FBTSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxVQUFVLEtBQUssVUFBVSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7NEJBQ3JILFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDOzRCQUN2QixFQUFFLENBQUMsQ0FBQyxTQUFTLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0NBQzNCLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQzs0QkFDaEMsQ0FBQzs0QkFDRCxNQUFNLENBQUM7d0JBQ1QsQ0FBQztvQkFDSCxDQUFDO2dCQUNILENBQUM7WUFDSCxDQUFDO1FBQ0gsQ0FBQyxDQUFDO1FBRUYsaUJBQWlCO1FBQ2pCLEtBQUssQ0FBQyxTQUFTLENBQUMsSUFBSSxHQUFHLENBQUMsVUFBUyxJQUFJO1lBQ25DLE1BQU0sQ0FBQztnQkFBMkIsZUFBZTtxQkFBZixVQUFlLEVBQWYscUJBQWUsRUFBZixJQUFlO29CQUFmLDBCQUFlOztnQkFDL0MsSUFBSSxDQUFDO29CQUNILGNBQWMsR0FBRyxJQUFJLENBQUM7b0JBQ3RCLEVBQUUsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMscUJBQXlCLENBQUMsQ0FBQyxDQUFDO3dCQUNsRCxJQUFNLEdBQUcsR0FBNEIsbUJBQW1CLENBQUMsSUFBSSxDQUFDLENBQUM7d0JBQy9ELElBQU0sS0FBSyxHQUFHLGNBQWMsRUFBRSxDQUFDO3dCQUMvQixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQzs0QkFDdEMsY0FBYyxDQUFDLEdBQUcsRUFBRSxNQUFHLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7d0JBQ25ELENBQUM7b0JBQ0gsQ0FBQztvQkFDRCxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ2pDLENBQUM7d0JBQVMsQ0FBQztvQkFDVCxjQUFjLEdBQUcsS0FBSyxDQUFDO2dCQUN6QixDQUFDO1lBQ0gsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUV6QixLQUFLLENBQUMsU0FBUyxDQUFDLE9BQU8sR0FBRyxDQUFDLFVBQVMsT0FBTztZQUN6QyxNQUFNLENBQUM7Z0JBQTJCLGVBQWU7cUJBQWYsVUFBZSxFQUFmLHFCQUFlLEVBQWYsSUFBZTtvQkFBZiwwQkFBZTs7Z0JBQy9DLElBQUksQ0FBQztvQkFDSCxjQUFjLEdBQUcsSUFBSSxDQUFDO29CQUN0QixFQUFFLENBQUMsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLHFCQUF5QixDQUFDLENBQUMsQ0FBQzt3QkFDbEQsSUFBTSxHQUFHLEdBQTRCLG1CQUFtQixDQUFDLElBQUksQ0FBQyxDQUFDO3dCQUMvRCxJQUFNLFVBQVUsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDO3dCQUNoQyxJQUFNLEtBQUssR0FBRyxjQUFjLEVBQUUsQ0FBQzt3QkFDL0IsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDOzRCQUMzQyxXQUFXLENBQUMsR0FBRyxFQUFFLEtBQUcsQ0FBRyxFQUFFLE1BQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBRSxDQUFDLENBQUM7d0JBQ2hELENBQUM7d0JBQ0QsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7NEJBQ3RDLGFBQWEsQ0FBQyxHQUFHLEVBQUUsS0FBRyxDQUFHLENBQUMsQ0FBQzs0QkFDM0IsY0FBYyxDQUFDLEdBQUcsRUFBRSxLQUFHLENBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQzt3QkFDckMsQ0FBQztvQkFDSCxDQUFDO29CQUNELE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDcEMsQ0FBQzt3QkFBUyxDQUFDO29CQUNULGNBQWMsR0FBRyxLQUFLLENBQUM7Z0JBQ3pCLENBQUM7WUFDSCxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRTVCLEtBQUssQ0FBQyxTQUFTLENBQUMsR0FBRyxHQUFHLENBQUMsVUFBUyxHQUFHO1lBQ2pDLE1BQU0sQ0FBQztnQkFDTCxJQUFJLENBQUM7b0JBQ0gsY0FBYyxHQUFHLElBQUksQ0FBQztvQkFDdEIsRUFBRSxDQUFDLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxxQkFBeUIsQ0FBQyxDQUFDLENBQUM7d0JBQ2xELElBQU0sR0FBRyxHQUE0QixtQkFBbUIsQ0FBQyxJQUFJLENBQUMsQ0FBQzt3QkFDL0QsYUFBYSxDQUFDLEdBQUcsRUFBRSxNQUFHLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFFLENBQUMsQ0FBQztvQkFDM0MsQ0FBQztvQkFDRCxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDekIsQ0FBQzt3QkFBUyxDQUFDO29CQUNULGNBQWMsR0FBRyxLQUFLLENBQUM7Z0JBQ3pCLENBQUM7WUFDSCxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBRXhCLEtBQUssQ0FBQyxTQUFTLENBQUMsS0FBSyxHQUFHLENBQUMsVUFBUyxLQUFLO1lBQ3JDLE1BQU0sQ0FBQztnQkFDTCxJQUFJLENBQUM7b0JBQ0gsY0FBYyxHQUFHLElBQUksQ0FBQztvQkFDdEIsRUFBRSxDQUFDLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxxQkFBeUIsQ0FBQyxDQUFDLENBQUM7d0JBQ2xELElBQU0sR0FBRyxHQUE0QixtQkFBbUIsQ0FBQyxJQUFJLENBQUMsQ0FBQzt3QkFDL0QsYUFBYSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQzt3QkFDeEIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7NEJBQ3JDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsS0FBRyxDQUFHLEVBQUUsTUFBRyxDQUFDLEdBQUcsQ0FBQyxDQUFFLENBQUMsQ0FBQzt3QkFDdkMsQ0FBQzt3QkFDRCxhQUFhLENBQUMsR0FBRyxFQUFFLE1BQUcsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUUsQ0FBQyxDQUFDO29CQUMzQyxDQUFDO29CQUNELE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUMzQixDQUFDO3dCQUFTLENBQUM7b0JBQ1QsY0FBYyxHQUFHLEtBQUssQ0FBQztnQkFDekIsQ0FBQztZQUNILENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFMUIsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxVQUFTLE1BQU07WUFDdkMsTUFBTSxDQUFDLFVBQTJCLEtBQWEsRUFBRSxXQUFtQjtnQkFBRSxlQUFlO3FCQUFmLFVBQWUsRUFBZixxQkFBZSxFQUFmLElBQWU7b0JBQWYsOEJBQWU7O2dCQUNuRixJQUFJLENBQUM7b0JBQ0gsY0FBYyxHQUFHLElBQUksQ0FBQztvQkFDdEIsRUFBRSxDQUFDLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxxQkFBeUIsQ0FBQyxDQUFDLENBQUM7d0JBQ2xELElBQU0sR0FBRyxHQUE0QixtQkFBbUIsQ0FBQyxJQUFJLENBQUMsQ0FBQzt3QkFDL0QsSUFBSSxXQUFXLEdBQUcsS0FBSyxHQUFHLENBQUMsQ0FBQzt3QkFDNUIsRUFBRSxDQUFDLENBQUMsV0FBVyxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUM7NEJBQzlCLE1BQU0sQ0FBQyxFQUFFLENBQUM7d0JBQ1osQ0FBQzt3QkFDRCx5R0FBeUc7d0JBQ3pHLEVBQUUsQ0FBQyxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQzs0QkFDOUIsV0FBVyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7d0JBQzVCLENBQUM7d0JBQ0QsdUZBQXVGO3dCQUN2RixrRkFBa0Y7d0JBQ2xGLEVBQUUsQ0FBQyxDQUFDLFdBQVcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDOzRCQUNwQixXQUFXLEdBQUcsSUFBSSxDQUFDLE1BQU0sR0FBRyxXQUFXLENBQUM7NEJBQ3hDLEVBQUUsQ0FBQyxDQUFDLFdBQVcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dDQUNwQixXQUFXLEdBQUcsQ0FBQyxDQUFDOzRCQUNsQixDQUFDO3dCQUNILENBQUM7d0JBQ0QsSUFBSSxpQkFBaUIsR0FBRyxXQUFXLEdBQUcsQ0FBQyxDQUFDO3dCQUN4QyxrRkFBa0Y7d0JBQ2xGLHlHQUF5Rzt3QkFDekcsRUFBRSxDQUFDLENBQUMsV0FBVyxLQUFLLFNBQVMsSUFBSSxpQkFBaUIsR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLFdBQVcsQ0FBQyxDQUFDLENBQUM7NEJBQy9FLGlCQUFpQixHQUFHLElBQUksQ0FBQyxNQUFNLEdBQUcsV0FBVyxDQUFDO3dCQUNoRCxDQUFDO3dCQUNELEVBQUUsQ0FBQyxDQUFDLGlCQUFpQixHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7NEJBQzFCLGlCQUFpQixHQUFHLENBQUMsQ0FBQzt3QkFDeEIsQ0FBQzt3QkFFRCxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLGlCQUFpQixFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7NEJBQzNDLElBQU0sS0FBSyxHQUFHLFdBQVcsR0FBRyxDQUFDLENBQUM7NEJBQzlCLGFBQWEsQ0FBQyxHQUFHLEVBQUUsS0FBRyxLQUFPLENBQUMsQ0FBQzt3QkFDakMsQ0FBQzt3QkFFRCwyQ0FBMkM7d0JBQzNDLElBQU0sWUFBWSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUM7d0JBQ2xDLEVBQUUsQ0FBQyxDQUFDLFlBQVksR0FBRyxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7NEJBQ3JDLGlCQUFpQjs0QkFDakIsSUFBTSxLQUFLLEdBQUcsWUFBWSxHQUFHLGlCQUFpQixDQUFDOzRCQUMvQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksV0FBVyxHQUFHLGlCQUFpQixFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0NBQ3hFLFdBQVcsQ0FBQyxHQUFHLEVBQUUsS0FBRyxDQUFHLEVBQUUsTUFBRyxDQUFDLEdBQUcsS0FBSyxDQUFFLENBQUMsQ0FBQzs0QkFDM0MsQ0FBQzt3QkFDSCxDQUFDO3dCQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxZQUFZLEdBQUcsaUJBQWlCLENBQUMsQ0FBQyxDQUFDOzRCQUM1QyxtQkFBbUI7NEJBQ25CLElBQU0sS0FBSyxHQUFHLFlBQVksR0FBRyxpQkFBaUIsQ0FBQzs0QkFDL0MsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsV0FBVyxHQUFHLGlCQUFpQixFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0NBQ25FLFdBQVcsQ0FBQyxHQUFHLEVBQUUsS0FBRyxDQUFHLEVBQUUsTUFBRyxDQUFDLEdBQUcsS0FBSyxDQUFFLENBQUMsQ0FBQzs0QkFDM0MsQ0FBQzs0QkFDRCwyQ0FBMkM7NEJBQzNDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0NBQ3ZELGFBQWEsQ0FBQyxHQUFHLEVBQUUsS0FBRyxDQUFHLENBQUMsQ0FBQzs0QkFDN0IsQ0FBQzt3QkFDSCxDQUFDO3dCQUVELElBQU0sS0FBSyxHQUFHLGNBQWMsRUFBRSxDQUFDO3dCQUMvQixnQ0FBZ0M7d0JBQ2hDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsWUFBWSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7NEJBQ3RDLGFBQWEsQ0FBQyxHQUFHLEVBQUUsTUFBRyxXQUFXLEdBQUcsQ0FBQyxDQUFFLENBQUMsQ0FBQzs0QkFDekMsY0FBYyxDQUFDLEdBQUcsRUFBRSxNQUFHLFdBQVcsR0FBRyxDQUFDLENBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQzt3QkFDbkQsQ0FBQztvQkFDSCxDQUFDO29CQUNELE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDdkMsQ0FBQzt3QkFBUyxDQUFDO29CQUNULGNBQWMsR0FBRyxLQUFLLENBQUM7Z0JBQ3pCLENBQUM7WUFDSCxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBRTNCLDZCQUE2QjtRQUM3QixLQUFLLENBQUMsU0FBUyxDQUFDLE9BQU8sR0FBRyxVQUEyQixhQUFhLEVBQUUsWUFBcUI7WUFDdkYsSUFBSSxTQUFTLEdBQUcsWUFBWSxJQUFJLENBQUMsQ0FBQztZQUNsQyx5R0FBeUc7WUFDekcsa0RBQWtEO1lBQ2xELEVBQUUsQ0FBQyxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNsQixTQUFTLEdBQUcsSUFBSSxDQUFDLE1BQU0sR0FBRyxTQUFTLENBQUM7WUFDdEMsQ0FBQztZQUNELGlGQUFpRjtZQUNqRixFQUFFLENBQUMsQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDbEIsU0FBUyxHQUFHLENBQUMsQ0FBQztZQUNoQixDQUFDO1lBQ0QsMkhBQTJIO1lBQzNILEVBQUUsQ0FBQyxDQUFDLFNBQVMsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztnQkFDN0IsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ1osQ0FBQztZQUVELEdBQUcsQ0FBQyxDQUFDLEVBQUUsU0FBUyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLEVBQUUsQ0FBQztnQkFDNUMsRUFBRSxDQUFDLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQzlDLE1BQU0sQ0FBQyxTQUFTLENBQUM7Z0JBQ25CLENBQUM7WUFDSCxDQUFDO1lBQ0QsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ1osQ0FBQyxDQUFDO1FBRUYsS0FBSyxDQUFDLFNBQVMsQ0FBQyxXQUFXLEdBQUcsVUFBc0IsYUFBa0IsRUFBRSxTQUFhO1lBQWIsMEJBQUEsRUFBQSxhQUFhO1lBQ25GLEVBQUUsQ0FBQyxDQUFDLElBQUksS0FBSyxLQUFLLENBQUMsSUFBSSxJQUFJLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDckMsTUFBTSxJQUFJLFNBQVMsRUFBRSxDQUFDO1lBQ3hCLENBQUM7WUFFRCxJQUFJLENBQUMsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQ2xCLEdBQUcsR0FBRyxDQUFDLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQztZQUN2QixFQUFFLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDZCxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDWixDQUFDO1lBRUQsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQztZQUNoQixFQUFFLENBQUMsQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3pCLENBQUMsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3pCLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNYLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ1IsQ0FBQztnQkFBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNuRCxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2pELENBQUM7WUFDSCxDQUFDO1lBRUQsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQzVFLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQzdDLE1BQU0sQ0FBQyxDQUFDLENBQUM7Z0JBQ1gsQ0FBQztZQUNILENBQUM7WUFDRCxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDWixDQUFDLENBQUM7UUFFRiwyQkFBMkI7UUFFM0Isb0VBQW9FO1FBQ3BFLHFEQUFxRDtRQUNyRCxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUM7WUFDYixJQUFJLElBQUksR0FBRyxTQUFTLENBQUM7WUFDckIsTUFBTSxDQUFDO2dCQUNMLCtDQUErQztnQkFDL0MsSUFBSSxHQUFHLENBQUMsQ0FBQyxJQUFJLEdBQUcsVUFBVSxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDLENBQUMsR0FBSSxVQUFVLENBQUM7Z0JBQzFELElBQUksR0FBRyxDQUFDLENBQUMsSUFBSSxHQUFHLFVBQVUsQ0FBQyxHQUFHLENBQUMsSUFBSSxLQUFLLEVBQUUsQ0FBQyxDQUFDLEdBQUcsVUFBVSxDQUFDO2dCQUMxRCxJQUFJLEdBQUcsQ0FBQyxDQUFDLElBQUksR0FBRyxVQUFVLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFLLFVBQVUsQ0FBQztnQkFDMUQsSUFBSSxHQUFHLENBQUMsQ0FBQyxJQUFJLEdBQUcsVUFBVSxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBSyxVQUFVLENBQUM7Z0JBQzFELElBQUksR0FBRyxDQUFDLENBQUMsSUFBSSxHQUFHLFVBQVUsQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUssVUFBVSxDQUFDO2dCQUMxRCxJQUFJLEdBQUcsQ0FBQyxDQUFDLElBQUksR0FBRyxVQUFVLENBQUMsR0FBRyxDQUFDLElBQUksS0FBSyxFQUFFLENBQUMsQ0FBQyxHQUFHLFVBQVUsQ0FBQztnQkFDMUQsTUFBTSxDQUFDLENBQUMsSUFBSSxHQUFHLFNBQVMsQ0FBQyxHQUFHLFVBQVUsQ0FBQztZQUN6QyxDQUFDLENBQUM7UUFDSixDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBRUwsOERBQThEO1FBQzlELElBQUksY0FBWSxHQUFHLENBQUMsQ0FBQztRQUNyQixJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxHQUFHO1lBQ2xDLE1BQU0sQ0FBQyxhQUFhLEdBQUcsQ0FBQyxjQUFZLEVBQUUsQ0FBQyxDQUFDO1FBQzFDLENBQUMsQ0FBQztRQUVGLCtEQUErRDtRQUUvRDs7Ozs7O1dBTUc7UUFDSDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7V0FnQ0c7UUFFSDs7V0FFRztRQUNILDRCQUE0QixHQUFRLEVBQUUsUUFBZ0IsRUFBRSxHQUFXO1lBQ2pFLElBQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyx3QkFBd0IsQ0FBQyxHQUFHLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDaEUsRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztnQkFDM0IsTUFBTSxDQUFDO1lBQ1QsQ0FBQztZQUNELElBQUksQ0FBQztnQkFDSCxNQUFNLENBQUMsY0FBYyxDQUFDLEdBQUcsRUFBRSxRQUFRLEVBQUU7b0JBQ25DLEdBQUcsRUFBRTt3QkFDSCxJQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQzt3QkFDdEYsRUFBRSxDQUFDLENBQUMsT0FBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLFVBQVUsQ0FBQyxDQUFDLENBQUM7NEJBQ2pDLE1BQU0sQ0FBQztnQ0FBb0IsY0FBYztxQ0FBZCxVQUFjLEVBQWQscUJBQWMsRUFBZCxJQUFjO29DQUFkLHlCQUFjOztnQ0FDdkMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQzs0QkFDbEcsQ0FBQyxDQUFDO3dCQUNKLENBQUM7d0JBQUMsSUFBSSxDQUFDLENBQUM7NEJBQ04sTUFBTSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQzt3QkFDL0IsQ0FBQztvQkFDSCxDQUFDO29CQUNELEdBQUcsRUFBRSxVQUFTLENBQUM7d0JBQ2IsSUFBTSxTQUFTLEdBQUcsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUNuQyxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQzs0QkFDakIsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO3dCQUNwRCxDQUFDO3dCQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQzs0QkFDN0IsUUFBUSxDQUFDLEtBQUssR0FBRyxTQUFTLENBQUM7d0JBQzdCLENBQUM7d0JBQ0Qsa0JBQWtCO29CQUNwQixDQUFDO29CQUNELDhCQUE4QjtvQkFDOUIsWUFBWSxFQUFFLElBQUk7aUJBQ25CLENBQUMsQ0FBQztZQUNMLENBQUM7WUFBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNYLFlBQVksQ0FBQywwQkFBd0IsR0FBSyxDQUFDLENBQUM7WUFDOUMsQ0FBQztRQUNILENBQUM7UUFFRDs7Ozs7V0FLRztRQUNILDRDQUE0QyxHQUFXLEVBQUUsUUFBZ0I7WUFDdkUsSUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLHdCQUF3QixDQUFDLEdBQUcsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUM1RCxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUNULE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUNyQixPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDeEIsSUFBTSxLQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQztnQkFDckIsSUFBSSxDQUFDLEdBQUcsR0FBRyxVQUFvQixHQUFRO29CQUNyQyxLQUFHLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztvQkFDcEIsSUFBSSxDQUFDLE9BQUssUUFBVSxDQUFDLEdBQUcsR0FBRyxDQUFDO2dCQUM5QixDQUFDLENBQUM7Z0JBQ0YsTUFBTSxDQUFDLGNBQWMsQ0FBQyxHQUFHLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzdDLENBQUM7UUFDSCxDQUFDO1FBRUQsRUFBRSxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztZQUNkLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsU0FBUyxFQUFFLGNBQWMsQ0FBQyxTQUFTLEVBQUUsVUFBVSxDQUFDLFNBQVM7Z0JBQ3BGLGVBQWUsQ0FBQyxTQUFTLEVBQUUsV0FBVyxDQUFDLFNBQVMsRUFBRSxtQkFBbUIsQ0FBQyxTQUFTO2dCQUMvRSxnQkFBZ0IsQ0FBQyxTQUFTO2dCQUMxQixVQUFVLENBQUMsU0FBUyxFQUFFLGNBQWMsQ0FBQyxTQUFTO2dCQUM5QyxTQUFTLENBQUMsU0FBUyxFQUFFLFdBQVcsQ0FBQyxTQUFTLEVBQUUsZ0JBQWdCLENBQUMsU0FBUztnQkFDdEUsVUFBVSxDQUFDLFNBQVMsRUFBRSxjQUFjLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFDLEdBQUc7Z0JBQ2xFLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLFVBQUMsQ0FBQyxJQUFLLE9BQUEsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBbEIsQ0FBa0IsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFDLENBQUM7b0JBQzNELGtDQUFrQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDN0MsQ0FBQyxDQUFDLENBQUM7WUFDTCxDQUFDLENBQUMsQ0FBQztZQUVMLDRDQUE0QztZQUM1QyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUMsU0FBUyxFQUFFLGFBQWEsQ0FBQztnQkFDakcsQ0FBQyxRQUFRLENBQUMsU0FBUyxFQUFFLFVBQVUsQ0FBQyxFQUFFLENBQUMsaUJBQWlCLENBQUMsU0FBUyxFQUFFLG1CQUFtQixDQUFDO2dCQUNwRixDQUFDLFFBQVEsQ0FBQyxTQUFTLEVBQUUsVUFBVSxDQUFDLENBQUM7aUJBQzlCLE9BQU8sQ0FBQyxVQUFDLENBQUMsSUFBSyxPQUFBLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLFVBQUMsQ0FBQyxJQUFLLE9BQUEsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQUksQ0FBRyxDQUFDLEVBQTNDLENBQTJDLENBQUMsRUFBN0UsQ0FBNkUsQ0FBQyxDQUFDO1lBRWpHLG1EQUFtRDtZQUVuRCxJQUFNLGtCQUFrQixHQUFHO2dCQUN6QixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztvQkFDcEIsaUJBQWlCLENBQUMsSUFBSSxDQUFDLG1CQUFtQixFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsVUFBVSxFQUFFLGNBQWMsRUFBRSxDQUFDLENBQUM7Z0JBQ3ZGLENBQUM7WUFDSCxDQUFDLENBQUM7WUFDRixNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsb0JBQW9CLEVBQUU7Z0JBQzFELEtBQUssRUFBRSxrQkFBa0I7Z0JBQ3pCLFlBQVksRUFBRSxJQUFJO2FBQ25CLENBQUMsQ0FBQztZQUNILE1BQU0sQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRSxvQkFBb0IsRUFBRTtnQkFDOUQsS0FBSyxFQUFFLGtCQUFrQjtnQkFDekIsWUFBWSxFQUFFLElBQUk7YUFDbkIsQ0FBQyxDQUFDO1lBRUgsSUFBTSxhQUFXLEdBQUcsTUFBTSxDQUFDLHdCQUF3QixDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsYUFBYSxDQUFDLENBQUM7WUFDbkYsOEVBQThFO1lBQzlFLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxhQUFhLEVBQUU7Z0JBQ25ELEdBQUcsRUFBRSxhQUFXLENBQUMsR0FBRztnQkFDcEIsR0FBRyxFQUFFLFVBQXFCLENBQU07b0JBQzlCLElBQU0sRUFBRSxHQUFHLGFBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFDekMsSUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQztvQkFDM0IsRUFBRSxDQUFDLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyxxQkFBeUIsQ0FBQyxDQUFDLENBQUM7d0JBQ2hELElBQU0sTUFBTSxHQUFHLG1CQUFtQixDQUFDLEVBQUUsQ0FBQyxDQUFDO3dCQUN2QyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7d0JBQ2YsY0FBYyxDQUFDLEVBQUUsRUFBRSxNQUFNLEVBQUUsY0FBYyxFQUFFLENBQUMsQ0FBQztvQkFDL0MsQ0FBQztvQkFDRCxJQUFJLENBQUMsVUFBVSxDQUFDLGtCQUFrQixFQUFFLENBQUM7b0JBQ3JDLE1BQU0sQ0FBQyxFQUFFLENBQUM7Z0JBQ1osQ0FBQztnQkFDRCxVQUFVLEVBQUUsSUFBSTtnQkFDaEIsWUFBWSxFQUFFLElBQUk7YUFDbkIsQ0FBQyxDQUFDO1lBRUgsSUFBTSxhQUFXLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUM7WUFDL0MsSUFBSSxDQUFDLFNBQVMsQ0FBQyxXQUFXLEdBQUcsVUFBcUMsUUFBVztnQkFDM0U7Ozs7bUJBSUc7Z0JBQ0gsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLFVBQVUsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDO29CQUNqQyxRQUFRLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDNUMsQ0FBQztnQkFFRCxJQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDO2dCQUMzQixFQUFFLENBQUMsQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLHFCQUF5QixDQUFDLENBQUMsQ0FBQztvQkFDaEQsSUFBTSxNQUFNLEdBQUcsbUJBQW1CLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQ3ZDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsS0FBRyxFQUFFLENBQUMsTUFBUSxDQUFDLENBQUM7Z0JBQ3pDLENBQUM7Z0JBRUQsSUFBTSxFQUFFLEdBQUcsYUFBVyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7Z0JBQzVDLEVBQUUsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO2dCQUN4QixNQUFNLENBQUMsRUFBRSxDQUFDO1lBQ1osQ0FBQyxDQUFDO1lBRUYsSUFBTSxjQUFZLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUM7WUFDakQsMkNBQTJDO1lBQzNDLElBQUksQ0FBQyxTQUFTLENBQUMsWUFBWSxHQUFHLFVBQXlCLFFBQVcsRUFBRSxRQUFjO2dCQUNoRjs7Ozs7Ozs7O21CQVNHO2dCQUNILElBQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUM7Z0JBQzNCLEVBQUUsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUMscUJBQXlCLENBQUMsQ0FBQyxDQUFDO29CQUNoRCxFQUFFLENBQUMsQ0FBQyxRQUFRLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQzt3QkFDdEIsZ0RBQWdEO3dCQUNoRCxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztvQkFDcEMsQ0FBQztvQkFBQyxJQUFJLENBQUMsQ0FBQzt3QkFDTixJQUFNLE1BQU0sR0FBRyxtQkFBbUIsQ0FBQyxFQUFFLENBQUMsQ0FBQzt3QkFDdkMsSUFBTSxHQUFHLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQzt3QkFDdEIsSUFBSSxRQUFRLEdBQUcsQ0FBQyxDQUFDLENBQUM7d0JBQ2xCLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7NEJBQzdCLEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dDQUMvQixRQUFRLEdBQUcsQ0FBQyxDQUFDO2dDQUNiLEtBQUssQ0FBQzs0QkFDUixDQUFDO3dCQUNILENBQUM7d0JBQ0QsRUFBRSxDQUFDLENBQUMsUUFBUSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs0QkFDcEIsWUFBWSxDQUFDLHdDQUF3QyxDQUFDLENBQUM7d0JBQ3pELENBQUM7d0JBQUMsSUFBSSxDQUFDLENBQUM7NEJBQ04sR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksUUFBUSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0NBQ3pDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsS0FBRyxDQUFHLEVBQUUsTUFBRyxDQUFDLEdBQUcsQ0FBQyxDQUFFLENBQUMsQ0FBQzs0QkFDMUMsQ0FBQzs0QkFDRCxhQUFhLENBQUMsTUFBTSxFQUFFLEtBQUcsUUFBVSxDQUFDLENBQUM7NEJBQ3JDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsS0FBRyxRQUFVLENBQUMsQ0FBQzt3QkFDeEMsQ0FBQztvQkFDSCxDQUFDO2dCQUNILENBQUM7Z0JBQ0QsSUFBTSxFQUFFLEdBQUcsY0FBWSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUN2RCxFQUFFLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztnQkFDeEIsTUFBTSxDQUFDLEVBQUUsQ0FBQztZQUNaLENBQUMsQ0FBQztZQUVGLElBQU0sV0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDO1lBQzNDLDJCQUEyQixDQUFPO2dCQUNoQyxJQUFNLFFBQVEsR0FBRyxDQUFDLENBQUMsVUFBVSxDQUFDO2dCQUM5QixJQUFNLEdBQUcsR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDO2dCQUM1QixJQUFNLE1BQU0sR0FBRyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQ2pELElBQUksWUFBWSxHQUFTLElBQUksQ0FBQztnQkFDOUIsSUFBSSxhQUFhLEdBQVcsQ0FBQyxDQUFDLENBQUM7Z0JBQy9CLElBQUksUUFBUSxHQUFhLEVBQUUsQ0FBQztnQkFDNUIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztvQkFDN0IsSUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUMxQixFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsUUFBUSxLQUFLLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO3dCQUN0QyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsV0FBVyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7NEJBQzdCLDJCQUEyQjs0QkFDM0IsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFDbkIsQ0FBQzt3QkFBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQzs0QkFDeEIsNkJBQTZCOzRCQUM3QixZQUFZLENBQUMsV0FBVyxJQUFJLEtBQUssQ0FBQyxXQUFXLENBQUM7NEJBQzlDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7Z0NBQ1gsY0FBYyxDQUFDLE1BQU0sRUFBRSxLQUFHLGFBQWUsRUFBRSxLQUFHLENBQUcsQ0FBQyxDQUFDOzRCQUNyRCxDQUFDOzRCQUNELFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQ25CLENBQUM7d0JBQUMsSUFBSSxDQUFDLENBQUM7NEJBQ04sWUFBWSxHQUFHLEtBQUssQ0FBQzs0QkFDckIsYUFBYSxHQUFHLENBQUMsQ0FBQzt3QkFDcEIsQ0FBQztvQkFDSCxDQUFDO29CQUFDLElBQUksQ0FBQyxDQUFDO3dCQUNOLFlBQVksR0FBRyxJQUFJLENBQUM7d0JBQ3BCLGFBQWEsR0FBRyxDQUFDLENBQUMsQ0FBQztvQkFDckIsQ0FBQztnQkFDSCxDQUFDO2dCQUNELElBQU0sU0FBUyxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUM7Z0JBQ2xDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLFNBQVMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO29CQUN4QyxDQUFDLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN2QyxDQUFDO2dCQUNELElBQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUM7Z0JBQzdCLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQzlCLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNqQyxDQUFDO1lBQ0gsQ0FBQztZQUNELElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxHQUFHO2dCQUN6Qjs7OzttQkFJRztnQkFDSCxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztvQkFDcEIsaUJBQWlCLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ3hCLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO2dCQUM1QixDQUFDO2dCQUFDLElBQUksQ0FBQyxDQUFDO29CQUNOLE1BQU0sQ0FBQyxXQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUM5QixDQUFDO1lBQ0gsQ0FBQyxDQUFDO1lBRUYsSUFBTSxhQUFXLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUM7WUFDL0MsSUFBSSxDQUFDLFNBQVMsQ0FBQyxXQUFXLEdBQUcsVUFBcUMsS0FBUTtnQkFDeEUsSUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQztnQkFDM0IsRUFBRSxDQUFDLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyxxQkFBeUIsQ0FBQyxDQUFDLENBQUM7b0JBQ2hELElBQU0sTUFBTSxHQUFHLG1CQUFtQixDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUN2QyxJQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDO29CQUNqQyxJQUFNLEdBQUcsR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDO29CQUM1QixJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQ1YsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7d0JBQ3BCLEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDOzRCQUNsQyxLQUFLLENBQUM7d0JBQ1IsQ0FBQztvQkFDSCxDQUFDO29CQUNELEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDO3dCQUNkLFlBQVksQ0FBQyw4QkFBOEIsQ0FBQyxDQUFBO29CQUM5QyxDQUFDO29CQUFDLElBQUksQ0FBQyxDQUFDO3dCQUNOLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDOzRCQUNqQyxXQUFXLENBQUMsTUFBTSxFQUFFLEtBQUcsQ0FBRyxFQUFFLE1BQUcsQ0FBQyxHQUFHLENBQUMsQ0FBRSxDQUFDLENBQUM7d0JBQzFDLENBQUM7d0JBQ0QsYUFBYSxDQUFDLE1BQU0sRUFBRSxNQUFHLEdBQUcsR0FBRyxDQUFDLENBQUUsQ0FBQyxDQUFDO29CQUN0QyxDQUFDO2dCQUNILENBQUM7Z0JBQ0QsSUFBTSxFQUFFLEdBQUcsYUFBVyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ3pDLEVBQUUsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO2dCQUN4QixNQUFNLENBQUMsRUFBRSxDQUFDO1lBQ1osQ0FBQyxDQUFBO1lBRUQsa0NBQWtDO1lBQ2xDLElBQU0sY0FBWSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDO1lBQ2pELElBQUksQ0FBQyxTQUFTLENBQUMsWUFBWSxHQUFHLFVBQXFDLFFBQWMsRUFBRSxRQUFXO2dCQUM1RixJQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDO2dCQUMzQixFQUFFLENBQUMsQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLHFCQUF5QixDQUFDLENBQUMsQ0FBQztvQkFDaEQsSUFBTSxNQUFNLEdBQUcsbUJBQW1CLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQ3ZDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDVixJQUFNLEdBQUcsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDO29CQUN0QixHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQzt3QkFDcEIsRUFBRSxDQUFDLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7NEJBQy9CLEtBQUssQ0FBQzt3QkFDUixDQUFDO29CQUNILENBQUM7b0JBQ0QsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUM7d0JBQ2QsWUFBWSxDQUFDLHdDQUF3QyxDQUFDLENBQUM7b0JBQ3pELENBQUM7b0JBQUMsSUFBSSxDQUFDLENBQUM7d0JBQ04sY0FBYyxDQUFDLE1BQU0sRUFBRSxLQUFHLENBQUcsQ0FBQyxDQUFDO29CQUNqQyxDQUFDO2dCQUNILENBQUM7Z0JBQ0QsSUFBTSxFQUFFLEdBQUcsY0FBWSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUN2RCxFQUFFLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztnQkFDeEIsTUFBTSxDQUFDLEVBQUUsQ0FBQztZQUNaLENBQUMsQ0FBQTtZQUVELElBQU0sV0FBUyxHQUFHLE1BQU0sQ0FBQyx3QkFBd0IsQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQ2xGLE1BQU0sQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxXQUFXLEVBQUU7Z0JBQ3BELEdBQUcsRUFBRSxXQUFTLENBQUMsR0FBRztnQkFDbEIsR0FBRyxFQUFFLFVBQXdCLENBQVM7b0JBQ3BDLElBQU0sRUFBRSxHQUFHLFdBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFDdkMsSUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQztvQkFDM0IsRUFBRSxDQUFDLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyxxQkFBeUIsQ0FBQyxDQUFDLENBQUM7d0JBQ2hELElBQU0sTUFBTSxHQUFHLG1CQUFtQixDQUFDLEVBQUUsQ0FBQyxDQUFDO3dCQUN2QyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7d0JBQ2YsY0FBYyxDQUFDLEVBQUUsRUFBRSxNQUFNLEVBQUUsY0FBYyxFQUFFLENBQUMsQ0FBQztvQkFDL0MsQ0FBQztvQkFDRCxFQUFFLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztvQkFDeEIsTUFBTSxDQUFDLEVBQUUsQ0FBQztnQkFDWixDQUFDO2dCQUNELFlBQVksRUFBRSxJQUFJO2dCQUNsQixVQUFVLEVBQUUsSUFBSTthQUNqQixDQUFDLENBQUM7WUFFSCxJQUFNLFdBQVMsR0FBRyxNQUFNLENBQUMsd0JBQXdCLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUNsRixNQUFNLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsV0FBVyxFQUFFO2dCQUNwRCxHQUFHLEVBQUUsV0FBUyxDQUFDLEdBQUc7Z0JBQ2xCLEdBQUcsRUFBRSxVQUF3QixDQUFTO29CQUNwQyxJQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDO29CQUMvQixFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO3dCQUNYLElBQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUM7d0JBQ25DLEVBQUUsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMscUJBQXlCLENBQUMsQ0FBQyxDQUFDOzRCQUN0RCxJQUFNLEdBQUcsR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDOzRCQUM1QixJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7NEJBQ1YsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0NBQ3BCLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDO29DQUN6QixLQUFLLENBQUM7Z0NBQ1IsQ0FBQzs0QkFDSCxDQUFDOzRCQUNELEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDO2dDQUNkLFlBQVksQ0FBQywyQ0FBMkMsQ0FBQyxDQUFDOzRCQUM1RCxDQUFDOzRCQUFDLElBQUksQ0FBQyxDQUFDO2dDQUNOLElBQU0sTUFBTSxHQUFHLG1CQUFtQixDQUFDLFFBQVEsQ0FBQyxDQUFDO2dDQUM3QyxhQUFhLENBQUMsTUFBTSxFQUFFLEtBQUcsQ0FBRyxDQUFDLENBQUM7Z0NBQzlCLGNBQWMsQ0FBQyxNQUFNLEVBQUUsS0FBRyxDQUFHLENBQUMsQ0FBQzs0QkFDakMsQ0FBQzt3QkFDSCxDQUFDO29CQUNILENBQUM7b0JBQ0QsSUFBTSxFQUFFLEdBQUcsV0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUN2QyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO3dCQUNYLE1BQU0sQ0FBQyxVQUFVLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztvQkFDekMsQ0FBQztvQkFDRCxNQUFNLENBQUMsRUFBRSxDQUFDO2dCQUNaLENBQUM7Z0JBQ0QsWUFBWSxFQUFFLElBQUk7Z0JBQ2xCLFVBQVUsRUFBRSxJQUFJO2FBQ2pCLENBQUMsQ0FBQztZQUVILDhCQUE4QixDQUFVLEVBQUUsUUFBd0I7Z0JBQ2hFLE1BQU0sQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7b0JBQ2pCLEtBQUssYUFBYSxDQUFDO29CQUNuQixLQUFLLFVBQVUsRUFBRSxDQUFDO3dCQUNoQixFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxJQUFJLGNBQWMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxxQkFBeUIsQ0FBQyxDQUFDLENBQUM7NEJBQ3JGLElBQU0sUUFBTSxHQUFHLENBQUMsQ0FBQyxVQUFVLENBQUM7NEJBQzVCLElBQU0sUUFBUSxHQUFHLFFBQU0sQ0FBQyxVQUFVLENBQUM7NEJBQ25DLElBQU0sV0FBVyxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUM7NEJBQ3BDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQzs0QkFDVixHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxXQUFXLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQ0FDNUIsRUFBRSxDQUFDLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7b0NBQzlCLEtBQUssQ0FBQztnQ0FDUixDQUFDOzRCQUNILENBQUM7NEJBQ0QsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLFdBQVcsQ0FBQyxDQUFDLENBQUM7Z0NBQ3RCLDBEQUEwRDtnQ0FDMUQsSUFBSSxLQUFLLEdBQUcsUUFBUSxLQUFLLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dDQUNuRCxJQUFNLE1BQU0sR0FBRyxtQkFBbUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQ0FDN0MsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLFdBQVcsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEtBQUssRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO29DQUMxQyxXQUFXLENBQUMsTUFBTSxFQUFFLEtBQUcsQ0FBRyxFQUFFLE1BQUcsQ0FBQyxHQUFHLENBQUMsQ0FBRSxDQUFDLENBQUE7Z0NBQ3pDLENBQUM7Z0NBQ0QsYUFBYSxDQUFDLE1BQU0sRUFBRSxLQUFHLEtBQU8sQ0FBQyxDQUFDO2dDQUNsQyxjQUFjLENBQUMsTUFBTSxFQUFFLEtBQUcsS0FBTyxDQUFDLENBQUM7NEJBQ3JDLENBQUM7d0JBQ0gsQ0FBQzt3QkFDRCxLQUFLLENBQUM7b0JBQ1IsQ0FBQztvQkFDRCxLQUFLLFlBQVksQ0FBQztvQkFDbEIsS0FBSyxXQUFXLEVBQUUsQ0FBQzt3QkFDakIsSUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDLFVBQVUsQ0FBQzt3QkFDeEIsRUFBRSxDQUFDLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyxxQkFBeUIsQ0FBQyxDQUFDLENBQUM7NEJBQ2hELElBQU0sV0FBVyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUM7NEJBQzlCLElBQU0sTUFBTSxHQUFHLG1CQUFtQixDQUFDLEVBQUUsQ0FBQyxDQUFDOzRCQUN2QyxFQUFFLENBQUMsQ0FBQyxRQUFRLEtBQUssWUFBWSxDQUFDLENBQUMsQ0FBQztnQ0FDOUIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsV0FBVyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7b0NBQzFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsS0FBRyxDQUFHLEVBQUUsTUFBRyxDQUFDLEdBQUcsQ0FBQyxDQUFFLENBQUMsQ0FBQztnQ0FDMUMsQ0FBQztnQ0FDRCxhQUFhLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDO2dDQUMzQixjQUFjLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDOzRCQUM5QixDQUFDOzRCQUFDLElBQUksQ0FBQyxDQUFDO2dDQUNOLGNBQWMsQ0FBQyxNQUFNLEVBQUUsS0FBRyxXQUFhLENBQUMsQ0FBQzs0QkFDM0MsQ0FBQzt3QkFDSCxDQUFDO3dCQUNELEtBQUssQ0FBQztvQkFDUixDQUFDO2dCQUNILENBQUM7WUFDSCxDQUFDO1lBRUQsSUFBTSx1QkFBcUIsR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLHFCQUFxQixDQUFDO1lBQ3RFLE9BQU8sQ0FBQyxTQUFTLENBQUMscUJBQXFCLEdBQUcsVUFBUyxRQUF3QixFQUFFLGVBQXdCO2dCQUNuRzs7O21CQUdHO2dCQUNILG9CQUFvQixDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztnQkFFckMsSUFBTSxFQUFFLEdBQUcsdUJBQXFCLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxRQUFRLEVBQUUsZUFBZSxDQUFDLENBQUM7Z0JBQ3ZFLEVBQUUsQ0FBQyxDQUFDLFFBQVEsS0FBSyxZQUFZLElBQUksUUFBUSxLQUFLLFdBQVcsQ0FBQyxDQUFDLENBQUM7b0JBQzFELElBQUksQ0FBQyxVQUFVLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztnQkFDdkMsQ0FBQztnQkFBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7b0JBQzNCLElBQUksQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLGtCQUFrQixFQUFFLENBQUM7Z0JBQ2xELENBQUM7Z0JBQ0QsTUFBTSxDQUFDLEVBQUUsQ0FBQztZQUNaLENBQUMsQ0FBQztZQUVGLElBQU0sb0JBQWtCLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxrQkFBa0IsQ0FBQztZQUNoRSxPQUFPLENBQUMsU0FBUyxDQUFDLGtCQUFrQixHQUFHLFVBQXdCLEtBQXFCLEVBQUUsSUFBWTtnQkFDaEcsb0JBQW9CLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUNsQyxJQUFNLEVBQUUsR0FBRyxvQkFBa0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDdEQsRUFBRSxDQUFDLENBQUMsS0FBSyxLQUFLLFlBQVksSUFBSSxLQUFLLEtBQUssV0FBVyxDQUFDLENBQUMsQ0FBQztvQkFDcEQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO2dCQUN2QyxDQUFDO2dCQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztvQkFDM0IsSUFBSSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztnQkFDbEQsQ0FBQztnQkFDRCxNQUFNLENBQUMsRUFBRSxDQUFDO1lBQ1osQ0FBQyxDQUFDO1lBRUYsSUFBTSxvQkFBa0IsR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLGtCQUFrQixDQUFDO1lBQ2hFLE9BQU8sQ0FBQyxTQUFTLENBQUMsa0JBQWtCLEdBQUcsVUFBd0IsS0FBcUIsRUFBRSxJQUFZO2dCQUNoRyxvQkFBb0IsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ2xDLElBQU0sRUFBRSxHQUFHLG9CQUFrQixDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUN0RCxFQUFFLENBQUMsQ0FBQyxLQUFLLEtBQUssWUFBWSxJQUFJLEtBQUssS0FBSyxXQUFXLENBQUMsQ0FBQyxDQUFDO29CQUNwRCxJQUFJLENBQUMsVUFBVSxDQUFDLGtCQUFrQixFQUFFLENBQUM7Z0JBQ3ZDLENBQUM7Z0JBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO29CQUMzQixJQUFJLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO2dCQUNsRCxDQUFDO2dCQUNELE1BQU0sQ0FBQyxFQUFFLENBQUM7WUFDWixDQUFDLENBQUE7WUFFRCxJQUFNLFFBQU0sR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQztZQUN4QyxPQUFPLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBRztnQkFDekIsSUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQztnQkFDL0IsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztvQkFDWCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUMzQixDQUFDO2dCQUFDLElBQUksQ0FBQyxDQUFDO29CQUNOLFFBQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3BCLENBQUM7WUFDSCxDQUFDLENBQUM7WUFDRixXQUFXO1lBQ1gsOEVBQThFO1lBQzlFLDhCQUE4QjtZQUU5QixjQUFjO1lBQ2QsbUNBQW1DO1FBQ3JDLENBQUM7UUFJRDs7Ozs7OztZQU9JO1FBRUosUUFBUTtRQUNSLGtHQUFrRztRQUNsRywyQkFBMkI7UUFDM0Isa0RBQWtEO1FBRWxELGlCQUFpQjtRQUNqQix5QkFBeUI7UUFDekIsK0JBQStCO1FBQy9CLDBCQUEwQjtRQUMxQiw4QkFBOEI7UUFDOUIscUJBQXFCO1FBQ3JCLHVCQUF1QjtRQUV2QixjQUFjO1FBQ2QsK0JBQStCO1FBQy9CLGlDQUFpQztRQUVqQyxRQUFRO1FBQ1IsNEJBQTRCO1FBQzVCLG1EQUFtRDtRQUNuRCw0Q0FBNEM7UUFDNUMsMkNBQTJDO1FBQzNDLDZCQUE2QjtRQUM3Qiw0QkFBNEI7UUFDNUIsc0NBQXNDO1FBQ3RDLGdDQUFnQztRQUNoQyxrQ0FBa0M7UUFFbEMsV0FBVztRQUNYLFlBQVk7UUFDWixZQUFZO1FBQ1osd0JBQXdCO1FBQ3hCLHFCQUFxQjtRQUNyQixxQkFBcUI7UUFDckIsU0FBUztRQUNULDhFQUE4RTtRQUM5RSw4QkFBOEI7UUFFOUIsY0FBYztRQUNkLG1DQUFtQztRQUVuQyxpQkFBaUI7UUFDakIsdUJBQXVCO1FBQ3ZCLHNCQUFzQjtRQUN0Qiw2QkFBNkI7UUFDN0IseUJBQXlCO1FBQ3pCLG9CQUFvQjtRQUNwQixnQkFBZ0I7UUFDaEIsd0JBQXdCO1FBQ3hCLDRFQUE0RTtRQUM1RSxxQkFBcUI7UUFDckIsZ0JBQWdCO1FBQ2hCLHdCQUF3QjtRQUN4QixlQUFlO1FBQ2YsaUJBQWlCO1FBQ2pCLFlBQVk7UUFDWixtQkFBbUI7UUFDbkIsOEJBQThCO1FBQzlCLGNBQWM7UUFDZCxnQkFBZ0I7UUFDaEIscUJBQXFCO1FBQ3JCLGVBQWU7UUFDZixtQkFBbUI7UUFDbkIsZ0NBQWdDO0lBR2xDLENBQUM7QUFDSCxDQUFDLENBQUMsRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiXCJubyB0cmFuc2Zvcm1cIjtcblxuaW50ZXJmYWNlIE9iamVjdCB7XG4gICQkJFBST1hZJCQkPzogYW55O1xufVxuXG5pbnRlcmZhY2UgU2NvcGUge1xuICBbaWRlbnQ6IHN0cmluZ106IGFueTtcbn1cblxuaW50ZXJmYWNlIEZ1bmN0aW9uIHtcbiAgX19zY29wZV9fOiBTY29wZTtcbn1cblxuaW50ZXJmYWNlIE1pcnJvck5vZGUge1xuICByb290OiBOb2RlO1xuICBjaGlsZE5vZGVzOiBDaGlsZE5vZGVzO1xufVxuXG5pbnRlcmZhY2UgQ2hpbGROb2RlcyB7XG4gIFtwOiBzdHJpbmddOiBNaXJyb3JOb2RlIHwgbnVtYmVyO1xuICBsZW5ndGg6IG51bWJlcjtcbn1cblxuaW50ZXJmYWNlIFdpbmRvdyB7XG4gICQkJElOU1RSVU1FTlRfUEFUSFMkJCQocDogSVBhdGhUcmVlcyk6IHZvaWQ7XG4gICQkJEdFVF9TVEFDS19UUkFDRVMkJCQoKTogR3Jvd2luZ1N0YWNrVHJhY2VzO1xuICAkJCRDUkVBVEVfU0NPUEVfT0JKRUNUJCQkKHBhcmVudFNjb3BlT2JqZWN0OiBTY29wZSwgbW92ZWRWYXJpYWJsZXM6IHN0cmluZ1tdLCB1bm1vdmVkVmFyaWFibGVzOiBQcm9wZXJ0eURlc2NyaXB0b3JNYXAsIGFyZ3M6IHN0cmluZ1tdLCBhcmdWYWx1ZXM6IGFueVtdKTogU2NvcGU7XG4gICQkJFNFUSQkJChhOiBhbnksIGI6IGFueSk6IGJvb2xlYW47XG4gICQkJEVRJCQkKGE6IGFueSwgYjogYW55KTogYm9vbGVhbjtcbiAgJCQkU0hPVUxERklYJCQkKG46IG51bWJlcik6IGJvb2xlYW47XG4gICQkJEdMT0JBTCQkJDogV2luZG93O1xuICAkJCRSRVdSSVRFX0VWQUwkJCQoc2NvcGU6IGFueSwgc291cmNlOiBzdHJpbmcpOiBhbnk7XG4gICQkJEZVTkNUSU9OX0VYUFJFU1NJT04kJCQoZmNuOiBGdW5jdGlvbiwgc2NvcGU6IFNjb3BlKTogRnVuY3Rpb247XG4gICQkJE9CSkVDVF9FWFBSRVNTSU9OJCQkKG9iajogb2JqZWN0LCBzY29wZTogU2NvcGUpOiBvYmplY3Q7XG4gICQkJENSRUFURV9XSVRIX1NDT1BFJCQkKHdpdGhPYmo6IE9iamVjdCwgc2NvcGU6IFNjb3BlKTogU2NvcGU7XG4gICQkJFNFUklBTElaRV9ET00kJCQoKTogdm9pZDtcbiAgJCQkRE9NJCQkOiBNaXJyb3JOb2RlO1xufVxuXG5pbnRlcmZhY2UgTGlzdGVuZXJJbmZvIHtcbiAgdXNlQ2FwdHVyZTogYm9vbGVhbiB8IG9iamVjdDtcbiAgbGlzdGVuZXI6IEV2ZW50TGlzdGVuZXJPckV2ZW50TGlzdGVuZXJPYmplY3Q7XG59XG5cbmludGVyZmFjZSBFdmVudFRhcmdldCB7XG4gICQkbGlzdGVuZXJzPzoge1t0eXBlOiBzdHJpbmddOiBMaXN0ZW5lckluZm9bXX07XG4gIC8vIE5vdGU6IE5lZWRzIHRvIGJlIGEgc3RyaW5nIHNvIGl0IHNob3dzIHVwIGluIHRoZSBzbmFwc2hvdC5cbiAgJCRpZD86IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIE5vZGVMaXN0IHtcbiAgJCQkVFJFRSQkJDogSVBhdGhUcmVlO1xuICAkJCRBQ0NFU1NfU1RSSU5HJCQkOiBzdHJpbmc7XG4gICQkJFNUQUNLVFJBQ0VTJCQkOiBHcm93dGhPYmplY3RTdGFja1RyYWNlcztcbiAgJCQkUkVJTlNUUlVNRU5UJCQkKCk6IHZvaWQ7XG59XG5cbmludGVyZmFjZSBOb2RlIHtcbiAgJCQkVFJFRSQkJDogSVBhdGhUcmVlO1xuICAkJCRBQ0NFU1NfU1RSSU5HJCQkOiBzdHJpbmc7XG4gICQkJFNUQUNLVFJBQ0VTJCQkOiBHcm93dGhPYmplY3RTdGFja1RyYWNlcztcbiAgJCQkUkVJTlNUUlVNRU5UJCQkKCk6IHZvaWQ7XG59XG5cbnR5cGUgR3Jvd3RoT2JqZWN0U3RhY2tUcmFjZXMgPSBNYXA8c3RyaW5nIHwgbnVtYmVyIHwgc3ltYm9sLCBTZXQ8c3RyaW5nPj47XG5cbmRlY2xhcmUgZnVuY3Rpb24gaW1wb3J0U2NyaXB0cyhzOiBzdHJpbmcpOiB2b2lkO1xuXG4vKipcbiAqIEFnZW50IGluamVjdGVkIGludG8gdGhlIHdlYnBhZ2UgdG8gc3VyZmFjZSBicm93c2VyLWhpZGRlbiBsZWFrcyBhdCB0aGUgSlMgbGV2ZWwuXG4gKi9cbihmdW5jdGlvbigpIHtcbiAgLy8gR2xvYmFsIHZhcmlhYmxlcy5cbiAgY29uc3QgSVNfV0lORE9XID0gdHlwZW9mKHdpbmRvdykgIT09IFwidW5kZWZpbmVkXCI7XG4gIGNvbnN0IElTX1dPUktFUiA9IHR5cGVvZihpbXBvcnRTY3JpcHRzKSAhPT0gXCJ1bmRlZmluZWRcIjtcbiAgY29uc3QgUk9PVCA9IDxXaW5kb3c+IChJU19XSU5ET1cgPyB3aW5kb3cgOiBJU19XT1JLRVIgPyBzZWxmIDogZ2xvYmFsKTtcbiAgLy8gQXZvaWQgaW5zdGFsbGluZyBzZWxmIHR3aWNlLlxuICBpZiAoUk9PVC4kJCRJTlNUUlVNRU5UX1BBVEhTJCQkKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIFJPT1QuJCQkSU5TVFJVTUVOVF9QQVRIUyQkJCA9ICQkJElOU1RSVU1FTlRfUEFUSFMkJCQ7XG4gIFJPT1QuJCQkR0VUX1NUQUNLX1RSQUNFUyQkJCA9ICQkJEdFVF9TVEFDS19UUkFDRVMkJCQ7XG4gIFJPT1QuJCQkQ1JFQVRFX1NDT1BFX09CSkVDVCQkJCA9ICQkJENSRUFURV9TQ09QRV9PQkpFQ1QkJCQ7XG4gIFJPT1QuJCQkRVEkJCQgPSAkJCRFUSQkJDtcbiAgUk9PVC4kJCRTRVEkJCQgPSAkJCRTRVEkJCQ7XG4gIFJPT1QuJCQkU0hPVUxERklYJCQkID0gJCQkU0hPVUxERklYJCQkO1xuICBST09ULiQkJEdMT0JBTCQkJCA9IFJPT1Q7XG4gIFJPT1QuJCQkUkVXUklURV9FVkFMJCQkID0gJCQkUkVXUklURV9FVkFMJCQkO1xuICBST09ULiQkJEZVTkNUSU9OX0VYUFJFU1NJT04kJCQgPSAkJCRGVU5DVElPTl9FWFBSRVNTSU9OJCQkO1xuICBST09ULiQkJE9CSkVDVF9FWFBSRVNTSU9OJCQkID0gJCQkT0JKRUNUX0VYUFJFU1NJT04kJCQ7XG4gIFJPT1QuJCQkQ1JFQVRFX1dJVEhfU0NPUEUkJCQgPSAkJCRDUkVBVEVfV0lUSF9TQ09QRSQkJDtcbiAgUk9PVC4kJCRTRVJJQUxJWkVfRE9NJCQkID0gJCQkU0VSSUFMSVpFX0RPTSQkJDtcblxuICBjb25zdCByID0gLycvZztcbiAgLy8gU29tZSB3ZWJzaXRlcyBvdmVyd3JpdGUgbG9nVG9Db25zb2xlLlxuICBjb25zdCBjb25zb2xlID0gUk9PVC5jb25zb2xlID8gUk9PVC5jb25zb2xlIDogeyBsb2c6IChzdHI6IHN0cmluZykgPT4ge30gfTtcbiAgY29uc3QgY29uc29sZUxvZyA9IGNvbnNvbGUubG9nO1xuICBmdW5jdGlvbiBsb2dUb0NvbnNvbGUoczogc3RyaW5nKSB7XG4gICAgY29uc29sZUxvZy5jYWxsKGNvbnNvbGUsIHMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIHN0YWNrIHRyYWNlLlxuICAgKi9cbiAgZnVuY3Rpb24gX2dldFN0YWNrVHJhY2UoKTogc3RyaW5nIHtcbiAgICB0cnkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgcmV0dXJuIGUuc3RhY2s7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEVzY2FwZXMgc2luZ2xlIHF1b3RlcyBpbiB0aGUgZ2l2ZW4gc3RyaW5nLlxuICAgKiBAcGFyYW0gc1xuICAgKi9cbiAgZnVuY3Rpb24gc2FmZVN0cmluZyhzOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiBzLnJlcGxhY2UociwgXCJcXFxcJ1wiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgc2NvcGUgb2JqZWN0LlxuICAgKiBAcGFyYW0gcGFyZW50U2NvcGVPYmplY3QgVGhlIHNjb3BlIG9iamVjdCBmb3IgdGhlIGVuY2xvc2luZyBzY29wZS5cbiAgICogQHBhcmFtIG1vdmVkVmFyaWFibGVzIFNjb3BlIHZhcmlhYmxlcyB0aGF0IGhhdmUgYmVlbiBcIm1vdmVkXCIgdG8gdGhpcyBvYmplY3QuXG4gICAqIEBwYXJhbSB1bm1vdmVkVmFyaWFibGVzIFVubW92ZWQgc2NvcGUgdmFyaWFibGVzIHRoYXQgYXJlIHJlZmVyZW5jZWQgZnJvbSB0aGlzIG9iamVjdC4gTXVzdCBiZSBzcGVjaWZpZWQgYXMgZ2V0dGVycy9zZXR0ZXJzIGFzIHRoaXMgY29udGV4dCBkb2VzIG5vdCBoYXZlIGFjY2VzcyB0byB0aGUgdW5tb3ZlZCB2YXJpYWJsZXMuXG4gICAqIEBwYXJhbSBhcmdzIFRoZSBuYW1lIG9mIHRoZSBmdW5jdGlvbidzIGFyZ3VtZW50cy5cbiAgICogQHBhcmFtIGFyZ1ZhbHVlcyBUaGUgdmFsdWVzIG9mIHRoZSBmdW5jdGlvbidzIGFyZ3VtZW50cy5cbiAgICovXG4gIGZ1bmN0aW9uICQkJENSRUFURV9TQ09QRV9PQkpFQ1QkJCQocGFyZW50U2NvcGVPYmplY3Q6IFNjb3BlLCBtb3ZlZFZhcmlhYmxlczogc3RyaW5nW10sIHVubW92ZWRWYXJpYWJsZXM6IFByb3BlcnR5RGVzY3JpcHRvck1hcCwgYXJnczogc3RyaW5nW10sIGFyZ1ZhbHVlczogYW55W10pOiBTY29wZSB7XG4gICAgbW92ZWRWYXJpYWJsZXMuY29uY2F0KGFyZ3MpLmZvckVhY2goKHZhck5hbWUpID0+IHtcbiAgICAgIHVubW92ZWRWYXJpYWJsZXNbdmFyTmFtZV0gPSB7XG4gICAgICAgIHZhbHVlOiB1bmRlZmluZWQsXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgIH07XG4gICAgfSk7XG5cbiAgICAvLyBJbml0aWFsaXplIGFyZ3VtZW50cy5cbiAgICBhcmdzLmZvckVhY2goKGFyZ05hbWUsIGkpID0+IHtcbiAgICAgIHVubW92ZWRWYXJpYWJsZXNbYXJnTmFtZV0udmFsdWUgPSBhcmdWYWx1ZXNbaV07XG4gICAgfSk7XG5cbiAgICByZXR1cm4gT2JqZWN0LmNyZWF0ZShwYXJlbnRTY29wZU9iamVjdCwgdW5tb3ZlZFZhcmlhYmxlcyk7XG4gIH1cblxuICAvKipcbiAgICogUmVpbXBsZW1lbnRhdGlvbiBvZiA9PSBzdWNoIHRoYXQgUHJveHkoQSkgPT0gQS5cbiAgICogQHBhcmFtIGFcbiAgICogQHBhcmFtIGJcbiAgICovXG4gIGZ1bmN0aW9uICQkJEVRJCQkKGE6IGFueSwgYjogYW55KTogYm9vbGVhbiB7XG4gICAgaWYgKCQkJFNFUSQkJChhLCBiKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBhID09IGI7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlaW1wbGVtZW50YXRpb24gb2YgPT09IHN1Y2ggdGhhdCBQcm94eShBKSA9PT0gQS5cbiAgICogQHBhcmFtIGFcbiAgICogQHBhcmFtIGJcbiAgICovXG4gIGZ1bmN0aW9uICQkJFNFUSQkJChhOiBhbnksIGI6IGFueSk6IGJvb2xlYW4ge1xuICAgIGlmIChhID09PSBiKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKGlzUHJveHlhYmxlKGEpICYmIGlzUHJveHlhYmxlKGIpKSB7XG4gICAgICByZXR1cm4gKGEuaGFzT3duUHJvcGVydHkoJyQkJFBST1hZJCQkJykgJiYgYS4kJCRQUk9YWSQkJCA9PT0gYikgfHxcbiAgICAgICAgKGIuaGFzT3duUHJvcGVydHkoXCIkJCRQUk9YWSQkJFwiKSAmJiBiLiQkJFBST1hZJCQkID09PSBhKTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgY29uc3QgZml4U2V0ID0gbmV3IFNldDxudW1iZXI+KCk7XG4gIC8qKlxuICAgKiBDaGVja3MgdGhhdCBidWcgbiBzaG91bGQgYmUgZml4ZWQuXG4gICAqIEBwYXJhbSBuIFVuaXF1ZSBidWcgSUQuXG4gICAqL1xuICBmdW5jdGlvbiAkJCRTSE9VTERGSVgkJCQobjogbnVtYmVyKTogYm9vbGVhbjtcbiAgLyoqXG4gICAqIFNldHMgd2hldGhlciBvciBub3QgYnVnIG4gc2hvdWxkIGJlIGZpeGVkLlxuICAgKiBAcGFyYW0gbiBVbmlxdWUgYnVnIElELlxuICAgKiBAcGFyYW0gdmFsdWUgSWYgdHJ1ZSwgYnVnIG4gc2hvdWxkIGJlIGZpeGVkLlxuICAgKi9cbiAgZnVuY3Rpb24gJCQkU0hPVUxERklYJCQkKG46IG51bWJlciwgdmFsdWU6IGJvb2xlYW4pOiB2b2lkO1xuICBmdW5jdGlvbiAkJCRTSE9VTERGSVgkJCQobjogbnVtYmVyLCB2YWx1ZT86IGJvb2xlYW4pOiBib29sZWFuIHwgdm9pZCB7XG4gICAgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICBmaXhTZXQuYWRkKG4pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZml4U2V0LmRlbGV0ZShuKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGZpeFNldC5oYXMobik7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFwcGxpZXMgYSB3cml0ZSB0byB0aGUgZ2l2ZW4gc2NvcGUuIFVzZWQgaW4gYGV2YWwoKWAgdG8gYXZvaWQgc3RvcmluZy90cmFuc21pdHRpbmdcbiAgICogbWV0YWRhdGEgZm9yIHBhcnRpY3VsYXIgc2NvcGUgb2JqZWN0cy5cbiAgICpcbiAgICogU2VhcmNoZXMgdGhlIHNjb3BlIGNoYWluIGZvciB0aGUgZ2l2ZW4gYGtleWAuIElmIGZvdW5kLCBpdCBvdmVyd3JpdGVzIHRoZSB2YWx1ZSBvblxuICAgKiB0aGUgcmVsZXZhbnQgc2NvcGUgaW4gdGhlIHNjb3BlIGNoYWluLlxuICAgKiBAcGFyYW0gdGFyZ2V0XG4gICAqIEBwYXJhbSBrZXlcbiAgICogQHBhcmFtIHZhbHVlXG4gICAqL1xuICBmdW5jdGlvbiBhcHBseVdyaXRlKHRhcmdldDogU2NvcGUsIGtleTogc3RyaW5nLCB2YWx1ZTogYW55KTogYm9vbGVhbiB7XG4gICAgaWYgKHRhcmdldCA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0gZWxzZSBpZiAodGFyZ2V0Lmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgIHRhcmdldFtrZXldID0gdmFsdWU7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGFwcGx5V3JpdGUoT2JqZWN0LmdldFByb3RvdHlwZU9mKHRhcmdldCksIGtleSwgdmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIC8vIFNlbnRpbmVsXG4gIGNvbnN0IFBST1BfTk9UX0ZPVU5EID0ge307XG5cbiAgLyoqXG4gICAqIEdvZXMgdXAgdGhlIHNjb3BlIGNoYWluIG9mIHRoZSBvYmplY3QgKHdoaWNoIG1heSBiZSBhIHNjb3BlIG9yIHRoZSB0YXJnZXRcbiAgICogb2YgYSBgd2l0aCgpYCBzdGF0ZW1lbnQpIHRvIGRldGVybWluZSBpZiBhIGdpdmVuIGtleSBpcyBkZWZpbmVkIGluIHRoZSBvYmplY3QuXG4gICAqIEBwYXJhbSB0YXJnZXQgVGhlIHNjb3BlIG9iamVjdCBvciB3aXRoIHRhcmdldC5cbiAgICogQHBhcmFtIGtleSBUaGUga2V5IHdlIGFyZSBsb29raW5nIGZvci5cbiAgICovXG4gIGZ1bmN0aW9uIHdpdGhHZXQodGFyZ2V0OiBhbnksIGtleTogc3RyaW5nKTogYW55IHtcbiAgICBpZiAoa2V5IGluIHRhcmdldCkge1xuICAgICAgcmV0dXJuIHRhcmdldFtrZXldO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUFJPUF9OT1RfRk9VTkQ7XG4gICAgfVxuICB9XG5cbiAgLy8gUmV1c2VhYmxlIGV2YWwoKSBmdW5jdGlvbi4gRG9lcyBub3QgaGF2ZSBhIHBvbGx1dGVkIHNjb3BlLlxuICBjb25zdCBFVkFMX0ZDTiA9IG5ldyBGdW5jdGlvbignc2NvcGUnLCAnJCQkU1JDJCQkJywgJ3JldHVybiBldmFsKCQkJFNSQyQkJCk7Jyk7XG4gIC8vIENhY2hlcyBjb21waWxlZCBldmFsIHN0YXRlbWVudHMgZnJvbSBzZXJ2ZXIgdG8gcmVkdWNlIHN5bmNocm9ub3VzIFhIUnMuXG4gIGNvbnN0IEVWQUxfQ0FDSEUgPSBuZXcgTWFwPHN0cmluZywgeyBlOiBzdHJpbmcsIHRzOiBudW1iZXIgfT4oKTtcbiAgY29uc3QgRVZBTF9DQUNIRV9MSU1JVCA9IDEwMDtcblxuICAvKipcbiAgICogUmVtb3ZlcyB0aGUgMTAgaXRlbXMgZnJvbSBFVkFMX0NBQ0hFIHRoYXQgd2VyZSBsZWFzdCByZWNlbnRseSB1c2VkLlxuICAgKi9cbiAgZnVuY3Rpb24gdHJpbUV2YWxDYWNoZSgpIHtcbiAgICBjb25zdCBpdGVtczoge2U6IHN0cmluZywgdHM6IG51bWJlcn1bXSA9IFtdO1xuICAgIEVWQUxfQ0FDSEUuZm9yRWFjaCgoaSkgPT4gaXRlbXMucHVzaChpKSk7XG4gICAgaXRlbXMuc29ydCgoYSwgYikgPT4gYS50cyAtIGIudHMpO1xuICAgIGl0ZW1zLnNsaWNlKDAsIDEwKS5mb3JFYWNoKChpKSA9PiB7XG4gICAgICBFVkFMX0NBQ0hFLmRlbGV0ZShpLmUpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFNlbmRzIHRleHQgcGFzc2VkIHRvIGBldmFsYCB0byB0aGUgc2VydmVyIGZvciByZXdyaXRpbmcsXG4gICAqIGFuZCB0aGVuIGV2YWx1YXRlcyB0aGUgbmV3IHN0cmluZy5cbiAgICogQHBhcmFtIHNjb3BlIFRoZSBjb250ZXh0IGluIHdoaWNoIGV2YWwgd2FzIGNhbGxlZC5cbiAgICogQHBhcmFtIHRleHQgVGhlIEphdmFTY3JpcHQgY29kZSB0byBldmFsLlxuICAgKi9cbiAgZnVuY3Rpb24gJCQkUkVXUklURV9FVkFMJCQkKHNjb3BlOiBhbnksIHNvdXJjZTogc3RyaW5nKTogYW55IHtcbiAgICBsZXQgY2FjaGUgPSBFVkFMX0NBQ0hFLmdldChzb3VyY2UpO1xuICAgIGlmICghY2FjaGUpIHtcbiAgICAgIGNvbnN0IHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgICAgeGhyLm9wZW4oJ1BPU1QnLCAnL2V2YWwnLCBmYWxzZSk7XG4gICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcihcIkNvbnRlbnQtdHlwZVwiLCBcImFwcGxpY2F0aW9uL2pzb25cIik7XG4gICAgICB4aHIuc2VuZChKU09OLnN0cmluZ2lmeSh7IHNjb3BlOiBcInNjb3BlXCIsIHNvdXJjZSB9KSk7XG4gICAgICBjYWNoZSA9IHsgZTogeGhyLnJlc3BvbnNlVGV4dCwgdHM6IDAgfTtcbiAgICAgIEVWQUxfQ0FDSEUuc2V0KHNvdXJjZSwgY2FjaGUpO1xuICAgICAgaWYgKEVWQUxfQ0FDSEUuc2l6ZSA+IEVWQUxfQ0FDSEVfTElNSVQpIHtcbiAgICAgICAgdHJpbUV2YWxDYWNoZSgpO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyBVcGRhdGUgdGltZXN0YW1wXG4gICAgY2FjaGUudHMgPSBEYXRlLm5vdygpO1xuICAgIHJldHVybiBFVkFMX0ZDTihuZXcgUHJveHkoc2NvcGUsIHtcbiAgICAgIC8vIEFwcHJvcHJpYXRlbHkgcmVsYXkgd3JpdGVzIHRvIGZpcnN0IHNjb3BlIHdpdGggdGhlIGdpdmVuIHZhcmlhYmxlIG5hbWUuXG4gICAgICAvLyBPdGhlcndpc2UsIGl0J2xsIG92ZXJ3cml0ZSB0aGUgcHJvcGVydHkgb24gdGhlIG91dGVybW9zdCBzY29wZSFcbiAgICAgIHNldDogYXBwbHlXcml0ZVxuICAgIH0pLCBjYWNoZS5lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgU2NvcGUgb2JqZWN0IGZvciB1c2UgaW4gYSBgd2l0aCgpYCBzdGF0ZW1lbnQuXG4gICAqIEBwYXJhbSB3aXRoT2JqIFRoZSB0YXJnZXQgb2YgdGhlIGB3aXRoYCBzdGF0ZW1lbnQuXG4gICAqIEBwYXJhbSBzY29wZSBUaGUgc2NvcGUgb2YgdGhlIGB3aXRoKClgIHN0YXRlbWVudC5cbiAgICovXG4gIGZ1bmN0aW9uICQkJENSRUFURV9XSVRIX1NDT1BFJCQkKHdpdGhPYmo6IE9iamVjdCwgc2NvcGU6IFNjb3BlKTogU2NvcGUge1xuICAgIC8vIEFkZCAnd2l0aE9iaicgdG8gdGhlIHNjb3BlIGNoYWluLlxuICAgIHJldHVybiBuZXcgUHJveHkod2l0aE9iaiwge1xuICAgICAgZ2V0OiBmdW5jdGlvbih0YXJnZXQsIGtleTogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IHYgPSB3aXRoR2V0KHRhcmdldCwga2V5KTtcbiAgICAgICAgaWYgKHYgPT09IFBST1BfTk9UX0ZPVU5EKSB7XG4gICAgICAgICAgY29uc3QgdiA9IHdpdGhHZXQoc2NvcGUsIGtleSk7XG4gICAgICAgICAgaWYgKHYgPT09IFBST1BfTk9UX0ZPVU5EKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgUmVmZXJlbmNlRXJyb3IoYCR7a2V5fSBpcyBub3QgZGVmaW5lZGApO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gdjtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIHNldDogZnVuY3Rpb24odGFyZ2V0LCBrZXk6IHN0cmluZywgdmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIGFwcGx5V3JpdGUodGFyZ2V0LCBrZXksIHZhbHVlKSB8fCBhcHBseVdyaXRlKHNjb3BlLCBrZXksIHZhbHVlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBc3NpZ25zIHRoZSBnaXZlbiBzY29wZSB0byB0aGUgZ2l2ZW4gZnVuY3Rpb24gb2JqZWN0LlxuICAgKi9cbiAgZnVuY3Rpb24gJCQkRlVOQ1RJT05fRVhQUkVTU0lPTiQkJChmY246IEZ1bmN0aW9uLCBzY29wZTogU2NvcGUpOiBGdW5jdGlvbiB7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGZjbiwgJ19fc2NvcGVfXycsIHtcbiAgICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBzY29wZTtcbiAgICAgIH0sXG4gICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICByZXR1cm4gZmNuO1xuICB9XG5cbiAgLyoqXG4gICAqIEFzc2lnbnMgdGhlIGdpdmVuIHNjb3BlIHRvIGdldHRlci9zZXR0ZXIgcHJvcGVydGllcy5cbiAgICogQHBhcmFtIG9ialxuICAgKiBAcGFyYW0gc2NvcGVcbiAgICovXG4gIGZ1bmN0aW9uICQkJE9CSkVDVF9FWFBSRVNTSU9OJCQkKG9iajogb2JqZWN0LCBzY29wZTogU2NvcGUpOiBvYmplY3Qge1xuICAgIGNvbnN0IHByb3BzID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcnMob2JqKTtcbiAgICBmb3IgKGNvbnN0IHByb3Agb2YgcHJvcHMpIHtcbiAgICAgIGlmIChwcm9wLmdldCkge1xuICAgICAgICAkJCRGVU5DVElPTl9FWFBSRVNTSU9OJCQkKHByb3AuZ2V0LCBzY29wZSk7XG4gICAgICB9XG4gICAgICBpZiAocHJvcC5zZXQpIHtcbiAgICAgICAgJCQkRlVOQ1RJT05fRVhQUkVTU0lPTiQkJChwcm9wLnNldCwgc2NvcGUpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb2JqO1xuICB9XG5cblxuXG4gIC8vIFVzZWQgdG8gc3RvcmUgY2hpbGQgbm9kZXMgYXMgcHJvcGVydGllcyBvbiBhbiBvYmplY3QgcmF0aGVyIHRoYW4gaW4gYW4gYXJyYXkgdG8gZmFjaWxpdGF0ZVxuICAvLyBsZWFrIGRldGVjdGlvbi5cbiAgY29uc3QgTk9ERV9QUk9QX1BSRUZJWCA9IFwiJCQkQ0hJTEQkJCRcIjtcbiAgLyoqXG4gICAqIENvbnZlcnRzIHRoZSBub2RlJ3MgdHJlZSBzdHJ1Y3R1cmUgaW50byBhIEphdmFTY3JpcHQtdmlzaWJsZSB0cmVlIHN0cnVjdHVyZS5cbiAgICogVE9ETzogTXV0YXRlIHRvIGluY2x1ZGUgYW55IG90aGVyIE5vZGUgcHJvcGVydGllcyB0aGF0IGNvdWxkIGJlIHRoZSBzb3VyY2Ugb2YgbGVha3MhXG4gICAqIEBwYXJhbSBuXG4gICAqL1xuICBmdW5jdGlvbiBtYWtlTWlycm9yTm9kZShuOiBOb2RlKTogTWlycm9yTm9kZSB7XG4gICAgY29uc3QgY2hpbGROb2RlcyA9IG4uY2hpbGROb2RlcztcbiAgICBjb25zdCBtOiBNaXJyb3JOb2RlID0geyByb290OiBuLCBjaGlsZE5vZGVzOiBtYWtlQ2hpbGROb2RlKGNoaWxkTm9kZXMpIH07XG4gICAgcmV0dXJuIG07XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydHMgdGhlIGNoaWxkTm9kZXMgbm9kZWxpc3QgaW50byBhIEpTLWxldmVsIG9iamVjdC5cbiAgICogQHBhcmFtIGNuXG4gICAqL1xuICBmdW5jdGlvbiBtYWtlQ2hpbGROb2RlKGNuOiBOb2RlTGlzdCk6IENoaWxkTm9kZXMge1xuICAgIGNvbnN0IG51bUNoaWxkcmVuID0gY24ubGVuZ3RoO1xuICAgIGxldCBydjogQ2hpbGROb2RlcyA9IHsgbGVuZ3RoOiBudW1DaGlsZHJlbiB9O1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtQ2hpbGRyZW47IGkrKykge1xuICAgICAgcnZbYCR7Tk9ERV9QUk9QX1BSRUZJWH0ke2l9YF0gPSBtYWtlTWlycm9yTm9kZShjbltpXSk7XG4gICAgfVxuICAgIHJldHVybiBydjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXJpYWxpemVzIHRoZSBET00gaW50byBhIEphdmFTY3JpcHQtdmlzaWJsZSB0cmVlIHN0cnVjdHVyZS5cbiAgICovXG4gIGZ1bmN0aW9uICQkJFNFUklBTElaRV9ET00kJCQobjogTm9kZSA9IGRvY3VtZW50KTogdm9pZCB7XG4gICAgUk9PVC4kJCRET00kJCQgPSBtYWtlTWlycm9yTm9kZShkb2N1bWVudCk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB3aGV0aGVyIG9yIG5vdCB2YWx1ZSAnYScgY291bGQgaGFyYm9yIGEgcHJveHkuXG4gICAqIEBwYXJhbSBhXG4gICAqL1xuICBmdW5jdGlvbiBpc1Byb3h5YWJsZShhOiBhbnkpOiBib29sZWFuIHtcbiAgICBzd2l0Y2ggKHR5cGVvZihhKSkge1xuICAgICAgY2FzZSBcIm9iamVjdFwiOlxuICAgICAgY2FzZSBcImZ1bmN0aW9uXCI6XG4gICAgICAgIHJldHVybiBhICE9PSBudWxsOyAvLyAmJiAhKGEgaW5zdGFuY2VvZiBOb2RlKTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmVwcmVzZW50cyBhbiBvYmplY3QncyBwcm94eSBzdGF0dXMuXG4gICAqL1xuICBjb25zdCBlbnVtIFByb3h5U3RhdHVzIHtcbiAgICAvLyBUaGUgb2JqZWN0IGhhcyBhIHByb3h5LCBhbmQgaXMgYSBwcm94eSBpdHNlbGYhXG4gICAgSVNfUFJPWFksXG4gICAgLy8gVGhlIG9iamVjdCBoYXMgYSBwcm94eSwgYnV0IGlzIHRoZSBvcmlnaW5hbCBvYmplY3RcbiAgICBIQVNfUFJPWFksXG4gICAgLy8gVGhlIHZhbHVlIGlzIG5vdCBhIHByb3h5LCBhbmQgZG9lcyBub3QgaGF2ZSBhIHByb3h5LlxuICAgIC8vIEl0IG1heSBub3QgZXZlbiBiZSBhbiBvYmplY3QuXG4gICAgTk9fUFJPWFlcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIHByb3h5IHN0YXR1cyBvZiB0aGUgZ2l2ZW4gdmFsdWUuXG4gICAqIEBwYXJhbSBhXG4gICAqL1xuICBmdW5jdGlvbiBnZXRQcm94eVN0YXR1cyhhOiBhbnkpOiBQcm94eVN0YXR1cyB7XG4gICAgaWYgKGlzUHJveHlhYmxlKGEpICYmIGEuaGFzT3duUHJvcGVydHkoXCIkJCRQUk9YWSQkJFwiKSkge1xuICAgICAgaWYgKGEuJCQkUFJPWFkkJCQgPT09IGEpIHtcbiAgICAgICAgcmV0dXJuIFByb3h5U3RhdHVzLklTX1BST1hZO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIFByb3h5U3RhdHVzLkhBU19QUk9YWTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIFByb3h5U3RhdHVzLk5PX1BST1hZO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0UHJveHlTdGFja1RyYWNlcyhhOiBhbnkpOiBHcm93dGhPYmplY3RTdGFja1RyYWNlcyB7XG4gICAgcmV0dXJuIGEuJCQkU1RBQ0tUUkFDRVMkJCQ7XG4gIH1cblxuICAvKipcbiAgICogSWYgYGFgIGlzIGEgcHJveHksIHJldHVybnMgdGhlIG9yaWdpbmFsIG9iamVjdC5cbiAgICogT3RoZXJ3aXNlLCByZXR1cm5zIGBhYCBpdHNlbGYuXG4gICAqIEBwYXJhbSBhXG4gICAqL1xuICBmdW5jdGlvbiB1bndyYXBJZlByb3h5KGE6IGFueSk6IGFueSB7XG4gICAgc3dpdGNoIChnZXRQcm94eVN0YXR1cyhhKSkge1xuICAgICAgY2FzZSBQcm94eVN0YXR1cy5JU19QUk9YWTpcbiAgICAgICAgcmV0dXJuIGEuJCQkT1JJR0lOQUwkJCQ7XG4gICAgICBjYXNlIFByb3h5U3RhdHVzLkhBU19QUk9YWTpcbiAgICAgIGNhc2UgUHJveHlTdGF0dXMuTk9fUFJPWFk6XG4gICAgICAgIHJldHVybiBhO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBJZiBgYWAgaGFzIGEgcHJveHksIHJldHVybnMgdGhlIHByb3h5LiBPdGhlcndpc2UsIHJldHVybnMgYGFgIGl0c2VsZi5cbiAgICogQHBhcmFtIGFcbiAgICovXG4gIGZ1bmN0aW9uIHdyYXBJZk9yaWdpbmFsKGE6IGFueSk6IGFueSB7XG4gICAgc3dpdGNoIChnZXRQcm94eVN0YXR1cyhhKSkge1xuICAgICAgY2FzZSBQcm94eVN0YXR1cy5IQVNfUFJPWFk6XG4gICAgICAgIHJldHVybiBhLiQkJFBST1hZJCQkO1xuICAgICAgY2FzZSBQcm94eVN0YXR1cy5JU19QUk9YWTpcbiAgICAgIGNhc2UgUHJveHlTdGF0dXMuTk9fUFJPWFk6XG4gICAgICAgIHJldHVybiBhO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGEgc3RhY2sgdHJhY2UgdG8gdGhlIGdpdmVuIG1hcCBmb3IgdGhlIGdpdmVuIHByb3BlcnR5LlxuICAgKiBAcGFyYW0gbWFwXG4gICAqIEBwYXJhbSBwcm9wZXJ0eVxuICAgKi9cbiAgZnVuY3Rpb24gX2FkZFN0YWNrVHJhY2UobWFwOiBHcm93dGhPYmplY3RTdGFja1RyYWNlcywgcHJvcGVydHk6IHN0cmluZyB8IG51bWJlciB8IHN5bWJvbCwgc3RhY2sgPSBfZ2V0U3RhY2tUcmFjZSgpKTogdm9pZCB7XG4gICAgbGV0IHNldCA9IG1hcC5nZXQocHJvcGVydHkpO1xuICAgIGlmICghc2V0KSB7XG4gICAgICBzZXQgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICAgIG1hcC5zZXQocHJvcGVydHksIHNldCk7XG4gICAgfVxuICAgIHNldC5hZGQoc3RhY2spO1xuICB9XG4gIC8qKlxuICAgKiBSZW1vdmVzIHN0YWNrIHRyYWNlcyBmb3IgdGhlIGdpdmVuIG1hcCBmb3IgdGhlIGdpdmVuIHByb3BlcnR5LlxuICAgKiBAcGFyYW0gbWFwXG4gICAqIEBwYXJhbSBwcm9wZXJ0eVxuICAgKi9cbiAgZnVuY3Rpb24gX3JlbW92ZVN0YWNrcyhtYXA6IEdyb3d0aE9iamVjdFN0YWNrVHJhY2VzLCBwcm9wZXJ0eTogc3RyaW5nIHwgbnVtYmVyIHwgc3ltYm9sKTogdm9pZCB7XG4gICAgaWYgKG1hcC5oYXMocHJvcGVydHkpKSB7XG4gICAgICBtYXAuZGVsZXRlKHByb3BlcnR5KTtcbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIENvcHkgYWxsIG9mIHRoZSBzdGFja3MgZnJvbSBgZnJvbWAgdG8gYHRvYCB3aXRoaW4gdGhlIG1hcC5cbiAgICogQHBhcmFtIG1hcFxuICAgKiBAcGFyYW0gZnJvbVxuICAgKiBAcGFyYW0gdG9cbiAgICovXG4gIGZ1bmN0aW9uIF9jb3B5U3RhY2tzKG1hcDogR3Jvd3RoT2JqZWN0U3RhY2tUcmFjZXMsIGZyb206IHN0cmluZyB8IG51bWJlciB8IHN5bWJvbCwgdG86IHN0cmluZyB8IG51bWJlciB8IHN5bWJvbCk6IHZvaWQge1xuICAgIGlmIChtYXAuaGFzKGZyb20pKSB7XG4gICAgICBtYXAuc2V0KHRvLCBtYXAuZ2V0KGZyb20pKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ29tYmluZSB0aGUgc3RhY2tzIGZvciAnZnJvbScgd2l0aCAndG8nIGluICd0bycuXG4gICAqIEBwYXJhbSBtYXBcbiAgICogQHBhcmFtIGZyb21cbiAgICogQHBhcmFtIHRvXG4gICAqL1xuICBmdW5jdGlvbiBfY29tYmluZVN0YWNrcyhtYXA6IEdyb3d0aE9iamVjdFN0YWNrVHJhY2VzLCBmcm9tOiBzdHJpbmcgfCBudW1iZXIgfCBzeW1ib2wsIHRvOiBzeW1ib2wgfCBudW1iZXIgfCBzdHJpbmcpOiB2b2lkIHtcbiAgICBpZiAobWFwLmhhcyhmcm9tKSAmJiBtYXAuaGFzKHRvKSkge1xuICAgICAgY29uc3QgZnJvbVN0YWNrcyA9IG1hcC5nZXQoZnJvbSk7XG4gICAgICBjb25zdCB0b1N0YWNrcyA9IG1hcC5nZXQodG8pO1xuICAgICAgZnJvbVN0YWNrcy5mb3JFYWNoKChzKSA9PiB7XG4gICAgICAgIHRvU3RhY2tzLmFkZChzKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplIGEgbWFwIHRvIGNvbnRhaW4gc3RhY2sgdHJhY2VzIGZvciBhbGwgb2YgdGhlIHByb3BlcnRpZXMgb2YgdGhlIGdpdmVuIG9iamVjdC5cbiAgICovXG4gIGZ1bmN0aW9uIF9pbml0aWFsaXplTWFwKG9iajogYW55LCBtYXA6IEdyb3d0aE9iamVjdFN0YWNrVHJhY2VzLCB0cmFjZTogc3RyaW5nKTogR3Jvd3RoT2JqZWN0U3RhY2tUcmFjZXMge1xuICAgIE9iamVjdC5rZXlzKG9iaikuZm9yRWFjaCgoaykgPT4ge1xuICAgICAgX2FkZFN0YWNrVHJhY2UobWFwLCBrLCB0cmFjZSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIG1hcDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgcHJveHkgb2JqZWN0IGZvciB0aGUgZ2l2ZW4gb2JqZWN0LCBpZiBhcHBsaWNhYmxlLiBDcmVhdGVzIGEgbmV3IG9iamVjdCBpZiB0aGUgb2JqZWN0XG4gICAqIGlzIG5vdCBhbHJlYWR5IHByb3hpZWQuXG4gICAqL1xuICBmdW5jdGlvbiBnZXRQcm94eShhY2Nlc3NTdHI6IHN0cmluZywgb2JqOiBhbnksIHN0YWNrVHJhY2U6IHN0cmluZyA9IG51bGwpOiBhbnkge1xuICAgIGlmICghaXNQcm94eWFibGUob2JqKSkge1xuICAgICAgLy8gbG9nVG9Db25zb2xlKGBbUFJPWFkgRVJST1JdOiBDYW5ub3QgY3JlYXRlIHByb3h5IGZvciAke29ian0gYXQgJHthY2Nlc3NTdHJ9LmApO1xuICAgICAgcmV0dXJuIG9iajtcbiAgICB9IGVsc2UgaWYgKCFvYmouaGFzT3duUHJvcGVydHkoJyQkJFBST1hZJCQkJykpIHtcbiAgICAgIGNvbnN0IG1hcCA9IG5ldyBNYXA8c3RyaW5nIHwgbnVtYmVyIHwgc3ltYm9sLCBTZXQ8c3RyaW5nPj4oKTtcbiAgICAgIGlmIChzdGFja1RyYWNlICE9PSBudWxsKSB7XG4gICAgICAgIF9pbml0aWFsaXplTWFwKG9iaiwgbWFwLCBzdGFja1RyYWNlKTtcbiAgICAgIH1cbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmosICckJCRPUklHSU5BTCQkJCcsIHtcbiAgICAgICAgdmFsdWU6IG9iaixcbiAgICAgICAgd3JpdGFibGU6IGZhbHNlLFxuICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICB9KTtcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmosIFwiJCQkU1RBQ0tUUkFDRVMkJCRcIiwge1xuICAgICAgICB2YWx1ZTogbWFwLFxuICAgICAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IGZhbHNlXG4gICAgICB9KTtcbiAgICAgIC8vZnVuY3Rpb24gTE9HKHM6IHN0cmluZykge1xuICAgICAgICAvLyBsb2dUb0NvbnNvbGUoYCR7YWNjZXNzU3RyfTogJHtzfWApO1xuICAgICAgLy99XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqLCAnJCQkUFJPWFkkJCQnLCB7IHZhbHVlOiBuZXcgUHJveHkob2JqLCB7XG4gICAgICAgIGRlZmluZVByb3BlcnR5OiBmdW5jdGlvbih0YXJnZXQsIHByb3BlcnR5LCBkZXNjcmlwdG9yKTogYm9vbGVhbiB7XG4gICAgICAgICAgaWYgKCFkaXNhYmxlUHJveGllcykge1xuICAgICAgICAgICAgLy8gQ2FwdHVyZSBhIHN0YWNrIHRyYWNlLlxuICAgICAgICAgICAgX2FkZFN0YWNrVHJhY2UoZ2V0UHJveHlTdGFja1RyYWNlcyh0YXJnZXQpLCBwcm9wZXJ0eSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIExPRyhgZGVmaW5lUHJvcGVydHlgKTtcbiAgICAgICAgICByZXR1cm4gUmVmbGVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIHByb3BlcnR5LCBkZXNjcmlwdG9yKTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbih0YXJnZXQsIHByb3BlcnR5LCB2YWx1ZSwgcmVjZWl2ZXIpOiBib29sZWFuIHtcbiAgICAgICAgICBpZiAoIWRpc2FibGVQcm94aWVzKSB7XG4gICAgICAgICAgICAvLyBDYXB0dXJlIGEgc3RhY2sgdHJhY2UuXG4gICAgICAgICAgICBfYWRkU3RhY2tUcmFjZShnZXRQcm94eVN0YWNrVHJhY2VzKHRhcmdldCksIHByb3BlcnR5KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gTE9HKGBzZXRgKTtcbiAgICAgICAgICByZXR1cm4gUmVmbGVjdC5zZXQodGFyZ2V0LCBwcm9wZXJ0eSwgdmFsdWUsIHRhcmdldCk7XG4gICAgICAgIH0sXG4gICAgICAgIGRlbGV0ZVByb3BlcnR5OiBmdW5jdGlvbih0YXJnZXQsIHByb3BlcnR5KTogYm9vbGVhbiB7XG4gICAgICAgICAgaWYgKCFkaXNhYmxlUHJveGllcykge1xuICAgICAgICAgICAgLy8gUmVtb3ZlIHN0YWNrIHRyYWNlcyB0aGF0IHNldCB0aGlzIHByb3BlcnR5LlxuICAgICAgICAgICAgX3JlbW92ZVN0YWNrcyhnZXRQcm94eVN0YWNrVHJhY2VzKHRhcmdldCksIHByb3BlcnR5KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gTE9HKGBkZWxldGVQcm9wZXJ0eWApO1xuICAgICAgICAgIHJldHVybiBSZWZsZWN0LmRlbGV0ZVByb3BlcnR5KHRhcmdldCwgcHJvcGVydHkpO1xuICAgICAgICB9XG4gICAgICB9KSwgZW51bWVyYWJsZTogZmFsc2UsIGNvbmZpZ3VyYWJsZTogdHJ1ZSwgd3JpdGFibGU6IHRydWUgfSk7XG4gICAgfVxuICAgIHJldHVybiBvYmouJCQkUFJPWFkkJCQ7XG4gIH1cblxuICBpbnRlcmZhY2UgQXNzaWdubWVudFByb3h5IHtcbiAgICAodjogYW55KTogYm9vbGVhbjtcbiAgICAkJHRyZWVzOiBJUGF0aFRyZWVbXTtcbiAgICAkJHJvb3RBY2Nlc3NTdHJpbmc6IHN0cmluZztcbiAgICAkJHVwZGF0ZTogKHN0YWNrVHJhY2U6IHN0cmluZykgPT4gdm9pZDtcbiAgICAkJHJvb3Q6IGFueTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHVwZGF0ZUFzc2lnbm1lbnRQcm94eSh0aGlzOiBBc3NpZ25tZW50UHJveHksIHN0YWNrVHJhY2U6IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IHJvb3QgPSB0aGlzLiQkcm9vdDtcbiAgICBjb25zdCB0cmVlcyA9IHRoaXMuJCR0cmVlcztcbiAgICBjb25zdCByb290QWNjZXNzU3RyaW5nID0gdGhpcy4kJHJvb3RBY2Nlc3NTdHJpbmc7XG4gICAgZm9yIChjb25zdCB0cmVlIG9mIHRyZWVzKSB7XG4gICAgICBpbnN0cnVtZW50VHJlZShyb290QWNjZXNzU3RyaW5nLCByb290LCB0cmVlLCBzdGFja1RyYWNlKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBoaWRkZW5Qcm9wZXJ0eU5hbWUobjogc3RyaW5nIHwgbnVtYmVyKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYF9fX19fJCR7bn1gO1xuICB9XG5cbiAgZnVuY3Rpb24gc2V0SGlkZGVuVmFsdWUodGhpc09iajogYW55LCBuOiBzdHJpbmcgfCBudW1iZXIsIHZhbHVlOiBhbnkpOiB2b2lkIHtcbiAgICBjb25zdCBwcm9wTmFtZSA9IGhpZGRlblByb3BlcnR5TmFtZShuKTtcbiAgICBpZiAoIXRoaXNPYmouaGFzT3duUHJvcGVydHkocHJvcE5hbWUpKSB7XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpc09iaiwgcHJvcE5hbWUsIHtcbiAgICAgICAgdmFsdWU6IG51bGwsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlXG4gICAgICB9KTtcbiAgICB9XG4gICAgdGhpc09ialtwcm9wTmFtZV0gPSB2YWx1ZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldEhpZGRlblZhbHVlKHRoaXNPYmo6IGFueSwgbjogc3RyaW5nIHwgbnVtYmVyKTogYW55IHtcbiAgICByZXR1cm4gdGhpc09ialtoaWRkZW5Qcm9wZXJ0eU5hbWUobildO1xuICB9XG5cbiAgZnVuY3Rpb24gaW5zdHJ1bWVudFBhdGgocm9vdEFjY2Vzc1N0cmluZzogc3RyaW5nLCBhY2Nlc3NTdHJpbmc6IHN0cmluZywgcm9vdDogYW55LCB0cmVlOiBJUGF0aFRyZWUsIHN0YWNrVHJhY2U6IHN0cmluZyA9IG51bGwpOiB2b2lkIHtcbiAgICBsZXQgc2V0UHJveHk6IEFzc2lnbm1lbnRQcm94eTtcbiAgICAvL2xvZ1RvQ29uc29sZShgSW5zdHJ1bWVudGluZyAke2FjY2Vzc1N0cmluZ30gYXQgJHtyb290QWNjZXNzU3RyaW5nfWApO1xuICAgIGNvbnN0IHByb3AgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHJvb3QsIHRyZWUuaW5kZXhPck5hbWUpO1xuICAgIGlmIChwcm9wICYmIHByb3Auc2V0ICYmIEFycmF5LmlzQXJyYXkoKDxhbnk+IHByb3Auc2V0KVsnJCR0cmVlcyddKSkge1xuICAgICAgLy9sb2dUb0NvbnNvbGUoYEl0J3MgYWxyZWFkeSBpbnN0cnVtZW50ZWQhYCk7XG4gICAgICBzZXRQcm94eSA9IDxhbnk+IHByb3Auc2V0O1xuICAgIH0gZWxzZSB7XG4gICAgICAvL2xvZ1RvQ29uc29sZShgTmV3IGluc3RydW1lbnRhdGlvbi5gKTtcbiAgICAgIC8vIGxldCBoaWRkZW5WYWx1ZSA9IHJvb3RbdHJlZS5pbmRleE9yTmFtZV07XG4gICAgICBjb25zdCBpc0dyb3dpbmcgPSB0cmVlLmlzR3Jvd2luZztcbiAgICAgIGNvbnN0IGluZGV4T3JOYW1lID0gdHJlZS5pbmRleE9yTmFtZTtcbiAgICAgIHNldEhpZGRlblZhbHVlKHJvb3QsIGluZGV4T3JOYW1lLCByb290W2luZGV4T3JOYW1lXSk7XG4gICAgICBpZiAoaXNHcm93aW5nKSB7XG4gICAgICAgIC8vbG9nVG9Db25zb2xlKGBDb252ZXJ0aW5nIHRoZSBoaWRkZW4gdmFsdWUgaW50byBhIHByb3h5LmApXG4gICAgICAgIGNvbnN0IHByb3h5ID0gZ2V0UHJveHkoYWNjZXNzU3RyaW5nLCBnZXRIaWRkZW5WYWx1ZShyb290LCBpbmRleE9yTmFtZSkpO1xuICAgICAgICBzZXRIaWRkZW5WYWx1ZShyb290LCBpbmRleE9yTmFtZSwgcHJveHkpO1xuICAgICAgICBpZiAoc3RhY2tUcmFjZSAhPT0gbnVsbCAmJiBnZXRQcm94eVN0YXR1cyhwcm94eSkgPT09IFByb3h5U3RhdHVzLklTX1BST1hZKSB7XG4gICAgICAgICAgY29uc3QgbWFwOiBHcm93dGhPYmplY3RTdGFja1RyYWNlcyA9IGdldFByb3h5U3RhY2tUcmFjZXMocHJveHkpO1xuICAgICAgICAgIF9pbml0aWFsaXplTWFwKHByb3h5LCBtYXAsIHN0YWNrVHJhY2UpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBzZXRQcm94eSA9IDxhbnk+IGZ1bmN0aW9uKHRoaXM6IGFueSwgdjogYW55KTogYm9vbGVhbiB7XG4gICAgICAgIGNvbnN0IHRyYWNlID0gX2dldFN0YWNrVHJhY2UoKTtcbiAgICAgICAgc2V0SGlkZGVuVmFsdWUodGhpcywgaW5kZXhPck5hbWUsIGlzR3Jvd2luZyA/IGdldFByb3h5KGFjY2Vzc1N0cmluZywgdiwgdHJhY2UpIDogdik7XG4gICAgICAgIHNldFByb3h5LiQkdXBkYXRlKHRyYWNlKTtcbiAgICAgICAgLy8gbG9nVG9Db25zb2xlKGAke3Jvb3RBY2Nlc3NTdHJpbmd9OiBBc3NpZ25tZW50YCk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfTtcbiAgICAgIHNldFByb3h5LiQkcm9vdEFjY2Vzc1N0cmluZyA9IHJvb3RBY2Nlc3NTdHJpbmc7XG4gICAgICBzZXRQcm94eS4kJHRyZWVzID0gW107XG4gICAgICBzZXRQcm94eS4kJHVwZGF0ZSA9IHVwZGF0ZUFzc2lnbm1lbnRQcm94eTtcbiAgICAgIHNldFByb3h5LiQkcm9vdCA9IHJvb3Q7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShyb290LCBpbmRleE9yTmFtZSwge1xuICAgICAgICAgIGdldDogZnVuY3Rpb24odGhpczogYW55KSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0SGlkZGVuVmFsdWUodGhpcywgaW5kZXhPck5hbWUpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgc2V0OiBzZXRQcm94eSxcbiAgICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgICAgfSk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGxvZ1RvQ29uc29sZShgVW5hYmxlIHRvIGluc3RydW1lbnQgJHtyb290QWNjZXNzU3RyaW5nfTogJHtlfWApO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChzZXRQcm94eS4kJHRyZWVzLmluZGV4T2YodHJlZSkgPT09IC0xKSB7XG4gICAgICBzZXRQcm94eS4kJHRyZWVzLnB1c2godHJlZSk7XG4gICAgICAvLyBPbmx5IHVwZGF0ZSBpbm5lciBwcm94aWVzIGlmOlxuICAgICAgLy8gLSB0aGUgdHJlZSBpcyBuZXcgKHRyZWUgYWxyZWFkeSBleGlzdHMgPT09IHRoaXMgcGF0aCBpcyBhbHJlYWR5IHVwZGF0ZWQpXG4gICAgICAvLyAgIC0gUHJldmVudHMgaW5maW5pdGUgbG9vcHMgZHVlIHRvIGN5Y2xlcyFcbiAgICAgIC8vIC0gdGhlcmUgaXMgYSBzdGFjayB0cmFjZSAobm8gc3RhY2sgdHJhY2UgPT09IGluaXRpYWwgaW5zdGFsbGF0aW9uKVxuICAgICAgLy8gICAtIE90aGVyd2lzZSB3ZSBhcmUgYWxyZWFkeSB1cGRhdGluZyB0aGlzIHByb3h5IVxuICAgICAgaWYgKHN0YWNrVHJhY2UpIHtcbiAgICAgICAgc2V0UHJveHkuJCR1cGRhdGUoc3RhY2tUcmFjZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gTmVlZDpcbiAgLy8gLSBET00gc2V0IHByb3hpZXNcbiAgLy8gICAtPiBJbnZhbGlkYXRlIC8gcmVmcmVzaCB3aGVuIGNoYW5nZWRcbiAgLy8gLSBGYXN0IGNoZWNrZXIgb2Ygbm9kZS5cblxuICAvLyBPcGVyYXRpb25zIGNhbiBpbXBhY3Q6XG4gIC8vIC0gQ3VycmVudCBub2RlXG4gIC8vIC0gUGFyZW50IG5vZGVcbiAgLy8gLSBDaGlsZCBub2Rlc1xuICAvLyBVcGRhdGUgdGFyZ2V0IG5vZGUgJiBhbGwgY2hpbGRyZW4uXG4gIC8vXG5cbiAgZnVuY3Rpb24gaW5zdHJ1bWVudERPTVRyZWUocm9vdEFjY2Vzc1N0cmluZzogc3RyaW5nLCByb290OiBhbnksIHRyZWU6IElQYXRoVHJlZSwgc3RhY2tUcmFjZTogc3RyaW5nID0gbnVsbCk6IHZvaWQge1xuICAgIC8vIEZvciBub3c6IFNpbXBseSBjcmF3bCB0byB0aGUgbm9kZShzKSBhbmQgaW5zdHJ1bWVudCByZWd1bGFybHkgZnJvbSB0aGVyZS4gRG9uJ3QgdHJ5IHRvIHBsYW50IGdldHRlcnMvc2V0dGVycy5cbiAgICAvLyAkJERPTSAtIC0gLSAtIC0gLT4gcm9vdCBbcmVndWxhciBzdWJ0cmVlXVxuICAgIGxldCBvYmo6IGFueTtcbiAgICBsZXQgYWNjZXNzU3RyaW5nID0gcm9vdEFjY2Vzc1N0cmluZztcbiAgICBsZXQgc3dpdGNoVG9SZWd1bGFyVHJlZSA9IGZhbHNlO1xuICAgIHN3aXRjaCAodHJlZS5pbmRleE9yTmFtZSkge1xuICAgICAgY2FzZSBcIiQkJERPTSQkJFwiOlxuICAgICAgICBvYmogPSBkb2N1bWVudDtcbiAgICAgICAgYWNjZXNzU3RyaW5nID0gXCJkb2N1bWVudFwiO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3Jvb3QnOlxuICAgICAgICBzd2l0Y2hUb1JlZ3VsYXJUcmVlID0gdHJ1ZTtcbiAgICAgICAgb2JqID0gcm9vdDtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdjaGlsZE5vZGVzJzpcbiAgICAgICAgb2JqID0gcm9vdFsnY2hpbGROb2RlcyddO1xuICAgICAgICBhY2Nlc3NTdHJpbmcgKz0gYFsnY2hpbGROb2RlcyddYDtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBjb25zdCBtb2RJbmRleCA9ICg8c3RyaW5nPiB0cmVlLmluZGV4T3JOYW1lKS5zbGljZShOT0RFX1BST1BfUFJFRklYLmxlbmd0aCk7XG4gICAgICAgIG9iaiA9IHJvb3RbbW9kSW5kZXhdO1xuICAgICAgICBhY2Nlc3NTdHJpbmcgKz0gYFske21vZEluZGV4fV1gO1xuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICBpZiAoIW9iaikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChvYmogJiYgIW9iai4kJCRUUkVFJCQkKSB7XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyhvYmosIHtcbiAgICAgICAgJCQkVFJFRSQkJDoge1xuICAgICAgICAgIHZhbHVlOiBudWxsLFxuICAgICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgICB9LFxuICAgICAgICAkJCRBQ0NFU1NfU1RSSU5HJCQkOiB7XG4gICAgICAgICAgdmFsdWU6IG51bGwsXG4gICAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICBvYmouJCQkVFJFRSQkJCA9IHRyZWU7XG4gICAgb2JqLiQkJEFDQ0VTU19TVFJJTkckJCQgPSBhY2Nlc3NTdHJpbmc7XG4gICAgaWYgKHRyZWUuaXNHcm93aW5nKSB7XG4gICAgICBnZXRQcm94eShhY2Nlc3NTdHJpbmcsIG9iaiwgc3RhY2tUcmFjZSk7XG4gICAgfVxuXG4gICAgLy8gQ2FwdHVyZSB3cml0ZXMgb2YgY2hpbGRyZW4uXG4gICAgY29uc3QgY2hpbGRyZW4gPSB0cmVlLmNoaWxkcmVuO1xuICAgIGlmIChjaGlsZHJlbikge1xuICAgICAgY29uc3QgaW5zdHJ1bWVudEZ1bmN0aW9uID0gc3dpdGNoVG9SZWd1bGFyVHJlZSA/IGluc3RydW1lbnRUcmVlIDogaW5zdHJ1bWVudERPTVRyZWU7XG4gICAgICBjb25zdCBsZW4gPSBjaGlsZHJlbi5sZW5ndGg7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGNoaWxkID0gY2hpbGRyZW5baV07XG4gICAgICAgIGluc3RydW1lbnRGdW5jdGlvbihhY2Nlc3NTdHJpbmcsIG9iaiwgY2hpbGQsIHN0YWNrVHJhY2UpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGluc3RydW1lbnRUcmVlKHJvb3RBY2Nlc3NTdHJpbmc6IHN0cmluZywgcm9vdDogYW55LCB0cmVlOiBJUGF0aFRyZWUsIHN0YWNrVHJhY2U6IHN0cmluZyA9IG51bGwpOiB2b2lkIHtcbiAgICBjb25zdCBhY2Nlc3NTdHJpbmcgPSByb290QWNjZXNzU3RyaW5nICsgYFske3NhZmVTdHJpbmcoYCR7dHJlZS5pbmRleE9yTmFtZX1gKX1dYDtcbiAgICAvL2xvZ1RvQ29uc29sZShgYWNjZXNzIHN0cmluZzogJHthY2Nlc3NTdHJpbmd9YCk7XG4gICAgLy8gSWdub3JlIHJvb3RzIHRoYXQgYXJlIG5vdCBwcm94eWFibGUuXG4gICAgaWYgKCFpc1Byb3h5YWJsZShyb290KSkge1xuICAgICAgLy9sb2dUb0NvbnNvbGUoYE5vdCBhIHByb3h5YWJsZSByb290LmApO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBvYmogPSByb290W3RyZWUuaW5kZXhPck5hbWVdO1xuICAgIGluc3RydW1lbnRQYXRoKHJvb3RBY2Nlc3NTdHJpbmcsIGFjY2Vzc1N0cmluZywgcm9vdCwgdHJlZSwgc3RhY2tUcmFjZSk7XG5cbiAgICAvLyBDYXB0dXJlIHdyaXRlcyBvZiBjaGlsZHJlbi5cbiAgICBjb25zdCBjaGlsZHJlbiA9IHRyZWUuY2hpbGRyZW47XG4gICAgaWYgKGNoaWxkcmVuKSB7XG4gICAgICBjb25zdCBsZW4gPSBjaGlsZHJlbi5sZW5ndGg7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGNoaWxkID0gY2hpbGRyZW5baV07XG4gICAgICAgIGluc3RydW1lbnRUcmVlKGFjY2Vzc1N0cmluZywgb2JqLCBjaGlsZCwgc3RhY2tUcmFjZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gRGlzYWJsZXMgcHJveHkgaW50ZXJjZXB0aW9uLlxuICBsZXQgZGlzYWJsZVByb3hpZXMgPSBmYWxzZTtcblxuICBmdW5jdGlvbiBpc0RPTVJvb3QodHJlZTogSVBhdGhUcmVlKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRyZWUuaW5kZXhPck5hbWUgPT09IFwiJCQkRE9NJCQkXCI7XG4gIH1cblxuICBsZXQgaW5zdHJ1bWVudGVkVHJlZXM6IElQYXRoVHJlZXMgPSBbXTtcbiAgZnVuY3Rpb24gJCQkSU5TVFJVTUVOVF9QQVRIUyQkJCh0cmVlczogSVBhdGhUcmVlcyk6IHZvaWQge1xuICAgIGZvciAoY29uc3QgdHJlZSBvZiB0cmVlcykge1xuICAgICAgaWYgKGlzRE9NUm9vdCh0cmVlKSkge1xuICAgICAgICBpbnN0cnVtZW50RE9NVHJlZShcIiQkJEdMT0JBTCQkJFwiLCBST09ULiQkJEdMT0JBTCQkJCwgdHJlZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpbnN0cnVtZW50VHJlZShcIiQkJEdMT0JBTCQkJFwiLCBST09ULiQkJEdMT0JBTCQkJCwgdHJlZSk7XG4gICAgICB9XG4gICAgfVxuICAgIGluc3RydW1lbnRlZFRyZWVzID0gaW5zdHJ1bWVudGVkVHJlZXMuY29uY2F0KHRyZWVzKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldFN0YWNrVHJhY2VzKHJvb3Q6IGFueSwgcGF0aDogSVBhdGhUcmVlLCBzdGFja3NNYXA6IHtbaWQ6IG51bWJlcl06IFNldDxzdHJpbmc+fSk6IHZvaWQge1xuICAgIGNvbnN0IG9iaiA9IHJvb3RbcGF0aC5pbmRleE9yTmFtZV07XG4gICAgaWYgKGlzUHJveHlhYmxlKG9iaikpIHtcbiAgICAgIGlmIChwYXRoLmlzR3Jvd2luZyAmJiBnZXRQcm94eVN0YXR1cyhvYmopID09PSBQcm94eVN0YXR1cy5JU19QUk9YWSkge1xuICAgICAgICBjb25zdCBtYXAgPSBnZXRQcm94eVN0YWNrVHJhY2VzKG9iaik7XG4gICAgICAgIGNvbnN0IHN0YWNrVHJhY2VzID0gc3RhY2tzTWFwW3BhdGguaWRdID8gc3RhY2tzTWFwW3BhdGguaWRdIDogbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgICAgIG1hcC5mb3JFYWNoKCh2LCBrKSA9PiB7XG4gICAgICAgICAgdi5mb3JFYWNoKChzKSA9PiBzdGFja1RyYWNlcy5hZGQocykpO1xuICAgICAgICB9KTtcbiAgICAgICAgc3RhY2tzTWFwW3BhdGguaWRdID0gc3RhY2tUcmFjZXM7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGNoaWxkcmVuID0gcGF0aC5jaGlsZHJlbjtcbiAgICAgIGlmIChjaGlsZHJlbikge1xuICAgICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIGNoaWxkcmVuKSB7XG4gICAgICAgICAgZ2V0U3RhY2tUcmFjZXMob2JqLCBjaGlsZCwgc3RhY2tzTWFwKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGdldERPTVN0YWNrVHJhY2VzKHJvb3Q6IGFueSwgcGF0aDogSVBhdGhUcmVlLCBzdGFja3NNYXA6IHtbaWQ6IG51bWJlcl06IFNldDxzdHJpbmc+fSk6IHZvaWQge1xuICAgIGxldCBvYmo6IGFueTtcbiAgICBsZXQgc3dpdGNoVG9SZWd1bGFyVHJlZSA9IGZhbHNlO1xuICAgIHN3aXRjaCAocGF0aC5pbmRleE9yTmFtZSkge1xuICAgICAgY2FzZSBcIiQkJERPTSQkJFwiOlxuICAgICAgICBvYmogPSBkb2N1bWVudDtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdyb290JzpcbiAgICAgICAgc3dpdGNoVG9SZWd1bGFyVHJlZSA9IHRydWU7XG4gICAgICAgIG9iaiA9IHJvb3Q7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnY2hpbGROb2Rlcyc6XG4gICAgICAgIG9iaiA9IHJvb3RbcGF0aC5pbmRleE9yTmFtZV07XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgb2JqID0gcm9vdFsoPHN0cmluZz4gcGF0aC5pbmRleE9yTmFtZSkuc2xpY2UoTk9ERV9QUk9QX1BSRUZJWC5sZW5ndGgpXTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgaWYgKGlzUHJveHlhYmxlKG9iaikgJiYgcGF0aC5pc0dyb3dpbmcpIHtcbiAgICAgIGNvbnN0IHdyYXBwZWRPYmogPSB3cmFwSWZPcmlnaW5hbChvYmopO1xuICAgICAgaWYgKGdldFByb3h5U3RhdHVzKHdyYXBwZWRPYmopID09PSBQcm94eVN0YXR1cy5JU19QUk9YWSkge1xuICAgICAgICBjb25zdCBtYXAgPSBnZXRQcm94eVN0YWNrVHJhY2VzKHdyYXBwZWRPYmopO1xuICAgICAgICBjb25zdCBzdGFja1RyYWNlcyA9IHN0YWNrc01hcFtwYXRoLmlkXSA/IHN0YWNrc01hcFtwYXRoLmlkXSA6IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgICAgICBtYXAuZm9yRWFjaCgodiwgaykgPT4ge1xuICAgICAgICAgIHYuZm9yRWFjaCgocykgPT4gc3RhY2tUcmFjZXMuYWRkKHMpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHN0YWNrc01hcFtwYXRoLmlkXSA9IHN0YWNrVHJhY2VzO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIENhcHR1cmUgd3JpdGVzIG9mIGNoaWxkcmVuLlxuICAgIGNvbnN0IGNoaWxkcmVuID0gcGF0aC5jaGlsZHJlbjtcbiAgICBjb25zdCBnZXRTdGFja1RyYWNlc0Z1bmN0aW9uID0gc3dpdGNoVG9SZWd1bGFyVHJlZSA/IGdldFN0YWNrVHJhY2VzIDogZ2V0RE9NU3RhY2tUcmFjZXM7XG4gICAgaWYgKGNoaWxkcmVuKSB7XG4gICAgICBjb25zdCBsZW4gPSBjaGlsZHJlbi5sZW5ndGg7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGNoaWxkID0gY2hpbGRyZW5baV07XG4gICAgICAgIGdldFN0YWNrVHJhY2VzRnVuY3Rpb24ob2JqLCBjaGlsZCwgc3RhY2tzTWFwKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiAkJCRHRVRfU1RBQ0tfVFJBQ0VTJCQkKCk6IEdyb3dpbmdTdGFja1RyYWNlcyB7XG4gICAgY29uc3Qgc3RhY2tzTWFwOiB7W2lkOiBudW1iZXJdOiBTZXQ8c3RyaW5nPn0gPSB7fTtcbiAgICBmb3IgKGNvbnN0IHRyZWUgb2YgaW5zdHJ1bWVudGVkVHJlZXMpIHtcbiAgICAgIGlmIChpc0RPTVJvb3QodHJlZSkpIHtcbiAgICAgICAgZ2V0RE9NU3RhY2tUcmFjZXMoUk9PVC4kJCRHTE9CQUwkJCQsIHRyZWUsIHN0YWNrc01hcCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBnZXRTdGFja1RyYWNlcyhST09ULiQkJEdMT0JBTCQkJCwgdHJlZSwgc3RhY2tzTWFwKTtcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3QganNvbmFibGVTdGFja3NNYXA6IEdyb3dpbmdTdGFja1RyYWNlcyA9IHt9O1xuICAgIGZvciAoY29uc3Qgc3RyaW5nSWQgaW4gc3RhY2tzTWFwKSB7XG4gICAgICBpZiAoc3RhY2tzTWFwLmhhc093blByb3BlcnR5KHN0cmluZ0lkKSkge1xuICAgICAgICBjb25zdCBpZCA9IHBhcnNlSW50KHN0cmluZ0lkLCAxMCk7XG4gICAgICAgIGNvbnN0IHN0YWNrcyA9IHN0YWNrc01hcFtpZF07XG4gICAgICAgIGxldCBpID0gMDtcbiAgICAgICAgY29uc3Qgc3RhY2tBcnJheSA9IG5ldyBBcnJheTxzdHJpbmc+KHN0YWNrcy5zaXplKTtcbiAgICAgICAgc3RhY2tzLmZvckVhY2goKHMpID0+IHtcbiAgICAgICAgICBzdGFja0FycmF5W2krK10gPSBzO1xuICAgICAgICB9KVxuICAgICAgICBqc29uYWJsZVN0YWNrc01hcFtpZF0gPSBzdGFja0FycmF5O1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4ganNvbmFibGVTdGFja3NNYXA7XG4gIH1cblxuICBpZiAoSVNfV0lORE9XIHx8IElTX1dPUktFUikge1xuICAgIC8vIERpc2FibGUgdGhlc2UgaW4gTm9kZUpTLlxuXG4gICAgLypjb25zdCBkb2N1bWVudFdyaXRlID0gRG9jdW1lbnQucHJvdG90eXBlLndyaXRlO1xuICAgIERvY3VtZW50LnByb3RvdHlwZS53cml0ZSA9IGZ1bmN0aW9uKHRoaXM6IERvY3VtZW50LCBzdHI6IHN0cmluZyk6IHZvaWQge1xuICAgICAgY29uc3QgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgICB4aHIub3BlbignUE9TVCcsICcvZXZhbEh0bWwnLCBmYWxzZSk7XG4gICAgICB4aHIuc2VuZChzdHIpO1xuICAgICAgcmV0dXJuIGRvY3VtZW50V3JpdGUuY2FsbCh0aGlzLCB4aHIucmVzcG9uc2VUZXh0KTtcbiAgICB9O1xuICAgIERvY3VtZW50LnByb3RvdHlwZS53cml0ZWxuID0gZnVuY3Rpb24odGhpczogRG9jdW1lbnQsIHN0cjogc3RyaW5nKTogdm9pZCB7XG4gICAgICByZXR1cm4gdGhpcy53cml0ZShzdHIpO1xuICAgIH07Ki9cblxuICAgIGNvbnN0IGFkZEV2ZW50TGlzdGVuZXIgPSBFdmVudFRhcmdldC5wcm90b3R5cGUuYWRkRXZlbnRMaXN0ZW5lcjtcbiAgICBjb25zdCByZW1vdmVFdmVudExpc3RlbmVyID0gRXZlbnRUYXJnZXQucHJvdG90eXBlLnJlbW92ZUV2ZW50TGlzdGVuZXI7XG4gICAgRXZlbnRUYXJnZXQucHJvdG90eXBlLmFkZEV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbih0aGlzOiBFdmVudFRhcmdldCwgdHlwZTogc3RyaW5nLCBsaXN0ZW5lcjogRXZlbnRMaXN0ZW5lck9yRXZlbnRMaXN0ZW5lck9iamVjdCwgdXNlQ2FwdHVyZTogYm9vbGVhbiA9IGZhbHNlKSB7XG4gICAgICBhZGRFdmVudExpc3RlbmVyLmFwcGx5KHVud3JhcElmUHJveHkodGhpcyksIGFyZ3VtZW50cyk7XG4gICAgICBpZiAoIXRoaXMuJCRsaXN0ZW5lcnMpIHtcbiAgICAgICAgdGhpcy4kJGxpc3RlbmVycyA9IHt9O1xuICAgICAgfVxuICAgICAgbGV0IGxpc3RlbmVycyA9IHRoaXMuJCRsaXN0ZW5lcnNbdHlwZV07XG4gICAgICBpZiAoIWxpc3RlbmVycykge1xuICAgICAgICBsaXN0ZW5lcnMgPSB0aGlzLiQkbGlzdGVuZXJzW3R5cGVdID0gW107XG4gICAgICB9XG4gICAgICBmb3IgKGNvbnN0IGxpc3RlbmVySW5mbyBvZiBsaXN0ZW5lcnMpIHtcbiAgICAgICAgaWYgKGxpc3RlbmVySW5mby5saXN0ZW5lciA9PT0gbGlzdGVuZXIgJiYgKHR5cGVvZihsaXN0ZW5lckluZm8udXNlQ2FwdHVyZSkgPT09ICdib29sZWFuJyA/IGxpc3RlbmVySW5mby51c2VDYXB0dXJlID09PSB1c2VDYXB0dXJlIDogdHJ1ZSkpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGxpc3RlbmVycy5wdXNoKHtcbiAgICAgICAgbGlzdGVuZXI6IGxpc3RlbmVyLFxuICAgICAgICB1c2VDYXB0dXJlOiB1c2VDYXB0dXJlXG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgRXZlbnRUYXJnZXQucHJvdG90eXBlLnJlbW92ZUV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbih0aGlzOiBFdmVudFRhcmdldCwgdHlwZTogc3RyaW5nLCBsaXN0ZW5lcjogRXZlbnRMaXN0ZW5lck9yRXZlbnRMaXN0ZW5lck9iamVjdCwgdXNlQ2FwdHVyZTogYm9vbGVhbiB8IG9iamVjdCA9IGZhbHNlKSB7XG4gICAgICByZW1vdmVFdmVudExpc3RlbmVyLmFwcGx5KHVud3JhcElmUHJveHkodGhpcyksIGFyZ3VtZW50cyk7XG4gICAgICBpZiAodGhpcy4kJGxpc3RlbmVycykge1xuICAgICAgICBjb25zdCBsaXN0ZW5lcnMgPSB0aGlzLiQkbGlzdGVuZXJzW3R5cGVdO1xuICAgICAgICBpZiAobGlzdGVuZXJzKSB7XG4gICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaXN0ZW5lcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGxJbmZvID0gbGlzdGVuZXJzW2ldO1xuICAgICAgICAgICAgaWYgKGxJbmZvLmxpc3RlbmVyID09PSBsaXN0ZW5lciAmJiAodHlwZW9mKGxJbmZvLnVzZUNhcHR1cmUpID09PSAnYm9vbGVhbicgPyBsSW5mby51c2VDYXB0dXJlID09PSB1c2VDYXB0dXJlIDogdHJ1ZSkpIHtcbiAgICAgICAgICAgICAgbGlzdGVuZXJzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgaWYgKGxpc3RlbmVycy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy4kJGxpc3RlbmVyc1t0eXBlXTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcblxuICAgIC8vIEFycmF5IG1vZGVsaW5nXG4gICAgQXJyYXkucHJvdG90eXBlLnB1c2ggPSAoZnVuY3Rpb24ocHVzaCkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKHRoaXM6IEFycmF5PGFueT4sIC4uLml0ZW1zOiBhbnlbXSk6IG51bWJlciB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgZGlzYWJsZVByb3hpZXMgPSB0cnVlO1xuICAgICAgICAgIGlmIChnZXRQcm94eVN0YXR1cyh0aGlzKSA9PT0gUHJveHlTdGF0dXMuSVNfUFJPWFkpIHtcbiAgICAgICAgICAgIGNvbnN0IG1hcDogR3Jvd3RoT2JqZWN0U3RhY2tUcmFjZXMgPSBnZXRQcm94eVN0YWNrVHJhY2VzKHRoaXMpO1xuICAgICAgICAgICAgY29uc3QgdHJhY2UgPSBfZ2V0U3RhY2tUcmFjZSgpO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpdGVtcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICBfYWRkU3RhY2tUcmFjZShtYXAsIGAke3RoaXMubGVuZ3RoICsgaX1gLCB0cmFjZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBwdXNoLmFwcGx5KHRoaXMsIGl0ZW1zKTtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICBkaXNhYmxlUHJveGllcyA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0pKEFycmF5LnByb3RvdHlwZS5wdXNoKTtcblxuICAgIEFycmF5LnByb3RvdHlwZS51bnNoaWZ0ID0gKGZ1bmN0aW9uKHVuc2hpZnQpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbih0aGlzOiBBcnJheTxhbnk+LCAuLi5pdGVtczogYW55W10pOiBudW1iZXIge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGRpc2FibGVQcm94aWVzID0gdHJ1ZTtcbiAgICAgICAgICBpZiAoZ2V0UHJveHlTdGF0dXModGhpcykgPT09IFByb3h5U3RhdHVzLklTX1BST1hZKSB7XG4gICAgICAgICAgICBjb25zdCBtYXA6IEdyb3d0aE9iamVjdFN0YWNrVHJhY2VzID0gZ2V0UHJveHlTdGFja1RyYWNlcyh0aGlzKTtcbiAgICAgICAgICAgIGNvbnN0IG5ld0l0ZW1MZW4gPSBpdGVtcy5sZW5ndGg7XG4gICAgICAgICAgICBjb25zdCB0cmFjZSA9IF9nZXRTdGFja1RyYWNlKCk7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gaXRlbXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgICAgX2NvcHlTdGFja3MobWFwLCBgJHtpfWAsIGAke2kgKyBuZXdJdGVtTGVufWApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpdGVtcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICBfcmVtb3ZlU3RhY2tzKG1hcCwgYCR7aX1gKTtcbiAgICAgICAgICAgICAgX2FkZFN0YWNrVHJhY2UobWFwLCBgJHtpfWAsIHRyYWNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHVuc2hpZnQuYXBwbHkodGhpcywgaXRlbXMpO1xuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgIGRpc2FibGVQcm94aWVzID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSkoQXJyYXkucHJvdG90eXBlLnVuc2hpZnQpO1xuXG4gICAgQXJyYXkucHJvdG90eXBlLnBvcCA9IChmdW5jdGlvbihwb3ApIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbih0aGlzOiBBcnJheTxhbnk+KTogYW55IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBkaXNhYmxlUHJveGllcyA9IHRydWU7XG4gICAgICAgICAgaWYgKGdldFByb3h5U3RhdHVzKHRoaXMpID09PSBQcm94eVN0YXR1cy5JU19QUk9YWSkge1xuICAgICAgICAgICAgY29uc3QgbWFwOiBHcm93dGhPYmplY3RTdGFja1RyYWNlcyA9IGdldFByb3h5U3RhY2tUcmFjZXModGhpcyk7XG4gICAgICAgICAgICBfcmVtb3ZlU3RhY2tzKG1hcCwgYCR7dGhpcy5sZW5ndGggLSAxfWApO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcG9wLmFwcGx5KHRoaXMpO1xuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgIGRpc2FibGVQcm94aWVzID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSkoQXJyYXkucHJvdG90eXBlLnBvcCk7XG5cbiAgICBBcnJheS5wcm90b3R5cGUuc2hpZnQgPSAoZnVuY3Rpb24oc2hpZnQpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbih0aGlzOiBBcnJheTxhbnk+KTogYW55IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBkaXNhYmxlUHJveGllcyA9IHRydWU7XG4gICAgICAgICAgaWYgKGdldFByb3h5U3RhdHVzKHRoaXMpID09PSBQcm94eVN0YXR1cy5JU19QUk9YWSkge1xuICAgICAgICAgICAgY29uc3QgbWFwOiBHcm93dGhPYmplY3RTdGFja1RyYWNlcyA9IGdldFByb3h5U3RhY2tUcmFjZXModGhpcyk7XG4gICAgICAgICAgICBfcmVtb3ZlU3RhY2tzKG1hcCwgXCIwXCIpO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgIF9jb3B5U3RhY2tzKG1hcCwgYCR7aX1gLCBgJHtpIC0gMX1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF9yZW1vdmVTdGFja3MobWFwLCBgJHt0aGlzLmxlbmd0aCAtIDF9YCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBzaGlmdC5hcHBseSh0aGlzKTtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICBkaXNhYmxlUHJveGllcyA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0pKEFycmF5LnByb3RvdHlwZS5zaGlmdCk7XG5cbiAgICBBcnJheS5wcm90b3R5cGUuc3BsaWNlID0gKGZ1bmN0aW9uKHNwbGljZSkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKHRoaXM6IEFycmF5PGFueT4sIHN0YXJ0OiBudW1iZXIsIGRlbGV0ZUNvdW50OiBudW1iZXIsIC4uLml0ZW1zOiBhbnlbXSk6IGFueSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgZGlzYWJsZVByb3hpZXMgPSB0cnVlO1xuICAgICAgICAgIGlmIChnZXRQcm94eVN0YXR1cyh0aGlzKSA9PT0gUHJveHlTdGF0dXMuSVNfUFJPWFkpIHtcbiAgICAgICAgICAgIGNvbnN0IG1hcDogR3Jvd3RoT2JqZWN0U3RhY2tUcmFjZXMgPSBnZXRQcm94eVN0YWNrVHJhY2VzKHRoaXMpO1xuICAgICAgICAgICAgbGV0IGFjdHVhbFN0YXJ0ID0gc3RhcnQgfCAwO1xuICAgICAgICAgICAgaWYgKGFjdHVhbFN0YXJ0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gSWYgZ3JlYXRlciB0aGFuIHRoZSBsZW5ndGggb2YgdGhlIGFycmF5LCBhY3R1YWwgc3RhcnRpbmcgaW5kZXggd2lsbCBiZSBzZXQgdG8gdGhlIGxlbmd0aCBvZiB0aGUgYXJyYXkuXG4gICAgICAgICAgICBpZiAoYWN0dWFsU3RhcnQgPiB0aGlzLmxlbmd0aCkge1xuICAgICAgICAgICAgICBhY3R1YWxTdGFydCA9IHRoaXMubGVuZ3RoO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gSWYgbmVnYXRpdmUsIHdpbGwgYmVnaW4gdGhhdCBtYW55IGVsZW1lbnRzIGZyb20gdGhlIGVuZCBvZiB0aGUgYXJyYXkgKHdpdGggb3JpZ2luIDEpXG4gICAgICAgICAgICAvLyBhbmQgd2lsbCBiZSBzZXQgdG8gMCBpZiBhYnNvbHV0ZSB2YWx1ZSBpcyBncmVhdGVyIHRoYW4gdGhlIGxlbmd0aCBvZiB0aGUgYXJyYXkuXG4gICAgICAgICAgICBpZiAoYWN0dWFsU3RhcnQgPCAwKSB7XG4gICAgICAgICAgICAgIGFjdHVhbFN0YXJ0ID0gdGhpcy5sZW5ndGggKyBhY3R1YWxTdGFydDtcbiAgICAgICAgICAgICAgaWYgKGFjdHVhbFN0YXJ0IDwgMCkge1xuICAgICAgICAgICAgICAgIGFjdHVhbFN0YXJ0ID0gMDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IGFjdHVhbERlbGV0ZUNvdW50ID0gZGVsZXRlQ291bnQgfCAwO1xuICAgICAgICAgICAgLy8gSWYgZGVsZXRlQ291bnQgaXMgb21pdHRlZCwgb3IgaWYgaXRzIHZhbHVlIGlzIGxhcmdlciB0aGFuIGFycmF5Lmxlbmd0aCAtIHN0YXJ0LFxuICAgICAgICAgICAgLy8gICB0aGVuIGFsbCBvZiB0aGUgZWxlbWVudHMgYmVnaW5uaW5nIHdpdGggc3RhcnQgaW5kZXggb24gdGhyb3VnaCB0aGUgZW5kIG9mIHRoZSBhcnJheSB3aWxsIGJlIGRlbGV0ZWQuXG4gICAgICAgICAgICBpZiAoZGVsZXRlQ291bnQgPT09IHVuZGVmaW5lZCB8fCBhY3R1YWxEZWxldGVDb3VudCA+IHRoaXMubGVuZ3RoIC0gYWN0dWFsU3RhcnQpIHtcbiAgICAgICAgICAgICAgYWN0dWFsRGVsZXRlQ291bnQgPSB0aGlzLmxlbmd0aCAtIGFjdHVhbFN0YXJ0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGFjdHVhbERlbGV0ZUNvdW50IDwgMCkge1xuICAgICAgICAgICAgICBhY3R1YWxEZWxldGVDb3VudCA9IDA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYWN0dWFsRGVsZXRlQ291bnQ7IGkrKykge1xuICAgICAgICAgICAgICBjb25zdCBpbmRleCA9IGFjdHVhbFN0YXJ0ICsgaTtcbiAgICAgICAgICAgICAgX3JlbW92ZVN0YWNrcyhtYXAsIGAke2luZGV4fWApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBNb3ZlIGV4aXN0aW5nIHRyYWNlcyBpbnRvIG5ldyBsb2NhdGlvbnMuXG4gICAgICAgICAgICBjb25zdCBuZXdJdGVtQ291bnQgPSBpdGVtcy5sZW5ndGg7XG4gICAgICAgICAgICBpZiAobmV3SXRlbUNvdW50ID4gYWN0dWFsRGVsZXRlQ291bnQpIHtcbiAgICAgICAgICAgICAgLy8gU2hpZnQgKnVwd2FyZCpcbiAgICAgICAgICAgICAgY29uc3QgZGVsdGEgPSBuZXdJdGVtQ291bnQgLSBhY3R1YWxEZWxldGVDb3VudDtcbiAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IHRoaXMubGVuZ3RoIC0gMTsgaSA+PSBhY3R1YWxTdGFydCArIGFjdHVhbERlbGV0ZUNvdW50OyBpLS0pIHtcbiAgICAgICAgICAgICAgICBfY29weVN0YWNrcyhtYXAsIGAke2l9YCwgYCR7aSArIGRlbHRhfWApO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKG5ld0l0ZW1Db3VudCA8IGFjdHVhbERlbGV0ZUNvdW50KSB7XG4gICAgICAgICAgICAgIC8vIFNoaWZ0ICpkb3dud2FyZCpcbiAgICAgICAgICAgICAgY29uc3QgZGVsdGEgPSBuZXdJdGVtQ291bnQgLSBhY3R1YWxEZWxldGVDb3VudDtcbiAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IGFjdHVhbFN0YXJ0ICsgYWN0dWFsRGVsZXRlQ291bnQ7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgX2NvcHlTdGFja3MobWFwLCBgJHtpfWAsIGAke2kgKyBkZWx0YX1gKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAvLyBEZWxldGUgZXh0cmEgdHJhY2VzIGZvciByZW1vdmVkIGluZGV4ZXMuXG4gICAgICAgICAgICAgIGZvciAobGV0IGkgPSB0aGlzLmxlbmd0aCArIGRlbHRhOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIF9yZW1vdmVTdGFja3MobWFwLCBgJHtpfWApO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHRyYWNlID0gX2dldFN0YWNrVHJhY2UoKTtcbiAgICAgICAgICAgIC8vIEFkZCBuZXcgdHJhY2VzIGZvciBuZXcgaXRlbXMuXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5ld0l0ZW1Db3VudDsgaSsrKSB7XG4gICAgICAgICAgICAgIF9yZW1vdmVTdGFja3MobWFwLCBgJHthY3R1YWxTdGFydCArIGl9YCk7XG4gICAgICAgICAgICAgIF9hZGRTdGFja1RyYWNlKG1hcCwgYCR7YWN0dWFsU3RhcnQgKyBpfWAsIHRyYWNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHNwbGljZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgIGRpc2FibGVQcm94aWVzID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSkoQXJyYXkucHJvdG90eXBlLnNwbGljZSk7XG5cbiAgICAvLyBNYWtlIGluZGV4T2YgdXNlICQkJFNFUSQkJFxuICAgIEFycmF5LnByb3RvdHlwZS5pbmRleE9mID0gZnVuY3Rpb24odGhpczogQXJyYXk8YW55Piwgc2VhcmNoRWxlbWVudCwgZnJvbUluZGV4QXJnPzogbnVtYmVyKTogYW55IHtcbiAgICAgIGxldCBmcm9tSW5kZXggPSBmcm9tSW5kZXhBcmcgfHwgMDtcbiAgICAgIC8vIElmIHRoZSBwcm92aWRlZCBpbmRleCB2YWx1ZSBpcyBhIG5lZ2F0aXZlIG51bWJlciwgaXQgaXMgdGFrZW4gYXMgdGhlIG9mZnNldCBmcm9tIHRoZSBlbmQgb2YgdGhlIGFycmF5LlxuICAgICAgLy8gVGhlIGFycmF5IGlzIHN0aWxsIHNlYXJjaGVkIGZyb20gZnJvbnQgdG8gYmFjay5cbiAgICAgIGlmIChmcm9tSW5kZXggPCAwKSB7XG4gICAgICAgIGZyb21JbmRleCA9IHRoaXMubGVuZ3RoICsgZnJvbUluZGV4O1xuICAgICAgfVxuICAgICAgLy8gSWYgdGhlIGNhbGN1bGF0ZWQgaW5kZXggaXMgbGVzcyB0aGFuIDAsIHRoZW4gdGhlIHdob2xlIGFycmF5IHdpbGwgYmUgc2VhcmNoZWQuXG4gICAgICBpZiAoZnJvbUluZGV4IDwgMCkge1xuICAgICAgICBmcm9tSW5kZXggPSAwO1xuICAgICAgfVxuICAgICAgLy8gSWYgdGhlIGluZGV4IGlzIGdyZWF0ZXIgdGhhbiBvciBlcXVhbCB0byB0aGUgYXJyYXkncyBsZW5ndGgsIC0xIGlzIHJldHVybmVkLCB3aGljaCBtZWFucyB0aGUgYXJyYXkgd2lsbCBub3QgYmUgc2VhcmNoZWQuXG4gICAgICBpZiAoZnJvbUluZGV4ID49IHRoaXMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiAtMTtcbiAgICAgIH1cblxuICAgICAgZm9yICg7IGZyb21JbmRleCA8IHRoaXMubGVuZ3RoOyBmcm9tSW5kZXgrKykge1xuICAgICAgICBpZiAoJCQkU0VRJCQkKHRoaXNbZnJvbUluZGV4XSwgc2VhcmNoRWxlbWVudCkpIHtcbiAgICAgICAgICByZXR1cm4gZnJvbUluZGV4O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gLTE7XG4gICAgfTtcblxuICAgIEFycmF5LnByb3RvdHlwZS5sYXN0SW5kZXhPZiA9IGZ1bmN0aW9uKHRoaXM6IGFueVtdLCBzZWFyY2hFbGVtZW50OiBhbnksIGZyb21JbmRleCA9IDApOiBudW1iZXIge1xuICAgICAgaWYgKHRoaXMgPT09IHZvaWQgMCB8fCB0aGlzID09PSBudWxsKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcbiAgICAgIH1cblxuICAgICAgbGV0IHQgPSBPYmplY3QodGhpcyksXG4gICAgICAgIGxlbiA9IHQubGVuZ3RoID4+PiAwO1xuICAgICAgaWYgKGxlbiA9PT0gMCkge1xuICAgICAgICByZXR1cm4gLTE7XG4gICAgICB9XG5cbiAgICAgIGxldCBuID0gbGVuIC0gMTtcbiAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBuID0gTnVtYmVyKGFyZ3VtZW50c1sxXSk7XG4gICAgICAgIGlmIChuICE9IG4pIHtcbiAgICAgICAgICBuID0gMDtcbiAgICAgICAgfSBlbHNlIGlmIChuICE9IDAgJiYgbiAhPSAoMSAvIDApICYmIG4gIT0gLSgxIC8gMCkpIHtcbiAgICAgICAgICBuID0gKG4gPiAwID8gMSA6IC0xKSAqIE1hdGguZmxvb3IoTWF0aC5hYnMobikpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGZvciAobGV0IGsgPSBuID49IDAgPyBNYXRoLm1pbihuLCBsZW4gLSAxKSA6IGxlbiAtIE1hdGguYWJzKG4pOyBrID49IDA7IGstLSkge1xuICAgICAgICBpZiAoayBpbiB0ICYmICQkJFNFUSQkJCh0W2tdLCBzZWFyY2hFbGVtZW50KSkge1xuICAgICAgICAgIHJldHVybiBrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gLTE7XG4gICAgfTtcblxuICAgIC8vIFRPRE86IFNvcnQsIHJldmVyc2UsIC4uLlxuXG4gICAgLy8gRGV0ZXJtaW5pc3RpYyBNYXRoLnJhbmRvbSgpLCBzbyBqUXVlcnkgdmFyaWFibGUgaXMgZGV0ZXJtaW5pc3RpYy5cbiAgICAvLyBGcm9tIGh0dHBzOi8vZ2lzdC5naXRodWIuY29tL21hdGhpYXNieW5lbnMvNTY3MDkxN1xuICAgIE1hdGgucmFuZG9tID0gKGZ1bmN0aW9uKCkge1xuICAgICAgbGV0IHNlZWQgPSAweDJGNkUyQjE7XG4gICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIFJvYmVydCBKZW5raW5z4oCZIDMyIGJpdCBpbnRlZ2VyIGhhc2ggZnVuY3Rpb25cbiAgICAgICAgc2VlZCA9ICgoc2VlZCArIDB4N0VENTVEMTYpICsgKHNlZWQgPDwgMTIpKSAgJiAweEZGRkZGRkZGO1xuICAgICAgICBzZWVkID0gKChzZWVkIF4gMHhDNzYxQzIzQykgXiAoc2VlZCA+Pj4gMTkpKSAmIDB4RkZGRkZGRkY7XG4gICAgICAgIHNlZWQgPSAoKHNlZWQgKyAweDE2NTY2N0IxKSArIChzZWVkIDw8IDUpKSAgICYgMHhGRkZGRkZGRjtcbiAgICAgICAgc2VlZCA9ICgoc2VlZCArIDB4RDNBMjY0NkMpIF4gKHNlZWQgPDwgOSkpICAgJiAweEZGRkZGRkZGO1xuICAgICAgICBzZWVkID0gKChzZWVkICsgMHhGRDcwNDZDNSkgKyAoc2VlZCA8PCAzKSkgICAmIDB4RkZGRkZGRkY7XG4gICAgICAgIHNlZWQgPSAoKHNlZWQgXiAweEI1NUE0RjA5KSBeIChzZWVkID4+PiAxNikpICYgMHhGRkZGRkZGRjtcbiAgICAgICAgcmV0dXJuIChzZWVkICYgMHhGRkZGRkZGKSAvIDB4MTAwMDAwMDA7XG4gICAgICB9O1xuICAgIH0oKSk7XG5cbiAgICAvLyBEZXRlcm1pbmlzdGljIERhdGUubm93KCksIHNvIFlVSSB2YXJpYWJsZSBpcyBkZXRlcm1pbmlzdGljLlxuICAgIGxldCBkYXRlTm93Q291bnQgPSAwO1xuICAgIERhdGUubm93ID0gRGF0ZS5wcm90b3R5cGUuZ2V0VGltZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIDE1MTY5OTI1MTI0MjUgKyAoZGF0ZU5vd0NvdW50KyspO1xuICAgIH07XG5cbiAgICAvLyBpbnRlcmZhY2UgQ291bnQge2dldDogbnVtYmVyOyBzZXQ6IG51bWJlcjsgaW52b2tlZDogbnVtYmVyIH1cblxuICAgIC8qKlxuICAgICAqIFtERUJVR10gSW5zdGFsbHMgYSBjb3VudGVyIG9uIGEgcGFydGljdWxhciBvYmplY3QgcHJvcGVydHkuXG4gICAgICogQHBhcmFtIG9ialxuICAgICAqIEBwYXJhbSBwcm9wZXJ0eVxuICAgICAqIEBwYXJhbSBrZXlcbiAgICAgKiBAcGFyYW0gY291bnRNYXBcbiAgICAgKi9cbiAgICAvKmZ1bmN0aW9uIGNvdW50UHJvcGVydHlBY2Nlc3NlcyhvYmo6IGFueSwgcHJvcGVydHk6IHN0cmluZywga2V5OiBzdHJpbmcsIGNvdW50TWFwOiBNYXA8c3RyaW5nLCBDb3VudD4pOiB2b2lkIHtcbiAgICAgIGxldCBjb3VudDogQ291bnQgPSB7IGdldDogMCwgc2V0OiAwLCBpbnZva2VkOiAwfTtcbiAgICAgIGNvbnN0IG9yaWdpbmFsID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihvYmosIHByb3BlcnR5KTtcbiAgICAgIHRyeSB7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmosIHByb3BlcnR5LCB7XG4gICAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNvdW50LmdldCsrO1xuICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBvcmlnaW5hbC5nZXQgPyBvcmlnaW5hbC5nZXQuYXBwbHkodGhpcykgOiBvcmlnaW5hbC52YWx1ZTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YodmFsdWUpID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHRoaXM6IGFueSkge1xuICAgICAgICAgICAgICAgIGNvdW50Lmludm9rZWQrKztcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICAgIHNldDogZnVuY3Rpb24odikge1xuICAgICAgICAgICAgY291bnQuc2V0Kys7XG4gICAgICAgICAgICBpZiAob3JpZ2luYWwuc2V0KSB7XG4gICAgICAgICAgICAgIHJldHVybiBvcmlnaW5hbC5zZXQuY2FsbCh0aGlzLCB2KTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAob3JpZ2luYWwud3JpdGFibGUpIHtcbiAgICAgICAgICAgICAgb3JpZ2luYWwudmFsdWUgPSB2O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gT3RoZXJ3aXNlOiBOT1AuXG4gICAgICAgICAgfSxcbiAgICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgICAgfSk7XG4gICAgICAgIGNvdW50TWFwLnNldChrZXksIGNvdW50KTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgbG9nVG9Db25zb2xlKGBVbmFibGUgdG8gaW5zdHJ1bWVudCAke2tleX1gKTtcbiAgICAgIH1cbiAgICB9Ki9cblxuICAgIC8qKlxuICAgICAqIEludGVycG9zZXMgb24gYSBwYXJ0aWN1bGFyIEFQSSB0byByZXR1cm4gcHJveHkgb2JqZWN0cyBmb3Igb2JqZWN0cyB3aXRoIHByb3hpZXMgYW5kIHVud3JhcCBhcmd1bWVudHMgdGhhdCBhcmUgcHJveGllcy5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBwcm94eUludGVycG9zaXRpb24ob2JqOiBhbnksIHByb3BlcnR5OiBzdHJpbmcsIGtleTogc3RyaW5nKTogdm9pZCB7XG4gICAgICBjb25zdCBvcmlnaW5hbCA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Iob2JqLCBwcm9wZXJ0eSk7XG4gICAgICBpZiAoIW9yaWdpbmFsLmNvbmZpZ3VyYWJsZSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB0cnkge1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqLCBwcm9wZXJ0eSwge1xuICAgICAgICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjb25zdCB2YWx1ZSA9IG9yaWdpbmFsLmdldCA/IG9yaWdpbmFsLmdldC5hcHBseSh1bndyYXBJZlByb3h5KHRoaXMpKSA6IG9yaWdpbmFsLnZhbHVlO1xuICAgICAgICAgICAgaWYgKHR5cGVvZih2YWx1ZSkgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24odGhpczogYW55LCAuLi5hcmdzOiBhbnlbXSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB3cmFwSWZPcmlnaW5hbCh1bndyYXBJZlByb3h5KHZhbHVlKS5hcHBseSh1bndyYXBJZlByb3h5KHRoaXMpLCBhcmdzLm1hcCh1bndyYXBJZlByb3h5KSkpO1xuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHdyYXBJZk9yaWdpbmFsKHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICAgIHNldDogZnVuY3Rpb24odikge1xuICAgICAgICAgICAgY29uc3Qgb3JpZ2luYWxWID0gdW53cmFwSWZQcm94eSh2KTtcbiAgICAgICAgICAgIGlmIChvcmlnaW5hbC5zZXQpIHtcbiAgICAgICAgICAgICAgb3JpZ2luYWwuc2V0LmNhbGwodW53cmFwSWZQcm94eSh0aGlzKSwgb3JpZ2luYWxWKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAob3JpZ2luYWwud3JpdGFibGUpIHtcbiAgICAgICAgICAgICAgb3JpZ2luYWwudmFsdWUgPSBvcmlnaW5hbFY7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBPdGhlcndpc2U6IE5PUC5cbiAgICAgICAgICB9LFxuICAgICAgICAgIC8vIE1ha2UgaW50ZXJwb3NpdGlvbiBuZXN0YWJsZVxuICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgICB9KTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgbG9nVG9Db25zb2xlKGBVbmFibGUgdG8gaW5zdHJ1bWVudCAke2tleX1gKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJbnRlcnBvc2l0aW9uIFwib25bZXZlbnRuYW1lXVwiIHByb3BlcnRpZXMgYW5kIHN0b3JlIHZhbHVlIGFzIGFuIGV4cGFuZG9cbiAgICAgKiBwcm9wZXJ0eSBvbiBET00gZWxlbWVudCBzbyBpdCBzaG93cyB1cCBpbiB0aGUgaGVhcCBzbmFwc2hvdC5cbiAgICAgKiBAcGFyYW0gb2JqXG4gICAgICogQHBhcmFtIHByb3BOYW1lXG4gICAgICovXG4gICAgZnVuY3Rpb24gaW50ZXJwb3NpdGlvbkV2ZW50TGlzdGVuZXJQcm9wZXJ0eShvYmo6IG9iamVjdCwgcHJvcE5hbWU6IHN0cmluZyk6IHZvaWQge1xuICAgICAgY29uc3QgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Iob2JqLCBwcm9wTmFtZSk7XG4gICAgICBpZiAoZGVzYykge1xuICAgICAgICBkZWxldGUgZGVzY1sndmFsdWUnXTtcbiAgICAgICAgZGVsZXRlIGRlc2NbJ3dyaXRhYmxlJ107XG4gICAgICAgIGNvbnN0IHNldCA9IGRlc2Muc2V0O1xuICAgICAgICBkZXNjLnNldCA9IGZ1bmN0aW9uKHRoaXM6IGFueSwgdmFsOiBhbnkpIHtcbiAgICAgICAgICBzZXQuY2FsbCh0aGlzLCB2YWwpO1xuICAgICAgICAgIHRoaXNbYCQkJHtwcm9wTmFtZX1gXSA9IHZhbDtcbiAgICAgICAgfTtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iaiwgcHJvcE5hbWUsIGRlc2MpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChJU19XSU5ET1cpIHtcbiAgICAgIFtEb2N1bWVudC5wcm90b3R5cGUsIEVsZW1lbnQucHJvdG90eXBlLCBNZWRpYVF1ZXJ5TGlzdC5wcm90b3R5cGUsIEZpbGVSZWFkZXIucHJvdG90eXBlLFxuICAgICAgICBIVE1MQm9keUVsZW1lbnQucHJvdG90eXBlLCBIVE1MRWxlbWVudC5wcm90b3R5cGUsIEhUTUxGcmFtZVNldEVsZW1lbnQucHJvdG90eXBlLFxuICAgICAgICBBcHBsaWNhdGlvbkNhY2hlLnByb3RvdHlwZSwgLy9FdmVudFNvdXJjZS5wcm90b3R5cGUsIFNWR0FuaW1hdGlvbkVsZW1lbnQucHJvdG90eXBlLFxuICAgICAgICBTVkdFbGVtZW50LnByb3RvdHlwZSwgWE1MSHR0cFJlcXVlc3QucHJvdG90eXBlLCAvL1hNTEh0dHBSZXF1ZXN0RXZlbnRUYXJnZXQucHJvdG90eXBlLFxuICAgICAgICBXZWJTb2NrZXQucHJvdG90eXBlLCBJREJEYXRhYmFzZS5wcm90b3R5cGUsIElEQk9wZW5EQlJlcXVlc3QucHJvdG90eXBlLFxuICAgICAgICBJREJSZXF1ZXN0LnByb3RvdHlwZSwgSURCVHJhbnNhY3Rpb24ucHJvdG90eXBlLCB3aW5kb3ddLmZvckVhY2goKG9iaikgPT4ge1xuICAgICAgICAgIE9iamVjdC5rZXlzKG9iaikuZmlsdGVyKChwKSA9PiBwLnN0YXJ0c1dpdGgoXCJvblwiKSkuZm9yRWFjaCgocCkgPT4ge1xuICAgICAgICAgICAgaW50ZXJwb3NpdGlvbkV2ZW50TGlzdGVuZXJQcm9wZXJ0eShvYmosIHApO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgLy9jb25zdCBjb3VudE1hcCA9IG5ldyBNYXA8c3RyaW5nLCBDb3VudD4oKTtcbiAgICAgIFtbTm9kZS5wcm90b3R5cGUsIFwiTm9kZVwiXSwgW0VsZW1lbnQucHJvdG90eXBlLCBcIkVsZW1lbnRcIl0sIFtIVE1MRWxlbWVudC5wcm90b3R5cGUsIFwiSFRNTEVsZW1lbnRcIl0sXG4gICAgICBbRG9jdW1lbnQucHJvdG90eXBlLCBcIkRvY3VtZW50XCJdLCBbSFRNTENhbnZhc0VsZW1lbnQucHJvdG90eXBlLCBcIkhUTUxDYW52YXNFbGVtZW50XCJdLFxuICAgICAgW05vZGVMaXN0LnByb3RvdHlwZSwgXCJOb2RlTGlzdFwiXV1cbiAgICAgICAgLmZvckVhY2goKHYpID0+IE9iamVjdC5rZXlzKHZbMF0pLmZvckVhY2goKGspID0+IHByb3h5SW50ZXJwb3NpdGlvbih2WzBdLCBrLCBgJHt2WzFdfS4ke2t9YCkpKTtcblxuICAgICAgLy8gVE9ETzogUmVtb3ZlIGluc3RydW1lbnRhdGlvbiB3aGVuIGVsZW1lbnQgbW92ZWQ/XG5cbiAgICAgIGNvbnN0ICQkJFJFSU5TVFJVTUVOVCQkJCA9IGZ1bmN0aW9uKHRoaXM6IE5vZGUgfCBOb2RlTGlzdCk6IHZvaWQge1xuICAgICAgICBpZiAodGhpcy4kJCRUUkVFJCQkKSB7XG4gICAgICAgICAgaW5zdHJ1bWVudERPTVRyZWUodGhpcy4kJCRBQ0NFU1NfU1RSSU5HJCQkLCB0aGlzLCB0aGlzLiQkJFRSRUUkJCQsIF9nZXRTdGFja1RyYWNlKCkpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KE5vZGUucHJvdG90eXBlLCAnJCQkUkVJTlNUUlVNRU5UJCQkJywge1xuICAgICAgICB2YWx1ZTogJCQkUkVJTlNUUlVNRU5UJCQkLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgIH0pO1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KE5vZGVMaXN0LnByb3RvdHlwZSwgJyQkJFJFSU5TVFJVTUVOVCQkJCcsIHtcbiAgICAgICAgdmFsdWU6ICQkJFJFSU5TVFJVTUVOVCQkJCxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICB9KTtcblxuICAgICAgY29uc3QgdGV4dENvbnRlbnQgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKE5vZGUucHJvdG90eXBlLCAndGV4dENvbnRlbnQnKTtcbiAgICAgIC8vIHRleHRDb250ZW50OiBQYXNzIGluIGEgc3RyaW5nLiBSZXBsYWNlcyBhbGwgY2hpbGRyZW4gdy8gYSBzaW5nbGUgdGV4dCBub2RlLlxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KE5vZGUucHJvdG90eXBlLCAndGV4dENvbnRlbnQnLCB7XG4gICAgICAgIGdldDogdGV4dENvbnRlbnQuZ2V0LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKHRoaXM6IE5vZGUsIHY6IGFueSkge1xuICAgICAgICAgIGNvbnN0IHJ2ID0gdGV4dENvbnRlbnQuc2V0LmNhbGwodGhpcywgdik7XG4gICAgICAgICAgY29uc3QgY24gPSB0aGlzLmNoaWxkTm9kZXM7XG4gICAgICAgICAgaWYgKGdldFByb3h5U3RhdHVzKGNuKSA9PT0gUHJveHlTdGF0dXMuSVNfUFJPWFkpIHtcbiAgICAgICAgICAgIGNvbnN0IHRyYWNlcyA9IGdldFByb3h5U3RhY2tUcmFjZXMoY24pO1xuICAgICAgICAgICAgdHJhY2VzLmNsZWFyKCk7XG4gICAgICAgICAgICBfaW5pdGlhbGl6ZU1hcChjbiwgdHJhY2VzLCBfZ2V0U3RhY2tUcmFjZSgpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5jaGlsZE5vZGVzLiQkJFJFSU5TVFJVTUVOVCQkJCgpO1xuICAgICAgICAgIHJldHVybiBydjtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICB9KTtcblxuICAgICAgY29uc3QgYXBwZW5kQ2hpbGQgPSBOb2RlLnByb3RvdHlwZS5hcHBlbmRDaGlsZDtcbiAgICAgIE5vZGUucHJvdG90eXBlLmFwcGVuZENoaWxkID0gZnVuY3Rpb248VCBleHRlbmRzIE5vZGU+KHRoaXM6IE5vZGUsIG5ld0NoaWxkOiBUKTogVCB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgTm9kZS5hcHBlbmRDaGlsZCgpIG1ldGhvZCBhZGRzIGEgbm9kZSB0byB0aGUgZW5kIG9mIHRoZSBsaXN0IG9mIGNoaWxkcmVuIG9mIGEgc3BlY2lmaWVkIHBhcmVudCBub2RlLlxuICAgICAgICAgKiBJZiB0aGUgZ2l2ZW4gY2hpbGQgaXMgYSByZWZlcmVuY2UgdG8gYW4gZXhpc3Rpbmcgbm9kZSBpbiB0aGUgZG9jdW1lbnQsXG4gICAgICAgICAqIGFwcGVuZENoaWxkKCkgbW92ZXMgaXQgZnJvbSBpdHMgY3VycmVudCBwb3NpdGlvbiB0byB0aGUgbmV3IHBvc2l0aW9uLlxuICAgICAgICAgKi9cbiAgICAgICAgaWYgKG5ld0NoaWxkLnBhcmVudE5vZGUgIT09IG51bGwpIHtcbiAgICAgICAgICBuZXdDaGlsZC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKG5ld0NoaWxkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNuID0gdGhpcy5jaGlsZE5vZGVzO1xuICAgICAgICBpZiAoZ2V0UHJveHlTdGF0dXMoY24pID09PSBQcm94eVN0YXR1cy5JU19QUk9YWSkge1xuICAgICAgICAgIGNvbnN0IHRyYWNlcyA9IGdldFByb3h5U3RhY2tUcmFjZXMoY24pO1xuICAgICAgICAgIF9hZGRTdGFja1RyYWNlKHRyYWNlcywgYCR7Y24ubGVuZ3RofWApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcnYgPSBhcHBlbmRDaGlsZC5jYWxsKHRoaXMsIG5ld0NoaWxkKTtcbiAgICAgICAgY24uJCQkUkVJTlNUUlVNRU5UJCQkKCk7XG4gICAgICAgIHJldHVybiBydjtcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IGluc2VydEJlZm9yZSA9IE5vZGUucHJvdG90eXBlLmluc2VydEJlZm9yZTtcbiAgICAgIC8vIGluc2VydEJlZm9yZTogVGFrZXMgTm9kZXMuIE1vZGlmaWVzIERPTS5cbiAgICAgIE5vZGUucHJvdG90eXBlLmluc2VydEJlZm9yZSA9IGZ1bmN0aW9uPFQgZXh0ZW5kcyBOb2RlPihuZXdDaGlsZDogVCwgcmVmQ2hpbGQ6IE5vZGUpOiBUIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBOb2RlLmluc2VydEJlZm9yZSgpIG1ldGhvZCBpbnNlcnRzIHRoZSBzcGVjaWZpZWQgbm9kZSBiZWZvcmUgdGhlIHJlZmVyZW5jZVxuICAgICAgICAgKiBub2RlIGFzIGEgY2hpbGQgb2YgdGhlIGN1cnJlbnQgbm9kZS5cbiAgICAgICAgICpcbiAgICAgICAgICogSWYgcmVmZXJlbmNlTm9kZSBpcyBudWxsLCB0aGUgbmV3Tm9kZSBpcyBpbnNlcnRlZCBhdCB0aGUgZW5kIG9mIHRoZSBsaXN0IG9mIGNoaWxkIG5vZGVzLlxuICAgICAgICAgKlxuICAgICAgICAgKiBOb3RlIHRoYXQgcmVmZXJlbmNlTm9kZSBpcyBub3QgYW4gb3B0aW9uYWwgcGFyYW1ldGVyIC0tIHlvdSBtdXN0IGV4cGxpY2l0bHkgcGFzcyBhIE5vZGVcbiAgICAgICAgICogb3IgbnVsbC4gRmFpbGluZyB0byBwcm92aWRlIGl0IG9yIHBhc3NpbmcgaW52YWxpZCB2YWx1ZXMgbWF5IGJlaGF2ZSBkaWZmZXJlbnRseSBpblxuICAgICAgICAgKiBkaWZmZXJlbnQgYnJvd3NlciB2ZXJzaW9ucy5cbiAgICAgICAgICovXG4gICAgICAgIGNvbnN0IGNuID0gdGhpcy5jaGlsZE5vZGVzO1xuICAgICAgICBpZiAoZ2V0UHJveHlTdGF0dXMoY24pID09PSBQcm94eVN0YXR1cy5JU19QUk9YWSkge1xuICAgICAgICAgIGlmIChyZWZDaGlsZCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgLy8gQXZvaWQgdHJhY2tpbmcgc3RhY2sgdHJhY2VzIGZvciBzcGVjaWFsIGNhc2UuXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5hcHBlbmRDaGlsZChuZXdDaGlsZCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IHN0YWNrcyA9IGdldFByb3h5U3RhY2tUcmFjZXMoY24pO1xuICAgICAgICAgICAgY29uc3QgbGVuID0gY24ubGVuZ3RoO1xuICAgICAgICAgICAgbGV0IHBvc2l0aW9uID0gLTE7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgIGlmICgkJCRTRVEkJCQoY25baV0sIHJlZkNoaWxkKSkge1xuICAgICAgICAgICAgICAgIHBvc2l0aW9uID0gaTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHBvc2l0aW9uID09PSAtMSkge1xuICAgICAgICAgICAgICBsb2dUb0NvbnNvbGUoYGluc2VydEJlZm9yZSBjYWxsZWQgd2l0aCBpbnZhbGlkIG5vZGUhYCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBmb3IgKGxldCBpID0gbGVuIC0gMTsgaSA+PSBwb3NpdGlvbjsgaS0tKSB7XG4gICAgICAgICAgICAgICAgX2NvcHlTdGFja3Moc3RhY2tzLCBgJHtpfWAsIGAke2kgKyAxfWApO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIF9yZW1vdmVTdGFja3Moc3RhY2tzLCBgJHtwb3NpdGlvbn1gKTtcbiAgICAgICAgICAgICAgX2FkZFN0YWNrVHJhY2Uoc3RhY2tzLCBgJHtwb3NpdGlvbn1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcnYgPSBpbnNlcnRCZWZvcmUuY2FsbCh0aGlzLCBuZXdDaGlsZCwgcmVmQ2hpbGQpO1xuICAgICAgICBjbi4kJCRSRUlOU1RSVU1FTlQkJCQoKTtcbiAgICAgICAgcmV0dXJuIHJ2O1xuICAgICAgfTtcblxuICAgICAgY29uc3Qgbm9ybWFsaXplID0gTm9kZS5wcm90b3R5cGUubm9ybWFsaXplO1xuICAgICAgZnVuY3Rpb24gbm9ybWFsaXplSW50ZXJuYWwobjogTm9kZSk6IHZvaWQge1xuICAgICAgICBjb25zdCBjaGlsZHJlbiA9IG4uY2hpbGROb2RlcztcbiAgICAgICAgY29uc3QgbGVuID0gY2hpbGRyZW4ubGVuZ3RoO1xuICAgICAgICBjb25zdCBzdGFja3MgPSBnZXRQcm94eVN0YWNrVHJhY2VzKG4uY2hpbGROb2Rlcyk7XG4gICAgICAgIGxldCBwcmV2VGV4dE5vZGU6IE5vZGUgPSBudWxsO1xuICAgICAgICBsZXQgcHJldlRleHROb2RlSTogbnVtYmVyID0gLTE7XG4gICAgICAgIGxldCB0b1JlbW92ZTogbnVtYmVyW10gPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgIGNvbnN0IGNoaWxkID0gY2hpbGRyZW5baV07XG4gICAgICAgICAgaWYgKGNoaWxkLm5vZGVUeXBlID09PSBOb2RlLlRFWFRfTk9ERSkge1xuICAgICAgICAgICAgaWYgKGNoaWxkLnRleHRDb250ZW50ID09PSBcIlwiKSB7XG4gICAgICAgICAgICAgIC8vIFJlbW92ZSBlbXB0eSB0ZXh0IG5vZGVzLlxuICAgICAgICAgICAgICB0b1JlbW92ZS5wdXNoKGkpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChwcmV2VGV4dE5vZGUpIHtcbiAgICAgICAgICAgICAgLy8gTWVyZ2UgYWRqYWNlbnQgdGV4dCBub2Rlcy5cbiAgICAgICAgICAgICAgcHJldlRleHROb2RlLnRleHRDb250ZW50ICs9IGNoaWxkLnRleHRDb250ZW50O1xuICAgICAgICAgICAgICBpZiAoc3RhY2tzKSB7XG4gICAgICAgICAgICAgICAgX2NvbWJpbmVTdGFja3Moc3RhY2tzLCBgJHtwcmV2VGV4dE5vZGVJfWAsIGAke2l9YCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgdG9SZW1vdmUucHVzaChpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHByZXZUZXh0Tm9kZSA9IGNoaWxkO1xuICAgICAgICAgICAgICBwcmV2VGV4dE5vZGVJID0gaTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcHJldlRleHROb2RlID0gbnVsbDtcbiAgICAgICAgICAgIHByZXZUZXh0Tm9kZUkgPSAtMTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcmVtb3ZlTGVuID0gdG9SZW1vdmUubGVuZ3RoO1xuICAgICAgICBmb3IgKGxldCBpID0gcmVtb3ZlTGVuIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICBuLnJlbW92ZUNoaWxkKGNoaWxkcmVuW3RvUmVtb3ZlW2ldXSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbGVuMiA9IGNoaWxkcmVuLmxlbmd0aDtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW4yOyBpKyspIHtcbiAgICAgICAgICBub3JtYWxpemVJbnRlcm5hbChjaGlsZHJlbltpXSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIE5vZGUucHJvdG90eXBlLm5vcm1hbGl6ZSA9IGZ1bmN0aW9uKHRoaXM6IE5vZGUpOiB2b2lkIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBOb2RlLm5vcm1hbGl6ZSgpIG1ldGhvZCBwdXRzIHRoZSBzcGVjaWZpZWQgbm9kZSBhbmQgYWxsIG9mIGl0cyBzdWItdHJlZSBpbnRvIGFcbiAgICAgICAgICogXCJub3JtYWxpemVkXCIgZm9ybS4gSW4gYSBub3JtYWxpemVkIHN1Yi10cmVlLCBubyB0ZXh0IG5vZGVzIGluIHRoZSBzdWItdHJlZSBhcmUgZW1wdHlcbiAgICAgICAgICogYW5kIHRoZXJlIGFyZSBubyBhZGphY2VudCB0ZXh0IG5vZGVzLlxuICAgICAgICAgKi9cbiAgICAgICAgaWYgKHRoaXMuJCQkVFJFRSQkJCkge1xuICAgICAgICAgIG5vcm1hbGl6ZUludGVybmFsKHRoaXMpO1xuICAgICAgICAgIHRoaXMuJCQkUkVJTlNUUlVNRU5UJCQkKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIG5vcm1hbGl6ZS5jYWxsKHRoaXMpO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBjb25zdCByZW1vdmVDaGlsZCA9IE5vZGUucHJvdG90eXBlLnJlbW92ZUNoaWxkO1xuICAgICAgTm9kZS5wcm90b3R5cGUucmVtb3ZlQ2hpbGQgPSBmdW5jdGlvbjxUIGV4dGVuZHMgTm9kZT4odGhpczogTm9kZSwgY2hpbGQ6IFQpOiBUIHtcbiAgICAgICAgY29uc3QgY24gPSB0aGlzLmNoaWxkTm9kZXM7XG4gICAgICAgIGlmIChnZXRQcm94eVN0YXR1cyhjbikgPT09IFByb3h5U3RhdHVzLklTX1BST1hZKSB7XG4gICAgICAgICAgY29uc3Qgc3RhY2tzID0gZ2V0UHJveHlTdGFja1RyYWNlcyhjbik7XG4gICAgICAgICAgY29uc3QgY2hpbGRyZW4gPSB0aGlzLmNoaWxkTm9kZXM7XG4gICAgICAgICAgY29uc3QgbGVuID0gY2hpbGRyZW4ubGVuZ3RoO1xuICAgICAgICAgIGxldCBpID0gMDtcbiAgICAgICAgICBmb3IgKDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoJCQkU0VRJCQkKGNoaWxkcmVuW2ldLCBjaGlsZCkpIHtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChpID09PSBsZW4pIHtcbiAgICAgICAgICAgIGxvZ1RvQ29uc29sZShgSW52YWxpZCBjYWxsIHRvIHJlbW92ZUNoaWxkLmApXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZvciAobGV0IGogPSBpICsgMTsgaiA8IGxlbjsgaisrKSB7XG4gICAgICAgICAgICAgIF9jb3B5U3RhY2tzKHN0YWNrcywgYCR7an1gLCBgJHtqIC0gMX1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF9yZW1vdmVTdGFja3Moc3RhY2tzLCBgJHtsZW4gLSAxfWApO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zdCBydiA9IHJlbW92ZUNoaWxkLmNhbGwodGhpcywgY2hpbGQpO1xuICAgICAgICBjbi4kJCRSRUlOU1RSVU1FTlQkJCQoKTtcbiAgICAgICAgcmV0dXJuIHJ2O1xuICAgICAgfVxuXG4gICAgICAvLyByZXBsYWNlQ2hpbGQ6IFJlcGxhY2VzIGEgY2hpbGQuXG4gICAgICBjb25zdCByZXBsYWNlQ2hpbGQgPSBOb2RlLnByb3RvdHlwZS5yZXBsYWNlQ2hpbGQ7XG4gICAgICBOb2RlLnByb3RvdHlwZS5yZXBsYWNlQ2hpbGQgPSBmdW5jdGlvbjxUIGV4dGVuZHMgTm9kZT4odGhpczogTm9kZSwgbmV3Q2hpbGQ6IE5vZGUsIG9sZENoaWxkOiBUKTogVCB7XG4gICAgICAgIGNvbnN0IGNuID0gdGhpcy5jaGlsZE5vZGVzO1xuICAgICAgICBpZiAoZ2V0UHJveHlTdGF0dXMoY24pID09PSBQcm94eVN0YXR1cy5JU19QUk9YWSkge1xuICAgICAgICAgIGNvbnN0IHN0YWNrcyA9IGdldFByb3h5U3RhY2tUcmFjZXMoY24pO1xuICAgICAgICAgIGxldCBpID0gMDtcbiAgICAgICAgICBjb25zdCBsZW4gPSBjbi5sZW5ndGg7XG4gICAgICAgICAgZm9yICg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgaWYgKCQkJFNFUSQkJChjbltpXSwgb2xkQ2hpbGQpKSB7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoaSA9PT0gbGVuKSB7XG4gICAgICAgICAgICBsb2dUb0NvbnNvbGUoYHJlcGxhY2VDaGlsZCBjYWxsZWQgd2l0aCBpbnZhbGlkIGNoaWxkYCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIF9hZGRTdGFja1RyYWNlKHN0YWNrcywgYCR7aX1gKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcnYgPSByZXBsYWNlQ2hpbGQuY2FsbCh0aGlzLCBuZXdDaGlsZCwgb2xkQ2hpbGQpO1xuICAgICAgICBjbi4kJCRSRUlOU1RSVU1FTlQkJCQoKTtcbiAgICAgICAgcmV0dXJuIHJ2O1xuICAgICAgfVxuXG4gICAgICBjb25zdCBpbm5lckhUTUwgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKEVsZW1lbnQucHJvdG90eXBlLCAnaW5uZXJIVE1MJyk7XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoRWxlbWVudC5wcm90b3R5cGUsICdpbm5lckhUTUwnLCB7XG4gICAgICAgIGdldDogaW5uZXJIVE1MLmdldCxcbiAgICAgICAgc2V0OiBmdW5jdGlvbih0aGlzOiBFbGVtZW50LCB0OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICAgICAgICBjb25zdCBydiA9IGlubmVySFRNTC5zZXQuY2FsbCh0aGlzLCB0KTtcbiAgICAgICAgICBjb25zdCBjbiA9IHRoaXMuY2hpbGROb2RlcztcbiAgICAgICAgICBpZiAoZ2V0UHJveHlTdGF0dXMoY24pID09PSBQcm94eVN0YXR1cy5JU19QUk9YWSkge1xuICAgICAgICAgICAgY29uc3Qgc3RhY2tzID0gZ2V0UHJveHlTdGFja1RyYWNlcyhjbik7XG4gICAgICAgICAgICBzdGFja3MuY2xlYXIoKTtcbiAgICAgICAgICAgIF9pbml0aWFsaXplTWFwKGNuLCBzdGFja3MsIF9nZXRTdGFja1RyYWNlKCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjbi4kJCRSRUlOU1RSVU1FTlQkJCQoKTtcbiAgICAgICAgICByZXR1cm4gcnY7XG4gICAgICAgIH0sXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZVxuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IG91dGVySFRNTCA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IoRWxlbWVudC5wcm90b3R5cGUsICdvdXRlckhUTUwnKTtcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShFbGVtZW50LnByb3RvdHlwZSwgJ291dGVySFRNTCcsIHtcbiAgICAgICAgZ2V0OiBvdXRlckhUTUwuZ2V0LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKHRoaXM6IEVsZW1lbnQsIHY6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgICAgICAgIGNvbnN0IHBhcmVudCA9IHRoaXMucGFyZW50Tm9kZTtcbiAgICAgICAgICBpZiAocGFyZW50KSB7XG4gICAgICAgICAgICBjb25zdCBwYXJlbnRDbiA9IHBhcmVudC5jaGlsZE5vZGVzO1xuICAgICAgICAgICAgaWYgKGdldFByb3h5U3RhdHVzKHBhcmVudENuKSA9PT0gUHJveHlTdGF0dXMuSVNfUFJPWFkpIHtcbiAgICAgICAgICAgICAgY29uc3QgbGVuID0gcGFyZW50Q24ubGVuZ3RoO1xuICAgICAgICAgICAgICBsZXQgaSA9IDA7XG4gICAgICAgICAgICAgIGZvciAoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAocGFyZW50Q25baV0gPT09IHRoaXMpIHtcbiAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAoaSA9PT0gbGVuKSB7XG4gICAgICAgICAgICAgICAgbG9nVG9Db25zb2xlKGBJbnZhbGlkIGNhbGwgdG8gb3V0ZXJIVE1MOiBEZXRhY2hlZCBub2RlP2ApO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0IHN0YWNrcyA9IGdldFByb3h5U3RhY2tUcmFjZXMocGFyZW50Q24pO1xuICAgICAgICAgICAgICAgIF9yZW1vdmVTdGFja3Moc3RhY2tzLCBgJHtpfWApO1xuICAgICAgICAgICAgICAgIF9hZGRTdGFja1RyYWNlKHN0YWNrcywgYCR7aX1gKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCBydiA9IG91dGVySFRNTC5zZXQuY2FsbCh0aGlzLCB2KTtcbiAgICAgICAgICBpZiAocGFyZW50KSB7XG4gICAgICAgICAgICBwYXJlbnQuY2hpbGROb2Rlcy4kJCRSRUlOU1RSVU1FTlQkJCQoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHJ2O1xuICAgICAgICB9LFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6IHRydWVcbiAgICAgIH0pO1xuXG4gICAgICBmdW5jdGlvbiBpbnNlcnRBZGphY2VudEhlbHBlcihlOiBFbGVtZW50LCBwb3NpdGlvbjogSW5zZXJ0UG9zaXRpb24pOiB2b2lkIHtcbiAgICAgICAgc3dpdGNoIChwb3NpdGlvbikge1xuICAgICAgICAgIGNhc2UgJ2JlZm9yZWJlZ2luJzpcbiAgICAgICAgICBjYXNlICdhZnRlcmVuZCc6IHtcbiAgICAgICAgICAgIGlmIChlLnBhcmVudE5vZGUgJiYgZ2V0UHJveHlTdGF0dXMoZS5wYXJlbnROb2RlLmNoaWxkTm9kZXMpID09PSBQcm94eVN0YXR1cy5JU19QUk9YWSkge1xuICAgICAgICAgICAgICBjb25zdCBwYXJlbnQgPSBlLnBhcmVudE5vZGU7XG4gICAgICAgICAgICAgIGNvbnN0IHNpYmxpbmdzID0gcGFyZW50LmNoaWxkTm9kZXM7XG4gICAgICAgICAgICAgIGNvbnN0IG51bVNpYmxpbmdzID0gc2libGluZ3MubGVuZ3RoO1xuICAgICAgICAgICAgICBsZXQgaSA9IDA7XG4gICAgICAgICAgICAgIGZvciAoOyBpIDwgbnVtU2libGluZ3M7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmICgkJCRTRVEkJCQoc2libGluZ3NbaV0sIGUpKSB7XG4gICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKGkgIT09IG51bVNpYmxpbmdzKSB7XG4gICAgICAgICAgICAgICAgLy8gRG9lcyBpdCBzaGlmdCB0aGluZ3MgZG93biBiZWZvcmUgb3IgYWZ0ZXIgdGhpcyBlbGVtZW50P1xuICAgICAgICAgICAgICAgIGxldCBzdGFydCA9IHBvc2l0aW9uID09PSAnYmVmb3JlYmVnaW4nID8gaSA6IGkgKyAxO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN0YWNrcyA9IGdldFByb3h5U3RhY2tUcmFjZXMoc2libGluZ3MpO1xuICAgICAgICAgICAgICAgIGZvciAoaSA9IG51bVNpYmxpbmdzIC0gMTsgaSA+PSBzdGFydDsgaS0tKSB7XG4gICAgICAgICAgICAgICAgICBfY29weVN0YWNrcyhzdGFja3MsIGAke2l9YCwgYCR7aSArIDF9YClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgX3JlbW92ZVN0YWNrcyhzdGFja3MsIGAke3N0YXJ0fWApO1xuICAgICAgICAgICAgICAgIF9hZGRTdGFja1RyYWNlKHN0YWNrcywgYCR7c3RhcnR9YCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjYXNlICdhZnRlcmJlZ2luJzpcbiAgICAgICAgICBjYXNlICdiZWZvcmVlbmQnOiB7XG4gICAgICAgICAgICBjb25zdCBjbiA9IGUuY2hpbGROb2RlcztcbiAgICAgICAgICAgIGlmIChnZXRQcm94eVN0YXR1cyhjbikgPT09IFByb3h5U3RhdHVzLklTX1BST1hZKSB7XG4gICAgICAgICAgICAgIGNvbnN0IG51bUNoaWxkcmVuID0gY24ubGVuZ3RoO1xuICAgICAgICAgICAgICBjb25zdCBzdGFja3MgPSBnZXRQcm94eVN0YWNrVHJhY2VzKGNuKTtcbiAgICAgICAgICAgICAgaWYgKHBvc2l0aW9uID09PSAnYWZ0ZXJiZWdpbicpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gbnVtQ2hpbGRyZW4gLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgICAgICAgX2NvcHlTdGFja3Moc3RhY2tzLCBgJHtpfWAsIGAke2kgKyAxfWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBfcmVtb3ZlU3RhY2tzKHN0YWNrcywgYDBgKTtcbiAgICAgICAgICAgICAgICBfYWRkU3RhY2tUcmFjZShzdGFja3MsIGAwYCk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgX2FkZFN0YWNrVHJhY2Uoc3RhY2tzLCBgJHtudW1DaGlsZHJlbn1gKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGluc2VydEFkamFjZW50RWxlbWVudCA9IEVsZW1lbnQucHJvdG90eXBlLmluc2VydEFkamFjZW50RWxlbWVudDtcbiAgICAgIEVsZW1lbnQucHJvdG90eXBlLmluc2VydEFkamFjZW50RWxlbWVudCA9IGZ1bmN0aW9uKHBvc2l0aW9uOiBJbnNlcnRQb3NpdGlvbiwgaW5zZXJ0ZWRFbGVtZW50OiBFbGVtZW50KTogRWxlbWVudCB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgaW5zZXJ0QWRqYWNlbnRFbGVtZW50KCkgbWV0aG9kIGluc2VydHMgYSBnaXZlbiBlbGVtZW50IG5vZGUgYXQgYSBnaXZlblxuICAgICAgICAgKiBwb3NpdGlvbiByZWxhdGl2ZSB0byB0aGUgZWxlbWVudCBpdCBpcyBpbnZva2VkIHVwb24uXG4gICAgICAgICAqL1xuICAgICAgICBpbnNlcnRBZGphY2VudEhlbHBlcih0aGlzLCBwb3NpdGlvbik7XG5cbiAgICAgICAgY29uc3QgcnYgPSBpbnNlcnRBZGphY2VudEVsZW1lbnQuY2FsbCh0aGlzLCBwb3NpdGlvbiwgaW5zZXJ0ZWRFbGVtZW50KTtcbiAgICAgICAgaWYgKHBvc2l0aW9uID09PSAnYWZ0ZXJiZWdpbicgfHwgcG9zaXRpb24gPT09ICdiZWZvcmVlbmQnKSB7XG4gICAgICAgICAgdGhpcy5jaGlsZE5vZGVzLiQkJFJFSU5TVFJVTUVOVCQkJCgpO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMucGFyZW50Tm9kZSkge1xuICAgICAgICAgIHRoaXMucGFyZW50Tm9kZS5jaGlsZE5vZGVzLiQkJFJFSU5TVFJVTUVOVCQkJCgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBydjtcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IGluc2VydEFkamFjZW50SFRNTCA9IEVsZW1lbnQucHJvdG90eXBlLmluc2VydEFkamFjZW50SFRNTDtcbiAgICAgIEVsZW1lbnQucHJvdG90eXBlLmluc2VydEFkamFjZW50SFRNTCA9IGZ1bmN0aW9uKHRoaXM6IEVsZW1lbnQsIHdoZXJlOiBJbnNlcnRQb3NpdGlvbiwgaHRtbDogc3RyaW5nKTogdm9pZCB7XG4gICAgICAgIGluc2VydEFkamFjZW50SGVscGVyKHRoaXMsIHdoZXJlKTtcbiAgICAgICAgY29uc3QgcnYgPSBpbnNlcnRBZGphY2VudEhUTUwuY2FsbCh0aGlzLCB3aGVyZSwgaHRtbCk7XG4gICAgICAgIGlmICh3aGVyZSA9PT0gJ2FmdGVyYmVnaW4nIHx8IHdoZXJlID09PSAnYmVmb3JlZW5kJykge1xuICAgICAgICAgIHRoaXMuY2hpbGROb2Rlcy4kJCRSRUlOU1RSVU1FTlQkJCQoKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLnBhcmVudE5vZGUpIHtcbiAgICAgICAgICB0aGlzLnBhcmVudE5vZGUuY2hpbGROb2Rlcy4kJCRSRUlOU1RSVU1FTlQkJCQoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcnY7XG4gICAgICB9O1xuXG4gICAgICBjb25zdCBpbnNlcnRBZGphY2VudFRleHQgPSBFbGVtZW50LnByb3RvdHlwZS5pbnNlcnRBZGphY2VudFRleHQ7XG4gICAgICBFbGVtZW50LnByb3RvdHlwZS5pbnNlcnRBZGphY2VudFRleHQgPSBmdW5jdGlvbih0aGlzOiBFbGVtZW50LCB3aGVyZTogSW5zZXJ0UG9zaXRpb24sIHRleHQ6IHN0cmluZyk6IHZvaWQge1xuICAgICAgICBpbnNlcnRBZGphY2VudEhlbHBlcih0aGlzLCB3aGVyZSk7XG4gICAgICAgIGNvbnN0IHJ2ID0gaW5zZXJ0QWRqYWNlbnRUZXh0LmNhbGwodGhpcywgd2hlcmUsIHRleHQpO1xuICAgICAgICBpZiAod2hlcmUgPT09ICdhZnRlcmJlZ2luJyB8fCB3aGVyZSA9PT0gJ2JlZm9yZWVuZCcpIHtcbiAgICAgICAgICB0aGlzLmNoaWxkTm9kZXMuJCQkUkVJTlNUUlVNRU5UJCQkKCk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5wYXJlbnROb2RlKSB7XG4gICAgICAgICAgdGhpcy5wYXJlbnROb2RlLmNoaWxkTm9kZXMuJCQkUkVJTlNUUlVNRU5UJCQkKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJ2O1xuICAgICAgfVxuXG4gICAgICBjb25zdCByZW1vdmUgPSBFbGVtZW50LnByb3RvdHlwZS5yZW1vdmU7XG4gICAgICBFbGVtZW50LnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbih0aGlzOiBFbGVtZW50KTogdm9pZCB7XG4gICAgICAgIGNvbnN0IHBhcmVudCA9IHRoaXMucGFyZW50Tm9kZTtcbiAgICAgICAgaWYgKHBhcmVudCkge1xuICAgICAgICAgIHBhcmVudC5yZW1vdmVDaGlsZCh0aGlzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZW1vdmUuY2FsbCh0aGlzKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIC8vIEVsZW1lbnQ6XG4gICAgICAvLyAqKlNQRUNJQUwqKjogZGF0YXNldCAtIG1vZGlmaWVzIHByb3BlcnRpZXMgb24gRE9NIG9iamVjdCB0aHJvdWdoIG9iamVjdCEhISFcbiAgICAgIC8vIC0+IHRocm93IGV4Y2VwdGlvbiBpZiB1c2VkLlxuXG4gICAgICAvLyBTVkdFbGVtZW50OlxuICAgICAgLy8gZGF0YXNldDogVGhyb3cgZXhjZXB0aW9uIGlmIHVzZWRcbiAgICB9XG5cblxuXG4gICAgLyooPGFueT4gcm9vdClbJyQkUFJJTlRDT1VOVFMkJCddID0gZnVuY3Rpb24oKTogdm9pZCB7XG4gICAgICBsb2dUb0NvbnNvbGUoYEFQSSxHZXRDb3VudCxJbnZva2VkQ291bnQsU2V0Q291bnRgKTtcbiAgICAgIGNvdW50TWFwLmZvckVhY2goKHYsIGspID0+IHtcbiAgICAgICAgaWYgKHYuZ2V0ICsgdi5zZXQgKyB2Lmludm9rZWQgPiAwKSB7XG4gICAgICAgICAgbG9nVG9Db25zb2xlKGAke2t9LCR7di5nZXR9LCR7di5pbnZva2VkfSwke3Yuc2V0fWApO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9OyovXG5cbiAgICAvLyBHb2FsOlxuICAgIC8vIC0gQXR0YWNoIHVuaXF1ZSBJRHMgdG8gYWxsIEhUTUwgdGFncyBpbiB0aGUgRE9NIGNvcnJlc3BvbmRpbmcgdG8gdGhlaXIgbG9jYXRpb24gcG9zdC1ib2R5LWxvYWQuXG4gICAgLy8gLSBPbiB1cGRhdGU6IFVwZGF0ZSBJRHMuXG4gICAgLy8gLSBJbnNlcnRpb24gdG8gc2NvcGUgbW9kaWZpZXMgYWxsIElEcyBpbiBzY29wZS5cblxuICAgIC8vIFBvc3NpYmlsaXRpZXM6XG4gICAgLy8gLSBOb2RlIGlzIG9ubHkgaW4gRE9NLlxuICAgIC8vICAgLSBJbnN0cnVtZW50IERPTSBsb2NhdGlvbi5cbiAgICAvLyAtIE5vZGUgaXMgb25seSBpbiBoZWFwLlxuICAgIC8vICAgLSBJbnN0cnVtZW50IG5vZGUgb2JqZWN0LlxuICAgIC8vIC0gTm9kZSBpcyBpbiBib3RoLlxuICAgIC8vICAgLSBJbnN0cnVtZW50IGJvdGguXG5cbiAgICAvLyBSZWdhcmRsZXNzOlxuICAgIC8vIC0gTmVlZCB0byAqdW53cmFwKiBhcmd1bWVudHNcbiAgICAvLyAtIE5lZWQgdG8gKndyYXAqIHJldHVybiB2YWx1ZXNcblxuICAgIC8vIE5vZGU6XG4gICAgLy8gbm9kZVZhbHVlOiBOb3QgaW1wb3J0YW50P1xuICAgIC8vIHRleHRDb250ZW50OiBQYXNzIGl0IGEgc3RyaW5nLiBSZXBsYWNlcyBjb250ZW50LlxuICAgIC8vIGFwcGVuZENoaWxkOiBQYXNzZWQgYSBOb2RlLiBNb2RpZmllcyBET00uXG4gICAgLy8gaW5zZXJ0QmVmb3JlOiBUYWtlcyBOb2Rlcy4gTW9kaWZpZXMgRE9NLlxuICAgIC8vIGlzRXF1YWxOb2RlOiBUYWtlcyBhIE5vZGUuXG4gICAgLy8gaXNTYW1lTm9kZTogVGFrZXMgYSBOb2RlLlxuICAgIC8vIG5vcm1hbGl6ZTogUmVtb3ZlcyB0aGluZ3MgZnJvbSBET00uXG4gICAgLy8gcmVtb3ZlQ2hpbGQ6IFJlbW92ZXMgYSBjaGlsZC5cbiAgICAvLyByZXBsYWNlQ2hpbGQ6IFJlcGxhY2VzIGEgY2hpbGQuXG5cbiAgICAvLyBFbGVtZW50OlxuICAgIC8vIGlubmVySFRNTFxuICAgIC8vIG91dGVySFRNTFxuICAgIC8vIGluc2VydEFkamFjZW50RWxlbWVudFxuICAgIC8vIGluc2VydEFkamFjZW50SFRNTFxuICAgIC8vIGluc2VydEFkamFjZW50VGV4dFxuICAgIC8vIHJlbW92ZVxuICAgIC8vICoqU1BFQ0lBTCoqOiBkYXRhc2V0IC0gbW9kaWZpZXMgcHJvcGVydGllcyBvbiBET00gb2JqZWN0IHRocm91Z2ggb2JqZWN0ISEhIVxuICAgIC8vIC0+IHRocm93IGV4Y2VwdGlvbiBpZiB1c2VkLlxuXG4gICAgLy8gU1ZHRWxlbWVudDpcbiAgICAvLyBkYXRhc2V0OiBUaHJvdyBleGNlcHRpb24gaWYgdXNlZFxuXG4gICAgLy8gT24gcHJvcGVydGllczpcbiAgICAvLyAtIERvY3VtZW50LnByb3RvdHlwZVxuICAgIC8vIC0gRWxlbWVudC5wcm90b3R5cGVcbiAgICAvLyAtIE1lZGlhUXVlcnlMaXN0LnByb3RvdHlwZVxuICAgIC8vIC0gRmlsZVJlYWRlci5wcm90b3R5cGVcbiAgICAvLyAtIEhUTUxCb2R5RWxlbWVudFxuICAgIC8vIC0gSFRNTEVsZW1lbnRcbiAgICAvLyAtIEhUTUxGcmFtZVNldEVsZW1lbnRcbiAgICAvLyAtIEF1ZGlvVHJhY2tMaXN0PyBUZXh0VHJhY2s/IFRleHRUcmFja0N1ZT8gVGV4dFRyYWNrTGlzdD8gVmlkZW9UcmFja0xpc3Q/XG4gICAgLy8gLSBBcHBsaWNhdGlvbkNhY2hlXG4gICAgLy8gLSBFdmVudFNvdXJjZVxuICAgIC8vIC0gU1ZHQW5pbWF0aW9uRWxlbWVudFxuICAgIC8vIC0gU1ZHRWxlbWVudFxuICAgIC8vIC0gUGVyZm9ybWFuY2U/XG4gICAgLy8gLSBXb3JrZXI/XG4gICAgLy8gLSBYTUxIdHRwUmVxdWVzdFxuICAgIC8vIC0gWE1MSHR0cFJlcXVlc3RFdmVudFRhcmdldFxuICAgIC8vIC0gV2ViU29ja2V0XG4gICAgLy8gLSBJREJEYXRhYmFzZVxuICAgIC8vIC0gSURCT3BlbkRCUmVxdWVzdFxuICAgIC8vIC0gSURCUmVxdWVzdFxuICAgIC8vIC0gSURCVHJhbnNhY3Rpb25cbiAgICAvLyAtIHdpbmRvdy5bcHJvcGVydHldIChTcGVjaWFsKVxuXG5cbiAgfVxufSkoKTsiXX0=