'use strict';

module.exports = function $module(when, nodefn, query, router, Customer, cmds, utils) {
  if ($module.exports) {
    return $module.exports;
  }

  when = when || require('when');
  nodefn = nodefn || require('when/node');

  query = query || require('./query')();
  router = router || require('../commands/router')();
  Customer = Customer || require('./models/Customer')();
  cmds = cmds || require('../commands/orderitem')();
  utils = utils || require('../utils')();



  function importOrderItems(msg) {
    var user = msg.content.user;
    log.info('Importing order item from msg=%j', msg, user);

    var rec = msg.content.data;

    function createResults(customer, order, orderitems, status, message) {
      log.debug(
        'Creating import result customer=%j, order=%j, orderitems=%j, status=%s, message=%s',
        customer, order, orderitems, status, message);

      order = order || customer.orders[0];
      orderitems = orderitems || order.orderitems;
      status = status || 201;
      message = message || 'Order items created';
      return new cmds.OrderItemsImported(status, message, customer, order, orderitems, user);
    }

    function newCustomer() {
      log.info('Creating new customer from msg=%j', msg, user);
      var customer = new Customer();
      customer.import(rec, user);
      return createResults(customer);
    }

    function newOrder(customer) {
      var order = customer.findOrderByNumber(rec['Order #']);
      if (order) {
        return newOrderItems(customer, order);
      }

      log.info('Creating new order from msg=%j', msg, user);
      order = customer.orders.create({});
      order.import(rec, user);
      customer.orders.push(order);
      return createResults(customer, order);
    }

    function newOrderItems(customer, order) {
      log.info('Creating new order items for customer=%j, order=%j, msg=%j', customer, order, msg, user);
      var numOrderItems = order.orderitems.length;
      var orderitems = order.importOrderItems(rec, user);
      if (numOrderItems === order.orderitems.length) {
        log.warn('No order items imported customer=%j, order=%j, msg=%j', customer, order, msg, user);
        return createResults(customer, order, orderitems, 304, 'No order items imported');
      }
      return createResults(customer, order, orderitems);
    }

    return query.findCustomerByEmail(rec['ACCOUNT Email'])
        .then(newOrder)
        .catch(query.NotFoundError, function() {
          var phone = utils.number.makeNumber(rec['BILLING Telephone #']);
          log.info('Customer not found by email, trying telephone=%s', phone, user);

          return query.findCustomerByPhone(phone).then(function(results) {
            if (results.length > 1) {
              log.error('Could not locate distince customer for import with telephone=%s, msg=%j', phone, msg, user);
              throw new Error('Could not locate distinct customer for import with telephone=%s', phone);
            }
            return newOrder(results[0]);
          }).catch(query.NotFoundError, newCustomer);
        }).then(function(r) {
          if (r.status !== 201) {
            return r;
          }
          return nodefn.lift(r.customer.save.bind(r.customer))().then(function() { return r; });
        });
  }

  router.receive(cmds.ImportOrderItems.routingKey, importOrderItems);

  $module.exports = {};
  return {};
};
