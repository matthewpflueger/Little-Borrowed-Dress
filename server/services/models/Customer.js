'use strict';

module.exports = function $module(mongoose, uuid, _, utils, Order, Note, helpers) {

  if ($module.exports) {
    return $module.exports;
  }

  mongoose = mongoose || require('mongoose');
  uuid = uuid || require('node-uuid');
  _ = _ || require('lodash');
  utils = utils || require('../../utils')();
  Order = Order || require('./Order')();
  Note = Note || require('./Note')();
  helpers = helpers || require('./helpers')();


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
    },
    notes: [Note.schema],
  }, helpers.schemaOptions({ collection: 'customers' }));

  CustomerSchema.index({ name: 1, email: 1, telephone: 1});


  CustomerSchema.methods.findOrderItem = function(orderitem) {
    orderitem = orderitem._id || orderitem;
    var result = {
      customer: this
    };

    //FIXME just horrible - need I say more...
    var found = false;
    _.forEach(this.orders, function(o) {
      _.forEach(o.orderitems, function(oi) {
        if (oi.id.toString() === orderitem.toString()) {
          result.orderitem = oi;
          result.order = o;
          found = true;
          return false;
        }
      });

      if (found) {
        return false;
      }
    });

    return result;
  };

  CustomerSchema.methods.findOrder = function(order) {
    order = order._id || order;
    var result = {
      customer: this
    };

    result.order = _.find(this.orders, function(o) {
      return o._id.toString() === order.toString();
    });

    return result;
  };

  CustomerSchema.methods.import = function(rec) {
    this.name = rec['SHIP TO NAME'];
    this.email = rec.EMAIL;
    this.telephone = utils.number.makeNumber(rec.TELEPHONE);

    var order = this.orders.create({});
    this.orders.push(order);
    return order.import(rec);
  };

  CustomerSchema.methods.addNote = function(note, author, type, ref) {
    if (note) {
      var n = this.notes.create({});
      n.note = note;
      log.info('author=%j', author, {});
      n.author = author.id;
      n.authorName = author.name;
      n.type = type;
      n.ref = ref.id || ref;
      this.notes.push(n);
      return true;
    }
    return false;
  };

  var Customer = mongoose.model('Customer', CustomerSchema);
  $module.exports = Customer;
  return Customer;
};

