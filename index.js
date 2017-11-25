'use strict';

/**
 * Module dependencies
 */

const assert = require('assert');
const Emitter = require('@sellside/emitter');
const define = require('define-property');
const Stack = require('snapdragon-stack');
const Lexer = require('snapdragon-lexer');
const util = require('snapdragon-util');
const Node = require('snapdragon-node');
const union = require('union-value');
const typeOf = require('kind-of');
const use = require('use');

/**
 * Local dependencies
 */

const ParserError = require('./lib/ParserError');
const format = require('./lib/format');

/**
 * Create a new `Parser` with the given `input` and `options`.
 *
 * ```js
 * const Snapdragon = require('snapdragon');
 * const Parser = Snapdragon.Parser;
 * const parser = new Parser();
 * ```
 * @param {String} `input`
 * @param {Object} `options`
 * @api public
 */

class Parser extends Emitter {
  constructor(options) {
    super();
    this.isParser = true;
    this.options = Object.assign({type: 'root'}, options);

    this.Stack = this.options.Stack || Stack;
    this.Lexer = this.options.Lexer || Lexer;
    this.lexer = this.options.lexer || new this.Lexer(this.options);
    this.Node = this.options.Node || Node;
    this.node = this.node.bind(this);

    this.handlers = {};
    this.types = [];
    this.init();
    use(this);
  }

  /**
   * Initialize
   *
   * @param {[type]} options
   * @return {[type]}
   * @api public
   */

  init(options) {
    this.lexer.init();
    this.stack = new this.Stack();
    this.bos = this.node({ type: 'bos', val: '' });
    this.eos = this.node({ type: 'eos', val: '' });
    this.ast = this.node({ type: this.options.type, errors: [] });
    this.stack.push(this.ast);
    this.emit('init');
  }

  /**
   * Throw a formatted error message with details including the cursor position.
   *
   * ```js
   * parser.set('foo', function(tok) {
   *   if (tok.val !== 'foo') {
   *     throw this.error('expected token.val to be "foo"', tok);
   *   }
   * });
   * ```
   * @name .error
   * @param {String} `msg` Message to use in the Error.
   * @param {Object} `node`
   * @return {undefined}
   * @api public
   */

  error(code, ...args) {
    const err = new ParserError(code, ...args);
    this.ast.errors.push(err);
    if (this.hasListeners('error')) {
      this.emit('error', err);
    } else {
      throw err;
    }
  }

  /**
   * Get and set the input string on both the parser and `parser.lexer`
   * instances, to ensure the string is always correct.
   */

  set input(input) {
    this.lexer.input = input;
  }
  get input() {
    return this.lexer.input;
  }
  get consumed() {
    return this.lexer.consumed;
  }

  /**
   * Proxy lexer methods
   */

  enqueue() {
    return this.lexer.enqueue();
  }

  dequeue() {
    return this.lexer.dequeue();
  }

  lookbehind(n) {
    return this.lexer.lookbehind(n);
  }

  lookahead(n) {
    return this.lexer.lookahead(n);
  }

  peek() {
    return this.lexer.peek();
  }

  skip(n) {
    return this.lexer.skip(n);
  }

  /**
   * Create a new [Node](#node) with the given `val` and `type`.
   *
   * ```js
   * let node = parser.node('/', 'slash');
   * // or as an object
   * let node = parser.node({type: 'slash', val: '/'});
   * // sugar for
   * let node = new parser.Node({type: 'slash', val: '/'});
   * ```
   * @name .node
   * @param {Object|String} `type` Object or the value to assign to `node.type`
   * @param {String} `val` The value to assign to `node.val`
   * @return {Object} returns the created [Node](#node) instance.
   * @api public
   */

  node(...args) {
    const node = new this.Node(...args);
    this.emit('node', node);
    return node;
  }

  /**
   * Returns true if the given value is an instance of [snapdragon-node][].
   *
   * @name .isNode
   * @param {Object} `node`
   * @return {Boolean}
   * @api public
   */

