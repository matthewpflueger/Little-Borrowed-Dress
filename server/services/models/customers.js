'use strict';

module.exports = function $module(mongoose, uuid, utils, Order) {

  if ($module.exports) {
    return $module.exports;
  }

  mongoose = mongoose || require('mongoose');
  uuid = uuid || require('node-uuid');
  utils = utils || require('../../utils')();
  Order = Order || require('./order')();


  var CustomerSchema = new mongoose.Schema({
    createdOn: {
      type: Date,
      default: Date.now,
      required: true
    },
    name: {
      type: String,
      required: true,
      match: /^\S{2,}/
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: /^\S+@\S+\.\S{2,4}$/
    },
    telephone: Number,
    orders: {
      type: [Order.schema],
      required: true
    }
  }, {
    collection: 'customers'
  });

  CustomerSchema.index({ name: 1, email: 1, telephone: 1});


  CustomerSchema.methods.import = function(rec) {
    this.name = rec['SHIP TO NAME'];
    this.email = rec.EMAIL;
    this.telephone = utils.number.makeNumber(rec.TELEPHONE);

    var order = this.orders.create({});
    this.orders.push(order);
    return order.import(rec);
  };


  var Customer = mongoose.model('Customer', CustomerSchema);
  $module.exports = Customer;
  return Customer;
};

