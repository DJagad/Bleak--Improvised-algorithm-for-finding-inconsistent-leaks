/**
 * Represents a folder that contains files.
 */
var Folder = /** @class */ (function () {
    function Folder(type, parentPath, name) {
        this.type = type;
        this.parentPath = parentPath;
        this.name = name;
        this.folders = [];
        this.files = [];
        switch (this.type) {
            case 0 /* ORIGIN */:
                this._fullPath = this.name + "/";
                break;
            case 1 /* FOLDER */:
                this._fullPath = "" + parentPath + name + "/";
                break;
            case 2 /* ROOT */:
                this._fullPath = "";
                break;
        }
    }
    /**
     * Gets or creates a new child folder with the given name and type.
     * @param type
     * @param name
     */
    Folder.prototype.getChildFolder = function (type, name) {
        var rv = this.folders.filter(function (f) { return f.name === name; });
        if (rv.length === 0) {
            var folder = new Folder(type, this._fullPath, name);
            this.folders.push(folder);
            return folder;
        }
        return rv[0];
    };
    /**
     * Decides whether or not this node should be inlined into its parents.
     * Happens when it only has one subdirectory and no files.
     */
    Folder.prototype.compact = function () {
        // Origins and roots don't get compacted.
        if (this.type !== 1 /* FOLDER */ || this.files.length > 0 || this.folders.length > 1) {
            // Compact children too.
            this.folders = this.folders.map(function (f) { return f.compact(); });
            return this;
        }
        else {
            // INVARIANT: *must* have one folder.
            var folder = this.folders[0];
            // Change name to represent this folder too.
            folder.name = this.name + "/" + folder.name;
            folder.parentPath = this.parentPath;
            return folder.compact();
        }
    };
    /**
     * Returns true if this folder contains the given file.
     * @param file
     */
    Folder.prototype.hasFile = function (file) {
        var hasFile = this.files.indexOf(file) !== -1;
        if (hasFile) {
            return hasFile;
        }
        for (var _i = 0, _a = this.folders; _i < _a.length; _i++) {
            var folder = _a[_i];
            if (folder.hasFile(file)) {
                return true;
            }
        }
        return false;
    };
    return Folder;
}());
export default Folder;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9sZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL3ZpZXdlci9jb21wb25lbnRzL2ZpbGVfbGlzdC9tb2RlbC9mb2xkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBUUE7O0dBRUc7QUFDSDtJQUlFLGdCQUE0QixJQUE2RCxFQUNoRixVQUFrQixFQUNsQixJQUFZO1FBRk8sU0FBSSxHQUFKLElBQUksQ0FBeUQ7UUFDaEYsZUFBVSxHQUFWLFVBQVUsQ0FBUTtRQUNsQixTQUFJLEdBQUosSUFBSSxDQUFRO1FBTGQsWUFBTyxHQUFhLEVBQUUsQ0FBQztRQUNkLFVBQUssR0FBaUIsRUFBRSxDQUFDO1FBS3JDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ2xCO2dCQUNFLElBQUksQ0FBQyxTQUFTLEdBQU0sSUFBSSxDQUFDLElBQUksTUFBRyxDQUFDO2dCQUNqQyxLQUFLLENBQUM7WUFDUjtnQkFDRSxJQUFJLENBQUMsU0FBUyxHQUFHLEtBQUcsVUFBVSxHQUFHLElBQUksTUFBRyxDQUFDO2dCQUN6QyxLQUFLLENBQUM7WUFDUjtnQkFDRSxJQUFJLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQztnQkFDcEIsS0FBSyxDQUFDO1FBQ1YsQ0FBQztJQUNILENBQUM7SUFFSDs7OztPQUlHO0lBQ0ksK0JBQWMsR0FBckIsVUFBc0IsSUFBMkMsRUFBRSxJQUFZO1FBQzdFLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLFVBQUMsQ0FBQyxJQUFLLE9BQUEsQ0FBQyxDQUFDLElBQUksS0FBSyxJQUFJLEVBQWYsQ0FBZSxDQUFDLENBQUM7UUFDckQsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3BCLElBQU0sTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3RELElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzFCLE1BQU0sQ0FBQyxNQUFNLENBQUM7UUFDaEIsQ0FBQztRQUNELE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDZixDQUFDO0lBRUQ7OztPQUdHO0lBQ0ksd0JBQU8sR0FBZDtRQUNFLHlDQUF5QztRQUN6QyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxtQkFBc0IsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN4Rix3QkFBd0I7WUFDeEIsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFDLENBQUMsSUFBSyxPQUFBLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBWCxDQUFXLENBQUMsQ0FBQztZQUNwRCxNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ2QsQ0FBQztRQUFDLElBQUksQ0FBQyxDQUFDO1lBQ04scUNBQXFDO1lBQ3JDLElBQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDL0IsNENBQTRDO1lBQzVDLE1BQU0sQ0FBQyxJQUFJLEdBQU0sSUFBSSxDQUFDLElBQUksU0FBSSxNQUFNLENBQUMsSUFBTSxDQUFDO1lBQzVDLE1BQU0sQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQztZQUNwQyxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQzFCLENBQUM7SUFDSCxDQUFDO0lBRUQ7OztPQUdHO0lBQ0ksd0JBQU8sR0FBZCxVQUFlLElBQWdCO1FBQzdCLElBQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ2hELEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDWixNQUFNLENBQUMsT0FBTyxDQUFDO1FBQ2pCLENBQUM7UUFDRCxHQUFHLENBQUMsQ0FBaUIsVUFBWSxFQUFaLEtBQUEsSUFBSSxDQUFDLE9BQU8sRUFBWixjQUFZLEVBQVosSUFBWTtZQUE1QixJQUFNLE1BQU0sU0FBQTtZQUNmLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN6QixNQUFNLENBQUMsSUFBSSxDQUFDO1lBQ2QsQ0FBQztTQUNGO1FBQ0QsTUFBTSxDQUFDLEtBQUssQ0FBQztJQUNmLENBQUM7SUFDSCxhQUFDO0FBQUQsQ0FBQyxBQXZFRCxJQXVFQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBTb3VyY2VGaWxlIGZyb20gJy4uLy4uLy4uL21vZGVsL3NvdXJjZV9maWxlJztcblxuZXhwb3J0IGNvbnN0IGVudW0gRm9sZGVyVHlwZSB7XG4gIE9SSUdJTixcbiAgRk9MREVSLFxuICBST09UXG59XG5cbi8qKlxuICogUmVwcmVzZW50cyBhIGZvbGRlciB0aGF0IGNvbnRhaW5zIGZpbGVzLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBGb2xkZXIge1xuICBwdWJsaWMgZm9sZGVyczogRm9sZGVyW10gPSBbXTtcbiAgcHVibGljIHJlYWRvbmx5IGZpbGVzOiBTb3VyY2VGaWxlW10gPSBbXTtcbiAgcHJpdmF0ZSBfZnVsbFBhdGg6IHN0cmluZztcbiAgY29uc3RydWN0b3IocHVibGljIHJlYWRvbmx5IHR5cGU6IEZvbGRlclR5cGUuT1JJR0lOIHwgRm9sZGVyVHlwZS5GT0xERVIgfCBGb2xkZXJUeXBlLlJPT1QsXG4gICAgcHVibGljIHBhcmVudFBhdGg6IHN0cmluZyxcbiAgICBwdWJsaWMgbmFtZTogc3RyaW5nKSB7XG4gICAgICBzd2l0Y2ggKHRoaXMudHlwZSkge1xuICAgICAgICBjYXNlIEZvbGRlclR5cGUuT1JJR0lOOlxuICAgICAgICAgIHRoaXMuX2Z1bGxQYXRoID0gYCR7dGhpcy5uYW1lfS9gO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIEZvbGRlclR5cGUuRk9MREVSOlxuICAgICAgICAgIHRoaXMuX2Z1bGxQYXRoID0gYCR7cGFyZW50UGF0aH0ke25hbWV9L2A7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgRm9sZGVyVHlwZS5ST09UOlxuICAgICAgICAgIHRoaXMuX2Z1bGxQYXRoID0gXCJcIjtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgLyoqXG4gICAqIEdldHMgb3IgY3JlYXRlcyBhIG5ldyBjaGlsZCBmb2xkZXIgd2l0aCB0aGUgZ2l2ZW4gbmFtZSBhbmQgdHlwZS5cbiAgICogQHBhcmFtIHR5cGVcbiAgICogQHBhcmFtIG5hbWVcbiAgICovXG4gIHB1YmxpYyBnZXRDaGlsZEZvbGRlcih0eXBlOiBGb2xkZXJUeXBlLkZPTERFUiB8IEZvbGRlclR5cGUuT1JJR0lOLCBuYW1lOiBzdHJpbmcpOiBGb2xkZXIge1xuICAgIGxldCBydiA9IHRoaXMuZm9sZGVycy5maWx0ZXIoKGYpID0+IGYubmFtZSA9PT0gbmFtZSk7XG4gICAgaWYgKHJ2Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgY29uc3QgZm9sZGVyID0gbmV3IEZvbGRlcih0eXBlLCB0aGlzLl9mdWxsUGF0aCwgbmFtZSk7XG4gICAgICB0aGlzLmZvbGRlcnMucHVzaChmb2xkZXIpO1xuICAgICAgcmV0dXJuIGZvbGRlcjtcbiAgICB9XG4gICAgcmV0dXJuIHJ2WzBdO1xuICB9XG5cbiAgLyoqXG4gICAqIERlY2lkZXMgd2hldGhlciBvciBub3QgdGhpcyBub2RlIHNob3VsZCBiZSBpbmxpbmVkIGludG8gaXRzIHBhcmVudHMuXG4gICAqIEhhcHBlbnMgd2hlbiBpdCBvbmx5IGhhcyBvbmUgc3ViZGlyZWN0b3J5IGFuZCBubyBmaWxlcy5cbiAgICovXG4gIHB1YmxpYyBjb21wYWN0KCk6IEZvbGRlciB7XG4gICAgLy8gT3JpZ2lucyBhbmQgcm9vdHMgZG9uJ3QgZ2V0IGNvbXBhY3RlZC5cbiAgICBpZiAodGhpcy50eXBlICE9PSBGb2xkZXJUeXBlLkZPTERFUiB8fCB0aGlzLmZpbGVzLmxlbmd0aCA+IDAgfHwgdGhpcy5mb2xkZXJzLmxlbmd0aCA+IDEpIHtcbiAgICAgIC8vIENvbXBhY3QgY2hpbGRyZW4gdG9vLlxuICAgICAgdGhpcy5mb2xkZXJzID0gdGhpcy5mb2xkZXJzLm1hcCgoZikgPT4gZi5jb21wYWN0KCkpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIElOVkFSSUFOVDogKm11c3QqIGhhdmUgb25lIGZvbGRlci5cbiAgICAgIGNvbnN0IGZvbGRlciA9IHRoaXMuZm9sZGVyc1swXTtcbiAgICAgIC8vIENoYW5nZSBuYW1lIHRvIHJlcHJlc2VudCB0aGlzIGZvbGRlciB0b28uXG4gICAgICBmb2xkZXIubmFtZSA9IGAke3RoaXMubmFtZX0vJHtmb2xkZXIubmFtZX1gO1xuICAgICAgZm9sZGVyLnBhcmVudFBhdGggPSB0aGlzLnBhcmVudFBhdGg7XG4gICAgICByZXR1cm4gZm9sZGVyLmNvbXBhY3QoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0cnVlIGlmIHRoaXMgZm9sZGVyIGNvbnRhaW5zIHRoZSBnaXZlbiBmaWxlLlxuICAgKiBAcGFyYW0gZmlsZVxuICAgKi9cbiAgcHVibGljIGhhc0ZpbGUoZmlsZTogU291cmNlRmlsZSk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGhhc0ZpbGUgPSB0aGlzLmZpbGVzLmluZGV4T2YoZmlsZSkgIT09IC0xO1xuICAgIGlmIChoYXNGaWxlKSB7XG4gICAgICByZXR1cm4gaGFzRmlsZTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBmb2xkZXIgb2YgdGhpcy5mb2xkZXJzKSB7XG4gICAgICBpZiAoZm9sZGVyLmhhc0ZpbGUoZmlsZSkpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuIl19