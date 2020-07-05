import * as tslib_1 from "tslib";
import * as React from 'react';
import FileNode from './file_node';
import TreeView from 'react-treeview';
var FolderNode = /** @class */ (function (_super) {
    tslib_1.__extends(FolderNode, _super);
    function FolderNode(props, context) {
        var _this = _super.call(this, props, context) || this;
        // Begin unexpanded unless we contain the currently displayed file.
        _this.state = {
            expanded: props.contents.hasFile(_this.props.editorFile)
        };
        _this._onClick = function () {
            // Stay expanded if we contain the currently-displayed file, else update expansion
            // status.
            _this.setState({
                expanded: props.contents.hasFile(_this.props.editorFile) || !_this.state.expanded
            });
        };
        return _this;
    }
    FolderNode.prototype._updateState = function (props) {
        // Stay expanded if expanded, else expand if we contain the currently-displayed file.
        this.setState({
            expanded: this.state.expanded || props.contents.hasFile(props.editorFile)
        });
    };
    FolderNode.prototype.componentWillMount = function () {
        this._updateState(this.props);
    };
    FolderNode.prototype.componentWillReceiveProps = function (nextProps) {
        this._updateState(nextProps);
    };
    FolderNode.prototype.render = function () {
        var contents = this.props.contents;
        var onFileSelected = this.props.onFileSelected;
        var editorFile = this.props.editorFile;
        var label = React.createElement("span", { className: "folder", onClick: this._onClick }, contents.name);
        return React.createElement(TreeView, { nodeLabel: label, onClick: this._onClick, collapsed: !this.state.expanded },
            contents.folders.map(function (f, i) {
                return React.createElement(FolderNode, { key: "folder" + i, contents: f, onFileSelected: onFileSelected, editorFile: editorFile });
            }),
            contents.files.map(function (f, i) {
                return React.createElement(FileNode, { key: "file" + i, file: f, editorFile: editorFile, onFileSelected: onFileSelected });
            }));
    };
    return FolderNode;
}(React.Component));
export default FolderNode;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9sZGVyX25vZGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvdmlld2VyL2NvbXBvbmVudHMvZmlsZV9saXN0L2ZvbGRlcl9ub2RlLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxLQUFLLEtBQUssTUFBTSxPQUFPLENBQUM7QUFFL0IsT0FBTyxRQUFRLE1BQU0sYUFBYSxDQUFDO0FBRW5DLE9BQU8sUUFBUSxNQUFNLGdCQUFnQixDQUFDO0FBWXRDO0lBQXdDLHNDQUFpRDtJQUV2RixvQkFBWSxLQUFzQixFQUFFLE9BQWE7UUFBakQsWUFDRSxrQkFBTSxLQUFLLEVBQUUsT0FBTyxDQUFDLFNBWXRCO1FBWEMsbUVBQW1FO1FBQ25FLEtBQUksQ0FBQyxLQUFLLEdBQUc7WUFDWCxRQUFRLEVBQUUsS0FBSyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsS0FBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUM7U0FDeEQsQ0FBQztRQUNGLEtBQUksQ0FBQyxRQUFRLEdBQUc7WUFDZCxrRkFBa0Y7WUFDbEYsVUFBVTtZQUNWLEtBQUksQ0FBQyxRQUFRLENBQUM7Z0JBQ1osUUFBUSxFQUFFLEtBQUssQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEtBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxLQUFJLENBQUMsS0FBSyxDQUFDLFFBQVE7YUFDaEYsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDOztJQUNKLENBQUM7SUFFTyxpQ0FBWSxHQUFwQixVQUFxQixLQUFzQjtRQUN6QyxxRkFBcUY7UUFDckYsSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUNaLFFBQVEsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDO1NBQzFFLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFTSx1Q0FBa0IsR0FBekI7UUFDRSxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNoQyxDQUFDO0lBRU0sOENBQXlCLEdBQWhDLFVBQWlDLFNBQTBCO1FBQ3pELElBQUksQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDL0IsQ0FBQztJQUVNLDJCQUFNLEdBQWI7UUFDRSxJQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQztRQUNyQyxJQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQztRQUNqRCxJQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQztRQUN6QyxJQUFNLEtBQUssR0FBRyw4QkFBTSxTQUFTLEVBQUMsUUFBUSxFQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsUUFBUSxJQUFHLFFBQVEsQ0FBQyxJQUFJLENBQVEsQ0FBQztRQUN0RixNQUFNLENBQUMsb0JBQUMsUUFBUSxJQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxRQUFRLEVBQUUsU0FBUyxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRO1lBQ3ZGLFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQ3pCLE9BQUEsb0JBQUMsVUFBVSxJQUFDLEdBQUcsRUFBRSxXQUFTLENBQUcsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLGNBQWMsRUFBRSxjQUFjLEVBQUUsVUFBVSxFQUFFLFVBQVUsR0FBSTtZQUF0RyxDQUFzRyxDQUN2RztZQUNBLFFBQVEsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFVBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQ3ZCLE9BQUEsb0JBQUMsUUFBUSxJQUFDLEdBQUcsRUFBRSxTQUFPLENBQUcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLFVBQVUsRUFBRSxVQUFVLEVBQUUsY0FBYyxFQUFFLGNBQWMsR0FBSTtZQUE5RixDQUE4RixDQUMvRixDQUNRLENBQUM7SUFDZCxDQUFDO0lBQ0gsaUJBQUM7QUFBRCxDQUFDLEFBOUNELENBQXdDLEtBQUssQ0FBQyxTQUFTLEdBOEN0RCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7ZGVmYXVsdCBhcyBGb2xkZXJ9IGZyb20gJy4vbW9kZWwvZm9sZGVyJztcbmltcG9ydCBGaWxlTm9kZSBmcm9tICcuL2ZpbGVfbm9kZSc7XG5pbXBvcnQgU291cmNlRmlsZSBmcm9tICcuLi8uLi9tb2RlbC9zb3VyY2VfZmlsZSc7XG5pbXBvcnQgVHJlZVZpZXcgZnJvbSAncmVhY3QtdHJlZXZpZXcnO1xuXG5pbnRlcmZhY2UgRm9sZGVyTm9kZVN0YXRlIHtcbiAgZXhwYW5kZWQ6IGJvb2xlYW47XG59XG5cbmludGVyZmFjZSBGb2xkZXJOb2RlUHJvcHMge1xuICBjb250ZW50czogRm9sZGVyO1xuICBvbkZpbGVTZWxlY3RlZDogKGY6IFNvdXJjZUZpbGUpID0+IHZvaWQ7XG4gIGVkaXRvckZpbGU6IFNvdXJjZUZpbGU7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEZvbGRlck5vZGUgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQ8Rm9sZGVyTm9kZVByb3BzLCBGb2xkZXJOb2RlU3RhdGU+IHtcbiAgcHJpdmF0ZSBfb25DbGljazogKCkgPT4gdm9pZDtcbiAgY29uc3RydWN0b3IocHJvcHM6IEZvbGRlck5vZGVQcm9wcywgY29udGV4dD86IGFueSkge1xuICAgIHN1cGVyKHByb3BzLCBjb250ZXh0KTtcbiAgICAvLyBCZWdpbiB1bmV4cGFuZGVkIHVubGVzcyB3ZSBjb250YWluIHRoZSBjdXJyZW50bHkgZGlzcGxheWVkIGZpbGUuXG4gICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgIGV4cGFuZGVkOiBwcm9wcy5jb250ZW50cy5oYXNGaWxlKHRoaXMucHJvcHMuZWRpdG9yRmlsZSlcbiAgICB9O1xuICAgIHRoaXMuX29uQ2xpY2sgPSAoKSA9PiB7XG4gICAgICAvLyBTdGF5IGV4cGFuZGVkIGlmIHdlIGNvbnRhaW4gdGhlIGN1cnJlbnRseS1kaXNwbGF5ZWQgZmlsZSwgZWxzZSB1cGRhdGUgZXhwYW5zaW9uXG4gICAgICAvLyBzdGF0dXMuXG4gICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgZXhwYW5kZWQ6IHByb3BzLmNvbnRlbnRzLmhhc0ZpbGUodGhpcy5wcm9wcy5lZGl0b3JGaWxlKSB8fCAhdGhpcy5zdGF0ZS5leHBhbmRlZFxuICAgICAgfSk7XG4gICAgfTtcbiAgfVxuXG4gIHByaXZhdGUgX3VwZGF0ZVN0YXRlKHByb3BzOiBGb2xkZXJOb2RlUHJvcHMpOiB2b2lkIHtcbiAgICAvLyBTdGF5IGV4cGFuZGVkIGlmIGV4cGFuZGVkLCBlbHNlIGV4cGFuZCBpZiB3ZSBjb250YWluIHRoZSBjdXJyZW50bHktZGlzcGxheWVkIGZpbGUuXG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBleHBhbmRlZDogdGhpcy5zdGF0ZS5leHBhbmRlZCB8fCBwcm9wcy5jb250ZW50cy5oYXNGaWxlKHByb3BzLmVkaXRvckZpbGUpXG4gICAgfSk7XG4gIH1cblxuICBwdWJsaWMgY29tcG9uZW50V2lsbE1vdW50KCkge1xuICAgIHRoaXMuX3VwZGF0ZVN0YXRlKHRoaXMucHJvcHMpO1xuICB9XG5cbiAgcHVibGljIGNvbXBvbmVudFdpbGxSZWNlaXZlUHJvcHMobmV4dFByb3BzOiBGb2xkZXJOb2RlUHJvcHMpIHtcbiAgICB0aGlzLl91cGRhdGVTdGF0ZShuZXh0UHJvcHMpO1xuICB9XG5cbiAgcHVibGljIHJlbmRlcigpOiBKU1guRWxlbWVudCB7XG4gICAgY29uc3QgY29udGVudHMgPSB0aGlzLnByb3BzLmNvbnRlbnRzO1xuICAgIGNvbnN0IG9uRmlsZVNlbGVjdGVkID0gdGhpcy5wcm9wcy5vbkZpbGVTZWxlY3RlZDtcbiAgICBjb25zdCBlZGl0b3JGaWxlID0gdGhpcy5wcm9wcy5lZGl0b3JGaWxlO1xuICAgIGNvbnN0IGxhYmVsID0gPHNwYW4gY2xhc3NOYW1lPVwiZm9sZGVyXCIgb25DbGljaz17dGhpcy5fb25DbGlja30+e2NvbnRlbnRzLm5hbWV9PC9zcGFuPjtcbiAgICByZXR1cm4gPFRyZWVWaWV3IG5vZGVMYWJlbD17bGFiZWx9IG9uQ2xpY2s9e3RoaXMuX29uQ2xpY2t9IGNvbGxhcHNlZD17IXRoaXMuc3RhdGUuZXhwYW5kZWR9PlxuICAgICAge2NvbnRlbnRzLmZvbGRlcnMubWFwKChmLCBpKSA9PlxuICAgICAgICA8Rm9sZGVyTm9kZSBrZXk9e2Bmb2xkZXIke2l9YH0gY29udGVudHM9e2Z9IG9uRmlsZVNlbGVjdGVkPXtvbkZpbGVTZWxlY3RlZH0gZWRpdG9yRmlsZT17ZWRpdG9yRmlsZX0gLz5cbiAgICAgICl9XG4gICAgICB7Y29udGVudHMuZmlsZXMubWFwKChmLCBpKSA9PlxuICAgICAgICA8RmlsZU5vZGUga2V5PXtgZmlsZSR7aX1gfSBmaWxlPXtmfSBlZGl0b3JGaWxlPXtlZGl0b3JGaWxlfSBvbkZpbGVTZWxlY3RlZD17b25GaWxlU2VsZWN0ZWR9IC8+XG4gICAgICApfVxuICAgIDwvVHJlZVZpZXc+O1xuICB9XG59Il19