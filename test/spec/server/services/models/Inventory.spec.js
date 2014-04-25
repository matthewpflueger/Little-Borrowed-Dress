'use strict';

var Inventory = frequire(__filename)();

describe('Inventory', function() {

  it('should update itself and reservations with new rec', function() {
    var today = new Date();
    var resDate = new Date();
    resDate.setYear(2000);
    var i = new Inventory();

    i.tagId = 'tagId';
    i.status = 'ok';
    i.reservations.push({ reservationStart: today, reservationEnd: today });
    i.reservations.push({ reservationStart: today, reservationEnd: today });

    i.update({
      tagId: 'test',
      reservations: [{ _id: i.reservations[1]._id, reservationStart: resDate }]
    }, 'user');

    expect(i.tagId).toBe('test');
    expect(i.reservations[1].reservationStart).toBe(resDate);
    expect(i.reservations[1].reservationStart).toNotBe(today);
  });
});
