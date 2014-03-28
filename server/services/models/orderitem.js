'use strict';

module.exports = function $module(mongoose) {
  if ($module.exports) {
    return $module.exports;
  }

  mongoose = mongoose || require('mongoose');

  var OrderItemSchema = new mongoose.Schema({
    style: {
      type: String,
      trim: true,
      lowercase: true,
      required: true
    },
    size: {
      type: [String]
      //not required like inventory because order data is missing it in some cases
      // required: true
      // validate: [function (value) { return value.length > 0; }, "Missing order items"]
    },
    color: {
      type: String,
      trim: true,
      lowercase: true,
      required: true
    },
    backup: {
      type: Boolean,
      default: false,
      required: true
    }
  }, {
    _id : false
  });

  var OrderItem = mongoose.model('OrderItem', OrderItemSchema);
  $module.exports = OrderItem;
  return OrderItem;
};
