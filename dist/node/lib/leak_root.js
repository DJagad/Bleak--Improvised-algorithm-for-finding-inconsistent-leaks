"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Represents a leak root in a BLeak report.
 */
class LeakRoot {
    constructor(id, paths, scores, stacks = []) {
        this.id = id;
        this.paths = paths;
        this.scores = scores;
        this.stacks = stacks;
    }
    static FromJSON(lr) {
        return new LeakRoot(lr.id, lr.paths, lr.scores, lr.stacks);
    }
    addStackTrace(st) {
        this.stacks.push(st);
    }
    toJSON() {
        return {
            id: this.id,
            paths: this.paths,
            scores: this.scores,
            stacks: this.stacks
        };
    }
}
exports.default = LeakRoot;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGVha19yb290LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2xpYi9sZWFrX3Jvb3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFFQTs7R0FFRztBQUNIO0lBS0UsWUFDa0IsRUFBVSxFQUNWLEtBQWMsRUFDZCxNQUFtQixFQUNuQixTQUFtQixFQUFFO1FBSHJCLE9BQUUsR0FBRixFQUFFLENBQVE7UUFDVixVQUFLLEdBQUwsS0FBSyxDQUFTO1FBQ2QsV0FBTSxHQUFOLE1BQU0sQ0FBYTtRQUNuQixXQUFNLEdBQU4sTUFBTSxDQUFlO0lBQ3BDLENBQUM7SUFURyxNQUFNLENBQUMsUUFBUSxDQUFDLEVBQWE7UUFDbEMsTUFBTSxDQUFDLElBQUksUUFBUSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUM3RCxDQUFDO0lBU00sYUFBYSxDQUFDLEVBQVU7UUFDN0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDdkIsQ0FBQztJQUVNLE1BQU07UUFDWCxNQUFNLENBQUM7WUFDTCxFQUFFLEVBQUUsSUFBSSxDQUFDLEVBQUU7WUFDWCxLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUs7WUFDakIsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNO1lBQ25CLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTTtTQUNwQixDQUFDO0lBQ0osQ0FBQztDQUNGO0FBeEJELDJCQXdCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7SUxlYWtSb290LCBJTGVha1Njb3JlcywgSVN0YWNrLCBJUGF0aH0gZnJvbSAnLi4vY29tbW9uL2ludGVyZmFjZXMnO1xuXG4vKipcbiAqIFJlcHJlc2VudHMgYSBsZWFrIHJvb3QgaW4gYSBCTGVhayByZXBvcnQuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIExlYWtSb290IGltcGxlbWVudHMgSUxlYWtSb290IHtcbiAgcHVibGljIHN0YXRpYyBGcm9tSlNPTihscjogSUxlYWtSb290KTogTGVha1Jvb3Qge1xuICAgIHJldHVybiBuZXcgTGVha1Jvb3QobHIuaWQsIGxyLnBhdGhzLCBsci5zY29yZXMsIGxyLnN0YWNrcyk7XG4gIH1cblxuICBjb25zdHJ1Y3RvcihcbiAgICBwdWJsaWMgcmVhZG9ubHkgaWQ6IG51bWJlcixcbiAgICBwdWJsaWMgcmVhZG9ubHkgcGF0aHM6IElQYXRoW10sXG4gICAgcHVibGljIHJlYWRvbmx5IHNjb3JlczogSUxlYWtTY29yZXMsXG4gICAgcHVibGljIHJlYWRvbmx5IHN0YWNrczogSVN0YWNrW10gPSBbXVxuICApIHt9XG5cbiAgcHVibGljIGFkZFN0YWNrVHJhY2Uoc3Q6IElTdGFjayk6IHZvaWQge1xuICAgIHRoaXMuc3RhY2tzLnB1c2goc3QpO1xuICB9XG5cbiAgcHVibGljIHRvSlNPTigpOiBJTGVha1Jvb3Qge1xuICAgIHJldHVybiB7XG4gICAgICBpZDogdGhpcy5pZCxcbiAgICAgIHBhdGhzOiB0aGlzLnBhdGhzLFxuICAgICAgc2NvcmVzOiB0aGlzLnNjb3JlcyxcbiAgICAgIHN0YWNrczogdGhpcy5zdGFja3NcbiAgICB9O1xuICB9XG59Il19