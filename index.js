'use strict';

const assert = require('assert');
const Emitter = require('events');
const Lexer = require('snapdragon-lexer');
const Node = require('snapdragon-node');

/**
 * Create a new `Parser` with the given `input` and `options`.
 *
 * ```js
 * const Parser = require('snapdragon-parser');
 * const parser = new Parser();
 * ```
 * @name Parser
 * @param {String} `input`
 * @param {Object} `options`
 * @api public
 */

class Parser extends Emitter {
  constructor(input, options = {}) {
    super();
    if (typeof input !== 'string') {
      options = input || {};
      input = '';
    }

    this.options = Object.assign({ type: 'root' }, options);
    this.sep = this.options.sep || '.';
    this.node = this.node.bind(this);
    this.types = new Set();
    this.handlers = new Map();

    if (options.handlers) {
      for (const [type, handler] of options.handlers) {
        this.handler(type, handler);
      }
    }

    this.lexer = new Lexer(options);
    this.init(input);
  }

  /**
   * Initialize parser properties
   */

  init(input) {
    this.lexer.state = new Lexer.State(input, this.options);
    this.bos = this.node({ type: 'bos', value: '' });
    this.eos = this.node({ type: 'eos', value: '' });
    this.ast = this.node({ type: this.options.type, nodes: [] });
    this.stack = [this.ast];
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

  node(node, value = '') {
    assert(node, 'expected a string or object');

    if (typeof node === 'string') {
      return this.node({ type: node, value });
    }

    if (!this.isNode(node)) {
      node = new Node(node);
    }

    if (Array.isArray(node.nodes) && node.nodes.length) {
      node.nodes = node.nodes.map(this.node.bind(this));
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
    return Node.isNode(node);
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

  set(type, handler = tok => tok) {
    assert.equal(typeof type, 'string', 'expected a string');

    this.types.add(type);

    // can't do fat arrow, we need to ensure that the
    // handler context is always correct (in case
    // handlers are called directly, or re-registered
    // on a new instance, etc.)
    let parser = this;
    this.handlers.set(type, function(...args) {
      let ctx = this || parser;
      let node = handler.call(ctx, ...args);
      if (isObject(node)) node = ctx.node(node);
      if (!ctx.isNode(node)) return;
      if (!node.type) node.type = type;
      ctx.emit('handled', node);
      ctx.emit(node.type, node);
      return node;
    });
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
    let handler = this.handlers.get(type) || this.handlers.get('default');
    assert.equal(typeof handler, 'function', `expected handler "${type}" to be a function`);
    return handler;
  }

  /**
   * Returns true if the parser has a registered handler of the given `type`.
   *
   * ```js
   * parser.set('star', function() {});
   * console.log(parser.has('star')); // true
   * ```
   * @name .has
   * @param {String} type
   * @return {Boolean}
   * @api public
   */

  has(type) {
    return this.handlers.has(type);
  }

  /**
   * Get the previously/last lexed token.
   */

  last() {
    return this.lexer.lookbehind(1);
  }

  /**
   * Get the last node from the stack
   */

  prev() {
    return this.stack[this.stack.length - 1];
  }

  /**
   * Get the last child node of the current node on the stack
   */

  lastChild() {
    let last = this.prev();
    while (last && last.nodes && last.nodes.length) {
      last = last.nodes[last.nodes.length - 1];
    }
    return last;
  }

  /**
   * Look ahead to the next lexer token.
   */

  peek() {
    return this.lexer.lookahead(1);
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
      lexerFn = void 0;
    }

    this.lexer.capture(type, regex, lexerFn);
    return this.set(type, parserFn);
  }

  /**
   * Returns true if the parser is currently "inside" a node of the given `type`.
   *
   * @name .isInside
   * @param {String} `type`
   * @return {Boolean}
   * @api public
   */

  isInside(types) {
    if (!types) return this.stack.length > 1;
    types = [].concat(types);
    for (let i = this.stack.length - 1; i > 0; i--) {
      if (types.includes(this.stack[i].type)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Returns true if `node` is a "block" node. Block nodes have a
   * `nodes` array for keeping child nodes.
   *
   * ```js
   * parser.isBlock(new Node()); //=> false
   * parser.isBlock(new Node({ nodes: [] })); //=> true
   * ```
   * @name .isBlock
   * @param {Object} `node`
   * @return {Boolean}
   * @api public
   */

  isBlock(node) {
    return Array.isArray(node.nodes);
  }

  /**
   * Returns true if `node` is a new "block" node, with either no child nodes,
   * or only an open node.
   *
   * ```js
   * parser.isBlock(new Node()); //=> false
   * parser.isBlock(new Node({ nodes: [] })); //=> true
   * ```
   * @name .isBlock
   * @param {Object} `node`
   * @return {Boolean}
   * @api public
   */

  isNewBlock(node) {
    return this.isBlock(node) && (!node.nodes[0] || this.isOpen(node.nodes[0], node));
  }

  /**
   * Returns true if the given `node` is an "open" node.
   *
   * @name .isOpen
   * @param {Object} `node`
   * @return {Object} `parentNode`
   * @api public
   */

  isOpen(node, parent = this.prev()) {
    if (typeof this.options.isOpen === 'function') {
      return this.options.isOpen.call(this, node, parent);
    }
    if (typeof parent.isOpen === 'function') {
      return parent.isOpen(node);
    }
    let segs = node.type.split(this.sep);
    if (segs[0] === parent.type) {
      return segs[1] === 'open';
    }
    return false;
  }

  /**
   * Returns true if the given `node` is a "close" node.
   *
   * @name .isClose
   * @param {Object} `node`
   * @return {Object} `parentNode`
   * @api public
   */

  isClose(node, parent = this.prev()) {
    if (typeof this.options.isClose === 'function') {
      return this.options.isClose.call(this, node, parent);
    }
    if (typeof parent.isClose === 'function') {
      return parent.isClose(node);
    }
    let segs = node.type.split(this.sep);
    if (segs[0] === parent.type) {
      return segs[1] === 'close';
    }
    return false;
  }

  /**
   * Push a child node onto the `node.nodes` array of the current node
   * on the `stack`.
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
    if (isObject(node) && !this.isNode(node)) {
      node = this.node(node);
    }

    this.emit('push', node);
    // get previous node added to the stack
    let parent = this.prev();

    // allow users to do this with custom code in handlers
    if (node.handleBlock !== false) {
      if (this.isNewBlock(node)) {
        // if this is a new block node, push it onto the stack
        this.stack.push(node);

      } else if (this.isBlock(parent) && this.isClose(node, parent)) {
        // otherwise if this is a closing node and the parent node is
        // a block node, call .pop to pop the parent node from the stack
        this.pop(node);
      }
    }

    if (!parent.nodes.includes(node)) {
      parent.push(node);
    }
    return node;
  }

  /**
   * Pop the last node from the `stack`. If a
   *
   * ```js
   * parser.set('default', function(tok) {
   *   return this.push(this.node(tok));
   * });
   * ```
   * @name .pop
   * @emits pop
   * @param {Object} `node` (optional)
   * @return {Object} `node`
   * @api public
   */

  pop(closingNode) {
    let parent = this.stack.pop();
    assert(Node.isNode(parent), 'expected node to be an instance of Node');
    assert(Array.isArray(parent.nodes), 'expected node.nodes to be an array');

    this.emit('pop', parent, closingNode);

    // if a closing node is passed, throw if it's not valid
    if (!this.isClose(closingNode, parent)) {
      this.error(`expected "${parent.type}.close", received: "${closingNode.type}"`);
    }

    return parent;
  }

  /**
   * Get the next token from the lexer, then calls the registered
   * parser handler for `token.type` on the token.
   *
   * @name .next
   * @return {Any} Returns whatever value the handler returns.
   * @api public
   */

  next() {
    let token = this.lexer.next();
    let handler;

    if (!token) return;
    this.lexer.push(token);

    try {
      handler = this.get(token.type);
      return handler.call(this, token);
    } catch (err) {
      err.name = 'ParserError';
      this.error(err);
    }
  }

  /**
   * Expect the given `type`, or throw an exception.
   *
   * @param {String} `type`
   * @api public
   */

  expect(type) {
    let next = this.peek();
    assert(next.type === type, `expected "${type}", but received "${next.type}"`);
    return this.next();
  }

  /**
   * Accept the given `type`.
   *
   * @param {String} type
   * @api public
   */

  accept(type) {
    let node = this.peek();
    if (node.type === type) {
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
    let bos = this.handlers.get('bos');
    let eos = this.handlers.get('eos');

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

  create(options, parent = this) {
    let parser = new parent.constructor(options);
    parser.lexer.handlers = parent.lexer.handlers;
    parser.lexer.types = parent.lexer.types;
    parser.handlers = parent.handlers;
    parser.types = parent.types;
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
   * @param {String} `name`
   * @return {Boolean}
   * @api public
   */

  hasListeners(name) {
    if (typeof super.hasListeners === 'function') {
      return super.hasListeners(name);
    }
    return this.listenerCount(name) > 0;
  }

  /**
   * Call a plugin function on the parser instance.
   *
   * ```js
   * const myParser = new Parser();
   * const plugin = parser => {
   *   // do stuff to parser instance
   * };
   * myParser.use(plugin);
   * ```
   * @param {Function} `fn`
   * @return {Parser} Returns the Parser instance.
   * @api public
   */

  use(fn) {
    fn.call(this, this);
    return this;
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
   * @return {Undefined}
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
    let node = this.stack.pop();
    if (this.options.ignoreSyntaxErrors !== true && node.type !== 'root') {
      this.error(new SyntaxError(`unclosed: "${node.type}"`));
    }
  }

  get tokens() {
    return this.lexer.state.tokens;
  }

  set current(value) {
    this.lexer.state.current = value;
  }
  get current() {
    return this.lexer.state.current;
  }

  set string(value) {
    this.lexer.state.string = value;
  }
  get string() {
    return this.lexer.state.string;
  }

  set input(value) {
    this.lexer.state.input = value;
  }
  get input() {
    return this.lexer.state.input;
  }

  /**
   * Get the part of the input string has has already been parsed.
   * @return {String}
   * @api public
   */

  get parsed() {
    return this.lexer.state.consumed;
  }
  get consumed() {
    return this.parsed;
  }

  static get Node() {
    return Node;
  }

  /**
   * Returns true if the given value is an instance of snapdragon `Parser`.
   *
   * ```js
   * const Parser = require('parser');
   * const parser = new Parser();
   * console.log(Parser.isParser(parser)); //=> true
   * console.log(Parser.isParser({})); //=> false
   * ```
   * @param {Object} `parser`
   * @returns {Boolean}
   * @api public
   */

  static isParser(parser) {
    return isObject(parser) && parser instanceof Parser;
  }
}

/**
 * Returns true if value is an object
 * @param {Any} value
 * @return {Boolean}
 */

function isObject(val) {
  return val && typeof val === 'object' && !Array.isArray(val);
}

/**
 * Returns true if value is a RegExp
 * @param {Any} value
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
