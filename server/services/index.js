'use strict';

module.exports = function $module() {
  if ($module.exports) {
    return $module.exports;
  }

  require('./models')();
  require('./customer')();

  // require('./inventory');

  $module.exports = {};
  return {};
};