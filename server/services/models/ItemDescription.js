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
    // sku: {
    //   type: String,
    //   trim: true,
    //   lowercase: true,
    //   required: true
    // },
    // styleNumber: {
    //   type: Number,
    //   required: true,
    //   default: 9999
    // },
    style: {
      type: String,
      trim: true,
      lowercase: true,
      default: 'none',
      required: true
    },
    size: {
      type: [String],
      default: ['99'],
      required: true
    },
    color: {
      type: String,
      trim: true,
      lowercase: true,
      default: 'none',
      required: true
    }
  }, helpers.schemaOptions({ _id: false }));

  ItemDescriptionSchema.index({ style: 1, color: 1, size: 1});

  var styleToNumberMap = {
    'cheryl': 1401,
    'leigh': 1411,
    'hillary': 1402,
    'jane': 1422,
    'catherine': 1403,
    'ann': 1433,
    'kate': 1404,
    'madison': 1444,
    'emma': 1405,
    'olivia': 1455,
    'julie': 1301,
    'julie-elizabeth': 1311
  };

  function numberForStyle(style) {
    var st = styleToNumberMap[style];
    if (!st) {
      return 9999;
    }
    return st;
  }
  ItemDescriptionSchema.statics.numberForStyle = numberForStyle;

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
  ItemDescriptionSchema.statics.makeSize = makeSize;

  function makeSKU(style, color, size) {
    return numberForStyle(style) + color + size.join('');
  }
  ItemDescriptionSchema.statics.makeSKU = makeSKU;

  function make(style, color, size) {
    var desc = new ItemDescription();
    desc.style = style.toLowerCase();
    desc.color = color.toLowerCase();
    desc.size = makeSize(size);
    // desc.styleNumber = numberForStyle(desc.style);
    // desc.sku = makeSKU(desc.style, desc.color, desc.size);
    return desc;
  }
  ItemDescriptionSchema.statics.make = make;

  ItemDescriptionSchema.methods.import = function(rec, backup) {
    this.style = rec.style || rec.Style || rec.STYLE || rec['PRODUCT DETAILS'];
    this.color = rec.color || rec.Color || rec.COLOR;

    this.style = this.style.toLowerCase();
    this.color = this.color.toLowerCase();

    if (backup) {
      this.size = makeSize(rec['Free 2nd Size']);
    } else {
      this.size = makeSize(rec.size || rec.Size || rec.SIZE);
    }
    log.debug('Imported itemDescription=%j', this.toJSON(), {});

    // this.styleNumber = numberForStyle(this.style);
    // this.sku = makeSKU(this.style, this.color, this.size);
    return this;
  };

  ItemDescriptionSchema.virtual('sku').get(function() {
    return makeSKU(this.style, this.color, this.size);
  });

  ItemDescriptionSchema.virtual('styleNumber').get(function() {
    return numberForStyle(this.style);
  });

  var ItemDescription = mongoose.model('ItemDescription', ItemDescriptionSchema);
  $module.exports = ItemDescription;
  return ItemDescription;
};
