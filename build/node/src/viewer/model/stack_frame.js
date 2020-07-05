"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const location_1 = require("./location");
class StackFrame extends location_1.default {
    constructor(file, name, 
    // 1-indexed line
    line, 
    // 1-indexed column
    column) {
        super(file, line, column, true);
        this.name = name;
        if (!this.name) {
            this.name = "(anonymous)";
        }
    }
}
exports.default = StackFrame;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhY2tfZnJhbWUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvdmlld2VyL21vZGVsL3N0YWNrX2ZyYW1lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEseUNBQWtDO0FBR2xDLGdCQUFnQyxTQUFRLGtCQUFRO0lBQzlDLFlBQVksSUFBZ0IsRUFDVixJQUFZO0lBQzVCLGlCQUFpQjtJQUNqQixJQUFZO0lBQ1osbUJBQW1CO0lBQ25CLE1BQWM7UUFDZCxLQUFLLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFMaEIsU0FBSSxHQUFKLElBQUksQ0FBUTtRQU01QixFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ2YsSUFBSSxDQUFDLElBQUksR0FBRyxhQUFhLENBQUM7UUFDNUIsQ0FBQztJQUNILENBQUM7Q0FDRjtBQVpELDZCQVlDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IExvY2F0aW9uIGZyb20gJy4vbG9jYXRpb24nO1xuaW1wb3J0IFNvdXJjZUZpbGUgZnJvbSAnLi9zb3VyY2VfZmlsZSc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFN0YWNrRnJhbWUgZXh0ZW5kcyBMb2NhdGlvbiB7XG4gIGNvbnN0cnVjdG9yKGZpbGU6IFNvdXJjZUZpbGUsXG4gICAgcHVibGljIHJlYWRvbmx5IG5hbWU6IHN0cmluZyxcbiAgICAvLyAxLWluZGV4ZWQgbGluZVxuICAgIGxpbmU6IG51bWJlcixcbiAgICAvLyAxLWluZGV4ZWQgY29sdW1uXG4gICAgY29sdW1uOiBudW1iZXIpIHtcbiAgICBzdXBlcihmaWxlLCBsaW5lLCBjb2x1bW4sIHRydWUpO1xuICAgIGlmICghdGhpcy5uYW1lKSB7XG4gICAgICB0aGlzLm5hbWUgPSBcIihhbm9ueW1vdXMpXCI7XG4gICAgfVxuICB9XG59Il19