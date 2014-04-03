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

  function OrderItemImported(status, message, customer, order, orderitem, options) {
    options = options || {};
    this.routingKey = options.routingKey || OrderItemImported.routingKey;
    this.status = status;
    this.message = message;
    this.customer = customer.toJSON();
    this.order = order.toJSON();
    this.orderitem = orderitem.toJSON();
  }
  OrderItemImported.routingKey = 'events.orderitem.import';

  $module.exports = {
    ImportOrderItem: ImportOrderItem,
    OrderItemImported: OrderItemImported
  };

  return $module.exports;
};
