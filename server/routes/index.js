'use strict';

module.exports = function $module(express) {
  if ($module.exports) {
    return $module.exports;
  }

  express = express || require('express');

  var router = express.Router();
  router.use('/', require('./home')());
  router.use('/errors', require('./errors')());
  router.use('/inventory', require('./inventory')());
  router.use('/manufacture', require('./manufacture')());
  router.use('/orders', require('./orders')());
  router.use('/users', require('./users')());
  router.use('/reservations', require('./reservations')());

  $module.exports = router;
  return router;
};
