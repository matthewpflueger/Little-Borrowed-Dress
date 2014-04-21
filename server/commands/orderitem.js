'use strict';

module.exports = function $module() {
  if ($module.exports) {
    return $module.exports;
  }

  function ImportOrderItems(data, user, options) {
    options = options || {};
    this.routingKey = options.routingKey || ImportOrderItems.routingKey;
    this.data = data;
    this.user = user;
  }
  ImportOrderItems.routingKey = 'commands.orderitems.import';

  function OrderItemsImported(status, message, customer, order, orderitems, user, options) {
    options = options || {};
    this.routingKey = options.routingKey || OrderItemsImported.routingKey;
    this.status = status;
    this.message = message;
    this.customer = customer; //.toJSON();
    this.order = order; //.toJSON();
    this.orderitems = orderitems;
    this.user = user;
  }
  OrderItemsImported.routingKey = 'events.orderitems.import';

  $module.exports = {
    ImportOrderItems: ImportOrderItems,
    OrderItemsImported: OrderItemsImported
  };

  return $module.exports;
};
