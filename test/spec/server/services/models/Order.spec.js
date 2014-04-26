'use strict';

var Order = frequire(__filename)();
var moment = require('moment');

describe('Order', function() {

  it('should import data from a given record', function() {
    function fdate(date) {
      return moment(date).format('M/D/YY');
    }

    var user = 'userId';
    var today = fdate(new Date());
    var rec = {
      'Order #': '100010001',
      'Wedding Date': today,
      'OrderType': 'Rental',
      'PRODUCT DETAILS': 'teststyle',
      'Color': 'red',
      'Size': '0 | 2 55',
      'QTY ORDERED': '1',
      'Free 2nd Size': 'Size: 4 | 6 59'
    };

    var order = new Order();
    order.import(rec, user);
    expect(order.orderNumber).toBe(100010001);
    expect(order.type).toBe('wedding');
    expect(fdate(order.forDate)).toBe(today);
    expect(order.orderitems.length).toBe(2);
    expect(order.orderitems[0].backup).toBe(false);
    expect(order.orderitems[0].itemDescription[0].style).toBe('teststyle');
    expect(order.orderitems[0].itemDescription[0].color).toBe('red');
    expect(order.orderitems[0].itemDescription[0].size).toContain('0');
    expect(order.orderitems[0].itemDescription[0].size).toContain('2');
    expect(order.orderitems[0].itemDescription[0].size).toContain('55');

    expect(order.orderitems[1].backup).toBe(true);
    expect(order.orderitems[1].itemDescription[0].style).toBe('teststyle');
    expect(order.orderitems[1].itemDescription[0].color).toBe('red');
    expect(order.orderitems[1].itemDescription[0].size).toContain('4');
    expect(order.orderitems[1].itemDescription[0].size).toContain('6');
    expect(order.orderitems[1].itemDescription[0].size).toContain('59');

    order.import(rec, user);
    expect(order.orderitems.length).toBe(2);

    rec['Wedding Date'] = '12/31/1930';
    order = new Order();
    order.import(rec, user);
    expect(order.type).toBe('fitting');
    expect(fdate(order.forDate)).toBe('12/31/14');

    rec['Wedding Date'] = '12/31/30';
    order = new Order();
    order.import(rec, user);
    expect(order.type).toBe('fitting');
    expect(fdate(order.forDate)).toBe('12/31/14');

    rec['Wedding Date'] = '12/31/24';
    order = new Order();
    order.import(rec, user);
    expect(order.type).toBe('wedding');
    expect(fdate(order.forDate)).toBe('12/31/14');

    rec.OrderType = 'test';
    order = new Order();
    order.import(rec, user);
    expect(order.type).toBe('purchase');
    expect(fdate(order.forDate)).toBe('12/31/14');
    expect(order.orderitems.length).toBe(1);
  });

});

