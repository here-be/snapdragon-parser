'use strict';

// const Node = require('snapdragon-node');
const Parser = require('../..');
const parser = new Parser()
const lexer = parser.lexer
  .set('text', function() {
    var match = this.match(/^[a-z]+/);
    if (match) {
      return this.token('text', match);
    }
  })
  .set('slash', function() {
    var match = this.match(/^\//);
    if (match) {
      return this.token('slash', match);
    }
  })
  .set('star', function() {
    var match = this.match(/^\*/);
    if (match) {
      return this.token('star', match);
    }
  })

// const ast = parser.parse('a/*/c');
console.log(lexer.tokenize('a/*/c'));
