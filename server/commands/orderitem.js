'use strict';

module.exports = function $module() {
  if ($module.exports) {
    return $module.exports;
  }

  function ImportOrderItem(data, options) {
    options = options || {};
    this.routingKey = options.routingKey || ImportOrderItem.routingKey;
    this.data = data;
  }
  ImportOrderItem.routingKey = 'commands.orderitem.import';

  function ImportOrderItemResponse(status, message, customer) {
    this.status = status;
    this.message = message;
    this.customer = customer.toJSON();
  }

  $module.exports = {
    ImportOrderItem: ImportOrderItem,
    ImportOrderItemResponse: ImportOrderItemResponse
  };

  return $module.exports;
};
