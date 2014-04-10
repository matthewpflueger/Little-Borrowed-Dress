'use strict';

module.exports = function $module(mongoose, uuid, crypto, helpers) {
  if ($module.exports) {
    return $module.exports;
  }
  $module.exports = {};

  mongoose = mongoose || require('mongoose');
  uuid = uuid || require('node-uuid');
  crypto = crypto || require('crypto');
  helpers = helpers || require('./helpers')();

  var ItemDescriptionSchema = new mongoose.Schema({
    style: {
      type: String,
      trim: true,
      lowercase: true,
      required: true
    },
    size: {
      type: [String],
      required: true
    },
    color: {
      type: String,
      trim: true,
      lowercase: true,
      required: true
    }
  }, helpers.schemaOptions({ _id: false }));

  ItemDescriptionSchema.index({ style: 1, color: 1, size: 1});

  function makeSize(str) {
    str = str || '-1';
    var size = str.match(/(\d+)/g) || ['-1'];
    if (/Long/i.test(str) && size.indexOf('59') === -1) {
      size.push('59');
    } else if (/Regular/i.test(str) && size.indexOf('55') === -1) {
      size.push('55');
    }
    return size;
  }

  ItemDescriptionSchema.methods.import = function(rec) {
    this.style = rec.style || rec.Style || rec.STYLE;
    this.color = rec.color || rec.Color || rec.COLOR;
    this.size = makeSize(rec.size || rec.Size || rec.SIZE);
  };

  var ItemDescription = mongoose.model('ItemDescription', ItemDescriptionSchema);
  $module.exports = ItemDescription;
  return ItemDescription;
};
