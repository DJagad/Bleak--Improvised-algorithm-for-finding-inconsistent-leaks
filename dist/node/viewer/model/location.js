"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Represents a source code location.
 */
class Location {
    /**
     * Construct a source code location.
     * @param file The source file.
     * @param line 1-indexed line.
     * @param column 1-indexed column.
     * @param forOriginal If 'true', this location corresponds to a location in the original non-formatted file.
     */
    constructor(file, 
    // 1-indexed line
    line, 
    // 1-indexed column
    column, forOriginal) {
        this.file = file;
        this.line = line;
        this.column = column;
        this.forOriginal = forOriginal;
    }
    get url() {
        return this.file ? this.file.url : "<anonymous>";
    }
    get key() {
        return `${this.url}:${this.line}:${this.column}:${this.forOriginal}`;
    }
    /**
     * Zero-indexed line.
     */
    get lineZeroIndexed() {
        return this.line - 1;
    }
    /**
     * Zero-indexed column.
     */
    get columnZeroIndexed() {
        return this.column - 1;
    }
    /**
     * Get the corresponding location for the formatted
     * file. NOP if this is a location for the formatted
     * file.
     */
    getFormattedLocation() {
        if (!this.forOriginal) {
            return this;
        }
        return this.file.mapping.originalToFormatted(this);
    }
    /**
     * Get the corresponding location for the original
     * file. NOP if this is a location for the original
     * file.
     */
    getOriginalLocation() {
        if (this.forOriginal || !this.file) {
            return this;
        }
        return this.file.mapping.formattedToOriginal(this);
    }
    /**
     * Returns true if the given locations are equivalent.
     * @param location
     */
    equal(location) {
        if (this.forOriginal !== location.forOriginal) {
            // Canonicalize.
            return this.getOriginalLocation().equal(location.getOriginalLocation());
        }
        return this.file === location.file && this.line === location.line && this.column === location.column;
    }
    /**
     * Converts into a location for use in the Ace Editor, which has zero-indexed rows and 1-indexed columns.
     */
    toAceEditorLocation() {
        return {
            row: this.lineZeroIndexed,
            column: this.column
        };
    }
}
exports.default = Location;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9jYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvdmlld2VyL21vZGVsL2xvY2F0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBRUE7O0dBRUc7QUFDSDtJQUNFOzs7Ozs7T0FNRztJQUNILFlBQ2tCLElBQXVCO0lBQ3ZDLGlCQUFpQjtJQUNELElBQVk7SUFDNUIsbUJBQW1CO0lBQ0gsTUFBYyxFQUNkLFdBQW9CO1FBTHBCLFNBQUksR0FBSixJQUFJLENBQW1CO1FBRXZCLFNBQUksR0FBSixJQUFJLENBQVE7UUFFWixXQUFNLEdBQU4sTUFBTSxDQUFRO1FBQ2QsZ0JBQVcsR0FBWCxXQUFXLENBQVM7SUFBRyxDQUFDO0lBRTFDLElBQVcsR0FBRztRQUNaLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDO0lBQ25ELENBQUM7SUFFRCxJQUFXLEdBQUc7UUFDWixNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxJQUFJLElBQUksQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDdkUsQ0FBQztJQUVEOztPQUVHO0lBQ0gsSUFBVyxlQUFlO1FBQ3hCLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQztJQUN2QixDQUFDO0lBRUQ7O09BRUc7SUFDSCxJQUFXLGlCQUFpQjtRQUMxQixNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7SUFDekIsQ0FBQztJQUVEOzs7O09BSUc7SUFDSSxvQkFBb0I7UUFDekIsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztZQUN0QixNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ2QsQ0FBQztRQUNELE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNyRCxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNJLG1CQUFtQjtRQUN4QixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDbkMsTUFBTSxDQUFDLElBQUksQ0FBQztRQUNkLENBQUM7UUFDRCxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDckQsQ0FBQztJQUVEOzs7T0FHRztJQUNJLEtBQUssQ0FBQyxRQUFrQjtRQUM3QixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxLQUFLLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1lBQzlDLGdCQUFnQjtZQUNoQixNQUFNLENBQUMsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDLENBQUM7UUFDMUUsQ0FBQztRQUNELE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLFFBQVEsQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLElBQUksS0FBSyxRQUFRLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssUUFBUSxDQUFDLE1BQU0sQ0FBQztJQUN2RyxDQUFDO0lBRUQ7O09BRUc7SUFDSSxtQkFBbUI7UUFDeEIsTUFBTSxDQUFDO1lBQ0wsR0FBRyxFQUFFLElBQUksQ0FBQyxlQUFlO1lBQ3pCLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTTtTQUNwQixDQUFDO0lBQ0osQ0FBQztDQUNGO0FBbkZELDJCQW1GQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBTb3VyY2VGaWxlIGZyb20gJy4vc291cmNlX2ZpbGUnO1xuXG4vKipcbiAqIFJlcHJlc2VudHMgYSBzb3VyY2UgY29kZSBsb2NhdGlvbi5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTG9jYXRpb24ge1xuICAvKipcbiAgICogQ29uc3RydWN0IGEgc291cmNlIGNvZGUgbG9jYXRpb24uXG4gICAqIEBwYXJhbSBmaWxlIFRoZSBzb3VyY2UgZmlsZS5cbiAgICogQHBhcmFtIGxpbmUgMS1pbmRleGVkIGxpbmUuXG4gICAqIEBwYXJhbSBjb2x1bW4gMS1pbmRleGVkIGNvbHVtbi5cbiAgICogQHBhcmFtIGZvck9yaWdpbmFsIElmICd0cnVlJywgdGhpcyBsb2NhdGlvbiBjb3JyZXNwb25kcyB0byBhIGxvY2F0aW9uIGluIHRoZSBvcmlnaW5hbCBub24tZm9ybWF0dGVkIGZpbGUuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICBwdWJsaWMgcmVhZG9ubHkgZmlsZTogU291cmNlRmlsZSB8IG51bGwsXG4gICAgLy8gMS1pbmRleGVkIGxpbmVcbiAgICBwdWJsaWMgcmVhZG9ubHkgbGluZTogbnVtYmVyLFxuICAgIC8vIDEtaW5kZXhlZCBjb2x1bW5cbiAgICBwdWJsaWMgcmVhZG9ubHkgY29sdW1uOiBudW1iZXIsXG4gICAgcHVibGljIHJlYWRvbmx5IGZvck9yaWdpbmFsOiBib29sZWFuKSB7fVxuXG4gIHB1YmxpYyBnZXQgdXJsKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuZmlsZSA/IHRoaXMuZmlsZS51cmwgOiBcIjxhbm9ueW1vdXM+XCI7XG4gIH1cblxuICBwdWJsaWMgZ2V0IGtleSgpOiBzdHJpbmcge1xuICAgIHJldHVybiBgJHt0aGlzLnVybH06JHt0aGlzLmxpbmV9OiR7dGhpcy5jb2x1bW59OiR7dGhpcy5mb3JPcmlnaW5hbH1gO1xuICB9XG5cbiAgLyoqXG4gICAqIFplcm8taW5kZXhlZCBsaW5lLlxuICAgKi9cbiAgcHVibGljIGdldCBsaW5lWmVyb0luZGV4ZWQoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5saW5lIC0gMTtcbiAgfVxuXG4gIC8qKlxuICAgKiBaZXJvLWluZGV4ZWQgY29sdW1uLlxuICAgKi9cbiAgcHVibGljIGdldCBjb2x1bW5aZXJvSW5kZXhlZCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLmNvbHVtbiAtIDE7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBjb3JyZXNwb25kaW5nIGxvY2F0aW9uIGZvciB0aGUgZm9ybWF0dGVkXG4gICAqIGZpbGUuIE5PUCBpZiB0aGlzIGlzIGEgbG9jYXRpb24gZm9yIHRoZSBmb3JtYXR0ZWRcbiAgICogZmlsZS5cbiAgICovXG4gIHB1YmxpYyBnZXRGb3JtYXR0ZWRMb2NhdGlvbigpOiBMb2NhdGlvbiB7XG4gICAgaWYgKCF0aGlzLmZvck9yaWdpbmFsKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZmlsZS5tYXBwaW5nLm9yaWdpbmFsVG9Gb3JtYXR0ZWQodGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBjb3JyZXNwb25kaW5nIGxvY2F0aW9uIGZvciB0aGUgb3JpZ2luYWxcbiAgICogZmlsZS4gTk9QIGlmIHRoaXMgaXMgYSBsb2NhdGlvbiBmb3IgdGhlIG9yaWdpbmFsXG4gICAqIGZpbGUuXG4gICAqL1xuICBwdWJsaWMgZ2V0T3JpZ2luYWxMb2NhdGlvbigpOiBMb2NhdGlvbiB7XG4gICAgaWYgKHRoaXMuZm9yT3JpZ2luYWwgfHwgIXRoaXMuZmlsZSkge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmZpbGUubWFwcGluZy5mb3JtYXR0ZWRUb09yaWdpbmFsKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgZ2l2ZW4gbG9jYXRpb25zIGFyZSBlcXVpdmFsZW50LlxuICAgKiBAcGFyYW0gbG9jYXRpb25cbiAgICovXG4gIHB1YmxpYyBlcXVhbChsb2NhdGlvbjogTG9jYXRpb24pOiBib29sZWFuIHtcbiAgICBpZiAodGhpcy5mb3JPcmlnaW5hbCAhPT0gbG9jYXRpb24uZm9yT3JpZ2luYWwpIHtcbiAgICAgIC8vIENhbm9uaWNhbGl6ZS5cbiAgICAgIHJldHVybiB0aGlzLmdldE9yaWdpbmFsTG9jYXRpb24oKS5lcXVhbChsb2NhdGlvbi5nZXRPcmlnaW5hbExvY2F0aW9uKCkpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5maWxlID09PSBsb2NhdGlvbi5maWxlICYmIHRoaXMubGluZSA9PT0gbG9jYXRpb24ubGluZSAmJiB0aGlzLmNvbHVtbiA9PT0gbG9jYXRpb24uY29sdW1uO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIGludG8gYSBsb2NhdGlvbiBmb3IgdXNlIGluIHRoZSBBY2UgRWRpdG9yLCB3aGljaCBoYXMgemVyby1pbmRleGVkIHJvd3MgYW5kIDEtaW5kZXhlZCBjb2x1bW5zLlxuICAgKi9cbiAgcHVibGljIHRvQWNlRWRpdG9yTG9jYXRpb24oKTogeyByb3c6IG51bWJlciwgY29sdW1uOiBudW1iZXIgfSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHJvdzogdGhpcy5saW5lWmVyb0luZGV4ZWQsXG4gICAgICBjb2x1bW46IHRoaXMuY29sdW1uXG4gICAgfTtcbiAgfVxufSJdfQ==