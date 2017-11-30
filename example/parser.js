'use strict';

const Emitter = require('@sellside/emitter');
const Scopes = require('./scopes');
const State = require('./state');
const Node = require('./node');

class Parser extends Emitter {
  constructor() {
    super();
    this.ast = new Node({ type: 'root' });
    this.scopes = new Scopes(this.ast);
    this.state = new State(this.ast);
  }

  push(node) {
    this.emit('block.open', node);
    this.state.push(node);
    // console.log(node)
    this.scopes.handle(node);
    // if (this.isScopeOpen(node)) {
    //   this.emit('scope.open', node);
    //   this.scopes.push(node);
    // } else {
    //   this.scope.chain.push(node);
    // }
  }

  pop(node) {
    this.emit('block.close', node);
    this.state.pop();
    this.scopes.handle(node);
    // if (this.isScopeClose(node)) {
    //   this.scopes.pop();
    //   this.emit('scope.close', node);
    // } else {
    //   this.scope.chain.pop();
    // }
  }

  get current() {
    return this.state.current();
  }
  get scope() {
    return this.scopes.current();
  }

  isBlock(node) {
    return node.nodes && this.isBlockOpen(node.nodes[0]);
  }

  isBlockOpen(node) {
    return node.type.length >= 6 && node.type.slice(-5) === '.open';
  }

  isBlockClose(node) {
    return node.type.length >= 7 && node.type.slice(-6) === '.close';
  }

  isScopeOpen(node) {
    return this.isBlock(node) && !this.scopes.isInside('bracket');
  }

  isScopeClose(node) {
    return node === this.scope.node;
  }

  isInside(type) {
    return this.isInsideScope(type) || this.isInsideBlock(type);
  }

  isInsideBlock(type) {
    return this.state.isInside(type);
  }

  isInsideScope(type) {
    return this.scopes.isInside(type);
  }
}

/**
 * Expose Parser
 */

module.exports = Parser;
