"no transform";
/**
 * Agent injected into the webpage to surface browser-hidden leaks at the JS level.
 */
(function () {
    // Global variables.
    const IS_WINDOW = typeof (window) !== "undefined";
    const IS_WORKER = typeof (importScripts) !== "undefined";
    const ROOT = (IS_WINDOW ? window : IS_WORKER ? self : global);
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
    const r = /'/g;
    // Some websites overwrite logToConsole.
    const console = ROOT.console ? ROOT.console : { log: (str) => { } };
    const consoleLog = console.log;
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
        movedVariables.concat(args).forEach((varName) => {
            unmovedVariables[varName] = {
                value: undefined,
                enumerable: true,
                writable: true,
                configurable: true
            };
        });
        // Initialize arguments.
        args.forEach((argName, i) => {
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
    const fixSet = new Set();
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
    const PROP_NOT_FOUND = {};
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
    const EVAL_FCN = new Function('scope', '$$$SRC$$$', 'return eval($$$SRC$$$);');
    // Caches compiled eval statements from server to reduce synchronous XHRs.
    const EVAL_CACHE = new Map();
    const EVAL_CACHE_LIMIT = 100;
    /**
     * Removes the 10 items from EVAL_CACHE that were least recently used.
     */
    function trimEvalCache() {
        const items = [];
        EVAL_CACHE.forEach((i) => items.push(i));
        items.sort((a, b) => a.ts - b.ts);
        items.slice(0, 10).forEach((i) => {
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
        let cache = EVAL_CACHE.get(source);
        if (!cache) {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/eval', false);
            xhr.setRequestHeader("Content-type", "application/json");
            xhr.send(JSON.stringify({ scope: "scope", source }));
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
                const v = withGet(target, key);
                if (v === PROP_NOT_FOUND) {
                    const v = withGet(scope, key);
                    if (v === PROP_NOT_FOUND) {
                        throw new ReferenceError(`${key} is not defined`);
                    }
                    return v;
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
        const props = Object.getOwnPropertyDescriptors(obj);
        for (const prop of props) {
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
    const NODE_PROP_PREFIX = "$$$CHILD$$$";
    /**
     * Converts the node's tree structure into a JavaScript-visible tree structure.
     * TODO: Mutate to include any other Node properties that could be the source of leaks!
     * @param n
     */
    function makeMirrorNode(n) {
        const childNodes = n.childNodes;
        const m = { root: n, childNodes: makeChildNode(childNodes) };
        return m;
    }
    /**
     * Converts the childNodes nodelist into a JS-level object.
     * @param cn
     */
    function makeChildNode(cn) {
        const numChildren = cn.length;
        let rv = { length: numChildren };
        for (let i = 0; i < numChildren; i++) {
            rv[`${NODE_PROP_PREFIX}${i}`] = makeMirrorNode(cn[i]);
        }
        return rv;
    }
    /**
     * Serializes the DOM into a JavaScript-visible tree structure.
     */
    function $$$SERIALIZE_DOM$$$(n = document) {
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
    function _addStackTrace(map, property, stack = _getStackTrace()) {
        let set = map.get(property);
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
            const fromStacks = map.get(from);
            const toStacks = map.get(to);
            fromStacks.forEach((s) => {
                toStacks.add(s);
            });
        }
    }
    /**
     * Initialize a map to contain stack traces for all of the properties of the given object.
     */
    function _initializeMap(obj, map, trace) {
        Object.keys(obj).forEach((k) => {
            _addStackTrace(map, k, trace);
        });
        return map;
    }
    /**
     * Returns a proxy object for the given object, if applicable. Creates a new object if the object
     * is not already proxied.
     */
    function getProxy(accessStr, obj, stackTrace = null) {
        if (!isProxyable(obj)) {
            // logToConsole(`[PROXY ERROR]: Cannot create proxy for ${obj} at ${accessStr}.`);
            return obj;
        }
        else if (!obj.hasOwnProperty('$$$PROXY$$$')) {
            const map = new Map();
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
        const root = this.$$root;
        const trees = this.$$trees;
        const rootAccessString = this.$$rootAccessString;
        for (const tree of trees) {
            instrumentTree(rootAccessString, root, tree, stackTrace);
        }
    }
    function hiddenPropertyName(n) {
        return `_____$${n}`;
    }
    function setHiddenValue(thisObj, n, value) {
        const propName = hiddenPropertyName(n);
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
    function instrumentPath(rootAccessString, accessString, root, tree, stackTrace = null) {
        let setProxy;
        //logToConsole(`Instrumenting ${accessString} at ${rootAccessString}`);
        const prop = Object.getOwnPropertyDescriptor(root, tree.indexOrName);
        if (prop && prop.set && Array.isArray(prop.set['$$trees'])) {
            //logToConsole(`It's already instrumented!`);
            setProxy = prop.set;
        }
        else {
            //logToConsole(`New instrumentation.`);
            // let hiddenValue = root[tree.indexOrName];
            const isGrowing = tree.isGrowing;
            const indexOrName = tree.indexOrName;
            setHiddenValue(root, indexOrName, root[indexOrName]);
            if (isGrowing) {
                //logToConsole(`Converting the hidden value into a proxy.`)
                const proxy = getProxy(accessString, getHiddenValue(root, indexOrName));
                setHiddenValue(root, indexOrName, proxy);
                if (stackTrace !== null && getProxyStatus(proxy) === 0 /* IS_PROXY */) {
                    const map = getProxyStackTraces(proxy);
                    _initializeMap(proxy, map, stackTrace);
                }
            }
            setProxy = function (v) {
                const trace = _getStackTrace();
                setHiddenValue(this, indexOrName, isGrowing ? getProxy(accessString, v, trace) : v);
                setProxy.$$update(trace);
                // logToConsole(`${rootAccessString}: Assignment`);
                return true;
            };
            setProxy.$$rootAccessString = rootAccessString;
            setProxy.$$trees = [];
            setProxy.$$update = updateAssignmentProxy;
            setProxy.$$root = root;
            try {
                Object.defineProperty(root, indexOrName, {
                    get: function () {
                        return getHiddenValue(this, indexOrName);
                    },
                    set: setProxy,
                    configurable: true
                });
            }
            catch (e) {
                logToConsole(`Unable to instrument ${rootAccessString}: ${e}`);
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
    function instrumentDOMTree(rootAccessString, root, tree, stackTrace = null) {
        // For now: Simply crawl to the node(s) and instrument regularly from there. Don't try to plant getters/setters.
        // $$DOM - - - - - -> root [regular subtree]
        let obj;
        let accessString = rootAccessString;
        let switchToRegularTree = false;
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
                accessString += `['childNodes']`;
                break;
            default:
                const modIndex = tree.indexOrName.slice(NODE_PROP_PREFIX.length);
                obj = root[modIndex];
                accessString += `[${modIndex}]`;
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
        const children = tree.children;
        if (children) {
            const instrumentFunction = switchToRegularTree ? instrumentTree : instrumentDOMTree;
            const len = children.length;
            for (let i = 0; i < len; i++) {
                const child = children[i];
                instrumentFunction(accessString, obj, child, stackTrace);
            }
        }
    }
    function instrumentTree(rootAccessString, root, tree, stackTrace = null) {
        const accessString = rootAccessString + `[${safeString(`${tree.indexOrName}`)}]`;
        //logToConsole(`access string: ${accessString}`);
        // Ignore roots that are not proxyable.
        if (!isProxyable(root)) {
            //logToConsole(`Not a proxyable root.`);
            return;
        }
        const obj = root[tree.indexOrName];
        instrumentPath(rootAccessString, accessString, root, tree, stackTrace);
        // Capture writes of children.
        const children = tree.children;
        if (children) {
            const len = children.length;
            for (let i = 0; i < len; i++) {
                const child = children[i];
                instrumentTree(accessString, obj, child, stackTrace);
            }
        }
    }
    // Disables proxy interception.
    let disableProxies = false;
    function isDOMRoot(tree) {
        return tree.indexOrName === "$$$DOM$$$";
    }
    let instrumentedTrees = [];
    function $$$INSTRUMENT_PATHS$$$(trees) {
        for (const tree of trees) {
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
        const obj = root[path.indexOrName];
        if (isProxyable(obj)) {
            if (path.isGrowing && getProxyStatus(obj) === 0 /* IS_PROXY */) {
                const map = getProxyStackTraces(obj);
                const stackTraces = stacksMap[path.id] ? stacksMap[path.id] : new Set();
                map.forEach((v, k) => {
                    v.forEach((s) => stackTraces.add(s));
                });
                stacksMap[path.id] = stackTraces;
            }
            const children = path.children;
            if (children) {
                for (const child of children) {
                    getStackTraces(obj, child, stacksMap);
                }
            }
        }
    }
    function getDOMStackTraces(root, path, stacksMap) {
        let obj;
        let switchToRegularTree = false;
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
            const wrappedObj = wrapIfOriginal(obj);
            if (getProxyStatus(wrappedObj) === 0 /* IS_PROXY */) {
                const map = getProxyStackTraces(wrappedObj);
                const stackTraces = stacksMap[path.id] ? stacksMap[path.id] : new Set();
                map.forEach((v, k) => {
                    v.forEach((s) => stackTraces.add(s));
                });
                stacksMap[path.id] = stackTraces;
            }
        }
        // Capture writes of children.
        const children = path.children;
        const getStackTracesFunction = switchToRegularTree ? getStackTraces : getDOMStackTraces;
        if (children) {
            const len = children.length;
            for (let i = 0; i < len; i++) {
                const child = children[i];
                getStackTracesFunction(obj, child, stacksMap);
            }
        }
    }
    function $$$GET_STACK_TRACES$$$() {
        const stacksMap = {};
        for (const tree of instrumentedTrees) {
            if (isDOMRoot(tree)) {
                getDOMStackTraces(ROOT.$$$GLOBAL$$$, tree, stacksMap);
            }
            else {
                getStackTraces(ROOT.$$$GLOBAL$$$, tree, stacksMap);
            }
        }
        const jsonableStacksMap = {};
        for (const stringId in stacksMap) {
            if (stacksMap.hasOwnProperty(stringId)) {
                const id = parseInt(stringId, 10);
                const stacks = stacksMap[id];
                let i = 0;
                const stackArray = new Array(stacks.size);
                stacks.forEach((s) => {
                    stackArray[i++] = s;
                });
                jsonableStacksMap[id] = stackArray;
            }
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
        const addEventListener = EventTarget.prototype.addEventListener;
        const removeEventListener = EventTarget.prototype.removeEventListener;
        EventTarget.prototype.addEventListener = function (type, listener, useCapture = false) {
            addEventListener.apply(unwrapIfProxy(this), arguments);
            if (!this.$$listeners) {
                this.$$listeners = {};
            }
            let listeners = this.$$listeners[type];
            if (!listeners) {
                listeners = this.$$listeners[type] = [];
            }
            for (const listenerInfo of listeners) {
                if (listenerInfo.listener === listener && (typeof (listenerInfo.useCapture) === 'boolean' ? listenerInfo.useCapture === useCapture : true)) {
                    return;
                }
            }
            listeners.push({
                listener: listener,
                useCapture: useCapture
            });
        };
        EventTarget.prototype.removeEventListener = function (type, listener, useCapture = false) {
            removeEventListener.apply(unwrapIfProxy(this), arguments);
            if (this.$$listeners) {
                const listeners = this.$$listeners[type];
                if (listeners) {
                    for (let i = 0; i < listeners.length; i++) {
                        const lInfo = listeners[i];
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
            return function (...items) {
                try {
                    disableProxies = true;
                    if (getProxyStatus(this) === 0 /* IS_PROXY */) {
                        const map = getProxyStackTraces(this);
                        const trace = _getStackTrace();
                        for (let i = 0; i < items.length; i++) {
                            _addStackTrace(map, `${this.length + i}`, trace);
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
            return function (...items) {
                try {
                    disableProxies = true;
                    if (getProxyStatus(this) === 0 /* IS_PROXY */) {
                        const map = getProxyStackTraces(this);
                        const newItemLen = items.length;
                        const trace = _getStackTrace();
                        for (let i = items.length - 1; i >= 0; i--) {
                            _copyStacks(map, `${i}`, `${i + newItemLen}`);
                        }
                        for (let i = 0; i < items.length; i++) {
                            _removeStacks(map, `${i}`);
                            _addStackTrace(map, `${i}`, trace);
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
                        const map = getProxyStackTraces(this);
                        _removeStacks(map, `${this.length - 1}`);
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
                        const map = getProxyStackTraces(this);
                        _removeStacks(map, "0");
                        for (let i = 1; i < this.length; i++) {
                            _copyStacks(map, `${i}`, `${i - 1}`);
                        }
                        _removeStacks(map, `${this.length - 1}`);
                    }
                    return shift.apply(this);
                }
                finally {
                    disableProxies = false;
                }
            };
        })(Array.prototype.shift);
        Array.prototype.splice = (function (splice) {
            return function (start, deleteCount, ...items) {
                try {
                    disableProxies = true;
                    if (getProxyStatus(this) === 0 /* IS_PROXY */) {
                        const map = getProxyStackTraces(this);
                        let actualStart = start | 0;
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
                        let actualDeleteCount = deleteCount | 0;
                        // If deleteCount is omitted, or if its value is larger than array.length - start,
                        //   then all of the elements beginning with start index on through the end of the array will be deleted.
                        if (deleteCount === undefined || actualDeleteCount > this.length - actualStart) {
                            actualDeleteCount = this.length - actualStart;
                        }
                        if (actualDeleteCount < 0) {
                            actualDeleteCount = 0;
                        }
                        for (let i = 0; i < actualDeleteCount; i++) {
                            const index = actualStart + i;
                            _removeStacks(map, `${index}`);
                        }
                        // Move existing traces into new locations.
                        const newItemCount = items.length;
                        if (newItemCount > actualDeleteCount) {
                            // Shift *upward*
                            const delta = newItemCount - actualDeleteCount;
                            for (let i = this.length - 1; i >= actualStart + actualDeleteCount; i--) {
                                _copyStacks(map, `${i}`, `${i + delta}`);
                            }
                        }
                        else if (newItemCount < actualDeleteCount) {
                            // Shift *downward*
                            const delta = newItemCount - actualDeleteCount;
                            for (let i = actualStart + actualDeleteCount; i < this.length; i++) {
                                _copyStacks(map, `${i}`, `${i + delta}`);
                            }
                            // Delete extra traces for removed indexes.
                            for (let i = this.length + delta; i < this.length; i++) {
                                _removeStacks(map, `${i}`);
                            }
                        }
                        const trace = _getStackTrace();
                        // Add new traces for new items.
                        for (let i = 0; i < newItemCount; i++) {
                            _removeStacks(map, `${actualStart + i}`);
                            _addStackTrace(map, `${actualStart + i}`, trace);
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
            let fromIndex = fromIndexArg || 0;
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
        Array.prototype.lastIndexOf = function (searchElement, fromIndex = 0) {
            if (this === void 0 || this === null) {
                throw new TypeError();
            }
            let t = Object(this), len = t.length >>> 0;
            if (len === 0) {
                return -1;
            }
            let n = len - 1;
            if (arguments.length > 1) {
                n = Number(arguments[1]);
                if (n != n) {
                    n = 0;
                }
                else if (n != 0 && n != (1 / 0) && n != -(1 / 0)) {
                    n = (n > 0 ? 1 : -1) * Math.floor(Math.abs(n));
                }
            }
            for (let k = n >= 0 ? Math.min(n, len - 1) : len - Math.abs(n); k >= 0; k--) {
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
            let seed = 0x2F6E2B1;
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
        let dateNowCount = 0;
        Date.now = Date.prototype.getTime = function () {
            return 1516992512425 + (dateNowCount++);
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
            const original = Object.getOwnPropertyDescriptor(obj, property);
            if (!original.configurable) {
                return;
            }
            try {
                Object.defineProperty(obj, property, {
                    get: function () {
                        const value = original.get ? original.get.apply(unwrapIfProxy(this)) : original.value;
                        if (typeof (value) === "function") {
                            return function (...args) {
                                return wrapIfOriginal(unwrapIfProxy(value).apply(unwrapIfProxy(this), args.map(unwrapIfProxy)));
                            };
                        }
                        else {
                            return wrapIfOriginal(value);
                        }
                    },
                    set: function (v) {
                        const originalV = unwrapIfProxy(v);
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
                logToConsole(`Unable to instrument ${key}`);
            }
        }
        /**
         * Interposition "on[eventname]" properties and store value as an expando
         * property on DOM element so it shows up in the heap snapshot.
         * @param obj
         * @param propName
         */
        function interpositionEventListenerProperty(obj, propName) {
            const desc = Object.getOwnPropertyDescriptor(obj, propName);
            if (desc) {
                delete desc['value'];
                delete desc['writable'];
                const set = desc.set;
                desc.set = function (val) {
                    set.call(this, val);
                    this[`$$${propName}`] = val;
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
                IDBRequest.prototype, IDBTransaction.prototype, window].forEach((obj) => {
                Object.keys(obj).filter((p) => p.startsWith("on")).forEach((p) => {
                    interpositionEventListenerProperty(obj, p);
                });
            });
            //const countMap = new Map<string, Count>();
            [[Node.prototype, "Node"], [Element.prototype, "Element"], [HTMLElement.prototype, "HTMLElement"],
                [Document.prototype, "Document"], [HTMLCanvasElement.prototype, "HTMLCanvasElement"],
                [NodeList.prototype, "NodeList"]]
                .forEach((v) => Object.keys(v[0]).forEach((k) => proxyInterposition(v[0], k, `${v[1]}.${k}`)));
            // TODO: Remove instrumentation when element moved?
            const $$$REINSTRUMENT$$$ = function () {
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
            const textContent = Object.getOwnPropertyDescriptor(Node.prototype, 'textContent');
            // textContent: Pass in a string. Replaces all children w/ a single text node.
            Object.defineProperty(Node.prototype, 'textContent', {
                get: textContent.get,
                set: function (v) {
                    const rv = textContent.set.call(this, v);
                    const cn = this.childNodes;
                    if (getProxyStatus(cn) === 0 /* IS_PROXY */) {
                        const traces = getProxyStackTraces(cn);
                        traces.clear();
                        _initializeMap(cn, traces, _getStackTrace());
                    }
                    this.childNodes.$$$REINSTRUMENT$$$();
                    return rv;
                },
                enumerable: true,
                configurable: true
            });
            const appendChild = Node.prototype.appendChild;
            Node.prototype.appendChild = function (newChild) {
                /**
                 * The Node.appendChild() method adds a node to the end of the list of children of a specified parent node.
                 * If the given child is a reference to an existing node in the document,
                 * appendChild() moves it from its current position to the new position.
                 */
                if (newChild.parentNode !== null) {
                    newChild.parentNode.removeChild(newChild);
                }
                const cn = this.childNodes;
                if (getProxyStatus(cn) === 0 /* IS_PROXY */) {
                    const traces = getProxyStackTraces(cn);
                    _addStackTrace(traces, `${cn.length}`);
                }
                const rv = appendChild.call(this, newChild);
                cn.$$$REINSTRUMENT$$$();
                return rv;
            };
            const insertBefore = Node.prototype.insertBefore;
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
                const cn = this.childNodes;
                if (getProxyStatus(cn) === 0 /* IS_PROXY */) {
                    if (refChild === null) {
                        // Avoid tracking stack traces for special case.
                        return this.appendChild(newChild);
                    }
                    else {
                        const stacks = getProxyStackTraces(cn);
                        const len = cn.length;
                        let position = -1;
                        for (let i = 0; i < len; i++) {
                            if ($$$SEQ$$$(cn[i], refChild)) {
                                position = i;
                                break;
                            }
                        }
                        if (position === -1) {
                            logToConsole(`insertBefore called with invalid node!`);
                        }
                        else {
                            for (let i = len - 1; i >= position; i--) {
                                _copyStacks(stacks, `${i}`, `${i + 1}`);
                            }
                            _removeStacks(stacks, `${position}`);
                            _addStackTrace(stacks, `${position}`);
                        }
                    }
                }
                const rv = insertBefore.call(this, newChild, refChild);
                cn.$$$REINSTRUMENT$$$();
                return rv;
            };
            const normalize = Node.prototype.normalize;
            function normalizeInternal(n) {
                const children = n.childNodes;
                const len = children.length;
                const stacks = getProxyStackTraces(n.childNodes);
                let prevTextNode = null;
                let prevTextNodeI = -1;
                let toRemove = [];
                for (let i = 0; i < len; i++) {
                    const child = children[i];
                    if (child.nodeType === Node.TEXT_NODE) {
                        if (child.textContent === "") {
                            // Remove empty text nodes.
                            toRemove.push(i);
                        }
                        else if (prevTextNode) {
                            // Merge adjacent text nodes.
                            prevTextNode.textContent += child.textContent;
                            if (stacks) {
                                _combineStacks(stacks, `${prevTextNodeI}`, `${i}`);
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
                const removeLen = toRemove.length;
                for (let i = removeLen - 1; i >= 0; i--) {
                    n.removeChild(children[toRemove[i]]);
                }
                const len2 = children.length;
                for (let i = 0; i < len2; i++) {
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
                    return normalize.call(this);
                }
            };
            const removeChild = Node.prototype.removeChild;
            Node.prototype.removeChild = function (child) {
                const cn = this.childNodes;
                if (getProxyStatus(cn) === 0 /* IS_PROXY */) {
                    const stacks = getProxyStackTraces(cn);
                    const children = this.childNodes;
                    const len = children.length;
                    let i = 0;
                    for (; i < len; i++) {
                        if ($$$SEQ$$$(children[i], child)) {
                            break;
                        }
                    }
                    if (i === len) {
                        logToConsole(`Invalid call to removeChild.`);
                    }
                    else {
                        for (let j = i + 1; j < len; j++) {
                            _copyStacks(stacks, `${j}`, `${j - 1}`);
                        }
                        _removeStacks(stacks, `${len - 1}`);
                    }
                }
                const rv = removeChild.call(this, child);
                cn.$$$REINSTRUMENT$$$();
                return rv;
            };
            // replaceChild: Replaces a child.
            const replaceChild = Node.prototype.replaceChild;
            Node.prototype.replaceChild = function (newChild, oldChild) {
                const cn = this.childNodes;
                if (getProxyStatus(cn) === 0 /* IS_PROXY */) {
                    const stacks = getProxyStackTraces(cn);
                    let i = 0;
                    const len = cn.length;
                    for (; i < len; i++) {
                        if ($$$SEQ$$$(cn[i], oldChild)) {
                            break;
                        }
                    }
                    if (i === len) {
                        logToConsole(`replaceChild called with invalid child`);
                    }
                    else {
                        _addStackTrace(stacks, `${i}`);
                    }
                }
                const rv = replaceChild.call(this, newChild, oldChild);
                cn.$$$REINSTRUMENT$$$();
                return rv;
            };
            const innerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
            Object.defineProperty(Element.prototype, 'innerHTML', {
                get: innerHTML.get,
                set: function (t) {
                    const rv = innerHTML.set.call(this, t);
                    const cn = this.childNodes;
                    if (getProxyStatus(cn) === 0 /* IS_PROXY */) {
                        const stacks = getProxyStackTraces(cn);
                        stacks.clear();
                        _initializeMap(cn, stacks, _getStackTrace());
                    }
                    cn.$$$REINSTRUMENT$$$();
                    return rv;
                },
                configurable: true,
                enumerable: true
            });
            const outerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'outerHTML');
            Object.defineProperty(Element.prototype, 'outerHTML', {
                get: outerHTML.get,
                set: function (v) {
                    const parent = this.parentNode;
                    if (parent) {
                        const parentCn = parent.childNodes;
                        if (getProxyStatus(parentCn) === 0 /* IS_PROXY */) {
                            const len = parentCn.length;
                            let i = 0;
                            for (; i < len; i++) {
                                if (parentCn[i] === this) {
                                    break;
                                }
                            }
                            if (i === len) {
                                logToConsole(`Invalid call to outerHTML: Detached node?`);
                            }
                            else {
                                const stacks = getProxyStackTraces(parentCn);
                                _removeStacks(stacks, `${i}`);
                                _addStackTrace(stacks, `${i}`);
                            }
                        }
                    }
                    const rv = outerHTML.set.call(this, v);
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
                            const parent = e.parentNode;
                            const siblings = parent.childNodes;
                            const numSiblings = siblings.length;
                            let i = 0;
                            for (; i < numSiblings; i++) {
                                if ($$$SEQ$$$(siblings[i], e)) {
                                    break;
                                }
                            }
                            if (i !== numSiblings) {
                                // Does it shift things down before or after this element?
                                let start = position === 'beforebegin' ? i : i + 1;
                                const stacks = getProxyStackTraces(siblings);
                                for (i = numSiblings - 1; i >= start; i--) {
                                    _copyStacks(stacks, `${i}`, `${i + 1}`);
                                }
                                _removeStacks(stacks, `${start}`);
                                _addStackTrace(stacks, `${start}`);
                            }
                        }
                        break;
                    }
                    case 'afterbegin':
                    case 'beforeend': {
                        const cn = e.childNodes;
                        if (getProxyStatus(cn) === 0 /* IS_PROXY */) {
                            const numChildren = cn.length;
                            const stacks = getProxyStackTraces(cn);
                            if (position === 'afterbegin') {
                                for (let i = numChildren - 1; i >= 0; i--) {
                                    _copyStacks(stacks, `${i}`, `${i + 1}`);
                                }
                                _removeStacks(stacks, `0`);
                                _addStackTrace(stacks, `0`);
                            }
                            else {
                                _addStackTrace(stacks, `${numChildren}`);
                            }
                        }
                        break;
                    }
                }
            }
            const insertAdjacentElement = Element.prototype.insertAdjacentElement;
            Element.prototype.insertAdjacentElement = function (position, insertedElement) {
                /**
                 * The insertAdjacentElement() method inserts a given element node at a given
                 * position relative to the element it is invoked upon.
                 */
                insertAdjacentHelper(this, position);
                const rv = insertAdjacentElement.call(this, position, insertedElement);
                if (position === 'afterbegin' || position === 'beforeend') {
                    this.childNodes.$$$REINSTRUMENT$$$();
                }
                else if (this.parentNode) {
                    this.parentNode.childNodes.$$$REINSTRUMENT$$$();
                }
                return rv;
            };
            const insertAdjacentHTML = Element.prototype.insertAdjacentHTML;
            Element.prototype.insertAdjacentHTML = function (where, html) {
                insertAdjacentHelper(this, where);
                const rv = insertAdjacentHTML.call(this, where, html);
                if (where === 'afterbegin' || where === 'beforeend') {
                    this.childNodes.$$$REINSTRUMENT$$$();
                }
                else if (this.parentNode) {
                    this.parentNode.childNodes.$$$REINSTRUMENT$$$();
                }
                return rv;
            };
            const insertAdjacentText = Element.prototype.insertAdjacentText;
            Element.prototype.insertAdjacentText = function (where, text) {
                insertAdjacentHelper(this, where);
                const rv = insertAdjacentText.call(this, where, text);
                if (where === 'afterbegin' || where === 'beforeend') {
                    this.childNodes.$$$REINSTRUMENT$$$();
                }
                else if (this.parentNode) {
                    this.parentNode.childNodes.$$$REINSTRUMENT$$$();
                }
                return rv;
            };
            const remove = Element.prototype.remove;
            Element.prototype.remove = function () {
                const parent = this.parentNode;
                if (parent) {
                    parent.removeChild(this);
                }
                else {
                    remove.call(this);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmxlYWtfYWdlbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvbGliL2JsZWFrX2FnZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLGNBQWMsQ0FBQztBQXFFZjs7R0FFRztBQUNILENBQUM7SUFDQyxvQkFBb0I7SUFDcEIsTUFBTSxTQUFTLEdBQUcsT0FBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLFdBQVcsQ0FBQztJQUNqRCxNQUFNLFNBQVMsR0FBRyxPQUFNLENBQUMsYUFBYSxDQUFDLEtBQUssV0FBVyxDQUFDO0lBQ3hELE1BQU0sSUFBSSxHQUFZLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUN2RSwrQkFBK0I7SUFDL0IsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLENBQUMsQ0FBQztRQUNoQyxNQUFNLENBQUM7SUFDVCxDQUFDO0lBQ0QsSUFBSSxDQUFDLHNCQUFzQixHQUFHLHNCQUFzQixDQUFDO0lBQ3JELElBQUksQ0FBQyxzQkFBc0IsR0FBRyxzQkFBc0IsQ0FBQztJQUNyRCxJQUFJLENBQUMseUJBQXlCLEdBQUcseUJBQXlCLENBQUM7SUFDM0QsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7SUFDekIsSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7SUFDM0IsSUFBSSxDQUFDLGVBQWUsR0FBRyxlQUFlLENBQUM7SUFDdkMsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUM7SUFDekIsSUFBSSxDQUFDLGtCQUFrQixHQUFHLGtCQUFrQixDQUFDO0lBQzdDLElBQUksQ0FBQyx5QkFBeUIsR0FBRyx5QkFBeUIsQ0FBQztJQUMzRCxJQUFJLENBQUMsdUJBQXVCLEdBQUcsdUJBQXVCLENBQUM7SUFDdkQsSUFBSSxDQUFDLHVC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WUFBWTtRQUNaLHdCQUF3QjtRQUN4QixxQkFBcUI7UUFDckIscUJBQXFCO1FBQ3JCLFNBQVM7UUFDVCw4RUFBOEU7UUFDOUUsOEJBQThCO1FBRTlCLGNBQWM7UUFDZCxtQ0FBbUM7UUFFbkMsaUJBQWlCO1FBQ2pCLHVCQUF1QjtRQUN2QixzQkFBc0I7UUFDdEIsNkJBQTZCO1FBQzdCLHlCQUF5QjtRQUN6QixvQkFBb0I7UUFDcEIsZ0JBQWdCO1FBQ2hCLHdCQUF3QjtRQUN4Qiw0RUFBNEU7UUFDNUUscUJBQXFCO1FBQ3JCLGdCQUFnQjtRQUNoQix3QkFBd0I7UUFDeEIsZUFBZTtRQUNmLGlCQUFpQjtRQUNqQixZQUFZO1FBQ1osbUJBQW1CO1FBQ25CLDhCQUE4QjtRQUM5QixjQUFjO1FBQ2QsZ0JBQWdCO1FBQ2hCLHFCQUFxQjtRQUNyQixlQUFlO1FBQ2YsbUJBQW1CO1FBQ25CLGdDQUFnQztJQUdsQyxDQUFDO0FBQ0gsQ0FBQyxDQUFDLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIlwibm8gdHJhbnNmb3JtXCI7XG5cbmludGVyZmFjZSBPYmplY3Qge1xuICAkJCRQUk9YWSQkJD86IGFueTtcbn1cblxuaW50ZXJmYWNlIFNjb3BlIHtcbiAgW2lkZW50OiBzdHJpbmddOiBhbnk7XG59XG5cbmludGVyZmFjZSBGdW5jdGlvbiB7XG4gIF9fc2NvcGVfXzogU2NvcGU7XG59XG5cbmludGVyZmFjZSBNaXJyb3JOb2RlIHtcbiAgcm9vdDogTm9kZTtcbiAgY2hpbGROb2RlczogQ2hpbGROb2Rlcztcbn1cblxuaW50ZXJmYWNlIENoaWxkTm9kZXMge1xuICBbcDogc3RyaW5nXTogTWlycm9yTm9kZSB8IG51bWJlcjtcbiAgbGVuZ3RoOiBudW1iZXI7XG59XG5cbmludGVyZmFjZSBXaW5kb3cge1xuICAkJCRJTlNUUlVNRU5UX1BBVEhTJCQkKHA6IElQYXRoVHJlZXMpOiB2b2lkO1xuICAkJCRHRVRfU1RBQ0tfVFJBQ0VTJCQkKCk6IEdyb3dpbmdTdGFja1RyYWNlcztcbiAgJCQkQ1JFQVRFX1NDT1BFX09CSkVDVCQkJChwYXJlbnRTY29wZU9iamVjdDogU2NvcGUsIG1vdmVkVmFyaWFibGVzOiBzdHJpbmdbXSwgdW5tb3ZlZFZhcmlhYmxlczogUHJvcGVydHlEZXNjcmlwdG9yTWFwLCBhcmdzOiBzdHJpbmdbXSwgYXJnVmFsdWVzOiBhbnlbXSk6IFNjb3BlO1xuICAkJCRTRVEkJCQoYTogYW55LCBiOiBhbnkpOiBib29sZWFuO1xuICAkJCRFUSQkJChhOiBhbnksIGI6IGFueSk6IGJvb2xlYW47XG4gICQkJFNIT1VMREZJWCQkJChuOiBudW1iZXIpOiBib29sZWFuO1xuICAkJCRHTE9CQUwkJCQ6IFdpbmRvdztcbiAgJCQkUkVXUklURV9FVkFMJCQkKHNjb3BlOiBhbnksIHNvdXJjZTogc3RyaW5nKTogYW55O1xuICAkJCRGVU5DVElPTl9FWFBSRVNTSU9OJCQkKGZjbjogRnVuY3Rpb24sIHNjb3BlOiBTY29wZSk6IEZ1bmN0aW9uO1xuICAkJCRPQkpFQ1RfRVhQUkVTU0lPTiQkJChvYmo6IG9iamVjdCwgc2NvcGU6IFNjb3BlKTogb2JqZWN0O1xuICAkJCRDUkVBVEVfV0lUSF9TQ09QRSQkJCh3aXRoT2JqOiBPYmplY3QsIHNjb3BlOiBTY29wZSk6IFNjb3BlO1xuICAkJCRTRVJJQUxJWkVfRE9NJCQkKCk6IHZvaWQ7XG4gICQkJERPTSQkJDogTWlycm9yTm9kZTtcbn1cblxuaW50ZXJmYWNlIExpc3RlbmVySW5mbyB7XG4gIHVzZUNhcHR1cmU6IGJvb2xlYW4gfCBvYmplY3Q7XG4gIGxpc3RlbmVyOiBFdmVudExpc3RlbmVyT3JFdmVudExpc3RlbmVyT2JqZWN0O1xufVxuXG5pbnRlcmZhY2UgRXZlbnRUYXJnZXQge1xuICAkJGxpc3RlbmVycz86IHtbdHlwZTogc3RyaW5nXTogTGlzdGVuZXJJbmZvW119O1xuICAvLyBOb3RlOiBOZWVkcyB0byBiZSBhIHN0cmluZyBzbyBpdCBzaG93cyB1cCBpbiB0aGUgc25hcHNob3QuXG4gICQkaWQ/OiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBOb2RlTGlzdCB7XG4gICQkJFRSRUUkJCQ6IElQYXRoVHJlZTtcbiAgJCQkQUNDRVNTX1NUUklORyQkJDogc3RyaW5nO1xuICAkJCRTVEFDS1RSQUNFUyQkJDogR3Jvd3RoT2JqZWN0U3RhY2tUcmFjZXM7XG4gICQkJFJFSU5TVFJVTUVOVCQkJCgpOiB2b2lkO1xufVxuXG5pbnRlcmZhY2UgTm9kZSB7XG4gICQkJFRSRUUkJCQ6IElQYXRoVHJlZTtcbiAgJCQkQUNDRVNTX1NUUklORyQkJDogc3RyaW5nO1xuICAkJCRTVEFDS1RSQUNFUyQkJDogR3Jvd3RoT2JqZWN0U3RhY2tUcmFjZXM7XG4gICQkJFJFSU5TVFJVTUVOVCQkJCgpOiB2b2lkO1xufVxuXG50eXBlIEdyb3d0aE9iamVjdFN0YWNrVHJhY2VzID0gTWFwPHN0cmluZyB8IG51bWJlciB8IHN5bWJvbCwgU2V0PHN0cmluZz4+O1xuXG5kZWNsYXJlIGZ1bmN0aW9uIGltcG9ydFNjcmlwdHMoczogc3RyaW5nKTogdm9pZDtcblxuLyoqXG4gKiBBZ2VudCBpbmplY3RlZCBpbnRvIHRoZSB3ZWJwYWdlIHRvIHN1cmZhY2UgYnJvd3Nlci1oaWRkZW4gbGVha3MgYXQgdGhlIEpTIGxldmVsLlxuICovXG4oZnVuY3Rpb24oKSB7XG4gIC8vIEdsb2JhbCB2YXJpYWJsZXMuXG4gIGNvbnN0IElTX1dJTkRPVyA9IHR5cGVvZih3aW5kb3cpICE9PSBcInVuZGVmaW5lZFwiO1xuICBjb25zdCBJU19XT1JLRVIgPSB0eXBlb2YoaW1wb3J0U2NyaXB0cykgIT09IFwidW5kZWZpbmVkXCI7XG4gIGNvbnN0IFJPT1QgPSA8V2luZG93PiAoSVNfV0lORE9XID8gd2luZG93IDogSVNfV09SS0VSID8gc2VsZiA6IGdsb2JhbCk7XG4gIC8vIEF2b2lkIGluc3RhbGxpbmcgc2VsZiB0d2ljZS5cbiAgaWYgKFJPT1QuJCQkSU5TVFJVTUVOVF9QQVRIUyQkJCkge1xuICAgIHJldHVybjtcbiAgfVxuICBST09ULiQkJElOU1RSVU1FTlRfUEFUSFMkJCQgPSAkJCRJTlNUUlVNRU5UX1BBVEhTJCQkO1xuICBST09ULiQkJEdFVF9TVEFDS19UUkFDRVMkJCQgPSAkJCRHRVRfU1RBQ0tfVFJBQ0VTJCQkO1xuICBST09ULiQkJENSRUFURV9TQ09QRV9PQkpFQ1QkJCQgPSAkJCRDUkVBVEVfU0NPUEVfT0JKRUNUJCQkO1xuICBST09ULiQkJEVRJCQkID0gJCQkRVEkJCQ7XG4gIFJPT1QuJCQkU0VRJCQkID0gJCQkU0VRJCQkO1xuICBST09ULiQkJFNIT1VMREZJWCQkJCA9ICQkJFNIT1VMREZJWCQkJDtcbiAgUk9PVC4kJCRHTE9CQUwkJCQgPSBST09UO1xuICBST09ULiQkJFJFV1JJVEVfRVZBTCQkJCA9ICQkJFJFV1JJVEVfRVZBTCQkJDtcbiAgUk9PVC4kJCRGVU5DVElPTl9FWFBSRVNTSU9OJCQkID0gJCQkRlVOQ1RJT05fRVhQUkVTU0lPTiQkJDtcbiAgUk9PVC4kJCRPQkpFQ1RfRVhQUkVTU0lPTiQkJCA9ICQkJE9CSkVDVF9FWFBSRVNTSU9OJCQkO1xuICBST09ULiQkJENSRUFURV9XSVRIX1NDT1BFJCQkID0gJCQkQ1JFQVRFX1dJVEhfU0NPUEUkJCQ7XG4gIFJPT1QuJCQkU0VSSUFMSVpFX0RPTSQkJCA9ICQkJFNFUklBTElaRV9ET00kJCQ7XG5cbiAgY29uc3QgciA9IC8nL2c7XG4gIC8vIFNvbWUgd2Vic2l0ZXMgb3ZlcndyaXRlIGxvZ1RvQ29uc29sZS5cbiAgY29uc3QgY29uc29sZSA9IFJPT1QuY29uc29sZSA/IFJPT1QuY29uc29sZSA6IHsgbG9nOiAoc3RyOiBzdHJpbmcpID0+IHt9IH07XG4gIGNvbnN0IGNvbnNvbGVMb2cgPSBjb25zb2xlLmxvZztcbiAgZnVuY3Rpb24gbG9nVG9Db25zb2xlKHM6IHN0cmluZykge1xuICAgIGNvbnNvbGVMb2cuY2FsbChjb25zb2xlLCBzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBzdGFjayB0cmFjZS5cbiAgICovXG4gIGZ1bmN0aW9uIF9nZXRTdGFja1RyYWNlKCk6IHN0cmluZyB7XG4gICAgdHJ5IHtcbiAgICAgIHRocm93IG5ldyBFcnJvcigpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJldHVybiBlLnN0YWNrO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBFc2NhcGVzIHNpbmdsZSBxdW90ZXMgaW4gdGhlIGdpdmVuIHN0cmluZy5cbiAgICogQHBhcmFtIHNcbiAgICovXG4gIGZ1bmN0aW9uIHNhZmVTdHJpbmcoczogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gcy5yZXBsYWNlKHIsIFwiXFxcXCdcIik7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHNjb3BlIG9iamVjdC5cbiAgICogQHBhcmFtIHBhcmVudFNjb3BlT2JqZWN0IFRoZSBzY29wZSBvYmplY3QgZm9yIHRoZSBlbmNsb3Npbmcgc2NvcGUuXG4gICAqIEBwYXJhbSBtb3ZlZFZhcmlhYmxlcyBTY29wZSB2YXJpYWJsZXMgdGhhdCBoYXZlIGJlZW4gXCJtb3ZlZFwiIHRvIHRoaXMgb2JqZWN0LlxuICAgKiBAcGFyYW0gdW5tb3ZlZFZhcmlhYmxlcyBVbm1vdmVkIHNjb3BlIHZhcmlhYmxlcyB0aGF0IGFyZSByZWZlcmVuY2VkIGZyb20gdGhpcyBvYmplY3QuIE11c3QgYmUgc3BlY2lmaWVkIGFzIGdldHRlcnMvc2V0dGVycyBhcyB0aGlzIGNvbnRleHQgZG9lcyBub3QgaGF2ZSBhY2Nlc3MgdG8gdGhlIHVubW92ZWQgdmFyaWFibGVzLlxuICAgKiBAcGFyYW0gYXJncyBUaGUgbmFtZSBvZiB0aGUgZnVuY3Rpb24ncyBhcmd1bWVudHMuXG4gICAqIEBwYXJhbSBhcmdWYWx1ZXMgVGhlIHZhbHVlcyBvZiB0aGUgZnVuY3Rpb24ncyBhcmd1bWVudHMuXG4gICAqL1xuICBmdW5jdGlvbiAkJCRDUkVBVEVfU0NPUEVfT0JKRUNUJCQkKHBhcmVudFNjb3BlT2JqZWN0OiBTY29wZSwgbW92ZWRWYXJpYWJsZXM6IHN0cmluZ1tdLCB1bm1vdmVkVmFyaWFibGVzOiBQcm9wZXJ0eURlc2NyaXB0b3JNYXAsIGFyZ3M6IHN0cmluZ1tdLCBhcmdWYWx1ZXM6IGFueVtdKTogU2NvcGUge1xuICAgIG1vdmVkVmFyaWFibGVzLmNvbmNhdChhcmdzKS5mb3JFYWNoKCh2YXJOYW1lKSA9PiB7XG4gICAgICB1bm1vdmVkVmFyaWFibGVzW3Zhck5hbWVdID0ge1xuICAgICAgICB2YWx1ZTogdW5kZWZpbmVkLFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICB9O1xuICAgIH0pO1xuXG4gICAgLy8gSW5pdGlhbGl6ZSBhcmd1bWVudHMuXG4gICAgYXJncy5mb3JFYWNoKChhcmdOYW1lLCBpKSA9PiB7XG4gICAgICB1bm1vdmVkVmFyaWFibGVzW2FyZ05hbWVdLnZhbHVlID0gYXJnVmFsdWVzW2ldO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIE9iamVjdC5jcmVhdGUocGFyZW50U2NvcGVPYmplY3QsIHVubW92ZWRWYXJpYWJsZXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlaW1wbGVtZW50YXRpb24gb2YgPT0gc3VjaCB0aGF0IFByb3h5KEEpID09IEEuXG4gICAqIEBwYXJhbSBhXG4gICAqIEBwYXJhbSBiXG4gICAqL1xuICBmdW5jdGlvbiAkJCRFUSQkJChhOiBhbnksIGI6IGFueSk6IGJvb2xlYW4ge1xuICAgIGlmICgkJCRTRVEkJCQoYSwgYikpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gYSA9PSBiO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZWltcGxlbWVudGF0aW9uIG9mID09PSBzdWNoIHRoYXQgUHJveHkoQSkgPT09IEEuXG4gICAqIEBwYXJhbSBhXG4gICAqIEBwYXJhbSBiXG4gICAqL1xuICBmdW5jdGlvbiAkJCRTRVEkJCQoYTogYW55LCBiOiBhbnkpOiBib29sZWFuIHtcbiAgICBpZiAoYSA9PT0gYikge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBlbHNlIGlmIChpc1Byb3h5YWJsZShhKSAmJiBpc1Byb3h5YWJsZShiKSkge1xuICAgICAgcmV0dXJuIChhLmhhc093blByb3BlcnR5KCckJCRQUk9YWSQkJCcpICYmIGEuJCQkUFJPWFkkJCQgPT09IGIpIHx8XG4gICAgICAgIChiLmhhc093blByb3BlcnR5KFwiJCQkUFJPWFkkJCRcIikgJiYgYi4kJCRQUk9YWSQkJCA9PT0gYSk7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGNvbnN0IGZpeFNldCA9IG5ldyBTZXQ8bnVtYmVyPigpO1xuICAvKipcbiAgICogQ2hlY2tzIHRoYXQgYnVnIG4gc2hvdWxkIGJlIGZpeGVkLlxuICAgKiBAcGFyYW0gbiBVbmlxdWUgYnVnIElELlxuICAgKi9cbiAgZnVuY3Rpb24gJCQkU0hPVUxERklYJCQkKG46IG51bWJlcik6IGJvb2xlYW47XG4gIC8qKlxuICAgKiBTZXRzIHdoZXRoZXIgb3Igbm90IGJ1ZyBuIHNob3VsZCBiZSBmaXhlZC5cbiAgICogQHBhcmFtIG4gVW5pcXVlIGJ1ZyBJRC5cbiAgICogQHBhcmFtIHZhbHVlIElmIHRydWUsIGJ1ZyBuIHNob3VsZCBiZSBmaXhlZC5cbiAgICovXG4gIGZ1bmN0aW9uICQkJFNIT1VMREZJWCQkJChuOiBudW1iZXIsIHZhbHVlOiBib29sZWFuKTogdm9pZDtcbiAgZnVuY3Rpb24gJCQkU0hPVUxERklYJCQkKG46IG51bWJlciwgdmFsdWU/OiBib29sZWFuKTogYm9vbGVhbiB8IHZvaWQge1xuICAgIGlmICh2YWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgZml4U2V0LmFkZChuKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZpeFNldC5kZWxldGUobik7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBmaXhTZXQuaGFzKG4pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBcHBsaWVzIGEgd3JpdGUgdG8gdGhlIGdpdmVuIHNjb3BlLiBVc2VkIGluIGBldmFsKClgIHRvIGF2b2lkIHN0b3JpbmcvdHJhbnNtaXR0aW5nXG4gICAqIG1ldGFkYXRhIGZvciBwYXJ0aWN1bGFyIHNjb3BlIG9iamVjdHMuXG4gICAqXG4gICAqIFNlYXJjaGVzIHRoZSBzY29wZSBjaGFpbiBmb3IgdGhlIGdpdmVuIGBrZXlgLiBJZiBmb3VuZCwgaXQgb3ZlcndyaXRlcyB0aGUgdmFsdWUgb25cbiAgICogdGhlIHJlbGV2YW50IHNjb3BlIGluIHRoZSBzY29wZSBjaGFpbi5cbiAgICogQHBhcmFtIHRhcmdldFxuICAgKiBAcGFyYW0ga2V5XG4gICAqIEBwYXJhbSB2YWx1ZVxuICAgKi9cbiAgZnVuY3Rpb24gYXBwbHlXcml0ZSh0YXJnZXQ6IFNjb3BlLCBrZXk6IHN0cmluZywgdmFsdWU6IGFueSk6IGJvb2xlYW4ge1xuICAgIGlmICh0YXJnZXQgPT09IG51bGwpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2UgaWYgKHRhcmdldC5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICB0YXJnZXRba2V5XSA9IHZhbHVlO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBhcHBseVdyaXRlKE9iamVjdC5nZXRQcm90b3R5cGVPZih0YXJnZXQpLCBrZXksIHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICAvLyBTZW50aW5lbFxuICBjb25zdCBQUk9QX05PVF9GT1VORCA9IHt9O1xuXG4gIC8qKlxuICAgKiBHb2VzIHVwIHRoZSBzY29wZSBjaGFpbiBvZiB0aGUgb2JqZWN0ICh3aGljaCBtYXkgYmUgYSBzY29wZSBvciB0aGUgdGFyZ2V0XG4gICAqIG9mIGEgYHdpdGgoKWAgc3RhdGVtZW50KSB0byBkZXRlcm1pbmUgaWYgYSBnaXZlbiBrZXkgaXMgZGVmaW5lZCBpbiB0aGUgb2JqZWN0LlxuICAgKiBAcGFyYW0gdGFyZ2V0IFRoZSBzY29wZSBvYmplY3Qgb3Igd2l0aCB0YXJnZXQuXG4gICAqIEBwYXJhbSBrZXkgVGhlIGtleSB3ZSBhcmUgbG9va2luZyBmb3IuXG4gICAqL1xuICBmdW5jdGlvbiB3aXRoR2V0KHRhcmdldDogYW55LCBrZXk6IHN0cmluZyk6IGFueSB7XG4gICAgaWYgKGtleSBpbiB0YXJnZXQpIHtcbiAgICAgIHJldHVybiB0YXJnZXRba2V5XTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFBST1BfTk9UX0ZPVU5EO1xuICAgIH1cbiAgfVxuXG4gIC8vIFJldXNlYWJsZSBldmFsKCkgZnVuY3Rpb24uIERvZXMgbm90IGhhdmUgYSBwb2xsdXRlZCBzY29wZS5cbiAgY29uc3QgRVZBTF9GQ04gPSBuZXcgRnVuY3Rpb24oJ3Njb3BlJywgJyQkJFNSQyQkJCcsICdyZXR1cm4gZXZhbCgkJCRTUkMkJCQpOycpO1xuICAvLyBDYWNoZXMgY29tcGlsZWQgZXZhbCBzdGF0ZW1lbnRzIGZyb20gc2VydmVyIHRvIHJlZHVjZSBzeW5jaHJvbm91cyBYSFJzLlxuICBjb25zdCBFVkFMX0NBQ0hFID0gbmV3IE1hcDxzdHJpbmcsIHsgZTogc3RyaW5nLCB0czogbnVtYmVyIH0+KCk7XG4gIGNvbnN0IEVWQUxfQ0FDSEVfTElNSVQgPSAxMDA7XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgdGhlIDEwIGl0ZW1zIGZyb20gRVZBTF9DQUNIRSB0aGF0IHdlcmUgbGVhc3QgcmVjZW50bHkgdXNlZC5cbiAgICovXG4gIGZ1bmN0aW9uIHRyaW1FdmFsQ2FjaGUoKSB7XG4gICAgY29uc3QgaXRlbXM6IHtlOiBzdHJpbmcsIHRzOiBudW1iZXJ9W10gPSBbXTtcbiAgICBFVkFMX0NBQ0hFLmZvckVhY2goKGkpID0+IGl0ZW1zLnB1c2goaSkpO1xuICAgIGl0ZW1zLnNvcnQoKGEsIGIpID0+IGEudHMgLSBiLnRzKTtcbiAgICBpdGVtcy5zbGljZSgwLCAxMCkuZm9yRWFjaCgoaSkgPT4ge1xuICAgICAgRVZBTF9DQUNIRS5kZWxldGUoaS5lKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kcyB0ZXh0IHBhc3NlZCB0byBgZXZhbGAgdG8gdGhlIHNlcnZlciBmb3IgcmV3cml0aW5nLFxuICAgKiBhbmQgdGhlbiBldmFsdWF0ZXMgdGhlIG5ldyBzdHJpbmcuXG4gICAqIEBwYXJhbSBzY29wZSBUaGUgY29udGV4dCBpbiB3aGljaCBldmFsIHdhcyBjYWxsZWQuXG4gICAqIEBwYXJhbSB0ZXh0IFRoZSBKYXZhU2NyaXB0IGNvZGUgdG8gZXZhbC5cbiAgICovXG4gIGZ1bmN0aW9uICQkJFJFV1JJVEVfRVZBTCQkJChzY29wZTogYW55LCBzb3VyY2U6IHN0cmluZyk6IGFueSB7XG4gICAgbGV0IGNhY2hlID0gRVZBTF9DQUNIRS5nZXQoc291cmNlKTtcbiAgICBpZiAoIWNhY2hlKSB7XG4gICAgICBjb25zdCB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICAgIHhoci5vcGVuKCdQT1NUJywgJy9ldmFsJywgZmFsc2UpO1xuICAgICAgeGhyLnNldFJlcXVlc3RIZWFkZXIoXCJDb250ZW50LXR5cGVcIiwgXCJhcHBsaWNhdGlvbi9qc29uXCIpO1xuICAgICAgeGhyLnNlbmQoSlNPTi5zdHJpbmdpZnkoeyBzY29wZTogXCJzY29wZVwiLCBzb3VyY2UgfSkpO1xuICAgICAgY2FjaGUgPSB7IGU6IHhoci5yZXNwb25zZVRleHQsIHRzOiAwIH07XG4gICAgICBFVkFMX0NBQ0hFLnNldChzb3VyY2UsIGNhY2hlKTtcbiAgICAgIGlmIChFVkFMX0NBQ0hFLnNpemUgPiBFVkFMX0NBQ0hFX0xJTUlUKSB7XG4gICAgICAgIHRyaW1FdmFsQ2FjaGUoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gVXBkYXRlIHRpbWVzdGFtcFxuICAgIGNhY2hlLnRzID0gRGF0ZS5ub3coKTtcbiAgICByZXR1cm4gRVZBTF9GQ04obmV3IFByb3h5KHNjb3BlLCB7XG4gICAgICAvLyBBcHByb3ByaWF0ZWx5IHJlbGF5IHdyaXRlcyB0byBmaXJzdCBzY29wZSB3aXRoIHRoZSBnaXZlbiB2YXJpYWJsZSBuYW1lLlxuICAgICAgLy8gT3RoZXJ3aXNlLCBpdCdsbCBvdmVyd3JpdGUgdGhlIHByb3BlcnR5IG9uIHRoZSBvdXRlcm1vc3Qgc2NvcGUhXG4gICAgICBzZXQ6IGFwcGx5V3JpdGVcbiAgICB9KSwgY2FjaGUuZSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIFNjb3BlIG9iamVjdCBmb3IgdXNlIGluIGEgYHdpdGgoKWAgc3RhdGVtZW50LlxuICAgKiBAcGFyYW0gd2l0aE9iaiBUaGUgdGFyZ2V0IG9mIHRoZSBgd2l0aGAgc3RhdGVtZW50LlxuICAgKiBAcGFyYW0gc2NvcGUgVGhlIHNjb3BlIG9mIHRoZSBgd2l0aCgpYCBzdGF0ZW1lbnQuXG4gICAqL1xuICBmdW5jdGlvbiAkJCRDUkVBVEVfV0lUSF9TQ09QRSQkJCh3aXRoT2JqOiBPYmplY3QsIHNjb3BlOiBTY29wZSk6IFNjb3BlIHtcbiAgICAvLyBBZGQgJ3dpdGhPYmonIHRvIHRoZSBzY29wZSBjaGFpbi5cbiAgICByZXR1cm4gbmV3IFByb3h5KHdpdGhPYmosIHtcbiAgICAgIGdldDogZnVuY3Rpb24odGFyZ2V0LCBrZXk6IHN0cmluZykge1xuICAgICAgICBjb25zdCB2ID0gd2l0aEdldCh0YXJnZXQsIGtleSk7XG4gICAgICAgIGlmICh2ID09PSBQUk9QX05PVF9GT1VORCkge1xuICAgICAgICAgIGNvbnN0IHYgPSB3aXRoR2V0KHNjb3BlLCBrZXkpO1xuICAgICAgICAgIGlmICh2ID09PSBQUk9QX05PVF9GT1VORCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFJlZmVyZW5jZUVycm9yKGAke2tleX0gaXMgbm90IGRlZmluZWRgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHY7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHY7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBzZXQ6IGZ1bmN0aW9uKHRhcmdldCwga2V5OiBzdHJpbmcsIHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBhcHBseVdyaXRlKHRhcmdldCwga2V5LCB2YWx1ZSkgfHwgYXBwbHlXcml0ZShzY29wZSwga2V5LCB2YWx1ZSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQXNzaWducyB0aGUgZ2l2ZW4gc2NvcGUgdG8gdGhlIGdpdmVuIGZ1bmN0aW9uIG9iamVjdC5cbiAgICovXG4gIGZ1bmN0aW9uICQkJEZVTkNUSU9OX0VYUFJFU1NJT04kJCQoZmNuOiBGdW5jdGlvbiwgc2NvcGU6IFNjb3BlKTogRnVuY3Rpb24ge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShmY24sICdfX3Njb3BlX18nLCB7XG4gICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gc2NvcGU7XG4gICAgICB9LFxuICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgcmV0dXJuIGZjbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBBc3NpZ25zIHRoZSBnaXZlbiBzY29wZSB0byBnZXR0ZXIvc2V0dGVyIHByb3BlcnRpZXMuXG4gICAqIEBwYXJhbSBvYmpcbiAgICogQHBhcmFtIHNjb3BlXG4gICAqL1xuICBmdW5jdGlvbiAkJCRPQkpFQ1RfRVhQUkVTU0lPTiQkJChvYmo6IG9iamVjdCwgc2NvcGU6IFNjb3BlKTogb2JqZWN0IHtcbiAgICBjb25zdCBwcm9wcyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3JzKG9iaik7XG4gICAgZm9yIChjb25zdCBwcm9wIG9mIHByb3BzKSB7XG4gICAgICBpZiAocHJvcC5nZXQpIHtcbiAgICAgICAgJCQkRlVOQ1RJT05fRVhQUkVTU0lPTiQkJChwcm9wLmdldCwgc2NvcGUpO1xuICAgICAgfVxuICAgICAgaWYgKHByb3Auc2V0KSB7XG4gICAgICAgICQkJEZVTkNUSU9OX0VYUFJFU1NJT04kJCQocHJvcC5zZXQsIHNjb3BlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG9iajtcbiAgfVxuXG5cblxuICAvLyBVc2VkIHRvIHN0b3JlIGNoaWxkIG5vZGVzIGFzIHByb3BlcnRpZXMgb24gYW4gb2JqZWN0IHJhdGhlciB0aGFuIGluIGFuIGFycmF5IHRvIGZhY2lsaXRhdGVcbiAgLy8gbGVhayBkZXRlY3Rpb24uXG4gIGNvbnN0IE5PREVfUFJPUF9QUkVGSVggPSBcIiQkJENISUxEJCQkXCI7XG4gIC8qKlxuICAgKiBDb252ZXJ0cyB0aGUgbm9kZSdzIHRyZWUgc3RydWN0dXJlIGludG8gYSBKYXZhU2NyaXB0LXZpc2libGUgdHJlZSBzdHJ1Y3R1cmUuXG4gICAqIFRPRE86IE11dGF0ZSB0byBpbmNsdWRlIGFueSBvdGhlciBOb2RlIHByb3BlcnRpZXMgdGhhdCBjb3VsZCBiZSB0aGUgc291cmNlIG9mIGxlYWtzIVxuICAgKiBAcGFyYW0gblxuICAgKi9cbiAgZnVuY3Rpb24gbWFrZU1pcnJvck5vZGUobjogTm9kZSk6IE1pcnJvck5vZGUge1xuICAgIGNvbnN0IGNoaWxkTm9kZXMgPSBuLmNoaWxkTm9kZXM7XG4gICAgY29uc3QgbTogTWlycm9yTm9kZSA9IHsgcm9vdDogbiwgY2hpbGROb2RlczogbWFrZUNoaWxkTm9kZShjaGlsZE5vZGVzKSB9O1xuICAgIHJldHVybiBtO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIHRoZSBjaGlsZE5vZGVzIG5vZGVsaXN0IGludG8gYSBKUy1sZXZlbCBvYmplY3QuXG4gICAqIEBwYXJhbSBjblxuICAgKi9cbiAgZnVuY3Rpb24gbWFrZUNoaWxkTm9kZShjbjogTm9kZUxpc3QpOiBDaGlsZE5vZGVzIHtcbiAgICBjb25zdCBudW1DaGlsZHJlbiA9IGNuLmxlbmd0aDtcbiAgICBsZXQgcnY6IENoaWxkTm9kZXMgPSB7IGxlbmd0aDogbnVtQ2hpbGRyZW4gfTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bUNoaWxkcmVuOyBpKyspIHtcbiAgICAgIHJ2W2Ake05PREVfUFJPUF9QUkVGSVh9JHtpfWBdID0gbWFrZU1pcnJvck5vZGUoY25baV0pO1xuICAgIH1cbiAgICByZXR1cm4gcnY7XG4gIH1cblxuICAvKipcbiAgICogU2VyaWFsaXplcyB0aGUgRE9NIGludG8gYSBKYXZhU2NyaXB0LXZpc2libGUgdHJlZSBzdHJ1Y3R1cmUuXG4gICAqL1xuICBmdW5jdGlvbiAkJCRTRVJJQUxJWkVfRE9NJCQkKG46IE5vZGUgPSBkb2N1bWVudCk6IHZvaWQge1xuICAgIFJPT1QuJCQkRE9NJCQkID0gbWFrZU1pcnJvck5vZGUoZG9jdW1lbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgd2hldGhlciBvciBub3QgdmFsdWUgJ2EnIGNvdWxkIGhhcmJvciBhIHByb3h5LlxuICAgKiBAcGFyYW0gYVxuICAgKi9cbiAgZnVuY3Rpb24gaXNQcm94eWFibGUoYTogYW55KTogYm9vbGVhbiB7XG4gICAgc3dpdGNoICh0eXBlb2YoYSkpIHtcbiAgICAgIGNhc2UgXCJvYmplY3RcIjpcbiAgICAgIGNhc2UgXCJmdW5jdGlvblwiOlxuICAgICAgICByZXR1cm4gYSAhPT0gbnVsbDsgLy8gJiYgIShhIGluc3RhbmNlb2YgTm9kZSk7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlcHJlc2VudHMgYW4gb2JqZWN0J3MgcHJveHkgc3RhdHVzLlxuICAgKi9cbiAgY29uc3QgZW51bSBQcm94eVN0YXR1cyB7XG4gICAgLy8gVGhlIG9iamVjdCBoYXMgYSBwcm94eSwgYW5kIGlzIGEgcHJveHkgaXRzZWxmIVxuICAgIElTX1BST1hZLFxuICAgIC8vIFRoZSBvYmplY3QgaGFzIGEgcHJveHksIGJ1dCBpcyB0aGUgb3JpZ2luYWwgb2JqZWN0XG4gICAgSEFTX1BST1hZLFxuICAgIC8vIFRoZSB2YWx1ZSBpcyBub3QgYSBwcm94eSwgYW5kIGRvZXMgbm90IGhhdmUgYSBwcm94eS5cbiAgICAvLyBJdCBtYXkgbm90IGV2ZW4gYmUgYW4gb2JqZWN0LlxuICAgIE5PX1BST1hZXG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBwcm94eSBzdGF0dXMgb2YgdGhlIGdpdmVuIHZhbHVlLlxuICAgKiBAcGFyYW0gYVxuICAgKi9cbiAgZnVuY3Rpb24gZ2V0UHJveHlTdGF0dXMoYTogYW55KTogUHJveHlTdGF0dXMge1xuICAgIGlmIChpc1Byb3h5YWJsZShhKSAmJiBhLmhhc093blByb3BlcnR5KFwiJCQkUFJPWFkkJCRcIikpIHtcbiAgICAgIGlmIChhLiQkJFBST1hZJCQkID09PSBhKSB7XG4gICAgICAgIHJldHVybiBQcm94eVN0YXR1cy5JU19QUk9YWTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBQcm94eVN0YXR1cy5IQVNfUFJPWFk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBQcm94eVN0YXR1cy5OT19QUk9YWTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldFByb3h5U3RhY2tUcmFjZXMoYTogYW55KTogR3Jvd3RoT2JqZWN0U3RhY2tUcmFjZXMge1xuICAgIHJldHVybiBhLiQkJFNUQUNLVFJBQ0VTJCQkO1xuICB9XG5cbiAgLyoqXG4gICAqIElmIGBhYCBpcyBhIHByb3h5LCByZXR1cm5zIHRoZSBvcmlnaW5hbCBvYmplY3QuXG4gICAqIE90aGVyd2lzZSwgcmV0dXJucyBgYWAgaXRzZWxmLlxuICAgKiBAcGFyYW0gYVxuICAgKi9cbiAgZnVuY3Rpb24gdW53cmFwSWZQcm94eShhOiBhbnkpOiBhbnkge1xuICAgIHN3aXRjaCAoZ2V0UHJveHlTdGF0dXMoYSkpIHtcbiAgICAgIGNhc2UgUHJveHlTdGF0dXMuSVNfUFJPWFk6XG4gICAgICAgIHJldHVybiBhLiQkJE9SSUdJTkFMJCQkO1xuICAgICAgY2FzZSBQcm94eVN0YXR1cy5IQVNfUFJPWFk6XG4gICAgICBjYXNlIFByb3h5U3RhdHVzLk5PX1BST1hZOlxuICAgICAgICByZXR1cm4gYTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogSWYgYGFgIGhhcyBhIHByb3h5LCByZXR1cm5zIHRoZSBwcm94eS4gT3RoZXJ3aXNlLCByZXR1cm5zIGBhYCBpdHNlbGYuXG4gICAqIEBwYXJhbSBhXG4gICAqL1xuICBmdW5jdGlvbiB3cmFwSWZPcmlnaW5hbChhOiBhbnkpOiBhbnkge1xuICAgIHN3aXRjaCAoZ2V0UHJveHlTdGF0dXMoYSkpIHtcbiAgICAgIGNhc2UgUHJveHlTdGF0dXMuSEFTX1BST1hZOlxuICAgICAgICByZXR1cm4gYS4kJCRQUk9YWSQkJDtcbiAgICAgIGNhc2UgUHJveHlTdGF0dXMuSVNfUFJPWFk6XG4gICAgICBjYXNlIFByb3h5U3RhdHVzLk5PX1BST1hZOlxuICAgICAgICByZXR1cm4gYTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBhIHN0YWNrIHRyYWNlIHRvIHRoZSBnaXZlbiBtYXAgZm9yIHRoZSBnaXZlbiBwcm9wZXJ0eS5cbiAgICogQHBhcmFtIG1hcFxuICAgKiBAcGFyYW0gcHJvcGVydHlcbiAgICovXG4gIGZ1bmN0aW9uIF9hZGRTdGFja1RyYWNlKG1hcDogR3Jvd3RoT2JqZWN0U3RhY2tUcmFjZXMsIHByb3BlcnR5OiBzdHJpbmcgfCBudW1iZXIgfCBzeW1ib2wsIHN0YWNrID0gX2dldFN0YWNrVHJhY2UoKSk6IHZvaWQge1xuICAgIGxldCBzZXQgPSBtYXAuZ2V0KHByb3BlcnR5KTtcbiAgICBpZiAoIXNldCkge1xuICAgICAgc2V0ID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgICBtYXAuc2V0KHByb3BlcnR5LCBzZXQpO1xuICAgIH1cbiAgICBzZXQuYWRkKHN0YWNrKTtcbiAgfVxuICAvKipcbiAgICogUmVtb3ZlcyBzdGFjayB0cmFjZXMgZm9yIHRoZSBnaXZlbiBtYXAgZm9yIHRoZSBnaXZlbiBwcm9wZXJ0eS5cbiAgICogQHBhcmFtIG1hcFxuICAgKiBAcGFyYW0gcHJvcGVydHlcbiAgICovXG4gIGZ1bmN0aW9uIF9yZW1vdmVTdGFja3MobWFwOiBHcm93dGhPYmplY3RTdGFja1RyYWNlcywgcHJvcGVydHk6IHN0cmluZyB8IG51bWJlciB8IHN5bWJvbCk6IHZvaWQge1xuICAgIGlmIChtYXAuaGFzKHByb3BlcnR5KSkge1xuICAgICAgbWFwLmRlbGV0ZShwcm9wZXJ0eSk7XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBDb3B5IGFsbCBvZiB0aGUgc3RhY2tzIGZyb20gYGZyb21gIHRvIGB0b2Agd2l0aGluIHRoZSBtYXAuXG4gICAqIEBwYXJhbSBtYXBcbiAgICogQHBhcmFtIGZyb21cbiAgICogQHBhcmFtIHRvXG4gICAqL1xuICBmdW5jdGlvbiBfY29weVN0YWNrcyhtYXA6IEdyb3d0aE9iamVjdFN0YWNrVHJhY2VzLCBmcm9tOiBzdHJpbmcgfCBudW1iZXIgfCBzeW1ib2wsIHRvOiBzdHJpbmcgfCBudW1iZXIgfCBzeW1ib2wpOiB2b2lkIHtcbiAgICBpZiAobWFwLmhhcyhmcm9tKSkge1xuICAgICAgbWFwLnNldCh0bywgbWFwLmdldChmcm9tKSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENvbWJpbmUgdGhlIHN0YWNrcyBmb3IgJ2Zyb20nIHdpdGggJ3RvJyBpbiAndG8nLlxuICAgKiBAcGFyYW0gbWFwXG4gICAqIEBwYXJhbSBmcm9tXG4gICAqIEBwYXJhbSB0b1xuICAgKi9cbiAgZnVuY3Rpb24gX2NvbWJpbmVTdGFja3MobWFwOiBHcm93dGhPYmplY3RTdGFja1RyYWNlcywgZnJvbTogc3RyaW5nIHwgbnVtYmVyIHwgc3ltYm9sLCB0bzogc3ltYm9sIHwgbnVtYmVyIHwgc3RyaW5nKTogdm9pZCB7XG4gICAgaWYgKG1hcC5oYXMoZnJvbSkgJiYgbWFwLmhhcyh0bykpIHtcbiAgICAgIGNvbnN0IGZyb21TdGFja3MgPSBtYXAuZ2V0KGZyb20pO1xuICAgICAgY29uc3QgdG9TdGFja3MgPSBtYXAuZ2V0KHRvKTtcbiAgICAgIGZyb21TdGFja3MuZm9yRWFjaCgocykgPT4ge1xuICAgICAgICB0b1N0YWNrcy5hZGQocyk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZSBhIG1hcCB0byBjb250YWluIHN0YWNrIHRyYWNlcyBmb3IgYWxsIG9mIHRoZSBwcm9wZXJ0aWVzIG9mIHRoZSBnaXZlbiBvYmplY3QuXG4gICAqL1xuICBmdW5jdGlvbiBfaW5pdGlhbGl6ZU1hcChvYmo6IGFueSwgbWFwOiBHcm93dGhPYmplY3RTdGFja1RyYWNlcywgdHJhY2U6IHN0cmluZyk6IEdyb3d0aE9iamVjdFN0YWNrVHJhY2VzIHtcbiAgICBPYmplY3Qua2V5cyhvYmopLmZvckVhY2goKGspID0+IHtcbiAgICAgIF9hZGRTdGFja1RyYWNlKG1hcCwgaywgdHJhY2UpO1xuICAgIH0pO1xuICAgIHJldHVybiBtYXA7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIHByb3h5IG9iamVjdCBmb3IgdGhlIGdpdmVuIG9iamVjdCwgaWYgYXBwbGljYWJsZS4gQ3JlYXRlcyBhIG5ldyBvYmplY3QgaWYgdGhlIG9iamVjdFxuICAgKiBpcyBub3QgYWxyZWFkeSBwcm94aWVkLlxuICAgKi9cbiAgZnVuY3Rpb24gZ2V0UHJveHkoYWNjZXNzU3RyOiBzdHJpbmcsIG9iajogYW55LCBzdGFja1RyYWNlOiBzdHJpbmcgPSBudWxsKTogYW55IHtcbiAgICBpZiAoIWlzUHJveHlhYmxlKG9iaikpIHtcbiAgICAgIC8vIGxvZ1RvQ29uc29sZShgW1BST1hZIEVSUk9SXTogQ2Fubm90IGNyZWF0ZSBwcm94eSBmb3IgJHtvYmp9IGF0ICR7YWNjZXNzU3RyfS5gKTtcbiAgICAgIHJldHVybiBvYmo7XG4gICAgfSBlbHNlIGlmICghb2JqLmhhc093blByb3BlcnR5KCckJCRQUk9YWSQkJCcpKSB7XG4gICAgICBjb25zdCBtYXAgPSBuZXcgTWFwPHN0cmluZyB8IG51bWJlciB8IHN5bWJvbCwgU2V0PHN0cmluZz4+KCk7XG4gICAgICBpZiAoc3RhY2tUcmFjZSAhPT0gbnVsbCkge1xuICAgICAgICBfaW5pdGlhbGl6ZU1hcChvYmosIG1hcCwgc3RhY2tUcmFjZSk7XG4gICAgICB9XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqLCAnJCQkT1JJR0lOQUwkJCQnLCB7XG4gICAgICAgIHZhbHVlOiBvYmosXG4gICAgICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgfSk7XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqLCBcIiQkJFNUQUNLVFJBQ0VTJCQkXCIsIHtcbiAgICAgICAgdmFsdWU6IG1hcCxcbiAgICAgICAgd3JpdGFibGU6IGZhbHNlLFxuICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiBmYWxzZVxuICAgICAgfSk7XG4gICAgICAvL2Z1bmN0aW9uIExPRyhzOiBzdHJpbmcpIHtcbiAgICAgICAgLy8gbG9nVG9Db25zb2xlKGAke2FjY2Vzc1N0cn06ICR7c31gKTtcbiAgICAgIC8vfVxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iaiwgJyQkJFBST1hZJCQkJywgeyB2YWx1ZTogbmV3IFByb3h5KG9iaiwge1xuICAgICAgICBkZWZpbmVQcm9wZXJ0eTogZnVuY3Rpb24odGFyZ2V0LCBwcm9wZXJ0eSwgZGVzY3JpcHRvcik6IGJvb2xlYW4ge1xuICAgICAgICAgIGlmICghZGlzYWJsZVByb3hpZXMpIHtcbiAgICAgICAgICAgIC8vIENhcHR1cmUgYSBzdGFjayB0cmFjZS5cbiAgICAgICAgICAgIF9hZGRTdGFja1RyYWNlKGdldFByb3h5U3RhY2tUcmFjZXModGFyZ2V0KSwgcHJvcGVydHkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBMT0coYGRlZmluZVByb3BlcnR5YCk7XG4gICAgICAgICAgcmV0dXJuIFJlZmxlY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBwcm9wZXJ0eSwgZGVzY3JpcHRvcik7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24odGFyZ2V0LCBwcm9wZXJ0eSwgdmFsdWUsIHJlY2VpdmVyKTogYm9vbGVhbiB7XG4gICAgICAgICAgaWYgKCFkaXNhYmxlUHJveGllcykge1xuICAgICAgICAgICAgLy8gQ2FwdHVyZSBhIHN0YWNrIHRyYWNlLlxuICAgICAgICAgICAgX2FkZFN0YWNrVHJhY2UoZ2V0UHJveHlTdGFja1RyYWNlcyh0YXJnZXQpLCBwcm9wZXJ0eSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIExPRyhgc2V0YCk7XG4gICAgICAgICAgcmV0dXJuIFJlZmxlY3Quc2V0KHRhcmdldCwgcHJvcGVydHksIHZhbHVlLCB0YXJnZXQpO1xuICAgICAgICB9LFxuICAgICAgICBkZWxldGVQcm9wZXJ0eTogZnVuY3Rpb24odGFyZ2V0LCBwcm9wZXJ0eSk6IGJvb2xlYW4ge1xuICAgICAgICAgIGlmICghZGlzYWJsZVByb3hpZXMpIHtcbiAgICAgICAgICAgIC8vIFJlbW92ZSBzdGFjayB0cmFjZXMgdGhhdCBzZXQgdGhpcyBwcm9wZXJ0eS5cbiAgICAgICAgICAgIF9yZW1vdmVTdGFja3MoZ2V0UHJveHlTdGFja1RyYWNlcyh0YXJnZXQpLCBwcm9wZXJ0eSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIExPRyhgZGVsZXRlUHJvcGVydHlgKTtcbiAgICAgICAgICByZXR1cm4gUmVmbGVjdC5kZWxldGVQcm9wZXJ0eSh0YXJnZXQsIHByb3BlcnR5KTtcbiAgICAgICAgfVxuICAgICAgfSksIGVudW1lcmFibGU6IGZhbHNlLCBjb25maWd1cmFibGU6IHRydWUsIHdyaXRhYmxlOiB0cnVlIH0pO1xuICAgIH1cbiAgICByZXR1cm4gb2JqLiQkJFBST1hZJCQkO1xuICB9XG5cbiAgaW50ZXJmYWNlIEFzc2lnbm1lbnRQcm94eSB7XG4gICAgKHY6IGFueSk6IGJvb2xlYW47XG4gICAgJCR0cmVlczogSVBhdGhUcmVlW107XG4gICAgJCRyb290QWNjZXNzU3RyaW5nOiBzdHJpbmc7XG4gICAgJCR1cGRhdGU6IChzdGFja1RyYWNlOiBzdHJpbmcpID0+IHZvaWQ7XG4gICAgJCRyb290OiBhbnk7XG4gIH1cblxuICBmdW5jdGlvbiB1cGRhdGVBc3NpZ25tZW50UHJveHkodGhpczogQXNzaWdubWVudFByb3h5LCBzdGFja1RyYWNlOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCByb290ID0gdGhpcy4kJHJvb3Q7XG4gICAgY29uc3QgdHJlZXMgPSB0aGlzLiQkdHJlZXM7XG4gICAgY29uc3Qgcm9vdEFjY2Vzc1N0cmluZyA9IHRoaXMuJCRyb290QWNjZXNzU3RyaW5nO1xuICAgIGZvciAoY29uc3QgdHJlZSBvZiB0cmVlcykge1xuICAgICAgaW5zdHJ1bWVudFRyZWUocm9vdEFjY2Vzc1N0cmluZywgcm9vdCwgdHJlZSwgc3RhY2tUcmFjZSk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gaGlkZGVuUHJvcGVydHlOYW1lKG46IHN0cmluZyB8IG51bWJlcik6IHN0cmluZyB7XG4gICAgcmV0dXJuIGBfX19fXyQke259YDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNldEhpZGRlblZhbHVlKHRoaXNPYmo6IGFueSwgbjogc3RyaW5nIHwgbnVtYmVyLCB2YWx1ZTogYW55KTogdm9pZCB7XG4gICAgY29uc3QgcHJvcE5hbWUgPSBoaWRkZW5Qcm9wZXJ0eU5hbWUobik7XG4gICAgaWYgKCF0aGlzT2JqLmhhc093blByb3BlcnR5KHByb3BOYW1lKSkge1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXNPYmosIHByb3BOYW1lLCB7XG4gICAgICAgIHZhbHVlOiBudWxsLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZVxuICAgICAgfSk7XG4gICAgfVxuICAgIHRoaXNPYmpbcHJvcE5hbWVdID0gdmFsdWU7XG4gIH1cblxuICBmdW5jdGlvbiBnZXRIaWRkZW5WYWx1ZSh0aGlzT2JqOiBhbnksIG46IHN0cmluZyB8IG51bWJlcik6IGFueSB7XG4gICAgcmV0dXJuIHRoaXNPYmpbaGlkZGVuUHJvcGVydHlOYW1lKG4pXTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGluc3RydW1lbnRQYXRoKHJvb3RBY2Nlc3NTdHJpbmc6IHN0cmluZywgYWNjZXNzU3RyaW5nOiBzdHJpbmcsIHJvb3Q6IGFueSwgdHJlZTogSVBhdGhUcmVlLCBzdGFja1RyYWNlOiBzdHJpbmcgPSBudWxsKTogdm9pZCB7XG4gICAgbGV0IHNldFByb3h5OiBBc3NpZ25tZW50UHJveHk7XG4gICAgLy9sb2dUb0NvbnNvbGUoYEluc3RydW1lbnRpbmcgJHthY2Nlc3NTdHJpbmd9IGF0ICR7cm9vdEFjY2Vzc1N0cmluZ31gKTtcbiAgICBjb25zdCBwcm9wID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihyb290LCB0cmVlLmluZGV4T3JOYW1lKTtcbiAgICBpZiAocHJvcCAmJiBwcm9wLnNldCAmJiBBcnJheS5pc0FycmF5KCg8YW55PiBwcm9wLnNldClbJyQkdHJlZXMnXSkpIHtcbiAgICAgIC8vbG9nVG9Db25zb2xlKGBJdCdzIGFscmVhZHkgaW5zdHJ1bWVudGVkIWApO1xuICAgICAgc2V0UHJveHkgPSA8YW55PiBwcm9wLnNldDtcbiAgICB9IGVsc2Uge1xuICAgICAgLy9sb2dUb0NvbnNvbGUoYE5ldyBpbnN0cnVtZW50YXRpb24uYCk7XG4gICAgICAvLyBsZXQgaGlkZGVuVmFsdWUgPSByb290W3RyZWUuaW5kZXhPck5hbWVdO1xuICAgICAgY29uc3QgaXNHcm93aW5nID0gdHJlZS5pc0dyb3dpbmc7XG4gICAgICBjb25zdCBpbmRleE9yTmFtZSA9IHRyZWUuaW5kZXhPck5hbWU7XG4gICAgICBzZXRIaWRkZW5WYWx1ZShyb290LCBpbmRleE9yTmFtZSwgcm9vdFtpbmRleE9yTmFtZV0pO1xuICAgICAgaWYgKGlzR3Jvd2luZykge1xuICAgICAgICAvL2xvZ1RvQ29uc29sZShgQ29udmVydGluZyB0aGUgaGlkZGVuIHZhbHVlIGludG8gYSBwcm94eS5gKVxuICAgICAgICBjb25zdCBwcm94eSA9IGdldFByb3h5KGFjY2Vzc1N0cmluZywgZ2V0SGlkZGVuVmFsdWUocm9vdCwgaW5kZXhPck5hbWUpKTtcbiAgICAgICAgc2V0SGlkZGVuVmFsdWUocm9vdCwgaW5kZXhPck5hbWUsIHByb3h5KTtcbiAgICAgICAgaWYgKHN0YWNrVHJhY2UgIT09IG51bGwgJiYgZ2V0UHJveHlTdGF0dXMocHJveHkpID09PSBQcm94eVN0YXR1cy5JU19QUk9YWSkge1xuICAgICAgICAgIGNvbnN0IG1hcDogR3Jvd3RoT2JqZWN0U3RhY2tUcmFjZXMgPSBnZXRQcm94eVN0YWNrVHJhY2VzKHByb3h5KTtcbiAgICAgICAgICBfaW5pdGlhbGl6ZU1hcChwcm94eSwgbWFwLCBzdGFja1RyYWNlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgc2V0UHJveHkgPSA8YW55PiBmdW5jdGlvbih0aGlzOiBhbnksIHY6IGFueSk6IGJvb2xlYW4ge1xuICAgICAgICBjb25zdCB0cmFjZSA9IF9nZXRTdGFja1RyYWNlKCk7XG4gICAgICAgIHNldEhpZGRlblZhbHVlKHRoaXMsIGluZGV4T3JOYW1lLCBpc0dyb3dpbmcgPyBnZXRQcm94eShhY2Nlc3NTdHJpbmcsIHYsIHRyYWNlKSA6IHYpO1xuICAgICAgICBzZXRQcm94eS4kJHVwZGF0ZSh0cmFjZSk7XG4gICAgICAgIC8vIGxvZ1RvQ29uc29sZShgJHtyb290QWNjZXNzU3RyaW5nfTogQXNzaWdubWVudGApO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH07XG4gICAgICBzZXRQcm94eS4kJHJvb3RBY2Nlc3NTdHJpbmcgPSByb290QWNjZXNzU3RyaW5nO1xuICAgICAgc2V0UHJveHkuJCR0cmVlcyA9IFtdO1xuICAgICAgc2V0UHJveHkuJCR1cGRhdGUgPSB1cGRhdGVBc3NpZ25tZW50UHJveHk7XG4gICAgICBzZXRQcm94eS4kJHJvb3QgPSByb290O1xuXG4gICAgICB0cnkge1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkocm9vdCwgaW5kZXhPck5hbWUsIHtcbiAgICAgICAgICBnZXQ6IGZ1bmN0aW9uKHRoaXM6IGFueSkge1xuICAgICAgICAgICAgcmV0dXJuIGdldEhpZGRlblZhbHVlKHRoaXMsIGluZGV4T3JOYW1lKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIHNldDogc2V0UHJveHksXG4gICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICAgIH0pO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBsb2dUb0NvbnNvbGUoYFVuYWJsZSB0byBpbnN0cnVtZW50ICR7cm9vdEFjY2Vzc1N0cmluZ306ICR7ZX1gKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoc2V0UHJveHkuJCR0cmVlcy5pbmRleE9mKHRyZWUpID09PSAtMSkge1xuICAgICAgc2V0UHJveHkuJCR0cmVlcy5wdXNoKHRyZWUpO1xuICAgICAgLy8gT25seSB1cGRhdGUgaW5uZXIgcHJveGllcyBpZjpcbiAgICAgIC8vIC0gdGhlIHRyZWUgaXMgbmV3ICh0cmVlIGFscmVhZHkgZXhpc3RzID09PSB0aGlzIHBhdGggaXMgYWxyZWFkeSB1cGRhdGVkKVxuICAgICAgLy8gICAtIFByZXZlbnRzIGluZmluaXRlIGxvb3BzIGR1ZSB0byBjeWNsZXMhXG4gICAgICAvLyAtIHRoZXJlIGlzIGEgc3RhY2sgdHJhY2UgKG5vIHN0YWNrIHRyYWNlID09PSBpbml0aWFsIGluc3RhbGxhdGlvbilcbiAgICAgIC8vICAgLSBPdGhlcndpc2Ugd2UgYXJlIGFscmVhZHkgdXBkYXRpbmcgdGhpcyBwcm94eSFcbiAgICAgIGlmIChzdGFja1RyYWNlKSB7XG4gICAgICAgIHNldFByb3h5LiQkdXBkYXRlKHN0YWNrVHJhY2UpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIE5lZWQ6XG4gIC8vIC0gRE9NIHNldCBwcm94aWVzXG4gIC8vICAgLT4gSW52YWxpZGF0ZSAvIHJlZnJlc2ggd2hlbiBjaGFuZ2VkXG4gIC8vIC0gRmFzdCBjaGVja2VyIG9mIG5vZGUuXG5cbiAgLy8gT3BlcmF0aW9ucyBjYW4gaW1wYWN0OlxuICAvLyAtIEN1cnJlbnQgbm9kZVxuICAvLyAtIFBhcmVudCBub2RlXG4gIC8vIC0gQ2hpbGQgbm9kZXNcbiAgLy8gVXBkYXRlIHRhcmdldCBub2RlICYgYWxsIGNoaWxkcmVuLlxuICAvL1xuXG4gIGZ1bmN0aW9uIGluc3RydW1lbnRET01UcmVlKHJvb3RBY2Nlc3NTdHJpbmc6IHN0cmluZywgcm9vdDogYW55LCB0cmVlOiBJUGF0aFRyZWUsIHN0YWNrVHJhY2U6IHN0cmluZyA9IG51bGwpOiB2b2lkIHtcbiAgICAvLyBGb3Igbm93OiBTaW1wbHkgY3Jhd2wgdG8gdGhlIG5vZGUocykgYW5kIGluc3RydW1lbnQgcmVndWxhcmx5IGZyb20gdGhlcmUuIERvbid0IHRyeSB0byBwbGFudCBnZXR0ZXJzL3NldHRlcnMuXG4gICAgLy8gJCRET00gLSAtIC0gLSAtIC0+IHJvb3QgW3JlZ3VsYXIgc3VidHJlZV1cbiAgICBsZXQgb2JqOiBhbnk7XG4gICAgbGV0IGFjY2Vzc1N0cmluZyA9IHJvb3RBY2Nlc3NTdHJpbmc7XG4gICAgbGV0IHN3aXRjaFRvUmVndWxhclRyZWUgPSBmYWxzZTtcbiAgICBzd2l0Y2ggKHRyZWUuaW5kZXhPck5hbWUpIHtcbiAgICAgIGNhc2UgXCIkJCRET00kJCRcIjpcbiAgICAgICAgb2JqID0gZG9jdW1lbnQ7XG4gICAgICAgIGFjY2Vzc1N0cmluZyA9IFwiZG9jdW1lbnRcIjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdyb290JzpcbiAgICAgICAgc3dpdGNoVG9SZWd1bGFyVHJlZSA9IHRydWU7XG4gICAgICAgIG9iaiA9IHJvb3Q7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnY2hpbGROb2Rlcyc6XG4gICAgICAgIG9iaiA9IHJvb3RbJ2NoaWxkTm9kZXMnXTtcbiAgICAgICAgYWNjZXNzU3RyaW5nICs9IGBbJ2NoaWxkTm9kZXMnXWA7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgY29uc3QgbW9kSW5kZXggPSAoPHN0cmluZz4gdHJlZS5pbmRleE9yTmFtZSkuc2xpY2UoTk9ERV9QUk9QX1BSRUZJWC5sZW5ndGgpO1xuICAgICAgICBvYmogPSByb290W21vZEluZGV4XTtcbiAgICAgICAgYWNjZXNzU3RyaW5nICs9IGBbJHttb2RJbmRleH1dYDtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgaWYgKCFvYmopIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAob2JqICYmICFvYmouJCQkVFJFRSQkJCkge1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXMob2JqLCB7XG4gICAgICAgICQkJFRSRUUkJCQ6IHtcbiAgICAgICAgICB2YWx1ZTogbnVsbCxcbiAgICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgICAgfSxcbiAgICAgICAgJCQkQUNDRVNTX1NUUklORyQkJDoge1xuICAgICAgICAgIHZhbHVlOiBudWxsLFxuICAgICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gICAgb2JqLiQkJFRSRUUkJCQgPSB0cmVlO1xuICAgIG9iai4kJCRBQ0NFU1NfU1RSSU5HJCQkID0gYWNjZXNzU3RyaW5nO1xuICAgIGlmICh0cmVlLmlzR3Jvd2luZykge1xuICAgICAgZ2V0UHJveHkoYWNjZXNzU3RyaW5nLCBvYmosIHN0YWNrVHJhY2UpO1xuICAgIH1cblxuICAgIC8vIENhcHR1cmUgd3JpdGVzIG9mIGNoaWxkcmVuLlxuICAgIGNvbnN0IGNoaWxkcmVuID0gdHJlZS5jaGlsZHJlbjtcbiAgICBpZiAoY2hpbGRyZW4pIHtcbiAgICAgIGNvbnN0IGluc3RydW1lbnRGdW5jdGlvbiA9IHN3aXRjaFRvUmVndWxhclRyZWUgPyBpbnN0cnVtZW50VHJlZSA6IGluc3RydW1lbnRET01UcmVlO1xuICAgICAgY29uc3QgbGVuID0gY2hpbGRyZW4ubGVuZ3RoO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICBjb25zdCBjaGlsZCA9IGNoaWxkcmVuW2ldO1xuICAgICAgICBpbnN0cnVtZW50RnVuY3Rpb24oYWNjZXNzU3RyaW5nLCBvYmosIGNoaWxkLCBzdGFja1RyYWNlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBpbnN0cnVtZW50VHJlZShyb290QWNjZXNzU3RyaW5nOiBzdHJpbmcsIHJvb3Q6IGFueSwgdHJlZTogSVBhdGhUcmVlLCBzdGFja1RyYWNlOiBzdHJpbmcgPSBudWxsKTogdm9pZCB7XG4gICAgY29uc3QgYWNjZXNzU3RyaW5nID0gcm9vdEFjY2Vzc1N0cmluZyArIGBbJHtzYWZlU3RyaW5nKGAke3RyZWUuaW5kZXhPck5hbWV9YCl9XWA7XG4gICAgLy9sb2dUb0NvbnNvbGUoYGFjY2VzcyBzdHJpbmc6ICR7YWNjZXNzU3RyaW5nfWApO1xuICAgIC8vIElnbm9yZSByb290cyB0aGF0IGFyZSBub3QgcHJveHlhYmxlLlxuICAgIGlmICghaXNQcm94eWFibGUocm9vdCkpIHtcbiAgICAgIC8vbG9nVG9Db25zb2xlKGBOb3QgYSBwcm94eWFibGUgcm9vdC5gKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3Qgb2JqID0gcm9vdFt0cmVlLmluZGV4T3JOYW1lXTtcbiAgICBpbnN0cnVtZW50UGF0aChyb290QWNjZXNzU3RyaW5nLCBhY2Nlc3NTdHJpbmcsIHJvb3QsIHRyZWUsIHN0YWNrVHJhY2UpO1xuXG4gICAgLy8gQ2FwdHVyZSB3cml0ZXMgb2YgY2hpbGRyZW4uXG4gICAgY29uc3QgY2hpbGRyZW4gPSB0cmVlLmNoaWxkcmVuO1xuICAgIGlmIChjaGlsZHJlbikge1xuICAgICAgY29uc3QgbGVuID0gY2hpbGRyZW4ubGVuZ3RoO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICBjb25zdCBjaGlsZCA9IGNoaWxkcmVuW2ldO1xuICAgICAgICBpbnN0cnVtZW50VHJlZShhY2Nlc3NTdHJpbmcsIG9iaiwgY2hpbGQsIHN0YWNrVHJhY2UpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIERpc2FibGVzIHByb3h5IGludGVyY2VwdGlvbi5cbiAgbGV0IGRpc2FibGVQcm94aWVzID0gZmFsc2U7XG5cbiAgZnVuY3Rpb24gaXNET01Sb290KHRyZWU6IElQYXRoVHJlZSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0cmVlLmluZGV4T3JOYW1lID09PSBcIiQkJERPTSQkJFwiO1xuICB9XG5cbiAgbGV0IGluc3RydW1lbnRlZFRyZWVzOiBJUGF0aFRyZWVzID0gW107XG4gIGZ1bmN0aW9uICQkJElOU1RSVU1FTlRfUEFUSFMkJCQodHJlZXM6IElQYXRoVHJlZXMpOiB2b2lkIHtcbiAgICBmb3IgKGNvbnN0IHRyZWUgb2YgdHJlZXMpIHtcbiAgICAgIGlmIChpc0RPTVJvb3QodHJlZSkpIHtcbiAgICAgICAgaW5zdHJ1bWVudERPTVRyZWUoXCIkJCRHTE9CQUwkJCRcIiwgUk9PVC4kJCRHTE9CQUwkJCQsIHRyZWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaW5zdHJ1bWVudFRyZWUoXCIkJCRHTE9CQUwkJCRcIiwgUk9PVC4kJCRHTE9CQUwkJCQsIHRyZWUpO1xuICAgICAgfVxuICAgIH1cbiAgICBpbnN0cnVtZW50ZWRUcmVlcyA9IGluc3RydW1lbnRlZFRyZWVzLmNvbmNhdCh0cmVlcyk7XG4gIH1cblxuICBmdW5jdGlvbiBnZXRTdGFja1RyYWNlcyhyb290OiBhbnksIHBhdGg6IElQYXRoVHJlZSwgc3RhY2tzTWFwOiB7W2lkOiBudW1iZXJdOiBTZXQ8c3RyaW5nPn0pOiB2b2lkIHtcbiAgICBjb25zdCBvYmogPSByb290W3BhdGguaW5kZXhPck5hbWVdO1xuICAgIGlmIChpc1Byb3h5YWJsZShvYmopKSB7XG4gICAgICBpZiAocGF0aC5pc0dyb3dpbmcgJiYgZ2V0UHJveHlTdGF0dXMob2JqKSA9PT0gUHJveHlTdGF0dXMuSVNfUFJPWFkpIHtcbiAgICAgICAgY29uc3QgbWFwID0gZ2V0UHJveHlTdGFja1RyYWNlcyhvYmopO1xuICAgICAgICBjb25zdCBzdGFja1RyYWNlcyA9IHN0YWNrc01hcFtwYXRoLmlkXSA/IHN0YWNrc01hcFtwYXRoLmlkXSA6IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgICAgICBtYXAuZm9yRWFjaCgodiwgaykgPT4ge1xuICAgICAgICAgIHYuZm9yRWFjaCgocykgPT4gc3RhY2tUcmFjZXMuYWRkKHMpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHN0YWNrc01hcFtwYXRoLmlkXSA9IHN0YWNrVHJhY2VzO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBjaGlsZHJlbiA9IHBhdGguY2hpbGRyZW47XG4gICAgICBpZiAoY2hpbGRyZW4pIHtcbiAgICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiBjaGlsZHJlbikge1xuICAgICAgICAgIGdldFN0YWNrVHJhY2VzKG9iaiwgY2hpbGQsIHN0YWNrc01hcCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBnZXRET01TdGFja1RyYWNlcyhyb290OiBhbnksIHBhdGg6IElQYXRoVHJlZSwgc3RhY2tzTWFwOiB7W2lkOiBudW1iZXJdOiBTZXQ8c3RyaW5nPn0pOiB2b2lkIHtcbiAgICBsZXQgb2JqOiBhbnk7XG4gICAgbGV0IHN3aXRjaFRvUmVndWxhclRyZWUgPSBmYWxzZTtcbiAgICBzd2l0Y2ggKHBhdGguaW5kZXhPck5hbWUpIHtcbiAgICAgIGNhc2UgXCIkJCRET00kJCRcIjpcbiAgICAgICAgb2JqID0gZG9jdW1lbnQ7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAncm9vdCc6XG4gICAgICAgIHN3aXRjaFRvUmVndWxhclRyZWUgPSB0cnVlO1xuICAgICAgICBvYmogPSByb290O1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2NoaWxkTm9kZXMnOlxuICAgICAgICBvYmogPSByb290W3BhdGguaW5kZXhPck5hbWVdO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIG9iaiA9IHJvb3RbKDxzdHJpbmc+IHBhdGguaW5kZXhPck5hbWUpLnNsaWNlKE5PREVfUFJPUF9QUkVGSVgubGVuZ3RoKV07XG4gICAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGlmIChpc1Byb3h5YWJsZShvYmopICYmIHBhdGguaXNHcm93aW5nKSB7XG4gICAgICBjb25zdCB3cmFwcGVkT2JqID0gd3JhcElmT3JpZ2luYWwob2JqKTtcbiAgICAgIGlmIChnZXRQcm94eVN0YXR1cyh3cmFwcGVkT2JqKSA9PT0gUHJveHlTdGF0dXMuSVNfUFJPWFkpIHtcbiAgICAgICAgY29uc3QgbWFwID0gZ2V0UHJveHlTdGFja1RyYWNlcyh3cmFwcGVkT2JqKTtcbiAgICAgICAgY29uc3Qgc3RhY2tUcmFjZXMgPSBzdGFja3NNYXBbcGF0aC5pZF0gPyBzdGFja3NNYXBbcGF0aC5pZF0gOiBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICAgICAgbWFwLmZvckVhY2goKHYsIGspID0+IHtcbiAgICAgICAgICB2LmZvckVhY2goKHMpID0+IHN0YWNrVHJhY2VzLmFkZChzKSk7XG4gICAgICAgIH0pO1xuICAgICAgICBzdGFja3NNYXBbcGF0aC5pZF0gPSBzdGFja1RyYWNlcztcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBDYXB0dXJlIHdyaXRlcyBvZiBjaGlsZHJlbi5cbiAgICBjb25zdCBjaGlsZHJlbiA9IHBhdGguY2hpbGRyZW47XG4gICAgY29uc3QgZ2V0U3RhY2tUcmFjZXNGdW5jdGlvbiA9IHN3aXRjaFRvUmVndWxhclRyZWUgPyBnZXRTdGFja1RyYWNlcyA6IGdldERPTVN0YWNrVHJhY2VzO1xuICAgIGlmIChjaGlsZHJlbikge1xuICAgICAgY29uc3QgbGVuID0gY2hpbGRyZW4ubGVuZ3RoO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICBjb25zdCBjaGlsZCA9IGNoaWxkcmVuW2ldO1xuICAgICAgICBnZXRTdGFja1RyYWNlc0Z1bmN0aW9uKG9iaiwgY2hpbGQsIHN0YWNrc01hcCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gJCQkR0VUX1NUQUNLX1RSQUNFUyQkJCgpOiBHcm93aW5nU3RhY2tUcmFjZXMge1xuICAgIGNvbnN0IHN0YWNrc01hcDoge1tpZDogbnVtYmVyXTogU2V0PHN0cmluZz59ID0ge307XG4gICAgZm9yIChjb25zdCB0cmVlIG9mIGluc3RydW1lbnRlZFRyZWVzKSB7XG4gICAgICBpZiAoaXNET01Sb290KHRyZWUpKSB7XG4gICAgICAgIGdldERPTVN0YWNrVHJhY2VzKFJPT1QuJCQkR0xPQkFMJCQkLCB0cmVlLCBzdGFja3NNYXApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZ2V0U3RhY2tUcmFjZXMoUk9PVC4kJCRHTE9CQUwkJCQsIHRyZWUsIHN0YWNrc01hcCk7XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IGpzb25hYmxlU3RhY2tzTWFwOiBHcm93aW5nU3RhY2tUcmFjZXMgPSB7fTtcbiAgICBmb3IgKGNvbnN0IHN0cmluZ0lkIGluIHN0YWNrc01hcCkge1xuICAgICAgaWYgKHN0YWNrc01hcC5oYXNPd25Qcm9wZXJ0eShzdHJpbmdJZCkpIHtcbiAgICAgICAgY29uc3QgaWQgPSBwYXJzZUludChzdHJpbmdJZCwgMTApO1xuICAgICAgICBjb25zdCBzdGFja3MgPSBzdGFja3NNYXBbaWRdO1xuICAgICAgICBsZXQgaSA9IDA7XG4gICAgICAgIGNvbnN0IHN0YWNrQXJyYXkgPSBuZXcgQXJyYXk8c3RyaW5nPihzdGFja3Muc2l6ZSk7XG4gICAgICAgIHN0YWNrcy5mb3JFYWNoKChzKSA9PiB7XG4gICAgICAgICAgc3RhY2tBcnJheVtpKytdID0gcztcbiAgICAgICAgfSlcbiAgICAgICAganNvbmFibGVTdGFja3NNYXBbaWRdID0gc3RhY2tBcnJheTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGpzb25hYmxlU3RhY2tzTWFwO1xuICB9XG5cbiAgaWYgKElTX1dJTkRPVyB8fCBJU19XT1JLRVIpIHtcbiAgICAvLyBEaXNhYmxlIHRoZXNlIGluIE5vZGVKUy5cblxuICAgIC8qY29uc3QgZG9jdW1lbnRXcml0ZSA9IERvY3VtZW50LnByb3RvdHlwZS53cml0ZTtcbiAgICBEb2N1bWVudC5wcm90b3R5cGUud3JpdGUgPSBmdW5jdGlvbih0aGlzOiBEb2N1bWVudCwgc3RyOiBzdHJpbmcpOiB2b2lkIHtcbiAgICAgIGNvbnN0IHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgICAgeGhyLm9wZW4oJ1BPU1QnLCAnL2V2YWxIdG1sJywgZmFsc2UpO1xuICAgICAgeGhyLnNlbmQoc3RyKTtcbiAgICAgIHJldHVybiBkb2N1bWVudFdyaXRlLmNhbGwodGhpcywgeGhyLnJlc3BvbnNlVGV4dCk7XG4gICAgfTtcbiAgICBEb2N1bWVudC5wcm90b3R5cGUud3JpdGVsbiA9IGZ1bmN0aW9uKHRoaXM6IERvY3VtZW50LCBzdHI6IHN0cmluZyk6IHZvaWQge1xuICAgICAgcmV0dXJuIHRoaXMud3JpdGUoc3RyKTtcbiAgICB9OyovXG5cbiAgICBjb25zdCBhZGRFdmVudExpc3RlbmVyID0gRXZlbnRUYXJnZXQucHJvdG90eXBlLmFkZEV2ZW50TGlzdGVuZXI7XG4gICAgY29uc3QgcmVtb3ZlRXZlbnRMaXN0ZW5lciA9IEV2ZW50VGFyZ2V0LnByb3RvdHlwZS5yZW1vdmVFdmVudExpc3RlbmVyO1xuICAgIEV2ZW50VGFyZ2V0LnByb3RvdHlwZS5hZGRFdmVudExpc3RlbmVyID0gZnVuY3Rpb24odGhpczogRXZlbnRUYXJnZXQsIHR5cGU6IHN0cmluZywgbGlzdGVuZXI6IEV2ZW50TGlzdGVuZXJPckV2ZW50TGlzdGVuZXJPYmplY3QsIHVzZUNhcHR1cmU6IGJvb2xlYW4gPSBmYWxzZSkge1xuICAgICAgYWRkRXZlbnRMaXN0ZW5lci5hcHBseSh1bndyYXBJZlByb3h5KHRoaXMpLCBhcmd1bWVudHMpO1xuICAgICAgaWYgKCF0aGlzLiQkbGlzdGVuZXJzKSB7XG4gICAgICAgIHRoaXMuJCRsaXN0ZW5lcnMgPSB7fTtcbiAgICAgIH1cbiAgICAgIGxldCBsaXN0ZW5lcnMgPSB0aGlzLiQkbGlzdGVuZXJzW3R5cGVdO1xuICAgICAgaWYgKCFsaXN0ZW5lcnMpIHtcbiAgICAgICAgbGlzdGVuZXJzID0gdGhpcy4kJGxpc3RlbmVyc1t0eXBlXSA9IFtdO1xuICAgICAgfVxuICAgICAgZm9yIChjb25zdCBsaXN0ZW5lckluZm8gb2YgbGlzdGVuZXJzKSB7XG4gICAgICAgIGlmIChsaXN0ZW5lckluZm8ubGlzdGVuZXIgPT09IGxpc3RlbmVyICYmICh0eXBlb2YobGlzdGVuZXJJbmZvLnVzZUNhcHR1cmUpID09PSAnYm9vbGVhbicgPyBsaXN0ZW5lckluZm8udXNlQ2FwdHVyZSA9PT0gdXNlQ2FwdHVyZSA6IHRydWUpKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBsaXN0ZW5lcnMucHVzaCh7XG4gICAgICAgIGxpc3RlbmVyOiBsaXN0ZW5lcixcbiAgICAgICAgdXNlQ2FwdHVyZTogdXNlQ2FwdHVyZVxuICAgICAgfSk7XG4gICAgfTtcblxuICAgIEV2ZW50VGFyZ2V0LnByb3RvdHlwZS5yZW1vdmVFdmVudExpc3RlbmVyID0gZnVuY3Rpb24odGhpczogRXZlbnRUYXJnZXQsIHR5cGU6IHN0cmluZywgbGlzdGVuZXI6IEV2ZW50TGlzdGVuZXJPckV2ZW50TGlzdGVuZXJPYmplY3QsIHVzZUNhcHR1cmU6IGJvb2xlYW4gfCBvYmplY3QgPSBmYWxzZSkge1xuICAgICAgcmVtb3ZlRXZlbnRMaXN0ZW5lci5hcHBseSh1bndyYXBJZlByb3h5KHRoaXMpLCBhcmd1bWVudHMpO1xuICAgICAgaWYgKHRoaXMuJCRsaXN0ZW5lcnMpIHtcbiAgICAgICAgY29uc3QgbGlzdGVuZXJzID0gdGhpcy4kJGxpc3RlbmVyc1t0eXBlXTtcbiAgICAgICAgaWYgKGxpc3RlbmVycykge1xuICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGlzdGVuZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBsSW5mbyA9IGxpc3RlbmVyc1tpXTtcbiAgICAgICAgICAgIGlmIChsSW5mby5saXN0ZW5lciA9PT0gbGlzdGVuZXIgJiYgKHR5cGVvZihsSW5mby51c2VDYXB0dXJlKSA9PT0gJ2Jvb2xlYW4nID8gbEluZm8udXNlQ2FwdHVyZSA9PT0gdXNlQ2FwdHVyZSA6IHRydWUpKSB7XG4gICAgICAgICAgICAgIGxpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgIGlmIChsaXN0ZW5lcnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMuJCRsaXN0ZW5lcnNbdHlwZV07XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBBcnJheSBtb2RlbGluZ1xuICAgIEFycmF5LnByb3RvdHlwZS5wdXNoID0gKGZ1bmN0aW9uKHB1c2gpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbih0aGlzOiBBcnJheTxhbnk+LCAuLi5pdGVtczogYW55W10pOiBudW1iZXIge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGRpc2FibGVQcm94aWVzID0gdHJ1ZTtcbiAgICAgICAgICBpZiAoZ2V0UHJveHlTdGF0dXModGhpcykgPT09IFByb3h5U3RhdHVzLklTX1BST1hZKSB7XG4gICAgICAgICAgICBjb25zdCBtYXA6IEdyb3d0aE9iamVjdFN0YWNrVHJhY2VzID0gZ2V0UHJveHlTdGFja1RyYWNlcyh0aGlzKTtcbiAgICAgICAgICAgIGNvbnN0IHRyYWNlID0gX2dldFN0YWNrVHJhY2UoKTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaXRlbXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgX2FkZFN0YWNrVHJhY2UobWFwLCBgJHt0aGlzLmxlbmd0aCArIGl9YCwgdHJhY2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcHVzaC5hcHBseSh0aGlzLCBpdGVtcyk7XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgZGlzYWJsZVByb3hpZXMgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9KShBcnJheS5wcm90b3R5cGUucHVzaCk7XG5cbiAgICBBcnJheS5wcm90b3R5cGUudW5zaGlmdCA9IChmdW5jdGlvbih1bnNoaWZ0KSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24odGhpczogQXJyYXk8YW55PiwgLi4uaXRlbXM6IGFueVtdKTogbnVtYmVyIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBkaXNhYmxlUHJveGllcyA9IHRydWU7XG4gICAgICAgICAgaWYgKGdldFByb3h5U3RhdHVzKHRoaXMpID09PSBQcm94eVN0YXR1cy5JU19QUk9YWSkge1xuICAgICAgICAgICAgY29uc3QgbWFwOiBHcm93dGhPYmplY3RTdGFja1RyYWNlcyA9IGdldFByb3h5U3RhY2tUcmFjZXModGhpcyk7XG4gICAgICAgICAgICBjb25zdCBuZXdJdGVtTGVuID0gaXRlbXMubGVuZ3RoO1xuICAgICAgICAgICAgY29uc3QgdHJhY2UgPSBfZ2V0U3RhY2tUcmFjZSgpO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IGl0ZW1zLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICAgIF9jb3B5U3RhY2tzKG1hcCwgYCR7aX1gLCBgJHtpICsgbmV3SXRlbUxlbn1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaXRlbXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgX3JlbW92ZVN0YWNrcyhtYXAsIGAke2l9YCk7XG4gICAgICAgICAgICAgIF9hZGRTdGFja1RyYWNlKG1hcCwgYCR7aX1gLCB0cmFjZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB1bnNoaWZ0LmFwcGx5KHRoaXMsIGl0ZW1zKTtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICBkaXNhYmxlUHJveGllcyA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0pKEFycmF5LnByb3RvdHlwZS51bnNoaWZ0KTtcblxuICAgIEFycmF5LnByb3RvdHlwZS5wb3AgPSAoZnVuY3Rpb24ocG9wKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24odGhpczogQXJyYXk8YW55Pik6IGFueSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgZGlzYWJsZVByb3hpZXMgPSB0cnVlO1xuICAgICAgICAgIGlmIChnZXRQcm94eVN0YXR1cyh0aGlzKSA9PT0gUHJveHlTdGF0dXMuSVNfUFJPWFkpIHtcbiAgICAgICAgICAgIGNvbnN0IG1hcDogR3Jvd3RoT2JqZWN0U3RhY2tUcmFjZXMgPSBnZXRQcm94eVN0YWNrVHJhY2VzKHRoaXMpO1xuICAgICAgICAgICAgX3JlbW92ZVN0YWNrcyhtYXAsIGAke3RoaXMubGVuZ3RoIC0gMX1gKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHBvcC5hcHBseSh0aGlzKTtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICBkaXNhYmxlUHJveGllcyA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0pKEFycmF5LnByb3RvdHlwZS5wb3ApO1xuXG4gICAgQXJyYXkucHJvdG90eXBlLnNoaWZ0ID0gKGZ1bmN0aW9uKHNoaWZ0KSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24odGhpczogQXJyYXk8YW55Pik6IGFueSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgZGlzYWJsZVByb3hpZXMgPSB0cnVlO1xuICAgICAgICAgIGlmIChnZXRQcm94eVN0YXR1cyh0aGlzKSA9PT0gUHJveHlTdGF0dXMuSVNfUFJPWFkpIHtcbiAgICAgICAgICAgIGNvbnN0IG1hcDogR3Jvd3RoT2JqZWN0U3RhY2tUcmFjZXMgPSBnZXRQcm94eVN0YWNrVHJhY2VzKHRoaXMpO1xuICAgICAgICAgICAgX3JlbW92ZVN0YWNrcyhtYXAsIFwiMFwiKTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICBfY29weVN0YWNrcyhtYXAsIGAke2l9YCwgYCR7aSAtIDF9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBfcmVtb3ZlU3RhY2tzKG1hcCwgYCR7dGhpcy5sZW5ndGggLSAxfWApO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gc2hpZnQuYXBwbHkodGhpcyk7XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgZGlzYWJsZVByb3hpZXMgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9KShBcnJheS5wcm90b3R5cGUuc2hpZnQpO1xuXG4gICAgQXJyYXkucHJvdG90eXBlLnNwbGljZSA9IChmdW5jdGlvbihzcGxpY2UpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbih0aGlzOiBBcnJheTxhbnk+LCBzdGFydDogbnVtYmVyLCBkZWxldGVDb3VudDogbnVtYmVyLCAuLi5pdGVtczogYW55W10pOiBhbnkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGRpc2FibGVQcm94aWVzID0gdHJ1ZTtcbiAgICAgICAgICBpZiAoZ2V0UHJveHlTdGF0dXModGhpcykgPT09IFByb3h5U3RhdHVzLklTX1BST1hZKSB7XG4gICAgICAgICAgICBjb25zdCBtYXA6IEdyb3d0aE9iamVjdFN0YWNrVHJhY2VzID0gZ2V0UHJveHlTdGFja1RyYWNlcyh0aGlzKTtcbiAgICAgICAgICAgIGxldCBhY3R1YWxTdGFydCA9IHN0YXJ0IHwgMDtcbiAgICAgICAgICAgIGlmIChhY3R1YWxTdGFydCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIElmIGdyZWF0ZXIgdGhhbiB0aGUgbGVuZ3RoIG9mIHRoZSBhcnJheSwgYWN0dWFsIHN0YXJ0aW5nIGluZGV4IHdpbGwgYmUgc2V0IHRvIHRoZSBsZW5ndGggb2YgdGhlIGFycmF5LlxuICAgICAgICAgICAgaWYgKGFjdHVhbFN0YXJ0ID4gdGhpcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgYWN0dWFsU3RhcnQgPSB0aGlzLmxlbmd0aDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIElmIG5lZ2F0aXZlLCB3aWxsIGJlZ2luIHRoYXQgbWFueSBlbGVtZW50cyBmcm9tIHRoZSBlbmQgb2YgdGhlIGFycmF5ICh3aXRoIG9yaWdpbiAxKVxuICAgICAgICAgICAgLy8gYW5kIHdpbGwgYmUgc2V0IHRvIDAgaWYgYWJzb2x1dGUgdmFsdWUgaXMgZ3JlYXRlciB0aGFuIHRoZSBsZW5ndGggb2YgdGhlIGFycmF5LlxuICAgICAgICAgICAgaWYgKGFjdHVhbFN0YXJ0IDwgMCkge1xuICAgICAgICAgICAgICBhY3R1YWxTdGFydCA9IHRoaXMubGVuZ3RoICsgYWN0dWFsU3RhcnQ7XG4gICAgICAgICAgICAgIGlmIChhY3R1YWxTdGFydCA8IDApIHtcbiAgICAgICAgICAgICAgICBhY3R1YWxTdGFydCA9IDA7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCBhY3R1YWxEZWxldGVDb3VudCA9IGRlbGV0ZUNvdW50IHwgMDtcbiAgICAgICAgICAgIC8vIElmIGRlbGV0ZUNvdW50IGlzIG9taXR0ZWQsIG9yIGlmIGl0cyB2YWx1ZSBpcyBsYXJnZXIgdGhhbiBhcnJheS5sZW5ndGggLSBzdGFydCxcbiAgICAgICAgICAgIC8vICAgdGhlbiBhbGwgb2YgdGhlIGVsZW1lbnRzIGJlZ2lubmluZyB3aXRoIHN0YXJ0IGluZGV4IG9uIHRocm91Z2ggdGhlIGVuZCBvZiB0aGUgYXJyYXkgd2lsbCBiZSBkZWxldGVkLlxuICAgICAgICAgICAgaWYgKGRlbGV0ZUNvdW50ID09PSB1bmRlZmluZWQgfHwgYWN0dWFsRGVsZXRlQ291bnQgPiB0aGlzLmxlbmd0aCAtIGFjdHVhbFN0YXJ0KSB7XG4gICAgICAgICAgICAgIGFjdHVhbERlbGV0ZUNvdW50ID0gdGhpcy5sZW5ndGggLSBhY3R1YWxTdGFydDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChhY3R1YWxEZWxldGVDb3VudCA8IDApIHtcbiAgICAgICAgICAgICAgYWN0dWFsRGVsZXRlQ291bnQgPSAwO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFjdHVhbERlbGV0ZUNvdW50OyBpKyspIHtcbiAgICAgICAgICAgICAgY29uc3QgaW5kZXggPSBhY3R1YWxTdGFydCArIGk7XG4gICAgICAgICAgICAgIF9yZW1vdmVTdGFja3MobWFwLCBgJHtpbmRleH1gKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gTW92ZSBleGlzdGluZyB0cmFjZXMgaW50byBuZXcgbG9jYXRpb25zLlxuICAgICAgICAgICAgY29uc3QgbmV3SXRlbUNvdW50ID0gaXRlbXMubGVuZ3RoO1xuICAgICAgICAgICAgaWYgKG5ld0l0ZW1Db3VudCA+IGFjdHVhbERlbGV0ZUNvdW50KSB7XG4gICAgICAgICAgICAgIC8vIFNoaWZ0ICp1cHdhcmQqXG4gICAgICAgICAgICAgIGNvbnN0IGRlbHRhID0gbmV3SXRlbUNvdW50IC0gYWN0dWFsRGVsZXRlQ291bnQ7XG4gICAgICAgICAgICAgIGZvciAobGV0IGkgPSB0aGlzLmxlbmd0aCAtIDE7IGkgPj0gYWN0dWFsU3RhcnQgKyBhY3R1YWxEZWxldGVDb3VudDsgaS0tKSB7XG4gICAgICAgICAgICAgICAgX2NvcHlTdGFja3MobWFwLCBgJHtpfWAsIGAke2kgKyBkZWx0YX1gKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChuZXdJdGVtQ291bnQgPCBhY3R1YWxEZWxldGVDb3VudCkge1xuICAgICAgICAgICAgICAvLyBTaGlmdCAqZG93bndhcmQqXG4gICAgICAgICAgICAgIGNvbnN0IGRlbHRhID0gbmV3SXRlbUNvdW50IC0gYWN0dWFsRGVsZXRlQ291bnQ7XG4gICAgICAgICAgICAgIGZvciAobGV0IGkgPSBhY3R1YWxTdGFydCArIGFjdHVhbERlbGV0ZUNvdW50OyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIF9jb3B5U3RhY2tzKG1hcCwgYCR7aX1gLCBgJHtpICsgZGVsdGF9YCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgLy8gRGVsZXRlIGV4dHJhIHRyYWNlcyBmb3IgcmVtb3ZlZCBpbmRleGVzLlxuICAgICAgICAgICAgICBmb3IgKGxldCBpID0gdGhpcy5sZW5ndGggKyBkZWx0YTsgaSA8IHRoaXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBfcmVtb3ZlU3RhY2tzKG1hcCwgYCR7aX1gKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCB0cmFjZSA9IF9nZXRTdGFja1RyYWNlKCk7XG4gICAgICAgICAgICAvLyBBZGQgbmV3IHRyYWNlcyBmb3IgbmV3IGl0ZW1zLlxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuZXdJdGVtQ291bnQ7IGkrKykge1xuICAgICAgICAgICAgICBfcmVtb3ZlU3RhY2tzKG1hcCwgYCR7YWN0dWFsU3RhcnQgKyBpfWApO1xuICAgICAgICAgICAgICBfYWRkU3RhY2tUcmFjZShtYXAsIGAke2FjdHVhbFN0YXJ0ICsgaX1gLCB0cmFjZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBzcGxpY2UuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICBkaXNhYmxlUHJveGllcyA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0pKEFycmF5LnByb3RvdHlwZS5zcGxpY2UpO1xuXG4gICAgLy8gTWFrZSBpbmRleE9mIHVzZSAkJCRTRVEkJCRcbiAgICBBcnJheS5wcm90b3R5cGUuaW5kZXhPZiA9IGZ1bmN0aW9uKHRoaXM6IEFycmF5PGFueT4sIHNlYXJjaEVsZW1lbnQsIGZyb21JbmRleEFyZz86IG51bWJlcik6IGFueSB7XG4gICAgICBsZXQgZnJvbUluZGV4ID0gZnJvbUluZGV4QXJnIHx8IDA7XG4gICAgICAvLyBJZiB0aGUgcHJvdmlkZWQgaW5kZXggdmFsdWUgaXMgYSBuZWdhdGl2ZSBudW1iZXIsIGl0IGlzIHRha2VuIGFzIHRoZSBvZmZzZXQgZnJvbSB0aGUgZW5kIG9mIHRoZSBhcnJheS5cbiAgICAgIC8vIFRoZSBhcnJheSBpcyBzdGlsbCBzZWFyY2hlZCBmcm9tIGZyb250IHRvIGJhY2suXG4gICAgICBpZiAoZnJvbUluZGV4IDwgMCkge1xuICAgICAgICBmcm9tSW5kZXggPSB0aGlzLmxlbmd0aCArIGZyb21JbmRleDtcbiAgICAgIH1cbiAgICAgIC8vIElmIHRoZSBjYWxjdWxhdGVkIGluZGV4IGlzIGxlc3MgdGhhbiAwLCB0aGVuIHRoZSB3aG9sZSBhcnJheSB3aWxsIGJlIHNlYXJjaGVkLlxuICAgICAgaWYgKGZyb21JbmRleCA8IDApIHtcbiAgICAgICAgZnJvbUluZGV4ID0gMDtcbiAgICAgIH1cbiAgICAgIC8vIElmIHRoZSBpbmRleCBpcyBncmVhdGVyIHRoYW4gb3IgZXF1YWwgdG8gdGhlIGFycmF5J3MgbGVuZ3RoLCAtMSBpcyByZXR1cm5lZCwgd2hpY2ggbWVhbnMgdGhlIGFycmF5IHdpbGwgbm90IGJlIHNlYXJjaGVkLlxuICAgICAgaWYgKGZyb21JbmRleCA+PSB0aGlzLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gLTE7XG4gICAgICB9XG5cbiAgICAgIGZvciAoOyBmcm9tSW5kZXggPCB0aGlzLmxlbmd0aDsgZnJvbUluZGV4KyspIHtcbiAgICAgICAgaWYgKCQkJFNFUSQkJCh0aGlzW2Zyb21JbmRleF0sIHNlYXJjaEVsZW1lbnQpKSB7XG4gICAgICAgICAgcmV0dXJuIGZyb21JbmRleDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIC0xO1xuICAgIH07XG5cbiAgICBBcnJheS5wcm90b3R5cGUubGFzdEluZGV4T2YgPSBmdW5jdGlvbih0aGlzOiBhbnlbXSwgc2VhcmNoRWxlbWVudDogYW55LCBmcm9tSW5kZXggPSAwKTogbnVtYmVyIHtcbiAgICAgIGlmICh0aGlzID09PSB2b2lkIDAgfHwgdGhpcyA9PT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XG4gICAgICB9XG5cbiAgICAgIGxldCB0ID0gT2JqZWN0KHRoaXMpLFxuICAgICAgICBsZW4gPSB0Lmxlbmd0aCA+Pj4gMDtcbiAgICAgIGlmIChsZW4gPT09IDApIHtcbiAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgfVxuXG4gICAgICBsZXQgbiA9IGxlbiAtIDE7XG4gICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgbiA9IE51bWJlcihhcmd1bWVudHNbMV0pO1xuICAgICAgICBpZiAobiAhPSBuKSB7XG4gICAgICAgICAgbiA9IDA7XG4gICAgICAgIH0gZWxzZSBpZiAobiAhPSAwICYmIG4gIT0gKDEgLyAwKSAmJiBuICE9IC0oMSAvIDApKSB7XG4gICAgICAgICAgbiA9IChuID4gMCA/IDEgOiAtMSkgKiBNYXRoLmZsb29yKE1hdGguYWJzKG4pKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmb3IgKGxldCBrID0gbiA+PSAwID8gTWF0aC5taW4obiwgbGVuIC0gMSkgOiBsZW4gLSBNYXRoLmFicyhuKTsgayA+PSAwOyBrLS0pIHtcbiAgICAgICAgaWYgKGsgaW4gdCAmJiAkJCRTRVEkJCQodFtrXSwgc2VhcmNoRWxlbWVudCkpIHtcbiAgICAgICAgICByZXR1cm4gaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIC0xO1xuICAgIH07XG5cbiAgICAvLyBUT0RPOiBTb3J0LCByZXZlcnNlLCAuLi5cblxuICAgIC8vIERldGVybWluaXN0aWMgTWF0aC5yYW5kb20oKSwgc28galF1ZXJ5IHZhcmlhYmxlIGlzIGRldGVybWluaXN0aWMuXG4gICAgLy8gRnJvbSBodHRwczovL2dpc3QuZ2l0aHViLmNvbS9tYXRoaWFzYnluZW5zLzU2NzA5MTdcbiAgICBNYXRoLnJhbmRvbSA9IChmdW5jdGlvbigpIHtcbiAgICAgIGxldCBzZWVkID0gMHgyRjZFMkIxO1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBSb2JlcnQgSmVua2luc+KAmSAzMiBiaXQgaW50ZWdlciBoYXNoIGZ1bmN0aW9uXG4gICAgICAgIHNlZWQgPSAoKHNlZWQgKyAweDdFRDU1RDE2KSArIChzZWVkIDw8IDEyKSkgICYgMHhGRkZGRkZGRjtcbiAgICAgICAgc2VlZCA9ICgoc2VlZCBeIDB4Qzc2MUMyM0MpIF4gKHNlZWQgPj4+IDE5KSkgJiAweEZGRkZGRkZGO1xuICAgICAgICBzZWVkID0gKChzZWVkICsgMHgxNjU2NjdCMSkgKyAoc2VlZCA8PCA1KSkgICAmIDB4RkZGRkZGRkY7XG4gICAgICAgIHNlZWQgPSAoKHNlZWQgKyAweEQzQTI2NDZDKSBeIChzZWVkIDw8IDkpKSAgICYgMHhGRkZGRkZGRjtcbiAgICAgICAgc2VlZCA9ICgoc2VlZCArIDB4RkQ3MDQ2QzUpICsgKHNlZWQgPDwgMykpICAgJiAweEZGRkZGRkZGO1xuICAgICAgICBzZWVkID0gKChzZWVkIF4gMHhCNTVBNEYwOSkgXiAoc2VlZCA+Pj4gMTYpKSAmIDB4RkZGRkZGRkY7XG4gICAgICAgIHJldHVybiAoc2VlZCAmIDB4RkZGRkZGRikgLyAweDEwMDAwMDAwO1xuICAgICAgfTtcbiAgICB9KCkpO1xuXG4gICAgLy8gRGV0ZXJtaW5pc3RpYyBEYXRlLm5vdygpLCBzbyBZVUkgdmFyaWFibGUgaXMgZGV0ZXJtaW5pc3RpYy5cbiAgICBsZXQgZGF0ZU5vd0NvdW50ID0gMDtcbiAgICBEYXRlLm5vdyA9IERhdGUucHJvdG90eXBlLmdldFRpbWUgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiAxNTE2OTkyNTEyNDI1ICsgKGRhdGVOb3dDb3VudCsrKTtcbiAgICB9O1xuXG4gICAgLy8gaW50ZXJmYWNlIENvdW50IHtnZXQ6IG51bWJlcjsgc2V0OiBudW1iZXI7IGludm9rZWQ6IG51bWJlciB9XG5cbiAgICAvKipcbiAgICAgKiBbREVCVUddIEluc3RhbGxzIGEgY291bnRlciBvbiBhIHBhcnRpY3VsYXIgb2JqZWN0IHByb3BlcnR5LlxuICAgICAqIEBwYXJhbSBvYmpcbiAgICAgKiBAcGFyYW0gcHJvcGVydHlcbiAgICAgKiBAcGFyYW0ga2V5XG4gICAgICogQHBhcmFtIGNvdW50TWFwXG4gICAgICovXG4gICAgLypmdW5jdGlvbiBjb3VudFByb3BlcnR5QWNjZXNzZXMob2JqOiBhbnksIHByb3BlcnR5OiBzdHJpbmcsIGtleTogc3RyaW5nLCBjb3VudE1hcDogTWFwPHN0cmluZywgQ291bnQ+KTogdm9pZCB7XG4gICAgICBsZXQgY291bnQ6IENvdW50ID0geyBnZXQ6IDAsIHNldDogMCwgaW52b2tlZDogMH07XG4gICAgICBjb25zdCBvcmlnaW5hbCA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Iob2JqLCBwcm9wZXJ0eSk7XG4gICAgICB0cnkge1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqLCBwcm9wZXJ0eSwge1xuICAgICAgICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjb3VudC5nZXQrKztcbiAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gb3JpZ2luYWwuZ2V0ID8gb3JpZ2luYWwuZ2V0LmFwcGx5KHRoaXMpIDogb3JpZ2luYWwudmFsdWU7XG4gICAgICAgICAgICBpZiAodHlwZW9mKHZhbHVlKSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbih0aGlzOiBhbnkpIHtcbiAgICAgICAgICAgICAgICBjb3VudC5pbnZva2VkKys7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgICBzZXQ6IGZ1bmN0aW9uKHYpIHtcbiAgICAgICAgICAgIGNvdW50LnNldCsrO1xuICAgICAgICAgICAgaWYgKG9yaWdpbmFsLnNldCkge1xuICAgICAgICAgICAgICByZXR1cm4gb3JpZ2luYWwuc2V0LmNhbGwodGhpcywgdik7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKG9yaWdpbmFsLndyaXRhYmxlKSB7XG4gICAgICAgICAgICAgIG9yaWdpbmFsLnZhbHVlID0gdjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIE90aGVyd2lzZTogTk9QLlxuICAgICAgICAgIH0sXG4gICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICAgIH0pO1xuICAgICAgICBjb3VudE1hcC5zZXQoa2V5LCBjb3VudCk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGxvZ1RvQ29uc29sZShgVW5hYmxlIHRvIGluc3RydW1lbnQgJHtrZXl9YCk7XG4gICAgICB9XG4gICAgfSovXG5cbiAgICAvKipcbiAgICAgKiBJbnRlcnBvc2VzIG9uIGEgcGFydGljdWxhciBBUEkgdG8gcmV0dXJuIHByb3h5IG9iamVjdHMgZm9yIG9iamVjdHMgd2l0aCBwcm94aWVzIGFuZCB1bndyYXAgYXJndW1lbnRzIHRoYXQgYXJlIHByb3hpZXMuXG4gICAgICovXG4gICAgZnVuY3Rpb24gcHJveHlJbnRlcnBvc2l0aW9uKG9iajogYW55LCBwcm9wZXJ0eTogc3RyaW5nLCBrZXk6IHN0cmluZyk6IHZvaWQge1xuICAgICAgY29uc3Qgb3JpZ2luYWwgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG9iaiwgcHJvcGVydHkpO1xuICAgICAgaWYgKCFvcmlnaW5hbC5jb25maWd1cmFibGUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdHJ5IHtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iaiwgcHJvcGVydHksIHtcbiAgICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBvcmlnaW5hbC5nZXQgPyBvcmlnaW5hbC5nZXQuYXBwbHkodW53cmFwSWZQcm94eSh0aGlzKSkgOiBvcmlnaW5hbC52YWx1ZTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YodmFsdWUpID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHRoaXM6IGFueSwgLi4uYXJnczogYW55W10pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gd3JhcElmT3JpZ2luYWwodW53cmFwSWZQcm94eSh2YWx1ZSkuYXBwbHkodW53cmFwSWZQcm94eSh0aGlzKSwgYXJncy5tYXAodW53cmFwSWZQcm94eSkpKTtcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJldHVybiB3cmFwSWZPcmlnaW5hbCh2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgICBzZXQ6IGZ1bmN0aW9uKHYpIHtcbiAgICAgICAgICAgIGNvbnN0IG9yaWdpbmFsViA9IHVud3JhcElmUHJveHkodik7XG4gICAgICAgICAgICBpZiAob3JpZ2luYWwuc2V0KSB7XG4gICAgICAgICAgICAgIG9yaWdpbmFsLnNldC5jYWxsKHVud3JhcElmUHJveHkodGhpcyksIG9yaWdpbmFsVik7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKG9yaWdpbmFsLndyaXRhYmxlKSB7XG4gICAgICAgICAgICAgIG9yaWdpbmFsLnZhbHVlID0gb3JpZ2luYWxWO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gT3RoZXJ3aXNlOiBOT1AuXG4gICAgICAgICAgfSxcbiAgICAgICAgICAvLyBNYWtlIGludGVycG9zaXRpb24gbmVzdGFibGVcbiAgICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgICAgfSk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGxvZ1RvQ29uc29sZShgVW5hYmxlIHRvIGluc3RydW1lbnQgJHtrZXl9YCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSW50ZXJwb3NpdGlvbiBcIm9uW2V2ZW50bmFtZV1cIiBwcm9wZXJ0aWVzIGFuZCBzdG9yZSB2YWx1ZSBhcyBhbiBleHBhbmRvXG4gICAgICogcHJvcGVydHkgb24gRE9NIGVsZW1lbnQgc28gaXQgc2hvd3MgdXAgaW4gdGhlIGhlYXAgc25hcHNob3QuXG4gICAgICogQHBhcmFtIG9ialxuICAgICAqIEBwYXJhbSBwcm9wTmFtZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGludGVycG9zaXRpb25FdmVudExpc3RlbmVyUHJvcGVydHkob2JqOiBvYmplY3QsIHByb3BOYW1lOiBzdHJpbmcpOiB2b2lkIHtcbiAgICAgIGNvbnN0IGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG9iaiwgcHJvcE5hbWUpO1xuICAgICAgaWYgKGRlc2MpIHtcbiAgICAgICAgZGVsZXRlIGRlc2NbJ3ZhbHVlJ107XG4gICAgICAgIGRlbGV0ZSBkZXNjWyd3cml0YWJsZSddO1xuICAgICAgICBjb25zdCBzZXQgPSBkZXNjLnNldDtcbiAgICAgICAgZGVzYy5zZXQgPSBmdW5jdGlvbih0aGlzOiBhbnksIHZhbDogYW55KSB7XG4gICAgICAgICAgc2V0LmNhbGwodGhpcywgdmFsKTtcbiAgICAgICAgICB0aGlzW2AkJCR7cHJvcE5hbWV9YF0gPSB2YWw7XG4gICAgICAgIH07XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmosIHByb3BOYW1lLCBkZXNjKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoSVNfV0lORE9XKSB7XG4gICAgICBbRG9jdW1lbnQucHJvdG90eXBlLCBFbGVtZW50LnByb3RvdHlwZSwgTWVkaWFRdWVyeUxpc3QucHJvdG90eXBlLCBGaWxlUmVhZGVyLnByb3RvdHlwZSxcbiAgICAgICAgSFRNTEJvZHlFbGVtZW50LnByb3RvdHlwZSwgSFRNTEVsZW1lbnQucHJvdG90eXBlLCBIVE1MRnJhbWVTZXRFbGVtZW50LnByb3RvdHlwZSxcbiAgICAgICAgQXBwbGljYXRpb25DYWNoZS5wcm90b3R5cGUsIC8vRXZlbnRTb3VyY2UucHJvdG90eXBlLCBTVkdBbmltYXRpb25FbGVtZW50LnByb3RvdHlwZSxcbiAgICAgICAgU1ZHRWxlbWVudC5wcm90b3R5cGUsIFhNTEh0dHBSZXF1ZXN0LnByb3RvdHlwZSwgLy9YTUxIdHRwUmVxdWVzdEV2ZW50VGFyZ2V0LnByb3RvdHlwZSxcbiAgICAgICAgV2ViU29ja2V0LnByb3RvdHlwZSwgSURCRGF0YWJhc2UucHJvdG90eXBlLCBJREJPcGVuREJSZXF1ZXN0LnByb3RvdHlwZSxcbiAgICAgICAgSURCUmVxdWVzdC5wcm90b3R5cGUsIElEQlRyYW5zYWN0aW9uLnByb3RvdHlwZSwgd2luZG93XS5mb3JFYWNoKChvYmopID0+IHtcbiAgICAgICAgICBPYmplY3Qua2V5cyhvYmopLmZpbHRlcigocCkgPT4gcC5zdGFydHNXaXRoKFwib25cIikpLmZvckVhY2goKHApID0+IHtcbiAgICAgICAgICAgIGludGVycG9zaXRpb25FdmVudExpc3RlbmVyUHJvcGVydHkob2JqLCBwKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgIC8vY29uc3QgY291bnRNYXAgPSBuZXcgTWFwPHN0cmluZywgQ291bnQ+KCk7XG4gICAgICBbW05vZGUucHJvdG90eXBlLCBcIk5vZGVcIl0sIFtFbGVtZW50LnByb3RvdHlwZSwgXCJFbGVtZW50XCJdLCBbSFRNTEVsZW1lbnQucHJvdG90eXBlLCBcIkhUTUxFbGVtZW50XCJdLFxuICAgICAgW0RvY3VtZW50LnByb3RvdHlwZSwgXCJEb2N1bWVudFwiXSwgW0hUTUxDYW52YXNFbGVtZW50LnByb3RvdHlwZSwgXCJIVE1MQ2FudmFzRWxlbWVudFwiXSxcbiAgICAgIFtOb2RlTGlzdC5wcm90b3R5cGUsIFwiTm9kZUxpc3RcIl1dXG4gICAgICAgIC5mb3JFYWNoKCh2KSA9PiBPYmplY3Qua2V5cyh2WzBdKS5mb3JFYWNoKChrKSA9PiBwcm94eUludGVycG9zaXRpb24odlswXSwgaywgYCR7dlsxXX0uJHtrfWApKSk7XG5cbiAgICAgIC8vIFRPRE86IFJlbW92ZSBpbnN0cnVtZW50YXRpb24gd2hlbiBlbGVtZW50IG1vdmVkP1xuXG4gICAgICBjb25zdCAkJCRSRUlOU1RSVU1FTlQkJCQgPSBmdW5jdGlvbih0aGlzOiBOb2RlIHwgTm9kZUxpc3QpOiB2b2lkIHtcbiAgICAgICAgaWYgKHRoaXMuJCQkVFJFRSQkJCkge1xuICAgICAgICAgIGluc3RydW1lbnRET01UcmVlKHRoaXMuJCQkQUNDRVNTX1NUUklORyQkJCwgdGhpcywgdGhpcy4kJCRUUkVFJCQkLCBfZ2V0U3RhY2tUcmFjZSgpKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShOb2RlLnByb3RvdHlwZSwgJyQkJFJFSU5TVFJVTUVOVCQkJCcsIHtcbiAgICAgICAgdmFsdWU6ICQkJFJFSU5TVFJVTUVOVCQkJCxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICB9KTtcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShOb2RlTGlzdC5wcm90b3R5cGUsICckJCRSRUlOU1RSVU1FTlQkJCQnLCB7XG4gICAgICAgIHZhbHVlOiAkJCRSRUlOU1RSVU1FTlQkJCQsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IHRleHRDb250ZW50ID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihOb2RlLnByb3RvdHlwZSwgJ3RleHRDb250ZW50Jyk7XG4gICAgICAvLyB0ZXh0Q29udGVudDogUGFzcyBpbiBhIHN0cmluZy4gUmVwbGFjZXMgYWxsIGNoaWxkcmVuIHcvIGEgc2luZ2xlIHRleHQgbm9kZS5cbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShOb2RlLnByb3RvdHlwZSwgJ3RleHRDb250ZW50Jywge1xuICAgICAgICBnZXQ6IHRleHRDb250ZW50LmdldCxcbiAgICAgICAgc2V0OiBmdW5jdGlvbih0aGlzOiBOb2RlLCB2OiBhbnkpIHtcbiAgICAgICAgICBjb25zdCBydiA9IHRleHRDb250ZW50LnNldC5jYWxsKHRoaXMsIHYpO1xuICAgICAgICAgIGNvbnN0IGNuID0gdGhpcy5jaGlsZE5vZGVzO1xuICAgICAgICAgIGlmIChnZXRQcm94eVN0YXR1cyhjbikgPT09IFByb3h5U3RhdHVzLklTX1BST1hZKSB7XG4gICAgICAgICAgICBjb25zdCB0cmFjZXMgPSBnZXRQcm94eVN0YWNrVHJhY2VzKGNuKTtcbiAgICAgICAgICAgIHRyYWNlcy5jbGVhcigpO1xuICAgICAgICAgICAgX2luaXRpYWxpemVNYXAoY24sIHRyYWNlcywgX2dldFN0YWNrVHJhY2UoKSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMuY2hpbGROb2Rlcy4kJCRSRUlOU1RSVU1FTlQkJCQoKTtcbiAgICAgICAgICByZXR1cm4gcnY7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IGFwcGVuZENoaWxkID0gTm9kZS5wcm90b3R5cGUuYXBwZW5kQ2hpbGQ7XG4gICAgICBOb2RlLnByb3RvdHlwZS5hcHBlbmRDaGlsZCA9IGZ1bmN0aW9uPFQgZXh0ZW5kcyBOb2RlPih0aGlzOiBOb2RlLCBuZXdDaGlsZDogVCk6IFQge1xuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIE5vZGUuYXBwZW5kQ2hpbGQoKSBtZXRob2QgYWRkcyBhIG5vZGUgdG8gdGhlIGVuZCBvZiB0aGUgbGlzdCBvZiBjaGlsZHJlbiBvZiBhIHNwZWNpZmllZCBwYXJlbnQgbm9kZS5cbiAgICAgICAgICogSWYgdGhlIGdpdmVuIGNoaWxkIGlzIGEgcmVmZXJlbmNlIHRvIGFuIGV4aXN0aW5nIG5vZGUgaW4gdGhlIGRvY3VtZW50LFxuICAgICAgICAgKiBhcHBlbmRDaGlsZCgpIG1vdmVzIGl0IGZyb20gaXRzIGN1cnJlbnQgcG9zaXRpb24gdG8gdGhlIG5ldyBwb3NpdGlvbi5cbiAgICAgICAgICovXG4gICAgICAgIGlmIChuZXdDaGlsZC5wYXJlbnROb2RlICE9PSBudWxsKSB7XG4gICAgICAgICAgbmV3Q2hpbGQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChuZXdDaGlsZCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjbiA9IHRoaXMuY2hpbGROb2RlcztcbiAgICAgICAgaWYgKGdldFByb3h5U3RhdHVzKGNuKSA9PT0gUHJveHlTdGF0dXMuSVNfUFJPWFkpIHtcbiAgICAgICAgICBjb25zdCB0cmFjZXMgPSBnZXRQcm94eVN0YWNrVHJhY2VzKGNuKTtcbiAgICAgICAgICBfYWRkU3RhY2tUcmFjZSh0cmFjZXMsIGAke2NuLmxlbmd0aH1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHJ2ID0gYXBwZW5kQ2hpbGQuY2FsbCh0aGlzLCBuZXdDaGlsZCk7XG4gICAgICAgIGNuLiQkJFJFSU5TVFJVTUVOVCQkJCgpO1xuICAgICAgICByZXR1cm4gcnY7XG4gICAgICB9O1xuXG4gICAgICBjb25zdCBpbnNlcnRCZWZvcmUgPSBOb2RlLnByb3RvdHlwZS5pbnNlcnRCZWZvcmU7XG4gICAgICAvLyBpbnNlcnRCZWZvcmU6IFRha2VzIE5vZGVzLiBNb2RpZmllcyBET00uXG4gICAgICBOb2RlLnByb3RvdHlwZS5pbnNlcnRCZWZvcmUgPSBmdW5jdGlvbjxUIGV4dGVuZHMgTm9kZT4obmV3Q2hpbGQ6IFQsIHJlZkNoaWxkOiBOb2RlKTogVCB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgTm9kZS5pbnNlcnRCZWZvcmUoKSBtZXRob2QgaW5zZXJ0cyB0aGUgc3BlY2lmaWVkIG5vZGUgYmVmb3JlIHRoZSByZWZlcmVuY2VcbiAgICAgICAgICogbm9kZSBhcyBhIGNoaWxkIG9mIHRoZSBjdXJyZW50IG5vZGUuXG4gICAgICAgICAqXG4gICAgICAgICAqIElmIHJlZmVyZW5jZU5vZGUgaXMgbnVsbCwgdGhlIG5ld05vZGUgaXMgaW5zZXJ0ZWQgYXQgdGhlIGVuZCBvZiB0aGUgbGlzdCBvZiBjaGlsZCBub2Rlcy5cbiAgICAgICAgICpcbiAgICAgICAgICogTm90ZSB0aGF0IHJlZmVyZW5jZU5vZGUgaXMgbm90IGFuIG9wdGlvbmFsIHBhcmFtZXRlciAtLSB5b3UgbXVzdCBleHBsaWNpdGx5IHBhc3MgYSBOb2RlXG4gICAgICAgICAqIG9yIG51bGwuIEZhaWxpbmcgdG8gcHJvdmlkZSBpdCBvciBwYXNzaW5nIGludmFsaWQgdmFsdWVzIG1heSBiZWhhdmUgZGlmZmVyZW50bHkgaW5cbiAgICAgICAgICogZGlmZmVyZW50IGJyb3dzZXIgdmVyc2lvbnMuXG4gICAgICAgICAqL1xuICAgICAgICBjb25zdCBjbiA9IHRoaXMuY2hpbGROb2RlcztcbiAgICAgICAgaWYgKGdldFByb3h5U3RhdHVzKGNuKSA9PT0gUHJveHlTdGF0dXMuSVNfUFJPWFkpIHtcbiAgICAgICAgICBpZiAocmVmQ2hpbGQgPT09IG51bGwpIHtcbiAgICAgICAgICAgIC8vIEF2b2lkIHRyYWNraW5nIHN0YWNrIHRyYWNlcyBmb3Igc3BlY2lhbCBjYXNlLlxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYXBwZW5kQ2hpbGQobmV3Q2hpbGQpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBzdGFja3MgPSBnZXRQcm94eVN0YWNrVHJhY2VzKGNuKTtcbiAgICAgICAgICAgIGNvbnN0IGxlbiA9IGNuLmxlbmd0aDtcbiAgICAgICAgICAgIGxldCBwb3NpdGlvbiA9IC0xO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgICBpZiAoJCQkU0VRJCQkKGNuW2ldLCByZWZDaGlsZCkpIHtcbiAgICAgICAgICAgICAgICBwb3NpdGlvbiA9IGk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChwb3NpdGlvbiA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgbG9nVG9Db25zb2xlKGBpbnNlcnRCZWZvcmUgY2FsbGVkIHdpdGggaW52YWxpZCBub2RlIWApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IGxlbiAtIDE7IGkgPj0gcG9zaXRpb247IGktLSkge1xuICAgICAgICAgICAgICAgIF9jb3B5U3RhY2tzKHN0YWNrcywgYCR7aX1gLCBgJHtpICsgMX1gKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBfcmVtb3ZlU3RhY2tzKHN0YWNrcywgYCR7cG9zaXRpb259YCk7XG4gICAgICAgICAgICAgIF9hZGRTdGFja1RyYWNlKHN0YWNrcywgYCR7cG9zaXRpb259YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJ2ID0gaW5zZXJ0QmVmb3JlLmNhbGwodGhpcywgbmV3Q2hpbGQsIHJlZkNoaWxkKTtcbiAgICAgICAgY24uJCQkUkVJTlNUUlVNRU5UJCQkKCk7XG4gICAgICAgIHJldHVybiBydjtcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IG5vcm1hbGl6ZSA9IE5vZGUucHJvdG90eXBlLm5vcm1hbGl6ZTtcbiAgICAgIGZ1bmN0aW9uIG5vcm1hbGl6ZUludGVybmFsKG46IE5vZGUpOiB2b2lkIHtcbiAgICAgICAgY29uc3QgY2hpbGRyZW4gPSBuLmNoaWxkTm9kZXM7XG4gICAgICAgIGNvbnN0IGxlbiA9IGNoaWxkcmVuLmxlbmd0aDtcbiAgICAgICAgY29uc3Qgc3RhY2tzID0gZ2V0UHJveHlTdGFja1RyYWNlcyhuLmNoaWxkTm9kZXMpO1xuICAgICAgICBsZXQgcHJldlRleHROb2RlOiBOb2RlID0gbnVsbDtcbiAgICAgICAgbGV0IHByZXZUZXh0Tm9kZUk6IG51bWJlciA9IC0xO1xuICAgICAgICBsZXQgdG9SZW1vdmU6IG51bWJlcltdID0gW107XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBjaGlsZCA9IGNoaWxkcmVuW2ldO1xuICAgICAgICAgIGlmIChjaGlsZC5ub2RlVHlwZSA9PT0gTm9kZS5URVhUX05PREUpIHtcbiAgICAgICAgICAgIGlmIChjaGlsZC50ZXh0Q29udGVudCA9PT0gXCJcIikge1xuICAgICAgICAgICAgICAvLyBSZW1vdmUgZW1wdHkgdGV4dCBub2Rlcy5cbiAgICAgICAgICAgICAgdG9SZW1vdmUucHVzaChpKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocHJldlRleHROb2RlKSB7XG4gICAgICAgICAgICAgIC8vIE1lcmdlIGFkamFjZW50IHRleHQgbm9kZXMuXG4gICAgICAgICAgICAgIHByZXZUZXh0Tm9kZS50ZXh0Q29udGVudCArPSBjaGlsZC50ZXh0Q29udGVudDtcbiAgICAgICAgICAgICAgaWYgKHN0YWNrcykge1xuICAgICAgICAgICAgICAgIF9jb21iaW5lU3RhY2tzKHN0YWNrcywgYCR7cHJldlRleHROb2RlSX1gLCBgJHtpfWApO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHRvUmVtb3ZlLnB1c2goaSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBwcmV2VGV4dE5vZGUgPSBjaGlsZDtcbiAgICAgICAgICAgICAgcHJldlRleHROb2RlSSA9IGk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHByZXZUZXh0Tm9kZSA9IG51bGw7XG4gICAgICAgICAgICBwcmV2VGV4dE5vZGVJID0gLTE7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJlbW92ZUxlbiA9IHRvUmVtb3ZlLmxlbmd0aDtcbiAgICAgICAgZm9yIChsZXQgaSA9IHJlbW92ZUxlbiAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgbi5yZW1vdmVDaGlsZChjaGlsZHJlblt0b1JlbW92ZVtpXV0pO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGxlbjIgPSBjaGlsZHJlbi5sZW5ndGg7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuMjsgaSsrKSB7XG4gICAgICAgICAgbm9ybWFsaXplSW50ZXJuYWwoY2hpbGRyZW5baV0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBOb2RlLnByb3RvdHlwZS5ub3JtYWxpemUgPSBmdW5jdGlvbih0aGlzOiBOb2RlKTogdm9pZCB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgTm9kZS5ub3JtYWxpemUoKSBtZXRob2QgcHV0cyB0aGUgc3BlY2lmaWVkIG5vZGUgYW5kIGFsbCBvZiBpdHMgc3ViLXRyZWUgaW50byBhXG4gICAgICAgICAqIFwibm9ybWFsaXplZFwiIGZvcm0uIEluIGEgbm9ybWFsaXplZCBzdWItdHJlZSwgbm8gdGV4dCBub2RlcyBpbiB0aGUgc3ViLXRyZWUgYXJlIGVtcHR5XG4gICAgICAgICAqIGFuZCB0aGVyZSBhcmUgbm8gYWRqYWNlbnQgdGV4dCBub2Rlcy5cbiAgICAgICAgICovXG4gICAgICAgIGlmICh0aGlzLiQkJFRSRUUkJCQpIHtcbiAgICAgICAgICBub3JtYWxpemVJbnRlcm5hbCh0aGlzKTtcbiAgICAgICAgICB0aGlzLiQkJFJFSU5TVFJVTUVOVCQkJCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBub3JtYWxpemUuY2FsbCh0aGlzKTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgY29uc3QgcmVtb3ZlQ2hpbGQgPSBOb2RlLnByb3RvdHlwZS5yZW1vdmVDaGlsZDtcbiAgICAgIE5vZGUucHJvdG90eXBlLnJlbW92ZUNoaWxkID0gZnVuY3Rpb248VCBleHRlbmRzIE5vZGU+KHRoaXM6IE5vZGUsIGNoaWxkOiBUKTogVCB7XG4gICAgICAgIGNvbnN0IGNuID0gdGhpcy5jaGlsZE5vZGVzO1xuICAgICAgICBpZiAoZ2V0UHJveHlTdGF0dXMoY24pID09PSBQcm94eVN0YXR1cy5JU19QUk9YWSkge1xuICAgICAgICAgIGNvbnN0IHN0YWNrcyA9IGdldFByb3h5U3RhY2tUcmFjZXMoY24pO1xuICAgICAgICAgIGNvbnN0IGNoaWxkcmVuID0gdGhpcy5jaGlsZE5vZGVzO1xuICAgICAgICAgIGNvbnN0IGxlbiA9IGNoaWxkcmVuLmxlbmd0aDtcbiAgICAgICAgICBsZXQgaSA9IDA7XG4gICAgICAgICAgZm9yICg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgaWYgKCQkJFNFUSQkJChjaGlsZHJlbltpXSwgY2hpbGQpKSB7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoaSA9PT0gbGVuKSB7XG4gICAgICAgICAgICBsb2dUb0NvbnNvbGUoYEludmFsaWQgY2FsbCB0byByZW1vdmVDaGlsZC5gKVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmb3IgKGxldCBqID0gaSArIDE7IGogPCBsZW47IGorKykge1xuICAgICAgICAgICAgICBfY29weVN0YWNrcyhzdGFja3MsIGAke2p9YCwgYCR7aiAtIDF9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBfcmVtb3ZlU3RhY2tzKHN0YWNrcywgYCR7bGVuIC0gMX1gKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcnYgPSByZW1vdmVDaGlsZC5jYWxsKHRoaXMsIGNoaWxkKTtcbiAgICAgICAgY24uJCQkUkVJTlNUUlVNRU5UJCQkKCk7XG4gICAgICAgIHJldHVybiBydjtcbiAgICAgIH1cblxuICAgICAgLy8gcmVwbGFjZUNoaWxkOiBSZXBsYWNlcyBhIGNoaWxkLlxuICAgICAgY29uc3QgcmVwbGFjZUNoaWxkID0gTm9kZS5wcm90b3R5cGUucmVwbGFjZUNoaWxkO1xuICAgICAgTm9kZS5wcm90b3R5cGUucmVwbGFjZUNoaWxkID0gZnVuY3Rpb248VCBleHRlbmRzIE5vZGU+KHRoaXM6IE5vZGUsIG5ld0NoaWxkOiBOb2RlLCBvbGRDaGlsZDogVCk6IFQge1xuICAgICAgICBjb25zdCBjbiA9IHRoaXMuY2hpbGROb2RlcztcbiAgICAgICAgaWYgKGdldFByb3h5U3RhdHVzKGNuKSA9PT0gUHJveHlTdGF0dXMuSVNfUFJPWFkpIHtcbiAgICAgICAgICBjb25zdCBzdGFja3MgPSBnZXRQcm94eVN0YWNrVHJhY2VzKGNuKTtcbiAgICAgICAgICBsZXQgaSA9IDA7XG4gICAgICAgICAgY29uc3QgbGVuID0gY24ubGVuZ3RoO1xuICAgICAgICAgIGZvciAoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIGlmICgkJCRTRVEkJCQoY25baV0sIG9sZENoaWxkKSkge1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGkgPT09IGxlbikge1xuICAgICAgICAgICAgbG9nVG9Db25zb2xlKGByZXBsYWNlQ2hpbGQgY2FsbGVkIHdpdGggaW52YWxpZCBjaGlsZGApO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBfYWRkU3RhY2tUcmFjZShzdGFja3MsIGAke2l9YCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJ2ID0gcmVwbGFjZUNoaWxkLmNhbGwodGhpcywgbmV3Q2hpbGQsIG9sZENoaWxkKTtcbiAgICAgICAgY24uJCQkUkVJTlNUUlVNRU5UJCQkKCk7XG4gICAgICAgIHJldHVybiBydjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgaW5uZXJIVE1MID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihFbGVtZW50LnByb3RvdHlwZSwgJ2lubmVySFRNTCcpO1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEVsZW1lbnQucHJvdG90eXBlLCAnaW5uZXJIVE1MJywge1xuICAgICAgICBnZXQ6IGlubmVySFRNTC5nZXQsXG4gICAgICAgIHNldDogZnVuY3Rpb24odGhpczogRWxlbWVudCwgdDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgICAgICAgY29uc3QgcnYgPSBpbm5lckhUTUwuc2V0LmNhbGwodGhpcywgdCk7XG4gICAgICAgICAgY29uc3QgY24gPSB0aGlzLmNoaWxkTm9kZXM7XG4gICAgICAgICAgaWYgKGdldFByb3h5U3RhdHVzKGNuKSA9PT0gUHJveHlTdGF0dXMuSVNfUFJPWFkpIHtcbiAgICAgICAgICAgIGNvbnN0IHN0YWNrcyA9IGdldFByb3h5U3RhY2tUcmFjZXMoY24pO1xuICAgICAgICAgICAgc3RhY2tzLmNsZWFyKCk7XG4gICAgICAgICAgICBfaW5pdGlhbGl6ZU1hcChjbiwgc3RhY2tzLCBfZ2V0U3RhY2tUcmFjZSgpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY24uJCQkUkVJTlNUUlVNRU5UJCQkKCk7XG4gICAgICAgICAgcmV0dXJuIHJ2O1xuICAgICAgICB9LFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6IHRydWVcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCBvdXRlckhUTUwgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKEVsZW1lbnQucHJvdG90eXBlLCAnb3V0ZXJIVE1MJyk7XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoRWxlbWVudC5wcm90b3R5cGUsICdvdXRlckhUTUwnLCB7XG4gICAgICAgIGdldDogb3V0ZXJIVE1MLmdldCxcbiAgICAgICAgc2V0OiBmdW5jdGlvbih0aGlzOiBFbGVtZW50LCB2OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICAgICAgICBjb25zdCBwYXJlbnQgPSB0aGlzLnBhcmVudE5vZGU7XG4gICAgICAgICAgaWYgKHBhcmVudCkge1xuICAgICAgICAgICAgY29uc3QgcGFyZW50Q24gPSBwYXJlbnQuY2hpbGROb2RlcztcbiAgICAgICAgICAgIGlmIChnZXRQcm94eVN0YXR1cyhwYXJlbnRDbikgPT09IFByb3h5U3RhdHVzLklTX1BST1hZKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGxlbiA9IHBhcmVudENuLmxlbmd0aDtcbiAgICAgICAgICAgICAgbGV0IGkgPSAwO1xuICAgICAgICAgICAgICBmb3IgKDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHBhcmVudENuW2ldID09PSB0aGlzKSB7XG4gICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKGkgPT09IGxlbikge1xuICAgICAgICAgICAgICAgIGxvZ1RvQ29uc29sZShgSW52YWxpZCBjYWxsIHRvIG91dGVySFRNTDogRGV0YWNoZWQgbm9kZT9gKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zdCBzdGFja3MgPSBnZXRQcm94eVN0YWNrVHJhY2VzKHBhcmVudENuKTtcbiAgICAgICAgICAgICAgICBfcmVtb3ZlU3RhY2tzKHN0YWNrcywgYCR7aX1gKTtcbiAgICAgICAgICAgICAgICBfYWRkU3RhY2tUcmFjZShzdGFja3MsIGAke2l9YCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgcnYgPSBvdXRlckhUTUwuc2V0LmNhbGwodGhpcywgdik7XG4gICAgICAgICAgaWYgKHBhcmVudCkge1xuICAgICAgICAgICAgcGFyZW50LmNoaWxkTm9kZXMuJCQkUkVJTlNUUlVNRU5UJCQkKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBydjtcbiAgICAgICAgfSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlXG4gICAgICB9KTtcblxuICAgICAgZnVuY3Rpb24gaW5zZXJ0QWRqYWNlbnRIZWxwZXIoZTogRWxlbWVudCwgcG9zaXRpb246IEluc2VydFBvc2l0aW9uKTogdm9pZCB7XG4gICAgICAgIHN3aXRjaCAocG9zaXRpb24pIHtcbiAgICAgICAgICBjYXNlICdiZWZvcmViZWdpbic6XG4gICAgICAgICAgY2FzZSAnYWZ0ZXJlbmQnOiB7XG4gICAgICAgICAgICBpZiAoZS5wYXJlbnROb2RlICYmIGdldFByb3h5U3RhdHVzKGUucGFyZW50Tm9kZS5jaGlsZE5vZGVzKSA9PT0gUHJveHlTdGF0dXMuSVNfUFJPWFkpIHtcbiAgICAgICAgICAgICAgY29uc3QgcGFyZW50ID0gZS5wYXJlbnROb2RlO1xuICAgICAgICAgICAgICBjb25zdCBzaWJsaW5ncyA9IHBhcmVudC5jaGlsZE5vZGVzO1xuICAgICAgICAgICAgICBjb25zdCBudW1TaWJsaW5ncyA9IHNpYmxpbmdzLmxlbmd0aDtcbiAgICAgICAgICAgICAgbGV0IGkgPSAwO1xuICAgICAgICAgICAgICBmb3IgKDsgaSA8IG51bVNpYmxpbmdzOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoJCQkU0VRJCQkKHNpYmxpbmdzW2ldLCBlKSkge1xuICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmIChpICE9PSBudW1TaWJsaW5ncykge1xuICAgICAgICAgICAgICAgIC8vIERvZXMgaXQgc2hpZnQgdGhpbmdzIGRvd24gYmVmb3JlIG9yIGFmdGVyIHRoaXMgZWxlbWVudD9cbiAgICAgICAgICAgICAgICBsZXQgc3RhcnQgPSBwb3NpdGlvbiA9PT0gJ2JlZm9yZWJlZ2luJyA/IGkgOiBpICsgMTtcbiAgICAgICAgICAgICAgICBjb25zdCBzdGFja3MgPSBnZXRQcm94eVN0YWNrVHJhY2VzKHNpYmxpbmdzKTtcbiAgICAgICAgICAgICAgICBmb3IgKGkgPSBudW1TaWJsaW5ncyAtIDE7IGkgPj0gc3RhcnQ7IGktLSkge1xuICAgICAgICAgICAgICAgICAgX2NvcHlTdGFja3Moc3RhY2tzLCBgJHtpfWAsIGAke2kgKyAxfWApXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF9yZW1vdmVTdGFja3Moc3RhY2tzLCBgJHtzdGFydH1gKTtcbiAgICAgICAgICAgICAgICBfYWRkU3RhY2tUcmFjZShzdGFja3MsIGAke3N0YXJ0fWApO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgICAgY2FzZSAnYWZ0ZXJiZWdpbic6XG4gICAgICAgICAgY2FzZSAnYmVmb3JlZW5kJzoge1xuICAgICAgICAgICAgY29uc3QgY24gPSBlLmNoaWxkTm9kZXM7XG4gICAgICAgICAgICBpZiAoZ2V0UHJveHlTdGF0dXMoY24pID09PSBQcm94eVN0YXR1cy5JU19QUk9YWSkge1xuICAgICAgICAgICAgICBjb25zdCBudW1DaGlsZHJlbiA9IGNuLmxlbmd0aDtcbiAgICAgICAgICAgICAgY29uc3Qgc3RhY2tzID0gZ2V0UHJveHlTdGFja1RyYWNlcyhjbik7XG4gICAgICAgICAgICAgIGlmIChwb3NpdGlvbiA9PT0gJ2FmdGVyYmVnaW4nKSB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IG51bUNoaWxkcmVuIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgICAgICAgIF9jb3B5U3RhY2tzKHN0YWNrcywgYCR7aX1gLCBgJHtpICsgMX1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgX3JlbW92ZVN0YWNrcyhzdGFja3MsIGAwYCk7XG4gICAgICAgICAgICAgICAgX2FkZFN0YWNrVHJhY2Uoc3RhY2tzLCBgMGApO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIF9hZGRTdGFja1RyYWNlKHN0YWNrcywgYCR7bnVtQ2hpbGRyZW59YCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBjb25zdCBpbnNlcnRBZGphY2VudEVsZW1lbnQgPSBFbGVtZW50LnByb3RvdHlwZS5pbnNlcnRBZGphY2VudEVsZW1lbnQ7XG4gICAgICBFbGVtZW50LnByb3RvdHlwZS5pbnNlcnRBZGphY2VudEVsZW1lbnQgPSBmdW5jdGlvbihwb3NpdGlvbjogSW5zZXJ0UG9zaXRpb24sIGluc2VydGVkRWxlbWVudDogRWxlbWVudCk6IEVsZW1lbnQge1xuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGluc2VydEFkamFjZW50RWxlbWVudCgpIG1ldGhvZCBpbnNlcnRzIGEgZ2l2ZW4gZWxlbWVudCBub2RlIGF0IGEgZ2l2ZW5cbiAgICAgICAgICogcG9zaXRpb24gcmVsYXRpdmUgdG8gdGhlIGVsZW1lbnQgaXQgaXMgaW52b2tlZCB1cG9uLlxuICAgICAgICAgKi9cbiAgICAgICAgaW5zZXJ0QWRqYWNlbnRIZWxwZXIodGhpcywgcG9zaXRpb24pO1xuXG4gICAgICAgIGNvbnN0IHJ2ID0gaW5zZXJ0QWRqYWNlbnRFbGVtZW50LmNhbGwodGhpcywgcG9zaXRpb24sIGluc2VydGVkRWxlbWVudCk7XG4gICAgICAgIGlmIChwb3NpdGlvbiA9PT0gJ2FmdGVyYmVnaW4nIHx8IHBvc2l0aW9uID09PSAnYmVmb3JlZW5kJykge1xuICAgICAgICAgIHRoaXMuY2hpbGROb2Rlcy4kJCRSRUlOU1RSVU1FTlQkJCQoKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLnBhcmVudE5vZGUpIHtcbiAgICAgICAgICB0aGlzLnBhcmVudE5vZGUuY2hpbGROb2Rlcy4kJCRSRUlOU1RSVU1FTlQkJCQoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcnY7XG4gICAgICB9O1xuXG4gICAgICBjb25zdCBpbnNlcnRBZGphY2VudEhUTUwgPSBFbGVtZW50LnByb3RvdHlwZS5pbnNlcnRBZGphY2VudEhUTUw7XG4gICAgICBFbGVtZW50LnByb3RvdHlwZS5pbnNlcnRBZGphY2VudEhUTUwgPSBmdW5jdGlvbih0aGlzOiBFbGVtZW50LCB3aGVyZTogSW5zZXJ0UG9zaXRpb24sIGh0bWw6IHN0cmluZyk6IHZvaWQge1xuICAgICAgICBpbnNlcnRBZGphY2VudEhlbHBlcih0aGlzLCB3aGVyZSk7XG4gICAgICAgIGNvbnN0IHJ2ID0gaW5zZXJ0QWRqYWNlbnRIVE1MLmNhbGwodGhpcywgd2hlcmUsIGh0bWwpO1xuICAgICAgICBpZiAod2hlcmUgPT09ICdhZnRlcmJlZ2luJyB8fCB3aGVyZSA9PT0gJ2JlZm9yZWVuZCcpIHtcbiAgICAgICAgICB0aGlzLmNoaWxkTm9kZXMuJCQkUkVJTlNUUlVNRU5UJCQkKCk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5wYXJlbnROb2RlKSB7XG4gICAgICAgICAgdGhpcy5wYXJlbnROb2RlLmNoaWxkTm9kZXMuJCQkUkVJTlNUUlVNRU5UJCQkKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJ2O1xuICAgICAgfTtcblxuICAgICAgY29uc3QgaW5zZXJ0QWRqYWNlbnRUZXh0ID0gRWxlbWVudC5wcm90b3R5cGUuaW5zZXJ0QWRqYWNlbnRUZXh0O1xuICAgICAgRWxlbWVudC5wcm90b3R5cGUuaW5zZXJ0QWRqYWNlbnRUZXh0ID0gZnVuY3Rpb24odGhpczogRWxlbWVudCwgd2hlcmU6IEluc2VydFBvc2l0aW9uLCB0ZXh0OiBzdHJpbmcpOiB2b2lkIHtcbiAgICAgICAgaW5zZXJ0QWRqYWNlbnRIZWxwZXIodGhpcywgd2hlcmUpO1xuICAgICAgICBjb25zdCBydiA9IGluc2VydEFkamFjZW50VGV4dC5jYWxsKHRoaXMsIHdoZXJlLCB0ZXh0KTtcbiAgICAgICAgaWYgKHdoZXJlID09PSAnYWZ0ZXJiZWdpbicgfHwgd2hlcmUgPT09ICdiZWZvcmVlbmQnKSB7XG4gICAgICAgICAgdGhpcy5jaGlsZE5vZGVzLiQkJFJFSU5TVFJVTUVOVCQkJCgpO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMucGFyZW50Tm9kZSkge1xuICAgICAgICAgIHRoaXMucGFyZW50Tm9kZS5jaGlsZE5vZGVzLiQkJFJFSU5TVFJVTUVOVCQkJCgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBydjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgcmVtb3ZlID0gRWxlbWVudC5wcm90b3R5cGUucmVtb3ZlO1xuICAgICAgRWxlbWVudC5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24odGhpczogRWxlbWVudCk6IHZvaWQge1xuICAgICAgICBjb25zdCBwYXJlbnQgPSB0aGlzLnBhcmVudE5vZGU7XG4gICAgICAgIGlmIChwYXJlbnQpIHtcbiAgICAgICAgICBwYXJlbnQucmVtb3ZlQ2hpbGQodGhpcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVtb3ZlLmNhbGwodGhpcyk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICAvLyBFbGVtZW50OlxuICAgICAgLy8gKipTUEVDSUFMKio6IGRhdGFzZXQgLSBtb2RpZmllcyBwcm9wZXJ0aWVzIG9uIERPTSBvYmplY3QgdGhyb3VnaCBvYmplY3QhISEhXG4gICAgICAvLyAtPiB0aHJvdyBleGNlcHRpb24gaWYgdXNlZC5cblxuICAgICAgLy8gU1ZHRWxlbWVudDpcbiAgICAgIC8vIGRhdGFzZXQ6IFRocm93IGV4Y2VwdGlvbiBpZiB1c2VkXG4gICAgfVxuXG5cblxuICAgIC8qKDxhbnk+IHJvb3QpWyckJFBSSU5UQ09VTlRTJCQnXSA9IGZ1bmN0aW9uKCk6IHZvaWQge1xuICAgICAgbG9nVG9Db25zb2xlKGBBUEksR2V0Q291bnQsSW52b2tlZENvdW50LFNldENvdW50YCk7XG4gICAgICBjb3VudE1hcC5mb3JFYWNoKCh2LCBrKSA9PiB7XG4gICAgICAgIGlmICh2LmdldCArIHYuc2V0ICsgdi5pbnZva2VkID4gMCkge1xuICAgICAgICAgIGxvZ1RvQ29uc29sZShgJHtrfSwke3YuZ2V0fSwke3YuaW52b2tlZH0sJHt2LnNldH1gKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfTsqL1xuXG4gICAgLy8gR29hbDpcbiAgICAvLyAtIEF0dGFjaCB1bmlxdWUgSURzIHRvIGFsbCBIVE1MIHRhZ3MgaW4gdGhlIERPTSBjb3JyZXNwb25kaW5nIHRvIHRoZWlyIGxvY2F0aW9uIHBvc3QtYm9keS1sb2FkLlxuICAgIC8vIC0gT24gdXBkYXRlOiBVcGRhdGUgSURzLlxuICAgIC8vIC0gSW5zZXJ0aW9uIHRvIHNjb3BlIG1vZGlmaWVzIGFsbCBJRHMgaW4gc2NvcGUuXG5cbiAgICAvLyBQb3NzaWJpbGl0aWVzOlxuICAgIC8vIC0gTm9kZSBpcyBvbmx5IGluIERPTS5cbiAgICAvLyAgIC0gSW5zdHJ1bWVudCBET00gbG9jYXRpb24uXG4gICAgLy8gLSBOb2RlIGlzIG9ubHkgaW4gaGVhcC5cbiAgICAvLyAgIC0gSW5zdHJ1bWVudCBub2RlIG9iamVjdC5cbiAgICAvLyAtIE5vZGUgaXMgaW4gYm90aC5cbiAgICAvLyAgIC0gSW5zdHJ1bWVudCBib3RoLlxuXG4gICAgLy8gUmVnYXJkbGVzczpcbiAgICAvLyAtIE5lZWQgdG8gKnVud3JhcCogYXJndW1lbnRzXG4gICAgLy8gLSBOZWVkIHRvICp3cmFwKiByZXR1cm4gdmFsdWVzXG5cbiAgICAvLyBOb2RlOlxuICAgIC8vIG5vZGVWYWx1ZTogTm90IGltcG9ydGFudD9cbiAgICAvLyB0ZXh0Q29udGVudDogUGFzcyBpdCBhIHN0cmluZy4gUmVwbGFjZXMgY29udGVudC5cbiAgICAvLyBhcHBlbmRDaGlsZDogUGFzc2VkIGEgTm9kZS4gTW9kaWZpZXMgRE9NLlxuICAgIC8vIGluc2VydEJlZm9yZTogVGFrZXMgTm9kZXMuIE1vZGlmaWVzIERPTS5cbiAgICAvLyBpc0VxdWFsTm9kZTogVGFrZXMgYSBOb2RlLlxuICAgIC8vIGlzU2FtZU5vZGU6IFRha2VzIGEgTm9kZS5cbiAgICAvLyBub3JtYWxpemU6IFJlbW92ZXMgdGhpbmdzIGZyb20gRE9NLlxuICAgIC8vIHJlbW92ZUNoaWxkOiBSZW1vdmVzIGEgY2hpbGQuXG4gICAgLy8gcmVwbGFjZUNoaWxkOiBSZXBsYWNlcyBhIGNoaWxkLlxuXG4gICAgLy8gRWxlbWVudDpcbiAgICAvLyBpbm5lckhUTUxcbiAgICAvLyBvdXRlckhUTUxcbiAgICAvLyBpbnNlcnRBZGphY2VudEVsZW1lbnRcbiAgICAvLyBpbnNlcnRBZGphY2VudEhUTUxcbiAgICAvLyBpbnNlcnRBZGphY2VudFRleHRcbiAgICAvLyByZW1vdmVcbiAgICAvLyAqKlNQRUNJQUwqKjogZGF0YXNldCAtIG1vZGlmaWVzIHByb3BlcnRpZXMgb24gRE9NIG9iamVjdCB0aHJvdWdoIG9iamVjdCEhISFcbiAgICAvLyAtPiB0aHJvdyBleGNlcHRpb24gaWYgdXNlZC5cblxuICAgIC8vIFNWR0VsZW1lbnQ6XG4gICAgLy8gZGF0YXNldDogVGhyb3cgZXhjZXB0aW9uIGlmIHVzZWRcblxuICAgIC8vIE9uIHByb3BlcnRpZXM6XG4gICAgLy8gLSBEb2N1bWVudC5wcm90b3R5cGVcbiAgICAvLyAtIEVsZW1lbnQucHJvdG90eXBlXG4gICAgLy8gLSBNZWRpYVF1ZXJ5TGlzdC5wcm90b3R5cGVcbiAgICAvLyAtIEZpbGVSZWFkZXIucHJvdG90eXBlXG4gICAgLy8gLSBIVE1MQm9keUVsZW1lbnRcbiAgICAvLyAtIEhUTUxFbGVtZW50XG4gICAgLy8gLSBIVE1MRnJhbWVTZXRFbGVtZW50XG4gICAgLy8gLSBBdWRpb1RyYWNrTGlzdD8gVGV4dFRyYWNrPyBUZXh0VHJhY2tDdWU/IFRleHRUcmFja0xpc3Q/IFZpZGVvVHJhY2tMaXN0P1xuICAgIC8vIC0gQXBwbGljYXRpb25DYWNoZVxuICAgIC8vIC0gRXZlbnRTb3VyY2VcbiAgICAvLyAtIFNWR0FuaW1hdGlvbkVsZW1lbnRcbiAgICAvLyAtIFNWR0VsZW1lbnRcbiAgICAvLyAtIFBlcmZvcm1hbmNlP1xuICAgIC8vIC0gV29ya2VyP1xuICAgIC8vIC0gWE1MSHR0cFJlcXVlc3RcbiAgICAvLyAtIFhNTEh0dHBSZXF1ZXN0RXZlbnRUYXJnZXRcbiAgICAvLyAtIFdlYlNvY2tldFxuICAgIC8vIC0gSURCRGF0YWJhc2VcbiAgICAvLyAtIElEQk9wZW5EQlJlcXVlc3RcbiAgICAvLyAtIElEQlJlcXVlc3RcbiAgICAvLyAtIElEQlRyYW5zYWN0aW9uXG4gICAgLy8gLSB3aW5kb3cuW3Byb3BlcnR5XSAoU3BlY2lhbClcblxuXG4gIH1cbn0pKCk7Il19