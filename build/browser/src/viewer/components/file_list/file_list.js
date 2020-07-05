import * as tslib_1 from "tslib";
import * as React from 'react';
import FolderNode from './folder_node';
import { default as Folder } from './model/folder';
var FileList = /** @class */ (function (_super) {
    tslib_1.__extends(FileList, _super);
    function FileList(props, context) {
        var _this = _super.call(this, props, context) || this;
        var files = props.files.getSourceFiles();
        var root = new Folder(2 /* ROOT */, '', '');
        for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
            var file = files_1[_i];
            var url = new URL(file.url);
            var parent_1 = root.getChildFolder(0 /* ORIGIN */, url.origin);
            // N.B.: First string in this slice will be '' for the root directory.
            // We treat origins as root directories.
            var path = url.pathname.split('/').slice(1);
            for (var i = 0; i < path.length; i++) {
                var seg = path[i];
                if (i === path.length - 1) {
                    parent_1.files.push(file);
                }
                else {
                    parent_1 = parent_1.getChildFolder(1 /* FOLDER */, seg);
                }
            }
        }
        // Compact the tree.
        _this.state = {
            root: root.compact()
        };
        return _this;
    }
    FileList.prototype.render = function () {
        var onFileSelected = this.props.onFileSelected;
        var editorFile = this.props.editorFile;
        return React.createElement("div", null, this.state.root.folders.map(function (f, i) {
            return React.createElement(FolderNode, { key: "folder" + i, contents: f, onFileSelected: onFileSelected, editorFile: editorFile });
        }));
    };
    return FileList;
}(React.Component));
export default FileList;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZV9saXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL3ZpZXdlci9jb21wb25lbnRzL2ZpbGVfbGlzdC9maWxlX2xpc3QudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLEtBQUssS0FBSyxNQUFNLE9BQU8sQ0FBQztBQUcvQixPQUFPLFVBQVUsTUFBTSxlQUFlLENBQUM7QUFDdkMsT0FBTyxFQUFDLE9BQU8sSUFBSSxNQUFNLEVBQWEsTUFBTSxnQkFBZ0IsQ0FBQztBQVk3RDtJQUFzQyxvQ0FBNkM7SUFDakYsa0JBQVksS0FBb0IsRUFBRSxPQUFhO1FBQS9DLFlBQ0Usa0JBQU0sS0FBSyxFQUFFLE9BQU8sQ0FBQyxTQXdCdEI7UUF2QkMsSUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUMzQyxJQUFJLElBQUksR0FBRyxJQUFJLE1BQU0sZUFBa0IsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRS9DLEdBQUcsQ0FBQyxDQUFlLFVBQUssRUFBTCxlQUFLLEVBQUwsbUJBQUssRUFBTCxJQUFLO1lBQW5CLElBQU0sSUFBSSxjQUFBO1lBQ2IsSUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzlCLElBQUksUUFBTSxHQUFHLElBQUksQ0FBQyxjQUFjLGlCQUFvQixHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDaEUsc0VBQXNFO1lBQ3RFLHdDQUF3QztZQUN4QyxJQUFNLElBQUksR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDOUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ3JDLElBQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDcEIsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDMUIsUUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQzFCLENBQUM7Z0JBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ04sUUFBTSxHQUFHLFFBQU0sQ0FBQyxjQUFjLGlCQUFvQixHQUFHLENBQUMsQ0FBQztnQkFDekQsQ0FBQztZQUNILENBQUM7U0FDRjtRQUVELG9CQUFvQjtRQUNwQixLQUFJLENBQUMsS0FBSyxHQUFHO1lBQ1gsSUFBSSxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUU7U0FDckIsQ0FBQzs7SUFDSixDQUFDO0lBRU0seUJBQU0sR0FBYjtRQUNFLElBQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDO1FBQ2pELElBQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDO1FBQ3pDLE1BQU0sQ0FBQyxpQ0FDSixJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQUMsQ0FBQyxFQUFFLENBQUM7WUFDaEMsT0FBQSxvQkFBQyxVQUFVLElBQUMsR0FBRyxFQUFFLFdBQVMsQ0FBRyxFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsY0FBYyxFQUFFLGNBQWMsRUFBRSxVQUFVLEVBQUUsVUFBVSxHQUFJO1FBQXRHLENBQXNHLENBQ3ZHLENBQ0csQ0FBQztJQUNULENBQUM7SUFDSCxlQUFDO0FBQUQsQ0FBQyxBQXJDRCxDQUFzQyxLQUFLLENBQUMsU0FBUyxHQXFDcEQiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQge2RlZmF1bHQgYXMgU291cmNlRmlsZU1hbmFnZXJ9IGZyb20gJy4uLy4uL21vZGVsL3NvdXJjZV9maWxlX21hbmFnZXInO1xuaW1wb3J0IFNvdXJjZUZpbGUgZnJvbSAnLi4vLi4vbW9kZWwvc291cmNlX2ZpbGUnO1xuaW1wb3J0IEZvbGRlck5vZGUgZnJvbSAnLi9mb2xkZXJfbm9kZSc7XG5pbXBvcnQge2RlZmF1bHQgYXMgRm9sZGVyLCBGb2xkZXJUeXBlfSBmcm9tICcuL21vZGVsL2ZvbGRlcic7XG5cbmludGVyZmFjZSBGaWxlTGlzdFByb3BzIHtcbiAgZmlsZXM6IFNvdXJjZUZpbGVNYW5hZ2VyO1xuICBvbkZpbGVTZWxlY3RlZDogKGZpbGU6IFNvdXJjZUZpbGUpID0+IHZvaWQ7XG4gIGVkaXRvckZpbGU6IFNvdXJjZUZpbGU7XG59XG5cbmludGVyZmFjZSBGaWxlTGlzdFN0YXRlIHtcbiAgcm9vdDogRm9sZGVyO1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBGaWxlTGlzdCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudDxGaWxlTGlzdFByb3BzLCBGaWxlTGlzdFN0YXRlPiB7XG4gIGNvbnN0cnVjdG9yKHByb3BzOiBGaWxlTGlzdFByb3BzLCBjb250ZXh0PzogYW55KSB7XG4gICAgc3VwZXIocHJvcHMsIGNvbnRleHQpO1xuICAgIGNvbnN0IGZpbGVzID0gcHJvcHMuZmlsZXMuZ2V0U291cmNlRmlsZXMoKTtcbiAgICBsZXQgcm9vdCA9IG5ldyBGb2xkZXIoRm9sZGVyVHlwZS5ST09ULCAnJywgJycpO1xuXG4gICAgZm9yIChjb25zdCBmaWxlIG9mIGZpbGVzKSB7XG4gICAgICBjb25zdCB1cmwgPSBuZXcgVVJMKGZpbGUudXJsKTtcbiAgICAgIGxldCBwYXJlbnQgPSByb290LmdldENoaWxkRm9sZGVyKEZvbGRlclR5cGUuT1JJR0lOLCB1cmwub3JpZ2luKTtcbiAgICAgIC8vIE4uQi46IEZpcnN0IHN0cmluZyBpbiB0aGlzIHNsaWNlIHdpbGwgYmUgJycgZm9yIHRoZSByb290IGRpcmVjdG9yeS5cbiAgICAgIC8vIFdlIHRyZWF0IG9yaWdpbnMgYXMgcm9vdCBkaXJlY3Rvcmllcy5cbiAgICAgIGNvbnN0IHBhdGggPSB1cmwucGF0aG5hbWUuc3BsaXQoJy8nKS5zbGljZSgxKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGF0aC5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBzZWcgPSBwYXRoW2ldO1xuICAgICAgICBpZiAoaSA9PT0gcGF0aC5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgcGFyZW50LmZpbGVzLnB1c2goZmlsZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGFyZW50ID0gcGFyZW50LmdldENoaWxkRm9sZGVyKEZvbGRlclR5cGUuRk9MREVSLCBzZWcpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gQ29tcGFjdCB0aGUgdHJlZS5cbiAgICB0aGlzLnN0YXRlID0ge1xuICAgICAgcm9vdDogcm9vdC5jb21wYWN0KClcbiAgICB9O1xuICB9XG5cbiAgcHVibGljIHJlbmRlcigpIHtcbiAgICBjb25zdCBvbkZpbGVTZWxlY3RlZCA9IHRoaXMucHJvcHMub25GaWxlU2VsZWN0ZWQ7XG4gICAgY29uc3QgZWRpdG9yRmlsZSA9IHRoaXMucHJvcHMuZWRpdG9yRmlsZTtcbiAgICByZXR1cm4gPGRpdj5cbiAgICAgIHt0aGlzLnN0YXRlLnJvb3QuZm9sZGVycy5tYXAoKGYsIGkpID0+XG4gICAgICAgIDxGb2xkZXJOb2RlIGtleT17YGZvbGRlciR7aX1gfSBjb250ZW50cz17Zn0gb25GaWxlU2VsZWN0ZWQ9e29uRmlsZVNlbGVjdGVkfSBlZGl0b3JGaWxlPXtlZGl0b3JGaWxlfSAvPlxuICAgICAgKX1cbiAgICA8L2Rpdj47XG4gIH1cbn0iXX0=