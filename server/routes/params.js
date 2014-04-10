'use strict';

module.exports = function $module(_, utils, queryService) {
  if ($module.exports) {
    return $module.exports;
  }
  $module.exports = {};

  _ = _ || require('lodash');
  queryService = queryService || require('../services/query')();
  utils = utils || require('../utils')();

  function findById(query, message, props, req, res, next, id) {
    var msg = message + id;
    queryService[query](id, function(err, results) {
      if (err) {
        log.error(msg, req.user);
        res.send(500, utils.errors.makeError(err, msg));
        return next(err);
      }
      if (!results) {
        log.warn(msg, req.user);
        res.send(404, utils.errors.makeError(msg));
        return next(new Error(msg));
      }
      props.forEach(function(p) {
        req[p] = results[p];
      });
      next();
    });
  }

  $module.exports.customer = _.partial(
    findById,
    'findCustomerById',
    'Failed to find customer=',
    ['customer']);

  $module.exports.order = _.partial(
    findById,
    'findOrderById',
    'Failed to find order=',
    ['customer', 'order']);

  $module.exports.orderitem = _.partial(
    findById,
    'findOrderItemById',
    'Failed to find orderitem=',
    ['customer', 'order', 'orderitem']);

  $module.exports.inventory = _.partial(
    findById,
    'findInventoryById',
    'Failed to find inventory=',
    ['inventory']);

  // // $module.exports.customer = function(req, res, next, id) {
  // //   findById(req, next, id, 'findCustomerById', 'Failed to find customer=' + id, ['customer');
  // //   queryService.findCustomerById(id, function(err, results) {
  // //     if (err) {
  // //       log.error('Failed to find customer=%s', id, req.user);
  // //       return next(err);
  // //     }
  // //     if (!results) {
  // //       log.error('Failed to find customer=%s', id, req.user);
  // //       return next(new Error('Failed to find customer=' + id));
  // //     }
  // //     req.customer = results;
  // //     next();
  // //   });
  // // };

  // $module.exports.orderitem = function(req, res, next, id) {
  //   queryService.findOrderItemById(id, function(err, results) {
  //     if (err) {
  //       log.error('Failed to find orderitem=%s', id, req.user);
  //       return next(err);
  //     }
  //     if (!results) {
  //       log.error('Failed to find orderitem=%s', id, req.user);
  //       return next(new Error('Failed to find orderitem=' + id));
  //     }
  //     req.customer = results.customer;
  //     req.order = results.order;
  //     req.orderitem = results.orderitem;
  //     next();
  //   });
  // };

  return $module.exports;
};