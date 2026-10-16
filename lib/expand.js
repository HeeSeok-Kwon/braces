'use strict';

const fill = require('fill-range');
const stringify = require('./stringify');
const utils = require('./utils');

// Process nested array combinations using explicit work items, not recursion.
const append = (queue = '', stash = '', enclose = false) => {
  const output = [];
  const stack = [{ type: 'call', queue, stash }];

  while (stack.length > 0) {
    const task = stack.pop();
    if (task.type === 'value') {
      output.push(task.value);
      continue;
    }
    if (task.type === 'flatten') {
      for (const value of utils.flatten(task.arr)) output.push(value);
      continue;
    }

    const q = [].concat(task.queue);
    const s = [].concat(task.stash);

    if (!s.length) {
      stack.push({ type: 'flatten', arr: q });
      continue;
    }

    if (!q.length) {
      stack.push({
        type: 'flatten',
        arr: enclose ? utils.flatten(s).map(ele => `{${ele}}`) : s
      });
      continue;
    }

    for (let i = q.length - 1; i >= 0; i--) {
      const item = q[i];
      if (Array.isArray(item)) {
        for (let j = item.length - 1; j >= 0; j--) {
          stack.push({ type: 'call', queue: item[j], stash: s });
        }
      } else {
        for (let j = s.length - 1; j >= 0; j--) {
          let ele = s[j];
          if (enclose === true && typeof ele === 'string') ele = `{${ele}}`;
          if (Array.isArray(ele)) {
            stack.push({ type: 'call', queue: item, stash: ele });
          } else {
            stack.push({ type: 'value', value: item + ele });
          }
        }
      }
    }
  }
  return output;
};

const expand = (ast, options = {}) => {
  const rangeLimit = options.rangeLimit === undefined ? 1000 : options.rangeLimit;
  const frames = [{ node: ast, parent: {}, initialized: false, index: 0 }];
  const active = new Set();
  // Cache the closest brace/root owner so deeply nested parentheses do not
  // repeat the same parent-chain traversal for every node.
  const owners = new WeakMap();
  const queueOwner = node => {
    if (!node || typeof node !== 'object') return node;
    if (owners.has(node)) return owners.get(node);

    const chain = [];
    const seen = new Set();
    let current = node;

    while (current && current.type !== 'brace' && current.type !== 'root' && current.parent) {
      if (owners.has(current)) {
        current = owners.get(current);
        break;
      }
      if (seen.has(current)) throw new RangeError('AST parent chain contains a cycle');
      seen.add(current);
      chain.push(current);
      current = current.parent;
    }

    for (const item of chain) owners.set(item, current);
    if (current && typeof current === 'object') owners.set(current, current);
    return current;
  };
  let rootQueue;

  while (frames.length > 0) {
    const frame = frames[frames.length - 1];
    const { node, parent } = frame;

    if (!frame.initialized) {
      if (active.has(node)) throw new RangeError('AST contains a cycle');
      active.add(node);
      frame.initialized = true;
      node.queue = [];
      if (frames.length === 1) rootQueue = node.queue;

      frame.q = queueOwner(parent).queue;

      if (node.invalid || node.dollar) {
        frame.q.push(append(frame.q.pop(), stringify(node, options)));
        active.delete(node);
        frames.pop();
        continue;
      }

      if (node.type === 'brace' && node.invalid !== true && node.nodes.length === 2) {
        frame.q.push(append(frame.q.pop(), ['{}']));
        active.delete(node);
        frames.pop();
        continue;
      }

      if (node.nodes && node.ranges > 0) {
        const args = utils.reduce(node.nodes);
        if (utils.exceedsLimit(...args, options.step, rangeLimit)) {
          throw new RangeError('expanded array length exceeds range limit. Use options.rangeLimit to increase or disable the limit.');
        }
        let range = fill(...args, options);
        if (range.length === 0) range = stringify(node, options);
        frame.q.push(append(frame.q.pop(), range));
        node.nodes = [];
        active.delete(node);
        frames.pop();
        continue;
      }

      frame.enclose = utils.encloseBrace(node);
      frame.queue = queueOwner(node).queue;
    }

    if (frame.index >= node.nodes.length) {
      active.delete(node);
      frames.pop();
      continue;
    }

    const i = frame.index++;
    const child = node.nodes[i];

    if (child.type === 'comma' && node.type === 'brace') {
      if (i === 1) frame.queue.push('');
      frame.queue.push('');
      continue;
    }

    if (child.type === 'close') {
      frame.frame.q.push(append(frame.frame.q.pop(), frame.queue, frame.enclose));
      continue;
    }

    if (child.value && child.type !== 'open') {
      frame.queue.push(append(frame.queue.pop(), child.value));
      continue;
    }

    if (child.nodes) {
      frames.push({ node: child, parent: node, initialized: false, index: 0 });
    }
  }

  return utils.flatten(rootQueue);
};

module.exports = expand;
