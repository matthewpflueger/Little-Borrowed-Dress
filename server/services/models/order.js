'use strict';

module.exports = function $module(mongoose, moment, _, utils, Address, OrderItem, helpers) {
  if ($module.exports) {
    return $module.exports;
  }

  mongoose = mongoose || require('mongoose');
  moment = moment || require('moment');
  _ = _ || require('lodash');
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
    type: {
      type: String,
      required: true,
      default: 'wedding'
    },
    forDate: {
      type: Date,
      required: true
    },
    bride: {
      type: String,
      trim: true
    },
    orderitems: {
      type: [OrderItem.schema],
      required: true
    },

    importedOn: Date,
    importedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    importHashes: [String]
  }, helpers.schemaOptions());

  OrderSchema.index({ orderNumber: 1, bride: 1, forDate: -1});

  OrderSchema.virtual('shipByDate').get(function() {
    //FIXME this is dependent on the order type (wedding vs fitting vs custom?)
    return moment(this.forDate).subtract('weeks', 3).day('Friday').toDate();
  });

  OrderSchema.methods.findOrderItem = function(orderitem) {
    orderitem = orderitem._id || orderitem;
    return _.find(this.orderitems, function(oi) {
      return oi._id.toString() === orderitem.toString();
    });
  };

  OrderSchema.methods.import = function(rec) {
    this.orderNumber = utils.number.makeNumber(rec.ORDER);
    this.purchasedOn = new Date(rec['PURCHASED ON']);
    //TODO flag orders with a date greater than 6 months in advance
    this.forDate = new Date(rec['WEDDING DATE']);

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
    this.orderitems.push(orderitem);
    return orderitem;
    // var ois = this.orderitems.filter(function (oi) { return oi.hash === orderitem.hash; });
    // if (ois.length) {
    //   return ois[0];
    // } else {
    //   this.orderitems.push(orderitem);
    //   return orderitem;
    // }
  };

  var Order = mongoose.model('Order', OrderSchema);
  $module.exports = Order;
  return Order;
};
