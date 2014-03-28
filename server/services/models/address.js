'use strict';

module.exports = function $module(mongoose) {
  if ($module.exports) {
    return $module.exports;
  }

  mongoose = mongoose || require('mongoose');

  var AddressSchema = new mongoose.Schema({
    street: {
      type: String,
      required: true,
      match: /^\S{2,}/
    },
    city: {
      type: String,
      required: true,
      match: /^\S{2,}/
    },
    state: {
      type: String,
      required: true,
      match: /^\S{2}/
    },
    zipcode: {
      type: Number,
      required: true
    }
  }, {
    _id : false
  });

  var Address = mongoose.model('Address', AddressSchema);
  $module.exports = Address;
  return Address;
};
