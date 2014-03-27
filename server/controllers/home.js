'use strict';

module.exports = function() {
  return function(req, res) {
    res.render('index', {
      user: req.user ? JSON.stringify(req.user) : 'null'
    });
  };
};
