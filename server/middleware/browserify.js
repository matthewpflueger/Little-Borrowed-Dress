'use strict';

module.exports = function $module(browserify, path) {
  if ($module.exports) {
    return $module.exports;
  }

  browserify = browserify || require('browserify-middleware');
  path = path || require('path');

  var fun = browserify(path.join(conf.get('clientPath'), conf.get('jsMain')));

  $module.exports = fun;
  return fun;
};