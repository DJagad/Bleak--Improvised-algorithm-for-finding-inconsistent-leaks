"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const file_node_1 = require("./file_node");
const react_treeview_1 = require("react-treeview");
class FolderNode extends React.Component {
    constructor(props, context) {
        super(props, context);
        // Begin unexpanded unless we contain the currently displayed file.
        this.state = {
            expanded: props.contents.hasFile(this.props.editorFile)
        };
        this._onClick = () => {
            // Stay expanded if we contain the currently-displayed file, else update expansion
            // status.
            this.setState({
                expanded: props.contents.hasFile(this.props.editorFile) || !this.state.expanded
            });
        };
    }
    _updateState(props) {
        // Stay expanded if expanded, else expand if we contain the currently-displayed file.
        this.setState({
            expanded: this.state.expanded || props.contents.hasFile(props.editorFile)
        });
    }
    componentWillMount() {
        this._updateState(this.props);
    }
    componentWillReceiveProps(nextProps) {
        this._updateState(nextProps);
    }
    render() {
        const contents = this.props.contents;
        const onFileSelected = this.props.onFileSelected;
        const editorFile = this.props.editorFile;
        const label = React.createElement("span", { className: "folder", onClick: this._onClick }, contents.name);
        return React.createElement(react_treeview_1.default, { nodeLabel: label, onClick: this._onClick, collapsed: !this.state.expanded },
            contents.folders.map((f, i) => React.createElement(FolderNode, { key: `folder${i}`, contents: f, onFileSelected: onFileSelected, editorFile: editorFile })),
            contents.files.map((f, i) => React.createElement(file_node_1.default, { key: `file${i}`, file: f, editorFile: editorFile, onFileSelected: onFileSelected })));
    }
}
exports.default = FolderNode;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9sZGVyX25vZGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvdmlld2VyL2NvbXBvbmVudHMvZmlsZV9saXN0L2ZvbGRlcl9ub2RlLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLCtCQUErQjtBQUUvQiwyQ0FBbUM7QUFFbkMsbURBQXNDO0FBWXRDLGdCQUFnQyxTQUFRLEtBQUssQ0FBQyxTQUEyQztJQUV2RixZQUFZLEtBQXNCLEVBQUUsT0FBYTtRQUMvQyxLQUFLLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ3RCLG1FQUFtRTtRQUNuRSxJQUFJLENBQUMsS0FBSyxHQUFHO1lBQ1gsUUFBUSxFQUFFLEtBQUssQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDO1NBQ3hELENBQUM7UUFDRixJQUFJLENBQUMsUUFBUSxHQUFHLEdBQUcsRUFBRTtZQUNuQixrRkFBa0Y7WUFDbEYsVUFBVTtZQUNWLElBQUksQ0FBQyxRQUFRLENBQUM7Z0JBQ1osUUFBUSxFQUFFLEtBQUssQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVE7YUFDaEYsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDO0lBQ0osQ0FBQztJQUVPLFlBQVksQ0FBQyxLQUFzQjtRQUN6QyxxRkFBcUY7UUFDckYsSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUNaLFFBQVEsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDO1NBQzFFLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFTSxrQkFBa0I7UUFDdkIsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDaEMsQ0FBQztJQUVNLHlCQUF5QixDQUFDLFNBQTBCO1FBQ3pELElBQUksQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDL0IsQ0FBQztJQUVNLE1BQU07UUFDWCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQztRQUNyQyxNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQztRQUNqRCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQztRQUN6QyxNQUFNLEtBQUssR0FBRyw4QkFBTSxTQUFTLEVBQUMsUUFBUSxFQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsUUFBUSxJQUFHLFFBQVEsQ0FBQyxJQUFJLENBQVEsQ0FBQztRQUN0RixNQUFNLENBQUMsb0JBQUMsd0JBQVEsSUFBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsUUFBUSxFQUFFLFNBQVMsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUTtZQUN2RixRQUFRLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUM3QixvQkFBQyxVQUFVLElBQUMsR0FBRyxFQUFFLFNBQVMsQ0FBQyxFQUFFLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxjQUFjLEVBQUUsY0FBYyxFQUFFLFVBQVUsRUFBRSxVQUFVLEdBQUksQ0FDdkc7WUFDQSxRQUFRLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUMzQixvQkFBQyxtQkFBUSxJQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBRSxjQUFjLEVBQUUsY0FBYyxHQUFJLENBQy9GLENBQ1EsQ0FBQztJQUNkLENBQUM7Q0FDRjtBQTlDRCw2QkE4Q0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQge2RlZmF1bHQgYXMgRm9sZGVyfSBmcm9tICcuL21vZGVsL2ZvbGRlcic7XG5pbXBvcnQgRmlsZU5vZGUgZnJvbSAnLi9maWxlX25vZGUnO1xuaW1wb3J0IFNvdXJjZUZpbGUgZnJvbSAnLi4vLi4vbW9kZWwvc291cmNlX2ZpbGUnO1xuaW1wb3J0IFRyZWVWaWV3IGZyb20gJ3JlYWN0LXRyZWV2aWV3JztcblxuaW50ZXJmYWNlIEZvbGRlck5vZGVTdGF0ZSB7XG4gIGV4cGFuZGVkOiBib29sZWFuO1xufVxuXG5pbnRlcmZhY2UgRm9sZGVyTm9kZVByb3BzIHtcbiAgY29udGVudHM6IEZvbGRlcjtcbiAgb25GaWxlU2VsZWN0ZWQ6IChmOiBTb3VyY2VGaWxlKSA9PiB2b2lkO1xuICBlZGl0b3JGaWxlOiBTb3VyY2VGaWxlO1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBGb2xkZXJOb2RlIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50PEZvbGRlck5vZGVQcm9wcywgRm9sZGVyTm9kZVN0YXRlPiB7XG4gIHByaXZhdGUgX29uQ2xpY2s6ICgpID0+IHZvaWQ7XG4gIGNvbnN0cnVjdG9yKHByb3BzOiBGb2xkZXJOb2RlUHJvcHMsIGNvbnRleHQ/OiBhbnkpIHtcbiAgICBzdXBlcihwcm9wcywgY29udGV4dCk7XG4gICAgLy8gQmVnaW4gdW5leHBhbmRlZCB1bmxlc3Mgd2UgY29udGFpbiB0aGUgY3VycmVudGx5IGRpc3BsYXllZCBmaWxlLlxuICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICBleHBhbmRlZDogcHJvcHMuY29udGVudHMuaGFzRmlsZSh0aGlzLnByb3BzLmVkaXRvckZpbGUpXG4gICAgfTtcbiAgICB0aGlzLl9vbkNsaWNrID0gKCkgPT4ge1xuICAgICAgLy8gU3RheSBleHBhbmRlZCBpZiB3ZSBjb250YWluIHRoZSBjdXJyZW50bHktZGlzcGxheWVkIGZpbGUsIGVsc2UgdXBkYXRlIGV4cGFuc2lvblxuICAgICAgLy8gc3RhdHVzLlxuICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgIGV4cGFuZGVkOiBwcm9wcy5jb250ZW50cy5oYXNGaWxlKHRoaXMucHJvcHMuZWRpdG9yRmlsZSkgfHwgIXRoaXMuc3RhdGUuZXhwYW5kZWRcbiAgICAgIH0pO1xuICAgIH07XG4gIH1cblxuICBwcml2YXRlIF91cGRhdGVTdGF0ZShwcm9wczogRm9sZGVyTm9kZVByb3BzKTogdm9pZCB7XG4gICAgLy8gU3RheSBleHBhbmRlZCBpZiBleHBhbmRlZCwgZWxzZSBleHBhbmQgaWYgd2UgY29udGFpbiB0aGUgY3VycmVudGx5LWRpc3BsYXllZCBmaWxlLlxuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgZXhwYW5kZWQ6IHRoaXMuc3RhdGUuZXhwYW5kZWQgfHwgcHJvcHMuY29udGVudHMuaGFzRmlsZShwcm9wcy5lZGl0b3JGaWxlKVxuICAgIH0pO1xuICB9XG5cbiAgcHVibGljIGNvbXBvbmVudFdpbGxNb3VudCgpIHtcbiAgICB0aGlzLl91cGRhdGVTdGF0ZSh0aGlzLnByb3BzKTtcbiAgfVxuXG4gIHB1YmxpYyBjb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzKG5leHRQcm9wczogRm9sZGVyTm9kZVByb3BzKSB7XG4gICAgdGhpcy5fdXBkYXRlU3RhdGUobmV4dFByb3BzKTtcbiAgfVxuXG4gIHB1YmxpYyByZW5kZXIoKTogSlNYLkVsZW1lbnQge1xuICAgIGNvbnN0IGNvbnRlbnRzID0gdGhpcy5wcm9wcy5jb250ZW50cztcbiAgICBjb25zdCBvbkZpbGVTZWxlY3RlZCA9IHRoaXMucHJvcHMub25GaWxlU2VsZWN0ZWQ7XG4gICAgY29uc3QgZWRpdG9yRmlsZSA9IHRoaXMucHJvcHMuZWRpdG9yRmlsZTtcbiAgICBjb25zdCBsYWJlbCA9IDxzcGFuIGNsYXNzTmFtZT1cImZvbGRlclwiIG9uQ2xpY2s9e3RoaXMuX29uQ2xpY2t9Pntjb250ZW50cy5uYW1lfTwvc3Bhbj47XG4gICAgcmV0dXJuIDxUcmVlVmlldyBub2RlTGFiZWw9e2xhYmVsfSBvbkNsaWNrPXt0aGlzLl9vbkNsaWNrfSBjb2xsYXBzZWQ9eyF0aGlzLnN0YXRlLmV4cGFuZGVkfT5cbiAgICAgIHtjb250ZW50cy5mb2xkZXJzLm1hcCgoZiwgaSkgPT5cbiAgICAgICAgPEZvbGRlck5vZGUga2V5PXtgZm9sZGVyJHtpfWB9IGNvbnRlbnRzPXtmfSBvbkZpbGVTZWxlY3RlZD17b25GaWxlU2VsZWN0ZWR9IGVkaXRvckZpbGU9e2VkaXRvckZpbGV9IC8+XG4gICAgICApfVxuICAgICAge2NvbnRlbnRzLmZpbGVzLm1hcCgoZiwgaSkgPT5cbiAgICAgICAgPEZpbGVOb2RlIGtleT17YGZpbGUke2l9YH0gZmlsZT17Zn0gZWRpdG9yRmlsZT17ZWRpdG9yRmlsZX0gb25GaWxlU2VsZWN0ZWQ9e29uRmlsZVNlbGVjdGVkfSAvPlxuICAgICAgKX1cbiAgICA8L1RyZWVWaWV3PjtcbiAgfVxufSJdfQ==