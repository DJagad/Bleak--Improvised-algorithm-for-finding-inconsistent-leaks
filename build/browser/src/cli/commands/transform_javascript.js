import { readFileSync } from 'fs';
import { exposeClosureState, nopTransform } from '../../lib/transformations';
import BLeakResults from '../../lib/bleak_results';
import { extname, basename, join } from 'path';
import ProgressProgressBar from '../../lib/progress_progress_bar';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { URL } from 'url';
var TransformJavaScript = {
    command: 'transform-javascript',
    describe: "Transforms the given JavaScript to expose heap edges for diagnosis. Useful for debugging BLeak's program transformations.",
    builder: {
        in: {
            type: 'string',
            demand: true,
            describe: "Path to a BLeak configuration file, which contains source files to transform, or to an individual JavaScript file."
        },
        out: {
            type: 'string',
            demand: true,
            describe: "Directory to dump output files to. Will be created if it does not exist."
        },
        overwrite: {
            type: 'boolean',
            default: false,
            describe: "If true, overwrite files in the destination directory without prompting."
        },
        'nop-transform': {
            type: 'boolean',
            default: false,
            describe: "If true, BLeak does not transform the file, but appends a source map mapping the file to itself. Used for debugging BLeak's source map processing."
        }
    },
    handler: function (args) {
        if (!existsSync(args.out)) {
            mkdirSync(args.out);
        }
        var flag = args.overwrite ? 'w' : 'wx';
        var progressBar = new ProgressProgressBar(false);
        function transformFile(from, src, to) {
            progressBar.updateDescription("Transforming " + from + "...");
            var transformed = args['nop-transform'] ? nopTransform(from, src) : exposeClosureState(from, src);
            progressBar.nextOperation();
            progressBar.updateDescription("Writing " + from + " to " + to + "...");
            writeFileSync(to, Buffer.from(transformed, 'utf8'), { flag: flag });
            progressBar.nextOperation();
        }
        var data = readFileSync(args.in, 'utf8');
        if (extname(args.in) === '.json') {
            var results_1 = BLeakResults.FromJSON(JSON.parse(data));
            var urls = Object.keys(results_1.sourceFiles);
            progressBar.setOperationCount(urls.length * 2);
            urls.forEach(function (url) {
                var urlObj = new URL(url);
                var out = join(args.out, basename(urlObj.pathname));
                if (results_1.sourceFiles[url].mimeType === 'text/html') {
                    progressBar.log("Tool currently does not support HTML documents; skipping " + url + ".");
                    progressBar.nextOperation();
                    progressBar.nextOperation();
                }
                else {
                    transformFile(url, results_1.sourceFiles[url].source, out);
                }
            });
        }
        else {
            progressBar.setOperationCount(2);
            var src = data.toString();
            var out = join(args.out, basename(args.in));
            transformFile(args.in, src, out);
        }
    }
};
export default TransformJavaScript;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNmb3JtX2phdmFzY3JpcHQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvY2xpL2NvbW1hbmRzL3RyYW5zZm9ybV9qYXZhc2NyaXB0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxJQUFJLENBQUM7QUFDaEMsT0FBTyxFQUFDLGtCQUFrQixFQUFFLFlBQVksRUFBQyxNQUFNLDJCQUEyQixDQUFDO0FBQzNFLE9BQU8sWUFBWSxNQUFNLHlCQUF5QixDQUFDO0FBRW5ELE9BQU8sRUFBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUM3QyxPQUFPLG1CQUFtQixNQUFNLGlDQUFpQyxDQUFDO0FBQ2xFLE9BQU8sRUFBQyxVQUFVLEVBQUUsU0FBUyxFQUFFLGFBQWEsRUFBQyxNQUFNLElBQUksQ0FBQztBQUN4RCxPQUFPLEVBQUMsR0FBRyxFQUFDLE1BQU0sS0FBSyxDQUFDO0FBU3hCLElBQU0sbUJBQW1CLEdBQWtCO0lBQ3pDLE9BQU8sRUFBRSxzQkFBc0I7SUFDL0IsUUFBUSxFQUFFLDJIQUEySDtJQUNySSxPQUFPLEVBQUU7UUFDUCxFQUFFLEVBQUU7WUFDRixJQUFJLEVBQUUsUUFBUTtZQUNkLE1BQU0sRUFBRSxJQUFJO1lBQ1osUUFBUSxFQUFFLG9IQUFvSDtTQUMvSDtRQUNELEdBQUcsRUFBRTtZQUNILElBQUksRUFBRSxRQUFRO1lBQ2QsTUFBTSxFQUFFLElBQUk7WUFDWixRQUFRLEVBQUUsMEVBQTBFO1NBQ3JGO1FBQ0QsU0FBUyxFQUFFO1lBQ1QsSUFBSSxFQUFFLFNBQVM7WUFDZixPQUFPLEVBQUUsS0FBSztZQUNkLFFBQVEsRUFBRSwwRUFBMEU7U0FDckY7UUFDRCxlQUFlLEVBQUU7WUFDZixJQUFJLEVBQUUsU0FBUztZQUNmLE9BQU8sRUFBRSxLQUFLO1lBQ2QsUUFBUSxFQUFFLG9KQUFvSjtTQUMvSjtL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QUFHLEVBQUUsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzlDLGFBQWEsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUNuQyxDQUFDO0lBQ0gsQ0FBQztDQUNGLENBQUM7QUFFRixlQUFlLG1CQUFtQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtyZWFkRmlsZVN5bmN9IGZyb20gJ2ZzJztcbmltcG9ydCB7ZXhwb3NlQ2xvc3VyZVN0YXRlLCBub3BUcmFuc2Zvcm19IGZyb20gJy4uLy4uL2xpYi90cmFuc2Zvcm1hdGlvbnMnO1xuaW1wb3J0IEJMZWFrUmVzdWx0cyBmcm9tICcuLi8uLi9saWIvYmxlYWtfcmVzdWx0cyc7XG5pbXBvcnQge0NvbW1hbmRNb2R1bGV9IGZyb20gJ3lhcmdzJztcbmltcG9ydCB7ZXh0bmFtZSwgYmFzZW5hbWUsIGpvaW59IGZyb20gJ3BhdGgnO1xuaW1wb3J0IFByb2dyZXNzUHJvZ3Jlc3NCYXIgZnJvbSAnLi4vLi4vbGliL3Byb2dyZXNzX3Byb2dyZXNzX2Jhcic7XG5pbXBvcnQge2V4aXN0c1N5bmMsIG1rZGlyU3luYywgd3JpdGVGaWxlU3luY30gZnJvbSAnZnMnO1xuaW1wb3J0IHtVUkx9IGZyb20gJ3VybCc7XG5cbmludGVyZmFjZSBDb21tYW5kTGluZUFyZ3Mge1xuICBpbjogc3RyaW5nO1xuICBvdXQ6IHN0cmluZztcbiAgb3ZlcndyaXRlOiBib29sZWFuO1xuICAnbm9wLXRyYW5zZm9ybSc6IGJvb2xlYW47XG59XG5cbmNvbnN0IFRyYW5zZm9ybUphdmFTY3JpcHQ6IENvbW1hbmRNb2R1bGUgPSB7XG4gIGNvbW1hbmQ6ICd0cmFuc2Zvcm0tamF2YXNjcmlwdCcsXG4gIGRlc2NyaWJlOiBgVHJhbnNmb3JtcyB0aGUgZ2l2ZW4gSmF2YVNjcmlwdCB0byBleHBvc2UgaGVhcCBlZGdlcyBmb3IgZGlhZ25vc2lzLiBVc2VmdWwgZm9yIGRlYnVnZ2luZyBCTGVhaydzIHByb2dyYW0gdHJhbnNmb3JtYXRpb25zLmAsXG4gIGJ1aWxkZXI6IHtcbiAgICBpbjoge1xuICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICBkZW1hbmQ6IHRydWUsXG4gICAgICBkZXNjcmliZTogYFBhdGggdG8gYSBCTGVhayBjb25maWd1cmF0aW9uIGZpbGUsIHdoaWNoIGNvbnRhaW5zIHNvdXJjZSBmaWxlcyB0byB0cmFuc2Zvcm0sIG9yIHRvIGFuIGluZGl2aWR1YWwgSmF2YVNjcmlwdCBmaWxlLmBcbiAgICB9LFxuICAgIG91dDoge1xuICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICBkZW1hbmQ6IHRydWUsXG4gICAgICBkZXNjcmliZTogYERpcmVjdG9yeSB0byBkdW1wIG91dHB1dCBmaWxlcyB0by4gV2lsbCBiZSBjcmVhdGVkIGlmIGl0IGRvZXMgbm90IGV4aXN0LmBcbiAgICB9LFxuICAgIG92ZXJ3cml0ZToge1xuICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgZGVmYXVsdDogZmFsc2UsXG4gICAgICBkZXNjcmliZTogYElmIHRydWUsIG92ZXJ3cml0ZSBmaWxlcyBpbiB0aGUgZGVzdGluYXRpb24gZGlyZWN0b3J5IHdpdGhvdXQgcHJvbXB0aW5nLmBcbiAgICB9LFxuICAgICdub3AtdHJhbnNmb3JtJzoge1xuICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgZGVmYXVsdDogZmFsc2UsXG4gICAgICBkZXNjcmliZTogYElmIHRydWUsIEJMZWFrIGRvZXMgbm90IHRyYW5zZm9ybSB0aGUgZmlsZSwgYnV0IGFwcGVuZHMgYSBzb3VyY2UgbWFwIG1hcHBpbmcgdGhlIGZpbGUgdG8gaXRzZWxmLiBVc2VkIGZvciBkZWJ1Z2dpbmcgQkxlYWsncyBzb3VyY2UgbWFwIHByb2Nlc3NpbmcuYFxuICAgIH1cbiAgfSxcbiAgaGFuZGxlcjogKGFyZ3M6IENvbW1hbmRMaW5lQXJncykgPT4ge1xuICAgIGlmICghZXhpc3RzU3luYyhhcmdzLm91dCkpIHtcbiAgICAgIG1rZGlyU3luYyhhcmdzLm91dCk7XG4gICAgfVxuXG4gICAgY29uc3QgZmxhZyA9IGFyZ3Mub3ZlcndyaXRlID8gJ3cnIDogJ3d4JztcbiAgICBjb25zdCBwcm9ncmVzc0JhciA9IG5ldyBQcm9ncmVzc1Byb2dyZXNzQmFyKGZhbHNlKTtcbiAgICBmdW5jdGlvbiB0cmFuc2Zvcm1GaWxlKGZyb206IHN0cmluZywgc3JjOiBzdHJpbmcsIHRvOiBzdHJpbmcpOiB2b2lkIHtcbiAgICAgIHByb2dyZXNzQmFyLnVwZGF0ZURlc2NyaXB0aW9uKGBUcmFuc2Zvcm1pbmcgJHtmcm9tfS4uLmApXG4gICAgICBjb25zdCB0cmFuc2Zvcm1lZCA9IGFyZ3NbJ25vcC10cmFuc2Zvcm0nXSA/IG5vcFRyYW5zZm9ybShmcm9tLCBzcmMpIDogZXhwb3NlQ2xvc3VyZVN0YXRlKGZyb20sIHNyYyk7XG4gICAgICBwcm9ncmVzc0Jhci5uZXh0T3BlcmF0aW9uKCk7XG4gICAgICBwcm9ncmVzc0Jhci51cGRhdGVEZXNjcmlwdGlvbihgV3JpdGluZyAke2Zyb219IHRvICR7dG99Li4uYClcbiAgICAgIHdyaXRlRmlsZVN5bmModG8sIEJ1ZmZlci5mcm9tKHRyYW5zZm9ybWVkLCAndXRmOCcpLCB7IGZsYWcgfSk7XG4gICAgICBwcm9ncmVzc0Jhci5uZXh0T3BlcmF0aW9uKCk7XG4gICAgfVxuXG5cbiAgICBjb25zdCBkYXRhID0gcmVhZEZpbGVTeW5jKGFyZ3MuaW4sICd1dGY4Jyk7XG4gICAgaWYgKGV4dG5hbWUoYXJncy5pbikgPT09ICcuanNvbicpIHtcbiAgICAgIGNvbnN0IHJlc3VsdHMgPSBCTGVha1Jlc3VsdHMuRnJvbUpTT04oSlNPTi5wYXJzZShkYXRhKSk7XG4gICAgICBjb25zdCB1cmxzID0gT2JqZWN0LmtleXMocmVzdWx0cy5zb3VyY2VGaWxlcyk7XG4gICAgICBwcm9ncmVzc0Jhci5zZXRPcGVyYXRpb25Db3VudCh1cmxzLmxlbmd0aCAqIDIpO1xuICAgICAgdXJscy5mb3JFYWNoKCh1cmwpID0+IHtcbiAgICAgICAgY29uc3QgdXJsT2JqID0gbmV3IFVSTCh1cmwpO1xuICAgICAgICBjb25zdCBvdXQgPSBqb2luKGFyZ3Mub3V0LCBiYXNlbmFtZSh1cmxPYmoucGF0aG5hbWUpKTtcbiAgICAgICAgaWYgKHJlc3VsdHMuc291cmNlRmlsZXNbdXJsXS5taW1lVHlwZSA9PT0gJ3RleHQvaHRtbCcpIHtcbiAgICAgICAgICBwcm9ncmVzc0Jhci5sb2coYFRvb2wgY3VycmVudGx5IGRvZXMgbm90IHN1cHBvcnQgSFRNTCBkb2N1bWVudHM7IHNraXBwaW5nICR7dXJsfS5gKTtcbiAgICAgICAgICBwcm9ncmVzc0Jhci5uZXh0T3BlcmF0aW9uKCk7XG4gICAgICAgICAgcHJvZ3Jlc3NCYXIubmV4dE9wZXJhdGlvbigpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRyYW5zZm9ybUZpbGUodXJsLCByZXN1bHRzLnNvdXJjZUZpbGVzW3VybF0uc291cmNlLCBvdXQpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcHJvZ3Jlc3NCYXIuc2V0T3BlcmF0aW9uQ291bnQoMik7XG4gICAgICBjb25zdCBzcmMgPSBkYXRhLnRvU3RyaW5nKCk7XG4gICAgICBjb25zdCBvdXQgPSBqb2luKGFyZ3Mub3V0LCBiYXNlbmFtZShhcmdzLmluKSk7XG4gICAgICB0cmFuc2Zvcm1GaWxlKGFyZ3MuaW4sIHNyYywgb3V0KTtcbiAgICB9XG4gIH1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IFRyYW5zZm9ybUphdmFTY3JpcHQ7XG4iXX0=