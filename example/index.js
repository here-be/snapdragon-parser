'use strict';

const Lexer = require('snapdragon-lexer');
const position = require('snapdragon-position');
const show = require('snapdragon-show');

const Parser = require('./parser');
const Node = require('./node');
const inputs = [];

const parser = new Parser();
const lexer = new Lexer();
lexer.use(position());

lexer.on('position', function(tok) {
  // console.log(show(lexer, tok))
  console.log(lexer.input.slice(...tok.position.range))
  // console.log(tok.position.end)
});

// parser.on('block.open', function(node) {
//   console.log(node.nodes[0])
// });

parser.scopes.handler('bracket', function(node) {
  // console.log('BRACKET:', node.stringify())
  // if (!this.isInside('bracket')) {

  // }
});

parser.scopes.handler('mustache', function(node) {
  switch (node.match[1]) {
    case '#':
      this.scopes.push(node);
      break;
    case '/':
      this.scopes.pop();
      break;
    default: {
      this.scopes.current.push(node);
      break;
    }
  }
});

parser.scopes.handler('default', function(node) {
  // console.log('DEFAULT:', node.stringify())
  // if (!this.isInside('bracket')) {

  // }
});

// parser.expression.handler('each', function(node) {

// });

parser.on('error', err => {
  console.error(err);
  process.exit(1);
});

lexer
  .capture('bom', /^\ufeff/)
  .capture('escaped', /^\\([^\\])/)
  .capture('backslash', /^\\/)
  .capture('backtick', /^`/)

  // .capture('escapes', /^[\b\f\n\r\t\v\s\0'"\\]/)
  // .capture('unicode', /^\\u[a-fA-F0-9]{4}/)
  // .capture('unicodepoint', /^\\u\{([a-fA-F0-9]{1,})\}/)
  // .capture('hexidecimal', /^\\x[a-fA-F0-9]{2}/)
  // .capture('control', /^\\c[a-zA-Z]/)
  // .capture('backspace', /^[\b]/)
  .capture('formfeed', /^\f/)
  .capture('newline', /^\n/)
  // .capture('linebreak', /^\r\n?|\n|\u2028|\u2029/)
  // .capture('nonASCIIws', /^[\u1680\u180e\u2000-\u200a\u202f\u205f\u3000\ufeff]/)
  .capture('return', /^\r/)
  .capture('tab', /^\t/)
  .capture('vertical', /^\v/)
  .capture('null', /^\0/)

  // .capture('quote.double', /^"/)
  // .capture('quote.single', /^'/)
  // .capture('backtick', /^`/)
  .capture('equal', /^=/)
  .capture('colon', /^:/)
  .capture('comma', /^,/)
  .capture('dash', /^-/)
  .capture('dollar', /^\$/)
  .capture('dot', /^\./)
  .capture('pipe', /^\|/)
  .capture('plus', /^\+(?!\()/)
  .capture('qmark', /^\?(?!\()/)
  .capture('semicolon', /^;/)
  .capture('slash', /^\//)
  .capture('space', /^ /)
  .capture('star', /^\*(?!\()/)
  .capture('angle.open', /^\</)
  .capture('angle.close', /^\>/)
  .capture('mustache.open', /^\{{2,4}([#\/])?/)
  .capture('mustache.close', /^\}{2,4}/)
  .capture('brace.open', /^\{/)
  .capture('brace.close', /^\}/)
  .capture('bracket.open', /^(\[)([!^])?/, (tok) => {
    // if (tok.match[2]) {
    //   tok.prefix = tok.match[2];
    //   tok.val = tok.match[1];
    // }
    return tok;
  })
  .capture('bracket.close', /^\]/)
  .capture('paren.open', /^([*+!?@])?\(/)
  .capture('paren.close', /^\)/)
  .capture('text', /^[\w#@!?^"'`]+/)
  // .capture('text', /^(?!\\)[^\s{[()\]}]+?(?=[\s\\{[()\]}]|$)/)
  .on('lexed', tok => {
    const parent = parser.state.current();
    const node = new Node(tok);
    parent.push(node);

    if (parser.isBlock(node)) {
      parser.push(node);

    } else if (parser.isBlockClose(node)) {
      parser.pop(parent);

    }
  });

// lexer.on('push', tok => {
//   // console.log(tok.position.show())
// });
// scope.on('push', node => {
//   // console.log(node)
// });

// state.on('push', node => {
//   console.log(node.toObject())

//   console.log(state.current());
//   console.log(node);
//   console.log(state.last());
//   console.log('----------------------------')
//   console.log();
//   tokens.push(node);
// });

// state.on('pop', node => {
//   // console.log('NODE:', node.isInside('bracket'));
//   // console.log('STATE:', state.isInside(''));
//   // console.log('SCOPE:', scope.isInside(''));
//   // console.log();
// });

// let str = 'a[^-{}()<>[a[bbb]foo]]z';
// let str = 'foo \\{{a,b\\}} bar';
// let str = '-a(b|g|(a|b))!(c|{a,b,c})[*(d)[^\\n][@(e)]|(a|b)](z|x|y)foo';
// var str = '{{#bar}}!{{foo}}{{/bar}}'
// let str = 'a[@(e)|(a|b)][^\\n]z';
let str = 'a[(b|c)]({1..10}x|y)[^\\n]z';
// let str = 'a[[a-z][{a,b,{c,d}}]]';
// let str = '-a(b|g)';
// let str = `
// function arrayify(arr) {
//   return Array.isArray(arr) ? arr : [arr];
// }
// `;
inputs.push(lexer.tokenize(str));

let scope = parser.scopes.current();
if (scope.node.type !== 'root') {
  throw new Error('unclosed: ' + scope.node.type);
}

// inputs.push(lexer.tokenize('foo'));
// inputs.push(lexer.tokenize('bar'));
// inputs.push(lexer.tokenize('baz'));
// console.log(parser.ast.toObject());
// console.log(parser.ast.stringify(n => n.match ? n.match[0] : ''));
// console.log(parser.ast.stringify() === str);
// console.log(parser.ast.stringify());



// console.log(lexer.tokenize(`var foo = "bar";`));