  isNode(node) {
    return this.Node.isNode(node);
  }

  /**
   * Register handler of the given `type`.
   *
   * ```js
   * parser.set('all', function(tok) {
   *   // do stuff to tok
   *   return tok;
   * });
   * ```
   * @name .set
   * @param {String} `type`
   * @param {Function} `handler`
   * @api public
   */

  set(type, fn) {
    union(this, 'types', type);
    const self = this;
    this.handlers[type] = (...args) => {
      let handler = fn;
      if (!handler || handler.wrapped !== true) {
        handler = this.wrap(type, handler);;
      }
      return handler.apply(self, args);
    };
    // this.handlers[type] = this.wrap(type, fn);
    return this;
  }

  /**
   * Get the registered handler of the given `type`.
   *
   * ```js
   * const fn = parser.get('slash');
   * ```
   * @name .get
   * @param {String} `type`
   * @returns {Function} Returns the handler function, or throws an error if not registered.
   * @api public
   */

  get(type) {
    const fn = this.handlers[type];
    if (typeof fn !== 'function') {
      return this.error('NO_HANDLER', type);
    }
    return fn;
  }

  /**
   * Wrap a handler to ensure that returned objects are nodes with
   * the `node.type` value set. Also sets the `type` value on `fn.type`
   * property for easier debugging.
   *
   * @param {String} `type`
   * @param {Function} `handler`
   * @return {Function} Returns a wrapped function.
   * @api private
   */

  wrap(type, handler) {
    // if it's a noop, just return the token
    if (typeof handler !== 'function') {
      handler = tok => tok;
    }

    if (handler.wrapped === true) {
      return handler;
    }

    const fn = (tok) => {
      try {
        let node = handler.call(this, tok);
        if (node && !this.isNode(node)) {
          node = this.node(node);
        }
        if (node && !node.type) {
          node.type = type;
        }
        if (node && node.type) {
          this.emit('handled', node);
          this.emit(node.type, node);
          return node;
        }
      } catch (err) {

        try {
          err.message += '\n' + format.showPosition(this, tok);
          return this.error(err);
        } catch (ex) {
          throw err;
        }
      }
    };

    fn.wrapped = true;
    fn.type = type;

    Object.setPrototypeOf(fn, handler);
    if (handler.prototype) {
      fn.prototype = handler.prototype;
    }
    return fn;
  }

  /**
   * Capture a node of the given `type`.
   *
   * @name .capture
   * @param {String} `type` (required)
   * @param {RegExp} `regex` (optional)
   * @param {Function} `lexerFn` (optional)
   * @param {Function} `parserFn` (optional)
   * @return {Object} Returns the Parser instance for chaining.
   * @api public
   */

  capture(type, regex, lexerFn, parserFn) {
    if (!isRegex(regex)) {
      return this.set(type, regex);
    }
    if (typeof parserFn === 'undefined') {
      parserFn = lexerFn;
      lexerFn = null;
    }
    this.lexer.capture(type, regex, lexerFn);
    return this.set(type, parserFn);
  }

  isUnclosedBlock(node) {
    if (typeof this.options.isUnclosedBlock === 'function') {
      return this.options.isUnclosedBlock.apply(this, arguments);
    }

    let nodes = node.nodes;
    let child = nodes ? nodes[nodes.length - 1] : null;
    return node.nodes && !this.isClose(child, node);
  }

  isOpenNode(node, parent = this.prev) {
    if (typeof this.options.isOpenNode === 'function') {
      return this.options.isOpenNode.apply(this, arguments);
    }
    return parent.isOpen ? parent.isOpen(node) : false;
  }

  isCloseNode(node, parent = this.prev) {
    if (typeof this.options.isCloseNode === 'function') {
      return this.options.isCloseNode.apply(this, arguments);
    }
    return parent.isClose ? parent.isClose(node) : false;
  }

