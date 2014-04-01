'use strict';

module.exports = function $module(router, Customer, cmds, utils) {
  if ($module.exports) {
    return $module.exports;
  }

  router = router || require('../commands/router')();
  Customer = Customer || require('./models/customers')();
  cmds = cmds || require('../commands/orderitem')();
  utils = utils || require('../utils')();


  function importOrderItem(msg) {
    log.info('Importing order item from message=%s', msg.properties.correlationId);
    log.info('Importing order item from message=%j', msg, {});

    var rec = msg.content.data;
    Customer.findOne({ email: rec.EMAIL.trim() }, function(err, customer) {
      if (err) {
        log.error('Error finding customer=%s, error=%s', rec.EMAIL, err);
        router.reply(msg, utils.errors.makeError(err));
        return;
      }

      var orderitem = null;
      if (!customer) {
        log.info('Creating new customer=%s', rec.EMAIL);
        customer = new Customer();
        orderitem = customer.import(rec);
      } else {
        log.info('utils is ', utils);
        var orderNumber = utils.number.makeNumber(rec.ORDER);
        var order = customer.orders.filter(function(o) { return o.orderNumber === orderNumber; });

        if (!order.length) {
          log.info('Creating new order=%s, customer=%s', orderNumber, customer.email);
          order = customer.orders.create({});
          customer.orders.push(order);
          orderitem = order.import(rec);
        } else {
          log.info('Found order=%s, customer=%s', order[0].orderNumber, customer.email);
          orderitem = order[0].importOrderItem(rec);
        }
      }

      if (orderitem) {
        customer.save(function(err, c) {
          if (err) {
            log.error('Error saving customer=%s, error=%s', customer.email, err);
            router.reply(msg, utils.errors.makeError(err));
          } else {
            router.reply(msg, new cmds.ImportOrderItemResponse(201, 'Order item created', c));
          }
        });
      } else {
        router.reply(msg, new cmds.ImportOrderItemResponse(304, 'Order item already exists', customer));
      }
    });
  }

  router.receive(cmds.ImportOrderItem.routingKey, importOrderItem);

  $module.exports = {};
  return {};
};
