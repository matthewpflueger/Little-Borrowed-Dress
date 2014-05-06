'use strict';

var Inventory = spec.frequire(__filename)();

var order = require('./Order.spec').createTestOrder();

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
    expect(i.reservations[0].reservationStart).toBe(today);
    expect(i.reservations[0].reservationEnd).toBe(today);
  });

  it('should manufacture itself based on order item', function() {
    var customer = { email: 'testemail', name: 'testname', _id: 'testid' };
    var oi = order.orderitems[0];
    var productNumber = 9999;

    var i = Inventory.manufactureForOrderItem(customer, order, oi, productNumber);
    expect(i.reservations.length).toBe(1);
    expect(i.productNumber).toBe(9999);
    expect(spec.fdate(i.manufactureRequestedOn)).toBe(spec.fdate(new Date()));
    expect(i.manufactureSentOn).toBe(undefined);
    expect(i.manufacturedOn).toBe(undefined);
  });
});
