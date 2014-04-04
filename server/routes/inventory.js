'use strict';

module.exports = function $module(inventoryController, requiresLogin, express) {
  if ($module.exports) {
    return $module.exports;
  }

  inventoryController = inventoryController || require('../controllers/inventory')();
  requiresLogin = requiresLogin || require('./middleware/authorization')();
  express = express || require('express');

  var router = express.Router();
  router.post('/upload', requiresLogin, inventoryController.upload);
  router.get('/orderitem/:orderitemId', requiresLogin, inventoryController.inventoryForOrderitem);

  router.param('orderitemId', inventoryController.orderitem);

  $module.exports = router;
  return router;
};
