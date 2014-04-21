'use strict';

module.exports = function $module() {
  if ($module.exports) {
    return $module.exports;
  }

  function makeDollar(dollarString) {
    var num = makeNumber(dollarString);
    if (!/\./.test(dollarString)) {
      return num * 100;
    }
    return num;
  }

  function makeNumber(numberString) {
    numberString = numberString || '0';
    var num = parseInt(numberString.split(/\D/).join(''));
    if (isNaN(num)) {
      return 0;
    } else {
      return num;
    }
  }

  $module.exports = {
    makeDollar: makeDollar,
    makeNumber: makeNumber
  };
  return $module.exports;
};