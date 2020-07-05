"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * A progress bar that does... nothing.
 */
class NopProgressBar {
    nextOperation() { }
    finish() { }
    abort() { }
    updateDescription(desc) { }
    setOperationCount(count) { }
    debug(data) { }
    log(data) { }
    error(data) { }
}
exports.default = NopProgressBar;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9wX3Byb2dyZXNzX2Jhci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9saWIvbm9wX3Byb2dyZXNzX2Jhci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUVBOztHQUVHO0FBQ0g7SUFDRSxhQUFhLEtBQVUsQ0FBQztJQUN4QixNQUFNLEtBQVUsQ0FBQztJQUNqQixLQUFLLEtBQVUsQ0FBQztJQUNoQixpQkFBaUIsQ0FBQyxJQUFZLElBQVMsQ0FBQztJQUN4QyxpQkFBaUIsQ0FBQyxLQUFhLElBQVMsQ0FBQztJQUN6QyxLQUFLLENBQUMsSUFBWSxJQUFTLENBQUM7SUFDNUIsR0FBRyxDQUFDLElBQVksSUFBUyxDQUFDO0lBQzFCLEtBQUssQ0FBQyxJQUFZLElBQVMsQ0FBQztDQUM3QjtBQVRELGlDQVNDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtJUHJvZ3Jlc3NCYXJ9IGZyb20gJy4uL2NvbW1vbi9pbnRlcmZhY2VzJztcblxuLyoqXG4gKiBBIHByb2dyZXNzIGJhciB0aGF0IGRvZXMuLi4gbm90aGluZy5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTm9wUHJvZ3Jlc3NCYXIgaW1wbGVtZW50cyBJUHJvZ3Jlc3NCYXIge1xuICBuZXh0T3BlcmF0aW9uKCk6IHZvaWQge31cbiAgZmluaXNoKCk6IHZvaWQge31cbiAgYWJvcnQoKTogdm9pZCB7fVxuICB1cGRhdGVEZXNjcmlwdGlvbihkZXNjOiBzdHJpbmcpOiB2b2lkIHt9XG4gIHNldE9wZXJhdGlvbkNvdW50KGNvdW50OiBudW1iZXIpOiB2b2lkIHt9XG4gIGRlYnVnKGRhdGE6IHN0cmluZyk6IHZvaWQge31cbiAgbG9nKGRhdGE6IHN0cmluZyk6IHZvaWQge31cbiAgZXJyb3IoZGF0YTogc3RyaW5nKTogdm9pZCB7fVxufSJdfQ==