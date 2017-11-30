'use strict';

const Emitter = require('@sellside/emitter');
const Scope = require('./scope');

class Scopes extends Emitter {
  constructor(node) {
    super();
    const scope = new Scope(node);
    this.handlers = {};
    this.types = { root: [scope] };
    this.stack = [scope];
    this.chain = [scope];
  }

  handler(type, fn) {
    if (typeof fn !== 'function') {
      return this.handlers[type] || this.handlers.default;
    }
    this.handlers[type] = fn;
    return this;
  }

  handle(node) {
    const handler = this.handler(node.type);
    if (handler) {
      return handler.call(this, node);
    }
  }

  type(type) {
    return this.types[type] || (this.types[type] = []);
  }

  push(node) {
    if (this.chain.indexOf(node) !== -1) {
      throw new Error('scope has already been pushed: ' + node.inspect());
    }

    const scope = new Scope(node);
    this.emit('push', scope);
    this.chain.push(node);
    this.stack.push(scope);
    this.type(scope.type).push(scope);
    return scope;
  }

  pop() {
    let scope = this.stack.pop();
    let type = this.type(scope.type).pop();
    if (type !== scope) {
      throw new Error('unexpected scope: ' + scope.inspect());
    }
    this.emit('pop', scope);
    return scope;
  }

  isInside(type) {
    return this.type(type).length > 0;
  }

  prev() {
    return last(this.stack, 2);
  }

  current(prop) {
    const node = last(this.stack);
    if (node) {
      return prop ? node[prop] : node;
    }
  }
};

function last(arr, n) {
  return arr ? arr[arr.length - (n || 1)] : null;
}

module.exports = Scopes;
