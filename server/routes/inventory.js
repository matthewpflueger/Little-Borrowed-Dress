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
  router.get('/', requiresLogin, inventoryController.all);
  router.post('/upload', requiresLogin, inventoryController.upload);
  router.get('/orderitem/:orderitem', requiresLogin, inventoryController.inventoryForOrderItem);
  router.post('/ship/:orderitem', requiresLogin, inventoryController.shipInventory);
  router.get('/manufacture', requiresLogin, inventoryController.inventoryForManufacture);
  router.post('/manufacture/:orderitem', requiresLogin, inventoryController.manufactureOrderItem);
  router.put('/:inventory', requiresLogin, inventoryController.update);

  router.param('inventory', params.inventory);
  router.param('orderitem', params.orderitem);

  $module.exports = router;
  return router;
};
