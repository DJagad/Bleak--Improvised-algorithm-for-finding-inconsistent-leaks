import * as tslib_1 from "tslib";
import * as React from 'react';
var FileNode = /** @class */ (function (_super) {
    tslib_1.__extends(FileNode, _super);
    function FileNode() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    FileNode.prototype.render = function () {
        var file = this.props.file;
        var name = file.url.slice(file.url.lastIndexOf('/') + 1);
        var className = this.props.editorFile === file ? "file selected" : "file";
        return React.createElement("div", { className: className, onClick: this.props.onFileSelected.bind(null, file) }, name);
    };
    return FileNode;
}(React.Component));
export default FileNode;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZV9ub2RlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL3ZpZXdlci9jb21wb25lbnRzL2ZpbGVfbGlzdC9maWxlX25vZGUudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLEtBQUssS0FBSyxNQUFNLE9BQU8sQ0FBQztBQVMvQjtJQUFzQyxvQ0FBa0M7SUFBeEU7O0lBT0EsQ0FBQztJQU5RLHlCQUFNLEdBQWI7UUFDRSxJQUFNLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQztRQUM3QixJQUFNLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUMzRCxJQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDO1FBQzVFLE1BQU0sQ0FBQyw2QkFBSyxTQUFTLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFHLElBQUksQ0FBTyxDQUFDO0lBQ3RHLENBQUM7SUFDSCxlQUFDO0FBQUQsQ0FBQyxBQVBELENBQXNDLEtBQUssQ0FBQyxTQUFTLEdBT3BEIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IFNvdXJjZUZpbGUgZnJvbSAnLi4vLi4vbW9kZWwvc291cmNlX2ZpbGUnO1xuXG5pbnRlcmZhY2UgRmlsZU5vZGVQcm9wcyB7XG4gIGZpbGU6IFNvdXJjZUZpbGU7XG4gIGVkaXRvckZpbGU6IFNvdXJjZUZpbGU7XG4gIG9uRmlsZVNlbGVjdGVkOiAoZjogU291cmNlRmlsZSkgPT4gdm9pZDtcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRmlsZU5vZGUgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQ8RmlsZU5vZGVQcm9wcywge30+IHtcbiAgcHVibGljIHJlbmRlcigpIHtcbiAgICBjb25zdCBmaWxlID0gdGhpcy5wcm9wcy5maWxlO1xuICAgIGNvbnN0IG5hbWUgPSBmaWxlLnVybC5zbGljZShmaWxlLnVybC5sYXN0SW5kZXhPZignLycpICsgMSk7XG4gICAgY29uc3QgY2xhc3NOYW1lID0gdGhpcy5wcm9wcy5lZGl0b3JGaWxlID09PSBmaWxlID8gXCJmaWxlIHNlbGVjdGVkXCIgOiBcImZpbGVcIjtcbiAgICByZXR1cm4gPGRpdiBjbGFzc05hbWU9e2NsYXNzTmFtZX0gb25DbGljaz17dGhpcy5wcm9wcy5vbkZpbGVTZWxlY3RlZC5iaW5kKG51bGwsIGZpbGUpfT57bmFtZX08L2Rpdj47XG4gIH1cbn1cbiJdfQ==