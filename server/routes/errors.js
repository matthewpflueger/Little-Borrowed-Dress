'use strict';

module.exports = function $module(errorsController, express) {
  if ($module.exports) {
    return $module.exports;
  }

  errorsController = errorsController || require('../controllers/errors')();
  express = express || require('express');

  var router = express.Router();

  router.post('/', errorsController);

  $module.exports = router;
  return router;
};
