'use strict';

module.exports = function $module(util, _, when, nodefn, Customer, Inventory) {
  if ($module.exports) {
    return $module.exports;
  }

  util = util || require('util');
  _ = _ || require('lodash');
  when = when || require('when');
  nodefn = nodefn || require('when/node');

  Customer = Customer || require('./models/Customer')();
  Inventory = Inventory || require('./models/Inventory')();


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

    var query = Customer.find();
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

  $module.exports = {
    NotFoundError: NotFoundError,
    findCustomerByPhone: findCustomerByPhone,
    findCustomerByEmail: findCustomerByEmail,
    findCustomerOrdersByDate: findCustomerOrdersByDate,
    findReservationByOrderItem: findReservationByOrderItem,
    findInventoryById: findInventoryById,
    findCustomerById: findCustomerById,
    findOrderById: findOrderById,
    findOrderItemById: findOrderItemById,
    findInventoryForOrderItemForDate: findInventoryForOrderItemForDate
  };
  return $module.exports;
};