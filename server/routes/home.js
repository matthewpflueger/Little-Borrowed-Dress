'use strict';

module.exports = function $module(homeController, express) {
  if ($module.exports) {
    return $module.exports;
  }

  homeController = homeController || require('../controllers/home')();
  express = express || require('express');

  var router = express.Router();

  router.get('/', homeController);

  $module.exports = router;
  return router;
};
