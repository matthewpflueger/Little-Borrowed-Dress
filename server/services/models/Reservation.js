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

  var reservationSpanDefaults = {
    'wedding': '3 weeks',
    'fitting': '2 weeks'
  };

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

    reservationSpan: {
      type: String,
      required: true,
      default: '3 weeks'
    },

    notes: String,

    orderNumber: String,
    email: String,
    name: String,
    telephone: Number,

    order: mongoose.Schema.Types.ObjectId,
    orderitem: mongoose.Schema.Types.ObjectId,
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer'
    }
  }, helpers.schemaOptions());

  function makeSpan(span) {
    try {
      var a = span.split(/\s/);
      a[0] = parseInt(a[0]);
      return a;
    } catch (e) {
      log.error('Failed to parse reservation span=%s, error=%j', span, e, {});
      return makeSpan(reservationSpanDefaults.wedding);
    }
  }

  ReservationSchema.virtual('reservationStart').get(function() {
    var m = moment(this.date);
    return m.subtract.apply(m, makeSpan(this.reservationSpan)).toDate();
  });

  ReservationSchema.virtual('reservationEnd').get(function() {
    var m = moment(this.date);
    return m.add.apply(m, makeSpan(this.reservationSpan)).toDate();
  });

  ReservationSchema.methods.make = function(customer, order, orderitem) {
    this.type = order.type;
    this.date = order.forDate;
    this.reservationSpan = reservationSpanDefaults[order.type];
    this.orderNumber = order.orderNumber;
    this.email = customer.email;
    this.name = customer.name;
    this.telephone = customer.telephone;
    this.order = order._id;
    this.orderitem = orderitem._id;
    this.customer = customer._id;
  };

  ReservationSchema.methods.isAssignedTo = function(orderitem) {
    if (!orderitem || !this.orderitem) {
      return false;
    }

    var oi = this.orderitem._id || this.orderitem;
    orderitem = orderitem._id || orderitem;

    return oi.toString() === orderitem.toString();
  };

  ReservationSchema.methods.conflictsWith = function(date) {
    return moment.twix(this.reservationStart, this.reservationEnd).contains(date);
  };

  var Reservation = mongoose.model('Reservation', ReservationSchema);
  $module.exports = Reservation;
  return Reservation;
};
