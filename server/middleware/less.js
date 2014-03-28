'use strict';

module.exports = function $module(lessMiddleware, os, path) {
  if ($module.exports) {
    return $module.exports;
  }

  lessMiddleware = lessMiddleware || require('less-middleware');
  os = os || require('os');
  path = path || require('path');

  var less = lessMiddleware(conf.get('cssDirPath'), {
      dest: conf.get('tmpCssDirPath'),
      preprocess: {
        path: function(pathname) {
          return pathname.replace('/css', '');
        }
      }
    }, {
      paths: [
        path.join(conf.get('bootstrapPath'), 'dist', 'css'),
        // path.join(conf.get('bootstrapPath'), 'less'),
        // path.join(conf.get('ngGridPath'), 'src', 'less')
        conf.get('ngGridPath')
      ],
      dumpLineNumbers: true
    }, {
      compress: false,
    });

  $module.exports = less;
  return less;
};