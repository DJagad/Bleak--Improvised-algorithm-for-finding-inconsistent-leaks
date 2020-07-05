import * as tslib_1 from "tslib";
import { OneBitArray, TwoBitArray } from '../common/util';
import LeakRoot from './leak_root';
/**
 * Represents a link in a heap path. Specified as a simple class to make it quick to construct and JSONable.
 * TODO: Better terminology?
 */
var PathSegment = /** @class */ (function () {
    function PathSegment(type, indexOrName) {
        this.type = type;
        this.indexOrName = indexOrName;
    }
    return PathSegment;
}());
/**
 * Converts an edge into a heap path segment.
 * @param edge
 */
function edgeToIPathSegment(edge) {
    var pst = edge.pathSegmentType;
    var name = pst === 3 /* CLOSURE */ ? "__scope__" : edge.indexOrName;
    return new PathSegment(edge.pathSegmentType, name);
}
/**
 * Converts a sequence of edges from the heap graph into an IPath object.
 * @param edges
 */
function edgePathToPath(edges) {
    return edges.filter(isNotHidden).map(edgeToIPathSegment);
}
/**
 * Returns true if the given edge type is visible from JavaScript.
 * @param edge
 */
function isNotHidden(edge) {
    switch (edge.snapshotType) {
        case 3 /* Internal */:
            // Keep around closure edges so we can convert them to __scope__.
            return edge.indexOrName === "context";
        case 4 /* Hidden */:
        case 5 /* Shortcut */:
            return false;
        default:
            return true;
    }
}
/**
 * Extracts a tree of growing heap paths from a series of leak roots and
 * paths to said roots.
 *
 * Called before sending the leak roots to the BLeak agent for instrumentation.
 */
export function toPathTree(leakroots) {
    var tree = [];
    function addPath(p, id, index, children) {
        if (index === void 0) { index = 0; }
        if (children === void 0) { children = tree; }
        if (p.length === 0) {
            return;
        }
        var pathSegment = p[index];
        var indexOrName = pathSegment.indexOrName;
        var matches = children.filter(function (c) { return c.indexOrName === indexOrName; });
        var recur;
        if (matches.length > 0) {
            recur = matches[0];
        }
        else {
            // Add to children list.
            recur = Object.assign({
                isGrowing: false,
                children: []
            }, pathSegment);
            children.push(recur);
        }
        var next = index + 1;
        if (next === p.length) {
            recur.isGrowing = true;
            recur.id = id;
        }
        else {
            addPath(p, id, next, recur.children);
        }
    }
    leakroots.forEach(function (lr) {
        lr.paths.forEach(function (p) {
            addPath(p, lr.id);
        });
    });
    return tree;
}
function shouldTraverse(edge, wantDom) {
    // HACK: Ignore <symbol> properties. There may be multiple properties
    // with the name <symbol> in a heap snapshot. There does not appear to
    // be an easy way to disambiguate them.
    if (edge.indexOrName === "<symbol>") {
        return false;
    }
    if (edge.snapshotType === 3 /* Internal */) {
        // Whitelist of internal edges we know how to follow.
        switch (edge.indexOrName) {
            case "elements":
            case "table":
            case "properties":
            case "context":
                return true;
            default:
                return wantDom && edge.to.name.startsWith("Document DOM");
        }
    }
    else if (edge.to.type === 9 /* Synthetic */) {
        return edge.to.name === "(Document DOM trees)";
    }
    return true;
}
/**
 * Returns a hash representing a particular edge as a child of the given parent.
 * @param parent
 * @param edge
 */
function hash(parent, edge) {
    if (parent.type === 9 /* Synthetic */) {
        return edge.to.name;
    }
    else {
        return edge.indexOrName;
    }
}
/**
 * PropagateGrowth (Figure 4 in the paper).
 * Migrates a node's growth between heap snapshots. BLeak considers a path in the heap to be growing
 * if the node at the path exhibits sustained growth (in terms of number of outgoing edges) between heap
 * snapshots.
 * @param oldG The old heap graph.
 * @param oldGrowth Growth bits for the nodes in the old heap graph.
 * @param newG The new heap graph.
 * @param newGrowth Growth bits for the nodes in the new heap graph.
 */
function propagateGrowth(oldG, oldGrowth, newG, newGrowth) {
    var numNewNodes = newG.nodeCount;
    var index = 0;
    // We visit each new node at most once, forming an upper bound on the queue length.
    // Pre-allocate for better performance.
    var queue = new Uint32Array(numNewNodes << 1);
    // Stores the length of queue.
    var queueLength = 0;
    // Only store visit bits for the new graph.
    var visitBits = new OneBitArray(numNewNodes);
    // Enqueues the given node pairing (represented by their indices in their respective graphs)
    // into the queue. oldNodeIndex and newNodeIndex represent a node at the same edge shared between
    // the graphs.
    function enqueue(oldNodeIndex, newNodeIndex) {
        queue[queueLength++] = oldNodeIndex;
        queue[queueLength++] = newNodeIndex;
    }
    // Returns a single item from the queue. (Called twice to remove a pair.)
    function dequeue() {
        return queue[index++];
    }
    // 0 indicates the root node. Start at the root.
    var oldNode = new Node(0, oldG);
    var newNode = new Node(0, newG);
    var oldEdgeTmp = new Edge(0, oldG);
    {
        // Visit global roots by *node name*, not *edge name* as edges are arbitrarily numbered from the root node.
        // These global roots correspond to different JavaScript contexts (e.g. IFrames).
        var newUserRoots = newG.getGlobalRootIndices();
        var oldUserRoots = oldG.getGlobalRootIndices();
        var m = new Map();
        for (var i = 0; i < newUserRoots.length; i++) {
            newNode.nodeIndex = newUserRoots[i];
            var name_1 = newNode.name;
            var a = m.get(name_1);
            if (!a) {
                a = { o: [], n: [] };
                m.set(name_1, a);
            }
            a.n.push(newUserRoots[i]);
        }
        for (var i = 0; i < oldUserRoots.length; i++) {
            oldNode.nodeIndex = oldUserRoots[i];
            var name_2 = oldNode.name;
            var a = m.get(name_2);
            if (a) {
                a.o.push(oldUserRoots[i]);
            }
        }
        m.forEach(function (v) {
            var num = Math.min(v.o.length, v.n.length);
            for (var i = 0; i < num; i++) {
                enqueue(v.o[i], v.n[i]);
                visitBits.set(v.n[i], true);
            }
        });
    }
    // The main loop, which is the essence of PropagateGrowth.
    while (index < queueLength) {
        var oldIndex = dequeue();
        var newIndex = dequeue();
        oldNode.nodeIndex = oldIndex;
        newNode.nodeIndex = newIndex;
        var oldNodeGrowthStatus = oldGrowth.get(oldIndex);
        // Nodes are either 'New', 'Growing', or 'Not Growing'.
        // Nodes begin as 'New', and transition to 'Growing' or 'Not Growing' after a snapshot.
        // So if a node is neither new nor consistently growing, we don't care about it.
        if ((oldNodeGrowthStatus === 0 /* NEW */ || oldNodeGrowthStatus === 2 /* GROWING */) && oldNode.numProperties() < newNode.numProperties()) {
            newGrowth.set(newIndex, 2 /* GROWING */);
        }
        // Visit shared children.
        var oldEdges = new Map();
        if (oldNode.hasChildren) {
            for (var it_1 = oldNode.children; it_1.hasNext(); it_1.next()) {
                var oldChildEdge = it_1.item();
                oldEdges.set(hash(oldNode, oldChildEdge), oldChildEdge.edgeIndex);
            }
        }
        //Now this loop will take care for the memory leaks in which the object count is not increasing but the Retained Size will be increase certainly
        if ((oldNodeGrowthStatus === 1 /* NOT_GROWING */) && oldNode.numProperties() == newNode.numProperties()) {
            if (oldNode.getRetainedSize() < newNode.getRetainedSize()) {
                newGrowth.set(newIndex, 2 /* GROWING */);
            }
        }
        if (newNode.hasChildren) {
            for (var it_2 = newNode.children; it_2.hasNext(); it_2.next()) {
                var newChildEdge = it_2.item();
                var oldEdge = oldEdges.get(hash(newNode, newChildEdge));
                oldEdgeTmp.edgeIndex = oldEdge;
                if (oldEdge !== undefined && !visitBits.get(newChildEdge.toIndex) &&
                    shouldTraverse(oldEdgeTmp, false) && shouldTraverse(newChildEdge, false)) {
                    visitBits.set(newChildEdge.toIndex, true);
                    enqueue(oldEdgeTmp.toIndex, newChildEdge.toIndex);
                }
            }
        }
    }
}
/**
 * Tracks growth in the heap.
 */
var HeapGrowthTracker = /** @class */ (function () {
    function HeapGrowthTracker() {
        this._stringMap = new StringMap();
        this._heap = null;
        this._growthStatus = null;
        // DEBUG INFO; this information is shown in a heap explorer tool.
        this._leakRefs = null;
        this._nonLeakVisits = null;
    }
    HeapGrowthTracker.prototype.addSnapshot = function (parser) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var heap, growthStatus;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, HeapGraph.Construct(parser, this._stringMap)];
                    case 1:
                        heap = _a.sent();
                        growthStatus = new TwoBitArray(heap.nodeCount);
                        if (this._heap !== null) {
                            // Initialize all new nodes to 'NOT_GROWING'.
                            // We only want to consider stable heap paths present from the first snapshot.
                            growthStatus.fill(1 /* NOT_GROWING */);
                            // Merge graphs.
                            propagateGrowth(this._heap, this._growthStatus, heap, growthStatus);
                        }
                        // Keep new graph.
                        this._heap = heap;
                        this._growthStatus = growthStatus;
                        return [2 /*return*/];
                }
            });
        });
    };
    HeapGrowthTracker.prototype.getGraph = function () {
        return this._heap;
    };
    /**
     * Implements FindLeakPaths (Figure 5 in the paper) and CalculateLeakShare (Figure 6 in the paper),
     * as well as calculations for Retained Size and Transitive Closure Size (which we compare against in the paper).
     *
     * Returns paths through the heap to leaking nodes, along with multiple different types of scores to help
     * developers prioritize them, grouped by the leak root responsible.
     */
    HeapGrowthTracker.prototype.findLeakPaths = function () {
        var _this = this;
        // A map from growing nodes to heap paths that reference them.
        var growthPaths = new Map();
        // Adds a given path to growthPaths.
        function addPath(e) {
            var to = e[e.length - 1].toIndex;
            var paths = growthPaths.get(to);
            if (paths === undefined) {
                paths = [];
                growthPaths.set(to, paths);
            }
            paths.push(e);
        }
        // Filter out DOM nodes and hidden edges that represent internal V8 / Chrome state.
        function filterNoDom(n, e) {
            return isNotHidden(e) && nonWeakFilter(n, e) && shouldTraverse(e, false);
        }
        // Filter out hidden edges that represent internal V8 / Chrome state, but keep DOM nodes.
        function filterIncludeDom(n, e) {
            return nonWeakFilter(n, e) && shouldTraverse(e, true);
        }
        // Get the growing paths. Ignore paths through the DOM, as we mirror those in JavaScript.
        // (See Section 5.3.2 in the paper, "Exposing Hidden State")
        this._heap.visitGlobalEdges(function (e, getPath) {
            if (_this._growthStatus.get(e.toIndex) === 2 /* GROWING */) {
                addPath(getPath());
            }
        }, filterNoDom);
        // Now, calculate growth metrics!
        // Mark items that are reachable by non-leaks.
        var nonleakVisitBits = new OneBitArray(this._heap.nodeCount);
        this._heap.visitUserRoots(function (n) {
            nonleakVisitBits.set(n.nodeIndex, true);
        }, function (n, e) {
            // Filter out edges to growing objects.
            // Traverse the DOM this time.
            return filterIncludeDom(n, e) && !growthPaths.has(e.toIndex);
        });
        // Filter out items that are reachable from non-leaks.
        function nonLeakFilter(n, e) {
            return filterIncludeDom(n, e) && !nonleakVisitBits.get(e.toIndex);
        }
        // Increment visit counter for each heap item reachable from a leak.
        // Used by LeakShare.
        var leakReferences = new Uint16Array(this._heap.nodeCount);
        growthPaths.forEach(function (paths, growthNodeIndex) {
            bfsVisitor(_this._heap, [growthNodeIndex], function (n) {
                leakReferences[n.nodeIndex]++;
            }, nonLeakFilter);
        });
        // Calculate final growth metrics (LeakShare, Retained Size, Transitive Closure Size)
        // for each LeakPath, and construct LeakRoot objects representing each LeakRoot.
        var rv = new Array();
        growthPaths.forEach(function (paths, growthNodeIndex) {
            var retainedSize = 0;
            var leakShare = 0;
            var transitiveClosureSize = 0;
            var ownedObjects = 0;
            bfsVisitor(_this._heap, [growthNodeIndex], function (n) {
                var refCount = leakReferences[n.nodeIndex];
                if (refCount === 1) {
                    // A refCount of 1 means the heap item is uniquely referenced by this leak,
                    // so it contributes to retainedSize.
                    retainedSize += n.size;
                    ownedObjects++;
                }
                leakShare += n.size / refCount;
            }, nonLeakFilter);
            // Transitive closure size, for comparison to related work.
            bfsVisitor(_this._heap, [growthNodeIndex], function (n) {
                transitiveClosureSize += n.size;
            }, filterIncludeDom);
            rv.push(new LeakRoot(growthNodeIndex, paths.map(edgePathToPath), {
                retainedSize: retainedSize,
                leakShare: leakShare,
                transitiveClosureSize: transitiveClosureSize,
                ownedObjects: ownedObjects
            }));
        });
        // DEBUG
        this._leakRefs = leakReferences;
        this._nonLeakVisits = nonleakVisitBits;
        return rv;
    };
    HeapGrowthTracker.prototype.isGrowing = function (nodeIndex) {
        return this._growthStatus.get(nodeIndex) === 2 /* GROWING */;
    };
    return HeapGrowthTracker;
}());
export { HeapGrowthTracker };
/**
 * Map from ID => string.
 */
var StringMap = /** @class */ (function () {
    function StringMap() {
        this._map = new Map();
        this._strings = new Array();
    }
    StringMap.prototype.get = function (s) {
        var map = this._map;
        var id = map.get(s);
        if (id === undefined) {
            id = this._strings.push(s) - 1;
            map.set(s, id);
        }
        return id;
    };
    StringMap.prototype.fromId = function (i) {
        return this._strings[i];
    };
    return StringMap;
}());
/**
 * Edge mirror
 */
