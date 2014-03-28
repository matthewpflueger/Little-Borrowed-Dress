'use strict';

module.exports = function $module(mongoose) {
  if ($module.exports) {
    return $module.exports;
  }

  mongoose = mongoose || require('mongoose');

  var TelephoneSchema = new mongoose.Schema({
    number: {
      type: Number,
      required: true
    },
    type: String
  }, {
    _id : false
  });

  var Telephone = mongoose.model('Telephone', TelephoneSchema);
  $module.exports = Telephone;
  return Telephone;
};
