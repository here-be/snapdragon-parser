# snapdragon-parser [![NPM version](https://img.shields.io/npm/v/snapdragon-parser.svg?style=flat)](https://www.npmjs.com/package/snapdragon-parser) [![NPM monthly downloads](https://img.shields.io/npm/dm/snapdragon-parser.svg?style=flat)](https://npmjs.org/package/snapdragon-parser) [![NPM total downloads](https://img.shields.io/npm/dt/snapdragon-parser.svg?style=flat)](https://npmjs.org/package/snapdragon-parser) [![Linux Build Status](https://img.shields.io/travis/here-be/snapdragon-parser.svg?style=flat&label=Travis)](https://travis-ci.org/here-be/snapdragon-parser)

> Easily parse a string to create an AST.

Please consider following this project's author, [Jon Schlinkert](https://github.com/jonschlinkert), and consider starring the project to show your :heart: and support.

## Table of Contents

<details>
<summary><strong>Details</strong></summary>

- [Install](#install)
- [Usage](#usage)
- [About](#about)

</details>

## Install

Install with [npm](https://www.npmjs.com/):

```sh
$ npm install --save snapdragon-parser
```

## Usage

### [Parser](index.js#L21)

Create a new `Parser` with the given `input` and `options`.

**Params**

* `input` **{String}**
* `options` **{Object}**

**Example**

```js
const Parser = require('snapdragon-parser');
const parser = new Parser();
```

### [.node](index.js#L72)

Create a new [Node](#node) with the given `value` and `type`.

**Params**

* `node` **{Object}**: The object to use to create a node
* `returns` **{Object}**: returns the created [Node](#node) instance.

**Example**

```js
const node = parser.node({type: 'slash', value: '/'});
// sugar for
const Node = require('snapdragon-node');
const node = Node({type: 'slash', value: '/'});
```

### [.isNode](index.js#L100)

Returns true if the given value is an instance of [snapdragon-node](https://github.com/jonschlinkert/snapdragon-node).

**Params**

* `node` **{Object}**
* `returns` **{Boolean}**

### [.set](index.js#L119)

Register handler of the given `type`.

**Params**

* `type` **{String}**
* `handler` **{Function}**

**Example**

```js
parser.set('all', function(tok) {
  // do stuff to tok
  return tok;
});
```

### [.get](index.js#L157)

Get a registered handler function.

**Params**

* `type` **{String}**
* `fn` **{Function}**: The handler function to register.

**Example**

```js
handlers.set('star', function() {
  // do parser, lexer, or compiler stuff
});
const star = handlers.get('star');
```

### [.has](index.js#L176)

Returns true if the parser has a registered handler of the given `type`.

**Params**

* **{String}**: type
* `returns` **{Boolean}**

**Example**

```js
parser.set('star', function() {});
console.log(parser.has('star')); // true
```

### [.capture](index.js#L228)

Capture a node of the given `type`.

**Params**

* `type` **{String}**: (required)
* `regex` **{RegExp}**: (optional)
* `lexerFn` **{Function}**: (optional)
* `parserFn` **{Function}**: (optional)
* `returns` **{Object}**: Returns the Parser instance for chaining.

### [.isInside](index.js#L251)

Returns true if the parser is currently "inside" a node of the given `type`.

**Params**

* `type` **{String}**
* `returns` **{Boolean}**

### [.isBlock](index.js#L276)

Returns true if `node` is a "block" node. Block nodes have a `nodes` array for keeping child nodes.

**Params**

* `node` **{Object}**
* `returns` **{Boolean}**

**Example**

```js
parser.isBlock(new Node()); //=> false
parser.isBlock(new Node({ nodes: [] })); //=> true
```

### [.isBlock](index.js#L294)

Returns true if `node` is a new "block" node, with either no child nodes, or only an open node.

**Params**

* `node` **{Object}**
* `returns` **{Boolean}**

**Example**

```js
parser.isBlock(new Node()); //=> false
parser.isBlock(new Node({ nodes: [] })); //=> true
```

### [.isOpen](index.js#L307)

Returns true if the given `node` is an "open" node.

**Params**

* `node` **{Object}**
* `returns` **{Object}** `parentNode`

### [.isClose](index.js#L330)

Returns true if the given `node` is a "close" node.

**Params**

* `node` **{Object}**
* `returns` **{Object}** `parentNode`

### [.push](index.js#L360)

Push a child node onto the `node.nodes` array of the current node on the `stack`.

**Params**

* `node` **{Object}**: (required)
* `returns` **{Object}** `node`

**Events**

* `emits`: push

**Example**

```js
parser.set('default', function(tok) {
  return this.push(this.node(tok));
});
```

### [.pop](index.js#L404)

Pop the last node from the `stack`. If a

**Params**

* `node` **{Object}**: (optional)
* `returns` **{Object}** `node`

**Events**

* `emits`: pop

**Example**

```js
parser.set('default', function(tok) {
  return this.push(this.node(tok));
});
```

### [.next](index.js#L428)

Get the next token from the lexer, then calls the registered
parser handler for `token.type` on the token.

* `returns` **{Any}**: Returns whatever value the handler returns.

Expect the given `type`, or throw an exception.

**Params**

* `type` **{String}**

Accept the given `type`.

**Params**

* **{String}**: type

### [.parse](index.js#L483)

Parses the given `input` string and returns an AST object.

**Params**

* `input` **{String}**
* `returns` **{Object}**: Returns an AST (abstract syntax tree).

**Example**

```js
const ast = parser.parse('foo/bar');
```

Creates a new Parser instance with the given options, and copy
the handlers from the current instance to the new instance.

**Params**

* `options` **{Object}**
* `parent` **{Object}**: Optionally pass a different parser instance to copy handlers from.
* `returns` **{Object}**: Returns a new Parser instance

Concat nodes from another AST to `node.nodes`.

**Params**

* `node` **{Object}**
* `ast` **{Object}**
* `returns` **{Object}**

### [.hasListeners](index.js#L545)

Returns true if listeners are registered for even `name`.

**Params**

* `name` **{String}**
* `returns` **{Boolean}**

**Params**

* `fn` **{Function}**
* `returns` **{Parser}**: Returns the Parser instance.

**Example**

```js
const myParser = new Parser();
const plugin = parser => {
  // do stuff to parser instance
};
myParser.use(plugin);
```

### [.error](index.js#L589)

Throw a formatted error message with details including the cursor position.

**Params**

* `msg` **{String}**: Message to use in the Error.
* `node` **{Object}**
* `returns` **{Undefined}**

**Example**

```js
parser.set('foo', function(tok) {
  if (tok.value !== 'foo') {
    throw this.error('expected token.value to be "foo"', tok);
  }
});
```

Get the part of the input string has has already been parsed.

* `returns` **{String}**

**Params**

* `parser` **{Object}**
* `returns` **{Boolean}**

**Example**

```js
const Parser = require('parser');
const parser = new Parser();
console.log(Parser.isParser(parser)); //=> true
console.log(Parser.isParser({})); //=> false
```

## About

<details>
<summary><strong>Contributing</strong></summary>

Pull requests and stars are always welcome. For bugs and feature requests, [please create an issue](../../issues/new).

Please read the [contributing guide](.github/contributing.md) for advice on opening issues, pull requests, and coding standards.

</details>

<details>
<summary><strong>Running Tests</strong></summary>

Running and reviewing unit tests is a great way to get familiarized with a library and its API. You can install dependencies and run tests with the following command:

```sh
$ npm install && npm test
```

</details>

<details>
<summary><strong>Building docs</strong></summary>

_(This project's readme.md is generated by [verb](https://github.com/verbose/verb-generate-readme), please don't edit the readme directly. Any changes to the readme must be made in the [.verb.md](.verb.md) readme template.)_

To generate the readme, run the following command:

```sh
$ npm install -g verbose/verb#dev verb-generate-readme && verb
```

</details>

### Related projects

You might also be interested in these projects:

* [snapdragon-lexer](https://www.npmjs.com/package/snapdragon-lexer): Converts a string into an array of tokens, with useful methods for looking ahead and… [more](https://github.com/here-be/snapdragon-lexer) | [homepage](https://github.com/here-be/snapdragon-lexer "Converts a string into an array of tokens, with useful methods for looking ahead and behind, capturing, matching, et cetera.")
* [snapdragon-node](https://www.npmjs.com/package/snapdragon-node): Snapdragon utility for creating a new AST node in custom code, such as plugins. | [homepage](https://github.com/jonschlinkert/snapdragon-node "Snapdragon utility for creating a new AST node in custom code, such as plugins.")
* [snapdragon-position](https://www.npmjs.com/package/snapdragon-position): Snapdragon util and plugin for patching the position on an AST node. | [homepage](https://github.com/here-be/snapdragon-position "Snapdragon util and plugin for patching the position on an AST node.")
* [snapdragon-token](https://www.npmjs.com/package/snapdragon-token): Create a snapdragon token. Used by the snapdragon lexer, but can also be used by… [more](https://github.com/here-be/snapdragon-token) | [homepage](https://github.com/here-be/snapdragon-token "Create a snapdragon token. Used by the snapdragon lexer, but can also be used by plugins.")

### Author

**Jon Schlinkert**

* [GitHub Profile](https://github.com/jonschlinkert)
* [Twitter Profile](https://twitter.com/jonschlinkert)
* [LinkedIn Profile](https://linkedin.com/in/jonschlinkert)

### License

Copyright © 2018, [Jon Schlinkert](https://github.com/jonschlinkert).
Released under the [MIT License](LICENSE).

***

_This file was generated by [verb-generate-readme](https://github.com/verbose/verb-generate-readme), v0.8.0, on November 24, 2018._