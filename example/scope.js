'use strict';

const inspect = require('prettier-inspect');
const get = require('get-value');
const set = require('set-value');

class Scope {
  constructor(node, fn) {
    this.type = node.type;
    this.node = node;
    this.variables = {};
    this.context = [];
    this.chain = [];
    // this.state = {};
    // this.index = 0;
  }

  /**
   * When resolving a variable, we start at the innermost scope and
   * search outwards until we find the variable/object/function we're
   * looking for.
   * @return {any}
   * @api public
   */

  // get chain() {
  //   // todo
  //   return {};
  // }

  get(prop) {
    return get(this.chain, prop);
  }

  set(prop, val) {
    set(this.chain, prop, val);
    return val;
  }

  toObject(fn) {
    return inspect(this, fn);
  }
};

module.exports = Scope;
