'use strict';

module.exports = function(passport, LocalStrategy) {
  passport = passport || require('passport');
  LocalStrategy = LocalStrategy || require('passport-local').Strategy;

  var guest = {
    email: 'guest@littleborroweddress.com',
    name: 'Guest'
  };

  // Serialize the user email to push into the session
  passport.serializeUser(function(user, done) {
    done(null, user.email);
  });

  // Deserialize the user object based on a pre-serialized token which is the user email
  passport.deserializeUser(function(id, done) {
    if (id === guest.email) {
      done(null, guest);
    } else {
      throw new Error('Authentication and authorization not implemented');
    }
  });

  passport.use(new LocalStrategy({
      usernameField: 'email',
      passwordField: 'password'
    },
    function(email, password, done) {
      if (conf.get('restrictLoginDomain') && !/.*littleborroweddress\.com$/.test(email)) {
        return done(null, false, { message: 'Unknown user'});
      }

      log.info('Authorizing email=%s', email);
      log.info('guestAllowed=%s', conf.get('guestAllowed'));
      if (conf.get('guestAllowed') && conf.get('guestEmail') === email) {
        if (conf.get('guestPassword') === password) {
          return done(null, guest);
        } else {
          return done(null, false, { message: 'Invalid password' });
        }
      } else {
        throw new Error('Authentication and authorization not implemented');
      }
    }));

};
