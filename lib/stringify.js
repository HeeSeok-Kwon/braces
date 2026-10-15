'use strict';

const utils = require('./utils');

module.exports = (ast, options = {}) => {
  const output = [];
  const stack = [ast];

  while (stack.length > 0) {
    const node = stack.pop();
    // Preserve the original behavior: recursive calls to stringify()
    // never passed the parent argument.
    const invalidNode = node.invalid === true && options.escapeInvalid === true;

    if (node.value) {
      if (invalidNode && utils.isOpenOrClose(node)) {
        output.push('\\' + node.value);
      } else {
        output.push(node.value);
      }
      continue;
    }

    if (node.nodes) {
      for (let i = node.nodes.length - 1; i >= 0; i--) {
        stack.push(node.nodes[i]);
      }
    }
  }

  return output.join('');
};
