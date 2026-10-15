'use strict';

const assert = require('assert').strict;
const braces = require('..');

describe('iterative AST traversal', () => {
  for (const pattern of [
    'a/{b,c}/d',
    '{{a,b},c}',
    '{1..5}',
    'foo/({a,b})',
    '\\{a,b\\}',
    '{a,{b,{c,d}}}',
    '{a,b}{1,2}',
    '{{x}y}',
    '{a,,b}',
    '{1..10..2}'
  ]) {
    it(`preserves stringify roundtrip for ${pattern}`, () => {
      assert.equal(braces.stringify(braces.parse(pattern)), braces.stringify(pattern));
    });
  }

  const deepAst = depth => {
    let node = { type: 'text', value: 'a' };
    for (let i = 0; i < depth; i++) {
      node = { type: 'paren', nodes: [node] };
    }
    return { type: 'root', nodes: [node] };
  };

  it('stringifies a 15000-level AST without stack exhaustion', () => {
    assert.equal(braces.stringify(deepAst(15000)), 'a');
  });

  it('compiles a 15000-level AST without stack exhaustion', () => {
    assert.equal(braces.compile(deepAst(15000)), 'a');
  });

  it('does not change the relative order of sibling nodes', () => {
    const ast = {
      type: 'root',
      nodes: [
        { type: 'text', value: 'first' },
        { type: 'paren', nodes: [{ type: 'text', value: '-' }, { type: 'text', value: 'second' }] },
        { type: 'text', value: '-third' }
      ]
    };
    assert.equal(braces.stringify(ast), 'first-second-third');
    assert.equal(braces.compile(ast), 'first-second-third');
  });

  it('supports escapeInvalid with invalid delimiter nodes', () => {
    const ast = {
      type: 'root',
      nodes: [{ type: 'open', value: '{', invalid: true, isOpen: true }]
    };
    assert.equal(braces.stringify(ast, { escapeInvalid: true }), '\\{');
    assert.equal(braces.compile(ast, { escapeInvalid: true }), '\\{');
  });
});
