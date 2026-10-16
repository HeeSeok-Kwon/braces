'use strict';
const assert = require('assert').strict;
const path = require('path');
if (!process.env.BRACES_BASELINE_PATH) {
  console.log('Skipping differential comparison (BRACES_BASELINE_PATH not set)');
} else {
const baseline = require(path.resolve(process.env.BRACES_BASELINE_PATH));
const candidate = require('..');
const samples = ['','abc','{a,b}','a{b,c}d','{a,b}{1,2}','{1..3}','{3..1}','{01..05}','{1..9..2}','{a..e}','a{b,{c,d}}z','{{a,b},c}','{a,,b}','{}','{a}','{a,b,}','foo/({a,b})','[{a,b}]','{1..3}{a,b}','{{x}y}'];
for (const a of ['a','b','1']) for (const b of ['c','d','2']) {
  samples.push(a+'{'+b+',z}', '{'+a+','+b+'}/file');
}
const optionsList = [{},{expand:true},{escapeInvalid:true},{keepEscaping:true},{expand:true,nodupes:true},{expand:true,noempty:true}];
const call = (fn, lib) => {
  try { return {ok:true,value:fn(lib)}; }
  catch (e) { return {ok:false,name:e.name}; }
};
let count = 0;
for (const pattern of samples) for (const opts of optionsList) {
  const cases = [
    ['main', lib => lib(pattern,opts)],
    ['compile', lib => lib.compile(pattern,opts)],
    ['expand', lib => lib.expand(pattern,opts)],
    ['stringify', lib => lib.stringify(pattern,opts)]
  ];
  for (const [name, fn] of cases) {
    assert.deepStrictEqual(call(fn,candidate),call(fn,baseline),
      'Mismatch: '+name+' '+JSON.stringify(pattern)+' '+JSON.stringify(opts));
    count++;
  }
}
console.log('Compared '+count+' cases with braces@3.0.3');

}
