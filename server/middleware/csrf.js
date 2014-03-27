'use strict';

module.exports = function $module(csurf) {
  if ($module.exports) {
    return $module.exports;
  }

  csurf = csurf || require('csurf');

  var csrf = csurf({ value: function(req) {
    return (req.body && req.body._csrf) ||
      (req.query && req.query._csrf)    ||
      (req.headers['x-csrf-token'])     ||
      (req.headers['x-xsrf-token'])     ||
      (req.cookies.get('XSRF-TOKEN'));
  }});

  $module.exports = csrf;
  return csrf;
};