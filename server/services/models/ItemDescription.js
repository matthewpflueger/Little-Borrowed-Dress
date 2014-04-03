'use strict';

module.exports = function $module(mongoose, uuid, crypto) {
  if ($module.exports) {
    return $module.exports;
  }
  $module.exports = {};

  mongoose = mongoose || require('mongoose');
  uuid = uuid || require('node-uuid');
  crypto = crypto || require('crypto');

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
  }, {
    _id : false
  });

  ItemDescriptionSchema.index({ style: 1, color: 1, size: 1});

  function makeHash(opt) {
    opt = opt || [];

    var md5 = crypto.createHash('md5');
    md5.update(this.style);
    md5.update(this.color);
    md5.update(JSON.stringify(this.size));

    opt.forEach(function(o) {
      md5.update(JSON.stringify(o));
    });

    return md5.digest('hex');
  }

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

  ItemDescriptionSchema.methods.makeHash = makeHash;
  ItemDescriptionSchema.methods.import = function(rec) {
    this.style = rec.Style || rec.STYLE;
    this.color = rec.Color || rec.COLOR;
    this.size = makeSize(rec.Size || rec.SIZE);
  };

  var ItemDescription = mongoose.model('ItemDescription', ItemDescriptionSchema);
  $module.exports = ItemDescription;
  return ItemDescription;
};
