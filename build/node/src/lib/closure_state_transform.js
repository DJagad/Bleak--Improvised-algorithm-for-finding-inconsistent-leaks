"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const esprima_1 = require("esprima");
const astring_1 = require("astring");
const source_map_1 = require("source-map");
const buble_1 = require("buble");
const babel_core_1 = require("babel-core");
const path_1 = require("path");
function getPolyfillInsertion(url) {
    return {
        type: "IfStatement",
        test: {
            type: "BinaryExpression",
            operator: "===",
            left: {
                type: "UnaryExpression",
                operator: "typeof",
                argument: {
                    type: "Identifier",
                    name: "regeneratorRuntime"
                },
                prefix: true
            },
            right: {
                type: "Literal",
                value: "undefined",
                raw: "\"undefined\""
            }
        },
        consequent: {
            type: "BlockStatement",
            body: [{
                    type: "ExpressionStatement",
                    expression: {
                        type: "CallExpression",
                        callee: {
                            type: "Identifier",
                            name: "loadScript"
                        },
                        arguments: [{
                                type: "Literal",
                                value: url,
                                raw: `"${url}"`
                            }]
                    }
                }]
        },
        alternate: null
    };
}
function getAgentInsertion(url) {
    return {
        type: "IfStatement",
        test: {
            type: "BinaryExpression",
            operator: "===",
            left: {
                type: "UnaryExpression",
                operator: "typeof",
                argument: {
                    type: "Identifier",
                    name: "$$$CREATE_SCOPE_OBJECT$$$"
                },
                prefix: true
            },
            right: {
                type: "Literal",
                value: "undefined",
                raw: "\"undefined\""
            }
        },
        consequent: {
            type: "BlockStatement",
            body: [{
                    type: "ExpressionStatement",
                    expression: {
                        type: "CallExpression",
                        callee: {
                            type: "Identifier",
                            name: "loadScript"
                        },
                        arguments: [{
                                type: "Literal",
                                value: url,
                                raw: `"${url}"`
                            }]
                    }
                }]
        },
        alternate: null
    };
}
function getProgramPrelude(statements) {
    return {
        type: "ExpressionStatement",
        expression: {
            type: "CallExpression",
            callee: {
                type: "FunctionExpression",
                id: null,
                params: [],
                body: {
                    type: "BlockStatement",
                    body: [{
                            type: "FunctionDeclaration",
                            id: {
                                type: "Identifier",
                                name: "loadScript"
                            },
                            params: [{
                                    type: "Identifier",
                                    name: "url"
                                }],
                            body: {
                                type: "BlockStatement",
                                body: [{
                                        type: "IfStatement",
                                        test: {
                                            type: "BinaryExpression",
                                            operator: "!==",
                                            left: {
                                                type: "UnaryExpression",
                                                operator: "typeof",
                                                argument: {
                                                    type: "Identifier",
                                                    name: "XMLHttpRequest"
                                                },
                                                prefix: true
                                            },
                                            right: {
                                                type: "Literal",
                                                value: "undefined",
                                                raw: "\"undefined\""
                                            }
                                        },
                                        consequent: {
                                            type: "BlockStatement",
                                            body: [{
                                                    type: "VariableDeclaration",
                                                    declarations: [{
                                                            type: "VariableDeclarator",
                                                            id: {
                                                                type: "Identifier",
                                                                name: "xhr"
                                                            },
                                                            init: {
                                                                type: "NewExpression",
                                                                callee: {
                                                                    type: "Identifier",
                                                                    name: "XMLHttpRequest"
                                                                },
                                                                arguments: []
                                                            }
                                                        }],
                                                    kind: "var"
                                                }, {
                                                    type: "ExpressionStatement",
                                                    expression: {
                                                        type: "CallExpression",
                                                        callee: {
                                                            type: "MemberExpression",
                                                            computed: false,
                                                            object: {
                                                                type: "Identifier",
                                                                name: "xhr"
                                                            },
                                                            property: {
                                                                type: "Identifier",
                                                                name: "open"
                                                            }
                                                        },
                                                        arguments: [{
                                                                type: "Literal",
                                                                value: "GET",
                                                                raw: "'GET'"
                                                            },
                                                            {
                                                                type: "Identifier",
                                                                name: "url"
                                                            },
                                                            {
                                                                type: "Literal",
                                                                value: false,
                                                                raw: "false"
                                                            }]
                                                    }
                                                }, {
                                                    type: "ExpressionStatement",
                                                    expression: {
                                                        type: "CallExpression",
                                                        callee: {
                                                            type: "MemberExpression",
                                                            computed: false,
                                                            object: {
                                                                type: "Identifier",
                                                                name: "xhr"
                                                            },
                                                            property: {
                                                                type: "Identifier",
                                                                name: "send"
                                                            }
                                                        },
                                                        arguments: []
                                                    }
                                                }, {
                                                    type: "ExpressionStatement",
                                                    expression: {
                                                        type: "CallExpression",
                                                        callee: {
                                                            type: "NewExpression",
                                                            callee: {
                                                                type: "Identifier",
                                                                name: "Function"
                                                            },
                                                            arguments: [{
                                                                    type: "MemberExpression",
                                                                    computed: false,
                                                                    object: {
                                                                        type: "Identifier",
                                                                        name: "xhr"
                                                                    },
                                                                    property: {
                                                                        type: "Identifier",
                                                                        name: "responseText"
                                                                    }
                                                                }]
                                                        },
                                                        arguments: []
                                                    }
                                                }]
                                        },
                                        alternate: {
                                            type: "IfStatement",
                                            test: {
                                                type: "BinaryExpression",
                                                operator: "!==",
                                                left: {
                                                    type: "UnaryExpression",
                                                    operator: "typeof",
                                                    argument: {
                                                        type: "Identifier",
                                                        name: "importScripts"
                                                    },
                                                    prefix: true
                                                },
                                                right: {
                                                    type: "Literal",
                                                    value: "undefined",
                                                    raw: "\"undefined\""
                                                }
                                            },
                                            consequent: {
                                                type: "BlockStatement",
                                                body: [{
                                                        type: "ExpressionStatement",
                                                        expression: {
                                                            type: "CallExpression",
                                                            callee: {
                                                                type: "Identifier",
                                                                name: "importScripts"
                                                            },
                                                            arguments: [{
                                                                    type: "Identifier",
                                                                    name: "url"
                                                                }]
                                                        }
                                                    }]
                                            },
                                            alternate: {
                                                type: "BlockStatement",
                                                body: [{
                                                        type: "ThrowStatement",
                                                        argument: {
                                                            type: "NewExpression",
                                                            callee: {
                                                                type: "Identifier",
                                                                name: "Error"
                                                            },
                                                            arguments: [{
                                                                    type: "BinaryExpression",
                                                                    operator: "+",
                                                                    left: {
                                                                        type: "Literal",
                                                                        value: "Unable to load script ",
                                                                        raw: "\"Unable to load script \""
                                                                    },
                                                                    right: {
                                                                        type: "Identifier",
                                                                        name: "url"
                                                                    }
                                                                }]
                                                        }
                                                    }]
                                            }
                                        }
                                    }]
                            },
                            generator: false,
                            async: false
                        }].concat(statements)
                },
                generator: false,
                expression: false,
                async: false
            },
            arguments: []
        }
    };
}
function getExpressionTransform(originalFunction, scopeVarName) {
    const ce = {
        type: "CallExpression",
        callee: {
            type: "Identifier",
            name: "$$$FUNCTION_EXPRESSION$$$",
            loc: originalFunction.loc
        },
        arguments: [originalFunction, { type: "Identifier", name: scopeVarName }],
        loc: originalFunction.loc
    };
    return ce;
}
function getObjectExpressionTransform(original, scopeVarName) {
    const ce = {
        type: "CallExpression",
        callee: {
            type: "Identifier",
            name: "$$$OBJECT_EXPRESSION$$$",
            loc: original.loc
        },
        arguments: [original, { type: "Identifier", name: scopeVarName }],
        loc: original.loc
    };
    return ce;
}
function getScopeAssignment(functionVarName, scopeVarName) {
    return {
        type: "ExpressionStatement",
        expression: {
            type: "CallExpression",
            callee: {
                type: "MemberExpression",
                computed: false,
                object: {
                    type: "Identifier",
                    name: "Object"
                },
                property: {
                    type: "Identifier",
                    name: "defineProperty"
                }
            },
            arguments: [{
                    type: "Identifier",
                    name: functionVarName
                }, {
                    type: "Literal",
                    value: "__scope__",
                    raw: "'__scope__'"
                }, {
                    type: "ObjectExpression",
                    properties: [{
                            type: "Property",
                            key: {
                                type: "Identifier",
                                name: "get"
                            },
                            computed: false,
                            value: {
                                type: "FunctionExpression",
                                id: null,
                                params: [],
                                body: {
                                    type: "BlockStatement",
                                    body: [{
                                            type: "ReturnStatement",
                                            argument: { type: "Identifier", name: scopeVarName }
                                        }]
                                },
                                generator: false,
                                async: false
                            },
                            kind: "init",
                            method: false,
                            shorthand: false
                        }, {
                            type: "Property",
                            key: {
                                type: "Identifier",
                                name: "configurable"
                            },
                            computed: false,
                            value: {
                                type: "Literal",
                                value: true,
                                raw: "true"
                            },
                            kind: "init",
                            method: false,
                            shorthand: false
                        }]
                }]
        }
    };
}
function statementToBlock(s) {
    return {
        type: "BlockStatement",
        body: [s],
        loc: s.loc
    };
}
function statementsToBlock(parent, s) {
    return {
        type: "BlockStatement",
        body: s,
        loc: parent.loc
    };
}
function declarationFromDeclarators(kind, decls) {
    return {
        type: "VariableDeclaration",
        kind: kind,
        declarations: decls,
        loc: {
            start: decls[0].loc.start,
            end: decls[decls.length - 1].loc.end
        }
    };
}
function getStringLiteralArray(names) {
    return names.map((n) => {
        return { type: "Literal", value: n, raw: `"${n}"` };
    });
}
function getIdentifierArray(names) {
    return names.map((n) => {
        return { type: "Identifier", name: n };
    });
}
function getScopeProperties(names) {
    return names.map((n) => {
        return {
            type: "Property",
            key: { type: "Identifier", name: n },
            computed: false,
            value: {
                type: "ObjectExpression",
                properties: [{
                        type: "Property",
                        key: { type: "Identifier", name: "get" },
                        computed: false,
                        value: {
                            type: "FunctionExpression",
                            id: null,
                            params: [],
                            body: {
                                type: "BlockStatement",
                                body: [{
                                        type: "ReturnStatement",
                                        argument: {
                                            type: "Identifier",
                                            name: n
                                        }
                                    }]
                            },
                            generator: false,
                            async: false
                        },
                        kind: "init",
                        method: false,
                        shorthand: false
                    }, {
                        type: "Property",
                        key: { type: "Identifier", name: "set" },
                        computed: false,
                        value: {
                            type: "FunctionExpression",
                            id: null,
                            params: [{ type: "Identifier", name: "v" }],
                            body: {
                                type: "BlockStatement",
                                body: [{
                                        type: "ExpressionStatement",
                                        expression: {
                                            type: "AssignmentExpression",
                                            operator: "=",
                                            left: {
                                                type: "Identifier",
                                                name: n
                                            },
                                            right: {
                                                type: "Identifier",
                                                name: "v"
                                            }
                                        }
                                    }]
                            },
                            generator: false,
                            async: false
                        },
                        kind: "init",
                        method: false,
                        shorthand: false
                    }]
            },
            kind: "init",
            method: false,
            shorthand: false
        };
    });
}
class Variable {
    constructor(type, closedOver = false) {
        this.type = type;
        this.closedOver = closedOver;
    }
}
function closeOver(v) {
    v.closedOver = true;
}
class GlobalScope {
    constructor(scopeIdentifier = "$$$GLOBAL$$$") {
        this._vars = new Map();
        this.scopeIdentifier = scopeIdentifier;
    }
    defineVariable(name, type) {
        // Make all global variables closed over.
        this._vars.set(name, new Variable(type, true));
    }
    maybeCloseOverVariable(name) { }
    evalFound() { }
    shouldMoveTo(name) {
        if (this._vars.has(name)) {
            return this.scopeIdentifier;
        }
        else {
            return null;
        }
    }
    get isFunctionScope() {
        return true;
    }
    finalize() { }
    getScopeAssignments() {
        const rv = new Array();
        this._vars.forEach((v, name) => {
            if (v.type === 3 /* FUNCTION_DECL */) {
                rv.push(getScopeAssignment(name, this.scopeIdentifier));
            }
        });
        return rv;
    }
    getType(name) {
        const entry = this._vars.get(name);
        if (!entry) {
            return 5 /* UNKNOWN */;
        }
        return entry.type;
    }
}
/**
 * ProxyScope is like GlobalScope, except all non-identifiable
 * property writes are proxied to it. Used for Eval and with()
 * statements.
 */
class ProxyScope extends GlobalScope {
    shouldMoveTo(name) {
        return this.scopeIdentifier;
    }
}
class BlockScope {
    constructor(parent, isFunctionScope) {
        this._vars = new Map();
        this._closedOver = false;
        this._evalFound = false;
        this.parent = parent;
        this.isFunctionScope = isFunctionScope;
    }
    finalize(getId) {
        if (this.hasClosedOverVariables && !this._scopeIdentifier) {
            this._scopeIdentifier = getId();
        }
    }
    getType(name) {
        const entry = this._vars.get(name);
        if (!entry) {
            if (this.parent instanceof BlockScope) {
                return this.parent.getType(name);
            }
            else {
                return 5 /* UNKNOWN */;
            }
        }
        return entry.type;
    }
    /**
     * Returns the scope that will act as this scope's parent
     * in the final JavaScript code. We do not emit scopes
     * whose variables are not closed over.
     */
    _getEffectiveParent() {
        let p = this.parent;
        while (p instanceof BlockScope && !p._closedOver) {
            p = p.parent;
        }
        return p;
    }
    defineVariable(name, type) {
        if (type === 1 /* VAR */ && !this.isFunctionScope) {
            // VAR types must be defined in the top-most scope of a function.
            return this.parent.defineVariable(name, type);
        }
        //    if (this._vars.has(name)) {
        // Merge.
        //      console.warn(`Unifying two variables named ${name}!`);
        //    }
        this._vars.set(name, new Variable(type, this._evalFound));
    }
    maybeCloseOverVariable(name) {
        if (!this._vars.has(name) && this.parent !== null) {
            if (this.isFunctionScope && this.parent instanceof BlockScope) {
                // Parent belongs to a different function.
                this.parent._closeOverVariable(name);
            }
            else {
                // Parent *does not* belong to a different function.
                this.parent.maybeCloseOverVariable(name);
            }
        }
    }
    _closeOverVariable(name) {
        const v = this._vars.get(name);
        if (v) {
            v.closedOver = true;
            this._closedOver = true;
        }
        else if (this.parent instanceof BlockScope) {
            this.parent._closeOverVariable(name);
        }
        else {
            // Otherwise, it's a global variable!
            this.parent.maybeCloseOverVariable(name);
        }
    }
    shouldMoveTo(name) {
        const v = this._vars.get(name);
        if (v) {
            if (v.closedOver) {
                return this.scopeIdentifier;
            }
            else {
                return null;
            }
        }
        else {
            return this.parent.shouldMoveTo(name);
        }
    }
    /**
     * Called when a call to eval() is located.
     * Closes over every single variable.
     */
    evalFound() {
        this._evalFound = true;
        this._closedOver = true;
        this._vars.forEach(closeOver);
        this.parent.evalFound();
    }
    get scopeIdentifier() {
        if (!this.hasClosedOverVariables) {
            return this.parent.scopeIdentifier;
        }
        if (this._scopeIdentifier === null) {
            throw new Error(`Cannot retrieve scope identifier of unfinalized scope.`);
        }
        return this._scopeIdentifier;
    }
    get hasClosedOverVariables() {
        return this._closedOver;
    }
    getScopeAssignments() {
        const rv = new Array();
        this._vars.forEach((v, name) => {
            if (v.type === 3 /* FUNCTION_DECL */) {
                rv.push(getScopeAssignment(name, this.scopeIdentifier));
            }
        });
        return rv;
    }
    getScopeCreationStatement() {
        const parent = this._getEffectiveParent();
        const movedIdentifiers = [];
        const unmovedIdentifiers = [];
        const params = [];
        this._vars.forEach((v, name) => {
            if (v.closedOver) {
                switch (v.type) {
                    case 0 /* ARG */:
                        params.push(name);
                        break;
                    case 2 /* CONST */:
                    case 3 /* FUNCTION_DECL */:
                        unmovedIdentifiers.push(name);
                        break;
                    case 4 /* LET */:
                    case 1 /* VAR */:
                        movedIdentifiers.push(name);
                        break;
                }
            }
        });
        return {
            type: "VariableDeclaration",
            declarations: [{
                    type: "VariableDeclarator",
                    id: { type: "Identifier", name: this.scopeIdentifier },
                    init: {
                        type: "CallExpression",
                        callee: { type: "Identifier", name: "$$$CREATE_SCOPE_OBJECT$$$" },
                        arguments: [
                            {
                                type: "Identifier",
                                name: parent.scopeIdentifier
                            }, {
                                type: "ArrayExpression",
                                elements: getStringLiteralArray(movedIdentifiers)
                            }, {
                                type: "ObjectExpression",
                                properties: getScopeProperties(unmovedIdentifiers)
                            }, {
                                type: "ArrayExpression",
                                elements: getStringLiteralArray(params)
                            }, {
                                type: "ArrayExpression",
                                elements: getIdentifierArray(params)
                            }
                        ]
                    }
                }],
            kind: "var"
        };
    }
}
/**
 * AST visitor that only visits nodes that are relevant to our program transformations.
 */
class Visitor {
    constructor() {
        this._strictMode = false;
    }
    _isStrict(n) {
        return n.length > 0 && n[0].type === "ExpressionStatement" && n[0]['directive'] === 'use strict';
    }
    /**
     * [Internal] Visit an array of nodes.
     * @param st
     */
    NodeArray(st) {
        const len = st.length;
        let multipleStatementsEncountered = false;
        for (let i = 0; i < len; i++) {
            const s = st[i];
            const newS = this[s.type](s);
            if (newS === undefined) {
                console.log("Got undefined processing the following:");
                console.log(s);
            }
            st[i] = newS;
            if (st[i].type === "MultipleStatements") {
                multipleStatementsEncountered = true;
            }
        }
        if (multipleStatementsEncountered) {
            let n = new Array();
            for (let i = 0; i < len; i++) {
                const s = st[i];
                if (s.type === "MultipleStatements") {
                    n.push(...s.body);
                }
                else {
                    n.push(s);
                }
            }
            return n;
        }
        return st;
    }
    _setStrictMode(statements) {
        this._strictMode = this._isStrict(statements);
    }
    Program(p) {
        const oldStrictMode = this._strictMode;
        this._setStrictMode(p.body);
        p.body = this.NodeArray(p.body);
        this._strictMode = oldStrictMode;
        return p;
    }
    EmptyStatement(e) {
        return e;
    }
    BlockStatement(b) {
        b.body = this.NodeArray(b.body);
        return b;
    }
    ExpressionStatement(es) {
        const exp = es.expression;
        es.expression = this[exp.type](exp);
        return es;
    }
    IfStatement(is) {
        const test = is.test;
        is.test = this[test.type](test);
        const cons = is.consequent;
        is.consequent = this[cons.type](cons);
        const alt = is.alternate;
        if (alt) {
            is.alternate = this[alt.type](alt);
        }
        return is;
    }
    LabeledStatement(ls) {
        const body = ls.body;
        const newBody = this[body.type](body);
        if (newBody.type === "MultipleStatements") {
            const ms = newBody;
            // Apply label to first applicable statement.
            const stmts = ms.body;
            let found = false;
            forLoop: for (let i = 0; i < stmts.length; i++) {
                const stmt = stmts[i];
                switch (stmt.type) {
                    case "DoWhileStatement":
                    case "WhileStatement":
                    case "ForStatement":
                    case "ForOfStatement":
                    case "ForInStatement":
                    case "SwitchStatement":
                        ls.body = stmt;
                        stmts[i] = ls;
                        found = true;
                        break forLoop;
                }
            }
            if (!found) {
                console.warn(`Unable to find loop to re-attach label to. Attaching to last statement.`);
                ls.body = stmts[stmts.length - 1];
                stmts[stmts.length - 1] = ls;
            }
            return ms;
        }
        else {
            ls.body = newBody;
            return ls;
        }
    }
    BreakStatement(bs) {
        return bs;
    }
    ContinueStatement(cs) {
        return cs;
    }
    WithStatement(ws) {
        ws.object = this[ws.object.type](ws.object);
        ws.body = this[ws.body.type](ws.body);
        return ws;
    }
    SwitchStatement(ss) {
        const disc = ss.discriminant;
        ss.discriminant = this[disc.type](disc);
        const cases = ss.cases;
        const len = cases.length;
        for (let i = 0; i < len; i++) {
            const c = cases[i];
            cases[i] = this[c.type](c);
        }
        return ss;
    }
    ReturnStatement(rs) {
        const arg = rs.argument;
        if (arg) {
            rs.argument = this[arg.type](arg);
        }
        return rs;
    }
    ThrowStatement(ts) {
        const arg = ts.argument;
        ts.argument = this[arg.type](arg);
        return ts;
    }
    TryStatement(ts) {
        ts.block = this.BlockStatement(ts.block);
        if (ts.finalizer) {
            ts.finalizer = this.BlockStatement(ts.finalizer);
        }
        if (ts.handler) {
            ts.handler = this.CatchClause(ts.handler);
        }
        return ts;
    }
    _WhileOrDoWhileStatement(n) {
        const test = n.test;
        n.test = this[test.type](test);
        const body = n.body;
        n.body = this[body.type](body);
        return n;
    }
    WhileStatement(n) {
        return this._WhileOrDoWhileStatement(n);
    }
    DoWhileStatement(n) {
        return this._WhileOrDoWhileStatement(n);
    }
    ForStatement(n) {
        const test = n.test;
        if (test) {
            n.test = this[test.type](test);
        }
        const body = n.body;
        n.body = this[body.type](body);
        const init = n.init;
        if (init) {
            n.init = this[init.type](init);
        }
        const update = n.update;
        if (update) {
            n.update = this[update.type](update);
        }
        return n;
    }
    _ForInAndOfStatement(n) {
        const left = n.left;
        n.left = this[left.type](left);
        const right = n.right;
        n.right = this[right.type](right);
        const body = n.body;
        n.body = this[body.type](body);
        return n;
    }
    ForInStatement(n) {
        return this._ForInAndOfStatement(n);
    }
    ForOfStatement(n) {
        return this._ForInAndOfStatement(n);
    }
    DebuggerStatement(n) {
        return n;
    }
    _Function(n) {
        const oldStrictMode = this._strictMode;
        if (n.async) {
            throw new Error(`Async functions are not yet supported.`);
        }
        if (n.generator) {
            throw new Error(`Generators are not yet supported.`);
        }
        this._setStrictMode(n.body.body);
        n.body = this.BlockStatement(n.body);
        this._strictMode = oldStrictMode;
        return n;
    }
    FunctionDeclaration(n) {
        return this._Function(n);
    }
    FunctionExpression(n) {
        return this._Function(n);
    }
    VariableDeclaration(n) {
        const decls = n.declarations;
        const len = decls.length;
        for (let i = 0; i < len; i++) {
            decls[i] = this.VariableDeclarator(decls[i]);
        }
        return n;
    }
    VariableDeclarator(n) {
        const init = n.init;
        if (init) {
            n.init = this[init.type](init);
        }
        return n;
    }
    ThisExpression(n) {
        return n;
    }
    ArrayExpression(n) {
        const elements = n.elements;
        const len = elements.length;
        for (let i = 0; i < len; i++) {
            const e = elements[i];
            // Possible for this to be null, as in:
            // var a = [,1,2];
            if (e !== null) {
                elements[i] = this[e.type](e);
            }
        }
        return n;
    }
    ObjectExpression(n) {
        const props = n.properties;
        const len = props.length;
        for (let i = 0; i < len; i++) {
            const prop = props[i];
            props[i] = this.Property(prop);
        }
        return n;
    }
    Property(n) {
        switch (n.kind) {
            case "init": {
                const val = n.value;
                n.value = this[val.type](val);
                return n;
            }
            case "set":
            case "get": {
                const body = n.value;
                if (body.type !== "FunctionExpression") {
                    throw new Error(`Unexpected getter/setter body of type ${body.type}!`);
                }
                n.value = this.FunctionExpression(body);
                return n;
            }
            default:
                throw new Error(`Property of kind ${n.kind} not yet supported.`);
        }
    }
    SequenceExpression(n) {
        n.expressions = this.NodeArray(n.expressions);
        return n;
    }
    UnaryExpression(n) {
        const arg = n.argument;
        n.argument = this[arg.type](arg);
        return n;
    }
    BinaryExpression(n) {
        const left = n.left;
        n.left = this[left.type](left);
        const right = n.right;
        n.right = this[right.type](right);
        return n;
    }
    AssignmentExpression(n) {
        const left = n.left;
        n.left = this[left.type](left);
        const right = n.right;
        n.right = this[right.type](right);
        return n;
    }
    UpdateExpression(n) {
        const arg = n.argument;
        n.argument = this[arg.type](arg);
        return n;
    }
    LogicalExpression(n) {
        const left = n.left;
        n.left = this[left.type](left);
        const right = n.right;
        n.right = this[right.type](right);
        return n;
    }
    ConditionalExpression(n) {
        const alt = n.alternate;
        n.alternate = this[alt.type](alt);
        const cons = n.consequent;
        n.consequent = this[cons.type](cons);
        const test = n.test;
        n.test = this[test.type](test);
        return n;
    }
    CallExpression(n) {
        const callee = n.callee;
        n.callee = this[callee.type](callee);
        const args = n.arguments;
        const len = args.length;
        for (let i = 0; i < len; i++) {
            const arg = args[i];
            args[i] = this[arg.type](arg);
        }
        return n;
    }
    NewExpression(n) {
        const callee = n.callee;
        n.callee = this[callee.type](callee);
        const args = n.arguments;
        const len = args.length;
        for (let i = 0; i < len; i++) {
            const arg = args[i];
            args[i] = this[arg.type](arg);
        }
        return n;
    }
    MemberExpression(n) {
        // Rewrite object, the target of the member expression.
        // Leave the property name alone.
        if (n.computed) {
            n.property = this[n.property.type](n.property);
        }
        const obj = n.object;
        n.object = this[obj.type](obj);
        return n;
    }
    SwitchCase(n) {
        const test = n.test;
        if (test) {
            n.test = this[test.type](test);
        }
        n.consequent = this.NodeArray(n.consequent);
        return n;
    }
    CatchClause(n) {
        n.body = this.BlockStatement(n.body);
        return n;
    }
    Identifier(n) {
        return n;
    }
    Literal(n) {
        return n;
    }
    Super(n) {
        throw new Error(`Super is not yet supported.`);
    }
    SpreadElement(n) {
        throw new Error(`SpreadElement is not yet supported.`);
    }
    ArrowFunctionExpression(n) {
        throw new Error(`ArrowFunctionExpression is not yet supported.`);
    }
    YieldExpression(n) {
        throw new Error(`YieldExpression is not yet supported.`);
    }
    TemplateLiteral(n) {
        throw new Error(`TemplateLiteral is not yet supported.`);
    }
    TaggedTemplateExpression(n) {
        throw new Error(`TaggedTemplateExpression is not yet supported.`);
    }
    TemplateElement(n) {
        throw new Error(`TemplateElement is not yet supported.`);
    }
    ObjectPattern(n) {
        throw new Error(`ObjectPattern is not yet supported.`);
    }
    ArrayPattern(n) {
        throw new Error(`ArrayPattern is not yet supported.`);
    }
    RestElement(n) {
        throw new Error(`RestElement is not yet supported.`);
    }
    AssignmentPattern(n) {
        throw new Error(`AssignmentPattern is not yet supported.`);
    }
    ClassBody(n) {
        throw new Error(`ClassBody is not yet supported.`);
    }
    MethodDefinition(n) {
        throw new Error(`MethodDefinition is not yet supported.`);
    }
    ClassDeclaration(n) {
        throw new Error(`ClassDeclaration is not yet supported.`);
    }
    ClassExpression(n) {
        throw new Error(`ClassExpression is not yet supported.`);
    }
    MetaProperty(n) {
        throw new Error(`MetaProperty is not yet supported.`);
    }
    ImportDeclaration(n) {
        throw new Error(`ImportDeclaration is not yet supported.`);
    }
    ImportSpecifier(n) {
        throw new Error(`ImportSpecifier is not yet supported.`);
    }
    ImportDefaultSpecifier(n) {
        throw new Error(`ImportDefaultSpecifier is not yet supported.`);
    }
    ImportNamespaceSpecifier(n) {
        throw new Error(`ImportNamespaceSpecifier is not yet supported.`);
    }
    ExportNamedDeclaration(n) {
        throw new Error(`ExportNamedDeclaration is not yet supported.`);
    }
    ExportSpecifier(n) {
        throw new Error(`ExportSpecifier is not yet supported.`);
    }
    ExportDefaultDeclaration(n) {
        throw new Error(`ExportDefaultDeclaration is not yet supported.`);
    }
    ExportAllDeclaration(n) {
        throw new Error(`ExportAllDeclaration is not yet supported.`);
    }
    AwaitExpression(n) {
        throw new Error(`AwaitExpression is not yet supported.`);
    }
}
/**
 * Checks that the given code is ES5 compatible. Throws an exception if not.
 */
class ES5CheckingVisitor extends Visitor {
    constructor(polyfillUrl) {
        super();
        this._polyfillUrl = polyfillUrl;
    }
    Program(p) {
        const rv = super.Program(p);
        if (this._polyfillUrl !== null) {
            rv.body.unshift(getProgramPrelude([getPolyfillInsertion(this._polyfillUrl)]));
        }
        return rv;
    }
}
/**
 * Collects information about scopes in the program and performs the following transformations:
 *
 * - Function declarations that are *not* in a top-most function scope are rewritten to be
 *   function expressions. This is undefined behavior in JavaScript, and our rewritten code
 *   is consistent with V8's behavior.
 * - Single-line bodies of conditionals are converted into block statements.
 * - Moves multiple variable declarators in For loops into parent.
 */
class ScopeScanningVisitor extends Visitor {
    constructor(scopeMap, symbols, globalScope) {
        super();
        this._scope = null;
        this._nextBlockIsFunction = false;
        this._nextBlockIsWith = false;
        this._defineInNextBlock = [];
        this._scopeMap = scopeMap;
        this._symbols = symbols;
        this._scope = globalScope;
    }
    static Visit(ast, scopeMap, symbols, globalScope = new GlobalScope()) {
        const visitor = new ScopeScanningVisitor(scopeMap, symbols, globalScope);
        return visitor.Program(ast);
    }
    Program(p) {
        const rv = super.Program(p);
        this._scopeMap.set(rv, this._scope);
        return rv;
    }
    FunctionDeclaration(fd) {
        if (!this._scope.isFunctionScope) {
            // Undefined behavior! Function declaration is not in top-level scope of function.
            // Turn into a function expression assignment to a var. Chrome seems to treat it as such.
            // Will be re-visited later as a FunctionExpression.
            const rewrite = {
                type: "VariableDeclaration",
                declarations: [{
                        type: "VariableDeclarator",
                        id: fd.id,
                        init: {
                            type: "FunctionExpression",
                            // Remove name of function to avoid clashes with
                            // new variable name.
                            id: null,
                            params: fd.params,
                            body: fd.body,
                            generator: fd.generator,
                            async: fd.async,
                            loc: fd.loc
                        },
                        loc: fd.loc
                    }],
                kind: "var",
                loc: fd.loc
            };
            return this.VariableDeclaration(rewrite);
        }
        else {
            this._nextBlockIsFunction = true;
            const args = fd.params;
            for (const arg of args) {
                switch (arg.type) {
                    case "Identifier":
                        this._defineInNextBlock.push({ type: 0 /* ARG */, name: arg.name });
                        break;
                    default:
                        throw new Error(`Unsupported function parameter type: ${arg.type}`);
                }
            }
            this._scope.defineVariable(fd.id.name, 3 /* FUNCTION_DECL */);
            this._symbols.add(fd.id.name);
            return super.FunctionDeclaration(fd);
        }
    }
    FunctionExpression(fe) {
        if (fe.id) {
            this._defineInNextBlock.push({ type: 2 /* CONST */, name: fe.id.name });
        }
        const args = fe.params;
        for (const arg of args) {
            switch (arg.type) {
                case "Identifier":
                    this._defineInNextBlock.push({ type: 0 /* ARG */, name: arg.name });
                    break;
                default:
                    throw new Error(`Unsupported function parameter type: ${arg.type}`);
            }
        }
        this._nextBlockIsFunction = true;
        const rv = super.FunctionExpression(fe);
        // Rewrite.
        return rv;
    }
    BlockStatement(bs) {
        const oldBs = this._scope;
        if (this._nextBlockIsWith) {
            this._nextBlockIsWith = false;
            this._scope = new BlockScope(new ProxyScope(), this._nextBlockIsFunction);
        }
        else {
            this._scope = new BlockScope(oldBs, this._nextBlockIsFunction);
        }
        this._nextBlockIsFunction = false;
        if (this._defineInNextBlock.length > 0) {
            const dinb = this._defineInNextBlock;
            for (const v of dinb) {
                this._scope.defineVariable(v.name, v.type);
                this._symbols.add(v.name);
            }
            this._defineInNextBlock = [];
        }
        const rv = super.BlockStatement(bs);
        this._scopeMap.set(bs, this._scope);
        this._scope = oldBs;
        return rv;
    }
    VariableDeclaration(vd) {
        let kind;
        switch (vd.kind) {
            case "var":
                kind = 1 /* VAR */;
                break;
            case "let":
                kind = 4 /* LET */;
                break;
            case "const":
                kind = 2 /* CONST */;
                break;
            default:
                throw new Error(`Unrecognized variable declaration type: ${vd.kind}`);
        }
        const decls = vd.declarations;
        for (const decl of decls) {
            const id = decl.id;
            switch (id.type) {
                case "Identifier":
                    this._scope.defineVariable(id.name, kind);
                    this._symbols.add(id.name);
                    break;
                default:
                    throw new Error(`Unrecognized variable declaration type: ${id.type}`);
            }
        }
        return super.VariableDeclaration(vd);
    }
    BinaryExpression(bd) {
        const rv = super.BinaryExpression(bd);
        // Rewrite equality so that Proxy(A) and A are equivalent.
        const op = bd.operator;
        switch (op) {
            case '===':
            case '==':
            case '!==':
            case '!=': {
                const strict = op.length === 3;
                const not = op[0] === '!';
                const ce = {
                    type: "CallExpression",
                    callee: {
                        type: "Identifier",
                        name: `$$$${strict ? 'S' : ''}EQ$$$`
                    },
                    arguments: [
                        rv.left,
                        rv.right
                    ],
                    loc: rv.loc
                };
                if (not) {
                    const ue = {
                        type: "UnaryExpression",
                        operator: "!",
                        argument: ce,
                        loc: rv.loc,
                        prefix: true
                    };
                    return this.UnaryExpression(ue);
                }
                else {
                    return this.CallExpression(ce);
                }
            }
            default:
                return rv;
        }
    }
    CatchClause(cc) {
        const param = cc.param;
        switch (param.type) {
            case "Identifier":
                this._defineInNextBlock.push({ type: 0 /* ARG */, name: param.name });
                this._symbols.add(param.name);
                break;
            default:
                throw new Error(`Unrecognized parameter type in catch clause: ${param.type}`);
        }
        return super.CatchClause(cc);
    }
    Identifier(n) {
        this._symbols.add(n.name);
        return n;
    }
    CallExpression(ce) {
        const id = ce.callee;
        if (id.type === "Identifier" && id.name === "eval") {
            this._scope.evalFound();
        }
        return super.CallExpression(ce);
    }
    IfStatement(is) {
        const cons = is.consequent;
        if (cons.type !== "BlockStatement") {
            is.consequent = statementToBlock(cons);
        }
        const alt = is.alternate;
        if (alt) {
            switch (alt.type) {
                case "IfStatement": // Valid `else if`
                case "BlockStatement":// Valid `else`
                    break;
                default:
                    // Single-line else.
                    is.alternate = statementToBlock(alt);
                    break;
            }
        }
        return super.IfStatement(is);
    }
    _WhileOrDoWhileStatement(ws) {
        if (ws.body.type !== "BlockStatement") {
            ws.body = statementToBlock(ws.body);
        }
        return super._WhileOrDoWhileStatement(ws);
    }
    _ForInAndOfStatement(fs) {
        if (fs.body.type !== "BlockStatement") {
            fs.body = statementToBlock(fs.body);
        }
        return super._ForInAndOfStatement(fs);
    }
    SwitchCase(sc) {
        const cons = sc.consequent;
        if (cons.length !== 1 || cons[0].type !== "BlockStatement") {
            sc.consequent = [
                statementsToBlock(sc, cons)
            ];
        }
        return super.SwitchCase(sc);
    }
    ForStatement(fs) {
        if (fs.body.type !== "BlockStatement") {
            fs.body = statementToBlock(fs.body);
        }
        const init = fs.init;
        if (init && init.type === "VariableDeclaration" && init.declarations.length > 1) {
            // Hoist declaration outside of loop, otherwise it may cause trouble for us down the road
            // in subsequent AST modifications.
            fs.init = null;
            return {
                type: "MultipleStatements",
                body: [
                    this.VariableDeclaration(init),
                    super.ForStatement(fs)
                ],
                loc: fs.loc
            };
        }
        return super.ForStatement(fs);
    }
    WithStatement(ws) {
        if (ws.body.type !== "BlockStatement") {
            ws.body = {
                type: "BlockStatement",
                body: [ws.body],
                loc: ws.body.loc
            };
        }
        // Treat like an eval; toss everything.
        this._scope.evalFound();
        this._nextBlockIsWith = true;
        return super.WithStatement(ws);
    }
}
/**
 * Once the previous visitor has created all of the necessary scopes, this pass checks which local variables escape into function closures.
 */
class EscapeAnalysisVisitor extends Visitor {
    constructor(scopeMap) {
        super();
        this._scope = null;
        this._scopeMap = scopeMap;
    }
    static Visit(ast, scopeMap) {
        const visitor = new EscapeAnalysisVisitor(scopeMap);
        return visitor.Program(ast);
    }
    Program(p) {
        const prev = this._scope;
        this._scope = this._scopeMap.get(p);
        const rv = super.Program(p);
        this._scope = prev;
        return rv;
    }
    BlockStatement(bs) {
        const prev = this._scope;
        this._scope = this._scopeMap.get(bs);
        const rv = super.BlockStatement(bs);
        this._scope = prev;
        return rv;
    }
    Identifier(n) {
        this._scope.maybeCloseOverVariable(n.name);
        return n;
    }
}
/**
 * Creates scope objects where needed, moves closed-over variables into them,
 * assigns __scope__ on function objects, and rewrites equality statements to use
 * $$$EQ$$$ / $$$SEQ$$$.
 */
class ScopeCreationVisitor extends Visitor {
    constructor(scopeMap, symbols, agentUrl, polyfillUrl) {
        super();
        this._scope = null;
        this._nextFunctionExpressionIsGetterOrSetter = false;
        this._getterOrSetterVisited = false;
        this._nextScope = 0;
        this._getNextScope = () => {
            let name;
            do {
                name = `s${this._nextScope++}`;
            } while (this._symbols.has(name));
            this._symbols.add(name);
            return name;
        };
        this._scopeMap = scopeMap;
        this._symbols = symbols;
        this._agentUrl = agentUrl;
        this._polyfillUrl = polyfillUrl;
    }
    static Visit(ast, scopeMap, symbols, agentUrl, polyfillUrl) {
        const visitor = new ScopeCreationVisitor(scopeMap, symbols, agentUrl, polyfillUrl);
        return visitor.Program(ast);
    }
    _insertScopeCreationAndFunctionScopeAssignments(n, isProgram) {
        let mods = this._scope instanceof BlockScope && this._scope.hasClosedOverVariables ? [this._scope.getScopeCreationStatement()] : [];
        if (isProgram) {
            const insertions = [getAgentInsertion(this._agentUrl)];
            if (this._polyfillUrl !== null) {
                insertions.push(getPolyfillInsertion(this._polyfillUrl));
            }
            mods = [getProgramPrelude(insertions)].concat(mods);
        }
        mods = mods.concat(this._scope.getScopeAssignments());
        if (mods.length === 0) {
            return n;
        }
        const isStrict = this._isStrict(n);
        const offset = isStrict ? 1 : 0;
        return n.slice(0, offset).concat(mods).concat(n.slice(offset));
    }
    Program(p) {
        this._scope = this._scopeMap.get(p);
        this._scope.finalize(this._getNextScope);
        const rv = super.Program(p);
        p.body = this._insertScopeCreationAndFunctionScopeAssignments(p.body, true);
        this._scope = null;
        return rv;
    }
    BlockStatement(bs) {
        const oldBs = this._scope;
        this._scope = this._scopeMap.get(bs);
        this._scope.finalize(this._getNextScope);
        const rv = super.BlockStatement(bs);
        rv.body = this._insertScopeCreationAndFunctionScopeAssignments(rv.body, false);
        this._scope = oldBs;
        return rv;
    }
    Identifier(i) {
        const to = this._scope.shouldMoveTo(i.name);
        if (to) {
            return {
                type: "MemberExpression",
                computed: false,
                object: {
                    type: "Identifier",
                    name: to,
                    loc: i.loc
                },
                property: {
                    type: "Identifier",
                    name: i.name,
                    loc: i.loc
                },
                loc: i.loc
            };
        }
        return i;
    }
    VariableDeclarator(decl) {
        const id = decl.id;
        if (id.type !== "Identifier") {
            throw new Error(`Does not support variable declarations with non-identifiers.`);
        }
        const init = decl.init;
        if (init) {
            decl.init = this[init.type](init);
        }
        const newId = this.Identifier(id);
        if (newId.type === "MemberExpression") {
            return {
                type: "ExpressionStatement",
                expression: {
                    type: "AssignmentExpression",
                    operator: "=",
                    left: newId,
                    right: decl.init ? decl.init : { type: "Identifier", name: "undefined", loc: decl.loc },
                    loc: decl.loc
                },
                loc: decl.loc
            };
        }
        else {
            return decl;
        }
    }
    VariableDeclaration(vd) {
        // Note: Order is important, as initializers may have side effects.
        const newDecls = vd.declarations.map((d) => this.VariableDeclarator(d));
        let s = new Array();
        let currentDecls = new Array();
        const len = newDecls.length;
        for (let i = 0; i < len; i++) {
            const d = newDecls[i];
            switch (d.type) {
                case "VariableDeclarator":
                    currentDecls.push(d);
                    break;
                case "MemberExpression":
                    // No initializer; side-effect free. Don't emit anything.
                    break;
                case "ExpressionStatement":
                    if (currentDecls.length > 0) {
                        s.push(declarationFromDeclarators(vd.kind, currentDecls));
                        currentDecls = [];
                    }
                    s.push(d);
                    break;
            }
        }
        if (currentDecls.length === vd.declarations.length) {
            s.push(vd);
        }
        else if (currentDecls.length > 0) {
            s.push(declarationFromDeclarators(vd.kind, currentDecls));
        }
        if (s.length === 0) {
            // Return an empty variable declarator, which works when
            // this is used as an expression or a statement.
            return {
                type: "VariableDeclaration",
                kind: "var",
                declarations: [{
                        type: "VariableDeclarator",
                        id: { type: "Identifier", name: this._getNextScope() }
                    }]
            };
        }
        else if (s.length !== 1) {
            // Emit also if length is 0!!
            return {
                type: "MultipleStatements",
                body: s
            };
        }
        else {
            return s[0];
        }
    }
    _ForInAndOfStatement(fs) {
        const rv = super._ForInAndOfStatement(fs);
        const left = rv.left;
        // Cannot have statements on the left of a `for in` or `for of`.
        // Unwrap into an expression.
        if (left.type === "ExpressionStatement") {
            rv.left = left.expression;
            if (rv.left.type === "AssignmentExpression") {
                rv.left = rv.left.left;
            }
        }
        return rv;
    }
    ForStatement(f) {
        const rv = super.ForStatement(f);
        const init = rv.init;
        // Cannot have statements for the initialization expression.
        // Unwrap into an expression.
        if (init && init.type === "ExpressionStatement") {
            rv.init = init.expression;
        }
        return rv;
    }
    CallExpression(ce) {
        const oldCallee = ce.callee;
        const rv = super.CallExpression(ce);
        const callee = rv.callee;
        const scopeId = this._scope.scopeIdentifier;
        switch (callee.type) {
            case "Identifier":
                if (callee.name === "eval") {
                    callee.name = "$$$REWRITE_EVAL$$$";
                    rv.arguments.unshift({
                        type: "Identifier",
                        name: scopeId
                    });
                }
                break;
            case "MemberExpression":
                if (oldCallee.type === "Identifier") {
                    // We moved the target into the heap.
                    // Translate into a LogicalExpression to preserve the value of `this`.
                    rv.callee = {
                        type: "LogicalExpression",
                        operator: "||",
                        left: callee,
                        right: callee,
                        loc: callee.loc
                    };
                }
                break;
        }
        return rv;
    }
    FunctionExpression(fe) {
        const isGetterOrSetter = this._nextFunctionExpressionIsGetterOrSetter;
        this._nextFunctionExpressionIsGetterOrSetter = false;
        const rv = super.FunctionExpression(fe);
        if (isGetterOrSetter) {
            // Transformation is not applicable.
            return rv;
        }
        else {
            // Scope assignment.
            return getExpressionTransform(rv, this._scope.scopeIdentifier);
        }
    }
    /*public UpdateExpression(ue: UpdateExpression): UpdateExpression | SequenceExpression {
      const oldArg = ue.argument;
      const rv = super.UpdateExpression(ue);
      const arg = ue.argument;
      if (!this._isStrict && oldArg.type !== arg.type && oldArg.type === "Identifier" && this._blockScope.getType(oldArg.name) === VarType.ARG) {
        // Update is applied to an argument that was moved to the heap.
        // Turn into sequence expression so RHS is consistent.
        // NOOOO. Doesn't work for var a = l++;
        return {
          type: "SequenceExpression",
          expressions: [
            {
              type: "UpdateExpression",
              operator: ue.operator,
              argument: oldArg,
              prefix: ue.prefix,
              loc: ue.loc
            },
            rv
          ],
          loc: ue.loc
        };
      }
      return rv;
    }*/
    AssignmentExpression(node) {
        const oldLeft = node.left;
        const rv = super.AssignmentExpression(node);
        // Check if LHS is an argument and if we are not in strict mode.
        // If so, arguments object is aliased to individual arguments. Some code relies on this aliasing.
        const left = rv.left;
        if (!this._isStrict && oldLeft.type !== left.type && oldLeft.type === "Identifier" && this._scope.getType(oldLeft.name) === 0 /* ARG */) {
            // Rewrite RHS to assign to actual argument variable, too.
            // Works even if RHS is +=, etc.
            return {
                type: "AssignmentExpression",
                operator: "=",
                left: {
                    type: "Identifier",
                    name: oldLeft.name
                },
                right: rv,
                loc: rv.loc
            };
        }
        return rv;
    }
    WithStatement(node) {
        const id = this._getNextScope();
        let v = {
            type: "VariableDeclaration",
            kind: "var",
            declarations: [{
                    type: "VariableDeclarator",
                    id: { type: "Identifier", name: id },
                    init: {
                        type: "CallExpression",
                        callee: {
                            type: "Identifier",
                            name: "$$$CREATE_WITH_SCOPE$$$"
                        },
                        arguments: [this[node.object.type](node.object), { type: "Identifier", name: this._scope.scopeIdentifier }]
                    }
                }],
            loc: node.object.loc
        };
        node.object = {
            type: "Identifier",
            name: id
        };
        const scope = this._scopeMap.get(node.body);
        if (!(scope.parent instanceof ProxyScope)) {
            throw new Error(`?!??!!?`);
        }
        scope.parent.scopeIdentifier = id;
        const rv = this.BlockStatement(node.body);
        rv.body = [v].concat(rv.body);
        return rv;
    }
    Property(p) {
        switch (p.kind) {
            case "get":
            case "set":
                this._nextFunctionExpressionIsGetterOrSetter = true;
                break;
            case "init":
                break;
            default:
                throw new Error(`Unrecognized property kind: ${p.kind}`);
        }
        return super.Property(p);
    }
    ObjectExpression(n) {
        const oldGetterSetter = this._getterOrSetterVisited;
        this._getterOrSetterVisited = false;
        const rv = super.ObjectExpression(n);
        const hasGetterSetter = this._getterOrSetterVisited;
        this._getterOrSetterVisited = oldGetterSetter;
        if (hasGetterSetter) {
            return getObjectExpressionTransform(n, this._scope.scopeIdentifier);
        }
        else {
            return rv;
        }
    }
}
function exposeClosureStateInternal(filename, source, sourceMap, agentUrl, polyfillUrl, evalScopeName) {
    let ast = esprima_1.parse(source, { loc: true });
    {
        const firstStatement = ast.body[0];
        if (firstStatement && firstStatement.type === "ExpressionStatement") {
            // Esprima feature.
            if (firstStatement.directive === "no transform") {
                return source;
            }
        }
    }
    const map = new Map();
    const symbols = new Set();
    ast = ScopeCreationVisitor.Visit(EscapeAnalysisVisitor.Visit(ScopeScanningVisitor.Visit(ast, map, symbols, evalScopeName ? new BlockScope(new ProxyScope(evalScopeName), true) : undefined), map), map, symbols, agentUrl, polyfillUrl);
    return astring_1.generate(ast, { sourceMap });
}
function embedSourceMap(source, sourceMap) {
    return `${source}//# sourceMappingURL=data:application/json;base64,${new Buffer(sourceMap, "utf8").toString("base64")}`;
}
function mergeMaps(file, source, rawMap1, rawMap2) {
    const map1 = new source_map_1.SourceMapConsumer(rawMap1);
    const map2 = new source_map_1.SourceMapConsumer(rawMap2);
    const out = new source_map_1.SourceMapGenerator({ file });
    map2.eachMapping((map) => {
        const og = map1.originalPositionFor({
            line: map.originalLine,
            column: map.originalColumn
        });
        if (og && og.line !== null && og.column !== null) {
            // generated original source name
            out.addMapping({
                generated: {
                    line: map.generatedLine,
                    column: map.generatedColumn
                },
                original: og,
                name: map.name,
                source: map.source
            });
        }
    });
    out.setSourceContent(file, source);
    return out.toString();
}
function tryJSTransform(filename, source, transform) {
    try {
        const sourceMap = new source_map_1.SourceMapGenerator({
            file: filename
        });
        const converted = transform(filename, source, sourceMap, false);
        sourceMap.setSourceContent(filename, source);
        return embedSourceMap(converted, sourceMap.toString());
    }
    catch (e) {
        try {
            // Might be ES2015. Try to transform with buble first; it's significantly faster than babel.
            const transformed = buble_1.transform(source, { source: filename });
            const conversionSourceMap = new source_map_1.SourceMapGenerator({
                file: filename
            });
            const converted = transform(filename, transformed.code, conversionSourceMap, false);
            return embedSourceMap(converted, mergeMaps(filename, source, transformed.map, conversionSourceMap.toJSON()));
        }
        catch (e) {
            try {
                // Might be even crazier ES2015! Use Babel (SLOWEST PATH)
                // Babel wants to know the exact location of this preset plugin.
                // I really don't like Babel's (un)usability.
                const envPath = path_1.dirname(require.resolve('babel-preset-env/package.json'));
                const transformed = babel_core_1.transform(source, {
                    sourceMapTarget: filename,
                    sourceFileName: filename,
                    compact: true,
                    sourceMaps: true,
                    // Disable modules to disable global "use strict"; declaration
                    // https://stackoverflow.com/a/39225403
                    presets: [[envPath, { "modules": false }]]
                });
                const conversionSourceMap = new source_map_1.SourceMapGenerator({
                    file: filename
                });
                const converted = transform(filename, transformed.code, conversionSourceMap, true);
                return embedSourceMap(converted, mergeMaps(filename, source, transformed.map, conversionSourceMap.toJSON()));
            }
            catch (e) {
                console.error(`Unable to transform ${filename} - going to proceed with untransformed JavaScript!\nError:`);
                console.error(e);
                return source;
            }
        }
    }
}
/**
 * Ensures that the given JavaScript source file is ES5 compatible.
 * @param filename
 * @param source
 * @param agentUrl
 * @param polyfillUrl
 * @param evalScopeName
 */
function ensureES5(filename, source, agentUrl = "bleak_agent.js", polyfillUrl = "bleak_polyfill.js", evalScopeName) {
    return tryJSTransform(filename, source, (filename, source, sourceMap, needsBabel) => {
        const visitor = new ES5CheckingVisitor(needsBabel ? polyfillUrl : null);
        let ast = esprima_1.parse(source, { loc: true });
        {
            const firstStatement = ast.body[0];
            if (firstStatement && firstStatement.type === "ExpressionStatement") {
                // Esprima feature.
                if (firstStatement.directive === "no transform") {
                    return source;
                }
            }
        }
        ast = visitor.Program(ast);
        return astring_1.generate(ast, { sourceMap });
    });
}
exports.ensureES5 = ensureES5;
/**
 * Given a JavaScript source file, modifies all function declarations and expressions to expose
 * their closure state on the function object.
 *
 * @param source Source of the JavaScript file.
 */
function exposeClosureState(filename, source, agentUrl = "bleak_agent.js", polyfillUrl = "bleak_polyfill.js", evalScopeName) {
    return tryJSTransform(filename, source, (filename, source, sourceMap, needsBabel) => {
        return exposeClosureStateInternal(filename, source, sourceMap, agentUrl, needsBabel ? polyfillUrl : null, evalScopeName);
    });
}
exports.exposeClosureState = exposeClosureState;
function nopTransform(filename, source) {
    let ast = esprima_1.parse(source, { loc: true });
    const sourceMap = new source_map_1.SourceMapGenerator({
        file: filename
    });
    sourceMap.setSourceContent(filename, source);
    const converted = astring_1.generate(ast, { sourceMap });
    return embedSourceMap(converted, sourceMap.toString());
}
exports.nopTransform = nopTransform;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xvc3VyZV9zdGF0ZV90cmFuc2Zvcm0uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvbGliL2Nsb3N1cmVfc3RhdGVfdHJhbnNmb3JtLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ0EscUNBQWlEO0FBQ2pELHFDQUF1RDtBQUN2RCwyQ0FBK0U7QUFDL0UsaUNBQXlDO0FBQ3pDLDJDQUE4QztBQUM5QywrQkFBNkI7QUEwQjdCLDhCQUE4QixHQUFXO0lBQ3ZDLE1BQU0sQ0FBQztRQUNMLElBQUksRUFBRSxhQUFhO1FBQ25CLElBQUksRUFBRTtZQUNKLElBQUksRUFBRSxrQkFBa0I7WUFDeEIsUUFBUSxFQUFFLEtBQUs7WUFDZixJQUFJLEVBQUU7Z0JBQ0osSUFBSSxFQUFFLGlCQUFpQjtnQkFDdkIsUUFBUSxFQUFFLFFBQVE7Z0JBQ2xCLFFBQVEsRUFBRTtvQkFDUixJQUFJLEVBQUUsWUFBWTtvQkFDbEIsSUFBSSxFQUFFLG9CQUFvQjtpQkFDM0I7Z0JBQ0QsTUFBTSxFQUFFLElBQUk7YUFDYjtZQUNELEtBQUssRUFBRTtnQkFDTCxJQUFJLEVBQUUsU0FBUztnQkFDZixLQUFLLEVBQUUsV0FBVztnQkFDbEIsR0FBRyxFQUFFLGVBQWU7YUFDckI7U0FDRjtRQUNELFVBQVUsRUFBRTtZQUNWLElBQUksRUFBRSxnQkFBZ0I7WUFDdEIsSUFBSSxFQUFFLENBQUM7b0JBQ0wsSUFBSSxFQUFFLHFCQUFxQjtvQkFDM0IsVUFBVSxFQUFFO3dCQUNWLElBQUksRUFBRSxnQkFBZ0I7d0JBQ3RCLE1BQU0sRUFBRTs0QkFDTixJQUFJLEVBQUUsWUFBWTs0QkFDbEIsSUFBSSxFQUFFLFlBQVk7eUJBQ25CO3dCQUNELFNBQVMsRUFBRSxDQUFDO2dDQUNWLElBQUksRUFBRSxTQUFTO2dDQUNmLEtBQUssRUFBRSxHQUFHO2dDQUNWLEdBQUcsRUFBRSxJQUFJLEdBQUcsR0FBRzs2QkFDaEIsQ0FBQztxQkFDSDtpQkFDRixDQUFDO1NBQ0g7UUFDRCxTQUFTLEVBQUUsSUFBSTtLQUNoQixDQUFDO0FBQ0osQ0FBQztBQUVELDJCQUEyQixHQUFXO0lBQ3BDLE1BQU0sQ0FBQztRQUNMLElBQUksRUFBRSxhQUFhO1FBQ25CLElBQUksRUFBRTtZQUNKLElBQUksRUFBRSxrQkFBa0I7WUFDeEIsUUFBUSxFQUFFLEtBQUs7WUFDZixJQUFJLEVBQUU7Z0JBQ0osSUFBSSxFQUFFLGlCQUFpQjtnQkFDdkIsUUFBUSxFQUFFLFFBQVE7Z0JBQ2xCLFFBQVEsRUFBRTtvQkFDUixJQUFJLEVBQUUsWUFBWTtvQkFDbEIsSUFBSSxFQUFFLDJCQUEyQjtpQkFDbEM7Z0JBQ0QsTUFBTSxFQUFFLElBQUk7YUFDYjtZQUNELEtBQUssRUFBRTtnQkFDTCxJQUFJLEVBQUUsU0FBUztnQkFDZixLQUFLLEVBQUUsV0FBVztnQkFDbEIsR0FBRyxFQUFFLGVBQWU7YUFDckI7U0FDRjtRQUNELFVBQVUsRUFBRTtZQUNWLElBQUksRUFBRSxnQkFBZ0I7WUFDdEIsSUFBSSxFQUFFLENBQUM7b0JBQ0wsSUFBSSxFQUFFLHFCQUFxQjtvQkFDM0IsVUFBVSxFQUFFO3dCQUNWLElBQUksRUFBRSxnQkFBZ0I7d0JBQ3RCLE1BQU0sRUFBRTs0QkFDTixJQUFJLEVBQUUsWUFBWTs0QkFDbEIsSUFBSSxFQUFFLFlBQVk7eUJBQ25CO3dCQUNELFNBQVMsRUFBRSxDQUFDO2dDQUNWLElBQUksRUFBRSxTQUFTO2dDQUNmLEtBQUssRUFBRSxHQUFHO2dDQUNWLEdBQUcsRUFBRSxJQUFJLEdBQUcsR0FBRzs2QkFDaEIsQ0FBQztxQkFDSDtpQkFDRixDQUFDO1NBQ0g7UUFDRCxTQUFTLEVBQUUsSUFBSTtLQUNoQixDQUFDO0FBQ0osQ0FBQztBQUVELDJCQUEyQixVQUF5QjtJQUNsRCxNQUFNLENBQUM7UUFDTCxJQUFJLEVBQUUscUJBQXFCO1FBQzNCLFVBQVUsRUFBRTtZQUNWLElBQUksRUFBRSxnQkFBZ0I7WUFDdEIsTUFBTSxFQUFFO2dCQUNOLElBQUksRUFBRSxvQkFBb0I7Z0JBQzFCLEVBQUUsRUFBRSxJQUFJO2dCQUNSLE1BQU0sRUFBRSxFQUFFO2dCQUNWLElBQUksRUFBRTtvQkFDSixJQUFJLEVBQUUsZ0JBQWdCO29CQUN0QixJQUFJLEVBQWlCLENBQUM7NEJBQ3BCLElBQUksRUFBRSxxQkFBcUI7NEJBQzNCLEVBQUUsRUFBRTtnQ0FDRixJQUFJLEVBQUUsWUFBWTtnQ0FDbEIsSUFBSSxFQUFFLFlBQVk7NkJBQ25COzRCQUNELE1BQU0sRUFBRSxDQUFDO29DQUNQLElBQUksRUFBRSxZQUFZO29DQUNsQixJQUFJLEVBQUUsS0FBSztpQ0FDWixDQUFDOzRCQUNGLElBQUksRUFBRTtnQ0FDSixJQUFJLEVBQUUsZ0JBQWdCO2dDQUN0QixJQUFJLEVBQUUsQ0FBQzt3Q0FDTCxJQUFJLEVBQUUsYUFBYTt3Q0FDbkIsSUFBSSxFQUFFOzRDQUNKLElBQUksRUFBRSxrQkFBa0I7NENBQ3hCLFFBQVEsRUFBRSxLQUFLOzRDQUNmLElBQUksRUFBRTtnREFDSixJQUFJLEVBQUUsaUJBQWlCO2dEQUN2QixRQUFRLEVBQUUsUUFBUTtnREFDbEIsUUFBUSxFQUFFO29EQUNSLElBQUksRUFBRSxZQUFZO29EQUNsQixJQUFJLEVBQUUsZ0JBQWdCO2lEQUN2QjtnREFDRCxNQUFNLEVBQUUsSUFBSTs2Q0FDYjs0Q0FDRCxLQUFLLEVBQUU7Z0RBQ0wsSUFBSSxFQUFFLFNBQVM7Z0RBQ2YsS0FBSyxFQUFFLFdBQVc7Z0RBQ2xCLEdBQUcsRUFBRSxlQUFlOzZDQUNyQjt5Q0FDRjt3Q0FDRCxVQUFVLEVBQUU7NENBQ1YsSUFBSSxFQUFFLGdCQUFnQjs0Q0FDdEIsSUFBSSxFQUFFLENBQUM7b0RBQ0wsSUFBSSxFQUFFLHFCQUFxQjtvREFDM0IsWUFBWSxFQUFFLENBQUM7NERBQ2IsSUFBSSxFQUFFLG9CQUFvQjs0REFDMUIsRUFBRSxFQUFFO2dFQUNBLElBQUksRUFBRSxZQUFZO2dFQUNsQixJQUFJLEVBQUUsS0FBSzs2REFDZDs0REFDRCxJQUFJLEVBQUU7Z0VBQ0YsSUFBSSxFQUFFLGVBQWU7Z0VBQ3JCLE1BQU0sRUFBRTtvRUFDSixJQUFJLEVBQUUsWUFBWTtvRUFDbEIsSUFBSSxFQUFFLGdCQUFnQjtpRUFDekI7Z0VBQ0QsU0FBUyxFQUFFLEVBQUU7NkRBQ2hCO3lEQUNGLENBQUM7b0RBQ0YsSUFBSSxFQUFFLEtBQUs7aURBQ1osRUFBRTtvREFDRCxJQUFJLEVBQUUscUJBQXFCO29EQUMzQixVQUFVLEVBQUU7d0RBQ1YsSUFBSSxFQUFFLGdCQUFnQjt3REFDdEIsTUFBTSxFQUFFOzREQUNOLElBQUksRUFBRSxrQkFBa0I7NERBQ3hCLFFBQVEsRUFBRSxLQUFLOzREQUNmLE1BQU0sRUFBRTtnRUFDTixJQUFJLEVBQUUsWUFBWTtnRUFDbEIsSUFBSSxFQUFFLEtBQUs7NkRBQ1o7NERBQ0QsUUFBUSxFQUFFO2dFQUNSLElBQUksRUFBRSxZQUFZO2dFQUNsQixJQUFJLEVBQUUsTUFBTTs2REFDYjt5REFDRjt3REFDRCxTQUFTLEVBQUUsQ0FBQztnRUFDVixJQUFJLEVBQUUsU0FBUztnRUFDZixLQUFLLEVBQUUsS0FBSztnRUFDWixHQUFHLEVBQUUsT0FBTzs2REFDYjs0REFDRDtnRUFDRSxJQUFJLEVBQUUsWUFBWTtnRUFDbEIsSUFBSSxFQUFFLEtBQUs7NkRBQ1o7NERBQ0Q7Z0VBQ0UsSUFBSSxFQUFFLFNBQVM7Z0VBQ2YsS0FBSyxFQUFFLEtBQUs7Z0VBQ1osR0FBRyxFQUFFLE9BQU87NkRBQ2IsQ0FBQztxREFDSDtpREFDRixFQUFFO29EQUNELElBQUksRUFBRSxxQkFBcUI7b0RBQzNCLFVBQVUsRUFBRTt3REFDVixJQUFJLEVBQUUsZ0JBQWdCO3dEQUN0QixNQUFNLEVBQUU7NERBQ04sSUFBSSxFQUFFLGtCQUFrQjs0REFDeEIsUUFBUSxFQUFFLEtBQUs7NERBQ2YsTUFBTSxFQUFFO2dFQUNOLElBQUksRUFBRSxZQUFZO2dFQUNsQixJQUFJLEVBQUUsS0FBSzs2REFDWjs0REFDRCxRQUFRLEVBQUU7Z0VBQ1IsSUFBSSxFQUFFLFlBQVk7Z0VBQ2xCLElBQUksRUFBRSxNQUFNOzZEQUNiO3lEQUNGO3dEQUNELFNBQVMsRUFBRSxFQUFFO3FEQUNkO2lEQUNGLEVBQUU7b0RBQ0QsSUFBSSxFQUFFLHFCQUFxQjtvREFDM0IsVUFBVSxFQUFFO3dEQUNWLElBQUksRUFBRSxnQkFBZ0I7d0RBQ3RCLE1BQU0sRUFBRTs0REFDTixJQUFJLEVBQUUsZUFBZTs0REFDckIsTUFBTSxFQUFFO2dFQUNOLElBQUksRUFBRSxZQUFZO2dFQUNsQixJQUFJLEVBQUUsVUFBVTs2REFDakI7NERBQ0QsU0FBUyxFQUFFLENBQUM7b0VBQ1YsSUFBSSxFQUFFLGtCQUFrQjtvRUFDeEIsUUFBUSxFQUFFLEtBQUs7b0VBQ2YsTUFBTSxFQUFFO3dFQUNKLElBQUksRUFBRSxZQUFZO3dFQUNsQixJQUFJLEVBQUUsS0FBSztxRUFDZDtvRUFDRCxRQUFRLEVBQUU7d0VBQ04sSUFBSSxFQUFFLFlBQVk7d0VBQ2xCLElBQUksRUFBRSxjQUFjO3FFQUN2QjtpRUFDRixDQUFDO3lEQUNIO3dEQUNELFNBQVMsRUFBRSxFQUFFO3FEQUNkO2lEQUNGLENBQUM7eUNBQ0g7d0NBQ0QsU0FBUyxFQUFFOzRDQUNULElBQUksRUFBRSxhQUFhOzRDQUNuQixJQUFJLEVBQUU7Z0RBQ0osSUFBSSxFQUFFLGtCQUFrQjtnREFDeEIsUUFBUSxFQUFFLEtBQUs7Z0RBQ2YsSUFBSSxFQUFFO29EQUNKLElBQUksRUFBRSxpQkFBaUI7b0RBQ3ZCLFFBQVEsRUFBRSxRQUFRO29EQUNsQixRQUFRLEVBQUU7d0RBQ1IsSUFBSSxFQUFFLFlBQVk7d0RBQ2xCLElBQUksRUFBRSxlQUFlO3FEQUN0QjtvREFDRCxNQUFNLEVBQUUsSUFBSTtpREFDYjtnREFDRCxLQUFLLEVBQUU7b0RBQ0wsSUFBSSxFQUFFLFNBQVM7b0RBQ2YsS0FBSyxFQUFFLFdBQVc7b0RBQ2xCLEdBQUcsRUFBRSxlQUFlO2lEQUNyQjs2Q0FDRjs0Q0FDRCxVQUFVLEVBQUU7Z0RBQ1YsSUFBSSxFQUFFLGdCQUFnQjtnREFDdEIsSUFBSSxFQUFFLENBQUM7d0RBQ0wsSUFBSSxFQUFFLHFCQUFxQjt3REFDM0IsVUFBVSxFQUFFOzREQUNWLElBQUksRUFBRSxnQkFBZ0I7NERBQ3RCLE1BQU0sRUFBRTtnRUFDTixJQUFJLEVBQUUsWUFBWTtnRUFDbEIsSUFBSSxFQUFFLGVBQWU7NkRBQ3RCOzREQUNELFNBQVMsRUFBRSxDQUFDO29FQUNWLElBQUksRUFBRSxZQUFZO29FQUNsQixJQUFJLEVBQUUsS0FBSztpRUFDWixDQUFDO3lEQUNIO3FEQUNGLENBQUM7NkNBQ0g7NENBQ0QsU0FBUyxFQUFFO2dEQUNULElBQUksRUFBRSxnQkFBZ0I7Z0RBQ3RCLElBQUksRUFBRSxDQUFDO3dEQUNMLElBQUksRUFBRSxnQkFBZ0I7d0RBQ3RCLFFBQVEsRUFBRTs0REFDUixJQUFJLEVBQUUsZUFBZTs0REFDckIsTUFBTSxFQUFFO2dFQUNOLElBQUksRUFBRSxZQUFZO2dFQUNsQixJQUFJLEVBQUUsT0FBTzs2REFDZDs0REFDRCxTQUFTLEVBQUUsQ0FBQztvRUFDVixJQUFJLEVBQUUsa0JBQWtCO29FQUN4QixRQUFRLEVBQUUsR0FBRztvRUFDYixJQUFJLEVBQUU7d0VBQ0osSUFBSSxFQUFFLFNBQVM7d0VBQ2YsS0FBSyxFQUFFLHdCQUF3Qjt3RUFDL0IsR0FBRyxFQUFFLDRCQUE0QjtxRUFDbEM7b0VBQ0QsS0FBSyxFQUFFO3dFQUNMLElBQUksRUFBRSxZQUFZO3dFQUNsQixJQUFJLEVBQUUsS0FBSztxRUFDWjtpRUFDRixDQUFDO3lEQUNIO3FEQUNGLENBQUM7NkNBQ0g7eUNBQ0Y7cUNBQ0YsQ0FBQzs2QkFDSDs0QkFDRCxTQUFTLEVBQUUsS0FBSzs0QkFDaEIsS0FBSyxFQUFFLEtBQUs7eUJBQ2IsQ0FBRSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUM7aUJBQ3ZCO2dCQUNELFNBQVMsRUFBRSxLQUFLO2dCQUNoQixVQUFVLEVBQUUsS0FBSztnQkFDakIsS0FBSyxFQUFFLEtBQUs7YUFDYjtZQUNELFNBQVMsRUFBRSxFQUFFO1NBQ2Q7S0FDRixDQUFDO0FBQ0osQ0FBQztBQUVELGdDQUFnQyxnQkFBb0MsRUFBRSxZQUFvQjtJQUN4RixNQUFNLEVBQUUsR0FBbUI7UUFDekIsSUFBSSxFQUFFLGdCQUFnQjtRQUN0QixNQUFNLEVBQUU7WUFDTixJQUFJLEVBQUUsWUFBWTtZQUNsQixJQUFJLEVBQUUsMkJBQTJCO1lBQ2pDLEdBQUcsRUFBRSxnQkFBZ0IsQ0FBQyxHQUFHO1NBQzFCO1FBQ0QsU0FBUyxFQUFFLENBQUMsZ0JBQWdCLEVBQUUsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUMsQ0FBQztRQUN4RSxHQUFHLEVBQUUsZ0JBQWdCLENBQUMsR0FBRztLQUMxQixDQUFDO0lBQ0YsTUFBTSxDQUFDLEVBQUUsQ0FBQztBQUNaLENBQUM7QUFFRCxzQ0FBc0MsUUFBMEIsRUFBRSxZQUFvQjtJQUNwRixNQUFNLEVBQUUsR0FBbUI7UUFDekIsSUFBSSxFQUFFLGdCQUFnQjtRQUN0QixNQUFNLEVBQUU7WUFDTixJQUFJLEVBQUUsWUFBWTtZQUNsQixJQUFJLEVBQUUseUJBQXlCO1lBQy9CLEdBQUcsRUFBRSxRQUFRLENBQUMsR0FBRztTQUNsQjtRQUNELFNBQVMsRUFBRSxDQUFDLFFBQVEsRUFBRSxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBQyxDQUFDO1FBQ2hFLEdBQUcsRUFBRSxRQUFRLENBQUMsR0FBRztLQUNsQixDQUFDO0lBQ0YsTUFBTSxDQUFDLEVBQUUsQ0FBQztBQUNaLENBQUM7QUFFRCw0QkFBNEIsZUFBdUIsRUFBRSxZQUFvQjtJQUN2RSxNQUFNLENBQUM7UUFDTCxJQUFJLEVBQUUscUJBQXFCO1FBQzNCLFVBQVUsRUFBRTtZQUNWLElBQUksRUFBRSxnQkFBZ0I7WUFDdEIsTUFBTSxFQUFFO2dCQUNOLElBQUksRUFBRSxrQkFBa0I7Z0JBQ3hCLFFBQVEsRUFBRSxLQUFLO2dCQUNmLE1BQU0sRUFBRTtvQkFDTixJQUFJLEVBQUUsWUFBWTtvQkFDbEIsSUFBSSxFQUFFLFFBQVE7aUJBQ2Y7Z0JBQ0QsUUFBUSxFQUFFO29CQUNSLElBQUksRUFBRSxZQUFZO29CQUNsQixJQUFJLEVBQUUsZ0JBQWdCO2lCQUN2QjthQUNGO1lBQ0QsU0FBUyxFQUFFLENBQUM7b0JBQ1YsSUFBSSxFQUFFLFlBQVk7b0JBQ2xCLElBQUksRUFBRSxlQUFlO2lCQUN0QixFQUFFO29CQUNELElBQUksRUFBRSxTQUFTO29CQUNmLEtBQUssRUFBRSxXQUFXO29CQUNsQixHQUFHLEVBQUUsYUFBYTtpQkFDbkIsRUFBRTtvQkFDRCxJQUFJLEVBQUUsa0JBQWtCO29CQUN4QixVQUFVLEVBQUUsQ0FBQzs0QkFDWCxJQUFJLEVBQUUsVUFBVTs0QkFDaEIsR0FBRyxFQUFFO2dDQUNILElBQUksRUFBRSxZQUFZO2dDQUNsQixJQUFJLEVBQUUsS0FBSzs2QkFDWjs0QkFDRCxRQUFRLEVBQUUsS0FBSzs0QkFDZixLQUFLLEVBQUU7Z0NBQ0wsSUFBSSxFQUFFLG9CQUFvQjtnQ0FDMUIsRUFBRSxFQUFFLElBQUk7Z0NBQ1IsTUFBTSxFQUFFLEVBQUU7Z0NBQ1YsSUFBSSxFQUFFO29DQUNGLElBQUksRUFBRSxnQkFBZ0I7b0NBQ3RCLElBQUksRUFBRSxDQUFDOzRDQUNMLElBQUksRUFBRSxpQkFBaUI7NENBQ3ZCLFFBQVEsRUFBRSxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRTt5Q0FDdkQsQ0FBQztpQ0FDSDtnQ0FDRCxTQUFTLEVBQUUsS0FBSztnQ0FDaEIsS0FBSyxFQUFFLEtBQUs7NkJBQ2I7NEJBQ0QsSUFBSSxFQUFFLE1BQU07NEJBQ1osTUFBTSxFQUFFLEtBQUs7NEJBQ2IsU0FBUyxFQUFFLEtBQUs7eUJBQ2pCLEVBQUU7NEJBQ0QsSUFBSSxFQUFFLFVBQVU7NEJBQ2hCLEdBQUcsRUFBRTtnQ0FDSCxJQUFJLEVBQUUsWUFBWTtnQ0FDbEIsSUFBSSxFQUFFLGNBQWM7NkJBQ3JCOzRCQUNELFFBQVEsRUFBRSxLQUFLOzRCQUNmLEtBQUssRUFBRTtnQ0FDTCxJQUFJLEVBQUUsU0FBUztnQ0FDZixLQUFLLEVBQUUsSUFBSTtnQ0FDWCxHQUFHLEVBQUUsTUFBTTs2QkFDWjs0QkFDRCxJQUFJLEVBQUUsTUFBTTs0QkFDWixNQUFNLEVBQUUsS0FBSzs0QkFDYixTQUFTLEVBQUUsS0FBSzt5QkFDakIsQ0FBQztpQkFDSCxDQUFDO1NBQ0g7S0FDRixDQUFDO0FBQ0osQ0FBQztBQUVELDBCQUEwQixDQUFZO0lBQ3BDLE1BQU0sQ0FBQztRQUNMLElBQUksRUFBRSxnQkFBZ0I7UUFDdEIsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ1QsR0FBRyxFQUFFLENBQUMsQ0FBQyxHQUFHO0tBQ1gsQ0FBQztBQUNKLENBQUM7QUFFRCwyQkFBMkIsTUFBWSxFQUFFLENBQWM7SUFDckQsTUFBTSxDQUFDO1FBQ0wsSUFBSSxFQUFFLGdCQUFnQjtRQUN0QixJQUFJLEVBQUUsQ0FBQztRQUNQLEdBQUcsRUFBRSxNQUFNLENBQUMsR0FBRztLQUNoQixDQUFDO0FBQ0osQ0FBQztBQUVELG9DQUFvQyxJQUE2QixFQUFFLEtBQTJCO0lBQzVGLE1BQU0sQ0FBQztRQUNMLElBQUksRUFBRSxxQkFBcUI7UUFDM0IsSUFBSSxFQUFFLElBQUk7UUFDVixZQUFZLEVBQUUsS0FBSztRQUNuQixHQUFHLEVBQUU7WUFDSCxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLO1lBQ3pCLEdBQUcsRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRztTQUNyQztLQUNGLENBQUM7QUFDSixDQUFDO0FBRUQsK0JBQStCLEtBQWU7SUFDNUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQVcsRUFBRTtRQUM5QixNQUFNLENBQUMsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQTtJQUNyRCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUM7QUFFRCw0QkFBNEIsS0FBZTtJQUN6QyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBYyxFQUFFO1FBQ2pDLE1BQU0sQ0FBQyxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFBO0lBQ3hDLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQUVELDRCQUE0QixLQUFlO0lBQ3pDLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFZLEVBQUU7UUFDL0IsTUFBTSxDQUFDO1lBQ0wsSUFBSSxFQUFFLFVBQVU7WUFDaEIsR0FBRyxFQUFFLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFO1lBQ3BDLFFBQVEsRUFBRSxLQUFLO1lBQ2YsS0FBSyxFQUFFO2dCQUNMLElBQUksRUFBRSxrQkFBa0I7Z0JBQ3hCLFVBQVUsRUFBRSxDQUFDO3dCQUNYLElBQUksRUFBRSxVQUFVO3dCQUNoQixHQUFHLEVBQUUsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUU7d0JBQ3hDLFFBQVEsRUFBRSxLQUFLO3dCQUNmLEtBQUssRUFBRTs0QkFDTCxJQUFJLEVBQUUsb0JBQW9COzRCQUMxQixFQUFFLEVBQUUsSUFBSTs0QkFDUixNQUFNLEVBQUUsRUFBRTs0QkFDVixJQUFJLEVBQUU7Z0NBQ0YsSUFBSSxFQUFFLGdCQUFnQjtnQ0FDdEIsSUFBSSxFQUFFLENBQUM7d0NBQ0wsSUFBSSxFQUFFLGlCQUFpQjt3Q0FDdkIsUUFBUSxFQUFFOzRDQUNOLElBQUksRUFBRSxZQUFZOzRDQUNsQixJQUFJLEVBQUUsQ0FBQzt5Q0FDVjtxQ0FDRixDQUFDOzZCQUNMOzRCQUNELFNBQVMsRUFBRSxLQUFLOzRCQUNoQixLQUFLLEVBQUUsS0FBSzt5QkFDYjt3QkFDRCxJQUFJLEVBQUUsTUFBTTt3QkFDWixNQUFNLEVBQUUsS0FBSzt3QkFDYixTQUFTLEVBQUUsS0FBSztxQkFDakIsRUFBRTt3QkFDRCxJQUFJLEVBQUUsVUFBVTt3QkFDaEIsR0FBRyxFQUFFLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFO3dCQUN4QyxRQUFRLEVBQUUsS0FBSzt3QkFDZixLQUFLLEVBQUU7NEJBQ0wsSUFBSSxFQUFFLG9CQUFvQjs0QkFDMUIsRUFBRSxFQUFFLElBQUk7NEJBQ1IsTUFBTSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsQ0FBQzs0QkFDM0MsSUFBSSxFQUFFO2dDQUNKLElBQUksRUFBRSxnQkFBZ0I7Z0NBQ3RCLElBQUksRUFBRSxDQUFDO3dDQUNMLElBQUksRUFBRSxxQkFBcUI7d0NBQzNCLFVBQVUsRUFBRTs0Q0FDVixJQUFJLEVBQUUsc0JBQXNCOzRDQUM1QixRQUFRLEVBQUUsR0FBRzs0Q0FDYixJQUFJLEVBQUU7Z0RBQ0YsSUFBSSxFQUFFLFlBQVk7Z0RBQ2xCLElBQUksRUFBRSxDQUFDOzZDQUNWOzRDQUNELEtBQUssRUFBRTtnREFDSCxJQUFJLEVBQUUsWUFBWTtnREFDbEIsSUFBSSxFQUFFLEdBQUc7NkNBQ1o7eUNBQ0Y7cUNBQ0YsQ0FBQzs2QkFDSDs0QkFDRCxTQUFTLEVBQUUsS0FBSzs0QkFDaEIsS0FBSyxFQUFFLEtBQUs7eUJBQ2I7d0JBQ0QsSUFBSSxFQUFFLE1BQU07d0JBQ1osTUFBTSxFQUFFLEtBQUs7d0JBQ2IsU0FBUyxFQUFFLEtBQUs7cUJBQ2pCLENBQUM7YUFDSDtZQUNELElBQUksRUFBRSxNQUFNO1lBQ1osTUFBTSxFQUFFLEtBQUs7WUFDYixTQUFTLEVBQUUsS0FBSztTQUNqQixDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBR0Q7SUFDRSxZQUNrQixJQUFhLEVBQ3RCLGFBQXNCLEtBQUs7UUFEbEIsU0FBSSxHQUFKLElBQUksQ0FBUztRQUN0QixlQUFVLEdBQVYsVUFBVSxDQUFpQjtJQUFHLENBQUM7Q0FDekM7QUFFRCxtQkFBbUIsQ0FBVztJQUM1QixDQUFDLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztBQUN0QixDQUFDO0FBNENEO0lBRUUsWUFBWSxlQUFlLEdBQUcsY0FBYztRQUlsQyxVQUFLLEdBQUcsSUFBSSxHQUFHLEVBQW9CLENBQUM7UUFINUMsSUFBSSxDQUFDLGVBQWUsR0FBRyxlQUFlLENBQUM7SUFDekMsQ0FBQztJQUdNLGNBQWMsQ0FBQyxJQUFZLEVBQUUsSUFBYTtRQUMvQyx5Q0FBeUM7UUFDekMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksUUFBUSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ2pELENBQUM7SUFDTSxzQkFBc0IsQ0FBQyxJQUFZLElBQVMsQ0FBQztJQUM3QyxTQUFTLEtBQVUsQ0FBQztJQUNwQixZQUFZLENBQUMsSUFBWTtRQUM5QixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDekIsTUFBTSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUM7UUFDOUIsQ0FBQztRQUFDLElBQUksQ0FBQyxDQUFDO1lBQ04sTUFBTSxDQUFDLElBQUksQ0FBQztRQUNkLENBQUM7SUFDSCxDQUFDO0lBQ0QsSUFBVyxlQUFlO1FBQ3hCLE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBQ00sUUFBUSxLQUFJLENBQUM7SUFDYixtQkFBbUI7UUFDeEIsTUFBTSxFQUFFLEdBQUcsSUFBSSxLQUFLLEVBQXVCLENBQUM7UUFDNUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLEVBQUU7WUFDN0IsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksMEJBQTBCLENBQUMsQ0FBQyxDQUFDO2dCQUNyQyxFQUFFLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQztZQUMxRCxDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFDSCxNQUFNLENBQUMsRUFBRSxDQUFDO0lBQ1osQ0FBQztJQUNNLE9BQU8sQ0FBQyxJQUFZO1FBQ3pCLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ25DLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUNYLE1BQU0saUJBQWlCO1FBQ3pCLENBQUM7UUFDRCxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQztJQUNwQixDQUFDO0NBQ0Y7QUFFRDs7OztHQUlHO0FBQ0gsZ0JBQWlCLFNBQVEsV0FBVztJQUMzQixZQUFZLENBQUMsSUFBWTtRQUM5QixNQUFNLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQztJQUM5QixDQUFDO0NBQ0Y7QUFFRDtJQVNFLFlBQVksTUFBYyxFQUFFLGVBQXdCO1FBSjFDLFVBQUssR0FBRyxJQUFJLEdBQUcsRUFBb0IsQ0FBQztRQUNwQyxnQkFBVyxHQUFZLEtBQUssQ0FBQztRQUM3QixlQUFVLEdBQUcsS0FBSyxDQUFDO1FBRzNCLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBQ3JCLElBQUksQ0FBQyxlQUFlLEdBQUcsZUFBZSxDQUFDO0lBQ3pDLENBQUM7SUFFTSxRQUFRLENBQUMsS0FBbUI7UUFDakMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLHNCQUFzQixJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQztZQUMxRCxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsS0FBSyxFQUFFLENBQUM7UUFDbEMsQ0FBQztJQUNILENBQUM7SUFFTSxPQUFPLENBQUMsSUFBWTtRQUN6QixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNuQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDWCxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxZQUFZLFVBQVUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3RDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNuQyxDQUFDO1lBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ04sTUFBTSxpQkFBaUI7WUFDekIsQ0FBQztRQUNILENBQUM7UUFDRCxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQztJQUNwQixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNPLG1CQUFtQjtRQUMzQixJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ3BCLE9BQU8sQ0FBQyxZQUFZLFVBQVUsSUFBSSxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUNqRCxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQztRQUNmLENBQUM7UUFDRCxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQ1gsQ0FBQztJQUVNLGNBQWMsQ0FBQyxJQUFZLEVBQUUsSUFBYTtRQUMvQyxFQUFFLENBQUMsQ0FBQyxJQUFJLGdCQUFnQixJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUM7WUFDbEQsaUVBQWlFO1lBQ2pFLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDaEQsQ0FBQztRQUNMLGlDQUFpQztRQUMzQixTQUFTO1FBQ2YsOERBQThEO1FBQzlELE9BQU87UUFDSCxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxRQUFRLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO0lBQzVELENBQUM7SUFFTSxzQkFBc0IsQ0FBQyxJQUFZO1FBQ3hDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ2xELEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxlQUFlLElBQUksSUFBSSxDQUFDLE1BQU0sWUFBWSxVQUFVLENBQUMsQ0FBQyxDQUFDO2dCQUM5RCwwQ0FBMEM7Z0JBQzFDLElBQUksQ0FBQyxNQUFNLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDdkMsQ0FBQztZQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNOLG9EQUFvRDtnQkFDcEQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMzQyxDQUFDO1FBQ0gsQ0FBQztJQUNILENBQUM7SUFFUyxrQkFBa0IsQ0FBQyxJQUFZO1FBQ3ZDLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQy9CLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDTixDQUFDLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztZQUNwQixJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztRQUMxQixDQUFDO1FBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLFlBQVksVUFBVSxDQUFDLENBQUMsQ0FBQztZQUM3QyxJQUFJLENBQUMsTUFBTSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3ZDLENBQUM7UUFBQyxJQUFJLENBQUMsQ0FBQztZQUNOLHFDQUFxQztZQUNyQyxJQUFJLENBQUMsTUFBTSxDQUFDLHNCQUFzQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzNDLENBQUM7SUFDSCxDQUFDO0lBRU0sWUFBWSxDQUFDLElBQVk7UUFDOUIsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDL0IsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNOLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO2dCQUNqQixNQUFNLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQztZQUM5QixDQUFDO1lBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ04sTUFBTSxDQUFDLElBQUksQ0FBQztZQUNkLENBQUM7UUFDSCxDQUFDO1FBQUMsSUFBSSxDQUFDLENBQUM7WUFDTixNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDeEMsQ0FBQztJQUNILENBQUM7SUFFRDs7O09BR0c7SUFDSSxTQUFTO1FBQ2QsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7UUFDdkIsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7UUFDeEIsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDOUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQztJQUMxQixDQUFDO0lBRUQsSUFBVyxlQUFlO1FBQ3hCLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLENBQUMsQ0FBQztZQUNqQyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUM7UUFDckMsQ0FBQztRQUNELEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ25DLE1BQU0sSUFBSSxLQUFLLENBQUMsd0RBQXdELENBQUMsQ0FBQztRQUM1RSxDQUFDO1FBQ0QsTUFBTSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQztJQUMvQixDQUFDO0lBRUQsSUFBVyxzQkFBc0I7UUFDL0IsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUM7SUFDMUIsQ0FBQztJQUVNLG1CQUFtQjtRQUN4QixNQUFNLEVBQUUsR0FBRyxJQUFJLEtBQUssRUFBdUIsQ0FBQztRQUM1QyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsRUFBRTtZQUM3QixFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSwwQkFBMEIsQ0FBQyxDQUFDLENBQUM7Z0JBQ3JDLEVBQUUsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO1lBQzFELENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUNILE1BQU0sQ0FBQyxFQUFFLENBQUM7SUFDWixDQUFDO0lBRU0seUJBQXlCO1FBQzlCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1FBQzFDLE1BQU0sZ0JBQWdCLEdBQWEsRUFBRSxDQUFDO1FBQ3RDLE1BQU0sa0JBQWtCLEdBQWEsRUFBRSxDQUFDO1FBQ3hDLE1BQU0sTUFBTSxHQUFhLEVBQUUsQ0FBQztRQUU1QixJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsRUFBRTtZQUM3QixFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztnQkFDakIsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7b0JBQ2Y7d0JBQ0UsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQzt3QkFDbEIsS0FBSyxDQUFDO29CQUNSLG1CQUFtQjtvQkFDbkI7d0JBQ0Usa0JBQWtCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO3dCQUM5QixLQUFLLENBQUM7b0JBQ1IsaUJBQWlCO29CQUNqQjt3QkFDRSxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7d0JBQzVCLEtBQUssQ0FBQztnQkFDVixDQUFDO1lBQ0gsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDO1FBRUgsTUFBTSxDQUFDO1lBQ0wsSUFBSSxFQUFFLHFCQUFxQjtZQUMzQixZQUFZLEVBQUUsQ0FBQztvQkFDYixJQUFJLEVBQUUsb0JBQW9CO29CQUMxQixFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsZUFBZSxFQUFFO29CQUN0RCxJQUFJLEVBQUU7d0JBQ0osSUFBSSxFQUFFLGdCQUFnQjt3QkFDdEIsTUFBTSxFQUFFLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsMkJBQTJCLEVBQUU7d0JBQ2pFLFNBQVMsRUFBRTs0QkFDVDtnQ0FDRSxJQUFJLEVBQUUsWUFBWTtnQ0FDbEIsSUFBSSxFQUFFLE1BQU0sQ0FBQyxlQUFlOzZCQUM3QixFQUFFO2dDQUNELElBQUksRUFBRSxpQkFBaUI7Z0NBQ3ZCLFFBQVEsRUFBRSxxQkFBcUIsQ0FBQyxnQkFBZ0IsQ0FBQzs2QkFDbEQsRUFBRTtnQ0FDRCxJQUFJLEVBQUUsa0JBQWtCO2dDQUN4QixVQUFVLEVBQUUsa0JBQWtCLENBQUMsa0JBQWtCLENBQUM7NkJBQ25ELEVBQUU7Z0NBQ0QsSUFBSSxFQUFFLGlCQUFpQjtnQ0FDdkIsUUFBUSxFQUFFLHFCQUFxQixDQUFDLE1BQU0sQ0FBQzs2QkFDeEMsRUFBRTtnQ0FDRCxJQUFJLEVBQUUsaUJBQWlCO2dDQUN2QixRQUFRLEVBQUUsa0JBQWtCLENBQUMsTUFBTSxDQUFDOzZCQUNyQzt5QkFDRjtxQkFDRjtpQkFDRixDQUFDO1lBQ0YsSUFBSSxFQUFFLEtBQUs7U0FDWixDQUFDO0lBQ0osQ0FBQztDQUNGO0FBRUQ7O0dBRUc7QUFDSDtJQUFBO1FBQ1ksZ0JBQVcsR0FBRyxLQUFLLENBQUM7SUE2Z0JoQyxDQUFDO0lBM2dCVyxTQUFTLENBQUMsQ0FBUztRQUMzQixNQUFNLENBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxxQkFBcUIsSUFBVyxDQUFDLENBQUMsQ0FBQyxDQUFFLENBQUMsV0FBVyxDQUFDLEtBQUssWUFBWSxDQUFDO0lBQzNHLENBQUM7SUFFRDs7O09BR0c7SUFDSSxTQUFTLENBQUMsRUFBVTtRQUN6QixNQUFNLEdBQUcsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDO1FBQ3RCLElBQUksNkJBQTZCLEdBQUcsS0FBSyxDQUFDO1FBQzFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDN0IsTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hCLE1BQU0sSUFBSSxHQUFVLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDckMsRUFBRSxDQUFDLENBQUMsSUFBSSxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3ZCLE9BQU8sQ0FBQyxHQUFHLENBQUMseUNBQXlDLENBQUMsQ0FBQTtnQkFDdEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNqQixDQUFDO1lBQ0QsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQztZQUNiLEVBQUUsQ0FBQyxDQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFLLEtBQUssb0JBQW9CLENBQUMsQ0FBQyxDQUFDO2dCQUNoRCw2QkFBNkIsR0FBRyxJQUFJLENBQUM7WUFDdkMsQ0FBQztRQUNILENBQUM7UUFFRCxFQUFFLENBQUMsQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDLENBQUM7WUFDbEMsSUFBSSxDQUFDLEdBQUcsSUFBSSxLQUFLLEVBQVEsQ0FBQztZQUMxQixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUM3QixNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hCLEVBQUUsQ0FBQyxDQUFRLENBQUUsQ0FBQyxJQUFJLEtBQUssb0JBQW9CLENBQUMsQ0FBQyxDQUFDO29CQUM1QyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQStCLENBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDakQsQ0FBQztnQkFBQyxJQUFJLENBQUMsQ0FBQztvQkFDTixDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNaLENBQUM7WUFDSCxDQUFDO1lBQ0QsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUNYLENBQUM7UUFFRCxNQUFNLENBQUMsRUFBRSxDQUFDO0lBQ1osQ0FBQztJQUVTLGNBQWMsQ0FBQyxVQUFrQjtRQUN6QyxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDaEQsQ0FBQztJQUVNLE9BQU8sQ0FBQyxDQUFVO1FBQ3ZCLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUM7UUFDdkMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDNUIsQ0FBQyxDQUFDLElBQUksR0FBVyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN4QyxJQUFJLENBQUMsV0FBVyxHQUFHLGFBQWEsQ0FBQztRQUNqQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQ1gsQ0FBQztJQUVNLGNBQWMsQ0FBQyxDQUFpQjtRQUNyQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQ1gsQ0FBQztJQUVNLGNBQWMsQ0FBQyxDQUFpQjtRQUNyQyxDQUFDLENBQUMsSUFBSSxHQUFXLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3hDLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDWCxDQUFDO0lBRU0sbUJBQW1CLENBQUMsRUFBdUI7UUFDaEQsTUFBTSxHQUFHLEdBQUcsRUFBRSxDQUFDLFVBQVUsQ0FBQztRQUMxQixFQUFFLENBQUMsVUFBVSxHQUFVLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFFLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDNUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztJQUNaLENBQUM7SUFFTSxXQUFXLENBQUMsRUFBZTtRQUNoQyxNQUFNLElBQUksR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDO1FBQ3JCLEVBQUUsQ0FBQyxJQUFJLEdBQVUsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN4QyxNQUFNLElBQUksR0FBRyxFQUFFLENBQUMsVUFBVSxDQUFDO1FBQzNCLEVBQUUsQ0FBQyxVQUFVLEdBQVUsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM5QyxNQUFNLEdBQUcsR0FBRyxFQUFFLENBQUMsU0FBUyxDQUFDO1FBQ3pCLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDUixFQUFFLENBQUMsU0FBUyxHQUFVLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFFLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDN0MsQ0FBQztRQUNELE1BQU0sQ0FBQyxFQUFFLENBQUM7SUFDWixDQUFDO0lBRU0sZ0JBQWdCLENBQUMsRUFBb0I7UUFDMUMsTUFBTSxJQUFJLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQztRQUNyQixNQUFNLE9BQU8sR0FBVSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBRSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzlDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEtBQUssb0JBQW9CLENBQUMsQ0FBQyxDQUFDO1lBQzFDLE1BQU0sRUFBRSxHQUF1QixPQUFPLENBQUM7WUFDdkMsNkNBQTZDO1lBQzdDLE1BQU0sS0FBSyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUM7WUFDdEIsSUFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDO1lBQ2xCLE9BQU8sRUFDUCxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDdEMsTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN0QixNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztvQkFDbEIsS0FBSyxrQkFBa0IsQ0FBQztvQkFDeEIsS0FBSyxnQkFBZ0IsQ0FBQztvQkFDdEIsS0FBSyxjQUFjLENBQUM7b0JBQ3BCLEtBQUssZ0JBQWdCLENBQUM7b0JBQ3RCLEtBQUssZ0JBQWdCLENBQUM7b0JBQ3RCLEtBQUssaUJBQWlCO3dCQUNwQixFQUFFLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQzt3QkFDZixLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO3dCQUNkLEtBQUssR0FBRyxJQUFJLENBQUM7d0JBQ2IsS0FBSyxDQUFDLE9BQU8sQ0FBQztnQkFDbEIsQ0FBQztZQUNILENBQUM7WUFDRCxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7Z0JBQ1gsT0FBTyxDQUFDLElBQUksQ0FBQyx5RUFBeUUsQ0FBQyxDQUFDO2dCQUN4RixFQUFFLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUNsQyxLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDL0IsQ0FBQztZQUNELE1BQU0sQ0FBQyxFQUFFLENBQUM7UUFDWixDQUFDO1FBQUMsSUFBSSxDQUFDLENBQUM7WUFDTixFQUFFLENBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQztZQUNsQixNQUFNLENBQUMsRUFBRSxDQUFDO1FBQ1osQ0FBQztJQUNILENBQUM7SUFFTSxjQUFjLENBQUMsRUFBa0I7UUFDdEMsTUFBTSxDQUFDLEVBQUUsQ0FBQztJQUNaLENBQUM7SUFFTSxpQkFBaUIsQ0FBQyxFQUFxQjtRQUM1QyxNQUFNLENBQUMsRUFBRSxDQUFDO0lBQ1osQ0FBQztJQUVNLGFBQWEsQ0FBQyxFQUFpQjtRQUNwQyxFQUFFLENBQUMsTUFBTSxHQUFVLElBQUksQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBRSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNwRCxFQUFFLENBQUMsSUFBSSxHQUFVLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM5QyxNQUFNLENBQUMsRUFBRSxDQUFDO0lBQ1osQ0FBQztJQUVNLGVBQWUsQ0FBQyxFQUFtQjtRQUN4QyxNQUFNLElBQUksR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDO1FBQzdCLEVBQUUsQ0FBQyxZQUFZLEdBQVUsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNoRCxNQUFNLEtBQUssR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDO1FBQ3ZCLE1BQU0sR0FBRyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUM7UUFDekIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUM3QixNQUFNLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbkIsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFVLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDckMsQ0FBQztRQUNELE1BQU0sQ0FBQyxFQUFFLENBQUM7SUFDWixDQUFDO0lBRU0sZUFBZSxDQUFDLEVBQW1CO1FBQ3hDLE1BQU0sR0FBRyxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUM7UUFDeEIsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUNSLEVBQUUsQ0FBQyxRQUFRLEdBQVUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUM1QyxDQUFDO1FBQ0QsTUFBTSxDQUFDLEVBQUUsQ0FBQztJQUNaLENBQUM7SUFFTSxjQUFjLENBQUMsRUFBa0I7UUFDdEMsTUFBTSxHQUFHLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FBQztRQUN4QixFQUFFLENBQUMsUUFBUSxHQUFVLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFFLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDMUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztJQUNaLENBQUM7SUFFTSxZQUFZLENBQUMsRUFBZ0I7UUFDbEMsRUFBRSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN6QyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztZQUNqQixFQUFFLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ25ELENBQUM7UUFDRCxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUNmLEVBQUUsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDNUMsQ0FBQztRQUNELE1BQU0sQ0FBQyxFQUFFLENBQUM7SUFDWixDQUFDO0lBSVMsd0JBQXdCLENBQUMsQ0FBb0M7UUFDckUsTUFBTSxJQUFJLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztRQUNwQixDQUFDLENBQUMsSUFBSSxHQUFVLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDdkMsTUFBTSxJQUFJLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztRQUNwQixDQUFDLENBQUMsSUFBSSxHQUFVLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDdkMsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUNYLENBQUM7SUFFTSxjQUFjLENBQUMsQ0FBaUI7UUFDckMsTUFBTSxDQUFDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMxQyxDQUFDO0lBRU0sZ0JBQWdCLENBQUMsQ0FBbUI7UUFDekMsTUFBTSxDQUFDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMxQyxDQUFDO0lBRU0sWUFBWSxDQUFDLENBQWU7UUFDakMsTUFBTSxJQUFJLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztRQUNwQixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ1QsQ0FBQyxDQUFDLElBQUksR0FBVSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBRSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3pDLENBQUM7UUFDRCxNQUFNLElBQUksR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBQ3BCLENBQUMsQ0FBQyxJQUFJLEdBQVUsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN2QyxNQUFNLElBQUksR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBQ3BCLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDVCxDQUFDLENBQUMsSUFBSSxHQUFVLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDekMsQ0FBQztRQUNELE1BQU0sTUFBTSxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUM7UUFDeEIsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUNYLENBQUMsQ0FBQyxNQUFNLEdBQVUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMvQyxDQUFDO1FBQ0QsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUNYLENBQUM7SUFJUyxvQkFBb0IsQ0FBQyxDQUFrQztRQUMvRCxNQUFNLElBQUksR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBQ3BCLENBQUMsQ0FBQyxJQUFJLEdBQVUsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN2QyxNQUFNLEtBQUssR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDO1FBQ3RCLENBQUMsQ0FBQyxLQUFLLEdBQVUsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMxQyxNQUFNLElBQUksR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBQ3BCLENBQUMsQ0FBQyxJQUFJLEdBQVUsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN2QyxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQ1gsQ0FBQztJQUVNLGNBQWMsQ0FBQyxDQUFpQjtRQUNyQyxNQUFNLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3RDLENBQUM7SUFFTSxjQUFjLENBQUMsQ0FBaUI7UUFDckMsTUFBTSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN0QyxDQUFDO0lBRU0saUJBQWlCLENBQUMsQ0FBb0I7UUFDM0MsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUNYLENBQUM7SUFJUyxTQUFTLENBQUMsQ0FBMkM7UUFDN0QsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQztRQUN2QyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUNaLE1BQU0sSUFBSSxLQUFLLENBQUMsd0NBQXdDLENBQUMsQ0FBQztRQUM1RCxDQUFDO1FBQ0QsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFDaEIsTUFBTSxJQUFJLEtBQUssQ0FBQyxtQ0FBbUMsQ0FBQyxDQUFDO1FBQ3ZELENBQUM7UUFDRCxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDakMsQ0FBQyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNyQyxJQUFJLENBQUMsV0FBVyxHQUFHLGFBQWEsQ0FBQztRQUNqQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQ1gsQ0FBQztJQUVNLG1CQUFtQixDQUFDLENBQXNCO1FBQy9DLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzNCLENBQUM7SUFFTSxrQkFBa0IsQ0FBQyxDQUFxQjtRQUM3QyxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMzQixDQUFDO0lBRU0sbUJBQW1CLENBQUMsQ0FBc0I7UUFDL0MsTUFBTSxLQUFLLEdBQUcsQ0FBQyxDQUFDLFlBQVksQ0FBQztRQUM3QixNQUFNLEdBQUcsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDO1FBQ3pCLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDN0IsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUF3QixJQUFJLENBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDcEUsQ0FBQztRQUNELE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDWCxDQUFDO0lBRU0sa0JBQWtCLENBQUMsQ0FBcUI7UUFDN0MsTUFBTSxJQUFJLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztRQUNwQixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ1QsQ0FBQyxDQUFDLElBQUksR0FBVSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBRSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3pDLENBQUM7UUFDRCxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQ1gsQ0FBQztJQUVNLGNBQWMsQ0FBQyxDQUFpQjtRQUNyQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQ1gsQ0FBQztJQUVNLGVBQWUsQ0FBQyxDQUFrQjtRQUN2QyxNQUFNLFFBQVEsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDO1FBQzVCLE1BQU0sR0FBRyxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUM7UUFDNUIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUM3QixNQUFNLENBQUMsR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdEIsdUNBQXVDO1lBQ3ZDLGtCQUFrQjtZQUNsQixFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDZixRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQVUsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN4QyxDQUFDO1FBQ0gsQ0FBQztRQUNELE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDWCxDQUFDO0lBRU0sZ0JBQWdCLENBQUMsQ0FBbUI7UUFDekMsTUFBTSxLQUFLLEdBQUcsQ0FBQyxDQUFDLFVBQVUsQ0FBQztRQUMzQixNQUFNLEdBQUcsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDO1FBQ3pCLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDN0IsTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3RCLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2pDLENBQUM7UUFDRCxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQ1gsQ0FBQztJQUVNLFFBQVEsQ0FBQyxDQUFXO1FBQ3pCLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ2YsS0FBSyxNQUFNLEVBQUUsQ0FBQztnQkFDWixNQUFNLEdBQUcsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDO2dCQUNwQixDQUFDLENBQUMsS0FBSyxHQUFVLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFFLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3RDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDWCxDQUFDO1lBQ0QsS0FBSyxLQUFLLENBQUM7WUFDWCxLQUFLLEtBQUssRUFBRSxDQUFDO2dCQUNYLE1BQU0sSUFBSSxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUM7Z0JBQ3JCLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssb0JBQW9CLENBQUMsQ0FBQyxDQUFDO29CQUN2QyxNQUFNLElBQUksS0FBSyxDQUFDLHlDQUF5QyxJQUFJLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQztnQkFDekUsQ0FBQztnQkFDRCxDQUFDLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDeEMsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUNYLENBQUM7WUFDRDtnQkFDRSxNQUFNLElBQUksS0FBSyxDQUFDLG9CQUFvQixDQUFDLENBQUMsSUFBSSxxQkFBcUIsQ0FBQyxDQUFDO1FBQ3JFLENBQUM7SUFDSCxDQUFDO0lBRU0sa0JBQWtCLENBQUMsQ0FBcUI7UUFDN0MsQ0FBQyxDQUFDLFdBQVcsR0FBVyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUN0RCxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQ1gsQ0FBQztJQUVNLGVBQWUsQ0FBQyxDQUFrQjtRQUN2QyxNQUFNLEdBQUcsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDO1FBQ3ZCLENBQUMsQ0FBQyxRQUFRLEdBQVUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN6QyxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQ1gsQ0FBQztJQUVNLGdCQUFnQixDQUFDLENBQW1CO1FBQ3pDLE1BQU0sSUFBSSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7UUFDcEIsQ0FBQyxDQUFDLElBQUksR0FBVSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBRSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3ZDLE1BQU0sS0FBSyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUM7UUFDdEIsQ0FBQyxDQUFDLEtBQUssR0FBVSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBRSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDWCxDQUFDO0lBRU0sb0JBQW9CLENBQUMsQ0FBdUI7UUFDakQsTUFBTSxJQUFJLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztRQUNwQixDQUFDLENBQUMsSUFBSSxHQUFVLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDdkMsTUFBTSxLQUFLLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQztRQUN0QixDQUFDLENBQUMsS0FBSyxHQUFVLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFFLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDMUMsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUNYLENBQUM7SUFFTSxnQkFBZ0IsQ0FBQyxDQUFtQjtRQUN6QyxNQUFNLEdBQUcsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDO1FBQ3ZCLENBQUMsQ0FBQyxRQUFRLEdBQVUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN6QyxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQ1gsQ0FBQztJQUVNLGlCQUFpQixDQUFDLENBQW9CO1FBQzNDLE1BQU0sSUFBSSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7UUFDcEIsQ0FBQyxDQUFDLElBQUksR0FBVSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBRSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3ZDLE1BQU0sS0FBSyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUM7UUFDdEIsQ0FBQyxDQUFDLEtBQUssR0FBVSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBRSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDWCxDQUFDO0lBRU0scUJBQXFCLENBQUMsQ0FBd0I7UUFDbkQsTUFBTSxHQUFHLEdBQUcsQ0FBQyxDQUFDLFNBQVMsQ0FBQztRQUN4QixDQUFDLENBQUMsU0FBUyxHQUFVLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFFLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDMUMsTUFBTSxJQUFJLEdBQUcsQ0FBQyxDQUFDLFVBQVUsQ0FBQztRQUMxQixDQUFDLENBQUMsVUFBVSxHQUFVLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDN0MsTUFBTSxJQUFJLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztRQUNwQixDQUFDLENBQUMsSUFBSSxHQUFVLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDdkMsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUNYLENBQUM7SUFFTSxjQUFjLENBQUMsQ0FBaUI7UUFDckMsTUFBTSxNQUFNLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQztRQUN4QixDQUFDLENBQUMsTUFBTSxHQUFVLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFFLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDN0MsTUFBTSxJQUFJLEdBQUcsQ0FBQyxDQUFDLFNBQVMsQ0FBQztRQUN6QixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ3hCLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDN0IsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3BCLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBVSxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3hDLENBQUM7UUFDRCxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQ1gsQ0FBQztJQUVNLGFBQWEsQ0FBQyxDQUFnQjtRQUNuQyxNQUFNLE1BQU0sR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDO1FBQ3hCLENBQUMsQ0FBQyxNQUFNLEdBQVUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUM3QyxNQUFNLElBQUksR0FBRyxDQUFDLENBQUMsU0FBUyxDQUFDO1FBQ3pCLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDeEIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUM3QixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDcEIsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFVLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFFLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDeEMsQ0FBQztRQUNELE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDWCxDQUFDO0lBRU0sZ0JBQWdCLENBQUMsQ0FBbUI7UUFDekMsdURBQXVEO1FBQ3ZELGlDQUFpQztRQUNqQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUNmLENBQUMsQ0FBQyxRQUFRLEdBQVUsSUFBSSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3pELENBQUM7UUFDRCxNQUFNLEdBQUcsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDO1FBQ3JCLENBQUMsQ0FBQyxNQUFNLEdBQVUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN2QyxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQ1gsQ0FBQztJQUVNLFVBQVUsQ0FBQyxDQUFhO1FBQzdCLE1BQU0sSUFBSSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7UUFDcEIsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNULENBQUMsQ0FBQyxJQUFJLEdBQVUsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN6QyxDQUFDO1FBQ0QsQ0FBQyxDQUFDLFVBQVUsR0FBVyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUNwRCxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQ1gsQ0FBQztJQUVNLFdBQVcsQ0FBQyxDQUFjO1FBQy9CLENBQUMsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDckMsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUNYLENBQUM7SUFFTSxVQUFVLENBQUMsQ0FBYTtRQUM3QixNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQ1gsQ0FBQztJQUVNLE9BQU8sQ0FBQyxDQUFVO1FBQ3ZCLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDWCxDQUFDO0lBRU0sS0FBSyxDQUFDLENBQVE7UUFDbkIsTUFBTSxJQUFJLEtBQUssQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO0lBQ2pELENBQUM7SUFFTSxhQUFhLENBQUMsQ0FBZ0I7UUFDbkMsTUFBTSxJQUFJLEtBQUssQ0FBQyxxQ0FBcUMsQ0FBQyxDQUFDO0lBQ3pELENBQUM7SUFFTSx1QkFBdUIsQ0FBQyxDQUEwQjtRQUN2RCxNQUFNLElBQUksS0FBSyxDQUFDLCtDQUErQyxDQUFDLENBQUM7SUFDbkUsQ0FBQztJQUVNLGVBQWUsQ0FBQyxDQUFrQjtRQUN2QyxNQUFNLElBQUksS0FBSyxDQUFDLHVDQUF1QyxDQUFDLENBQUM7SUFDM0QsQ0FBQztJQUVNLGVBQWUsQ0FBQyxDQUFrQjtRQUN2QyxNQUFNLElBQUksS0FBSyxDQUFDLHVDQUF1QyxDQUFDLENBQUM7SUFDM0QsQ0FBQztJQUVNLHdCQUF3QixDQUFDLENBQTJCO1FBQ3pELE1BQU0sSUFBSSxLQUFLLENBQUMsZ0RBQWdELENBQUMsQ0FBQztJQUNwRSxDQUFDO0lBRU0sZUFBZSxDQUFDLENBQWtCO1FBQ3ZDLE1BQU0sSUFBSSxLQUFLLENBQUMsdUNBQXVDLENBQUMsQ0FBQztJQUMzRCxDQUFDO0lBRU0sYUFBYSxDQUFDLENBQWdCO1FBQ25DLE1BQU0sSUFBSSxLQUFLLENBQUMscUNBQXFDLENBQUMsQ0FBQztJQUN6RCxDQUFDO0lBRU0sWUFBWSxDQUFDLENBQWU7UUFDakMsTUFBTSxJQUFJLEtBQUssQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDO0lBQ3hELENBQUM7SUFFTSxXQUFXLENBQUMsQ0FBYztRQUMvQixNQUFNLElBQUksS0FBSyxDQUFDLG1DQUFtQyxDQUFDLENBQUM7SUFDdkQsQ0FBQztJQUVNLGlCQUFpQixDQUFDLENBQW9CO1FBQzNDLE1BQU0sSUFBSSxLQUFLLENBQUMseUNBQXlDLENBQUMsQ0FBQztJQUM3RCxDQUFDO0lBRU0sU0FBUyxDQUFDLENBQVk7UUFDM0IsTUFBTSxJQUFJLEtBQUssQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDO0lBQ3JELENBQUM7SUFFTSxnQkFBZ0IsQ0FBQyxDQUFtQjtRQUN6QyxNQUFNLElBQUksS0FBSyxDQUFDLHdDQUF3QyxDQUFDLENBQUM7SUFDNUQsQ0FBQztJQUVNLGdCQUFnQixDQUFDLENBQW1CO1FBQ3pDLE1BQU0sSUFBSSxLQUFLLENBQUMsd0NBQXdDLENBQUMsQ0FBQztJQUM1RCxDQUFDO0lBRU0sZUFBZSxDQUFDLENBQWtCO1FBQ3ZDLE1BQU0sSUFBSSxLQUFLLENBQUMsdUNBQXVDLENBQUMsQ0FBQztJQUMzRCxDQUFDO0lBRU0sWUFBWSxDQUFDLENBQWU7UUFDakMsTUFBTSxJQUFJLEtBQUssQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDO0lBQ3hELENBQUM7SUFFTSxpQkFBaUIsQ0FBQyxDQUFvQjtRQUMzQyxNQUFNLElBQUksS0FBSyxDQUFDLHlDQUF5QyxDQUFDLENBQUM7SUFDN0QsQ0FBQztJQUVNLGVBQWUsQ0FBQyxDQUFrQjtRQUN2QyxNQUFNLElBQUksS0FBSyxDQUFDLHVDQUF1QyxDQUFDLENBQUM7SUFDM0QsQ0FBQztJQUVNLHNCQUFzQixDQUFDLENBQXlCO1FBQ3JELE1BQU0sSUFBSSxLQUFLLENBQUMsOENBQThDLENBQUMsQ0FBQztJQUNsRSxDQUFDO0lBRU0sd0JBQXdCLENBQUMsQ0FBMkI7UUFDekQsTUFBTSxJQUFJLEtBQUssQ0FBQyxnREFBZ0QsQ0FBQyxDQUFDO0lBQ3BFLENBQUM7SUFFTSxzQkFBc0IsQ0FBQyxDQUF5QjtRQUNyRCxNQUFNLElBQUksS0FBSyxDQUFDLDhDQUE4QyxDQUFDLENBQUM7SUFDbEUsQ0FBQztJQUVNLGVBQWUsQ0FBQyxDQUFrQjtRQUN2QyxNQUFNLElBQUksS0FBSyxDQUFDLHVDQUF1QyxDQUFDLENBQUM7SUFDM0QsQ0FBQztJQUVNLHdCQUF3QixDQUFDLENBQTJCO1FBQ3pELE1BQU0sSUFBSSxLQUFLLENBQUMsZ0RBQWdELENBQUMsQ0FBQztJQUNwRSxDQUFDO0lBRU0sb0JBQW9CLENBQUMsQ0FBdUI7UUFDakQsTUFBTSxJQUFJLEtBQUssQ0FBQyw0Q0FBNEMsQ0FBQyxDQUFDO0lBQ2hFLENBQUM7SUFFTSxlQUFlLENBQUMsQ0FBa0I7UUFDdkMsTUFBTSxJQUFJLEtBQUssQ0FBQyx1Q0FBdUMsQ0FBQyxDQUFDO0lBQzNELENBQUM7Q0FDRjtBQUVEOztHQUVHO0FBQ0gsd0JBQXlCLFNBQVEsT0FBTztJQUd0QyxZQUFZLFdBQTBCO1FBQ3BDLEtBQUssRUFBRSxDQUFDO1FBQ1IsSUFBSSxDQUFDLFlBQVksR0FBRyxXQUFXLENBQUM7SUFDbEMsQ0FBQztJQUVNLE9BQU8sQ0FBQyxDQUFVO1FBQ3ZCLE1BQU0sRUFBRSxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDNUIsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQVksS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQy9CLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2hGLENBQUM7UUFDRCxNQUFNLENBQUMsRUFBRSxDQUFDO0lBQ1osQ0FBQztDQUNGO0FBRUQ7Ozs7Ozs7O0dBUUc7QUFDSCwwQkFBMkIsU0FBUSxPQUFPO0lBYXhDLFlBQW9CLFFBQW1ELEVBQUUsT0FBb0IsRUFBRSxXQUFtQjtRQUNoSCxLQUFLLEVBQUUsQ0FBQztRQVJGLFdBQU0sR0FBVyxJQUFJLENBQUM7UUFDdEIseUJBQW9CLEdBQUcsS0FBSyxDQUFDO1FBQzdCLHFCQUFnQixHQUFHLEtBQUssQ0FBQztRQUN6Qix1QkFBa0IsR0FBb0MsRUFBRSxDQUFDO1FBTS9ELElBQUksQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDO1FBQzFCLElBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDO1FBQ3hCLElBQUksQ0FBQyxNQUFNLEdBQUcsV0FBVyxDQUFDO0lBQzVCLENBQUM7SUFqQk0sTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFZLEVBQUUsUUFBbUQsRUFBRSxPQUFvQixFQUFFLGNBQXNCLElBQUksV0FBVyxFQUFFO1FBQ2xKLE1BQU0sT0FBTyxHQUFHLElBQUksb0JBQW9CLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxXQUFXLENBQUMsQ0FBQztRQUN6RSxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUM5QixDQUFDO0lBZ0JNLE9BQU8sQ0FBQyxDQUFVO1FBQ3ZCLE1BQU0sRUFBRSxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDNUIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNwQyxNQUFNLENBQUMsRUFBRSxDQUFDO0lBQ1osQ0FBQztJQUVNLG1CQUFtQixDQUFDLEVBQXVCO1FBQ2hELEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO1lBQ2pDLGtGQUFrRjtZQUNsRix5RkFBeUY7WUFDekYsb0RBQW9EO1lBQ3BELE1BQU0sT0FBTyxHQUF3QjtnQkFDbkMsSUFBSSxFQUFFLHFCQUFxQjtnQkFDM0IsWUFBWSxFQUFFLENBQUM7d0JBQ2IsSUFBSSxFQUFFLG9CQUFvQjt3QkFDMUIsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFO3dCQUNULElBQUksRUFBRTs0QkFDSixJQUFJLEVBQUUsb0JBQW9COzRCQUMxQixnREFBZ0Q7NEJBQ2hELHFCQUFxQjs0QkFDckIsRUFBRSxFQUFFLElBQUk7NEJBQ1IsTUFBTSxFQUFFLEVBQUUsQ0FBQyxNQUFNOzRCQUNqQixJQUFJLEVBQUUsRUFBRSxDQUFDLElBQUk7NEJBQ2IsU0FBUyxFQUFFLEVBQUUsQ0FBQyxTQUFTOzRCQUN2QixLQUFLLEVBQUUsRUFBRSxDQUFDLEtBQUs7NEJBQ2YsR0FBRyxFQUFFLEVBQUUsQ0FBQyxHQUFHO3lCQUNaO3dCQUNELEdBQUcsRUFBRSxFQUFFLENBQUMsR0FBRztxQkFDWixDQUFDO2dCQUNGLElBQUksRUFBRSxLQUFLO2dCQUNYLEdBQUcsRUFBRSxFQUFFLENBQUMsR0FBRzthQUNaLENBQUM7WUFDRixNQUFNLENBQXVCLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNqRSxDQUFDO1FBQUMsSUFBSSxDQUFDLENBQUM7WUFDTixJQUFJLENBQUMsb0JBQW9CLEdBQUcsSUFBSSxDQUFDO1lBQ2pDLE1BQU0sSUFBSSxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUM7WUFDdkIsR0FBRyxDQUFDLENBQUMsTUFBTSxHQUFHLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDdkIsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7b0JBQ2pCLEtBQUssWUFBWTt3QkFDZixJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLEVBQUMsSUFBSSxhQUFhLEVBQUUsSUFBSSxFQUFFLEdBQUcsQ0FBQyxJQUFJLEVBQUMsQ0FBQyxDQUFDO3dCQUNsRSxLQUFLLENBQUM7b0JBQ1I7d0JBQ0UsTUFBTSxJQUFJLEtBQUssQ0FBQyx3Q0FBd0MsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7Z0JBQ3hFLENBQUM7WUFDSCxDQUFDO1lBQ0QsSUFBSSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLHdCQUF3QixDQUFDO1lBQzlELElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDOUIsTUFBTSxDQUFDLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUN2QyxDQUFDO0lBQ0gsQ0FBQztJQUVNLGtCQUFrQixDQUFDLEVBQXNCO1FBQzlDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ1YsSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxFQUFDLElBQUksZUFBZSxFQUFFLElBQUksRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7UUFDekUsQ0FBQztRQUNELE1BQU0sSUFBSSxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUM7UUFDdkIsR0FBRyxDQUFDLENBQUMsTUFBTSxHQUFHLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQztZQUN2QixNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDakIsS0FBSyxZQUFZO29CQUNmLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsRUFBQyxJQUFJLGFBQWEsRUFBRSxJQUFJLEVBQUUsR0FBRyxDQUFDLElBQUksRUFBQyxDQUFDLENBQUM7b0JBQ2xFLEtBQUssQ0FBQztnQkFDUjtvQkFDRSxNQUFNLElBQUksS0FBSyxDQUFDLHdDQUF3QyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUN4RSxDQUFDO1FBQ0gsQ0FBQztRQUNELElBQUksQ0FBQyxvQkFBb0IsR0FBRyxJQUFJLENBQUM7UUFDakMsTUFBTSxFQUFFLEdBQXdCLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUM3RCxXQUFXO1FBQ1gsTUFBTSxDQUFDLEVBQUUsQ0FBQztJQUNaLENBQUM7SUFFTSxjQUFjLENBQUMsRUFBa0I7UUFDdEMsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztRQUMxQixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO1lBQzFCLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxLQUFLLENBQUM7WUFDOUIsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLFVBQVUsQ0FBQyxJQUFJLFVBQVUsRUFBRSxFQUFFLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1FBQzVFLENBQUM7UUFBQyxJQUFJLENBQUMsQ0FBQztZQUNOLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxVQUFVLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1FBQ2pFLENBQUM7UUFDRCxJQUFJLENBQUMsb0JBQW9CLEdBQUcsS0FBSyxDQUFDO1FBQ2xDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN2QyxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUM7WUFDckMsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDckIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQzNDLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM1QixDQUFDO1lBQ0QsSUFBSSxDQUFDLGtCQUFrQixHQUFHLEVBQUUsQ0FBQztRQUMvQixDQUFDO1FBQ0QsTUFBTSxFQUFFLEdBQUcsS0FBSyxDQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNwQyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3BDLElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO1FBQ3BCLE1BQU0sQ0FBQyxFQUFFLENBQUM7SUFDWixDQUFDO0lBRU0sbUJBQW1CLENBQUMsRUFBdUI7UUFDaEQsSUFBSSxJQUFhLENBQUM7UUFDbEIsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDaEIsS0FBSyxLQUFLO2dCQUNSLElBQUksY0FBYyxDQUFDO2dCQUNuQixLQUFLLENBQUM7WUFDUixLQUFLLEtBQUs7Z0JBQ1IsSUFBSSxjQUFjLENBQUM7Z0JBQ25CLEtBQUssQ0FBQztZQUNSLEtBQUssT0FBTztnQkFDVixJQUFJLGdCQUFnQixDQUFDO2dCQUNyQixLQUFLLENBQUM7WUFDUjtnQkFDRSxNQUFNLElBQUksS0FBSyxDQUFDLDJDQUEyQyxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUMxRSxDQUFDO1FBRUQsTUFBTSxLQUFLLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FBQztRQUM5QixHQUFHLENBQUMsQ0FBQyxNQUFNLElBQUksSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ3pCLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDbkIsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ2hCLEtBQUssWUFBWTtvQkFDZixJQUFJLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO29CQUMxQyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQzNCLEtBQUssQ0FBQztnQkFDUjtvQkFDRSxNQUFNLElBQUksS0FBSyxDQUFDLDJDQUEyQyxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUMxRSxDQUFDO1FBQ0gsQ0FBQztRQUVELE1BQU0sQ0FBQyxLQUFLLENBQUMsbUJBQW1CLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDdkMsQ0FBQztJQUVNLGdCQUFnQixDQUFDLEVBQW9CO1FBQzFDLE1BQU0sRUFBRSxHQUFzQixLQUFLLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDekQsMERBQTBEO1FBQzFELE1BQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUM7UUFDdkIsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNYLEtBQUssS0FBSyxDQUFDO1lBQ1gsS0FBSyxJQUFJLENBQUM7WUFDVixLQUFLLEtBQUssQ0FBQztZQUNYLEtBQUssSUFBSSxFQUFFLENBQUM7Z0JBQ1YsTUFBTSxNQUFNLEdBQUcsRUFBRSxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUM7Z0JBQy9CLE1BQU0sR0FBRyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUM7Z0JBQzFCLE1BQU0sRUFBRSxHQUFtQjtvQkFDekIsSUFBSSxFQUFFLGdCQUFnQjtvQkFDdEIsTUFBTSxFQUFFO3dCQUNOLElBQUksRUFBRSxZQUFZO3dCQUNsQixJQUFJLEVBQUUsTUFBTSxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxPQUFPO3FCQUNyQztvQkFDRCxTQUFTLEVBQUU7d0JBQ1QsRUFBRSxDQUFDLElBQUk7d0JBQ1AsRUFBRSxDQUFDLEtBQUs7cUJBQ1Q7b0JBQ0QsR0FBRyxFQUFFLEVBQUUsQ0FBQyxHQUFHO2lCQUNaLENBQUM7Z0JBQ0YsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztvQkFDUixNQUFNLEVBQUUsR0FBb0I7d0JBQzFCLElBQUksRUFBRSxpQkFBaUI7d0JBQ3ZCLFFBQVEsRUFBRSxHQUFHO3dCQUNiLFFBQVEsRUFBRSxFQUFFO3dCQUNaLEdBQUcsRUFBRSxFQUFFLENBQUMsR0FBRzt3QkFDWCxNQUFNLEVBQUUsSUFBSTtxQkFDYixDQUFDO29CQUNGLE1BQU0sQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNsQyxDQUFDO2dCQUFDLElBQUksQ0FBQyxDQUFDO29CQUNOLE1BQU0sQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNqQyxDQUFDO1lBQ0gsQ0FBQztZQUNEO2dCQUNFLE1BQU0sQ0FBQyxFQUFFLENBQUM7UUFDZCxDQUFDO0lBQ0gsQ0FBQztJQUVNLFdBQVcsQ0FBQyxFQUFlO1FBQ2hDLE1BQU0sS0FBSyxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUM7UUFDdkIsTUFBTSxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDbkIsS0FBSyxZQUFZO2dCQUNmLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLGFBQWEsRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7Z0JBQ3RFLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDOUIsS0FBSyxDQUFDO1lBQ1I7Z0JBQ0UsTUFBTSxJQUFJLEtBQUssQ0FBQyxnREFBZ0QsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7UUFDbEYsQ0FBQztRQUNELE1BQU0sQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQy9CLENBQUM7SUFFTSxVQUFVLENBQUMsQ0FBYTtRQUM3QixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDMUIsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUNYLENBQUM7SUFFTSxjQUFjLENBQUMsRUFBa0I7UUFDdEMsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQztRQUNyQixFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxLQUFLLFlBQVksSUFBSSxFQUFFLENBQUMsSUFBSSxLQUFLLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDbkQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUMxQixDQUFDO1FBQ0QsTUFBTSxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDbEMsQ0FBQztJQUVNLFdBQVcsQ0FBQyxFQUFlO1FBQ2hDLE1BQU0sSUFBSSxHQUFHLEVBQUUsQ0FBQyxVQUFVLENBQUM7UUFDM0IsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7WUFDbkMsRUFBRSxDQUFDLFVBQVUsR0FBRyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN6QyxDQUFDO1FBRUQsTUFBTSxHQUFHLEdBQUcsRUFBRSxDQUFDLFNBQVMsQ0FBQztRQUN6QixFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ1IsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ2pCLEtBQUssYUFBYSxDQUFDLENBQUMsa0JBQWtCO2dCQUN0QyxLQUFLLGdCQUFnQixDQUFFLGVBQWU7b0JBQ3BDLEtBQUssQ0FBQztnQkFDUjtvQkFDRSxvQkFBb0I7b0JBQ3BCLEVBQUUsQ0FBQyxTQUFTLEdBQUcsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQ3JDLEtBQUssQ0FBQztZQUNWLENBQUM7UUFDSCxDQUFDO1FBRUQsTUFBTSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDL0IsQ0FBQztJQUlTLHdCQUF3QixDQUFDLEVBQXFDO1FBQ3RFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLGdCQUFnQixDQUFDLENBQUMsQ0FBQztZQUN0QyxFQUFFLENBQUMsSUFBSSxHQUFHLGdCQUFnQixDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN0QyxDQUFDO1FBQ0QsTUFBTSxDQUFDLEtBQUssQ0FBQyx3QkFBd0IsQ0FBTyxFQUFFLENBQUMsQ0FBQztJQUNsRCxDQUFDO0lBSVMsb0JBQW9CLENBQUMsRUFBbUM7UUFDaEUsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO1lBQ3RDLEVBQUUsQ0FBQyxJQUFJLEdBQUcsZ0JBQWdCLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3RDLENBQUM7UUFDRCxNQUFNLENBQUMsS0FBSyxDQUFDLG9CQUFvQixDQUFPLEVBQUUsQ0FBQyxDQUFDO0lBQzlDLENBQUM7SUFFTSxVQUFVLENBQUMsRUFBYztRQUM5QixNQUFNLElBQUksR0FBRyxFQUFFLENBQUMsVUFBVSxDQUFDO1FBQzNCLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO1lBQzNELEVBQUUsQ0FBQyxVQUFVLEdBQUc7Z0JBQ2QsaUJBQWlCLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQzthQUM1QixDQUFDO1FBQ0osQ0FBQztRQUNELE1BQU0sQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQzlCLENBQUM7SUFFTSxZQUFZLENBQUMsRUFBZ0I7UUFDbEMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO1lBQ3RDLEVBQUUsQ0FBQyxJQUFJLEdBQUcsZ0JBQWdCLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3RDLENBQUM7UUFDRCxNQUFNLElBQUksR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDO1FBQ3JCLEVBQUUsQ0FBQyxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLHFCQUFxQixJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDaEYseUZBQXlGO1lBQ3pGLG1DQUFtQztZQUNuQyxFQUFFLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztZQUNmLE1BQU0sQ0FBQztnQkFDTCxJQUFJLEVBQUUsb0JBQW9CO2dCQUMxQixJQUFJLEVBQUU7b0JBQ2tCLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUM7b0JBQ3JDLEtBQUssQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDO2lCQUFDO2dCQUN4QyxHQUFHLEVBQUUsRUFBRSxDQUFDLEdBQUc7YUFDWixDQUFDO1FBQ0osQ0FBQztRQUNELE1BQU0sQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ2hDLENBQUM7SUFFTSxhQUFhLENBQUMsRUFBaUI7UUFDcEMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO1lBQ3RDLEVBQUUsQ0FBQyxJQUFJLEdBQUc7Z0JBQ1IsSUFBSSxFQUFFLGdCQUFnQjtnQkFDdEIsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQztnQkFDZixHQUFHLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHO2FBQ2pCLENBQUM7UUFDSixDQUFDO1FBRUQsdUNBQXVDO1FBQ3ZDLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDeEIsSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQztRQUU3QixNQUFNLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUNqQyxDQUFDO0NBQ0Y7QUFFRDs7R0FFRztBQUNILDJCQUE0QixTQUFRLE9BQU87SUFTekMsWUFBb0IsUUFBbUQ7UUFDckUsS0FBSyxFQUFFLENBQUM7UUFKRixXQUFNLEdBQVcsSUFBSSxDQUFDO1FBSzVCLElBQUksQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDO0lBQzVCLENBQUM7SUFYTSxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQVksRUFBRSxRQUFtRDtRQUNuRixNQUFNLE9BQU8sR0FBRyxJQUFJLHFCQUFxQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3BELE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQzlCLENBQUM7SUFVTSxPQUFPLENBQUMsQ0FBVTtRQUN2QixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ3pCLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDcEMsTUFBTSxFQUFFLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM1QixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQztRQUNuQixNQUFNLENBQUMsRUFBRSxDQUFDO0lBQ1osQ0FBQztJQUVNLGNBQWMsQ0FBQyxFQUFrQjtRQUN0QyxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ3pCLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDckMsTUFBTSxFQUFFLEdBQUcsS0FBSyxDQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNwQyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQztRQUNuQixNQUFNLENBQUMsRUFBRSxDQUFDO0lBQ1osQ0FBQztJQUVNLFVBQVUsQ0FBQyxDQUFhO1FBQzdCLElBQUksQ0FBQyxNQUFNLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzNDLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDWCxDQUFDO0NBQ0Y7QUFFRDs7OztHQUlHO0FBQ0gsMEJBQTJCLFNBQVEsT0FBTztJQXNCeEMsWUFBb0IsUUFBK0MsRUFBRSxPQUFvQixFQUFFLFFBQWdCLEVBQUUsV0FBbUI7UUFDOUgsS0FBSyxFQUFFLENBQUM7UUFoQkEsV0FBTSxHQUFXLElBQUksQ0FBQztRQUd0Qiw0Q0FBdUMsR0FBRyxLQUFLLENBQUM7UUFDaEQsMkJBQXNCLEdBQUcsS0FBSyxDQUFDO1FBRWpDLGVBQVUsR0FBRyxDQUFDLENBQUM7UUFDZixrQkFBYSxHQUFHLEdBQUcsRUFBRTtZQUMzQixJQUFJLElBQVksQ0FBQztZQUNqQixHQUFHLENBQUM7Z0JBQ0YsSUFBSSxHQUFHLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUM7WUFDakMsQ0FBQyxRQUFRLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ2xDLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3hCLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDZCxDQUFDLENBQUM7UUFHQSxJQUFJLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQztRQUMxQixJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQztRQUN4QixJQUFJLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQztRQUMxQixJQUFJLENBQUMsWUFBWSxHQUFHLFdBQVcsQ0FBQztJQUNsQyxDQUFDO0lBM0JNLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBWSxFQUFFLFFBQStDLEVBQUUsT0FBb0IsRUFBRSxRQUFnQixFQUFFLFdBQW1CO1FBQzVJLE1BQU0sT0FBTyxHQUFHLElBQUksb0JBQW9CLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDbkYsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDOUIsQ0FBQztJQTBCUywrQ0FBK0MsQ0FBQyxDQUFTLEVBQUUsU0FBa0I7UUFDckYsSUFBSSxJQUFJLEdBQVcsSUFBSSxDQUFDLE1BQU0sWUFBWSxVQUFVLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLHlCQUF5QixFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1FBQzVJLEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFDZCxNQUFNLFVBQVUsR0FBRyxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1lBQ3ZELEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFZLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDL0IsVUFBVSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztZQUMzRCxDQUFDO1lBQ0QsSUFBSSxHQUFhLENBQUMsaUJBQWlCLENBQUMsVUFBVSxDQUFDLENBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDakUsQ0FBQztRQUNELElBQUksR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxDQUFDO1FBQ3RELEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0QixNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQ1gsQ0FBQztRQUNELE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbkMsTUFBTSxNQUFNLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNoQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDakUsQ0FBQztJQUVNLE9BQU8sQ0FBQyxDQUFVO1FBQ3ZCLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDcEMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQ3pDLE1BQU0sRUFBRSxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDNUIsQ0FBQyxDQUFDLElBQUksR0FBUyxJQUFJLENBQUMsK0NBQStDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNsRixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQztRQUNuQixNQUFNLENBQUMsRUFBRSxDQUFDO0lBQ1osQ0FBQztJQUVNLGNBQWMsQ0FBQyxFQUFrQjtRQUN0QyxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQzFCLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDckMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQ3pDLE1BQU0sRUFBRSxHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDcEMsRUFBRSxDQUFDLElBQUksR0FBUyxJQUFJLENBQUMsK0NBQStDLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNyRixJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztRQUNwQixNQUFNLENBQUMsRUFBRSxDQUFDO0lBQ1osQ0FBQztJQUVNLFVBQVUsQ0FBQyxDQUFhO1FBQzdCLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM1QyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ1AsTUFBTSxDQUFDO2dCQUNMLElBQUksRUFBRSxrQkFBa0I7Z0JBQ3hCLFFBQVEsRUFBRSxLQUFLO2dCQUNmLE1BQU0sRUFBRTtvQkFDTixJQUFJLEVBQUUsWUFBWTtvQkFDbEIsSUFBSSxFQUFFLEVBQUU7b0JBQ1IsR0FBRyxFQUFFLENBQUMsQ0FBQyxHQUFHO2lCQUNYO2dCQUNELFFBQVEsRUFBRTtvQkFDUixJQUFJLEVBQUUsWUFBWTtvQkFDbEIsSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJO29CQUNaLEdBQUcsRUFBRSxDQUFDLENBQUMsR0FBRztpQkFDWDtnQkFDRCxHQUFHLEVBQUUsQ0FBQyxDQUFDLEdBQUc7YUFDWCxDQUFDO1FBQ0osQ0FBQztRQUNELE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDWCxDQUFDO0lBRU0sa0JBQWtCLENBQUMsSUFBd0I7UUFDaEQsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQztRQUNuQixFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxLQUFLLFlBQVksQ0FBQyxDQUFDLENBQUM7WUFDN0IsTUFBTSxJQUFJLEtBQUssQ0FBQyw4REFBOEQsQ0FBQyxDQUFDO1FBQ2xGLENBQUM7UUFDRCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO1FBQ3ZCLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDVCxJQUFJLENBQUMsSUFBSSxHQUFVLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDNUMsQ0FBQztRQUNELE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDbEMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksS0FBSyxrQkFBa0IsQ0FBQyxDQUFDLENBQUM7WUFDdEMsTUFBTSxDQUFDO2dCQUNMLElBQUksRUFBRSxxQkFBcUI7Z0JBQzNCLFVBQVUsRUFBRTtvQkFDVixJQUFJLEVBQUUsc0JBQXNCO29CQUM1QixRQUFRLEVBQUUsR0FBRztvQkFDYixJQUFJLEVBQUUsS0FBSztvQkFDWCxLQUFLLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHLEVBQUU7b0JBQ3ZGLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRztpQkFDZDtnQkFDRCxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUc7YUFDZCxDQUFDO1FBQ0osQ0FBQztRQUFDLElBQUksQ0FBQyxDQUFDO1lBQ04sTUFBTSxDQUFDLElBQUksQ0FBQztRQUNkLENBQUM7SUFDSCxDQUFDO0lBRU0sbUJBQW1CLENBQUMsRUFBdUI7UUFDaEQsbUVBQW1FO1FBQ25FLE1BQU0sUUFBUSxHQUFHLEVBQUUsQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN4RSxJQUFJLENBQUMsR0FBRyxJQUFJLEtBQUssRUFBNkMsQ0FBQztRQUMvRCxJQUFJLFlBQVksR0FBRyxJQUFJLEtBQUssRUFBc0IsQ0FBQztRQUNuRCxNQUFNLEdBQUcsR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDO1FBQzVCLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDN0IsTUFBTSxDQUFDLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3RCLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUNmLEtBQUssb0JBQW9CO29CQUN2QixZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNyQixLQUFLLENBQUM7Z0JBQ1IsS0FBSyxrQkFBa0I7b0JBQ3JCLHlEQUF5RDtvQkFDekQsS0FBSyxDQUFDO2dCQUNSLEtBQUsscUJBQXFCO29CQUN4QixFQUFFLENBQUMsQ0FBQyxZQUFZLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQzVCLENBQUMsQ0FBQyxJQUFJLENBQUMsMEJBQTBCLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRSxZQUFZLENBQUMsQ0FBQyxDQUFDO3dCQUMxRCxZQUFZLEdBQUcsRUFBRSxDQUFDO29CQUNwQixDQUFDO29CQUNELENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ1YsS0FBSyxDQUFDO1lBQ1YsQ0FBQztRQUNILENBQUM7UUFFRCxFQUFFLENBQUMsQ0FBQyxZQUFZLENBQUMsTUFBTSxLQUFLLEVBQUUsQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUNuRCxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ2IsQ0FBQztRQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxZQUFZLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbkMsQ0FBQyxDQUFDLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUM7UUFDNUQsQ0FBQztRQUVELEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNuQix3REFBd0Q7WUFDeEQsZ0RBQWdEO1lBQ2hELE1BQU0sQ0FBQztnQkFDTCxJQUFJLEVBQUUscUJBQXFCO2dCQUMzQixJQUFJLEVBQUUsS0FBSztnQkFDWCxZQUFZLEVBQUUsQ0FBQzt3QkFDYixJQUFJLEVBQUUsb0JBQW9CO3dCQUMxQixFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsYUFBYSxFQUFFLEVBQUM7cUJBQ3RELENBQUM7YUFDSCxDQUFDO1FBQ0osQ0FBQztRQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDMUIsNkJBQTZCO1lBQzdCLE1BQU0sQ0FBQztnQkFDTCxJQUFJLEVBQUUsb0JBQW9CO2dCQUMxQixJQUFJLEVBQUUsQ0FBQzthQUNSLENBQUM7UUFDSixDQUFDO1FBQUMsSUFBSSxDQUFDLENBQUM7WUFDTixNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2QsQ0FBQztJQUNILENBQUM7SUFJUyxvQkFBb0IsQ0FBQyxFQUFtQztRQUNoRSxNQUFNLEVBQUUsR0FBRyxLQUFLLENBQUMsb0JBQW9CLENBQU8sRUFBRSxDQUFDLENBQUM7UUFDaEQsTUFBTSxJQUFJLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQztRQUNyQixnRUFBZ0U7UUFDaEUsNkJBQTZCO1FBQzdCLEVBQUUsQ0FBQyxDQUFRLElBQUssQ0FBQyxJQUFJLEtBQUsscUJBQXFCLENBQUMsQ0FBQyxDQUFDO1lBQ2hELEVBQUUsQ0FBQyxJQUFJLEdBQStCLElBQUssQ0FBQyxVQUFVLENBQUM7WUFDdkQsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssc0JBQXNCLENBQUMsQ0FBQyxDQUFDO2dCQUM1QyxFQUFFLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBd0IsQ0FBQztZQUM3QyxDQUFDO1FBQ0gsQ0FBQztRQUNELE1BQU0sQ0FBQyxFQUFFLENBQUM7SUFDWixDQUFDO0lBRU0sWUFBWSxDQUFDLENBQWU7UUFDakMsTUFBTSxFQUFFLEdBQWtCLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDaEQsTUFBTSxJQUFJLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQztRQUNyQiw0REFBNEQ7UUFDNUQsNkJBQTZCO1FBQzdCLEVBQUUsQ0FBQyxDQUFDLElBQUksSUFBVyxJQUFLLENBQUMsSUFBSSxLQUFLLHFCQUFxQixDQUFDLENBQUMsQ0FBQztZQUN4RCxFQUFFLENBQUMsSUFBSSxHQUFnQyxJQUFLLENBQUMsVUFBVSxDQUFDO1FBQzFELENBQUM7UUFDRCxNQUFNLENBQUMsRUFBRSxDQUFDO0lBQ1osQ0FBQztJQUVNLGNBQWMsQ0FBQyxFQUFrQjtRQUN0QyxNQUFNLFNBQVMsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDO1FBQzVCLE1BQU0sRUFBRSxHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDcEMsTUFBTSxNQUFNLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQztRQUN6QixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQztRQUM1QyxNQUFNLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNwQixLQUFLLFlBQVk7Z0JBQ2YsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksS0FBSyxNQUFNLENBQUMsQ0FBQyxDQUFDO29CQUMzQixNQUFNLENBQUMsSUFBSSxHQUFHLG9CQUFvQixDQUFDO29CQUNuQyxFQUFFLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQzt3QkFDbkIsSUFBSSxFQUFFLFlBQVk7d0JBQ2xCLElBQUksRUFBRSxPQUFPO3FCQUNkLENBQUMsQ0FBQztnQkFDTCxDQUFDO2dCQUNELEtBQUssQ0FBQztZQUNSLEtBQUssa0JBQWtCO2dCQUNyQixFQUFFLENBQUMsQ0FBQyxTQUFTLENBQUMsSUFBSSxLQUFLLFlBQVksQ0FBQyxDQUFDLENBQUM7b0JBQ3BDLHFDQUFxQztvQkFDckMsc0VBQXNFO29CQUN0RSxFQUFFLENBQUMsTUFBTSxHQUFHO3dCQUNWLElBQUksRUFBRSxtQkFBbUI7d0JBQ3pCLFFBQVEsRUFBRSxJQUFJO3dCQUNkLElBQUksRUFBRSxNQUFNO3dCQUNaLEtBQUssRUFBRSxNQUFNO3dCQUNiLEdBQUcsRUFBRSxNQUFNLENBQUMsR0FBRztxQkFDaEIsQ0FBQztnQkFDSixDQUFDO2dCQUNELEtBQUssQ0FBQztRQUNWLENBQUM7UUFDRCxNQUFNLENBQUMsRUFBRSxDQUFDO0lBQ1osQ0FBQztJQUVNLGtCQUFrQixDQUFDLEVBQXNCO1FBQzlDLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLHVDQUF1QyxDQUFDO1FBQ3RFLElBQUksQ0FBQyx1Q0FBdUMsR0FBRyxLQUFLLENBQUM7UUFDckQsTUFBTSxFQUFFLEdBQXdCLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUM3RCxFQUFFLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7WUFDckIsb0NBQW9DO1lBQ3BDLE1BQU0sQ0FBQyxFQUFFLENBQUM7UUFDWixDQUFDO1FBQUMsSUFBSSxDQUFDLENBQUM7WUFDTixvQkFBb0I7WUFDcEIsTUFBTSxDQUFDLHNCQUFzQixDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQ2pFLENBQUM7SUFDSCxDQUFDO0lBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztPQXdCRztJQUVJLG9CQUFvQixDQUFDLElBQTBCO1FBQ3BELE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7UUFDMUIsTUFBTSxFQUFFLEdBQUcsS0FBSyxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzVDLGdFQUFnRTtRQUNoRSxpR0FBaUc7UUFDakcsTUFBTSxJQUFJLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQztRQUNyQixFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLElBQUksT0FBTyxDQUFDLElBQUksS0FBSyxJQUFJLENBQUMsSUFBSSxJQUFJLE9BQU8sQ0FBQyxJQUFJLEtBQUssWUFBWSxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO1lBQ3hJLDBEQUEwRDtZQUMxRCxnQ0FBZ0M7WUFDaEMsTUFBTSxDQUF3QjtnQkFDNUIsSUFBSSxFQUFFLHNCQUFzQjtnQkFDNUIsUUFBUSxFQUFFLEdBQUc7Z0JBQ2IsSUFBSSxFQUFFO29CQUNKLElBQUksRUFBRSxZQUFZO29CQUNsQixJQUFJLEVBQUUsT0FBTyxDQUFDLElBQUk7aUJBQ25CO2dCQUNELEtBQUssRUFBRSxFQUFFO2dCQUNULEdBQUcsRUFBRSxFQUFFLENBQUMsR0FBRzthQUNaLENBQUM7UUFDSixDQUFDO1FBQ0QsTUFBTSxDQUFDLEVBQUUsQ0FBQztJQUNaLENBQUM7SUFFTSxhQUFhLENBQUMsSUFBbUI7UUFDdEMsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBQ2hDLElBQUksQ0FBQyxHQUF3QjtZQUMzQixJQUFJLEVBQUUscUJBQXFCO1lBQzNCLElBQUksRUFBRSxLQUFLO1lBQ1gsWUFBWSxFQUFFLENBQUM7b0JBQ2IsSUFBSSxFQUFFLG9CQUFvQjtvQkFDMUIsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFO29CQUNwQyxJQUFJLEVBQUU7d0JBQ0osSUFBSSxFQUFFLGdCQUFnQjt3QkFDdEIsTUFBTSxFQUFFOzRCQUNOLElBQUksRUFBRSxZQUFZOzRCQUNsQixJQUFJLEVBQUUseUJBQXlCO3lCQUNoQzt3QkFDRCxTQUFTLEVBQUMsQ0FBUSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLGVBQWUsRUFBRSxDQUFDO3FCQUNuSDtpQkFDRixDQUFDO1lBQ0YsR0FBRyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRztTQUNyQixDQUFDO1FBQ0YsSUFBSSxDQUFDLE1BQU0sR0FBRztZQUNaLElBQUksRUFBRSxZQUFZO1lBQ2xCLElBQUksRUFBRSxFQUFFO1NBQ1QsQ0FBQztRQUNGLE1BQU0sS0FBSyxHQUFnQixJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBa0IsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxZQUFZLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMxQyxNQUFNLElBQUksS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzdCLENBQUM7UUFDRCxLQUFLLENBQUMsTUFBTSxDQUFDLGVBQWUsR0FBRyxFQUFFLENBQUM7UUFDbEMsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBa0IsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzNELEVBQUUsQ0FBQyxJQUFJLEdBQW1CLENBQUMsQ0FBQyxDQUFFLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMvQyxNQUFNLENBQUMsRUFBRSxDQUFDO0lBQ1osQ0FBQztJQUVNLFFBQVEsQ0FBQyxDQUFXO1FBQ3pCLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ2YsS0FBSyxLQUFLLENBQUM7WUFDWCxLQUFLLEtBQUs7Z0JBQ1IsSUFBSSxDQUFDLHVDQUF1QyxHQUFHLElBQUksQ0FBQztnQkFDcEQsS0FBSyxDQUFDO1lBQ1IsS0FBSyxNQUFNO2dCQUNULEtBQUssQ0FBQztZQUNSO2dCQUNFLE1BQU0sSUFBSSxLQUFLLENBQUMsK0JBQStCLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQzdELENBQUM7UUFDRCxNQUFNLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMzQixDQUFDO0lBRU0sZ0JBQWdCLENBQUMsQ0FBbUI7UUFDekMsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixDQUFDO1FBQ3BELElBQUksQ0FBQyxzQkFBc0IsR0FBRyxLQUFLLENBQUM7UUFDcEMsTUFBTSxFQUFFLEdBQUcsS0FBSyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3JDLE1BQU0sZUFBZSxHQUFHLElBQUksQ0FBQyxzQkFBc0IsQ0FBQztRQUNwRCxJQUFJLENBQUMsc0JBQXNCLEdBQUcsZUFBZSxDQUFDO1FBQzlDLEVBQUUsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUM7WUFDcEIsTUFBTSxDQUFDLDRCQUE0QixDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQ3RFLENBQUM7UUFBQyxJQUFJLENBQUMsQ0FBQztZQUNOLE1BQU0sQ0FBQyxFQUFFLENBQUM7UUFDWixDQUFDO0lBQ0gsQ0FBQztDQUdGO0FBRUQsb0NBQW9DLFFBQWdCLEVBQUUsTUFBYyxFQUFFLFNBQTZCLEVBQUUsUUFBZ0IsRUFBRSxXQUFtQixFQUFFLGFBQXNCO0lBQ2hLLElBQUksR0FBRyxHQUFHLGVBQWUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztJQUNqRCxDQUFDO1FBQ0MsTUFBTSxjQUFjLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNuQyxFQUFFLENBQUMsQ0FBQyxjQUFjLElBQUksY0FBYyxDQUFDLElBQUksS0FBSyxxQkFBcUIsQ0FBQyxDQUFDLENBQUM7WUFDcEUsbUJBQW1CO1lBQ25CLEVBQUUsQ0FBQyxDQUFRLGNBQWUsQ0FBQyxTQUFTLEtBQUssY0FBYyxDQUFDLENBQUMsQ0FBQztnQkFDeEQsTUFBTSxDQUFDLE1BQU0sQ0FBQztZQUNoQixDQUFDO1FBQ0gsQ0FBQztJQUNILENBQUM7SUFFRCxNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsRUFBd0MsQ0FBQztJQUM1RCxNQUFNLE9BQU8sR0FBRyxJQUFJLEdBQUcsRUFBVSxDQUFDO0lBQ2xDLEdBQUcsR0FBRyxvQkFBb0IsQ0FBQyxLQUFLLENBQzlCLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsYUFBYSxDQUFDLENBQUMsQ0FBQyxJQUFJLFVBQVUsQ0FBQyxJQUFJLFVBQVUsQ0FBQyxhQUFhLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLEVBQUUsR0FBRyxDQUFDLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsV0FBVyxDQUFDLENBQUM7SUFDek0sTUFBTSxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUM7QUFDaEQsQ0FBQztBQUVELHdCQUF3QixNQUFjLEVBQUUsU0FBaUI7SUFDdkQsTUFBTSxDQUFDLEdBQUcsTUFBTSxxREFBcUQsSUFBSSxNQUFNLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO0FBQzFILENBQUM7QUFFRCxtQkFBbUIsSUFBWSxFQUFFLE1BQWMsRUFBRSxPQUFxQixFQUFFLE9BQXFCO0lBQzNGLE1BQU0sSUFBSSxHQUFHLElBQUksOEJBQWlCLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDNUMsTUFBTSxJQUFJLEdBQUcsSUFBSSw4QkFBaUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUM1QyxNQUFNLEdBQUcsR0FBRyxJQUFJLCtCQUFrQixDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztJQUU3QyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUU7UUFDdkIsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDO1lBQ2xDLElBQUksRUFBRSxHQUFHLENBQUMsWUFBWTtZQUN0QixNQUFNLEVBQUUsR0FBRyxDQUFDLGNBQWM7U0FDM0IsQ0FBQyxDQUFDO1FBQ0gsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxJQUFJLEtBQUssSUFBSSxJQUFJLEVBQUUsQ0FBQyxNQUFNLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNqRCxpQ0FBaUM7WUFDakMsR0FBRyxDQUFDLFVBQVUsQ0FBQztnQkFDYixTQUFTLEVBQUU7b0JBQ1QsSUFBSSxFQUFFLEdBQUcsQ0FBQyxhQUFhO29CQUN2QixNQUFNLEVBQUUsR0FBRyxDQUFDLGVBQWU7aUJBQzVCO2dCQUNELFFBQVEsRUFBRSxFQUFFO2dCQUNaLElBQUksRUFBRSxHQUFHLENBQUMsSUFBSTtnQkFDZCxNQUFNLEVBQUUsR0FBRyxDQUFDLE1BQU07YUFDbkIsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztJQUNILENBQUMsQ0FBQyxDQUFDO0lBQ0gsR0FBRyxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztJQUNuQyxNQUFNLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO0FBQ3hCLENBQUM7QUFFRCx3QkFBd0IsUUFBZ0IsRUFBRSxNQUFjLEVBQUUsU0FBMkc7SUFDbkssSUFBSSxDQUFDO1FBQ0gsTUFBTSxTQUFTLEdBQUcsSUFBSSwrQkFBa0IsQ0FBQztZQUN2QyxJQUFJLEVBQUUsUUFBUTtTQUNmLENBQUMsQ0FBQztRQUNILE1BQU0sU0FBUyxHQUFHLFNBQVMsQ0FBQyxRQUFRLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNoRSxTQUFTLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQzdDLE1BQU0sQ0FBQyxjQUFjLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO0lBQ3pELENBQUM7SUFBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ1gsSUFBSSxDQUFDO1lBQ0gsNEZBQTRGO1lBQzVGLE1BQU0sV0FBVyxHQUFHLGlCQUFLLENBQUMsTUFBTSxFQUFFLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFDeEQsTUFBTSxtQkFBbUIsR0FBRyxJQUFJLCtCQUFrQixDQUFDO2dCQUNqRCxJQUFJLEVBQUUsUUFBUTthQUNmLENBQUMsQ0FBQztZQUNILE1BQU0sU0FBUyxHQUFHLFNBQVMsQ0FBQyxRQUFRLEVBQUUsV0FBVyxDQUFDLElBQUksRUFBRSxtQkFBbUIsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNwRixNQUFNLENBQUMsY0FBYyxDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxXQUFXLENBQUMsR0FBRyxFQUFHLG1CQUEyQixDQUFDLE1BQU0sRUFBa0IsQ0FBQyxDQUFDLENBQUM7UUFDeEksQ0FBQztRQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDWCxJQUFJLENBQUM7Z0JBQ0gseURBQXlEO2dCQUN6RCxnRUFBZ0U7Z0JBQ2hFLDZDQUE2QztnQkFDN0MsTUFBTSxPQUFPLEdBQUcsY0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsK0JBQStCLENBQUMsQ0FBQyxDQUFDO2dCQUMxRSxNQUFNLFdBQVcsR0FBRyxzQkFBSyxDQUFDLE1BQU0sRUFBRTtvQkFDaEMsZUFBZSxFQUFFLFFBQVE7b0JBQ3pCLGNBQWMsRUFBRSxRQUFRO29CQUN4QixPQUFPLEVBQUUsSUFBSTtvQkFDYixVQUFVLEVBQUUsSUFBSTtvQkFDaEIsOERBQThEO29CQUM5RCx1Q0FBdUM7b0JBQ3ZDLE9BQU8sRUFBRSxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7aUJBQzNDLENBQUMsQ0FBQztnQkFDSCxNQUFNLG1CQUFtQixHQUFHLElBQUksK0JBQWtCLENBQUM7b0JBQ2pELElBQUksRUFBRSxRQUFRO2lCQUNmLENBQUMsQ0FBQztnQkFDSCxNQUFNLFNBQVMsR0FBRyxTQUFTLENBQUMsUUFBUSxFQUFFLFdBQVcsQ0FBQyxJQUFJLEVBQUUsbUJBQW1CLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ25GLE1BQU0sQ0FBQyxjQUFjLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxRQUFRLEVBQUUsTUFBTSxFQUFRLFdBQVcsQ0FBQyxHQUFHLEVBQUcsbUJBQTJCLENBQUMsTUFBTSxFQUFrQixDQUFDLENBQUMsQ0FBQztZQUM5SSxDQUFDO1lBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDWCxPQUFPLENBQUMsS0FBSyxDQUFDLHVCQUF1QixRQUFRLDREQUE0RCxDQUFDLENBQUM7Z0JBQzNHLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2pCLE1BQU0sQ0FBQyxNQUFNLENBQUM7WUFDaEIsQ0FBQztRQUNILENBQUM7SUFDSCxDQUFDO0FBQ0gsQ0FBQztBQUVEOzs7Ozs7O0dBT0c7QUFDSCxtQkFBMEIsUUFBZ0IsRUFBRSxNQUFjLEVBQUUsUUFBUSxHQUFDLGdCQUFnQixFQUFFLFdBQVcsR0FBQyxtQkFBbUIsRUFBRSxhQUFzQjtJQUM1SSxNQUFNLENBQUMsY0FBYyxDQUFDLFFBQVEsRUFBRSxNQUFNLEVBQUUsQ0FBQyxRQUFRLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxVQUFVLEVBQUUsRUFBRTtRQUNsRixNQUFNLE9BQU8sR0FBRyxJQUFJLGtCQUFrQixDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN4RSxJQUFJLEdBQUcsR0FBRyxlQUFlLENBQUMsTUFBTSxFQUFFLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7UUFDakQsQ0FBQztZQUNDLE1BQU0sY0FBYyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbkMsRUFBRSxDQUFDLENBQUMsY0FBYyxJQUFJLGNBQWMsQ0FBQyxJQUFJLEtBQUsscUJBQXFCLENBQUMsQ0FBQyxDQUFDO2dCQUNwRSxtQkFBbUI7Z0JBQ25CLEVBQUUsQ0FBQyxDQUFRLGNBQWUsQ0FBQyxTQUFTLEtBQUssY0FBYyxDQUFDLENBQUMsQ0FBQztvQkFDeEQsTUFBTSxDQUFDLE1BQU0sQ0FBQztnQkFDaEIsQ0FBQztZQUNILENBQUM7UUFDSCxDQUFDO1FBRUQsR0FBRyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDM0IsTUFBTSxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUM7SUFDaEQsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBakJELDhCQWlCQztBQUVEOzs7OztHQUtHO0FBQ0gsNEJBQW1DLFFBQWdCLEVBQUUsTUFBYyxFQUFFLFFBQVEsR0FBQyxnQkFBZ0IsRUFBRSxXQUFXLEdBQUMsbUJBQW1CLEVBQUUsYUFBc0I7SUFDckosTUFBTSxDQUFDLGNBQWMsQ0FBQyxRQUFRLEVBQUUsTUFBTSxFQUFFLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFFLEVBQUU7UUFDbEYsTUFBTSxDQUFDLDBCQUEwQixDQUFDLFFBQVEsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLGFBQWEsQ0FBQyxDQUFBO0lBQzFILENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQUpELGdEQUlDO0FBRUQsc0JBQTZCLFFBQWdCLEVBQUUsTUFBYztJQUMzRCxJQUFJLEdBQUcsR0FBRyxlQUFlLENBQUMsTUFBTSxFQUFFLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7SUFDakQsTUFBTSxTQUFTLEdBQUcsSUFBSSwrQkFBa0IsQ0FBQztRQUN2QyxJQUFJLEVBQUUsUUFBUTtLQUNmLENBQUMsQ0FBQztJQUNILFNBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDN0MsTUFBTSxTQUFTLEdBQUcsa0JBQWtCLENBQUMsR0FBRyxFQUFFLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQztJQUN6RCxNQUFNLENBQUMsY0FBYyxDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztBQUN6RCxDQUFDO0FBUkQsb0NBUUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge05vZGUsIEJhc2VTdGF0ZW1lbnQsIFN0YXRlbWVudCwgUHJvZ3JhbSwgRW1wdHlTdGF0ZW1lbnQsIEJsb2NrU3RhdGVtZW50LCBFeHByZXNzaW9uU3RhdGVtZW50LCBJZlN0YXRlbWVudCwgTGFiZWxlZFN0YXRlbWVudCwgQnJlYWtTdGF0ZW1lbnQsIENvbnRpbnVlU3RhdGVtZW50LCBXaXRoU3RhdGVtZW50LCBTd2l0Y2hTdGF0ZW1lbnQsIFJldHVyblN0YXRlbWVudCwgVGhyb3dTdGF0ZW1lbnQsIFRyeVN0YXRlbWVudCwgV2hpbGVTdGF0ZW1lbnQsIERvV2hpbGVTdGF0ZW1lbnQsIEZvclN0YXRlbWVudCwgRm9ySW5TdGF0ZW1lbnQsIERlYnVnZ2VyU3RhdGVtZW50LCBGb3JPZlN0YXRlbWVudCwgRnVuY3Rpb25EZWNsYXJhdGlvbiwgVmFyaWFibGVEZWNsYXJhdGlvbiwgVmFyaWFibGVEZWNsYXJhdG9yLCBUaGlzRXhwcmVzc2lvbiwgQXJyYXlFeHByZXNzaW9uLCBPYmplY3RFeHByZXNzaW9uLCBQcm9wZXJ0eSwgRnVuY3Rpb25FeHByZXNzaW9uLCBTZXF1ZW5jZUV4cHJlc3Npb24sIFVuYXJ5RXhwcmVzc2lvbiwgQmluYXJ5RXhwcmVzc2lvbiwgQXNzaWdubWVudEV4cHJlc3Npb24sIFVwZGF0ZUV4cHJlc3Npb24sIExvZ2ljYWxFeHByZXNzaW9uLCBDb25kaXRpb25hbEV4cHJlc3Npb24sIE5ld0V4cHJlc3Npb24sIENhbGxFeHByZXNzaW9uLCBNZW1iZXJFeHByZXNzaW9uLCBTd2l0Y2hDYXNlLCBDYXRjaENsYXVzZSwgSWRlbnRpZmllciwgTGl0ZXJhbCwgU3VwZXIsIFNwcmVhZEVsZW1lbnQsIEFycm93RnVuY3Rpb25FeHByZXNzaW9uLCBZaWVsZEV4cHJlc3Npb24sIFRlbXBsYXRlRWxlbWVudCwgVGVtcGxhdGVMaXRlcmFsLCBUYWdnZWRUZW1wbGF0ZUV4cHJlc3Npb24sIE9iamVjdFBhdHRlcm4sIEFycmF5UGF0dGVybiwgUmVzdEVsZW1lbnQsIEFzc2lnbm1lbnRQYXR0ZXJuLCBDbGFzc0JvZHksIENsYXNzRGVjbGFyYXRpb24sIENsYXNzRXhwcmVzc2lvbiwgTWV0aG9kRGVmaW5pdGlvbiwgTWV0YVByb3BlcnR5LCBJbXBvcnREZWNsYXJhdGlvbiwgSW1wb3J0RGVmYXVsdFNwZWNpZmllciwgSW1wb3J0TmFtZXNwYWNlU3BlY2lmaWVyLCBJbXBvcnRTcGVjaWZpZXIsIEV4cG9ydEFsbERlY2xhcmF0aW9uLCBFeHBvcnREZWZhdWx0RGVjbGFyYXRpb24sIEV4cG9ydE5hbWVkRGVjbGFyYXRpb24sIEV4cG9ydFNwZWNpZmllciwgQXdhaXRFeHByZXNzaW9ufSBmcm9tICdlc3RyZWUnO1xuaW1wb3J0IHtwYXJzZSBhcyBwYXJzZUphdmFTY3JpcHR9IGZyb20gJ2VzcHJpbWEnO1xuaW1wb3J0IHtnZW5lcmF0ZSBhcyBnZW5lcmF0ZUphdmFTY3JpcHR9IGZyb20gJ2FzdHJpbmcnO1xuaW1wb3J0IHtTb3VyY2VNYXBHZW5lcmF0b3IsIFNvdXJjZU1hcENvbnN1bWVyLCBSYXdTb3VyY2VNYXB9IGZyb20gJ3NvdXJjZS1tYXAnO1xuaW1wb3J0IHt0cmFuc2Zvcm0gYXMgYnVibGV9IGZyb20gJ2J1YmxlJztcbmltcG9ydCB7dHJhbnNmb3JtIGFzIGJhYmVsfSBmcm9tICdiYWJlbC1jb3JlJztcbmltcG9ydCB7ZGlybmFtZX0gZnJvbSAncGF0aCc7XG5cbi8qKlxuICogRmFrZSBBU1Qgbm9kZSB0aGF0IGNvbnRhaW5zIG11bHRpcGxlIHN0YXRlbWVudHMgdGhhdCBtdXN0IGJlXG4gKiBpbmxpbmVkIGludG8gYSBibG9jay5cbiAqL1xuaW50ZXJmYWNlIE11bHRpcGxlU3RhdGVtZW50cyBleHRlbmRzIEJhc2VTdGF0ZW1lbnQge1xuICB0eXBlOiBcIk11bHRpcGxlU3RhdGVtZW50c1wiO1xuICBib2R5OiBTdGF0ZW1lbnRbXTtcbn1cblxuY29uc3QgZW51bSBWYXJUeXBlIHtcbiAgLy8gZnVuY3Rpb24gb3IgY2F0Y2hjbGF1c2UgYXJndW1lbnRcbiAgQVJHLFxuICAvLyB2YXIgZGVjbGFyYXRpb25cbiAgVkFSLFxuICAvLyBjb25zdCBkZWNsYXJhdGlvblxuICBDT05TVCxcbiAgLy8gZnVuY3Rpb24gZGVjbGFyYXRpb25cbiAgRlVOQ1RJT05fREVDTCxcbiAgLy8gbGV0IGRlY2xhcmF0aW9uXG4gIExFVCxcbiAgLy8gVXNlZCBpbiBxdWVyaWVzLlxuICBVTktOT1dOXG59XG5cbmZ1bmN0aW9uIGdldFBvbHlmaWxsSW5zZXJ0aW9uKHVybDogc3RyaW5nKTogSWZTdGF0ZW1lbnQge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiSWZTdGF0ZW1lbnRcIixcbiAgICB0ZXN0OiB7XG4gICAgICB0eXBlOiBcIkJpbmFyeUV4cHJlc3Npb25cIixcbiAgICAgIG9wZXJhdG9yOiBcIj09PVwiLFxuICAgICAgbGVmdDoge1xuICAgICAgICB0eXBlOiBcIlVuYXJ5RXhwcmVzc2lvblwiLFxuICAgICAgICBvcGVyYXRvcjogXCJ0eXBlb2ZcIixcbiAgICAgICAgYXJndW1lbnQ6IHtcbiAgICAgICAgICB0eXBlOiBcIklkZW50aWZpZXJcIixcbiAgICAgICAgICBuYW1lOiBcInJlZ2VuZXJhdG9yUnVudGltZVwiXG4gICAgICAgIH0sXG4gICAgICAgIHByZWZpeDogdHJ1ZVxuICAgICAgfSxcbiAgICAgIHJpZ2h0OiB7XG4gICAgICAgIHR5cGU6IFwiTGl0ZXJhbFwiLFxuICAgICAgICB2YWx1ZTogXCJ1bmRlZmluZWRcIixcbiAgICAgICAgcmF3OiBcIlxcXCJ1bmRlZmluZWRcXFwiXCJcbiAgICAgIH1cbiAgICB9LFxuICAgIGNvbnNlcXVlbnQ6IHtcbiAgICAgIHR5cGU6IFwiQmxvY2tTdGF0ZW1lbnRcIixcbiAgICAgIGJvZHk6IFt7XG4gICAgICAgIHR5cGU6IFwiRXhwcmVzc2lvblN0YXRlbWVudFwiLFxuICAgICAgICBleHByZXNzaW9uOiB7XG4gICAgICAgICAgdHlwZTogXCJDYWxsRXhwcmVzc2lvblwiLFxuICAgICAgICAgIGNhbGxlZToge1xuICAgICAgICAgICAgdHlwZTogXCJJZGVudGlmaWVyXCIsXG4gICAgICAgICAgICBuYW1lOiBcImxvYWRTY3JpcHRcIlxuICAgICAgICAgIH0sXG4gICAgICAgICAgYXJndW1lbnRzOiBbe1xuICAgICAgICAgICAgdHlwZTogXCJMaXRlcmFsXCIsXG4gICAgICAgICAgICB2YWx1ZTogdXJsLFxuICAgICAgICAgICAgcmF3OiBgXCIke3VybH1cImBcbiAgICAgICAgICB9XVxuICAgICAgICB9XG4gICAgICB9XVxuICAgIH0sXG4gICAgYWx0ZXJuYXRlOiBudWxsXG4gIH07XG59XG5cbmZ1bmN0aW9uIGdldEFnZW50SW5zZXJ0aW9uKHVybDogc3RyaW5nKTogSWZTdGF0ZW1lbnQge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiSWZTdGF0ZW1lbnRcIixcbiAgICB0ZXN0OiB7XG4gICAgICB0eXBlOiBcIkJpbmFyeUV4cHJlc3Npb25cIixcbiAgICAgIG9wZXJhdG9yOiBcIj09PVwiLFxuICAgICAgbGVmdDoge1xuICAgICAgICB0eXBlOiBcIlVuYXJ5RXhwcmVzc2lvblwiLFxuICAgICAgICBvcGVyYXRvcjogXCJ0eXBlb2ZcIixcbiAgICAgICAgYXJndW1lbnQ6IHtcbiAgICAgICAgICB0eXBlOiBcIklkZW50aWZpZXJcIixcbiAgICAgICAgICBuYW1lOiBcIiQkJENSRUFURV9TQ09QRV9PQkpFQ1QkJCRcIlxuICAgICAgICB9LFxuICAgICAgICBwcmVmaXg6IHRydWVcbiAgICAgIH0sXG4gICAgICByaWdodDoge1xuICAgICAgICB0eXBlOiBcIkxpdGVyYWxcIixcbiAgICAgICAgdmFsdWU6IFwidW5kZWZpbmVkXCIsXG4gICAgICAgIHJhdzogXCJcXFwidW5kZWZpbmVkXFxcIlwiXG4gICAgICB9XG4gICAgfSxcbiAgICBjb25zZXF1ZW50OiB7XG4gICAgICB0eXBlOiBcIkJsb2NrU3RhdGVtZW50XCIsXG4gICAgICBib2R5OiBbe1xuICAgICAgICB0eXBlOiBcIkV4cHJlc3Npb25TdGF0ZW1lbnRcIixcbiAgICAgICAgZXhwcmVzc2lvbjoge1xuICAgICAgICAgIHR5cGU6IFwiQ2FsbEV4cHJlc3Npb25cIixcbiAgICAgICAgICBjYWxsZWU6IHtcbiAgICAgICAgICAgIHR5cGU6IFwiSWRlbnRpZmllclwiLFxuICAgICAgICAgICAgbmFtZTogXCJsb2FkU2NyaXB0XCJcbiAgICAgICAgICB9LFxuICAgICAgICAgIGFyZ3VtZW50czogW3tcbiAgICAgICAgICAgIHR5cGU6IFwiTGl0ZXJhbFwiLFxuICAgICAgICAgICAgdmFsdWU6IHVybCxcbiAgICAgICAgICAgIHJhdzogYFwiJHt1cmx9XCJgXG4gICAgICAgICAgfV1cbiAgICAgICAgfVxuICAgICAgfV1cbiAgICB9LFxuICAgIGFsdGVybmF0ZTogbnVsbFxuICB9O1xufVxuXG5mdW5jdGlvbiBnZXRQcm9ncmFtUHJlbHVkZShzdGF0ZW1lbnRzOiBJZlN0YXRlbWVudFtdKTogRXhwcmVzc2lvblN0YXRlbWVudCB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJFeHByZXNzaW9uU3RhdGVtZW50XCIsXG4gICAgZXhwcmVzc2lvbjoge1xuICAgICAgdHlwZTogXCJDYWxsRXhwcmVzc2lvblwiLFxuICAgICAgY2FsbGVlOiB7XG4gICAgICAgIHR5cGU6IFwiRnVuY3Rpb25FeHByZXNzaW9uXCIsXG4gICAgICAgIGlkOiBudWxsLFxuICAgICAgICBwYXJhbXM6IFtdLFxuICAgICAgICBib2R5OiB7XG4gICAgICAgICAgdHlwZTogXCJCbG9ja1N0YXRlbWVudFwiLFxuICAgICAgICAgIGJvZHk6ICg8U3RhdGVtZW50W10+IFt7XG4gICAgICAgICAgICB0eXBlOiBcIkZ1bmN0aW9uRGVjbGFyYXRpb25cIixcbiAgICAgICAgICAgIGlkOiB7XG4gICAgICAgICAgICAgIHR5cGU6IFwiSWRlbnRpZmllclwiLFxuICAgICAgICAgICAgICBuYW1lOiBcImxvYWRTY3JpcHRcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHBhcmFtczogW3tcbiAgICAgICAgICAgICAgdHlwZTogXCJJZGVudGlmaWVyXCIsXG4gICAgICAgICAgICAgIG5hbWU6IFwidXJsXCJcbiAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgYm9keToge1xuICAgICAgICAgICAgICB0eXBlOiBcIkJsb2NrU3RhdGVtZW50XCIsXG4gICAgICAgICAgICAgIGJvZHk6IFt7XG4gICAgICAgICAgICAgICAgdHlwZTogXCJJZlN0YXRlbWVudFwiLFxuICAgICAgICAgICAgICAgIHRlc3Q6IHtcbiAgICAgICAgICAgICAgICAgIHR5cGU6IFwiQmluYXJ5RXhwcmVzc2lvblwiLFxuICAgICAgICAgICAgICAgICAgb3BlcmF0b3I6IFwiIT09XCIsXG4gICAgICAgICAgICAgICAgICBsZWZ0OiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiVW5hcnlFeHByZXNzaW9uXCIsXG4gICAgICAgICAgICAgICAgICAgIG9wZXJhdG9yOiBcInR5cGVvZlwiLFxuICAgICAgICAgICAgICAgICAgICBhcmd1bWVudDoge1xuICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiSWRlbnRpZmllclwiLFxuICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IFwiWE1MSHR0cFJlcXVlc3RcIlxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBwcmVmaXg6IHRydWVcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICByaWdodDoge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIkxpdGVyYWxcIixcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IFwidW5kZWZpbmVkXCIsXG4gICAgICAgICAgICAgICAgICAgIHJhdzogXCJcXFwidW5kZWZpbmVkXFxcIlwiXG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBjb25zZXF1ZW50OiB7XG4gICAgICAgICAgICAgICAgICB0eXBlOiBcIkJsb2NrU3RhdGVtZW50XCIsXG4gICAgICAgICAgICAgICAgICBib2R5OiBbe1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIlZhcmlhYmxlRGVjbGFyYXRpb25cIixcbiAgICAgICAgICAgICAgICAgICAgZGVjbGFyYXRpb25zOiBbe1xuICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiVmFyaWFibGVEZWNsYXJhdG9yXCIsXG4gICAgICAgICAgICAgICAgICAgICAgaWQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJJZGVudGlmaWVyXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IFwieGhyXCJcbiAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgIGluaXQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJOZXdFeHByZXNzaW9uXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxlZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJJZGVudGlmaWVyXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBcIlhNTEh0dHBSZXF1ZXN0XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYXJndW1lbnRzOiBbXVxuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfV0sXG4gICAgICAgICAgICAgICAgICAgIGtpbmQ6IFwidmFyXCJcbiAgICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJFeHByZXNzaW9uU3RhdGVtZW50XCIsXG4gICAgICAgICAgICAgICAgICAgIGV4cHJlc3Npb246IHtcbiAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIkNhbGxFeHByZXNzaW9uXCIsXG4gICAgICAgICAgICAgICAgICAgICAgY2FsbGVlOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIk1lbWJlckV4cHJlc3Npb25cIixcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXB1dGVkOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG9iamVjdDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIklkZW50aWZpZXJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogXCJ4aHJcIlxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiSWRlbnRpZmllclwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBcIm9wZW5cIlxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgYXJndW1lbnRzOiBbe1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJMaXRlcmFsXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogXCJHRVRcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHJhdzogXCInR0VUJ1wiXG4gICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIklkZW50aWZpZXJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IFwidXJsXCJcbiAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiTGl0ZXJhbFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgcmF3OiBcImZhbHNlXCJcbiAgICAgICAgICAgICAgICAgICAgICB9XVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiRXhwcmVzc2lvblN0YXRlbWVudFwiLFxuICAgICAgICAgICAgICAgICAgICBleHByZXNzaW9uOiB7XG4gICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJDYWxsRXhwcmVzc2lvblwiLFxuICAgICAgICAgICAgICAgICAgICAgIGNhbGxlZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJNZW1iZXJFeHByZXNzaW9uXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wdXRlZDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICBvYmplY3Q6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJJZGVudGlmaWVyXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IFwieGhyXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIklkZW50aWZpZXJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogXCJzZW5kXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgIGFyZ3VtZW50czogW11cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIkV4cHJlc3Npb25TdGF0ZW1lbnRcIixcbiAgICAgICAgICAgICAgICAgICAgZXhwcmVzc2lvbjoge1xuICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiQ2FsbEV4cHJlc3Npb25cIixcbiAgICAgICAgICAgICAgICAgICAgICBjYWxsZWU6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiTmV3RXhwcmVzc2lvblwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGVlOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiSWRlbnRpZmllclwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBcIkZ1bmN0aW9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBhcmd1bWVudHM6IFt7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiTWVtYmVyRXhwcmVzc2lvblwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBjb21wdXRlZDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9iamVjdDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJJZGVudGlmaWVyXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBcInhoclwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIklkZW50aWZpZXJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IFwicmVzcG9uc2VUZXh0XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfV1cbiAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgIGFyZ3VtZW50czogW11cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfV1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGFsdGVybmF0ZToge1xuICAgICAgICAgICAgICAgICAgdHlwZTogXCJJZlN0YXRlbWVudFwiLFxuICAgICAgICAgICAgICAgICAgdGVzdDoge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIkJpbmFyeUV4cHJlc3Npb25cIixcbiAgICAgICAgICAgICAgICAgICAgb3BlcmF0b3I6IFwiIT09XCIsXG4gICAgICAgICAgICAgICAgICAgIGxlZnQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIlVuYXJ5RXhwcmVzc2lvblwiLFxuICAgICAgICAgICAgICAgICAgICAgIG9wZXJhdG9yOiBcInR5cGVvZlwiLFxuICAgICAgICAgICAgICAgICAgICAgIGFyZ3VtZW50OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIklkZW50aWZpZXJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IFwiaW1wb3J0U2NyaXB0c1wiXG4gICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICBwcmVmaXg6IHRydWVcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmlnaHQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIkxpdGVyYWxcIixcbiAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogXCJ1bmRlZmluZWRcIixcbiAgICAgICAgICAgICAgICAgICAgICByYXc6IFwiXFxcInVuZGVmaW5lZFxcXCJcIlxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgY29uc2VxdWVudDoge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIkJsb2NrU3RhdGVtZW50XCIsXG4gICAgICAgICAgICAgICAgICAgIGJvZHk6IFt7XG4gICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJFeHByZXNzaW9uU3RhdGVtZW50XCIsXG4gICAgICAgICAgICAgICAgICAgICAgZXhwcmVzc2lvbjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJDYWxsRXhwcmVzc2lvblwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGVlOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiSWRlbnRpZmllclwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBcImltcG9ydFNjcmlwdHNcIlxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3VtZW50czogW3tcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJJZGVudGlmaWVyXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IFwidXJsXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1dXG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XVxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIGFsdGVybmF0ZToge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIkJsb2NrU3RhdGVtZW50XCIsXG4gICAgICAgICAgICAgICAgICAgIGJvZHk6IFt7XG4gICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJUaHJvd1N0YXRlbWVudFwiLFxuICAgICAgICAgICAgICAgICAgICAgIGFyZ3VtZW50OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIk5ld0V4cHJlc3Npb25cIixcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxlZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIklkZW50aWZpZXJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogXCJFcnJvclwiXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgYXJndW1lbnRzOiBbe1xuICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIkJpbmFyeUV4cHJlc3Npb25cIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgb3BlcmF0b3I6IFwiK1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBsZWZ0OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJMaXRlcmFsXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IFwiVW5hYmxlIHRvIGxvYWQgc2NyaXB0IFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJhdzogXCJcXFwiVW5hYmxlIHRvIGxvYWQgc2NyaXB0IFxcXCJcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICByaWdodDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiSWRlbnRpZmllclwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IFwidXJsXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfV1cbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1dXG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdlbmVyYXRvcjogZmFsc2UsXG4gICAgICAgICAgICBhc3luYzogZmFsc2VcbiAgICAgICAgICB9XSkuY29uY2F0KHN0YXRlbWVudHMpXG4gICAgICAgIH0sXG4gICAgICAgIGdlbmVyYXRvcjogZmFsc2UsXG4gICAgICAgIGV4cHJlc3Npb246IGZhbHNlLFxuICAgICAgICBhc3luYzogZmFsc2VcbiAgICAgIH0sXG4gICAgICBhcmd1bWVudHM6IFtdXG4gICAgfVxuICB9O1xufVxuXG5mdW5jdGlvbiBnZXRFeHByZXNzaW9uVHJhbnNmb3JtKG9yaWdpbmFsRnVuY3Rpb246IEZ1bmN0aW9uRXhwcmVzc2lvbiwgc2NvcGVWYXJOYW1lOiBzdHJpbmcpOiBDYWxsRXhwcmVzc2lvbiB7XG4gIGNvbnN0IGNlOiBDYWxsRXhwcmVzc2lvbiA9IHtcbiAgICB0eXBlOiBcIkNhbGxFeHByZXNzaW9uXCIsXG4gICAgY2FsbGVlOiB7XG4gICAgICB0eXBlOiBcIklkZW50aWZpZXJcIixcbiAgICAgIG5hbWU6IFwiJCQkRlVOQ1RJT05fRVhQUkVTU0lPTiQkJFwiLFxuICAgICAgbG9jOiBvcmlnaW5hbEZ1bmN0aW9uLmxvY1xuICAgIH0sXG4gICAgYXJndW1lbnRzOiBbb3JpZ2luYWxGdW5jdGlvbiwgeyB0eXBlOiBcIklkZW50aWZpZXJcIiwgbmFtZTogc2NvcGVWYXJOYW1lfV0sXG4gICAgbG9jOiBvcmlnaW5hbEZ1bmN0aW9uLmxvY1xuICB9O1xuICByZXR1cm4gY2U7XG59XG5cbmZ1bmN0aW9uIGdldE9iamVjdEV4cHJlc3Npb25UcmFuc2Zvcm0ob3JpZ2luYWw6IE9iamVjdEV4cHJlc3Npb24sIHNjb3BlVmFyTmFtZTogc3RyaW5nKTogQ2FsbEV4cHJlc3Npb24ge1xuICBjb25zdCBjZTogQ2FsbEV4cHJlc3Npb24gPSB7XG4gICAgdHlwZTogXCJDYWxsRXhwcmVzc2lvblwiLFxuICAgIGNhbGxlZToge1xuICAgICAgdHlwZTogXCJJZGVudGlmaWVyXCIsXG4gICAgICBuYW1lOiBcIiQkJE9CSkVDVF9FWFBSRVNTSU9OJCQkXCIsXG4gICAgICBsb2M6IG9yaWdpbmFsLmxvY1xuICAgIH0sXG4gICAgYXJndW1lbnRzOiBbb3JpZ2luYWwsIHsgdHlwZTogXCJJZGVudGlmaWVyXCIsIG5hbWU6IHNjb3BlVmFyTmFtZX1dLFxuICAgIGxvYzogb3JpZ2luYWwubG9jXG4gIH07XG4gIHJldHVybiBjZTtcbn1cblxuZnVuY3Rpb24gZ2V0U2NvcGVBc3NpZ25tZW50KGZ1bmN0aW9uVmFyTmFtZTogc3RyaW5nLCBzY29wZVZhck5hbWU6IHN0cmluZyk6IEV4cHJlc3Npb25TdGF0ZW1lbnQge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiRXhwcmVzc2lvblN0YXRlbWVudFwiLFxuICAgIGV4cHJlc3Npb246IHtcbiAgICAgIHR5cGU6IFwiQ2FsbEV4cHJlc3Npb25cIixcbiAgICAgIGNhbGxlZToge1xuICAgICAgICB0eXBlOiBcIk1lbWJlckV4cHJlc3Npb25cIixcbiAgICAgICAgY29tcHV0ZWQ6IGZhbHNlLFxuICAgICAgICBvYmplY3Q6IHtcbiAgICAgICAgICB0eXBlOiBcIklkZW50aWZpZXJcIixcbiAgICAgICAgICBuYW1lOiBcIk9iamVjdFwiXG4gICAgICAgIH0sXG4gICAgICAgIHByb3BlcnR5OiB7XG4gICAgICAgICAgdHlwZTogXCJJZGVudGlmaWVyXCIsXG4gICAgICAgICAgbmFtZTogXCJkZWZpbmVQcm9wZXJ0eVwiXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBhcmd1bWVudHM6IFt7XG4gICAgICAgIHR5cGU6IFwiSWRlbnRpZmllclwiLFxuICAgICAgICBuYW1lOiBmdW5jdGlvblZhck5hbWVcbiAgICAgIH0sIHtcbiAgICAgICAgdHlwZTogXCJMaXRlcmFsXCIsXG4gICAgICAgIHZhbHVlOiBcIl9fc2NvcGVfX1wiLFxuICAgICAgICByYXc6IFwiJ19fc2NvcGVfXydcIlxuICAgICAgfSwge1xuICAgICAgICB0eXBlOiBcIk9iamVjdEV4cHJlc3Npb25cIixcbiAgICAgICAgcHJvcGVydGllczogW3tcbiAgICAgICAgICB0eXBlOiBcIlByb3BlcnR5XCIsXG4gICAgICAgICAga2V5OiB7XG4gICAgICAgICAgICB0eXBlOiBcIklkZW50aWZpZXJcIixcbiAgICAgICAgICAgIG5hbWU6IFwiZ2V0XCJcbiAgICAgICAgICB9LFxuICAgICAgICAgIGNvbXB1dGVkOiBmYWxzZSxcbiAgICAgICAgICB2YWx1ZToge1xuICAgICAgICAgICAgdHlwZTogXCJGdW5jdGlvbkV4cHJlc3Npb25cIixcbiAgICAgICAgICAgIGlkOiBudWxsLFxuICAgICAgICAgICAgcGFyYW1zOiBbXSxcbiAgICAgICAgICAgIGJvZHk6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiBcIkJsb2NrU3RhdGVtZW50XCIsXG4gICAgICAgICAgICAgICAgYm9keTogW3tcbiAgICAgICAgICAgICAgICAgIHR5cGU6IFwiUmV0dXJuU3RhdGVtZW50XCIsXG4gICAgICAgICAgICAgICAgICBhcmd1bWVudDogeyB0eXBlOiBcIklkZW50aWZpZXJcIiwgbmFtZTogc2NvcGVWYXJOYW1lIH1cbiAgICAgICAgICAgICAgfV1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZW5lcmF0b3I6IGZhbHNlLFxuICAgICAgICAgICAgYXN5bmM6IGZhbHNlXG4gICAgICAgICAgfSxcbiAgICAgICAgICBraW5kOiBcImluaXRcIixcbiAgICAgICAgICBtZXRob2Q6IGZhbHNlLFxuICAgICAgICAgIHNob3J0aGFuZDogZmFsc2VcbiAgICAgICAgfSwge1xuICAgICAgICAgIHR5cGU6IFwiUHJvcGVydHlcIixcbiAgICAgICAgICBrZXk6IHtcbiAgICAgICAgICAgIHR5cGU6IFwiSWRlbnRpZmllclwiLFxuICAgICAgICAgICAgbmFtZTogXCJjb25maWd1cmFibGVcIlxuICAgICAgICAgIH0sXG4gICAgICAgICAgY29tcHV0ZWQ6IGZhbHNlLFxuICAgICAgICAgIHZhbHVlOiB7XG4gICAgICAgICAgICB0eXBlOiBcIkxpdGVyYWxcIixcbiAgICAgICAgICAgIHZhbHVlOiB0cnVlLFxuICAgICAgICAgICAgcmF3OiBcInRydWVcIlxuICAgICAgICAgIH0sXG4gICAgICAgICAga2luZDogXCJpbml0XCIsXG4gICAgICAgICAgbWV0aG9kOiBmYWxzZSxcbiAgICAgICAgICBzaG9ydGhhbmQ6IGZhbHNlXG4gICAgICAgIH1dXG4gICAgICB9XVxuICAgIH1cbiAgfTtcbn1cblxuZnVuY3Rpb24gc3RhdGVtZW50VG9CbG9jayhzOiBTdGF0ZW1lbnQpOiBCbG9ja1N0YXRlbWVudCB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJCbG9ja1N0YXRlbWVudFwiLFxuICAgIGJvZHk6IFtzXSxcbiAgICBsb2M6IHMubG9jXG4gIH07XG59XG5cbmZ1bmN0aW9uIHN0YXRlbWVudHNUb0Jsb2NrKHBhcmVudDogTm9kZSwgczogU3RhdGVtZW50W10pOiBCbG9ja1N0YXRlbWVudCB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJCbG9ja1N0YXRlbWVudFwiLFxuICAgIGJvZHk6IHMsXG4gICAgbG9jOiBwYXJlbnQubG9jXG4gIH07XG59XG5cbmZ1bmN0aW9uIGRlY2xhcmF0aW9uRnJvbURlY2xhcmF0b3JzKGtpbmQ6IFwidmFyXCIgfCBcImNvbnN0XCIgfCBcImxldFwiLCBkZWNsczogVmFyaWFibGVEZWNsYXJhdG9yW10pOiBWYXJpYWJsZURlY2xhcmF0aW9uIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIlZhcmlhYmxlRGVjbGFyYXRpb25cIixcbiAgICBraW5kOiBraW5kLFxuICAgIGRlY2xhcmF0aW9uczogZGVjbHMsXG4gICAgbG9jOiB7XG4gICAgICBzdGFydDogZGVjbHNbMF0ubG9jLnN0YXJ0LFxuICAgICAgZW5kOiBkZWNsc1tkZWNscy5sZW5ndGggLSAxXS5sb2MuZW5kXG4gICAgfVxuICB9O1xufVxuXG5mdW5jdGlvbiBnZXRTdHJpbmdMaXRlcmFsQXJyYXkobmFtZXM6IHN0cmluZ1tdKTogTGl0ZXJhbFtdIHtcbiAgcmV0dXJuIG5hbWVzLm1hcCgobik6IExpdGVyYWwgPT4ge1xuICAgIHJldHVybiB7IHR5cGU6IFwiTGl0ZXJhbFwiLCB2YWx1ZTogbiwgcmF3OiBgXCIke259XCJgIH1cbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGdldElkZW50aWZpZXJBcnJheShuYW1lczogc3RyaW5nW10pOiBJZGVudGlmaWVyW10ge1xuICByZXR1cm4gbmFtZXMubWFwKChuKTogSWRlbnRpZmllciA9PiB7XG4gICAgcmV0dXJuIHsgdHlwZTogXCJJZGVudGlmaWVyXCIsIG5hbWU6IG4gfVxuICB9KTtcbn1cblxuZnVuY3Rpb24gZ2V0U2NvcGVQcm9wZXJ0aWVzKG5hbWVzOiBzdHJpbmdbXSk6IFByb3BlcnR5W10ge1xuICByZXR1cm4gbmFtZXMubWFwKChuKTogUHJvcGVydHkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiBcIlByb3BlcnR5XCIsXG4gICAgICBrZXk6IHsgdHlwZTogXCJJZGVudGlmaWVyXCIsIG5hbWU6IG4gfSxcbiAgICAgIGNvbXB1dGVkOiBmYWxzZSxcbiAgICAgIHZhbHVlOiB7XG4gICAgICAgIHR5cGU6IFwiT2JqZWN0RXhwcmVzc2lvblwiLFxuICAgICAgICBwcm9wZXJ0aWVzOiBbe1xuICAgICAgICAgIHR5cGU6IFwiUHJvcGVydHlcIixcbiAgICAgICAgICBrZXk6IHsgdHlwZTogXCJJZGVudGlmaWVyXCIsIG5hbWU6IFwiZ2V0XCIgfSxcbiAgICAgICAgICBjb21wdXRlZDogZmFsc2UsXG4gICAgICAgICAgdmFsdWU6IHtcbiAgICAgICAgICAgIHR5cGU6IFwiRnVuY3Rpb25FeHByZXNzaW9uXCIsXG4gICAgICAgICAgICBpZDogbnVsbCxcbiAgICAgICAgICAgIHBhcmFtczogW10sXG4gICAgICAgICAgICBib2R5OiB7XG4gICAgICAgICAgICAgICAgdHlwZTogXCJCbG9ja1N0YXRlbWVudFwiLFxuICAgICAgICAgICAgICAgIGJvZHk6IFt7XG4gICAgICAgICAgICAgICAgICB0eXBlOiBcIlJldHVyblN0YXRlbWVudFwiLFxuICAgICAgICAgICAgICAgICAgYXJndW1lbnQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIklkZW50aWZpZXJcIixcbiAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBuXG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfV1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZW5lcmF0b3I6IGZhbHNlLFxuICAgICAgICAgICAgYXN5bmM6IGZhbHNlXG4gICAgICAgICAgfSxcbiAgICAgICAgICBraW5kOiBcImluaXRcIixcbiAgICAgICAgICBtZXRob2Q6IGZhbHNlLFxuICAgICAgICAgIHNob3J0aGFuZDogZmFsc2VcbiAgICAgICAgfSwge1xuICAgICAgICAgIHR5cGU6IFwiUHJvcGVydHlcIixcbiAgICAgICAgICBrZXk6IHsgdHlwZTogXCJJZGVudGlmaWVyXCIsIG5hbWU6IFwic2V0XCIgfSxcbiAgICAgICAgICBjb21wdXRlZDogZmFsc2UsXG4gICAgICAgICAgdmFsdWU6IHtcbiAgICAgICAgICAgIHR5cGU6IFwiRnVuY3Rpb25FeHByZXNzaW9uXCIsXG4gICAgICAgICAgICBpZDogbnVsbCxcbiAgICAgICAgICAgIHBhcmFtczogW3sgdHlwZTogXCJJZGVudGlmaWVyXCIsIG5hbWU6IFwidlwiIH1dLFxuICAgICAgICAgICAgYm9keToge1xuICAgICAgICAgICAgICB0eXBlOiBcIkJsb2NrU3RhdGVtZW50XCIsXG4gICAgICAgICAgICAgIGJvZHk6IFt7XG4gICAgICAgICAgICAgICAgdHlwZTogXCJFeHByZXNzaW9uU3RhdGVtZW50XCIsXG4gICAgICAgICAgICAgICAgZXhwcmVzc2lvbjoge1xuICAgICAgICAgICAgICAgICAgdHlwZTogXCJBc3NpZ25tZW50RXhwcmVzc2lvblwiLFxuICAgICAgICAgICAgICAgICAgb3BlcmF0b3I6IFwiPVwiLFxuICAgICAgICAgICAgICAgICAgbGVmdDoge1xuICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiSWRlbnRpZmllclwiLFxuICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IG5cbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICByaWdodDoge1xuICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiSWRlbnRpZmllclwiLFxuICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IFwidlwiXG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdlbmVyYXRvcjogZmFsc2UsXG4gICAgICAgICAgICBhc3luYzogZmFsc2VcbiAgICAgICAgICB9LFxuICAgICAgICAgIGtpbmQ6IFwiaW5pdFwiLFxuICAgICAgICAgIG1ldGhvZDogZmFsc2UsXG4gICAgICAgICAgc2hvcnRoYW5kOiBmYWxzZVxuICAgICAgICB9XVxuICAgICAgfSxcbiAgICAgIGtpbmQ6IFwiaW5pdFwiLFxuICAgICAgbWV0aG9kOiBmYWxzZSxcbiAgICAgIHNob3J0aGFuZDogZmFsc2VcbiAgICB9O1xuICB9KTtcbn1cblxuXG5jbGFzcyBWYXJpYWJsZSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHB1YmxpYyByZWFkb25seSB0eXBlOiBWYXJUeXBlLFxuICAgIHB1YmxpYyBjbG9zZWRPdmVyOiBib29sZWFuID0gZmFsc2UpIHt9XG59XG5cbmZ1bmN0aW9uIGNsb3NlT3Zlcih2OiBWYXJpYWJsZSk6IHZvaWQge1xuICB2LmNsb3NlZE92ZXIgPSB0cnVlO1xufVxuXG5pbnRlcmZhY2UgSVNjb3BlIHtcbiAgLyoqXG4gICAqIERlZmluZXMgdGhlIGdpdmVuIHZhcmlhYmxlIGluIHRoZSBzY29wZS5cbiAgICovXG4gIGRlZmluZVZhcmlhYmxlKG5hbWU6IHN0cmluZywgdHlwZTogVmFyVHlwZSk6IHZvaWQ7XG4gIC8qKlxuICAgKiBBIHZhcmlhYmxlIGlzIHBvdGVudGlhbGx5ICpjbG9zZWQgb3ZlciogaWZmIGFuIGlubmVyIGZ1bmN0aW9uXG4gICAqIHJlZmVyZW5jZXMgaXQuIFRodXMsIHRoaXMgZnVuY3Rpb24gY2hlY2tzIGlmIHRoZSB2YXJpYWJsZSBpc1xuICAgKiBkZWZpbmVkIHdpdGhpbiB0aGUgY3VycmVudCBmdW5jdGlvbi4gSWYgaXQgaXMsIGl0IGRvZXMgbm90aGluZy5cbiAgICogSWYgaXQgaXMgbm90LCBpdCB0ZWxscyB0aGUgcGFyZW50IHNjb3BlcyB0byBtb3ZlIHRoZSB2YXJpYWJsZVxuICAgKiBpbnRvIHRoZSBoZWFwLlxuICAgKiBAcGFyYW0gbmFtZVxuICAgKi9cbiAgbWF5YmVDbG9zZU92ZXJWYXJpYWJsZShuYW1lOiBzdHJpbmcpOiB2b2lkO1xuICAvKipcbiAgICogSW5kaWNhdGVzIHRoYXQgYSBjYWxsIHRvIGBldmFsYCB3YXMgbG9jYXRlZCB3aXRoaW4gdGhpcyBzY29wZS5cbiAgICovXG4gIGV2YWxGb3VuZCgpOiB2b2lkO1xuICAvKipcbiAgICogSXMgdGhpcyB0aGUgdG9wLWxldmVsIHNjb3BlIGluIGEgZnVuY3Rpb24/XG4gICAqL1xuICBpc0Z1bmN0aW9uU2NvcGU6IGJvb2xlYW47XG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgd2hhdCBzY29wZSwgaWYgYW55LCB0aGUgZ2l2ZW4gdmFyaWFibGUgc2hvdWxkIGJlIG1vdmVkIHRvLlxuICAgKiBSZXR1cm5zIE5VTEwgaWYgdGhlIHZhcmlhYmxlIHNob3VsZCBub3QgYmUgbW92ZWQuXG4gICAqL1xuICBzaG91bGRNb3ZlVG8obmFtZTogc3RyaW5nKTogc3RyaW5nO1xuICAvKipcbiAgICogVGhlIGlkZW50aWZpZXIgb2YgdGhlIG9iamVjdCBjb250YWluaW5nIHRoaXMgc2NvcGUncyB2YXJpYWJsZXMuXG4gICAqIERlZmVycyB0byB1cHBlciBzY29wZXMgaWYgdGhlIGdpdmVuIHNjb3BlIGhhcyBubyBtb3ZlZCB2YXJpYWJsZXMuXG4gICAqL1xuICBzY29wZUlkZW50aWZpZXI6IHN0cmluZztcbiAgLyoqXG4gICAqIEZpbmFsaXplcyB0aGUgc2NvcGUuIFRoZSBnaXZlbiBmdW5jdGlvbiByZXR1cm5zIGFuIHVuYm91bmQgbmFtZS5cbiAgICovXG4gIGZpbmFsaXplKGdldFVuYm91bmROYW1lOiAoKSA9PiBzdHJpbmcpOiB2b2lkO1xuXG4gIGdldFNjb3BlQXNzaWdubWVudHMoKTogRXhwcmVzc2lvblN0YXRlbWVudFtdO1xuXG4gIGdldFR5cGUobmFtZTogc3RyaW5nKTogVmFyVHlwZTtcbn1cblxuY2xhc3MgR2xvYmFsU2NvcGUgaW1wbGVtZW50cyBJU2NvcGUge1xuICBwdWJsaWMgc2NvcGVJZGVudGlmaWVyOiBzdHJpbmc7XG4gIGNvbnN0cnVjdG9yKHNjb3BlSWRlbnRpZmllciA9IFwiJCQkR0xPQkFMJCQkXCIpIHtcbiAgICB0aGlzLnNjb3BlSWRlbnRpZmllciA9IHNjb3BlSWRlbnRpZmllcjtcbiAgfVxuXG4gIHByb3RlY3RlZCBfdmFycyA9IG5ldyBNYXA8c3RyaW5nLCBWYXJpYWJsZT4oKTtcbiAgcHVibGljIGRlZmluZVZhcmlhYmxlKG5hbWU6IHN0cmluZywgdHlwZTogVmFyVHlwZSk6IHZvaWQge1xuICAgIC8vIE1ha2UgYWxsIGdsb2JhbCB2YXJpYWJsZXMgY2xvc2VkIG92ZXIuXG4gICAgdGhpcy5fdmFycy5zZXQobmFtZSwgbmV3IFZhcmlhYmxlKHR5cGUsIHRydWUpKTtcbiAgfVxuICBwdWJsaWMgbWF5YmVDbG9zZU92ZXJWYXJpYWJsZShuYW1lOiBzdHJpbmcpOiB2b2lkIHt9XG4gIHB1YmxpYyBldmFsRm91bmQoKTogdm9pZCB7fVxuICBwdWJsaWMgc2hvdWxkTW92ZVRvKG5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgaWYgKHRoaXMuX3ZhcnMuaGFzKG5hbWUpKSB7XG4gICAgICByZXR1cm4gdGhpcy5zY29wZUlkZW50aWZpZXI7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgZ2V0IGlzRnVuY3Rpb25TY29wZSgpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICBwdWJsaWMgZmluYWxpemUoKSB7fVxuICBwdWJsaWMgZ2V0U2NvcGVBc3NpZ25tZW50cygpOiBFeHByZXNzaW9uU3RhdGVtZW50W10ge1xuICAgIGNvbnN0IHJ2ID0gbmV3IEFycmF5PEV4cHJlc3Npb25TdGF0ZW1lbnQ+KCk7XG4gICAgdGhpcy5fdmFycy5mb3JFYWNoKCh2LCBuYW1lKSA9PiB7XG4gICAgICBpZiAodi50eXBlID09PSBWYXJUeXBlLkZVTkNUSU9OX0RFQ0wpIHtcbiAgICAgICAgcnYucHVzaChnZXRTY29wZUFzc2lnbm1lbnQobmFtZSwgdGhpcy5zY29wZUlkZW50aWZpZXIpKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gcnY7XG4gIH1cbiAgcHVibGljIGdldFR5cGUobmFtZTogc3RyaW5nKTogVmFyVHlwZSB7XG4gICAgY29uc3QgZW50cnkgPSB0aGlzLl92YXJzLmdldChuYW1lKTtcbiAgICBpZiAoIWVudHJ5KSB7XG4gICAgICByZXR1cm4gVmFyVHlwZS5VTktOT1dOO1xuICAgIH1cbiAgICByZXR1cm4gZW50cnkudHlwZTtcbiAgfVxufVxuXG4vKipcbiAqIFByb3h5U2NvcGUgaXMgbGlrZSBHbG9iYWxTY29wZSwgZXhjZXB0IGFsbCBub24taWRlbnRpZmlhYmxlXG4gKiBwcm9wZXJ0eSB3cml0ZXMgYXJlIHByb3hpZWQgdG8gaXQuIFVzZWQgZm9yIEV2YWwgYW5kIHdpdGgoKVxuICogc3RhdGVtZW50cy5cbiAqL1xuY2xhc3MgUHJveHlTY29wZSBleHRlbmRzIEdsb2JhbFNjb3BlIHtcbiAgcHVibGljIHNob3VsZE1vdmVUbyhuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLnNjb3BlSWRlbnRpZmllcjtcbiAgfVxufVxuXG5jbGFzcyBCbG9ja1Njb3BlIGltcGxlbWVudHMgSVNjb3BlICB7XG4gIC8vIFRoZSBwYXJlbnQgc2NvcGUuIElmIG51bGwsIHJlcHJlc2VudHMgdGhlIGdsb2JhbCBzY29wZS5cbiAgcHVibGljIHJlYWRvbmx5IHBhcmVudDogSVNjb3BlO1xuICBwcm90ZWN0ZWQgX3Njb3BlSWRlbnRpZmllcjogc3RyaW5nO1xuICBwdWJsaWMgcmVhZG9ubHkgaXNGdW5jdGlvblNjb3BlOiBib29sZWFuO1xuICBwcm90ZWN0ZWQgX3ZhcnMgPSBuZXcgTWFwPHN0cmluZywgVmFyaWFibGU+KCk7XG4gIHByb3RlY3RlZCBfY2xvc2VkT3ZlcjogYm9vbGVhbiA9IGZhbHNlO1xuICBwcm90ZWN0ZWQgX2V2YWxGb3VuZCA9IGZhbHNlO1xuXG4gIGNvbnN0cnVjdG9yKHBhcmVudDogSVNjb3BlLCBpc0Z1bmN0aW9uU2NvcGU6IGJvb2xlYW4pIHtcbiAgICB0aGlzLnBhcmVudCA9IHBhcmVudDtcbiAgICB0aGlzLmlzRnVuY3Rpb25TY29wZSA9IGlzRnVuY3Rpb25TY29wZTtcbiAgfVxuXG4gIHB1YmxpYyBmaW5hbGl6ZShnZXRJZDogKCkgPT4gc3RyaW5nKSB7XG4gICAgaWYgKHRoaXMuaGFzQ2xvc2VkT3ZlclZhcmlhYmxlcyAmJiAhdGhpcy5fc2NvcGVJZGVudGlmaWVyKSB7XG4gICAgICB0aGlzLl9zY29wZUlkZW50aWZpZXIgPSBnZXRJZCgpO1xuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBnZXRUeXBlKG5hbWU6IHN0cmluZyk6IFZhclR5cGUge1xuICAgIGNvbnN0IGVudHJ5ID0gdGhpcy5fdmFycy5nZXQobmFtZSk7XG4gICAgaWYgKCFlbnRyeSkge1xuICAgICAgaWYgKHRoaXMucGFyZW50IGluc3RhbmNlb2YgQmxvY2tTY29wZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5wYXJlbnQuZ2V0VHlwZShuYW1lKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBWYXJUeXBlLlVOS05PV047XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBlbnRyeS50eXBlO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHNjb3BlIHRoYXQgd2lsbCBhY3QgYXMgdGhpcyBzY29wZSdzIHBhcmVudFxuICAgKiBpbiB0aGUgZmluYWwgSmF2YVNjcmlwdCBjb2RlLiBXZSBkbyBub3QgZW1pdCBzY29wZXNcbiAgICogd2hvc2UgdmFyaWFibGVzIGFyZSBub3QgY2xvc2VkIG92ZXIuXG4gICAqL1xuICBwcm90ZWN0ZWQgX2dldEVmZmVjdGl2ZVBhcmVudCgpOiBJU2NvcGUge1xuICAgIGxldCBwID0gdGhpcy5wYXJlbnQ7XG4gICAgd2hpbGUgKHAgaW5zdGFuY2VvZiBCbG9ja1Njb3BlICYmICFwLl9jbG9zZWRPdmVyKSB7XG4gICAgICBwID0gcC5wYXJlbnQ7XG4gICAgfVxuICAgIHJldHVybiBwO1xuICB9XG5cbiAgcHVibGljIGRlZmluZVZhcmlhYmxlKG5hbWU6IHN0cmluZywgdHlwZTogVmFyVHlwZSk6IHZvaWQge1xuICAgIGlmICh0eXBlID09PSBWYXJUeXBlLlZBUiAmJiAhdGhpcy5pc0Z1bmN0aW9uU2NvcGUpIHtcbiAgICAgIC8vIFZBUiB0eXBlcyBtdXN0IGJlIGRlZmluZWQgaW4gdGhlIHRvcC1tb3N0IHNjb3BlIG9mIGEgZnVuY3Rpb24uXG4gICAgICByZXR1cm4gdGhpcy5wYXJlbnQuZGVmaW5lVmFyaWFibGUobmFtZSwgdHlwZSk7XG4gICAgfVxuLy8gICAgaWYgKHRoaXMuX3ZhcnMuaGFzKG5hbWUpKSB7XG4gICAgICAvLyBNZXJnZS5cbi8vICAgICAgY29uc29sZS53YXJuKGBVbmlmeWluZyB0d28gdmFyaWFibGVzIG5hbWVkICR7bmFtZX0hYCk7XG4vLyAgICB9XG4gICAgdGhpcy5fdmFycy5zZXQobmFtZSwgbmV3IFZhcmlhYmxlKHR5cGUsIHRoaXMuX2V2YWxGb3VuZCkpO1xuICB9XG5cbiAgcHVibGljIG1heWJlQ2xvc2VPdmVyVmFyaWFibGUobmFtZTogc3RyaW5nKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLl92YXJzLmhhcyhuYW1lKSAmJiB0aGlzLnBhcmVudCAhPT0gbnVsbCkge1xuICAgICAgaWYgKHRoaXMuaXNGdW5jdGlvblNjb3BlICYmIHRoaXMucGFyZW50IGluc3RhbmNlb2YgQmxvY2tTY29wZSkge1xuICAgICAgICAvLyBQYXJlbnQgYmVsb25ncyB0byBhIGRpZmZlcmVudCBmdW5jdGlvbi5cbiAgICAgICAgdGhpcy5wYXJlbnQuX2Nsb3NlT3ZlclZhcmlhYmxlKG5hbWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gUGFyZW50ICpkb2VzIG5vdCogYmVsb25nIHRvIGEgZGlmZmVyZW50IGZ1bmN0aW9uLlxuICAgICAgICB0aGlzLnBhcmVudC5tYXliZUNsb3NlT3ZlclZhcmlhYmxlKG5hbWUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByb3RlY3RlZCBfY2xvc2VPdmVyVmFyaWFibGUobmFtZTogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3QgdiA9IHRoaXMuX3ZhcnMuZ2V0KG5hbWUpO1xuICAgIGlmICh2KSB7XG4gICAgICB2LmNsb3NlZE92ZXIgPSB0cnVlO1xuICAgICAgdGhpcy5fY2xvc2VkT3ZlciA9IHRydWU7XG4gICAgfSBlbHNlIGlmICh0aGlzLnBhcmVudCBpbnN0YW5jZW9mIEJsb2NrU2NvcGUpIHtcbiAgICAgIHRoaXMucGFyZW50Ll9jbG9zZU92ZXJWYXJpYWJsZShuYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gT3RoZXJ3aXNlLCBpdCdzIGEgZ2xvYmFsIHZhcmlhYmxlIVxuICAgICAgdGhpcy5wYXJlbnQubWF5YmVDbG9zZU92ZXJWYXJpYWJsZShuYW1lKTtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgc2hvdWxkTW92ZVRvKG5hbWU6IHN0cmluZyk6IHN0cmluZyB8IG51bGwge1xuICAgIGNvbnN0IHYgPSB0aGlzLl92YXJzLmdldChuYW1lKTtcbiAgICBpZiAodikge1xuICAgICAgaWYgKHYuY2xvc2VkT3Zlcikge1xuICAgICAgICByZXR1cm4gdGhpcy5zY29wZUlkZW50aWZpZXI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMucGFyZW50LnNob3VsZE1vdmVUbyhuYW1lKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2FsbGVkIHdoZW4gYSBjYWxsIHRvIGV2YWwoKSBpcyBsb2NhdGVkLlxuICAgKiBDbG9zZXMgb3ZlciBldmVyeSBzaW5nbGUgdmFyaWFibGUuXG4gICAqL1xuICBwdWJsaWMgZXZhbEZvdW5kKCk6IHZvaWQge1xuICAgIHRoaXMuX2V2YWxGb3VuZCA9IHRydWU7XG4gICAgdGhpcy5fY2xvc2VkT3ZlciA9IHRydWU7XG4gICAgdGhpcy5fdmFycy5mb3JFYWNoKGNsb3NlT3Zlcik7XG4gICAgdGhpcy5wYXJlbnQuZXZhbEZvdW5kKCk7XG4gIH1cblxuICBwdWJsaWMgZ2V0IHNjb3BlSWRlbnRpZmllcigpOiBzdHJpbmcge1xuICAgIGlmICghdGhpcy5oYXNDbG9zZWRPdmVyVmFyaWFibGVzKSB7XG4gICAgICByZXR1cm4gdGhpcy5wYXJlbnQuc2NvcGVJZGVudGlmaWVyO1xuICAgIH1cbiAgICBpZiAodGhpcy5fc2NvcGVJZGVudGlmaWVyID09PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYENhbm5vdCByZXRyaWV2ZSBzY29wZSBpZGVudGlmaWVyIG9mIHVuZmluYWxpemVkIHNjb3BlLmApO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fc2NvcGVJZGVudGlmaWVyO1xuICB9XG5cbiAgcHVibGljIGdldCBoYXNDbG9zZWRPdmVyVmFyaWFibGVzKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9jbG9zZWRPdmVyO1xuICB9XG5cbiAgcHVibGljIGdldFNjb3BlQXNzaWdubWVudHMoKTogRXhwcmVzc2lvblN0YXRlbWVudFtdIHtcbiAgICBjb25zdCBydiA9IG5ldyBBcnJheTxFeHByZXNzaW9uU3RhdGVtZW50PigpO1xuICAgIHRoaXMuX3ZhcnMuZm9yRWFjaCgodiwgbmFtZSkgPT4ge1xuICAgICAgaWYgKHYudHlwZSA9PT0gVmFyVHlwZS5GVU5DVElPTl9ERUNMKSB7XG4gICAgICAgIHJ2LnB1c2goZ2V0U2NvcGVBc3NpZ25tZW50KG5hbWUsIHRoaXMuc2NvcGVJZGVudGlmaWVyKSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHJ2O1xuICB9XG5cbiAgcHVibGljIGdldFNjb3BlQ3JlYXRpb25TdGF0ZW1lbnQoKTogVmFyaWFibGVEZWNsYXJhdGlvbiB7XG4gICAgY29uc3QgcGFyZW50ID0gdGhpcy5fZ2V0RWZmZWN0aXZlUGFyZW50KCk7XG4gICAgY29uc3QgbW92ZWRJZGVudGlmaWVyczogc3RyaW5nW10gPSBbXTtcbiAgICBjb25zdCB1bm1vdmVkSWRlbnRpZmllcnM6IHN0cmluZ1tdID0gW107XG4gICAgY29uc3QgcGFyYW1zOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgdGhpcy5fdmFycy5mb3JFYWNoKCh2LCBuYW1lKSA9PiB7XG4gICAgICBpZiAodi5jbG9zZWRPdmVyKSB7XG4gICAgICAgIHN3aXRjaCAodi50eXBlKSB7XG4gICAgICAgICAgY2FzZSBWYXJUeXBlLkFSRzpcbiAgICAgICAgICAgIHBhcmFtcy5wdXNoKG5hbWUpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBWYXJUeXBlLkNPTlNUOlxuICAgICAgICAgIGNhc2UgVmFyVHlwZS5GVU5DVElPTl9ERUNMOlxuICAgICAgICAgICAgdW5tb3ZlZElkZW50aWZpZXJzLnB1c2gobmFtZSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFZhclR5cGUuTEVUOlxuICAgICAgICAgIGNhc2UgVmFyVHlwZS5WQVI6XG4gICAgICAgICAgICBtb3ZlZElkZW50aWZpZXJzLnB1c2gobmFtZSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IFwiVmFyaWFibGVEZWNsYXJhdGlvblwiLFxuICAgICAgZGVjbGFyYXRpb25zOiBbe1xuICAgICAgICB0eXBlOiBcIlZhcmlhYmxlRGVjbGFyYXRvclwiLFxuICAgICAgICBpZDogeyB0eXBlOiBcIklkZW50aWZpZXJcIiwgbmFtZTogdGhpcy5zY29wZUlkZW50aWZpZXIgfSxcbiAgICAgICAgaW5pdDoge1xuICAgICAgICAgIHR5cGU6IFwiQ2FsbEV4cHJlc3Npb25cIixcbiAgICAgICAgICBjYWxsZWU6IHsgdHlwZTogXCJJZGVudGlmaWVyXCIsIG5hbWU6IFwiJCQkQ1JFQVRFX1NDT1BFX09CSkVDVCQkJFwiIH0sXG4gICAgICAgICAgYXJndW1lbnRzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHR5cGU6IFwiSWRlbnRpZmllclwiLFxuICAgICAgICAgICAgICBuYW1lOiBwYXJlbnQuc2NvcGVJZGVudGlmaWVyXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgIHR5cGU6IFwiQXJyYXlFeHByZXNzaW9uXCIsXG4gICAgICAgICAgICAgIGVsZW1lbnRzOiBnZXRTdHJpbmdMaXRlcmFsQXJyYXkobW92ZWRJZGVudGlmaWVycylcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgdHlwZTogXCJPYmplY3RFeHByZXNzaW9uXCIsXG4gICAgICAgICAgICAgIHByb3BlcnRpZXM6IGdldFNjb3BlUHJvcGVydGllcyh1bm1vdmVkSWRlbnRpZmllcnMpXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgIHR5cGU6IFwiQXJyYXlFeHByZXNzaW9uXCIsXG4gICAgICAgICAgICAgIGVsZW1lbnRzOiBnZXRTdHJpbmdMaXRlcmFsQXJyYXkocGFyYW1zKVxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICB0eXBlOiBcIkFycmF5RXhwcmVzc2lvblwiLFxuICAgICAgICAgICAgICBlbGVtZW50czogZ2V0SWRlbnRpZmllckFycmF5KHBhcmFtcylcbiAgICAgICAgICAgIH1cbiAgICAgICAgICBdXG4gICAgICAgIH1cbiAgICAgIH1dLFxuICAgICAga2luZDogXCJ2YXJcIlxuICAgIH07XG4gIH1cbn1cblxuLyoqXG4gKiBBU1QgdmlzaXRvciB0aGF0IG9ubHkgdmlzaXRzIG5vZGVzIHRoYXQgYXJlIHJlbGV2YW50IHRvIG91ciBwcm9ncmFtIHRyYW5zZm9ybWF0aW9ucy5cbiAqL1xuYWJzdHJhY3QgY2xhc3MgVmlzaXRvciB7XG4gIHByb3RlY3RlZCBfc3RyaWN0TW9kZSA9IGZhbHNlO1xuXG4gIHByb3RlY3RlZCBfaXNTdHJpY3QobjogTm9kZVtdKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIG4ubGVuZ3RoID4gMCAmJiBuWzBdLnR5cGUgPT09IFwiRXhwcmVzc2lvblN0YXRlbWVudFwiICYmICg8YW55PiBuWzBdKVsnZGlyZWN0aXZlJ10gPT09ICd1c2Ugc3RyaWN0JztcbiAgfVxuXG4gIC8qKlxuICAgKiBbSW50ZXJuYWxdIFZpc2l0IGFuIGFycmF5IG9mIG5vZGVzLlxuICAgKiBAcGFyYW0gc3RcbiAgICovXG4gIHB1YmxpYyBOb2RlQXJyYXkoc3Q6IE5vZGVbXSk6IE5vZGVbXSB7XG4gICAgY29uc3QgbGVuID0gc3QubGVuZ3RoO1xuICAgIGxldCBtdWx0aXBsZVN0YXRlbWVudHNFbmNvdW50ZXJlZCA9IGZhbHNlO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIGNvbnN0IHMgPSBzdFtpXTtcbiAgICAgIGNvbnN0IG5ld1MgPSAoPGFueT4gdGhpc1tzLnR5cGVdKShzKTtcbiAgICAgIGlmIChuZXdTID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJHb3QgdW5kZWZpbmVkIHByb2Nlc3NpbmcgdGhlIGZvbGxvd2luZzpcIilcbiAgICAgICAgY29uc29sZS5sb2cocyk7XG4gICAgICB9XG4gICAgICBzdFtpXSA9IG5ld1M7XG4gICAgICBpZiAoKDxhbnk+IHN0W2ldLnR5cGUpID09PSBcIk11bHRpcGxlU3RhdGVtZW50c1wiKSB7XG4gICAgICAgIG11bHRpcGxlU3RhdGVtZW50c0VuY291bnRlcmVkID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAobXVsdGlwbGVTdGF0ZW1lbnRzRW5jb3VudGVyZWQpIHtcbiAgICAgIGxldCBuID0gbmV3IEFycmF5PE5vZGU+KCk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIGNvbnN0IHMgPSBzdFtpXTtcbiAgICAgICAgaWYgKCg8YW55PiBzKS50eXBlID09PSBcIk11bHRpcGxlU3RhdGVtZW50c1wiKSB7XG4gICAgICAgICAgbi5wdXNoKC4uLig8TXVsdGlwbGVTdGF0ZW1lbnRzPiA8YW55PiBzKS5ib2R5KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBuLnB1c2gocyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBuO1xuICAgIH1cblxuICAgIHJldHVybiBzdDtcbiAgfVxuXG4gIHByb3RlY3RlZCBfc2V0U3RyaWN0TW9kZShzdGF0ZW1lbnRzOiBOb2RlW10pOiB2b2lkIHtcbiAgICB0aGlzLl9zdHJpY3RNb2RlID0gdGhpcy5faXNTdHJpY3Qoc3RhdGVtZW50cyk7XG4gIH1cblxuICBwdWJsaWMgUHJvZ3JhbShwOiBQcm9ncmFtKTogUHJvZ3JhbSB7XG4gICAgY29uc3Qgb2xkU3RyaWN0TW9kZSA9IHRoaXMuX3N0cmljdE1vZGU7XG4gICAgdGhpcy5fc2V0U3RyaWN0TW9kZShwLmJvZHkpO1xuICAgIHAuYm9keSA9IDxhbnlbXT4gdGhpcy5Ob2RlQXJyYXkocC5ib2R5KTtcbiAgICB0aGlzLl9zdHJpY3RNb2RlID0gb2xkU3RyaWN0TW9kZTtcbiAgICByZXR1cm4gcDtcbiAgfVxuXG4gIHB1YmxpYyBFbXB0eVN0YXRlbWVudChlOiBFbXB0eVN0YXRlbWVudCk6IEVtcHR5U3RhdGVtZW50IHtcbiAgICByZXR1cm4gZTtcbiAgfVxuXG4gIHB1YmxpYyBCbG9ja1N0YXRlbWVudChiOiBCbG9ja1N0YXRlbWVudCk6IEJsb2NrU3RhdGVtZW50IHtcbiAgICBiLmJvZHkgPSA8YW55W10+IHRoaXMuTm9kZUFycmF5KGIuYm9keSk7XG4gICAgcmV0dXJuIGI7XG4gIH1cblxuICBwdWJsaWMgRXhwcmVzc2lvblN0YXRlbWVudChlczogRXhwcmVzc2lvblN0YXRlbWVudCk6IEV4cHJlc3Npb25TdGF0ZW1lbnQge1xuICAgIGNvbnN0IGV4cCA9IGVzLmV4cHJlc3Npb247XG4gICAgZXMuZXhwcmVzc2lvbiA9ICg8YW55PiB0aGlzW2V4cC50eXBlXSkoZXhwKTtcbiAgICByZXR1cm4gZXM7XG4gIH1cblxuICBwdWJsaWMgSWZTdGF0ZW1lbnQoaXM6IElmU3RhdGVtZW50KTogSWZTdGF0ZW1lbnQge1xuICAgIGNvbnN0IHRlc3QgPSBpcy50ZXN0O1xuICAgIGlzLnRlc3QgPSAoPGFueT4gdGhpc1t0ZXN0LnR5cGVdKSh0ZXN0KTtcbiAgICBjb25zdCBjb25zID0gaXMuY29uc2VxdWVudDtcbiAgICBpcy5jb25zZXF1ZW50ID0gKDxhbnk+IHRoaXNbY29ucy50eXBlXSkoY29ucyk7XG4gICAgY29uc3QgYWx0ID0gaXMuYWx0ZXJuYXRlO1xuICAgIGlmIChhbHQpIHtcbiAgICAgIGlzLmFsdGVybmF0ZSA9ICg8YW55PiB0aGlzW2FsdC50eXBlXSkoYWx0KTtcbiAgICB9XG4gICAgcmV0dXJuIGlzO1xuICB9XG5cbiAgcHVibGljIExhYmVsZWRTdGF0ZW1lbnQobHM6IExhYmVsZWRTdGF0ZW1lbnQpOiBMYWJlbGVkU3RhdGVtZW50IHwgTXVsdGlwbGVTdGF0ZW1lbnRzIHtcbiAgICBjb25zdCBib2R5ID0gbHMuYm9keTtcbiAgICBjb25zdCBuZXdCb2R5ID0gKDxhbnk+IHRoaXNbYm9keS50eXBlXSkoYm9keSk7XG4gICAgaWYgKG5ld0JvZHkudHlwZSA9PT0gXCJNdWx0aXBsZVN0YXRlbWVudHNcIikge1xuICAgICAgY29uc3QgbXM6IE11bHRpcGxlU3RhdGVtZW50cyA9IG5ld0JvZHk7XG4gICAgICAvLyBBcHBseSBsYWJlbCB0byBmaXJzdCBhcHBsaWNhYmxlIHN0YXRlbWVudC5cbiAgICAgIGNvbnN0IHN0bXRzID0gbXMuYm9keTtcbiAgICAgIGxldCBmb3VuZCA9IGZhbHNlO1xuICAgICAgZm9yTG9vcDpcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc3RtdHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3Qgc3RtdCA9IHN0bXRzW2ldO1xuICAgICAgICBzd2l0Y2ggKHN0bXQudHlwZSkge1xuICAgICAgICAgIGNhc2UgXCJEb1doaWxlU3RhdGVtZW50XCI6XG4gICAgICAgICAgY2FzZSBcIldoaWxlU3RhdGVtZW50XCI6XG4gICAgICAgICAgY2FzZSBcIkZvclN0YXRlbWVudFwiOlxuICAgICAgICAgIGNhc2UgXCJGb3JPZlN0YXRlbWVudFwiOlxuICAgICAgICAgIGNhc2UgXCJGb3JJblN0YXRlbWVudFwiOlxuICAgICAgICAgIGNhc2UgXCJTd2l0Y2hTdGF0ZW1lbnRcIjpcbiAgICAgICAgICAgIGxzLmJvZHkgPSBzdG10O1xuICAgICAgICAgICAgc3RtdHNbaV0gPSBscztcbiAgICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgIGJyZWFrIGZvckxvb3A7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmICghZm91bmQpIHtcbiAgICAgICAgY29uc29sZS53YXJuKGBVbmFibGUgdG8gZmluZCBsb29wIHRvIHJlLWF0dGFjaCBsYWJlbCB0by4gQXR0YWNoaW5nIHRvIGxhc3Qgc3RhdGVtZW50LmApO1xuICAgICAgICBscy5ib2R5ID0gc3RtdHNbc3RtdHMubGVuZ3RoIC0gMV07XG4gICAgICAgIHN0bXRzW3N0bXRzLmxlbmd0aCAtIDFdID0gbHM7XG4gICAgICB9XG4gICAgICByZXR1cm4gbXM7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxzLmJvZHkgPSBuZXdCb2R5O1xuICAgICAgcmV0dXJuIGxzO1xuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBCcmVha1N0YXRlbWVudChiczogQnJlYWtTdGF0ZW1lbnQpOiBCcmVha1N0YXRlbWVudCB7XG4gICAgcmV0dXJuIGJzO1xuICB9XG5cbiAgcHVibGljIENvbnRpbnVlU3RhdGVtZW50KGNzOiBDb250aW51ZVN0YXRlbWVudCk6IENvbnRpbnVlU3RhdGVtZW50IHtcbiAgICByZXR1cm4gY3M7XG4gIH1cblxuICBwdWJsaWMgV2l0aFN0YXRlbWVudCh3czogV2l0aFN0YXRlbWVudCk6IFdpdGhTdGF0ZW1lbnQgfCBCbG9ja1N0YXRlbWVudCB7XG4gICAgd3Mub2JqZWN0ID0gKDxhbnk+IHRoaXNbd3Mub2JqZWN0LnR5cGVdKSh3cy5vYmplY3QpO1xuICAgIHdzLmJvZHkgPSAoPGFueT4gdGhpc1t3cy5ib2R5LnR5cGVdKSh3cy5ib2R5KTtcbiAgICByZXR1cm4gd3M7XG4gIH1cblxuICBwdWJsaWMgU3dpdGNoU3RhdGVtZW50KHNzOiBTd2l0Y2hTdGF0ZW1lbnQpOiBTd2l0Y2hTdGF0ZW1lbnQge1xuICAgIGNvbnN0IGRpc2MgPSBzcy5kaXNjcmltaW5hbnQ7XG4gICAgc3MuZGlzY3JpbWluYW50ID0gKDxhbnk+IHRoaXNbZGlzYy50eXBlXSkoZGlzYyk7XG4gICAgY29uc3QgY2FzZXMgPSBzcy5jYXNlcztcbiAgICBjb25zdCBsZW4gPSBjYXNlcy5sZW5ndGg7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgY29uc3QgYyA9IGNhc2VzW2ldO1xuICAgICAgY2FzZXNbaV0gPSAoPGFueT4gdGhpc1tjLnR5cGVdKShjKTtcbiAgICB9XG4gICAgcmV0dXJuIHNzO1xuICB9XG5cbiAgcHVibGljIFJldHVyblN0YXRlbWVudChyczogUmV0dXJuU3RhdGVtZW50KTogUmV0dXJuU3RhdGVtZW50IHtcbiAgICBjb25zdCBhcmcgPSBycy5hcmd1bWVudDtcbiAgICBpZiAoYXJnKSB7XG4gICAgICBycy5hcmd1bWVudCA9ICg8YW55PiB0aGlzW2FyZy50eXBlXSkoYXJnKTtcbiAgICB9XG4gICAgcmV0dXJuIHJzO1xuICB9XG5cbiAgcHVibGljIFRocm93U3RhdGVtZW50KHRzOiBUaHJvd1N0YXRlbWVudCk6IFRocm93U3RhdGVtZW50IHtcbiAgICBjb25zdCBhcmcgPSB0cy5hcmd1bWVudDtcbiAgICB0cy5hcmd1bWVudCA9ICg8YW55PiB0aGlzW2FyZy50eXBlXSkoYXJnKTtcbiAgICByZXR1cm4gdHM7XG4gIH1cblxuICBwdWJsaWMgVHJ5U3RhdGVtZW50KHRzOiBUcnlTdGF0ZW1lbnQpOiBUcnlTdGF0ZW1lbnQge1xuICAgIHRzLmJsb2NrID0gdGhpcy5CbG9ja1N0YXRlbWVudCh0cy5ibG9jayk7XG4gICAgaWYgKHRzLmZpbmFsaXplcikge1xuICAgICAgdHMuZmluYWxpemVyID0gdGhpcy5CbG9ja1N0YXRlbWVudCh0cy5maW5hbGl6ZXIpO1xuICAgIH1cbiAgICBpZiAodHMuaGFuZGxlcikge1xuICAgICAgdHMuaGFuZGxlciA9IHRoaXMuQ2F0Y2hDbGF1c2UodHMuaGFuZGxlcik7XG4gICAgfVxuICAgIHJldHVybiB0cztcbiAgfVxuXG4gIHByb3RlY3RlZCBfV2hpbGVPckRvV2hpbGVTdGF0ZW1lbnQobjogRG9XaGlsZVN0YXRlbWVudCk6IERvV2hpbGVTdGF0ZW1lbnQ7XG4gIHByb3RlY3RlZCBfV2hpbGVPckRvV2hpbGVTdGF0ZW1lbnQobjogV2hpbGVTdGF0ZW1lbnQpOiBXaGlsZVN0YXRlbWVudDtcbiAgcHJvdGVjdGVkIF9XaGlsZU9yRG9XaGlsZVN0YXRlbWVudChuOiBXaGlsZVN0YXRlbWVudCB8IERvV2hpbGVTdGF0ZW1lbnQpOiBXaGlsZVN0YXRlbWVudCB8IERvV2hpbGVTdGF0ZW1lbnQge1xuICAgIGNvbnN0IHRlc3QgPSBuLnRlc3Q7XG4gICAgbi50ZXN0ID0gKDxhbnk+IHRoaXNbdGVzdC50eXBlXSkodGVzdCk7XG4gICAgY29uc3QgYm9keSA9IG4uYm9keTtcbiAgICBuLmJvZHkgPSAoPGFueT4gdGhpc1tib2R5LnR5cGVdKShib2R5KTtcbiAgICByZXR1cm4gbjtcbiAgfVxuXG4gIHB1YmxpYyBXaGlsZVN0YXRlbWVudChuOiBXaGlsZVN0YXRlbWVudCk6IFdoaWxlU3RhdGVtZW50IHtcbiAgICByZXR1cm4gdGhpcy5fV2hpbGVPckRvV2hpbGVTdGF0ZW1lbnQobik7XG4gIH1cblxuICBwdWJsaWMgRG9XaGlsZVN0YXRlbWVudChuOiBEb1doaWxlU3RhdGVtZW50KTogRG9XaGlsZVN0YXRlbWVudCB7XG4gICAgcmV0dXJuIHRoaXMuX1doaWxlT3JEb1doaWxlU3RhdGVtZW50KG4pO1xuICB9XG5cbiAgcHVibGljIEZvclN0YXRlbWVudChuOiBGb3JTdGF0ZW1lbnQpOiBGb3JTdGF0ZW1lbnQgfCBNdWx0aXBsZVN0YXRlbWVudHMge1xuICAgIGNvbnN0IHRlc3QgPSBuLnRlc3Q7XG4gICAgaWYgKHRlc3QpIHtcbiAgICAgIG4udGVzdCA9ICg8YW55PiB0aGlzW3Rlc3QudHlwZV0pKHRlc3QpO1xuICAgIH1cbiAgICBjb25zdCBib2R5ID0gbi5ib2R5O1xuICAgIG4uYm9keSA9ICg8YW55PiB0aGlzW2JvZHkudHlwZV0pKGJvZHkpO1xuICAgIGNvbnN0IGluaXQgPSBuLmluaXQ7XG4gICAgaWYgKGluaXQpIHtcbiAgICAgIG4uaW5pdCA9ICg8YW55PiB0aGlzW2luaXQudHlwZV0pKGluaXQpO1xuICAgIH1cbiAgICBjb25zdCB1cGRhdGUgPSBuLnVwZGF0ZTtcbiAgICBpZiAodXBkYXRlKSB7XG4gICAgICBuLnVwZGF0ZSA9ICg8YW55PiB0aGlzW3VwZGF0ZS50eXBlXSkodXBkYXRlKTtcbiAgICB9XG4gICAgcmV0dXJuIG47XG4gIH1cblxuICBwcm90ZWN0ZWQgX0ZvckluQW5kT2ZTdGF0ZW1lbnQobjogRm9ySW5TdGF0ZW1lbnQpOiBGb3JJblN0YXRlbWVudDtcbiAgcHJvdGVjdGVkIF9Gb3JJbkFuZE9mU3RhdGVtZW50KG46IEZvck9mU3RhdGVtZW50KTogRm9yT2ZTdGF0ZW1lbnQ7XG4gIHByb3RlY3RlZCBfRm9ySW5BbmRPZlN0YXRlbWVudChuOiBGb3JJblN0YXRlbWVudCB8IEZvck9mU3RhdGVtZW50KTogRm9ySW5TdGF0ZW1lbnQgfCBGb3JPZlN0YXRlbWVudCB7XG4gICAgY29uc3QgbGVmdCA9IG4ubGVmdDtcbiAgICBuLmxlZnQgPSAoPGFueT4gdGhpc1tsZWZ0LnR5cGVdKShsZWZ0KTtcbiAgICBjb25zdCByaWdodCA9IG4ucmlnaHQ7XG4gICAgbi5yaWdodCA9ICg8YW55PiB0aGlzW3JpZ2h0LnR5cGVdKShyaWdodCk7XG4gICAgY29uc3QgYm9keSA9IG4uYm9keTtcbiAgICBuLmJvZHkgPSAoPGFueT4gdGhpc1tib2R5LnR5cGVdKShib2R5KTtcbiAgICByZXR1cm4gbjtcbiAgfVxuXG4gIHB1YmxpYyBGb3JJblN0YXRlbWVudChuOiBGb3JJblN0YXRlbWVudCk6IEZvckluU3RhdGVtZW50IHtcbiAgICByZXR1cm4gdGhpcy5fRm9ySW5BbmRPZlN0YXRlbWVudChuKTtcbiAgfVxuXG4gIHB1YmxpYyBGb3JPZlN0YXRlbWVudChuOiBGb3JPZlN0YXRlbWVudCk6IEZvck9mU3RhdGVtZW50IHtcbiAgICByZXR1cm4gdGhpcy5fRm9ySW5BbmRPZlN0YXRlbWVudChuKTtcbiAgfVxuXG4gIHB1YmxpYyBEZWJ1Z2dlclN0YXRlbWVudChuOiBEZWJ1Z2dlclN0YXRlbWVudCk6IERlYnVnZ2VyU3RhdGVtZW50IHtcbiAgICByZXR1cm4gbjtcbiAgfVxuXG4gIHByb3RlY3RlZCBfRnVuY3Rpb24objogRnVuY3Rpb25FeHByZXNzaW9uKTogRnVuY3Rpb25FeHByZXNzaW9uO1xuICBwcm90ZWN0ZWQgX0Z1bmN0aW9uKG46IEZ1bmN0aW9uRGVjbGFyYXRpb24pOiBGdW5jdGlvbkRlY2xhcmF0aW9uO1xuICBwcm90ZWN0ZWQgX0Z1bmN0aW9uKG46IEZ1bmN0aW9uRGVjbGFyYXRpb24gfCBGdW5jdGlvbkV4cHJlc3Npb24pOiBGdW5jdGlvbkRlY2xhcmF0aW9uIHwgRnVuY3Rpb25FeHByZXNzaW9uIHtcbiAgICBjb25zdCBvbGRTdHJpY3RNb2RlID0gdGhpcy5fc3RyaWN0TW9kZTtcbiAgICBpZiAobi5hc3luYykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBBc3luYyBmdW5jdGlvbnMgYXJlIG5vdCB5ZXQgc3VwcG9ydGVkLmApO1xuICAgIH1cbiAgICBpZiAobi5nZW5lcmF0b3IpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgR2VuZXJhdG9ycyBhcmUgbm90IHlldCBzdXBwb3J0ZWQuYCk7XG4gICAgfVxuICAgIHRoaXMuX3NldFN0cmljdE1vZGUobi5ib2R5LmJvZHkpO1xuICAgIG4uYm9keSA9IHRoaXMuQmxvY2tTdGF0ZW1lbnQobi5ib2R5KTtcbiAgICB0aGlzLl9zdHJpY3RNb2RlID0gb2xkU3RyaWN0TW9kZTtcbiAgICByZXR1cm4gbjtcbiAgfVxuXG4gIHB1YmxpYyBGdW5jdGlvbkRlY2xhcmF0aW9uKG46IEZ1bmN0aW9uRGVjbGFyYXRpb24pOiBGdW5jdGlvbkRlY2xhcmF0aW9uIHwgVmFyaWFibGVEZWNsYXJhdGlvbiB7XG4gICAgcmV0dXJuIHRoaXMuX0Z1bmN0aW9uKG4pO1xuICB9XG5cbiAgcHVibGljIEZ1bmN0aW9uRXhwcmVzc2lvbihuOiBGdW5jdGlvbkV4cHJlc3Npb24pOiBGdW5jdGlvbkV4cHJlc3Npb24gfCBDYWxsRXhwcmVzc2lvbiB7XG4gICAgcmV0dXJuIHRoaXMuX0Z1bmN0aW9uKG4pO1xuICB9XG5cbiAgcHVibGljIFZhcmlhYmxlRGVjbGFyYXRpb24objogVmFyaWFibGVEZWNsYXJhdGlvbik6IFZhcmlhYmxlRGVjbGFyYXRpb24gfCBNdWx0aXBsZVN0YXRlbWVudHMgfCBFeHByZXNzaW9uU3RhdGVtZW50IHtcbiAgICBjb25zdCBkZWNscyA9IG4uZGVjbGFyYXRpb25zO1xuICAgIGNvbnN0IGxlbiA9IGRlY2xzLmxlbmd0aDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICBkZWNsc1tpXSA9IDxWYXJpYWJsZURlY2xhcmF0b3I+IHRoaXMuVmFyaWFibGVEZWNsYXJhdG9yKGRlY2xzW2ldKTtcbiAgICB9XG4gICAgcmV0dXJuIG47XG4gIH1cblxuICBwdWJsaWMgVmFyaWFibGVEZWNsYXJhdG9yKG46IFZhcmlhYmxlRGVjbGFyYXRvcik6IFZhcmlhYmxlRGVjbGFyYXRvciB8IE1lbWJlckV4cHJlc3Npb24gfCBFeHByZXNzaW9uU3RhdGVtZW50IHtcbiAgICBjb25zdCBpbml0ID0gbi5pbml0O1xuICAgIGlmIChpbml0KSB7XG4gICAgICBuLmluaXQgPSAoPGFueT4gdGhpc1tpbml0LnR5cGVdKShpbml0KTtcbiAgICB9XG4gICAgcmV0dXJuIG47XG4gIH1cblxuICBwdWJsaWMgVGhpc0V4cHJlc3Npb24objogVGhpc0V4cHJlc3Npb24pOiBUaGlzRXhwcmVzc2lvbiB7XG4gICAgcmV0dXJuIG47XG4gIH1cblxuICBwdWJsaWMgQXJyYXlFeHByZXNzaW9uKG46IEFycmF5RXhwcmVzc2lvbik6IEFycmF5RXhwcmVzc2lvbiB7XG4gICAgY29uc3QgZWxlbWVudHMgPSBuLmVsZW1lbnRzO1xuICAgIGNvbnN0IGxlbiA9IGVsZW1lbnRzLmxlbmd0aDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICBjb25zdCBlID0gZWxlbWVudHNbaV07XG4gICAgICAvLyBQb3NzaWJsZSBmb3IgdGhpcyB0byBiZSBudWxsLCBhcyBpbjpcbiAgICAgIC8vIHZhciBhID0gWywxLDJdO1xuICAgICAgaWYgKGUgIT09IG51bGwpIHtcbiAgICAgICAgZWxlbWVudHNbaV0gPSAoPGFueT4gdGhpc1tlLnR5cGVdKShlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG47XG4gIH1cblxuICBwdWJsaWMgT2JqZWN0RXhwcmVzc2lvbihuOiBPYmplY3RFeHByZXNzaW9uKTogT2JqZWN0RXhwcmVzc2lvbiB8IENhbGxFeHByZXNzaW9uIHtcbiAgICBjb25zdCBwcm9wcyA9IG4ucHJvcGVydGllcztcbiAgICBjb25zdCBsZW4gPSBwcm9wcy5sZW5ndGg7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgY29uc3QgcHJvcCA9IHByb3BzW2ldO1xuICAgICAgcHJvcHNbaV0gPSB0aGlzLlByb3BlcnR5KHByb3ApO1xuICAgIH1cbiAgICByZXR1cm4gbjtcbiAgfVxuXG4gIHB1YmxpYyBQcm9wZXJ0eShuOiBQcm9wZXJ0eSk6IFByb3BlcnR5IHtcbiAgICBzd2l0Y2ggKG4ua2luZCkge1xuICAgICAgY2FzZSBcImluaXRcIjoge1xuICAgICAgICBjb25zdCB2YWwgPSBuLnZhbHVlO1xuICAgICAgICBuLnZhbHVlID0gKDxhbnk+IHRoaXNbdmFsLnR5cGVdKSh2YWwpO1xuICAgICAgICByZXR1cm4gbjtcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJzZXRcIjpcbiAgICAgIGNhc2UgXCJnZXRcIjoge1xuICAgICAgICBjb25zdCBib2R5ID0gbi52YWx1ZTtcbiAgICAgICAgaWYgKGJvZHkudHlwZSAhPT0gXCJGdW5jdGlvbkV4cHJlc3Npb25cIikge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5leHBlY3RlZCBnZXR0ZXIvc2V0dGVyIGJvZHkgb2YgdHlwZSAke2JvZHkudHlwZX0hYCk7XG4gICAgICAgIH1cbiAgICAgICAgbi52YWx1ZSA9IHRoaXMuRnVuY3Rpb25FeHByZXNzaW9uKGJvZHkpO1xuICAgICAgICByZXR1cm4gbjtcbiAgICAgIH1cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgUHJvcGVydHkgb2Yga2luZCAke24ua2luZH0gbm90IHlldCBzdXBwb3J0ZWQuYCk7XG4gICAgfVxuICB9XG5cbiAgcHVibGljIFNlcXVlbmNlRXhwcmVzc2lvbihuOiBTZXF1ZW5jZUV4cHJlc3Npb24pOiBTZXF1ZW5jZUV4cHJlc3Npb24ge1xuICAgIG4uZXhwcmVzc2lvbnMgPSA8YW55W10+IHRoaXMuTm9kZUFycmF5KG4uZXhwcmVzc2lvbnMpO1xuICAgIHJldHVybiBuO1xuICB9XG5cbiAgcHVibGljIFVuYXJ5RXhwcmVzc2lvbihuOiBVbmFyeUV4cHJlc3Npb24pOiBVbmFyeUV4cHJlc3Npb24ge1xuICAgIGNvbnN0IGFyZyA9IG4uYXJndW1lbnQ7XG4gICAgbi5hcmd1bWVudCA9ICg8YW55PiB0aGlzW2FyZy50eXBlXSkoYXJnKTtcbiAgICByZXR1cm4gbjtcbiAgfVxuXG4gIHB1YmxpYyBCaW5hcnlFeHByZXNzaW9uKG46IEJpbmFyeUV4cHJlc3Npb24pOiBCaW5hcnlFeHByZXNzaW9uIHwgVW5hcnlFeHByZXNzaW9uIHwgQ2FsbEV4cHJlc3Npb24ge1xuICAgIGNvbnN0IGxlZnQgPSBuLmxlZnQ7XG4gICAgbi5sZWZ0ID0gKDxhbnk+IHRoaXNbbGVmdC50eXBlXSkobGVmdCk7XG4gICAgY29uc3QgcmlnaHQgPSBuLnJpZ2h0O1xuICAgIG4ucmlnaHQgPSAoPGFueT4gdGhpc1tyaWdodC50eXBlXSkocmlnaHQpO1xuICAgIHJldHVybiBuO1xuICB9XG5cbiAgcHVibGljIEFzc2lnbm1lbnRFeHByZXNzaW9uKG46IEFzc2lnbm1lbnRFeHByZXNzaW9uKTogQXNzaWdubWVudEV4cHJlc3Npb24ge1xuICAgIGNvbnN0IGxlZnQgPSBuLmxlZnQ7XG4gICAgbi5sZWZ0ID0gKDxhbnk+IHRoaXNbbGVmdC50eXBlXSkobGVmdCk7XG4gICAgY29uc3QgcmlnaHQgPSBuLnJpZ2h0O1xuICAgIG4ucmlnaHQgPSAoPGFueT4gdGhpc1tyaWdodC50eXBlXSkocmlnaHQpO1xuICAgIHJldHVybiBuO1xuICB9XG5cbiAgcHVibGljIFVwZGF0ZUV4cHJlc3Npb24objogVXBkYXRlRXhwcmVzc2lvbik6IFVwZGF0ZUV4cHJlc3Npb24ge1xuICAgIGNvbnN0IGFyZyA9IG4uYXJndW1lbnQ7XG4gICAgbi5hcmd1bWVudCA9ICg8YW55PiB0aGlzW2FyZy50eXBlXSkoYXJnKTtcbiAgICByZXR1cm4gbjtcbiAgfVxuXG4gIHB1YmxpYyBMb2dpY2FsRXhwcmVzc2lvbihuOiBMb2dpY2FsRXhwcmVzc2lvbik6IExvZ2ljYWxFeHByZXNzaW9uIHtcbiAgICBjb25zdCBsZWZ0ID0gbi5sZWZ0O1xuICAgIG4ubGVmdCA9ICg8YW55PiB0aGlzW2xlZnQudHlwZV0pKGxlZnQpO1xuICAgIGNvbnN0IHJpZ2h0ID0gbi5yaWdodDtcbiAgICBuLnJpZ2h0ID0gKDxhbnk+IHRoaXNbcmlnaHQudHlwZV0pKHJpZ2h0KTtcbiAgICByZXR1cm4gbjtcbiAgfVxuXG4gIHB1YmxpYyBDb25kaXRpb25hbEV4cHJlc3Npb24objogQ29uZGl0aW9uYWxFeHByZXNzaW9uKTogQ29uZGl0aW9uYWxFeHByZXNzaW9uIHtcbiAgICBjb25zdCBhbHQgPSBuLmFsdGVybmF0ZTtcbiAgICBuLmFsdGVybmF0ZSA9ICg8YW55PiB0aGlzW2FsdC50eXBlXSkoYWx0KTtcbiAgICBjb25zdCBjb25zID0gbi5jb25zZXF1ZW50O1xuICAgIG4uY29uc2VxdWVudCA9ICg8YW55PiB0aGlzW2NvbnMudHlwZV0pKGNvbnMpO1xuICAgIGNvbnN0IHRlc3QgPSBuLnRlc3Q7XG4gICAgbi50ZXN0ID0gKDxhbnk+IHRoaXNbdGVzdC50eXBlXSkodGVzdCk7XG4gICAgcmV0dXJuIG47XG4gIH1cblxuICBwdWJsaWMgQ2FsbEV4cHJlc3Npb24objogQ2FsbEV4cHJlc3Npb24pOiBDYWxsRXhwcmVzc2lvbiB7XG4gICAgY29uc3QgY2FsbGVlID0gbi5jYWxsZWU7XG4gICAgbi5jYWxsZWUgPSAoPGFueT4gdGhpc1tjYWxsZWUudHlwZV0pKGNhbGxlZSk7XG4gICAgY29uc3QgYXJncyA9IG4uYXJndW1lbnRzO1xuICAgIGNvbnN0IGxlbiA9IGFyZ3MubGVuZ3RoO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIGNvbnN0IGFyZyA9IGFyZ3NbaV07XG4gICAgICBhcmdzW2ldID0gKDxhbnk+IHRoaXNbYXJnLnR5cGVdKShhcmcpO1xuICAgIH1cbiAgICByZXR1cm4gbjtcbiAgfVxuXG4gIHB1YmxpYyBOZXdFeHByZXNzaW9uKG46IE5ld0V4cHJlc3Npb24pOiBOZXdFeHByZXNzaW9uIHtcbiAgICBjb25zdCBjYWxsZWUgPSBuLmNhbGxlZTtcbiAgICBuLmNhbGxlZSA9ICg8YW55PiB0aGlzW2NhbGxlZS50eXBlXSkoY2FsbGVlKTtcbiAgICBjb25zdCBhcmdzID0gbi5hcmd1bWVudHM7XG4gICAgY29uc3QgbGVuID0gYXJncy5sZW5ndGg7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgY29uc3QgYXJnID0gYXJnc1tpXTtcbiAgICAgIGFyZ3NbaV0gPSAoPGFueT4gdGhpc1thcmcudHlwZV0pKGFyZyk7XG4gICAgfVxuICAgIHJldHVybiBuO1xuICB9XG5cbiAgcHVibGljIE1lbWJlckV4cHJlc3Npb24objogTWVtYmVyRXhwcmVzc2lvbik6IE1lbWJlckV4cHJlc3Npb24ge1xuICAgIC8vIFJld3JpdGUgb2JqZWN0LCB0aGUgdGFyZ2V0IG9mIHRoZSBtZW1iZXIgZXhwcmVzc2lvbi5cbiAgICAvLyBMZWF2ZSB0aGUgcHJvcGVydHkgbmFtZSBhbG9uZS5cbiAgICBpZiAobi5jb21wdXRlZCkge1xuICAgICAgbi5wcm9wZXJ0eSA9ICg8YW55PiB0aGlzW24ucHJvcGVydHkudHlwZV0pKG4ucHJvcGVydHkpO1xuICAgIH1cbiAgICBjb25zdCBvYmogPSBuLm9iamVjdDtcbiAgICBuLm9iamVjdCA9ICg8YW55PiB0aGlzW29iai50eXBlXSkob2JqKTtcbiAgICByZXR1cm4gbjtcbiAgfVxuXG4gIHB1YmxpYyBTd2l0Y2hDYXNlKG46IFN3aXRjaENhc2UpOiBTd2l0Y2hDYXNlIHtcbiAgICBjb25zdCB0ZXN0ID0gbi50ZXN0O1xuICAgIGlmICh0ZXN0KSB7XG4gICAgICBuLnRlc3QgPSAoPGFueT4gdGhpc1t0ZXN0LnR5cGVdKSh0ZXN0KTtcbiAgICB9XG4gICAgbi5jb25zZXF1ZW50ID0gPGFueVtdPiB0aGlzLk5vZGVBcnJheShuLmNvbnNlcXVlbnQpO1xuICAgIHJldHVybiBuO1xuICB9XG5cbiAgcHVibGljIENhdGNoQ2xhdXNlKG46IENhdGNoQ2xhdXNlKTogQ2F0Y2hDbGF1c2Uge1xuICAgIG4uYm9keSA9IHRoaXMuQmxvY2tTdGF0ZW1lbnQobi5ib2R5KTtcbiAgICByZXR1cm4gbjtcbiAgfVxuXG4gIHB1YmxpYyBJZGVudGlmaWVyKG46IElkZW50aWZpZXIpOiBJZGVudGlmaWVyIHwgTWVtYmVyRXhwcmVzc2lvbiB7XG4gICAgcmV0dXJuIG47XG4gIH1cblxuICBwdWJsaWMgTGl0ZXJhbChuOiBMaXRlcmFsKTogTGl0ZXJhbCB7XG4gICAgcmV0dXJuIG47XG4gIH1cblxuICBwdWJsaWMgU3VwZXIobjogU3VwZXIpOiBTdXBlciB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBTdXBlciBpcyBub3QgeWV0IHN1cHBvcnRlZC5gKTtcbiAgfVxuXG4gIHB1YmxpYyBTcHJlYWRFbGVtZW50KG46IFNwcmVhZEVsZW1lbnQpOiBTcHJlYWRFbGVtZW50IHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYFNwcmVhZEVsZW1lbnQgaXMgbm90IHlldCBzdXBwb3J0ZWQuYCk7XG4gIH1cblxuICBwdWJsaWMgQXJyb3dGdW5jdGlvbkV4cHJlc3Npb24objogQXJyb3dGdW5jdGlvbkV4cHJlc3Npb24pOiBBcnJvd0Z1bmN0aW9uRXhwcmVzc2lvbiB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBBcnJvd0Z1bmN0aW9uRXhwcmVzc2lvbiBpcyBub3QgeWV0IHN1cHBvcnRlZC5gKTtcbiAgfVxuXG4gIHB1YmxpYyBZaWVsZEV4cHJlc3Npb24objogWWllbGRFeHByZXNzaW9uKTogWWllbGRFeHByZXNzaW9uIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYFlpZWxkRXhwcmVzc2lvbiBpcyBub3QgeWV0IHN1cHBvcnRlZC5gKTtcbiAgfVxuXG4gIHB1YmxpYyBUZW1wbGF0ZUxpdGVyYWwobjogVGVtcGxhdGVMaXRlcmFsKTogVGVtcGxhdGVMaXRlcmFsIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYFRlbXBsYXRlTGl0ZXJhbCBpcyBub3QgeWV0IHN1cHBvcnRlZC5gKTtcbiAgfVxuXG4gIHB1YmxpYyBUYWdnZWRUZW1wbGF0ZUV4cHJlc3Npb24objogVGFnZ2VkVGVtcGxhdGVFeHByZXNzaW9uKTogVGFnZ2VkVGVtcGxhdGVFeHByZXNzaW9uIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYFRhZ2dlZFRlbXBsYXRlRXhwcmVzc2lvbiBpcyBub3QgeWV0IHN1cHBvcnRlZC5gKTtcbiAgfVxuXG4gIHB1YmxpYyBUZW1wbGF0ZUVsZW1lbnQobjogVGVtcGxhdGVFbGVtZW50KTogVGVtcGxhdGVFbGVtZW50IHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYFRlbXBsYXRlRWxlbWVudCBpcyBub3QgeWV0IHN1cHBvcnRlZC5gKTtcbiAgfVxuXG4gIHB1YmxpYyBPYmplY3RQYXR0ZXJuKG46IE9iamVjdFBhdHRlcm4pOiBPYmplY3RQYXR0ZXJuIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYE9iamVjdFBhdHRlcm4gaXMgbm90IHlldCBzdXBwb3J0ZWQuYCk7XG4gIH1cblxuICBwdWJsaWMgQXJyYXlQYXR0ZXJuKG46IEFycmF5UGF0dGVybik6IEFycmF5UGF0dGVybiB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBBcnJheVBhdHRlcm4gaXMgbm90IHlldCBzdXBwb3J0ZWQuYCk7XG4gIH1cblxuICBwdWJsaWMgUmVzdEVsZW1lbnQobjogUmVzdEVsZW1lbnQpOiBSZXN0RWxlbWVudCB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBSZXN0RWxlbWVudCBpcyBub3QgeWV0IHN1cHBvcnRlZC5gKTtcbiAgfVxuXG4gIHB1YmxpYyBBc3NpZ25tZW50UGF0dGVybihuOiBBc3NpZ25tZW50UGF0dGVybik6IEFzc2lnbm1lbnRQYXR0ZXJuIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEFzc2lnbm1lbnRQYXR0ZXJuIGlzIG5vdCB5ZXQgc3VwcG9ydGVkLmApO1xuICB9XG5cbiAgcHVibGljIENsYXNzQm9keShuOiBDbGFzc0JvZHkpOiBDbGFzc0JvZHkge1xuICAgIHRocm93IG5ldyBFcnJvcihgQ2xhc3NCb2R5IGlzIG5vdCB5ZXQgc3VwcG9ydGVkLmApO1xuICB9XG5cbiAgcHVibGljIE1ldGhvZERlZmluaXRpb24objogTWV0aG9kRGVmaW5pdGlvbik6IE1ldGhvZERlZmluaXRpb24ge1xuICAgIHRocm93IG5ldyBFcnJvcihgTWV0aG9kRGVmaW5pdGlvbiBpcyBub3QgeWV0IHN1cHBvcnRlZC5gKTtcbiAgfVxuXG4gIHB1YmxpYyBDbGFzc0RlY2xhcmF0aW9uKG46IENsYXNzRGVjbGFyYXRpb24pOiBDbGFzc0RlY2xhcmF0aW9uIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYENsYXNzRGVjbGFyYXRpb24gaXMgbm90IHlldCBzdXBwb3J0ZWQuYCk7XG4gIH1cblxuICBwdWJsaWMgQ2xhc3NFeHByZXNzaW9uKG46IENsYXNzRXhwcmVzc2lvbik6IENsYXNzRXhwcmVzc2lvbiB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBDbGFzc0V4cHJlc3Npb24gaXMgbm90IHlldCBzdXBwb3J0ZWQuYCk7XG4gIH1cblxuICBwdWJsaWMgTWV0YVByb3BlcnR5KG46IE1ldGFQcm9wZXJ0eSk6IE1ldGFQcm9wZXJ0eSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBNZXRhUHJvcGVydHkgaXMgbm90IHlldCBzdXBwb3J0ZWQuYCk7XG4gIH1cblxuICBwdWJsaWMgSW1wb3J0RGVjbGFyYXRpb24objogSW1wb3J0RGVjbGFyYXRpb24pOiBJbXBvcnREZWNsYXJhdGlvbiB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBJbXBvcnREZWNsYXJhdGlvbiBpcyBub3QgeWV0IHN1cHBvcnRlZC5gKTtcbiAgfVxuXG4gIHB1YmxpYyBJbXBvcnRTcGVjaWZpZXIobjogSW1wb3J0U3BlY2lmaWVyKTogSW1wb3J0U3BlY2lmaWVyIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEltcG9ydFNwZWNpZmllciBpcyBub3QgeWV0IHN1cHBvcnRlZC5gKTtcbiAgfVxuXG4gIHB1YmxpYyBJbXBvcnREZWZhdWx0U3BlY2lmaWVyKG46IEltcG9ydERlZmF1bHRTcGVjaWZpZXIpOiBJbXBvcnREZWZhdWx0U3BlY2lmaWVyIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEltcG9ydERlZmF1bHRTcGVjaWZpZXIgaXMgbm90IHlldCBzdXBwb3J0ZWQuYCk7XG4gIH1cblxuICBwdWJsaWMgSW1wb3J0TmFtZXNwYWNlU3BlY2lmaWVyKG46IEltcG9ydE5hbWVzcGFjZVNwZWNpZmllcik6IEltcG9ydE5hbWVzcGFjZVNwZWNpZmllciB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBJbXBvcnROYW1lc3BhY2VTcGVjaWZpZXIgaXMgbm90IHlldCBzdXBwb3J0ZWQuYCk7XG4gIH1cblxuICBwdWJsaWMgRXhwb3J0TmFtZWREZWNsYXJhdGlvbihuOiBFeHBvcnROYW1lZERlY2xhcmF0aW9uKTogRXhwb3J0TmFtZWREZWNsYXJhdGlvbiB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBFeHBvcnROYW1lZERlY2xhcmF0aW9uIGlzIG5vdCB5ZXQgc3VwcG9ydGVkLmApO1xuICB9XG5cbiAgcHVibGljIEV4cG9ydFNwZWNpZmllcihuOiBFeHBvcnRTcGVjaWZpZXIpOiBFeHBvcnRTcGVjaWZpZXIge1xuICAgIHRocm93IG5ldyBFcnJvcihgRXhwb3J0U3BlY2lmaWVyIGlzIG5vdCB5ZXQgc3VwcG9ydGVkLmApO1xuICB9XG5cbiAgcHVibGljIEV4cG9ydERlZmF1bHREZWNsYXJhdGlvbihuOiBFeHBvcnREZWZhdWx0RGVjbGFyYXRpb24pOiBFeHBvcnREZWZhdWx0RGVjbGFyYXRpb24ge1xuICAgIHRocm93IG5ldyBFcnJvcihgRXhwb3J0RGVmYXVsdERlY2xhcmF0aW9uIGlzIG5vdCB5ZXQgc3VwcG9ydGVkLmApO1xuICB9XG5cbiAgcHVibGljIEV4cG9ydEFsbERlY2xhcmF0aW9uKG46IEV4cG9ydEFsbERlY2xhcmF0aW9uKTogRXhwb3J0QWxsRGVjbGFyYXRpb24ge1xuICAgIHRocm93IG5ldyBFcnJvcihgRXhwb3J0QWxsRGVjbGFyYXRpb24gaXMgbm90IHlldCBzdXBwb3J0ZWQuYCk7XG4gIH1cblxuICBwdWJsaWMgQXdhaXRFeHByZXNzaW9uKG46IEF3YWl0RXhwcmVzc2lvbik6IEF3YWl0RXhwcmVzc2lvbiB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBBd2FpdEV4cHJlc3Npb24gaXMgbm90IHlldCBzdXBwb3J0ZWQuYCk7XG4gIH1cbn1cblxuLyoqXG4gKiBDaGVja3MgdGhhdCB0aGUgZ2l2ZW4gY29kZSBpcyBFUzUgY29tcGF0aWJsZS4gVGhyb3dzIGFuIGV4Y2VwdGlvbiBpZiBub3QuXG4gKi9cbmNsYXNzIEVTNUNoZWNraW5nVmlzaXRvciBleHRlbmRzIFZpc2l0b3Ige1xuICBwcml2YXRlIF9wb2x5ZmlsbFVybDogc3RyaW5nIHwgbnVsbDtcblxuICBjb25zdHJ1Y3Rvcihwb2x5ZmlsbFVybDogc3RyaW5nIHwgbnVsbCkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5fcG9seWZpbGxVcmwgPSBwb2x5ZmlsbFVybDtcbiAgfVxuXG4gIHB1YmxpYyBQcm9ncmFtKHA6IFByb2dyYW0pOiBQcm9ncmFtIHtcbiAgICBjb25zdCBydiA9IHN1cGVyLlByb2dyYW0ocCk7XG4gICAgaWYgKHRoaXMuX3BvbHlmaWxsVXJsICE9PSBudWxsKSB7XG4gICAgICBydi5ib2R5LnVuc2hpZnQoZ2V0UHJvZ3JhbVByZWx1ZGUoW2dldFBvbHlmaWxsSW5zZXJ0aW9uKHRoaXMuX3BvbHlmaWxsVXJsKV0pKTtcbiAgICB9XG4gICAgcmV0dXJuIHJ2O1xuICB9XG59XG5cbi8qKlxuICogQ29sbGVjdHMgaW5mb3JtYXRpb24gYWJvdXQgc2NvcGVzIGluIHRoZSBwcm9ncmFtIGFuZCBwZXJmb3JtcyB0aGUgZm9sbG93aW5nIHRyYW5zZm9ybWF0aW9uczpcbiAqXG4gKiAtIEZ1bmN0aW9uIGRlY2xhcmF0aW9ucyB0aGF0IGFyZSAqbm90KiBpbiBhIHRvcC1tb3N0IGZ1bmN0aW9uIHNjb3BlIGFyZSByZXdyaXR0ZW4gdG8gYmVcbiAqICAgZnVuY3Rpb24gZXhwcmVzc2lvbnMuIFRoaXMgaXMgdW5kZWZpbmVkIGJlaGF2aW9yIGluIEphdmFTY3JpcHQsIGFuZCBvdXIgcmV3cml0dGVuIGNvZGVcbiAqICAgaXMgY29uc2lzdGVudCB3aXRoIFY4J3MgYmVoYXZpb3IuXG4gKiAtIFNpbmdsZS1saW5lIGJvZGllcyBvZiBjb25kaXRpb25hbHMgYXJlIGNvbnZlcnRlZCBpbnRvIGJsb2NrIHN0YXRlbWVudHMuXG4gKiAtIE1vdmVzIG11bHRpcGxlIHZhcmlhYmxlIGRlY2xhcmF0b3JzIGluIEZvciBsb29wcyBpbnRvIHBhcmVudC5cbiAqL1xuY2xhc3MgU2NvcGVTY2FubmluZ1Zpc2l0b3IgZXh0ZW5kcyBWaXNpdG9yIHtcbiAgcHVibGljIHN0YXRpYyBWaXNpdChhc3Q6IFByb2dyYW0sIHNjb3BlTWFwOiBNYXA8UHJvZ3JhbSB8IEJsb2NrU3RhdGVtZW50LCBCbG9ja1Njb3BlPiwgc3ltYm9sczogU2V0PHN0cmluZz4sIGdsb2JhbFNjb3BlOiBJU2NvcGUgPSBuZXcgR2xvYmFsU2NvcGUoKSk6IFByb2dyYW0ge1xuICAgIGNvbnN0IHZpc2l0b3IgPSBuZXcgU2NvcGVTY2FubmluZ1Zpc2l0b3Ioc2NvcGVNYXAsIHN5bWJvbHMsIGdsb2JhbFNjb3BlKTtcbiAgICByZXR1cm4gdmlzaXRvci5Qcm9ncmFtKGFzdCk7XG4gIH1cblxuICBwcml2YXRlIF9zY29wZTogSVNjb3BlID0gbnVsbDtcbiAgcHJpdmF0ZSBfbmV4dEJsb2NrSXNGdW5jdGlvbiA9IGZhbHNlO1xuICBwcml2YXRlIF9uZXh0QmxvY2tJc1dpdGggPSBmYWxzZTtcbiAgcHJpdmF0ZSBfZGVmaW5lSW5OZXh0QmxvY2s6IHt0eXBlOiBWYXJUeXBlLCBuYW1lOiBzdHJpbmd9W10gPSBbXTtcbiAgcHJpdmF0ZSBfc2NvcGVNYXA6IE1hcDxQcm9ncmFtIHwgQmxvY2tTdGF0ZW1lbnQsIElTY29wZT47XG4gIHByaXZhdGUgX3N5bWJvbHM6IFNldDxzdHJpbmc+O1xuXG4gIHByaXZhdGUgY29uc3RydWN0b3Ioc2NvcGVNYXA6IE1hcDxQcm9ncmFtIHwgQmxvY2tTdGF0ZW1lbnQsIEJsb2NrU2NvcGU+LCBzeW1ib2xzOiBTZXQ8c3RyaW5nPiwgZ2xvYmFsU2NvcGU6IElTY29wZSkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5fc2NvcGVNYXAgPSBzY29wZU1hcDtcbiAgICB0aGlzLl9zeW1ib2xzID0gc3ltYm9scztcbiAgICB0aGlzLl9zY29wZSA9IGdsb2JhbFNjb3BlO1xuICB9XG5cbiAgcHVibGljIFByb2dyYW0ocDogUHJvZ3JhbSk6IFByb2dyYW0ge1xuICAgIGNvbnN0IHJ2ID0gc3VwZXIuUHJvZ3JhbShwKTtcbiAgICB0aGlzLl9zY29wZU1hcC5zZXQocnYsIHRoaXMuX3Njb3BlKTtcbiAgICByZXR1cm4gcnY7XG4gIH1cblxuICBwdWJsaWMgRnVuY3Rpb25EZWNsYXJhdGlvbihmZDogRnVuY3Rpb25EZWNsYXJhdGlvbik6IEZ1bmN0aW9uRGVjbGFyYXRpb24gfCBWYXJpYWJsZURlY2xhcmF0aW9uIHtcbiAgICBpZiAoIXRoaXMuX3Njb3BlLmlzRnVuY3Rpb25TY29wZSkge1xuICAgICAgLy8gVW5kZWZpbmVkIGJlaGF2aW9yISBGdW5jdGlvbiBkZWNsYXJhdGlvbiBpcyBub3QgaW4gdG9wLWxldmVsIHNjb3BlIG9mIGZ1bmN0aW9uLlxuICAgICAgLy8gVHVybiBpbnRvIGEgZnVuY3Rpb24gZXhwcmVzc2lvbiBhc3NpZ25tZW50IHRvIGEgdmFyLiBDaHJvbWUgc2VlbXMgdG8gdHJlYXQgaXQgYXMgc3VjaC5cbiAgICAgIC8vIFdpbGwgYmUgcmUtdmlzaXRlZCBsYXRlciBhcyBhIEZ1bmN0aW9uRXhwcmVzc2lvbi5cbiAgICAgIGNvbnN0IHJld3JpdGU6IFZhcmlhYmxlRGVjbGFyYXRpb24gPSB7XG4gICAgICAgIHR5cGU6IFwiVmFyaWFibGVEZWNsYXJhdGlvblwiLFxuICAgICAgICBkZWNsYXJhdGlvbnM6IFt7XG4gICAgICAgICAgdHlwZTogXCJWYXJpYWJsZURlY2xhcmF0b3JcIixcbiAgICAgICAgICBpZDogZmQuaWQsXG4gICAgICAgICAgaW5pdDoge1xuICAgICAgICAgICAgdHlwZTogXCJGdW5jdGlvbkV4cHJlc3Npb25cIixcbiAgICAgICAgICAgIC8vIFJlbW92ZSBuYW1lIG9mIGZ1bmN0aW9uIHRvIGF2b2lkIGNsYXNoZXMgd2l0aFxuICAgICAgICAgICAgLy8gbmV3IHZhcmlhYmxlIG5hbWUuXG4gICAgICAgICAgICBpZDogbnVsbCxcbiAgICAgICAgICAgIHBhcmFtczogZmQucGFyYW1zLFxuICAgICAgICAgICAgYm9keTogZmQuYm9keSxcbiAgICAgICAgICAgIGdlbmVyYXRvcjogZmQuZ2VuZXJhdG9yLFxuICAgICAgICAgICAgYXN5bmM6IGZkLmFzeW5jLFxuICAgICAgICAgICAgbG9jOiBmZC5sb2NcbiAgICAgICAgICB9LFxuICAgICAgICAgIGxvYzogZmQubG9jXG4gICAgICAgIH1dLFxuICAgICAgICBraW5kOiBcInZhclwiLFxuICAgICAgICBsb2M6IGZkLmxvY1xuICAgICAgfTtcbiAgICAgIHJldHVybiA8VmFyaWFibGVEZWNsYXJhdGlvbj4gdGhpcy5WYXJpYWJsZURlY2xhcmF0aW9uKHJld3JpdGUpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9uZXh0QmxvY2tJc0Z1bmN0aW9uID0gdHJ1ZTtcbiAgICAgIGNvbnN0IGFyZ3MgPSBmZC5wYXJhbXM7XG4gICAgICBmb3IgKGNvbnN0IGFyZyBvZiBhcmdzKSB7XG4gICAgICAgIHN3aXRjaCAoYXJnLnR5cGUpIHtcbiAgICAgICAgICBjYXNlIFwiSWRlbnRpZmllclwiOlxuICAgICAgICAgICAgdGhpcy5fZGVmaW5lSW5OZXh0QmxvY2sucHVzaCh7dHlwZTogVmFyVHlwZS5BUkcsIG5hbWU6IGFyZy5uYW1lfSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbnN1cHBvcnRlZCBmdW5jdGlvbiBwYXJhbWV0ZXIgdHlwZTogJHthcmcudHlwZX1gKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGhpcy5fc2NvcGUuZGVmaW5lVmFyaWFibGUoZmQuaWQubmFtZSwgVmFyVHlwZS5GVU5DVElPTl9ERUNMKTtcbiAgICAgIHRoaXMuX3N5bWJvbHMuYWRkKGZkLmlkLm5hbWUpO1xuICAgICAgcmV0dXJuIHN1cGVyLkZ1bmN0aW9uRGVjbGFyYXRpb24oZmQpO1xuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBGdW5jdGlvbkV4cHJlc3Npb24oZmU6IEZ1bmN0aW9uRXhwcmVzc2lvbik6IEZ1bmN0aW9uRXhwcmVzc2lvbiB7XG4gICAgaWYgKGZlLmlkKSB7XG4gICAgICB0aGlzLl9kZWZpbmVJbk5leHRCbG9jay5wdXNoKHt0eXBlOiBWYXJUeXBlLkNPTlNULCBuYW1lOiBmZS5pZC5uYW1lIH0pO1xuICAgIH1cbiAgICBjb25zdCBhcmdzID0gZmUucGFyYW1zO1xuICAgIGZvciAoY29uc3QgYXJnIG9mIGFyZ3MpIHtcbiAgICAgIHN3aXRjaCAoYXJnLnR5cGUpIHtcbiAgICAgICAgY2FzZSBcIklkZW50aWZpZXJcIjpcbiAgICAgICAgICB0aGlzLl9kZWZpbmVJbk5leHRCbG9jay5wdXNoKHt0eXBlOiBWYXJUeXBlLkFSRywgbmFtZTogYXJnLm5hbWV9KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVuc3VwcG9ydGVkIGZ1bmN0aW9uIHBhcmFtZXRlciB0eXBlOiAke2FyZy50eXBlfWApO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLl9uZXh0QmxvY2tJc0Z1bmN0aW9uID0gdHJ1ZTtcbiAgICBjb25zdCBydiA9IDxGdW5jdGlvbkV4cHJlc3Npb24+IHN1cGVyLkZ1bmN0aW9uRXhwcmVzc2lvbihmZSk7XG4gICAgLy8gUmV3cml0ZS5cbiAgICByZXR1cm4gcnY7XG4gIH1cblxuICBwdWJsaWMgQmxvY2tTdGF0ZW1lbnQoYnM6IEJsb2NrU3RhdGVtZW50KTogQmxvY2tTdGF0ZW1lbnQge1xuICAgIGNvbnN0IG9sZEJzID0gdGhpcy5fc2NvcGU7XG4gICAgaWYgKHRoaXMuX25leHRCbG9ja0lzV2l0aCkge1xuICAgICAgdGhpcy5fbmV4dEJsb2NrSXNXaXRoID0gZmFsc2U7XG4gICAgICB0aGlzLl9zY29wZSA9IG5ldyBCbG9ja1Njb3BlKG5ldyBQcm94eVNjb3BlKCksIHRoaXMuX25leHRCbG9ja0lzRnVuY3Rpb24pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9zY29wZSA9IG5ldyBCbG9ja1Njb3BlKG9sZEJzLCB0aGlzLl9uZXh0QmxvY2tJc0Z1bmN0aW9uKTtcbiAgICB9XG4gICAgdGhpcy5fbmV4dEJsb2NrSXNGdW5jdGlvbiA9IGZhbHNlO1xuICAgIGlmICh0aGlzLl9kZWZpbmVJbk5leHRCbG9jay5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCBkaW5iID0gdGhpcy5fZGVmaW5lSW5OZXh0QmxvY2s7XG4gICAgICBmb3IgKGNvbnN0IHYgb2YgZGluYikge1xuICAgICAgICB0aGlzLl9zY29wZS5kZWZpbmVWYXJpYWJsZSh2Lm5hbWUsIHYudHlwZSk7XG4gICAgICAgIHRoaXMuX3N5bWJvbHMuYWRkKHYubmFtZSk7XG4gICAgICB9XG4gICAgICB0aGlzLl9kZWZpbmVJbk5leHRCbG9jayA9IFtdO1xuICAgIH1cbiAgICBjb25zdCBydiA9IHN1cGVyLkJsb2NrU3RhdGVtZW50KGJzKTtcbiAgICB0aGlzLl9zY29wZU1hcC5zZXQoYnMsIHRoaXMuX3Njb3BlKTtcbiAgICB0aGlzLl9zY29wZSA9IG9sZEJzO1xuICAgIHJldHVybiBydjtcbiAgfVxuXG4gIHB1YmxpYyBWYXJpYWJsZURlY2xhcmF0aW9uKHZkOiBWYXJpYWJsZURlY2xhcmF0aW9uKTogVmFyaWFibGVEZWNsYXJhdGlvbiB8IE11bHRpcGxlU3RhdGVtZW50cyB8IEV4cHJlc3Npb25TdGF0ZW1lbnQge1xuICAgIGxldCBraW5kOiBWYXJUeXBlO1xuICAgIHN3aXRjaCAodmQua2luZCkge1xuICAgICAgY2FzZSBcInZhclwiOlxuICAgICAgICBraW5kID0gVmFyVHlwZS5WQVI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcImxldFwiOlxuICAgICAgICBraW5kID0gVmFyVHlwZS5MRVQ7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcImNvbnN0XCI6XG4gICAgICAgIGtpbmQgPSBWYXJUeXBlLkNPTlNUO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5yZWNvZ25pemVkIHZhcmlhYmxlIGRlY2xhcmF0aW9uIHR5cGU6ICR7dmQua2luZH1gKTtcbiAgICB9XG5cbiAgICBjb25zdCBkZWNscyA9IHZkLmRlY2xhcmF0aW9ucztcbiAgICBmb3IgKGNvbnN0IGRlY2wgb2YgZGVjbHMpIHtcbiAgICAgIGNvbnN0IGlkID0gZGVjbC5pZDtcbiAgICAgIHN3aXRjaCAoaWQudHlwZSkge1xuICAgICAgICBjYXNlIFwiSWRlbnRpZmllclwiOlxuICAgICAgICAgIHRoaXMuX3Njb3BlLmRlZmluZVZhcmlhYmxlKGlkLm5hbWUsIGtpbmQpO1xuICAgICAgICAgIHRoaXMuX3N5bWJvbHMuYWRkKGlkLm5hbWUpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5yZWNvZ25pemVkIHZhcmlhYmxlIGRlY2xhcmF0aW9uIHR5cGU6ICR7aWQudHlwZX1gKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gc3VwZXIuVmFyaWFibGVEZWNsYXJhdGlvbih2ZCk7XG4gIH1cblxuICBwdWJsaWMgQmluYXJ5RXhwcmVzc2lvbihiZDogQmluYXJ5RXhwcmVzc2lvbik6IEJpbmFyeUV4cHJlc3Npb24gfCBVbmFyeUV4cHJlc3Npb24gfCBDYWxsRXhwcmVzc2lvbiB7XG4gICAgY29uc3QgcnYgPSA8QmluYXJ5RXhwcmVzc2lvbj4gc3VwZXIuQmluYXJ5RXhwcmVzc2lvbihiZCk7XG4gICAgLy8gUmV3cml0ZSBlcXVhbGl0eSBzbyB0aGF0IFByb3h5KEEpIGFuZCBBIGFyZSBlcXVpdmFsZW50LlxuICAgIGNvbnN0IG9wID0gYmQub3BlcmF0b3I7XG4gICAgc3dpdGNoIChvcCkge1xuICAgICAgY2FzZSAnPT09JzpcbiAgICAgIGNhc2UgJz09JzpcbiAgICAgIGNhc2UgJyE9PSc6XG4gICAgICBjYXNlICchPSc6IHtcbiAgICAgICAgY29uc3Qgc3RyaWN0ID0gb3AubGVuZ3RoID09PSAzO1xuICAgICAgICBjb25zdCBub3QgPSBvcFswXSA9PT0gJyEnO1xuICAgICAgICBjb25zdCBjZTogQ2FsbEV4cHJlc3Npb24gPSB7XG4gICAgICAgICAgdHlwZTogXCJDYWxsRXhwcmVzc2lvblwiLFxuICAgICAgICAgIGNhbGxlZToge1xuICAgICAgICAgICAgdHlwZTogXCJJZGVudGlmaWVyXCIsXG4gICAgICAgICAgICBuYW1lOiBgJCQkJHtzdHJpY3QgPyAnUycgOiAnJ31FUSQkJGBcbiAgICAgICAgICB9LFxuICAgICAgICAgIGFyZ3VtZW50czogW1xuICAgICAgICAgICAgcnYubGVmdCxcbiAgICAgICAgICAgIHJ2LnJpZ2h0XG4gICAgICAgICAgXSxcbiAgICAgICAgICBsb2M6IHJ2LmxvY1xuICAgICAgICB9O1xuICAgICAgICBpZiAobm90KSB7XG4gICAgICAgICAgY29uc3QgdWU6IFVuYXJ5RXhwcmVzc2lvbiA9IHtcbiAgICAgICAgICAgIHR5cGU6IFwiVW5hcnlFeHByZXNzaW9uXCIsXG4gICAgICAgICAgICBvcGVyYXRvcjogXCIhXCIsXG4gICAgICAgICAgICBhcmd1bWVudDogY2UsXG4gICAgICAgICAgICBsb2M6IHJ2LmxvYyxcbiAgICAgICAgICAgIHByZWZpeDogdHJ1ZVxuICAgICAgICAgIH07XG4gICAgICAgICAgcmV0dXJuIHRoaXMuVW5hcnlFeHByZXNzaW9uKHVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5DYWxsRXhwcmVzc2lvbihjZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiBydjtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgQ2F0Y2hDbGF1c2UoY2M6IENhdGNoQ2xhdXNlKTogQ2F0Y2hDbGF1c2Uge1xuICAgIGNvbnN0IHBhcmFtID0gY2MucGFyYW07XG4gICAgc3dpdGNoIChwYXJhbS50eXBlKSB7XG4gICAgICBjYXNlIFwiSWRlbnRpZmllclwiOlxuICAgICAgICB0aGlzLl9kZWZpbmVJbk5leHRCbG9jay5wdXNoKHsgdHlwZTogVmFyVHlwZS5BUkcsIG5hbWU6IHBhcmFtLm5hbWUgfSk7XG4gICAgICAgIHRoaXMuX3N5bWJvbHMuYWRkKHBhcmFtLm5hbWUpO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5yZWNvZ25pemVkIHBhcmFtZXRlciB0eXBlIGluIGNhdGNoIGNsYXVzZTogJHtwYXJhbS50eXBlfWApO1xuICAgIH1cbiAgICByZXR1cm4gc3VwZXIuQ2F0Y2hDbGF1c2UoY2MpO1xuICB9XG5cbiAgcHVibGljIElkZW50aWZpZXIobjogSWRlbnRpZmllcik6IElkZW50aWZpZXIgfCBNZW1iZXJFeHByZXNzaW9uIHtcbiAgICB0aGlzLl9zeW1ib2xzLmFkZChuLm5hbWUpO1xuICAgIHJldHVybiBuO1xuICB9XG5cbiAgcHVibGljIENhbGxFeHByZXNzaW9uKGNlOiBDYWxsRXhwcmVzc2lvbik6IENhbGxFeHByZXNzaW9uIHtcbiAgICBjb25zdCBpZCA9IGNlLmNhbGxlZTtcbiAgICBpZiAoaWQudHlwZSA9PT0gXCJJZGVudGlmaWVyXCIgJiYgaWQubmFtZSA9PT0gXCJldmFsXCIpIHtcbiAgICAgIHRoaXMuX3Njb3BlLmV2YWxGb3VuZCgpO1xuICAgIH1cbiAgICByZXR1cm4gc3VwZXIuQ2FsbEV4cHJlc3Npb24oY2UpO1xuICB9XG5cbiAgcHVibGljIElmU3RhdGVtZW50KGlzOiBJZlN0YXRlbWVudCk6IElmU3RhdGVtZW50IHtcbiAgICBjb25zdCBjb25zID0gaXMuY29uc2VxdWVudDtcbiAgICBpZiAoY29ucy50eXBlICE9PSBcIkJsb2NrU3RhdGVtZW50XCIpIHtcbiAgICAgIGlzLmNvbnNlcXVlbnQgPSBzdGF0ZW1lbnRUb0Jsb2NrKGNvbnMpO1xuICAgIH1cblxuICAgIGNvbnN0IGFsdCA9IGlzLmFsdGVybmF0ZTtcbiAgICBpZiAoYWx0KSB7XG4gICAgICBzd2l0Y2ggKGFsdC50eXBlKSB7XG4gICAgICAgIGNhc2UgXCJJZlN0YXRlbWVudFwiOiAvLyBWYWxpZCBgZWxzZSBpZmBcbiAgICAgICAgY2FzZSBcIkJsb2NrU3RhdGVtZW50XCI6IC8vIFZhbGlkIGBlbHNlYFxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIC8vIFNpbmdsZS1saW5lIGVsc2UuXG4gICAgICAgICAgaXMuYWx0ZXJuYXRlID0gc3RhdGVtZW50VG9CbG9jayhhbHQpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBzdXBlci5JZlN0YXRlbWVudChpcyk7XG4gIH1cblxuICBwcm90ZWN0ZWQgX1doaWxlT3JEb1doaWxlU3RhdGVtZW50KG46IERvV2hpbGVTdGF0ZW1lbnQpOiBEb1doaWxlU3RhdGVtZW50O1xuICBwcm90ZWN0ZWQgX1doaWxlT3JEb1doaWxlU3RhdGVtZW50KG46IFdoaWxlU3RhdGVtZW50KTogV2hpbGVTdGF0ZW1lbnQ7XG4gIHByb3RlY3RlZCBfV2hpbGVPckRvV2hpbGVTdGF0ZW1lbnQod3M6IFdoaWxlU3RhdGVtZW50IHwgRG9XaGlsZVN0YXRlbWVudCk6IFdoaWxlU3RhdGVtZW50IHwgRG9XaGlsZVN0YXRlbWVudCB7XG4gICAgaWYgKHdzLmJvZHkudHlwZSAhPT0gXCJCbG9ja1N0YXRlbWVudFwiKSB7XG4gICAgICB3cy5ib2R5ID0gc3RhdGVtZW50VG9CbG9jayh3cy5ib2R5KTtcbiAgICB9XG4gICAgcmV0dXJuIHN1cGVyLl9XaGlsZU9yRG9XaGlsZVN0YXRlbWVudCg8YW55PiB3cyk7XG4gIH1cblxuICBwcm90ZWN0ZWQgX0ZvckluQW5kT2ZTdGF0ZW1lbnQobjogRm9ySW5TdGF0ZW1lbnQpOiBGb3JJblN0YXRlbWVudDtcbiAgcHJvdGVjdGVkIF9Gb3JJbkFuZE9mU3RhdGVtZW50KG46IEZvck9mU3RhdGVtZW50KTogRm9yT2ZTdGF0ZW1lbnQ7XG4gIHByb3RlY3RlZCBfRm9ySW5BbmRPZlN0YXRlbWVudChmczogRm9ySW5TdGF0ZW1lbnQgfCBGb3JPZlN0YXRlbWVudCk6IEZvckluU3RhdGVtZW50IHwgRm9yT2ZTdGF0ZW1lbnQge1xuICAgIGlmIChmcy5ib2R5LnR5cGUgIT09IFwiQmxvY2tTdGF0ZW1lbnRcIikge1xuICAgICAgZnMuYm9keSA9IHN0YXRlbWVudFRvQmxvY2soZnMuYm9keSk7XG4gICAgfVxuICAgIHJldHVybiBzdXBlci5fRm9ySW5BbmRPZlN0YXRlbWVudCg8YW55PiBmcyk7XG4gIH1cblxuICBwdWJsaWMgU3dpdGNoQ2FzZShzYzogU3dpdGNoQ2FzZSk6IFN3aXRjaENhc2Uge1xuICAgIGNvbnN0IGNvbnMgPSBzYy5jb25zZXF1ZW50O1xuICAgIGlmIChjb25zLmxlbmd0aCAhPT0gMSB8fCBjb25zWzBdLnR5cGUgIT09IFwiQmxvY2tTdGF0ZW1lbnRcIikge1xuICAgICAgc2MuY29uc2VxdWVudCA9IFtcbiAgICAgICAgc3RhdGVtZW50c1RvQmxvY2soc2MsIGNvbnMpXG4gICAgICBdO1xuICAgIH1cbiAgICByZXR1cm4gc3VwZXIuU3dpdGNoQ2FzZShzYyk7XG4gIH1cblxuICBwdWJsaWMgRm9yU3RhdGVtZW50KGZzOiBGb3JTdGF0ZW1lbnQpOiBGb3JTdGF0ZW1lbnQgfCBNdWx0aXBsZVN0YXRlbWVudHMge1xuICAgIGlmIChmcy5ib2R5LnR5cGUgIT09IFwiQmxvY2tTdGF0ZW1lbnRcIikge1xuICAgICAgZnMuYm9keSA9IHN0YXRlbWVudFRvQmxvY2soZnMuYm9keSk7XG4gICAgfVxuICAgIGNvbnN0IGluaXQgPSBmcy5pbml0O1xuICAgIGlmIChpbml0ICYmIGluaXQudHlwZSA9PT0gXCJWYXJpYWJsZURlY2xhcmF0aW9uXCIgJiYgaW5pdC5kZWNsYXJhdGlvbnMubGVuZ3RoID4gMSkge1xuICAgICAgLy8gSG9pc3QgZGVjbGFyYXRpb24gb3V0c2lkZSBvZiBsb29wLCBvdGhlcndpc2UgaXQgbWF5IGNhdXNlIHRyb3VibGUgZm9yIHVzIGRvd24gdGhlIHJvYWRcbiAgICAgIC8vIGluIHN1YnNlcXVlbnQgQVNUIG1vZGlmaWNhdGlvbnMuXG4gICAgICBmcy5pbml0ID0gbnVsbDtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHR5cGU6IFwiTXVsdGlwbGVTdGF0ZW1lbnRzXCIsXG4gICAgICAgIGJvZHk6IFtcbiAgICAgICAgICA8VmFyaWFibGVEZWNsYXJhdGlvbj4gdGhpcy5WYXJpYWJsZURlY2xhcmF0aW9uKGluaXQpLFxuICAgICAgICAgIDxGb3JTdGF0ZW1lbnQ+IHN1cGVyLkZvclN0YXRlbWVudChmcyldLFxuICAgICAgICBsb2M6IGZzLmxvY1xuICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIHN1cGVyLkZvclN0YXRlbWVudChmcyk7XG4gIH1cblxuICBwdWJsaWMgV2l0aFN0YXRlbWVudCh3czogV2l0aFN0YXRlbWVudCk6IFdpdGhTdGF0ZW1lbnQgfCBCbG9ja1N0YXRlbWVudCB7XG4gICAgaWYgKHdzLmJvZHkudHlwZSAhPT0gXCJCbG9ja1N0YXRlbWVudFwiKSB7XG4gICAgICB3cy5ib2R5ID0ge1xuICAgICAgICB0eXBlOiBcIkJsb2NrU3RhdGVtZW50XCIsXG4gICAgICAgIGJvZHk6IFt3cy5ib2R5XSxcbiAgICAgICAgbG9jOiB3cy5ib2R5LmxvY1xuICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBUcmVhdCBsaWtlIGFuIGV2YWw7IHRvc3MgZXZlcnl0aGluZy5cbiAgICB0aGlzLl9zY29wZS5ldmFsRm91bmQoKTtcbiAgICB0aGlzLl9uZXh0QmxvY2tJc1dpdGggPSB0cnVlO1xuXG4gICAgcmV0dXJuIHN1cGVyLldpdGhTdGF0ZW1lbnQod3MpO1xuICB9XG59XG5cbi8qKlxuICogT25jZSB0aGUgcHJldmlvdXMgdmlzaXRvciBoYXMgY3JlYXRlZCBhbGwgb2YgdGhlIG5lY2Vzc2FyeSBzY29wZXMsIHRoaXMgcGFzcyBjaGVja3Mgd2hpY2ggbG9jYWwgdmFyaWFibGVzIGVzY2FwZSBpbnRvIGZ1bmN0aW9uIGNsb3N1cmVzLlxuICovXG5jbGFzcyBFc2NhcGVBbmFseXNpc1Zpc2l0b3IgZXh0ZW5kcyBWaXNpdG9yIHtcbiAgcHVibGljIHN0YXRpYyBWaXNpdChhc3Q6IFByb2dyYW0sIHNjb3BlTWFwOiBNYXA8UHJvZ3JhbSB8IEJsb2NrU3RhdGVtZW50LCBCbG9ja1Njb3BlPik6IFByb2dyYW0ge1xuICAgIGNvbnN0IHZpc2l0b3IgPSBuZXcgRXNjYXBlQW5hbHlzaXNWaXNpdG9yKHNjb3BlTWFwKTtcbiAgICByZXR1cm4gdmlzaXRvci5Qcm9ncmFtKGFzdCk7XG4gIH1cblxuICBwcml2YXRlIF9zY29wZTogSVNjb3BlID0gbnVsbDtcbiAgcHJpdmF0ZSBfc2NvcGVNYXA6IE1hcDxQcm9ncmFtIHwgQmxvY2tTdGF0ZW1lbnQsIEJsb2NrU2NvcGU+O1xuXG4gIHByaXZhdGUgY29uc3RydWN0b3Ioc2NvcGVNYXA6IE1hcDxQcm9ncmFtIHwgQmxvY2tTdGF0ZW1lbnQsIEJsb2NrU2NvcGU+KSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLl9zY29wZU1hcCA9IHNjb3BlTWFwO1xuICB9XG5cbiAgcHVibGljIFByb2dyYW0ocDogUHJvZ3JhbSk6IFByb2dyYW0ge1xuICAgIGNvbnN0IHByZXYgPSB0aGlzLl9zY29wZTtcbiAgICB0aGlzLl9zY29wZSA9IHRoaXMuX3Njb3BlTWFwLmdldChwKTtcbiAgICBjb25zdCBydiA9IHN1cGVyLlByb2dyYW0ocCk7XG4gICAgdGhpcy5fc2NvcGUgPSBwcmV2O1xuICAgIHJldHVybiBydjtcbiAgfVxuXG4gIHB1YmxpYyBCbG9ja1N0YXRlbWVudChiczogQmxvY2tTdGF0ZW1lbnQpOiBCbG9ja1N0YXRlbWVudCB7XG4gICAgY29uc3QgcHJldiA9IHRoaXMuX3Njb3BlO1xuICAgIHRoaXMuX3Njb3BlID0gdGhpcy5fc2NvcGVNYXAuZ2V0KGJzKTtcbiAgICBjb25zdCBydiA9IHN1cGVyLkJsb2NrU3RhdGVtZW50KGJzKTtcbiAgICB0aGlzLl9zY29wZSA9IHByZXY7XG4gICAgcmV0dXJuIHJ2O1xuICB9XG5cbiAgcHVibGljIElkZW50aWZpZXIobjogSWRlbnRpZmllcik6IElkZW50aWZpZXIgfCBNZW1iZXJFeHByZXNzaW9uIHtcbiAgICB0aGlzLl9zY29wZS5tYXliZUNsb3NlT3ZlclZhcmlhYmxlKG4ubmFtZSk7XG4gICAgcmV0dXJuIG47XG4gIH1cbn1cblxuLyoqXG4gKiBDcmVhdGVzIHNjb3BlIG9iamVjdHMgd2hlcmUgbmVlZGVkLCBtb3ZlcyBjbG9zZWQtb3ZlciB2YXJpYWJsZXMgaW50byB0aGVtLFxuICogYXNzaWducyBfX3Njb3BlX18gb24gZnVuY3Rpb24gb2JqZWN0cywgYW5kIHJld3JpdGVzIGVxdWFsaXR5IHN0YXRlbWVudHMgdG8gdXNlXG4gKiAkJCRFUSQkJCAvICQkJFNFUSQkJC5cbiAqL1xuY2xhc3MgU2NvcGVDcmVhdGlvblZpc2l0b3IgZXh0ZW5kcyBWaXNpdG9yIHtcbiAgcHVibGljIHN0YXRpYyBWaXNpdChhc3Q6IFByb2dyYW0sIHNjb3BlTWFwOiBNYXA8UHJvZ3JhbSB8IEJsb2NrU3RhdGVtZW50LCBJU2NvcGU+LCBzeW1ib2xzOiBTZXQ8c3RyaW5nPiwgYWdlbnRVcmw6IHN0cmluZywgcG9seWZpbGxVcmw6IHN0cmluZyk6IFByb2dyYW0ge1xuICAgIGNvbnN0IHZpc2l0b3IgPSBuZXcgU2NvcGVDcmVhdGlvblZpc2l0b3Ioc2NvcGVNYXAsIHN5bWJvbHMsIGFnZW50VXJsLCBwb2x5ZmlsbFVybCk7XG4gICAgcmV0dXJuIHZpc2l0b3IuUHJvZ3JhbShhc3QpO1xuICB9XG5cbiAgcHJvdGVjdGVkIF9zY29wZU1hcDogTWFwPFByb2dyYW0gfCBCbG9ja1N0YXRlbWVudCwgSVNjb3BlPjtcbiAgcHJvdGVjdGVkIF9zY29wZTogSVNjb3BlID0gbnVsbDtcbiAgcHJvdGVjdGVkIF9hZ2VudFVybDogc3RyaW5nO1xuICBwcm90ZWN0ZWQgX3BvbHlmaWxsVXJsOiBzdHJpbmc7XG4gIHByb3RlY3RlZCBfbmV4dEZ1bmN0aW9uRXhwcmVzc2lvbklzR2V0dGVyT3JTZXR0ZXIgPSBmYWxzZTtcbiAgcHJvdGVjdGVkIF9nZXR0ZXJPclNldHRlclZpc2l0ZWQgPSBmYWxzZTtcbiAgcHJvdGVjdGVkIF9zeW1ib2xzOiBTZXQ8c3RyaW5nPjtcbiAgcHJpdmF0ZSBfbmV4dFNjb3BlID0gMDtcbiAgcHJpdmF0ZSBfZ2V0TmV4dFNjb3BlID0gKCkgPT4ge1xuICAgIGxldCBuYW1lOiBzdHJpbmc7XG4gICAgZG8ge1xuICAgICAgbmFtZSA9IGBzJHt0aGlzLl9uZXh0U2NvcGUrK31gO1xuICAgIH0gd2hpbGUgKHRoaXMuX3N5bWJvbHMuaGFzKG5hbWUpKTtcbiAgICB0aGlzLl9zeW1ib2xzLmFkZChuYW1lKTtcbiAgICByZXR1cm4gbmFtZTtcbiAgfTtcbiAgcHJpdmF0ZSBjb25zdHJ1Y3RvcihzY29wZU1hcDogTWFwPFByb2dyYW0gfCBCbG9ja1N0YXRlbWVudCwgSVNjb3BlPiwgc3ltYm9sczogU2V0PHN0cmluZz4sIGFnZW50VXJsOiBzdHJpbmcsIHBvbHlmaWxsVXJsOiBzdHJpbmcpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuX3Njb3BlTWFwID0gc2NvcGVNYXA7XG4gICAgdGhpcy5fc3ltYm9scyA9IHN5bWJvbHM7XG4gICAgdGhpcy5fYWdlbnRVcmwgPSBhZ2VudFVybDtcbiAgICB0aGlzLl9wb2x5ZmlsbFVybCA9IHBvbHlmaWxsVXJsO1xuICB9XG5cbiAgcHJvdGVjdGVkIF9pbnNlcnRTY29wZUNyZWF0aW9uQW5kRnVuY3Rpb25TY29wZUFzc2lnbm1lbnRzKG46IE5vZGVbXSwgaXNQcm9ncmFtOiBib29sZWFuKTogTm9kZVtdIHtcbiAgICBsZXQgbW9kczogTm9kZVtdID0gdGhpcy5fc2NvcGUgaW5zdGFuY2VvZiBCbG9ja1Njb3BlICYmIHRoaXMuX3Njb3BlLmhhc0Nsb3NlZE92ZXJWYXJpYWJsZXMgPyBbdGhpcy5fc2NvcGUuZ2V0U2NvcGVDcmVhdGlvblN0YXRlbWVudCgpXSA6IFtdO1xuICAgIGlmIChpc1Byb2dyYW0pIHtcbiAgICAgIGNvbnN0IGluc2VydGlvbnMgPSBbZ2V0QWdlbnRJbnNlcnRpb24odGhpcy5fYWdlbnRVcmwpXTtcbiAgICAgIGlmICh0aGlzLl9wb2x5ZmlsbFVybCAhPT0gbnVsbCkge1xuICAgICAgICBpbnNlcnRpb25zLnB1c2goZ2V0UG9seWZpbGxJbnNlcnRpb24odGhpcy5fcG9seWZpbGxVcmwpKTtcbiAgICAgIH1cbiAgICAgIG1vZHMgPSAoPE5vZGVbXT4gW2dldFByb2dyYW1QcmVsdWRlKGluc2VydGlvbnMpXSkuY29uY2F0KG1vZHMpO1xuICAgIH1cbiAgICBtb2RzID0gbW9kcy5jb25jYXQodGhpcy5fc2NvcGUuZ2V0U2NvcGVBc3NpZ25tZW50cygpKTtcbiAgICBpZiAobW9kcy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBuO1xuICAgIH1cbiAgICBjb25zdCBpc1N0cmljdCA9IHRoaXMuX2lzU3RyaWN0KG4pO1xuICAgIGNvbnN0IG9mZnNldCA9IGlzU3RyaWN0ID8gMSA6IDA7XG4gICAgcmV0dXJuIG4uc2xpY2UoMCwgb2Zmc2V0KS5jb25jYXQobW9kcykuY29uY2F0KG4uc2xpY2Uob2Zmc2V0KSk7XG4gIH1cblxuICBwdWJsaWMgUHJvZ3JhbShwOiBQcm9ncmFtKTogUHJvZ3JhbSB7XG4gICAgdGhpcy5fc2NvcGUgPSB0aGlzLl9zY29wZU1hcC5nZXQocCk7XG4gICAgdGhpcy5fc2NvcGUuZmluYWxpemUodGhpcy5fZ2V0TmV4dFNjb3BlKTtcbiAgICBjb25zdCBydiA9IHN1cGVyLlByb2dyYW0ocCk7XG4gICAgcC5ib2R5ID0gPGFueT4gdGhpcy5faW5zZXJ0U2NvcGVDcmVhdGlvbkFuZEZ1bmN0aW9uU2NvcGVBc3NpZ25tZW50cyhwLmJvZHksIHRydWUpO1xuICAgIHRoaXMuX3Njb3BlID0gbnVsbDtcbiAgICByZXR1cm4gcnY7XG4gIH1cblxuICBwdWJsaWMgQmxvY2tTdGF0ZW1lbnQoYnM6IEJsb2NrU3RhdGVtZW50KTogQmxvY2tTdGF0ZW1lbnQge1xuICAgIGNvbnN0IG9sZEJzID0gdGhpcy5fc2NvcGU7XG4gICAgdGhpcy5fc2NvcGUgPSB0aGlzLl9zY29wZU1hcC5nZXQoYnMpO1xuICAgIHRoaXMuX3Njb3BlLmZpbmFsaXplKHRoaXMuX2dldE5leHRTY29wZSk7XG4gICAgY29uc3QgcnYgPSBzdXBlci5CbG9ja1N0YXRlbWVudChicyk7XG4gICAgcnYuYm9keSA9IDxhbnk+IHRoaXMuX2luc2VydFNjb3BlQ3JlYXRpb25BbmRGdW5jdGlvblNjb3BlQXNzaWdubWVudHMocnYuYm9keSwgZmFsc2UpO1xuICAgIHRoaXMuX3Njb3BlID0gb2xkQnM7XG4gICAgcmV0dXJuIHJ2O1xuICB9XG5cbiAgcHVibGljIElkZW50aWZpZXIoaTogSWRlbnRpZmllcik6IElkZW50aWZpZXIgfCBNZW1iZXJFeHByZXNzaW9uIHtcbiAgICBjb25zdCB0byA9IHRoaXMuX3Njb3BlLnNob3VsZE1vdmVUbyhpLm5hbWUpO1xuICAgIGlmICh0bykge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogXCJNZW1iZXJFeHByZXNzaW9uXCIsXG4gICAgICAgIGNvbXB1dGVkOiBmYWxzZSxcbiAgICAgICAgb2JqZWN0OiB7XG4gICAgICAgICAgdHlwZTogXCJJZGVudGlmaWVyXCIsXG4gICAgICAgICAgbmFtZTogdG8sXG4gICAgICAgICAgbG9jOiBpLmxvY1xuICAgICAgICB9LFxuICAgICAgICBwcm9wZXJ0eToge1xuICAgICAgICAgIHR5cGU6IFwiSWRlbnRpZmllclwiLFxuICAgICAgICAgIG5hbWU6IGkubmFtZSxcbiAgICAgICAgICBsb2M6IGkubG9jXG4gICAgICAgIH0sXG4gICAgICAgIGxvYzogaS5sb2NcbiAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiBpO1xuICB9XG5cbiAgcHVibGljIFZhcmlhYmxlRGVjbGFyYXRvcihkZWNsOiBWYXJpYWJsZURlY2xhcmF0b3IpOiBWYXJpYWJsZURlY2xhcmF0b3IgfCBNZW1iZXJFeHByZXNzaW9uIHwgRXhwcmVzc2lvblN0YXRlbWVudCB7XG4gICAgY29uc3QgaWQgPSBkZWNsLmlkO1xuICAgIGlmIChpZC50eXBlICE9PSBcIklkZW50aWZpZXJcIikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBEb2VzIG5vdCBzdXBwb3J0IHZhcmlhYmxlIGRlY2xhcmF0aW9ucyB3aXRoIG5vbi1pZGVudGlmaWVycy5gKTtcbiAgICB9XG4gICAgY29uc3QgaW5pdCA9IGRlY2wuaW5pdDtcbiAgICBpZiAoaW5pdCkge1xuICAgICAgZGVjbC5pbml0ID0gKDxhbnk+IHRoaXNbaW5pdC50eXBlXSkoaW5pdCk7XG4gICAgfVxuICAgIGNvbnN0IG5ld0lkID0gdGhpcy5JZGVudGlmaWVyKGlkKTtcbiAgICBpZiAobmV3SWQudHlwZSA9PT0gXCJNZW1iZXJFeHByZXNzaW9uXCIpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHR5cGU6IFwiRXhwcmVzc2lvblN0YXRlbWVudFwiLFxuICAgICAgICBleHByZXNzaW9uOiB7XG4gICAgICAgICAgdHlwZTogXCJBc3NpZ25tZW50RXhwcmVzc2lvblwiLFxuICAgICAgICAgIG9wZXJhdG9yOiBcIj1cIixcbiAgICAgICAgICBsZWZ0OiBuZXdJZCxcbiAgICAgICAgICByaWdodDogZGVjbC5pbml0ID8gZGVjbC5pbml0IDogeyB0eXBlOiBcIklkZW50aWZpZXJcIiwgbmFtZTogXCJ1bmRlZmluZWRcIiwgbG9jOiBkZWNsLmxvYyB9LFxuICAgICAgICAgIGxvYzogZGVjbC5sb2NcbiAgICAgICAgfSxcbiAgICAgICAgbG9jOiBkZWNsLmxvY1xuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGRlY2w7XG4gICAgfVxuICB9XG5cbiAgcHVibGljIFZhcmlhYmxlRGVjbGFyYXRpb24odmQ6IFZhcmlhYmxlRGVjbGFyYXRpb24pOiBWYXJpYWJsZURlY2xhcmF0aW9uIHwgTXVsdGlwbGVTdGF0ZW1lbnRzIHwgRXhwcmVzc2lvblN0YXRlbWVudCB7XG4gICAgLy8gTm90ZTogT3JkZXIgaXMgaW1wb3J0YW50LCBhcyBpbml0aWFsaXplcnMgbWF5IGhhdmUgc2lkZSBlZmZlY3RzLlxuICAgIGNvbnN0IG5ld0RlY2xzID0gdmQuZGVjbGFyYXRpb25zLm1hcCgoZCkgPT4gdGhpcy5WYXJpYWJsZURlY2xhcmF0b3IoZCkpO1xuICAgIGxldCBzID0gbmV3IEFycmF5PEV4cHJlc3Npb25TdGF0ZW1lbnQgfCBWYXJpYWJsZURlY2xhcmF0aW9uPigpO1xuICAgIGxldCBjdXJyZW50RGVjbHMgPSBuZXcgQXJyYXk8VmFyaWFibGVEZWNsYXJhdG9yPigpO1xuICAgIGNvbnN0IGxlbiA9IG5ld0RlY2xzLmxlbmd0aDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICBjb25zdCBkID0gbmV3RGVjbHNbaV07XG4gICAgICBzd2l0Y2ggKGQudHlwZSkge1xuICAgICAgICBjYXNlIFwiVmFyaWFibGVEZWNsYXJhdG9yXCI6XG4gICAgICAgICAgY3VycmVudERlY2xzLnB1c2goZCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJNZW1iZXJFeHByZXNzaW9uXCI6XG4gICAgICAgICAgLy8gTm8gaW5pdGlhbGl6ZXI7IHNpZGUtZWZmZWN0IGZyZWUuIERvbid0IGVtaXQgYW55dGhpbmcuXG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJFeHByZXNzaW9uU3RhdGVtZW50XCI6XG4gICAgICAgICAgaWYgKGN1cnJlbnREZWNscy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBzLnB1c2goZGVjbGFyYXRpb25Gcm9tRGVjbGFyYXRvcnModmQua2luZCwgY3VycmVudERlY2xzKSk7XG4gICAgICAgICAgICBjdXJyZW50RGVjbHMgPSBbXTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcy5wdXNoKGQpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChjdXJyZW50RGVjbHMubGVuZ3RoID09PSB2ZC5kZWNsYXJhdGlvbnMubGVuZ3RoKSB7XG4gICAgICBzLnB1c2godmQpO1xuICAgIH0gZWxzZSBpZiAoY3VycmVudERlY2xzLmxlbmd0aCA+IDApIHtcbiAgICAgIHMucHVzaChkZWNsYXJhdGlvbkZyb21EZWNsYXJhdG9ycyh2ZC5raW5kLCBjdXJyZW50RGVjbHMpKTtcbiAgICB9XG5cbiAgICBpZiAocy5sZW5ndGggPT09IDApIHtcbiAgICAgIC8vIFJldHVybiBhbiBlbXB0eSB2YXJpYWJsZSBkZWNsYXJhdG9yLCB3aGljaCB3b3JrcyB3aGVuXG4gICAgICAvLyB0aGlzIGlzIHVzZWQgYXMgYW4gZXhwcmVzc2lvbiBvciBhIHN0YXRlbWVudC5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHR5cGU6IFwiVmFyaWFibGVEZWNsYXJhdGlvblwiLFxuICAgICAgICBraW5kOiBcInZhclwiLFxuICAgICAgICBkZWNsYXJhdGlvbnM6IFt7XG4gICAgICAgICAgdHlwZTogXCJWYXJpYWJsZURlY2xhcmF0b3JcIixcbiAgICAgICAgICBpZDogeyB0eXBlOiBcIklkZW50aWZpZXJcIiwgbmFtZTogdGhpcy5fZ2V0TmV4dFNjb3BlKCl9XG4gICAgICAgIH1dXG4gICAgICB9O1xuICAgIH0gZWxzZSBpZiAocy5sZW5ndGggIT09IDEpIHtcbiAgICAgIC8vIEVtaXQgYWxzbyBpZiBsZW5ndGggaXMgMCEhXG4gICAgICByZXR1cm4ge1xuICAgICAgICB0eXBlOiBcIk11bHRpcGxlU3RhdGVtZW50c1wiLFxuICAgICAgICBib2R5OiBzXG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gc1swXTtcbiAgICB9XG4gIH1cblxuICBwcm90ZWN0ZWQgX0ZvckluQW5kT2ZTdGF0ZW1lbnQobjogRm9ySW5TdGF0ZW1lbnQpOiBGb3JJblN0YXRlbWVudDtcbiAgcHJvdGVjdGVkIF9Gb3JJbkFuZE9mU3RhdGVtZW50KG46IEZvck9mU3RhdGVtZW50KTogRm9yT2ZTdGF0ZW1lbnQ7XG4gIHByb3RlY3RlZCBfRm9ySW5BbmRPZlN0YXRlbWVudChmczogRm9ySW5TdGF0ZW1lbnQgfCBGb3JPZlN0YXRlbWVudCk6IEZvckluU3RhdGVtZW50IHwgRm9yT2ZTdGF0ZW1lbnQge1xuICAgIGNvbnN0IHJ2ID0gc3VwZXIuX0ZvckluQW5kT2ZTdGF0ZW1lbnQoPGFueT4gZnMpO1xuICAgIGNvbnN0IGxlZnQgPSBydi5sZWZ0O1xuICAgIC8vIENhbm5vdCBoYXZlIHN0YXRlbWVudHMgb24gdGhlIGxlZnQgb2YgYSBgZm9yIGluYCBvciBgZm9yIG9mYC5cbiAgICAvLyBVbndyYXAgaW50byBhbiBleHByZXNzaW9uLlxuICAgIGlmICgoPGFueT4gbGVmdCkudHlwZSA9PT0gXCJFeHByZXNzaW9uU3RhdGVtZW50XCIpIHtcbiAgICAgIHJ2LmxlZnQgPSAoPEV4cHJlc3Npb25TdGF0ZW1lbnQ+PGFueT4gbGVmdCkuZXhwcmVzc2lvbjtcbiAgICAgIGlmIChydi5sZWZ0LnR5cGUgPT09IFwiQXNzaWdubWVudEV4cHJlc3Npb25cIikge1xuICAgICAgICBydi5sZWZ0ID0gcnYubGVmdC5sZWZ0IGFzIE1lbWJlckV4cHJlc3Npb247XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBydjtcbiAgfVxuXG4gIHB1YmxpYyBGb3JTdGF0ZW1lbnQoZjogRm9yU3RhdGVtZW50KTogRm9yU3RhdGVtZW50IHwgTXVsdGlwbGVTdGF0ZW1lbnRzIHtcbiAgICBjb25zdCBydiA9IDxGb3JTdGF0ZW1lbnQ+IHN1cGVyLkZvclN0YXRlbWVudChmKTtcbiAgICBjb25zdCBpbml0ID0gcnYuaW5pdDtcbiAgICAvLyBDYW5ub3QgaGF2ZSBzdGF0ZW1lbnRzIGZvciB0aGUgaW5pdGlhbGl6YXRpb24gZXhwcmVzc2lvbi5cbiAgICAvLyBVbndyYXAgaW50byBhbiBleHByZXNzaW9uLlxuICAgIGlmIChpbml0ICYmICg8YW55PiBpbml0KS50eXBlID09PSBcIkV4cHJlc3Npb25TdGF0ZW1lbnRcIikge1xuICAgICAgcnYuaW5pdCA9ICg8RXhwcmVzc2lvblN0YXRlbWVudD4gPGFueT4gaW5pdCkuZXhwcmVzc2lvbjtcbiAgICB9XG4gICAgcmV0dXJuIHJ2O1xuICB9XG5cbiAgcHVibGljIENhbGxFeHByZXNzaW9uKGNlOiBDYWxsRXhwcmVzc2lvbik6IENhbGxFeHByZXNzaW9uIHtcbiAgICBjb25zdCBvbGRDYWxsZWUgPSBjZS5jYWxsZWU7XG4gICAgY29uc3QgcnYgPSBzdXBlci5DYWxsRXhwcmVzc2lvbihjZSk7XG4gICAgY29uc3QgY2FsbGVlID0gcnYuY2FsbGVlO1xuICAgIGNvbnN0IHNjb3BlSWQgPSB0aGlzLl9zY29wZS5zY29wZUlkZW50aWZpZXI7XG4gICAgc3dpdGNoIChjYWxsZWUudHlwZSkge1xuICAgICAgY2FzZSBcIklkZW50aWZpZXJcIjpcbiAgICAgICAgaWYgKGNhbGxlZS5uYW1lID09PSBcImV2YWxcIikge1xuICAgICAgICAgIGNhbGxlZS5uYW1lID0gXCIkJCRSRVdSSVRFX0VWQUwkJCRcIjtcbiAgICAgICAgICBydi5hcmd1bWVudHMudW5zaGlmdCh7XG4gICAgICAgICAgICB0eXBlOiBcIklkZW50aWZpZXJcIixcbiAgICAgICAgICAgIG5hbWU6IHNjb3BlSWRcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJNZW1iZXJFeHByZXNzaW9uXCI6XG4gICAgICAgIGlmIChvbGRDYWxsZWUudHlwZSA9PT0gXCJJZGVudGlmaWVyXCIpIHtcbiAgICAgICAgICAvLyBXZSBtb3ZlZCB0aGUgdGFyZ2V0IGludG8gdGhlIGhlYXAuXG4gICAgICAgICAgLy8gVHJhbnNsYXRlIGludG8gYSBMb2dpY2FsRXhwcmVzc2lvbiB0byBwcmVzZXJ2ZSB0aGUgdmFsdWUgb2YgYHRoaXNgLlxuICAgICAgICAgIHJ2LmNhbGxlZSA9IHtcbiAgICAgICAgICAgIHR5cGU6IFwiTG9naWNhbEV4cHJlc3Npb25cIixcbiAgICAgICAgICAgIG9wZXJhdG9yOiBcInx8XCIsXG4gICAgICAgICAgICBsZWZ0OiBjYWxsZWUsXG4gICAgICAgICAgICByaWdodDogY2FsbGVlLFxuICAgICAgICAgICAgbG9jOiBjYWxsZWUubG9jXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICB9XG4gICAgcmV0dXJuIHJ2O1xuICB9XG5cbiAgcHVibGljIEZ1bmN0aW9uRXhwcmVzc2lvbihmZTogRnVuY3Rpb25FeHByZXNzaW9uKTogQ2FsbEV4cHJlc3Npb24gfCBGdW5jdGlvbkV4cHJlc3Npb24ge1xuICAgIGNvbnN0IGlzR2V0dGVyT3JTZXR0ZXIgPSB0aGlzLl9uZXh0RnVuY3Rpb25FeHByZXNzaW9uSXNHZXR0ZXJPclNldHRlcjtcbiAgICB0aGlzLl9uZXh0RnVuY3Rpb25FeHByZXNzaW9uSXNHZXR0ZXJPclNldHRlciA9IGZhbHNlO1xuICAgIGNvbnN0IHJ2ID0gPEZ1bmN0aW9uRXhwcmVzc2lvbj4gc3VwZXIuRnVuY3Rpb25FeHByZXNzaW9uKGZlKTtcbiAgICBpZiAoaXNHZXR0ZXJPclNldHRlcikge1xuICAgICAgLy8gVHJhbnNmb3JtYXRpb24gaXMgbm90IGFwcGxpY2FibGUuXG4gICAgICByZXR1cm4gcnY7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFNjb3BlIGFzc2lnbm1lbnQuXG4gICAgICByZXR1cm4gZ2V0RXhwcmVzc2lvblRyYW5zZm9ybShydiwgdGhpcy5fc2NvcGUuc2NvcGVJZGVudGlmaWVyKTtcbiAgICB9XG4gIH1cblxuICAvKnB1YmxpYyBVcGRhdGVFeHByZXNzaW9uKHVlOiBVcGRhdGVFeHByZXNzaW9uKTogVXBkYXRlRXhwcmVzc2lvbiB8IFNlcXVlbmNlRXhwcmVzc2lvbiB7XG4gICAgY29uc3Qgb2xkQXJnID0gdWUuYXJndW1lbnQ7XG4gICAgY29uc3QgcnYgPSBzdXBlci5VcGRhdGVFeHByZXNzaW9uKHVlKTtcbiAgICBjb25zdCBhcmcgPSB1ZS5hcmd1bWVudDtcbiAgICBpZiAoIXRoaXMuX2lzU3RyaWN0ICYmIG9sZEFyZy50eXBlICE9PSBhcmcudHlwZSAmJiBvbGRBcmcudHlwZSA9PT0gXCJJZGVudGlmaWVyXCIgJiYgdGhpcy5fYmxvY2tTY29wZS5nZXRUeXBlKG9sZEFyZy5uYW1lKSA9PT0gVmFyVHlwZS5BUkcpIHtcbiAgICAgIC8vIFVwZGF0ZSBpcyBhcHBsaWVkIHRvIGFuIGFyZ3VtZW50IHRoYXQgd2FzIG1vdmVkIHRvIHRoZSBoZWFwLlxuICAgICAgLy8gVHVybiBpbnRvIHNlcXVlbmNlIGV4cHJlc3Npb24gc28gUkhTIGlzIGNvbnNpc3RlbnQuXG4gICAgICAvLyBOT09PTy4gRG9lc24ndCB3b3JrIGZvciB2YXIgYSA9IGwrKztcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHR5cGU6IFwiU2VxdWVuY2VFeHByZXNzaW9uXCIsXG4gICAgICAgIGV4cHJlc3Npb25zOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgdHlwZTogXCJVcGRhdGVFeHByZXNzaW9uXCIsXG4gICAgICAgICAgICBvcGVyYXRvcjogdWUub3BlcmF0b3IsXG4gICAgICAgICAgICBhcmd1bWVudDogb2xkQXJnLFxuICAgICAgICAgICAgcHJlZml4OiB1ZS5wcmVmaXgsXG4gICAgICAgICAgICBsb2M6IHVlLmxvY1xuICAgICAgICAgIH0sXG4gICAgICAgICAgcnZcbiAgICAgICAgXSxcbiAgICAgICAgbG9jOiB1ZS5sb2NcbiAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiBydjtcbiAgfSovXG5cbiAgcHVibGljIEFzc2lnbm1lbnRFeHByZXNzaW9uKG5vZGU6IEFzc2lnbm1lbnRFeHByZXNzaW9uKTogQXNzaWdubWVudEV4cHJlc3Npb24ge1xuICAgIGNvbnN0IG9sZExlZnQgPSBub2RlLmxlZnQ7XG4gICAgY29uc3QgcnYgPSBzdXBlci5Bc3NpZ25tZW50RXhwcmVzc2lvbihub2RlKTtcbiAgICAvLyBDaGVjayBpZiBMSFMgaXMgYW4gYXJndW1lbnQgYW5kIGlmIHdlIGFyZSBub3QgaW4gc3RyaWN0IG1vZGUuXG4gICAgLy8gSWYgc28sIGFyZ3VtZW50cyBvYmplY3QgaXMgYWxpYXNlZCB0byBpbmRpdmlkdWFsIGFyZ3VtZW50cy4gU29tZSBjb2RlIHJlbGllcyBvbiB0aGlzIGFsaWFzaW5nLlxuICAgIGNvbnN0IGxlZnQgPSBydi5sZWZ0O1xuICAgIGlmICghdGhpcy5faXNTdHJpY3QgJiYgb2xkTGVmdC50eXBlICE9PSBsZWZ0LnR5cGUgJiYgb2xkTGVmdC50eXBlID09PSBcIklkZW50aWZpZXJcIiAmJiB0aGlzLl9zY29wZS5nZXRUeXBlKG9sZExlZnQubmFtZSkgPT09IFZhclR5cGUuQVJHKSB7XG4gICAgICAvLyBSZXdyaXRlIFJIUyB0byBhc3NpZ24gdG8gYWN0dWFsIGFyZ3VtZW50IHZhcmlhYmxlLCB0b28uXG4gICAgICAvLyBXb3JrcyBldmVuIGlmIFJIUyBpcyArPSwgZXRjLlxuICAgICAgcmV0dXJuIDxBc3NpZ25tZW50RXhwcmVzc2lvbj4ge1xuICAgICAgICB0eXBlOiBcIkFzc2lnbm1lbnRFeHByZXNzaW9uXCIsXG4gICAgICAgIG9wZXJhdG9yOiBcIj1cIixcbiAgICAgICAgbGVmdDoge1xuICAgICAgICAgIHR5cGU6IFwiSWRlbnRpZmllclwiLFxuICAgICAgICAgIG5hbWU6IG9sZExlZnQubmFtZVxuICAgICAgICB9LFxuICAgICAgICByaWdodDogcnYsXG4gICAgICAgIGxvYzogcnYubG9jXG4gICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4gcnY7XG4gIH1cblxuICBwdWJsaWMgV2l0aFN0YXRlbWVudChub2RlOiBXaXRoU3RhdGVtZW50KTogV2l0aFN0YXRlbWVudCB8IEJsb2NrU3RhdGVtZW50IHtcbiAgICBjb25zdCBpZCA9IHRoaXMuX2dldE5leHRTY29wZSgpO1xuICAgIGxldCB2OiBWYXJpYWJsZURlY2xhcmF0aW9uID0ge1xuICAgICAgdHlwZTogXCJWYXJpYWJsZURlY2xhcmF0aW9uXCIsXG4gICAgICBraW5kOiBcInZhclwiLFxuICAgICAgZGVjbGFyYXRpb25zOiBbe1xuICAgICAgICB0eXBlOiBcIlZhcmlhYmxlRGVjbGFyYXRvclwiLFxuICAgICAgICBpZDogeyB0eXBlOiBcIklkZW50aWZpZXJcIiwgbmFtZTogaWQgfSxcbiAgICAgICAgaW5pdDoge1xuICAgICAgICAgIHR5cGU6IFwiQ2FsbEV4cHJlc3Npb25cIixcbiAgICAgICAgICBjYWxsZWU6IHtcbiAgICAgICAgICAgIHR5cGU6IFwiSWRlbnRpZmllclwiLFxuICAgICAgICAgICAgbmFtZTogXCIkJCRDUkVBVEVfV0lUSF9TQ09QRSQkJFwiXG4gICAgICAgICAgfSxcbiAgICAgICAgICBhcmd1bWVudHM6Wyg8YW55PiB0aGlzW25vZGUub2JqZWN0LnR5cGVdKShub2RlLm9iamVjdCksIHsgdHlwZTogXCJJZGVudGlmaWVyXCIsIG5hbWU6IHRoaXMuX3Njb3BlLnNjb3BlSWRlbnRpZmllciB9XVxuICAgICAgICB9XG4gICAgICB9XSxcbiAgICAgIGxvYzogbm9kZS5vYmplY3QubG9jXG4gICAgfTtcbiAgICBub2RlLm9iamVjdCA9IHtcbiAgICAgIHR5cGU6IFwiSWRlbnRpZmllclwiLFxuICAgICAgbmFtZTogaWRcbiAgICB9O1xuICAgIGNvbnN0IHNjb3BlID0gPEJsb2NrU2NvcGU+IHRoaXMuX3Njb3BlTWFwLmdldCg8QmxvY2tTdGF0ZW1lbnQ+IG5vZGUuYm9keSk7XG4gICAgaWYgKCEoc2NvcGUucGFyZW50IGluc3RhbmNlb2YgUHJveHlTY29wZSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgPyE/PyEhP2ApO1xuICAgIH1cbiAgICBzY29wZS5wYXJlbnQuc2NvcGVJZGVudGlmaWVyID0gaWQ7XG4gICAgY29uc3QgcnYgPSB0aGlzLkJsb2NrU3RhdGVtZW50KDxCbG9ja1N0YXRlbWVudD4gbm9kZS5ib2R5KTtcbiAgICBydi5ib2R5ID0gPGFueT4gKDxOb2RlW10+IFt2XSkuY29uY2F0KHJ2LmJvZHkpO1xuICAgIHJldHVybiBydjtcbiAgfVxuXG4gIHB1YmxpYyBQcm9wZXJ0eShwOiBQcm9wZXJ0eSk6IFByb3BlcnR5IHtcbiAgICBzd2l0Y2ggKHAua2luZCkge1xuICAgICAgY2FzZSBcImdldFwiOlxuICAgICAgY2FzZSBcInNldFwiOlxuICAgICAgICB0aGlzLl9uZXh0RnVuY3Rpb25FeHByZXNzaW9uSXNHZXR0ZXJPclNldHRlciA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcImluaXRcIjpcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVucmVjb2duaXplZCBwcm9wZXJ0eSBraW5kOiAke3Aua2luZH1gKTtcbiAgICB9XG4gICAgcmV0dXJuIHN1cGVyLlByb3BlcnR5KHApO1xuICB9XG5cbiAgcHVibGljIE9iamVjdEV4cHJlc3Npb24objogT2JqZWN0RXhwcmVzc2lvbik6IE9iamVjdEV4cHJlc3Npb24gfCBDYWxsRXhwcmVzc2lvbiB7XG4gICAgY29uc3Qgb2xkR2V0dGVyU2V0dGVyID0gdGhpcy5fZ2V0dGVyT3JTZXR0ZXJWaXNpdGVkO1xuICAgIHRoaXMuX2dldHRlck9yU2V0dGVyVmlzaXRlZCA9IGZhbHNlO1xuICAgIGNvbnN0IHJ2ID0gc3VwZXIuT2JqZWN0RXhwcmVzc2lvbihuKTtcbiAgICBjb25zdCBoYXNHZXR0ZXJTZXR0ZXIgPSB0aGlzLl9nZXR0ZXJPclNldHRlclZpc2l0ZWQ7XG4gICAgdGhpcy5fZ2V0dGVyT3JTZXR0ZXJWaXNpdGVkID0gb2xkR2V0dGVyU2V0dGVyO1xuICAgIGlmIChoYXNHZXR0ZXJTZXR0ZXIpIHtcbiAgICAgIHJldHVybiBnZXRPYmplY3RFeHByZXNzaW9uVHJhbnNmb3JtKG4sIHRoaXMuX3Njb3BlLnNjb3BlSWRlbnRpZmllcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBydjtcbiAgICB9XG4gIH1cblxuICAvLyBTaG9ydGNvbWluZ3M6ICsrIHRvIGFyZ3VtZW50cy5cbn1cblxuZnVuY3Rpb24gZXhwb3NlQ2xvc3VyZVN0YXRlSW50ZXJuYWwoZmlsZW5hbWU6IHN0cmluZywgc291cmNlOiBzdHJpbmcsIHNvdXJjZU1hcDogU291cmNlTWFwR2VuZXJhdG9yLCBhZ2VudFVybDogc3RyaW5nLCBwb2x5ZmlsbFVybDogc3RyaW5nLCBldmFsU2NvcGVOYW1lPzogc3RyaW5nKTogc3RyaW5nIHtcbiAgbGV0IGFzdCA9IHBhcnNlSmF2YVNjcmlwdChzb3VyY2UsIHsgbG9jOiB0cnVlIH0pO1xuICB7XG4gICAgY29uc3QgZmlyc3RTdGF0ZW1lbnQgPSBhc3QuYm9keVswXTtcbiAgICBpZiAoZmlyc3RTdGF0ZW1lbnQgJiYgZmlyc3RTdGF0ZW1lbnQudHlwZSA9PT0gXCJFeHByZXNzaW9uU3RhdGVtZW50XCIpIHtcbiAgICAgIC8vIEVzcHJpbWEgZmVhdHVyZS5cbiAgICAgIGlmICgoPGFueT4gZmlyc3RTdGF0ZW1lbnQpLmRpcmVjdGl2ZSA9PT0gXCJubyB0cmFuc2Zvcm1cIikge1xuICAgICAgICByZXR1cm4gc291cmNlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGNvbnN0IG1hcCA9IG5ldyBNYXA8UHJvZ3JhbSB8IEJsb2NrU3RhdGVtZW50LCBCbG9ja1Njb3BlPigpO1xuICBjb25zdCBzeW1ib2xzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGFzdCA9IFNjb3BlQ3JlYXRpb25WaXNpdG9yLlZpc2l0KFxuICAgIEVzY2FwZUFuYWx5c2lzVmlzaXRvci5WaXNpdChTY29wZVNjYW5uaW5nVmlzaXRvci5WaXNpdChhc3QsIG1hcCwgc3ltYm9scywgZXZhbFNjb3BlTmFtZSA/IG5ldyBCbG9ja1Njb3BlKG5ldyBQcm94eVNjb3BlKGV2YWxTY29wZU5hbWUpLCB0cnVlKSA6IHVuZGVmaW5lZCksIG1hcCksIG1hcCwgc3ltYm9scywgYWdlbnRVcmwsIHBvbHlmaWxsVXJsKTtcbiAgcmV0dXJuIGdlbmVyYXRlSmF2YVNjcmlwdChhc3QsIHsgc291cmNlTWFwIH0pO1xufVxuXG5mdW5jdGlvbiBlbWJlZFNvdXJjZU1hcChzb3VyY2U6IHN0cmluZywgc291cmNlTWFwOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gYCR7c291cmNlfS8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtiYXNlNjQsJHtuZXcgQnVmZmVyKHNvdXJjZU1hcCwgXCJ1dGY4XCIpLnRvU3RyaW5nKFwiYmFzZTY0XCIpfWA7XG59XG5cbmZ1bmN0aW9uIG1lcmdlTWFwcyhmaWxlOiBzdHJpbmcsIHNvdXJjZTogc3RyaW5nLCByYXdNYXAxOiBSYXdTb3VyY2VNYXAsIHJhd01hcDI6IFJhd1NvdXJjZU1hcCk6IHN0cmluZyB7XG4gIGNvbnN0IG1hcDEgPSBuZXcgU291cmNlTWFwQ29uc3VtZXIocmF3TWFwMSk7XG4gIGNvbnN0IG1hcDIgPSBuZXcgU291cmNlTWFwQ29uc3VtZXIocmF3TWFwMik7XG4gIGNvbnN0IG91dCA9IG5ldyBTb3VyY2VNYXBHZW5lcmF0b3IoeyBmaWxlIH0pO1xuXG4gIG1hcDIuZWFjaE1hcHBpbmcoKG1hcCkgPT4ge1xuICAgIGNvbnN0IG9nID0gbWFwMS5vcmlnaW5hbFBvc2l0aW9uRm9yKHtcbiAgICAgIGxpbmU6IG1hcC5vcmlnaW5hbExpbmUsXG4gICAgICBjb2x1bW46IG1hcC5vcmlnaW5hbENvbHVtblxuICAgIH0pO1xuICAgIGlmIChvZyAmJiBvZy5saW5lICE9PSBudWxsICYmIG9nLmNvbHVtbiAhPT0gbnVsbCkge1xuICAgICAgLy8gZ2VuZXJhdGVkIG9yaWdpbmFsIHNvdXJjZSBuYW1lXG4gICAgICBvdXQuYWRkTWFwcGluZyh7XG4gICAgICAgIGdlbmVyYXRlZDoge1xuICAgICAgICAgIGxpbmU6IG1hcC5nZW5lcmF0ZWRMaW5lLFxuICAgICAgICAgIGNvbHVtbjogbWFwLmdlbmVyYXRlZENvbHVtblxuICAgICAgICB9LFxuICAgICAgICBvcmlnaW5hbDogb2csXG4gICAgICAgIG5hbWU6IG1hcC5uYW1lLFxuICAgICAgICBzb3VyY2U6IG1hcC5zb3VyY2VcbiAgICAgIH0pO1xuICAgIH1cbiAgfSk7XG4gIG91dC5zZXRTb3VyY2VDb250ZW50KGZpbGUsIHNvdXJjZSk7XG4gIHJldHVybiBvdXQudG9TdHJpbmcoKTtcbn1cblxuZnVuY3Rpb24gdHJ5SlNUcmFuc2Zvcm0oZmlsZW5hbWU6IHN0cmluZywgc291cmNlOiBzdHJpbmcsIHRyYW5zZm9ybTogKGZpbGVuYW1lOiBzdHJpbmcsIHNvdXJjZTogc3RyaW5nLCBzb3VyY2VNYXA6IFNvdXJjZU1hcEdlbmVyYXRvciwgbmVlZHNCYWJlbDogYm9vbGVhbikgPT4gc3RyaW5nKTogc3RyaW5nIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBzb3VyY2VNYXAgPSBuZXcgU291cmNlTWFwR2VuZXJhdG9yKHtcbiAgICAgIGZpbGU6IGZpbGVuYW1lXG4gICAgfSk7XG4gICAgY29uc3QgY29udmVydGVkID0gdHJhbnNmb3JtKGZpbGVuYW1lLCBzb3VyY2UsIHNvdXJjZU1hcCwgZmFsc2UpO1xuICAgIHNvdXJjZU1hcC5zZXRTb3VyY2VDb250ZW50KGZpbGVuYW1lLCBzb3VyY2UpO1xuICAgIHJldHVybiBlbWJlZFNvdXJjZU1hcChjb252ZXJ0ZWQsIHNvdXJjZU1hcC50b1N0cmluZygpKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHRyeSB7XG4gICAgICAvLyBNaWdodCBiZSBFUzIwMTUuIFRyeSB0byB0cmFuc2Zvcm0gd2l0aCBidWJsZSBmaXJzdDsgaXQncyBzaWduaWZpY2FudGx5IGZhc3RlciB0aGFuIGJhYmVsLlxuICAgICAgY29uc3QgdHJhbnNmb3JtZWQgPSBidWJsZShzb3VyY2UsIHsgc291cmNlOiBmaWxlbmFtZSB9KTtcbiAgICAgIGNvbnN0IGNvbnZlcnNpb25Tb3VyY2VNYXAgPSBuZXcgU291cmNlTWFwR2VuZXJhdG9yKHtcbiAgICAgICAgZmlsZTogZmlsZW5hbWVcbiAgICAgIH0pO1xuICAgICAgY29uc3QgY29udmVydGVkID0gdHJhbnNmb3JtKGZpbGVuYW1lLCB0cmFuc2Zvcm1lZC5jb2RlLCBjb252ZXJzaW9uU291cmNlTWFwLCBmYWxzZSk7XG4gICAgICByZXR1cm4gZW1iZWRTb3VyY2VNYXAoY29udmVydGVkLCBtZXJnZU1hcHMoZmlsZW5hbWUsIHNvdXJjZSwgdHJhbnNmb3JtZWQubWFwLCAoY29udmVyc2lvblNvdXJjZU1hcCBhcyBhbnkpLnRvSlNPTigpIGFzIFJhd1NvdXJjZU1hcCkpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIC8vIE1pZ2h0IGJlIGV2ZW4gY3JhemllciBFUzIwMTUhIFVzZSBCYWJlbCAoU0xPV0VTVCBQQVRIKVxuICAgICAgICAvLyBCYWJlbCB3YW50cyB0byBrbm93IHRoZSBleGFjdCBsb2NhdGlvbiBvZiB0aGlzIHByZXNldCBwbHVnaW4uXG4gICAgICAgIC8vIEkgcmVhbGx5IGRvbid0IGxpa2UgQmFiZWwncyAodW4pdXNhYmlsaXR5LlxuICAgICAgICBjb25zdCBlbnZQYXRoID0gZGlybmFtZShyZXF1aXJlLnJlc29sdmUoJ2JhYmVsLXByZXNldC1lbnYvcGFja2FnZS5qc29uJykpO1xuICAgICAgICBjb25zdCB0cmFuc2Zvcm1lZCA9IGJhYmVsKHNvdXJjZSwge1xuICAgICAgICAgIHNvdXJjZU1hcFRhcmdldDogZmlsZW5hbWUsXG4gICAgICAgICAgc291cmNlRmlsZU5hbWU6IGZpbGVuYW1lLFxuICAgICAgICAgIGNvbXBhY3Q6IHRydWUsXG4gICAgICAgICAgc291cmNlTWFwczogdHJ1ZSxcbiAgICAgICAgICAvLyBEaXNhYmxlIG1vZHVsZXMgdG8gZGlzYWJsZSBnbG9iYWwgXCJ1c2Ugc3RyaWN0XCI7IGRlY2xhcmF0aW9uXG4gICAgICAgICAgLy8gaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9hLzM5MjI1NDAzXG4gICAgICAgICAgcHJlc2V0czogW1tlbnZQYXRoLCB7IFwibW9kdWxlc1wiOiBmYWxzZSB9XV1cbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGNvbnZlcnNpb25Tb3VyY2VNYXAgPSBuZXcgU291cmNlTWFwR2VuZXJhdG9yKHtcbiAgICAgICAgICBmaWxlOiBmaWxlbmFtZVxuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgY29udmVydGVkID0gdHJhbnNmb3JtKGZpbGVuYW1lLCB0cmFuc2Zvcm1lZC5jb2RlLCBjb252ZXJzaW9uU291cmNlTWFwLCB0cnVlKTtcbiAgICAgICAgcmV0dXJuIGVtYmVkU291cmNlTWFwKGNvbnZlcnRlZCwgbWVyZ2VNYXBzKGZpbGVuYW1lLCBzb3VyY2UsIDxhbnk+IHRyYW5zZm9ybWVkLm1hcCwgKGNvbnZlcnNpb25Tb3VyY2VNYXAgYXMgYW55KS50b0pTT04oKSBhcyBSYXdTb3VyY2VNYXApKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgVW5hYmxlIHRvIHRyYW5zZm9ybSAke2ZpbGVuYW1lfSAtIGdvaW5nIHRvIHByb2NlZWQgd2l0aCB1bnRyYW5zZm9ybWVkIEphdmFTY3JpcHQhXFxuRXJyb3I6YCk7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgIHJldHVybiBzb3VyY2U7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogRW5zdXJlcyB0aGF0IHRoZSBnaXZlbiBKYXZhU2NyaXB0IHNvdXJjZSBmaWxlIGlzIEVTNSBjb21wYXRpYmxlLlxuICogQHBhcmFtIGZpbGVuYW1lXG4gKiBAcGFyYW0gc291cmNlXG4gKiBAcGFyYW0gYWdlbnRVcmxcbiAqIEBwYXJhbSBwb2x5ZmlsbFVybFxuICogQHBhcmFtIGV2YWxTY29wZU5hbWVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVuc3VyZUVTNShmaWxlbmFtZTogc3RyaW5nLCBzb3VyY2U6IHN0cmluZywgYWdlbnRVcmw9XCJibGVha19hZ2VudC5qc1wiLCBwb2x5ZmlsbFVybD1cImJsZWFrX3BvbHlmaWxsLmpzXCIsIGV2YWxTY29wZU5hbWU/OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdHJ5SlNUcmFuc2Zvcm0oZmlsZW5hbWUsIHNvdXJjZSwgKGZpbGVuYW1lLCBzb3VyY2UsIHNvdXJjZU1hcCwgbmVlZHNCYWJlbCkgPT4ge1xuICAgIGNvbnN0IHZpc2l0b3IgPSBuZXcgRVM1Q2hlY2tpbmdWaXNpdG9yKG5lZWRzQmFiZWwgPyBwb2x5ZmlsbFVybCA6IG51bGwpO1xuICAgIGxldCBhc3QgPSBwYXJzZUphdmFTY3JpcHQoc291cmNlLCB7IGxvYzogdHJ1ZSB9KTtcbiAgICB7XG4gICAgICBjb25zdCBmaXJzdFN0YXRlbWVudCA9IGFzdC5ib2R5WzBdO1xuICAgICAgaWYgKGZpcnN0U3RhdGVtZW50ICYmIGZpcnN0U3RhdGVtZW50LnR5cGUgPT09IFwiRXhwcmVzc2lvblN0YXRlbWVudFwiKSB7XG4gICAgICAgIC8vIEVzcHJpbWEgZmVhdHVyZS5cbiAgICAgICAgaWYgKCg8YW55PiBmaXJzdFN0YXRlbWVudCkuZGlyZWN0aXZlID09PSBcIm5vIHRyYW5zZm9ybVwiKSB7XG4gICAgICAgICAgcmV0dXJuIHNvdXJjZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGFzdCA9IHZpc2l0b3IuUHJvZ3JhbShhc3QpO1xuICAgIHJldHVybiBnZW5lcmF0ZUphdmFTY3JpcHQoYXN0LCB7IHNvdXJjZU1hcCB9KTtcbiAgfSk7XG59XG5cbi8qKlxuICogR2l2ZW4gYSBKYXZhU2NyaXB0IHNvdXJjZSBmaWxlLCBtb2RpZmllcyBhbGwgZnVuY3Rpb24gZGVjbGFyYXRpb25zIGFuZCBleHByZXNzaW9ucyB0byBleHBvc2VcbiAqIHRoZWlyIGNsb3N1cmUgc3RhdGUgb24gdGhlIGZ1bmN0aW9uIG9iamVjdC5cbiAqXG4gKiBAcGFyYW0gc291cmNlIFNvdXJjZSBvZiB0aGUgSmF2YVNjcmlwdCBmaWxlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZXhwb3NlQ2xvc3VyZVN0YXRlKGZpbGVuYW1lOiBzdHJpbmcsIHNvdXJjZTogc3RyaW5nLCBhZ2VudFVybD1cImJsZWFrX2FnZW50LmpzXCIsIHBvbHlmaWxsVXJsPVwiYmxlYWtfcG9seWZpbGwuanNcIiwgZXZhbFNjb3BlTmFtZT86IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiB0cnlKU1RyYW5zZm9ybShmaWxlbmFtZSwgc291cmNlLCAoZmlsZW5hbWUsIHNvdXJjZSwgc291cmNlTWFwLCBuZWVkc0JhYmVsKSA9PiB7XG4gICAgcmV0dXJuIGV4cG9zZUNsb3N1cmVTdGF0ZUludGVybmFsKGZpbGVuYW1lLCBzb3VyY2UsIHNvdXJjZU1hcCwgYWdlbnRVcmwsIG5lZWRzQmFiZWwgPyBwb2x5ZmlsbFVybCA6IG51bGwsIGV2YWxTY29wZU5hbWUpXG4gIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbm9wVHJhbnNmb3JtKGZpbGVuYW1lOiBzdHJpbmcsIHNvdXJjZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgbGV0IGFzdCA9IHBhcnNlSmF2YVNjcmlwdChzb3VyY2UsIHsgbG9jOiB0cnVlIH0pO1xuICBjb25zdCBzb3VyY2VNYXAgPSBuZXcgU291cmNlTWFwR2VuZXJhdG9yKHtcbiAgICBmaWxlOiBmaWxlbmFtZVxuICB9KTtcbiAgc291cmNlTWFwLnNldFNvdXJjZUNvbnRlbnQoZmlsZW5hbWUsIHNvdXJjZSk7XG4gIGNvbnN0IGNvbnZlcnRlZCA9IGdlbmVyYXRlSmF2YVNjcmlwdChhc3QsIHsgc291cmNlTWFwIH0pO1xuICByZXR1cm4gZW1iZWRTb3VyY2VNYXAoY29udmVydGVkLCBzb3VyY2VNYXAudG9TdHJpbmcoKSk7XG59XG4iXX0=