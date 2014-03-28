'use strict';

module.exports = function $module(
    mongoose,
    uuid,
    Telephone,
    Order,
    OrderItem,
    Address) {

  if ($module.exports) {
    return $module.exports;
  }

  mongoose = mongoose || require('mongoose');
  uuid = uuid || require('node-uuid');
  Telephone = Telephone || require('./telephone');
  Order = Order || require('./order');
  OrderItem = OrderItem || require('./orderitem');
  Address = Address || require('./address');


  var CustomerSchema = new mongoose.Schema({
    createdOn: {
      type: Date,
      default: Date.now,
      required: true
    },
    name: {
      type: String,
      required: true,
      match: /^\S{2,}/
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: /^\S+@\S+\.\S{2,4}$/
    },
    telephone: Number,
    orders: {
      type: [Order.schema],
      required: true
    }
  }, {
    collection: 'customers'
  });

  CustomerSchema.index({ name: 1, email: 1, telephone: 1});

  function makeNumber(numberString) {
    numberString = numberString || 0;
    var num = parseInt(numberString.split(/\D/).join(''));
    if (isNaN(num)) {
      return 0;
    } else {
      return num;
    }
  }

  CustomerSchema.statics.import = function(rec, cb) {
    log.info('Looking for customer with email ' + rec.EMAIL);
    Customer.findOne({ email: rec.EMAIL.trim() }, function(err, customer) {
      if (err) {
        log.error('ERROR!!! ', err);
        return cb(err);
      }

      if (customer) {
        log.info('FOUND customer ', customer.email);
      } else {
        log.info('DID NOT FIND customer with email ', rec.EMAIL);

      }

      customer = customer || new Customer();
      if (!customer.orders) {
        customer.orders = [];
      }
      customer.name = rec['SHIP TO NAME'];
      customer.email = rec.EMAIL.trim();
      customer.telephone = makeNumber(rec.TELEPHONE);

      var orderNumber = makeNumber(rec.ORDER);
      log.info('customer.orders is ', customer.orders);
      var order = customer.orders.filter(function(o) { return o.orderNumber !== orderNumber; });
      if (!order.length) {
        log.info('Did not find order %s for customer %s', orderNumber, customer.email);
        order = new Order();
        order.shipTo = [new Address()];
        order.orderitems = [];
        customer.orders.push(order);
      } else {
        log.info('Found order %s for customer %s', order.orderNumber, customer.email);
      }

      order.orderNumber = orderNumber;
      order.purchasedOn = new Date(rec['PURCHASED ON']);
      //TODO flag orders with a date greater than 6 months in advance
      order.weddingDate = new Date(rec['WEDDING DATE']);

      if (rec.BRIDE && !/^n\/?a$/i.test(rec.BRIDE.trim())) {
        order.bride = rec.BRIDE;
      }

      var shipTo = order.shipTo[0];
      // if (!order.shipTo || !order.shipTo[0]) {
      //   order.shipTo = [];
      //   order.shipTo.push(new Address());
      //   shipTo = order.shipTo[0];
      // } else {
      //   shipTo = order.shipTo[0];
      // }

      shipTo.street = rec['SHIP TO ADDRESS'];
      shipTo.city = rec.CITY;
      shipTo.state = rec.STATE;
      shipTo.zipcode = makeNumber(rec.ZIP);
      // customer.markModified('orders.shipTo');

      var orderitem = new OrderItem();
      orderitem.style = rec.STYLE;

      //TODO flag orders that have no size
      if (/^\s*Size.*/i.test(rec.SIZE)) {
        orderitem.size = rec.SIZE.match(/(\d+)/g);
        if (parseInt(orderitem.size[orderitem.size.length - 1]) === 55) {
          orderitem.size[-1] = 'regular';
        } else if (parseInt(orderitem.size[orderitem.size.length - 1] === 59)) {
          orderitem.size[-1] = 'long';
        }
      }

      orderitem.color = rec.COLOR;
      orderitem.backup = /\S+/.test(rec['BACKUP?']);

      order.orderitems.push(orderitem);

      customer.save(cb);
    });
  };

  var Customer = mongoose.model('Customer', CustomerSchema);
  $module.exports = Customer;
  return Customer;
};

