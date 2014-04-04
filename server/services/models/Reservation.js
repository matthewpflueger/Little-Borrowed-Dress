'use strict';

module.exports = function $module(mongoose, moment, twix, utils, helpers) {
  if ($module.exports) {
    return $module.exports;
  }

  mongoose = mongoose || require('mongoose');
  moment = moment || require('moment');
  twix = twix || require('twix');
  utils = utils || require('../../utils')();
  helpers = helpers || require('./helpers')();

  var ReservationSchema = new mongoose.Schema({
    type: {
      type: String,
      required: true,
      default: 'wedding'
    },
    date: {
      type: Date,
      required: true,
      default: Date.now()
    },

    reservationSpan: String,

    orderNumber: String,
    customerEmail: String,

    orderId: mongoose.Schema.Types.ObjectId,
    orderitemId: mongoose.Schema.Types.ObjectId,
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer'
    }
  }, helpers.schemaOptions());

  ReservationSchema.virtual('reservationStart').get(function() {
    if (this.type === 'wedding') {
      return moment(this.date).subtract(3, 'weeks').toDate();
    }
    if (this.type === 'fitting') {
      return moment(this.date).subtract(2, 'weeks').toDate();
    }

    var m = moment(this.date);
    return m.subtract.apply(m, this.reservationSpan.split(/\s/)).toDate();
  });

  ReservationSchema.virtual('reservationEnd').get(function() {
    if (this.type === 'wedding') {
      return moment(this.date).add(3, 'weeks').toDate();
    }
    if (this.type === 'fitting') {
      return moment(this.date).add(2, 'weeks').toDate();
    }

    var m = moment(this.date);
    return m.add.apply(m, this.reservationSpan.split(/\s/)).toDate();
  });

  ReservationSchema.methods.isAssignedTo = function(ids) {
    ids = ids || {};

    //FIXME seriously?!?!?
    if (ids.orderitemId && ids.orderitemId === this.orderitemId) {
      return true;
    }
    if (ids.orderId && ids.orderId === this.orderId) {
      return true;
    }
    if (ids.customer && ids.customer === this.customer) {
      return true;
    }
    if (ids.customer && this.customer && this.customer._id && ids.customer === this.customer._id) {
      return true;
    }
    if (ids.orderNumber && ids.orderNumber === this.orderNumber) {
      return true;
    }
    if (ids.customerEmail && ids.customerEmail === this.customerEmail) {
      return true;
    }

    return false;
  };

  ReservationSchema.methods.conflictsWith = function(date) {
    return moment.twix(this.reservationStart, this.reservationEnd).contains(date);
  };

  var Reservation = mongoose.model('Reservation', ReservationSchema);
  $module.exports = Reservation;
  return Reservation;
};
