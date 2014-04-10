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
    backup: {
      type: Boolean,
      default: false,
      required: true
    },
    itemDescription: {
      type: [ItemDescription.schema],
      required: true
    },
    inventory: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' }
  }, helpers.schemaOptions());


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
