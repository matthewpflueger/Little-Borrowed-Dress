'use strict';

/**
 * Generic require login routing middleware
 */
module.exports = function() {
  return function(req, res, next) {
    if (!req.isAuthenticated()) {
      return res.send(401, 'User is not authorized');
    }
    next();
  };
};