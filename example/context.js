'use strict';

class Context {
  constructor(scope) {
    this.scope = scope;
    this.functions = {};
    this.variables = {};
    this.constants = {};
    this.params = [];
    this.args = [];
  }
}

module.exports = Context;
