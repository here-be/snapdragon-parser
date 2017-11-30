'use strict';

const Node = require('snapdragon-node');

class Block extends Node {
  constructor(tok) {
    super(tok.type.slice(0, -5));

    switch (this.type) {
      case 'angle':
        break;
      case 'brace':
        break;
      case 'bracket':
        break;
      case 'paren':
      default: {
        break;
      }
    }

    this.push(new Node(tok));
  }
}

module.exports = Block;
