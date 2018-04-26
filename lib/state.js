'use strict';

const assert = require('assert');

/**
 * Initialize a new `State`.
 */

class State {
  constructor(parser, Stack) {
    this.parser = parser;
    this.Stack = Stack;
    this.stack = new this.Stack();
    this.length = 0;
    this.types = {};
  }

  hasType(type) {
    return Array.isArray(this.types[type]);
  }

  isInside(type) {
    if (this.length > 0 && this.hasType(type)) {
      return this.types[type].length > 0;
    }
    return false;
  }

  current() {
    return this.stack.prev();
  }

  last() {
    return this.lastChild() || this.current();
  }

  prev() {
    return this.stack.prev();
  }

  firstChild() {
    return this.stack.firstChild();
  }

  lastChild() {
    return this.stack.lastChild();
  }

  isBlock() {}
  isOpen() {}
  isClose() {}

  push(node) {
    assert(this.parser.Node.isNode(node), 'expected a node');
    if (!this.hasType(node.type)) {
      this.types[node.type] = new this.Stack();
    }
    this.types[node.type].push(node);
    this.stack.push(node);
    this.length++;
    return node;
  }

  pop() {
    const node = this.stack.pop();
    if (!node) return null;
    if (node.type === 'eos') return node;

    const typeStack = this.types[node.type];
    if (!Array.isArray(typeStack)) {
      const name = this.constructor.name.toLowerCase();
      throw new Error(`expected stack for ${name}.type "${node.type}" to be an array`);
    }

    typeStack.pop();
    this.length--;
    return node;
  }
};

module.exports = State;

// /**
//  * This plugin is a function that must be called and passed to
//  * `snapdragon.parser.use()` to initialize.
//  *
//  * ```js
//  * var state = require('snapdragon-state');
//  * var Snapdragon = require('snapdragon');
//  * var snapdragon = new Snapdragon();
//  * snapdragon.parser.use(state([options]));
//  * ```
//  * @param {String} `options`
//  * @return {undefined}
//  * @api public
//  */

// module.exports = function(options) {
//   return function(parser) {
//     // "this" is the parser instance
//     if (!this || !this.isParser && !this.isLexer) {
//       throw new Error('expected an instance of snapdragon Parser or Lexer');
//     }

//     /**
//      * Merge options from the instance with plugin options.
//      */

//     var opts = Object.assign({}, this.options, options);

//     /**
//      * Initialize
//      */

//     this.State = State;
//     this.state = new this.State(this.Stack);
//     this.stack = this.state.stack;

//     /**
//      * Get the previously stored node from `parser.state.stack`
//      */

//     this.prev = () => this.state.prev();

//     /**
//      * Get the last child node from the last node on the stack.
//      */

//     this.last = () => this.state.last();

//     /**
//      * Return true if inside a "set" of the given `type`. Sets are created
//      * manually by adding a type to `parser.sets`. A node is "inside" a set
//      * when an `*.open` node for the given `type` was previously pushed onto the set.
//      * The type is removed from the set by popping it off when the `*.close`
//      * node for the given type is reached.
//      *
//      * ```js
//      * parser.capture('bracket.close', function(tok) {
//      *   if (!parser.isInside('bracket')) {
//      *     throw new Error('missing opening bracket');
//      *   }
//      * });
//      * ```
//      * @name .isInside
//      * @param {String} `type`
//      * @return {Boolean}
//      * @api public
//      */

//     this.isInside = type => this.state.isInside(type);

//     /**
//      * Push a node onto the stack for the given `type`. Overwrites
//      * the built-in `.push` method to push nodes onto the `state.stack`.
//      *
//      * ```js
//      * parser.set('all', function(tok) {
//      *   this.push(this.node(tok));
//      * });
//      * ```
//      * @name .push
//      * @return {Object} `node`
//      * @api public
//      */

//     /**
//      * Push a `node` onto `parent.nodes`.
//      *
//      * @param {Object} `node`
//      * @param {Object} `parent`
//      * @return {undefined}
//      * @api public
//      */

//     this.push = (node, parent = this.prev) => {
//       if (!this.isNode(node)) {
//         throw new TypeError('expected node to be an instance of Node');
//       }

//       this.emit('push', node);
//       // push the node onto the "parent.nodes" array, and set
//       // "parent" as the value on "node.parent"
//       parent.push(node);

//       // if the node has not yet received a closing node,
//       // push it onto the stack
//       if (this.isBlock(node)) {
//         this.state.push(node);
//         return;
//       }

//       // if the node is a closing node, as defined by the
//       // parent node, then pop it from the stack
//       if (this.isClose(node, parent)) {
//         this.pop(parent.type);
//       }
//     };

//     /**
//      * Pop a node from the stack. Overwrites the built-in `.pop`
//      * method to pop nodes from the `state.stack`.
//      *
//      * ```js
//      * parser.set('brace.close', function(tok) {
//      *   var node = parser.pop();
//      *   if (node.type !== 'brace') {
//      *     parser.error('missing opening: {');
//      *   }
//      *   node.push(tok);
//      *   return true;
//      * });
//      * ```
//      * @name .pop
//      * @returns {Object} Returns the popped node.
//      * @api public
//      */

//     this.pop = () => {
//       const node = this.stack.pop();
//       this.emit('pop', node);
//       return node;
//     };

//     /**
//      * Parses the given `input` string and returns an AST object.
//      *
//      * ```js
//      * var ast = parser.parse('foo/bar');
//      * ```
//      * @param {String} `input`
//      * @return {Object} Returns an AST
//      * @api public
//      */

//     // this.parse = input => {
//     //   if (typeof input !== 'string') {
//     //     return this.error('INVALID_INPUT', input);
//     //   }
//     //   if (this.types.length === 0) {
//     //     return this.error('NO_HANDLERS');
//     //   }

//     //   this.init();
//     //   this.string = this.input = input;
//     //   this.push(this.ast);
//     //   this.emit('parse');

//     //   // this.stash(this.bos());

//     //   // while (this.input || this.queue.length) {
//     //   //   this.stash(this.next());
//     //   // }

//     //   // this.stash(this.eos());
//     //   // this.fail();

//     //   const parse = () => {
//     //     if (this.input || this.queue.length) {
//     //       this.stash(this.next(), this.prev());
//     //       return parse();
//     //     }
//     //     this.stash(this.next());
//     //     this.fail();
//     //   };

//     //   parse();

//     //   // add non-enumerable parser reference to AST
//     //   define(this.ast, 'parser', this);
//     //   return this.ast;
//     // };
//   };
// };

// module.exports.State = State;
