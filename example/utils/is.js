
exports.assignmentOperators = ['=', '*=', '**=', '/=', '%=', '+=', '-=', '<<=', '>>=', '>>>=', '&=', '^=', '|='];

exports.isAssignmentOperator = function(val) {
  return exports.assignmentOperators.indexOf(val) !== -1;
};
