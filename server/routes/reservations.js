'use strict';

module.exports = function $module(reservationsController, requiresLogin, params, express) {
  if ($module.exports) {
    return $module.exports;
  }

  reservationsController = reservationsController || require('../controllers/reservations')();
  requiresLogin = requiresLogin || require('./middleware/authorization')();
  params = params || require('./params')();
  express = express || require('express');

  var router = express.Router();

  router.post('/:orderitem/:inventory', requiresLogin, reservationsController.reserve);
  router.delete('/:orderitem/:inventory', requiresLogin, reservationsController.release);

  router.param('orderitem', params.orderitem);
  router.param('inventory', params.inventory);

  $module.exports = router;
  return router;
};
