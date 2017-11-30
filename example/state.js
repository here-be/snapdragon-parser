const Emitter = require('@sellside/emitter');

class State extends Emitter {
  constructor(node) {
    super();
    this.types = { root: [node] };
    this.nodes = [node];
    this.stack = [node];
  }

  type(type) {
    return this.types[type] || (this.types[type] = []);
  }

  push(node) {
    if (this.nodes.indexOf(node) !== -1) {
      throw new Error('node has already been pushed: ' + node.inspect());
    }
    this.emit('push', node);
    this.type(node.type).push(node);
    this.nodes.push(node);
    this.stack.push(node);
    return node;
  }

  pop() {
    let node = this.stack.pop();
    let type = this.type(node.type).pop();
    if (type !== node) {
      throw new Error('unexpected node: ' + node.inspect());
    }
    this.emit('pop', node);
    return node;
  }

  isInside(type) {
    return this.type(type).length > 0;
  }

  current() {
    return this.stack[this.stack.length - 1];
  }

  last(prop) {
    let node = this.current();
    while (node.nodes) {
      node = node.nodes[node.nodes.length - 1];
    }
    return prop ? node[prop] : node;
  }

  inside() {
    return this.current()['type'];
  }
}

// function last(nodes, prop) {
//   let node = nodes ? nodes[nodes.length - 1] : null;
//   if (node) {
//     return prop ? node[prop] : node;
//   }
// }

module.exports = State;
