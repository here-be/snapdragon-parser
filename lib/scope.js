'use strict';

/**
 * Create a new `Scope` with the given `node`.
 *
 * ```js
 * const node = new Node({type: 'brace', nodes: [{type: 'brace.open', value: '}'}]});
 * const scope = new Scope(node);
 * ```
 * @name Scope
 * @param {Object} `node` The node to associate with the scope
 * @return {Object} Scope instance
 * @api public
 */

class Scope {
  constructor(node) {
    define(node, 'scope', this);
    this.define('isScope', true);
    this.define('parent', null);
    this.define('length', 0);
    this.node = node;
    this.type = this.node.type;
    this.conditions = [];
    this.elements = [];
    this.context = {};
    this.forloop = {};
  }

  /**
   * Define a non-enumberable property on the node instance.
   * Useful for adding properties that shouldn't be extended
   * or visible during debugging.
   *
   * ```js
   * const node = new Scope();
   * node.define('foo', 'something non-enumerable');
   * ```
   * @param {String} `key`
   * @param {any} `value`
   * @return {Object} returns the node instance
   * @api public
   */

  define(key, value) {
    define(this, key, value);
    return this;
  }

  /**
   * Returns true if the node has an ancestor node of the given `type`
   *
   * ```js
   * const box = new Scope({type: 'box'});
   * const marble = new Scope({type: 'marble'});
   * box.push(marble);
   * marble.isInside('box'); //=> true
   * ```
   * @param {String} `type`
   * @return {Boolean}
   * @api public
   */

  isInside(type) {
    if (this.parent) {
      return this.parent.type === type || this.parent.isInside(type);
    }
    return false;
  }

  /**
   * Push a node onto the `scope.nodes` array.
   *
   * ```js
   * const scope = new Scope(new Node({type: 'brace'}));
   * scope.push(new Node({type: 'foo'}));
   * scope.push(new Node({type: 'bar'}));
   * ```
   * @param {Object} `node`
   * @return {Number} Returns the length of `scope.nodes` (similar to JavaScript's native `Array.push` method).
   * @api public
   */

  push(node) {
    if (!node) return;
    this.nodes = this.nodes || [];
    define(node, 'scope', this);
    return this.nodes.push(node);
  }

  /**
   * Pop a node from `scope.nodes`.
   *
   * ```js
   * const scope = new Scope({type: 'bracket'});
   * console.log(scope.nodes.length); //=> 0
   *
   * scope.push(new Node({type: 'bracket.open'}));
   * console.log(scope.nodes.length); //=> 1
   *
   * scope.pop();
   * console.log(scope.nodes.length); //=> 0
   * ```
   * @return {Number} Returns the popped `node`
   * @api public
   */

  pop() {
    if (this.nodes && this.nodes.length) {
      return this.nodes.pop();
    }
  }
}

function define(obj, key, val) {
  Reflect.defineProperty(obj, key, {
    enumerable: false,
    configurable: true,
    writable: true,
    value: val
  });
}

/**
 * Expose `Scope`
 */

exports = module.exports = Scope;
