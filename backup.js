'use strict';

/**
 * Module dependencies
 */

const assert = require('assert');
const Emitter = require('events');
const Lexer = require('snapdragon-lexer');
const Node = require('snapdragon-node');

/**
 * Local dependencies
 */

const Scopes = require('./lib/scopes');
const Stack = require('./lib/stack');
const State = require('./lib/state');

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
  constructor(input, options = {}) {
    super();

    if (typeof input !== 'string') {
      options = input;
      input = '';
    }

    if (Parser.isParser(options)) {
      return this.create(options.options, options);
    }

    this.isParser = true;
    this.options = Object.assign({ type: 'root' }, options);
    this.Lexer = this.options.Lexer || Lexer;
    this.lexer = this.options.lexer || new this.Lexer(this.options);

    this.contexts = [];
    this.Scopes = this.options.Scopes || Scopes;
    this.Stack = this.options.Stack || Stack;
    this.State = this.options.State || State;
    this.Node = this.options.Node || Node;

    this.Scopes = this.Scopes.bind(null, this, this.Stack);
    this.State = this.State.bind(null, this, this.Stack);
    this.node = this.node.bind(this);

    this.handlers = new Map();
    this.types = new Set();

    sync('string', this, this.lexer);
    sync('input', this, this.lexer);
    this.init(input);
  }

  /**
   * Initialize parser state properties
   */

  init(input) {
    this.lexer.init(input);
    this.scopes = new this.Scopes();
    this.state = new this.State();
    this.bos = this.node({ type: 'bos', value: '' });
    this.eos = this.node({ type: 'eos', value: '' });
    this.ast = this.node({ type: this.options.type, nodes: [] });
    this.scopes.push(this.node({type: 'root'}));
    this.state.push(this.ast);
    this.emit('init');
  }

  /**
   * Push a `parser` onto the contexts stack, or pop and return a parser.
   */

  context(parser) {
    if (parser) {
      this.contexts.push(parser);
    } else {
      return this.contexts.pop();
    }
  }

  /**
   * Create a new [Node](#node) with the given `value` and `type`.
   *
   * ```js
   * const node = parser.node({type: 'slash', value: '/'});
   * // sugar for
   * const Node = require('snapdragon-node');
   * const node = Node({type: 'slash', value: '/'});
   * ```
   * @name .node
   * @param {Object} `node` The object to use to create a node
   * @return {Object} returns the created [Node](#node) instance.
   * @api public
   */

  node(node, value) {
    assert(node, 'expected a string or object');
    if (typeof node === 'string') {
      return this.node({type: node, value});
    }
    if (!this.isNode(node)) {
      node = new this.Node(node);
    }

    const nodes = (nodes, parent) => {
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i] = this.node(nodes[i]);
        node.parent = parent;
        node.index = i;
      }
      return nodes;
    };

    if (Array.isArray(node.nodes)) {
      nodes(node.nodes, node);
    }

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

  set(type, handler) {
    assert.equal(typeof type, 'string', 'expected a string');

    // if it's a noop, just return the token
    if (typeof handler !== 'function') {
      handler = tok => tok;
    }

    if (handler.fn) return handler;

    const wrapped = tok => {
      let node = handler.call(this, tok);
      if (isObject(node) && !this.isNode(node)) {
        node = this.node(node);
      }

      if (!this.isNode(node)) return;
      if (!node.type) {
        node.type = type;
      }

      this.emit('handled', node);
      this.emit(node.type, node);
      return node;
    };

    wrapped.fn = handler;

    if (handler.name) {
      Reflect.defineProperty(wrapped, 'name', { value: handler.name });
    }

    this.handlers.set(type, wrapped);
    if (!this.types.has(type)) {
      this.types.add(type);
    }
    return this;
  }

  /**
   * Get a registered handler function.
   *
   * ```js
   * handlers.set('star', function() {
   *   // do parser, lexer, or compiler stuff
   * });
   * const star = handlers.get('star');
   * ```
   * @name .get
   * @param {String} `type`
   * @param {Function} `fn` The handler function to register.
   * @api public
   */

  get(type) {
    const handler = this.handlers.get(type) || this.handlers.get('default');
    assert.equal(typeof handler, 'function', `expected handler "${type}" to be a function`);
    return handler;
  }

  has(type) {
    return this.handlers.has(type);
  }

  /**
   * Get the previous node from the state
   */

  current() {
    return this.state.current();
  }

  /**
   * Get the previous node from the state
   */

  prev() {
    return this.state.current();
  }

  /**
   * Get the last child node of the current node on the state
   */

  last() {
    let prev = this.prev() || this.ast;

    while (prev && prev.nodes && prev.nodes.length) {
      prev = prev.nodes[prev.nodes.length - 1];
    }

    return prev;
  }

  /**
   * Proxy lexer methods
   */

  peek() {
    return this.lexer.peek();
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

  isInside(type) {
    return this.state.isInside(type);
  }

  isClose(node, parent) {
    if (typeof parent.isClose === 'function') {
      return parent.isClose(node);
    }
    const segs = node.type.split('.');
    if (segs[0] !== parent.type) {
      return false;
    }
    return segs[1] === 'close';
  }

  isBlock(node) {
    return Array.isArray(node.nodes) && node.nodes.length > 0;
  }

  isBlockOpen(node, prev = this.prev()) {
    assert(this.isNode(node), 'expected a node');
    if (isFunction(prev.isOpen) && prev.isOpen(node)) return true;
    if (isFunction(node.isOpen) && !node.nodes && node.isOpen()) return true;
    return node.type.length >= 5 && node.type.slice(-4) === 'open';
  }

  isBlockClose(node, prev = this.prev()) {
    assert(this.isNode(node), 'expected a node');
    if (isFunction(prev.isClose) && prev.isClose(node)) return true;
    if (isFunction(node.isClose) && !node.nodes && node.isClose()) return true;
    return node.type.length >= 6 && node.type.slice(-5) === 'close';
  }

  isClosedBlock(node) {
    return this.isBlock(node) && this.isBlockClose(node.last, node);
  }

  isOpenBlock(node) {
    return this.isBlock(node) && !this.isBlockClose(node.last, node);
  }

  /**
   * Push a node onto the `nodes` array of the "current" node
   * on the `state.stack`.
   *
   * ```js
   * parser.set('default', function(tok) {
   *   return this.push(this.node(tok));
   * });
   * ```
   * @name .push
   * @emits push
   * @param {Object} `node` (required)
   * @return {Object} `node`
   * @api public
   */

  push(node) {
    if (!node) return;
    if (isObject(node) && node.type && !this.isNode(node)) {
      node = this.node(node);
    }

    // set the current "scope" on the node
    define(node, 'scope', this.scope);
    this.scope.push(node);
    this.emit('push', node);

    const prev = this.prev();

    // allow users to do this with custom code in handlers
    if (node.skip !== true) {
      if (this.isBlock(node) && this.isBlockOpen(node.nodes[0])) {
        this.state.push(node);
      }

      if (this.isBlock(prev) && this.isClose(node, prev)) {
        this.pop(node);
      }
    }
    prev.push(node);

    if (node.type === 'brace') {
      console.log(this.state.stack)
    }
    return node;
  }

  pop(node) {
    const block = this.state.pop();
    assert(block && Array.isArray(block.nodes), 'expected a block node');

    if (node && !this.isClose(node, block)) {
      this.error(`expected "${block.type}.close" node, received: "${node.type}"`);
    }
    return block;
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
    if (!tok) return;
    this.lexer.push(tok);

    try {
      const handler = this.get(tok.type);
      return handler.call(this, tok);
    } catch (err) {
      err.name = 'ParserError';
      this.error(err);
    }
  }

  /**
   * Expect the given type, or throw an exception.
   *
   * @param {String} type
   * @api private
   */

  expect(type) {
    const next = this.peek();
    if (next.type !== type) {
      throw new Error(`expected "${type}", but got "${next.type}"`);
    }
    return this.next();
  }

  /**
   * Accept the given `type`.
   *
   * @param {String} type
   * @api private
   */

  accept(type) {
    const next = this.peek();
    if (next.type === type) {
      return this.next();
    }
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

  parse(input, options) {
    assert.equal(typeof input, 'string', 'expected input to be a string');
    this.init(input);
    const bos = this.handlers.get('bos');
    const eos = this.handlers.get('eos');

    this.push(bos ? bos.call(this, this.bos) : this.bos);
    while (!this.lexer.eos()) this.push(this.next());
    this.push(eos ? eos.call(this, this.eos) : this.eos);

    this.emit('parsed', this.ast);
    this.fail();
    return this.ast;
  }

  /**
   * Creates a new Parser instance with the given options, and copy
   * the handlers from the current instance to the new instance.
   *
   * @param {Object} `options`
   * @param {Object} `parent` Optionally pass a different parser instance to copy handlers from.
   * @return {Object} Returns a new Parser instance
   * @api public
   */

  create(options) {
    const parser = new this.constructor(options);
    parser.lexer.handlers = this.lexer.handlers;
    parser.lexer.types = this.lexer.types;
    parser.handlers = this.handlers;
    parser.types = this.types;
    parser.input = '';
    return parser;
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
        node.push(child);
      }
    }
    return node;
  }

  /**
   * Returns true if listeners are registered for even `name`.
   *
   * @name .hasListeners
   * @param {string} `name`
   * @return {boolean}
   * @api public
   */

  hasListeners(name) {
    return this.listenerCount(name) > 0;
  }

  /**
   * Throw a formatted error message with details including the cursor position.
   *
   * ```js
   * parser.set('foo', function(tok) {
   *   if (tok.value !== 'foo') {
   *     throw this.error('expected token.value to be "foo"', tok);
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
    if (typeof err === 'string') {
      err = new Error(err);
    }
    if (this.hasListeners('error')) {
      this.emit('error', err);
    } else {
      throw err;
    }
  }

  /**
   * Fail when a closing delimiter is missing.
   */

  fail() {
    const node = this.state.pop();
    if (node.type !== 'root') {
      this.error(new SyntaxError(`unclosed: "${node.type}"`));
    }
  }

  /**
   * Get the previous node from the state
   */

  get scope() {
    return this.scopes.current();
  }

  /**
   * Get the part of the input string has has already been parsed.
   * @return {String}
   * @api public
   */

  get parsed() {
    return this.lexer.consumed;
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

function define(obj, key, value) {
  Reflect.defineProperty(obj, key, {
    enumerable: false,
    configurable: true,
    writable: true,
    value: value
  });
}

function getter(key, parser) {
  Reflect.defineProperty(parser, key, {
    get: () => parser.lexer[key]
  });
}

function sync(key, parser) {
  Reflect.defineProperty(parser, key, {
    set: function(value) {
      parser.lexer[key] = value;
    },
    get: function() {
      return parser.lexer[key];
    }
  });
}

/**
 * Returns true if value is a function
 * @param {any} value
 * @return {Boolean}
 */

function isFunction(value) {
  return typeof value === 'function';
}

/**
 * Returns true if value is an object
 * @param {any} value
 * @return {Boolean}
 */

function isObject(val) {
  return val && typeof val === 'object' && !Array.isArray(val);
}

/**
 * Returns true if value is a RegExp
 * @param {any} value
 * @return {Boolean}
 */

function isRegex(val) {
  return val instanceof RegExp;
}

/**
 * Expose `Parser`
 * @type {Function}
 */

module.exports = Parser;
