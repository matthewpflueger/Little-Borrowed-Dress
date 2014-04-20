'use strict';

module.exports = function $module(mongoose, crypto, ItemDescription, helpers) {
  if ($module.exports) {
    return $module.exports;
  }

  mongoose = mongoose || require('mongoose');
  crypto = crypto || require('crypto');
  ItemDescription = ItemDescription || require('./ItemDescription')();
  helpers = helpers || require('./helpers')();

  var OrderItemSchema = new mongoose.Schema({
    createdOn: {
      type: Date,
      default: Date.now,
      required: true
    },
    backup: {
      type: Boolean,
      default: false,
      required: true
    },
    itemDescription: {
      type: [ItemDescription.schema],
      required: true
    },
    inventory: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },

    shippedOn: Date,
    shippedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    receivedBackOn: Date,
    receivedBackBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
  }, helpers.schemaOptions());

  OrderItemSchema.methods.ship = function(user) {
    this.shippedOn = new Date();
    this.shippedBy = user.id || user;
  };

  OrderItemSchema.methods.receiveBack = function(user) {
    this.receivedBackOn = new Date();
    this.receivedBackBy = user;
  };

  OrderItemSchema.methods.unassign = function(inventory, force) {
    var x = inventory._id || inventory;
    var y = this.inventory._id || this.inventory;
    if (force || (x.toString() === y.toString())) {
      this.inventory = undefined;
      return true;
    }
    return false;
  };

  OrderItemSchema.methods.assign = function(inventory) {
    inventory = inventory._id || inventory;
    if (this.inventory && (this.inventory !== inventory || this.inventory._id !== inventory)) {
      return false;
    }
    this.inventory = inventory;
    return true;
  };

  OrderItemSchema.methods.import = function(rec) {
    var desc = this.itemDescription.create({});
    desc.import(rec);
    this.itemDescription.push(desc);

    this.backup = /\S+/.test(rec.backup || rec['BACKUP?']);
  };

  var OrderItem = mongoose.model('OrderItem', OrderItemSchema);
  $module.exports = OrderItem;
  return OrderItem;
};
