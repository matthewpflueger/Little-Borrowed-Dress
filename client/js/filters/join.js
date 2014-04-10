'use strict';

module.exports = function $module() {
  if ($module.exports) {
    return $module.exports;
  }

  function join($log) {
    return function(array, by) {
      if (typeof array.join === 'function') {
        return array.join(by);
      }
      $log.warn('Object %O does not have a join funciton', array);
      return array;
    };
  }

  join.$inject = ['$log'];
  $module.exports = join;
  return $module.exports;
};