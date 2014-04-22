'use strict';

module.exports = function $module(mongoose, moment, _, utils, Address, OrderItem, ItemDescription, helpers) {
  if ($module.exports) {
    return $module.exports;
  }

  mongoose = mongoose || require('mongoose');
  moment = moment || require('moment');
  _ = _ || require('lodash');
  utils = utils || require('../../utils')();
  Address = Address || require('./Address')();
  OrderItem = OrderItem || require('./OrderItem')();
  ItemDescription = ItemDescription || require('./ItemDescription')();
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

    creditCardType: String,
    creditCardLast: Number,

    processedAmount: Number,
    subtotal: Number,
    shippingAndHandling: Number,
    grandTotal: Number,
    totalPaid: Number,
    totalRefunded: Number,
    totalDue: Number,

    couponCode: String,
    discount: Number,

    orderitems: {
      type: [OrderItem.schema],
      required: true
    },
    billTo: {
      type: [Address.schema],
      required: true,
    },
    shipTo: {
      type: [Address.schema],
      required: true
    },
    rental: {
      type: Boolean,
      required: true,
      default: true
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

    importedOn: Date,
    importedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
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

  OrderSchema.methods.findOrderItemsBySKU = function(sku) {
    return _.filter(this.orderitems, function(oi) {
      return oi.sku === sku;
    });
  };

  OrderSchema.methods.import = function(rec, user) {
    this.importedOn = new Date();
    this.importedBy = user.id || user;

    this.orderNumber = utils.number.makeNumber(rec['Order #']);
    this.forDate = new Date(rec['Wedding Date']);

    var fd = moment(this.forDate);
    if (fd.year() > 2029) {
      this.type = 'fitting';
      this.forDate = fd.subtract(16, 'years').toDate();
    } else if (fd.year() > 2020) {
      this.type = 'wedding';
      this.forDate = fd.subtract(10, 'years').toDate();
    }

    if (!/Rent/gi.test(rec.OrderType)) {
      this.rental = false;
      this.type = 'purchase';
    }

    if (rec['Bride Name'] && !/^n\/?a$/i.test(rec['Bride Name'].trim())) {
      this.bride = rec['Bride Name'];
    }
    this.purchasedOn = new Date(rec['Purchased On']);

    this.creditCardType = rec['PAYMENT INFORMATION'].match(/Credit Card Type:(.+)/)[1];
    this.creditCardLast = utils.number.makeNumber(rec['Credit Card Last 4 Digit']);

    this.processedAmount = utils.number.makeDollar(rec['Processed Amount']);
    this.subtotal = utils.number.makeDollar(rec.Subtotal);
    this.shippingAndHandling = utils.number.makeDollar(rec['Shipping and Handling']);
    this.grandTotal = utils.number.makeDollar(rec['Grand Total']);
    this.totalPaid = utils.number.makeDollar(rec['Total Paid']);
    this.totalRefunded = utils.number.makeDollar(rec['Total Refunded']);
    this.totalDue = utils.number.makeDollar(rec['Total Due']);

    this.couponCode = rec['Coupon Code'];
    this.discount = utils.number.makeDollar(rec.Discount);

    var billTo = this.billTo.create({});
    this.billTo.push(billTo);
    billTo.import(rec, 'BILLING');

    var shipTo = this.shipTo.create({});
    this.shipTo.push(shipTo);
    shipTo.import(rec, 'SHIPPING');

    log.debug('Imported order=%j', this.toJSON(), user);

    this.importOrderItems(rec, user);

    return this;
  };

  OrderSchema.methods.addOrderItem = function(rec) {
    log.debug('Adding orderitem=%j', rec, {});
    var oi = this.orderitems.create({});
    oi.backup = rec.backup;
    this.orderitems.push(oi);

    var desc = ItemDescription.make(rec.style, rec.color, rec.size);
    oi.itemDescription.push(desc);

    return oi;
  };

  OrderSchema.methods.importOrderItems = function(rec, user) {
    //calculate whether or not we've imported the order items by creating/looking up the hash
    //if we have not then we look at the quantity ordered + backup * quantity ordered
    var sku = ItemDescription.make(rec['PRODUCT DETAILS'], rec.Color, rec.Size).sku;
    var importedOrderItems = this.findOrderItemsBySKU(sku);
    if (importedOrderItems.length) {
      return importedOrderItems;
    }

    var ois = this.orderitems;
    var qty = parseInt(rec['QTY ORDERED']);

    function createOrderItems(backup) {
      log.debug('About to create orderitems quantity=%s, backup=%s', qty, backup, user);
      for (var i = 0; i < qty; i++) {
        var oi = ois.create({});
        oi.import(rec, backup, user);
        ois.push(oi);
        importedOrderItems.push(oi);
      }
    }

    createOrderItems(false);
    if (this.type !== 'purchase' && /^Size:/i.test(rec['Free 2nd Size'])) {
      createOrderItems(true);
    }

    return importedOrderItems;


    // for (var i = 0; i < qty; i++) {
    //   var orderitem = this.orderitems.create({});
    //   orderitem.import(rec['PRODUCT DETAILS'], rec.Size, rec.Color, false, user);
    //   this.orderitems.push(orderitem);
    // }

    // if (/^Size:/i.test(rec['Free 2nd Size'])) {
    //   for (var i = 0; i < qty; i++) {
    //   }

    // }
    // return this;


    // var orderitem = this.orderitems.create({});
    // orderitem.import(rec);
    // this.orderitems.push(orderitem);
    // return orderitem;
  };

  var Order = mongoose.model('Order', OrderSchema);
  $module.exports = Order;
  return Order;
};
