'use strict';

const BaseNode = require('snapdragon-node');
const Block = require('./block');
const AST = require('./ast');

class Node extends BaseNode {
  constructor(tok) {
    super(tok);
    if (Node.isNode(tok)) {
      return tok;
    }
    if (tok.type === 'root') {
      return new AST(tok);
    }
    if (tok.type.slice(-5) === '.open') {
      return new Block(tok);
    }
  }
}

module.exports = Node;
