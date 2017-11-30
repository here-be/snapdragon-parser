'use strict';

/**
 * Module dependencies
 */

const Emitter = require('@sellside/emitter');
const Stack = require('snapdragon-stack');
const Lexer = require('snapdragon-lexer');
const Node = require('snapdragon-node');
const show = require('snapdragon-show');
const util = require('snapdragon-util');
const union = require('union-value');
const typeOf = require('kind-of');
const use = require('use');

/**
 * Local dependencies
 */

const format = require('./lib/format');
const utils = require('./lib/utils');

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
    this.trash = [];
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

  error(err) {
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

  node(type, val) {
    const node = new this.Node(type, val);
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
    this.handlers[type] = this.wrap(type, fn);
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
    const fn = this.handlers[type] || this.handler.default;
    if (typeof fn !== 'function') {
      this.error(new TypeError(`expected handler to be a function: "${type}"`));
      return;
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
        if (typeOf(node) === 'object' && !this.isNode(node)) {
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
          err.message += '\n' + show(this, tok);
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

  isBlock(node) {
    return Array.isArray(node.nodes) && this.isBlockOpen(node.nodes[0]);
  }

  isBlockOpen(node) {
    return node.type.length >= 6 && node.type.slice(-5) === '.open';
  }

  isBlockClose(node) {
    return node.type.length >= 7 && node.type.slice(-6) === '.close';
  }

  isClosedBlock(node) {
    return this.isBlock(node) && this.isBlockClose(util.last(node.nodes), node);
  }

  isOpenBlock(node) {
    return this.isBlock(node) && !this.isBlockClose(util.last(node.nodes), node);
  }

  isScopeOpen(node) {
    return this.isBlock(node) && !this.scopes.isInside('bracket');
  }

  isScopeClose(block) {
    return block === this.scope.node;
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

  allocate(node) {
    if (!node) return;
    this.block.push(node);

    if (this.isOpenBlock(node)) {
      this.push(node);
      return node;
    }

    if (this.isBlockClose(node)) {
      this.pop();
      return node;
    }
  }

  push(block) {
    if (!block) return;
    this.state.push(block);
    this.scopes.handle(block);
    return block;
  }

  pop() {
    const block = this.state.pop();
    this.scopes.handle(block);
    return block;
  }

  // push(block) {
  //   if (!block) return;
  //   this.state.push(block);
  //   if (this.isScopeOpen(block)) {
  //     this.scopes.push(block);
  //   } else {
  //     this.scope.chain.push(block);
  //   }
  //   return block;
  // }

  // pop() {
  //   const state = this.state.pop();
  //   this.trash.push(state);
  //   if (this.isScopeClose(this.prevState)) {
  //     this.scopes.pop();
  //   } else {
  //     this.scope.chain.pop();
  //   }
  //   return state;
  // }

  /**
   * Get the previously stored node from `parser.state.stack`
   */

  get block() {
    return this.current;
  }

  get current() {
    return this.stack.current();
  }

  get prev() {
    return this.stack.prev();
  }

  get lastChild() {
    return this.stack.lastChild;
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
      return this.error(new TypeError('expected input to be a string'));
    }
    if (this.types.length === 0) {
      return this.error(new Error('no parser handlers are registered'));
    }

    this.init();
    this.string = this.input = input;

    this.push(this.bos);
    while (!this.lexer.eos()) this.next();
    this.push(this.eos);

    this.fail();
    return this.ast;
  }

  /**
   * Concat nodes from another AST to `node.nodes`.
   *
   * @param {Object} `node`
   * @param {Object} `ast`
   * @return {Object}
   * @api public
   */

  concat(node, ast) {
    for (let child of ast.nodes) {
      if (child.type !== 'bos' && child.type !== 'eos') {
        this.emit('node', child);
        node.push(child);
      }
    }
    return node;
  }

  /**
   * Fail when a closing delimiter is missing.
   */

  fail() {
    let node = this.stack.pop();
    if (node.type !== 'root') {
      this.error(new SyntaxError(`unclosed: "${node.type}"`));
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
