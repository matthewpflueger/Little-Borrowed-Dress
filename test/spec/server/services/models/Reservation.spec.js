'use strict';

var Reservation = frequire(__filename)();
var moment = require('moment');
require('twix');

describe('Reservation', function() {

  var today = new Date();
  var sanity = new Date(2000, 1, 1, 1, 1, 1, 1);

  function verifySpan(s, e) {
    expect(moment.twix(s, e).contains(today)).toBe(true);
    expect(moment(s).isBefore(e)).toBe(true);
    expect(moment.twix(s, e).contains(sanity)).toBe(false);
  }

  it('should make proper moment time span arguments from string', function() {
    var span = Reservation.makeSpan('1 weeks');
    expect(span.length).toBe(2);
    expect(span[0]).toEqual(1);
    expect(span[1]).toEqual('weeks');
  });

  it('should make a default span for built-in reservation types', function() {

    var span = Reservation.makeReservationSpan(today, 'wedding');
    expect(span.length).toBe(2);
    verifySpan(span[0], span[1]);

    span = Reservation.makeReservationSpan(today, 'fitting');
    expect(span.length).toBe(2);
    verifySpan(span[0], span[1]);

    span = Reservation.makeReservationSpan(today, 'purchase');
    expect(span.length).toBe(2);
    verifySpan(span[0], span[1]);
  });

  it('should make a new reservation given a customer, order, and orderitem', function() {
    var today = new Date();
    var r = new Reservation();
    r.make({}, { type: 'wedding', forDate: today }, {});
    verifySpan(r.reservationStart, r.reservationEnd);
    expect(r.type).toBe('wedding');
  });

  it('should update a reservation', function() {
    var today = new Date();
    var rec = {
      reservationStart: today,
      reservationEnd: today,
      orderNumber: 'test'
    };
    var res = new Reservation();
    res.orderNumber = 'orderNumber';
    res.update(rec);

    expect(res.reservationStart).toEqual(today);
    expect(res.reservationEnd).toEqual(today);
    expect(res.orderNumber).toBe('orderNumber');

  });

});

