'use strict';

module.exports = function $module(mongoose, Address, OrderItem) {
  if ($module.exports) {
    return $module.exports;
  }

  mongoose = mongoose || require('mongoose');
  Address = Address || require('./address');
  OrderItem = OrderItem || require('./orderitem');

  var OrderSchema = new mongoose.Schema({
    orderNumber: {
      type: Number,
      required: true,
      unique: true
    },
    purchasedOn: {
      type: Date,
      required: true
    },
    shipTo: {
      type: [Address.schema],
      required: true
    },
    weddingDate: Date,
    bride: {
      type: String,
      trim: true
    },
    orderitems: {
      type: [OrderItem.schema],
      required: true,
      validate: [function(v) { return v.length > 0; }, 'An order item is required']
    }
  }, {
    _id : false
  });

  var Order = mongoose.model('Order', OrderSchema);
  $module.exports = Order;
  return Order;
};
