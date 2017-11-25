module.exports = {
  options: {
    Error: Error,
    stack: true
  },
  LEXER: {
    UNSAFE_REGEX: {
      message: 'Regex should not return an empty match: "%s"'
    },
    NO_HANDLER: {
      message: 'Expected handler to be a function, "%s" is not registered.'
    },
    NO_HANDLERS: {
      message: 'Expected handler to be a function, "%s" is not registered.'
    },
    UNMATCHED_INPUT: {
      message: 'Could not find a lexer handler to match: "%s"'
    },
    NO_MATCH: {
      message: 'Could not find a lexer handler to match: "%s"'
    }
  },
  PARSER: {
    NO_HANDLER: {
      message: 'Expected handler to be a function, "%s" is not registered.'
    },
    NO_HANDLERS: {
      message: 'No parser handlers are registered. Handlers must be registered before calling parse.'
    },
    INVALID_INPUT: {
      message: 'Expected input to be a string, but received: "%o"'
    },
    INVALID_NODE: {
      message: 'Expected node to be an instance of Node, but received: "%o"'
    },
    INVALID_NODE_LENGTH: {
      message: 'Nodes should be pushed onto "node.nodes" using "node.push()"'
    },
    MISSING_OPEN: {
      message: 'Missing opening expression for: "%o"'
    },
    MISSING_CLOSE: {
      message: 'Missing closing expression for: "%o"'
    }
  },
  COMPILER: {

  }
};
