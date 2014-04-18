'use strict';

module.exports = function $module(when, nodefn, query, router, Inventory, cmds, utils) {
  if ($module.exports) {
    return $module.exports;
  }

  when = when || require('when');
  nodefn = nodefn || require('when/node');

  query = query || require('./query')();
  router = router || require('../commands/router')();
  Inventory = Inventory || require('./models/Inventory')();
  cmds = cmds || require('../commands/inventory')();
  utils = utils || require('../utils')();


  function shipInventory(msg) {
    log.info('About to ship inventory msg=%j', msg, msg.content.user);

    return when.join(
      query.findReservationByOrderItem(msg.content.orderitem),
      query.findOrderItemById(msg.content.orderitem)
    ).then(function(results) {
      log.info('Results=%j', results, msg.content.user);
      var i = results[0];
      var coi = results[1];

      coi.orderitem.ship(msg.content.user);
      i.shipForReservation(coi.orderitem, msg.content.user);

      log.info('About to save ship for inventory=%j, customer=%j', i, coi.customer, {});
      return when.join(
        nodefn.lift(i.save.bind(i))(),
        nodefn.lift(coi.customer.save.bind(coi.customer))()
      ).then(function(results) {
        log.info('Results=%j', results, msg.content.user);
        var i = results[0][0];
        var r = results[1][0].findOrderItem(coi.orderitem);

        return new cmds.InventoryShipped(
          i.availabilityStatus(r.order.forDate, r.orderitem),
          i,
          r.customer,
          r.order,
          r.orderitem);
      }).catch(function(e) {
        coi.orderitem.shippedOn = undefined;
        coi.orderitem.shippedBy = undefined;
        i.revertShipForReservation(coi.orderitem);

        coi.customer.save();
        i.save();
        throw e;
      });
    });
  }


  function requestManufactureInventory(msg) {
    log.info('About to request manufacture inventory msg=%j', msg, msg.content.user);

    return query.findOrderItemById(msg.content.orderitem).then(function(coi) {
      var i = Inventory.manufactureForOrderItem(coi.customer, coi.order, coi.orderitem);
      if (!coi.orderitem.assign(i)) {
        return { status: 412, message: 'Order item not assignable' };
      }

      return when.join(
        nodefn.lift(i.save.bind(i))(),
        nodefn.lift(coi.customer.save.bind(coi.customer))()
      ).then(function(results) {
        log.info('Results=%j', results, msg.content.user);
        var i = results[0][0];
        var r = results[1][0].findOrderItem(coi.orderitem);

        return new cmds.InventoryManufactureRequested(
          i.availabilityStatus(r.order.forDate, r.orderitem),
          i,
          r.customer,
          r.order,
          r.orderitem);
      }).catch(function(e) {
        coi.orderitem.unassign(i);
        coi.customer.save();
        i.remove();
        throw e;
      });
    });
  }

  function reserveInventory(msg) {
    log.info('About to reserveInventory msg=%j', msg, msg.content.user);

    return when.join(
      query.findInventoryById(msg.content.inventory),
      query.findOrderItemById(msg.content.orderitem)
    ).then(function(results) {
      var i = results[0];
      var coi = results[1];

      if (!coi.orderitem.assign(i)) {
        return { status: 412, message: 'Order item not assignable' };
      }
      if (!i.reserve(coi.customer, coi.order, coi.orderitem)) {
        coi.orderitem.unassign(i);
        return { status: 412, message: 'Inventory not reservable' };
      }

      log.info('About to save reservation for inventory=%j, customer=%j', i, coi.customer, {});
      return when.join(
        nodefn.lift(i.save.bind(i))(),
        nodefn.lift(coi.customer.save.bind(coi.customer))()
      ).then(function(results) {
        log.info('Results=%j', results, msg.content.user);
        var i = results[0][0];
        var r = results[1][0].findOrderItem(coi.orderitem);

        return new cmds.InventoryReserved(
          i.availabilityStatus(r.order.forDate, r.orderitem),
          i,
          r.customer,
          r.order,
          r.orderitem);
      }).catch(function(e) {
        coi.orderitem.unassign(i);
        i.release(coi.customer, coi.order, coi.orderitem);

        coi.customer.save();
        i.save();
        throw e;
      });
    });
  }

  function releaseInventory(msg) {
    log.info('About to releaseInventory msg=%j', msg, msg.content.user);

    return when.join(
      query.findInventoryById(msg.content.inventory),
      query.findOrderItemById(msg.content.orderitem)
    ).then(function(results) {
      var i = results[0];
      var coi = results[1];

      i.release(coi.customer, coi.order, coi.orderitem);
      coi.orderitem.unassign(i);

      log.info('About to save release for inventory=%j, customer=%j', i, coi.customer, {});
      return when.join(
        nodefn.lift(i.save.bind(i))(),
        nodefn.lift(coi.customer.save.bind(coi.customer))()
      ).then(function(results) {
        log.info('Results=%j', results, msg.content.user);
        var i = results[0][0];
        var r = results[1][0].findOrderItem(coi.orderitem);

        return new cmds.InventoryReleased(
          i.availabilityStatus(r.order.forDate, r.orderitem),
          i,
          r.customer,
          r.order,
          r.orderitem);
      });
    });
  }

  function importInventory(msg) {
    var corrId = msg.properties.correlationId;
    log.info('Importing inventory from message=%s', corrId);

    var rec = msg.content.data;
    var tagId = Inventory.makeTagId(rec['Tag ID']);
    rec['Tag ID'] = tagId;

    Inventory.findOne({ tagId: tagId }, function(err, inventory) {
      if (err) {
        log.error('Error finding inventory=%s, error=%s, message=%s', tagId, err, corrId);
        router.reply(msg, utils.errors.makeError(err));
        return;
      }

      if (!inventory) {
        inventory = new Inventory();
        inventory.import(rec);
        inventory.save(function(err, i) {
          if (err) {
            log.error('Error saving inventory=%s, error=%s, message=%s', inventory.tagId, err, corrId);
            router.reply(msg, utils.errors.makeError(err));
          } else {
            log.info('Imported inventory=%s, message=%s', inventory.tagId, corrId);
            var res = new cmds.InventoryImported(201, 'Inventory created', i);
            router.reply(msg, res);
            router.tell(res);
          }
        });
      } else {
        log.info('Already exists inventory=%s, message=%s', inventory.tagId, corrId);
        router.reply(msg, new cmds.InventoryImported(304, 'Inventory already exists', inventory));
      }
    });
  }

  router.receive(cmds.ShipInventory.routingKey, shipInventory);
  router.receive(cmds.RequestManufactureInventory.routingKey, requestManufactureInventory);
  router.receive(cmds.ReserveInventory.routingKey, reserveInventory);
  router.receive(cmds.ReleaseInventory.routingKey, releaseInventory);
  router.receive(cmds.ImportInventory.routingKey, importInventory);

  $module.exports = {};
  return {};
};
