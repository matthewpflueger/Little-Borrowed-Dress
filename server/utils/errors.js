'use strict';

module.exports = function $module() {
  if ($module.exports) {
    return $module.exports;
  }

  function makeError(err, message, status) {
    return {
      status: status || 500,
      message: message || err.message || err.toString(),
      cause: err.toString()
    };
  }

  $module.exports = {
    makeError: makeError
  };
  return $module.exports;
};