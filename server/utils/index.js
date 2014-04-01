'use strict';

module.exports = function $module() {
  if ($module.exports) {
    return $module.exports;
  }

  var number = require('./number')();
  var errors = require('./errors')();

  $module.exports = {
    number: number,
    errors: errors
  };

  return $module.exports;
};