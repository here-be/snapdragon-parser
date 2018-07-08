console.time('total');
const Parser = require('./');
const parser = new Parser();

// parser.capture('slash', /^\//, function(tok) {
//   return this.node(tok);
// });

// parser.capture('text', /^\w+/, function(tok) {
//   return this.node(tok);
// });

// parser.parse('a/b');
// console.log(parser.ast);
console.timeEnd('total');
