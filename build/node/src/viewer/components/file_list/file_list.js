"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const folder_node_1 = require("./folder_node");
const folder_1 = require("./model/folder");
class FileList extends React.Component {
    constructor(props, context) {
        super(props, context);
        const files = props.files.getSourceFiles();
        let root = new folder_1.default(2 /* ROOT */, '', '');
        for (const file of files) {
            const url = new URL(file.url);
            let parent = root.getChildFolder(0 /* ORIGIN */, url.origin);
            // N.B.: First string in this slice will be '' for the root directory.
            // We treat origins as root directories.
            const path = url.pathname.split('/').slice(1);
            for (let i = 0; i < path.length; i++) {
                const seg = path[i];
                if (i === path.length - 1) {
                    parent.files.push(file);
                }
                else {
                    parent = parent.getChildFolder(1 /* FOLDER */, seg);
                }
            }
        }
        // Compact the tree.
        this.state = {
            root: root.compact()
        };
    }
    render() {
        const onFileSelected = this.props.onFileSelected;
        const editorFile = this.props.editorFile;
        return React.createElement("div", null, this.state.root.folders.map((f, i) => React.createElement(folder_node_1.default, { key: `folder${i}`, contents: f, onFileSelected: onFileSelected, editorFile: editorFile })));
    }
}
exports.default = FileList;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZV9saXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL3ZpZXdlci9jb21wb25lbnRzL2ZpbGVfbGlzdC9maWxlX2xpc3QudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsK0JBQStCO0FBRy9CLCtDQUF1QztBQUN2QywyQ0FBNkQ7QUFZN0QsY0FBOEIsU0FBUSxLQUFLLENBQUMsU0FBdUM7SUFDakYsWUFBWSxLQUFvQixFQUFFLE9BQWE7UUFDN0MsS0FBSyxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztRQUN0QixNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBQzNDLElBQUksSUFBSSxHQUFHLElBQUksZ0JBQU0sZUFBa0IsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRS9DLEdBQUcsQ0FBQyxDQUFDLE1BQU0sSUFBSSxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDekIsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzlCLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxjQUFjLGlCQUFvQixHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDaEUsc0VBQXNFO1lBQ3RFLHdDQUF3QztZQUN4QyxNQUFNLElBQUksR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDOUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ3JDLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDcEIsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDMUIsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQzFCLENBQUM7Z0JBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ04sTUFBTSxHQUFHLE1BQU0sQ0FBQyxjQUFjLGlCQUFvQixHQUFHLENBQUMsQ0FBQztnQkFDekQsQ0FBQztZQUNILENBQUM7UUFDSCxDQUFDO1FBRUQsb0JBQW9CO1FBQ3BCLElBQUksQ0FBQyxLQUFLLEdBQUc7WUFDWCxJQUFJLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRTtTQUNyQixDQUFDO0lBQ0osQ0FBQztJQUVNLE1BQU07UUFDWCxNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQztRQUNqRCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQztRQUN6QyxNQUFNLENBQUMsaUNBQ0osSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUNwQyxvQkFBQyxxQkFBVSxJQUFDLEdBQUcsRUFBRSxTQUFTLENBQUMsRUFBRSxFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsY0FBYyxFQUFFLGNBQWMsRUFBRSxVQUFVLEVBQUUsVUFBVSxHQUFJLENBQ3ZHLENBQ0csQ0FBQztJQUNULENBQUM7Q0FDRjtBQXJDRCwyQkFxQ0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQge2RlZmF1bHQgYXMgU291cmNlRmlsZU1hbmFnZXJ9IGZyb20gJy4uLy4uL21vZGVsL3NvdXJjZV9maWxlX21hbmFnZXInO1xuaW1wb3J0IFNvdXJjZUZpbGUgZnJvbSAnLi4vLi4vbW9kZWwvc291cmNlX2ZpbGUnO1xuaW1wb3J0IEZvbGRlck5vZGUgZnJvbSAnLi9mb2xkZXJfbm9kZSc7XG5pbXBvcnQge2RlZmF1bHQgYXMgRm9sZGVyLCBGb2xkZXJUeXBlfSBmcm9tICcuL21vZGVsL2ZvbGRlcic7XG5cbmludGVyZmFjZSBGaWxlTGlzdFByb3BzIHtcbiAgZmlsZXM6IFNvdXJjZUZpbGVNYW5hZ2VyO1xuICBvbkZpbGVTZWxlY3RlZDogKGZpbGU6IFNvdXJjZUZpbGUpID0+IHZvaWQ7XG4gIGVkaXRvckZpbGU6IFNvdXJjZUZpbGU7XG59XG5cbmludGVyZmFjZSBGaWxlTGlzdFN0YXRlIHtcbiAgcm9vdDogRm9sZGVyO1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBGaWxlTGlzdCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudDxGaWxlTGlzdFByb3BzLCBGaWxlTGlzdFN0YXRlPiB7XG4gIGNvbnN0cnVjdG9yKHByb3BzOiBGaWxlTGlzdFByb3BzLCBjb250ZXh0PzogYW55KSB7XG4gICAgc3VwZXIocHJvcHMsIGNvbnRleHQpO1xuICAgIGNvbnN0IGZpbGVzID0gcHJvcHMuZmlsZXMuZ2V0U291cmNlRmlsZXMoKTtcbiAgICBsZXQgcm9vdCA9IG5ldyBGb2xkZXIoRm9sZGVyVHlwZS5ST09ULCAnJywgJycpO1xuXG4gICAgZm9yIChjb25zdCBmaWxlIG9mIGZpbGVzKSB7XG4gICAgICBjb25zdCB1cmwgPSBuZXcgVVJMKGZpbGUudXJsKTtcbiAgICAgIGxldCBwYXJlbnQgPSByb290LmdldENoaWxkRm9sZGVyKEZvbGRlclR5cGUuT1JJR0lOLCB1cmwub3JpZ2luKTtcbiAgICAgIC8vIE4uQi46IEZpcnN0IHN0cmluZyBpbiB0aGlzIHNsaWNlIHdpbGwgYmUgJycgZm9yIHRoZSByb290IGRpcmVjdG9yeS5cbiAgICAgIC8vIFdlIHRyZWF0IG9yaWdpbnMgYXMgcm9vdCBkaXJlY3Rvcmllcy5cbiAgICAgIGNvbnN0IHBhdGggPSB1cmwucGF0aG5hbWUuc3BsaXQoJy8nKS5zbGljZSgxKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGF0aC5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBzZWcgPSBwYXRoW2ldO1xuICAgICAgICBpZiAoaSA9PT0gcGF0aC5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgcGFyZW50LmZpbGVzLnB1c2goZmlsZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGFyZW50ID0gcGFyZW50LmdldENoaWxkRm9sZGVyKEZvbGRlclR5cGUuRk9MREVSLCBzZWcpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gQ29tcGFjdCB0aGUgdHJlZS5cbiAgICB0aGlzLnN0YXRlID0ge1xuICAgICAgcm9vdDogcm9vdC5jb21wYWN0KClcbiAgICB9O1xuICB9XG5cbiAgcHVibGljIHJlbmRlcigpIHtcbiAgICBjb25zdCBvbkZpbGVTZWxlY3RlZCA9IHRoaXMucHJvcHMub25GaWxlU2VsZWN0ZWQ7XG4gICAgY29uc3QgZWRpdG9yRmlsZSA9IHRoaXMucHJvcHMuZWRpdG9yRmlsZTtcbiAgICByZXR1cm4gPGRpdj5cbiAgICAgIHt0aGlzLnN0YXRlLnJvb3QuZm9sZGVycy5tYXAoKGYsIGkpID0+XG4gICAgICAgIDxGb2xkZXJOb2RlIGtleT17YGZvbGRlciR7aX1gfSBjb250ZW50cz17Zn0gb25GaWxlU2VsZWN0ZWQ9e29uRmlsZVNlbGVjdGVkfSBlZGl0b3JGaWxlPXtlZGl0b3JGaWxlfSAvPlxuICAgICAgKX1cbiAgICA8L2Rpdj47XG4gIH1cbn0iXX0=