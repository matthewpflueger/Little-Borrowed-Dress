'use strict';

module.exports = function $module(router, Customer, cmds, utils) {
  if ($module.exports) {
    return $module.exports;
  }

  router = router || require('../commands/router')();
  Customer = Customer || require('./models/Customer')();
  cmds = cmds || require('../commands/orderitem')();
  utils = utils || require('../utils')();


  function importOrderItem(msg) {
    var corrId = msg.properties.correlationId;
    log.info('Importing order item from message=%s', corrId);

    var rec = msg.content.data;
    Customer.findOne({ email: rec.EMAIL.trim() }, function(err, customer) {
      if (err) {
        log.error('Error finding customer=%s, error=%s, message=%s', rec.EMAIL, err, corrId);
        router.reply(msg, utils.errors.makeError(err));
        return;
      }

      var numOrderItems = 0;
      var order = null;
      var orderitem = null;
      if (!customer) {
        log.info('Creating new customer=%s, message=%s', rec.EMAIL, corrId);
        customer = new Customer();
        orderitem = customer.import(rec);
        order = customer.orders[0];
      } else {
        var orderNumber = utils.number.makeNumber(rec.ORDER);
        var orders = customer.orders.filter(function(o) { return o.orderNumber === orderNumber; });

        if (!orders.length) {
          log.info('Creating new order=%s, customer=%s, message=%s', orderNumber, customer.email, corrId);
          order = customer.orders.create({});
          customer.orders.push(order);
          orderitem = order.import(rec);
        } else {
          order = orders[0];
          numOrderItems = order.orderitems.length;
          log.info('Found order=%s, customer=%s, message=%s', order.orderNumber, customer.email, corrId);
          orderitem = order.importOrderItem(rec);
        }
      }

      if (numOrderItems < order.orderitems.length) {
        customer.save(function(err, c) {
          if (err) {
            log.error('Error saving customer=%s, error=%s, message=%s', customer.email, err, corrId);
            router.reply(msg, utils.errors.makeError(err));
          } else {
            log.info(
              'Imported orderitem=%s, order=%s, customer=%s, message=%s',
              orderitem.hash,
              order.orderNumber,
              customer.email,
              corrId);
            var res = new cmds.OrderItemImported(201, 'Order item created', c, order, orderitem);
            router.reply(msg, res);
            router.tell(res);
          }
        });
      } else {
        log.info(
          'Already exists orderitem=%s, order=%s, customer=%s, message=%s',
          orderitem.hash,
          order.orderNumber,
          customer.email,
          corrId);
        router.reply(msg, new cmds.OrderItemImported(304, 'Order item already exists', customer, order, orderitem));
      }
    });
  }

  router.receive(cmds.ImportOrderItem.routingKey, importOrderItem);

  $module.exports = {};
  return {};
};
