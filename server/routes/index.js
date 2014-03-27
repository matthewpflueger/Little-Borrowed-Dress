'use strict';

module.exports = function $module(express) {
  if ($module.exports) {
    return $module.exports;
  }

  express = express || require('express');

  var router = express.Router();
  router.use('/', require('./home')());
  router.use('/inventory', require('./inventory')());
  router.use('/users', require('./users')());

  // routers.home = require('./home')();
  // app.get('/', require('../controllers/home'));
  // app.use('/inventory', require('./inventory')());
  // app.use('/users', require('./users')());
  // require('./home')(app);
  // require('./inventory')(app);
  // require('./users')(app);

  // function router(app) {
    // app.get('/', IndexController || require('../controllers/index'));
  // }

  $module.exports = router;
  return router;
};
