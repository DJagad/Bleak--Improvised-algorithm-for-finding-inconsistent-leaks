"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_server_1 = require("./util/http_server");
const chrome_driver_1 = require("../src/lib/chrome_driver");
const assert_1 = require("assert");
const HTTP_PORT = 8890;
describe("Chrome Driver", function () {
    // 30 second timeout.
    this.timeout(30000);
    let httpServer;
    let chromeDriver;
    before(async function () {
        httpServer = await http_server_1.default({
            "/": {
                mimeType: "text/html",
                data: Buffer.from("<!doctype html><html><div id='container'>ContainerText</div></html>", "utf8")
            }
        }, HTTP_PORT);
        // Silence debug messages.
        console.debug = () => { };
        chromeDriver = await chrome_driver_1.default.Launch(console, true, 1920, 1080);
    });
    it("Successfully loads a webpage", async function () {
        await chromeDriver.navigateTo(`http://localhost:${HTTP_PORT}/`);
        const str = await chromeDriver.runCode("document.getElementById('container').innerText");
        assert_1.equal(str, "ContainerText");
    });
    after(async function () {
        await Promise.all([chromeDriver.shutdown(), httpServer.close]);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2ViZHJpdmVyX3Rlc3RzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vdGVzdC93ZWJkcml2ZXJfdGVzdHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxvREFBa0Q7QUFFbEQsNERBQW9EO0FBQ3BELG1DQUE0QztBQUU1QyxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUM7QUFFdkIsUUFBUSxDQUFDLGVBQWUsRUFBRTtJQUN4QixxQkFBcUI7SUFDckIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNwQixJQUFJLFVBQXNCLENBQUM7SUFDM0IsSUFBSSxZQUEwQixDQUFDO0lBQy9CLE1BQU0sQ0FBQyxLQUFLO1FBQ1YsVUFBVSxHQUFHLE1BQU0scUJBQWdCLENBQUM7WUFDbEMsR0FBRyxFQUFFO2dCQUNILFFBQVEsRUFBRSxXQUFXO2dCQUNyQixJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxxRUFBcUUsRUFBRSxNQUFNLENBQUM7YUFDakc7U0FDRixFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ2QsMEJBQTBCO1FBQzFCLE9BQU8sQ0FBQyxLQUFLLEdBQUcsR0FBRyxFQUFFLEdBQUUsQ0FBQyxDQUFDO1FBQ3pCLFlBQVksR0FBRyxNQUFNLHVCQUFZLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3RFLENBQUMsQ0FBQyxDQUFDO0lBRUgsRUFBRSxDQUFDLDhCQUE4QixFQUFFLEtBQUs7UUFDdEMsTUFBTSxZQUFZLENBQUMsVUFBVSxDQUFDLG9CQUFvQixTQUFTLEdBQUcsQ0FBQyxDQUFDO1FBQ2hFLE1BQU0sR0FBRyxHQUFHLE1BQU0sWUFBWSxDQUFDLE9BQU8sQ0FBQyxnREFBZ0QsQ0FBQyxDQUFDO1FBQ3pGLGNBQVcsQ0FBQyxHQUFHLEVBQUUsZUFBZSxDQUFDLENBQUM7SUFDcEMsQ0FBQyxDQUFDLENBQUM7SUFFSCxLQUFLLENBQUMsS0FBSztRQUNULE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsRUFBRSxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztJQUNqRSxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGNyZWF0ZUhUVFBTZXJ2ZXIgZnJvbSAnLi91dGlsL2h0dHBfc2VydmVyJztcbmltcG9ydCB7U2VydmVyIGFzIEhUVFBTZXJ2ZXJ9IGZyb20gJ2h0dHAnO1xuaW1wb3J0IENocm9tZURyaXZlciBmcm9tICcuLi9zcmMvbGliL2Nocm9tZV9kcml2ZXInO1xuaW1wb3J0IHtlcXVhbCBhcyBhc3NlcnRFcXVhbH0gZnJvbSAnYXNzZXJ0JztcblxuY29uc3QgSFRUUF9QT1JUID0gODg5MDtcblxuZGVzY3JpYmUoXCJDaHJvbWUgRHJpdmVyXCIsIGZ1bmN0aW9uKCkge1xuICAvLyAzMCBzZWNvbmQgdGltZW91dC5cbiAgdGhpcy50aW1lb3V0KDMwMDAwKTtcbiAgbGV0IGh0dHBTZXJ2ZXI6IEhUVFBTZXJ2ZXI7XG4gIGxldCBjaHJvbWVEcml2ZXI6IENocm9tZURyaXZlcjtcbiAgYmVmb3JlKGFzeW5jIGZ1bmN0aW9uKCkge1xuICAgIGh0dHBTZXJ2ZXIgPSBhd2FpdCBjcmVhdGVIVFRQU2VydmVyKHtcbiAgICAgIFwiL1wiOiB7XG4gICAgICAgIG1pbWVUeXBlOiBcInRleHQvaHRtbFwiLFxuICAgICAgICBkYXRhOiBCdWZmZXIuZnJvbShcIjwhZG9jdHlwZSBodG1sPjxodG1sPjxkaXYgaWQ9J2NvbnRhaW5lcic+Q29udGFpbmVyVGV4dDwvZGl2PjwvaHRtbD5cIiwgXCJ1dGY4XCIpXG4gICAgICB9XG4gICAgfSwgSFRUUF9QT1JUKTtcbiAgICAvLyBTaWxlbmNlIGRlYnVnIG1lc3NhZ2VzLlxuICAgIGNvbnNvbGUuZGVidWcgPSAoKSA9PiB7fTtcbiAgICBjaHJvbWVEcml2ZXIgPSBhd2FpdCBDaHJvbWVEcml2ZXIuTGF1bmNoKGNvbnNvbGUsIHRydWUsIDE5MjAsIDEwODApO1xuICB9KTtcblxuICBpdChcIlN1Y2Nlc3NmdWxseSBsb2FkcyBhIHdlYnBhZ2VcIiwgYXN5bmMgZnVuY3Rpb24oKSB7XG4gICAgYXdhaXQgY2hyb21lRHJpdmVyLm5hdmlnYXRlVG8oYGh0dHA6Ly9sb2NhbGhvc3Q6JHtIVFRQX1BPUlR9L2ApO1xuICAgIGNvbnN0IHN0ciA9IGF3YWl0IGNocm9tZURyaXZlci5ydW5Db2RlKFwiZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NvbnRhaW5lcicpLmlubmVyVGV4dFwiKTtcbiAgICBhc3NlcnRFcXVhbChzdHIsIFwiQ29udGFpbmVyVGV4dFwiKTtcbiAgfSk7XG5cbiAgYWZ0ZXIoYXN5bmMgZnVuY3Rpb24oKSB7XG4gICAgYXdhaXQgUHJvbWlzZS5hbGwoW2Nocm9tZURyaXZlci5zaHV0ZG93bigpLCBodHRwU2VydmVyLmNsb3NlXSk7XG4gIH0pO1xufSk7Il19