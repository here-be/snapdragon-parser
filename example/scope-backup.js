const State = require('./state');

class Scope extends State {
  push(node) {
    if (this.nodes.indexOf(node) !== -1) {
      throw new Error('node has already been pushed: ' + node.type);
    }
    this.emit('node', node);
    this.stack.push(node);
    this.nodes.push(node);
    this.type(node.type).push(node);
    return node;
  }
}

module.exports = Scope;
