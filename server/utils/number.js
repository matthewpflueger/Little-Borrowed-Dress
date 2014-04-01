'use strict';

module.exports = function $module() {
  if ($module.exports) {
    return $module.exports;
  }

  function makeNumber(numberString) {
    numberString = numberString || 0;
    var num = parseInt(numberString.split(/\D/).join(''));
    if (isNaN(num)) {
      return 0;
    } else {
      return num;
    }
  }

  $module.exports = {
    makeNumber: makeNumber
  };
  return $module.exports;
};