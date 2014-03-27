'use strict';


module.exports = function() {

  function UsersController() {}

  UsersController.signin = function(req, res) {
    res.render('users/signin', {
      title: 'Signin',
      message: req.flash('error')
    });
  };

  UsersController.signout = function(req, res) {
    req.logout();
    res.redirect('/');
  };

  UsersController.session = function(req, res) {
    res.redirect('/');
  };

  return UsersController;

};
