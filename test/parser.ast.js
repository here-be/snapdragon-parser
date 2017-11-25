// 'use strict';

// require('mocha');
// var assert = require('assert');
// var Lexer = require('snapdragon-lexer');
// var Parser = require('..');
// var parser;
// var lexer;

// describe('parser.ast', function() {
//   beforeEach(function() {
//     lexer = new Lexer();
//     parser = new Parser(lexer);
//   });

//   describe('bos', function() {
//     it('should set a beginning-of-string node', function() {
//       parser.capture('all', /^.*/, function(tok) {
//         return this.node(tok);
//       });

//       var ast = parser.parse('a/b');
//       assert.equal(ast.nodes[0].type, 'bos');
//     });
//   });

//   describe('eos', function() {
//     it('should set an end-of-string node', function() {
//       parser.capture('all', /^.*/, function(tok) {
//         return this.node(tok);
//       });

//       var ast = parser.parse('a/b');
//       assert.equal(ast.nodes[ast.nodes.length - 1].type, 'eos');
//     });
//   });

//   describe('source string', function() {
//     it('should set original unparsed string on parser.string', function() {
//       parser.capture('all', /^.*/, function(tok) {
//         return this.node(tok);
//       });

//       parser.parse('a/b');
//       assert.equal(parser.string, 'a/b');
//     });
//   });

//   describe('nodes', function() {
//     it('should push nodes onto ast.nodes', function() {
//       parser.capture('all', /^.*/, function(tok) {
//         return this.node(tok);
//       });

//       parser.parse('a/b');
//       assert.equal(parser.ast.nodes.length, 3);
//     });
//   });

//   describe('methods', function() {
//     beforeEach(function() {
//       parser.capture('all', /^.*/, function(tok) {
//         return this.node(tok);
//       });

//       parser.parse('a/b');
//     });

//     it('should return true if "node" is the given "type"', function() {
//       assert(parser.ast.isType('root'));
//       assert(parser.ast.nodes[0].isType('bos'));
//     });

//     it('should return true if "node" has the given "type"', function() {
//       assert(parser.ast.hasType('bos'));
//       assert(parser.ast.hasType('eos'));
//     });

//     it('should get the first node in node.nodes', function() {
//       assert(parser.ast.first);
//       assert(parser.ast.first.isType('bos'));
//     });

//     it('should get the last node in node.nodes', function() {
//       assert(parser.ast.last);
//       assert(parser.ast.last.isType('eos'));
//     });

//     it('should get the next node in an array of nodes', function() {
//       assert.equal(parser.ast.nodes[0].next.type, 'all');
//     });
//   });
// });