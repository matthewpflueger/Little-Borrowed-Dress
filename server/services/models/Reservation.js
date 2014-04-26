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
    wedding: {
      pre: '3 weeks',
      post: '2 weeks'
    },
    fitting: {
      pre: '2 weeks',
      post: '2 weeks'
    },
    purchase: {
      pre: '3 weeks',
      post: '0 minutes'
    }
  };

  var ReservationSchema = new mongoose.Schema({
    type: {
      type: String,
      required: true,
      default: 'wedding'
    },
    forDate: {
      type: Date,
      required: true,
      default: Date.now()
    },
    reservationStart: {
      type: Date,
      required: true,
      default: Date.now()
    },
    reservationEnd: {
      type: Date,
      required: true,
      default: Date.now()
    },

    orderNumber: String,
    email: String,
    name: String,
    telephone: Number,
    backup: Boolean,

    order: mongoose.Schema.Types.ObjectId,
    orderitem: mongoose.Schema.Types.ObjectId,
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer'
    },

    shippedOn: Date,
    shippedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
  }, helpers.schemaOptions());

  function makeSpan(span) {
    var a = span.split(/\s/);
    a[0] = parseInt(a[0]);
    return a;
  }

  /**
   * Return a reservation tuple (start, end) for the given built in reservation type
   * like wedding, fitting, purchase.
   * @param  {Date} forDate               the reservation date
   * @param  {String} type                the built in reservation type
   * @return {Array}                      a tuple of [{Date}, {Date}]
   */
  function makeReservationSpan(forDate, type) {
    var date = new Date(forDate);
    var mpre = moment(date);
    var mpost = moment(date);
    var span = reservationSpanDefaults[type];

    return [
      mpre.subtract.apply(mpre, makeSpan(span.pre)).toDate(),
      mpost.add.apply(mpost, makeSpan(span.post)).toDate()
    ];
  }

  ReservationSchema.statics.makeReservationSpan = makeReservationSpan;
  ReservationSchema.statics.makeSpan = makeSpan;

  ReservationSchema.virtual('receiveBackBy').get(function() {
    var m = moment(this.forDate);
    return m.add('1 weeks').toDate();
  });

  ReservationSchema.methods.ship = function(user) {
    this.shippedBy = user.id || user;
    this.shippedOn = new Date();
  };

  ReservationSchema.methods.update = function(rec) {
    if (rec.reservationStart) {
      this.reservationStart = rec.reservationStart;
    }
    if (rec.reservationEnd) {
      this.reservationEnd = rec.reservationEnd;
    }
  };

  ReservationSchema.methods.make = function(customer, order, orderitem) {
    var span = makeReservationSpan(order.forDate, order.type);

    this.type = order.type;
    this.forDate = order.forDate;
    this.reservationStart = span[0];
    this.reservationEnd = span[1];
    this.orderNumber = order.orderNumber;
    this.email = customer.email;
    this.name = customer.name;
    this.telephone = customer.telephone;
    this.backup = orderitem.backup;
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
