"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const htmlparser2_1 = require("htmlparser2");
var closure_state_transform_1 = require("./closure_state_transform");
exports.exposeClosureState = closure_state_transform_1.exposeClosureState;
exports.ensureES5 = closure_state_transform_1.ensureES5;
exports.nopTransform = closure_state_transform_1.nopTransform;
const HTML_PARSER_OPTS = { lowerCaseTags: false, lowerCaseAttributeNames: false };
function parseHTML(source) {
    let rv;
    let err;
    const dom = new htmlparser2_1.DomHandler((e, nodes) => {
        rv = nodes;
        err = e;
    });
    const parser = new htmlparser2_1.Parser(dom, HTML_PARSER_OPTS);
    parser.write(source);
    parser.end();
    if (err) {
        return null;
    }
    return rv;
}
exports.parseHTML = parseHTML;
function identJSTransform(f, s) {
    return s;
}
/**
 * Inject the injection string into the <head> portion of the HTML source.
 *
 * If <head> is missing, attempts to inject after the <html> tag.
 *
 * @param filename Path to the HTML file.
 * @param source Source of an HTML file.
 * @param injection Content to inject into the head.
 */
function injectIntoHead(filename, source, injection, jsTransform = identJSTransform) {
    const parsedHTML = parseHTML(source);
    if (parsedHTML === null) {
        // Parsing failed.
        return source;
    }
    let htmlNode;
    let headNode;
    let inlineScripts = [];
    function search(n) {
        // Traverse children first to avoid mutating state
        // before it is traversed.
        if (n.children) {
            n.children.forEach(search);
        }
        if (n.name) {
            switch (n.name.toLowerCase()) {
                case 'head':
                    if (!headNode) {
                        headNode = n;
                    }
                    break;
                case 'html':
                    if (!htmlNode) {
                        htmlNode = n;
                    }
                    break;
                case 'script':
                    const attribs = Object.keys(n.attribs);
                    const attribsLower = attribs.map((s) => s.toLowerCase());
                    if (n.attribs && attribsLower.indexOf("src") === -1) {
                        const typeIndex = attribsLower.indexOf("type");
                        if (typeIndex !== -1) {
                            const type = n.attribs[attribs[typeIndex]].toLowerCase();
                            switch (type) {
                                case 'application/javascript':
                                case 'text/javascript':
                                case 'text/x-javascript':
                                case 'text/x-javascript':
                                    break;
                                default:
                                    // IGNORE non-JS script tags.
                                    // These are used for things like templates.
                                    return;
                            }
                        }
                        inlineScripts.push(n);
                    }
                    break;
            }
        }
    }
    parsedHTML.forEach(search);
    if (headNode || htmlNode) {
        const injectionTarget = headNode ? headNode : htmlNode;
        if (!injectionTarget.children) {
            injectionTarget.children = [];
        }
        injectionTarget.children = injection.concat(injectionTarget.children);
    }
    else {
        // AngularJS??
        return source;
    }
    inlineScripts.forEach((n, i) => {
        if (!n.children || n.children.length !== 1) {
            console.log(`Weird! Found JS node with the following children: ${JSON.stringify(n.children)}`);
        }
        n.children[0].data = jsTransform(`${filename}-inline${i}.js`, n.children[0].data);
    });
    return htmlparser2_1.DomUtils.getOuterHTML(parsedHTML);
}
exports.injectIntoHead = injectIntoHead;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNmb3JtYXRpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2xpYi90cmFuc2Zvcm1hdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSw2Q0FBdUU7QUFFdkUscUVBQXNGO0FBQTlFLHVEQUFBLGtCQUFrQixDQUFBO0FBQUUsOENBQUEsU0FBUyxDQUFBO0FBQUUsaURBQUEsWUFBWSxDQUFBO0FBZW5ELE1BQU0sZ0JBQWdCLEdBQUcsRUFBQyxhQUFhLEVBQUUsS0FBSyxFQUFFLHVCQUF1QixFQUFFLEtBQUssRUFBQyxDQUFDO0FBQ2hGLG1CQUEwQixNQUFjO0lBQ3RDLElBQUksRUFBYyxDQUFDO0lBQ25CLElBQUksR0FBUSxDQUFDO0lBQ2IsTUFBTSxHQUFHLEdBQUcsSUFBSSx3QkFBVSxDQUFDLENBQUMsQ0FBTSxFQUFFLEtBQWlCLEVBQUUsRUFBRTtRQUN2RCxFQUFFLEdBQUcsS0FBSyxDQUFDO1FBQ1gsR0FBRyxHQUFHLENBQUMsQ0FBQztJQUNWLENBQUMsQ0FBQyxDQUFDO0lBQ0gsTUFBTSxNQUFNLEdBQUcsSUFBSSxvQkFBVSxDQUFDLEdBQUcsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO0lBQ3JELE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDckIsTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBQ2IsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUNSLE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBQ0QsTUFBTSxDQUFDLEVBQUUsQ0FBQztBQUNaLENBQUM7QUFkRCw4QkFjQztBQUVELDBCQUEwQixDQUFTLEVBQUUsQ0FBUztJQUM1QyxNQUFNLENBQUMsQ0FBQyxDQUFDO0FBQ1gsQ0FBQztBQUVEOzs7Ozs7OztHQVFHO0FBQ0gsd0JBQStCLFFBQWdCLEVBQUUsTUFBYyxFQUFFLFNBQXFCLEVBQUUsY0FBNEQsZ0JBQWdCO0lBQ2xLLE1B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USxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ3hFLENBQUM7SUFBQyxJQUFJLENBQUMsQ0FBQztRQUNOLGNBQWM7UUFDZCxNQUFNLENBQUMsTUFBTSxDQUFDO0lBQ2hCLENBQUM7SUFDRCxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQzdCLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsSUFBSSxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzNDLE9BQU8sQ0FBQyxHQUFHLENBQUMscURBQXFELElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNqRyxDQUFDO1FBQ0QsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUcsV0FBVyxDQUFDLEdBQUcsUUFBUSxVQUFVLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDcEYsQ0FBQyxDQUFDLENBQUM7SUFDSCxNQUFNLENBQUMsc0JBQVEsQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDM0MsQ0FBQztBQXpFRCx3Q0F5RUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1BhcnNlciBhcyBIVE1MUGFyc2VyLCBEb21IYW5kbGVyLCBEb21VdGlsc30gZnJvbSAnaHRtbHBhcnNlcjInO1xuXG5leHBvcnQge2V4cG9zZUNsb3N1cmVTdGF0ZSwgZW5zdXJlRVM1LCBub3BUcmFuc2Zvcm19IGZyb20gJy4vY2xvc3VyZV9zdGF0ZV90cmFuc2Zvcm0nO1xuXG5kZWNsYXJlIG1vZHVsZSBcImh0bWxwYXJzZXIyXCIge1xuICBleHBvcnQgY29uc3QgRG9tSGFuZGxlcjogYW55O1xuICBleHBvcnQgY29uc3QgRG9tVXRpbHM6IGFueTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBIVE1MTm9kZSB7XG4gIHR5cGU6IHN0cmluZztcbiAgbmFtZT86IHN0cmluZztcbiAgZGF0YT86IHN0cmluZztcbiAgY2hpbGRyZW4/OiBIVE1MTm9kZVtdO1xuICBhdHRyaWJzPzoge1tuOiBzdHJpbmddOiBzdHJpbmd9O1xufVxuXG5jb25zdCBIVE1MX1BBUlNFUl9PUFRTID0ge2xvd2VyQ2FzZVRhZ3M6IGZhbHNlLCBsb3dlckNhc2VBdHRyaWJ1dGVOYW1lczogZmFsc2V9O1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlSFRNTChzb3VyY2U6IHN0cmluZyk6IEhUTUxOb2RlW10ge1xuICBsZXQgcnY6IEhUTUxOb2RlW107XG4gIGxldCBlcnI6IGFueTtcbiAgY29uc3QgZG9tID0gbmV3IERvbUhhbmRsZXIoKGU6IGFueSwgbm9kZXM6IEhUTUxOb2RlW10pID0+IHtcbiAgICBydiA9IG5vZGVzO1xuICAgIGVyciA9IGU7XG4gIH0pO1xuICBjb25zdCBwYXJzZXIgPSBuZXcgSFRNTFBhcnNlcihkb20sIEhUTUxfUEFSU0VSX09QVFMpO1xuICBwYXJzZXIud3JpdGUoc291cmNlKTtcbiAgcGFyc2VyLmVuZCgpO1xuICBpZiAoZXJyKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgcmV0dXJuIHJ2O1xufVxuXG5mdW5jdGlvbiBpZGVudEpTVHJhbnNmb3JtKGY6IHN0cmluZywgczogc3RyaW5nKSB7XG4gIHJldHVybiBzO1xufVxuXG4vKipcbiAqIEluamVjdCB0aGUgaW5qZWN0aW9uIHN0cmluZyBpbnRvIHRoZSA8aGVhZD4gcG9ydGlvbiBvZiB0aGUgSFRNTCBzb3VyY2UuXG4gKlxuICogSWYgPGhlYWQ+IGlzIG1pc3NpbmcsIGF0dGVtcHRzIHRvIGluamVjdCBhZnRlciB0aGUgPGh0bWw+IHRhZy5cbiAqXG4gKiBAcGFyYW0gZmlsZW5hbWUgUGF0aCB0byB0aGUgSFRNTCBmaWxlLlxuICogQHBhcmFtIHNvdXJjZSBTb3VyY2Ugb2YgYW4gSFRNTCBmaWxlLlxuICogQHBhcmFtIGluamVjdGlvbiBDb250ZW50IHRvIGluamVjdCBpbnRvIHRoZSBoZWFkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0SW50b0hlYWQoZmlsZW5hbWU6IHN0cmluZywgc291cmNlOiBzdHJpbmcsIGluamVjdGlvbjogSFRNTE5vZGVbXSwganNUcmFuc2Zvcm06IChmaWxlbmFtZTogc3RyaW5nLCBzb3VyY2U6IHN0cmluZykgPT4gc3RyaW5nID0gaWRlbnRKU1RyYW5zZm9ybSk6IHN0cmluZyB7XG4gIGNvbnN0IHBhcnNlZEhUTUwgPSBwYXJzZUhUTUwoc291cmNlKTtcbiAgaWYgKHBhcnNlZEhUTUwgPT09IG51bGwpIHtcbiAgICAvLyBQYXJzaW5nIGZhaWxlZC5cbiAgICByZXR1cm4gc291cmNlO1xuICB9XG5cbiAgbGV0IGh0bWxOb2RlOiBIVE1MTm9kZTtcbiAgbGV0IGhlYWROb2RlOiBIVE1MTm9kZTtcbiAgbGV0IGlubGluZVNjcmlwdHM6IEhUTUxOb2RlW10gPSBbXTtcbiAgZnVuY3Rpb24gc2VhcmNoKG46IEhUTUxOb2RlKSB7XG4gICAgLy8gVHJhdmVyc2UgY2hpbGRyZW4gZmlyc3QgdG8gYXZvaWQgbXV0YXRpbmcgc3RhdGVcbiAgICAvLyBiZWZvcmUgaXQgaXMgdHJhdmVyc2VkLlxuICAgIGlmIChuLmNoaWxkcmVuKSB7XG4gICAgICBuLmNoaWxkcmVuLmZvckVhY2goc2VhcmNoKTtcbiAgICB9XG5cbiAgICBpZiAobi5uYW1lKSB7XG4gICAgICBzd2l0Y2ggKG4ubmFtZS50b0xvd2VyQ2FzZSgpKSB7XG4gICAgICAgIGNhc2UgJ2hlYWQnOlxuICAgICAgICAgIGlmICghaGVhZE5vZGUpIHtcbiAgICAgICAgICAgIGhlYWROb2RlID0gbjtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2h0bWwnOlxuICAgICAgICAgIGlmICghaHRtbE5vZGUpIHtcbiAgICAgICAgICAgIGh0bWxOb2RlID0gbjtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3NjcmlwdCc6XG4gICAgICAgICAgY29uc3QgYXR0cmlicyA9IE9iamVjdC5rZXlzKG4uYXR0cmlicyk7XG4gICAgICAgICAgY29uc3QgYXR0cmlic0xvd2VyID0gYXR0cmlicy5tYXAoKHMpID0+IHMudG9Mb3dlckNhc2UoKSk7XG4gICAgICAgICAgaWYgKG4uYXR0cmlicyAmJiBhdHRyaWJzTG93ZXIuaW5kZXhPZihcInNyY1wiKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIGNvbnN0IHR5cGVJbmRleCA9IGF0dHJpYnNMb3dlci5pbmRleE9mKFwidHlwZVwiKTtcbiAgICAgICAgICAgIGlmICh0eXBlSW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgICAgIGNvbnN0IHR5cGUgPSBuLmF0dHJpYnNbYXR0cmlic1t0eXBlSW5kZXhdXS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICBzd2l0Y2godHlwZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgJ2FwcGxpY2F0aW9uL2phdmFzY3JpcHQnOlxuICAgICAgICAgICAgICAgIGNhc2UgJ3RleHQvamF2YXNjcmlwdCc6XG4gICAgICAgICAgICAgICAgY2FzZSAndGV4dC94LWphdmFzY3JpcHQnOlxuICAgICAgICAgICAgICAgIGNhc2UgJ3RleHQveC1qYXZhc2NyaXB0JzpcbiAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAvLyBJR05PUkUgbm9uLUpTIHNjcmlwdCB0YWdzLlxuICAgICAgICAgICAgICAgICAgLy8gVGhlc2UgYXJlIHVzZWQgZm9yIHRoaW5ncyBsaWtlIHRlbXBsYXRlcy5cbiAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaW5saW5lU2NyaXB0cy5wdXNoKG4pO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcGFyc2VkSFRNTC5mb3JFYWNoKHNlYXJjaCk7XG5cbiAgaWYgKGhlYWROb2RlIHx8IGh0bWxOb2RlKSB7XG4gICAgY29uc3QgaW5qZWN0aW9uVGFyZ2V0ID0gaGVhZE5vZGUgPyBoZWFkTm9kZSA6IGh0bWxOb2RlO1xuICAgIGlmICghaW5qZWN0aW9uVGFyZ2V0LmNoaWxkcmVuKSB7XG4gICAgICBpbmplY3Rpb25UYXJnZXQuY2hpbGRyZW4gPSBbXTtcbiAgICB9XG4gICAgaW5qZWN0aW9uVGFyZ2V0LmNoaWxkcmVuID0gaW5qZWN0aW9uLmNvbmNhdChpbmplY3Rpb25UYXJnZXQuY2hpbGRyZW4pO1xuICB9IGVsc2Uge1xuICAgIC8vIEFuZ3VsYXJKUz8/XG4gICAgcmV0dXJuIHNvdXJjZTtcbiAgfVxuICBpbmxpbmVTY3JpcHRzLmZvckVhY2goKG4sIGkpID0+IHtcbiAgICBpZiAoIW4uY2hpbGRyZW4gfHwgbi5jaGlsZHJlbi5sZW5ndGggIT09IDEpIHtcbiAgICAgIGNvbnNvbGUubG9nKGBXZWlyZCEgRm91bmQgSlMgbm9kZSB3aXRoIHRoZSBmb2xsb3dpbmcgY2hpbGRyZW46ICR7SlNPTi5zdHJpbmdpZnkobi5jaGlsZHJlbil9YCk7XG4gICAgfVxuICAgIG4uY2hpbGRyZW5bMF0uZGF0YSA9IGpzVHJhbnNmb3JtKGAke2ZpbGVuYW1lfS1pbmxpbmUke2l9LmpzYCwgbi5jaGlsZHJlblswXS5kYXRhKTtcbiAgfSk7XG4gIHJldHVybiBEb21VdGlscy5nZXRPdXRlckhUTUwocGFyc2VkSFRNTCk7XG59XG4iXX0=