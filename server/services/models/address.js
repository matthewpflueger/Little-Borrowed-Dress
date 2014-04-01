'use strict';

module.exports = function $module(mongoose, utils) {
  if ($module.exports) {
    return $module.exports;
  }

  mongoose = mongoose || require('mongoose');
  utils = utils || require('../../utils')();

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

  AddressSchema.methods.import = function(rec) {
    this.street = rec['SHIP TO ADDRESS'];
    this.city = rec.CITY;
    this.state = rec.STATE;
    this.zipcode = utils.number.makeNumber(rec.ZIP);
  };

  var Address = mongoose.model('Address', AddressSchema);
  $module.exports = Address;
  return Address;
};
