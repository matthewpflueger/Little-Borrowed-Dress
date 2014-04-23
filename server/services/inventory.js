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


  function updateInventory(msg) {
    log.info('About to update inventory msg=%j', msg, msg.content.user);

    return query.findInventoryById(msg.content.inventory).then(function(i) {
      i.update(msg.content.data, msg.content.user);
      return nodefn.call(i.save.bind(i)).then(function(results) {
        return new cmds.InventoryUpdated(results[0], msg.content.user);
      });
    });
  }

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
    var user = msg.content.user;
    var rec = msg.content.data;

    log.info('Importing inventory from message=%s', corrId, user);

    var tagId = Inventory.makeTagId(rec['Tag ID']);
    rec['Tag ID'] = tagId;

    return query.findInventoryByTagId(rec['Tag ID']).then(function(i) {
          return new cmds.InventoryImported(304, 'Inventory already exists', i, user);
        }).catch(query.NotFoundError, function() {
          var i = new Inventory();
          i.import(rec);

          return nodefn.lift(i.save.bind(i))().then(function(results) {
            var i = results[0];
            log.info('Imported inventory=%, message=%s', i.tagId, corrId, user);
            log.debug('Imported inventory=%j', i, corrId, user);
            return new cmds.InventoryImported(201, 'Inventory created', i, user);
          });
        });
  }

  router.receive(cmds.UpdateInventory.routingKey, updateInventory);
  router.receive(cmds.ShipInventory.routingKey, shipInventory);
  router.receive(cmds.RequestManufactureInventory.routingKey, requestManufactureInventory);
  router.receive(cmds.ReserveInventory.routingKey, reserveInventory);
  router.receive(cmds.ReleaseInventory.routingKey, releaseInventory);
  router.receive(cmds.ImportInventory.routingKey, importInventory);

  $module.exports = {};
  return {};
};
