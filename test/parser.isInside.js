// 'use strict';

// require('mocha');
// var assert = require('assert');
// var Lexer = require('snapdragon-lexer');
// var Parser = require('..');
// var parser;
// var lexer;

// describe.only('parser.isInside', function() {
//   beforeEach(function() {
//     parser = new Parser();
//   });

//   it('should add unparsed original string to parser.string', function() {
//     const brace = parser.node({type: 'brace'});
//     brace.push(parser.node({type: 'brace.open'}));
//     parser.stash(brace);

//     parser.stash(parser.node({type: 'text'}));
//     parser.stash(parser.node({type: 'text'}));
//     parser.stash(parser.node({type: 'brace.close'}));
//     // console.log(parser.state)

//     // const bracket = parser.node({type: 'bracket'});
//     // bracket.push(parser.node({type: 'bracket.open'}));
//     // bracket.push(brace);
//     // bracket.push(parser.node({type: 'bracket.close'}));
//     // parser.push(bracket);

//     // const paren = parser.node({type: 'paren', closed: true});
//     // paren.push(parser.node({type: 'paren.open'}));
//     // paren.push(bracket);
//     // paren.push(parser.node({type: 'paren.close'}));
//     // parser.push(paren);

//     // // assert(parser.isInside('brace'));
//     // assert(parser.isInside('bracket'));
//     // assert(parser.isInside('paren'));
//     // assert(!parser.isInside('foo'));

//   });
// });
