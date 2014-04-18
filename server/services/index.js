'use strict';

module.exports = function $module() {
  if ($module.exports) {
    return $module.exports;
  }

  require('./models')();
  require('./inventory')();
  require('./customer')();

  $module.exports = {};
  return {};
};