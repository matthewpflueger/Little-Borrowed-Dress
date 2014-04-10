'use strict';

module.exports = function $module(when, nodefn, utils, Inventory) {
  if ($module.exports) {
    return $module.exports;
  }
  $module.exports = {};

  when = when || require('when');
  nodefn = nodefn || require('when/node');
  utils = utils || require('../utils')();
  Inventory = Inventory || require('../services/models/Inventory')();

  $module.exports.release = function(req, res) {
    var customer = req.customer;
    var order = req.order;
    var orderitem = req.orderitem;
    var inventory = req.inventory;

    log.info(
      'Releasing inventory=%j, orderitem=%j, order=%j, customer=%j',
      inventory, orderitem, order, customer, req.user);


    //FIXME need a two phase commit here :(
    if (inventory.release(customer, order, orderitem)) {
      orderitem.inventory = undefined;
      when.join(
          nodefn.lift(inventory.save.bind(inventory))(),
          nodefn.lift(customer.save.bind(customer))()
        ).then(function(results) {
          var i = results[0][0];
          var c = results[1][0];
          var o = c.findOrder(order);
          var oi = o.findOrderItem(orderitem);

          return res.json({
            availabilityStatus: i.availabilityStatus(o.forDate, oi),
            inventory: i.toJSON(),
            customer: c.toJSON(),
            order: o.toJSON(),
            orderitem: oi.toJSON()
          });
        }).catch(function(err) {
          log.error(
            'Failed to save reservation due to error=%s, inventory=%j, orderitem=%j, order=%j, customer=%j',
            err, inventory, orderitem, order, customer, req.user);
          return res.json(500, utils.errors.makeError(err, 'Inventory reservation failed'));
        });
    } else {
      log.info(
        'Reservation not available for inventory=%j, orderitem=%j, order=%j, customer=%j',
        inventory, orderitem, order, customer, req.user);
      return res.send(500, utils.errors.makeError('Reservation not available'));
    }
  };

  $module.exports.reserve = function(req, res) {
    var customer = req.customer;
    var order = req.order;
    var orderitem = req.orderitem;
    var inventory = req.inventory;

    log.info(
      'Reserving inventory=%j, orderitem=%j, order=%j, customer=%j',
      inventory, orderitem, order, customer, req.user);


    //FIXME need a two phase commit here :(
    if (inventory.reserve(customer, order, orderitem)) {
      orderitem.inventory = inventory._id;
      when.join(
          nodefn.lift(inventory.save.bind(inventory))(),
          nodefn.lift(customer.save.bind(customer))()
        ).then(function(results) {
          var i = results[0][0];
          var c = results[1][0];
          var o = c.findOrder(order);
          var oi = o.findOrderItem(orderitem);

          return res.json({
            availabilityStatus: i.availabilityStatus(o.forDate, oi),
            inventory: i.toJSON(),
            customer: c.toJSON(),
            order: o.toJSON(),
            orderitem: oi.toJSON()
          });
        }).catch(function(err) {
          log.error(
            'Failed to save reservation due to error=%s, inventory=%j, orderitem=%j, order=%j, customer=%j',
            err, inventory, orderitem, order, customer, req.user);
          return res.json(500, utils.errors.makeError(err, 'Inventory reservation failed'));
        });
    } else {
      log.info(
        'Reservation not available for inventory=%j, orderitem=%j, order=%j, customer=%j',
        inventory, orderitem, order, customer, req.user);
      return res.send(500, utils.errors.makeError('Reservation not available'));
    }
  };

  return $module.exports;
};
