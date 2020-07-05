"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DEFAULT_CONFIG = {
    iterations: 8,
    rankingEvaluationIterations: 10,
    rankingEvaluationRuns: 5,
    url: "http://localhost:8080/",
    fixedLeaks: [],
    fixMap: {},
    login: [],
    setup: [],
    loop: [],
    postCheckSleep: 1000,
    postNextSleep: 0,
    postLoginSleep: 5000,
    timeout: 10 * 60 * 1000,
    rewrite: (url, type, data, fixes) => data
};
const DEFAULT_CONFIG_STRING = JSON.stringify(DEFAULT_CONFIG);
function getConfigFromSource(configSource) {
    const m = { exports: {} };
    // CommonJS emulation
    try {
        const exportsObj = new Function('exports', 'module', `${configSource}\nreturn module.exports ? module.exports : exports;`)(m.exports, m);
        return Object.assign({}, DEFAULT_CONFIG, exportsObj);
    }
    catch (e) {
        throw new Error(`Unable to run configuration file: ${e}`);
    }
}
function checkFunction(prop, data) {
    if (typeof (data) !== 'function') {
        throw new Error(`config.${prop} is not a function!`);
    }
}
function checkStep(type, i, data) {
    checkFunction(`${type}[${i}].check`, data.check);
    checkFunction(`${type}[${i}].next`, data.next);
}
function checkNumber(prop, data) {
    if (typeof (data) !== 'number') {
        throw new Error(`config.${prop} is not a number!`);
    }
}
function checkString(prop, data) {
    if (typeof (data) !== 'string') {
        throw new Error(`config.${prop} is not a string!`);
    }
}
class BLeakConfig {
    constructor(raw, _configSource) {
        this._configSource = _configSource;
        this.url = raw.url;
        this.loop = raw.loop;
        this.iterations = raw.iterations;
        this.rankingEvaluationIterations = raw.rankingEvaluationIterations;
        this.rankingEvaluationRuns = raw.rankingEvaluationRuns;
        this.fixedLeaks = raw.fixedLeaks;
        this.fixMap = raw.fixMap;
        this.login = raw.login;
        this.setup = raw.setup;
        this.timeout = raw.timeout;
        this.rewrite = raw.rewrite;
        this.postCheckSleep = raw.postCheckSleep;
        this.postNextSleep = raw.postNextSleep;
        this.postLoginSleep = raw.postLoginSleep;
    }
    static FromSource(configSource) {
        const raw = getConfigFromSource(configSource);
        // Sanity check types.
        checkString('url', raw.url);
        raw.loop.forEach((s, i) => checkStep('loop', i, s));
        checkNumber('iterations', raw.iterations);
        checkNumber('rankingEvaluationIterations', raw.rankingEvaluationIterations);
        checkNumber('rankingEvaluationRuns', raw.rankingEvaluationRuns);
        raw.fixedLeaks.forEach((n, i) => checkNumber(`fixedLeaks[${i}]`, n));
        raw.login.forEach((s, i) => checkStep('login', i, s));
        raw.setup.forEach((s, i) => checkStep('setup', i, s));
        checkNumber('timeout', raw.timeout);
        checkFunction('rewrite', raw.rewrite);
        checkNumber('postCheckSleep', raw.postCheckSleep);
        checkNumber('postNextSleep', raw.postNextSleep);
        checkNumber('postLoginSleep', raw.postLoginSleep);
        return new BLeakConfig(raw, configSource);
    }
    getBrowserInjection() {
        // CommonJS emulation
        return `(function() {
  var module = { exports: {} };
  var exports = module.exports;
  ${this._configSource}
  window.BLeakConfig = Object.assign({}, ${DEFAULT_CONFIG_STRING}, module.exports ? module.exports : exports);
})();`;
    }
}
exports.default = BLeakConfig;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmxlYWtfY29uZmlnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2xpYi9ibGVha19jb25maWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFFQSxNQUFNLGNBQWMsR0FBaUI7SUFDbkMsVUFBVSxFQUFFLENBQUM7SUFDYiwyQkFBMkIsRUFBRSxFQUFFO0lBQy9CLHFCQUFxQixFQUFFLENBQUM7SUFDeEIsR0FBRyxFQUFFLHdCQUF3QjtJQUM3QixVQUFVLEVBQUUsRUFBRTtJQUNkLE1BQU0sRUFBRSxFQUFFO0lBQ1YsS0FBSyxFQUFFLEVBQUU7SUFDVCxLQUFLLEVBQUUsRUFBRTtJQUNULElBQUksRUFBRSxFQUFFO0lBQ1IsY0FBYyxFQUFFLElBQUk7SUFDcEIsYUFBYSxFQUFFLENBQUM7SUFDaEIsY0FBYyxFQUFFLElBQUk7SUFDcEIsT0FBTyxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsSUFBSTtJQUN2QixPQUFPLEVBQUUsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsRUFBRSxDQUFDLElBQUk7Q0FDMUMsQ0FBQztBQUNGLE1BQU0scUJBQXFCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUU3RCw2QkFBNkIsWUFBb0I7SUFDL0MsTUFBTSxDQUFDLEdBQUcsRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFLENBQUM7SUFDMUIscUJBQXFCO0lBQ3JCLElBQUksQ0FBQztRQUNILE1BQU0sVUFBVSxHQUFHLElBQUksUUFBUSxDQUFDLFNBQVMsRUFBRSxRQUFRLEVBQUUsR0FBRyxZQUFZLHFEQUFxRCxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN6SSxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsY0FBYyxFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBQ3ZELENBQUM7SUFBQyxLQUFLLENBQUMs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cUJBQXFCO01BQzFELENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUE3REQsOEJBNkRDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtJQkxlYWtDb25maWcsIFN0ZXBUeXBlLCBTdGVwfSBmcm9tICcuLi9jb21tb24vaW50ZXJmYWNlcyc7XG5cbmNvbnN0IERFRkFVTFRfQ09ORklHOiBJQkxlYWtDb25maWcgPSB7XG4gIGl0ZXJhdGlvbnM6IDgsXG4gIHJhbmtpbmdFdmFsdWF0aW9uSXRlcmF0aW9uczogMTAsXG4gIHJhbmtpbmdFdmFsdWF0aW9uUnVuczogNSxcbiAgdXJsOiBcImh0dHA6Ly9sb2NhbGhvc3Q6ODA4MC9cIixcbiAgZml4ZWRMZWFrczogW10sXG4gIGZpeE1hcDoge30sXG4gIGxvZ2luOiBbXSxcbiAgc2V0dXA6IFtdLFxuICBsb29wOiBbXSxcbiAgcG9zdENoZWNrU2xlZXA6IDEwMDAsXG4gIHBvc3ROZXh0U2xlZXA6IDAsXG4gIHBvc3RMb2dpblNsZWVwOiA1MDAwLFxuICB0aW1lb3V0OiAxMCAqIDYwICogMTAwMCwgLy8gMTAgbWludXRlc1xuICByZXdyaXRlOiAodXJsLCB0eXBlLCBkYXRhLCBmaXhlcykgPT4gZGF0YVxufTtcbmNvbnN0IERFRkFVTFRfQ09ORklHX1NUUklORyA9IEpTT04uc3RyaW5naWZ5KERFRkFVTFRfQ09ORklHKTtcblxuZnVuY3Rpb24gZ2V0Q29uZmlnRnJvbVNvdXJjZShjb25maWdTb3VyY2U6IHN0cmluZyk6IElCTGVha0NvbmZpZyB7XG4gIGNvbnN0IG0gPSB7IGV4cG9ydHM6IHt9IH07XG4gIC8vIENvbW1vbkpTIGVtdWxhdGlvblxuICB0cnkge1xuICAgIGNvbnN0IGV4cG9ydHNPYmogPSBuZXcgRnVuY3Rpb24oJ2V4cG9ydHMnLCAnbW9kdWxlJywgYCR7Y29uZmlnU291cmNlfVxcbnJldHVybiBtb2R1bGUuZXhwb3J0cyA/IG1vZHVsZS5leHBvcnRzIDogZXhwb3J0cztgKShtLmV4cG9ydHMsIG0pO1xuICAgIHJldHVybiBPYmplY3QuYXNzaWduKHt9LCBERUZBVUxUX0NPTkZJRywgZXhwb3J0c09iaik7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYFVuYWJsZSB0byBydW4gY29uZmlndXJhdGlvbiBmaWxlOiAke2V9YCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gY2hlY2tGdW5jdGlvbihwcm9wOiBzdHJpbmcsIGRhdGE6IEZ1bmN0aW9uKTogdm9pZCB7XG4gIGlmICh0eXBlb2YoZGF0YSkgIT09ICdmdW5jdGlvbicpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYGNvbmZpZy4ke3Byb3B9IGlzIG5vdCBhIGZ1bmN0aW9uIWApO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNoZWNrU3RlcCh0eXBlOiBTdGVwVHlwZSwgaTogbnVtYmVyLCBkYXRhOiBTdGVwKTogdm9pZCB7XG4gIGNoZWNrRnVuY3Rpb24oYCR7dHlwZX1bJHtpfV0uY2hlY2tgLCBkYXRhLmNoZWNrKTtcbiAgY2hlY2tGdW5jdGlvbihgJHt0eXBlfVske2l9XS5uZXh0YCwgZGF0YS5uZXh0KTtcbn1cblxuZnVuY3Rpb24gY2hlY2tOdW1iZXIocHJvcDogc3RyaW5nLCBkYXRhOiBudW1iZXIpOiB2b2lkIHtcbiAgaWYgKHR5cGVvZihkYXRhKSAhPT0gJ251bWJlcicpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYGNvbmZpZy4ke3Byb3B9IGlzIG5vdCBhIG51bWJlciFgKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBjaGVja1N0cmluZyhwcm9wOiBzdHJpbmcsIGRhdGE6IHN0cmluZyk6IHZvaWQge1xuICBpZiAodHlwZW9mKGRhdGEpICE9PSAnc3RyaW5nJykge1xuICAgIHRocm93IG5ldyBFcnJvcihgY29uZmlnLiR7cHJvcH0gaXMgbm90IGEgc3RyaW5nIWApO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEJMZWFrQ29uZmlnIGltcGxlbWVudHMgSUJMZWFrQ29uZmlnIHtcbiAgcHVibGljIHN0YXRpYyBGcm9tU291cmNlKGNvbmZpZ1NvdXJjZTogc3RyaW5nKTogQkxlYWtDb25maWcge1xuICAgIGNvbnN0IHJhdyA9IGdldENvbmZpZ0Zyb21Tb3VyY2UoY29uZmlnU291cmNlKTtcbiAgICAvLyBTYW5pdHkgY2hlY2sgdHlwZXMuXG4gICAgY2hlY2tTdHJpbmcoJ3VybCcsIHJhdy51cmwpO1xuICAgIHJhdy5sb29wLmZvckVhY2goKHMsIGkpID0+IGNoZWNrU3RlcCgnbG9vcCcsIGksIHMpKTtcbiAgICBjaGVja051bWJlcignaXRlcmF0aW9ucycsIHJhdy5pdGVyYXRpb25zKTtcbiAgICBjaGVja051bWJlcigncmFua2luZ0V2YWx1YXRpb25JdGVyYXRpb25zJywgcmF3LnJhbmtpbmdFdmFsdWF0aW9uSXRlcmF0aW9ucyk7XG4gICAgY2hlY2tOdW1iZXIoJ3JhbmtpbmdFdmFsdWF0aW9uUnVucycsIHJhdy5yYW5raW5nRXZhbHVhdGlvblJ1bnMpO1xuICAgIHJhdy5maXhlZExlYWtzLmZvckVhY2goKG4sIGkpID0+IGNoZWNrTnVtYmVyKGBmaXhlZExlYWtzWyR7aX1dYCwgbikpO1xuICAgIHJhdy5sb2dpbi5mb3JFYWNoKChzLCBpKSA9PiBjaGVja1N0ZXAoJ2xvZ2luJywgaSwgcykpO1xuICAgIHJhdy5zZXR1cC5mb3JFYWNoKChzLCBpKSA9PiBjaGVja1N0ZXAoJ3NldHVwJywgaSwgcykpO1xuICAgIGNoZWNrTnVtYmVyKCd0aW1lb3V0JywgcmF3LnRpbWVvdXQpO1xuICAgIGNoZWNrRnVuY3Rpb24oJ3Jld3JpdGUnLCByYXcucmV3cml0ZSk7XG4gICAgY2hlY2tOdW1iZXIoJ3Bvc3RDaGVja1NsZWVwJywgcmF3LnBvc3RDaGVja1NsZWVwKTtcbiAgICBjaGVja051bWJlcigncG9zdE5leHRTbGVlcCcsIHJhdy5wb3N0TmV4dFNsZWVwKTtcbiAgICBjaGVja051bWJlcigncG9zdExvZ2luU2xlZXAnLCByYXcucG9zdExvZ2luU2xlZXApO1xuICAgIHJldHVybiBuZXcgQkxlYWtDb25maWcocmF3LCBjb25maWdTb3VyY2UpO1xuICB9XG5cbiAgcHVibGljIHJlYWRvbmx5IHVybDogc3RyaW5nO1xuICBwdWJsaWMgcmVhZG9ubHkgbG9vcDogU3RlcFtdO1xuICBwdWJsaWMgcmVhZG9ubHkgaXRlcmF0aW9uczogbnVtYmVyO1xuICBwdWJsaWMgcmVhZG9ubHkgcmFua2luZ0V2YWx1YXRpb25JdGVyYXRpb25zOiBudW1iZXI7XG4gIHB1YmxpYyByZWFkb25seSByYW5raW5nRXZhbHVhdGlvblJ1bnM6IG51bWJlcjtcbiAgcHVibGljIHJlYWRvbmx5IGZpeGVkTGVha3M6IG51bWJlcltdO1xuICBwdWJsaWMgcmVhZG9ubHkgZml4TWFwOiB7W2xlYWtSb290OiBzdHJpbmddOiBudW1iZXJ9O1xuICBwdWJsaWMgcmVhZG9ubHkgbG9naW46IFN0ZXBbXTtcbiAgcHVibGljIHJlYWRvbmx5IHNldHVwOiBTdGVwW107XG4gIHB1YmxpYyByZWFkb25seSB0aW1lb3V0OiBudW1iZXI7XG4gIHB1YmxpYyByZWFkb25seSBwb3N0Q2hlY2tTbGVlcDogbnVtYmVyO1xuICBwdWJsaWMgcmVhZG9ubHkgcG9zdE5leHRTbGVlcDogbnVtYmVyO1xuICBwdWJsaWMgcmVhZG9ubHkgcG9zdExvZ2luU2xlZXA6IG51bWJlcjtcbiAgcHVibGljIHJlYWRvbmx5IHJld3JpdGU6ICh1cmw6IHN0cmluZywgdHlwZTogc3RyaW5nLCBzb3VyY2U6IEJ1ZmZlciwgZml4ZXM6IG51bWJlcltdKSA9PiBCdWZmZXI7XG5cbiAgcHJpdmF0ZSBjb25zdHJ1Y3RvcihyYXc6IElCTGVha0NvbmZpZywgcHJpdmF0ZSByZWFkb25seSBfY29uZmlnU291cmNlOiBzdHJpbmcpIHtcbiAgICB0aGlzLnVybCA9IHJhdy51cmw7XG4gICAgdGhpcy5sb29wID0gcmF3Lmxvb3A7XG4gICAgdGhpcy5pdGVyYXRpb25zID0gcmF3Lml0ZXJhdGlvbnM7XG4gICAgdGhpcy5yYW5raW5nRXZhbHVhdGlvbkl0ZXJhdGlvbnMgPSByYXcucmFua2luZ0V2YWx1YXRpb25JdGVyYXRpb25zO1xuICAgIHRoaXMucmFua2luZ0V2YWx1YXRpb25SdW5zID0gcmF3LnJhbmtpbmdFdmFsdWF0aW9uUnVucztcbiAgICB0aGlzLmZpeGVkTGVha3MgPSByYXcuZml4ZWRMZWFrcztcbiAgICB0aGlzLmZpeE1hcCA9IHJhdy5maXhNYXA7XG4gICAgdGhpcy5sb2dpbiA9IHJhdy5sb2dpbjtcbiAgICB0aGlzLnNldHVwID0gcmF3LnNldHVwO1xuICAgIHRoaXMudGltZW91dCA9IHJhdy50aW1lb3V0O1xuICAgIHRoaXMucmV3cml0ZSA9IHJhdy5yZXdyaXRlO1xuICAgIHRoaXMucG9zdENoZWNrU2xlZXAgPSByYXcucG9zdENoZWNrU2xlZXA7XG4gICAgdGhpcy5wb3N0TmV4dFNsZWVwID0gcmF3LnBvc3ROZXh0U2xlZXA7XG4gICAgdGhpcy5wb3N0TG9naW5TbGVlcCA9IHJhdy5wb3N0TG9naW5TbGVlcDtcbiAgfVxuXG4gIHB1YmxpYyBnZXRCcm93c2VySW5qZWN0aW9uKCk6IHN0cmluZyB7XG4gICAgLy8gQ29tbW9uSlMgZW11bGF0aW9uXG4gICAgcmV0dXJuIGAoZnVuY3Rpb24oKSB7XG4gIHZhciBtb2R1bGUgPSB7IGV4cG9ydHM6IHt9IH07XG4gIHZhciBleHBvcnRzID0gbW9kdWxlLmV4cG9ydHM7XG4gICR7dGhpcy5fY29uZmlnU291cmNlfVxuICB3aW5kb3cuQkxlYWtDb25maWcgPSBPYmplY3QuYXNzaWduKHt9LCAke0RFRkFVTFRfQ09ORklHX1NUUklOR30sIG1vZHVsZS5leHBvcnRzID8gbW9kdWxlLmV4cG9ydHMgOiBleHBvcnRzKTtcbn0pKCk7YDtcbiAgfVxufVxuIl19