'use strict';

const assert = require('assert').strict;
const braces = require('..');
const utils = require('../lib/utils');

describe('iterative expansion and flattening', () => {
  const cases = [
    ['a{b,c}d', ['abd', 'acd']],
    ['{a,b}{1,2}', ['a1', 'a2', 'b1', 'b2']],
    ['a{b,{c,d}}z', ['abz', 'acz', 'adz']],
    ['{a,b,c}', ['a', 'b', 'c']]
  ];

  for (const [pattern, expected] of cases) {
    it(`preserves expansion of ${pattern}`, () => {
      assert.deepEqual(braces.expand(pattern), expected);
    });
  }

  it('flattens 15000 nested arrays without recursion', () => {
    let array = ['a'];
    for (let i = 0; i < 15000; i++) array = [array];
    assert.deepEqual(utils.flatten(array), ['a']);
  });

  it('expands a deeply nested parenthesis AST without stack exhaustion', () => {
    let node = { type: 'text', value: 'a' };
    for (let i = 0; i < 15000; i++) {
      const parent = { type: 'paren', nodes: [node] };
      node.parent = parent;
      node = parent;
    }
    const root = { type: 'root', nodes: [node] };
    node.parent = root;
    assert.deepEqual(braces.expand(root), ['a']);
  });

  it('rejects a cyclic AST', () => {
    const root = { type: 'root', nodes: [] };
    root.nodes.push(root);
    assert.throws(() => braces.expand(root), /cycle/);
  });
});
