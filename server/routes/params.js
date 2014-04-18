'use strict';

module.exports = function $module(_, utils, query) {
  if ($module.exports) {
    return $module.exports;
  }
  $module.exports = {};

  _ = _ || require('lodash');
  query = query || require('../services/query')();
  utils = utils || require('../utils')();

  function findById(method, props, req, res, next, id) {
    query[method](id).then(function(results) {
      log.info('Found method=%s, id=%s, props=%j, results=%j', method, id, props, results, req.user);
      props.forEach(function(p) {
        req[p] = results[p] || results;
      });
      next();
    }).catch(query.NotFoundError, function(e) {
      log.warn(e.toString(), req.user);
      res.send(404, utils.errors.makeError(e));
      next(e);
    }).catch(function(e) {
      log.error(e.toString(), req.user);
      res.send(500, utils.errors.makeError(e));
      next(e);
    });
  }

  $module.exports.customer = _.partial(findById, 'findCustomerById', ['customer']);
  $module.exports.order = _.partial(findById, 'findOrderById', ['customer', 'order']);
  $module.exports.orderitem = _.partial(findById, 'findOrderItemById', ['customer', 'order', 'orderitem']);
  $module.exports.inventory = _.partial(findById, 'findInventoryById', ['inventory']);

  return $module.exports;
};