"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const transformations_1 = require("../../lib/transformations");
const bleak_results_1 = require("../../lib/bleak_results");
const path_1 = require("path");
const progress_progress_bar_1 = require("../../lib/progress_progress_bar");
const fs_2 = require("fs");
const url_1 = require("url");
const TransformJavaScript = {
    command: 'transform-javascript',
    describe: `Transforms the given JavaScript to expose heap edges for diagnosis. Useful for debugging BLeak's program transformations.`,
    builder: {
        in: {
            type: 'string',
            demand: true,
            describe: `Path to a BLeak configuration file, which contains source files to transform, or to an individual JavaScript file.`
        },
        out: {
            type: 'string',
            demand: true,
            describe: `Directory to dump output files to. Will be created if it does not exist.`
        },
        overwrite: {
            type: 'boolean',
            default: false,
            describe: `If true, overwrite files in the destination directory without prompting.`
        },
        'nop-transform': {
            type: 'boolean',
            default: false,
            describe: `If true, BLeak does not transform the file, but appends a source map mapping the file to itself. Used for debugging BLeak's source map processing.`
        }
    },
    handler: (args) => {
        if (!fs_2.existsSync(args.out)) {
            fs_2.mkdirSync(args.out);
        }
        const flag = args.overwrite ? 'w' : 'wx';
        const progressBar = new progress_progress_bar_1.default(false);
        function transformFile(from, src, to) {
            progressBar.updateDescription(`Transforming ${from}...`);
            const transformed = args['nop-transform'] ? transformations_1.nopTransform(from, src) : transformations_1.exposeClosureState(from, src);
            progressBar.nextOperation();
            progressBar.updateDescription(`Writing ${from} to ${to}...`);
            fs_2.writeFileSync(to, Buffer.from(transformed, 'utf8'), { flag });
            progressBar.nextOperation();
        }
        const data = fs_1.readFileSync(args.in, 'utf8');
        if (path_1.extname(args.in) === '.json') {
            const results = bleak_results_1.default.FromJSON(JSON.parse(data));
            const urls = Object.keys(results.sourceFiles);
            progressBar.setOperationCount(urls.length * 2);
            urls.forEach((url) => {
                const urlObj = new url_1.URL(url);
                const out = path_1.join(args.out, path_1.basename(urlObj.pathname));
                if (results.sourceFiles[url].mimeType === 'text/html') {
                    progressBar.log(`Tool currently does not support HTML documents; skipping ${url}.`);
                    progressBar.nextOperation();
                    progressBar.nextOperation();
                }
                else {
                    transformFile(url, results.sourceFiles[url].source, out);
                }
            });
        }
        else {
            progressBar.setOperationCount(2);
            const src = data.toString();
            const out = path_1.join(args.out, path_1.basename(args.in));
            transformFile(args.in, src, out);
        }
    }
};
exports.default = TransformJavaScript;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNmb3JtX2phdmFzY3JpcHQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvY2xpL2NvbW1hbmRzL3RyYW5zZm9ybV9qYXZhc2NyaXB0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsMkJBQWdDO0FBQ2hDLCtEQUEyRTtBQUMzRSwyREFBbUQ7QUFFbkQsK0JBQTZDO0FBQzdDLDJFQUFrRTtBQUNsRSwyQkFBd0Q7QUFDeEQsNkJBQXdCO0FBU3hCLE1BQU0sbUJBQW1CLEdBQWtCO0lBQ3pDLE9BQU8sRUFBRSxzQkFBc0I7SUFDL0IsUUFBUSxFQUFFLDJIQUEySDtJQUNySSxPQUFPLEVBQUU7UUFDUCxFQUFFLEVBQUU7WUFDRixJQUFJLEVBQUUsUUFBUTtZQUNkLE1BQU0sRUFBRSxJQUFJO1lBQ1osUUFBUSxFQUFFLG9IQUFvSDtTQUMvSDtRQUNELEdBQUcsRUFBRTtZQUNILElBQUksRUFBRSxRQUFRO1lBQ2QsTUFBTSxFQUFFLElBQUk7WUFDWixRQUFRLEVBQUUsMEVBQTBFO1NBQ3JGO1FBQ0QsU0FBUyxFQUFFO1lBQ1QsSUFBSSxFQUFFLFNBQVM7WUFDZixPQUFPLEVBQUUsS0FBSztZQUNkLFFBQVEsRUFBRSwwRUFBMEU7U0FDckY7UUFDRCxlQUFlLEVBQUU7WUFDZixJQUFJLEVBQUUsU0FBUztZQUNmLE9BQU8sRUFBRSxLQUFLO1lBQ2QsUUFBUSxFQUFFLG9KQUFvSjtTQUMvSjtLQUNGO0lBQ0QsT0FBTyxFQUFFLENBQUMsSUFBcUIsRUFBRSxFQUFFO1FBQ2pDLEVBQUUsQ0FBQyxDQUFDLENBQUMsZUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDMUIsY0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN0QixDQUFDO1FBRUQsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJ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JztcbmltcG9ydCB7ZXhwb3NlQ2xvc3VyZVN0YXRlLCBub3BUcmFuc2Zvcm19IGZyb20gJy4uLy4uL2xpYi90cmFuc2Zvcm1hdGlvbnMnO1xuaW1wb3J0IEJMZWFrUmVzdWx0cyBmcm9tICcuLi8uLi9saWIvYmxlYWtfcmVzdWx0cyc7XG5pbXBvcnQge0NvbW1hbmRNb2R1bGV9IGZyb20gJ3lhcmdzJztcbmltcG9ydCB7ZXh0bmFtZSwgYmFzZW5hbWUsIGpvaW59IGZyb20gJ3BhdGgnO1xuaW1wb3J0IFByb2dyZXNzUHJvZ3Jlc3NCYXIgZnJvbSAnLi4vLi4vbGliL3Byb2dyZXNzX3Byb2dyZXNzX2Jhcic7XG5pbXBvcnQge2V4aXN0c1N5bmMsIG1rZGlyU3luYywgd3JpdGVGaWxlU3luY30gZnJvbSAnZnMnO1xuaW1wb3J0IHtVUkx9IGZyb20gJ3VybCc7XG5cbmludGVyZmFjZSBDb21tYW5kTGluZUFyZ3Mge1xuICBpbjogc3RyaW5nO1xuICBvdXQ6IHN0cmluZztcbiAgb3ZlcndyaXRlOiBib29sZWFuO1xuICAnbm9wLXRyYW5zZm9ybSc6IGJvb2xlYW47XG59XG5cbmNvbnN0IFRyYW5zZm9ybUphdmFTY3JpcHQ6IENvbW1hbmRNb2R1bGUgPSB7XG4gIGNvbW1hbmQ6ICd0cmFuc2Zvcm0tamF2YXNjcmlwdCcsXG4gIGRlc2NyaWJlOiBgVHJhbnNmb3JtcyB0aGUgZ2l2ZW4gSmF2YVNjcmlwdCB0byBleHBvc2UgaGVhcCBlZGdlcyBmb3IgZGlhZ25vc2lzLiBVc2VmdWwgZm9yIGRlYnVnZ2luZyBCTGVhaydzIHByb2dyYW0gdHJhbnNmb3JtYXRpb25zLmAsXG4gIGJ1aWxkZXI6IHtcbiAgICBpbjoge1xuICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICBkZW1hbmQ6IHRydWUsXG4gICAgICBkZXNjcmliZTogYFBhdGggdG8gYSBCTGVhayBjb25maWd1cmF0aW9uIGZpbGUsIHdoaWNoIGNvbnRhaW5zIHNvdXJjZSBmaWxlcyB0byB0cmFuc2Zvcm0sIG9yIHRvIGFuIGluZGl2aWR1YWwgSmF2YVNjcmlwdCBmaWxlLmBcbiAgICB9LFxuICAgIG91dDoge1xuICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICBkZW1hbmQ6IHRydWUsXG4gICAgICBkZXNjcmliZTogYERpcmVjdG9yeSB0byBkdW1wIG91dHB1dCBmaWxlcyB0by4gV2lsbCBiZSBjcmVhdGVkIGlmIGl0IGRvZXMgbm90IGV4aXN0LmBcbiAgICB9LFxuICAgIG92ZXJ3cml0ZToge1xuICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgZGVmYXVsdDogZmFsc2UsXG4gICAgICBkZXNjcmliZTogYElmIHRydWUsIG92ZXJ3cml0ZSBmaWxlcyBpbiB0aGUgZGVzdGluYXRpb24gZGlyZWN0b3J5IHdpdGhvdXQgcHJvbXB0aW5nLmBcbiAgICB9LFxuICAgICdub3AtdHJhbnNmb3JtJzoge1xuICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgZGVmYXVsdDogZmFsc2UsXG4gICAgICBkZXNjcmliZTogYElmIHRydWUsIEJMZWFrIGRvZXMgbm90IHRyYW5zZm9ybSB0aGUgZmlsZSwgYnV0IGFwcGVuZHMgYSBzb3VyY2UgbWFwIG1hcHBpbmcgdGhlIGZpbGUgdG8gaXRzZWxmLiBVc2VkIGZvciBkZWJ1Z2dpbmcgQkxlYWsncyBzb3VyY2UgbWFwIHByb2Nlc3NpbmcuYFxuICAgIH1cbiAgfSxcbiAgaGFuZGxlcjogKGFyZ3M6IENvbW1hbmRMaW5lQXJncykgPT4ge1xuICAgIGlmICghZXhpc3RzU3luYyhhcmdzLm91dCkpIHtcbiAgICAgIG1rZGlyU3luYyhhcmdzLm91dCk7XG4gICAgfVxuXG4gICAgY29uc3QgZmxhZyA9IGFyZ3Mub3ZlcndyaXRlID8gJ3cnIDogJ3d4JztcbiAgICBjb25zdCBwcm9ncmVzc0JhciA9IG5ldyBQcm9ncmVzc1Byb2dyZXNzQmFyKGZhbHNlKTtcbiAgICBmdW5jdGlvbiB0cmFuc2Zvcm1GaWxlKGZyb206IHN0cmluZywgc3JjOiBzdHJpbmcsIHRvOiBzdHJpbmcpOiB2b2lkIHtcbiAgICAgIHByb2dyZXNzQmFyLnVwZGF0ZURlc2NyaXB0aW9uKGBUcmFuc2Zvcm1pbmcgJHtmcm9tfS4uLmApXG4gICAgICBjb25zdCB0cmFuc2Zvcm1lZCA9IGFyZ3NbJ25vcC10cmFuc2Zvcm0nXSA/IG5vcFRyYW5zZm9ybShmcm9tLCBzcmMpIDogZXhwb3NlQ2xvc3VyZVN0YXRlKGZyb20sIHNyYyk7XG4gICAgICBwcm9ncmVzc0Jhci5uZXh0T3BlcmF0aW9uKCk7XG4gICAgICBwcm9ncmVzc0Jhci51cGRhdGVEZXNjcmlwdGlvbihgV3JpdGluZyAke2Zyb219IHRvICR7dG99Li4uYClcbiAgICAgIHdyaXRlRmlsZVN5bmModG8sIEJ1ZmZlci5mcm9tKHRyYW5zZm9ybWVkLCAndXRmOCcpLCB7IGZsYWcgfSk7XG4gICAgICBwcm9ncmVzc0Jhci5uZXh0T3BlcmF0aW9uKCk7XG4gICAgfVxuXG5cbiAgICBjb25zdCBkYXRhID0gcmVhZEZpbGVTeW5jKGFyZ3MuaW4sICd1dGY4Jyk7XG4gICAgaWYgKGV4dG5hbWUoYXJncy5pbikgPT09ICcuanNvbicpIHtcbiAgICAgIGNvbnN0IHJlc3VsdHMgPSBCTGVha1Jlc3VsdHMuRnJvbUpTT04oSlNPTi5wYXJzZShkYXRhKSk7XG4gICAgICBjb25zdCB1cmxzID0gT2JqZWN0LmtleXMocmVzdWx0cy5zb3VyY2VGaWxlcyk7XG4gICAgICBwcm9ncmVzc0Jhci5zZXRPcGVyYXRpb25Db3VudCh1cmxzLmxlbmd0aCAqIDIpO1xuICAgICAgdXJscy5mb3JFYWNoKCh1cmwpID0+IHtcbiAgICAgICAgY29uc3QgdXJsT2JqID0gbmV3IFVSTCh1cmwpO1xuICAgICAgICBjb25zdCBvdXQgPSBqb2luKGFyZ3Mub3V0LCBiYXNlbmFtZSh1cmxPYmoucGF0aG5hbWUpKTtcbiAgICAgICAgaWYgKHJlc3VsdHMuc291cmNlRmlsZXNbdXJsXS5taW1lVHlwZSA9PT0gJ3RleHQvaHRtbCcpIHtcbiAgICAgICAgICBwcm9ncmVzc0Jhci5sb2coYFRvb2wgY3VycmVudGx5IGRvZXMgbm90IHN1cHBvcnQgSFRNTCBkb2N1bWVudHM7IHNraXBwaW5nICR7dXJsfS5gKTtcbiAgICAgICAgICBwcm9ncmVzc0Jhci5uZXh0T3BlcmF0aW9uKCk7XG4gICAgICAgICAgcHJvZ3Jlc3NCYXIubmV4dE9wZXJhdGlvbigpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRyYW5zZm9ybUZpbGUodXJsLCByZXN1bHRzLnNvdXJjZUZpbGVzW3VybF0uc291cmNlLCBvdXQpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcHJvZ3Jlc3NCYXIuc2V0T3BlcmF0aW9uQ291bnQoMik7XG4gICAgICBjb25zdCBzcmMgPSBkYXRhLnRvU3RyaW5nKCk7XG4gICAgICBjb25zdCBvdXQgPSBqb2luKGFyZ3Mub3V0LCBiYXNlbmFtZShhcmdzLmluKSk7XG4gICAgICB0cmFuc2Zvcm1GaWxlKGFyZ3MuaW4sIHNyYywgb3V0KTtcbiAgICB9XG4gIH1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IFRyYW5zZm9ybUphdmFTY3JpcHQ7XG4iXX0=