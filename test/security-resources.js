'use strict';
// Bounded resource regression checks. Each scenario is executed in a child
// process so a crash or unexpected hang cannot block the entire CI job.
const assert = require('assert').strict;
const path = require('path');
const cp = require('child_process');
const target = path.resolve(__dirname, '..');
const payload = [
  "const braces = require(process.argv[1]);",
  "const mode = process.argv[2];",
  "const depth = Number(process.argv[3]);",
  "const start = Date.now();",
  "let result;",
  "if (mode === 'input') {",
  "  const pattern = '('.repeat(depth) + 'a' + ')'.repeat(depth);",
  "  result = braces.compile(pattern);",
  "} else if (mode === 'ast') {",
  "  let node = { type: 'text', value: 'a' };",
  "  for (let i = 0; i < depth; i++) {",
  "    const parent = { type: 'paren', nodes: [node] };",
  "    node.parent = parent;",
  "    node = parent;",
  "  }",
  "  const root = { type: 'root', nodes: [node] };",
  "  node.parent = root;",
  "  result = braces.expand(root);",
  "} else if (mode === 'bounded') {",
  "  result = braces.expand('{a,b}'.repeat(depth));",
  "} else { throw new Error('Unsupported scenario'); }",
  "const ok = mode === 'bounded'",
  "  ? Array.isArray(result) && result.length === Math.pow(2, depth)",
  "  : (mode === 'ast' ? Array.isArray(result) && result.length === 1 && result[0] === 'a' : result === 'a');",
  "if (!ok) throw new Error('Unexpected output');",
  "process.stdout.write(JSON.stringify({elapsedMs: Date.now() - start, rssBytes: process.memoryUsage().rss}));"
].join('\n');
const cases=[['input',3000],['input',9000],['ast',3000],['ast',9000],['bounded',9]];
for(const [mode,depth] of cases){
 const child=cp.spawnSync(process.execPath,['-e',payload,target,mode,String(depth)],{
   timeout:15000,encoding:'utf8',maxBuffer:1024*1024
 });
 assert.ifError(child.error);
 assert.strictEqual(child.status,0,mode+'('+depth+') failed: '+child.stderr);
 const result=JSON.parse(child.stdout);
 console.log(mode+'('+depth+'): '+result.elapsedMs+'ms, RSS '+Math.round(result.rssBytes/1048576)+'MiB');
 assert(result.elapsedMs<12000,'Scenario exceeded processing-time budget');
 assert(result.rssBytes < 256 * 1048576,'Scenario exceeded RSS budget');
}
console.log('Bounded security/resource regressions passed');
