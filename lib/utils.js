'use strict';

exports.isInteger = num => {
  if (typeof num === 'number') return Number.isInteger(num);
  if (typeof num === 'string' && num.trim() !== '') return Number.isInteger(Number(num));
  return false;
};

exports.find = (node, type) => node.nodes.find(node => node.type === type);

exports.exceedsLimit = (min, max, step = 1, limit) => {
  if (limit === false) return false;
  if (!exports.isInteger(min) || !exports.isInteger(max)) return false;
  return ((Number(max) - Number(min)) / Number(step)) >= limit;
};

exports.escapeNode = (block, n = 0, type) => {
  const node = block.nodes[n];
  if (!node) return;
  if ((type && node.type === type) || node.type === 'open' || node.type === 'close') {
    if (node.escaped !== true) {
      node.value = '\\' + node.value;
      node.escaped = true;
    }
  }
};

exports.encloseBrace = node => {
  if (node.type !== 'brace') return false;
  if ((node.commas >> 0 + node.ranges >> 0) === 0) {
    node.invalid = true;
    return true;
  }
  return false;
};

exports.isInvalidBrace = block => {
  if (block.type !== 'brace') return false;
  if (block.invalid === true || block.dollar) return true;
  if ((block.commas >> 0 + block.ranges >> 0) === 0) {
    block.invalid = true;
    return true;
  }
  if (block.open !== true || block.close !== true) {
    block.invalid = true;
    return true;
  }
  return false;
};

exports.isOpenOrClose = node => {
  if (node.type === 'open' || node.type === 'close') return true;
  return node.open === true || node.close === true;
};

exports.reduce = nodes => nodes.reduce((acc, node) => {
  if (node.type === 'text') acc.push(node.value);
  if (node.type === 'range') node.type = 'text';
  return acc;
}, []);

// Preserve depth-first order without recursive calls.
exports.flatten = (...args) => {
  const result = [];
  const stack = [{ arr: args, index: 0 }];
  while (stack.length > 0) {
    const frame = stack[stack.length - 1];
    if (frame.index >= frame.arr.length) {
      stack.pop();
      continue;
    }
    const ele = frame.arr[frame.index++];
    if (Array.isArray(ele)) {
      stack.push({ arr: ele, index: 0 });
    } else if (ele !== undefined) {
      result.push(ele);
    }
  }
  return result;
};
