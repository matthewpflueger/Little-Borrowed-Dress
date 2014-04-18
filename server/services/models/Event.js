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

  var EventSchema = new mongoose.Schema({
    createdOn: {
      type: Date,
      default: Date.now,
      required: true
    },
    root: {
      type: String
    },
    data: {
      type: String,
      trim: true,
      lowercase: true,
      required: true
    },
    type: {
      type: String,
      trim: true,
      lowercase: true,
      required: true
    },
    subtype: {
      type: String,
      trim: true,
      lowercase: true
    },
    ref: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    reftype: {
      type: String,
      trim: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  }, helpers.schemaOptions());


  var Event = mongoose.model('Event', EventSchema);
  $module.exports = Event;
  return Event;
};
