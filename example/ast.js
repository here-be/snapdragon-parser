'use strict';

const Node = require('snapdragon-node');

class AST extends Node {
  constructor() {
    super('root');
    this.errors = [];
    this.nodes = [];
  }
}

module.exports = AST;
