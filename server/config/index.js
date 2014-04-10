'use strict';

/**
 * Initializes the configuration.  After running this function there should be a conf object in
 * global scope.
 *
 * @param  {[type]} path  [description]
 * @param  {[type]} nconf [description]
 * @return {[type]}       [description]
 */
module.exports = function $module(os, path, nconf) {
  if ($module.exports) {
    return $module.exports;
  }

  os = os || require('os');
  path = path || require('path');
  nconf = nconf || require('nconf');

  process.env.NODE_ENV = process.env.NODE_ENV || 'development';

  var rootPath = path.normalize(__dirname + '/../..');

  nconf
    .argv()
    .env()
    .file(path.join(__dirname, 'env', process.env.NODE_ENV + '.json'))
    .defaults({
      'appName': 'Little Borrowed Dress',

      'console': {
        'enable': false,
        'colorize': true,
        'timestamp': true,
        'level': 'debug'
      },
      'file': {
        'enable': true,
        'filename': path.join(rootPath, 'logs', 'lbd.log'),
        'colorize': false,
        'timestamp': true,
        'json': true,
        'level': 'debug',
        'maxsize': 5242880,
        'maxFiles': 10
      },
      'logentries': {
        'enable': true,
        'token': '805cc5af-8388-4634-8781-60adbdf696c7',
        'level': 'debug',
        'timestamp': false
      },

      'db': 'mongodb://localhost/lbd',
      'amqp': 'amqp://localhost',
      'exchange': 'lbd',
      'port': 8000,
      'jsMain': '/js/app.js',
      'prettifyHtml': true,
      'cache': 'memory',
      'showStackError': true,
      'templateEngine': 'swig',
      'secret': '#Sy@zZoMU!m65KPbMZaGZ6QoGV0i^MR8',
      'rootPath': rootPath,
      'viewsPath': path.join(rootPath, 'server', 'views'),
      'clientPath': path.join(rootPath, 'client'),
      'bootstrapPath': path.join(rootPath, 'node_modules', 'bootstrap'),
      'ngGridPath': path.join(rootPath, 'node_modules', 'ng-grid'),
      'cssDirPath': path.join(rootPath, 'client', 'css'),
      'tmpCssDirPath': path.join(os.tmpDir(), 'css-cache')
    });

  global.conf = nconf;
  $module.exports = nconf;
};
