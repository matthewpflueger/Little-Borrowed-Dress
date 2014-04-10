'use strict';

module.exports = function $module(inventoryController, requiresLogin, params, express) {
  if ($module.exports) {
    return $module.exports;
  }

  inventoryController = inventoryController || require('../controllers/inventory')();
  requiresLogin = requiresLogin || require('./middleware/authorization')();
  params = params || require('./params')();
  express = express || require('express');

  var router = express.Router();
  router.post('/upload', requiresLogin, inventoryController.upload);
  router.get('/orderitem/:orderitem', requiresLogin, inventoryController.inventoryForOrderitem);

  router.param('orderitem', params.orderitem);

  $module.exports = router;
  return router;
};
