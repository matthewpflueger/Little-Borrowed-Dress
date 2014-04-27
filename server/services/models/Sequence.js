'use strict';

module.exports = function $module(mongoose, helpers) {
  if ($module.exports) {
    return $module.exports;
  }

  mongoose = mongoose || require('mongoose');

  helpers = helpers || require('./helpers')();

  var SequenceSchema = new mongoose.Schema({
    name: String,
    seq: Number
  }, helpers.schemaOptions({ collection: 'sequences' }));


  var Sequence = mongoose.model('Sequence', SequenceSchema);
  $module.exports = Sequence;
  return Sequence;
};
