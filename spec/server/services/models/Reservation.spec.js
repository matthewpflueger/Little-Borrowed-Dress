'use strict';

var Reservation = frequire(__filename)();
var moment = require('moment');
require('twix');


describe('Reservation', function() {

  it('should make proper moment time span arguments from string', function() {
    var span = Reservation.makeSpan('1 weeks');
    expect(span.length).toBe(2);
    expect(span[0]).toEqual(1);
    expect(span[1]).toEqual('weeks');
  });

  it('should make a default span for built-in reservation types', function() {
    var today = new Date();
    var sanity = new Date(2000, 1, 1, 1, 1, 1, 1);

    var span = Reservation.makeReservationSpan(today, 'wedding');
    expect(span.length).toBe(2);
    expect(moment.twix(span[0], span[1]).contains(today)).toBe(true);
    expect(moment.twix(span[0], span[1]).contains(sanity)).toBe(false);

    span = Reservation.makeReservationSpan(today, 'fitting');
    expect(span.length).toBe(2);
    expect(moment.twix(span[0], span[1]).contains(today)).toBe(true);
    expect(moment.twix(span[0], span[1]).contains(sanity)).toBe(false);

    span = Reservation.makeReservationSpan(today, 'purchase');
    expect(span.length).toBe(2);
    expect(moment.twix(span[0], span[1]).contains(today)).toBe(true);
    expect(moment.twix(span[0], span[1]).contains(sanity)).toBe(false);
  });

});