  /**
   * Push a node onto the stack for the given `type`.
   *
   * ```js
   * parser.set('all', function(tok) {
   *   this.push(this.node(tok));
   * });
   * ```
   * @name .push
   * @emits push
   * @param {Object} `node` (required)
   * @return {Object} `node`
   * @api public
   */

  push(node, parent = this.prev) {
    if (!node) return;
    if (!this.isNode(node)) {
      throw new Error('expected node to be an instance of Node');
    }

    this.emit('push', node);
    parent.push(node);

    if (node.nodes && !node.isClose(node.lastChild)) {
      this.stack.push(node);

    } else if (parent.isClose(node)) {
      this.pop(parent.type);
    }

    return node;
  }

  /**
   * Pop a node from the stack.
   *
   * ```js
   * parser.pop();
   * ```
   * @name .pop
   * @emits pop
   * @param {undefined} Takes no arguments
   * @returns {Object} Returns the popped node.
   * @api public
   */

  pop() {
    this.current = null;
    const node = this.stack.pop();
    this.emit('pop', node);
    return node;
  }

  /**
   * Get the previously stored node from `parser.state.stack`
   */

  get prev() {
    return this.current || this.stack.prev;
  }

  get last() {
    return this.stack.last;
  }

  /**
   * Gets the next token from the lexer, then calls the registered
   * parser handler for `token.type` on the token.
   *
   * @name .next
   * @return {any} Returns whatever value the handler returns.
   * @api public
   */

  next() {
    const tok = this.lexer.next();
    this.lexer.push(tok);
    const handler = this.get(tok.type);
    return this.push(handler.call(this, tok));
  }

  /**
   * Parses the given `input` string and returns an AST object.
   *
   * ```js
   * const ast = parser.parse('foo/bar');
   * ```
   * @name .parse
   * @param {String} `input`
   * @return {Object} Returns an AST (abstract syntax tree).
   * @api public
   */

  parse(input) {
    if (this.input) {
      const parser = new this.constructor(this.options);
      parser.lexer.handlers = this.lexer.handlers;
      parser.lexer.types = this.lexer.types;
      parser.handlers = this.handlers;
      parser.types = this.types;
      return parser.parse(input);
    }

    if (typeof input !== 'string') {
      return this.error('INVALID_INPUT', input);
    }
    if (this.types.length === 0) {
      return this.error('NO_HANDLERS');
    }

    this.init();
    this.string = this.input = input;
    this.push(this.bos);
    while (this.input || this.lexer.queue.length) this.next();
    this.push(this.eos);
    this.fail();

    // add non-enumerable parser reference to AST
    define(this.ast, 'parser', this);
    return this.ast;
  }

  concat(node, nodes) {
    for (let i = 1; i < nodes.length - 1; i++) {
      const child = nodes[i];
      this.emit('node', child);
      node.push(child);
    }
  }

  /**
   * Fail when a closing delimiter is missing.
   */

  fail() {
    let node = this.stack.pop();
    if (node.type !== 'root') {
      throw new Error(`unclosed: "${node.type}"`);
    }
  }

  /**
   * Returns true if the given value is an instance of snapdragon `Parser`.
   *
   * ```js
   * const Parser = require('snapdragon/lib/parser');
   * const parser = new Parser();
   * console.log(Parser.isParser(parser)); //=> true
   * console.log(Parser.isParser({})); //=> false
   * ```
   * @param {Object} `parser`
   * @returns {Boolean}
   * @api public
   */

  static isParser(parser) {
    return isObject(parser) && parser.isParser === true;
  }
}

/**
 * Returns true if val is an object
 * @param {any} val
 * @return {Boolean}
 */

function isObject(val) {
  return typeOf(val) === 'object';
}

/**
 * Returns true if val is a RegExp
 * @param {any} val
 * @return {Boolean}
 */

function isRegex(val) {
  return typeOf(val) === 'regexp';
}

/**
 * Expose `Parser`
 * @type {Function}
 */

module.exports = Parser;
