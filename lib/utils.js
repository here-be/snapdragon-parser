'use strict';

exports.typeEndsWith = function(node, substring) {
  const len = substring.length;
  if (node && node.type.length > len + 1) {
    return node.type.slice(-len) === substring;
  }
  return false;
};

exports.type = function(node) {
  return node.type.replace(/\.(open|close)$/, '');
};
