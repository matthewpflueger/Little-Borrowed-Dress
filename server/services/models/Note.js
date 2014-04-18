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

  var NoteSchema = new mongoose.Schema({
    createdOn: {
      type: Date,
      default: Date.now,
      required: true
    },
    note: {
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
    ref: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    authorName: {
      type: String,
      trim: true,
      required: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  }, helpers.schemaOptions());


  var Note = mongoose.model('Note', NoteSchema);
  $module.exports = Note;
  return Note;
};
