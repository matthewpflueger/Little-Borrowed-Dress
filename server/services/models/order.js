'use strict';

module.exports = function $module(mongoose, moment, utils, Address, OrderItem, helpers) {
  if ($module.exports) {
    return $module.exports;
  }

  mongoose = mongoose || require('mongoose');
  moment = moment || require('moment');
  utils = utils || require('../../utils')();
  Address = Address || require('./Address')();
  OrderItem = OrderItem || require('./OrderItem')();
  helpers = helpers || require('./helpers')();

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
  }, helpers.schemaOptions());

  OrderSchema.index({ orderNumber: 1, bride: 1, weddingDate: -1});

  OrderSchema.virtual('shipByDate').get(function() {
    if (!this.weddingDate) {
      return null;
    }

    var shipByDate = moment(this.weddingDate).subtract('weeks', 3).day('Friday').toDate();
    log.info('shipByDate=%s', shipByDate);
    return shipByDate;
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
      return ois[0];
    } else {
      this.orderitems.push(orderitem);
      return orderitem;
    }
  };

  var Order = mongoose.model('Order', OrderSchema);
  $module.exports = Order;
  return Order;
};
