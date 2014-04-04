'use strict';

module.exports = function $module(mongoose, utils, helpers) {
  if ($module.exports) {
    return $module.exports;
  }

  mongoose = mongoose || require('mongoose');
  utils = utils || require('../../utils')();
  helpers = helpers || require('./helpers')();

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
  }, helpers.schemaOptions());

  AddressSchema.index({ zipcode: 1 });

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
