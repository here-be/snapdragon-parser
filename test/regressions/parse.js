'use strict';

const Parser = require('../..');
const parser = new Parser()
// const lexer = parser.lexer
  .set('text', function() {
    let match = this.match(/^[a-z]+/);
    if (match) {
      return this.token('text', match);
    }
  })
  .set('slash', function() {
    let match = this.match(/^\//);
    if (match) {
      return this.token('slash', match);
    }
  })
  .set('star', function() {
    let match = this.match(/^\*/);
    if (match) {
      return this.token('star', match);
    }
  });

// const ast = parser.parse('a/*/c');
console.log(parser.lexer.tokenize('a/*/c'));
