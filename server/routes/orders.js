'use strict';

module.exports = function $module(customerController, requiresLogin, express) {
  if ($module.exports) {
    return $module.exports;
  }

  customerController = customerController || require('../controllers/customer')();
  requiresLogin = requiresLogin || require('./middleware/authorization')();
  express = express || require('express');

  var router = express.Router();
  router.post('/upload', requiresLogin, customerController.upload);

  $module.exports = router;
  return router;
};
