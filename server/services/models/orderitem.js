'use strict';

module.exports = function $module(mongoose, crypto) {
  if ($module.exports) {
    return $module.exports;
  }

  mongoose = mongoose || require('mongoose');
  crypto = crypto || require('crypto');

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

  function makeHash(style, color, size, backup) {
    var md5 = crypto.createHash('md5');
    md5.update(style);
    md5.update(color);
    md5.update(JSON.stringify(size));
    md5.update(JSON.stringify(backup));
    return md5.digest('hex');
  }

  OrderItemSchema.statics.makeHash = makeHash;

  OrderItemSchema.methods.import = function(rec) {
    this.style = rec.STYLE;
    this.color = rec.COLOR;

    //TODO flag orders that have no size
    if (/^\s*Size.*/i.test(rec.SIZE)) {
      this.size = rec.SIZE.match(/(\d+)/g);
    }

    this.backup = /\S+/.test(rec['BACKUP?']);
    this.hash = makeHash(this.style, this.color, this.size, this.backup);
  };

  var OrderItem = mongoose.model('OrderItem', OrderItemSchema);
  $module.exports = OrderItem;
  return OrderItem;
};
