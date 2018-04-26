'use strict';

const Scope = require('./scope');
const State = require('./state');

/**
 * Create an instance of `Scopes` with the `Stack` constructor
 * to use for creating the scope stack.
 *
 * @param {Class} `Stack`
 * @return {Object} Returns an instance of `Scopes`
 * @api public
 * @class
 */

module.exports = class Scopes extends State {};

// module.exports = class Scopes extends State {
//   push(node) {
//     return super.push(new Scope(node));
//   }
// };
