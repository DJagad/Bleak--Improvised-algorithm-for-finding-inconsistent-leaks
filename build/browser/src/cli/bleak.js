#!/usr/bin/env node
import * as yargs from 'yargs';
import RunCommand from './commands/run';
import FindGrowingPaths from './commands/find_growing_paths';
import ProxySession from './commands/proxy_session';
import TransformJavaScript from './commands/transform_javascript';
import Viewer from './commands/viewer';
import EvaluateMetrics from './commands/evaluate-metrics';
yargs.command(RunCommand)
    .command(FindGrowingPaths)
    .command(ProxySession)
    .command(TransformJavaScript)
    .command(Viewer)
    .command(EvaluateMetrics)
    .demandCommand(1)
    .help('help').argv;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmxlYWsuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvY2xpL2JsZWFrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFDQSxPQUFPLEtBQUssS0FBSyxNQUFNLE9BQU8sQ0FBQztBQUMvQixPQUFPLFVBQVUsTUFBTSxnQkFBZ0IsQ0FBQztBQUN4QyxPQUFPLGdCQUFnQixNQUFNLCtCQUErQixDQUFDO0FBQzdELE9BQU8sWUFBWSxNQUFNLDBCQUEwQixDQUFDO0FBQ3BELE9BQU8sbUJBQW1CLE1BQU0saUNBQWlDLENBQUM7QUFDbEUsT0FBTyxNQUFNLE1BQU0sbUJBQW1CLENBQUM7QUFDdkMsT0FBTyxlQUFlLE1BQU0sNkJBQTZCLENBQUM7QUFFMUQsS0FBSyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUM7S0FDbkIsT0FBTyxDQUFDLGdCQUFnQixDQUFDO0tBQ3pCLE9BQU8sQ0FBQyxZQUFZLENBQUM7S0FDckIsT0FBTyxDQUFDLG1CQUFtQixDQUFDO0tBQzVCLE9BQU8sQ0FBQyxNQUFNLENBQUM7S0FDZixPQUFPLENBQUMsZUFBZSxDQUFDO0tBQ3hCLGFBQWEsQ0FBQyxDQUFDLENBQUM7S0FDaEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIiMhL3Vzci9iaW4vZW52IG5vZGVcbmltcG9ydCAqIGFzIHlhcmdzIGZyb20gJ3lhcmdzJztcbmltcG9ydCBSdW5Db21tYW5kIGZyb20gJy4vY29tbWFuZHMvcnVuJztcbmltcG9ydCBGaW5kR3Jvd2luZ1BhdGhzIGZyb20gJy4vY29tbWFuZHMvZmluZF9ncm93aW5nX3BhdGhzJztcbmltcG9ydCBQcm94eVNlc3Npb24gZnJvbSAnLi9jb21tYW5kcy9wcm94eV9zZXNzaW9uJztcbmltcG9ydCBUcmFuc2Zvcm1KYXZhU2NyaXB0IGZyb20gJy4vY29tbWFuZHMvdHJhbnNmb3JtX2phdmFzY3JpcHQnO1xuaW1wb3J0IFZpZXdlciBmcm9tICcuL2NvbW1hbmRzL3ZpZXdlcic7XG5pbXBvcnQgRXZhbHVhdGVNZXRyaWNzIGZyb20gJy4vY29tbWFuZHMvZXZhbHVhdGUtbWV0cmljcyc7XG5cbnlhcmdzLmNvbW1hbmQoUnVuQ29tbWFuZClcbiAgICAgLmNvbW1hbmQoRmluZEdyb3dpbmdQYXRocylcbiAgICAgLmNvbW1hbmQoUHJveHlTZXNzaW9uKVxuICAgICAuY29tbWFuZChUcmFuc2Zvcm1KYXZhU2NyaXB0KVxuICAgICAuY29tbWFuZChWaWV3ZXIpXG4gICAgIC5jb21tYW5kKEV2YWx1YXRlTWV0cmljcylcbiAgICAgLmRlbWFuZENvbW1hbmQoMSlcbiAgICAgLmhlbHAoJ2hlbHAnKS5hcmd2O1xuIl19