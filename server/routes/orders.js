'use strict';

module.exports = function $module(ordersController, requiresLogin, params, express) {
  if ($module.exports) {
    return $module.exports;
  }

  ordersController = ordersController || require('../controllers/orders')();
  requiresLogin = requiresLogin || require('./middleware/authorization')();
  params = params || require('./params')();
  express = express || require('express');

  var router = express.Router();

  router.get('/', requiresLogin, ordersController.all);
  router.post('/upload', requiresLogin, ordersController.upload);
  router.post('/:order/orderitem', requiresLogin, ordersController.order);
  router.put('/:customer', requiresLogin, ordersController.update);

  router.param('customer', params.customer);
  router.param('order', params.order);

  $module.exports = router;
  return router;
};
