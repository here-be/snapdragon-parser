'use strict';

class Frame {
  constructor(node) {
    this.node = node;
    this.variables = {};
    this.args = [];
  }
}

module.exports = Frame;
