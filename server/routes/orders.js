'use strict';

module.exports = function $module(ordersController, requiresLogin, express) {
  if ($module.exports) {
    return $module.exports;
  }

  ordersController = ordersController || require('../controllers/orders')();
  requiresLogin = requiresLogin || require('./middleware/authorization')();
  express = express || require('express');

  var router = express.Router();

  router.get('/', requiresLogin, ordersController.all);
  router.put('/:orderId', requiresLogin, ordersController.update);
  router.post('/upload', requiresLogin, ordersController.upload);

  router.param('orderId', ordersController.order);

  $module.exports = router;
  return router;
};
