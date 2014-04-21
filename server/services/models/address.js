'use strict';

module.exports = function $module(_, mongoose, utils, helpers) {
  if ($module.exports) {
    return $module.exports;
  }

  _ = _ || require('lodash');
  mongoose = mongoose || require('mongoose');

  utils = utils || require('../../utils')();
  helpers = helpers || require('./helpers')();

  var AddressSchema = new mongoose.Schema({
    name: String,
    telephone: Number,

    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    zipcode: {
      type: Number,
      required: true
    }
  }, helpers.schemaOptions());

  AddressSchema.index({ zipcode: 1 });

  var fields = ['First Name', 'Last Name', 'Street Address', 'City', 'State', 'Zipcode', 'Telephone #'];

  AddressSchema.methods.import = function(rec, prefix) {
    var vals = _.map(fields, function(f) { return rec[prefix + ' ' + f]; });
    this.name = vals[0] + ' ' + vals[1];
    this.street = vals[2];
    this.city = vals[3];
    this.state = vals[4];
    this.zipcode = utils.number.makeNumber(vals[5]);
    this.telephone = utils.number.makeNumber(vals[6]);

    // this.street = rec['SHIP TO ADDRESS'];
    // this.city = rec.CITY;
    // this.state = rec.STATE;
    // this.zipcode = utils.number.makeNumber(rec.ZIP);
  };

  var Address = mongoose.model('Address', AddressSchema);
  $module.exports = Address;
  return Address;
};
