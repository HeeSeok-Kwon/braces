'use strict';

const fill = require('fill-range');
const utils = require('./utils');

// Traverse the AST iteratively to avoid consuming the JavaScript call stack.
const compile = (ast, options = {}) => {
  const output = [];
  const stack = [{ node: ast, parent: {} }];

  while (stack.length > 0) {
    const { node, parent } = stack.pop();
    const invalidBlock = utils.isInvalidBrace(parent);
    const invalidNode = node.invalid === true && options.escapeInvalid === true;
    const invalid = invalidBlock === true || invalidNode === true;
    const prefix = options.escapeInvalid === true ? '\\' : '';

    if (node.isOpen === true) {
      output.push(prefix + node.value);
      continue;
    }

    if (node.isClose === true) {
      console.log('node.isClose', prefix, node.value);
      output.push(prefix + node.value);
      continue;
    }

    if (node.type === 'open') {
      output.push(invalid ? prefix + node.value : '(');
      continue;
    }

    if (node.type === 'close') {
      output.push(invalid ? prefix + node.value : ')');
      continue;
    }

    if (node.type === 'comma') {
      output.push(node.prev.type === 'comma' ? '' : invalid ? node.value : '|');
      continue;
    }

    if (node.value) {
      output.push(node.value);
      continue;
    }

    if (node.nodes && node.ranges > 0) {
      const args = utils.reduce(node.nodes);
      const range = fill(...args, { ...options, wrap: false, toRegex: true, strictZeros: true });

      if (range.length !== 0) {
        output.push(args.length > 1 && range.length > 1 ? `(${range})` : range);
        continue;
      }
    }

    if (node.nodes) {
      for (let i = node.nodes.length - 1; i >= 0; i--) {
        stack.push({ node: node.nodes[i], parent: node });
      }
    }
  }

  return output.join('');
};

module.exports = compile;
