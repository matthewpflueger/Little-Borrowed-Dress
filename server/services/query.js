'use strict';

module.exports = function $module(_, Customer, Inventory) {
  if ($module.exports) {
    return $module.exports;
  }
  $module.exports = {};

  _ = _ || require('lodash');
  Customer = Customer || require('./models/Customer')();
  Inventory = Inventory || require('./models/Inventory')();

  $module.exports.findInventoryById = function(id, cb) {
    log.info('Loading inventory=%s', id);
    Inventory.findOne({ _id: id }).exec(function(err, results) {
      if (err) {
        return cb(err);
      }
      if (!results) {
        return cb(null, false);
      }
      cb(null, { inventory: results });
    });
  };

  $module.exports.findCustomerById = function(id, cb) {
    log.info('Loading customer=%s', id);
    Customer.findOne({ _id: id }).exec(function(err, customer) {
      if (err) {
        return cb(err);
      }
      if (!customer) {
        return cb(null, false);
      }
      cb(null, { customer: customer });
    });
  };

  $module.exports.findOrderById = function(id, cb) {
    log.info('Loading order=%s', id);
    Customer.findOne({ 'orders._id': id }).exec(function(err, customer) {
      if (err) {
        return cb(err);
      }

      if (!customer) {
        return cb(null, false);
      }

      log.info('Found customer=%j, order=%s', customer, id, {});
      var result = {};
      result.customer = customer;

      //FIXME just horrible - need I say more...
      var found = false;
      _.forEach(customer.orders, function(o) {
        log.info('Inspecting order=%j', o, {});
        if (o.id === id) {
          log.info('Found order=%s', id);
          result.order = o;
          found = true;
          return false;
        }

        if (found) {
          return false;
        }
      });

      if (!found) {
        return cb(null, false);
      }
      cb(null, result);
    });
  };

  $module.exports.findOrderItemById = function(id, cb) {
    log.info('Loading orderitem=%s', id);
    Customer.findOne({ 'orders.orderitems._id': id }).exec(function(err, customer) {
      if (err) {
        return cb(err);
      }

      if (!customer) {
        return cb(null, false);
      }

      log.info('Found customer=%j, orderitem=%s', customer, id, {});
      var result = {};
      result.customer = customer;

      //FIXME just horrible - need I say more...
      var found = false;
      _.forEach(customer.orders, function(o) {
        _.forEach(o.orderitems, function(oi) {
          log.info('Inspecting orderitem=%j', oi, {});
          if (oi.id === id) {
            log.info('Found orderitem=%s', id);
            result.orderitem = oi;
            result.order = o;
            found = true;
            return false;
          }
        });

        if (found) {
          return false;
        }
      });

      if (!found) {
        return cb(null, false);
      }
      cb(null, result);
    });
  };

  return $module.exports;
};