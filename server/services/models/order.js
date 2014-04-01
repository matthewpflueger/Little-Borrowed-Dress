'use strict';

module.exports = function $module(mongoose, utils, Address, OrderItem) {
  if ($module.exports) {
    return $module.exports;
  }

  mongoose = mongoose || require('mongoose');
  utils = utils || require('../../utils')();
  Address = Address || require('./address')();
  OrderItem = OrderItem || require('./orderitem')();

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
      required: true
    }
  }, {
    _id : false
  });

  OrderSchema.methods.import = function(rec) {
    this.orderNumber = utils.number.makeNumber(rec.ORDER);
    this.purchasedOn = new Date(rec['PURCHASED ON']);
    //TODO flag orders with a date greater than 6 months in advance
    this.weddingDate = new Date(rec['WEDDING DATE']);

    if (rec.BRIDE && !/^n\/?a$/i.test(rec.BRIDE.trim())) {
      this.bride = rec.BRIDE;
    }

    var shipTo = this.shipTo.create({});
    this.shipTo.push(shipTo);
    shipTo.import(rec);

    return this.importOrderItem(rec);
  };

  OrderSchema.methods.importOrderItem = function(rec) {
    var orderitem = this.orderitems.create({});
    orderitem.import(rec);
    var ois = this.orderitems.filter(function (oi) { return oi.hash === orderitem.hash; });
    if (ois.length) {
      return null;
    } else {
      this.orderitems.push(orderitem);
      return orderitem;
    }
  };

  var Order = mongoose.model('Order', OrderSchema);
  $module.exports = Order;
  return Order;
};
