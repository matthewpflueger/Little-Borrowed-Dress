'use strict';

module.exports = function $module(mongoose, uuid, crypto, helpers, _) {
  if ($module.exports) {
    return $module.exports;
  }
  $module.exports = {};

  mongoose = mongoose || require('mongoose');
  uuid = uuid || require('node-uuid');
  crypto = crypto || require('crypto');
  helpers = helpers || require('./helpers')();
  _ = _ || require('lodash');

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
    'julie-elizabeth': 1311,
    'mia': 1406,
    'grace': 1406
  };

  var styleToFactoryStyleMap = {
    'cheryl': 'cheryl',
    'leigh': 'cheryl - leigh',
    'hillary': 'hillary',
    'jane': 'hillary - jane',
    'catherine': 'catherine',
    'ann': 'catherine - ann',
    'kate': 'kate',
    'madison': 'kate - madison',
    'emma': 'emma',
    'olivia': 'emma - olivia',
    'julie': 'julie (old style)',
    'julie-elizabeth': 'julie-elizabeth (old style)',
    'mia': 'mia',
    'grace': 'mia - grace'
  };

  var styleToFactoryDescriptionMap = {
    'cheryl': 'halter',
    'leigh': 'halter - gown',
    'hillary': 'strapless',
    'jane': 'strapless - gown',
    'catherine': 'one shoulder',
    'ann': 'one shoulder gown',
    'kate': 'wrap',
    'madison': 'wrap gown',
    'emma': 'scoop',
    'olivia': 'scoop - gown',
    'julie': 'v-neck',
    'julie-elizabeth': 'v-neck - gown',
    'mia': 'new strapless',
    'grace': 'new strapless gown'
  };

  var styleLengthToCutMap = {
    'cheryl': { '0': 'cocktail' },
    'leigh': { '55': 'skirt - 42"', '59': 'skirt - 45"' },
    'hillary': { '0': 'cocktail' },
    'jane': { '55': 'skirt - 42.5"', '59': 'skirt - 45.5"' },
    'catherine': { '0': 'cocktail' },
    'ann': { '55': 'skirt - 40.5"', '59': 'skirt - 43.5"' },
    'kate': { '0': 'cocktail' },
    'madison': { '55': 'skirt - 42.5"', '59': 'skirt - 45.5"' },
    'emma': { '0': 'cocktail' },
    'olivia': { '55': 'skirt - 40.5"', '59': 'skirt - 43.5"' },
    'julie': { '0': 'cocktail' },
    'julie-elizabeth': { '55': 'skirt - 42.5"', '59': 'skirt - 45.5"' },
    'mia': { '0': 'cocktail' },
    'grace': { '55': 'skirt - 42"', '59': 'skirt - 45"' }
  };

  function numberForStyle(style) {
    var st = styleToNumberMap[style];
    if (!st) {
      return 9999;
    }
    return st;
  }
  ItemDescriptionSchema.statics.numberForStyle = numberForStyle;

  function sizeLength(size) {
    if (!size) {
      return '0';
    }

    if (typeof size === 'string') {
      size = makeSize(size);
    }
    if (!size.length || size.length < 3) {
      return '0';
    }
    return size[2];
  }
  ItemDescriptionSchema.statics.sizeLength = sizeLength;

  function cutForStyleLength(style, size) {
    var cutMap = styleLengthToCutMap[style];
    if (!cutMap) {
      return '';
    }

    if (_.size(cutMap) === 1) {
      return _.values(cutMap)[0];
    }

    var s = cutMap[sizeLength(size)];
    if (!s) {
      return '';
    }
    return s;
  }
  ItemDescriptionSchema.statics.cutForStyleLength = cutForStyleLength;

  function makeSize(str) {
    //ignore arrays - perhaps this method should be renamed to normalizeSize...
    if (_.isArray(str)) {
      return str;
    }

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
    if (!style || !color || !size) {
      return '';
    }
    return numberForStyle(style) + color + makeSize(size).join('');
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

  ItemDescriptionSchema.virtual('factoryStyle').get(function() {
    return styleToFactoryStyleMap[this.style] + ' (' + numberForStyle(this.style) + ')';
  });

  ItemDescriptionSchema.virtual('factoryDescription').get(function() {
    return styleToFactoryDescriptionMap[this.style];
  });

  ItemDescriptionSchema.virtual('cut').get(function() {
    return cutForStyleLength(this.style, this.size);
  });

  ItemDescriptionSchema.virtual('length').get(function() {
    return sizeLength(this.size);
  });

  ItemDescriptionSchema.virtual('sizeDesc').get(function() {
    if (!this.size || this.size.length === 0) {
      return '';
    }

    var d = this.size[0];
    if (this.size.length > 1) {
      d = d + ' | ' + this.size[1];
    }

    if (this.size.length > 2) {
      if (this.size[2] === '55') {
        d = d + ' regular';
      } else if (this.size[2] === '59') {
        d = d + ' long';
      }
    }

    return d;
  });

  var ItemDescription = mongoose.model('ItemDescription', ItemDescriptionSchema);
  $module.exports = ItemDescription;
  return ItemDescription;
};
