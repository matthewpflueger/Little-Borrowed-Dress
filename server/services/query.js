'use strict';

module.exports = function $module(util, _, when, nodefn, Customer, Inventory, Sequence) {
  if ($module.exports) {
    return $module.exports;
  }

  util = util || require('util');
  _ = _ || require('lodash');
  when = when || require('when');
  nodefn = nodefn || require('when/node');

  Customer = Customer || require('./models/Customer')();
  Inventory = Inventory || require('./models/Inventory')();
  Sequence = Sequence || require('./models/Sequence')();


  function check(promise, message) {
    return promise.then(function(r) {
      if (!r || r.length === 0) {
        throw new NotFoundError(message);
      }
      return r;
    }).timeout(5000);
  }


  function NotFoundError(message) {
    this.message = message;
  }
  util.inherits(NotFoundError, Error);

  function nextSeq(name) {
    return check(
        nodefn.lift(Sequence.findOneAndUpdate.bind(Sequence))(
          { name: name }, { $inc: { seq: 1 }}),
        'Sequence not found with name ' + name).then(function(r) { return r.seq; });
  }

  function findInventoryByTagId(tagId) {
    return check(
        nodefn.lift(Inventory.findOne.bind(Inventory))({ tagId: tagId }),
        'Inventory not found with tag id ' + tagId);
  }

  function findInventoryById(id) {
    return check(
        nodefn.lift(Inventory.findOne.bind(Inventory))({ _id: id }),
        'Inventory not found with id ' + id);
  }

  function findCustomerByPhone(phone) {
    return check(
        nodefn.lift(Customer.find.bind(Customer))({ telephone: phone }),
        'Customer not found with phone ' + phone);
  }

  function findCustomerByEmail(email) {
    return check(
        nodefn.lift(Customer.findOne.bind(Customer))({ email: email }),
        'Customer not found with email ' + email);
  }

  function findCustomerById(id) {
    return check(
        nodefn.lift(Customer.findOne.bind(Customer))({ _id: id }),
        'Customer not found with id ' + id);
  }

  function findOrderById(id) {
    return check(
          nodefn.lift(Customer.findOne.bind(Customer))({ 'orders._id': id }),
          'Not found order with id ' + id).then(function(customer) {
      return customer.findOrder(id);
    });
  }

  function findOrderItemById(id) {
    return check(
          nodefn.lift(Customer.findOne.bind(Customer))({ 'orders.orderitems._id': id }),
          'Not found order item with id ' + id).then(function(customer) {
      return customer.findOrderItem(id);
    });
  }

  function findReservationByOrderItem(orderitem) {
    orderitem = orderitem._id || orderitem;
    return check(
          nodefn.lift(Inventory.findOne.bind(Inventory))({ 'reservations.orderitem': orderitem }),
          'Not found reservation for order item ' + orderitem);
  }

  function findCustomerOrdersByDate(limitBy) { //forDate, limitTo) {
    limitBy = limitBy || {};
    log.debug('Searching for customer orders limitBy=%j', limitBy, {});

    var query = Customer.find();

    if (limitBy.name) {
      query = query.where('name', new RegExp(limitBy.name, 'i'));
    }
    if (limitBy.email) {
      query = query.where('email', new RegExp(limitBy.email, 'i'));
    }
    if (parseInt(limitBy.phone)) {
      query = query.where('telephone').equals(parseInt(limitBy.phone));
    }

    if (!limitBy.allocated || limitBy.allocated === 'false') {
      query = query.where('orders.orderitems.inventory').equals(null);
    }
    if (limitBy.style) {
      query = query.where('orders.orderitems.itemDescription.style', new RegExp(limitBy.style, 'i'));
    }
    if (limitBy.color) {
      query = query.where('orders.orderitems.itemDescription.color', new RegExp(limitBy.color, 'i'));
    }
    if (limitBy.size && limitBy.size.length > 0) {
      log.debug('Limiting by size=%j', limitBy.size, {});
      query = query.where('orders.orderitems.itemDescription.size').all(limitBy.size);
    }
    if (limitBy.ordersForDate) {
      query = query.where('orders.forDate');
      if (limitBy.inclusive === 'true' || limitBy.inclusive === true) {
        query = query.lte(limitBy.ordersForDate);
      } else {
        query = query.lt(limitBy.ordersForDate);
      }
    }

    query = query.sort('-orders.forDate').limit(limitBy.limitTo || 25);

    return check(nodefn.lift(query.exec.bind(query))(), 'No customer orders found');
  }

  function findInventoryReservationsForDate(limitBy) {
    limitBy = limitBy || {};
    log.debug('Limiting by limitBy=%j', limitBy, {});

    var query = Inventory.find();

    if (limitBy.style) {
      query = query.where('itemDescription.style', new RegExp(limitBy.style, 'i'));
    }
    if (limitBy.color) {
      query = query.where('itemDescription.color', new RegExp(limitBy.color, 'i'));
    }
    if (limitBy.size && limitBy.size.length > 0) {
      log.debug('Limiting by size=%j', limitBy.size, {});
      query = query.where('itemDescription.size').all(limitBy.size);
    }

    if (limitBy.inventoryForDate) {
      query = query.where('reservations.forDate');
      if (limitBy.inclusive === 'true' || limitBy.inclusive === true) {
        query = query.lte(limitBy.inventoryForDate);
      } else {
        query = query.lt(limitBy.inventoryForDate);
      }
    }

    if (limitBy.createdOn) {
      query = query.where('createdOn');
      if (limitBy.inclusive === 'true' || limitBy.inclusive === true) {
        query = query.lte(limitBy.createdOn);
      } else {
        query = query.lt(limitBy.createdOn);
      }
    }

    query = query.sort('-reservations.date -createdOn').limit(limitBy.limitTo || 25);

    return check(nodefn.lift(query.exec.bind(query))(), 'No inventory found');
  }

  /**
   * For the given order item, find matching inventory using the order item's style, color,
   * and size.  We also determine the availability of the matching inventory on the given date.
   *
   * @param  {OrderItem} orderitem the order item to find inventory for
   * @param  {Date} forDate   the date the inventory is needed for
   * @param  {[type]} limitBy   limit by style, color, size (some or all can be used to limit the results)
   * @return {Array[Object]}    list of inventory that matches
   */
  function findInventoryForOrderItemForDate(orderitem, forDate, limitBy) {
    limitBy = limitBy || { style: true, color: true, size: true};
    log.info(
      'Querying inventory for orderitem=%j, forDate=%s, style=%s, color=%s, size=%s',
      orderitem, forDate, limitBy.style, limitBy.color, limitBy.size, {});

    var params = {};

    if (limitBy.style === 'true' || limitBy.style === true) {
      params['itemDescription.style'] = orderitem.itemDescription[0].style;
    }
    if (limitBy.color === 'true' || limitBy.color === true) {
      params['itemDescription.color'] = orderitem.itemDescription[0].color;
    }
    if (limitBy.size === 'true' || limitBy.size === true) {
      //don't do exact matches on size as this is often too restrictive...
      params['itemDescription.size'] = orderitem.itemDescription[0].size[0];
    }

    if (!Object.keys(params)) {
      //always filter by something...
      params['itemDescription.style'] = orderitem.itemDescription[0].style;
      params['itemDescription.color'] = orderitem.itemDescription[0].color;
      params['itemDescription.size'] = orderitem.itemDescription[0].size;
    }

    log.info('Query inventory params=%j', params, {});


    //if the order item has assigned inventory then lets fetch it
    //and make sure it gets returned in the results...
    var assignedInventoryPromise = null;
    if (orderitem.inventory) {
      assignedInventoryPromise = findInventoryById(orderitem.inventory)
          .then(function(i) {
            return {
              inventory: i,
              reservation: i.reservationFor(orderitem)
            };
          })
          .catch(function(e) {
            log.error('Could not find assigned inventory for orderitem=%j, error=%s', orderitem, e, {});
            return {};
          });
    } else {
      assignedInventoryPromise = when({});
    }

    var inventoryQueryPromise = check(
          nodefn.lift(Inventory.find.bind(Inventory))(params),
          'No matching inventory found').then(function(results) {
      return _.map(results, function(r) {
        return {
          availabilityStatus: r.availabilityStatus(forDate, orderitem),
          inventory: r
        };
      });
    }).catch(NotFoundError, function() {
      return [];
    }).catch(function(e) {
      log.error('Unexpected error finding matching inventory for orderitem=%j, error=%s', orderitem, e, {});
      return [];
    });

    return when.join(assignedInventoryPromise, inventoryQueryPromise).then(function(results) {
      results[0].inventories = results[1];
      return results[0];
    });
  }

  function findInventoryForManufacture(limitBy) {
    limitBy = limitBy || {};
    log.debug('Limiting by limitBy=%j', limitBy, {});

    var query = Inventory.find({ 'manufacturedOn': null });

    if (limitBy.hideSent === 'true' || limitBy.hideSent === true) {
      query = query.find({ 'manufactureSentOn': null});
    }

    if (limitBy.inventoryForDate) {
      query = query.where('reservations.forDate');
      if (limitBy.inclusive === 'true' || limitBy.inclusive === true) {
        query = query.lte(limitBy.inventoryForDate);
      } else {
        query = query.lt(limitBy.inventoryForDate);
      }
    }

    if (limitBy.createdOn) {
      query = query.where('createdOn');
      if (limitBy.inclusive === 'true' || limitBy.inclusive === true) {
        query = query.lte(limitBy.createdOn);
      } else {
        query = query.lt(limitBy.createdOn);
      }
    }

    query = query.sort('-reservations.date -createdOn').limit(limitBy.limitTo || 25);

    return check(nodefn.lift(query.exec.bind(query))(), 'No inventory to manufacture found');
  }


  $module.exports = {
    NotFoundError: NotFoundError,
    nextSeq: nextSeq,
    findCustomerByPhone: findCustomerByPhone,
    findCustomerByEmail: findCustomerByEmail,
    findCustomerOrdersByDate: findCustomerOrdersByDate,
    findReservationByOrderItem: findReservationByOrderItem,
    findInventoryById: findInventoryById,
    findInventoryByTagId: findInventoryByTagId,
    findCustomerById: findCustomerById,
    findOrderById: findOrderById,
    findOrderItemById: findOrderItemById,
    findInventoryReservationsForDate: findInventoryReservationsForDate,
    findInventoryForOrderItemForDate: findInventoryForOrderItemForDate,
    findInventoryForManufacture: findInventoryForManufacture
  };
  return $module.exports;
};