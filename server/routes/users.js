'use strict';

module.exports = function $module(usersController, passport, express) {
  if ($module.exports) {
    return $module.exports;
  }

  usersController = usersController || require('../controllers/users')();
  passport = passport || require('passport');
  express = express || require('express');

  var router = express.Router();

  router
    .get('/signin', usersController.signin)
    .get('/signout', usersController.signout)
    .post('/session', passport.authenticate('local', {
      failureRedirect: '/signin',
      failureFlash: true
    }), usersController.session);

  $module.exports = router;
  return router;
};
