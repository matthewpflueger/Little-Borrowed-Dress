'use strict';

module.exports = function $module(manufactureController, requiresLogin, params, express) {
  if ($module.exports) {
    return $module.exports;
  }

  manufactureController = manufactureController || require('../controllers/manufacture')();
  requiresLogin = requiresLogin || require('./middleware/authorization')();
  express = express || require('express');

  var router = express.Router();
  router.post('/', requiresLogin, manufactureController.sendToManufacturer);

  $module.exports = router;
  return router;
};
