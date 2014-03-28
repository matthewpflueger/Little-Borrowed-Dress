'use strict';

module.exports = function $module(mongoose, uuid) {
  if ($module.exports) {
    return $module.exports;
  }

  mongoose = mongoose || require('mongoose');
  uuid = uuid || require('node-uuid');

  var InventorySchema = new mongoose.Schema({
    createdOn: {
      type: Date,
      default: Date.now,
      required: true
    },
    manufacturedOn: {
      type: Date,
      required: true
    },
    productNumber: {
      type: Number,
      min: 0,
      required: true,
      unique: true
    },
    status: {
      type: String,
      trim: true,
      lowercase: true,
      required: true
    },
    tagId: {
      type: String,
      trim: true,
      lowercase: true,
      required: true,
      unique: true
    },
    style: {
      type: String,
      trim: true,
      lowercase: true,
      required: true
    },
    notes: {
      type: String,
      default: '',
      trim: true
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
    },
    location: {
      type: String,
      default: '',
      trim: true
    },
    events: []
  }, {
    collection: 'inventory'
  });

  InventorySchema.index({ style: 1, color: 1, size: 1});

  InventorySchema.statics.import = function(rec, cb) {
    var iv = {};
    iv.manufacturedOn = new Date(rec['Prod Date']);
    iv.productNumber = rec['Prod #'];
    iv.status = rec.Status;
    iv.tagId = rec['Tag ID'];
    if (/.*n\/a.*/i.test(iv.tagId) || /^\s*$/.test(iv.tagId)) {
      iv.tagId = uuid.v4();
    }
    iv.style = rec.Style;
    iv.size = rec.Size.split(/\s*|\s*/);
    iv.notes = rec.Notes;
    iv.color = rec.Color;
    new Inventory(iv).save(cb);
  };

  var Inventory = mongoose.model('Inventory', InventorySchema);
  $module.exports = Inventory;
  return Inventory;
};

