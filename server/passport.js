'use strict';

module.exports = function(User, passport, LocalStrategy) {

  //FIXME - I hate referencing the model not via a service layer of some sort
  User = User || require('./services/models/User')();

  passport = passport || require('passport');
  LocalStrategy = LocalStrategy || require('passport-local').Strategy;

  // Serialize the user email to push into the session
  passport.serializeUser(function(user, done) {
    done(null, user.email);
  });

  // Deserialize the user object based on a pre-serialized token which is the user email
  passport.deserializeUser(function(email, done) {
    User.findByEmail(email, done);
  });

  passport.use(new LocalStrategy({
      usernameField: 'email',
      passwordField: 'password'
    },
    function(email, password, done) {
      User.validate(email, password, function(err, user) {
        if (err) {
          return done(null, false, { message: 'Invalid login' });
        } else {
          return done(null, user);
        }
      });
    }));

};
