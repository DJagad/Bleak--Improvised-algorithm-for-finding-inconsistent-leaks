/**
 * Represents a source code location.
 */
var Location = /** @class */ (function () {
    /**
     * Construct a source code location.
     * @param file The source file.
     * @param line 1-indexed line.
     * @param column 1-indexed column.
     * @param forOriginal If 'true', this location corresponds to a location in the original non-formatted file.
     */
    function Location(file, 
    // 1-indexed line
    line, 
    // 1-indexed column
    column, forOriginal) {
        this.file = file;
        this.line = line;
        this.column = column;
        this.forOriginal = forOriginal;
    }
    Object.defineProperty(Location.prototype, "url", {
        get: function () {
            return this.file ? this.file.url : "<anonymous>";
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Location.prototype, "key", {
        get: function () {
            return this.url + ":" + this.line + ":" + this.column + ":" + this.forOriginal;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Location.prototype, "lineZeroIndexed", {
        /**
         * Zero-indexed line.
         */
        get: function () {
            return this.line - 1;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Location.prototype, "columnZeroIndexed", {
        /**
         * Zero-indexed column.
         */
        get: function () {
            return this.column - 1;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Get the corresponding location for the formatted
     * file. NOP if this is a location for the formatted
     * file.
     */
    Location.prototype.getFormattedLocation = function () {
        if (!this.forOriginal) {
            return this;
        }
        return this.file.mapping.originalToFormatted(this);
    };
    /**
     * Get the corresponding location for the original
     * file. NOP if this is a location for the original
     * file.
     */
    Location.prototype.getOriginalLocation = function () {
        if (this.forOriginal || !this.file) {
            return this;
        }
        return this.file.mapping.formattedToOriginal(this);
    };
    /**
     * Returns true if the given locations are equivalent.
     * @param location
     */
    Location.prototype.equal = function (location) {
        if (this.forOriginal !== location.forOriginal) {
            // Canonicalize.
            return this.getOriginalLocation().equal(location.getOriginalLocation());
        }
        return this.file === location.file && this.line === location.line && this.column === location.column;
    };
    /**
     * Converts into a location for use in the Ace Editor, which has zero-indexed rows and 1-indexed columns.
     */
    Location.prototype.toAceEditorLocation = function () {
        return {
            row: this.lineZeroIndexed,
            column: this.column
        };
    };
    return Location;
}());
export default Location;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9jYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvdmlld2VyL21vZGVsL2xvY2F0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUVBOztHQUVHO0FBQ0g7SUFDRTs7Ozs7O09BTUc7SUFDSCxrQkFDa0IsSUFBdUI7SUFDdkMsaUJBQWlCO0lBQ0QsSUFBWTtJQUM1QixtQkFBbUI7SUFDSCxNQUFjLEVBQ2QsV0FBb0I7UUFMcEIsU0FBSSxHQUFKLElBQUksQ0FBbUI7UUFFdkIsU0FBSSxHQUFKLElBQUksQ0FBUTtRQUVaLFdBQU0sR0FBTixNQUFNLENBQVE7UUFDZCxnQkFBVyxHQUFYLFdBQVcsQ0FBUztJQUFHLENBQUM7SUFFMUMsc0JBQVcseUJBQUc7YUFBZDtZQUNFLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDO1FBQ25ELENBQUM7OztPQUFBO0lBRUQsc0JBQVcseUJBQUc7YUFBZDtZQUNFLE1BQU0sQ0FBSSxJQUFJLENBQUMsR0FBRyxTQUFJLElBQUksQ0FBQyxJQUFJLFNBQUksSUFBSSxDQUFDLE1BQU0sU0FBSSxJQUFJLENBQUMsV0FBYSxDQUFDO1FBQ3ZFLENBQUM7OztPQUFBO0lBS0Qsc0JBQVcscUNBQWU7UUFIMUI7O1dBRUc7YUFDSDtZQUNFLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQztRQUN2QixDQUFDOzs7T0FBQTtJQUtELHNCQUFXLHVDQUFpQjtRQUg1Qjs7V0FFRzthQUNIO1lBQ0UsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1FBQ3pCLENBQUM7OztPQUFBO0lBRUQ7Ozs7T0FJRztJQUNJLHVDQUFvQixHQUEzQjtRQUNFLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7WUFDdEIsTUFBTSxDQUFDLElBQUksQ0FBQztRQUNkLENBQUM7UUFDRCxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDckQsQ0FBQztJQUVEOzs7O09BSUc7SUFDSSxzQ0FBbUIsR0FBMUI7UUFDRSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDbkMsTUFBTSxDQUFDLElBQUksQ0FBQztRQUNkLENBQUM7UUFDRCxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDckQsQ0FBQztJQUVEOzs7T0FHRztJQUNJLHdCQUFLLEdBQVosVUFBYSxRQUFrQjtRQUM3QixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxLQUFLLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1lBQzlDLGdCQUFnQjtZQUNoQixNQUFNLENBQUMsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDLENBQUM7UUFDMUUsQ0FBQztRQUNELE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLFFBQVEsQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLElBQUksS0FBSyxRQUFRLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssUUFBUSxDQUFDLE1BQU0sQ0FBQztJQUN2RyxDQUFDO0lBRUQ7O09BRUc7SUFDSSxzQ0FBbUIsR0FBMUI7UUFDRSxNQUFNLENBQUM7WUFDTCxHQUFHLEVBQUUsSUFBSSxDQUFDLGVBQWU7WUFDekIsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNO1NBQ3BCLENBQUM7SUFDSixDQUFDO0lBQ0gsZUFBQztBQUFELENBQUMsQUFuRkQsSUFtRkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgU291cmNlRmlsZSBmcm9tICcuL3NvdXJjZV9maWxlJztcblxuLyoqXG4gKiBSZXByZXNlbnRzIGEgc291cmNlIGNvZGUgbG9jYXRpb24uXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIExvY2F0aW9uIHtcbiAgLyoqXG4gICAqIENvbnN0cnVjdCBhIHNvdXJjZSBjb2RlIGxvY2F0aW9uLlxuICAgKiBAcGFyYW0gZmlsZSBUaGUgc291cmNlIGZpbGUuXG4gICAqIEBwYXJhbSBsaW5lIDEtaW5kZXhlZCBsaW5lLlxuICAgKiBAcGFyYW0gY29sdW1uIDEtaW5kZXhlZCBjb2x1bW4uXG4gICAqIEBwYXJhbSBmb3JPcmlnaW5hbCBJZiAndHJ1ZScsIHRoaXMgbG9jYXRpb24gY29ycmVzcG9uZHMgdG8gYSBsb2NhdGlvbiBpbiB0aGUgb3JpZ2luYWwgbm9uLWZvcm1hdHRlZCBmaWxlLlxuICAgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgcHVibGljIHJlYWRvbmx5IGZpbGU6IFNvdXJjZUZpbGUgfCBudWxsLFxuICAgIC8vIDEtaW5kZXhlZCBsaW5lXG4gICAgcHVibGljIHJlYWRvbmx5IGxpbmU6IG51bWJlcixcbiAgICAvLyAxLWluZGV4ZWQgY29sdW1uXG4gICAgcHVibGljIHJlYWRvbmx5IGNvbHVtbjogbnVtYmVyLFxuICAgIHB1YmxpYyByZWFkb25seSBmb3JPcmlnaW5hbDogYm9vbGVhbikge31cblxuICBwdWJsaWMgZ2V0IHVybCgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLmZpbGUgPyB0aGlzLmZpbGUudXJsIDogXCI8YW5vbnltb3VzPlwiO1xuICB9XG5cbiAgcHVibGljIGdldCBrZXkoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYCR7dGhpcy51cmx9OiR7dGhpcy5saW5lfToke3RoaXMuY29sdW1ufToke3RoaXMuZm9yT3JpZ2luYWx9YDtcbiAgfVxuXG4gIC8qKlxuICAgKiBaZXJvLWluZGV4ZWQgbGluZS5cbiAgICovXG4gIHB1YmxpYyBnZXQgbGluZVplcm9JbmRleGVkKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMubGluZSAtIDE7XG4gIH1cblxuICAvKipcbiAgICogWmVyby1pbmRleGVkIGNvbHVtbi5cbiAgICovXG4gIHB1YmxpYyBnZXQgY29sdW1uWmVyb0luZGV4ZWQoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5jb2x1bW4gLSAxO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgY29ycmVzcG9uZGluZyBsb2NhdGlvbiBmb3IgdGhlIGZvcm1hdHRlZFxuICAgKiBmaWxlLiBOT1AgaWYgdGhpcyBpcyBhIGxvY2F0aW9uIGZvciB0aGUgZm9ybWF0dGVkXG4gICAqIGZpbGUuXG4gICAqL1xuICBwdWJsaWMgZ2V0Rm9ybWF0dGVkTG9jYXRpb24oKTogTG9jYXRpb24ge1xuICAgIGlmICghdGhpcy5mb3JPcmlnaW5hbCkge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmZpbGUubWFwcGluZy5vcmlnaW5hbFRvRm9ybWF0dGVkKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgY29ycmVzcG9uZGluZyBsb2NhdGlvbiBmb3IgdGhlIG9yaWdpbmFsXG4gICAqIGZpbGUuIE5PUCBpZiB0aGlzIGlzIGEgbG9jYXRpb24gZm9yIHRoZSBvcmlnaW5hbFxuICAgKiBmaWxlLlxuICAgKi9cbiAgcHVibGljIGdldE9yaWdpbmFsTG9jYXRpb24oKTogTG9jYXRpb24ge1xuICAgIGlmICh0aGlzLmZvck9yaWdpbmFsIHx8ICF0aGlzLmZpbGUpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5maWxlLm1hcHBpbmcuZm9ybWF0dGVkVG9PcmlnaW5hbCh0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRydWUgaWYgdGhlIGdpdmVuIGxvY2F0aW9ucyBhcmUgZXF1aXZhbGVudC5cbiAgICogQHBhcmFtIGxvY2F0aW9uXG4gICAqL1xuICBwdWJsaWMgZXF1YWwobG9jYXRpb246IExvY2F0aW9uKTogYm9vbGVhbiB7XG4gICAgaWYgKHRoaXMuZm9yT3JpZ2luYWwgIT09IGxvY2F0aW9uLmZvck9yaWdpbmFsKSB7XG4gICAgICAvLyBDYW5vbmljYWxpemUuXG4gICAgICByZXR1cm4gdGhpcy5nZXRPcmlnaW5hbExvY2F0aW9uKCkuZXF1YWwobG9jYXRpb24uZ2V0T3JpZ2luYWxMb2NhdGlvbigpKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZmlsZSA9PT0gbG9jYXRpb24uZmlsZSAmJiB0aGlzLmxpbmUgPT09IGxvY2F0aW9uLmxpbmUgJiYgdGhpcy5jb2x1bW4gPT09IGxvY2F0aW9uLmNvbHVtbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0cyBpbnRvIGEgbG9jYXRpb24gZm9yIHVzZSBpbiB0aGUgQWNlIEVkaXRvciwgd2hpY2ggaGFzIHplcm8taW5kZXhlZCByb3dzIGFuZCAxLWluZGV4ZWQgY29sdW1ucy5cbiAgICovXG4gIHB1YmxpYyB0b0FjZUVkaXRvckxvY2F0aW9uKCk6IHsgcm93OiBudW1iZXIsIGNvbHVtbjogbnVtYmVyIH0ge1xuICAgIHJldHVybiB7XG4gICAgICByb3c6IHRoaXMubGluZVplcm9JbmRleGVkLFxuICAgICAgY29sdW1uOiB0aGlzLmNvbHVtblxuICAgIH07XG4gIH1cbn0iXX0=