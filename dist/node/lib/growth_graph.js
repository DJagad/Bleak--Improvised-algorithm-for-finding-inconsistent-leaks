"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("../common/util");
const leak_root_1 = require("./leak_root");
/**
 * Represents a link in a heap path. Specified as a simple class to make it quick to construct and JSONable.
 * TODO: Better terminology?
 */
class PathSegment {
    constructor(type, indexOrName) {
        this.type = type;
        this.indexOrName = indexOrName;
    }
}
/**
 * Converts an edge into a heap path segment.
 * @param edge
 */
function edgeToIPathSegment(edge) {
    const pst = edge.pathSegmentType;
    const name = pst === 3 /* CLOSURE */ ? "__scope__" : edge.indexOrName;
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
function toPathTree(leakroots) {
    const tree = [];
    function addPath(p, id, index = 0, children = tree) {
        if (p.length === 0) {
            return;
        }
        const pathSegment = p[index];
        const indexOrName = pathSegment.indexOrName;
        const matches = children.filter((c) => c.indexOrName === indexOrName);
        let recur;
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
        const next = index + 1;
        if (next === p.length) {
            recur.isGrowing = true;
            recur.id = id;
        }
        else {
            addPath(p, id, next, recur.children);
        }
    }
    leakroots.forEach((lr) => {
        lr.paths.forEach((p) => {
            addPath(p, lr.id);
        });
    });
    return tree;
}
exports.toPathTree = toPathTree;
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
    const numNewNodes = newG.nodeCount;
    let index = 0;
    // We visit each new node at most once, forming an upper bound on the queue length.
    // Pre-allocate for better performance.
    let queue = new Uint32Array(numNewNodes << 1);
    // Stores the length of queue.
    let queueLength = 0;
    // Only store visit bits for the new graph.
    const visitBits = new util_1.OneBitArray(numNewNodes);
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
    const oldNode = new Node(0, oldG);
    const newNode = new Node(0, newG);
    const oldEdgeTmp = new Edge(0, oldG);
    {
        // Visit global roots by *node name*, not *edge name* as edges are arbitrarily numbered from the root node.
        // These global roots correspond to different JavaScript contexts (e.g. IFrames).
        const newUserRoots = newG.getGlobalRootIndices();
        const oldUserRoots = oldG.getGlobalRootIndices();
        const m = new Map();
        for (let i = 0; i < newUserRoots.length; i++) {
            newNode.nodeIndex = newUserRoots[i];
            const name = newNode.name;
            let a = m.get(name);
            if (!a) {
                a = { o: [], n: [] };
                m.set(name, a);
            }
            a.n.push(newUserRoots[i]);
        }
        for (let i = 0; i < oldUserRoots.length; i++) {
            oldNode.nodeIndex = oldUserRoots[i];
            const name = oldNode.name;
            let a = m.get(name);
            if (a) {
                a.o.push(oldUserRoots[i]);
            }
        }
        m.forEach((v) => {
            let num = Math.min(v.o.length, v.n.length);
            for (let i = 0; i < num; i++) {
                enqueue(v.o[i], v.n[i]);
                visitBits.set(v.n[i], true);
            }
        });
    }
    // The main loop, which is the essence of PropagateGrowth.
    while (index < queueLength) {
        const oldIndex = dequeue();
        const newIndex = dequeue();
        oldNode.nodeIndex = oldIndex;
        newNode.nodeIndex = newIndex;
        const oldNodeGrowthStatus = oldGrowth.get(oldIndex);
        // Nodes are either 'New', 'Growing', or 'Not Growing'.
        // Nodes begin as 'New', and transition to 'Growing' or 'Not Growing' after a snapshot.
        // So if a node is neither new nor consistently growing, we don't care about it.
        if ((oldNodeGrowthStatus === 0 /* NEW */ || oldNodeGrowthStatus === 2 /* GROWING */) && oldNode.numProperties() < newNode.numProperties()) {
            newGrowth.set(newIndex, 2 /* GROWING */);
        }
        // Visit shared children.
        const oldEdges = new Map();
        if (oldNode.hasChildren) {
            for (const it = oldNode.children; it.hasNext(); it.next()) {
                const oldChildEdge = it.item();
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
            for (const it = newNode.children; it.hasNext(); it.next()) {
                const newChildEdge = it.item();
                const oldEdge = oldEdges.get(hash(newNode, newChildEdge));
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
class HeapGrowthTracker {
    constructor() {
        this._stringMap = new StringMap();
        this._heap = null;
        this._growthStatus = null;
        // DEBUG INFO; this information is shown in a heap explorer tool.
        this._leakRefs = null;
        this._nonLeakVisits = null;
    }
    async addSnapshot(parser) {
        const heap = await HeapGraph.Construct(parser, this._stringMap);
        const growthStatus = new util_1.TwoBitArray(heap.nodeCount);
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
    }
    getGraph() {
        return this._heap;
    }
    /**
     * Implements FindLeakPaths (Figure 5 in the paper) and CalculateLeakShare (Figure 6 in the paper),
     * as well as calculations for Retained Size and Transitive Closure Size (which we compare against in the paper).
     *
     * Returns paths through the heap to leaking nodes, along with multiple different types of scores to help
     * developers prioritize them, grouped by the leak root responsible.
     */
    findLeakPaths() {
        // A map from growing nodes to heap paths that reference them.
        const growthPaths = new Map();
        // Adds a given path to growthPaths.
        function addPath(e) {
            const to = e[e.length - 1].toIndex;
            let paths = growthPaths.get(to);
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
        this._heap.visitGlobalEdges((e, getPath) => {
            if (this._growthStatus.get(e.toIndex) === 2 /* GROWING */) {
                addPath(getPath());
            }
        }, filterNoDom);
        // Now, calculate growth metrics!
        // Mark items that are reachable by non-leaks.
        const nonleakVisitBits = new util_1.OneBitArray(this._heap.nodeCount);
        this._heap.visitUserRoots((n) => {
            nonleakVisitBits.set(n.nodeIndex, true);
        }, (n, e) => {
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
        const leakReferences = new Uint16Array(this._heap.nodeCount);
        growthPaths.forEach((paths, growthNodeIndex) => {
            bfsVisitor(this._heap, [growthNodeIndex], (n) => {
                leakReferences[n.nodeIndex]++;
            }, nonLeakFilter);
        });
        // Calculate final growth metrics (LeakShare, Retained Size, Transitive Closure Size)
        // for each LeakPath, and construct LeakRoot objects representing each LeakRoot.
        let rv = new Array();
        growthPaths.forEach((paths, growthNodeIndex) => {
            let retainedSize = 0;
            let leakShare = 0;
            let transitiveClosureSize = 0;
            let ownedObjects = 0;
            bfsVisitor(this._heap, [growthNodeIndex], (n) => {
                const refCount = leakReferences[n.nodeIndex];
                if (refCount === 1) {
                    // A refCount of 1 means the heap item is uniquely referenced by this leak,
                    // so it contributes to retainedSize.
                    retainedSize += n.size;
                    ownedObjects++;
                }
                leakShare += n.size / refCount;
            }, nonLeakFilter);
            // Transitive closure size, for comparison to related work.
            bfsVisitor(this._heap, [growthNodeIndex], (n) => {
                transitiveClosureSize += n.size;
            }, filterIncludeDom);
            rv.push(new leak_root_1.default(growthNodeIndex, paths.map(edgePathToPath), {
                retainedSize,
                leakShare,
                transitiveClosureSize,
                ownedObjects
            }));
        });
        // DEBUG
        this._leakRefs = leakReferences;
        this._nonLeakVisits = nonleakVisitBits;
        return rv;
    }
    isGrowing(nodeIndex) {
        return this._growthStatus.get(nodeIndex) === 2 /* GROWING */;
    }
}
exports.HeapGrowthTracker = HeapGrowthTracker;
/**
 * Map from ID => string.
 */
class StringMap {
    constructor() {
        this._map = new Map();
        this._strings = new Array();
    }
    get(s) {
        const map = this._map;
        let id = map.get(s);
        if (id === undefined) {
            id = this._strings.push(s) - 1;
            map.set(s, id);
        }
        return id;
    }
    fromId(i) {
        return this._strings[i];
    }
}
/**
 * Edge mirror
 */
class Edge {
    constructor(i, heap) {
        this.edgeIndex = i;
        this._heap = heap;
    }
    get to() {
        return new Node(this._heap.edgeToNodes[this.edgeIndex], this._heap);
    }
    get size() {
        const k = new Node(this._heap.edgeToNodes[this.edgeIndex], this._heap);
        return (k.size);
    }
    get toIndex() {
        return this._heap.edgeToNodes[this.edgeIndex];
    }
    get snapshotType() {
        return this._heap.edgeTypes[this.edgeIndex];
    }
    /**
     * Returns the index (number) or name (string) that this edge
     * corresponds to. (Index types occur in Arrays.)
     */
    get indexOrName() {
        const nameOrIndex = this._heap.edgeNamesOrIndexes[this.edgeIndex];
        if (this._isIndex()) {
            return nameOrIndex;
        }
        else {
            return this._heap.stringMap.fromId(nameOrIndex);
        }
    }
    /**
     * Returns 'true' if the edge corresponds to a type where nameOrIndex is an index,
     * and false otherwise.
     */
    _isIndex() {
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
                throw new Error(`Unrecognized edge type: ${this.snapshotType}`);
        }
    }
    /**
     * Determines what type of edge this is in a heap path.
     * Recognizes some special BLeak-inserted heap edges that correspond
     * to hidden browser state.
     */
    get pathSegmentType() {
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
                const name = this.indexOrName;
                switch (name) {
                    case '$$$DOM$$$':
                        return 6 /* DOM_TREE */;
                    case '$$listeners':
                        return 5 /* EVENT_LISTENER_LIST */;
                    default:
                        return 1 /* PROPERTY */;
                }
            }
        }
        console.debug(`Unrecognized edge type: ${this.snapshotType}`);
        return 7 /* UNKNOWN */;
    }
}
exports.Edge = Edge;
class EdgeIterator {
    constructor(heap, edgeStart, edgeEnd) {
        this._edge = new Edge(edgeStart, heap);
        this._edgeEnd = edgeEnd;
    }
    hasNext() {
        return this._edge.edgeIndex < this._edgeEnd;
    }
    next() {
        this._edge.edgeIndex++;
    }
    item() {
        return this._edge;
    }
}
/**
 * Node mirror.
 */
class Node {
    constructor(i, heap) {
        this.nodeIndex = i;
        this._heap = heap;
    }
    get type() {
        return this._heap.nodeTypes[this.nodeIndex];
    }
    get size() {
        return this._heap.nodeSizes[this.nodeIndex];
    }
    get hasChildren() {
        return this.childrenLength !== 0;
    }
    get name() {
        return this._heap.stringMap.fromId(this._heap.nodeNames[this.nodeIndex]);
    }
    get childrenLength() {
        const fei = this._heap.firstEdgeIndexes;
        return fei[this.nodeIndex + 1] - fei[this.nodeIndex];
    }
    get children() {
        const fei = this._heap.firstEdgeIndexes;
        return new EdgeIterator(this._heap, fei[this.nodeIndex], fei[this.nodeIndex + 1]);
    }
    getChild(i) {
        const fei = this._heap.firstEdgeIndexes;
        const index = fei[this.nodeIndex] + i;
        if (index >= fei[this.nodeIndex + 1]) {
            throw new Error(`Invalid child.`);
        }
        return new Edge(index, this._heap);
    }
    getRetainedSize() {
        //Now we know the size of the node now taking the sizes for the childs so fot that we will be using the above code
        let siz = this._heap.nodeSizes[this.nodeIndex];
        //Getting the first Edges for the Nodes
        let fei = this._heap.firstEdgeIndexes;
        //Now Finding the number of edges for the given node
        let fei_1 = fei[this.nodeIndex + 1] - fei[this.nodeIndex];
        //Initialization of f_size
        let f_size = 0;
        //Calling loop for calculating Nodes
        for (let i = 1; i <= fei_1; i++) {
            //Now index will be called to store the Edge Index
            const index = fei[this.nodeIndex] + i;
            //This will make edge for const ind
            const ind = new Edge(index, this._heap);
            //Now we will create the edges to node and find their size
            const num = ind.size;
            //Now seeing the edge mirror converting the edges 
            f_size = siz + num;
        }
        return (f_size);
    }
    /**
     * Measures the number of properties on the node.
     * May require traversing hidden children.
     * This is the growth metric we use.
     */
    numProperties() {
        let count = 0;
        if (this.hasChildren) {
            for (const it = this.children; it.hasNext(); it.next()) {
                const child = it.item();
                switch (child.snapshotType) {
                    case 3 /* Internal */:
                        switch (child.indexOrName) {
                            case "elements": {
                                // Contains numerical properties, including those of
                                // arrays and objects.
                                const elements = child.to;
                                // Only count if no children.
                                if (!elements.hasChildren) {
                                    count += Math.floor(elements.size / 8);
                                }
                                break;
                            }
                            case "table": {
                                // Contains Map and Set object entries.
                                const table = child.to;
                                if (table.hasChildren) {
                                    count += table.childrenLength;
                                }
                                break;
                            }
                            case "properties": {
                                // Contains expando properties on DOM nodes,
                                // properties storing numbers on objects,
                                // etc.
                                const props = child.to;
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
    }
}
/**
 * Represents a heap snapshot / heap graph.
 */
class HeapGraph {
    constructor(stringMap, nodeTypes, nodeNames, nodeSizes, firstEdgeIndexes, edgeTypes, edgeNamesOrIndexes, edgeToNodes, rootNodeIndex) {
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
    static async Construct(parser, stringMap = new StringMap()) {
        const firstChunk = await parser.read();
        if (firstChunk.type !== 1 /* SNAPSHOT */) {
            throw new Error(`First chunk does not contain snapshot property.`);
        }
        const snapshotInfo = firstChunk.data;
        const meta = snapshotInfo.meta;
        const nodeFields = meta.node_fields;
        const nodeLength = nodeFields.length;
        const rootNodeIndex = (snapshotInfo.root_index ? snapshotInfo.root_index / nodeLength : 0);
        const nodeCount = snapshotInfo.node_count;
        const edgeCount = snapshotInfo.edge_count;
        const nodeTypes = new Uint8Array(nodeCount);
        const nodeNames = new Uint32Array(nodeCount);
        const nodeSizes = new Uint32Array(nodeCount);
        const firstEdgeIndexes = new Uint32Array(nodeCount + 1);
        const edgeTypes = new Uint8Array(edgeCount);
        const edgeNamesOrIndexes = new Uint32Array(edgeCount);
        const edgeToNodes = new Uint32Array(edgeCount);
        {
            const nodeTypeOffset = nodeFields.indexOf("type");
            const nodeNameOffset = nodeFields.indexOf("name");
            const nodeSelfSizeOffset = nodeFields.indexOf("self_size");
            const nodeEdgeCountOffset = nodeFields.indexOf("edge_count");
            const edgeFields = meta.edge_fields;
            const edgeLength = edgeFields.length;
            const edgeTypeOffset = edgeFields.indexOf("type");
            const edgeNameOrIndexOffset = edgeFields.indexOf("name_or_index");
            const edgeToNodeOffset = edgeFields.indexOf("to_node");
            let strings = [];
            let nodePtr = 0;
            let edgePtr = 0;
            let nextEdge = 0;
            while (true) {
                const chunk = await parser.read();
                if (chunk === null) {
                    break;
                }
                switch (chunk.type) {
                    case 2 /* NODES */: {
                        const data = chunk.data;
                        const dataLen = data.length;
                        const dataNodeCount = dataLen / nodeLength;
                        if (dataLen % nodeLength !== 0) {
                            throw new Error(`Expected chunk to contain whole nodes. Instead, contained ${dataNodeCount} nodes.`);
                        }
                        // Copy data into our typed arrays.
                        for (let i = 0; i < dataNodeCount; i++) {
                            const dataBase = i * nodeLength;
                            const arrayBase = nodePtr + i;
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
                        const data = chunk.data;
                        const dataLen = data.length;
                        const dataEdgeCount = dataLen / edgeLength;
                        if (dataLen % edgeLength !== 0) {
                            throw new Error(`Expected chunk to contain whole nodes. Instead, contained ${dataEdgeCount} nodes.`);
                        }
                        // Copy data into our typed arrays.
                        for (let i = 0; i < dataEdgeCount; i++) {
                            const dataBase = i * edgeLength;
                            const arrayBase = edgePtr + i;
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
                        throw new Error(`Unexpected snapshot chunk: ${chunk.type}.`);
                }
            }
            // Process edgeNameOrIndex now.
            for (let i = 0; i < edgeCount; i++) {
                const edgeType = edgeTypes[i];
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
                        throw new Error(`Unrecognized edge type: ${edgeType}`);
                }
            }
            firstEdgeIndexes[nodeCount] = edgeCount;
            // Process nodeNames now.
            for (let i = 0; i < nodeCount; i++) {
                nodeNames[i] = stringMap.get(strings[nodeNames[i]]);
            }
        }
        return new HeapGraph(stringMap, nodeTypes, nodeNames, nodeSizes, firstEdgeIndexes, edgeTypes, edgeNamesOrIndexes, edgeToNodes, rootNodeIndex);
    }
    get nodeCount() {
        return this.nodeTypes.length;
    }
    get edgeCount() {
        return this.edgeTypes.length;
    }
    getGlobalRootIndices() {
        const rv = new Array();
        const root = this.getRoot();
        for (const it = root.children; it.hasNext(); it.next()) {
            const subroot = it.item().to;
            if (subroot.type !== 9 /* Synthetic */) {
                rv.push(subroot.nodeIndex);
            }
        }
        return rv;
    }
    getUserRootIndices() {
        const rv = new Array();
        const root = this.getRoot();
        for (const it = root.children; it.hasNext(); it.next()) {
            const subroot = it.item().to;
            if (subroot.type !== 9 /* Synthetic */ || subroot.name === "(Document DOM trees)") {
                rv.push(subroot.nodeIndex);
            }
        }
        return rv;
    }
    getRoot() {
        return new Node(this.rootNodeIndex, this);
    }
    calculateSize() {
        const rv = {
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
        this.visitUserRoots((n) => {
            const nodeType = n.type;
            const nodeSelfSize = n.size;
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
    }
    visitRoot(visitor, filter = nonWeakFilter) {
        bfsVisitor(this, [this.rootNodeIndex], visitor, filter);
    }
    visitUserRoots(visitor, filter = nonWeakFilter) {
        bfsVisitor(this, this.getUserRootIndices(), visitor, filter);
    }
    visitGlobalRoots(visitor, filter = nonWeakFilter) {
        bfsVisitor(this, this.getGlobalRootIndices(), visitor, filter);
    }
    visitGlobalEdges(visitor, filter = nonWeakFilter) {
        let initial = new Array();
        const root = this.getRoot();
        for (const it = root.children; it.hasNext(); it.next()) {
            const edge = it.item();
            const subroot = edge.to;
            if (subroot.type !== 9 /* Synthetic */) {
                initial.push(edge.edgeIndex);
            }
        }
        bfsEdgeVisitor(this, initial, visitor, filter);
    }
}
exports.HeapGraph = HeapGraph;
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
function bfsEdgeVisitor(g, initial, visitor, filter = nopFilter) {
    const visitBits = new util_1.OneBitArray(g.edgeCount);
    // Every edge is a pair: [previousEdge, edgeIndex].
    // Can follow linked list to reconstruct path.
    // Index 0 is "root".
    const edgesToVisit = new Uint32Array((g.edgeCount + 1) << 1);
    // Leave first entry blank as a catch-all root.
    let edgesToVisitLength = 2;
    let index = 2;
    function enqueue(prevIndex, edgeIndex) {
        edgesToVisit[edgesToVisitLength++] = prevIndex;
        edgesToVisit[edgesToVisitLength++] = edgeIndex;
    }
    function dequeue() {
        // Ignore the prev edge link.
        index++;
        return edgesToVisit[index++];
    }
    initial.forEach((i) => {
        enqueue(0, i);
        visitBits.set(i, true);
    });
    function indexToEdge(index) {
        return new Edge(index, g);
    }
    let currentEntryIndex = index;
    function getPath() {
        let pIndex = currentEntryIndex;
        let path = new Array();
        while (pIndex !== 0) {
            path.push(edgesToVisit[pIndex + 1]);
            pIndex = edgesToVisit[pIndex];
        }
        return path.reverse().map(indexToEdge);
    }
    const node = new Node(0, g);
    const edge = new Edge(0, g);
    while (index < edgesToVisitLength) {
        currentEntryIndex = index;
        edge.edgeIndex = dequeue();
        visitor(edge, getPath);
        node.nodeIndex = edge.toIndex;
        for (const it = node.children; it.hasNext(); it.next()) {
            const child = it.item();
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
function bfsVisitor(g, initial, visitor, filter = nopFilter) {
    const visitBits = new util_1.OneBitArray(g.nodeCount);
    const nodesToVisit = new Uint32Array(g.nodeCount);
    let nodesToVisitLength = 0;
    function enqueue(nodeIndex) {
        nodesToVisit[nodesToVisitLength++] = nodeIndex;
    }
    let index = 0;
    initial.map(enqueue);
    initial.forEach((i) => visitBits.set(i, true));
    const node = new Node(0, g);
    const edge = new Edge(0, g);
    while (index < nodesToVisitLength) {
        const nodeIndex = nodesToVisit[index++];
        node.nodeIndex = nodeIndex;
        visitor(node);
        const firstEdgeIndex = g.firstEdgeIndexes[nodeIndex];
        const edgesEnd = g.firstEdgeIndexes[nodeIndex + 1];
        for (let edgeIndex = firstEdgeIndex; edgeIndex < edgesEnd; edgeIndex++) {
            const childNodeIndex = g.edgeToNodes[edgeIndex];
            edge.edgeIndex = edgeIndex;
            if (!visitBits.get(childNodeIndex) && filter(node, edge)) {
                visitBits.set(childNodeIndex, true);
                enqueue(childNodeIndex);
            }
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3Jvd3RoX2dyYXBoLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2xpYi9ncm93dGhfZ3JhcGgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFFQSx5Q0FBd0Q7QUFDeEQsMkNBQW1DO0FBRW5DOzs7R0FHRztBQUNIO0lBQ0UsWUFBNEIsSUFBcUIsRUFDL0IsV0FBNEI7UUFEbEIsU0FBSSxHQUFKLElBQUksQ0FBaUI7UUFDL0IsZ0JBQVcsR0FBWCxXQUFXLENBQWlCO0lBQUcsQ0FBQztDQUNuRDtBQUVEOzs7R0FHRztBQUNILDRCQUE0QixJQUFVO0lBQ3BDLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUM7SUFDakMsTUFBTSxJQUFJLEdBQUcsR0FBRyxvQkFBNEIsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDO0lBQzlFLE1BQU0sQ0FBQyxJQUFJLFdBQVcsQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ3JELENBQUM7QUFFRDs7O0dBR0c7QUFDSCx3QkFBd0IsS0FBYTtJQUNuQyxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxHQUFHLENBQUMsa0JBQWtCLENBQUMsQ0FBQztBQUMzRCxDQUFDO0FBRUQ7OztHQUdHO0FBQ0gscUJBQXFCLElBQVU7SUFDN0IsTUFBTSxDQUFBLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7UUFDekI7WUFDRSxpRUFBaUU7WUFDakUsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLEtBQUssU0FBUyxDQUFDO1FBQ3hDLG9CQUE2QjtRQUM3QjtZQUNFLE1BQU0sQ0FBQyxLQUFLLENBQUM7UUFDZjtZQUNFLE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDaEIsQ0FBQztBQUNILENBQUM7QUFFRDs7Ozs7R0FLRztBQUNILG9CQUEyQixTQUFzQjtJQUMv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RyxDQUFDLGNBQWMsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN6RCxTQUFTLENBQUMsR0FBRyxDQUFDLGNBQWMsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDcEMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQzFCLENBQUM7UUFDSCxDQUFDO0lBQ0gsQ0FBQztBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1NuYXBzaG90RWRnZVR5cGUsIFNuYXBzaG90Tm9kZVR5cGUsIFNuYXBzaG90U2l6ZVN1bW1hcnksIElMZWFrUm9vdCwgSVBhdGgsIEdyb3d0aFN0YXR1c30gZnJvbSAnLi4vY29tbW9uL2ludGVyZmFjZXMnO1xuaW1wb3J0IHtkZWZhdWx0IGFzIEhlYXBTbmFwc2hvdFBhcnNlciwgRGF0YVR5cGVzfSBmcm9tICcuL2hlYXBfc25hcHNob3RfcGFyc2VyJztcbmltcG9ydCB7T25lQml0QXJyYXksIFR3b0JpdEFycmF5fSBmcm9tICcuLi9jb21tb24vdXRpbCc7XG5pbXBvcnQgTGVha1Jvb3QgZnJvbSAnLi9sZWFrX3Jvb3QnO1xuXG4vKipcbiAqIFJlcHJlc2VudHMgYSBsaW5rIGluIGEgaGVhcCBwYXRoLiBTcGVjaWZpZWQgYXMgYSBzaW1wbGUgY2xhc3MgdG8gbWFrZSBpdCBxdWljayB0byBjb25zdHJ1Y3QgYW5kIEpTT05hYmxlLlxuICogVE9ETzogQmV0dGVyIHRlcm1pbm9sb2d5P1xuICovXG5jbGFzcyBQYXRoU2VnbWVudCBpbXBsZW1lbnRzIElQYXRoU2VnbWVudCB7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyByZWFkb25seSB0eXBlOiBQYXRoU2VnbWVudFR5cGUsXG4gICAgcHVibGljIHJlYWRvbmx5IGluZGV4T3JOYW1lOiBzdHJpbmcgfCBudW1iZXIpIHt9XG59XG5cbi8qKlxuICogQ29udmVydHMgYW4gZWRnZSBpbnRvIGEgaGVhcCBwYXRoIHNlZ21lbnQuXG4gKiBAcGFyYW0gZWRnZVxuICovXG5mdW5jdGlvbiBlZGdlVG9JUGF0aFNlZ21lbnQoZWRnZTogRWRnZSk6IElQYXRoU2VnbWVudCB7XG4gIGNvbnN0IHBzdCA9IGVkZ2UucGF0aFNlZ21lbnRUeXBlO1xuICBjb25zdCBuYW1lID0gcHN0ID09PSBQYXRoU2VnbWVudFR5cGUuQ0xPU1VSRSA/IFwiX19zY29wZV9fXCIgOiBlZGdlLmluZGV4T3JOYW1lO1xuICByZXR1cm4gbmV3IFBhdGhTZWdtZW50KGVkZ2UucGF0aFNlZ21lbnRUeXBlLCBuYW1lKTtcbn1cblxuLyoqXG4gKiBDb252ZXJ0cyBhIHNlcXVlbmNlIG9mIGVkZ2VzIGZyb20gdGhlIGhlYXAgZ3JhcGggaW50byBhbiBJUGF0aCBvYmplY3QuXG4gKiBAcGFyYW0gZWRnZXNcbiAqL1xuZnVuY3Rpb24gZWRnZVBhdGhUb1BhdGgoZWRnZXM6IEVkZ2VbXSk6IElQYXRoIHtcbiAgcmV0dXJuIGVkZ2VzLmZpbHRlcihpc05vdEhpZGRlbikubWFwKGVkZ2VUb0lQYXRoU2VnbWVudCk7XG59XG5cbi8qKlxuICogUmV0dXJucyB0cnVlIGlmIHRoZSBnaXZlbiBlZGdlIHR5cGUgaXMgdmlzaWJsZSBmcm9tIEphdmFTY3JpcHQuXG4gKiBAcGFyYW0gZWRnZVxuICovXG5mdW5jdGlvbiBpc05vdEhpZGRlbihlZGdlOiBFZGdlKTogYm9vbGVhbiB7XG4gIHN3aXRjaChlZGdlLnNuYXBzaG90VHlwZSkge1xuICAgIGNhc2UgU25hcHNob3RFZGdlVHlwZS5JbnRlcm5hbDpcbiAgICAgIC8vIEtlZXAgYXJvdW5kIGNsb3N1cmUgZWRnZXMgc28gd2UgY2FuIGNvbnZlcnQgdGhlbSB0byBfX3Njb3BlX18uXG4gICAgICByZXR1cm4gZWRnZS5pbmRleE9yTmFtZSA9PT0gXCJjb250ZXh0XCI7XG4gICAgY2FzZSBTbmFwc2hvdEVkZ2VUeXBlLkhpZGRlbjpcbiAgICBjYXNlIFNuYXBzaG90RWRnZVR5cGUuU2hvcnRjdXQ6XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiB0cnVlO1xuICB9XG59XG5cbi8qKlxuICogRXh0cmFjdHMgYSB0cmVlIG9mIGdyb3dpbmcgaGVhcCBwYXRocyBmcm9tIGEgc2VyaWVzIG9mIGxlYWsgcm9vdHMgYW5kXG4gKiBwYXRocyB0byBzYWlkIHJvb3RzLlxuICpcbiAqIENhbGxlZCBiZWZvcmUgc2VuZGluZyB0aGUgbGVhayByb290cyB0byB0aGUgQkxlYWsgYWdlbnQgZm9yIGluc3RydW1lbnRhdGlvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRvUGF0aFRyZWUobGVha3Jvb3RzOiBJTGVha1Jvb3RbXSk6IElQYXRoVHJlZXMge1xuICBjb25zdCB0cmVlOiBJUGF0aFRyZWVzID0gW107XG5cbiAgZnVuY3Rpb24gYWRkUGF0aChwOiBJUGF0aCwgaWQ6IG51bWJlciwgaW5kZXggPSAwLCBjaGlsZHJlbiA9IHRyZWUpOiB2b2lkIHtcbiAgICBpZiAocC5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgcGF0aFNlZ21lbnQgPSBwW2luZGV4XTtcbiAgICBjb25zdCBpbmRleE9yTmFtZSA9IHBhdGhTZWdtZW50LmluZGV4T3JOYW1lO1xuICAgIGNvbnN0IG1hdGNoZXMgPSBjaGlsZHJlbi5maWx0ZXIoKGMpID0+IGMuaW5kZXhPck5hbWUgPT09IGluZGV4T3JOYW1lKTtcbiAgICBsZXQgcmVjdXI6IElQYXRoVHJlZTtcbiAgICBpZiAobWF0Y2hlcy5sZW5ndGggPiAwKSB7XG4gICAgICByZWN1ciA9IG1hdGNoZXNbMF07XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEFkZCB0byBjaGlsZHJlbiBsaXN0LlxuICAgICAgcmVjdXIgPSA8SVBhdGhUcmVlTm90R3Jvd2luZz4gT2JqZWN0LmFzc2lnbih7XG4gICAgICAgIGlzR3Jvd2luZzogZmFsc2UsXG4gICAgICAgIGNoaWxkcmVuOiBbXVxuICAgICAgfSwgcGF0aFNlZ21lbnQpO1xuICAgICAgY2hpbGRyZW4ucHVzaChyZWN1cik7XG4gICAgfVxuICAgIGNvbnN0IG5leHQgPSBpbmRleCArIDE7XG4gICAgaWYgKG5leHQgPT09IHAubGVuZ3RoKSB7XG4gICAgICAocmVjdXIgYXMgSVBhdGhUcmVlR3Jvd2luZykuaXNHcm93aW5nID0gdHJ1ZTtcbiAgICAgIChyZWN1ciBhcyBJUGF0aFRyZWVHcm93aW5nKS5pZCA9IGlkO1xuICAgIH0gZWxzZSB7XG4gICAgICBhZGRQYXRoKHAsIGlkLCBuZXh0LCByZWN1ci5jaGlsZHJlbik7XG4gICAgfVxuICB9XG5cbiAgbGVha3Jvb3RzLmZvckVhY2goKGxyKSA9PiB7XG4gICAgbHIucGF0aHMuZm9yRWFjaCgocCkgPT4ge1xuICAgICAgYWRkUGF0aChwLCBsci5pZCk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIHJldHVybiB0cmVlO1xufVxuXG4vLyBFZGdlIGJyYW5kXG50eXBlIEVkZ2VJbmRleCA9IG51bWJlciAmIHsgX19fRWRnZUluZGV4OiB0cnVlIH07XG4vLyBOb2RlIGJyYW5kXG50eXBlIE5vZGVJbmRleCA9IG51bWJlciAmIHsgX19fTm9kZUluZGV4OiB0cnVlIH07XG5cbmZ1bmN0aW9uIHNob3VsZFRyYXZlcnNlKGVkZ2U6IEVkZ2UsIHdhbnREb206IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgLy8gSEFDSzogSWdub3JlIDxzeW1ib2w+IHByb3BlcnRpZXMuIFRoZXJlIG1heSBiZSBtdWx0aXBsZSBwcm9wZXJ0aWVzXG4gIC8vIHdpdGggdGhlIG5hbWUgPHN5bWJvbD4gaW4gYSBoZWFwIHNuYXBzaG90LiBUaGVyZSBkb2VzIG5vdCBhcHBlYXIgdG9cbiAgLy8gYmUgYW4gZWFzeSB3YXkgdG8gZGlzYW1iaWd1YXRlIHRoZW0uXG4gIGlmIChlZGdlLmluZGV4T3JOYW1lID09PSBcIjxzeW1ib2w+XCIpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKGVkZ2Uuc25hcHNob3RUeXBlID09PSBTbmFwc2hvdEVkZ2VUeXBlLkludGVybmFsKSB7XG4gICAgLy8gV2hpdGVsaXN0IG9mIGludGVybmFsIGVkZ2VzIHdlIGtub3cgaG93IHRvIGZvbGxvdy5cbiAgICBzd2l0Y2ggKGVkZ2UuaW5kZXhPck5hbWUpIHtcbiAgICAgIGNhc2UgXCJlbGVtZW50c1wiOlxuICAgICAgY2FzZSBcInRhYmxlXCI6XG4gICAgICBjYXNlIFwicHJvcGVydGllc1wiOlxuICAgICAgY2FzZSBcImNvbnRleHRcIjpcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gd2FudERvbSAmJiBlZGdlLnRvLm5hbWUuc3RhcnRzV2l0aChcIkRvY3VtZW50IERPTVwiKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoZWRnZS50by50eXBlID09PSBTbmFwc2hvdE5vZGVUeXBlLlN5bnRoZXRpYykge1xuICAgIHJldHVybiBlZGdlLnRvLm5hbWUgPT09IFwiKERvY3VtZW50IERPTSB0cmVlcylcIjtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgaGFzaCByZXByZXNlbnRpbmcgYSBwYXJ0aWN1bGFyIGVkZ2UgYXMgYSBjaGlsZCBvZiB0aGUgZ2l2ZW4gcGFyZW50LlxuICogQHBhcmFtIHBhcmVudFxuICogQHBhcmFtIGVkZ2VcbiAqL1xuZnVuY3Rpb24gaGFzaChwYXJlbnQ6IE5vZGUsIGVkZ2U6IEVkZ2UpOiBzdHJpbmcgfCBudW1iZXIge1xuICBpZiAocGFyZW50LnR5cGUgPT09IFNuYXBzaG90Tm9kZVR5cGUuU3ludGhldGljKSB7XG4gICAgcmV0dXJuIGVkZ2UudG8ubmFtZTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZWRnZS5pbmRleE9yTmFtZTtcbiAgfVxufVxuXG4vKipcbiAqIFByb3BhZ2F0ZUdyb3d0aCAoRmlndXJlIDQgaW4gdGhlIHBhcGVyKS5cbiAqIE1pZ3JhdGVzIGEgbm9kZSdzIGdyb3d0aCBiZXR3ZWVuIGhlYXAgc25hcHNob3RzLiBCTGVhayBjb25zaWRlcnMgYSBwYXRoIGluIHRoZSBoZWFwIHRvIGJlIGdyb3dpbmdcbiAqIGlmIHRoZSBub2RlIGF0IHRoZSBwYXRoIGV4aGliaXRzIHN1c3RhaW5lZCBncm93dGggKGluIHRlcm1zIG9mIG51bWJlciBvZiBvdXRnb2luZyBlZGdlcykgYmV0d2VlbiBoZWFwXG4gKiBzbmFwc2hvdHMuXG4gKiBAcGFyYW0gb2xkRyBUaGUgb2xkIGhlYXAgZ3JhcGguXG4gKiBAcGFyYW0gb2xkR3Jvd3RoIEdyb3d0aCBiaXRzIGZvciB0aGUgbm9kZXMgaW4gdGhlIG9sZCBoZWFwIGdyYXBoLlxuICogQHBhcmFtIG5ld0cgVGhlIG5ldyBoZWFwIGdyYXBoLlxuICogQHBhcmFtIG5ld0dyb3d0aCBHcm93dGggYml0cyBmb3IgdGhlIG5vZGVzIGluIHRoZSBuZXcgaGVhcCBncmFwaC5cbiAqL1xuZnVuY3Rpb24gcHJvcGFnYXRlR3Jvd3RoKG9sZEc6IEhlYXBHcmFwaCwgb2xkR3Jvd3RoOiBUd29CaXRBcnJheSwgbmV3RzogSGVhcEdyYXBoLCBuZXdHcm93dGg6IFR3b0JpdEFycmF5KTogdm9pZCB7XG4gIGNvbnN0IG51bU5ld05vZGVzID0gbmV3Ry5ub2RlQ291bnQ7XG4gIGxldCBpbmRleCA9IDA7XG4gIC8vIFdlIHZpc2l0IGVhY2ggbmV3IG5vZGUgYXQgbW9zdCBvbmNlLCBmb3JtaW5nIGFuIHVwcGVyIGJvdW5kIG9uIHRoZSBxdWV1ZSBsZW5ndGguXG4gIC8vIFByZS1hbGxvY2F0ZSBmb3IgYmV0dGVyIHBlcmZvcm1hbmNlLlxuICBsZXQgcXVldWUgPSBuZXcgVWludDMyQXJyYXkobnVtTmV3Tm9kZXMgPDwgMSk7XG4gIC8vIFN0b3JlcyB0aGUgbGVuZ3RoIG9mIHF1ZXVlLlxuICBsZXQgcXVldWVMZW5ndGggPSAwO1xuICAvLyBPbmx5IHN0b3JlIHZpc2l0IGJpdHMgZm9yIHRoZSBuZXcgZ3JhcGguXG4gIGNvbnN0IHZpc2l0Qml0cyA9IG5ldyBPbmVCaXRBcnJheShudW1OZXdOb2Rlcyk7XG5cbiAgLy8gRW5xdWV1ZXMgdGhlIGdpdmVuIG5vZGUgcGFpcmluZyAocmVwcmVzZW50ZWQgYnkgdGhlaXIgaW5kaWNlcyBpbiB0aGVpciByZXNwZWN0aXZlIGdyYXBocylcbiAgLy8gaW50byB0aGUgcXVldWUuIG9sZE5vZGVJbmRleCBhbmQgbmV3Tm9kZUluZGV4IHJlcHJlc2VudCBhIG5vZGUgYXQgdGhlIHNhbWUgZWRnZSBzaGFyZWQgYmV0d2VlblxuICAvLyB0aGUgZ3JhcGhzLlxuICBmdW5jdGlvbiBlbnF1ZXVlKG9sZE5vZGVJbmRleDogTm9kZUluZGV4LCBuZXdOb2RlSW5kZXg6IE5vZGVJbmRleCk6IHZvaWQge1xuICAgIHF1ZXVlW3F1ZXVlTGVuZ3RoKytdID0gb2xkTm9kZUluZGV4O1xuICAgIHF1ZXVlW3F1ZXVlTGVuZ3RoKytdID0gbmV3Tm9kZUluZGV4O1xuICB9XG5cbiAgLy8gUmV0dXJucyBhIHNpbmdsZSBpdGVtIGZyb20gdGhlIHF1ZXVlLiAoQ2FsbGVkIHR3aWNlIHRvIHJlbW92ZSBhIHBhaXIuKVxuICBmdW5jdGlvbiBkZXF1ZXVlKCk6IE5vZGVJbmRleCB7XG4gICAgcmV0dXJuIHF1ZXVlW2luZGV4KytdIGFzIE5vZGVJbmRleDtcbiAgfVxuXG4gIC8vIDAgaW5kaWNhdGVzIHRoZSByb290IG5vZGUuIFN0YXJ0IGF0IHRoZSByb290LlxuICBjb25zdCBvbGROb2RlID0gbmV3IE5vZGUoMCBhcyBOb2RlSW5kZXgsIG9sZEcpO1xuICBjb25zdCBuZXdOb2RlID0gbmV3IE5vZGUoMCBhcyBOb2RlSW5kZXgsIG5ld0cpO1xuICBjb25zdCBvbGRFZGdlVG1wID0gbmV3IEVkZ2UoMCBhcyBFZGdlSW5kZXgsIG9sZEcpO1xuXG4gIHtcbiAgICAvLyBWaXNpdCBnbG9iYWwgcm9vdHMgYnkgKm5vZGUgbmFtZSosIG5vdCAqZWRnZSBuYW1lKiBhcyBlZGdlcyBhcmUgYXJiaXRyYXJpbHkgbnVtYmVyZWQgZnJvbSB0aGUgcm9vdCBub2RlLlxuICAgIC8vIFRoZXNlIGdsb2JhbCByb290cyBjb3JyZXNwb25kIHRvIGRpZmZlcmVudCBKYXZhU2NyaXB0IGNvbnRleHRzIChlLmcuIElGcmFtZXMpLlxuICAgIGNvbnN0IG5ld1VzZXJSb290cyA9IG5ld0cuZ2V0R2xvYmFsUm9vdEluZGljZXMoKTtcbiAgICBjb25zdCBvbGRVc2VyUm9vdHMgPSBvbGRHLmdldEdsb2JhbFJvb3RJbmRpY2VzKCk7XG4gICAgY29uc3QgbSA9IG5ldyBNYXA8c3RyaW5nLCB7bzogbnVtYmVyW10sIG46IG51bWJlcltdfT4oKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5ld1VzZXJSb290cy5sZW5ndGg7IGkrKykge1xuICAgICAgbmV3Tm9kZS5ub2RlSW5kZXggPSA8YW55PiBuZXdVc2VyUm9vdHNbaV07XG4gICAgICBjb25zdCBuYW1lID0gbmV3Tm9kZS5uYW1lO1xuICAgICAgbGV0IGEgPSBtLmdldChuYW1lKTtcbiAgICAgIGlmICghYSkge1xuICAgICAgICBhID0ge286IFtdLCBuOiBbXX07XG4gICAgICAgIG0uc2V0KG5hbWUsIGEpO1xuICAgICAgfVxuICAgICAgYS5uLnB1c2gobmV3VXNlclJvb3RzW2ldKTtcbiAgICB9XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBvbGRVc2VyUm9vdHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIG9sZE5vZGUubm9kZUluZGV4ID0gPGFueT4gb2xkVXNlclJvb3RzW2ldO1xuICAgICAgY29uc3QgbmFtZSA9IG9sZE5vZGUubmFtZTtcbiAgICAgIGxldCBhID0gbS5nZXQobmFtZSk7XG4gICAgICBpZiAoYSkge1xuICAgICAgICBhLm8ucHVzaChvbGRVc2VyUm9vdHNbaV0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIG0uZm9yRWFjaCgodikgPT4ge1xuICAgICAgbGV0IG51bSA9IE1hdGgubWluKHYuby5sZW5ndGgsIHYubi5sZW5ndGgpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW07IGkrKykge1xuICAgICAgICBlbnF1ZXVlKDxhbnk+IHYub1tpXSwgPGFueT4gdi5uW2ldKTtcbiAgICAgICAgdmlzaXRCaXRzLnNldCh2Lm5baV0sIHRydWUpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLy8gVGhlIG1haW4gbG9vcCwgd2hpY2ggaXMgdGhlIGVzc2VuY2Ugb2YgUHJvcGFnYXRlR3Jvd3RoLlxuICB3aGlsZSAoaW5kZXggPCBxdWV1ZUxlbmd0aCkge1xuICAgIGNvbnN0IG9sZEluZGV4ID0gZGVxdWV1ZSgpO1xuICAgIGNvbnN0IG5ld0luZGV4ID0gZGVxdWV1ZSgpO1xuICAgIG9sZE5vZGUubm9kZUluZGV4ID0gb2xkSW5kZXg7XG4gICAgbmV3Tm9kZS5ub2RlSW5kZXggPSBuZXdJbmRleDtcblxuICAgIGNvbnN0IG9sZE5vZGVHcm93dGhTdGF0dXM6IEdyb3d0aFN0YXR1cyA9IG9sZEdyb3d0aC5nZXQob2xkSW5kZXgpO1xuXG4gICAgLy8gTm9kZXMgYXJlIGVpdGhlciAnTmV3JywgJ0dyb3dpbmcnLCBvciAnTm90IEdyb3dpbmcnLlxuICAgIC8vIE5vZGVzIGJlZ2luIGFzICdOZXcnLCBhbmQgdHJhbnNpdGlvbiB0byAnR3Jvd2luZycgb3IgJ05vdCBHcm93aW5nJyBhZnRlciBhIHNuYXBzaG90LlxuICAgIC8vIFNvIGlmIGEgbm9kZSBpcyBuZWl0aGVyIG5ldyBub3IgY29uc2lzdGVudGx5IGdyb3dpbmcsIHdlIGRvbid0IGNhcmUgYWJvdXQgaXQuXG4gICAgaWYgKChvbGROb2RlR3Jvd3RoU3RhdHVzID09PSBHcm93dGhTdGF0dXMuTkVXIHx8IG9sZE5vZGVHcm93dGhTdGF0dXMgPT09IEdyb3d0aFN0YXR1cy5HUk9XSU5HKSAmJiBvbGROb2RlLm51bVByb3BlcnRpZXMoKSA8IG5ld05vZGUubnVtUHJvcGVydGllcygpKSB7XG4gICAgICBuZXdHcm93dGguc2V0KG5ld0luZGV4LCBHcm93dGhTdGF0dXMuR1JPV0lORyk7XG4gICAgfVxuXG4gICAgLy8gVmlzaXQgc2hhcmVkIGNoaWxkcmVuLlxuICAgIGNvbnN0IG9sZEVkZ2VzID0gbmV3IE1hcDxzdHJpbmcgfCBudW1iZXIsIEVkZ2VJbmRleD4oKTtcbiAgICBpZiAob2xkTm9kZS5oYXNDaGlsZHJlbikge1xuICAgICAgZm9yIChjb25zdCBpdCA9IG9sZE5vZGUuY2hpbGRyZW47IGl0Lmhhc05leHQoKTsgaXQubmV4dCgpKSB7XG4gICAgICAgIGNvbnN0IG9sZENoaWxkRWRnZSA9IGl0Lml0ZW0oKTtcbiAgICAgICAgb2xkRWRnZXMuc2V0KGhhc2gob2xkTm9kZSwgb2xkQ2hpbGRFZGdlKSwgb2xkQ2hpbGRFZGdlLmVkZ2VJbmRleCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy9Ob3cgdGhpcyBsb29wIHdpbGwgdGFrZSBjYXJlIGZvciB0aGUgbWVtb3J5IGxlYWtzIGluIHdoaWNoIHRoZSBvYmplY3QgY291bnQgaXMgbm90IGluY3JlYXNpbmcgYnV0IHRoZSBSZXRhaW5lZCBTaXplIHdpbGwgYmUgaW5jcmVhc2UgY2VydGFpbmx5XG4gICAgaWYgKChvbGROb2RlR3Jvd3RoU3RhdHVzID09PSBHcm93dGhTdGF0dXMuTk9UX0dST1dJTkcpICYmIG9sZE5vZGUubnVtUHJvcGVydGllcygpID09IG5ld05vZGUubnVtUHJvcGVydGllcygpKXtcbiAgICAgIGlmKG9sZE5vZGUuZ2V0UmV0YWluZWRTaXplKCkgPCBuZXdOb2RlLmdldFJldGFpbmVkU2l6ZSgpKXtcbiAgICAgICAgbmV3R3Jvd3RoLnNldChuZXdJbmRleCwgR3Jvd3RoU3RhdHVzLkdST1dJTkcpO1xuICAgIFx0fVxuICAgIH1cdFxuXG4gICAgaWYgKG5ld05vZGUuaGFzQ2hpbGRyZW4pIHtcbiAgICAgIGZvciAoY29uc3QgaXQgPSBuZXdOb2RlLmNoaWxkcmVuOyBpdC5oYXNOZXh0KCk7IGl0Lm5leHQoKSkge1xuICAgICAgICBjb25zdCBuZXdDaGlsZEVkZ2UgPSBpdC5pdGVtKCk7XG4gICAgICAgIGNvbnN0IG9sZEVkZ2UgPSBvbGRFZGdlcy5nZXQoaGFzaChuZXdOb2RlLCBuZXdDaGlsZEVkZ2UpKTtcbiAgICAgICAgb2xkRWRnZVRtcC5lZGdlSW5kZXggPSBvbGRFZGdlO1xuICAgICAgICBpZiAob2xkRWRnZSAhPT0gdW5kZWZpbmVkICYmICF2aXNpdEJpdHMuZ2V0KG5ld0NoaWxkRWRnZS50b0luZGV4KSAmJlxuICAgICAgICAgICAgc2hvdWxkVHJhdmVyc2Uob2xkRWRnZVRtcCwgZmFsc2UpICYmIHNob3VsZFRyYXZlcnNlKG5ld0NoaWxkRWRnZSwgZmFsc2UpKSB7XG4gICAgICAgICAgdmlzaXRCaXRzLnNldChuZXdDaGlsZEVkZ2UudG9JbmRleCwgdHJ1ZSk7XG4gICAgICAgICAgZW5xdWV1ZShvbGRFZGdlVG1wLnRvSW5kZXgsIG5ld0NoaWxkRWRnZS50b0luZGV4KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFRyYWNrcyBncm93dGggaW4gdGhlIGhlYXAuXG4gKi9cbmV4cG9ydCBjbGFzcyBIZWFwR3Jvd3RoVHJhY2tlciB7XG4gIHByaXZhdGUgX3N0cmluZ01hcDogU3RyaW5nTWFwID0gbmV3IFN0cmluZ01hcCgpO1xuICBwcml2YXRlIF9oZWFwOiBIZWFwR3JhcGggPSBudWxsO1xuICBwcml2YXRlIF9ncm93dGhTdGF0dXM6IFR3b0JpdEFycmF5ID0gbnVsbDtcbiAgLy8gREVCVUcgSU5GTzsgdGhpcyBpbmZvcm1hdGlvbiBpcyBzaG93biBpbiBhIGhlYXAgZXhwbG9yZXIgdG9vbC5cbiAgcHVibGljIF9sZWFrUmVmczogVWludDE2QXJyYXkgPSBudWxsO1xuICBwdWJsaWMgX25vbkxlYWtWaXNpdHM6IE9uZUJpdEFycmF5ID0gbnVsbDtcblxuICBwdWJsaWMgYXN5bmMgYWRkU25hcHNob3QocGFyc2VyOiBIZWFwU25hcHNob3RQYXJzZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBoZWFwID0gYXdhaXQgSGVhcEdyYXBoLkNvbnN0cnVjdChwYXJzZXIsIHRoaXMuX3N0cmluZ01hcCk7XG4gICAgY29uc3QgZ3Jvd3RoU3RhdHVzID0gbmV3IFR3b0JpdEFycmF5KGhlYXAubm9kZUNvdW50KTtcbiAgICBpZiAodGhpcy5faGVhcCAhPT0gbnVsbCkge1xuICAgICAgLy8gSW5pdGlhbGl6ZSBhbGwgbmV3IG5vZGVzIHRvICdOT1RfR1JPV0lORycuXG4gICAgICAvLyBXZSBvbmx5IHdhbnQgdG8gY29uc2lkZXIgc3RhYmxlIGhlYXAgcGF0aHMgcHJlc2VudCBmcm9tIHRoZSBmaXJzdCBzbmFwc2hvdC5cbiAgICAgIGdyb3d0aFN0YXR1cy5maWxsKEdyb3d0aFN0YXR1cy5OT1RfR1JPV0lORyk7XG4gICAgICAvLyBNZXJnZSBncmFwaHMuXG4gICAgICBwcm9wYWdhdGVHcm93dGgodGhpcy5faGVhcCwgdGhpcy5fZ3Jvd3RoU3RhdHVzLCBoZWFwLCBncm93dGhTdGF0dXMpO1xuICAgIH1cbiAgICAvLyBLZWVwIG5ldyBncmFwaC5cbiAgICB0aGlzLl9oZWFwID0gaGVhcDtcbiAgICB0aGlzLl9ncm93dGhTdGF0dXMgPSBncm93dGhTdGF0dXM7XG4gIH1cblxuICBwdWJsaWMgZ2V0R3JhcGgoKTogSGVhcEdyYXBoIHtcbiAgICByZXR1cm4gdGhpcy5faGVhcDtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbXBsZW1lbnRzIEZpbmRMZWFrUGF0aHMgKEZpZ3VyZSA1IGluIHRoZSBwYXBlcikgYW5kIENhbGN1bGF0ZUxlYWtTaGFyZSAoRmlndXJlIDYgaW4gdGhlIHBhcGVyKSxcbiAgICogYXMgd2VsbCBhcyBjYWxjdWxhdGlvbnMgZm9yIFJldGFpbmVkIFNpemUgYW5kIFRyYW5zaXRpdmUgQ2xvc3VyZSBTaXplICh3aGljaCB3ZSBjb21wYXJlIGFnYWluc3QgaW4gdGhlIHBhcGVyKS5cbiAgICpcbiAgICogUmV0dXJucyBwYXRocyB0aHJvdWdoIHRoZSBoZWFwIHRvIGxlYWtpbmcgbm9kZXMsIGFsb25nIHdpdGggbXVsdGlwbGUgZGlmZmVyZW50IHR5cGVzIG9mIHNjb3JlcyB0byBoZWxwXG4gICAqIGRldmVsb3BlcnMgcHJpb3JpdGl6ZSB0aGVtLCBncm91cGVkIGJ5IHRoZSBsZWFrIHJvb3QgcmVzcG9uc2libGUuXG4gICAqL1xuICBwdWJsaWMgZmluZExlYWtQYXRocygpOiBMZWFrUm9vdFtdIHtcbiAgICAvLyBBIG1hcCBmcm9tIGdyb3dpbmcgbm9kZXMgdG8gaGVhcCBwYXRocyB0aGF0IHJlZmVyZW5jZSB0aGVtLlxuICAgIGNvbnN0IGdyb3d0aFBhdGhzID0gbmV3IE1hcDxOb2RlSW5kZXgsIEVkZ2VbXVtdPigpO1xuXG4gICAgLy8gQWRkcyBhIGdpdmVuIHBhdGggdG8gZ3Jvd3RoUGF0aHMuXG4gICAgZnVuY3Rpb24gYWRkUGF0aChlOiBFZGdlW10pOiB2b2lkIHtcbiAgICAgIGNvbnN0IHRvID0gZVtlLmxlbmd0aCAtIDFdLnRvSW5kZXg7XG4gICAgICBsZXQgcGF0aHMgPSBncm93dGhQYXRocy5nZXQodG8pO1xuICAgICAgaWYgKHBhdGhzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcGF0aHMgPSBbXTtcbiAgICAgICAgZ3Jvd3RoUGF0aHMuc2V0KHRvLCBwYXRocyk7XG4gICAgICB9XG4gICAgICBwYXRocy5wdXNoKGUpO1xuICAgIH1cblxuICAgIC8vIEZpbHRlciBvdXQgRE9NIG5vZGVzIGFuZCBoaWRkZW4gZWRnZXMgdGhhdCByZXByZXNlbnQgaW50ZXJuYWwgVjggLyBDaHJvbWUgc3RhdGUuXG4gICAgZnVuY3Rpb24gZmlsdGVyTm9Eb20objogTm9kZSwgZTogRWRnZSkge1xuICAgICAgcmV0dXJuIGlzTm90SGlkZGVuKGUpICYmIG5vbldlYWtGaWx0ZXIobiwgZSkgJiYgc2hvdWxkVHJhdmVyc2UoZSwgZmFsc2UpO1xuICAgIH1cblxuICAgIC8vIEZpbHRlciBvdXQgaGlkZGVuIGVkZ2VzIHRoYXQgcmVwcmVzZW50IGludGVybmFsIFY4IC8gQ2hyb21lIHN0YXRlLCBidXQga2VlcCBET00gbm9kZXMuXG4gICAgZnVuY3Rpb24gZmlsdGVySW5jbHVkZURvbShuOiBOb2RlLCBlOiBFZGdlKSB7XG4gICAgICByZXR1cm4gbm9uV2Vha0ZpbHRlcihuLCBlKSAmJiBzaG91bGRUcmF2ZXJzZShlLCB0cnVlKTtcbiAgICB9XG5cbiAgICAvLyBHZXQgdGhlIGdyb3dpbmcgcGF0aHMuIElnbm9yZSBwYXRocyB0aHJvdWdoIHRoZSBET00sIGFzIHdlIG1pcnJvciB0aG9zZSBpbiBKYXZhU2NyaXB0LlxuICAgIC8vIChTZWUgU2VjdGlvbiA1LjMuMiBpbiB0aGUgcGFwZXIsIFwiRXhwb3NpbmcgSGlkZGVuIFN0YXRlXCIpXG4gICAgdGhpcy5faGVhcC52aXNpdEdsb2JhbEVkZ2VzKChlLCBnZXRQYXRoKSA9PiB7XG4gICAgICBpZiAodGhpcy5fZ3Jvd3RoU3RhdHVzLmdldChlLnRvSW5kZXgpID09PSBHcm93dGhTdGF0dXMuR1JPV0lORykge1xuICAgICAgICBhZGRQYXRoKGdldFBhdGgoKSk7XG4gICAgICB9XG4gICAgfSwgZmlsdGVyTm9Eb20pO1xuXG4gICAgLy8gTm93LCBjYWxjdWxhdGUgZ3Jvd3RoIG1ldHJpY3MhXG5cbiAgICAvLyBNYXJrIGl0ZW1zIHRoYXQgYXJlIHJlYWNoYWJsZSBieSBub24tbGVha3MuXG4gICAgY29uc3Qgbm9ubGVha1Zpc2l0Qml0cyA9IG5ldyBPbmVCaXRBcnJheSh0aGlzLl9oZWFwLm5vZGVDb3VudCk7XG4gICAgdGhpcy5faGVhcC52aXNpdFVzZXJSb290cygobikgPT4ge1xuICAgICAgbm9ubGVha1Zpc2l0Qml0cy5zZXQobi5ub2RlSW5kZXgsIHRydWUpO1xuICAgIH0sIChuLCBlKSA9PiB7XG4gICAgICAvLyBGaWx0ZXIgb3V0IGVkZ2VzIHRvIGdyb3dpbmcgb2JqZWN0cy5cbiAgICAgIC8vIFRyYXZlcnNlIHRoZSBET00gdGhpcyB0aW1lLlxuICAgICAgcmV0dXJuIGZpbHRlckluY2x1ZGVEb20obiwgZSkgJiYgIWdyb3d0aFBhdGhzLmhhcyhlLnRvSW5kZXgpO1xuICAgIH0pO1xuXG4gICAgLy8gRmlsdGVyIG91dCBpdGVtcyB0aGF0IGFyZSByZWFjaGFibGUgZnJvbSBub24tbGVha3MuXG4gICAgZnVuY3Rpb24gbm9uTGVha0ZpbHRlcihuOiBOb2RlLCBlOiBFZGdlKTogYm9vbGVhbiB7XG4gICAgICByZXR1cm4gZmlsdGVySW5jbHVkZURvbShuLCBlKSAmJiAhbm9ubGVha1Zpc2l0Qml0cy5nZXQoZS50b0luZGV4KTtcbiAgICB9XG5cbiAgICAvLyBJbmNyZW1lbnQgdmlzaXQgY291bnRlciBmb3IgZWFjaCBoZWFwIGl0ZW0gcmVhY2hhYmxlIGZyb20gYSBsZWFrLlxuICAgIC8vIFVzZWQgYnkgTGVha1NoYXJlLlxuICAgIGNvbnN0IGxlYWtSZWZlcmVuY2VzID0gbmV3IFVpbnQxNkFycmF5KHRoaXMuX2hlYXAubm9kZUNvdW50KTtcbiAgICBncm93dGhQYXRocy5mb3JFYWNoKChwYXRocywgZ3Jvd3RoTm9kZUluZGV4KSA9PiB7XG4gICAgICBiZnNWaXNpdG9yKHRoaXMuX2hlYXAsIFtncm93dGhOb2RlSW5kZXhdLCAobikgPT4ge1xuICAgICAgICBsZWFrUmVmZXJlbmNlc1tuLm5vZGVJbmRleF0rKztcbiAgICAgIH0sIG5vbkxlYWtGaWx0ZXIpO1xuICAgIH0pO1xuXG4gICAgLy8gQ2FsY3VsYXRlIGZpbmFsIGdyb3d0aCBtZXRyaWNzIChMZWFrU2hhcmUsIFJldGFpbmVkIFNpemUsIFRyYW5zaXRpdmUgQ2xvc3VyZSBTaXplKVxuICAgIC8vIGZvciBlYWNoIExlYWtQYXRoLCBhbmQgY29uc3RydWN0IExlYWtSb290IG9iamVjdHMgcmVwcmVzZW50aW5nIGVhY2ggTGVha1Jvb3QuXG4gICAgbGV0IHJ2ID0gbmV3IEFycmF5PExlYWtSb290PigpO1xuICAgIGdyb3d0aFBhdGhzLmZvckVhY2goKHBhdGhzLCBncm93dGhOb2RlSW5kZXgpID0+IHtcbiAgICAgIGxldCByZXRhaW5lZFNpemUgPSAwO1xuICAgICAgbGV0IGxlYWtTaGFyZSA9IDA7XG4gICAgICBsZXQgdHJhbnNpdGl2ZUNsb3N1cmVTaXplID0gMDtcbiAgICAgIGxldCBvd25lZE9iamVjdHMgPSAwO1xuICAgICAgYmZzVmlzaXRvcih0aGlzLl9oZWFwLCBbZ3Jvd3RoTm9kZUluZGV4XSwgKG4pID0+IHtcbiAgICAgICAgY29uc3QgcmVmQ291bnQgPSBsZWFrUmVmZXJlbmNlc1tuLm5vZGVJbmRleF07XG4gICAgICAgIGlmIChyZWZDb3VudCA9PT0gMSkge1xuICAgICAgICAgIC8vIEEgcmVmQ291bnQgb2YgMSBtZWFucyB0aGUgaGVhcCBpdGVtIGlzIHVuaXF1ZWx5IHJlZmVyZW5jZWQgYnkgdGhpcyBsZWFrLFxuICAgICAgICAgIC8vIHNvIGl0IGNvbnRyaWJ1dGVzIHRvIHJldGFpbmVkU2l6ZS5cbiAgICAgICAgICByZXRhaW5lZFNpemUgKz0gbi5zaXplO1xuICAgICAgICAgIG93bmVkT2JqZWN0cysrO1xuICAgICAgICB9XG4gICAgICAgIGxlYWtTaGFyZSArPSBuLnNpemUgLyByZWZDb3VudDtcbiAgICAgIH0sIG5vbkxlYWtGaWx0ZXIpO1xuXG4gICAgICAvLyBUcmFuc2l0aXZlIGNsb3N1cmUgc2l6ZSwgZm9yIGNvbXBhcmlzb24gdG8gcmVsYXRlZCB3b3JrLlxuICAgICAgYmZzVmlzaXRvcih0aGlzLl9oZWFwLCBbZ3Jvd3RoTm9kZUluZGV4XSwgKG4pID0+IHtcbiAgICAgICAgdHJhbnNpdGl2ZUNsb3N1cmVTaXplICs9IG4uc2l6ZTtcbiAgICAgIH0sIGZpbHRlckluY2x1ZGVEb20pO1xuXG4gICAgICBydi5wdXNoKG5ldyBMZWFrUm9vdChncm93dGhOb2RlSW5kZXgsIHBhdGhzLm1hcChlZGdlUGF0aFRvUGF0aCksIHtcbiAgICAgICAgcmV0YWluZWRTaXplLFxuICAgICAgICBsZWFrU2hhcmUsXG4gICAgICAgIHRyYW5zaXRpdmVDbG9zdXJlU2l6ZSxcbiAgICAgICAgb3duZWRPYmplY3RzXG4gICAgICB9KSk7XG4gICAgfSk7XG5cbiAgICAvLyBERUJVR1xuICAgIHRoaXMuX2xlYWtSZWZzID0gbGVha1JlZmVyZW5jZXM7XG4gICAgdGhpcy5fbm9uTGVha1Zpc2l0cyA9IG5vbmxlYWtWaXNpdEJpdHM7XG5cbiAgICByZXR1cm4gcnY7XG4gIH1cblxuICBwdWJsaWMgaXNHcm93aW5nKG5vZGVJbmRleDogbnVtYmVyKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2dyb3d0aFN0YXR1cy5nZXQobm9kZUluZGV4KSA9PT0gR3Jvd3RoU3RhdHVzLkdST1dJTkc7XG4gIH1cbn1cblxuXG4vKipcbiAqIE1hcCBmcm9tIElEID0+IHN0cmluZy5cbiAqL1xuY2xhc3MgU3RyaW5nTWFwIHtcbiAgcHJpdmF0ZSBfbWFwID0gbmV3IE1hcDxzdHJpbmcsIG51bWJlcj4oKTtcbiAgcHJpdmF0ZSBfc3RyaW5ncyA9IG5ldyBBcnJheTxzdHJpbmc+KCk7XG5cbiAgcHVibGljIGdldChzOiBzdHJpbmcpOiBudW1iZXIge1xuICAgIGNvbnN0IG1hcCA9IHRoaXMuX21hcDtcbiAgICBsZXQgaWQgPSBtYXAuZ2V0KHMpO1xuICAgIGlmIChpZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZCA9IHRoaXMuX3N0cmluZ3MucHVzaChzKSAtIDE7XG4gICAgICBtYXAuc2V0KHMsIGlkKTtcbiAgICB9XG4gICAgcmV0dXJuIGlkO1xuICB9XG5cbiAgcHVibGljIGZyb21JZChpOiBudW1iZXIpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLl9zdHJpbmdzW2ldO1xuICB9XG59XG5cbi8qKlxuICogRWRnZSBtaXJyb3JcbiAqL1xuZXhwb3J0IGNsYXNzIEVkZ2Uge1xuICBwdWJsaWMgZWRnZUluZGV4OiBFZGdlSW5kZXg7XG4gIHByaXZhdGUgX2hlYXA6IEhlYXBHcmFwaDtcblxuICBjb25zdHJ1Y3RvcihpOiBFZGdlSW5kZXgsIGhlYXA6IEhlYXBHcmFwaCkge1xuICAgIHRoaXMuZWRnZUluZGV4ID0gaTtcbiAgICB0aGlzLl9oZWFwID0gaGVhcDtcbiAgfVxuICBwdWJsaWMgZ2V0IHRvKCk6IE5vZGUge1xuICAgIHJldHVybiBuZXcgTm9kZSh0aGlzLl9oZWFwLmVkZ2VUb05vZGVzW3RoaXMuZWRnZUluZGV4XSwgdGhpcy5faGVhcCk7XG4gIH1cbiAgcHVibGljIGdldCBzaXplKCk6IG51bWJlciB7XG4gICAgY29uc3QgayA9IG5ldyBOb2RlKHRoaXMuX2hlYXAuZWRnZVRvTm9kZXNbdGhpcy5lZGdlSW5kZXhdLHRoaXMuX2hlYXApO1xuICAgIHJldHVybiAoay5zaXplKTtcbiAgfVxuICBwdWJsaWMgZ2V0IHRvSW5kZXgoKTogTm9kZUluZGV4IHtcbiAgICByZXR1cm4gdGhpcy5faGVhcC5lZGdlVG9Ob2Rlc1t0aGlzLmVkZ2VJbmRleF07XG4gIH1cbiAgcHVibGljIGdldCBzbmFwc2hvdFR5cGUoKTogU25hcHNob3RFZGdlVHlwZSB7XG4gICAgcmV0dXJuIHRoaXMuX2hlYXAuZWRnZVR5cGVzW3RoaXMuZWRnZUluZGV4XTtcbiAgfVxuICAvKipcbiAgICogUmV0dXJucyB0aGUgaW5kZXggKG51bWJlcikgb3IgbmFtZSAoc3RyaW5nKSB0aGF0IHRoaXMgZWRnZVxuICAgKiBjb3JyZXNwb25kcyB0by4gKEluZGV4IHR5cGVzIG9jY3VyIGluIEFycmF5cy4pXG4gICAqL1xuICBwdWJsaWMgZ2V0IGluZGV4T3JOYW1lKCk6IHN0cmluZyB8IG51bWJlciB7XG4gICAgY29uc3QgbmFtZU9ySW5kZXggPSB0aGlzLl9oZWFwLmVkZ2VOYW1lc09ySW5kZXhlc1t0aGlzLmVkZ2VJbmRleF07XG4gICAgaWYgKHRoaXMuX2lzSW5kZXgoKSkge1xuICAgICAgcmV0dXJuIG5hbWVPckluZGV4O1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5faGVhcC5zdHJpbmdNYXAuZnJvbUlkKG5hbWVPckluZGV4KTtcbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIFJldHVybnMgJ3RydWUnIGlmIHRoZSBlZGdlIGNvcnJlc3BvbmRzIHRvIGEgdHlwZSB3aGVyZSBuYW1lT3JJbmRleCBpcyBhbiBpbmRleCxcbiAgICogYW5kIGZhbHNlIG90aGVyd2lzZS5cbiAgICovXG4gIHByaXZhdGUgX2lzSW5kZXgoKTogYm9vbGVhbiB7XG4gICAgc3dpdGNoKHRoaXMuc25hcHNob3RUeXBlKSB7XG4gICAgICBjYXNlIFNuYXBzaG90RWRnZVR5cGUuRWxlbWVudDogLy8gQXJyYXkgZWxlbWVudC5cbiAgICAgIGNhc2UgU25hcHNob3RFZGdlVHlwZS5IaWRkZW46IC8vIEhpZGRlbiBmcm9tIGRldmVsb3BlciwgYnV0IGluZmx1ZW5jZXMgaW4tbWVtb3J5IHNpemUuIEFwcGFyZW50bHkgaGFzIGFuIGluZGV4LCBub3QgYSBuYW1lLiBJZ25vcmUgZm9yIG5vdy5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICBjYXNlIFNuYXBzaG90RWRnZVR5cGUuQ29udGV4dFZhcmlhYmxlOiAvLyBDbG9zdXJlIHZhcmlhYmxlLlxuICAgICAgY2FzZSBTbmFwc2hvdEVkZ2VUeXBlLkludGVybmFsOiAvLyBJbnRlcm5hbCBkYXRhIHN0cnVjdHVyZXMgdGhhdCBhcmUgbm90IGFjdGlvbmFibGUgdG8gZGV2ZWxvcGVycy4gSW5mbHVlbmNlIHJldGFpbmVkIHNpemUuIElnbm9yZSBmb3Igbm93LlxuICAgICAgY2FzZSBTbmFwc2hvdEVkZ2VUeXBlLlNob3J0Y3V0OiAvLyBTaG9ydGN1dDogU2hvdWxkIGJlIGlnbm9yZWQ7IGFuIGludGVybmFsIGRldGFpbC5cbiAgICAgIGNhc2UgU25hcHNob3RFZGdlVHlwZS5XZWFrOiAvLyBXZWFrIHJlZmVyZW5jZTogRG9lc24ndCBob2xkIG9udG8gbWVtb3J5LlxuICAgICAgY2FzZSBTbmFwc2hvdEVkZ2VUeXBlLlByb3BlcnR5OiAvLyBQcm9wZXJ0eSBvbiBhbiBvYmplY3QuXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5yZWNvZ25pemVkIGVkZ2UgdHlwZTogJHt0aGlzLnNuYXBzaG90VHlwZX1gKTtcbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIERldGVybWluZXMgd2hhdCB0eXBlIG9mIGVkZ2UgdGhpcyBpcyBpbiBhIGhlYXAgcGF0aC5cbiAgICogUmVjb2duaXplcyBzb21lIHNwZWNpYWwgQkxlYWstaW5zZXJ0ZWQgaGVhcCBlZGdlcyB0aGF0IGNvcnJlc3BvbmRcbiAgICogdG8gaGlkZGVuIGJyb3dzZXIgc3RhdGUuXG4gICAqL1xuICBwdWJsaWMgZ2V0IHBhdGhTZWdtZW50VHlwZSgpOiBQYXRoU2VnbWVudFR5cGUge1xuICAgIHN3aXRjaCh0aGlzLnNuYXBzaG90VHlwZSkge1xuICAgICAgY2FzZSBTbmFwc2hvdEVkZ2VUeXBlLkVsZW1lbnQ6XG4gICAgICAgIHJldHVybiBQYXRoU2VnbWVudFR5cGUuRUxFTUVOVDtcbiAgICAgIGNhc2UgU25hcHNob3RFZGdlVHlwZS5Db250ZXh0VmFyaWFibGU6XG4gICAgICAgIHJldHVybiBQYXRoU2VnbWVudFR5cGUuQ0xPU1VSRV9WQVJJQUJMRTtcbiAgICAgIGNhc2UgU25hcHNob3RFZGdlVHlwZS5JbnRlcm5hbDpcbiAgICAgICAgaWYgKHRoaXMuaW5kZXhPck5hbWUgPT09ICdjb250ZXh0Jykge1xuICAgICAgICAgIHJldHVybiBQYXRoU2VnbWVudFR5cGUuQ0xPU1VSRTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgU25hcHNob3RFZGdlVHlwZS5Qcm9wZXJ0eToge1xuICAgICAgICAvLyBXZSBhc3N1bWUgdGhhdCBubyBvbmUgdXNlcyBvdXIgY2hvc2VuIHNwZWNpYWwgcHJvcGVydHkgbmFtZXMuXG4gICAgICAgIC8vIElmIHRoZSBwcm9ncmFtIGhhcHBlbnMgdG8gaGF2ZSBhIG1lbW9yeSBsZWFrIHN0ZW1taW5nIGZyb20gYSBub24tQkxlYWstY3JlYXRlZFxuICAgICAgICAvLyBwcm9wZXJ0eSB3aXRoIG9uZSBvZiB0aGVzZSBuYW1lcywgdGhlbiBCTGVhayBtaWdodCBub3QgZmluZCBpdC5cbiAgICAgICAgY29uc3QgbmFtZSA9IHRoaXMuaW5kZXhPck5hbWU7XG4gICAgICAgIHN3aXRjaCAobmFtZSkge1xuICAgICAgICAgIGNhc2UgJyQkJERPTSQkJCc6XG4gICAgICAgICAgICByZXR1cm4gUGF0aFNlZ21lbnRUeXBlLkRPTV9UUkVFO1xuICAgICAgICAgIGNhc2UgJyQkbGlzdGVuZXJzJzpcbiAgICAgICAgICAgIHJldHVybiBQYXRoU2VnbWVudFR5cGUuRVZFTlRfTElTVEVORVJfTElTVDtcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmV0dXJuIFBhdGhTZWdtZW50VHlwZS5QUk9QRVJUWTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBjb25zb2xlLmRlYnVnKGBVbnJlY29nbml6ZWQgZWRnZSB0eXBlOiAke3RoaXMuc25hcHNob3RUeXBlfWApXG4gICAgcmV0dXJuIFBhdGhTZWdtZW50VHlwZS5VTktOT1dOO1xuICB9XG59XG5cbmNsYXNzIEVkZ2VJdGVyYXRvciB7XG4gIHByaXZhdGUgX2VkZ2U6IEVkZ2U7XG4gIHByaXZhdGUgX2VkZ2VFbmQ6IG51bWJlcjtcbiAgY29uc3RydWN0b3IoaGVhcDogSGVhcEdyYXBoLCBlZGdlU3RhcnQ6IEVkZ2VJbmRleCwgZWRnZUVuZDogRWRnZUluZGV4KSB7XG4gICAgdGhpcy5fZWRnZSA9IG5ldyBFZGdlKGVkZ2VTdGFydCwgaGVhcCk7XG4gICAgdGhpcy5fZWRnZUVuZCA9IGVkZ2VFbmQ7XG4gIH1cblxuICBwdWJsaWMgaGFzTmV4dCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fZWRnZS5lZGdlSW5kZXggPCB0aGlzLl9lZGdlRW5kO1xuICB9XG5cbiAgcHVibGljIG5leHQoKTogdm9pZCB7XG4gICAgdGhpcy5fZWRnZS5lZGdlSW5kZXgrKztcbiAgfVxuXG4gIHB1YmxpYyBpdGVtKCk6IEVkZ2Uge1xuICAgIHJldHVybiB0aGlzLl9lZGdlO1xuICB9XG59XG5cbi8qKlxuICogTm9kZSBtaXJyb3IuXG4gKi9cbmNsYXNzIE5vZGUge1xuICBwdWJsaWMgbm9kZUluZGV4OiBOb2RlSW5kZXhcbiAgcHJpdmF0ZSBfaGVhcDogSGVhcEdyYXBoO1xuXG4gIGNvbnN0cnVjdG9yKGk6IE5vZGVJbmRleCwgaGVhcDogSGVhcEdyYXBoKSB7XG4gICAgdGhpcy5ub2RlSW5kZXggPSBpO1xuICAgIHRoaXMuX2hlYXAgPSBoZWFwO1xuICB9XG5cbiAgcHVibGljIGdldCB0eXBlKCk6IFNuYXBzaG90Tm9kZVR5cGUge1xuICAgIHJldHVybiB0aGlzLl9oZWFwLm5vZGVUeXBlc1t0aGlzLm5vZGVJbmRleF07XG4gIH1cblxuICBwdWJsaWMgZ2V0IHNpemUoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5faGVhcC5ub2RlU2l6ZXNbdGhpcy5ub2RlSW5kZXhdO1xuICB9XG5cbiAgcHVibGljIGdldCBoYXNDaGlsZHJlbigpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5jaGlsZHJlbkxlbmd0aCAhPT0gMDtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgbmFtZSgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLl9oZWFwLnN0cmluZ01hcC5mcm9tSWQodGhpcy5faGVhcC5ub2RlTmFtZXNbdGhpcy5ub2RlSW5kZXhdKTtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgY2hpbGRyZW5MZW5ndGgoKTogbnVtYmVyIHtcbiAgICBjb25zdCBmZWkgPSB0aGlzLl9oZWFwLmZpcnN0RWRnZUluZGV4ZXM7XG4gICAgcmV0dXJuIGZlaVt0aGlzLm5vZGVJbmRleCArIDFdIC0gZmVpW3RoaXMubm9kZUluZGV4XTtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgY2hpbGRyZW4oKTogRWRnZUl0ZXJhdG9yIHtcbiAgICBjb25zdCBmZWkgPSB0aGlzLl9oZWFwLmZpcnN0RWRnZUluZGV4ZXM7XG4gICAgcmV0dXJuIG5ldyBFZGdlSXRlcmF0b3IodGhpcy5faGVhcCwgZmVpW3RoaXMubm9kZUluZGV4XSwgZmVpW3RoaXMubm9kZUluZGV4ICsgMV0pO1xuICB9XG5cbiAgcHVibGljIGdldENoaWxkKGk6IG51bWJlcik6IEVkZ2Uge1xuICAgIGNvbnN0IGZlaSA9IHRoaXMuX2hlYXAuZmlyc3RFZGdlSW5kZXhlcztcbiAgICBjb25zdCBpbmRleCA9IGZlaVt0aGlzLm5vZGVJbmRleF0gKyBpIGFzIEVkZ2VJbmRleDtcbiAgICBpZiAoaW5kZXggPj0gZmVpW3RoaXMubm9kZUluZGV4ICsgMV0pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBjaGlsZC5gKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBFZGdlKGluZGV4LCB0aGlzLl9oZWFwKTtcbiAgfVxuXG4gIHB1YmxpYyBnZXRSZXRhaW5lZFNpemUoKTogbnVtYmVyIHtcbiAgICAvL05vdyB3ZSBrbm93IHRoZSBzaXplIG9mIHRoZSBub2RlIG5vdyB0YWtpbmcgdGhlIHNpemVzIGZvciB0aGUgY2hpbGRzIHNvIGZvdCB0aGF0IHdlIHdpbGwgYmUgdXNpbmcgdGhlIGFib3ZlIGNvZGVcbiAgICBsZXQgc2l6Om51bWJlciA9IHRoaXMuX2hlYXAubm9kZVNpemVzW3RoaXMubm9kZUluZGV4XTtcbiAgICAvL0dldHRpbmcgdGhlIGZpcnN0IEVkZ2VzIGZvciB0aGUgTm9kZXNcbiAgICBsZXQgZmVpID0gdGhpcy5faGVhcC5maXJzdEVkZ2VJbmRleGVzO1xuICAgIC8vTm93IEZpbmRpbmcgdGhlIG51bWJlciBvZiBlZGdlcyBmb3IgdGhlIGdpdmVuIG5vZGVcbiAgICBsZXQgZmVpXzE6bnVtYmVyID0gZmVpW3RoaXMubm9kZUluZGV4ICsgMV0gLSBmZWlbdGhpcy5ub2RlSW5kZXhdXG4gICAgLy9Jbml0aWFsaXphdGlvbiBvZiBmX3NpemVcbiAgICBsZXQgZl9zaXplOm51bWJlcj0wO1xuICAgIC8vQ2FsbGluZyBsb29wIGZvciBjYWxjdWxhdGluZyBOb2Rlc1xuICAgIGZvcihsZXQgaT0xOyBpIDw9IGZlaV8xOyBpKyspe1xuICAgICAgLy9Ob3cgaW5kZXggd2lsbCBiZSBjYWxsZWQgdG8gc3RvcmUgdGhlIEVkZ2UgSW5kZXhcbiAgICAgIGNvbnN0IGluZGV4ID0gZmVpW3RoaXMubm9kZUluZGV4XSArIGkgYXMgRWRnZUluZGV4O1xuICAgICAgLy9UaGlzIHdpbGwgbWFrZSBlZGdlIGZvciBjb25zdCBpbmRcbiAgICAgIGNvbnN0IGluZD0gbmV3IEVkZ2UoaW5kZXgsIHRoaXMuX2hlYXApO1xuICAgICAgLy9Ob3cgd2Ugd2lsbCBjcmVhdGUgdGhlIGVkZ2VzIHRvIG5vZGUgYW5kIGZpbmQgdGhlaXIgc2l6ZVxuICAgICAgY29uc3QgbnVtOm51bWJlciA9IGluZC5zaXplO1xuICAgICAgLy9Ob3cgc2VlaW5nIHRoZSBlZGdlIG1pcnJvciBjb252ZXJ0aW5nIHRoZSBlZGdlcyBcbiAgICAgIGZfc2l6ZT1zaXorbnVtO1xuICAgIH1cbiAgICByZXR1cm4gKGZfc2l6ZSk7XG4gIH1cblxuICAvKipcbiAgICogTWVhc3VyZXMgdGhlIG51bWJlciBvZiBwcm9wZXJ0aWVzIG9uIHRoZSBub2RlLlxuICAgKiBNYXkgcmVxdWlyZSB0cmF2ZXJzaW5nIGhpZGRlbiBjaGlsZHJlbi5cbiAgICogVGhpcyBpcyB0aGUgZ3Jvd3RoIG1ldHJpYyB3ZSB1c2UuXG4gICAqL1xuICBwdWJsaWMgbnVtUHJvcGVydGllcygpOiBudW1iZXIge1xuICAgIGxldCBjb3VudCA9IDA7XG4gICAgaWYgKHRoaXMuaGFzQ2hpbGRyZW4pIHtcbiAgICAgIGZvciAoY29uc3QgaXQgPSB0aGlzLmNoaWxkcmVuOyBpdC5oYXNOZXh0KCk7IGl0Lm5leHQoKSkge1xuICAgICAgICBjb25zdCBjaGlsZCA9IGl0Lml0ZW0oKTtcbiAgICAgICAgc3dpdGNoKGNoaWxkLnNuYXBzaG90VHlwZSkge1xuICAgICAgICAgIGNhc2UgU25hcHNob3RFZGdlVHlwZS5JbnRlcm5hbDpcbiAgICAgICAgICAgIHN3aXRjaChjaGlsZC5pbmRleE9yTmFtZSkge1xuICAgICAgICAgICAgICBjYXNlIFwiZWxlbWVudHNcIjoge1xuICAgICAgICAgICAgICAgIC8vIENvbnRhaW5zIG51bWVyaWNhbCBwcm9wZXJ0aWVzLCBpbmNsdWRpbmcgdGhvc2Ugb2ZcbiAgICAgICAgICAgICAgICAvLyBhcnJheXMgYW5kIG9iamVjdHMuXG4gICAgICAgICAgICAgICAgY29uc3QgZWxlbWVudHMgPSBjaGlsZC50bztcbiAgICAgICAgICAgICAgICAvLyBPbmx5IGNvdW50IGlmIG5vIGNoaWxkcmVuLlxuICAgICAgICAgICAgICAgIGlmICghZWxlbWVudHMuaGFzQ2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICAgIGNvdW50ICs9IE1hdGguZmxvb3IoZWxlbWVudHMuc2l6ZSAvIDgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBjYXNlIFwidGFibGVcIjoge1xuICAgICAgICAgICAgICAgIC8vIENvbnRhaW5zIE1hcCBhbmQgU2V0IG9iamVjdCBlbnRyaWVzLlxuICAgICAgICAgICAgICAgIGNvbnN0IHRhYmxlID0gY2hpbGQudG87XG4gICAgICAgICAgICAgICAgaWYgKHRhYmxlLmhhc0NoaWxkcmVuKSB7XG4gICAgICAgICAgICAgICAgICBjb3VudCArPSB0YWJsZS5jaGlsZHJlbkxlbmd0aDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgY2FzZSBcInByb3BlcnRpZXNcIjoge1xuICAgICAgICAgICAgICAgIC8vIENvbnRhaW5zIGV4cGFuZG8gcHJvcGVydGllcyBvbiBET00gbm9kZXMsXG4gICAgICAgICAgICAgICAgLy8gcHJvcGVydGllcyBzdG9yaW5nIG51bWJlcnMgb24gb2JqZWN0cyxcbiAgICAgICAgICAgICAgICAvLyBldGMuXG4gICAgICAgICAgICAgICAgY29uc3QgcHJvcHMgPSBjaGlsZC50bztcbiAgICAgICAgICAgICAgICBpZiAocHJvcHMuaGFzQ2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICAgIGNvdW50ICs9IHByb3BzLmNoaWxkcmVuTGVuZ3RoO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBTbmFwc2hvdEVkZ2VUeXBlLkhpZGRlbjpcbiAgICAgICAgICBjYXNlIFNuYXBzaG90RWRnZVR5cGUuU2hvcnRjdXQ6XG4gICAgICAgICAgY2FzZSBTbmFwc2hvdEVkZ2VUeXBlLldlYWs6XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgY291bnQrKztcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjb3VudDtcbiAgfVxufVxuXG4vKipcbiAqIFJlcHJlc2VudHMgYSBoZWFwIHNuYXBzaG90IC8gaGVhcCBncmFwaC5cbiAqL1xuZXhwb3J0IGNsYXNzIEhlYXBHcmFwaCB7XG4gIHB1YmxpYyBzdGF0aWMgYXN5bmMgQ29uc3RydWN0KHBhcnNlcjogSGVhcFNuYXBzaG90UGFyc2VyLCBzdHJpbmdNYXA6IFN0cmluZ01hcCA9IG5ldyBTdHJpbmdNYXAoKSk6IFByb21pc2U8SGVhcEdyYXBoPiB7XG4gICAgY29uc3QgZmlyc3RDaHVuayA9IGF3YWl0IHBhcnNlci5yZWFkKCk7XG4gICAgaWYgKGZpcnN0Q2h1bmsudHlwZSAhPT0gRGF0YVR5cGVzLlNOQVBTSE9UKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEZpcnN0IGNodW5rIGRvZXMgbm90IGNvbnRhaW4gc25hcHNob3QgcHJvcGVydHkuYCk7XG4gICAgfVxuICAgIGNvbnN0IHNuYXBzaG90SW5mbyA9IGZpcnN0Q2h1bmsuZGF0YTtcbiAgICBjb25zdCBtZXRhID0gc25hcHNob3RJbmZvLm1ldGE7XG4gICAgY29uc3Qgbm9kZUZpZWxkcyA9IG1ldGEubm9kZV9maWVsZHM7XG4gICAgY29uc3Qgbm9kZUxlbmd0aCA9IG5vZGVGaWVsZHMubGVuZ3RoO1xuICAgIGNvbnN0IHJvb3ROb2RlSW5kZXggPSAoc25hcHNob3RJbmZvLnJvb3RfaW5kZXggPyBzbmFwc2hvdEluZm8ucm9vdF9pbmRleCAvIG5vZGVMZW5ndGggOiAwKSBhcyBOb2RlSW5kZXg7XG4gICAgY29uc3Qgbm9kZUNvdW50ID0gc25hcHNob3RJbmZvLm5vZGVfY291bnQ7XG4gICAgY29uc3QgZWRnZUNvdW50ID0gc25hcHNob3RJbmZvLmVkZ2VfY291bnQ7XG4gICAgY29uc3Qgbm9kZVR5cGVzID0gbmV3IFVpbnQ4QXJyYXkobm9kZUNvdW50KTtcbiAgICBjb25zdCBub2RlTmFtZXMgPSBuZXcgVWludDMyQXJyYXkobm9kZUNvdW50KTtcbiAgICBjb25zdCBub2RlU2l6ZXMgPSBuZXcgVWludDMyQXJyYXkobm9kZUNvdW50KTtcbiAgICBjb25zdCBmaXJzdEVkZ2VJbmRleGVzID0gbmV3IFVpbnQzMkFycmF5KG5vZGVDb3VudCArIDEpO1xuICAgIGNvbnN0IGVkZ2VUeXBlcyA9IG5ldyBVaW50OEFycmF5KGVkZ2VDb3VudCk7XG4gICAgY29uc3QgZWRnZU5hbWVzT3JJbmRleGVzID0gbmV3IFVpbnQzMkFycmF5KGVkZ2VDb3VudCk7XG4gICAgY29uc3QgZWRnZVRvTm9kZXMgPSBuZXcgVWludDMyQXJyYXkoZWRnZUNvdW50KTtcblxuICAgIHtcbiAgICAgIGNvbnN0IG5vZGVUeXBlT2Zmc2V0ID0gbm9kZUZpZWxkcy5pbmRleE9mKFwidHlwZVwiKTtcbiAgICAgIGNvbnN0IG5vZGVOYW1lT2Zmc2V0ID0gbm9kZUZpZWxkcy5pbmRleE9mKFwibmFtZVwiKTtcbiAgICAgIGNvbnN0IG5vZGVTZWxmU2l6ZU9mZnNldCA9IG5vZGVGaWVsZHMuaW5kZXhPZihcInNlbGZfc2l6ZVwiKTtcbiAgICAgIGNvbnN0IG5vZGVFZGdlQ291bnRPZmZzZXQgPSBub2RlRmllbGRzLmluZGV4T2YoXCJlZGdlX2NvdW50XCIpO1xuICAgICAgY29uc3QgZWRnZUZpZWxkcyA9IG1ldGEuZWRnZV9maWVsZHM7XG4gICAgICBjb25zdCBlZGdlTGVuZ3RoID0gZWRnZUZpZWxkcy5sZW5ndGg7XG4gICAgICBjb25zdCBlZGdlVHlwZU9mZnNldCA9IGVkZ2VGaWVsZHMuaW5kZXhPZihcInR5cGVcIik7XG4gICAgICBjb25zdCBlZGdlTmFtZU9ySW5kZXhPZmZzZXQgPSBlZGdlRmllbGRzLmluZGV4T2YoXCJuYW1lX29yX2luZGV4XCIpO1xuICAgICAgY29uc3QgZWRnZVRvTm9kZU9mZnNldCA9IGVkZ2VGaWVsZHMuaW5kZXhPZihcInRvX25vZGVcIik7XG4gICAgICBsZXQgc3RyaW5nczogQXJyYXk8c3RyaW5nPiA9IFtdO1xuXG4gICAgICBsZXQgbm9kZVB0ciA9IDA7XG4gICAgICBsZXQgZWRnZVB0ciA9IDA7XG4gICAgICBsZXQgbmV4dEVkZ2UgPSAwO1xuICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgY29uc3QgY2h1bmsgPSBhd2FpdCBwYXJzZXIucmVhZCgpO1xuICAgICAgICBpZiAoY2h1bmsgPT09IG51bGwpIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBzd2l0Y2ggKGNodW5rLnR5cGUpIHtcbiAgICAgICAgICBjYXNlIERhdGFUeXBlcy5OT0RFUzoge1xuICAgICAgICAgICAgY29uc3QgZGF0YSA9IGNodW5rLmRhdGE7XG4gICAgICAgICAgICBjb25zdCBkYXRhTGVuID0gZGF0YS5sZW5ndGg7XG4gICAgICAgICAgICBjb25zdCBkYXRhTm9kZUNvdW50ID0gZGF0YUxlbiAvIG5vZGVMZW5ndGg7XG4gICAgICAgICAgICBpZiAoZGF0YUxlbiAlIG5vZGVMZW5ndGggIT09IDApIHtcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBFeHBlY3RlZCBjaHVuayB0byBjb250YWluIHdob2xlIG5vZGVzLiBJbnN0ZWFkLCBjb250YWluZWQgJHtkYXRhTm9kZUNvdW50fSBub2Rlcy5gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIENvcHkgZGF0YSBpbnRvIG91ciB0eXBlZCBhcnJheXMuXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRhdGFOb2RlQ291bnQ7IGkrKykge1xuICAgICAgICAgICAgICBjb25zdCBkYXRhQmFzZSA9IGkgKiBub2RlTGVuZ3RoO1xuICAgICAgICAgICAgICBjb25zdCBhcnJheUJhc2UgPSBub2RlUHRyICsgaTtcbiAgICAgICAgICAgICAgbm9kZVR5cGVzW2FycmF5QmFzZV0gPSBkYXRhW2RhdGFCYXNlICsgbm9kZVR5cGVPZmZzZXRdO1xuICAgICAgICAgICAgICBub2RlTmFtZXNbYXJyYXlCYXNlXSA9IGRhdGFbZGF0YUJhc2UgKyBub2RlTmFtZU9mZnNldF07XG4gICAgICAgICAgICAgIG5vZGVTaXplc1thcnJheUJhc2VdID0gZGF0YVtkYXRhQmFzZSArIG5vZGVTZWxmU2l6ZU9mZnNldF07XG4gICAgICAgICAgICAgIGZpcnN0RWRnZUluZGV4ZXNbYXJyYXlCYXNlXSA9IG5leHRFZGdlO1xuICAgICAgICAgICAgICBuZXh0RWRnZSArPSBkYXRhW2RhdGFCYXNlICsgbm9kZUVkZ2VDb3VudE9mZnNldF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBub2RlUHRyICs9IGRhdGFOb2RlQ291bnQ7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgICAgY2FzZSBEYXRhVHlwZXMuRURHRVM6IHtcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBjaHVuay5kYXRhO1xuICAgICAgICAgICAgY29uc3QgZGF0YUxlbiA9IGRhdGEubGVuZ3RoO1xuICAgICAgICAgICAgY29uc3QgZGF0YUVkZ2VDb3VudCA9IGRhdGFMZW4gLyBlZGdlTGVuZ3RoO1xuICAgICAgICAgICAgaWYgKGRhdGFMZW4gJSBlZGdlTGVuZ3RoICE9PSAwKSB7XG4gICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRXhwZWN0ZWQgY2h1bmsgdG8gY29udGFpbiB3aG9sZSBub2Rlcy4gSW5zdGVhZCwgY29udGFpbmVkICR7ZGF0YUVkZ2VDb3VudH0gbm9kZXMuYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBDb3B5IGRhdGEgaW50byBvdXIgdHlwZWQgYXJyYXlzLlxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkYXRhRWRnZUNvdW50OyBpKyspIHtcbiAgICAgICAgICAgICAgY29uc3QgZGF0YUJhc2UgPSBpICogZWRnZUxlbmd0aDtcbiAgICAgICAgICAgICAgY29uc3QgYXJyYXlCYXNlID0gZWRnZVB0ciArIGk7XG4gICAgICAgICAgICAgIGVkZ2VUeXBlc1thcnJheUJhc2VdID0gZGF0YVtkYXRhQmFzZSArIGVkZ2VUeXBlT2Zmc2V0XTtcbiAgICAgICAgICAgICAgZWRnZU5hbWVzT3JJbmRleGVzW2FycmF5QmFzZV0gPSBkYXRhW2RhdGFCYXNlICsgZWRnZU5hbWVPckluZGV4T2Zmc2V0XTtcbiAgICAgICAgICAgICAgZWRnZVRvTm9kZXNbYXJyYXlCYXNlXSA9IGRhdGFbZGF0YUJhc2UgKyBlZGdlVG9Ob2RlT2Zmc2V0XSAvIG5vZGVMZW5ndGg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlZGdlUHRyICs9IGRhdGFFZGdlQ291bnQ7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgICAgY2FzZSBEYXRhVHlwZXMuU1RSSU5HUzoge1xuICAgICAgICAgICAgc3RyaW5ncyA9IHN0cmluZ3MuY29uY2F0KGNodW5rLmRhdGEpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVuZXhwZWN0ZWQgc25hcHNob3QgY2h1bms6ICR7Y2h1bmsudHlwZX0uYCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vIFByb2Nlc3MgZWRnZU5hbWVPckluZGV4IG5vdy5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZWRnZUNvdW50OyBpKyspIHtcbiAgICAgICAgY29uc3QgZWRnZVR5cGUgPSBlZGdlVHlwZXNbaV07XG4gICAgICAgIHN3aXRjaChlZGdlVHlwZSkge1xuICAgICAgICAgIGNhc2UgU25hcHNob3RFZGdlVHlwZS5FbGVtZW50OiAvLyBBcnJheSBlbGVtZW50LlxuICAgICAgICAgIGNhc2UgU25hcHNob3RFZGdlVHlwZS5IaWRkZW46IC8vIEhpZGRlbiBmcm9tIGRldmVsb3BlciwgYnV0IGluZmx1ZW5jZXMgaW4tbWVtb3J5IHNpemUuIEFwcGFyZW50bHkgaGFzIGFuIGluZGV4LCBub3QgYSBuYW1lLiBJZ25vcmUgZm9yIG5vdy5cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgU25hcHNob3RFZGdlVHlwZS5Db250ZXh0VmFyaWFibGU6IC8vIEZ1bmN0aW9uIGNvbnRleHQuIEkgdGhpbmsgaXQgaGFzIGEgbmFtZSwgbGlrZSBcImNvbnRleHRcIi5cbiAgICAgICAgICBjYXNlIFNuYXBzaG90RWRnZVR5cGUuSW50ZXJuYWw6IC8vIEludGVybmFsIGRhdGEgc3RydWN0dXJlcyB0aGF0IGFyZSBub3QgYWN0aW9uYWJsZSB0byBkZXZlbG9wZXJzLiBJbmZsdWVuY2UgcmV0YWluZWQgc2l6ZS4gSWdub3JlIGZvciBub3cuXG4gICAgICAgICAgY2FzZSBTbmFwc2hvdEVkZ2VUeXBlLlNob3J0Y3V0OiAvLyBTaG9ydGN1dDogU2hvdWxkIGJlIGlnbm9yZWQ7IGFuIGludGVybmFsIGRldGFpbC5cbiAgICAgICAgICBjYXNlIFNuYXBzaG90RWRnZVR5cGUuV2VhazogLy8gV2VhayByZWZlcmVuY2U6IERvZXNuJ3QgaG9sZCBvbnRvIG1lbW9yeS5cbiAgICAgICAgICBjYXNlIFNuYXBzaG90RWRnZVR5cGUuUHJvcGVydHk6IC8vIFByb3BlcnR5IG9uIGFuIG9iamVjdC5cbiAgICAgICAgICAgIGVkZ2VOYW1lc09ySW5kZXhlc1tpXSA9IHN0cmluZ01hcC5nZXQoc3RyaW5nc1tlZGdlTmFtZXNPckluZGV4ZXNbaV1dKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVucmVjb2duaXplZCBlZGdlIHR5cGU6ICR7ZWRnZVR5cGV9YCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGZpcnN0RWRnZUluZGV4ZXNbbm9kZUNvdW50XSA9IGVkZ2VDb3VudDtcbiAgICAgIC8vIFByb2Nlc3Mgbm9kZU5hbWVzIG5vdy5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbm9kZUNvdW50OyBpKyspIHtcbiAgICAgICAgbm9kZU5hbWVzW2ldID0gc3RyaW5nTWFwLmdldChzdHJpbmdzW25vZGVOYW1lc1tpXV0pO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbmV3IEhlYXBHcmFwaChzdHJpbmdNYXAsIG5vZGVUeXBlcywgbm9kZU5hbWVzLCBub2RlU2l6ZXMsXG4gICAgICBmaXJzdEVkZ2VJbmRleGVzLCBlZGdlVHlwZXMsIGVkZ2VOYW1lc09ySW5kZXhlcywgZWRnZVRvTm9kZXMsIHJvb3ROb2RlSW5kZXgpO1xuICB9XG5cbiAgcHVibGljIHJlYWRvbmx5IHN0cmluZ01hcDogU3RyaW5nTWFwO1xuICAvLyBNYXAgZnJvbSBub2RlIGluZGV4ID0+IG5vZGUgdHlwZVxuICBwdWJsaWMgcmVhZG9ubHkgbm9kZVR5cGVzOiBVaW50OEFycmF5O1xuICAvLyBNYXAgZnJvbSBub2RlIGluZGV4ID0+IG5vZGUgbmFtZS5cbiAgcHVibGljIHJlYWRvbmx5IG5vZGVOYW1lczogVWludDMyQXJyYXk7XG4gIC8vIE1hcCBmcm9tIG5vZGUgaW5kZXggPT4gbm9kZSBzaXplLlxuICBwdWJsaWMgcmVhZG9ubHkgbm9kZVNpemVzOiBVaW50MzJBcnJheTtcbiAgLy8gTWFwIGZyb20gTm9kZSBpbmRleCA9PiB0aGUgaW5kZXggb2YgaXRzIGZpcnN0IGVkZ2UgLyB0aGUgbGFzdCBpbmRleCBvZiBJRCAtIDFcbiAgcHVibGljIHJlYWRvbmx5IGZpcnN0RWRnZUluZGV4ZXM6IHtbbjogbnVtYmVyXTogRWRnZUluZGV4fSAmIFVpbnQzMkFycmF5O1xuICAvLyBNYXAgZnJvbSBlZGdlIGluZGV4ID0+IGVkZ2UgdHlwZS5cbiAgcHVibGljIHJlYWRvbmx5IGVkZ2VUeXBlczogVWludDhBcnJheTtcbiAgLy8gTWFwIGZyb20gZWRnZSBpbmRleCA9PiBlZGdlIG5hbWUuXG4gIHB1YmxpYyByZWFkb25seSBlZGdlTmFtZXNPckluZGV4ZXM6IFVpbnQzMkFycmF5O1xuICAvLyBNYXAgZnJvbSBlZGdlIGluZGV4ID0+IGRlc3RpbmF0aW9uIG5vZGUuXG4gIHB1YmxpYyByZWFkb25seSBlZGdlVG9Ob2Rlczoge1tuOiBudW1iZXJdOiBOb2RlSW5kZXh9ICYgVWludDMyQXJyYXk7IC8vIFVpbnQzMkFycmF5XG4gIC8vIEluZGV4IG9mIHRoZSBncmFwaCdzIHJvb3Qgbm9kZS5cbiAgcHVibGljIHJlYWRvbmx5IHJvb3ROb2RlSW5kZXg6IE5vZGVJbmRleDtcbiAgLy8gTGF6aWx5IGluaXRpYWxpemVkIHJldGFpbmVkIHNpemUgYXJyYXkuXG4gIHB1YmxpYyByZWFkb25seSByZXRhaW5lZFNpemU6IFVpbnQzMkFycmF5ID0gbnVsbDtcblxuICBwcml2YXRlIGNvbnN0cnVjdG9yKHN0cmluZ01hcDogU3RyaW5nTWFwLCBub2RlVHlwZXM6IFVpbnQ4QXJyYXksIG5vZGVOYW1lczogVWludDMyQXJyYXksXG4gICAgbm9kZVNpemVzOiBVaW50MzJBcnJheSwgZmlyc3RFZGdlSW5kZXhlczogVWludDMyQXJyYXksIGVkZ2VUeXBlczogVWludDhBcnJheSxcbiAgICBlZGdlTmFtZXNPckluZGV4ZXM6IFVpbnQzMkFycmF5LCBlZGdlVG9Ob2RlczogVWludDMyQXJyYXksIHJvb3ROb2RlSW5kZXg6IE5vZGVJbmRleCkge1xuICAgICAgdGhpcy5zdHJpbmdNYXAgPSBzdHJpbmdNYXA7XG4gICAgICB0aGlzLm5vZGVUeXBlcyA9IG5vZGVUeXBlcztcbiAgICAgIHRoaXMubm9kZU5hbWVzID0gbm9kZU5hbWVzO1xuICAgICAgdGhpcy5ub2RlU2l6ZXMgPSBub2RlU2l6ZXM7XG4gICAgICB0aGlzLmZpcnN0RWRnZUluZGV4ZXMgPSBmaXJzdEVkZ2VJbmRleGVzIGFzIGFueTtcbiAgICAgIHRoaXMuZWRnZVR5cGVzID0gZWRnZVR5cGVzO1xuICAgICAgdGhpcy5lZGdlTmFtZXNPckluZGV4ZXMgPSBlZGdlTmFtZXNPckluZGV4ZXM7XG4gICAgICB0aGlzLmVkZ2VUb05vZGVzID0gZWRnZVRvTm9kZXMgYXMgYW55O1xuICAgICAgdGhpcy5yb290Tm9kZUluZGV4ID0gcm9vdE5vZGVJbmRleDtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgbm9kZUNvdW50KCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMubm9kZVR5cGVzLmxlbmd0aDtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgZWRnZUNvdW50KCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuZWRnZVR5cGVzLmxlbmd0aDtcbiAgfVxuXG4gIHB1YmxpYyBnZXRHbG9iYWxSb290SW5kaWNlcygpOiBudW1iZXJbXSB7XG4gICAgY29uc3QgcnYgPSBuZXcgQXJyYXk8bnVtYmVyPigpO1xuICAgIGNvbnN0IHJvb3QgPSB0aGlzLmdldFJvb3QoKTtcbiAgICBmb3IgKGNvbnN0IGl0ID0gcm9vdC5jaGlsZHJlbjsgaXQuaGFzTmV4dCgpOyBpdC5uZXh0KCkpIHtcbiAgICAgIGNvbnN0IHN1YnJvb3QgPSBpdC5pdGVtKCkudG87XG4gICAgICBpZiAoc3Vicm9vdC50eXBlICE9PSBTbmFwc2hvdE5vZGVUeXBlLlN5bnRoZXRpYykge1xuICAgICAgICBydi5wdXNoKHN1YnJvb3Qubm9kZUluZGV4KTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJ2O1xuICB9XG5cbiAgcHVibGljIGdldFVzZXJSb290SW5kaWNlcygpOiBudW1iZXJbXSB7XG4gICAgY29uc3QgcnYgPSBuZXcgQXJyYXk8bnVtYmVyPigpO1xuICAgIGNvbnN0IHJvb3QgPSB0aGlzLmdldFJvb3QoKTtcbiAgICBmb3IgKGNvbnN0IGl0ID0gcm9vdC5jaGlsZHJlbjsgaXQuaGFzTmV4dCgpOyBpdC5uZXh0KCkpIHtcbiAgICAgIGNvbnN0IHN1YnJvb3QgPSBpdC5pdGVtKCkudG87XG4gICAgICBpZiAoc3Vicm9vdC50eXBlICE9PSBTbmFwc2hvdE5vZGVUeXBlLlN5bnRoZXRpYyB8fCBzdWJyb290Lm5hbWUgPT09IFwiKERvY3VtZW50IERPTSB0cmVlcylcIikge1xuICAgICAgICBydi5wdXNoKHN1YnJvb3Qubm9kZUluZGV4KTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJ2O1xuICB9XG5cbiAgcHVibGljIGdldFJvb3QoKTogTm9kZSB7XG4gICAgcmV0dXJuIG5ldyBOb2RlKHRoaXMucm9vdE5vZGVJbmRleCwgdGhpcyk7XG4gIH1cblxuICBwdWJsaWMgY2FsY3VsYXRlU2l6ZSgpOiBTbmFwc2hvdFNpemVTdW1tYXJ5IHtcbiAgICBjb25zdCBydjogU25hcHNob3RTaXplU3VtbWFyeSA9IHtcbiAgICAgIG51bU5vZGVzOiB0aGlzLm5vZGVDb3VudCxcbiAgICAgIG51bUVkZ2VzOiB0aGlzLmVkZ2VDb3VudCxcbiAgICAgIHRvdGFsU2l6ZTogMCxcbiAgICAgIGhpZGRlblNpemU6IDAsXG4gICAgICBhcnJheVNpemU6IDAsXG4gICAgICBzdHJpbmdTaXplOiAwLFxuICAgICAgb2JqZWN0U2l6ZTogMCxcbiAgICAgIGNvZGVTaXplOiAwLFxuICAgICAgY2xvc3VyZVNpemU6IDAsXG4gICAgICByZWdleHBTaXplOiAwLFxuICAgICAgaGVhcE51bWJlclNpemU6IDAsXG4gICAgICBuYXRpdmVTaXplOiAwLFxuICAgICAgc3ludGhldGljU2l6ZTogMCxcbiAgICAgIGNvbnNTdHJpbmdTaXplOiAwLFxuICAgICAgc2xpY2VkU3RyaW5nU2l6ZTogMCxcbiAgICAgIHN5bWJvbFNpemU6IDAsXG4gICAgICB1bmtub3duU2l6ZTogMFxuICAgIH07XG4gICAgdGhpcy52aXNpdFVzZXJSb290cygobikgPT4ge1xuICAgICAgY29uc3Qgbm9kZVR5cGUgPSBuLnR5cGU7XG4gICAgICBjb25zdCBub2RlU2VsZlNpemUgPSBuLnNpemU7XG4gICAgICBydi50b3RhbFNpemUgKz0gbi5zaXplO1xuICAgICAgc3dpdGNoIChub2RlVHlwZSkge1xuICAgICAgICBjYXNlIFNuYXBzaG90Tm9kZVR5cGUuQXJyYXk6XG4gICAgICAgICAgcnYuYXJyYXlTaXplICs9IG5vZGVTZWxmU2l6ZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBTbmFwc2hvdE5vZGVUeXBlLkNsb3N1cmU6XG4gICAgICAgICAgcnYuY2xvc3VyZVNpemUgKz0gbm9kZVNlbGZTaXplO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFNuYXBzaG90Tm9kZVR5cGUuQ29kZTpcbiAgICAgICAgICBydi5jb2RlU2l6ZSArPSBub2RlU2VsZlNpemU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgU25hcHNob3ROb2RlVHlwZS5Db25zU3RyaW5nOlxuICAgICAgICAgIHJ2LmNvbnNTdHJpbmdTaXplICs9IG5vZGVTZWxmU2l6ZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBTbmFwc2hvdE5vZGVUeXBlLkhlYXBOdW1iZXI6XG4gICAgICAgICAgcnYuaGVhcE51bWJlclNpemUgKz0gbm9kZVNlbGZTaXplO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFNuYXBzaG90Tm9kZVR5cGUuSGlkZGVuOlxuICAgICAgICAgIHJ2LmhpZGRlblNpemUgKz0gbm9kZVNlbGZTaXplO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFNuYXBzaG90Tm9kZVR5cGUuTmF0aXZlOlxuICAgICAgICAgIHJ2Lm5hdGl2ZVNpemUgKz0gbm9kZVNlbGZTaXplO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFNuYXBzaG90Tm9kZVR5cGUuT2JqZWN0OlxuICAgICAgICAgIHJ2Lm9iamVjdFNpemUgKz0gbm9kZVNlbGZTaXplO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFNuYXBzaG90Tm9kZVR5cGUuUmVnRXhwOlxuICAgICAgICAgIHJ2LnJlZ2V4cFNpemUgKz0gbm9kZVNlbGZTaXplO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFNuYXBzaG90Tm9kZVR5cGUuU2xpY2VkU3RyaW5nOlxuICAgICAgICAgIHJ2LnNsaWNlZFN0cmluZ1NpemUgKz0gbm9kZVNlbGZTaXplO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFNuYXBzaG90Tm9kZVR5cGUuU3RyaW5nOlxuICAgICAgICAgIHJ2LnN0cmluZ1NpemUgKz0gbm9kZVNlbGZTaXplO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFNuYXBzaG90Tm9kZVR5cGUuU3ltYm9sOlxuICAgICAgICAgIHJ2LnN5bWJvbFNpemUgKz0gbm9kZVNlbGZTaXplO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFNuYXBzaG90Tm9kZVR5cGUuU3ludGhldGljOlxuICAgICAgICAgIHJ2LnN5bnRoZXRpY1NpemUgKz0gbm9kZVNlbGZTaXplO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFNuYXBzaG90Tm9kZVR5cGUuVW5yZXNvbHZlZDpcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBydi51bmtub3duU2l6ZSArPSBub2RlU2VsZlNpemU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHJ2O1xuICB9XG5cbiAgcHVibGljIHZpc2l0Um9vdCh2aXNpdG9yOiAobjogTm9kZSkgPT4gdm9pZCwgZmlsdGVyOiAobjogTm9kZSwgZTogRWRnZSkgPT4gYm9vbGVhbiA9IG5vbldlYWtGaWx0ZXIpOiB2b2lkIHtcbiAgICBiZnNWaXNpdG9yKHRoaXMsIFt0aGlzLnJvb3ROb2RlSW5kZXhdLCB2aXNpdG9yLCBmaWx0ZXIpO1xuICB9XG5cbiAgcHVibGljIHZpc2l0VXNlclJvb3RzKHZpc2l0b3I6IChuOiBOb2RlKSA9PiB2b2lkLCBmaWx0ZXI6IChuOiBOb2RlLCBlOiBFZGdlKSA9PiBib29sZWFuID0gbm9uV2Vha0ZpbHRlcikge1xuICAgIGJmc1Zpc2l0b3IodGhpcywgdGhpcy5nZXRVc2VyUm9vdEluZGljZXMoKSwgdmlzaXRvciwgZmlsdGVyKTtcbiAgfVxuXG4gIHB1YmxpYyB2aXNpdEdsb2JhbFJvb3RzKHZpc2l0b3I6IChuOiBOb2RlKSA9PiB2b2lkLCBmaWx0ZXI6IChuOiBOb2RlLCBlOiBFZGdlKSA9PiBib29sZWFuID0gbm9uV2Vha0ZpbHRlcikge1xuICAgIGJmc1Zpc2l0b3IodGhpcywgdGhpcy5nZXRHbG9iYWxSb290SW5kaWNlcygpLCB2aXNpdG9yLCBmaWx0ZXIpO1xuICB9XG5cbiAgcHVibGljIHZpc2l0R2xvYmFsRWRnZXModmlzaXRvcjogKGU6IEVkZ2UsIGdldFBhdGg6ICgpID0+IEVkZ2VbXSkgPT4gdm9pZCwgZmlsdGVyOiAobjogTm9kZSwgZTogRWRnZSkgPT4gYm9vbGVhbiA9IG5vbldlYWtGaWx0ZXIpOiB2b2lkIHtcbiAgICBsZXQgaW5pdGlhbCA9IG5ldyBBcnJheTxudW1iZXI+KCk7XG4gICAgY29uc3Qgcm9vdCA9IHRoaXMuZ2V0Um9vdCgpO1xuICAgIGZvciAoY29uc3QgaXQgPSByb290LmNoaWxkcmVuOyBpdC5oYXNOZXh0KCk7IGl0Lm5leHQoKSkge1xuICAgICAgY29uc3QgZWRnZSA9IGl0Lml0ZW0oKTtcbiAgICAgIGNvbnN0IHN1YnJvb3QgPSBlZGdlLnRvO1xuICAgICAgaWYgKHN1YnJvb3QudHlwZSAhPT0gU25hcHNob3ROb2RlVHlwZS5TeW50aGV0aWMpIHtcbiAgICAgICAgaW5pdGlhbC5wdXNoKGVkZ2UuZWRnZUluZGV4KTtcbiAgICAgIH1cbiAgICB9XG4gICAgYmZzRWRnZVZpc2l0b3IodGhpcywgaW5pdGlhbCwgdmlzaXRvciwgZmlsdGVyKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBub25XZWFrRmlsdGVyKG46IE5vZGUsIGU6IEVkZ2UpOiBib29sZWFuIHtcbiAgcmV0dXJuIGUuc25hcHNob3RUeXBlICE9PSBTbmFwc2hvdEVkZ2VUeXBlLldlYWs7XG59XG5cbmZ1bmN0aW9uIG5vcEZpbHRlcihuOiBOb2RlLCBlOiBFZGdlKTogYm9vbGVhbiB7XG4gIHJldHVybiB0cnVlO1xufVxuXG4vKipcbiAqIFZpc2l0IGVkZ2VzIC8gcGF0aHMgaW4gdGhlIGdyYXBoIGluIGEgYnJlYWR0aC1maXJzdC1zZWFyY2guXG4gKiBAcGFyYW0gZyBUaGUgaGVhcCBncmFwaCB0byB2aXNpdC5cbiAqIEBwYXJhbSBpbml0aWFsIEluaXRpYWwgZWRnZSBpbmRpY2VzIHRvIHZpc2l0LlxuICogQHBhcmFtIHZpc2l0b3IgVmlzaXRvciBmdW5jdGlvbi4gQ2FsbGVkIG9uIGV2ZXJ5IHVuaXF1ZSBlZGdlIHZpc2l0ZWQuXG4gKiBAcGFyYW0gZmlsdGVyIEZpbHRlciBmdW5jdGlvbi4gQ2FsbGVkIG9uIGV2ZXJ5IGVkZ2UuIElmIGZhbHNlLCB2aXNpdG9yIGRvZXMgbm90IHZpc2l0IGVkZ2UuXG4gKi9cbmZ1bmN0aW9uIGJmc0VkZ2VWaXNpdG9yKGc6IEhlYXBHcmFwaCwgaW5pdGlhbDogbnVtYmVyW10sIHZpc2l0b3I6IChlOiBFZGdlLCBnZXRQYXRoOiAoKSA9PiBFZGdlW10pID0+IHZvaWQsIGZpbHRlcjogKG46IE5vZGUsIGU6IEVkZ2UpID0+IGJvb2xlYW4gPSBub3BGaWx0ZXIpOiB2b2lkIHtcbiAgY29uc3QgdmlzaXRCaXRzID0gbmV3IE9uZUJpdEFycmF5KGcuZWRnZUNvdW50KTtcbiAgLy8gRXZlcnkgZWRnZSBpcyBhIHBhaXI6IFtwcmV2aW91c0VkZ2UsIGVkZ2VJbmRleF0uXG4gIC8vIENhbiBmb2xsb3cgbGlua2VkIGxpc3QgdG8gcmVjb25zdHJ1Y3QgcGF0aC5cbiAgLy8gSW5kZXggMCBpcyBcInJvb3RcIi5cbiAgY29uc3QgZWRnZXNUb1Zpc2l0ID0gbmV3IFVpbnQzMkFycmF5KChnLmVkZ2VDb3VudCArIDEpIDw8IDEpO1xuICAvLyBMZWF2ZSBmaXJzdCBlbnRyeSBibGFuayBhcyBhIGNhdGNoLWFsbCByb290LlxuICBsZXQgZWRnZXNUb1Zpc2l0TGVuZ3RoID0gMjtcbiAgbGV0IGluZGV4ID0gMjtcblxuICBmdW5jdGlvbiBlbnF1ZXVlKHByZXZJbmRleDogbnVtYmVyLCBlZGdlSW5kZXg6IG51bWJlcik6IHZvaWQge1xuICAgIGVkZ2VzVG9WaXNpdFtlZGdlc1RvVmlzaXRMZW5ndGgrK10gPSBwcmV2SW5kZXg7XG4gICAgZWRnZXNUb1Zpc2l0W2VkZ2VzVG9WaXNpdExlbmd0aCsrXSA9IGVkZ2VJbmRleDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGRlcXVldWUoKTogRWRnZUluZGV4IHtcbiAgICAvLyBJZ25vcmUgdGhlIHByZXYgZWRnZSBsaW5rLlxuICAgIGluZGV4Kys7XG4gICAgcmV0dXJuIGVkZ2VzVG9WaXNpdFtpbmRleCsrXSBhcyBFZGdlSW5kZXg7XG4gIH1cblxuICBpbml0aWFsLmZvckVhY2goKGkpID0+IHtcbiAgICBlbnF1ZXVlKDAsIGkpO1xuICAgIHZpc2l0Qml0cy5zZXQoaSwgdHJ1ZSk7XG4gIH0pO1xuXG4gIGZ1bmN0aW9uIGluZGV4VG9FZGdlKGluZGV4OiBudW1iZXIpOiBFZGdlIHtcbiAgICByZXR1cm4gbmV3IEVkZ2UoaW5kZXggYXMgRWRnZUluZGV4LCBnKTtcbiAgfVxuXG4gIGxldCBjdXJyZW50RW50cnlJbmRleCA9IGluZGV4O1xuICBmdW5jdGlvbiBnZXRQYXRoKCk6IEVkZ2VbXSB7XG4gICAgbGV0IHBJbmRleCA9IGN1cnJlbnRFbnRyeUluZGV4O1xuICAgIGxldCBwYXRoID0gbmV3IEFycmF5PG51bWJlcj4oKTtcbiAgICB3aGlsZSAocEluZGV4ICE9PSAwKSB7XG4gICAgICBwYXRoLnB1c2goZWRnZXNUb1Zpc2l0W3BJbmRleCArIDFdKTtcbiAgICAgIHBJbmRleCA9IGVkZ2VzVG9WaXNpdFtwSW5kZXhdO1xuICAgIH1cbiAgICByZXR1cm4gcGF0aC5yZXZlcnNlKCkubWFwKGluZGV4VG9FZGdlKTtcbiAgfVxuXG4gIGNvbnN0IG5vZGUgPSBuZXcgTm9kZSgwIGFzIE5vZGVJbmRleCwgZyk7XG4gIGNvbnN0IGVkZ2UgPSBuZXcgRWRnZSgwIGFzIEVkZ2VJbmRleCwgZyk7XG4gIHdoaWxlIChpbmRleCA8IGVkZ2VzVG9WaXNpdExlbmd0aCkge1xuICAgIGN1cnJlbnRFbnRyeUluZGV4ID0gaW5kZXg7XG4gICAgZWRnZS5lZGdlSW5kZXggPSBkZXF1ZXVlKCk7XG4gICAgdmlzaXRvcihlZGdlLCBnZXRQYXRoKTtcbiAgICBub2RlLm5vZGVJbmRleCA9IGVkZ2UudG9JbmRleDtcbiAgICBmb3IgKGNvbnN0IGl0ID0gbm9kZS5jaGlsZHJlbjsgaXQuaGFzTmV4dCgpOyBpdC5uZXh0KCkpIHtcbiAgICAgIGNvbnN0IGNoaWxkID0gaXQuaXRlbSgpO1xuICAgICAgaWYgKCF2aXNpdEJpdHMuZ2V0KGNoaWxkLmVkZ2VJbmRleCkgJiYgZmlsdGVyKG5vZGUsIGNoaWxkKSkge1xuICAgICAgICB2aXNpdEJpdHMuc2V0KGNoaWxkLmVkZ2VJbmRleCwgdHJ1ZSk7XG4gICAgICAgIGVucXVldWUoY3VycmVudEVudHJ5SW5kZXgsIGNoaWxkLmVkZ2VJbmRleCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogVmlzaXQgdGhlIGdyYXBoIGluIGEgYnJlYWR0aC1maXJzdC1zZWFyY2guXG4gKiBAcGFyYW0gZyBUaGUgaGVhcCBncmFwaCB0byB2aXNpdC5cbiAqIEBwYXJhbSBpbml0aWFsIEluaXRpYWwgbm9kZShzKSB0byB2aXNpdC5cbiAqIEBwYXJhbSB2aXNpdG9yIFZpc2l0b3IgZnVuY3Rpb24uIENhbGxlZCBvbiBldmVyeSB1bmlxdWUgbm9kZSB2aXNpdGVkLlxuICogQHBhcmFtIGZpbHRlciBGaWx0ZXIgZnVuY3Rpb24uIENhbGxlZCBvbiBldmVyeSBlZGdlLiBJZiBmYWxzZSwgdmlzaXRvciBkb2VzIG5vdCB2aXNpdCBlZGdlLlxuICovXG5mdW5jdGlvbiBiZnNWaXNpdG9yKGc6IEhlYXBHcmFwaCwgaW5pdGlhbDogbnVtYmVyW10sIHZpc2l0b3I6IChuOiBOb2RlKSA9PiB2b2lkLCBmaWx0ZXI6IChuOiBOb2RlLCBlOiBFZGdlKSA9PiBib29sZWFuID0gbm9wRmlsdGVyKTogdm9pZCB7XG4gIGNvbnN0IHZpc2l0Qml0cyA9IG5ldyBPbmVCaXRBcnJheShnLm5vZGVDb3VudCk7XG4gIGNvbnN0IG5vZGVzVG9WaXNpdDoge1tuOiBudW1iZXJdOiBOb2RlSW5kZXh9ICYgVWludDMyQXJyYXkgPSA8YW55PiBuZXcgVWludDMyQXJyYXkoZy5ub2RlQ291bnQpO1xuICBsZXQgbm9kZXNUb1Zpc2l0TGVuZ3RoID0gMDtcbiAgZnVuY3Rpb24gZW5xdWV1ZShub2RlSW5kZXg6IE5vZGVJbmRleCk6IHZvaWQge1xuICAgIG5vZGVzVG9WaXNpdFtub2Rlc1RvVmlzaXRMZW5ndGgrK10gPSBub2RlSW5kZXg7XG4gIH1cblxuICBsZXQgaW5kZXggPSAwO1xuICBpbml0aWFsLm1hcChlbnF1ZXVlKTtcbiAgaW5pdGlhbC5mb3JFYWNoKChpKSA9PiB2aXNpdEJpdHMuc2V0KGksIHRydWUpKTtcblxuICBjb25zdCBub2RlID0gbmV3IE5vZGUoMCBhcyBOb2RlSW5kZXgsIGcpO1xuICBjb25zdCBlZGdlID0gbmV3IEVkZ2UoMCBhcyBFZGdlSW5kZXgsIGcpO1xuICB3aGlsZSAoaW5kZXggPCBub2Rlc1RvVmlzaXRMZW5ndGgpIHtcbiAgICBjb25zdCBub2RlSW5kZXggPSBub2Rlc1RvVmlzaXRbaW5kZXgrK107XG4gICAgbm9kZS5ub2RlSW5kZXggPSBub2RlSW5kZXg7XG4gICAgdmlzaXRvcihub2RlKTtcbiAgICBjb25zdCBmaXJzdEVkZ2VJbmRleCA9IGcuZmlyc3RFZGdlSW5kZXhlc1tub2RlSW5kZXhdO1xuICAgIGNvbnN0IGVkZ2VzRW5kID0gZy5maXJzdEVkZ2VJbmRleGVzW25vZGVJbmRleCArIDFdO1xuICAgIGZvciAobGV0IGVkZ2VJbmRleCA9IGZpcnN0RWRnZUluZGV4OyBlZGdlSW5kZXggPCBlZGdlc0VuZDsgZWRnZUluZGV4KyspIHtcbiAgICAgIGNvbnN0IGNoaWxkTm9kZUluZGV4ID0gZy5lZGdlVG9Ob2Rlc1tlZGdlSW5kZXhdO1xuICAgICAgZWRnZS5lZGdlSW5kZXggPSBlZGdlSW5kZXg7XG4gICAgICBpZiAoIXZpc2l0Qml0cy5nZXQoY2hpbGROb2RlSW5kZXgpICYmIGZpbHRlcihub2RlLCBlZGdlKSkge1xuICAgICAgICB2aXNpdEJpdHMuc2V0KGNoaWxkTm9kZUluZGV4LCB0cnVlKTtcbiAgICAgICAgZW5xdWV1ZShjaGlsZE5vZGVJbmRleCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG4iXX0=