var Edge = /** @class */ (function () {
    function Edge(i, heap) {
        this.edgeIndex = i;
        this._heap = heap;
    }
    Object.defineProperty(Edge.prototype, "to", {
        get: function () {
            return new Node(this._heap.edgeToNodes[this.edgeIndex], this._heap);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Edge.prototype, "size", {
        get: function () {
            var k = new Node(this._heap.edgeToNodes[this.edgeIndex], this._heap);
            return (k.size);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Edge.prototype, "toIndex", {
        get: function () {
            return this._heap.edgeToNodes[this.edgeIndex];
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Edge.prototype, "snapshotType", {
        get: function () {
            return this._heap.edgeTypes[this.edgeIndex];
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Edge.prototype, "indexOrName", {
        /**
         * Returns the index (number) or name (string) that this edge
         * corresponds to. (Index types occur in Arrays.)
         */
        get: function () {
            var nameOrIndex = this._heap.edgeNamesOrIndexes[this.edgeIndex];
            if (this._isIndex()) {
                return nameOrIndex;
            }
            else {
                return this._heap.stringMap.fromId(nameOrIndex);
            }
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Returns 'true' if the edge corresponds to a type where nameOrIndex is an index,
     * and false otherwise.
     */
    Edge.prototype._isIndex = function () {
        switch (this.snapshotType) {
            case 1 /* Element */: // Array element.
            case 4 /* Hidden */:// Hidden from developer, but influences in-memory size. Apparently has an index, not a name. Ignore for now.
                return true;
            case 0 /* ContextVariable */: // Closure variable.
            case 3 /* Internal */: // Internal data structures that are not actionable to developers. Influence retained size. Ignore for now.
            case 5 /* Shortcut */: // Shortcut: Should be ignored; an internal detail.
            case 6 /* Weak */: // Weak reference: Doesn't hold onto memory.
            case 2 /* Property */:// Property on an object.
                return false;
            default:
                throw new Error("Unrecognized edge type: " + this.snapshotType);
        }
    };
    Object.defineProperty(Edge.prototype, "pathSegmentType", {
        /**
         * Determines what type of edge this is in a heap path.
         * Recognizes some special BLeak-inserted heap edges that correspond
         * to hidden browser state.
         */
        get: function () {
            switch (this.snapshotType) {
                case 1 /* Element */:
                    return 2 /* ELEMENT */;
                case 0 /* ContextVariable */:
                    return 4 /* CLOSURE_VARIABLE */;
                case 3 /* Internal */:
                    if (this.indexOrName === 'context') {
                        return 3 /* CLOSURE */;
                    }
                    break;
                case 2 /* Property */: {
                    // We assume that no one uses our chosen special property names.
                    // If the program happens to have a memory leak stemming from a non-BLeak-created
                    // property with one of these names, then BLeak might not find it.
                    var name_3 = this.indexOrName;
                    switch (name_3) {
                        case '$$$DOM$$$':
                            return 6 /* DOM_TREE */;
                        case '$$listeners':
                            return 5 /* EVENT_LISTENER_LIST */;
                        default:
                            return 1 /* PROPERTY */;
                    }
                }
            }
            console.debug("Unrecognized edge type: " + this.snapshotType);
            return 7 /* UNKNOWN */;
        },
        enumerable: true,
        configurable: true
    });
    return Edge;
}());
export { Edge };
var EdgeIterator = /** @class */ (function () {
    function EdgeIterator(heap, edgeStart, edgeEnd) {
        this._edge = new Edge(edgeStart, heap);
        this._edgeEnd = edgeEnd;
    }
    EdgeIterator.prototype.hasNext = function () {
        return this._edge.edgeIndex < this._edgeEnd;
    };
    EdgeIterator.prototype.next = function () {
        this._edge.edgeIndex++;
    };
    EdgeIterator.prototype.item = function () {
        return this._edge;
    };
    return EdgeIterator;
}());
/**
 * Node mirror.
 */
var Node = /** @class */ (function () {
    function Node(i, heap) {
        this.nodeIndex = i;
        this._heap = heap;
    }
    Object.defineProperty(Node.prototype, "type", {
        get: function () {
            return this._heap.nodeTypes[this.nodeIndex];
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "size", {
        get: function () {
            return this._heap.nodeSizes[this.nodeIndex];
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "hasChildren", {
        get: function () {
            return this.childrenLength !== 0;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "name", {
        get: function () {
            return this._heap.stringMap.fromId(this._heap.nodeNames[this.nodeIndex]);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "childrenLength", {
        get: function () {
            var fei = this._heap.firstEdgeIndexes;
            return fei[this.nodeIndex + 1] - fei[this.nodeIndex];
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "children", {
        get: function () {
            var fei = this._heap.firstEdgeIndexes;
            return new EdgeIterator(this._heap, fei[this.nodeIndex], fei[this.nodeIndex + 1]);
        },
        enumerable: true,
        configurable: true
    });
    Node.prototype.getChild = function (i) {
        var fei = this._heap.firstEdgeIndexes;
        var index = fei[this.nodeIndex] + i;
        if (index >= fei[this.nodeIndex + 1]) {
            throw new Error("Invalid child.");
        }
        return new Edge(index, this._heap);
    };
    Node.prototype.getRetainedSize = function () {
        //Now we know the size of the node now taking the sizes for the childs so fot that we will be using the above code
        var siz = this._heap.nodeSizes[this.nodeIndex];
        //Getting the first Edges for the Nodes
        var fei = this._heap.firstEdgeIndexes;
        //Now Finding the number of edges for the given node
        var fei_1 = fei[this.nodeIndex + 1] - fei[this.nodeIndex];
        //Initialization of f_size
        var f_size = 0;
        //Calling loop for calculating Nodes
        for (var i = 1; i <= fei_1; i++) {
            //Now index will be called to store the Edge Index
            var index = fei[this.nodeIndex] + i;
            //This will make edge for const ind
            var ind = new Edge(index, this._heap);
            //Now we will create the edges to node and find their size
            var num = ind.size;
            //Now seeing the edge mirror converting the edges 
            f_size = siz + num;
        }
        return (f_size);
    };
    /**
     * Measures the number of properties on the node.
     * May require traversing hidden children.
     * This is the growth metric we use.
     */
    Node.prototype.numProperties = function () {
        var count = 0;
        if (this.hasChildren) {
            for (var it_3 = this.children; it_3.hasNext(); it_3.next()) {
                var child = it_3.item();
                switch (child.snapshotType) {
                    case 3 /* Internal */:
                        switch (child.indexOrName) {
                            case "elements": {
                                // Contains numerical properties, including those of
                                // arrays and objects.
                                var elements = child.to;
                                // Only count if no children.
                                if (!elements.hasChildren) {
                                    count += Math.floor(elements.size / 8);
                                }
                                break;
                            }
                            case "table": {
                                // Contains Map and Set object entries.
                                var table = child.to;
                                if (table.hasChildren) {
                                    count += table.childrenLength;
                                }
                                break;
                            }
                            case "properties": {
                                // Contains expando properties on DOM nodes,
                                // properties storing numbers on objects,
                                // etc.
                                var props = child.to;
                                if (props.hasChildren) {
                                    count += props.childrenLength;
                                }
                                break;
                            }
                        }
                        break;
                    case 4 /* Hidden */:
                    case 5 /* Shortcut */:
                    case 6 /* Weak */:
                        break;
                    default:
                        count++;
                        break;
                }
            }
        }
        return count;
    };
    return Node;
}());
/**
 * Represents a heap snapshot / heap graph.
 */
var HeapGraph = /** @class */ (function () {
    function HeapGraph(stringMap, nodeTypes, nodeNames, nodeSizes, firstEdgeIndexes, edgeTypes, edgeNamesOrIndexes, edgeToNodes, rootNodeIndex) {
        // Lazily initialized retained size array.
        this.retainedSize = null;
        this.stringMap = stringMap;
        this.nodeTypes = nodeTypes;
        this.nodeNames = nodeNames;
        this.nodeSizes = nodeSizes;
        this.firstEdgeIndexes = firstEdgeIndexes;
        this.edgeTypes = edgeTypes;
        this.edgeNamesOrIndexes = edgeNamesOrIndexes;
        this.edgeToNodes = edgeToNodes;
        this.rootNodeIndex = rootNodeIndex;
    }
    HeapGraph.Construct = function (parser, stringMap) {
        if (stringMap === void 0) { stringMap = new StringMap(); }
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var firstChunk, snapshotInfo, meta, nodeFields, nodeLength, rootNodeIndex, nodeCount, edgeCount, nodeTypes, nodeNames, nodeSizes, firstEdgeIndexes, edgeTypes, edgeNamesOrIndexes, edgeToNodes, nodeTypeOffset, nodeNameOffset, nodeSelfSizeOffset, nodeEdgeCountOffset, edgeFields, edgeLength, edgeTypeOffset, edgeNameOrIndexOffset, edgeToNodeOffset, strings, nodePtr, edgePtr, nextEdge, chunk, data, dataLen, dataNodeCount, i, dataBase, arrayBase, data, dataLen, dataEdgeCount, i, dataBase, arrayBase, i, edgeType, i;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, parser.read()];
                    case 1:
                        firstChunk = _a.sent();
                        if (firstChunk.type !== 1 /* SNAPSHOT */) {
                            throw new Error("First chunk does not contain snapshot property.");
                        }
                        snapshotInfo = firstChunk.data;
                        meta = snapshotInfo.meta;
                        nodeFields = meta.node_fields;
                        nodeLength = nodeFields.length;
                        rootNodeIndex = (snapshotInfo.root_index ? snapshotInfo.root_index / nodeLength : 0);
                        nodeCount = snapshotInfo.node_count;
                        edgeCount = snapshotInfo.edge_count;
                        nodeTypes = new Uint8Array(nodeCount);
                        nodeNames = new Uint32Array(nodeCount);
                        nodeSizes = new Uint32Array(nodeCount);
                        firstEdgeIndexes = new Uint32Array(nodeCount + 1);
                        edgeTypes = new Uint8Array(edgeCount);
                        edgeNamesOrIndexes = new Uint32Array(edgeCount);
                        edgeToNodes = new Uint32Array(edgeCount);
                        nodeTypeOffset = nodeFields.indexOf("type");
                        nodeNameOffset = nodeFields.indexOf("name");
                        nodeSelfSizeOffset = nodeFields.indexOf("self_size");
                        nodeEdgeCountOffset = nodeFields.indexOf("edge_count");
                        edgeFields = meta.edge_fields;
                        edgeLength = edgeFields.length;
                        edgeTypeOffset = edgeFields.indexOf("type");
                        edgeNameOrIndexOffset = edgeFields.indexOf("name_or_index");
                        edgeToNodeOffset = edgeFields.indexOf("to_node");
                        strings = [];
                        nodePtr = 0;
                        edgePtr = 0;
                        nextEdge = 0;
                        _a.label = 2;
                    case 2:
                        if (!true) return [3 /*break*/, 4];
                        return [4 /*yield*/, parser.read()];
                    case 3:
                        chunk = _a.sent();
                        if (chunk === null) {
                            return [3 /*break*/, 4];
                        }
                        switch (chunk.type) {
                            case 2 /* NODES */: {
                                data = chunk.data;
                                dataLen = data.length;
                                dataNodeCount = dataLen / nodeLength;
                                if (dataLen % nodeLength !== 0) {
                                    throw new Error("Expected chunk to contain whole nodes. Instead, contained " + dataNodeCount + " nodes.");
                                }
                                // Copy data into our typed arrays.
                                for (i = 0; i < dataNodeCount; i++) {
                                    dataBase = i * nodeLength;
                                    arrayBase = nodePtr + i;
                                    nodeTypes[arrayBase] = data[dataBase + nodeTypeOffset];
                                    nodeNames[arrayBase] = data[dataBase + nodeNameOffset];
                                    nodeSizes[arrayBase] = data[dataBase + nodeSelfSizeOffset];
                                    firstEdgeIndexes[arrayBase] = nextEdge;
                                    nextEdge += data[dataBase + nodeEdgeCountOffset];
                                }
                                nodePtr += dataNodeCount;
                                break;
                            }
                            case 3 /* EDGES */: {
                                data = chunk.data;
                                dataLen = data.length;
                                dataEdgeCount = dataLen / edgeLength;
                                if (dataLen % edgeLength !== 0) {
                                    throw new Error("Expected chunk to contain whole nodes. Instead, contained " + dataEdgeCount + " nodes.");
                                }
                                // Copy data into our typed arrays.
                                for (i = 0; i < dataEdgeCount; i++) {
                                    dataBase = i * edgeLength;
                                    arrayBase = edgePtr + i;
                                    edgeTypes[arrayBase] = data[dataBase + edgeTypeOffset];
                                    edgeNamesOrIndexes[arrayBase] = data[dataBase + edgeNameOrIndexOffset];
                                    edgeToNodes[arrayBase] = data[dataBase + edgeToNodeOffset] / nodeLength;
                                }
                                edgePtr += dataEdgeCount;
                                break;
                            }
                            case 4 /* STRINGS */: {
                                strings = strings.concat(chunk.data);
                                break;
                            }
                            default:
                                throw new Error("Unexpected snapshot chunk: " + chunk.type + ".");
                        }
                        return [3 /*break*/, 2];
                    case 4:
                        // Process edgeNameOrIndex now.
                        for (i = 0; i < edgeCount; i++) {
                            edgeType = edgeTypes[i];
                            switch (edgeType) {
                                case 1 /* Element */: // Array element.
                                case 4 /* Hidden */:// Hidden from developer, but influences in-memory size. Apparently has an index, not a name. Ignore for now.
                                    break;
                                case 0 /* ContextVariable */: // Function context. I think it has a name, like "context".
                                case 3 /* Internal */: // Internal data structures that are not actionable to developers. Influence retained size. Ignore for now.
                                case 5 /* Shortcut */: // Shortcut: Should be ignored; an internal detail.
                                case 6 /* Weak */: // Weak reference: Doesn't hold onto memory.
                                case 2 /* Property */:// Property on an object.
                                    edgeNamesOrIndexes[i] = stringMap.get(strings[edgeNamesOrIndexes[i]]);
                                    break;
                                default:
                                    throw new Error("Unrecognized edge type: " + edgeType);
                            }
                        }
                        firstEdgeIndexes[nodeCount] = edgeCount;
                        // Process nodeNames now.
                        for (i = 0; i < nodeCount; i++) {
                            nodeNames[i] = stringMap.get(strings[nodeNames[i]]);
                        }
                        return [2 /*return*/, new HeapGraph(stringMap, nodeTypes, nodeNames, nodeSizes, firstEdgeIndexes, edgeTypes, edgeNamesOrIndexes, edgeToNodes, rootNodeIndex)];
                }
            });
        });
    };
    Object.defineProperty(HeapGraph.prototype, "nodeCount", {
        get: function () {
            return this.nodeTypes.length;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(HeapGraph.prototype, "edgeCount", {
        get: function () {
            return this.edgeTypes.length;
        },
        enumerable: true,
        configurable: true
    });
    HeapGraph.prototype.getGlobalRootIndices = function () {
        var rv = new Array();
        var root = this.getRoot();
        for (var it_4 = root.children; it_4.hasNext(); it_4.next()) {
            var subroot = it_4.item().to;
            if (subroot.type !== 9 /* Synthetic */) {
                rv.push(subroot.nodeIndex);
            }
        }
        return rv;
    };
    HeapGraph.prototype.getUserRootIndices = function () {
        var rv = new Array();
        var root = this.getRoot();
        for (var it_5 = root.children; it_5.hasNext(); it_5.next()) {
            var subroot = it_5.item().to;
            if (subroot.type !== 9 /* Synthetic */ || subroot.name === "(Document DOM trees)") {
                rv.push(subroot.nodeIndex);
            }
        }
        return rv;
    };
    HeapGraph.prototype.getRoot = function () {
        return new Node(this.rootNodeIndex, this);
    };
    HeapGraph.prototype.calculateSize = function () {
        var rv = {
            numNodes: this.nodeCount,
            numEdges: this.edgeCount,
            totalSize: 0,
            hiddenSize: 0,
            arraySize: 0,
            stringSize: 0,
            objectSize: 0,
            codeSize: 0,
            closureSize: 0,
            regexpSize: 0,
            heapNumberSize: 0,
            nativeSize: 0,
            syntheticSize: 0,
            consStringSize: 0,
            slicedStringSize: 0,
            symbolSize: 0,
            unknownSize: 0
        };
        this.visitUserRoots(function (n) {
            var nodeType = n.type;
            var nodeSelfSize = n.size;
            rv.totalSize += n.size;
            switch (nodeType) {
                case 1 /* Array */:
                    rv.arraySize += nodeSelfSize;
                    break;
                case 5 /* Closure */:
                    rv.closureSize += nodeSelfSize;
                    break;
                case 4 /* Code */:
                    rv.codeSize += nodeSelfSize;
                    break;
                case 10 /* ConsString */:
                    rv.consStringSize += nodeSelfSize;
                    break;
                case 7 /* HeapNumber */:
                    rv.heapNumberSize += nodeSelfSize;
                    break;
                case 0 /* Hidden */:
                    rv.hiddenSize += nodeSelfSize;
                    break;
                case 8 /* Native */:
                    rv.nativeSize += nodeSelfSize;
                    break;
                case 3 /* Object */:
                    rv.objectSize += nodeSelfSize;
                    break;
                case 6 /* RegExp */:
                    rv.regexpSize += nodeSelfSize;
                    break;
                case 11 /* SlicedString */:
                    rv.slicedStringSize += nodeSelfSize;
                    break;
                case 2 /* String */:
                    rv.stringSize += nodeSelfSize;
                    break;
                case 12 /* Symbol */:
                    rv.symbolSize += nodeSelfSize;
                    break;
                case 9 /* Synthetic */:
                    rv.syntheticSize += nodeSelfSize;
                    break;
                case 15 /* Unresolved */:
                default:
                    rv.unknownSize += nodeSelfSize;
                    break;
            }
        });
        return rv;
    };
    HeapGraph.prototype.visitRoot = function (visitor, filter) {
        if (filter === void 0) { filter = nonWeakFilter; }
        bfsVisitor(this, [this.rootNodeIndex], visitor, filter);
    };
    HeapGraph.prototype.visitUserRoots = function (visitor, filter) {
        if (filter === void 0) { filter = nonWeakFilter; }
        bfsVisitor(this, this.getUserRootIndices(), visitor, filter);
    };
    HeapGraph.prototype.visitGlobalRoots = function (visitor, filter) {
        if (filter === void 0) { filter = nonWeakFilter; }
        bfsVisitor(this, this.getGlobalRootIndices(), visitor, filter);
    };
    HeapGraph.prototype.visitGlobalEdges = function (visitor, filter) {
        if (filter === void 0) { filter = nonWeakFilter; }
        var initial = new Array();
        var root = this.getRoot();
        for (var it_6 = root.children; it_6.hasNext(); it_6.next()) {
            var edge = it_6.item();
            var subroot = edge.to;
            if (subroot.type !== 9 /* Synthetic */) {
                initial.push(edge.edgeIndex);
            }
        }
        bfsEdgeVisitor(this, initial, visitor, filter);
    };
    return HeapGraph;
}());
export { HeapGraph };
function nonWeakFilter(n, e) {
    return e.snapshotType !== 6 /* Weak */;
}
function nopFilter(n, e) {
    return true;
}
/**
 * Visit edges / paths in the graph in a breadth-first-search.
 * @param g The heap graph to visit.
 * @param initial Initial edge indices to visit.
 * @param visitor Visitor function. Called on every unique edge visited.
 * @param filter Filter function. Called on every edge. If false, visitor does not visit edge.
 */
function bfsEdgeVisitor(g, initial, visitor, filter) {
    if (filter === void 0) { filter = nopFilter; }
    var visitBits = new OneBitArray(g.edgeCount);
    // Every edge is a pair: [previousEdge, edgeIndex].
    // Can follow linked list to reconstruct path.
    // Index 0 is "root".
    var edgesToVisit = new Uint32Array((g.edgeCount + 1) << 1);
    // Leave first entry blank as a catch-all root.
    var edgesToVisitLength = 2;
    var index = 2;
    function enqueue(prevIndex, edgeIndex) {
        edgesToVisit[edgesToVisitLength++] = prevIndex;
        edgesToVisit[edgesToVisitLength++] = edgeIndex;
    }
    function dequeue() {
        // Ignore the prev edge link.
        index++;
        return edgesToVisit[index++];
    }
    initial.forEach(function (i) {
        enqueue(0, i);
        visitBits.set(i, true);
    });
    function indexToEdge(index) {
        return new Edge(index, g);
    }
    var currentEntryIndex = index;
    function getPath() {
        var pIndex = currentEntryIndex;
        var path = new Array();
        while (pIndex !== 0) {
            path.push(edgesToVisit[pIndex + 1]);
            pIndex = edgesToVisit[pIndex];
        }
        return path.reverse().map(indexToEdge);
    }
    var node = new Node(0, g);
    var edge = new Edge(0, g);
    while (index < edgesToVisitLength) {
        currentEntryIndex = index;
        edge.edgeIndex = dequeue();
        visitor(edge, getPath);
        node.nodeIndex = edge.toIndex;
        for (var it_7 = node.children; it_7.hasNext(); it_7.next()) {
            var child = it_7.item();
            if (!visitBits.get(child.edgeIndex) && filter(node, child)) {
                visitBits.set(child.edgeIndex, true);
                enqueue(currentEntryIndex, child.edgeIndex);
            }
        }
    }
}
/**
 * Visit the graph in a breadth-first-search.
 * @param g The heap graph to visit.
 * @param initial Initial node(s) to visit.
 * @param visitor Visitor function. Called on every unique node visited.
 * @param filter Filter function. Called on every edge. If false, visitor does not visit edge.
 */
function bfsVisitor(g, initial, visitor, filter) {
    if (filter === void 0) { filter = nopFilter; }
    var visitBits = new OneBitArray(g.nodeCount);
    var nodesToVisit = new Uint32Array(g.nodeCount);
    var nodesToVisitLength = 0;
    function enqueue(nodeIndex) {
        nodesToVisit[nodesToVisitLength++] = nodeIndex;
    }
    var index = 0;
    initial.map(enqueue);
    initial.forEach(function (i) { return visitBits.set(i, true); });
    var node = new Node(0, g);
    var edge = new Edge(0, g);
    while (index < nodesToVisitLength) {
        var nodeIndex = nodesToVisit[index++];
        node.nodeIndex = nodeIndex;
        visitor(node);
        var firstEdgeIndex = g.firstEdgeIndexes[nodeIndex];
        var edgesEnd = g.firstEdgeIndexes[nodeIndex + 1];
        for (var edgeIndex = firstEdgeIndex; edgeIndex < edgesEnd; edgeIndex++) {
            var childNodeIndex = g.edgeToNodes[edgeIndex];
            edge.edgeIndex = edgeIndex;
            if (!visitBits.get(childNodeIndex) && filter(node, edge)) {
                visitBits.set(childNodeIndex, true);
                enqueue(childNodeIndex);
            }
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3Jvd3RoX2dyYXBoLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2xpYi9ncm93dGhfZ3JhcGgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUVBLE9BQU8sRUFBQyxXQUFXLEVBQUUsV0FBVyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDeEQsT0FBTyxRQUFRLE1BQU0sYUFBYSxDQUFDO0FBRW5DOzs7R0FHRztBQUNIO0lBQ0UscUJBQTRCLElBQXFCLEVBQy9CLFdBQTRCO1FBRGxCLFNBQUksR0FBSixJQUFJLENBQWlCO1FBQy9CLGdCQUFXLEdBQVgsV0FBVyxDQUFpQjtJQUFHLENBQUM7SUFDcEQsa0JBQUM7QUFBRCxDQUFDLEFBSEQsSUFHQztBQUVEOzs7R0FHRztBQUNILDRCQUE0QixJQUFVO0lBQ3BDLElBQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUM7SUFDakMsSUFBTSxJQUFJLEdBQUcsR0FBRyxvQkFBNEIsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDO0lBQzlFLE1BQU0sQ0FBQyxJQUFJLFdBQVcsQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ3JELENBQUM7QUFFRDs7O0dBR0c7QUFDSCx3QkFBd0IsS0FBYTtJQUNuQyxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxHQUFHLENBQUMsa0JBQWtCLENBQUMsQ0FBQztBQUMzRCxDQUFDO0FBRUQ7OztHQUdHO0FBQ0gscUJBQXFCLElBQVU7SUFDN0IsTUFBTSxDQUFBLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7UUFDekI7WUFDRSxpRUFBaUU7WUFDakUsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLEtBQUssU0FBUyxDQUFDO1FBQ3hDLG9CQUE2QjtRQUM3QjtZQUNFLE1BQU0sQ0FBQyxLQUFLLENBQUM7UUFD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QUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztRQUMzQixPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDZCxJQUFNLGNBQWMsR0FBRyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDckQsSUFBTSxRQUFRLEdBQUcsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUNuRCxHQUFHLENBQUMsQ0FBQyxJQUFJLFNBQVMsR0FBRyxjQUFjLEVBQUUsU0FBUyxHQUFHLFFBQVEsRUFBRSxTQUFTLEVBQUUsRUFBRSxDQUFDO1lBQ3ZFLElBQU0sY0FBYyxHQUFHLENBQUMsQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDaEQsSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7WUFDM0IsRUFBRSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN6RCxTQUFTLENBQUMsR0FBRyxDQUFDLGNBQWMsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDcEMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQzFCLENBQUM7UUFDSCxDQUFDO0lBQ0gsQ0FBQztBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1NuYXBzaG90RWRnZVR5cGUsIFNuYXBzaG90Tm9kZVR5cGUsIFNuYXBzaG90U2l6ZVN1bW1hcnksIElMZWFrUm9vdCwgSVBhdGgsIEdyb3d0aFN0YXR1c30gZnJvbSAnLi4vY29tbW9uL2ludGVyZmFjZXMnO1xuaW1wb3J0IHtkZWZhdWx0IGFzIEhlYXBTbmFwc2hvdFBhcnNlciwgRGF0YVR5cGVzfSBmcm9tICcuL2hlYXBfc25hcHNob3RfcGFyc2VyJztcbmltcG9ydCB7T25lQml0QXJyYXksIFR3b0JpdEFycmF5fSBmcm9tICcuLi9jb21tb24vdXRpbCc7XG5pbXBvcnQgTGVha1Jvb3QgZnJvbSAnLi9sZWFrX3Jvb3QnO1xuXG4vKipcbiAqIFJlcHJlc2VudHMgYSBsaW5rIGluIGEgaGVhcCBwYXRoLiBTcGVjaWZpZWQgYXMgYSBzaW1wbGUgY2xhc3MgdG8gbWFrZSBpdCBxdWljayB0byBjb25zdHJ1Y3QgYW5kIEpTT05hYmxlLlxuICogVE9ETzogQmV0dGVyIHRlcm1pbm9sb2d5P1xuICovXG5jbGFzcyBQYXRoU2VnbWVudCBpbXBsZW1lbnRzIElQYXRoU2VnbWVudCB7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyByZWFkb25seSB0eXBlOiBQYXRoU2VnbWVudFR5cGUsXG4gICAgcHVibGljIHJlYWRvbmx5IGluZGV4T3JOYW1lOiBzdHJpbmcgfCBudW1iZXIpIHt9XG59XG5cbi8qKlxuICogQ29udmVydHMgYW4gZWRnZSBpbnRvIGEgaGVhcCBwYXRoIHNlZ21lbnQuXG4gKiBAcGFyYW0gZWRnZVxuICovXG5mdW5jdGlvbiBlZGdlVG9JUGF0aFNlZ21lbnQoZWRnZTogRWRnZSk6IElQYXRoU2VnbWVudCB7XG4gIGNvbnN0IHBzdCA9IGVkZ2UucGF0aFNlZ21lbnRUeXBlO1xuICBjb25zdCBuYW1lID0gcHN0ID09PSBQYXRoU2VnbWVudFR5cGUuQ0xPU1VSRSA/IFwiX19zY29wZV9fXCIgOiBlZGdlLmluZGV4T3JOYW1lO1xuICByZXR1cm4gbmV3IFBhdGhTZWdtZW50KGVkZ2UucGF0aFNlZ21lbnRUeXBlLCBuYW1lKTtcbn1cblxuLyoqXG4gKiBDb252ZXJ0cyBhIHNlcXVlbmNlIG9mIGVkZ2VzIGZyb20gdGhlIGhlYXAgZ3JhcGggaW50byBhbiBJUGF0aCBvYmplY3QuXG4gKiBAcGFyYW0gZWRnZXNcbiAqL1xuZnVuY3Rpb24gZWRnZVBhdGhUb1BhdGgoZWRnZXM6IEVkZ2VbXSk6IElQYXRoIHtcbiAgcmV0dXJuIGVkZ2VzLmZpbHRlcihpc05vdEhpZGRlbikubWFwKGVkZ2VUb0lQYXRoU2VnbWVudCk7XG59XG5cbi8qKlxuICogUmV0dXJucyB0cnVlIGlmIHRoZSBnaXZlbiBlZGdlIHR5cGUgaXMgdmlzaWJsZSBmcm9tIEphdmFTY3JpcHQuXG4gKiBAcGFyYW0gZWRnZVxuICovXG5mdW5jdGlvbiBpc05vdEhpZGRlbihlZGdlOiBFZGdlKTogYm9vbGVhbiB7XG4gIHN3aXRjaChlZGdlLnNuYXBzaG90VHlwZSkge1xuICAgIGNhc2UgU25hcHNob3RFZGdlVHlwZS5JbnRlcm5hbDpcbiAgICAgIC8vIEtlZXAgYXJvdW5kIGNsb3N1cmUgZWRnZXMgc28gd2UgY2FuIGNvbnZlcnQgdGhlbSB0byBfX3Njb3BlX18uXG4gICAgICByZXR1cm4gZWRnZS5pbmRleE9yTmFtZSA9PT0gXCJjb250ZXh0XCI7XG4gICAgY2FzZSBTbmFwc2hvdEVkZ2VUeXBlLkhpZGRlbjpcbiAgICBjYXNlIFNuYXBzaG90RWRnZVR5cGUuU2hvcnRjdXQ6XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiB0cnVlO1xuICB9XG59XG5cbi8qKlxuICogRXh0cmFjdHMgYSB0cmVlIG9mIGdyb3dpbmcgaGVhcCBwYXRocyBmcm9tIGEgc2VyaWVzIG9mIGxlYWsgcm9vdHMgYW5kXG4gKiBwYXRocyB0byBzYWlkIHJvb3RzLlxuICpcbiAqIENhbGxlZCBiZWZvcmUgc2VuZGluZyB0aGUgbGVhayByb290cyB0byB0aGUgQkxlYWsgYWdlbnQgZm9yIGluc3RydW1lbnRhdGlvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRvUGF0aFRyZWUobGVha3Jvb3RzOiBJTGVha1Jvb3RbXSk6IElQYXRoVHJlZXMge1xuICBjb25zdCB0cmVlOiBJUGF0aFRyZWVzID0gW107XG5cbiAgZnVuY3Rpb24gYWRkUGF0aChwOiBJUGF0aCwgaWQ6IG51bWJlciwgaW5kZXggPSAwLCBjaGlsZHJlbiA9IHRyZWUpOiB2b2lkIHtcbiAgICBpZiAocC5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgcGF0aFNlZ21lbnQgPSBwW2luZGV4XTtcbiAgICBjb25zdCBpbmRleE9yTmFtZSA9IHBhdGhTZWdtZW50LmluZGV4T3JOYW1lO1xuICAgIGNvbnN0IG1hdGNoZXMgPSBjaGlsZHJlbi5maWx0ZXIoKGMpID0+IGMuaW5kZXhPck5hbWUgPT09IGluZGV4T3JOYW1lKTtcbiAgICBsZXQgcmVjdXI6IElQYXRoVHJlZTtcbiAgICBpZiAobWF0Y2hlcy5sZW5ndGggPiAwKSB7XG4gICAgICByZWN1ciA9IG1hdGNoZXNbMF07XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEFkZCB0byBjaGlsZHJlbiBsaXN0LlxuICAgICAgcmVjdXIgPSA8SVBhdGhUcmVlTm90R3Jvd2luZz4gT2JqZWN0LmFzc2lnbih7XG4gICAgICAgIGlzR3Jvd2luZzogZmFsc2UsXG4gICAgICAgIGNoaWxkcmVuOiBbXVxuICAgICAgfSwgcGF0aFNlZ21lbnQpO1xuICAgICAgY2hpbGRyZW4ucHVzaChyZWN1cik7XG4gICAgfVxuICAgIGNvbnN0IG5leHQgPSBpbmRleCArIDE7XG4gICAgaWYgKG5leHQgPT09IHAubGVuZ3RoKSB7XG4gICAgICAocmVjdXIgYXMgSVBhdGhUcmVlR3Jvd2luZykuaXNHcm93aW5nID0gdHJ1ZTtcbiAgICAgIChyZWN1ciBhcyBJUGF0aFRyZWVHcm93aW5nKS5pZCA9IGlkO1xuICAgIH0gZWxzZSB7XG4gICAgICBhZGRQYXRoKHAsIGlkLCBuZXh0LCByZWN1ci5jaGlsZHJlbik7XG4gICAgfVxuICB9XG5cbiAgbGVha3Jvb3RzLmZvckVhY2goKGxyKSA9PiB7XG4gICAgbHIucGF0aHMuZm9yRWFjaCgocCkgPT4ge1xuICAgICAgYWRkUGF0aChwLCBsci5pZCk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIHJldHVybiB0cmVlO1xufVxuXG4vLyBFZGdlIGJyYW5kXG50eXBlIEVkZ2VJbmRleCA9IG51bWJlciAmIHsgX19fRWRnZUluZGV4OiB0cnVlIH07XG4vLyBOb2RlIGJyYW5kXG50eXBlIE5vZGVJbmRleCA9IG51bWJlciAmIHsgX19fTm9kZUluZGV4OiB0cnVlIH07XG5cbmZ1bmN0aW9uIHNob3VsZFRyYXZlcnNlKGVkZ2U6IEVkZ2UsIHdhbnREb206IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgLy8gSEFDSzogSWdub3JlIDxzeW1ib2w+IHByb3BlcnRpZXMuIFRoZXJlIG1heSBiZSBtdWx0aXBsZSBwcm9wZXJ0aWVzXG4gIC8vIHdpdGggdGhlIG5hbWUgPHN5bWJvbD4gaW4gYSBoZWFwIHNuYXBzaG90LiBUaGVyZSBkb2VzIG5vdCBhcHBlYXIgdG9cbiAgLy8gYmUgYW4gZWFzeSB3YXkgdG8gZGlzYW1iaWd1YXRlIHRoZW0uXG4gIGlmIChlZGdlLmluZGV4T3JOYW1lID09PSBcIjxzeW1ib2w+XCIpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKGVkZ2Uuc25hcHNob3RUeXBlID09PSBTbmFwc2hvdEVkZ2VUeXBlLkludGVybmFsKSB7XG4gICAgLy8gV2hpdGVsaXN0IG9mIGludGVybmFsIGVkZ2VzIHdlIGtub3cgaG93IHRvIGZvbGxvdy5cbiAgICBzd2l0Y2ggKGVkZ2UuaW5kZXhPck5hbWUpIHtcbiAgICAgIGNhc2UgXCJlbGVtZW50c1wiOlxuICAgICAgY2FzZSBcInRhYmxlXCI6XG4gICAgICBjYXNlIFwicHJvcGVydGllc1wiOlxuICAgICAgY2FzZSBcImNvbnRleHRcIjpcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gd2FudERvbSAmJiBlZGdlLnRvLm5hbWUuc3RhcnRzV2l0aChcIkRvY3VtZW50IERPTVwiKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoZWRnZS50by50eXBlID09PSBTbmFwc2hvdE5vZGVUeXBlLlN5bnRoZXRpYykge1xuICAgIHJldHVybiBlZGdlLnRvLm5hbWUgPT09IFwiKERvY3VtZW50IERPTSB0cmVlcylcIjtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgaGFzaCByZXByZXNlbnRpbmcgYSBwYXJ0aWN1bGFyIGVkZ2UgYXMgYSBjaGlsZCBvZiB0aGUgZ2l2ZW4gcGFyZW50LlxuICogQHBhcmFtIHBhcmVudFxuICogQHBhcmFtIGVkZ2VcbiAqL1xuZnVuY3Rpb24gaGFzaChwYXJlbnQ6IE5vZGUsIGVkZ2U6IEVkZ2UpOiBzdHJpbmcgfCBudW1iZXIge1xuICBpZiAocGFyZW50LnR5cGUgPT09IFNuYXBzaG90Tm9kZVR5cGUuU3ludGhldGljKSB7XG4gICAgcmV0dXJuIGVkZ2UudG8ubmFtZTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZWRnZS5pbmRleE9yTmFtZTtcbiAgfVxufVxuXG4vKipcbiAqIFByb3BhZ2F0ZUdyb3d0aCAoRmlndXJlIDQgaW4gdGhlIHBhcGVyKS5cbiAqIE1pZ3JhdGVzIGEgbm9kZSdzIGdyb3d0aCBiZXR3ZWVuIGhlYXAgc25hcHNob3RzLiBCTGVhayBjb25zaWRlcnMgYSBwYXRoIGluIHRoZSBoZWFwIHRvIGJlIGdyb3dpbmdcbiAqIGlmIHRoZSBub2RlIGF0IHRoZSBwYXRoIGV4aGliaXRzIHN1c3RhaW5lZCBncm93dGggKGluIHRlcm1zIG9mIG51bWJlciBvZiBvdXRnb2luZyBlZGdlcykgYmV0d2VlbiBoZWFwXG4gKiBzbmFwc2hvdHMuXG4gKiBAcGFyYW0gb2xkRyBUaGUgb2xkIGhlYXAgZ3JhcGguXG4gKiBAcGFyYW0gb2xkR3Jvd3RoIEdyb3d0aCBiaXRzIGZvciB0aGUgbm9kZXMgaW4gdGhlIG9sZCBoZWFwIGdyYXBoLlxuICogQHBhcmFtIG5ld0cgVGhlIG5ldyBoZWFwIGdyYXBoLlxuICogQHBhcmFtIG5ld0dyb3d0aCBHcm93dGggYml0cyBmb3IgdGhlIG5vZGVzIGluIHRoZSBuZXcgaGVhcCBncmFwaC5cbiAqL1xuZnVuY3Rpb24gcHJvcGFnYXRlR3Jvd3RoKG9sZEc6IEhlYXBHcmFwaCwgb2xkR3Jvd3RoOiBUd29CaXRBcnJheSwgbmV3RzogSGVhcEdyYXBoLCBuZXdHcm93dGg6IFR3b0JpdEFycmF5KTogdm9pZCB7XG4gIGNvbnN0IG51bU5ld05vZGVzID0gbmV3Ry5ub2RlQ291bnQ7XG4gIGxldCBpbmRleCA9IDA7XG4gIC8vIFdlIHZpc2l0IGVhY2ggbmV3IG5vZGUgYXQgbW9zdCBvbmNlLCBmb3JtaW5nIGFuIHVwcGVyIGJvdW5kIG9uIHRoZSBxdWV1ZSBsZW5ndGguXG4gIC8vIFByZS1hbGxvY2F0ZSBmb3IgYmV0dGVyIHBlcmZvcm1hbmNlLlxuICBsZXQgcXVldWUgPSBuZXcgVWludDMyQXJyYXkobnVtTmV3Tm9kZXMgPDwgMSk7XG4gIC8vIFN0b3JlcyB0aGUgbGVuZ3RoIG9mIHF1ZXVlLlxuICBsZXQgcXVldWVMZW5ndGggPSAwO1xuICAvLyBPbmx5IHN0b3JlIHZpc2l0IGJpdHMgZm9yIHRoZSBuZXcgZ3JhcGguXG4gIGNvbnN0IHZpc2l0Qml0cyA9IG5ldyBPbmVCaXRBcnJheShudW1OZXdOb2Rlcyk7XG5cbiAgLy8gRW5xdWV1ZXMgdGhlIGdpdmVuIG5vZGUgcGFpcmluZyAocmVwcmVzZW50ZWQgYnkgdGhlaXIgaW5kaWNlcyBpbiB0aGVpciByZXNwZWN0aXZlIGdyYXBocylcbiAgLy8gaW50byB0aGUgcXVldWUuIG9sZE5vZGVJbmRleCBhbmQgbmV3Tm9kZUluZGV4IHJlcHJlc2VudCBhIG5vZGUgYXQgdGhlIHNhbWUgZWRnZSBzaGFyZWQgYmV0d2VlblxuICAvLyB0aGUgZ3JhcGhzLlxuICBmdW5jdGlvbiBlbnF1ZXVlKG9sZE5vZGVJbmRleDogTm9kZUluZGV4LCBuZXdOb2RlSW5kZXg6IE5vZGVJbmRleCk6IHZvaWQge1xuICAgIHF1ZXVlW3F1ZXVlTGVuZ3RoKytdID0gb2xkTm9kZUluZGV4O1xuICAgIHF1ZXVlW3F1ZXVlTGVuZ3RoKytdID0gbmV3Tm9kZUluZGV4O1xuICB9XG5cbiAgLy8gUmV0dXJucyBhIHNpbmdsZSBpdGVtIGZyb20gdGhlIHF1ZXVlLiAoQ2FsbGVkIHR3aWNlIHRvIHJlbW92ZSBhIHBhaXIuKVxuICBmdW5jdGlvbiBkZXF1ZXVlKCk6IE5vZGVJbmRleCB7XG4gICAgcmV0dXJuIHF1ZXVlW2luZGV4KytdIGFzIE5vZGVJbmRleDtcbiAgfVxuXG4gIC8vIDAgaW5kaWNhdGVzIHRoZSByb290IG5vZGUuIFN0YXJ0IGF0IHRoZSByb290LlxuICBjb25zdCBvbGROb2RlID0gbmV3IE5vZGUoMCBhcyBOb2RlSW5kZXgsIG9sZEcpO1xuICBjb25zdCBuZXdOb2RlID0gbmV3IE5vZGUoMCBhcyBOb2RlSW5kZXgsIG5ld0cpO1xuICBjb25zdCBvbGRFZGdlVG1wID0gbmV3IEVkZ2UoMCBhcyBFZGdlSW5kZXgsIG9sZEcpO1xuXG4gIHtcbiAgICAvLyBWaXNpdCBnbG9iYWwgcm9vdHMgYnkgKm5vZGUgbmFtZSosIG5vdCAqZWRnZSBuYW1lKiBhcyBlZGdlcyBhcmUgYXJiaXRyYXJpbHkgbnVtYmVyZWQgZnJvbSB0aGUgcm9vdCBub2RlLlxuICAgIC8vIFRoZXNlIGdsb2JhbCByb290cyBjb3JyZXNwb25kIHRvIGRpZmZlcmVudCBKYXZhU2NyaXB0IGNvbnRleHRzIChlLmcuIElGcmFtZXMpLlxuICAgIGNvbnN0IG5ld1VzZXJSb290cyA9IG5ld0cuZ2V0R2xvYmFsUm9vdEluZGljZXMoKTtcbiAgICBjb25zdCBvbGRVc2VyUm9vdHMgPSBvbGRHLmdldEdsb2JhbFJvb3RJbmRpY2VzKCk7XG4gICAgY29uc3QgbSA9IG5ldyBNYXA8c3RyaW5nLCB7bzogbnVtYmVyW10sIG46IG51bWJlcltdfT4oKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5ld1VzZXJSb290cy5sZW5ndGg7IGkrKykge1xuICAgICAgbmV3Tm9kZS5ub2RlSW5kZXggPSA8YW55PiBuZXdVc2VyUm9vdHNbaV07XG4gICAgICBjb25zdCBuYW1lID0gbmV3Tm9kZS5uYW1lO1xuICAgICAgbGV0IGEgPSBtLmdldChuYW1lKTtcbiAgICAgIGlmICghYSkge1xuICAgICAgICBhID0ge286IFtdLCBuOiBbXX07XG4gICAgICAgIG0uc2V0KG5hbWUsIGEpO1xuICAgICAgfVxuICAgICAgYS5uLnB1c2gobmV3VXNlclJvb3RzW2ldKTtcbiAgICB9XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBvbGRVc2VyUm9vdHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIG9sZE5vZGUubm9kZUluZGV4ID0gPGFueT4gb2xkVXNlclJvb3RzW2ldO1xuICAgICAgY29uc3QgbmFtZSA9IG9sZE5vZGUubmFtZTtcbiAgICAgIGxldCBhID0gbS5nZXQobmFtZSk7XG4gICAgICBpZiAoYSkge1xuICAgICAgICBhLm8ucHVzaChvbGRVc2VyUm9vdHNbaV0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIG0uZm9yRWFjaCgodikgPT4ge1xuICAgICAgbGV0IG51bSA9IE1hdGgubWluKHYuby5sZW5ndGgsIHYubi5sZW5ndGgpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW07IGkrKykge1xuICAgICAgICBlbnF1ZXVlKDxhbnk+IHYub1tpXSwgPGFueT4gdi5uW2ldKTtcbiAgICAgICAgdmlzaXRCaXRzLnNldCh2Lm5baV0sIHRydWUpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLy8gVGhlIG1haW4gbG9vcCwgd2hpY2ggaXMgdGhlIGVzc2VuY2Ugb2YgUHJvcGFnYXRlR3Jvd3RoLlxuICB3aGlsZSAoaW5kZXggPCBxdWV1ZUxlbmd0aCkge1xuICAgIGNvbnN0IG9sZEluZGV4ID0gZGVxdWV1ZSgpO1xuICAgIGNvbnN0IG5ld0luZGV4ID0gZGVxdWV1ZSgpO1xuICAgIG9sZE5vZGUubm9kZUluZGV4ID0gb2xkSW5kZXg7XG4gICAgbmV3Tm9kZS5ub2RlSW5kZXggPSBuZXdJbmRleDtcblxuICAgIGNvbnN0IG9sZE5vZGVHcm93dGhTdGF0dXM6IEdyb3d0aFN0YXR1cyA9IG9sZEdyb3d0aC5nZXQob2xkSW5kZXgpO1xuXG4gICAgLy8gTm9kZXMgYXJlIGVpdGhlciAnTmV3JywgJ0dyb3dpbmcnLCBvciAnTm90IEdyb3dpbmcnLlxuICAgIC8vIE5vZGVzIGJlZ2luIGFzICdOZXcnLCBhbmQgdHJhbnNpdGlvbiB0byAnR3Jvd2luZycgb3IgJ05vdCBHcm93aW5nJyBhZnRlciBhIHNuYXBzaG90LlxuICAgIC8vIFNvIGlmIGEgbm9kZSBpcyBuZWl0aGVyIG5ldyBub3IgY29uc2lzdGVudGx5IGdyb3dpbmcsIHdlIGRvbid0IGNhcmUgYWJvdXQgaXQuXG4gICAgaWYgKChvbGROb2RlR3Jvd3RoU3RhdHVzID09PSBHcm93dGhTdGF0dXMuTkVXIHx8IG9sZE5vZGVHcm93dGhTdGF0dXMgPT09IEdyb3d0aFN0YXR1cy5HUk9XSU5HKSAmJiBvbGROb2RlLm51bVByb3BlcnRpZXMoKSA8IG5ld05vZGUubnVtUHJvcGVydGllcygpKSB7XG4gICAgICBuZXdHcm93dGguc2V0KG5ld0luZGV4LCBHcm93dGhTdGF0dXMuR1JPV0lORyk7XG4gICAgfVxuXG4gICAgLy8gVmlzaXQgc2hhcmVkIGNoaWxkcmVuLlxuICAgIGNvbnN0IG9sZEVkZ2VzID0gbmV3IE1hcDxzdHJpbmcgfCBudW1iZXIsIEVkZ2VJbmRleD4oKTtcbiAgICBpZiAob2xkTm9kZS5oYXNDaGlsZHJlbikge1xuICAgICAgZm9yIChjb25zdCBpdCA9IG9sZE5vZGUuY2hpbGRyZW47IGl0Lmhhc05leHQoKTsgaXQubmV4dCgpKSB7XG4gICAgICAgIGNvbnN0IG9sZENoaWxkRWRnZSA9IGl0Lml0ZW0oKTtcbiAgICAgICAgb2xkRWRnZXMuc2V0KGhhc2gob2xkTm9kZSwgb2xkQ2hpbGRFZGdlKSwgb2xkQ2hpbGRFZGdlLmVkZ2VJbmRleCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy9Ob3cgdGhpcyBsb29wIHdpbGwgdGFrZSBjYXJlIGZvciB0aGUgbWVtb3J5IGxlYWtzIGluIHdoaWNoIHRoZSBvYmplY3QgY291bnQgaXMgbm90IGluY3JlYXNpbmcgYnV0IHRoZSBSZXRhaW5lZCBTaXplIHdpbGwgYmUgaW5jcmVhc2UgY2VydGFpbmx5XG4gICAgaWYgKChvbGROb2RlR3Jvd3RoU3RhdHVzID09PSBHcm93dGhTdGF0dXMuTk9UX0dST1dJTkcpICYmIG9sZE5vZGUubnVtUHJvcGVydGllcygpID09IG5ld05vZGUubnVtUHJvcGVydGllcygpKXtcbiAgICAgIGlmKG9sZE5vZGUuZ2V0UmV0YWluZWRTaXplKCkgPCBuZXdOb2RlLmdldFJldGFpbmVkU2l6ZSgpKXtcbiAgICAgICAgbmV3R3Jvd3RoLnNldChuZXdJbmRleCwgR3Jvd3RoU3RhdHVzLkdST1dJTkcpO1xuICAgIFx0fVxuICAgIH1cdFxuXG4gICAgaWYgKG5ld05vZGUuaGFzQ2hpbGRyZW4pIHtcbiAgICAgIGZvciAoY29uc3QgaXQgPSBuZXdOb2RlLmNoaWxkcmVuOyBpdC5oYXNOZXh0KCk7IGl0Lm5leHQoKSkge1xuICAgICAgICBjb25zdCBuZXdDaGlsZEVkZ2UgPSBpdC5pdGVtKCk7XG4gICAgICAgIGNvbnN0IG9sZEVkZ2UgPSBvbGRFZGdlcy5nZXQoaGFzaChuZXdOb2RlLCBuZXdDaGlsZEVkZ2UpKTtcbiAgICAgICAgb2xkRWRnZVRtcC5lZGdlSW5kZXggPSBvbGRFZGdlO1xuICAgICAgICBpZiAob2xkRWRnZSAhPT0gdW5kZWZpbmVkICYmICF2aXNpdEJpdHMuZ2V0KG5ld0NoaWxkRWRnZS50b0luZGV4KSAmJlxuICAgICAgICAgICAgc2hvdWxkVHJhdmVyc2Uob2xkRWRnZVRtcCwgZmFsc2UpICYmIHNob3VsZFRyYXZlcnNlKG5ld0NoaWxkRWRnZSwgZmFsc2UpKSB7XG4gICAgICAgICAgdmlzaXRCaXRzLnNldChuZXdDaGlsZEVkZ2UudG9JbmRleCwgdHJ1ZSk7XG4gICAgICAgICAgZW5xdWV1ZShvbGRFZGdlVG1wLnRvSW5kZXgsIG5ld0NoaWxkRWRnZS50b0luZGV4KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFRyYWNrcyBncm93dGggaW4gdGhlIGhlYXAuXG4gKi9cbmV4cG9ydCBjbGFzcyBIZWFwR3Jvd3RoVHJhY2tlciB7XG4gIHByaXZhdGUgX3N0cmluZ01hcDogU3RyaW5nTWFwID0gbmV3IFN0cmluZ01hcCgpO1xuICBwcml2YXRlIF9oZWFwOiBIZWFwR3JhcGggPSBudWxsO1xuICBwcml2YXRlIF9ncm93dGhTdGF0dXM6IFR3b0JpdEFycmF5ID0gbnVsbDtcbiAgLy8gREVCVUcgSU5GTzsgdGhpcyBpbmZvcm1hdGlvbiBpcyBzaG93biBpbiBhIGhlYXAgZXhwbG9yZXIgdG9vbC5cbiAgcHVibGljIF9sZWFrUmVmczogVWludDE2QXJyYXkgPSBudWxsO1xuICBwdWJsaWMgX25vbkxlYWtWaXNpdHM6IE9uZUJpdEFycmF5ID0gbnVsbDtcblxuICBwdWJsaWMgYXN5bmMgYWRkU25hcHNob3QocGFyc2VyOiBIZWFwU25hcHNob3RQYXJzZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBoZWFwID0gYXdhaXQgSGVhcEdyYXBoLkNvbnN0cnVjdChwYXJzZXIsIHRoaXMuX3N0cmluZ01hcCk7XG4gICAgY29uc3QgZ3Jvd3RoU3RhdHVzID0gbmV3IFR3b0JpdEFycmF5KGhlYXAubm9kZUNvdW50KTtcbiAgICBpZiAodGhpcy5faGVhcCAhPT0gbnVsbCkge1xuICAgICAgLy8gSW5pdGlhbGl6ZSBhbGwgbmV3IG5vZGVzIHRvICdOT1RfR1JPV0lORycuXG4gICAgICAvLyBXZSBvbmx5IHdhbnQgdG8gY29uc2lkZXIgc3RhYmxlIGhlYXAgcGF0aHMgcHJlc2VudCBmcm9tIHRoZSBmaXJzdCBzbmFwc2hvdC5cbiAgICAgIGdyb3d0aFN0YXR1cy5maWxsKEdyb3d0aFN0YXR1cy5OT1RfR1JPV0lORyk7XG4gICAgICAvLyBNZXJnZSBncmFwaHMuXG4gICAgICBwcm9wYWdhdGVHcm93dGgodGhpcy5faGVhcCwgdGhpcy5fZ3Jvd3RoU3RhdHVzLCBoZWFwLCBncm93dGhTdGF0dXMpO1xuICAgIH1cbiAgICAvLyBLZWVwIG5ldyBncmFwaC5cbiAgICB0aGlzLl9oZWFwID0gaGVhcDtcbiAgICB0aGlzLl9ncm93dGhTdGF0dXMgPSBncm93dGhTdGF0dXM7XG4gIH1cblxuICBwdWJsaWMgZ2V0R3JhcGgoKTogSGVhcEdyYXBoIHtcbiAgICByZXR1cm4gdGhpcy5faGVhcDtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbXBsZW1lbnRzIEZpbmRMZWFrUGF0aHMgKEZpZ3VyZSA1IGluIHRoZSBwYXBlcikgYW5kIENhbGN1bGF0ZUxlYWtTaGFyZSAoRmlndXJlIDYgaW4gdGhlIHBhcGVyKSxcbiAgICogYXMgd2VsbCBhcyBjYWxjdWxhdGlvbnMgZm9yIFJldGFpbmVkIFNpemUgYW5kIFRyYW5zaXRpdmUgQ2xvc3VyZSBTaXplICh3aGljaCB3ZSBjb21wYXJlIGFnYWluc3QgaW4gdGhlIHBhcGVyKS5cbiAgICpcbiAgICogUmV0dXJucyBwYXRocyB0aHJvdWdoIHRoZSBoZWFwIHRvIGxlYWtpbmcgbm9kZXMsIGFsb25nIHdpdGggbXVsdGlwbGUgZGlmZmVyZW50IHR5cGVzIG9mIHNjb3JlcyB0byBoZWxwXG4gICAqIGRldmVsb3BlcnMgcHJpb3JpdGl6ZSB0aGVtLCBncm91cGVkIGJ5IHRoZSBsZWFrIHJvb3QgcmVzcG9uc2libGUuXG4gICAqL1xuICBwdWJsaWMgZmluZExlYWtQYXRocygpOiBMZWFrUm9vdFtdIHtcbiAgICAvLyBBIG1hcCBmcm9tIGdyb3dpbmcgbm9kZXMgdG8gaGVhcCBwYXRocyB0aGF0IHJlZmVyZW5jZSB0aGVtLlxuICAgIGNvbnN0IGdyb3d0aFBhdGhzID0gbmV3IE1hcDxOb2RlSW5kZXgsIEVkZ2VbXVtdPigpO1xuXG4gICAgLy8gQWRkcyBhIGdpdmVuIHBhdGggdG8gZ3Jvd3RoUGF0aHMuXG4gICAgZnVuY3Rpb24gYWRkUGF0aChlOiBFZGdlW10pOiB2b2lkIHtcbiAgICAgIGNvbnN0IHRvID0gZVtlLmxlbmd0aCAtIDFdLnRvSW5kZXg7XG4gICAgICBsZXQgcGF0aHMgPSBncm93dGhQYXRocy5nZXQodG8pO1xuICAgICAgaWYgKHBhdGhzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcGF0aHMgPSBbXTtcbiAgICAgICAgZ3Jvd3RoUGF0aHMuc2V0KHRvLCBwYXRocyk7XG4gICAgICB9XG4gICAgICBwYXRocy5wdXNoKGUpO1xuICAgIH1cblxuICAgIC8vIEZpbHRlciBvdXQgRE9NIG5vZGVzIGFuZCBoaWRkZW4gZWRnZXMgdGhhdCByZXByZXNlbnQgaW50ZXJuYWwgVjggLyBDaHJvbWUgc3RhdGUuXG4gICAgZnVuY3Rpb24gZmlsdGVyTm9Eb20objogTm9kZSwgZTogRWRnZSkge1xuICAgICAgcmV0dXJuIGlzTm90SGlkZGVuKGUpICYmIG5vbldlYWtGaWx0ZXIobiwgZSkgJiYgc2hvdWxkVHJhdmVyc2UoZSwgZmFsc2UpO1xuICAgIH1cblxuICAgIC8vIEZpbHRlciBvdXQgaGlkZGVuIGVkZ2VzIHRoYXQgcmVwcmVzZW50IGludGVybmFsIFY4IC8gQ2hyb21lIHN0YXRlLCBidXQga2VlcCBET00gbm9kZXMuXG4gICAgZnVuY3Rpb24gZmlsdGVySW5jbHVkZURvbShuOiBOb2RlLCBlOiBFZGdlKSB7XG4gICAgICByZXR1cm4gbm9uV2Vha0ZpbHRlcihuLCBlKSAmJiBzaG91bGRUcmF2ZXJzZShlLCB0cnVlKTtcbiAgICB9XG5cbiAgICAvLyBHZXQgdGhlIGdyb3dpbmcgcGF0aHMuIElnbm9yZSBwYXRocyB0aHJvdWdoIHRoZSBET00sIGFzIHdlIG1pcnJvciB0aG9zZSBpbiBKYXZhU2NyaXB0LlxuICAgIC8vIChTZWUgU2VjdGlvbiA1LjMuMiBpbiB0aGUgcGFwZXIsIFwiRXhwb3NpbmcgSGlkZGVuIFN0YXRlXCIpXG4gICAgdGhpcy5faGVhcC52aXNpdEdsb2JhbEVkZ2VzKChlLCBnZXRQYXRoKSA9PiB7XG4gICAgICBpZiAodGhpcy5fZ3Jvd3RoU3RhdHVzLmdldChlLnRvSW5kZXgpID09PSBHcm93dGhTdGF0dXMuR1JPV0lORykge1xuICAgICAgICBhZGRQYXRoKGdldFBhdGgoKSk7XG4gICAgICB9XG4gICAgfSwgZmlsdGVyTm9Eb20pO1xuXG4gICAgLy8gTm93LCBjYWxjdWxhdGUgZ3Jvd3RoIG1ldHJpY3MhXG5cbiAgICAvLyBNYXJrIGl0ZW1zIHRoYXQgYXJlIHJlYWNoYWJsZSBieSBub24tbGVha3MuXG4gICAgY29uc3Qgbm9ubGVha1Zpc2l0Qml0cyA9IG5ldyBPbmVCaXRBcnJheSh0aGlzLl9oZWFwLm5vZGVDb3VudCk7XG4gICAgdGhpcy5faGVhcC52aXNpdFVzZXJSb290cygobikgPT4ge1xuICAgICAgbm9ubGVha1Zpc2l0Qml0cy5zZXQobi5ub2RlSW5kZXgsIHRydWUpO1xuICAgIH0sIChuLCBlKSA9PiB7XG4gICAgICAvLyBGaWx0ZXIgb3V0IGVkZ2VzIHRvIGdyb3dpbmcgb2JqZWN0cy5cbiAgICAgIC8vIFRyYXZlcnNlIHRoZSBET00gdGhpcyB0aW1lLlxuICAgICAgcmV0dXJuIGZpbHRlckluY2x1ZGVEb20obiwgZSkgJiYgIWdyb3d0aFBhdGhzLmhhcyhlLnRvSW5kZXgpO1xuICAgIH0pO1xuXG4gICAgLy8gRmlsdGVyIG91dCBpdGVtcyB0aGF0IGFyZSByZWFjaGFibGUgZnJvbSBub24tbGVha3MuXG4gICAgZnVuY3Rpb24gbm9uTGVha0ZpbHRlcihuOiBOb2RlLCBlOiBFZGdlKTogYm9vbGVhbiB7XG4gICAgICByZXR1cm4gZmlsdGVySW5jbHVkZURvbShuLCBlKSAmJiAhbm9ubGVha1Zpc2l0Qml0cy5nZXQoZS50b0luZGV4KTtcbiAgICB9XG5cbiAgICAvLyBJbmNyZW1lbnQgdmlzaXQgY291bnRlciBmb3IgZWFjaCBoZWFwIGl0ZW0gcmVhY2hhYmxlIGZyb20gYSBsZWFrLlxuICAgIC8vIFVzZWQgYnkgTGVha1NoYXJlLlxuICAgIGNvbnN0IGxlYWtSZWZlcmVuY2VzID0gbmV3IFVpbnQxNkFycmF5KHRoaXMuX2hlYXAubm9kZUNvdW50KTtcbiAgICBncm93dGhQYXRocy5mb3JFYWNoKChwYXRocywgZ3Jvd3RoTm9kZUluZGV4KSA9PiB7XG4gICAgICBiZnNWaXNpdG9yKHRoaXMuX2hlYXAsIFtncm93dGhOb2RlSW5kZXhdLCAobikgPT4ge1xuICAgICAgICBsZWFrUmVmZXJlbmNlc1tuLm5vZGVJbmRleF0rKztcbiAgICAgIH0sIG5vbkxlYWtGaWx0ZXIpO1xuICAgIH0pO1xuXG4gICAgLy8gQ2FsY3VsYXRlIGZpbmFsIGdyb3d0aCBtZXRyaWNzIChMZWFrU2hhcmUsIFJldGFpbmVkIFNpemUsIFRyYW5zaXRpdmUgQ2xvc3VyZSBTaXplKVxuICAgIC8vIGZvciBlYWNoIExlYWtQYXRoLCBhbmQgY29uc3RydWN0IExlYWtSb290IG9iamVjdHMgcmVwcmVzZW50aW5nIGVhY2ggTGVha1Jvb3QuXG4gICAgbGV0IHJ2ID0gbmV3IEFycmF5PExlYWtSb290PigpO1xuICAgIGdyb3d0aFBhdGhzLmZvckVhY2goKHBhdGhzLCBncm93dGhOb2RlSW5kZXgpID0+IHtcbiAgICAgIGxldCByZXRhaW5lZFNpemUgPSAwO1xuICAgICAgbGV0IGxlYWtTaGFyZSA9IDA7XG4gICAgICBsZXQgdHJhbnNpdGl2ZUNsb3N1cmVTaXplID0gMDtcbiAgICAgIGxldCBvd25lZE9iamVjdHMgPSAwO1xuICAgICAgYmZzVmlzaXRvcih0aGlzLl9oZWFwLCBbZ3Jvd3RoTm9kZUluZGV4XSwgKG4pID0+IHtcbiAgICAgICAgY29uc3QgcmVmQ291bnQgPSBsZWFrUmVmZXJlbmNlc1tuLm5vZGVJbmRleF07XG4gICAgICAgIGlmIChyZWZDb3VudCA9PT0gMSkge1xuICAgICAgICAgIC8vIEEgcmVmQ291bnQgb2YgMSBtZWFucyB0aGUgaGVhcCBpdGVtIGlzIHVuaXF1ZWx5IHJlZmVyZW5jZWQgYnkgdGhpcyBsZWFrLFxuICAgICAgICAgIC8vIHNvIGl0IGNvbnRyaWJ1dGVzIHRvIHJldGFpbmVkU2l6ZS5cbiAgICAgICAgICByZXRhaW5lZFNpemUgKz0gbi5zaXplO1xuICAgICAgICAgIG93bmVkT2JqZWN0cysrO1xuICAgICAgICB9XG4gICAgICAgIGxlYWtTaGFyZSArPSBuLnNpemUgLyByZWZDb3VudDtcbiAgICAgIH0sIG5vbkxlYWtGaWx0ZXIpO1xuXG4gICAgICAvLyBUcmFuc2l0aXZlIGNsb3N1cmUgc2l6ZSwgZm9yIGNvbXBhcmlzb24gdG8gcmVsYXRlZCB3b3JrLlxuICAgICAgYmZzVmlzaXRvcih0aGlzLl9oZWFwLCBbZ3Jvd3RoTm9kZUluZGV4XSwgKG4pID0+IHtcbiAgICAgICAgdHJhbnNpdGl2ZUNsb3N1cmVTaXplICs9IG4uc2l6ZTtcbiAgICAgIH0sIGZpbHRlckluY2x1ZGVEb20pO1xuXG4gICAgICBydi5wdXNoKG5ldyBMZWFrUm9vdChncm93dGhOb2RlSW5kZXgsIHBhdGhzLm1hcChlZGdlUGF0aFRvUGF0aCksIHtcbiAgICAgICAgcmV0YWluZWRTaXplLFxuICAgICAgICBsZWFrU2hhcmUsXG4gICAgICAgIHRyYW5zaXRpdmVDbG9zdXJlU2l6ZSxcbiAgICAgICAgb3duZWRPYmplY3RzXG4gICAgICB9KSk7XG4gICAgfSk7XG5cbiAgICAvLyBERUJVR1xuICAgIHRoaXMuX2xlYWtSZWZzID0gbGVha1JlZmVyZW5jZXM7XG4gICAgdGhpcy5fbm9uTGVha1Zpc2l0cyA9IG5vbmxlYWtWaXNpdEJpdHM7XG5cbiAgICByZXR1cm4gcnY7XG4gIH1cblxuICBwdWJsaWMgaXNHcm93aW5nKG5vZGVJbmRleDogbnVtYmVyKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2dyb3d0aFN0YXR1cy5nZXQobm9kZUluZGV4KSA9PT0gR3Jvd3RoU3RhdHVzLkdST1dJTkc7XG4gIH1cbn1cblxuXG4vKipcbiAqIE1hcCBmcm9tIElEID0+IHN0cmluZy5cbiAqL1xuY2xhc3MgU3RyaW5nTWFwIHtcbiAgcHJpdmF0ZSBfbWFwID0gbmV3IE1hcDxzdHJpbmcsIG51bWJlcj4oKTtcbiAgcHJpdmF0ZSBfc3RyaW5ncyA9IG5ldyBBcnJheTxzdHJpbmc+KCk7XG5cbiAgcHVibGljIGdldChzOiBzdHJpbmcpOiBudW1iZXIge1xuICAgIGNvbnN0IG1hcCA9IHRoaXMuX21hcDtcbiAgICBsZXQgaWQgPSBtYXAuZ2V0KHMpO1xuICAgIGlmIChpZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZCA9IHRoaXMuX3N0cmluZ3MucHVzaChzKSAtIDE7XG4gICAgICBtYXAuc2V0KHMsIGlkKTtcbiAgICB9XG4gICAgcmV0dXJuIGlkO1xuICB9XG5cbiAgcHVibGljIGZyb21JZChpOiBudW1iZXIpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLl9zdHJpbmdzW2ldO1xuICB9XG59XG5cbi8qKlxuICogRWRnZSBtaXJyb3JcbiAqL1xuZXhwb3J0IGNsYXNzIEVkZ2Uge1xuICBwdWJsaWMgZWRnZUluZGV4OiBFZGdlSW5kZXg7XG4gIHByaXZhdGUgX2hlYXA6IEhlYXBHcmFwaDtcblxuICBjb25zdHJ1Y3RvcihpOiBFZGdlSW5kZXgsIGhlYXA6IEhlYXBHcmFwaCkge1xuICAgIHRoaXMuZWRnZUluZGV4ID0gaTtcbiAgICB0aGlzLl9oZWFwID0gaGVhcDtcbiAgfVxuICBwdWJsaWMgZ2V0IHRvKCk6IE5vZGUge1xuICAgIHJldHVybiBuZXcgTm9kZSh0aGlzLl9oZWFwLmVkZ2VUb05vZGVzW3RoaXMuZWRnZUluZGV4XSwgdGhpcy5faGVhcCk7XG4gIH1cbiAgcHVibGljIGdldCBzaXplKCk6IG51bWJlciB7XG4gICAgY29uc3QgayA9IG5ldyBOb2RlKHRoaXMuX2hlYXAuZWRnZVRvTm9kZXNbdGhpcy5lZGdlSW5kZXhdLHRoaXMuX2hlYXApO1xuICAgIHJldHVybiAoay5zaXplKTtcbiAgfVxuICBwdWJsaWMgZ2V0IHRvSW5kZXgoKTogTm9kZUluZGV4IHtcbiAgICByZXR1cm4gdGhpcy5faGVhcC5lZGdlVG9Ob2Rlc1t0aGlzLmVkZ2VJbmRleF07XG4gIH1cbiAgcHVibGljIGdldCBzbmFwc2hvdFR5cGUoKTogU25hcHNob3RFZGdlVHlwZSB7XG4gICAgcmV0dXJuIHRoaXMuX2hlYXAuZWRnZVR5cGVzW3RoaXMuZWRnZUluZGV4XTtcbiAgfVxuICAvKipcbiAgICogUmV0dXJucyB0aGUgaW5kZXggKG51bWJlcikgb3IgbmFtZSAoc3RyaW5nKSB0aGF0IHRoaXMgZWRnZVxuICAgKiBjb3JyZXNwb25kcyB0by4gKEluZGV4IHR5cGVzIG9jY3VyIGluIEFycmF5cy4pXG4gICAqL1xuICBwdWJsaWMgZ2V0IGluZGV4T3JOYW1lKCk6IHN0cmluZyB8IG51bWJlciB7XG4gICAgY29uc3QgbmFtZU9ySW5kZXggPSB0aGlzLl9oZWFwLmVkZ2VOYW1lc09ySW5kZXhlc1t0aGlzLmVkZ2VJbmRleF07XG4gICAgaWYgKHRoaXMuX2lzSW5kZXgoKSkge1xuICAgICAgcmV0dXJuIG5hbWVPckluZGV4O1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5faGVhcC5zdHJpbmdNYXAuZnJvbUlkKG5hbWVPckluZGV4KTtcbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIFJldHVybnMgJ3RydWUnIGlmIHRoZSBlZGdlIGNvcnJlc3BvbmRzIHRvIGEgdHlwZSB3aGVyZSBuYW1lT3JJbmRleCBpcyBhbiBpbmRleCxcbiAgICogYW5kIGZhbHNlIG90aGVyd2lzZS5cbiAgICovXG4gIHByaXZhdGUgX2lzSW5kZXgoKTogYm9vbGVhbiB7XG4gICAgc3dpdGNoKHRoaXMuc25hcHNob3RUeXBlKSB7XG4gICAgICBjYXNlIFNuYXBzaG90RWRnZVR5cGUuRWxlbWVudDogLy8gQXJyYXkgZWxlbWVudC5cbiAgICAgIGNhc2UgU25hcHNob3RFZGdlVHlwZS5IaWRkZW46IC8vIEhpZGRlbiBmcm9tIGRldmVsb3BlciwgYnV0IGluZmx1ZW5jZXMgaW4tbWVtb3J5IHNpemUuIEFwcGFyZW50bHkgaGFzIGFuIGluZGV4LCBub3QgYSBuYW1lLiBJZ25vcmUgZm9yIG5vdy5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICBjYXNlIFNuYXBzaG90RWRnZVR5cGUuQ29udGV4dFZhcmlhYmxlOiAvLyBDbG9zdXJlIHZhcmlhYmxlLlxuICAgICAgY2FzZSBTbmFwc2hvdEVkZ2VUeXBlLkludGVybmFsOiAvLyBJbnRlcm5hbCBkYXRhIHN0cnVjdHVyZXMgdGhhdCBhcmUgbm90IGFjdGlvbmFibGUgdG8gZGV2ZWxvcGVycy4gSW5mbHVlbmNlIHJldGFpbmVkIHNpemUuIElnbm9yZSBmb3Igbm93LlxuICAgICAgY2FzZSBTbmFwc2hvdEVkZ2VUeXBlLlNob3J0Y3V0OiAvLyBTaG9ydGN1dDogU2hvdWxkIGJlIGlnbm9yZWQ7IGFuIGludGVybmFsIGRldGFpbC5cbiAgICAgIGNhc2UgU25hcHNob3RFZGdlVHlwZS5XZWFrOiAvLyBXZWFrIHJlZmVyZW5jZTogRG9lc24ndCBob2xkIG9udG8gbWVtb3J5LlxuICAgICAgY2FzZSBTbmFwc2hvdEVkZ2VUeXBlLlByb3BlcnR5OiAvLyBQcm9wZXJ0eSBvbiBhbiBvYmplY3QuXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5yZWNvZ25pemVkIGVkZ2UgdHlwZTogJHt0aGlzLnNuYXBzaG90VHlwZX1gKTtcbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIERldGVybWluZXMgd2hhdCB0eXBlIG9mIGVkZ2UgdGhpcyBpcyBpbiBhIGhlYXAgcGF0aC5cbiAgICogUmVjb2duaXplcyBzb21lIHNwZWNpYWwgQkxlYWstaW5zZXJ0ZWQgaGVhcCBlZGdlcyB0aGF0IGNvcnJlc3BvbmRcbiAgICogdG8gaGlkZGVuIGJyb3dzZXIgc3RhdGUuXG4gICAqL1xuICBwdWJsaWMgZ2V0IHBhdGhTZWdtZW50VHlwZSgpOiBQYXRoU2VnbWVudFR5cGUge1xuICAgIHN3aXRjaCh0aGlzLnNuYXBzaG90VHlwZSkge1xuICAgICAgY2FzZSBTbmFwc2hvdEVkZ2VUeXBlLkVsZW1lbnQ6XG4gICAgICAgIHJldHVybiBQYXRoU2VnbWVudFR5cGUuRUxFTUVOVDtcbiAgICAgIGNhc2UgU25hcHNob3RFZGdlVHlwZS5Db250ZXh0VmFyaWFibGU6XG4gICAgICAgIHJldHVybiBQYXRoU2VnbWVudFR5cGUuQ0xPU1VSRV9WQVJJQUJMRTtcbiAgICAgIGNhc2UgU25hcHNob3RFZGdlVHlwZS5JbnRlcm5hbDpcbiAgICAgICAgaWYgKHRoaXMuaW5kZXhPck5hbWUgPT09ICdjb250ZXh0Jykge1xuICAgICAgICAgIHJldHVybiBQYXRoU2VnbWVudFR5cGUuQ0xPU1VSRTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgU25hcHNob3RFZGdlVHlwZS5Qcm9wZXJ0eToge1xuICAgICAgICAvLyBXZSBhc3N1bWUgdGhhdCBubyBvbmUgdXNlcyBvdXIgY2hvc2VuIHNwZWNpYWwgcHJvcGVydHkgbmFtZXMuXG4gICAgICAgIC8vIElmIHRoZSBwcm9ncmFtIGhhcHBlbnMgdG8gaGF2ZSBhIG1lbW9yeSBsZWFrIHN0ZW1taW5nIGZyb20gYSBub24tQkxlYWstY3JlYXRlZFxuICAgICAgICAvLyBwcm9wZXJ0eSB3aXRoIG9uZSBvZiB0aGVzZSBuYW1lcywgdGhlbiBCTGVhayBtaWdodCBub3QgZmluZCBpdC5cbiAgICAgICAgY29uc3QgbmFtZSA9IHRoaXMuaW5kZXhPck5hbWU7XG4gICAgICAgIHN3aXRjaCAobmFtZSkge1xuICAgICAgICAgIGNhc2UgJyQkJERPTSQkJCc6XG4gICAgICAgICAgICByZXR1cm4gUGF0aFNlZ21lbnRUeXBlLkRPTV9UUkVFO1xuICAgICAgICAgIGNhc2UgJyQkbGlzdGVuZXJzJzpcbiAgICAgICAgICAgIHJldHVybiBQYXRoU2VnbWVudFR5cGUuRVZFTlRfTElTVEVORVJfTElTVDtcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmV0dXJuIFBhdGhTZWdtZW50VHlwZS5QUk9QRVJUWTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBjb25zb2xlLmRlYnVnKGBVbnJlY29nbml6ZWQgZWRnZSB0eXBlOiAke3RoaXMuc25hcHNob3RUeXBlfWApXG4gICAgcmV0dXJuIFBhdGhTZWdtZW50VHlwZS5VTktOT1dOO1xuICB9XG59XG5cbmNsYXNzIEVkZ2VJdGVyYXRvciB7XG4gIHByaXZhdGUgX2VkZ2U6IEVkZ2U7XG4gIHByaXZhdGUgX2VkZ2VFbmQ6IG51bWJlcjtcbiAgY29uc3RydWN0b3IoaGVhcDogSGVhcEdyYXBoLCBlZGdlU3RhcnQ6IEVkZ2VJbmRleCwgZWRnZUVuZDogRWRnZUluZGV4KSB7XG4gICAgdGhpcy5fZWRnZSA9IG5ldyBFZGdlKGVkZ2VTdGFydCwgaGVhcCk7XG4gICAgdGhpcy5fZWRnZUVuZCA9IGVkZ2VFbmQ7XG4gIH1cblxuICBwdWJsaWMgaGFzTmV4dCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fZWRnZS5lZGdlSW5kZXggPCB0aGlzLl9lZGdlRW5kO1xuICB9XG5cbiAgcHVibGljIG5leHQoKTogdm9pZCB7XG4gICAgdGhpcy5fZWRnZS5lZGdlSW5kZXgrKztcbiAgfVxuXG4gIHB1YmxpYyBpdGVtKCk6IEVkZ2Uge1xuICAgIHJldHVybiB0aGlzLl9lZGdlO1xuICB9XG59XG5cbi8qKlxuICogTm9kZSBtaXJyb3IuXG4gKi9cbmNsYXNzIE5vZGUge1xuICBwdWJsaWMgbm9kZUluZGV4OiBOb2RlSW5kZXhcbiAgcHJpdmF0ZSBfaGVhcDogSGVhcEdyYXBoO1xuXG4gIGNvbnN0cnVjdG9yKGk6IE5vZGVJbmRleCwgaGVhcDogSGVhcEdyYXBoKSB7XG4gICAgdGhpcy5ub2RlSW5kZXggPSBpO1xuICAgIHRoaXMuX2hlYXAgPSBoZWFwO1xuICB9XG5cbiAgcHVibGljIGdldCB0eXBlKCk6IFNuYXBzaG90Tm9kZVR5cGUge1xuICAgIHJldHVybiB0aGlzLl9oZWFwLm5vZGVUeXBlc1t0aGlzLm5vZGVJbmRleF07XG4gIH1cblxuICBwdWJsaWMgZ2V0IHNpemUoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5faGVhcC5ub2RlU2l6ZXNbdGhpcy5ub2RlSW5kZXhdO1xuICB9XG5cbiAgcHVibGljIGdldCBoYXNDaGlsZHJlbigpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5jaGlsZHJlbkxlbmd0aCAhPT0gMDtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgbmFtZSgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLl9oZWFwLnN0cmluZ01hcC5mcm9tSWQodGhpcy5faGVhcC5ub2RlTmFtZXNbdGhpcy5ub2RlSW5kZXhdKTtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgY2hpbGRyZW5MZW5ndGgoKTogbnVtYmVyIHtcbiAgICBjb25zdCBmZWkgPSB0aGlzLl9oZWFwLmZpcnN0RWRnZUluZGV4ZXM7XG4gICAgcmV0dXJuIGZlaVt0aGlzLm5vZGVJbmRleCArIDFdIC0gZmVpW3RoaXMubm9kZUluZGV4XTtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgY2hpbGRyZW4oKTogRWRnZUl0ZXJhdG9yIHtcbiAgICBjb25zdCBmZWkgPSB0aGlzLl9oZWFwLmZpcnN0RWRnZUluZGV4ZXM7XG4gICAgcmV0dXJuIG5ldyBFZGdlSXRlcmF0b3IodGhpcy5faGVhcCwgZmVpW3RoaXMubm9kZUluZGV4XSwgZmVpW3RoaXMubm9kZUluZGV4ICsgMV0pO1xuICB9XG5cbiAgcHVibGljIGdldENoaWxkKGk6IG51bWJlcik6IEVkZ2Uge1xuICAgIGNvbnN0IGZlaSA9IHRoaXMuX2hlYXAuZmlyc3RFZGdlSW5kZXhlcztcbiAgICBjb25zdCBpbmRleCA9IGZlaVt0aGlzLm5vZGVJbmRleF0gKyBpIGFzIEVkZ2VJbmRleDtcbiAgICBpZiAoaW5kZXggPj0gZmVpW3RoaXMubm9kZUluZGV4ICsgMV0pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBjaGlsZC5gKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBFZGdlKGluZGV4LCB0aGlzLl9oZWFwKTtcbiAgfVxuXG4gIHB1YmxpYyBnZXRSZXRhaW5lZFNpemUoKTogbnVtYmVyIHtcbiAgICAvL05vdyB3ZSBrbm93IHRoZSBzaXplIG9mIHRoZSBub2RlIG5vdyB0YWtpbmcgdGhlIHNpemVzIGZvciB0aGUgY2hpbGRzIHNvIGZvdCB0aGF0IHdlIHdpbGwgYmUgdXNpbmcgdGhlIGFib3ZlIGNvZGVcbiAgICBsZXQgc2l6Om51bWJlciA9IHRoaXMuX2hlYXAubm9kZVNpemVzW3RoaXMubm9kZUluZGV4XTtcbiAgICAvL0dldHRpbmcgdGhlIGZpcnN0IEVkZ2VzIGZvciB0aGUgTm9kZXNcbiAgICBsZXQgZmVpID0gdGhpcy5faGVhcC5maXJzdEVkZ2VJbmRleGVzO1xuICAgIC8vTm93IEZpbmRpbmcgdGhlIG51bWJlciBvZiBlZGdlcyBmb3IgdGhlIGdpdmVuIG5vZGVcbiAgICBsZXQgZmVpXzE6bnVtYmVyID0gZmVpW3RoaXMubm9kZUluZGV4ICsgMV0gLSBmZWlbdGhpcy5ub2RlSW5kZXhdXG4gICAgLy9Jbml0aWFsaXphdGlvbiBvZiBmX3NpemVcbiAgICBsZXQgZl9zaXplOm51bWJlcj0wO1xuICAgIC8vQ2FsbGluZyBsb29wIGZvciBjYWxjdWxhdGluZyBOb2Rlc1xuICAgIGZvcihsZXQgaT0xOyBpIDw9IGZlaV8xOyBpKyspe1xuICAgICAgLy9Ob3cgaW5kZXggd2lsbCBiZSBjYWxsZWQgdG8gc3RvcmUgdGhlIEVkZ2UgSW5kZXhcbiAgICAgIGNvbnN0IGluZGV4ID0gZmVpW3RoaXMubm9kZUluZGV4XSArIGkgYXMgRWRnZUluZGV4O1xuICAgICAgLy9UaGlzIHdpbGwgbWFrZSBlZGdlIGZvciBjb25zdCBpbmRcbiAgICAgIGNvbnN0IGluZD0gbmV3IEVkZ2UoaW5kZXgsIHRoaXMuX2hlYXApO1xuICAgICAgLy9Ob3cgd2Ugd2lsbCBjcmVhdGUgdGhlIGVkZ2VzIHRvIG5vZGUgYW5kIGZpbmQgdGhlaXIgc2l6ZVxuICAgICAgY29uc3QgbnVtOm51bWJlciA9IGluZC5zaXplO1xuICAgICAgLy9Ob3cgc2VlaW5nIHRoZSBlZGdlIG1pcnJvciBjb252ZXJ0aW5nIHRoZSBlZGdlcyBcbiAgICAgIGZfc2l6ZT1zaXorbnVtO1xuICAgIH1cbiAgICByZXR1cm4gKGZfc2l6ZSk7XG4gIH1cblxuICAvKipcbiAgICogTWVhc3VyZXMgdGhlIG51bWJlciBvZiBwcm9wZXJ0aWVzIG9uIHRoZSBub2RlLlxuICAgKiBNYXkgcmVxdWlyZSB0cmF2ZXJzaW5nIGhpZGRlbiBjaGlsZHJlbi5cbiAgICogVGhpcyBpcyB0aGUgZ3Jvd3RoIG1ldHJpYyB3ZSB1c2UuXG4gICAqL1xuICBwdWJsaWMgbnVtUHJvcGVydGllcygpOiBudW1iZXIge1xuICAgIGxldCBjb3VudCA9IDA7XG4gICAgaWYgKHRoaXMuaGFzQ2hpbGRyZW4pIHtcbiAgICAgIGZvciAoY29uc3QgaXQgPSB0aGlzLmNoaWxkcmVuOyBpdC5oYXNOZXh0KCk7IGl0Lm5leHQoKSkge1xuICAgICAgICBjb25zdCBjaGlsZCA9IGl0Lml0ZW0oKTtcbiAgICAgICAgc3dpdGNoKGNoaWxkLnNuYXBzaG90VHlwZSkge1xuICAgICAgICAgIGNhc2UgU25hcHNob3RFZGdlVHlwZS5JbnRlcm5hbDpcbiAgICAgICAgICAgIHN3aXRjaChjaGlsZC5pbmRleE9yTmFtZSkge1xuICAgICAgICAgICAgICBjYXNlIFwiZWxlbWVudHNcIjoge1xuICAgICAgICAgICAgICAgIC8vIENvbnRhaW5zIG51bWVyaWNhbCBwcm9wZXJ0aWVzLCBpbmNsdWRpbmcgdGhvc2Ugb2ZcbiAgICAgICAgICAgICAgICAvLyBhcnJheXMgYW5kIG9iamVjdHMuXG4gICAgICAgICAgICAgICAgY29uc3QgZWxlbWVudHMgPSBjaGlsZC50bztcbiAgICAgICAgICAgICAgICAvLyBPbmx5IGNvdW50IGlmIG5vIGNoaWxkcmVuLlxuICAgICAgICAgICAgICAgIGlmICghZWxlbWVudHMuaGFzQ2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICAgIGNvdW50ICs9IE1hdGguZmxvb3IoZWxlbWVudHMuc2l6ZSAvIDgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBjYXNlIFwidGFibGVcIjoge1xuICAgICAgICAgICAgICAgIC8vIENvbnRhaW5zIE1hcCBhbmQgU2V0IG9iamVjdCBlbnRyaWVzLlxuICAgICAgICAgICAgICAgIGNvbnN0IHRhYmxlID0gY2hpbGQudG87XG4gICAgICAgICAgICAgICAgaWYgKHRhYmxlLmhhc0NoaWxkcmVuKSB7XG4gICAgICAgICAgICAgICAgICBjb3VudCArPSB0YWJsZS5jaGlsZHJlbkxlbmd0aDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgY2FzZSBcInByb3BlcnRpZXNcIjoge1xuICAgICAgICAgICAgICAgIC8vIENvbnRhaW5zIGV4cGFuZG8gcHJvcGVydGllcyBvbiBET00gbm9kZXMsXG4gICAgICAgICAgICAgICAgLy8gcHJvcGVydGllcyBzdG9yaW5nIG51bWJlcnMgb24gb2JqZWN0cyxcbiAgICAgICAgICAgICAgICAvLyBldGMuXG4gICAgICAgICAgICAgICAgY29uc3QgcHJvcHMgPSBjaGlsZC50bztcbiAgICAgICAgICAgICAgICBpZiAocHJvcHMuaGFzQ2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICAgIGNvdW50ICs9IHByb3BzLmNoaWxkcmVuTGVuZ3RoO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBTbmFwc2hvdEVkZ2VUeXBlLkhpZGRlbjpcbiAgICAgICAgICBjYXNlIFNuYXBzaG90RWRnZVR5cGUuU2hvcnRjdXQ6XG4gICAgICAgICAgY2FzZSBTbmFwc2hvdEVkZ2VUeXBlLldlYWs6XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgY291bnQrKztcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjb3VudDtcbiAgfVxufVxuXG4vKipcbiAqIFJlcHJlc2VudHMgYSBoZWFwIHNuYXBzaG90IC8gaGVhcCBncmFwaC5cbiAqL1xuZXhwb3J0IGNsYXNzIEhlYXBHcmFwaCB7XG4gIHB1YmxpYyBzdGF0aWMgYXN5bmMgQ29uc3RydWN0KHBhcnNlcjogSGVhcFNuYXBzaG90UGFyc2VyLCBzdHJpbmdNYXA6IFN0cmluZ01hcCA9IG5ldyBTdHJpbmdNYXAoKSk6IFByb21pc2U8SGVhcEdyYXBoPiB7XG4gICAgY29uc3QgZmlyc3RDaHVuayA9IGF3YWl0IHBhcnNlci5yZWFkKCk7XG4gICAgaWYgKGZpcnN0Q2h1bmsudHlwZSAhPT0gRGF0YVR5cGVzLlNOQVBTSE9UKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEZpcnN0IGNodW5rIGRvZXMgbm90IGNvbnRhaW4gc25hcHNob3QgcHJvcGVydHkuYCk7XG4gICAgfVxuICAgIGNvbnN0IHNuYXBzaG90SW5mbyA9IGZpcnN0Q2h1bmsuZGF0YTtcbiAgICBjb25zdCBtZXRhID0gc25hcHNob3RJbmZvLm1ldGE7XG4gICAgY29uc3Qgbm9kZUZpZWxkcyA9IG1ldGEubm9kZV9maWVsZHM7XG4gICAgY29uc3Qgbm9kZUxlbmd0aCA9IG5vZGVGaWVsZHMubGVuZ3RoO1xuICAgIGNvbnN0IHJvb3ROb2RlSW5kZXggPSAoc25hcHNob3RJbmZvLnJvb3RfaW5kZXggPyBzbmFwc2hvdEluZm8ucm9vdF9pbmRleCAvIG5vZGVMZW5ndGggOiAwKSBhcyBOb2RlSW5kZXg7XG4gICAgY29uc3Qgbm9kZUNvdW50ID0gc25hcHNob3RJbmZvLm5vZGVfY291bnQ7XG4gICAgY29uc3QgZWRnZUNvdW50ID0gc25hcHNob3RJbmZvLmVkZ2VfY291bnQ7XG4gICAgY29uc3Qgbm9kZVR5cGVzID0gbmV3IFVpbnQ4QXJyYXkobm9kZUNvdW50KTtcbiAgICBjb25zdCBub2RlTmFtZXMgPSBuZXcgVWludDMyQXJyYXkobm9kZUNvdW50KTtcbiAgICBjb25zdCBub2RlU2l6ZXMgPSBuZXcgVWludDMyQXJyYXkobm9kZUNvdW50KTtcbiAgICBjb25zdCBmaXJzdEVkZ2VJbmRleGVzID0gbmV3IFVpbnQzMkFycmF5KG5vZGVDb3VudCArIDEpO1xuICAgIGNvbnN0IGVkZ2VUeXBlcyA9IG5ldyBVaW50OEFycmF5KGVkZ2VDb3VudCk7XG4gICAgY29uc3QgZWRnZU5hbWVzT3JJbmRleGVzID0gbmV3IFVpbnQzMkFycmF5KGVkZ2VDb3VudCk7XG4gICAgY29uc3QgZWRnZVRvTm9kZXMgPSBuZXcgVWludDMyQXJyYXkoZWRnZUNvdW50KTtcblxuICAgIHtcbiAgICAgIGNvbnN0IG5vZGVUeXBlT2Zmc2V0ID0gbm9kZUZpZWxkcy5pbmRleE9mKFwidHlwZVwiKTtcbiAgICAgIGNvbnN0IG5vZGVOYW1lT2Zmc2V0ID0gbm9kZUZpZWxkcy5pbmRleE9mKFwibmFtZVwiKTtcbiAgICAgIGNvbnN0IG5vZGVTZWxmU2l6ZU9mZnNldCA9IG5vZGVGaWVsZHMuaW5kZXhPZihcInNlbGZfc2l6ZVwiKTtcbiAgICAgIGNvbnN0IG5vZGVFZGdlQ291bnRPZmZzZXQgPSBub2RlRmllbGRzLmluZGV4T2YoXCJlZGdlX2NvdW50XCIpO1xuICAgICAgY29uc3QgZWRnZUZpZWxkcyA9IG1ldGEuZWRnZV9maWVsZHM7XG4gICAgICBjb25zdCBlZGdlTGVuZ3RoID0gZWRnZUZpZWxkcy5sZW5ndGg7XG4gICAgICBjb25zdCBlZGdlVHlwZU9mZnNldCA9IGVkZ2VGaWVsZHMuaW5kZXhPZihcInR5cGVcIik7XG4gICAgICBjb25zdCBlZGdlTmFtZU9ySW5kZXhPZmZzZXQgPSBlZGdlRmllbGRzLmluZGV4T2YoXCJuYW1lX29yX2luZGV4XCIpO1xuICAgICAgY29uc3QgZWRnZVRvTm9kZU9mZnNldCA9IGVkZ2VGaWVsZHMuaW5kZXhPZihcInRvX25vZGVcIik7XG4gICAgICBsZXQgc3RyaW5nczogQXJyYXk8c3RyaW5nPiA9IFtdO1xuXG4gICAgICBsZXQgbm9kZVB0ciA9IDA7XG4gICAgICBsZXQgZWRnZVB0ciA9IDA7XG4gICAgICBsZXQgbmV4dEVkZ2UgPSAwO1xuICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgY29uc3QgY2h1bmsgPSBhd2FpdCBwYXJzZXIucmVhZCgpO1xuICAgICAgICBpZiAoY2h1bmsgPT09IG51bGwpIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBzd2l0Y2ggKGNodW5rLnR5cGUpIHtcbiAgICAgICAgICBjYXNlIERhdGFUeXBlcy5OT0RFUzoge1xuICAgICAgICAgICAgY29uc3QgZGF0YSA9IGNodW5rLmRhdGE7XG4gICAgICAgICAgICBjb25zdCBkYXRhTGVuID0gZGF0YS5sZW5ndGg7XG4gICAgICAgICAgICBjb25zdCBkYXRhTm9kZUNvdW50ID0gZGF0YUxlbiAvIG5vZGVMZW5ndGg7XG4gICAgICAgICAgICBpZiAoZGF0YUxlbiAlIG5vZGVMZW5ndGggIT09IDApIHtcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBFeHBlY3RlZCBjaHVuayB0byBjb250YWluIHdob2xlIG5vZGVzLiBJbnN0ZWFkLCBjb250YWluZWQgJHtkYXRhTm9kZUNvdW50fSBub2Rlcy5gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIENvcHkgZGF0YSBpbnRvIG91ciB0eXBlZCBhcnJheXMuXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRhdGFOb2RlQ291bnQ7IGkrKykge1xuICAgICAgICAgICAgICBjb25zdCBkYXRhQmFzZSA9IGkgKiBub2RlTGVuZ3RoO1xuICAgICAgICAgICAgICBjb25zdCBhcnJheUJhc2UgPSBub2RlUHRyICsgaTtcbiAgICAgICAgICAgICAgbm9kZVR5cGVzW2FycmF5QmFzZV0gPSBkYXRhW2RhdGFCYXNlICsgbm9kZVR5cGVPZmZzZXRdO1xuICAgICAgICAgICAgICBub2RlTmFtZXNbYXJyYXlCYXNlXSA9IGRhdGFbZGF0YUJhc2UgKyBub2RlTmFtZU9mZnNldF07XG4gICAgICAgICAgICAgIG5vZGVTaXplc1thcnJheUJhc2VdID0gZGF0YVtkYXRhQmFzZSArIG5vZGVTZWxmU2l6ZU9mZnNldF07XG4gICAgICAgICAgICAgIGZpcnN0RWRnZUluZGV4ZXNbYXJyYXlCYXNlXSA9IG5leHRFZGdlO1xuICAgICAgICAgICAgICBuZXh0RWRnZSArPSBkYXRhW2RhdGFCYXNlICsgbm9kZUVkZ2VDb3VudE9mZnNldF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBub2RlUHRyICs9IGRhdGFOb2RlQ291bnQ7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgICAgY2FzZSBEYXRhVHlwZXMuRURHRVM6IHtcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBjaHVuay5kYXRhO1xuICAgICAgICAgICAgY29uc3QgZGF0YUxlbiA9IGRhdGEubGVuZ3RoO1xuICAgICAgICAgICAgY29uc3QgZGF0YUVkZ2VDb3VudCA9IGRhdGFMZW4gLyBlZGdlTGVuZ3RoO1xuICAgICAgICAgICAgaWYgKGRhdGFMZW4gJSBlZGdlTGVuZ3RoICE9PSAwKSB7XG4gICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRXhwZWN0ZWQgY2h1bmsgdG8gY29udGFpbiB3aG9sZSBub2Rlcy4gSW5zdGVhZCwgY29udGFpbmVkICR7ZGF0YUVkZ2VDb3VudH0gbm9kZXMuYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBDb3B5IGRhdGEgaW50byBvdXIgdHlwZWQgYXJyYXlzLlxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkYXRhRWRnZUNvdW50OyBpKyspIHtcbiAgICAgICAgICAgICAgY29uc3QgZGF0YUJhc2UgPSBpICogZWRnZUxlbmd0aDtcbiAgICAgICAgICAgICAgY29uc3QgYXJyYXlCYXNlID0gZWRnZVB0ciArIGk7XG4gICAgICAgICAgICAgIGVkZ2VUeXBlc1thcnJheUJhc2VdID0gZGF0YVtkYXRhQmFzZSArIGVkZ2VUeXBlT2Zmc2V0XTtcbiAgICAgICAgICAgICAgZWRnZU5hbWVzT3JJbmRleGVzW2FycmF5QmFzZV0gPSBkYXRhW2RhdGFCYXNlICsgZWRnZU5hbWVPckluZGV4T2Zmc2V0XTtcbiAgICAgICAgICAgICAgZWRnZVRvTm9kZXNbYXJyYXlCYXNlXSA9IGRhdGFbZGF0YUJhc2UgKyBlZGdlVG9Ob2RlT2Zmc2V0XSAvIG5vZGVMZW5ndGg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlZGdlUHRyICs9IGRhdGFFZGdlQ291bnQ7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgICAgY2FzZSBEYXRhVHlwZXMuU1RSSU5HUzoge1xuICAgICAgICAgICAgc3RyaW5ncyA9IHN0cmluZ3MuY29uY2F0KGNodW5rLmRhdGEpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVuZXhwZWN0ZWQgc25hcHNob3QgY2h1bms6ICR7Y2h1bmsudHlwZX0uYCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vIFByb2Nlc3MgZWRnZU5hbWVPckluZGV4IG5vdy5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZWRnZUNvdW50OyBpKyspIHtcbiAgICAgICAgY29uc3QgZWRnZVR5cGUgPSBlZGdlVHlwZXNbaV07XG4gICAgICAgIHN3aXRjaChlZGdlVHlwZSkge1xuICAgICAgICAgIGNhc2UgU25hcHNob3RFZGdlVHlwZS5FbGVtZW50OiAvLyBBcnJheSBlbGVtZW50LlxuICAgICAgICAgIGNhc2UgU25hcHNob3RFZGdlVHlwZS5IaWRkZW46IC8vIEhpZGRlbiBmcm9tIGRldmVsb3BlciwgYnV0IGluZmx1ZW5jZXMgaW4tbWVtb3J5IHNpemUuIEFwcGFyZW50bHkgaGFzIGFuIGluZGV4LCBub3QgYSBuYW1lLiBJZ25vcmUgZm9yIG5vdy5cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgU25hcHNob3RFZGdlVHlwZS5Db250ZXh0VmFyaWFibGU6IC8vIEZ1bmN0aW9uIGNvbnRleHQuIEkgdGhpbmsgaXQgaGFzIGEgbmFtZSwgbGlrZSBcImNvbnRleHRcIi5cbiAgICAgICAgICBjYXNlIFNuYXBzaG90RWRnZVR5cGUuSW50ZXJuYWw6IC8vIEludGVybmFsIGRhdGEgc3RydWN0dXJlcyB0aGF0IGFyZSBub3QgYWN0aW9uYWJsZSB0byBkZXZlbG9wZXJzLiBJbmZsdWVuY2UgcmV0YWluZWQgc2l6ZS4gSWdub3JlIGZvciBub3cuXG4gICAgICAgICAgY2FzZSBTbmFwc2hvdEVkZ2VUeXBlLlNob3J0Y3V0OiAvLyBTaG9ydGN1dDogU2hvdWxkIGJlIGlnbm9yZWQ7IGFuIGludGVybmFsIGRldGFpbC5cbiAgICAgICAgICBjYXNlIFNuYXBzaG90RWRnZVR5cGUuV2VhazogLy8gV2VhayByZWZlcmVuY2U6IERvZXNuJ3QgaG9sZCBvbnRvIG1lbW9yeS5cbiAgICAgICAgICBjYXNlIFNuYXBzaG90RWRnZVR5cGUuUHJvcGVydHk6IC8vIFByb3BlcnR5IG9uIGFuIG9iamVjdC5cbiAgICAgICAgICAgIGVkZ2VOYW1lc09ySW5kZXhlc1tpXSA9IHN0cmluZ01hcC5nZXQoc3RyaW5nc1tlZGdlTmFtZXNPckluZGV4ZXNbaV1dKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVucmVjb2duaXplZCBlZGdlIHR5cGU6ICR7ZWRnZVR5cGV9YCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGZpcnN0RWRnZUluZGV4ZXNbbm9kZUNvdW50XSA9IGVkZ2VDb3VudDtcbiAgICAgIC8vIFByb2Nlc3Mgbm9kZU5hbWVzIG5vdy5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbm9kZUNvdW50OyBpKyspIHtcbiAgICAgICAgbm9kZU5hbWVzW2ldID0gc3RyaW5nTWFwLmdldChzdHJpbmdzW25vZGVOYW1lc1tpXV0pO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbmV3IEhlYXBHcmFwaChzdHJpbmdNYXAsIG5vZGVUeXBlcywgbm9kZU5hbWVzLCBub2RlU2l6ZXMsXG4gICAgICBmaXJzdEVkZ2VJbmRleGVzLCBlZGdlVHlwZXMsIGVkZ2VOYW1lc09ySW5kZXhlcywgZWRnZVRvTm9kZXMsIHJvb3ROb2RlSW5kZXgpO1xuICB9XG5cbiAgcHVibGljIHJlYWRvbmx5IHN0cmluZ01hcDogU3RyaW5nTWFwO1xuICAvLyBNYXAgZnJvbSBub2RlIGluZGV4ID0+IG5vZGUgdHlwZVxuICBwdWJsaWMgcmVhZG9ubHkgbm9kZVR5cGVzOiBVaW50OEFycmF5O1xuICAvLyBNYXAgZnJvbSBub2RlIGluZGV4ID0+IG5vZGUgbmFtZS5cbiAgcHVibGljIHJlYWRvbmx5IG5vZGVOYW1lczogVWludDMyQXJyYXk7XG4gIC8vIE1hcCBmcm9tIG5vZGUgaW5kZXggPT4gbm9kZSBzaXplLlxuICBwdWJsaWMgcmVhZG9ubHkgbm9kZVNpemVzOiBVaW50MzJBcnJheTtcbiAgLy8gTWFwIGZyb20gTm9kZSBpbmRleCA9PiB0aGUgaW5kZXggb2YgaXRzIGZpcnN0IGVkZ2UgLyB0aGUgbGFzdCBpbmRleCBvZiBJRCAtIDFcbiAgcHVibGljIHJlYWRvbmx5IGZpcnN0RWRnZUluZGV4ZXM6IHtbbjogbnVtYmVyXTogRWRnZUluZGV4fSAmIFVpbnQzMkFycmF5O1xuICAvLyBNYXAgZnJvbSBlZGdlIGluZGV4ID0+IGVkZ2UgdHlwZS5cbiAgcHVibGljIHJlYWRvbmx5IGVkZ2VUeXBlczogVWludDhBcnJheTtcbiAgLy8gTWFwIGZyb20gZWRnZSBpbmRleCA9PiBlZGdlIG5hbWUuXG4gIHB1YmxpYyByZWFkb25seSBlZGdlTmFtZXNPckluZGV4ZXM6IFVpbnQzMkFycmF5O1xuICAvLyBNYXAgZnJvbSBlZGdlIGluZGV4ID0+IGRlc3RpbmF0aW9uIG5vZGUuXG4gIHB1YmxpYyByZWFkb25seSBlZGdlVG9Ob2Rlczoge1tuOiBudW1iZXJdOiBOb2RlSW5kZXh9ICYgVWludDMyQXJyYXk7IC8vIFVpbnQzMkFycmF5XG4gIC8vIEluZGV4IG9mIHRoZSBncmFwaCdzIHJvb3Qgbm9kZS5cbiAgcHVibGljIHJlYWRvbmx5IHJvb3ROb2RlSW5kZXg6IE5vZGVJbmRleDtcbiAgLy8gTGF6aWx5IGluaXRpYWxpemVkIHJldGFpbmVkIHNpemUgYXJyYXkuXG4gIHB1YmxpYyByZWFkb25seSByZXRhaW5lZFNpemU6IFVpbnQzMkFycmF5ID0gbnVsbDtcblxuICBwcml2YXRlIGNvbnN0cnVjdG9yKHN0cmluZ01hcDogU3RyaW5nTWFwLCBub2RlVHlwZXM6IFVpbnQ4QXJyYXksIG5vZGVOYW1lczogVWludDMyQXJyYXksXG4gICAgbm9kZVNpemVzOiBVaW50MzJBcnJheSwgZmlyc3RFZGdlSW5kZXhlczogVWludDMyQXJyYXksIGVkZ2VUeXBlczogVWludDhBcnJheSxcbiAgICBlZGdlTmFtZXNPckluZGV4ZXM6IFVpbnQzMkFycmF5LCBlZGdlVG9Ob2RlczogVWludDMyQXJyYXksIHJvb3ROb2RlSW5kZXg6IE5vZGVJbmRleCkge1xuICAgICAgdGhpcy5zdHJpbmdNYXAgPSBzdHJpbmdNYXA7XG4gICAgICB0aGlzLm5vZGVUeXBlcyA9IG5vZGVUeXBlcztcbiAgICAgIHRoaXMubm9kZU5hbWVzID0gbm9kZU5hbWVzO1xuICAgICAgdGhpcy5ub2RlU2l6ZXMgPSBub2RlU2l6ZXM7XG4gICAgICB0aGlzLmZpcnN0RWRnZUluZGV4ZXMgPSBmaXJzdEVkZ2VJbmRleGVzIGFzIGFueTtcbiAgICAgIHRoaXMuZWRnZVR5cGVzID0gZWRnZVR5cGVzO1xuICAgICAgdGhpcy5lZGdlTmFtZXNPckluZGV4ZXMgPSBlZGdlTmFtZXNPckluZGV4ZXM7XG4gICAgICB0aGlzLmVkZ2VUb05vZGVzID0gZWRnZVRvTm9kZXMgYXMgYW55O1xuICAgICAgdGhpcy5yb290Tm9kZUluZGV4ID0gcm9vdE5vZGVJbmRleDtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgbm9kZUNvdW50KCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMubm9kZVR5cGVzLmxlbmd0aDtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgZWRnZUNvdW50KCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuZWRnZVR5cGVzLmxlbmd0aDtcbiAgfVxuXG4gIHB1YmxpYyBnZXRHbG9iYWxSb290SW5kaWNlcygpOiBudW1iZXJbXSB7XG4gICAgY29uc3QgcnYgPSBuZXcgQXJyYXk8bnVtYmVyPigpO1xuICAgIGNvbnN0IHJvb3QgPSB0aGlzLmdldFJvb3QoKTtcbiAgICBmb3IgKGNvbnN0IGl0ID0gcm9vdC5jaGlsZHJlbjsgaXQuaGFzTmV4dCgpOyBpdC5uZXh0KCkpIHtcbiAgICAgIGNvbnN0IHN1YnJvb3QgPSBpdC5pdGVtKCkudG87XG4gICAgICBpZiAoc3Vicm9vdC50eXBlICE9PSBTbmFwc2hvdE5vZGVUeXBlLlN5bnRoZXRpYykge1xuICAgICAgICBydi5wdXNoKHN1YnJvb3Qubm9kZUluZGV4KTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJ2O1xuICB9XG5cbiAgcHVibGljIGdldFVzZXJSb290SW5kaWNlcygpOiBudW1iZXJbXSB7XG4gICAgY29uc3QgcnYgPSBuZXcgQXJyYXk8bnVtYmVyPigpO1xuICAgIGNvbnN0IHJvb3QgPSB0aGlzLmdldFJvb3QoKTtcbiAgICBmb3IgKGNvbnN0IGl0ID0gcm9vdC5jaGlsZHJlbjsgaXQuaGFzTmV4dCgpOyBpdC5uZXh0KCkpIHtcbiAgICAgIGNvbnN0IHN1YnJvb3QgPSBpdC5pdGVtKCkudG87XG4gICAgICBpZiAoc3Vicm9vdC50eXBlICE9PSBTbmFwc2hvdE5vZGVUeXBlLlN5bnRoZXRpYyB8fCBzdWJyb290Lm5hbWUgPT09IFwiKERvY3VtZW50IERPTSB0cmVlcylcIikge1xuICAgICAgICBydi5wdXNoKHN1YnJvb3Qubm9kZUluZGV4KTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJ2O1xuICB9XG5cbiAgcHVibGljIGdldFJvb3QoKTogTm9kZSB7XG4gICAgcmV0dXJuIG5ldyBOb2RlKHRoaXMucm9vdE5vZGVJbmRleCwgdGhpcyk7XG4gIH1cblxuICBwdWJsaWMgY2FsY3VsYXRlU2l6ZSgpOiBTbmFwc2hvdFNpemVTdW1tYXJ5IHtcbiAgICBjb25zdCBydjogU25hcHNob3RTaXplU3VtbWFyeSA9IHtcbiAgICAgIG51bU5vZGVzOiB0aGlzLm5vZGVDb3VudCxcbiAgICAgIG51bUVkZ2VzOiB0aGlzLmVkZ2VDb3VudCxcbiAgICAgIHRvdGFsU2l6ZTogMCxcbiAgICAgIGhpZGRlblNpemU6IDAsXG4gICAgICBhcnJheVNpemU6IDAsXG4gICAgICBzdHJpbmdTaXplOiAwLFxuICAgICAgb2JqZWN0U2l6ZTogMCxcbiAgICAgIGNvZGVTaXplOiAwLFxuICAgICAgY2xvc3VyZVNpemU6IDAsXG4gICAgICByZWdleHBTaXplOiAwLFxuICAgICAgaGVhcE51bWJlclNpemU6IDAsXG4gICAgICBuYXRpdmVTaXplOiAwLFxuICAgICAgc3ludGhldGljU2l6ZTogMCxcbiAgICAgIGNvbnNTdHJpbmdTaXplOiAwLFxuICAgICAgc2xpY2VkU3RyaW5nU2l6ZTogMCxcbiAgICAgIHN5bWJvbFNpemU6IDAsXG4gICAgICB1bmtub3duU2l6ZTogMFxuICAgIH07XG4gICAgdGhpcy52aXNpdFVzZXJSb290cygobikgPT4ge1xuICAgICAgY29uc3Qgbm9kZVR5cGUgPSBuLnR5cGU7XG4gICAgICBjb25zdCBub2RlU2VsZlNpemUgPSBuLnNpemU7XG4gICAgICBydi50b3RhbFNpemUgKz0gbi5zaXplO1xuICAgICAgc3dpdGNoIChub2RlVHlwZSkge1xuICAgICAgICBjYXNlIFNuYXBzaG90Tm9kZVR5cGUuQXJyYXk6XG4gICAgICAgICAgcnYuYXJyYXlTaXplICs9IG5vZGVTZWxmU2l6ZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBTbmFwc2hvdE5vZGVUeXBlLkNsb3N1cmU6XG4gICAgICAgICAgcnYuY2xvc3VyZVNpemUgKz0gbm9kZVNlbGZTaXplO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFNuYXBzaG90Tm9kZVR5cGUuQ29kZTpcbiAgICAgICAgICBydi5jb2RlU2l6ZSArPSBub2RlU2VsZlNpemU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgU25hcHNob3ROb2RlVHlwZS5Db25zU3RyaW5nOlxuICAgICAgICAgIHJ2LmNvbnNTdHJpbmdTaXplICs9IG5vZGVTZWxmU2l6ZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBTbmFwc2hvdE5vZGVUeXBlLkhlYXBOdW1iZXI6XG4gICAgICAgICAgcnYuaGVhcE51bWJlclNpemUgKz0gbm9kZVNlbGZTaXplO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFNuYXBzaG90Tm9kZVR5cGUuSGlkZGVuOlxuICAgICAgICAgIHJ2LmhpZGRlblNpemUgKz0gbm9kZVNlbGZTaXplO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFNuYXBzaG90Tm9kZVR5cGUuTmF0aXZlOlxuICAgICAgICAgIHJ2Lm5hdGl2ZVNpemUgKz0gbm9kZVNlbGZTaXplO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFNuYXBzaG90Tm9kZVR5cGUuT2JqZWN0OlxuICAgICAgICAgIHJ2Lm9iamVjdFNpemUgKz0gbm9kZVNlbGZTaXplO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFNuYXBzaG90Tm9kZVR5cGUuUmVnRXhwOlxuICAgICAgICAgIHJ2LnJlZ2V4cFNpemUgKz0gbm9kZVNlbGZTaXplO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFNuYXBzaG90Tm9kZVR5cGUuU2xpY2VkU3RyaW5nOlxuICAgICAgICAgIHJ2LnNsaWNlZFN0cmluZ1NpemUgKz0gbm9kZVNlbGZTaXplO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFNuYXBzaG90Tm9kZVR5cGUuU3RyaW5nOlxuICAgICAgICAgIHJ2LnN0cmluZ1NpemUgKz0gbm9kZVNlbGZTaXplO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFNuYXBzaG90Tm9kZVR5cGUuU3ltYm9sOlxuICAgICAgICAgIHJ2LnN5bWJvbFNpemUgKz0gbm9kZVNlbGZTaXplO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFNuYXBzaG90Tm9kZVR5cGUuU3ludGhldGljOlxuICAgICAgICAgIHJ2LnN5bnRoZXRpY1NpemUgKz0gbm9kZVNlbGZTaXplO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFNuYXBzaG90Tm9kZVR5cGUuVW5yZXNvbHZlZDpcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBydi51bmtub3duU2l6ZSArPSBub2RlU2VsZlNpemU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHJ2O1xuICB9XG5cbiAgcHVibGljIHZpc2l0Um9vdCh2aXNpdG9yOiAobjogTm9kZSkgPT4gdm9pZCwgZmlsdGVyOiAobjogTm9kZSwgZTogRWRnZSkgPT4gYm9vbGVhbiA9IG5vbldlYWtGaWx0ZXIpOiB2b2lkIHtcbiAgICBiZnNWaXNpdG9yKHRoaXMsIFt0aGlzLnJvb3ROb2RlSW5kZXhdLCB2aXNpdG9yLCBmaWx0ZXIpO1xuICB9XG5cbiAgcHVibGljIHZpc2l0VXNlclJvb3RzKHZpc2l0b3I6IChuOiBOb2RlKSA9PiB2b2lkLCBmaWx0ZXI6IChuOiBOb2RlLCBlOiBFZGdlKSA9PiBib29sZWFuID0gbm9uV2Vha0ZpbHRlcikge1xuICAgIGJmc1Zpc2l0b3IodGhpcywgdGhpcy5nZXRVc2VyUm9vdEluZGljZXMoKSwgdmlzaXRvciwgZmlsdGVyKTtcbiAgfVxuXG4gIHB1YmxpYyB2aXNpdEdsb2JhbFJvb3RzKHZpc2l0b3I6IChuOiBOb2RlKSA9PiB2b2lkLCBmaWx0ZXI6IChuOiBOb2RlLCBlOiBFZGdlKSA9PiBib29sZWFuID0gbm9uV2Vha0ZpbHRlcikge1xuICAgIGJmc1Zpc2l0b3IodGhpcywgdGhpcy5nZXRHbG9iYWxSb290SW5kaWNlcygpLCB2aXNpdG9yLCBmaWx0ZXIpO1xuICB9XG5cbiAgcHVibGljIHZpc2l0R2xvYmFsRWRnZXModmlzaXRvcjogKGU6IEVkZ2UsIGdldFBhdGg6ICgpID0+IEVkZ2VbXSkgPT4gdm9pZCwgZmlsdGVyOiAobjogTm9kZSwgZTogRWRnZSkgPT4gYm9vbGVhbiA9IG5vbldlYWtGaWx0ZXIpOiB2b2lkIHtcbiAgICBsZXQgaW5pdGlhbCA9IG5ldyBBcnJheTxudW1iZXI+KCk7XG4gICAgY29uc3Qgcm9vdCA9IHRoaXMuZ2V0Um9vdCgpO1xuICAgIGZvciAoY29uc3QgaXQgPSByb290LmNoaWxkcmVuOyBpdC5oYXNOZXh0KCk7IGl0Lm5leHQoKSkge1xuICAgICAgY29uc3QgZWRnZSA9IGl0Lml0ZW0oKTtcbiAgICAgIGNvbnN0IHN1YnJvb3QgPSBlZGdlLnRvO1xuICAgICAgaWYgKHN1YnJvb3QudHlwZSAhPT0gU25hcHNob3ROb2RlVHlwZS5TeW50aGV0aWMpIHtcbiAgICAgICAgaW5pdGlhbC5wdXNoKGVkZ2UuZWRnZUluZGV4KTtcbiAgICAgIH1cbiAgICB9XG4gICAgYmZzRWRnZVZpc2l0b3IodGhpcywgaW5pdGlhbCwgdmlzaXRvciwgZmlsdGVyKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBub25XZWFrRmlsdGVyKG46IE5vZGUsIGU6IEVkZ2UpOiBib29sZWFuIHtcbiAgcmV0dXJuIGUuc25hcHNob3RUeXBlICE9PSBTbmFwc2hvdEVkZ2VUeXBlLldlYWs7XG59XG5cbmZ1bmN0aW9uIG5vcEZpbHRlcihuOiBOb2RlLCBlOiBFZGdlKTogYm9vbGVhbiB7XG4gIHJldHVybiB0cnVlO1xufVxuXG4vKipcbiAqIFZpc2l0IGVkZ2VzIC8gcGF0aHMgaW4gdGhlIGdyYXBoIGluIGEgYnJlYWR0aC1maXJzdC1zZWFyY2guXG4gKiBAcGFyYW0gZyBUaGUgaGVhcCBncmFwaCB0byB2aXNpdC5cbiAqIEBwYXJhbSBpbml0aWFsIEluaXRpYWwgZWRnZSBpbmRpY2VzIHRvIHZpc2l0LlxuICogQHBhcmFtIHZpc2l0b3IgVmlzaXRvciBmdW5jdGlvbi4gQ2FsbGVkIG9uIGV2ZXJ5IHVuaXF1ZSBlZGdlIHZpc2l0ZWQuXG4gKiBAcGFyYW0gZmlsdGVyIEZpbHRlciBmdW5jdGlvbi4gQ2FsbGVkIG9uIGV2ZXJ5IGVkZ2UuIElmIGZhbHNlLCB2aXNpdG9yIGRvZXMgbm90IHZpc2l0IGVkZ2UuXG4gKi9cbmZ1bmN0aW9uIGJmc0VkZ2VWaXNpdG9yKGc6IEhlYXBHcmFwaCwgaW5pdGlhbDogbnVtYmVyW10sIHZpc2l0b3I6IChlOiBFZGdlLCBnZXRQYXRoOiAoKSA9PiBFZGdlW10pID0+IHZvaWQsIGZpbHRlcjogKG46IE5vZGUsIGU6IEVkZ2UpID0+IGJvb2xlYW4gPSBub3BGaWx0ZXIpOiB2b2lkIHtcbiAgY29uc3QgdmlzaXRCaXRzID0gbmV3IE9uZUJpdEFycmF5KGcuZWRnZUNvdW50KTtcbiAgLy8gRXZlcnkgZWRnZSBpcyBhIHBhaXI6IFtwcmV2aW91c0VkZ2UsIGVkZ2VJbmRleF0uXG4gIC8vIENhbiBmb2xsb3cgbGlua2VkIGxpc3QgdG8gcmVjb25zdHJ1Y3QgcGF0aC5cbiAgLy8gSW5kZXggMCBpcyBcInJvb3RcIi5cbiAgY29uc3QgZWRnZXNUb1Zpc2l0ID0gbmV3IFVpbnQzMkFycmF5KChnLmVkZ2VDb3VudCArIDEpIDw8IDEpO1xuICAvLyBMZWF2ZSBmaXJzdCBlbnRyeSBibGFuayBhcyBhIGNhdGNoLWFsbCByb290LlxuICBsZXQgZWRnZXNUb1Zpc2l0TGVuZ3RoID0gMjtcbiAgbGV0IGluZGV4ID0gMjtcblxuICBmdW5jdGlvbiBlbnF1ZXVlKHByZXZJbmRleDogbnVtYmVyLCBlZGdlSW5kZXg6IG51bWJlcik6IHZvaWQge1xuICAgIGVkZ2VzVG9WaXNpdFtlZGdlc1RvVmlzaXRMZW5ndGgrK10gPSBwcmV2SW5kZXg7XG4gICAgZWRnZXNUb1Zpc2l0W2VkZ2VzVG9WaXNpdExlbmd0aCsrXSA9IGVkZ2VJbmRleDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGRlcXVldWUoKTogRWRnZUluZGV4IHtcbiAgICAvLyBJZ25vcmUgdGhlIHByZXYgZWRnZSBsaW5rLlxuICAgIGluZGV4Kys7XG4gICAgcmV0dXJuIGVkZ2VzVG9WaXNpdFtpbmRleCsrXSBhcyBFZGdlSW5kZXg7XG4gIH1cblxuICBpbml0aWFsLmZvckVhY2goKGkpID0+IHtcbiAgICBlbnF1ZXVlKDAsIGkpO1xuICAgIHZpc2l0Qml0cy5zZXQoaSwgdHJ1ZSk7XG4gIH0pO1xuXG4gIGZ1bmN0aW9uIGluZGV4VG9FZGdlKGluZGV4OiBudW1iZXIpOiBFZGdlIHtcbiAgICByZXR1cm4gbmV3IEVkZ2UoaW5kZXggYXMgRWRnZUluZGV4LCBnKTtcbiAgfVxuXG4gIGxldCBjdXJyZW50RW50cnlJbmRleCA9IGluZGV4O1xuICBmdW5jdGlvbiBnZXRQYXRoKCk6IEVkZ2VbXSB7XG4gICAgbGV0IHBJbmRleCA9IGN1cnJlbnRFbnRyeUluZGV4O1xuICAgIGxldCBwYXRoID0gbmV3IEFycmF5PG51bWJlcj4oKTtcbiAgICB3aGlsZSAocEluZGV4ICE9PSAwKSB7XG4gICAgICBwYXRoLnB1c2goZWRnZXNUb1Zpc2l0W3BJbmRleCArIDFdKTtcbiAgICAgIHBJbmRleCA9IGVkZ2VzVG9WaXNpdFtwSW5kZXhdO1xuICAgIH1cbiAgICByZXR1cm4gcGF0aC5yZXZlcnNlKCkubWFwKGluZGV4VG9FZGdlKTtcbiAgfVxuXG4gIGNvbnN0IG5vZGUgPSBuZXcgTm9kZSgwIGFzIE5vZGVJbmRleCwgZyk7XG4gIGNvbnN0IGVkZ2UgPSBuZXcgRWRnZSgwIGFzIEVkZ2VJbmRleCwgZyk7XG4gIHdoaWxlIChpbmRleCA8IGVkZ2VzVG9WaXNpdExlbmd0aCkge1xuICAgIGN1cnJlbnRFbnRyeUluZGV4ID0gaW5kZXg7XG4gICAgZWRnZS5lZGdlSW5kZXggPSBkZXF1ZXVlKCk7XG4gICAgdmlzaXRvcihlZGdlLCBnZXRQYXRoKTtcbiAgICBub2RlLm5vZGVJbmRleCA9IGVkZ2UudG9JbmRleDtcbiAgICBmb3IgKGNvbnN0IGl0ID0gbm9kZS5jaGlsZHJlbjsgaXQuaGFzTmV4dCgpOyBpdC5uZXh0KCkpIHtcbiAgICAgIGNvbnN0IGNoaWxkID0gaXQuaXRlbSgpO1xuICAgICAgaWYgKCF2aXNpdEJpdHMuZ2V0KGNoaWxkLmVkZ2VJbmRleCkgJiYgZmlsdGVyKG5vZGUsIGNoaWxkKSkge1xuICAgICAgICB2aXNpdEJpdHMuc2V0KGNoaWxkLmVkZ2VJbmRleCwgdHJ1ZSk7XG4gICAgICAgIGVucXVldWUoY3VycmVudEVudHJ5SW5kZXgsIGNoaWxkLmVkZ2VJbmRleCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogVmlzaXQgdGhlIGdyYXBoIGluIGEgYnJlYWR0aC1maXJzdC1zZWFyY2guXG4gKiBAcGFyYW0gZyBUaGUgaGVhcCBncmFwaCB0byB2aXNpdC5cbiAqIEBwYXJhbSBpbml0aWFsIEluaXRpYWwgbm9kZShzKSB0byB2aXNpdC5cbiAqIEBwYXJhbSB2aXNpdG9yIFZpc2l0b3IgZnVuY3Rpb24uIENhbGxlZCBvbiBldmVyeSB1bmlxdWUgbm9kZSB2aXNpdGVkLlxuICogQHBhcmFtIGZpbHRlciBGaWx0ZXIgZnVuY3Rpb24uIENhbGxlZCBvbiBldmVyeSBlZGdlLiBJZiBmYWxzZSwgdmlzaXRvciBkb2VzIG5vdCB2aXNpdCBlZGdlLlxuICovXG5mdW5jdGlvbiBiZnNWaXNpdG9yKGc6IEhlYXBHcmFwaCwgaW5pdGlhbDogbnVtYmVyW10sIHZpc2l0b3I6IChuOiBOb2RlKSA9PiB2b2lkLCBmaWx0ZXI6IChuOiBOb2RlLCBlOiBFZGdlKSA9PiBib29sZWFuID0gbm9wRmlsdGVyKTogdm9pZCB7XG4gIGNvbnN0IHZpc2l0Qml0cyA9IG5ldyBPbmVCaXRBcnJheShnLm5vZGVDb3VudCk7XG4gIGNvbnN0IG5vZGVzVG9WaXNpdDoge1tuOiBudW1iZXJdOiBOb2RlSW5kZXh9ICYgVWludDMyQXJyYXkgPSA8YW55PiBuZXcgVWludDMyQXJyYXkoZy5ub2RlQ291bnQpO1xuICBsZXQgbm9kZXNUb1Zpc2l0TGVuZ3RoID0gMDtcbiAgZnVuY3Rpb24gZW5xdWV1ZShub2RlSW5kZXg6IE5vZGVJbmRleCk6IHZvaWQge1xuICAgIG5vZGVzVG9WaXNpdFtub2Rlc1RvVmlzaXRMZW5ndGgrK10gPSBub2RlSW5kZXg7XG4gIH1cblxuICBsZXQgaW5kZXggPSAwO1xuICBpbml0aWFsLm1hcChlbnF1ZXVlKTtcbiAgaW5pdGlhbC5mb3JFYWNoKChpKSA9PiB2aXNpdEJpdHMuc2V0KGksIHRydWUpKTtcblxuICBjb25zdCBub2RlID0gbmV3IE5vZGUoMCBhcyBOb2RlSW5kZXgsIGcpO1xuICBjb25zdCBlZGdlID0gbmV3IEVkZ2UoMCBhcyBFZGdlSW5kZXgsIGcpO1xuICB3aGlsZSAoaW5kZXggPCBub2Rlc1RvVmlzaXRMZW5ndGgpIHtcbiAgICBjb25zdCBub2RlSW5kZXggPSBub2Rlc1RvVmlzaXRbaW5kZXgrK107XG4gICAgbm9kZS5ub2RlSW5kZXggPSBub2RlSW5kZXg7XG4gICAgdmlzaXRvcihub2RlKTtcbiAgICBjb25zdCBmaXJzdEVkZ2VJbmRleCA9IGcuZmlyc3RFZGdlSW5kZXhlc1tub2RlSW5kZXhdO1xuICAgIGNvbnN0IGVkZ2VzRW5kID0gZy5maXJzdEVkZ2VJbmRleGVzW25vZGVJbmRleCArIDFdO1xuICAgIGZvciAobGV0IGVkZ2VJbmRleCA9IGZpcnN0RWRnZUluZGV4OyBlZGdlSW5kZXggPCBlZGdlc0VuZDsgZWRnZUluZGV4KyspIHtcbiAgICAgIGNvbnN0IGNoaWxkTm9kZUluZGV4ID0gZy5lZGdlVG9Ob2Rlc1tlZGdlSW5kZXhdO1xuICAgICAgZWRnZS5lZGdlSW5kZXggPSBlZGdlSW5kZXg7XG4gICAgICBpZiAoIXZpc2l0Qml0cy5nZXQoY2hpbGROb2RlSW5kZXgpICYmIGZpbHRlcihub2RlLCBlZGdlKSkge1xuICAgICAgICB2aXNpdEJpdHMuc2V0KGNoaWxkTm9kZUluZGV4LCB0cnVlKTtcbiAgICAgICAgZW5xdWV1ZShjaGlsZE5vZGVJbmRleCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG4iXX0=