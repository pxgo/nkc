const { FixedOperations } = require('../operations');

module.exports = {
  GET: FixedOperations.visitDOIHome,
  PARAMETER: {
    GET: FixedOperations.visitDOIContent,
  },
};
