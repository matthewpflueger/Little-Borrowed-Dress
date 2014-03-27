'use strict';

module.exports = function $module() {
  if ($module.exports) {
    return $module.exports;
  }

  var xsrf = function(req, res, next) {
    res.cookies.set('XSRF-TOKEN', req.csrfToken());
    next();
  };

  $module.exports = xsrf;
  return xsrf;
};