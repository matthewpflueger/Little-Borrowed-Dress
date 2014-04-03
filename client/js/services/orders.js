'use strict';

module.exports = function() {

  function Orders($resource) {
    return $resource('orders/:orderId', {
      orderId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
  Orders.$inject = ['$resource'];

  return Orders;
};
